// ingredientScaffold.js — promote-time codegen for new ingredients (Jul 18).
//
// When a pipeline dish is promoted, every ingredient it names either already
// exists in the costing layer or needs wiring. A missing LINE_MAP entry is the
// star-anise / raw-rice bug: the line resolves to nothing and silently costs
// $0. This module generates the two blocks a new ingredient needs — an
// ingredients.js seed stub and a LINE_MAP stub with the RIGHT conversions —
// and, crucially, DETECTS when a name already maps so nothing is double-wired.
//
// What it never does: quantities (a Kevin call), prices (real money, needs a
// receipt), or the fixed-flag (a cooking decision). Those are placeholders.
//
// Conversions are TIGHT per Kevin's rule — the units a sane recipe actually
// uses for that ingredient, weight always metric-complete (g/kg/oz/lb free off
// an oz seed via makeConv), volume only where a real recipe measures by volume.
// No piece/cup fictions on eyeballed solids (the kombu rule).

import { LINE_MAP } from './dishCosting.js';
import { INGREDIENT_SEED } from './ingredients.js';

// Normalize for matching: lowercase, strip punctuation and parenthetical notes,
// collapse whitespace. 'Black Pepper (oz)' and 'black pepper' match.
function norm(s) {
  return String(s)
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build the existing-name index once per call (cheap; these are small).
function existingIndex() {
  const byLineMap = new Map(); // normalized name -> LINE_MAP key
  for (const key of Object.keys(LINE_MAP)) byLineMap.set(norm(key), key);
  const byIngredient = new Map(); // normalized name -> ingredient id
  for (const ing of INGREDIENT_SEED) {
    byIngredient.set(norm(ing.name), ing.id);
    byIngredient.set(norm(ing.id), ing.id);
  }
  return { byLineMap, byIngredient };
}

// A synthetic id from a name: 'Coconut milk' -> 'coconut_milk'.
function idFor(name) {
  return norm(name).replace(/ /g, '_');
}

// The LINE_MAP conv expression per nature. TIGHT: weight seeds in oz (g/kg/lb
// free); fluid opens floz/cup/tbsp/tsp/ml/l; each is countable; batch is flat.
function convFor(nature) {
  switch (nature) {
    case 'weight':
      // metric-complete weight; NO volume aliases, NO piece fictions
      return "C({ unit: 'oz' })";
    case 'fluid':
      // 'oz' input routed to floz, so cup/tbsp/tsp/ml/l all resolve
      return "C({ unit: 'oz', fluid: true })";
    case 'each':
      return "C({ unit: 'each' })";
    case 'batch':
      // flat-per-batch is a deliberate Kevin call (the black-tea pattern)
      return "() => 1 /* flat per batch — confirm with Kevin */";
    default:
      return "C({ unit: 'oz' }) /* nature unknown — confirm */";
  }
}

function seedUnitFor(nature) {
  return nature === 'fluid' ? 'floz' : nature === 'each' ? 'each' : nature === 'batch' ? 'batch-use' : 'oz';
}

// Scaffold ONE ingredient. Returns { status, ... } where status is:
//   'exists-linemap' — already a LINE_MAP key; emit nothing, point at it
//   'exists-ingredient' — seed exists but no LINE_MAP entry; emit LINE_MAP only
//   'new' — emit both seed stub and LINE_MAP stub
export function scaffoldIngredient(name, nature, idx) {
  const index = idx || existingIndex();
  const n = norm(name);

  if (index.byLineMap.has(n)) {
    return { name, status: 'exists-linemap', existingKey: index.byLineMap.get(n),
      note: `exists: LINE_MAP already maps "${index.byLineMap.get(n)}" — no new entry needed` };
  }

  const id = index.byIngredient.has(n) ? index.byIngredient.get(n) : idFor(name);
  const lineMapStub = `  '${name}':`.padEnd(28) +
    ` { id: '${id}', conv: ${convFor(nature)} },`;

  if (index.byIngredient.has(n)) {
    return { name, status: 'exists-ingredient', id, lineMapStub,
      note: `seed '${id}' exists but has NO LINE_MAP entry (the $0 bug) — add the line above` };
  }

  const seedStub = `  { id: '${id}', name: '${name}', unit: '${seedUnitFor(nature)}', ` +
    `baseline: __PRICE__, category: 'pantry' }, // __PACK_SIZE__ @ $__ — Kevin fills`;

  return { name, status: 'new', id, seedStub, lineMapStub };
}

// Scaffold a dish's whole ingredient list. Returns grouped blocks ready to
// drop into the promote scaffold text.
export function scaffoldIngredients(ingredients) {
  const idx = existingIndex();
  const results = (ingredients || []).map(ing => scaffoldIngredient(ing.name, ing.nature, idx));

  const newSeeds = results.filter(r => r.status === 'new');
  const newLineMaps = results.filter(r => r.status === 'new' || r.status === 'exists-ingredient');
  const existing = results.filter(r => r.status === 'exists-linemap');

  return {
    results,
    counts: {
      newIngredients: newSeeds.length,
      newLineMapEntries: newLineMaps.length,
      alreadyMapped: existing.length,
    },
    seedBlock: newSeeds.map(r => r.seedStub).join('\n'),
    lineMapBlock: newLineMaps.map(r => r.lineMapStub).join('\n'),
    existingNotes: existing.map(r => `  // ${r.note}`).join('\n'),
  };
}
