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
  const code = stripComments(text);

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

// ── THE SAME CLASS, ONE STEP WIDER: A FUNCTION CALLED AND NEVER IMPORTED ────
//
// Aug 5, and the second time this shape shipped. `OrderForm.jsx` called
// `returnSummary(...)` in its component body and never imported it, so EVERY
// tap of Edit threw "Can't find variable: returnSummary" before the form drew a
// single field. The bundle held one reference and zero definitions.
//
// The check above could not see it, because `returnSummary` is not a
// <Component> — it is a plain call. Same silence for the same reason: esbuild
// does not resolve free identifiers, and app_render mounts the app without
// opening an edit form.
//
// THE TEST IS DELIBERATELY NARROW: a name flagged only when EVERY occurrence in
// the file is a call site. A local, a parameter, or a destructured prop is
// bound somewhere and so appears at least once not followed by `(`. That makes
// this blind to a free global that happens to be called twice, and the trade is
// worth it — a wider rule would need real scope analysis, and a guard that
// cries wolf on ordinary code gets deleted the first time it is inconvenient.
const JS_KEYWORDS = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'function', 'new',
  'await', 'delete', 'void', 'do', 'else', 'yield', 'in', 'of', 'instanceof',
  'super', 'this', 'import', 'export', 'default', 'case', 'throw', 'const', 'let', 'var', 'async', 'try', 'finally', 'with',
]);
const GLOBALS = new Set([
  'window', 'document', 'console', 'Math', 'JSON', 'Object', 'Array', 'String',
  'Number', 'Boolean', 'Date', 'Promise', 'Set', 'Map', 'WeakMap', 'WeakSet',
  'RegExp', 'Error', 'TypeError', 'Symbol', 'BigInt', 'Proxy', 'Reflect',
  'parseFloat', 'parseInt', 'isNaN', 'isFinite', 'encodeURIComponent',
  'decodeURIComponent', 'btoa', 'atob', 'structuredClone', 'queueMicrotask',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame',
  'fetch', 'alert', 'confirm', 'prompt', 'URL', 'URLSearchParams', 'Blob',
  'File', 'FileReader', 'FormData', 'Image', 'Audio', 'navigator', 'location',
  'localStorage', 'sessionStorage', 'CustomEvent', 'Event', 'AbortController',
  'IntersectionObserver', 'ResizeObserver', 'MutationObserver', 'TextEncoder',
  'TextDecoder', 'Intl', 'performance', 'crypto', 'require', 'process',
  'MediaRecorder', 'SpeechRecognition', 'Notification', 'Worker', 'WebSocket',
]);

// CSS FUNCTION NAMES, which appear inside style strings and are not JavaScript
// at all. Whitelisted by name rather than by stripping string literals: the
// JSX-component check above records what happened when this file tried to strip
// strings — an apostrophe in JSX prose is not a quote, and the naive regex ate
// two real declarations. Better a short explicit list than a scan that removes
// working code.
const CSS_FUNCS = new Set([
  'rgb', 'rgba', 'hsl', 'hsla', 'calc', 'var', 'url', 'blur', 'brightness',
  'gradient', 'rotate', 'translate', 'translateX', 'translateY', 'scale',
  'drop-shadow', 'cubic-bezier', 'clamp', 'minmax', 'repeat', 'env',
]);

