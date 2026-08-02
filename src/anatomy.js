// anatomy.js — why each ingredient line is there.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS HOLDS
//
// A recipe says how much milk goes into the Bolognese. It does not say that the
// milk is what breaks the meat down into the fine texture Kevin wants, that
// leaving it out exposes the acidity, or that this is technique-critical rather
// than a flavour garnish and therefore cannot be dropped because someone wrote
// "no dairy" in a notes box.
//
// That knowledge exists entirely in Kevin's head. It is the difference between
// a recipe that can be followed and a recipe that can be reasoned about, and it
// is what the Accommodation Workbench, Ask the Record, layered explanations,
// and eventually Rowan all need in order to say anything useful.
//
// ═══════════════════════════════════════════════════════════════════════════
// IT SHIPS EMPTY AND IT WILL STAY THAT WAY UNTIL KEVIN WRITES IN IT
//
// Every field below is a food fact. Not one of them can be derived, inferred
// from a recipe, or guessed from general culinary knowledge without inventing
// something — and an invented role for an ingredient is exactly the kind of
// confident wrong answer that would then propagate into an accommodation
// decision, a customer explanation, and a document handed to a child.
//
// There are no seeds in this file, deliberately, and that absence is the
// design. The one thing this batch can honestly provide is the structure and
// the place to put it.
//
// ═══════════════════════════════════════════════════════════════════════════
// VERSION-SCOPED FROM BIRTH
//
// An anatomy entry is about an ingredient line in a SPECIFIC recipe version.
// The role of milk can change when the recipe changes, and a note written
// against v5 must not silently describe v7. `recipeVersionIds: null` means "all
// versions so far", which is the honest default for a fact that has not been
// re-examined; an explicit list means Kevin has scoped it.
//
// Scoping is here from the first line of code rather than retrofitted, because
// retrofitting it means revisiting every entry to ask which versions it meant —
// and by then there is no one left who remembers.

export const ANATOMY_VERSION = 1;

// How much the dish depends on this line. The distinction that matters is
// between "can be left out on request" and "leaving it out makes a different
// dish", because that is precisely the question an accommodation asks.
export const CRITICALITY = [
  'identity',    // remove it and this is not the dish any more
  'technique',   // the method depends on it; texture or structure fails without it
  'structural',  // important but substitutable within recorded limits
  'seasoning',   // adjustable to taste
  'garnish',     // removable on request with no consequence
];

export const CRITICALITY_LABELS = {
  identity: 'Identity-defining',
  technique: 'Technique-critical',
  structural: 'Structurally important',
  seasoning: 'Seasoning',
  garnish: 'Removable garnish',
};

export const ANATOMY_STATUSES = ['proposed', 'confirmed', 'retired'];

export function emptyAnatomy() {
  return { version: ANATOMY_VERSION, entries: [] };
}

const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');
const list = (v, max = 30) => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x).slice(0, max) : []);

export function normalizeAnatomy(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.entries)) return emptyAnatomy();
  const seen = new Set();
  const entries = [];
  for (const e of raw.entries) {
    if (!e || typeof e !== 'object' || !e.id || seen.has(e.id)) continue;
    seen.add(e.id);
    entries.push({
      id: String(e.id),
      dishId: str(e.dishId, 80),
      ingredientId: str(e.ingredientId, 80),
      // null = every version recorded so far. An array = Kevin scoped it.
      recipeVersionIds: Array.isArray(e.recipeVersionIds) ? list(e.recipeVersionIds) : null,
      roles: list(e.roles),
      criticality: CRITICALITY.includes(e.criticality) ? e.criticality : null,
      ifOmitted: str(e.ifOmitted),
      ifMore: str(e.ifMore),
      ifLess: str(e.ifLess),
      substitutions: list(e.substitutions),
      nonSubstitutions: list(e.nonSubstitutions),
      misunderstanding: str(e.misunderstanding),
      // Evidence links, per the shared primitive: journal entry ids, cue ids,
      // capture ids. Generated proposals are not evidence and are not stored here.
      evidence: list(e.evidence),
      status: ANATOMY_STATUSES.includes(e.status) ? e.status : 'proposed',
      ts: typeof e.ts === 'number' ? e.ts : Date.now(),
    });
  }
  return { version: ANATOMY_VERSION, entries };
}

