// LTB — receipt matcher v2 (deterministic, app-side).
// Pure functions: no API, no storage, no React. Takes extracted JSON + the
// ingredient DB + the alias map, returns a structured plan the review screen
// renders. All matching/costing lives here (auditable) — the model only
// extracts (and pasted-text receipts can skip the model entirely).
//
// v2 (July 2026, Fable session #3) adds, on top of the battle-tested v1 core:
//   • graded confidence: auto / review("ask me") / unmatched, with REASONS
//   • ingredient FAMILIES (pork butt≈shoulder etc.) → substitution suggestions
//   • bidirectional avg-weight bridges (per-each ↔ per-lb produce)
//   • learned per-alias pack sizes (alias.packQty) — ask once, convert forever
//   • needsConversion bucket: portioned-unit ingredients (per tbs/cup/shot…)
//     bought as a package prompt for the pack size instead of silently
//     recording a whole-jar price as a per-tbs price
//   • price-sanity check: a derived per-unit wildly off the ingredient's
//     current price demotes an auto-match to review
// Every v1 export keeps its exact signature; the v1 fixtures still pin the
// core basis/pack semantics.

import { normalizeIngredientName } from './recipes.js';

// ── unit conversion ─────────────────────────────────────────────────────────
// Two families, each anchored to one base unit:
//   volume → base 'cup'      weight → base 'lb'
const UNIT_FAMILY = {
  cup: 'vol', tbs: 'vol', tbsp: 'vol', tsp: 'vol', fl_oz: 'vol',
  pint: 'vol', quart: 'vol', gallon: 'vol', half_gallon: 'vol',
  liter: 'vol', ml: 'vol',
  lb: 'wt', oz: 'wt', g: 'wt', kg: 'wt',
};
const TO_BASE = {
  cup: 1, tbs: 1 / 16, tbsp: 1 / 16, tsp: 1 / 48, fl_oz: 1 / 8,
  pint: 2, quart: 4, gallon: 16, half_gallon: 8,
  liter: 4.22675, ml: 0.00422675,
  lb: 1, oz: 1 / 16, g: 1 / 453.592, kg: 2.20462,
};

// Normalize a raw receipt unit token to a canonical key. Returns null when it
// isn't a unit we recognize (those fall through unchanged).
export function normalizeUnit(raw) {
  if (!raw) return null;
  const u = String(raw).toLowerCase().trim()
    .replace(/^[\d.\/]+\s*/, '')
    .replace(/[.\s]/g, '')
    .replace(/s$/, '');
  const map = {
    '#': 'lb', lb: 'lb', lbs: 'lb', pound: 'lb', pd: 'lb',
    oz: 'oz', ounce: 'oz',
    g: 'g', gram: 'g', kg: 'kg', kilogram: 'kg',
    gal: 'gallon', gallon: 'gallon',
    halfgal: 'half_gallon', halfgallon: 'half_gallon',
    qt: 'quart', quart: 'quart', pt: 'pint', pint: 'pint',
    floz: 'fl_oz', fluidounce: 'fl_oz',
    l: 'liter', liter: 'liter', litre: 'liter', ml: 'ml',
    cup: 'cup', c: 'cup', tbsp: 'tbsp', tbs: 'tbs', tsp: 'tsp', tsp_: 'tsp',
    package: 'package', pkg: 'package', pk: 'package', pack: 'package', bar: 'package', bag: 'package', ct: 'package', count: 'package',
    bottle: 'package', btl: 'package', btl_: 'package', fourpack: 'package', fourpk: 'package',
    jar: 'package', can: 'package', tin: 'package', tube: 'package',
    dozen: 'dozen', doz: 'dozen', dz: 'dozen',
    ea: 'each', each: 'each',
    box: 'box', bx: 'box', carton: 'box',
  };
  return map[u] || null;
}

// Fixed pack buys: STABLE physical invariants only (a lb of butter is always
// 4 sticks; a dozen is always 12). Anything with a variable pack size (spice
// jars, sauce bottles that come in three sizes…) is handled by the LEARNED
// per-alias packQty instead — ask once, convert forever.
const PACK_OVERRIDE = {
  butter: { fromUnit: 'lb', perBase: 4, eachIsPack: true, matchNullUnit: true },  // 1 lb box = 4 sticks; boxes ring up Ea/flat, not by weight
  milk: { fromUnit: 'package', perBase: 16, eachIsPack: true, matchNullUnit: true },       // Kevin ALWAYS buys milk by the gallon = 16 cups (his rule, Jul 6)
  ground_lamb: { fromUnit: 'package', perBase: 1, eachIsPack: true, matchNullUnit: true }, // HEB ground lamb: always 1 lb packages sold each (Kevin, Jul 6)
  anchovies: { fromUnit: 'package', perBase: 20, eachIsPack: true, matchNullUnit: true },  // Kevin's jar: ALWAYS the same container, ~20 fillets (~$6.07 → $0.30/fillet) (Jul 9)
  guittard_low: { fromUnit: 'package', perBase: 283, eachIsPack: true, matchNullUnit: true },   // 10 oz bag = 283 g. FLAGS were missing — the conversion existed but never fired on flat lines (Jul 9 screenshot bug)
  guittard_high: { fromUnit: 'package', perBase: 283, eachIsPack: true, matchNullUnit: true },
  kosher_salt: { fromUnit: 'box', perBase: 90.7, eachIsPack: true, matchNullUnit: true },        // 3 lb Morton box ≈ 90.7 tbsp. Same missing-flags bug (Jul 9 screenshot)
  garlic: { fromUnit: 'package', perBase: 5, eachIsPack: true, matchNullUnit: true },            // habitual 5-head pack; name-size alias also covers labeled lines
  chocolate_100: { fromUnit: 'package', perBase: 8, eachIsPack: true, matchNullUnit: true },
  beef_stock: { fromUnit: 'package', perBase: 4, eachIsPack: true, matchNullUnit: true },
  tofu: { fromUnit: 'package', perBase: 1, eachIsPack: true, matchNullUnit: true },
  baby_gold_potatoes: { fromUnit: 'package', perBase: 1.5, eachIsPack: true, matchNullUnit: true }, // Kevin correction Jul 6: the bag is ALWAYS 1.5 lb (was seeded as 2)
  red_wine: { fromUnit: 'package', perBase: 3.17, fixedCount: true, matchNullUnit: true, eachIsPack: true },
  // v2 additions — physical invariants:
  eggs: { fromUnit: 'dozen', perBase: 12, eachIsPack: true, matchNullUnit: true }, // a dozen is 12; carton rings up flat
  white_wine: { fromUnit: 'package', perBase: 3.17, matchNullUnit: true, eachIsPack: true }, // 750 ml ≈ 3.17 cups
  sherry: { fromUnit: 'package', perBase: 3.17, matchNullUnit: true, eachIsPack: true },
  bourbon: { fromUnit: 'package', perBase: 3.17, matchNullUnit: true, eachIsPack: true },
  evaporated_milk: { fromUnit: 'package', perBase: 1.5, matchNullUnit: true, eachIsPack: true }, // 12 fl-oz can = 1.5 cups
  saffron: { fromUnit: 'package', perBase: 4, eachIsPack: true, matchNullUnit: true }, // HEB 0.018oz bag = 4 pinches ($4.68 → $1.17/pinch, Kevin-verified Jul 4)
  // ── Kevin's habitual products (pack sizes confirmed Jul 5) ──────────────
  // peanut_butter deliberately NOT seeded: he buys Peter Pan 40 oz when
  // available but falls back to smaller jars, and the 'half-jar' costing unit
  // was defined against a small jar — a fixed divisor would be wrong by ~2.5×.
  // The needsConversion popup asks per purchase instead.
  soy: { fromUnit: 'package', perBase: 67.6, eachIsPack: true, matchNullUnit: true },        // Kikkoman usukuchi 33.8 fl oz = 67.6 tbsp
  light_soy: { fromUnit: 'package', perBase: 67.6, eachIsPack: true, matchNullUnit: true },  // usukuchi IS light soy — same bottle
  oyster_sauce: { fromUnit: 'package', perBase: 40.4, eachIsPack: true, matchNullUnit: true }, // Thai (Maekrua-style) 20.2 fl oz = 40.4 tbsp
  fish_sauce: { fromUnit: 'package', perBase: 34, eachIsPack: true, matchNullUnit: true },   // Red Boat 40°N 17 fl oz = 34 tbsp
  doubanjiang: { fromUnit: 'package', perBase: 28, eachIsPack: true, matchNullUnit: true },  // Pixian 3-yr 17.6 oz (500 g) ÷ ~18 g/tbsp ≈ 28 tbsp
  chinkiang: { fromUnit: 'package', perBase: 37.2, eachIsPack: true, matchNullUnit: true },  // 550 ml = 37.2 tbsp
  shaoxing: { fromUnit: 'package', perBase: 3.17, eachIsPack: true, matchNullUnit: true },   // 750 ml = 3.17 cups
  cocoa: { fromUnit: 'package', perBase: 42, eachIsPack: true, matchNullUnit: true },        // Guittard 8 oz (227 g) ÷ ~5.4 g/tbsp ≈ 42 tbsp
  baking_soda: { fromUnit: 'package', perBase: 31.5, eachIsPack: true, matchNullUnit: true },// 454 g box ÷ ~14.4 g/tbsp ≈ 31.5 tbsp
  baking_powder: { fromUnit: 'package', perBase: 20, eachIsPack: true, matchNullUnit: true },// 8.1 oz (230 g) ÷ ~11.5 g/tbsp ≈ 20 tbsp
  vanilla: { fromUnit: 'package', perBase: 32, eachIsPack: true, matchNullUnit: true },      // Hill Country Fare imitation 16 fl oz = 32 tbsp (homemade REAL extract never hits a receipt as itself)
  molasses: { fromUnit: 'package', perBase: 24, eachIsPack: true, matchNullUnit: true },     // Brer Rabbit blackstrap 12 fl oz = 24 tbsp
  white_karo: { fromUnit: 'package', perBase: 2, eachIsPack: true, matchNullUnit: true },    // 16 fl oz = 2 cups (HEB brand same size)
  heavy_cream: { fromUnit: 'package', perBase: 2, eachIsPack: true, matchNullUnit: true },   // HEB pint = 2 cups (prints Ea, volume table can't see it)
  canola_oil: { fromUnit: 'package', perBase: 24, eachIsPack: true, matchNullUnit: true },   // Kevin buys neutral oil in 1.5-gal jugs = 24 cups
  vegetable_oil: { fromUnit: 'package', perBase: 24, eachIsPack: true, matchNullUnit: true },
  oil_generic: { fromUnit: 'package', perBase: 24, eachIsPack: true, matchNullUnit: true },
  // ── Jul 9 resweep: portion-unit ingredients that had NO pack coverage ────
  white_sugar: { fromUnit: 'package', perBase: 9, eachIsPack: true, matchNullUnit: true },        // 4 lb bag ≈ 9 cups
  brown_sugar: { fromUnit: 'package', perBase: 4.1, eachIsPack: true, matchNullUnit: true },      // 2 lb bag ≈ 4.1 packed cups
  dark_brown_sugar: { fromUnit: 'package', perBase: 4.1, eachIsPack: true, matchNullUnit: true },
  honey: { fromUnit: 'package', perBase: 16, eachIsPack: true, matchNullUnit: true },             // 12 oz bear ≈ 16 tbsp
  toasted_sesame: { fromUnit: 'package', perBase: 11, eachIsPack: true, matchNullUnit: true },    // Kadoya 5.5 fl oz = 11 tbsp
  dark_soy: { fromUnit: 'package', perBase: 33.8, eachIsPack: true, matchNullUnit: true },        // 500 ml bottle = 33.8 tbsp
  fermented_black_beans: { fromUnit: 'package', perBase: 22, eachIsPack: true, matchNullUnit: true }, // 8 oz bag ÷ ~10 g/tbsp ≈ 22 (approx — ask-once refines)
  worcestershire: { fromUnit: 'package', perBase: 20, eachIsPack: true, matchNullUnit: true },    // 10 fl oz = 20 tbsp
  marsala: { fromUnit: 'package', perBase: 3.17, eachIsPack: true, matchNullUnit: true },         // 750 ml = 3.17 cups
  whole_grain_mustard: { fromUnit: 'package', perBase: 8, eachIsPack: true, matchNullUnit: true },// 8 oz jar
  olive_oil: { fromUnit: 'package', perBase: 16.9, eachIsPack: true, matchNullUnit: true },       // Graza Drizzle 500 ml = 16.9 fl oz (documented habitual)
  olive_oil_cooking: { fromUnit: 'package', perBase: 25.4, eachIsPack: true, matchNullUnit: true },// Graza Sizzle 750 ml = 25.4 fl oz (documented habitual)
  fennel_seeds: { fromUnit: 'package', perBase: 27, eachIsPack: true, matchNullUnit: true },      // ~1.9 oz jar ÷ ~2 g/tsp ≈ 27 tsp (approx)
  five_spice: { fromUnit: 'package', perBase: 21, eachIsPack: true, matchNullUnit: true },        // ~1.75 oz jar ≈ 21 tsp (approx)
  sichuan_pepper: { fromUnit: 'package', perBase: 35, eachIsPack: true, matchNullUnit: true },    // H-Mart ~2 oz bag ≈ 35 tsp (approx)
  chili_flakes: { fromUnit: 'package', perBase: 14, eachIsPack: true, matchNullUnit: true },      // 2.6 oz jar ≈ 14 tbsp (approx)
  chicken_stock: { fromUnit: 'package', perBase: 4, eachIsPack: true, matchNullUnit: true },      // 32 oz carton = 4 cups (mirror of beef_stock)
  // Deliberately ABSENT (variable containers — the ask-once flow is correct):
  // sodium_citrate (bag sizes vary 100 g-500 g), peanut_butter (documented),
  // vanilla_extract + chili_oil (house-made, never on receipts as themselves),
  // espresso, bay_leaf (rare, trivial), lime_juice (rings up as LIMES).
};

