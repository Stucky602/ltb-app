// tests/seed_reconcile.mjs — the seed reconciler.
//
// The reconciler rewrites Kevin's stored costs on boot. That is a scary thing
// for code to do, so these tests are written against the SYMPTOM (thyme drift
// goes to ~0%, dish margins come back) as well as the mechanics. A green
// mechanical test that leaves thyme at 958% is a failed test.

import assert from 'node:assert/strict';
import {
  reconcileIngredients,
  pruneCostHistory,
  summarizeReconcile,
  RECONCILE_ACTIONS,
} from '../src/seedReconcile.js';
import { diffReconcile, SOURCES } from '../src/auditLog.js';
import { INGREDIENT_SEED } from '../src/ingredients.js';
import { costDishVariant, liveCostMapFrom, baselineCostMap } from '../src/dishCosting.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed += 1; }
  catch (e) { console.error(`\n[seed-reconcile] FAIL: ${name}\n  ${e.message}\n`); process.exit(1); }
};

// ── Case 3: unit change (the one that matters) ─────────────────────────────
test('unit change discards the stale current', () => {
  const seed = [{ id: 'thyme_fresh', name: 'Thyme (fresh)', unit: 'sprig', baseline: 0.1993, category: 'produce' }];
  const live = [{ id: 'thyme_fresh', name: 'Thyme (fresh)', unit: 'bunch', baseline: 0.167, current: 1.91, category: 'produce' }];
  const { next, changes } = reconcileIngredients(live, seed);
  assert.equal(next[0].unit, 'sprig');
  assert.equal(next[0].baseline, 0.1993);
  assert.equal(next[0].current, 0.1993, 'current must be reset to the new baseline, not preserved');
  assert.equal(changes.length, 1);
  assert.equal(changes[0].action, RECONCILE_ACTIONS.UNIT);
  assert.equal(changes[0].fromUnit, 'bunch');
  assert.equal(changes[0].toUnit, 'sprig');
});

test('the 958% trap: preserving current would NOT fix drift', () => {
  // This encodes the reason the discard rule exists. If someone "fixes" the
  // reconciler to preserve current on unit changes, this fails loudly.
  const seed = [{ id: 'thyme_fresh', unit: 'sprig', baseline: 0.1993 }];
  const live = [{ id: 'thyme_fresh', unit: 'bunch', baseline: 0.167, current: 1.91 }];
  const { next } = reconcileIngredients(live, seed);
  const drift = next[0].current / next[0].baseline;
  assert.ok(Math.abs(drift - 1) < 0.0001, `drift must be ~1.0 after reconcile, got ${(drift * 100).toFixed(0)}%`);
  // for contrast: the preserve rule would have produced this
  const preserved = 1.91 / 0.1993;
  assert.ok(preserved > 9, 'sanity: preserving current really does leave ~958% drift');
});

// ── Case 2: baseline only ─────────────────────────────────────────────────
test('baseline change preserves a LEARNED current', () => {
  // current (3.79) diverges from the old baseline (4.00), so a receipt or a
  // manual edit moved it. That is real evidence and must survive.
  const seed = [{ id: 'parsnips', unit: 'lb', baseline: 3.13 }];
  const live = [{ id: 'parsnips', unit: 'lb', baseline: 4.0, current: 3.79 }];
  const { next, changes } = reconcileIngredients(live, seed);
  assert.equal(next[0].baseline, 3.13);
  assert.equal(next[0].current, 3.79, 'a receipt-learned price is real data and must survive');
  assert.equal(changes[0].action, RECONCILE_ACTIONS.BASELINE);
  assert.equal(changes[0].learned, true);
});

test('baseline change: an UNTOUCHED current follows the new baseline', () => {
  // current (4.00) still equals the old baseline (4.00) — nothing ever moved
  // it, so it is an install-day echo, not evidence. Preserving it would
  // manufacture +34% drift on a dish that had none.
  const seed = [{ id: 'asparagus', unit: 'lb', baseline: 2.99 }];
  const live = [{ id: 'asparagus', unit: 'lb', baseline: 4.0, current: 4.0 }];
  const { next, changes } = reconcileIngredients(live, seed);
  assert.equal(next[0].baseline, 2.99);
  assert.equal(next[0].current, 2.99, 'an untouched current must follow its anchor');
  assert.equal(changes[0].learned, false);
  assert.ok(Math.abs(next[0].current / next[0].baseline - 1) < 0.0001, 'drift must stay 0%');
});

