// tests/containers.mjs — M1 (inventory, custody, the Sunday report) + M2
// (packaging cost).
//
// The two pins that matter most:
//   1. THE LABELS CROSS-CHECK: orderContainerBreakdown's unit math must
//      agree with buildLabelSheet on the same order. labels.js is the canon
//      for "how many physical packages does a line produce" (the cantaloupe
//      and cookies bugs were both exactly this math) — two implementations
//      that can drift apart silently would eventually disagree on delivery
//      day.
//   2. THE JAR-CANON CONSISTENCY: what this module calls a jar must be
//      exactly what the jar ledger calls a jar, verified through the
//      canonical orderOutboundJars itself, never a copied name list.
//
// Run: node tests/containers.mjs

import assert from 'node:assert';
import {
  CONTAINER_TYPES, CONTAINER_TYPE_ORDER, DEFAULT_OWNED, MEAL_CONTAINER_EPOCH,
  normalizeContainerConfig, containerTypeFor, containerTypesFor, orderContainerBreakdown,
  sumBreakdowns, mealContainersOut, containerReport, packagingCost,
  DISH_CONTAINERS, DEFAULT_DINNER_TYPE,
} from '../src/containers.js';
import { buildLabelSheet } from '../src/labels.js';
import { DISHES, ALWAYS_ITEMS } from '../src/dishes.js';
import { orderOutboundJars } from '../src/utils.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

const DINNER = DISHES[0].name;
const DINNER_VARIANT = (DISHES[0].variants && DISHES[0].variants[0] && DISHES[0].variants[0].label) || 'Small (~4)';
// A real jar item straight from the registry, found via the CANONICAL rule.
const allAlways = Object.values(ALWAYS_ITEMS).flat();
const jarItem = allAlways.find(it => orderOutboundJars({ items: [{ name: it.name, qty: 1 }] }) > 0);
ok(jarItem, `the registry actually contains a jar-shipping item (found: ${jarItem && jarItem.name})`);
// A real non-jar always item (dessert/fruit/etc).
const trinket = allAlways.find(it => orderOutboundJars({ items: [{ name: it.name, qty: 1 }] }) === 0);
ok(trinket, `the registry contains a non-jar always item (found: ${trinket && trinket.name})`);

// ── Config normalization ────────────────────────────────────────────────────
const cfg = normalizeContainerConfig(null);
ok(CONTAINER_TYPE_ORDER.every(t => cfg.owned[t] === DEFAULT_OWNED[t]),
  'a fresh install starts at Kevin\'s stated counts (5 each, 12 jars)');
ok(normalizeContainerConfig({ owned: { rect38: 40, jar: -3 } }).owned.rect38 === 40,
  'stored counts win over defaults');
ok(normalizeContainerConfig({ owned: { jar: -3 } }).owned.jar === DEFAULT_OWNED.jar,
  'a negative owned count is nonsense and falls back to the default');
ok(normalizeContainerConfig({ mealAdjust: 2.9 }).mealAdjust === 2,
  'manual adjustment floors to a whole container');

// ── Typing ──────────────────────────────────────────────────────────────────
ok(containerTypeFor({ name: DINNER }) === 'round32',
  'a plain dinner defaults to the 32 oz round — Kevin: a small (~4 servings) of anything saucy fits it almost perfectly');
ok(DEFAULT_DINNER_TYPE === 'round32', 'the 38 oz rectangle is NOT the dinner default; it is for awkward components');
// The two compositions Kevin described, expanded per unit.
const tea = 'Tea-Smoked Chicken with Dashi Polenta and Alabama White Sauce';
ok(DISH_CONTAINERS[tea] && containerTypesFor({ name: tea }).join() === 'rect38,round16,round8',
  'the tea-smoked chicken occupies a rectangle (chicken), a 16 oz (polenta), and an 8 oz (white sauce)');
ok(containerTypesFor({ name: DINNER }).length === 1, 'a dish with no composition entry is a single container');
ok(containerTypeFor({ name: jarItem.name }) === 'jar',
  'a jar item types as jar — via the CANONICAL orderOutboundJars rule, not a copied list');
ok(containerTypeFor({ name: 'NY Strip', perLb: true }) === 'bag',
  'a per-lb cut is a sous vide BAG — a consumable, never one of the five reusable types');
