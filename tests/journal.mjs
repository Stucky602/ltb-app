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
  canonDishName, entriesForDish, publicEntries,
  latestPriceRationale, migrateDishNotes,
  canBeTransferable, transferableEntries, principleIndex, UNNAMED_PRINCIPLE,
  entriesOnThisDay, orphanedDishNames, supersededIds, latestRevision, staleByRevision,
  restoreEntry, recentlyDeleted, purgeTombstones, UNDO_WINDOW_DAYS,
  dossierCoverage, dossierComposition,
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



// ── Transferable principles (the cross-dish structure) ──────────────────────
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
  'the flag is DROPPED on a non-craft type rather than left dangling');
ok(!('principle' in flaggedEntry), 'principle is reserved but never invented at capture');

let jp = emptyJournal();
jp = addEntry(jp, { type: 'technique', subject: { kind: 'dish', dish: 'Bolognese' }, text: 'Bloom the paste in fat.', transferable: true, ts: '2026-01-01T00:00:00Z' }, NOW);
jp = addEntry(jp, { type: 'adjustment', subject: { kind: 'dish', dish: 'Gumbo' }, text: 'Flat means it needs acid.', transferable: true, ts: '2026-02-01T00:00:00Z' }, NOW);
jp = addEntry(jp, { type: 'technique', subject: { kind: 'dish', dish: 'Bolognese' }, text: 'Stir the bottom or it scorches.', ts: '2026-03-01T00:00:00Z' }, NOW);
const flagged = transferableEntries(jp);
ok(flagged.length === 2, 'only flagged statements enter the aggregation set');
ok(flagged[0].dish === 'Bolognese' && flagged[1].dish === 'Gumbo', 'each keeps the dish it was written under');
ok(flagged.every(e => e.principle === null), 'principle is null until the naming pass');
const idx = principleIndex(jp);
ok(idx.size === 1 && idx.has(UNNAMED_PRINCIPLE), 'before naming, everything groups under one honest heading');

// ── On this day ─────────────────────────────────────────────────────────────
const TODAY = new Date('2026-07-24T12:00:00Z');
let jd = emptyJournal();
jd = addEntry(jd, { type: 'technique', subject: { kind: 'dish', dish: 'Bolognese' }, text: 'one year ago', ts: '2025-07-24T09:00:00Z' }, TODAY);
jd = addEntry(jd, { type: 'technique', subject: { kind: 'dish', dish: 'Chili' }, text: 'written today', ts: '2026-07-24T09:00:00Z' }, TODAY);
jd = addEntry(jd, { type: 'technique', subject: { kind: 'dish', dish: 'Chili' }, text: 'migrated', ts: '2025-07-24T09:00:00Z', undated: true, migrated: true }, TODAY);
const otd = entriesOnThisDay(jd, TODAY);
ok(otd.length === 1 && otd[0].yearsAgo === 1, 'only this calendar day in a PREVIOUS year comes back');
ok(!otd.some(e => e.text === 'written today'), "today's own writing is not a memory");
ok(!otd.some(e => e.text === 'migrated'), 'undated entries are excluded — their date is a migration artifact');

// ── Orphaned dish names ─────────────────────────────────────────────────────
const orphanKnown = new Set(['Indian Style Curry', 'Bo Ssam']);
const renameMap = { 'Curry of the Week': 'Indian Style Curry' };
const hist = [
  { items: [{ name: 'Curry of the Week', qty: 1 }] },
  { items: [{ name: 'Ghost Dish', qty: 1 }] },
  { items: [{ name: 'Ghost Dish', qty: 1 }] },
  { items: [{ name: 'Omakase', omakase: true, qty: 1 }] },
];
const orph = orphanedDishNames(hist, orphanKnown, renameMap);
ok(orph.length === 1 && orph[0].name === 'Ghost Dish', 'a name that maps through DISH_RENAMES is NOT an orphan');
ok(orph[0].orderCount === 2, 'orphans report how many orders carry them');
ok(!orph.some(o => o.name === 'Omakase'), 'omakase is not a catalog dish');