test('the reconciler must never CREATE drift', () => {
  // The failure this rule exists to prevent. If someone reverts to
  // "always preserve current," this fires.
  const seed = [
    { id: 'asparagus', unit: 'lb', baseline: 2.99 },
    { id: 'kabocha', unit: 'lb', baseline: 1.5 },
    { id: 'corn', unit: 'ear', baseline: 0.25 },
  ];
  const live = [
    { id: 'asparagus', unit: 'lb', baseline: 4.0, current: 4.0 },
    { id: 'kabocha', unit: 'lb', baseline: 1.99, current: 1.99 },
    { id: 'corn', unit: 'ear', baseline: 0.33, current: 0.33 },
  ];
  const { next } = reconcileIngredients(live, seed);
  for (const row of next) {
    const drift = row.current / row.baseline;
    assert.ok(Math.abs(drift - 1) < 0.0001,
      `${row.id}: reconciling a never-touched row produced ${((drift - 1) * 100).toFixed(0)}% drift`);
  }
});

test('baseline change does not clobber current with undefined', () => {
  // The seed carries no `current` key. A naive {...row, ...seed} spread would
  // write current: undefined and silently destroy the learned price.
  const seed = [{ id: 'kabocha', unit: 'lb', baseline: 1.5 }];
  const live = [{ id: 'kabocha', unit: 'lb', baseline: 1.99, current: 2.25 }];
  const { next } = reconcileIngredients(live, seed);
  assert.equal(next[0].current, 2.25);
  assert.ok('current' in next[0]);
});

// ── Case 1: inserts ───────────────────────────────────────────────────────
test('new seed ingredient is inserted with current = baseline', () => {
  const seed = [
    { id: 'garlic', unit: 'head', baseline: 0.5 },
    { id: 'tong_ho', unit: 'lb', baseline: 1.99 },
  ];
  const live = [{ id: 'garlic', unit: 'head', baseline: 0.5, current: 0.5 }];
  const { next, changes } = reconcileIngredients(live, seed);
  assert.equal(next.length, 2);
  const th = next.find(i => i.id === 'tong_ho');
  assert.equal(th.current, 1.99);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].action, RECONCILE_ACTIONS.INSERT);
});

// ── Non-destruction ───────────────────────────────────────────────────────
test('rows not in the seed are left completely alone', () => {
  // Receipt-created ingredients are real and are not the seed's business.
  const seed = [{ id: 'garlic', unit: 'head', baseline: 0.5 }];
  const live = [
    { id: 'garlic', unit: 'head', baseline: 0.5, current: 0.5 },
    { id: 'kevin_invented_this', unit: 'lb', baseline: 9.99, current: 8.5, note: 'from a receipt' },
  ];
  const { next, changes } = reconcileIngredients(live, seed);
  assert.equal(changes.length, 0);
  assert.deepEqual(next[1], live[1]);
});

test('unknown fields on a reconciled row survive', () => {
  const seed = [{ id: 'sv_bag', unit: 'each', baseline: 2.0, fixed: true }];
  const live = [{ id: 'sv_bag', unit: 'each', baseline: 1.5, current: 1.5, fixed: true, someFutureField: 'keep me' }];
  const { next } = reconcileIngredients(live, seed);
  assert.equal(next[0].someFutureField, 'keep me');
  assert.equal(next[0].fixed, true);
});

test('does not mutate its inputs', () => {
  const seed = [{ id: 'corn', unit: 'ear', baseline: 0.25 }];
  const live = [{ id: 'corn', unit: 'ear', baseline: 0.33, current: 0.33 }];
  const frozen = JSON.stringify(live);
  reconcileIngredients(live, seed);
  assert.equal(JSON.stringify(live), frozen);
});

