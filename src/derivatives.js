// derivatives.js — the one gate between a private record and another audience.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE PROBLEM THIS SOLVES ONCE INSTEAD OF SIX TIMES
//
// Several planned surfaces all want to show a version of something Kevin wrote
// privately: layered explanations, ingredient cards, Hidden Connections, reheat
// copy, accommodation output, terms of art, Chronicle excerpts. Every one of
// them faces the same question — what can this particular reader see? — and if
// each answers it separately, six near-identical approval flows exist and one
// of them will eventually project a private note straight onto a public page.
//
// So there is one store. A private record may have an APPROVED DERIVATIVE for a
// named audience, and no surface may project a private record any other way.
//
// ═══════════════════════════════════════════════════════════════════════════
// A DERIVATIVE IS WRITTEN, NOT GENERATED
//
// `text` is Kevin's wording. Nothing in this file summarises, simplifies, or
// rewrites a source record into a customer sentence, and it must stay that way:
// an automatic simplification of a technical note is exactly how a nuance gets
// dropped and a customer is told something untrue about their food. The store
// holds what he wrote and records that he approved it.
//
// The absence of a derivative is meaningful and is the default. No derivative
// means the source is private to Kevin — not "not written yet", not "use the
// original for now". `derivativeFor()` returns null and the calling surface
// shows nothing.
//
// ═══════════════════════════════════════════════════════════════════════════
// AUDIENCES ARE NOT A HIERARCHY
//
// A younger explanation does not replace the technical one and is not a
// degraded copy of it. They coexist against the same source. Nothing here
// implies one is more true than another, and nothing falls back from one
// audience to another — a customer does not get the archive text because no
// customer text exists.

export const DERIVATIVES_VERSION = 1;

export const AUDIENCES = ['customer', 'rowanYounger', 'rowanOlder', 'cook', 'maintainer'];

export const AUDIENCE_LABELS = {
  customer: 'Customer',
  rowanYounger: 'Rowan, younger',
  rowanOlder: 'Rowan, older',
  cook: 'A cook or apprentice',
  maintainer: 'Whoever maintains this later',
};

export function emptyDerivatives() {
  return { version: DERIVATIVES_VERSION, derivatives: [] };
}

const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');

export function normalizeDerivatives(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.derivatives)) return emptyDerivatives();
  const seen = new Set();
  const derivatives = [];
  for (const d of raw.derivatives) {
    if (!d || typeof d !== 'object' || !d.id || seen.has(d.id)) continue;
    if (!AUDIENCES.includes(d.audience)) continue; // an unknown audience is not a reader we know how to protect
    seen.add(d.id);
    derivatives.push({
      id: String(d.id),
      sourceRecordId: str(d.sourceRecordId, 200),
      audience: d.audience,
      text: str(d.text),
      // approvedAt is the whole authority of this record. Absent means it is a
      // draft and must not be projected anywhere.
      approvedAt: typeof d.approvedAt === 'number' ? d.approvedAt : null,
      supersededAt: typeof d.supersededAt === 'number' ? d.supersededAt : null,
      ts: typeof d.ts === 'number' ? d.ts : Date.now(),
    });
  }
  return { version: DERIVATIVES_VERSION, derivatives };
}

export function derivativeId(sourceRecordId, audience) {
  return `dv_${String(sourceRecordId || '').replace(/[^a-z0-9@:_-]/gi, '')}_${audience}`;
}

// Drafted, NOT approved. Two steps on purpose: writing a customer sentence and
// deciding it may be shown are different acts, and collapsing them means a
// half-finished thought reaches a customer the moment it is typed.
export function draftDerivative(store, { sourceRecordId, audience, text }, now = Date.now()) {
  const s = normalizeDerivatives(store);
  if (!sourceRecordId || !AUDIENCES.includes(audience) || !String(text || '').trim()) return s;
  const id = derivativeId(sourceRecordId, audience);
  const existing = s.derivatives.find(d => d.id === id && !d.supersededAt);
  if (existing) {
    // Editing an APPROVED derivative un-approves it. The approval was of
    // particular words; different words have not been approved.
    return {
      ...s,
      derivatives: s.derivatives.map(d => (d.id === id
        ? { ...d, text: str(text), approvedAt: null }
        : d)),
    };
  }
  return {
    ...s,
    derivatives: [...s.derivatives, normalizeDerivatives({
      derivatives: [{ id, sourceRecordId, audience, text, approvedAt: null, ts: now }],
    }).derivatives[0]],
  };
}

export function approveDerivative(store, id, now = Date.now()) {
  const s = normalizeDerivatives(store);
  return {
    ...s,
    derivatives: s.derivatives.map(d => (d.id === id ? { ...d, approvedAt: now } : d)),
  };
}

export function revokeDerivative(store, id, now = Date.now()) {
  const s = normalizeDerivatives(store);
  return {
    ...s,
    derivatives: s.derivatives.map(d => (d.id === id ? { ...d, supersededAt: now, approvedAt: null } : d)),
  };
}

// THE ONLY READ PATH ANY SURFACE MAY USE.
//
// Approved and not revoked, or nothing. There is no fallback to another
// audience and no fallback to the source text, because both would defeat the
// entire point of the store existing.
export function derivativeFor(store, sourceRecordId, audience) {
  const hit = normalizeDerivatives(store).derivatives.find(d =>
    d.sourceRecordId === sourceRecordId
    && d.audience === audience
    && d.approvedAt !== null
    && d.supersededAt === null);
  return hit || null;
}

export function derivativesForSource(store, sourceRecordId) {
  return normalizeDerivatives(store).derivatives
    .filter(d => d.sourceRecordId === sourceRecordId && !d.supersededAt);
}

export function pendingApproval(store) {
  return normalizeDerivatives(store).derivatives.filter(d => d.approvedAt === null && !d.supersededAt);
}

export function derivativeCounts(store) {
  const d = normalizeDerivatives(store).derivatives;
  return {
    total: d.length,
    approved: d.filter(x => x.approvedAt !== null && !x.supersededAt).length,
    drafts: d.filter(x => x.approvedAt === null && !x.supersededAt).length,
    revoked: d.filter(x => x.supersededAt !== null).length,
  };
}
