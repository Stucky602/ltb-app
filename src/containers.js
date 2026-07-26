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
  // Added Jul 26. SOME braises need more volume than the 32 holds. Which ones
  // is not knowable from the data — it is a per-dish fact Kevin holds, so it
  // lands in DISH_CONTAINERS below rather than being inferred from a category.
  round48: { label: '48 oz round',     cost: 1.38 },
  // Cookies only, and that exclusivity is the point: it is not a general large
  // rectangle and must not be reached for as one, or the packaging spend for a
  // cookie order quietly lands on dinners.
  rectXL:  { label: 'XL rectangle with lid (cookies)', cost: 1.49 },
  jar:     { label: 'Pint mason jar',  cost: 1.12 },
};
export const CONTAINER_TYPE_ORDER = ['rect38', 'round8', 'round16', 'round32', 'round48', 'rectXL', 'jar'];

// Every zeroed tally in this file is built from the registry, never written out
// by hand. Two hand-written literals used to seed the breakdown, so adding a
// container type on Jul 26 produced `undefined` units for it, and
// `undefined * cost` is NaN — which then propagated into the packaging total
// without anything throwing. A tally that cannot go stale is worth the helper.
export const emptyBreakdown = () => {
  const out = {};
  for (const t of CONTAINER_TYPE_ORDER) out[t] = 0;
  out.bag = 0;
  return out;
};

