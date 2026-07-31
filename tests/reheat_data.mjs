// tests/reheat_data.mjs — the Walk 2 corpus.
//
// WHAT THIS GUARDS
//
// This data is TRANSCRIBED from Kevin's answers, not derived, so the failure
// mode is not "the code is wrong" — it is "somebody filled in a blank." Most of
// what follows checks that the shape holds and that nothing claims to know more
// than Kevin said.
//
// The two assertions that matter most:
//
//   1. COVERAGE. Every live dinner has an entry. A dish missing from here is a
//      dish the ask box, Before You Start, and the freeze plan will all silently
//      say nothing about.
//   2. TESTED. Exactly one freeze answer in the whole walk is a prediction
//      rather than experience (Orecchiette). "This freezes well" reads to a
//      customer as a guarantee, so an untested verdict must carry a note
//      explaining itself, and anything rendering it must be able to tell.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  REHEAT_DATA, FREEZE_VERDICTS, DIVIDE_MODES,
  reheatDataFor, headlineMinutes, worstTiming,
  componentsThatFreeze, componentsToHoldBack, waitsBeforeStarting, vesselCount,
} from '../src/reheatData.js';
import { DISHES } from '../src/dishes.js';
import { dishIdFor } from '../src/dishIdentity.js';
import { OFF_MENU_DISHES } from '../src/menuLibrary.js';
import { CONTAINER_TYPE_ORDER } from '../src/containers.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

const off = new Set(OFF_MENU_DISHES || []);
const live = DISHES.filter(d => !off.has(d.name));

// ── Coverage ────────────────────────────────────────────────────────────────
{
  const missing = live.filter(d => !REHEAT_DATA[dishIdFor(d.name)]);
  ok('every live dinner has reheat data', missing.length === 0,
    missing.map(d => `${d.name} [${dishIdFor(d.name)}]`).join('\n      '));

  const orphans = Object.keys(REHEAT_DATA).filter(k => !live.some(d => dishIdFor(d.name) === k));
  ok('and no entry points at a dish that is not on the menu', orphans.length === 0,
    `${orphans.join(', ')} — an OFF_MENU dish keeps its record elsewhere, not here`);

  ok('off-menu dishes are deliberately absent',
    !REHEAT_DATA['coriander-lamb-steak-over'] && !REHEAT_DATA['bone-in-pork-rib-chop-with'],
    'Kevin removed both; no Walk 2 data was collected and none is needed');
}

// ── Shape ───────────────────────────────────────────────────────────────────
{
  let badVerdict = [], badMode = [], badPackage = [], noComponents = [];
  const packages = new Set([...CONTAINER_TYPE_ORDER, 'bag']);

  for (const [id, e] of Object.entries(REHEAT_DATA)) {
    if (!e.components.length) noComponents.push(id);
    for (const c of e.components) {
      if (!c.freeze || !FREEZE_VERDICTS.includes(c.freeze.verdict)) badVerdict.push(`${id}.${c.key}`);
      if (!c.divide || !DIVIDE_MODES.includes(c.divide.mode)) badMode.push(`${id}.${c.key}`);
      // null package means a passthrough — pasta, tortillas, store-bought kimchi
      // — which is legitimate and carries information: it is not ours to track.
      if (c.package !== null && !packages.has(c.package)) badPackage.push(`${id}.${c.key} → ${c.package}`);
    }
  }

  ok('every dish lists its components', noComponents.length === 0, noComponents.join(', '));
  ok('every freeze verdict is one of the declared values', badVerdict.length === 0, badVerdict.join(', '));
  ok('every divide mode is one of the declared modes', badMode.length === 0, badMode.join(', '));
  ok('every component package resolves to a real container or a bag',
    badPackage.length === 0, badPackage.join(', '));
}

