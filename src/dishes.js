// ═══════════════════════════════════════════════════════════════════════════
// THE DISH REGISTRY — single source of truth for every dish.
// ═══════════════════════════════════════════════════════════════════════════
// One record per dish. Everything the app knows about a dish lives HERE:
//
//   name        — exact dish name (the key used everywhere)
//   cuisine     — loose cuisine bucket for Regulars insights (dinners only)
//   variants    — [{ label, price, cost }] — cost is the BUFFERED anchor
//                 (MARGIN_BUFFER 1.0825 baked in; see dishCosting.js)
//   recipe      — { factors, base, extras } per-batch ingredients
//   reheat      — shared reheat bucket id ('bagged'|'stovetop'|'pasta'|'kit'),
//                 or absent for dishes with fully dedicated card logic
//                 (Bo Ssam) — that logic lives in recipes.js buildReheatBlocks
//   rice        — true if the dish ships uncooked rice (drives the rice
//                 container surcharge + "cook the included rice" copy)
//   pasta       — true if it ships uncooked pasta
//   noodle      — true if it ships fresh noodles
//   baggedPasta — true for bagged dishes finished by mixing with cooked pasta
//   stewVegCopy — { main, veg } dedicated 2-paragraph reheat copy (Boeuf/Leblanc)
//   equipment   — kitchen-capacity claims for the conflict checker:
//                 { fixed:[...], flexible:[...], tofu:true, polenta:true }
//                 resource ids: 'wok','dutch','backBurner','largePot',
//                               'ovenNormal','ovenLow'
//   packaging   — 'jar' ($2 wrap) | 'none' ($0) | absent (default $1 wrap)
//   perLb       — priced by weight (sous vide proteins): pricePerLb, costPerLb
//
// ADDING OR RENAMING A DISH IS A CHANGE TO THIS FILE ONLY (plus customer copy
// in menu.html LIBRARY + a main-menu.html card, which `npm test` validates
// against this registry — a miss fails the build check, never silently).
//
// menu.js, recipes.js, dishCosting.js, equipmentConflict.js, and utils.js all
// DERIVE their dish data from this file. Do not re-declare dish facts there.
// ═══════════════════════════════════════════════════════════════════════════

// Recipe-line helper (was in recipes.js; re-exported from there for compat)
export const I = (name, q, u, staple = false) => ({ name, q, u, staple });

