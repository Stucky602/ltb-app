// containers.js — M1 (container inventory) + M2 (packaging cost), pure.
//
// THE PROBLEM M1 SOLVES: the jar ledger knows who HOLDS what; nothing knows
// how many containers Kevin OWNS. "Cannot pack next week" should surface on
// Sunday when orders close, not Wednesday morning with food ready and
// nothing to put it in.
//
// THE FLEET (Kevin, Jul 24 2026 — costs are per unit):
//   rect38  38 oz rectangle   $0.52   the dinner container
//   round8   8 oz round       $0.29
//   round16 16 oz round       $0.35
//   round32 32 oz round       $0.58
//   jar     pint mason jar    $1.12   ADD-ONS ONLY (queso, chili oil…),
//                                     never dinners — Kevin's explicit rule,
//                                     and it matches the jar ledger's own
//                                     JAR_SHIPPING_NAMES definition exactly.
//
// CUSTODY MODEL, and why it is shaped this way:
//   - Jars: EXACT, per the existing ledger (jarsOutForRegular). Untouched.
//   - Meal containers (the four non-jar types): outbound is computable
//     per-type from order items; RETURNS are not typed — Kevin logs one
//     `containerReturns` number on the final invoice. The jar ledger
//     credits that number against jars first and FLOORS at zero, which
//     means any credit beyond the jars a regular actually held is silently
//     discarded by the jar math. That discarded overflow is precisely the
//     meal containers coming back on the same invoice. So the meal pool
//     consumes EXACTLY the spillover the jar ledger throws away: one
//     logged number feeds both ledgers with zero double-counting, and the
//     accounting identity (outbound = held + returned) survives.
//   - The meal pool is tracked as a POOL (all four types summed), not
//     per-type, because an untyped return cannot honestly be allocated to
//     a type. Per-type numbers exist where they are real: OWNED (config)
//     and DEMAND (next week's orders). Fake per-type custody would be
//     precision that lies.
//   - `manualAdjust` is Kevin's override (his explicit ask): containers
//     found in a cupboard, a customer who moved away with three of them —
//     positive means "more are actually out than the math says", negative
//     means fewer.
//
// Forward-only from MEAL_CONTAINER_EPOCH, same pattern as the jar ledger:
// pre-epoch orders never tracked returns, so counting their outbound would
// manufacture phantom custody.

import { itemHandling } from './recipes.js';
import { isPerLbItem } from './menu.js';
import { perLbBagCount, orderOutboundJars, jarsOutForRegular, JAR_LEDGER_EPOCH } from './utils.js';
import { ALWAYS_ITEMS, DISHES } from './dishes.js';

export const MEAL_CONTAINER_EPOCH = Date.parse('2026-07-24');

export const CONTAINER_TYPES = {
  rect38:  { label: '38 oz rectangle', cost: 0.52 },
  round8:  { label: '8 oz round',      cost: 0.29 },
  round16: { label: '16 oz round',     cost: 0.35 },
  round32: { label: '32 oz round',     cost: 0.58 },
  jar:     { label: 'Pint mason jar',  cost: 1.12 },
};
export const CONTAINER_TYPE_ORDER = ['rect38', 'round8', 'round16', 'round32', 'jar'];

// Kevin's counts as of Jul 24 — stated as placeholders ("for now assume"),
// so the app treats these as DEFAULTS for a fresh install and the real
// numbers live in localStorage, editable in the Money tab's packaging card.
export const DEFAULT_OWNED = { rect38: 5, round8: 5, round16: 5, round32: 5, jar: 12 };

export function normalizeContainerConfig(raw) {
  const owned = {};
  for (const t of CONTAINER_TYPE_ORDER) {
    const v = raw && raw.owned && Number(raw.owned[t]);
    owned[t] = Number.isFinite(v) && v >= 0 ? Math.floor(v) : DEFAULT_OWNED[t];
  }
  const adj = raw && Number(raw.mealAdjust);
  return { owned, mealAdjust: Number.isFinite(adj) ? Math.floor(adj) : 0 };
}

