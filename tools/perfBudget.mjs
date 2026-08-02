// perfBudget.mjs — the customer pages must stay fast as features pile on.
//
//   node tools/perfBudget.mjs            report
//   node tools/perfBudget.mjs --strict   exit non-zero if a budget is exceeded
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
//
// The customer pages are standalone ES5 files served whole. Every feature added
// to them — personalization, the Carl filter, the request box, pack choices,
// scope confirmation — makes the file somebody reads in their kitchen bigger,
// and nothing has ever measured it. form.html has roughly doubled this year and
// the only reason anyone noticed is that a build log printed the byte count.
//
// The person reading this page is standing over a container deciding what to do
// with dinner, often on a phone, sometimes on bad signal. The reheat
// instructions loading is the whole job. Everything else is optional.
//
// ═══════════════════════════════════════════════════════════════════════════
// ADVISORY BY DEFAULT, AND THAT IS DELIBERATE
//
// Cloudflare runs `npm test` on deploy. A budget that fails the build takes the
// customer site down over a page being large, which is a worse outcome than the
// page being large. It reports; `--strict` is there for when someone is
// actively working on size and wants the failure.
//
// The budgets below are set ABOVE current sizes on purpose. A budget you are
// already violating on the day you write it teaches nothing except to ignore
// the tool. These are ceilings to notice approaching, not targets to hit.

import { readFileSync, existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const strict = process.argv.includes('--strict');

// Raw and gzipped both matter and for different reasons. Gzip is what crosses
// the wire; raw is what the phone parses, and parse time is the part that
// actually stalls a mid-range Android.
// SET ABOVE TODAY'S SIZES, deliberately. The first draft of this file used
// aspirational numbers and reported two pages at 186% and 229% on its very
// first run, which is the behaviour that teaches someone to ignore a tool. A
// budget is a ceiling to notice approaching, not a target to hit later.
//
// TIGHTENED Aug 1 after the logo came out of the two heavy pages. They were
// budgeted at 260 KB gzipped against actuals of 229 and 223; they now sit at 29
// and 24. A budget left at the old number would have permitted a 700% regression
// without a word, which is the same as not having one.
const BUDGETS = [
  { file: 'order.html', raw: 90, gz: 30, why: 'The landing page. First thing anyone sees.' },
  { file: 'form.html', raw: 150, gz: 45, why: 'The order form. Largest page and growing fastest.' },
  { file: 'menu.html', raw: 160, gz: 50, why: 'Browsing. Read before deciding.' },
  { file: 'main-menu.html', raw: 150, gz: 40, why: 'The kitchen page: reheat instructions. The critical path.' },
  { file: 'pipeline.html', raw: 70, gz: 25, why: 'Voting. Optional entirely.' },
];

// THE LOGO. The single biggest thing on the two heavy pages, by a distance.
//
// src/pages/_partials/ltb-logo.b64 is 90KB of base64 and is inlined THREE TIMES
// into form.html and main-menu.html. That is 270KB of a 365KB page — 73% of it —
// and it is why those two barely compress: gzip's window is 32KB, so three
// copies sitting 100KB apart cannot be deduplicated at all. Stripping the logo
// takes form.html from 229KB gzipped to 29KB.
//
// Not fixed here, on purpose. The fix is to serve the logo as a real asset and
// reference it by URL, which changes how the pages are served and is not
// something to do blind while nobody can load the site and check. It is
// reported instead, with the numbers, so the decision is Kevin's.
const LOGO = 'src/pages/_partials/ltb-logo.b64';

const kb = (n) => Math.round(n / 1024);

let over = 0;
let approaching = 0;
console.log('  Customer page sizes (KB, raw / gzipped):');

for (const b of BUDGETS) {
  if (!existsSync(b.file)) {
    console.log(`  · ${b.file} not present, skipped`);
    continue;
  }
  const buf = readFileSync(b.file);
  const raw = kb(statSync(b.file).size);
  const gz = kb(gzipSync(buf).length);
  const rawPct = Math.round((raw / b.raw) * 100);
  const gzPct = Math.round((gz / b.gz) * 100);
  const worst = Math.max(rawPct, gzPct);

  // Three states, because "under budget" and "at 96% of budget" are different
  // pieces of news and only one of them needs acting on.
  let mark = '✓';
  if (worst > 100) { mark = '✗'; over++; } else if (worst >= 85) { mark = '⚠'; approaching++; }
  console.log(`  ${mark} ${b.file.padEnd(16)} ${String(raw).padStart(4)} / ${String(gz).padStart(4)}   `
    + `budget ${b.raw} / ${b.gz}   (${worst}%)`);
  if (worst >= 85) console.log(`      ${b.why}`);
}

if (over > 0) {
  console.log(`\n  ${over} page(s) over budget.`);
  console.log('  The reheat instructions must load on a phone on bad signal in a kitchen.');
  console.log('  Optional features belong behind a flag or a later fetch, not in the shell.');
} else if (approaching > 0) {
  console.log(`\n  ${approaching} page(s) within 15% of budget. Worth knowing before the next feature.`);
}

// The single actionable finding, printed every run until it stops being true.
if (existsSync(LOGO)) {
  const logo = readFileSync(LOGO, 'utf8').trim();
  let inlined = 0;
  let wasted = 0;
  for (const b of BUDGETS) {
    if (!existsSync(b.file)) continue;
    const copies = readFileSync(b.file, 'utf8').split(logo).length - 1;
    if (copies > 1) { inlined++; wasted += logo.length * (copies - 1); }
  }
  if (inlined > 0) {
    console.log(`\n  · The ${kb(logo.length)}KB base64 logo is inlined more than once on ${inlined} page(s).`);
    console.log(`    About ${kb(wasted)}KB of duplication, and gzip cannot dedupe it: its window is 32KB`);
    console.log('    and the copies sit far further apart than that. Serving the logo as a real');
    console.log('    asset instead would take those pages from roughly 230KB gzipped to under 30KB.');
  }
}

console.log(over === 0 ? '\nPERF BUDGET: ALL WITHIN BUDGET' : `\nPERF BUDGET: ${over} OVER`);

// Advisory unless asked otherwise. See the header: a red gate here would black
// out the customer site to complain that a page is big.
process.exit(strict && over > 0 ? 1 : 0);
