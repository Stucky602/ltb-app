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
  'flavor',      // the dish tastes wrong without it, but nothing structural fails
  'structural',  // important but substitutable within recorded limits
  'seasoning',   // adjustable to taste
  'garnish',     // removable on request with no consequence
];

export const CRITICALITY_LABELS = {
  identity: 'Identity-defining',
  technique: 'Technique-critical',
  flavor: 'Flavor critical',
  structural: 'Structurally important',
  seasoning: 'Seasoning',
  garnish: 'Removable garnish',
};

// `flavor` IS A SIXTH TIER, ADDED FROM KEVIN'S OWN ANSWERS (Aug 2 walk).
//
// He used it unprompted on 4 of 10 Bolognese lines and 2 on the curry — the red
// wine, the tomato paste, the soffritto, the garlic. It is his most-used tier
// and the original five had no room for it: those lines are not identity, not
// technique, and calling them seasoning would say they are adjustable to taste.
//
// The five were missing their middle. Squashing his answers into the existing
// buckets would have lost the distinction he was actually drawing.

// SUBSTITUTABILITY IS A SEPARATE FIELD, NOT DERIVED FROM THE TIER.
//
// The workbench was going to infer removability from criticality. It cannot, and
// two of Kevin's own answers prove it:
//
//   * The butter on the Indian curry is IDENTITY-DEFINING and still swappable —
//     "I can sub this out if I need to do a vegan version, it just won't be as
//     good."
//   * Brown sugar is FLAVOR CRITICAL and the product is arbitrary — "it doesn't
//     have to be brown sugar per se, but often it needs some sweetness."
//
// Criticality answers "how much does the dish depend on it". Substitutability
// answers "can something else do its job". Inferring either from the other would
// have marked the butter untouchable and the sugar fixed, and both are wrong.
export const SUBSTITUTABILITY = [
  'fixed',        // this exact product, nothing else does the job
  'swappable',    // a named alternative works, recorded in `substitutes`
  'role',         // the LINE names a product but the requirement is a property
  'linked',       // not an independent choice; it swaps with another line
];

export const SUBSTITUTABILITY_LABELS = {
  fixed: 'This exact ingredient',
  swappable: 'A recorded alternative works',
  role: 'The role matters, not the product',
  linked: 'Follows another line',
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
      // INDEPENDENT OF CRITICALITY — see the note beside SUBSTITUTABILITY.
      // Null means unrecorded, which is not the same as 'fixed'.
      substitutability: SUBSTITUTABILITY.includes(e.substitutability) ? e.substitutability : null,
      // What a `role` line actually requires, in his words: "sweetness to
      // balance it out" rather than "brown sugar". Only meaningful on `role`.
      role: str(e.role, 400),
      // The line this one follows when substitutability is `linked`. The curry's
      // stock swaps with the protein and needs no ruling of its own.
      linkedTo: str(e.linkedTo, 200),
      // AN UPGRADE IS NOT A BASE LINE. Egg pappardelle: "It's an upgrade, not a
      // base line." Without this, declining an upgrade reads as a recipe
      // modification and the upgrade gets scored as part of the base dish.
      upgrade: e.upgrade === true,
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
    // REPORTED SEPARATELY, never folded into removability. A line can be
    // identity-defining and still swappable (the curry's butter), so a caller
    // asking "can this come out" and a caller asking "can something else do its
    // job" get different answers to different questions.
    substitutability: e.substitutability || null,
    substitutabilityLabel: e.substitutability ? SUBSTITUTABILITY_LABELS[e.substitutability] : null,
    role: e.role || '',
    linkedTo: e.linkedTo || '',
    // The named alternatives travel with the consequence. Without them the
    // packet can say a swap exists and not say what it is, which sends Kevin
    // back to the anatomy to look up something the app already had.
    substitutions: e.substitutions || [],
    // And the ones he ruled OUT, which matter more — an alternative he already
    // rejected must not be re-proposed as if it were open.
    nonSubstitutions: e.nonSubstitutions || [],
    // An upgrade declined is not an accommodation at all.
    upgrade: e.upgrade === true,
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
