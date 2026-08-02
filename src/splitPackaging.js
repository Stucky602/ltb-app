// splitPackaging.js — Family Pack or Two-Night Pack, where the food allows it.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS IS
//
// The same purchased quantity, packed either as one shared container (Family)
// or divided into independently reheatable portions (Two-Night), so a household
// can heat half without opening, reheating, and rechilling the whole order. A
// Large Chili as one container or two. A Large Bo Ssam as two pork bags, two
// rice portions, and divided sauces.
//
// The customer chooses the SHAPE of the packaging. They never choose arbitrary
// component quantities — that would be a different order, not a different pack.
//
// ═══════════════════════════════════════════════════════════════════════════
// IT SHIPS WITH ZERO DISHES DECLARED, AND THAT IS THE DESIGN
//
// `SPLIT_PACKAGING` is empty below. Nothing offers the choice until Kevin
// declares a dish, and `isSplitEligible` returns false for everything by
// default. FAIL CLOSED: a dish that has not been thought about must never
// surface a packaging option, because the failure mode is a customer ordering a
// split that Kevin cannot actually pack on Tuesday.
//
// WHY IT CANNOT BE DERIVED. `reheatData.js` already knows the FOOD half — Walk
// 2 recorded per-component divide modes, and `splitCandidates()` below uses
// them to shortlist. But eligibility is food AND operations: whether the extra
// containers exist, whether packing two of something is worth the Tuesday
// minutes, whether the second portion survives the week as well as the first.
// Only Kevin knows the operational half, so the shortlist is a WORKLIST, not an
// answer. `walks.js` carries the worksheet that turns one into the other.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE CONFIG SHAPE
//
//   'dish-id': {
//     byVariant: [
//       { match: /large/i,
//         family:   { round48: 1 },          // containers for the shared pack
//         twoNight: { round32: 2 },          // containers for the divided pack
//         surchargeCents: 0,                 // 0 = absorbed, >0 = shown to the customer
//         recipeVersionIds: null,            // null = all versions; array = only these
//         note: 'why this split works',
//       },
//     ],
//   }
//
// Container maps are STATED, never inferred by doubling. The Tex-Mex rice rule
// already proved that scaling can change the container TYPE rather than the
// count, and a split is exactly the case where that happens most.

import { REHEAT_DATA } from './reheatData.js';
import { UNDIVIDABLE_MODES } from './canonRules.js';
import { DISHES } from './dishes.js';
import { dishIdFor } from './dishIdentity.js';
import { CONTAINER_TYPES, containersForDish } from './containers.js';

export const PACK_SHAPES = ['family', 'twoNight'];
export const PACK_LABELS = {
  family: 'Family pack',
  twoNight: 'Two-night pack',
};
export const PACK_BLURBS = {
  family: 'Everything together, the normal way.',
  twoNight: 'Split into two, so you can heat one half and leave the other sealed.',
};

// OVERRIDES ONLY. Empty is the normal state.
//
// Everything is DERIVED from the reheat walk now (see deriveSplit below) —
// Kevin's Aug 2 answers turned the per-dish questions into rules, so declaring
// dishes by hand is no longer the way this fills up. An entry here wins over
// the derivation, for the case where a dish genuinely does not follow the rule.
export const SPLIT_PACKAGING = {};

// ═══════════════════════════════════════════════════════════════════════════
// THE SURCHARGE TEST, AS KEVIN STATED IT
//
//   "If the bag can basically just change into a storage container then no
//    surcharge is needed. If instead it must be reheated in the bag and only in
//    the bag as the best method, that's when we gotta split it to two bags and
//    the surcharge applies."
//
// That collapses exactly onto a field the reheat walk already recorded per
// component. `bag-is-vessel` IS "the bag is the method" — it is why the polenta
// must not be opened. So a bag-is-vessel component needs a SECOND SEALED BAG at
// pack time, and that is the only thing that costs anything.
//
// Every other component is free: a container is already a container, and an
// ordinary sous vide bag becomes storage the moment it is opened, which is the
// reseal rule from Walk I.
const SEALED_MODES = new Set(['bag-is-vessel']);

// THE ONE THING THAT STILL BLOCKS A SPLIT. `not-recommended` is Kevin grading a
// division down himself, which is a judgement rather than a mechanic.
//
// NOTE THE CHANGE: `bag-is-vessel` used to block eligibility here, on the
// reading that an undividable component made a split impossible. Kevin
// corrected that — the customer cannot divide a sealed bag, but HE can pack two
// of them. It is the surcharge trigger, not a disqualifier.
const BLOCKING_MODES = new Set(['not-recommended']);

