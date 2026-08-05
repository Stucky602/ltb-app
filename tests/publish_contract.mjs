// tests/publish_contract.mjs — the extras bag between the publish CALLERS and
// publishWeek.js must agree in BOTH directions.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
//
// `publishWeek(dishes, pdfUrl, label, pausedOpts, extras, deps)` takes a loose
// object as its fifth argument. Nothing typed it, nothing checked it, and it
// has now failed twice in OPPOSITE directions:
//
//   SENT, NEVER READ  — WeekTab put `customerFlags` in extras on both publish
//     paths and publishWeek never looked at it. Kevin's entire feature-flag
//     panel was inert: stage changes wrote to localStorage, rode the backup,
//     and never left the device. It looked fine because the worker falls back
//     to its own FLAG_DEFAULTS when the field is absent, so the five 'on'
//     flags resolved on anyway. The failure was invisible in exactly the cases
//     anyone would have noticed.
//
//   READ, NEVER SENT  — publishWeek reads `orderClosesAt` and
//     `amendmentsCloseAt` and no caller ever set them, so every publish shipped
//     '' for both and amendments.js checked a close time that could not arrive.
//
// Neither is catchable by the existing defences. The worker's `dropped` array
// only reports fields SENT but not whitelisted. tools/checkWorkerContract.mjs
// compares the published payload to the worker's CONFIG_FIELDS and actually
// PRINTED the flags bug as a friendly line ("worker accepts 1 field the app
// does not currently send"), reading a break as forward-compatibility. The gap
// was one layer earlier, between the caller and the payload builder.
//
// This is a STATIC test, in the style of tests/boot_deps.mjs: it parses the
// object literals rather than running a publish, because the bug is a missing
// line and a missing line has no runtime behaviour to observe.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE REGEX TRAP THIS TEST WAS WRITTEN AROUND
//
// A pattern like /onPublish\([\s\S]*?\}\)/ finds the FIRST `})` after the call
// starts, which for a nested object is somewhere in the middle, and a lazy
// quantifier that misses will happily run on and match someone else's closing
// brace hundreds of lines away. The ninth variant of that family shipped a
// `.catch()` check that passed its own negative test. So every extraction here
// is BRACE-BALANCED from a located opening brace, never a regex span.

import { readFileSync } from 'node:fs';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// ── Brace-balanced slice: from the index of an opening delimiter to its match ─
function balanced(src, startIdx, open = '{', close = '}') {
  let depth = 0, i = startIdx, inStr = null, prev = '';
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null;
    } else if (c === '"' || c === "'" || c === '`') {
      inStr = c;
    } else if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return src.slice(startIdx, i + 1); }
    prev = c;
  }
  return null;
}

// Strip line and block comments so a key named in prose is not read as code.
// (Tests that grep source and match their own explanatory comments have fired
// four times in this repo in a single day.)
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// Top-level keys of an object literal slice: only those at brace depth 1.
function topLevelKeys(objSrc) {
  const body = objSrc.slice(1, -1);
  const keys = [];
  let depth = 0, inStr = null, prev = '', token = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null;
      prev = c; continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; prev = c; continue; }
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    else if (depth === 0) {
      if (c === ':') {
        const m = token.trim().match(/([A-Za-z_$][\w$]*)$/);
        if (m) keys.push(m[1]);
        token = '';
        // skip to the comma at depth 0
        let d2 = 0, s2 = null, p2 = '';
        for (i++; i < body.length; i++) {
          const d = body[i];
          if (s2) { if (d === s2 && p2 !== '\\') s2 = null; p2 = d; continue; }
          if (d === '"' || d === "'" || d === '`') { s2 = d; p2 = d; continue; }
          if (d === '{' || d === '[' || d === '(') d2++;
          else if (d === '}' || d === ']' || d === ')') d2--;
          else if (d === ',' && d2 === 0) break;
          p2 = d;
        }
        continue;
      }
      if (c === ',') {
        // shorthand property, e.g. `customerFlags,`
        const m = token.trim().match(/^([A-Za-z_$][\w$]*)$/);
        if (m) keys.push(m[1]);
        token = '';
        continue;
      }
      token += c;
    }
    prev = c;
  }
  const m = token.trim().match(/^([A-Za-z_$][\w$]*)$/);
  if (m) keys.push(m[1]);
  return keys;
}

// ── 1. What the callers SEND ────────────────────────────────────────────────
// Every `onPublish(...)` call site's fifth argument, plus App.jsx's publish
// wrapper, which spreads the incoming extras and adds its own field.
const weekTab = stripComments(readFileSync('src/components/WeekTab.jsx', 'utf8'));
const appJsx = stripComments(readFileSync('src/App.jsx', 'utf8'));

const sent = new Set();
let callSites = 0;
{
  // onPublish(a, b, c, d, {extras}) — walk to the 5th top-level argument.
  let idx = 0;
  while ((idx = weekTab.indexOf('onPublish(', idx)) !== -1) {
    const argsSrc = balanced(weekTab, weekTab.indexOf('(', idx), '(', ')');
    if (!argsSrc) { idx += 10; continue; }
    // split the arg list at depth-0 commas
    const inner = argsSrc.slice(1, -1);
    const parts = [];
    let depth = 0, inStr = null, prev = '', cur = '';
    for (const c of inner) {
      if (inStr) { cur += c; if (c === inStr && prev !== '\\') inStr = null; prev = c; continue; }
      if (c === '"' || c === "'" || c === '`') { inStr = c; cur += c; prev = c; continue; }
      if (c === '{' || c === '[' || c === '(') depth++;
      if (c === '}' || c === ']' || c === ')') depth--;
      if (c === ',' && depth === 0) { parts.push(cur); cur = ''; prev = c; continue; }
      cur += c; prev = c;
    }
    parts.push(cur);
    const fifth = (parts[4] || '').trim();
    if (fifth.startsWith('{')) {
      callSites++;
      for (const k of topLevelKeys(balanced(fifth, 0))) sent.add(k);
    }
    idx += 10;
  }
}
ok('found both WeekTab publish call sites (publish + pause)', callSites === 2,
  `found ${callSites}; if a third path was added, this test must learn it`);

