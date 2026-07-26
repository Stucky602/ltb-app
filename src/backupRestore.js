// backupRestore.js — everything the app does to serialize itself out and read
// itself back in: the payload builder, the worker ring's three network calls,
// the restore-picker helpers, and the ONE shared restore body.
//
// WHY THIS IS ITS OWN MODULE
// This is the subsystem where a second code path is actively dangerous.
// applyBackupPayload is the single choke point that all four restore routes
// (online ring, file picker, clipboard paste, and the modal's own file input)
// funnel through, and the schema forward-compat guard lives inside it. While
// it sat inline in App.jsx as one useCallback among seventy-six, "add another
// restore path" and "add a second guard that drifts from the first" looked
// like the same edit. Behind one exported function they do not.
//
// NOTHING HERE CALLS A REACT HOOK, on purpose. State setters arrive as a deps
// bag so the caller keeps ownership of when and in what order state moves, and
// so this module can be read (and eventually tested) without a render. That
// also means extracting it changed no hook's position in App.jsx, which is the
// property that made this the safe first step of the decomposition.
//
// Importing journal.js here is deliberate and allowed: the backup payload has
// always carried the journal, so whatever applies a backup must normalize it.
// The privacy wall (tests/journal.mjs) scans CUSTOMER surfaces; this module is
// admin-only, reached solely from App.jsx.

import {
  WORKER_BASE, PUBLISH_TOKEN,
  SHOPPING_KEY, WEEK_KEY, REGULARS_KEY, INVENTORY_KEY, PIPELINE_JOURNAL_KEY,
  JOURNAL_KEY, COPIES_NOTE_KEY, WEEK_LEDGER_KEY, CONTAINER_INVENTORY_KEY,
  INGREDIENTS_KEY, COST_HISTORY_KEY, RECEIPT_ALIASES_KEY, HANDLED_PENDING_KEY,
  AUDIT_LOG_KEY, ARCHIVE_HISTORY_KEY, EQUIPMENT_KEY, REAL_DATA_EPOCH_KEY,
} from './config.js';
import { SCHEMA_VERSION, assessForwardCompat, migrateForward, REFUSE_MESSAGE } from './migrations.js';
import { saveJSON, stampItemCosts } from './utils.js';
import { normalizeJournal } from './journal.js';
import { normalizeLedger } from './weekLedger.js';
import { normalizeContainerConfig } from './containers.js';
import { reconcileIngredients, pruneCostHistory, summarizeReconcile } from './seedReconcile.js';
import { SOURCES, appendAudit, auditEntry, diffReconcile } from './auditLog.js';
import { INGREDIENT_SEED } from './ingredients.js';

// djb2 string hash — throttles auto-push (skip identical payloads). Not
// crypto, just cheap change detection.
export function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

// "26 hours ago" style honesty for the restore picker — never pretend a
// snapshot is exactly the age Kevin asked for.
export function relativeAge(iso) {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const mins = Math.round(ms / 60e3);
  if (mins < 2) return 'just now';
  if (mins < 90) return `${mins} minutes ago`;
  const hours = Math.round(ms / 3600e3);
  if (hours < 48) return `${hours} hours ago`;
  return `${Math.round(ms / 86400e3)} days ago`;
}

// The four approximate restore targets, resolved against the REAL list:
// each option shows the actual nearest snapshot's true age, and options
// that resolve to the same snapshot collapse into one (no fake choices).
export function resolveRestoreOptions(list) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const now = Date.now();
  const targets = [
    { age: 'recent', label: 'Most recent', ms: 0 },
    { age: '1h', label: 'About 1 hour ago', ms: 3600e3 },
    { age: '1d', label: 'About 1 day ago', ms: 24 * 3600e3 },
    { age: '3d', label: 'About 3 days ago', ms: 72 * 3600e3 },
  ];
  const seen = new Set();
  const options = [];
  for (const t of targets) {
    let best = null;
    let bestDiff = Infinity;
    for (const b of list) {
      const diff = Math.abs((now - Date.parse(b.timestamp)) - t.ms);
      if (diff < bestDiff) { bestDiff = diff; best = b; }
    }
    if (!best || seen.has(best.timestamp)) continue;
    seen.add(best.timestamp);
    options.push({ ...t, timestamp: best.timestamp, orders: best.orders });
  }
  return options;
}

