// freezerLens.js — filter the menu by how a dish behaves in a freezer.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTED UNBUILT FOR SO LONG
//
// It was deferred for months with no reason ever recorded. The answer, from
// Kevin on Aug 1: he thought it was waiting on the freeze walk. That walk has
// since happened. It was never blocked on a decision, only on a belief about
// a dependency — which is worth writing down, because a thing deferred with no
// reason attached looks identical to a thing deferred for a good one.
//
// It needs NO new data. Per-component freeze verdicts already exist for all 26
// dinners. This is a view over data the app already has.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT IT IS, AND WHAT IT IS NOT
//
// IS: a customer-facing filter over the menu, so somebody stocking a freezer
// orders differently from somebody eating on Tuesday.
//
// IS NOT, and Kevin killed this explicitly: a running picture of what is in the
// customer's freezer across weeks. That needs bookkeeping customers will not do,
// and a freezer list that is quietly wrong is worse than no list at all.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE LENS IS A SHOPPING AID. IT IS NOT WHERE THE KNOWLEDGE LIVES.
//
// That division is deliberate and load-bearing. The actual instruction — pull
// the potatoes out before freezing — lives on the reheat page under
// Eat-First / Freeze-First, which a customer sees after they have ordered, at
// the moment it matters. So a customer who never opens this lens loses nothing.
//
// It is also why the boxes only render when a filter is ON. Kevin's words: "I am
// not trying to overwhelm clients, just give options if they want it." Do not
// make them always-on, and do not let a later change quietly do it.

import { REHEAT_DATA } from './reheatData.js';

// ADDITIVE, NOT EXCLUSIVE. Not radio buttons: somebody filling a freezer wants
// clean and caveat on together with red off; somebody planning the week wants
// only red. Any combination is meaningful.
export const LENS_STATES = ['clean', 'caveat', 'minimal'];

export const LENS_LABELS = {
  clean: 'Freezes well',
  caveat: 'Freezes, with a step',
  minimal: 'Mostly does not freeze',
};

// Verdicts that count as "this component is fine".
//
// `na` COUNTS AS CLEAN and that is not a fudge: it means the component ships
// uncooked and never goes in a freezer at all, like rice and dry pasta. Kevin's
// own wording for the clean state is "all components freeze well OR store as dry
// goods". A dish is not disqualified for containing rice.
const FINE = new Set(['excellent', 'well', 'keeps', 'na']);

// Not fine, but not a failure either: works, without being a reason to freeze it.
const SOFT = new Set(['acceptable']);

