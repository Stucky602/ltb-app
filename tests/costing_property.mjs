// costing_property.mjs — property-based tests for the DISH costing engine.
//
// WHY THIS AND NOT MORE orderTotal TESTS
// tests/property.mjs already hammers orderTotal with thousands of randomized
// orders. That is the money math on the way OUT: what a customer is charged.
// This is the money math on the way IN: what a dish costs to make, rolled up
// from ingredient prices through unit conversions, pack quantities, and the
// drift ratio. Nothing was generating cases against it, and it is the input to
// every margin figure in the app — so a wrong number here does not look wrong,
// it looks like a dish that is doing better or worse than it is.
//
// The invariants below are the ones that must hold for EVERY dish, every
// variant, and every plausible set of ingredient prices. Each is a sentence
// Kevin would recognise as obviously true, which is the point: property tests
// are only worth having when a failure means something real, not when they
// restate the implementation.
//
// Reproducibility: the seed prints at the start. Re-run a failure exactly with
//   COST_SEED=<seed> node tests/costing_property.mjs

import { DISHES } from '../src/dishes.js';
import {
  resolveDishVariant, costDishVariant, baselineCostMap, trueRawCost,
  MARGIN_BUFFER, PASSTHROUGH_IDS,
} from '../src/dishCosting.js';
import { INGREDIENT_SEED } from '../src/ingredients.js';

let failed = 0;
const failures = new Map();   // invariant -> first counterexample only
function hold(name, cond, detail) {
  if (cond) return;
  if (!failures.has(name)) { failed++; failures.set(name, detail || ''); }
}

// ── deterministic RNG ───────────────────────────────────────────────────────
const SEED = Number(process.env.COST_SEED) || Math.floor(Math.random() * 1e9);
let _s = SEED >>> 0;
const rnd = () => { _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; return ((_s >>> 0) % 1e6) / 1e6; };
const between = (lo, hi) => lo + rnd() * (hi - lo);
console.log(`  (seed ${SEED} — re-run with COST_SEED=${SEED})`);

const BASE = baselineCostMap();

// Every dish/variant pair in the registry, which is the real domain.
const CASES = [];
for (const d of DISHES) {
  for (const v of (d.variants || [])) CASES.push({ dish: d.name, variant: v.label, menuCost: v.cost });
}

// ── 1. Structural: a registry dish always resolves ──────────────────────────
for (const c of CASES) {
  const resolved = resolveDishVariant(c.dish, c.variant);
  hold('every registry dish/variant resolves to an ingredient list',
    Array.isArray(resolved), `${c.dish} / ${c.variant} resolved to ${resolved}`);
  if (!Array.isArray(resolved)) continue;
  hold('no resolved line has a negative quantity',
    resolved.every(l => l.qty >= 0),
    `${c.dish} / ${c.variant}: ${JSON.stringify(resolved.filter(l => l.qty < 0))}`);
  hold('resolved lines are aggregated, never duplicated by id',
    new Set(resolved.map(l => l.id)).size === resolved.length,
    `${c.dish} / ${c.variant} has a repeated ingredient id`);
}