// App.jsx's wrapper spreads extras through and adds profileSnapshots.
const appAdds = new Set();
{
  const i = appJsx.indexOf('...(extras || {})');
  if (i !== -1) {
    const objStart = appJsx.lastIndexOf('{', i);
    const obj = balanced(appJsx, objStart);
    if (obj) for (const k of topLevelKeys(obj)) appAdds.add(k);
  }
}
ok('App.jsx publish wrapper spreads extras and adds profileSnapshots',
  appAdds.has('profileSnapshots'),
  'the wrapper at src/App.jsx that injects profileSnapshots was not found; ' +
  'if it moved, this test cannot see fields injected there');
for (const k of appAdds) sent.add(k);

// ── 2. What publishWeek READS ───────────────────────────────────────────────
const publish = stripComments(readFileSync('src/publishWeek.js', 'utf8'));
const read = new Set([...publish.matchAll(/extras\s*&&\s*extras\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]));
for (const m of publish.matchAll(/extras\.([A-Za-z_$][\w$]*)/g)) read.add(m[1]);

// `notice` never appears as extras.notice here: it is consumed through
// extractNotice(pausedOpts, extras) in weekNotice.js. Teach the test the
// indirection rather than special-casing the name, so a future field routed
// the same way is also seen.
const INDIRECT = new Map([
  ['extractNotice', 'src/weekNotice.js'],
]);
for (const [fn, file] of INDIRECT) {
  if (!publish.includes(fn + '(')) continue;
  const helper = stripComments(readFileSync(file, 'utf8'));
  for (const m of helper.matchAll(/extras\.([A-Za-z_$][\w$]*)/g)) read.add(m[1]);
  for (const m of helper.matchAll(/\bex\.([A-Za-z_$][\w$]*)/g)) read.add(m[1]);
}

// ── 3. The two directions ───────────────────────────────────────────────────
const unread = [...sent].filter(k => !read.has(k)).sort();
ok('every field a caller puts in the extras bag is read by publishWeek',
  unread.length === 0,
  unread.length
    ? `SENT AND SILENTLY DROPPED: ${unread.join(', ')}\n      ` +
      'This is the customerFlags bug. The field is built, passed, and thrown away;\n      ' +
      'the worker fills its own default and nothing looks wrong. Read it in\n      ' +
      'src/publishWeek.js or stop sending it.'
    : '');

const unsent = [...read].filter(k => !sent.has(k)).sort();
ok('every field publishWeek reads is sent by at least one caller',
  unsent.length === 0,
  unsent.length
    ? `READ BUT NEVER PRODUCED: ${unsent.join(', ')}\n      ` +
      'This is the orderClosesAt bug. publishWeek publishes a value no caller\n      ' +
      'can set, so it ships empty forever and its consumers silently no-op.'
    : '');

// ── 4. The specific regressions, named ──────────────────────────────────────
// Belt and braces: the generic checks above are what catch NEW fields, but
// these two cost real money and behaviour and are worth failing by name.
ok('customerFlags is published (the flag panel actually reaches customers)',
  read.has('customerFlags') && sent.has('customerFlags'),
  'without this, every stage change Kevin makes in the Week tab is inert');
ok('orderClosesAt and amendmentsCloseAt have a producer',
  sent.has('orderClosesAt') && sent.has('amendmentsCloseAt'),
  'publishWeek reads both; if nothing sends them they publish as empty forever');
// The compressed price block reached menu.page.html on Aug 3 and never
// reached a customer: the ALL_DINNERS projection stripped priceDisplay and
// toVariants did not rebuild it, so the page's render branch was dead code
// and the weekly menu fell back to the full variant list. Fifth instance of
// the wired-on-one-side class. Two cut points, so two checks — the rendered
// half lives in tests/customer_pages.mjs.
const menuSrc = readFileSync('src/menu.js', 'utf8');
ok('the ALL_DINNERS projection carries priceDisplay',
  /base\.priceDisplay\s*=/.test(menuSrc),
  'src/menu.js strips it and every downstream consumer sees only variants');
ok('toVariants forwards priceDisplay into the published dish',
  /priceDisplay:\s*item\.priceDisplay/.test(publish),
  'the payload is the second cut point; without this the page branch is dead');

// ── 5. The published payload carries the flags in full shape ────────────────
// The worker's resolveFlags needs {stage, testers, percent} to evaluate the
// testers and percent stages. A projection that sent only `stage` would look
// correct on the five 'on' flags and quietly break the other three stages.
ok('publishWeek normalizes flags rather than forwarding raw input',
  /customerFlags:\s*normalizeFlags\(/.test(publish),
  'normalizeFlags fills the full {stage, testers, percent} shape and clamps it; ' +
  'forwarding raw state would publish whatever shape localStorage happened to hold');

console.log(failed === 0
  ? `\nPUBLISH CONTRACT: ALL PASS (${sent.size} fields sent, ${read.size} read)`
  : `\nPUBLISH CONTRACT: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
