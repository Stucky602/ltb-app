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
  normalizeContainerConfig, containerTypesFor, orderContainerBreakdown,
  sumBreakdowns, mealContainersOut, containerReport, packagingCost,
  DISH_CONTAINERS, DEFAULT_DINNER_TYPE, emptyBreakdown,
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
ok(DEFAULT_DINNER_TYPE === 'round32', 'the 38 oz rectangle is NOT the dinner default; it is for awkward components');
// The two compositions Kevin described, expanded per unit.
const tea = 'Tea-Smoked Chicken with Dashi Polenta and Alabama White Sauce';
// SUPERSEDED BY THE JUL 26 AUDIT. This asserted rect38 + round16 + round8,
// which was the INFERRED mapping. Kevin's dish-by-dish audit says the polenta
// goes in a BAG, not a 16 oz round: "r8 = alabama white, rect38 = chicken,
// bag = polenta or grits". The audit is the authority; this assertion was
// pinning a guess.
const t = containerTypesFor({ name: tea, variant: 'Small (~4)' });
ok(t.includes('rect38') && t.includes('round8') && t.includes('bag'),
  'the tea-smoked chicken occupies a rectangle (chicken), an 8 oz (white sauce), and a bag (polenta)');
ok(containerTypesFor({ name: DINNER }).length === 1, 'a dish with no composition entry is a single container');

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
// Summed from the REGISTRY. This was a hand-written list of six types and
// silently dropped round48 and rectXL the moment they were registered, which
// made the invariant compare a partial total against a full one. Third time
// this exact class of staleness has bitten in containers.js and its tests: if
// you are typing out container type names by hand, you are writing tomorrow's
// bug.
const bdTotal = [...CONTAINER_TYPE_ORDER, 'bag'].reduce((n, t) => n + (bd[t] || 0), 0);
// labels.js counts PACKAGES (one per line, per its packaging rule). This
// module counts CONTAINERS, and a multi-component dinner is several
// containers inside one package-line. So the totals are equal EXCEPT for the
// extra containers contributed by DISH_CONTAINERS compositions — and that
// difference must be exactly accountable, or the two have silently drifted.
// Reads the mapping as COUNTS. This was `comp.length - 1`, which worked while
// the mapping was an array of type names and silently returns undefined now
// that it is an object of quantities — turning the whole sum into NaN, which
// then compares false against everything without ever looking wrong.
let expectedExtra = 0;
for (const it of crossOrder.items) {
  const comp = DISH_CONTAINERS[it.name];
  if (!comp) continue;
  const units = containerTypesFor(it).length;
  expectedExtra += (units - 1) * (Number(it.qty) || 1);
}
ok(bdTotal === sheet.containerTotal + expectedExtra,
  `breakdown (${bdTotal}) = labels containerTotal (${sheet.containerTotal}) + composition extras (${expectedExtra}) — the unit math cannot drift from the labels canon`);
// SUPERSEDED BY THE JUL 26 AUDIT. This asserted that two dinners with no
// composition entry fell through to the round32 default. Both now HAVE audited
// mappings, so nothing falls through — which is the point of the audit. The
// invariant worth keeping is that they produced tracked containers at all.
ok([...CONTAINER_TYPE_ORDER].reduce((n, t) => n + (bd[t] || 0), 0) >= 2,
  'the dinners in the fixture produced tracked containers from their audited mappings');
ok(bd.jar === 1, 'the jar item produced one jar');

// A multi-component dinner expands into its real containers, per unit.
const multi = orderContainerBreakdown({ items: [{ name: tea, variant: 'Small (~4 servings)', qty: 2 }] });
// SUPERSEDED BY THE JUL 26 AUDIT, same correction as above: the polenta is a
// BAG, not a 16 oz round. Quantities still multiply by order qty, which is the
// property this was really testing.
ok(multi.rect38 === 2 && multi.round8 === 2 && multi.bag === 2,
  'two tea-smoked chickens occupy two of each of its audited components');

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
// FOLLOWS THE JUL 26 AUDIT. The fixture dinner is a braise, so it resolves to a
// round48 rather than the old round32 default. round48 defaults to ZERO owned
// on purpose (Kevin has not stated a real count), so this now demonstrates the
// exact situation he needs to see: a real shortage, surfaced on Sunday rather
// than on Wednesday morning with the food already cooked.
const roundRow = report.rows.find(r => r.type === 'round48');
ok(roundRow.need === 6 && roundRow.have === 0 && roundRow.short === 6,
  'the Sunday check: 6 of the 48 oz needed, 0 owned, shortage of 6 — surfaced Sunday, not Wednesday morning');
