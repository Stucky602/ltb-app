// tests/accommodation.mjs — "can you make it without X?"
//
// THE PROPERTY: it fails closed, and UNKNOWN IS NOT NO. An ingredient with no
// recorded anatomy routes to Kevin exactly like a critical one, and says so —
// silence about a consequence is not evidence there is not one.
//
// The second property is that "can it come out" and "can something else do its
// job" stay separate. The anatomy walk proved they cannot be inferred from each
// other: the curry butter is identity-defining AND swappable.

import {
  resolveRequest, answerRequest, recordDecision, priorDecision, requestSummary,
  emptyAccommodations, normalizeAccommodations, accommodationCounts, dishCoverage,
  openRequests, OUTCOMES, OUTCOME_LABELS, ANSWERS,
} from '../src/accommodation.js';
import { emptyAnatomy, addAnatomy } from '../src/anatomy.js';
import { readFileSync } from 'node:fs';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// A small anatomy built from Kevin's actual Aug 2 rulings.
let A = emptyAnatomy();
A = addAnatomy(A, {
  dishId: 'indian-style-curry', ingredientId: 'butter', criticality: 'identity',
  substitutability: 'swappable', substitutions: ['neutral oil'],
  ifOmitted: 'Works for a vegan version, it just will not be as good.', status: 'confirmed',
});
A = addAnatomy(A, { dishId: 'bolognese', ingredientId: 'thyme', criticality: 'garnish', status: 'confirmed' });
A = addAnatomy(A, { dishId: 'bolognese', ingredientId: 'milk', criticality: 'technique',
  ifOmitted: 'The meat stays in pellets and the acid is exposed.', status: 'confirmed' });
A = addAnatomy(A, { dishId: 'bolognese', ingredientId: 'egg_pappardelle',
  criticality: 'structural', upgrade: true, status: 'confirmed' });
A = addAnatomy(A, { dishId: 'indian-style-curry', ingredientId: 'stock',
  criticality: 'structural', substitutability: 'linked', linkedTo: 'protein', status: 'confirmed' });

// ── The three outcomes ──────────────────────────────────────────────────────
{
  const g = resolveRequest({ anatomy: A, dishId: 'bolognese', ingredientId: 'thyme' });
  ok('a garnish is fine with no decision', g.outcome === 'fine');

  const t = resolveRequest({ anatomy: A, dishId: 'bolognese', ingredientId: 'milk' });
  ok('a technique-critical line goes to Kevin', t.outcome === 'ask');
  ok('and carries the consequence, so he is not reconstructing the dish',
    /pellets/.test(t.reason),
    'his own words on what leaving it out does');

  const u = resolveRequest({ anatomy: A, dishId: 'bolognese', ingredientId: 'nutmeg' });
  ok('an UNRECORDED ingredient is unknown, not fine',
    u.outcome === 'unknown' && u.outcome !== 'fine',
    'silence about a consequence is not evidence there is not one');
  ok('and it says plainly that nothing is recorded',
    /no recorded anatomy/.test(u.reason),
    'a blank reads as "nothing to worry about"');
  ok('unknown carries no consequence rather than an invented one', u.consequence === null);

  ok('a missing dish or ingredient is unknown, not a crash',
    resolveRequest({ anatomy: A }).outcome === 'unknown');
  ok('every outcome has a label', OUTCOMES.every(o => OUTCOME_LABELS[o]));
}

// ── The two questions stay separate ─────────────────────────────────────────
{
  const b = resolveRequest({ anatomy: A, dishId: 'indian-style-curry', ingredientId: 'butter' });
  ok('an IDENTITY-DEFINING line still goes to Kevin', b.outcome === 'ask');
  ok('but its swap travels with it',
    b.substitutability === 'swappable',
    'identity-defining and swappable at once — inferring one from the other loses the real answer');
  ok('and the alternative is named in the packet',
    /neutral oil/.test(requestSummary(b, 'Indian Style Curry')));
}

// ── The two shapes that are not ingredients ─────────────────────────────────
{
  const up = resolveRequest({ anatomy: A, dishId: 'bolognese', ingredientId: 'egg_pappardelle' });
  ok('declining an UPGRADE is not an accommodation',
    up.outcome === 'fine' && /upgrade/.test(up.reason),
    'it is choosing the standard variant, not modifying a recipe');

  const li = resolveRequest({ anatomy: A, dishId: 'indian-style-curry', ingredientId: 'stock' });
  ok('a LINKED line cannot be answered on its own', li.outcome === 'ask');
  ok('and it names what it follows',
    /protein/.test(li.reason),
    'the stock swaps with the protein; answering it alone would give a wrong answer');
}