ok(containerTypeFor(null) === null, 'a null item types as null, never throws');

// ── THE LABELS CROSS-CHECK ──────────────────────────────────────────────────
// Same order through both implementations: total physical CONTAINERS must
// match labels.js's containerTotal exactly. (buildLabelSheet counts every
// physical package including bags; the breakdown's container+bag total must
// equal it.)
const crossOrder = {
  id: 'x1', customer: 'Cross Check', status: 'Confirmed',
  items: [
    { name: DINNER, variant: DINNER_VARIANT, qty: 2 },          // per-qty → 2 packages
    { name: jarItem.name, variant: jarItem.variants ? jarItem.variants[0].label : '', qty: 1 },
    { name: trinket.name, variant: '', qty: 3 },                 // single or per-qty per its packaging
    { name: 'NY Strip', variant: 'price by weight', qty: 3, weight: 2.1, perLb: true },
  ],
};
const sheet = buildLabelSheet([crossOrder]);
const bd = orderContainerBreakdown(crossOrder);
const bdTotal = bd.rect38 + bd.round8 + bd.round16 + bd.round32 + bd.jar + bd.bag;
// labels.js counts PACKAGES (one per line, per its packaging rule). This
// module counts CONTAINERS, and a multi-component dinner is several
// containers inside one package-line. So the totals are equal EXCEPT for the
// extra containers contributed by DISH_CONTAINERS compositions — and that
// difference must be exactly accountable, or the two have silently drifted.
let expectedExtra = 0;
for (const it of crossOrder.items) {
  const comp = DISH_CONTAINERS[it.name];
  if (comp) expectedExtra += (comp.length - 1) * (Number(it.qty) || 1);
}
ok(bdTotal === sheet.containerTotal + expectedExtra,
  `breakdown (${bdTotal}) = labels containerTotal (${sheet.containerTotal}) + composition extras (${expectedExtra}) — the unit math cannot drift from the labels canon`);
ok(bd.round32 >= 2, 'the two plain dinners produced two 32 oz rounds');
ok(bd.jar === 1, 'the jar item produced one jar');

// A multi-component dinner expands into its real containers, per unit.
const multi = orderContainerBreakdown({ items: [{ name: tea, variant: 'Small (~4 servings)', qty: 2 }] });
ok(multi.rect38 === 2 && multi.round16 === 2 && multi.round8 === 2,
  'two tea-smoked chickens occupy two of each of its three container types');

// Omakase lines are priced, not packed, until they become real items.
ok(orderContainerBreakdown({ items: [{ name: 'Omakase', omakase: true, qty: 1 }] }).rect38 === 0,
  'an omakase placeholder produces no containers');

// ── Custody: the meal pool and the spillover rule ───────────────────────────
const AFTER = new Date(MEAL_CONTAINER_EPOCH + 86400000).toISOString();
const BEFORE = new Date(MEAL_CONTAINER_EPOCH - 86400000).toISOString();
const mk = (over) => ({ id: over.id, customer: 'C', status: 'Delivered', createdAt: AFTER,
  items: [{ name: DINNER, variant: DINNER_VARIANT, qty: 2 }], ...over });

ok(mealContainersOut([mk({ id: 'a' })], null) === 2, 'a delivered 2-dinner order puts 2 meal containers out');
ok(mealContainersOut([mk({ id: 'b', createdAt: BEFORE })], null) === 0,
  'pre-epoch orders never count — forward-only, same as the jar ledger');
ok(mealContainersOut([mk({ id: 'c', status: 'Confirmed', archived: false })], null) === 0,
  'an undelivered order has not put anything out yet');
ok(mealContainersOut([mk({ id: 'd', status: 'Confirmed', archived: true })], null) === 2,
  'archived counts as gone-out — archiving is bookkeeping, the containers still left');