// ── DINNERS (order here = display order everywhere) ─────────────────────────
export const DISHES = [
  // ── American / Southern / Tex-Mex ─────────────────────────────────────────
    {
    name: 'Brunswick Stew',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "A thick Southern stew with shredded braised chicken thighs, corn, lima beans, and tomato, simmered down until everything melds. Smoked paprika does the heavy lifting on the smoke. Hearty and a little sweet.",
      reheat: "Comes in two parts: the stew in a container and the potatoes in a sous vide bag. Warm the stew gently on the stove over medium-low. The potatoes are the easy part here, and they do not need their own pot. Cut the bag open and discard the thyme and the liquid, but not down the drain since there is butter in it. Tip the potatoes straight into the stew and let everything come up to temperature together until heated through.",
      contains: "Dairy (butter, in the potato bag).",
      pairings: [
        { id: "sweet_tea", drink: "Sweet iced tea", why: "the Southern table default for a stew this smoky and sweet" },
        { id: "amber_lager", drink: "Amber lager", why: "malt against smoked pork and tomato without adding weight" },
        { id: "zinfandel", drink: "Zinfandel", why: "jammy enough for the barbecue register, acid enough for the tomato" },
        { id: "cheerwine", drink: "Cheerwine", why: "the Carolina soda logic: cherry sweetness next to smoke" },
        { id: "unsweet_tea", drink: "Unsweetened iced tea with lemon", why: "the same table, minus the sugar" },
      ],
      wineStyles: ['light_red', 'bold_red', 'off_dry_white'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: { variants: true, unlisted: "butter in the Sous-vide-bag-plus-butter-plus-herbs line, which resolves to sv_bag" } },
    // Brunswick's potato bag does NOT follow the Boeuf/Leblanc "simmer the bag,
    // then fold in" pattern. The stew is already going on the stove, so the
    // potatoes just get tipped in cold and come up to temp with everything else
    // (Kevin, Jul 15). Without this entry the dish falls to the generic stovetop
    // card, which says "comes in a container" and never mentions the bag at all.
    stewVegCopy: {
      main: 'Comes in two parts: the stew in a container and the potatoes in a sous vide bag. Warm the stew gently on the stove over medium-low.',
      veg: 'The potatoes are the easy part here, and they do not need their own pot. Cut the bag open and discard the thyme and the liquid, but not down the drain since there is butter in it. Tip the potatoes straight into the stew and let everything come up to temperature together until heated through.',
    },
    cuisine: 'Southern',
    reheat: 'stovetop',
    equipment: { flexible: ['dutch', 'largePot'], fixed: ['ovenLow'] },
    variants: [
      { label: 'Small (~4)', price: 35, cost: 17.46 },
      { label: 'Large (~8)', price: 65, cost: 33.83 },
    ],
    recipe: {
      factors: { 'Small (~4)': 1, 'Large (~8)': 2 },
      base: [
        I('Chicken thighs', 1, 'lb'),
        I('Salt pork', 2, 'oz'),
        I('Chicken stock', 4, 'cups'),
        I('Canned tomatoes', 1, '14oz can'),
        I('Red potatoes', 0.5, 'lb'),
        I('Onion', 1, 'lb'),
        I('Corn', 3, 'ears'),
        I('Dried lima beans', 5, 'oz'),
        I('Vinegar + smoked paprika', 1, 'batch', true), // Jul 15: was 'Worcestershire + vinegar + flour'. There is no flour and no
        // Worcestershire in this stew and there never was — the line was wrong,
        // and it was declaring a Gluten and a Fish allergen the dish doesn't have.
      ],
      // ONE sous vide bag per dish (corn + potatoes cooked as a bagged
      // component). Per-variant + fixed so it never doubles under the ×2
      // Large factor: $2 bag on Small, one longer $3 bag on Large.
      extras: {
        'Small (~4)': [{ ...I('Sous vide bag + butter + herbs (costed)', 1, ''), fixed: true }],
        'Large (~8)': [{ ...I('Sous vide bag + butter + herbs (costed, large)', 1, ''), fixed: true }],
      },
    },
  },
  {
    name: 'Chili',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "A slow-built chili with a real chile backbone and a lot of depth. The kind that makes you wonder what's in it — and there's quite a bit going on under the hood. Rich, meaty, and better the next day.",
      reheat: "Comes in a container. Warm gently on the stove over medium.",
      contains: "Gluten (soy sauce), Fish (anchovies), Soy, may contain Dairy. This chili contains some unconventional ingredients. If you have specific allergen concerns, always ask before ordering.",
      pairings: [
        { id: "shiner_bock", drink: "Shiner Bock", why: "the Texas answer; dark lager sweetness sits under chile heat without fighting it" },
        { id: "zinfandel", drink: "Zinfandel", why: "jammy fruit and enough body for beef and dried chiles" },
        { id: "sparkling_water", drink: "Topo Chico with lime", why: "mineral bubbles against the fat; also the most Texas zero-proof answer there is" },
        { id: "big_red", drink: "Big Red", why: "the Waco soda; barbecue-joint credentials and sugar that genuinely works against capsaicin" },
        { id: "horchata", drink: "Horchata", why: "the cooling rice-cinnamon logic Mexico applies to chile heat, and it works on a bowl of red" },
      ],
      wineStyles: ['bold_red', 'light_red'],
      note: "Happy to grab fixings at cost: tortilla chips, cheddar, sour cream, or macaroni. There's a spot for it on the order form. Trust me on the macaroni.",
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { gluten: { variants: true, unlisted: "soy sauce (wheat) inside the Marmite + soy + spices line, which resolves to spices_generic" }, fish: true, soy: { variants: true, unlisted: "soy sauce inside the Marmite + soy + spices line, which resolves to spices_generic" } },
    options: { fixings: { prompt: 'Need some fixings at cost? Chips, sour cream, cheese, etc.', placeholder: 'e.g. tortilla chips, sour cream, cheddar' } },
    cuisine: 'American',
    reheat: 'stovetop',
    equipment: { fixed: ['largePot'] },
    variants: [
      { label: 'Small (split order, ~3-4)', price: 45, cost: 18.57 },
      { label: 'Large (~6-8)', price: 80, cost: 37.14 },
    ],
    recipe: {
      factors: { 'Small (split order, ~3-4)': 0.5, 'Large (~6-8)': 1 },
      base: [
        I('Ground beef', 2, 'lb'),
        I('Dried kidney beans', 1, 'lb'),
        I('Assorted dried chilis', 1, 'bag'),
        I('Chicken broth', 4, 'cups'),
        I('Canned tomatoes', 1, '28oz can'),
        I('100% dark chocolate', 2, 'square'),
        I('Anchovies', 3.5, 'fillet'), // Kevin's jar $6.07 / ~20 fillets = $0.30/fillet; uses 3-4 FILLETS/batch (never tins/jars), midpoint 3.5
        I('Tomato paste', 1, 'small can'),
        I('Limes', 1, ''),
        I('Espresso', 2, 'shot'),
        I('Bourbon', 2, 'oz'),
        I('Marmite + soy + spices', 1, 'batch', true),
      ],
    },
  },
  {
    name: 'Gumbo',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "A proper roux-based gumbo, cooked dark and slow with chicken thighs, Texas Gulf shrimp, and the holy trinity. Made for rice. The small comes in two containers (~4 servings), the large in four (~8).",
      reheat: "The minimum batch size is the Large, so the Small option is only available when splitting a Large between orders. Uncooked rice included.",
      contains: "Gluten (flour), Shellfish (shrimp).",
      pairings: [
        { id: "abita_amber", drink: "Abita Amber", why: "the New Orleans table beer; caramel malt under a dark roux" },
        { id: "riesling", drink: "Off-dry Riesling", why: "a little sweetness against the cayenne, acid against the roux" },
        { id: "sweet_tea", drink: "Sweet tea", why: "the Louisiana default, and the sugar cools the heat" },
        { id: "chenin_blanc", drink: "Chenin Blanc", why: "honeyed body that stands up to a dark roux where lighter whites drown" },
        { id: "chicory_coffee", drink: "Chicory coffee, after", why: "the New Orleans finish more than a pairing; the roasted bitterness echoes the roux" },
      ],
      wineStyles: ['off_dry_white', 'rich_white', 'crisp_white'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { gluten: true, shellfish: true },
    cuisine: 'Southern',
    reheat: 'stovetop',
    rice: true,
    equipment: { fixed: ['dutch'] },
    servings: { small: 4, large: 8 },
    variants: [
      { label: 'Small (split order, ~4)', price: 50, cost: 23.33 },
      { label: 'Large (~8)', price: 90, cost: 46.66 },
    ],
    recipe: {
      factors: { 'Small (split order, ~4)': 0.5, 'Large (~8)': 1 },
      base: [
        I('Chicken thighs', 2, 'lb'),
        I('Texas Gulf Shrimp', 2, 'lb'),
        I('Onion', 1, ''),
        I('Green bell pepper', 1, ''),
        I('Celery', 3, 'stalks'),
        I('Garlic', 4, 'cloves'),
        I('Flour', 1, 'cup'),
        I('Filé powder', 1, 'tbsp', true),
        I('Cajun spices', 1, 'blend', true),
        I('Rice (included with order)', 1, 'batch', true),
      ],
    },
  },
  {
    name: 'Tex-Mex Kit',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "A build-your-own kit with your choice of protein — pulled pork or beef — slow simmered until it falls apart in a citrusy red chile sauce. Comes with refried beans (in a separate bag for easy reheating), pico de gallo, and HEB bakery flour tortillas (10-pack for small, 20-pack for large). Build tacos, bowls, or whatever you're in the mood for. Pairs great with the pickled onion add-on. Need extras like avocados or more tortillas? I can grab them at cost, there's a spot for it on the order form.",
      reheat: "Components travel separately with assembly notes. Warm the protein gently before building. Reheat the beans bag in simmering water or microwave sealed.",
      contains: "Gluten (flour tortillas). May contain Dairy. Ask for specifics.",
      pairings: [
        { id: "lager", drink: "Mexican lager with lime", why: "the taqueria answer; crisp, cold, and out of the way" },
        { id: "margarita", drink: "Margarita on the rocks", why: "lime and salt are already in the dish's logic; the classic for a reason" },
        { id: "jamaica", drink: "Agua de jamaica", why: "hibiscus: tart, cold, and the deepest red on the table" },
        { id: "sparkling_water", drink: "Topo Chico", why: "bubbles and minerals to reset between bites" },
        { id: "rose", drink: "Dry rosé, cold", why: "the taco truck won't pour it but it works: cold, dry, and friendly with lime and chile" },
      ],
      wineStyles: ['rose', 'sparkling', 'crisp_white'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { gluten: true },
    options: { fixings: { prompt: 'Need extras at cost? Avocados, more tortillas, etc.', placeholder: 'e.g. 3 avocados, extra tortillas' } },
    cuisine: 'Tex-Mex',
    reheat: 'kit',
    equipment: { fixed: ['dutch', 'largePot', 'ovenLow'] },
    servings: { small: 5.5, large: 9.5, bound: true },
    variants: [
      { label: 'Pulled Pork, Small (~5-6)', price: 42, cost: 19.21 },
      { label: 'Pulled Pork, Large (~9-10)', price: 80, cost: 37.42 },
      { label: 'Pulled Beef, Small (~5-6)', price: 60, cost: 28.05 },
      { label: 'Pulled Beef, Large (~9-10)', price: 115, cost: 55.1 },
    ],
    recipe: {
      factors: {
        'Pulled Pork, Small (~5-6)': 0.5, 'Pulled Pork, Large (~9-10)': 1,
        'Pulled Beef, Small (~5-6)': 0.5, 'Pulled Beef, Large (~9-10)': 1,
      },
      base: [
        I('Beans (for refried)', 1, 'lb'),
        I('Tomatoes (pico)', 1, 'lb'),
        I('Red onion', 1.5, 'lb'),
        I('Cilantro', 1, 'bunch'),
        I('Limes', 8, ''),
        I('Garlic', 4, 'cloves'),
        I('HEB bakery tortillas', 1, '10-ct pack'),
        I('Dried peppers (red sauce)', 8, 'oz'),
        I('Orange juice', 1, 'small bottle'),
        I('Tex-Mex spices', 1, 'blend', true),
      ],
      extras: {
        'Pulled Pork, Small (~5-6)': [I('Bone-in pork butt', 4, 'lb')],
        'Pulled Pork, Large (~9-10)': [I('Bone-in pork butt', 4, 'lb')],
        'Pulled Beef, Small (~5-6)': [I('Beef chuck roast', 2.5, 'lb')],
        'Pulled Beef, Large (~9-10)': [I('Beef chuck roast', 2.5, 'lb')],
      },
    },
  },
  // ── Curry ──────────────────────────────────────────────────────────────────
  {
    name: 'Indian Style Curry',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "A rotating curry built on a base of toasted whole spices, aromatics, and tomato. Sometimes contains coconut milk depending on the week. Ask what's on deck, it changes based on what's looking good.",
      reheat: "Comes in a container. Warm gently on the stove. Uncooked rice included.",
      contains: "Dairy (butter). Shellfish (shrimp) if ordering shrimp. May contain Tree Nuts (coconut) depending on the week. Ask for specifics.",
      pairings: [
        { id: "mango_lassi", drink: "Mango lassi", why: "the classic cooling answer; dairy and sweetness against spice" },
        { id: "salted_lassi", drink: "Salted lassi", why: "the savory version, closer to what the dish would drink at home" },
        { id: "masala_chai", drink: "Masala chai, after", why: "the finish; spice echoing spice once the plate is done" },
        { id: "riesling", drink: "Off-dry Riesling", why: "the wine that survives spice; sweetness where tannin would burn" },
        { id: "lager", drink: "Kingfisher or any crisp lager", why: "cold and neutral; lets the sauce do the talking" },
      ],
      wineStyles: ['off_dry_white', 'sparkling'],
      note: "Chickpea version: vegan available upon request, just put it in the notes on the order form. I swap the butter for oil, use vegetable stock, and leave the cream out.",
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: true, shellfish: ['Shrimp, Small (~4-5)', 'Shrimp, Large (~8-10)'] },
    // veganOnRequest, NOT vegan: the default chickpea recipe has butter in it.
    // Kevin swaps butter->oil, uses veg stock, and holds the cream when asked.
    // Tagging it plain `vegan` would mean someone filtering for vegan gets
    // served butter, which is the whole reason the tag is separate.
    diet: { veg: ['Chickpea, Small (~4-5)', 'Chickpea, Large (~8-10)'], veganOnRequest: ['Chickpea, Small (~4-5)', 'Chickpea, Large (~8-10)'], pesc: ['Shrimp, Small (~4-5)', 'Shrimp, Large (~8-10)'] },
    cuisine: 'Indian',
    reheat: 'stovetop',
    rice: true,
    equipment: { flexible: ['dutch', 'largePot'] },
    options: { spice: { min: 1, max: 5 } }, // customer-selectable heat (was note-regex; Batch 3)
    variants: [
      { label: 'Chickpea, Small (~4-5)', price: 30, cost: 14.88 },
      { label: 'Chicken, Small (~4-5)', price: 35, cost: 18.68 },
      { label: 'Shrimp, Small (~4-5)', price: 50, cost: 28.41 },
      { label: 'Chickpea, Large (~8-10)', price: 55, cost: 27.59 },
      { label: 'Chicken, Large (~8-10)', price: 65, cost: 35.17 },
      { label: 'Shrimp, Large (~8-10)', price: 90, cost: 54.66 },
    ],
    recipe: {
      factors: {
        'Chickpea, Small (~4-5)': 0.5, 'Chicken, Small (~4-5)': 0.5, 'Shrimp, Small (~4-5)': 0.5,
        'Chickpea, Large (~8-10)': 1, 'Chicken, Large (~8-10)': 1, 'Shrimp, Large (~8-10)': 1,
      },
      base: [
        I('Canned tomatoes', 1, '28oz can'),
        I('Red onion', 28, 'oz'),
        I('Butter', 2, 'sticks'),
        // Stock is NOT in the base: it moved to per-variant extras (Jul 15).
        // The Chickpea variants are advertised vegetarian and the Shrimp
        // variants pescatarian, and both were being simmered in chicken stock.
        // Same 32 oz, same cost either way; only the animal changes.
        I('Limes', 2, ''),
        I('Asian greens', 1, 'lb'), // stand-in for "whatever's best this week" — priced at ~$2/lb per Kevin
        I('Mix of spicy peppers', 1, 'handful'),
        I('Curry powder', 0.25, 'cup', true),
        I('Brown sugar', 2, 'tbsp', true),
        I('Rice (included with order)', 1, 'batch', true),
      ],
      extras: {
        // Chickpeas are the protein ONLY on the chickpea variants. Scoped here
        // (not base) so the chicken/shrimp variants don't double-load them.
        // Scales with variant factor exactly like the meat proteins below.
        // Protein per variant PLUS one fixed sous vide veg bag (leafy green +
        // one bagged item share ONE bag). $2 on Small, one longer $3 bag on
        // Large; fixed so it never scales with the variant factor.
        // Stock lives here, per variant: vegetable for the chickpea (veg) and
        // shrimp (pesc) variants, chicken for the chicken ones. 32 oz on every
        // variant, and vegetable_stock is priceLinked to chicken_stock, so the
        // cost anchors are unchanged by this split.
        'Chickpea, Small (~4-5)': [I('Chickpeas', 2, 'lb'), I('Vegetable stock', 32, 'oz'), { ...I('Sous vide bag + butter + herbs (costed)', 1, ''), fixed: true }],
        'Chickpea, Large (~8-10)': [I('Chickpeas', 2, 'lb'), I('Vegetable stock', 32, 'oz'), { ...I('Sous vide bag + butter + herbs (costed, large)', 1, ''), fixed: true }],
        'Chicken, Small (~4-5)': [I('Chicken thighs', 2, 'lb'), I('Chicken stock', 32, 'oz'), { ...I('Sous vide bag + butter + herbs (costed)', 1, ''), fixed: true }],
        'Chicken, Large (~8-10)': [I('Chicken thighs', 2, 'lb'), I('Chicken stock', 32, 'oz'), { ...I('Sous vide bag + butter + herbs (costed, large)', 1, ''), fixed: true }],
        'Shrimp, Small (~4-5)': [I('Shrimp', 2, 'lb'), I('Vegetable stock', 32, 'oz'), { ...I('Sous vide bag + butter + herbs (costed)', 1, ''), fixed: true }],
        'Shrimp, Large (~8-10)': [I('Shrimp', 2, 'lb'), I('Vegetable stock', 32, 'oz'), { ...I('Sous vide bag + butter + herbs (costed, large)', 1, ''), fixed: true }],
      },
    },
  },
  {
    name: 'Leblanc Inspired Japanese Curry',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "A rich, slow-braised Japanese curry inspired by Sojiro's Leblanc café. Wagyu london broil, kabocha squash, and carrots in a deeply layered sauce built with red wine, dark chocolate, espresso, apple, and honey. The carrots and kabocha squash come separately in a sous vide bag — reheat the curry, then add the vegetables right before serving to keep everything at its best. Comes with uncooked rice.",
      reheat: "Comes in two parts — the curry in a container and the vegetables in a sous vide bag. Warm the curry gently on the stove over medium-low, reheat the veg bag in simmering water, then combine right before serving. Unlike our other sous vide vegetables, discard the bag's sauce rather than using it as a glaze — it contains butter, so avoid pouring it down the drain. Uncooked rice included, cook fresh for best results. Small batch available only when another customer orders the same week — reach out if you have questions.",
      contains: "Dairy (butter). Gluten (flour). Fish (fish sauce, Worcestershire).",
      pairings: [
        { id: "ramune", drink: "Ramune or any lightly citrus soda", why: "the Japanese curry-shop counter answer; bright against a rich brown roux" },
        { id: "barley_tea", drink: "Cold mugicha (barley tea)", why: "roasty, unsweetened, and everywhere in Japan; cuts the roux cleanly" },
        { id: "lager", drink: "Asahi or Sapporo", why: "the izakaya default; dry lager against a sweet-savory curry" },
        { id: "oolong", drink: "Oolong tea, iced", why: "between green and black; enough body for the roux, no sugar" },
        { id: "pinot_noir", drink: "Pinot Noir", why: "if wine, something light and fruity; the curry is mild and the roux is sweet" },
      ],
      wineStyles: ['light_red', 'off_dry_white'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: { variants: true, unlisted: "butter in the veg bag line, which resolves to sv_bag" }, fish: true, gluten: { variants: true, unlisted: 'roux flour lives inside the Curry spice blend batch line, not its own recipe line' } },
    cuisine: 'Japanese',
    reheat: 'stovetop',
    rice: true,
    equipment: { fixed: ['dutch', 'ovenLow'] },
    variants: [
      { label: 'Small (split order, ~4)', price: 60, cost: 32.83 },
      { label: 'Large (~8)', price: 110, cost: 63.49 },
    ],
    recipe: {
      factors: { 'Small (split order, ~4)': 0.5, 'Large (~8)': 1 },
      base: [
        I('Wagyu london broil', 2.5, 'lb'),
        I('Kabocha squash', 1, 'lb'),
        I('Carrots', 1, 'lb'),
        I('Onion', 1, 'lb'),
        I('Apple', 1, ''),
        I('Ginger', 2, 'knob'),
        I('Red wine', 2, 'cup'),
        I('Beef stock', 8, 'cups'),
        I('100% dark chocolate', 2, 'square'),
        I('Espresso', 2, 'shot'),
        I('Worcestershire', 2, 'tbs'), // scales: 1 tbs small (0.5×), 2 tbs large (1×)
        I('Curry spice blend', 1, 'batch', true),
        I('Honey + fish sauce + butter', 1, 'batch', true),
        I('Bay leaf', 1, '', true),
        I('Rice (included with order)', 1, 'batch', true),
      ],
      // ONE sous vide bag per dish (kabocha + carrots share one bag). Fixed +
      // per-variant: $2 on Small, one longer $3 bag on Large.
      extras: {
        'Small (split order, ~4)': [{ ...I('Sous vide bag + butter + herbs (costed)', 1, ''), fixed: true }],
        'Large (~8)': [{ ...I('Sous vide bag + butter + herbs (costed, large)', 1, ''), fixed: true }],
      },
    },
    stewVegCopy: {
      main: 'Comes in two parts — the curry in a container and the vegetables in a sous vide bag. Warm the curry gently on the stove over medium-low, reheat the veg bag in simmering water, then combine right before serving.',
      veg: 'Bring a pot of water to a gentle simmer and place the sealed bag in until heated through, then cut open and add the vegetables to the curry. Unlike our other sous vide vegetables, the sauce in this bag is not meant to be used as a glaze — discard it. The liquid contains butter, so avoid pouring it down the drain.',
    },
  },
  {
    name: 'Tea-Smoked Chicken with Dashi Polenta and Alabama White Sauce',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Boneless skinless chicken thighs, dry-brined a day, cooked sous vide, then smoked on the stovetop over black tea, rice, and brown sugar. They go over polenta cooked in dashi and finished with brown butter. Finished with a North Alabama White BBQ sauce. Bone-in skin-on chicken available by request. The skin is good but more delicate to work with and can stick to your pan without proper technique, so the default is boneless. Why is the Large such a bargain? One round of smoking ingredients covers either size, so you get the savings.",
      reheat: "Two parts: the chicken in a container, the polenta in a sealed bag. Polenta bag into simmering water until hot. The chicken is fully cooked and already smoked, so all it needs is color: pat it very dry, get a pan blazing hot with a neutral oil, and sear hard just until browned. Same treatment as any sous vide protein. Polenta down, chicken over, then the white sauce poured cold across the top. Do not heat the white sauce, it is meant to be cold against the smoke. If you asked for skin-on, do not go blazing hot. Pat it very dry, lay it skin-side down in a moderate pan with a little oil, and let the fat render and the skin tighten before you bring the heat up. Rushing it is how the skin welds itself to the pan.",
      contains: "Egg (mayonnaise), Dairy (butter), Fish (bonito in the dashi).",
      pairings: [
        { id: "lapsang", drink: "Lapsang souchong, iced", why: "the smoke tea; matches the dish's own tea smoke instead of fighting it" },
        { id: "sweet_tea", drink: "Alabama sweet tea", why: "the sauce's home tradition; what white-sauce chicken drinks where it's from" },
        { id: "riesling", drink: "Dry Riesling", why: "acid and a little fruit against smoke, fat, and horseradish" },
        { id: "amber_ale", drink: "Amber ale", why: "smoked-meat logic; malt sweetness under the lacquer" },
        { id: "barley_tea", drink: "Cold unsweetened barley tea", why: "echoes the dashi's roasted depth without adding sugar to a plate that has plenty" },
      ],
      wineStyles: ['off_dry_white', 'rose', 'light_red'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe. Fish is the non-obvious one: katsuobushi in the dashi
    // means the polenta is not pescatarian-innocent, and nothing on the plate
    // announces it.
    allergens: {
      // Egg is inside the MAYONNAISE, which resolves to the 'mayonnaise' id, so
      // the id-regex has nothing to match on (and correctly refuses to guess).
      // Same shape as the dairy-inside-sv_bag claim on the sous vide dishes.
      egg: { variants: true, unlisted: 'egg is in the mayonnaise base of the white sauce; the mayonnaise line resolves to the mayonnaise id, which the id-pattern cannot see through' },
      dairy: true,  // butter, browned into the polenta
      fish: { variants: true, unlisted: 'katsuobushi (bonito) in the dashi the polenta is cooked in; nothing on the plate announces it and the katsuobushi id does not match the fish pattern' },
    },
    cuisine: 'American',
    reheat: 'teaSmoked', // dedicated card: chicken in a CONTAINER (pulled from the bag to smoke), polenta bagged, sauce cold
    // 5-gallon pot on the back burner for the smoke; polenta is the back-burner
    // claim the `polenta` flag already models. Large pot is modeled as ONE
    // (Kevin has two, but only one fits on the stove at a time), so this fires
    // red against Chili and Tex-Mex Kit by design.
    equipment: { fixed: ['largePot'], polenta: true },
    variants: [
      { label: 'Small (~4 servings)', price: 40, cost: 16.57 },  // 58.6% @ buffered cost
      { label: 'Large (~8 servings)', price: 65, cost: 29.77 },  // 54.2%; cost is 1.797x Small, not 2x — see PROPORTION_EXCEPTIONS
    ],
    recipe: {
      factors: { 'Small (~4 servings)': 1, 'Large (~8 servings)': 2 },
      base: [
        I('Chicken thighs', 2, 'lb'),   // boneless skinless; Small = 2 lb (Kevin, Jul 17)
        I('Kosher salt', 2, 'tbs'),     // 50/50 dry brine, 24 hours
        I('Sugar', 0.125, 'cup'),
        I('Polenta', 1, 'cup'),         // dry, cooked in dashi. NOT the bagged +Polenta side (that one has parm in it).
        I('Kombu', 5.7, 'g'),           // ~0.2 oz; Kevin's ratio is ~20 smalls per 4oz pack
        I('Katsuobushi', 10, 'g'),      // ~10g; ~10 smalls per 100g pack
        I('Butter', 0.5, 'stick'),      // browned, into the polenta
        I('Mayonnaise', 0.75, 'cup'),   // white sauce base
        I('Cider vinegar', 2, 'tbsp'),
        I('Prepared horseradish', 1, 'tbsp'),
        I('Black pepper (oz)', 0.25, 'oz'), // white sauce + brine
      ],
      // THE SMOKE MIX IS FIXED AT BOTH SIZES. Kevin, Jul 17: one round of smoke
      // covers a Large, and "the smoke still basically makes the same amount
      // even if I had 2 large batches at once." The 5-gallon pot is why. So
      // tea, rice, sugar, orange, and aromatics do NOT double, which is what
      // makes this a PROPORTION_EXCEPTIONS tenant alongside Bo Ssam's kimchi.
      // A Large therefore carries a real structural discount. That is correct,
      // not a bug, and the 2x-gap check would otherwise flag it.
      extras: {
        'Small (~4 servings)': [
          { ...I('Loose black tea', 1, ''), fixed: true },
          { ...I('Raw rice (smoke mix)', 0.25, 'cup'), fixed: true },
          { ...I('Brown sugar', 0.25, 'cup'), fixed: true },
          { ...I('Orange', 1, 'each'), fixed: true },
          { ...I('Star anise', 2, 'each'), fixed: true },
          { ...I('Cinnamon stick', 1, 'each'), fixed: true },
          { ...I('Sichuan peppercorns', 1, 'tsp'), fixed: true },
        ],
        'Large (~8 servings)': [
          { ...I('Loose black tea', 1, ''), fixed: true },
          { ...I('Raw rice (smoke mix)', 0.25, 'cup'), fixed: true },
          { ...I('Brown sugar', 0.25, 'cup'), fixed: true },
          { ...I('Orange', 1, 'each'), fixed: true },
          { ...I('Star anise', 2, 'each'), fixed: true },
          { ...I('Cinnamon stick', 1, 'each'), fixed: true },
          { ...I('Sichuan peppercorns', 1, 'tsp'), fixed: true },
        ],
      },
    },
  },
  // ── East Asian ─────────────────────────────────────────────────────────────
  {
    name: 'Bo Ssam',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Korean-style pork shoulder, dry-brined 24 hours in a 50/50 salt and sugar mix, then roasted low and slow until tender and lightly crisped on the outside. Served with ginger scallion sauce and a side of kimchi. You cook the rice — also great as lettuce wraps if you want to go that route (lettuce not included).",
      reheat: "The pork comes pre-pulled and sealed in a bag — bring a pot of water to a gentle simmer and place the sealed bag in until heated through. The ginger scallion sauce and kimchi are ready straight from the fridge, no reheating needed. Cook the rice fresh.",
      contains: "Soy, Gluten (soy sauce). Kimchi may contain Fish or Shellfish depending on brand — ask if you have concerns.",
      pairings: [
        { id: "makgeolli", drink: "Makgeolli", why: "the traditional table answer: milky, lightly fizzy rice wine whose sweetness cuts the pork" },
        { id: "barley_tea", drink: "Boricha (barley tea)", why: "the non-alcoholic Korean standard, served cold; what the table drinks when nobody's drinking" },
        { id: "bokbunja", drink: "Bokbunja (black raspberry wine)", why: "the pairing Koreans specifically name for bossam; clean sweetness against boiled pork" },
        { id: "lager", drink: "Crisp lager", why: "the pragmatic answer; the wrap is salty, fatty, and spicy, and beer resets it" },
        { id: "sparkling_water", drink: "Sparkling water with yuzu or lime", why: "the fat and the saeu-jeot want bubbles and acid more than flavor" },
      ],
      wineStyles: ['off_dry_white', 'sparkling', 'rose'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { soy: true, gluten: true },
    cuisine: 'Korean',
    // No shared reheat bucket — fully dedicated card logic in buildReheatBlocks
    rice: true,
    equipment: { fixed: ['ovenLow'] }, // pork shoulder roasts low and slow
    variants: [
      { label: 'Small (~4 servings)', price: 40, cost: 23.32 },
      { label: 'Large (~8 servings)', price: 75, cost: 37.55 },
    ],
    // NOTE: recipe not yet finalized by Kevin (first cook was the pricing test
    // batch) — quantities/method may change once the official recipe is set.
    recipe: {
      factors: { 'Small (~4 servings)': 0.5, 'Large (~8 servings)': 1 },
      base: [
        I('Pork shoulder', 8, 'lb'), // real yield after trim/fat loss; Small=4lb confirmed by Kevin
        I('Kosher salt', 10, 'tbs'),      // 50/50 dry brine, 24 hours
        I('Sugar', 0.5, 'cup'),           // 50/50 dry brine, 24 hours
        I('Scallions', 3, 'bunch'), // Small=1.5 bunch confirmed by Kevin
        I('Ginger', 4, 'knobs'),
        I('Vegetable oil', 0.25, 'cup'),
        I('Soy sauce', 1.5, 'tbsp'),
        I('Vinegar', 0.2, 'batch-use'),
        I('Salt', 2, 'batch-use'),
        // Kimchi is priced at raw cost with no margin buffer (Kevin's call —
        // store-bought, doesn't feel right marking it up beyond general tax).
        // This only affects how the cost ANCHOR was built; the live drift
        // engine still tracks kimchi like any other ingredient below.
        // NOT a staple (buy fresh per batch, shows on the shopping list), but
        // IS fixed — always exactly 1 jar regardless of Small/Large (can't buy
        // half a jar; Small's smaller half-jar container is priced into the
        // $36 Small price directly, not modeled as a quantity change here).
        { ...I('Kimchi', 1, 'jar'), fixed: true },
        I('Rice (included with order)', 1, 'batch', true),
      ],
    },
  },
  {
    name: 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "The same cumin-chili sauce three ways: hand-pulled-style noodles with hard-seared mushrooms doing the heavy lifting where meat usually would, ground beef over rice for a heartier, meat-forward take, or ground lamb over rice, which is actually what this dish is built on. Savory, slightly numbing, and satisfying every way. Worth knowing on the noodle version: mushrooms shrink a lot as they cook so it takes noticeably more of them by weight to do the job, and the fresh noodles cost more than the rice that comes with the beef or lamb version, which is why it's priced closer to the lamb than the beef.",
      reheat: "Noodles and sauce travel separately — cook the noodles fresh and toss with the warmed sauce. If you order the beef or lamb over rice version, cook the included rice fresh and warm the meat with the sauce on the stove.",
      contains: "Gluten (Shaoxing wine in every version, plus noodles on the noodle version), Soy (soy sauce), Sesame (house chili oil).",
      pairings: [
        { id: "suanmeitang", drink: "Suanmeitang (sour plum drink)", why: "the Chinese street answer to cumin and chile; sour, smoky, cold" },
        { id: "jasmine_tea", drink: "Jasmine tea", why: "the default at the table this dish comes from" },
        { id: "lager", drink: "Tsingtao or any crisp lager", why: "cumin-lamb street food drinks beer, full stop" },
        { id: "grenache", drink: "Grenache or Syrah", why: "the wine that likes cumin; peppery fruit against peppery meat" },
        { id: "sparkling_water", drink: "Sparkling water with lemon", why: "bubbles and acid where the chile oil lands" },
      ],
      wineStyles: ['light_red', 'bold_red'],
      spice: "Spice level is about a 2-3 out of 5 and can't be dialed down — a large portion of the sauce is chili oil.",
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { gluten: true, soy: { variants: true, unlisted: 'soy sauce lives inside the Cumin + spices batch line' }, sesame: { variants: true, unlisted: "house chili oil inside the Cumin + spices batch line, which resolves to spices_generic" } },
    diet: { veg: ['Mushroom, Small (~3-4)', 'Mushroom, Large (~6-8)', 'Mushroom, Small (~3-4) + Asian Greens (1/2 lb)', 'Mushroom, Large (~6-8) + Asian Greens (1 lb)'] },
    cuisine: 'Chinese',
    reheat: 'pasta',
    noodle: true, // the noodle variants; rice surcharge for Beef/Lamb variants
                  // is special-cased in dishCosting riceUnits (Beef|Lamb-prefix rule)
    equipment: { fixed: ['wok'] },
    variants: [
      { label: 'Mushroom, Small (~3-4)', price: 45, cost: 19.86 },
      { label: 'Mushroom, Large (~6-8)', price: 80, cost: 38.65 },
      { label: 'Mushroom, Small (~3-4) + Asian Greens (1/2 lb)', price: 50, cost: 22.03 },
      { label: 'Mushroom, Large (~6-8) + Asian Greens (1 lb)', price: 85, cost: 40.81 },
      { label: 'Beef, Small (~3-4)', price: 35, cost: 14.97 },
      { label: 'Beef, Large (~6-8)', price: 60, cost: 28.86 },
      { label: 'Beef, Small (~3-4) + Asian Greens (1/2 lb)', price: 40, cost: 16.05 },
      { label: 'Beef, Large (~6-8) + Asian Greens (1 lb)', price: 65, cost: 31.02 },
      { label: 'Lamb, Small (~3-4)', price: 45, cost: 21.46 },
      { label: 'Lamb, Large (~6-8)', price: 80, cost: 41.83 },
      { label: 'Lamb, Small (~3-4) + Asian Greens (1/2 lb)', price: 47, cost: 22.54 },
      { label: 'Lamb, Large (~6-8) + Asian Greens (1 lb)', price: 84, cost: 43.99 },
    ],
    recipe: {
      factors: {
        'Mushroom, Small (~3-4)': 0.5, 'Mushroom, Large (~6-8)': 1,
        'Mushroom, Small (~3-4) + Asian Greens (1/2 lb)': 0.5, 'Mushroom, Large (~6-8) + Asian Greens (1 lb)': 1,
        'Beef, Small (~3-4)': 0.5, 'Beef, Large (~6-8)': 1,
        'Beef, Small (~3-4) + Asian Greens (1/2 lb)': 0.5, 'Beef, Large (~6-8) + Asian Greens (1 lb)': 1,
        'Lamb, Small (~3-4)': 0.5, 'Lamb, Large (~6-8)': 1,
        'Lamb, Small (~3-4) + Asian Greens (1/2 lb)': 0.5, 'Lamb, Large (~6-8) + Asian Greens (1 lb)': 1,
      },
      // Shared cumin-chili sauce and aromatics — identical across every variant.
      // Protein and starch are variant-specific (mushroom+noodles vs ground
      // beef+rice vs ground lamb+rice) and live in extras below.
      base: [
        I('Garlic', 16, 'cloves'),
        I('Ginger', 4, 'knobs'),
        I('Red onion', 2, ''),
        I('Cilantro', 1, 'bunch'),
        I('Cumin + spices', 1, 'blend', true),
        I('Chinkiang vinegar', 6, 'tbsp', true),
        I('Shaoxing wine', 0.5, 'cup', true),
        I('House chili oil', 1, 'cup', true),
      ],
      extras: {
        'Mushroom, Small (~3-4)': [
          I('Mushrooms', 3, 'lb'), I('Fresh noodles (not dried)', 1, 'batch'),
        ],
        'Mushroom, Large (~6-8)': [
          I('Mushrooms', 3, 'lb'), I('Fresh noodles (not dried)', 1, 'batch'),
        ],
        'Mushroom, Small (~3-4) + Asian Greens (1/2 lb)': [
          I('Mushrooms', 3, 'lb'), I('Fresh noodles (not dried)', 1, 'batch'),
          { ...I('Asian greens', 0.5, 'lb'), fixed: true },
        ],
        'Mushroom, Large (~6-8) + Asian Greens (1 lb)': [
          I('Mushrooms', 3, 'lb'), I('Fresh noodles (not dried)', 1, 'batch'),
          { ...I('Asian greens', 1, 'lb'), fixed: true },
        ],
        'Beef, Small (~3-4)': [
          I('Ground beef', 2, 'lb'), I('Rice (included with order)', 1, 'batch', true),
        ],
        'Beef, Large (~6-8)': [
          I('Ground beef', 2, 'lb'), I('Rice (included with order)', 1, 'batch', true),
        ],
        'Beef, Small (~3-4) + Asian Greens (1/2 lb)': [
          I('Ground beef', 2, 'lb'), I('Rice (included with order)', 1, 'batch', true),
          { ...I('Asian greens', 0.5, 'lb'), fixed: true },
        ],
        'Beef, Large (~6-8) + Asian Greens (1 lb)': [
          I('Ground beef', 2, 'lb'), I('Rice (included with order)', 1, 'batch', true),
          { ...I('Asian greens', 1, 'lb'), fixed: true },
        ],
        'Lamb, Small (~3-4)': [
          I('Ground lamb', 2, 'lb'), I('Rice (included with order)', 1, 'batch', true),
        ],
        'Lamb, Large (~6-8)': [
          I('Ground lamb', 2, 'lb'), I('Rice (included with order)', 1, 'batch', true),
        ],
        'Lamb, Small (~3-4) + Asian Greens (1/2 lb)': [
          I('Ground lamb', 2, 'lb'), I('Rice (included with order)', 1, 'batch', true),
          { ...I('Asian greens', 0.5, 'lb'), fixed: true },
        ],
        'Lamb, Large (~6-8) + Asian Greens (1 lb)': [
          I('Ground lamb', 2, 'lb'), I('Rice (included with order)', 1, 'batch', true),
          { ...I('Asian greens', 1, 'lb'), fixed: true },
        ],
      },
    },
  },
  {
    name: 'Mapo Eggplant',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Chinese eggplant and ground chicken in a sauce built on doubanjiang and chili oil, cooked down until the eggplant goes silky and soaks up everything around it. Numbing, spicy, and savory all at once. Made for rice.",
      reheat: "Comes in a container, not a bag. To reheat, warm in a large saucepan over medium, and add a splash of water if it looks a little thick. Uncooked rice included.",
      contains: "Gluten (soy sauce, doubanjiang), Soy (doubanjiang), Sesame (house chili oil).",
      pairings: [
        { id: "suanmeitang", drink: "Suanmeitang", why: "Chengdu's own answer to mala; sour plum against numbing heat" },
        { id: "jasmine_tea", drink: "Jasmine tea", why: "floral and cooling between bites of doubanjiang" },
        { id: "riesling", drink: "Off-dry Riesling", why: "sweetness is the wine move against Sichuan heat; tannin is the mistake" },
        { id: "lager", drink: "Cold light lager", why: "neutral, cold, and honest about what it's for" },
        { id: "coconut_water", drink: "Coconut water", why: "quietly effective against capsaicin, and doesn't add another flavor" },
      ],
      wineStyles: ['off_dry_white', 'sparkling', 'light_red'],
      spice: "Spice level is about a 3 out of 5, and this one can't be dialed down.",
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { gluten: true, soy: true, sesame: { variants: true, unlisted: "house chili oil rides a composed line, which resolves to spices_generic" } },
    cuisine: 'Chinese',
    reheat: 'stovetop',
    rice: true,
    equipment: { fixed: ['dutch'] }, // no tofu
    variants: [
      { label: 'Small (~4-5 servings)', price: 35, cost: 14.75 },
      { label: 'Large (~8-10 servings)', price: 65, cost: 29.51 },
    ],
    recipe: {
      factors: { 'Small (~4-5 servings)': 1, 'Large (~8-10 servings)': 2 },
      base: [
        I('Chinese eggplant', 2, 'lb'),
        I('Ground chicken', 0.5, 'lb'),
        I('Doubanjiang', 3, 'tbsp'),
        I('Garlic', 4, 'cloves'),
        I('Ginger', 1, 'knob'),
        I('Scallions', 1, 'bunch'),
        I('House chili oil', 0.25, 'cup', true),
        I('Sichuan peppercorns', 1, 'tbsp', true),
        I('Rice (included with order)', 1, 'batch', true),
      ],
    },
  },
  {
    name: 'Shrimp or Tofu with Asparagus in Black Bean Sauce',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Asparagus and your choice of Texas Gulf shrimp or tofu in a savory sauce of soy, Shaoxing wine, fermented black beans, and aromatics. The fermented black beans give it a deep, funky-in-a-good-way backbone that makes it taste like it came out of a good Cantonese kitchen.",
      reheat: "Sealed in a bag for the best reheat. See the note on bagged dishes. Uncooked rice included, cook fresh for best results.",
      contains: "Shellfish if ordering shrimp. Soy (tofu) if vegetarian. Gluten (soy sauce, Shaoxing wine).",
      pairings: [
        { id: "jasmine_tea", drink: "Jasmine tea", why: "the Cantonese table default; light against a salty ferment" },
        { id: "riesling", drink: "Dry Riesling or Grüner Veltliner", why: "acid and minerality with shrimp, restraint with the black beans" },
        { id: "lager", drink: "Crisp lager", why: "the safe and correct answer with a salty stir-fry" },
        { id: "oolong", drink: "Oolong, iced", why: "more body than jasmine when the sauce runs deep" },
        { id: "sparkling_water", drink: "Sparkling water with lime", why: "reset button; the sauce is the star" },
      ],
      wineStyles: ['crisp_white', 'off_dry_white', 'sparkling'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { gluten: { variants: true, unlisted: "soy sauce and Shaoxing inside the black bean sauce composed line, which resolves to spices_generic" }, soy: true, shellfish: ['Shrimp, Small Batch (~3-4)', 'Shrimp, Large Batch (~7-8)'] },
    diet: { veg: ['Tofu, Small Batch (~3-4)', 'Tofu, Large Batch (~7-8)'], vegan: ['Tofu, Small Batch (~3-4)', 'Tofu, Large Batch (~7-8)'], pesc: ['Shrimp, Small Batch (~3-4)', 'Shrimp, Large Batch (~7-8)'] },
    cuisine: 'Chinese',
    reheat: 'bagged',
    rice: true,
    equipment: { fixed: ['wok'], tofu: true },
    variants: [
      { label: 'Shrimp, Small Batch (~3-4)', price: 40, cost: 20.9 },
      { label: 'Shrimp, Large Batch (~7-8)', price: 75, cost: 40.79 },
      { label: 'Tofu, Small Batch (~3-4)', price: 25, cost: 9.51 },
      { label: 'Tofu, Large Batch (~7-8)', price: 45, cost: 18.01 },
    ],
    recipe: {
      factors: {
        'Shrimp, Small Batch (~3-4)': 1, 'Shrimp, Large Batch (~7-8)': 2,
        'Tofu, Small Batch (~3-4)': 1, 'Tofu, Large Batch (~7-8)': 2,
      },
      base: [
        I('Asparagus', 1, 'lb'),
        I('Scallions', 1, 'bunch'),
        I('Garlic', 3, 'cloves'),
        I('Ginger', 1, 'knob'),
        I('Soy + Shaoxing + black beans + sugar', 1, 'batch', true),
        I('Rice (included with order)', 1, 'batch', true),
      ],
      extras: {
        'Shrimp, Small Batch (~3-4)': [I('Shrimp', 1, 'lb')],
        'Shrimp, Large Batch (~7-8)': [I('Shrimp', 1, 'lb')],
        'Tofu, Small Batch (~3-4)': [I('Tofu', 1, 'block')],
        'Tofu, Large Batch (~7-8)': [I('Tofu', 1, 'block')],
      },
    },
  },
  {
    name: 'Stir Fried Long Beans with Ground Pork or Tofu',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Blistered long beans and ground pork in a savory sauce built on doubanjiang and garlic, with a little heat and a classic dry-fried texture on the beans. Deeply savory throughout. Available with ground pork or tofu at the same price.",
      reheat: "Sealed in a bag for the best reheat. See the note on bagged dishes. Uncooked rice included.",
      contains: "Gluten (soy sauce, doubanjiang), Soy (doubanjiang, tofu if ordering tofu).",
      pairings: [
        { id: "jasmine_tea", drink: "Jasmine tea", why: "the table answer; the dish is salty-savory and the tea is neither" },
        { id: "lager", drink: "Tsingtao or any lager", why: "wok food and cold beer, the oldest pairing there is" },
        { id: "suanmeitang", drink: "Suanmeitang", why: "if you got it spicy, the sour plum does the cooling" },
        { id: "rose", drink: "Dry rosé", why: "picnic logic: cold, dry, and friendly with pork and ferment" },
        { id: "barley_tea", drink: "Cold barley tea", why: "roasty, no sugar, no argument with the wok" },
      ],
      wineStyles: ['rose', 'crisp_white', 'off_dry_white'],
      spice: "Spice level is about a 2 out of 5 and can't be dialed down.",
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { gluten: true, soy: true },
    diet: { veg: ['Tofu, Small (~4)', 'Tofu, Large (~8)'], vegan: ['Tofu, Small (~4)', 'Tofu, Large (~8)'] },
    cuisine: 'Chinese',
    reheat: 'bagged',
    rice: true,
    equipment: { fixed: ['wok'], tofu: true }, // tofu is an option → back burner
    variants: [
      { label: 'Ground Pork, Small (~4)', price: 30, cost: 12.54 },
      { label: 'Ground Pork, Large (~8)', price: 55, cost: 25.07 },
      { label: 'Tofu, Small (~4)', price: 30, cost: 12.54 },
      { label: 'Tofu, Large (~8)', price: 55, cost: 25.07 },
    ],
    recipe: {
      factors: {
        'Ground Pork, Small (~4)': 0.5, 'Ground Pork, Large (~8)': 1,
        'Tofu, Small (~4)': 0.5, 'Tofu, Large (~8)': 1,
      },
      base: [
        I('Long beans', 1.5, 'lb'),
        I('Doubanjiang', 4, 'tbsp'), // Small=2tbsp confirmed by Kevin
        I('Garlic', 6, 'cloves'),
        I('Scallions', 1, 'bunch'),
        I('Soy sauce', 2, 'tbsp', true),
        I('Rice (included with order)', 1, 'batch', true),
      ],
      extras: {
        'Ground Pork, Small (~4)': [I('Ground pork', 2, 'lb')], // Small=1lb, Large=2lb confirmed by Kevin
        'Ground Pork, Large (~8)': [I('Ground pork', 2, 'lb')],
        'Tofu, Small (~4)': [I('Tofu', 1, 'block')],
        'Tofu, Large (~8)': [I('Tofu', 1, 'block')],
      },
    },
  },
  {
    name: 'Texas Gulf Shrimp or Tofu and Chinese Broccoli',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Chinese broccoli (gai lan) and your choice of Texas Gulf shrimp or tofu in a savory sauce of garlic, soy, and oyster sauce with a hit of house chili oil. Clean and a little spicy. Chili oil can be omitted upon request. Not recommended...but we get it.",
      reheat: "Sealed in a bag for the best reheat. See the note on bagged dishes. Uncooked rice included.",
      contains: "Shellfish (oyster sauce is in the base, plus shrimp if ordering shrimp) - the tofu version is NOT shellfish-free. Soy (soy sauce, and tofu if ordering tofu). Gluten (soy sauce). Sesame (house chili oil).",
      pairings: [
        { id: "jasmine_tea", drink: "Jasmine tea", why: "light and floral over Gulf shrimp and greens" },
        { id: "albarino", drink: "Albariño", why: "the shrimp wine; salt air acid for a salt-air protein" },
        { id: "lager", drink: "Crisp lager", why: "cold and clean against oyster sauce" },
        { id: "sparkling_water", drink: "Sparkling water with lime", why: "the dish is clean; the drink can be too" },
        { id: "green_tea", drink: "Iced green tea", why: "grassy against the gai lan's bitterness" },
      ],
      wineStyles: ['crisp_white', 'sparkling'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { gluten: true, soy: true, shellfish: true, sesame: { variants: true, unlisted: "house chili oil rides a composed line, which resolves to spices_generic" } },
    // NO `veg` flag, deliberately. The base carries 3 tbsp of oyster sauce,
    // which is made from oysters, so the Tofu variants are tofu but they are
    // not vegetarian. They were flagged `veg` until Jul 15 (found by
    // tests/diet_flags.mjs on its first run) — a live claim that would have
    // served shellfish to someone filtering it out. `pesc` on the shrimp
    // variants is correct and stays: pescatarian permits shellfish.
    // If a vegetarian stir-fry sauce ever replaces the oyster sauce on the
    // tofu variants, the flag can come back. Not before.
    diet: { pesc: ['Shrimp, Small Batch (~4)', 'Shrimp, Large Batch (~8)'] },
    cuisine: 'Chinese',
    reheat: 'bagged',
    rice: true,
    equipment: { fixed: ['wok'], tofu: true },
    variants: [
      { label: 'Shrimp, Small Batch (~4)', price: 40, cost: 19.56 },
      { label: 'Shrimp, Large Batch (~8)', price: 75, cost: 38.12 },
      { label: 'Tofu, Small Batch (~4)', price: 25, cost: 8.17 },
      { label: 'Tofu, Large Batch (~8)', price: 45, cost: 15.34 },
    ],
    recipe: {
      factors: {
        'Shrimp, Small Batch (~4)': 1, 'Shrimp, Large Batch (~8)': 2,
        'Tofu, Small Batch (~4)': 1, 'Tofu, Large Batch (~8)': 2,
      },
      base: [
        I('Chinese broccoli', 8, 'oz'),
        I('Garlic', 3, 'cloves'),
        I('Ginger', 1, 'knob'),
        I('Oyster sauce', 3, 'tbsp', true),
        I('Soy sauce', 2, 'tbsp', true),
        I('Dark soy sauce', 1, 'tbsp', true),
        I('House chili oil', 2, 'tbsp', true),
        I('Rice (included with order)', 1, 'batch', true),
      ],
      extras: {
        'Shrimp, Small Batch (~4)': [I('Shrimp', 1, 'lb')],
        'Shrimp, Large Batch (~8)': [I('Shrimp', 1, 'lb')],
        'Tofu, Small Batch (~4)': [I('Tofu', 1, 'block')],
        'Tofu, Large Batch (~8)': [I('Tofu', 1, 'block')],
      },
    },
  },
  {
    name: 'Thai Basil Chicken (Pad Krapow Gai)',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Ground chicken hit hard and fast in the wok with garlic, asparagus, Thai basil, and a sauce of oyster sauce, soy, and fish sauce. Fragrant, savory, and spicy. Spice level is customizable 1-5, just let me know when you order. A fried egg on top is a great move — not included, but highly recommended.",
      reheat: "Sealed in a bag for the best reheat. See the note on bagged dishes. Uncooked rice included, cook fresh for best results.",
      contains: "Gluten (oyster sauce, soy sauce), Fish (fish sauce), Shellfish (oyster sauce), Soy (soy sauce).",
      pairings: [
        { id: "thai_iced_tea", drink: "Thai iced tea", why: "the classic cooling answer; creamy sweetness against chile and fish sauce" },
        { id: "lager", drink: "Singha or Chang", why: "Thai lager, made for exactly this plate" },
        { id: "riesling", drink: "Off-dry Riesling", why: "sweetness where the bird's-eye chiles bite" },
        { id: "limeade", drink: "Limeade", why: "tart and cold; the dish's own lime logic in a glass" },
        { id: "coconut_water", drink: "Coconut water", why: "cooling without competing with the basil" },
      ],
      wineStyles: ['off_dry_white', 'sparkling', 'rose'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    // all four allergens ride the single Oyster + soy + fish sauce + sugar line
    allergens: { gluten: { variants: true, unlisted: "soy sauce (wheat) rides the Oyster + soy + fish sauce + sugar line, which resolves to spices_generic" }, fish: { variants: true, unlisted: "fish sauce rides the Oyster + soy + fish sauce + sugar line, which resolves to spices_generic" }, shellfish: { variants: true, unlisted: "oyster sauce rides the Oyster + soy + fish sauce + sugar line, which resolves to spices_generic" }, soy: { variants: true, unlisted: "soy sauce rides the Oyster + soy + fish sauce + sugar line, which resolves to spices_generic" } },
    cuisine: 'Thai',
    reheat: 'bagged',
    rice: true,
    equipment: { fixed: ['wok'] },
    options: { spice: { min: 1, max: 5 } }, // customer-selectable heat (was note-regex; Batch 3)
    variants: [
      { label: 'Small (~3-4)', price: 35, cost: 13.9 },
      { label: 'Large (~7-8)', price: 60, cost: 26.73 },
    ],
    recipe: {
      factors: { 'Small (~3-4)': 1, 'Large (~7-8)': 2 },
      base: [
        I('Ground chicken', 1, 'lb'),
        I('Asparagus', 8, 'oz'),
        I('Thai basil', 1, 'bunch'),
        I('Garlic', 6, 'cloves'),
        I('Limes', 1, ''),
        I('Oyster + soy + fish sauce + sugar', 1, 'batch', true),
        I('Rice (included with order)', 1, 'batch', true),
      ],
    },
  },
  // ── Italian ────────────────────────────────────────────────────────────────
  {
    name: 'Bolognese',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "A proper Bolognese, cooked low and slow with a soffritto base, a mix of meats, milk, and wine until it's rich and velvety. This is one of the slow-cooked exceptions, and it tastes like the hours that went into it.",
      reheat: "Uncooked pasta included, cook fresh — let me know what shape you'd like. Want premium egg pappardelle instead? Select that variant (+$10 small / +$15 large, covers 2 or 3 packs respectively). Warm the sauce gently, adding a splash of pasta water to loosen.",
      contains: "Dairy. Gluten if including pasta. Egg if choosing the egg pappardelle option.",
      pairings: [
        { id: "lambrusco", drink: "Lambrusco", why: "what Bologna actually pours with ragù: dry, sparkling, red, and correct" },
        { id: "sangiovese", drink: "Sangiovese", why: "the acid-and-cherry answer if you want a still red" },
        { id: "barbera", drink: "Barbera", why: "low tannin, high acid; built for tomato and fat" },
        { id: "aranciata", drink: "San Pellegrino Aranciata Rossa", why: "blood orange bitterness as a palate reset, the Italian soda move" },
        { id: "espresso", drink: "Espresso, after", why: "not a pairing, a tradition" },
      ],
      wineStyles: ['light_red', 'sparkling', 'bold_red'],
      note: "Happy to grab you a block of good parm at cost (about $10-15 extra) to grate fresh over the top. There's a spot for it on the order form.",
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: true, gluten: true, egg: ['Small (split order, ~4) + Egg Pappardelle', 'Large (~8) + Egg Pappardelle'] },
    cuisine: 'Italian',
    reheat: 'pasta',
    pasta: true,
    equipment: { flexible: ['dutch', 'largePot'] },
    options: { pasta: { placeholder: 'e.g. rigatoni, pappardelle', excludeVariants: ['Pappardelle'] }, parmOffer: true }, // egg-papp variants ARE the pasta
    variants: [
      { label: 'Small (split order, ~4)', price: 45, cost: 22.15 },
      { label: 'Large (~8)', price: 80, cost: 43.2 },
      { label: 'Small (split order, ~4) + Egg Pappardelle', price: 55, cost: 26.69 },
      { label: 'Large (~8) + Egg Pappardelle', price: 95, cost: 56.84 },
    ],
    recipe: {
      factors: {
        'Small (split order, ~4)': 0.5, 'Large (~8)': 1,
        'Small (split order, ~4) + Egg Pappardelle': 0.5, 'Large (~8) + Egg Pappardelle': 1,
      },
      base: [
        I('Ground pork', 1, 'lb'),
        I('Ground lamb', 1, 'lb'),
        I('Ground beef', 1, 'lb'),
        I('Milk', 1, 'cup'),
        I('Red wine', 1, 'bottle'),
        I('Tomato paste', 1, 'small can'),
        I('Fresh thyme', 1, 'sprig'),
        I('Onion', 1, ''),
        I('Carrot', 1, ''),
        I('Garlic', 4, 'cloves'),
        I('Pasta (ask customer for shape!)', 2, 'lb'),
        I('Nutmeg', 1, 'pinch', true),
      ],
      extras: {
        'Small (split order, ~4) + Egg Pappardelle': [I('Egg pappardelle', 2, 'packs')],
        'Large (~8) + Egg Pappardelle': [I('Egg pappardelle', 3, 'packs')],
      },
    },
  },
  {
    name: 'Pasta with Homegrown Tomato Sauce',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "A slow-simmered tomato sauce made with homegrown tomatoes, good olive oil, and garlic. Nothing else needs to be there. Seasonal and in limited quantities — only on the menu when the garden says so.",
      reheat: "Uncooked pasta included, cook fresh. Warm the sauce gently on the stove.",
      contains: "May contain Dairy. Gluten if including pasta.",
      pairings: [
        { id: "sangiovese", drink: "Chianti or any Sangiovese", why: "tomato's oldest friend; matching acid, cherry fruit" },
        { id: "lambrusco", drink: "Lambrusco", why: "chilled sparkling red against a summer sauce" },
        { id: "sparkling_water", drink: "Sparkling water with basil or lemon", why: "the sauce is the point; stay out of its way" },
        { id: "pinot_grigio", drink: "Pinot Grigio", why: "if white, something that won't argue with acidity" },
        { id: "chinotto", drink: "Italian chinotto", why: "bitter citrus soda; the amaro of soft drinks" },
      ],
      wineStyles: ['light_red', 'sparkling', 'crisp_white'],
      note: "Happy to grab you a block of good parm at cost (about $10-15 extra) to grate fresh over the top. There's a spot for it on the order form.",
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { gluten: true },
    diet: { veg: ['Base (~4)', 'With Mushrooms'] },
    cuisine: 'Italian',
    reheat: 'pasta',
    pasta: true,
    equipment: { fixed: [] }, // saucier, exclusive — never conflicts
    options: { pasta: { placeholder: 'e.g. rigatoni, pappardelle' }, parmOffer: true },
    variants: [
      { label: 'Base (~4)', price: 20, cost: 7.24 },
      { label: 'With Beef or Turkey', price: 35, cost: 14.24 },
      { label: 'With Mushrooms', price: 26, cost: 10.24 },
      { label: 'With Both', price: 41, cost: 17.24 },
    ],
    recipe: {
      factors: { 'Base (~4)': 1, 'With Beef or Turkey': 1, 'With Mushrooms': 1, 'With Both': 1 },
      base: [
        I('Homegrown tomatoes', 1, '28oz can'),
        I('Garlic', 5, 'cloves'),
        I('Pasta', 1, 'lb'),
        I('Good olive oil', 1, 'glug', true),
      ],
      extras: {
        'With Beef or Turkey': [I('Ground beef or turkey', 1, 'lb')],
        'With Mushrooms': [I('Baby bella mushrooms', 8, 'oz')],
        'With Both': [I('Ground beef or turkey', 1, 'lb'), I('Baby bella mushrooms', 8, 'oz')],
      },
    },
  },
  {
    name: 'Orecchiette with Bitter Greens and Anchovies',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Orecchiette with bitter greens, anchovy, garlic, and good parmesan in an olive-oil sauce, finished with lemon herb butter. This one uses tong ho (chrysanthemum greens), since broccoli rabe is hard to source, and the tong ho brings the same pleasant bitterness. No tomato, no cream, just salt, fat, and depth. The little cupped pasta catches the greens and sauce in every bite. Add a pound of fresh-toasted fennel pork sausage to make it a full dinner.",
      reheat: "Comes as a sauce, ready to finish. You cook the pasta fresh — no substitutions on the orecchiette, the dish is built around this pasta.",
      contains: "Fish (anchovies), Dairy (parmesan, butter), Gluten (pasta).",
      pairings: [
        { id: "vermentino", drink: "Verdicchio or Vermentino", why: "coastal Italian whites built for anchovy and bitter greens" },
        { id: "rose", drink: "Dry rosé", why: "enough fruit for the chile, enough acid for the greens" },
        { id: "sparkling_water", drink: "Sparkling water with lemon", why: "bitterness and salt want bubbles" },
        { id: "falanghina", drink: "Falanghina", why: "southern Italian answer to a southern Italian plate" },
        { id: "green_tea", drink: "Cold vermentino-style iced green tea", why: "grassy-bitter echo, zero proof" },
      ],
      wineStyles: ['crisp_white', 'rose'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { fish: true, dairy: true, gluten: true },
    // Anchovies are in the base, so this is PESCATARIAN, never vegetarian.
    // Per-VARIANT and not `pesc: true`: the sausage variants carry a pound of
    // ground pork, and a blanket flag would advertise pork to pescatarians.
    // Array form = "these variants qualify"; `true` = "the whole dish does."
    diet: { pesc: ['Small (~4-5)', 'Large (~8-10)'] },
    cuisine: 'Italian',
    reheat: 'pasta',
    pasta: true,
    equipment: { fixed: ['wok'] }, // greens cooked down + sauce built in the wok
    options: { parmOffer: false }, // parm is in the dish; no separate offer. No pasta sub — orecchiette only.
    variants: [
      { label: 'Small (~4-5)', price: 25, cost: 11.75 },
      { label: 'Small + Fennel Pork Sausage (~4-5)', price: 35, cost: 17.16 },
      { label: 'Large (~8-10)', price: 45, cost: 22.42 },
      { label: 'Large + Fennel Pork Sausage (~8-10)', price: 60, cost: 33.24 },
    ],
    recipe: {
      factors: {
        'Small (~4-5)': 1, 'Small + Fennel Pork Sausage (~4-5)': 1,
        'Large (~8-10)': 2, 'Large + Fennel Pork Sausage (~8-10)': 2,
      },
      base: [
        I('Orecchiette', 1, 'lb'),
        I('Tong ho', 1, 'lb'),
        I('Anchovies', 5, 'fillet'),
        I('Garlic', 5, 'cloves'),
        I('Good parm', 2, 'oz'),
        I('Lemon herb butter', 1, ''),
        I('Fennel seeds', 1, 'tsp', true),
      ],
      extras: {
        'Small + Fennel Pork Sausage (~4-5)': [I('Ground pork', 1, 'lb')],
        'Large + Fennel Pork Sausage (~8-10)': [I('Ground pork', 1, 'lb')],
      },
    },
  },
  {
    name: 'Pappardelle with Vegetables and Mint',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "A lighter, more vibrant take on pasta than you might expect. Wide egg pappardelle in a silky cream sauce built on slow-cooked fennel and bulb onions, brightened with fresh mint, lemon, and white wine — all three working together to lift the dish. Finished with good parmesan, asparagus, and petite peas folded in. Vegetarian. Comes with 1 pack of premium egg pappardelle for the small (~2-3 servings) and 2 packs for the large (~5-6 servings) — this one isn't the same dish without them, so there's no substitution on the pasta.",
      reheat: "Sealed in a bag for the best reheat — see the note on bagged dishes. Small batch available only when another customer orders the same week — reach out if you have questions.",
      contains: "Dairy (cream, parmesan), Gluten (pasta), Egg (pasta), Soy (lecithin in the sauce).",
      pairings: [
        { id: "vermentino", drink: "Vermentino", why: "herby coastal white for an herby plate" },
        { id: "rose", drink: "Dry rosé", why: "spring vegetables, cold pink wine; Provence logic" },
        { id: "elderflower", drink: "Sparkling elderflower", why: "floral against mint, gentle against vegetables" },
        { id: "pinot_grigio", drink: "Pinot Grigio", why: "neutral and cold; the vegetables lead" },
        { id: "mint_tea", drink: "Mint iced tea", why: "the mint in the dish, continued" },
      ],
      wineStyles: ['crisp_white', 'rose', 'sparkling'],
      note: "Happy to grab you a block of good parm at cost (about $10-15 extra) to grate fresh over the top. There's a spot for it on the order form.",
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: true, gluten: true, egg: true, soy: { variants: true, unlisted: "soy lecithin in the Xanthan gum + lecithin powder line, which resolves to spices_generic" } },
    diet: { veg: true },
    options: { parmOffer: true }, // finished with parm; offer a block at cost
    cuisine: 'Italian',
    reheat: 'bagged',
    baggedPasta: true, // bagged dish finished by mixing with cooked pasta
    equipment: { fixed: ['wok'] },
    servings: { small: 2.5, large: 5.5, bound: true },
    variants: [
      { label: 'Small (~2-3)', price: 35, cost: 14.98 },
      { label: 'Large (~5-6)', price: 65, cost: 29.96 },
    ],
    recipe: {
      factors: { 'Small (~2-3)': 0.5, 'Large (~5-6)': 1 },
      base: [
        I('Egg pappardelle', 2, 'packs'),
        I('Fennel bulb', 1, ''),
        I('Bulb onions', 1, 'bunch'),
        I('Asparagus', 0.5, 'lb'),
        I('Petite peas', 8, 'oz'),
        I('Fresh mint', 2, 'sprigs'),
        I('Good parmesan', 1, 'cup'),
        I('Heavy cream', 0.5, 'cup'),
        I('White wine', 1, 'cup'),
        I('Lemon', 1, ''),
        I('Xanthan gum + lecithin powder', 1, 'batch', true),
      ],
    },
  },
  {
    name: 'Saffron Pork Ragu',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Ground pork slow-cooked with fennel, saffron, sherry, and tomato until it's deep and a little luxurious. The saffron does its quiet thing in the background and the whole thing comes together rich without being heavy.",
      reheat: "Uncooked pasta included, cook fresh and let me know what pasta you'd like. Also excellent over polenta — order the polenta variant and it comes in a bag, ready to reheat. Want background heat? I can work a little chili into the sauce at no charge, just ask.",
      contains: "Dairy. Gluten if including pasta.",
      pairings: [
        { id: "vermentino", drink: "Vernaccia or Vermentino", why: "saffron likes a golden-toned white with body" },
        { id: "sangiovese", drink: "Sangiovese", why: "if red, the acid-first Italian answer to pork and tomato" },
        { id: "rose", drink: "Dry rosé", why: "between the two, and right in the saffron register" },
        { id: "sparkling_water", drink: "Sparkling water with orange", why: "saffron and orange are old friends" },
        { id: "chamomile_tea", drink: "Chamomile iced tea", why: "odd on paper, but chamomile's honeyed hay sits next to saffron surprisingly well" },
      ],
      wineStyles: ['crisp_white', 'rose', 'light_red'],
      note: "Happy to grab you a block of good parm at cost (about $10-15 extra) to grate fresh over the top. There's a spot for it on the order form.",
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: { variants: true, unlisted: 'parmesan in the base sauce, uncosted (Kevin confirmed Jul 16)' }, gluten: ['Small (~4 servings)', 'Large (~8 servings)'] },
    cuisine: 'Italian',
    reheat: 'pasta',
    pasta: true,
    equipment: { flexible: ['dutch', 'largePot'], polenta: true }, // polenta → back burner
    options: { pasta: { placeholder: 'e.g. rigatoni, pappardelle', excludeVariants: ['Polenta'] }, parmOffer: true }, // polenta variants replace pasta
    variants: [
      { label: 'Small (~4 servings)', price: 35, cost: 16.79 },
      { label: 'Large (~8 servings)', price: 65, cost: 32.50 },
      { label: 'Small (~4 servings) + Polenta', price: 43, cost: 17.57 },
      { label: 'Large (~8 servings) + Polenta', price: 80, cost: 34.05 },
    ],
    recipe: {
      factors: {
        'Small (~4 servings)': 1, 'Large (~8 servings)': 2,
        'Small (~4 servings) + Polenta': 1, 'Large (~8 servings) + Polenta': 2,
      },
      base: [
        I('Ground pork', 1, 'lb'),
        I('Fennel seeds', 1, 'tsp'),
        I('Onion', 1, ''),
        I('Garlic', 4, 'cloves'),
        I('Crushed tomatoes', 1, 'can'),
        I('Dry sherry', 0.25, 'cup'),
        I('Saffron', 1, 'pinch', true),
      ],
      extras: {
        // Polenta REPLACES pasta — the customer gets one starch or the other,
        // never both. Pasta only applies to the non-Polenta variants.
        'Small (~4 servings)': [I('Pasta (ask customer for shape!)', 1, 'lb')],
        'Large (~8 servings)': [I('Pasta (ask customer for shape!)', 1, 'lb')],
        'Small (~4 servings) + Polenta': [I('Polenta', 1, 'cup'), I('Good parm', 1, 'oz'), I('Butter', 0.25, 'stick'), { ...I('Sous vide bag + butter + herbs (costed)', 1, ''), fixed: true }],
        'Large (~8 servings) + Polenta': [I('Polenta', 1, 'cup'), I('Good parm', 1, 'oz'), I('Butter', 0.25, 'stick'), { ...I('Sous vide bag + butter + herbs (costed)', 1, ''), fixed: true }],
      },
    },
  },

  {
    name: 'Pork with Mustard Tarragon Cream Sauce',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Sous vide pork tenderloin, seared and sliced, over fresh egg taglierini in a mustard, white wine, and tarragon cream sauce. Filed under German for the mustard-and-cream backbone, but the fresh egg pasta underneath pulls it toward Italian, so it lives happily in between. The classic move here would be spätzle, but spätzle does not reheat the way I want it to, so we're using an egg taglierini as a substitute.",
      reheat: "Three parts: the pork in a sealed bag, the sauce in a container, and the taglierini to cook fresh. For the pork, pat it very dry, then sear hard on each side in a blazing-hot pan just until deeply browned on each side. Cut it into half-inch to one-inch medallions after searing. Warm the sauce in a saucepan over medium-low, stirring now and then, while you boil your pasta in lightly salted water. Once the pasta is cooked and drained, toss it with the sauce, then plate with the pork on top.",
      contains: "Dairy (cream, butter, in seasoning bag), Gluten (pasta), Egg (pasta), Mustard.",
      pairings: [
        { id: "chardonnay", drink: "Chardonnay, lightly oaked", why: "cream sauce's oldest companion; body meeting body" },
        { id: "riesling", drink: "Dry Riesling", why: "acid to cut cream, fruit to sit with mustard" },
        { id: "hard_cider", drink: "Hard apple cider", why: "Normandy logic: pork, cream, and apples belong together" },
        { id: "sparkling_apple", drink: "Sparkling apple juice", why: "same logic, zero proof" },
        { id: "pinot_noir", drink: "Pinot Noir", why: "if red, the one light enough for a cream sauce" },
      ],
      wineStyles: ['rich_white', 'off_dry_white', 'light_red'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: true, gluten: true, egg: true, mustard: true },
    cuisine: 'German',
    reheat: 'pasta',
    pasta: true,
    equipment: { backBurner: true }, // soft claim — quick sauce reduction, just be mindful (Kevin)
    // No pasta-shape option: egg taglierini IS the dish, like Pappardelle with Veg.
    servings: { small: 3, large: 6, bound: true },
    variants: [
      { label: 'Small (~3 servings)', price: 45, cost: 21.82 },
      { label: 'Large (~6 servings)', price: 85, cost: 42.57 },
    ],
    recipe: {
      factors: {
        'Small (~3 servings)': 1,
        'Large (~6 servings)': 2,
      },
      base: [
        I('Pork tenderloin (sous vide)', 1.25, 'lb'),
        I('Butter', 0.25, 'stick'),
        I('Shallot', 2, 'oz'),
        I('Garlic', 2, 'cloves'),
        I('White wine', 0.5, 'cup'),
        I('Heavy cream', 1, 'cup'),
        I('Whole grain mustard', 2, 'tbs'),
        I('Fresh tarragon', 1, 'sprig'),
        I('Egg taglierini', 1, 'pack'),
      ],
      // ONE sous vide bag per dish (the pork tenderloin cooks in it). Moved out
      // of base and made per-variant + fixed: the old base line doubled to 2
      // bags on Large (factor 2). Now $2 on Small, one longer $3 bag on Large.
      extras: {
        'Small (~3 servings)': [{ ...I('Sous vide bag + butter + herbs (costed)', 1, ''), fixed: true }],
        'Large (~6 servings)': [{ ...I('Sous vide bag + butter + herbs (costed, large)', 1, ''), fixed: true }],
      },
    },
  },

{
    name: 'Mushroom Ragu',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Four kinds of mushroom doing the work of meat. Dried porcini, oyster, king oyster, and shiitake, built into a deep ragu with soffritto, marsala, a little cream, and good parm, tossed with egg pappardelle. Heads up on the price: this one is loaded with specialty mushrooms and fresh egg pasta, and there is no cheap filler hiding in here, so it costs what it costs. You can sub polenta for the pasta at no extra charge.",
      reheat: "Comes in a container, ready to go. Empty the sauce into a saucepan and warm it over medium-low, stirring now and then, while you boil your pasta in lightly salted water. Once the pasta is cooked and drained, toss it with the sauce and a splash of the pasta water to loosen it, then finish with a little parm if you have it. Ordering the polenta version instead? The polenta comes sealed in a separate sous vide bag, so reheat it in simmering water for a few minutes, then cut it open, spoon it out, and top with the warmed sauce.",
      contains: "Dairy (cream, parmesan), Gluten (pasta), Egg (pasta).",
      pairings: [
        { id: "pinot_noir", drink: "Pinot Noir", why: "earth with earth; the mushroom wine" },
        { id: "nebbiolo", drink: "Nebbiolo", why: "tar and roses over deep umami, if you want more structure" },
        { id: "barbera", drink: "Porcini-friendly Barbera", why: "acid for the tomato in the base, no tannin fight" },
        { id: "barley_tea", drink: "Roasted barley tea, cold", why: "toasted depth that mirrors seared mushrooms, no sugar" },
        { id: "mushroom_broth", drink: "Mushroom broth sipper, warm", why: "fully in the pot's own register; more of the same, on purpose" },
      ],
      wineStyles: ['light_red', 'bold_red'],
      note: "Happy to grab you a block of good parm at cost (about $10-15 extra) to grate fresh over the top. There's a spot for it on the order form.",
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: true, gluten: true, egg: true },
    diet: { veg: true },
    cuisine: 'Spotlight',
    spotlight: true,
    reheat: 'pasta',
    pasta: true,
    equipment: { flexible: ['dutch', 'largePot'], polenta: true }, // polenta → back burner
    // No pasta-shape option: this dish always comes with egg pappardelle (or
    // the Polenta variant), never a customer-chosen dry pasta shape. The shape
    // picker only belongs on dishes where "Pasta" is a raw choose-your-shape
    // ingredient (Bolognese base, Homegrown Tomato, Saffron Pork Ragu).
    options: { parmOffer: true }, // parm-at-cost yes/no on the form (uses parm; offer stands even without a shape picker)
    variants: [
      // Single size only (expensive dish, no Medium/Large — already 4-5
      // servings). Promoted to Spotlight and repriced to $70 both variants
      // (Kevin, Jul 9): fixes the tight margin and anchors the veg spotlight.
      { label: 'Small (~4-5 servings)', price: 70, cost: 36.37 },
      { label: 'Small (~4-5 servings) + Polenta', price: 70, cost: 30.22 },
    ],
    recipe: {
      factors: {
        'Small (~4-5 servings)': 1,
        'Small (~4-5 servings) + Polenta': 1,
      },
      base: [
        I('Dried porcini', 1, 'oz'),
        I('Oyster mushroom', 8, 'oz'),
        I('King oyster mushroom', 1, 'lb'),
        I('Shiitake mushroom', 8, 'oz'),
        I('Onion', 5, 'oz'),
        I('Carrot', 3, 'oz'),
        I('Celery', 3, 'oz'),
        I('Garlic', 3, 'cloves'),
        I('Cooking olive oil', 2, 'oz'),
        I('Tomato paste', 2, 'tbs'),
        I('Dry marsala', 0.5, 'cup'),
        I('Heavy cream', 2, 'oz'),
        I('Good parm', 2, 'oz'),
        I('Fresh thyme', 1, 'sprig', true),
        I('Bay leaf', 1, 'leaf', true),
        I('Nutmeg', 1, 'pinch', true),
      ],
      extras: {
        // Polenta REPLACES the pasta, same as Saffron Ragu. Egg pappardelle is
        // required on the pasta variant (this dish isn't the same without it).
        'Small (~4-5 servings)': [I('Egg pappardelle', 2, 'pack')],
        'Small (~4-5 servings) + Polenta': [I('Polenta', 1, 'cup'), I('Good parm', 1, 'oz'), I('Butter', 0.25, 'stick'), { ...I('Sous vide bag + butter + herbs (costed)', 1, ''), fixed: true }],
      },
    },
  },

  // ── SPOTLIGHT DINNERS (bottom of the dinner list, before the bag section) ──
  // Higher-price plates built around pricier ingredients; one is featured per
  // week. Tagged spotlight:true so WeekTab/publish can route the selected one
  // to its own "Spotlight dinner of the week" header on the weekly menu.
  {
    name: 'Coriander Lamb Steak over Gigantes Beans',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Lamb leg poached low and slow in butter, then seared and laid over silky gigantes beans and leeks. Toasted coriander and preserved lemon do the heavy lifting on flavor. Deep and bright at the same time.",
      reheat: "Two parts: the lamb in a sealed bag, and the gigantes beans and leeks together in their own bag. Remove the bone from the lamb so it sears clean, pat it very dry, and sear hard in a blazing-hot pan just until deeply browned on each side. This is a thinner cut, so take it straight from cold to the hot pan, no resting first. Warm the bean and leek bag in simmering water for a few minutes, spoon them onto the plate, then slice the lamb thin over the top.",
      contains: "Dairy (butter). Preserved lemon.",
      pairings: [
        { id: "agiorgitiko", drink: "Agiorgitiko or any Greek red", why: "the local answer to lamb and beans; plummy, soft tannin" },
        { id: "syrah", drink: "Syrah", why: "pepper-and-lamb logic from the northern Rhône" },
        { id: "mint_tea", drink: "Mint iced tea", why: "lamb's oldest herb, cold" },
        { id: "retsina", drink: "Retsina, if you're brave", why: "pine resin against coriander seed; the most Greek move available" },
        { id: "sparkling_water", drink: "Sparkling water with cucumber", why: "cooling against a rich plate of beans and lamb fat" },
      ],
      wineStyles: ['light_red', 'bold_red', 'crisp_white'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: true },
    cuisine: 'Spotlight',
    spotlight: true,
    reheat: 'lambSpotlight', // dedicated two-part card: sear the lamb, warm the beans
    chillOnly: true,
    equipment: { backBurner: true }, // soft claim — quick sear + a bag in simmering water
    servings: { small: 2, large: 6, bound: true },
    variants: [
      { label: 'Small (~2 servings)', price: 50, cost: 26.12 },
      { label: 'Medium (~4 servings)', price: 90, cost: 52.24 },
      { label: 'Large (~6 servings)', price: 135, cost: 78.36 },
    ],
    recipe: {
      factors: {
        'Small (~2 servings)': 1,
        'Medium (~4 servings)': 2,
        'Large (~6 servings)': 3,
      },
      base: [
        I('Lamb leg steak (bone-in)', 0.66, 'lb'),
        I('Gigantes beans', 4, 'oz'),
        I('Leeks', 1, 'bunch'),
        I('Butter', 0.75, 'stick'),
        I('Preserved lemon', 2, 'piece'),
        I('Cooking olive oil', 1, 'oz'),
        I('Coriander seed', 1, 'tbsp'),
        I('Garlic', 3, 'cloves'),
        I('Parsley', 0.5, 'bunch'),
        I('Lemon', 1, ''),
      ],
    },
  },
  {
    name: 'Pork Chop with Kabocha Purée and Charred Broccolini',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Two thick-cut boneless pork chops, cooked sous vide so they stay juicy, then seared at home. They go over a brown-butter kabocha purée with charred broccolini. No sauce on this one, just the chop, the squash, and the greens, and it doesn't need much else. Comes with two thick chops to split among four people, so plan on slicing them rather than handing everyone their own. Want the upgraded version? The spotlight swaps in a bone-in rib chop and adds a spiced cider beurre blanc.",
      reheat: "Three parts: the pork in a sealed bag, the kabocha purée in a bag, and the broccolini in a bag. Let the pork sit out 30 minutes or more before searing since these are very thick cuts, then pat dry and sear hard on each side in a blazing-hot pan. Reheat the purée and broccolini bags in simmering water until just heated through, and be careful with the broccolini as it can overcook. Plate the purée, slice the chops against the grain and lay them over the top, broccolini alongside. If you have butter in the house, melt a little over the pork and broccolini right before it goes to the table. Not required, but it's the thing the spotlight version's sauce is doing, and it takes ten seconds.",
      contains: "Dairy (butter).",
      pairings: [
        { id: "riesling", drink: "Riesling, dry or just off", why: "pork's wine; acid for the fat, fruit for the squash's sweetness" },
        { id: "hard_cider", drink: "Hard cider", why: "orchard logic against a sweet purée and a seared chop" },
        { id: "pinot_noir", drink: "Pinot Noir", why: "the red that respects a pork chop" },
        { id: "sparkling_apple", drink: "Sparkling apple juice", why: "the cider move, zero proof" },
        { id: "genmaicha", drink: "Genmaicha, iced", why: "toasted rice tea against char and squash" },
      ],
      wineStyles: ['off_dry_white', 'light_red', 'rich_white'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: true },
    cuisine: 'American',
    reheat: 'porkChopBase', // dedicated three-part card: sear pork, warm puree/broccolini bags
    chillOnly: true,
    equipment: { backBurner: true }, // sear + a couple of bags in water
    // The non-spotlight tier of the Bone-In Pork Rib Chop. Same idea, minus the
    // bone-in chop and minus the sauce — which is where BOTH the cost and the
    // Soy allergen lived (soy lecithin stabilizes that beurre blanc). Two chops
    // at ~0.75 lb each = 1.5 lb, split 4 ways = 6 oz raw pork per person, so the
    // menu copy says "two thick chops to split among four" out loud rather than
    // letting someone count chops at the table and feel short-changed.
    variants: [
      { label: '~4 servings', price: 55, cost: 24.24 },
    ],
    recipe: {
      factors: { '~4 servings': 1 },
      base: [
        I('Boneless pork chop', 1.5, 'lb'), // 2 chops @ ~0.75 lb
        I('Kabocha squash', 3, 'lb'),
        I('Broccolini', 2, 'bunch'),
        I('Butter', 0.5, 'stick'), // puree only; the sauce butter is gone with the sauce
      ],
    },
  },
  {
    name: 'Bone-In Pork Rib Chop with All the Fixings',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Thick-cut bone-in pork rib chop, cooked sous vide so it stays juicy, then seared at home. It goes over a brown-butter kabocha purée with charred broccolini, and the whole thing gets a spiced cider beurre blanc that's the real reason this one costs what it does. The sauce is a slow-built cider reduction mounted with a lot of good butter and warm spices, and it's what turns a pork chop into something you'd order out. Comfort food that eats like a restaurant. If the sauce isn't what you're after, the regular Pork Chop with Kabocha Purée and Charred Broccolini covers the same ground for less.",
      reheat: "Four parts: the pork in a sealed bag, the kabocha purée in a bag, the broccolini in a bag, and the spiced cider beurre blanc in a container. Let the pork sit out 30+ minutes before searing (it's a very thick cut), then pat dry and sear hard on each side in a blazing-hot pan. Reheat the purée and broccolini bags in simmering water until just heated through, and be careful with the broccolini as it can overcook. Warm the sauce gently over low heat; it's stabilized to survive a home reheat, so you have some room, just don't rush it. Plate the purée, lay the pork on one side, broccolini on the other, and drizzle the sauce over all of it.",
      contains: "Dairy (butter, cream). Soy (lecithin in the sauce).",
      pairings: [
        { id: "hard_cider", drink: "Hard apple cider", why: "pork and apples; the oldest pairing logic in the northern hemisphere" },
        { id: "riesling", drink: "Riesling", why: "cuts fat, flatters pork, handles whatever the fixings are" },
        { id: "amber_ale", drink: "Amber ale", why: "malt against a big seared chop" },
        { id: "sparkling_apple", drink: "Sparkling apple juice", why: "same orchard, no alcohol" },
        { id: "sweet_tea", drink: "Sweet iced tea", why: "the Southern plate's Southern drink" },
      ],
      wineStyles: ['off_dry_white', 'light_red', 'bold_red'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: true, soy: { variants: true, unlisted: 'soy lecithin stabilizes the cider beurre blanc — uncosted, negligible quantity, real allergen' } },
    cuisine: 'Spotlight',
    spotlight: true,
    reheat: 'porkChopSpotlight', // dedicated four-part card: sear pork, warm purée/broccolini bags, gentle sauce
    chillOnly: true,
    equipment: { backBurner: true }, // soft claim — sear + a couple bags in water + a gentle sauce reduction
    // Wrap cost is deliberately ABSORBED on this dish (not costed): the pork,
    // broccolini, and butter already make it expensive, so Kevin eats the
    // container cost to keep the price sane (Kevin, Jul 9). Large runs thin on
    // margin by design. Stabilizers (xanthan + soy lecithin) in the sauce are
    // not costed (negligible) but drive the Soy allergen + reheat forgiveness.
    servings: { small: 2, large: 6, bound: true },
    variants: [
      { label: 'Small (~2 servings)', price: 50, cost: 25.24 },
      { label: 'Medium (~4 servings)', price: 95, cost: 50.49 },
      { label: 'Large (~6 servings)', price: 130, cost: 75.73 },
    ],
    recipe: {
      factors: {
        'Small (~2 servings)': 1,
        'Medium (~4 servings)': 2,
        'Large (~6 servings)': 3,
      },
      base: [
        I('Bone-in pork rib chop', 2, 'lb'),
        I('Kabocha squash', 1.5, 'lb'), // Jul 15: was 2 sweet potatoes. 75% yield -> ~18 oz of puree for 2 servings.
        I('Cider', 12, 'oz'),
        I('Butter', 2, 'stick'),
        I('Broccolini', 1, 'bunch'),
        I('Sage', 1, 'pack'),
        I('Heavy cream', 0.33, 'cup'),
        I('Brown sugar', 3, 'tbsp'),
        I('Shallot', 0.1, 'lb'),
        I('Garlic', 2, 'cloves'),
        I('Fresh thyme', 1, 'sprig'),
        I('Bay leaf', 1, ''),
        I('Cinnamon stick', 1, ''),
        I('Whole cloves', 3, ''),
        I('Allspice', 3, ''),
        I('Nutmeg', 1, 'pinch'),
      ],
    },
  },
  {
    name: 'Steak au Poivre',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "The classic French steakhouse move, done right at home. Filet mignon with a peppercorn-cognac cream sauce, over pommes puree (that's fancy talk for mashed potatoes), with jumbo asparagus. This one is cooked to 131F, a perfect medium rare, no exceptions. Fair warning on the price: this is real filet mignon and a sauce built on Courvoisier cognac and a lot of cream, so it costs what a steakhouse plate costs, because that's what it is. Worth it for a special occasion.",
      reheat: "Four parts: the filet in a sealed bag, the pommes puree in a bag, the asparagus in a bag, and the peppercorn-cognac \"beurre blanc\" in a container. Let the filet sit out 30 minutes before searing (thick cut), then pat dry and sear hard on each side in a blazing-hot pan, and rest a few minutes. Cooked to 131F, medium rare. Reheat the puree bag in simmering water; the asparagus goes in too but only needs a minute, it overcooks fast. Warm the sauce gently over low heat; it's stabilized to survive a home reheat, so you have some room, just don't rush it. Plate the puree, filet over it, asparagus alongside, sauce over the steak.",
      contains: "Dairy (cream, butter). Soy (lecithin in the sauce).",
      pairings: [
        { id: "syrah", drink: "Syrah or Côtes du Rhône", why: "pepper on pepper; the Rhône was built for this sauce" },
        { id: "cabernet", drink: "Cabernet Sauvignon", why: "the steakhouse answer; tannin against beef and cream" },
        { id: "cognac", drink: "Cognac, tiny pour, after", why: "it's in the sauce; closing the loop is allowed" },
        { id: "sparkling_water", drink: "Sparkling water, very cold", why: "between bites of cream and pepper, you want a hard reset" },
        { id: "malbec", drink: "Malbec", why: "the value answer that still has the shoulders for it" },
      ],
      wineStyles: ['bold_red'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: true, soy: { variants: true, unlisted: 'soy lecithin stabilizes the peppercorn beurre blanc — uncosted, negligible quantity, real allergen' } },
    cuisine: 'Spotlight',
    spotlight: true,
    reheat: 'steakAuPoivreSpotlight', // four-part: sear filet (30 min warm), warm purée/asparagus bags, gentle sauce
    chillOnly: true,
    equipment: { backBurner: true },
    // The most expensive dish on the menu, by design — real filet mignon ($25
    // small) + a Courvoisier-and-cream sauce. Wrap cost absorbed. Large runs
    // under floor (~42%) at Kevin's chosen $210. Stabilized sauce (xanthan +
    // soy lecithin, uncosted) → Soy allergen + reheat forgiveness note.
    servings: { small: 2, large: 6, bound: true },
    variants: [
      { label: 'Small (~2 servings)', price: 80, cost: 43.61 },
      { label: 'Medium (~4 servings)', price: 150, cost: 87.22 },
      { label: 'Large (~6 servings)', price: 210, cost: 130.83 },
    ],
    recipe: {
      factors: {
        'Small (~2 servings)': 1,
        'Medium (~4 servings)': 2,
        'Large (~6 servings)': 3,
      },
      base: [
        I('Filet mignon', 1, 'lb'),
        I('Heavy cream', 2, 'cup'),
        I('Jumbo asparagus', 0.66, 'lb'),
        I('Yukon gold potato', 1, 'lb'),
        I('Cognac', 2.67, 'oz'),
        I('Butter', 0.5, 'stick'),
        I('Black pepper (oz)', 1, 'oz'),
        I('Fresh thyme', 1, 'sprig'),
        I('Shallot', 0.1, 'lb'),
        I('Garlic', 1, 'cloves'),
      ],
    },
  },
{
    name: 'Boeuf Bourguignon (Beef Stew)',
    // CANON customer copy — the single source for this dish's prose. menu.html
    // LIBRARY must MATCH these verbatim (tests/library_sync.mjs), and
    // main-menu.html's Allergens line is generated from copy.contains
    // (tools/syncMainMenu.mjs --write). Edit HERE; the gates do the rest.
    copy: {
      desc: "Beef chuck braised low and slow in red wine with aromatics until the meat is fork-tender. The sauce is the whole point here: the braising liquid reduces down with the wine, tomato paste, and beef stock into something glossy, deep, and almost syrupy, with a savory backbone that coats every bite. It is what you are really paying for. Comes with carrots and potatoes cooked separately in a sous vide bag — reheat the stew, then add the vegetables right before serving so nothing overcooks. Want mushrooms? Add a pound for $12.",
      reheat: "Comes in two parts — the stew in a container and the vegetables in a sous vide bag. Warm the stew gently on the stove over medium-low until the meat is heated through. Reheat the veg bag in simmering water, discard the liquid — it contains butter, so avoid pouring it down the drain — then fold the vegetables into the stew right before serving. Great over mashed potatoes, egg noodles, or crusty bread.",
      contains: "Gluten (flour), Dairy (butter, in the vegetable bag).",
      pairings: [
        { id: "pinot_noir", drink: "Red Burgundy (Pinot Noir)", why: "the dish is named for the region; drink what it's made of" },
        { id: "beaujolais", drink: "Beaujolais (Fleurie or Morgon)", why: "the lighter Burgundian answer, floral against beef and bacon" },
        { id: "cotes_du_rhone", drink: "Côtes du Rhône", why: "if you want more muscle under the sauce" },
        { id: "sparkling_water", drink: "Sparkling water with a twist", why: "the stew is wine-dark already; the glass can be quiet" },
        { id: "black_tea", drink: "Strong black tea", why: "tannin's zero-proof cousin, and it stands up to the sauce" },
      ],
      wineStyles: ['light_red', 'bold_red'],
    },
    // Structured allergen claims, gated by tests/allergens.mjs against the
    // resolved recipe (same machinery as diet flags). Free-text 'contains'
    // in menu.html LIBRARY stays for human detail; these are the checkable
    // layer beneath it. true = every variant; array = those variants only;
    // { variants, unlisted } = declared without a matching recipe line, with
    // the reason on record.
    allergens: { dairy: { variants: true, unlisted: "butter in the veg bag line, which resolves to sv_bag" }, gluten: { variants: true, unlisted: 'a light roux thickens the stew at the end, uncosted (Kevin confirmed Jul 16)' } },
    cuisine: 'Spotlight',
    spotlight: true, // (Kevin, Jul 10): expensive enough to warrant it — joins the spotlight group
    reheat: 'stovetop',
    equipment: { fixed: ['dutch', 'ovenLow'] },
    variants: [
      { label: '~4 servings', price: 100, cost: 46.37 },
      { label: 'With 1 lb mushrooms', price: 112, cost: 52.37 },
    ],
    recipe: {
      factors: { '~4 servings': 1, 'With 1 lb mushrooms': 1 },
      base: [
        I('Beef chuck roast', 2.5, 'lb'),
        I('Red potatoes', 1.5, 'lb'),
        I('Carrots', 1.5, 'lb'),
        I('Red wine', 1, 'bottle'),
        I('Beef stock', 8, 'cups'),
        I('Fresh thyme', 1, 'sprig'),
        I('Tomato paste', 1, 'small can'),
        I('Onion', 1, 'lb'),
        I('Bay + salt + pepper + vinegar', 1, 'batch', true),
      ],
      // ONE sous vide bag per dish (potatoes + carrots share one bag). Fixed so
      // it doesn't scale. Boeuf has no Small/Large split (both variants are
      // ~4-serving, factor 1), so both carry the $2 bag. If Kevin wants Boeuf
      // treated as a "large" dish with the $3 bag, swap the costed string.
      extras: {
        '~4 servings': [{ ...I('Sous vide bag + butter + herbs (costed)', 1, ''), fixed: true }],
        'With 1 lb mushrooms': [I('Mushrooms', 1, 'lb'), { ...I('Sous vide bag + butter + herbs (costed)', 1, ''), fixed: true }],
      },
    },
    // Dedicated 2-paragraph reheat card (main + veg bag) — never combined
    // with another dish on one card. Both veg paragraphs end with the same
    // butter/drain line by design.
    stewVegCopy: {
      main: 'Comes in two parts — the stew in a container and the vegetables in a sous vide bag. Warm the stew gently on the stove over medium-low until the meat is heated through, adding a splash of water if it looks thick. Great over mashed potatoes, egg noodles, or crusty bread.',
      veg: 'Bring a pot of water to a gentle simmer and place the sealed bag in until heated through. Cut open, discard the liquid, and fold the vegetables into the stew right before serving. The liquid contains butter, so avoid pouring it down the drain.',
    },
  },
  {
    // OFF-MENU DRAFT (Jul 20): built and costed, but exempted from library_sync
    // (OFF_MENU) and syncMainMenu (CARDLESS) so it renders on NO customer page.
    // To go live: remove it from both exemption sets and add its LIBRARY copy to
    // menu.html. Sizing is a normal Large = 2x Small (the sauce is batched at
    // half for a Small). Prices are FLOOR-HOLDING PLACEHOLDERS pending Kevin.
    name: 'Pecan Mole-Fesenjan, Beef and Kabocha',
    copy: {
      desc: "A Persian fesenjan that walked west into mole. The sauce is built from toasted Texas pecans and pomegranate molasses, cooked down dark with dried chiles and a whisper of unsweetened chocolate until it is sour, bitter, and deep, and nobody guesses what is in it. Beef chuck in big chunks over kabocha squash cooked in the same warm spices, with cold pickled onion to cut it, pepitas for crunch, and charred tortillas for scooping. Made a day ahead on purpose.",
      reheat: "Comes as the braise and kabocha in a container, rice to cook fresh, tortillas, and the cold pickled onion and pepitas separately. Cook the rice. Warm the braise gently on the stove over medium-low until it loosens and comes back to a gloss, adding a splash of water if it has tightened. Char the tortillas straight over a burner or in a dry hot pan until they blister. Braise over rice, tortillas alongside, the pickled onion and pepitas cold over the top, and the pomegranate seeds if they came with it.",
      contains: "Tree nuts (pecans). Gluten (the flour in the tortillas).",
      pairings: [
        { id: "tempranillo", drink: "Tempranillo or Rioja", why: "earthy Spanish red that meets the mole's chile-and-chocolate depth without fighting it" },
        { id: "zinfandel", drink: "Zinfandel", why: "jammy and high-toned enough to stand up to the sour-sweet braise and the beef" },
        { id: "jamaica", drink: "Agua de jamaica (hibiscus)", why: "tart cold hibiscus cuts the richness; the Mexican table's own answer" },
        { id: "horchata", drink: "Horchata", why: "cinnamon-rice sweetness soothes the chile heat if you want calm instead of contrast" },
        { id: "abita_amber", drink: "Amber ale", why: "malt against the pecan and beef without arguing with the pomegranate" },
      ],
      wineStyles: ['bold_red'],
    },
    allergens: { tree_nut: true, gluten: true },
    cuisine: 'Persian',
    reheat: 'stovetop',
    rice: true,
    equipment: { fixed: ['dutch'] },
    variants: [
      { label: 'Small (~4 servings)', price: 75, cost: 38.58 },  // PLACEHOLDER price; ~49% @ buffered cost
      { label: 'Large (~8 servings)', price: 150, cost: 76.08 }, // PLACEHOLDER price; ~49%. Large is 1.97x Small (flat dried-chili bag + spice bucket)
    ],
    recipe: {
      factors: { 'Small (~4 servings)': 0.5, 'Large (~8 servings)': 1 },
      base: [
        I('Prime boneless chuck roast', 4, 'lb'),
        I('Pecans', 12, 'oz'),
        I('Pomegranate molasses', 0.75, 'cup'),
        I('100% dark chocolate', 1, 'square'),
        I('Assorted dried chilis', 1, 'bag'),
        I('Onion', 2, ''),
        I('Mole spice blend', 1, 'blend', true),
        I('Garlic', 3, 'cloves'),
        I('Honey', 2, 'tbs'),
        I('Kabocha squash', 3, 'lb'),
        I('Pickled onion (house)', 1, 'container'),
        I('Pepitas', 2, 'oz'),
        I('Pomegranate seeds', 2, 'oz'),
        I('Mitad-y-mitad tortillas', 2, '10ct'),
      ],
    },
  },
];
// Same registry idea: each item's recipe/equipment/packaging lives on the
// record. packaging: 'jar' → $2 wrap, 'none' → $0, absent → default $1.
export const ALWAYS_ITEMS = {
  breakfast: [
    {
      name: 'Homemade Waffles',
      variants: [{ label: 'Set of 12', price: 7, cost: 2.78 }],
      recipe: {
        factors: { 'Set of 12': 1 },
        base: [
          I('Milk', 2, 'cups'),
          I('Butter', 1, 'stick'),
          I('Flour', 270, 'g', true),
          I('Eggs', 2, '', true),
          I('Gallon ziplock bag', 1, '', true),
        ],
      },
    },
  ],
  fruit: [
    {
      name: 'Fresh Cut Pineapple',
      packaging: 'none',
      variants: [{ label: 'Per Container', price: 6, cost: 2.5 }],
      recipe: { factors: { 'Per Container': 0.5 }, base: [I('Pineapple (1 makes 2 containers)', 1, '')] },
    },
    {
      name: 'Seasonal Cantaloupe',
      packaging: 'none',
      variants: [{ label: 'Per Container', price: 6, cost: 3 }],
      recipe: { factors: { 'Per Container': 1 }, base: [I('Seasonal cantaloupe (HEB melons)', 1, '')] },
    },
  ],
  desserts: [
    {
      name: 'Chocolate Chip Cookies',
      equipment: { fixed: ['ovenNormal'] },
      variants: [
        { label: '1 Dozen (Standard)', price: 25, cost: 11.33 },
        { label: '1 Dozen (Premium Valrhona)', price: 40, cost: 23.33 },
      ],
      recipe: {
        factors: { '1 Dozen (Standard)': 1, '1 Dozen (Premium Valrhona)': 1 },
        base: [
          I('Butter', 2, 'sticks'),
          I('Flour', 322, 'g', true),
          I('Eggs', 3, '', true),
          I('Brown + white sugar', 1, 'batch', true),
        ],
        extras: {
          '1 Dozen (Standard)': [I('Guittard chocolate (low + high %)', 290, 'g')],
          '1 Dozen (Premium Valrhona)': [I('Valrhona chocolate', 290, 'g')],
        },
      },
    },
    {
      name: 'Peanut Butter Fudge',
      equipment: { fixed: ['largePot'] },
      // Anchor re-cut to the recipe's real cost Jul 15 (was $4.35). The old
      // number was built when peanut butter was costed per 'half-jar' @ $0.70,
      // a unit that implied PB cost ~$1.18 for a 16 oz jar. The real jar (Peter
      // Pan 40 oz, $5.64) is $0.141/oz, which makes the 0.5 cup line $0.67
      // rather than $0.35. Margin at $20 goes 78.3% -> 76.2%, so the price
      // holds; the anchor was simply wrong.
      variants: [{ label: '1 Batch', price: 20, cost: 4.77 }],
      recipe: {
        factors: { '1 Batch': 1 },
        base: [
          I('Peanut butter', 0.5, 'cup'),
          I('Evaporated milk', 0.75, 'cup'),
          I('Butter', 0.375, 'stick'),
          I('Sugar + karo + cocoa + vanilla', 1, 'batch', true),
        ],
      },
    },
    {
      name: 'Brownies',
      equipment: { fixed: ['ovenNormal'] },
      variants: [{ label: '1 Batch', price: 25, cost: 10.46 }],
      recipe: {
        factors: { '1 Batch': 1 },
        base: [
          I('Butter (browned)', 2, 'sticks'),
          I('Dutch cocoa', 16, 'tbsp'),
          I('Guittard chocolate (semisweet)', 113, 'g'),
          I('DeLallo instant espresso', 1, 'tsp'),
          I('Brown + white sugar', 1, 'batch', true),
          I('Eggs', 4, '', true),
          I('Flour', 120, 'g', true),
          I('Kosher salt + vanilla', 1, 'batch', true),
        ],
      },
    },
  ],
  addons: [
    {
      name: 'Queso',
      packaging: 'jar',
      equipment: { fixed: ['largePot'] },
      variants: [
        { label: 'Per Pint Jar', price: 12, cost: 4.87 },
        { label: 'With jar swap', price: 10, cost: 3.62 },
      ],
      recipe: {
        factors: { 'Per Pint Jar': 0.5, 'With jar swap': 0.5 },
        base: [
          I('Oaxaca cheese', 250, 'g'),
          I('Colby Jack', 250, 'g'),
          I('Poblano pepper', 90, 'g'),
          I('Sweet onion', 135, 'g'),
          I('Habaneros', 2, ''),
          I('Dried ancho chili', 9, 'g'),
          I('Limes', 1, ''),
          I('Cilantro', 15, 'g'),
          I('Sodium citrate', 20, 'g', true),
          I('Pint mason jar', 2, '', false),
        ],
      },
    },
    {
      name: 'Pickled Onions or Carrots',
      packaging: 'jar',
      variants: [
        { label: 'Standard', price: 7.5, cost: 4 },
        { label: 'With jar swap', price: 5.5, cost: 2.75 },
      ],
      recipe: {
        factors: { 'Standard': 1, 'With jar swap': 1 },
        base: [
          I('Onions or carrots (for pickling)', 1, 'lb'),
          I('Pint mason jar', 1, ''),
          I('Pickling vinegar + spices', 1, 'batch', true),
        ],
      },
    },
    {
      name: 'Chili Oil',
      packaging: 'jar',
      variants: [
        { label: 'Per Jar', price: 10, cost: 4.07 },
        { label: 'With jar swap', price: 8, cost: 3.07 },
      ],
      recipe: {
        factors: { 'Per Jar': 0.5, 'With jar swap': 0.5 },
        base: [
          I('Ginger', 4, 'knobs'),
          I('Pint mason jar', 2, ''),
          I('Chili flakes + whole spices + oil', 1, 'batch', true),
        ],
      },
    },
    {
      name: 'Thyme or Lavender Syrup',
      packaging: 'jar',
      variants: [
        { label: 'Per Jar', price: 7, cost: 4.35 },
        { label: 'With jar swap', price: 5, cost: 2.35 },
      ],
      recipe: {
        factors: { 'Per Jar': 1, 'With jar swap': 1 },
        base: [
          I('Fresh thyme or lavender', 4, 'sprigs'),
          I('Pint mason jar', 1, ''),
          I('Sugar', 1, 'cup', true),
        ],
      },
    },
    {
      name: 'Vanilla Syrup',
      packaging: 'jar',
      variants: [
        { label: 'Per Jar', price: 12, cost: 7.17 },
        { label: 'With jar swap', price: 10, cost: 5.17 },
      ],
      recipe: {
        factors: { 'Per Jar': 1, 'With jar swap': 1 },
        base: [
          I('Pint mason jar', 1, ''),
          I('House vanilla extract + beans', 1, 'batch', true),
          I('Sugar', 1, 'cup', true),
        ],
      },
    },
    {
      name: 'Vanilla Lavender Syrup',
      packaging: 'jar',
      variants: [
        { label: 'Per Jar', price: 13, cost: 8.17 },
        { label: 'With jar swap', price: 11, cost: 6.17 },
      ],
      recipe: {
        factors: { 'Per Jar': 1, 'With jar swap': 1 },
        base: [
          I('Fresh lavender', 1, 'bunch'),
          I('Pint mason jar', 1, ''),
          I('House vanilla extract + beans', 1, 'batch', true),
          I('Sugar', 1, 'cup', true),
        ],
      },
    },
  ],
  // ── PROTEINS (sous vide, priced by weight) ────────────────────────────────
  // perLb items: pricePerLb is the clean /lb price (NO bag baked in — the
  // $1.50 bag is added at display/estimate time). avgWeightLb drives the
  // per-piece order estimate in form.html.
  bag: [
    // Proteins ordered by type (beef, then pork, then chicken), alphabetical
    // within each type. Order here flows straight through menu.js → publish →
    // form.html render, so this array IS the customer-facing order.
    // ── BEEF (alphabetical) ──────────────────────────────────────────────────
    {
      name: 'Filet Mignon', packaging: 'none', perLb: true, pricePerLb: 34, costPerLb: 23.49, avgWeightLb: 0.5,
      variants: [{ label: 'price by weight', price: 34, cost: 23.49 }],
      recipe: { factors: { 'price by weight': 1 }, base: [I('Filet mignon', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)] },
    },
    {
      name: 'Filet Mignon - Prime', packaging: 'none', perLb: true, pricePerLb: 55, costPerLb: 34.99, avgWeightLb: 0.5,
      variants: [{ label: 'price by weight', price: 55, cost: 34.99 }],
      recipe: { factors: { 'price by weight': 1 }, base: [I('Filet Mignon - Prime', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)] },
    },
    {
      name: 'Flank Steak', packaging: 'none', perLb: true, pricePerLb: 20, costPerLb: 11, avgWeightLb: 1.2,
      variants: [{ label: 'price by weight', price: 20, cost: 11 }],
      recipe: { factors: { 'price by weight': 1 }, base: [I('Flank steak', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)] },
    },
    {
      name: 'NY Strip', packaging: 'none', perLb: true, pricePerLb: 26, costPerLb: 14.49, avgWeightLb: 0.75,
      variants: [{ label: 'price by weight', price: 26, cost: 14.49 }],
      recipe: { factors: { 'price by weight': 1 }, base: [I('NY Strip', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)] },
    },
    {
      name: 'NY Strip - Prime', packaging: 'none', perLb: true, pricePerLb: 32, costPerLb: 17.99, avgWeightLb: 0.75,
      variants: [{ label: 'price by weight', price: 32, cost: 17.99 }],
      recipe: { factors: { 'price by weight': 1 }, base: [I('NY Strip - Prime', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)] },
    },
    {
      name: 'Ribeye', packaging: 'none', perLb: true, pricePerLb: 30, costPerLb: 16.49, avgWeightLb: 0.75,
      variants: [{ label: 'price by weight', price: 30, cost: 16.49 }],
      recipe: { factors: { 'price by weight': 1 }, base: [I('Ribeye', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)] },
    },
    {
      // Prime line: renders directly under the regular Ribeye. Separate perLb
      // item (name-keyed pricing) so the whole weight pipeline works unchanged.
      name: 'Ribeye - Prime', packaging: 'none', perLb: true, pricePerLb: 35, costPerLb: 19.99, avgWeightLb: 0.75,
      variants: [{ label: 'price by weight', price: 35, cost: 19.99 }],
      recipe: { factors: { 'price by weight': 1 }, base: [I('Ribeye - Prime', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)] },
    },
    // ── PORK (alphabetical) ──────────────────────────────────────────────────
    {
      name: 'Pork Tenderloin', packaging: 'none', perLb: true, pricePerLb: 15, costPerLb: 7.29, avgWeightLb: 1.25,
      variants: [{ label: 'price by weight', price: 15, cost: 7.29 }],
      recipe: { factors: { 'price by weight': 1 }, base: [I('Pork tenderloin', 1.25, 'lb'), I('Sous vide bag + seasonings', 1, '', true)] },
    },
    {
      // Jul 15: swapped to the H-E-B Natural Boneless Center Loin THICK CUT
      // ($6.29/lb, avg 0.75 lb). The old $4.19 anchor was CORRECT for the
      // thinner chop it replaced ($3.99/lb) — this is a product change, not a
      // fix. $6.29 raw x 1.0825 = $6.81 buffered; $13/lb holds 47.6%.
      name: 'Thick-Cut Pork Chop', packaging: 'none', perLb: true, pricePerLb: 13, costPerLb: 6.81, avgWeightLb: 0.75,
      variants: [{ label: 'price by weight', price: 13, cost: 6.81 }],
      recipe: { factors: { 'price by weight': 1 }, base: [I('Pork chop', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)] },
    },
    // ── CHICKEN ──────────────────────────────────────────────────────────────
    {
      name: 'Air-Chilled Chicken Breast', packaging: 'none', perLb: true, pricePerLb: 13, costPerLb: 7.27, avgWeightLb: 0.55,
      variants: [{ label: 'price by weight', price: 13, cost: 7.27 }],
      recipe: { factors: { 'price by weight': 1 }, base: [I('Chicken breast', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)] },
    },
    // ── VEG (sous vide bags) — ordered by price then alphabetical ────────────
    {
      name: 'Carrots', packaging: 'none',
      variants: [{ label: '~2 servings', price: 6.5, cost: 2.71 }],
      recipe: { factors: { '2 servings': 1 }, base: [I('Carrots', 0.5, 'lb'), I('Sous vide bag + butter + herbs (costed)', 1, '')] },
    },
    {
      name: 'Baby Gold Potatoes', packaging: 'none',
      variants: [{ label: '~2 servings', price: 7.5, cost: 3.79 }],
      recipe: { factors: { '2 servings': 1 }, base: [I('Baby gold potatoes', 0.75, 'lb'), I('Sous vide bag + butter + herbs (costed)', 1, '')] },
    },
    {
      name: 'Corn (off the cob)', packaging: 'none',
      variants: [{ label: '~2 servings', price: 7.5, cost: 2.98 }],
      recipe: { factors: { '2 servings': 1 }, base: [I('Corn', 3, 'ears'), I('Sous vide bag + butter + herbs (costed)', 1, '')] },
    },
    {
      name: 'Kabocha Squash', packaging: 'none',
      variants: [{ label: '~2 servings', price: 7.5, cost: 3.25 }],
      recipe: { factors: { '2 servings': 1 }, base: [I('Kabocha squash', 0.667, 'lb'), I('Sous vide bag + butter + herbs (costed)', 1, '')] },
    },
    {
      name: 'Parsnips', packaging: 'none',
      variants: [{ label: '~2 servings', price: 10, cost: 5.25 }],
      recipe: { factors: { '2 servings': 1 }, base: [I('Parsnips', 0.909, 'lb'), I('Sous vide bag + butter + herbs (costed)', 1, '')] },
    },
    {
      name: 'Asparagus', packaging: 'none',
      variants: [
        { label: 'Whole (~2 servings)', price: 9, cost: 4.32 },
        { label: 'Bite-size (~2 servings)', price: 9, cost: 4.32 },
      ],
      recipe: { factors: { 'Whole (~2 servings)': 1, 'Bite-size (~2 servings)': 1 }, base: [I('Asparagus', 0.667, 'lb'), I('Sous vide bag + butter + herbs (costed)', 1, '')] },
    },
    {
      // Garlic Confit lives in the bag category (not its own section) — it's a
      // shelf-stable "stuff in a bag" item like the veg. It keeps its own
      // customer copy (frozen-storage / botulism note) via the LIBRARY, but
      // renders as a normal bag card. NOT flagged isSousVideVeg (it isn't a
      // glaze veg and doesn't join the consolidated veg block).
      name: 'Garlic Confit', packaging: 'none',
      variants: [{ label: '6 oz bag', price: 10, cost: 5.05 }],
      recipe: { factors: { '6 oz bag': 1 }, base: [I('Garlic', 12, 'cloves'), I('Sous vide bag + seasonings', 1, '', true)] },
    },
  ],
  sauces: [
    { name: 'Chimichurri', variants: [{ label: 'Per Container', price: 3, cost: 0.40 }] },
    { name: 'Romesco', variants: [{ label: 'Per Container', price: 4, cost: 0.80 }] },
    { name: 'Chermoula', variants: [{ label: 'Per Container', price: 3, cost: 0.40 }] },
    { name: 'Miso Butter Sauce', variants: [{ label: 'Per Container', price: 3, cost: 0.55 }] },
    { name: 'Whipped Lemon Garlic Herb Butter', variants: [{ label: 'Per Container', price: 3, cost: 0.53 }] },
  ],
};

// Flat list of every always-menu item (order preserved within categories).
export const ALL_ALWAYS_ITEMS = Object.values(ALWAYS_ITEMS).flat();

// Always-menu items Kevin wants cost/margin/drift tracking on in the Recipes
// tab (they have real, driftable recipes). Kept explicit so the tab stays
// focused — not every jarred add-on needs a report.
const REPORTABLE_ALWAYS_NAMES = ['Queso', 'Chocolate Chip Cookies', 'Peanut Butter Fudge', 'Brownies'];
export const REPORTABLE_ALWAYS_ITEMS = ALL_ALWAYS_ITEMS.filter(it => REPORTABLE_ALWAYS_NAMES.includes(it.name));

// The "Ready to Finish" (sous vide proteins) and "Sous Vide Vegetables" bag
// items are cost/margin-tracked in the Recipes tab too, but behind their own
// collapsed dropdowns (Kevin looks at them rarely). Split the bag category by
// whether an item is a vegetable (isSousVideVeg copy flag would be ideal, but
// the registry doesn't carry copy — so we split by an explicit veg-name set).
const SOUS_VIDE_VEG_NAMES = new Set(['Carrots', 'Baby Gold Potatoes', 'Corn (off the cob)', 'Kabocha Squash', 'Parsnips', 'Asparagus', 'Garlic Confit']);
const BAG_ITEMS = ALWAYS_ITEMS.bag || [];
export const REPORTABLE_BAG_PROTEINS = BAG_ITEMS.filter(it => !SOUS_VIDE_VEG_NAMES.has(it.name));
export const REPORTABLE_BAG_VEG = BAG_ITEMS.filter(it => SOUS_VIDE_VEG_NAMES.has(it.name));

// Full reporting universe: dinners + queso/desserts + bag proteins + bag veg.
export const REPORTABLE_DISHES = [...DISHES, ...REPORTABLE_ALWAYS_ITEMS, ...REPORTABLE_BAG_PROTEINS, ...REPORTABLE_BAG_VEG];
