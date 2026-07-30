// ═══════════════════════════════════════════════════════════════════════════
// THE CARL FILTER — one customer, hardcoded on purpose.
// ═══════════════════════════════════════════════════════════════════════════
//
// WHY THIS IS HARDCODED
//
// Six households. Building a general per-customer allergen profile to serve
// one man is the wrong trade, and Kevin said so directly. If a second person
// ever needs this, the shape here generalizes (rulings keyed by item id, swaps
// in a shared registry) but nothing pretends to be general today.
//
// WHAT CARL AVOIDS
//
//   gluten, eggs, legumes, mushrooms, sesame, white potatoes
//
// This is a gut reaction, not anaphylaxis — Carl told Kevin directly. So
// cross-contact on a shared cook day is not a safety line, and this file does
// not model it. Trace quantities DO count (Kevin's ruling), which is why soy
// lecithin in the beurre blancs blocks a dish rather than being waved through.
//
// LEGUMES ARE WIDER THAN SOY. The app's existing `soy` allergen tag is a
// SUBSET of what Carl avoids: peanuts, chickpeas, lima beans, long beans,
// gigantes, petite peas, tofu, miso, doubanjiang, and soy lecithin all land
// under legume. Reading the `soy` tag alone would clear Peanut Butter Fudge.
//
// THE THREE VERDICTS
//
//   clean — nothing on his list appears
//   swap  — the hit is incidental or has a real substitution, named in SWAPS
//   dead  — the hit is load-bearing; removing it removes the dish
//
// The verdict is per ITEM AND CATEGORY, not per item. Mushroom Ragu is the
// proof: its gluten and egg both swap cleanly and its mushroom does not. A
// single flag on the dish cannot express that. The item's verdict is the worst
// of its category verdicts.
//
// DEAD ITEMS DISAPPEAR from the Carl menu entirely (Kevin's call — a menu of
// things he can't have is a list of disappointments).
//
// WHY THE SCAN READS TWO LAYERS
//
// Recipe ids alone are not enough. Six dinners hide a Carl allergen inside a
// composed line that resolves to spices_generic or sv_bag — the soy sauce in
// Chili's Marmite line, the roux flour in Leblanc's spice blend, the sesame in
// house chili oil. A recipe-only scan clears Mapo Eggplant and Leblanc Curry
// and both would get him. So carlScan reads resolved ingredient ids AND the
// dish's declared `allergens` tags, mapped through DECLARED_TO_CATEGORY.
//
// PATTERN PHILOSOPHY, inherited from tests/allergens.mjs and diet_flags.mjs:
// blunt patterns that err toward false positives. A false positive costs a
// minute and an ALLOW entry with a reason. A false negative costs Carl a bad
// night. When one fires on something legitimate, add the id to ALLOW — never
// loosen the pattern.
// ═══════════════════════════════════════════════════════════════════════════

// ANSWERED BY KEVIN, Jul 29. Kept on the record because each one was a guess
// before he ruled, and the wrong guess would have read as fact.
//
//   chinkiang        — GLUTEN. In the pattern below.
//   worcestershire   — GLUTEN. In the pattern below. The app also files it under
//                      `fish`, which stays correct; it is both.
//   ssamjang         — there is NONE in the Bo Ssam, so the coconut aminos swap
//                      is the whole story there and the dish survives.
//   the five sauces  — stay hard-excluded permanently. Kevin does not have the
//                      recipes and is not planning to supply them, so this is a
//                      settled decision rather than a pending one.
//   Brunswick limas  — non-negotiable. Dish is dead.
//   gigantes         — non-negotiable. Dish is dead.
//
// STILL OPEN, and moot today:
//   guittard_*, valrhona — commercial chocolate almost always carries soy
//                      lecithin, a legume, which Kevin ruled counts at trace.
//                      Every DESSERT using these is already dead on gluten,
//                      egg, or peanut, so nothing turns on them.
//   chocolate_100    — NO LONGER MOOT as of Jul 29. The Fesenjan went live and
//                      it is the only surviving dish using this id, so whether
//                      that specific bar lists soy lecithin now decides whether
//                      Carl can eat the dish at all. Label check, not a guess.
//                      See the pecan-mole-fesenjan ruling below.
//   garlic_confit    — confit is traditionally oil, but Kevin says butter and
//                      thyme go in every sous vide bag. If the confit is the
//                      exception its dairy tag is wrong, which is harmless for
//                      Carl either way.

