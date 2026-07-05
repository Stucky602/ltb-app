// ═══════════════════════════════════════════════════════════════════════════
// LTB INVARIANT SUITE (Approach B)
// ═══════════════════════════════════════════════════════════════════════════
// Rules that must hold for EVERY dish — the suite iterates the registry
// dynamically, so a dish added to src/dishes.js tomorrow is automatically
// under every rule below with zero new test code.
//
// Run:  npm test        (or: node tests/invariants.mjs)
// Exit: 0 = all invariants hold. 1 = violations (each printed with the dish,
//       the rule, and what exactly is wrong). Margin-floor findings are
//       WARNINGS (reported, non-failing) because several current prices are
//       deliberately tight pending the planned re-price.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DISHES, ALL_ALWAYS_ITEMS, ALWAYS_ITEMS } from '../src/dishes.js';
import { ALL_DINNERS, ALWAYS_MENU, FULL_MENU, DEFAULT_WEEK } from '../src/menu.js';
import { RECIPES, DINNER_REHEAT_BUCKET, RICE_DISHES, PASTA_DISHES, NOODLE_DISHES, BAGGED_PASTA_DISHES, STEW_VEG_COPY, buildReheatBlocks } from '../src/recipes.js';
import { LINE_MAP, resolveDishVariant, costDishVariant, baselineCostMap, MARGIN_BUFFER, trueRawCost } from '../src/dishCosting.js';
import { DISH_EQUIPMENT, analyzeConflicts } from '../src/equipmentConflict.js';
import { DISH_CUISINE } from '../src/utils.js';
import { INGREDIENT_SEED } from '../src/ingredients.js';
import { buildReviewPlan } from '../src/receiptMatch.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fails = [];
const warns = [];
const F = (rule, msg) => fails.push(`[${rule}] ${msg}`);
const W = (rule, msg) => warns.push(`[${rule}] ${msg}`);

// Size-twin matcher: variants are Small/Large twins when their labels are
// identical after stripping parenthetical size hints and swapping Small<->Large
// ('Small (~4 servings)' <-> 'Large (~8 servings)', 'Chickpea, Small (~4-5)'
// <-> 'Chickpea, Large (~8-10)', 'Small (~3-4) + Asian Greens (1/2 lb)' <->
// 'Large (~6-8) + Asian Greens (1 lb)').
const stripParens = (l) => l.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const findLargeTwin = (d, v) => {
  if (!/small/i.test(v.label)) return null;
  const want = stripParens(v.label).replace(/small/g, 'large');
  return d.variants.find(x => x !== v && stripParens(x.label) === want) || null;
};

const base = baselineCostMap();
const seedIds = new Set(INGREDIENT_SEED.map(i => i.id));
const allNames = new Set();

// ─── Registry shape + name uniqueness ───────────────────────────────────────
for (const d of [...DISHES, ...ALL_ALWAYS_ITEMS]) {
  if (allNames.has(d.name)) F('unique-name', `duplicate dish name "${d.name}"`);
  allNames.add(d.name);
  if (!Array.isArray(d.variants) || d.variants.length === 0) F('shape', `"${d.name}" has no variants`);
  for (const v of d.variants || []) {
    if (typeof v.price !== 'number') F('shape', `"${d.name}" / "${v.label}" has no numeric price`);
    if (typeof v.cost !== 'number') F('shape', `"${d.name}" / "${v.label}" has no numeric cost anchor`);
  }
}

// ─── 1. Every dinner has a recipe ───────────────────────────────────────────
for (const d of DISHES) {
  if (!d.recipe || !RECIPES[d.name]) F('has-recipe', `dinner "${d.name}" has no recipe`);
}

