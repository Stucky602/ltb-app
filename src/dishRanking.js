// dishRanking.js — Kevin's own ranking of the menu, as a series.
//
// WHY A SERIES AND NOT A SNAPSHOT
// Kevin's reason for wanting this recorded at all was that it "will drift and
// cannot be recovered later". A single stored list answers that badly: it tells
// you what he thinks now and destroys what he thought before, which is the half
// that becomes interesting. So each ranking is kept whole and dated, exactly
// like the son's food log, and the drift between them is a derived view.
//
// HOW A RANKING IS PRODUCED
// Pairwise head-to-head, binary insertion, one question: "which would you
// rather eat tonight?" Roughly 90 comparisons over 27 dinners rather than the
// 351 a full round robin needs. That question is deliberately narrow — not
// margin, not effort, not how well it reheats. Those are all knowable from
// elsewhere in the app; what nothing else records is what he actually wants to
// eat, and mixing the others in produces a muddier answer to a question that
// already has a source.
//
// WHAT A LOW RANK DOES NOT MEAN — read this before building anything on top
// Every dish in this list already cleared the REHEAT GATE, which is the hardest
// constraint on the menu: a dish only qualifies if it reheats or finishes as
// good as or better than freshly made. So the set being ranked has already been
// filtered for quality, and what remains is preference spread inside a set that
// is uniformly good. Kevin, on seeing his own results: "the big key among all of
// them though is that all of them are FUCKING DELICIOUS. This includes the
// braises and things like the au poivre."
//
// Twenty-seventh place therefore means "my least favourite of twenty-seven
// things I would happily eat", NOT "weak dish". A numbered list running to 27
// reads like a scoreboard to anyone who has forgotten that, so:
//   - never label the bottom of this list as underperforming
//   - never feed it into a retire-this-dish suggestion
//   - never surface it to a customer in any form
// The one place rank SHOULD influence anything is menu variety, and even then
// as a nudge and not a rule.
//
// WHAT IT IS FOR
// Three comparisons, and the third is the one that could not exist before:
//   1. taste vs SALES — what he likes against what people actually order
//   2. taste vs TASTE OVER TIME — the drift between two rankings
//   3. taste vs HIS SON — his ranking against the food log in rowan.js
// None of these is a scoreboard. A dish he loves that nobody orders is not a
// failure, it is a fact about a friends-only menu that exists to please him too.

import { resolveDishId, dishNameFor } from './dishIdentity.js';

// The first ranking, taken Jul 26 2026 by head-to-head over all 27 dinners.
// Seeded so the record starts with real data rather than an empty state.
export const SEED_RANKING = {
  rankedAt: '2026-07-26T00:00:00.000Z',
  method: 'head-to-head, binary insertion, 27 dinners',
  order: [
    'Bolognese',
    'Boeuf Bourguignon (Beef Stew)',
    'Leblanc Inspired Japanese Curry',
    'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice',
    'Bo Ssam',
    'Chili',
    'Gumbo',
    'Mushroom Ragu',
    'Pappardelle with Vegetables and Mint',
    'Brunswick Stew',
    'Steak au Poivre',
    'Pasta with Homegrown Tomato Sauce',
    'Tea-Smoked Chicken with Dashi Polenta and Alabama White Sauce',
    'Mapo Eggplant',
    'Thai Basil Chicken (Pad Krapow Gai)',
    'Pecan Mole-Fesenjan, Beef and Kabocha',
    'Texas Gulf Shrimp or Tofu and Chinese Broccoli',
    'Indian Style Curry',
    'Orecchiette with Bitter Greens and Anchovies',
    'Saffron Pork Ragu',
    'Bone-In Pork Rib Chop with All the Fixings',
    'Shrimp or Tofu with Asparagus in Black Bean Sauce',
    'Pork Chop with Kabocha Purée and Charred Broccolini',
    'Tex-Mex Kit',
    'Stir Fried Long Beans with Ground Pork or Tofu',
    'Coriander Lamb Steak over Gigantes Beans',
    'Pork with Mustard Tarragon Cream Sauce',
  ],
};

const keyOf = (name) => resolveDishId({ name }) || name;

export function addRanking(list, ranking) {
  const entry = {
    rankedAt: ranking.rankedAt || new Date().toISOString(),
    method: ranking.method || 'head-to-head',
    order: (ranking.order || []).filter(Boolean),
  };
  return [...(list || []), entry].sort((a, b) => Date.parse(a.rankedAt) - Date.parse(b.rankedAt));
}

