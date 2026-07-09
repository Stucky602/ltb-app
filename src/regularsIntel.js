// regularsIntel.js — #4 regulars intelligence (engine, pure)
// Kevin's frame: the menu changes weekly, so cadence ("orders every 2 weeks")
// is meaningless. The real signal is ATTACH RATE PER APPEARANCE: "Sara
// ordered Bolognese 4 of the 5 weeks it was on the menu." A dish "appeared"
// in a week iff anyone ordered it that week (a lower bound on menu presence,
// derived purely from order history — no extra bookkeeping).
const WEEK = 7 * 86400000;
const weekKey = (t) => Math.floor(new Date(t).getTime() / WEEK);

export function attachRates(orders, customerName) {
  const dishWeeks = new Map();   // dish -> Set(weeks anyone ordered it)
  const custWeeks = new Map();   // dish -> Set(weeks THIS customer ordered it)
  for (const o of (orders || [])) {
    if (!o.createdAt) continue;
    const k = weekKey(o.createdAt);
    const mine = (o.customer || o.name || '') === customerName;
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
  const counts = new Map();
  for (const o of (orders || [])) {
    if ((o.customer || o.name || '') !== customerName) continue;
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