// Kevin's counts as of Jul 24 — stated as placeholders ("for now assume"),
// so the app treats these as DEFAULTS for a fresh install and the real
// numbers live in localStorage, editable in the Money tab's packaging card.
// The two Jul 26 additions default to 0 OWNED rather than to the 5 the others
// carry. Kevin stated 5-of-each as a placeholder for the original four; he has
// not said how many 48s or cookie rectangles he has. Defaulting them to 5 would
// invent stock and could report "you have enough" when he has none, which is
// the exact failure the shortage check exists to prevent. Zero is the honest
// unknown, and it announces itself the first time either is needed.
export const DEFAULT_OWNED = { rect38: 5, round8: 5, round16: 5, round32: 5, round48: 0, rectXL: 0, jar: 12 };

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
// ── AUDIT STATUS ───────────────────────────────────────────────────────────
// Only the dishes listed in DISH_CONTAINERS have a CONFIRMED composition. Every
// other multi-component dinner resolves to a single container and is therefore
// UNDERCOUNTED, which means the Sunday shortage check can tell Kevin he is fine
// when he is not.
//
// Deliberately NOT auto-populated with inferred mappings. Kevin's naming
// conventions (docs/NAMING.md) make it easy to guess which dinners have several
// components, but "Orecchiette with Bitter Greens and Anchovies" is one bowl
// while "Pork Chop with Kabocha Purée and Charred Broccolini" is three
// containers, and nothing in the data distinguishes them. A guessed mapping
// that LOOKS authoritative is worse than an obvious undercount, because the
// undercount at least announces itself.
//
// So the honest move is to make the gap VISIBLE and let the check say what it
// does not know. containerAuditStatus() below is what the Record tab and the
// Sunday warning read.
// ── THE MAPPING ─────────────────────────────────────────────────────────────
// All 27 dinners, audited with Kevin dish by dish on Jul 26 2026. Nothing here
// is inferred. This replaces the two-dish seed and the category guessing that
// stood in for it, and it corrects the model's founding assumption: round32 was
// treated as the dinner workhorse and it is not. round48 is the braise
// workhorse, and round16 is the single most-used container on the menu because
// it is the rice container.
//
// VALUES ARE COUNTS, not a list of type names. The array form could not express
// 3 bags for Steak au Poivre or 2 for the Bourguignon, which is why it changed.
//
// EVERY MAPPING IS FOR A SMALL PORTION. Scaling lives in containersForItem():
// Large is 2x, and on a dish with three sizes Medium is 2x and Large is 3x.
//
// `bag` IS PRESENT BUT NOT TRACKED. Sous vide bags are covered by the existing
// $2 bag charge, are not reusable, and there is nothing to keep count of. They
// stay in the mapping because they describe the dish honestly; they are
// excluded from owned counts, the Sunday shortage check, and the custody pool.
//
// Ambiguities are FLAGGED, not resolved — see CONTAINER_AMBIGUITIES below.
export const DISH_CONTAINERS = {
  // Braises and stews: round48 is the container this menu actually runs on.
  'Boeuf Bourguignon (Beef Stew)':                       { round48: 1, bag: 2 },
  'Chili':                                               { round48: 1 },
  'Brunswick Stew':                                      { round48: 1 },

  // Rice dishes. The round16 here is TWO CUPS OF RICE, and that is a container
  // holding an ingredient, not an ingredient itself — the rice belongs in the
  // recipe, the round16 belongs here. Do not promote "2 cups rice" into a
  // packaging line; that conflates two different objects that happen to get
  // described in the same sentence.
  'Leblanc Inspired Japanese Curry':                     { round16: 1, round48: 1 },
  'Gumbo':                                               { round16: 1, round48: 1 },
  'Indian Style Curry':                                  { round16: 1, round48: 1 },
  'Mapo Eggplant':                                       { round16: 1, round48: 1 },
  'Thai Basil Chicken (Pad Krapow Gai)':                 { round16: 1, bag: 1 },
  'Texas Gulf Shrimp or Tofu and Chinese Broccoli':      { round16: 1, bag: 1 },
  'Shrimp or Tofu with Asparagus in Black Bean Sauce':   { round16: 1, bag: 1 },
  'Stir Fried Long Beans with Ground Pork or Tofu':      { round16: 1, bag: 1 },
  'Pecan Mole-Fesenjan, Beef and Kabocha':               { round16: 1, round48: 1, bag: 1 },
  // AMBIGUITY 6a: the round16 applies ONLY to the rice variants. The noodle
  // variant is bag-only. Recorded as the rice build because that is the one
  // that consumes a tracked container; see CONTAINER_AMBIGUITIES.
  'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice': { round16: 1, bag: 1 },
  'Bo Ssam':                                             { round8: 1, round16: 1, bag: 1 },

  // Pasta sauces and lighter braises.
  'Bolognese':                                           { round32: 1 },
  'Mushroom Ragu':                                       { round32: 1 },
  'Pasta with Homegrown Tomato Sauce':                   { round32: 1 },
  'Saffron Pork Ragu':                                   { round32: 1 },
  'Orecchiette with Bitter Greens and Anchovies':        { round16: 1 },

  // Composed plates. The rectangles hold awkward solids that are not bagged,
  // and two of the three are charred broccolini.
  'Tea-Smoked Chicken with Dashi Polenta and Alabama White Sauce': { round8: 1, rect38: 1, bag: 1 },
  'Bone-In Pork Rib Chop with All the Fixings':          { round16: 1, rect38: 1, bag: 2 },
  // AMBIGUITY 6b: Kevin confirmed bag x1, but his own note says "chop and purée
  // in the bags", plural. Left at 1 pending his answer rather than rounded up.
  'Pork Chop with Kabocha Purée and Charred Broccolini': { rect38: 1, bag: 1 },
  'Steak au Poivre':                                     { round16: 1, bag: 3 },
  'Pork with Mustard Tarragon Cream Sauce':              { round16: 1, bag: 1 },

  // Zero tracked containers. Worth stating explicitly, because an empty mapping
  // and a missing mapping used to look identical and the second one silently
  // fell through to a default.
  'Pappardelle with Vegetables and Mint':                { bag: 1 },
  'Coriander Lamb Steak over Gigantes Beans':            { bag: 2 },

  'Tex-Mex Kit':                                         { round16: 1, round32: 1, round48: 1 },

  // Always-items, settled separately by Kevin.
  'Chocolate Chip Cookies':                              { rectXL: 1 },
  'Brownies':                                            { round48: 1 },
  'Peanut Butter Fudge':                                 { rect38: 1 },
};

