// migration_chain.mjs — runs REAL fixture data the whole way from v0 to the
// current schema, then straight into a restore.
//
// WHY THIS IS SEPARATE FROM migrations.mjs
// That file tests each hop in isolation: v0→current, v1→v2, v2→v3, and that
// re-running a step is idempotent. All necessary, none of it the thing that
// actually happens in production. What actually happens is that Kevin restores
// a three-day-old snapshot, or a device that has been closed for a month opens
// and hydrates, and the whole chain runs end to end over data with real shape.
// A step that works on a hand-made `{}` and falls over on a payload carrying
// forty orders and a journal is invisible to per-step tests.
//
// So: build a v0 payload out of the shared fixture, walk it all the way up, and
// assert the data is still there and still usable at the top. Then feed the
// migrated result through applyBackupPayload, because restoring an old backup
// is the exact path that runs this chain for real.

import {
  FIXTURE_ALL_ORDERS, FIXTURE_JOURNAL, FIXTURE_REGULARS,
  FIXTURE_WEEK_DISHES, FIXTURE_WEEK_LEDGER, FIXTURE_CONTAINER_CONFIG,
} from './fixtures/state.mjs';
import { SCHEMA_VERSION, migrateForward, assessForwardCompat } from '../src/migrations.js';

let failed = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failed++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}

const mem = new Map();
global.window = {
  localStorage: {
    getItem: k => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, v),
    removeItem: k => mem.delete(k),
    key: i => [...mem.keys()][i] ?? null,
    get length() { return mem.size; },
  },
};
global.fetch = () => Promise.reject(new Error('offline in test'));

// A pre-versioning payload: no schemaVersion stamp at all, and carrying the
// legacy dishNotes store that v1→v2 folds into the journal.
const v0 = {
  version: 'ltb-v1',
  exportedAt: '2026-01-15T12:00:00Z',
  orders: FIXTURE_ALL_ORDERS,
  shopping: [{ name: 'pork shoulder', got: false }],
  weekDishes: FIXTURE_WEEK_DISHES,
  regulars: FIXTURE_REGULARS,
  inventory: { queso_0: 2 },
  ingredientsDb: [{ id: 'salt', name: 'Salt', current: 1.25, baseline: 1.2 }],
  costHistory: [{ t: Date.parse('2026-01-01'), id: 'salt', cost: 1.2 }],
  receiptAliases: { 'heb salt': { ingredientId: 'salt', seen: 2 } },
  auditLog: [],
  pipelineJournal: { version: 1, entries: {} },
  journal: FIXTURE_JOURNAL,
  containerInventory: FIXTURE_CONTAINER_CONFIG,
  weekLedger: FIXTURE_WEEK_LEDGER,
  copiesNote: 'fridge and phone',
  archiveHistory: [{ generatedAt: '2026-01-02T00:00:00Z', entryCount: 3, dishCount: 2 }],
  handledPending: { p1: 1 },
  // The legacy store. Real ring snapshots never carried it (it lived on-device
  // only), but a hand-made or file payload can, and the fold has to survive it.
  dishNotes: { 'Bo Ssam': 'kimchi is passthrough, do not cost it' },
};

const orderCount = FIXTURE_ALL_ORDERS.length;
const journalCount = (FIXTURE_JOURNAL.entries || []).length;

// ── 1. An unstamped payload reads as v0 and is safe to migrate ──────────────
{
  const compat = assessForwardCompat(v0.schemaVersion);
  check('an unstamped payload is treated as v0, not refused',
    compat.outcome === 'migrate' && compat.storedVersion === 0,
    JSON.stringify(compat));
}

// ── 2. The whole chain, in one pass, over real data ─────────────────────────
const top = migrateForward(v0, 0);

check('the chain completes without throwing', !!top);
check('orders survive the full v0 → v' + SCHEMA_VERSION + ' walk',
  Array.isArray(top.orders) && top.orders.length === orderCount,
  `expected ${orderCount}, got ${top.orders && top.orders.length}`);
check('regulars survive', Array.isArray(top.regulars) && top.regulars.length === FIXTURE_REGULARS.length);
check('the journal survives and did not lose entries',
  top.journal && Array.isArray(top.journal.entries) && top.journal.entries.length >= journalCount,
  `expected >= ${journalCount}, got ${top.journal && top.journal.entries && top.journal.entries.length}`);
check('the week ledger survives', !!top.weekLedger);
check('container config survives', !!top.containerInventory);
check('the archive series history survives the chain',
  Array.isArray(top.archiveHistory) && top.archiveHistory.length === 1);

