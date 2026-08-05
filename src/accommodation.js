// accommodation.js — "can you make it without X?"
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS IS FOR
//
// Today every one of these is a text to Kevin, answered from memory, and the
// answer is lost the moment it is sent. This resolves the request against the
// recorded anatomy, routes what needs him, and KEEPS his answer so the same
// question does not cost him twice.
//
// That stored answer is also the Answer Desk's third empty source. An
// accommodation Kevin has already ruled on becomes an approved answer scoped to
// a dish and a version, which is why this is worth building against two dishes
// rather than waiting for twenty-five.
//
// ═══════════════════════════════════════════════════════════════════════════
// IT FAILS CLOSED, AND UNKNOWN IS NOT NO
//
// Three outcomes, and the third is the one that matters:
//
//   FINE        — a garnish. Removable with no consequence and no decision.
//   ASK KEVIN   — anything else, WITH the consequence attached so he is
//                 deciding rather than reconstructing the dish from memory.
//   UNKNOWN     — nothing recorded. Routes to him exactly like ASK, but says
//                 plainly that the app has nothing, so a thin answer is never
//                 mistaken for a considered one.
//
// **Unknown never resolves to "safe to remove".** Silence about a consequence
// is not evidence that there is not one — the same rule `removalConsequence`
// already enforces, carried through to the surface that acts on it.
//
// ═══════════════════════════════════════════════════════════════════════════
// TWO QUESTIONS, NOT ONE
//
// "Can it come out" and "can something else do its job" are different, and the
// anatomy walk proved they cannot be inferred from each other: the curry butter
// is identity-defining AND swappable. So a resolution answers both, and a
// removal that would change the dish can still carry a real alternative.

import {
  removalConsequence, anatomyForDish, CRITICALITY_LABELS, SUBSTITUTABILITY_LABELS,
} from './anatomy.js';

export const ACCOMMODATION_VERSION = 1;

export const OUTCOMES = ['fine', 'ask', 'unknown'];

export const OUTCOME_LABELS = {
  fine: 'Fine to leave out',
  ask: 'Needs Kevin',
  unknown: 'Nothing recorded',
};

const str = (v, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : '');

// ── Resolution ──────────────────────────────────────────────────────────────

// Reads the anatomy and says what kind of request this is. Decides NOTHING about
// whether Kevin will agree — it only sorts, and attaches what he would otherwise
// have to remember.
export function resolveRequest({ anatomy, dishId, ingredientId, recipeVersionId } = {}) {
  const base = { dishId, ingredientId, recipeVersionId: recipeVersionId || null };
  if (!dishId || !ingredientId) {
    return { ...base, outcome: 'unknown', reason: 'no dish or ingredient given', consequence: null };
  }

  const c = removalConsequence(anatomy, dishId, ingredientId, recipeVersionId);

  if (!c) {
    return {
      ...base,
      outcome: 'unknown',
      // Said in words rather than left as an empty field, because a blank reads
      // as "nothing to worry about".
      reason: 'This ingredient has no recorded anatomy, so the app cannot say what leaving it out would do.',
      consequence: null,
      substitutability: null,
    };
  }

  // AN UPGRADE IS NOT AN ACCOMMODATION. Declining egg pappardelle is choosing a
  // different variant, and treating it as a recipe modification would put a
  // decision in front of Kevin that is really just an order change.
  if (c.upgrade) {
    return {
      ...base,
      outcome: 'fine',
      reason: 'This is an upgrade rather than part of the base dish. Leaving it out is just the standard version.',
      consequence: c,
      substitutability: c.substitutability,
    };
  }

  // A LINKED LINE HAS NO INDEPENDENT ANSWER. The curry's stock swaps with the
  // protein; asking about it alone is asking the wrong question, and answering
  // it alone would give a wrong one.
  if (c.substitutability === 'linked') {
    return {
      ...base,
      outcome: 'ask',
      reason: `This follows the ${c.linkedTo || 'linked'} line rather than being chosen on its own, so it cannot be answered by itself.`,
      consequence: c,
      substitutability: 'linked',
    };
  }

  if (c.removableOnRequest) {
    return {
      ...base,
      outcome: 'fine',
      reason: c.ifOmitted || 'Recorded as a garnish, removable with no consequence.',
      consequence: c,
      substitutability: c.substitutability,
    };
  }

  // Everything else goes to Kevin, carrying the consequence AND the swap, which
  // are separate answers to separate questions.
  return {
    ...base,
    outcome: 'ask',
    reason: c.ifOmitted
      || `Recorded as ${(CRITICALITY_LABELS[c.criticality] || c.criticality).toLowerCase()}, with no note on what leaving it out does.`,
    consequence: c,
    substitutability: c.substitutability,
  };
}

// What Kevin reads. A packet, not a notification: he should not have to
// reconstruct which dish, which version, or why it matters.
export function requestSummary(res, dishName) {
  if (!res) return '';
  const lines = [`${dishName || res.dishId} — without ${res.ingredientId}`];
  if (res.consequence) {
    lines.push(`Recorded as: ${res.consequence.label}`);
    if (res.consequence.substitutabilityLabel) {
      lines.push(`Swap: ${res.consequence.substitutabilityLabel}`
        + (res.consequence.role ? ` (${res.consequence.role})` : ''));
    }
    const subs = (res.consequence.substitutions || []);
    if (subs.length) lines.push(`Alternatives on record: ${subs.join(', ')}`);
    const nons = (res.consequence.nonSubstitutions || []);
    if (nons.length) lines.push(`Explicitly does NOT work: ${nons.join(', ')}`);
  }
  lines.push(res.reason);
  if (res.recipeVersionId) lines.push(`Version: ${res.recipeVersionId}`);
  return lines.join('\n');
}

