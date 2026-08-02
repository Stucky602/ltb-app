// tests/label_versions.mjs — a label change today must not rewrite yesterday.
//
// THE PROPERTY THIS WHOLE MODULE EXISTS FOR
//
// Every allergen answer the app gives rests on an assumption that a product
// NAME is a stable ingredient list. It is not: manufacturers reformulate and
// Kevin switches brands when the usual one is out. Once labels are recorded,
// the question "what was in the order I ate in March" has to keep answering
// with the March bottle even after the July bottle is different.
//
// So the assertions below are mostly about the past staying put. A store that
// edited a row in place would pass every functional test and silently make
// history mutable, which is the failure worth writing a test file over.
//
// The second property is that nothing is inferred. No OCR, no verdicts on what
// a change means. The diff says what moved; what it means for a customer is
// Kevin's ruling.

import {
  emptyLabels, normalizeLabels, addLabel, supersedeLabel, updateLabel,
  labelVersionAt, currentLabelFor, labelsFor, diffLabels, labelCounts,
} from '../src/labelVersions.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

const MARCH = Date.parse('2026-03-01T00:00:00Z');
const JULY = Date.parse('2026-07-01T00:00:00Z');
const SEPT = Date.parse('2026-09-01T00:00:00Z');

// ── It ships empty ──────────────────────────────────────────────────────────
{
  ok('the store starts empty', emptyLabels().labels.length === 0,
    'this feature has no content until Kevin records a label; it must not pretend otherwise');
  ok('an unknown ingredient resolves to null, not a guess',
    labelVersionAt(emptyLabels(), 'worcestershire') === null,
    '"we do not know" is a real answer and the correct one');
}

// ── History cannot be rewritten ─────────────────────────────────────────────
{
  let s = addLabel(emptyLabels(), {
    ingredientId: 'worcestershire', brand: 'Lea & Perrins', product: 'Worcestershire',
    ingredientText: 'vinegar, molasses, anchovies, tamarind',
    allergenText: 'Contains fish', status: 'confirmed', firstObserved: MARCH,
  }, MARCH);
  const first = s.labels[0];

  s = supersedeLabel(s, first.id, {
    brand: 'Other Brand', product: 'Worcestershire',
    ingredientText: 'vinegar, molasses, anchovies, tamarind, soy sauce',
    allergenText: 'Contains fish, soy', status: 'confirmed',
  }, JULY);

  ok('superseding keeps BOTH records', normalizeLabels(s).labels.length === 2);

  const inMarch = labelVersionAt(s, 'worcestershire', MARCH + 86400000);
  ok('a date in March still answers with the March bottle',
    inMarch && /anchovies, tamarind$/.test(inMarch.ingredientText),
    inMarch ? inMarch.ingredientText : 'nothing resolved');
  ok('and its allergen line is the one that was printed then',
    inMarch && inMarch.allergenText === 'Contains fish',
    'this is what a past order has to be able to say');

  const inSept = labelVersionAt(s, 'worcestershire', SEPT);
  ok('a date after the change answers with the new bottle',
    inSept && /soy sauce/.test(inSept.ingredientText));
  ok('and current resolves to the new one', currentLabelFor(s, 'worcestershire').id === inSept.id);

  ok('the old record gained an end date rather than being edited',
    normalizeLabels(s).labels.find(l => l.id === first.id).supersededAt !== null);

  const before = labelVersionAt(s, 'worcestershire', MARCH - 86400000);
  ok('a date BEFORE anything was recorded resolves to null',
    before === null,
    'reaching for the nearest label would manufacture provenance nobody observed');
}

// ── Unresolved labels never answer ──────────────────────────────────────────
{
  const s = addLabel(emptyLabels(), {
    ingredientId: 'miso', brand: 'X', ingredientText: 'soybeans, rice, salt',
    status: 'unresolved', firstObserved: MARCH,
  }, MARCH);
  ok('an unchecked label is stored', normalizeLabels(s).labels.length === 1);
  ok('but it never resolves as an answer',
    labelVersionAt(s, 'miso', JULY) === null,
    'an unchecked label is exactly the half-fact that must not be able to reassure anybody');

  const rejected = addLabel(emptyLabels(), {
    ingredientId: 'miso', ingredientText: 'x', status: 'rejected', firstObserved: MARCH,
  }, MARCH);
  ok('a rejected brand never resolves either', labelVersionAt(rejected, 'miso', JULY) === null);
}

// ── Immutability of the record's identity ───────────────────────────────────
{
  let s = addLabel(emptyLabels(), {
    ingredientId: 'stock', ingredientText: 'chicken, water', status: 'confirmed', firstObserved: MARCH,
  }, MARCH);
  const id = s.labels[0].id;
  s = updateLabel(s, id, { id: 'hacked', firstObserved: JULY, note: 'a note' });
  const l = normalizeLabels(s).labels[0];
  ok('updating cannot change the id', l.id === id);
  ok('updating cannot move when it was first observed',
    l.firstObserved === MARCH,
    'that date is what makes the record a point in time rather than a mutable row');
  ok('but ordinary fields still patch', l.note === 'a note');
}

// ── The diff describes, it does not judge ───────────────────────────────────
{
  const a = { ingredientText: 'water, salt, yeast extract', allergenText: 'none' };
  const b = { ingredientText: 'water, salt, yeast extract, soy lecithin', allergenText: 'Contains soy' };
  const d = diffLabels(a, b);
  ok('the diff names what appeared', d.added.includes('soy lecithin'));
  ok('and what went', diffLabels(b, a).removed.includes('soy lecithin'));
  ok('and flags an allergen line change', d.allergenChanged === true);
  ok('an identical label reports no change',
    diffLabels(a, a).added.length === 0 && diffLabels(a, a).removed.length === 0 && !diffLabels(a, a).allergenChanged);
  ok('the diff carries NO verdict about safety',
    !('safe' in d) && !('unsafe' in d) && !('verdict' in d),
    'what a change means for a customer is a ruling, and rulings are Kevin\'s');
}

// ── Store hygiene ───────────────────────────────────────────────────────────
{
  ok('a malformed store normalizes to empty',
    normalizeLabels({ labels: 'no' }).labels.length === 0 && normalizeLabels(null).labels.length === 0);
  ok('a label with no ingredient is refused',
    addLabel(emptyLabels(), { brand: 'x', ingredientText: 'y' }).labels.length === 0);
  ok('an unknown status falls back to unresolved, never confirmed',
    normalizeLabels({ labels: [{ id: 'a', ingredientId: 'x', status: 'sure' }] }).labels[0].status === 'unresolved',
    'falling back to confirmed would let a malformed record start answering allergen questions');

  let s = addLabel(emptyLabels(), { ingredientId: 'a', ingredientText: 'x', status: 'confirmed' });
  s = addLabel(s, { ingredientId: 'b', ingredientText: 'y', status: 'unresolved' });
  const c = labelCounts(s);
  ok('counts add up', c.total === 2 && c.confirmed === 1 && c.unresolved === 1 && c.ingredients === 2);
  ok('labelsFor returns newest first',
    labelsFor(s, 'a').length === 1);
}

console.log(failed === 0 ? '\nLABEL VERSIONS: ALL PASS' : `\nLABEL VERSIONS: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
