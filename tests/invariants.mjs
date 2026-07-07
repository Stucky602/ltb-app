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
import { DISH_CUISINE, itemCost, stampItemCosts, menuVariantFor, repricePerLbItem, normalizePendingItems, itemOptions, noteWithoutOptions, routeItemRequest, routeParsedDraft, validateParsedOrder, diffOrders } from '../src/utils.js';
import { INGREDIENT_SEED } from '../src/ingredients.js';
import { buildReviewPlan, extractNameSizes, countBaseOf, wineHint } from '../src/receiptMatch.js';
import { normalizeIngredientName } from '../src/recipes.js';

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
  { name: 'Baby gold 1.5lb bag → per-lb (Kevin-corrected Jul 6, was seeded 2lb)', line: { item_name: 'BAGGED BABY GOLD POTATOES', quantity: 1, unit: 'Ea', line_total: 4.5 }, expect: { id: 'baby_gold_potatoes', perUnit: 3 } },
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

// ─── Receipt matcher v2: confidence bands, families, conversions ────────────
// Pins the July 5 rebuild. Wrong cost data is the cardinal sin, so these
// encode WHEN the matcher is allowed to be confident and when it must ask.
{
  const seedIngs = INGREDIENT_SEED.map(i => ({ id: i.id, name: i.name, unit: i.unit, baseline: i.baseline, current: i.baseline }));
  const plan = (lines, aliases = {}) => buildReviewPlan({ store: 'HEB', lines }, seedIngs, aliases);

  // 1. Kevin's pork case: bone-in shoulder must NOT silently auto-match — it
  //    lands in review with BOTH pork cuts offered (interchange family).
  const pork = plan([{ item_name: 'PORK SHOULDER BONE IN', quantity: 8.2, unit: 'lb', weighed: true, line_total: 24.52 }]);
  const pg = pork.buckets.review[0];
  if (!pg) F('receipt-v2', 'bone-in pork shoulder did not land in review');
  else {
    const ids = pg.candidates.map(c => c.id);
    if (!ids.includes('pork_butt') || !ids.includes('pork_shoulder')) F('receipt-v2', `pork family candidates missing: ${ids.join(',')}`);
    if (pork.buckets.matched.length) F('receipt-v2', 'ambiguous pork was auto-matched — must ask');
  }

  // 2. Strong unambiguous name still auto-matches (no new friction).
  const thighs = plan([{ item_name: 'CHICKEN THIGHS BNLS', quantity: 2.1, unit: 'lb', weighed: true, line_total: 10.5 }]);
  const tg = thighs.buckets.matched[0];
  if (!tg || tg.ingredientId !== 'chicken_thighs') F('receipt-v2', `chicken thighs failed to auto-match: ${JSON.stringify(thighs.buckets)}`);

  // 3. Same-family near-tie goes to review, never auto (onion vs sweet onion).
  const onion = plan([{ item_name: 'YELLOW ONION', quantity: 1.1, unit: 'lb', weighed: true, line_total: 1.2 }]);
  if (onion.buckets.matched.length) F('receipt-v2', 'same-family onion tie was auto-matched');
  if (!onion.buckets.review.length) F('receipt-v2', 'onion tie did not land in review');

  // 4. Portion-unit ingredient bought as a package → needsConversion prompt,
  //    and a learned alias.packQty resolves it deterministically forever.
  const fennelLine = { item_name: 'MCCORMICK FENNEL SEED', quantity: 1, unit: 'Ea', unit_price_printed: 3.99, line_total: 3.99 };
  const ask = plan([fennelLine]);
  const ag = ask.buckets.needsConversion[0];
  if (!ag || ag.ingredientId !== 'fennel_seeds') F('receipt-v2', `fennel jar did not ask for pack size: ${JSON.stringify(ask.buckets)}`);
  const learned = plan([fennelLine], { [normalizeIngredientName('MCCORMICK FENNEL SEED')]: { ingredientId: 'fennel_seeds', packQty: 24 } });
  const lg = learned.buckets.matched[0];
  if (!lg || Math.abs(lg.perUnit - 3.99 / 24) > 0.001 || lg.basis !== 'converted') F('receipt-v2', `learned packQty failed: ${JSON.stringify(lg)}`);

  // 5. Bidirectional weight bridge: a whole kabocha priced per-each converts to
  //    the per-lb costing unit via the 2.5 lb average.
  const kab = plan([{ item_name: 'KABOCHA SQUASH', quantity: 1, unit: 'Ea', unit_price_printed: 4.98, line_total: 4.98 }]);
  const kg = kab.buckets.matched[0];
  if (!kg || Math.abs(kg.perUnit - 4.98 / 2.5) > 0.01) F('receipt-v2', `kabocha each→lb bridge failed: ${JSON.stringify(kg)}`);

  // 6. Dozen invariant: eggs at $3.60/dozen cost $0.30 each.
  const eggs = plan([{ item_name: 'GRADE A LARGE EGGS', quantity: 1, unit: 'dozen', unit_price_printed: 3.6, line_total: 3.6 }]);
  const eg = eggs.buckets.matched[0];
  if (!eg || Math.abs(eg.perUnit - 0.3) > 0.001) F('receipt-v2', `eggs dozen conversion failed: ${JSON.stringify(eg)}`);

  // 7. Price sanity: a fuzzy match whose derived price is wildly off current
  //    demotes to review instead of silently poisoning the cost DB.
  const crazy = plan([{ item_name: 'GROUND LAMB', quantity: 1, unit: 'lb', weighed: true, line_total: 55 }]);
  if (crazy.buckets.matched.length) F('receipt-v2', 'wild price was auto-accepted — must demote to review');
  if (!crazy.buckets.review.length) F('receipt-v2', 'wild-price line did not land in review');
}