test('an empty live DB is left to App.jsx to seed', () => {
  const { next, changes } = reconcileIngredients([], INGREDIENT_SEED);
  assert.equal(next.length, 0);
  assert.equal(changes.length, 0);
});

// ── Idempotence ───────────────────────────────────────────────────────────
test('running twice is a no-op the second time', () => {
  const seed = [
    { id: 'thyme_fresh', unit: 'sprig', baseline: 0.1993 },
    { id: 'parsnips', unit: 'lb', baseline: 3.13 },
    { id: 'tong_ho', unit: 'lb', baseline: 1.99 },
  ];
  const live = [
    { id: 'thyme_fresh', unit: 'bunch', baseline: 0.167, current: 1.91 },
    { id: 'parsnips', unit: 'lb', baseline: 4.0, current: 3.79 },
  ];
  const first = reconcileIngredients(live, seed);
  assert.ok(first.changes.length > 0);
  const second = reconcileIngredients(first.next, seed);
  assert.equal(second.changes.length, 0, 'second run must find nothing to do');
  assert.deepEqual(second.next, first.next);
});

test('idempotent against the real seed', () => {
  const live = INGREDIENT_SEED.map(i => ({ ...i, current: i.baseline }));
  const { changes } = reconcileIngredients(live, INGREDIENT_SEED);
  assert.equal(changes.length, 0, 'a freshly seeded DB must need no reconciliation');
});

// ── costHistory pruning ───────────────────────────────────────────────────
test('costHistory is pruned only for unit-changed ingredients', () => {
  const changes = [
    { id: 'thyme_fresh', action: RECONCILE_ACTIONS.UNIT },
    { id: 'parsnips', action: RECONCILE_ACTIONS.BASELINE },
  ];
  const hist = [
    { t: 1, id: 'thyme_fresh', cost: 1.91 },
    { t: 2, id: 'parsnips', cost: 3.79 },
    { t: 3, id: 'garlic', cost: 0.5 },
  ];
  const out = pruneCostHistory(hist, changes);
  assert.equal(out.length, 2);
  assert.ok(!out.some(p => p.id === 'thyme_fresh'), 'per-bunch history is meaningless in a per-sprig world');
  assert.ok(out.some(p => p.id === 'parsnips'), 'baseline-only changes keep their history');
});

test('costHistory untouched when no unit changed', () => {
  const hist = [{ t: 1, id: 'parsnips', cost: 3.79 }];
  assert.equal(pruneCostHistory(hist, [{ id: 'parsnips', action: RECONCILE_ACTIONS.BASELINE }]), hist);
});

// ── Audit ─────────────────────────────────────────────────────────────────
test('every reconciled row produces an audit entry', () => {
  const changes = [
    { id: 'thyme_fresh', action: RECONCILE_ACTIONS.UNIT, from: 0.167, to: 0.1993, fromUnit: 'bunch', toUnit: 'sprig', currentFrom: 1.91, currentTo: 0.1993 },
    { id: 'parsnips', action: RECONCILE_ACTIONS.BASELINE, from: 4.0, to: 3.13, currentFrom: 3.79, currentTo: 3.79 },
    { id: 'tong_ho', action: RECONCILE_ACTIONS.INSERT, from: null, to: 1.99, currentFrom: null, currentTo: 1.99 },
  ];
  const entries = diffReconcile(changes);
  assert.ok(entries.every(e => e.source === SOURCES.SEED));
  const thyme = entries.filter(e => e.target === 'thyme_fresh');
  assert.equal(thyme.length, 2, 'unit change logs both the baseline move and the discarded current');
  assert.ok(thyme.some(e => e.field === 'current' && e.meta.basis.includes('bunch')),
    'the discarded-current entry must say what the old unit was');
  assert.equal(entries.filter(e => e.target === 'parsnips').length, 1);
  assert.equal(entries.filter(e => e.target === 'tong_ho')[0].meta.created, true);
});

