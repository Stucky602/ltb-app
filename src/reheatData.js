// src/reheatData.js — what Kevin knows about living with each dish.
//
// TRANSCRIBED FROM WALK 2, NOT DERIVED. Every field here traces to a dish
// section in THE_WALKS_ANSWERS.md. Where the walk did not say, the field is
// null and the coverage gate reports it — the same honesty rule the Chronicle
// uses, and for the same reason: a confident wrong answer about how long
// something takes or whether it freezes is worse than an admitted blank.
//
// SEPARATE MODULE, deliberately. This is not shopping-list data, so it must not
// live on `dish.recipe` — the version hash watches that object, and a walk
// answer arriving should never cut a recipe version. It is also per-COMPONENT
// in a way recipe lines are not.
//
// FOUR CONSUMERS: Before You Start (timing, equipment), Serve-Together
// (sequence, equipment), Eat-First/Freeze-First (freeze), Heat Only What You
// Need (divide). The ask box is grounded on all of it, which is where Kevin
// ruled the long answers belong.
//
// ── TIMING IS CUSTOMER-CLOCK ─────────────────────────────────────────────
// Kevin counts the fifteen minutes of waiting for water to boil, and the
// thirty-minute temper, INSIDE the total. His numbers answer "how long until
// dinner", not "how long am I working". Anything showing these to a customer
// must present them the same way or the estimate is a lie in his favour.
//
// governor 'rice'  → 30-60, entirely the customer's rice method
// governor 'pasta' → about 20 (~15 for the water, 4-5 to cook)
// governor 'none'  → the dish's own number

// 'na' and 'keeps' were one value at first, and that was wrong. `na` means
// there is no storage decision because the thing ships uncooked — rice, a pasta
// pack. `keeps` means there IS a component sitting in the fridge and the answer
// is that it needs nothing from you. Kevin's kimchi is the second: "not a
// freeze item and does not need to be, keeping is the entire point of kimchi."
// Collapsing them hid a real answer behind a placeholder.
export const FREEZE_VERDICTS = ['excellent', 'well', 'acceptable', 'no', 'keeps', 'na'];

// DIVIDE MODES, built on Kevin's own reframing. The question was never "is it
// in a bag" — it is "IS THE BAG THE COOKING VESSEL". A bag simmered whole is
// the hard case; a bag whose contents come out to be seared divides freely.
export const DIVIDE_MODES = [
  'scoop',            // one container, take what you want
  'pour-and-keep',    // tip part of a bag in, the rest goes back in the fridge
  'pieces',           // discrete portions: two chops, two pork halves
  'loose',            // not sealed at all, just pick out what you want
  'bag-is-vessel',    // the polenta problem: opening it costs you the method
  'not-recommended',  // possible, but Kevin grades it down himself
];

const D = (o) => ({ timing: null, components: [], equipment: [], methods: null, safety: [], askBox: [], ...o });

