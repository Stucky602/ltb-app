// tests/freezer_lens.mjs — the shopping aid, against Kevin's own type cases.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE THREE THINGS THAT MATTER
//
// 1. THE THREE STATES MATCH THE DISHES KEVIN NAMED. He gave a type case for
//    each boundary, and those are the only fixed points there are — the
//    classifier is a proxy for "how much of the dish freezes", so the proof
//    that the proxy is calibrated is that it agrees with him. Brunswick in
//    particular is a TIE and belongs in CAVEAT; an earlier `<=` put it in
//    MINIMAL, which is the backwards description that state exists to prevent.
//
// 2. THE BOXES ONLY RENDER WHEN A FILTER IS ON. His explicit ruling, with the
//    reason attached: "I am not trying to overwhelm clients, just give options
//    if they want it." Nothing is lost by hiding them, because the real
//    instruction lives on the reheat page after ordering.
//
// 3. THE TOGGLES ARE ADDITIVE. Not radio buttons. Somebody filling a freezer
//    wants clean and caveat together; somebody planning the week wants only
//    minimal.

import {
  classifyDish, lensBox, filterByLens, lensCounts, LENS_STATES, LENS_LABELS,
} from '../src/freezerLens.js';
import { REHEAT_DATA } from '../src/reheatData.js';
import { readFileSync } from 'node:fs';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// ── Kevin's type cases ──────────────────────────────────────────────────────
{
  const brunswick = classifyDish('brunswick-stew');
  ok('Brunswick is CAVEAT — his type case for the yellow state',
    brunswick && brunswick.state === 'caveat',
    `got ${brunswick && brunswick.state}. It is a TIE (stew freezes, potatoes do not) and a tie is not "mostly does not freeze"`);
  ok('and it names the potatoes as the thing to take out',
    brunswick.blockers.some(b => b.key === 'potatoes'));

  const texmex = classifyDish('tex-mex-kit');
  ok('Tex-Mex is MINIMAL — his type case for the red state',
    texmex && texmex.state === 'minimal',
    'describing it as "freezes, with a step" would state the truth backwards');
  ok('and it names the tortillas as the exception',
    texmex.exceptions.includes('tortillas'),
    '"do not freeze this" with nothing after it tells a customer to give up on a freezable part');

  const poivre = classifyDish('steak-au-poivre');
  ok('Steak au Poivre is MINIMAL — the other one he named',
    poivre && poivre.state === 'minimal');
}

// ── The clean state, including the dry-goods case ───────────────────────────
{
  const clean = classifyDish('mapo-eggplant');
  ok('a fully freezable dish is CLEAN', clean && clean.state === 'clean');

  // Kevin's wording: all components freeze well OR store as dry goods.
  const withRice = Object.keys(REHEAT_DATA).find(id =>
    (REHEAT_DATA[id].components || []).some(c => c.freeze && c.freeze.verdict === 'na')
    && classifyDish(id).state === 'clean');
  ok('a dish containing uncooked rice or pasta can still be CLEAN',
    !!withRice,
    '`na` means no freeze decision exists because it never goes in a freezer; it must not disqualify a dish');
}

