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
    package: 'package', pkg: 'package', pk: 'package', pack: 'package', bar: 'package', bag: 'package',
    box: 'box', bx: 'box', carton: 'box',
  };
  return map[u] || null;
}

// Butter is the one fixed-pack special case: Kevin always buys 1 lb = 4 sticks,
// so a per-lb butter price converts to per-stick by /4. Keyed by ingredient id.
// Same mechanism for other always-same-package buys: Guittard (283g bar) and
// kosher salt (Morton 1.36kg box). `fromUnit` is what the receipt prices in;
// `perBase` is how many costing-units are in one purchased pack.
const PACK_OVERRIDE = {
  butter: { fromUnit: 'lb', perBase: 4 },          // 1 lb butter = 4 sticks
  guittard_low: { fromUnit: 'package', perBase: 283 },  // 1 package = 283 g
  guittard_high: { fromUnit: 'package', perBase: 283 },
  kosher_salt: { fromUnit: 'box', perBase: 90.7 },  // Morton 1.36kg box ≈ 90.7 tbsp (15g/tbsp)
};

// Convert a per-unit price FROM the receipt unit INTO the ingredient's costing
// unit. Returns { perUnit, factor } or null if not convertible (different
// families, unknown unit, or already matching — caller treats null as "no
// conversion needed/possible" and proceeds normally).
export function convertPerUnit(perUnit, fromUnit, toUnit, ingredientId) {
  if (perUnit == null) return null;
  // butter-style fixed pack override first
  const ov = ingredientId && PACK_OVERRIDE[ingredientId];
  if (ov && fromUnit === ov.fromUnit) {
    return { perUnit: round3(perUnit / ov.perBase), factor: ov.perBase, fromUnit, toUnit };
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
  const hmartWeighed = store === 'H-Mart' && (line.tax_flag === 'F' || line.tax_flag === 'FW') && !aliasFlat;
  const weighedNoWeight = line.weighed && (line.quantity == null);
  const needsPrice = !aliasFlat && (weighedNoWeight || hmartWeighed);

  const seedIng = ingredientId ? seed.find(s => s.id === ingredientId) : null;

  if (!ingredientId) {
    return { status: 'unmatched', norm, line, candidates, needsPrice };
  }
  if (needsPrice) {
    const reason = weighedNoWeight ? 'weighed_no_weight' : 'hmart_default';
    return { status: 'needsPrice', norm, line, ingredientId, ingredient: seedIng, via, candidates, reason };
  }
  // matched & priced — derive per-unit and tag the basis (drives the
  // confirm-screen accept-toggle default: weight-derived = ON, line_total = OFF)
  let perUnit = null, basis = null;
  if (line.unit_price_printed != null) {
    perUnit = line.unit_price_printed; basis = 'printed_unit_price';
  } else if (line.weighed && line.quantity != null && line.line_total != null) {
    perUnit = round(line.line_total / line.quantity); basis = 'total_div_weight';
  } else if (line.line_total != null) {
    perUnit = line.line_total; basis = 'line_total';
  }
  // Auto-convert the per-unit price into the ingredient's costing unit when the
  // receipt's unit differs (e.g. milk priced per gallon → per cup). Carries the
  // conversion detail so the confirm screen can show "per gal → per cup (÷16)".
  // Only fires for printed/weight bases (a real per-unit number); a bare
  // line_total has no trustworthy unit attached, so it still goes to confirm.
  let conversion = null;
  const fromUnit = normalizeUnit(line.unit);
  const toUnit = seedIng ? seedIng.unit : null;
  if (perUnit != null && (basis === 'printed_unit_price' || basis === 'total_div_weight')) {
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

export function buildReviewPlan(extracted, seed, aliases) {
  const store = extracted.store || null;
  const classified = (extracted.lines || []).map(l => classifyLine(l, seed, aliases || {}, store));
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