// ─── 4+5. Every recipe line maps in LINE_MAP; every mapped id exists ────────
for (const [dish, r] of Object.entries(RECIPES)) {
  const lines = [...(r.base || [])];
  for (const ex of Object.values(r.extras || {})) lines.push(...ex);
  for (const ln of lines) {
    const m = LINE_MAP[ln.name];
    if (!m) { F('line-mapped', `"${dish}" recipe line "${ln.name}" is not in LINE_MAP (silently costs $0)`); continue; }
    if (m.skip) continue;
    if (!seedIds.has(m.id)) F('ingredient-exists', `"${dish}" line "${ln.name}" maps to ingredient id "${m.id}" which is not in ingredients.js (the Gumbo/boudin bug class)`);
  }
  // every variant in factors corresponds to a real menu variant and vice versa
  const dishRec = [...DISHES, ...ALL_ALWAYS_ITEMS].find(x => x.name === dish);
  if (dishRec && r.factors) {
    for (const v of dishRec.variants) {
      if (!(v.label in r.factors)) W('factors-cover', `"${dish}" variant "${v.label}" has no factors entry (defaults to 1 — intentional for some bag items)`);
    }
    for (const fl of Object.keys(r.factors)) {
      if (!dishRec.variants.some(v => v.label === fl)) W('factors-orphan', `"${dish}" factors key "${fl}" matches no menu variant`);
    }
    for (const el of Object.keys(r.extras || {})) {
      if (!dishRec.variants.some(v => v.label === el)) F('extras-orphan', `"${dish}" extras key "${el}" matches no menu variant (extras silently never applied)`);
    }
  }
}
// priceLink targets exist
for (const i of INGREDIENT_SEED) {
  if (i.priceLink && !seedIds.has(i.priceLink)) F('pricelink', `ingredient "${i.id}" priceLinks to missing "${i.priceLink}"`);
}

// ─── 2+16. Baseline drift ≈ 0 and anchor round-trip for every dinner variant ─
for (const d of DISHES) {
  for (const v of d.variants) {
    const r = costDishVariant(d.name, v.label, v.cost, base, base);
    if (r.unknown) { F('costable', `"${d.name}" / "${v.label}" cannot be costed (no recipe resolution)`); continue; }
    if (Math.abs(r.pctDrift) > 0.5) F('baseline-drift', `"${d.name}" / "${v.label}" drifts ${r.pctDrift}% at baseline (anchor stale or recipe/costing changed)`);
    if (Math.abs(r.adjustedCost - v.cost) > 0.005) F('anchor-roundtrip', `"${d.name}" / "${v.label}" adjustedCost ${r.adjustedCost} != anchor ${v.cost} at baseline`);
  }
}

// ─── 3. Proportion invariance under a NON-uniform price shock ───────────────
// All variants of a dish with the same ingredient composition must show the
// same drift %. Known structural exceptions (explicit, with reasons — do NOT
// loosen the rule globally):
const PROPORTION_EXCEPTIONS = {
  'Bolognese': 'egg pappardelle extras are 2 packs (Small) vs 3 packs (Large) — deliberately not 2x',
  'Bo Ssam': 'kimchi is a fixed 1-jar quantity at both sizes while the batch factor is 0.5/1',
};
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const shocked = {};
for (const id of Object.keys(base)) shocked[id] = base[id] * (1 + (hash(id) % 60) / 100);
for (const d of DISHES) {
  if (PROPORTION_EXCEPTIONS[d.name]) continue;
  const groups = new Map(); // idSetKey -> [{label, drift}]
  for (const v of d.variants) {
    const resolved = resolveDishVariant(d.name, v.label);
    if (!resolved) continue;
    const key = resolved.map(r => r.id).sort().join('|');
    const r = costDishVariant(d.name, v.label, v.cost, shocked, base);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ label: v.label, drift: r.pctDrift });
  }
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const drifts = g.map(x => x.drift);
    if (Math.max(...drifts) - Math.min(...drifts) > 0.05) {
      F('proportion', `"${d.name}" same-composition variants drift differently under a price shock (factors/extras proportion bug): ${g.map(x => `${x.label}=${x.drift}%`).join(', ')}`);
    }
  }
}

