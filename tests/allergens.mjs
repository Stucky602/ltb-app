// tests/allergens.mjs — a dish's allergen tags must match its recipe.
//
// WHY THIS EXISTS
//
// Allergen declarations were free text in menu.html LIBRARY, so nothing could
// check them. A manual sweep on Jul 15 found the Indian Style Curry's Shrimp
// variants declaring no Shellfish, Bo Ssam declaring Soy but not the wheat in
// its soy sauce, and four more. These are the same failure class diet_flags
// exists for: a wrong claim doesn't produce a weird number Kevin might notice,
// it feeds somebody something they told him they can't eat.
//
// tests/diet_flags.mjs proved the pattern (it caught the curry's chicken-stock
// problem on its first run). This file is the same machine pointed at
// allergens: structured tags on the dish, verified against RESOLVED
// ingredients per variant. The free-text `contains` in LIBRARY stays — it
// carries human detail like "butter, in the potato bag" that a machine can't
// infer. The tags are the checkable layer beneath it, not a replacement.
//
// THREE CLAIMS ARE CHECKED
//   1. every dinner declares an `allergens` field at all — an undeclared dish
//      is an unchecked dish, so absence fails the build (fail closed)
//   2. no variant's resolved recipe contains an allergen its tags don't
//      declare for that variant (the dangerous direction)
//   3. every declared tag is supported by a recipe line somewhere in its
//      covered variants — unless it carries an `unlisted:` reason, for real
//      allergens that live inside batch lines or uncosted stabilizers
//      (lecithin in the beurre blancs). A declared-but-unsupported tag with
//      no reason is a stale claim waiting to rot.
//
// TAG SHAPE (on the dish in src/dishes.js)
//   allergens: {
//     dairy: true,                    // every variant
//     shellfish: ['Shrimp, Small'],   // these variants only
//     soy: { variants: true, unlisted: 'reason' },  // declared, no recipe line
//   }
//
// The matchers are deliberately blunt and err toward false positives, same
// philosophy as diet_flags: a false positive costs a minute and an ALLOW
// entry with a reason; a false negative costs someone a reaction. When one
// fires on something legitimate, add the id to ALLOW — never loosen the
// pattern. Known traps the patterns already dodge: 'egg' inside eggplant
// (underscore-bounded), 'oyster' inside oyster mushrooms (only oyster_sauce
// forms match).

import assert from 'node:assert/strict';
import { DISHES, ALL_ALWAYS_ITEMS } from '../src/dishes.js';
import { resolveDishVariant } from '../src/dishCosting.js';

// Matched against resolved ingredient IDS (snake_case, same as diet_flags).
const PATTERNS = {
  // oaxaca and colby_jack are cheeses whose ids do not contain 'cheese', so the
  // pattern missed both until the always-items were brought under this gate on
  // Jul 29 and Queso's dairy tag came back unsupported. Same failure class as
  // baby_bella in src/carl.js: the id does not say what the thing is. Add new
  // dairy BY ID.
  dairy: /butter|cream|milk|cheese|parm|yogurt|ghee|mascarpone|queso|oaxaca|colby_jack/,
  // soy sauce, doubanjiang, oyster sauce, Shaoxing, and Marmite all carry
  // wheat; the blunt /soy/ inside gluten is intentional (US soy sauce = wheat
  // unless labeled tamari, and nothing in this kitchen is tamari).
  gluten: /flour|pasta|pappardelle|taglierini|orecchiette|noodle|tortilla|soy|doubanjiang|oyster_sauce|shaoxing|marmite|bread|panko/,
  // (^|_)egg(s)?(_|$) so 'chinese_eggplant' never fires but 'egg_pappardelle'
  // and a bare 'eggs' both do.
  egg: /(^|_)eggs?(_|$)/,
  fish: /anchov|fish_sauce|_fish|fish_|worcestershire|bonito|dashi|katsuo/,
  // oyster_sauce and oyster_soy (batch lines) are shellfish; oyster_mushroom
  // and king_oyster_mushroom are not — hence no blunt /oyster/.
  shellfish: /shrimp|prawn|crab|lobster|clam|oyster_sauce|oyster_soy/,
  soy: /soy|tofu|lecithin|miso|doubanjiang|edamame/,
  peanut: /peanut/,
  tree_nut: /almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia/,
  mustard: /mustard/,
  // House chili oil is made with toasted sesame (see the Chili Oil add-on
  // copy). Sesame is a US major allergen (FASTER Act, 2021). If Kevin rules
  // the finished oil doesn't warrant the declaration, remove the id here AND
  // the sesame tags together — never one without the other.
  sesame: /sesame|house_chili_oil/,
};