// ── 2. Randomized price worlds ──────────────────────────────────────────────
const ROUNDS = 400;
for (let r = 0; r < ROUNDS; r++) {
  const c = CASES[Math.floor(rnd() * CASES.length)];

  // A live price world: every ingredient somewhere between a tenth and ten
  // times its baseline. Wide on purpose — a costing bug that only shows up at
  // a 6x beef price is still a costing bug, and beef has moved before.
  const live = {};
  for (const ing of INGREDIENT_SEED) {
    live[ing.id] = Math.max(0, (BASE[ing.id] ?? 0) * between(0.1, 10));
  }

  const info = costDishVariant(c.dish, c.variant, c.menuCost, live, BASE);
  if (!info || info.unknown) continue;

  // Costs are money. Money is not negative.
  hold('no cost figure ever comes out negative',
    info.rawBaseline >= 0 && info.rawCurrent >= 0 && info.adjustedCost >= 0,
    `${c.dish} / ${c.variant}: ${JSON.stringify(info)}`);

  hold('the drift ratio is finite and positive',
    Number.isFinite(info.driftRatio) && info.driftRatio > 0,
    `${c.dish} / ${c.variant}: driftRatio=${info.driftRatio}`);

  hold('adjusted cost is finite',
    Number.isFinite(info.adjustedCost),
    `${c.dish} / ${c.variant}: adjustedCost=${info.adjustedCost}`);

  // ── the identity that matters most ────────────────────────────────────────
  // At baseline prices exactly, nothing has drifted, so the adjusted cost must
  // be the menu anchor untouched. If this ever fails, every margin in the app
  // is being quietly restated for no reason.
  const atBase = costDishVariant(c.dish, c.variant, c.menuCost, BASE, BASE);
  hold('with live prices AT baseline, drift is exactly 1',
    Math.abs(atBase.driftRatio - 1) < 1e-9,
    `${c.dish} / ${c.variant}: driftRatio=${atBase.driftRatio}`);
  hold('with live prices at baseline, the menu cost is left alone',
    typeof c.menuCost !== 'number' || Math.abs(atBase.adjustedCost - c.menuCost) < 0.01,
    `${c.dish} / ${c.variant}: menuCost=${c.menuCost} adjusted=${atBase.adjustedCost}`);
  hold('with live prices at baseline, raw current equals raw baseline',
    Math.abs(atBase.rawCurrent - atBase.rawBaseline) < 0.01,
    `${c.dish} / ${c.variant}: ${atBase.rawCurrent} vs ${atBase.rawBaseline}`);

  // ── monotonicity ─────────────────────────────────────────────────────────
  // Making every ingredient more expensive cannot make a dish cheaper. This is
  // the invariant a sign error or a mis-scaled conversion breaks first.
  const dearer = {};
  for (const k of Object.keys(live)) dearer[k] = live[k] * 2;
  const up = costDishVariant(c.dish, c.variant, c.menuCost, dearer, BASE);
  hold('doubling every ingredient price never lowers the raw cost',
    up.rawCurrent >= info.rawCurrent - 0.01,
    `${c.dish} / ${c.variant}: ${info.rawCurrent} -> ${up.rawCurrent}`);
  hold('doubling every ingredient price never lowers the adjusted cost',
    up.adjustedCost >= info.adjustedCost - 0.01,
    `${c.dish} / ${c.variant}: ${info.adjustedCost} -> ${up.adjustedCost}`);

  // ── scale invariance of the ratio ─────────────────────────────────────────
  // Doubling EVERYTHING should double the drift-eligible ratio, because drift
  // is a ratio of the same basket against itself. Fixed and staple lines are
  // excluded from drift, so this holds on the drift ratio specifically.
  const scaled = costDishVariant(c.dish, c.variant, c.menuCost, dearer, BASE);
  hold('doubling all live prices doubles the drift ratio',
    Math.abs(scaled.driftRatio - info.driftRatio * 2) < 1e-6 || info.driftRatio === 1,
    `${c.dish} / ${c.variant}: ${info.driftRatio} -> ${scaled.driftRatio}`);

  // ── free ingredients ──────────────────────────────────────────────────────
  const free = {};
  for (const k of Object.keys(live)) free[k] = 0;
  const zero = costDishVariant(c.dish, c.variant, c.menuCost, free, BASE);
  hold('if every ingredient is free, raw current is zero',
    Math.abs(zero.rawCurrent) < 0.01,
    `${c.dish} / ${c.variant}: rawCurrent=${zero.rawCurrent}`);
}

// ── 3. The buffer is a display-only division, never a re-multiplication ─────
// The 1.0825 figure is a margin buffer baked into the menu cost anchors — it
// covers the misc-expense tab (power and gas), not ingredient drift. The rule
// is that trueRawCost divides it out for DISPLAY and the engine never puts it
// back. Round-tripping is the cheap way to pin that.
for (let r = 0; r < 200; r++) {
  const buffered = between(0.01, 500);
  const raw = trueRawCost(buffered);
  hold('trueRawCost divides the buffer out, never multiplies it in',
    raw < buffered, `${buffered} -> ${raw}`);
  hold('trueRawCost round-trips back to the buffered figure',
    Math.abs(raw * MARGIN_BUFFER - buffered) < 0.02,
    `${buffered} -> ${raw} -> ${raw * MARGIN_BUFFER}`);
}

// ── 4. Passthrough ingredients ──────────────────────────────────────────────
// A passthrough is sold at cost, so it can never improve a margin. Raising the
// price of ONLY passthrough items must not make a dish look cheaper.
for (let r = 0; r < 100; r++) {
  const c = CASES[Math.floor(rnd() * CASES.length)];
  const base = costDishVariant(c.dish, c.variant, c.menuCost, BASE, BASE);
  if (!base || base.unknown) continue;
  const bumped = { ...BASE };
  for (const id of PASSTHROUGH_IDS) bumped[id] = (BASE[id] ?? 0) * 3;
  const after = costDishVariant(c.dish, c.variant, c.menuCost, bumped, BASE);
  hold('raising only passthrough prices never lowers a dish cost',
    after.rawCurrent >= base.rawCurrent - 0.01,
    `${c.dish} / ${c.variant}: ${base.rawCurrent} -> ${after.rawCurrent}`);
}

// ── 5. An unknown dish degrades honestly ────────────────────────────────────
{
  const info = costDishVariant('Definitely Not A Dish', 'Small', 12.5, BASE, BASE);
  hold('an unknown dish reports unknown rather than guessing zero',
    info && info.unknown === true && info.adjustedCost === 12.5,
    JSON.stringify(info));
  const noAnchor = costDishVariant('Definitely Not A Dish', 'Small', null, BASE, BASE);
  hold('an unknown dish with no menu anchor reports null, not 0',
    noAnchor && noAnchor.adjustedCost === null,
    JSON.stringify(noAnchor));
}

for (const [name, detail] of failures) {
  console.log('  ✗ ' + name + (detail ? '\n      first counterexample: ' + detail : ''));
}
if (failed === 0) {
  console.log(`  ✓ ${CASES.length} dish variants held every costing invariant across ${ROUNDS} random price worlds`);
}
console.log(failed === 0 ? '\nCOSTING PROPERTY: ALL PASS' : `\nCOSTING PROPERTY: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
