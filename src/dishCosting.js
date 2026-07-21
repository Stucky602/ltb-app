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

// Ingredients Kevin buys and resells AT COST (no value-add markup) — pasta.
// Blended margin includes them (the honest bottom line); value-add margin
// excludes them from both cost and revenue to show the health of the dish
// Kevin actually cooks. Derived from the seed's `passthrough` flags.
export const PASSTHROUGH_IDS = new Set(INGREDIENT_SEED.filter(i => i.passthrough).map(i => i.id));

// ── Unit conversion anchors (recipe unit -> purchase-unit quantity) ─────────
const OZ_PER_LB = 16;
const CLOVES_PER_HEAD = 20;
const GRAMS_PER_LB = 453.6;
const GRAMS_PER_KNOB = 30;
const KNOBS_PER_LB = GRAMS_PER_LB / GRAMS_PER_KNOB; // ~15.12
const LB_PER_ONION = 0.6;
const LB_PER_APPLE = 0.4; // medium apple; only used to convert the one bare-count recipe line, never to price a purchase
const LB_PER_SWEET_POTATO = 0.87; // recorded on the old per-each seed line, which back-solved to $1.20/lb against its own $1.21/lb note
// Peanut butter is DENSE: a cup weighs far more than a cup of water. Jars are
// labeled by net weight, so per-oz is the only figure a receipt can confirm,
// and this bridges the recipe's 'cup' to it.
const OZ_PER_CUP_PEANUT_BUTTER = 9.5;
const TBSP_PER_STICK = 8;
const CUPS_PER_BOTTLE_WINE = 3;
const TBSP_PER_CUP = 16;
const TSP_PER_TBSP = 3;
const GRAMS_PER_OZ = 28.35;
// H-Mart herb pack (thyme + tarragon ONLY — other herbs stay bunch/H-E-B):
// 1 pack = 1 bunch = 15 sprigs = $2.99 (Kevin, Jul 14). Pack and bunch are
// interchangeable for these two.
const SPRIGS_PER_HERB_PACK = 15;

// ═══ UNIVERSAL UNIT LAYER (Workstream A, Jul 14 2026) ═══════════════════════
// Goal (Kevin): "it doesn't matter HOW I enter the recipe, it just works."
// Shape: global unit FAMILIES (physics, written once) + per-ingredient BRIDGE
// declarations (the facts that vary per ingredient), compiled by makeConv()
// into the same conv(q,u) closures LINE_MAP has always held. Call sites,
// resolveLine, and the drift engine are unchanged.
//
// FAIL CLOSED: a unit an ingredient can't convert returns null — never a
// silent pass-through. The [unit-convertible] invariant walks every recipe
// line and fails the gate on any null, so an unconvertible line cannot ship.
// Recipes are static data, so the gate IS the runtime guarantee.
//
// BARE QUANTITY RULE (documented convention, 66 recipe lines rely on it):
// an empty/missing unit means "count of pricing units" — I('Eggs', 3, '') is
// 3 eggs. Exception: a weight-priced ingredient that declares eachWeightLb
// reads a bare quantity as a piece count (I('Carrot', 1, '') = one carrot =
// 0.15 lb), which is what those lines always meant.
//
// VAGUE UNITS (Kevin's rulings, Jul 14): glug = 1 tbsp; knob = 30 g; pinch =
// 1/16 tsp (saffron's PRICING unit is the pinch — $4.68 bag ÷ 4 uses — and the
// volume equivalence exists for any future tsp-typed line); handful of spicy
// peppers = 0.2 batch (kept in that entry); jar, half-jar, block, ear, leaf,
// shot, fillet, piece, pack, 10ct, can, carton, container, batch, batch-use,
// blend ARE pricing units — no conversion, identity or fixed constants.

// Weight family: factors TO pounds.
const WT_PER_LB = { lb: 1, oz: 1 / 16, g: 1 / GRAMS_PER_LB, kg: 1000 / GRAMS_PER_LB };
// Volume family: factors TO cups. 1 cup = 8 fl oz = 16 tbsp = 48 tsp = 768
// pinches = 236.588 ml.
const ML_PER_CUP = 236.588;
const VOL_PER_CUP = { cup: 1, tbsp: 1 / 16, tsp: 1 / 48, floz: 1 / 8, ml: 1 / ML_PER_CUP, l: 1000 / ML_PER_CUP, qt: 4, pt: 2, pinch: 1 / 768 };

// Spelling/plural canonicalization. Explicit map beats clever stemming — a
// unit not listed here passes through unchanged and is handled (or refused)
// by the ingredient's own spec. Multiword units ('14oz can', 'small can',
// '10-ct pack') intentionally pass through to per-ingredient aliases.
const UNIT_SYNONYM = {
  tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', teaspoon: 'tsp', teaspoons: 'tsp', tsps: 'tsp',
  glug: 'tbsp', glugs: 'tbsp', // Kevin's ruling (Jul 14): one glug = 1 tbsp = 0.5 fl oz
  'fl oz': 'floz', 'fl-oz': 'floz', 'fluid oz': 'floz', 'fluid ounce': 'floz', 'fluid ounces': 'floz',
  ounce: 'oz', ounces: 'oz', pound: 'lb', pounds: 'lb', lbs: 'lb', gram: 'g', grams: 'g',
  kilogram: 'kg', kilograms: 'kg', kgs: 'kg', liter: 'l', litre: 'l', liters: 'l', litres: 'l',
  quart: 'qt', quarts: 'qt', pint: 'pt', pints: 'pt',
  cups: 'cup', bottles: 'bottle', bunches: 'bunch', packs: 'pack', sticks: 'stick', knobs: 'knob',
  sprigs: 'sprig', cloves: 'clove', stalks: 'stalk', heads: 'head', ears: 'ear', leaves: 'leaf',
  pieces: 'piece', squares: 'square', bars: 'bar', pinches: 'pinch', shots: 'shot', blocks: 'block',
  jars: 'jar', fillets: 'fillet', cans: 'can', bags: 'bag', batches: 'batch',
};
export function canonUnit(u) {
  if (u == null) return '';
  const t = String(u).trim().toLowerCase().replace(/\s+/g, ' ');
  return UNIT_SYNONYM[t] || t;
}

