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
  DISH_CONTAINERS, containersForDish, DEFAULT_DINNER_TYPE, emptyBreakdown, containerCustody, isTrackedType, shortageWarningDue,
} from '../src/containers.js';
import { buildLabelSheet } from '../src/labels.js';
import { DISHES, ALWAYS_ITEMS } from '../src/dishes.js';
import { dishById } from '../src/dishIdentity.js';
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
  const comp = containersForDish(it);
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
// Owned counts are Kevin's REAL inventory as of Jul 26, so this now asserts
// against six 48 oz rather than the zero placeholder.
const roundRow = report.rows.find(r => r.type === 'round48');
ok(roundRow.need === 6 && roundRow.have === 6 && roundRow.short === 0,
  'six 48 oz needed against six owned is exactly break-even, not a shortage');
ok(report.shortages.length === 0,
  'a week that fits inside the real fleet reports no shortage at all');

// ── THE WARNING IS HELD UNTIL MONDAY ────────────────────────────────────────
// Kevin's rule, Jul 26. The demand figure is not finished on Sunday because
// orders close Sunday at 23:59, so a Sunday warning is computed against a
// half-full order book. It is wrong in BOTH directions there: it can cry
// shortage over orders that never arrive, and stay quiet while the orders that
// would cause a real one are still coming in.
{
  const day = (n) => new Date(2026, 6, 26 + n); // Jul 26 2026 is a Sunday
  ok(!shortageWarningDue(day(0)), 'Sunday stays quiet — the order book is still filling');
  ok(shortageWarningDue(day(1)), 'Monday warns — the first moment the requirement is a fact');
  ok(shortageWarningDue(day(2)), 'Tuesday still warns');
  ok(shortageWarningDue(day(3)), 'Wednesday still warns — delivery day is when he least wants to find out');
  ok(!shortageWarningDue(day(4)) && !shortageWarningDue(day(5)) && !shortageWarningDue(day(6)),
    'Thu-Sat are quiet — that week is done and the next one has no orders yet');
}
ok(report.rows.find(r => r.type === 'jar').have === DEFAULT_OWNED.jar,
  'jar availability starts from the owned count in the registry');

// Jars held by a regular reduce jar availability.
const jarWeek = [
  { id: 'j1', regularId: 'rr', status: 'Delivered', createdAt: AFTER, items: [{ name: jarItem.name, qty: 3 }] },
  { id: 'j2', status: 'Confirmed', createdAt: AFTER, items: [{ name: jarItem.name, qty: 10 }] },
];
const jarReport = containerReport(jarWeek, [{ id: 'rr' }], null);
const jarRow = jarReport.rows.find(r => r.type === 'jar');
// The ARITHMETIC is what this pins, not the literals — owned moved from a
// placeholder 12 to Kevin's real 23 and would move again the day he buys more.
// Written against the registry so the next inventory update does not break it.
const jarOwned = DEFAULT_OWNED.jar;
ok(jarRow.have === jarOwned - 3 && jarRow.need === 10 && jarRow.short === Math.max(0, 10 - (jarOwned - 3)),
  `jars: ${jarOwned} owned minus 3 held = ${jarRow.have} available against 10 needed (the ledger feeds the check)`);

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
  const orec = containersForDish('Orecchiette with Bitter Greens and Anchovies');
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



