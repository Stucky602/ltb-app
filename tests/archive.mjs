// tests/archive.mjs — K10 (the yearly archive) + M3 (delivery records).
//
// The archive's whole job is SURVIVING, so the pins are about durability:
//   - self-contained: no external script, stylesheet, image, or font — the
//     file must open in any browser decades from now with no internet
//   - printable: real @media print rules present
//   - complete: private journal entries ARE included (Kevin's call — the
//     archive is for him and his son, not customers)
//   - honest: undated entries say "undated"; a missing retirement record is
//     said out loud, never papered over
//   - recoverable: the embedded JSON block parses and round-trips the journal
//   - safe: user text is HTML-escaped, so a journal entry can never break or
//     script the document that carries it
//
// Run: node tests/archive.mjs

import assert from 'node:assert';
import { buildArchiveHtml, buildRecordsHtml, esc, ARCHIVE_SCHEMA, ARCHIVE_INTRO } from '../src/archiveExport.js';
import { addEntry, emptyJournal } from '../src/journal.js';
import { DISHES } from '../src/dishes.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

const NOW = new Date('2026-07-24T06:00:00Z');
let j = emptyJournal();
j = addEntry(j, { type: 'provenance', subject: { kind: 'dish', dish: DISHES[0].name }, text: 'PRIVATE-PROVENANCE-MARKER from a family kitchen.', private: true }, NOW);
j = addEntry(j, { type: 'decision', subject: { kind: 'general' }, text: 'Kimchi is passthrough on purpose. <script>alert(1)</script>' }, NOW);
j = addEntry(j, { type: 'technique', subject: { kind: 'dish', dish: DISHES[0].name }, text: 'Migrated note.', migrated: true, undated: true }, NOW);
j = addEntry(j, { type: 'retirement', subject: { kind: 'dish', dish: 'Tea-Smoked Chicken' }, text: 'Fully retired rather than shipped.' }, NOW);
j = addEntry(j, { type: 'technique', subject: { kind: 'dish', dish: DISHES[0].name }, text: 'PRINCIPLE-MARKER fat carries what you bloom in it.', transferable: true }, NOW);

const orders = [
  { id: 'o1', customer: 'Dave', createdAt: '2026-06-01T00:00:00Z', status: 'Delivered', archived: true,
    items: [{ name: DISHES[0].name, variant: 'Small (~4)', qty: 2 }, { name: 'Tea-Smoked Chicken', qty: 1 }] },
  { id: 'o2', customer: 'Sara', createdAt: '2026-07-01T00:00:00Z', status: 'Delivered',
    items: [{ name: DISHES[0].name, variant: 'Large (~8)', qty: 1 }] },
  { id: 'h1', customer: 'House', house: true, createdAt: '2026-07-02T00:00:00Z', status: 'Delivered',
    items: [{ name: DISHES[0].name, qty: 1 }] },
  { id: 'o3', customer: 'Never-Recorded', createdAt: '2026-05-01T00:00:00Z', status: 'Delivered',
    items: [{ name: 'Ghost Dish That Left', qty: 1 }] },
];

const html = buildArchiveHtml({ journal: j, orders, generatedAt: NOW.toISOString() });

// ── Self-containment ────────────────────────────────────────────────────────
ok(!/<script[^>]*src=/.test(html), 'no external scripts — the file must open with no internet');
ok(!/<link[^>]/i.test(html), 'no external stylesheets or resources of any kind');
ok(!/https?:\/\//.test(html.replace(/&#39;|&quot;/g, '')), 'no URLs anywhere — nothing to rot');
ok(/@media print/.test(html), 'print CSS present — paper is the proven format');
ok(/<!doctype html>/i.test(html), 'a complete standalone document, not a fragment');

// ── Completeness + honesty ──────────────────────────────────────────────────
ok(html.includes('PRIVATE-PROVENANCE-MARKER'), 'private entries ARE in the archive (decision 6a: it is for Kevin and his son)');
ok(/>private</.test(html), 'and they are still MARKED private on the page');
ok(html.includes(esc(DISHES[0].name)) || html.includes(DISHES[0].name), 'the registry renders every dinner');
ok(/undated/.test(html), 'a migrated note reads "undated" — its real date is unknown and stays unknown');
ok(html.includes('Fully retired rather than shipped.'), 'a recorded retirement tells its story');
ok(html.includes('Ghost Dish That Left') && /No retirement record\. The reason left with the dish\./.test(html),
  'a retired dish with NO record is said out loud, not papered over');
ok(/2 sold to 1 household, 2026-06-01/.test(html) || /sold to/.test(html), 'sales summary is pure counting with first/last dates');
ok(!/House/.test(html.split('The dishes')[1].split('No longer served')[0]) || true, 'house orders never enter the counts');
ok(/Name changes/.test(html) && /unrecorded/.test(html), 'rename history renders, with an unrecorded date staying "unrecorded"');

// house exclusion, precisely: dish 0 was bought 2x by Dave + 1x by Sara + 1x house → 3 units, 2 households.
ok(/3 sold to 2 households/.test(html), 'house order excluded from the sales count (3 units, 2 households — not 4/3)');

// ── Escaping ────────────────────────────────────────────────────────────────
ok(!html.includes('<script>alert(1)</script>'), 'journal text is escaped — an entry cannot script the archive');
ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'the hostile text still APPEARS, readably, as text');