// One builder for every path that serializes app data (clipboard copy, file
// download, auto-push). Shape unchanged from the v9.18 exportData — the worker
// validates version + orders on push, and restore validates the same fields,
// so old Notes-paste backups stay importable.
//
// KEY ORDER IS LOAD-BEARING. pushBackup hashes JSON.stringify of this object
// minus exportedAt to decide whether the ring already holds this exact data,
// and JSON.stringify follows insertion order. Reordering these lines changes
// every hash and defeats the throttle for a session. Append, don't rearrange.
export function buildBackupPayload(state) {
  return {
    version: 'ltb-v1',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    orders: state.orders || [],
    shopping: state.shopping,
    weekDishes: state.weekDishes,
    regulars: state.regulars,
    inventory: state.inventory,
    ingredientsDb: state.ingredientsDb,
    costHistory: state.costHistory,
    receiptAliases: state.receiptAliases,
    auditLog: state.auditLog,
    pipelineJournal: state.pipelineJournal,
    // The knowledge journal MUST ride the ring: it is the one store whose
    // loss is total (reasons live nowhere else — costs are on receipts,
    // orders are on the worker, but the whys are only here).
    journal: state.journal,
    containerInventory: state.containerConfig,
    weekLedger: state.weekLedger,
    copiesNote: state.copiesNote,
    archiveHistory: state.archiveHistory,
    // EC-3: the handled-pending ledger guards against a re-poll resurrecting an
    // order Kevin already accepted (when a worker clear failed). It lived only
    // on-device, so a restore blanked it and could resurrect. Ride the backup.
    // The equipment inventory. Typed in by hand, held nowhere else, and the
    // thing the archive's "equipment these assume" section is built from.
    equipment: state.equipment,
    // Confirmed once, by hand, from evidence. Recomputing it on another device
    // could land somewhere else, so it travels.
    realDataEpoch: state.realDataEpoch,
    handledPending: state.handledPending,
  };
}

// ── The ring's three network calls ──────────────────────────────────────────
// Thin on purpose. Each returns raw data and throws or reports failure the way
// its single caller already expected; the retry policy, the health flag, and
// every user-visible consequence stay with the caller in App.jsx.

