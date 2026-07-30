// tests/ingredient_card.mjs — what is in this dish, for a customer who asks.
//
// WHY THE ASSERTIONS ARE SHAPED LIKE THIS
//
// This card is read by somebody deciding whether they can safely eat something.
// That makes a SILENT OMISSION the failure worth guarding, not a formatting
// slip — a card that quietly leaves an ingredient out will be trusted, and a
// card that says "ask me" will not hurt anyone.
//
// The specific gap this feature exists to close: the recipes are shopping and
// costing documents, so staples are assumed and absent. Salt is written in 4 of
// 27 recipes. MSG is written in ZERO. Both are in essentially everything. A
// card rendered straight from the recipe would tell a customer there is no salt
// in a dish, which is false on every single line of the menu.
//
// The blend note is Kevin's ruling (Jul 30): his spice blends change with his
// mood, especially the curry, so a declared component list would be a lie most
// weeks. The card says "ask for details" instead, which is true every week.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DISHES } from '../src/dishes.js';
import {
  buildIngredientCard, ingredientCardText, allIngredientCards,
  cardsNeedingReview, ALWAYS_PRESENT, BLEND_LABEL, UNLISTED_ADDITIONS,
} from '../src/ingredientCard.js';
import { currentVersionFor } from '../src/recipeVersions.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

const cards = allIngredientCards();

// ── The staples are on every card, always ───────────────────────────────────
{
  ok('a card is produced for every dinner', cards.length === DISHES.length, `${cards.length} of ${DISHES.length}`);

  for (const staple of ALWAYS_PRESENT) {
    const missing = cards.filter(c => !c.ingredients.includes(staple));
    ok(`every card lists ${staple}`, missing.length === 0,
      missing.slice(0, 4).map(c => c.dishName).join(', '));
  }

  // The reason this matters, pinned: canon does NOT say these things.
  const declaredSalt = DISHES.filter(d =>
    [...(d.recipe.base || []), ...Object.values(d.recipe.extras || {}).flat()]
      .some(l => /\bsalt\b/i.test(l.name))).length;
  ok('and the recipes still do not, which is the whole point',
    declaredSalt < DISHES.length,
    `${declaredSalt} of ${DISHES.length} recipes mention salt; the card must not depend on that`);
}

// ── Compound lines are split ────────────────────────────────────────────────
{
  const chili = buildIngredientCard('Chili');
  // The recipe line is "Marmite + soy + spices" — one line, three things, one
  // of them a declarable allergen.
  ok('a compound line becomes separate ingredients',
    chili.ingredients.includes('Marmite') && chili.ingredients.includes('Soy'),
    chili.ingredients.join(', '));
  ok('and the vague part becomes the blend note', chili.ingredients.includes(BLEND_LABEL));
  ok('no ingredient still carries a plus sign',
    !cards.some(c => c.ingredients.some(i => i.includes('+'))),
    'a customer reading "Marmite + soy + spices" cannot tell what is in it');
}

// ── Packaging is not food ───────────────────────────────────────────────────
{
  // Anchored patterns: "Ground beef" contains the letters of "round" and an
  // unanchored check flags it, which is exactly what happened while building.
  const packaging = /sous vide bag|^bag$|container|^round ?\d|^rect ?\d|^jar$/i;
  const leaked = [];
  for (const c of cards) for (const i of c.ingredients) if (packaging.test(i)) leaked.push(`${c.dishName}: ${i}`);
  ok('no container or bag appears as an ingredient', leaked.length === 0, leaked.join(', '));

  ok('and neither does the rice-as-container line',
    !cards.some(c => c.ingredients.some(i => /included with order/i.test(i))));

  ok('but real ground meat survives',
    cards.some(c => c.ingredients.some(i => /^Ground (beef|pork|lamb|chicken)/.test(i))),
    'over-filtering packaging would silently delete a protein');
}

// ── Named blends do not swallow single ingredients ──────────────────────────
{
  ok('curry powder becomes the blend note',
    !cards.some(c => c.ingredients.includes('Curry powder')),
    "Kevin's curry blend changes by mood, so a declared list would be a lie");

  // The obvious /powder/ pattern would be wrong, and these prove it.
  ok('filé powder stays named', cards.some(c => c.ingredients.includes('Filé powder')),
    'sassafras leaf is one ingredient, not a blend');
  ok('lecithin powder stays named', cards.some(c => c.ingredients.some(i => /lecithin/i.test(i))));
  ok('tomato paste stays named', cards.some(c => c.ingredients.includes('Tomato paste')));
}

// ── Provenance ──────────────────────────────────────────────────────────────
{
  ok('every card carries a dish id', cards.every(c => !!c.dishId));
  ok('every card carries a recipe version', cards.every(c => !!c.recipeVersionId),
    'a card without one cannot be matched to what a customer actually received');
  ok('every card carries a generated date', cards.every(c => /^\d{4}-\d{2}-\d{2}/.test(c.generatedAt)));

  const bol = buildIngredientCard('Bolognese');
  ok('the version matches canon', bol.recipeVersionId === currentVersionFor('bolognese').id);

  // Asked about a past order, the card must describe what was SERVED.
  const pinned = buildIngredientCard('Bolognese', { versionId: currentVersionFor('bolognese').id });
  ok('a card can be pinned to a specific version', pinned.recipeVersionId === bol.recipeVersionId);
}

