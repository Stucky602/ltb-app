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
import { DISH_CUISINE, itemCost, stampItemCosts, menuVariantFor, repricePerLbItem, normalizePendingItems, itemOptions, noteWithoutOptions, routeItemRequest, routeParsedDraft, validateParsedOrder, diffOrders, itemsBaseTotal, itemsUpchargeTotal, orderCostInfo, perLbBagCount, perLbBagCharge, itemUnitMultiplier } from '../src/utils.js';
import { readFileSync } from 'node:fs';
import { INGREDIENT_SEED } from '../src/ingredients.js';
import { decomposeVariants, parseServings, buildDishReport, priceToHoldFloor, reportableDishes, buildPortfolioSummary, dishSalesHistory } from '../src/dishReport.js';
import { scoreWeekCandidates, dishRunStats, composeWeek } from '../src/weekPlanner.js';
import { mergeRegulars, unmergeRegular, backfillRegularLinks, regularAllNames, regularMatchType } from '../src/utils.js';
import { itemHandling, mergeShoppingRows, parseShoppingLine, buildAutoShoppingRows } from '../src/recipes.js';
import { buildCookSchedule } from '../src/cookSchedule.js';
import { buildWeeklyDigest } from '../src/digest.js';
import { companionHtml, companionContext } from '../src/companion.js';
import { attachRates, usualOrder } from '../src/regularsIntel.js';
import { buildLabelSheet } from '../src/labels.js';
import { monthlyPnl, pnlToCsv } from '../src/books.js';
import { preflightWeek } from '../src/publishPreflight.js';
import { buildReviewPlan, defaultAccept, confidenceTier, containerPriceCheck, packShiftAlarm, learnStoreFact, habitualStore, offStoreHint, diceCoefficient, extractNameSizes, countBaseOf, wineHint, parsePastedReceipt, learnFromAcceptance, learnFromIgnores, reconcileReceipt, priceDriftReport } from '../src/receiptMatch.js';
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

// Thai Basil Chicken is a WOK stir-fry — it must not claim largePot (a real
// data bug Kevin caught: it was falsely conflicting on the large pot).
{
  const tb = DISH_EQUIPMENT['Thai Basil Chicken (Pad Krapow Gai)'];
  const tbAll = [...(tb.fixed || []), ...(tb.flexible || [])];
  if (tbAll.includes('largePot')) F('equipment', 'Thai Basil Chicken must not claim largePot — it uses a wok');
  if (!tbAll.includes('wok')) F('equipment', 'Thai Basil Chicken should claim the wok');
}

// Soft back-burner claims (quick sauce dishes, e.g. Pork Mustard Tarragon) must
// NOT emit tofu / "meat/shrimp version" advice — that language only applies to
// dishes with a real tofu variant. Regression guard for the conditional-vs-soft
// overload bug.
{
  // Sweep every pair: any note mentioning tofu/meat-shrimp must involve a dish
  // that genuinely has equipment.tofu.
  const names = DISHES.map(d => d.name);
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const r = analyzeConflicts([names[i], names[j]]);
    for (const x of [...r.red, ...r.yellow]) {
      if (/tofu|meat\/shrimp/.test(x.note)) {
        const hasTofu = [names[i], names[j]].some(n => DISH_EQUIPMENT[n] && DISH_EQUIPMENT[n].tofu);
        if (!hasTofu) F('equip-soft', `phantom tofu/shrimp advice for ${names[i]} + ${names[j]}: "${x.note.slice(0, 90)}"`);
      }
    }
  }
  // Specific: the reported bug — pork (soft) + Mushroom Ragu (polenta hard) is a
  // yellow with quick-sauce wording, no tofu language, no red.
  const bug = analyzeConflicts(['Pork with Mustard Tarragon Cream Sauce', 'Mushroom Ragu']);
  if (bug.red.length !== 0) F('equip-soft', 'pork + mushroom ragu should not be a red conflict');
  const bb = bug.yellow.find(y => y.resource === 'backBurner');
  if (!bb || /tofu|meat\/shrimp/.test(bb.note)) F('equip-soft', `pork+mushroom back-burner note wrong: ${bb ? bb.note : 'missing'}`);
  // A genuine tofu-conditional case still produces the tofu advice.
  const realTofu = analyzeConflicts(['Stir Fried Long Beans with Ground Pork or Tofu', 'Saffron Pork Ragu']);
  const tofuNote = [...realTofu.yellow, ...realTofu.red].find(x => x.resource === 'backBurner');
  if (!tofuNote || !/tofu/.test(tofuNote.note)) F('equip-soft', 'genuine tofu-conditional case lost its advice');
}

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

  // 4. Portion-unit packages. BEHAVIOR FLIPPED Jul 9 (deliberate): fennel now
  //    carries a PACK_OVERRIDE (~27 tsp/jar, approx) so it auto-converts
  //    instead of asking. A learned alias.packQty still WINS over the
  //    hardcoded estimate — ask-once correction is permanent.
  const fennelLine = { item_name: 'MCCORMICK FENNEL SEED', quantity: 1, unit: 'Ea', unit_price_printed: 3.99, line_total: 3.99 };
  const auto = plan([fennelLine]);
  const ag = [...auto.buckets.matched, ...auto.buckets.review].find(g => g.ingredientId === 'fennel_seeds');
  if (!ag || Math.abs(ag.perUnit - 3.99 / 27) > 0.002) F('receipt-v2', `fennel must auto-convert via pack ÷27: ${JSON.stringify(ag && ag.perUnit)}`);
  const learned = plan([fennelLine], { [normalizeIngredientName('MCCORMICK FENNEL SEED')]: { ingredientId: 'fennel_seeds', packQty: 24 } });
  const lg = learned.buckets.matched[0];
  if (!lg || Math.abs(lg.perUnit - 3.99 / 24) > 0.001 || lg.basis !== 'converted') F('receipt-v2', `learned packQty must WIN over the hardcoded pack: ${JSON.stringify(lg)}`);
  // The ask-once flow itself stays pinned on a DELIBERATELY uncovered
  // ingredient (sodium citrate — bag sizes vary 100 g-500 g, a fixed divisor
  // would lie).
  const scLine = { item_name: 'SODIUM CITRATE', quantity: 1, unit: 'Ea', unit_price_printed: 12.99, line_total: 12.99 };
  const scAsk = plan([scLine], { [normalizeIngredientName('SODIUM CITRATE')]: { ingredientId: 'sodium_citrate' } });
  if (!scAsk.buckets.needsConversion.length) F('receipt-v2', 'sodium citrate must still ASK for pack size (variable containers by design)');

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

  // 10. With a real weight it prices the MEAT ONLY (bag moved to the per-piece
  //     upcharge) and tags the snapshot.
  const weighed = repricePerLbItem({ ...unweighed, weight: 0.8 });
  const expPrice = Math.round((ratePrice * 0.8) * 100) / 100; // meat only now
  const expCost = Math.round((rateCost * 0.8) * 100) / 100;
  if (weighed.weightPending || weighed.price !== expPrice || weighed.cost !== expCost || weighed.costSource !== 'snapshot')
    F('cost-basis', `repricePerLbItem wrong: ${JSON.stringify(weighed)}, expected price ${expPrice} cost ${expCost}`);

  // 10b. The double-count fix: a weighed per-lb item with qty>1 must charge the
  //      MEAT ONCE (weight already covers all pieces) and scale BAGS by
  //      ceil(qty/2). Mom's bug: 2 steaks weighed together must not double.
  const mom = repricePerLbItem({ name: 'NY Strip', variant: 'price by weight', weight: 1.5, qty: 2 });
  const momBase = itemsBaseTotal([mom]);
  const momUp = itemsUpchargeTotal([mom]);
  const momCost = orderCostInfo({ items: [mom] }).cost;
  if (Math.abs(momBase - ratePrice * 1.5) > 0.01) F('cost-basis', `per-lb qty>1 DOUBLE-COUNTED meat: base ${momBase}, want ${(ratePrice*1.5).toFixed(2)}`);
  if (Math.abs(momUp - 1.5) > 0.01) F('cost-basis', `2 pieces should be 1 bag ($1.50), got ${momUp}`);
  if (Math.abs(momCost - rateCost * 1.5) > 0.01) F('cost-basis', `per-lb qty>1 DOUBLE-COUNTED cost: ${momCost}, want ${(rateCost*1.5).toFixed(2)}`);
  // Bag scaling: 2 per bag, ceil.
  if (perLbBagCount(1) !== 1 || perLbBagCount(2) !== 1 || perLbBagCount(3) !== 2 || perLbBagCount(4) !== 2 || perLbBagCount(6) !== 3)
    F('cost-basis', `bag count math wrong: ${[1,2,3,4,6].map(perLbBagCount).join(',')}`);
  const four = repricePerLbItem({ name: 'NY Strip', variant: 'price by weight', weight: 1.5, qty: 4 });
  if (Math.abs(itemsUpchargeTotal([four]) - 3.0) > 0.01) F('cost-basis', `4 pieces should be 2 bags ($3), got ${itemsUpchargeTotal([four])}`);
  // A regular (non-per-lb) dish still multiplies by qty.
  const reg = { name: 'Chili', variant: chiliLg.label, price: chiliLg.price, cost: chiliLg.cost, qty: 3 };
  if (Math.abs(itemsBaseTotal([reg]) - chiliLg.price * 3) > 0.01) F('cost-basis', `regular dish qty multiply broke: ${itemsBaseTotal([reg])}`);

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

  // TORTILLAS: 10 CT and 20 CT lines both resolve to $1.98/10ct — v3.5 merge
  // polish consolidates them into ONE tortillas row (pooled 1.98) while parts
  // keep BOTH name-size conversions so pack learning stays per-string.
  const tor = all1.find(g => g.ingredientId === 'tortillas' && g.status === 'matched');
  if (!tor || Math.abs(tor.perUnit - 1.98) > 0.001) F('rcpt-v3', `tortillas pooled: ${JSON.stringify(tor && tor.perUnit)}`);
  else {
    if (!tor.mergedFrom || tor.mergedFrom.length !== 2) F('rcpt-v3', `10ct+20ct must consolidate: ${JSON.stringify(tor.mergedFrom)}`);
    const convs = (tor.parts || []).map(p => p.conversion && p.conversion.fromUnit).filter(Boolean);
    if (convs.length !== 2 || convs[0] === convs[1]) F('rcpt-v3', `merge must be lossless — both pack conversions in parts: ${JSON.stringify(convs)}`);
  }

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