// Container volumes come from the fleet's own labels ("48 oz round"), so a new
// size needs no edit here.
function ozOf(type, catalog) {
  const m = String(((catalog || {})[type] || {}).label || '').match(/(\d+)\s*oz/i);
  return m ? Number(m[1]) : null;
}

// CONTAINERS ARE NEVER SPLIT. Kevin, Aug 2, and it removes a whole function.
//
// "Split servings ONLY impacts the SV bags not the containers. It's dry rice.
//  Why would I waste 2 containers when they can just pour what they need out
//  of 1?"
//
// That is obvious once said and I had it backwards: a container is poured from,
// so one container already serves two nights at no cost and no extra packaging.
// An earlier version halved every container in the map — turning one 48 oz
// round into two 32s — which invented a cost, wasted a container, and solved
// nothing the customer could not already do by scooping.
//
// SO THE ONLY THING A TWO-NIGHT PACK CHANGES IS THE SEALED BAGS. And that has a
// consequence worth stating: a dish with NO sealed component has nothing to
// sell. There is no pack, no surcharge, and no choice to offer, because pouring
// half out of a container is already free and already possible. Split packaging
// is a smaller feature than it looked, and it is smaller for a good reason.
export function splitContainers(familyMap, sealedCount) {
  const out = { ...(familyMap || {}) };
  if (sealedCount > 0) out.bag = (out.bag || 0) + sealedCount;
  return out;
}


// THE DERIVATION. Returns the same shape a hand-written entry would, or null
// when the dish cannot split. Smalls only — a Large already ships as two of
// everything, so it is split by construction.
export function deriveSplit(dishId, variantLabel, opts = {}) {
  const reheatData = opts.reheatData || REHEAT_DATA;
  const catalog = opts.catalog || null;
  const familyMap = opts.familyMap || null;
  if (isLargeVariant(variantLabel)) return null;

  const d = reheatData[dishId];
  const comps = (d && d.components) || [];
  // NO MINIMUM COMPONENT COUNT. An earlier version required two, on the reading
  // that a single component could not become two packs. That is backwards: a
  // Chili is one stew in one container and splits into two containers perfectly,
  // with nothing to separate and nothing to charge for. It is the simplest split
  // there is, and the rule was excluding it.
  if (!comps.length) return null;

  for (const c of comps) {
    if (c.divide && BLOCKING_MODES.has(c.divide.mode)) return null;
  }

  // VARIANT-SCOPED. Kevin, Aug 2: the polenta on the Saffron and Mushroom ragus
  // is an OPTIONAL variation, so its sealed bag only exists if the customer
  // picks that variant. Charging every buyer for a bag most of them never
  // receive is the kind of error a flat per-dish rule produces.
  //
  // A component counts as optional when some variant of the dish names it. It
  // then applies only to the variants that do.
  const variantLabels = opts.variantLabels || [];
  const namedBySomeVariant = (key) =>
    variantLabels.some(l => l.toLowerCase().includes(String(key).toLowerCase()));
  const appliesHere = (key) =>
    !namedBySomeVariant(key) || String(variantLabel).toLowerCase().includes(String(key).toLowerCase());

  const sealed = comps.filter(c =>
    c.divide && SEALED_MODES.has(c.divide.mode) && appliesHere(c.key));
  const fee = splitFeeFor(sealed.length);
  if (!familyMap || !catalog) return null; // cannot state containers without the fleet

  // NO SEALED COMPONENT, NO PACK. See splitContainers above.
  if (!sealed.length) return null;
  const twoNight = splitContainers(familyMap, sealed.length);

  // NOTHING CHANGED MEANS THERE IS NOTHING TO SELL. A dish that is entirely one
  // ordinary bag comes out of this identical to how it went in — because an
  // ordinary bag already opens and the customer already takes half out. That is
  // the existing pour-and-keep divide, free and unchanged, so offering a
  // "two-night pack" for it would be charging attention for nothing. The Cumin
  // noodles and the Pappardelle are both this case.
  // THE CONTAINER MAP AND THE REHEAT WALK DISAGREE. A sealed component means a
  // second bag has to be packed, so the family map should already list a bag —
  // and for the Saffron and Mushroom ragus it does not. Rather than quietly bill
  // for packaging the map does not know about, this comes back to Kevin.
  const bagMismatch = sealed.length > 0 && !familyMap.bag;

  return {
    family: { ...familyMap },
    twoNight,
    surchargeCents: fee.cents,
    sealedBags: sealed.map(c => c.key),
    needsReview: fee.needsReview || bagMismatch,
    reviewWhy: bagMismatch
      ? `The reheat walk says ${sealed.map(c => c.key).join(' and ')} must stay sealed, but the container map lists no bag for this dish.`
      : (fee.needsReview ? 'Three or more sealed bags — priced at the top tier and flagged rather than billed automatically.' : ''),
    derived: true,
  };
}

