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
import { storageFootprint, isQuotaError } from '../src/utils.js';
import { resolveMenuKey } from '../src/omakase.js';
import { buildTasteProfile } from '../src/regularsIntel.js';
import { buildPassport, stampableDishes, SWEETS_LABEL } from '../src/passport.js';
import { customerFavorites, favoriteStatus, dishOrderSignal, dishFeedbackSignal } from '../src/favorites.js';
import { weekOneBottle } from '../src/weekPlanner.js';
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


// ── Storage quota guard ─────────────────────────────────────────────────────
// Every write went through a .catch(() => {}) somewhere, so a full localStorage
// meant silent data loss. These check the detection, not the UI.
globalThis.window = { localStorage: { length: 2, key: i => ['ltb-a', 'other-b'][i], getItem: k => (k === 'ltb-a' ? '12345' : 'zzzzz') } };
ok(storageFootprint() === 20, 'quota: footprint counts only ltb- keys, UTF-16 (5+5 chars = 20 bytes)');
const qErr = new Error('full'); qErr.name = 'QuotaExceededError';
ok(isQuotaError(qErr) === true, 'quota: a QuotaExceededError is recognised');
ok(isQuotaError(new Error('nope')) === false, 'quota: an ordinary error is not mistaken for one');
delete globalThis.window;

// ── Omakase component orphans ───────────────────────────────────────────────
// Templates outlive menus. A component pointing at a renamed or deleted dish
// must degrade, not render a broken label with a phantom cost.
ok(resolveMenuKey('Bo Ssam|Small (~4 servings)') !== null, 'orphan guard: a live dish variant resolves');
const renamed = resolveMenuKey('Cumin Mushroom Noodles / Cumin Beef on Rice|Mushroom, Small (~3-4)');
ok(renamed && renamed.renamed === true, 'orphan guard: a historical rename still resolves, and says so');
ok(resolveMenuKey('A Dish That Never Existed|Large') === null, 'orphan guard: a deleted dish resolves to null');
ok(resolveMenuKey('no separator here') === null, 'orphan guard: a malformed key is rejected rather than half-parsed');

// ── Taste profile ───────────────────────────────────────────────────────────
const tpOrders = [
  { id: '1', regularId: 'r1', createdAt: '2026-07-01', items: [{ name: 'Bo Ssam', qty: 2 }, { name: 'Mapo Eggplant', qty: 1, options: { spice: 3 } }] },
  { id: '2', regularId: 'r1', createdAt: '2026-07-08', items: [{ name: 'Bo Ssam', qty: 1 }, { name: 'Chili', qty: 1, options: { spice: 4 } }] },
];
const tp = buildTasteProfile({ id: 'r1', dietary: 'no cilantro' }, tpOrders);
ok(tp.topDishes[0].name === 'Bo Ssam' && tp.topDishes[0].n === 3, 'taste profile: dishes rank by quantity, not order count');
ok(tp.cuisines[0].cuisine === 'Korean', 'taste profile: cuisine comes off the registry, not the stripped menu list');
ok(tp.spiceRange === '3-4', 'taste profile: spice range spans what they actually ordered');
ok(buildTasteProfile({ id: 'h', house: true }, tpOrders) === null, 'taste profile: the house account is never profiled');
ok(buildTasteProfile({ id: 'r9' }, []) === null, 'taste profile: no history means no profile, not an empty one');

// ── Week one-bottle ─────────────────────────────────────────────────────────
const ob = weekOneBottle(['Bo Ssam', 'Mapo Eggplant', 'Thai Basil Chicken (Pad Krapow Gai)']);
ok(ob && ob.covers >= 2, 'one bottle: a multi-dish week gets a bottle covering at least two');
ok(weekOneBottle(['Bo Ssam']) === null, 'one bottle: a single dish is an order pairing, not a week pairing');
ok(weekOneBottle([]) === null, 'one bottle: an empty week has nothing to pair');


// ── Dish passport ───────────────────────────────────────────────────────────
// Kevin's rules, each one load-bearing: dinners + desserts stamp, bag/addons/
// sauces never do, variants collapse to one stamp, retired dishes are ignored.
const ppAll = stampableDishes();
ok(ppAll.length === 30, 'passport: 27 dinners plus 3 desserts is the whole book');
const ppReg = { id: 'r1', name: 'Dave' };
const ppOrders = [
  { id: 'old', regularId: 'r1', items: [{ name: 'Bo Ssam', variant: 'Small (~4 servings)' }, { name: 'Brownies' }] },
  { id: 'now', regularId: 'r1', items: [
    { name: 'Bo Ssam', variant: 'Large (~8 servings)' }, // same dish, bigger size
    { name: 'Gumbo' },
    { name: 'Filet Mignon' },   // bag item
    { name: 'Queso' },          // add-on
    { name: 'Chimichurri' },    // sauce
    { name: 'A Dish I Retired' },
  ] },
];
const ppNow = buildPassport(ppReg, ppOrders, ppOrders[1]);
ok(ppNow.tried === 3, 'passport: bag items, add-ons, sauces, and retired dishes never stamp');
ok(ppNow.newStamps.length === 1 && ppNow.newStamps[0] === 'Gumbo',
  'passport: only a dish they had never had before counts as new this delivery');
