// tests/recipe_versions.mjs — the immutable recipe version registry.
//
// WHAT THIS PROTECTS
//
// A version registry that can be edited in place is just a slower way of
// storing the current recipe. The value is entirely in the promise that an old
// entry never changes, so an order placed in March still resolves to the food
// that was actually cooked in March. Most of the assertions below exist to
// catch that promise being broken quietly.
//
// The OTHER half is honest uncertainty. Every order that predates versioning is
// genuinely unknown, and the failure mode worth guarding is somebody making the
// migration "look complete" by backfilling those orders to the oldest recorded
// version. That would be a fabricated fact in a record whose whole purpose is
// to be trustworthy.
//
// Kevin's ruling (Jul 30): a version is cut ONLY on a recipe change. The two
// assertions that pin that down are "a price change cuts no version" and "a
// recipe change does", and they are the most important ones here.

import { DISHES } from '../src/dishes.js';
import { dishById } from '../src/dishIdentity.js';
import { recipeHash } from '../tools/snapshotVersions.mjs';
import {
  RECIPE_VERSIONS, versionById, versionsFor, currentVersionFor, lineage,
  versionLabel, describeDiff, describeDiffResult, diffVersions, diffSnapshots, LEGACY_LABEL, VERSIONING_EPOCH,
} from '../src/recipeVersions.js';
import { SCHEMA_VERSION, migrateForward } from '../src/migrations.js';

let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

// ── Registry integrity ──────────────────────────────────────────────────────
{
  ok('the registry is populated', RECIPE_VERSIONS.length > 0, String(RECIPE_VERSIONS.length));

  const ids = RECIPE_VERSIONS.map(v => v.id);
  ok('version ids are unique', new Set(ids).size === ids.length,
    'a reused id makes an order point at two different recipes');

  const badAnchor = RECIPE_VERSIONS.filter(v => !dishById(v.dishId));
  ok('every version anchors to a real dish identity', badAnchor.length === 0,
    badAnchor.map(v => v.id).join(', '));

  const badShape = RECIPE_VERSIONS.filter(v => !/^[a-z0-9-]+@\d{4}-\d{2}-\d{2}-[a-z]$/.test(v.id));
  ok('version ids follow dishId@YYYY-MM-DD-letter', badShape.length === 0,
    badShape.map(v => v.id).join(', '));

  const nameDerived = RECIPE_VERSIONS.filter(v => /[ ,()/]/.test(v.id));
  ok('no version id is derived from a display name', nameDerived.length === 0,
    nameDerived.map(v => v.id).join(', '));
}

// ── One current per dish, and every live dish has one ───────────────────────
{
  const missing = DISHES.filter(d => !currentVersionFor(d.id));
  ok('every dinner has a current recipe version', missing.length === 0,
    missing.map(d => d.name).join(', '));

  const multi = [];
  for (const d of DISHES) {
    const currents = versionsFor(d.id).filter(v => v.status === 'current');
    if (currents.length > 1) multi.push(`${d.name} has ${currents.length}`);
  }
  ok('no dish has more than one current version', multi.length === 0, multi.join(', '));

  // OFF_MENU dishes must keep resolving. Keeping the record was the entire
  // reason they were pulled off-menu instead of deleted.
  const offMenu = ['Coriander Lamb Steak over Gigantes Beans', 'Bone-In Pork Rib Chop with All the Fixings'];
  for (const name of offMenu) {
    ok(`an off-menu dish still has a version (${name.slice(0, 24)}…)`, !!currentVersionFor(name));
  }
}

// ── Parent links resolve, and no cycles ─────────────────────────────────────
{
  const orphaned = RECIPE_VERSIONS.filter(v => v.parentVersionId && !versionById(v.parentVersionId));
  ok('every parent link resolves', orphaned.length === 0,
    orphaned.map(v => `${v.id} → ${v.parentVersionId}`).join(', '));

  let cyclic = null;
  for (const v of RECIPE_VERSIONS) {
    const chain = lineage(v.id);
    if (chain.length !== new Set(chain.map(x => x.id)).size) { cyclic = v.id; break; }
    // lineage() is cycle-guarded, so a cycle shows up as a chain that fails to
    // reach a root rather than as a hang.
    const last = chain[chain.length - 1];
    if (last && last.parentVersionId && !chain.some(x => x.id === last.parentVersionId)) {
      // walked off the end legitimately (parent missing) — covered above
    }
  }
  ok('no lineage contains a cycle', cyclic === null, cyclic || '');
}

