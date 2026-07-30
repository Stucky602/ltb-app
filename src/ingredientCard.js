// src/ingredientCard.js — what is in this dish, for a customer who asks.
//
// WHY THIS IS NOT JUST A RENDER OF THE RECIPE
//
// The recipe is a shopping and costing document. It lists what Kevin BUYS. An
// ingredient card has to list what a person EATS, and those differ in three
// ways that all matter when somebody is asking because of an allergy:
//
// 1. STAPLES ARE ASSUMED AND THEREFORE ABSENT. Salt appears in 4 of 27 recipes.
//    MSG appears in ZERO. Both are in essentially everything Kevin cooks. A
//    card generated straight from the recipe would tell a customer there is no
//    salt in a dish, which is false on every line.
//
// 2. LINES ARE COMPOUND. "Marmite + soy + spices" is one recipe line and three
//    or more ingredients, one of which is a declarable allergen. A customer
//    card must split those.
//
// 3. SOME THINGS ARE USED AND NEVER WRITTEN DOWN — xanthan, lecithin, the odd
//    thickener. Those cannot be derived from anything; Kevin declares them
//    per dish in UNLISTED_ADDITIONS below.
//
// THE RULE THAT SHAPES ALL OF IT: this card is read by someone deciding whether
// they can safely eat something. So it never guesses, and where it does not
// know it SAYS SO on the card rather than omitting quietly. An ingredient card
// with a silent gap is worse than no card, because it will be trusted.

import { DISHES } from './dishes.js';
import { dishIdFor, resolveDishId } from './dishIdentity.js';
import { currentVersionFor, versionById } from './recipeVersions.js';

// ── In everything ───────────────────────────────────────────────────────────
//
// Kevin's ruling, Jul 30: these are in every single item on the menu, and the
// recipes almost never say so because there is no point costing them per dish.
// Added to every card unconditionally.
export const ALWAYS_PRESENT = [
  'Salt',
  'Sugar',
  'MSG',
];

// ── Used but not written down ───────────────────────────────────────────────
//
// Keyed by dishId. Declared by Kevin, never inferred: nothing in the repo knows
// that a dish is stabilised with xanthan unless the recipe says so, and a
// customer card must not be the place that guess gets made.
//
// EMPTY ENTRIES ARE NOT THE SAME AS ABSENT ONES. A dish missing from this map
// simply has nothing extra; that is the normal case and needs no ceremony.
export const UNLISTED_ADDITIONS = {
  // 'boeuf-bourguignon-beef-stew': ['Xanthan gum'],
};

// ── Not food ────────────────────────────────────────────────────────────────
//
// Recipe lines that exist for costing and packing. A customer card listing
// "Sous vide bag" or "16 oz round" as an ingredient is noise at best and
// alarming at worst.
const NOT_FOOD = /sous vide bag|^bag\b|container|round\d|rect\d|jar\b|wrap\b|\(costed\)|\(included with order\)/i;

// Vague by nature, and Kevin ruled they should stay that way: the blend changes
// with his mood, especially in the curry, so a fixed declared list would be a
// lie on most weeks. The card says so and invites the question instead.
//
// NAMED BLENDS are listed explicitly rather than caught by a pattern. The
// obvious pattern would be /powder/, and it would be wrong: filé powder is
// sassafras leaf and lecithin powder is lecithin — both single ingredients that
// belong on the card by name. Curry powder is a blend and Kevin's curry blend
// in particular changes with his mood, which is exactly why it points at a
// conversation instead. Add to this list as blends enter the recipes.
const NAMED_BLENDS = /curry powder|curry paste|garam masala|five.?spice|chili powder|jerk seasoning|za'?atar|ras el hanout/i;
const BLEND = /\bspices?\b|\bblend\b|\bseasoning\b/i;
export const BLEND_LABEL = 'Spices (ask for details)';

// Split "Marmite + soy + spices" into its parts. Also handles the "A + B + C
// (costed)" shape by stripping the parenthetical first.
function splitLine(name) {
  return String(name)
    .replace(/\([^)]*\)/g, '')
    .split('+')
    .map(s => s.trim())
    .filter(Boolean);
}

