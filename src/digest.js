// digest.js — #6 the weekly business brain (engine, pure)
// One Monday-morning read: what sold, money movement, quiet regulars, cost
// alerts, and a proposed week — all synthesized from machinery that already
// exists (books, regulars intel, portfolio, composer). No new data collection.
import { orderTotal, orderCostInfo, regularDisplayName, regularAllNames, isHouseOrder } from './utils.js';
import { attachRates } from './regularsIntel.js';
import { composeWeek } from './weekPlanner.js';
import { buildPortfolioSummary } from './dishReport.js';

const WEEK = 7 * 86400000;

function scoreDish(r) {
  const pct = r.hasPassthrough ? r.worstValueAddPct : r.worstMarginPct;
  return { name: r.name, pct: Math.round(pct * 10) / 10, underFloor: r.underFloor };
}

// marginAlerts(port) → { underFloor, watch }, each sorted worst-first.
// underFloor = below the hard 45% floor, a real problem. watch = under 47%
// but not under floor, a heads-up. Kept as two lists on purpose: sorting
// them together let a 46.9% watch item bump a 30.9% emergency off a
// truncated top-4 list (found July 2026). No slicing here — truncation is
// a DISPLAY decision for whoever renders this, not an engine one.
export function marginAlerts(port) {
  const scored = (port || []).map(scoreDish);
  const byWorst = (a, b) => a.pct - b.pct;
  return {
    underFloor: scored.filter(r => r.underFloor).sort(byWorst),
    watch: scored.filter(r => !r.underFloor && r.pct < 47).sort(byWorst),
  };
}

// computeMarginAlerts(ctx) → marginAlerts, but standalone. Only needs the
// cost maps (no orders/regulars), so it's cheap enough to run on every
// render for a nav badge — doesn't require opening the full digest panel.
export function computeMarginAlerts(ctx = {}) {
  return marginAlerts(buildPortfolioSummary(ctx));
}

function windowStats(orders, from, to) {
  let revenue = 0, cost = 0, count = 0;
  const dishUnits = new Map();
  for (const o of (orders || [])) {
    // Archived = Delivered + tidied — real sales, always counted.
    // House orders are not sales at all: no revenue, no profit, no order
    // count, and they must not appear in "top sellers" either.
    if (isHouseOrder(o)) continue;
    const t = new Date(o.createdAt || 0).getTime();
    if (!(t >= from && t < to)) continue;
    count++;
    revenue += orderTotal(o.items, o.jarSwaps, o.containerReturns, o.discountType, o.discountValue, o.customCharges, o.waiveSurcharge);
    cost += orderCostInfo(o).cost;
    for (const it of (o.items || [])) {
      dishUnits.set(it.name, (dishUnits.get(it.name) || 0) + (Number(it.qty) || 1));
    }
  }
  const top = [...dishUnits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return { count, revenue: Math.round(revenue * 100) / 100, profit: Math.round((revenue - cost) * 100) / 100, top };
}

// Regulars who used to order steadily but have gone quiet: last order 3+
// weeks ago AND at least 3 lifetime orders (so one-timers aren't "quiet").
function quietRegulars(regulars, orders, now) {
  const out = [];
  for (const r of (regulars || [])) {
    // The house account is not a lead to re-engage. Nudging your wife because
    // she "hasn't ordered in 3 weeks" is the kind of thing this section would
    // do with a straight face.
    if (r && r.house) continue;
    const names = new Set(regularAllNames(r).map(n => n.toLowerCase()));
    const mine = (orders || []).filter(o => names.has(String(o.customer || '').toLowerCase()) || o.regularId === r.id);
    if (mine.length < 3) continue;
    const last = Math.max(...mine.map(o => new Date(o.createdAt || 0).getTime()));
    const weeks = Math.floor((now - last) / WEEK);
    if (weeks >= 3) out.push({ display: regularDisplayName(r), weeks, orders: mine.length });
  }
  return out.sort((a, b) => b.weeks - a.weeks).slice(0, 5);
}

// buildWeeklyDigest(orders, regulars, ctx) → structured sections for the panel.
// ctx: { liveCostMap, baseCostMap, now? }
export function buildWeeklyDigest(orders, regulars, ctx = {}) {
  const now = ctx.now || Date.now();
  const thisWk = windowStats(orders, now - WEEK, now);
  const prevWk = windowStats(orders, now - 2 * WEEK, now - WEEK);

  const port = buildPortfolioSummary(ctx);
  const marginWatch = marginAlerts(port);

  const drifters = port
    .filter(r => Math.abs(r.maxDriftPct) >= 8)
    .sort((a, b) => Math.abs(b.maxDriftPct) - Math.abs(a.maxDriftPct))
    .slice(0, 4)
    .map(r => ({ name: r.name, driftPct: r.maxDriftPct }));

  // Reheat report: customer taps from kitchen pages, aggregated by dish.
  // 'bad' verdicts on the same dish are a TECHNIQUE signal, not a customer one.
  const fbByDish = new Map();
  for (const o of (orders || [])) {
    for (const f of (o.feedback || [])) {
      const rec = fbByDish.get(f.dish) || { dish: f.dish, good: 0, meh: 0, bad: 0, notes: [] };
      rec[f.verdict] = (rec[f.verdict] || 0) + 1;
      if (f.note) rec.notes.push({ verdict: f.verdict, note: f.note });
      fbByDish.set(f.dish, rec);
    }
  }
  const reheatReport = [...fbByDish.values()]
    .sort((a, b) => (b.bad * 2 + b.meh) - (a.bad * 2 + a.meh))
    .slice(0, 6);

  const proposal = composeWeek(orders, ctx);

  return {
    week: thisWk,
    prior: prevWk,
    revenueDeltaPct: prevWk.revenue > 0 ? Math.round(((thisWk.revenue - prevWk.revenue) / prevWk.revenue) * 100) : null,
    quiet: quietRegulars(regulars, orders, now),
    marginWatch,
    drifters,
    proposal,
    reheatReport,
  };
}
