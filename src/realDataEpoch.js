// realDataEpoch.js — separates order history that was TYPED IN from order
// history that actually happened.
//
// THE PROBLEM
// When the app was built, Kevin entered past orders from memory. Those records
// are real in the sense that the meals happened, and useless in the sense that
// any COUNT over them measures data entry rather than reality. That single fact
// has killed a whole category of features by itself: seasonal firsts never
// shipped for it, "first ever cooked" is unusable for it, and dossierPrompts.js
// ignores order history entirely and says so in its header. Each of those was
// the right call, and each was a feature lost to a filter nobody could lift.
// (The passport's rare-dish badge was also blocked on this, and is staying dead
// on its own merits — a badge for what does not sell is not an achievement.)
//
// Drawing a line fixes all of them at once. Anything after the line is real and
// can be counted; anything before it is honest history and is simply excluded
// from statistics.
//
// WHY THE LINE IS DETECTED AND NOT ASKED FOR
// "When did you finish typing in the old orders?" is a question Kevin cannot
// answer accurately months later, and a wrong answer here silently corrupts
// every feature that depends on it. So this proposes a date from the shape of
// the data and asks him to confirm ONE tap, with the evidence shown. A proposal
// he can see the reasoning for is far more likely to be right than a date
// recalled under pressure.
//
// WHAT THE DETECTOR CAN AND CANNOT SEE
// Orders carry only `createdAt`, the date of the meal, and `uid()` is pure
// random — so there is NO record of when a row was typed. The entry burst is
// therefore invisible directly and has to be inferred from the shape of the
// dates. Two signals do that:
//
//   1. THE GAP. Backfilled history is patchy because it is remembered, and it
//      usually stops some distance before live operation begins. The largest
//      gap in an otherwise weekly business is the strongest single clue.
//   2. THE CADENCE. LTB runs on a weekly rhythm. Live weeks look regular;
//      remembered weeks look sparse and irregular, because Kevin recalled the
//      memorable ones and not the ordinary ones.
//
// Neither is proof, so this reports its own confidence and never applies a
// proposal by itself. An unconfirmed epoch means every dependent feature stays
// off, which is the same place they are today — this can only improve on the
// status quo, never silently worsen it.

const DAY = 86400000;
const WEEK = 7 * DAY;

const dayStart = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

// Ascending, de-duplicated order dates. House orders are included: they are
// still evidence of when the app was in use, even though they are excluded
// from money.
function orderDates(orders) {
  const out = [];
  for (const o of (orders || [])) {
    const t = Date.parse(o && o.createdAt);
    if (Number.isFinite(t)) out.push(t);
  }
  return out.sort((a, b) => a - b);
}

// How regular is the weekly rhythm over a span? Returns the fraction of weeks
// in the span that contain at least one order. Live operation approaches 1;
// remembered history sits far below it.
export function weeklyDensity(dates, from, to) {
  if (to <= from) return 0;
  const weeks = Math.max(1, Math.round((to - from) / WEEK));
  const seen = new Set();
  for (const t of dates) {
    if (t < from || t > to) continue;
    seen.add(Math.floor((t - from) / WEEK));
  }
  return Math.min(1, seen.size / weeks);
}

