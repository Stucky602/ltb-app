// feedbackSync.js — kitchen feedback: the pull from the worker, the triage
// queue it feeds, the per-dish store it lands in, and the week close-out ritual
// that ties the two together.
//
// THE RULE THAT SHAPES ALL OF THIS
// Nothing is cleared from worker KV on pull. An entry leaves KV only when Kevin
// has Saved or Ignored it, AND only once every other entry sharing its pageId
// has also been triaged. That is why clearPageIfDone takes the queue as it will
// be after the removal rather than reading state: the decision has to be made
// against the post-removal queue, and state has not committed yet at that point.
// The consequence is that closing the app mid-triage loses nothing, which is
// the whole design goal.
//
// Feedback is dish-linked only and never attached to an order. That is
// deliberate: a verdict is about the food, and attaching it to a customer's
// order would quietly turn a cooking note into a record about a person.
//
// No hooks here, same rule as the other extracted modules. Setters arrive in a
// deps bag; App.jsx keeps one thin useCallback per operation with its original
// dependency array.

import { WORKER_BASE, PUBLISH_TOKEN, FEEDBACK_KEY } from './config.js';
import { saveJSON, saveError, applyFeedbackSave, resetDishFeedback } from './utils.js';

// Pulls tapped verdicts from the worker into the TRIAGE QUEUE.
//
// The two counts it deals in are not the same number and the difference is not
// a bug: `pulled` inside the setter counts entries that were NEW to this
// device, while the returned figure is everything the worker offered. The
// return is what the close-out reports, so a re-pull that finds nothing new
// still honestly says how much feedback the week carried.
export async function pullKitchenFeedback({ setPendingFeedback }) {
  const res = await fetch(WORKER_BASE + '/feedback/pending?token=' + encodeURIComponent(PUBLISH_TOKEN));
  if (!res.ok) throw new Error('pull failed');
  const { feedback } = await res.json();
  if (!feedback || !feedback.length) return { pulled: 0 };
  const incoming = [];
  for (const page of feedback) {
    (page.entries || []).forEach((e, i) => {
      incoming.push({ id: page.pageId + ':' + i, pageId: page.pageId, dish: e.dish, verdict: e.verdict, note: e.note || '', at: e.at });
    });
  }
  let pulled = 0;
  setPendingFeedback(prev => {
    const have = new Set(prev.map(e => e.id));
    const fresh = incoming.filter(e => !have.has(e.id));
    pulled = fresh.length;
    return fresh.length ? [...prev, ...fresh] : prev;
  });
  return { pulled: incoming.length };
}

// Clear a pageId from worker KV once no queued entries reference it.
export async function clearPageIfDone(queue, pageId) {
  if (queue.some(e => e.pageId === pageId)) return;
  try {
    await fetch(WORKER_BASE + '/feedback/clear', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: PUBLISH_TOKEN, pageIds: [pageId] }),
    });
  } catch (e) { /* offline: KV entry lingers, harmless — dedupe by id on next pull */ }
}

// Save one triaged entry to the per-dish store. mode: 'tally' | 'tallyNote'.
export function saveFeedbackEntry(entry, mode, deps) {
  const { setDishFeedback, setPendingFeedback, setError, clearPageIfDone: clearFn } = deps;
  setDishFeedback(prev => {
    const next = applyFeedbackSave(prev, entry, mode);
    saveJSON(FEEDBACK_KEY, next).then(r => setError(saveError(r)));
    return next;
  });
  setPendingFeedback(prev => {
    const next = prev.filter(e => e.id !== entry.id);
    clearFn(next, entry.pageId);
    return next;
  });
}

export function ignoreFeedbackEntry(entry, deps) {
  const { setPendingFeedback, clearPageIfDone: clearFn } = deps;
  setPendingFeedback(prev => {
    const next = prev.filter(e => e.id !== entry.id);
    clearFn(next, entry.pageId);
    return next;
  });
}

// ── The kitchen archive (Jul 26) ────────────────────────────────────────────
// Every verdict anybody tapped, INCLUDING the ones triage threw away.
//
// Triage is destructive on purpose and that is fine for a queue: Ignore drops
// an entry, "Save tally only" keeps the count and discards the words, and
// clearPageIfDone above deletes the worker's copy outright. What it means is
// that the per-dish store holds what Kevin CHOSE to keep, which is a different
// thing from what people actually said. The worker now mirrors each page's
// verdicts into a key the clear does not touch, and this reads it back.
//
// FOR KEVIN ONLY. The endpoint is token-gated and nothing on a customer page
// calls it. companion.js is untouched by this feature, so the privacy wall
// (tests/journal.mjs) has nothing new to walk.
//
// An un-pasted worker 404s here, and that is not an error worth a red banner:
// it is the normal state of a hand-pasted deploy for as long as it takes Kevin
// to paste. It comes back as `unavailable` with a reason the UI can print.
export async function fetchFeedbackHistory() {
  let res;
  try {
    res = await fetch(WORKER_BASE + '/feedback/history?token=' + encodeURIComponent(PUBLISH_TOKEN));
  } catch (e) {
    return { pages: [], unavailable: true, reason: 'offline' };
  }
  if (res.status === 404) return { pages: [], unavailable: true, reason: 'the worker needs pasting' };
  if (!res.ok) return { pages: [], unavailable: true, reason: 'worker returned ' + res.status };
  try {
    const j = await res.json();
    return { pages: Array.isArray(j.pages) ? j.pages : [], truncated: !!j.truncated };
  } catch (e) {
    return { pages: [], unavailable: true, reason: 'unreadable response' };
  }
}

// Flatten the per-page archive into one list per dish, newest first.
//
// NOT deduped across pages, deliberately. Two pages are two different orders,
// so the same dish twice is two real verdicts from two real meals, and merging
// them would hide the repetition that is the entire reason to look. The dedupe
// that matters — one customer changing their mind about one order — already
// happened in the worker, where each page's list is latest-tap-wins.
export function feedbackHistoryByDish(pages) {
  const out = {};
  for (const p of pages || []) {
    for (const e of (p.entries || [])) {
      if (!e || !e.dish) continue;
      (out[e.dish] = out[e.dish] || []).push({
        verdict: e.verdict,
        note: e.note || '',
        at: e.at,
        pageId: p.pageId,
        readAt: p.readAt || null,
      });
    }
  }
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
  }
  return out;
}

// Reset one dish's live tally (archives current tally+notes to history first).
export function resetDishFeedbackTally(dish, { setDishFeedback, setError }) {
  setDishFeedback(prev => {
    const next = resetDishFeedback(prev, dish);
    saveJSON(FEEDBACK_KEY, next).then(r => setError(saveError(r)));
    return next;
  });
}

// CLOSE OUT THE WEEK (one tap): pull any last kitchen feedback, then archive
// everything delivered. The ritual, automated.
//
// The delivered count is taken BEFORE the archive runs, because after it runs
// there is nothing left matching the filter and the report would always read
// zero.
export async function closeOutWeek({ orders, pullKitchenFeedback: pullFn, archiveDelivered: archiveFn }) {
  let fb = { attached: 0 };
  try { fb = await pullFn(); } catch (e) { /* offline is fine */ }
  const deliveredCount = (orders || []).filter(o => o.status === 'Delivered' && !o.archived).length;
  archiveFn();
  return { feedback: fb.pulled || 0, archived: deliveredCount };
}
