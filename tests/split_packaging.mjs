// tests/split_packaging.mjs — the packaging option must fail closed, and the
// walks must actually have something to walk.
//
// THE PROPERTY: NOTHING IS ELIGIBLE UNTIL KEVIN SAYS SO.
//
// `SPLIT_PACKAGING` ships empty. Every eligibility question therefore answers
// false, and every customer surface that asks gets nothing to render. That is
// not an unfinished state to be filled in by a default — it is the safe one.
// The failure mode of getting this wrong is a customer ordering a split pack
// that Kevin cannot physically pack on Tuesday, which is worse than the option
// never appearing.
//
// The reheat walk already knows the FOOD half (which components divide). It
// knows nothing about whether the containers exist or whether packing two is
// worth the minutes, and those are half the question. So the derived list is a
// WORKLIST for the walk, never an answer.

import {
  SPLIT_PACKAGING, PACK_SHAPES, isSplitEligible, splitEntryFor, containersForPack,
  surchargeCentsFor, normalizePackShape, splitCandidates, splitPackagingStatus,
  isLargeVariant, splitFeeFor, SPLIT_FEE_REVIEW_THRESHOLD,
} from '../src/splitPackaging.js';
import {
  WALKS, splitPackagingWalk, freezeVerificationWalk, pipelineTriageWalk,
  emptyWalkAnswers, normalizeWalkAnswers, recordWalkAnswer, walkProgress,
} from '../src/walks.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// ── Fail closed ─────────────────────────────────────────────────────────────
{
  ok('SPLIT_PACKAGING ships empty',
    Object.keys(SPLIT_PACKAGING).length === 0,
    'a dish nobody has thought about must never surface a packaging option');

  ok('nothing is eligible today',
    !isSplitEligible('bo-ssam', 'Large (~8 servings)')
    && !isSplitEligible('chili', 'Large')
    && !isSplitEligible('anything', 'anything'));

  ok('an ineligible dish resolves no containers',
    containersForPack('chili', 'Large', 'twoNight') === null,
    'null makes the caller fall back to the ordinary container map instead of inventing one');

  ok('and no surcharge',
    surchargeCentsFor('chili', 'Large', 'twoNight') === 0);

  ok('splitEntryFor returns null rather than throwing on an unknown dish',
    splitEntryFor('nope', 'nope') === null);
}

// ── The shape normalizes toward the safe default ────────────────────────────
{
  ok('an unknown pack shape becomes family, never the split',
    normalizePackShape('twoNightPlus') === 'family'
    && normalizePackShape(undefined) === 'family'
    && normalizePackShape(null) === 'family',
    'an order carrying a shape Kevin cannot pack is worse than one carrying the default');
  ok('a real shape survives',
    normalizePackShape('twoNight') === 'twoNight' && normalizePackShape('family') === 'family');
  ok('there are exactly two shapes', PACK_SHAPES.length === 2);
}

// ── The eligibility map, once declared, drives everything ───────────────────
// Proven against a local fixture rather than by declaring a real dish, so this
// test cannot be the thing that accidentally turns the feature on.
{
  // SMALL, not Large. Kevin removed Large from the feature on Aug 2 — a Large
  // already ships as 2x of everything including the bags, so it is split by
  // construction and doubling again would make quarters. The old fixture used
  // /large/i and is exactly what the new rule is designed to refuse.
  const fixture = {
    'test-dish': {
      byVariant: [
        { match: /small/i, family: { round48: 1 }, twoNight: { round32: 2 }, surchargeCents: 300 },
      ],
    },
  };
  // Exercise the same resolution logic by temporarily populating the canon.
  Object.assign(SPLIT_PACKAGING, fixture);
  try {
    ok('a declared SMALL becomes eligible', isSplitEligible('test-dish', 'Small (~4)'));
    ok('a Large is refused even when the config declares one',
      !isSplitEligible('test-dish', 'Large (~8)'),
      'the rule is checked BEFORE the config, so a stray Large entry still cannot reach a customer');
    ok('the family map resolves',
      JSON.stringify(containersForPack('test-dish', 'Small (~4)', 'family')) === '{"round48":1}');
    ok('the two-night map is STATED, not derived by doubling',
      JSON.stringify(containersForPack('test-dish', 'Small (~4)', 'twoNight')) === '{"round32":2}',
      'the rice rule already proved scaling can change the container TYPE, not just the count');
    ok('the surcharge applies only to the split',
      surchargeCentsFor('test-dish', 'Small (~4)', 'twoNight') === 300
      && surchargeCentsFor('test-dish', 'Small (~4)', 'family') === 0);
  } finally {
    delete SPLIT_PACKAGING['test-dish'];
  }
  ok('the fixture is cleaned up and nothing stays eligible',
    Object.keys(SPLIT_PACKAGING).length === 0 && !isSplitEligible('test-dish', 'Small (~4)'));
}