// ─── 6. Equipment map entry for every dinner (+ the checked always-items) ───
for (const d of DISHES) {
  if (!(d.name in DISH_EQUIPMENT)) F('equipment', `dinner "${d.name}" missing from DISH_EQUIPMENT — conflict checker silently skips it (the rename bug class)`);
}
// analyzeConflicts must actually see every dinner (functional check, not just map presence)
const seen = analyzeConflicts(DISHES.map(d => d.name));
if (!seen || !('red' in seen)) F('equipment-run', 'analyzeConflicts returned an unexpected shape');

// ─── 7. Cuisine for every dinner ────────────────────────────────────────────
for (const d of DISHES) {
  if (!DISH_CUISINE[d.name]) F('cuisine', `dinner "${d.name}" missing from DISH_CUISINE (insights bucket it "Other")`);
}

// ─── 8. Every dinner variant produces a reheat card ─────────────────────────
for (const d of DISHES) {
  for (const v of d.variants) {
    const blocks = buildReheatBlocks({ items: [{ name: d.name, variant: v.label, qty: 1 }] });
    const covered = blocks.some(b => (b.dishes || []).includes(d.name));
    if (!covered) F('reheat-card', `"${d.name}" / "${v.label}" produces NO reheat card (dish missing from reheat routing)`);
  }
}

// ─── 9. Rice charge exactly where it belongs ────────────────────────────────
const CUMIN_DUAL = 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice';
for (const d of DISHES) {
  for (const v of d.variants) {
    const resolved = resolveDishVariant(d.name, v.label) || [];
    const rice = resolved.find(r => r.id === 'rice');
    let expected = 0;
    if (d.name === CUMIN_DUAL) expected = /^(beef|lamb),/i.test(v.label) ? (/large/i.test(v.label) ? 2 : 1) : 0;
    else if (d.rice) expected = /large/i.test(v.label) ? 2 : 1;
    const got = rice ? rice.qty : 0;
    if (got !== expected) F('rice-charge', `"${d.name}" / "${v.label}" rice units ${got}, expected ${expected}`);
    if (d.rice && d.name !== CUMIN_DUAL && !/small|large/i.test(v.label) && !/servings/i.test(v.label)) {
      F('rice-label', `"${d.name}" / "${v.label}" — rice dish variant label carries no Small/Large sizing signal (riceUnits can't size the container)`);
    }
    if (rice && !rice.fixed) F('rice-fixed', `"${d.name}" / "${v.label}" rice line is drifting — it must be fixed`);
  }
}

// ─── 10. Packaging (wrap) per the rules ─────────────────────────────────────
const wrapExpect = (rec) => rec.packaging === 'none' ? 0 : rec.packaging === 'jar' ? 2 : 1;
for (const rec of [...DISHES, ...ALL_ALWAYS_ITEMS]) {
  if (!rec.recipe) continue; // no recipe → engine can't resolve → wrap moot
  const v = rec.variants[0];
  const resolved = resolveDishVariant(rec.name, v.label) || [];
  const wrap = resolved.find(r => r.id === 'wrap');
  const got = wrap ? wrap.qty : 0;
  const expected = wrapExpect(rec);
  if (got !== expected) F('wrap', `"${rec.name}" wrap units ${got}, expected ${expected} (packaging: ${rec.packaging || 'default'})`);
  if (wrap && !wrap.fixed) F('wrap-fixed', `"${rec.name}" wrap line is drifting — it must be fixed`);
}