// ── Soft delete: a 30-day window, not a softened meaning ────────────────────
const NOW2 = new Date('2026-07-24T12:00:00Z');
let sd = addEntry(emptyJournal(), { type: 'technique', subject: { kind: 'dish', dish: 'Gumbo' }, text: 'deleted soon' }, NOW2);
const victimId = sd.entries[0].id;
sd = removeEntry(sd, victimId, NOW2);
ok(sd.entries.length === 0, 'a removed entry is gone from every READ');
ok(recentlyDeleted(sd, NOW2).length === 1, 'but sits in a tombstone inside the undo window');
ok(entriesForDish(sd, 'Gumbo').length === 0, 'tombstones never leak back into dish reads');
const restored = restoreEntry(sd, victimId);
ok(restored.entries.length === 1 && recentlyDeleted(restored, NOW2).length === 0, 'undo puts it back');
ok(!('deletedAt' in restored.entries[0]), 'a restored entry carries no deletion residue');
const later = new Date(NOW2.getTime() + (UNDO_WINDOW_DAYS + 1) * 86400000);
ok(recentlyDeleted(sd, later).length === 0, 'past the window it is no longer offered');
ok(purgeTombstones(sd, later).deleted.length === 0, 'and purging drops it for good');

// ── The record's own shape ──────────────────────────────────────────────────
let shape = emptyJournal();
shape = addEntry(shape, { type: 'technique', subject: { kind: 'dish', dish: 'Gumbo' }, text: 'a' }, NOW2);
shape = addEntry(shape, { type: 'technique', subject: { kind: 'dish', dish: 'Gumbo' }, text: 'b' }, NOW2);
shape = addEntry(shape, { type: 'doneCues', subject: { kind: 'dish', dish: 'Chili' }, text: 'c' }, NOW2);
const cov = dossierCoverage(shape, ['Gumbo', 'Chili', 'Bolognese']);
ok(cov.rows[0].dish === 'Bolognese' && cov.rows[0].entries === 0, 'coverage puts the emptiest dish first');
ok(cov.empty === 1 && cov.documented === 2 && cov.total === 3, 'coverage counts documented against the catalog');
const comp = dossierComposition(shape);
ok(comp.total === 3 && comp.byType.technique === 2, 'composition counts by type');
ok(comp.missing.includes('mistake'), 'and NAMES the types with nothing at all');

// ── GAP A: the record can now say "this is no longer true" ──────────────────
const REV_NOW = new Date('2026-07-24T12:00:00Z');
let rv = emptyJournal();
rv = addEntry(rv, { type: 'doneCues', subject: { kind: 'dish', dish: 'Gumbo' }, text: 'old cue', ts: '2026-01-01T00:00:00Z' }, REV_NOW);
rv = addEntry(rv, { type: 'technique', subject: { kind: 'dish', dish: 'Gumbo' }, text: 'old technique', ts: '2026-02-01T00:00:00Z' }, REV_NOW);
rv = addEntry(rv, { type: 'revision', subject: { kind: 'dish', dish: 'Gumbo' }, text: 'Switched to a darker roux.', ts: '2026-03-01T00:00:00Z' }, REV_NOW);
rv = addEntry(rv, { type: 'doneCues', subject: { kind: 'dish', dish: 'Gumbo' }, text: 'new cue', ts: '2026-04-01T00:00:00Z' }, REV_NOW);
ok(latestRevision(rv, 'Gumbo').text === 'Switched to a darker roux.', 'the most recent revision marker is findable');
const staleSet = staleByRevision(rv, 'Gumbo');
ok(staleSet.size === 2, 'entries written BEFORE the revision are flagged as describing an older version');
ok(!staleSet.has(rv.entries[3].id), 'and entries written after it are not');
ok(!staleSet.has(rv.entries[2].id), 'the revision marker does not flag itself');
ok(staleByRevision(rv, 'Chili').size === 0, 'a dish never revised has nothing stale');
ok(!canBeTransferable('revision'), 'a revision marker is bookkeeping, not a lesson that transfers');