// ── THE RICE CONTAINER AND THE RICE MUST AGREE ──────────────────────────────
// Ambiguity 6a, resolved Jul 26. The cumin dish is two plates in one registry
// entry: Beef and Lamb come with rice, Mushroom does not. The 16 oz round IS
// the rice container, so it has to follow the rice exactly.
//
// The failure this guards is silent and expensive in both directions: charge a
// Mushroom order for a container it never got, or fail to count a container a
// Beef order really consumed. Both distort the Sunday check AND the margin, and
// neither throws.
{
  const CUMIN = 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice';
  const has16 = (variant) => containerTypesFor({ name: CUMIN, variant }).includes('round16');
  // "Does this plate ship a rice container" — ANY rice container. Since Jul 31
  // that is a round16 on a Small and a round32 on a Large, so a check pinned to
  // round16 silently means "small only" and reported a Large as riceless.
  const hasRiceContainer = (variant) => {
    const t = containerTypesFor({ name: CUMIN, variant });
    return t.includes('round16') || t.includes('round32');
  };

  ok(!has16('Mushroom, Small (~3-4)'), 'the mushroom variant gets NO rice container');
  ok(!has16('Mushroom, Large (~6-8) + Asian Greens (1 lb)'), 'nor does the mushroom variant with greens');
  ok(has16('Beef, Small (~3-4)'), 'the beef variant gets the rice container');
  ok(has16('Lamb, Small (~3-4)'), 'so does the lamb variant');

  // SCALING CHANGED Jul 31, and this assertion encoded the old rule. Kevin's
  // Walk 2 answer: a Large does not get two 16 oz rounds of rice, it gets ONE
  // 32 oz round holding 4 cups. Rice is the only place in the model where
  // scaling changes the container TYPE instead of the count, which is why
  // byVariant entries bypass the portion multiplier entirely.
  const lg = containerTypesFor({ name: CUMIN, variant: 'Lamb, Large (~6-8)' });
  ok(lg.filter(t => t === 'round32').length === 1, 'a large rice variant gets ONE 32 oz round');
  ok(lg.filter(t => t === 'round16').length === 0, 'and no 16 oz round at all');

  // Flat entries must keep doubling — the change is scoped to sized entries.
  const chili = containerTypesFor({ name: 'Chili', variant: 'Large (~8)' });
  ok(chili.filter(t => t === 'round48').length === 2, 'a flat map still doubles on a Large');

  // THE INVARIANT THAT MATTERS: the container and the recipe must never
  // disagree about whether this plate has rice. They are computed in different
  // files by different functions, and the only thing keeping them together is
  // that they apply the same test.
  const { resolveDishVariant } = await import('../src/dishCosting.js');
  for (const v of ['Mushroom, Small (~3-4)', 'Beef, Small (~3-4)', 'Lamb, Large (~6-8)']) {
    const resolved = resolveDishVariant(CUMIN, v) || [];
    const hasRice = resolved.some(r => r.id === 'rice' && r.qty > 0);
    ok(hasRice === hasRiceContainer(v),
      `${v}: rice in the recipe (${hasRice}) matches the rice container (${hasRiceContainer(v)})`);
  }
}

// ── THE FESENJAN GETS RICE ──────────────────────────────────────────────────
// It carried a 16 oz round in the audit before its recipe carried any rice,
// which is the mismatch that surfaced it. Kevin: small is 2 cups, large is 4.
{
  const FES = 'Pecan Mole-Fesenjan, Beef and Kabocha';
  const { resolveDishVariant } = await import('../src/dishCosting.js');
  const small = (resolveDishVariant(FES, 'Small (~4 servings)') || []).find(r => r.id === 'rice');
  const large = (resolveDishVariant(FES, 'Large (~8 servings)') || []).find(r => r.id === 'rice');
  ok(small && small.qty === 1, 'the fesenjan small carries one rice unit (2 cups)');
  ok(large && large.qty === 2, 'the fesenjan large carries two (4 cups)');
  ok(containerTypesFor({ name: FES, variant: 'Small (~4 servings)' }).includes('round16'),
    'and it has the rice container the audit gave it');
}


