// tests/knowledge_core.mjs — terms, anatomy, and the one gate between a
// private record and another reader.
//
// THREE PROPERTIES, one per store:
//
//   TERMS — changing a definition keeps the old one. Documents written in March
//   were written against March's meaning, and a vocabulary that silently
//   rewrites itself makes every older record subtly unreadable.
//
//   ANATOMY — it ships empty and stays empty. Every field is a food fact only
//   Kevin can supply. An invented ingredient role would propagate into an
//   accommodation decision, a customer explanation, and a document handed to a
//   child, and each hop makes it harder to catch.
//
//   DERIVATIVES — nothing reaches another audience without explicit approval,
//   and there is NO fallback. Not to the source text, not to another audience.
//   A fallback is how a private note ends up on a public page.

import {
  emptyTerms, normalizeTerms, addTerm, updateTerm, confirmedTerms, termCounts,
  seedTerms, termsMentionedIn, TERM_SEEDS,
} from '../src/terms.js';
import {
  emptyAnatomy, normalizeAnatomy, addAnatomy, updateAnatomy, anatomyFor,
  anatomyForDish, anatomyCoverage, removalConsequence, anatomyCounts, CRITICALITY,
} from '../src/anatomy.js';
import {
  emptyDerivatives, normalizeDerivatives, draftDerivative, approveDerivative,
  revokeDerivative, derivativeFor, derivativesForSource, pendingApproval,
  derivativeCounts, AUDIENCES,
} from '../src/derivatives.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// ── TERMS ───────────────────────────────────────────────────────────────────
{
  const seeded = seedTerms(emptyTerms());
  ok('terms seed as PROPOSALS, never as definitions',
    seeded.terms.length === TERM_SEEDS.length && seeded.terms.every(t => t.status === 'proposed'),
    'these entries are meant to become the authority future handoffs defer to; an unapproved one must not');
  ok('every seed cites where the wording came from',
    seeded.terms.every(t => (t.sources || []).length > 0));
  ok('and confirmedTerms returns none of them', confirmedTerms(seeded).length === 0);

  ok('the terms that have actually been misread carry their misreading',
    ['prospecting', 'bag is the vessel'].every(name => {
      const t = seeded.terms.find(x => x.term === name);
      return t && t.misreadings.length > 0;
    }),
    'a definition alone does not stop the specific wrong reading that keeps happening');

  // The property.
  let s = updateTerm(seeded, 'tm_seed_prospecting', { status: 'confirmed', definition: 'First meaning' });
  s = updateTerm(s, 'tm_seed_prospecting', { definition: 'Second meaning' });
  const t = normalizeTerms(s).terms.find(x => x.id === 'tm_seed_prospecting');
  ok('changing a definition keeps the old one with an end date',
    t.definition === 'Second meaning' && t.history.length >= 1
    && t.history[0].definition === 'First meaning' && !!t.history[0].supersededAt,
    'a decision made in March was made against March\'s meaning of the word');
  ok('editing another field does NOT push history',
    updateTerm(s, 'tm_seed_prospecting', { examples: ['x'] }).terms
      .find(x => x.id === 'tm_seed_prospecting').history.length === t.history.length,
    'only the definition is what other records were written against');

  const reworded = updateTerm(seeded, 'tm_seed_wow_path', { term: 'wow path', definition: 'Mine' });
  ok('re-seeding never restores a draft beside a term Kevin reworded',
    seedTerms(reworded).terms.filter(x => x.term === 'wow path').length === 1);

  const confirmed = updateTerm(seeded, 'tm_seed_bag_is_vessel', { status: 'confirmed' });
  ok('a mention in free text finds the term',
    termsMentionedIn(confirmed, 'the polenta is bag is the vessel so do not open it').length === 1);
  ok('but only confirmed terms are matched',
    termsMentionedIn(seeded, 'bag is the vessel').length === 0,
    'a proposal must not start annotating other records as though it were canon');

  ok('a malformed store normalizes to empty',
    normalizeTerms({ terms: 'no' }).terms.length === 0 && normalizeTerms(null).terms.length === 0);
  ok('counts add up', termCounts(seeded).proposed === TERM_SEEDS.length);
}