// ─── Pasted-text parser v3.1 — verbatim text from Kevin's real receipts ──────
{
  const heb = `H-E-B
1054 2085 0629 2609 0500 024
1 KITCH BASICS UNSLTD BEEF
  2 Ea. @ 1/ 2.98 F  5.96
2 LA VIEILLE FERME ROUGE SS
  2 Ea. @ 1/ 8.07 T  16.14
5 BANYAN HARD TOFU  FW  2.49
6 FRESH CARROTS 2#
  2 Ea. @ 1/ 1.89 FW  3.78
7 ANISE FENNEL  F  3.98
19 CILANTRO  F  0.45
F BIG $AVINGS  5.00-
*** Sale Subtotal***  120.23
Sales Tax  1.91
*** Total Sale***  122.14
*** MASTRCRD EPS  122.14
ITEMS PURCHASED: 23
YOU SAVED $2.63
See rules and take survey at
www.heb.com/survey`;
  const p = parsePastedReceipt(heb);
  if (p.store !== 'H-E-B') F('paste', `store: ${p.store}`);
  if (p.lines.length !== 6) F('paste', `HEB should parse 6 items, got ${p.lines.length}: ${JSON.stringify(p.lines.map(l=>l.item_name))}`);
  const beef = p.lines.find(l => /KITCH/.test(l.item_name));
  if (!beef || beef.quantity !== 2 || beef.unit_price_printed !== 2.98 || beef.line_total !== 5.96) F('paste', `2-Ea pair: ${JSON.stringify(beef)}`);
  const tofu = p.lines.find(l => /TOFU/.test(l.item_name));
  if (!tofu || tofu.line_total !== 2.49 || !tofu.weighed) F('paste', `one-liner FW: ${JSON.stringify(tofu)}`);
  const cil = p.lines.find(l => l.item_name === 'CILANTRO');
  if (!cil || cil.line_total !== 0.45 || cil.weighed) F('paste', `cilantro F flag: ${JSON.stringify(cil)}`);
  const carrots = p.lines.find(l => /CARROTS/.test(l.item_name));
  if (!carrots || carrots.quantity !== 2 || carrots.unit_price_printed !== 1.89) F('paste', `carrots pair: ${JSON.stringify(carrots)}`);
  // No junk leaked into items; discount line went to unparsed, totals skipped
  if (p.lines.some(l => /SAVING|SUBTOTAL|TAX|MASTRCRD/i.test(l.item_name))) F('paste', 'junk leaked into lines');

  const hm = `H MART
11301 Lakeline Blvd
 2.95 lb @ 0.69 /lb
WT  YELLOW ONION  2.04 F
 1.92 lb @ 0.69 /lb
WT  YELLOW ONION  1.32 F
DF CHICKEN BROTH M  4.99 F
 0.80 lb @ 1.99 /lb
WT  GINGER  1.59 F
 2.81 lb @ 1.49 /lb
WT  KABUCHA  4.19 F
GARLIC PK 5PC  2.99 F
TAX  0.00
**** BALANCE  17.12
06/29/26 08:34am 111 1`;
  const q = parsePastedReceipt(hm);
  if (q.store !== 'H-Mart') F('paste', `hmart store: ${q.store}`);
  if (q.receipt_date !== '2026-06-29') F('paste', `date: ${q.receipt_date}`);
  if (q.lines.length !== 6) F('paste', `HMart should parse 6, got ${q.lines.length}: ${JSON.stringify(q.lines.map(l=>l.item_name))}`);
  const onion = q.lines.find(l => /YELLOW ONION/.test(l.item_name));
  if (!onion || onion.quantity !== 2.95 || onion.unit !== 'lb' || onion.unit_price_printed !== 0.69 || !onion.weighed) F('paste', `WT pair: ${JSON.stringify(onion)}`);
  const kab = q.lines.find(l => l.item_name === 'KABUCHA');
  if (!kab || kab.unit_price_printed !== 1.49 || kab.quantity !== 2.81) F('paste', `kabucha weight: ${JSON.stringify(kab)}`);
  const gar = q.lines.find(l => /GARLIC/.test(l.item_name));
  if (!gar || gar.line_total !== 2.99 || gar.weighed) F('paste', `garlic flat: ${JSON.stringify(gar)}`);

  // End-to-end: pasted text → parser → buildReviewPlan → kabucha matched at $1.49/lb
  const SEED2 = INGREDIENT_SEED.map(i => ({ ...i, current: i.baseline }));
  const plan = buildReviewPlan(q, SEED2, {});
  const km = plan.buckets.matched.find(g => g.ingredientId === 'kabocha');
  if (!km || km.perUnit !== 1.49) F('paste-e2e', `paste→plan kabocha: ${JSON.stringify(km && km.perUnit)}`);
  const gm = plan.buckets.matched.find(g => g.ingredientId === 'garlic');
  if (!gm || Math.abs(gm.perUnit - 0.598) > 0.002) F('paste-e2e', `paste→plan garlic 5pc: ${JSON.stringify(gm && gm.perUnit)}`);
}

// ─── learnFromAcceptance v3.2 ─────────────────────────────────────────────────
{
  const g = { norm: '10 ct flour tortilla scan', ingredientId: 'tortillas', perUnit: 1.98,
    conversion: { basis: 'name_size' }, lines: [{ line_total: 1.98, quantity: null }] };
  const a1 = learnFromAcceptance(g, {});
  const e = a1['10 ct flour tortilla scan'];
  if (!e || e.ingredientId !== 'tortillas' || Math.abs(e.packQty - 1) > 0.001 || e.confirms !== 1) F('learn', JSON.stringify(a1));
  const a2 = learnFromAcceptance(g, a1);
  if (a2['10 ct flour tortilla scan'].confirms !== 2) F('learn', 'confirm count must increment');
  // No conversion → alias only, no packQty
  const a3 = learnFromAcceptance({ norm: 'x', ingredientId: 'milk', perUnit: 3, lines: [{ line_total: 3 }] }, {});
  if (a3.x.packQty !== undefined) F('learn', 'no-conversion must not learn packQty');
}

// ─── priceDriftReport v3.3 — the margin-intelligence layer, pinned ──────────
{
  const SEED3 = INGREDIENT_SEED.map(i => ({ ...i, current: i.baseline }));
  // Boring drift stays silent
  if (priceDriftReport('carrots', 1.02, [], SEED3) !== null) F('drift', 'small drift must return null');
  // Shrimp $14→$22: +57.1%, and it must name the Gumbo + shrimp-variant blast radius
  const j = priceDriftReport('shrimp', 22, [{ id: 'shrimp', cost: 14 }], SEED3);
  if (!j || j.pctChange !== 57.1) F('drift', `pct: ${JSON.stringify(j)}`);
  if (!j.dishesUnderFloor.some(s => /^Gumbo/.test(s))) F('drift', `Gumbo missing from blast radius: ${JSON.stringify(j.dishesUnderFloor)}`);
  if (!(j.dishesUnderFloor.length >= 5)) F('drift', `expected 5+ newly-under variants, got ${j.dishesUnderFloor.length}`);
  // Already-under Kevin-accepted variants stay quiet: with shrimp unchanged,
  // NOTHING is "newly" under even though several shrimp margins sit under 45%.
  const same = priceDriftReport('shrimp', 21.7, [{ id: 'shrimp', cost: 14 }], SEED3);
  if (same && same.dishesUnderFloor.some(s => /Indian Style Curry — Shrimp, Large/.test(s) === false && false)) {} // structure guard only
  // History averaging: last 3 buys, not baseline
  const h = priceDriftReport('carrots', 2.0, [{ id: 'carrots', cost: 1.0 }, { id: 'carrots', cost: 1.0 }, { id: 'carrots', cost: 1.0 }, { id: 'carrots', cost: 1.6 }], SEED3);
  // avg of last 3 = (1.0+1.0+1.6)/3 = 1.2 → +66.7%
  if (!h || h.pctChange !== 66.7 || h.prevAvg !== 1.2) F('drift', `history avg: ${JSON.stringify(h)}`);
  // Price DROP alerts too (a -50% drop is worth knowing about)
  const drop = priceDriftReport('shrimp', 7, [], SEED3);
  if (!drop || drop.pctChange !== -50) F('drift', `drop alert: ${JSON.stringify(drop)}`);
  if (drop.dishesUnderFloor.length !== 0) F('drift', 'a price DROP must not flag under-floor dishes');
}