// ── Nothing claims to know more than Kevin said ────────────────────────────
{
  const untested = [];
  for (const [id, e] of Object.entries(REHEAT_DATA)) {
    for (const c of e.components) {
      if (c.freeze && c.freeze.tested === false) untested.push({ id, key: c.key, note: c.freeze.note });
    }
  }

  ok('the untested freeze answers are marked as such', untested.length > 0,
    'at least one exists — Orecchiette is a prediction, not experience');
  ok('and every one of them explains itself',
    untested.every(u => u.note && u.note.length > 10),
    untested.filter(u => !u.note).map(u => `${u.id}.${u.key}`).join(', '));
  ok('Orecchiette specifically is flagged untested',
    untested.some(u => u.id === 'orecchiette-with-bitter'),
    'Kevin has not tried freezing it; every other answer came from experience');

  // A dish with no timing at all is honest; a dish with HALF a timing is not.
  const halfTimed = Object.entries(REHEAT_DATA)
    .filter(([, e]) => e.timing && ((e.timing.min == null) !== (e.timing.max == null)));
  ok('no dish records half a time range', halfTimed.length === 0,
    halfTimed.map(([id]) => id).join(', '));

  // Tex-Mex WAS the one blank in the walk. Kevin filled it on Jul 31: the
  // timing is the rice like every other rice dish, and the actual reheating is
  // about two minutes. Recording the active time separately matters — "30 to
  // 60 minutes" alone would read as an hour of work when almost all of it is
  // rice cooking unattended.
  ok('the Tex-Mex Kit timing is now filled in and rice-governed',
    REHEAT_DATA['tex-mex-kit'].timing.governor === 'rice'
    && REHEAT_DATA['tex-mex-kit'].timing.min === 30,
    'Kevin, Jul 31');
  ok('and it records how little of that is actual work',
    REHEAT_DATA['tex-mex-kit'].timing.active === 2);

  // Every dish now has a headline. A future blank is legitimate, but it must be
  // a real absence rather than a forgotten field.
  const blank = Object.entries(REHEAT_DATA).filter(([, e]) => !e.timing || (e.timing.min == null && e.timing.max == null));
  ok('every dish carries a timing', blank.length === 0, blank.map(([id]) => id).join(', '));
}

// ── The rules Kevin stated ─────────────────────────────────────────────────
{
  const riceGoverned = Object.entries(REHEAT_DATA).filter(([, e]) => e.timing && e.timing.governor === 'rice');
  ok('rice-governed dishes exist', riceGoverned.length >= 7, String(riceGoverned.length));
  ok('and every one of them is 30 to 60 minutes',
    riceGoverned.every(([, e]) => e.timing.min === 30 && e.timing.max === 60),
    riceGoverned.filter(([, e]) => e.timing.min !== 30 || e.timing.max !== 60).map(([id]) => id).join(', '));

  const pastaGoverned = Object.entries(REHEAT_DATA).filter(([, e]) => e.timing && e.timing.governor === 'pasta');
  ok('pasta-governed dishes are 20 minutes unless a temper says otherwise',
    pastaGoverned.every(([, e]) => e.timing.min === 20 || e.timing.waitFirst),
    pastaGoverned.filter(([, e]) => e.timing.min !== 20 && !e.timing.waitFirst).map(([id]) => id).join(', '));

  // THE THREE TEMPER DISHES. Kevin counts the wait inside the total, so each
  // must ALSO carry a headline big enough to contain it — a 30-minute temper
  // inside a 20-minute dish is a contradiction that would reach a customer.
  const tempered = Object.entries(REHEAT_DATA).filter(([, e]) => e.timing && e.timing.waitFirst);
  ok('three dishes ask the customer to wait before starting', tempered.length === 3,
    tempered.map(([id]) => id).join(', '));
  ok('and each headline is long enough to contain its own wait',
    tempered.every(([, e]) => e.timing.min >= e.timing.waitFirst.minutes),
    tempered.filter(([, e]) => e.timing.min < e.timing.waitFirst.minutes).map(([id]) => id).join(', '));
  ok('the tarragon pork is one of them',
    tempered.some(([id]) => id === 'pork-with-mustard-tarragon'),
    'added retrospectively at dish 23; moves its headline from ~20 to ~50');

  // SOUS VIDE VEGETABLES ARE THE FREEZE EXCEPTION, three times over. Kevin
  // stated this on Brunswick, Leblanc, and Bourguignon separately — the
  // strongest rule candidate in the document.
  for (const [id, key] of [['brunswick-stew', 'potatoes'], ['leblanc-inspired-japanese', 'carrots'], ['boeuf-bourguignon-beef-stew', 'vegetables']]) {
    const c = REHEAT_DATA[id].components.find(x => x.key === key);
    ok(`${id.split('-')[0]}: the sous vide vegetable is held back from the freezer`,
      c && c.freeze.verdict === 'no');
  }
  ok('while the braise itself freezes in all three',
    ['brunswick-stew', 'leblanc-inspired-japanese', 'boeuf-bourguignon-beef-stew']
      .every(id => componentsThatFreeze(REHEAT_DATA[id]).length > 0));

  // Bo Ssam is the only dish with ranked methods, and the only one carrying a
  // safety rule — for it, the divisibility answer IS the safety answer.
  const bs = REHEAT_DATA['bo-ssam'];
  ok('Bo Ssam records its three ranked methods', bs.methods && bs.methods.length === 3);
  ok('ranked 1 to 3 with no ties', new Set(bs.methods.map(m => m.rank)).size === 3);
  ok('the bag is ranked first and says why', bs.methods[0].rank === 1 && /remelts the fat/i.test(bs.methods[0].why || ''));
  ok('and it carries the walk\u2019s only food-safety rule', bs.safety.length > 0);
  ok('which is about re-chilling, not about rice', /re-chill/i.test(bs.safety[0]) && !/rice/i.test(bs.safety[0]));

  // The polenta dishes all use the same mode, because it is the same problem.
  const polentaDishes = ['tea-smoked-chicken-with', 'saffron-pork-ragu', 'mushroom-ragu', 'pork-chop-with-kabocha-pur-e', 'steak-au-poivre'];
  ok('every bag-is-vessel component carries its fallback',
    polentaDishes.every(id => REHEAT_DATA[id].components
      .filter(c => c.divide.mode === 'bag-is-vessel')
      .every(c => c.divide.note && /water/i.test(c.divide.note))),
    'opening one costs you the method, so the fallback has to travel with it');
}

