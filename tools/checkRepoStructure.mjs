// checkRepoStructure.mjs — structural guards for the two silent-deploy
// failure modes found in the July 15 2026 session:
//
//   1. A committed app.js at repo root. Cloudflare REBUILDS app.js from
//      src/ on every deploy, so a committed copy does nothing when the
//      build succeeds — but if the build ever breaks, Cloudflare falls
//      back to serving whatever stale app.js sits in the repo. That is a
//      silent, working-looking deploy of old code. No error, no diff,
//      nothing to notice. Deleting the committed file makes a broken
//      build fail LOUDLY (blank page) instead of quietly serving stale
//      code. This check keeps it deleted.
//
//   2. order.html missing or shadowed. /order resolves to order.html
//      only because that file sits at the repo root with nothing else
//      matching first. Kevin's worst historical bug was both admin and
//      customer links resolving to the same (admin) app — if order.html
//      is ever renamed, moved, or excluded, that bug returns silently,
//      and it hands the admin app (with PUBLISH_TOKEN baked into the
//      bundle) to whichever customer clicks the order link.
//
// Exit 0 = clean. Exit 1 = fails with a plain-language reason.

import { existsSync, readFileSync } from 'fs';

let failed = 0;
const fail = (msg) => { console.log('  ✗ ' + msg); failed++; };
const ok = (msg) => console.log('  ✓ ' + msg);

// ── 1. No committed app.js ───────────────────────────────────────────────────
if (existsSync('app.js')) {
  fail('app.js is committed at repo root. This is the BUILD OUTPUT — Cloudflare ' +
    'generates it fresh on every deploy. A committed copy hides a broken build ' +
    'behind a stale, working-looking app instead of a visible failure. Delete it.');
} else {
  ok('no committed app.js at repo root');
}

// ── sw.js present ────────────────────────────────────────────────────────────
// App.jsx registers /sw.js unconditionally. If it goes missing from a zip, the
// registration 404s silently and both push and the update banner die with it.
if (!existsSync('sw.js')) {
  fail('sw.js is missing. App.jsx registers it; without the file, push and the update prompt silently stop working.');
} else {
  ok('sw.js present');
}

// ── 2. order.html present and not shadowed ───────────────────────────────────
if (!existsSync('order.html')) {
  fail('order.html is missing from the repo root. /order will stop resolving to ' +
    'the customer landing page and will fall through to whatever serves next — ' +
    'which, historically, has been the admin app.');
} else {
  ok('order.html present at repo root');
}

// ── 3. .assetsignore exists and actually covers the source tree ─────────────
// Confirmed by direct request during this session: assets.directory is "." and
// wrangler's old `exclude` key under `assets` was silently inert for months.
// src/, tests/, tools/, and worker.js were served to the public the entire
// time. .assetsignore (gitignore-format, read from the assets root) is the
// real mechanism. This check does not re-derive that fact — it just makes
// sure the fix doesn't quietly disappear in a future edit.
if (!existsSync('.assetsignore')) {
  fail('.assetsignore is missing. Without it, assets.directory "." serves the ' +
    'ENTIRE repo publicly, including src/, tests/, tools/, and worker.js.');
} else {
  const ig = readFileSync('.assetsignore', 'utf8');
  const required = ['src', 'tests', 'tools', 'worker.js'];
  const missing = required.filter(p => !ig.split('\n').map(l => l.trim()).includes(p));
  if (missing.length) {
    fail('.assetsignore exists but no longer lists: ' + missing.join(', ') +
      ' — those would be served publicly again.');
  } else {
    ok('.assetsignore covers src/, tests/, tools/, worker.js');
  }
}

// ── 4. wrangler.jsonc has no dead `exclude` key ──────────────────────────────
// `exclude` under `assets` is not a supported key (it belongs to the
// deprecated Workers Sites `[site]` config) and was silently ignored for
// months while everyone believed it was protecting the source tree. Guard
// against it quietly coming back and re-creating that false confidence.
if (existsSync('wrangler.jsonc')) {
  const cfg = readFileSync('wrangler.jsonc', 'utf8');
  // Strip // and /* */ comments before checking, so the check reads
  // config the way Wrangler would, not the way JSON.parse would choke on it.
  const stripped = cfg
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  if (/"exclude"\s*:/.test(stripped)) {
    fail('wrangler.jsonc has an "exclude" key under assets. This key is NOT ' +
      'supported for Workers Static Assets and does nothing — it already fooled ' +
      'one planning session into believing src/ was protected when it was fully ' +
      'public. Use .assetsignore instead.');
  } else {
    ok('wrangler.jsonc has no dead "exclude" key');
  }
} else {
  fail('wrangler.jsonc is missing.');
}

console.log(failed === 0 ? '\nREPO STRUCTURE: ALL PASS' : `\nREPO STRUCTURE: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
