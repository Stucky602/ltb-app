// backup_roundtrip.mjs — does a restore actually put back everything a backup
// took out?
//
// WHY THIS EXISTS
// The online ring is the only thing between Kevin and total loss, and until
// this file nothing verified that the two halves agreed. They did not. The
// `archiveHistory` field rode every backup payload from the day it was added
// and was NEVER read back by applyBackupPayload, so a restore silently reset
// the archive series counter to zero and, on a fresh device, left it there.
// That is the one field whose entire purpose is continuity, so losing it on
// restore defeated the feature rather than degrading it.
//
// It was found by hand in about two minutes by diffing the fields written into
// the payload against the `payload.*` reads in the restore. That diff is now
// TEST 3 below, so the next omission fails the build instead of waiting to be
// noticed.
//
// TEST 4 is the wider net: every *_KEY in config.js must be either round-tripped
// or on an explicit exclusion list WITH A REASON. Five keys were added to the
// payload by hand over time and each one was a chance to forget.

import { readFileSync } from 'node:fs';
import {
  FIXTURE_ALL_ORDERS, FIXTURE_JOURNAL, FIXTURE_REGULARS,
  FIXTURE_WEEK_DISHES, FIXTURE_WEEK_LEDGER, FIXTURE_CONTAINER_CONFIG,
} from './fixtures/state.mjs';

let failed = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failed++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}

// jsdom is not needed: utils.js picks localStorage at module scope, so a
// minimal stand-in installed before the import is enough and is far faster.
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

const { buildBackupPayload, applyBackupPayload } = await import('../src/backupRestore.js');

// ── 1. Every field written is read back ─────────────────────────────────────
const STATE = {
  orders: FIXTURE_ALL_ORDERS,
  shopping: [{ name: 'pork shoulder', got: false }],
  weekDishes: FIXTURE_WEEK_DISHES,
  regulars: FIXTURE_REGULARS,
  inventory: { queso_0: 3, chiliOil: 1 },
  ingredientsDb: [{ id: 'salt', name: 'Salt', current: 1.25, baseline: 1.2 }],
  costHistory: [{ t: Date.parse('2026-07-01'), id: 'salt', cost: 1.2 }],
  receiptAliases: { 'heb salt': { ingredientId: 'salt', seen: 3 } },
  auditLog: [{ id: 'a1', ts: '2026-07-20T00:00:00Z', target: 'app', field: 'x', from: 1, to: 2 }],
  pipelineJournal: { version: 1, entries: { 'Bo Ssam': ['note'] } },
  journal: FIXTURE_JOURNAL,
  containerConfig: FIXTURE_CONTAINER_CONFIG,
  weekLedger: FIXTURE_WEEK_LEDGER,
  copiesNote: 'two copies, fridge and phone',
  archiveHistory: [
    { generatedAt: '2026-07-01T00:00:00Z', entryCount: 12, dishCount: 4 },
    { generatedAt: '2026-07-20T00:00:00Z', entryCount: 31, dishCount: 9 },
  ],
  equipment: [
    { name: 'Anova sous vide', note: 'immersion circulator, holds a water bath to 0.1C' },
    { name: 'iSi siphon', note: 'the "siphon" the record keeps mentioning' },
  ],
  handledPending: { p1: 1721000000000 },
};

const payload = buildBackupPayload(STATE);

const restored = {};
const deps = {
  persistOrders: async (v) => { restored.orders = v; return { ok: true }; },
  setShopping: v => { restored.shopping = v; },
  setWeekDishes: v => { restored.weekDishes = v; },
  setRegulars: v => { restored.regulars = v; },
  setInventory: v => { restored.inventory = v; },
  setPipelineJournal: v => { restored.pipelineJournal = v; },
  setJournal: v => { restored.journal = v; },
  setCopiesNote: v => { restored.copiesNote = v; },
  setWeekLedger: v => { restored.weekLedger = v; },
  setContainerConfig: v => { restored.containerConfig = v; },
  setIngredientsDb: v => { restored.ingredientsDb = v; },
  setCostHistory: v => { restored.costHistory = v; },
  setReceiptAliases: v => { restored.receiptAliases = v; },
  setAuditLog: v => { restored.auditLog = v; },
  setArchiveHistory: v => { restored.archiveHistory = v; },
  setEquipment: v => { restored.equipment = v; },
  setError: () => {}, setExportMsg: () => {}, setNotice: () => {},
  handledPendingRef: { current: {} },
};

const ok = await applyBackupPayload(payload, deps);
check('a well-formed payload restores without bailing', ok === true);

// Scalars and counts, not deep equality: the restore legitimately normalizes
// some stores (journal, ledger, containers) and reconciles ingredients against
// the live seed, so demanding identity would pin the wrong thing.
check('orders round-trip', (restored.orders || []).length === FIXTURE_ALL_ORDERS.length);
check('shopping round-trips', (restored.shopping || []).length === 1);
check('weekDishes round-trip', (restored.weekDishes || []).length === FIXTURE_WEEK_DISHES.length);
check('regulars round-trip', (restored.regulars || []).length === FIXTURE_REGULARS.length);
check('inventory round-trips', restored.inventory && restored.inventory.queso_0 === 3);
check('receiptAliases round-trip', restored.receiptAliases && !!restored.receiptAliases['heb salt']);
check('copiesNote round-trips', restored.copiesNote === STATE.copiesNote);
check('pipelineJournal round-trips', restored.pipelineJournal && !!restored.pipelineJournal.entries);
check('journal round-trips', restored.journal && Array.isArray(restored.journal.entries));
check('weekLedger round-trips', !!restored.weekLedger);
check('containerConfig round-trips', !!restored.containerConfig);
check('ingredientsDb round-trips', Array.isArray(restored.ingredientsDb) && restored.ingredientsDb.length > 0);
check('costHistory round-trips', Array.isArray(restored.costHistory));
check('auditLog round-trips', Array.isArray(restored.auditLog) && restored.auditLog.length >= 1);
check('handledPending round-trips', deps.handledPendingRef.current.p1 === STATE.handledPending.p1);

