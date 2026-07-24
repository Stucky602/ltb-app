// listControls.js — the ONE list-mechanics helper behind V1, V2, V3, and V5.
// Pure, UI-free, no dependencies on utils.js so it stays trivially testable
// and reusable anywhere a list grows past a glance (orders now; regulars,
// feedback, or anything else later share this instead of reinventing it).
//
// Nothing here mutates its input. Every function returns a NEW array/shape.

// ── V1: sort ────────────────────────────────────────────────────────────────
// field: 'newest' | 'oldest' | 'name' | 'unpaidFirst' | 'status'
// getters let callers adapt the same sorter to orders, regulars, anything
// with a date/name/paid/status-shaped record, without this file knowing the
// real field names on either.
export function sortList(list, field, getters = {}) {
  const g = {
    date: (x) => Date.parse(x && x.createdAt) || 0,
    name: (x) => String((x && (x.customer ?? x.name)) || '').toLowerCase(),
    paid: (x) => !!(x && x.paid),
    status: (x) => String((x && x.status) || ''),
    ...getters,
  };
  const arr = [...(list || [])];
  switch (field) {
    case 'oldest': return arr.sort((a, b) => g.date(a) - g.date(b));
    case 'name': return arr.sort((a, b) => g.name(a).localeCompare(g.name(b)));
    case 'unpaidFirst': return arr.sort((a, b) => (g.paid(a) ? 1 : 0) - (g.paid(b) ? 1 : 0) || g.date(b) - g.date(a));
    case 'status': return arr.sort((a, b) => g.status(a).localeCompare(g.status(b)) || g.date(b) - g.date(a));
    case 'newest':
    default: return arr.sort((a, b) => g.date(b) - g.date(a));
  }
}

// ── V1: status filter ───────────────────────────────────────────────────────
// status === null/'' means "all" — the common case, and callers should not
// have to special-case it themselves.
export function filterByStatus(list, status, getStatus = (x) => x && x.status) {
  if (!status) return list || [];
  return (list || []).filter(x => getStatus(x) === status);
}

// ── V2: search ───────────────────────────────────────────────────────────────
// haystacks(item) → array of strings to match against. Case-insensitive,
// substring match — no fuzzy scoring, this is a filter box, not a search
// engine. An empty/whitespace query returns the list untouched.
export function searchList(list, query, haystacks) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return list || [];
  return (list || []).filter(item =>
    (haystacks(item) || []).some(h => String(h || '').toLowerCase().includes(q)));
}

export function orderHaystacks(order) {
  return [
    order && order.customer,
    order && order.notes,
    ...((order && order.items) || []).flatMap(it => [it && it.name, it && it.variant, it && it.note]),
  ];
}

// regularAllNames is imported by the CALLER (it lives in utils.js and is
// alias-aware); this file stays dependency-free, so it takes the resolved
// name list rather than the regular object.
export function regularHaystacks(namesForRegular) {
  return namesForRegular || [];
}

// ── V3: windowing ───────────────────────────────────────────────────────────
// Renders the latest `limit` items with a "show older" affordance instead of
// rendering every row forever. Returns enough for a caller to render both the
// visible slice and a count of what's hidden — never silently drops data,
// just defers rendering it.
export function windowList(list, limit) {
  const all = list || [];
  const shown = limit == null ? all : all.slice(0, limit);
  return { shown, total: all.length, hiddenCount: Math.max(0, all.length - shown.length) };
}

export const DEFAULT_WINDOW = 50;
