// LTB Phase 3 — receipt matcher (deterministic, app-side).
// Pure functions: no API, no storage, no React. Takes extracted JSON + the
// ingredient DB + the alias map, returns a structured plan the review screen
// renders. All matching/costing lives here (auditable) — the model only extracts.

import { normalizeIngredientName } from './recipes.js';

// ── unit conversion ─────────────────────────────────────────────────────────
// Receipts print a purchase unit (GAL, LB, OZ…) that often differs from the
// unit an ingredient is COSTED in (milk per cup, butter per stick). When the
// two differ but live in the same family, we convert the per-unit price into
// the ingredient's canonical unit automatically instead of asking Kevin to do
// the arithmetic. The confirm screen still shows every converted line for
// approval — this removes the math, not the sign-off.
//
// Two families, each anchored to one base unit:
//   volume → base 'cup'      weight → base 'lb'
// factor = how many BASE units one of this unit equals.
//   gallon: 16 (16 cups per gallon);  oz: 0.0625 (1/16 lb)
const UNIT_FAMILY = {
  // volume (base: cup)
  cup: 'vol', tbs: 'vol', tbsp: 'vol', tsp: 'vol', fl_oz: 'vol',
  pint: 'vol', quart: 'vol', gallon: 'vol', half_gallon: 'vol',
  liter: 'vol', ml: 'vol',
  // weight (base: lb)
  lb: 'wt', oz: 'wt', g: 'wt', kg: 'wt',
};
const TO_BASE = {
  // volume in cups
  cup: 1, tbs: 1 / 16, tbsp: 1 / 16, tsp: 1 / 48, fl_oz: 1 / 8,
  pint: 2, quart: 4, gallon: 16, half_gallon: 8,
  liter: 4.22675, ml: 0.00422675,
  // weight in lb
  lb: 1, oz: 1 / 16, g: 1 / 453.592, kg: 2.20462,
};

// Normalize a raw receipt unit token to a canonical key above. Receipts are
// terse and inconsistent ("GAL", "1 GAL", "#", "LB", "OZ"). Returns null when
// it isn't a unit we convert (recipe-portion units, 'each', blanks) so those
// fall through to the normal confirm path unchanged.
export function normalizeUnit(raw) {
  if (!raw) return null;
  const u = String(raw).toLowerCase().trim()
    .replace(/^[\d.\/]+\s*/, '')    // drop a leading quantity if the model left it ("1 gal" → "gal")
    .replace(/[.\s]/g, '')          // "fl. oz" → "floz"
    .replace(/s$/, '');             // plural → singular ("gallons" → "gallon")
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
    box: 'box', bx: 'box', carton: 'box',
  };
  return map[u] || null;
}

// Fixed pack buys: when the receipt prices a whole pack but we cost per piece.
// `fromUnit` is the receipt unit that triggers it; `perBase` is how many
// costing-units are in one pack. Because this keys on the receipt's printed
// unit, an ingredient bought loose one trip and packaged the next converts
// only when the pack unit actually appears (e.g. garlic: a "5 pack" line
// divides by 5, a loose "head"/"each" line passes straight through).
const PACK_OVERRIDE = {
  butter: { fromUnit: 'lb', perBase: 4 },              // 1 lb butter = 4 sticks
  guittard_low: { fromUnit: 'package', perBase: 283 }, // 1 package = 283 g
  guittard_high: { fromUnit: 'package', perBase: 283 },
  kosher_salt: { fromUnit: 'box', perBase: 90.7 },     // Morton 1.36kg box ≈ 90.7 tbsp
  garlic: { fromUnit: 'package', perBase: 5 },         // labeled 5-pack = 5 heads; loose "each"/"head" must pass through (eachIsPack stays false)
  chocolate_100: { fromUnit: 'package', perBase: 8, eachIsPack: true },  // 8-square pack; an "Ea" line is the whole pack
  beef_stock: { fromUnit: 'package', perBase: 4, eachIsPack: true },     // Kitch Basics carton = 4 cups; "2 Ea" = 2 cartons
  tofu: { fromUnit: 'package', perBase: 1, eachIsPack: true },           // 16oz package = 1 block; "Ea" = one package
  baby_gold_potatoes: { fromUnit: 'package', perBase: 2, eachIsPack: true }, // 1 bag = 2 lb (baby gold ONLY)
  red_wine: { fromUnit: 'package', perBase: 3.17, fixedCount: true, matchNullUnit: true, eachIsPack: true }, // bottle or 4-pack minis ≈ 750ml ≈ 3.17 cups
};

// Per-each produce that is sometimes weighed at the register. The costing unit
// is 'each', but a per-lb receipt price converts via a known average weight.
// price/lb × lbPerEach = price/each. Keyed by ingredient id.
const EACH_LB_BRIDGE = {
  onion: { lbPerEach: 0.6 },   // 1 yellow onion ≈ 0.6 lb
};

