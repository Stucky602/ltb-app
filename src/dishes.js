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
  // ── East Asian ─────────────────────────────────────────────────────────────
  {
    name: 'Bo Ssam',
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
        'Small (~4 servings) + Polenta': [I('Polenta + butter + parmesan (bagged)', 1, 'batch')],
        'Large (~8 servings) + Polenta': [I('Polenta + butter + parmesan (bagged)', 1, 'batch')],
      },
    },
  },

  {
    name: 'Pork with Mustard Tarragon Cream Sauce',
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
        'Small (~4-5 servings) + Polenta': [I('Polenta + butter + parmesan (bagged)', 1, 'batch')],
      },
    },
  },

  // ── SPOTLIGHT DINNERS (bottom of the dinner list, before the bag section) ──
  // Higher-price plates built around pricier ingredients; one is featured per
  // week. Tagged spotlight:true so WeekTab/publish can route the selected one
  // to its own "Spotlight dinner of the week" header on the weekly menu.
  {
    name: 'Coriander Lamb Steak over Gigantes Beans',
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
