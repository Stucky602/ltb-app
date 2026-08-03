// dishTags.js — Kevin's own words for what kind of thing a dish is.
//
// ═══════════════════════════════════════════════════════════════════════════
// A TAG IS A CROSSLINK, NOT A CLASSIFICATION
//
// His framing, and the single most important thing here:
//
//   "I'm including pasta sauce on this as it sorta is and I want to ensure
//    it'll crosslink with the italian ones."
//
// He did it twice — Chili and the Pork with Mustard Tarragon — so it is a habit
// rather than a slip. **Chili is a pasta sauce because he says it is.**
//
//   * DO NOT tighten this into a taxonomy.
//   * DO NOT remove a tag for being technically inaccurate.
//   * A validator that objects to Chili being a pasta sauce has misread the
//     feature. There is no such validator here, deliberately.
//
// Tags are NOT exclusive, which is exactly what `cuisine` could not express.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS WALK MATTERED
//
// Stir fry lands on SIX dishes. Those six were split across Chinese and Thai in
// `cuisine`, so the strongest recommendation rule — "you have had every other
// stir fry" — could never fire. `cuisine` has one dish in most of its values.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARIANT-SCOPED, BECAUSE ONE MENU ENTRY CAN BE TWO DISHES
//
// Cumin Mushroom Noodles and Cumin Beef or Lamb on Rice are ONE registry entry
// with variants, and they carry DIFFERENT tags — the noodles are a pasta sauce,
// the rice version is not. Flattening them onto the parent would put a pasta
// sauce tag on a rice dish and crosslink it to the Italians, which is the exact
// opposite of what the tag is for.

export const TAG_VOCABULARY = [
  'stir fry', 'pasta sauce', 'comfort food', 'braise', 'soup or stew',
  'curry', 'grilled or seared', 'kit',
  // Coined mid-walk by Kevin. `roux` is scoped to exactly two dishes and goes
  // nowhere else; he was explicit about that.
  'roux', 'smoked',
];

// Per dish. A `variants` block overrides the dish-level list for labels it
// matches — see the header for why that is not optional.
export const DISH_TAGS = {
  'Bolognese': { tags: ['comfort food', 'pasta sauce'],
    // THE ONLY NEGATIVE ON RECORD, and worth keeping as one: he ruled Bolognese
    // is explicitly NOT a soup or stew. A future pass that "helpfully" adds it
    // would be re-deciding something he decided.
    not: ['soup or stew'] },
  'Boeuf Bourguignon (Beef Stew)': { tags: ['braise', 'comfort food', 'soup or stew'] },
  'Leblanc Inspired Japanese Curry': { tags: ['curry', 'comfort food', 'braise', 'roux'] },
  'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice': {
    tags: [],
    variants: [
      { match: /mushroom|noodle/i, tags: ['stir fry', 'pasta sauce'] },
      { match: /beef|lamb|rice/i, tags: ['stir fry'] },
    ],
  },
  'Chili': { tags: ['comfort food', 'soup or stew', 'pasta sauce'] },
  'Gumbo': { tags: ['soup or stew', 'comfort food', 'roux'] },
  'Mushroom Ragu': { tags: ['pasta sauce'] },
  'Pappardelle with Vegetables and Mint': { tags: ['pasta sauce'] },
  'Brunswick Stew': { tags: ['soup or stew', 'comfort food'] },
  'Steak au Poivre': { tags: ['grilled or seared'] },
  'Pasta with Homegrown Tomato Sauce': { tags: ['pasta sauce', 'comfort food'] },
  'Thai Basil Chicken (Pad Krapow Gai)': { tags: ['stir fry'] },
  'Indian Style Curry': { tags: ['curry', 'comfort food', 'braise'] },
  'Tex-Mex Kit': { tags: ['kit', 'braise'] },
  'Pecan Mole-Fesenjan, Beef and Kabocha': { tags: ['braise', 'comfort food'] },
  'Saffron Pork Ragu': { tags: ['pasta sauce'] },
  'Orecchiette with Bitter Greens and Anchovies': { tags: ['pasta sauce'] },
  'Pork Chop with Kabocha Purée and Charred Broccolini': { tags: ['grilled or seared'] },
  'Pork with Mustard Tarragon Cream Sauce': { tags: ['grilled or seared', 'pasta sauce'] },
  'Tea-Smoked Chicken with Dashi Polenta and Alabama White Sauce': { tags: ['grilled or seared', 'smoked'] },
  'Mapo Eggplant': { tags: ['comfort food', 'braise'] },
  'Shrimp or Tofu with Asparagus in Black Bean Sauce': { tags: ['stir fry'] },
  'Stir Fried Long Beans with Ground Pork or Tofu': { tags: ['stir fry'] },
  'Texas Gulf Shrimp or Tofu and Chinese Broccoli': { tags: ['stir fry'] },
  // BO SSAM IS PARKED, NOT UNTAGGED. No tag fitted and Kevin said he would
  // think of one. Recorded as parked so nothing treats the absence as an
  // answer, and NOTHING here proposes a tag for him.
  'Bo Ssam': { tags: [], parked: true },
};

