// syncPipeline.mjs — pipeline vote-key consistency gate (Jul 18).
//
// pipelineDishes.js is CANON for every pipeline dish's vote key. This tool
// checks that the two OTHER places the key lives agree with it:
//   • worker.js  PIPELINE_DISHES  (deploys by paste but is versioned here, so
//                                  this is pure source scan)
//   • pipeline.html  data-dish     (the customer voting cards)
//
// WHAT CHANGED WHEN THE ROSTER STARTED PUBLISHING (Jul 26)
// Both of those are now FALLBACKS rather than the live truth. The roster ships
// with the week config, the worker validates votes against the published copy,
// and pipeline.html swaps its cards for it on load. So a stale worker constant
// or a stale page no longer breaks voting the moment canon moves.
//
// That is precisely why this tool still runs. Both fallbacks are what answer
// before the first publish and what answer when a fetch fails, and a fallback
// nobody checks is a fallback that has quietly rotted by the time it is needed.
// Rule 5 below adds the one thing the old rules could not see: that the publish
// path still comes off canon, and that the worker still prefers what it was
// sent. Neither can be checked against KV from here, so both are checked at
// their source.
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
const pipelineHtmlFull = readFileSync(ROOT + 'pipeline.html', 'utf8');

// MARKUP ONLY. The page's runtime renderer builds cards as strings, so its
// source contains a literal `data-dish="' + escAttr(d.key) + '"`, and scanning
// the whole file reported that fragment as a dish key with no entry in canon.
// A check that fires on the page's own source code is a check that gets
// switched off, so the scan stops at the script block. Every card lives above
// it; if that ever stops being true, this finds nothing and rule 1 fails loudly
// rather than passing quietly.
const scriptAt = pipelineHtmlFull.indexOf('<script>');
const pipelineHtml = scriptAt > 0 ? pipelineHtmlFull.slice(0, scriptAt) : pipelineHtmlFull;

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

// ── Rule 5: the publish path still exists and still comes off canon ──────────
// The two checks below guard the two ways this feature dies quietly.
//
// The first: someone hand-types a roster into publishWeek.js instead of
// deriving it, and canon stops being canon while every other rule here stays
// green, because the worker constant and the page cards would still agree with
// a file nobody publishes from.
//
// The second matters more, and it is specific to how this worker deploys.
// worker.js is pasted into the Cloudflare dashboard by hand, so the way it
// regresses is not an edit, it is an OLDER COPY being pasted back over it.
// A worker without votableKeys() validates against its own frozen constant
// again, and the symptom is a 400 on a dish Kevin published this morning.
// These anchors are function and field names, not formatting, so they do not
// fire on a reflow.
{
  const publishSrc = readFileSync(ROOT + 'src/publishWeek.js', 'utf8');
  if (!/from '\.\/pipelineDishes\.js'/.test(publishSrc)) {
    F('src/publishWeek.js no longer imports canon from pipelineDishes.js — the '
      + 'published roster must be DERIVED from canon, never retyped');
  } else if (!/^\s{4}pipeline:/m.test(publishSrc)) {
    F('src/publishWeek.js imports canon but no longer sends a `pipeline` field, '
      + 'so the roster stops publishing and every surface silently falls back');
  }

  if (!/async function votableKeys\(env\)/.test(workerSrc)) {
    F('worker.js has no votableKeys() — it is validating votes against its own '
      + 'frozen PIPELINE_DISHES again. An older copy was probably pasted back '
      + 'over the dashboard; a dish published today would 400.');
  } else if (!/const allowed = await votableKeys\(env\)/.test(workerSrc)) {
    F('worker.js has votableKeys() but POST /votes is not using it to validate');
  }
}

// ── Graduation wall ──────────────────────────────────────────────────────────
// A dish carrying status:'shipped' made it from this page to the real menu.
// pipeline.html shows those in a "Made the menu" section, driven by a
// GRADUATED array. This tool stays report-only (edits to the customer pages
// remain deliberate), so it VERIFIES the array matches canon rather than
// rewriting it, and prints the exact line to paste when it does not.
{
  const gradKeys = PIPELINE_DISHES.filter(d => d.status === 'shipped').map(d => d.title || d.key);
  const m = pipelineHtmlFull.match(/var GRADUATED = (\[[^;]*\]);\s*\/\* SYNC:GRADUATED \*\//);
  if (!m) {
    F('pipeline.html is missing the GRADUATED array (marker: /* SYNC:GRADUATED */)');
  } else {
    let listed = [];
    try { listed = JSON.parse(m[1].replace(/'/g, '"')).map(g => g.title); } catch (e) { listed = null; }
    if (listed === null) {
      F('GRADUATED array in pipeline.html could not be parsed');
    } else {
      const missing = gradKeys.filter(k => !listed.includes(k));
      const extra = listed.filter(k => !gradKeys.includes(k));
      for (const k of missing) F(`"${k}" shipped in canon but is not on the pipeline.html graduation wall`);
      for (const k of extra) F(`"${k}" is on the graduation wall but is not status:'shipped' in canon`);
      if (missing.length) {
        console.log('  paste into pipeline.html:');
        console.log('  var GRADUATED = ' + JSON.stringify(gradKeys.map(t => ({ title: t, note: '', votes: 0 }))) + '; /* SYNC:GRADUATED */');
      }
    }
  }
}

if (drift) {
  console.log(`\n${drift} pipeline drift(s) found — canon (pipelineDishes.js) disagrees with worker.js and/or pipeline.html`);
  process.exit(1);
}
console.log('pipeline: canon, worker whitelist, and pipeline.html agree ✓');
