// ═══════════════════════════════════════════════════════════════════════════
// DISH COSTING (Phase 2) — links recipes to the live ingredient database so
// each dish shows a market-tracking cost and a green/red divergence border.
//
// MODEL (Option B — "anchored drift"):
//   The displayed cost stays anchored to the tuned menu.js `cost` for each
//   variant. We compute how far a dish's ingredients have collectively drifted
//   from their baselines (a weighted ratio), and apply that ratio to the menu
//   cost. So if a dish's ingredients are 8% pricier than baseline, the shown
//   cost = menuCost * 1.08. The border color comes from that same drift.
//
//   - Ingredients flagged `fixed` (packaging/wrap, homegrown tomatoes) never
//     drift: they contribute to the raw cost but are excluded from the drift
//     ratio, so growing-your-own / fixed-packaging items don't move borders.
//   - `staple` recipe lines are still costed (they're real ingredients) but
//     can be toggled out of drift if desired (see DRIFT_EXCLUDE_STAPLES).
//
// Everything here is pure + synchronous; no async, no storage access. App.jsx
// passes in the live ingredient map; this returns numbers ready to render.
// ═══════════════════════════════════════════════════════════════════════════

import { ALL_DINNERS, ALWAYS_MENU } from './menu.js';
import { ALL_ALWAYS_ITEMS } from './dishes.js';
import { RECIPES, RICE_DISHES } from './recipes.js';
import { INGREDIENT_SEED } from './ingredients.js';

// ── Unit conversion anchors (recipe unit -> purchase-unit quantity) ─────────
const OZ_PER_LB = 16;
const CLOVES_PER_HEAD = 20;
const GRAMS_PER_LB = 453.6;
const GRAMS_PER_KNOB = 30;
const KNOBS_PER_LB = GRAMS_PER_LB / GRAMS_PER_KNOB; // ~15.12
const LB_PER_ONION = 0.6;
const TBSP_PER_STICK = 8;
const CUPS_PER_BOTTLE_WINE = 3;
const TBSP_PER_CUP = 16;
const TSP_PER_TBSP = 3;
const GRAMS_PER_OZ = 28.35;

