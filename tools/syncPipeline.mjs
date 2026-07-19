// syncPipeline.mjs — pipeline vote-key consistency gate (Jul 18).
//
// pipelineDishes.js is CANON for every pipeline dish's vote key. This tool
// checks that the two OTHER places the key lives agree with it:
//   • worker.js  PIPELINE_DISHES  (the vote whitelist; deploys by paste but is
//                                  versioned here, so this is pure source scan)
//   • pipeline.html  data-dish     (the customer voting cards)
//
// Report-only: NO --write. pipeline.html and worker.js edits stay deliberate
// (a card's copy and a whitelist retirement are human decisions). Exit 1 on any
// drift so the gate blocks the deploy, same contract as syncMainMenu.
//
// STATUS: canon entries may carry status:'shipped' | 'killed'. A dish that has
// shipped to the real menu (e.g. Tea-Smoked Chicken) must be RETIRED from the
// pipeline: commented-out in the worker whitelist and absent from pipeline.html.
// This tool enforces exactly that end state. Default (no status) == 'testing',
// which must be live in both surfaces.
//
//   node tools/syncPipeline.mjs   → report drift (exit 1 if any)

import { readFileSync } from 'fs';
import { PIPELINE_DISHES } from '../src/pipelineDishes.js';

const ROOT = new URL('..', import.meta.url).pathname;
const workerSrc = readFileSync(ROOT + 'worker.js', 'utf8');
const pipelineHtml = readFileSync(ROOT + 'pipeline.html', 'utf8');

let drift = 0;
const F = (msg) => { console.log('  ✗ ' + msg); drift++; };

// ── Canon partitioned by status ──────────────────────────────────────────────
const testing = PIPELINE_DISHES.filter(d => !d.status || d.status === 'testing');
const shipped = PIPELINE_DISHES.filter(d => d.status === 'shipped' || d.status === 'killed');
const canonKeys = new Set(PIPELINE_DISHES.map(d => d.key));

// ── Parse the worker's PIPELINE_DISHES block ─────────────────────────────────
// Distinguish LIVE entries ('X',) from RETIRED ones (//   'X',). A retired dish
// stays in the source as a commented tombstone so its history is legible.
const wStart = workerSrc.indexOf('const PIPELINE_DISHES = [');
const wEnd = workerSrc.indexOf('];', wStart);
if (wStart < 0 || wEnd < 0) {
  F('could not locate PIPELINE_DISHES in worker.js — scan needs updating');
} else {
  const block = workerSrc.slice(wStart, wEnd);
  const liveWorker = new Set();
  const retiredWorker = new Set();
  for (const line of block.split('\n')) {
    const m = line.match(/^(\s*)(\/\/\s*)?'((?:\\.|[^'])*)'\s*,/);
    if (!m) continue;
    const key = m[3];
    if (m[2]) retiredWorker.add(key); else liveWorker.add(key);
  }

  // ── pipeline.html data-dish set ────────────────────────────────────────────
  const htmlKeys = new Set(
    [...pipelineHtml.matchAll(/data-dish="([^"]+)"/g)].map(m => m[1])
  );

  // ── Rule 1: every TESTING dish is live in the worker and present in html ────
  for (const d of testing) {
    if (!liveWorker.has(d.key)) {
      F(`"${d.key}" is testing in canon but NOT live in worker PIPELINE_DISHES ` +
        `(missing, or accidentally commented out)`);
    }
    if (!htmlKeys.has(d.key)) {
      F(`"${d.key}" is testing in canon but has no data-dish card in pipeline.html`);
    }
  }

  // ── Rule 2: every SHIPPED/KILLED dish is retired everywhere ─────────────────
  for (const d of shipped) {
    if (liveWorker.has(d.key)) {
      F(`"${d.key}" is ${d.status} in canon but STILL LIVE in worker PIPELINE_DISHES ` +
        `— comment it out (retire), don't delete (keeps the tombstone)`);
    }
    if (htmlKeys.has(d.key)) {
      F(`"${d.key}" is ${d.status} in canon but still has a card in pipeline.html — remove it`);
    }
  }

  // ── Rule 3: no key in either surface that canon doesn't know ────────────────
  for (const key of liveWorker) {
    if (!canonKeys.has(key)) {
      F(`worker PIPELINE_DISHES has live "${key}" with no entry in pipelineDishes.js ` +
        `— add it to canon or remove it from the worker`);
    }
  }
  for (const key of htmlKeys) {
    if (!canonKeys.has(key)) {
      F(`pipeline.html has data-dish "${key}" with no entry in pipelineDishes.js`);
    }
  }

  // ── Rule 4: title and diet in canon match the card in pipeline.html ─────────
  for (const d of testing) {
    // title
    const titleRe = new RegExp(
      'data-dish="' + d.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '"[^>]*>\\s*<div class="dish-name">(.*?)</div>', 's');
    const tm = pipelineHtml.match(titleRe);
    if (tm) {
      const cardTitle = tm[1].replace(/\s+/g, ' ').trim();
      if (cardTitle !== d.title) {
        F(`"${d.key}" title mismatch:\n      canon: ${d.title}\n      html:  ${cardTitle}`);
      }
    }
    // diet
    const dietRe = new RegExp(
      'data-dish="' + d.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '"(?:\\s+data-diet="([^"]+)")?', '');
    const dm = pipelineHtml.match(dietRe);
    const htmlDiet = (dm && dm[1]) ? dm[1] : null;
    if (htmlDiet !== (d.diet || null)) {
      F(`"${d.key}" diet mismatch: canon ${JSON.stringify(d.diet)} vs html ${JSON.stringify(htmlDiet)}`);
    }
  }
}

if (drift) {
  console.log(`\n${drift} pipeline drift(s) found — canon (pipelineDishes.js) disagrees with worker.js and/or pipeline.html`);
  process.exit(1);
}
console.log('pipeline: canon, worker whitelist, and pipeline.html agree ✓');
