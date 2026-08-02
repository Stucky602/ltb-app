// handoffDelta.mjs — what factually changed, for the next handoff document.
//
//   node tools/handoffDelta.mjs             report against the recorded baseline
//   node tools/handoffDelta.mjs --record    write today's state as the new baseline
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS DOES AND, MORE IMPORTANTLY, WHAT IT DOES NOT
//
// It reports FACTS: version strings, gate command count, source files added or
// removed, exports gained, storage keys, schema version, worker routes, page
// sizes. Those are the parts of a handoff that are tedious to assemble by hand,
// easy to get wrong, and the reason HANDOFF_28 spent a week claiming the gate
// had 65 commands when it had 66.
//
// It does NOT write the handoff. It does not summarise why anything changed,
// what a decision meant, what is still open, or what anyone should do next.
// Every one of those is Kevin's, and a generated paragraph that sounds like his
// judgement is worse than a blank page, because it will be believed and then
// quoted back at him.
//
// The systems master puts it this way: the builder supplies the factual delta,
// Kevin supplies the human meaning and the corrections.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY A BASELINE FILE RATHER THAN GIT
//
// This repo is edited through zips dropped onto GitHub, so the working copy has
// no reliable history to diff against — a session's changes and the previous
// session's arrive in the same commit. A recorded baseline is the only thing
// that survives that workflow, and it is a plain JSON file Kevin can read.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';

const BASELINE = 'tools/handoff-baseline.json';
const record = process.argv.includes('--record');

function listSources(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = `${dir}/${name}`;
    if (statSync(full).isDirectory()) listSources(full, out);
    else if (/\.(js|jsx|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

// Exported names per file. Cheap regex rather than a parser: this is a change
// DETECTOR, and a missed export shows up as a file that changed size anyway.
//
// ANCHORED TO THE START OF A LINE, and that is not cosmetic. The first version
// was unanchored and reported THIS FILE as exporting SCHEMA_VERSION — it had
// matched the regex literal a few lines below, which mentions the words
// `export const SCHEMA_VERSION` while searching for them. A tool that reports
// its own source as a finding is the fifth instance of that family in this
// repo. Every real export in this codebase sits at column zero.
function exportsOf(src) {
  const names = new Set();
  for (const m of src.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  for (const m of src.matchAll(/^export\s+const\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  return [...names].sort();
}

function snapshot() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const files = {};
  for (const f of listSources('src').concat(listSources('tools'), listSources('tests'))) {
    const src = readFileSync(f, 'utf8');
    files[f] = { bytes: src.length, exports: exportsOf(src) };
  }

  const worker = existsSync('worker.js') ? readFileSync('worker.js', 'utf8') : '';
  const routes = [...worker.matchAll(/url\.pathname (?:===|\.startsWith\()\s*'([^']+)'/g)]
    .map(m => m[1]);

  const config = existsSync('src/config.js') ? readFileSync('src/config.js', 'utf8') : '';
  const storageKeys = [...config.matchAll(/export const ([A-Z_]+_KEY) =/g)].map(m => m[1]).sort();

  const migrations = existsSync('src/migrations.js') ? readFileSync('src/migrations.js', 'utf8') : '';
  const schema = (migrations.match(/export const SCHEMA_VERSION = (\d+)/) || [])[1] || null;

  return {
    recordedAt: new Date().toISOString(),
    version: pkg.version,
    gateCommands: String(pkg.scripts.test || '').split('&&').length,
    schemaVersion: schema ? Number(schema) : null,
    storageKeys: [...new Set(storageKeys)],
    workerRoutes: [...new Set(routes)].sort(),
    files,
  };
}

const now = snapshot();

if (record) {
  writeFileSync(BASELINE, JSON.stringify(now, null, 2) + '\n');
  console.log(`  Baseline recorded: v${now.version}, gate ${now.gateCommands}, `
    + `${Object.keys(now.files).length} source files.`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.log('  No baseline recorded yet. Run with --record to create one.');
  console.log('  (Nothing to compare against is not an error; it is the first run.)');
  process.exit(0);
}

const was = JSON.parse(readFileSync(BASELINE, 'utf8'));
const lines = [];

const scalar = (label, a, b) => { if (a !== b) lines.push(`  ${label}: ${a} → ${b}`); };
scalar('Version', was.version, now.version);
scalar('Gate commands', was.gateCommands, now.gateCommands);
scalar('Schema version', was.schemaVersion, now.schemaVersion);

const setDiff = (a, b) => ({
  added: b.filter(x => !a.includes(x)),
  removed: a.filter(x => !b.includes(x)),
});

const keys = setDiff(was.storageKeys || [], now.storageKeys || []);
if (keys.added.length) lines.push(`  Storage keys added: ${keys.added.join(', ')}`);
if (keys.removed.length) lines.push(`  Storage keys REMOVED: ${keys.removed.join(', ')}`);

const routes = setDiff(was.workerRoutes || [], now.workerRoutes || []);
if (routes.added.length) lines.push(`  Worker routes added: ${routes.added.join(', ')}`);
if (routes.removed.length) lines.push(`  Worker routes REMOVED: ${routes.removed.join(', ')}`);

const wasFiles = Object.keys(was.files || {});
const nowFiles = Object.keys(now.files || {});
const f = setDiff(wasFiles, nowFiles);
if (f.added.length) {
  lines.push(`  New files (${f.added.length}):`);
  for (const p of f.added) lines.push(`    ${p} — exports: ${(now.files[p].exports.join(', ') || 'none')}`);
}
if (f.removed.length) lines.push(`  Deleted files: ${f.removed.join(', ')}`);

// Changed files, with the exports they gained. An export added to an existing
// file is the thing most often missing from a handoff, because the file itself
// is old news.
const changed = [];
for (const p of nowFiles) {
  if (!was.files[p]) continue;
  const ex = setDiff(was.files[p].exports, now.files[p].exports);
  if (ex.added.length || ex.removed.length || was.files[p].bytes !== now.files[p].bytes) {
    changed.push({ p, ...ex, dBytes: now.files[p].bytes - was.files[p].bytes });
  }
}
if (changed.length) {
  lines.push(`  Modified files (${changed.length}):`);
  for (const c of changed.sort((a, b) => Math.abs(b.dBytes) - Math.abs(a.dBytes)).slice(0, 40)) {
    const parts = [`${c.dBytes >= 0 ? '+' : ''}${c.dBytes}b`];
    if (c.added.length) parts.push(`new exports: ${c.added.join(', ')}`);
    if (c.removed.length) parts.push(`REMOVED exports: ${c.removed.join(', ')}`);
    lines.push(`    ${c.p} — ${parts.join('; ')}`);
  }
  if (changed.length > 40) lines.push(`    …and ${changed.length - 40} more`);
}

console.log(`  Delta since ${was.recordedAt.slice(0, 10)}:\n`);
console.log(lines.length ? lines.join('\n') : '  Nothing changed.');
console.log('\n  These are FACTS ONLY. What they meant, what is still open, and what');
console.log('  anyone should do next are Kevin\'s to write.');
console.log('\nHANDOFF DELTA: REPORTED');
