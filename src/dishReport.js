// ═══════════════════════════════════════════════════════════════════════════
// DISH REPORT ENGINE (v9.21) — the data layer behind the Recipes tab
// ═══════════════════════════════════════════════════════════════════════════
// Everything the Recipes tab shows comes from buildDishReport(). This module
// is PURE (no React, no storage): the app injects liveCostMap/baseCostMap/
// costHistory and gets back a complete, display-ready report. That makes it
// fully testable under the invariant suite, and it means adding a new dish or
// ingredient to the registry automatically flows here — nothing in this file
// hardcodes dish names.
//
// THE VARIANT DECOMPOSITION (the architectural core):
// Variant labels are flat strings, but they hide a two-dimensional structure:
// a FLAVOR axis (protein/add-on: "Lamb", "Pulled Pork", "+ Polenta",
// "Lamb + Asian Greens") and a SIZE axis (Small/Large). decomposeVariants()
// parses every label into {flavor × size} so the UI can offer a flavor
// dropdown with a Small⇄Large toggle (Kevin's Cumin-lamb example), instead of
// a flat 12-item variant list. Rules learned from the real registry:
//   • Size token: \b(Small|Large)\b, optionally "Batch", with any
//     parenthetical after it ("Small Batch (~3-4)", "Small (split order, ~4)").
//   • Flavor prefix: text before the size clause ("Chicken, Small…" → Chicken).
//   • Flavor suffix: "+ …" after the size clause ("… + Polenta"). Suffix
//     parentheticals are QUANTITIES that differ by size ("+ Asian Greens
//     (1/2 lb)" vs "(1 lb)") and must be stripped before grouping, or the
//     small and large of the same flavor would land in different groups.
//   • No size token at all (Boeuf, Homegrown) → a sizeless flavor; the label
//     minus servings text becomes the flavor name.
//   • Empty flavor → 'Standard'.
// The decomposition is TOTAL and COLLISION-FREE by invariant: every variant
// maps to exactly one (flavor, size) cell and no cell holds two variants.
// ═══════════════════════════════════════════════════════════════════════════
import { DISHES } from './dishes.js';
import { RECIPES, DINNER_REHEAT_BUCKET, buildReheatBlocks } from './recipes.js';
import {
  resolveDishVariant, costDishVariant, MARGIN_BUFFER, trueRawCost, baselineCostMap,
} from './dishCosting.js';
import { INGREDIENT_SEED } from './ingredients.js';

const ING_BY_ID = new Map(INGREDIENT_SEED.map(i => [i.id, i]));

// ── Servings parsing ─────────────────────────────────────────────────────────
// "Small (~4-5 servings)" → 4.5 · "Large (~8-12)" → 10 · "~4 servings" → 4
// "(split order, ~3-6)" → 4.5 · no marker → null.
export function parseServings(label) {
  const m = String(label || '').match(/~\s*(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?/);
  if (!m) return null;
  const lo = Number(m[1]);
  const hi = m[2] != null ? Number(m[2]) : lo;
  return (lo + hi) / 2;
}

// ── Flavor/size decomposition ────────────────────────────────────────────────
const SIZE_RE = /(?:^|,\s*)(Small|Large)(?:\s+Batch)?\s*(\([^)]*\))?/;