// ── ANATOMY ─────────────────────────────────────────────────────────────────
{
  ok('anatomy ships EMPTY and has no seeds',
    emptyAnatomy().entries.length === 0,
    'every field is a food fact; an invented ingredient role propagates into accommodations and customer copy');
  ok('an unrecorded ingredient resolves to null',
    anatomyFor(emptyAnatomy(), 'bolognese', 'milk') === null);

  // The question that matters most, asked of an empty store.
  ok('removal consequence of an unrecorded ingredient is UNKNOWN, not "safe"',
    removalConsequence(emptyAnatomy(), 'bolognese', 'milk') === null,
    'null must never be read as permission; that is the whole failure mode of a dietary filter');

  let s = addAnatomy(emptyAnatomy(), {
    dishId: 'bolognese', ingredientId: 'milk',
    roles: ['breaks the meat down to a fine texture', 'moderates acidity'],
    criticality: 'technique',
    ifOmitted: 'The meat stays in pellets and the acidity is exposed.',
    status: 'confirmed',
  });
  const c = removalConsequence(s, 'bolognese', 'milk');
  ok('a technique-critical ingredient is NOT removable on request',
    c && c.criticality === 'technique' && c.removableOnRequest === false,
    'this is exactly the case where a note in a box must not silently change the food');

  const garnish = addAnatomy(s, {
    dishId: 'bolognese', ingredientId: 'parsley', criticality: 'garnish', status: 'confirmed',
  });
  ok('only a garnish is removable without a decision',
    removalConsequence(garnish, 'bolognese', 'parsley').removableOnRequest === true);

  const silent = addAnatomy(emptyAnatomy(), {
    dishId: 'x', ingredientId: 'y', criticality: 'structural', status: 'confirmed',
  });
  ok('an entry with no ifOmitted text still routes to Kevin',
    removalConsequence(silent, 'x', 'y').removableOnRequest === false,
    'silence about the consequence is not evidence that there is not one');

  ok('a PROPOSED entry never answers',
    anatomyFor(addAnatomy(emptyAnatomy(), {
      dishId: 'a', ingredientId: 'b', criticality: 'garnish', status: 'proposed',
    }), 'a', 'b') === null);

  // Version scope.
  let v = addAnatomy(emptyAnatomy(), {
    dishId: 'd', ingredientId: 'i', criticality: 'technique', status: 'confirmed',
    recipeVersionIds: ['d@v5'],
  });
  ok('a scoped entry answers for its version', !!anatomyFor(v, 'd', 'i', 'd@v5'));
  ok('and does NOT answer for another one',
    anatomyFor(v, 'd', 'i', 'd@v7') === null,
    'a note written against v5 must not silently describe v7');
  const unscoped = addAnatomy(emptyAnatomy(), {
    dishId: 'd', ingredientId: 'i', criticality: 'technique', status: 'confirmed',
  });
  ok('an unscoped entry answers for every version',
    !!anatomyFor(unscoped, 'd', 'i', 'anything'));

  const cov = anatomyCoverage(s, 'bolognese', ['milk', 'beef', 'wine']);
  ok('coverage names what has NOT been explained',
    cov.missing.length === 2 && cov.missing.includes('beef'),
    'an unexplained line looks identical to one needing no explanation unless something says so');

  ok('an entry without a dish or ingredient is refused',
    addAnatomy(emptyAnatomy(), { roles: ['x'] }).entries.length === 0);
  ok('an unknown criticality is dropped rather than stored',
    normalizeAnatomy({ entries: [{ id: 'a', dishId: 'd', ingredientId: 'i', criticality: 'vital' }] })
      .entries[0].criticality === null,
    'a made-up level would be compared against the real ones and lose silently');
  ok('every criticality level has a distinct meaning', new Set(CRITICALITY).size === CRITICALITY.length);
  ok('counts add up', anatomyCounts(s).confirmed === 1);
}

// ── DERIVATIVES ─────────────────────────────────────────────────────────────
{
  const SRC = 'anatomy:milk:bolognese@v5';
  let s = draftDerivative(emptyDerivatives(), {
    sourceRecordId: SRC, audience: 'customer',
    text: 'It contributes richness and supports the intended texture.',
  });
  ok('a draft is stored', normalizeDerivatives(s).derivatives.length === 1);
  ok('but a DRAFT is not readable by any surface',
    derivativeFor(s, SRC, 'customer') === null,
    'writing a customer sentence and deciding it may be shown are different acts');
  ok('and it shows up as pending', pendingApproval(s).length === 1);

  const id = normalizeDerivatives(s).derivatives[0].id;
  s = approveDerivative(s, id);
  ok('an approved derivative is readable', !!derivativeFor(s, SRC, 'customer'));

  ok('there is NO fallback to another audience',
    derivativeFor(s, SRC, 'rowanYounger') === null,
    'a child does not get the customer text because no child text exists');
  ok('and no fallback to the source record',
    derivativeFor(s, 'some:other:record', 'customer') === null,
    'the absence of a derivative means the source is private, not "use the original for now"');

  // The property that protects an approval from becoming a blanket one.
  s = draftDerivative(s, { sourceRecordId: SRC, audience: 'customer', text: 'Different words entirely.' });
  ok('editing an approved derivative UN-approves it',
    derivativeFor(s, SRC, 'customer') === null,
    'the approval was of particular words; different words have not been approved');

  s = approveDerivative(s, id);
  s = revokeDerivative(s, id);
  ok('revoking stops it being projected', derivativeFor(s, SRC, 'customer') === null);
  ok('and the record is kept rather than deleted',
    normalizeDerivatives(s).derivatives.length === 1);

  // Coexistence, not hierarchy.
  let multi = draftDerivative(emptyDerivatives(), { sourceRecordId: SRC, audience: 'customer', text: 'A' });
  multi = draftDerivative(multi, { sourceRecordId: SRC, audience: 'rowanYounger', text: 'B' });
  ok('audiences coexist against one source rather than replacing each other',
    derivativesForSource(multi, SRC).length === 2);

  ok('an unknown audience is refused, not stored',
    normalizeDerivatives({ derivatives: [{ id: 'x', sourceRecordId: 'y', audience: 'public', text: 'z' }] })
      .derivatives.length === 0,
    'an audience nobody declared is a reader we do not know how to protect');
  ok('every declared audience has a label', AUDIENCES.length >= 4);
  ok('an empty text is not drafted',
    draftDerivative(emptyDerivatives(), { sourceRecordId: 'a', audience: 'customer', text: '  ' })
      .derivatives.length === 0);
  ok('counts add up', derivativeCounts(multi).drafts === 2);
}