// Convert a per-unit price FROM the receipt unit INTO the ingredient's costing
// unit. Returns { perUnit, factor } or null if not convertible (different
// families, unknown unit, or already matching — caller treats null as "no
// conversion needed/possible" and proceeds normally).
export function convertPerUnit(perUnit, fromUnit, toUnit, ingredientId) {
  if (perUnit == null) return null;
  // 1) fixed pack override (pack/box/package → pieces), fires on receipt unit
  const ov = ingredientId && PACK_OVERRIDE[ingredientId];
  if (ov && fromUnit === ov.fromUnit) {
    return { perUnit: round3(perUnit / ov.perBase), factor: ov.perBase, fromUnit, toUnit };
  }
  // 2) each↔lb bridge for per-each produce weighed at the register
  const br = ingredientId && EACH_LB_BRIDGE[ingredientId];
  if (br && toUnit === 'each' && fromUnit === 'lb') {
    return { perUnit: round3(perUnit * br.lbPerEach), factor: br.lbPerEach, fromUnit, toUnit };
  }
  if (!fromUnit || !toUnit || fromUnit === toUnit) return null;
  const fam = UNIT_FAMILY[fromUnit];
  if (!fam || fam !== UNIT_FAMILY[toUnit]) return null;   // cross-family → don't guess
  // price per `fromUnit` → price per BASE → price per `toUnit`
  const perBase = perUnit / TO_BASE[fromUnit];
  const out = perBase * TO_BASE[toUnit];
  const factor = TO_BASE[fromUnit] / TO_BASE[toUnit];     // fromUnits per toUnit
  return { perUnit: round3(out), factor, fromUnit, toUnit };
}

const round3 = (n) => Math.round(n * 1000) / 1000;

// ── fuzzy scoring ──────────────────────────────────────────────────────────
// Token-set overlap (Dice) + a small prefix bonus for truncated store-brand
// names. Cheap and deterministic. Aliases handle the genuinely weird strings.
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

// TIMID on purpose: wrong cost data is the cardinal sin. Auto-match only when
// confident; everything mid-range goes to the disambiguation popup, never auto.
export const FUZZY_STRONG = 0.6;  // auto-match, pre-checked
export const FUZZY_WEAK = 0.34;   // show as candidate only

const round = (n) => Math.round(n * 1000) / 1000;

// Alias map: key = normalizeIngredientName(item_name),
//   value = { ingredientId?, action?: 'IGNORE_ALWAYS', pricing?: 'FLAT' }.
//   ingredientId + pricing:'FLAT' may coexist; action is exclusive.