// ── THE RULING: recipe changes trigger, nothing else does ───────────────────
{
  const d = DISHES.find(x => x.id === 'bolognese');
  const base = recipeHash(d.recipe);

  // Price, cost, effort, cuisine, copy, allergens: none of these are in the
  // recipe object, so none can move the hash. Asserted by hashing a clone whose
  // recipe is untouched but whose everything-else differs.
  const priceChanged = { ...d, variants: d.variants.map(v => ({ ...v, price: v.price + 10 })) };
  ok('a price change does not move the recipe hash', recipeHash(priceChanged.recipe) === base);

  const effortChanged = { ...d, effort: 5, cuisine: 'Spotlight' };
  ok('effort and cuisine do not move it', recipeHash(effortChanged.recipe) === base);

  const copyChanged = { ...d, copy: { ...d.copy, desc: 'totally different words' } };
  ok('customer copy does not move it', recipeHash(copyChanged.recipe) === base);

  // A quantity change is the canonical recipe edit.
  const qtyChanged = {
    ...d.recipe,
    base: d.recipe.base.map((l, i) => (i === 0 ? { ...l, q: l.q + 1 } : l)),
  };
  ok('a quantity change DOES move it', recipeHash(qtyChanged) !== base);

  // Adding a line, removing a line, and changing a unit all count.
  const added = { ...d.recipe, base: [...d.recipe.base, { name: 'Nutmeg', q: 1, u: 'tsp', staple: false }] };
  ok('adding an ingredient moves it', recipeHash(added) !== base);

  const removed = { ...d.recipe, base: d.recipe.base.slice(1) };
  ok('removing an ingredient moves it', recipeHash(removed) !== base);

  const unitChanged = {
    ...d.recipe,
    base: d.recipe.base.map((l, i) => (i === 0 ? { ...l, u: l.u === 'lb' ? 'oz' : 'lb' } : l)),
  };
  ok('changing a unit moves it', recipeHash(unitChanged) !== base);

  // Determinism: key order inside a line must not matter, or a cosmetic edit
  // demands a phantom version.
  const reordered = {
    ...d.recipe,
    base: d.recipe.base.map(l => ({ staple: l.staple, u: l.u, q: l.q, name: l.name })),
  };
  ok('object key order does not move it', recipeHash(reordered) === base,
    'canonicalization is what stops a cosmetic reorder demanding a version');

  // Factors ride along on purpose: they scale how much food a customer gets.
  const factorsChanged = { ...d.recipe, factors: { ...d.recipe.factors, __test: 9 } };
  ok('a scaling factor change DOES move it', recipeHash(factorsChanged) !== base,
    'factors live inside recipe and change portion size');
}

// ── Canon matches the declared current version ──────────────────────────────
// This is the assertion that makes versions immutable rather than decorative.
// tools/snapshotVersions.mjs enforces the same thing as its own gate command;
// duplicated here so a failure names the dish inside the normal test output.
{
  const drifted = DISHES.filter(d => {
    const cur = currentVersionFor(d.id);
    return !cur || cur.recipeHash !== recipeHash(d.recipe);
  });
  ok('canon matches every declared current version', drifted.length === 0,
    drifted.map(d => d.name).join(', ') + (drifted.length ? '\n      → run: node tools/snapshotVersions.mjs --write' : ''));
}

