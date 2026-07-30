// tests/week_effort.mjs — the week effort total and its bands.
//
// WHY THIS EXISTS
//
// `effort` has been on every dish record for a while and was displayed nowhere,
// so nothing ever checked it. It now drives two surfaces: the per-dish readout
// on the Recipes tab, and the "Total Effort = X" line in the Week tab's conflict
// modal, which is colour-banded.
//
// The bands get boundary assertions specifically. An off-by-one on a band is
// invisible in the UI — a 10 rendering green looks perfectly reasonable, and
// nobody would notice for months. The thresholds live in equipmentConflict.js
// rather than in the modal so a second surface cannot invent its own.

import { effortBand, EFFORT_BANDS, weekEffortSummary } from '../src/equipmentConflict.js';
import { DISHES } from '../src/dishes.js';

let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? ' — ' + x : ''))); };

// ── Bands, at the boundaries ────────────────────────────────────────────────
ok('0 is green', effortBand(0) === 'green');
ok('9 is green', effortBand(9) === 'green');
ok('10 is yellow, not green', effortBand(10) === 'yellow');
ok('14 is still yellow', effortBand(14) === 'yellow');
ok('15 is red, not yellow', effortBand(15) === 'red');
ok('a very heavy week stays red', effortBand(40) === 'red');
ok('the thresholds are exported rather than inlined in the modal',
  EFFORT_BANDS.yellowAt === 10 && EFFORT_BANDS.redAt === 15);

// ── The summary ─────────────────────────────────────────────────────────────
{
  const w = weekEffortSummary(['Bo Ssam', 'Gumbo', 'Bolognese']);
  ok('the total is the sum of the rows it scored',
    w.total === w.rows.reduce((n, r) => n + r.effort, 0), String(w.total));
  ok('and it carries its own band so the modal does not recompute it',
    w.band === effortBand(w.total), w.band);

  const empty = weekEffortSummary([]);
  ok('an empty week totals zero rather than throwing', empty.total === 0);
  ok('and reads green', empty.band === 'green');

  const junk = weekEffortSummary(['Not A Real Dish']);
  ok('an unknown name is skipped, not scored as zero',
    junk.rows.length === 0 && junk.total === 0);

  const missing = weekEffortSummary(null);
  ok('a null selection is survivable', missing.total === 0);
}

// ── The data the bands read ─────────────────────────────────────────────────
{
  const noEffort = DISHES.filter(d => typeof d.effort !== 'number');
  ok('every dinner carries an effort score', noEffort.length === 0, noEffort.map(d => d.name).join(', '));
  const outOfRange = DISHES.filter(d => d.effort < 1 || d.effort > 5);
  ok('and every score is on the 1-5 scale', outOfRange.length === 0,
    outOfRange.map(d => `${d.name}=${d.effort}`).join(', '));

  // A realistic four-dinner week should be able to reach every band, or the
  // thresholds are not measuring anything about how Kevin actually cooks.
  const sorted = [...DISHES].sort((a, b) => a.effort - b.effort);
  const lightest = sorted.slice(0, 4).reduce((n, d) => n + d.effort, 0);
  const heaviest = sorted.slice(-4).reduce((n, d) => n + d.effort, 0);
  ok('the lightest plausible week lands green', effortBand(lightest) === 'green', String(lightest));
  ok('the heaviest plausible week lands red', effortBand(heaviest) === 'red', String(heaviest));
}

console.log(f === 0 ? '\nWEEK EFFORT: ALL PASS' : `\nWEEK EFFORT: ${f} FAILURES`);
process.exit(f ? 1 : 0);
