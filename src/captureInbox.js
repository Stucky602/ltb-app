// captureInbox.js — get the thing into LTB first, decide what it is later.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE ONE RULE: SAVE BEFORE CLASSIFICATION
//
// Kevin captures one-handed, in a checkout line, on a phone. Every existing
// capture surface in this app asks a question first — which dish, which entry
// type, is this private — and a question asked before the artifact is safe is
// how the artifact gets lost. A screenshot he meant to keep is gone the moment
// he taps away from the share sheet to think about which dossier it belongs in.
//
// So nothing here asks anything. An item lands as `unsorted` with its raw
// payload intact, and classification is a separate act that happens later,
// preferably at a keyboard. That ordering is the entire feature and every other
// decision in this file follows from it.
//
// ═══════════════════════════════════════════════════════════════════════════
// RAW IS IMMUTABLE
//
// `raw` is what arrived. Filing DERIVES a record from it and links back; it
// never edits or replaces the original, and discarding never deletes it either
// (a discarded item is marked, not erased, because "I decided this was not
// worth keeping" is a different state from "this was never captured" and only
// one of them is recoverable from a mistake).
//
// A `proposal` may sit alongside raw. It is a deterministic guess — a URL looks
// like a source, text naming a dish probably belongs to that dish — and it is
// stored under its own key, marked as a guess, and NEVER merged into raw. Model
// or heuristic output is a prefill for Kevin to correct, never truth.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY BLOBS DO NOT LIVE HERE
//
// This store holds text and metadata only, and rides the backup. Images go to
// R2 through the existing authenticated /media/ route. An image that has not
// uploaded yet waits in a Cache API bucket, NOT in localStorage: the whole app
// runs in about five megabytes of localStorage, order photos already strain it,
// and one captured screenshot could take the storage-full banner from a warning
// to a wall. `media: 'pending'` on an item means the bytes are in that bucket
// and the upload has not landed.

export const CAPTURE_VERSION = 1;
export const CAPTURE_SOURCES = ['app', 'shortcut', 'share'];
export const CAPTURE_STATUSES = ['unsorted', 'filed', 'discarded'];

// Where a filed capture can end up. Deliberately the destinations that already
// exist — this feature adds a front door, not new rooms.
export const FILE_DESTINATIONS = [
  { id: 'journal', label: 'Journal entry' },
  { id: 'practice', label: 'Practice' },
  { id: 'cue', label: 'Visual cue' },
  { id: 'source', label: 'Provenance source' },
  { id: 'ingredient', label: 'Ingredient note' },
  { id: 'customer', label: 'Customer issue' },
];

// The pending-media bucket. Named here so the service worker, the retry path,
// and the orphan sweep cannot drift apart on a string.
export const CAPTURE_CACHE = 'ltb-capture-pending';

export function emptyInbox() {
  return { version: CAPTURE_VERSION, items: [] };
}

const str = (v, max = 20000) => (typeof v === 'string' ? v.slice(0, max) : '');
const list = (v, max = 20) => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x).slice(0, max) : []);

export function normalizeInbox(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) return emptyInbox();
  const seen = new Set();
  const items = [];
  for (const it of raw.items) {
    if (!it || typeof it !== 'object' || !it.id || seen.has(it.id)) continue;
    seen.add(it.id);
    const r = it.raw && typeof it.raw === 'object' ? it.raw : {};
    items.push({
      id: String(it.id),
      capturedAt: typeof it.capturedAt === 'number' ? it.capturedAt : Date.now(),
      source: CAPTURE_SOURCES.includes(it.source) ? it.source : 'app',
      raw: {
        text: str(r.text),
        url: str(r.url, 2000),
        title: str(r.title, 300),
        mediaRefs: list(r.mediaRefs),
      },
      media: it.media === 'pending' || it.media === 'r2' ? it.media : null,
      // A guess, kept apart from raw and never promoted into it automatically.
      proposal: it.proposal && typeof it.proposal === 'object' ? {
        destination: str(it.proposal.destination, 40),
        dishId: str(it.proposal.dishId, 80),
        why: str(it.proposal.why, 300),
      } : null,
      filedAs: it.filedAs && typeof it.filedAs === 'object' ? {
        destination: str(it.filedAs.destination, 40),
        recordId: str(it.filedAs.recordId, 120),
        at: typeof it.filedAs.at === 'number' ? it.filedAs.at : null,
      } : null,
      status: CAPTURE_STATUSES.includes(it.status) ? it.status : 'unsorted',
    });
  }
  return { version: CAPTURE_VERSION, items };
}

