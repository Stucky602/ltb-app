// tests/journal.mjs — the knowledge-base substrate (K1–K8) and its privacy wall.
//
// Two jobs:
//   1. Pin the pure module: stamping, defaults, the one-way dishNotes
//      migration (idempotent), rename-following, the retirement nudge.
//   2. THE PRIVACY WALL: journal.js must never be imported by anything that
//      composes customer-facing output. Provenance is diary material for
//      Kevin and his son; the only defense that survives future features is
//      making the leak structurally impossible and gating it here. This scan
//      fails the build if a customer surface ever imports the journal.
//
// Pure module, no DOM. Run: node tests/journal.mjs

import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import {
  JOURNAL_TYPES, JOURNAL_TYPE_ORDER, emptyJournal, normalizeJournal,
  stampEntry, addEntry, updateEntry, removeEntry,
  canonDishName, entriesForDish, generalEntries, publicEntries,
  latestPriceRationale, migrateDishNotes, missingRetirementRecords,
  canBeTransferable, transferableEntries, principleIndex, UNNAMED_PRINCIPLE,
} from '../src/journal.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

// ── Stamping ────────────────────────────────────────────────────────────────
const NOW = new Date('2026-07-24T06:00:00Z');
const e1 = stampEntry({ type: 'price', subject: { kind: 'dish', dish: 'Steak au Poivre' }, text: 'Volume-discount spotlight. Deliberately sub-floor.' }, NOW);
ok(e1.id && e1.ts === NOW.toISOString(), 'entry is born with id and ts (the one stamping decision)');
ok(e1.private === false, 'price entries default public');
const e2 = stampEntry({ type: 'provenance', subject: { kind: 'dish', dish: 'Bo Ssam' }, text: 'From a friend.' }, NOW);
ok(e2.private === true, 'provenance defaults PRIVATE (diary-shaped, Kevin\'s explicit call)');
ok(stampEntry({ type: 'nonsense', text: 'x' }, NOW).type === 'technique', 'unknown type falls back to technique, never throws');
ok(stampEntry({ text: 'x' }, NOW).subject.kind === 'general', 'no subject reads as general');
ok(JOURNAL_TYPE_ORDER.every(t => JOURNAL_TYPES[t]), 'type order and type map agree');

// Unknown fields survive a re-stamp (non-destructive, same rule as migrations).
const custom = stampEntry({ text: 'x', futureField: 42 }, NOW);
ok(custom.futureField === 42, 'unknown entry fields are preserved through stampEntry');

// ── Add / update / remove ───────────────────────────────────────────────────
let j = emptyJournal();
j = addEntry(j, e1, NOW);
j = addEntry(j, e2, NOW);
j = addEntry(j, { type: 'decision', text: 'Kimchi is passthrough on purpose.' }, NOW);
ok(j.entries.length === 3, 'addEntry appends');
ok(addEntry(j, { type: 'mistake', text: '   ' }, NOW).entries.length === 3, 'an empty entry is a mis-tap, not a record');
const upd = updateEntry(j, e1.id, { text: 'Spotlight pricing. Do not fix.' });
ok(upd.entries.find(x => x.id === e1.id).text === 'Spotlight pricing. Do not fix.', 'updateEntry edits in place');
ok(upd.entries.find(x => x.id === e1.id).ts === e1.ts, 'updateEntry preserves the original ts');
ok(removeEntry(j, e2.id).entries.length === 2, 'removeEntry is a real delete — removed means gone');

// ── Reading, rename-following ───────────────────────────────────────────────
const RENAMES = { 'Old Name': 'New Name' };
let j2 = emptyJournal();
j2 = addEntry(j2, { type: 'technique', subject: { kind: 'dish', dish: 'Old Name' }, text: 'Written under the old name.' }, NOW);
ok(entriesForDish(j2, 'New Name', RENAMES).length === 1,
  'entries follow a dish through DISH_RENAMES (the exact break that hit the passport)');
ok(canonDishName('Old Name', RENAMES) === 'New Name', 'canonDishName follows the map');
ok(generalEntries(j).length === 1, 'general entries separate from dish entries');
ok(publicEntries(j.entries).every(e => !e.private), 'publicEntries strips private — the content studio must draw from this');

