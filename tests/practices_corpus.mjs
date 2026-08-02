// tests/practices_corpus.mjs — the practice library and the record search.
//
// TWO PROPERTIES CARRY THIS WHOLE FEATURE, and everything else here is detail:
//
//   1. A PROPOSED PRACTICE IS NOT KEVIN'S WORD. The seeds are Claude's reading
//      of things he said. If a proposal could be read anywhere as canon, the
//      app would be quoting him saying things he never approved — in the record
//      that exists to outlive the business and be handed to his son. Status is
//      the whole safety mechanism and it is asserted from both directions.
//
//   2. SEARCH RETURNS RECORDS OR IT RETURNS NOTHING. No synthesis, no filling a
//      gap from general knowledge. "The record has nothing matching that" is a
//      correct and useful answer; a plausible invention is the failure this
//      whole layer is designed to make impossible.

import {
  emptyPractices, normalizePractices, addPractice, updatePractice, removePractice,
  confirmedPractices, practiceCounts, seedPractices, PRACTICE_SEEDS,
} from '../src/practices.js';
import {
  buildCorpus, searchCorpus, tokenize, excerptFor, CORPUS_KINDS,
  fromJournal, fromPractices,
} from '../src/corpus.js';
import { addEntry, emptyJournal } from '../src/journal.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// ── The status contract ─────────────────────────────────────────────────────
{
  const seeded = seedPractices(emptyPractices());
  ok('every seeded practice arrives as a PROPOSAL, never confirmed',
    seeded.entries.length > 0 && seeded.entries.every(e => e.status === 'proposed'),
    'a seed presented as confirmed would put words in Kevin\'s mouth in the record meant for his son');
  ok('and confirmedPractices returns none of them',
    confirmedPractices(seeded).length === 0,
    'this is the accessor every other reader must use; if proposals leak through it they leak everywhere');

  ok('every seed cites where it came from',
    seeded.entries.every(e => (e.sources || []).length > 0),
    'a draft he cannot trace is one he has to take on trust, which is the opposite of the point');

  const confirmed = updatePractice(seeded, seeded.entries[0].id, { status: 'confirmed' });
  ok('confirming moves it into canon',
    confirmedPractices(confirmed).length === 1);
  ok('and stamps WHEN it was confirmed',
    !!confirmedPractices(confirmed)[0].lastConfirmedAt,
    '"confirmed two years ago" is a different claim from "confirmed last month"');

  const retired = updatePractice(confirmed, seeded.entries[0].id, { status: 'retired' });
  ok('retiring removes it from canon but keeps the record',
    confirmedPractices(retired).length === 0 &&
    normalizePractices(retired).entries.some(e => e.id === seeded.entries[0].id),
    'when a practice stopped being true is itself worth knowing');
}

// ── Seeding is idempotent by TEXT, so a reworded entry is safe ───────────────
{
  const once = seedPractices(emptyPractices());
  const twice = seedPractices(once);
  ok('re-seeding adds nothing',
    twice.entries.length === once.entries.length,
    `${once.entries.length} -> ${twice.entries.length}`);

  // The case that matters: Kevin rewords a draft into his own voice. Re-seeding
  // must not resurrect Claude's wording alongside it.
  const target = once.entries[0];
  const reworded = updatePractice(once, target.id, { text: 'My own way of saying it', status: 'confirmed' });
  const after = seedPractices(reworded);
  ok('a practice Kevin reworded is never replaced by the draft it came from',
    after.entries.filter(e => e.id === target.id).length === 1 &&
    after.entries.find(e => e.id === target.id).text === 'My own way of saying it' &&
    after.entries.length === once.entries.length,
    'seeding by id AND text means his edit wins and no duplicate appears');
}