// ─── FULL_MENU / ALWAYS_MENU structural agreement with the registry ─────────
for (const [cat, items] of Object.entries(ALWAYS_ITEMS)) {
  const menuCat = ALWAYS_MENU[cat] || [];
  if (menuCat.length !== items.length) F('menu-derive', `ALWAYS_MENU.${cat} length ${menuCat.length} != registry ${items.length}`);
}
if (ALL_DINNERS.length !== DISHES.length) F('menu-derive', `ALL_DINNERS length ${ALL_DINNERS.length} != registry ${DISHES.length}`);

// ─── Cost-basis snapshot semantics (order economics foundation) ──────────────
// These encode the rules that make historical order profit stable: a stamped
// item's cost NEVER moves when the registry is re-anchored; unstamped items
// fall back to the current registry (rename-immune); degenerate 0s don't
// freeze; stamping is idempotent and honestly source-flagged.
{
  const anyDinner = DISHES.find(d => d.name === 'Chili');
  const chiliLg = anyDinner.variants.find(v => /Large/.test(v.label));

  // 1. Snapshot preference: a stamped cost wins over the current anchor.
  const stamped = { name: 'Chili', category: 'dinner', variant: chiliLg.label, cost: 5, costSource: 'snapshot', qty: 1 };
  if (itemCost(stamped) !== 5) F('cost-basis', `stamped cost ignored: got ${itemCost(stamped)}, expected 5 (re-anchoring must not move history)`);

  // 2. Fallback: unstamped item costs at the CURRENT anchor.
  const unstamped = { name: 'Chili', category: 'dinner', variant: chiliLg.label, qty: 1 };
  if (itemCost(unstamped) !== chiliLg.cost) F('cost-basis', `unstamped fallback: got ${itemCost(unstamped)}, expected current anchor ${chiliLg.cost}`);

  // 3. Category-optional fallback (customer items carry no category).
  const noCat = { name: 'Chili', variant: chiliLg.label, qty: 1 };
  if (itemCost(noCat) !== chiliLg.cost) F('cost-basis', `category-less fallback failed: got ${itemCost(noCat)}`);

  // 4. Rename immunity: an old stored dish name + old variant label still
  //    resolves to the current registry entry via the alias maps.
  const cuminNew = DISHES.find(d => d.name === 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice');
  const mushSm = cuminNew.variants.find(v => v.label === 'Mushroom, Small (~3-4)');
  const oldNames = { name: 'Cumin Mushroom Noodles / Cumin Beef on Rice', variant: 'Small (~3-4)', qty: 1 };
  if (itemCost(oldNames) !== mushSm.cost) F('cost-basis', `rename immunity failed: old Cumin names got ${itemCost(oldNames)}, expected ${mushSm.cost}`);

  // 5. Zero-cost guard: cost 0 on a normal item is degenerate (falls back);
  //    cost 0 on a weight-pending per-lb item is a deliberate placeholder.
  const zeroNormal = { name: 'Chili', category: 'dinner', variant: chiliLg.label, cost: 0, qty: 1 };
  if (itemCost(zeroNormal) !== chiliLg.cost) F('cost-basis', `zero-cost guard failed: degenerate 0 froze instead of falling back`);
  const zeroPending = { name: 'Ribeye', cost: 0, weightPending: true, qty: 1 };
  if (itemCost(zeroPending) !== 0) F('cost-basis', `weight-pending placeholder broken: got ${itemCost(zeroPending)}, expected 0`);

  // 6. Stamping: fills missing bases with the requested source flag, tags
  //    pre-existing bases as genuine snapshots, and is idempotent.
  const toStamp = [
    { name: 'Chili', category: 'dinner', variant: chiliLg.label, qty: 1 },                                   // missing → stamp
    { name: 'Chili', category: 'dinner', variant: chiliLg.label, cost: 5, qty: 1 },                          // pre-existing → tag snapshot
    { name: 'Ribeye', weightPending: true, cost: 0, qty: 1 },                                                // pending → untouched
  ];
  const once = stampItemCosts(toStamp, 'backfilled');
  if (once[0].cost !== chiliLg.cost || once[0].costSource !== 'backfilled') F('cost-basis', `backfill stamp wrong: ${JSON.stringify(once[0])}`);
  if (once[1].cost !== 5 || once[1].costSource !== 'snapshot') F('cost-basis', `pre-existing basis mishandled: ${JSON.stringify(once[1])}`);
  if (once[2].cost !== 0 || once[2].costSource) F('cost-basis', `weight-pending item was stamped: ${JSON.stringify(once[2])}`);
  const twice = stampItemCosts(once, 'backfilled');
  if (JSON.stringify(twice) !== JSON.stringify(once)) F('cost-basis', `stampItemCosts is not idempotent`);

  // 7. Acceptance re-stamp: the registry overrides client-submitted numbers.
  const clientItem = [{ name: 'Chili', variant: chiliLg.label, cost: 0.01, qty: 1 }];
  const accepted = stampItemCosts(clientItem, 'snapshot', { reStamp: true });
  if (accepted[0].cost !== chiliLg.cost) F('cost-basis', `acceptance re-stamp failed: kept client cost ${accepted[0].cost}`);

  // 8. Off-menu with no basis stays unstamped (order stays honestly incomplete).
  const offMenu = stampItemCosts([{ name: 'Totally Custom Thing', variant: 'One', qty: 1 }], 'backfilled');
  if (offMenu[0].cost !== undefined || offMenu[0].costSource) F('cost-basis', `off-menu item got a fabricated basis: ${JSON.stringify(offMenu[0])}`);
  if (itemCost(offMenu[0]) !== null) F('cost-basis', `off-menu itemCost should be null, got ${itemCost(offMenu[0])}`);

  // ── Per-lb protein hardening (July 5 sweep) ────────────────────────────────
  const nyInfo = ALWAYS_MENU.bag.find(b => b.name === 'NY Strip');
  const ratePrice = nyInfo.pricePerLb, rateCost = nyInfo.costPerLb;

  // 9. repricePerLbItem REFUSES to price an unweighed item (the old 1-lb
  //    default silently fabricated weights via the reprice-all button).
  const unweighed = { name: 'NY Strip', variant: 'price by weight', weightPending: true, price: 0, cost: 0, qty: 1 };
  const notRepriced = repricePerLbItem(unweighed);
  if (!notRepriced.weightPending || notRepriced.price !== 0) F('cost-basis', `repricePerLbItem fabricated a weight: ${JSON.stringify(notRepriced)}`);

  // 10. With a real weight it prices correctly and tags the snapshot.
  const weighed = repricePerLbItem({ ...unweighed, weight: 0.8 });
  const expPrice = Math.round((ratePrice * 0.8 + 1.5) * 100) / 100;
  const expCost = Math.round((rateCost * 0.8) * 100) / 100;
  if (weighed.weightPending || weighed.price !== expPrice || weighed.cost !== expCost || weighed.costSource !== 'snapshot')
    F('cost-basis', `repricePerLbItem wrong: ${JSON.stringify(weighed)}, expected price ${expPrice} cost ${expCost}`);

  // 11. stampItemCosts must NEVER stamp the $/lb RATE as a basis — not even
  //     with reStamp (the acceptance path) on the raw customer-form shape.
  const customerShape = { name: 'NY Strip', variant: 'price by weight', price: ratePrice, cost: rateCost, perLb: true, avgWeightLb: 0.75, qty: 1 };
  const stampedPerLb = stampItemCosts([customerShape], 'snapshot', { reStamp: true })[0];
  if (stampedPerLb.costSource) F('cost-basis', `per-lb rate was stamped as a basis: ${JSON.stringify(stampedPerLb)}`);

  // 12. A genuinely weighed per-lb item's basis gets tagged, never re-derived.
  const weighedLegacy = stampItemCosts([{ name: 'NY Strip', variant: 'price by weight', weight: 0.8, cost: expCost, price: expPrice, qty: 1 }], 'backfilled')[0];
  if (weighedLegacy.cost !== expCost || weighedLegacy.costSource !== 'snapshot') F('cost-basis', `weighed per-lb basis mishandled: ${JSON.stringify(weighedLegacy)}`);

  // 13. normalizePendingItems converts the customer-form rate shape into the
  //     canonical pending shape (weightPending, zeroed rate) and touches
  //     nothing else.
  const norm = normalizePendingItems([
    customerShape,
    { name: 'Chili', variant: chiliLg.label, price: chiliLg.price, cost: chiliLg.cost, qty: 1 },
    { name: 'NY Strip', variant: 'price by weight', weight: 0.8, price: expPrice, cost: expCost, qty: 1 },
  ]);
  if (!norm[0].weightPending || norm[0].price !== 0 || norm[0].cost !== 0) F('cost-basis', `pending normalization failed: ${JSON.stringify(norm[0])}`);
  if (norm[1].price !== chiliLg.price || norm[1].weightPending) F('cost-basis', `normalization touched a regular item: ${JSON.stringify(norm[1])}`);
  if (norm[2].weightPending || norm[2].price !== expPrice) F('cost-basis', `normalization clobbered a weighed item: ${JSON.stringify(norm[2])}`);
}

// ─── Dish options: registry schema + structured/legacy accessor (Batch 3) ────
// Options are first-class: dishes declare them (dishes.js `options`), the
// publish payload and both order forms read them from there, and items store
// choices in item.options. itemOptions() must prefer the structured field
// and fall back to legacy "Spice: N" / "Pasta: x" note prefixes forever.
{
  const KNOWN_OPTION_KEYS = new Set(['spice', 'pasta']);
  for (const d of DISHES) {
    if (!d.options) continue;
    for (const [k, def] of Object.entries(d.options)) {
      if (!KNOWN_OPTION_KEYS.has(k)) F('options-schema', `"${d.name}" declares unknown option "${k}" — add it to KNOWN_OPTION_KEYS deliberately or fix the typo`);
      if (k === 'spice') {
        if (!Number.isInteger(def.min) || !Number.isInteger(def.max) || def.min < 1 || def.max > 9 || def.min >= def.max) {
          F('options-schema', `"${d.name}" spice option needs integer 1 ≤ min < max ≤ 9, got ${JSON.stringify(def)}`);
        }
      }
      if (k === 'pasta') {
        if (def.excludeVariants) {
          if (!Array.isArray(def.excludeVariants)) F('options-schema', `"${d.name}" pasta excludeVariants must be an array`);
          else for (const sub of def.excludeVariants) {
            if (!d.variants.some(v => v.label.includes(sub))) F('options-schema', `"${d.name}" pasta excludeVariants "${sub}" matches no variant label (stale exclusion)`);
          }
        }
      }
    }
    // ALL_DINNERS (→ publish → form.html) must carry the declaration through
    const menuDish = ALL_DINNERS.find(m => m.name === d.name);
    if (!menuDish || JSON.stringify(menuDish.options) !== JSON.stringify(d.options)) {
      F('options-schema', `"${d.name}" options not carried through ALL_DINNERS — form.html would render no picker`);
    }
  }
  // Accessor semantics fixtures
  const structured = itemOptions({ options: { spice: 3, pasta: 'rigatoni' }, note: 'Spice: 5. Pasta: shells. extra sauce' });
  if (structured.spice !== 3 || structured.pasta !== 'rigatoni') F('options-accessor', `structured field must win over legacy note: got ${JSON.stringify(structured)}`);
  const legacy = itemOptions({ note: 'Spice: 4. Pasta: penne. no cilantro' });
  if (legacy.spice !== 4 || legacy.pasta !== 'penne') F('options-accessor', `legacy note fallback broken: got ${JSON.stringify(legacy)}`);
  if (itemOptions({}).spice !== undefined) F('options-accessor', 'empty item must yield no options');
  const stripped = noteWithoutOptions('Spice: 4. Pasta: penne. no cilantro');
  if (stripped !== 'no cilantro') F('options-accessor', `noteWithoutOptions must strip prefixes and keep the rest, got "${stripped}"`);
  if (noteWithoutOptions('just a note') !== 'just a note') F('options-accessor', 'noteWithoutOptions must not touch plain notes');
}

// ─── Intent router + amendment diff (Batch 4) ────────────────────────────────
// The router is DETERMINISTIC app code: the model extracts verbatim requests,
// these fixtures pin how they route. Any change to routing behavior must
// update these deliberately.
{
  const M = FULL_MENU;
  const mk = (name, variant) => [{ name, variant, qty: 1 }];

  // Tier 1 — option exists, explicit → auto
  let items = mk('Indian Style Curry', 'Chicken, Small (~4-5)');
  let a = routeItemRequest(M, items, 0, 'spice level 4 please');
  if (!(a.type === 'set-option' && a.key === 'spice' && a.value === 4 && a.auto)) F('router', `explicit spice digit: ${JSON.stringify(a)}`);
  a = routeItemRequest(M, items, 0, 'extra spicy!!');
  if (!(a.type === 'set-option' && a.value === 5 && a.auto)) F('router', `"extra spicy" should auto-map to 5: ${JSON.stringify(a)}`);
  a = routeItemRequest(M, items, 0, 'mild please');
  if (!(a.type === 'set-option' && a.value === 2 && a.auto)) F('router', `"mild" should auto-map to 2: ${JSON.stringify(a)}`);
  a = routeItemRequest(M, items, 0, 'spice 9');
  if (!(a.type === 'set-option' && a.value === 5 && a.auto)) F('router', `out-of-range digit must clamp to max: ${JSON.stringify(a)}`);

  // Tier 1 — option exists, vague → prompt with suggestion
  a = routeItemRequest(M, items, 0, 'can you adjust the heat on this');
  if (!(a.type === 'set-option' && a.value === null && a.suggest >= 1 && a.auto === false)) F('router', `vague spice must prompt: ${JSON.stringify(a)}`);

  // Tier 2 — option-ish ask on a dish WITHOUT the option → prompt, never silent
  items = mk('Gumbo', 'Small (split order, ~3-6)');
  a = routeItemRequest(M, items, 0, 'make it spicy');
  if (!(a.type === 'add-item-note' && a.tier2 === 'spice' && a.auto === false)) F('router', `tier-2 spice must prompt a note: ${JSON.stringify(a)}`);

  // Pasta — shape named, option applies → auto
  items = mk('Saffron Pork Ragu', 'Small (~4 servings)');
  a = routeItemRequest(M, items, 0, 'rigatoni please!');
  if (!(a.type === 'set-option' && a.key === 'pasta' && a.value === 'rigatoni' && a.auto)) F('router', `named shape must auto-set: ${JSON.stringify(a)}`);

  // Pasta — shape named but variant EXCLUDED (Polenta) → tier-2 prompt
  items = mk('Saffron Pork Ragu', 'With Polenta, Small (~4 servings)');
  a = routeItemRequest(M, items, 0, 'rigatoni please!');
  if (!(a.type === 'add-item-note' && a.tier2 === 'pasta' && a.auto === false)) F('router', `excluded variant must not take a pasta option: ${JSON.stringify(a)}`);

  // Generic ask → silent note (today's behavior preserved)
  items = mk('Mapo Eggplant', 'Small (~5-6 servings)');
  a = routeItemRequest(M, items, 0, 'no cilantro');
  if (!(a.type === 'add-item-note' && a.auto === true)) F('router', `plain ask must attach silently: ${JSON.stringify(a)}`);

  // End-to-end through validateParsedOrder: routing executes autos, queues prompts
  const curry = ALL_DINNERS.find(d => d.name === 'Indian Style Curry');
  const curryVar = curry.variants[1]; // Chicken, Small
  const parsed = {
    items: [
      { category: 'dinner', name: 'Indian Style Curry', variant: curryVar.label, qty: 1, requests: ['spice 3', 'no cilantro'] },
      { category: 'dinner', name: 'Gumbo', variant: 'Small (split order, ~3-6)', qty: 1, requests: ['make it spicy'] },
    ],
    serviceRequests: ['can you cut up some strawberries'],
    jarSwaps: 0, containerReturns: 0, notes: '', reviewReasons: [],
  };
  const v = validateParsedOrder(parsed, M);
  const vCurry = v.items.find(i => i.name === 'Indian Style Curry');
  if (!vCurry || !vCurry.options || vCurry.options.spice !== 3) F('router-e2e', `explicit spice not executed: ${JSON.stringify(vCurry)}`);
  if (!/no cilantro/.test(vCurry.note)) F('router-e2e', `generic request not attached as note: ${JSON.stringify(vCurry)}`);
  if (vCurry._requests) F('router-e2e', '_requests must be stripped before save');
  if (!(v.autoApplied && v.autoApplied.length === 2)) F('router-e2e', `expected 2 auto-applied, got ${JSON.stringify(v.autoApplied)}`);
  const pend = v.pendingActions || [];
  if (!pend.some(p => p.type === 'add-item-note' && p.tier2 === 'spice')) F('router-e2e', `tier-2 gumbo spice missing from pendingActions: ${JSON.stringify(pend)}`);
  if (!pend.some(p => p.type === 'custom-charge' && /strawberries/.test(p.label))) F('router-e2e', `service request must become a custom-charge action: ${JSON.stringify(pend)}`);
  if (v._serviceRequests) F('router-e2e', '_serviceRequests must be stripped');

  // Merge guard: same item twice, one carrying requests → NOT merged
  const parsed2 = {
    items: [
      { category: 'dinner', name: 'Mapo Eggplant', variant: 'Small (~5-6 servings)', qty: 1 },
      { category: 'dinner', name: 'Mapo Eggplant', variant: 'Small (~5-6 servings)', qty: 1, requests: ['extra sauce'] },
    ], jarSwaps: 0, containerReturns: 0, notes: '',
  };
  const v2 = validateParsedOrder(parsed2, M);
  if (v2.items.length !== 2) F('router-merge', `request-carrying duplicate must not merge: got ${v2.items.length} items`);

  // Qty range check flags, never mutates
  const v3 = validateParsedOrder({ items: [{ category: 'dinner', name: 'Gumbo', variant: 'Small (split order, ~3-6)', qty: 30 }], jarSwaps: 0, containerReturns: 0 }, M);
  if (v3.items[0].qty !== 30) F('qty-check', 'qty must not be mutated');
  if (!v3.reviewReasons.some(r => /Quantity looks off/.test(r))) F('qty-check', `huge qty must be flagged: ${JSON.stringify(v3.reviewReasons)}`);

  // ── diffOrders fixtures ──
  const before = { items: [
    { name: 'Gumbo', variant: 'Small (split order, ~3-6)', qty: 1 },
    { name: 'Chili', variant: 'Large (~6-8)', qty: 2, note: 'no beans' },
  ], jarSwaps: 0, containerReturns: 0, notes: '' };
  const after = { items: [
    { name: 'Gumbo', variant: 'Small (split order, ~3-6)', qty: 2 },
    { name: 'Bo Ssam', variant: 'Small (~4 servings)', qty: 1 },
  ], jarSwaps: 1, containerReturns: 0, notes: '' };
  const d = diffOrders(before, after);
  if (!(d.added.length === 1 && d.added[0].name === 'Bo Ssam')) F('diff', `added: ${JSON.stringify(d.added)}`);
  if (!(d.removed.length === 1 && d.removed[0].name === 'Chili')) F('diff', `removed: ${JSON.stringify(d.removed)}`);
  if (!(d.changed.length === 1 && /qty 1 → 2/.test(d.changed[0].deltas[0]))) F('diff', `changed: ${JSON.stringify(d.changed)}`);
  if (!(d.extras.length === 1 && /jar swaps 0 → 1/.test(d.extras[0]))) F('diff', `extras: ${JSON.stringify(d.extras)}`);
  const dSame = diffOrders(before, JSON.parse(JSON.stringify(before)));
  if (!dSame.isEmpty) F('diff', `identical orders must diff empty: ${JSON.stringify(dSame)}`);
  // options change surfaces
  const dOpt = diffOrders(
    { items: [{ name: 'Indian Style Curry', variant: 'Chicken, Small (~4-5)', qty: 1, options: { spice: 2 } }] },
    { items: [{ name: 'Indian Style Curry', variant: 'Chicken, Small (~4-5)', qty: 1, options: { spice: 5 } }] });
  if (!(dOpt.changed.length === 1 && /Spice 2 → Spice 5/.test(dOpt.changed[0].deltas[0]))) F('diff', `options delta: ${JSON.stringify(dOpt.changed)}`);
}

// ─── Receipt intelligence v3: name-size, sold-by-each, wine (Jul 6) ─────────
// Every fixture below is a REAL line from Kevin's photographed receipts.
{
  const SEED = INGREDIENT_SEED.map(i => ({ ...i, current: i.baseline }));
  const plan1 = buildReviewPlan({ store: 'H-E-B', lines: [
    // The milk that started it all: FW flag, no weight, line total only.
    { raw_text: '', item_name: 'HEB WHOLE MILK', quantity: null, unit: null, line_total: 3.70, unit_price_printed: null, tax_flag: 'FW', weighed: true },
    // Butter: QTR in the name = 1 lb box = 4 sticks.
    { raw_text: '', item_name: 'HEB SI UNSALTD BUTTER QTR', quantity: null, unit: null, line_total: 3.98, unit_price_printed: null, tax_flag: 'F', weighed: false },
    // Tortillas: the count is IN THE NAME.
    { raw_text: '', item_name: '10 CT FLOUR TORTILLA SCAN', quantity: null, unit: null, line_total: 1.98, unit_price_printed: null, tax_flag: 'F', weighed: false },
    { raw_text: '', item_name: '20 CT FLOUR TORTILLA SCAN', quantity: null, unit: null, line_total: 3.96, unit_price_printed: null, tax_flag: 'F', weighed: false },
    // Sold-by-each despite the FW flag: cilantro, cantaloupe, fennel, bulb onions.
    { raw_text: '', item_name: 'CILANTRO', quantity: null, unit: null, line_total: 0.45, unit_price_printed: null, tax_flag: 'F', weighed: true },
    { raw_text: '', item_name: 'PECOS CANTALOUPES', quantity: null, unit: null, line_total: 3.48, unit_price_printed: null, tax_flag: 'FW', weighed: true },
    { raw_text: '', item_name: 'ANISE FENNEL', quantity: null, unit: null, line_total: 3.98, unit_price_printed: null, tax_flag: 'F', weighed: true },
    { raw_text: '', item_name: 'SWEET BULB ONIONS', quantity: null, unit: null, line_total: 1.97, unit_price_printed: null, tax_flag: 'FW', weighed: true },
    // Ground lamb: Kevin's 1-lb-package rule.
    { raw_text: '', item_name: 'HEB NATURAL LAMB GROUND B', quantity: null, unit: null, line_total: 12.99, unit_price_printed: null, tax_flag: 'F', weighed: false },
    // Pork butt maps straight to pork_butt via seed.
    { raw_text: '', item_name: 'BOSTON BUTT PORK ROAST', quantity: null, unit: null, line_total: 11.45, unit_price_printed: null, tax_flag: 'F', weighed: false },
    // Wine by producer name (ROUGE), 2 bottles at printed each-price.
    { raw_text: '', item_name: 'LA VIEILLE FERME ROUGE SS', quantity: 2, unit: 'ea', line_total: 16.14, unit_price_printed: 8.07, tax_flag: 'T', weighed: false },
    // H-Mart misspelled kabocha, weighed WITH rate — the good path, plus alias.
    { raw_text: '', item_name: 'KABUCHA', quantity: 2.81, unit: 'lb', line_total: 4.19, unit_price_printed: 1.49, tax_flag: 'F', weighed: true },
    // Garlic 5-piece pack: count in name (also covered by the old override).
    { raw_text: '', item_name: 'GARLIC PK 5PC', quantity: null, unit: null, line_total: 2.99, unit_price_printed: null, tax_flag: 'F', weighed: false },
    // Baby gold potatoes: Kevin's corrected 1.5 lb bag.
    { raw_text: '', item_name: 'BAGGED BABY GOLD POTATOES', quantity: null, unit: null, line_total: 2.99, unit_price_printed: null, tax_flag: 'FW', weighed: true },
  ] }, SEED, {});
  const all1 = [...plan1.buckets.matched, ...plan1.buckets.review, ...plan1.buckets.needsConversion, ...plan1.buckets.needsPrice, ...plan1.buckets.unmatched];
  const find = (name) => all1.find(g => g.line.item_name === name);
  const matchedAs = (name, id) => { const g = find(name); return g && g.status === 'matched' && g.ingredientId === id ? g : null; };

  // THE MILK: matched to milk, gallon rule applied, $3.70/16 = $0.231/cup, zero prompts.
  const milk = matchedAs('HEB WHOLE MILK', 'milk');
  if (!milk) F('rcpt-v3', `milk not auto-matched: ${JSON.stringify(find('HEB WHOLE MILK'))}`);
  else if (Math.abs(milk.perUnit - 0.231) > 0.002 || milk.basis !== 'converted') F('rcpt-v3', `milk gallon conversion wrong: ${JSON.stringify({ perUnit: milk.perUnit, basis: milk.basis })}`);

  // BUTTER: QTR → 1 lb → 4 sticks → $0.995/stick, auto.
  const butter = matchedAs('HEB SI UNSALTD BUTTER QTR', 'butter');
  if (!butter) F('rcpt-v3', `butter not auto-matched: ${JSON.stringify(find('HEB SI UNSALTD BUTTER QTR'))}`);
  else if (Math.abs(butter.perUnit - 0.995) > 0.002) F('rcpt-v3', `butter QTR conversion wrong: got ${butter.perUnit}/stick`);

  // TORTILLAS: 10 CT = $1.98/10ct exactly; 20 CT = $1.98/10ct too (half of 3.96).
  const t10 = matchedAs('10 CT FLOUR TORTILLA SCAN', 'tortillas');
  if (!t10 || Math.abs(t10.perUnit - 1.98) > 0.001 || t10.conversion?.basis !== 'name_size') F('rcpt-v3', `10ct tortillas: ${JSON.stringify(t10 && { perUnit: t10.perUnit, conv: t10.conversion })}`);
  const t20 = matchedAs('20 CT FLOUR TORTILLA SCAN', 'tortillas');
  if (!t20 || Math.abs(t20.perUnit - 1.98) > 0.001) F('rcpt-v3', `20ct tortillas must halve: ${JSON.stringify(t20 && t20.perUnit)}`);

  // SOLD-BY-EACH: cilantro $0.45/bunch auto (no 'confirm one bunch' friction).
  const cil = matchedAs('CILANTRO', 'cilantro');
  if (!cil || cil.perUnit !== 0.45 || cil.basis !== 'converted' || cil.conversion?.basis !== 'sold_by_each') F('rcpt-v3', `cilantro sold-by-each: ${JSON.stringify(cil && { perUnit: cil.perUnit, basis: cil.basis, conv: cil.conversion })}`);
  const cant = matchedAs('PECOS CANTALOUPES', 'cantaloupe');
  if (!cant || cant.perUnit !== 3.48) F('rcpt-v3', `cantaloupe by-each: ${JSON.stringify(cant && cant.perUnit)}`);
  const fen = matchedAs('ANISE FENNEL', 'fennel_bulb');
  if (!fen || fen.perUnit !== 3.98) F('rcpt-v3', `fennel by-each: ${JSON.stringify(fen && fen.perUnit)}`);
  const bulb = matchedAs('SWEET BULB ONIONS', 'bulb_onion');
  if (!bulb || bulb.perUnit !== 1.97) F('rcpt-v3', `bulb onions by-each (per bunch): ${JSON.stringify(bulb && bulb.perUnit)}`);

  // GROUND LAMB: 1 lb package rule → $12.99/lb exactly.
  const lamb = matchedAs('HEB NATURAL LAMB GROUND B', 'ground_lamb');
  if (!lamb || Math.abs(lamb.perUnit - 12.99) > 0.001) F('rcpt-v3', `ground lamb 1lb rule: ${JSON.stringify(lamb && lamb.perUnit)}`);

  // PORK BUTT: seeded straight to pork_butt.
  if (!matchedAs('BOSTON BUTT PORK ROAST', 'pork_butt')) F('rcpt-v3', `boston butt: ${JSON.stringify(find('BOSTON BUTT PORK ROAST'))}`);

  // WINE: ROUGE → red_wine, bottle → 3.17 cups; $8.07/3.17 = $2.546/cup.
  const rouge = matchedAs('LA VIEILLE FERME ROUGE SS', 'red_wine');
  if (!rouge) F('rcpt-v3', `rouge → red_wine: ${JSON.stringify(find('LA VIEILLE FERME ROUGE SS'))}`);
  else if (Math.abs(rouge.perUnit - 2.546) > 0.005) F('rcpt-v3', `rouge bottle→cup: ${rouge.perUnit}`);

  // KABUCHA: alias fixes the misspelling; weighed-with-rate = $1.49/lb.
  const kab = matchedAs('KABUCHA', 'kabocha');
  if (!kab || kab.perUnit !== 1.49) F('rcpt-v3', `kabucha: ${JSON.stringify(kab && kab.perUnit)}`);

  // GARLIC 5PC: $2.99/5 = $0.598/head.
  const gar = matchedAs('GARLIC PK 5PC', 'garlic');
  if (!gar || Math.abs(gar.perUnit - 0.598) > 0.002) F('rcpt-v3', `garlic 5pc: ${JSON.stringify(gar && gar.perUnit)}`);

  // POTATOES: corrected 1.5 lb bag → $2.99/1.5 = $1.993/lb.
  const pot = matchedAs('BAGGED BABY GOLD POTATOES', 'baby_gold_potatoes');
  if (!pot || Math.abs(pot.perUnit - 1.993) > 0.002) F('rcpt-v3', `potatoes 1.5lb bag: ${JSON.stringify(pot && pot.perUnit)}`);

  // Pure-function spot checks
  const ns = extractNameSizes('POTATO BABY MEDLEY 1.5LB');
  if (!ns.some(s => s.unit === 'lb' && s.qty === 1.5)) F('rcpt-v3', `name-size 1.5LB: ${JSON.stringify(ns)}`);
  if (!extractNameSizes('HEB 1 GALLON WHOLE MILK').some(s => s.unit === 'gallon' && s.qty === 1)) F('rcpt-v3', 'name-size gallon');
  if (countBaseOf('10ct') !== 10 || countBaseOf('each') !== 1 || countBaseOf('lb') !== null) F('rcpt-v3', 'countBaseOf');
  if (wineHint('SAUVIGNON BLANC 750ML') !== 'white_wine') F('rcpt-v3', 'sauvignon blanc → white');
  if (wineHint('CHATEAU ROUGE BLANC MIX') !== 'both') F('rcpt-v3', 'both-hit must return both (→ review)');
  if (wineHint('KOSHER SALT') !== null) F('rcpt-v3', 'non-wine must not hint');
}

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
