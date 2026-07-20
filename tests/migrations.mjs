// tests/migrations.mjs — coverage for the schema-migration guard (EC-9).
//
// migrations.js guards app boot AND every restore path. It had no test file,
// so a single malformed guard would have hit both at once with no gate to
// catch it. This pins the four outcomes that matter:
//   current  — stored schema equals running code, pass through untouched
//   migrate  — stored schema is older, walk it forward
//   refuse   — stored schema is NEWER than the code (the documented threat:
//              a cross-device restore of newer data onto older code); the
//              guard must refuse, not mangle
//   unstamped — a pre-versioning payload (no version field) reads as v0 and
//              migrates forward rather than being mistaken for current
//
// Pure module, no DOM. Run: node tests/migrations.mjs

import assert from 'node:assert';
import {
  SCHEMA_VERSION,
  assessForwardCompat,
  migrateForward,
  REFUSE_MESSAGE,
} from '../src/migrations.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

// ── assessForwardCompat outcomes ────────────────────────────────────────────
ok(assessForwardCompat(SCHEMA_VERSION).outcome === 'current',
  'same version reads as current');

ok(assessForwardCompat(SCHEMA_VERSION + 1).outcome === 'refuse',
  'a NEWER stored schema than the code must REFUSE (cross-device newer-data threat)');

ok(assessForwardCompat(SCHEMA_VERSION + 5).outcome === 'refuse',
  'far-future schema also refuses');

// Older than current only exists to test once SCHEMA_VERSION advances past 1.
if (SCHEMA_VERSION > 0) {
  ok(assessForwardCompat(0).outcome === (SCHEMA_VERSION === 0 ? 'current' : 'migrate'),
    'v0 (unstamped/pre-versioning) migrates forward, never treated as current when code is newer');
}

// Non-integer / missing version → treated as v0 (unstamped), never refused.
ok(assessForwardCompat(undefined).outcome !== 'refuse',
  'missing version is not mistaken for a future schema');
ok(assessForwardCompat(null).outcome !== 'refuse',
  'null version is not mistaken for a future schema');
ok(assessForwardCompat('7').outcome !== 'refuse',
  'a string version is coerced safely, not read as a future integer');

// ── migrateForward ──────────────────────────────────────────────────────────
// Migrating from the current version is a no-op that preserves the payload.
const sample = { orders: [{ id: 'a', total: 10 }], regulars: [] };
const migrated = migrateForward(sample, SCHEMA_VERSION);
ok(JSON.stringify(migrated) === JSON.stringify(sample),
  'migrateForward from current version leaves data untouched');

// Migrating an unstamped (v0) payload up to current must not throw and must
// return a defined object, whatever steps exist.
const fromZero = migrateForward(sample, 0);
ok(fromZero && typeof fromZero === 'object',
  'migrateForward from v0 returns a usable object without throwing');

// ── REFUSE_MESSAGE is a real, user-facing string ────────────────────────────
ok(typeof REFUSE_MESSAGE === 'string' && REFUSE_MESSAGE.length > 20 &&
   /nothing was changed/i.test(REFUSE_MESSAGE),
  'refuse message reassures that nothing was changed');

console.log(`MIGRATIONS: ALL PASS (${pass} checks)`);
