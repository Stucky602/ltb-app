// Property-based tests for the order money math (utils.js orderTotal chain).
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS: the invariant suite covers costing, recipes, equipment,
// receipts, and cost-basis — but zero checks touched orderTotal, the one
// function whose silent failure costs real dollars weekly. orderTotal
// composes seven terms (base, upcharges, discount, custom charges, surcharge,
// jar swaps, container returns) and money bugs hide in the COMPOSITION, not
// in any single term. So: thousands of randomized order configurations, each
// checked against invariants that must hold for every possible order.
//
// Reproducibility: the run seed prints at start; re-run a failure exactly
// with  PROP_SEED=<seed> node tests/property.mjs
//
// THE MONEY INVARIANTS (each was Kevin-approved in the Batch 2 plan):
//   I1  total is never negative
//   I2  parts sum to the whole (independent reference recomputation)
//   I3  discount never exceeds the items base (and is never negative)
//   I4  re-running with identical inputs is stable (determinism)
//   I5  adding an item never DECREASES the total
//   I6  crediting one more container return never INCREASES the total
//   I7  waiving the surcharge changes the total by exactly SURCHARGE
//       (except where the $0 floor absorbs it)
//   I8  totals are exact to the cent (round2'd, no float dust)
// Plus targeted fixtures for the named danger cases: 100% discount +
// surcharge, fixed discount > base, over-credited returns, hostile
// (negative / >100%) discount values.
// ═══════════════════════════════════════════════════════════════════════════
import {
  orderTotal, itemsBaseTotal, itemsUpchargeTotal, customChargesTotal,
  discountAmount, round2,
} from '../src/utils.js';
import { SURCHARGE } from '../src/config.js';

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
const SEED = Number(process.env.PROP_SEED) || (Date.now() >>> 0);
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const ri = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;   // int inclusive
const rf = (min, max) => round2(rnd() * (max - min) + min);           // 2dp float
const pick = (arr) => arr[ri(0, arr.length - 1)];

// ── Random order-config generator ────────────────────────────────────────────
// Deliberately includes hostile-but-reachable inputs: missing qty (defaults
// to 1), zero prices, negative custom charges (ad-hoc credits), discount
// values beyond 100%, negative discount values, heavy container returns.
function genItems() {
  const n = ri(0, 8);
  const items = [];
  for (let i = 0; i < n; i++) {
    const it = { name: 'Item' + i, price: rf(0, 150) };
    if (rnd() < 0.85) it.qty = ri(1, 6); // 15%: qty absent → defaults to 1
    if (rnd() < 0.3) it.upcharge = { label: 'up', amount: rf(0, 20) };
    items.push(it);
  }
  return items;
}
function genConfig() {
  const discountType = pick([null, null, 'percent', 'fixed']);
  let discountValue = 0;
  if (discountType === 'percent') discountValue = pick([ri(0, 100), ri(0, 100), ri(101, 250), -ri(1, 50)]);
  if (discountType === 'fixed') discountValue = pick([rf(0, 120), rf(0, 120), rf(120, 600), -rf(1, 60)]);
  const customCharges = [];
  const nc = ri(0, 3);
  for (let i = 0; i < nc; i++) customCharges.push({ label: 'c' + i, amount: pick([rf(0, 50), rf(0, 50), -rf(1, 25)]) });
  return {
    items: genItems(),
    jarSwaps: ri(0, 10),
    containerReturns: pick([ri(0, 6), ri(0, 6), ri(0, 40)]),
    discountType, discountValue, customCharges,
    waiveSurcharge: rnd() < 0.25,
  };
}
const runTotal = (c) => orderTotal(c.items, c.jarSwaps, c.containerReturns, c.discountType, c.discountValue, c.customCharges, c.waiveSurcharge);

