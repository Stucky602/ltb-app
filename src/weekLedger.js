// weekLedger.js — a forward-only record of what was actually on the menu each
// business week.
//
// WHY, and why it is not config-history: config-history exists for RESTORE and
// is capped at five entries. This exists for RECALL, needs to run for years,
// and answers a question the app cannot answer today at all: what did I cook
// last July. The catalog rotates weekly, produce rotates yearly, and the app
// currently has no concept of a year.
//
// THE MULTI-PUBLISH RULE (Kevin's, and it shapes the whole design): a single
// week gets published many times. Publish, add an omakase, publish again, add
// a notice, publish again. Only the FINAL state of a week is meaningful.
// So the ledger is keyed by business-week stamp and UPSERTED, never appended:
// every publish in a week overwrites that week's row. There is no dedup pass,
// no "which one was the real publish" heuristic, and nothing to get wrong,
// because the data structure makes repeats impossible rather than cleaning
// them up afterwards.
//
// FORWARD-ONLY: starts empty and fills from the next publish onward. It does
// NOT reconstruct the past from order history, because that history was
// backfilled and would measure data entry rather than what was actually
// cooked. In twelve months this answers seasonal questions honestly; today it
// answers nothing, and that is the correct trade.

import { groupKeyFor } from './utils.js';

// Years of weeks. ~52 rows a year, each a short name list, so a decade is
// still small. Capped only to stop unbounded growth if something goes wrong.
export const LEDGER_MAX_WEEKS = 600;

export function normalizeLedger(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.weeks)) return { weeks: [] };
  // groupKeyFor's stamp is epoch MILLISECONDS, a number. An earlier version of
  // this filtered for strings and therefore threw away every row on reload —
  // the ledger looked healthy (one row, always) while silently accumulating
  // nothing for years, which is the worst possible failure for a forward-only
  // record. Numbers only, and validated as finite.
  return {
    weeks: raw.weeks.filter(w => w && typeof w === 'object' && Number.isFinite(Number(w.stamp)))
      .map(w => ({ ...w, stamp: Number(w.stamp) })),
  };
}

// Upsert this week's dish list. `now` decides which business week we are in,
// via the same groupKeyFor every other week-shaped feature uses, so the ledger
// can never disagree with the Money tab about where a week starts.
export function recordWeek(ledger, dishes, now, extras) {
  const l = normalizeLedger(ledger);
  const at = now || new Date();
  const { stamp, label } = groupKeyFor({ createdAt: at.toISOString() }, 'week');
  const row = {
    stamp,
    label,
    dishes: [...new Set((dishes || []).filter(Boolean))],
    publishedAt: at.toISOString(),
    ...(extras && extras.paused ? { paused: true } : {}),
  };
  const others = l.weeks.filter(w => w.stamp !== stamp);
  const weeks = [...others, row].sort((a, b) => a.stamp - b.stamp);
  return { weeks: weeks.slice(-LEDGER_MAX_WEEKS) };
}

// Every week whose start falls in the same calendar month as `now`, from
// previous years only. The seasonal read, and the whole point of the file.
export function sameMonthPreviousYears(ledger, now) {
  const at = now || new Date();
  const month = at.getMonth(), year = at.getFullYear();
  return normalizeLedger(ledger).weeks
    .filter(w => {
      const d = new Date(w.stamp);
      return !Number.isNaN(d.getTime()) && d.getMonth() === month && d.getFullYear() < year;
    })
    .sort((a, b) => b.stamp - a.stamp);
}

// How many recorded weeks a dish has appeared on, and when it last did.
// Honest about its own shallowness: `weeksRecorded` lets a caller say "out of
// 6 weeks on record" rather than implying it knows the whole history.
export function dishFrequency(ledger, now) {
  const l = normalizeLedger(ledger);
  const counts = new Map();
  for (const w of l.weeks) {
    for (const d of w.dishes || []) {
      const prev = counts.get(d) || { dish: d, weeks: 0, last: null };
      prev.weeks += 1;
      if (prev.last == null || w.stamp > prev.last) prev.last = w.stamp;
      counts.set(d, prev);
    }
  }
  return {
    weeksRecorded: l.weeks.length,
    dishes: [...counts.values()].sort((a, b) => b.weeks - a.weeks || a.dish.localeCompare(b.dish)),
  };
}
