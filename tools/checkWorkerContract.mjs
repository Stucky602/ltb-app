// checkWorkerContract.mjs — fails the build when the app publishes a field the
// worker will silently throw away.
//
// WHY THIS EXISTS
// POST /config rebuilds its stored config from CONFIG_FIELDS and discards
// anything not on that list. Not an error, not a warning: the publish returns
// 200 and the field is simply gone. Three shipped features have died this way.
// `notice` was built end to end and never reached a customer page. `oneBottle`
// had NEVER worked in its entire life, so menu.html's "one bottle for the week"
// card had been dead since the day it was written. The worker's own comments
// record `paused` being lost the same way earlier.
//
// The worker now returns a `dropped` array and publishWeek raises a banner
// naming anything ignored, which catches this AT PUBLISH TIME. That is the
// right runtime behaviour and it is still too late: the discovery happens on a
// Sunday with a week's menu already half out the door. This moves the same
// check to build time, where a mismatch costs a red gate instead of a week.
//
// WHAT THIS DOES NOT DO
// It cannot tell you the DEPLOYED worker matches this file. worker.js lives in
// the repo but nothing deploys it — Kevin pastes it into the Cloudflare
// dashboard by hand — so the repo copy and the running copy can diverge with
// nothing to notice. This checks the two files in the repo agree with each
// other. Closing the deploy gap needs wrangler, and that is a separate job.

import { readFileSync } from 'node:fs';

let failed = 0;
const fail = (msg, detail) => {
  failed++;
  console.log('  ✗ ' + msg);
  if (detail) detail.split('\n').forEach(l => console.log('    ' + l));
};

const worker = readFileSync('worker.js', 'utf8');
const publish = readFileSync('src/publishWeek.js', 'utf8');

// ── what the worker will accept ─────────────────────────────────────────────
const block = worker.slice(worker.indexOf('const CONFIG_FIELDS = {'));
const accepted = new Set(
  [...block.slice(0, block.indexOf('\n};')).matchAll(/^\s{2}(\w+):\s*b\s*=>/gm)].map(m => m[1]),
);

if (accepted.size === 0) {
  fail('could not find CONFIG_FIELDS in worker.js — has it been renamed?');
} else {
  console.log(`  ✓ worker CONFIG_FIELDS declares ${accepted.size} fields`);
}

// ── what the app sends ──────────────────────────────────────────────────────
// The payload literal in publishWeek.js. Shorthand (`dishes, spotlight, ...`),
// explicit keys, and keys inside the spread-conditionals all count.
const pStart = publish.indexOf('const payload = {');
const pEnd = publish.indexOf('\n  };', pStart);
const payload = publish.slice(pStart, pEnd);

const sent = new Set();
for (const m of payload.matchAll(/^\s{4}(\w+):/gm)) sent.add(m[1]);
for (const m of payload.matchAll(/\{\s*(\w+):\s*true,\s*(\w+):/g)) { sent.add(m[1]); sent.add(m[2]); }
for (const m of payload.matchAll(/\{\s*(\w+):\s*ob\s*\}/g)) sent.add(m[1]);
for (const m of payload.matchAll(/^\s{4}([\w,\s]+),$/gm)) {
  // the shorthand line: `dishes, spotlight, fruit, desserts, addons, bag, sauces,`
  m[1].split(',').map(x => x.trim()).filter(x => /^\w+$/.test(x)).forEach(x => sent.add(x));
}
sent.delete('token');   // auth, never stored
sent.delete('schema');  // protocol, not a config field

// ── the contract ────────────────────────────────────────────────────────────
const dropped = [...sent].filter(f => !accepted.has(f)).sort();
if (dropped.length) {
  fail(`the app publishes ${dropped.length} field(s) the worker will DISCARD: ${dropped.join(', ')}`,
    'POST /config keeps only what is listed in CONFIG_FIELDS and returns 200 regardless,\n'
    + 'so this ships as a feature that is wired end to end and simply never arrives.\n'
    + 'Add each field to CONFIG_FIELDS in worker.js, then paste the worker into the\n'
    + 'Cloudflare dashboard — nothing deploys it automatically.');
} else {
  console.log(`  ✓ all ${sent.size} published fields are accepted by the worker`);
}

// The reverse is informational, not a failure: the worker may legitimately
// accept a field the app does not send yet.
const unused = [...accepted].filter(f => !sent.has(f)).sort();
if (unused.length) {
  console.log(`  ✓ worker accepts ${unused.length} field(s) the app does not currently send: ${unused.join(', ')}`);
}

// ── the guard that made this visible in the first place ─────────────────────
if (!worker.includes('dropped')) {
  fail('worker.js no longer returns a `dropped` array from POST /config',
    'That array is what lets a publish tell Kevin a field was ignored. Without it,\n'
    + 'this failure mode goes back to being completely silent at runtime.');
} else {
  console.log('  ✓ worker still reports dropped fields back to the app');
}
if (!publish.includes('dropped')) {
  fail('publishWeek.js no longer reads the worker\'s `dropped` array',
    'The worker reports ignored fields and nothing looks at the report.');
} else {
  console.log('  ✓ publishWeek still raises a banner for anything the worker dropped');
}

console.log(failed === 0 ? '\nWORKER CONTRACT: ALL PASS' : `\nWORKER CONTRACT: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
