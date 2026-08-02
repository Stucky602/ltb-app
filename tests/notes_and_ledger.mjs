// tests/notes_and_ledger.mjs — the two stores approved Aug 2 that needed
// nothing from Kevin to build.
//
// NOTES FOR ROWAN: the property is that nothing improves it. No generator, no
// summariser, no milestone gate. Kevin's instruction was that it stay
// intentionally simple, and every feature anyone would be tempted to add here
// replaces his words with something smoother.
//
// DECISION LEDGER: the property is that a decision without its REASONING is the
// thing that gets re-proposed, and a decision without a reconsideration
// condition hardens into dogma.

import {
  emptyNotes, normalizeNotes, addNote, attachMedia, removeNote,
  notesTimeline, notesAbout, noteCounts, NOTE_SUBJECTS,
} from '../src/notesForRowan.js';
import {
  emptyLedger, normalizeLedger, addDecision, updateDecision, supersedeDecision,
  findDecisions, settledDecisions, decisionCounts, DECISION_STATUSES,
} from '../src/decisionLedger.js';
import { readFileSync } from 'node:fs';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// ── NOTES FOR ROWAN ─────────────────────────────────────────────────────────
{
  ok('it ships empty', emptyNotes().notes.length === 0);

  let s = addNote(emptyNotes(), { text: 'The first thing I want you to know about heat.' });
  ok('a note saves with words alone', s.notes.length === 1);
  ok('and needs no subject', s.notes[0].subjectKind === 'none',
    'some things are about a dish; some are just things he wanted to say');

  ok('an empty note is refused',
    addNote(emptyNotes(), { text: '   ' }).notes.length === 0);
  const mediaOnly = addNote(emptyNotes(), {
    text: '', media: [{ kind: 'audio', mediaKey: 'nr_1.webm', seconds: 30 }],
  });
  ok('but audio alone is enough', mediaOnly.notes.length === 1);

  const linked = addNote(emptyNotes(), {
    text: 'Why we wait a day.', subjectKind: 'practice', subjectId: 'pr_seed_fridge_rest',
  });
  ok('a note can hang off a real record', notesAbout(linked, 'practice').length === 1);
  ok('an unknown subject falls back rather than being stored',
    normalizeNotes({ notes: [{ id: 'a', text: 'x', subjectKind: 'planet' }] }).notes[0].subjectKind === 'none');

  s = attachMedia(s, s.notes[0].id, { kind: 'photo', mediaKey: 'nr_p.webp' });
  ok('media attaches by key, never bytes',
    normalizeNotes(s).notes[0].media[0].mediaKey === 'nr_p.webp');
  ok('media with no key is refused',
    attachMedia(s, s.notes[0].id, { kind: 'photo' }).notes[0].media.length === 1);

  // DELETION IS ALLOWED, unlike almost every other store here.
  ok('a note can be deleted outright',
    removeNote(s, s.notes[0].id).notes.length === 0,
    'elsewhere records are marked rather than erased; a private message to his son is different, '
    + 'and an app that preserved it against his wishes would have overruled him about his own words');

  let many = addNote(emptyNotes(), { text: 'later', at: 2000 });
  many = addNote(many, { text: 'earlier', at: 1000 });
  ok('the timeline runs oldest first, which is how it will be read',
    notesTimeline(many)[0].text === 'earlier');

  ok('counts add up', noteCounts(many).total === 2);
  ok('every subject has a label the UI can show', NOTE_SUBJECTS.every(x => x.id && x.label));

  // The property that matters most.
  const src = readFileSync(new URL('../src/notesForRowan.js', import.meta.url), 'utf8');
  ok('nothing in the module generates, rewrites, or summarises a note',
    !/summari|rewrite|generate|polish|suggest/i.test(
      src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')),
    'Kevin: not generated, not rewritten, not delayed by artificial milestones');
  // Comments stripped for BOTH checks. The header of that file explains why
  // there are no milestones, so it contains the word — the same self-matching
  // trap this repo has now hit six times.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('and there is no unlock, milestone, or scheduled release',
    !/unlock|milestone|releaseAt|deliverAt|age >= /i.test(code),
    'a note is available from the moment he writes it');
}

// ── DECISION LEDGER ─────────────────────────────────────────────────────────
{
  ok('it ships empty', emptyLedger().decisions.length === 0,
    'seeding it from a backlog would repeat the practice-seed failure, and worse: '
    + 'its whole purpose is to be the authority nobody re-litigates');

  let s = addDecision(emptyLedger(), {
    title: 'Menu PDFs',
    why: 'The order form already carries the menu.',
    source: 'Kevin, backlog 8F',
    reconsiderIf: 'The order form stops carrying the full menu.',
    status: 'declined',
  });
  ok('a decision records the reasoning, not just the outcome',
    s.decisions[0].why.length > 0,
    'the outcome survives in the code; the reasoning is what gets lost and re-proposed');
  ok('and where Kevin said it', s.decisions[0].source.length > 0);
  ok('and what would reopen it', s.decisions[0].reconsiderIf.length > 0,
    'a decision with no stated conditions is indistinguishable from dogma');

  ok('a decision with no title is refused',
    addDecision(emptyLedger(), { why: 'x' }).decisions.length === 0);
  ok('an unknown status falls back to proposed, never approved',
    normalizeLedger({ decisions: [{ id: 'a', title: 't', status: 'shipped-probably' }] })
      .decisions[0].status === 'proposed',
    'falling back to approved would let a malformed record authorise something');

  ok('the search finds it by a word from the reasoning',
    findDecisions(s, 'order form').length === 1,
    'a collaborator asks "why no menu pdf" in their own words, not the entry title');
  ok('and returns nothing for an unrelated query',
    findDecisions(s, 'zzzqq').length === 0);

  ok('settled decisions are the ones that should stop a proposal',
    settledDecisions(s).length === 1);

  const sup = supersedeDecision(s, s.decisions[0].id, {
    title: 'Menu PDFs, revisited', why: 'The form changed.', status: 'approved',
  });
  const old = normalizeLedger(sup).decisions.find(d => d.id === s.decisions[0].id);
  ok('superseding KEEPS the old decision and points forward',
    old.status === 'superseded' && !!old.supersededBy,
    'a document written against the old decision should still be readable');
  ok('and the superseded one stops counting as settled',
    settledDecisions(sup).length === 0);

  const counts = decisionCounts(addDecision(s, { title: 'No reason given' }));
  ok('entries with no reconsideration condition are countable',
    counts.withoutReconsiderIf === 1,
    'they are the ones most likely to harden into dogma');
  ok('every status is distinct', new Set(DECISION_STATUSES).size === DECISION_STATUSES.length);
}

console.log(failed === 0 ? '\nNOTES + LEDGER: ALL PASS' : `\nNOTES + LEDGER: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