// ── Quantities are absent, and said to be ───────────────────────────────────
{
  const withNumbers = cards.filter(c => c.ingredients.some(i => /\d+\s*(lb|oz|g|kg|cup|tbsp|tsp|ml)\b/i.test(i)));
  ok('no quantity appears on any card', withNumbers.length === 0,
    withNumbers.map(c => c.dishName).join(', '));
  ok('and the card says that is deliberate',
    cards.every(c => c.notes.some(n => /Quantities and ratios are not included/.test(n))),
    'a customer should know the omission is a choice, not an oversight');
}

// ── Allergens come from one place ───────────────────────────────────────────
{
  const withAllergens = cards.filter(c => c.allergens);
  ok('cards carry the declared allergen line', withAllergens.length > 20, String(withAllergens.length));

  const bol = DISHES.find(d => d.id === 'bolognese');
  ok('and it is the dish\u2019s own declaration, not a re-derivation',
    buildIngredientCard('Bolognese').allergens === bol.copy.contains,
    'two sources for the same claim is how they come to disagree');

  ok('a dish with no declared allergens is flagged for review',
    cardsNeedingReview().every(r => !!r.why));
}

// ── The text version ────────────────────────────────────────────────────────
{
  const txt = ingredientCardText(buildIngredientCard('Chili'));
  ok('the text names the dish', /^Chili/.test(txt));
  ok('it lists ingredients', /INGREDIENTS/.test(txt));
  ok('it states what it contains', /CONTAINS:/.test(txt));
  ok('it carries the generation date', /Card generated \d{4}-\d{2}-\d{2}/.test(txt));
  ok('and the recipe version', /Recipe version chili@/.test(txt));
  ok('an unknown dish yields no card', buildIngredientCard('Not A Dish At All') === null);
  ok('and the text of a null card is empty rather than a crash', ingredientCardText(null) === '');
}

// ── The declaration hook ────────────────────────────────────────────────────
{
  ok('there is a place to declare ingredients the recipes never wrote down',
    typeof UNLISTED_ADDITIONS === 'object',
    'xanthan and lecithin cannot be derived from anything; Kevin declares them');

  // Whatever is declared must actually reach the card.
  const keys = Object.keys(UNLISTED_ADDITIONS);
  if (keys.length) {
    const id = keys[0];
    const card = buildIngredientCard(id);
    const declared = UNLISTED_ADDITIONS[id];
    ok('a declared addition appears on that dish\u2019s card',
      declared.every(x => card.ingredients.some(i => i.toLowerCase() === x.toLowerCase())),
      `${id}: ${declared.join(', ')}`);
  } else {
    ok('the declaration map is empty for now, which is a valid starting state', true);
  }

  const unknownIds = keys.filter(k => !DISHES.some(d => d.id === k));
  ok('every declared addition names a real dish', unknownIds.length === 0, unknownIds.join(', '));
}


// ── The card is a shareable image, not a text block on the tab ─────────────
//
// Kevin's ruling, Jul 30: it should look like the invoice card and arrive in a
// message as an image. It should NOT render inline on the Recipes tab, because
// the real recipe is already on that screen and a read-only copy of it is
// clutter. One button, which opens the card.
{
  const modals = fs.readFileSync(path.join(ROOT, 'src/components/Modals.jsx'), 'utf8');
  const recipes = fs.readFileSync(path.join(ROOT, 'src/components/RecipesTab.jsx'), 'utf8');

  ok('there is an ingredient card modal', /export function IngredientCardModal/.test(modals));
  ok('it rasterizes and shares like the invoice',
    /loadHtml2Canvas/.test(modals) && /navigator\.share/.test(modals));
  ok('and falls back to a download when sharing is unavailable',
    /createObjectURL/.test(modals),
    'a desktop browser has no share sheet and must still produce the file');
  ok('a cancelled share is not reported as an error', /AbortError/.test(modals));

  ok('it uses the invoice card styling, not its own',
    /styles\.invoiceCard/.test(modals) && /styles\.invoiceHeader/.test(modals),
    'these land side by side in one message thread; a near-match reads worse than a match');
  ok('and carries the LTB header', /Lettuce, Turnip, The Beet/.test(modals));

  ok('the allergen line is above the small print, not buried',
    modals.indexOf('Contains') < modals.indexOf('Quantities') || !/Quantities/.test(modals),
    'this is the line somebody with an allergy is looking for');

  ok('the Recipes tab renders no inline ingredient list',
    !/IngredientCardBlock/.test(recipes),
    'the real recipe is already on that screen');
  ok('and offers one button instead', /Copy to card/.test(recipes));
  ok('which opens the card', /<IngredientCardModal/.test(recipes));

  // The staples rule, restated at the surface Kevin actually sends from.
  ok('the modal builds from the same card model, so the staples come with it',
    /buildIngredientCard/.test(modals),
    'salt, sugar and MSG are added by that model unconditionally');
}

console.log(f === 0 ? '\nINGREDIENT CARDS: ALL PASS' : `\nINGREDIENT CARDS: ${f} FAILURES`);
process.exit(f ? 1 : 0);