// Recorded so they are not rediscovered as new findings later. Each is a real
// open question, and each is deliberately UNRESOLVED in the mapping above.
export const CONTAINER_AMBIGUITIES = [
  { id: '6a', dish: 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice',
    note: 'The round16 is the rice container and applies ONLY to the rice variants. The noodle variant should be bag-only. Branch on the variant if it is knowable at breakdown time.' },
  { id: '6b', dish: 'Pork Chop with Kabocha Purée and Charred Broccolini',
    note: 'Kevin confirmed one bag, but his note says "chop and purée in the bags", plural. Probably 2. Ask before changing.' },
  { id: '6c', dish: 'Bo Ssam',
    note: 'The ssam sauce would likely need its own round8, but that component does not exist in the app yet. Do NOT add it.' },
  { id: '6d', dish: 'Chili',
    note: 'Rice with chili is not part of the standard build. Kevin would give 2 cups in a round16 and "likely do it for free". Not modelled on purpose.' },
  { id: '6e', dish: 'Mapo Eggplant',
    note: 'A round32 could substitute for the round16 if needed. That is flexibility, not a second mapping. round16 stays canonical.' },
];

// The one type that never counts against the fleet. Kept separate from
// CONTAINER_TYPES so every consumer asks the same question the same way.
export const UNTRACKED_TYPES = new Set(['bag']);
export const isTrackedType = (t) => !UNTRACKED_TYPES.has(t);


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

// Dinners whose name suggests several components, per Kevin's own conventions:
// `with` attaches accompaniments, `and` joins co-equal parts, `over` a base.
// These are CANDIDATES for the audit, not conclusions — some are one bowl.
const COMPONENT_SPLIT = / with | and | over | in (?!a )/i;

function nameComponents(dishName) {
  return String(dishName || '').split(COMPONENT_SPLIT).map(s => s.trim()).filter(Boolean);
}

// What the container model actually knows, and what it does not. The Sunday
// check reads this so it can state its own confidence instead of implying
// precision it has not earned.
export function containerAuditStatus(dishList) {
  const dishes = dishList || DISHES.map(d => d.name);
  const confirmed = [];
  const unconfirmed = [];
  for (const name of dishes) {
    const parts = nameComponents(name);
    // Counts the TRACKED units, not the number of distinct types, and not the
    // bags. `.length` used to work because the mapping was an array; it is now
    // an object of counts, and a stale `.length` here returns undefined and
    // poisons every sum downstream with NaN.
    if (DISH_CONTAINERS[name]) {
      const mix = DISH_CONTAINERS[name];
      const units = Object.entries(mix)
        .filter(([t]) => isTrackedType(t))
        .reduce((n, [, q]) => n + (Number(q) || 0), 0);
      confirmed.push({ dish: name, containers: units });
      continue;
    }
    if (parts.length > 1) unconfirmed.push({ dish: name, components: parts, assumed: 1 });
  }
  return {
    confirmed,
    unconfirmed,
    // The most the Sunday check could be undercounting by, if every
    // unconfirmed candidate turned out to be one container per component.
    maxUndercount: unconfirmed.reduce((s, u) => s + (u.components.length - 1), 0),
    complete: unconfirmed.length === 0,
  };
}

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
// Small is the authored baseline. A three-size dish reads Medium as 2x and
// Large as 3x; a two-size dish reads Large as 2x. Anything unrecognised stays
// at 1, because inventing a multiplier is how a shortage check starts lying.
export function portionMultiplier(it) {
  const v = String((it && it.variant) || '').toLowerCase();
  if (!v) return 1;
  if (/\bmedium\b|\bmed\b|\(~6\)/.test(v)) return 2;
  if (/\blarge\b|\bl\b|\(~8\)|\(~12\)/.test(v)) {
    // On a dish that offers Medium, Large is the third step and triples.
    return /\(~12\)/.test(v) ? 3 : 2;
  }
  return 1;
}