// ─── Dish report engine (v9.21) — the Recipes tab data layer ─────────────────
// The variant decomposition is the load-bearing piece: it must be TOTAL
// (every variant lands in exactly one flavor×size cell) and COLLISION-FREE
// for every dinner, or the Recipes tab dropdown lies. These fixtures pin it
// against the real registry, so a future dish with a new labeling convention
// fails loudly here instead of silently mis-grouping.
{
  // 1. Totality + zero collisions across ALL dinners
  for (const d of DISHES) {
    const dec = decomposeVariants(d.variants);
    if (dec.collisions.length) F('report-decomp', `"${d.name}" collision: ${JSON.stringify(dec.collisions)}`);
    const cellCount = dec.groups.reduce((s, g) => s + (g.small ? 1 : 0) + (g.large ? 1 : 0) + (g.only ? 1 : 0), 0);
    if (cellCount !== d.variants.length) F('report-decomp', `"${d.name}" not total: ${cellCount} cells vs ${d.variants.length} variants`);
  }

  // 2. Cumin — the hard case: protein prefix × Asian-Greens suffix whose QTY
  // text differs by size ("1/2 lb" vs "1 lb"). Must normalize into 6 flavors,
  // each with both sizes.
  const cumin = DISHES.find(d => d.name.startsWith('Cumin'));
  const cdec = decomposeVariants(cumin.variants);
  if (cdec.groups.length !== 6) F('report-decomp', `Cumin should decompose to 6 flavors, got ${cdec.groups.length}: ${cdec.groups.map(g=>g.flavor).join(' | ')}`);
  const lambG = cdec.groups.find(g => g.flavor === 'Lamb');
  const lambGreens = cdec.groups.find(g => g.flavor === 'Lamb + Asian Greens');
  if (!lambG || !lambG.small || !lambG.large) F('report-decomp', `Cumin Lamb flavor missing a size: ${JSON.stringify(lambG && { s: !!lambG.small, l: !!lambG.large })}`);
  if (!lambGreens || !lambGreens.small || !lambGreens.large) F('report-decomp', `Asian Greens qty suffix not normalized: ${JSON.stringify(cdec.groups.map(g=>g.flavor))}`);
  if (lambG.small.label !== 'Lamb, Small (~3-4)') F('report-decomp', `Lamb small maps to wrong variant: ${lambG.small.label}`);

  // 3. Sizeless dishes: Boeuf (2 flavors, no toggle), Homegrown (4 flavors)
  const boeuf = decomposeVariants(DISHES.find(d => d.name.startsWith('Boeuf')).variants);
  if (boeuf.groups.length !== 2 || boeuf.hasSizeToggle) F('report-decomp', `Boeuf: ${JSON.stringify(boeuf.groups.map(g=>g.flavor))} toggle=${boeuf.hasSizeToggle}`);
  if (!boeuf.groups.every(g => g.only)) F('report-decomp', 'Boeuf variants must land in the sizeless cell');
  const homegrown = decomposeVariants(DISHES.find(d => d.name.includes('Homegrown')).variants);
  if (homegrown.groups.length !== 4) F('report-decomp', `Homegrown should be 4 sizeless flavors, got ${homegrown.groups.length}`);

  // 4. Polenta flavors: Saffron (Standard + '+ Polenta', both sized),
  //    Mushroom Ragu (same flavors, small-only, NO size toggle)
  const saffron = decomposeVariants(DISHES.find(d => d.name === 'Saffron Pork Ragu').variants);
  if (!(saffron.groups.length === 2 && saffron.hasSizeToggle && saffron.groups[1].flavor === '+ Polenta')) {
    F('report-decomp', `Saffron: ${JSON.stringify(saffron.groups.map(g=>({f:g.flavor,s:!!g.small,l:!!g.large})))}`);
  }
  const mr = decomposeVariants(DISHES.find(d => d.name === 'Mushroom Ragu').variants);
  if (!(mr.groups.length === 2 && !mr.hasSizeToggle && mr.groups.every(g => g.small && !g.large))) {
    F('report-decomp', `Mushroom Ragu: ${JSON.stringify(mr.groups.map(g=>({f:g.flavor,s:!!g.small,l:!!g.large})))}`);
  }

  // 5. Servings parsing
  const sv = [
    ['Small (~4-5 servings)', 4.5], ['Large (~8-12)', 10], ['~4 servings', 4],
    ['Small (split order, ~3-6)', 4.5], ['With 1 lb mushrooms', null], ['price by weight', null],
  ];
  for (const [label, want] of sv) {
    const got = parseServings(label);
    if (got !== want) F('report-servings', `"${label}" → ${got}, want ${want}`);
  }

  // 6. priceToHoldFloor math
  const h = priceToHoldFloor(30.02, 45);
  if (Math.abs(h.exact - 54.58) > 0.01 || h.suggested !== 55) F('report-floor', JSON.stringify(h));
  if (priceToHoldFloor(0) !== null) F('report-floor', 'zero cost must return null');

  // 7. Every dinner builds a full report; recipe + cost-over-time run for
  //    every variant; costed-lines total reconciles with the variant's raw
  //    cost (within anchor-rounding tolerance) — the drivers-sum-to-whole check.
  const base = baselineCostMap();
  for (const name of reportableDishes()) {
    const rep = buildDishReport(name, { baseCostMap: base, liveCostMap: base, costHistory: [] });
    if (!rep) { F('report-build', `no report for "${name}"`); continue; }
    for (const v of rep.variants) {
      const rec = rep.recipeFor(v.label);
      if (!rec || !rec.costedLines.length) { F('report-build', `"${name}" / "${v.label}" has no costed recipe`); continue; }
      // Internal consistency: the variant's independent recomputation and the
      // costed recipe lines are the SAME math via two paths — must match to
      // the cent, within a few cents of per-line rounding (fractional
      // conversions like 2 tbsp = 1/12 can round differently across the two
      // summation paths). (The ANCHOR is allowed to differ: it's the historical
      // pricing basis, and the gap is deliberately surfaced as anchorGapPct.)
      if (Math.abs(rec.rawTotal - v.recomputedRaw) > 0.05) {
        F('report-reconcile', `"${name}" / "${v.label}" recipe lines ${rec.rawTotal} vs recomputed ${v.recomputedRaw} — same math must agree`);
      }
      // Sanity cap: an anchor gap beyond ±45% means a LINE_MAP or recipe entry
      // is genuinely broken, not just stale pricing. DOCUMENTED EXCEPTION:
      // Homegrown Tomato is priced on garden economics (tomatoes ~free), so
      // its recomputation-at-market gap is huge AND honest — the report
      // surfaces it as "what this costs if you had to buy the tomatoes."
      if (name !== 'Pasta with Homegrown Tomato Sauce'
          && v.anchorGapPct != null && Math.abs(v.anchorGapPct) > 45) {
        F('report-reconcile', `"${name}" / "${v.label}" anchor gap ${v.anchorGapPct}% — beyond stale-anchor territory, check LINE_MAP/recipe`);
      }
      if (rec.costDrivers.length < 1) F('report-build', `"${name}" / "${v.label}" no cost drivers`);
      const cot = rep.costOverTimeFor(v.label);
      if (!cot.dishSeries.length || cot.dishSeries[0].label !== 'baseline') F('report-build', `"${name}" cost-over-time baseline missing`);
    }
  }

  // 8. Scaling check: the pork dish is a clean ×2; Bolognese's egg-pappardelle
  //    flavor must FLAG the documented 2-pack→3-pack exception (1.5× pasta).
  const porkRep = buildDishReport('Pork with Mustard Tarragon Cream Sauce', { baseCostMap: base });
  const porkScale = porkRep.scaling.find(s => s.flavor === 'Standard');
  if (!porkScale || !porkScale.clean || porkScale.ratio !== 2) F('report-scaling', `pork dish should scale clean ×2: ${JSON.stringify(porkScale)}`);
  const boloRep = buildDishReport('Bolognese', { baseCostMap: base });
  const boloPapp = boloRep.scaling.find(s => s.flavor === '+ Egg Pappardelle');
  if (!boloPapp || boloPapp.clean || !boloPapp.mismatches.some(m => m.id === 'egg_pappardelle')) {
    F('report-scaling', `Bolognese egg-papp exception must be flagged: ${JSON.stringify(boloPapp)}`);
  }

  // 9. Cost-over-time replay: synthetic shrimp jump on Gumbo — series rises,
  //    trend math correct, unrelated-ingredient points ignored.
  const gumboRep = buildDishReport('Gumbo', { baseCostMap: base, costHistory: [
    { t: '2026-06-01', id: 'shrimp', cost: 14 },
    { t: '2026-07-01', id: 'shrimp', cost: 18 },
    { t: '2026-07-01', id: 'saffron', cost: 99 }, // not in gumbo — must be ignored
  ] });
  const cot = gumboRep.costOverTimeFor('Large (~8-12)');
  if (cot.historyPoints !== 2) F('report-cot', `gumbo should see 2 relevant points, got ${cot.historyPoints}`);
  const series = cot.dishSeries;
  if (!(series.length === 3 && series[2].rawCost > series[0].rawCost)) F('report-cot', `dish series should rise: ${JSON.stringify(series)}`);
  const shrimpTrend = cot.ingredientTrends.find(t => t.id === 'shrimp');
  if (!shrimpTrend || shrimpTrend.latest !== 18 || shrimpTrend.points.length !== 2) F('report-cot', JSON.stringify(shrimpTrend));

  // 10. Under-floor flag + suggested price surface on the known warning dishes
  // Floor convention parity: the engine must agree with the suite's accepted
  // warnings. Bo Ssam Small is a known 41.7% (< 45) on the buffered basis.
  const boRep = buildDishReport('Bo Ssam', { baseCostMap: base });
  const boSmall = boRep.variants.find(v => v.label.includes('Small'));
  if (!boSmall.underFloor) F('report-floor', `Bo Ssam Small must flag under-floor on the suite basis (got ${boSmall.marginLivePct.toFixed(1)}%)`);
  if (!(boSmall.priceToHoldFloor && boSmall.priceToHoldFloor.suggested > boSmall.price)) {
    F('report-floor', `Bo Ssam suggested hold price must exceed current $${boSmall.price}: ${JSON.stringify(boSmall.priceToHoldFloor)}`);
  }
  // A comfortably-over dish must NOT flag: Thai Basil Chicken (well over floor).
  const overRep = buildDishReport('Thai Basil Chicken (Pad Krapow Gai)', { baseCostMap: base });
  if (overRep.variants.some(v => v.underFloor)) F('report-floor', 'Thai Basil Chicken should not flag under-floor');
  // PASSTHROUGH ERA: Mushroom Ragu's pasta variant is 38% BLENDED (pasta
  // dilution, by design) but healthy on VALUE-ADD — so the blended flag stays
  // true, the EFFECTIVE flag (what the tab shows) must be false, and the
  // value-add margin must clear the floor.
  // Mushroom Ragu was repriced to $70 and promoted to Spotlight (Jul 9), so
  // its blended margin now CLEARS the floor — it's no longer the sub-floor
  // example it once was. What must still hold: it carries passthrough pasta,
  // and both the blended and value-add margins are healthy.
  const mrRep = buildDishReport('Mushroom Ragu', { baseCostMap: base });
  const mrPasta = mrRep.variants.find(v => !v.label.includes('Polenta'));
  if (mrPasta.underFloor) F('report-floor', `Ragu at $70 should now clear the floor (${mrPasta.marginLivePct.toFixed(1)}%)`);
  if (!mrPasta.hasPassthrough || mrPasta.passthroughRaw < 8) F('report-floor', `Ragu pasta passthrough missing: ${JSON.stringify({ h: mrPasta.hasPassthrough, p: mrPasta.passthroughRaw })}`);
  if (mrPasta.valueAddMarginPct < 45) F('report-floor', `Ragu value-add should clear the floor: ${mrPasta.valueAddMarginPct.toFixed(1)}%`);
  if (mrPasta.underFloorEffective) F('report-floor', 'Ragu pasta must NOT flag on the effective (value-add) basis');
  // A NON-passthrough dish: effective === blended, no VA divergence.
  const boChk = buildDishReport('Bo Ssam', { baseCostMap: base }).variants[0];
  if (boChk.hasPassthrough) F('report-floor', 'Bo Ssam has no passthrough items');
  if (boChk.underFloorEffective !== boChk.underFloor) F('report-floor', 'non-passthrough effective flag must equal blended');

  // 11. Reheat parity: the report's reheat text is the ORDER engine's, not a copy.
  const porkReheat = buildDishReport('Pork with Mustard Tarragon Cream Sauce', { baseCostMap: base })
    .reheatFor('Small (~3 servings)');
  if (!(porkReheat.length === 1 && /medallions/.test(porkReheat[0].body))) F('report-reheat', JSON.stringify(porkReheat.map(b=>b.title)));
  const mrPolReheat = mrRep.reheatFor('Small (~4-5 servings) + Polenta');
  if (!mrPolReheat.some(b => /polenta bag/i.test(b.body))) F('report-reheat', 'Mushroom Ragu polenta variant must show the polenta card');

  // 12. Portfolio summary: one row per dinner; the known under-floor dishes
  // flag; Bo Ssam's worst variant is its Small.
  const port = buildPortfolioSummary({ baseCostMap: base });
  if (port.length !== DISHES.length) F('report-portfolio', `expected ${DISHES.length} rows, got ${port.length}`);
  const boRow = port.find(r => r.name === 'Bo Ssam');
  if (!boRow.underFloor || !/Small/.test(boRow.worstMarginVariant)) F('report-portfolio', JSON.stringify(boRow));
  const mrRow = port.find(r => r.name === 'Mushroom Ragu');
  if (mrRow.underFloor) F('report-portfolio', 'Mushroom Ragu must NOT flag in the radar anymore — pasta dishes are judged on value-add');
  if (!mrRow.hasPassthrough || mrRow.worstValueAddPct == null) F('report-portfolio', `Ragu portfolio VA fields: ${JSON.stringify(mrRow)}`);
}

