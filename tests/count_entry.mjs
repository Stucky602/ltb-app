// tests/count_entry.mjs — the count prompt's math.
//
// The bug: "24 FRESH CORN ... 2.25" is a line TOTAL with no count (the 24 is
// a PLU). derivePerUnit's last resort treats a bare line_total as the per-unit
// price, so the app concluded $2.25/ear. Kevin bought nine. Every dish using
// corn was 9x high on that line, silently.
//
// perUnitFromUserCount is the escape hatch, and the twin of the weight entry
// that already existed for lb/oz items. These tests pin the math and, more
// importantly, pin WHICH ingredients may be asked — offering "how many did you
// buy?" for a per-pound item is nonsense, and offering it for a per-pack item
// duplicates the packQty prompt.

import assert from 'node:assert/strict';
import { perUnitFromUserCount, shouldAskCount, COUNT_ENTRY_UNITS, WEIGHT_ENTRY_UNITS, derivePerUnit, convertPerUnit, SOLD_BY_EACH, EACHISH_TO_UNITS } from '../src/receiptMatch.js';
import { INGREDIENT_SEED } from '../src/ingredients.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed += 1; }
  catch (e) { console.error(`\n[count-entry] FAIL: ${name}\n  ${e.message}\n`); process.exit(1); }
};

// ── The corn case ─────────────────────────────────────────────────────────
test('the corn case: $2.25 over 9 ears is $0.25/ear', () => {
  const r = perUnitFromUserCount({ total: 2.25, count: 9, ingUnit: 'ear' });
  assert.equal(r.perUnit, 0.25);
  assert.equal(r.count, 9);
});

test('derivePerUnit still gets corn wrong on its own (why the prompt exists)', () => {
  // No printed unit price, not weighed, no quantity: the raw total leaks out
  // as the per-unit price. This is the behaviour the prompt overrides. If this
  // ever starts passing, the prompt may no longer be needed here.
  const line = { item_name: 'FRESH CORN', line_total: 2.25, quantity: null, unit: null, weighed: false };
  const d = derivePerUnit(line);
  assert.equal(d.perUnit, 2.25);
  assert.equal(d.basis, 'line_total');
});

test('lemons: $3.00 over 6 is $0.50 each', () => {
  assert.equal(perUnitFromUserCount({ total: 3, count: 6, ingUnit: 'each' }).perUnit, 0.5);
});

// ── Guards: a bad derivation must never reach a cost ──────────────────────
test('count of zero returns null, not Infinity', () => {
  assert.equal(perUnitFromUserCount({ total: 2.25, count: 0, ingUnit: 'ear' }), null);
});

test('negative and non-finite inputs return null', () => {
  assert.equal(perUnitFromUserCount({ total: 2.25, count: -3, ingUnit: 'ear' }), null);
  assert.equal(perUnitFromUserCount({ total: -1, count: 3, ingUnit: 'ear' }), null);
  assert.equal(perUnitFromUserCount({ total: 0, count: 3, ingUnit: 'ear' }), null);
  assert.equal(perUnitFromUserCount({ total: NaN, count: 3, ingUnit: 'ear' }), null);
  assert.equal(perUnitFromUserCount({ total: 2.25, count: NaN, ingUnit: 'ear' }), null);
  assert.equal(perUnitFromUserCount({ total: Infinity, count: 3, ingUnit: 'ear' }), null);
});

test('blank/undefined count returns null rather than dividing by nothing', () => {
  assert.equal(perUnitFromUserCount({ total: 2.25, count: '', ingUnit: 'ear' }), null);
  assert.equal(perUnitFromUserCount({ total: 2.25, count: undefined, ingUnit: 'ear' }), null);
});

test('fractional counts work (half a melon is a real thing to buy)', () => {
  const r = perUnitFromUserCount({ total: 1.5, count: 0.5, ingUnit: 'each' });
  assert.equal(r.perUnit, 3);
});

// ── Which units may be asked ──────────────────────────────────────────────
test('a per-lb ingredient is never asked how many', () => {
  assert.equal(perUnitFromUserCount({ total: 5, count: 2, ingUnit: 'lb' }), null);
  assert.equal(perUnitFromUserCount({ total: 5, count: 2, ingUnit: 'oz' }), null);
  assert.equal(perUnitFromUserCount({ total: 5, count: 2, ingUnit: 'g' }), null);
});

test('a portioned unit is never asked how many', () => {
  // "How many tablespoons did you buy?" is not a question about a receipt.
  for (const u of ['tbs', 'tsp', 'cup', 'batch', 'batch-use', 'shot', 'pinch']) {
    assert.equal(perUnitFromUserCount({ total: 5, count: 2, ingUnit: u }), null, `${u} must not be count-askable`);
  }
});