// ── The two shapes of the yellow box ────────────────────────────────────────
{
  // CHANGED Aug 2. These used to assert the GENERATED wording — "Before you
  // freeze this…" and "Freezes fine…" — which were only ever placeholders. The
  // customer sentence now leads on its own, so asserting the prefix would pin
  // the fallback and forbid the real copy.
  //
  // What matters is that a step dish tells you to remove something and a quality
  // dish does not, whatever words carry it.
  const action = lensBox(classifyDish('brunswick-stew'));
  ok('a dish needing a STEP tells the customer to take it out',
    /take the potatoes out/i.test(action.lead),
    action.lead);
  ok('and says what to do with the dish afterwards',
    /freeze the stew/i.test(action.lead),
    'removing something without saying what happens next is half an instruction');

  const quality = lensBox(classifyDish('stir-fried-long-beans-with'));
  ok('a dish with only a QUALITY note describes the compromise instead',
    /works frozen|not be at its best/i.test(quality.lead),
    quality.lead);

  // Why the distinction exists at all.
  ok('the quality box does NOT tell someone to take something out',
    !/take out/.test(quality.lead + quality.detail),
    'a customer who reads "needs attention" and finds it meant slightly soft gai lan stops reading yellow boxes, '
    + 'and the box has to keep its credibility for Brunswick where ignoring it produces a bad dinner');

  ok('the box uses the resolved customer sentence, not a template',
    /Not quite the same, but good/.test(action.lead),
    'component keys are not nouns a customer recognises — the long beans key their soft component as `bag`');

  ok('no box builds prose out of a bare component key where a note exists',
    !/The bag comes out/.test(quality.lead + quality.detail));
}

// ── Filtering is additive ───────────────────────────────────────────────────
{
  const ids = Object.keys(REHEAT_DATA);

  ok('no toggles means no filter — the menu reads normally',
    filterByLens(ids, []).length === ids.length,
    'an empty selection is "not filtering", not "match nothing"');

  const cleanOnly = filterByLens(ids, ['clean']);
  ok('one toggle narrows to that state',
    cleanOnly.length > 0 && cleanOnly.every(id => classifyDish(id).state === 'clean'));

  const two = filterByLens(ids, ['clean', 'caveat']);
  ok('two toggles are ADDITIVE, not exclusive',
    two.length > cleanOnly.length
    && two.every(id => ['clean', 'caveat'].includes(classifyDish(id).state)),
    'somebody filling a freezer wants both on and red off');

  ok('all three toggles is the same as no filter for dishes that have data',
    filterByLens(ids, LENS_STATES).length === ids.filter(id => classifyDish(id)).length);

  ok('a dish with no freeze data is excluded from a FILTERED view',
    filterByLens(['not-a-dish'], ['clean']).length === 0,
    'claiming it belongs in any state would be a verdict nobody gave');
  ok('but it is not dropped when nothing is filtered',
    filterByLens(['not-a-dish'], []).length === 1);

  const counts = lensCounts(ids);
  ok('every dish classifies into exactly one state',
    counts.clean + counts.caveat + counts.minimal + counts.unknown === ids.length);
  ok('and the whole menu has freeze data',
    counts.unknown === 0,
    'the walk covered all 26 live dinners');
  ok('every state has a customer-readable label',
    LENS_STATES.every(x => LENS_LABELS[x]));
}

// ── The page honours "only when the filter is on" ───────────────────────────
{
  const page = readFileSync(new URL('../menu.html', import.meta.url), 'utf8');

  ok('the lens data reached the built page', page.includes('var FREEZE_LENS ='));
  ok('the toggles render', page.includes('lensRowHtml') && page.includes('lens-btn'));

  ok('the BOXES are gated on a filter being on, not merely on the flag',
    /function lensBoxHtml[\s\S]{0,220}lensAny\(\)/.test(page),
    'Kevin: "I am not trying to overwhelm clients." Always-on boxes are the failure this guards');

  // FLAG RETIRED Aug 2. It shipped, it works, and Kevin removed the switch
  // rather than leave a permanent maybe in the panel. The seam stays as a named
  // function so re-gating is one line, but nothing reads a flag any more.
  ok('the feature is no longer gated on a flag',
    /function lensEnabled\(\)\s*\{\s*return true; \}/.test(page),
    'a flag nobody will ever turn off is just another way for the feature to break');
  ok('and no page still looks for a freezerLens flag',
    !page.includes('freezerLens'),
    'a page reading a flag the app no longer declares would silently read undefined');
  // NARROWED after checking rather than assuming: `__ltbPersonal` IS real on
  // form.html, built by an IIFE in that file, and the request box has always
  // read its flag through it. It does NOT exist on menu.html, which is why the
  // lens was invisible. The rule is per page, not global.
  ok('menu.html does not read an object it does not have',
    !new RegExp('__ltbPersonal\\.flags').test(page.replace(/\/\/.*$/gm, '')),
    'reading an undefined object behind a typeof guard fails silently, which is how this shipped');

  ok('nothing auto-deselects another toggle',
    !/lensOn\s*=\s*\{\s*\}/.test(page.replace('var lensOn = {};', '')),
    'they are additive; clearing siblings would make them radio buttons');

  ok('an empty filtered menu explains itself rather than looking broken',
    page.includes('Nothing on this week'),
    'a customer who filters to nothing must not see a blank page');
}

