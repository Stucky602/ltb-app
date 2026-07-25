// tests/journalImport.mjs — the sort-and-migrate path for harvested knowledge.
//
// The fastest way to fill a decade-long record is not a blank textarea. It is
// taking what Kevin has already said and turning it into entries he CORRECTS.
// The one rule that shapes this module: parsing saves nothing. It produces
// candidates with their problems attached, and the commit is a separate
// explicit act, because a bulk import that writes straight through is how
// thirty wrong entries land in a record meant to last twenty years.
//
// Run: node tests/journalImport.mjs

import assert from 'node:assert';
import { parseImport, candidateToEntry, importSummary, IMPORT_FORMAT_HELP } from '../src/journalImport.js';
import { DISHES } from '../src/dishes.js';
import { addEntry, emptyJournal, entriesForDish } from '../src/journal.js';
import { DISH_RENAMES } from '../src/utils.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

const REAL = DISHES[0].name;

// ── The happy path ──────────────────────────────────────────────────────────
const two = parseImport(`
[dish] ${REAL}
[type] technique
[confidence] firm
Sear it yourself, it holds up better.

[dish] ${REAL}
[type] adjustment
Flat means acid before salt.
`);
ok(two.length === 2, 'blank lines separate blocks');
ok(two[0].type === 'technique' && two[1].type === 'adjustment', 'types are read');
ok(two[0].confidence === 'firm' && two[1].confidence === null, 'confidence is optional');
ok(two.every(c => c.ready), 'both are ready to commit');
ok(two[0].text === 'Sear it yourself, it holds up better.', 'the text is everything that is not a key line');

// ── Historical names resolve on arrival ─────────────────────────────────────
const oldName = Object.keys(DISH_RENAMES)[0];
const hist = parseImport(`[dish] ${oldName}\n[type] technique\nWritten under the old name.`);
ok(hist[0].dishId, 'a historical dish name still resolves, through DISH_RENAMES');
ok(hist[0].resolvedDish === DISH_RENAMES[oldName],
  'and the candidate shows what the dish is called TODAY, not what the note called it');
ok(hist[0].ready, 'so an old note is not blocked for being old');

// ── Problems are attached, not thrown ───────────────────────────────────────
const bad = parseImport(`
[dish] A Dish That Never Was
[type] technique
Some text.

[type] technique
Text with no dish.

[dish] ${REAL}
[type] nonsense
Text with a bad type.

[dish] ${REAL}
[type] technique
`);
ok(bad[0].problems.some(p => /not a dish the app knows/.test(p)), 'an unknown dish is reported, not guessed at');
ok(!bad[0].ready, 'and blocks the commit');
ok(bad[1].problems.includes('no dish named'), 'a block with no dish is reported');
ok(bad[2].type === 'technique' && bad[2].notes.some(p => /unknown type/.test(p)),
  'an unknown type falls back to technique AND says so, rather than silently choosing');
ok(bad[2].ready && bad[2].problems.length === 0,
  'a defaulted type is a NOTE, not a blocker — conflating the two silently prevents good entries from saving');
ok(bad[3].problems.includes('no text'), 'an empty block is caught');
ok(!bad[3].ready, 'and cannot be committed');

// ── Nothing is saved by parsing ─────────────────────────────────────────────
ok(candidateToEntry(bad[0]) === null, 'a blocked candidate cannot be converted');
ok(candidateToEntry(null) === null, 'and neither can nothing');
const entry = candidateToEntry(two[0]);
ok(entry.subject.kind === 'dish' && entry.subject.dishId, 'a committed entry carries the stable dish id');
ok(entry.imported === true,
  'and is marked as imported — "did I write this or approve it" is worth being able to answer later');
ok(entry.confidence === 'firm', 'confidence survives the conversion');

// It really does produce a valid entry the journal accepts.
const j = addEntry(emptyJournal(), entry);
ok(entriesForDish(j, REAL, DISH_RENAMES).length === 1, 'and the journal accepts it as a normal entry');

// ── Flags ───────────────────────────────────────────────────────────────────
const flags = parseImport(`[dish] ${REAL}\n[type] provenance\n[private] yes\n[transferable] yes\nA private line.`);
ok(flags[0].private === true && flags[0].transferable === true, 'private and transferable are readable');

// ── Tolerance ───────────────────────────────────────────────────────────────
ok(parseImport('').length === 0, 'empty input parses to nothing, not a throw');
ok(parseImport(null).length === 0, 'and neither does null');
ok(parseImport('just some prose with no keys at all')[0].problems.includes('no dish named'),
  'plain prose parses as a block that needs a dish, rather than being rejected outright');
ok(parseImport(`[DISH] ${REAL}\n[TYPE] Technique\ntext`)[0].ready, 'keys and types are case-insensitive');
ok(parseImport(`[dish] ${REAL}\n[type] What done looks like\ntext`)[0].type === 'doneCues',
  'a type can be given by its DISPLAY label, since nobody remembers internal keys');

// ── Summary ─────────────────────────────────────────────────────────────────
const sum = importSummary(bad);
ok(sum.total === 4 && sum.ready === 1 && sum.blocked === 3,
  'the summary counts ready against blocked: only the bad-type block is committable, the other three lack a known dish, a dish, or text');
ok(Array.isArray(sum.dishes), 'and names the dishes touched, so the scale of a paste is visible before committing');
ok(typeof IMPORT_FORMAT_HELP === 'string' && /\[dish\]/.test(IMPORT_FORMAT_HELP),
  'the format is documented in code, so the paste box and Claude use the same one');

console.log(`JOURNAL IMPORT: ALL PASS (${pass} checks)`);
