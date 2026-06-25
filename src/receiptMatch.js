// LTB Phase 3 — receipt matcher (deterministic, app-side).
// Pure functions: no API, no storage, no React. Takes extracted JSON + the
// ingredient DB + the alias map, returns a structured plan the review screen
// renders. All matching/costing lives here (auditable) — the model only extracts.

import { normalizeIngredientName } from './recipes.js';

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
  return { status: 'matched', norm, line, ingredientId, ingredient: seedIng, via, perUnit, basis, candidates };
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
  return group.basis === 'total_div_weight' || group.basis === 'printed_unit_price';
}
