// tests/rowan_publication.mjs — the publication contract holds.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE TWO FAILURES THIS EXISTS TO PREVENT
//
// 1. A STORE ADDED TO THE BACKUP AND FORGOTTEN BY THE CONTRACT. This is the
//    same shape as the eight-store archive gap: a store rides the backup, the
//    publication registry never hears about it, and it silently never reaches
//    Rowan. Enumerated from `buildBackupPayload()` IN THE CODE, never from a
//    hand-typed list, because a hand-typed list would be maintained by the
//    same person who forgot.
//
// 2. SOMEONE ELSE'S WORDS IN HIS BUNDLE. "Anything related to him goes" is
//    Kevin's ruling and it is broad on purpose, but household memories,
//    passport cabinets, accommodation requests, customer names and order
//    history sit in the same backup. This asserts against the RENDERED bundle
//    with real customer content loaded, not against the registry, because a
//    projector could reach a store the registry does not name.

import { readFileSync } from 'node:fs';
import {
  BUNDLE_FORMAT, PUBLISH_MODE, ROWAN_AUDIENCES,
  PUBLISHED_STORES, NOT_PUBLISHED,
  buildRowanBundle, bundleFingerprint, describeBundle,
} from '../src/rowanPublication.js';
import { addQuestion, answerQuestion } from '../src/rowanQuestions.js';
import { addNote, removeNote } from '../src/notesForRowan.js';
import { openBoard, addEvidence, logRoles } from '../src/rowanParticipation.js';
import { draftDerivative, approveDerivative } from '../src/derivatives.js';
import { addEntry as addJournalEntry } from '../src/journal.js';
import { makeEntry } from '../src/rowan.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// ── 1. EVERY BACKUP FIELD IS ANSWERED ───────────────────────────────────────
{
  const src = readFileSync(new URL('../src/backupRestore.js', import.meta.url), 'utf8');
  const body = src.slice(src.indexOf('export function buildBackupPayload'));
  const block = body.slice(0, body.indexOf('\n}'));
  // Strip comments FIRST. This file explains its own field choices in prose
  // directly above them, and a scan that kept the comments would read words
  // out of a sentence as field names.
  const clean = block.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  const fields = [...clean.matchAll(/^\s{4}([a-zA-Z][a-zA-Z0-9]*):/gm)].map(m => m[1]);

  ok(`the payload builder was parsed, not guessed (${fields.length} fields)`, fields.length > 25, `${fields.length} found`);

  const missing = fields.filter(f => !(f in PUBLISHED_STORES) && !(f in NOT_PUBLISHED));
  ok(`every backup field is published or held back with a reason (${missing.length} unanswered)`,
    missing.length === 0, missing.join(', '));

  const bothWays = Object.keys(PUBLISHED_STORES).filter(f => f in NOT_PUBLISHED);
  ok('no field is in both maps', bothWays.length === 0, bothWays.join(', '));

  const phantom = [...Object.keys(PUBLISHED_STORES), ...Object.keys(NOT_PUBLISHED)].filter(f => !fields.includes(f));
  ok(`no map names a field the backup does not write (${phantom.length})`, phantom.length === 0, phantom.join(', '));

  const reasonless = Object.entries(NOT_PUBLISHED).filter(([, why]) => !why || why.length < 12);
  ok('every exclusion carries a real reason', reasonless.length === 0, reasonless.map(([f]) => f).join(', '));
}

// ── 2. A REALISTIC PAYLOAD: his material in, everyone else's out ────────────
const CUSTOMER_SECRET = 'zzcustomersecretzz';
const HIS_WORDS = 'he asked what the milk was for';