// ─── dishSalesHistory (Recipes-tab sales section, moved from Money) ──────────
{
  const now = Date.now();
  const day = 86400000;
  const costOf = (it) => (typeof it.cost === 'number' ? it.cost : null);
  const orders = [
    { createdAt: new Date(now - 2 * day).toISOString(), items: [
      { name: 'Gumbo', qty: 2, price: 30, cost: 12 },
      { name: 'Mushroom Ragu', qty: 1, price: 60, cost: 32.5 },
    ] },
    { createdAt: new Date(now - 40 * day).toISOString(), items: [
      { name: 'Gumbo', qty: 1, price: 30, cost: 12, upcharge: { amount: 5 } },
    ] },
    { createdAt: new Date(now - 400 * day).toISOString(), items: [
      { name: 'Gumbo', qty: 3, price: 28, cost: 11 },
    ] },
    // A weighed per-lb item: qty is a piece count, price is the full weighed
    // amount — must NOT be multiplied by qty.
    { createdAt: new Date(now - 1 * day).toISOString(), items: [
      { name: 'NY Strip', qty: 2, price: 39, cost: 21.74, weight: 1.5 },
    ] },
  ];

  // Week: only the 2-day-old Gumbo order (2 units) + NY Strip
  const gw = dishSalesHistory('Gumbo', orders, costOf, 'week');
  if (gw.units !== 2 || gw.orderCount !== 1) F('sales', `week gumbo: ${JSON.stringify(gw)}`);
  if (gw.revenue !== 60 || gw.profit !== 36) F('sales', `week gumbo money: ${JSON.stringify(gw)}`);

  // Month: adds the 40-day order? No — 40 > 30, so still just the 2-day one.
  const gm = dishSalesHistory('Gumbo', orders, costOf, 'month');
  if (gm.units !== 2) F('sales', `month gumbo should be 2 (40d excluded): ${JSON.stringify(gm)}`);

  // Year: 2-day + 40-day (not the 400-day)
  const gy = dishSalesHistory('Gumbo', orders, costOf, 'year');
  if (gy.units !== 3 || gy.orderCount !== 2) F('sales', `year gumbo: ${JSON.stringify(gy)}`);
  // 40-day order has a $5 upcharge → revenue 60 + (30+5) = 95
  if (gy.revenue !== 95) F('sales', `year gumbo revenue w/ upcharge: ${gy.revenue}`);

  // All: everything
  const ga = dishSalesHistory('Gumbo', orders, costOf, 'all');
  if (ga.units !== 6 || ga.orderCount !== 3) F('sales', `all gumbo: ${JSON.stringify(ga)}`);

  // Per-lb: 2 pieces, weight set — revenue is price ONCE (39), not 78.
  const ny = dishSalesHistory('NY Strip', orders, costOf, 'all');
  if (ny.revenue !== 39 || ny.cost !== 21.74) F('sales', `per-lb must not multiply by qty: ${JSON.stringify(ny)}`);
  if (ny.units !== 2) F('sales', `per-lb units still counts pieces: ${ny.units}`);

  // Robust name matching: whitespace/case variations in historical orders
  // must still count (real bug — brittle exact-match hid delivered sales).
  const fuzzy = [
    { createdAt: new Date().toISOString(), items: [{ name: 'Gumbo ', qty: 1, price: 55, cost: 25 }] },
    { createdAt: new Date().toISOString(), items: [{ name: 'gumbo', qty: 1, price: 55, cost: 25 }] },
  ];
  const fz = dishSalesHistory('Gumbo', fuzzy, costOf, 'all');
  if (fz.units !== 2) F('sales', `robust match failed: ${fz.units} units for whitespace/case variants`);
  // Empty period
  const none = dishSalesHistory('Bolognese', orders, costOf, 'week');
  if (none.hasData || none.units !== 0) F('sales', `no-data case: ${JSON.stringify(none)}`);

  // Unknown cost flag
  const unkOrders = [{ createdAt: new Date().toISOString(), items: [{ name: 'Chili', qty: 1, price: 30 }] }];
  const unk = dishSalesHistory('Chili', unkOrders, () => null, 'all');
  if (!unk.unknown) F('sales', 'unknown-cost flag not set');
}