ok(report.shortages.length === 1 && report.shortages[0].type === 'round48',
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
// Follows the audit: the fixture dinner is a braise and lands in a round48.
ok(pc.perType.round48.units === 2 && pc.perType.round48.cost === 2.76,
  'two 48 oz cost $2.76 at $1.38 each');
ok(pc.perType.jar.units === 1 && pc.perType.jar.cost === 1.12, 'one jar costs $1.12');
// Summed from the REGISTRY rather than a hand-listed subset. The old form
// hardcoded two literals and three type names, so it drifted the instant the
// fleet changed AND could not have caught a type being dropped from the total.
ok(pc.total === Math.round(CONTAINER_TYPE_ORDER.reduce((n, t) => n + pc.perType[t].cost, 0) * 100) / 100,
  'the total is the sum of every registered type, rounded to cents');
ok(typeof pc.bags === 'number', 'bags are COUNTED (uncosted) so the number exists the day Kevin prices them');

// ── THE AUDIT: what the model does NOT know ─────────────────────────────────
// Only dishes in DISH_CONTAINERS have a confirmed composition. Everything else
// resolves to one container and is undercounted, which means the Sunday check
// could tell Kevin he is fine when he is not. That silence was the real bug;
// a check that states its own confidence is trustworthy, one that guesses is not.
{
  const { containerAuditStatus } = await import('../src/containers.js');
  const audit = containerAuditStatus();
  // THE GAP IS CLOSED. This used to assert that most dishes were UNCONFIRMED,
  // which was correct and was the whole point of the function: make the
  // undercount announce itself rather than let the Sunday check quietly say
  // "you're fine" when it had guessed. Kevin audited all 27 dinners on Jul 26,
  // so the honest assertion is now the opposite one.
  ok(audit.confirmed.length >= 27, `every dinner is confirmed (${audit.confirmed.length})`);
  ok(audit.unconfirmed.length === 0,
    `nothing is left unconfirmed after the Jul 26 audit (${audit.unconfirmed.map(u => u.dish).join(', ')})`);
  ok(audit.complete === true, 'the audit reports itself complete, so demand is a figure and not a floor');
  ok(audit.maxUndercount === 0, 'there is no remaining undercount to warn about');
  // The three assertions that used to sit here pinned the UNFINISHED state and
  // are gone with it. The mechanism is kept, not deleted: if a new dish is
  // added without a composition, unconfirmed goes non-empty again and the
  // shortage check goes back to announcing its own uncertainty.
  ok(audit.unconfirmed.every(u => u.components.length > 1),
    'if anything ever goes unconfirmed again, only genuinely multi-component candidates are listed');

  // NOT auto-populated on purpose: "Orecchiette with Bitter Greens and
  // Anchovies" splits into three by name and is one bowl in reality. Nothing
  // in the data distinguishes it from a genuine three-container plate.
  // This dish was the standing example of why nothing was auto-populated: it
  // splits into three by NAME and is one bowl in reality, and nothing in the
  // data distinguishes it from a genuine three-container plate. It now has a
  // mapping because Kevin CONFIRMED it, and his answer was exactly the one a
  // name-based guess would have got wrong: a single round16.
  const orec = DISH_CONTAINERS['Orecchiette with Bitter Greens and Anchovies'];
  ok(orec && Object.keys(orec).length === 1 && orec.round16 === 1,
    'the audited answer for the one-bowl dish is one container, which name-splitting would have got wrong');

  const rep = containerReport(week, [], null);
  // The whole reason demandIsFloor existed: while compositions were guessed,
  // the shortage check had to say its demand was a lower bound. After the Jul 26
  // audit it is a figure, so the honest assertion flipped. Keep the mechanism —
  // adding an unmapped dish must turn it back on.
  ok(rep.demandIsFloor === false, 'after the audit, demand is a FIGURE and no longer a floor');
  ok(Array.isArray(rep.atRisk), 'the report names types that are fine on paper but could be short after the audit');
  ok(rep.rows.every(r => r.riskCeiling >= r.need), 'the risk ceiling is never below the known demand');
  ok(rep.rows.find(r => r.type === 'jar').riskCeiling === rep.rows.find(r => r.type === 'jar').need,
    'jars carry NO audit risk, because the ledger tracks them exactly');
}


const SAMPLE_ORDERS = [
  { id: 'c1', customer: 'Dave', createdAt: new Date(MEAL_CONTAINER_EPOCH + 86400000).toISOString(),
    status: 'Delivered', archived: true,
    items: [{ name: 'Bo Ssam', variant: 'Small (~4)', qty: 1 }, { name: 'Queso', qty: 1 }] },
]; 


// ── EVERY TALLY MUST COVER EVERY REGISTERED TYPE ────────────────────────────
// Added Jul 26 after two hand-written accumulator literals went stale the
// moment `round48` and `rectXL` were registered. The units for the new types
// came back `undefined`, `undefined * cost` produced NaN, and the packaging
// total silently became NaN without anything throwing. Nothing else in the
// suite noticed, because every other assertion was about the OLD five.
//
// So: assert structurally rather than by count. These pass regardless of how
// many types exist, which is the property the old `=== 5` lacked.
{
  const b = emptyBreakdown();
  for (const t of CONTAINER_TYPE_ORDER) {
    ok(b[t] === 0, `emptyBreakdown seeds ${t}`);
  }
  ok(b.bag === 0, 'emptyBreakdown seeds bag');

  const summed = sumBreakdowns(SAMPLE_ORDERS);
  for (const t of CONTAINER_TYPE_ORDER) {
    ok(Number.isFinite(summed[t]), `sumBreakdowns returns a real number for ${t}`);
  }

  const pc = packagingCost(SAMPLE_ORDERS);
  ok(Number.isFinite(pc.total), 'packaging total is finite across every registered type');
  for (const t of CONTAINER_TYPE_ORDER) {
    ok(pc.perType[t] && Number.isFinite(pc.perType[t].cost),
      `packaging cost is finite for ${t}`);
  }

  // Every registered type must carry a label and a real cost, or the shortage
  // banner renders "undefined" at Kevin on a Sunday.
  for (const t of CONTAINER_TYPE_ORDER) {
    ok(CONTAINER_TYPES[t] && typeof CONTAINER_TYPES[t].label === 'string' && CONTAINER_TYPES[t].label.length > 0,
      `${t} has a label`);
    ok(CONTAINER_TYPES[t] && Number.isFinite(CONTAINER_TYPES[t].cost) && CONTAINER_TYPES[t].cost > 0,
      `${t} has a real cost`);
    ok(Object.prototype.hasOwnProperty.call(DEFAULT_OWNED, t),
      `${t} has a default owned count (0 is fine, missing is not)`);
  }
}


console.log(`CONTAINERS: ALL PASS (${pass} checks)`);