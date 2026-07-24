// tests/kitchen_weight.mjs — V6 phase 1: the kitchen page's weight ceiling.
//
// THE PROBLEM THIS SOLVES: the worker REJECTS a companion page over 200,000
// characters. As of Jul 23 the page sits around 140k and it grows every time
// anything is added to companion.js — the passport alone doubled that file.
// Nothing measured it, so the failure mode was: Kevin ships a feature, the
// page silently crosses the line, and a customer's kitchen link 500s on
// delivery day with no warning that anything changed.
//
// This is the WALL ANNOUNCING ITSELF. It fails the build at 180k, leaving
// 20k of headroom to actually do something about it, rather than discovering
// the ceiling by hitting it in production.
//
// DELIBERATELY PHASE 1 ONLY: this measures, it does not optimize. Slimming
// the passport markup is phase 2 and happens only if this trips. Do not
// pre-optimize on the strength of this file existing.
//
// Run: node tests/kitchen_weight.mjs

import assert from 'node:assert';
import { existsSync } from 'node:fs';

// The worker's hard limit, from worker.js. If that number ever changes,
// change it HERE too — a stale copy of a ceiling is worse than no check.
const WORKER_CEILING = 200000;
// Fail here, not at the ceiling. The gap is the point: a build that fails at
// 180k is a problem Kevin can schedule, a page that 500s at 200k is a
// problem that finds him mid-delivery.
const FAIL_AT = 180000;
// Report loudly from here, so the trend is visible long before it bites.
const WARN_AT = 150000;

let failed = 0;
const check = (name, cond, extra) => {
  if (cond) console.log('  ✓ ' + name);
  else { failed++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};

const companionPath = new URL('../src/companion.js', import.meta.url);
if (!existsSync(companionPath)) {
  // A partial checkout is normal in scratch work; a MISSING companion.js in
  // the real tree is caught by checkRepoStructure, not here.
  console.log('KITCHEN WEIGHT: SKIPPED (companion.js not present in this checkout)');
  process.exit(0);
}

const { companionHtml } = await import('../src/companion.js');
const { DISHES } = await import('../src/dishes.js');
const { buildPassport } = await import('../src/passport.js');

// ── The worst realistic case, not a toy ─────────────────────────────────────
// Page weight is dominated by the PASSPORT (every dish the customer has ever
// eaten, grouped into cuisine chapters) plus the reheat blocks for the
// current order. So the fixture is a long-tenured regular who has eaten
// EVERYTHING — that is the real ceiling, and it is a customer Kevin could
// plausibly have in a few years, not a synthetic stress test.
const everyDish = DISHES.map((d, i) => ({
  id: 'o' + i,
  customer: 'Long-Tenured Regular',
  regularId: 'r1',
  createdAt: new Date(2024, 0, 1 + i).toISOString(),
  items: [{
    name: d.name,
    variant: (d.variants && d.variants[0] && d.variants[0].label) || '',
    qty: 1,
    price: (d.variants && d.variants[0] && d.variants[0].price) || 40,
    cost: 20,
  }],
}));

// A big current order on top: several dinners at once, each contributing its
// own reheat block to the page.
const bigOrder = {
  id: 'current',
  customer: 'Long-Tenured Regular',
  regularId: 'r1',
  createdAt: new Date().toISOString(),
  items: DISHES.slice(0, 6).map(d => ({
    name: d.name,
    variant: (d.variants && d.variants[0] && d.variants[0].label) || '',
    qty: 2,
    price: (d.variants && d.variants[0] && d.variants[0].price) || 40,
    cost: 20,
  })),
};

const regular = { id: 'r1', names: ['Long-Tenured Regular'], name: 'Long-Tenured Regular' };
const allOrders = [...everyDish, bigOrder];

let passport = null;
try {
  passport = buildPassport(regular, allOrders, bigOrder);
} catch (e) {
  check('buildPassport runs for the worst-case regular', false, String(e && e.message));
}

const html = companionHtml(bigOrder, 'weight-check', passport ? { passport } : undefined);
const size = html.length;

const pct = ((size / WORKER_CEILING) * 100).toFixed(1);
console.log(`  kitchen page worst case: ${size.toLocaleString()} chars (${pct}% of the ${WORKER_CEILING.toLocaleString()} worker ceiling)`);

check(
  `kitchen page stays under the ${FAIL_AT.toLocaleString()}-char build threshold`,
  size < FAIL_AT,
  `it is ${size.toLocaleString()} chars, ${(size - FAIL_AT).toLocaleString()} over. The worker REJECTS at ${WORKER_CEILING.toLocaleString()}, so this is the warning shot, not the wall. Phase 2 (slimming passport markup/CSS in companion.js) is now due.`
);

if (size >= WARN_AT && size < FAIL_AT) {
  console.log(`  ⚠ WEIGHT WATCH: ${size.toLocaleString()} chars is past the ${WARN_AT.toLocaleString()} advisory line. Still passing, but measure again before adding anything large to companion.js.`);
}

// A page that renders EMPTY would also be "under the ceiling" — make sure the
// check can never pass by producing nothing.
check('the measured page is real, not an empty string', size > 1000, `only ${size} chars — companionHtml produced nothing meaningful`);

// The passport is the dominant contributor, so pin that it actually rendered
// in the fixture. If it silently produced nothing, this test would be
// measuring a much lighter page than the real worst case and would go green
// while the true ceiling crept up unwatched.
if (passport) {
  check('the worst-case fixture actually includes a rendered passport',
    /pp-|passport/i.test(html),
    'no passport markup found — the fixture is not measuring the real worst case');
}

console.log(failed === 0 ? '\nKITCHEN WEIGHT: ALL PASS' : `\nKITCHEN WEIGHT: ${failed} FAILURE(S)`);
process.exit(failed ? 1 : 0);
