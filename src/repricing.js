// ─── Repricing scoreboard ────────────────────────────────────────────────────
// Kevin moves prices deliberately (a margin review, a dish that turned out to
// be cheap to make) and then has no way to see whether volume answered. The
// audit log already records every price change with a date, and orders already
// record what sold; this crosses the two.
//
// The numbers come from the ORDER ITEMS AS STORED. An order carries the price
// and cost that were true when it was placed, so a repricing shows up as a real
// step change. Recomputing old orders against today's registry would erase
// exactly the signal this is trying to measure.
import { SOURCES } from './auditLog.js';

const DAY = 86400000;

function windowStats(orders, dish, variant, from, to) {
  let units = 0, revenue = 0, margin = 0;
  for (const o of orders) {
    if (o.house) continue;
    const t = new Date(o.createdAt || 0).getTime();
    if (!(t >= from && t < to)) continue;
    for (const it of (o.items || [])) {
      if (it.name !== dish) continue;
      if (variant && it.variant !== variant) continue;
      const qty = Number(it.qty) || 1;
      const price = Number(it.price) || 0;
      const cost = Number(it.cost) || 0;
      units += qty;
      revenue += price * qty;
      margin += (price - cost) * qty;
    }
  }
  return { units, revenue: Math.round(revenue * 100) / 100, margin: Math.round(margin * 100) / 100 };
}

function perWeek(stats, days) {
  const weeks = days / 7;
  if (!(weeks > 0)) return { units: 0, revenue: 0, margin: 0 };
  return {
    units: Math.round((stats.units / weeks) * 10) / 10,
    revenue: Math.round(stats.revenue / weeks),
    margin: Math.round(stats.margin / weeks),
  };
}

// Returns one row per price change, newest first. `afterDays` under a week
// means the verdict is not in yet, and the UI says so rather than pretending.
export function repricingScoreboard(auditLog, orders, opts = {}) {
  const windowDays = opts.windowDays || 28;
  const now = opts.now || Date.now();
  const list = (orders || []);
  const rows = [];

  for (const e of (auditLog || [])) {
    if (!e || e.field !== 'price' || e.source !== SOURCES.DEPLOY) continue;
    if (e.from == null || e.to == null || e.from === e.to) continue;
    const target = String(e.target || '');
    const sep = target.indexOf('::');
    if (sep === -1) continue;
    const dish = target.slice(0, sep);
    const variant = target.slice(sep + 2);
    const at = new Date(e.at || 0).getTime();
    if (!at) continue;

    const beforeFrom = at - windowDays * DAY;
    const afterTo = Math.min(now, at + windowDays * DAY);
    const afterDays = Math.max(0, Math.round((afterTo - at) / DAY));

    const before = windowStats(list, dish, variant, beforeFrom, at);
    const after = windowStats(list, dish, variant, at, afterTo);

    rows.push({
      key: target + '@' + e.at,
      dish,
      variant,
      from: e.from,
      to: e.to,
      at: e.at,
      windowDays,
      afterDays,
      tooEarly: afterDays < 7,
      before: { ...before, perWeek: perWeek(before, windowDays) },
      after: { ...after, perWeek: perWeek(after, Math.max(afterDays, 1)) },
    });
  }

  return rows.sort((a, b) => new Date(b.at) - new Date(a.at));
}