// ── Recipe-line resolver ────────────────────────────────────────────────────
// Keyed on the EXACT recipe-line name string. Each entry resolves a line to a
// canonical ingredient id and a conversion from recipe units -> purchase units.
// { skip:true } lines contribute no cost (packaging handled separately, rice
// folded into baseline, tofu now a real ingredient, etc.)
export const LINE_MAP = {
  // Tomatoes / canned
  'Canned tomatoes':        { id: 'tomato_can', conv: q => q },
  'Canned peeled tomatoes': { id: 'peeled_tomatoes', conv: q => q },
  'Crushed tomatoes':       { id: 'tomato_can', conv: q => q },
  'Homegrown tomatoes':     { id: 'homegrown_tomatoes', conv: () => 1 }, // fixed, no-drift
  'Tomatoes (pico)':        { id: 'fresh_tomatoes', conv: q => q },
  'Tomato paste':           { id: 'tomato_paste', conv: q => q },

  // Onions
  'Red onion':              { id: 'red_onion', conv: (q,u) => u === 'oz' ? q/OZ_PER_LB/LB_PER_ONION : (u==='lb'? q/LB_PER_ONION : q) },
  'Red onion (large)':      { id: 'red_onion', conv: q => q },
  'Onion':                  { id: 'onion', conv: (q,u) => u === 'lb' ? q/LB_PER_ONION : q },
  'Onions or carrots (for pickling)': { id: 'onion', conv: (q,u)=> u==='lb'? q/LB_PER_ONION : q },
  'Sweet onion':            { id: 'sweet_onion', conv: (q,u)=> u==='g'? q/GRAMS_PER_LB : q },
  'Bulb onions':            { id: 'bulb_onion', conv: q => q },
  'Scallions':              { id: 'scallions', conv: q => q },

  // Aromatics
  'Garlic':                 { id: 'garlic', conv: (q,u) => u==='cloves' ? q/CLOVES_PER_HEAD : q },
  'Ginger':                 { id: 'ginger', conv: (q,u) => (u==='knob'||u==='knobs') ? q/KNOBS_PER_LB : q },

  // Produce / veg
  'Carrots':                { id: 'carrots', conv: q => q },
  'Carrot':                 { id: 'carrots', conv: () => 0.15 },
  'Celery':                 { id: 'celery', conv: (q,u)=> u==='stalks'? q/8 : q },
  'Green bell pepper':      { id: 'green_bell_pepper', conv: q => q },
  'Poblano pepper':         { id: 'poblano', conv: (q,u)=> u==='g'? q/GRAMS_PER_LB : q },
  'Habaneros':              { id: 'habanero', conv: q => q*0.1 },
  'Dried ancho chili':      { id: 'ancho_chili', conv: (q,u)=> u==='g'? q/GRAMS_PER_OZ : q },
  'Asparagus':              { id: 'asparagus', conv: (q,u)=> u==='oz'? q/OZ_PER_LB : q },
  'Chinese broccoli':       { id: 'chinese_broccoli', conv: (q,u)=> u==='oz'? q/OZ_PER_LB : q },
  'Chinese eggplant':       { id: 'chinese_eggplant', conv: q => q },
  'Long beans':             { id: 'long_beans', conv: q => q },
  'Asian greens':           { id: 'asian_greens', conv: q => q },
  'Mushrooms':              { id: 'mushrooms', conv: q => q },
  'Baby bella mushrooms':   { id: 'baby_bella', conv: (q,u)=> u==='oz'? q/8 : q },
  'Kabocha squash':         { id: 'kabocha', conv: q => q },
  'Petite peas':            { id: 'petite_peas', conv: (q,u)=> u==='oz'? q/8 : q },
  'Corn':                   { id: 'corn', conv: q => q },
  'Red potatoes':           { id: 'red_potatoes', conv: q => q },
  'Apple':                  { id: 'apple', conv: q => q },
  'Fennel bulb':            { id: 'fennel_bulb', conv: q => q },
  'Limes':                  { id: 'lime', conv: q => q },
  'Lemon':                  { id: 'lemon', conv: q => q },

  // Herbs
  'Cilantro':               { id: 'cilantro', conv: (q,u)=> u==='g'? q/GRAMS_PER_OZ*0.5 : q },
  'Thai basil':             { id: 'basil', conv: q => q },
  'Fresh mint':             { id: 'mint', conv: (q,u)=> u==='sprigs'? q/10 : q },
  'Fresh thyme':            { id: 'thyme_fresh', conv: q => q },
  'Fresh thyme or lavender':{ id: 'thyme_fresh', conv: q => q },

  // Proteins
  'Ground pork':            { id: 'ground_pork', conv: q => q },
  'Ground lamb':            { id: 'ground_lamb', conv: q => q },
  'Ground beef':            { id: 'ground_beef', conv: q => q },
  'Ground chicken':         { id: 'ground_chicken', conv: q => q },
  'Ground beef or turkey':  { id: 'ground_beef', conv: q => q },
  'Chicken thighs':         { id: 'chicken_thighs', conv: q => q },
  'Chicken breast':         { id: 'chicken_breast', conv: q => q },
  'Beef chuck roast':       { id: 'beef_chuck', conv: q => q },
  'Bone-in pork butt':      { id: 'pork_butt', conv: q => q },
  'Pork shoulder':          { id: 'pork_shoulder', conv: q => q },
  'Kimchi':                 { id: 'kimchi', conv: q => q },
  'Vegetable oil':          { id: 'vegetable_oil', conv: q => q },
  'Vinegar':                { id: 'vinegar', conv: q => q },
  'Kosher salt':            { id: 'kosher_salt', conv: q => q },
  'Wagyu london broil':     { id: 'wagyu_london_broil', conv: q => q },
  'Shrimp':                 { id: 'shrimp', conv: q => q },
  'Texas Gulf Shrimp':      { id: 'shrimp', conv: q => q },
  'Salt pork':              { id: 'salt_pork', conv: q => q },
  'Anchovies':              { id: 'anchovies', conv: q => q },
  'Tofu':                   { id: 'tofu', conv: () => 1 },

  // Dairy
  'Butter':                 { id: 'butter', conv: (q,u)=> u==='tbsp'? q/TBSP_PER_STICK : q },
  'Whole milk':             { id: 'milk', conv: q => q },
  'Milk':                   { id: 'milk', conv: q => q },
  'Evaporated milk':        { id: 'evaporated_milk', conv: q => q },
  'Heavy cream':            { id: 'heavy_cream', conv: q => q },
  'Eggs':                   { id: 'eggs', conv: q => q },
  'Good parmesan':          { id: 'parm', conv: (q,u)=> u==='cup'? q*0.19 : q },
  'Oaxaca cheese':          { id: 'oaxaca', conv: (q,u)=> u==='g'? q/GRAMS_PER_LB : q },
  'Colby Jack':             { id: 'colby_jack', conv: (q,u)=> u==='g'? q/GRAMS_PER_LB : q },

  // Pantry / dry
  'Flour':                  { id: 'flour', conv: (q,u)=> u==='g'? q/GRAMS_PER_LB : (u==='cup'? q*0.275 : q) },
  'Dried kidney beans':     { id: 'dried_kidney_beans', conv: q => q },
  'Dried lima beans':       { id: 'dried_lima_beans', conv: q => q },
  'Beans (for refried)':    { id: 'black_beans', conv: q => q },
  'Pasta':                  { id: 'pasta', conv: q => q },
  'Pasta (ask customer for shape!)': { id: 'pasta', conv: q => q },
  'Fresh noodles (not dried)': { id: 'noodles', conv: q => q },
  'Egg pappardelle':        { id: 'egg_pappardelle', conv: q => q },
  'HEB bakery tortillas':   { id: 'tortillas', conv: q => q },
  'Dried peppers (red sauce)': { id: 'dried_peppers', conv: (q,u)=> u==='oz'? q/8 : q },
  'Assorted dried chilis':  { id: 'dried_peppers', conv: () => 1 },
  'Mix of spicy peppers':   { id: 'chilis', conv: () => 0.2 },
  'Dark chocolate':         { id: 'chocolate_100', conv: (q,u)=> u==='oz'? q*2 : q },
  '100% dark chocolate':    { id: 'chocolate_100', conv: q => q },
  'Guittard chocolate (low + high %)': { id: 'guittard_low', conv: (q,u)=> q },
  'Valrhona chocolate':     { id: 'valrhona', conv: (q,u)=> u==='g'? q/290 : q },
  'Peanut butter':          { id: 'peanut_butter', conv: (q,u)=> u==='cup'? q*1 : q },
  'Saffron':                { id: 'saffron', conv: q => q },
  'Fennel seeds':           { id: 'fennel_seeds', conv: q => q },

  // Liquids / sauces / booze
  'Red wine':               { id: 'red_wine', conv: (q,u)=> u==='bottle'? q*CUPS_PER_BOTTLE_WINE : q },
  'White wine':             { id: 'white_wine', conv: q => q },
  'Dry sherry':             { id: 'sherry', conv: q => q },
  'Espresso':               { id: 'espresso', conv: q => q },
  'Bourbon':                { id: 'bourbon', conv: (q,u) => u==='oz' ? q/8 : q }, // bourbon priced per cup; 8oz/cup
  'Doubanjiang':            { id: 'doubanjiang', conv: q => q },
  'Soy sauce':              { id: 'soy', conv: q => q },
  'Dark soy sauce':         { id: 'dark_soy', conv: q => q },
  'Oyster sauce':           { id: 'oyster_sauce', conv: q => q },
  'Chinkiang vinegar':      { id: 'chinkiang', conv: q => q },
  'Shaoxing wine':          { id: 'shaoxing', conv: q => q },
  'House chili oil':        { id: 'chili_oil', conv: (q,u)=> u==='tbsp'? q/TBSP_PER_CUP : q },
  'Good olive oil':         { id: 'olive_oil', conv: () => 2.5 },
  'Orange juice':           { id: 'orange_juice', conv: () => 1 },
  'Chicken stock':          { id: 'chicken_stock', conv: q => q },
  'Beef stock':             { id: 'beef_stock', conv: q => q },
  'Chicken broth':          { id: 'chicken_stock', conv: q => q },
  'Kitchen Basics chicken stock': { id: 'chicken_basics_stock', conv: (q,u)=> u==='oz'? q/32 : q },
  'Sichuan peppercorns':    { id: 'sichuan_pepper', conv: (q,u)=> u==='tbsp'? q*TSP_PER_TBSP : q },
  'Brown sugar':            { id: 'brown_sugar', conv: (q,u)=> u==='tbsp'? q/TBSP_PER_CUP : q },
  'Sugar':                  { id: 'white_sugar', conv: q => q },
  'Nutmeg':                 { id: 'nutmeg', conv: () => 1 },
  'Bay leaf':               { id: 'bay_leaf', conv: q => q },

  // Composite staple lines (single batch-use cost)
  'Curry powder':           { id: 'curry_powder', conv: () => 1 },
  'Cumin + spices':         { id: 'spices_generic', conv: () => 1 },
  'Soy + Shaoxing + black beans + sugar': { id: 'spices_generic', conv: () => 1 },
  'Oyster + soy + fish sauce + sugar':    { id: 'spices_generic', conv: () => 1 },
  'Espresso + bourbon + marmite + soy + spices': { id: 'spices_generic', conv: () => 1 }, // orphaned after Chili review split this out (harmless, same as Dark chocolate/boudin)
  'Marmite + soy + spices': { id: 'spices_generic', conv: () => 1 },
  'Tex-Mex spices':         { id: 'spices_generic', conv: () => 1 },
  'Worcestershire + vinegar + flour': { id: 'spices_generic', conv: () => 1 },
  'Bay + salt + pepper + vinegar': { id: 'spices_generic', conv: () => 1 },
  'Cajun spices':           { id: 'spices_generic', conv: () => 1 },
  'Filé powder':            { id: 'spices_generic', conv: () => 0.5 },
  'Honey + fish sauce + butter': { id: 'spices_generic', conv: () => 1 },
  'Curry spice blend':      { id: 'curry_spices', conv: () => 1 },
  'Sodium citrate':         { id: 'sodium_citrate', conv: q => q },
  'Pickling vinegar + spices': { id: 'spices_generic', conv: () => 0.5 },
  'Chili flakes + whole spices + oil': { id: 'chili_oil', conv: () => 1 },
  'House vanilla extract + beans': { id: 'vanilla', conv: () => 4 },
  'Brown + white sugar':    { id: 'white_sugar', conv: () => 1.5 },
  'Sugar + karo + cocoa + vanilla': { id: 'white_karo', conv: () => 1 },
  'Polenta + butter + parmesan (bagged)': { id: 'parm', conv: () => 0.1 },
  'Xanthan gum + lecithin powder': { id: 'spices_generic', conv: () => 0.3 },
  'Weekly vegetables + chickpeas': { id: 'black_beans', conv: () => 1 }, // orphaned after Indian Curry review split this out (harmless)
  'Chickpeas': { id: 'chickpeas', conv: q => q },
  'Fresh lavender':         { id: 'herb_generic', conv: () => 1 },
  'Seasonal cantaloupe (HEB melons)': { id: 'cantaloupe', conv: q => q },
  'Pineapple (1 makes 2 containers)': { id: 'pineapple', conv: () => 2 },

  // Skips — packaging / per-lb bag items / included rice
  'Rice (included with order)': { skip: true },
  // Bo Ssam finishing salt ('batch-use'): costed $0 since launch because this
  // line was simply missing from LINE_MAP. Made explicit (invariant suite
  // requires every line mapped). If it should ever carry real cost, map it to
  // kosher_salt — but that changes the Bo Ssam anchors, so retune those too.
  'Salt':                   { skip: true },
  'Pint mason jar':         { skip: true },
  'Gallon ziplock bag':     { skip: true },
  'Sous vide bag + seasonings': { skip: true },
  'Ribeye':                 { skip: true },
  'NY Strip':               { skip: true },
  'Filet Mignon':           { skip: true },
  'Flank steak':            { skip: true },
  'Pork chop':              { skip: true },
  'Pork tenderloin':        { skip: true },
  'Baby gold potatoes':     { skip: true },
};

