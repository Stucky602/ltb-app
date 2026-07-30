// bootHydrate.js — the single boot pass that brings this device's stored state
// into memory, in the one order that is correct.
//
// WHY THIS IS ONE FUNCTION AND NOT TWENTY-SEVEN
// It is tempting to look at this and see twenty-seven keys that each want a
// tidy little useLoadedState hook. That refactor is a trap, and it is worth
// writing down why so nobody spends a weekend rediscovering it. The loads are
// NOT independent:
//
//   - costHistory is pruned using the change list produced by the ingredients
//     reconcile, so it cannot start until ingredients has finished
//   - the dishNotes -> journal migration reads one key, writes a second, and
//     blanks the first, and must happen before purgeTombstones runs
//   - the audit log and the menu fingerprint are diffed together into a single
//     appendAudit, so splitting them means two writes and two chances to lose
//     one (the comment inside says as much)
//   - orders are hydrated, then possibly REWRITTEN a second time by the house
//     backfill, and the second write has to see the first
//   - the schema forward-compat guard has to run and be allowed to bail before
//     any of it
//
// Twenty-seven parallel effects would race every one of those. So the whole
// pass moved here intact, as one async function called from one useEffect. The
// sequencing is byte-identical to what it replaced, because it is the same
// body: it just no longer sits in the middle of a three-thousand-line file.
//
// `isMounted` replaces the effect's closure flag. The caller still owns the
// flag and still flips it in the effect's cleanup; this reads it at exactly
// the same points the old code read `mounted`.

import { normalizeFlags } from './featureFlags.js';
import {
  ORDERS_KEY, CHECKS_KEY, SHOPPING_KEY, WEEK_KEY, DELIVER_CHECKS_KEY,
  DISH_NOTES_KEY, FEEDBACK_KEY, PIPELINE_JOURNAL_KEY, JOURNAL_KEY,
  LAST_SEEN_WEEK_KEY, CONTAINER_INVENTORY_KEY, WEEK_LEDGER_KEY, COPIES_NOTE_KEY,
  ARCHIVE_HISTORY_KEY, CUSTOMER_FLAGS_KEY, PENDING_KEY, HANDLED_PENDING_KEY, REGULARS_KEY, EQUIPMENT_KEY, REAL_DATA_EPOCH_KEY, ROWAN_LOG_KEY, DISH_RANKING_KEY, VISUAL_CUES_KEY,
  INVENTORY_KEY, INGREDIENTS_KEY, COST_HISTORY_KEY, RECEIPT_ALIASES_KEY,
  AUDIT_LOG_KEY, MENU_FINGERPRINT_KEY,
} from './config.js';
import { SCHEMA_VERSION, SCHEMA_VERSION_KEY, assessForwardCompat, REFUSE_MESSAGE } from './migrations.js';
import { ALL_DINNERS, DEFAULT_WEEK, FULL_MENU } from './menu.js';
import {
  loadJSON, saveJSON, stampItemCosts, cleanupPhotos,
  regularMatchType, HOUSE_DISCOUNT_PERCENT,
} from './utils.js';
import { normalizeJournal, migrateDishNotes, purgeTombstones, stampEntry } from './journal.js';
import { DOSSIER_SEED } from './dossierSeed.js';
import { SEED_EQUIPMENT } from './equipmentSeed.js';
import { normalizeLedger } from './weekLedger.js';
import { normalizeContainerConfig } from './containers.js';
import { reconcileIngredients, pruneCostHistory, summarizeReconcile } from './seedReconcile.js';
import { appendAudit, menuFingerprint, diffMenuFingerprint, diffReconcile } from './auditLog.js';
import { INGREDIENT_SEED } from './ingredients.js';