// ─── 11+13. menu.html LIBRARY: entry per dinner, no orphans ─────────────────
const menuHtml = fs.readFileSync(path.join(ROOT, 'menu.html'), 'utf8');
const libMatch = menuHtml.match(/var LIBRARY = (\{.*\});/);
if (!libMatch) F('library', 'could not locate `var LIBRARY = {...};` in menu.html');
else {
  let LIB;
  try { LIB = JSON.parse(libMatch[1]); } catch (e) { F('library', 'LIBRARY in menu.html is not valid JSON: ' + e.message); }
  if (LIB) {
    const libDinners = LIB.dinners || {};
    for (const d of DISHES) {
      const e = libDinners[d.name];
      if (!e) { F('library-entry', `dinner "${d.name}" has no menu.html LIBRARY entry (customer menu/order form show nothing for it)`); continue; }
      for (const field of ['desc', 'reheat', 'contains']) {
        if (typeof e[field] !== 'string' || !e[field].length) F('library-field', `LIBRARY "${d.name}" missing "${field}"`);
      }
      if (typeof e.bagged !== 'boolean') W('library-field', `LIBRARY "${d.name}" has no boolean "bagged" flag`);
    }
    for (const k of Object.keys(libDinners)) {
      if (!DISHES.some(d => d.name === k)) F('library-orphan', `menu.html LIBRARY.dinners has "${k}" which is not a registry dinner (orphan copy — the "Pasta with Red Sauce" class)`);
    }
    // always-menu items with customer copy: name must be a real registry item
    for (const section of ['addons', 'bag', 'sauces']) {
      for (const k of Object.keys(LIB[section] || {})) {
        if (!allNames.has(k)) F('library-orphan', `menu.html LIBRARY.${section} has "${k}" which is not in the registry`);
      }
    }
  }
}

// ─── 12+13. main-menu.html: card per dinner, prices match, no orphan cards ──
const mainHtml = fs.readFileSync(path.join(ROOT, 'main-menu.html'), 'utf8');
const cards = mainHtml.split('<div class="dish">').slice(1).map(chunk => {
  const name = (chunk.match(/<div class="dish-name">([^<]*)<\/div>/) || [])[1];
  const amounts = [...chunk.matchAll(/<span class="price-amt">\$([\d.]+)<\/span>/g)].map(m => Number(m[1]));
  return { name, amounts };
});
const cardByName = new Map(cards.filter(c => c.name).map(c => [c.name, c]));
for (const d of DISHES) {
  const card = cardByName.get(d.name);
  if (!card) { F('mainmenu-card', `dinner "${d.name}" has no main-menu.html card`); continue; }
  const prices = d.variants.map(v => v.price);
  if (card.amounts.length !== prices.length) {
    F('mainmenu-prices', `"${d.name}" main-menu card has ${card.amounts.length} price rows, registry has ${prices.length} variants`);
  } else {
    prices.forEach((p, i) => {
      if (Math.abs(card.amounts[i] - p) > 0.001) F('mainmenu-prices', `"${d.name}" main-menu price #${i + 1} is $${card.amounts[i]}, registry says $${p} (${d.variants[i].label})`);
    });
  }
}
// orphan dinner-looking cards: any card whose name matches no registry item at all
for (const c of cards) {
  if (c.name && !allNames.has(c.name)) W('mainmenu-orphan', `main-menu.html card "${c.name}" matches no registry dish (stale card?)`);
}

// ─── 13 (JS side). No orphan keys in any derived-consumer structure ─────────
// The registry derivation makes these structurally impossible to desync, but
// keep the check: it guards future hand edits or partial reverts of the merge.
const jsMaps = { DINNER_REHEAT_BUCKET, DISH_EQUIPMENT, DISH_CUISINE, RECIPES, STEW_VEG_COPY };
for (const [mapName, m] of Object.entries(jsMaps)) {
  for (const k of Object.keys(m)) {
    if (!allNames.has(k)) F('orphan', `${mapName} has key "${k}" which is not a registry dish`);
  }
}
for (const s of [RICE_DISHES, PASTA_DISHES, NOODLE_DISHES, BAGGED_PASTA_DISHES]) {
  for (const k of s) if (!allNames.has(k)) F('orphan', `starch set has "${k}" which is not a registry dish`);
}
// DEFAULT_WEEK must reference real dinners
for (const k of DEFAULT_WEEK) {
  if (!DISHES.some(d => d.name === k)) F('orphan', `DEFAULT_WEEK references "${k}" which is not a registry dinner`);
}

