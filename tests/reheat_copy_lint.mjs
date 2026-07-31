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

// The card for one dish AND ONE VARIANT, as a customer would read it.
//
// PER VARIANT, not per dish. The first version asked "does any variant of this
// dish have a bag?" and then read only the FIRST variant's card. Saffron Pork
// Ragu is exactly why that is wrong: its sous vide bag appears ONLY on the two
// "+ Polenta" variants, so the dish looked bagged while the card being read was
// the non-polenta one that correctly has no bag instruction. Same shape on
// Mushroom Ragu. Every variant now gets checked against its own card.
function cardFor(dish, variantLabel) {
  const variant = variantLabel !== undefined
    ? variantLabel
    : ((dish.variants && dish.variants[0] && dish.variants[0].label) || '');
  const blocks = buildReheatBlocks({ items: [{ name: dish.name, variant, qty: 1 }] });
  // ARRAY OR STRING. The stew-veg block returns `body` as an array of
  // paragraphs while every other block returns a string, and companionContext
  // has always handled that with exactly this line. The first version of this
  // linter did too — but the Brunswick false positive persisted because the
  // WHOLE card was being assembled before the join, so `.join(' ')` on a nested
  // array flattened wrong. Reading each block's body on its own is what fixes
  // it. Brunswick's card does state a full method; the linter could not see it.
  return blocks
    .map(b => {
      const body = Array.isArray(b.body) ? b.body.join(' ') : String(b.body || '');
      return `${b.title}. ${body}`;
    })
    .join(' ');
}

// Whether THIS variant ships a bag.
function variantHasBag(dish, variantLabel) {
  if (dish.stewVegCopy || dish.reheat === 'bagged') return true;
  const resolved = resolveDishVariant(dish.name, variantLabel) || [];
  return resolved.some(x => x.id === 'sv_bag');
}

// ── The checks ──────────────────────────────────────────────────────────────
const findings = [];
const record = (dish, rule, detail) => findings.push({ dish: dish.name, rule, detail });

