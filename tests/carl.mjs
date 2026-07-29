// tests/carl.mjs — the Carl filter.
//
// WHY THIS EXISTS
//
// Carl avoids gluten, eggs, legumes, mushrooms, sesame, and white potatoes. A
// wrong answer here does not produce a weird number somebody might notice; it
// feeds a man something that ruins his night. Same failure class as
// diet_flags.mjs and allergens.mjs, so it gets the same treatment: fail closed,
// and lock every false negative as a named regression the moment it is found.
//
// TWO LIVE FALSE NEGATIVES WERE FOUND WHILE WRITING src/carl.js, both because
// an ingredient id does not contain the word for what it is:
//
//   baby_bella   — a mushroom with no 'mushroom' in the id. It cleared two
//                  Homegrown Tomato variants that should have been dead.
//   mayonnaise   — an egg product with no 'egg' in the id. It is the Alabama
//                  white sauce, and only the declared tag was catching it.
//
// Both are asserted below by name. Any future pattern edit that reintroduces
// either one fails the build. When a new ingredient goes in, the question to
// ask is not "is it obviously an allergen" but "does its ID say so".
//
// The other direction is asserted too: chinese_eggplant must never trip egg,
// and sweet_potato must never trip potato, because sweet potato is the
// substitution for three dishes.

import { DISHES, ALL_ALWAYS_ITEMS } from '../src/dishes.js';
import { resolveDishVariant } from '../src/dishCosting.js';
import {
  CARL_CATEGORIES, CARL_PATTERNS, CARL_ALLOW, SWAPS, CARL_RULINGS,
  CARL_EXCLUDED, DECLARED_TO_CATEGORY,
  carlStatus, carlSentence, carlMenu, carlShoppingAdditions,
} from '../src/carl.js';

let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? ' — ' + x : ''))); };

const ITEMS = [...DISHES, ...ALL_ALWAYS_ITEMS];
const byName = n => ITEMS.find(i => i.name === n);
const status = (name, label) => {
  const it = byName(name);
  return carlStatus(it, label, resolveDishVariant(it.name, label));
};

// ── Structure: the registry has to be internally coherent ──────────────────
{
  const unruled = ITEMS.filter(i => !CARL_RULINGS[i.id] && !CARL_EXCLUDED[i.id]);
  ok('every menu item has a ruling or an exclusion', unruled.length === 0, unruled.map(i => i.id).join(', '));

  const badCat = [];
  const badSwap = [];
  const badVariant = [];
  const emptyDead = [];
  for (const [id, cats] of Object.entries(CARL_RULINGS)) {
    const item = ITEMS.find(i => i.id === id);
    for (const [cat, raw] of Object.entries(cats)) {
      if (!CARL_CATEGORIES.includes(cat)) badCat.push(id + '.' + cat);
      for (const r of (Array.isArray(raw) ? raw : [raw])) {
        if (r.dead !== undefined && !String(r.dead).trim()) emptyDead.push(id + '.' + cat);
        for (const s of (r.swap ? (Array.isArray(r.swap) ? r.swap : [r.swap]) : [])) {
          if (!SWAPS[s]) badSwap.push(id + '.' + cat + ' -> ' + s);
        }
        if (r.variants && item) {
          const labels = item.variants.map(v => v.label);
          for (const v of r.variants) if (!labels.includes(v)) badVariant.push(id + '.' + cat + ' -> ' + v);
        }
      }
    }
  }
  ok('no ruling names an unknown category', badCat.length === 0, badCat.join(', '));
  ok('no ruling names an unknown swap', badSwap.length === 0, badSwap.join(', '));
  ok('no ruling scopes to a variant that does not exist', badVariant.length === 0, badVariant.join(', '));
  ok('no dead ruling has an empty reason', emptyDead.length === 0, emptyDead.join(', '));

  const badClear = Object.entries(SWAPS).filter(([, s]) => s.clears.some(c => !CARL_CATEGORIES.includes(c)));
  ok('every swap clears only real categories', badClear.length === 0, badClear.map(([k]) => k).join(', '));
  ok('every swap has customer-facing wording', Object.values(SWAPS).every(s => s.say && s.say.trim()));
  const unusedSwaps = Object.keys(SWAPS).filter(s =>
    !Object.values(CARL_RULINGS).some(cats => Object.values(cats).some(raw =>
      (Array.isArray(raw) ? raw : [raw]).some(r => r.swap && (Array.isArray(r.swap) ? r.swap : [r.swap]).includes(s)))));
  ok('no swap sits in the registry unused', unusedSwaps.length === 0, unusedSwaps.join(', '));

  const badAllow = Object.keys(CARL_ALLOW).filter(k => !CARL_CATEGORIES.includes(k));
  ok('the allow list is keyed by real categories', badAllow.length === 0, badAllow.join(', '));
  ok('soy and peanut both map to legume',
    DECLARED_TO_CATEGORY.soy === 'legume' && DECLARED_TO_CATEGORY.peanut === 'legume');
}