// STRIPPING COMMENTS IS WHERE THIS FILE HAS BEEN WRONG TWICE, so it is one
// function now and both checks use it.
//
// `accept="image/*"` starts a block comment as far as a naive `\/\*` is
// concerned, and the lazy match then runs to the next real `*\/` and swallows
// everything in between — in OrderInputs.jsx that was several hundred lines
// including two `useState` declarations, which the call check then reported as
// missing. Same family as the apostrophe that ate real declarations out of
// ReceiptScan.jsx.
//
// A real block comment opens at the start of a line or straight after
// whitespace or an opening delimiter. `image/*` opens after a letter, so it is
// a MIME type, and it stays.
function stripComments(text) {
  return text
    .replace(/\/\/[^\n]*/g, '')
    .replace(/(^|[\s{(,;=:>[])\/\*[\s\S]*?\*\//g, '$1');
}

function freeCalls(file) {
  const text = fs.readFileSync(file, 'utf8');
  const code = stripComments(text);
  // Names DECLARED here. `function Foo(` and `class Foo` put the name straight
  // before a paren or a brace, so a declaration reads exactly like a call and
  // every exported component reported itself missing on the first run.
  const declared = new Set(
    [...code.matchAll(/\b(?:function\s*\*?|class)\s+([A-Za-z_$][\w$]*)/g)].map(m => m[1])
  );
  // METHOD DEFINITIONS look exactly like calls: `constructor(props) {`,
  // `componentDidCatch(e, info) {`, and object-literal shorthand all put a bare
  // name against a paren at the head of a line. ErrorBoundary.jsx reported all
  // three of its React lifecycle methods as missing until this was added.
  for (const m of code.matchAll(/^[ \t]*(?:static\s+|async\s+|get\s+|set\s+|\*\s*)*([A-Za-z_$][\w$]*)\s*\([^()]*\)\s*\{/gm)) {
    declared.add(m[1]);
  }
  // Call sites: `name(`, never `.name(` (a method) and never `?.name(`.
  const called = new Set(
    [...code.matchAll(/(^|[^.\w$?])([A-Za-z_$][\w$]*)\(/g)]
      .map(m => m[2])
      .filter(n => !JS_KEYWORDS.has(n) && !GLOBALS.has(n) && !CSS_FUNCS.has(n) && !declared.has(n))
  );
  const free = [];
  for (const name of called) {
    // Any occurrence of the bare name NOT immediately followed by `(` means it
    // is bound, destructured, imported, or passed somewhere in this file.
    const bound = new RegExp(`(^|[^.\\w$])${name}\\b(?!\\()`).test(code);
    if (bound) continue;
    // Last filter, and it exists because of one real line: an error message
    // reading "try the export from Safari (not home screen)". Inside a quoted
    // string, a capitalised word before a paren is prose. Only skip when EVERY
    // occurrence sits inside quotes, so a genuine free call in live code beside
    // a string mention still reports.
    const quoted = new RegExp(`['"\`][^'"\`\\n]*\\b${name}\\(`, 'g');
    const total = (code.match(new RegExp(`\\b${name}\\(`, 'g')) || []).length;
    const inStrings = (code.match(quoted) || []).length;
    if (total > 0 && total === inStrings) continue;
    free.push(name);
  }
  return free;
}

{
  const targets = [
    ...files.map(x => path.join(dir, x)),
    path.join(ROOT, 'src/App.jsx'),
  ].filter(x => fs.existsSync(x));
  const loose = [];
  for (const file of targets) {
    for (const name of freeCalls(file)) {
      loose.push(`${path.basename(file)}: ${name}() is called but never defined or imported`);
    }
  }
  ok(`no component file calls a function it never imported (${loose.length})`,
    loose.length === 0,
    loose.join('\n      ') + (loose.length
      ? '\n      → this is the returnSummary crash before Kevin taps Edit'
      : ''));
}

// And prove THAT one can fail too, on the exact shape that shipped.
{
  const tmp = path.join(ROOT, 'src/components/__probe2.jsx');
  fs.writeFileSync(tmp, 'export function P(props) {\n  const x = neverImportedHelper(props.a);\n  return x;\n}\n');
  const free = freeCalls(tmp);
  fs.rmSync(tmp, { force: true });
  ok('the call check detects an unimported helper when one exists',
    free.includes('neverImportedHelper'), free.join(', '));
}

console.log(f === 0 ? '\nJSX SYMBOLS: ALL PASS' : `\nJSX SYMBOLS: ${f} FAILURES`);
process.exit(f ? 1 : 0);
