// promoteScaffold.js — generate the copyable scaffold for promoting a pipeline
// dish to the real menu (Jul 18).
//
// The app can't write repo files, so Promote produces ONE copyable text block
// with every file's stub in file order, for the Kevin+Claude session. The Big 3
// are NEVER filled: copy.desc, copy.reheat, and the cost/price anchors come out
// as __PENDING__ placeholders that the invariant gate refuses to ship. Only
// mechanical scaffolding is generated: ingredient seeds, LINE_MAP entries (with
// full correct conversions), the registry entry shell, allergen flags, section
// placement, and the retirement steps for the vote whitelist and pipeline.html.
//
// Ingredient QUANTITIES are __QTY__ / __UNIT__ placeholders and every recipe
// line carries a "confirm fixed?" marker — the fixed-flag is a cooking decision
// the scaffold can't make (getting it wrong is what made a Large's margin
// fiction on the tea-smoked chicken).

import { scaffoldIngredients } from './ingredientScaffold.js';

// main-menu section for a cuisine. The taxonomy is coarser than cuisine; only
// the Spotlight rule is unambiguous (and gate-enforced). For the rest, name a
// best-guess section and tell Kevin to confirm.
const SECTION_BY_CUISINE = {
  American: 'American / Southern / Tex-Mex',
  Southern: 'American / Southern / Tex-Mex',
  'Tex-Mex': 'American / Southern / Tex-Mex',
  Indian: 'Curry',
  Japanese: 'Curry',       // the Leblanc curry lives here; confirm per dish
  Korean: 'East Asian',
  Chinese: 'East Asian',
  Thai: 'East Asian',
  Italian: 'Italian',
  German: 'Spotlight Dinners', // no German section; braises tend to be spotlights
  Spotlight: 'Spotlight Dinners',
};

function containsFromFlags(flags) {
  // A human-readable Contains line drafted from allergen flags. Kevin edits.
  const LABEL = { peanut: 'Peanuts', treenut: 'Tree nuts', shellfish: 'Shellfish',
    fish: 'Fish', dairy: 'Dairy', gluten: 'Gluten', soy: 'Soy', egg: 'Egg', sesame: 'Sesame' };
  const parts = Object.keys(flags || {}).filter(k => flags[k]).map(k => LABEL[k] || k);
  return parts.length ? parts.join(', ') + '.' : '__PENDING: confirm allergens with Kevin__';
}

function allergensBlock(flags) {
  const keys = Object.keys(flags || {}).filter(k => flags[k]);
  if (!keys.length) return '    allergens: {}, // __confirm: any allergens?__';
  const lines = keys.map(k => `      ${k}: true,`);
  return '    allergens: {\n' + lines.join('\n') + '\n    },';
}

