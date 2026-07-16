// tests/diet_flags.mjs — a dish flagged vegetarian must not contain meat.
//
// WHY THIS EXISTS
//
// The diet flags are a CUSTOMER-FACING CLAIM. Both order forms filter on them,
// so a wrong flag doesn't produce a weird number Kevin might notice — it feeds
// somebody something they told him they don't eat. That is the worst failure
// class in the app, and until now nothing checked it at all.
//
// Jul 15, found the moment this check was first run: Indian Style Curry's
// Chickpea variants were flagged `veg` and its Shrimp variants `pesc`, while
// `Chicken stock` sat in the dish's BASE recipe — so every variant was
// simmered in poultry, including the two advertised as vegetarian. It had been
// live. The fix moved stock into per-variant extras (vegetable for
// chickpea/shrimp, chicken for chicken), which is exactly the kind of thing
// that gets forgotten on the NEXT dish. Hence a gate rather than a fix.
//
// The check reads RESOLVED ingredients, not the recipe as written, so it
// follows base + extras + factors the same way the costing engine does. A flag
// is only trusted after its own variants have been walked.
//
// TWO CLAIMS ARE CHECKED
//   1. every variant a flag names actually exists (a typo'd label is a flag
//      that silently protects nobody)
//   2. no variant carries an ingredient its flag forbids
//
// The matcher is deliberately blunt and errs toward false positives. A false
// positive costs a minute and an ALLOW entry; a false negative costs a
// vegetarian a bowl of chicken stock. When it fires on something legitimate,
// add it to ALLOW with a reason — never loosen the pattern.

import assert from 'node:assert/strict';
import { DISHES } from '../src/dishes.js';
import { resolveDishVariant } from '../src/dishCosting.js';

// Matched against resolved ingredient IDS.
const MEAT = /beef|pork|lamb|chicken|bacon|sausage|turkey|duck|veal|ham|filet|steak|chop|belly|prosciutto|pancetta|guanciale|lard|tallow/;
const SEAFOOD = /shrimp|anchov|fish|oyster_sauce|bonito|dashi|clam|squid|prawn|katsuo/;

// Ids that match a pattern but are not the animal. Each needs a reason.
const ALLOW = new Set([
  'chicken_basics_stock_VEG_NEVER', // placeholder: keep the set non-empty and documented
]);

// `veg` forbids both; `pesc` forbids meat but allows seafood.
const FORBIDDEN = {
  veg: [['meat', MEAT], ['seafood', SEAFOOD]],
  pesc: [['meat', MEAT]],
};

const problems = [];
let variantsChecked = 0;
let flagsChecked = 0;

for (const dish of DISHES) {
  if (!dish.diet) continue;

  for (const [tag, value] of Object.entries(dish.diet)) {
    const rules = FORBIDDEN[tag];
    if (!rules) {
      problems.push(`${dish.name}: unknown diet tag '${tag}' — this test doesn't know what it forbids, so it cannot vouch for it`);
      continue;
    }
    flagsChecked += 1;

    // `true` = the whole dish qualifies. An array = only these variants do.
    const labels = value === true ? dish.variants.map(v => v.label) : value;

    for (const label of labels) {
      if (!dish.variants.some(v => v.label === label)) {
        problems.push(`${dish.name}: diet.${tag} names variant '${label}', which does not exist — the flag protects nobody`);
        continue;
      }

      const resolved = resolveDishVariant(dish.name, label);
      if (!resolved) {
        problems.push(`${dish.name} / '${label}': flagged ${tag} but the recipe does not resolve — cannot verify the claim`);
        continue;
      }
      variantsChecked += 1;

      for (const [what, re] of rules) {
        const hits = resolved
          .map(x => x.id)
          .filter(id => id && re.test(id) && !ALLOW.has(id));
        if (hits.length) {
          problems.push(
            `${dish.name} / '${label}'\n      flagged:  ${tag}\n      contains: ${[...new Set(hits)].join(', ')}  (${what})\n      -> a customer filtering for ${tag} would be served this`
          );
        }
      }
    }
  }
}

assert.equal(
  problems.length, 0,
  `[diet-flags] ${problems.length} dietary claim(s) the recipes do not support:\n\n    ` +
  problems.join('\n\n    ') +
  '\n\n  These are customer-facing claims. Fix the recipe or drop the flag.\n'
);

assert.ok(flagsChecked > 0 && variantsChecked > 0,
  `sanity: expected to check some flags, saw ${flagsChecked} flags / ${variantsChecked} variants — did the diet field change shape?`);

console.log(`[diet-flags] ${flagsChecked} flags across ${variantsChecked} variants match their recipes`);
