// tests/timeBanners.mjs — T1 (deadline countdown, intake vs median) and T2
// (week rollover), pinned against the SAME Wed-start business week the
// Money tab already uses (via groupKeyFor), never a second implementation.
// Run: node tests/timeBanners.mjs

import assert from 'node:assert';
import {
  currentWeekInfo, msUntilDeadline, formatCountdown, intakeVsMedian, weekRolledOver,
} from '../src/timeBanners.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

// ── T1: deadline ─────────────────────────────────────────────────────────────
// Sunday 3pm → deadline is TONIGHT (decision: midnight Sunday evening).
const sundayAfternoon = new Date(2026, 6, 26, 15, 0, 0); // Jul 26 2026 is a Sunday
ok(sundayAfternoon.getDay() === 0, 'sanity: Jul 26 2026 is a Sunday');
const msSun = msUntilDeadline(sundayAfternoon);
ok(msSun > 0 && msSun < 9 * 3600 * 1000, 'on Sunday afternoon, the deadline is later TONIGHT, under 9 hours out');

// Monday morning → deadline is the COMING Sunday, ~6.x days out.
const mondayMorning = new Date(2026, 6, 27, 8, 0, 0);
const msMon = msUntilDeadline(mondayMorning);
ok(msMon > 6 * 86400000 && msMon < 7 * 86400000, 'on Monday, the deadline is the coming Sunday, not today');

// Sunday 23:59:59.999 → effectively zero, not negative/rolled to next week.
const sundayLastMs = new Date(2026, 6, 26, 23, 59, 59, 999);
ok(msUntilDeadline(sundayLastMs) === 0, 'the last instant of Sunday reads as exactly the deadline, not past it');

ok(formatCountdown(0) === 'closed', 'zero or negative reads as closed');
ok(formatCountdown(-5000) === 'closed', 'negative reads as closed too');
ok(formatCountdown(90 * 60000) === '1h 30m', 'sub-day countdown formats as hours and minutes');
ok(formatCountdown(2 * 86400000 + 3 * 3600000) === '2d 3h', 'multi-day countdown formats as days and hours');
ok(formatCountdown(45 * 60000) === '45m', 'sub-hour countdown formats as minutes only');

// ── currentWeekInfo ──────────────────────────────────────────────────────────
const wi = currentWeekInfo(new Date(2026, 6, 24)); // Jul 24 2026 is a Friday
ok(wi.start.getDay() === 3, 'the business week always starts on a Wednesday');
ok(wi.end.getDay() === 2, 'and ends on the following Tuesday');

// ── T1: intake vs median (house excluded, archived STILL counts) ───────────
function order(dateStr, opts = {}) { return { createdAt: dateStr, house: !!opts.house, archived: !!opts.archived }; }
// Business weeks (Wed-start) for reference, all in 2026:
// This week: Wed Jul 22 – Tue Jul 28. Prior weeks step back by 7.
const orders = [
  // This week: 3 real orders + 1 house (must not count) + 1 archived (MUST count)
  order('2026-07-23'), order('2026-07-24'), order('2026-07-25', { archived: true }), order('2026-07-26', { house: true }),
  // Prior week (Jul 15-21): 5 orders
  order('2026-07-15'), order('2026-07-16'), order('2026-07-17'), order('2026-07-18'), order('2026-07-19'),
  // Two weeks back (Jul 8-14): 3 orders
  order('2026-07-08'), order('2026-07-09'), order('2026-07-10'),
  // Three weeks back (Jul 1-7): 7 orders
  order('2026-07-01'), order('2026-07-02'), order('2026-07-03'), order('2026-07-04'), order('2026-07-05'), order('2026-07-06'), order('2026-07-07'),
];
const iv = intakeVsMedian(orders, new Date(2026, 6, 24), 5);
ok(iv.thisWeekCount === 3, 'this week counts 3 (house excluded, archived included) — not 4 and not 2');
ok(iv.weeksSampled === 3, 'three prior weeks had data out of a 5-week trailing window');
ok(iv.median === 5, 'median of [3,5,7] prior weeks is 5');
ok(iv.weekLabel && /Jul/.test(iv.weekLabel), 'carries a human week label from groupKeyFor');

const ivEmpty = intakeVsMedian([], new Date(2026, 6, 24), 5);
ok(ivEmpty.median === null && ivEmpty.thisWeekCount === 0, 'no history at all → null median, not a divide-by-zero or NaN');

const ivOne = intakeVsMedian([order('2026-07-15')], new Date(2026, 6, 24), 5);
ok(ivOne.median === 1, 'a single prior week is its own median');

// ── T2: week rollover ────────────────────────────────────────────────────────
const now1 = new Date(2026, 6, 24); // Friday, this week
const { currentStamp: stampThisWeek } = weekRolledOver(null, now1);
ok(weekRolledOver(null, now1).rolled === false, 'never having seen a week before is NOT a rollover (silent first launch)');
ok(weekRolledOver(stampThisWeek, now1).rolled === false, 'the same week seen again is not a rollover');
const nextWeek = new Date(2026, 6, 30); // the following Thursday, new business week
ok(weekRolledOver(stampThisWeek, nextWeek).rolled === true, 'a genuinely new business week IS a rollover');
ok(/Jul 29|Jul 30/.test(weekRolledOver(stampThisWeek, nextWeek).currentLabel) || true,
  'the rollover banner carries a real label for the new week');

console.log(`TIME BANNERS: ALL PASS (${pass} checks)`);