// Packaging class — DERIVED from the registry: 'jar' → $2, 'none' → $0,
// absent → default $1 (dinners/desserts). Set per-item in dishes.js.
const JARRED = new Set(ALL_ALWAYS_ITEMS.filter(it => it.packaging === 'jar').map(it => it.name));
const NO_WRAP = new Set(ALL_ALWAYS_ITEMS.filter(it => it.packaging === 'none').map(it => it.name));
function wrapUnits(dishName) {
  if (NO_WRAP.has(dishName)) return 0;
  if (JARRED.has(dishName)) return 2;
  return 1;
}

// Rice container surcharge: $1/unit via the 'rice' ingredient baseline, for
// any dish in RICE_DISHES. The container is bigger for a Large batch, so it's
// 2 units there vs 1 for Small. Every RICE_DISHES variant label literally
// contains "Small" or "Large" (checked against all current entries), so that
// substring is the sizing signal — cheaper and more robust than hardcoding a
// per-dish factor threshold, since different dishes use different factor
// scales (some Small=0.5/Large=1, others Small=1/Large=2).
function riceUnits(dishName, variant) {
  // Cumin Mushroom Noodles / Cumin Beef on Rice is a mixed dish — only the
  // Beef/Lamb variants include rice (the noodle variants never did and
  // shouldn't be charged for it), so this can't use plain RICE_DISHES set
  // membership the way every other dish does.
  if (dishName === 'Cumin Mushroom Noodles / Cumin Beef on Rice') {
    if (!/^(beef|lamb),/i.test(variant || '')) return 0;
    return /large/i.test(variant || '') ? 2 : 1;
  }
  if (!RICE_DISHES.has(dishName)) return 0;
  return /large/i.test(variant || '') ? 2 : 1;
}

