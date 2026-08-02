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

export const PACK_SHAPES = ['family', 'twoNight'];
export const PACK_LABELS = {
  family: 'Family pack',
  twoNight: 'Two-night pack',
};
export const PACK_BLURBS = {
  family: 'Everything together, the normal way.',
  twoNight: 'Split into two, so you can heat one half and leave the other sealed.',
};

// EMPTY ON PURPOSE. See the header. Filled from Kevin's answers to the
// split-packaging walk, one dish at a time, never guessed.
export const SPLIT_PACKAGING = {};

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

export function splitEntryFor(dishId, variantLabel) {
  const entry = SPLIT_PACKAGING[dishId];
  if (!entry || !Array.isArray(entry.byVariant)) return null;
  const hit = entry.byVariant.find(v => {
    if (!v || !v.match) return false;
    return v.match instanceof RegExp ? v.match.test(variantLabel || '') : String(v.match) === variantLabel;
  });
  return hit || null;
}

// The gate every customer surface must go through. False for everything today.
export function isSplitEligible(dishId, variantLabel) {
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