export function latest(list) {
  const l = list || [];
  return l.length ? l[l.length - 1] : null;
}

// 1-indexed position, or null when the dish was not in that ranking. Matched by
// stable id, so a dish renamed between two rankings still lines up.
export function rankOf(ranking, dish) {
  if (!ranking) return null;
  const want = keyOf(dish);
  const i = (ranking.order || []).findIndex(n => keyOf(n) === want);
  return i === -1 ? null : i + 1;
}

// ── 1. Drift between two rankings ───────────────────────────────────────────
// Returns movers, biggest change first. `delta` is positive when a dish moved
// UP the list, which is the direction a reader expects even though the numbers
// go down.
export function drift(list) {
  const l = list || [];
  if (l.length < 2) return { from: null, to: null, movers: [], entered: [], left: [] };
  const from = l[l.length - 2];
  const to = l[l.length - 1];
  const movers = [];
  const entered = [];
  for (const name of to.order) {
    const before = rankOf(from, name);
    const after = rankOf(to, name);
    if (before == null) { entered.push(name); continue; }
    if (before !== after) movers.push({ dish: name, from: before, to: after, delta: before - after });
  }
  const left = (from.order || []).filter(n => rankOf(to, n) == null);
  movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return { from, to, movers, entered, left };
}

// ── 2. Taste against sales ──────────────────────────────────────────────────
// `signal` is dishOrderSignal() from favorites.js: { name: { orders, ... } }.
// Sales rank is by order count, so rank 1 is the best seller.
//
// The interesting rows are the DISAGREEMENTS, and they are interesting in both
// directions. A dish Kevin rates highly that nobody orders is a candidate for
// better copy or a bad slot on the menu, not a bad dish. A dish that sells well
// and he rates low is doing real work he does not enjoy doing.
export function tasteVsSales(ranking, signal) {
  if (!ranking) return [];
  const sales = Object.entries(signal || {})
    .map(([dish, e]) => ({ dish, orders: e.orders || 0 }))
    .sort((a, b) => b.orders - a.orders);
  const salesRank = new Map();
  sales.forEach((s, i) => salesRank.set(keyOf(s.dish), i + 1));

  return (ranking.order || []).map((dish, i) => {
    const sr = salesRank.get(keyOf(dish));
    return {
      dish: dishNameFor(resolveDishId({ name: dish }), dish),
      tasteRank: i + 1,
      salesRank: sr || null,
      // Positive: sells better than he rates it. Negative: he rates it higher
      // than it sells. Null when it has never been ordered at all.
      gap: sr ? (i + 1) - sr : null,
      neverOrdered: !sr,
    };
  });
}

// ── 3. Taste against his son ────────────────────────────────────────────────
// `sonRanked` is topDishes() from rowan.js: [{ dish, average, entries }].
// Only dishes BOTH have an opinion on can be compared, so this stays empty
// until the food log has something in it, which is correct rather than sad.
export function tasteVsSon(ranking, sonRanked) {
  if (!ranking) return [];
  const byKey = new Map();
  (sonRanked || []).forEach((r, i) => byKey.set(keyOf(r.dish), { sonRank: i + 1, average: r.average, entries: r.entries }));
  const out = [];
  (ranking.order || []).forEach((dish, i) => {
    const s = byKey.get(keyOf(dish));
    if (!s) return;
    out.push({
      dish: dishNameFor(resolveDishId({ name: dish }), dish),
      tasteRank: i + 1,
      sonRank: s.sonRank,
      sonAverage: s.average,
      entries: s.entries,
      agree: Math.abs((i + 1) - s.sonRank) <= 2,
    });
  });
  return out.sort((a, b) => a.tasteRank - b.tasteRank);
}

// A ranking taken over a menu that has since changed is still valid history,
// but it should say so rather than quietly listing dishes that no longer exist.
export function staleness(ranking, currentDishNames) {
  if (!ranking) return { missing: [], added: [] };
  const inRanking = new Set((ranking.order || []).map(keyOf));
  const inMenu = new Set((currentDishNames || []).map(keyOf));
  return {
    missing: (ranking.order || []).filter(n => !inMenu.has(keyOf(n))),
    added: (currentDishNames || []).filter(n => !inRanking.has(keyOf(n))),
  };
}