// Proposes where real data begins. Never decides.
//
// Returns { proposed, confidence, reason, evidence, candidates } where
// `proposed` is an ISO day string or null, and confidence is 'high' | 'low' |
// 'none'. A null proposal is a legitimate outcome and means "this history has
// no visible seam", which is what a fully live history looks like.
export function proposeEpoch(orders) {
  const dates = orderDates(orders);
  const none = (reason) => ({ proposed: null, confidence: 'none', reason, evidence: {}, candidates: [] });

  if (dates.length < 6) return none('Not enough order history to see a pattern yet.');

  const first = dates[0];
  const last = dates[dates.length - 1];
  if (last - first < 3 * WEEK) return none('All the order history sits inside about three weeks, so there is nothing to split.');

  // ── signal 1: the largest gap ──────────────────────────────────────────────
  let gapAt = null, gapLen = 0;
  for (let i = 1; i < dates.length; i++) {
    const g = dates[i] - dates[i - 1];
    if (g > gapLen) { gapLen = g; gapAt = dates[i]; }
  }

  // ── signal 2: the cadence split ────────────────────────────────────────────
  // Try every order date as a candidate boundary and score it by how much more
  // regular the AFTER side is than the BEFORE side. A backfill boundary should
  // show sparse-then-regular.
  const candidates = [];
  for (let i = 2; i < dates.length - 2; i++) {
    const cut = dates[i];
    if (cut - first < 2 * WEEK || last - cut < 3 * WEEK) continue;   // need room both sides
    const before = weeklyDensity(dates, first, cut);
    const after = weeklyDensity(dates, cut, last);
    candidates.push({ at: cut, before, after, lift: after - before });
  }
  candidates.sort((a, b) => b.lift - a.lift);
  const best = candidates[0] || null;

  // ── agreement ──────────────────────────────────────────────────────────────
  // The two signals pointing at the same place is what earns 'high'. They
  // measure different things (a hole in the data vs a change in rhythm), so
  // agreement is meaningful rather than circular.
  // Weighted by what each signal is actually worth, which took a fixture to
  // work out. A hole in the data is weak evidence on its own: a monthly-ish
  // history has holes everywhere and none of them mean anything. A rhythm
  // going from a third of weeks to every week is close to decisive by itself,
  // because that IS the difference between remembering and operating. So a
  // strong lift earns 'high' alone; a moderate one needs the gap to agree.
  const gapIsReal = gapLen >= 3 * WEEK;
  const liftIsReal = !!best && best.lift >= 0.35;
  const liftIsStrong = !!best && best.lift >= 0.6;
  const agree = liftIsStrong || (gapIsReal && liftIsReal && Math.abs(best.at - gapAt) <= 2 * WEEK);

  const evidence = {
    orderCount: dates.length,
    firstOrder: new Date(first).toISOString(),
    lastOrder: new Date(last).toISOString(),
    largestGapDays: Math.round(gapLen / DAY),
    gapEndsAt: gapAt ? new Date(gapAt).toISOString() : null,
    densityBefore: best ? Math.round(best.before * 100) : null,
    densityAfter: best ? Math.round(best.after * 100) : null,
  };

  if (agree) {
    // Prefer the cadence boundary as the date. The gap tells you roughly WHERE
    // to look; the rhythm change tells you exactly WHEN operation started, and
    // that is the line features actually need.
    const at = liftIsStrong ? best.at : gapAt;
    return {
      proposed: new Date(dayStart(at)).toISOString(),
      confidence: 'high',
      reason: `The weekly rhythm changes sharply here: ${Math.round(best.before * 100)}% of weeks have an order `
        + `before this date, ${Math.round(best.after * 100)}% after.`
        + (gapIsReal ? ` A ${Math.round(gapLen / DAY)}-day gap in the history agrees.` : ''),
      evidence,
      candidates: candidates.slice(0, 4),
    };
  }
  if (liftIsReal) {
    return {
      proposed: new Date(dayStart(best.at)).toISOString(),
      confidence: 'low',
      reason: `The weekly rhythm changes here (${Math.round(best.before * 100)}% of weeks have an order before, `
        + `${Math.round(best.after * 100)}% after), but there is no clear gap to confirm it. Worth a look before accepting.`,
      evidence,
      candidates: candidates.slice(0, 4),
    };
  }
  if (gapIsReal) {
    return {
      proposed: new Date(dayStart(gapAt)).toISOString(),
      confidence: 'low',
      reason: `There is a ${Math.round(gapLen / DAY)}-day hole in the history here, but the ordering rhythm `
        + 'looks the same on both sides, so this may just be a quiet stretch rather than the end of the backfill.',
      evidence,
      candidates: candidates.slice(0, 4),
    };
  }
  return {
    ...none('The history looks continuous — no gap and no change in rhythm. If none of it was typed in from memory, that is the right answer.'),
    evidence,
  };
}

// ── Using a confirmed epoch ──────────────────────────────────────────────────

// True when this order predates the epoch, i.e. it was entered from memory.
// With NO epoch set, nothing is backfilled — features stay in exactly the state
// they are in today rather than guessing.
export function isBackfilled(order, epoch) {
  if (!epoch || !order) return false;
  if (order.backfilled === true) return true;   // an explicit stamp always wins
  const t = Date.parse(order.createdAt);
  const e = Date.parse(epoch);
  return Number.isFinite(t) && Number.isFinite(e) && t < e;
}

// Stamps `backfilled: true` onto the orders that predate the epoch. Idempotent,
// and returns the SAME array when nothing changes so a caller can skip a write.
export function stampBackfilled(orders, epoch) {
  if (!epoch || !Array.isArray(orders)) return orders;
  let changed = false;
  const next = orders.map(o => {
    const should = isBackfilled(o, epoch);
    if (should === !!o.backfilled) return o;
    changed = true;
    return should ? { ...o, backfilled: true } : (() => { const c = { ...o }; delete c.backfilled; return c; })();
  });
  return changed ? next : orders;
}

// The filter every count-based feature should use. Without an epoch it returns
// everything, which is correct: an unconfirmed epoch must not silently start
// hiding a customer's orders.
export function realOrdersOnly(orders, epoch) {
  if (!epoch) return orders || [];
  return (orders || []).filter(o => !isBackfilled(o, epoch));
}

// What a feature can honestly say about its own basis. Used to label a figure
// as covering the real-data period rather than all of history.
export function epochSummary(orders, epoch) {
  const all = (orders || []).length;
  if (!epoch) return { epoch: null, real: all, backfilled: 0, label: 'all recorded orders' };
  const real = realOrdersOnly(orders, epoch).length;
  return {
    epoch,
    real,
    backfilled: all - real,
    label: `orders since ${new Date(epoch).toLocaleDateString()}`,
  };
}
