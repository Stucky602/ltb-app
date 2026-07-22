// regularsIntel.js — #4 regulars intelligence (engine, pure)
// Kevin's frame: the menu changes weekly, so cadence ("orders every 2 weeks")
// is meaningless. The real signal is ATTACH RATE PER APPEARANCE: "Sara
// ordered Bolognese 4 of the 5 weeks it was on the menu." A dish "appeared"
// in a week iff anyone ordered it that week (a lower bound on menu presence,
// derived purely from order history — no extra bookkeeping).
const WEEK = 7 * 86400000;
const weekKey = (t) => Math.floor(new Date(t).getTime() / WEEK);

// customerName may be a single name OR an array of names (a merged regular's
// names + aliases) — merges must pay off in the intel, not just the linking.
const toNameSet = (n) => new Set((Array.isArray(n) ? n : [n]).map(x => String(x || '').trim().toLowerCase()).filter(Boolean));

export function attachRates(orders, customerName) {
  const nameSet = toNameSet(customerName);
  const dishWeeks = new Map();   // dish -> Set(weeks anyone ordered it)
  const custWeeks = new Map();   // dish -> Set(weeks THIS customer ordered it)
  for (const o of (orders || [])) {
    if (!o.createdAt) continue;
    const k = weekKey(o.createdAt);
    const mine = nameSet.has(String(o.customer || o.name || '').trim().toLowerCase());
    for (const it of (o.items || [])) {
      if (!dishWeeks.has(it.name)) dishWeeks.set(it.name, new Set());
      dishWeeks.get(it.name).add(k);
      if (mine) {
        if (!custWeeks.has(it.name)) custWeeks.set(it.name, new Set());
        custWeeks.get(it.name).add(k);
      }
    }
  }
  const out = [];
  for (const [dish, cw] of custWeeks) {
    const appearances = dishWeeks.get(dish).size;
    out.push({
      dish,
      ordered: cw.size,
      appearances,
      attachPct: Math.round((cw.size / appearances) * 100),
    });
  }
  // High attach on 1 appearance is noise — rank by (attach, ordered).
  return out.sort((a, b) => b.attachPct - a.attachPct || b.ordered - a.ordered);
}

// The customer's usual: their most-repeated item+variant combos, for prefill.
export function usualOrder(orders, customerName, limit = 4) {
  const nameSet = toNameSet(customerName);
  const counts = new Map();
  for (const o of (orders || [])) {
    if (!nameSet.has(String(o.customer || o.name || '').trim().toLowerCase())) continue;
    for (const it of (o.items || [])) {
      const key = it.name + '||' + (it.variant || '');
      const c = counts.get(key) || { name: it.name, variant: it.variant || '', times: 0, qtySum: 0 };
      c.times++; c.qtySum += Number(it.qty) || 1;
      counts.set(key, c);
    }
  }
  return [...counts.values()]
    .filter(c => c.times >= 2)
    .sort((a, b) => b.times - a.times)
    .slice(0, limit)
    .map(c => ({ ...c, usualQty: Math.round(c.qtySum / c.times) }));
}

// ─── Taste profile ───────────────────────────────────────────────────────────
// Everything here already exists in the data; nothing is inferred. The point is
// that it was scattered across order history, the regular record, and omakase
// notes, so "what is this person like" meant reading three places. Most useful
// when Kevin is deciding what to cook someone who did not choose a dish.
import { DISHES } from './dishes.js';
import { omakaseItemsOf, pastOmakasesFor } from './omakase.js';

export function buildTasteProfile(regular, linkedOrders) {
  if (!regular || regular.house) return null; // the house account is not a customer
  const orders = (linkedOrders || []).filter(o => !o.house);
  if (!orders.length) return null;

  const cuisineOf = {};
  // DISHES, not ALL_DINNERS: the menu builder strips everything except name
  // and variants, so cuisine only survives on the registry objects.
  DISHES.forEach(d => { if (d.cuisine) cuisineOf[d.name] = d.cuisine; });

  const dishTally = {};
  const cuisineTally = {};
  const spiceTally = {};
  let omakaseCount = 0;

  for (const o of orders) {
    omakaseCount += omakaseItemsOf(o).length;
    for (const it of (o.items || [])) {
      if (!it.name || it.omakase) continue;
      const qty = Number(it.qty) || 1;
      dishTally[it.name] = (dishTally[it.name] || 0) + qty;
      const cz = cuisineOf[it.name];
      if (cz) cuisineTally[cz] = (cuisineTally[cz] || 0) + qty;
      const sp = it.options && it.options.spice;
      if (sp != null && Number(sp) > 0) spiceTally[sp] = (spiceTally[sp] || 0) + 1;
    }
  }

  const rank = (tally) => Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => ({ name: k, n }));

  const spiceLevels = Object.keys(spiceTally).map(Number).sort((a, b) => a - b);
  const spiceRange = spiceLevels.length
    ? (spiceLevels[0] === spiceLevels[spiceLevels.length - 1]
      ? String(spiceLevels[0])
      : `${spiceLevels[0]}-${spiceLevels[spiceLevels.length - 1]}`)
    : null;

  return {
    orders: orders.length,
    topDishes: rank(dishTally).slice(0, 3),
    cuisines: rank(cuisineTally).slice(0, 3).map(c => ({ cuisine: c.name, n: c.n })),
    spiceRange,
    dietary: regular.dietary || '',
    spiceNote: regular.spice || '',
    omakaseCount,
    omakaseNotes: pastOmakasesFor(regular.id, orders, null)
      .map(p => p.note).filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i),
  };
}
