// weekPlanner.js — #3 demand-aware week planning (engine, pure)
// Scores every dinner as a candidate for next week from real history:
// recency (weeks since last run), demand (avg units per run), margin, and
// equipment fit against the dishes already picked. All injected, no storage.
import { DISHES } from './dishes.js';
import { analyzeConflicts } from './equipmentConflict.js';
import { buildPortfolioSummary } from './dishReport.js';

const WEEK = 7 * 86400000;
const weekKey = (t) => Math.floor(new Date(t).getTime() / WEEK);

export function dishRunStats(dishName, orders) {
  const weeks = new Map(); // weekKey -> units
  for (const o of (orders || [])) {
    const t = o.createdAt; if (!t) continue;
    for (const it of (o.items || [])) {
      if (it.name !== dishName) continue;
      const k = weekKey(t);
      weeks.set(k, (weeks.get(k) || 0) + (Number(it.qty) || 1));
    }
  }
  if (!weeks.size) return { runs: 0, avgUnits: 0, weeksSinceLast: null };
  const keys = [...weeks.keys()];
  const last = Math.max(...keys);
  return {
    runs: weeks.size,
    avgUnits: Math.round(([...weeks.values()].reduce((a, b) => a + b, 0) / weeks.size) * 10) / 10,
    weeksSinceLast: Math.max(0, weekKey(Date.now()) - last),
  };
}

// scoreWeekCandidates(orders, currentPicks, ctx) → ranked candidates NOT yet
// picked. Score favors: hasn't run lately, sells well when run, healthy
// margin, no new red conflict with the current picks.
export function scoreWeekCandidates(orders, currentPicks = [], ctx = {}) {
  const picks = new Set(currentPicks);
  const port = new Map(buildPortfolioSummary(ctx).map(r => [r.name, r]));
  const baseRed = analyzeConflicts([...picks]).red.length;
  return DISHES.map(d => d.name).filter(n => !picks.has(n)).map(name => {
    const s = dishRunStats(name, orders);
    const p = port.get(name) || {};
    const redWith = analyzeConflicts([...picks, name]).red.length;
    const newConflicts = Math.max(0, redWith - baseRed);
    const recency = s.weeksSinceLast == null ? 3 : Math.min(6, s.weeksSinceLast) / 2; // never-run gets a fair shot
    const demand = Math.min(5, s.avgUnits);
    const margin = (p.worstMarginPct || 0) >= 45 ? 2 : (p.worstMarginPct || 0) >= 40 ? 1 : 0;
    return {
      name,
      score: Math.round((recency + demand + margin - newConflicts * 3) * 10) / 10,
      weeksSinceLast: s.weeksSinceLast, runs: s.runs, avgUnits: s.avgUnits,
      worstMarginPct: p.worstMarginPct ?? null, underFloor: !!p.underFloor,
      newConflicts,
    };
  }).sort((a, b) => b.score - a.score);
}
