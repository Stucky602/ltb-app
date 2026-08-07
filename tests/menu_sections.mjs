// tests/menu_sections.mjs — the week's menu can be cut down, and cannot be cut
// down by accident.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE TWO FAILURES THIS EXISTS TO PREVENT
//
// 1. AN EMPTY MENU NOBODY MEANT. Every section defaults to on and anything
//    unrecognised resolves to on, because the failure mode here is silent and
//    total: a menu with nothing on it looks like a deliberate quiet week and
//    would be found by a customer, not by Kevin. Absent must never mean off.
//
// 2. A SWITCH THAT DOES NOTHING. menu.page.html rebuilt the sauce list from
//    the copy library whenever the published array came back empty, so
//    switching sauces off would have put them straight back. That fallback is
//    gone and this asserts it stays gone — the same wired-on-one-side class
//    that has now cost this repo six separate features.

import { readFileSync } from 'node:fs';
import {
  MENU_SECTIONS, SECTION_IDS, SECTION_FIELDS, SOUS_VIDE_VEG_SECTION,
  allSectionsOn, normalizeSections, applySections, describeSections, isSousVideVegName,
} from '../src/menuSections.js';
import { REPORTABLE_BAG_VEG, REPORTABLE_BAG_PROTEINS } from '../src/dishes.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

const menu = () => ({
  dishes: [{ name: 'Bolognese' }, { name: 'Chili' }],
  spotlight: [{ name: 'Fesenjan' }],
  fruit: [{ name: 'Pineapple' }],
  desserts: [{ name: 'Peanut Butter Fudge' }],
  addons: [{ name: 'Queso' }],
  sauces: [{ name: 'Chimichurri' }],
  bag: [{ name: 'Ribeye' }, { name: 'Carrots' }, { name: 'Flank Steak' }, { name: 'Garlic Confit' }],
});

// ── 1. THE REGISTRY IS COMPLETE ─────────────────────────────────────────────
{
  ok(`there are sections to offer (${MENU_SECTIONS.length})`, MENU_SECTIONS.length >= 5);
  ok('every section has an id, a label, and a field mapping',
    MENU_SECTIONS.every(s => s.id && s.label && Array.isArray(SECTION_FIELDS[s.id])));
  ok('no section id repeats', new Set(SECTION_IDS).size === SECTION_IDS.length);

  // Every array applySections returns must be owned by at least one section,
  // or it is a part of the menu with no switch and no way to say no to it.
  const out = applySections(menu(), null);
  const owned = new Set(Object.values(SECTION_FIELDS).flat());
  const unowned = Object.keys(out).filter(k => !owned.has(k));
  ok(`every published section array has a switch (${unowned.length} unowned)`,
    unowned.length === 0, unowned.join(', '));

  // And the reverse: a mapping naming an array that no longer ships.
  const real = new Set(Object.keys(out));
  const phantom = [...owned].filter(f => !real.has(f));
  ok(`no switch names an array that is not published (${phantom.length})`, phantom.length === 0, phantom.join(', '));

  ok('the shape in equals the shape out', JSON.stringify(Object.keys(out).sort()) === JSON.stringify(Object.keys(menu()).sort()));
}

// ── 2. ABSENT MEANS ON. THIS IS THE SAFETY RULE ─────────────────────────────
{
  for (const [label, input] of [
    ['undefined', undefined], ['null', null], ['a string', 'nope'], ['a number', 7],
    ['an empty object', {}], ['an array', []], ['unknown keys only', { pudding: false }],
    ['a truthy junk value', { desserts: 'maybe' }], ['null for a section', { desserts: null }],
  ]) {
    const n = normalizeSections(input);
    ok(`${label} leaves every section on`, SECTION_IDS.every(id => n[id] === true), JSON.stringify(n));
  }
  ok('only an explicit false turns anything off',
    normalizeSections({ desserts: false }).desserts === false
    && normalizeSections({ desserts: 0 }).desserts === true,
    JSON.stringify(normalizeSections({ desserts: 0 })));

  // The whole point, restated as an assertion: no input to normalizeSections
  // can produce a menu with nothing on it except one that says so section by
  // section.
  const full = applySections(menu(), undefined);
  ok('an unrecognised store publishes the FULL menu, never an empty one',
    Object.values(full).every(v => v.length > 0), JSON.stringify(Object.entries(full).map(([k, v]) => [k, v.length])));
}

// ── 3. THE SWITCHES ACTUALLY SWITCH ─────────────────────────────────────────
{
  const off = applySections(menu(), { dinners: false, fruit: false, desserts: false, addons: false, sauces: false, bag: false, veg: false });
  ok('everything off empties every array', Object.values(off).every(v => v.length === 0),
    JSON.stringify(Object.entries(off).map(([k, v]) => [k, v.length])));

  const noDesserts = applySections(menu(), { desserts: false });
  ok('desserts off empties desserts', noDesserts.desserts.length === 0);
  ok('and leaves every other section untouched',
    noDesserts.dishes.length === 2 && noDesserts.fruit.length === 1 && noDesserts.bag.length === 4 && noDesserts.sauces.length === 1);

  // Kevin's own example, verbatim: two dinners and nothing else.
  const roughWeek = applySections(menu(), { bag: false, veg: false, sauces: false, fruit: false, desserts: false, addons: false });
  ok('"just 2 dinners, none of the rest" leaves only the dinners',
    roughWeek.dishes.length === 2 && roughWeek.spotlight.length === 1
    && ['fruit', 'desserts', 'addons', 'sauces', 'bag'].every(k => roughWeek[k].length === 0));

  ok('dinners off empties the spotlight too, not just the roster',
    applySections(menu(), { dinners: false }).spotlight.length === 0);
}