// ── Accessors ───────────────────────────────────────────────────────────────
{
  ok('a known dish resolves', !!reheatDataFor('chili'));
  ok('an unknown one returns null rather than throwing', reheatDataFor('not-a-dish') === null);
  ok('and so does a missing id', reheatDataFor(null) === null);

  ok('a headline reads back', JSON.stringify(headlineMinutes(REHEAT_DATA['chili'])) === JSON.stringify({ min: 10, max: 10 }));
  // The accessor must still survive a blank, even though nothing is blank
  // today — a future dish added without a walk answer is the case this covers.
  ok('a blank timing gives no headline',
    headlineMinutes({ timing: { min: null, max: null } }) === null);
  ok('and a missing entry gives none either', headlineMinutes(null) === null);

  // Across several dishes on one night the SLOWEST governor wins, or the
  // estimate is wrong in the direction that ruins dinner.
  const w = worstTiming([REHEAT_DATA['bolognese'], REHEAT_DATA['gumbo'], REHEAT_DATA['chili']]);
  ok('the worst timing across several dishes takes the slowest', w.min === 30 && w.max === 60, JSON.stringify(w));
  ok('and it survives a dish with no timing at all',
    worstTiming([{ timing: { min: null, max: null } }, REHEAT_DATA['chili']]) !== null);
  ok('an empty list gives null', worstTiming([]) === null);

  ok('hold-back components are found', componentsToHoldBack(REHEAT_DATA['brunswick-stew']).some(c => c.key === 'potatoes'));
  ok('waits are found', waitsBeforeStarting(REHEAT_DATA['steak-au-poivre']).length === 1);
  ok('and a dish with no wait reports none', waitsBeforeStarting(REHEAT_DATA['chili']).length === 0);

  // Double duty is a NOTE, not a second vessel — the pork chop reuses one pan.
  ok('the pork chop counts two vessels, not three', vesselCount(REHEAT_DATA['pork-chop-with-kabocha-pur-e']) === 2,
    'the pan does double duty: sear the pork, then the broccolini in its fat');
}

// ── This file must stay transcription ──────────────────────────────────────
{
  const src = fs.readFileSync(path.join(ROOT, 'src/reheatData.js'), 'utf8');
  ok('the module states that it is transcribed, not derived',
    /TRANSCRIBED FROM WALK 2, NOT DERIVED/.test(src));
  ok('and that it must never live on dish.recipe',
    /version hash/.test(src),
    'a walk answer arriving must never cut a recipe version');
}


