// ingredientOps.js — the three paths that can change what an ingredient costs:
// a hand edit in the Ingredients tab, a committed receipt scan, and a learned
// receipt-string alias.
//
// WHY THEY ARE TOGETHER AND WHY THEY ARE CAREFUL
// These are the money-writing functions. A wrong number here does not throw or
// blank a screen; it quietly reprices dishes, moves every margin that touches
// the ingredient, and looks completely normal until someone notices weeks
// later. That already happened once with the $0 filet. Every one of them
// therefore does the same three things in the same order:
//
//   1. diff old against new and hand the difference to the audit trail
//   2. append cost-history points ONLY where a number actually moved
//   3. persist, surfacing a storage failure rather than swallowing it
//
// updateIngredients and commitReceiptCosts are near-twins and stay separate on
// purpose. The difference is the timestamp: a hand edit is stamped NOW, while a
// receipt commit is stamped with the receipt's PURCHASE date. Collapsing them
// into one function with a date argument would make it one careless call site
// away from filing last Tuesday's shop under today, which is exactly the kind
// of quiet wrongness this file exists to avoid. Neither ever touches `baseline`
// — that lives in ingredients.js and moves only by deploy.
//
// No hooks here, same rule as the other extracted modules.

import { INGREDIENTS_KEY, COST_HISTORY_KEY, RECEIPT_ALIASES_KEY } from './config.js';
import { saveJSON, saveError } from './utils.js';
import { SOURCES, diffIngredientCosts, diffAliases } from './auditLog.js';

// Roughly the last 4000 points. This is a lightweight trend for the Money tab,
// not the books, so an old point falling off the end costs nothing and an
// unbounded array in a ~5MB budget costs a lot.
const HISTORY_CAP = 4000;
const capHistory = (merged) => (merged.length > HISTORY_CAP ? merged.slice(merged.length - HISTORY_CAP) : merged);

export function updateIngredients(next, { setIngredientsDb, setCostHistory, setError, recordAudit }) {
  // Diff against current state to log only changed costs into history.
  setIngredientsDb(prev => {
    // Same prev/next pair the cost-history diff below already uses — the
    // audit trail is a second reader of a diff this function already had.
    recordAudit(diffIngredientCosts(prev, next, SOURCES.MANUAL));
    const prevById = {};
    (prev || []).forEach(i => { prevById[i.id] = i.current; });
    const t = Date.now();
    const points = [];
    (next || []).forEach(i => {
      const before = prevById[i.id];
      // log when a new ingredient appears or its current cost moved
      if (before === undefined || Math.abs((before || 0) - (i.current || 0)) > 0.0001) {
        points.push({ t, id: i.id, cost: i.current });
      }
    });
    if (points.length) {
      setCostHistory(h => {
        const capped = capHistory([...(h || []), ...points]);
        saveJSON(COST_HISTORY_KEY, capped).then(res => setError(saveError(res)));
        return capped;
      });
    }
    return next;
  });
  saveJSON(INGREDIENTS_KEY, next).then(res => setError(saveError(res)));
}

// Phase 3 — receipt commit. Twin of updateIngredients, but stamps cost-history
// points with the receipt's PURCHASE date (not the scan moment). `updates` is
// [{ id, cost }] for accepted lines only. `purchaseDate` is an ISO 'YYYY-MM-DD'
// string or null (fallback: now). Never touches baseline.
export function commitReceiptCosts(updates, purchaseDate, newIngredients, deps) {
  const { setIngredientsDb, setCostHistory, setError, recordAudit } = deps;
  if ((!updates || !updates.length) && (!newIngredients || !newIngredients.length)) return;
  const stamp = (() => {
    if (purchaseDate) {
      const ms = Date.parse(purchaseDate);
      if (!isNaN(ms)) return ms;
    }
    return Date.now();
  })();
  const byId = {};
  (updates || []).forEach(u => { byId[u.id] = u.cost; });
  // Per-ingredient provenance for the audit trail: the receipt line's raw
  // text and the derivation basis that produced this number. This is what
  // makes "why is this cost wrong?" answerable — it traces a bad cost to
  // the exact scanned line and the exact rule that read it.
  const metaById = {};
  (updates || []).forEach(u => {
    const m = {};
    if (u.raw) m.raw = String(u.raw).slice(0, 80);
    if (u.basis) m.basis = u.basis;
    if (purchaseDate) m.receiptDate = purchaseDate;
    if (Object.keys(m).length) metaById[u.id] = m;
  });
  setIngredientsDb(prev => {
    // first, append any inline-created ingredients (so cost updates resolve)
    const created = (newIngredients || []).filter(ni => !(prev || []).some(i => i.id === ni.id));
    const base = [...(prev || []), ...created];
    const next = base.map(i => (byId[i.id] != null ? { ...i, current: byId[i.id] } : i));
    recordAudit(diffIngredientCosts(base, next, SOURCES.RECEIPT, metaById));
    const prevById = {};
    base.forEach(i => { prevById[i.id] = i.current; });
    const t = stamp;
    const points = [];
    // log created ingredients' initial cost + any moved currents
    created.forEach(ni => { points.push({ t, id: ni.id, cost: ni.current }); });
    Object.keys(byId).forEach(id => {
      const before = prevById[id];
      const after = byId[id];
      if (before === undefined || Math.abs((before || 0) - (after || 0)) > 0.0001) {
        // avoid double-logging a just-created ingredient whose cost equals its seed
        if (!created.some(c => c.id === id && Math.abs((c.current || 0) - (after || 0)) < 0.0001)) {
          points.push({ t, id, cost: after });
        }
      }
    });
    if (points.length) {
      setCostHistory(h => {
        // Sorted, unlike the hand-edit path: a receipt can be committed with a
        // purchase date older than points already in the series, so appending
        // without sorting would put the chart out of order.
        const capped = capHistory([...(h || []), ...points].sort((a, b) => a.t - b.t));
        saveJSON(COST_HISTORY_KEY, capped).then(res => setError(saveError(res)));
        return capped;
      });
    }
    saveJSON(INGREDIENTS_KEY, next).then(res => setError(saveError(res)));
    return next;
  });
}

// Persist learned receipt aliases (merge + save).
export function saveReceiptAliases(nextAliases, { setReceiptAliases, setError, recordAudit }) {
  setReceiptAliases(prev => {
    // Only REMAPS are logged. The alias map also churns sighting counters
    // and store facts on every scan, and none of that moves money — logging
    // it would bury the one thing that does: which ingredient a receipt
    // string resolves to.
    recordAudit(diffAliases(prev, nextAliases));
    return nextAliases;
  });
  saveJSON(RECEIPT_ALIASES_KEY, nextAliases).then(res => setError(saveError(res)));
}
