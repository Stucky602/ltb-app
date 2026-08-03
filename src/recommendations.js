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
import { tagsFor, dishesWithTag, isBroadTag, isSingletonTag, copyFor } from './dishTags.js';

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
  // Same shape as the cuisine rule, but tags are what a customer actually
  // groups food by.
  tagNearlyComplete: { minTried: 3, maxRemaining: 2 },
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
    // AN OMAKASE COUNTS FOR THE DISHES IT WAS ACTUALLY MADE OF.
    //
    // The omakase line itself is skipped — it is not a dish and never will be.
    // But when Kevin builds a box out of menu items he records the link, and a
    // household that ate the Chili has eaten the Chili whether it arrived on
    // the menu or in a box. Ignoring that made omakase households invisible to
    // every tag and cuisine rule.
    //
    // Freehand components are NOT counted: they have no dish name to count as.
    const lines = [];
    for (const it of o.items || []) {
      if (it && it.omakase) {
        for (const c of (it.components || [])) if (c && c.dishName) lines.push({ name: c.dishName });
        continue;
      }
      lines.push(it);
    }
    for (const it of lines) {
      const name = (it && it.name) || '';
      if (!name) continue;
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

// THE RULE THE TAG WALK EXISTED FOR. Cuisine put the six stir-fries in two
// different buckets, so "you have had every other stir fry" could never fire.
//
// BROAD TAGS ARE DAMPENED RATHER THAN TRIMMED. Kevin was offered removing the
// comfort-food tag from some dishes and splitting it, and chose neither: "find
// a method when we actually do implementation to not have it fire as much or
// weigh it different or something." The tag is TRUE of all ten dishes, so it
// stays on all ten — but "you have had every other comfort food" across ten
// dishes says almost nothing, while the same sentence about six stir-fries is a
// real observation. A rule that cannot tell them apart fires hardest on the one
// that means least.
//
// So a broad tag needs the household to have tried MORE of it before it counts,
// and singleton tags (`kit`, `smoked`) never fire at all because they group
// nothing.
function ruleTagNearlyComplete(dish, h, variantLabel) {
  for (const tag of tagsFor(dish.name, variantLabel)) {
    if (isSingletonTag(tag)) continue;
    const all = dishesWithTag(tag);
    const tried = all.filter(n => h.counts.has(n));
    if (tried.includes(dish.name)) continue;
    const remaining = all.length - tried.length;
    const minTried = isBroadTag(tag)
      ? Math.max(RULES.tagNearlyComplete.minTried, all.length - 1)
      : RULES.tagNearlyComplete.minTried;
    if (tried.length < minTried) continue;
    if (remaining > RULES.tagNearlyComplete.maxRemaining) continue;

    const why = remaining === 1
      ? `You have had every other ${tag} on the menu.`
      : `You have had ${tried.length} of the ${all.length} ${tag} dishes.`;
    // A TAG CAN CARRY REQUIRED COPY, and it rides the recommendation rather
    // than the dish — a general blurb would say it to people who were never
    // told anything about that tag.
    const extra = copyFor(dish.name, tag);
    return {
      ruleId: 'tagNearlyComplete',
      why: extra ? `${why} ${extra}` : why,
      evidence: { tag, tried: tried.length, total: all.length, remaining, broad: isBroadTag(tag) },
    };
  }
  return null;
}

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

// TAGS FIRST. They are the grouping Kevin actually thinks in, and cuisine is
// the fallback for dishes he has not tagged.
const ALL_RULES = [ruleTagNearlyComplete, ruleCuisineNearlyComplete, ruleRepeatFavourite, ruleLapsed];

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
      const r = rule(dish, h, name);
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