// ── Categories, matched against RESOLVED ingredient ids (snake_case) ────────
export const CARL_CATEGORIES = ['gluten', 'egg', 'legume', 'mushroom', 'sesame', 'potato'];

export const CARL_PATTERNS = {
  // Copied verbatim from tests/allergens.mjs so the two cannot drift. The
  // blunt /soy/ is intentional: US soy sauce carries wheat unless it is
  // labeled tamari, and nothing in this kitchen is tamari.
  // chinkiang and worcestershire are BOTH gluten carriers in the brands Kevin
  // buys (his ruling, Jul 29), so they are in the pattern rather than in the
  // open-questions list where they started. Note they are also now in
  // tests/allergens.mjs, because that is a fact about the bottles and it
  // matters to every customer avoiding gluten, not only to Carl.
  gluten: /flour|pasta|pappardelle|taglierini|orecchiette|noodle|tortilla|soy|doubanjiang|oyster_sauce|shaoxing|marmite|bread|panko|chinkiang|worcestershire/,
  // (^|_)eggs?(_|$) so chinese_eggplant never fires but egg_pappardelle does.
  // `mayonnaise` is added explicitly because the id contains no 'egg' string —
  // it is the Alabama white sauce on the Tea-Smoked Chicken, and only the
  // declared tag was catching it before.
  egg: /(^|_)eggs?(_|$)|mayonnaise/,
  // Wider than the app's `soy` tag on purpose — see the header note.
  legume: /bean|pea|lentil|chickpea|garbanzo|soy|tofu|lecithin|miso|doubanjiang|edamame|tamarind|fenugreek/,
  // baby_bella carries no 'mushroom' in its id and slipped the first version of
  // this pattern entirely — a live false negative on two Homegrown Tomato
  // variants. Any new fungus id must be added here BY ID, not by common name.
  mushroom: /mushroom|shiitake|porcini|cremini|portobello|bella|enoki|maitake|truffle|chanterelle|morel|trumpet|agaricus/,
  // The app's own sesame pattern reads /sesame|house_chili_oil/, but the id
  // the recipes actually resolve to is `chili_oil` — so that branch is dead
  // and has never fired. Hence all three sesame tags on the dinners needed an
  // `unlisted:` reason. This file matches the real id. Flagged for Kevin;
  // fixing it in tests/allergens.mjs is a separate change with its own blast
  // radius, so it is deliberately NOT done here.
  sesame: /sesame|chili_oil/,
  // White potatoes only. Sweet potato is negated below and is in fact the
  // substitution for several dishes.
  potato: /potato/,
};

// Ids that match a pattern but are not the thing. Per-category so a negation
// cannot silently widen. Every entry needs a reason.
export const CARL_ALLOW = {
  legume: new Set([
    'vanilla_bean', 'vanilla_beans',   // orchid seed pod, not a legume
    'cocoa', 'cacao', 'cocoa_powder',  // "cocoa bean" is a seed, not a pulse
    'coffee', 'espresso',              // same
    'pear', 'pears', 'peach', 'peaches', // /pea/ collision
    'pearl_onion', 'pearl_onions',     // /pea/ collision
  ]),
  potato: new Set([
    'sweet_potato', 'sweet_potatoes',  // not a white potato; it is the swap
  ]),
  gluten: new Set([
    'soy_free_aminos', 'coconut_aminos', // the swap itself must not re-trip
  ]),
  egg: new Set(),
  mushroom: new Set(),
  sesame: new Set(),
};

// The app's declared allergen tags, mapped into Carl categories. Tags with no
// Carl meaning (dairy, fish, shellfish, mustard, tree_nut) map to null.
export const DECLARED_TO_CATEGORY = {
  gluten: 'gluten',
  egg: 'egg',
  sesame: 'sesame',
  soy: 'legume',      // soy is a legume
  peanut: 'legume',   // so is a peanut
  dairy: null,
  fish: null,
  shellfish: null,
  mustard: null,
  nut: null,
  tree_nut: null,
};