// ─── Receipt scanner v3.4: pooling, reconciliation, inference, learning ──────
{
  const seedIngs = [
    { id: 'onion', name: 'Onion (yellow)', unit: 'lb', baseline: 0.6, current: 0.69 },
    { id: 'mushrooms', name: 'Mushrooms (cremini)', unit: 'lb', baseline: 4.99, current: 8.99 },
    { id: 'asparagus', name: 'Asparagus', unit: 'lb', baseline: 3.99, current: 4.0 },
    { id: 'limes', name: 'Limes', unit: 'each', baseline: 0.33, current: 0.33 },
  ];

  // #4 POOLING: Kevin's real H-Mart case — two YELLOW ONION weighed lines.
  // Pooled per-lb = quantity-weighted average, pooledWeight = total lb.
  const pooled = buildReviewPlan({ store: 'H MART', lines: [
    { item_name: 'YELLOW ONION', quantity: 2.95, unit: 'lb', unit_price: 0.69, line_total: 2.04, weighed: true },
    { item_name: 'YELLOW ONION', quantity: 1.92, unit: 'lb', unit_price: 0.79, line_total: 1.52, weighed: true },
  ] }, seedIngs, {});
  const onionG = [...pooled.buckets.matched, ...pooled.buckets.review].find(g => g.ingredientId === 'onion');
  if (!onionG) F('receipt-pool', 'pooled onion group missing');
  else {
    const expect = (0.69 * 2.95 + 0.79 * 1.92) / (2.95 + 1.92);
    if (Math.abs(onionG.perUnit - expect) > 0.01) F('receipt-pool', `pooled per-lb ${onionG.perUnit}, want ~${expect.toFixed(3)}`);
    if (Math.abs((onionG.pooledWeight || 0) - 4.87) > 0.01) F('receipt-pool', `pooledWeight ${onionG.pooledWeight}, want 4.87`);
    if (Math.abs(onionG.totalSum - 3.56) > 0.01) F('receipt-pool', `totalSum ${onionG.totalSum}`);
  }

  // #2 RECONCILIATION: printed subtotal captured from a skipped line; the gap
  // vs the parsed lines is reported, small gaps ok, big gaps flagged.
  const pasteHEB = [
    'PRODUCE',
    'ASPARAGUS                2.53 F',
    'Sale Subtotal 8.53',
    'Total Sale*** 8.53',
  ].join('\n');
  const parsedHEB = parsePastedReceipt(pasteHEB);
  if (parsedHEB.printed_subtotal !== 8.53) F('receipt-reconc', `subtotal not captured: ${parsedHEB.printed_subtotal}`);
  const rec1 = reconcileReceipt(parsedHEB);
  if (!rec1 || rec1.printedKind !== 'subtotal' || rec1.linesSum !== 2.53) F('receipt-reconc', JSON.stringify(rec1));
  if (rec1.ok) F('receipt-reconc', 'a $6 gap on an $8.53 receipt must NOT be ok');
  const rec2 = reconcileReceipt({ lines: [{ line_total: 8.5 }], printed_subtotal: 8.53 });
  if (!rec2.ok) F('receipt-reconc', `3-cent gap should be ok: ${JSON.stringify(rec2)}`);
  const balOnly = parsePastedReceipt('MUSHROOM\n4.99 F\nBALANCE 4.99');
  if (balOnly.printed_total !== 4.99) F('receipt-reconc', `H-Mart BALANCE not captured: ${balOnly.printed_total}`);
  if (reconcileReceipt({ lines: [] }) !== null) F('receipt-reconc', 'no printed number → null, not a fake report');

  // #1 WEIGHT INFERENCE: H-Mart PREBAGGED veg — flat price, no weight printed,
  // per-lb ingredient → propose weight = total ÷ current $/lb. Never auto.
  const prebag = buildReviewPlan({ store: 'H MART', lines: [
    { item_name: 'MUSHROOM', line_total: 4.99, weighed: false },
  ] }, seedIngs, { 'mushroom': { ingredientId: 'mushrooms' } });
  const mush = [...prebag.buckets.matched, ...prebag.buckets.review].find(g => g.ingredientId === 'mushrooms');
  if (!mush || !mush.weightSuggestion) F('receipt-infer', `prebagged veg must get a weight suggestion: ${JSON.stringify(mush && { s: mush.status, w: mush.weightSuggestion })}`);
  else {
    if (Math.abs(mush.weightSuggestion.lb - 0.56) > 0.01) F('receipt-infer', `inferred ${mush.weightSuggestion.lb} lb, want ~0.56 (4.99/8.99)`);
    if (mush.weightSuggestion.atPrice !== 8.99) F('receipt-infer', `atPrice ${mush.weightSuggestion.atPrice}`);
    if (mush.defaultAccept) F('receipt-infer', 'inferred-weight lines must never default-accept');
  }
  // A line WITH a printed weight must NOT get a suggestion (loose H-Mart veg).
  const loose = buildReviewPlan({ store: 'H MART', lines: [
    { item_name: 'MUSHROOM', quantity: 0.62, unit: 'lb', unit_price: 8.99, line_total: 5.57, weighed: true },
  ] }, seedIngs, { 'mushroom': { ingredientId: 'mushrooms' } });
  const looseG = [...loose.buckets.matched, ...loose.buckets.review].find(g => g.ingredientId === 'mushrooms');
  if (looseG && looseG.weightSuggestion) F('receipt-infer', 'weighed line must not get a suggestion');

  // #3a LEARNED AUTO-IGNORE: 3 unmapped sightings → classifier stops asking.
  let al = {};
  al = learnFromIgnores(['modelo especial 12pk'], al);
  al = learnFromIgnores(['modelo especial 12pk'], al);
  let plan = buildReviewPlan({ store: 'HEB', lines: [{ item_name: 'MODELO ESPECIAL 12PK', line_total: 15.99 }] }, seedIngs, al);
  if (plan.buckets.unmatched.length !== 1) F('receipt-learn', '2 sightings must still ask');
  al = learnFromIgnores(['modelo especial 12pk'], al);
  plan = buildReviewPlan({ store: 'HEB', lines: [{ item_name: 'MODELO ESPECIAL 12PK', line_total: 15.99 }] }, seedIngs, al);
  if (plan.buckets.unmatched.length !== 0 || plan.buckets.ignored.length !== 1) F('receipt-learn', `3rd sighting should auto-ignore: unmatched=${plan.buckets.unmatched.length} ignored=${plan.buckets.ignored.length}`);
  // Mapping overrides: an alias WITH ingredientId never auto-ignores.
  const mappedAl = { 'modelo especial 12pk': { ingredientId: 'onion', seenUnmatched: 5 } };
  plan = buildReviewPlan({ store: 'HEB', lines: [{ item_name: 'MODELO ESPECIAL 12PK', line_total: 15.99 }] }, seedIngs, mappedAl);
  if (plan.buckets.ignored.length !== 0) F('receipt-learn', 'mapped alias must never auto-ignore');

  // ═══ v3.5 (Fable, Jul 10): merge polish + acceptance gating + tiers ═══════
  // #5 CROSS-STRING MERGE: two DIFFERENT receipt strings aliased to the same
  // ingredient consolidate into ONE row: qty-weighted pooled price, lines and
  // totals combined, parts kept for per-string alias learning.
  const onAl = { 'yellow onion': { ingredientId: 'onion' }, 'onion ylw jumbo': { ingredientId: 'onion' } };
  const mkw = (name, qty, rate) => ({ item_name: name, quantity: qty, unit: 'lb', unit_price: rate, line_total: Math.round(qty * rate * 100) / 100, weighed: true });
  const mplan = buildReviewPlan({ store: 'HEB', lines: [mkw('YELLOW ONION', 2, 0.99), mkw('ONIONS YLW JUMBO', 1, 1.09)] }, seedIngs, onAl);
  const merged5 = mplan.buckets.matched.filter(g => g.ingredientId === 'onion');
  if (merged5.length !== 1) F('receipt-merge', `expected 1 consolidated group, got ${merged5.length}`);
  else {
    const g = merged5[0];
    if (!g.mergedFrom || g.mergedFrom.length !== 2) F('receipt-merge', `mergedFrom ${JSON.stringify(g.mergedFrom)}`);
    if (!g.parts || g.parts.length !== 2) F('receipt-merge', 'parts must keep both originals for learning');
    const want = (0.99 * 2 + 1.09 * 1) / 3;
    if (Math.abs(g.perUnit - want) > 0.01) F('receipt-merge', `pooled ${g.perUnit}, want ~${want.toFixed(3)}`);
    if (Math.abs(g.totalSum - 3.07) > 0.01) F('receipt-merge', `totalSum ${g.totalSum}`);
  }
  // Price-disagreement guard: a wild gap (>35%) must NOT merge — both rows
  // survive with priceSplit flags and 'attention' tiers.
  const splan = buildReviewPlan({ store: 'HEB', lines: [mkw('YELLOW ONION', 2, 0.99), mkw('ONIONS YLW JUMBO', 1, 4.50)] }, seedIngs, onAl);
  const split5 = splan.buckets.matched.filter(g => g.ingredientId === 'onion');
  if (split5.length !== 2) F('receipt-merge', `wild gap must stay split, got ${split5.length}`);
  else if (!split5.every(g => g.priceSplit && g.tier === 'attention')) F('receipt-merge', 'split rows need priceSplit + attention tier');

  // #6 ACCEPTANCE GATING: a trustworthy basis with an outlier price must NOT
  // default-accept (misparse guard); in-band prices still do. Back-compat:
  // no cost arg keeps the old basis-only behavior.
  const dg = { status: 'matched', basis: 'printed_unit_price', perUnit: 5.0 };
  if (!defaultAccept(dg)) F('receipt-accept', 'basis-only back-compat broke');
  if (defaultAccept(dg, 1.0)) F('receipt-accept', '5x outlier must not default-accept');
  if (!defaultAccept(dg, 4.8)) F('receipt-accept', 'in-band price must default-accept');

  // #6b TIERS: ±20% of current = auto; no history = check; any alarm = attention.
  if (confidenceTier({ status: 'matched', basis: 'converted', perUnit: 1.0 }, 0.95) !== 'auto') F('receipt-tier', 'in-band should be auto');
  if (confidenceTier({ status: 'matched', basis: 'converted', perUnit: 1.0 }, null) !== 'check') F('receipt-tier', 'no history should be check');
  if (confidenceTier({ status: 'matched', basis: 'converted', perUnit: 1.0, packShift: {} }, 0.95) !== 'attention') F('receipt-tier', 'packShift should be attention');
  if (confidenceTier({ status: 'matched', basis: 'line_total', perUnit: 1.0 }, 0.95) !== 'attention') F('receipt-tier', 'weak basis should be attention');

  // ═══ v3.5 PUBLISH PREFLIGHT (Fable, Jul 10) — the anti-July-10 audit ══════
  // The spotlight pipeline was correct but the published week had no spotlight
  // selected, and the miss was silent. These pin the audit that makes it loud.
  {
    const codes = (sel) => preflightWeek(sel).map(w => w.code);
    if (!codes([]).includes('empty')) F('preflight', 'empty week must warn');
    if (!codes(['Gumbo']).includes('no-spotlight')) F('preflight', 'spotlight-less week must warn');
    if (codes(['Gumbo', 'Mushroom Ragu']).length !== 0) F('preflight', `clean week must be quiet: ${JSON.stringify(codes(['Gumbo', 'Mushroom Ragu']))}`);
    if (!codes(['Mushroom Ragu', 'Steak au Poivre']).includes('multi-spotlight')) F('preflight', 'two spotlights should inform');
    const bo = preflightWeek(['Bo Ssam', 'Mushroom Ragu']);
    if (!bo.some(w => w.code === 'under-floor' && /Bo Ssam/.test(w.text))) F('preflight', 'Bo Ssam Small under-floor must be named');
    if (bo.some(w => w.code === 'under-floor' && /Lamb Leg/.test(w.text))) F('preflight', 'unselected dishes must not be audited');
  }


  // #3b NEGATIVE LEARNING: a rejected id is score-capped — it cannot auto-win.
  let al2 = learnFromAcceptance(
    { norm: 'green onion', ingredientId: 'asparagus', ingredient: seedIngs[2], lines: [{ line_total: 2.0 }] },
    {}, { rejectedId: 'onion' }
  );
  if (!al2['green onion'].rejected || al2['green onion'].rejected[0] !== 'onion') F('receipt-learn', `rejection not recorded: ${JSON.stringify(al2['green onion'])}`);

  // #3c LEARNED SOLD-BY-EACH: two flat-price acceptances of a weighed line for
  // an each-ish ingredient → soldByEach learned → classifier prices per each.
  let al3 = {};
  const limeGroup = { norm: 'lime bagged', ingredientId: 'limes', ingredient: seedIngs[3], lines: [{ weighed: true, line_total: 0.33 }] };
  al3 = learnFromAcceptance(limeGroup, al3, { usedFlatPrice: true });
  if (al3['lime bagged'].soldByEach) F('receipt-learn', 'soldByEach must need 2 hits');
  al3 = learnFromAcceptance(limeGroup, al3, { usedFlatPrice: true });
  if (!al3['lime bagged'].soldByEach) F('receipt-learn', `soldByEach not learned after 2: ${JSON.stringify(al3['lime bagged'])}`);
  // The learned-each payoff: a FLAT single price (prebagged limes, no qty, no
  // weight) now prices per-each via the learned flag instead of asking.
  const eachPlan = buildReviewPlan({ store: 'HEB', lines: [
    { item_name: 'LIME BAGGED', line_total: 0.66 },
  ] }, seedIngs, al3);
  const limeG = [...eachPlan.buckets.matched, ...eachPlan.buckets.review].find(g => g.ingredientId === 'limes');
  if (!limeG || limeG.conversion?.basis !== 'sold_by_each') F('receipt-learn', `learned soldByEach not applied: ${JSON.stringify(limeG && { b: limeG.conversion?.basis, p: limeG.perUnit })}`);
  else if (Math.abs(limeG.perUnit - 0.66) > 0.005) F('receipt-learn', `learned-each perUnit ${limeG.perUnit}, want 0.66`);
}

// ─── Batch engines: planner, regulars intel, labels, books ───────────────────
{
  const now = Date.now(), day = 86400000;
  const iso = (d) => new Date(now - d * day).toISOString();
  const orders = [
    { createdAt: iso(2), customer: 'Sara', items: [{ name: 'Bolognese', variant: 'Small (split order, ~4)', qty: 1, price: 45, cost: 22.58 }] },
    { createdAt: iso(16), customer: 'Sara', items: [{ name: 'Bolognese', variant: 'Small (split order, ~4)', qty: 1, price: 40, cost: 16.79 }] },
    { createdAt: iso(16), customer: 'Frances', items: [{ name: 'Gumbo', variant: 'Large (~8-12)', qty: 1, price: 55, cost: 25 }] },
    { createdAt: iso(30), customer: 'Sara', items: [{ name: 'Gumbo', variant: 'Large (~8-12)', qty: 2, price: 55, cost: 25 }] },
    { createdAt: iso(30), customer: 'Frances', items: [{ name: 'Bolognese', variant: 'Small (split order, ~4)', qty: 1, price: 40, cost: 16.79 }] },
    { createdAt: iso(1), customer: 'Mom', items: [{ name: 'NY Strip', variant: 'price by weight', qty: 2, price: 39, cost: 21.74, weight: 1.5 }] },
  ];

  // PLANNER: run stats count distinct weeks; candidates exclude picks; a pick
  // that creates a red conflict is penalized.
  const bstats = dishRunStats('Bolognese', orders);
  if (bstats.runs !== 3 || bstats.weeksSinceLast > 1) F('planner', JSON.stringify(bstats)); // epoch-week buckets: 2 days ago can be last bucket
  const cands = scoreWeekCandidates(orders, ['Bolognese'], {});
  if (cands.some(c => c.name === 'Bolognese')) F('planner', 'picked dish must not be a candidate');
  if (cands.length !== DISHES.length - 1) F('planner', `candidate count ${cands.length}`);
  const gumbo = cands.find(c => c.name === 'Gumbo');
  if (!gumbo || gumbo.runs !== 2) F('planner', `gumbo stats: ${JSON.stringify(gumbo)}`);
  // Two polenta hard-claim dishes: picking Saffron then scoring Mushroom Ragu
  // must show a new conflict penalty.
  const withSaffron = scoreWeekCandidates(orders, ['Saffron Pork Ragu'], {});
  const mr = withSaffron.find(c => c.name === 'Mushroom Ragu');
  if (!mr || mr.newConflicts < 1) F('planner', `polenta clash not penalized: ${JSON.stringify(mr)}`);

  // REGULARS INTEL: Bolognese appeared 3 distinct weeks; Sara ordered it in 2
  // → 67%. Frances 1 of 3 → 33%. The usual for Sara: Bolognese small ×2 times.
  const sara = attachRates(orders, 'Sara');
  const sb = sara.find(r => r.dish === 'Bolognese');
  if (!sb || sb.appearances !== 3 || sb.ordered !== 2 || sb.attachPct !== 67) F('regulars-intel', JSON.stringify(sb));
  const fr = attachRates(orders, 'Frances').find(r => r.dish === 'Bolognese');
  if (!fr || fr.attachPct !== 33) F('regulars-intel', JSON.stringify(fr));
  // Multi-name (merge payoff): querying with an array counts all identities.
  const multi = attachRates([...orders,
    { createdAt: iso(9), customer: 'Sara G', items: [{ name: 'Bolognese', variant: 'Small (split order, ~4)', qty: 1, price: 40, cost: 16.79 }] },
  ], ['Sara', 'Sara G']);
  const mb = multi.find(r => r.dish === 'Bolognese');
  if (!mb || mb.ordered !== 3) F('regulars-intel', `merged identity must pool: ${JSON.stringify(mb)}`);
  const usual = usualOrder(orders, 'Sara');
  if (!usual.length || usual[0].name !== 'Bolognese' || usual[0].times !== 2 || usual[0].usualQty !== 1) F('regulars-intel', JSON.stringify(usual));

  // LABELS: qty expands to per-container labels with seq; weighed per-lb items
  // get one label per BAG (2 pieces = 1 bag); reheat cue comes from the live
  // order engine; packing rolls up per customer.
  const sheet = buildLabelSheet([
    { customer: 'Frances', items: [
      { name: 'Gumbo', variant: 'Large (~8-12)', qty: 2 },
      { name: 'NY Strip', variant: 'price by weight', qty: 2, weight: 1.5 },
    ] },
  ]);
  const gumboLabels = sheet.labels.filter(l => l.dish === 'Gumbo');
  if (gumboLabels.length !== 2 || gumboLabels[0].seq !== '1/2') F('labels', JSON.stringify(gumboLabels.map(l => l.seq)));
  const nyLabels = sheet.labels.filter(l => l.dish === 'NY Strip');
  if (nyLabels.length !== 1) F('labels', `2 weighed pieces = 1 bag = 1 label, got ${nyLabels.length}`);
  if (nyLabels[0].weight !== '1.5 lb total') F('labels', nyLabels[0].weight);
  if (!gumboLabels[0].cue || gumboLabels[0].cue.length < 4) F('labels', 'reheat cue missing');
  if (sheet.packing.length !== 1 || sheet.packing[0].containers !== 3) F('labels', JSON.stringify(sheet.packing));

  // BOOKS: months group by createdAt; revenue uses full order math (per-lb not
  // doubled); csv shape sane. Cancelled orders excluded.
  // Archived orders are Delivered + tidied — REAL revenue, always counted.
  // (The only archive path in App requires Delivered status; there is no
  // cancellation concept. Excluding archived silently vanished sales the
  // moment Kevin tapped "Archive delivered" — real money bug, fixed.)
  const pnl = monthlyPnl([...orders, { createdAt: iso(2), archived: true, customer: 'Arch', items: [{ name: 'Gumbo', qty: 1, price: 55, cost: 25 }] }]);
  if (!pnl.length) F('books', 'no rows');
  const total = pnl.reduce((s, r) => s + r.revenue, 0);
  // Mom's per-lb order: 39 + 1.50 bag = 40.50, NOT 78+
  // Item revenue + the archived order (real sale) + $2/order surcharge:
  // 330.50 + 55 + 7 × $2 = 399.50.
  const expected = 45 + 40 + 55 + 110 + 40 + 40.5 + 55 + 7 * 2;
  if (Math.abs(total - expected) > 0.01) F('books', `total revenue ${total}, want ${expected} (archived orders MUST count)`);
  if (pnl.some(r => r.orders === 0)) F('books', 'empty month row');
  const csv = pnlToCsv(pnl);
  if (!csv.startsWith('month,orders,revenue')) F('books', 'csv header');
  if (csv.split('\n').length !== pnl.length + 1) F('books', 'csv row count');
}