export function anatomyId(dishId, ingredientId) {
  return `an_${String(dishId || '').replace(/[^a-z0-9-]/gi, '')}_${String(ingredientId || '').replace(/[^a-z0-9_-]/gi, '')}`;
}

export function addAnatomy(store, partial, now = Date.now()) {
  const s = normalizeAnatomy(store);
  if (!partial || !partial.dishId || !partial.ingredientId) return s;
  const id = partial.id || anatomyId(partial.dishId, partial.ingredientId);
  if (s.entries.some(e => e.id === id)) return s;
  const entry = normalizeAnatomy({ entries: [{ ...partial, id, ts: now }] }).entries[0];
  return { ...s, entries: [...s.entries, entry] };
}

export function updateAnatomy(store, id, patch) {
  const s = normalizeAnatomy(store);
  return {
    ...s,
    entries: s.entries.map(e => (e.id === id
      ? normalizeAnatomy({ entries: [{ ...e, ...patch, id: e.id, ts: e.ts }] }).entries[0]
      : e)),
  };
}

// THE RESOLVER, and it is scope-aware for the same reason labelVersionAt is.
// Passing a recipeVersionId filters to entries that apply to it; an unscoped
// entry applies to everything, and a scoped one that does not list this version
// does not answer. Returns null rather than the nearest match.
export function anatomyFor(store, dishId, ingredientId, recipeVersionId) {
  const hits = normalizeAnatomy(store).entries.filter(e =>
    e.dishId === dishId
    && e.ingredientId === ingredientId
    && e.status === 'confirmed'
    && (!recipeVersionId || e.recipeVersionIds === null || e.recipeVersionIds.includes(recipeVersionId)));
  return hits.length ? hits[hits.length - 1] : null;
}

export function anatomyForDish(store, dishId) {
  return normalizeAnatomy(store).entries.filter(e => e.dishId === dishId);
}

// Which lines in a dish have no anatomy yet. The point of this is that the gap
// is VISIBLE: an ingredient nobody has explained looks identical to one that
// needs no explanation unless something says so.
export function anatomyCoverage(store, dishId, ingredientIds) {
  const have = new Set(anatomyForDish(store, dishId)
    .filter(e => e.status === 'confirmed')
    .map(e => e.ingredientId));
  const missing = (ingredientIds || []).filter(id => !have.has(id));
  return { total: (ingredientIds || []).length, covered: have.size, missing };
}

// The question an accommodation actually asks. Returns null when there is no
// confirmed anatomy, and null means UNKNOWN — never "safe to remove".
export function removalConsequence(store, dishId, ingredientId, recipeVersionId) {
  const e = anatomyFor(store, dishId, ingredientId, recipeVersionId);
  if (!e || !e.criticality) return null;
  return {
    criticality: e.criticality,
    label: CRITICALITY_LABELS[e.criticality],
    // Only garnish is removable without a decision. Everything else, including
    // an entry with no ifOmitted text, routes to Kevin: silence about the
    // consequence is not evidence that there is not one.
    removableOnRequest: e.criticality === 'garnish',
    ifOmitted: e.ifOmitted || '',
  };
}

export function anatomyCounts(store) {
  const e = normalizeAnatomy(store).entries;
  return {
    total: e.length,
    confirmed: e.filter(x => x.status === 'confirmed').length,
    proposed: e.filter(x => x.status === 'proposed').length,
    dishes: new Set(e.map(x => x.dishId)).size,
  };
}