function classifyLine(line, seed, aliases, store) {
  const norm = normalizeIngredientName(line.item_name);
  const alias = aliases[norm];

  if (alias && alias.action === 'IGNORE_ALWAYS') {
    return { status: 'ignored', norm, line, reason: 'alias_ignore' };
  }

  let ingredientId = null, candidates = [], via = null;
  if (alias && alias.ingredientId) {
    ingredientId = alias.ingredientId;
    via = 'alias';
  } else {
    const scored = seed
      .map(ing => ({ id: ing.id, name: ing.name, unit: ing.unit, score: scoreNamePair(line.item_name, ing.name) }))
      .filter(x => x.score >= FUZZY_WEAK)
      .sort((a, b) => b.score - a.score);
    candidates = scored.slice(0, 5);
    if (candidates.length && candidates[0].score >= FUZZY_STRONG) {
      ingredientId = candidates[0].id;
      via = 'fuzzy';
    }
  }

  const aliasFlat = alias && alias.pricing === 'FLAT';
  // A line only needs a manual price when it's genuinely weighed but the weight
  // wasn't printed, so we can't derive a per-unit cost. We trust the per-line
  // `weighed` flag the extractor sets from the actual receipt (a weight or "@"
  // rate). H-Mart mixes by-the-pound and by-the-pack lines; a pack line is
  // weighed=false and flows straight through, a weighed line with a printed
  // weight derives its per-unit, and only a weighed line missing its weight
  // (any store) drops to the price prompt.
  const weighedNoWeight = line.weighed && (line.quantity == null) && (line.unit_price_printed == null);
  const needsPrice = !aliasFlat && weighedNoWeight;

  const seedIng = ingredientId ? seed.find(s => s.id === ingredientId) : null;

  if (!ingredientId) {
    return { status: 'unmatched', norm, line, candidates, needsPrice };
  }
  if (needsPrice) {
    return { status: 'needsPrice', norm, line, ingredientId, ingredient: seedIng, via, candidates, reason: 'weighed_no_weight' };
  }
  // matched & priced — derive a raw figure and tag the basis.
  let perUnit = null, basis = null;
  if (line.unit_price_printed != null) {
    perUnit = line.unit_price_printed; basis = 'printed_unit_price';
  } else if (line.weighed && line.quantity != null && line.line_total != null) {
    perUnit = round(line.line_total / line.quantity); basis = 'total_div_weight';
  } else if (line.line_total != null) {
    perUnit = line.line_total; basis = 'line_total';
  }
  let conversion = null;
  const fromUnit = normalizeUnit(line.unit);
  const toUnit = seedIng ? seedIng.unit : null;
  const packOv = ingredientId ? PACK_OVERRIDE[ingredientId] : null;

  // (a) PACK OVERRIDE — this ingredient is bought as a fixed pack and the receipt
  // unit looks like a single-pack unit (the override's own unit, a bare "each"/
  // "ea" for carton-style packs, or no unit). Convert the price of ONE pack into
  // the per-costing-unit cost by dividing by the pack size.
  //
  // The printed quantity is ambiguous and must be read by unit:
  //   • unit is the PACK unit ("5 pack", "package", "bottle"): the printed count
  //     describes pack CONTENTS (garlic "5 pack" qty 5 = 5 heads in the pack), so
  //     ignore it — the line_total IS the one-pack price, perBase does the divide.
  //   • unit is "each"/"Ea": the printed count is how many packs were bought
  //     (beef stock "2 Ea" = 2 cartons), so reduce line_total ÷ count to one pack.
  const packUnitLooksSingle = packOv && (
    fromUnit === packOv.fromUnit ||
    (fromUnit === 'each' && packOv.eachIsPack) ||
    (!fromUnit && (packOv.eachIsPack || packOv.matchNullUnit))
  );
  if (packOv && (basis === 'printed_unit_price' || basis === 'line_total') && line.line_total != null && packUnitLooksSingle) {
    // Determine the price of ONE pack:
    //   • if a per-each price was printed ("2 Ea @ 2.98"), that IS the one-pack
    //     price — use it directly, do NOT divide by the count again.
    //   • otherwise it's a lump line_total: for an "each" unit divide by how many
    //     packs were bought; for a pack unit the total is already one pack.
    let onePackPrice;
    if (line.unit_price_printed != null) {
      onePackPrice = line.unit_price_printed;
    } else {
      const isEachUnit = fromUnit === 'each';
      const packsBought = (isEachUnit && typeof line.quantity === 'number' && line.quantity > 0) ? line.quantity : 1;
      onePackPrice = round(line.line_total / packsBought);
    }
    perUnit = round(onePackPrice / packOv.perBase);
    conversion = { fromUnit: packOv.fromUnit, toUnit, factor: packOv.perBase, basis: 'pack' };
    basis = 'converted';
  } else if (perUnit != null && (basis === 'printed_unit_price' || basis === 'total_div_weight')) {
    // (b) a real per-unit price in a different unit → table/bridge conversion
    const conv = convertPerUnit(perUnit, fromUnit, toUnit, ingredientId);
    if (conv) {
      perUnit = conv.perUnit;
      conversion = { fromUnit: conv.fromUnit, toUnit: conv.toUnit, factor: conv.factor, basis };
      basis = 'converted';
    }
  }
  return { status: 'matched', norm, line, ingredientId, ingredient: seedIng, via, perUnit, basis, conversion, candidates };
}

// Group identical item_name lines on the SAME receipt into one entry (the two
// KING OYSTER MUSHRM lines → one prompt). Keep all raw lines + the summed total.
function groupClassified(classified) {
  const groups = new Map();
  for (const c of classified) {
    const key = c.status === 'ignored'
      ? 'IGNORE::' + c.norm
      : (c.ingredientId || 'UNMATCHED') + '::' + c.norm + '::' + c.status;
    if (!groups.has(key)) {
      groups.set(key, { ...c, lines: [c.line], count: 1, totalSum: c.line.line_total || 0 });
    } else {
      const g = groups.get(key);
      g.lines.push(c.line);
      g.count++;
      g.totalSum = round(g.totalSum + (c.line.line_total || 0));
    }
  }
  return [...groups.values()];
}