// ── The swap registry ──────────────────────────────────────────────────────
//
// Defined once, referenced by id from CARL_RULINGS. The same handful of swaps
// covers the whole menu: coconut aminos appears seven times, gluten-free pasta
// six. Per-dish swap text would drift within a month.
//
//   clears — which Carl categories this swap resolves
//   say    — customer-facing fragment. Reads after "For Carl, we ".
//   cook   — what changes on the cook day. Null when nothing does.
//   shop   — shopping-list line, or null when the swap is an omission.
// TWO SWAPS ARE DELIBERATELY ABSENT, and the gate enforces that no swap sits
// here unused:
//   a noodle substitution — the only variants that ship noodles are the four
//     Mushroom ones on the Cumin dish, and those are already dead on mushroom.
//     Verified against resolveDishVariant, not assumed. If a beef-with-noodles
//     variant is ever added, sweet potato starch noodles are the answer (rice
//     noodles are on the permanent exclusion list; sweet potato starch is a
//     different material and outside that ban).
//   a mushroom omission — mushrooms are a paid variant addition on both dishes
//     that have them, never a base ingredient, so there is nothing to omit.
export const SWAPS = {
  gf_pasta: {
    clears: ['gluten', 'egg'],
    say: 'swap the pasta for a gluten-free shape',
    // No reheat consequence: every pasta dish ships the pasta uncooked and the
    // customer boils it fresh, so it is never reheated. Carl eats gluten-free
    // daily and does not need instructions on boiling his own pasta.
    cook: null,
    shop: 'Gluten-free pasta',
  },
  coconut_aminos: {
    clears: ['gluten', 'legume'],
    say: 'swap the soy sauce for coconut aminos',
    cook: 'Coconut aminos run sweeter and much less salty than soy. Salt to taste at the end rather than measuring across.',
    shop: 'Coconut aminos',
  },
  sunflower_lecithin: {
    clears: ['legume'],
    say: 'stabilize the butter sauce with sunflower lecithin instead of soy',
    cook: null,
    shop: 'Sunflower lecithin',
  },
  corn_tortillas: {
    clears: ['gluten'],
    say: 'swap the flour tortillas for corn',
    cook: null,
    shop: 'Corn tortillas',
  },
  // NOT a rice flour roux. Rice flour thickens fine and browns badly — six or
  // seven percent protein against wheat's ten to twelve, so it has far less to
  // give Maillard and hits a chalky-then-burnt wall where wheat has a long
  // usable range. That is survivable when the roux is only thickening, and it
  // is why an earlier version of this file offered it for all three roux
  // dishes. Kevin then ruled that Gumbo and Leblanc BOTH use a super dark roux,
  // which rice flour cannot reach, and both are now dead rather than swapped.
  // Bourguignon's roux is a light one added at the end for body only, so the
  // flour comes out entirely instead.
  xanthan_thickener: {
    clears: ['gluten'],
    say: 'thicken the stew with xanthan gum instead of a flour roux',
    cook: 'Xanthan hydrates instantly and clumps if it is dumped in. Disperse it into a little cold liquid first, add it off the heat, and stop well short of what looks right — it keeps tightening as it sits.',
    shop: null,   // already stocked for the stabilized butter platform
  },
  gf_oyster_sauce: {
    clears: ['gluten'],
    say: 'swap the oyster sauce for a gluten-free one',
    cook: null,
    shop: 'Gluten-free oyster sauce',
  },
  no_marmite: {
    clears: ['gluten'],
    say: 'drop the Marmite and lean on the anchovy for depth',
    cook: 'Marmite is barley. The anchovy and fish sauce carry the umami instead — both are fine for Carl. Taste for salt, since the Marmite was also salting it.',
    shop: null,
  },
  sweet_potato: {
    clears: ['potato'],
    say: 'swap the potatoes for sweet potato',
    cook: null,
    shop: 'Sweet potatoes',
  },
  no_chili_oil: {
    clears: ['sesame'],
    // Kevin's own ruling: anywhere a dish calls for chili oil he can simply
    // leave it out. That turns sesame from a killer into a note.
    say: 'leave the chili oil out',
    cook: null,
    shop: null,
  },
  no_beans: {
    clears: ['legume'],
    say: 'leave the beans out',
    cook: null,
    shop: null,
  },
  no_peas: {
    clears: ['legume'],
    say: 'leave the peas out',
    cook: null,
    shop: null,
  },
};

