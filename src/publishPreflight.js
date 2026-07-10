// publishPreflight.js — pure pre-publish audit for the week's menu.
//
// WHY THIS EXISTS: the July 10 spotlight incident. The spotlight pipeline was
// correct end to end, but the published week simply didn't have a spotlight
// dish selected, so the customer form showed nothing and it looked like a bug.
// The failure was SILENT. This module makes every publish loudly self-checking:
// warnings render above the publish button, so "you're about to publish a week
// with no spotlight" is impossible to miss. Warnings never BLOCK a publish —
// Kevin may be doing it on purpose — they just make the state visible.
//
// Pure function: inject the registry-derived data, get back a warnings list.
// Fully covered by fixtures in tests/invariants.mjs.

import { ALL_DINNERS } from './menu.js';
import { buildDishReport } from './dishReport.js';

// preflightWeek(selectedNames, ctx?) → [{ level, code, text }]
//   level: 'warn' (probably a mistake) | 'info' (worth knowing)
//   ctx:   { liveCostMap, baseCostMap, floorPct } — same shape dishReport takes.
export function preflightWeek(selectedNames, ctx = {}) {
  const selected = selectedNames || [];
  const out = [];
  const byName = new Map(ALL_DINNERS.map(d => [d.name, d]));
  const picked = selected.map(n => byName.get(n)).filter(Boolean);

  // 1. Empty week — almost certainly a misclick on Publish.
  if (picked.length === 0) {
    out.push({ level: 'warn', code: 'empty', text: 'No dinners selected — this publishes an empty weekly menu.' });
    return out; // nothing else meaningful to check
  }

  // 2. Spotlight audit — the July 10 lesson. The form renders a "Spotlight
  // Dinner of the Week" section ONLY when one is selected here.
  const spots = picked.filter(d => d.spotlight);
  if (spots.length === 0) {
    out.push({ level: 'warn', code: 'no-spotlight', text: 'No spotlight dinner selected — the "Spotlight Dinner of the Week" section will not appear on the order form.' });
  } else if (spots.length > 1) {
    out.push({ level: 'info', code: 'multi-spotlight', text: `${spots.length} spotlight dinners selected (${spots.map(s => s.name).join(', ')}) — the form will list all of them under one spotlight header.` });
  }

  // 3. Margin audit — any selected dish whose SMALL variant sits under the
  // floor gets named, with the suggested price to hold it. Deliberate
  // under-floor pricing exists (Lamb M/L), which is why Small-only matches
  // the portfolio radar's basis and stays quiet about intentional discounts.
  for (const d of picked) {
    const rep = buildDishReport(d.name, ctx);
    if (!rep) continue;
    const smalls = rep.variants.filter(v => /small/i.test(v.label));
    const basis = smalls.length ? smalls : (rep.variants.length === 1 ? rep.variants : []);
    for (const v of basis) {
      if (v.underFloor) {
        const hold = v.priceToHoldFloor ? ` (~$${v.priceToHoldFloor.suggested} would hold it)` : '';
        out.push({ level: 'info', code: 'under-floor', text: `${d.name} — ${v.label} is under the ${rep.floorPct}% floor${hold}.` });
      }
    }
  }

  return out;
}
