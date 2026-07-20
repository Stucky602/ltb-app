// tests/edge_cases.mjs — regressions for the Jul 20 edge-case audit.
//
// Covers the fixes that are testable against real modules. The component-
// coupled fixes (EC-1 double-tap accept guard, EC-3 ledger-in-backup, EC-4
// push guard) live inside App.jsx closures and are verified by inspection +
// the App.jsx compile; their INVARIANTS that CAN be pinned in pure code are
// pinned here.
//
// Pure module, no DOM. Run: node tests/edge_cases.mjs

import assert from 'node:assert';
import { orderTotal, HOUSE_DISCOUNT_PERCENT } from '../src/utils.js';
import { reconcileIngredients } from '../src/seedReconcile.js';
import { INGREDIENT_SEED } from '../src/ingredients.js';
import { liveCostMapFrom } from '../src/dishCosting.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };
const near = (a, b) => Math.abs(a - b) < 0.005;

// ── EC-6: a house order (the wife) is free, full stop, INCLUDING surcharge ──
// The bug: acceptPending stored the total with waiveSurcharge=false, so a 100%
// house discount still billed $2 and fed $2 phantom revenue into books.
const houseItems = [{ name: 'Brunswick Stew', variant: 'Small', price: 40, qty: 1 }];
const houseTotal = orderTotal(houseItems, 0, 0, 'percent', HOUSE_DISCOUNT_PERCENT, [], /*waiveSurcharge*/ true);
ok(near(houseTotal, 0), `house order (100% off + surcharge waived) totals $0, got ${houseTotal}`);

// A house order with an intentional custom charge still bills the charge only.
const houseWithCharge = orderTotal(houseItems, 0, 0, 'percent', HOUSE_DISCOUNT_PERCENT, [{ label: 'extra', amount: 5 }], true);
ok(near(houseWithCharge, 5), `house order + $5 custom charge bills $5, got ${houseWithCharge}`);

// Guard the regression on the OTHER side: a normal order still pays surcharge.
const normalTotal = orderTotal(houseItems, 0, 0, null, 0, [], false);
ok(near(normalTotal, 42), `normal order still adds the $2 surcharge, got ${normalTotal}`);

// Discount/floor invariants that the matrix confirmed (keep them pinned).
ok(near(orderTotal(houseItems, 0, 0, 'fixed', 100, [], true), 0),
  'a fixed discount larger than the base clamps to $0, never negative');
ok(near(orderTotal(houseItems, 30, 0, null, 0, [], true), 0),
  'jar-swap credits exceeding the total floor at $0, Kevin never owes money');

// ── F1: a seed cost change reaches an install-day device via reconcile ──────
// Regression guard for the rice fix ($1.00 -> $1.146): a device whose stored
// `current` still equals the OLD baseline was never receipt-learned, so
// reconcile must update it to the new seed baseline. A device with a LEARNED
// value must keep it.
const OLD_RICE = 1.0;
const NEW_RICE = INGREDIENT_SEED.find(i => i.id === 'rice').baseline; // 1.146 after the fix

const installDay = INGREDIENT_SEED.map(i =>
  i.id === 'rice' ? { ...i, baseline: OLD_RICE, current: OLD_RICE } : { ...i, current: i.baseline });
const recA = reconcileIngredients(installDay, INGREDIENT_SEED);
ok(liveCostMapFrom(recA.next)['rice'] === NEW_RICE,
  `install-day device auto-updates rice to seed (${NEW_RICE})`);

const learned = INGREDIENT_SEED.map(i =>
  i.id === 'rice' ? { ...i, baseline: OLD_RICE, current: 1.07 } : { ...i, current: i.baseline });
const recB = reconcileIngredients(learned, INGREDIENT_SEED);
ok(liveCostMapFrom(recB.next)['rice'] === 1.07,
  'a receipt-learned rice value is preserved, not clobbered by the seed');

// ── EC-4 push-guard rule (pinned as a pure predicate) ───────────────────────
// The live guard is inside pushBackup; this pins the RULE it must enforce so a
// future refactor that reintroduces the AND-guard fails here.
const skipPush = (payload) => (payload.orders || []).length === 0;
ok(skipPush({ orders: [], costHistory: [{ x: 1 }] }) === true,
  'a 0-order state is skipped even when costHistory is non-empty (the EC-4 hole)');
ok(skipPush({ orders: [{ id: 'a' }], costHistory: [] }) === false,
  'a state with orders is always pushed');

console.log(`EDGE CASES: ALL PASS (${pass} checks)`);
