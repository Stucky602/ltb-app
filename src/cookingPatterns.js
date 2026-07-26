// cookingPatterns.js — what the order data says Kevin actually cooks.
//
// He caught two of these himself: braise-heavy and sauce-heavy. The point of
// this module is not to tell him something he does not know, it is to say it
// FASTER and with a number attached, and to catch the third one he has not
// noticed yet.
//
// EVERYTHING HERE READS THROUGH realOrdersOnly(). That is not optional. Order
// history was typed in from memory when the app was built, so a count over raw
// orders measures DATA ENTRY, not cooking. Before the real-data epoch existed
// this module could not have been written honestly, which is why it was blocked
// on it. With no epoch confirmed every function below returns `unavailable`
// rather than a plausible-looking number — a wrong answer here would be
// invisible, because it would look exactly like a right one.
//
// HOUSE ORDERS COUNT. They are not sales, and they ARE cooking. A dish Kevin
// makes for his family every week is something he cooks a lot, and excluding it
// because no money changed hands would answer the wrong question.

import { realOrdersOnly } from './realDataEpoch.js';
import { resolveDishId, dishNameFor } from './dishIdentity.js';
import { DISHES } from './dishes.js';

const WEEK = 7 * 86400000;
const keyOf = (name) => resolveDishId({ name }) || name;

// A dish's registry record, for the tags the pattern read leans on.
const byName = new Map(DISHES.map(d => [keyOf(d.name), d]));

// Kevin's own categories, derived from the registry rather than invented here.
// `technique` is the interesting axis: it is the one he keeps catching himself
// on, and nothing else in the app reports it.
function techniqueOf(dish) {
  const d = byName.get(keyOf(dish));
  if (!d) return 'other';
  const n = String(d.name || '').toLowerCase();
  // `equipment` is a registry field whose shape is not guaranteed to be an
  // array — it is a scheduling vocabulary and has been written as both. Coerced
  // rather than assumed, because a .join on a non-array throws and would take
  // the whole panel down over a tag nobody reads.
  const eq = d.equipment;
  const tags = String(Array.isArray(eq) ? eq.join(' ') : (eq || '')).toLowerCase();
  if (/stew|braise|bourguignon|curry|chili|gumbo|ragu|ssam|mole/.test(n)) return 'braise';
  if (/pasta|pappardelle|orecchiette|bolognese|noodle/.test(n)) return 'pasta';
  if (/steak|chop|rib|lamb|poivre/.test(n)) return 'plate';
  if (/stir|wok|basil|black bean|long beans|broccoli/.test(n) || /wok/.test(tags)) return 'wok';
  return 'other';
}

// The core read. Returns `unavailable: true` when there is no epoch, because
// counting typed-in history would answer a question nobody asked.
export function cookingPatterns(orders, epoch, opts = {}) {
  if (!epoch) {
    return {
      unavailable: true,
      reason: 'Order history was typed in from memory when the app was built, so counting it would measure data entry rather than cooking. Confirm where the real data starts and this fills in.',
    };
  }
  const real = realOrdersOnly(orders || [], epoch);
  const now = opts.now || Date.now();

  const byDish = new Map();
  const weeks = new Set();
  let units = 0;

  for (const o of real) {
    const t = Date.parse(o.createdAt);
    if (Number.isFinite(t)) weeks.add(Math.floor(t / WEEK));
    for (const it of (o.items || [])) {
      if (!it.name || it.omakase) continue;
      const k = keyOf(it.name);
      const q = Number(it.qty) || 1;
      units += q;
      const b = byDish.get(k) || {
        dish: dishNameFor(resolveDishId({ name: it.name }), it.name),
        units: 0, weeks: new Set(), last: 0,
      };
      b.units += q;
      if (Number.isFinite(t)) { b.weeks.add(Math.floor(t / WEEK)); b.last = Math.max(b.last, t); }
      byDish.set(k, b);
    }
  }

  const weekCount = Math.max(1, weeks.size);
  const rows = [...byDish.values()]
    .map(b => ({
      dish: b.dish,
      units: b.units,
      weeksRun: b.weeks.size,
      // Share of everything cooked in the real-data window.
      share: units ? b.units / units : 0,
      weeksSinceLast: b.last ? Math.floor((now - b.last) / WEEK) : null,
      technique: techniqueOf(b.dish),
    }))
    .sort((a, b) => b.units - a.units);

  // ── rotating or repeating ────────────────────────────────────────────────
  // The honest version of "am I actually varying the menu". Distinct dishes per
  // week is the measure that answers it; total dishes cooked does not, because
  // cooking the same four things forty times looks busy and is not variety.
  const distinct = rows.length;
  const perWeek = distinct / weekCount;

  // ── technique concentration ──────────────────────────────────────────────
  // Braise-heavy and sauce-heavy are the two Kevin spotted. This puts a number
  // on them and shows anything else sitting alongside.
  const techUnits = new Map();
  for (const r of rows) techUnits.set(r.technique, (techUnits.get(r.technique) || 0) + r.units);
  const techniques = [...techUnits.entries()]
    .map(([technique, u]) => ({ technique, units: u, share: units ? u / units : 0 }))
    .sort((a, b) => b.units - a.units);

  // Dishes on the menu that have not been cooked once in the real window. Not a
  // scold: some are seasonal, some are new. It is the list worth glancing at.
  const cooked = new Set(rows.map(r => keyOf(r.dish)));
  const neverRun = DISHES.map(d => d.name).filter(n => !cooked.has(keyOf(n)));

  return {
    unavailable: false,
    since: epoch,
    weeks: weekCount,
    orders: real.length,
    units,
    distinct,
    dishesPerWeek: Math.round(perWeek * 10) / 10,
    rows,
    techniques,
    neverRun,
    // The top dish's share of everything. A single number for "am I leaning on
    // one thing", which is easier to feel than a table.
    topShare: rows.length ? rows[0].share : 0,
  };
}

// ── Does he cook what he says he likes? ─────────────────────────────────────
// Crosses the pattern read against his own head-to-head ranking. The gaps are
// the interesting part in BOTH directions, and neither is a failure:
//   - rated high, rarely cooked → often a cost or effort reason he already
//     knows, and occasionally a dish he has simply forgotten to schedule
//   - rated low, cooked often → a workhorse. Something that sells, or is easy,
//     or that someone always asks for.
export function tasteVsPractice(patterns, ranking) {
  if (!patterns || patterns.unavailable || !ranking) return [];
  const rank = new Map();
  (ranking.order || []).forEach((n, i) => rank.set(keyOf(n), i + 1));
  const cookRank = new Map();
  patterns.rows.forEach((r, i) => cookRank.set(keyOf(r.dish), i + 1));

  const out = [];
  for (const [k, tasteRank] of rank) {
    const cooked = cookRank.get(k);
    const row = patterns.rows.find(r => keyOf(r.dish) === k);
    out.push({
      dish: row ? row.dish : dishNameFor(k, k),
      tasteRank,
      cookRank: cooked || null,
      units: row ? row.units : 0,
      // Positive: cooked more often than he rates it. Negative: rated above how
      // often it actually gets made.
      gap: cooked ? tasteRank - cooked : null,
      neverCooked: !cooked,
    });
  }
  return out.sort((a, b) => a.tasteRank - b.tasteRank);
}