// ── The decision record ─────────────────────────────────────────────────────
{
  ok('it ships empty', emptyAccommodations().decisions.length === 0);

  let D = emptyAccommodations();
  const first = answerRequest({ anatomy: A, decisions: D, dishId: 'indian-style-curry', ingredientId: 'butter' });
  ok('an unruled request is not settled', first.settled === false && first.outcome === 'ask');

  D = recordDecision(D, {
    dishId: 'indian-style-curry', ingredientId: 'butter', answer: 'swap',
    swapTo: 'neutral oil', note: 'Vegan version. Not as good, but it works.',
  });
  const second = answerRequest({ anatomy: A, decisions: D, dishId: 'indian-style-curry', ingredientId: 'butter' });
  ok('the SAME question is settled the second time',
    second.settled === true && second.answer === 'swap',
    'this is the point: the same ask must not cost him twice');
  ok('and it carries his swap and his words',
    second.swapTo === 'neutral oil' && /Not as good/.test(second.reason));

  D = recordDecision(D, { dishId: 'indian-style-curry', ingredientId: 'butter', answer: 'no', note: 'Changed my mind.' });
  ok('a new ruling SUPERSEDES rather than duplicating',
    accommodationCounts(D).total === 1);
  ok('and the newest one answers',
    answerRequest({ anatomy: A, decisions: D, dishId: 'indian-style-curry', ingredientId: 'butter' }).answer === 'no');

  ok('an unknown answer value is refused rather than stored',
    recordDecision(emptyAccommodations(), { dishId: 'x', ingredientId: 'y', answer: 'maybe' }).decisions.length === 0);
  ok('and every declared answer is one of three', ANSWERS.length === 3);
  ok('a malformed store normalizes to empty',
    normalizeAccommodations({ decisions: 'nope' }).decisions.length === 0);
}

// ── Version scoping ─────────────────────────────────────────────────────────
{
  const scoped = recordDecision(emptyAccommodations(), {
    dishId: 'bolognese', ingredientId: 'milk', answer: 'no', recipeVersionId: 'bolognese@v1',
  });
  ok('a version-scoped ruling answers for ITS version',
    !!priorDecision(scoped, 'bolognese', 'milk', 'bolognese@v1'));
  ok('and does NOT answer for another',
    priorDecision(scoped, 'bolognese', 'milk', 'bolognese@v2') === null,
    'a ruling made against one recipe is not automatically true of the next');

  const general = recordDecision(emptyAccommodations(), {
    dishId: 'bolognese', ingredientId: 'milk', answer: 'no',
  });
  ok('an UNSCOPED ruling answers for any version',
    !!priorDecision(general, 'bolognese', 'milk', 'bolognese@v9'),
    'that is Kevin saying it in general, which he can do deliberately');
}

// ── The worklist and coverage ───────────────────────────────────────────────
{
  let D = recordDecision(emptyAccommodations(), { dishId: 'bolognese', ingredientId: 'milk', answer: 'no' });
  const reqs = [
    { dishId: 'bolognese', ingredientId: 'milk' },
    { dishId: 'bolognese', ingredientId: 'nutmeg' },
  ];
  const open = openRequests(null, D, reqs);
  ok('the worklist holds only what is still unruled',
    open.length === 1 && open[0].ingredientId === 'nutmeg',
    'not a count of everything ever asked');

  const cov = dishCoverage(A, 'bolognese');
  ok('coverage reports what can be answered without him',
    cov.recorded === 3 && cov.answerable === 2 && cov.needsKevin === 1,
    JSON.stringify(cov));
}

// ── Nothing here invents an answer ──────────────────────────────────────────
{
  const src = readFileSync(new URL('../src/accommodation.js', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('no generator, suggester, or drafted answer',
    !/generate|suggest|draft|infer|predict/i.test(code),
    'a generated ruling wearing his name is worse than no record at all');
  ok('and nothing falls back to a similar dish',
    !/similar|nearest|fallback/i.test(code),
    'the Bolognese milk answer says nothing about the curry');
}

console.log(failed === 0 ? '\nACCOMMODATION: ALL PASS' : `\nACCOMMODATION: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
