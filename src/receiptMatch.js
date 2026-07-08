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
  butter: { fromUnit: 'lb', perBase: 4 },              // 1 lb butter = 4 sticks
  milk: { fromUnit: 'package', perBase: 16, eachIsPack: true, matchNullUnit: true },       // Kevin ALWAYS buys milk by the gallon = 16 cups (his rule, Jul 6)
  ground_lamb: { fromUnit: 'package', perBase: 1, eachIsPack: true, matchNullUnit: true }, // HEB ground lamb: always 1 lb packages sold each (Kevin, Jul 6)
  guittard_low: { fromUnit: 'package', perBase: 283 },
  guittard_high: { fromUnit: 'package', perBase: 283 },
  kosher_salt: { fromUnit: 'box', perBase: 90.7 },
  garlic: { fromUnit: 'package', perBase: 5 },
  chocolate_100: { fromUnit: 'package', perBase: 8, eachIsPack: true },
  beef_stock: { fromUnit: 'package', perBase: 4, eachIsPack: true },
  tofu: { fromUnit: 'package', perBase: 1, eachIsPack: true },
  baby_gold_potatoes: { fromUnit: 'package', perBase: 1.5, eachIsPack: true }, // Kevin correction Jul 6: the bag is ALWAYS 1.5 lb (was seeded as 2)
  red_wine: { fromUnit: 'package', perBase: 3.17, fixedCount: true, matchNullUnit: true, eachIsPack: true },
  // v2 additions — physical invariants:
  eggs: { fromUnit: 'dozen', perBase: 12, eachIsPack: true },              // a dozen is 12
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
const PORTION_UNITS = new Set(['tbs', 'tbsp', 'tsp', 'cup', 'shot', 'square', 'stick', 'pinch', 'knob', 'clove', 'sprig', 'leaf', 'half-jar']);

