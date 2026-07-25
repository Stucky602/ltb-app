// tests/dishIdentity.mjs — stable dish identity.
//
// Every subsystem here identified a dish by its DISPLAY STRING, which made
// every rename a data migration. On Jul 24 four historical names were found
// sitting in order history that the registry no longer knew, each silently
// splitting its dish's passport stamps and sales counts, and the bug class was
// patched twice in one day without being fixed. This is the fix.
//
// Run: node tests/dishIdentity.mjs

import assert from 'node:assert';
import {
  DISH_ID_MANIFEST, dishById, dishIdFor, resolveDishId, dishNameFor,
  withDishId, unresolvableNames,
} from '../src/dishIdentity.js';
import { DISHES, ALWAYS_ITEMS } from '../src/dishes.js';
import { DISH_RENAMES } from '../src/utils.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

const ALL = [...DISHES, ...Object.values(ALWAYS_ITEMS).flat()];

// ── Coverage: identity is worthless if anything is outside it ───────────────
ok(ALL.every(d => typeof d.id === 'string' && d.id.length > 0),
  'EVERY registry item has an id, dinners and always-items alike');
ok(new Set(ALL.map(d => d.id)).size === ALL.length, 'ids are unique across BOTH registries');
ok(ALL.every(d => /^[a-z0-9-]+$/.test(d.id)), 'ids are lowercase slugs, safe in a URL or a filename');

// Always-items had to be covered: 'Chicken Breast' is one, and it was one of
// the four orphaned names that motivated this whole change.
ok(dishIdFor('Air-Chilled Chicken Breast'), 'always-items resolve, not just dinners');

// ── THE MANIFEST: append-only, never reused, never vanishing ───────────────
const live = new Set(ALL.map(d => d.id));
const missing = DISH_ID_MANIFEST.filter(id => !live.has(id));
ok(missing.length === 0,
  `no issued id has vanished from the registry (missing: ${missing.join(', ') || 'none'}) — a vanished id means orphaned history`);
ok(new Set(DISH_ID_MANIFEST).size === DISH_ID_MANIFEST.length, 'the manifest itself has no duplicates');
ok(DISH_ID_MANIFEST.length === ALL.length, 'the manifest covers the whole registry');
ok(Object.isFrozen(DISH_ID_MANIFEST), 'and it is frozen, because it is a record not a variable');

// ── Historical names resolve, which is the entire point ────────────────────
for (const [oldName, newName] of Object.entries(DISH_RENAMES)) {
  const viaOld = dishIdFor(oldName);
  const viaNew = dishIdFor(newName);
  ok(viaOld && viaOld === viaNew,
    `"${oldName}" and "${newName}" resolve to the SAME id — a rename can no longer split a dish's history`);
}

// ── Resolution ──────────────────────────────────────────────────────────────
const d0 = DISHES[0];
ok(dishById(d0.id).name === d0.name, 'an id resolves back to its dish');
ok(dishById('not-a-real-id') === null, 'an unknown id resolves to null, never a throw');
ok(dishIdFor('A Dish That Never Was') === null, 'a name nothing knows resolves to null');
ok(dishIdFor(null) === null && dishIdFor('') === null, 'empty input resolves to null');

// A stored id WINS over a stored name, which is what makes renames free.
ok(resolveDishId({ dishId: d0.id, name: 'Whatever It Used To Be Called' }) === d0.id,
  'a stored id beats a stored name, so the display string can change freely');
ok(resolveDishId({ name: d0.name }) === d0.id, 'and a record with only a name still resolves');
ok(resolveDishId({ dishId: 'bogus', name: d0.name }) === d0.id,
  'a bogus stored id falls back to the name rather than failing');
ok(resolveDishId(null) === null, 'a null record resolves to null');

ok(dishNameFor(d0.id) === d0.name, 'an id gives back its current display name');
ok(dishNameFor('gone-forever', 'Old Label') === 'Old Label',
  'an id no longer in the registry falls back to the name the record carried, never a raw slug');

// ── Stamping ────────────────────────────────────────────────────────────────
const stamped = withDishId({ name: d0.name, qty: 2 });
ok(stamped.dishId === d0.id && stamped.qty === 2, 'stamping adds the id and preserves everything else');
const already = { name: d0.name, dishId: d0.id };
ok(withDishId(already) === already, 'a record that already has an id is returned unchanged (identity comparison)');
const unknown = { name: 'A Dish That Never Was' };
ok(withDishId(unknown) === unknown, 'an unresolvable record is returned unchanged rather than half-stamped');

// ── The orphan check, in identity terms ────────────────────────────────────
const records = [
  { name: d0.name, qty: 1 },
  { name: 'Curry of the Week', qty: 1 },
  { name: 'A Dish That Never Was', qty: 1 },
  { name: 'A Dish That Never Was', qty: 1 },
  { name: 'Omakase', omakase: true, qty: 1 },
];
const orphans = unresolvableNames(records);
ok(orphans.length === 1 && orphans[0].name === 'A Dish That Never Was',
  'only a name that resolves to NO id is unresolvable — a renamed one is fine');
ok(orphans[0].count === 2, 'and it reports how many records carry it, so the worst one is obvious');
ok(!orphans.some(o => /Omakase/.test(o.name)), 'omakase is an act of trust, not a catalog item');

console.log(`DISH IDENTITY: ALL PASS (${pass} checks)`);
