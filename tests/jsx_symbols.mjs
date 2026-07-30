// tests/jsx_symbols.mjs — every component in JSX must actually exist.
//
// WHY THIS EXISTS
//
// On Jul 30 the Recipes tab broke for every dish with "Can't find variable:
// IngredientCardBlock". The component was referenced in JSX and had never been
// written: the edit that was supposed to add it anchored on a comment that
// lives in a DIFFERENT file, so the string replace matched nothing, changed
// nothing, and reported nothing.
//
// NOTHING IN A 50-COMMAND GATE CAUGHT IT.
//
//   - esbuild's JSX transform does not resolve identifiers. `<Foo />` becomes
//     `React.createElement(Foo)` whether or not Foo exists, so the file
//     "compiles" perfectly.
//   - tests/app_render.mjs bundles and mounts the app, but a component used
//     only after clicking into a dish never renders during that mount, so the
//     reference is never evaluated.
//   - Every other suite is pure logic and never touches a component.
//
// So it shipped, and the first thing that ran the code was Kevin tapping a
// recipe. This is the cheapest possible guard against that whole class: a
// reference with no definition and no import is always a bug, and it is
// detectable without rendering anything.
//
// Deliberately NOT a linter. It answers one question — does this name exist in
// this file — because that is the question that was silently answered wrong.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

// Tags React itself provides, plus fragments. Everything else must be findable.
const BUILTIN = new Set(['React', 'Fragment', 'Suspense', 'StrictMode', 'Profiler']);

function scan(file) {
  const text = fs.readFileSync(file, 'utf8');
  // COMMENTS ONLY. The first version also stripped string literals, to stop a
  // component name inside prose being read as a reference — and it ate real
  // code, because an apostrophe in JSX text (don't, Kevin's) is not a string
  // quote. The naive regex treated it as one and swallowed everything up to the
  // next apostrophe, including two genuine function declarations in
  // ReceiptScan.jsx, which the check then reported as missing.
  //
  // Leaving strings in risks the opposite error: a literal like '<Foo />' inside
  // a string being counted as a usage. That is far rarer, and it fails LOUDLY
  // (a name reported missing that exists) rather than quietly, which is the
  // right direction for a guard whose whole job is catching a silent gap.
  const code = text
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const used = new Set([...code.matchAll(/<([A-Z][A-Za-z0-9_]*)\b/g)].map(m => m[1]));
  const missing = [];

  for (const name of used) {
    if (BUILTIN.has(name)) continue;
    const defined = new RegExp(`(?:function|const|let|var|class)\\s+${name}\\b`).test(code);
    const imported = new RegExp(`import[^;]*\\b${name}\\b[^;]*from`).test(text);
    if (!defined && !imported) missing.push(name);
  }
  return missing;
}

const dir = path.join(ROOT, 'src/components');
const files = fs.readdirSync(dir).filter(x => x.endsWith('.jsx'));

ok('there are component files to check', files.length > 0, String(files.length));

const broken = [];
for (const file of files) {
  const missing = scan(path.join(dir, file));
  for (const name of missing) broken.push(`${file}: <${name}> is used but never defined or imported`);
}

ok('every component referenced in JSX exists in its file',
  broken.length === 0,
  broken.join('\n      ') + (broken.length
    ? '\n      → this is what "Can\'t find variable" looks like before a customer finds it'
    : ''));

// The app entry too, which is where most composition happens.
{
  const app = path.join(ROOT, 'src/App.jsx');
  if (fs.existsSync(app)) {
    const missing = scan(app);
    ok('and every component referenced in App.jsx',
      missing.length === 0, missing.map(n => `<${n}>`).join(', '));
  }
}

// Prove the check can actually fail. A guard that cannot fail is decoration,
// and this one exists precisely because several suites that looked like they
// covered this did not.
{
  const tmp = path.join(ROOT, 'src/components/__probe.jsx');
  fs.writeFileSync(tmp, 'export function P() { return <ThisWasNeverWritten />; }\n');
  const missing = scan(tmp);
  fs.rmSync(tmp, { force: true });
  ok('the check detects a missing component when one exists',
    missing.includes('ThisWasNeverWritten'), missing.join(', '));
}

console.log(f === 0 ? '\nJSX SYMBOLS: ALL PASS' : `\nJSX SYMBOLS: ${f} FAILURES`);
process.exit(f ? 1 : 0);