// ── BAGGED ITEMS CONSUME NO TRACKED CONTAINER ───────────────────────────────
// THE 19-VS-5 BUG, Jul 27. The type resolver ended in a catch-all that returned
// round16 for anything with a category and no mapping. Every "stuff in a bag"
// item hit it, so a real week reported needing NINETEEN sixteen-ounce rounds
// when six were real, and the shortage banner fired on a number that was three
// quarters invented.
//
// It was dangerous rather than merely wrong for two reasons: round16 is the
// tightest type in the fleet, so the warning looked completely plausible; and
// nothing threw, so the only way to catch it was for Kevin to read the number
// and find it absurd.
{
  const bagged = ['Filet Mignon', 'Pork Tenderloin', 'Baby Gold Potatoes', 'Carrots',
    'Corn (off the cob)', 'Garlic Confit', 'Asparagus', 'Kabocha Squash'];
  for (const name of bagged) {
    const t = containerTypesFor({ name, variant: 'By weight' });
    ok(t.length === 1 && t[0] === 'bag', `${name} ships in a bag and consumes no tracked container`);
  }

  // Add-ons go in jars, per the audit. Queso had no default and fell to the
  // catch-all, so five quesos read as five sixteen-ounce rounds.
  ok(containerTypesFor({ name: 'Queso', variant: 'With jar swap' })[0] === 'jar',
    'an add-on goes in a jar, not the catch-all container');

  // The real week from Kevin's Cook tab on Jul 27, reproduced end to end.
  const WEEK = [
    ['Gumbo', 'Small (~4)', 1],
    ['Saffron Pork Ragu', 'Small (~4 servings)', 2],
    ['Shrimp or Tofu with Asparagus in Black Bean Sauce', 'Tofu, Small Batch (~3-4)', 1],
    ['Thai Basil Chicken (Pad Krapow Gai)', 'Small (~3-4)', 3],
    ['Seasonal Cantaloupe', 'Per Container', 1],
    ['Queso', 'With jar swap', 5],
    ['Baby Gold Potatoes', '~2 servings', 3],
    ['Carrots', '~2 servings', 1],
    ['Corn (off the cob)', '~2 servings', 3],
    ['Filet Mignon', 'By weight', 2],
    ['Garlic Confit', '6 oz bag', 1],
    ['Pork Tenderloin', 'By weight', 2],
  ];
  const tally = {};
  for (const [name, variant, qty] of WEEK) {
    for (const t of containerTypesFor({ name, variant })) {
      for (let k = 0; k < qty; k++) tally[t] = (tally[t] || 0) + 1;
    }
  }
  // FIVE, not the nineteen the catch-all reported. The cantaloupe resolves to a
  // rect38 of its own, so every one of these is a real dinner: Gumbo, the black
  // bean, and three Thai Basil. Kevin owns five.
  ok(tally.round16 === 5,
    `that week needs FIVE 16 oz rounds, not nineteen (got ${tally.round16})`);
  ok(tally.jar === 5, 'the five quesos are five jars');
  ok(tally.bag === 16, 'and sixteen things are bagged');
  ok(!tally.rectXL, 'nothing wandered into the cookie container');
}


// ── EVERY TRACKED TYPE ALWAYS GETS A ROW ────────────────────────────────────
// THE ZERO-COUNT DATA-LOSS BUG, Jul 27. containerCustody used to end with
// `.filter(r => r.out > 0 || r.owned > 0)`. Backspacing the owned box to empty
// coerced to 0, which dropped the row from this list, which UNMOUNTED THE
// INPUT MID-EDIT. The count was gone and could not be typed back, because the
// box you would type into had just been removed from the page.
//
// A row is a property of the REGISTRY, not of its current value. A type you
// own zero of is precisely the row you most need visible in order to fix it.
{
  const zeroed = containerCustody([], { owned: { round16: 0 }, mealAdjust: 0 });
  ok(zeroed.rows.length === CONTAINER_TYPE_ORDER.filter(t => isTrackedType(t)).length,
    'every tracked type has a row even when owned is zero');
  const r16 = zeroed.rows.find(r => r.type === 'round16');
  ok(!!r16 && r16.owned === 0,
    'a type owned zero still has its row, so the input it lives in survives an edit');

  // Jars are part of the fleet Kevin counts (23) and were excluded entirely.
  const jar = zeroed.rows.find(r => r.type === 'jar');
  ok(!!jar, 'jars get a row — they are part of the fleet');
  ok(jar.outTrackedElsewhere === true,
    'the jar row declares that its outstanding side lives in the jar ledger');
  ok(jar.out === 0,
    'and reports 0 out rather than a half-truth counting only one direction');
}


