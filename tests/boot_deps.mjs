// tests/boot_deps.mjs
//
// WHY THIS EXISTS
//
// bootHydrate.js takes a `deps` bag and destructures ~30 setters out of it.
// App.jsx builds that bag by hand at the single call site. Nothing connected
// the two lists, so adding a setter to bootHydrate without adding it to
// App.jsx compiled fine, passed every test, and shipped.
//
// It shipped on Jul 31: `setCustomerFlags` was destructured in bootHydrate and
// never passed by App.jsx. Boot called it and threw "setCustomerFlags is not a
// function". The app sat on "Loading orders..." forever with no message,
// because a rejected promise inside a useEffect never reaches an error
// boundary.
//
// The reason it got through the gate is the part worth remembering: the call
// is GUARDED.
//
//     if (loadedFlags && typeof loadedFlags === 'object') setCustomerFlags(...)
//
// On a device with nothing stored under that key, loadJSON returns the null
// fallback, the guard short-circuits, and boot completes. tests/app_render.mjs
// boots from clean fixture state, so it took that branch every time. The bomb
// only armed when a real device wrote the key — which happened on the first
// publish with a flag set, days after the code shipped green.
//
// So this is not "a setter was forgotten." It is a whole CLASS: a dep that is
// only reached on data the gate does not have. Assert the two lists agree,
// statically, and the class closes.

import { readFileSync } from 'node:fs';
import assert from 'node:assert';

const boot = readFileSync(new URL('../src/bootHydrate.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

let pass = 0, fail = 0;
const ok = (label) => { console.log('  \u2713 ' + label); pass++; };
const bad = (label, detail) => { console.log('  \u2717 ' + label + (detail ? ' \u2014 ' + detail : '')); fail++; };

// Strip comments first. Both files carry long explanatory headers that name
// setters in prose, and a grep that reads its own comments is a test that
// lies. This has bitten four times; do not remove this step.
const decomment = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

// ── The two lists ──────────────────────────────────────────────────────────

// What bootHydrate destructures out of deps.
const bootBody = decomment(boot);
const destructure = bootBody.match(/const\s*\{([\s\S]*?)\}\s*=\s*deps\s*;/);
assert(destructure, 'could not find the `= deps` destructure in bootHydrate.js');
const required = destructure[1]
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => s.split(':')[0].trim());   // tolerate renaming, should it ever appear

// What App.jsx actually passes at the call site.
const appBody = decomment(app);
const callSite = appBody.match(/hydrateFromStorage\(\{([\s\S]*?)\}\)/);
assert(callSite, 'could not find the hydrateFromStorage({...}) call in App.jsx');
const provided = new Set(
  callSite[1]
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.split(':')[0].trim())
);

// ── The check ──────────────────────────────────────────────────────────────

const missing = required.filter(name => !provided.has(name));
if (missing.length === 0) {
  ok(`App.jsx passes all ${required.length} deps bootHydrate destructures`);
} else {
  bad('App.jsx is missing deps bootHydrate destructures', missing.join(', ') +
      ' \u2014 boot will throw the moment the guarded branch is reached');
}

// The reverse is not an error (passing a spare setter is harmless) but it is
// almost always a leftover from a removed feature, so it is reported.
const unused = [...provided].filter(name => !required.includes(name));
if (unused.length === 0) {
  ok('and passes nothing bootHydrate no longer wants');
} else {
  console.log('  \u26a0 App.jsx passes deps bootHydrate does not destructure: ' +
              unused.join(', ') + ' (harmless, probably a leftover)');
  pass++;
}

// ── The catch that makes the next one visible ──────────────────────────────
//
// Even with the lists in sync, ANY throw in boot (bad stored data, a migration
// that chokes) leaves `loading` true forever. The catch is what turns a silent
// brick into a message. Assert it is still there.

// Bounded to the boot effect on purpose. A lazy [\s\S]*? across the whole file
// will happily run past this call and match some LATER .catch(), which is
// exactly how the first version of this check passed its own negative test.
// Look only between the call site and the effect's cleanup return.
const bootStart = appBody.indexOf('hydrateFromStorage({');
const cleanupAt = appBody.indexOf('mounted = false', bootStart);
const bootEffect = appBody.slice(bootStart, cleanupAt > -1 ? cleanupAt : bootStart + 2000);
if (/\}\)\s*\.catch\(/.test(bootEffect)) {
  ok('the boot call still has a .catch()');
} else {
  bad('the boot call lost its .catch()',
      'without it a boot throw shows no error at all, just the loading screen forever');
}

if (/setBootError/.test(appBody) && /if\s*\(bootError\)/.test(appBody)) {
  ok('and a boot failure renders its own screen rather than the normal UI');
} else {
  bad('boot failure no longer renders a dedicated screen',
      'rendering the app over half-hydrated state risks saving the empty half over good data');
}

// ── Every setter the boot body calls must be one it destructured ────────────
//
// Catches the inverse mistake: calling setSomething() in bootHydrate without
// adding it to the destructure, which reads as an undefined global.

const called = new Set();
for (const m of bootBody.matchAll(/\b(set[A-Z]\w*)\s*\(/g)) called.add(m[1]);
const undeclared = [...called].filter(n => !required.includes(n));
if (undeclared.length === 0) {
  ok('every setter bootHydrate calls is one it destructured');
} else {
  bad('bootHydrate calls setters it never destructured', undeclared.join(', '));
}

console.log('');
console.log(fail === 0 ? 'BOOT DEPS: ALL PASS' : `BOOT DEPS: ${fail} FAILURES`);
if (fail > 0) process.exit(1);
