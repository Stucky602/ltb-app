// seedReconcile.js — keeps the live ingredient DB honest against INGREDIENT_SEED.
//
// WHY THIS EXISTS (the bug, stated precisely)
//
// `INGREDIENT_SEED` is copied into storage exactly once, on first install
// (App.jsx, the `else` branch that seeds when INGREDIENTS_KEY is empty).
// After that the stored DB is authoritative and the seed never touches it
// again. Editing a baseline in ingredients.js therefore changes nothing for
// a running app — forever.
//
// That alone would merely be inert. It isn't inert, and here is the sharp
// edge: the drift engine reads the seed LIVE on one side of its own ratio.
//
//   baselineCostMap()  -> INGREDIENT_SEED[].baseline    (always fresh)
//   liveCostMapFrom()  -> ingredientsDb[].current       (frozen at install)
//
// and dishCosting computes driftRatio = rawCurrent / rawBaseline. So the
// moment a seed baseline is edited, drift compares a NEW baseline against an
// OLD current. When the UNIT also changed, it compares across unit systems
// and the ratio becomes meaningless:
//
//   thyme: current 1.91 ($/bunch, stale) / baseline 0.1993 ($/sprig, new)
//        = 958% drift, on every dish using thyme, silently.
//
// This is not a one-time mess from one session of edits. It fires on EVERY
// future seed price edit. That is why this is a standing invariant that runs
// on every boot, and not a hand-written entry in MIGRATIONS.
//
// WHY NOT A MIGRATION, AND WHY NOT A `rev` FIELD
//
// Migrations are for one-time SHAPE changes and run once per version bump.
// This is a recurring VALUE drift that needs checking every load. Putting it
// in MIGRATIONS[1] would fix today and leave November's price edit broken.
//
// A per-entry `rev` field was considered and rejected: it requires
// remembering to bump a number on every price edit. A correctness rule that
// depends on remembering is a rule that fails. Instead the live row already
// carries the `baseline` and `unit` it was seeded with, so the data describes
// its own staleness:
//
//   seed.baseline !== live.baseline  -> the seed moved. Reconcile.
//   seed.unit     !== live.unit      -> the unit moved. Reconcile + discard.
//   neither                          -> no-op.
//
// Nothing to remember, nothing to bump. Idempotent for free: after a
// reconcile live.baseline === seed.baseline, so the next run is a no-op.
//
// THE THREE CASES
//
//   1. NEW IN SEED, ABSENT FROM LIVE  -> insert with current = baseline.
//      Low risk. Note this is NOT currently causing wrong margins: the
//      drift engine's `liveCostMap[id] ?? baseC` already falls back to the
//      seed baseline for unknown ids, so tong_ho and orecchiette cost
//      correctly today. Inserting them is for the Ingredients tab and for
//      the receipt scanner, not for the math.
//
//   2. BASELINE MOVED, UNIT SAME      -> update baseline; preserve `current`
//      ONLY if it is real evidence. This is subtler than it first looks.
//
//      The naive rule ("always preserve current, it's receipt-learned data")
//      is wrong, and the dry run against Kevin's real DB is what exposed it.
//      Asparagus baseline moved 4.00 -> 2.99 while `current` sat at 4.00.
//      Preserving that produces +34% drift on a dish that had none — the
//      reconciler would CREATE the very symptom it exists to remove.
//
//      The reason is that `current` has two possible provenances and they
//      look identical in storage:
//        (a) a receipt taught it        -> real evidence, must survive
//        (b) install-day `current = baseline` copy, never touched since
//                                       -> an echo of the anchor, not evidence
//
//      The live row can't tell you which. But it doesn't have to: if `current`
//      still EQUALS the old baseline, nothing has ever moved it, so it is (b)
//      by construction. If it has diverged, something moved it, and the only
//      things that move it are receipts and manual edits — so it is (a).
//
//        current !== old baseline  -> learned. Preserve. (parsnips 3.79 lives)
//        current === old baseline  -> untouched echo. Follow the new baseline.
//                                     (asparagus 4.00 -> 2.99, drift stays 0%)
//
//      This makes a seed price edit do what Kevin expects: the price changes,
//      drift stays clean, and it stays clean until a receipt says otherwise.
//
//   3. UNIT CHANGED                   -> update baseline AND unit, DISCARD
//      current (reset to the new baseline). This is the case that matters.
//      A `current` of 1.91 dollars-per-BUNCH is not stale in a per-SPRIG
//      world — it is MEANINGLESS. Preserving it yields 958% drift instead of
//      1144%: barely moved, still broken.
//
//      Conversion was considered and rejected. We could divide thyme by
//      SPRIGS_PER_HERB_PACK, but the seed's own comment records that the old
//      per-"bunch" number was never a real bunch price ("a per-use estimate
//      wearing a bunch label"). Converting garbage produces precise garbage.
//      Red onion (each -> lb) has no conversion at all: nobody recorded an
//      onion's weight. Discard is the only honest answer.
//
//      That ingredient's costHistory is in the old unit too, and a per-sprig
//      chart plotting per-bunch points is a lie. Those points are dropped and
//      the series restarts. It is a lightweight time-series, not the books.
//
// NON-DESTRUCTIVE: unknown fields on a live row are preserved by spread.
// Rows in live that are NOT in the seed are left completely alone —
// receipt-created ingredients are real and must survive.