// ─── 14. Margin floor (WARN only — deliberate tight prices exist) ───────────
for (const d of DISHES) {
  for (const v of d.variants) {
    const margin = (v.price - v.cost) / v.price * 100;
    if (margin < 45) W('margin', `"${d.name}" / "${v.label}" margin ${margin.toFixed(1)}% (< 45% floor) — $${v.price} on $${v.cost}`);
  }
}

// ─── 15. Small→Large label sanity: bigger costs and prices ──────────────────
for (const d of DISHES) {
  for (const v of d.variants) {
    const twin = findLargeTwin(d, v);
    if (!twin) continue; // sizes with different naming (e.g., ~6 servings) — no pair to compare
    if (!(twin.price > v.price)) F('size-sanity', `"${d.name}" Large "${twin.label}" price $${twin.price} not > Small $${v.price}`);
    if (!(twin.cost > v.cost)) F('size-sanity', `"${d.name}" Large "${twin.label}" anchor $${twin.cost} not > Small $${v.cost}`);
  }
}

// ─── Anchor scale: raw recipe cost must scale like the anchors do ───────────
// Catches a mis-scaled batch factor (e.g. Large factor 3 where it should be 2),
// which is invisible to baseline-drift (drift is live-vs-baseline, factors
// cancel) AND to proportion invariance (a uniform mis-scale keeps proportions).
// Tolerance 10%: wrap + rice containers + fixed-qty extras are per-order costs
// that legitimately do NOT double from Small to Large, producing a structural
// 2-6% gap below the exact-2x anchors (measured across all current twins). A
// genuinely wrong factor lands 25%+ out. 10% cleanly separates the two.
for (const d of DISHES) {
  if (PROPORTION_EXCEPTIONS[d.name]) continue; // same structural exceptions (non-2x extras, fixed-qty kimchi)
  for (const v of d.variants) {
    const twin = findLargeTwin(d, v);
    if (!twin) continue;
    const rs = costDishVariant(d.name, v.label, v.cost, base, base).rawBaseline;
    const rl = costDishVariant(d.name, twin.label, twin.cost, base, base).rawBaseline;
    if (!rs || !rl) continue;
    const dev = Math.abs((rl / rs) / (twin.cost / v.cost) - 1) * 100;
    if (dev > 10) F('anchor-scale', `"${d.name}" ${v.label} → ${twin.label}: recipe cost scales x${(rl / rs).toFixed(2)} but anchors scale x${(twin.cost / v.cost).toFixed(2)} (${dev.toFixed(1)}% apart — factor or anchor mis-scaled)`);
  }
}

// ─── MARGIN_BUFFER applied exactly once ──────────────────────────────────────
if (Math.abs(trueRawCost(100 * MARGIN_BUFFER) - 100) > 0.01) F('buffer', 'trueRawCost does not round-trip MARGIN_BUFFER');
if (MARGIN_BUFFER !== 1.0825) F('buffer', `MARGIN_BUFFER changed: ${MARGIN_BUFFER} (must stay 1.0825 — baked into every anchor)`);