export function captureId(now = Date.now()) {
  return `cap_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// THE SAVE. Takes whatever arrived and stores it. No destination, no dish, no
// type, no privacy decision — none of those are arguments, which is the point.
export function addCapture(store, incoming, now = Date.now()) {
  const s = normalizeInbox(store);
  const r = (incoming && incoming.raw) || {};
  const hasContent = !!(str(r.text).trim() || str(r.url).trim() || list(r.mediaRefs).length);
  if (!hasContent) return s; // nothing arrived; an empty capture is a mis-tap
  const id = (incoming && incoming.id) || captureId(now);
  if (s.items.some(x => x.id === id)) return s; // idempotent: a retried POST is not a second item
  const item = normalizeInbox({
    items: [{
      ...incoming,
      id,
      capturedAt: (incoming && incoming.capturedAt) || now,
      status: 'unsorted',
      filedAs: null,
    }],
  }).items[0];
  return { ...s, items: [item, ...s.items] };
}

// Filing records WHERE it went and leaves raw alone.
export function fileCapture(store, id, filedAs, now = Date.now()) {
  const s = normalizeInbox(store);
  return {
    ...s,
    items: s.items.map(it => (it.id === id
      ? { ...it, status: 'filed', filedAs: { ...(filedAs || {}), at: now } }
      : it)),
  };
}

// Discarding MARKS, it does not erase. "I decided this was not worth keeping"
// and "this was never captured" are different states, and only one of them
// survives being wrong.
export function discardCapture(store, id) {
  const s = normalizeInbox(store);
  return { ...s, items: s.items.map(it => (it.id === id ? { ...it, status: 'discarded' } : it)) };
}

export function markMediaStored(store, id, mediaRefs) {
  const s = normalizeInbox(store);
  return {
    ...s,
    items: s.items.map(it => (it.id === id
      ? { ...it, media: 'r2', raw: { ...it.raw, mediaRefs: list(mediaRefs) } }
      : it)),
  };
}

export const unsortedCaptures = (store) => normalizeInbox(store).items.filter(i => i.status === 'unsorted');
export const pendingMediaCaptures = (store) => normalizeInbox(store).items.filter(i => i.media === 'pending');

export function inboxCounts(store) {
  const items = normalizeInbox(store).items;
  return {
    total: items.length,
    unsorted: items.filter(i => i.status === 'unsorted').length,
    filed: items.filter(i => i.status === 'filed').length,
    discarded: items.filter(i => i.status === 'discarded').length,
    pendingMedia: items.filter(i => i.media === 'pending').length,
  };
}

// ── Proposals ───────────────────────────────────────────────────────────────
//
// Deterministic, explainable, and always marked as a guess. No model call and
// no fuzzy matching: this runs the instant an item is opened, and a suggestion
// Kevin cannot explain is worse than none in a review flow whose entire job is
// deciding what something IS.
//
// `dishNames` is passed in rather than imported so this module stays free of
// the registry and can be tested against a fixed list.
export function proposeFor(item, dishNames = []) {
  if (!item || !item.raw) return null;
  const { text = '', url = '', mediaRefs = [] } = item.raw;
  const hay = (text + ' ' + (item.raw.title || '')).toLowerCase();

  const dishHit = dishNames.find(n => n && hay.includes(String(n).toLowerCase()));

  if (url && !text.trim()) {
    return { destination: 'source', dishId: '', why: 'It is a link with no note, which is usually a source.' };
  }
  if (mediaRefs.length && !text.trim()) {
    return {
      destination: 'cue',
      dishId: dishHit || '',
      why: dishHit ? `It is a picture and the note mentions ${dishHit}.` : 'It is a picture with no note.',
    };
  }
  if (dishHit) {
    return { destination: 'journal', dishId: dishHit, why: `It mentions ${dishHit}.` };
  }
  return null; // no honest guess. An empty proposal is better than a shrug dressed as one.
}
