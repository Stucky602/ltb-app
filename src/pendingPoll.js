// pendingPoll.js — the only way customer orders enter this app.
//
// A customer submits form.html, the Cloudflare worker stores that submission
// under its own KV key, and this polls for it. Nothing else brings orders in.
// The Google-Forms CSV path that used to sit alongside this was removed: it had
// been switched off for months and, underneath the flag, was broken (it called
// a `fetchFormRows` that was never exported and never imported, so re-enabling
// it would have thrown on the first call).
//
// THE RULE THAT MAKES THIS SAFE: POLLING NEVER CLEARS THE WORKER.
// An order leaves worker KV in exactly one place, dismissPending in
// orderOps.js, and only because Kevin accepted or rejected it. That makes this
// function a pure idempotent sync, which is what lets a failed local save, a
// mid-poll reload, or a restore-over-pending all be survivable: the worker
// still holds the order and the next poll picks it up again. The cost is
// re-seeing orders already handled, which the handled-pending ledger dedupes.
// Do not "optimise" this by clearing after a successful read.
//
// The item mapping is fussier than it looks and every branch is load-bearing:
// customer-selected options (spice level, pasta shape) were being dropped here
// and never reached the order card, and at-cost add-on requests have to arrive
// as pending line items because their cost is unknown until Kevin shops.

import { PENDING_POLL_URL, PUBLISH_TOKEN, PENDING_KEY } from './config.js';
import { saveJSON, saveError, normalizeAddons } from './utils.js';

const POLL_INTERVAL_MS = 2 * 60 * 1000;

// Normalizes one worker submission into the app's pending-order shape.
// Exported so a test can pin the mapping without standing up a fetch.
export function mapSubmission(s) {
  return {
    pendingId: s.id,
    timestamp: s.submittedAt || new Date().toISOString(),
    customer: s.customer || 'Unknown',
    address: s.address || '',
    phone: s.phone || '',
    items: Array.isArray(s.items) ? s.items.map(it => ({
      name: it.name, variant: it.variant, qty: it.qty || 1,
      price: it.price, cost: it.cost || 0,
      note: it.note || '', hasPhoto: false,
      // Preserve customer-selected options (spice level, pasta shape).
      // These were being dropped here, so spice/pasta never reached the
      // order card even though the form sent them correctly.
      ...(it.options ? { options: it.options } : {}),
      // At-cost add-on requests (parm block, fixings): normalize to
      // pending line items — cost unknown until Kevin shops, exactly
      // like the weight system. normalizeAddons dedupes + sanitizes.
      ...((() => { const a = normalizeAddons(it.addons); return a ? { addons: a } : {}; })()),
      ...(it.perLb ? { perLb: it.perLb } : {}),
      ...(it.avgWeightLb != null ? { avgWeightLb: it.avgWeightLb } : {}),
    })) : [],
    notes: s.notes || '',
  };
}

// Merges freshly polled submissions into the local pending queue, skipping
// anything already queued or already in the handled ledger. Returns the next
// queue, or the SAME reference when nothing is new — the identity check is what
// stops a poll every two minutes from re-rendering the orders tab forever.
export function mergePending(prev, mapped, handledLedger) {
  const have = new Set((prev || []).map(p => p.pendingId));
  const handled = handledLedger || {};
  const fresh = mapped.filter(m => !have.has(m.pendingId) && !handled[m.pendingId]);
  if (fresh.length === 0) return prev;
  return [...(prev || []), ...fresh];
}

export async function pollWorkerPending(reschedule, deps) {
  const { setPendingOrders, handledPendingRef, workerPollRef, self, setError } = deps;
  try {
    const res = await fetch(PENDING_POLL_URL, { cache: 'no-store', headers: { 'X-LTB-Token': PUBLISH_TOKEN } });
    if (res.ok) {
      const data = await res.json();
      const submissions = (data && data.pending) || [];
      if (submissions.length > 0) {
        const mapped = submissions.map(mapSubmission);
        setPendingOrders(prev => {
          const updated = mergePending(prev, mapped, handledPendingRef.current);
          if (updated === prev) return prev;
          // The worker still holds these so nothing is lost, but a silent
          // failure here means the queue on screen and the queue on the server
          // quietly disagree, which is worth a banner.
          saveJSON(PENDING_KEY, updated).then(r => setError(saveError(r)));
          return updated;
        });
      }
    }
  } catch (e) { /* offline: the worker keeps the queue, try again on the next tick */ }
  if (reschedule) {
    if (workerPollRef.current) clearTimeout(workerPollRef.current);
    // `self` is the caller's own wrapper, so the reschedule keeps going through
    // App.jsx rather than calling this module function directly and losing the
    // deps bag on the second tick.
    workerPollRef.current = setTimeout(() => self(true), POLL_INTERVAL_MS);
  }
}

export async function checkWorkerNow({ setCheckingForm, pollWorkerPending: pollFn }) {
  setCheckingForm(true);
  await pollFn(false);
  setCheckingForm(false);
}