import { INGREDIENT_SEED } from './ingredients.js';

// Float compare. Costs are floats; anything under a hundredth of a cent is
// noise. Matches auditLog.js's EPS deliberately — the two run on the same
// numbers and disagreeing about "changed" would produce unlogged changes.
const EPS = 0.0001;
const moved = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) > EPS;

export const RECONCILE_ACTIONS = {
  INSERT: 'insert',
  BASELINE: 'baseline',
  UNIT: 'unit',
};

// Pure. Returns { next, changes } and never mutates its inputs.
//
// changes: [{ id, action, from, to, fromUnit, toUnit, currentFrom, currentTo }]
// — enough for both the audit log and a human-readable summary.
export function reconcileIngredients(liveDb, seed = INGREDIENT_SEED) {
  const live = Array.isArray(liveDb) ? liveDb : [];
  const seedList = Array.isArray(seed) ? seed : [];

  // A live DB that hasn't been seeded yet isn't stale, it's absent. Seeding is
  // App.jsx's job; reconciling an empty array into a full seed here would
  // duplicate that logic and hide which one ran.
  if (!live.length) return { next: live, changes: [] };

  const seedById = new Map(seedList.map(s => [s.id, s]));
  const liveById = new Map(live.map(i => [i.id, i]));
  const changes = [];

  const next = live.map(row => {
    const s = seedById.get(row.id);
    if (!s) return row; // receipt-created or retired: not ours to touch

    const unitChanged = String(s.unit) !== String(row.unit);
    const baselineChanged = moved(s.baseline, row.baseline);
    if (!unitChanged && !baselineChanged) return row;

    if (unitChanged) {
      // Old current is in the old unit. It is not data, it is a number.
      const out = { ...row, ...s, current: s.baseline };
      changes.push({
        id: row.id,
        action: RECONCILE_ACTIONS.UNIT,
        from: row.baseline, to: s.baseline,
        fromUnit: row.unit, toUnit: s.unit,
        currentFrom: row.current, currentTo: s.baseline,
      });
      return out;
    }

    // Baseline only. Was `current` ever moved off the old anchor? If not, it
    // is an install-day echo and must follow the anchor; preserving it would
    // manufacture drift out of nothing.
    const learned = moved(row.current, row.baseline);
    const current = learned ? row.current : s.baseline;

    // Spread the seed for name/category/flags, then set `current` explicitly —
    // the seed carries no `current` key at all, and spreading it would write
    // `undefined` over a real learned price.
    const out = { ...row, ...s, current };
    changes.push({
      id: row.id,
      action: RECONCILE_ACTIONS.BASELINE,
      from: row.baseline, to: s.baseline,
      currentFrom: row.current, currentTo: current,
      learned,
    });
    return out;
  });

  // Inserts, in seed order, appended after the existing rows.
  for (const s of seedList) {
    if (liveById.has(s.id)) continue;
    next.push({ ...s, current: s.baseline });
    changes.push({
      id: s.id,
      action: RECONCILE_ACTIONS.INSERT,
      from: null, to: s.baseline,
      toUnit: s.unit,
      currentFrom: null, currentTo: s.baseline,
    });
  }

  return { next, changes };
}

// costHistory for a unit-changed ingredient is denominated in the old unit.
// Drop those points; keep everything else untouched. Pure.
export function pruneCostHistory(costHistory, changes) {
  const unitChanged = new Set(
    (changes || [])
      .filter(c => c.action === RECONCILE_ACTIONS.UNIT)
      .map(c => c.id)
  );
  if (!unitChanged.size) return costHistory;
  const hist = Array.isArray(costHistory) ? costHistory : [];
  return hist.filter(p => !unitChanged.has(p && p.id));
}

// One line per reconciled row, for the boot notice. Kevin reads this and
// knows what moved without opening the Change log.
export function summarizeReconcile(changes) {
  if (!changes || !changes.length) return '';
  const units = changes.filter(c => c.action === RECONCILE_ACTIONS.UNIT);
  const bases = changes.filter(c => c.action === RECONCILE_ACTIONS.BASELINE);
  const adds = changes.filter(c => c.action === RECONCILE_ACTIONS.INSERT);
  const parts = [];
  if (units.length) parts.push(`${units.length} unit change${units.length > 1 ? 's' : ''} (live price reset)`);
  if (bases.length) parts.push(`${bases.length} baseline update${bases.length > 1 ? 's' : ''}`);
  if (adds.length) parts.push(`${adds.length} new ingredient${adds.length > 1 ? 's' : ''}`);
  return `Ingredient prices synced from the latest deploy: ${parts.join(', ')}. See Money → Change log.`;
}