// Built-in alias seed: recurring store-brand / abbreviated receipt names that
// fuzzy matching can't reach, mapped to their ingredient id. Keys are already
// normalizeIngredientName()-form (lowercased, parentheticals dropped, words >4
// chars singularized). OCR drifts on some of these, so common misreads get
// their own key. Learned aliases (what Kevin maps in-app) merge ON TOP of this,
// so a manual remap always wins.
export const ALIAS_SEED = {
  // beef stock — Kitch Basics carton (OCR: KITCH BASICS / KITCH BASIC, U/LNSLTD)
  'kitch basic unsltd beef': { ingredientId: 'beef_stock' },
  'kitch basic lnsltd beef': { ingredientId: 'beef_stock' },
  'kitch basic unslted beef': { ingredientId: 'beef_stock' },
  // beef chuck roast — "SEL BNL/BAL SHLDER RST" (boneless shoulder roast)
  'sel bnl shlder rst': { ingredientId: 'beef_chuck' },
  'sel bal shlder rst': { ingredientId: 'beef_chuck' },
  'sel bnl shldr rst': { ingredientId: 'beef_chuck' },
  // tofu — Banyan hard tofu (OCR often "TCFU")
  'banyan hard tcfu': { ingredientId: 'tofu' },
  'banyan hard tofu': { ingredientId: 'tofu' },
  // seasonal melons — all variants map to the one melon ingredient (like dried chilis)
  'emerald crunch dm': { ingredientId: 'cantaloupe' },
  'emerald crunch dm 11-12 c': { ingredientId: 'cantaloupe' },
  'emerald crunch melon': { ingredientId: 'cantaloupe' },
  'emerald crunch': { ingredientId: 'cantaloupe' },
  'dulcinea melon': { ingredientId: 'cantaloupe' },
  // good parm — Agriform Parmigiano 24 month (OCR: ANRIFORM/AGRIFORM)
  'agriform parmigiano 24 mo': { ingredientId: 'parm' },
  'anriform parmigiano 24 mo': { ingredientId: 'parm' },
  'agriform parmigiano': { ingredientId: 'parm' },
  // baby gold potatoes — bagged (2 lb bag handled by PACK_OVERRIDE)
  'bagged baby gold potatoe': { ingredientId: 'baby_gold_potatoes' },
  'bagged baby gold potato': { ingredientId: 'baby_gold_potatoes' },
  'baby gold potatoe': { ingredientId: 'baby_gold_potatoes' },
  'baby gold potato': { ingredientId: 'baby_gold_potatoes' },
  // 100% chocolate — Ghirardelli 100% cocoa unsweetened (8-square pack)
  'ghirardelli 100% cocoa un': { ingredientId: 'chocolate_100' },
  'ghirardelli 100% cocoa unsweetened': { ingredientId: 'chocolate_100' },
  'ghirardelli 100 cocoa un': { ingredientId: 'chocolate_100' },
  // fennel bulb — "ANISE FENNEL"
  'anise fennel': { ingredientId: 'fennel_bulb' },
  'fennel anise': { ingredientId: 'fennel_bulb' },
  // bulb/spring onion — "SWEET BULB ONIONS" (used in the pappardelle recipe)
  'sweet bulb onion': { ingredientId: 'bulb_onion' },
  'bulb onion': { ingredientId: 'bulb_onion' },
  // tomato paste — "HUNTS TOMATO PASTE W BASIL" (OCR: PASTE/FASTE)
  'hunt tomato paste w basi': { ingredientId: 'tomato_paste' },
  'hunt tomato faste w basi': { ingredientId: 'tomato_paste' },
  'hunt tomato paste': { ingredientId: 'tomato_paste' },
  // apples — "HONEYCRISP APPLES"
  'honeycrisp apple': { ingredientId: 'apple' },
  'honeycrisp': { ingredientId: 'apple' },
  // asparagus — "ASPARAGUS STANDARD"
  'asparagu standard': { ingredientId: 'asparagus' },
  'asparagus standard': { ingredientId: 'asparagus' },
  // scallions — "GREEN ONIONS"
  'green onion': { ingredientId: 'scallions' },
};

export function buildReviewPlan(extracted, seed, aliases) {
  const store = extracted.store || null;
  // learned aliases merge on top of the built-in seed (a manual remap wins)
  const merged = { ...ALIAS_SEED, ...(aliases || {}) };
  const classified = (extracted.lines || []).map(l => classifyLine(l, seed, merged, store));
  const grouped = groupClassified(classified);
  return {
    store,
    receipt_date: extracted.receipt_date || null,
    buckets: {
      matched: grouped.filter(g => g.status === 'matched'),
      needsPrice: grouped.filter(g => g.status === 'needsPrice'),
      unmatched: grouped.filter(g => g.status === 'unmatched'),
      ignored: grouped.filter(g => g.status === 'ignored'),
    },
  };
}

// Default accept-toggle state for a matched group on the confirm screen:
// weight-derived per-unit is unambiguous → ON; line-total basis may carry a
// unit mismatch (box vs stick) → OFF until Kevin nods.
export function defaultAccept(group) {
  return group.basis === 'total_div_weight' || group.basis === 'printed_unit_price' || group.basis === 'converted';
}
