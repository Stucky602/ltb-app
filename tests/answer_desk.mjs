// tests/answer_desk.mjs — answering a customer about THEIR order, or not at all.
//
// THE PROPERTY: IT FAILS CLOSED. A wrong answer here reaches somebody deciding
// what to eat, so every path that cannot produce a traceable approved record
// must produce silence and an escalation instead.
//
// The three things that make that real, and each is asserted below:
//   1. Only whitelisted sources are reachable. Nothing answers a customer
//      because it happened to be in the corpus.
//   2. Everything is scoped to the customer's OWN order. A true statement about
//      a different recipe version is a wrong answer here.
//   3. No synthesis. Every answer is a record with an id.

import {
  answerQuestion, resolveContext, escalationSummary, deskCoverage,
  ALLOWED_SOURCES, NO_ANSWER,
} from '../src/answerDesk.js';
import { currentVersionFor } from '../src/recipeVersions.js';
import { cardsNeedingReview } from '../src/ingredientCard.js';
import { readFileSync } from 'node:fs';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

const ORDER = { id: 'o1', createdAt: new Date().toISOString() };
const V = currentVersionFor('bolognese').id;
const ITEM = { name: 'Bolognese', variant: 'Small (~4)', servedRecipeVersionId: V };
const ask = (q, item = ITEM, stores = {}) => answerQuestion(q, { order: ORDER, item, stores });

// ── It answers what it can ──────────────────────────────────────────────────
{
  const ing = ask('what is in it');
  ok('an ingredients question is answered from the card',
    ing.answered && ing.hits.every(h => h.source === 'ingredientCard'));
  ok('and every hit carries a traceable record id',
    ing.hits.every(h => h.recordId),
    'no synthesis: an answer a customer cannot trace is one nobody can check');

  ok('an allergen question routes to the same place',
    ask('is there dairy in this').hits.some(h => h.source === 'ingredientCard'));
  ok('a reheat question answers from the reheat record',
    ask('how do I reheat this').hits.some(h => h.source === 'reheat'));
  ok('a freezer question answers from the lens',
    ask('can I freeze it').hits.some(h => h.source === 'freezer'));
}

// ── It fails closed ─────────────────────────────────────────────────────────
{
  const wine = ask('what wine goes with this');
  ok('a question outside its scope is NOT answered',
    wine.answered === false && wine.text === NO_ANSWER,
    'an unrecognised question must not trigger a search of everything on the off chance');
  ok('and it produces an escalation rather than nothing',
    !!wine.escalation && wine.escalation.question === 'what wine goes with this');
  ok('the escalation says it matched no known shape',
    wine.escalation.searched.length === 0);

  const unknownDish = ask('what is in it', { name: 'A Dish That Does Not Exist' });
  ok('an unresolvable dish is not answered',
    unknownDish.answered === false,
    'inventing an ingredient list for a name nobody recognises is the worst possible failure');
}

// ── A WITHHELD CARD STAYS WITHHELD ──────────────────────────────────────────
{
  const blend = cardsNeedingReview({})[0];
  ok('there are cards withheld pending a spice-blend answer',
    !!blend, 'if this is empty, Walk 1 finished and the assertion below is moot');

  if (blend) {
    const r = ask('what is in it', { name: blend.dishName, variant: 'Small' });
    ok('a dish with an unresolved blend gives NO ingredient answer',
      !r.hits.some(h => h.source === 'ingredientCard'),
      'a partial ingredient list read as complete is the worst answer on an allergen question');
    ok('and the escalation says WHY, so it is not read as a gap in what Kevin wrote',
      r.escalation === null || r.escalation.unresolvedCard === true,
      'a withheld card and an unwritten answer need different responses from him');
  }
}

// ── It is scoped to the customer's own order ────────────────────────────────
{
  const ctx = resolveContext(ORDER, ITEM);
  ok('the context carries the exact version served',
    ctx.recipeVersionId === V && ctx.versionIsExact === true);

  const noVersion = ask('what is in it', { name: 'Bolognese', variant: 'Small (~4)' });
  ok('an unstamped item still answers BUT says the version is unrecorded',
    noVersion.answered && /not recorded|stands now/i.test(noVersion.text),
    'answering from the current recipe without saying so is what the version stamping existed to prevent');

  const inherited = ask('what is in it', {
    name: 'Bolognese', variant: 'Small (~4)', servedRecipeVersionId: V, versionInherited: true,
  });
  ok('an inherited version is flagged in the answer itself',
    /rather than on this dish/i.test(inherited.text),
    'the marker from the v5 migration has to reach the customer-facing sentence');

  ok('packaging is part of the context',
    resolveContext(ORDER, { ...ITEM, packShape: 'twoNight' }).packShape === 'twoNight');
}

