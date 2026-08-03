// tools/snapshotVersions.mjs — cuts and verifies immutable recipe versions.
//
// WHAT A VERSION IS, AND WHAT TRIGGERS ONE
//
// Kevin's ruling, Jul 30: a new version is cut ONLY when the RECIPE itself
// changes. Not variants, not reheat copy, not allergens, not the customer
// description, not packaging. The recipe is the one thing he actually edits,
// and versioning on everything else means the history churns until it stops
// meaning anything. Fesenjan went from $150 to $140 the day before this was
// written and its food did not change; that must not cut a version.
//
// So there are two different things here and conflating them is the whole trap:
//
//   TRIGGER   — a hash of `dish.recipe` and nothing else. This decides whether
//               a new version is needed.
//   CONTENTS  — the snapshot freezes the recipe PLUS the surrounding food
//               context (reheat, allergens, customer copy, containers) as they
//               stood at cut time, because the archive needs the full picture
//               of what shipped.
//
// A consequence worth stating once, since it is a real cost of the ruling: an
// allergen or reheat change with NO recipe change cuts no version. A historical
// order therefore resolves to a version whose stored allergen block may be
// older than what was actually declared when it shipped. Kevin has effectively
// ruled that the recipe is the historical record and the rest is current-state.
// That is coherent and it is his call. The UI must label those fields "as of
// version cut" rather than "as served", and nobody should re-litigate it here.
//
// WHY GENERATED RATHER THAN HAND-AUTHORED
//
// src/dishes.js is canon and its header forbids re-declaring dish facts
// elsewhere. A hand-maintained version registry is a second copy of every
// recipe by definition, and the one that goes stale. So canon stays the only
// authoring surface, this tool derives snapshots from it, and --check makes the
// build fail when they disagree. That failure IS the workflow: it tells Kevin
// he changed a recipe and needs to cut a version.
//
//   node tools/snapshotVersions.mjs           # check, prints drift, exits 1
//   node tools/snapshotVersions.mjs --write   # cut versions for drifted dishes
//
// SCOPE: dinners only for v1. 29 of 34 always-items carry recipe lines and are
// versionable in principle, but the always-item order path stores its items
// differently and wiring their version refs is separate work with its own
// migration. Do not let v1 grow.

import { createHash } from 'crypto';
import { pathToFileURL } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { DISHES } from '../src/dishes.js';
import { containersForDish } from '../src/containers.js';

const OUT = 'src/recipeVersions.generated.js';
const WRITE = process.argv.includes('--write');

// ── Canonical serialization ─────────────────────────────────────────────────
//
// JSON.stringify emits object keys in INSERTION order, so moving a line's
// `staple` field before its `u` field would change the hash and demand a
// phantom version for an edit that changed no food. Object keys are therefore
// sorted recursively.
//
// ARRAY ORDER IS DELIBERATELY SIGNIFICANT. Reordering the lines in a recipe is
// arguably a real edit (it is the order Kevin cooks in), and preserving it
// means a reordered recipe cuts a version. That is the intended behaviour, not
// an oversight. If it ever becomes annoying, sorting `base` by name here is the
// change — but it would make two genuinely different recipes hash alike, so
// think first.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = canonical(value[k]);
    return out;
  }
  return value;
}

// The trigger hash. `dish.recipe` is { factors, base, extras }.
//
// `factors` is included on purpose: it is the per-variant scaling multiplier
// living INSIDE the recipe object, so changing one changes how much food a
// customer receives at a given size. That is a recipe change in the sense the
// ruling means, even though the variants ARRAY (labels, prices) stays out. If
// Kevin decides otherwise, delete the line below and nothing else moves.
export function recipeHash(recipe) {
  const subject = {
    factors: recipe?.factors ?? null,
    base: recipe?.base ?? [],
    extras: recipe?.extras ?? {},
  };
  return createHash('sha256').update(JSON.stringify(canonical(subject))).digest('hex');
}

// The frozen context. Not hashed, not a trigger — just what shipped alongside
// the recipe when this version was cut.
function snapshotOf(dish) {
  return {
    recipe: canonical(dish.recipe),
    variants: (dish.variants || []).map(v => v.label),
    reheat: dish.reheat ?? null,
    stewVegCopy: dish.stewVegCopy ?? null,
    allergens: canonical(dish.allergens ?? null),
    copy: {
      desc: dish.copy?.desc ?? null,
      reheat: dish.copy?.reheat ?? null,
      contains: dish.copy?.contains ?? null,
    },
    packaging: canonical(containersForDish(dish.name) ?? null),
    // Empty until components exist. Present from day one so Feature 2 lands
    // without a schema migration on an append-only registry.
    componentVersionRefs: [],
  };
}

