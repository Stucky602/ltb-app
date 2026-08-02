// clarifications.js — "I cannot follow this," recorded against the exact record.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THE FUTURE READER TEST IS
//
// Everything in this app is written by the person who already knows the answer.
// That is the failure mode of every archive: it is complete to its author and
// full of holes to everyone else, and the holes are invisible from the inside
// because the missing context is supplied automatically by the writer's own
// memory.
//
// So there is a cheap way to mark a record as unclear, from wherever it is
// being read, without editing it. Kevin can use it on his own writing when he
// rereads something cold. Rowan can use it later, on the same records, which is
// what turns succession from a content-entry project into an access problem —
// the gaps get found by the person who actually has them.
//
// ═══════════════════════════════════════════════════════════════════════════
// IT NEVER EDITS CANON
//
// A flag creates a linked record and changes nothing about the thing it points
// at. The original stays exactly as written, because it was an accurate record
// of what its author knew at the time, and the note that it is hard to follow
// is a SECOND fact rather than a correction of the first. Same append-only rule
// as contradictions and label versions.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE REASONS ARE FIXED, AND THAT IS WHY IT GETS USED
//
// Six buttons, no free text required. "This is confusing" is a feeling and
// produces nothing actionable; "I cannot tell which version this applies to" is
// a specific defect with a specific fix. The fixed list is also what makes the
// queue skimmable — Kevin can answer all the version-scope ones in a sitting.

export const CLARIFICATIONS_VERSION = 1;

export const READER_REASONS = [
  { id: 'meaning', label: 'I do not know what this means' },
  { id: 'lookFor', label: 'I cannot tell what to look for' },
  { id: 'assumes', label: 'This assumes equipment or knowledge I do not have' },
  { id: 'version', label: 'I cannot tell which version this applies to' },
  { id: 'contradicts', label: 'This seems to contradict something else' },
  { id: 'why', label: 'I understand the instruction but not the decision' },
];

export const READER_REASON_IDS = READER_REASONS.map(r => r.id);

export const CLARIFICATION_STATUSES = ['open', 'answered', 'wontFix'];

export function emptyClarifications() {
  return { version: CLARIFICATIONS_VERSION, items: [] };
}

const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');

export function normalizeClarifications(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) return emptyClarifications();
  const seen = new Set();
  const items = [];
  for (const c of raw.items) {
    if (!c || typeof c !== 'object' || !c.id || seen.has(c.id)) continue;
    if (!READER_REASON_IDS.includes(c.reason)) continue; // an unknown reason is not actionable
    if (!c.recordId) continue;                            // a flag pointing nowhere is not a flag
    seen.add(c.id);
    items.push({
      id: String(c.id),
      // What was flagged. A corpus record id, so the queue can link straight
      // back rather than duplicating the text it is about.
      recordId: str(c.recordId, 200),
      recordTitle: str(c.recordTitle, 300),
      reason: c.reason,
      note: str(c.note, 2000),
      // Who could not follow it. Kevin rereading his own work cold and Rowan
      // reading it in fifteen years are different signals and the queue should
      // not blur them.
      reader: c.reader === 'rowan' ? 'rowan' : 'kevin',
      raisedAt: typeof c.raisedAt === 'number' ? c.raisedAt : Date.now(),
      resolution: str(c.resolution),
      resolvedAt: typeof c.resolvedAt === 'number' ? c.resolvedAt : null,
      status: CLARIFICATION_STATUSES.includes(c.status) ? c.status : 'open',
    });
  }
  return { version: CLARIFICATIONS_VERSION, items };
}

export function flagRecord(store, { recordId, recordTitle, reason, note, reader }, now = Date.now()) {
  const s = normalizeClarifications(store);
  if (!recordId || !READER_REASON_IDS.includes(reason)) return s;
  const id = `cl_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const next = normalizeClarifications({
    items: [{ id, recordId, recordTitle, reason, note, reader, raisedAt: now, status: 'open' }],
  }).items[0];
  return { ...s, items: [next, ...s.items] };
}

// Answering records the answer HERE and leaves the flagged record alone. If
// Kevin also wants to improve the original, that is a separate, deliberate edit
// in the place that record lives — not a side effect of clearing a queue.
export function resolveClarification(store, id, resolution, now = Date.now()) {
  const s = normalizeClarifications(store);
  const text = str(resolution).trim();
  if (!text) return s;
  return {
    ...s,
    items: s.items.map(c => (c.id === id
      ? { ...c, resolution: text, resolvedAt: now, status: 'answered' }
      : c)),
  };
}

// "This is fine as it is" is a legitimate answer and is recorded rather than
// deleted, so the same record does not get flagged and re-argued every year.
export function dismissClarification(store, id, why, now = Date.now()) {
  const s = normalizeClarifications(store);
  return {
    ...s,
    items: s.items.map(c => (c.id === id
      ? { ...c, resolution: str(why), resolvedAt: now, status: 'wontFix' }
      : c)),
  };
}

export const openClarifications = (store) =>
  normalizeClarifications(store).items.filter(c => c.status === 'open');

export function clarificationsFor(store, recordId) {
  return normalizeClarifications(store).items.filter(c => c.recordId === recordId);
}

// Grouped by reason, because that is how they get answered efficiently: every
// "which version does this apply to" is the same job done six times.
export function clarificationsByReason(store) {
  const open = openClarifications(store);
  return READER_REASONS
    .map(r => ({ ...r, items: open.filter(c => c.reason === r.id) }))
    .filter(g => g.items.length > 0);
}

export function clarificationCounts(store) {
  const i = normalizeClarifications(store).items;
  return {
    total: i.length,
    open: i.filter(x => x.status === 'open').length,
    answered: i.filter(x => x.status === 'answered').length,
    fromRowan: i.filter(x => x.reader === 'rowan').length,
  };
}