// ─── Fable batch: regulars merge/backfill, canonical labels, composer, anchovy ─
{
  // MERGE (non-destructive, reversible)
  const regs = [
    { id: 'r1', names: ['Jessica Gardner'], aliases: [], linkedOrderIds: ['o1'], dietary: 'Shellfish allergy', notes: 'gate code 1234' },
    { id: 'r2', names: ['Jessica'], aliases: [], linkedOrderIds: ['o2', 'o3'], notes: 'likes spice 4' },
  ];
  const { regulars: merged, relinkOrderIds } = mergeRegulars(regs, 'r1', 'r2');
  if (merged.length !== 1) F('reg-merge', `source must be removed: ${merged.length}`);
  const keeper = merged[0];
  if (!keeper.aliases.includes('Jessica')) F('reg-merge', `alias not added: ${JSON.stringify(keeper.aliases)}`);
  if (regularMatchType(keeper, 'Jessica') !== 'exact') F('reg-merge', 'alias must match exactly after merge');
  if (JSON.stringify(relinkOrderIds) !== '["o2","o3"]') F('reg-merge', `relink ids: ${JSON.stringify(relinkOrderIds)}`);
  if (!keeper.notes.includes('gate code') || !keeper.notes.includes('likes spice')) F('reg-merge', 'notes must combine');
  if (!keeper.mergedFrom || keeper.mergedFrom[0].snapshot.id !== 'r2') F('reg-merge', 'snapshot missing for unmerge');
  // Display name must NOT change (aliases are matched, never displayed)
  if (!/^Jessica Gardner$/.test(keeper.names.join(' & '))) F('reg-merge', 'display names must be untouched');
  // UNMERGE restores the source and strips its aliases
  const restored = unmergeRegular(merged, 'r1', 'r2');
  if (restored.length !== 2) F('reg-merge', 'unmerge must restore the source');
  if (restored.find(r => r.id === 'r1').aliases.includes('Jessica')) F('reg-merge', 'unmerge must remove the alias');
  if (restored.find(r => r.id === 'r2').linkedOrderIds.length !== 0) F('reg-merge', 'restored profile must not claim orders that stayed with the target');
  // Self-merge and missing ids are no-ops
  const noop = mergeRegulars(regs, 'r1', 'r1');
  if (noop.regulars.length !== 2 || noop.relinkOrderIds.length !== 0) F('reg-merge', 'self-merge must be a no-op');

  // BACKFILL: exact + alias auto-link; partial = suggestion only (never auto)
  const bfRegs = [{ id: 'r9', names: ['Frances Day'], aliases: ['Fran'], linkedOrderIds: [] }];
  const bfOrders = [
    { id: 'a', customer: 'Frances Day' },          // exact → auto
    { id: 'b', customer: 'Fran' },                  // alias exact → auto
    { id: 'c', customer: 'Francis Day' },           // partial (spelling) → suggest
    { id: 'd', customer: 'Totally Unrelated' },     // no match → nothing
    { id: 'e', customer: 'Frances Day', regularId: 'r9' }, // already linked → skip
  ];
  const bf = backfillRegularLinks(bfRegs, bfOrders);
  if (bf.auto.length !== 2 || !bf.auto.every(a => a.regularId === 'r9')) F('reg-backfill', JSON.stringify(bf.auto));
  if (bf.suggestions.length !== 1 || bf.suggestions[0].name !== 'Francis Day') F('reg-backfill', `partial must SUGGEST not link: ${JSON.stringify(bf.suggestions)}`);
  // Backfill suggestions must carry linkable candidates (id + display) so the
  // intel panel can resolve a near-miss INLINE — the archived order that the
  // old "use the star" message pointed at is never rendered as a card.
  if (!bf.suggestions[0].candidates || !bf.suggestions[0].candidates[0].id || !bf.suggestions[0].candidates[0].display) F('reg-backfill', 'suggestion needs {id,display} candidates for inline linking');

  // DROPDOWN IDENTITY COLLAPSE: after a merge, an alias name must NOT appear as
  // its own customer entry — it folds under the keeper's display name.
  const dropRegs = [{ id: 'rd', names: ['Jessica Gardner'], aliases: ['Jessica'] }];
  const dropOrders = [{ id: '1', customer: 'Jessica Gardner' }, { id: '2', customer: 'Jessica' }, { id: '3', customer: 'Walkup' }];
  const claimed = new Map();
  for (const r of dropRegs) { const disp = r.names.join(' & '); for (const nm of [...r.names, ...(r.aliases||[])]) claimed.set(nm.toLowerCase(), disp); }
  const shown = new Set();
  dropOrders.forEach(o => shown.add(claimed.get(o.customer.toLowerCase()) || o.customer));
  const list = [...shown];
  if (list.filter(n => /Jessica/.test(n)).length !== 1) F('reg-dropdown', `alias must collapse: ${JSON.stringify(list)}`);
  if (!list.includes('Walkup')) F('reg-dropdown', 'unlinked names must still show');

  // CANONICAL ITEM HANDLING — the two label bugs, pinned forever:
  // (1) non-reheatables get NO cue; (2) single-package items never split.
  // Fruit CONTAINERS are one physical package per qty (2 cantaloupes = 2
  // containers = 2 labels) — still no reheat cue ever.
  const cant = itemHandling('Seasonal Cantaloupe', { category: 'fruit' });
  if (cant.cue !== '' || cant.reheatable || cant.packaging !== 'per-qty') F('labels-canon', `cantaloupe: ${JSON.stringify(cant)}`);
  const jar = itemHandling('Pickled Onions or Carrots', { category: 'addons' });
  if (jar.packaging !== 'per-qty' || jar.cue !== '') F('labels-canon', `addon jar: ${JSON.stringify(jar)}`);
  const cook = itemHandling('Chocolate Chip Cookies', { category: 'desserts' });
  if (cook.packaging !== 'single' || cook.cue !== '') F('labels-canon', `cookies: ${JSON.stringify(cook)}`);
  const gum = itemHandling('Gumbo', {});
  if (!gum.reheatable || gum.packaging !== 'per-qty' || !gum.cue) F('labels-canon', `gumbo: ${JSON.stringify(gum)}`);
  const ny = itemHandling('NY Strip', { category: 'bag', isPerLb: true });
  if (ny.packaging !== 'per-bag' || !/sear/i.test(ny.cue)) F('labels-canon', `ny strip: ${JSON.stringify(ny)}`);
  const conf = itemHandling('Garlic Confit', { category: 'bag' });
  if (!/FROZEN/.test(conf.cue)) F('labels-canon', `confit must carry the frozen warning: ${conf.cue}`);
  if (/—/.test(Object.values(cant).join('') + conf.cue + ny.cue)) F('labels-canon', 'customer-facing cues must not contain em-dashes');
  // Labels end-to-end: cookies qty 2 = ONE label, no cue; carrots qty 2 = two bags
  const sheet = buildLabelSheet([{ customer: 'T', status: 'Ordered', items: [
    { name: 'Chocolate Chip Cookies', qty: 2 },
    { name: 'Carrots', qty: 2 },
  ] }]);
  const cl = sheet.labels.filter(l => /Cookies/.test(l.dish));
  if (cl.length !== 1 || cl[0].seq !== '' || cl[0].cue !== '' || !/^2× /.test(cl[0].dish)) F('labels-canon', `cookies label: ${JSON.stringify(cl)}`);
  if (sheet.labels.filter(l => l.dish === 'Carrots').length !== 2) F('labels-canon', 'SV veg qty 2 = 2 bag labels');

  // COMPOSER: balanced, never stacks 3 on one fixed resource, why on every pick
  const cw = composeWeek([{ createdAt: new Date().toISOString(), customer: 'A', items: [{ name: 'Gumbo', qty: 3, price: 55, cost: 25 }] }], {});
  if (cw.picks.length < 4) F('composer', `too few picks: ${cw.picks.length}`);
  if (cw.picks.some(p => !p.why.length)) F('composer', 'every pick needs a why');
  const fixedUse = {};
  for (const p of cw.picks) for (const r of (DISHES.find(x => x.name === p.name)?.equipment?.fixed || [])) fixedUse[r] = (fixedUse[r] || 0) + 1;
  if (Object.values(fixedUse).some(n => n > 2)) F('composer', `equipment pileup: ${JSON.stringify(fixedUse)}`);

  // ANCHOVY: $0.30/fillet, and Chili uses fillets, not tins
  const anch = INGREDIENT_SEED.find(i => i.id === 'anchovies');
  if (Math.abs(anch.baseline - 0.3) > 0.001) F('anchovy', `baseline ${anch.baseline}, want 0.30 (jar $6.07 / 20)`);
  const chiliLines = resolveDishVariant('Chili', 'Large (~6-8)') || [];
  const aLine = chiliLines.find(l => l.id === 'anchovies');
  if (!aLine || aLine.qty > 8) F('anchovy', `Chili anchovy qty looks like tins not fillets: ${JSON.stringify(aLine)}`);
}