// ── The whitelist is the whitelist ──────────────────────────────────────────
{
  const src = readFileSync(new URL('../src/answerDesk.js', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  ok('nothing reads the private journal, practices, or anatomy',
    !/journal\.js|practices\.js|clarifications\.js|rowanQuestions\.js|notesForRowan\.js/.test(code),
    'those are behind the privacy wall and must never be reachable from a customer answer');

  ok('the corpus search is not used here',
    !/corpus\.js/.test(code),
    'the corpus spans every private store; this layer has a whitelist for a reason');

  const cov = deskCoverage();
  ok('the desk reports its own coverage honestly',
    cov.live === 6 && cov.empty.length === 3,
    JSON.stringify(cov));
  ok('and the empty three are the ones awaiting content, not code',
    cov.empty.includes('explanation') && cov.empty.includes('accommodation')
      && cov.empty.includes('priorAnswer'));
  ok('every allowed source has a customer-readable label',
    ALLOWED_SOURCES.every(s => s.id && s.label));
}

// ── The escalation is actionable ────────────────────────────────────────────
{
  const e = ask('what wine goes with this').escalation;
  const text = escalationSummary(e);
  ok('the packet names the dish, version, and packaging',
    /Bolognese/.test(text) && /Version:/.test(text) && /Packaging:/.test(text),
    'the question alone is not actionable; re-deriving the context is work the desk already did');
  ok('an empty escalation summarises to nothing rather than throwing',
    escalationSummary(null) === '');
}

// ── THE BAKED CONTRACT WITH THE WORKER ──────────────────────────────────────
//
// The worker cannot run any of this — no registry, no reheat data, no cards —
// so answers are precomputed when Kevin bakes a page and shipped with it. The
// PATTERNS travel too, as strings, so the matcher exists once rather than being
// copied into worker.js where the two could drift.
{
  const { bakeDeskAnswers, matchBakedAnswer } = await import('../src/answerDesk.js');
  const fs = await import('node:fs');

  const order = { id: 'o1', createdAt: new Date().toISOString(), items: [ITEM] };
  const baked = bakeDeskAnswers(order, {});
  ok('an order bakes an answer per intent it can serve', baked.length >= 4);
  ok('each carries its dish, its pattern, and traceable record ids',
    baked.every(b => b.dish && b.pattern && Array.isArray(b.recordIds) && b.recordIds.length));
  ok('and the text is already scoped to that order\'s version',
    baked.every(b => typeof b.text === 'string' && b.text.length > 0));

  ok('a question matches its baked answer', !!matchBakedAnswer(baked, 'can I freeze this', 1));
  ok('and an unrelated one matches nothing',
    matchBakedAnswer(baked, 'what wine goes with this', 1) === null,
    'the fall-through to the model is what handles these, unchanged');

  // The ambiguity rule.
  const two = [{ dish: 'Chili', pattern: 'freeze', flags: 'i', text: 'a', recordIds: ['x'] },
               { dish: 'Gumbo', pattern: 'freeze', flags: 'i', text: 'b', recordIds: ['y'] }];
  ok('an unnamed question on a MULTI-dish order matches nothing',
    matchBakedAnswer(two, 'can I freeze it', 2) === null,
    'answering about the wrong dish is worse than not answering');
  ok('but naming the dish resolves it',
    (matchBakedAnswer(two, 'can I freeze the Gumbo', 2) || {}).dish === 'Gumbo');

  const worker = fs.readFileSync(new URL('../worker.js', import.meta.url), 'utf8');
  ok('the worker stores the baked answers',
    worker.includes("'companiondesk:'"));
  ok('and consults them BEFORE the model',
    worker.indexOf("companiondesk:") < worker.indexOf('FOOD PHILOSOPHY'),
    'the whole point is that a recorded answer wins over a generated one');
  ok('a page with no baked answers still reaches the model',
    /if \(bakedRaw\)/.test(worker),
    'an older page must behave exactly as it did before');
}

console.log(failed === 0 ? '\nANSWER DESK: ALL PASS' : `\nANSWER DESK: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