// ── Before You Start (Phase 4) ─────────────────────────────────────────────
//
// The card that answers "how long is this, and should I have started something
// ten minutes ago". The wait leads because it is the only genuinely urgent
// thing on it — somebody who reads it after starting has already lost the
// half hour.
{
  const { beforeYouStart, narrateBeforeYouStart } = await import('../src/reheatData.js');

  const plan = beforeYouStart([REHEAT_DATA['steak-au-poivre'], REHEAT_DATA['chili']]);
  ok('a plan is produced', !!plan);
  ok('the slowest dish sets the total', plan.total.min === 50);
  ok('the wait is surfaced', plan.longestWait && plan.longestWait.minutes === 30);

  // WAITS OVERLAP, they do not add. Two dishes each wanting 30 minutes on the
  // counter want 30 minutes, not 60.
  const twoTempers = beforeYouStart([REHEAT_DATA['steak-au-poivre'], REHEAT_DATA['pork-chop-with-kabocha-pur-e']]);
  ok('two tempers do not add up to an hour', twoTempers.longestWait.minutes === 30);

  const lines = narrateBeforeYouStart(plan);
  ok('the wait is the FIRST thing said', /^Start now/.test(lines[0]),
    'reading it after starting means the half hour is already gone');
  ok('the total is stated in customer-clock terms', lines.some(l => /until you eat/.test(l)));

  // 'varies' is a placeholder for Bo Ssam, whose vessels depend on the method
  // chosen. It printed "a varies" on a customer card in the first version.
  const everything = narrateBeforeYouStart(beforeYouStart(Object.values(REHEAT_DATA)));
  ok('no equipment placeholder ever reaches a customer',
    !everything.some(l => /varies/.test(l)),
    everything.filter(l => /varies/.test(l)).join(' | '));
  ok('and the method-dependent dish says so in words',
    narrateBeforeYouStart(beforeYouStart([REHEAT_DATA['bo-ssam']])).some(l => /choice of methods/.test(l)));

  // Vessels are counted by TYPE. The first version listed them raw and printed
  // "2 pans or pots going: pot, pot", which reads like a bug.
  const bol = narrateBeforeYouStart(beforeYouStart([REHEAT_DATA['bolognese']]));
  ok('vessels are tallied, not listed twice', bol.some(l => /2 pots/.test(l)) && !bol.some(l => /pot, pot/.test(l)));

  ok('hands-on time appears when Kevin split it',
    narrateBeforeYouStart(beforeYouStart([REHEAT_DATA['tex-mex-kit']])).some(l => /hands-on/.test(l)),
    'Tex-Mex is 30-60 minutes of rice and about 2 minutes of work');

  ok('safety lines carry through', narrateBeforeYouStart(beforeYouStart([REHEAT_DATA['bo-ssam']])).some(l => /re-chill/i.test(l)));
  ok('an empty order produces no plan', beforeYouStart([]) === null);
  ok('and narrating nothing gives nothing', narrateBeforeYouStart(null).length === 0);
}

// ── It renders, and its flag turns it off ──────────────────────────────────
{
  const { companionHtml } = await import('../src/companion.js');
  const { JSDOM } = await import('jsdom');
  const order = { id: 'o', customer: 'T', items: [{ name: 'Steak au Poivre', qty: 1, variant: 'Small (~2)' }] };

  const on = new JSDOM(companionHtml(order, 'p', {})).window.document.querySelector('.bys');
  ok('the card renders on the kitchen page', !!on);
  ok('and leads with the temper', on && /^Start now/.test(on.querySelector('p').textContent));

  const off = new JSDOM(companionHtml(order, 'p', { beforeYouStart: false })).window.document.querySelector('.bys');
  ok('its flag removes it entirely', !off);

  const { FLAG_IDS } = await import('../src/featureFlags.js');
  ok('the flag is declared in the registry', FLAG_IDS.includes('beforeYouStart'));
  const worker = fs.readFileSync(path.join(ROOT, 'worker.js'), 'utf8');
  ok('and in the worker\'s duplicated evaluator', /beforeYouStart/.test(worker),
    'a flag on one side only means the two disagree about what a customer sees');
}