// entry: a pipelineDishes.js canon entry. cuisine: Kevin's pick at promote time.
export function buildPromoteScaffold(entry, cuisine) {
  const ing = scaffoldIngredients(entry.ingredients || []);
  const section = SECTION_BY_CUISINE[cuisine] || '__PENDING: pick section__';
  const isSpotlight = cuisine === 'Spotlight';

  const recipeLines = (entry.ingredients || []).map(i =>
    `        I('${i.name}', __QTY__, '__UNIT__'), // confirm fixed?`).join('\n');

  const parts = [];

  parts.push(`/* ═══════════════════════════════════════════════════════════════════
   PROMOTE SCAFFOLD — ${entry.key}
   Fill every __PLACEHOLDER__ WITH KEVIN. The gate stays red until the
   Big 3 (desc, reheat, cost) are real. Do NOT ship placeholders.
   Ingredients: ${ing.counts.newIngredients} new, ${ing.counts.newLineMapEntries} LINE_MAP entries, ${ing.counts.alreadyMapped} already mapped.
   ═══════════════════════════════════════════════════════════════════ */`);

  if (ing.seedBlock) {
    parts.push(`\n/* ── src/ingredients.js — new seeds (fill __PRICE__ / __PACK_SIZE__) ── */\n${ing.seedBlock}`);
  }
  if (ing.lineMapBlock) {
    parts.push(`\n/* ── src/dishCosting.js — LINE_MAP entries (conversions pre-wired) ── */\n${ing.lineMapBlock}`);
  }
  if (ing.existingNotes) {
    parts.push(`\n/* ── already mapped (no action) ── */\n${ing.existingNotes}`);
  }

  parts.push(`\n/* ── src/dishes.js — registry entry ── */
  {
    name: '${entry.title.replace(/&middot;/g, '·')}',
    cuisine: '${cuisine}',${isSpotlight ? '' : ''}
    copy: {
      desc: '__PENDING: write with Kevin__',
      reheat: '__PENDING: write with Kevin__',
      contains: '${containsFromFlags(entry.allergenFlags)}',
    },
${allergensBlock(entry.allergenFlags)}
    reheat: '__PENDING: pick reheat bucket (stovetop/bagged/etc) — card BODY is Big 3__',
    variants: [
      { label: '__LABEL__ (~N servings)', price: __PRICE__, cost: 0 },
      { label: '__LABEL__ (~N servings)', price: __PRICE__, cost: 0 },
    ],
    recipe: {
      factors: { /* __ set per variant __ */ },
      base: [
${recipeLines}
      ],
    },
  },`);

  parts.push(`\n/* ── menu.html LIBRARY — add under "dinners" (verbatim from canon desc/reheat once written) ── */
  "${entry.title.replace(/&middot;/g, '·')}": { "desc": "__PENDING__", "reheat": "__PENDING__", "contains": "${containsFromFlags(entry.allergenFlags)}" }`);

  parts.push(`\n/* ── main-menu.html — card under section "${section}" ${isSpotlight ? '' : '(CONFIRM section)'} ── */
  <div class="dish"><div class="dish-name">${entry.title.replace(/&middot;/g, '·')}</div>...__build card, then syncMainMenu --write fills prices/allergens/pairings__</div>`);

  parts.push(`\n/* ── src/pipelineDishes.js — retire this dish ── */
  // set status: 'shipped' on the '${entry.key}' entry`);

  parts.push(`\n/* ── worker.js PIPELINE_DISHES — comment out (retire, keep tombstone) ── */
  //   '${entry.key}',`);

  parts.push(`\n/* ── pipeline.html — remove the '${entry.key}' card; add a "shipped" banner if desired ── */`);

  return parts.join('\n');
}

// The checklist state Promote tracks (stored in the journal entry).
export function newPromoteChecklist(entry, cuisine) {
  const ing = scaffoldIngredients(entry.ingredients || []);
  return {
    cuisine: cuisine || null,
    items: [
      { id: 'ingredients', label: `ingredients.js — ${ing.counts.newIngredients} new seeds`, done: false },
      { id: 'linemap', label: `dishCosting.js — ${ing.counts.newLineMapEntries} LINE_MAP entries`, done: false },
      { id: 'registry', label: 'dishes.js — registry entry (desc/reheat/cost with Kevin)', done: false },
      { id: 'reheatcard', label: 'recipes.js — reheat routing + card (card body = Big 3)', done: false },
      { id: 'equipment', label: 'equipmentConflict.js — mapping', done: false },
      { id: 'library', label: 'menu.html LIBRARY — entry', done: false },
      { id: 'mainmenu', label: `main-menu.html — card in section`, done: false },
      { id: 'retire-worker', label: 'worker.js — comment out of PIPELINE_DISHES', done: false },
      { id: 'retire-pipeline', label: 'pipeline.html — remove card', done: false },
      { id: 'canon-status', label: "pipelineDishes.js — status: 'shipped'", done: false },
      { id: 'gate', label: 'npm test exit 0', done: false },
    ],
  };
}
