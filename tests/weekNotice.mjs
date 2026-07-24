// tests/weekNotice.mjs — the heads-up banner, publish side.
//
// This feature was wired end to end EXCEPT that publishWeek built its payload
// without a notice field, so the value WeekTab passed died there and no
// customer page could ever have shown it. These checks pin the exact contract
// WeekTab actually uses (verified against WeekTab.jsx, not guessed) plus the
// clear-on-uncheck rule, which is the half that is easy to get subtly wrong.
//
// Run: node tests/weekNotice.mjs

import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { extractNotice, normalizeNotice, NOTICE_MAX } from '../src/weekNotice.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

// ── normalizeNotice ─────────────────────────────────────────────────────────
ok(normalizeNotice('  hello  ') === 'hello', 'trims');
ok(normalizeNotice(null) === '' && normalizeNotice(undefined) === '', 'null/undefined normalize to empty');
ok(normalizeNotice(true) === '', 'a bare boolean carries no message and must never publish "true"');
ok(normalizeNotice('x'.repeat(400)).length === NOTICE_MAX,
  'clamped so a notice cannot become an essay that pushes the menu off the screen');

// ── WeekTab's actual shape ──────────────────────────────────────────────────
// Both publish paths send: { requestCounts, favorites, notice: on ? text.trim() : '' }
const armed = { requestCounts: {}, favorites: [], notice: 'Delivery slides to Thursday this week.' };
const unarmed = { requestCounts: {}, favorites: [], notice: '' };

ok(extractNotice(null, armed) === 'Delivery slides to Thursday this week.',
  'an armed banner publishes its text (normal publish path)');
ok(extractNotice({ paused: true, pausedMsg: 'Back next week.' }, armed) === 'Delivery slides to Thursday this week.',
  'an armed banner publishes on the PAUSED path too — an off week is when a heads-up matters most');

// ── THE CLEAR CONTRACT ──────────────────────────────────────────────────────
ok(extractNotice(null, unarmed) === '',
  'unchecked publishes an empty string, which CLEARS the live banner rather than leaving it stranded');
ok(extractNotice(null, { requestCounts: {}, favorites: [] }) === '',
  'a publish with no notice key at all also clears — absence must never mean "keep the old one"');
ok(extractNotice(null, null) === '' && extractNotice(null, undefined) === '',
  'no extras at all still clears');
ok(extractNotice(null, { notice: '   ' }) === '', 'whitespace-only is not a message');

// ── Junk never strands a banner ─────────────────────────────────────────────
ok(extractNotice(42, 'not-an-object') === '', 'junk arguments clear rather than throw');
ok(extractNotice(null, { notice: 12345 }) === '12345', 'a number is stringified rather than dropped');
ok(typeof extractNotice(null, { notice: {} }) === 'string', 'a malformed value still yields a string, never a throw');

// ── The contract is pinned against WeekTab itself ───────────────────────────
// If the key WeekTab sends is ever renamed, this fails loudly instead of the
// banner silently going dead again — which is exactly how this bug shipped.
const wt = new URL('../src/components/WeekTab.jsx', import.meta.url);
if (existsSync(wt)) {
  const src = readFileSync(wt, 'utf8');
  const sends = (src.match(/notice:\s*noticeOn\s*\?\s*notice\.trim\(\)\s*:\s*''/g) || []).length;
  ok(sends === 2, `WeekTab sends the notice on BOTH publish paths (found ${sends}/2) — normal and paused`);
  ok(/WEEK_NOTICE_KEY/.test(src), 'WeekTab persists the banner so it survives a reload');
} else {
  console.log('  (WeekTab.jsx not in this checkout — contract pin skipped)');
}

// ── The config key WeekTab imports must exist ───────────────────────────────
// A missing named export is a BUILD-STOPPING error in esbuild, not a warning.
const cfg = readFileSync(new URL('../src/config.js', import.meta.url), 'utf8');
ok(/export const WEEK_NOTICE_KEY\b/.test(cfg),
  'config.js exports WEEK_NOTICE_KEY — WeekTab imports it, and without it the bundle cannot build');

console.log(`WEEK NOTICE: ALL PASS (${pass} checks)`);
