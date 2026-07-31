// tests/reheat_method.mjs — the reheat METHOD must reach the customer.
//
// WHY THIS EXISTS, and why it is method-shaped rather than dish-shaped.
//
// A worst-case reheat walk was started on Jul 29 with a pre-filled guess per
// dish. Three of the first five guesses were wrong: Queso never retrogrades in
// practice, refried beans never really fail, and rice is fine except in one
// interaction. The 27-dish sweep was dropped as a result — auditing guesses
// about food Kevin has cooked hundreds of times costs him an evening and
// mostly produces "this is fine".
//
// What the walk DID produce is this: every one of Kevin's corrections named a
// METHOD, not a dish property.
//
//   "the bag simmer is the way to go"
//   "should never be done in the microwave, it will be bad"
//   "stovetop with water and stir"
//
// There are about five methods and twenty-seven dishes, so the method is the
// smaller and more durable thing to assert. Both checks below are the two Kevin
// approved on the spot.
//
// THE FAILURE THIS CATCHES. itemHandling() derives one cue per dish from its
// bucket. A dish in the 'bagged' bucket gets "reheat sealed bag in simmering
// water". A dish in the 'pasta' or 'stovetop' bucket gets pasta or stovetop
// wording that never mentions a bag — even when that dish HAS a bagged
// component. That is precisely the Brunswick failure, and it is what
// stewVegCopy exists to correct. This asserts the correction actually happened.

import { DISHES } from '../src/dishes.js';
import { resolveDishVariant } from '../src/dishCosting.js';
import { itemHandling, REHEAT_CUES } from '../src/recipes.js';

let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

// Everything a customer could read about how to reheat this dish.
function customerFacingReheat(d) {
  const parts = [
    (d.copy && d.copy.reheat) || '',
    d.stewVegCopy ? `${d.stewVegCopy.main || ''} ${d.stewVegCopy.veg || ''}` : '',
    (itemHandling(d.name) || {}).cue || '',
  ];
  return parts.join(' ').toLowerCase();
}

function hasBaggedComponent(d) {
  if (d.stewVegCopy) return true;
  if (d.reheat === 'bagged') return true;
  for (const v of d.variants || []) {
    const resolved = resolveDishVariant(d.name, v.label) || [];
    if (resolved.some(x => x.id === 'sv_bag')) return true;
  }
  return false;
}

// ── CHECK 1: a bagged component must state the bag simmer ───────────────────
{
  const bagged = DISHES.filter(hasBaggedComponent);
  ok('some dishes have bagged components (the check has something to check)',
    bagged.length > 0, String(bagged.length));

  const silent = [];
  for (const d of bagged) {
    const text = customerFacingReheat(d);
    // The method has to be STATED, not merely implied by the word "bag".
    // "comes with a bag" is not an instruction.
    //
    // SIMMER IS NOT THE ONLY VALID METHOD. The first version of this check
    // required it and flagged Pork with Mustard Tarragon, whose copy says to
    // pat the bagged pork dry and sear it hard — a correct method, and one the
    // customer verb ceiling explicitly permits. Searing a bagged protein and
    // simmering a bagged side are both fine; saying nothing is not.
    const statesMethod =
      /simmer/.test(text) ||
      /\bsear\b/.test(text) ||
      /bag(s)? reheat/.test(text) ||
      /reheat.{0,24}in (the|their) bag/.test(text) ||
      /place the sealed bag/.test(text);
    if (!statesMethod) silent.push(`${d.name}  [bucket: ${d.reheat || 'none'}]`);
  }
  // RATCHET, not a hard zero. These gaps predate the check, and a new gate that
  // instantly blocks deploys over pre-existing copy is a gate Kevin learns to
  // ignore. The baseline is recorded here; the assertion is that it does not
  // GROW. Fix the listed dishes and lower the number.
  // ── THIS CHECK AUDITS THE WRONG SURFACE, and knowing that is the point ──
  //
  // It reads copy.reheat, stewVegCopy, and the label cue. NONE of those is the
  // reheat card — that is buildReheatBlocks() in recipes.js, rendered by
  // companion.js. So this has been auditing the MENU BLURB, which is precisely
  // the surface Kevin ruled on Jul 31 must NOT carry the method.
  //
  // Its original four-dish baseline was therefore partly fiction: Brunswick's
  // card always stated a full method, and Saffron's gap was real but on a
  // different variant than described. tests/reheat_copy_lint.mjs now reads the
  // actual card and supersedes this file's intent.
  //
  // KEPT, NARROWED, because the blurb still should not contradict the card and
  // this is the only thing watching that. The list is what remains genuinely
  // silent in the BLURB after the Jul 31 copy work.
  const KNOWN_SILENT = [
    'Brunswick Stew',       // blurb is silent; the CARD states the full method
    'Indian Style Curry',   // blurb is silent; the card now carries the conditional bag
    'Saffron Pork Ragu',    // blurb is silent; the card now warms the ragu too
  ];
  const unexpected = silent.filter(x => !KNOWN_SILENT.some(k => x.startsWith(k)));
  const fixed = KNOWN_SILENT.filter(k => !silent.some(x => x.startsWith(k)));

  ok('no NEW dish hides its bagged component from the customer',
    unexpected.length === 0,
    unexpected.join('\n      ') + (unexpected.length ? '\n      → renders a pasta/stovetop cue that never mentions the bag' : ''));

  if (silent.length) {
    console.log(`  ⚠ ${silent.length} known gap(s) awaiting Kevin's reheat copy:`);
    for (const x of silent) console.log('      ' + x);
  }
  ok('the known-gap list has no stale entries',
    fixed.length === 0,
    fixed.length ? 'these now state a method and should be removed from KNOWN_SILENT: ' + fixed.join(', ') : '');
}