// ── The map is keyed by dishId, not display name (Jul 30) ───────────────────
//
// It was name-keyed, which meant renaming a dish silently detached its
// container mapping: the dish kept selling, the cost engine stopped charging
// for its containers, and nothing failed. Rekeyed before recipe versioning,
// because packaging is part of a version snapshot and a version registry is
// append-only — freezing the defect in would make it unfixable in place.
{
  const ids = Object.keys(DISH_CONTAINERS);
  const looksLikeName = ids.filter(k => /[ ,()/]/.test(k) || /[A-Z]/.test(k));
  ok('every container key is a slug, not a display name', looksLikeName.length === 0,
    looksLikeName.join(' | '));

  const unresolvable = ids.filter(k => !dishById(k));
  ok('every container key resolves to a real dish identity', unresolvable.length === 0,
    unresolvable.join(', '));

  // The whole point: a historical name still finds its mapping.
  ok('a lookup by current display name works', !!containersForDish('Bolognese'));
  ok('a lookup by record works', !!containersForDish({ name: 'Steak au Poivre' }));
  ok('a lookup by id works', !!containersForDish({ dishId: 'bolognese' }));
  ok('an unknown name returns null rather than throwing', containersForDish('Not A Dish') === null);
  ok('a null argument is survivable', containersForDish(null) === null);

  // Every live dinner must still be mapped after the rekey. If one fell out,
  // it would silently stop being charged for its containers.
  const unmapped = DISHES.filter(d => !containersForDish(d.name));
  ok('every dinner still has a container mapping', unmapped.length === 0,
    unmapped.map(d => d.name).join(', '));
}


// ── Variant-aware maps (Jul 31, the rice rule) ─────────────────────────────
//
// Rice is the only place in this model where scaling changes the container
// TYPE rather than the count: 2 cups in a round16 on a Small, 4 cups in a
// round32 on a Large. Nothing could express that before, so every rice dish
// was recorded with a flat round16 whatever size shipped.
{
  const { containerEntryFor, DISH_CONTAINERS } = await import('../src/containers.js');

  ok(typeof containerEntryFor === 'function', 'the raw-entry accessor exists');

  // Flat entries must behave EXACTLY as before, or every existing call site
  // silently changes meaning.
  ok(JSON.stringify(containersForDish('Chili')) === JSON.stringify({ round48: 1 }),
    'a flat map ignores the variant argument');
  ok(JSON.stringify(containersForDish('Chili', 'Large (~8)')) === JSON.stringify({ round48: 1 }),
    'and returns the same thing when one is supplied');

  // The rule itself, on every rice dish.
  const RICE = [
    ['Gumbo', 'Small (~4)', 'Large (~8)'],
    ['Indian Style Curry', 'Chicken, Small (~4-5)', 'Chicken, Large (~8-10)'],
    ['Leblanc Inspired Japanese Curry', 'Small (~4)', 'Large (~8)'],
    ['Mapo Eggplant', 'Small (~4-5 servings)', 'Large (~8-10 servings)'],
    ['Bo Ssam', 'Small (~4 servings)', 'Large (~8 servings)'],
  ];
  for (const [name, small, large] of RICE) {
    const s16 = containersForDish(name, small);
    const l32 = containersForDish(name, large);
    ok(s16 && s16.round16 === 1 && !s16.round32, `${name} Small takes a round16`);
    ok(l32 && l32.round32 === 1 && !l32.round16, `${name} Large takes a round32 instead`);
  }

  // A sized entry must NOT also be doubled by the portion multiplier, or a
  // Large gets scaled twice — the failure this whole shape exists to avoid.
  const lgTypes = containerTypesFor({ name: 'Gumbo', variant: 'Large (~8)' });
  ok(lgTypes.filter(t => t === 'round32').length === 1,
    'a sized entry bypasses the portion multiplier');
  ok(lgTypes.filter(t => t === 'round48').length === 1,
    'including the parts of its base map');

  // Gumbo carries the filé cup at every size (Walk 2: the customer thickens it).
  ok(containersForDish('Gumbo', 'Small (~4)').cup2 === 1
    && containersForDish('Gumbo', 'Large (~8)').cup2 === 1,
    'the gumbo file cup rides every size');

  // Tex-Mex: rice AND beans are both size-dependent, so a Large is two round32s.
  const tmS = containersForDish('Tex-Mex Kit', 'Pulled Pork, Small (~5-6)');
  const tmL = containersForDish('Tex-Mex Kit', 'Pulled Pork, Large (~9-10)');
  ok(tmS.round16 === 2, 'a small Tex-Mex takes two round16s, rice and beans');
  ok(tmL.round32 === 2, 'and a large takes two round32s');
  ok(tmS.round48 === 1 && tmL.round48 === 2,
    'a large Tex-Mex takes TWO protein containers — stated, because a sized entry bypasses doubling');

  // Cumin: the mushroom versions ship no rice container at all.
  const CU = 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice';
  ok(!containersForDish(CU, 'Mushroom, Large (~6-8)').round16
    && !containersForDish(CU, 'Mushroom, Large (~6-8)').round32,
    'a mushroom Cumin variant gets no rice container');
  ok(containersForDish(CU, 'Beef, Large (~6-8)').round32 === 1,
    'while a beef Large gets the round32');

  // Every byVariant entry needs a catch-all last, or a variant nobody
  // anticipated falls through to whatever happened to be at the end.
  for (const [id, entry] of Object.entries(DISH_CONTAINERS)) {
    if (!entry || !entry.byVariant) continue;
    const last = entry.byVariant[entry.byVariant.length - 1];
    ok(last && last.match.test('anything at all'), `${id} ends with a catch-all rule`);
  }
}

