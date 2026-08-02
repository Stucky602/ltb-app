// tests/what_was_in_mine.mjs — answering a question about the past.
//
// THE ONE PROPERTY: DO NOT USE CURRENT CANON TO ANSWER A HISTORICAL QUESTION.
//
// Somebody asks what was in the dish they ate in March. The easy answer renders
// today's recipe, and it is wrong precisely when the question matters — because
// the recipe changed, or a brand changed, and they are asking BECAUSE something
// happened. A confident answer built from today's canon is worse than no answer
// because it will be believed.
//
// So the assertions below are mostly about the ANSWER ADMITTING WHAT IT DOES
// NOT KNOW. A card with no gaps and a card with three gaps can contain the same
// ingredient list; only one of them is honest about what it is.

import { whatWasInItem, whatWasInOrder, whatWasInOrderText } from '../src/whatWasInMine.js';
import { currentVersionFor, RECIPE_VERSIONS } from '../src/recipeVersions.js';
import { emptyLabels, addLabel } from '../src/labelVersions.js';
import { DISHES } from '../src/dishes.js';
import { dishIdFor } from '../src/dishIdentity.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

const DISH = DISHES.find(d => currentVersionFor(dishIdFor(d.name)));
const VERSION = currentVersionFor(dishIdFor(DISH.name)).id;
const MARCH = '2026-03-01T00:00:00.000Z';

// ── The confident case ──────────────────────────────────────────────────────
{
  const order = {
    id: 'o1', customer: 'A', createdAt: MARCH,
    items: [{ name: DISH.name, variant: DISH.variants[0].label, servedRecipeVersionId: VERSION }],
  };
  const a = whatWasInOrder(order);
  ok('a properly stamped order answers with no gaps',
    a.confident === true && a.gaps.length === 0,
    JSON.stringify(a.gaps));
  ok('and produces a real ingredient list',
    a.items[0].card && a.items[0].card.ingredients.length > 0);
  ok('pinned to the version that was SERVED',
    a.items[0].recipeVersionId === VERSION && a.items[0].versionWasServed === true);
}

// ── Every way the answer can be less than certain ───────────────────────────
{
  const base = { id: 'o', createdAt: MARCH };

  const unstamped = whatWasInItem(base, { name: DISH.name });
  ok('an unstamped item says the list is TODAY\'S recipe, not what was cooked',
    !unstamped.confident && unstamped.gaps.some(g => /as it stands today/.test(g)),
    'this is the whole failure mode: a plausible list with no warning');

  const offeredOnly = whatWasInItem(base, { name: DISH.name, offeredRecipeVersionId: VERSION });
  ok('an offered-but-not-served version is flagged as such',
    !offeredOnly.confident && offeredOnly.gaps.some(g => /OFFERED/.test(g)),
    'they differ exactly when Kevin refined a dish between Sunday and Tuesday');

  const inherited = whatWasInItem(base, {
    name: DISH.name, servedRecipeVersionId: VERSION, versionInherited: true,
  });
  ok('an inherited version is not treated as a record of this dish',
    !inherited.confident && inherited.gaps.some(g => /order as a whole/.test(g)),
    'the marker from the v5 migration has to travel all the way to the answer');

  const ghost = whatWasInItem(base, { name: DISH.name, servedRecipeVersionId: 'ghost@2020-01-01-a' });
  ok('a version id that is not in the registry is reported, not ignored',
    ghost.gaps.some(g => /not in the registry/.test(g)) && !ghost.confident);

  const unknown = whatWasInItem(base, { name: 'A Dish That Never Existed' });
  ok('an unresolvable dish says nothing can be said about it',
    unknown.card === null && !unknown.confident && unknown.gaps.length === 1,
    'inventing a list for a name nobody recognises would be the worst possible answer');

  const undated = whatWasInItem({ id: 'x' }, { name: DISH.name, servedRecipeVersionId: VERSION });
  ok('an order with no usable date says labels could not be resolved',
    undated.gaps.some(g => /no usable date/.test(g)));

  const carl = whatWasInItem({ ...base, carlMode: true }, {
    name: DISH.name, servedRecipeVersionId: VERSION,
  });
  ok('Carl mode is disclosed AND its own limitation stated',
    carl.notes.some(n => /Carl mode/.test(n)) && carl.gaps.some(g => /derived at display time/.test(g)),
    'the swaps come from current rulings, so a ruling changed since is a real caveat');
}