// ── latestPriceRationale ────────────────────────────────────────────────────
let j3 = emptyJournal();
j3 = addEntry(j3, { type: 'price', subject: { kind: 'dish', dish: 'Leblanc' }, text: 'old reason', ts: '2026-01-01T00:00:00Z' }, NOW);
j3 = addEntry(j3, { type: 'price', subject: { kind: 'dish', dish: 'Leblanc' }, text: 'flagship call', ts: '2026-06-01T00:00:00Z' }, NOW);
ok(latestPriceRationale(j3, 'Leblanc').text === 'flagship call', 'sub-floor warning cites the NEWEST rationale');
ok(latestPriceRationale(j3, 'Bo Ssam') === null, 'no rationale → null, caller renders the plain warning');

// ── dishNotes migration: one-way, idempotent, honest about dates ────────────
const legacy = { 'Bolognese': 'Low and slow, stir the bottom.', 'Empty Dish': '   ' };
let m = migrateDishNotes(emptyJournal(), legacy, NOW);
ok(m.entries.length === 1, 'empty legacy notes are skipped');
const mig = m.entries[0];
ok(mig.type === 'technique' && mig.migrated === true && mig.undated === true,
  'a migrated note is a technique entry marked migrated AND undated — its real date is unknown and is never invented');
m = migrateDishNotes(m, legacy, NOW);
ok(m.entries.length === 1, 'migration is idempotent — running it twice adds nothing');
ok(migrateDishNotes(m, null, NOW).entries.length === 1, 'null legacy store is a no-op');

// ── Retirement nudge (K8) ───────────────────────────────────────────────────
const orders = [
  { items: [{ name: 'Tea-Smoked Chicken', qty: 1 }, { name: 'Bo Ssam', qty: 1 }] },
  { items: [{ name: 'Omakase', omakase: true, qty: 1 }] },
];
const known = new Set(['Bo Ssam']);
ok(missingRetirementRecords(emptyJournal(), orders, known).join() === 'Tea-Smoked Chicken',
  'a dish people ordered that left the registry with no retirement entry is flagged');
let j4 = addEntry(emptyJournal(), { type: 'retirement', subject: { kind: 'dish', dish: 'Tea-Smoked Chicken' }, text: 'Fully retired rather than shipped.' }, NOW);
ok(missingRetirementRecords(j4, orders, known).length === 0, 'a recorded retirement clears the nudge');
ok(missingRetirementRecords(emptyJournal(), orders, new Set(['Bo Ssam', 'Tea-Smoked Chicken'])).length === 0,
  'an on-menu dish never nudges');
// The omakase item never nudges: an omakase is an act of trust, not a catalog dish.
ok(!missingRetirementRecords(emptyJournal(), orders, known).includes('Omakase'), 'omakase excluded from the nudge');

// ── Transferable principles (the cross-dish structure) ──────────────────────
// Capture is a FLAG, not a taxonomy: mark it, write it in the dish's voice,
// save it to that dish. Naming happens later, in one pass, from evidence.
ok(canBeTransferable('technique') && canBeTransferable('adjustment')
   && canBeTransferable('doneCues') && canBeTransferable('mistake'),
  'craft types can carry a principle');
ok(!canBeTransferable('price') && !canBeTransferable('retirement') && !canBeTransferable('provenance'),
  'business and history types cannot — a price rationale is not a lesson that transfers');

const flaggedEntry = stampEntry({ type: 'technique', subject: { kind: 'dish', dish: 'Bolognese' },
  text: 'Fat carries the flavor of anything you bloom in it.', transferable: true }, NOW);
ok(flaggedEntry.transferable === true, 'the flag is carried on a craft entry');
ok(stampEntry({ type: 'technique', text: 'x' }, NOW).transferable === false,
  'entries are dish-specific by default — a flag that is usually on carries no information');
ok(stampEntry({ type: 'price', text: 'x', transferable: true }, NOW).transferable === false,
  'the flag is DROPPED on a non-craft type rather than left dangling where it can never mean anything');
ok(!('principle' in flaggedEntry),
  'principle is reserved in the shape but never invented at capture — naming is a later pass');
