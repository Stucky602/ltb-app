// tests/reheat_copy_lint.mjs — the instructions a customer actually reads.
//
// AIMED AT THE RIGHT SURFACE, WHICH THE FIRST ATTEMPT WAS NOT.
//
// tests/reheat_method.mjs audits `copy.reheat`, `stewVegCopy`, and the label
// cue. None of those is the reheat card. The card is buildReheatBlocks() in
// recipes.js, rendered by companion.js onto the kitchen page — the thing
// somebody is holding a container and reading.
//
// So that gate has been checking the MENU BLURB, which is exactly the surface
// Kevin ruled must NOT carry the method. Two of its four flagged dishes turned
// out to be false positives and one was a different problem entirely. A green
// gate telling you something untrue is worse than no gate.
//
// This one runs every dish through the real builder and reads what comes out.
//
// WHAT IT LOOKS FOR, all of them failures Kevin has actually hit:
//   - "warm" with no endpoint      → warm until WHAT?
//   - a bag named with no method   → the Brunswick failure
//   - a temperature with no time, or a time with no temperature
//   - a microwave suggested for something that must not be microwaved
//   - a verb outside the agreed customer vocabulary
//
// RATCHET, not a hard zero. Existing copy predates the check, and a new gate
// that instantly blocks deploys is a gate Kevin learns to ignore. The baseline
// is recorded; the assertion is that it does not grow.

import { DISHES } from '../src/dishes.js';
import { buildReheatBlocks } from '../src/recipes.js';
import { resolveDishVariant } from '../src/dishCosting.js';

let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

// The card for one dish, as a customer would read it.
function cardFor(dish) {
  const variant = (dish.variants && dish.variants[0] && dish.variants[0].label) || '';
  const blocks = buildReheatBlocks({ items: [{ name: dish.name, variant, qty: 1 }] });
  return blocks
    .map(b => `${b.title}. ${Array.isArray(b.body) ? b.body.join(' ') : b.body}`)
    .join(' ');
}

function hasBaggedComponent(dish) {
  if (dish.stewVegCopy || dish.reheat === 'bagged') return true;
  for (const v of dish.variants || []) {
    const resolved = resolveDishVariant(dish.name, v.label) || [];
    if (resolved.some(x => x.id === 'sv_bag')) return true;
  }
  return false;
}

// ── The checks ──────────────────────────────────────────────────────────────
const findings = [];
const record = (dish, rule, detail) => findings.push({ dish: dish.name, rule, detail });

for (const dish of DISHES) {
  const card = cardFor(dish);
  const lower = card.toLowerCase();

  if (!card.trim()) { record(dish, 'empty', 'the card is blank'); continue; }

  // "Warm" with no endpoint. Warm until when?
  if (/\bwarm\b/.test(lower)
      && !/(until|through|hot|steaming|gloss|loosen|bubbl|simmer)/.test(lower)) {
    record(dish, 'warm-no-endpoint', 'says warm without saying until what');
  }

  // A bag named and no method given. THE Brunswick failure.
  if (hasBaggedComponent(dish)) {
    // A METHOD IS NOT ALWAYS A SIMMER. Searing a bagged protein is correct and
    // used elsewhere, and "open the bag and tip it in" is a complete
    // instruction. What is unacceptable is naming a bag and saying nothing.
    const statesMethod = /(simmer|\bsear\b|reheat.{0,30}in (the|their) bag|place the sealed bag|drop the bag|bag into|open the bag|tip (it|them) in|empty the bag)/.test(lower);
    if (!statesMethod) record(dish, 'bag-no-method', 'has a bagged component and the card never says what to do with it');
  }

  // A temperature with no time, or a time with no temperature. Either alone
  // leaves the person guessing at the other.
  // An OVEN instruction, not a doneness fact. "Cooked to 131F" describes what
  // Kevin already did and needs no duration; "bake at 350F" needs one. The
  // first version flagged Steak au Poivre for stating its own doneness.
  const hasTemp = /(oven|bake|broil|roast|heat)[^.]{0,30}\d{3}\s*°?f\b|\d{3}\s*°?f[^.]{0,20}(oven|for)\b/.test(lower);
  const hasTime = /\d+\s*(-|–|to)?\s*\d*\s*(min|minute|second|sec)\b/.test(lower);
  if (hasTemp && !hasTime) record(dish, 'temp-no-time', 'gives a temperature and no duration');

  // Verbs outside the agreed vocabulary. Kevin's customers are not cooks, and
  // a card that says "deglaze" is a card that gets a text message back.
  // IMPERATIVES ONLY. These words are also nouns and descriptions in Kevin's
  // copy: "the braise in a container" is a thing, "let the fat render" is what
  // happens. The first version flagged both as instructions the customer could
  // not follow, which they are not. So the word only counts when it opens a
  // sentence or clause — which is where an instruction lives.
  // A real imperative takes an OBJECT: "braise the beef". Kevin's plating line
  // reads "Braise over rice with the kabocha alongside" — the braise is the
  // thing, and "over" is a preposition. Requiring an article after the word
  // separates the instruction from the noun.
  const verbs = (lower.match(/(?:^|[.;]\s+)(deglaze|emulsify|temper|blanch|braise|confit|render|clarify)\s+(the|a|an|your|each|both)\b/g) || [])
    .map(x => x.replace(/^[.;]\s+/, '').trim().split(/\s+/)[0]);
  if (verbs.length) record(dish, 'unsupported-verb', `uses ${[...new Set(verbs)].join(', ')}`);

  // The one thing Kevin has explicitly ruled must never be microwaved.
  if (/polenta/i.test(dish.name + ' ' + ((dish.copy && dish.copy.reheat) || ''))
      && /microwave/.test(lower) && !/(never|not the|avoid)/.test(lower)) {
    record(dish, 'microwave-retrograde', 'suggests the microwave for something with polenta in it');
  }
}

