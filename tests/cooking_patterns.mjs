// cooking_patterns.mjs — what the order data says Kevin actually cooks.
//
// The assertion that matters most is the FIRST one: with no real-data epoch
// confirmed, this must refuse to answer. Order history was typed in from memory
// when the app was built, so a count over raw orders measures data entry. A
// wrong answer here would be invisible, because it would look exactly like a
// right one — which is why "unavailable" has to be a real return value rather
// than a zero.

import { cookingPatterns, tasteVsPractice } from '../src/cookingPatterns.js';
import { DISHES } from '../src/dishes.js';

let p = 0, f = 0;
// (condition, name, detail) — matches how the calls below are written.
const ok = (c, n, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? ' — ' + x : ''))); };

const WEEK = 7 * 86400000;
const T0 = Date.parse('2026-05-01');
const EPOCH = new Date(T0).toISOString();
const mk = (week, items, extra = {}) => ({
  id: 'o' + week + Math.random(), customer: 'C', status: 'Delivered', archived: true,
  createdAt: new Date(T0 + week * WEEK).toISOString(),
  items: items.map(n => ({ name: n, variant: 'Small (~4)', qty: 1 })), ...extra,
});

// ── the refusal ─────────────────────────────────────────────────────────────
{
  const r = cookingPatterns([mk(1, ['Chili'])], null);
  ok(r.unavailable === true, 'with NO epoch it refuses to answer rather than counting typed-in history');
  ok(/typed in from memory/.test(r.reason), 'and it says why, so the empty panel is not a mystery');
}

// ── the basic read ──────────────────────────────────────────────────────────
const ORDERS = [
  mk(-4, ['Chili']),                       // BEFORE the epoch: must be excluded
  mk(1, ['Chili', 'Bolognese']),
  mk(2, ['Chili']),
  mk(3, ['Chili', 'Gumbo']),
  mk(4, ['Bolognese']),
];
{
  const r = cookingPatterns(ORDERS, EPOCH, { now: T0 + 5 * WEEK });
  ok(!r.unavailable, 'with an epoch it answers');
  ok(r.orders === 4, 'the pre-epoch order is excluded from the count', String(r.orders));
  ok(r.units === 6, 'units counted across the real window only', String(r.units));
  ok(r.rows[0].dish === 'Chili' && r.rows[0].units === 3, 'the most-cooked dish leads');
  ok(r.rows[0].weeksRun === 3, 'and it reports how many distinct weeks it ran');
  ok(r.distinct === 3, 'three distinct dishes');
  ok(Math.abs(r.topShare - 0.5) < 1e-9, 'the top dish share is a real fraction', String(r.topShare));
}

// ── house orders COUNT ──────────────────────────────────────────────────────
// They are not sales and they ARE cooking. Excluding them because no money
// changed hands would answer a different question than the one being asked.
{
  const withHouse = [...ORDERS, mk(5, ['Gumbo'], { house: true })];
  const a = cookingPatterns(ORDERS, EPOCH, { now: T0 + 6 * WEEK });
  const b = cookingPatterns(withHouse, EPOCH, { now: T0 + 6 * WEEK });
  ok(b.units === a.units + 1, 'a house order adds to what he cooked');
}

// ── rotating vs repeating ───────────────────────────────────────────────────
{
  const same = [1, 2, 3, 4, 5, 6].map(w => mk(w, ['Chili']));
  const varied = [1, 2, 3, 4].map(w => mk(w, ['Chili', 'Gumbo', 'Bolognese']));
  const s = cookingPatterns(same, EPOCH, { now: T0 + 7 * WEEK });
  const v = cookingPatterns(varied, EPOCH, { now: T0 + 5 * WEEK });
  ok(s.dishesPerWeek < v.dishesPerWeek,
    'cooking one thing six times scores lower on variety than three things four times');
  ok(s.topShare === 1, 'and a single-dish run reports a top share of everything');
}

// ── technique concentration ─────────────────────────────────────────────────
// The number behind "I'm braise-heavy", which Kevin spotted himself.
{
  const braisey = [1, 2, 3].flatMap(w => [mk(w, ['Chili']), mk(w, ['Gumbo'])]);
  const r = cookingPatterns(braisey, EPOCH, { now: T0 + 4 * WEEK });
  ok(r.techniques[0].technique === 'braise', 'braises lead when he cooks braises');
  ok(r.techniques[0].share === 1, 'and the share is the real fraction');
}

// ── never run ───────────────────────────────────────────────────────────────
{
  const r = cookingPatterns(ORDERS, EPOCH, { now: T0 + 5 * WEEK });
  ok(r.neverRun.length === DISHES.length - 3, 'every menu dish not cooked in the window is listed');
  ok(!r.neverRun.includes('Chili'), 'and a dish he did cook is not on it');
}

// ── taste against practice ──────────────────────────────────────────────────
{
  const r = cookingPatterns(ORDERS, EPOCH, { now: T0 + 5 * WEEK });
  const ranking = { order: ['Bolognese', 'Chili', 'Gumbo'] };
  const tv = tasteVsPractice(r, ranking);
  const bol = tv.find(x => x.dish === 'Bolognese');
  const chi = tv.find(x => x.dish === 'Chili');
  ok(bol.tasteRank === 1 && bol.cookRank === 2, 'his favourite is only the second most cooked');
  ok(bol.gap === -1, 'a negative gap means he rates it above how often he makes it');
  ok(chi.gap === 1, 'a positive gap means it gets cooked more than he rates it');
  ok(tasteVsPractice({ unavailable: true }, ranking).length === 0,
    'and with no epoch there is nothing to compare');
}

console.log(f === 0 ? '\nCOOKING PATTERNS: ALL PASS' : `\nCOOKING PATTERNS: ${f} FAILURES`);
process.exit(f ? 1 : 0);