// ── THE ROWAN ADAPTER READ THE WRONG FIELDS ─────────────────────────────────
//
// `fromRowan()` read `e.ts`, `e.notes`, and `e.familyNotes`. `makeEntry()`
// writes `at`, `note`, and `familyNote`. The ordinary note survived by accident,
// because `e.note` happened to be last in the fallback chain — so the adapter
// looked like it worked while EVERY tasting date and EVERY family note was
// missing from owner search.
//
// That is worse than having no adapter: an empty result reads as "he never said
// anything about that" rather than "this was never indexed".
//
// ASSERTED AGAINST makeEntry(), never a hand-typed literal. A literal would have
// passed against the broken reader, since I would have typed the field names
// the reader expected.
{
  const { makeEntry } = await import('../src/rowan.js');
  const { buildCorpus, searchCorpus } = await import('../src/corpus.js');

  const entry = makeEntry({
    dish: 'Chili', rating: 5,
    note: 'he asked for seconds',
    familyNote: 'the whole table went quiet',
    at: '2026-07-01T12:00:00Z',
  });
  // THE ARRAY SHAPE IS THE REAL ONE. App.jsx holds `rowanLog` as `useState([])`
  // and passes it straight in, so this is what production actually calls with.
  // The adapter read `log.entries`, which is undefined on an array — so it
  // returned NOTHING and no tasting entry has ever been in owner search. The
  // wrong field names were never even reached.
  const rec = buildCorpus({ rowanLog: [entry] }).find(r => r.kind === 'rowan');
  ok('the ARRAY shape App.jsx actually passes is indexed', !!rec,
    'testing only { entries: [...] } is how this survived');
  ok('and the { entries } shape still works, for backup payloads',
    !!buildCorpus({ rowanLog: { entries: [entry] } }).find(r => r.kind === 'rowan'));
  ok('a missing log is not an error',
    buildCorpus({}).filter(r => r.kind === 'rowan').length === 0);

  ok('the tasting record reaches the corpus', !!rec);
  ok('the DATE survives', rec.date === entry.at,
    'it was read from `ts`, which nothing has ever written');
  ok('the note survives', /seconds/.test(rec.text));
  ok('the FAMILY note survives', /table went quiet/.test(rec.text),
    'read from `familyNotes`; the field is `familyNote`');

  // Searchable, which is the point of the adapter existing.
  ok('and all three are findable by search',
    searchCorpus([rec], 'quiet').length === 1 && searchCorpus([rec], 'seconds').length === 1);

  // No dead fallbacks: the old names never existed in stored data.
  const src = (await import('node:fs')).readFileSync(new URL('../src/corpus.js', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  // SCOPED TO fromRowan. The file-wide version of this failed on the journal
  // and practices adapters, which read `e.ts` correctly because journal.js
  // genuinely writes `ts`. The bug was never "ts is wrong" — it was that the
  // ROWAN store does not use it.
  const fn = (code.match(/function fromRowan[\s\S]*?\n\}/) || [''])[0];
  ok('the Rowan adapter keeps no fallback to names nothing ever wrote',
    fn.length > 0 && !/e\.ts\b|e\.notes\b|e\.familyNotes\b/.test(fn),
    'reading them "just in case" would preserve a fiction');
  ok('and it reads the three fields makeEntry writes',
    /e\.at\b/.test(fn) && /e\.note\b/.test(fn) && /e\.familyNote\b/.test(fn));
}

console.log(failed === 0 ? '\nKNOWLEDGE CORE: ALL PASS' : `\nKNOWLEDGE CORE: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