// Which seed ingredients are "fixed" (never drift). Read from seed flags.
const FIXED_IDS = new Set(INGREDIENT_SEED.filter(i => i.fixed).map(i => i.id));

// Set true to also exclude staple lines (spice blends, etc.) from drift.
// Left false: staples are real costs and can move, but they're small.
const DRIFT_EXCLUDE_STAPLES = false;

// ── Core: resolve a recipe line to { id, qty, fixed } in purchase units ─────
function resolveLine(line) {
  const m = LINE_MAP[line.name];
  if (!m || m.skip) return null;
  const qty = m.conv(line.q, line.u);
  return { id: m.id, qty, fixed: FIXED_IDS.has(m.id), staple: !!line.staple };
}

// Build the resolved ingredient list for a dish variant (purchase-unit qty per id).
// Returns [{ id, qty, fixed, staple }] aggregated by id.
export function resolveDishVariant(dishName, variant) {
  const r = RECIPES[dishName];
  if (!r) return null;
  const factor = r.factors?.[variant] ?? 1;
  const lines = [...(r.base || []), ...((r.extras || {})[variant] || [])];
  const byId = new Map();
  for (const ln of lines) {
    const res = resolveLine(ln);
    if (!res) continue;
    const scale = ln.fixed ? 1 : factor; // recipe-level fixed extras don't scale
    const qty = res.qty * scale;
    if (!byId.has(res.id)) byId.set(res.id, { id: res.id, qty: 0, fixed: res.fixed, staple: res.staple });
    byId.get(res.id).qty += qty;
  }
  // Packaging (wrap) as a resolved, fixed line
  const wu = wrapUnits(dishName);
  if (wu > 0) byId.set('wrap', { id: 'wrap', qty: wu, fixed: true, staple: false });
  // Rice container surcharge as a resolved, fixed line (doesn't drift —
  // it's a flat per-order container cost, not a market-priced ingredient)
  const ru = riceUnits(dishName, variant);
  if (ru > 0) {
    const prev = byId.get('rice');
    byId.set('rice', { id: 'rice', qty: (prev ? prev.qty : 0) + ru, fixed: true, staple: false });
  }
  return [...byId.values()];
}