function parseVariantLabel(label) {
  const raw = String(label || '');
  const m = raw.match(SIZE_RE);
  if (!m) {
    // Sizeless: the flavor is the label with servings decoration stripped.
    const flavor = raw.replace(/\(?~[^)]*\)?/g, '').replace(/\s{2,}/g, ' ').trim() || 'Standard';
    return { flavor, size: null };
  }
  const size = m[1].toLowerCase(); // 'small' | 'large'
  const prefix = raw.slice(0, m.index).replace(/,\s*$/, '').trim();
  let suffix = raw.slice(m.index + m[0].length).trim();
  // Suffix parentheticals are size-dependent quantities — strip for grouping.
  suffix = suffix.replace(/\([^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  suffix = suffix.replace(/^\+\s*/, '+ '); // normalize "+Polenta" spacing
  const flavor = [prefix, suffix].filter(Boolean).join(' ').trim() || 'Standard';
  return { flavor, size };
}

// decomposeVariants(variants) → {
//   groups: [{ flavor, small: variant|null, large: variant|null, only: variant|null }],
//   hasSizeToggle: bool  (any group with both sizes)
// }
// Group order follows first appearance in the registry (Kevin's display order).
export function decomposeVariants(variants) {
  const groups = [];
  const byFlavor = new Map();
  const collisions = [];
  for (const v of (variants || [])) {
    const { flavor, size } = parseVariantLabel(v.label);
    if (!byFlavor.has(flavor)) {
      const g = { flavor, small: null, large: null, only: null };
      byFlavor.set(flavor, g);
      groups.push(g);
    }
    const g = byFlavor.get(flavor);
    const cell = size === 'small' ? 'small' : size === 'large' ? 'large' : 'only';
    if (g[cell]) collisions.push({ flavor, size: cell, a: g[cell].label, b: v.label });
    else g[cell] = v;
  }
  return {
    groups,
    hasSizeToggle: groups.some(g => g.small && g.large),
    collisions, // invariant asserts this is always empty
  };
}

// ── Price-to-hold-floor ──────────────────────────────────────────────────────
// Given the live raw cost and the floor, what price holds the margin?
// exact = raw / (1 - floor). suggested = exact rounded UP to the next $5
// (Kevin prices in $5 steps).
export function priceToHoldFloor(rawCost, floorPct = 45) {
  if (!(rawCost > 0)) return null;
  const exact = rawCost / (1 - floorPct / 100);
  return { exact: Math.round(exact * 100) / 100, suggested: Math.ceil(exact / 5) * 5 };
}

// ── Per-variant economics ────────────────────────────────────────────────────
function variantEconomics(dishName, v, liveCostMap, baseCostMap, floorPct) {
  const live = costDishVariant(dishName, v.label, v.cost, liveCostMap, baseCostMap);
  const liveCost = live.adjustedCost != null ? live.adjustedCost : v.cost; // buffered
  const rawCost = trueRawCost(liveCost);                                    // un-buffered spend
  // Independent recomputation from CURRENT costs (same math as recipeFor's
  // costed lines). The anchor is the HISTORICAL pricing basis; these two
  // differ wherever baselines moved since pricing or a dish predates the
  // buffer treatment. The gap is surfaced, not hidden — it's Kevin's
  // re-anchor radar (the standing "re-price 8 newer dishes" TODO made visible).
  const resolved = resolveDishVariant(dishName, v.label) || [];
  let recomputedRaw = 0;
  for (const line of resolved) {
    const ing = ING_BY_ID.get(line.id);
    const unitCost = (liveCostMap && liveCostMap[line.id] != null) ? liveCostMap[line.id] : (ing ? ing.baseline : 0);
    recomputedRaw += line.qty * unitCost;
  }
  recomputedRaw = Math.round(recomputedRaw * 100) / 100;
  const anchorGapPct = rawCost > 0 ? Math.round(((recomputedRaw - rawCost) / rawCost) * 1000) / 10 : null;
  const servings = parseServings(v.label);
  const marginLive = v.price - liveCost;
  const marginLivePct = v.price > 0 ? (marginLive / v.price) * 100 : 0;
  // FLOOR CONVENTION: matches the invariant suite — margin measured against
  // the BUFFERED cost ($40 on $23.32 = 41.7%). trueMarginPct (against
  // un-buffered spend) rides along as supplementary info, but under-floor
  // flags and hold-price math use the suite's basis so this tab never
  // disagrees with the gate.
  const trueMarginPct = v.price > 0 ? (1 - rawCost / v.price) * 100 : 0;
  const hold = priceToHoldFloor(liveCost, floorPct);
  return {
    label: v.label,
    price: v.price,
    anchorCost: v.cost,          // the baked buffered anchor from the registry
    liveCost,                    // anchor moved by ingredient drift (Option B)
    rawCost,                     // true un-buffered spend
    driftPct: live.pctDrift || 0,
    servings,
    pricePerServing: servings ? v.price / servings : null,
    rawCostPerServing: servings ? rawCost / servings : null,
    marginLive,                  // $ margin against buffered live cost
    marginLivePct,               // % margin against buffered live cost (ref-card style)
    trueMarginPct,               // % margin against true raw cost (suite/floor style)
    marginBasePct: v.price > 0 ? ((v.price - v.cost) / v.price) * 100 : 0,
    recomputedRaw,               // today's ingredient reality (matches recipeFor)
    anchorGapPct,                // % the anchor has drifted from reality — re-anchor radar
    trueMarginTodayPct: v.price > 0 ? (1 - recomputedRaw / v.price) * 100 : 0,
    underFloor: marginLivePct < floorPct,                     // suite basis (buffered)
    underFloorToday: v.price > 0 ? (1 - (recomputedRaw * MARGIN_BUFFER) / v.price) * 100 < floorPct : false,
    priceToHoldFloor: hold,      // { exact, suggested } — only meaningful when under/near floor
  };
}

// ── Recipe view for one variant ──────────────────────────────────────────────
// Two layers, deliberately:
//   displayLines — the recipe AS WRITTEN, quantities scaled by the variant's
//     factor (fixed lines don't scale). This is what Kevin cooks from.
//   costedLines  — the recipe AS COSTED (resolveDishVariant), per ingredient
//     id in purchase units with live unit cost, line cost, and % of raw.
//     This is where "the mushrooms are 60% of this dish" becomes visible.
export function recipeForVariant(dishName, variantLabel, liveCostMap) {
  const r = RECIPES[dishName];
  if (!r) return null;
  const factor = r.factors?.[variantLabel] ?? 1;
  const rawLines = [...(r.base || []), ...((r.extras || {})[variantLabel] || [])];
  const displayLines = rawLines.map(ln => ({
    name: ln.name,
    qty: ln.fixed ? ln.q : ln.q * factor,
    unit: ln.u,
    staple: !!ln.staple,
    scaled: !ln.fixed && factor !== 1,
  }));

  const resolved = resolveDishVariant(dishName, variantLabel) || [];
  const costed = resolved.map(line => {
    const ing = ING_BY_ID.get(line.id);
    const unitCost = (liveCostMap && liveCostMap[line.id] != null)
      ? liveCostMap[line.id]
      : (ing ? ing.baseline : 0);
    return {
      id: line.id,
      name: ing ? ing.name : line.id,
      qty: Math.round(line.qty * 1000) / 1000,
      unit: ing ? ing.unit : '',
      unitCost,
      lineCost: Math.round(line.qty * unitCost * 100) / 100,
      fixed: !!line.fixed,
      staple: !!line.staple,
    };
  });
  const rawTotal = costed.reduce((s, l) => s + l.lineCost, 0);
  costed.forEach(l => { l.pctOfRaw = rawTotal > 0 ? Math.round((l.lineCost / rawTotal) * 1000) / 10 : 0; });
  costed.sort((a, b) => b.lineCost - a.lineCost);

  return {
    factor,
    displayLines,
    costedLines: costed,
    rawTotal: Math.round(rawTotal * 100) / 100,
    costDrivers: costed.slice(0, 3).map(l => ({ name: l.name, pctOfRaw: l.pctOfRaw, lineCost: l.lineCost })),
  };
}

// ── Scaling check ────────────────────────────────────────────────────────────
// For every flavor with both sizes: is Large the expected multiple of Small
// per ingredient (excluding fixed lines, which deliberately don't scale)?
// The expected multiple is factorLarge / factorSmall from the recipe — but the
// REAL check is per resolved ingredient, which catches extras that break the
// rule (the documented Bolognese egg-pappardelle 2-pack→3-pack exception
// shows up here as a mismatch, by design).
export function scalingCheck(dishName, groups) {
  const out = [];
  for (const g of groups) {
    if (!g.small || !g.large) continue;
    const small = resolveDishVariant(dishName, g.small.label) || [];
    const large = resolveDishVariant(dishName, g.large.label) || [];
    const sById = new Map(small.filter(l => !l.fixed).map(l => [l.id, l.qty]));
    const lById = new Map(large.filter(l => !l.fixed).map(l => [l.id, l.qty]));
    const mismatches = [];
    let ratio = null;
    for (const [id, sq] of sById) {
      const lq = lById.get(id);
      if (lq == null) { mismatches.push({ id, note: 'in Small only' }); continue; }
      const r = sq > 0 ? lq / sq : null;
      if (r == null) continue;
      if (ratio == null) ratio = r;
      else if (Math.abs(r - ratio) > 0.01) {
        mismatches.push({ id, note: `scales ×${Math.round(r * 100) / 100} vs ×${Math.round(ratio * 100) / 100}` });
      }
    }
    for (const id of lById.keys()) {
      if (!sById.has(id)) mismatches.push({ id, note: 'in Large only' });
    }
    out.push({
      flavor: g.flavor,
      ratio: ratio != null ? Math.round(ratio * 100) / 100 : null,
      clean: mismatches.length === 0,
      mismatches,
    });
  }
  return out;
}

// ── Cost over time ───────────────────────────────────────────────────────────
// costHistory is [{ t, id, cost }] (t Date-parseable). Two products:
//   ingredientTrends — per ingredient IN THIS DISH: its own series + change.
//   dishSeries       — the dish's raw cost REPLAYED through history: start at
//     the baseline map, apply history points in time order, and re-cost the
//     given variant at each timestamp that touches one of its ingredients.
//     This is the real "cost over time" graph the old card stubbed out.
export function costOverTime(dishName, variantLabel, costHistory, baseCostMap) {
  const resolved = resolveDishVariant(dishName, variantLabel) || [];
  const dishIds = new Set(resolved.map(l => l.id));
  const hist = (costHistory || [])
    .filter(h => h && dishIds.has(h.id) && h.cost > 0 && h.t != null)
    .map(h => ({ ...h, ms: new Date(h.t).getTime() }))
    .filter(h => Number.isFinite(h.ms))
    .sort((a, b) => a.ms - b.ms);

  // Per-ingredient trend series
  const byId = new Map();
  hist.forEach(h => {
    if (!byId.has(h.id)) byId.set(h.id, []);
    byId.get(h.id).push({ t: h.t, cost: h.cost });
  });
  const ingredientTrends = [];
  for (const [id, series] of byId) {
    const ing = ING_BY_ID.get(id);
    const baseline = baseCostMap[id] ?? (ing ? ing.baseline : null);
    const latest = series[series.length - 1].cost;
    ingredientTrends.push({
      id,
      name: ing ? ing.name : id,
      unit: ing ? ing.unit : '',
      baseline,
      latest,
      points: series,
      pctFromBaseline: baseline > 0 ? Math.round(((latest - baseline) / baseline) * 1000) / 10 : null,
    });
  }
  ingredientTrends.sort((a, b) => Math.abs(b.pctFromBaseline ?? 0) - Math.abs(a.pctFromBaseline ?? 0));

  // Dish-level replay
  const costMap = { ...baseCostMap };
  const qtyById = new Map(resolved.map(l => [l.id, l.qty]));
  const dishRawAt = () => {
    let s = 0;
    for (const [id, qty] of qtyById) s += qty * (costMap[id] ?? 0);
    return Math.round(s * 100) / 100;
  };
  const dishSeries = [{ t: null, rawCost: dishRawAt(), label: 'baseline' }];
  for (const h of hist) {
    costMap[h.id] = h.cost;
    dishSeries.push({ t: h.t, rawCost: dishRawAt() });
  }
  // Collapse same-timestamp runs (a receipt commit writes many points at one t)
  const collapsed = [];
  for (const p of dishSeries) {
    const prev = collapsed[collapsed.length - 1];
    if (prev && prev.t === p.t) prev.rawCost = p.rawCost;
    else collapsed.push(p);
  }
  return { ingredientTrends, dishSeries: collapsed, historyPoints: hist.length };
}

// ── Equipment summary ────────────────────────────────────────────────────────
const EQUIP_LABELS = {
  wok: 'wok', dutch: 'dutch oven', largePot: 'large pot', backBurner: 'back burner',
};
export function equipmentSummary(dish) {
  const e = dish.equipment || {};
  const bits = [];
  (e.fixed || []).forEach(r => bits.push({ resource: r, label: EQUIP_LABELS[r] || r, kind: 'hard' }));
  (e.flexible || []).forEach(r => bits.push({ resource: r, label: EQUIP_LABELS[r] || r, kind: 'flexible' }));
  if (e.polenta) bits.push({ resource: 'backBurner', label: 'back burner', kind: 'hard (polenta variant)' });
  if (e.tofu) bits.push({ resource: 'backBurner', label: 'back burner', kind: 'conditional (tofu variant)' });
  if (e.backBurner) bits.push({ resource: 'backBurner', label: 'back burner', kind: 'soft (quick, be mindful)' });
  return bits;
}

// ── The report ───────────────────────────────────────────────────────────────
// ctx: { liveCostMap, baseCostMap, costHistory, floorPct } — all optional;
// missing maps default to baselines so the report ALWAYS builds.
export function buildDishReport(dishName, ctx = {}) {
  const dish = DISHES.find(d => d.name === dishName);
  if (!dish) return null;
  const baseCostMap = ctx.baseCostMap || baselineCostMap();
  const liveCostMap = ctx.liveCostMap || baseCostMap;
  const floorPct = ctx.floorPct ?? 45;

  const decomposition = decomposeVariants(dish.variants);
  const variants = dish.variants.map(v => variantEconomics(dishName, v, liveCostMap, baseCostMap, floorPct));
  const variantByLabel = new Map(variants.map(v => [v.label, v]));

  return {
    name: dish.name,
    cuisine: dish.cuisine,
    reheatBucket: DINNER_REHEAT_BUCKET[dish.name] || null,
    flags: { pasta: !!dish.pasta, rice: !!dish.rice, noodle: !!dish.noodle },
    options: dish.options || null,
    equipment: equipmentSummary(dish),
    decomposition,
    variants,
    variantByLabel,
    scaling: scalingCheck(dishName, decomposition.groups),
    floorPct,
    // Per-variant lazy pieces — the UI calls these with the selected variant.
    recipeFor: (variantLabel) => recipeForVariant(dishName, variantLabel, liveCostMap),
    costOverTimeFor: (variantLabel) => costOverTime(dishName, variantLabel, ctx.costHistory || [], baseCostMap),
    // The ACTUAL order reheat card(s) for this variant — same engine the
    // customer's order uses (buildReheatBlocks on a synthetic one-item order),
    // so this tab never drifts from what customers are told.
    reheatFor: (variantLabel) => buildReheatBlocks({ items: [{ name: dishName, variant: variantLabel }] })
      .filter(b => b.dishes && b.dishes.includes(dishName)),
  };
}

// ── Portfolio summary — the whole menu at a glance ───────────────────────────
// One row per dish: worst-margin variant (suite basis), biggest anchor gap,
// biggest live drift. This is the re-anchor radar: sort by |anchorGap| and
// the standing "re-price the 8 newer dishes" TODO becomes a visible list.
export function buildPortfolioSummary(ctx = {}) {
  const baseCostMap = ctx.baseCostMap || baselineCostMap();
  const liveCostMap = ctx.liveCostMap || baseCostMap;
  const floorPct = ctx.floorPct ?? 45;
  return DISHES.map(dish => {
    const econ = dish.variants.map(v => variantEconomics(dish.name, v, liveCostMap, baseCostMap, floorPct));
    const worst = econ.reduce((a, b) => (b.marginLivePct < a.marginLivePct ? b : a), econ[0]);
    const gappiest = econ.reduce((a, b) => (Math.abs(b.anchorGapPct ?? 0) > Math.abs(a.anchorGapPct ?? 0) ? b : a), econ[0]);
    const driftiest = econ.reduce((a, b) => (Math.abs(b.driftPct) > Math.abs(a.driftPct) ? b : a), econ[0]);
    return {
      name: dish.name,
      cuisine: dish.cuisine,
      variantCount: dish.variants.length,
      worstMarginPct: Math.round(worst.marginLivePct * 10) / 10,
      worstMarginVariant: worst.label,
      underFloor: econ.some(v => v.underFloor),
      maxAnchorGapPct: gappiest.anchorGapPct,
      maxDriftPct: Math.round(driftiest.driftPct * 10) / 10,
    };
  });
}

// All dinner names in registry (display) order — the tab's dropdown source.
export function reportableDishes() {
  return DISHES.map(d => d.name);
}

// ── Per-dish sales history ───────────────────────────────────────────────────
// Aggregates one dish's real sales from the order history over a rolling
// period. Mirrors MoneyTab's dish-economics math (revenue = item price +
// upcharges before order-level discounts/fees; cost prefers each item's frozen
// basis) so the two never disagree. `period` is 'week' | 'month' | 'year' |
// 'all'. costOf is injected (App passes utils.itemCost) to avoid a circular
// import between dishReport and utils.
const PERIOD_DAYS = { week: 7, month: 30, year: 365 };
export function dishSalesHistory(dishName, orders, costOf, period = 'all') {
  const days = PERIOD_DAYS[period];
  const cutoff = days ? Date.now() - days * 86400000 : null;
  let units = 0, revenue = 0, cost = 0, orderCount = 0, unknown = false, est = false;
  for (const o of (orders || [])) {
    const t = new Date(o.createdAt || 0).getTime();
    if (cutoff && !(t >= cutoff)) continue;
    let touched = false;
    for (const it of (o.items || [])) {
      if (it.name !== dishName) continue;
      touched = true;
      const qty = Number(it.qty) || 1;
      const up = it.upcharge && typeof it.upcharge.amount === 'number' ? it.upcharge.amount : 0;
      // Weighed per-lb items already bake the full amount into price; qty is a
      // piece count that must not multiply. Match utils.itemUnitMultiplier by
      // checking for a real weight.
      const mult = (typeof it.weight === 'number' && it.weight > 0) ? 1 : qty;
      units += qty;
      revenue += (Number(it.price) || 0) * mult + up * qty;
      const c = costOf ? costOf(it) : null;
      if (c == null) unknown = true;
      else cost += c * mult;
      if (it.costSource === 'backfilled') est = true;
    }
    if (touched) orderCount += 1;
  }
  revenue = Math.round(revenue * 100) / 100;
  cost = Math.round(cost * 100) / 100;
  const profit = Math.round((revenue - cost) * 100) / 100;
  return {
    period,
    units,
    orderCount,
    revenue,
    cost,
    profit,
    marginPct: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 100) : 0,
    unknown,   // some items had no cost basis
    est,       // some costs are backfilled estimates
    hasData: units > 0,
  };
}