export const REHEAT_DATA = {

  'brunswick-stew': D({
    timing: { min: 10, max: 10, governor: 'none', active: null, inactive: null, waitFirst: null,
      note: 'Low attention. It is a stew, it is forgiving, and forgetting it for a while does not hurt it.' },
    components: [
      { key: 'stew', package: 'round48',
        freeze: { verdict: 'excellent', tested: true, note: null },
        divide: { mode: 'scoop', note: null } },
      { key: 'potatoes', package: 'bag',
        freeze: { verdict: 'no', tested: true,
          note: 'Use them for something else that week, freeze the stew alone, then add your own raw potatoes to the thawed stew and cook until tender, 30 to 40 minutes. Not as good, but good.' },
        divide: { mode: 'pour-and-keep', note: 'The potato bag itself divides. It is not all-or-nothing.' } },
    ],
    equipment: [{ vessel: 'pot', note: 'Any size burner. Nothing competes.' }],
    askBox: ['The potato step can be done entirely off the heat. Gentle heat throughout — do not boil, because the thicker items run hot on the outside while the middle is still cold.'],
  }),

  'chili': D({
    timing: { min: 10, max: 10, governor: 'none', active: null, inactive: null, waitFirst: null,
      note: 'A mirror of the Brunswick, minus the potato bag. Forgiving, low attention.' },
    components: [
      { key: 'chili', package: 'round48',
        freeze: { verdict: 'excellent', tested: true, note: 'Nothing to hold back — there is no bag.' },
        divide: { mode: 'scoop', note: null } },
    ],
    equipment: [{ vessel: 'pot', note: 'Any size burner.' }],
    askBox: ['Add water if it seems too thick. Gentle heat, do not boil.'],
  }),

  'gumbo': D({
    timing: { min: 30, max: 60, governor: 'rice', active: null, inactive: null, waitFirst: null,
      sequence: 'Start the gumbo when the rice has about a third of its cooking time left.',
      note: 'Mostly hands off.' },
    components: [
      { key: 'gumbo', package: 'round48',
        freeze: { verdict: 'excellent', tested: true, note: null },
        divide: { mode: 'scoop', note: null } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'file', package: 'cup2',
        freeze: { verdict: 'na', tested: true, note: null },
        divide: { mode: 'loose', note: 'Sprinkle to the thickness you want.' } },
    ],
    equipment: [
      { vessel: 'pot', note: 'For the gumbo.' },
      { vessel: 'burner or rice cooker', note: 'Two burners if there is no rice cooker.' },
    ],
    askBox: ['The gumbo now leaves the kitchen without its final thickening — the file is yours to add, a little at a time, until it is as thick as you like it.'],
  }),

  'tex-mex-kit': D({
    // Kevin, Jul 31: the timing is the RICE, same as every other rice dish. The
    // reheating itself is about two minutes — beans, meat, and toasting the
    // tortillas. Recorded as rice-governed with the active time stated, because
    // "30 to 60 minutes" on its own would read as an hour of work when almost
    // all of it is the rice cooking unattended.
    timing: { min: 30, max: 60, governor: 'rice', active: 2, inactive: null, waitFirst: null,
      note: 'Governed entirely by the rice. The actual reheating is about two minutes: the beans, the protein, and toasting the tortillas.' },
    components: [
      { key: 'protein', package: 'round48',
        freeze: { verdict: 'no', tested: true, note: 'The kit keeps well in the fridge and is a fine last meal of the week.' },
        divide: { mode: 'scoop', note: 'Comes sitting in its braise.' } },
      { key: 'beans', package: 'round16',
        freeze: { verdict: 'no', tested: true, note: null },
        divide: { mode: 'scoop', note: null } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'pico', package: null,
        freeze: { verdict: 'no', tested: true, note: null },
        divide: { mode: 'scoop', note: 'Ready as it is, no heat.' } },
      { key: 'tortillas', package: null,
        // THE INVERSION. Category 2 in the old four-tier scheme meant "freezes
        // well with one component separated"; here the separated component is
        // the one that DOES freeze. Per-component is the only shape that says
        // this without contorting.
        freeze: { verdict: 'excellent', tested: true, note: 'About 30 minutes to thaw out of the freezer.' },
        divide: { mode: 'loose', note: null } },
    ],
    equipment: [
      { vessel: 'saucepan', note: 'Beans.' },
      { vessel: 'pot or pan', note: 'Protein.' },
      { vessel: 'nonstick skillet', note: 'Tortillas.' },
    ],
    askBox: ['Three vessels and potentially three burners — the heaviest equipment load on the menu. Every component is scoop-what-you-need, so it divides by construction.'],
  }),

  'indian-style-curry': D({
    timing: { min: 30, max: 60, governor: 'rice', active: null, inactive: null, waitFirst: null,
      sequence: 'Add the bag when the rice has about a third of its cooking time left.' },
    components: [
      { key: 'curry', package: 'round48',
        freeze: { verdict: 'well', tested: true,
          note: 'Unless there were potatoes that week — then pull them out, use them for something else, and freeze the curry without them.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'bag', package: 'bag',
        freeze: { verdict: 'no', tested: true, note: 'Conditional — some weeks there is no bag at all.' },
        // Kevin, Aug 1. The conditional is deliberate and it HOLDS THE NO-NAMING
        // RULE: he does not know until he is grocery shopping whether the bag
        // carries a vegetable or a protein, so the copy never says. The customer
        // resolves it by looking, which they can.
        divide: { mode: 'pour-and-keep',
          note: 'Portion the curry you want into a saucepan, then add roughly the same share of the bag — '
            + 'half the curry, half the bag. If it is a vegetable, drain the liquid off and discard it. '
            + 'If it is a protein, the liquid can go in too.' } },
    ],
    equipment: [
      { vessel: 'pot', note: 'For the curry; the bag needs no pot of its own.' },
      { vessel: 'burner or rice cooker', note: 'Two burners if there is no rice cooker.' },
    ],
    // NOT ON THE CARD, deliberately. The two bag types need OPPOSITE liquid
    // handling — a vegetable bag's liquid is discarded, a protein bag's is not
    // — and the card cannot know which one shipped. The ask box can answer it
    // when someone asks, which is exactly what Kevin said it is for.
    askBox: [
      'Some weeks a component comes bagged. If it is vegetables, discard the liquid. If it is the protein, do not — it goes in with everything.',
      'The protein-bag weeks are a single-household accommodation, not a general product behaviour. Anyone who wants vegetarian orders the chickpea variant.',
    ],
  }),

  'leblanc-inspired-japanese': D({
    timing: { min: 30, max: 60, governor: 'rice', active: null, inactive: null, waitFirst: null },
    components: [
      { key: 'curry', package: 'round48',
        freeze: { verdict: 'well', tested: true, note: null },
        divide: { mode: 'scoop', note: null } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'kabocha', package: 'bag',
        freeze: { verdict: 'well', tested: true,
          note: 'Fine frozen, either stirred into the curry or left in its bag for later. A freeze costs it some of the firm edge the sous vide was bought for.' },
        // INHERITS the Indian curry vegetable rule — Kevin recorded it as an
        // inheritance rather than a copy, so a future edit to that answer
        // carries here instead of the two drifting apart.
        divide: { mode: 'pour-and-keep',
          note: 'Its own sous vide bag. Portion the curry into a saucepan, then add the same share of the '
            + 'kabocha. It is a vegetable, so drain the liquid off and discard it.' } },
      { key: 'carrots', package: 'bag',
        freeze: { verdict: 'no', tested: true, note: 'The Brunswick potato treatment: pull them out and use them for something else.' },
        // SAY IT PLAINLY — Kevin's explicit copy instruction. The kabocha and the
        // carrots are in SEPARATE bags, so a Leblanc customer opens two and does
        // the percentage match twice. Left generic, somebody splits the kabocha
        // and forgets the carrots.
        divide: { mode: 'pour-and-keep',
          note: 'A second, separate bag — you will open two. Same again: add the same share of carrots as '
            + 'curry you portioned, and drain the liquid off and discard it.' } },
    ],
    equipment: [
      { vessel: 'pot', note: 'Curry and vegetables together — the bag no longer gets its own pot.' },
      { vessel: 'burner or rice cooker', note: 'Two burners if there is no rice cooker.' },
    ],
    askBox: ['Potato and carrot fail on texture in a way that reads as spoiled. Kabocha softens and weeps instead, which the dish survives.'],
  }),

  'tea-smoked-chicken-with': D({
    timing: { min: 15, max: 20, governor: 'none', active: null, inactive: null, waitFirst: null,
      note: 'A searing dish, not a walk-away one.' },
    components: [
      { key: 'chicken', package: 'rect38',
        freeze: { verdict: 'no', tested: true, note: 'Keeps well in the fridge — a fine dish for later in the week, just not a freezer candidate.' },
        divide: { mode: 'pieces', note: null } },
      { key: 'white sauce', package: 'round8',
        freeze: { verdict: 'no', tested: true, note: null },
        divide: { mode: 'scoop', note: null } },
      { key: 'polenta', package: 'bag',
        freeze: { verdict: 'no', tested: true, note: null },
        divide: { mode: 'bag-is-vessel',
          note: 'Heating half means opening it. If you must: reheat the rest in a pot, add water, and stir constantly until heated through. The bag method is better and this is a fallback.' } },
    ],
    equipment: [
      { vessel: 'pot', note: 'The polenta bag.' },
      { vessel: 'pan', note: 'The sear. Two burners minimum.' },
    ],
    askBox: ['Dividing costs no extra equipment — the leftover-polenta reheat uses the same number of burners.'],
  }),

  'bo-ssam': D({
    timing: { min: 30, max: 60, governor: 'rice', active: null, inactive: null, waitFirst: null },
    components: [
      { key: 'pork', package: 'bag',
        freeze: { verdict: 'excellent', tested: true, note: 'Freezes incredibly well.' },
        divide: { mode: 'not-recommended', note: 'Not by re-simmering the bag. Use the oven or microwave route for a partial serving.' } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'ginger scallion sauce', package: 'round8',
        // A FRIDGE-WINDOW ITEM, not a freezer one. No freeze tier expresses
        // "best on days 2 and 3", which is why the note carries it.
        freeze: { verdict: 'no', tested: true, note: 'Best within 7 days, sweet spot around days 2 and 3.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'kimchi', package: null,
        freeze: { verdict: 'keeps', tested: true, note: 'Not a freeze item and does not need to be. Keeping is the entire point of kimchi.' },
        divide: { mode: 'scoop', note: null } },
    ],
    methods: [
      { rank: 1, name: 'the bag', how: 'Sealed bag into gently simmering water, all at once.',
        why: 'It remelts the fat evenly, which nothing else quite does.',
        equipment: ['pot', 'rice'] },
      { rank: 2, name: 'the oven', how: 'Out of the bag, 325F for about 10 minutes.', why: null,
        equipment: ['oven', 'rice'] },
      { rank: 3, name: 'the microwave', how: '50 percent power for 2 minutes under a damp paper towel, check, repeat as needed. Only for one or two portions.',
        why: 'The pork is unusually forgiving, so the microwave is genuinely useful here — the one dish where it is.',
        equipment: ['microwave', 'rice'] },
    ],
    // The first food-safety rule in the whole walk, and the one place where
    // the divisibility answer and the safety answer are the same answer.
    safety: ['Do not use the bag method unless you intend to eat most of it in one sitting. Reheating and re-chilling the same pork repeatedly is worth avoiding, which is exactly why the oven and microwave routes exist.'],
    equipment: [{ vessel: 'varies', note: 'The method chosen decides it. See methods.' }],
    askBox: ['Pairs incredibly well with the house chili oil.'],
  }),

  'cumin-mushroom-noodles-cumin': D({
    timing: { min: 20, max: 60, governor: 'mixed', active: null, inactive: null, waitFirst: null,
      note: 'Rice versions are 30 to 60 and governed by the rice. Noodle versions are about 20 — roughly 15 for the water to boil and 4 to 5 to cook.',
      sequence: 'Reheat the bag while the noodles cook, or while the water is coming up.' },
    components: [
      { key: 'bag', package: 'bag',
        freeze: { verdict: 'excellent', tested: true, note: 'Kevin sees no issues with this one at all.' },
        // THE EXCEPTION to the bag rule: the simmer is the easiest method AND
        // dividing is still straightforward. Contrast the Bo Ssam.
        divide: { mode: 'pour-and-keep', note: 'Open the bag cold and dump what you want into a saucepan. Few ill effects; it may want stirring and a splash of water.' } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Beef and lamb versions only. Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'noodles', package: null,
        freeze: { verdict: 'no', tested: true, note: 'Stays refrigerated. Excellent shelf life and a printed date on its own bag, so no special handling.' },
        divide: { mode: 'loose', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'The bag.' },
      { vessel: 'pot', note: 'The noodles or the rice.' },
    ],
    askBox: ['If Asian greens were ordered they are simply part of the dish and go in the bag with everything else — no separate handling, and the bag freeze answer covers them.'],
  }),

  'mapo-eggplant': D({
    timing: { min: 30, max: 60, governor: 'rice', active: null, inactive: null, waitFirst: null },
    components: [
      { key: 'mapo', package: 'round48',
        // KEVIN EXPLICITLY RULED this stays a dish note and does NOT become a
        // general freeze-judging rule. A future eggplant dish may be one where
        // he does not want mush, and a general rule would prejudge it.
        freeze: { verdict: 'well', tested: true, note: 'The eggplant does go to mush in the freezer, but it goes to mush anyway as part of this dish, so nothing is lost.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: null },
      { vessel: 'burner or rice cooker', note: 'Two burners if there is no rice cooker.' },
    ],
  }),

  'shrimp-or-tofu-with': D({
    timing: { min: 30, max: 60, governor: 'rice', active: null, inactive: null, waitFirst: null },
    components: [
      { key: 'bag', package: 'bag',
        freeze: { verdict: 'no', tested: true, note: 'The asparagus rules it out, and the reason is variant-independent — it applies to the shrimp and the tofu equally. Shelf life in the bag is good, so this is a do-not-freeze rather than an eat-immediately.' },
        divide: { mode: 'not-recommended', note: 'If you must, reheat a portion in a sauce pot, stirring often and adding water if needed. It will not be as good.' } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'The bag.' },
      { vessel: 'burner or rice cooker', note: 'Two burners if there is no rice cooker.' },
    ],
  }),

  'stir-fried-long-beans-with': D({
    timing: { min: 30, max: 60, governor: 'rice', active: null, inactive: null, waitFirst: null },
    components: [
      { key: 'bag', package: 'bag',
        // "Acceptable" exists because Kevin's answer did — "works in a pinch"
        // has no home in a four-tier scheme, and rounding it up to "well" or
        // down to "no" would both be lies.
        freeze: { verdict: 'acceptable', tested: true, note: 'Works frozen, but it will not be exceptional afterward. Would work in a pinch.' },
        divide: { mode: 'not-recommended', note: 'Possible via a sauce pot — stir often, add water if needed, accept it will not be as good.' } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'The bag.' },
      { vessel: 'burner or rice cooker', note: 'Two burners if there is no rice cooker.' },
    ],
  }),

  'texas-gulf-shrimp-or-tofu': D({
    timing: { min: 30, max: 60, governor: 'rice', active: null, inactive: null, waitFirst: null },
    components: [
      { key: 'bag', package: 'bag',
        freeze: { verdict: 'acceptable', tested: true, note: 'Not the best, but it should still work. Kevin: same as the long beans — the gai lan does not hold up better than the asparagus.' },
        divide: { mode: 'not-recommended', note: 'Sauce-pot route — stir often, add water if needed, accept it will not be as good.' } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'The bag.' },
      { vessel: 'burner or rice cooker', note: 'Two burners if there is no rice cooker.' },
    ],
  }),

  'thai-basil-chicken-pad': D({
    timing: { min: 30, max: 60, governor: 'rice', active: null, inactive: null, waitFirst: null },
    components: [
      { key: 'bag', package: 'bag',
        freeze: { verdict: 'no', tested: true, note: 'The asparagus rules it out, same as the black bean dish. The bag holds well, so this is a do-not-freeze rather than an eat-immediately.' },
        divide: { mode: 'not-recommended', note: 'Sauce-pot fallback — stir often, add water if needed. It will not be as good.' } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'The bag.' },
      { vessel: 'burner or rice cooker', note: 'Two burners if there is no rice cooker.' },
    ],
    askBox: ['The Thai basil likely flattens a little on reheat. Kevin rules it a non-issue — this is basically everyone\u2019s favourite dish.'],
  }),

  'bolognese': D({
    timing: { min: 20, max: 20, governor: 'pasta', active: null, inactive: null, waitFirst: null },
    components: [
      { key: 'sauce', package: 'round32',
        freeze: { verdict: 'excellent', tested: true, note: 'The best freezer candidate on the board. A long-cooked meat sauce, one container, nothing to separate.' },
        divide: { mode: 'scoop', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'Pasta.' },
      { vessel: 'pot', note: 'Sauce.' },
    ],
  }),

  'pasta-with-homegrown-tomato': D({
    timing: { min: 20, max: 20, governor: 'pasta', active: null, inactive: null, waitFirst: null },
    components: [
      { key: 'sauce', package: 'round32',
        freeze: { verdict: 'excellent', tested: true, note: 'All variants. The mushroom versions are explicitly included — mushrooms do not change the answer here.' },
        divide: { mode: 'scoop', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'Pasta.' },
      { vessel: 'pot', note: 'Sauce.' },
    ],
  }),

  'orecchiette-with-bitter': D({
    timing: { min: 20, max: 20, governor: 'pasta', active: null, inactive: null, waitFirst: null },
    components: [
      { key: 'sauce', package: 'round16',
        // THE ONLY UNTESTED ANSWER IN THE WALK, and the reason `tested` exists.
        // Every other freeze verdict came from experience; this one is a
        // prediction. "This freezes well" reads to a customer as a guarantee,
        // so anything showing it must carry the hedge.
        freeze: { verdict: 'well', tested: false, note: 'Kevin has not tried it. From what he can think of it should work.' },
        divide: { mode: 'scoop', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'Pasta.' },
      { vessel: 'pot', note: 'Sauce.' },
    ],
  }),

  'pappardelle-with-vegetables': D({
    // CONFIRMED by Kevin, Aug 1: about 15 minutes for the water to boil, about
    // 5 to cook. The 20-minute headline was already right; what was missing was
    // the split, and Before You Start reads active/inactive to say how much of
    // the wait you are actually standing there for. Customer-clock, as always —
    // the boil is inside the total.
    timing: { min: 20, max: 20, governor: 'pasta', active: 5, inactive: 15, waitFirst: null },
    components: [
      { key: 'bag', package: 'bag',
        freeze: { verdict: 'no', tested: true, note: 'Refrigerates well, so like the asparagus dishes this is a do-not-freeze without urgency.' },
        divide: { mode: 'pour-and-keep', note: 'Toss what you want into a sauce pan over medium-low. The asparagus may overcook — but you should be watching for that anyway, even on the bag simmer.' } },
      { key: 'pasta', package: null,
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked in its own pack.' },
        divide: { mode: 'loose', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'The bag.' },
      { vessel: 'pot', note: 'The pasta.' },
    ],
    askBox: ['Unlike the other asparagus dish, dividing costs nothing here — the overcooking risk is identical on both routes.'],
  }),

  'saffron-pork-ragu': D({
    timing: { min: 15, max: 20, governor: 'none', active: null, inactive: null, waitFirst: null,
      note: 'About the same for both versions.' },
    components: [
      { key: 'ragu', package: 'round32',
        freeze: { verdict: 'well', tested: true, note: null },
        divide: { mode: 'scoop', note: null } },
      { key: 'polenta', package: 'bag',
        // FROZEN POLENTA NEEDS NO NEW INSTRUCTION. Same bag, same simmer.
        // The never-microwave rule is about the BAG, not the heat: microwaving
        // means taking it out, and its moisture then evaporates instead of
        // being reabsorbed. Freezing does not disturb that, because the bag is
        // still closed. Claude reasoned from starch retrogradation and Kevin
        // corrected it — recorded because the app stores that rule with no
        // reason attached, which is how a rule gets misapplied later.
        freeze: { verdict: 'well', tested: true, note: 'Frozen polenta needs no new instruction — same bag, same simmer.' },
        divide: { mode: 'bag-is-vessel', note: 'Opening it means the stir-and-water fallback: reheat in a pot, add water, stir constantly. The bag method is superior.' } },
      { key: 'pasta', package: null,
        freeze: { verdict: 'na', tested: true, note: 'Non-polenta variants. Ships uncooked.' },
        divide: { mode: 'loose', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'Pasta.' },
      { vessel: 'pot', note: 'Sauce.' },
      { vessel: 'pot', note: 'One ADDITIONAL pot on the polenta route, to simmer the bag.' },
    ],
  }),

  'pork-with-mustard-tarragon': D({
    timing: { min: 50, max: 50, governor: 'pasta', active: 20, inactive: 30,
      // Kevin added this retrospectively at dish 23: this needs the same temper
      // the thick pork chop does. Since he counts temper inside the total, the
      // headline moves from about 20 minutes to about 50.
      waitFirst: { minutes: 30, why: 'temper the pork on the counter — it is a thick cut and sears better warm' },
      sequence: 'Water on to boil, then sear the pork, then start reheating the sauce. Searing early buys the pork time to rest before plating.' },
    components: [
      { key: 'pork', package: 'bag',
        freeze: { verdict: 'well', tested: true, note: 'Frozen, it is effectively the same as the sous vide pork in Stuff in a Bag — use it however you like.' },
        // THE PATTERN THAT REFRAMED BAG DIVISIBILITY across the whole menu:
        // the pork is not reheated IN the bag, so opening it is a non-issue.
        divide: { mode: 'pieces', note: 'Two pieces in one bag — Kevin cuts the loin in half. Pull one out, sear it, cook only as much pasta and sauce as you want. The other half goes back in the fridge in the opened bag.' } },
      { key: 'sauce', package: 'round16',
        freeze: { verdict: 'no', tested: true, note: 'Eat it on pasta as a side dish on its own if you froze the pork.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'taglierini', package: null,
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'loose', note: null } },
    ],
    equipment: [
      { vessel: 'pan', note: 'The sear.' },
      { vessel: 'saucepan', note: 'The sauce.' },
      { vessel: 'pot', note: 'The pasta.' },
    ],
  }),

  'mushroom-ragu': D({
    timing: { min: 15, max: 20, governor: 'none', active: null, inactive: null, waitFirst: null,
      note: 'Both versions. Kevin: there is not really much cream in this, it should work just like the Saffron Ragu.' },
    components: [
      { key: 'ragu', package: 'round32',
        freeze: { verdict: 'well', tested: true, note: null },
        divide: { mode: 'scoop', note: null } },
      { key: 'polenta', package: 'bag',
        freeze: { verdict: 'well', tested: true, note: 'Frozen polenta still needs no separate instruction — same bag, same simmer.' },
        divide: { mode: 'bag-is-vessel', note: 'Opening it means the stir-and-water fallback.' } },
      { key: 'pasta', package: null,
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'loose', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'Pasta.' },
      { vessel: 'pot', note: 'Sauce.' },
      { vessel: 'pot', note: 'One additional pot on the polenta route.' },
    ],
  }),

  'pork-chop-with-kabocha-pur-e': D({
    timing: { min: 50, max: 50, governor: 'none', active: 20, inactive: 30,
      waitFirst: { minutes: 30, why: 'temper the pork on the counter — the cuts are very thick' },
      note: 'Kevin\u2019s explicit ruling: the temper counts inside the total, consistent with how he counts boil time.' },
    components: [
      { key: 'pork', package: 'bag',
        freeze: { verdict: 'well', tested: true, note: 'Freeze the pork only.' },
        divide: { mode: 'pieces', note: 'Two thick chops.' } },
      { key: 'broccolini', package: 'rect38',
        freeze: { verdict: 'no', tested: true, note: null },
        divide: { mode: 'loose', note: 'The easiest of the three — it is not in a sous vide bag at all, so just pick out what you want.' } },
      { key: 'kabocha puree', package: 'bag',
        freeze: { verdict: 'no', tested: true, note: null },
        divide: { mode: 'bag-is-vessel', note: 'The polenta treatment: simmer it whole, and if it has to be opened, the stir-and-water fallback applies.' } },
    ],
    equipment: [
      { vessel: 'pan', note: 'Double duty — sear the pork, then the broccolini in the pork fat.' },
      { vessel: 'pot', note: 'The puree bag. Two vessels, not three, because the pan is reused.' },
    ],
  }),

  'steak-au-poivre': D({
    // The first dish with a clean split between inactive and active time, and
    // the shape Before You Start wants everywhere: one headline number plus how
    // much of it you are actually standing there for.
    timing: { min: 50, max: 50, governor: 'none', active: 20, inactive: 30,
      waitFirst: { minutes: 30, why: 'temper the steaks — Kevin says the dish needs it' } },
    components: [
      { key: 'steaks', package: 'bag',
        freeze: { verdict: 'well', tested: true, note: 'Freeze the steaks only. Nothing else.' },
        divide: { mode: 'pieces', note: null } },
      { key: 'sauce', package: 'round16',
        freeze: { verdict: 'no', tested: true, note: null },
        divide: { mode: 'scoop', note: null } },
      { key: 'pommes puree', package: 'bag',
        freeze: { verdict: 'no', tested: true, note: 'Potato does not freeze — the Brunswick and Indian curry precedent.' },
        divide: { mode: 'bag-is-vessel', note: 'The polenta treatment: simmer the sealed bag whole; stir-and-water fallback only if it must be opened.' } },
      { key: 'asparagus', package: 'bag',
        freeze: { verdict: 'no', tested: true, note: 'Asparagus does not freeze — the same reason as the black bean and Thai basil dishes.' },
        // A COUNT, NOT A POUR. Different shape from the other three
        // pour-and-keep components: dividing is taking spears out, and a Small
        // is portioned as two servings, so half the asparagus is half the bag.
        //
        // TWO ROUTES, NOT A PRIMARY AND A FALLBACK. Kevin confirmed this
        // explicitly as the bigger claim: the customer picks. Searing the spears
        // in the steak pan while the steak rests is not a rescue for a failed
        // bag reheat, it is an equal option and arguably the better dinner.
        //
        // THE ONLY DISH THAT DOES THIS. Kevin could not think of another case
        // where alternative routes even make sense, so this is a one-off and NOT
        // a pattern to go hunting for on other dishes.
        divide: { mode: 'pour-and-keep',
          note: 'Take out the spears you want — a Small is portioned as two servings, so half the asparagus '
            + 'is one. Then either warm them in the bag, or sear them in the pan the steak was seared in '
            + 'while the steak rests. Both are right; take your pick.' } },
    ],
    equipment: [
      { vessel: 'pan', note: 'The sear.' },
      { vessel: 'pot', note: 'The puree bag and the asparagus bag together. Watch the asparagus, it overcooks fast — about a minute against the puree\u2019s several.' },
      { vessel: 'saucepan', note: 'The sauce, over medium-low.' },
    ],
    // A product observation rather than a technique one, and worth weighing
    // before Heat Only What You Need spends any effort here.
    askBox: ['Designed for two at the Small size, so Kevin does not think anyone would be dividing this one.'],
  }),

  'boeuf-bourguignon-beef-stew': D({
    timing: { min: 20, max: 20, governor: 'none', active: null, inactive: null, waitFirst: null,
      note: 'On medium heat. Twice the Brunswick figure despite the similar shape.' },
    components: [
      { key: 'stew', package: 'round48',
        freeze: { verdict: 'well', tested: true, note: 'The meat and sauce freeze.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'vegetables', package: 'bag',
        // THIRD TIME THIS PATTERN APPEARED: Brunswick potatoes, Leblanc
        // carrots, and now these. The braise always freezes and the sous vide
        // vegetables always come out. The strongest rule candidate in the walk,
        // and unlike the eggplant note Kevin stated it three separate times.
        freeze: { verdict: 'no', tested: true, note: 'The vegetable bags will not survive.' },
        divide: { mode: 'pour-and-keep', note: 'Dump as much as you want from the bags into however much stew you want, and save the opened bags in the fridge. Same handling as the Brunswick potato bag.' } },
    ],
    equipment: [{ vessel: 'pot', note: 'ONE pot, big enough to hold it all — the vegetables go straight in rather than getting their own.' }],
  }),

  'pecan-mole-fesenjan-beef-and': D({
    timing: { min: 30, max: 60, governor: 'rice', active: null, inactive: null, waitFirst: null },
    components: [
      { key: 'braise', package: 'round48',
        freeze: { verdict: 'well', tested: true, note: null },
        divide: { mode: 'scoop', note: null } },
      { key: 'rice', package: 'round16',
        freeze: { verdict: 'na', tested: true, note: 'Ships uncooked.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'pickled onion', package: 'round8',
        // Resolves itself: the onions have a very long fridge life anyway, so
        // nothing is lost by leaving them out of the freezer.
        freeze: { verdict: 'no', tested: true, note: 'Nothing is lost — they keep a very long time in the fridge, which is where they are happy.' },
        divide: { mode: 'scoop', note: null } },
      { key: 'kabocha', package: 'bag',
        freeze: { verdict: 'well', tested: true, note: 'Consistent with the Leblanc curry ruling clearing the squash for the freezer.' },
        divide: { mode: 'pour-and-keep', note: 'Tip the portion you want into the portion of braise you want, keep the rest of the opened bag in the fridge.' } },
      { key: 'tortillas', package: null,
        freeze: { verdict: 'excellent', tested: true, note: 'Freeze very well, same as the Tex-Mex Kit tortillas.' },
        divide: { mode: 'loose', note: null } },
    ],
    equipment: [
      { vessel: 'pot', note: 'The fesenjan and the vegetables together.' },
      { vessel: 'burner or rice cooker', note: 'The rice.' },
      { vessel: 'burner', note: 'Toasting the tortillas. Three burners, no separate water pot.' },
    ],
  }),
};

// ── Accessors ──────────────────────────────────────────────────────────────

export function reheatDataFor(dishId) {
  return (dishId && REHEAT_DATA[dishId]) || null;
}

// The customer-clock headline. Kevin counts boil and temper time inside it, so
// anything presenting this must too.
export function headlineMinutes(entry) {
  if (!entry || !entry.timing) return null;
  const { min, max } = entry.timing;
  if (min == null && max == null) return null;
  return { min: min ?? max, max: max ?? min };
}

// Across several dishes on one night, the slowest governor wins.
export function worstTiming(entries) {
  const known = (entries || []).map(headlineMinutes).filter(Boolean);
  if (!known.length) return null;
  return { min: Math.max(...known.map(t => t.min)), max: Math.max(...known.map(t => t.max)) };
}

export function componentsThatFreeze(entry) {
  return ((entry && entry.components) || []).filter(c => c.freeze && (c.freeze.verdict === 'excellent' || c.freeze.verdict === 'well'));
}

export function componentsToHoldBack(entry) {
  return ((entry && entry.components) || []).filter(c => c.freeze && c.freeze.verdict === 'no');
}

// Anything the customer must do before they can start.
export function waitsBeforeStarting(entry) {
  const w = entry && entry.timing && entry.timing.waitFirst;
  return w ? [w] : [];
}

// Distinct vessels, with double-duty noted rather than counted twice.
export function vesselCount(entry) {
  return ((entry && entry.equipment) || []).length;
}

// ── BEFORE YOU START ────────────────────────────────────────────────────────
//
// One card per order, answering the question a customer has while still
// holding their coat: how long is this, and is there anything I should have
// done ten minutes ago.
//
// THE WAIT IS THE POINT. Three dishes ask for a 30-minute temper before
// anything can begin, and Kevin counts that inside the total. Somebody who
// starts cooking and THEN learns about it has already lost the half hour. It is
// the only thing on this card that is genuinely urgent, so it leads.
export function beforeYouStart(entries) {
  const list = (entries || []).filter(Boolean);
  if (!list.length) return null;

  const total = worstTiming(list);

  // Waits do not add up — they overlap. Two dishes each wanting 30 minutes on
  // the counter want 30 minutes, not 60.
  const waits = [];
  for (const e of list) for (const w of waitsBeforeStarting(e)) waits.push(w);
  const longestWait = waits.length ? waits.reduce((a, b) => (a.minutes >= b.minutes ? a : b)) : null;

  // Hands-on time only where Kevin actually split it. Summed rather than
  // maxed, because you cannot stand at two pans at once.
  const actives = list.map(e => e.timing && e.timing.active).filter(n => typeof n === 'number');
  const active = actives.length === list.length ? actives.reduce((a, b) => a + b, 0) : null;

  // VESSELS, counted as distinct pieces of equipment across the whole night.
  // Double duty is already folded into each dish's own list, so this stays
  // honest about the pan that sears the pork and then the broccolini.
  // 'varies' is a PLACEHOLDER, not a vessel — Bo Ssam's equipment depends on
  // which of its three methods you pick. Counting it printed "a varies" on a
  // customer card. Held out of the tally and surfaced as its own sentence.
  const vessels = [];
  let methodDependent = false;
  for (const e of list) for (const eq of (e.equipment || [])) {
    if (eq.vessel === 'varies') { methodDependent = true; continue; }
    vessels.push(eq);
  }

  const coldOnly = [];
  for (const e of list) for (const c of (e.components || [])) {
    if (c.divide && /ready as it is|no heat|straight from the fridge/i.test(c.divide.note || '')) coldOnly.push(c.key);
  }

  const sequences = list.map(e => e.timing && e.timing.sequence).filter(Boolean);
  const safety = [];
  for (const e of list) for (const line of (e.safety || [])) safety.push(line);

  return { total, longestWait, active, vessels, methodDependent, coldOnly, sequences, safety };
}

// Plain prose for the card. Written as sentences because the reader is standing
// in a kitchen, not reading a spec.
export function narrateBeforeYouStart(plan) {
  if (!plan) return [];
  const lines = [];

  if (plan.longestWait) {
    lines.push(`Start now: ${plan.longestWait.minutes} minutes to ${plan.longestWait.why}. Everything else can wait until that is done.`);
  }
  if (plan.total) {
    const span = plan.total.min === plan.total.max
      ? `about ${plan.total.min} minutes`
      : `${plan.total.min} to ${plan.total.max} minutes`;
    lines.push(plan.active != null
      ? `Figure on ${span} from now until you eat, though only about ${plan.active} of those are hands-on.`
      : `Figure on ${span} from now until you eat.`);
  }
  if (plan.vessels.length) {
    // COUNTED BY TYPE, not listed raw. The first version printed "4 pans or
    // pots going: pan, pot, saucepan, pot" — the count is what matters on a
    // small stove, and repeating "pot, pot" reads like a bug.
    const tally = {};
    for (const v of plan.vessels) tally[v.vessel] = (tally[v.vessel] || 0) + 1;
    const parts = Object.entries(tally).map(([vessel, n]) => (n === 1 ? `a ${vessel}` : `${n} ${vessel}s`));
    const phrase = parts.length === 1
      ? parts[0]
      : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
    lines.push(`You will need ${phrase} on the go at once.`);
  }
  if (plan.methodDependent) {
    lines.push('One dish gives you a choice of methods, and which you pick decides what else you need out.');
  }
  if (plan.coldOnly.length) {
    lines.push(`Leave the ${plan.coldOnly.join(' and ')} alone — ${plan.coldOnly.length === 1 ? 'it is' : 'they are'} ready cold.`);
  }
  for (const seq of plan.sequences) lines.push(seq);
  for (const line of plan.safety) lines.push(line);

  return lines;
}

// ── EAT FIRST / FREEZE FIRST ────────────────────────────────────────────────
//
// The question this answers is the one Kevin's per-item instructions never
// could: "I bought four meals. Which do I eat first?"
//
// PER COMPONENT, because that is where his answers actually live. A Bo Ssam is
// not one storage decision — the pork freezes incredibly well, the kimchi keeps
// itself and needs nothing, and the ginger scallion sauce is best on days two
// and three. Any per-dish label would have to lie about two of those.
//
// THE ORDER IS THE ADVICE. Sorting by urgency is the whole feature; a list that
// just repeats each dish's freeze verdict is the data, not the answer.
const URGENCY = {
  soon: 0,      // a stated fridge window — eat this one first
  week: 1,      // will not freeze, but holds; fine later in the week
  freeze: 2,    // freeze it if it is not getting eaten soon
  keeps: 3,     // needs nothing from anybody
};

export function storagePlan(items) {
  const rows = [];

  for (const { name, entry } of (items || [])) {
    if (!entry) continue;
    for (const c of (entry.components || [])) {
      const fz = c.freeze || {};
      if (fz.verdict === 'na') continue;  // ships uncooked — no storage decision exists

      const note = fz.note || '';
      // A STATED FRIDGE WINDOW is the only thing that makes something urgent.
      // Kevin gave exactly one — the ginger scallion sauce — and it would be
      // invisible in any scheme that only asked "does it freeze".
      const hasWindow = /\b(within|days?)\b/i.test(note) && /\d/.test(note);

      let bucket;
      if (fz.verdict === 'keeps') bucket = 'keeps';
      else if (fz.verdict === 'no' && hasWindow) bucket = 'soon';
      else if (fz.verdict === 'no') bucket = /long|shelf life|keeps well/i.test(note) ? 'keeps' : 'week';
      else bucket = 'freeze';

      rows.push({
        dish: name,
        component: c.key,
        bucket,
        verdict: fz.verdict,
        tested: fz.tested !== false,
        note: fz.note || null,
      });
    }
  }

  rows.sort((a, b) => URGENCY[a.bucket] - URGENCY[b.bucket]);
  return rows.length ? rows : null;
}

// Components that must come OUT before the rest goes in the freezer. Kevin
// stated this three separate times — Brunswick potatoes, Leblanc carrots,
// Bourguignon vegetable bags — which makes it the strongest pattern in the
// whole walk. Surfaced on its own because it is an ACTION, not a category:
// somebody who freezes the container whole has already lost the vegetables.
export function holdBackBeforeFreezing(items) {
  const out = [];
  for (const { name, entry } of (items || [])) {
    if (!entry) continue;
    const freezes = (entry.components || []).some(c => c.freeze && (c.freeze.verdict === 'excellent' || c.freeze.verdict === 'well'));
    if (!freezes) continue;
    for (const c of (entry.components || [])) {
      if (c.freeze && c.freeze.verdict === 'no') out.push({ dish: name, component: c.key, note: c.freeze.note || null });
    }
  }
  return out;
}

export function narrateStoragePlan(rows, holdBacks) {
  if (!rows || !rows.length) return [];
  const lines = [];
  const of = (b) => rows.filter(r => r.bucket === b);
  const label = (r) => (r.dish === r.component ? r.dish : `${r.dish} — ${r.component}`);

  for (const r of of('soon')) {
    lines.push(`Eat first: the ${r.component} from your ${r.dish}. ${r.note || ''}`.trim());
  }

  const week = of('week');
  if (week.length) {
    lines.push(`Best during the week, not the freezer: ${week.map(label).join(', ')}.`);
  }

  const freeze = of('freeze');
  if (freeze.length) {
    // The hedge travels with the value. Exactly one component in the whole
    // corpus is a prediction rather than experience, and "this freezes well"
    // reads to a customer as a promise.
    const untested = freeze.filter(r => !r.tested);
    const solid = freeze.filter(r => r.tested);
    if (solid.length) lines.push(`Freeze now if you are not eating them soon: ${solid.map(label).join(', ')}.`);
    for (const r of untested) {
      lines.push(`${label(r)} should freeze, though Kevin has not tested it himself yet.`);
    }
  }

  const keeps = of('keeps');
  if (keeps.length) {
    lines.push(keeps.length === 1
      ? `The ${keeps[0].component} from your ${keeps[0].dish} will keep happily where it is.`
      : `${keeps.map(label).join(', ')} will keep happily where they are.`);
  }

  // HOLD-BACKS, minus anything already named above. The Bo Ssam sauce was
  // appearing twice — once as "eat first" and again here — and "take it out
  // first" wrongly implied it was inside the pork bag. Freezing a dish but not
  // one of its parts is the instruction; containment is not.
  const alreadySaid = new Set(rows.filter(r => r.bucket === 'soon').map(r => `${r.dish}|${r.component}`));
  for (const h of (holdBacks || [])) {
    if (alreadySaid.has(`${h.dish}|${h.component}`)) continue;
    lines.push(`Freezing the ${h.dish}? Leave the ${h.component} out of it. ${h.note || ''}`.trim());
  }

  return lines;
}

// ── HEAT ONLY WHAT YOU NEED ─────────────────────────────────────────────────
//
// For the night when fewer people are eating than the order was sized for.
//
// KEVIN'S REFRAMING IS THE WHOLE FEATURE. The question was never "is it in a
// bag" — it is "IS THE BAG THE COOKING VESSEL". A bag that goes into simmering
// water is the hard case, because taking half out means you have lost the
// method. A bag whose contents come out to be seared divides freely: his pork
// tenderloin is two pieces in one bag and splits trivially.
//
// AND FOR ONE DISH THE SAFETY ANSWER IS THE DIVISIBILITY ANSWER. The Bo Ssam
// bag is both the best method and the one you must not use for a partial
// serving, which is exactly why its oven and microwave routes exist.
const DIVIDE_RANK = {
  scoop: 0, loose: 0, pieces: 1, 'pour-and-keep': 2, 'bag-is-vessel': 3, 'not-recommended': 4,
};

export function heatOnlyWhatYouNeed(items) {
  const rows = [];
  for (const { name, entry } of (items || [])) {
    if (!entry) continue;
    for (const c of (entry.components || [])) {
      const dv = c.divide || {};
      if (!dv.mode) continue;
      // A component that ships uncooked is not a portioning problem.
      if (c.freeze && c.freeze.verdict === 'na' && dv.mode === 'scoop') continue;
      rows.push({
        dish: name, component: c.key, mode: dv.mode, note: dv.note || null,
        // Alternative routes exist only where the whole-bag method is the
        // problem. Carried here so the card can offer them instead of just
        // saying no.
        methods: entry.methods || null,
        safety: entry.safety || [],
      });
    }
  }
  if (!rows.length) return null;
  rows.sort((a, b) => DIVIDE_RANK[b.mode] - DIVIDE_RANK[a.mode]);  // hardest first
  return rows;
}

export function narrateHeatOnly(rows) {
  if (!rows || !rows.length) return [];
  const lines = [];
  const seenSafety = new Set();

  const hard = rows.filter(r => r.mode === 'not-recommended' || r.mode === 'bag-is-vessel');
  const easy = rows.filter(r => r.mode === 'scoop' || r.mode === 'loose' || r.mode === 'pieces' || r.mode === 'pour-and-keep');

  for (const r of hard) {
    if (r.mode === 'not-recommended' && r.methods) {
      // The Bo Ssam shape: do not divide it THIS way, but here is how.
      // Method names already carry their article ("the oven"), so do not add
      // another — the first version printed "use the the oven".
      const alt = r.methods.filter(m => m.rank > 1).map(m => `${m.name} (${m.how})`).join(' or ');
      lines.push(`${r.dish}: for a smaller serving, skip the bag and use ${alt}.`);
    } else if (r.mode === 'not-recommended') {
      lines.push(`${r.dish}: Kevin would not divide this one. ${r.note || ''}`.trim());
    } else {
      lines.push(`${r.dish} — the ${r.component} is the awkward part. ${r.note || ''}`.trim());
    }
    for (const line of r.safety) {
      if (seenSafety.has(line)) continue;
      seenSafety.add(line);
      lines.push(line);
    }
  }

  if (easy.length) {
    const names = [...new Set(easy.map(r => r.dish))];
    lines.push(names.length === 1
      ? `The rest of the ${names[0]} takes as much or as little as you want.`
      : `${names.join(', ')} all take as much or as little as you want.`);
  }
  return lines;
}
