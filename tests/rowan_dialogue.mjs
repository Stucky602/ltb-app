// tests/rowan_dialogue.mjs — questions, vocabulary, and the future reader test.
//
// THREE PROPERTIES:
//
//   QUESTIONS — the app never authors an answer. Retrieval is allowed;
//   authorship is not. A child reading this in twenty years has to be able to
//   trust that every answer came from his father.
//
//   VOCABULARY — a word said by Rowan and a word written by a parent ABOUT him
//   are different claims and are never collapsed. And nothing here grades him.
//
//   CLARIFICATIONS — flagging a record never edits it. The original was an
//   accurate record of what its author knew; "this is hard to follow" is a
//   second fact, not a correction of the first.

import {
  emptyQuestions, normalizeQuestions, addQuestion, answerQuestion,
  attachQuestionCapsule, unansweredQuestions, answeredQuestions,
  questionsAbout, questionCounts,
} from '../src/rowanQuestions.js';
import {
  makeEntry, addEntry, attachCapsule, editTranscript,
  vocabularyTimeline, vocabularyByAge,
} from '../src/rowan.js';
import {
  emptyClarifications, normalizeClarifications, flagRecord, resolveClarification,
  dismissClarification, openClarifications, clarificationsFor, clarificationsByReason,
  clarificationCounts, READER_REASONS,
} from '../src/clarifications.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// ── QUESTIONS ───────────────────────────────────────────────────────────────
{
  let s = addQuestion(emptyQuestions(), { text: 'why is the sauce brown and not red' });
  const q = s.questions[0];
  ok('a question is stored with no answer', !!q && q.answer === '' && q.answeredAt === null);
  ok('and it is UNANSWERED, which is an accurate state rather than an incomplete one',
    unansweredQuestions(s).length === 1,
    'this list is what Kevin still owes his son, in his son\'s words');

  ok('a question with neither words nor audio is refused',
    addQuestion(emptyQuestions(), { text: '   ' }).questions.length === 0);

  const withAudio = addQuestion(emptyQuestions(), { capsule: { mediaKey: 'q1.webm', seconds: 4 } });
  ok('but audio alone is enough to be a question',
    withAudio.questions.length === 1 && !!withAudio.questions[0].capsule,
    'a two-year-old asks before he can be transcribed');

  s = answerQuestion(s, q.id, 'Because we cook the tomatoes for a long time.', ['j:123']);
  const a = normalizeQuestions(s).questions[0];
  ok('answering stores Kevin\'s words', a.answer.startsWith('Because we cook'));
  ok('and stamps when', !!a.answeredAt,
    'how long a child waited is part of the record, not an embarrassment to hide');
  ok('and can cite real records as evidence', a.evidence.includes('j:123'));
  ok('it moves out of the waiting list', unansweredQuestions(s).length === 0 && answeredQuestions(s).length === 1);

  ok('an EMPTY answer does not mark a question answered',
    unansweredQuestions(answerQuestion(addQuestion(emptyQuestions(), { text: 'why' }),
      normalizeQuestions(addQuestion(emptyQuestions(), { text: 'why' })).questions[0].id, '  ')).length === 1,
    'a blank must never clear a question off the list');

  // The rule that matters most, asserted against the source rather than behaviour:
  // there is no path in this module that composes an answer.
  const src = await import('node:fs').then(fs =>
    fs.readFileSync(new URL('../src/rowanQuestions.js', import.meta.url), 'utf8'));
  ok('the module has no answer generator, suggester, or draft',
    !/suggestAnswer|draftAnswer|generateAnswer|autoAnswer/.test(src),
    'LTB must never generate an answer and present it as Kevin\'s');

  const linked = addQuestion(emptyQuestions(), { text: 'why milk', subjectKind: 'ingredient', subjectId: 'milk' });
  ok('a question links to a real entity rather than copying it',
    questionsAbout(linked, 'ingredient', 'milk').length === 1);
  ok('an unknown subject kind falls back to general',
    normalizeQuestions({ questions: [{ id: 'x', text: 'y', subjectKind: 'planet' }] })
      .questions[0].subjectKind === 'general');
  ok('counts add up', questionCounts(s).answered === 1);
}