test('package units are left to the packQty prompt', () => {
  // These are real containers, and needsConversion already asks "how many X
  // per pack?" about them. Two prompts asking near-identical questions about
  // one line is how a scanner stops being trusted.
  for (const u of ['bunch', 'head', 'pack', 'can', 'jar', 'carton', 'block', '10ct', 'container']) {
    assert.equal(perUnitFromUserCount({ total: 5, count: 2, ingUnit: u }), null, `${u} belongs to packQty, not the count prompt`);
  }
});

test('count and weight entry never both offer on the same ingredient', () => {
  // A row offering "how many?" AND "what did it weigh?" is a row asking Kevin
  // to pick a derivation, which is a question he should never have to answer.
  for (const u of COUNT_ENTRY_UNITS) {
    assert.ok(!WEIGHT_ENTRY_UNITS.has(u), `unit '${u}' is in BOTH count and weight entry sets`);
  }
});

// ── The sets against the real seed ────────────────────────────────────────
test('every COUNT_ENTRY_UNIT is a unit some real ingredient actually uses', () => {
  const seedUnits = new Set(INGREDIENT_SEED.map(i => i.unit));
  for (const u of COUNT_ENTRY_UNITS) {
    assert.ok(seedUnits.has(u), `COUNT_ENTRY_UNITS has '${u}', which no seed ingredient uses — dead entry`);
  }
});

test('the corn, lemon, lime, and fennel cases are all covered', () => {
  // The four Kevin named. If any is repriced to a non-count unit later, this
  // fires and someone checks whether the prompt still applies.
  const byId = new Map(INGREDIENT_SEED.map(i => [i.id, i]));
  for (const id of ['corn', 'lemon', 'lime', 'fennel_bulb']) {
    const ing = byId.get(id);
    assert.ok(ing, `${id} is missing from the seed`);
    assert.ok(COUNT_ENTRY_UNITS.has(ing.unit),
      `${id} is priced per '${ing.unit}', which the count prompt does not cover`);
  }
});

test('scallions are NOT count-askable (they are a bunch)', () => {
  // Kevin flagged scallions as a maybe. They are priced per BUNCH, which is a
  // package: the right question is "how many scallions in a bunch?", and that
  // is packQty's job, not this one.
  const scallions = INGREDIENT_SEED.find(i => i.id === 'scallions');
  assert.equal(scallions.unit, 'bunch');
  assert.ok(!COUNT_ENTRY_UNITS.has('bunch'));
});

// ── SOLD_BY_EACH must not rot ─────────────────────────────────────────────
test('every SOLD_BY_EACH member is still priced in an each-ish unit', () => {
  // SOLD_BY_EACH means "the receipt's line total IS the per-unit price, skip
  // the prompt." That is a shortcut, and it is only true while the costing
  // unit matches what the store hands over. When thyme was repriced from
  // 'bunch' to 'sprig' (Jul 14) the premise silently broke: an H-Mart pack
  // scanning at $2.99 would have landed as $2.99/SPRIG — 15x high, on the
  // exact ingredient whose bad drift opened this task. No test noticed,
  // because no test looked. This one looks.
  const byId = new Map(INGREDIENT_SEED.map(i => [i.id, i]));
  const rotted = [];
  for (const id of SOLD_BY_EACH) {
    const ing = byId.get(id);
    if (!ing) { rotted.push(`${id} is in SOLD_BY_EACH but not in the seed`); continue; }
    if (!EACHISH_TO_UNITS.has(ing.unit)) {
      rotted.push(
        `${id} is priced per '${ing.unit}', which is not an each-ish unit — ` +
        `a bare line total would become the per-${ing.unit} price. ` +
        `Remove it from SOLD_BY_EACH and give it a PACK_OVERRIDE instead.`
      );
    }
  }
  assert.deepEqual(rotted, [], `SOLD_BY_EACH has rotted:\n      ${rotted.join('\n      ')}`);
});