// ── Snapshots are complete and costable ─────────────────────────────────────
{
  const noRecipe = RECIPE_VERSIONS.filter(v => !v.snapshot?.recipe?.base?.length);
  ok('every snapshot carries recipe lines', noRecipe.length === 0,
    noRecipe.map(v => v.id).join(', '));

  const noRefs = RECIPE_VERSIONS.filter(v => !Array.isArray(v.snapshot?.componentVersionRefs));
  ok('every snapshot carries a componentVersionRefs array', noRefs.length === 0,
    'present from day one so components land without migrating an append-only registry');

  const cur = currentVersionFor('bolognese');
  ok('the snapshot freezes packaging alongside the recipe', !!cur.snapshot.packaging);
  ok('and the customer-facing copy', typeof cur.snapshot.copy.desc === 'string');
  ok('and the allergen declaration', 'allergens' in cur.snapshot);
}

// ── Honest uncertainty ──────────────────────────────────────────────────────
{
  ok('a null version id renders as legacy, not as a guess', versionLabel(null) === LEGACY_LABEL);
  ok('an unresolvable id is louder than legacy', /Unknown version/.test(versionLabel('ghost@2020-01-01-a')),
    'a missing record is a registry failure, not the same as never having had one');
  ok('the epoch is recorded', !!VERSIONING_EPOCH);

  // The migration must not invent history.
  const legacy = { orders: [{ id: 'old', customer: 'A' }] };
  const migrated = migrateForward(legacy, 3);
  ok('migration leaves historical orders unversioned',
    migrated.orders[0].offeredRecipeVersionId === null && migrated.orders[0].servedRecipeVersionId === null,
    'backfilling to the oldest recorded version would assert a fact nobody knows');
  ok('and it is idempotent',
    migrateForward(migrated, 3).orders[0].offeredRecipeVersionId === null);
  // AT LEAST 4, not exactly 4. The intent of this line is "the schema advanced
  // when recipe versioning landed", and versioning landed at v4. Pinning the
  // literal made it a tripwire on every LATER migration instead: v5 (recipe
  // versions moving to the line item) broke it while changing nothing this file
  // tests. Same lesson as the container-count assertions — assert the property,
  // not a number that the registry is expected to outgrow.
  ok('SCHEMA_VERSION is at or past the recipe-versioning migration (v4)',
    SCHEMA_VERSION >= 4, `SCHEMA_VERSION is ${SCHEMA_VERSION}`);
}

// ── Diffs describe food, not JSON ───────────────────────────────────────────
{
  const cur = currentVersionFor('bolognese');
  ok('a diff against itself is empty', describeDiff(cur.id, cur.id).length === 0);
  ok('a diff with a bogus id returns null rather than throwing',
    diffVersions('nope', cur.id) === null);

  // Exercised through the PURE function, against synthetic snapshots. The first
  // version of this test pushed a fake record onto RECIPE_VERSIONS and expected
  // versionById to find it, which it never could: the lookup maps are built once
  // at module load, correctly, because a generated registry does not change at
  // runtime. The fix was to make the diff logic not require registry membership.
  const older = { ...cur.snapshot, recipe: { ...cur.snapshot.recipe, base: cur.snapshot.recipe.base.slice(1) } };
  const addLines = describeDiffResult(diffSnapshots(older, cur.snapshot));
  ok('a diff names an added ingredient', addLines.some(l => /^Added /.test(l)), addLines.join(' | '));

  const removeLines = describeDiffResult(diffSnapshots(cur.snapshot, older));
  ok('and a removed one', removeLines.some(l => /^Removed /.test(l)), removeLines.join(' | '));

  const bumped = {
    ...cur.snapshot,
    recipe: { ...cur.snapshot.recipe, base: cur.snapshot.recipe.base.map((l, i) => (i === 0 ? { ...l, q: l.q + 3 } : l)) },
  };
  const changeLines = describeDiffResult(diffSnapshots(cur.snapshot, bumped));
  ok('and a quantity that moved, with both numbers',
    changeLines.some(l => /changed from .* to /.test(l)), changeLines.join(' | '));
}

console.log(f === 0 ? '\nRECIPE VERSIONS: ALL PASS' : `\nRECIPE VERSIONS: ${f} FAILURES`);
process.exit(f ? 1 : 0);