// Returns true only on a confirmed 2xx. Never throws: the caller treats a
// thrown network error and a bad status identically (both mean "not backed
// up"), and swallowing here keeps that decision in one place.
export async function postBackupSnapshot(payload) {
  try {
    const res = await fetch(WORKER_BASE + '/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: PUBLISH_TOKEN, snapshot: payload }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Returns the array of ring entries, or the string 'error' when the ring is
// unreachable or answers with something unusable. The sentinel is not laziness:
// the modal renders three different states (loading, empty, unreachable) and
// an empty array must not be able to masquerade as a dead server.
export async function fetchBackupList() {
  try {
    const res = await fetch(WORKER_BASE + '/backup/list', { cache: 'no-store', headers: { 'X-LTB-Token': PUBLISH_TOKEN } });
    const j = await res.json();
    return res.ok && Array.isArray(j.backups) ? j.backups : 'error';
  } catch {
    return 'error';
  }
}

// Fetches one snapshot by approximate age. Returns the parsed body so the
// caller can read both snapshot and timestamp; throws on transport failure.
export async function fetchBackupSnapshot(age) {
  const res = await fetch(WORKER_BASE + '/backup?age=' + age, { cache: 'no-store', headers: { 'X-LTB-Token': PUBLISH_TOKEN } });
  const j = await res.json();
  return { ok: res.ok, body: j };
}

// ── Shared restore body ─────────────────────────────────────────────────────
// ONE implementation applied by all restore paths (file/paste/online) —
// previously importData and submitImport were 45-line twins, the exact
// "same logic in N places" footgun. Validation and any confirm dialog stay
// with the CALLER; this just applies a validated payload.
//
// `deps` carries the state setters plus persistOrders and the handled-pending
// ref. Passing them in rather than importing a store keeps the write order
// visible in one readable sequence, which matters here more than anywhere
// else in the app: orders are persisted FIRST and a failed write aborts the
// whole restore before anything else has moved.
export async function applyBackupPayload(payload, deps) {
  const {
    persistOrders, setShopping, setWeekDishes, setRegulars, setInventory,
    setPipelineJournal, setJournal, setCopiesNote, setWeekLedger,
    setContainerConfig, setIngredientsDb, setCostHistory, setReceiptAliases,
    setAuditLog, setArchiveHistory, setEquipment, setRealDataEpoch, setError, setExportMsg, setNotice, handledPendingRef,
  } = deps;

  // ── Schema forward-compat guard (v9.22) ─────────────────────────────
  // This is the REAL cross-device schema gap, not a service-worker cache:
  // Device A updates first and pushes a v2 snapshot into the shared ring.
  // Device B is still running old code (only understands v1) and restores
  // that same ring entry. Refuse before any write. An older snapshot is
  // safe — migrate it forward first.
  const snapVersion = payload && typeof payload.schemaVersion !== 'undefined' ? payload.schemaVersion : undefined;
  const compat = assessForwardCompat(snapVersion);
  if (compat.outcome === 'refuse') {
    setError(REFUSE_MESSAGE);
    return false;
  }
  const migrated = compat.outcome === 'migrate' ? migrateForward(payload, compat.storedVersion) : payload;
  payload = migrated;

  const res = await persistOrders((payload.orders || []).map(o => ({ ...o, items: stampItemCosts(o.items, 'backfilled') })));
  if (!res.ok) return false;
  if (Array.isArray(payload.shopping)) {
    setShopping(payload.shopping);
    await saveJSON(SHOPPING_KEY, payload.shopping);
  }
  if (Array.isArray(payload.weekDishes)) {
    setWeekDishes(payload.weekDishes);
    await saveJSON(WEEK_KEY, { selected: payload.weekDishes });
  }
  if (Array.isArray(payload.regulars)) {
    setRegulars(payload.regulars);
    await saveJSON(REGULARS_KEY, payload.regulars);
  }
  if (payload.inventory && typeof payload.inventory === 'object') {
    setInventory(payload.inventory);
    await saveJSON(INVENTORY_KEY, payload.inventory);
  }
  if (payload.pipelineJournal && typeof payload.pipelineJournal === 'object') {
    const pj = { version: 1, entries: payload.pipelineJournal.entries || {} };
    setPipelineJournal(pj);
    await saveJSON(PIPELINE_JOURNAL_KEY, pj);
  }
  if (payload.journal && typeof payload.journal === 'object') {
    const jr = normalizeJournal(payload.journal);
    setJournal(jr);
    await saveJSON(JOURNAL_KEY, jr);
  }
  if (typeof payload.copiesNote === 'string') {
    setCopiesNote(payload.copiesNote);
    await saveJSON(COPIES_NOTE_KEY, payload.copiesNote);
  }
  if (payload.weekLedger && typeof payload.weekLedger === 'object') {
    const wl = normalizeLedger(payload.weekLedger);
    setWeekLedger(wl);
    await saveJSON(WEEK_LEDGER_KEY, wl);
  }
  if (payload.containerInventory && typeof payload.containerInventory === 'object') {
    const cc = normalizeContainerConfig(payload.containerInventory);
    setContainerConfig(cc);
    await saveJSON(CONTAINER_INVENTORY_KEY, cc);
  }
  // Seed reconciliation on restore. A snapshot is a photograph of the DB as
  // it was up to three days ago, so it carries whatever baselines were
  // current THEN — including the stale ones this whole mechanism exists to
  // fix. Restoring without reconciling would quietly undo the boot fix and
  // put thyme back at 1144%, which is the worst version of this bug: fixed,
  // then broken again by a button labelled "restore."
  let restoreChanges = [];
  if (Array.isArray(payload.ingredientsDb)) {
    const rec = reconcileIngredients(payload.ingredientsDb, INGREDIENT_SEED);
    restoreChanges = rec.changes;
    setIngredientsDb(rec.next);
    await saveJSON(INGREDIENTS_KEY, rec.next);
  }
  if (Array.isArray(payload.costHistory)) {
    const pruned = pruneCostHistory(payload.costHistory, restoreChanges);
    setCostHistory(pruned);
    await saveJSON(COST_HISTORY_KEY, pruned);
  }
  if (payload.receiptAliases && typeof payload.receiptAliases === 'object') {
    setReceiptAliases(payload.receiptAliases);
    await saveJSON(RECEIPT_ALIASES_KEY, payload.receiptAliases);
  }
  // The archive series history. This rode the payload from the day it was added
  // and was never read back, so every restore silently reset the counter to
  // zero — and on a fresh device it stayed there. That is the one field whose
  // whole purpose is continuity ("the ninth year, kept since July 2026"), so
  // losing it on restore defeated the feature rather than degrading it.
  // Guarded on presence like the others, so restoring a backup taken before the
  // history existed cannot blank a good local one.
  if (typeof payload.realDataEpoch === 'string' || payload.realDataEpoch === null) {
    setRealDataEpoch(payload.realDataEpoch);
    await saveJSON(REAL_DATA_EPOCH_KEY, payload.realDataEpoch);
  }
  if (Array.isArray(payload.equipment)) {
    setEquipment(payload.equipment);
    await saveJSON(EQUIPMENT_KEY, payload.equipment);
  }
  if (Array.isArray(payload.archiveHistory)) {
    setArchiveHistory(payload.archiveHistory);
    await saveJSON(ARCHIVE_HISTORY_KEY, payload.archiveHistory);
  }
  // EC-3: restore the handled-pending ledger alongside orders. Restore rolls
  // state back to the backup point, so the ledger of what was handled THEN is
  // the correct guard: orders accepted before the backup stay suppressed;
  // orders accepted after it are rolled back and correctly re-sync as pending.
  // Only overwrite when the field is present, so restoring a pre-EC-3 backup
  // doesn't blank a good live ledger.
  if (payload.handledPending && typeof payload.handledPending === 'object') {
    handledPendingRef.current = payload.handledPending;
    await saveJSON(HANDLED_PENDING_KEY, handledPendingRef.current);
  }
  // The trail rides the snapshot, so a restore rewinds it to whatever that
  // snapshot held. That's the accepted cost of not giving it its own
  // storage. Stamp the restore itself onto the RESTORED log so the rewind
  // is visible rather than looking like history quietly changed.
  if (Array.isArray(payload.auditLog)) {
    const restored = appendAudit(payload.auditLog, [
      auditEntry({
        target: 'app', field: 'restored', from: null,
        to: (payload.orders || []).length, source: SOURCES.MANUAL,
        meta: { from: payload.exportedAt || 'unknown snapshot' },
      }),
      // Must ride THIS write. The restored log replaces the live one
      // wholesale, so reconcile entries appended anywhere else would be
      // overwritten a line later and the cost rewrite would go unrecorded.
      ...diffReconcile(restoreChanges),
    ]);
    setAuditLog(restored);
    await saveJSON(AUDIT_LOG_KEY, restored);
  }
  setExportMsg(`Imported ${(payload.orders || []).length} orders successfully.`);
  setTimeout(() => setExportMsg(null), 4000);
  setError(null);
  if (restoreChanges.length) setNotice(summarizeReconcile(restoreChanges));
  return true;
}