// Convert a per-unit price FROM the receipt unit INTO the ingredient's costing
// unit. Returns { perUnit, factor, fromUnit, toUnit } or null (not convertible
// or not needed).
export function convertPerUnit(perUnit, fromUnit, toUnit, ingredientId) {
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
  if (w && toUnit === 'lb' && fromUnit && EACHISH_UNITS.has(fromUnit)) {
    return { perUnit: round3(perUnit / w), factor: 1 / w, fromUnit, toUnit };
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
  let prefixHit = 0;
  for (const ra of a) {
    for (const ib of b) {
      if (ra.length >= 3 && (ib.startsWith(ra) || ra.startsWith(ib))) { prefixHit = 0.15; break; }
    }
    if (prefixHit) break;
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

// ── line classification ─────────────────────────────────────────────────────
// Alias map: key = normalizeIngredientName(item_name), value =
//   { ingredientId?, action?: 'IGNORE_ALWAYS', pricing?: 'FLAT', packQty?: number }
//   packQty (v2, learned): costing units contained in ONE package/each of this
//   exact receipt item. Set once from the needsConversion prompt.

function derivePerUnit(line) {
  if (line.unit_price_printed != null) return { perUnit: line.unit_price_printed, basis: 'printed_unit_price' };
  if (line.weighed && line.quantity != null && line.line_total != null) {
    return { perUnit: round(line.line_total / line.quantity), basis: 'total_div_weight' };
  }
  if (line.line_total != null) return { perUnit: line.line_total, basis: 'line_total' };
  return { perUnit: null, basis: null };
}

function onePackPriceFor(line, fromUnit) {
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
  } else {
    const scoreById = {};
    seed.forEach(ing => { scoreById[ing.id] = scoreNamePair(line.item_name, ing.name); });
    // v3 wine layer: a varietal/producer name IS the identification. Boost the
    // matching wine id to auto-strength; 'both' boosts both, and the wines
    // family tie routes it to review instead of guessing.
    const wine = wineHint(line.item_name);
    if (wine === 'red_wine' || wine === 'both') scoreById.red_wine = Math.max(scoreById.red_wine || 0, 0.9);
    if (wine === 'white_wine' || wine === 'both') scoreById.white_wine = Math.max(scoreById.white_wine || 0, 0.9);
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
    const scored = seed
      .map(ing => ({
        id: ing.id, name: ing.name, unit: ing.unit,
        score: Math.min(1, (scoreById[ing.id] || 0) + (famBonus[ing.id] || 0)),
        family: FAMILY_BY_MEMBER[ing.id] ? FAMILY_BY_MEMBER[ing.id].id : null,
        interchange: FAMILY_BY_MEMBER[ing.id] ? !!FAMILY_BY_MEMBER[ing.id].interchange : false,
      }))
      .filter(x => x.score >= FUZZY_WEAK)
      .sort((a, b) => b.score - a.score);
    candidates = scored.slice(0, 5);

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

  // (a) learned per-alias pack size — ask-once-convert-forever (checked before
  // the hardcoded overrides so a learned answer always wins)
  if (alias && alias.packQty > 0 && (basis === 'printed_unit_price' || basis === 'line_total') && line.line_total != null) {
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
  if (basis !== 'converted' && packOv && (basis === 'printed_unit_price' || basis === 'line_total') && line.line_total != null && packUnitLooksSingle) {
    const onePack = onePackPriceFor(line, fromUnit);
    perUnit = round(onePack / packOv.perBase);
    conversion = { fromUnit: packOv.fromUnit, toUnit, factor: packOv.perBase, basis: 'pack' };
    basis = 'converted';
  }

  // (b2) v3 SOLD-BY-EACH: rings up with a weight flag (or no unit) but is sold
  // per piece/bunch — the one-pack price IS the per-each price. Direct when the
  // costing unit is each-ish; otherwise bridge through 'each' (avg-weight).
  if (basis !== 'converted' && (SOLD_BY_EACH.has(ingredientId) || (alias && alias.soldByEach))
      && (line.weighed || !fromUnit) && line.line_total != null
      && (basis === 'line_total' || basis === 'printed_unit_price')
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
        const conv = convertPerUnit(onePack, 'each', toUnit, ingredientId);
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
  if (basis !== 'converted' && (basis === 'line_total' || (basis === 'printed_unit_price' && (!fromUnit || fromUnit === 'each' || fromUnit === 'package' || fromUnit === 'box')))
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

  if (basis !== 'converted' && perUnit != null && (basis === 'printed_unit_price' || basis === 'total_div_weight')) {
    // (c) real per-unit price in a different unit → table/bridge conversion
    const conv = convertPerUnit(perUnit, fromUnit, toUnit, ingredientId);
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
      && (basis === 'line_total' || (basis === 'printed_unit_price' && (!fromUnit || fromUnit === 'each' || fromUnit === 'package' || fromUnit === 'box')))) {
    const onePack = onePackPriceFor(line, fromUnit);
    return {
      status: 'needsConversion', norm, line, ingredientId, ingredient: seedIng, via, candidates,
      packPrice: onePack, toUnit,
      reasons: [`bought as a package but costed per ${toUnit} — how many ${toUnit} does one contain?`],
    };
  }

  // (e) v2: price sanity — a derived per-unit wildly off the ingredient's
  // current/baseline price demotes a fuzzy auto-match to review. Alias matches
  // stay matched (Kevin taught them) but carry a warning reason.
  const ref = seedIng ? (typeof seedIng.current === 'number' && seedIng.current > 0 ? seedIng.current
    : (typeof seedIng.baseline === 'number' && seedIng.baseline > 0 ? seedIng.baseline : null)) : null;
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

  return { status: 'matched', norm, line, ingredientId, ingredient: seedIng, via, perUnit, basis, conversion, candidates, confidence, reasons, weightSuggestion };
}

// Group identical item_name lines on the SAME receipt into one entry.
// v3.4: duplicate lines POOL their price math (weighted by quantity), instead
// of silently keeping only the first line's numbers. Kevin's real H-Mart
// receipt had two YELLOW ONION weighed lines (2.95 lb + 1.92 lb) — the pooled
// per-lb price is the quantity-weighted average across both.
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
      const w = Number(c.line.quantity) > 0 ? Number(c.line.quantity) : null;
      if (g.perUnit > 0 && c.perUnit > 0 && g._poolW != null && w != null) {
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
  // ── Jul 6 batch: seeded from Kevin's real H-E-B / H-Mart receipts ─────────
  'heb whole milk': { ingredientId: 'milk' },
  'garlic pk 5pc': { ingredientId: 'garlic' },                   // H-Mart 5-piece pack (name-size divides by the 5)                    // + PACK_OVERRIDE milk: always a gallon
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
};

export function buildReviewPlan(extracted, seed, aliases) {
  const store = extracted.store || null;
  const merged = { ...ALIAS_SEED, ...(aliases || {}) };
  const classified = (extracted.lines || []).map(l => classifyLine(l, seed, merged, store));
  const grouped = groupClassified(classified);
  return {
    store,
    receipt_date: extracted.receipt_date || null,
    buckets: {
      matched: grouped.filter(g => g.status === 'matched'),
      review: grouped.filter(g => g.status === 'review'),
      needsConversion: grouped.filter(g => g.status === 'needsConversion'),
      needsPrice: grouped.filter(g => g.status === 'needsPrice'),
      unmatched: grouped.filter(g => g.status === 'unmatched'),
      ignored: grouped.filter(g => g.status === 'ignored'),
    },
  };
}

// Default accept-toggle state for a matched group on the confirm screen.
export function defaultAccept(group) {
  return group.basis === 'total_div_weight' || group.basis === 'printed_unit_price' || group.basis === 'converted';
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

  for (const l of rawLines) {
    if (SKIP_LINE_RE.test(l)) {
      const money = l.match(/(\d+\.\d{2})\s*$/);
      if (money) {
        const val = Number(money[1]);
        if (/sale subtotal/i.test(l) && printed_subtotal == null) printed_subtotal = val;
        else if (/total sale|balance/i.test(l) && printed_total == null) printed_total = val;
      }
      pendingName = null; continue;
    }

    const w = l.match(hmWeight);
    if (w) { pendingWt = { qty: Number(w[1]), rate: Number(w[2]) }; continue; }

    const hd = pendingName && l.match(hebDetail);
    if (hd) {
      emit({ raw: pendingName + ' | ' + l, name: pendingName, qty: Number(hd[1]), unit: 'ea',
             rate: Number(hd[2]), flag: hd[3] || null, total: Number(hd[4]),
             weighed: /w/i.test(hd[3] || '') });
      pendingName = null; continue;
    }

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
      pendingName = null; continue;
    }

    // Bare name line (H-E-B first line of a pair): "1 KITCH BASICS UNSLTD BEEF"
    const bare = l.match(/^(?:\d{1,2}\s+)?([A-Z][A-Z0-9 %&#.\/'-]{2,})$/);
    if (bare && !/^\d+(\.\d+)?$/.test(bare[1])) {
      if (pendingName) unparsed.push(pendingName); // previous never got a detail line
      pendingName = bare[1].trim(); continue;
    }
    unparsed.push(l);
  }
  if (pendingName) unparsed.push(pendingName);
  return { store, receipt_date, lines, unparsed, printed_subtotal, printed_total };
}

// v3.4: reconcile the parsed lines against the receipt's own printed number.
// Small gaps are normal (discount lines, deliberately skipped items); a big
// gap means a line was missed or misread. Informational, never blocking.
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
  // Persist the effective pack size when a conversion produced the accepted price
  const onePack = group.lines && group.lines[0] ? (group.lines[0].line_total != null ? group.lines[0].line_total / Math.max(1, Number(group.lines[0].quantity) || 1) : null) : null;
  if (group.conversion && group.perUnit > 0 && onePack != null
      && (group.conversion.basis === 'name_size' || group.conversion.basis === 'pack_conversion' || group.conversion.basis === 'sold_by_each')) {
    entry.packQty = Math.round((onePack / group.perUnit) * 1000) / 1000;
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
