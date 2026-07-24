// timeBanners.js — T1 (deadline pressure) + T2 (week rollover).
// Pure, testable in isolation. Deliberately depends on utils.js's
// groupKeyFor rather than reimplementing the Wed-start week math: T2 exists
// specifically to mark the SAME business-week boundary the Money tab already
// uses, and a second implementation of "what week is this" is exactly how
// two tabs end up disagreeing.
import { groupKeyFor } from './utils.js';

// The canonical week stamp for an arbitrary date, via the same machinery
// every order already goes through — never duplicated arithmetic.
function weekStampAt(date) {
  return groupKeyFor({ createdAt: date.toISOString() }, 'week').stamp;
}

// Local-calendar-day arithmetic (setDate), not ms subtraction: a week is 7
// CALENDAR days, and ms-based subtraction can drift across a DST boundary.
// This is the same caution the invariant suite already pins for epoch-week
// buckets (EC-12).
function daysBefore(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export function currentWeekInfo(now) {
  const n = now || new Date();
  const { label, stamp } = groupKeyFor({ createdAt: n.toISOString() }, 'week');
  const start = new Date(stamp);
  const end = daysBefore(start, -6); // Wed + 6 = the following Tuesday
  return { stamp, label, start, end };
}

// ── T1: the Sunday deadline ─────────────────────────────────────────────────
// Decision (Jul 24): orders close at midnight Sunday evening — i.e. the
// instant Sunday becomes Monday, local time. If "now" IS Sunday, the
// deadline is tonight; any other day, it's the coming Sunday.
export function msUntilDeadline(now) {
  const n = now || new Date();
  const daysUntilSunday = (7 - n.getDay()) % 7; // Sunday itself → 0 (tonight)
  const deadline = new Date(n.getFullYear(), n.getMonth(), n.getDate() + daysUntilSunday, 23, 59, 59, 999);
  return deadline.getTime() - n.getTime();
}

export function formatCountdown(ms) {
  if (ms == null || ms <= 0) return 'closed';
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// Pure counting: this business week's order count against the median of the
// trailing N weeks. House excluded (matches every other business metric);
// archived/delivered orders ARE counted (an order still belongs to the week
// it was PLACED in — the same "archived still counts as revenue" rule the
// Money tab already follows). Returns null median with too little history
// rather than a misleading number from 0-1 samples.
export function intakeVsMedian(orders, now, trailingWeeks = 5) {
  const n = now || new Date();
  const counts = new Map(); // week stamp -> order count
  for (const o of orders || []) {
    if (!o || o.house) continue;
    const { stamp } = groupKeyFor(o, 'week');
    counts.set(stamp, (counts.get(stamp) || 0) + 1);
  }
  const thisWeek = currentWeekInfo(n);
  const thisWeekCount = counts.get(thisWeek.stamp) || 0;

  const priorCounts = [];
  for (let k = 1; k <= trailingWeeks; k++) {
    const stamp = weekStampAt(daysBefore(thisWeek.start, k * 7));
    if (counts.has(stamp)) priorCounts.push(counts.get(stamp));
  }
  priorCounts.sort((a, b) => a - b);
  let median = null;
  if (priorCounts.length) {
    const mid = Math.floor(priorCounts.length / 2);
    median = priorCounts.length % 2
      ? priorCounts[mid]
      : (priorCounts[mid - 1] + priorCounts[mid]) / 2;
  }
  return { thisWeekCount, median, weeksSampled: priorCounts.length, weekLabel: thisWeek.label };
}

// ── T2: week rollover ────────────────────────────────────────────────────────
// lastSeenStamp: what this device had persisted as JOURNAL_KEY-style state
// (the caller owns storage; this stays pure). null/undefined means "never
// seen a week" — never treated as a rollover, so first launch is silent.
export function weekRolledOver(lastSeenStamp, now) {
  const { stamp, label } = currentWeekInfo(now);
  const rolled = lastSeenStamp != null && lastSeenStamp !== stamp;
  return { rolled, currentStamp: stamp, currentLabel: label };
}
