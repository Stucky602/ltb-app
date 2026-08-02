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
  const action = lensBox(classifyDish('brunswick-stew'));
  ok('a dish needing a STEP leads with the action',
    /^Before you freeze this/.test(action.lead),
    action.lead);

  const quality = lensBox(classifyDish('stir-fried-long-beans-with'));
  ok('a dish with only a QUALITY note says exactly that instead',
    /^Freezes fine/.test(quality.lead),
    quality.lead);

  // Why the distinction exists at all.
  ok('the quality box does NOT tell someone to take something out',
    !/take out/.test(quality.lead + quality.detail),
    'a customer who reads "needs attention" and finds it meant slightly soft gai lan stops reading yellow boxes, '
    + 'and the box has to keep its credibility for Brunswick where ignoring it produces a bad dinner');

  ok('the box prefers Kevin\'s own recorded note over a generated sentence',
    /Not as good, but good/.test(action.lead),
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

  ok('the whole feature is gated on the freezerLens flag',
    /function lensEnabled[\s\S]{0,400}freezerLens/.test(page));

  ok('nothing auto-deselects another toggle',
    !/lensOn\s*=\s*\{\s*\}/.test(page.replace('var lensOn = {};', '')),
    'they are additive; clearing siblings would make them radio buttons');

  ok('an empty filtered menu explains itself rather than looking broken',
    page.includes('Nothing on this week'),
    'a customer who filters to nothing must not see a blank page');
}

console.log(failed === 0 ? '\nFREEZER LENS: ALL PASS' : `\nFREEZER LENS: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