// ── Pattern regressions: ids that do not say what they are ─────────────────
ok('baby_bella is caught as a mushroom', CARL_PATTERNS.mushroom.test('baby_bella'));
ok('mayonnaise is caught as egg', CARL_PATTERNS.egg.test('mayonnaise'));
ok('chili_oil is caught as sesame', CARL_PATTERNS.sesame.test('chili_oil'));
ok('lecithin is caught as legume', CARL_PATTERNS.legume.test('lecithin'));
ok('doubanjiang is caught as legume', CARL_PATTERNS.legume.test('doubanjiang'));
ok('chickpeas are caught as legume', CARL_PATTERNS.legume.test('chickpeas'));

// ── The other direction: no false positives on the substitutes ─────────────
ok('chinese_eggplant does not trip egg', !CARL_PATTERNS.egg.test('chinese_eggplant'));
ok('sweet_potato is not a white potato', CARL_ALLOW.potato.has('sweet_potato'));
ok('vanilla_bean is not a legume', CARL_ALLOW.legume.has('vanilla_bean'));
ok('coconut_aminos does not re-trip gluten', CARL_ALLOW.gluten.has('coconut_aminos'));

// ── Verdicts on real data ──────────────────────────────────────────────────
{
  const clean = status('Pork Chop with Kabocha Purée and Charred Broccolini', '~4 servings');
  ok('the one clean dinner comes back clean', clean.verdict === 'clean', clean.verdict);
  ok('a clean dinner has no yellow line', clean.sentence === null);

  // Both roux dishes are dead by Kevin's ruling (Jul 29): he takes both rouxs
  // very dark, and rice flour cannot brown that far. Asserted by name because
  // an earlier version of this file offered a rice flour swap on both.
  ok('Gumbo is dead on its dark roux', status('Gumbo', 'Large (~8)').verdict === 'dead');
  ok('Leblanc curry is dead on its dark roux', status('Leblanc Inspired Japanese Curry', 'Large (~8)').verdict === 'dead');
  {
    const b = status('Boeuf Bourguignon (Beef Stew)', '~4 servings');
    ok('Bourguignon thickens with xanthan rather than any flour', b.swaps.includes('xanthan_thickener'), b.swaps.join(','));
    ok('and xanthan needs no shopping line, since it is already stocked', !b.shopping.includes('Rice flour'));
  }

  const ragu = status('Mushroom Ragu', 'Small (~4-5 servings)');
  ok('Mushroom Ragu is dead', ragu.verdict === 'dead', ragu.verdict);
  ok('and it says why', ragu.blocked.some(b => b.category === 'mushroom' && b.reason.length > 0));

  const poivre = status('Steak au Poivre', 'Medium (~4 servings)');
  ok('Steak au Poivre swaps rather than dying', poivre.verdict === 'swap', poivre.verdict);
  ok('it names both swaps', poivre.swaps.includes('sweet_potato') && poivre.swaps.includes('sunflower_lecithin'), poivre.swaps.join(','));
  ok('its sentence mentions sunflower lecithin', /sunflower lecithin/.test(poivre.sentence || ''), poivre.sentence);
  ok('it carries a shopping line', poivre.shopping.length > 0, poivre.shopping.join(','));

  // The baby_bella regression, end to end.
  ok('Homegrown Tomato base variant survives', status('Pasta with Homegrown Tomato Sauce', 'Base (~4)').verdict === 'swap');
  ok('its mushroom variant is dead', status('Pasta with Homegrown Tomato Sauce', 'With Mushrooms').verdict === 'dead');
  ok('and so is With Both', status('Pasta with Homegrown Tomato Sauce', 'With Both').verdict === 'dead');

  // The mayonnaise regression, end to end.
  ok('Tea-Smoked Chicken is dead on egg',
    status('Tea-Smoked Chicken with Dashi Polenta and Alabama White Sauce', 'Small (~4 servings)')
      .blocked.some(b => b.category === 'egg'));

  // Variant scoping actually scopes.
  ok('the chickpea curry is dead', status('Indian Style Curry', 'Chickpea, Small (~4-5)').verdict === 'dead');
  ok('the chicken curry is not', status('Indian Style Curry', 'Chicken, Small (~4-5)').verdict === 'clean');
  ok('the tofu stir-fry variant is dead', status('Texas Gulf Shrimp or Tofu and Chinese Broccoli', 'Tofu, Small Batch (~4)').verdict === 'dead');
  ok('the shrimp one swaps', status('Texas Gulf Shrimp or Tofu and Chinese Broccoli', 'Shrimp, Small Batch (~4)').verdict === 'swap');

  // Chili oil is droppable (Kevin's ruling), so sesame must not kill anything.
  const cumin = status('Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice', 'Beef, Small (~3-4)');
  ok('sesame from chili oil is a note, not a killer', cumin.verdict === 'swap', cumin.verdict);
  ok('and the note says to leave it out', /chili oil/.test(cumin.sentence || ''), cumin.sentence);

  // Add-ons.
  ok('Queso is clean', status('Queso', 'Per Pint Jar').verdict === 'clean');
  ok('the fudge is dead on peanuts', status('Peanut Butter Fudge', '1 Batch').blocked.some(b => b.category === 'legume'));
  ok('baby gold potatoes are dead', status('Baby Gold Potatoes', '~2 servings').verdict === 'dead');
  ok('a sous vide steak is clean', status('Ribeye', 'price by weight').verdict === 'clean');
  ok('asparagus is clean', status('Asparagus', 'Whole (~2 servings)').verdict === 'clean');
}