// ── Independent reference implementation (I2) ────────────────────────────────
// Recomputes the composition from first principles — same business rules,
// written separately so a bug in utils.js can't hide in its own mirror.
// Rules: discount applies to items BASE only (upcharges untouched by it),
// discount is clamped to [0, base], final total is clamped at $0.
function referenceTotal(c) {
  const base = round2((c.items || []).reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0));
  const up = round2((c.items || []).reduce((s, it) => s + ((it.upcharge && typeof it.upcharge.amount === 'number') ? it.upcharge.amount : 0) * (Number(it.qty) || 1), 0));
  const custom = round2((c.customCharges || []).reduce((s, ch) => s + (Number(ch.amount) || 0), 0));
  let disc = 0;
  if (c.discountType === 'percent' && c.discountValue) disc = round2(base * (c.discountValue / 100));
  if (c.discountType === 'fixed' && c.discountValue) disc = round2(c.discountValue);
  disc = Math.min(Math.max(disc, 0), base); // never negative, never exceeds base
  const sur = c.waiveSurcharge ? 0 : SURCHARGE;
  return Math.max(0, round2(base + up - disc + custom + sur - (c.jarSwaps || 0) * 2 - (c.containerReturns || 0) * 1));
}

// ── Harness ──────────────────────────────────────────────────────────────────
let failed = 0;
let firstFailures = [];
const fail = (inv, msg, cfg) => {
  failed++;
  if (firstFailures.length < 5) firstFailures.push(`  ✗ [${inv}] ${msg}\n     config: ${JSON.stringify(cfg)}`);
};
const check = (name, cond, extra = '') => {
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond ? '' : '  ' + extra));
  if (!cond) failed++;
};

console.log(`PROPERTY SUITE — seed ${SEED} (re-run exactly: PROP_SEED=${SEED} node tests/property.mjs)\n`);

// ── Randomized sweep ─────────────────────────────────────────────────────────
const RUNS = 5000;
let sweepFails = 0;
for (let i = 0; i < RUNS; i++) {
  const c = genConfig();
  const t = runTotal(c);
  const before = failed;

  // I1 — never negative
  if (!(t >= 0)) fail('I1', `total ${t} < 0`, c);

  // I2 — parts sum to whole (reference recomputation)
  const ref = referenceTotal(c);
  if (Math.abs(t - ref) > 0.005) fail('I2', `orderTotal ${t} ≠ reference ${ref}`, c);

  // I3 — discount within [0, base]
  const base = itemsBaseTotal(c.items);
  const d = discountAmount(base, c.discountType, c.discountValue);
  if (!(d >= 0)) fail('I3', `discount ${d} negative`, c);
  if (!(d <= base + 0.005)) fail('I3', `discount ${d} exceeds base ${base}`, c);

  // I4 — determinism
  if (runTotal(c) !== t) fail('I4', 'same inputs, different total', c);

  // I5 — adding an item never decreases the total
  const c5 = { ...c, items: [...c.items, { name: 'extra', price: rf(1, 50), qty: 1 }] };
  if (runTotal(c5) < t - 0.005) fail('I5', `adding item dropped total ${t} → ${runTotal(c5)}`, c);

  // I6 — one more container return never increases the total
  const c6 = { ...c, containerReturns: (c.containerReturns || 0) + 1 };
  if (runTotal(c6) > t + 0.005) fail('I6', `extra return RAISED total ${t} → ${runTotal(c6)}`, c);

  // I7 — waive removes exactly SURCHARGE unless the $0 floor absorbs it
  const cw = { ...c, waiveSurcharge: true };
  const cn = { ...c, waiveSurcharge: false };
  const tw = runTotal(cw); const tn = runTotal(cn);
  const diff = round2(tn - tw);
  if (!(diff === SURCHARGE || (tw === 0 && diff >= 0 && diff <= SURCHARGE))) {
    fail('I7', `waive delta ${diff}, expected ${SURCHARGE} (or floor-absorbed)`, c);
  }

  // I8 — exact to the cent
  if (round2(t) !== t) fail('I8', `total ${t} not cent-exact`, c);

  if (failed > before) sweepFails++;
  if (firstFailures.length >= 5 && failed > 200) break; // enough evidence
}
check(`randomized sweep: ${RUNS} configs × 8 invariants`, sweepFails === 0, `${sweepFails} failing configs`);
if (firstFailures.length) console.log(firstFailures.join('\n'));

