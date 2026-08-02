// notesForRowan.js — Kevin speaking directly to Rowan.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT MAKES THIS DIFFERENT FROM EVERYTHING ELSE IN THE ROWAN TAB
//
//   Voice capsules      — Rowan reacting to a meal
//   Question capsules   — Rowan asking, Kevin answering
//   Practice library    — how the kitchen is run, addressed to nobody
//   Chronicle           — the record of a service week
//
// A note here is none of those. It is Kevin turning toward his son and saying
// something on purpose. The distinction is worth keeping structural rather than
// letting these blur into the journal, because in twenty years the question
// "what did he actually want to tell me" has to be answerable without reading
// everything else first.
//
// ═══════════════════════════════════════════════════════════════════════════
// INTENTIONALLY SIMPLE, AND THAT IS THE SPEC
//
// Kevin's own words on this feature: it should remain intentionally simple.
// Text, audio, photo, short video. No categories, no prompts, no completion
// meter, no "you haven't written one in a while".
//
// NOT GENERATED, NOT REWRITTEN, NOT DELAYED BY ARTIFICIAL MILESTONES. There is
// deliberately no summariser, no tidy-up pass, and no "unlock at 18" gate. A
// note is his words, available from the moment he writes it. Anything that
// improves the prose here would be replacing the one thing that makes it worth
// keeping.
//
// The link is optional on purpose. Some things are about a dish; some are just
// things he wanted to say.

export const NOTES_VERSION = 1;

// What a note can hang off. All of these already exist as records, so a note
// links rather than copies — the dish can change, and the note still points at
// it rather than at a stale description of it.
export const NOTE_SUBJECTS = [
  { id: 'dish', label: 'A dish' },
  { id: 'ingredient', label: 'An ingredient' },
  { id: 'practice', label: 'A practice' },
  { id: 'term', label: 'A term' },
  { id: 'week', label: 'A service week' },
  { id: 'memory', label: 'A family memory' },
  { id: 'decision', label: 'A decision' },
  { id: 'none', label: 'Nothing in particular' },
];

export const NOTE_SUBJECT_IDS = NOTE_SUBJECTS.map(s => s.id);

export function emptyNotes() {
  return { version: NOTES_VERSION, notes: [] };
}

const str = (v, max = 20000) => (typeof v === 'string' ? v.slice(0, max) : '');

// Media rides the existing R2 path by key, exactly like the voice capsules and
// the visual cues. Bytes never enter this store.
function cleanMedia(m) {
  if (!m || typeof m !== 'object' || !m.mediaKey) return null;
  const kind = ['audio', 'photo', 'video'].includes(m.kind) ? m.kind : null;
  if (!kind) return null;
  return {
    kind,
    mediaKey: str(m.mediaKey, 200),
    contentType: str(m.contentType, 60),
    seconds: Math.max(0, Math.round(Number(m.seconds) || 0)),
    bytes: Math.max(0, Math.round(Number(m.bytes) || 0)),
    checksum: str(m.checksum, 80),
  };
}

export function normalizeNotes(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.notes)) return emptyNotes();
  const seen = new Set();
  const notes = [];
  for (const n of raw.notes) {
    if (!n || typeof n !== 'object' || !n.id || seen.has(n.id)) continue;
    seen.add(n.id);
    const text = str(n.text);
    const media = Array.isArray(n.media) ? n.media.map(cleanMedia).filter(Boolean).slice(0, 6) : [];
    // A note with neither words nor media is a mis-tap.
    if (!text.trim() && !media.length) continue;
    notes.push({
      id: String(n.id),
      text,
      media,
      subjectKind: NOTE_SUBJECT_IDS.includes(n.subjectKind) ? n.subjectKind : 'none',
      subjectId: str(n.subjectId, 200),
      subjectLabel: str(n.subjectLabel, 200),
      // WRITTEN AT, and nothing else. No edited-at, no version history: a note
      // is a moment, and tracking revisions to it would invite treating it as a
      // draft to be polished rather than a thing that was said.
      at: typeof n.at === 'number' ? n.at : Date.now(),
      ageMonths: Number.isFinite(n.ageMonths) ? n.ageMonths : null,
    });
  }
  return { version: NOTES_VERSION, notes };
}

export function addNote(store, partial, now = Date.now()) {
  const s = normalizeNotes(store);
  const id = (partial && partial.id) || `nr_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  if (s.notes.some(n => n.id === id)) return s;
  const built = normalizeNotes({ notes: [{ ...partial, id, at: (partial && partial.at) || now }] }).notes[0];
  if (!built) return s;
  return { ...s, notes: [built, ...s.notes] };
}

export function attachMedia(store, id, media) {
  const s = normalizeNotes(store);
  const m = cleanMedia(media);
  if (!m) return s;
  return {
    ...s,
    notes: s.notes.map(n => (n.id === id ? { ...n, media: [...n.media, m].slice(0, 6) } : n)),
  };
}

// DELETION IS ALLOWED HERE, unlike most stores in this app.
//
// Elsewhere the rule is that records are marked rather than erased, because the
// history of a decision is itself worth keeping. This is different: a note is a
// private message to his son, and if Kevin decides he does not want to have
// said something, an app that preserves it anyway has overruled him about his
// own words to his own child.
export function removeNote(store, id) {
  const s = normalizeNotes(store);
  return { ...s, notes: s.notes.filter(n => n.id !== id) };
}

// Oldest first, which is how it will eventually be read.
export function notesTimeline(store) {
  return [...normalizeNotes(store).notes].sort((a, b) => a.at - b.at);
}

export function notesAbout(store, subjectKind, subjectId) {
  return normalizeNotes(store).notes.filter(n =>
    n.subjectKind === subjectKind && (!subjectId || n.subjectId === subjectId));
}

export function noteCounts(store) {
  const n = normalizeNotes(store).notes;
  return {
    total: n.length,
    withMedia: n.filter(x => x.media.length).length,
    linked: n.filter(x => x.subjectKind !== 'none').length,
  };
}
