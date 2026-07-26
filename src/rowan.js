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
export function makeEntry({ dish, rating, note, familyNote, fairTest = true, at }) {
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
  };
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