// ── Container type per physical package ────────────────────────────────────
// CORRECTED Jul 24 from Kevin's actual practice. The first pass assumed
// "dinners → 38 oz rectangle", which was wrong in an instructive way:
//
//   - 32 oz round is the DINNER workhorse. A small (~4 servings) of anything
//     saucy — pasta sauce, stew, curry — fits it almost perfectly.
//   - 8 oz round is for condiment-scale sauces (Alabama white sauce and the
//     sauces category: chimichurri, romesco, chermoula, and the butters).
//   - 16 oz round is the middle ground: desserts, fruit, breakfast, purées.
//   - 38 oz rectangle is NOT the default dinner box. It is for odd,
//     awkward components that fit nothing else — charred broccolini that
//     isn't bagged, the chicken portion of the tea-smoked chicken.
//   - Pint mason jar is add-ons only (queso, chili oil, syrups), never a
//     dinner. Enforced by the canonical jar rule, not by this table.
//
// THE REAL SHAPE, and the honest limit of this model: a plated dinner ships
// as SEVERAL containers of DIFFERENT types — the tea-smoked chicken is a
// rectangle for the chicken, a round for the polenta, an 8 oz for the sauce.
// DISH_CONTAINERS below expresses that. It is seeded only with the two
// dishes Kevin described; every other multi-component dinner currently
// resolves to a single default container and is therefore UNDERCOUNTED.
// Filling this map in dish by dish is a 20-minute pass with Kevin and the
// single highest-value correction left in the container model.
export const DISH_CONTAINERS = {
  // Kevin, verbatim: the rectangles are for "the charred broccolini that is
  // not in a bag, or the chicken component of the tea smoked chicken."
  'Tea-Smoked Chicken with Dashi Polenta and Alabama White Sauce': ['rect38', 'round16', 'round8'],
  'Pork Chop with Kabocha Purée and Charred Broccolini': ['rect38', 'round16'],
};

// Category defaults for everything without an explicit composition above.
export const CATEGORY_TYPE_DEFAULTS = {
  sauces: 'round8',      // condiment scale, per the Alabama white sauce rule
  desserts: 'round16',
  fruit: 'round16',
  breakfast: 'round16',
};
// Per-dish single-type overrides, for dishes that need a non-default box but
// are not multi-container. Cheaper to edit than DISH_CONTAINERS.
export const CATEGORY_TYPE_OVERRIDES = {
  // 'Some Dessert': 'round8',
};
export const DEFAULT_DINNER_TYPE = 'round32'; // the workhorse

// name → category, same derivation labels.js uses.
const CATEGORY_OF = {};
for (const [cat, items] of Object.entries(ALWAYS_ITEMS)) {
  for (const it of items) CATEGORY_OF[it.name] = cat;
}
const DINNER_NAMES = new Set(DISHES.map(d => d.name));

// The jar rule, restated from utils.js: an item is a jar item iff it
// contributes to orderOutboundJars. Checked per-item by probing a one-item
// order through the CANONICAL function rather than copying its name set —
// if the jar rule ever changes in utils.js, this follows automatically.
function isJarItem(it) {
  return orderOutboundJars({ items: [{ ...it, qty: 1 }] }) > 0;
}

// The container types ONE unit of this item occupies. Always an array:
// a multi-component dinner genuinely occupies several.
export function containerTypesFor(it) {
  if (!it || !it.name) return [];
  if (isJarItem(it)) return ['jar'];
  if (it.perLb || isPerLbItem(it.name)) return ['bag'];
  if (DISH_CONTAINERS[it.name]) return DISH_CONTAINERS[it.name].slice();
  if (CATEGORY_TYPE_OVERRIDES[it.name]) return [CATEGORY_TYPE_OVERRIDES[it.name]];
  const cat = CATEGORY_OF[it.name] || null;
  if (cat && CATEGORY_TYPE_OVERRIDES[cat]) return [CATEGORY_TYPE_OVERRIDES[cat]];
  if (cat && CATEGORY_TYPE_DEFAULTS[cat]) return [CATEGORY_TYPE_DEFAULTS[cat]];
  if (DINNER_NAMES.has(it.name) || !cat) return [DEFAULT_DINNER_TYPE];
  return ['round16'];
}

// Kept for callers that only want the primary box.
export function containerTypeFor(it) {
  const types = containerTypesFor(it);
  return types.length ? types[0] : null;
}

// ── Physical packages per order, by type ───────────────────────────────────
// The UNITS math must agree with labels.js (the canon for "how many physical
// packages does this line produce" — the cantaloupe and cookies bugs live
// there). tests/containers.mjs cross-checks this against buildLabelSheet on
// the same order, so the two implementations cannot drift apart silently.
export function orderContainerBreakdown(order) {
  const out = { rect38: 0, round8: 0, round16: 0, round32: 0, jar: 0, bag: 0 };
  for (const it of ((order && order.items) || [])) {
    if (!it || !it.name || it.omakase) continue; // omakase items are priced, not packed, until they become real lines
    const qty = Number(it.qty) || 1;
    const perLb = !!it.perLb || isPerLbItem(it.name);
    const h = itemHandling(it.name, { category: CATEGORY_OF[it.name] || null, isPerLb: perLb });
    const weighed = perLb && typeof it.weight === 'number' && it.weight > 0;
    const units =
      h.packaging === 'per-bag' ? (weighed ? perLbBagCount(qty) : 1)
      : h.packaging === 'per-qty' ? qty
      : 1; // 'single'
    // A multi-component dinner occupies several containers PER unit, so the
    // composition is expanded and each type counted separately.
    for (const type of containerTypesFor(it)) {
      if (type in out) out[type] += units;
    }
  }
  return out;
}