test('thyme and tarragon resolve an H-Mart pack to the seed price', () => {
  // The end-to-end version of the bug above: $2.99 pack over 15 sprigs must
  // land on the seed's $0.1993/sprig, not $2.99.
  const byId = new Map(INGREDIENT_SEED.map(i => [i.id, i]));
  for (const id of ['thyme_fresh', 'tarragon']) {
    const ing = byId.get(id);
    assert.equal(ing.unit, 'sprig', `${id} should be priced per sprig`);
    assert.ok(!SOLD_BY_EACH.has(id), `${id} must NOT be in SOLD_BY_EACH — a pack is 15 sprigs, not one`);
    const line = { item_name: 'HERB PACK', line_total: 2.99, quantity: null, unit: null, weighed: false };
    const { perUnit } = derivePerUnit(line);
    const conv = convertPerUnit(perUnit, 'package', 'sprig', id, {});
    assert.ok(conv, `${id}: a pack line must convert to a per-sprig price`);
    assert.ok(Math.abs(conv.perUnit - ing.baseline) < 0.01,
      `${id}: $2.99 pack should resolve to ~$${ing.baseline}/sprig, got $${conv.perUnit}`);
  }
});

test('yellow and sweet onion never drift apart', () => {
  // Kevin buys them interchangeably (Jul 15), so a receipt teaching one must
  // move both. priceLink enforces that; without it they were $1.00 and $1.40
  // and would wander independently, quietly making the same onion cost two
  // different amounts depending on which dish it landed in.
  const byId = new Map(INGREDIENT_SEED.map(i => [i.id, i]));
  const sweet = byId.get('sweet_onion');
  const yellow = byId.get('onion');
  assert.equal(sweet.priceLink, 'onion', 'sweet_onion must priceLink to onion');
  assert.equal(sweet.unit, yellow.unit, 'linked ingredients must share a unit, or the mirrored price means something different on each');
  assert.equal(sweet.baseline, yellow.baseline, 'seed baselines should already agree; the link keeps them agreeing');
});

// ── shouldAskCount: when the prompt may appear ────────────────────────────
// Being ABLE to ask is not a reason to ask. Every prompt that fires when the
// answer was already knowable teaches Kevin to dismiss prompts reflexively,
// which costs the ones that matter.
test('asks for corn: piece-priced, line_total basis, no override', () => {
  assert.equal(shouldAskCount({ ingUnit: 'ear', basis: 'line_total', ingredientId: 'corn' }), true);
});

test('never asks a per-lb ingredient', () => {
  assert.equal(shouldAskCount({ ingUnit: 'lb', basis: 'line_total', ingredientId: 'carrots' }), false);
});

test('never asks when the receipt already answered', () => {
  // Each of these bases means something real resolved the price. Asking
  // anyway would be the app admitting it does not read its own work.
  for (const basis of ['printed_unit_price', 'total_div_weight', 'total_div_qty', 'user_count', 'user_weight', 'inferred_weight']) {
    assert.equal(shouldAskCount({ ingUnit: 'ear', basis, ingredientId: 'corn' }), false, `basis '${basis}' must not trigger the prompt`);
  }
});

test('never asks when a PACK_OVERRIDE knows the answer', () => {
  // eggs (dozen=12), butter (box=4 sticks), anchovies (jar=20 fillets),
  // chocolate_100 (bar=8 squares), and now thyme/tarragon (pack=15 sprigs)
  // are all piece-priced with a hardcoded pack size. The prompt must stay out
  // of their way.
  for (const id of ['eggs', 'butter', 'anchovies', 'chocolate_100', 'thyme_fresh', 'tarragon']) {
    const unit = INGREDIENT_SEED.find(i => i.id === id).unit;
    assert.equal(shouldAskCount({ ingUnit: unit, basis: 'line_total', ingredientId: id }), false,
      `${id} has a PACK_OVERRIDE; the count prompt must not fire`);
  }
});

test('never asks when a learned packQty knows the answer', () => {
  assert.equal(shouldAskCount({
    ingUnit: 'each', basis: 'line_total', ingredientId: 'lemon',
    alias: { ingredientId: 'lemon', packQty: 6 },
  }), false);
});

test('a zero or malformed packQty does not count as an answer', () => {
  // A packQty of 0 would divide the price into nothing. It is not a learned
  // fact, it is a broken one, and the prompt is exactly the right recovery.
  for (const packQty of [0, -1, null, undefined, 'six']) {
    assert.equal(shouldAskCount({
      ingUnit: 'each', basis: 'line_total', ingredientId: 'lemon', alias: { packQty },
    }), true, `packQty ${JSON.stringify(packQty)} must not suppress the prompt`);
  }
});

test('the four Kevin named all trigger the prompt', () => {
  const byId = new Map(INGREDIENT_SEED.map(i => [i.id, i]));
  for (const id of ['corn', 'lemon', 'lime', 'fennel_bulb']) {
    const ing = byId.get(id);
    assert.equal(shouldAskCount({ ingUnit: ing.unit, basis: 'line_total', ingredientId: id }), true,
      `${id} should offer the count prompt on a bare line total`);
  }
});

console.log(`[count-entry] ${passed} checks passed`);
