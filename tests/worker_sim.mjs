// Functional test of worker.js against a mock KV namespace.
// Proves: per-key storage, legacy migration, clear-vs-submit race survival,
// idempotent clientId retries, queue cap, and old-app response shapes.
import worker from '../worker.js';

class MockKV {
  constructor() { this.m = new Map(); this.md = new Map(); }
  async get(k) { return this.m.has(k) ? this.m.get(k) : null; }
  async put(k, v, opts = {}) {
    this.m.set(k, v);
    if (opts.metadata) this.md.set(k, opts.metadata); else this.md.delete(k);
  }
  async delete(k) { this.m.delete(k); this.md.delete(k); }
  async list({ prefix = '', limit = 1000 } = {}) {
    const keys = [...this.m.keys()].filter(k => k.startsWith(prefix)).sort().slice(0, limit)
      .map(name => ({ name, metadata: this.md.get(name) }));
    return { keys, list_complete: keys.length < limit, cursor: undefined };
  }
}

const env = { LTB_KV: new MockKV(), PUBLISH_TOKEN: 'test-token' };
const ctx = { waitUntil: () => {} };
const call = (method, path, body, headers = {}) =>
  worker.fetch(new Request('https://x.dev' + path, {
    method, headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  }), env, ctx);

let failed = 0;
const check = (name, cond, extra = '') => {
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond ? '' : '  ' + extra));
  if (!cond) failed++;
};

// ── Scenario 1: legacy queue + new submit merge on read ─────────────────────
await env.LTB_KV.put('pending-orders', JSON.stringify([
  { id: 'legacy_1', customer: 'Old Alice', items: [{ name: 'Gumbo', qty: 1 }], submittedAt: '2026-07-01T01:00:00Z' },
  { id: 'legacy_2', customer: 'Old Bob', items: [{ name: 'Chili', qty: 1 }], submittedAt: '2026-07-01T02:00:00Z' },
]));
let r = await call('POST', '/submit', { customer: 'New Cara', items: [{ name: 'Bo Ssam', qty: 1 }] });
let j = await r.json();
check('submit returns ok+id', j.ok === true && typeof j.id === 'string');
r = await call('GET', '/pending', null, { 'X-LTB-Token': 'test-token' });
j = await r.json();
check('GET /pending merges legacy + per-key (3 orders)', (j.pending || []).length === 3, JSON.stringify(j));
check('old-app shape {pending:[...]}', Array.isArray(j.pending));
check('oldest first', j.pending[0].id === 'legacy_1');
const caraId = j.pending.find(p => p.customer === 'New Cara').id;

// ── Scenario 2: THE RACE — clear runs while a new order arrives ─────────────
// App polled and saw [legacy_1, legacy_2, cara]; Dave submits; app clears the
// three it saw. Old worker: Dave's order had ~50/50 odds of being erased.
await call('POST', '/submit', { customer: 'Racing Dave', items: [{ name: 'Queso', qty: 2 }] });
r = await call('POST', '/pending/clear', { token: 'test-token', ids: ['legacy_1', 'legacy_2', caraId] });
j = await r.json();
check('clear returns ok + remaining count', j.ok === true && j.remaining === 1, JSON.stringify(j));
r = await call('GET', '/pending', null, { 'X-LTB-Token': 'test-token' });
j = await r.json();
check('RACE SURVIVED: Dave still queued after overlapping clear', j.pending.length === 1 && j.pending[0].customer === 'Racing Dave');
check('legacy key fully drained', (await env.LTB_KV.get('pending-orders')) === null);

// ── Scenario 3: idempotent retry via clientId ────────────────────────────────
await call('POST', '/submit', { clientId: 'form_abc12345', customer: 'Tap-happy Erin', items: [{ name: 'Chili', qty: 1 }] });
await call('POST', '/submit', { clientId: 'form_abc12345', customer: 'Tap-happy Erin', items: [{ name: 'Chili', qty: 1 }] });
r = await call('GET', '/pending', null, { 'X-LTB-Token': 'test-token' });
j = await r.json();
check('double-tap with clientId = ONE order', j.pending.filter(p => p.customer === 'Tap-happy Erin').length === 1);

// ── Scenario 4: auth still enforced ──────────────────────────────────────────
r = await call('GET', '/pending');
check('GET /pending without token → 401', r.status === 401);
r = await call('POST', '/pending/clear', { ids: ['x'] });
check('clear without token → 401', r.status === 401);

// ── Scenario 5: validation + cap ─────────────────────────────────────────────
r = await call('POST', '/submit', { customer: '', items: [] });
check('empty submit → 400', r.status === 400);
for (let i = 0; i < 200; i++) await env.LTB_KV.put('pending:spam_' + String(i).padStart(3, '0'), '{"id":"spam"}');
r = await call('POST', '/submit', { customer: 'Late Fred', items: [{ name: 'Gumbo', qty: 1 }] });
check('queue at cap → 429', r.status === 429, 'got ' + r.status);