// ── VOCABULARY ──────────────────────────────────────────────────────────────
{
  let log = addEntry([], makeEntry({
    dish: 'Chili', rating: 4, note: 'he called it spicy',
    at: '2026-01-01T00:00:00.000Z',
  }));
  const id = log[0].id;
  log = attachCapsule(log, id, { mediaKey: 'k.webm', seconds: 5 });
  log = editTranscript(log, id, 'it tastes like fire');

  const tl = vocabularyTimeline(log);
  const byWord = Object.fromEntries(tl.map(w => [w.word, w]));

  ok('words from a transcript are recorded as ROWAN\'s',
    byWord.fire && byWord.fire.voice === 'rowan',
    'a transcript is Kevin typing what his son actually said');
  ok('words from a parent note are recorded as the PARENT\'s',
    byWord.spicy && byWord.spicy.voice === 'parent',
    'that is Kevin describing him, which is a different claim entirely');
  ok('every word links back to the entry it came from',
    tl.every(w => w.entryId && w.at),
    'a word must always be checkable against what was actually said');

  // The ordering rule.
  let log2 = addEntry([], makeEntry({ dish: 'A', rating: 3, at: '2026-01-01T00:00:00.000Z' }));
  log2 = attachCapsule(log2, log2[0].id, { mediaKey: 'a.webm', seconds: 2 });
  log2 = editTranscript(log2, log2[0].id, 'crunchy');
  log2 = addEntry(log2, makeEntry({ dish: 'B', rating: 3, note: 'crunchy again', at: '2026-02-01T00:00:00.000Z' }));
  ok('a word already in Rowan\'s voice is never downgraded by a later parent note',
    vocabularyTimeline(log2).find(w => w.word === 'crunchy').voice === 'rowan');

  ok('first appearance is the one kept',
    vocabularyTimeline(log2).find(w => w.word === 'crunchy').at === '2026-01-01T00:00:00.000Z');

  ok('an empty log yields an empty timeline', vocabularyTimeline([]).length === 0);
  ok('bands come out in age order',
    vocabularyByAge(log).every((b, i, arr) => i === 0 || b.from > arr[i - 1].from));

  // What it must NOT do.
  const rsrc = await import('node:fs').then(fs =>
    fs.readFileSync(new URL('../src/rowan.js', import.meta.url), 'utf8'));
  // COMMENTS STRIPPED FIRST. The section's own header explains why it must not
  // grade him and therefore contains the very words being searched for — the
  // fourth time in this repo a test has matched its own explanation.
  const vocabSection = rsrc
    .slice(rsrc.indexOf('PALATE VOCABULARY'), rsrc.indexOf('export function capsuleCount'))
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('nothing in the vocabulary CODE scores, grades, or benchmarks',
    !/percentile|milestone|expected|behind|ahead|score\b/i.test(vocabSection),
    'a report card is not what anyone asked for and would poison the whole record');
}

// ── CLARIFICATIONS ──────────────────────────────────────────────────────────
{
  let s = flagRecord(emptyClarifications(), {
    recordId: 'j:abc', recordTitle: 'Bolognese · technique', reason: 'version', reader: 'kevin',
  });
  ok('a flag is stored against the exact record', openClarifications(s).length === 1
    && clarificationsFor(s, 'j:abc').length === 1);

  ok('a flag with an unknown reason is refused',
    flagRecord(emptyClarifications(), { recordId: 'x', reason: 'vibes' }).items.length === 0,
    '"this is confusing" is a feeling; the fixed list produces something actionable');
  ok('a flag pointing at nothing is refused',
    flagRecord(emptyClarifications(), { reason: 'meaning' }).items.length === 0);

  const id = s.items[0].id;
  s = resolveClarification(s, id, 'It applies to v5 onward.');
  ok('answering records the answer', normalizeClarifications(s).items[0].resolution.includes('v5'));
  ok('and closes it', openClarifications(s).length === 0);
  ok('but the flagged record id is untouched',
    normalizeClarifications(s).items[0].recordId === 'j:abc',
    'the flag never edits canon; the original stays exactly as written');

  const dismissed = dismissClarification(
    flagRecord(emptyClarifications(), { recordId: 'a', reason: 'why' }),
    flagRecord(emptyClarifications(), { recordId: 'a', reason: 'why' }).items[0].id, 'Fine as it is.');
  ok('"it is fine as it is" is a recorded answer rather than a delete',
    normalizeClarifications(dismissed).items.length === 1,
    'otherwise the same record gets flagged and re-argued every year');

  const fromRowan = flagRecord(emptyClarifications(), { recordId: 'z', reason: 'meaning', reader: 'rowan' });
  ok('who could not follow it is recorded',
    clarificationCounts(fromRowan).fromRowan === 1,
    'Kevin rereading cold and Rowan reading in fifteen years are different signals');

  let many = emptyClarifications();
  many = flagRecord(many, { recordId: 'a', reason: 'version' });
  many = flagRecord(many, { recordId: 'b', reason: 'version' });
  many = flagRecord(many, { recordId: 'c', reason: 'meaning' });
  const groups = clarificationsByReason(many);
  ok('the queue groups by reason so a batch can be answered in one sitting',
    groups.length === 2 && groups.find(g => g.id === 'version').items.length === 2);
  ok('every reason has a label the UI can show', READER_REASONS.every(r => r.id && r.label));
  ok('a malformed store normalizes to empty',
    normalizeClarifications({ items: 'no' }).items.length === 0);
}

console.log(failed === 0 ? '\nROWAN DIALOGUE: ALL PASS' : `\nROWAN DIALOGUE: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
