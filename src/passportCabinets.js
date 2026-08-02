// passportCabinets.js — a household arranging its own passport stamps.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE HOUSEHOLD NAMES THE CABINET
//
// "Meals we serve guests". "Everyone agrees". "Best busy-night dinners". "Save
// for cold weather".
//
// Not chosen from a list. An earlier version of this had a fixed set of
// occasions I had written — "the night nobody wants to cook" and so on — and it
// was worse for a reason worth stating: a fixed list makes every household
// describe their food in my words. "Everyone agrees" is a thing a family knows
// about itself and no menu designer could have guessed.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS SURVIVED WHERE TWO NEIGHBOURS DID NOT
//
//   Passport Story Doors — rejected. Inferred narrative relationships go
//   inaccurate or over-generated unless hand-curated. Nothing here is inferred.
//
//   Household Superlatives — rejected. A superlative crowns ONE winner, which
//   is a leaderboard with better manners. A cabinet holds as many dishes as the
//   household wants, so several dishes can occupy a meaningful role at once.
//
// It also has to stay clear of the thing it most resembles from the outside: a
// loyalty program. The difference is who sets the goal. A checklist is Kevin's
// idea of what a household should try; a cabinet is the household's own idea of
// what its food is for. So there is no completion state, no progress, no
// suggested next dish, and no cabinet anybody but the household invented.
//
// ═══════════════════════════════════════════════════════════════════════════
// LTB MAY PROPOSE. IT MAY NEVER FILE.
//
// Kevin's rule, and the one thing here that needs enforcing rather than
// documenting. A proposal is allowed to say "you have ordered these three on a
// weeknight five times — a cabinet?" and it must sit there until somebody
// accepts it. `proposeCabinet` creates a record with `status: 'proposed'` and
// an empty accepted list; nothing reads a proposed cabinet as belonging to the
// household until they say so.
//
// A stamp only enters a cabinet through `fileDish`, which refuses to touch a
// proposed one. That is asserted by test, because the failure would be silent
// and would feel like the app deciding what their food means.

export const CABINETS_VERSION = 1;

export function emptyCabinets() {
  return { version: CABINETS_VERSION, cabinets: [] };
}

const str = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');

export function normalizeCabinets(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.cabinets)) return emptyCabinets();
  const seen = new Set();
  const cabinets = [];
  for (const c of raw.cabinets) {
    if (!c || typeof c !== 'object' || !c.id || seen.has(c.id)) continue;
    const name = str(c.name).trim();
    if (!name) continue; // an unnamed cabinet is not a cabinet
    seen.add(c.id);
    // ORDER IS PRESERVED AS GIVEN. Households reorder, and the order they chose
    // is part of what they made. Nothing sorts this alphabetically.
    const dishes = Array.isArray(c.dishes)
      ? [...new Set(c.dishes.filter(d => typeof d === 'string' && d.trim()).map(d => str(d)))]
      : [];
    cabinets.push({
      id: String(c.id),
      householdId: str(c.householdId, 120),
      name,
      dishes,
      status: c.status === 'proposed' ? 'proposed' : 'kept',
      // Only set on a proposal: why LTB thought this might be a cabinet. Shown
      // to the household so they can disagree with the reasoning, not just the
      // conclusion.
      because: str(c.because, 500),
      at: typeof c.at === 'number' ? c.at : Date.now(),
      order: Number.isFinite(c.order) ? c.order : 0,
    });
  }
  return { version: CABINETS_VERSION, cabinets };
}

export function createCabinet(store, householdId, name, now = Date.now()) {
  const s = normalizeCabinets(store);
  const clean = str(name).trim();
  if (!clean) return s;
  const id = `cab_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const order = s.cabinets.filter(c => c.householdId === householdId).length;
  const built = normalizeCabinets({
    cabinets: [{ id, householdId, name: clean, dishes: [], status: 'kept', at: now, order }],
  }).cabinets[0];
  return { ...s, cabinets: [...s.cabinets, built] };
}

export function renameCabinet(store, id, name) {
  const s = normalizeCabinets(store);
  const clean = str(name).trim();
  if (!clean) return s;
  return { ...s, cabinets: s.cabinets.map(c => (c.id === id ? { ...c, name: clean } : c)) };
}

export function deleteCabinet(store, id) {
  const s = normalizeCabinets(store);
  return { ...s, cabinets: s.cabinets.filter(c => c.id !== id) };
}

// Reorder by explicit id list. Anything the caller forgot keeps its place at
// the end rather than vanishing.
export function reorderCabinets(store, householdId, idsInOrder) {
  const s = normalizeCabinets(store);
  // `position`, not `rank` — this is the order the household dragged them
  // into, not a judgement about which cabinet is better.
  const position = new Map((idsInOrder || []).map((id, i) => [id, i]));
  return {
    ...s,
    cabinets: s.cabinets.map(c => (c.householdId === householdId && position.has(c.id)
      ? { ...c, order: position.get(c.id) }
      : c)),
  };
}

// ── The rule ────────────────────────────────────────────────────────────────

// A PROPOSAL. Status `proposed`, and it stays inert until accepted.
export function proposeCabinet(store, householdId, name, because, dishes = [], now = Date.now()) {
  const s = normalizeCabinets(store);
  const clean = str(name).trim();
  if (!clean) return s;
  const id = `cab_p_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const built = normalizeCabinets({
    cabinets: [{ id, householdId, name: clean, dishes, because: str(because, 500), status: 'proposed', at: now }],
  }).cabinets[0];
  return { ...s, cabinets: [...s.cabinets, built] };
}

