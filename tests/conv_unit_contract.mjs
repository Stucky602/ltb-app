// tests/conv_unit_contract.mjs — the seed's `unit` and the LINE_MAP conv's
// `unit` are ONE CONTRACT, and until now nothing checked it.
//
// WHY THIS EXISTS
//
// A recipe line costs out as: conv(qty, recipeUnit) * baseline.
//
//   - the SEED's `unit` declares what one baseline dollar buys ($1.38 per LB)
//   - the CONV's `unit` declares what quantity conv() returns (2.5 EACHES)
//
// Multiply those together and you get a number. It is always a number. It is
// only the RIGHT number if the two units are the same word.
//
// Jul 15: red onion moved from `each @ 1.20` to `lb @ 1.38`. The conv still
// said `unit: 'each', pieceWeightLb: 0.6`. Every red onion line would have
// silently mispriced by 1/0.6 — a 1.5 lb line resolving to 2.5 "eaches" and
// costing 2.5 * $1.38 = $3.45 instead of $2.07. Off by 67%, on a real dish,
// with a green test suite.
//
// That is the same failure family as the duplicate `Filet mignon` LINE_MAP
// key that zeroed the filet twice: a costing input that is wrong rather than
// missing, so nothing throws and nothing looks broken. `[linemap-dupes]`
// guards the duplicate case. This guards the mismatch case.
//
// Note the direction trap that makes this easy to get wrong: `pieceWeightLb`
// converts weight -> pieces (correct when the purchase unit is per-each),
// `eachWeightLb` converts pieces -> weight (correct when it is per-lb). The
// two keys are near-homophones pointing opposite ways, and picking the wrong
// one produces a plausible number rather than a crash.

import assert from 'node:assert/strict';
import { LINE_MAP, canonUnit } from '../src/dishCosting.js';
import { INGREDIENT_SEED } from '../src/ingredients.js';

const seedById = new Map(INGREDIENT_SEED.map(i => [i.id, i]));

// A conv declaring `fluid: true` rewrites 'oz' to 'floz' internally, because
// a seed that says "oz" for a liquid means fluid ounces. That pairing is
// correct by design, not a mismatch.
const equivalent = (seedUnit, convUnit) => {
  const s = canonUnit(seedUnit);
  if (s === convUnit) return true;
  if (s === 'oz' && convUnit === 'floz') return true;
  return false;
};

const mismatches = [];
const unmapped = [];
let checked = 0;

for (const [line, spec] of Object.entries(LINE_MAP)) {
  if (!spec || spec.skip || !spec.id || typeof spec.conv !== 'function') continue;

  const seed = seedById.get(spec.id);
  if (!seed) {
    // A LINE_MAP entry pointing at an id the seed has never heard of. The
    // drift engine's `?? baseC` fallback would resolve this to $0, since
    // baseCostMap is built from the seed. Silent zero: the exact filet bug.
    unmapped.push(`${line} -> id '${spec.id}' is not in INGREDIENT_SEED`);
    continue;
  }

  // makeConv() attaches the unit it resolves to. An entry built by hand rather
  // than via makeConv won't have it; skip rather than guess.
  const declared = spec.conv.declaredUnit;
  if (!declared) continue;

  checked += 1;
  if (!equivalent(seed.unit, declared)) {
    mismatches.push(
      `${line}\n      id:        ${spec.id}\n      seed unit: '${seed.unit}'  (baseline $${seed.baseline} is PER ${seed.unit})\n      conv unit: '${declared}'  (conv returns a quantity in ${declared})\n      -> every line for this ingredient misprices silently`
    );
  }
}

assert.equal(
  mismatches.length, 0,
  `[conv-unit-contract] ${mismatches.length} LINE_MAP conv(s) disagree with the seed unit:\n\n    ` +
  mismatches.join('\n\n    ') +
  '\n\n  Fix: change the conv\'s `unit:` to match the seed, and swap ' +
  'pieceWeightLb <-> eachWeightLb if the direction flipped.\n'
);

assert.equal(
  unmapped.length, 0,
  `[conv-unit-contract] ${unmapped.length} LINE_MAP entr(ies) point at an id not in the seed ` +
  `(these resolve to $0 in baselineCostMap):\n    ` + unmapped.join('\n    ') + '\n'
);

assert.ok(checked > 100, `sanity: expected to check 100+ convs, only saw ${checked} — did LINE_MAP or makeConv change shape?`);

console.log(`[conv-unit-contract] ${checked} LINE_MAP convs agree with their seed units`);
