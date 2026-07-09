// weekPlanner.js — #3 demand-aware week planning (engine, pure)
// Scores every dinner as a candidate for next week from real history:
// recency (weeks since last run), demand (avg units per run), margin, and
// equipment fit against the dishes already picked. All injected, no storage.
import { DISHES } from './dishes.js';
import { analyzeConflicts } from './equipmentConflict.js';
import { buildPortfolioSummary } from './dishReport.js';
import { PASSTHROUGH_IDS, resolveDishVariant } from './dishCosting.js';

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

// ═══ MENU COMPOSER — proposes a balanced week, with WHY for every pick ═══
// Take-it-or-leave-it recommendations: greedy pick from the scored candidates
// while enforcing balance rules Kevin applies by feel — no equipment pileups,
// not too many pasta dishes, cuisine spread, and a price range that gives
// customers both an affordable entry and something premium.

const isPastaDish = (name) => {
  const d = DISHES.find(x => x.name === name);
  if (!d) return false;
  return d.variants.some(v => (resolveDishVariant(name, v.label) || []).some(l => PASSTHROUGH_IDS.has(l.id)));
};

export function composeWeek(orders, ctx = {}, opts = {}) {
  const count = opts.count || 6;
  const ranked = scoreWeekCandidates(orders, [], ctx);
  const picks = [];
  const cuisineCount = {};
  let pastaCount = 0;

  for (const cand of ranked) {
    if (picks.length >= count) break;
    const d = DISHES.find(x => x.name === cand.name);
    const why = [];

    // Balance gates
    const pasta = isPastaDish(cand.name);
    if (pasta && pastaCount >= 2) continue;
    const cz = d?.cuisine || 'Other';
    if ((cuisineCount[cz] || 0) >= 2) continue;
    const withPick = analyzeConflicts([...picks.map(p => p.name), cand.name]);
    if (withPick.red.length > analyzeConflicts(picks.map(p => p.name)).red.length) continue;
    // Soft equipment spread: don't stack 3+ dishes on the same fixed resource
    // (three wok dishes is a legal but miserable cook day).
    const eq = d?.equipment?.fixed || [];
    const fixedUse = {};
    for (const p of picks) for (const r of (DISHES.find(x => x.name === p.name)?.equipment?.fixed || [])) fixedUse[r] = (fixedUse[r] || 0) + 1;
    if (eq.some(r => (fixedUse[r] || 0) >= 2)) continue;

    // The WHY, in plain language
    if (cand.weeksSinceLast == null) why.push("hasn't run yet, worth a debut");
    else if (cand.weeksSinceLast >= 4) why.push(`hasn't run in ${cand.weeksSinceLast} weeks`);
    else if (cand.weeksSinceLast >= 2) why.push(`last ran ${cand.weeksSinceLast} weeks ago`);
    if (cand.avgUnits >= 3) why.push(`sells ~${cand.avgUnits} per run`);
    else if (cand.runs >= 2) why.push(`steady seller (${cand.runs} runs)`);
    if (cand.worstMarginPct != null && cand.worstMarginPct >= 50) why.push(`strong margin (${cand.worstMarginPct}%)`);
    else if (cand.underFloor) why.push('margin is tight, watch pricing');
    if (!why.length) why.push('rounds out the week');

    picks.push({ name: cand.name, cuisine: cz, why, score: cand.score });
    cuisineCount[cz] = (cuisineCount[cz] || 0) + 1;
    if (pasta) pastaCount++;
  }

  // Price-spread note (advisory, not a gate)
  const notes = [];
  const prices = picks.map(p => {
    const d = DISHES.find(x => x.name === p.name);
    return d ? Math.min(...d.variants.map(v => v.price)) : 0;
  });
  if (prices.length && Math.min(...prices) > 40) notes.push('No entry-priced dish under $40 this week. Consider swapping one in.');

  return { picks, notes };
}