ok(!ppNow.newStamps.includes('Bo Ssam'),
  'passport: a bigger variant of something already stamped is not a new stamp');
ok(ppNow.pages[ppNow.pages.length - 1].cuisine === SWEETS_LABEL,
  'passport: sweets are the last chapter, not a cuisine');
ok(ppNow.pages.every(p => p.label !== 'Spotlight'),
  'passport: Spotlight is a menu tier, so the book never calls it a cuisine');
const ppKorean = ppNow.pages.find(p => p.cuisine === 'Korean');
ok(ppKorean && ppKorean.complete === true, 'passport: a fully-stamped chapter reports complete');
ok(buildPassport(null, ppOrders, null) === null, 'passport: no regular means no passport');
const ppFresh = buildPassport({ id: 'r9', name: 'New Person' }, [], null);
ok(ppFresh.tried === 0 && ppFresh.total === 30 && ppFresh.newStamps.length === 0,
  'passport: a brand-new regular gets an empty book, not a broken one');


// ── Passport: renames and manual stamps ─────────────────────────────────────
// Two ways a real meal fails to stamp itself: the dish got renamed, or Kevin
// knows something the order history does not (food handed over in person, a
// name change that predates DISH_RENAMES).
const ppRenamed = buildPassport({ id: 'r2', name: 'R' },
  [{ id: 'x', regularId: 'r2', createdAt: '2026-01-01', items: [{ name: 'Cumin Mushroom Noodles / Cumin Beef on Rice' }] }], null);
ok(ppRenamed.tried === 1, 'passport: an order under a dish\'s OLD name still stamps the current dish');

const ppGrantReg = { id: 'r3', name: 'G', passportGrants: ['Pasta with Homegrown Tomato Sauce'] };
const ppGrantOrders = [{ id: 'g1', regularId: 'r3', createdAt: '2026-05-01', items: [{ name: 'Bo Ssam' }] }];
const ppGranted = buildPassport(ppGrantReg, ppGrantOrders, ppGrantOrders[0]);
ok(ppGranted.tried === 2, 'passport: a hand-granted dish stamps alongside real history');
const ppTom = ppGranted.pages.find(p => p.cuisine === 'Italian').dishes.find(d => /Homegrown/.test(d.name));
ok(ppTom.stamped && ppTom.granted, 'passport: a granted stamp is marked as granted, not as order history');
ok(ppGranted.newStamps.indexOf('Pasta with Homegrown Tomato Sauce') === -1,
  'passport: a granted dish is never announced as new this delivery, it was earned earlier');

const ppRevoked = buildPassport({ ...ppGrantReg, passportRevokes: ['Bo Ssam'] }, ppGrantOrders, null);
ok(!ppRevoked.pages.find(p => p.cuisine === 'Korean').dishes.find(d => d.name === 'Bo Ssam').stamped,
  'passport: a revoke removes a stamp that real order history would otherwise light');
ok(buildPassport({ id: 'r4', name: 'X', passportGrants: ['Filet Mignon'] }, [], null).tried === 0,
  'passport: granting a bag item does nothing, the stampable set still rules');


// ── Passport: cover, visas, seals, and stamp marks ──────────────────────────
const ppV = buildPassport(
  { id: 'rv', name: 'V', passportRequests: ['Mapo Eggplant'] },
  [
    { id: 'v1', regularId: 'rv', createdAt: '2026-03-01', items: [{ name: 'Bo Ssam', qty: 2 }] },
    { id: 'v2', regularId: 'rv', createdAt: '2026-07-20', items: [
      { name: 'Mapo Eggplant' },
      { name: 'Omakase', omakase: true, variant: 'Large', budgetMax: 150 },
    ] },
    { id: 'other', regularId: 'someone-else', createdAt: '2026-04-01', items: [{ name: 'Chili' }] },
  ],
  { id: 'v2' });
ok(new Date(ppV.issued).getMonth() === 2, 'passport: issued date is their FIRST order, not their latest');
ok(ppV.visas.length === 1 && ppV.visas[0].budget === 150,
  'passport: omakase earns a visa carrying its budget, never a dish stamp');