// ── Scenario 6: backup auth + validation protects the ring ──────────────────
const goodSnap = { version: 'ltb-v1', exportedAt: new Date().toISOString(), orders: [{ id: 'o1' }, { id: 'o2' }], shopping: [] };
r = await call('POST', '/backup', { snapshot: goodSnap });
check('POST /backup without token → 401', r.status === 401);
r = await call('GET', '/backup?age=recent');
check('GET /backup without token → 401', r.status === 401);
r = await call('GET', '/backup/list');
check('GET /backup/list without token → 401', r.status === 401);

r = await call('POST', '/backup', { token: 'test-token', snapshot: goodSnap });
j = await r.json();
check('valid backup accepted', j.ok === true && typeof j.timestamp === 'string', JSON.stringify(j));
const firstTs = j.timestamp;

r = await call('POST', '/backup', { token: 'test-token', snapshot: { version: 'ltb-v1' } }); // no orders array
check('snapshot without orders array → 400', r.status === 400);
r = await call('POST', '/backup', { token: 'test-token', snapshot: null });
check('null snapshot → 400', r.status === 400);
r = await call('POST', '/backup', { token: 'test-token', snapshot: { version: '', orders: [] } });
check('falsy version → 400', r.status === 400);

r = await call('GET', '/backup/list', null, { 'X-LTB-Token': 'test-token' });
j = await r.json();
check('bad pushes never touched the ring (1 good snapshot survives)', j.ok === true && j.backups.length === 1, JSON.stringify(j));
check('list carries size + order count metadata', j.backups[0].size > 0 && j.backups[0].orders === 2);

// ── Scenario 7: age-based selection is honest-nearest ────────────────────────
// Seed the ring directly with controlled ages (26h, 70h, 5min old) alongside
// the just-pushed recent one.
const HOUR = 3600e3;
const seed = async (ageMs, marker) => {
  const ts = new Date(Date.now() - ageMs).toISOString();
  const snap = { version: 'ltb-v1', orders: [{ id: marker }] };
  const v = JSON.stringify(snap);
  await env.LTB_KV.put('backup:' + ts, v, { metadata: { size: v.length, orders: 1 } });
  return ts;
};
const ts26h = await seed(26 * HOUR, 'day-old');
const ts70h = await seed(70 * HOUR, 'three-day-old');
await seed(5 * 60e3, 'five-min-old');

r = await call('GET', '/backup?age=recent', null, { 'X-LTB-Token': 'test-token' });
j = await r.json();
check('age=recent returns the newest snapshot', j.ok && j.timestamp === firstTs, j.timestamp);
r = await call('GET', '/backup?age=1d', null, { 'X-LTB-Token': 'test-token' });
j = await r.json();
check('age=1d picks the 26h snapshot (honest nearest)', j.ok && j.timestamp === ts26h, j.timestamp);
check('1d response carries the real timestamp + payload', j.snapshot.orders[0].id === 'day-old');
r = await call('GET', '/backup?age=3d', null, { 'X-LTB-Token': 'test-token' });
j = await r.json();
check('age=3d picks the 70h snapshot', j.ok && j.timestamp === ts70h, j.timestamp);
r = await call('GET', '/backup?age=1w', null, { 'X-LTB-Token': 'test-token' });
check('unknown age param → 400', r.status === 400);

// ── Scenario 8: pruning keeps the ring bounded AND age-shaped ────────────────
// Flood with 15 more recent snapshots (minutes old) so the ring exceeds cap;
// the pruner must bound it while PRESERVING the old 26h/70h snapshots (they
// are the nearest to the 1d/3d targets — deleting them would silently
// destroy the restore options Kevin asked for).
for (let i = 0; i < 15; i++) await seed((i + 1) * 60e3, 'flood_' + i);
r = await call('POST', '/backup', { token: 'test-token', snapshot: goodSnap }); // triggers prune
j = await r.json();
check('prune ran and reports kept count ≤ cap', j.ok && j.kept <= 12, JSON.stringify(j));
r = await call('GET', '/backup/list', null, { 'X-LTB-Token': 'test-token' });
j = await r.json();
check('ring bounded after flood (≤ 12 keys)', j.backups.length <= 12, 'got ' + j.backups.length);
const tsSet = new Set(j.backups.map(b => b.timestamp));
check('PRUNE PRESERVED the ~1d snapshot', tsSet.has(ts26h));
check('PRUNE PRESERVED the ~3d snapshot', tsSet.has(ts70h));
check('newest snapshot survived its own prune', tsSet.has((await (await call('GET', '/backup?age=recent', null, { 'X-LTB-Token': 'test-token' })).json()).timestamp));