export function containerTypesFor(it) {
  if (!it || !it.name) return [];
  if (isJarItem(it)) return ['jar'];
  if (it.perLb || isPerLbItem(it.name)) return ['bag'];
  // The mapping now carries COUNTS. Expanded into a repeated array here so
  // every existing caller keeps its contract (they count occurrences), while
  // the source of truth gains the quantities the array form could never hold.
  //
  // SCALING. Every mapping is authored for a SMALL portion. Large doubles it,
  // and on a three-size dish Medium doubles and Large triples. Applied here
  // rather than in the mapping so the table stays readable and there is exactly
  // one place the rule lives.
  if (DISH_CONTAINERS[it.name]) {
    const mult = portionMultiplier(it);
    const out = [];
    for (const [type, n] of Object.entries(DISH_CONTAINERS[it.name])) {
      for (let k = 0; k < (Number(n) || 0) * mult; k++) out.push(type);
    }
    return out;
  }
  if (CATEGORY_TYPE_OVERRIDES[it.name]) return [CATEGORY_TYPE_OVERRIDES[it.name]];
  const cat = CATEGORY_OF[it.name] || null;
  if (cat && CATEGORY_TYPE_OVERRIDES[cat]) return [CATEGORY_TYPE_OVERRIDES[cat]];
  if (cat && CATEGORY_TYPE_DEFAULTS[cat]) return [CATEGORY_TYPE_DEFAULTS[cat]];
  if (DINNER_NAMES.has(it.name) || !cat) return [DEFAULT_DINNER_TYPE];
  return ['round16'];
}


// ── Physical packages per order, by type ───────────────────────────────────
// The UNITS math must agree with labels.js (the canon for "how many physical
// packages does this line produce" — the cantaloupe and cookies bugs live
// there). tests/containers.mjs cross-checks this against buildLabelSheet on
// the same order, so the two implementations cannot drift apart silently.
export function orderContainerBreakdown(order) {
  const out = emptyBreakdown();
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
  const total = emptyBreakdown();
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
    // Summed from the REGISTRY, minus jars (their own ledger) and bags
    // (untracked, not reusable, covered by the $2 charge). This was a
    // hand-written list of four types, so the moment round48 was registered
    // every braise container out in the field became INVISIBLE to the custody
    // pool — and a braise is the most common thing on this menu. Nothing threw;
    // the number was just quietly low.
    outbound += CONTAINER_TYPE_ORDER
      .filter(t => t !== 'jar' && isTrackedType(t))
      .reduce((n, t) => n + (b[t] || 0), 0);
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

  const audit0 = containerAuditStatus();
  // The undercount is not spread evenly, and nothing here knows which type the
  // missing containers would be. So risk is assessed against the WHOLE possible
  // shortfall on every type: if the audit's worst case could push this type past
  // capacity, the check says so rather than staying silent.
  const rows = CONTAINER_TYPE_ORDER.map(t => {
    const need = demand[t] || 0;
    const have = t === 'jar' ? jarsAvailable : cfg.owned[t];
    const short = Math.max(0, need - have);
    // Jars are exact (the ledger tracks them), so they carry no audit risk.
    const riskCeiling = t === 'jar' ? need : need + audit0.maxUndercount;
    return {
      type: t, label: CONTAINER_TYPES[t].label, need, have, short,
      // TRUE when this type is fine on the numbers we have but could be short
      // once the unconfirmed dishes are counted properly. This is the case the
      // old check was silent about, which is the dangerous one: it told Kevin
      // he was fine when it did not actually know.
      atRisk: short === 0 && riskCeiling > have,
      riskCeiling,
    };
  });

  const audit = audit0;
  return {
    rows,
    atRisk: rows.filter(r => r.atRisk),
    // The check reports what it does not know rather than implying precision.
    // Until the audit is done, demand is a FLOOR, not a figure.
    audit,
    demandIsFloor: !audit.complete,
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