// ── Targeted fixtures — the named danger cases ───────────────────────────────
console.log('\nTargeted fixtures:');
const items2 = [{ name: 'Gumbo', price: 50, qty: 1 }, { name: 'Chili', price: 45, qty: 2, upcharge: { label: 'egg papp', amount: 10 } }];
// base = 50 + 90 = 140, upcharges = 20

check('plain order: base+up+surcharge', runTotal({ items: items2, jarSwaps: 0, containerReturns: 0, discountType: null, discountValue: 0, customCharges: [], waiveSurcharge: false }) === 162);

check('100% discount + surcharge: base zeroes, upcharges/surcharge remain',
  runTotal({ items: items2, jarSwaps: 0, containerReturns: 0, discountType: 'percent', discountValue: 100, customCharges: [], waiveSurcharge: false }) === 22);

check('fixed discount > base caps at base (not below)',
  runTotal({ items: items2, jarSwaps: 0, containerReturns: 0, discountType: 'fixed', discountValue: 500, customCharges: [], waiveSurcharge: false }) === 22);

check('percent > 100 caps at base — cannot mint money',
  runTotal({ items: items2, jarSwaps: 0, containerReturns: 0, discountType: 'percent', discountValue: 250, customCharges: [], waiveSurcharge: false }) === 22);

check('negative discount value cannot RAISE the total',
  runTotal({ items: items2, jarSwaps: 0, containerReturns: 0, discountType: 'fixed', discountValue: -50, customCharges: [], waiveSurcharge: false }) === 162);

check('over-credited container returns floor at $0, never negative',
  runTotal({ items: [{ name: 'Waffles', price: 7, qty: 1 }], jarSwaps: 0, containerReturns: 40, discountType: null, discountValue: 0, customCharges: [], waiveSurcharge: false }) === 0);

check('jar swaps subtract $2 each',
  runTotal({ items: items2, jarSwaps: 3, containerReturns: 0, discountType: null, discountValue: 0, customCharges: [], waiveSurcharge: false }) === 156);

check('negative custom charge acts as manual credit (still floored at 0 overall)',
  runTotal({ items: [{ name: 'Cookies', price: 25, qty: 1 }], jarSwaps: 0, containerReturns: 0, discountType: null, discountValue: 0, customCharges: [{ label: 'sorry', amount: -10 }], waiveSurcharge: false }) === 17);

check('empty order = surcharge only (current business behavior, pinned)',
  runTotal({ items: [], jarSwaps: 0, containerReturns: 0, discountType: null, discountValue: 0, customCharges: [], waiveSurcharge: false }) === SURCHARGE);

check('empty order + waive = $0',
  runTotal({ items: [], jarSwaps: 0, containerReturns: 0, discountType: null, discountValue: 0, customCharges: [], waiveSurcharge: true }) === 0);

check('qty absent defaults to 1',
  runTotal({ items: [{ name: 'Pineapple', price: 6 }], jarSwaps: 0, containerReturns: 0, discountType: null, discountValue: 0, customCharges: [], waiveSurcharge: false }) === 8);

check('discount applies to BASE only — upcharges never discounted',
  // base 100, up 10; 50% off → 50 + 10 + 2 = 62 (NOT 55+2)
  runTotal({ items: [{ name: 'X', price: 100, qty: 1, upcharge: { label: 'u', amount: 10 } }], jarSwaps: 0, containerReturns: 0, discountType: 'percent', discountValue: 50, customCharges: [], waiveSurcharge: false }) === 62);

console.log(failed === 0 ? '\nPROPERTY SUITE: ALL PASS' : `\nPROPERTY SUITE: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