export function classifyDish(dishId, reheatData = REHEAT_DATA) {
  const d = (reheatData || {})[dishId];
  const comps = (d && d.components) || [];
  if (!comps.length) return null; // no data is not a verdict

  const graded = comps.filter(c => c.freeze && c.freeze.verdict);
  if (!graded.length) return null;

  const bad = graded.filter(c => c.freeze.verdict === 'no');
  const soft = graded.filter(c => SOFT.has(c.freeze.verdict));
  const fine = graded.filter(c => FINE.has(c.freeze.verdict));
  // `na` COUNTS AS CLEAN BUT IS NOT EVIDENCE THE DISH FREEZES, and holding both
  // at once is the point. It means the component ships uncooked and never goes
  // near a freezer — dry rice, dry pasta. So a dish of all-good components plus
  // rice is still CLEAN, but a bagged dish whose ONLY other component is dry
  // rice must not read as "half of this freezes".
  //
  // Thai Basil and the black bean dish are the cases: bag `no`, rice `na`.
  // Counting the rice as freezeable made them a tie and put them in CAVEAT,
  // which told a customer to take the bag out of a dish that is nothing but the
  // bag. Excluded from the majority test, they land in MINIMAL, which is true.
  const realFine = fine.filter(c => c.freeze.verdict !== 'na');

  // MINIMAL — the state that exists because CAVEAT would describe these dishes
  // BACKWARDS. Tex-Mex is the type case: telling a customer "freezes, with a
  // step" when the truth is "do not freeze this, except the tortillas" is not a
  // softer version of the same statement, it is the opposite one.
  //
  // THE TEST IS A STRICT MAJORITY OF NON-FREEZING COMPONENTS, and the boundary
  // is set by Kevin's own three type cases rather than by taste:
  //
  //   Brunswick   1 freezes (the stew), 1 does not (potatoes)  -> CAVEAT
  //   Tex-Mex     2 freeze (rice, tortillas), 3 do not          -> MINIMAL
  //   Au poivre   1 freezes (the steaks), 3 do not              -> MINIMAL
  //
  // A tie stays CAVEAT. Brunswick is exactly a tie and he names it as the
  // caveat type case — the stew IS the dish and the potatoes come out — so an
  // even split is not "mostly does not freeze". The first version used <= here
  // and put Brunswick in MINIMAL, which is the backwards description this state
  // exists to prevent.
  //
  // Counting components is a proxy for "how much of the dish", which is what he
  // actually said. It is imperfect and it is explainable, and it agrees with all
  // three cases he named. A weighting nobody gave would be neither.
  if (bad.length && realFine.length < bad.length) {
    return {
      state: 'minimal',
      // Naming the exception is required, not decorative. "Mostly does not
      // freeze" with nothing after it tells a customer to give up on a dish
      // that has a genuinely freezable part.
      // DRY GOODS ARE NOT AN EXCEPTION WORTH NAMING. `na` means it ships
      // uncooked, so "what does freeze: the rice" told a customer the pantry
      // item in their bag was the salvageable part of dinner. Only components
      // that are actually cooked food count.
      exceptions: realFine.map(c => c.key),
      blockers: bad.map(c => ({ key: c.key, note: (c.freeze.customer || '') })),
      soft: soft.map(c => ({ key: c.key, note: (c.freeze.customer || '') })),
    };
  }

  if (bad.length || soft.length) {
    return {
      state: 'caveat',
      exceptions: [],
      blockers: bad.map(c => ({ key: c.key, note: (c.freeze.customer || '') })),
      soft: soft.map(c => ({ key: c.key, note: (c.freeze.customer || '') })),
    };
  }

  return { state: 'clean', exceptions: [], blockers: [], soft: [] };
}

