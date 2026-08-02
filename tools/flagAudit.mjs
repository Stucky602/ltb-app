// flagAudit.mjs — does each flag actually do anything, and where?
//
//   node tools/flagAudit.mjs
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
//
// Kevin staged flags on and the pages looked identical. Three separate causes
// turned up, and none of them was visible from the flag panel — which shows a
// stage for every flag whether or not anything reads it. A panel that looks
// the same for a working flag and a dead one is how a feature gets declared
// broken when it was never wired.
//
// This walks the BUILT pages and the source, and reports for each flag:
//   * which surfaces read it
//   * whether it resolves per-customer, per-config, or not at all
//   * what its default is on both halves
//
// It is ADVISORY. Cloudflare runs `npm test` on deploy and a dead flag should
// not black out the site.

import { readFileSync, existsSync } from 'node:fs';
import { FLAGS, DEFAULT_FLAGS } from '../src/featureFlags.js';

const PAGES = ['order.html', 'menu.html', 'form.html', 'main-menu.html', 'pipeline.html'];

// How a page can learn a flag's value, and they are NOT equivalent:
//
//   personalized — window.__ltbFlag(id). Resolved PER CUSTOMER by the worker
//                  and delivered by personalize.js. This is the ONLY path that
//                  can express the owner, testers, and percent stages.
//   config       — read straight off the published config's customerFlags.
//                  Sees the STAGE, not a per-customer answer, so it can only
//                  really distinguish on from off.
//   opts         — passed in as an argument by whatever renders the page.
const READS = [
  { kind: 'personalized', re: (id) => new RegExp(`__ltbFlag\\(['"]${id}['"]\\)`) },
  { kind: 'personalized', re: (id) => new RegExp(`__ltbPersonal\\.flags\\.${id}\\b`) },
  { kind: 'config', re: (id) => new RegExp(`customerFlags\\.${id}\\b`) },
];

const workerSrc = existsSync('worker.js') ? readFileSync('worker.js', 'utf8') : '';
const workerDefaults = {};
{
  const m = workerSrc.match(/const FLAG_DEFAULTS = \{([^}]*)\}/);
  if (m) {
    for (const pair of m[1].split(',')) {
      const kv = pair.split(':');
      if (kv.length === 2) workerDefaults[kv[0].trim()] = kv[1].trim().replace(/['"]/g, '');
    }
  }
}

const pageText = {};
for (const p of PAGES) if (existsSync(p)) pageText[p] = readFileSync(p, 'utf8');

// companion.js renders the kitchen page from `opts`, so a flag consumed there
// is only live if something PASSES it.
const companion = existsSync('src/companion.js') ? readFileSync('src/companion.js', 'utf8') : '';

let dead = 0;
let mismatched = 0;
console.log('  FLAG AUDIT — what actually reads each flag\n');

for (const f of FLAGS) {
  const id = f.id;
  const surfaces = [];
  for (const [page, text] of Object.entries(pageText)) {
    for (const r of READS) {
      if (r.re(id).test(text) && !surfaces.some(s => s.page === page && s.kind === r.kind)) {
        surfaces.push({ page, kind: r.kind });
      }
    }
  }
  const viaOpts = new RegExp(`opts\\.${id}\\b`).test(companion);
  if (viaOpts) surfaces.push({ page: 'companion.js (kitchen page)', kind: 'opts' });

  const appDefault = (DEFAULT_FLAGS[id] || {}).stage || '?';
  const wkDefault = workerDefaults[id] || '(absent)';
  const agree = appDefault === wkDefault;
  if (!agree) mismatched++;

  if (!surfaces.length) {
    dead++;
    console.log(`  ✗ ${id.padEnd(16)} NOTHING READS IT.  app:${appDefault} worker:${wkDefault}`);
    continue;
  }

  const where = surfaces.map(s => `${s.page}[${s.kind}]`).join(', ');
  const mark = agree ? '·' : '⚠';
  console.log(`  ${mark} ${id.padEnd(16)} ${where}`);
  console.log(`      app:${appDefault} worker:${wkDefault}${agree ? '' : '   ← DEFAULTS DISAGREE'}`);

  // A flag read ONLY through the personalized path cannot be seen by a visitor
  // with no device token, because personalize.js returns early before fetching.
  const onlyPersonalized = surfaces.every(s => s.kind === 'personalized');
  if (onlyPersonalized) {
    console.log('      personalized only — invisible to a browser that has never ordered');
  }
}

console.log('');
if (dead) {
  console.log(`  ${dead} flag(s) have NO consumer. Staging them changes nothing, and the`);
  console.log('  panel gives no hint of that. Each one carries a comment in');
  console.log('  src/featureFlags.js saying WHY and what it would need to go live.');
}
if (mismatched) {
  console.log(`  ${mismatched} flag(s) default differently in the app and the worker.`);
  console.log('  The worker default is what an unpublished week resolves against.');
}
console.log(dead === 0 ? '\nFLAG AUDIT: every flag has a consumer' : '\nFLAG AUDIT: REPORTED');