// Spillover: returns beyond the customer's jars credit the meal pool.
// Regular r1: one delivered order with 2 dinners (2 meal containers) and 1
// jar out; a return of 3 logged later. Jar ledger absorbs 1, floor discards
// 2 — those 2 are the meal containers coming home.
const spillOrders = [
  { id: 's1', regularId: 'r1', status: 'Delivered', createdAt: AFTER,
    items: [{ name: DINNER, variant: DINNER_VARIANT, qty: 2 }, { name: jarItem.name, qty: 1 }] },
  { id: 's2', regularId: 'r1', status: 'Delivered', createdAt: AFTER, containerReturns: 3,
    items: [{ name: trinket.name, qty: 1 }] },
];
const spillTrinketUnits = orderContainerBreakdown({ items: [{ name: trinket.name, qty: 1 }] });
const trinketMeal = spillTrinketUnits.round16 + spillTrinketUnits.round8 + spillTrinketUnits.round32 + spillTrinketUnits.rect38;
ok(mealContainersOut(spillOrders, null) === 2 + trinketMeal - 2,
  'the spillover the jar ledger floors away credits the meal pool — one logged return feeds both ledgers with no double-count');

// Manual override, Kevin's explicit ask.
ok(mealContainersOut([mk({ id: 'e' })], { mealAdjust: -2 }) === 0, 'negative manual adjust reduces the pool');
ok(mealContainersOut([mk({ id: 'f' })], { mealAdjust: -99 }) === 0, 'the pool floors at zero, never negative');
ok(mealContainersOut([mk({ id: 'g' })], { mealAdjust: 3 }) === 5, 'positive manual adjust adds containers the math cannot see');

// ── The Sunday report ───────────────────────────────────────────────────────
const week = [
  // 6 dinners across active orders against 5 owned rectangles → a shortage of 1.
  { id: 'w1', status: 'Confirmed', createdAt: AFTER, items: [{ name: DINNER, variant: DINNER_VARIANT, qty: 4 }] },
  { id: 'w2', status: 'Cooking', createdAt: AFTER, items: [{ name: DINNER, variant: DINNER_VARIANT, qty: 2 }] },
  // Delivered order must NOT count toward next week's demand.
  mk({ id: 'w3' }),
];
const report = containerReport(week, [], null);
const roundRow = report.rows.find(r => r.type === 'round32');
ok(roundRow.need === 6 && roundRow.have === 5 && roundRow.short === 1,
  'the Sunday check: 6 of the 32 oz rounds needed, 5 owned, shortage of 1 — surfaced Sunday, not Wednesday morning');
ok(report.shortages.length === 1 && report.shortages[0].type === 'round32',
  'only the genuinely short type is flagged');
ok(report.rows.find(r => r.type === 'jar').have === 12, 'jar availability starts from the 12 owned');

// Jars held by a regular reduce jar availability.
const jarWeek = [
  { id: 'j1', regularId: 'rr', status: 'Delivered', createdAt: AFTER, items: [{ name: jarItem.name, qty: 3 }] },
  { id: 'j2', status: 'Confirmed', createdAt: AFTER, items: [{ name: jarItem.name, qty: 10 }] },
];
const jarReport = containerReport(jarWeek, [{ id: 'rr' }], null);
const jarRow = jarReport.rows.find(r => r.type === 'jar');
ok(jarRow.have === 9 && jarRow.need === 10 && jarRow.short === 1,
  'jars: 12 owned − 3 held = 9 available against 10 needed → short 1 (the ledger feeds the Sunday check)');

// ── M2: packaging cost, display-only ────────────────────────────────────────
const costWeek = [
  { id: 'c1', status: 'Delivered', createdAt: AFTER,
    items: [{ name: DINNER, variant: DINNER_VARIANT, qty: 2 }, { name: jarItem.name, qty: 1 }] },
];
const pc = packagingCost(costWeek);
ok(pc.perType.round32.units === 2 && pc.perType.round32.cost === 1.16,
  'two 32 oz rounds cost $1.16 at $0.58 each');
ok(pc.perType.jar.units === 1 && pc.perType.jar.cost === 1.12, 'one jar costs $1.12');
ok(pc.total === Math.round((1.16 + 1.12 + pc.perType.round8.cost + pc.perType.round16.cost + pc.perType.rect38.cost) * 100) / 100,
  'the total is the sum of the per-type costs, rounded to cents');
ok(typeof pc.bags === 'number', 'bags are COUNTED (uncosted) so the number exists the day Kevin prices them');

console.log(`CONTAINERS: ALL PASS (${pass} checks)`);