ok(stampEntry({ type: 'technique', text: 'x', transferable: true, principle: '  Fat as carrier  ' }, NOW).principle === 'Fat as carrier',
  'a principle name is carried and trimmed when the later pass does set one');

let jp = emptyJournal();
jp = addEntry(jp, { type: 'technique', subject: { kind: 'dish', dish: 'Bolognese' }, text: 'Bloom the paste in fat.', transferable: true, ts: '2026-01-01T00:00:00Z' }, NOW);
jp = addEntry(jp, { type: 'adjustment', subject: { kind: 'dish', dish: 'Gumbo' }, text: 'Flat means it needs acid.', transferable: true, ts: '2026-02-01T00:00:00Z' }, NOW);
jp = addEntry(jp, { type: 'technique', subject: { kind: 'dish', dish: 'Bolognese' }, text: 'Stir the bottom or it scorches.', ts: '2026-03-01T00:00:00Z' }, NOW);
const flagged = transferableEntries(jp);
ok(flagged.length === 2, 'only flagged statements enter the aggregation set — the dish-specific note stays out');
ok(flagged[0].ts < flagged[1].ts, 'oldest first, so the order reads as the order Kevin learned to say it');
ok(flagged[0].dish === 'Bolognese' && flagged[1].dish === 'Gumbo',
  'each statement keeps the dish it was written under — the lesson knows its exercise');
ok(flagged.every(e => e.principle === null),
  'principle is null until the naming pass — honest, not an error');

const idx = principleIndex(jp);
ok(idx.size === 1 && idx.has(UNNAMED_PRINCIPLE),
  'before naming, everything groups under one unnamed heading rather than being guessed at');
ok(idx.get(UNNAMED_PRINCIPLE).length === 2, 'and it holds every flagged statement');

let jn = addEntry(emptyJournal(), { type: 'technique', subject: { kind: 'dish', dish: 'Bolognese' },
  text: 'Bloom it in fat.', transferable: true, principle: 'Fat as carrier' }, NOW);
jn = addEntry(jn, { type: 'technique', subject: { kind: 'dish', dish: 'Gumbo' },
  text: 'The roux is the flavor.', transferable: true, principle: 'Fat as carrier' }, NOW);
const named = principleIndex(jn);
ok(named.size === 1 && named.get('Fat as carrier').length === 2,
  'once named, statements from different dishes group under one principle — the curriculum skeleton');

// Rename-following applies here too: a lesson written under an old dish name
// must not lose its exercise when the dish is renamed.
let jr = addEntry(emptyJournal(), { type: 'technique', subject: { kind: 'dish', dish: 'Old Name' },
  text: 'Carries.', transferable: true }, NOW);
ok(transferableEntries(jr, RENAMES)[0].dish === 'New Name',
  'a flagged statement follows its dish through a rename');

// ── Normalization tolerance ─────────────────────────────────────────────────
ok(normalizeJournal(undefined).entries.length === 0, 'undefined store normalizes clean');
ok(normalizeJournal({ entries: [null, { text: 'ok' }, 'junk'] }).entries.length === 1, 'junk entries are dropped, real ones kept');

// ── THE PRIVACY WALL: customer surfaces must not import the journal ─────────
// Scans every surface that composes customer-facing output. A file absent
// from this scratch checkout is skipped (partial uploads are normal); a file
// PRESENT and importing journal.js is a build-stopping failure.
const CUSTOMER_SURFACES = [
  'src/companion.js',
  'form.html', 'menu.html', 'main-menu.html', 'order.html', 'pipeline.html',
  'tools/syncMainMenu.mjs', 'tools/syncPipeline.mjs',
  'worker.js', 'sw.js',
];
let scanned = 0;
for (const f of CUSTOMER_SURFACES) {
  if (!existsSync(new URL('../' + f, import.meta.url))) continue;
  scanned++;
  const src = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
  ok(!/journal(\.js)?['"]/.test(src) || !/import[^;]*journal/.test(src),
    `PRIVACY WALL: ${f} must never import journal.js — diary material stays off customer surfaces`);
}
console.log(`  (privacy wall scanned ${scanned} customer surface${scanned === 1 ? '' : 's'} present in this checkout)`);

console.log(`JOURNAL: ALL PASS (${pass} checks)`);