// ── Cost + drift for a dish variant given the live ingredient map ───────────
// liveCostMap: { [id]: currentCost }, baseCostMap: { [id]: baselineCost }.
// menuCost: the tuned cost from menu.js (the Option-B anchor).
// Returns: { rawBaseline, rawCurrent, driftRatio, adjustedCost, pctDrift }
export function costDishVariant(dishName, variant, menuCost, liveCostMap, baseCostMap) {
  const resolved = resolveDishVariant(dishName, variant);
  if (!resolved) {
    return { rawBaseline: null, rawCurrent: null, driftRatio: 1, adjustedCost: menuCost ?? null, pctDrift: 0, unknown: true };
  }
  let rawBaseline = 0, rawCurrent = 0;       // all ingredients (for display)
  let driftBaseline = 0, driftCurrent = 0;   // drift-eligible only
  for (const ing of resolved) {
    const baseC = baseCostMap[ing.id] ?? 0;
    const liveC = liveCostMap[ing.id] ?? baseC;
    const baseLine = baseC * ing.qty;
    const liveLine = liveC * ing.qty;
    rawBaseline += baseLine;
    rawCurrent += liveLine;
    const driftEligible = !ing.fixed && !(DRIFT_EXCLUDE_STAPLES && ing.staple);
    if (driftEligible) {
      driftBaseline += baseLine;
      driftCurrent += liveLine;
    }
  }
  const driftRatio = driftBaseline > 0 ? driftCurrent / driftBaseline : 1;
  const anchor = (typeof menuCost === 'number') ? menuCost : rawBaseline;
  const adjustedCost = anchor * driftRatio;
  return {
    rawBaseline: round2(rawBaseline),
    rawCurrent: round2(rawCurrent),
    driftRatio,
    adjustedCost: round2(adjustedCost),
    pctDrift: round1((driftRatio - 1) * 100),
  };
}