// Title-case a fragment without mangling things like "MSG" or "gochujang".
function tidy(part) {
  const s = part.trim();
  if (!s) return '';
  if (s === s.toUpperCase() && s.length <= 4) return s;   // MSG, XO
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildIngredientCard(dishOrName, { versionId = null, now = null } = {}) {
  const dishId = typeof dishOrName === 'string'
    ? (dishIdFor(dishOrName) || dishOrName)
    : resolveDishId(dishOrName);
  const dish = DISHES.find(d => d.id === dishId);
  if (!dish) return null;

  // A card is pinned to a recipe VERSION. Asked about a past order, pass that
  // order's servedRecipeVersionId and the card describes what they actually
  // received rather than what the dish became afterwards.
  const version = versionId ? versionById(versionId) : currentVersionFor(dishId);
  const recipe = version ? version.snapshot.recipe : dish.recipe;

  const lines = [
    ...(recipe.base || []),
    ...Object.values(recipe.extras || {}).flat(),
  ];

  const ingredients = [];
  let hasBlend = false;
  const push = (label) => {
    const v = tidy(label);
    if (v && !ingredients.some(x => x.toLowerCase() === v.toLowerCase())) ingredients.push(v);
  };

  for (const line of lines) {
    const name = line && line.name;
    if (!name || NOT_FOOD.test(name)) continue;

    for (const part of splitLine(name)) {
      if (BLEND.test(part) || NAMED_BLENDS.test(part)) { hasBlend = true; continue; }
      push(part);
    }
  }

  for (const extra of (UNLISTED_ADDITIONS[dishId] || [])) push(extra);
  for (const staple of ALWAYS_PRESENT) push(staple);
  if (hasBlend) ingredients.push(BLEND_LABEL);

  ingredients.sort((a, b) => {
    // The blend note sits last; it is a pointer to a conversation, not an
    // ingredient, and it should not interrupt an alphabetical scan.
    if (a === BLEND_LABEL) return 1;
    if (b === BLEND_LABEL) return -1;
    return a.localeCompare(b);
  });

  return {
    dishId,
    dishName: dish.name,
    recipeVersionId: version ? version.id : null,
    generatedAt: (now ? new Date(now) : new Date()).toISOString(),
    ingredients,
    // Straight from the dish's declared allergens, which the allergen gate
    // already checks against the recipe every build. Not re-derived here: two
    // sources for the same claim is how they come to disagree.
    allergens: (dish.copy && dish.copy.contains) || null,
    // Stated plainly on the card. Quantities are deliberately absent, and a
    // customer should know that is a choice rather than an oversight.
    notes: [
      'Listed in alphabetical order. Quantities and ratios are not included.',
      version ? null : 'This dish has no recorded recipe version, so this card reflects the current recipe only.',
    ].filter(Boolean),
  };
}

// Plain text, for pasting into a message. Kevin sends these one at a time when
// someone asks, so the common case is a paste rather than a download.
export function ingredientCardText(card) {
  if (!card) return '';
  const when = card.generatedAt.slice(0, 10);
  return [
    card.dishName,
    'Lettuce, Turnip, The Beet',
    '',
    'INGREDIENTS',
    ...card.ingredients.map(i => '  ' + i),
    '',
    card.allergens ? 'CONTAINS: ' + card.allergens : 'CONTAINS: see below',
    '',
    ...card.notes,
    '',
    `Card generated ${when}`,
    card.recipeVersionId ? `Recipe version ${card.recipeVersionId}` : 'Recipe version not recorded',
  ].join('\n');
}

// Every dish, for a bulk export or a sanity read.
export function allIngredientCards(opts) {
  return DISHES.map(d => buildIngredientCard(d.id, opts)).filter(Boolean);
}

// ── The honesty check ───────────────────────────────────────────────────────
//
// Which dishes carry a line this module could not turn into a clean ingredient.
// Not a failure — the blend note is a deliberate, Kevin-approved answer — but it
// is the list he would want before sending a card to somebody with an allergy.
export function cardsNeedingReview(opts) {
  return allIngredientCards(opts)
    .filter(c => c.ingredients.includes(BLEND_LABEL) || !c.allergens)
    .map(c => ({
      dishId: c.dishId,
      dishName: c.dishName,
      why: !c.allergens
        ? 'no declared allergen line'
        : 'contains a spice blend, so the card points at a conversation',
    }));
}