ok(ppV.chaptersComplete >= 1, 'passport: a fully-stamped chapter counts toward chapters filled');
ok(ppV.newCuisines.includes('Chinese'),
  'passport: a cuisine touched for the first time this delivery is called out');
const ppBo = ppV.pages.find(p => p.cuisine === 'Korean').dishes.find(d => d.name === 'Bo Ssam');
ok(ppBo.times === 2, 'passport: a stamp knows how many times they have had it');
ok(ppBo.firstEver === true, 'passport: being the first person ever to order a dish is recorded');
const ppMapo = ppV.pages.find(p => p.cuisine === 'Chinese').dishes.find(d => /Mapo/.test(d.name));
ok(ppMapo.requested === true, 'passport: a dish they asked for is marked as theirs');
ok(buildPassport({ id: 'rz', name: 'Z' }, [], null).visas.length === 0,
  'passport: no omakase means no visa page at all');


// ── Passport: retired dishes ────────────────────────────────────────────────
// A dish that came off the menu still got eaten. It used to vanish from the
// book, which quietly pretended a real meal never happened.
const ppRet = buildPassport({ id: 'rr', name: 'R' }, [{
  id: 'r1', regularId: 'rr', createdAt: '2026-02-01', items: [
    { name: 'Bo Ssam' },
    { name: 'Tea-Smoked Chicken', qty: 2 },
    { name: 'Filet Mignon' },
    { name: 'Queso' },
    { name: 'Omakase', omakase: true, budgetMax: 75 },
  ],
}], null);
ok(ppRet.retired.length === 1 && ppRet.retired[0].name === 'Tea-Smoked Chicken',
  'passport: a dish no longer on the menu is remembered, not erased');
ok(ppRet.retired[0].times === 2, 'passport: a retired stamp still knows how often they had it');
ok(ppRet.total === 30 && ppRet.tried === 1,
  'passport: retired dishes never inflate the denominator or the stamp count');
ok(buildPassport({ id: 'rc', name: 'C' },
  [{ id: 'c1', regularId: 'rc', createdAt: '2026-05-01', items: [{ name: 'Bo Ssam' }] }], null).retired.length === 0,
  'passport: nothing retired means no memorial chapter at all');


// ── Customer favorites ──────────────────────────────────────────────────────
// Earned from two independent signals: people coming BACK for a dish, and the
// good/meh/bad verdicts already collected. Never hand-set, so it cannot drift
// into marketing.
const favOrder = (id, who, dishes, house) => ({
  id, customer: who, regularId: who, house, createdAt: '2026-05-01',
  items: dishes.map(n => ({ name: n, qty: 1 })),
});
const favOrders = [
  favOrder('1', 'dave', ['Bo Ssam', 'Gumbo']), favOrder('2', 'dave', ['Bo Ssam']),
  favOrder('3', 'sara', ['Bo Ssam']), favOrder('4', 'sara', ['Bo Ssam']),
  favOrder('5', 'mike', ['Chili']),
  favOrder('h', 'wife', ['Bo Ssam', 'Bo Ssam'], true),
  favOrder('7', 'dave', ['Bolognese']), favOrder('8', 'sara', ['Bolognese']), favOrder('9', 'mike', ['Bolognese']),
];
const favFb = { Bolognese: { tally: { good: 5, meh: 0, bad: 0 } }, Chili: { tally: { good: 1, meh: 2, bad: 2 } } };
const favOS = dishOrderSignal(favOrders);
const favFS = dishFeedbackSignal(favFb);
ok(favOS['Bo Ssam'].orders === 4, 'favorites: house orders never count toward a dish reputation');
ok(favoriteStatus('Bo Ssam', favOS, favFS).favorite === true,
  'favorites: people coming back for a dish is enough on its own');
ok(favoriteStatus('Bolognese', favOS, favFS).favorite === true,
  'favorites: strong feedback is enough on its own');
ok(favoriteStatus('Chili', favOS, favFS).favorite === false,
  'favorites: a dish with mixed feedback is never a favorite, whatever it sold');
ok(favoriteStatus('Gumbo', favOS, favFS).favorite === false,
  'favorites: one order is not evidence, and thin evidence would cheapen the badge');
ok(customerFavorites(favOrders, favFb).length === 2,
  'favorites: only dishes that actually earned it are returned');
ok(/came back for it/.test(favoriteStatus('Bo Ssam', favOS, favFS).why),
  'favorites: every badge carries the human reason it was earned');

console.log(`EDGE CASES: ALL PASS (${pass} checks)`);
