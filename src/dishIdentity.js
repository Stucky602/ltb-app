// dishIdentity.js — stable dish identity.
//
// THE PROBLEM THIS SOLVES. Every subsystem in this app identifies a dish by its
// DISPLAY STRING: order items, passport stamps, journal subjects, container
// mapping, sales counts, the cook list. That makes a rename a data migration,
// and `DISH_RENAMES` is a patch over the flaw rather than a fix for it. The
// consequences are not theoretical: on Jul 24 alone, four historical names were
// found sitting in order history that the registry no longer knew, each one
// silently splitting its dish's passport stamps and sales counts. That bug
// class was fixed twice in one day by patching symptoms.
//
// The fix is an immutable id, with the name demoted to a display field.
//
// HOW THIS ROLLS OUT, and why it is safe. Purely ADDITIVE. Records gain a
// `dishId` and KEEP their `name`, so every consumer that still resolves by
// name keeps working untouched, including the modules not yet migrated
// (passport.js, dishCosting.js, favorites.js, regularsIntel.js, repricing.js).
// Readers move to ids one at a time. Nothing is removed until every reader has
// moved, and the manifest below makes that a checkable condition rather than a
// belief.
//
// THE ONE RULE: an id is issued once and never changes, never gets reused, and
// never disappears. Rename the dish freely; the id is what everything else
// points at. DISH_ID_MANIFEST is the frozen record of every id ever issued, and
// an invariant fails the build if one goes missing from the registry, because a
// vanished id means orphaned history somewhere.

import { DISHES, ALWAYS_ITEMS } from './dishes.js';
import { DISH_RENAMES } from './utils.js';

// Every id ever issued. APPEND ONLY. Never edit, never delete a line, never
// reuse a string. A dish leaving the menu does NOT remove its id from here:
// its history still points at it.
export const DISH_ID_MANIFEST = Object.freeze([
  // dinners (27)
  'brunswick-stew',
  'chili',
  'gumbo',
  'tex-mex-kit',
  'indian-style-curry',
  'leblanc-inspired-japanese',
  'tea-smoked-chicken-with',
  'bo-ssam',
  'cumin-mushroom-noodles-cumin',
  'mapo-eggplant',
  'shrimp-or-tofu-with',
  'stir-fried-long-beans-with',
  'texas-gulf-shrimp-or-tofu',
  'thai-basil-chicken-pad',
  'bolognese',
  'pasta-with-homegrown-tomato',
  'orecchiette-with-bitter',
  'pappardelle-with-vegetables',
  'saffron-pork-ragu',
  'pork-with-mustard-tarragon',
  'mushroom-ragu',
  'coriander-lamb-steak-over',
  'pork-chop-with-kabocha-pur-e',
  'bone-in-pork-rib-chop-with',
  'steak-au-poivre',
  'boeuf-bourguignon-beef-stew',
  'pecan-mole-fesenjan-beef-and',
  // always items (34)
  'homemade-waffles',
  'fresh-cut-pineapple',
  'seasonal-cantaloupe',
  'chocolate-chip-cookies',
  'peanut-butter-fudge',
  'brownies',
  'queso',
  'pickled-onions-or-carrots',
  'chili-oil',
  'thyme-or-lavender-syrup',
  'vanilla-syrup',
  'vanilla-lavender-syrup',
  'filet-mignon',
  'filet-mignon-prime',
  'flank-steak',
  'ny-strip',
  'ny-strip-prime',
  // Grass fed tier, added Jul 30. Appended, never inserted among the existing
  // ids: this manifest is the anchor every version, cue, and container mapping
  // resolves against.
  'ny-strip-grassfed',
  'ribeye-grassfed',
  'filet-mignon-grassfed',
  'ribeye',
  'ribeye-prime',
  'pork-tenderloin',
  'thick-cut-pork-chop',
  'air-chilled-chicken-breast',
  'carrots',
  'baby-gold-potatoes',
  'corn-off-the-cob',
  'kabocha-squash',
  'parsnips',
  'asparagus',
  'garlic-confit',
  'chimichurri',
  'romesco',
  'chermoula',
  'miso-butter-sauce',
  'whipped-lemon-garlic-herb',
]);

// BOTH registries. Scoping identity to dinners would have missed the exact bug
// that motivated it: 'Chicken Breast' is an always-item, and it was one of the
// four historical names found orphaned in order history.
const ALL_ITEMS = [...DISHES, ...Object.values(ALWAYS_ITEMS).flat()];
const BY_ID = new Map(ALL_ITEMS.filter(d => d.id).map(d => [d.id, d]));
const BY_NAME = new Map(ALL_ITEMS.filter(d => d.id).map(d => [d.name, d]));

export function dishById(id) {
  return BY_ID.get(id) || null;
}

// Resolves a name to an id, following DISH_RENAMES so historical names land on
// the right dish. Chain-following capped at 5 hops, same as passport.js and
// journal.js, so a rename loop cannot hang the app.
export function dishIdFor(name) {
  if (!name) return null;
  let n = name;
  for (let hop = 0; hop < 5; hop++) {
    const hit = BY_NAME.get(n);
    if (hit) return hit.id;
    if (!DISH_RENAMES[n]) break;
    n = DISH_RENAMES[n];
  }
  return null;
}

// The reader's entry point during the transition: prefer a stored id, fall
// back to resolving the stored name. Once every consumer uses this, dropping
// the name fallback is a one-line change.
export function resolveDishId(record) {
  if (!record) return null;
  if (record.dishId && BY_ID.has(record.dishId)) return record.dishId;
  return dishIdFor(record.name || record.dish || null);
}

// Display name for an id. Falls back to whatever name the record carried, so a
// dish removed from the registry entirely still shows something readable
// instead of a raw slug.
export function dishNameFor(id, fallback) {
  const d = BY_ID.get(id);
  return d ? d.name : (fallback || id || null);
}

// Stamps `dishId` onto a record that has a name, leaving everything else
// alone. Returns the SAME object when nothing can be resolved, so callers can
// use identity comparison to detect a no-op.
export function withDishId(record) {
  if (!record || record.dishId) return record;
  const id = dishIdFor(record.name);
  return id ? { ...record, dishId: id } : record;
}

// Names in a set of records that cannot be resolved to any id. This is the
// orphan check, expressed in identity terms rather than name terms.
export function unresolvableNames(records) {
  const out = new Map();
  for (const r of records || []) {
    if (!r || !r.name || r.omakase) continue;
    if (resolveDishId(r)) continue;
    out.set(r.name, (out.get(r.name) || 0) + 1);
  }
  return [...out.entries()].map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