// ── One weak item makes the ORDER partial ───────────────────────────────────
{
  const mixed = {
    id: 'o', createdAt: MARCH,
    items: [
      { name: DISH.name, servedRecipeVersionId: VERSION },
      { name: DISH.name },
    ],
  };
  const a = whatWasInOrder(mixed);
  ok('an order is confident only when EVERY item is',
    a.confident === false,
    'rounding one unknown dish up to a confident order is the whole failure');
  ok('and the first item keeps its own confidence',
    a.items[0].confident === true && a.items[1].confident === false,
    'a per-item answer must not be dragged down by its neighbour either');
  ok('repeated gaps are stated once',
    new Set(a.gaps).size === a.gaps.length);
}

// ── Labels resolve as of the ORDER date ─────────────────────────────────────
{
  const JULY = Date.parse('2026-07-01T00:00:00Z');
  let labels = addLabel(emptyLabels(), {
    ingredientId: 'worcestershire', brand: 'Old', product: 'W',
    ingredientText: 'vinegar, anchovies', status: 'confirmed',
    firstObserved: Date.parse('2026-01-01T00:00:00Z'),
  }, Date.parse('2026-01-01T00:00:00Z'));
  const firstId = labels.labels[0].id;
  labels = {
    ...labels,
    labels: labels.labels.map(l => (l.id === firstId ? { ...l, supersededAt: JULY } : l)),
  };
  labels = addLabel(labels, {
    ingredientId: 'worcestershire', brand: 'New', product: 'W',
    ingredientText: 'vinegar, anchovies, soy', status: 'confirmed', firstObserved: JULY,
  }, JULY);

  const march = whatWasInItem({ id: 'o', createdAt: MARCH }, {
    name: DISH.name, servedRecipeVersionId: VERSION,
  }, { labelVersions: labels, ingredientIds: ['worcestershire'] });
  ok('a March order gets the March bottle',
    march.labels.length === 1 && march.labels[0].brand === 'Old',
    'the label store answering as-of the date is the entire reason it exists');

  const sept = whatWasInItem({ id: 'o', createdAt: '2026-09-01T00:00:00.000Z' }, {
    name: DISH.name, servedRecipeVersionId: VERSION,
  }, { labelVersions: labels, ingredientIds: ['worcestershire'] });
  ok('and a September order gets the September bottle',
    sept.labels[0].brand === 'New');

  ok('no label store means no label claims rather than a guess',
    whatWasInItem({ id: 'o', createdAt: MARCH }, { name: DISH.name, servedRecipeVersionId: VERSION })
      .labels.length === 0,
    'the store ships empty; contributing nothing is correct, not incomplete');
}

// ── The pasted text carries the gaps ────────────────────────────────────────
{
  const text = whatWasInOrderText(whatWasInOrder({
    id: 'o', createdAt: MARCH, items: [{ name: DISH.name }],
  }));
  ok('the copyable text names the dish and its ingredients',
    text.includes(DISH.name) && text.split('\n').length > 5);
  ok('and prints WHAT IT DOES NOT KNOW rather than dropping it',
    text.includes('WHAT THIS DOES NOT KNOW'),
    'Kevin pastes this into a message; the caveats have to travel with it');
  ok('an empty answer produces empty text rather than throwing',
    whatWasInOrderText(null) === '');
  ok('an order with no items does not claim confidence',
    whatWasInOrder({ id: 'o', items: [] }).confident === false);
}

// ── The engine is reused, not reimplemented ─────────────────────────────────
{
  const src = await import('node:fs').then(fs =>
    fs.readFileSync(new URL('../src/whatWasInMine.js', import.meta.url), 'utf8'));
  ok('it calls buildIngredientCard rather than rebuilding a list',
    src.includes('buildIngredientCard'),
    'two renderers for the same claim is how they come to disagree');
  ok('and it does not re-derive allergens',
    !/allergens\s*=/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')),
    'the dish declares them and the allergen gate already checks them every build');
  ok('RECIPE_VERSIONS is non-empty, so these assertions ran against real data',
    RECIPE_VERSIONS.length > 0);
}

console.log(failed === 0 ? '\nWHAT WAS IN MINE: ALL PASS' : `\nWHAT WAS IN MINE: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