// ── 4. BAG AND VEG SHARE ONE ARRAY AND SPLIT BOTH WAYS ──────────────────────
{
  const noVeg = applySections(menu(), { veg: false });
  ok('veg off drops the vegetables and keeps the proteins',
    noVeg.bag.length === 2 && noVeg.bag.every(i => !isSousVideVegName(i.name)),
    noVeg.bag.map(i => i.name).join(', '));

  const noBag = applySections(menu(), { bag: false });
  ok('bag off drops the proteins and keeps the vegetables',
    noBag.bag.length === 2 && noBag.bag.every(i => isSousVideVegName(i.name)),
    noBag.bag.map(i => i.name).join(', '));

  ok('Garlic Confit counts as a vegetable, matching the page',
    isSousVideVegName('Garlic Confit'));

  // THE DRIFT GUARD. The split is derived from the copy library because that is
  // what menu.page.html renders from; dishes.js keeps its own list for
  // reporting. If they diverge, an item lands in the wrong half and a veg-off
  // week still shows a vegetable.
  const fromDishes = REPORTABLE_BAG_VEG.map(i => i.name).sort();
  const fromCopy = [...SOUS_VIDE_VEG_SECTION].sort();
  ok(`the copy library and dishes.js agree on which bag items are vegetables (${fromCopy.length})`,
    JSON.stringify(fromDishes) === JSON.stringify(fromCopy),
    `dishes: ${fromDishes.join(', ')}\n      copy:   ${fromCopy.join(', ')}`);
  ok('and no bag protein is caught by the vegetable split',
    REPORTABLE_BAG_PROTEINS.every(i => !isSousVideVegName(i.name)),
    REPORTABLE_BAG_PROTEINS.filter(i => isSousVideVegName(i.name)).map(i => i.name).join(', '));
}

// ── 5. THE SAUCE FALLBACK IS GONE AND MUST STAY GONE ────────────────────────
{
  const page = readFileSync(new URL('../src/pages/menu.page.html', import.meta.url), 'utf8');
  // Describe the forbidden shape rather than quoting it, or this check matches
  // the comment that explains it — six instances of that in this repo already.
  const rebuildsFromLibrary = /sauces\.length\s*===\s*0\s*&&/.test(page);
  ok('the weekly menu does not rebuild sauces from the library when the array is empty',
    !rebuildsFromLibrary,
    'an empty sauces array is how Kevin says "no sauces this week"; a fallback makes the switch a lie');

  const built = readFileSync(new URL('../menu.html', import.meta.url), 'utf8');
  ok('and the built page does not either', !/sauces\.length\s*===\s*0\s*&&/.test(built));
}

// ── 6. BOTH PUBLISH PATHS SEND IT ───────────────────────────────────────────
// The wired-on-one-side guard, named for the class it belongs to. `customerFlags`
// was collected by WeekTab and dropped by publishWeek for weeks; `notice` died
// the same way. A field is only wired when the sender and the reader both exist.
{
  const tab = readFileSync(new URL('../src/components/WeekTab.jsx', import.meta.url), 'utf8')
    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  const sends = (tab.match(/sections:\s*normalizeSections\(sections\)/g) || []).length;
  ok(`WeekTab sends sections on BOTH publish paths (${sends} call sites)`, sends === 2, `${sends} found, expected 2`);

  const pub = readFileSync(new URL('../src/publishWeek.js', import.meta.url), 'utf8')
    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  ok('publishWeek reads extras.sections', /applySections\(/.test(pub) && /extras\s*&&\s*extras\.sections/.test(pub));
  ok('and the payload ships the FILTERED arrays, not the unfiltered ones',
    /dishes:\s*shown\.dishes/.test(pub) && /bag:\s*shown\.bag/.test(pub) && /sauces:\s*shown\.sauces/.test(pub),
    'a payload naming the raw locals would make the whole feature inert');
}

// ── 7. THE DESCRIPTION READS LIKE A SENTENCE ────────────────────────────────
{
  ok('a full menu says so', describeSections(null) === 'Full menu', describeSections(null));
  const d = describeSections({ desserts: false, veg: false });
  ok('and a limited one names what is missing', /desserts/.test(d) && /vegetables/.test(d), d);
}

console.log(failed ? `\nMENU SECTIONS: ${failed} FAILURES` : '\nMENU SECTIONS: ALL PASS');
process.exit(failed ? 1 : 0);