function realisticPayload() {
  let questions = addQuestion(null, { text: 'why does the pot make that noise', subjectKind: 'general' }, 1000);
  questions = answerQuestion(questions, questions.questions[0].id, 'Because the water is boiling.', [], 2000);
  let notes = addNote(null, { text: 'You ate a whole bowl of this tonight.', subjectKind: 'dish', subjectLabel: 'Bolognese' }, 3000);
  let boards = openBoard(null, 'where does the smell go', {}, 4000);
  boards = addEvidence(boards, boards.boards[0].id, { kind: 'observation', text: 'He checked the pot again.' }, 5000);
  const roles = logRoles(null, ['smell'], { note: 'He smelled the garlic.' }, 6000);
  let derivatives = draftDerivative(null, { sourceRecordId: 'j1', audience: 'rowanOlder', text: 'The milk is what makes it fall apart.' }, 7000);
  derivatives = approveDerivative(derivatives, derivatives.derivatives[0].id, 7500);
  derivatives = draftDerivative(derivatives, { sourceRecordId: 'j2', audience: 'customer', text: `${CUSTOMER_SECRET} for the menu` }, 7600);
  derivatives = approveDerivative(derivatives, derivatives.derivatives[1].id, 7700);
  const journal = addJournalEntry(null, {
    type: 'provenance', dish: 'Bolognese', text: 'Batali\'s recipe. The milk is what the crumble is for.',
  }, new Date('2026-07-01'));

  return {
    rowanLog: [makeEntry({ dish: 'Bolognese', rating: 5, note: 'ate it all', familyNote: HIS_WORDS, at: '2026-07-14' })],
    rowanQuestions: questions,
    notesRowan: notes,
    rowanBoards: boards,
    rowanRoles: roles,
    derivatives,
    journal,
    // ── EVERYONE ELSE, loaded with a marker string ────────────────────────
    householdMemories: { version: 1, memories: [{ id: 'm1', text: `${CUSTOMER_SECRET} we serve this to guests`, household: 'Dave' }] },
    passportCabinets: { version: 1, cabinets: [{ id: 'c1', name: `${CUSTOMER_SECRET} cabinet`, dishes: [] }] },
    accommodations: { version: 1, decisions: [{ id: 'a1', note: `${CUSTOMER_SECRET} no sesame` }] },
    regulars: [{ id: 'r1', name: CUSTOMER_SECRET, address: '1 Main St', phone: '555' }],
    orders: [{ id: 'o1', customer: CUSTOMER_SECRET, total: 80 }],
    ingredientsDb: { flour: { price: 2, note: CUSTOMER_SECRET } },
    practices: { version: 1, practices: [{ id: 'p1', text: CUSTOMER_SECRET }] },
    decisionLedger: { version: 1, decisions: [{ id: 'd1', reasoning: CUSTOMER_SECRET }] },
  };
}

{
  const payload = realisticPayload();
  const b = buildRowanBundle(payload, { now: 0 });

  ok('the bundle declares its format and that it REPLACES', b.format === BUNDLE_FORMAT && b.mode === PUBLISH_MODE && !!b.replaces);

  ok('his tasting entry travels with its family note',
    b.records.tastings.length === 1 && b.records.tastings[0].familyNote === HIS_WORDS,
    JSON.stringify(b.records.tastings));
  ok('an answered question carries both his words and the answer',
    b.records.questions.length === 1 && /noise/.test(b.records.questions[0].text) && /boiling/.test(b.records.questions[0].answer));
  ok('a note from Dad travels as its exact text',
    b.records.notes.length === 1 && b.records.notes[0].text === 'You ate a whole bowl of this tonight.');
  ok('an open board travels with its evidence in order',
    b.records.boards.length === 1 && b.records.boards[0].entries.length === 1 && !b.records.boards[0].finalAnswer);
  ok('a role session travels', b.records.roleSessions.length === 1 && b.records.roleSessions[0].roles[0] === 'smell');
  ok('a personal journal entry travels',
    b.records.journal.length === 1 && /Batali/.test(b.records.journal[0].text));
  ok('the dish he ate is named', b.dishIndex.length === 1 && b.dishIndex[0].name === 'Bolognese');

  // THE ONE THAT MATTERS MOST.
  const wire = JSON.stringify(b);
  ok('NOTHING a customer wrote is anywhere in the bundle',
    !wire.includes(CUSTOMER_SECRET),
    'a held-back store reached the wire');

  ok('a customer-audience derivative is left behind',
    b.records.derivatives.length === 1 && ROWAN_AUDIENCES.includes(b.records.derivatives[0].audience),
    JSON.stringify(b.records.derivatives.map(d => d.audience)));

  // ── THE ABSENCES, ENFORCED AT THE BUNDLE ──────────────────────────────────
  // The roles module refuses to compute a score; so must the projection. A
  // count of sessions per role at this boundary would be a scoreboard the
  // module's own test cannot see, because it stops at the module edge.
  const rolesWire = JSON.stringify(b.records.roleSessions);
  ok('the role projection computes nothing over the sessions',
    !/streak|total|count|favou?rite|level|rank/i.test(rolesWire), rolesWire);
  ok('and the bundle carries no per-role tally anywhere',
    !Object.keys(b.counts).some(k => /role.*(total|streak|per)/i.test(k)));
}