// makeConv(spec) → conv(q, u). Spec fields:
//   unit            REQUIRED. The ingredient's pricing unit (matches the seed).
//   fluid           'oz' inputs mean FLUID oz (stocks, oils, cream, booze).
//   aliases         { unit: factor } extra units, factor = pricing units per 1
//                   of that unit (garlic { clove: 1/20 }, wine { bottle: 3 }).
//   pieceWeightLb   count-PRICED ingredient with a known piece weight: any
//                   weight input converts to pieces (butter stick 0.25 lb,
//                   chocolate square 0.03125 lb, onion 0.6 lb).
//   eachWeightLb    weight-PRICED ingredient with a known piece weight: a bare
//                   or 'each' quantity converts to weight (carrot 0.15 lb).
//   densityLbPerCup weight-PRICED ingredient that recipes measure by volume
//                   (flour 0.275 lb/cup = Kevin's 125 g standard; parm 0.19).
//   also            escape hatch, tried FIRST, receives the CANONICAL unit.
//                   Return undefined to fall through, null to hard-fail.
// Resolution order: also → bare-quantity rule → pricing unit → aliases →
// weight family → volume family → bridges → null (FAIL CLOSED).
export function makeConv(spec) {
  let unit = canonUnit(spec.unit);
  if (spec.fluid && unit === 'oz') unit = 'floz';
  const aliases = {};
  for (const [k, v] of Object.entries(spec.aliases || {})) aliases[canonUnit(k)] = v;
  const unitIsWt = WT_PER_LB[unit] != null;
  const unitIsVol = VOL_PER_CUP[unit] != null;
  const fn = (q, u) => {
    let un = canonUnit(u);
    if (spec.fluid && un === 'oz') un = 'floz';
    if (spec.also) { const r = spec.also(q, un); if (r !== undefined) return r; }
    if (un === '') {
      if (unitIsWt && spec.eachWeightLb != null) return q * spec.eachWeightLb / WT_PER_LB[unit];
      return q;
    }
    if (un === unit) return q;
    if (aliases[un] != null) return q * aliases[un];
    if (unitIsWt && WT_PER_LB[un] != null) return q * WT_PER_LB[un] / WT_PER_LB[unit];
    if (unitIsVol && VOL_PER_CUP[un] != null) return q * VOL_PER_CUP[un] / VOL_PER_CUP[unit];
    if (unitIsWt && spec.eachWeightLb != null && un === 'each') return q * spec.eachWeightLb / WT_PER_LB[unit];
    if (!unitIsWt && !unitIsVol && spec.pieceWeightLb != null && WT_PER_LB[un] != null) return q * WT_PER_LB[un] / spec.pieceWeightLb;
    if (unitIsWt && spec.densityLbPerCup != null && VOL_PER_CUP[un] != null) return q * VOL_PER_CUP[un] * spec.densityLbPerCup / WT_PER_LB[unit];
    return null; // FAIL CLOSED — [unit-convertible] invariant catches this pre-deploy
  };
  // The unit this conv resolves TO. Closed over and otherwise invisible, which
  // is how the red onion trap works: the seed's `unit` and the conv's `unit`
  // are one contract (the seed says what a baseline dollar buys; the conv says
  // what quantity to multiply it by), and nothing could compare them. Exposing
  // it lets the [conv-unit-matches-seed] invariant do exactly that.
  fn.declaredUnit = unit;
  return fn;
}
const C = makeConv; // brevity alias for the map below