export function acceptProposal(store, id) {
  const s = normalizeCabinets(store);
  return { ...s, cabinets: s.cabinets.map(c => (c.id === id ? { ...c, status: 'kept', because: '' } : c)) };
}

export const declineProposal = deleteCabinet;

// FILING REFUSES A PROPOSED CABINET. See the header: a dish entering a
// household's cabinet without them accepting it is the app deciding what their
// food means to them.
export function fileDish(store, cabinetId, dishName) {
  const s = normalizeCabinets(store);
  const dish = str(dishName).trim();
  if (!dish) return s;
  return {
    ...s,
    cabinets: s.cabinets.map(c => {
      if (c.id !== cabinetId || c.status === 'proposed') return c;
      return c.dishes.includes(dish) ? c : { ...c, dishes: [...c.dishes, dish] };
    }),
  };
}

export function unfileDish(store, cabinetId, dishName) {
  const s = normalizeCabinets(store);
  return {
    ...s,
    cabinets: s.cabinets.map(c => (c.id === cabinetId
      ? { ...c, dishes: c.dishes.filter(d => d !== dishName) }
      : c)),
  };
}

// ── Reading ─────────────────────────────────────────────────────────────────

export function cabinetsFor(store, householdId) {
  return normalizeCabinets(store).cabinets
    .filter(c => c.householdId === householdId && c.status === 'kept')
    .sort((a, b) => a.order - b.order);
}

export function proposalsFor(store, householdId) {
  return normalizeCabinets(store).cabinets.filter(c => c.householdId === householdId && c.status === 'proposed');
}

// "This is in your Meals we serve guests cabinet." Proposed cabinets are
// excluded — a household should never be told a dish is in something they have
// not agreed to.
export function cabinetsHolding(store, householdId, dishName) {
  const dish = String(dishName || '').trim().toLowerCase();
  return cabinetsFor(store, householdId).filter(c => c.dishes.some(d => d.toLowerCase() === dish));
}

// For the order form: which dishes sit in a chosen cabinet.
export function dishesIn(store, cabinetId) {
  const c = normalizeCabinets(store).cabinets.find(x => x.id === cabinetId && x.status === 'kept');
  return c ? [...c.dishes] : [];
}

// ── THIS WEEK, FROM THEIR OWN CABINETS ──────────────────────────────────────
//
// "Bolognese and Gumbo are on the menu this week. They are both in your Best
// busy-night dinners."
//
// I had originally ruled this out under the no-suggested-next-dish rule, and
// that was too broad. Kevin pushed back and the distinction is worth keeping
// explicit, because the two things look similar and are not:
//
//   RECALL — naming a dish THEY filed, which happens to be available now. The
//   household already said this dish is for busy nights; the only new fact is
//   that it is on the menu. Nothing is guessed.
//
//   RECOMMENDATION — "you might like Rendang". That is inferred taste, and it
//   is the exact thing Passport Story Doors was rejected for: inferred
//   relationships over-generate and go wrong.
//
// This is the first. It cannot surface a dish the household never filed, so
// there is nothing for it to be wrong about — the worst case is that it stays
// silent, which is also what it does for a household with no cabinets.
//
// It is also what the spec asked for when it said cabinets could become filters
// during ordering, so it belongs here rather than in a recommender.
//
// NO COMPLETION FRAMING. It never says how many of a cabinet are available, how
// many are left to try, or that anything is missing. A cabinet is not a set to
// finish.
export function thisWeekFromCabinets(store, householdId, weekDishNames) {
  const week = new Set((weekDishNames || [])
    .filter(n => typeof n === 'string')
    .map(n => n.trim().toLowerCase()));
  if (!week.size) return [];
  return cabinetsFor(store, householdId)
    .map(c => ({
      cabinetId: c.id,
      cabinetName: c.name,
      // Their order, not ours, and only what is actually available.
      dishes: c.dishes.filter(d => week.has(d.trim().toLowerCase())),
    }))
    .filter(x => x.dishes.length > 0);
}

// The single line for a dish a household is looking at right now. Returns null
// rather than a cheerful nothing when the dish is in no cabinet of theirs.
export function cabinetLineFor(store, householdId, dishName) {
  const held = cabinetsHolding(store, householdId, dishName);
  if (!held.length) return null;
  const names = held.map(c => c.name);
  const list = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `This is in your ${list} ${names.length === 1 ? 'cabinet' : 'cabinets'}.`;
}

export function cabinetCounts(store) {
  const c = normalizeCabinets(store).cabinets;
  return {
    total: c.filter(x => x.status === 'kept').length,
    proposed: c.filter(x => x.status === 'proposed').length,
    filed: c.filter(x => x.status === 'kept').reduce((n, x) => n + x.dishes.length, 0),
  };
}