// ── The decision record ─────────────────────────────────────────────────────
//
// SHIPS EMPTY. Nothing here proposes an answer, drafts one, or infers one from
// a similar dish — the whole value is that a recorded decision is Kevin's, and
// a generated one wearing his name would be worse than no record at all.

export function emptyAccommodations() {
  return { version: ACCOMMODATION_VERSION, decisions: [] };
}

export const ANSWERS = ['yes', 'no', 'swap'];

export function normalizeAccommodations(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.decisions)) return emptyAccommodations();
  const seen = new Set();
  const decisions = [];
  for (const d of raw.decisions) {
    if (!d || typeof d !== 'object' || !d.id || seen.has(d.id)) continue;
    if (!d.dishId || !d.ingredientId) continue;
    if (!ANSWERS.includes(d.answer)) continue;
    seen.add(d.id);
    decisions.push({
      id: String(d.id),
      dishId: String(d.dishId),
      ingredientId: String(d.ingredientId),
      // SCOPED TO A VERSION when one is given. A ruling made against one recipe
      // is not automatically true of the next — the same rule the ingredient
      // cards and the Answer Desk already follow.
      recipeVersionId: str(d.recipeVersionId, 120) || null,
      answer: d.answer,
      // His words. Shown to a customer only through the derivative approval
      // flow, never lifted straight onto a page.
      note: str(d.note),
      swapTo: str(d.swapTo, 200),
      at: typeof d.at === 'number' ? d.at : Date.now(),
    });
  }
  return { version: ACCOMMODATION_VERSION, decisions };
}

export function recordDecision(store, partial, now = Date.now()) {
  const s = normalizeAccommodations(store);
  const id = (partial && partial.id)
    || `ac_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const built = normalizeAccommodations({ decisions: [{ ...partial, id, at: (partial && partial.at) || now }] }).decisions[0];
  if (!built) return s;
  // A NEW RULING SUPERSEDES rather than duplicating: same dish, same ingredient,
  // same version scope.
  const rest = s.decisions.filter(d => !(
    d.dishId === built.dishId
    && d.ingredientId === built.ingredientId
    && d.recipeVersionId === built.recipeVersionId
  ));
  return { ...s, decisions: [built, ...rest] };
}

// A PRIOR RULING ANSWERS INSTANTLY, and only for the version it was made
// against. A decision with no version scope answers for any version — that is
// Kevin saying it in general, which he can do deliberately.
export function priorDecision(store, dishId, ingredientId, recipeVersionId) {
  const s = normalizeAccommodations(store);
  const exact = s.decisions.find(d => d.dishId === dishId && d.ingredientId === ingredientId
    && d.recipeVersionId === recipeVersionId);
  if (exact) return exact;
  return s.decisions.find(d => d.dishId === dishId && d.ingredientId === ingredientId
    && !d.recipeVersionId) || null;
}

// THE ENTRY POINT. Prior ruling first, anatomy second.
export function answerRequest({ anatomy, decisions, dishId, ingredientId, recipeVersionId } = {}) {
  const prior = priorDecision(decisions, dishId, ingredientId, recipeVersionId || null);
  if (prior) {
    return {
      dishId, ingredientId, recipeVersionId: recipeVersionId || null,
      outcome: prior.answer === 'no' ? 'ask' : 'fine',
      settled: true,
      answer: prior.answer,
      reason: prior.note || '',
      swapTo: prior.swapTo || '',
      consequence: null,
      // Named so a stale ruling is visible rather than silently authoritative.
      decidedAt: prior.at,
      scopedToVersion: prior.recipeVersionId,
    };
  }
  return { ...resolveRequest({ anatomy, dishId, ingredientId, recipeVersionId }), settled: false };
}

// The worklist: what a household asked that nobody has ruled on. Deliberately
// not a count of everything ever asked — only what is still open.
export function openRequests(store, decisions, requests) {
  return (requests || []).filter(r => !priorDecision(decisions, r.dishId, r.ingredientId, r.recipeVersionId || null));
}

export function accommodationCounts(store) {
  const d = normalizeAccommodations(store).decisions;
  return {
    total: d.length,
    yes: d.filter(x => x.answer === 'yes').length,
    no: d.filter(x => x.answer === 'no').length,
    swap: d.filter(x => x.answer === 'swap').length,
    versionScoped: d.filter(x => !!x.recipeVersionId).length,
  };
}

// Coverage, so the gap is visible rather than felt. Reports how much of a dish
// could be answered without him.
export function dishCoverage(anatomy, dishId) {
  const entries = anatomyForDish(anatomy, dishId) || [];
  const confirmed = entries.filter(e => e.status === 'confirmed');
  return {
    dishId,
    recorded: confirmed.length,
    answerable: confirmed.filter(e => e.criticality === 'garnish' || e.upgrade).length,
    needsKevin: confirmed.filter(e => e.criticality && e.criticality !== 'garnish' && !e.upgrade).length,
  };
}