check('equipment round-trips (it is typed by hand and held nowhere else)',
  Array.isArray(restored.equipment) && restored.equipment.length === 2,
  `got ${JSON.stringify(restored.equipment)}`);

// THE REGRESSION. This is the bug that shipped.
check('archiveHistory round-trips (the series counter survives a restore)',
  Array.isArray(restored.archiveHistory) && restored.archiveHistory.length === 2,
  `got ${JSON.stringify(restored.archiveHistory)}`);

// ── 2. A pre-history backup must not blank a good local history ─────────────
{
  const older = { ...payload };
  delete older.archiveHistory;
  const r2 = {};
  await applyBackupPayload(older, { ...deps, setArchiveHistory: v => { r2.archiveHistory = v; }, setEquipment: () => {} });
  check('restoring a backup taken before archiveHistory existed leaves it alone',
    r2.archiveHistory === undefined);
}

// ── 3. Static diff: every payload field has a restore path ──────────────────
// Reads the source rather than the runtime, so a field added to the builder
// and forgotten in the restore fails here even if no fixture covers it.
{
  const src = readFileSync('src/backupRestore.js', 'utf8');
  const builder = src.slice(src.indexOf('export function buildBackupPayload'));
  const built = new Set(
    [...builder.slice(0, builder.indexOf('\n}')).matchAll(/^\s{4}(\w+):/gm)].map(m => m[1]),
  );
  const read = new Set([...src.matchAll(/payload\.(\w+)/g)].map(m => m[1]));
  // `version` is the format tag and is checked by the worker, not restored.
  const EXEMPT = new Set(['version', 'exportedAt']);
  const orphans = [...built].filter(f => !read.has(f) && !EXEMPT.has(f));
  check('every field the backup writes is read back by the restore',
    orphans.length === 0, orphans.length ? `write-only: ${orphans.join(', ')}` : '');
}

// ── 4. Every storage key is accounted for ───────────────────────────────────
// The wider net. A new *_KEY in config.js must either ride the backup or be
// listed here with a reason, so the next store added cannot quietly sit outside
// the only thing protecting Kevin's data.
{
  // Two kinds of entry here. Most are genuinely NOT backed up and say why.
  // ORDERS_KEY is the exception: it IS backed up, but the write goes through
  // persistOrders, which owns the constant, so the name never appears in
  // backupRestore.js. Listing it keeps the check honest rather than loosening
  // the rule to "mentioned anywhere".
  const EXCLUDED = {
    ORDERS_KEY: 'BACKED UP — restored via persistOrders, which owns the constant',
    CHECKS_KEY: 'cook-day checkboxes, meaningless outside the week they belong to',
    DELIVER_CHECKS_KEY: 'same, delivery side',
    SEEN_ROWS_KEY: 'removed with the legacy CSV path',
    DISH_NOTES_KEY: 'migrated one-way into the journal at boot; the journal is backed up',
    FEEDBACK_KEY: 'per-dish tallies rebuild from worker KV on the next pull',
    LAST_SEEN_WEEK_KEY: 'a per-device banner flag, not data',
    MENU_FINGERPRINT_KEY: 'a per-device deploy marker, recomputed at boot',
    SW_VERSION_KEY: 'per-device service-worker bookkeeping',
    BACKUP_STATE_KEY: 'health of the backup ring itself; restoring it would be circular',
    VAPID_PUBLIC_KEY: 'not a storage key, a push credential',
    PENDING_KEY: 'the worker is the durable queue; pending re-syncs on the next poll',
    WEEK_NOTES_KEY: 'per-week scratch, superseded by the journal',
    WEEK_NOTICE_KEY: 'published to the worker, not device state',
    OMAKASE_TEMPLATES_KEY: 'derived from the registry at boot',
    OMAKASE_REG_QUEUE_KEY: 'a transient promotion queue',
    SCHEMA_VERSION_KEY: 'stamped by the migration guard, never restored from a payload',
  };
  const cfg = readFileSync('src/config.js', 'utf8');
  const keys = [...cfg.matchAll(/^export const ([A-Z0-9_]*KEY)\b/gm)].map(m => m[1]);
  const restoreSrc = readFileSync('src/backupRestore.js', 'utf8');
  const unaccounted = keys.filter(k => !restoreSrc.includes(k) && !(k in EXCLUDED));
  check(`all ${keys.length} storage keys are either backed up or explicitly excluded`,
    unaccounted.length === 0,
    unaccounted.length ? `unaccounted: ${unaccounted.join(', ')}` : '');
}

console.log(failed === 0 ? '\nBACKUP ROUND-TRIP: ALL PASS' : `\nBACKUP ROUND-TRIP: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
