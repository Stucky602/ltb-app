// src/visualCues.js — photographs of what a step is supposed to look like.
//
// WHY THIS EXISTS
//
// The dossier already holds why a dish is the way it is. It cannot hold what
// "the roux is right" looks like, and that is the thing a written recipe has
// never been able to carry. A photograph of the correct colour beside a
// photograph of two minutes too far is worth more than any sentence about it.
//
// TWO RULES THAT SHAPE EVERYTHING BELOW
//
// 1. A CUE IS NEVER "SAVED" BEFORE THE BYTES ARE DURABLE. Photos taken in a
//    working kitchen are one-shot: the roux will not be at that colour again
//    today. A cue that reports success and then loses the image is worse than
//    one that fails loudly, because the moment is unrepeatable. So metadata
//    carries an explicit status and nothing claims saved until the upload has
//    been confirmed by checksum.
//
// 2. A CUE IS ATTACHED TO A RECIPE VERSION, NOT A DISH. "This is what it looks
//    like" is only true of a particular recipe. When the recipe changes the old
//    cue does not become wrong, it becomes historical — which is exactly what
//    the version registry already models.
//
// STORAGE SPLIT: metadata lives in the app's durable model and rides backup.
// Bytes live in R2. Neither is useful alone, which is why the manifest in the
// archive bundle carries checksums — a future reader can tell a missing photo
// from a corrupted one without the app.

import { currentVersionFor } from './recipeVersions.js';
import { dishIdFor, resolveDishId } from './dishIdentity.js';

export const CUE_STATUS = ['pending', 'uploading', 'stored', 'failed'];

// What a cue is showing. Kept short and closed: a free-text kind field becomes
// twelve spellings of "roux" inside a month.
export const CUE_KINDS = [
  { id: 'target', label: 'What right looks like' },
  { id: 'too-far', label: 'Gone too far' },
  { id: 'not-yet', label: 'Not there yet' },
  { id: 'plating', label: 'How it goes in the container' },
  { id: 'step', label: 'A step in progress' },
];

export function makeCue({ dishName, dishId, step, kind = 'target', note = '', recipeVersionId = null, id = null }) {
  const resolvedDishId = dishId || dishIdFor(dishName) || null;
  // Stamped at capture, not at render. A cue photographed under one recipe must
  // keep pointing at that recipe forever, even after the dish moves on.
  const version = recipeVersionId
    || (resolvedDishId ? (currentVersionFor(resolvedDishId) || {}).id : null)
    || null;

  return {
    id: id || 'cue_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
    dishId: resolvedDishId,
    dishName: dishName || null,        // readability only; dishId is the key
    recipeVersionId: version,
    step: String(step || '').slice(0, 120),
    kind: CUE_KINDS.some(k => k.id === kind) ? kind : 'target',
    note: String(note || '').slice(0, 400),
    capturedAt: new Date().toISOString(),
    status: 'pending',
    mediaKey: null,
    checksum: null,
    bytes: null,
    width: null,
    height: null,
  };
}

// The only path to 'stored'. Requires the checksum the server confirmed, so a
// caller cannot mark a cue durable out of optimism.
export function markStored(cue, { mediaKey, checksum, bytes, width, height }) {
  if (!mediaKey || !checksum) return { ...cue, status: 'failed' };
  return { ...cue, status: 'stored', mediaKey, checksum, bytes: bytes || null, width: width || null, height: height || null };
}

export function markFailed(cue, reason) {
  return { ...cue, status: 'failed', failureReason: String(reason || '').slice(0, 200) };
}

// Cues that claim to be stored but have no key, or claim a key with no
// checksum. Either means the metadata and the bytes have drifted apart, and
// silently rendering a broken image is the wrong answer.
export function brokenCues(cues) {
  return (cues || []).filter(c =>
    (c.status === 'stored' && (!c.mediaKey || !c.checksum))
    || (c.mediaKey && c.status !== 'stored'));
}

// Cues whose bytes never landed. Surfaced so Kevin can retake rather than
// discovering the gap a year later.
export function unfinishedCues(cues) {
  return (cues || []).filter(c => c.status === 'pending' || c.status === 'uploading' || c.status === 'failed');
}

export function cuesForDish(cues, dishOrId) {
  const id = typeof dishOrId === 'string' ? (dishIdFor(dishOrId) || dishOrId) : resolveDishId(dishOrId);
  return (cues || []).filter(c => c.dishId === id);
}

// Grouped for the comparison view: the whole point is target beside too-far.
export function cueComparisonSets(cues, dishOrId) {
  const mine = cuesForDish(cues, dishOrId);
  const bySteps = new Map();
  for (const c of mine) {
    const key = c.step || '(unlabelled step)';
    const set = bySteps.get(key) || { step: key, target: [], contrast: [], other: [] };
    if (c.kind === 'target') set.target.push(c);
    else if (c.kind === 'too-far' || c.kind === 'not-yet') set.contrast.push(c);
    else set.other.push(c);
    bySteps.set(key, set);
  }
  // A set with a target AND a contrast is the useful kind; sort those first.
  return [...bySteps.values()].sort((a, b) => {
    const score = s => (s.target.length && s.contrast.length ? 0 : s.target.length ? 1 : 2);
    return score(a) - score(b);
  });
}

// ── The archive bundle ──────────────────────────────────────────────────────
//
// Kevin's ruling, Jul 30: the durable archive becomes a FOLDER rather than one
// HTML file. It has to, and the reason is worth writing down because it is the
// kind of decision that gets quietly reversed later.
//
// The archive must survive the app, the worker, and Cloudflare. A single
// self-contained HTML file did that beautifully for text. Media breaks it two
// ways: embed the photos as base64 and a few hundred of them produce a file too
// large for a browser to open, or reference them by URL and the archive stops
// being self-contained the moment the worker is gone. Neither is acceptable for
// something meant to be readable in twenty years.
//
// So: a folder. archive.html beside a media/ directory, relative links, and a
// manifest listing every asset with its checksum and size. The manifest is what
// lets someone in 2046 tell "this photo is missing" from "this photo is
// corrupted" with no software but a text editor.
export const BUNDLE_README = [
  'This folder is a complete record. It needs no app, no account, and no internet.',
  '',
  'archive.html   — open this in any browser.',
  'media/         — the photographs the archive refers to.',
  'manifest.json  — every file listed with its size and checksum.',
  '',
  'If a photograph does not appear, check manifest.json. A file listed there but',
  'missing from media/ was lost in copying. A file present but with a different',
  'checksum was damaged. Everything else in archive.html is plain text and will',
  'outlive both.',
].join('\n');

export function buildBundleManifest({ cues, archiveBytes, generatedAt }) {
  const stored = (cues || []).filter(c => c.status === 'stored' && c.mediaKey && c.checksum);
  return {
    schema: 1,
    generatedAt: generatedAt || new Date().toISOString(),
    files: [
      { path: 'archive.html', bytes: archiveBytes || null, checksum: null, note: 'the record itself' },
      ...stored.map(c => ({
        path: 'media/' + c.mediaKey,
        bytes: c.bytes || null,
        checksum: c.checksum,
        dishId: c.dishId,
        recipeVersionId: c.recipeVersionId,
        step: c.step,
        kind: c.kind,
      })),
    ],
    // Counted, not hidden. An archive that silently omits the cues that failed
    // to upload would misrepresent itself as complete.
    omitted: unfinishedCues(cues).map(c => ({
      dishId: c.dishId, step: c.step, status: c.status,
      why: 'the photograph never finished uploading, so there are no bytes to include',
    })),
  };
}
