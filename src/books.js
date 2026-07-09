// books.js — #8 monthly P&L (engine, pure)
// Income from orders (revenue = full order total; COGS = per-item cost basis,
// same math as the Money tab). Optional receiptLog rows [{date, total, store}]
// become actual monthly spend when Kevin starts persisting them — the engine
// accepts them today so the storage hook is a one-line future add.
import { orderTotal, orderCostInfo } from './utils.js';

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

export function pnlToCsv(rows) {
  const head = 'month,orders,revenue,cogs,profit,margin_pct,receipt_spend,receipts,cogs_complete';
  return [head, ...rows.map(r =>
    [r.month, r.orders, r.revenue.toFixed(2), r.cogs.toFixed(2), r.profit.toFixed(2), r.marginPct, r.receiptSpend.toFixed(2), r.receipts, r.cogsComplete ? 'yes' : 'partial'].join(',')
  )].join('\n');
}
