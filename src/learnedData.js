// learnedData.js — reads the alias map for human review. Pure module.
//
// WHY THIS EXISTS
//
// The scanner learns constantly and silently: which ingredient a receipt string
// means, how many units are in a pack, which store an item habitually comes
// from, which items to stop asking about. All of it is permanent and none of it
// was inspectable. One wrong learned alias mismaps that receipt line forever,
// invisibly, and there was no path to find it, let alone fix it.
//
// That gets worse with time, not better, which is the shape of a problem worth
// building a window for. The audit log already answers "what changed this
// number?" for a single cost. It cannot answer "what does the app now BELIEVE?"
// — beliefs aren't events, and the log only records events.
//
// DESIGN
//
// This module is pure and does the reading; the panel does the rendering. That
// split matters here more than usual: "what did it learn" is a question about
// data, and answering it in a component means the answer can only ever be
// looked at, never tested.
//
// Deletion is the important operation. Everything else — remapping, editing a
// pack size — Kevin can already do by scanning another receipt. Only deletion
// escapes a bad learn, and only deletion was impossible.

// How a mapping came to exist. Ordered by how much Kevin should trust it.
export const ORIGIN = {
  SEEDED: 'seeded',       // shipped in the alias table, hand-written
  LEARNED: 'learned',     // the app inferred it from accepted scans
  IGNORED: 'ignored',     // told (or learned) to skip this line forever
};

// A seeded alias is a bare { ingredientId } with no learning counters on it.
// Anything the app taught itself carries evidence of the teaching: confirms,
// packObs, storeSeen, eachHits, seenUnmatched. That distinction matters because
// deleting a seeded alias loses a hand-written fact, while deleting a learned
// one just makes the app ask again.
const LEARNED_MARKERS = ['confirms', 'packObs', 'storeSeen', 'eachHits', 'seenUnmatched', 'packLastImplied', 'rejected'];

export function originOf(alias) {
  if (!alias) return null;
  if (alias.action === 'IGNORE_ALWAYS') return ORIGIN.IGNORED;
  if (!alias.ingredientId && (alias.seenUnmatched || 0) >= 3) return ORIGIN.IGNORED;
  const taught = LEARNED_MARKERS.some(k => alias[k] != null);
  return taught ? ORIGIN.LEARNED : ORIGIN.SEEDED;
}

// The habitual store, or null. Duplicated deliberately rather than imported
// from receiptMatch.js: that module is the scanner's engine and this one is a
// read-only view of its output. A one-line agreement is cheaper than a
// dependency that invites the view to start calling into the engine.
function habitualStoreOf(alias) {
  const seen = alias && alias.storeSeen;
  if (!seen) return null;
  const entries = Object.entries(seen).sort((a, b) => b[1] - a[1]);
  if (!entries.length || entries[0][1] < 2) return null;
  if (entries[1] && entries[1][1] === entries[0][1]) return null; // tie: not habitual
  return entries[0][0];
}

// One row per learned receipt string. `ingredients` is the live DB, used only
// to turn an id into a name Kevin recognizes.
//
// Returns rows sorted so the ones most likely to be WRONG float up: unmapped
// ignores first (the app decided to stop asking), then learned, then seeded.
// A review screen sorted alphabetically is a screen that hides its own bugs.
export function summarizeLearnedData(aliases, ingredients) {
  const byId = new Map((ingredients || []).map(i => [i.id, i]));
  const rows = [];

  for (const [norm, alias] of Object.entries(aliases || {})) {
    if (!alias || typeof alias !== 'object') continue;
    const origin = originOf(alias);
    const ing = alias.ingredientId ? byId.get(alias.ingredientId) : null;

    rows.push({
      norm,
      origin,
      ingredientId: alias.ingredientId || null,
      // A mapping to an id that no longer exists is a silent $0: the cost map
      // is built from the seed, so the line resolves to nothing. Surfacing it
      // here is cheaper than finding it in a margin six weeks later.
      ingredientName: ing ? ing.name : (alias.ingredientId ? `${alias.ingredientId} (NOT IN DB)` : null),
      orphaned: !!alias.ingredientId && !ing,
      unit: ing ? ing.unit : null,
      packQty: typeof alias.packQty === 'number' ? alias.packQty : null,
      packObs: alias.packObs || 0,
      confirms: alias.confirms || 0,
      soldByEach: !!alias.soldByEach,
      pricing: alias.pricing || null,
      rejected: Array.isArray(alias.rejected) ? alias.rejected : [],
      storeSeen: alias.storeSeen || null,
      habitualStore: habitualStoreOf(alias),
      seenUnmatched: alias.seenUnmatched || 0,
      ignored: origin === ORIGIN.IGNORED,
    });
  }

  const rank = { [ORIGIN.IGNORED]: 0, [ORIGIN.LEARNED]: 1, [ORIGIN.SEEDED]: 2 };
  rows.sort((a, b) => {
    // Orphans first of all: they are actively costing something wrong.
    if (a.orphaned !== b.orphaned) return a.orphaned ? -1 : 1;
    const r = (rank[a.origin] ?? 3) - (rank[b.origin] ?? 3);
    if (r !== 0) return r;
    return a.norm.localeCompare(b.norm);
  });

  return rows;
}

// Counts for the panel header, so Kevin can see the shape without reading 200
// rows. `orphaned` is the one worth acting on.
export function learnedDataStats(rows) {
  return {
    total: rows.length,
    learned: rows.filter(r => r.origin === ORIGIN.LEARNED).length,
    seeded: rows.filter(r => r.origin === ORIGIN.SEEDED).length,
    ignored: rows.filter(r => r.ignored).length,
    withPackQty: rows.filter(r => r.packQty != null).length,
    orphaned: rows.filter(r => r.orphaned).length,
  };
}

// Delete one learned entry. Returns a NEW map; never mutates.
//
// This is the whole point of the panel. A bad learn is otherwise permanent:
// nothing in the scan flow removes an alias, it only refines one, and refining
// a mapping that points at the wrong ingredient just makes it more confidently
// wrong. Deleting makes the app ask again, which is the correct behaviour for
// something it got wrong.
export function deleteLearnedEntry(aliases, norm) {
  const out = { ...(aliases || {}) };
  delete out[norm];
  return out;
}

// Remap an entry to a different ingredient, keeping the learned counters.
//
// packQty is DROPPED on remap, deliberately and non-obviously: it means "this
// many costing units per package," and the costing unit belongs to the OLD
// ingredient. A pack of 15 sprigs remapped to olive oil is not 15 anything.
// Keeping it would be the unit-change bug all over again, one layer up.
export function remapLearnedEntry(aliases, norm, ingredientId) {
  const prev = (aliases || {})[norm];
  if (!prev) return aliases || {};
  const next = { ...prev, ingredientId };
  delete next.packQty;
  delete next.packObs;
  delete next.packLastImplied;
  // A remap is Kevin overruling the app, so the old confidence is void: the
  // confirm count exists to auto-promote a mapping, and inheriting it would
  // auto-promote the correction without a single confirmation behind it.
  next.confirms = 0;
  delete next.action; // an explicit remap un-ignores the line
  return { ...(aliases || {}), [norm]: next };
}