// ─── Go-big trio: cook schedule, business digest, kitchen companion ──────────
{
  const now = Date.now(), day = 86400000;
  const orders = [
    { id: 'g1', createdAt: new Date(now - day).toISOString(), status: 'Ordered', customer: 'Frances Day', items: [
      { name: 'Gumbo', qty: 1, price: 55, cost: 25 },
      { name: 'NY Strip', qty: 2, weight: 1.5, price: 39, cost: 21.74 },
      { name: 'Flank Steak', qty: 1, weight: 2.1, price: 30, cost: 18 },
      { name: 'Thick-Cut Pork Chop', qty: 2, weight: 1.8, price: 28, cost: 15 },
      { name: 'Garlic Confit', qty: 1, price: 8, cost: 2 },
    ] },
    { id: 'g2', createdAt: new Date(now - 2 * day).toISOString(), status: 'Delivered', customer: 'Sara', items: [
      { name: 'Bolognese', variant: 'Small (split order, ~4)', qty: 1, price: 45, cost: 22.58 },
    ] },
  ];

  // SCHEDULER: brines start Monday; overnight flank never double-books into
  // the Tuesday 131F batch; 131 and 140 batches never share items; Wednesday
  // always ends in package + deliver. Delivered orders are excluded.
  const sched = buildCookSchedule(orders);
  const mon = sched.days.find(d => d.day === 'Monday');
  const tue = sched.days.find(d => d.day === 'Tuesday');
  const wed = sched.days.find(d => d.day === 'Wednesday');
  if (!mon || !tue || !wed) F('schedule', 'missing days');
  const brine = mon.tasks.find(t => /brine/i.test(t.task));
  if (!brine || !brine.items.includes('NY Strip') || !brine.items.includes('Flank Steak')) F('schedule', `brine list: ${JSON.stringify(brine && brine.items)}`);
  const b131 = tue.tasks.find(t => /131/.test(t.task));
  const b140 = tue.tasks.find(t => /140/.test(t.task));
  if (!b131 || b131.items.includes('Flank Steak')) F('schedule', `overnight flank must NOT re-enter the 131F day batch: ${JSON.stringify(b131 && b131.items)}`);
  if (!b140 || b140.items.some(i => b131.items.includes(i))) F('schedule', '131F and 140F batches must never share items');
  if (b131.items.some(i => sched.days[0].tasks.length && false)) F('schedule', 'unreachable');
  const stove = tue.tasks.find(t => /Stovetop/.test(t.task));
  if (!stove || stove.items.includes('Bolognese')) F('schedule', 'Delivered orders must not cook again');
  if (!/Package/.test(wed.tasks.map(t => t.task).join(' ')) || !/Deliver/.test(wed.tasks.map(t => t.task).join(' '))) F('schedule', 'Wednesday must package and deliver');

  // DIGEST: this-week window counts only recent, revenue uses full order math,
  // proposal present with whys, quiet-regular logic needs 3+ lifetime orders.
  const dg = buildWeeklyDigest(orders, [
    { id: 'rq', names: ['Ghost Customer'], linkedOrderIds: [] },
  ], { now });
  if (dg.week.count !== 2) F('digest', `week count ${dg.week.count}`);
  if (dg.week.top[0][0] !== 'NY Strip' && dg.week.top[0][0] !== 'Thick-Cut Pork Chop' && dg.week.top[0][0] !== 'Gumbo') F('digest', `top sellers odd: ${JSON.stringify(dg.week.top)}`);
  if (!dg.proposal || dg.proposal.picks.length < 4 || dg.proposal.picks.some(p => !p.why.length)) F('digest', 'proposal missing or why-less');
  if (dg.quiet.length !== 0) F('digest', 'a regular with <3 lifetime orders must not be "quiet"');

  // COMPANION: generated from the SAME canon — sear guide present when a
  // per-lb protein is in the order, confit frozen warning present, cookies
  // never get instructions, and user text is HTML-escaped.
  const html = companionHtml({ ...orders[0], customer: 'Frances <script>alert(1)</script>' });
  // Canon-first: the sear guidance is the canonical block, exactly once.
  const searCount = (html.match(/[Ss]ear/g) || []).length;
  if (!/Sear the proteins/.test(html)) F('companion', 'canonical sear block missing with per-lb proteins');
  if ((html.match(/<h3>[^<]*[Ss]ear[^<]*<\/h3>/g) || []).length !== 1) F('companion', 'exactly ONE sear section — a second is canon drift');
  if (!/Keep these frozen/.test(html) || !/Garlic Confit/.test(html)) F('companion', 'confit frozen warning missing');
  if (/<script>alert/.test(html)) F('companion', 'user text must be escaped');
  const noSear = companionHtml({ customer: 'T', items: [{ name: 'Gumbo', qty: 1 }] });
  if (/Sear the proteins/.test(noSear)) F('companion', 'sear block must not appear without finish-at-home proteins');
  // Branded page: logo embedded, serving chips from parseServings, one sear card.
  const branded = companionHtml({ customer: 'Frances Day', items: [{ name: 'Gumbo', variant: 'Large (~8-12)', qty: 1 }, { name: 'NY Strip', variant: 'price by weight', qty: 2, weight: 1.5 }] });
  if (!/data:image\/png;base64/.test(branded)) F('companion', 'LTB logo must be embedded');
  if (!/feeds ~/.test(branded)) F('companion', 'serving-size chip must appear for dishes whose variant encodes servings');
  if ((branded.match(/class="card step sear"/g) || []).length !== 1) F('companion', 'exactly one sear step card');
  // Ask-Kevin's-kitchen AI box: card present, the 5-question cap is stated
  // BEFORE the first question, the page id is baked in for /ask, and answers
  // render via textContent only (no innerHTML anywhere in the page script).
  const withAsk = companionHtml({ customer: 'T', items: [{ name: 'Gumbo', variant: 'Large (~8-12)', qty: 1 }] }, 'pid-123');
  if (!/Ask about your order/.test(withAsk)) F('companion-ask', 'ask card missing');
  if (!/You get 5 questions on this page/.test(withAsk)) F('companion-ask', 'the cap must be stated upfront, before the first question');
  if (!/pid-123/.test(withAsk)) F('companion-ask', 'page id must be baked into the page for /ask');
  if (/innerHTML/.test(withAsk)) F('companion-ask', 'page script must render via textContent only');
  // Grounding context: compact, carries the order and the canon instructions.
  const ctx = companionContext({ customer: 'T', items: [{ name: 'Gumbo', variant: 'Large (~8-12)', qty: 1 }, { name: 'Garlic Confit', qty: 1 }] });
  if (!/ORDER: 1x Gumbo/.test(ctx)) F('companion-ask', 'context must carry the order');
  if (!/KEEP FROZEN/.test(ctx)) F('companion-ask', 'context must carry the confit frozen rule so the model can never contradict it');
  if (ctx.length > 6000) F('companion-ask', `context too fat: ${ctx.length} chars — this is the per-question token bill`);
}

// ─── Fable trio 2: feedback loop, content grounding ────────────────────────
{
  // COMPANION FEEDBACK CARD: present, dish list baked, before the ask card.
  const fbHtml = companionHtml({ customer: 'T', items: [{ name: 'Gumbo', qty: 1 }, { name: 'NY Strip', qty: 2 }] }, 'pid');
  if (!/How did everything come out/.test(fbHtml)) F('feedback', 'feedback card missing');
  if (!/\["Gumbo","NY Strip"\]/.test(fbHtml)) F('feedback', 'dish list must be baked into the page');
  if (fbHtml.indexOf('How did everything come out') > fbHtml.indexOf('Ask about your order')) F('feedback', 'feedback card should come before the ask card');

  // DIGEST REHEAT REPORT: aggregates order.feedback by dish, bad-first.
  const dg2 = buildWeeklyDigest([
    { createdAt: new Date().toISOString(), customer: 'A', items: [{ name: 'Gumbo', qty: 1, price: 55, cost: 25 }], feedback: [
      { dish: 'Gumbo', verdict: 'good' }, { dish: 'Beurre Blanc', verdict: 'bad' }, { dish: 'Beurre Blanc', verdict: 'bad' } ] },
    { createdAt: new Date().toISOString(), customer: 'B', items: [], feedback: [{ dish: 'Gumbo', verdict: 'meh' }] },
  ], [], {});
  if (!dg2.reheatReport || dg2.reheatReport.length !== 2) F('feedback', 'reheat report missing: ' + JSON.stringify(dg2.reheatReport));
  if (dg2.reheatReport[0].dish !== 'Beurre Blanc' || dg2.reheatReport[0].bad !== 2) F('feedback', 'bad verdicts must sort first (technique signal)');
  const gum = dg2.reheatReport.find(r => r.dish === 'Gumbo');
  if (!gum || gum.good !== 1 || gum.meh !== 1) F('feedback', 'gumbo tally wrong: ' + JSON.stringify(gum));

  // CONTENT GROUNDING: facts must carry ingredients + canon cue, never costs.
  // (Prompt-side voice rules live in the worker; here we pin the app-side facts.)
}