// ── Version IDs ─────────────────────────────────────────────────────────────
// <dishId>@<YYYY-MM-DD>-<letter>. Anchored to the immutable dishId, never the
// display name. The letter increments for multiple cuts on one day. IDs are
// never reused, including after a dish leaves the live menu.
function nextVersionId(dishId, isoDate, existing) {
  const prefix = `${dishId}@${isoDate}-`;
  const used = existing.filter(v => v.id.startsWith(prefix)).length;
  return prefix + String.fromCharCode(97 + used);
}

function loadExisting() {
  if (!existsSync(OUT)) return [];
  const src = readFileSync(OUT, 'utf8');
  const m = src.match(/export const RECIPE_VERSIONS = (\[[\s\S]*?\]);\n/);
  if (!m) return [];
  return JSON.parse(m[1]);
}

function write(versions) {
  const body = `// GENERATED BY tools/snapshotVersions.mjs — DO NOT HAND-EDIT.
//
// Append-only. An existing entry is never modified or removed: it is the record
// of what a customer actually received, and an order points at it by id. Cut a
// new version instead, which is what \`--write\` does when canon drifts.
//
// Derived from src/dishes.js, which remains the only authoring surface. The
// gate (\`node tools/snapshotVersions.mjs\`) fails when canon and the current
// version disagree, so this file cannot silently fall behind.

export const RECIPE_VERSIONS = ${JSON.stringify(versions, null, 2)};
`;
  writeFileSync(OUT, body);
}

// ── Run ─────────────────────────────────────────────────────────────────────
//
// Guarded so importing this file does NOT execute the check. tests/recipe_versions.mjs
// imports recipeHash() to assert the trigger rule, and without this guard that
// import ran the whole tool and called process.exit before a single assertion
// fired — the suite reported the tool's output and then silently stopped.
const INVOKED_DIRECTLY = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (!INVOKED_DIRECTLY) {
  // Imported for recipeHash(); nothing to run.
} else {
run();
}

function run() {
const existing = loadExisting();
const today = new Date().toISOString().slice(0, 10);
const byDish = new Map();
for (const v of existing) {
  const list = byDish.get(v.dishId) || [];
  list.push(v);
  byDish.set(v.dishId, list);
}

const drifted = [];
const created = [];
const next = [...existing];

for (const dish of DISHES) {
  const hash = recipeHash(dish.recipe);
  const mine = byDish.get(dish.id) || [];
  const current = mine.find(v => v.status === 'current') || null;

  if (current && current.recipeHash === hash) continue;

  drifted.push({ dish, current, hash });

  if (!WRITE) continue;

  if (current) current.status = 'retired';
  const record = {
    id: nextVersionId(dish.id, today, next),
    dishId: dish.id,
    dishName: dish.name,          // for readability only; dishId is the key
    parentVersionId: current ? current.id : null,
    effectiveAt: new Date().toISOString(),
    status: 'current',
    recipeHash: hash,
    revisionEntryId: null,        // linked from the journal when one explains it
    snapshot: snapshotOf(dish),
  };
  next.push(record);
  created.push(record);
}

if (WRITE) {
  if (created.length) {
    write(next);
    console.log(`  wrote ${created.length} version(s) to ${OUT}`);
    for (const r of created) {
      console.log(`    ${r.id}${r.parentVersionId ? `  (parent ${r.parentVersionId})` : '  (initial)'}`);
    }
  } else {
    console.log('  every dish already matches its current recipe version ✓');
  }
  process.exit(0);
}

if (!drifted.length) {
  console.log(`  ✓ all ${DISHES.length} dinners match their declared current recipe version`);
  process.exit(0);
}

console.log(`\n  ${drifted.length} dish(es) differ from their declared recipe version:\n`);
for (const d of drifted) {
  if (!d.current) {
    console.log(`  ✗ ${d.dish.name} — no recipe version has ever been cut`);
    continue;
  }
  console.log(`  ✗ ${d.dish.name} — canon does not match ${d.current.id}`);
  const was = d.current.snapshot?.recipe?.base || [];
  const now = canonical(d.dish.recipe).base || [];
  const key = (l) => `${l.name}|${l.q}|${l.u}`;
  const before = new Set(was.map(key));
  const after = new Set(now.map(key));
  for (const l of now) if (!before.has(key(l))) console.log(`        + ${l.name} ${l.q}${l.u}`);
  for (const l of was) if (!after.has(key(l))) console.log(`        - ${l.name} ${l.q}${l.u}`);
}
console.log('\nA recipe changed, so a new version must be cut. Run:');
console.log('    node tools/snapshotVersions.mjs --write\n');
// Named explicitly because shipping the wrong file is what actually happened:
// a zip carried src/dishes.js and src/recipeVersions.js, and the repo failed
// THIS check on every deploy until it was corrected.
console.log('  THEN SHIP src/recipeVersions.generated.js — that is the file --write edits.');
console.log('  It is NOT src/recipeVersions.js. Shipping the wrong one leaves a new');
console.log('  src/dishes.js with a stale version table, and every build fails here.\n');
console.log('  If the change was accidental, revert src/dishes.js instead.\n');
process.exit(1);
}