// Average weights (lb per each) for produce that rings up EITHER per piece or
// by weight. Used BIDIRECTIONALLY by convertPerUnit:
//   ingredient costed per-each, receipt priced per-lb  → $/lb × lbPerEach
//   ingredient costed per-lb,  receipt priced per-each → $/each ÷ lbPerEach
const AVG_WEIGHT_LB = {
  onion: 0.6,           // costed per each
  red_onion: 0.6,       // costed per each
  lemon: 0.25,          // per each
  lime: 0.17,           // per each
  apple: 0.4,           // per each
  green_bell_pepper: 0.4, // per each
  fennel_bulb: 0.8,     // per each
  celery: 1.3,          // per head
  cantaloupe: 3.0,      // per each
  garlic: 0.12,         // per head (loose, weighed)
  pineapple: 4.0,       // per container(=fruit)
  kabocha: 2.5,         // costed per LB; whole squash ≈ 2.5 lb (Kevin-confirmed)
};
const EACHISH_UNITS = new Set(['each', 'head', 'container']);

// Jul 13: JUMBO produce weighs more than the standard AVG_WEIGHT_LB entry —
// a jumbo onion ≈ 0.85 lb vs 0.6 standard (Kevin default, Jul 13). Applied
// ONLY when the receipt NAME says JUMBO, and ONLY in the per-each → per-lb
// direction (the "JUMBO RED ONION 2 Ea @ 2.99 recorded as $2.99/each" bug):
// an each-priced jumbo divides by its real weight so the derived per-lb
// tracks whatever the receipt each-price is (2.99 / 0.85 ≈ $3.52/lb). The
// lb → each direction keeps the standard weight so existing weighed-line
// behavior is untouched. Bridges the UNIT, never hardcodes a price.
const JUMBO_AVG_WEIGHT_LB = { onion: 0.85, red_onion: 0.85 };
const JUMBO_NAME_RE = /\bjumbo\b/i;