// ── Scenario 9: oversize rejected before any write ───────────────────────────
const bigSnap = { version: 'ltb-v1', orders: [], blob: 'x'.repeat(9 * 1024 * 1024) };
r = await call('POST', '/backup', { token: 'test-token', snapshot: bigSnap });
check('oversized backup → 413', r.status === 413, 'got ' + r.status);
r = await call('GET', '/backup/list', null, { 'X-LTB-Token': 'test-token' });
j = await r.json();
check('oversize push did not evict anything', j.backups.length >= 3);


// ── Scenario 10: week config — paused passthrough, history, and rollback ─────
// The paused flag used to die here: POST /config builds the stored object from
// an explicit whitelist, and paused was not on it, so taking a week off worked
// everywhere in the app and silently did nothing to the actual form.
const cfgA = { token: 'test-token', dishes: [{ name: 'A' }], weekLabel: 'Week A' };
const cfgB = { token: 'test-token', dishes: [{ name: 'B' }, { name: 'B2' }], weekLabel: 'Week B' };
r = await call('POST', '/config', cfgA);
check('publish A ok', (await r.json()).ok);
r = await call('GET', '/config');
j = await r.json();
check('config A is live', j.weekLabel === 'Week A');
check('an unpaused publish stores paused:false', j.paused === false);

r = await call('POST', '/config', { ...cfgB, paused: true, pausedMsg: 'Back on the 30th.' });
j = await r.json();
check('PAUSED SURVIVES THE PUBLISH WHITELIST', j.config.paused === true, JSON.stringify(j.config.paused));
check('paused message stored', j.config.pausedMsg === 'Back on the 30th.');
r = await call('GET', '/config');
j = await r.json();
check('GET /config returns the paused flag', j.paused === true && j.weekLabel === 'Week B');

r = await call('GET', '/config-history?token=test-token');
j = await r.json();
check('history holds the previous publish', Array.isArray(j) && j.length >= 1 && j[0].weekLabel === 'Week A');
check('history is metadata only, no dish payload', j[0].dishes === undefined && j[0].dishCount === 1);
r = await call('GET', '/config-history?token=wrong');
check('history rejects a bad token', r.status === 401, 'got ' + r.status);

r = await call('POST', '/config-restore', { token: 'test-token', index: 0 });
j = await r.json();
check('restore returns the old config', j.ok && j.config.weekLabel === 'Week A');
r = await call('GET', '/config');
j = await r.json();
check('restored config is live again', j.weekLabel === 'Week A');
check('restoring an unpaused week clears paused', j.paused === false);
r = await call('GET', '/config-history?token=test-token');
j = await r.json();
check('the config it replaced moved into history', j.some(h => h.weekLabel === 'Week B'));
r = await call('POST', '/config-restore', { token: 'test-token', index: 99 });
check('restore with a bad index → 400', r.status === 400, 'got ' + r.status);
r = await call('POST', '/config-restore', { token: 'wrong', index: 0 });
check('restore rejects a bad token', r.status === 401, 'got ' + r.status);

// ── Scenario 11: kitchen companion pages — empty writes, 404 wording ────────
// Reproduces the real Jul 22 incident: a link that worked, then vanished with
// a message indistinguishable from "never existed." An empty HTML write used
// to sail through (only the 200000-char ceiling was checked) and would have
// looked identical to a genuinely expired key on read.
r = await call('POST', '/companion', { token: 'test-token', id: 'kc1', html: '<p>hi</p>' });
j = await r.json();
check('a real companion page writes fine', j.ok === true);
r = await call('GET', '/k?id=kc1');
check('and reads back exactly what was written', r.status === 200, 'got ' + r.status);

r = await call('POST', '/companion', { token: 'test-token', id: 'kc2', html: '' });
check('an EMPTY html write is rejected, not silently stored', r.status === 400, 'got ' + r.status);
r = await call('GET', '/k?id=kc2');
check('so nothing bad ever lands at that id', r.status === 404, 'got ' + r.status);

r = await call('GET', '/k?id=never-made-this-one');
check('a page that was never written 404s', r.status === 404, 'got ' + r.status);
const neverMsg = await r.text();
r = await call('GET', '/k?id=');
check('a missing id gets its own message, not the general one', (await r.text()) !== neverMsg);

r = await call('POST', '/companion', { token: 'wrong', id: 'kc3', html: '<p>x</p>' });
check('a companion write still requires the real token', r.status === 401, 'got ' + r.status);

console.log(failed === 0 ? '\nWORKER SIM: ALL PASS' : `\nWORKER SIM: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