// Ids that match a pattern but are not the allergen. Each needs a reason.
const ALLOW = new Set([
  'nutmeg_TREE_NUT_NEVER', // placeholder: nutmeg is a seed, not a tree nut, and /nut/ is deliberately not a pattern. Keeps the set non-empty and documented.
]);

const problems = [];
let dishesChecked = 0;
let variantsChecked = 0;
let tagsChecked = 0;

// Normalize a tag value to { labels, unlisted } against the dish's variants.
function tagCoverage(dish, value) {
  const raw = (value && typeof value === 'object' && !Array.isArray(value)) ? value.variants : value;
  const unlisted = (value && typeof value === 'object' && !Array.isArray(value)) ? value.unlisted : null;
  const labels = raw === true ? dish.variants.map(v => v.label) : raw;
  return { labels, unlisted };
}

for (const dish of DISHES) {
  // Claim 1 — fail closed on absence.
  if (!dish.allergens || typeof dish.allergens !== 'object') {
    problems.push(`${dish.name}: no allergens field — an undeclared dish is an unchecked dish. Declare tags (or an explicit empty object with a comment saying why).`);
    continue;
  }
  dishesChecked += 1;

  // Build per-variant declared sets, validating tag names and variant labels.
  const declaredByVariant = new Map(dish.variants.map(v => [v.label, new Set()]));
  for (const [tag, value] of Object.entries(dish.allergens)) {
    if (!PATTERNS[tag]) {
      problems.push(`${dish.name}: unknown allergen tag '${tag}' — this test doesn't know what it means, so it cannot vouch for it`);
      continue;
    }
    tagsChecked += 1;
    const { labels, unlisted } = tagCoverage(dish, value);
    if (!Array.isArray(labels) || labels.length === 0) {
      problems.push(`${dish.name}: allergens.${tag} covers no variants — a claim that protects nobody`);
      continue;
    }

    let supported = false;
    for (const label of labels) {
      if (!declaredByVariant.has(label)) {
        problems.push(`${dish.name}: allergens.${tag} names variant '${label}', which does not exist — the tag protects nobody`);
        continue;
      }
      declaredByVariant.get(label).add(tag);
      const resolved = resolveDishVariant(dish.name, label);
      if (resolved && resolved.some(x => x.id && PATTERNS[tag].test(x.id))) supported = true;
    }

    // Claim 3 — declared tags must be supported or carry a reason.
    if (!supported && !unlisted) {
      problems.push(`${dish.name}: allergens.${tag} is declared but no covered variant's recipe supports it — either the claim is stale, or the allergen lives off-recipe and needs an unlisted: reason`);
    }
  }

  // Claim 2 — the dangerous direction: recipe allergens the tags don't declare.
  for (const v of dish.variants) {
    const resolved = resolveDishVariant(dish.name, v.label);
    if (!resolved) {
      problems.push(`${dish.name} / '${v.label}': recipe does not resolve — cannot verify allergen claims`);
      continue;
    }
    variantsChecked += 1;
    const declared = declaredByVariant.get(v.label);
    for (const [tag, re] of Object.entries(PATTERNS)) {
      if (declared.has(tag)) continue;
      const hits = resolved
        .map(x => x.id)
        .filter(id => id && re.test(id) && !ALLOW.has(id));
      if (hits.length) {
        problems.push(
          `${dish.name} / '${v.label}'\n      recipe contains: ${[...new Set(hits)].join(', ')}  (${tag})\n      declared:        ${[...declared].join(', ') || 'nothing'}\n      -> a customer avoiding ${tag} has no way to know`
        );
      }
    }
  }
}

