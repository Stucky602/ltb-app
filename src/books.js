// books.js — #8 monthly P&L (engine, pure)
// Income from orders (revenue = full order total; COGS = per-item cost basis,
// same math as the Money tab). Optional receiptLog rows [{date, total, store}]
// become actual monthly spend when Kevin starts persisting them — the engine
// accepts them today so the storage hook is a one-line future add.
import { orderTotal, orderCostInfo, isHouseOrder } from './utils.js';

const monthKey = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function monthlyPnl(orders, receiptLog = []) {
  const months = new Map();
  const row = (k) => {
    if (!months.has(k)) months.set(k, { month: k, orders: 0, revenue: 0, cogs: 0, cogsComplete: true, receiptSpend: 0, receipts: 0 });
    return months.get(k);
  };
  for (const o of (orders || [])) {
    // Archived = Delivered + tidied away (the ONLY archive path requires
    // Delivered status) — so archived orders are REAL completed sales and
    // MUST count. There is no cancellation concept in the order model.
    if (!o.createdAt) continue;
    // House orders (the wife) are free and never enter the books: no revenue,
    // no COGS, no order count. Filtered HERE rather than at the call site so
    // every present and future caller of monthlyPnl gets it for free.
    if (isHouseOrder(o)) continue;
    const r = row(monthKey(o.createdAt));
    r.orders++;
    r.revenue += orderTotal(o.items, o.jarSwaps, o.containerReturns, o.discountType, o.discountValue, o.customCharges, o.waiveSurcharge);
    const c = orderCostInfo(o);
    r.cogs += c.cost;
    if (!c.complete) r.cogsComplete = false;
  }
  for (const rec of (receiptLog || [])) {
    if (!rec || !rec.date) continue;
    const r = row(monthKey(rec.date));
    r.receiptSpend += Number(rec.total) || 0;
    r.receipts++;
  }
  const out = [...months.values()].sort((a, b) => b.month.localeCompare(a.month));
  out.forEach(r => {
    r.revenue = Math.round(r.revenue * 100) / 100;
    r.cogs = Math.round(r.cogs * 100) / 100;
    r.receiptSpend = Math.round(r.receiptSpend * 100) / 100;
    r.profit = Math.round((r.revenue - r.cogs) * 100) / 100;
    r.marginPct = r.revenue > 0 ? Math.round((r.profit / r.revenue) * 100) : 0;
  });
  return out;
}

// ── Blended-margin trend (SPC-style) ─────────────────────────────────────────
// What erodes a food business is slow and invisible: blended food cost creeping
// up two points a month, no single order ever showing it. This rolls monthlyPnl
// into a chronological margin series and measures the drift over a trailing
// window, flagging when the blended margin has dropped past a threshold. It's
// statistical process control applied to margin: the process is "the whole
// menu's food cost," the control limit is the drop threshold.
//
// opts: { window (months to compare across, default 2), dropThreshold (points
// of margin drop that trips the alert, default 3) }. Returns:
//   { series:[{month, marginPct, revenue, cogs, profit}...] oldest→newest,
//     latestPct, priorPct, deltaPts (latest−prior; negative = margin eroded),
//     alert (bool), window, dropThreshold }
// deltaPts is latest margin minus the margin `window` months earlier. A drop of
// dropThreshold or more (deltaPts ≤ −dropThreshold) sets alert.
export function marginTrend(orders, opts = {}) {
  const window = opts.window ?? 2;
  const dropThreshold = opts.dropThreshold ?? 3;
  // monthlyPnl returns newest→oldest; reverse to chronological for a trend.
  const series = monthlyPnl(orders || [], []).slice().reverse().map(r => ({
    month: r.month, marginPct: r.marginPct, revenue: r.revenue, cogs: r.cogs, profit: r.profit,
  }));
  if (series.length === 0) {
    return { series: [], latestPct: null, priorPct: null, deltaPts: null, alert: false, window, dropThreshold };
  }
  const latest = series[series.length - 1];
  const priorIdx = Math.max(0, series.length - 1 - window);
  const prior = series[priorIdx];
  const deltaPts = (series.length > 1 && prior !== latest)
    ? Math.round((latest.marginPct - prior.marginPct) * 10) / 10
    : null;
  const alert = deltaPts != null && deltaPts <= -dropThreshold;
  return { series, latestPct: latest.marginPct, priorPct: prior !== latest ? prior.marginPct : null, deltaPts, alert, window, dropThreshold };
}

// ── Cost drivers over a window (the "driven by" attribution) ──────────────────
// A trend that says "margin's dropping" without saying WHY isn't worth much.
// This names the biggest ingredient movers behind the drift, straight from
// costHistory ([{ t, id, cost }], t Date-parseable) measured against the
// baseline cost map — the same data costOverTime already consumes, so no
// dependency on the receipt engine. For each ingredient touched in the window,
// compare its latest in-window cost to its baseline and rank by absolute % move
// (only movers that got PRICIER by default, since those erode margin).
//
// nameOf is injected (App passes an id→name lookup) so this stays free of an
// ingredients import. opts: { window (days back, default 60), top (default 3),
// pricierOnly (default true) }. Returns:
//   [{ id, name, baseline, latest, pctMove }...] up to `top`, biggest first.
export function costDrivers(costHistory, baseCostMap, nameOf, opts = {}) {
  const windowDays = opts.window ?? 60;
  const top = opts.top ?? 3;
  const pricierOnly = opts.pricierOnly !== false;
  const cutoff = Date.now() - windowDays * 86400000;
  const base = baseCostMap || {};
  // Latest in-window cost per ingredient id.
  const latestById = new Map();
  for (const h of (costHistory || [])) {
    if (!h || h.id == null || !(h.cost > 0) || h.t == null) continue;
    const ms = new Date(h.t).getTime();
    if (!Number.isFinite(ms) || ms < cutoff) continue;
    const prev = latestById.get(h.id);
    if (!prev || ms >= prev.ms) latestById.set(h.id, { cost: h.cost, ms });
  }
  const movers = [];
  for (const [id, { cost }] of latestById) {
    const baseline = base[id];
    if (!(baseline > 0)) continue;
    const pctMove = Math.round(((cost - baseline) / baseline) * 1000) / 10;
    if (pricierOnly && pctMove <= 0) continue;
    movers.push({ id, name: nameOf ? (nameOf(id) || id) : id, baseline, latest: cost, pctMove });
  }
  movers.sort((a, b) => Math.abs(b.pctMove) - Math.abs(a.pctMove));
  return movers.slice(0, top);
}

export function pnlToCsv(rows) {
  const head = 'month,orders,revenue,cogs,profit,margin_pct,receipt_spend,receipts,cogs_complete';
  return [head, ...rows.map(r =>
    [r.month, r.orders, r.revenue.toFixed(2), r.cogs.toFixed(2), r.profit.toFixed(2), r.marginPct, r.receiptSpend.toFixed(2), r.receipts, r.cogsComplete ? 'yes' : 'partial'].join(',')
  )].join('\n');
}