// ── Fail closed ────────────────────────────────────────────────────────────
{
  const invented = { id: 'not-a-real-dish-id', name: 'Invented', allergens: {}, variants: [{ label: 'x' }] };
  const st = carlStatus(invented, 'x', []);
  ok('an unruled item is dead, not clean', st.verdict === 'dead', st.verdict);
  ok('and it is flagged as unknown so it shows up as work', st.unknown === true);

  // A tripped category with no ruling must not fall through to clean.
  const rogue = { id: 'queso', name: 'Queso', allergens: { gluten: true }, variants: [{ label: 'Per Pint Jar' }] };
  const rs = carlStatus(rogue, 'Per Pint Jar', []);
  ok('a tripped category with no ruling blocks the item', rs.verdict === 'dead', rs.verdict);

  ok('all five finishing sauces are excluded', ['chimichurri', 'romesco', 'chermoula', 'miso-butter-sauce', 'whipped-lemon-garlic-herb'].every(id => CARL_EXCLUDED[id]));
  ok('every exclusion carries a reason', Object.values(CARL_EXCLUDED).every(r => r && r.trim().length > 0));
}

// ── Wording and aggregation ────────────────────────────────────────────────
ok('one swap reads as a sentence', carlSentence(['gf_pasta']) === 'For Carl, we swap the pasta for a gluten-free shape.');
ok('two swaps get an and', /\band\b/.test(carlSentence(['gf_pasta', 'no_peas'])));
{
  // Not a raw comma count — 'For Carl,' already contributes one.
  const three = carlSentence(['gf_pasta', 'no_peas', 'sweet_potato']);
  ok('three swaps join with commas and a final and',
    /shape, leave the peas out and swap the potatoes/.test(three), three);
}
ok('no swaps means no sentence', carlSentence([]) === null);

{
  const menu = carlMenu(ITEMS, resolveDishVariant);
  ok('the Carl menu hides every dead variant', menu.every(m => m.verdict !== 'dead'));
  ok('the Carl menu is not empty', menu.length > 0, String(menu.length));
  ok('every swapped entry carries its yellow line', menu.filter(m => m.verdict === 'swap').every(m => m.sentence));
  const shop = carlShoppingAdditions(menu);
  ok('shopping additions are deduplicated', shop.length === new Set(shop).size, shop.join(','));
  ok('shopping additions include the aminos', shop.includes('Coconut aminos'), shop.join(','));

  const dinnerNames = new Set(menu.filter(m => DISHES.some(d => d.id === m.item.id)).map(m => m.item.name));
  ok('18 of the 27 dinners survive', dinnerNames.size === 18, String(dinnerNames.size));
}

console.log(f === 0 ? '\nCARL: ALL PASS' : `\nCARL: ${f} FAILURES`);
process.exit(f ? 1 : 0);
