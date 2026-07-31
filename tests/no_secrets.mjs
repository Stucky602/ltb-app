// tests/no_secrets.mjs — nothing secret may be compiled into the public bundle.
//
// WHY THIS EXISTS
//
// src/config.js carried `export const PUBLISH_TOKEN = 'ltb-publish-2026';` as a
// string literal. That literal was compiled into app.js. kitchen.html loads
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

// ── The service worker shell must actually exist ────────────────────────────
// The owner app moved from '/' to '/kitchen.html' on Jul 30 so the site root
// could become the customer door. SHELL is a hardcoded list of paths, and the
// install handler swallows individual misses (`.catch(() => null)`), so a stale
// entry does not fail loudly — it just quietly stops being available offline.
{
  const sw = read('sw.js') || '';
  const m = sw.match(/const SHELL = \[([^\]]*)\]/);
  ok('sw.js declares a SHELL', !!m);
  if (m) {
    const paths = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
    // app.js is BUILD OUTPUT — Cloudflare generates it on deploy and committing
    // it fails checkRepoStructure by design, so it is correctly absent here.
    const BUILD_OUTPUT = new Set(['/app.js']);
    const missing = paths.filter(x =>
      x !== '/' && !BUILD_OUTPUT.has(x) && !fs.existsSync(path.join(ROOT, x.replace(/^\//, ''))));
    ok('every precached shell path exists on disk', missing.length === 0,
      missing.join(', ') + (missing.length ? '\n      → install swallows these silently; offline just stops working' : ''));
    ok('the shell no longer points at the old owner root',
      !paths.includes('/index.html'),
      'index.html is now a redirect stub; caching it makes the offline fallback a redirect');
  }

  ok('the offline fallback points at the owner app, not the redirect stub',
    /caches\.match\('\/kitchen\.html'\)/.test(sw));

  ok('the service worker refuses to cache an auth challenge as code',
    /looksLikeLogin/.test(sw),
    'Access returns its login page with status 200; without this guard it gets cached as app.js');

  const mf = read('manifest.json') || '';
  ok('the PWA opens the owner app, not the customer page',
    /"start_url":\s*"\/kitchen\.html"/.test(mf));
  ok('the manifest id is unchanged, so existing installs are not orphaned',
    /"id":\s*"\/\?app"/.test(mf));
}

// ── The site root is the customer door ──────────────────────────────────────
{
  const root = read('index.html') || '';
  // Match an actual script tag, not the string anywhere — the file's own
  // comment explains why the bundle used to be here and mentions it by name.
  ok('the site root no longer loads the owner bundle',
    !/<script[^>]*src=["'][^"']*app\.js/.test(root),
    'anyone typing the bare domain would land on the operations app');
  ok('and it sends visitors to the customer page', /order\.html/.test(root));

  const kitchen = read('kitchen.html') || '';
  ok('the owner app exists at kitchen.html', /app\.js/.test(kitchen));
}

// ── The bundle is public, and that is the reason for all of the above ───────
{
  const ignore = read('.assetsignore') || '';
  const idx = read('kitchen.html') || '';
  const bundleIsPublic = idx.includes('app.js') && !/^app\.js$/m.test(ignore);
  ok('app.js is understood to be publicly served (this is expected, not a bug)',
    bundleIsPublic,
    'if this ever changes, the reasoning in src/config.js should be revisited');
}


// ── package.json and package-lock.json must agree ──────────────────────────
//
// On Jul 30 the Cloudflare build failed with "npm ci can only install packages
// when your package.json and package-lock.json are in sync", and every push
// after it silently stopped deploying. The cause was two drifts:
//
//   1. package.json was bumped to 10.1.0 for the service-worker version check
//      and the lock still said 9.9.0. The root version is part of what npm ci
//      compares.
//   2. The lock recorded ONE of esbuild's 24 optional platform binaries,
//      because it was generated on linux-x64 and npm prunes the rest. Cloudflare
//      validates all of them.
//
// Neither is visible locally: `npm test` never runs `npm ci`. So the gate has to
// look, or the next version bump takes the site down the same way.
//
// FIXING IT: regenerate the lock in an EMPTY directory containing only
// package.json, so npm resolves from the registry with no node_modules to prune
// against, then copy the result back.
{
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const lockPath = path.join(ROOT, 'package-lock.json');
  ok('there is a lock file', fs.existsSync(lockPath),
    'Cloudflare runs npm clean-install and cannot proceed without one');

  if (fs.existsSync(lockPath)) {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    ok('the lock version matches package.json',
      lock.version === pkg.version,
      `package.json ${pkg.version} vs lock ${lock.version} — npm ci compares these`);
    ok('and so does the root package entry',
      !lock.packages || !lock.packages[''] || lock.packages[''].version === pkg.version);

    // Every optional dependency a locked package declares needs its own entry,
    // or npm ci reports it missing.
    const missing = [];
    for (const [name, entry] of Object.entries(lock.packages || {})) {
      if (!entry || !entry.optionalDependencies) continue;
      for (const dep of Object.keys(entry.optionalDependencies)) {
        if (!lock.packages[`node_modules/${dep}`]) missing.push(dep);
      }
    }
    ok('every optional dependency is recorded in the lock',
      missing.length === 0,
      `${missing.length} missing, e.g. ${missing.slice(0, 3).join(', ')} — regenerate the lock in an empty directory`);
  }
}

console.log(f === 0 ? '\nNO SECRETS: ALL PASS' : `\nNO SECRETS: ${f} FAILURES`);
process.exit(f ? 1 : 0);