// A TAG CAN CARRY REQUIRED COPY, attached per dish per tag.
//
// Kevin: "Make a note though that if this is listed as a recommendation because
// of it that it'll specifically say (Seriously, try it with macaroni)."
//
// It rides the RECOMMENDATION, not the dish — a general blurb on the dish page
// would say it to people who were not being told anything about pasta sauce.
export const TAG_COPY = {
  'Chili': { 'pasta sauce': 'Seriously, try it with macaroni.' },
};

export function tagsFor(dishName, variantLabel) {
  const entry = DISH_TAGS[dishName];
  if (!entry) return [];
  const v = (entry.variants || []).find(x => x.match && x.match.test(String(variantLabel || '')));
  return [...new Set((v ? v.tags : entry.tags) || [])];
}

export function isParked(dishName) {
  return !!(DISH_TAGS[dishName] && DISH_TAGS[dishName].parked);
}

// The recorded negatives. Kept so a later pass cannot quietly re-add one.
export function excludedTags(dishName) {
  const entry = DISH_TAGS[dishName];
  return (entry && entry.not) || [];
}

export function copyFor(dishName, tag) {
  return (TAG_COPY[dishName] && TAG_COPY[dishName][tag]) || null;
}

// EVERY tag a dish carries, dish-level and across all its variants.
//
// `tagsFor` answers for ONE variant, which is right when recommending a
// specific thing. Counting how many dishes carry a tag is a different question,
// and asking it through `tagsFor` with no variant silently dropped the Cumin
// entry entirely — its dish-level list is empty and everything lives on the
// variants. That put stir fry at 4 instead of Kevin's 6, which is exactly the
// number the whole walk existed to raise.
export function allTagsFor(dishName) {
  const entry = DISH_TAGS[dishName];
  if (!entry) return [];
  const fromVariants = (entry.variants || []).flatMap(v => v.tags || []);
  return [...new Set([...(entry.tags || []), ...fromVariants])];
}

// COUNTED PER TAGGABLE UNIT, NOT PER REGISTRY ENTRY.
//
// Kevin's table lists Cumin Mushroom Noodles and Cumin Beef or Lamb on Rice as
// two rows, both stir fry — and that is right for what a tag is FOR. They are
// one menu entry but two things a customer orders and two things "you have had
// every other stir fry" has to count. Counting the entry once put stir fry at
// 5 against his 6.
//
// So a dish with variant-scoped tags contributes one unit per variant group,
// and a plain dish contributes one.
export function taggableUnits() {
  const units = [];
  for (const [name, entry] of Object.entries(DISH_TAGS)) {
    if (entry.variants && entry.variants.length) {
      for (const v of entry.variants) units.push({ dishName: name, variant: v, tags: v.tags || [] });
      continue;
    }
    units.push({ dishName: name, variant: null, tags: entry.tags || [] });
  }
  return units;
}

export function dishesWithTag(tag, dishNames) {
  const allow = dishNames ? new Set(dishNames) : null;
  return taggableUnits()
    .filter(u => (!allow || allow.has(u.dishName)) && u.tags.includes(tag))
    .map(u => u.dishName);
}

// ── Recommender weighting ───────────────────────────────────────────────────
//
// COMFORT FOOD NEEDS DAMPENING, NOT FEWER TAGS. Kevin was offered trimming the
// tag and splitting it, and chose neither: "Find a method when we actually do
// implementation to not have it fire as much or weigh it different or
// something."
//
// So the tag stays on all ten dishes — it is true of all ten — and the
// RECOMMENDER treats a broad tag as weaker evidence. "You have had every other
// comfort food" across ten dishes is a much emptier observation than the same
// sentence about the six stir-fries, and a rule that cannot tell them apart
// will fire constantly on the one that means least.
export const BROAD_TAG_THRESHOLD = 8;

export function tagBreadth(tag) {
  return dishesWithTag(tag).length;
}

// True for a tag that spans so much of the menu that "you have had every other
// one" says almost nothing.
export function isBroadTag(tag) {
  return tagBreadth(tag) >= BROAD_TAG_THRESHOLD;
}

// `kit` and `smoked` sit on one dish each and group NOTHING. Left in
// deliberately — they may earn their place as menu filters even though they can
// never drive a crosslink recommendation.
export function isSingletonTag(tag) {
  return tagBreadth(tag) <= 1;
}

export function tagTally() {
  const out = {};
  for (const tag of TAG_VOCABULARY) out[tag] = tagBreadth(tag);
  return out;
}
