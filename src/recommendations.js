// recommendations.js — "recommended for you", and WHY.
//
// ═══════════════════════════════════════════════════════════════════════════
// EVERY RECOMMENDATION CARRIES A REASON THAT IS A CHECKABLE FACT
//
// Kevin's constraint, and the whole design: "only based on actual reasoning
// though (like the having had every other similar dish) so it always has a
// grounded reasoning why."
//
// So a rule may only fire on something countable in the household's own
// records: how many of a cuisine they have ordered, how many times they ordered
// this dish, how long since the last one. The reason shown to the customer is
// that same fact in words, and the evidence that produced it travels with the
// recommendation so anyone can check it.
//
// NO TASTE MODELLING. Nothing here decides they would "probably like" anything.
// That is inferred preference, which is what Passport Story Doors was rejected
// for, and it is unfalsifiable in a way a count is not. "You have had every
// other Thai dish" is either true or it is not.
//
// IF NO RULE FIRES, THERE IS NO RECOMMENDATION. An empty list is the correct
// output for a new household, and padding it with something weakly justified is
// exactly how a feature like this stops being trusted.
//
// ═══════════════════════════════════════════════════════════════════════════
// FOUR THINGS IT WILL NOT DO, REGARDLESS OF EVIDENCE
//
//   1. Recommend a dish that is not on the published menu this week. A perfect
//      recommendation for something unavailable is an annoyance.
//   2. Recommend a dish already in the order being built, or ordered this week.
//   3. Recommend a dish that fails the household's restrictions. The caller
//      passes the filter; if it is absent, NOTHING is recommended rather than
//      everything — see `eligible` below.
//   4. Recommend a dish Kevin has not published a reheat record for. Anything
//      that reaches a customer has to be a dish the app can actually support.

import { DISHES } from './dishes.js';
import { dishIdFor } from './dishIdentity.js';
import { REHEAT_DATA } from './reheatData.js';

const DAY = 24 * 60 * 60 * 1000;

// Thresholds are deliberately high. A rule that fires on two orders is noise
// dressed as insight, and the cost of a weak recommendation is that the strong
// ones stop being read.
export const RULES = {
  // "You have had every other Thai dish."
  cuisineNearlyComplete: { minTried: 3, maxRemaining: 2 },
  // "You have ordered this four times."
  repeatFavourite: { minOrders: 3 },
  // "It has been a while."
  lapsed: { minOrders: 2, minDays: 90 },
};

function dishByName(name) {
  const key = String(name || '').trim().toLowerCase();
  return DISHES.find(d => d.name.trim().toLowerCase() === key) || null;
}

// A household's own history, counted. Nothing here is weighted, scored, or
// decayed — those are modelling choices that would make the evidence harder to
// state than the recommendation itself.
export function historyFor(orders, householdId, now = Date.now()) {
  const counts = new Map();
  const lastAt = new Map();
  const byCuisine = new Map();
  for (const o of orders || []) {
    if (householdId && o.regularId !== householdId) continue;
    const at = new Date(o.deliveredAt || o.createdAt || 0).getTime();
    for (const it of o.items || []) {
      const name = (it && it.name) || '';
      if (!name || it.omakase) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
      if (at && at > (lastAt.get(name) || 0)) lastAt.set(name, at);
      const d = dishByName(name);
      if (d && d.cuisine) {
        if (!byCuisine.has(d.cuisine)) byCuisine.set(d.cuisine, new Set());
        byCuisine.get(d.cuisine).add(d.name);
      }
    }
  }
  return { counts, lastAt, byCuisine, now };
}

// ── The rules ───────────────────────────────────────────────────────────────
//
// Each returns null or { ruleId, why, evidence }. `why` is the sentence the
// customer reads; `evidence` is the numbers it came from.

function ruleCuisineNearlyComplete(dish, h) {
  if (!dish.cuisine) return null;
  const all = DISHES.filter(d => d.cuisine === dish.cuisine).map(d => d.name);
  if (all.length < RULES.cuisineNearlyComplete.minTried + 1) return null;
  const tried = h.byCuisine.get(dish.cuisine) || new Set();
  if (tried.has(dish.name)) return null;
  const remaining = all.filter(n => !tried.has(n));
  if (tried.size < RULES.cuisineNearlyComplete.minTried) return null;
  if (remaining.length > RULES.cuisineNearlyComplete.maxRemaining) return null;
  const why = remaining.length === 1
    ? `You have had every other ${dish.cuisine} dish on the menu.`
    : `You have had ${tried.size} of the ${all.length} ${dish.cuisine} dishes.`;
  return {
    ruleId: 'cuisineNearlyComplete',
    why,
    evidence: { cuisine: dish.cuisine, tried: tried.size, total: all.length, remaining: remaining.length },
  };
}

function ruleRepeatFavourite(dish, h) {
  const n = h.counts.get(dish.name) || 0;
  if (n < RULES.repeatFavourite.minOrders) return null;
  return {
    ruleId: 'repeatFavourite',
    why: `You have ordered this ${n} times.`,
    evidence: { orders: n },
  };
}

function ruleLapsed(dish, h) {
  const n = h.counts.get(dish.name) || 0;
  if (n < RULES.lapsed.minOrders) return null;
  const last = h.lastAt.get(dish.name) || 0;
  if (!last) return null;
  const days = Math.floor((h.now - last) / DAY);
  if (days < RULES.lapsed.minDays) return null;
  return {
    ruleId: 'lapsed',
    why: `You ordered this ${n} times, but not in about ${Math.round(days / 30)} months.`,
    evidence: { orders: n, daysSince: days },
  };
}

const ALL_RULES = [ruleCuisineNearlyComplete, ruleRepeatFavourite, ruleLapsed];

// ── The entry point ─────────────────────────────────────────────────────────
//
// `eligible` is the household's restriction filter. It is REQUIRED: without it
// nothing is recommended, because recommending food to somebody whose
// restrictions are unknown is the one failure here that could actually hurt.
export function recommendationsFor({
  orders, householdId, weekDishNames, eligible, alreadyOrdered = [], now = Date.now(),
} = {}) {
  if (typeof eligible !== 'function') return [];
  const week = (weekDishNames || []).filter(n => typeof n === 'string' && n.trim());
  if (!week.length) return [];

  const skip = new Set((alreadyOrdered || []).map(n => String(n).trim().toLowerCase()));
  const h = historyFor(orders, householdId, now);
  const out = [];

  for (const name of week) {
    if (skip.has(name.trim().toLowerCase())) continue;
    const dish = dishByName(name);
    if (!dish) continue;
    // Rule 4: the app has to be able to support it once it arrives.
    if (!REHEAT_DATA[dishIdFor(dish.name)]) continue;
    if (!eligible(dish)) continue;

    for (const rule of ALL_RULES) {
      const r = rule(dish, h);
      if (!r) continue;
      // ONE REASON PER DISH. Stacking them reads as a sales pitch, and the
      // first rule that fires is the strongest by the order they are listed in.
      out.push({ dishName: dish.name, ...r });
      break;
    }
  }
  return out;
}

// A household with nothing recorded gets nothing, and that is correct rather
// than a gap to fill. Exposed so a caller can say so plainly instead of
// rendering an empty panel.
export function hasEnoughHistory(orders, householdId) {
  const h = historyFor(orders, householdId);
  return h.counts.size >= RULES.cuisineNearlyComplete.minTried;
}