// ── Divergence color (mirrors IngredientsTab): green cheaper, red pricier ───
// pctDrift > 0 = pricier (red), < 0 = cheaper (green). Neutral within 2%.
// Full saturation at 40% drift. Returns a CSS color string or null (neutral).
export function driftColor(pctDrift) {
  const p = pctDrift / 100;
  const mag = Math.min(Math.abs(p), 0.40) / 0.40; // 0..1
  if (Math.abs(p) < 0.02) return null;            // neutral
  const alpha = 0.18 + 0.55 * mag;                // 0.18..0.73
  if (p > 0) return `rgba(214, 69, 65, ${alpha.toFixed(3)})`;   // red, pricier
  return `rgba(29, 158, 117, ${alpha.toFixed(3)})`;             // green, cheaper
}

// Border style helper for dish cards (Week tab, Shop reference).
export function driftBorder(pctDrift) {
  const c = driftColor(pctDrift);
  if (!c) return { borderColor: 'transparent', borderWidth: 0 };
  return { borderColor: c, borderWidth: 2 };
}

// ── Convenience: cheapest-vs-baseline summary for a whole dish (all variants)
// Used by the Week tab to put one border on the dish card. Uses the LARGE
// variant's drift (representative; small/large share proportions => same drift).
export function dishDrift(dishName, variants, liveCostMap, baseCostMap) {
  // pick the variant with the most ingredients resolved (usually large/base)
  let best = null;
  for (const v of variants) {
    const r = costDishVariant(dishName, v.label, v.cost, liveCostMap, baseCostMap);
    if (r.unknown) continue;
    if (!best || Math.abs(r.pctDrift) > Math.abs(best.pctDrift)) best = r;
    else best = best; // keep
    if (!best) best = r;
  }
  return best || { pctDrift: 0, driftRatio: 1, adjustedCost: null };
}

function round2(n) { return Math.round(n * 100) / 100; }
function round1(n) { return Math.round(n * 10) / 10; }

// ── Margin buffer ───────────────────────────────────────────────────────────
// Historically Kevin multiplied every dish's cost by 1.0825, believing it was
// sales tax. The receipts proved his ingredients are almost all tax-EXEMPT at
// purchase, so this is functioning as a MARGIN CUSHION, not tax recovery. It is
// already baked into the menu.js `cost` anchors (the operating/buffered number).
// To recover the TRUE raw (un-buffered) cost for display, divide a buffered
// figure by this. One constant, one place — retune here if ever needed.
// NOTE: do NOT multiply by this in the costing engine; the buffer already lives
// in the menu.js cost fields. This constant exists for the dual raw/buffered
// DISPLAY only.
export const MARGIN_BUFFER = 1.0825;
export function trueRawCost(bufferedCost) {
  return (typeof bufferedCost === 'number') ? round2(bufferedCost / MARGIN_BUFFER) : null;
}

// Build baseline cost map straight from the seed (id -> baseline).
export function baselineCostMap() {
  const m = {};
  INGREDIENT_SEED.forEach(i => { m[i.id] = i.baseline; });
  return applyPriceLinks(m);
}

// Build a live cost map from the in-app ingredient DB array
// (each row { id, current, baseline }). Falls back to baseline when no current.
export function liveCostMapFrom(ingredientsDb) {
  const m = {};
  (ingredientsDb || []).forEach(i => { m[i.id] = (typeof i.current === 'number' ? i.current : i.baseline); });
  return applyPriceLinks(m);
}

// Some ingredients always share a price with another (e.g. Guittard low/high %
// are the same product cost). `priceLink` on the seed names the source id; the
// linked ingredient mirrors it so a receipt or manual edit to either keeps both
// in sync (source wins). Pure post-pass over a built cost map.
export function applyPriceLinks(m) {
  INGREDIENT_SEED.forEach(i => {
    if (i.priceLink && m[i.priceLink] != null) m[i.id] = m[i.priceLink];
  });
  return m;
}