// ── The worklist knows food and admits it knows nothing else ────────────────
{
  const cands = splitCandidates();
  ok('the worklist is derived from the reheat walk', cands.length > 0);
  ok('single-component dishes are excluded',
    cands.every(c => c.components >= 2),
    'one component cannot be divided into two packs');
  ok('a dish with a bag-is-vessel or not-recommended component is FLAGGED, not hidden',
    cands.some(c => c.blockers.length > 0 && c.looksSplittable === false),
    'Kevin may know a way round a blocker that the walk answer did not capture');
  ok('every blocker names its component and reason',
    cands.every(c => c.blockers.every(b => b.key && b.mode)));
  ok('clean candidates sort first', cands[0].looksSplittable === true);

  const status = splitPackagingStatus();
  ok('status reports nothing declared yet',
    status.declared === 0 && status.complete === false && status.candidates > 0,
    'the shortlist existing is not the same as the feature being live');
}

// ── The walks have something to walk ────────────────────────────────────────
{
  const sw = splitPackagingWalk();
  ok('the split walk has items', sw.items.length > 0);
  ok('and asks the one question rules cannot answer: which bags stay sealed',
    sw.fields().some(f => f.key === 'containers') && sw.fields().some(f => f.key === 'sealedBags'),
    'container-only is free BY RULE now, so the walk no longer asks about surcharges dish by dish');
  ok('the split walk does NOT prefill a food judgement',
    sw.prefill === null,
    'Claude guessed twelve cut-gates and got eleven wrong; prefill is for recorded values only');

  const fw = freezeVerificationWalk();
  ok('the freeze walk only lists UNTESTED verdicts',
    fw.items.every(i => i.verdict && i.verdict !== 'na'));
  ok('and it prefills from the recorded verdict, which is not a guess',
    typeof fw.prefill === 'function');

  const pw = pipelineTriageWalk();
  ok('pipeline triage walks only dishes still in testing', pw.items.length > 0);
  ok('and its cut-gate options say what COOK actually means',
    JSON.stringify(pw.fields()).includes('not right for LTB'),
    'Kevin corrected that meaning twice; the label has to carry it');

  ok('every registered walk builds without throwing',
    WALKS.every(w => {
      const built = w.build({ ingredients: [] });
      return built && Array.isArray(built.items) && typeof built.itemKey === 'function';
    }));
}

// ── Answers save per item, because there is no submit ───────────────────────
{
  let a = emptyWalkAnswers();
  a = recordWalkAnswer(a, 'split-packaging', 'chili', { offer: 'yes' });
  a = recordWalkAnswer(a, 'split-packaging', 'gumbo', { offer: 'no' });
  ok('answers store per walk and per item',
    a.walks['split-packaging'].chili.offer === 'yes' && a.walks['split-packaging'].gumbo.offer === 'no');
  a = recordWalkAnswer(a, 'split-packaging', 'chili', { offer: 'maybe later' });
  ok('re-answering replaces rather than duplicating',
    a.walks['split-packaging'].chili.offer === 'maybe later');

  const prog = walkProgress(a, 'split-packaging', 10);
  ok('progress counts only genuinely answered items',
    prog.answered === 2 && prog.total === 10 && prog.done === false);
  ok('an empty answer object does not count as answered',
    walkProgress(recordWalkAnswer(emptyWalkAnswers(), 'w', 'i', { offer: '' }), 'w', 1).answered === 0,
    'stepping past an item is not the same as answering it');

  ok('a malformed store normalizes to empty',
    normalizeWalkAnswers({ walks: 'no' }).walks && Object.keys(normalizeWalkAnswers(null).walks).length === 0);
}

// ── The fee schedule, and the safeguard row ─────────────────────────────────
{
  ok('a Large is recognised regardless of how the label is written',
    isLargeVariant('Large (~8)') && isLargeVariant('Pulled Pork, Large (~9-10)')
    && !isLargeVariant('Small (~4)'));

  ok('container-only splits are free', splitFeeFor(0).cents === 0);
  ok('one extra sealed bag is +$3', splitFeeFor(1).cents === 300);
  ok('two is +$5', splitFeeFor(2).cents === 500);

  const three = splitFeeFor(3);
  ok('three is +$6 AND flagged for review',
    three.cents === 600 && three.needsReview === true,
    'Kevin does not believe any dish needs three; the row exists so nothing breaks, '
    + 'and anything reaching it must be surfaced to him rather than quietly billed');
  ok('and there is no fourth tier invented above it',
    splitFeeFor(9).cents === 600 && splitFeeFor(9).needsReview === true,
    'extrapolating a price he never set is the failure this guards');
  ok('the review threshold is stated, not buried in a literal',
    SPLIT_FEE_REVIEW_THRESHOLD === 3);
}

console.log(failed === 0 ? '\nSPLIT PACKAGING + WALKS: ALL PASS' : `\nSPLIT PACKAGING + WALKS: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
