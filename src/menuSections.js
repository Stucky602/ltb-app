// menuSections.js — which parts of the menu are on offer this week.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS IS FOR
//
// Kevin, Aug 7: "I've had a really rough week and only want to focus on like,
// 2 dinners. No veggies or sous vide items or desserts or any of that."
//
// Picking two dinners was already possible. Everything else on the menu is an
// ALWAYS-item — `buildMenu()` staples the whole of ALWAYS_MENU onto whatever
// dinners are selected — so desserts, fruit, sauces, the bag and the sous vide
// veg went out every single week whether or not he had the hands for them.
// There was no way to say no. This is that way.
//
// ═══════════════════════════════════════════════════════════════════════════
// NO NEW PUBLISHED FIELD, AND THAT IS THE DESIGN, NOT A SHORTCUT
//
// The obvious build is a `sections` object in the published config. It would
// need a worker paste, because `CONFIG_FIELDS` in worker.js rebuilds the stored
// config from its own list and silently discards anything it does not know —
// `notice`, `oneBottle`, and `paused` have each died that way.
//
// It is not needed. Every section already has its own whitelisted array, and
// every consumer already gates on that array's LENGTH. So a section that is off
// publishes as `[]` and disappears on its own, through machinery that has been
// carrying weight for months. No paste, no new contract, no fourth copy of the
// section list.
//
// THE ONE PLACE THAT WAS NOT TRUE is recorded here because it made the feature
// impossible rather than merely incomplete: menu.page.html rebuilt the sauce
// list FROM THE LIBRARY whenever `config.sauces` came back empty. That fallback
// was harmless while sauces always shipped, and it turns this toggle into a
// lie — switch sauces off and the page puts them straight back. Removed.
//
// WHAT THE CUSTOMER SEES is simply a shorter menu. Nothing announces "no
// desserts this week", because an absent section already reads as absent and
// the heads-up banner is the thing that carries the words. Kevin's own example
// was pairing this with a "limited menu this week" notice, which already works.
//
// ═══════════════════════════════════════════════════════════════════════════
// THESE ARE CUSTOMER-FACING SECTIONS, NOT KITCHEN LIMITS
//
// Turning desserts off does not stop Kevin adding a dessert to an order by
// hand. `buildMenu()` still feeds his own order form and the text parser with
// everything, deliberately: a limited week is about what he is offering, not
// about refusing to do someone a favour.

import { MENU_BAG } from './menuLibrary.js';

// The sous vide vegetables render as their own block inside Stuff in a Bag, and
// Kevin named them separately when he asked for this, so they toggle
// separately. Both halves live in the `bag` array and are split by name.
//
// DERIVED FROM THE COPY LIBRARY, WHICH IS WHAT THE PAGE ACTUALLY RENDERS FROM.
// menu.page.html decides where an item goes by reading `isSousVideVeg` off
// `lookupBagCopy(name)`, so taking the split from anywhere else would let the
// toggle and the page disagree — a vegetable still showing on a veg-off week,
// or a protein vanishing on a bag-off one. dishes.js keeps its own
// `SOUS_VIDE_VEG_NAMES`, and recipes.js keeps a third list for shopping (which
// is legitimately different: it omits Garlic Confit). tests/menu_sections.mjs
// asserts this set and dishes.js's agree exactly.
export const SOUS_VIDE_VEG_SECTION = new Set(
  Object.entries(MENU_BAG || {}).filter(([, copy]) => copy && copy.isSousVideVeg).map(([name]) => name)
);

// Ordered as they appear on the weekly menu, so the checklist reads in the same
// order as the page it controls.
export const MENU_SECTIONS = [
  { id: 'dinners', label: 'Dinners', hint: 'the rotating mains, and the spotlight' },
  { id: 'bag', label: 'Stuff in a Bag', hint: 'steaks, chops, proteins' },
  { id: 'veg', label: 'Sous Vide Vegetables', hint: 'inside the bag section' },
  { id: 'sauces', label: 'Finishing Sauces', hint: '' },
  { id: 'fruit', label: 'Fresh Cut Fruit', hint: '' },
  { id: 'desserts', label: 'Desserts', hint: '' },
  { id: 'addons', label: 'Add-Ons & Extras', hint: 'queso, syrups, pickles' },
];

export const SECTION_IDS = MENU_SECTIONS.map(s => s.id);

// Which published arrays each section empties. `dinners` owns two, and `bag`
// and `veg` share one and split it by name — so this is a map for the gate to
// check completeness against, not the filter's own logic.
export const SECTION_FIELDS = {
  dinners: ['dishes', 'spotlight'],
  bag: ['bag'],
  veg: ['bag'],
  sauces: ['sauces'],
  fruit: ['fruit'],
  desserts: ['desserts'],
  addons: ['addons'],
};

export function allSectionsOn() {
  const out = {};
  for (const id of SECTION_IDS) out[id] = true;
  return out;
}

// ABSENT MEANS ON. Every one of them.
//
// This is the same rule `orderClosesAt` follows and for the same reason: a
// missing value must never resolve to the restrictive side. A publish from an
// app that predates this feature, a corrupted store, a hand-edited payload —
// each arrives here as undefined, and each must produce a full menu. The
// failure this prevents is silent and total: an empty menu that looks like a
// deliberate quiet week and would be found by a customer, not by Kevin.
export function normalizeSections(raw) {
  const out = allSectionsOn();
  if (!raw || typeof raw !== 'object') return out;
  for (const id of SECTION_IDS) {
    // Only an EXPLICIT false turns anything off. `undefined`, `null`, a missing
    // key, and any junk value all leave the section on.
    if (raw[id] === false) out[id] = false;
  }
  return out;
}

export const isSousVideVegName = (name) => SOUS_VIDE_VEG_SECTION.has(name);

// Takes the section arrays publishWeek has already built and returns the same
// shape with the switched-off ones emptied. Pure; no knowledge of the payload
// around it, so publish order and every other field are untouched.
export function applySections(built, sections) {
  const on = normalizeSections(sections);
  const keep = (flag, list) => (flag ? (list || []) : []);
  return {
    dishes: keep(on.dinners, built.dishes),
    spotlight: keep(on.dinners, built.spotlight),
    fruit: keep(on.fruit, built.fruit),
    desserts: keep(on.desserts, built.desserts),
    addons: keep(on.addons, built.addons),
    sauces: keep(on.sauces, built.sauces),
    // ONE ARRAY, TWO SWITCHES. Each item asks the switch that owns it, so
    // "proteins but no veg" and "veg but no proteins" both work and neither
    // needs the array split before it gets here.
    bag: (built.bag || []).filter(it => (isSousVideVegName(it.name) ? on.veg : on.bag)),
  };
}

// For the publish confirmation and the audit line. Names what is OFF, because
// that is the short list and the surprising one.
export function describeSections(sections) {
  const on = normalizeSections(sections);
  const off = MENU_SECTIONS.filter(s => !on[s.id]);
  if (!off.length) return 'Full menu';
  return `Limited menu — no ${off.map(s => s.label.toLowerCase()).join(', no ')}`;
}
