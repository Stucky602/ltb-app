// src/recipeVersions.js — reading the immutable recipe version registry.
//
// The registry itself is src/recipeVersions.generated.js, written by
// tools/snapshotVersions.mjs from canon. Nothing here hashes or derives; it
// only reads. If you find yourself wanting to compute a version at runtime,
// that is the tool's job and the gate's job, not this file's.
//
// See the tool's header for what triggers a version (a change to dish.recipe
// and nothing else, per Kevin's ruling on Jul 30) versus what a version stores.

import { RECIPE_VERSIONS } from './recipeVersions.generated.js';
import { dishIdFor, resolveDishId } from './dishIdentity.js';

const BY_ID = new Map(RECIPE_VERSIONS.map(v => [v.id, v]));

const BY_DISH = new Map();
for (const v of RECIPE_VERSIONS) {
  const list = BY_DISH.get(v.dishId) || [];
  list.push(v);
  BY_DISH.set(v.dishId, list);
}
// Oldest first, so lineage reads like a timeline.
for (const list of BY_DISH.values()) {
  list.sort((a, b) => String(a.effectiveAt).localeCompare(String(b.effectiveAt)));
}

// THE EPOCH. Orders placed before versioning existed carry no version id, and
// they must stay that way. Do NOT backfill them to the oldest recorded version
// merely because it is the oldest one in code — that would assert a fact nobody
// knows. `versionLabel` renders them honestly instead.
export const VERSIONING_EPOCH = RECIPE_VERSIONS
  .map(v => v.effectiveAt)
  .sort()[0] || null;

export const LEGACY_LABEL = 'Legacy — exact recipe version unrecorded';

export function versionById(id) {
  return (id && BY_ID.get(id)) || null;
}

// Every version of a dish, oldest first. Accepts a dishId, a display name, or a
// record carrying either.
export function versionsFor(dishOrId) {
  const id = typeof dishOrId === 'string'
    ? (BY_DISH.has(dishOrId) ? dishOrId : dishIdFor(dishOrId))
    : resolveDishId(dishOrId);
  return (id && BY_DISH.get(id)) || [];
}

export function currentVersionFor(dishOrId) {
  return versionsFor(dishOrId).find(v => v.status === 'current') || null;
}

// Walks parentVersionId back to the root. Cycle-guarded: a malformed registry
// must not hang the app, and the gate is what catches the malformation.
export function lineage(versionId) {
  const out = [];
  const seen = new Set();
  let v = versionById(versionId);
  while (v && !seen.has(v.id)) {
    seen.add(v.id);
    out.push(v);
    v = v.parentVersionId ? versionById(v.parentVersionId) : null;
  }
  return out;
}

// What an ORDER should show. The honest-uncertainty path runs through here:
// a null id is legacy and says so, and an id that no longer resolves is a
// louder problem than legacy because it means the registry lost a record it
// promised to keep.
export function versionLabel(versionId) {
  if (!versionId) return LEGACY_LABEL;
  const v = versionById(versionId);
  if (!v) return `Unknown version (${versionId})`;
  const when = String(v.effectiveAt).slice(0, 10);
  return `${v.id} · effective ${when}`;
}

// A culinary diff between two versions, expressed as ingredient movement rather
// than raw JSON order. Additions, removals, and quantity changes — the three
// things that actually happened to the food.
// PURE, and separate from the registry on purpose. The diff is a statement
// about two snapshots; requiring both to be registry members made the logic
// untestable without mutating module state, which the first version of the test
// tried to do and could not, because BY_ID is built once at load.
export function diffSnapshots(snapA, snapB) {
  const a = { snapshot: snapA };
  const b = { snapshot: snapB };
  if (!snapA || !snapB) return null;

  const lines = (v) => {
    const r = v.snapshot?.recipe || {};
    const out = [...(r.base || [])];
    for (const k of Object.keys(r.extras || {})) out.push(...r.extras[k]);
    return out;
  };
  const key = (l) => l.name;
  const A = new Map(lines(a).map(l => [key(l), l]));
  const B = new Map(lines(b).map(l => [key(l), l]));

  const added = [];
  const removed = [];
  const changed = [];

  for (const [k, l] of B) {
    if (!A.has(k)) { added.push(l); continue; }
    const prev = A.get(k);
    if (prev.q !== l.q || prev.u !== l.u) changed.push({ name: k, from: prev, to: l });
  }
  for (const [k, l] of A) if (!B.has(k)) removed.push(l);

  return { added, removed, changed };
}

// Registry-aware wrapper. Returns null when either id is unknown, so a caller
// holding a stale id gets nothing rather than a misleading empty diff.
export function diffVersions(fromId, toId) {
  const a = versionById(fromId);
  const b = versionById(toId);
  if (!a || !b) return null;
  return { from: a.id, to: b.id, ...diffSnapshots(a.snapshot, b.snapshot) };
}

// Human-readable diff lines, the shape the Recipes tab renders.
export function describeDiff(fromId, toId) {
  return describeDiffResult(diffVersions(fromId, toId));
}

// Formats either shape, so the pure diff can be rendered too.
export function describeDiffResult(d) {
  if (!d) return [];
  const out = [];
  for (const l of d.added) out.push(`Added ${l.name}${l.q ? ` (${l.q}${l.u})` : ''}`);
  for (const l of d.removed) out.push(`Removed ${l.name}`);
  for (const c of d.changed) {
    out.push(`${c.name} changed from ${c.from.q}${c.from.u} to ${c.to.q}${c.to.u}`);
  }
  return out;
}

// ── Per-ITEM version stamping ───────────────────────────────────────────────
//
// WHY THIS EXISTS, AND WHY IT IS BIGGER THAN THE BACKLOG THOUGHT
//
// `offeredRecipeVersionId` and `servedRecipeVersionId` were added to the ORDER
// in schema v4, and the backlog carried "move them to the line item" as a small
// task. Checking the tree found something worse: they had ZERO write sites.
// migrations.js created them as null, chronicle.js read them, and nothing in
// the app ever set either one. So the Chronicle's version column has been
// answering from `currentVersionFor()` on every chapter — that is, from the
// recipe as it stands TODAY — and honestly reporting that as a gap. The job
// was never "move them", it was "record them at all".
//
// PER ITEM, NOT PER ORDER. A single order can hold four dishes, and Kevin can
// refine one of them between Sunday's close and Tuesday's cook. One id on the
// order cannot describe four dishes, and the Chronicle's own in-file note says
// so. An order-level id is only reliable when every dish in it happened to be
// at its current version, which is the normal case and not a guarantee.
//
// STAMP ONCE, NEVER OVERWRITE. Each field fills only when it is null or
// absent, so re-tapping Delivered, or an order passing through Delivered twice,
// cannot rewrite a version that was already recorded. The first recording is
// the true one; a later one would be a guess wearing the same field name.
//
// NULL WHEN UNKNOWN. An item whose name the registry cannot resolve to a dish
// id gets null, exactly like the v3→v4 migration's refusal to backfill. An
// unrecorded version renders as "Legacy — exact recipe version unrecorded",
// which is honest. Inventing one would defeat the entire point of an immutable
// registry, which is that it does not lie about history.
export function stampItemVersions(items, field) {
  return (items || []).map(it => {
    if (!it || typeof it !== 'object') return it;
    if (it[field]) return it; // already recorded — never overwrite
    const id = it.dishId || dishIdFor(it.name);
    const cur = id ? currentVersionFor(id) : null;
    return { ...it, [field]: (cur && cur.id) || null };
  });
}

export { RECIPE_VERSIONS };