// ═══ v3: NAME-SIZE EXTRACTION ═══════════════════════════════════════════════
// Receipts constantly put the pack size IN THE NAME while printing only a
// line total: "10 CT FLOUR TORTILLA", "POTATO BABY MEDLEY 1.5LB",
// "GARLIC PK 5PC", "HEB ... BUTTER QTR", "1 GALLON WHOLE MILK". Before v3 the
// engine only converted off a PRINTED per-unit rate, so all of these dumped
// Kevin into manual math. This extractor returns every size/count candidate
// found in the name; the classifier tries each through the normal conversion
// path and uses the first that reaches the ingredient's costing unit. Reading
// the count from THIS receipt (10 CT vs 20 CT tortillas) beats hardcoding.
const NAME_SIZE_PATTERNS = [
  // counts: "10 CT", "20CT", "8 COUNT", "5 PC", "PK 5PC", "5 PACK"
  { re: /\b(?:pk|pack)\s*(\d+)\s*pc\b/i, unit: 'count' },
  { re: /\b(\d+)\s*(?:ct|count|pc)\b/i, unit: 'count' },
  { re: /\b(\d+)\s*pack\b/i, unit: 'count' },
  { re: /\b(?:dozen|doz)\b/i, unit: 'count', qty: 12 },
  // volumes: "1 GALLON", "0.5 GAL", "HALF GALLON", "750 ML", "1 L", "12 FL OZ"
  { re: /\bhalf\s*gal(?:lon)?\b/i, unit: 'gallon', qty: 0.5 },
  { re: /(\d+(?:\.\d+)?)\s*gal(?:lon)?s?\b/i, unit: 'gallon' },
  { re: /(\d+(?:\.\d+)?)\s*(?:qt|quart)s?\b/i, unit: 'quart' },
  { re: /(\d+(?:\.\d+)?)\s*(?:pt|pint)s?\b/i, unit: 'pint' },
  { re: /(\d+(?:\.\d+)?)\s*fl\.?\s*oz\b/i, unit: 'fl_oz' },
  { re: /(\d+(?:\.\d+)?)\s*(?:ml)\b/i, unit: 'ml' },
  { re: /(\d+(?:\.\d+)?)\s*(?:l|liter|litre)s?\b/i, unit: 'liter' },
  // weights: "1.5LB", "2#", "16 OZ" (oz is ambiguous — classifier retries as fl_oz), "500 G"
  { re: /(\d+(?:\.\d+)?)\s*(?:lb|lbs)\.?\b/i, unit: 'lb' },
  { re: /(\d+(?:\.\d+)?)\s*#/, unit: 'lb' },
  { re: /(\d+(?:\.\d+)?)\s*oz\b/i, unit: 'oz' },
  { re: /(\d+(?:\.\d+)?)\s*(?:kg)\b/i, unit: 'kg' },
  { re: /(\d+(?:\.\d+)?)\s*g\b/i, unit: 'g' },
];
export function extractNameSizes(itemName) {
  const name = String(itemName || '');
  const out = [];
  for (const p of NAME_SIZE_PATTERNS) {
    const m = name.match(p.re);
    if (!m) continue;
    const qty = p.qty != null ? p.qty : Number(m[1]);
    if (!(qty > 0)) continue;
    out.push({ qty, unit: p.unit, token: m[0].trim() });
  }
  // "BUTTER QTR" — H-E-B's quarters box is 1 lb of quarter-stick butter.
  // Butter-specific by design; QTR means nothing sizewise on other items.
  if (/\bbutter\b/i.test(name) && /\bqtr\b/i.test(name)) {
    out.push({ qty: 1, unit: 'lb', token: 'QTR' });
  }
  return out;
}

// How many countables does the ingredient's costing unit represent?
// tortillas are costed per '10ct' (=10), eggs per each (=1), a dozen is 12.
export function countBaseOf(toUnit) {
  if (!toUnit) return null;
  const m = String(toUnit).toLowerCase().match(/^(\d+)\s*ct$/);
  if (m) return Number(m[1]);
  if (/^(each|head|container|block|can|jar|carton|package|bottle|piece)$/i.test(toUnit)) return 1;
  if (/^dozen$/i.test(toUnit)) return 12;
  return null;
}

// ═══ v3: SOLD-BY-EACH (Kevin's store facts, Jul 6) ══════════════════════════
// These ring up with a weight flag (FW) or no unit at H-E-B but are SOLD per
// piece/bunch — the line total IS the per-each price. Melons, pineapple,
// herbs, scallions, fennel, sweet bulb onions, garlic. Kills the
// "confirm this equals one bunch" prompt for the whole category.
const SOLD_BY_EACH = new Set([
  'cantaloupe', 'pineapple',
  'cilantro', 'basil', 'mint', 'thyme_fresh', 'herb_generic',
  'scallions', 'fennel_bulb', 'bulb_onion', 'garlic',
]);
const EACHISH_TO_UNITS = new Set(['each', 'head', 'container', 'bunch']);

// ═══ v3: WINE VARIETAL → TYPE ════════════════════════════════════════════════
// Wine receipt names never say "red wine" — they say the varietal or the
// producer ("LA VIEILLE FERME ROUGE"). Map the common ones. If a name somehow
// hits BOTH lists, both candidates surface and the family tie sends it to
// review instead of guessing.
const RED_WINE_RE = /\b(cabernet|cab\s*sauv\w*|merlot|pinot\s*noir|malbec|syrah|shiraz|zinfandel|grenache|garnacha|sangiovese|chianti|rioja|tempranillo|primitivo|barbera|nebbiolo|bordeaux|beaujolais|rouge|red\s*blend|c[oô]tes?\s*du\s*rh[oô]ne)\b/i;
const WHITE_WINE_RE = /\b(sauvignon\s*blanc|sauv\s*blanc|chardonnay|pinot\s*gri(?:gio|s)|riesling|albari[nñ]o|gr[uü]ner|viognier|vermentino|vinho\s*verde|ch[eé]nin|moscato|gew[uü]rztraminer|white\s*blend|\bblanc\b)\b/i;
export function wineHint(itemName) {
  const name = String(itemName || '');
  const red = RED_WINE_RE.test(name);
  const white = WHITE_WINE_RE.test(name);
  if (red && white) return 'both';
  if (red) return 'red_wine';
  if (white) return 'white_wine';
  return null;
}

// Ingredient units that are PORTIONS of a purchased package — a receipt line
// priced per package can never be recorded per one of these without knowing
// the pack size. Triggers the needsConversion prompt (unless a PACK_OVERRIDE
// or learned alias.packQty already answers it).
const PORTION_UNITS = new Set(['tbs', 'tbsp', 'tsp', 'cup', 'shot', 'square', 'stick', 'pinch', 'knob', 'clove', 'sprig', 'leaf', 'half-jar', 'g', 'fillet']); // g + fillet added Jul 9: gram-unit items (sodium citrate) were skipping the ask flow and landing as scary line-total prices

// Convert a per-unit price FROM the receipt unit INTO the ingredient's costing
// unit. Returns { perUnit, factor, fromUnit, toUnit } or null (not convertible
// or not needed).
export function convertPerUnit(perUnit, fromUnit, toUnit, ingredientId, opts = {}) {
  if (perUnit == null) return null;
  // 1) fixed pack override
  const ov = ingredientId && PACK_OVERRIDE[ingredientId];
  if (ov && fromUnit === ov.fromUnit) {
    return { perUnit: round3(perUnit / ov.perBase), factor: ov.perBase, fromUnit, toUnit };
  }
  // 2) avg-weight bridge, both directions
  const w = ingredientId && AVG_WEIGHT_LB[ingredientId];
  if (w && toUnit && EACHISH_UNITS.has(toUnit) && fromUnit === 'lb') {
    return { perUnit: round3(perUnit * w), factor: w, fromUnit, toUnit };
  }
  // each → lb: jumbo-aware (see JUMBO_AVG_WEIGHT_LB). opts.itemName is the
  // raw receipt name; absent or non-jumbo falls back to the standard weight.
  let wEachToLb = w;
  if (ingredientId && opts && opts.itemName && JUMBO_NAME_RE.test(String(opts.itemName))
      && JUMBO_AVG_WEIGHT_LB[ingredientId] != null) {
    wEachToLb = JUMBO_AVG_WEIGHT_LB[ingredientId];
  }
  if (wEachToLb && toUnit === 'lb' && fromUnit && EACHISH_UNITS.has(fromUnit)) {
    return { perUnit: round3(perUnit / wEachToLb), factor: 1 / wEachToLb, fromUnit, toUnit };
  }
  if (!fromUnit || !toUnit || fromUnit === toUnit) return null;
  const fam = UNIT_FAMILY[fromUnit];
  if (!fam || fam !== UNIT_FAMILY[toUnit]) return null;
  const perBase = perUnit / TO_BASE[fromUnit];
  const out = perBase * TO_BASE[toUnit];
  const factor = TO_BASE[fromUnit] / TO_BASE[toUnit];
  return { perUnit: round3(out), factor, fromUnit, toUnit };
}

const round3 = (n) => Math.round(n * 1000) / 1000;
const round = (n) => Math.round(n * 1000) / 1000;

// ── ingredient families (substitution layer) ───────────────────────────────
// Members of a family are plausible stand-ins for one another on a receipt —
// when one member matches weakly, ALL members are suggested as candidates. A
// same-family near-tie is never auto-matched: it goes to review with the
// family called out ("these are interchangeable for costing — which one?").
// `interchange: true` = functionally the same thing for costing (Kevin's
// bone-in shoulder vs boneless butt case); otherwise members are distinct
// ingredients that receipts easily confuse.
export const FAMILIES = [
  { id: 'pork_cuts', members: ['pork_butt', 'pork_shoulder'], interchange: true, tokens: ['pork', 'shoulder', 'butt', 'boston', 'picnic'] },
  { id: 'chicken_cuts', members: ['chicken_thighs', 'chicken_breast'], tokens: ['chicken', 'thigh', 'thighs', 'breast', 'brst', 'thgh'] },
  { id: 'onions', members: ['onion', 'red_onion', 'sweet_onion', 'bulb_onion'], tokens: ['onion'] },
  { id: 'potatoes', members: ['red_potatoes', 'baby_gold_potatoes'], tokens: ['potato', 'potatoe'] },
  { id: 'sugars', members: ['white_sugar', 'brown_sugar', 'dark_brown_sugar'], tokens: ['sugar'] },
  { id: 'soy_sauces', members: ['soy', 'dark_soy', 'light_soy'], tokens: ['soy'] },
  { id: 'stocks', members: ['chicken_stock', 'chicken_basics_stock', 'beef_stock'], tokens: ['stock', 'broth'] },
  { id: 'canned_tomatoes', members: ['tomato_can', 'peeled_tomatoes'], tokens: ['tomato', 'tomatoe'] },
  { id: 'dried_chiles', members: ['chilis', 'dried_peppers', 'ancho_chili'], tokens: ['chile', 'chili', 'chilis', 'ancho', 'guajillo', 'arbol', 'pepper'] },
  { id: 'wines', members: ['red_wine', 'white_wine'], tokens: ['wine', 'cabernet', 'pinot', 'chardonnay', 'sauvignon', 'merlot'] },
  { id: 'neutral_oils', members: ['canola_oil', 'vegetable_oil', 'oil_generic'], tokens: ['canola', 'vegetable oil'] },
  { id: 'ground_meats', members: ['ground_beef', 'ground_pork', 'ground_chicken', 'ground_lamb'], tokens: ['ground', 'grnd'] },
  // Kevin's "Asian greens" = whatever looks good at H-Mart, usually gai lan or
  // a choy. Gai lan is AMBIGUOUS by his own usage (it's also the dedicated
  // chinese_broccoli dish ingredient at a different price) → review, not auto.
  { id: 'asian_leafy', members: ['asian_greens', 'chinese_broccoli'], tokens: ['choy', 'gai', 'lan', 'bok', 'yu'] },
];
const FAMILY_BY_MEMBER = {};
FAMILIES.forEach(f => f.members.forEach(m => { FAMILY_BY_MEMBER[m] = f; }));

function familiesTriggeredByTokens(nameTokens) {
  const hits = new Set();
  for (const f of FAMILIES) {
    for (const t of f.tokens) {
      if (t.includes(' ')) { // phrase token
        if (nameTokens.join(' ').includes(t)) { hits.add(f); break; }
      } else if (nameTokens.includes(t)) { hits.add(f); break; }
    }
  }
  return [...hits];
}

// ── fuzzy scoring ──────────────────────────────────────────────────────────
function tokens(s) {
  return normalizeIngredientName(s).split(' ').filter(Boolean);
}
export function scoreNamePair(receiptName, ingredientName) {
  const a = new Set(tokens(receiptName));
  const b = new Set(tokens(ingredientName));
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const dice = (2 * inter) / (a.size + b.size);
  // Jul 13 (3b): the prefix bonus is GATED behind a shared full token. An OCR
  // fragment that only prefix-overlaps a real ingredient ("MUSHRO…") must
  // score 0, not 0.15 — prefix-only overlap can no longer nudge junk toward
  // the review band. With a real shared token the bonus works as before.
  let prefixHit = 0;
  if (inter > 0) {
    for (const ra of a) {
      for (const ib of b) {
        if (ra.length >= 3 && (ib.startsWith(ra) || ra.startsWith(ib))) { prefixHit = 0.15; break; }
      }
      if (prefixHit) break;
    }
  }
  return Math.min(1, dice + prefixHit);
}

// Confidence bands. TIMID on purpose: wrong cost data is the cardinal sin.
//   ≥ AUTO_SCORE with a clear margin, sane price, no family tie → auto match
//   ≥ FUZZY_WEAK or any family trigger                          → review (ask)
//   below                                                        → unmatched
export const FUZZY_STRONG = 0.6;   // kept for back-compat (v1 threshold)
export const FUZZY_WEAK = 0.34;
export const AUTO_SCORE = 0.72;    // v2: auto needs more than v1's 0.6…
export const AUTO_MARGIN = 0.15;   // …AND daylight over the runner-up
export const PRICE_OUTLIER_HI = 2.5; // derived per-unit > 2.5× current → suspicious
export const PRICE_OUTLIER_LO = 0.4; // < 0.4× current → suspicious

// Jul 13 (3a): FUSED-LINE GUARD. OCR / photo extraction sometimes welds two
// physical receipt lines into one item_name ("HEB WHOLE PEELED TOMATOES 4 LA
// VAQUITA OAXACA" — a tomato line plus line #4, the Oaxaca cheese). The tell:
// a 1-2 digit H-E-B line number sitting MID-name, followed by two or more
// product words. Wrong cost data is the cardinal sin, so a fused name routes
// to UNMATCHED for manual mapping instead of letting the fuzzy matcher bind
// half of a chimera. Size/unit tokens after the digits (CT/PK/OZ/LB…) are
// exempt — those are pack sizes, not line numbers — and digit-digit runs
// ("SHRIMP … 31 40 HLS") never match because the word after the number must
// start with a letter.
const FUSED_LINE_RE = /\S\s+\d{1,2}\s+(?!(?:CT|COUNT|PK|PACK|PC|PIECE|OZ|LB|LBS|POUND|POUNDS|EA|EACH|PT|PINT|QT|QUART|GAL|GALLON|HALF|ML|L|LITER|LITRE|G|KG|FL|X|DOZEN|DOZ)\b)[A-Z][A-Z'&.\/-]+\s+[A-Z][A-Z0-9'&.\/-]+/;
export function looksFusedLine(itemName) {
  return FUSED_LINE_RE.test(String(itemName || ''));
}

// ── line classification ─────────────────────────────────────────────────────
// Alias map: key = normalizeIngredientName(item_name), value =
//   { ingredientId?, action?: 'IGNORE_ALWAYS', pricing?: 'FLAT', packQty?: number }
//   packQty (v2, learned): costing units contained in ONE package/each of this
//   exact receipt item. Set once from the needsConversion prompt.

export function derivePerUnit(line) {
  if (line.unit_price_printed != null) return { perUnit: line.unit_price_printed, basis: 'printed_unit_price' };
  if (line.weighed && line.quantity != null && line.line_total != null) {
    return { perUnit: round(line.line_total / line.quantity), basis: 'total_div_weight' };
  }
  // Bug-1 fix (Jul 13): a non-weighed EACH-style line ("3 @ 3.98 → 11.94",
  // unit Ea or none) carries qty × per-unit in line_total — divide, exactly
  // like onePackPriceFor already does for each-units, so the two functions
  // agree. Before this fix the raw line total leaked out as the per-unit
  // price (taglierini $11.94/pack, stock $11.92/carton, butter $3.88/stick).
  // Raw line_total remains the basis ONLY when quantity is null or 1. Sits
  // AFTER the weighed branch so weighed lines can never double-divide.
  {
    const u = normalizeUnit(line.unit);
    const eachStyle = !line.weighed && (u === 'each' || u == null);
    if (eachStyle && line.line_total != null && typeof line.quantity === 'number' && line.quantity > 1) {
      return { perUnit: round(line.line_total / line.quantity), basis: 'total_div_qty' };
    }
  }
  if (line.line_total != null) return { perUnit: line.line_total, basis: 'line_total' };
  return { perUnit: null, basis: null };
}

// ── C.5 (Jul 14): user-entered weight → per-unit price ──────────────────────
// Kevin enters what he KNOWS (the item weighed 1 lb 6 oz); the app computes
// what it needs ($5.98 ÷ 1.375 lb = $4.35/lb). Pure so the gate pins the math.
// Two entry modes: split lb+oz (either may be blank), or a single decimal-lb
// figure (pass decimalLb non-null to use it; it takes precedence when given).
// ingUnit is the INGREDIENT's costing unit and must be a weight unit — the
// result is priced per THAT unit (per-oz and per-g divide by the converted
// weight), so a per-oz ingredient gets a per-oz price, not per-lb.
// Returns { weightLb, perUnit } or null (non-weight unit, or any non-positive
// weight/total — a $0 or negative derivation must never reach a cost).
export const WEIGHT_ENTRY_UNITS = new Set(['lb', 'oz', 'g']);
const _OZ_PER_LB = 16, _G_PER_LB = 453.6;
export function perUnitFromUserWeight({ total, lb = 0, oz = 0, decimalLb = null, ingUnit = 'lb' }) {
  if (!WEIGHT_ENTRY_UNITS.has(ingUnit)) return null;
  const t = Number(total);
  if (!(t > 0) || !isFinite(t)) return null;
  const wLb = (decimalLb != null && decimalLb !== '')
    ? Number(decimalLb)
    : (Number(lb) || 0) + (Number(oz) || 0) / _OZ_PER_LB;
  if (!(wLb > 0) || !isFinite(wLb)) return null;
  const wInUnit = ingUnit === 'lb' ? wLb : (ingUnit === 'oz' ? wLb * _OZ_PER_LB : wLb * _G_PER_LB);
  return { weightLb: round(wLb), perUnit: round(t / wInUnit) };
}

export function onePackPriceFor(line, fromUnit) {
  if (line.unit_price_printed != null) return line.unit_price_printed;
  if (line.line_total == null) return null;
  const isEachUnit = fromUnit === 'each';
  const packsBought = (isEachUnit && typeof line.quantity === 'number' && line.quantity > 0) ? line.quantity : 1;
  return round(line.line_total / packsBought);
}

function classifyLine(line, seed, aliases, store) {
  const norm = normalizeIngredientName(line.item_name);
  const alias = aliases[norm];

  if (alias && alias.action === 'IGNORE_ALWAYS') {
    return { status: 'ignored', norm, line, reason: 'alias_ignore' };
  }
  // v3.4 learned auto-ignore: an unmatched item Kevin has left unmapped on 3+
  // receipts (MODELO ESPECIAL...) stops asking. Still mappable from the
  // ignored list; never applies once a real mapping exists.
  if (alias && !alias.ingredientId && (alias.seenUnmatched || 0) >= 3) {
    return { status: 'ignored', norm, line, reason: 'learned_ignore' };
  }

  const nameTokens = tokens(line.item_name);
  let ingredientId = null, candidates = [], via = null;
  const reasons = [];
  let confidence = 0;

  if (alias && alias.ingredientId) {
    ingredientId = alias.ingredientId;
    via = 'alias';
    confidence = 1;
  } else if (looksFusedLine(line.item_name)) {
    // 3a (Jul 13): fused two-line chimera — never classify, ask Kevin.
    return {
      status: 'unmatched', norm, line, candidates: [], suspectFusion: true,
      needsPrice: !!(line.weighed && line.quantity == null && line.unit_price_printed == null && line.line_total == null),
      reasons: ['looks like two receipt lines fused into one — map it manually'],
    };
  } else {
    const scoreById = {};
    const sharedById = {}; // 3b (Jul 13): does the receipt share ≥1 FULL token with this ingredient's name?
    const rTokens = new Set(nameTokens);
    seed.forEach(ing => {
      scoreById[ing.id] = scoreNamePair(line.item_name, ing.name);
      const ingToks = tokens(ing.name);
      sharedById[ing.id] = ingToks.some(t => rTokens.has(t));
      // exact token-set equality (both directions) — the only fuzzy match a
      // single-token receipt name is allowed to make (see below).
      sharedById[ing.id + '::exact'] = ingToks.length === rTokens.size && ingToks.every(t => rTokens.has(t));
    });
    // v3 wine layer: a varietal/producer name IS the identification. Boost the
    // matching wine id to auto-strength; 'both' boosts both, and the wines
    // family tie routes it to review instead of guessing.
    const wine = wineHint(line.item_name);
    const wineBoosted = new Set();
    if (wine === 'red_wine' || wine === 'both') { scoreById.red_wine = Math.max(scoreById.red_wine || 0, 0.9); wineBoosted.add('red_wine'); }
    if (wine === 'white_wine' || wine === 'both') { scoreById.white_wine = Math.max(scoreById.white_wine || 0, 0.9); wineBoosted.add('white_wine'); }
    // v3.4 negative learning: ingredients Kevin has re-mapped AWAY from for
    // this exact item name never auto-match again — capped below the auto
    // threshold so they stay visible in the picker but can't win silently.
    if (alias && Array.isArray(alias.rejected)) {
      for (const rid of alias.rejected) {
        if (scoreById[rid] != null) scoreById[rid] = Math.min(scoreById[rid], 0.5);
      }
    }
    // family layer: any triggered family injects ALL its members as candidates
    const trigFams = familiesTriggeredByTokens(nameTokens);
    const famBonus = {};
    // Triggered family members get +0.2, with a floor of 0.45 (the review
    // band): a receipt name like "YU CHOY" can share ZERO tokens with the
    // ingredient name ("Asian greens") and still must surface as a candidate.
    trigFams.forEach(f => f.members.forEach(m => {
      if (scoreById[m] != null) famBonus[m] = Math.max(famBonus[m] || 0, 0.2, 0.45 - (scoreById[m] || 0));
    }));
    // 3b eligibility (Jul 13) — timid on purpose, tightened harder:
    //   • a candidate at/above FUZZY_WEAK must share at least ONE FULL token
    //     with the receipt name, OR be family-injected (curated token lists —
    //     "YU CHOY" sharing zero name tokens with "Asian greens" is by
    //     design), OR be wine-boosted (the varietal IS the identification).
    //     Prefix-only overlap alone can no longer mint a review card.
    //   • a receipt name with ≤1 usable token is treated as a probable OCR
    //     fragment: it may only bind on an EXACT name match ("CILANTRO" →
    //     Cilantro still works; "MUSHRO" or a lone "ONION" goes UNMATCHED,
    //     which is safe — Kevin maps it once and the alias remembers).
    const singleToken = nameTokens.length <= 1;
    const eligible = (id) => {
      if (wineBoosted.has(id)) return true;
      if (singleToken) return !!sharedById[id + '::exact'];
      return !!sharedById[id] || famBonus[id] != null;
    };
    const scored = seed
      .map(ing => ({
        id: ing.id, name: ing.name, unit: ing.unit,
        score: Math.min(1, (scoreById[ing.id] || 0) + (famBonus[ing.id] || 0)),
        family: FAMILY_BY_MEMBER[ing.id] ? FAMILY_BY_MEMBER[ing.id].id : null,
        interchange: FAMILY_BY_MEMBER[ing.id] ? !!FAMILY_BY_MEMBER[ing.id].interchange : false,
      }))
      .filter(x => x.score >= FUZZY_WEAK && eligible(x.id))
      .sort((a, b) => b.score - a.score);
    candidates = scored.slice(0, 5);

    // UPGRADE #4 (Jul 9): when the top two token scores are near-tied, break
    // the tie with Dice character-bigram similarity to the raw receipt name.
    // Token-containment says "habanero" and "tomato paste" both fit "HABANERO
    // PEPPERS" equally; Dice sees "habanero" is far closer to the actual
    // string and re-sorts. Only nudges within a genuine tie band so it never
    // overrides a clear token winner.
    if (candidates.length >= 2 && (candidates[0].score - candidates[1].score) < AUTO_MARGIN) {
      const band = candidates.filter(c => candidates[0].score - c.score < AUTO_MARGIN);
      if (band.length >= 2) {
        band.forEach(c => { c.dice = diceCoefficient(line.item_name, c.name); });
        band.sort((a, b) => (b.score + b.dice * 0.5) - (a.score + a.dice * 0.5));
        // rebuild candidate order with the re-ranked band on top
        const rest = candidates.filter(c => !band.includes(c));
        candidates = [...band, ...rest].slice(0, 5);
      }
    }

    if (candidates.length) {
      const top = candidates[0];
      const runner = candidates[1];
      const margin = runner ? top.score - runner.score : 1;
      // Interchange families (pork butt ≈ shoulder): the same physical item can
      // feed BOTH ingredient ids, so whenever two members co-appear we ask —
      // the review UI offers each member plus "apply to both". Non-interchange
      // families only block auto on a genuine near-tie.
      const interTie = top.interchange && candidates.some((c, i) => i > 0 && c.family === top.family);
      const sameFamilyTie = interTie || (runner && top.family && top.family === runner.family && margin < AUTO_MARGIN);
      confidence = top.score;
      if (top.score >= AUTO_SCORE && margin >= AUTO_MARGIN && !sameFamilyTie) {
        ingredientId = top.id;
        via = 'fuzzy';
      } else {
        if (sameFamilyTie) reasons.push(top.interchange
          ? 'interchangeable cuts — pick one, or apply the price to both'
          : 'two similar ingredients fit this — pick which you bought');
        else if (top.score < AUTO_SCORE) reasons.push('name match is not strong enough to trust automatically');
        else if (margin < AUTO_MARGIN) reasons.push('a second ingredient scores nearly as high');
      }
    }
  }

  const aliasFlat = alias && alias.pricing === 'FLAT';
  const weighedNoWeight = line.weighed && (line.quantity == null) && (line.unit_price_printed == null);
  const needsPrice = !aliasFlat && weighedNoWeight && (line.line_total == null);

  const seedIng = ingredientId ? seed.find(s => s.id === ingredientId) : null;

  if (!ingredientId) {
    if (candidates.length) {
      // v2: mid-band goes to review — the "I'm unsure, how should I proceed?" bucket
      return { status: 'review', norm, line, candidates, reasons, confidence, needsPrice };
    }
    return { status: 'unmatched', norm, line, candidates, needsPrice };
  }
  if (needsPrice) {
    return { status: 'needsPrice', norm, line, ingredientId, ingredient: seedIng, via, candidates, reason: 'weighed_no_weight' };
  }

  // matched & priced — derive a raw figure and tag the basis.
  let { perUnit, basis } = derivePerUnit(line);
  let conversion = null;
  const fromUnit = normalizeUnit(line.unit);
  const toUnit = seedIng ? seedIng.unit : null;
  const packOv = ingredientId ? PACK_OVERRIDE[ingredientId] : null;
  // Reference price (current, falling back to baseline) — hoisted Jul 13 so
  // the pack-override piece-vs-pack tiebreak below can use the same figure
  // the price-sanity check uses. Pure read; the (e) check consumes this too.
  const ref = seedIng ? (typeof seedIng.current === 'number' && seedIng.current > 0 ? seedIng.current
    : (typeof seedIng.baseline === 'number' && seedIng.baseline > 0 ? seedIng.baseline : null)) : null;

  // ── B (Jul 14): POST-EXTRACTION QUANTITY REPAIR ────────────────────────────
  // The photo path drops the small "N Ea. @ ..." detail on some lines, so a
  // multi-pack buy arrives as quantity:null with only the line total. With a
  // LEARNED pack size (alias.packQty) and a reference price, the expected
  // one-pack price is known — when the line total is a clean integer multiple
  // of it (within 3%), the integer IS the package count. Back-fill quantity +
  // unit_price_printed and re-derive, so the pack conversion below divides by
  // the real count instead of treating N packages as one (the 4-carton stock
  // bug: $11.92 read as one carton → $2.98/cup, 4× high). Never fires without
  // a learned packQty (an unlearned pack still asks via needsConversion),
  // never on weighed lines, and confidenceTier caps the result at 'check' —
  // an inferred count is shown with its math, never silently auto-accepted.
  let qtyInference = null;
  if (basis === 'line_total' && line.quantity == null && !line.weighed
      && (fromUnit === 'each' || !fromUnit)
      && alias && alias.packQty > 0 && ref != null && line.line_total > 0) {
    const expectedPack = ref * alias.packQty;
    if (expectedPack > 0) {
      const ratio = line.line_total / expectedPack;
      const n = Math.round(ratio);
      if (n >= 2 && n <= 12 && Math.abs(ratio - n) / n <= 0.03) {
        const perPack = round(line.line_total / n);
        line = { ...line, quantity: n, unit_price_printed: perPack };
        ({ perUnit, basis } = derivePerUnit(line));
        qtyInference = { qty: n, perPack, basis: 'inferred_from_history', expectedPack: round(expectedPack) };
        reasons.push(`quantity missing on the line: the total is ${n} times the usual $${perPack} package, so ${n} packages were inferred (confirm)`);
      }
    }
  }

  // (a) learned per-alias pack size — ask-once-convert-forever (checked before
  // the hardcoded overrides so a learned answer always wins)
  if (alias && alias.packQty > 0 && (basis === 'printed_unit_price' || basis === 'line_total' || basis === 'total_div_qty') && line.line_total != null) {
    const onePack = onePackPriceFor(line, fromUnit);
    if (onePack != null) {
      perUnit = round(onePack / alias.packQty);
      conversion = { fromUnit: fromUnit || 'package', toUnit, factor: alias.packQty, basis: 'learned_pack' };
      basis = 'converted';
    }
  }

  // (b) fixed pack override
  const packUnitLooksSingle = packOv && (
    fromUnit === packOv.fromUnit ||
    (fromUnit === 'each' && packOv.eachIsPack) ||
    (!fromUnit && (packOv.eachIsPack || packOv.matchNullUnit))
  );
  if (basis !== 'converted' && packOv && (basis === 'printed_unit_price' || basis === 'line_total' || basis === 'total_div_qty') && line.line_total != null && packUnitLooksSingle) {
    const onePack = onePackPriceFor(line, fromUnit);
    const divided = round(onePack / packOv.perBase);
    // Piece-vs-pack tiebreak (Jul 13, the butter-sticks case): "4 Ea. @ 1/
    // 0.97 → 3.88" itemizes the pack's PIECES (four quarter-sticks of ONE
    // 1-lb box), so each Ea is already one costing unit and dividing by the
    // pack size again would be wrong by 4×. Only on multi-qty each-style
    // lines with a reference price: when the divided price FAILS the
    // existing sanity band and the per-piece price PASSES it, take the
    // per-piece reading. Any ambiguity keeps today's divide (and the price
    // sanity check downstream still flags a bad result). qty-1 lines are
    // untouched: "1 Ea @ 3.88" is one whole box, divide as always.
    const qtyN = Number(line.quantity);
    const eachish = fromUnit === 'each' || !fromUnit;
    let usePiece = false;
    if (eachish && qtyN > 1 && ref != null && onePack != null) {
      const sane = (v) => v >= ref * PRICE_OUTLIER_LO && v <= ref * PRICE_OUTLIER_HI;
      if (!sane(divided) && sane(onePack)) usePiece = true;
    }
    if (usePiece) {
      perUnit = round(onePack);
      conversion = { fromUnit: fromUnit || 'each', toUnit, factor: 1, basis: 'piece_price' };
      basis = 'converted';
    } else {
      perUnit = divided;
      conversion = { fromUnit: packOv.fromUnit, toUnit, factor: packOv.perBase, basis: 'pack' };
      basis = 'converted';
    }
  }

  // (b2) v3 SOLD-BY-EACH: rings up with a weight flag (or no unit) but is sold
  // per piece/bunch — the one-pack price IS the per-each price. Direct when the
  // costing unit is each-ish; otherwise bridge through 'each' (avg-weight).
  if (basis !== 'converted' && (SOLD_BY_EACH.has(ingredientId) || (alias && alias.soldByEach))
      && (line.weighed || !fromUnit) && line.line_total != null
      && (basis === 'line_total' || basis === 'printed_unit_price' || basis === 'total_div_qty')
      // An explicit size/count in the NAME (GARLIC PK 5PC) is more specific
      // than the category rule — let name-size handle those instead.
      && extractNameSizes(line.item_name).length === 0) {
    const onePack = onePackPriceFor(line, fromUnit);
    if (onePack != null) {
      if (EACHISH_TO_UNITS.has(toUnit)) {
        perUnit = round(onePack);
        conversion = { fromUnit: 'each', toUnit, factor: 1, basis: 'sold_by_each' };
        basis = 'converted';
      } else {
        const conv = convertPerUnit(onePack, 'each', toUnit, ingredientId, { itemName: line.item_name });
        if (conv) {
          perUnit = conv.perUnit;
          conversion = { fromUnit: 'each', toUnit: conv.toUnit, factor: conv.factor, basis: 'sold_by_each' };
          basis = 'converted';
        }
      }
    }
  }

  // (b3) v3 NAME-SIZE: the pack size/count is printed in the NAME while the
  // line carries only a total (or a per-package price). Try every extracted
  // candidate through the normal conversion path; first one that reaches the
  // costing unit wins. Reads THIS receipt's size (10 CT vs 20 CT), never a
  // hardcoded assumption. The price-sanity check downstream still guards a
  // misread token.
  if (basis !== 'converted' && (basis === 'line_total' || basis === 'total_div_qty' || (basis === 'printed_unit_price' && (!fromUnit || fromUnit === 'each' || fromUnit === 'package' || fromUnit === 'box')))
      && line.line_total != null) {
    const onePack = onePackPriceFor(line, fromUnit);
    if (onePack != null) {
      const sizes = extractNameSizes(line.item_name);
      for (const s of sizes) {
        if (s.unit === 'count') {
          const tc = countBaseOf(toUnit);
          if (tc != null) {
            perUnit = round(onePack * tc / s.qty);
            conversion = { fromUnit: `${s.qty}-count pack`, toUnit, factor: s.qty / tc, basis: 'name_size' };
            basis = 'converted';
            break;
          }
          continue;
        }
        const perNameUnit = onePack / s.qty;
        let conv = convertPerUnit(perNameUnit, s.unit, toUnit, ingredientId);
        // 'OZ' in a name is ambiguous weight/volume — retry as fluid for
        // volume-costed ingredients.
        if (!conv && s.unit === 'oz') conv = convertPerUnit(perNameUnit, 'fl_oz', toUnit, ingredientId);
        if (conv) {
          perUnit = conv.perUnit;
          conversion = { fromUnit: `${s.qty} ${s.unit} (from name)`, toUnit: conv.toUnit, factor: conv.factor, basis: 'name_size' };
          basis = 'converted';
          break;
        }
      }
    }
  }

  if (basis !== 'converted' && perUnit != null && (basis === 'printed_unit_price' || basis === 'total_div_weight' || basis === 'total_div_qty')) {
    // (c) real per-unit price in a different unit → table/bridge conversion.
    // total_div_qty (Jul 13) is a genuine per-each rate — "2 Ea @ 2.99" — so
    // it converts here like a printed rate (JUMBO RED ONION each → per-lb).
    // Photo extractions often drop the unit entirely; a counted, non-weighed
    // quantity means the rate is per EACH by construction.
    const convFrom = (basis === 'total_div_qty' && !fromUnit) ? 'each' : fromUnit;
    const conv = convertPerUnit(perUnit, convFrom, toUnit, ingredientId, { itemName: line.item_name });
    if (conv) {
      perUnit = conv.perUnit;
      conversion = { fromUnit: conv.fromUnit, toUnit: conv.toUnit, factor: conv.factor, basis };
      basis = 'converted';
    }
  }

  // (d) v2: a PORTION-unit ingredient bought as a whole package with no
  // conversion path — recording the whole-package price as a per-portion price
  // would be silently wrong by a factor of the pack size. Ask for the pack
  // size once (saved as alias.packQty).
  if (!aliasFlat && basis !== 'converted' && toUnit && PORTION_UNITS.has(toUnit)
      && (basis === 'line_total' || basis === 'total_div_qty' || (basis === 'printed_unit_price' && (!fromUnit || fromUnit === 'each' || fromUnit === 'package' || fromUnit === 'box')))) {
    const onePack = onePackPriceFor(line, fromUnit);
    return {
      status: 'needsConversion', norm, line, ingredientId, ingredient: seedIng, via, candidates,
      packPrice: onePack, toUnit,
      reasons: [`bought as a package but costed per ${toUnit} — how many ${toUnit} does one contain?`],
    };
  }

  // (e) v2: price sanity — a derived per-unit wildly off the ingredient's
  // current/baseline price demotes a fuzzy auto-match to review. Alias matches
  // stay matched (Kevin taught them) but carry a warning reason — and (Jul 13)
  // a priceWarned flag, so the pooling layer never pools a warned side.
  // (ref is hoisted above the conversion branches.)
  const priceWarn = ref != null && perUnit != null && basis !== 'line_total'
    && (perUnit > ref * PRICE_OUTLIER_HI || perUnit < ref * PRICE_OUTLIER_LO);
  if (priceWarn) {
    const msg = `derived $${perUnit}/${toUnit} is far from the current $${ref}/${toUnit} — double-check the match`;
    if (via === 'fuzzy') {
      return { status: 'review', norm, line, candidates, reasons: [...reasons, msg], confidence, needsPrice: false,
        suggestedId: ingredientId, perUnit, basis, conversion };
    }
    reasons.push(msg);
  }

  // v3.4 weight inference: a per-lb ingredient with only a flat line total
  // (H-Mart prebagged veg, H-E-B produce with no printed weight) — the engine
  // knows the total AND Kevin's current $/lb, so it proposes the weight:
  // "$4.99 at your $8.99/lb is about 0.55 lb." Never auto-accepted; accepting
  // records the purchase at the current price (price unchanged), or Kevin
  // enters the actual weight if he has it.
  let weightSuggestion = null;
  const curForInfer = ref; // current price (falls back to baseline) computed above
  if (basis === 'line_total' && toUnit === 'lb' && !(Number(line.quantity) > 0)
      && line.line_total > 0 && curForInfer != null && curForInfer > 0) {
    const onePackTotal = line.line_total / Math.max(1, Number(line.quantity) || 1);
    const inferred = onePackTotal / curForInfer;
    if (inferred >= 0.05 && inferred <= 25) {
      weightSuggestion = { lb: Math.round(inferred * 100) / 100, atPrice: curForInfer };
      reasons.push(`no weight printed — at your current $${curForInfer}/lb this is ≈${weightSuggestion.lb} lb`);
    }
  }

  return { status: 'matched', norm, line, ingredientId, ingredient: seedIng, via, perUnit, basis, conversion, candidates, confidence, reasons, weightSuggestion, qtyInference, priceWarned: !!priceWarn };
}

// Group identical item_name lines on the SAME receipt into one entry.
// v3.4: duplicate lines POOL their price math (weighted by quantity), instead
// of silently keeping only the first line's numbers. Kevin's real H-Mart
// receipt had two YELLOW ONION weighed lines (2.95 lb + 1.92 lb) — the pooled
// per-lb price is the quantity-weighted average across both.
// Jul 13 (3c): a side is pool-worthy only when its match is REAL — Kevin
// taught it (alias) or the fuzzy score cleared the AUTO bar — and nothing
// about it is suspect (fused-line flag, price-sanity warning). Weak or
// suspect sides never pool their price into an ingredient: a phantom line
// pooled into a real ingredient corrupts the cost silently, and wrong cost
// data is the cardinal sin. Suspect lines stay separate and visible instead.
function poolWorthy(c) {
  if (!c || c.status !== 'matched' || !c.ingredientId) return false;
  if (c.suspectFusion || c.priceWarned) return false;
  if (c.via === 'alias') return true;
  return c.via === 'fuzzy' && (c.confidence || 0) >= AUTO_SCORE;
}

function groupClassified(classified) {
  const groups = new Map();
  for (const c of classified) {
    const key = c.status === 'ignored'
      ? 'IGNORE::' + c.norm
      : (c.ingredientId || 'UNMATCHED') + '::' + c.norm + '::' + c.status;
    if (!groups.has(key)) {
      groups.set(key, {
        ...c, lines: [c.line], count: 1, totalSum: c.line.line_total || 0,
        _poolW: Number(c.line.quantity) > 0 ? Number(c.line.quantity) : null,
      });
    } else {
      const g = groups.get(key);
      g.lines.push(c.line);
      g.count++;
      g.totalSum = round(g.totalSum + (c.line.line_total || 0));
      // Pool per-unit price when BOTH sides have a real per-unit and a real
      // quantity to weight by. Falls back to first-line price otherwise
      // (identical flat duplicates pool trivially to the same number).
      // Jul 13 (3c): both sides must also be pool-worthy — same-norm lines
      // classify identically, so gating on the group covers both.
      const w = Number(c.line.quantity) > 0 ? Number(c.line.quantity) : null;
      if (poolWorthy(g) && poolWorthy(c) && g.perUnit > 0 && c.perUnit > 0 && g._poolW != null && w != null) {
        g.perUnit = round((g.perUnit * g._poolW + c.perUnit * w) / (g._poolW + w));
        g._poolW = round(g._poolW + w);
        g.pooledWeight = g._poolW;
      }
    }
  }
  return [...groups.values()];
}

// Built-in alias seed (unchanged from v1 — learned aliases merge on top).
export const ALIAS_SEED = {
  // ── Jul 14 batch: verified receipt strings from the task doc, Kevin-approved.
  // Keys are NORMALIZED via normalizeIngredientName (lowercased, singularized).
  'kitch basic real chkn st': { ingredientId: 'chicken_stock' },
  'hcf bnls sknl thigh': { ingredientId: 'chicken_thighs' },
  'pk nat bnl tenderloin cov': { ingredientId: 'pork_tenderloin' },   // the C.3 tenderloin trio
  'graza x vrgn olive oil si': { ingredientId: 'olive_oil_cooking' }, // SI = Sizzle = COOKING oil (Kevin, Jul 14 — task doc said good olive oil, corrected). Drizzle likely prints a different suffix; add when seen.
  'cm egg taglierini nest': { ingredientId: 'egg_taglierini' },
  'cm organic br orecchiette': { ingredientId: 'orecchiette' },
  'heb si unsaltd butter qtr': { ingredientId: 'butter' },
  'la vaquita oaxaca': { ingredientId: 'oaxaca' },                    // cheese, NOT a tomato
  'heb whole peeled tomatoe': { ingredientId: 'tomato_can' },         // Kevin buys 14oz AND 28oz of the same tomato; mapped to the usual 28oz — a 14oz's $1.08 fails the price-outlier band vs the $3.54 baseline and lands in review instead of auto-applying (Kevin, Jul 14)
  'carnation evaporated milk': { ingredientId: 'evaporated_milk' },

  // ── Jul 6 batch: seeded from Kevin's real H-E-B / H-Mart receipts ─────────
  'heb whole milk': { ingredientId: 'milk' },
  'garlic pk 5pc': { ingredientId: 'garlic' },                   // H-Mart 5-piece pack (name-size divides by the 5)                    // + PACK_OVERRIDE milk: always a gallon
  'anchovie flat fillet': { ingredientId: 'anchovies' },         // Kevin's usual jar — PACK_OVERRIDE converts jar price → per-fillet (÷20). Keys are NORMALIZED (singularized).
  'anchovy fillet': { ingredientId: 'anchovies' },
  'anchovie fillet': { ingredientId: 'anchovies' },
  'anchovie in olive oil': { ingredientId: 'anchovies' },
  'shrimp gulf brn 31 40 hls': { ingredientId: 'shrimp' },       // HEB gulf brown shrimp 31/40 headless (exact norm, Jul 9 screenshot); weighed per-lb
  'guittard akoma extra semi': { ingredientId: 'guittard_high' }, // Kevin's chocolate (exact norm, Jul 9 screenshot) — pack ÷283 g
  'guittard akoma': { ingredientId: 'guittard_high' },
  'guittard extra semi': { ingredientId: 'guittard_high' },
  'habanero pepper': { ingredientId: 'habanero' },               // weighed per-lb; ambiguity-breaker (Jul 9 resweep)
  'tomato paste': { ingredientId: 'tomato_paste' },              // vs tomato_can/peeled — exact wins
  'morton kosher coarse salt': { ingredientId: 'kosher_salt' },  // exact norm from the Jul 9 receipt
  'kadoya sesame oil': { ingredientId: 'toasted_sesame' },
  'kadoya pure sesame oil': { ingredientId: 'toasted_sesame' },
  'gulf shrimp': { ingredientId: 'shrimp' },
  'shrimp gulf': { ingredientId: 'shrimp' },
  'heb si unsaltd butter qtr': { ingredientId: 'butter' },       // QTR box = 1 lb = 4 sticks (name-size + override)
  'heb si unsalted butter qtr': { ingredientId: 'butter' },
  'heb unsaltd butter qtr': { ingredientId: 'butter' },
  'boston butt pork roast': { ingredientId: 'pork_butt' },
  'heb natural lamb ground b': { ingredientId: 'ground_lamb' },  // + override: 1 lb packages sold each
  'heb natural lamb ground': { ingredientId: 'ground_lamb' },
  '10 ct flour tortilla scan': { ingredientId: 'tortillas' },    // name-size reads the 10 (or 20) CT
  '20 ct flour tortilla scan': { ingredientId: 'tortillas' },
  'kabucha': { ingredientId: 'kabocha' },                        // H-Mart spells it KABUCHA
  'soli organic thyme': { ingredientId: 'thyme_fresh' },
  'cm br egg pappardelle nes': { ingredientId: 'egg_pappardelle' },
  'smithfield ground pork': { ingredientId: 'ground_pork' },
  'la vieille ferme rouge ss': { ingredientId: 'red_wine' },     // wineHint also catches ROUGE — belt & suspenders
  'la vieille ferme rouge': { ingredientId: 'red_wine' },
  'peco cantaloupe': { ingredientId: 'cantaloupe' },
  'pecos cantaloupe': { ingredientId: 'cantaloupe' },
  'small lime': { ingredientId: 'lime' },
  'heb cloud9 tomatoe': { ingredientId: 'fresh_tomatoes' },
  'heb cloud9 tomato': { ingredientId: 'fresh_tomatoes' },
  'kitch basic unsltd beef': { ingredientId: 'beef_stock' },
  'kitch basic lnsltd beef': { ingredientId: 'beef_stock' },
  'kitch basic unslted beef': { ingredientId: 'beef_stock' },
  'sel bnl shlder rst': { ingredientId: 'beef_chuck' },
  'sel bal shlder rst': { ingredientId: 'beef_chuck' },
  'sel bnl shldr rst': { ingredientId: 'beef_chuck' },
  'banyan hard tcfu': { ingredientId: 'tofu' },
  'banyan hard tofu': { ingredientId: 'tofu' },
  'emerald crunch dm': { ingredientId: 'cantaloupe' },
  'emerald crunch dm 11-12 c': { ingredientId: 'cantaloupe' },
  'emerald crunch melon': { ingredientId: 'cantaloupe' },
  'emerald crunch': { ingredientId: 'cantaloupe' },
  'dulcinea melon': { ingredientId: 'cantaloupe' },
  'agriform parmigiano 24 mo': { ingredientId: 'parm' },
  'anriform parmigiano 24 mo': { ingredientId: 'parm' },
  'agriform parmigiano': { ingredientId: 'parm' },
  'bagged baby gold potatoe': { ingredientId: 'baby_gold_potatoes' },
  'bagged baby gold potato': { ingredientId: 'baby_gold_potatoes' },
  'baby gold potatoe': { ingredientId: 'baby_gold_potatoes' },
  'baby gold potato': { ingredientId: 'baby_gold_potatoes' },
  'ghirardelli 100% cocoa un': { ingredientId: 'chocolate_100' },
  'ghirardelli 100% cocoa unsweetened': { ingredientId: 'chocolate_100' },
  'ghirardelli 100 cocoa un': { ingredientId: 'chocolate_100' },
  'anise fennel': { ingredientId: 'fennel_bulb' },
  'fennel anise': { ingredientId: 'fennel_bulb' },
  'sweet bulb onion': { ingredientId: 'bulb_onion' },
  'bulb onion': { ingredientId: 'bulb_onion' },
  'hunt tomato paste w basi': { ingredientId: 'tomato_paste' },
  'hunt tomato faste w basi': { ingredientId: 'tomato_paste' },
  'hunt tomato paste': { ingredientId: 'tomato_paste' },
  'honeycrisp apple': { ingredientId: 'apple' },
  'honeycrisp': { ingredientId: 'apple' },
  'asparagu standard': { ingredientId: 'asparagus' },
  'asparagus standard': { ingredientId: 'asparagus' },
  'green onion': { ingredientId: 'scallions' },
  // choy-family greens are always Kevin's generic asian_greens; gai lan is
  // deliberately NOT aliased (ambiguous with chinese_broccoli → review asks)
  'yu choy': { ingredientId: 'asian_greens' },
  'choy sum': { ingredientId: 'asian_greens' },
  'bok choy': { ingredientId: 'asian_greens' },
  'baby bok choy': { ingredientId: 'asian_greens' },
  'shanghai bok choy': { ingredientId: 'asian_greens' },
  // eggs — carton naming never contains enough signal for fuzzy ("GRADE A LARGE EGGS")
  'grade a large eggs': { ingredientId: 'eggs' },
  'grade aa large eggs': { ingredientId: 'eggs' },
  'large eggs': { ingredientId: 'eggs' },
  'large brown eggs': { ingredientId: 'eggs' },
  'eggs large': { ingredientId: 'eggs' },
  // Kevin's habitual pantry products (Jul 5) — names fuzzy can't reach, plus
  // the two Graza bottles: same ingredient, different sizes, so pack size
  // rides on the ALIAS (packQty) rather than the ingredient.
  'kikkoman usukuchi shoyu': { ingredientId: 'soy' },
  'kikkoman usukuchi': { ingredientId: 'soy' },
  'kikkoman soy sauce': { ingredientId: 'soy' },
  'red boat 40n fish sauce': { ingredientId: 'fish_sauce' },
  'red boat fish sauce': { ingredientId: 'fish_sauce' },
  'pixian doubanjiang': { ingredientId: 'doubanjiang' },
  'guittard cocoa rouge': { ingredientId: 'cocoa' },
  'guittard cocoa': { ingredientId: 'cocoa' },
  'brer rabbit blackstrap': { ingredientId: 'molasses' },
  'hill country fare vanilla': { ingredientId: 'vanilla' },
  'wild turkey 101': { ingredientId: 'bourbon' },
  // TWO different oils, not two sizes of one (Kevin, Jul 5): Sizzle = cheaper
  // 750 ml cooking oil; Drizzle = finishing oil, 500 ml, the tomato-sauce one.
  'graza sizzle': { ingredientId: 'olive_oil_cooking', packQty: 25.4 },   // 750 ml = 25.4 fl oz
  'graza sizzle olive oil': { ingredientId: 'olive_oil_cooking', packQty: 25.4 },
  'graza drizzle': { ingredientId: 'olive_oil', packQty: 16.9 },  // 500 ml = 16.9 fl oz
  'graza drizzle olive oil': { ingredientId: 'olive_oil', packQty: 16.9 },
  // ── Jul 14 batch (Kevin-approved D2 seeds) ────────────────────────────────
  // Kitchen Basics CHICKEN carton (the beef variants were already seeded).
  // 32 oz carton = 4 cups; packQty converts the carton price → per-cup.
  'kitch basic real chkn st': { ingredientId: 'chicken_stock', packQty: 4 },
  'kitch basic chkn st': { ingredientId: 'chicken_stock', packQty: 4 },
  // HEB boneless skinless chicken, both cuts. Keys are the NORMALIZED forms:
  // BNLS is 4 chars so the singularizer leaves it; SKNLS/THIGHS/BREASTS drop
  // the s. BNL variants cover a shorter truncation.
  'hcf bnls sknl thigh': { ingredientId: 'chicken_thighs' },
  'hcf bnl sknl thigh': { ingredientId: 'chicken_thighs' },
  'hcf bnls sknl breast': { ingredientId: 'chicken_breast' },
  'hcf bnl sknl breast': { ingredientId: 'chicken_breast' },
  'pk nat bnl tenderloin cov': { ingredientId: 'pork_tenderloin' },
  'pk nat bnl tenderloin': { ingredientId: 'pork_tenderloin' },
  // Graza rings up as "GRAZA X VRGN OLIVE OIL SI" — the trailing SI marks the
  // SIZZLE bottle (Kevin, Jul 14). No bare-name seed: without the SI the
  // string is ambiguous between the two bottles, and the Drizzle's ring-up is
  // unknown until Kevin buys one. 750 ml = 25.4 fl oz.
  'graza x vrgn olive oil si': { ingredientId: 'olive_oil_cooking', packQty: 25.4 },
  // Queso cheese #2. ALWAYS a 10 oz package (Kevin) = 0.625 lb, costed /lb.
  // Also corrects the prior misfire where this string bound to a tomato id.
  'la vaquita oaxaca': { ingredientId: 'oaxaca', packQty: 0.625 },
};

export function buildReviewPlan(extracted, seed, aliases) {
  const store = extracted.store || null;
  const merged = { ...ALIAS_SEED, ...(aliases || {}) };
  const classified = (extracted.lines || []).map(l => classifyLine(l, seed, merged, store));
  const grouped = groupClassified(classified);
  // UPGRADES #2 + #3: annotate each group with a pack-shift alarm (implied
  // container size diverges from the learned one) and an off-store hint (this
  // ingredient is habitually bought elsewhere). Both are soft signals the
  // review UI can surface; neither blocks a match.
  for (const g of grouped) {
    const alias = g.norm ? merged[g.norm] : null;
    if (!alias) continue;
    const shift = packShiftAlarm(g, alias);
    if (shift) g.packShift = shift;
    const off = offStoreHint(alias, store);
    if (off) g.offStore = off;
  }
  // UPGRADE #5 (merge polish): consolidate DIFFERENT receipt strings that
  // matched the SAME ingredient into one review row ("YELLOW ONION" +
  // "ONIONS YLW JUMBO" → one yellow_onion group, qty-weighted price pool).
  // Guarded: if the two per-units disagree by more than MERGE_PRICE_TOL the
  // groups stay separate and both get a priceSplit flag, because a big gap
  // usually means one of them is a misparse or a different product.
  const consolidated = consolidateByIngredient(grouped);
  // UPGRADE #6: confidence tier per group — 'auto' (safe to commit blind),
  // 'check' (fine but glance at it), 'attention' (something is off). The UI
  // sorts by tier so the eyes land where they matter.
  for (const g of consolidated) {
    g.tier = confidenceTier(g, g.ingredient ? g.ingredient.current : null);
  }
  return {
    store,
    receipt_date: extracted.receipt_date || null,
    buckets: {
      matched: consolidated.filter(g => g.status === 'matched'),
      review: consolidated.filter(g => g.status === 'review'),
      needsConversion: consolidated.filter(g => g.status === 'needsConversion'),
      needsPrice: consolidated.filter(g => g.status === 'needsPrice'),
      unmatched: consolidated.filter(g => g.status === 'unmatched'),
      ignored: consolidated.filter(g => g.status === 'ignored'),
    },
  };
}

// Merge tolerance: per-units within 35% of each other pool; beyond that the
// groups stay separate (misparse / different product suspicion).
export const MERGE_PRICE_TOL = 0.35;

function consolidateByIngredient(groups) {
  const out = [];
  const byKey = new Map(); // ingredientId (matched only) → group already in out
  for (const g of groups) {
    if (g.status !== 'matched' || !g.ingredientId) { out.push(g); continue; }
    const prev = byKey.get(g.ingredientId);
    if (!prev) { byKey.set(g.ingredientId, g); out.push(g); continue; }
    // Price-disagreement guard on real per-units.
    if (prev.perUnit > 0 && g.perUnit > 0) {
      const ratio = Math.max(prev.perUnit, g.perUnit) / Math.min(prev.perUnit, g.perUnit);
      if (ratio > 1 + MERGE_PRICE_TOL) {
        prev.priceSplit = { other: g.perUnit };
        g.priceSplit = { other: prev.perUnit };
        out.push(g);
        continue;
      }
    }
    // Jul 13 (3c): only merge when BOTH sides independently earned the match
    // (alias or auto-strength fuzzy, no suspect flags). A weak or warned side
    // stays its own row and surfaces for review — the "merged ×2" phantom
    // evaporated-milk card came from exactly this kind of pool.
    if (!poolWorthy(prev) || !poolWorthy(g)) {
      prev.poolBlocked = { other: g.norm, reason: 'weak or suspect match — kept separate' };
      g.poolBlocked = { other: prev.norm, reason: 'weak or suspect match — kept separate' };
      out.push(g);
      continue;
    }
    // Merge g into prev. `parts` keeps the ORIGINAL groups so alias learning
    // still runs per receipt string (each norm learns its own conversion).
    if (!prev.parts) prev.parts = [{ ...prev, parts: undefined }];
    prev.parts.push({ ...g });
    prev.mergedFrom = prev.parts.map(p => p.norm);
    prev.lines = prev.lines.concat(g.lines);
    prev.count += g.count;
    prev.totalSum = round(prev.totalSum + g.totalSum);
    // Pool per-unit qty-weighted when both sides have real numbers; otherwise
    // keep whichever side has one.
    const wPrev = prev._poolW != null ? prev._poolW
      : (Number(prev.lines[0] && prev.lines[0].quantity) > 0 ? Number(prev.lines[0].quantity) : null);
    const wG = g._poolW != null ? g._poolW
      : (Number(g.lines[0] && g.lines[0].quantity) > 0 ? Number(g.lines[0].quantity) : null);
    if (prev.perUnit > 0 && g.perUnit > 0 && wPrev != null && wG != null) {
      prev.perUnit = round((prev.perUnit * wPrev + g.perUnit * wG) / (wPrev + wG));
      prev._poolW = round(wPrev + wG);
      prev.pooledWeight = prev._poolW;
    } else if (!(prev.perUnit > 0) && g.perUnit > 0) {
      prev.perUnit = g.perUnit;
      prev.basis = g.basis;
      prev.conversion = g.conversion || prev.conversion;
    }
  }
  return out;
}

// Confidence tier for a matched group. 'auto' = trustworthy basis AND price
// within ±20% of the current cost (or first-ever buy with a clean basis is
// still only 'check' — no history means no blind trust). 'attention' = any
// soft alarm (pack shift, price split, outlier price, weak basis).
export function confidenceTier(group, currentCost = null) {
  if (group.status !== 'matched') return 'attention';
  if (group.packShift || group.priceSplit) return 'attention';
  if (!defaultAccept(group, currentCost)) return 'attention';
  // B (Jul 14): an INFERRED package count is arithmetic on top of a guess —
  // show the math, one tap to confirm, never auto (wrong cost data is the
  // cardinal sin; same philosophy as weightSuggestion).
  if (group.qtyInference) return 'check';
  if (currentCost > 0 && group.perUnit > 0) {
    const ratio = group.perUnit / currentCost;
    if (ratio >= 0.8 && ratio <= 1.2) return 'auto';
  }
  return 'check';
}

// Default accept-toggle state for a matched group on the confirm screen.
// v3.5: a trustworthy BASIS is no longer enough — if the derived per-unit is a
// price outlier vs the current cost (>2.5× or <0.4×, the same thresholds the
// classifier uses), the row defaults UNCHECKED so a misparse can't slide into
// the cost database on autopilot. currentCost optional for back-compat.
export function defaultAccept(group, currentCost = null) {
  // total_div_qty (Jul 13) = line total ÷ counted quantity — the exact same
  // arithmetic total_div_weight does for weighed lines, so it earns the same
  // trust. The price-outlier gate below still applies.
  const basisOk = group.basis === 'total_div_weight' || group.basis === 'printed_unit_price' || group.basis === 'converted' || group.basis === 'total_div_qty';
  if (!basisOk) return false;
  if (currentCost > 0 && group.perUnit > 0) {
    const ratio = group.perUnit / currentCost;
    if (ratio > PRICE_OUTLIER_HI || ratio < PRICE_OUTLIER_LO) return false;
  }
  return true;
}

// ═══ v3.1: DETERMINISTIC PASTED-TEXT RECEIPT PARSER (Fable, Jul 6) ═══════════
// Pasted receipt text needs ZERO model calls: this produces the exact same
// extraction shape as /parse-receipt ({store, receipt_date, lines[]}), so
// buildReviewPlan consumes it unchanged. Grammar from Kevin's real receipts:
//   H-E-B:  "1 KITCH BASICS UNSLTD BEEF" + "  2 Ea. @ 1/ 2.98 F  5.96"  (2 lines)
//           "7 ANISE FENNEL  F  3.98"                                    (1 line)
//   H-Mart: "2.95 lb @ 0.69 /lb" + "WT  YELLOW ONION  2.04 F"            (2 lines)
//           "GARLIC PK 5PC  2.99 F"                                      (1 line)
// Junk (subtotals, tax, card, survey…) is skipped. Returns null lines it
// can't parse in `unparsed` so the caller can fall back to the AI for JUST
// those (or the whole paste if nothing parsed).
const SKIP_LINE_RE = /subtotal|sales tax|^\s*tax\b|total sale|balance|mastercard|mastrcrd|visa|debit|credit|approval|sequence|account|change\b|items purchased|items sold|you saved|savings|survey|win 1 of|gift card|purchase necessary|see rules|call 1-|text survey|message and data|odds depend|must be 18|return policy|unused product|refunded|http|www\.|tel \(|cashier|expires|barcode|ref no|appr no|mode:|aid\s|tvr\s|iad\s|tsi\s|arc\s|contactless|big \$avings/i;

export function parsePastedReceipt(text) {
  const rawLines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const lines = [];
  const unparsed = [];
  let store = null;
  let receipt_date = null;
  // v3.4: capture the printed subtotal/total BEFORE skipping those lines —
  // it's the one number that can verify the whole extraction. Prefer the
  // pre-tax subtotal (item lines sum to it); fall back to total/balance.
  let printed_subtotal = null;
  let printed_total = null;

  if (rawLines.some(l => /h[-\s]?e[-\s]?b/i.test(l))) store = 'H-E-B';
  if (rawLines.some(l => /h\s*mart|hmart/i.test(l))) store = 'H-Mart';
  for (const l of rawLines) {
    const d = l.match(/\b(\d{2})\/(\d{2})\/(\d{2})\b/); // 06/29/26
    if (d && !receipt_date) receipt_date = `20${d[3]}-${d[1]}-${d[2]}`;
    const iso = l.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
    if (iso && !receipt_date) receipt_date = iso[0];
  }

  const money = '(\\d+\\.\\d{2})';
  const flag = '(FW|TF|F|T)';
  // H-E-B detail line: "2 Ea. @ 1/ 2.98 F  5.96"
  const hebDetail = new RegExp(`^(\\d+)\\s*Ea\\.?\\s*@\\s*1\\/\\s*${money}\\s*${flag}?\\s+${money}$`, 'i');
  // H-E-B one-liner: "7 ANISE FENNEL  FW  3.98"  (leading line number optional)
  const hebOne = new RegExp(`^(?:\\d{1,2}\\s+)?(.+?)\\s+${flag}\\s+${money}-?$`);
  // H-Mart weight line: "2.95 lb @ 0.69 /lb"
  const hmWeight = new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*lb\\s*@\\s*${money}\\s*\\/\\s*lb$`, 'i');
  // H-Mart item line: "WT  YELLOW ONION  2.04 F" or "GARLIC PK 5PC  2.99 F"
  const hmItem = new RegExp(`^(WT\\s+)?(.+?)\\s+${money}\\s+${flag}$`);

  let pendingName = null;   // H-E-B: name line waiting for its detail line
  let pendingWt = null;     // H-Mart: weight line waiting for its WT name line

  const emit = (o) => lines.push({
    raw_text: o.raw, item_name: o.name, quantity: o.qty ?? null, unit: o.unit ?? null,
    line_total: o.total ?? null, unit_price_printed: o.rate ?? null,
    tax_flag: o.flag ?? null, weighed: !!o.weighed,
  });

  // Jul 13 (3a): STRICT ADJACENCY. A pending H-E-B name may pair ONLY with
  // the line immediately after it. Any other line type — junk, an hmWeight
  // line, a self-contained item, a skip line — flushes the pending name to
  // `unparsed` (AI fallback / manual review) instead of letting it wait and
  // fuse with a later, unrelated detail line. The "TOMATO … OAXACA" chimera
  // came from exactly that desync. Flushing (not silently discarding) also
  // means a real item whose detail line the OCR mangled stays VISIBLE.
  const flushPending = () => { if (pendingName) { unparsed.push(pendingName); pendingName = null; } };

  for (const l of rawLines) {
    if (SKIP_LINE_RE.test(l)) {
      const money = l.match(/(\d+\.\d{2})\s*$/);
      if (money) {
        const val = Number(money[1]);
        if (/sale subtotal/i.test(l) && printed_subtotal == null) printed_subtotal = val;
        else if (/total sale|balance/i.test(l) && printed_total == null) printed_total = val;
      }
      flushPending(); continue;
    }

    const w = l.match(hmWeight);
    if (w) { flushPending(); pendingWt = { qty: Number(w[1]), rate: Number(w[2]) }; continue; }

    const hd = pendingName && l.match(hebDetail);
    if (hd) {
      emit({ raw: pendingName + ' | ' + l, name: pendingName, qty: Number(hd[1]), unit: 'ea',
             rate: Number(hd[2]), flag: hd[3] || null, total: Number(hd[4]),
             weighed: /w/i.test(hd[3] || '') });
      pendingName = null; continue;
    }
    // Jul 13 (3a): an ORPHANED detail line — "N Ea. @ 1/ x.xx F y.yy" with no
    // pending name (the name line was lost or mangled) — goes to unparsed for
    // the AI fallback / manual review. Before this, hebOne would swallow it
    // and emit a junk item literally named "Ea. @ 1/ 4.24".
    if (!pendingName && l.match(hebDetail)) { unparsed.push(l); continue; }

    const hi = l.match(hmItem) || l.match(hebOne);
    if (hi) {
      const isWT = hi.length === 5 && /^WT\s+$/i.test(hi[1] || '');
      const name = (hi.length === 5 ? hi[2] : hi[1]).trim();
      const fl = hi.length === 5 ? hi[4] : hi[2];
      const total = Number(hi.length === 5 ? hi[3] : hi[3]);
      const weighed = isWT || /w/i.test(fl || '');
      if (pendingWt && (isWT || weighed)) {
        emit({ raw: l, name, qty: pendingWt.qty, unit: 'lb', rate: pendingWt.rate, flag: fl, total, weighed: true });
        pendingWt = null;
      } else {
        emit({ raw: l, name, flag: fl, total, weighed });
      }
      flushPending(); continue;
    }

    // Bare name line (H-E-B first line of a pair): "1 KITCH BASICS UNSLTD BEEF"
    const bare = l.match(/^(?:\d{1,2}\s+)?([A-Z][A-Z0-9 %&#.\/'-]{2,})$/);
    if (bare && !/^\d+(\.\d+)?$/.test(bare[1])) {
      flushPending(); // previous never got a detail line
      pendingName = bare[1].trim(); continue;
    }
    flushPending();
    unparsed.push(l);
  }
  if (pendingName) unparsed.push(pendingName);
  return { store, receipt_date, lines, unparsed, printed_subtotal, printed_total };
}

// v3.4: reconcile the parsed lines against the receipt's own printed number.
// Small gaps are normal (discount lines, deliberately skipped items); a big
// gap means a line was missed or misread. Informational, never blocking.
// ── A3/A4 (Jul 14): merge two half-receipt extractions into ONE receipt ─────
// The two-photo split scan photographs a physically CUT receipt as two
// full-frame halves. Each half extracts independently; this merges them so
// everything downstream (classify, group, match, reconcile) sees one receipt.
//   lines    — photo 1's then photo 2's, order preserved. The cut means no
//              line exists in both halves; as a cheap safety net an exact
//              duplicate (raw_text AND line_total both match) is dropped once.
//              Same name + total with DIFFERENT raw_text is a real second
//              purchase and is kept.
//   store    — photo 1's, else photo 2's.
//   subtotal — the real "Sale Subtotal" prints ONCE at the receipt's bottom,
//              so photo 2 usually carries the whole-receipt figure. When BOTH
//              photos report one, pick whichever candidate (photo2, photo1,
//              or their sum) lands closest to the merged line sum; ties break
//              in that order, preferring a single real subtotal over summing.
//              The decision is recorded for the debug dump.
export function mergeExtractions(ex1, ex2) {
  const a = ex1 || {}, b = ex2 || {};
  const dupKey = (l) => (l && l.raw_text != null && l.line_total != null) ? `${l.raw_text}|${l.line_total}` : null;
  const lines = [...(a.lines || [])];
  const seen = new Set(lines.map(dupKey).filter(k => k != null));
  let droppedDuplicates = 0;
  for (const l of (b.lines || [])) {
    const k = dupKey(l);
    if (k != null && seen.has(k)) { droppedDuplicates++; continue; }
    if (k != null) seen.add(k);
    lines.push(l);
  }
  const linesSum = round(lines.reduce((s, l) => s + (Number(l.line_total) || 0), 0));
  const p1 = a.printed_subtotal != null ? Number(a.printed_subtotal) : null;
  const p2 = b.printed_subtotal != null ? Number(b.printed_subtotal) : null;
  let printed_subtotal = null;
  let mode = 'none';
  if (p1 != null && p2 == null) { printed_subtotal = p1; mode = 'single_photo1'; }
  else if (p2 != null && p1 == null) { printed_subtotal = p2; mode = 'single_photo2'; }
  else if (p1 != null && p2 != null) {
    const candidates = [['single_photo2', p2], ['single_photo1', p1], ['summed', round(p1 + p2)]];
    let best = candidates[0];
    for (const c of candidates) if (Math.abs(c[1] - linesSum) < Math.abs(best[1] - linesSum)) best = c;
    mode = best[0]; printed_subtotal = best[1];
  }
  return {
    store: a.store || b.store || null,
    receipt_date: a.receipt_date || b.receipt_date || null,
    lines,
    printed_subtotal,
    subtotalDecision: { mode, photo1Subtotal: p1, photo2Subtotal: p2, mergedLinesSum: linesSum, droppedDuplicates },
  };
}

export function reconcileReceipt(extracted) {
  const linesSum = round((extracted.lines || []).reduce((s, l) => s + (Number(l.line_total) || 0), 0));
  const printed = extracted.printed_subtotal != null ? extracted.printed_subtotal
    : extracted.printed_total != null ? extracted.printed_total : null;
  if (printed == null) return null;
  const gap = round(printed - linesSum);
  const tolerance = Math.max(1, printed * 0.02);
  return {
    linesSum,
    printed,
    printedKind: extracted.printed_subtotal != null ? 'subtotal' : 'total',
    gap,
    ok: Math.abs(gap) <= tolerance,
  };
}

// C.3 (Jul 14): the reconcile is a HARD GATE on auto-apply. Perfect OCR is
// not achievable (three tenderloins once read $6.xx instead of $9.xx — an
// $8.67 hole); the defense is not better prompting, it's refusing to
// auto-accept photo-derived prices when the line sum disagrees with the
// printed subtotal. ok:false → every row starts unaccepted and Kevin reviews.
// A null reconcile (no subtotal captured anywhere) keeps prior behavior —
// C.2's prompt hardening makes that case rare and visible.
export function autoApplyAllowed(recon) {
  return !(recon && recon.ok === false);
}

// ═══ v3.2: LEARNING-OVER-TIME HELPERS (engine side) ══════════════════════════
// (a) When Kevin ACCEPTS a name-size or pack conversion, persist it: the alias
// gains packQty (costing units per one package of that exact receipt string),
// so next time the conversion is instant even if the name changes format.
// (b) Auto-promote: a review-band candidate Kevin has confirmed twice for the
// same normalized string becomes an alias (auto next time). Confirm counts
// ride the alias store under `confirms`.
export function learnFromAcceptance(group, aliases, opts = {}) {
  const out = { ...(aliases || {}) };
  const key = group.norm;
  if (!key || !group.ingredientId) return out;
  const prev = out[key] || {};
  const entry = { ...prev, ingredientId: group.ingredientId };
  // Persist the effective pack size when a conversion produced the accepted
  // price. UPGRADE #1 (Jul 9): learn from ALL conversion bases, including the
  // hardcoded 'pack' override and prior 'learned_pack' — so accepting or
  // editing an auto-converted price refines the remembered size toward YOUR
  // real container. Smoothed (70/30 toward the established value) so one odd
  // receipt nudges rather than yanks; the first observation sets it outright.
  const onePack = group.lines && group.lines[0] ? (group.lines[0].line_total != null ? group.lines[0].line_total / Math.max(1, Number(group.lines[0].quantity) || 1) : null) : null;
  const LEARNABLE_BASES = new Set(['name_size', 'pack_conversion', 'sold_by_each', 'pack', 'learned_pack']);
  if (group.conversion && group.perUnit > 0 && onePack != null && LEARNABLE_BASES.has(group.conversion.basis)) {
    const implied = Math.round((onePack / group.perUnit) * 1000) / 1000;
    if (implied > 0 && isFinite(implied)) {
      const priorSize = Number(prev.packQty) > 0 ? Number(prev.packQty) : null;
      const priorObs = prev.packObs || 0;
      // First real observation: adopt it. After that: exponential smoothing so
      // an established size resists a single anomalous scan but still drifts to
      // a genuine change over a few receipts.
      entry.packQty = priorSize == null ? implied : Math.round((priorSize * 0.7 + implied * 0.3) * 1000) / 1000;
      entry.packObs = priorObs + 1;
      entry.packLastImplied = implied; // for the shift alarm below
    }
  }
  // Confirm counting → auto-promote after 2 confirmations of a review pick
  entry.confirms = (prev.confirms || 0) + 1;
  // v3.4 negative learning: Kevin re-mapped AWAY from a suggested ingredient —
  // remember the rejection so it can't silently auto-win again (cap 3, deduped).
  if (opts.rejectedId && opts.rejectedId !== group.ingredientId) {
    const rej = Array.isArray(prev.rejected) ? prev.rejected : [];
    if (!rej.includes(opts.rejectedId)) entry.rejected = [...rej, opts.rejectedId].slice(-3);
  }
  // v3.4 learned sold-by-each: a weighed/flat line accepted at FLAT price for
  // an each-ish ingredient, twice → this item sells by the each at this store.
  const eachish = group.ingredient && /^(each|head|bunch|pack|jar|can|bottle|loaf|dozen)$/.test(group.ingredient.unit || '');
  if (opts.usedFlatPrice && eachish && group.lines && group.lines[0] && (group.lines[0].weighed || !group.lines[0].unit)) {
    entry.eachHits = (prev.eachHits || 0) + 1;
    if (entry.eachHits >= 2) entry.soldByEach = true;
  }
  out[key] = entry;
  return out;
}

// v3.4 learned auto-ignore: called at commit with the item names Kevin left
// unmapped. After 3 sightings the classifier stops asking (reason
// 'learned_ignore'); mapping the item later overrides via ingredientId.
export function learnFromIgnores(unmatchedNorms, aliases) {
  const out = { ...(aliases || {}) };
  for (const norm of (unmatchedNorms || [])) {
    if (!norm) continue;
    const prev = out[norm] || {};
    if (prev.ingredientId) continue; // mapped items never auto-ignore
    out[norm] = { ...prev, seenUnmatched: (prev.seenUnmatched || 0) + 1 };
  }
  return out;
}

// ═══ v3.3: PRICE-DRIFT INTELLIGENCE (the "only if data survives" item) ═══════
// A scan should KNOW when a price jumped and what it does to Kevin's margins.
// Pure function: call at confirm time with the accepted per-unit price.
// Returns null when boring; otherwise { pctChange, prevAvg, dishesUnderFloor }.
import { costDishVariant, baselineCostMap, trueRawCost } from './dishCosting.js';
import { DISHES } from './dishes.js';
export function priceDriftReport(ingredientId, newPerUnit, costHistory, seed, floorPct = 45) {
  const hist = (costHistory || []).filter(h => h.id === ingredientId).slice(-3);
  const base = hist.length ? hist.reduce((s, h) => s + h.cost, 0) / hist.length
    : (seed.find(i => i.id === ingredientId) || {}).current;
  if (!(base > 0) || !(newPerUnit > 0)) return null;
  const pctChange = Math.round(((newPerUnit - base) / base) * 1000) / 10;
  if (Math.abs(pctChange) < 15) return null; // boring
  // Which dish variants does the new price push under the margin floor —
  // using the REAL engine (adjustedCost = drift applied to the buffered
  // anchor, exactly what MoneyTab margins use). Only NEWLY-under variants
  // are reported (already-under Kevin-accepted ones stay quiet).
  const baseMap = baselineCostMap();
  const liveOld = { ...baseMap }; const liveNew = { ...baseMap };
  seed.forEach(i => { if (i.current > 0) { liveOld[i.id] = i.current; liveNew[i.id] = i.current; } });
  liveNew[ingredientId] = newPerUnit;
  const dishesUnderFloor = [];
  for (const d of DISHES) {
    for (const v of d.variants) {
      if (!(v.price > 0) || !(v.cost > 0)) continue;
      const cOld = costDishVariant(d.name, v.label, v.cost, liveOld, baseMap);
      const cNew = costDishVariant(d.name, v.label, v.cost, liveNew, baseMap);
      if (cOld.unknown || cNew.unknown) continue;
      const mOld = (1 - trueRawCost(cOld.adjustedCost) / v.price) * 100;
      const mNew = (1 - trueRawCost(cNew.adjustedCost) / v.price) * 100;
      if (mNew < floorPct && mOld >= floorPct) {
        dishesUnderFloor.push(`${d.name} — ${v.label} (${Math.round(mOld * 10) / 10}% → ${Math.round(mNew * 10) / 10}%)`);
      }
    }
  }
  return { pctChange, prevAvg: Math.round(base * 1000) / 1000, dishesUnderFloor };
}

// ═══ MANUAL-ENTRY CONTAINER GUARD (Jul 9 — the anchovy bug) ═════════════════
// Kevin typed the JAR price ($5.78) into the per-FILLET anchovy cost, and
// chili's costing dutifully charged $5.78 a fillet. The receipt path has pack
// intelligence; the manual edit path had none. This helper gives ANY edit box
// the same brain: if the ingredient has a known container size and the
// entered price looks like a whole-container price, propose the division.
export function containerPriceCheck(ingredientId, enteredValue, referenceValue) {
  const ov = PACK_OVERRIDE[ingredientId];
  const entered = Number(enteredValue);
  if (!ov || !ov.perBase || !isFinite(entered) || entered <= 0) return null;
  const ref = Number(referenceValue) > 0 ? Number(referenceValue) : null;
  // Suspicion test: the entered price is at least 4x the known-good per-unit
  // price (or, with no reference, at least 4x what one pack-unit would cost).
  const suspicious = ref ? entered >= ref * 4 : entered >= ov.perBase;
  if (!suspicious) return null;
  const converted = Math.round((entered / ov.perBase) * 1000) / 1000;
  return {
    perBase: ov.perBase,
    converted,
    message: `That looks like a whole-container price. This ingredient runs ${ov.perBase} per container, so $${entered.toFixed(2)} works out to $${converted.toFixed(3)} per unit. Use the converted price?`,
  };
}

// UPGRADE #2 (Jul 9): pack-shift detection. Given a review group and the
// learned alias, return an alarm when the implied pack size diverges from the
// established one past a threshold (default 30%). Only fires once a size is
// actually established (>=2 observations) — no crying wolf while it's still
// learning. Returns null when quiet.
export function packShiftAlarm(group, alias, thresholdPct = 30) {
  if (!group || !alias || !(alias.packQty > 0) || (alias.packObs || 0) < 2) return null;
  const onePack = group.lines && group.lines[0] && group.lines[0].line_total != null
    ? group.lines[0].line_total / Math.max(1, Number(group.lines[0].quantity) || 1) : null;
  if (onePack == null || !(group.perUnit > 0)) return null;
  const implied = onePack / group.perUnit;
  if (!(implied > 0) || !isFinite(implied)) return null;
  const pct = ((implied - alias.packQty) / alias.packQty) * 100;
  if (Math.abs(pct) < thresholdPct) return null;
  return {
    learnedPack: alias.packQty,
    impliedPack: Math.round(implied * 100) / 100,
    pct: Math.round(pct),
    direction: pct > 0 ? 'larger' : 'smaller',
    message: pct > 0
      ? `This implies a ${Math.round(implied)}-unit container, ${Math.round(pct)}% bigger than your usual ${Math.round(alias.packQty)}. Bigger pack, a sale, or a different product?`
      : `This implies a ${Math.round(implied)}-unit container, ${Math.abs(Math.round(pct))}% smaller than your usual ${Math.round(alias.packQty)}. Shrunk pack, a different brand, or a misread?`,
  };
}

// UPGRADE #3 (Jul 9): store-fact learning. Track which store each ingredient
// is habitually bought from, so an off-store line becomes a soft signal that a
// match might be wrong (and feeds store-split shopping later). Learned on the
// alias under storeSeen: { HEB: n, HMART: n, ... }.
export function learnStoreFact(aliases, norm, ingredientId, store) {
  const out = { ...(aliases || {}) };
  if (!norm || !ingredientId || !store) return out;
  const prev = out[norm] || {};
  const seen = { ...(prev.storeSeen || {}) };
  seen[store] = (seen[store] || 0) + 1;
  out[norm] = { ...prev, ingredientId, storeSeen: seen };
  return out;
}

// The habitual store for an ingredient (the one seen most), or null if unknown
// or too close to call.
export function habitualStore(alias) {
  const seen = alias && alias.storeSeen;
  if (!seen) return null;
  const entries = Object.entries(seen).sort((a, b) => b[1] - a[1]);
  if (!entries.length || entries[0][1] < 2) return null;
  if (entries[1] && entries[1][1] === entries[0][1]) return null; // tie
  return entries[0][0];
}

// Off-store hint: this ingredient is habitually from a different store than the
// receipt we're reading. A nudge that a match may be misread, not a block.
export function offStoreHint(alias, receiptStore) {
  const usual = habitualStore(alias);
  if (!usual || !receiptStore || usual === receiptStore) return null;
  return { usualStore: usual, thisStore: receiptStore,
    message: `You usually get this at ${usual}, not ${receiptStore}. Double-check the match.` };
}

// UPGRADE #4 (Jul 9): Dice-coefficient string similarity on character bigrams.
// Breaks the "a second ingredient scores nearly as high" ties that pure
// token-containment leaves ambiguous, without a hardcoded alias for every
// garbled line. Returns 0..1.
export function diceCoefficient(a, b) {
  const s1 = String(a || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = String(b || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!s1.length || !s2.length) return 0;
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return s1 === s2 ? 1 : 0;
  const bigrams = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const bg = s.slice(i, i + 2); m.set(bg, (m.get(bg) || 0) + 1); } return m; };
  const b1 = bigrams(s1), b2 = bigrams(s2);
  let overlap = 0;
  for (const [bg, c1] of b1) { const c2 = b2.get(bg); if (c2) overlap += Math.min(c1, c2); }
  const total = (s1.length - 1) + (s2.length - 1);
  return (2 * overlap) / total;
}