let sup = emptyJournal();
sup = addEntry(sup, { type: 'adjustment', subject: { kind: 'dish', dish: 'Chili' }, text: 'add acid first' }, REV_NOW);
const firstId = sup.entries[0].id;
sup = addEntry(sup, { type: 'adjustment', subject: { kind: 'dish', dish: 'Chili' }, text: 'actually salt first', supersedes: firstId }, REV_NOW);
ok(supersededIds(sup).has(firstId), 'an entry a later one replaces is marked superseded');
ok(sup.entries.length === 2, 'the superseded entry is NOT deleted — "I used to think X, now Y" teaches more than Y alone');
ok(stampEntry({ type: 'technique', text: 'x', supersedes: '' }, REV_NOW).supersedes === undefined,
  'an empty supersedes link is dropped rather than stored as a dangling reference');

// ── GAP C: confidence, two states only ──────────────────────────────────────
ok(stampEntry({ type: 'technique', text: 'x', confidence: 'firm' }, REV_NOW).confidence === 'firm', 'firm is carried');
ok(stampEntry({ type: 'technique', text: 'x', confidence: 'working' }, REV_NOW).confidence === 'working', 'working is carried');
ok(stampEntry({ type: 'technique', text: 'x' }, REV_NOW).confidence === undefined,
  'unmarked is the default, and unmarked is NOT the same as uncertain');
ok(stampEntry({ type: 'technique', text: 'x', confidence: 4 }, REV_NOW).confidence === undefined,
  'a numeric scale is rejected — it invites agonising over 3 versus 4 and tells a reader nothing extra');

// ── Normalization tolerance ─────────────────────────────────────────────────
ok(normalizeJournal(undefined).entries.length === 0, 'undefined store normalizes clean');
ok(normalizeJournal({ entries: [null, { text: 'ok' }, 'junk'] }).entries.length === 1, 'junk entries are dropped, real ones kept');

// ── THE PRIVACY WALL: journal.js must be UNREACHABLE from customer surfaces ──
// This used to be an allowlist: a hardcoded list of files, each checked for a
// direct `import ... journal`. Two holes in that. First, a NEW customer surface
// was unguarded until somebody remembered to add it to the list, and nothing
// reminded them. Second, it only saw DIRECT imports — a customer page importing
// a helper that imports journal.js passed cleanly while shipping diary material.
//
// This walks the import graph instead. From each customer entry point, follow
// every relative import transitively and fail if journal.js is reachable at any
// depth. The list below is now only where the walk STARTS, so forgetting to add
// a surface no longer silently disables the guard for the files it does reach.
const CUSTOMER_ENTRY_POINTS = [
  'src/companion.js',
  'form.html', 'menu.html', 'main-menu.html', 'order.html', 'pipeline.html',
  'tools/syncMainMenu.mjs', 'tools/syncPipeline.mjs',
  // buildPages.mjs GENERATES customer pages, so anything it can reach can end
  // up rendered on one. It is as much a customer surface as the pages are, and
  // more dangerous, because a leak there lands on every page at once.
  'tools/buildPages.mjs',
  'worker.js', 'sw.js',
];
const PROTECTED = 'src/journal.js';

