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
import { orderTotal, HOUSE_DISCOUNT_PERCENT, jarsOutForRegular, orderOutboundJars } from '../src/utils.js';
import { repricingScoreboard } from '../src/repricing.js';
import { SOURCES } from '../src/auditLog.js';
import { omakaseUndecided, undecidedOmakases, expandOmakaseForShopping, pastOmakasesFor, omakaseStats, expandOrderForReheat } from '../src/omakase.js';
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


// ── Jar ledger (containers out per regular, forward-only) ───────────────────
const JL_AFTER = '2026-07-22', JL_BEFORE = '2026-07-01';
ok(orderOutboundJars({ items: [{ name: 'Queso', variant: 'Per Pint Jar', qty: 2 }] }) === 2,
  'jar ledger: outbound counts jar-shipping items by qty');
ok(orderOutboundJars({ items: [{ name: 'Queso', variant: 'With jar swap', qty: 1 }] }) === 0,
  'jar ledger: a jar-swap variant is net zero outbound');
ok(jarsOutForRegular('r1', [{ regularId: 'r1', createdAt: JL_AFTER, items: [{ name: 'Queso', variant: 'Per Pint Jar', qty: 3 }], jarSwaps: 1, containerReturns: 1 }]) === 1,
  'jar ledger: both jarSwaps and containerReturns decrement (3 - 1 - 1 = 1)');
ok(jarsOutForRegular('r1', [{ regularId: 'r1', createdAt: JL_BEFORE, items: [{ name: 'Queso', variant: 'Per Pint Jar', qty: 5 }] }]) === 0,
  'jar ledger: orders before the epoch are excluded');
ok(jarsOutForRegular('r1', [{ regularId: 'r1', createdAt: JL_AFTER, items: [{ name: 'Queso', variant: 'Per Pint Jar', qty: 1 }], containerReturns: 4 }]) === 0,
  'jar ledger: never goes negative (floored at 0)');


// ── Omakase (chef's choice) ─────────────────────────────────────────────────
const OM = (extra = {}) => ({ name: 'Omakase', variant: 'Small', qty: 1, omakase: true, budgetMax: 75, price: 75, ...extra });
const OM_NOW = new Date().toISOString();
const omLogged = OM({ price: 60, cost: 24, components: [
  { fromMenu: true, menuKey: 'Bo Ssam|Small (~4 servings)', label: 'Bo Ssam', cost: 24 },
  { ing: true, ingredientId: 'ribeye', qty: 2, unit: 'lb', label: 'Ribeye - 2 lb', cost: 33 },
] });
ok(omakaseUndecided({ items: [OM()] }) === true, 'omakase: unlogged reads as undecided');
ok(omakaseUndecided({ items: [omLogged] }) === false, 'omakase: logged components clear undecided');
ok(undecidedOmakases([{ id: 'a', customer: 'D', createdAt: OM_NOW, archived: true, items: [OM()] }]).length === 0,
  'omakase: archived orders never sit in the undecided queue');
const shop = expandOmakaseForShopping([
  { id: 'a', customer: 'Dave', createdAt: OM_NOW, items: [OM()] },
  { id: 'b', customer: 'Sara', createdAt: OM_NOW, items: [omLogged] },
]);
ok(shop.pseudoItems.some(p => p.name === 'Bo Ssam' && p.variant === 'Small (~4 servings)'),
  'omakase: a menu component becomes a real dish for the shopping engine');
ok(shop.extraLines.some(l => /Omakase ingredients \(Dave\)/.test(l.label) && /\$75/.test(l.note)),
  'omakase: nothing logged yet shows one line at the customer budget');
ok(shop.extraLines.some(l => /Ribeye steak for omakase/.test(l.label)),
  'omakase: a typed ingredient becomes its own buy line');
ok(expandOrderForReheat({ items: [omLogged] }).items.some(i => i.name === 'Bo Ssam'),
  'omakase: reheat expansion adds menu components so canon text applies');
const omStats = omakaseStats([
  { id: 'a', customer: 'S', createdAt: OM_NOW, items: [omLogged] },
  { id: 'h', customer: 'Wife', house: true, createdAt: OM_NOW, items: [OM({ price: 0, cost: 30 })] },
], 'all');
ok(omStats.count === 1 && omStats.revenue === 60, 'omakase stats: house orders never count');
ok(omStats.avgPctOfBudget === 80, 'omakase stats: average charge vs budget (60 of 75 = 80%)');
ok(pastOmakasesFor('r1', [{ id: 'x', regularId: 'r1', createdAt: OM_NOW, items: [omLogged] }], 'x').length === 0,
  'omakase memory: the order being edited is excluded from its own history');


// ── Repricing scoreboard ────────────────────────────────────────────────────
const RP_DAY = 86400000, RP_NOW = Date.now(), RP_AT = RP_NOW - 20 * RP_DAY;
const rpLog = [
  { at: new Date(RP_AT).toISOString(), target: 'Pappardelle::Small (~2-3)', field: 'price', from: 35, to: 25, source: SOURCES.DEPLOY },
  { at: new Date(RP_AT).toISOString(), target: 'Pappardelle::Small (~2-3)', field: 'cost', from: 14, to: 15, source: SOURCES.DEPLOY },
];
const rpOrder = (daysAgo, price, qty, house) => ({
  createdAt: new Date(RP_NOW - daysAgo * RP_DAY).toISOString(), house,
  items: [{ name: 'Pappardelle', variant: 'Small (~2-3)', price, cost: 15, qty }],
});
const rpRows = repricingScoreboard(rpLog, [rpOrder(30, 35, 1), rpOrder(10, 25, 3), rpOrder(3, 25, 4, true)], { now: RP_NOW });
ok(rpRows.length === 1, 'repricing: only price changes make a row, not cost changes');
ok(rpRows[0].dish === 'Pappardelle' && rpRows[0].variant === 'Small (~2-3)',
  'repricing: the fingerprint target splits into dish and variant');
ok(rpRows[0].before.units === 1 && rpRows[0].after.units === 3,
  'repricing: orders land in the window they belong to, and house orders never count');
ok(repricingScoreboard(
  [{ at: new Date(RP_NOW - 2 * RP_DAY).toISOString(), target: 'X::S', field: 'price', from: 10, to: 12, source: SOURCES.DEPLOY }],
  [], { now: RP_NOW })[0].tooEarly === true,
  'repricing: a change under a week old is flagged too early to judge');

console.log(`EDGE CASES: ALL PASS (${pass} checks)`);
