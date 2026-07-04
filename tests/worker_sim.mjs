// Functional test of worker.js against a mock KV namespace.
// Proves: per-key storage, legacy migration, clear-vs-submit race survival,
// idempotent clientId retries, queue cap, and old-app response shapes.
import worker from '../worker.js';

class MockKV {
  constructor() { this.m = new Map(); }
  async get(k) { return this.m.has(k) ? this.m.get(k) : null; }
  async put(k, v) { this.m.set(k, v); }
  async delete(k) { this.m.delete(k); }
  async list({ prefix = '', limit = 1000 } = {}) {
    const keys = [...this.m.keys()].filter(k => k.startsWith(prefix)).sort().slice(0, limit).map(name => ({ name }));
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

console.log(failed === 0 ? '\nWORKER SIM: ALL PASS' : `\nWORKER SIM: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