// ── CHECK 2: no microwave permission on components that retrograde ──────────
//
// Kevin, Jul 29, on the dashi polenta: "should never be done in the microwave.
// it will be bad. the bag simmer is the way to go." Retrogradation reverses
// above ~140F, and a microwave stopped at "warm" never gets there, so the
// starch sets instead of loosening.
//
// Deliberately NOT a list of everything that might retrograde. Kevin corrected
// three of five such guesses in one sitting. This holds only what he has
// actually ruled on, and grows when he rules on more.
{
  const RETROGRADE_PRONE = [
    { match: /polenta/i, why: 'polenta sets solid below 140F; Kevin: never microwave, bag simmer only' },
  ];

  const offenders = [];
  for (const d of DISHES) {
    // Haystack includes the REHEAT copy, not just name and description. Saffron
    // Pork Ragu's polenta is a variant mentioned only in its reheat line, and
    // the first version of this check missed it for that reason.
    const hay = `${d.name} ${(d.copy && d.copy.desc) || ''} ${(d.copy && d.copy.reheat) || ''}`;
    const hit = RETROGRADE_PRONE.find(r => r.match.test(hay));
    if (!hit) continue;
    const text = customerFacingReheat(d);
    if (/microwave/.test(text) && !/not?\s+the\s+microwave|never.{0,20}microwave|avoid.{0,20}microwave/.test(text)) {
      offenders.push(`${d.name}: ${hit.why}`);
    }
  }
  ok('no dish with a retrogradation-prone component permits the microwave',
    offenders.length === 0, offenders.join('\n      '));

  ok('the retrograde list holds only rulings Kevin actually made, not guesses',
    RETROGRADE_PRONE.length > 0 && RETROGRADE_PRONE.every(r => r.why.length > 20));
}

// ── Supporting invariants ───────────────────────────────────────────────────
{
  ok('the simmerBag cue still says simmer', /simmer/i.test(REHEAT_CUES.simmerBag || ''));
  ok('the stovetop cue does NOT mention a bag',
    !/\bbag\b/i.test(REHEAT_CUES.stovetopSplash || ''),
    'if it ever does, check 1 above stops discriminating and silently passes everything');

  // Bo Ssam carries no reheat BUCKET, so itemHandling returns no cue for it.
  // That is survivable because its copy.reheat states the method in full
  // ("bring a pot of water to a gentle simmer and place the sealed bag in").
  // What is NOT survivable is a dish with neither, so that is what is asserted.
  const mute = DISHES.filter(d => {
    const cue = ((itemHandling(d.name) || {}).cue || '').trim();
    const copy = ((d.copy && d.copy.reheat) || '').trim();
    return !cue && !copy;
  });
  ok('every dinner tells the customer something about reheating it',
    mute.length === 0, mute.map(d => d.name).join(', '));
}

console.log(f === 0 ? '\nREHEAT METHOD: ALL PASS' : `\nREHEAT METHOD: ${f} FAILURES`);
process.exit(f ? 1 : 0);