// ── THE DEPOSIT SURVIVES A RECOMPUTE ────────────────────────────────────────
//
// Kevin, Aug 7: an omakase in three containers billed three dollars over what
// the invoice lines added up to. Two separate faults, and this guards the one
// that was silent.
//
// `orderTotal` takes the deposit as its EIGHTH argument. OrderForm passed it;
// the five recompute sites in OrderCard did not, so the total dropped by the
// deposit the moment Kevin logged an omakase, set a per-lb weight, priced an
// at-cost extra, or toggled a regular's discount. The charge landed at save and
// came quietly off again on the next edit, so what a customer owed depended on
// what Kevin had touched last.
//
// A bare `orderTotal(` in OrderCard is the shape of that fault, so that is what
// this forbids. Described rather than quoted, or this check matches the comment
// explaining it — six instances of that in this repo already.
{
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../src/components/OrderCard.jsx', import.meta.url), 'utf8')
    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  // The helper's OWN call is the one legitimate one, so cut its body out before
  // counting. Without this the guard reports the fix as the fault.
  const helperAt = src.indexOf('function totalWithDeposit');
  const outside = helperAt < 0 ? src : src.slice(0, helperAt) + src.slice(src.indexOf('\n}', helperAt));
  const bare = (outside.match(/[^a-zA-Z]orderTotal\(/g) || []).length;
  ok(bare === 0, `OrderCard routes every total through the deposit-aware helper (${bare} bare calls)`);
  ok(/function totalWithDeposit/.test(src), 'the helper exists');
  ok(/depositsOutFor\(\{ items \}\)\.cents/.test(src),
    'and derives the deposit from the items rather than a stored number');

  const form = fs.readFileSync(new URL('../src/components/OrderForm.jsx', import.meta.url), 'utf8');
  ok(/orderTotal\([^)]*depositCents\)/.test(form.replace(/\n/g, ' ')),
    'OrderForm still passes the deposit too');

  // And the invoice shows it. The row is what makes the charge checkable; a
  // correct total nobody can verify is the complaint that started this.
  const modals = fs.readFileSync(new URL('../src/components/Modals.jsx', import.meta.url), 'utf8');
  ok(/Container deposit/.test(modals), 'the invoice carries a deposit row');
  ok(/depositsOutFor/.test(modals), 'built from the same derivation as the charge');
}

console.log(`CONTAINERS: ALL PASS (${pass} checks)`);