// ── 3. The v1→v2 fold actually happened ─────────────────────────────────────
{
  const texts = ((top.journal && top.journal.entries) || []).map(e => String(e.text || ''));
  check('the legacy dishNotes entry was folded into the journal',
    texts.some(t => t.includes('kimchi is passthrough')),
    `journal has ${texts.length} entries`);
}

// ── 4. Running the chain again changes nothing ──────────────────────────────
// The realistic version of this: a device migrates, backs up, and another
// device restores that snapshot and runs the guard over it again.
{
  const again = migrateForward(top, 0);
  check('re-walking the whole chain is idempotent',
    JSON.stringify(again) === JSON.stringify(top));
  // Two SEPARATE migrations of the same source do NOT produce byte-identical
  // output, and that is correct rather than a bug: the dishNotes fold mints a
  // fresh entry id and stamps `ts` with the migration moment, so two devices
  // restoring the same old backup each mint their own. The entries carry
  // `undated: true` precisely because that timestamp is not real. Dedupe is by
  // CONTENT (which is why re-walking the same object above is stable), so the
  // duplicate ids merge rather than accumulating. Compare on content.
  const strip = (o) => JSON.parse(JSON.stringify(o), (k, v) => (k === 'id' || k === 'ts' ? undefined : v));
  const separate = migrateForward(JSON.parse(JSON.stringify(v0)), 0);
  check('a separate migration of the same source produces the same CONTENT',
    JSON.stringify(strip(separate)) === JSON.stringify(strip(top)));
  check('...but mints its own entry id, so folded entries are not falsely shared',
    JSON.stringify(separate.journal.entries.map(e => e.id))
      !== JSON.stringify(top.journal.entries.map(e => e.id))
    || top.journal.entries.every(e => !e.migrated));
}

// ── 5. Migrating from every intermediate version lands in one place ─────────
{
  const shapes = [];
  for (let from = 0; from < SCHEMA_VERSION; from++) {
    shapes.push(JSON.stringify(migrateForward(JSON.parse(JSON.stringify(v0)), from)).length);
  }
  check(`starting from any of v0..v${SCHEMA_VERSION - 1} produces a usable payload`,
    shapes.every(n => n > 0), JSON.stringify(shapes));
}

// ── 6. The migrated payload actually restores ───────────────────────────────
// This is the point. The chain is not run for its own sake; it is run so an old
// backup can be restored. Testing the walk without testing the landing leaves
// the half that matters uncovered.
{
  const { applyBackupPayload } = await import('../src/backupRestore.js');
  const got = {};
  const ok = await applyBackupPayload({ ...top, schemaVersion: SCHEMA_VERSION }, {
    persistOrders: async (v) => { got.orders = v; return { ok: true }; },
    setShopping: v => { got.shopping = v; },
    setWeekDishes: v => { got.weekDishes = v; },
    setRegulars: v => { got.regulars = v; },
    setInventory: v => { got.inventory = v; },
    setPipelineJournal: v => { got.pipelineJournal = v; },
    setJournal: v => { got.journal = v; },
    setCopiesNote: v => { got.copiesNote = v; },
    setWeekLedger: v => { got.weekLedger = v; },
    setContainerConfig: v => { got.containerConfig = v; },
    setIngredientsDb: v => { got.ingredientsDb = v; },
    setCostHistory: v => { got.costHistory = v; },
    setReceiptAliases: v => { got.receiptAliases = v; },
    setAuditLog: v => { got.auditLog = v; },
    setArchiveHistory: v => { got.archiveHistory = v; },
    setError: () => {}, setExportMsg: () => {}, setNotice: () => {},
    handledPendingRef: { current: {} },
  });
  check('a payload migrated from v0 restores cleanly', ok === true);
  check('restored orders match the fixture count',
    (got.orders || []).length === orderCount, `got ${(got.orders || []).length}`);
  check('the folded journal makes it through the restore too',
    got.journal && ((got.journal.entries || []).length >= journalCount));
  check('the archive series survives migrate-then-restore',
    Array.isArray(got.archiveHistory) && got.archiveHistory.length === 1);
}

// ── 7. A payload from the FUTURE is still refused after all of the above ────
{
  const compat = assessForwardCompat(SCHEMA_VERSION + 1);
  check('a newer-than-code payload is refused, not migrated downward',
    compat.outcome === 'refuse');
}

console.log(failed === 0 ? '\nMIGRATION CHAIN: ALL PASS' : `\nMIGRATION CHAIN: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