// ── Recipe-line resolver ────────────────────────────────────────────────────
// Keyed on the EXACT recipe-line name string. Each entry resolves a line to a
// canonical ingredient id and a conversion from recipe units -> purchase units.
// { skip:true } lines contribute no cost (packaging handled separately, rice
// folded into baseline, tofu now a real ingredient, etc.)
export const LINE_MAP = {
  // Tomatoes / canned
  'Canned tomatoes':        { id: 'tomato_can', conv: C({ unit: 'can', pieceWeightLb: 1.75, also: (q,u)=>{ const m=/^([\d.]+)\s*oz\s+cans?$/.exec(u||''); return m ? q*parseFloat(m[1])/28 : undefined; } }) }, // tomato_can = one 28oz can (1.75 lb); "NNoz can" scales
  'Canned peeled tomatoes': { id: 'peeled_tomatoes', conv: C({ unit: 'can' }) }, // STALE (Jul 13 rename -> 'Canned tomatoes'); kept so old strings never silently cost $0
  'Crushed tomatoes':       { id: 'tomato_can', conv: C({ unit: 'can', pieceWeightLb: 1.75 }) },
  'Homegrown tomatoes':     { id: 'homegrown_tomatoes', conv: () => 1 }, // fixed, no-drift
  'Tomatoes (pico)':        { id: 'fresh_tomatoes', conv: C({ unit: 'lb' }) },
  'Tomato paste':           { id: 'tomato_paste', conv: C({ unit: 'can', aliases: { tbsp: 1/12, 'small can': 1 } }) }, // 6oz can ≈ 12 tbsp

  // Onions
  // Red onion is purchased BY WEIGHT (Kevin, Jul 15), so its conv resolves to
  // lb and `eachWeightLb` carries a bare count the other way. Note the key
  // swap: `pieceWeightLb` converts weight -> pieces (for a per-each purchase
  // unit), `eachWeightLb` converts pieces -> weight (for a per-lb one). They
  // point in opposite directions, and the seed's `unit` decides which is
  // correct. Seed unit and conv unit are ONE CONTRACT: change one without the
  // other and every line silently misprices by the piece weight. Yellow onion
  // is still sold by the each and keeps pieceWeightLb.
  'Red onion':              { id: 'red_onion', conv: C({ unit: 'lb', eachWeightLb: LB_PER_ONION }) },
  'Red onion (large)':      { id: 'red_onion', conv: C({ unit: 'lb', eachWeightLb: LB_PER_ONION }) }, // STALE (Jul 13 rename -> 'Red onion')
  // Yellow onion joined red onion on the scale (Kevin, Jul 15): both are
  // bought by weight, so both resolve to lb with eachWeightLb carrying the
  // bare-count recipe lines ("Onion, 1") the other way.
  'Onion':                  { id: 'onion', conv: C({ unit: 'lb', eachWeightLb: LB_PER_ONION }) },
  'Onions or carrots (for pickling)': { id: 'onion', conv: C({ unit: 'lb', eachWeightLb: LB_PER_ONION }) },
  'Sweet onion':            { id: 'sweet_onion', conv: C({ unit: 'lb' }) },
  'Bulb onions':            { id: 'bulb_onion', conv: C({ unit: 'bunch' }) },
  'Scallions':              { id: 'scallions', conv: C({ unit: 'bunch' }) },

  // Aromatics
  'Garlic':                 { id: 'garlic', conv: C({ unit: 'head', aliases: { clove: 1/CLOVES_PER_HEAD } }) },
  'Ginger':                 { id: 'ginger', conv: C({ unit: 'lb', aliases: { knob: GRAMS_PER_KNOB/GRAMS_PER_LB } }) }, // knob = 30 g (Kevin ruling, generalized in canonUnit docs)

  // Produce / veg
  'Carrots':                { id: 'carrots', conv: C({ unit: 'lb', eachWeightLb: 0.15 }) }, // one carrot ≈ 0.15 lb
  'Carrot':                 { id: 'carrots', conv: C({ unit: 'lb', eachWeightLb: 0.15 }) }, // was a flat ()=>0.15 that IGNORED q and u; Ragu's 3 oz line now converts honestly (see Jul 14 handoff)
  'Celery':                 { id: 'celery', conv: C({ unit: 'head', pieceWeightLb: 1.5, aliases: { stalk: 1/8 } }) }, // head ~1.5 lb = 24 oz, 8 stalks
  'Green bell pepper':      { id: 'green_bell_pepper', conv: C({ unit: 'each' }) },
  'Poblano pepper':         { id: 'poblano', conv: C({ unit: 'lb' }) },
  'Habaneros':              { id: 'habanero', conv: C({ unit: 'oz', also: (q,u)=> (u==='' || u==='each') ? q*0.1 : undefined }) }, // 1 habanero charged as 0.1 (historical flat, preserved)
  'Dried ancho chili':      { id: 'ancho_chili', conv: C({ unit: 'oz' }) },
  'Asparagus':              { id: 'asparagus', conv: C({ unit: 'lb' }) },
  'Chinese broccoli':       { id: 'chinese_broccoli', conv: C({ unit: 'lb' }) },
  'Chinese eggplant':       { id: 'chinese_eggplant', conv: C({ unit: 'lb' }) },
  'Zucchini':               { id: 'zucchini', conv: C({ unit: 'lb' }) }, // per lb; no recipe uses it yet (Jul 14)
  'Long beans':             { id: 'long_beans', conv: C({ unit: 'lb' }) },
  'Asian greens':           { id: 'asian_greens', conv: C({ unit: 'lb' }) },
  'Tong ho':                { id: 'tong_ho', conv: C({ unit: 'lb' }) },
  'Mushrooms':              { id: 'mushrooms', conv: C({ unit: 'lb' }) },
  'Dried porcini':          { id: 'porcini', conv: C({ unit: 'oz' }) }, // recipe qty in oz, ingredient priced per oz
  'Oyster mushroom':        { id: 'oyster_mushroom', conv: C({ unit: 'lb' }) },
  'King oyster mushroom':   { id: 'king_oyster_mushroom', conv: C({ unit: 'lb' }) },
  'Shiitake mushroom':      { id: 'shiitake', conv: C({ unit: 'lb' }) },
  'Baby bella mushrooms':   { id: 'baby_bella', conv: C({ unit: '8oz', pieceWeightLb: 0.5 }) }, // priced per 8-oz pack
  'Kabocha squash':         { id: 'kabocha', conv: C({ unit: 'lb' }) },
  'Prime boneless chuck roast': { id: 'prime_chuck', conv: C({ unit: 'lb' }) },
  'Pecans':                 { id: 'pecans', conv: C({ unit: 'oz' }) },
  'Dried orange peel':      { id: 'dried_orange_peel', conv: C({ unit: 'tbs' }) },
  'Pomegranate molasses':   { id: 'pomegranate_molasses', conv: C({ unit: 'cup' }) },
  'Pickled onion (house)':  { id: 'pickled_onion', conv: () => 1 },
  'Pepitas':                { id: 'pepitas', conv: C({ unit: 'oz' }) },
  'Pomegranate seeds':      { id: 'pomegranate_seeds', conv: C({ unit: 'oz' }) },
  'Mitad-y-mitad tortillas': { id: 'mitad_tortillas', conv: C({ unit: '10ct' }) },
  'Mole spice blend':       { id: 'spices_generic', conv: () => 1 },
  'Honey':                  { id: 'honey', conv: C({ unit: 'tbs' }) },
  'Petite peas':            { id: 'petite_peas', conv: C({ unit: '8oz', pieceWeightLb: 0.5 }) },
  'Corn':                   { id: 'corn', conv: C({ unit: 'ear' }) },
  'Red potatoes':           { id: 'red_potatoes', conv: C({ unit: 'lb' }) },
  'Apple':                  { id: 'apple', conv: C({ unit: 'lb', eachWeightLb: LB_PER_APPLE }) }, // by weight (Kevin, Jul 15); the Leblanc curry line is a bare count ('Apple, 1'), so eachWeightLb carries it
  'Fennel bulb':            { id: 'fennel_bulb', conv: C({ unit: 'each' }) },
  'Limes':                  { id: 'lime', conv: C({ unit: 'each' }) },
  'Lemon':                  { id: 'lemon', conv: C({ unit: 'each' }) },

  // Herbs
  'Cilantro':               { id: 'cilantro', conv: C({ unit: 'bunch', pieceWeightLb: 0.125 }) }, // bunch ≈ 2 oz (preserves the old g/56.7)
  'Thai basil':             { id: 'basil', conv: C({ unit: 'bunch' }) },
  'Fresh mint':             { id: 'mint', conv: C({ unit: 'bunch', aliases: { sprig: 1/10 } }) },
  // H-Mart herb pack (thyme + tarragon ONLY): 1 pack = 1 bunch = 15 sprigs =
  // $2.99 (Kevin, Jul 14). Priced per sprig; other herbs stay bunch/H-E-B.
  'Fresh thyme':            { id: 'thyme_fresh', conv: C({ unit: 'sprig', aliases: { bunch: SPRIGS_PER_HERB_PACK, pack: SPRIGS_PER_HERB_PACK } }) },
  'Fresh thyme or lavender':{ id: 'thyme_fresh', conv: C({ unit: 'sprig', aliases: { bunch: SPRIGS_PER_HERB_PACK, pack: SPRIGS_PER_HERB_PACK } }) },

  // Proteins
  'Ground pork':            { id: 'ground_pork', conv: C({ unit: 'lb' }) },
  'Ground lamb':            { id: 'ground_lamb', conv: C({ unit: 'lb' }) },
  'Ground beef':            { id: 'ground_beef', conv: C({ unit: 'lb' }) },
  'Ground chicken':         { id: 'ground_chicken', conv: C({ unit: 'lb' }) },
  'Ground beef or turkey':  { id: 'ground_beef', conv: C({ unit: 'lb' }) },
  'Chicken thighs':         { id: 'chicken_thighs', conv: C({ unit: 'lb' }) },
  'Chicken breast':         { id: 'chicken_breast', conv: C({ unit: 'lb' }) },
  'Beef chuck roast':       { id: 'beef_chuck', conv: C({ unit: 'lb' }) },
  'Bone-in pork butt':      { id: 'pork_butt', conv: C({ unit: 'lb' }) },
  'Pork shoulder':          { id: 'pork_shoulder', conv: C({ unit: 'lb' }) },
  'Kimchi':                 { id: 'kimchi', conv: C({ unit: 'jar' }) },
  'Vegetable oil':          { id: 'vegetable_oil', conv: C({ unit: 'cup', fluid: true }) },
  'Vinegar':                { id: 'vinegar', conv: C({ unit: 'batch-use' }) },
  'Kosher salt':            { id: 'kosher_salt', conv: C({ unit: 'tbs' }) },
  'Wagyu london broil':     { id: 'wagyu_london_broil', conv: C({ unit: 'lb' }) },
  'Shrimp':                 { id: 'shrimp', conv: C({ unit: 'lb' }) },
  'Texas Gulf Shrimp':      { id: 'shrimp', conv: C({ unit: 'lb' }) },
  'Salt pork':              { id: 'salt_pork', conv: C({ unit: 'oz' }) },
  'Anchovies':              { id: 'anchovies', conv: C({ unit: 'fillet' }) },
  'Tofu':                   { id: 'tofu', conv: C({ unit: 'block' }) },

  // Dairy
  // Butter: 1 stick = 8 tbsp = 4 oz = 113 g = 1/2 cup (US standard).
  'Butter':                 { id: 'butter', conv: C({ unit: 'stick', pieceWeightLb: 0.25, aliases: { tbsp: 1/TBSP_PER_STICK, cup: 2, tsp: 1/24 } }) },
  'Whole milk':             { id: 'milk', conv: C({ unit: 'cup', fluid: true }) }, // STALE (Jul 13 rename -> 'Milk')
  'Milk':                   { id: 'milk', conv: C({ unit: 'cup', fluid: true }) },
  'Evaporated milk':        { id: 'evaporated_milk', conv: C({ unit: 'cup', fluid: true }) },
  'Heavy cream':            { id: 'heavy_cream', conv: C({ unit: 'cup', fluid: true }) }, // 8 fl oz = 1 cup
  'Eggs':                   { id: 'eggs', conv: C({ unit: 'each' }) },
  'Good parmesan':          { id: 'parm', conv: C({ unit: 'lb', densityLbPerCup: 0.19 }) }, // 1 cup grated ≈ 0.19 lb
  'Good parm':              { id: 'parm', conv: C({ unit: 'lb', densityLbPerCup: 0.19 }) }, // recipe gives oz, parm priced per lb
  'Heavy cream (oz)':       { id: 'heavy_cream', conv: C({ unit: 'cup', fluid: true }) }, // STALE (Jul 13 rename -> 'Heavy cream')
  'Cooking olive oil':      { id: 'olive_oil_cooking', conv: C({ unit: 'oz', fluid: true }) }, // Graza Sizzle, priced per fl oz
  // ── Spotlight: Coriander Lamb Steak over Gigantes Beans (Jul 9) ──
  'Lamb leg steak (bone-in)': { id: 'lamb_leg_steak', conv: C({ unit: 'lb' }) },
  'Gigantes beans':         { id: 'gigantes_beans', conv: C({ unit: 'oz' }) },       // priced per oz, recipe gives oz
  'Leeks':                  { id: 'leeks', conv: C({ unit: 'bunch' }) },
  'Preserved lemon':        { id: 'preserved_lemon', conv: C({ unit: 'piece' }) },   // homemade: 1 piece = 1/8 lemon, $0.50 labor-inclusive (Kevin, Jul 14)
  'Coriander seed':         { id: 'coriander_seed', conv: C({ unit: 'tbsp' }) },
  // ── Spotlight: Thick-Cut Pork Chop (Jul 9) ──
  'Bone-in pork rib chop':  { id: 'pork_rib_chop', conv: C({ unit: 'lb' }) },
  'Sweet potato':           { id: 'sweet_potato', conv: C({ unit: 'lb', eachWeightLb: LB_PER_SWEET_POTATO }) }, // by weight (Kevin, Jul 15); the recipe line is a bare count ('Sweet potato, 2'), so eachWeightLb carries it
  'Cider':                  { id: 'cider', conv: C({ unit: 'oz', fluid: true }) },   // priced per fl oz (12 oz can)
  'Broccolini':             { id: 'broccolini', conv: C({ unit: 'bunch' }) },
  'Sage':                   { id: 'sage', conv: C({ unit: 'pack' }) },               // already ÷6 in seed
  'Cinnamon stick':         { id: 'cinnamon_stick', conv: C({ unit: 'each' }) },
  'Whole cloves':           { id: 'whole_cloves', conv: C({ unit: 'each' }) },
  'Allspice':               { id: 'allspice', conv: C({ unit: 'each' }) },
  // ── Spotlight: Steak au Poivre (Jul 9) ──
  'Filet mignon':           { id: 'filet_mignon_dinner', conv: C({ unit: 'lb' }) },  // per lb (dinner cut, distinct from bag filet)
  'Jumbo asparagus':        { id: 'jumbo_asparagus', conv: C({ unit: 'lb' }) },
  'Yukon gold potato':      { id: 'yukon_gold_potato', conv: C({ unit: 'lb' }) },    // distinct from baby golds
  'Cognac':                 { id: 'cognac', conv: C({ unit: 'oz', fluid: true }) },  // per fl oz (Courvoisier VS)
  'Black pepper (oz)':      { id: 'black_pepper_oz', conv: C({ unit: 'oz' }) },
  'Parsley':                { id: 'parsley', conv: C({ unit: 'bunch' }) },
  'Oaxaca cheese':          { id: 'oaxaca', conv: C({ unit: 'lb' }) },
  'Colby Jack':             { id: 'colby_jack', conv: C({ unit: 'lb' }) },

  // Pantry / dry
  // Flour: Kevin's standard is 1 cup = 125 g. Stored as the historical 0.275
  // lb/cup (= 124.7 g) so every existing anchor stays EXACTLY stable — the
  // 0.2% gap is far below costing noise. This is a choice, not a law: sources
  // range 120 g (King Arthur) to 125 g (FDA cup).
  'Flour':                  { id: 'flour', conv: C({ unit: 'lb', densityLbPerCup: 0.275 }) },
  'Dried kidney beans':     { id: 'dried_kidney_beans', conv: C({ unit: 'lb' }) },
  'Dried lima beans':       { id: 'dried_lima_beans', conv: C({ unit: 'oz' }) },
  'Beans (for refried)':    { id: 'black_beans', conv: C({ unit: 'lb' }) },
  'Pasta':                  { id: 'pasta', conv: C({ unit: 'lb' }) },
  'Orecchiette':            { id: 'orecchiette', conv: C({ unit: 'lb' }) },
  'Lemon herb butter':      { id: 'lemon_herb_butter', conv: C({ unit: 'each' }) }, // composed 2oz container; cost = butter+lemon+garlic+thyme batch/10
  'Pasta (ask customer for shape!)': { id: 'pasta', conv: C({ unit: 'lb' }) },
  'Fresh noodles (not dried)': { id: 'noodles', conv: C({ unit: 'batch' }) },
  'Egg pappardelle':        { id: 'egg_pappardelle', conv: C({ unit: 'pack' }) },
  'HEB bakery tortillas':   { id: 'tortillas', conv: C({ unit: '10ct', aliases: { '10-ct pack': 1, pack: 1 } }) },
  'Dried peppers (red sauce)': { id: 'dried_peppers', conv: C({ unit: '8oz', pieceWeightLb: 0.5, aliases: { bag: 1 } }) },
  'Assorted dried chilis':  { id: 'dried_peppers', conv: () => 1 }, // one bag per batch, flat by design
  'Mix of spicy peppers':   { id: 'chilis', conv: () => 0.2 }, // handful = 0.2 batch (Kevin ruling, Jul 14 — flat by design)
  // Ghirardelli 100% Cacao bar (CONFIRMED product): 1 bar = 4 oz = 113 g =
  // 8 squares, so 1 square = 0.5 oz = 14.2 g. Baseline $0.535/square
  // ($4.28/bar, Kevin-approved Jul 14; was $0.50).
  '100% dark chocolate':    { id: 'chocolate_100', conv: C({ unit: 'square', pieceWeightLb: 0.03125, aliases: { bar: 8 } }) },
  'Guittard chocolate (low + high %)': { id: 'guittard_low', conv: C({ unit: 'g' }) },  // composed-ok: two cacao grades of the SAME chocolate, priced together as guittard_low
  'Valrhona chocolate':     { id: 'valrhona', conv: C({ unit: '290g', pieceWeightLb: 290/GRAMS_PER_LB, aliases: { bar: 1 } }) }, // priced per 290g bar — that IS the bar weight
  'Peanut butter':          { id: 'peanut_butter', conv: C({ unit: 'oz', aliases: { cup: OZ_PER_CUP_PEANUT_BUTTER } }) }, // priced per oz off the real jar (Jul 15); 1 cup of PB weighs ~9.5 oz
  'Saffron':                { id: 'saffron', conv: C({ unit: 'pinch' }) }, // pinch IS the pricing unit ($4.68 bag ÷ 4 uses = $1.17); pinch = 1/16 tsp in the volume family for any future tsp line
  'Fennel seeds':           { id: 'fennel_seeds', conv: C({ unit: 'tsp' }) },

  // Liquids / sauces / booze
  'Red wine':               { id: 'red_wine', conv: C({ unit: 'cup', fluid: true, aliases: { bottle: CUPS_PER_BOTTLE_WINE } }) },
  'White wine':             { id: 'white_wine', conv: C({ unit: 'cup', fluid: true }) },
  'Dry sherry':             { id: 'sherry', conv: C({ unit: 'cup', fluid: true }) },
  'Dry marsala':            { id: 'marsala', conv: C({ unit: 'cup', fluid: true }) },
  'Espresso':               { id: 'espresso', conv: C({ unit: 'shot' }) },
  'Bourbon':                { id: 'bourbon', conv: C({ unit: 'cup', fluid: true }) }, // bourbon priced per cup; 8 fl oz/cup
  'Doubanjiang':            { id: 'doubanjiang', conv: C({ unit: 'tbs' }) },
  'Soy sauce':              { id: 'soy', conv: C({ unit: 'tbs' }) },
  'Dark soy sauce':         { id: 'dark_soy', conv: C({ unit: 'tbs' }) },
  'Oyster sauce':           { id: 'oyster_sauce', conv: C({ unit: 'tbs' }) },
  'Chinkiang vinegar':      { id: 'chinkiang', conv: C({ unit: 'tbs' }) },
  'Shaoxing wine':          { id: 'shaoxing', conv: C({ unit: 'cup', fluid: true }) },
  'House chili oil':        { id: 'chili_oil', conv: C({ unit: 'cup', fluid: true }) },
  // Kevin's ruling (Jul 14): one glug = 1 tbsp = 0.5 fl oz — now global via
  // canonUnit, so glug/tbs/tbsp/oz all resolve through the volume family.
  // The historical flat 2.5 oz survives ONLY for a bare-quantity line so
  // legacy entries don't silently reprice; any OTHER unit now converts
  // honestly or fails the gate.
  'Good olive oil':         { id: 'olive_oil', conv: C({ unit: 'oz', fluid: true, also: (q,u)=> u==='' ? 2.5 : undefined }) },
  'Orange juice':           { id: 'orange_juice', conv: () => 1 }, // one small bottle per batch, flat by design

  // ── Tea-smoked chicken program (Jul 17) ──────────────────────────────────
  // Kombu/katsuobushi seed in OZ, so makeConv gives g, lb, and kg for free off
  // the weight table. No 'piece' or 'cup' aliases on purpose: Kevin eyeballs
  // both, and a piece/cup figure would be invented precision that a future
  // recipe would then trust. Weight is what the scale and the receipt agree on.
  // Star anise and raw smoking rice had NO LINE_MAP entry, so any recipe naming
  // them silently cost $0 (the class of bug the 'line was simply missing from
  // LINE_MAP' note below documents). Added with the tea-smoke program.
  // Plain dry polenta as a BASE ingredient, by weight. Distinct from
  // 'Polenta + butter + parmesan (bagged)' above, which is the +Polenta
  // variant add-on for the ragus: a different product (bagged side, butter and
  // parm in it) with a flat one-batch conv. The tea-smoked chicken cooks its
  // polenta in dashi with brown butter and NO cheese, so it needs the raw
  // ingredient, not that composed line. Density measured: 0.795 lb = 1.75 cups.
  'Polenta':                { id: 'polenta', conv: C({ unit: 'lb', densityLbPerCup: 0.4543 }) },
  'Star anise':             { id: 'star_anise', conv: C({ unit: 'each' }) },
  'Raw rice (smoke mix)':   { id: 'white_rice_raw', conv: C({ unit: 'cup' }) },
  'Kombu':                  { id: 'kombu', conv: C({ unit: 'oz' }) },
  'Katsuobushi':            { id: 'katsuobushi', conv: C({ unit: 'oz' }) },
  'Loose black tea':        { id: 'black_tea', conv: () => 1 }, // flat per batch, by Kevin's call (backstock)
  // Mayo/horseradish/vinegar are bought by weight-or-volume on the label but
  // used by volume in the recipe. All three seed per-oz off the jar/bottle, and
  // `fluid` routes an 'oz' recipe line to floz so cup/tbsp/tsp resolve.
  'Mayonnaise':             { id: 'mayonnaise', conv: C({ unit: 'oz', fluid: true }) },
  'Prepared horseradish':   { id: 'horseradish', conv: C({ unit: 'oz', fluid: true }) },
  'Cider vinegar':          { id: 'cider_vinegar', conv: C({ unit: 'oz', fluid: true }) },
  // Naval oranges are sold BY THE EACH. Peel is all that's used, but a whole
  // orange is what gets bought, so it costs 1 each at both sizes. That fixed
  // quantity is part of why this dish is a PROPORTION_EXCEPTIONS tenant.
  'Orange':                 { id: 'orange', conv: C({ unit: 'each' }) },
  'Chicken stock':          { id: 'chicken_stock', conv: C({ unit: 'cup', fluid: true }) }, // 8 fl oz = 1 cup
  'Vegetable stock':        { id: 'vegetable_stock', conv: C({ unit: 'cup', fluid: true }) }, // same shape and same cost as chicken stock; separate id so the veg/pesc variants aren't cooked in poultry
  'Beef stock':             { id: 'beef_stock', conv: C({ unit: 'cup', fluid: true }) },
  'Chicken broth':          { id: 'chicken_stock', conv: C({ unit: 'cup', fluid: true }) },
  'Kitchen Basics chicken stock': { id: 'chicken_basics_stock', conv: (q,u)=> u==='oz'? q/32 : q }, // STALE (Jul 13 rename -> 'Chicken stock'); chicken_basics_stock seed now unreferenced
  'Sichuan peppercorns':    { id: 'sichuan_pepper', conv: C({ unit: 'tsp' }) },
  'Brown sugar':            { id: 'brown_sugar', conv: C({ unit: 'cup' }) },
  'Sugar':                  { id: 'white_sugar', conv: C({ unit: 'cup' }) },
  'Nutmeg':                 { id: 'nutmeg', conv: () => 1 },
  'Bay leaf':               { id: 'bay_leaf', conv: C({ unit: 'leaf' }) },

  // Composite staple lines (single batch-use cost — flat by design, the conv
  // ignores quantity and unit deliberately; 'batch'/'blend' ARE the unit)
  'Curry powder':           { id: 'curry_powder', conv: () => 1 }, // a cup of curry powder = one batch-use by design
  'Cumin + spices':         { id: 'spices_generic', conv: () => 1 },  // composed-ok: seasoning blend priced as one spices_generic bucket; no separate real-ingredient cost hidden
  'Soy + Shaoxing + black beans + sugar': { id: 'spices_generic', conv: () => 1 },  // composed-ok: aromatic seasoning blend → spices_generic bucket; components are pantry splashes, not costed lines
  'Oyster + soy + fish sauce + sugar':    { id: 'spices_generic', conv: () => 1 },  // composed-ok: sauce seasoning blend → spices_generic bucket
  'Marmite + soy + spices': { id: 'spices_generic', conv: () => 1 },  // composed-ok: seasoning blend → spices_generic bucket
  'Tex-Mex spices':         { id: 'spices_generic', conv: () => 1 },
  'Vinegar + smoked paprika': { id: 'spices_generic', conv: () => 1 },  // composed-ok: Brunswick seasoning → spices_generic bucket (the corrected line; no flour/Worcestershire)
  'Worcestershire':         { id: 'worcestershire', conv: C({ unit: 'tbs' }) }, // 1 tbs recipe = 1 tbs ingredient ($0.2485/tbs)
  'Bay + salt + pepper + vinegar': { id: 'spices_generic', conv: () => 1 },  // composed-ok: braise seasoning blend → spices_generic bucket
  'Cajun spices':           { id: 'spices_generic', conv: () => 1 },
  'Filé powder':            { id: 'spices_generic', conv: () => 0.5 },
  'Honey + fish sauce + butter': { id: 'spices_generic', conv: () => 1 },  // composed-ok: glaze seasoning blend → spices_generic bucket; splashes, not costed lines
  'Curry spice blend':      { id: 'curry_spices', conv: () => 1 },
  'Sodium citrate':         { id: 'sodium_citrate', conv: C({ unit: 'g' }) },
  'Pickling vinegar + spices': { id: 'spices_generic', conv: () => 0.5 },  // composed-ok: pickle brine seasoning → spices_generic bucket
  'Chili flakes + whole spices + oil': { id: 'chili_oil', conv: () => 1 },  // composed-ok: the chili_oil id IS the finished composite product cost
  'House vanilla extract + beans': { id: 'vanilla', conv: () => 4 },  // composed-ok: beans are the input to the extract; not a separate ingredient, same vanilla id
  'Brown + white sugar':    { id: 'white_sugar', conv: () => 1.5 },  // composed-ok: two grades of sugar at ~equal price; one white_sugar id is correct
  'Sugar + karo + cocoa + vanilla': { id: 'white_karo', conv: () => 1 },  // composed-ok: the white_karo id IS the composite fudge-sugar cost
  // ── Brownies (per-batch dessert, Jul 2026) ──
  'Butter (browned)':       { id: 'butter', conv: C({ unit: 'stick', pieceWeightLb: 0.25, aliases: { tbsp: 1/TBSP_PER_STICK, cup: 2, tsp: 1/24 } }) },
  'Dutch cocoa':            { id: 'cocoa', conv: C({ unit: 'tbs' }) }, // cocoa priced per tbsp
  'Guittard chocolate (semisweet)': { id: 'guittard_high', conv: C({ unit: 'g' }) }, // priced per gram
  'DeLallo instant espresso': { id: 'delallo_espresso', conv: C({ unit: 'tsp' }) }, // priced per tsp
  'Sugar (white + brown)':  { id: 'white_sugar', conv: () => 2.2 }, // STALE (Jul 13 rename -> 'Brown + white sugar'); Brownies now cost via the 1.5 cup-equiv entry -- see handoff flag  // composed-ok: STALE alias kept so old recipe strings don't cost $0; live cost via 'Brown + white sugar'
  'Kosher salt + vanilla':  { id: 'vanilla', conv: () => 1 }, // 1 tbsp imitation vanilla (~$0.07); 1 tsp salt (~$0.01) negligible  // composed-ok: salt cost negligible (~$0.01); vanilla id carries the real cost, noted below
  // BUG (found Jul 17, Kevin): this line is named for three ingredients but
  // resolved to ONE. The butter and the parmesan in the name were silently
  // uncosted on every dish carrying this add-on. A LINE_MAP entry maps to a
  // single id, so a composed line like this needs to be EXPANDED at the recipe
  // level instead. Kept as an alias to the cornmeal so no old string costs $0,
  // and marked stale: the recipes now name the three real lines.
  // Kevin's build: 1 cup dry polenta + 1 oz good parm + 2 tbsp butter + $2 bag.
  'Polenta + butter + parmesan (bagged)': { id: 'polenta', conv: () => 0.4543 }, // STALE (Jul 17): under-costed by ~$2.90 (parm+butter) plus the bag. Use the expanded lines.  // composed-ok: STALE alias; live cost via the expanded Polenta/parm/butter/bag lines
  'Xanthan gum + lecithin powder': { id: 'spices_generic', conv: () => 0.3 },  // composed-ok: food-science stabilizer pair → spices_generic micro-cost bucket
  'Chickpeas': { id: 'chickpeas', conv: C({ unit: 'lb' }) },
  'Fresh lavender':         { id: 'herb_generic', conv: () => 1 },
  'Seasonal cantaloupe (HEB melons)': { id: 'cantaloupe', conv: C({ unit: 'each' }) },
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
  'Sous vide bag + seasonings': { skip: true },  // composed-ok: skip line; packaging placeholder with no cost by design
  'Sous vide bag + butter + herbs (costed)': { id: 'sv_bag', conv: () => 1 }, // 1 unit of the $2.00 sv_bag ingredient; separate from $1 packaging wrap  // composed-ok: the $2.00 sv_bag id IS the composed bag+butter+herbs price
  'Sous vide bag + butter + herbs (costed, large)': { id: 'sv_bag_large', conv: () => 1 }, // 1 unit of the $3.00 sv_bag_large ingredient; Large braises use ONE longer bag, not two small bags  // composed-ok: the $3.00 sv_bag_large id IS the composed large-bag price
  'Pork tenderloin (sous vide)': { id: 'pork_tenderloin', conv: C({ unit: 'lb' }) },
  'Shallot':                { id: 'shallot', conv: C({ unit: 'lb' }) },
  'Whole grain mustard':    { id: 'whole_grain_mustard', conv: C({ unit: 'oz', fluid: true }) }, // ~0.5 fl oz per tbsp
  'Egg taglierini':         { id: 'egg_taglierini', conv: C({ unit: 'pack' }) },
  // H-Mart herb pack: see thyme above — same pack, same sprig pricing.
  'Fresh tarragon':         { id: 'tarragon', conv: C({ unit: 'sprig', aliases: { bunch: SPRIGS_PER_HERB_PACK, pack: SPRIGS_PER_HERB_PACK } }) },
  'Ribeye':                 { skip: true },
  'Ribeye - Prime':         { skip: true },
  'NY Strip':               { skip: true },
  'NY Strip - Prime':       { skip: true },
  'Filet Mignon':           { skip: true }, // STALE key (Jul 13 ingredient-line rename; dish name unchanged)
  'Filet Mignon - Prime':   { skip: true },
  'Flank steak':            { skip: true },
  'Pork chop':              { skip: true },
  'Boneless pork chop':     { id: 'pork_chop_boneless', conv: C({ unit: 'lb', eachWeightLb: 0.75 }) }, // avg 0.75 lb/chop, so '2 each' resolves to 1.5 lb
  'Pork tenderloin':        { skip: true },
  'Baby gold potatoes':     { id: 'baby_gold_potatoes', conv: C({ unit: 'lb' }) }, // now a costed SV-veg bag component (was skip)
  'Parsnips':               { id: 'parsnips', conv: C({ unit: 'lb' }) },
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

// Rice + wrap surcharge: $1.146/unit via the 'rice' ingredient baseline
// ($0.50 rice-bag wrap + 2 cups white rice @ $0.323/cup), for any dish in
// RICE_DISHES. Large is a bigger bag, so it's 2 units there vs 1 for Small,
// which lands Large at exactly $2.292 (2 cups -> 4 cups, wrap doubled).
// Every RICE_DISHES variant label literally contains "Small" or "Large"
// (checked against all current entries), so that substring is the sizing
// signal — cheaper and more robust than hardcoding a per-dish factor
// threshold, since different dishes use different factor scales (some
// Small=0.5/Large=1, others Small=1/Large=2).
function riceUnits(dishName, variant) {
  // Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice is a mixed dish — only
  // the Beef/Lamb variants include rice (the noodle variants never did and
  // shouldn't be charged for it), so this can't use plain RICE_DISHES set
  // membership the way every other dish does.
  if (dishName === 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice') {
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

// ── Pipeline-candidate coster (no RECIPES entry required) ───────────────────
// A pipeline candidate lives in pipelineDishes.js, NOT in RECIPES, so it can't
// go through costDishVariant (which resolves via RECIPES[dishName]). This costs
// a candidate straight from its own ingredients[] list by reusing LINE_MAP —
// the same name→id→conversion canon the real recipes use — so a candidate's
// ingredient names have to match LINE_MAP keys (the same discipline Promote
// enforces). It's a ballpark by design: no packaging, rice surcharge, or buffer
// unless those ingredients are named explicitly.
//
// ingredients: [{ name, qty, unit }] (the shape pipelineDishes.ingredients
// takes once developed; `nature` is ignored here, it drives scaffolding not
// costing). liveCostMap/baseCostMap: id→cost maps.
//
// Returns { raw, buffered, resolvedCount, total, missing:[names], costable }.
//   raw       = un-buffered ingredient spend at live costs
//   buffered  = raw × MARGIN_BUFFER (comparable to menu.js cost anchors)
//   missing   = ingredient names with no LINE_MAP entry (uncostable lines)
//   costable  = true only if every line resolved and raw > 0
export function costPipelineIngredients(ingredients, liveCostMap, baseCostMap) {
  const list = Array.isArray(ingredients) ? ingredients : [];
  if (list.length === 0) {
    return { raw: 0, buffered: 0, resolvedCount: 0, total: 0, missing: [], costable: false };
  }
  const live = liveCostMap || {};
  const base = baseCostMap || {};
  let raw = 0, resolvedCount = 0;
  const missing = [];
  for (const ing of list) {
    if (!ing || !ing.name) continue;
    const m = LINE_MAP[ing.name];
    if (!m || m.skip) { missing.push(ing.name); continue; }
    const qty = m.conv(Number(ing.qty) || 0, ing.unit);
    if (qty == null) { missing.push(ing.name); continue; } // FAIL CLOSED like resolveLine
    const unitCost = live[m.id] != null ? live[m.id] : (base[m.id] ?? 0);
    raw += qty * unitCost;
    resolvedCount++;
  }
  raw = round2(raw);
  const buffered = round2(raw * MARGIN_BUFFER);
  const costable = missing.length === 0 && raw > 0;
  return { raw, buffered, resolvedCount, total: list.length, missing, costable };
}

// Would-be margin for a candidate at a target price, using the buffered cost
// (same basis as the invariant suite / the rest of the Recipes tab). Returns
// null when the candidate isn't costable or the price is non-positive.
export function pipelineMarginAt(costInfo, targetPrice) {
  if (!costInfo || !costInfo.costable || !(targetPrice > 0)) return null;
  const marginPct = (1 - costInfo.buffered / targetPrice) * 100;
  return {
    price: targetPrice,
    cost: costInfo.buffered,
    marginDollars: round2(targetPrice - costInfo.buffered),
    marginPct: Math.round(marginPct * 10) / 10,
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
