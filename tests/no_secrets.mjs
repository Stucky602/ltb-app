// tests/no_secrets.mjs — nothing secret may be compiled into the public bundle.
//
// WHY THIS EXISTS
//
// src/config.js carried `export const PUBLISH_TOKEN = 'ltb-publish-2026';` as a
// string literal. That literal was compiled into app.js. index.html loads
// app.js, and .assetsignore deliberately does NOT exclude it (there is a
// comment there telling you not to), so the bundle is served publicly at the
// site root.
//
// That token gates /config, /backup, /backup/list, /votes/full, /requests,
// /feedback/history, and the order routes. /backup returns full snapshots:
// customer names, addresses, phone numbers, the private journal, and Rowan's
// log. Anyone who opened the homepage could read the token out of the bundle
// and download all of it.
//
// Nothing caught it because nothing was looking. This looks.
//
// SCOPE, honestly stated: this test proves a secret is not IN THE BUNDLE. It
// does not prove the app is authenticated, and moving the token to localStorage
// did not make it so — anyone with devtools on an unlocked device can still
// read it. The real owner boundary is Cloudflare Access in front of
// index.html. This gate stops the regression, not the underlying design.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
};

// ── The specific literal that shipped ───────────────────────────────────────
{
  const burned = 'ltb' + '-publish-' + '2026';   // split so this file is not itself a hit
  const cfg = read('src/config.js') || '';
  ok('the burned token literal is gone from src/config.js', !cfg.includes(burned),
    'it was public in app.js and must be treated as compromised, not reused');

  const bundle = read('app.js');
  if (bundle) {
    ok('and it is not in the built bundle', !bundle.includes(burned));
  } else {
    ok('app.js is not committed (it is build output, and committing it is its own finding)', true);
  }
}

// ── No token may be assigned a literal in config ────────────────────────────
{
  const cfg = read('src/config.js') || '';
  // Matches `TOKEN = 'something'` / `SECRET = "..."` / `API_KEY = ...` with a
  // non-empty literal. An empty string is the correct runtime-loaded shape.
  const bad = [...cfg.matchAll(/(?:^|\s)(?:const|let|var)\s+([A-Z_]*(?:TOKEN|SECRET|KEY|PASSWORD)[A-Z_]*)\s*=\s*['"`]([^'"`]+)['"`]/g)]
    // Storage key names and the VAPID PUBLIC key are not secrets.
    .filter(m => !/_KEY$/.test(m[1]) || /SECRET|TOKEN|PASSWORD/.test(m[1]))
    .filter(m => !/^VAPID_PUBLIC_KEY$/.test(m[1]));
  ok('no secret-shaped constant is assigned a literal in src/config.js',
    bad.length === 0, bad.map(m => `${m[1]} = '${m[2].slice(0, 12)}…'`).join('\n      '));
}

// ── An Anthropic key must never be near the client ──────────────────────────
{
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { walk(rel); continue; }
      if (!/\.(js|jsx|html)$/.test(e.name)) continue;
      const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      // The real prefix, split so this file does not match itself.
      if (t.includes('sk-' + 'ant-')) hits.push(rel);
    }
  };
  walk('src');
  ok('no Anthropic key anywhere under src/', hits.length === 0, hits.join(', '));
}

// ── The worker's own guards ─────────────────────────────────────────────────
{
  const w = read('worker.js');
  if (!w) {
    ok('worker.js present to check', false, 'worker.js is missing from the repo');
  } else {
    ok('the AI proxy routes require the token',
      /X-LTB-Token'\) !== env\.PUBLISH_TOKEN/.test(w),
      'all four /parse-* routes forwarded to Anthropic with no auth at all until Jul 29');

    ok('CORS does not fall back to a wildcard',
      !/ALLOWED_ORIGINS\.includes\(origin\) \? origin : '\*'/.test(w),
      "returning '*' for unrecognised origins lets any page read token-gated responses");

    ok('the Anthropic proxy caps payload size', /payload too large/.test(w));
    ok('and pins the model rather than trusting the caller',
      /parsed\.model = CLAUDE_MODEL/.test(w),
      'the body was forwarded verbatim, so the caller chose the model and max_tokens');

    ok('the worker never hardcodes its own token',
      !/PUBLISH_TOKEN\s*=\s*['"][^'"]+['"]/.test(w),
      'it must come from env, set as a Cloudflare secret');
  }
}

// ── The bundle is public, and that is the reason for all of the above ───────
{
  const ignore = read('.assetsignore') || '';
  const idx = read('index.html') || '';
  const bundleIsPublic = idx.includes('app.js') && !/^app\.js$/m.test(ignore);
  ok('app.js is understood to be publicly served (this is expected, not a bug)',
    bundleIsPublic,
    'if this ever changes, the reasoning in src/config.js should be revisited');
}

console.log(f === 0 ? '\nNO SECRETS: ALL PASS' : `\nNO SECRETS: ${f} FAILURES`);
process.exit(f ? 1 : 0);
