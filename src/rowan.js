// rowan.js — a longitudinal record of how Kevin's son eats the menu.
//
// WHY THIS IS NOT A PREFERENCE LIST
// A "what does he like" store is one row deep and stays that way. What Kevin
// asked for is the opposite: "some dishes he may love now, hate next year, then
// like them again even later, and I WOULD like to track that." So the unit here
// is a dated RATING, and a dish's record is the SERIES of them. Current opinion
// is a derived footnote, not the stored thing. Everything below follows from
// that: nothing is ever overwritten, entries only accumulate.
//
// AGE, NOT DATE. "March 2028" tells you nothing reading back. "3y 3m" tells you
// everything, because that is the axis a child actually changes along. Every
// entry stamps its own age at write time so the record stays readable without
// needing the birth month to still be around.
//
// SCOPE IS THE MENU, DELIBERATELY. He eats yoghurt and berries too, and that is
// not what this is for. The menu is built from what Kevin already cooks, so
// tracking his son against it is tracking him against the family's actual food.
// Non-menu food is knowable without an app.
//
// WHAT IS NOT HERE, and why, so nobody helpfully adds it back:
//   - "the condition it was eaten under" — he eats things as served and does
//     not mind foods touching. The only adjustment is cutting pieces smaller,
//     which changes nothing about flavour or texture.
//   - "what it was eaten with" — always the same as everyone else gets, so the
//     answer is constant and therefore worthless.
//   - "first taste" — he has already tasted all of it. Kevin grew a lot of it
//     specifically for that, including his first orange and his first
//     dragonfruit, so those moments are already had and not app-shaped.

import { uid } from './utils.js';
import { resolveDishId, dishNameFor } from './dishIdentity.js';

// Set once. Only the month matters: nothing here needs a finer grain than that,
// and "2y 8m" is the resolution the record is read at.
export const BIRTH_YEAR = 2024;
export const BIRTH_MONTH = 12;   // 1-indexed

export const RATING_LABELS = {
  1: 'Refused it',
  2: 'Barely touched it',
  3: 'Ate it',
  4: 'Liked it',
  5: 'Loved it',
};

// Whole months between the birth month and a date. Deliberately coarse.
export function ageAt(iso) {
  const t = new Date(iso);
  if (isNaN(t)) return null;
  const months = (t.getFullYear() - BIRTH_YEAR) * 12 + (t.getMonth() + 1 - BIRTH_MONTH);
  return months < 0 ? null : months;
}