// ─── Receipt matcher fixtures (locks the hard-won Ea-vs-pack logic) ─────────
const receiptCases = [
  { name: 'Kitch Basics carton, 2 Ea @ printed unit price', line: { item_name: 'KITCH BASICS UNSLTD BEEF', quantity: 2, unit: 'Ea', unit_price_printed: 2.98, line_total: 5.96 }, expect: { id: 'beef_stock', perUnit: 2.98 / 4 } },
  { name: 'Tofu package via alias', line: { item_name: 'BANYAN HARD TCFU', quantity: 1, unit: 'Ea', line_total: 2.49 }, expect: { id: 'tofu', perUnit: 2.49 } },
  { name: 'Garlic labeled 5-pack divides to per-head', line: { item_name: 'GARLIC', quantity: 5, unit: '5 pack', line_total: 3.0 }, expect: { id: 'garlic', perUnit: 0.6 } },
  { name: 'Weighed with weight: total / lbs', line: { item_name: 'ASPARAGUS STANDARD', weighed: true, quantity: 1.5, unit: 'lb', line_total: 6.0 }, expect: { id: 'asparagus', perUnit: 4.0 } },
  { name: 'Weighed FW no weight but has total: flat, no prompt', line: { item_name: 'HONEYCRISP APPLES', weighed: true, line_total: 4.11 }, expect: { id: 'apple', status: 'matched' } },
  { name: 'Weighed, no weight, no total: prompt', line: { item_name: 'ASPARAGUS STANDARD', weighed: true }, expect: { id: 'asparagus', status: 'needsPrice' } },
  { name: 'Baby gold 2lb bag halves to per-lb', line: { item_name: 'BAGGED BABY GOLD POTATOES', quantity: 1, unit: 'Ea', line_total: 4.5 }, expect: { id: 'baby_gold_potatoes', perUnit: 2.25 } },
  { name: 'Butter lb → per stick', line: { item_name: 'BUTTER UNSALTED', quantity: 1, unit: 'lb', unit_price_printed: 4.4, line_total: 4.4 }, expect: { id: 'butter', perUnit: 1.1 } },
];
for (const c of receiptCases) {
  const plan = buildReviewPlan({ store: 'HEB', lines: [c.line] }, INGREDIENT_SEED, {});
  const all = [...plan.buckets.matched, ...plan.buckets.needsPrice, ...plan.buckets.unmatched, ...plan.buckets.ignored];
  const g = all[0];
  if (!g) { F('receipt', `${c.name}: no classification produced`); continue; }
  if (c.expect.status && g.status !== c.expect.status) { F('receipt', `${c.name}: status "${g.status}", expected "${c.expect.status}"`); continue; }
  if (!c.expect.status && g.status !== 'matched') { F('receipt', `${c.name}: status "${g.status}", expected matched`); continue; }
  if (g.ingredientId !== c.expect.id) F('receipt', `${c.name}: matched "${g.ingredientId}", expected "${c.expect.id}"`);
  if (c.expect.perUnit != null && Math.abs(g.perUnit - c.expect.perUnit) > 0.005) F('receipt', `${c.name}: perUnit ${g.perUnit}, expected ${c.expect.perUnit}`);
}

// ─── FULL_MENU / ALWAYS_MENU structural agreement with the registry ─────────
for (const [cat, items] of Object.entries(ALWAYS_ITEMS)) {
  const menuCat = ALWAYS_MENU[cat] || [];
  if (menuCat.length !== items.length) F('menu-derive', `ALWAYS_MENU.${cat} length ${menuCat.length} != registry ${items.length}`);
}
if (ALL_DINNERS.length !== DISHES.length) F('menu-derive', `ALL_DINNERS length ${ALL_DINNERS.length} != registry ${DISHES.length}`);

// ─── Report ──────────────────────────────────────────────────────────────────
console.log(`\nLTB invariant suite — ${DISHES.length} dinners, ${ALL_ALWAYS_ITEMS.length} always-menu items, ${Object.keys(RECIPES).length} recipes checked.\n`);
if (warns.length) {
  console.log(`WARNINGS (${warns.length}) — reported, non-failing:`);
  warns.forEach(w => console.log('  ⚠ ' + w));
  console.log('');
}
if (fails.length) {
  console.log(`FAILURES (${fails.length}):`);
  fails.forEach(f => console.log('  ✗ ' + f));
  console.log('\nRESULT: FAIL');
  process.exit(1);
}
console.log('RESULT: PASS — every invariant holds for every dish.');