test('an untouched current following its baseline is logged', () => {
  // This one moves Kevin's money without a receipt, so it must be visible.
  const entries = diffReconcile([
    { id: 'asparagus', action: RECONCILE_ACTIONS.BASELINE, from: 4.0, to: 2.99, currentFrom: 4.0, currentTo: 2.99, learned: false },
  ]);
  assert.equal(entries.length, 2, 'both the baseline move and the current move are logged');
  const cur = entries.find(e => e.field === 'current');
  assert.ok(cur.meta.basis.includes('followed new baseline'));
});

test('a preserved learned current logs only the baseline move', () => {
  const entries = diffReconcile([
    { id: 'parsnips', action: RECONCILE_ACTIONS.BASELINE, from: 4.0, to: 3.13, currentFrom: 3.79, currentTo: 3.79, learned: true },
  ]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].field, 'baseline');
});

test('summary names the unit resets', () => {
  const s = summarizeReconcile([
    { id: 'a', action: RECONCILE_ACTIONS.UNIT },
    { id: 'b', action: RECONCILE_ACTIONS.BASELINE },
    { id: 'c', action: RECONCILE_ACTIONS.INSERT },
  ]);
  assert.match(s, /1 unit change/);
  assert.match(s, /1 baseline update/);
  assert.match(s, /1 new ingredient/);
  assert.equal(summarizeReconcile([]), '');
});

// ── The symptom: real dishes, real numbers ────────────────────────────────
test('SYMPTOM: thyme drift returns to ~0% on a real dish', () => {
  // Reconstruct Kevin's actual broken state: the stored DB as it was seeded
  // before the Jul 14 thyme reprice, then reconcile and check a real dish.
  const OLD = { thyme_fresh: { unit: 'bunch', baseline: 0.167 }, tarragon: { unit: 'bunch', baseline: 0.417 } };
  const staleDb = INGREDIENT_SEED.map(i => {
    const old = OLD[i.id];
    if (!old) return { ...i, current: i.baseline };
    // stale row: old unit, old baseline, and a learned per-bunch price
    return { ...i, unit: old.unit, baseline: old.baseline, current: 1.91 };
  });

  const base = baselineCostMap();
  const { next, changes } = reconcileIngredients(staleDb, INGREDIENT_SEED);
  assert.ok(changes.some(c => c.id === 'thyme_fresh' && c.action === RECONCILE_ACTIONS.UNIT));

  // Named explicitly rather than probed: a typo'd dish name returns
  // `unknown`, and an `if (!unknown)` guard would let this test silently
  // assert nothing. It must fail if the dish disappears from the registry.
  const CASES = [['Bolognese', 'Large'], ['Mushroom Ragu', 'Large']];
  let checked = 0;
  for (const [dish, variant] of CASES) {
    const broken = costDishVariant(dish, variant, null, liveCostMapFrom(staleDb), base);
    const fixed = costDishVariant(dish, variant, null, liveCostMapFrom(next), base);
    assert.ok(!broken.unknown, `${dish} / ${variant} must resolve — if this fires, the dish was renamed`);
    assert.ok(Math.abs(broken.pctDrift) > 1,
      `${dish}: the stale DB must actually show drift, or this test proves nothing (got ${broken.pctDrift}%)`);
    assert.ok(Math.abs(fixed.pctDrift) < 1,
      `${dish}: reconciled drift must be ~0%, got ${fixed.pctDrift}% (was ${broken.pctDrift}%)`);
    checked += 1;
  }
  assert.equal(checked, CASES.length);
});

test('SYMPTOM: a reconciled DB shows ~0% drift on every dish', () => {
  // The general form. After reconciliation the live map equals the baseline
  // map for every seed id, so no dish can show drift from a seed edit.
  const live = INGREDIENT_SEED.map(i => ({ ...i, current: i.baseline }));
  const { next } = reconcileIngredients(live, INGREDIENT_SEED);
  const liveMap = liveCostMapFrom(next);
  const baseMap = baselineCostMap();
  for (const id of Object.keys(baseMap)) {
    assert.ok(Math.abs((liveMap[id] ?? 0) - baseMap[id]) < 0.0001,
      `${id}: live ${liveMap[id]} != baseline ${baseMap[id]}`);
  }
});

console.log(`[seed-reconcile] ${passed} checks passed`);