export async function hydrateFromStorage(deps) {
  const {
    isMounted,
    setLoading, setError, setOrders, setCookChecks, setDeliverChecks,
    setJournal, setLastSeenWeek, setContainerConfig, setWeekLedger,
    setCopiesNote, setArchiveHistory, setDishFeedback, setPipelineJournal,
    setShopping, setBooted, setWeekDishes, setPendingOrders, setRegulars,
    setInventory, setIngredientsDb, setCostHistory, setReceiptAliases,
    setAuditLog, setNotice, setEquipment, setRealDataEpoch, setRowanLog, setDishRankings, setVisualCues, setCustomerFlags,
    handledPendingRef, pollWorkerPending,
  } = deps;

  // ── Schema forward-compat guard (v9.22) ─────────────────────────────
  // Checked BEFORE anything else loads. If this device's stored schema
  // version is NEWER than the code currently running here, that means
  // this device backed up on a later version and is now running older
  // code — the exact "old code, new data" case. Refuse to touch local
  // state rather than silently downgrading it. An unstamped device
  // (storedVersion undefined) is pre-versioning data, not a threat, and
  // reads as v0 — always safe to proceed and stamp forward.
  const storedVersion = await loadJSON(SCHEMA_VERSION_KEY, undefined);
  const compat = assessForwardCompat(storedVersion);
  if (compat.outcome === 'refuse') {
    if (isMounted()) {
      setLoading(false);
      setError(REFUSE_MESSAGE);
    }
    return;
  }
  if (compat.outcome !== 'current') {
    // Older or unstamped — this device is behind, which is always safe
    // to bring forward. Stamp now so a crash mid-load doesn't leave the
    // device perpetually re-detecting as "needs migration."
    await saveJSON(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
  }

  const [loadedOrders, loadedChecks, loadedShopping, loadedWeek, loadedDeliverChecks, loadedDishNotes, loadedDishFeedback, loadedPipelineJournal, loadedJournal, loadedLastSeenWeek, loadedContainerCfg, loadedLedger, loadedCopiesNote, loadedArchiveHistory, loadedEquipment, loadedEpoch, loadedRowan, loadedRankings, loadedCues, loadedFlags] = await Promise.all([
    loadJSON(ORDERS_KEY, []),
    loadJSON(CHECKS_KEY, {}),
    loadJSON(SHOPPING_KEY, []),
    loadJSON(WEEK_KEY, null),
    loadJSON(DELIVER_CHECKS_KEY, {}),
    loadJSON(DISH_NOTES_KEY, {}),
    loadJSON(FEEDBACK_KEY, {}),
    loadJSON(PIPELINE_JOURNAL_KEY, { version: 1, entries: {} }),
    loadJSON(JOURNAL_KEY, null),
    loadJSON(LAST_SEEN_WEEK_KEY, null),
    loadJSON(CONTAINER_INVENTORY_KEY, null),
    loadJSON(WEEK_LEDGER_KEY, null),
    loadJSON(COPIES_NOTE_KEY, ''),
    loadJSON(ARCHIVE_HISTORY_KEY, []),
    loadJSON(EQUIPMENT_KEY, []),
    loadJSON(REAL_DATA_EPOCH_KEY, null),
    loadJSON(ROWAN_LOG_KEY, []),
    loadJSON(DISH_RANKING_KEY, null),
    loadJSON(VISUAL_CUES_KEY, []),
    loadJSON(CUSTOMER_FLAGS_KEY, null),
  ]);
  if (!isMounted()) return;
  const migrated = loadedOrders.map(o => ({
    ...o,
    // Cost-basis migration: items stamped at creation keep their frozen
    // cost (tagged 'snapshot'); items predating stamping get today's
    // registry anchor, honestly tagged 'backfilled'. Idempotent.
    items: stampItemCosts((o.items || []).map(it => {
      const clean = { ...it };
      if (clean.upcharge != null && typeof clean.upcharge !== 'object') {
        delete clean.upcharge;
      }
      if ('lbs' in clean) delete clean.lbs;
      return clean;
    }), 'backfilled'),
    paid: o.paid === undefined ? o.status === 'Delivered' : o.paid,
    archived: o.archived || false,
    discountType: o.discountType || null,
    discountValue: o.discountValue || 0,
    customCharges: o.customCharges || [],
    jarSwaps: o.jarSwaps || 0,
    containerReturns: o.containerReturns || 0,
    waiveSurcharge: o.waiveSurcharge || false,
    total: Number(o.total) || 0,
  }));
  setOrders(migrated);
  setCookChecks(loadedChecks || {});
  setDeliverChecks(loadedDeliverChecks || {});
  // Journal hydrate + the one-way dishNotes migration (schema v2).
  // Each legacy note becomes a technique entry marked migrated+undated —
  // its real date is unknown and is never invented. Idempotent by
  // content, and the old key is emptied after the fold so a second boot
  // is a no-op. The key itself stays in config.js so THIS read works.
  let bootJournal = normalizeJournal(loadedJournal);
  if (loadedDishNotes && Object.keys(loadedDishNotes).some(k => String(loadedDishNotes[k] || '').trim())) {
    bootJournal = migrateDishNotes(bootJournal, loadedDishNotes);
    await saveJSON(JOURNAL_KEY, bootJournal);
    await saveJSON(DISH_NOTES_KEY, {});
  }
  // Drop journal entries whose 30-day undo window has closed.
  bootJournal = purgeTombstones(bootJournal);
  // Seed harvested dossier content. Idempotent by TEXT rather than by a
  // "seeded" flag: a flag goes out of step the moment the seed list grows, and
  // this list is expected to grow after every harvest conversation. Matching on
  // text means a re-run adds only what is new and can never duplicate something
  // Kevin has already read. Runs AFTER purgeTombstones so a seeded entry he
  // deleted does not immediately return.
  {
    const have = new Set((bootJournal.entries || []).map(e => String(e.text || '').trim()));
    const fresh = DOSSIER_SEED
      .filter(sd => !have.has(String(sd.text || '').trim()))
      .map(sd => stampEntry(sd, new Date()));
    if (fresh.length) {
      bootJournal = normalizeJournal({ ...bootJournal, entries: [...(bootJournal.entries || []), ...fresh] });
      await saveJSON(JOURNAL_KEY, bootJournal);
    }
  }
  setJournal(bootJournal);
  setLastSeenWeek(loadedLastSeenWeek ?? null);
  setContainerConfig(normalizeContainerConfig(loadedContainerCfg));
  setWeekLedger(normalizeLedger(loadedLedger));
  setCopiesNote(typeof loadedCopiesNote === 'string' ? loadedCopiesNote : '');
  setArchiveHistory(Array.isArray(loadedArchiveHistory) ? loadedArchiveHistory : []);
  // Seeded ONLY when nothing is stored yet — Kevin's own edits always win.
  // Walked and recorded Jul 27: what he actually owns, so the archive's
  // long-dead "The equipment these assume" section has real content instead
  // of an empty box the first time someone reads it.
  const eq = Array.isArray(loadedEquipment) && loadedEquipment.length ? loadedEquipment : SEED_EQUIPMENT;
  setEquipment(eq);
  setRealDataEpoch(typeof loadedEpoch === 'string' ? loadedEpoch : null);
  setRowanLog(Array.isArray(loadedRowan) ? loadedRowan : []);
  // Null (never saved) keeps the seeded ranking. An empty ARRAY is a deliberate
  // clear and is respected, so wiping the record stays possible.
  if (Array.isArray(loadedRankings)) setDishRankings(loadedRankings);
  // Cue metadata. Without this the app boots with an empty atlas and the next
  // save would overwrite the stored list with that empty one — the photographs
  // would survive in the bucket with nothing left pointing at them.
  setVisualCues(Array.isArray(loadedCues) ? loadedCues : []);
  // Flags load through normalizeFlags so a stored value from an older shape, or
  // a hand-edited one, cannot put an unknown stage in front of customers.
  if (loadedFlags && typeof loadedFlags === 'object') setCustomerFlags(normalizeFlags(loadedFlags));
  setDishFeedback(loadedDishFeedback || {});
  if (loadedPipelineJournal && typeof loadedPipelineJournal === 'object') {
    setPipelineJournal({ version: 1, entries: loadedPipelineJournal.entries || {} });
  }
  setShopping(loadedShopping || []);
  setBooted(true);
  if (loadedWeek && Array.isArray(loadedWeek.selected)) {
    const valid = loadedWeek.selected.filter(n => ALL_DINNERS.some(d => d.name === n));
    setWeekDishes(valid.length > 0 ? valid : DEFAULT_WEEK);
  }
  const savedPending = await loadJSON(PENDING_KEY, []);
  if (isMounted()) setPendingOrders(savedPending || []);
  const savedHandled = await loadJSON(HANDLED_PENDING_KEY, {});
  handledPendingRef.current = savedHandled || {};

  const savedRegulars = await loadJSON(REGULARS_KEY, []);
  const migratedRegulars = (savedRegulars || []).map(r => {
    if (Array.isArray(r.names) && r.names.length) return r;
    const names = r.name ? [String(r.name).trim()] : [];
    return { ...r, names, name: names[0] || '' };
  });
  if (isMounted()) setRegulars(migratedRegulars);
  // Retroactive house backfill (Jul 20): stamp house:true and the free-order
  // fields onto any order linked to a house regular that's missing them, so
  // isHouseOrder (books, Money tab, digest) excludes it from every metric.
  // Catches orders that predate the flag or were linked via a path that
  // didn't stamp it. The wife must not touch any number. Idempotent: once an
  // order is house + $0 it no longer matches.
  const houseRegs = migratedRegulars.filter(r => r.house);
  if (houseRegs.length > 0) {
    const houseMatch = (o) => houseRegs.find(r => o.regularId === r.id || regularMatchType(r, o.customer) === 'exact');
    let houseFixed = 0;
    const houseBackfilled = migrated.map(o => {
      const reg = houseMatch(o);
      if (reg && (!o.house || o.total !== 0 || o.regularId !== reg.id)) {
        houseFixed++;
        return { ...o, house: true, regularId: reg.id, waiveSurcharge: true, discountType: 'percent', discountValue: HOUSE_DISCOUNT_PERCENT, total: 0 };
      }
      return o;
    });
    if (houseFixed > 0 && isMounted()) {
      setOrders(houseBackfilled);
      saveJSON(ORDERS_KEY, houseBackfilled);
    }
  }
  const savedInventory = await loadJSON(INVENTORY_KEY, {});
  if (isMounted()) setInventory(savedInventory || {});

  const savedIngredients = await loadJSON(INGREDIENTS_KEY, null);
  let ingForHistory = null;
  // Reconcile entries are produced here but LOGGED in the audit block
  // below, alongside the deploy fingerprint diff — same boot, same write,
  // one log. Both describe "a file edit moved your money," so splitting
  // them across two saves would just mean two chances to lose one.
  let reconcileChanges = [];
  if (savedIngredients && Array.isArray(savedIngredients) && savedIngredients.length) {
    // ── Seed reconciliation (Jul 15) ──────────────────────────────────
    // The stored DB is authoritative, which used to mean INGREDIENT_SEED
    // was inert after first install: editing a baseline in ingredients.js
    // changed nothing here, forever. That would merely be useless. It was
    // worse, because the drift engine reads the seed LIVE on one side of
    // its own ratio (baselineCostMap() -> seed, liveCostMapFrom() ->
    // storage). So a seed edit didn't do nothing; it made every dish using
    // that ingredient report drift against an anchor its `current` had
    // never been compared to. Thyme's unit change read as 1144%.
    //
    // This runs on EVERY boot, not once, because it is not a one-time
    // shape fix — it is a standing invariant. Kevin edits prices
    // regularly, and the next edit needs the same treatment as this one
    // with nobody having to remember. See src/seedReconcile.js.
    const rec = reconcileIngredients(savedIngredients, INGREDIENT_SEED);
    reconcileChanges = rec.changes;
    if (isMounted()) setIngredientsDb(rec.next);
    ingForHistory = rec.next;
    if (rec.changes.length) saveJSON(INGREDIENTS_KEY, rec.next);
  } else {
    // First run: seed from the canonical baseline. current = baseline at seed time.
    const seeded = INGREDIENT_SEED.map(i => ({ ...i, current: i.baseline }));
    if (isMounted()) setIngredientsDb(seeded);
    saveJSON(INGREDIENTS_KEY, seeded);
    ingForHistory = seeded;
  }

  // Cost history (lightweight time-series). Seed an initial snapshot on first run
  // so trends have a starting anchor; afterward append on each cost edit.
  const savedHistory = await loadJSON(COST_HISTORY_KEY, null);
  if (savedHistory && Array.isArray(savedHistory) && savedHistory.length) {
    // A unit-changed ingredient's history is denominated in the OLD unit.
    // Plotting per-bunch points on a per-sprig axis is not stale data, it
    // is a lie with a chart around it. Drop those points and let the
    // series restart; this is a lightweight trend, not the books.
    const pruned = pruneCostHistory(savedHistory, reconcileChanges);
    if (isMounted()) setCostHistory(pruned);
    if (pruned !== savedHistory) saveJSON(COST_HISTORY_KEY, pruned);
  } else {
    const t = Date.now();
    const snapshot = (ingForHistory || []).map(i => ({ t, id: i.id, cost: i.current }));
    if (isMounted()) setCostHistory(snapshot);
    saveJSON(COST_HISTORY_KEY, snapshot);
  }

  // Receipt aliases (Phase 3): learned receipt-string -> ingredient mappings,
  // always-ignore items, and flat-price flags. Empty map on first run.
  const savedAliases = await loadJSON(RECEIPT_ALIASES_KEY, null);
  if (isMounted() && savedAliases && typeof savedAliases === 'object') {
    setReceiptAliases(savedAliases);
  }

  // ── Audit trail + file-deploy detection (v9.23) ────────────────────
  // Dish prices and cost anchors live in dishes.js, so they change by
  // DEPLOY. Nothing in the running app can witness that edit happening —
  // by the time this code runs, the new number simply IS the number.
  // Diffing a stored fingerprint of the catalog against the one now in
  // the bundle is the only way the app can notice a deploy moved money.
  // This is the check that would have caught the $0 filet the morning it
  // shipped, instead of weeks later.
  const savedAudit = await loadJSON(AUDIT_LOG_KEY, []);
  const prevFp = await loadJSON(MENU_FINGERPRINT_KEY, null);
  const nextFp = menuFingerprint(FULL_MENU);
  // First run has no prior fingerprint: establish the baseline silently
  // rather than logging the entire catalog as if it just changed.
  const deployEntries = diffMenuFingerprint(prevFp, nextFp);
  // Seed reconciliation from above. This one is louder than a deploy diff:
  // a deploy entry records that the app NOTICED a number move, while a
  // reconcile entry records that the app CHANGED Kevin's stored data. An
  // unlogged migration that silently rewrites costs would be repeating the
  // exact sin the audit log was built to end.
  const seedEntries = diffReconcile(reconcileChanges);
  const startingLog = appendAudit(
    Array.isArray(savedAudit) ? savedAudit : [],
    [...deployEntries, ...seedEntries]
  );
  if (isMounted()) setAuditLog(startingLog);
  if (deployEntries.length || seedEntries.length) saveJSON(AUDIT_LOG_KEY, startingLog);
  if (!prevFp || deployEntries.length) saveJSON(MENU_FINGERPRINT_KEY, nextFp);

  // Tell Kevin his costs moved. Silently correcting money is how the filet
  // bug hid for weeks; a boot that quietly rewrites prices and says nothing
  // is the same failure wearing a fix's clothes.
  if (isMounted() && reconcileChanges.length) setNotice(summarizeReconcile(reconcileChanges));

  setLoading(false);
  cleanupPhotos(migrated);
  // The legacy Google-Forms CSV branch that used to sit here was removed with
  // the rest of that path. The worker queue is the only intake now.
  pollWorkerPending();
}
