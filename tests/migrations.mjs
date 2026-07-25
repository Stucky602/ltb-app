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

// ── v1→v2: legacy dishNotes fold into the journal ───────────────────────────
// A v1 payload carrying an old flat dishNotes map migrates into journal
// entries (marked migrated+undated — the real date is unknown and never
// invented), and the step is idempotent + non-destructive.
const v1Payload = { orders: [], dishNotes: { 'Bolognese': 'stir the bottom' }, keepMe: 'yes' };
const v2 = migrateForward(v1Payload, 1);
ok(v2.journal && v2.journal.entries.length === 1
   && v2.journal.entries[0].migrated === true && v2.journal.entries[0].undated === true,
  'v1→v2 folds legacy dishNotes into migrated+undated journal entries');
ok(v2.keepMe === 'yes' && v2.dishNotes,
  'v1→v2 is non-destructive — unrecognized fields and the legacy map both survive');
const v2again = migrateForward({ ...v2 }, 1);
ok(v2again.journal.entries.length === 1,
  'v1→v2 is idempotent — re-running the fold adds nothing');

// ── REFUSE_MESSAGE is a real, user-facing string ────────────────────────────
ok(typeof REFUSE_MESSAGE === 'string' && REFUSE_MESSAGE.length > 20 &&
   /nothing was changed/i.test(REFUSE_MESSAGE),
  'refuse message reassures that nothing was changed');

// ── v2→v3: stable dish identity ─────────────────────────────────────────────
// Additive only. `name` stays on every record so the readers that have not
// migrated yet keep working, and an unresolvable name is LEFT ALONE rather
// than guessed at, because those are real orphans worth surfacing.
{
  const { DISHES } = await import('../src/dishes.js');
  const real = DISHES[0].name, realId = DISHES[0].id;
  const v2 = {
    orders: [
      { id: 'o1', items: [
        { name: real, qty: 1 },
        { name: 'A Dish That Never Was', qty: 1 },
        { name: 'Omakase', omakase: true, qty: 1 },
      ] },
      { id: 'o2', items: null },
    ],
    journal: { version: 1, entries: [
      { id: 'j1', type: 'technique', subject: { kind: 'dish', dish: 'Curry of the Week' }, text: 'historical name' },
      { id: 'j2', type: 'decision', subject: { kind: 'general' }, text: 'no dish' },
    ] },
    keepMe: 'yes',
  };
  const v3 = migrateForward(v2, 2);
  const items = v3.orders[0].items;
  ok(items[0].dishId === realId && items[0].name === real,
    'an order item gains a dishId and KEEPS its name, so unmigrated readers keep working');
  ok(!items[1].dishId,
    'an unresolvable name is left alone, never guessed at — those are real orphans worth surfacing');
  ok(!items[2].dishId, 'an omakase line is not a catalog dish and gets no id');
  ok(v3.orders[1].items === null, 'an order with no items survives untouched');
  ok(v3.journal.entries[0].subject.dishId,
    'a journal entry filed under a HISTORICAL dish name resolves through DISH_RENAMES to the right id');
  ok(v3.journal.entries[0].subject.dish === 'Curry of the Week',
    'and keeps the original name, so nothing about the record is rewritten');
  ok(!v3.journal.entries[1].subject.dishId, 'a general entry has no dish to identify');
  ok(v3.keepMe === 'yes', 'unrecognized top-level fields survive');
  const again = migrateForward(v3, 2);
  ok(JSON.stringify(again) === JSON.stringify(v3), 'the step is idempotent');
}

console.log(`MIGRATIONS: ALL PASS (${pass} checks)`);