export function formatAge(months) {
  if (months == null) return '';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}m`;
  return m === 0 ? `${y}y` : `${y}y ${m}m`;
}

// One logged tasting. `fairTest: false` means he was tired, teething, or
// already full — the entry is kept because it happened, and excluded from every
// aggregate because it says nothing about the dish.
export function makeEntry({ dish, rating, note, familyNote, fairTest = true, at, capsule = null, servedRecipeVersionId = null }) {
  const when = at || new Date().toISOString();
  return {
    id: uid(),
    dish: String(dish || ''),
    dishId: resolveDishId({ name: dish }) || null,
    rating: Math.max(1, Math.min(5, Number(rating) || 3)),
    note: String(note || '').slice(0, 1000),
    // Kept apart from `note` on purpose. One is about the food; the other is
    // about the moment, and is written for him to read one day rather than for
    // Kevin to cook from. Mixing them would make both harder to use later.
    familyNote: String(familyNote || '').slice(0, 2000),
    fairTest: !!fairTest,
    at: when,
    ageMonths: ageAt(when),
    // VOICE CAPSULE, optional. Attached at log time or added later.
    // { mediaKey, contentType, seconds, bytes, transcript, transcriptEditedAt }
    // The RECORDING is the artifact and the transcript is a convenience beside
    // it — see the capsule helpers below for why that ordering is enforced
    // rather than assumed.
    capsule: normalizeCapsule(capsule),
    // WHICH VERSION HE ACTUALLY ATE. The systems master asks a capsule to carry
    // "dish and served version", and after the schema v5 stamping the ORDERS
    // know this but a rowan entry did not. Without it, a series showing he came
    // around on a dish cannot tell whether the dish changed underneath him,
    // which is the single most interesting thing that series could say.
    //
    // Null when unknown, and unknown is the honest answer for anything logged
    // outside an order. Never back-filled from the current recipe: that would
    // claim he ate today's version of a dish two years ago.
    servedRecipeVersionId: servedRecipeVersionId || null,
  };
}

// ── Voice capsules ──────────────────────────────────────────────────────────
//
// THE RECORDING IS PRIMARY AND THE TRANSCRIPT IS NOT.
//
// A transcript is searchable, and that is the only thing it is better at. What
// is actually being kept here is a child's voice at a particular age saying
// something about a particular meal, once. So the audio is never re-encoded,
// never replaced by its text, and editing a transcript cannot touch it. A
// correction stamps `transcriptEditedAt` so a later reader can tell the words
// were tidied and the recording was not.
//
// THERE IS NO AUTOMATIC TRANSCRIPTION and that is a deliberate absence rather
// than an unfinished feature. This stack has no speech-to-text service, and
// adding one is a dependency decision (a third party, a cost, and a recording
// of a small child leaving the house) that is Kevin's to make and not one to
// arrive as a side effect of a capsule feature. Typing a sentence on a PC is
// the interim, and it is a fine one: the audio is already safe.
export function normalizeCapsule(c) {
  if (!c || typeof c !== 'object' || !c.mediaKey) return null;
  return {
    mediaKey: String(c.mediaKey).slice(0, 200),
    contentType: String(c.contentType || 'audio/webm').slice(0, 60),
    seconds: Math.max(0, Math.round(Number(c.seconds) || 0)),
    bytes: Math.max(0, Math.round(Number(c.bytes) || 0)),
    checksum: String(c.checksum || '').slice(0, 80),
    transcript: String(c.transcript || '').slice(0, 4000),
    transcriptEditedAt: typeof c.transcriptEditedAt === 'number' ? c.transcriptEditedAt : null,
  };
}

// Attach a capsule to an existing entry. Used when the recording finishes after
// the entry was already logged, which is the common case: log first so the
// rating is safe, then the audio lands when the upload completes.
export function attachCapsule(log, entryId, capsule) {
  const c = normalizeCapsule(capsule);
  if (!c) return log || [];
  return (log || []).map(e => (e.id === entryId ? { ...e, capsule: c } : e));
}

// Edit the words. NEVER touches mediaKey, seconds, bytes, or checksum.
export function editTranscript(log, entryId, transcript, now = Date.now()) {
  return (log || []).map(e => {
    if (e.id !== entryId || !e.capsule) return e;
    return {
      ...e,
      capsule: {
        ...e.capsule,
        transcript: String(transcript || '').slice(0, 4000),
        transcriptEditedAt: now,
      },
    };
  });
}

// Every capsule, oldest first. This is the view that is the point of the
// feature: played in order, it is how his vocabulary and his relationship to
// the food changed over years.
export function capsuleTimeline(log) {
  return (log || [])
    .filter(e => e.capsule && e.capsule.mediaKey)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

// ── PALATE VOCABULARY TIMELINE ──────────────────────────────────────────────
//
// A DERIVED VIEW, not a store. It reads the words already in the log — the food
// notes, the family notes, and the transcripts Kevin typed against the voice
// capsules — and reports when each one first appeared and at what age.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS MUST NEVER BECOME
//
// It does not grade, score, or count toward anything. It does not compare him
// to other children or to an expected range, and it does not treat a technical
// word as better than a plain one. A child saying "spicy" at two is not behind
// a child saying "piquant"; those are different sentences, not different marks.
// The moment this reads as an assessment it stops being a record of a
// relationship with food and becomes a report card, and nobody asked for one.
//
// ═══════════════════════════════════════════════════════════════════════════
// EVERY WORD LINKS BACK, AND SAYS WHOSE IT IS
//
// `source` names the entry the word came from, so a word can always be checked
// against what was actually said. `voice` distinguishes a word Rowan said —
// from a transcript Kevin typed against a recording — from one that appears
// only in a parent's own note ABOUT him. Those are genuinely different claims:
// one is his vocabulary, the other is his father describing him. Collapsing
// them would put words in a child's mouth in the one document meant to prove
// they were his.

// Words too common to be interesting, and pronouns and fillers that would
// otherwise dominate every timeline. Deliberately short: over-filtering would
// drop the plain words that ARE his vocabulary at two.
const VOCAB_STOP = new Set(['the', 'and', 'but', 'for', 'was', 'with', 'that', 'this', 'his', 'her',
  'him', 'she', 'they', 'them', 'you', 'your', 'not', 'all', 'are', 'has', 'had', 'did', 'its',
  'from', 'have', 'were', 'been', 'said', 'says', 'then', 'than', 'when', 'what', 'some', 'more',
  'very', 'just', 'like', 'about', 'into', 'over', 'again', 'still', 'would', 'could']);

function vocabWords(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^[''-]+|[''-]+$/g, ''))
    .filter(w => w.length > 2 && !VOCAB_STOP.has(w));
}

export function vocabularyTimeline(log) {
  const first = new Map();
  const ordered = [...(log || [])].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  for (const e of ordered) {
    // 'rowan' = words he said, taken from a transcript Kevin typed against a
    // recording. 'parent' = words from Kevin's own note about the meal. The
    // capsule transcript is checked FIRST so a word appearing in both is
    // credited to him.
    const sources = [
      { text: e.capsule && e.capsule.transcript, voice: 'rowan', source: 'transcript' },
      { text: e.note, voice: 'parent', source: 'note' },
      { text: e.familyNote, voice: 'parent', source: 'familyNote' },
    ];
    for (const src of sources) {
      for (const w of vocabWords(src.text)) {
        const prev = first.get(w);
        // A word already recorded in Rowan's own voice is never downgraded to a
        // parent attribution by a later parent note.
        if (prev && (prev.voice === 'rowan' || src.voice === 'parent')) continue;
        first.set(w, {
          word: w,
          at: e.at,
          ageMonths: e.ageMonths,
          dish: e.dish,
          entryId: e.id,
          voice: src.voice,
          source: src.source,
        });
      }
    }
  }
  return [...first.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

// Grouped by age band for reading, because the interesting thing is not the
// list of words but how the list CHANGED. Bands are wide on purpose: narrow
// ones would invite reading a gap as a plateau.
export function vocabularyByAge(log, bandMonths = 6) {
  const bands = new Map();
  for (const w of vocabularyTimeline(log)) {
    const age = Number.isFinite(w.ageMonths) ? w.ageMonths : 0;
    const band = Math.floor(age / bandMonths) * bandMonths;
    if (!bands.has(band)) bands.set(band, []);
    bands.get(band).push(w);
  }
  return [...bands.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([from, words]) => ({ from, to: from + bandMonths - 1, words }));
}

export function capsuleCount(log) {
  return capsuleTimeline(log).length;
}

export function addEntry(log, entry) {
  return [...(log || []), entry].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

// Group by stable dish id so a rename does not fork a child's history in half,
// which is the same trap the passport and favorites were in.
function keyOf(e) {
  return e.dishId || e.dish;
}

// The series for one dish, oldest first. This is the main view.
export function seriesFor(log, dish) {
  const want = resolveDishId({ name: dish }) || dish;
  return (log || [])
    .filter(e => keyOf(e) === want)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

// Averages exclude unfair tests. A rating given on a bad day is real as a
// record and misleading as evidence, so it stays visible in the series and out
// of every number derived from it.
export function dishSummary(log, dish) {
  const all = seriesFor(log, dish);
  const fair = all.filter(e => e.fairTest);
  if (all.length === 0) return null;
  const avg = fair.length ? fair.reduce((n, e) => n + e.rating, 0) / fair.length : null;
  const latest = all[all.length - 1];
  const latestFair = fair.length ? fair[fair.length - 1] : null;
  const first = all[0];
  return {
    dish: dishNameFor(all[0].dishId, all[0].dish),
    entries: all.length,
    excluded: all.length - fair.length,
    average: avg,
    latest,
    latestFair,
    first,
    // A dish he scored low and later scored high. The single most interesting
    // thing this record can surface, and the reason it stores a series.
    cameAround: !!(fair.length >= 2 && Math.min(...fair.map(e => e.rating)) <= 2
      && latestFair && latestFair.rating >= 4),
    // The reverse, which matters just as much and is easier to miss.
    wentOff: !!(fair.length >= 2 && Math.max(...fair.map(e => e.rating)) >= 4
      && latestFair && latestFair.rating <= 2),
  };
}

// Every dish he has an opinion on, best first. Fair tests only.
export function topDishes(log, limit = 0) {
  const byKey = new Map();
  for (const e of (log || [])) {
    if (!e.fairTest) continue;
    const k = keyOf(e);
    const b = byKey.get(k) || { key: k, dish: dishNameFor(e.dishId, e.dish), sum: 0, n: 0, last: e };
    b.sum += e.rating; b.n += 1;
    if (Date.parse(e.at) >= Date.parse(b.last.at)) b.last = e;
    byKey.set(k, b);
  }
  const rows = [...byKey.values()].map(b => ({
    dish: b.dish,
    average: b.sum / b.n,
    entries: b.n,
    latest: b.last,
  })).sort((a, b) => b.average - a.average || b.entries - a.entries);
  return limit > 0 ? rows.slice(0, limit) : rows;
}

// Which dishes have never been logged. Not a scold: it is the worklist, the
// same reasoning that keeps the coverage card visible at zero.
export function untried(log, allDishNames) {
  const seen = new Set((log || []).map(keyOf));
  return (allDishNames || []).filter(n => !seen.has(resolveDishId({ name: n }) || n));
}

export function coverage(log, allDishNames) {
  const total = (allDishNames || []).length;
  const tried = total - untried(log, allDishNames).length;
  return { tried, total, pct: total ? Math.round((tried / total) * 100) : 0 };
}

// Everything with something written in it, newest first. The family notes are
// the part that will matter in twenty years, so they get their own way in
// rather than being buried one dish at a time.
export function writtenEntries(log, { familyOnly = false } = {}) {
  return (log || [])
    .filter(e => (familyOnly ? e.familyNote : (e.note || e.familyNote)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