// Modes where dividing costs you something. `bag-is-vessel` is the polenta
// problem — opening the bag loses the method — and `not-recommended` is Kevin
// grading a split down himself. A dish with any component in either is not a
// candidate, because a split pack whose best component arrives worse is not a
// service.
//
// IMPORTED, NOT REDECLARED. This list used to live here as a literal, which
// meant the rule ("bag is the vessel cannot be divided") and its enforcement
// were two facts that could drift. canonRules.js now owns it and this file
// consumes it, which is the entire point of having a rules module rather than a
// constant beside each consumer.
const BAD_DIVIDE = new Set(UNDIVIDABLE_MODES);

// ═══════════════════════════════════════════════════════════════════════════
// SMALLS ONLY. THERE IS NO LARGE PATH, AND THERE WILL NOT BE ONE.
//
// Kevin, Aug 2: a Large already ships exactly 2x of every container a Small
// does, INCLUDING the sous vide bags. It is split by construction. Doubling
// every bag again would produce quarters, not halves, which contradicts the
// split-in-half rule — so rather than reconcile that, he removed Large from the
// feature entirely.
//
// The Large fee tiers discussed before this ruling ($4 / $6 / $8) are DEAD. Do
// not build a Large path and do not re-pitch one.
//
// Enforced here rather than left to the config, because the config is filled in
// by hand and "no Large" is a rule about the product, not a data-entry habit.
const LARGE_RE = /\blarge\b/i;

export function isLargeVariant(variantLabel) {
  return LARGE_RE.test(String(variantLabel || ''));
}

// ═══════════════════════════════════════════════════════════════════════════
// THE SURCHARGE TEST: DOES SPLITTING ADD PACKAGING?
//
// Kevin's whole test, and it collapses onto the bag-is-vessel distinction the
// reheat walk already recorded per component:
//
//   Container-only        → NO SURCHARGE. The customer scoops what they need and
//                           nothing extra is packed. This is not a decision he
//                           made per dish; it falls out of how the dish ships.
//   An opened SV bag      → also no surcharge. Once opened it is a container,
//                           the same logic as the reseal rule in Walk I.
//   Must stay SEALED to
//   reheat                → SURCHARGE, because that is the only case where a
//                           genuine second bag is needed. His list: SV vegetables
//                           outside a stew or curry, the stir-fries that come in
//                           SV bags, the polenta, and the purees.
//
// A split is ALWAYS IN HALF. A four-serving dish becomes 2 x 2. No thirds, no
// quarters.
export const SPLIT_FEE_BY_EXTRA_BAGS = { 0: 0, 1: 300, 2: 500, 3: 600 };

// The three-bag row is a SAFETY NET, NOT A PRICE. Kevin does not believe any
// dish needs it; it exists so nothing breaks if one gets through. Anything at
// three or more must be SURFACED TO HIM rather than quietly billed, which is
// what `needsReview` is for. Do not extrapolate a fourth tier.
export const SPLIT_FEE_REVIEW_THRESHOLD = 3;

export function splitFeeFor(extraBags) {
  const n = Math.max(0, Math.round(Number(extraBags) || 0));
  const capped = Math.min(n, SPLIT_FEE_REVIEW_THRESHOLD);
  return {
    extraBags: n,
    cents: SPLIT_FEE_BY_EXTRA_BAGS[capped],
    // True at 3+. A dish here is not priced automatically; it goes to Kevin.
    needsReview: n >= SPLIT_FEE_REVIEW_THRESHOLD,
  };
}

export function splitEntryFor(dishId, variantLabel) {
  // A HAND-WRITTEN OVERRIDE WINS. Empty is the normal state; this exists for a
  // dish that genuinely does not follow the rule.
  const entry = SPLIT_PACKAGING[dishId];
  if (entry && Array.isArray(entry.byVariant)) {
    const hit = entry.byVariant.find(v => {
      if (!v || !v.match) return false;
      return v.match instanceof RegExp ? v.match.test(variantLabel || '') : String(v.match) === variantLabel;
    });
    if (hit) return hit;
  }

  // Otherwise derive it from the reheat walk and the container map. Kevin's
  // Aug 2 answers turned the per-dish questions into rules, so this needs no
  // per-dish declaration.
  const dish = DISHES.find(d => dishIdFor(d.name) === dishId);
  if (!dish) return null;
  const derived = deriveSplit(dishId, variantLabel, {
    catalog: CONTAINER_TYPES,
    familyMap: containersForDish(dish, variantLabel),
    variantLabels: (dish.variants || []).map(v => v.label),
  });
  // A split that needs Kevin's ruling is not offered to a customer. Better no
  // option than one priced on a disagreement between two records.
  return derived && !derived.needsReview ? derived : null;
}