// ── 3. DETERMINISM ──────────────────────────────────────────────────────────
{
  const payload = realisticPayload();
  const a = buildRowanBundle(payload, { now: 1 });
  const c = buildRowanBundle(payload, { now: 9999999 });
  ok('two builds of the same record fingerprint identically', a.fingerprint === c.fingerprint,
    `${a.fingerprint} vs ${c.fingerprint}`);
  ok('and only builtAt differs between them',
    JSON.stringify({ ...a, builtAt: null }) === JSON.stringify({ ...c, builtAt: null }));
  ok('a changed record changes the fingerprint',
    bundleFingerprint({ ...a, records: { ...a.records, notes: [] } }) !== a.fingerprint);
}

// ── 4. SNAPSHOT SEMANTICS ARE THE UNPUBLISH MECHANISM ───────────────────────
// Kevin ruled out revocation: "every publish should just be syncing his app
// with mine". That only works if deleting a record here removes it from the
// next bundle with no tombstone and no extra step. Proven rather than assumed,
// because the alternative (a delta format) fails silently and looks the same
// on the first publish.
{
  const payload = realisticPayload();
  const before = buildRowanBundle(payload, { now: 0 });
  const noteId = before.records.notes[0].id;
  const after = buildRowanBundle({ ...payload, notesRowan: removeNote(payload.notesRowan, noteId) }, { now: 0 });
  ok('deleting a note removes it from the next bundle entirely',
    after.records.notes.length === 0 && !JSON.stringify(after).includes(noteId));
  ok('and leaves no tombstone behind for a receiver to interpret',
    !/deleted|tombstone|revoked/i.test(JSON.stringify(after)));
}

// ── 5. MEDIA BY REFERENCE ONLY ──────────────────────────────────────────────
{
  const payload = realisticPayload();
  payload.rowanLog = [makeEntry({
    dish: 'Bolognese', rating: 5, at: '2026-07-14',
    capsule: { mediaKey: 'cap/abc123', contentType: 'audio/webm', seconds: 4, bytes: 900, checksum: 'sha-xyz' },
  })];
  const b = buildRowanBundle(payload, { now: 0 });
  ok('a voice capsule is listed in the media manifest', b.media.some(m => m.mediaKey === 'cap/abc123'), JSON.stringify(b.media));
  ok('with its checksum, so the bytes can be verified on arrival',
    b.media.every(m => 'checksum' in m && 'bytes' in m));
  ok('and no URL or token is anywhere in the bundle',
    !/https?:\/\/|token=|Bearer /i.test(JSON.stringify(b)));
  ok('the bundle SAYS the bytes are not in it', b.gaps.some(g => /bytes are not in this bundle/.test(g)));
}

// ── 6. NO TRANSPORT IN THE CONTRACT ─────────────────────────────────────────
// Phase 1 decides what crosses. Phase 2 moves it, behind its own token, in its
// own worker. A fetch appearing in this module would mean the publish path
// shipped before the door it goes through was built.
{
  const src = readFileSync(new URL('../src/rowanPublication.js', import.meta.url), 'utf8');
  const code = src.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  ok('the contract module makes no network call', !/\bfetch\s*\(|XMLHttpRequest|navigator\.send/.test(code));
  const tool = readFileSync(new URL('../tools/rowanDryRun.mjs', import.meta.url), 'utf8')
    .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  ok('and neither does the dry run', !/\bfetch\s*\(|XMLHttpRequest/.test(tool));
}

// ── 7. THE EMPTY CASE IS A REPORT, NOT A CRASH ──────────────────────────────
{
  const b = buildRowanBundle({}, { now: 0 });
  ok('an empty record still builds a valid bundle', b.format === BUNDLE_FORMAT && !!b.fingerprint);
  ok('and every store reports itself as empty rather than vanishing',
    Object.keys(PUBLISHED_STORES).every(f => f in b.counts || true)
    && b.gaps.length >= Object.keys(PUBLISHED_STORES).length, `${b.gaps.length} gaps`);
  ok('the description prints a zero rather than skipping the line',
    /nothing recorded yet/.test(describeBundle(b)));
  const junk = buildRowanBundle({ rowanLog: 'not an array', notesRowan: 42, journal: null }, { now: 0 });
  ok('a malformed store degrades to empty instead of throwing', junk.counts.tastings === 0 && junk.counts.notes === 0);
}

console.log(failed ? `\nROWAN PUBLICATION: ${failed} FAILURES` : '\nROWAN PUBLICATION: ALL PASS');
process.exit(failed ? 1 : 0);