export function sumBreakdowns(orders) {
  const total = { rect38: 0, round8: 0, round16: 0, round32: 0, jar: 0, bag: 0 };
  for (const o of orders || []) {
    const b = orderContainerBreakdown(o);
    for (const k of Object.keys(total)) total[k] += b[k];
  }
  return total;
}

// ── Custody: the meal pool ─────────────────────────────────────────────────
// Outbound = meal-container units on DELIVERED orders since the epoch
// (status Delivered, archived included — archiving is bookkeeping, the
// containers still left the kitchen).
// Credits = the spillover the jar ledger's floor discards, grouped the same
// way the jar ledger groups (per regular; orders with no regular stand
// alone), so a return logged on a LATER invoice than the outbound still
// nets out within the same customer.
export function mealContainersOut(orders, config) {
  const cfg = normalizeContainerConfig(config);
  const since = (orders || []).filter(o =>
    o && new Date(o.createdAt || 0).getTime() >= MEAL_CONTAINER_EPOCH);

  const delivered = since.filter(o => o.status === 'Delivered' || o.archived);
  let outbound = 0;
  for (const o of delivered) {
    const b = orderContainerBreakdown(o);
    outbound += b.rect38 + b.round8 + b.round16 + b.round32; // pool: non-jar, non-bag
  }

  // Spillover: per customer group, credits beyond what the jar math could
  // absorb. Uses the SAME epoch as this pool for the group's jar side, so
  // both sides of the subtraction see the same orders.
  const groups = new Map();
  for (const o of since) {
    const key = o.regularId || ('order:' + (o.id || Math.random()));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  }
  let spillover = 0;
  for (const list of groups.values()) {
    let jarsOut = 0, credits = 0;
    for (const o of list) {
      jarsOut += orderOutboundJars(o);
      credits += (o.jarSwaps || 0) + (o.containerReturns || 0);
    }
    spillover += Math.max(0, credits - jarsOut);
  }

  return Math.max(0, outbound - spillover + cfg.mealAdjust);
}

// ── The Sunday report ──────────────────────────────────────────────────────
// Demand = next week's pack: every non-archived, non-delivered order
// (house included — her food goes in real containers, same rule as the jar
// ledger). Availability:
//   jars: owned − exactly held (ledger)
//   meal types: owned per type. The pool's outstanding count is shown as
//   ADVISORY context, not subtracted per-type — an untyped debt cannot
//   honestly be charged to a specific type, and Kevin's containers cycle
//   back weekly, so owned-vs-demand is the real Sunday question.
export function containerReport(orders, regulars, config) {
  const cfg = normalizeContainerConfig(config);
  const active = (orders || []).filter(o => o && !o.archived && o.status !== 'Delivered');
  const demand = sumBreakdowns(active);

  const jarsHeld = (regulars || []).reduce((s, r) => s + jarsOutForRegular(r.id, orders || []), 0);
  const jarsAvailable = Math.max(0, cfg.owned.jar - jarsHeld);

  const rows = CONTAINER_TYPE_ORDER.map(t => {
    const need = demand[t] || 0;
    const have = t === 'jar' ? jarsAvailable : cfg.owned[t];
    return { type: t, label: CONTAINER_TYPES[t].label, need, have, short: Math.max(0, need - have) };
  });

  return {
    rows,
    shortages: rows.filter(r => r.short > 0),
    bags: demand.bag || 0,
    jarsHeld,
    mealOut: mealContainersOut(orders, cfg),
    owned: cfg.owned,
    mealAdjust: cfg.mealAdjust,
  };
}

// ── M2: packaging cost, display-only (Kevin's decision 3a) ─────────────────
// Cost of what physically went out in a set of orders, at per-unit prices.
// DISPLAY ONLY — this never enters the dish margin engine. Containers are
// reusable and returns offset over time; folding a reusable's price into a
// dish margin would misstate both. Bags are consumable but unpriced here
// (not one of the five types Kevin costed); they are COUNTED so the number
// exists the day he wants to cost them.
export function packagingCost(orders) {
  const b = sumBreakdowns(orders);
  let cost = 0;
  const perType = {};
  for (const t of CONTAINER_TYPE_ORDER) {
    perType[t] = { units: b[t], cost: Math.round(b[t] * CONTAINER_TYPES[t].cost * 100) / 100 };
    cost += perType[t].cost;
  }
  return { total: Math.round(cost * 100) / 100, perType, bags: b.bag };
}
