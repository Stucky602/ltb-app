// householdMemories.js — what a dish means to the family that ate it.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS IS NOT THE THING THAT GOT REJECTED
//
// Passport Story Doors was declined on Aug 2 because inferred narrative
// relationships go inaccurate or over-generated unless hand-curated, and the
// maintenance outweighs the benefit.
//
// This is the inverse. Nothing is inferred, derived, suggested, or generated.
// A household writes their own memory of a dish in their own words and picks
// when they would reach for it. There is nothing to over-generate because
// nothing is generated, and nothing to curate because it is already theirs.
//
// That difference is the whole design, and it is why this can exist while the
// other cannot.
//
// ═══════════════════════════════════════════════════════════════════════════
// TWO SEPARATE THINGS, DELIBERATELY
//
//   THE MEMORY — free text. "First thing we ate in the new house." Nobody
//   should have to fit that into a category, so there is no category for it.
//
//   THE OCCASION — a small fixed list: the night nobody wants to cook, feeding
//   a crowd, and so on. Fixed because this half is meant to be FILTERABLE, and
//   free text cannot be filtered without guessing what somebody meant.
//
// One is for reading years later. The other is for finding a dish on a Tuesday.
// Collapsing them into one field would ruin both.
//
// ═══════════════════════════════════════════════════════════════════════════
// IT IS THEIRS, SO IT IS PRIVATE BY DEFAULT
//
// A household's memory of a dinner is not menu copy. Kevin can read what is
// written about his own food — that is feedback, and it is the point — but
// nothing here reaches another customer without going through the derivative
// approval flow like any other private record.
//
// `shareWithKevin` defaults TRUE because there is no reason to write it
// otherwise; `sharePublicly` defaults FALSE and is a separate, explicit act.

export const MEMORIES_VERSION = 1;

// THE OCCASION LIST IS GONE, replaced by Passport Cabinets.
//
// This module used to carry a fixed set of occasions I had written — "the night
// nobody wants to cook", "feeding a crowd". Cabinets do that job better for one
// reason: the household names the cabinet itself. "Everyone agrees" is a thing
// a family knows about itself and no list of mine would have contained it.
//
// So this store is now purely the STORY half: what a dish means to them, in
// their words. Organizing which dishes belong together is `passportCabinets.js`.
// Two overlapping organizing systems would have been worse than either.

export function emptyMemories() {
  return { version: MEMORIES_VERSION, memories: [] };
}

const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');

export function normalizeMemories(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.memories)) return emptyMemories();
  const seen = new Set();
  const memories = [];
  for (const m of raw.memories) {
    if (!m || typeof m !== 'object' || !m.id || seen.has(m.id)) continue;
    if (!str(m.dishName, 200).trim()) continue;
    const text = str(m.text).trim();
    if (!text) continue; // a memory with no words is not a memory
    seen.add(m.id);
    memories.push({
      id: String(m.id),
      dishName: str(m.dishName, 200),
      dishId: str(m.dishId, 120),
      householdId: str(m.householdId, 120),
      text,
      at: typeof m.at === 'number' ? m.at : Date.now(),
      // See the header. Sharing with Kevin is the default; sharing with anyone
      // else is a separate decision and is never assumed.
      shareWithKevin: m.shareWithKevin !== false,
      sharePublicly: m.sharePublicly === true,
    });
  }
  return { version: MEMORIES_VERSION, memories };
}

export function addMemory(store, partial, now = Date.now()) {
  const s = normalizeMemories(store);
  const id = (partial && partial.id) || `hm_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  if (s.memories.some(m => m.id === id)) return s;
  const built = normalizeMemories({ memories: [{ ...partial, id, at: (partial && partial.at) || now }] }).memories[0];
  return built ? { ...s, memories: [built, ...s.memories] } : s;
}

// EDITING IS ALLOWED AND DELETION IS ALLOWED. Same rule as the notes to Rowan:
// these are somebody's own words about their own dinner, and an app that
// preserved them against their wishes would have overruled them about it.
export function updateMemory(store, id, patch) {
  const s = normalizeMemories(store);
  return {
    ...s,
    memories: s.memories.map(m => (m.id === id
      ? normalizeMemories({ memories: [{ ...m, ...patch, id: m.id }] }).memories[0] || m
      : m)),
  };
}

export function removeMemory(store, id) {
  const s = normalizeMemories(store);
  return { ...s, memories: s.memories.filter(m => m.id !== id) };
}

// ── Reading ─────────────────────────────────────────────────────────────────

export function memoriesForDish(store, dishName) {
  const key = String(dishName || '').trim().toLowerCase();
  return normalizeMemories(store).memories.filter(m => m.dishName.toLowerCase() === key);
}

export function memoriesForHousehold(store, householdId) {
  if (!householdId) return [];
  return normalizeMemories(store).memories
    .filter(m => m.householdId === householdId)
    .sort((a, b) => a.at - b.at);
}

// What Kevin may read: only what was shared with him.
//
// NOT A RANKING. It returns their words and how many households shared one, and
// stops there — no score, no "best for", no suggestion to promote a dish. Kevin
// reads it and decides.
export function dishMemorySummary(store, dishName) {
  const rows = memoriesForDish(store, dishName).filter(m => m.shareWithKevin);
  return {
    dishName,
    shared: rows.length,
    // Their words, only where they said Kevin could read them.
    notes: rows.filter(m => m.text).map(m => ({ id: m.id, text: m.text, at: m.at })),
  };
}

// NOTHING HERE IS PUBLISHABLE BY DEFAULT. A caller that wants to show one
// household's words to another customer has to ask for this explicitly, and
// even then it goes through the derivative approval flow like any other private
// record — this only narrows the set that is eligible to be asked about.
export function publiclyShareable(store) {
  return normalizeMemories(store).memories.filter(m => m.sharePublicly && m.text);
}

export function memoryCounts(store) {
  const m = normalizeMemories(store).memories;
  return {
    total: m.length,
    withText: m.filter(x => x.text).length,
    sharedPublicly: m.filter(x => x.sharePublicly).length,
  };
}