// ── The box copy ────────────────────────────────────────────────────────────
//
// THE YELLOW BOX HAS TWO SHAPES, SAME COLOUR. Kevin's ruling, and he delegated
// the wording. Components recorded as works-but-not-exceptional (long beans,
// gai lan) fall out of CLEAN by definition and land in CAVEAT alongside dishes
// that need a real step. Rather than add a fourth filter for them, the box
// changes shape by content.
//
// WHY THIS MATTERS RATHER THAN BEING A NICETY: a customer who reads "needs
// attention before freezing", follows it, and discovers it meant the gai lan
// goes slightly soft will stop reading yellow boxes. The box has to keep its
// credibility for Brunswick, where ignoring it produces a bad dinner.
//
// Three toggles is the ceiling for something a customer glances at. The
// distinction belongs inside the box, not in the filter row.
export function lensBox(classification) {
  if (!classification) return null;
  const { state, blockers, soft, exceptions } = classification;

  if (state === 'clean') {
    return { tone: 'clean', lead: 'Freezes well.', detail: '' };
  }

  if (state === 'minimal') {
    // Phrased to avoid verb agreement with a component key. "The steaks does"
    // is what the obvious version produced; guessing plurality from a data key
    // is not a problem worth solving, so the sentence sidesteps it.
    const keep = exceptions.length
      ? ` What does freeze: the ${joinWords(exceptions)}.`
      : '';
    // Kevin's own sentence leads here too where there is one. It says WHY the
    // dish is in this state and usually adds that there is no hurry, which the
    // generic line cannot: "best eaten fresh" alone reads as a warning when the
    // truth is often just "eat it this week, it keeps perfectly well".
    const why = blockers.map(b => b.note).find(Boolean);
    return {
      tone: 'minimal',
      lead: why || 'Best eaten fresh — most of this does not freeze.',
      detail: keep.trim(),
    };
  }

  // CAVEAT, both shapes. An action leads when there is one; quality follows.
  //
  // READS THE CUSTOMER FIELD, NEVER THE INTERNAL ONE. THE NOTES ARE INTERNAL.
  //
  // This shipped wrong and it is worth being precise about why. The notes are
  // Kevin's own words, so printing them looked like the honest choice — but they
  // are notes TO the person building this, not copy for a customer. They carry
  // cross-references ("the Brunswick potato treatment", "same as the long
  // beans"), his name in the third person, and reasoning about variants. A
  // customer reading the Leblanc carrots was told about a potato treatment on a
  // different dish entirely.
  //
  // Resolving those pointers was the job all along: the treatment being pointed
  // AT is recorded in this same data, so carrying the logic across is reading
  // the record rather than inventing anything. `freeze.customer` holds the
  // resolved sentence; the internal field stays as the kitchen's own record.
  //
  // Two further reasons the built-sentence fallback still matters:
  //
  //   1. It is already in his voice, and it is better writing than a template.
  //      Brunswick's note does not just say to pull the potatoes; it says what
  //      to do instead, and that the result is "not as good, but good".
  //   2. COMPONENT KEYS ARE NOT NOUNS A CUSTOMER RECOGNISES. The long beans and
  //      the shrimp both key their soft component as `bag`, so a generated
  //      sentence reads "the bag comes out a little softer" — which is not what
  //      Kevin meant when he described the gai lan going soft. Building prose
  //      out of a data key produces confident nonsense; using the note he
  //      already wrote does not.
  //
  // The generated fallback stays for components with no note, and it is
  // deliberately vaguer than the note would be, because vaguer is what is
  // honestly known there.
  // THE CUSTOMER SENTENCE STANDS ALONE. It already says what to do, in full, so
  // prefixing the generated lead produced "Before you freeze this, take out the
  // carrots. Take the carrots out and..." — the same instruction twice. The
  // built sentence is a FALLBACK for a component with no customer copy, not a
  // header for one that has it.
  const blockerNote = blockers.map(b => b.note).find(Boolean);
  const action = blockers.length
    ? (blockerNote || `Before you freeze this, take out the ${joinWords(blockers.map(b => b.key))} — better used for something else.`)
    : '';

  const softNote = soft.map(sc => sc.note).find(Boolean);
  const quality = soft.length
    ? (softNote || 'Freezes fine, without being at its best afterward.')
    : '';

  if (action && quality) return { tone: 'caveat', lead: action, detail: quality };
  if (action) return { tone: 'caveat', lead: action, detail: '' };
  return { tone: 'caveat', lead: quality, detail: '' };
}

function joinWords(list) {
  const a = (list || []).filter(Boolean);
  if (a.length <= 1) return a[0] || '';
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`;
}

// Which dishes survive the chosen toggles. An EMPTY selection means no filter is
// on, which returns everything — the menu as it normally reads.
export function filterByLens(dishIds, states, reheatData = REHEAT_DATA) {
  const want = (states || []).filter(x => LENS_STATES.includes(x));
  if (!want.length) return (dishIds || []).slice();
  return (dishIds || []).filter(id => {
    const c = classifyDish(id, reheatData);
    // A dish with no freeze data recorded is not silently hidden or silently
    // shown: it is excluded from a filtered view, because claiming it belongs
    // in any of the three states would be a verdict nobody gave.
    return c ? want.includes(c.state) : false;
  });
}

export function lensCounts(dishIds, reheatData = REHEAT_DATA) {
  const out = { clean: 0, caveat: 0, minimal: 0, unknown: 0 };
  for (const id of dishIds || []) {
    const c = classifyDish(id, reheatData);
    if (!c) out.unknown++;
    else out[c.state]++;
  }
  return out;
}