// ── ALWAYS-ITEMS (add-ons, desserts, bag items, sauces) ────────────────────
//
// FOUND Jul 29: this file only ever iterated DISHES, so all 34 always-items
// were undeclared and nothing noticed. archiveExport.js reads it.allergens on
// exactly these items to build the delivery-records export, got undefined every
// time, and shipped a blank allergen column for every add-on. The dinners were
// gated from the start; the rest of the menu never was.
//
// Same three claims, same fail-closed rule. The five finishing sauces are the
// one exemption: they carry no recipe lines anywhere in the registry, so there
// is nothing to check them against and guessing at their contents is how a
// confident wrong claim ships. They are excluded from the Carl menu entirely
// (src/carl.js CARL_EXCLUDED) and stay listed here until Kevin supplies
// recipes. Removing an id from this set without adding a recipe re-opens the
// hole.
const NO_RECIPE_YET = new Set([
  'chimichurri', 'romesco', 'chermoula', 'miso-butter-sauce', 'whipped-lemon-garlic-herb',
]);

let alwaysChecked = 0;
for (const item of ALL_ALWAYS_ITEMS) {
  if (NO_RECIPE_YET.has(item.id)) continue;

  if (!item.allergens || typeof item.allergens !== 'object') {
    problems.push(`${item.name}: no allergens field — an undeclared item is an unchecked item. Declare tags (or an explicit empty object).`);
    continue;
  }
  alwaysChecked += 1;

  const declaredByVariant = new Map((item.variants || []).map(v => [v.label, new Set()]));
  for (const [tag, value] of Object.entries(item.allergens)) {
    if (!PATTERNS[tag]) {
      problems.push(`${item.name}: unknown allergen tag '${tag}'`);
      continue;
    }
    tagsChecked += 1;
    const { labels, unlisted } = tagCoverage(item, value);
    if (!Array.isArray(labels) || labels.length === 0) {
      problems.push(`${item.name}: allergens.${tag} covers no variants`);
      continue;
    }
    let supported = false;
    for (const label of labels) {
      if (!declaredByVariant.has(label)) {
        problems.push(`${item.name}: allergens.${tag} names variant '${label}', which does not exist`);
        continue;
      }
      declaredByVariant.get(label).add(tag);
      const resolved = resolveDishVariant(item.name, label);
      if (resolved && resolved.some(x => x.id && PATTERNS[tag].test(x.id))) supported = true;
    }
    if (!supported && !unlisted) {
      problems.push(`${item.name}: allergens.${tag} is declared but no variant's recipe supports it — stale claim, or it needs an unlisted: reason`);
    }
  }

  for (const v of (item.variants || [])) {
    const resolved = resolveDishVariant(item.name, v.label);
    if (!resolved) continue;   // priced-by-weight items resolve loosely; not a claim failure
    const declared = declaredByVariant.get(v.label) || new Set();
    for (const [tag, re] of Object.entries(PATTERNS)) {
      if (declared.has(tag)) continue;
      const hits = resolved.map(x => x.id).filter(id => id && re.test(id) && !ALLOW.has(id));
      if (hits.length) {
        problems.push(`${item.name} / '${v.label}'\n      recipe contains: ${[...new Set(hits)].join(', ')}  (${tag})\n      declared:        ${[...declared].join(', ') || 'nothing'}\n      -> a customer avoiding ${tag} has no way to know`);
      }
    }
  }
}

assert.equal(
  problems.length, 0,
  `[allergens] ${problems.length} allergen claim(s) the recipes do not support:\n\n    ` +
  problems.join('\n\n    ') +
  '\n\n  These are customer-facing safety claims. Fix the tag, fix the recipe, or add an ALLOW/unlisted entry with a reason.\n'
);

assert.ok(dishesChecked > 0 && tagsChecked > 0 && variantsChecked > 0,
  `sanity: expected to check some dishes, saw ${dishesChecked} dishes / ${tagsChecked} tags / ${variantsChecked} variants — did the allergens field change shape?`);

console.log(`[allergens] ${tagsChecked} tags across ${dishesChecked} dinners + ${alwaysChecked} always-items / ${variantsChecked} variants match their recipes`);
console.log(`[allergens] ${NO_RECIPE_YET.size} finishing sauces exempt pending recipes — excluded from the Carl menu`);
