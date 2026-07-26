// checkPagesBuilt.mjs — fails the build when a committed customer page does
// not match what src/pages/ says it should be.
//
// This one check buys three separate things, which is why it is the first
// thing written rather than the last:
//
//   1. It proves the build is IDEMPOTENT. Running it on unmodified sources
//      produces byte-identical output, every time. Without that property
//      there is no way to tell a migration bug from a formatting wobble.
//   2. It stops a hand-edit to a generated page surviving. Edit order.html
//      directly and the gate fails here, immediately, instead of the change
//      silently evaporating on the next build and taking a fix with it.
//   3. It makes the migration verifiable ONE PAGE AT A TIME. Only pages in
//      the buildPages manifest are checked, so four hand-written pages and
//      one generated one is a green, shippable state.
//
// It compares in memory rather than building into a temp directory: a check
// that writes files has a cleanup failure mode, and this one has nothing to
// clean up.

import { readFileSync, existsSync } from 'node:fs';
import { buildAll, PAGES } from './buildPages.mjs';

const ROOT = new URL('../', import.meta.url);
let failures = 0;

// Reports the first differing line rather than dumping two 300 KB files. The
// pages carry embedded JSON and base64 icons, so a raw diff is unreadable and
// a byte offset alone tells you nothing about where to look.
function firstDifference(a, b) {
  const al = a.split('\n');
  const bl = b.split('\n');
  for (let i = 0; i < Math.max(al.length, bl.length); i++) {
    if (al[i] !== bl[i]) {
      return {
        line: i + 1,
        committed: al[i] === undefined ? '(end of file)' : al[i],
        built: bl[i] === undefined ? '(end of file)' : bl[i],
      };
    }
  }
  return null; // same lines; differs only in the trailing newline
}

let built;
try {
  built = buildAll();
} catch (e) {
  console.log(`  ✗ the page build threw: ${e.message}`);
  console.log('\nPAGES BUILT: 1 FAILURE');
  process.exit(1);
}

for (const [name, content] of built) {
  const url = new URL(name, ROOT);
  if (!existsSync(url)) {
    failures++;
    console.log(`  ✗ ${name} is missing from the repo root`);
    console.log('    Cloudflare serves the repo root, so the five pages must exist there');
    console.log('    with these exact names. Run: node tools/buildPages.mjs --write');
    continue;
  }
  const current = readFileSync(url, 'utf8');
  if (current === content) {
    console.log(`  ✓ ${name} matches src/pages/ exactly (${content.length} bytes)`);
    continue;
  }
  failures++;
  const d = firstDifference(current, content);
  console.log(`  ✗ ${name} does not match what src/pages/ builds`);
  if (d) {
    console.log(`    first difference at line ${d.line}:`);
    console.log(`      committed: ${d.committed.slice(0, 110)}`);
    console.log(`      built:     ${d.built.slice(0, 110)}`);
  } else {
    console.log('    the lines are identical; they differ only in the trailing newline');
  }
  console.log('    Either the page was hand-edited (edit src/pages/ instead, then');
  console.log('    rebuild), or the source changed and the page was not regenerated.');
  console.log('    Run: node tools/buildPages.mjs --write');
}

// A page in the manifest with no source file throws inside buildAll above, so
// reaching here with an empty manifest means the migration has not started.
if (PAGES.length === 0) console.log('  · no pages are built yet; nothing to check');

console.log(failures === 0 ? '\nPAGES BUILT: ALL PASS' : `\nPAGES BUILT: ${failures} FAILURES`);
process.exit(failures ? 1 : 0);