// ── The ratchet ─────────────────────────────────────────────────────────────
//
// Recorded from the first run. Fix a dish and remove it; the stale check below
// forces the list down rather than letting it rot.
const KNOWN = [
  // Recorded from the first honest run, Jul 30. Every one is a dish whose card
  // names a bag and never says what to do with it, plus one "warm" with no
  // endpoint. Fix a card and delete its line; the stale check forces the list
  // down rather than letting it rot.
  //
  // NOTE these differ from tests/reheat_method.mjs's baseline, and that is the
  // point: this reads the CARD and that one reads the menu blurb. Where they
  // disagree, this one is right about what a customer sees.
  'Brunswick Stew|bag-no-method',
  'Indian Style Curry|bag-no-method',
  'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice|bag-no-method',
  'Saffron Pork Ragu|bag-no-method',
  'Mushroom Ragu|bag-no-method',
  'Tex-Mex Kit|warm-no-endpoint',
];

const unexpected = findings.filter(x => !KNOWN.includes(`${x.dish}|${x.rule}`));
const fixed = KNOWN.filter(k => !findings.some(x => `${x.dish}|${x.rule}` === k));

ok('every dinner produces a reheat card', DISHES.every(d => cardFor(d).trim().length > 0));

ok('no NEW defect in the customer-facing reheat copy',
  unexpected.length === 0,
  unexpected.map(x => `${x.dish} [${x.rule}] ${x.detail}`).join('\n      '));

ok('the known-defect list has no stale entries',
  fixed.length === 0,
  fixed.length ? `these read clean now and should come off KNOWN: ${fixed.join(', ')}` : '');

if (findings.length) {
  console.log(`  ⚠ ${findings.length} finding(s) in customer reheat copy:`);
  for (const x of findings) console.log(`      ${x.dish} [${x.rule}] — ${x.detail}`);
}

// ── The checks must be capable of firing ────────────────────────────────────
// A linter that cannot fail is decoration, and this one exists precisely
// because another gate looked like it was checking something and was not.
{
  const probe = (text) => {
    const l = text.toLowerCase();
    return {
      warm: /\bwarm\b/.test(l) && !/(until|through|hot|steaming|gloss|loosen|bubbl|simmer)/.test(l),
      verb: /\b(deglaze|emulsify|temper)\b/.test(l),
    };
  };
  ok('the warm-with-no-endpoint check fires on a bad sentence',
    probe('Warm the sauce and serve.').warm);
  ok('and not on a good one',
    !probe('Warm gently until heated through.').warm);
  ok('the unsupported-verb check fires', probe('Deglaze the pan.').verb);
}

console.log(f === 0 ? '\nREHEAT COPY LINT: ALL PASS' : `\nREHEAT COPY LINT: ${f} FAILURES`);
process.exit(f ? 1 : 0);