// ── Eat First / Freeze First (Phase 5) ─────────────────────────────────────
//
// Answers the question the per-item instructions never could: "I bought four
// meals, which do I eat first?" PER COMPONENT, because that is where Kevin's
// answers live — a Bo Ssam is three different storage decisions and any
// per-dish label would have to lie about two of them.
{
  const { storagePlan, holdBackBeforeFreezing, narrateStoragePlan } = await import('../src/reheatData.js');
  const mk = (pairs) => pairs.map(([name, id]) => ({ name, entry: REHEAT_DATA[id] }));

  const bo = mk([['Bo Ssam', 'bo-ssam']]);
  const rows = storagePlan(bo);
  ok('a Bo Ssam produces several storage rows, not one label', rows.length >= 3);
  ok('the pork is a freeze row', rows.some(r => r.component === 'pork' && r.bucket === 'freeze'));
  ok('the sauce is urgent because it has a stated window',
    rows.some(r => r.component === 'ginger scallion sauce' && r.bucket === 'soon'),
    'the only stated fridge window in the walk — invisible to anything that only asks "does it freeze"');
  ok('the kimchi is left alone', rows.some(r => r.component === 'kimchi' && r.bucket === 'keeps'));

  // ORDER IS THE ADVICE. A list that just repeats each verdict is the data.
  const mixed = mk([['Bolognese', 'bolognese'], ['Bo Ssam', 'bo-ssam']]);
  const sorted = storagePlan(mixed);
  ok('urgent rows sort ahead of freezable ones', sorted[0].bucket === 'soon');

  // Uncooked rice and pasta packs are not storage decisions.
  ok('na components are excluded entirely',
    !storagePlan(mk([['Gumbo', 'gumbo']])).some(r => r.component === 'rice'));

  const lines = narrateStoragePlan(sorted, holdBackBeforeFreezing(mixed));
  ok('the narration leads with what to eat first', /^Eat first/.test(lines[0]));

  // THE HEDGE TRAVELS. One component in the whole corpus is a prediction.
  const orec = mk([['Orecchiette', 'orecchiette-with-bitter']]);
  const orecLines = narrateStoragePlan(storagePlan(orec), holdBackBeforeFreezing(orec));
  ok('an untested freeze answer says so in the plan',
    orecLines.some(l => /has not tested/.test(l)),
    '"this freezes well" reads to a customer as a promise');
  ok('and it is not lumped in with the tested ones',
    !orecLines.some(l => /Freeze now/.test(l) && /Orecchiette/.test(l)));

  // HOLD-BACKS: the strongest pattern in the walk, stated three times.
  const three = mk([['Brunswick Stew', 'brunswick-stew'], ['Leblanc', 'leblanc-inspired-japanese'], ['Bourguignon', 'boeuf-bourguignon-beef-stew']]);
  const holds = holdBackBeforeFreezing(three);
  ok('all three sous-vide-vegetable hold-backs are found', holds.length >= 3,
    holds.map(h => `${h.dish}/${h.component}`).join(', '));
  ok('a dish that does not freeze at all produces no hold-back',
    holdBackBeforeFreezing(mk([['Thai', 'thai-basil-chicken-pad']])).length === 0,
    'there is nothing to hold back from a freezer you are not using');

  // Both fixed after the first version read wrong: the Bo Ssam sauce appeared
  // twice, and "take it out first" implied it was inside the pork bag.
  const boLines = narrateStoragePlan(storagePlan(bo), holdBackBeforeFreezing(bo));
  ok('a component named as urgent is not repeated as a hold-back',
    boLines.filter(l => /ginger scallion/.test(l)).length === 1,
    boLines.join(' | '));
  ok('hold-back wording does not imply containment',
    !boLines.some(l => /out first/.test(l)));

  ok('an empty order produces no plan', storagePlan([]) === null);
  ok('and narrating nothing gives nothing', narrateStoragePlan(null, null).length === 0);
}

// ── It renders, after the urgent card ──────────────────────────────────────
{
  const { companionHtml } = await import('../src/companion.js');
  const { JSDOM } = await import('jsdom');
  const order = { id: 'o', customer: 'T', items: [{ name: 'Bo Ssam', qty: 1, variant: 'Small (~4 servings)' }] };
  const doc = new JSDOM(companionHtml(order, 'p', {})).window.document;

  ok('the storage card renders', !!doc.querySelector('.store'));
  // Before You Start is urgent (a temper to begin); this is not — it is the
  // question you have while putting the other containers away.
  const order2 = [...doc.querySelectorAll('.bys, .store')].map(e => e.className);
  ok('and it comes after Before You Start', order2.indexOf('bys') < order2.indexOf('store'));

  ok('its flag removes it', !new JSDOM(companionHtml(order, 'p', { storagePlan: false })).window.document.querySelector('.store'));

  const { FLAG_IDS } = await import('../src/featureFlags.js');
  ok('the flag is in the registry', FLAG_IDS.includes('storagePlan'));
  ok('and in the worker', /storagePlan/.test(fs.readFileSync(path.join(ROOT, 'worker.js'), 'utf8')));
}


