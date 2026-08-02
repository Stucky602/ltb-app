// src/mediaClient.js — getting a kitchen photograph safely into storage.
//
// THREE THINGS HAPPEN HERE AND ALL THREE MATTER
//
// 1. RE-ENCODE, WHICH STRIPS EXIF. A phone photo carries GPS coordinates, the
//    device, and the timestamp. These are pictures taken inside Kevin's home,
//    and they end up in an archive he intends to hand to his son and possibly
//    to share. Drawing to a canvas and re-encoding discards all of it as a side
//    effect — there is no metadata to carry across because the pixels are
//    redrawn from scratch. That is a happy accident of the API, so it is
//    written down here rather than assumed.
//
// 2. COMPRESS. A modern phone photo is 4 to 8 MB. A cue needs to show a colour
//    and a texture, which 1600px of WebP does at around 200KB. Two hundred cues
//    is then 40MB rather than a gigabyte, and the archive folder stays
//    something you can actually copy to a drive.
//
// 3. VERIFY. The checksum is computed here, sent with the upload, and the
//    server recomputes it. Only a match marks the cue stored. A kitchen photo
//    is one-shot — the roux will not be at that colour again today — so a
//    silent truncation that is discovered a year later is unrecoverable in a
//    way that most data loss is not.

export const MAX_EDGE = 1600;
export const TARGET_TYPE = 'image/webp';
export const QUALITY = 0.82;

// Re-encode through a canvas. The EXIF strip is the side effect described above.
export async function compressImage(file, { maxEdge = MAX_EDGE, quality = QUALITY } = {}) {
  if (!file) throw new Error('no file');
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(w, h)
    : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = canvas.convertToBlob
    ? await canvas.convertToBlob({ type: TARGET_TYPE, quality })
    : await new Promise(res => canvas.toBlob(res, TARGET_TYPE, quality));

  return { blob, width: w, height: h, bytes: blob.size };
}

export async function checksumOf(blob) {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Deterministic and readable, so a human browsing media/ in the archive folder
// can tell what they are looking at without opening it.
export function mediaKeyFor(cue, ext = 'webp') {
  const safe = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return [safe(cue.dishId), safe(cue.step) || 'step', safe(cue.kind), cue.id.slice(-6)].join('_') + '.' + ext;
}

// ── AUDIO ───────────────────────────────────────────────────────────────────
//
// Rowan's voice capsules. Deliberately a SEPARATE function from uploadCue and
// not a generalisation of it, because the two differ in the one place that
// matters: an image is re-encoded through a canvas, which strips EXIF and
// compresses it. Audio is uploaded AS RECORDED.
//
// WHY AUDIO IS NEVER RE-ENCODED. MediaRecorder already hands back a compressed
// Opus stream, so a second pass would cost quality for almost no bytes. More to
// the point, this recording is the artifact. It is a child's voice at a
// particular age, it happens once, and the transcript beside it is a
// convenience that can always be retyped. Anything that degrades the original
// to save space has the value backwards.
//
// The worker's /media route already stores arbitrary keys and preserves the
// Content-Type header, so this needs no new endpoint and no worker change.
export const AUDIO_MAX_BYTES = 8 * 1024 * 1024; // the worker's own ceiling
export const AUDIO_MAX_SECONDS = 180;

export function audioKeyFor(entryId, ext = 'webm') {
  const safe = String(entryId || '').replace(/[^A-Za-z0-9]+/g, '').slice(-12) || 'entry';
  return `rowan_${safe}.${ext}`;
}

export async function uploadAudio(entryId, blob, { workerBase, token, fetchImpl } = {}) {
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) return { ok: false, reason: 'no network available' };
  if (!token) return { ok: false, reason: 'not signed in' };
  if (!blob || !blob.size) return { ok: false, reason: 'nothing was recorded' };
  if (blob.size > AUDIO_MAX_BYTES) return { ok: false, reason: 'that recording is too long to store' };

  const checksum = await checksumOf(blob);
  const ext = (blob.type || '').includes('mp4') ? 'mp4' : 'webm';
  const mediaKey = audioKeyFor(entryId, ext);

  let res;
  try {
    res = await doFetch(workerBase + '/media/' + encodeURIComponent(mediaKey), {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'audio/webm',
        'X-LTB-Token': token,
        'X-LTB-Checksum': checksum,
      },
      body: blob,
    });
  } catch (e) {
    return { ok: false, reason: 'the upload did not reach the server' };
  }
  if (!res.ok) {
    return { ok: false, reason: res.status === 413 ? 'that recording is too large' : 'the server refused the upload' };
  }
  let body = null;
  try { body = await res.json(); } catch (e) { body = null; }
  // Same rule as a photograph, and it matters more here: a truncated recording
  // of a two-year-old cannot be taken again.
  if (!body || body.checksum !== checksum) {
    return { ok: false, reason: 'the stored copy did not match what was sent' };
  }
  return { ok: true, checksum, mediaKey, bytes: blob.size, contentType: blob.type || 'audio/webm' };
}
//
// Returns { ok, checksum, mediaKey, bytes, width, height } or { ok: false,
// reason }. It never reports success on a response it did not verify, and the
// caller must not mark a cue stored on anything but ok:true.
// THE ONLY PATH TO A STORED CUE.
//
// Returns { ok, checksum, mediaKey, bytes, width, height } or { ok: false,
// reason }. It never reports success on a response it did not verify, and the
// caller must not mark a cue stored on anything but ok:true.
export async function uploadCue(cue, file, { workerBase, token, fetchImpl } = {}) {
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) return { ok: false, reason: 'no network available' };
  if (!token) return { ok: false, reason: 'not signed in' };

  let compressed;
  try {
    compressed = await compressImage(file);
  } catch (e) {
    return { ok: false, reason: 'that image could not be read' };
  }

  const checksum = await checksumOf(compressed.blob);
  const mediaKey = mediaKeyFor(cue);

  let res;
  try {
    res = await doFetch(workerBase + '/media/' + encodeURIComponent(mediaKey), {
      method: 'POST',
      headers: {
        'Content-Type': TARGET_TYPE,
        'X-LTB-Token': token,
        // Sent so the server can verify rather than trust. The server
        // recomputes from the bytes it actually received.
        'X-LTB-Checksum': checksum,
      },
      body: compressed.blob,
    });
  } catch (e) {
    return { ok: false, reason: 'the upload did not reach the server' };
  }

  if (!res.ok) {
    return { ok: false, reason: res.status === 413 ? 'that image is too large' : 'the server refused the upload' };
  }

  let body = null;
  try { body = await res.json(); } catch (e) { body = null; }

  // The server's checksum must match ours. A mismatch means the bytes changed
  // in transit, and marking that cue stored would leave a corrupted photo
  // wearing a healthy status forever.
  if (!body || body.checksum !== checksum) {
    return { ok: false, reason: 'the stored copy did not match what was sent' };
  }

  return {
    ok: true, checksum, mediaKey,
    bytes: compressed.bytes, width: compressed.width, height: compressed.height,
  };
}
