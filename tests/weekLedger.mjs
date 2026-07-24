// tests/weekLedger.mjs — the forward-only seasonal record.
//
// THE RULE THAT SHAPES IT (Kevin's): a single week gets published many times —
// menu, then an omakase, then a notice. Only the FINAL state of a week means
// anything. So the ledger UPSERTS by business-week stamp rather than
// appending, which makes duplicates structurally impossible instead of
// something a later dedup pass has to clean up.
//
// Run: node tests/weekLedger.mjs

import assert from 'node:assert';
import { recordWeek, normalizeLedger, sameMonthPreviousYears, dishFrequency, LEDGER_MAX_WEEKS } from '../src/weekLedger.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

// ── THE MULTI-PUBLISH RULE ──────────────────────────────────────────────────
const wed = new Date(2026, 6, 22, 10, 0, 0);   // Wed Jul 22 2026
const thu = new Date(2026, 6, 23, 14, 0, 0);   // same business week
const sun = new Date(2026, 6, 26, 23, 0, 0);   // still the same business week

let l = recordWeek(null, ['Gumbo', 'Chili'], wed);
ok(l.weeks.length === 1, 'first publish creates one week row');
l = recordWeek(l, ['Gumbo', 'Chili', 'Omakase'], thu);
l = recordWeek(l, ['Gumbo', 'Chili', 'Omakase', 'Bo Ssam'], sun);
ok(l.weeks.length === 1,
  'three publishes in ONE business week leave ONE row — repeats are impossible by construction, not cleaned up afterwards');
ok(l.weeks[0].dishes.length === 4 && l.weeks[0].dishes.includes('Bo Ssam'),
  'and the row holds the FINAL state of the week, not the first');

// A genuinely new business week is a new row.
const nextWed = new Date(2026, 6, 29, 10, 0, 0);
l = recordWeek(l, ['Bolognese'], nextWed);
ok(l.weeks.length === 2, 'the next business week gets its own row');
ok(l.weeks[0].stamp < l.weeks[1].stamp, 'rows stay in chronological order');

// ── Shape tolerance ─────────────────────────────────────────────────────────
ok(normalizeLedger(null).weeks.length === 0, 'a missing ledger normalizes to empty');
ok(normalizeLedger({ weeks: [null, 'junk', { stamp: 1784678400000 }] }).weeks.length === 1, 'junk rows are dropped');
// The regression that caused this: groupKeyFor's stamp is a NUMBER, and
// filtering for strings silently discarded every row on reload.
const roundTrip = normalizeLedger(JSON.parse(JSON.stringify(recordWeek(null, ['Gumbo'], wed))));
ok(roundTrip.weeks.length === 1,
  'a ledger survives a JSON round-trip — it is persisted and reloaded every boot, so this is the path that matters');
ok(recordWeek(null, ['A', 'A', 'B'], wed).weeks[0].dishes.length === 2, 'duplicate dish names within a week collapse');
ok(recordWeek(null, [], wed).weeks[0].dishes.length === 0, 'an empty week still records, so a paused week is not a hole');
ok(recordWeek(null, ['A'], wed, { paused: true }).weeks[0].paused === true, 'a paused week is marked as such');

// ── The seasonal read ───────────────────────────────────────────────────────
let hist = recordWeek(null, ['Gumbo'], new Date(2025, 6, 16, 10, 0, 0));   // Jul 2025
hist = recordWeek(hist, ['Chili'], new Date(2024, 6, 17, 10, 0, 0));       // Jul 2024
hist = recordWeek(hist, ['Bolognese'], new Date(2025, 11, 3, 10, 0, 0));   // Dec 2025
hist = recordWeek(hist, ['Bo Ssam'], new Date(2026, 6, 22, 10, 0, 0));     // Jul 2026, this year
const july = sameMonthPreviousYears(hist, new Date(2026, 6, 24));
ok(july.length === 2, 'the seasonal read returns the same month from PREVIOUS years only');
ok(!july.some(w => w.dishes.includes('Bo Ssam')), "this year's own weeks are not history yet");
ok(!july.some(w => w.dishes.includes('Bolognese')), 'a different month is excluded');
ok(july[0].stamp > july[1].stamp, 'most recent year first');
ok(sameMonthPreviousYears(null, new Date()).length === 0, 'an empty ledger has no season to recall');

// ── Frequency, honest about its own shallowness ─────────────────────────────
const f = dishFrequency(hist);
ok(f.weeksRecorded === 4, 'frequency reports how many weeks are ON RECORD, so a caller cannot imply it knows the whole history');
ok(f.dishes.every(d => d.weeks === 1), 'each dish appeared once across those weeks');
ok(f.dishes.every(d => Number.isFinite(d.last)), 'and carries when it last appeared');

// ── Bounded ─────────────────────────────────────────────────────────────────
let big = null;
for (let i = 0; i < 5; i++) big = recordWeek(big, ['X'], new Date(2020, 0, 1 + i * 7, 10, 0, 0));
ok(big.weeks.length === 5, 'five distinct weeks, five rows');
ok(LEDGER_MAX_WEEKS > 500, 'the cap allows a decade of weeks before it ever bites');

console.log(`WEEK LEDGER: ALL PASS (${pass} checks)`);
