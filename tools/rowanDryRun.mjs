// rowanDryRun.mjs — build a Rowan bundle and write it to a file. Nothing is
// transmitted; there is no network call in this tool or in the module it uses.
//
//   node tools/rowanDryRun.mjs                       → build from EMPTY stores
//   node tools/rowanDryRun.mjs backup.json           → build from a real backup
//   node tools/rowanDryRun.mjs backup.json --out b.json
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY IT READS A BACKUP FILE RATHER THAN THE APP
//
// The record lives in one device's localStorage. A command-line tool cannot
// reach it, and building a second export path to work around that would mean
// two definitions of "the current state" that can disagree.
//
// The backup payload IS the state, it already exists, and Kevin already knows
// how to produce one. So the dry run reads what he can already hand it, and
// `PUBLISHED_STORES` is keyed by backup field name for exactly this reason.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT A DRY RUN IS FOR
//
// Two things, and neither is content. First: does the builder produce a file
// with the right shape and nothing in it that should not be there. Second:
// what does the record actually hold — because a bundle that is mostly "nothing
// recorded yet" says the next work is writing, not code, and that answer is
// worth more than another feature.
//
// It runs TWICE and compares fingerprints. A builder that returns different
// bytes for the same input would make every later comparison meaningless, and
// that is invisible from one run.

import { readFileSync, writeFileSync } from 'node:fs';
import { buildRowanBundle, describeBundle, PUBLISHED_STORES, NOT_PUBLISHED } from '../src/rowanPublication.js';

const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const outPath = outFlag >= 0 ? args[outFlag + 1] : 'rowan-bundle.dryrun.json';
const inPath = args.find((a, i) => !a.startsWith('--') && i !== outFlag + 1) || null;

let payload = {};
if (inPath) {
  try {
    payload = JSON.parse(readFileSync(inPath, 'utf8'));
  } catch (e) {
    console.error(`Could not read ${inPath}: ${e.message}`);
    process.exit(1);
  }
  console.log(`  Source: ${inPath}`);
} else {
  console.log('  Source: none given — building from EMPTY stores to prove the shape.');
  console.log('          Pass a backup JSON file to see the real record.');
}

const bundle = buildRowanBundle(payload);
const again = buildRowanBundle(payload);

console.log('');
console.log(describeBundle(bundle));
console.log('');

if (bundle.fingerprint !== again.fingerprint) {
  console.error('  ✗ NOT DETERMINISTIC: two builds of the same input disagree.');
  console.error(`      ${bundle.fingerprint} vs ${again.fingerprint}`);
  process.exit(1);
}
console.log(`  ✓ deterministic (built twice, fingerprint ${bundle.fingerprint} both times)`);

// EVERY BACKUP FIELD IS ANSWERED, and the answer is printed rather than
// assumed. A store that is in neither map is caught by the gate, but a reader
// of the dry run should be able to see the decisions without opening the code.
const known = new Set([...Object.keys(PUBLISHED_STORES), ...Object.keys(NOT_PUBLISHED)]);
const unanswered = Object.keys(payload).filter(k => !known.has(k));
if (unanswered.length) {
  console.error(`  ✗ ${unanswered.length} field(s) in this backup are in neither map: ${unanswered.join(', ')}`);
  console.error('      Every store must be published with a projector or excluded with a reason.');
  process.exit(1);
}
console.log(`  ✓ every field in the source is answered (${Object.keys(PUBLISHED_STORES).length} published, ${Object.keys(NOT_PUBLISHED).length} held back)`);

if (bundle.gaps.length) {
  console.log('');
  console.log('  What this bundle does NOT contain:');
  for (const g of bundle.gaps) console.log(`    - ${g}`);
}

writeFileSync(outPath, JSON.stringify(bundle, null, 2));
console.log('');
console.log(`  WROTE ${outPath}`);
console.log('  Nothing was transmitted. Transport is Phase 2.');