// The gate every customer surface must go through. False for everything today.
export function isSplitEligible(dishId, variantLabel) {
  // The Large rule is checked BEFORE the config, so a Large entry left in the
  // map by mistake still cannot reach a customer.
  if (isLargeVariant(variantLabel)) return false;
  return !!splitEntryFor(dishId, variantLabel);
}

// Containers for a chosen shape. Returns null when the dish is not eligible, so
// callers fall back to the ordinary container map rather than inventing one.
export function containersForPack(dishId, variantLabel, shape) {
  const entry = splitEntryFor(dishId, variantLabel);
  if (!entry) return null;
  const map = shape === 'twoNight' ? entry.twoNight : entry.family;
  return map && typeof map === 'object' ? { ...map } : null;
}

// VERSION SCOPE. Optional, and null means "every version", which is the honest
// default for a packaging fact that usually does not move with the recipe.
//
// It exists NOW, while the map is empty, on purpose. The systems master scopes
// eligibility to recipe versions and later has Carry-Forward Review treat it as
// unreviewed-rather-than-inherited across a version cut. Adding the field to an
// empty config costs nothing; adding it after Kevin has filled in twenty dishes
// means revisiting twenty decisions to say which versions each one meant.
export function packAppliesToVersion(dishId, variantLabel, recipeVersionId) {
  const entry = splitEntryFor(dishId, variantLabel);
  if (!entry) return false;
  if (!Array.isArray(entry.recipeVersionIds)) return true; // unscoped = all versions
  return entry.recipeVersionIds.includes(recipeVersionId);
}

// FOOTPRINT IS THE CONTAINER LIST, SAID IN WORDS.
//
// The systems master pairs the packaging choice with a fridge/freezer footprint
// preview, and the honest source for that is the container map already declared
// above — not a shelf-space calculation nobody measured. "Two 32 oz rounds" is
// something Kevin stated and a customer can picture. Inches of shelf would be
// invented precision about a fridge this app has never seen.
export function describeFootprint(containerMap, catalog) {
  if (!containerMap) return '';
  const parts = [];
  for (const [type, n] of Object.entries(containerMap)) {
    if (!n) continue;
    const label = (catalog && catalog[type] && catalog[type].label) || type;
    parts.push(n > 1 ? `${n} \u00d7 ${label}` : label);
  }
  return parts.join(' + ');
}

export function containerCount(containerMap) {
  if (!containerMap) return 0;
  return Object.values(containerMap).reduce((a, b) => a + (Number(b) || 0), 0);
}

export function surchargeCentsFor(dishId, variantLabel, shape) {
  if (shape !== 'twoNight') return 0;
  const entry = splitEntryFor(dishId, variantLabel);
  return entry && Number.isFinite(entry.surchargeCents) ? Math.max(0, entry.surchargeCents) : 0;
}

// Normalize whatever arrived on an order item. An unknown shape is 'family',
// never the split: an order carrying a shape Kevin cannot pack is worse than
// one carrying the default.
export function normalizePackShape(v) {
  return PACK_SHAPES.includes(v) ? v : 'family';
}

// ── The worklist ────────────────────────────────────────────────────────────
//
// Which dishes are worth ASKING Kevin about, from the Walk 2 data. This is a
// shortlist and explicitly not an eligibility answer: it knows the food and
// nothing about the Tuesday.
export function splitCandidates(reheatData = REHEAT_DATA) {
  const out = [];
  for (const [dishId, d] of Object.entries(reheatData || {})) {
    const comps = (d && d.components) || [];
    if (comps.length < 2) continue; // one component cannot be split into two packs
    const blockers = comps.filter(c => c.divide && BAD_DIVIDE.has(c.divide.mode));
    out.push({
      dishId,
      components: comps.length,
      blockers: blockers.map(c => ({ key: c.key, mode: c.divide.mode, note: c.divide.note || '' })),
      // Recorded rather than filtered on: a dish with a blocker is still worth
      // showing Kevin with the reason, because he may know a way around it that
      // the walk answer did not capture.
      looksSplittable: blockers.length === 0,
    });
  }
  return out.sort((a, b) => Number(b.looksSplittable) - Number(a.looksSplittable) || a.dishId.localeCompare(b.dishId));
}

export function splitPackagingStatus() {
  const declared = Object.keys(SPLIT_PACKAGING).length;
  const candidates = splitCandidates();
  return {
    declared,
    candidates: candidates.length,
    likely: candidates.filter(c => c.looksSplittable).length,
    complete: declared > 0,
  };
}
