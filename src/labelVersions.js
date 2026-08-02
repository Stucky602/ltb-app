// labelVersions.js — what was actually ON the package, and when.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
//
// The ingredient registry says `worcestershire`, `miso`, `chicken stock`. Those
// are names of things Kevin BUYS, and the assumption underneath every allergen
// answer the app gives is that a product name is a stable ingredient list. It
// is not. Manufacturers reformulate, he switches brands mid-year because the
// usual one was out, and a "gluten free" claim on a bottle is a fact about that
// bottle rather than about the word on the label.
//
// This records the actual package: brand, product, the ingredient text as
// printed, the allergen declaration, when it was first seen and when it stopped
// being what he buys. It ships EMPTY and fills only as Kevin photographs labels.
//
// ═══════════════════════════════════════════════════════════════════════════
// FOUR THINGS THIS IS NOT
//
// Not lot tracking. Not stock management. Not a recall system. And not an
// inference engine: nothing here reads a label and decides what it means. OCR
// is deliberately absent — an ingredient list is the one place in this app
// where a plausible-looking misread is worse than a blank, because someone
// decides whether they can safely eat something on the strength of it. A label
// enters this store when Kevin has typed or checked its text, and never before.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE PROPERTY THAT MATTERS MOST: HISTORY CANNOT BE REWRITTEN
//
// When a new label supersedes an old one, the old record keeps its own text and
// its own dates. `labelVersionAt(ingredientId, date)` answers with what was on
// the shelf THEN, not what is on it now. That is the whole point: an order from
// March must still be able to say what was in it, and a bottle changing in July
// must not silently rewrite March's answer.
//
// This is also the foundation the Accommodation Workbench will stand on, which
// is why the resolver exists now while nothing calls it yet.

export const LABEL_VERSIONS_VERSION = 1;

// confirmed  — Kevin has read the label and says this is what it says.
// unresolved — captured but not yet checked. NEVER answers a query; an
//              unchecked label is exactly the kind of half-fact that should not
//              be able to reassure anybody.
// rejected   — a brand he looked at and does not buy. Kept so the same bottle
//              is not re-evaluated from scratch next year.
export const LABEL_STATUSES = ['confirmed', 'unresolved', 'rejected'];

export function emptyLabels() {
  return { version: LABEL_VERSIONS_VERSION, labels: [] };
}

const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');
const list = (v, max = 30) => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x).slice(0, max) : []);
const ts = (v) => (typeof v === 'number' ? v : null);

export function normalizeLabels(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.labels)) return emptyLabels();
  const seen = new Set();
  const labels = [];
  for (const l of raw.labels) {
    if (!l || typeof l !== 'object' || !l.id || seen.has(l.id)) continue;
    seen.add(l.id);
    labels.push({
      id: String(l.id),
      ingredientId: str(l.ingredientId, 80),
      brand: str(l.brand, 120),
      product: str(l.product, 200),
      ingredientText: str(l.ingredientText),
      allergenText: str(l.allergenText, 1000),
      photos: list(l.photos),
      receiptAliases: list(l.receiptAliases),
      firstObserved: ts(l.firstObserved) || Date.now(),
      supersededAt: ts(l.supersededAt),
      status: LABEL_STATUSES.includes(l.status) ? l.status : 'unresolved',
      note: str(l.note, 1000),
    });
  }
  return { version: LABEL_VERSIONS_VERSION, labels };
}

export function addLabel(store, partial, now = Date.now()) {
  const s = normalizeLabels(store);
  if (!partial || !partial.ingredientId) return s;
  const id = partial.id || `lbl_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  if (s.labels.some(l => l.id === id)) return s;
  const label = normalizeLabels({
    labels: [{ ...partial, id, firstObserved: partial.firstObserved || now }],
  }).labels[0];
  return { ...s, labels: [...s.labels, label] };
}

// Supersede, never overwrite. The old record keeps its text and gains an end
// date; the new one starts where the old one stopped. A store that edited the
// existing row in place would make March's answer change in July, which is the
// single thing this module exists to prevent.
export function supersedeLabel(store, oldId, newLabel, now = Date.now()) {
  let s = normalizeLabels(store);
  const old = s.labels.find(l => l.id === oldId);
  if (!old) return s;
  s = {
    ...s,
    labels: s.labels.map(l => (l.id === oldId ? { ...l, supersededAt: now } : l)),
  };
  return addLabel(s, { ...newLabel, ingredientId: old.ingredientId, firstObserved: now }, now);
}

export function updateLabel(store, id, patch) {
  const s = normalizeLabels(store);
  return {
    ...s,
    labels: s.labels.map(l => {
      if (l.id !== id) return l;
      // firstObserved and id are never patchable: they are what makes the
      // record a point in time rather than a mutable row.
      return normalizeLabels({ labels: [{ ...l, ...patch, id: l.id, firstObserved: l.firstObserved }] }).labels[0];
    }),
  };
}

// THE RESOLVER. What was on the package for this ingredient at this moment.
//
// Returns null rather than guessing when nothing was recorded then — including
// when a label exists but only started later. "We do not know what was in it"
// is a real answer and the correct one; reaching for the nearest label would
// manufacture provenance that nobody observed.
export function labelVersionAt(store, ingredientId, at = Date.now()) {
  const when = typeof at === 'number' ? at : Date.parse(at) || Date.now();
  const candidates = normalizeLabels(store).labels.filter(l =>
    l.ingredientId === ingredientId
    && l.status === 'confirmed'
    && l.firstObserved <= when
    && (l.supersededAt === null || l.supersededAt > when));
  if (!candidates.length) return null;
  // Newest applicable wins, for the case where two overlap because a date was
  // entered by hand.
  return candidates.sort((a, b) => b.firstObserved - a.firstObserved)[0];
}

export const currentLabelFor = (store, ingredientId) => labelVersionAt(store, ingredientId, Date.now());

export function labelsFor(store, ingredientId) {
  return normalizeLabels(store).labels
    .filter(l => l.ingredientId === ingredientId)
    .sort((a, b) => b.firstObserved - a.firstObserved);
}

// ── The diff Kevin reviews ──────────────────────────────────────────────────
//
// Token-level, on the ingredient text, plus a straight comparison of the
// allergen line. Deliberately dumb: it highlights what to LOOK at and makes no
// judgement about what a change means. "Contains soy lecithin now" is a fact;
// "this is now unsafe for Carl" is a ruling, and rulings are Kevin's.
export function diffLabels(oldLabel, newLabel) {
  const toks = (t) => String(t || '')
    .toLowerCase()
    .split(/[,;.()\[\]]+|\s{2,}/)
    .map(x => x.trim())
    .filter(Boolean);
  const a = new Set(toks(oldLabel && oldLabel.ingredientText));
  const b = new Set(toks(newLabel && newLabel.ingredientText));
  return {
    added: [...b].filter(x => !a.has(x)),
    removed: [...a].filter(x => !b.has(x)),
    allergenChanged: String((oldLabel && oldLabel.allergenText) || '').trim()
      !== String((newLabel && newLabel.allergenText) || '').trim(),
    oldAllergen: (oldLabel && oldLabel.allergenText) || '',
    newAllergen: (newLabel && newLabel.allergenText) || '',
  };
}

export function labelCounts(store) {
  const l = normalizeLabels(store).labels;
  return {
    total: l.length,
    confirmed: l.filter(x => x.status === 'confirmed' && x.supersededAt === null).length,
    unresolved: l.filter(x => x.status === 'unresolved').length,
    superseded: l.filter(x => x.supersededAt !== null).length,
    ingredients: new Set(l.map(x => x.ingredientId)).size,
  };
}