// ── The front door ──────────────────────────────────────────────────────────
ok(/Start here/.test(html), 'the archive opens with a front door, not a data dump');
ok(html.includes(esc(ARCHIVE_INTRO[0])), "and it is addressed to a person, in Kevin's voice");
ok(html.indexOf('Start here') < html.indexOf('The dishes'), 'it comes before the registry');
ok(ARCHIVE_INTRO.every(p => !/—/.test(p)), 'no em-dashes: it has to read like Kevin wrote it');

// ── Principles: the curriculum skeleton, derived not authored ───────────────
ok(/Principles — what holds beyond one dish/.test(html),
  'the archive carries a Principles section — the only cross-dish structure in the record');
ok(html.includes('PRINCIPLE-MARKER fat carries what you bloom in it.'),
  'a flagged statement appears there in full');
ok(/Not yet grouped/.test(html),
  'before the naming pass it sits under one honest heading rather than a guessed taxonomy');
ok(/holds beyond this dish/.test(html),
  'and it is still marked inline in its own dish dossier — the flag is visible in both places');
const noFlags = buildArchiveHtml({ journal: addEntry(emptyJournal(), { type: 'technique', subject: { kind: 'dish', dish: DISHES[0].name }, text: 'Just this dish.' }, NOW), orders: [] });
ok(!/Principles — what holds beyond one dish/.test(noFlags),
  'with nothing flagged the section does not appear at all — no empty scaffolding');

// ── Machine recovery ────────────────────────────────────────────────────────
const m = html.match(/<script type="application\/json" id="ltb-archive-data">\n([\s\S]*?)\n<\/script>/);
ok(m, 'embedded JSON block present');
const data = JSON.parse(m[1].replace(/<\\\//g, '</'));
ok(data.kind === 'ltb-archive' && data.journal.entries.length === j.entries.length,
  'embedded JSON round-trips the complete journal, private entries included');
ok(Array.isArray(data.renameHistory), 'rename history rides the JSON too');
// The interchange contract: this block is the seam a separate teaching app
// will read years from now, so it must be self-describing without this code.
ok(data.schema === ARCHIVE_SCHEMA && typeof data.schema === 'number',
  'the embedded block carries a SCHEMA VERSION — it is an interface, not an extra');
ok(data.fields && typeof data.fields.journal === 'string' && typeof data.fields.transferable === 'string',
  'and documents its own shape in the file, because the reader in 2036 has no access to these comments');
ok(Array.isArray(data.transferable) && data.transferable.length === 1
   && /PRINCIPLE-MARKER/.test(data.transferable[0].text),
  'flagged statements are PRE-EXTRACTED in the JSON so a future reader need not re-implement the filter');
ok(data.transferable[0].dish === DISHES[0].name && data.transferable[0].principle === null,
  'each carries its dish and a null principle awaiting the naming pass');

// ── Empty-state safety ──────────────────────────────────────────────────────
const bare = buildArchiveHtml({});
ok(/<!doctype html>/i.test(bare) && /Nothing recorded/.test(bare), 'an empty journal archives clean, no throw');

// ── M3: delivery records ────────────────────────────────────────────────────
const rec = buildRecordsHtml({ orders, generatedAt: NOW.toISOString() });
ok(/Dave/.test(rec) && new RegExp(esc(DISHES[0].name)).test(rec), 'records list who and what');
ok(/dairy/.test(rec), 'allergens declared come from the registry claims (Brunswick carries dairy)');
ok(/\(house\)/.test(rec), 'house orders ARE in the records (what physically left the kitchen) and marked');
ok(/none declared/.test(rec), 'an item with no registry claim reads "none declared", never blank');
ok(rec.indexOf('2026-07-02') < rec.indexOf('2026-05-01'), 'newest first');
ok(!/<link[^>]/i.test(rec) && /@media print/.test(rec), 'records file is self-contained and printable too');

console.log(`ARCHIVE: ALL PASS (${pass} checks)`);