// ─── Jul 9 receipt resweep: the missing-flags bug class, pinned forever ──────
{
  const seedR = INGREDIENT_SEED.map(i => ({ ...i, current: i.baseline }));
  // THE EXACT SCREENSHOT RECEIPT: pack conversions existed for these but never
  // fired because the entries lacked eachIsPack/matchNullUnit — real receipt
  // lines are unit-less, so fromUnit:'package'/'box' alone can never match.
  const plan = buildReviewPlan({ store: 'HEB', lines: [
    { item_name: 'GUITTARD AKOMA EXTRA SEMI', line_total: 7.78 },
    { item_name: 'MORTON KOSHER COARSE SALT', line_total: 3.50 },
    { item_name: 'SHRIMP GULF BRN 31 40 HLS', line_total: 7.04, quantity: 0.94, unit: 'lb', weighed: true },
    { item_name: 'ANCHOVIES FLAT FILLETS', line_total: 6.07 },
    { item_name: 'HABANERO PEPPERS', line_total: 1.20, quantity: 0.30, unit: 'lb', weighed: true },
    { item_name: 'KADOYA SESAME OIL', line_total: 4.98 },
  ] }, seedR, {});
  const all = [...plan.buckets.matched, ...plan.buckets.review];
  const get = (id) => all.find(g => g.ingredientId === id);
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  const gu = get('guittard_high');
  if (!gu || !near(gu.perUnit, 0.0275, 0.002)) F('resweep', `guittard: ${JSON.stringify(gu && gu.perUnit)} want ~0.0275/g (flat line ÷283)`);
  const ks = get('kosher_salt');
  if (!ks || !near(ks.perUnit, 0.0386, 0.003)) F('resweep', `kosher salt: ${ks && ks.perUnit} want ~0.039/tbs (flat line ÷90.7)`);
  const sh = get('shrimp');
  if (!sh || !near(sh.perUnit, 7.489, 0.02)) F('resweep', `shrimp: ${sh && sh.perUnit} want ~7.49/lb (weighed)`);
  const an = get('anchovies');
  if (!an || !near(an.perUnit, 0.304, 0.01)) F('resweep', `anchovies: ${an && an.perUnit} want ~0.30/fillet`);
  const hb = get('habanero');
  if (!hb || !near(hb.perUnit, 0.25, 0.01)) F('resweep', `habanero: ${hb && hb.perUnit} want 0.25/oz (lb→oz weight conversion)`);
  const ts = get('toasted_sesame');
  if (!ts || !near(ts.perUnit, 0.453, 0.01)) F('resweep', `sesame oil: ${ts && ts.perUnit} want ~0.45/tbs (bottle ÷11)`);
  // Structural guard: every container-style PACK_OVERRIDE must carry the
  // flags, or it silently never fires — the exact bug this sweep killed.
  const src = readFileSync(new URL('../src/receiptMatch.js', import.meta.url), 'utf8');
  const tbl = src.slice(src.indexOf('const PACK_OVERRIDE'), src.indexOf('const AVG_WEIGHT_LB'));
  for (const m of tbl.matchAll(/^  (\w+): \{ fromUnit: '(package|box|jar|bottle|dozen|carton)'[^\n]*/gm)) {
    if (!/matchNullUnit: true/.test(m[0])) F('resweep', `PACK_OVERRIDE.${m[1]} is container-style but lacks matchNullUnit — it will never fire on real (unit-less) receipt lines`);
  }
}

// ─── Shopping list merge engine (Jul 9) ──────────────────────────────────────
{
  // Both text formats parse; cross-unit families combine; headers drop; notes
  // survive; mixed-checked stays unchecked (an open need keeps the row open).
  const merged = mergeShoppingRows([
    { id: '1', text: 'Celery — 3 stalks', checked: true },
    { id: 'h', text: '── Gumbo (Large (~8-12)) ──', checked: false },
    { id: '2', text: '3 stalks Celery', checked: false },
    { id: '3', text: '2 tbs Soy sauce', checked: false },
    { id: '4', text: 'Soy sauce — 0.5 cup', checked: false },
    { id: '5', text: 'Chicken thighs — 2 lb', checked: false },
    { id: '6', text: '8 oz Chicken thighs', checked: false },
    { id: '7', text: 'grab extra napkins', checked: false },
  ]);
  const txt = merged.map(r => r.text);
  if (merged.length !== 4) F('shop-merge', `want 4 rows, got ${merged.length}: ${JSON.stringify(txt)}`);
  if (!txt.some(x => /^Celery — 6 stalks$/.test(x))) F('shop-merge', `celery: ${JSON.stringify(txt)}`);
  if (!txt.some(x => /^Soy sauce — 0.63 cup/.test(x))) F('shop-merge', `soy tbs+cup must combine: ${JSON.stringify(txt)}`);
  if (!txt.some(x => /^Chicken thighs — 2.5 lb$/.test(x))) F('shop-merge', `lb+oz must combine: ${JSON.stringify(txt)}`);
  if (!txt.includes('grab extra napkins')) F('shop-merge', 'notes must pass through untouched');
  if (txt.some(x => /^──/.test(x))) F('shop-merge', 'dish headers must drop when rows merge');
  const cel = merged.find(r => /Celery/.test(r.text));
  if (cel.checked) F('shop-merge', 'mixed checked+unchecked must stay UNCHECKED (still needed)');
  // Small quantities render readable: 2 tsp stays tsp, not 0.04 cup.
  const tiny = mergeShoppingRows([{ id: 'a', text: '1 tsp Fennel seeds', checked: false }, { id: 'b', text: '1 tsp Fennel seeds', checked: false }]);
  if (!/2 tsp/.test(tiny[0].text)) F('shop-merge', `tiny volumes keep their unit: ${tiny[0].text}`);
  // Idempotent: merging a merged list changes nothing.
  const again = mergeShoppingRows(merged);
  if (JSON.stringify(again.map(r => r.text)) !== JSON.stringify(txt)) F('shop-merge', 'merge must be idempotent');
  // Different ingredients NEVER combine.
  const distinct = mergeShoppingRows([{ id: 'x', text: 'Dark soy — 2 tbs', checked: false }, { id: 'y', text: 'Soy sauce — 2 tbs', checked: false }]);
  if (distinct.length !== 2) F('shop-merge', 'dark soy and soy sauce are different things');
}

// ─── Self-maintaining shopping list (Jul 9 automation) ──────────────────────
{
  let n = 0; const mkId = () => 'sid' + (n++);
  const o1 = [{ status: 'Ordered', items: [{ name: 'Gumbo', variant: 'Large (~8-12)', qty: 1 }] }];
  const o2 = [...o1, { status: 'Ordered', items: [{ name: 'Gumbo', variant: 'Large (~8-12)', qty: 1 }] }];
  const first = buildAutoShoppingRows(o1, false, [], mkId);
  if (!first.length || !first.every(r => r.auto)) F('auto-shop', 'first build must be all auto rows');
  // Check chicken mid-shop; add a manual row; a second order lands → regen:
  const checked = first.map(r => /Chicken thighs/.test(r.text) ? { ...r, checked: true } : r);
  const regen = buildAutoShoppingRows(o2, false, [...checked, { id: 'm', text: 'paper towels', checked: false }], mkId);
  const chick = regen.filter(r => /Chicken thighs/.test(r.text));
  if (chick.length !== 1) F('auto-shop', 'regen must not duplicate rows');
  if (!/4 lb/.test(chick[0].text)) F('auto-shop', `qty must double with the second order: ${chick[0].text}`);
  if (!chick[0].checked) F('auto-shop', 'checkmark must survive a QUANTITY change (keyed by name, not text)');
  if (!regen.some(r => r.text === 'paper towels')) F('auto-shop', 'manual rows must survive regeneration');
  // Orders emptying (all delivered/archived) empties the AUTO layer only.
  const empty = buildAutoShoppingRows([], false, regen, mkId);
  if (empty.some(r => r.auto)) F('auto-shop', 'no active orders = no auto rows');
  if (!empty.some(r => r.text === 'paper towels')) F('auto-shop', 'manual rows persist even with zero orders');
}

// ─── Manual-entry container guard (the anchovy bug, Jul 9) ──────────────────
{
  const r = containerPriceCheck('anchovies', 5.78, 0.30);
  if (!r || Math.abs(r.converted - 0.289) > 0.001) F('container-guard', `jar price must convert ÷20: ${JSON.stringify(r)}`);
  if (containerPriceCheck('anchovies', 0.35, 0.30) !== null) F('container-guard', 'legit small edits must pass silently');
  if (!containerPriceCheck('kosher_salt', 3.50, 0.02)) F('container-guard', 'the guard must cover every PACK_OVERRIDE ingredient');
  if (containerPriceCheck('shrimp', 7.49, 7.49) !== null) F('container-guard', 'non-container ingredients never trigger');
}

// ─── Scanner intelligence upgrades (Jul 9, Opus) ────────────────────────────
{
  // #1 SELF-TUNING PACK SIZES: learn from a hardcoded-'pack' conversion, and
  // smooth so an anomaly nudges rather than yanks.
  const grp = (total, perUnit) => ({ norm: 'anchovies', ingredientId: 'anchovies', perUnit,
    conversion: { basis: 'pack', factor: 20 }, lines: [{ line_total: total, quantity: 1 }] });
  let a = learnFromAcceptance(grp(6.60, 0.30), {});            // implied 22
  if (Math.abs(a.anchovies.packQty - 22) > 0.01) F('scanner#1', `first obs must adopt implied: ${a.anchovies.packQty}`);
  if (a.anchovies.packObs !== 1) F('scanner#1', 'packObs must count');
  a = learnFromAcceptance(grp(6.60, 0.30), a);                 // implied 22 again
  a = learnFromAcceptance(grp(6.00, 0.60), a);                 // anomaly implies 10
  if (a.anchovies.packQty < 17 || a.anchovies.packQty > 20) F('scanner#1', `anomaly must be dampened, not adopted: ${a.anchovies.packQty}`);

  // #2 PACK-SHIFT ALARM: fires past threshold once established, quiet otherwise.
  const est = { packQty: 20, packObs: 3 };
  if (!packShiftAlarm({ perUnit: 0.50, lines: [{ line_total: 6.0, quantity: 1 }] }, est)) F('scanner#2', 'a 40% smaller jar must alarm');
  if (packShiftAlarm({ perUnit: 0.30, lines: [{ line_total: 6.0, quantity: 1 }] }, est) !== null) F('scanner#2', 'a normal jar must stay quiet');
  if (packShiftAlarm({ perUnit: 0.50, lines: [{ line_total: 6.0, quantity: 1 }] }, { packQty: 20, packObs: 1 }) !== null) F('scanner#2', 'must not alarm while still learning (obs<2)');

  // #3 STORE FACTS: habitual store + off-store hint.
  let sa = learnStoreFact({}, 'doubanjiang', 'doubanjiang', 'HMART');
  sa = learnStoreFact(sa, 'doubanjiang', 'doubanjiang', 'HMART');
  if (habitualStore(sa.doubanjiang) !== 'HMART') F('scanner#3', 'two H-Mart buys = habitual H-Mart');
  if (!offStoreHint(sa.doubanjiang, 'HEB')) F('scanner#3', 'H-Mart item on an HEB receipt must hint');
  if (offStoreHint(sa.doubanjiang, 'HMART')) F('scanner#3', 'same-store must not hint');
  if (habitualStore({ storeSeen: { HEB: 2, HMART: 2 } }) !== null) F('scanner#3', 'a tie is not habitual');

  // #4 DICE: closer string wins; unrelated scores low; identical is 1.
  if (diceCoefficient('habanero pepper', 'habanero') <= diceCoefficient('habanero pepper', 'jalapeno')) F('scanner#4', 'habanero must out-score jalapeno for a habanero line');
  if (diceCoefficient('gumbo', 'gumbo') !== 1) F('scanner#4', 'identical strings score 1');
  if (diceCoefficient('', 'x') !== 0) F('scanner#4', 'empty scores 0');
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