// ── Store hygiene ───────────────────────────────────────────────────────────
{
  ok('a malformed store normalizes to empty rather than throwing',
    normalizePractices({ entries: 'nope' }).entries.length === 0 &&
    normalizePractices(null).entries.length === 0);
  ok('an empty practice is refused',
    addPractice(emptyPractices(), { text: '   ' }).entries.length === 0,
    'an empty entry is a mis-tap, not a record');
  const dup = addPractice(addPractice(emptyPractices(), { id: 'x', text: 'a' }), { id: 'x', text: 'b' });
  ok('a duplicate id cannot be added twice', dup.entries.length === 1);
  ok('removePractice removes exactly one',
    removePractice(dup, 'x').entries.length === 0);
  const counts = practiceCounts(seedPractices(emptyPractices()));
  ok('counts add up', counts.total === counts.proposed + counts.confirmed + counts.retired);
}

// ── Corpus adapters ─────────────────────────────────────────────────────────
{
  const corpus = buildCorpus({});
  ok('the corpus builds with no stores at all',
    corpus.length > 0,
    'recipe versions and the reheat walk are code-resident, so Ask works on a fresh device');
  ok('every record carries a kind the UI knows',
    corpus.every(r => CORPUS_KINDS.includes(r.kind)));
  ok('every record carries an id and text or a title',
    corpus.every(r => r.id && (r.text || r.title)));

  let j = emptyJournal();
  j = addEntry(j, { subject: { kind: 'dish', dish: 'Bolognese' }, type: 'technique', text: 'The milk is what makes the meat crumble.' });
  const jr = fromJournal(j);
  ok('journal entries reach the corpus with their dish attached',
    jr.length === 1 && jr[0].kind === 'journal' && /milk/.test(jr[0].text));

  const pr = fromPractices(seedPractices(emptyPractices()));
  ok('a practice is searchable by its REASON, not just its headline',
    pr.some(r => /working time/i.test(r.text)),
    '"which practices mention Monday preparation" has to match a why');

  ok('a malformed store yields nothing rather than breaking Ask',
    fromJournal({ entries: 'no' }).length === 0 && fromPractices(undefined).length === 0,
    'Ask must never fail to open because one store on one device is an odd shape');
}

// ── Search behaviour ────────────────────────────────────────────────────────
{
  const corpus = buildCorpus({ practices: seedPractices(emptyPractices()) });

  ok('a query with no support returns NOTHING, not a near miss',
    searchCorpus(corpus, 'zzzqqq unrelated nonsense').length === 0,
    'this empty result is the feature: it is how Kevin learns something was never written down');

  const hits = searchCorpus(corpus, 'boil');
  ok('a real query finds the record that says it',
    hits.length > 0 && hits.some(h => /do not boil/i.test(h.text)));

  ok('every hit is a real record with a link back',
    hits.every(h => h.id && h.link && h.link.view));

  // Scoring: all terms present must beat many hits on one.
  const c2 = [
    { id: 'a', kind: 'journal', title: '', text: 'ice ice ice ice ice', date: 0, link: { view: 'record' } },
    { id: 'b', kind: 'journal', title: '', text: 'the ice cube goes in the squash bag', date: 0, link: { view: 'record' } },
  ];
  const r2 = searchCorpus(c2, 'ice squash');
  ok('a record matching every term outranks one matching a single term repeatedly',
    r2[0].id === 'b',
    'otherwise the loudest record wins instead of the right one');

  ok('kind filtering works',
    searchCorpus(corpus, 'boil', { kinds: ['practice'] }).every(h => h.kind === 'practice'));

  ok('an empty query with a filter browses rather than returning nothing',
    searchCorpus(corpus, '', { kinds: ['practice'] }).length > 0);

  ok('stop words do not match on their own',
    tokenize('what is the').length === 0,
    'searching "the" must not return the entire record');

  const long = 'x'.repeat(400) + ' NEEDLE ' + 'y'.repeat(400);
  ok('the excerpt shows the part that matched, not the opening',
    /NEEDLE/.test(excerptFor(long, ['needle'])),
    'a long dossier entry whose first line is irrelevant still has to show why it matched');
}

console.log(failed === 0 ? '\nPRACTICES + CORPUS: ALL PASS' : `\nPRACTICES + CORPUS: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