for (const dish of DISHES) {
 for (const v of (dish.variants && dish.variants.length ? dish.variants : [{ label: '' }])) {
  const card = cardFor(dish, v.label);
  const lower = card.toLowerCase();

  if (!card.trim()) { record(dish, 'empty', `the card is blank for "${v.label}"`); continue; }

  // "Warm" with no endpoint. Warm until when?
  if (/\bwarm\b/.test(lower)
      && !/(until|through|hot|steaming|gloss|loosen|bubbl|simmer)/.test(lower)) {
    record(dish, 'warm-no-endpoint', 'says warm without saying until what');
  }

  // A bag named and no method given. THE Brunswick failure.
  if (variantHasBag(dish, v.label)) {
    // A METHOD IS NOT ALWAYS A SIMMER. Searing a bagged protein is correct and
    // used elsewhere, and "open the bag and tip it in" is a complete
    // instruction. What is unacceptable is naming a bag and saying nothing.
    // A METHOD IS A VERB ACTING ON THE BAG, in whatever words Kevin used. The
    // first version enumerated phrasings and missed Brunswick, whose card says
    // "Cut the bag open" and "Tip the potatoes straight into the stew" — a
    // complete instruction that matched none of the patterns. Enumerating
    // wordings is a losing game; this looks for the shape instead.
    const statesMethod =
      /(simmer|\bsear\b)/.test(lower)
      || /(cut|open|snip|tear|empty|drop|place|reheat)[^.]{0,40}\bbags?\b/.test(lower)
      || /\bbags?\b[^.]{0,40}(open|into|in until|in a pot|in simmering)/.test(lower)
      || /\btip\b[^.]{0,40}(into|over|in)\b/.test(lower);
    if (!statesMethod) record(dish, 'bag-no-method', `"${v.label}" ships a bag and its card never says what to do with it`);
  }

  // A temperature with no time, or a time with no temperature. Either alone
  // leaves the person guessing at the other.
  // An OVEN instruction, not a doneness fact. "Cooked to 131F" describes what
  // Kevin already did and needs no duration; "bake at 350F" needs one. The
  // first version flagged Steak au Poivre for stating its own doneness.
  const hasTemp = /(oven|bake|broil|roast|heat)[^.]{0,30}\d{3}\s*°?f\b|\d{3}\s*°?f[^.]{0,20}(oven|for)\b/.test(lower);
  // ALTERNATION ORDER MATTERS. This was /(min|minute|second|sec)\b/, which tries
  // "min" first, matches it inside "minutes", and then fails the word boundary
  // on the "u" — so "for about 10 minutes" read as having no duration. Longest
  // form first, with optional plurals, and the boundary lands where it should.
  const hasTime = /\d+\s*(?:-|–|to)?\s*\d*\s*(?:minutes?|mins?|seconds?|secs?|hours?|hrs?)\b/.test(lower);
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
}

// One finding per dish+rule, however many variants tripped it.
{
  const seen = new Set();
  for (let i = findings.length - 1; i >= 0; i--) {
    const k = `${findings[i].dish}|${findings[i].rule}`;
    if (seen.has(k)) findings.splice(i, 1); else seen.add(k);
  }
}

// ── The ratchet ─────────────────────────────────────────────────────────────
//
// Recorded from the first run. Fix a dish and remove it; the stale check below
// forces the list down rather than letting it rot.
const KNOWN = [
  // EMPTY as of Jul 31, and that is the real milestone: every dish's card now
  // states a method for everything it ships.
  //
  // The list started at six. Five were the linter's own fault (array bodies,
  // and asking "does any variant have a bag" then reading only the first
  // variant's card). The genuine ones — Indian Curry, Cumin, Saffron, and
  // Tex-Mex — were fixed from Kevin's Walk 2 and Walk 3 answers.
  //
  // Keep it empty. A new entry here means a card shipped without a method, and
  // the right response is to fix the card, not to add a line.
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

  // The duration check, both directions — it silently mis-read "10 minutes"
  // for a full day before the Bo Ssam copy forced it into the open.
  const timeRe = /\d+\s*(?:-|–|to)?\s*\d*\s*(?:minutes?|mins?|seconds?|secs?|hours?|hrs?)\b/;
  ok('a duration in minutes is recognised', timeRe.test('for about 10 minutes'));
  ok('so is the abbreviated form', timeRe.test('325f for 10 min'));
  ok('and a range', timeRe.test('15-20 minutes'));
  ok('while a bare temperature is not', !timeRe.test('cooked to 131f'));
}


// ── Walk 3 sweep regressions (Jul 31, Fable pass) ──────────────────────────
//
// Three things a second pair of eyes caught in the Walk 3 work, pinned here so
// they cannot quietly come back.
{
  const { itemHandling, buildReheatBlocks } = await import('../src/recipes.js');

  // 1. The Cumin label early-return must carry the FULL handling shape. The
  //    first version returned { cue } alone, silently dropping `reheatable`
  //    and `packaging`, which the label printer reads.
  const h = itemHandling('Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice');
  ok('the Cumin label handling keeps reheatable and packaging',
    h && h.reheatable === true && h.packaging === 'per-qty' && /simmering water/.test(h.cue || ''));

  // 2. The rice-salting note lands at most once per CARD. Several block types
  //    append it independently, and an order with two rice dishes printed the
  //    same joke twice — once is a person talking, twice is a paste error.
  const two = buildReheatBlocks({ items: [
    { name: 'Gumbo', variant: 'Small (~4)', qty: 1 },
    { name: 'Indian Style Curry', variant: 'Chicken, Small (~4)', qty: 1 },
  ] });
  const joined = two.map(b => (Array.isArray(b.body) ? b.body.join(' ') : b.body)).join(' ');
  ok('a two-rice-dish order carries the salting note exactly once',
    (joined.match(/blasphemy/g) || []).length === 1, joined.slice(0, 120));
  ok('and the stripped block still tells them to cook the rice',
    /Cook the included rice\./.test(joined));

  // 3. The Saffron +Polenta card covers BOTH components, title included. It
  //    used to render one block titled "Reheat the polenta bag" whose body
  //    never warmed the ragu at all.
  const sp = buildReheatBlocks({ items: [{ name: 'Saffron Pork Ragu', variant: 'Small (~4-5 servings) + Polenta', qty: 1 }] });
  const spText = sp.map(b => `${b.title}. ${Array.isArray(b.body) ? b.body.join(' ') : b.body}`).join(' ');
  ok('the Saffron polenta card warms the ragu, not just the bag',
    /warm the ragu/i.test(spText) && /ragu and polenta/i.test(sp[0].title || ''));
}


// ── Phase 2: the cards that were wrong today ───────────────────────────────
{
  const { buildReheatBlocks } = await import('../src/recipes.js');
  const card = (name, variant) => buildReheatBlocks({ items: [{ name, variant, qty: 1 }] })
    .map(b => (Array.isArray(b.body) ? b.body.join(' ') : b.body)).join(' ');

  // Tex-Mex: the old copy said the beans travel in a BAG. They are in a
  // container and they get scooped, and the tortillas want toasting.
  const tm = card('Tex-Mex Kit', 'Pulled Pork, Small (~5-6)');
  ok('the Tex-Mex card no longer calls the beans a bag', !/beans[^.]*bag/i.test(tm));
  ok('it says to scoop them', /scoop/i.test(tm));
  ok('it says to toast the tortillas', /toast/i.test(tm));
  ok('and it mentions the rice the kit now includes', /rice/i.test(tm));

  // Leblanc + Bourguignon: the vegetables no longer get their own pot, which
  // is what takes each dish from three vessels to two.
  for (const [n, v] of [['Leblanc Inspired Japanese Curry', 'Small (split order, ~4)'],
                        ['Boeuf Bourguignon (Beef Stew)', '~4 servings']]) {
    const t = card(n, v);
    ok(`${n.split(' ')[0]}: the veg bag gets no pot of its own`, !/pot of water|bring a pot/i.test(t));
    ok(`${n.split(' ')[0]}: the discard-the-liquid instruction survives`, /discard/i.test(t));
    ok(`${n.split(' ')[0]}: and the butter-not-down-the-drain note survives`, /drain/i.test(t));
  }

  // Pork tarragon: the temper is the FIRST thing said, because Kevin counts it
  // inside the total and it moves the headline from ~20 minutes to ~50.
  const pt = card('Pork with Mustard Tarragon Cream Sauce', 'Small (~3)');
  ok('the tarragon card opens with the 30-minute temper', /^Start by taking the pork out/.test(pt));
  ok('and keeps the water-first sequencing', /pasta water on first/i.test(pt));

  // Bo Ssam: three ranked methods, and the safety rule that makes the ranking
  // mean something — the bag is best AND is the one you must not use for a
  // partial serving.
  const bs = card('Bo Ssam', 'Small (~4 servings)');
  ok('Bo Ssam offers all three methods', /simmer/i.test(bs) && /oven/i.test(bs) && /microwave/i.test(bs));
  ok('it says why the bag wins', /remelts the fat/i.test(bs));
  ok('and carries the re-chilling safety rule', /re-chilling/i.test(bs));
}

// ── The kitchen page carries ONE general safety line ───────────────────────
{
  const { companionHtml } = await import('../src/companion.js');
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM(companionHtml({ id: 'x', customer: 'Test', items: [{ name: 'Chili', qty: 1, variant: 'Small (~4)' }] }, 'p', {}));
  const el = dom.window.document.querySelector('.safety');
  ok('the kitchen page opens with a food-safety line', !!el);
  ok('and it says nothing about rice',
    el && !/rice/i.test(el.textContent),
    'Kevin ships rice uncooked and ruled the leftovers are the customer\'s own business');
}

console.log(f === 0 ? '\nREHEAT COPY LINT: ALL PASS' : `\nREHEAT COPY LINT: ${f} FAILURES`);
process.exit(f ? 1 : 0);