// ── Heat Only What You Need (Phase 6) ──────────────────────────────────────
//
// Kevin's reframing IS the feature: not "is it in a bag" but "is the bag the
// cooking vessel". And for the Bo Ssam the safety answer and the divisibility
// answer are the same answer.
{
  const { heatOnlyWhatYouNeed, narrateHeatOnly } = await import('../src/reheatData.js');
  const mk = (pairs) => pairs.map(([name, id]) => ({ name, entry: REHEAT_DATA[id] }));

  // HARDEST FIRST. A card that opens with "the chili takes whatever you want"
  // buries the one thing the customer needed to know.
  const mixed = heatOnlyWhatYouNeed(mk([['Chili', 'chili'], ['Bo Ssam', 'bo-ssam']]));
  ok('the hard cases sort first', mixed[0].mode === 'not-recommended', mixed[0].mode);

  // The Bo Ssam shape: do not divide it THAT way, but here is how.
  const bo = narrateHeatOnly(heatOnlyWhatYouNeed(mk([['Bo Ssam', 'bo-ssam']])));
  ok('a not-recommended dish with alternatives offers them',
    bo.some(l => /oven/.test(l) && /microwave/.test(l)),
    'saying only "do not" would leave a customer with no route at all');
  ok('and its safety rule travels with it', bo.some(l => /re-chilling/i.test(l)));
  ok('without doubling the article', !bo.some(l => /use the the/.test(l)));

  // The polenta shape: the awkward part is named, and the fallback comes with it.
  const saf = narrateHeatOnly(heatOnlyWhatYouNeed(mk([['Saffron Pork Ragu', 'saffron-pork-ragu']])));
  ok('a bag-is-vessel component names itself as the awkward part',
    saf.some(l => /polenta is the awkward part/.test(l)));
  ok('and carries the stir-and-water fallback', saf.some(l => /water/i.test(l)));

  // The genuine no, with no alternatives to offer.
  const thai = narrateHeatOnly(heatOnlyWhatYouNeed(mk([['Thai Basil Chicken', 'thai-basil-chicken-pad']])));
  ok('a dish Kevin grades down says so plainly', thai.some(l => /would not divide/.test(l)));

  // A safety line stated once per card even when several dishes share it.
  const twice = narrateHeatOnly(heatOnlyWhatYouNeed(mk([['Bo Ssam', 'bo-ssam'], ['Bo Ssam again', 'bo-ssam']])));
  ok('a repeated safety rule is stated once', twice.filter(l => /re-chilling/i.test(l)).length === 1);

  ok('an order of easy dishes just says so',
    narrateHeatOnly(heatOnlyWhatYouNeed(mk([['Chili', 'chili'], ['Bolognese', 'bolognese']])))
      .some(l => /as much or as little/.test(l)));
  ok('an empty order produces nothing', heatOnlyWhatYouNeed([]) === null);
  ok('and narrating nothing gives nothing', narrateHeatOnly(null).length === 0);
}

// ── It renders behind its flag ─────────────────────────────────────────────
{
  const { companionHtml } = await import('../src/companion.js');
  const { JSDOM } = await import('jsdom');
  const order = { id: 'o', customer: 'T', items: [{ name: 'Bo Ssam', qty: 1, variant: 'Small (~4 servings)' }] };
  ok('the card renders', !!new JSDOM(companionHtml(order, 'p', {})).window.document.querySelector('.fewer'));
  ok('its flag removes it', !new JSDOM(companionHtml(order, 'p', { heatOnly: false })).window.document.querySelector('.fewer'));

  const { FLAG_IDS } = await import('../src/featureFlags.js');
  ok('the flag is in the registry', FLAG_IDS.includes('heatOnly'));
  ok('and in the worker', /heatOnly/.test(fs.readFileSync(path.join(ROOT, 'worker.js'), 'utf8')));

  // THE FLOOR still holds with every one of the new cards off.
  const bare = new JSDOM(companionHtml(order, 'p', { beforeYouStart: false, storagePlan: false, heatOnly: false })).window.document;
  ok('with all four new cards off the kitchen page still has the reheat instructions',
    bare.body.textContent.includes('pork'),
    'the cards are additions; the instructions are the product');
}

console.log(f === 0 ? '\nREHEAT DATA: ALL PASS' : `\nREHEAT DATA: ${f} FAILURES`);
process.exit(f ? 1 : 0);