// ── The CATALOG page, where the filter earns its keep ───────────────────────
//
// menu.html is the weekly menu; main-menu.html is the catalog with every dinner
// on it. Somebody stocking a freezer browses the catalog, so "show me
// everything that freezes" is a real question only there.
//
// It also nearly went missing the same way twice: the first placement sat
// inside the weekly dinners block, which does not render on a week Kevin
// publishes bag sections only — so the toggles vanished with the section.
{
  const fs = await import('node:fs');
  const cat = fs.readFileSync(new URL('../main-menu.html', import.meta.url), 'utf8');

  ok('the catalog carries the lens data', /var FREEZE_LENS = \{/.test(cat));
  ok('and a Freezer filter row beside Diet and Cuisine', cat.includes('id="freezerRow"'));
  ok('the toggles are ADDITIVE, not single-select like diet and cuisine',
    /freezerOn\[state\] = !freezerOn\[state\]/.test(cat),
    'diet and cuisine clear their siblings; somebody filling a freezer wants two states on at once');
  ok('the catalog list actually honours them', cat.includes('okFreezer'));
  ok('a dish with no freeze data is excluded from a FILTERED view',
    /lensEntry && freezerOn\[lensEntry\.state\]/.test(cat),
    'claiming it belongs in any state would be a verdict nobody gave');
  ok('the boxes appear ONLY while a filter is on',
    /freezerAny\(\) && lensEntry/.test(cat),
    'Kevin: "I am not trying to overwhelm clients, just give options if they want it"');
  ok('and the box styles shipped with it', cat.includes('.lens-caveat'));

  const weekly = fs.readFileSync(new URL('../menu.html', import.meta.url), 'utf8');
  ok('on the weekly page the row sits in the always-present filter bar',
    /return lensRowHtml\(\) \+ '<div class="diet-filter">/.test(weekly),
    'inside the dinners block it disappeared entirely on a bag-sections-only week');
}

// ── INTERNAL NOTES MUST NEVER REACH A CUSTOMER ──────────────────────────────
//
// This shipped and Kevin caught it on the live menu. `freeze.note` is his own
// shorthand written TO the person building this: it carries cross-references
// ("the Brunswick potato treatment", "same as the long beans", "same as the
// black bean dish"), his name in the third person, and reasoning about variants.
// The lens printed it verbatim, so a customer reading about the Leblanc carrots
// was told about a potato treatment on a completely different dish.
//
// `freeze.customer` is the resolved, standalone sentence. `freeze.note` stays
// internal — the storage-plan bucket heuristics still read it, which is exactly
// why it must not be softened into customer copy.
{
  const { REHEAT_DATA: RD } = await import('../src/reheatData.js');

  // Phrases that only make sense to someone holding the whole record.
  const INTERNAL = /Brunswick potato treatment|same as the |Kevin:|Kevin sees|Kevin has not|variant-independent|Stuff in a Bag|on the board|All variants/i;

  let leaked = [];
  for (const id of Object.keys(RD)) {
    const c = classifyDish(id);
    if (!c) continue;
    const box = lensBox(c);
    const text = `${box.lead} ${box.detail}`;
    if (INTERNAL.test(text)) leaked.push(id);
  }
  ok('no dish shows a customer an internal cross-reference',
    leaked.length === 0,
    leaked.join(', '));

  // Every component with a note that a customer might see needs the resolved
  // version, or the fallback silently loses the substance.
  const missing = [];
  for (const [id, d] of Object.entries(RD)) {
    for (const c of d.components || []) {
      const f = c.freeze || {};
      if (f.note && f.verdict && f.verdict !== 'na' && !f.customer) missing.push(`${id}/${c.key}`);
    }
  }
  ok('every graded component with an internal note has customer copy beside it',
    missing.length === 0,
    missing.join(', '));

  ok('the lens reads freeze.customer, never freeze.note',
    !/freeze\.note/.test(
      (await import('node:fs')).readFileSync(new URL('../src/freezerLens.js', import.meta.url), 'utf8')),
    'one read of the internal field puts shorthand back on a customer page');

  // Dry goods are not a freezeable part of dinner.
  const thai = classifyDish('thai-basil-chicken-pad');
  ok('a bagged dish whose only other component is uncooked rice reads as MINIMAL',
    thai.state === 'minimal',
    'counting dry rice as freezeable made it a tie and told a customer to take the bag out of a dish that is only the bag');
  ok('and uncooked rice is never named as "what does freeze"',
    !lensBox(thai).detail.includes('rice'),
    'it ships uncooked; naming it says the pantry item was the salvageable part of dinner');
}

// ── EVERY customer surface, not just the lens ──────────────────────────────
//
// The first fix covered the freezer lens and stopped there. Kevin asked whether
// the same notes leaked elsewhere and they did, in three more places: the
// hold-back lines and the Cooking-for-fewer card on the kitchen page, and the
// ask-box grounding — where a model handed "the Brunswick potato treatment"
// against the Leblanc carrots can repeat it to someone who never ordered
// Brunswick.
//
// `divide.note` had the same disease as `freeze.note`: three of them said "the
// polenta treatment", pointing at a method recorded on a different dish.
{
  const { companionHtml, companionContext } = await import('../src/companion.js');
  const { REHEAT_DATA: RD } = await import('../src/reheatData.js');

  const INTERNAL = /Brunswick potato treatment|polenta treatment|same as the |Kevin:|Kevin sees|Kevin has not|Kevin cuts|Kevin would|precedent|variant-independent|Stuff in a Bag/i;

  // Every dish, on the page that actually reaches a customer's kitchen.
  const items = Object.keys(RD).slice(0, 12).map(id => ({ name: RD[id].__name || id, variant: 'Small', qty: 1 }));
  const order = {
    id: 'x', customer: 'A',
    items: [
      { name: 'Steak au Poivre', variant: 'Small', qty: 1 },
      { name: 'Leblanc Inspired Japanese Curry', variant: 'Small', qty: 1 },
      { name: 'Brunswick Stew', variant: 'Small', qty: 1 },
      { name: 'Pork Chop with Kabocha Purée and Charred Broccolini', variant: 'Small', qty: 1 },
    ],
  };

  const html = companionHtml(order, 'p1', { heatOnly: true, storagePlan: true, beforeYouStart: true });
  ok('the kitchen page shows no internal cross-reference',
    !INTERNAL.test(html),
    (html.match(new RegExp(INTERNAL.source, 'gi')) || []).join(', '));

  ok('the ask-box grounding shows none either',
    !INTERNAL.test(companionContext(order, {})),
    'a model given a cross-reference will repeat it to a customer who cannot follow it');

  // divide.note gets the same treatment as freeze.note.
  const missing = [];
  for (const [id, d] of Object.entries(RD)) {
    for (const c of d.components || []) {
      const dv = c.divide || {};
      if (dv.note && INTERNAL.test(dv.note) && !dv.customer) missing.push(`${id}/${c.key}`);
    }
  }
  ok('every divide note containing a cross-reference has customer copy beside it',
    missing.length === 0,
    missing.join(', '));
}

console.log(failed === 0 ? '\nFREEZER LENS: ALL PASS' : `\nFREEZER LENS: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