function resolveRel(fromFile, spec) {
  const dir = fromFile.split('/').slice(0, -1);
  const parts = spec.split('/');
  const out = [...dir];
  for (const part of parts) {
    if (part === '.') continue;
    else if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
}

// Returns the chain from entry to journal.js, or null if unreachable.
function pathToJournal(entry) {
  const seen = new Set();
  const queue = [[entry, [entry]]];
  while (queue.length) {
    const [file, chain] = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    const url = new URL('../' + file, import.meta.url);
    if (!existsSync(url)) continue;
    const src = readFileSync(url, 'utf8');
    // static imports, side-effect imports, dynamic import(), and require()
    const specs = [
      ...[...src.matchAll(/import[^'"()]*['"](\.[^'"]+)['"]/g)].map(m => m[1]),
      ...[...src.matchAll(/import\s*\(\s*['"](\.[^'"]+)['"]/g)].map(m => m[1]),
      ...[...src.matchAll(/require\s*\(\s*['"](\.[^'"]+)['"]/g)].map(m => m[1]),
      ...[...src.matchAll(/from\s+['"](\.[^'"]+)['"]/g)].map(m => m[1]),
    ];
    for (const spec of specs) {
      const target = resolveRel(file, spec);
      const next = [...chain, target];
      if (target === PROTECTED) return next;
      queue.push([target, next]);
    }
  }
  return null;
}

let scanned = 0;
for (const entry of CUSTOMER_ENTRY_POINTS) {
  if (!existsSync(new URL('../' + entry, import.meta.url))) continue;
  scanned++;
  const chain = pathToJournal(entry);
  ok(chain === null,
    `PRIVACY WALL: journal.js is reachable from ${entry}` +
    (chain ? ` via ${chain.join(' -> ')}` : '') +
    ' — diary material stays off customer surfaces');
}
console.log(`  (privacy wall walked the import graph from ${scanned} customer entry point${scanned === 1 ? '' : 's'})`);


// ── The taxonomy can GROW ───────────────────────────────────────────────────
// Nine types designed top-down in an afternoon, before a single entry existed.
// Custom types live IN the journal so they ride the backup and reach the
// archive with no code change.
{
  const { addCustomType, allTypes, allTypeOrder, editHistory, EDIT_HISTORY_MAX } = await import('../src/journal.js');
  let jt = addCustomType(emptyJournal(), 'ratio', 'Ratio or formula', 'The arithmetic that transfers.');
  ok(allTypeOrder(jt).includes('ratio'), 'a custom type joins the order');
  ok(allTypes(jt).ratio.label === 'Ratio or formula', 'and carries its label');
  ok(allTypes(jt).ratio.custom === true, 'and is marked custom, so built-ins stay distinguishable');
  ok(addCustomType(jt, 'technique', 'Hijack').customTypes.length === 1,
    'a custom type can NEVER shadow a built-in');
  ok(addCustomType(jt, 'ratio', 'Again').customTypes.length === 1, 'nor be added twice');
  ok(addCustomType(jt, '  ', 'Blank').customTypes.length === 1, 'a blank key is refused');
  const withCustom = addEntry(jt, { type: 'ratio', subject: { kind: 'dish', dish: 'Gumbo' }, text: '1:1:1' });
  ok(withCustom.entries[0].type === 'ratio',
    'and an entry can actually USE it — otherwise the taxonomy is only decoratively growable');

  // ── Edit history ─────────────────────────────────────────────────────────
  let je = addEntry(emptyJournal(), { type: 'technique', subject: { kind: 'dish', dish: 'Gumbo' }, text: 'v1' });
  const eid = je.entries[0].id;
  je = updateEntry(je, eid, { text: 'v2' }, new Date('2026-08-01'));
  je = updateEntry(je, eid, { text: 'v3' }, new Date('2026-09-01'));
  const hist = editHistory(je.entries[0]);
  ok(hist.edited && hist.count === 2, 'an edit is recorded');
  ok(hist.versions.map(v => v.was).join(',') === 'v1,v2',
    'and the REPLACED text is kept — "written in 2026 or rewritten in 2034" is now answerable');
  ok(hist.lastEditedAt, 'with a timestamp');
  ok(editHistory(addEntry(emptyJournal(), { type: 'technique', text: 'x' }).entries[0]).edited === false,
    'an untouched entry has no history and is not pretending to');
  let many = addEntry(emptyJournal(), { type: 'technique', text: 'start' });
  const mid = many.entries[0].id;
  for (let i = 0; i < EDIT_HISTORY_MAX + 5; i++) many = updateEntry(many, mid, { text: 'v' + i });
  ok(editHistory(many.entries[0]).count === EDIT_HISTORY_MAX, 'history is capped so a decade of fiddling cannot bloat the store');

  // ── When it happened vs when it was written ─────────────────────────────
  const ev = stampEntry({ type: 'mistake', text: 'x', eventDate: '2026-03-01' }, NOW);
  ok(ev.eventDate === '2026-03-01' && ev.ts !== ev.eventDate,
    'an event date is separate from the write time, so a note typed a year later says so');
  ok(stampEntry({ type: 'mistake', text: 'x' }, NOW).eventDate === undefined,
    'and it is NEVER inferred — absent means unknown, which is honest');

  // ── Association, not just negation ──────────────────────────────────────
  const rel = stampEntry({ type: 'technique', text: 'x', relatesTo: ['a', 'a', 'b'] }, NOW);
  ok(rel.relatesTo.length === 2, 'relations dedupe');
  ok(stampEntry({ type: 'technique', text: 'x', relatesTo: [] }, NOW).relatesTo === undefined, 'an empty relation list is dropped');

  // ── Origin ──────────────────────────────────────────────────────────────
  ok(stampEntry({ type: 'technique', text: 'x' }, NOW).origin === 'written',
    'origin is stated explicitly, so the ABSENCE of a flag never has to mean "old"');
  ok(stampEntry({ type: 'technique', text: 'x', imported: true }, NOW).origin === 'imported', 'the old imported flag still maps');
  ok(stampEntry({ type: 'technique', text: 'x', origin: 'harvested' }, NOW).origin === 'harvested', 'and harvested is its own thing');

  // ── PERSONAL is not PRIVATE ─────────────────────────────────────────────
  ok(stampEntry({ type: 'provenance', text: 'x' }, NOW).personal === true,
    'provenance is personal by default — it is the warmest material in the record');
  ok(stampEntry({ type: 'price', text: 'x' }, NOW).personal === false, 'a price rationale is not');
  ok(stampEntry({ type: 'provenance', text: 'x', personal: false }, NOW).personal === false, 'and it can be turned off');
}



// ── GENERAL CHAPTERS + the harvested seed (Jul 26) ──────────────────────────
// Chapters exist because most of Kevin's past tense is not dish-shaped. Before
// them, `subject.kind === 'general'` was supported by the data model, renderable
// by the archive, and creatable by nothing — so the content had a home and no
// door. These pin the door.
{
  const { GENERAL_CHAPTERS, entriesForChapter, chapterCounts } = await import('../src/journal.js');
  const { DOSSIER_SEED } = await import('../src/dossierSeed.js');

  const e = stampEntry({ subject: { kind: 'general', chapter: 'before-ltb' }, type: 'provenance', text: 'x' }, new Date());
  ok(e.subject.kind === 'general' && e.subject.chapter === 'before-ltb', 'a general entry keeps a known chapter');

  // A typo must not silently mint a chapter nothing renders.
  const bad = stampEntry({ subject: { kind: 'general', chapter: 'not-a-chapter' }, type: 'provenance', text: 'y' }, new Date());
  ok(bad.subject.kind === 'general' && !bad.subject.chapter, 'an unknown chapter is dropped, not stored');

  const dish = stampEntry({ subject: { kind: 'dish', dish: 'Bo Ssam' }, type: 'provenance', text: 'z' }, new Date());
  ok(dish.subject.kind === 'dish' && !dish.subject.chapter, 'dish subjects are untouched by chapters');

  // Seeding, run twice. Idempotent by TEXT, because a "seeded" flag goes stale
  // the moment the seed list grows and this list grows every harvest.
  let store = { version: 1, entries: [] };
  const seed = () => {
    const have = new Set(store.entries.map(x => String(x.text || '').trim()));
    const fresh = DOSSIER_SEED.filter(sd => !have.has(String(sd.text || '').trim()))
      .map(sd => stampEntry(sd, new Date()));
    store = normalizeJournal({ ...store, entries: [...store.entries, ...fresh] });
    return fresh.length;
  };
  const first = seed();
  ok(first === DOSSIER_SEED.length, 'the whole seed lands on a fresh journal');
  ok(seed() === 0, 'seeding twice adds nothing — idempotent by text');

  // FIDELITY. These are the properties that make the record trustworthy about
  // its own provenance, and they are easy to break with a well-meaning edit.
  ok(store.entries.every(x => x.origin === 'harvested'),
    'every seeded entry is marked harvested, never written');
  ok(store.entries.some(x => x.personal), 'personal entries survive seeding');

  // The hedges. Claude previously inflated the Bottega uncertainty into a claim
  // about Kevin's palate and was corrected; an uncertain memory recorded as
  // certain is worse than no record, because nothing later can tell.
  const bottega = store.entries.find(x => /is this dude for real/.test(x.text));
  ok(!!bottega, 'the Bottega entry seeded');
  ok(/I do not actually know that the plate was off/.test(bottega.text),
    'the Bottega hedge is intact — do not resolve it');
  const kitchens = store.entries.find(x => /walk to my car with my knife out/.test(x.text));
  ok(/around 22 to 24/.test(kitchens.text), 'the age hedge is intact — he is not sure');
  ok(store.entries.some(x => /until I just didn't/.test(x.text)),
    'his phrasing survives — do not tidy it');

  const counts = chapterCounts(store);
  ok(GENERAL_CHAPTERS.every(c => typeof counts[c.id] === 'number'), 'every chapter reports a count');
  ok(counts['before-ltb'] > 0, 'the kitchens chapter has content');
  ok(entriesForChapter(store, 'before-ltb').every(x => x.subject.chapter === 'before-ltb'),
    'a chapter returns only its own entries');
  ok(entriesForChapter(store, 'how-he-picks').length === 0,
    'an empty chapter returns empty rather than throwing');
}



// ── GAP B: VALIDATION ENTRIES ───────────────────────────────────────────────
// Someone with a real claim on a dish confirming it — Kevin's example is a
// Nigerian friend saying the suya meat reminded her of home. This is the rarest
// and most perishable evidence in the whole record and it had nowhere to live:
// it is not provenance (where a dish came from), not a done-cue (what Kevin
// looks for), not an adjustment. It is an outside verdict from someone whose
// judgement on that dish outranks his own.
{
  const { JOURNAL_TYPES, JOURNAL_TYPE_ORDER } = await import('../src/journal.js');
  ok(!!JOURNAL_TYPES.validation, 'validation is a real entry type');
  ok(JOURNAL_TYPE_ORDER.includes('validation'), 'and it is in the ordered list, so it renders');
  ok(JOURNAL_TYPES.validation.privateDefault === false,
    'validation is NOT private by default — the entire value of one is that it can be shown');

  const v = stampEntry({ subject: { kind: 'dish', dish: 'Bo Ssam' }, type: 'validation',
    by: '  Adaeze  ', text: 'said it reminded her of home' }, new Date());
  ok(v.by === 'Adaeze', 'attribution is kept and trimmed');

  // Attribution rides ON the entry, not buried in the body, because a reader in
  // twenty years cannot recover who said it from prose alone.
  const blank = stampEntry({ subject: { kind: 'dish', dish: 'Bo Ssam' }, type: 'validation',
    by: '   ', text: 'x' }, new Date());
  ok(blank.by === undefined, 'a blank attribution is dropped rather than stored empty');

  // stampEntry spreads the partial so unknown fields ride along, which is
  // deliberate — but `by` is OURS and means nothing on another type. Left alone
  // it would sit on any entry created from a form that carried the field, and
  // nothing later could tell a stray attribution from a real one.
  const other = stampEntry({ subject: { kind: 'dish', dish: 'Bo Ssam' }, type: 'technique',
    by: 'somebody', text: 'x' }, new Date());
  ok(other.by === undefined, 'by is dropped on every type that is not a validation');
}

console.log(`JOURNAL: ALL PASS (${pass} checks)`);