// ── Items with no recipe data, excluded until Kevin fills them in ──────────
//
// The five finishing sauces carry no recipe lines anywhere in the registry, so
// nothing can be scanned and nothing should be guessed. Kevin does not have
// the recipes to hand (Jul 29) and ruled them out of the filter entirely.
// Miso Butter is obviously legume regardless. These never reach the Carl menu.
export const CARL_EXCLUDED = {
  chimichurri: 'no recipe lines in the registry — unscannable, and permanently excluded by Kevin rather than guessed at',
  romesco: 'no recipe lines in the registry — unscannable, and permanently excluded by Kevin rather than guessed at',
  chermoula: 'no recipe lines in the registry — unscannable, and permanently excluded by Kevin rather than guessed at',
  'miso-butter-sauce': 'miso is fermented soybean; also unscannable',
  'whipped-lemon-garlic-herb': 'no recipe lines, and unknown whether it uses the soy lecithin platform',
};

// ── Rulings, keyed by item id then Carl category ───────────────────────────
//
//   { swap: 'id' }                — one swap resolves it
//   { swap: ['a','b'] }           — needs both
//   { dead: 'reason' }            — load-bearing, no substitution
//   { ..., variants: [labels] }   — the ruling applies to these variants only;
//                                   other variants are unaffected
//
// Every ruling is a judgment about whether the ingredient IS the dish. These
// are Kevin's calls to make; what is here is a first pass for him to correct,
// which is faster for him than a blank table.
export const CARL_RULINGS = {
  // ── Dinners ──────────────────────────────────────────────────────────────
  'brunswick-stew': {
    legume: { dead: 'the lima beans are non-negotiable (Kevin, Jul 29) — canonical to Brunswick and named in the dish copy' },
    potato: { swap: 'sweet_potato' },
  },
  chili: {
    // Two carriers in one category: Marmite is barley, and the same batch line
    // carries soy sauce.
    gluten: { swap: ['no_marmite', 'coconut_aminos'] },
    legume: { swap: ['no_beans', 'coconut_aminos'] },
  },
  gumbo: {
    // Kevin's ruling: this is a super dark roux, and that roux IS the dish —
    // his own menu copy says cooked dark and slow. Rice flour cannot get there.
    // A filé or okra gumbo would be a legitimate alternative rather than an
    // imitation of this one (both are in gumbo's actual ancestry), but that is
    // a different dish and would need its own record, not a swap on this one.
    gluten: { dead: 'the dark roux is the backbone of the dish, not a thickener' },
  },
  'tex-mex-kit': {
    gluten: { swap: 'corn_tortillas' },
    // A kit's components are discrete, which makes it the most swap-friendly
    // format on the board.
    legume: { swap: 'no_beans' },
  },
  'indian-style-curry': {
    legume: {
      dead: 'chickpeas are the protein on this variant, not a component',
      variants: ['Chickpea, Small (~4-5)', 'Chickpea, Large (~8-10)'],
    },
  },
  'leblanc-inspired-japanese': {
    // Same ruling as Gumbo: Kevin takes this roux very dark too.
    gluten: { dead: 'the roux is taken super dark, which rice flour cannot reach' },
  },
  'tea-smoked-chicken-with': {
    egg: { dead: 'Alabama white sauce is mayonnaise; the egg is the sauce and the sauce is in the name' },
  },
  'bo-ssam': {
    // No ssamjang in this one (Kevin, Jul 29), so the soy sauce is the only
    // legume and the swap carries the whole dish.
    gluten: { swap: 'coconut_aminos' },
    legume: { swap: 'coconut_aminos' },
  },
  'cumin-mushroom-noodles-cumin': {
    mushroom: {
      dead: 'mushroom is the protein on this variant',
      variants: [
        'Mushroom, Small (~3-4)', 'Mushroom, Large (~6-8)',
        'Mushroom, Small (~3-4) + Asian Greens (1/2 lb)', 'Mushroom, Large (~6-8) + Asian Greens (1 lb)',
      ],
    },
    // The Beef and Lamb variants are served on rice, not noodles, so the
    // noodle gluten only lands on variants already dead above. The soy in the
    // cumin batch line hits every variant.
    gluten: { swap: 'coconut_aminos' },
    legume: { swap: 'coconut_aminos' },
    sesame: { swap: 'no_chili_oil' },
  },
  'mapo-eggplant': {
    legume: { dead: 'doubanjiang is fermented broad bean and it is what makes this mapo' },
  },
  'shrimp-or-tofu-with': {
    legume: { dead: 'black bean sauce is the dish, and the tofu variants are legume twice over' },
  },
  'stir-fried-long-beans-with': {
    legume: { dead: 'long beans are the dish' },
  },
  'texas-gulf-shrimp-or-tofu': {
    legume: [
      { dead: 'tofu is the protein on this variant', variants: ['Tofu, Small Batch (~4)', 'Tofu, Large Batch (~8)'] },
      { swap: 'coconut_aminos' },
    ],
    gluten: { swap: ['coconut_aminos', 'gf_oyster_sauce'] },
    sesame: { swap: 'no_chili_oil' },
  },
  'thai-basil-chicken-pad': {
    // Fish sauce stays: fish is not on Carl's list.
    gluten: { swap: ['coconut_aminos', 'gf_oyster_sauce'] },
    legume: { swap: 'coconut_aminos' },
  },
  bolognese: {
    gluten: { swap: 'gf_pasta' },
    egg: { swap: 'gf_pasta' },
  },
  'pasta-with-homegrown-tomato': {
    gluten: { swap: 'gf_pasta' },
    // Mushrooms are a paid variant addition here, not a base ingredient, so
    // there is nothing to remove from the other two variants.
    mushroom: { dead: 'mushroom is the variant', variants: ['With Mushrooms', 'With Both'] },
  },
  'orecchiette-with-bitter': {
    // The shape is in the name and gluten-free orecchiette is rare. A short
    // gluten-free shape works; whether it can still be called this is Kevin's.
    gluten: { swap: 'gf_pasta' },
  },
  'pappardelle-with-vegetables': {
    gluten: { swap: 'gf_pasta' },
    egg: { swap: 'gf_pasta' },
    // Peas are one of the spring vegetables the dish is about. Leaning harder
    // on the asparagus is the intended read.
    legume: { swap: 'no_peas' },
  },
  'saffron-pork-ragu': {
    gluten: { swap: 'gf_pasta' },
  },
  'pork-with-mustard-tarragon': {
    gluten: { swap: 'gf_pasta' },
    egg: { swap: 'gf_pasta' },
  },
  'mushroom-ragu': {
    mushroom: { dead: 'mushroom is the dish' },
  },
  'coriander-lamb-steak-over': {
    legume: { dead: 'the gigantes are non-negotiable (Kevin, Jul 29) — they are in the name, and without them it is a different dish' },
  },
  'pork-chop-with-kabocha-pur-e': {},   // clean, no swap needed
  'bone-in-pork-rib-chop-with': {
    legume: { swap: 'sunflower_lecithin' },
  },
  'steak-au-poivre': {
    potato: { swap: 'sweet_potato' },
    legume: { swap: 'sunflower_lecithin' },
  },
  'boeuf-bourguignon-beef-stew': {
    // The braising vegetables are discarded and replaced with fresh sous vide
    // veg at the end anyway, so pulling the mushrooms costs this dish less
    // than it would cost most.
    // Same as Homegrown Tomato: mushrooms are a variant addition, and the base
    // variant never had them. The braising veg are discarded and replaced with
    // fresh sous vide veg anyway.
    mushroom: { dead: 'mushroom is the variant', variants: ['With 1 lb mushrooms'] },
    potato: { swap: 'sweet_potato' },
    gluten: { swap: 'xanthan_thickener' },
  },
  'pecan-mole-fesenjan-beef-and': {
    // Went live on the customer menu Jul 29. Mitad-y-mitad is half wheat, half
    // corn, so a pure corn tortilla is a clean swap and the tortillas are the
    // ONLY thing on the plate Carl reacts to.
    //
    // ONE THING TO CHECK, and it is the reason this dish moved the chocolate
    // question off the moot list: the sauce carries 100% unsweetened chocolate,
    // and commercial chocolate often carries SOY LECITHIN, which is a legume
    // and which Kevin ruled counts at trace. Most 100% baking chocolate is pure
    // cocoa mass with no lecithin, but some brands add it, and this is now the
    // only LIVE dish where it matters — every other chocolate dish is already
    // dead on gluten, egg, or peanut. It is a label check, not a judgment call,
    // so it is not guessed at here. If the bar lists lecithin, add
    // chocolate_100 to CARL_PATTERNS.legume and this dish becomes dead.
    gluten: { swap: 'corn_tortillas' },
  },

  // ── Always-items ─────────────────────────────────────────────────────────
  'homemade-waffles': {
    gluten: { dead: 'flour and egg are both structural in a waffle batter' },
    egg: { dead: 'flour and egg are both structural in a waffle batter' },
  },
  'fresh-cut-pineapple': {},
  'seasonal-cantaloupe': {},
  'chocolate-chip-cookies': {
    gluten: { dead: 'a gluten-free flour blend is possible but this is not that recipe' },
    egg: { dead: 'egg is structural' },
  },
  'peanut-butter-fudge': {
    legume: { dead: 'peanuts are legumes and peanut butter is the item' },
  },
  brownies: {
    gluten: { dead: 'brownies tolerate gluten-free flour well, but this is not that recipe' },
    egg: { dead: 'egg is structural' },
  },
  queso: {},
  'pickled-onions-or-carrots': {},
  'chili-oil': {
    sesame: { dead: 'toasted sesame is the oil; there is nothing to remove it from' },
  },
  'thyme-or-lavender-syrup': {},
  'vanilla-syrup': {},
  'vanilla-lavender-syrup': {},
  'filet-mignon': {}, 'filet-mignon-prime': {}, 'flank-steak': {},
  'ny-strip': {}, 'ny-strip-prime': {}, ribeye: {}, 'ribeye-prime': {},
  // Grass fed tier, Jul 30. Clean for Carl exactly as the other grades are:
  // the only thing in the bag is butter and thyme, and dairy is not on his list.
  'filet-mignon-grassfed': {}, 'ny-strip-grassfed': {}, 'ribeye-grassfed': {},
  'pork-tenderloin': {}, 'thick-cut-pork-chop': {}, 'air-chilled-chicken-breast': {},
  carrots: {}, 'corn-off-the-cob': {}, 'kabocha-squash': {},
  parsnips: {}, asparagus: {}, 'garlic-confit': {},
  'baby-gold-potatoes': {
    potato: { dead: 'the item is the potato' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════

function matches(category, id) {
  if (!id) return false;
  if (CARL_ALLOW[category] && CARL_ALLOW[category].has(id)) return false;
  return CARL_PATTERNS[category].test(id);
}

// Which of Carl's categories a variant trips, and what tripped them.
// `resolved` is the output of resolveDishVariant (may be null).
export function carlScan(item, resolved) {
  const hits = {};
  const add = (cat, why) => {
    if (!hits[cat]) hits[cat] = [];
    if (!hits[cat].includes(why)) hits[cat].push(why);
  };
  for (const x of resolved || []) {
    for (const cat of CARL_CATEGORIES) if (matches(cat, x.id)) add(cat, x.id);
  }
  // Layer two: declared tags catch what composed lines hide.
  for (const tag of Object.keys(item.allergens || {})) {
    const cat = DECLARED_TO_CATEGORY[tag];
    if (cat) add(cat, 'declared:' + tag);
  }
  return hits;
}

// Normalize a ruling entry to the list of rulings that apply to this variant.
function rulingsFor(itemId, category, variantLabel) {
  const forItem = CARL_RULINGS[itemId];
  if (!forItem) return null;              // unknown item — caller fails closed
  const raw = forItem[category];
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.filter(r => !r.variants || r.variants.includes(variantLabel));
}

// The verdict for one item variant.
//
//   { verdict, swaps, sentence, cookNotes, shopping, blocked, unknown }
//
// verdict is 'clean' | 'swap' | 'dead'. Fails closed: an item with no ruling
// entry, or a tripped category with no ruling, comes back 'dead' with the
// reason recorded, so a new dish can never quietly appear on the Carl menu.
export function carlStatus(item, variantLabel, resolved) {
  const id = item.id;
  if (CARL_EXCLUDED[id]) {
    return { verdict: 'dead', swaps: [], sentence: null, cookNotes: [], shopping: [], blocked: [{ category: null, reason: CARL_EXCLUDED[id] }], unknown: false };
  }
  if (!CARL_RULINGS[id]) {
    return { verdict: 'dead', swaps: [], sentence: null, cookNotes: [], shopping: [], blocked: [{ category: null, reason: 'no Carl ruling on record for this item — add one to CARL_RULINGS' }], unknown: true };
  }

  const hits = carlScan(item, resolved);
  const swaps = [];
  const blocked = [];

  for (const category of Object.keys(hits)) {
    const rulings = rulingsFor(id, category, variantLabel);
    if (!rulings.length) {
      blocked.push({ category, reason: `${category} appears (${hits[category].join(', ')}) with no ruling for this variant` });
      continue;
    }
    const dead = rulings.find(r => r.dead);
    if (dead) { blocked.push({ category, reason: dead.dead }); continue; }
    for (const r of rulings) {
      for (const s of (Array.isArray(r.swap) ? r.swap : [r.swap])) {
        if (!SWAPS[s]) { blocked.push({ category, reason: `ruling names unknown swap '${s}'` }); continue; }
        if (!swaps.includes(s)) swaps.push(s);
      }
    }
  }

  if (blocked.length) {
    return { verdict: 'dead', swaps: [], sentence: null, cookNotes: [], shopping: [], blocked, unknown: false };
  }
  return {
    verdict: swaps.length ? 'swap' : 'clean',
    swaps,
    sentence: carlSentence(swaps),
    cookNotes: swaps.map(s => SWAPS[s].cook).filter(Boolean),
    shopping: swaps.map(s => SWAPS[s].shop).filter(Boolean),
    blocked: [],
    unknown: false,
  };
}

// The yellow line on the Carl menu. Null when there is nothing to say.
export function carlSentence(swaps) {
  const says = swaps.map(s => SWAPS[s] && SWAPS[s].say).filter(Boolean);
  if (!says.length) return null;
  const joined = says.length === 1
    ? says[0]
    : says.slice(0, -1).join(', ') + ' and ' + says[says.length - 1];
  return 'For Carl, we ' + joined + '.';
}

// One card's worth of Carl state, collapsed from its variants.
//
// SHARED BY BOTH SURFACES ON PURPOSE. tools/syncMainMenu.mjs stamps the static
// catalog cards from this, and the carlData generator in tools/buildPages.mjs
// emits the weekly menu's blob from it. It lived in syncMainMenu first and was
// about to be copied into the generator; two copies of this collapse would
// drift, and then the two menus would quietly disagree about the same dish.
//
//   verdict — worst case across the card's variants ('ok' | 'swap' | 'no')
//   say     — the composed yellow line, or '' when nothing changes
//   dead    — indices of variants dead for Carl, POSITIONAL against the order
//             the item declares them in, which is the order both surfaces
//             render price rows in
export function carlCardSummary(item, resolve) {
  const per = (item.variants || []).map(v => carlStatus(item, v.label, resolve ? resolve(item.name, v.label) : null));
  const dead = per.map((st, i) => (st.verdict === 'dead' ? i : -1)).filter(i => i >= 0);
  const alive = per.filter(st => st.verdict !== 'dead');
  if (!alive.length) return { verdict: 'no', say: '', dead };
  const swaps = [];
  for (const st of alive) for (const sw of st.swaps) if (!swaps.includes(sw)) swaps.push(sw);
  return { verdict: swaps.length ? 'swap' : 'ok', say: swaps.length ? carlSentence(swaps) : '', dead };
}

// Every variant of every item, filtered to what Carl can actually have.
// `resolve` is injected so this file never imports dishCosting (keeps it
// usable from customer page builders that must not pull the costing engine).
export function carlMenu(items, resolve) {
  const out = [];
  for (const item of items) {
    for (const v of item.variants || []) {
      const st = carlStatus(item, v.label, resolve ? resolve(item.name, v.label) : null);
      if (st.verdict !== 'dead') out.push({ item, variant: v.label, ...st });
    }
  }
  return out;
}

// Deduplicated shopping additions for a week's Carl orders.
export function carlShoppingAdditions(statuses) {
  const seen = [];
  for (const st of statuses) for (const s of st.shopping || []) if (!seen.includes(s)) seen.push(s);
  return seen;
}
