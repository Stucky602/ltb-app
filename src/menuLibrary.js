// menuLibrary.js — the customer copy on menu.html that the dish registry does
// NOT own, extracted from the inline LIBRARY blob when the page build step
// landed (Jul 2026).
//
// WHY THIS FILE EXISTS AND WHAT IS NOT IN IT
// menu.html carried a single-line JSON literal holding every word on the page.
// tests/library_sync.mjs already required the DINNER copy in that blob to match
// dishes.js verbatim, field for field, so those 26 entries were duplicated data
// pretending to be source. They are generated now and are deliberately absent
// from this file: adding a dinner description here would create the exact
// two-copies-of-one-truth problem the blob was.
//
// What IS here is everything with no registry equivalent — the add-ons, the
// sous vide bag items, the finishing sauces, and the standing prose blocks.
// The registry knows those items' PRICES; it has never known their copy.
//
// tools/buildPages.mjs assembles this plus the generated dinners into the
// LIBRARY that menu.html ships. Edit copy here, run the build, commit both.

// Dinner flags the registry does not carry. Kept explicit rather than derived:
// `d.reheat === 'bagged'` predicts this correctly for 25 of 26 dinners and gets
// Bo Ssam wrong, and a rule that is 96% right is worse than a list, because the
// 4% is silent. See the note in the handoff about which of the two is stale.
export const DINNER_BAGGED = {
    "Shrimp or Tofu with Asparagus in Black Bean Sauce": true,
    "Thai Basil Chicken (Pad Krapow Gai)": true,
    "Texas Gulf Shrimp or Tofu and Chinese Broccoli": true,
    "Bo Ssam": true,
    "Stir Fried Long Beans with Ground Pork or Tofu": true,
    "Pappardelle with Vegetables and Mint": true
  };

export const MENU_ADDONS = {
    "Fresh Cut Pineapple": {
      "desc": "Freshly cut and ready to eat.",
      "contains": ""
    },
    "Seasonal Cantaloupe": {
      "desc": "Seasonal melon, cut and ready to eat. Whatever's best that week goes in the container.",
      "contains": ""
    },
    "Seasonal Stone Fruit": {
      "desc": "Peaches, plums, nectarines, pluots \u2014 whatever is best at the market that week, cut and ready to eat.",
      "contains": ""
    },
    "Queso": {
      "desc": "Slow-developed flavors that put store-bought to shame. Sold by the pint. Freezes very well. Testimonial from a friend: \"This is the best drunk food I've ever had...it literally saved my life.\"",
      "contains": "Dairy.",
      "spice": "No Heat, Medium (1 habanero), or Hot (2 habaneros). Extra heat available on request."
    },
    "Pickled Onions or Carrots": {
      "desc": "Bright, tangy, and the perfect finishing touch on just about anything. Made in-house, packed in a pint mason jar.",
      "contains": ""
    },
    "Chili Oil": {
      "desc": "House-made chili oil with five spice, Sichuan peppercorns, toasted sesame, star anise, and fresh ginger. Put it on everything.",
      "contains": ""
    },
    "Thyme or Lavender Syrup": {
      "desc": "Simple syrup steeped with fresh thyme or lavender. Perfect for cocktails, lemonade, or sparkling water.",
      "contains": ""
    },
    "Vanilla Syrup": {
      "desc": "Rich vanilla syrup made with house-made vanilla extract and vanilla beans. The good stuff.",
      "contains": ""
    },
    "Vanilla Lavender Syrup": {
      "desc": "The best of both worlds, vanilla and lavender together. Elegant and versatile.",
      "contains": ""
    },
    "Chocolate Chip Cookies": {
      "desc": "Made with two kinds of chocolate for real depth of flavor. Brown butter, molasses, and a touch of patience.",
      "contains": "Gluten, Dairy, Eggs.",
      "note": "Yes, the premium ones are expensive. But have you seen chocolate prices lately? That Valrhona is $30 a pound. It's worth it. Best within 2-3 days."
    },
    "Peanut Butter Fudge": {
      "desc": "Grandma's recipe. That's all you need to know.",
      "contains": "Dairy, Peanuts."
    },
    "Brownies": {
      "desc": "Ooey and fudgy. Browned butter, Dutch-processed cocoa, chocolate chips, and a little espresso to deepen it. It's a brownie. A very good one.",
      "contains": "Gluten, Dairy, Eggs.",
      "note": "Best within 2-3 days."
    }
  };

export const MENU_BAG = {
    "Ribeye": {
      "desc": "The well-marbled one. All that fat means it stays rich and tender even after a quick sear at home.",
      "reheat": "Pat very dry, sear hard on each side in a blazing-hot pan with a neutral oil. Let it rest 15-20 minutes out of the fridge before searing. Cooked to 131°F (medium rare).",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": true
    },
    "NY Strip": {
      "desc": "The classic steakhouse cut. Leaner than a ribeye but still plenty beefy, with a good firm chew.",
      "reheat": "Pat very dry, then sear hard on each side in a blazing-hot pan with a neutral oil. Let it rest 15-20 minutes out of the fridge before searing. Cooked to 131°F, medium rare.",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": true
    },
    "Filet Mignon": {
      "desc": "The most tender cut there is. Mild and buttery, so it leans on the sear and seasoning for flavor.",
      "reheat": "Pat very dry, sear hard on each side in a blazing-hot pan. Let it rest 15-20 minutes out of the fridge before searing. Cooked to 131°F (medium rare).",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": true
    },
    "Pork Tenderloin": {
      "desc": "Lean, mild, and quick to cook, the tenderloin takes really well to a hard sear. Cooked to a perfect 140°F medium so it stays juicy, not dried out the way pork usually ends up. Sold per loin, about 1.25 pounds each. Feeds 2-3.",
      "reheat": "Pat very dry, sear hard on each side in a blazing-hot pan. Cooked to 140°F (medium), in its own batch separate from the steaks.",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": true
    },
    "Carrots": {
      "desc": "Sweet, tender carrots, seasoned and ready to glaze. Two servings per bag.",
      "reheat": "Place the sealed bag in simmering water for a few minutes to reheat. Cut open, pour out the liquid, and either plate as-is or reduce the liquid into a glaze and spoon it back over.",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": false,
      "note": "Single-serving portions available by request.",
      "isSousVideVeg": true
    },
    "Baby Gold Potatoes": {
      "desc": "Tender baby gold potatoes, seasoned and ready to glaze. Two servings per bag.",
      "reheat": "Place the sealed bag in simmering water for a few minutes to reheat. Cut open, pour out the liquid, and either plate as-is or reduce the liquid into a glaze and spoon it back over.",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": false,
      "note": "Single-serving portions available by request.",
      "isSousVideVeg": true
    },
    "Corn (off the cob)": {
      "desc": "Sweet corn cut off the cob, cooked sous vide until tender. Three ears per bag, about two servings.",
      "reheat": "Place the sealed bag in simmering water for a few minutes to reheat. Cut open, pick out the thyme sprigs, and plate as-is. The corn soaks up all the seasoning, so there's nothing to drain.",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": false,
      "isSousVideVeg": true
    },
    "Parsnips": {
      "desc": "Sweet, nutty root vegetable — similar to a carrot but earthier and more complex. Excellent glazed.",
      "reheat": "Place the sealed bag in simmering water for a few minutes to reheat. Cut open and plate as-is, or reduce the liquid into a glaze.",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": false,
      "isSousVideVeg": true
    },
    "Asparagus": {
      "desc": "Fresh asparagus cooked sous vide until perfectly tender. Available whole or cut into bite-size pieces at the same price — just select your preference.",
      "reheat": "Place the sealed bag in simmering water, but go easy here. Asparagus overcooks fast, so a minute at a simmer is really all it needs. Cut open and drain off the excess liquid, then plate. The liquid contains butter, so avoid pouring it down the drain.",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": false,
      "isSousVideVeg": true
    },
    "Air-Chilled Chicken Breast": {
      "desc": "Air-chilled chicken breast, cooked sous vide so it's juicy all the way through, then it just needs a quick sear at home for color. Air chilling skips the water bath chilling step used in traditional processing, so the meat isn't holding extra moisture and the chicken flavor comes through a little cleaner and more concentrated. These run smaller too, closer to one breast per person instead of those giant slabs. No more dry, overcooked chicken breast.",
      "reheat": "Pat very dry, then sear in a hot pan until golden on each side. Thinner than the steaks, so it can go straight from the fridge to the pan.",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": true
    },
    "Flank Steak": {
      "desc": "Flank steak, cooked low and slow sous vide for the better part of a day to break down every bit of that grain until it slices tender instead of chewy. Big beefy flavor, great for fajitas, bowls, salads, or just sliced thin against the grain and eaten straight off the board. Feeds 2-3 people.",
      "reheat": "Pat very dry, then sear hard and fast on each side in a blazing-hot pan, you just want color, it's already cooked through. Rest it, then slice thin against the grain. This one really matters, cut it the wrong way and it gets chewy.",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": true
    },
    "Thick-Cut Pork Chop": {
      "desc": "Thick-cut boneless pork chops, and only thick-cut, because thin ones dry out the second you look at them wrong. Cooked sous vide to a perfect 140°F so they stay juicy and tender the whole way through, then finished with a hard sear at home. Season simple and let the pork do the talking, or hit it with one of the finishing sauces.",
      "reheat": "Pat very dry, then sear hard on each side in a blazing-hot pan. Cooked to 140°F, medium, so it stays juicy.",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": true
    },
    "Kabocha Squash": {
      "desc": "Sweet, dense kabocha squash, seasoned and tender. Two servings per bag.",
      "reheat": "Place the sealed bag in simmering water for a few minutes to reheat. Cut open and plate as-is; the squash soaks up all the seasoning, so there's nothing to drain. A drizzle of melted butter over the top right before serving takes it up a notch.",
      "contains": "Dairy (butter, in seasoning bag).",
      "bagCharge": false,
      "note": "Single-serving portions available by request.",
      "isSousVideVeg": true
    },
    "Garlic Confit": {
      "desc": "Whole garlic cloves slow-cooked in good olive oil until soft, sweet, and spreadable, with none of the raw bite. Comes as a 6 oz portion with about an ounce of the garlic-infused oil, and that oil is worth keeping too, use it for roasting, dressings, or dipping. Smear the cloves on toast, mash them into potatoes, stir them into pasta or a pan sauce, or melt one over a steak right after searing.",
      "reheat": "Comes frozen, and it needs to stay frozen until you use it. Garlic stored in oil at room temperature is a botulism risk, so freezing keeps it safe. Thaw it in the fridge and use within 3 days. Do not leave it sitting out at room temperature.",
      "contains": "None beyond garlic and olive oil.",
      "isSousVideVeg": true
    }
  };

export const MENU_SAUCES = {
    "Chimichurri": {
      "desc": "Bright and herby — parsley, oregano, garlic, and red wine vinegar.",
      "contains": "",
      "pairs": "Ribeye, NY Strip, Filet, Flank Steak, Pork Tenderloin, Thick-Cut Pork Chop, Air-Chilled Chicken Breast, Asparagus",
      "price": 3
    },
    "Romesco": {
      "desc": "Roasted red peppers and almonds with garlic, tomato, and olive oil. Rich and slightly smoky.",
      "contains": "Tree nuts (almonds).",
      "pairs": "Flank Steak, Air-Chilled Chicken Breast, Pork Tenderloin, Thick-Cut Pork Chop, Asparagus, Carrots, Baby Gold Potatoes, Kabocha Squash",
      "price": 4
    },
    "Chermoula": {
      "desc": "A North African herb sauce — cilantro, parsley, lemon, cumin, and paprika. Bright and a little warming.",
      "contains": "",
      "pairs": "Air-Chilled Chicken Breast, Thick-Cut Pork Chop, Carrots, Parsnips, Asparagus, Corn, Kabocha Squash",
      "price": 3
    },
    "Miso Butter Sauce": {
      "desc": "Butter and white miso at 2:1 with minced garlic, ginger, and black pepper. Rich, savory, subtly funky.",
      "contains": "Dairy, Soy (miso).",
      "pairs": "Ribeye, NY Strip, Filet, Flank Steak, Pork Tenderloin, Thick-Cut Pork Chop, Baby Gold Potatoes, Corn, Asparagus, Parsnips, Kabocha Squash",
      "price": 3
    },
    "Whipped Lemon Garlic Herb Butter": {
      "desc": "Butter whipped with lemon, roasted garlic, and fresh herbs. Melts over the top right after searing.",
      "contains": "Dairy.",
      "pairs": "Ribeye, NY Strip, Filet, Flank Steak, Pork Tenderloin, Thick-Cut Pork Chop, Air-Chilled Chicken Breast, Asparagus, Baby Gold Potatoes, Kabocha Squash",
      "price": 3
    }
  };

// Standing prose. Never dish-specific, never derivable, changes rarely.
export const MENU_STATIC = {
    "intro": "Everything is cooked ahead and made to reheat at home. A few dishes arrive sealed in a bag because they reheat better that way; the rest come in containers. Order by Sunday for delivery the following Wednesday.",
    "baggedNote": "A few dishes arrive fully cooked but sealed in a bag instead of a container, not because it's fancy, just because it reheats better. To reheat: bring a separate pot of water to a gentle simmer, drop the bag in, and let it sit a few minutes while you handle everything else, then cut it open and plate. Microwave or stovetop still work fine if you'd rather.",
    "readyToFinish": "These come cooked ahead and finished by you at home: a quick sear on the proteins, a fast reheat on the vegetables. A few minutes of hands-on work, and the result is worth it.",
    "readyToFinishFull": "These come cooked ahead and finished by you at home: a quick sear on the proteins, a fast reheat on the veg. Everything is cooked sous vide, sealed in a bag and cooked in a precise temperature-controlled water bath, so it comes out perfectly even edge to edge with no overcooked or raw spots. Your protein arrives already cooked to the ideal point, so all that is left is color and crust.\n\nEvery protein first spends 24 hours in a salt and sugar dry brine, then goes in the bag seasoned with thyme and butter. The salt seasons the meat all the way through instead of just the surface, and the sugar helps it brown, since sous vide never gets hot enough to build a crust on its own. That part is on you and the pan. (Veg get the same salt, sugar, thyme and butter, where the sugar draws out their natural sweetness. Contains dairy.)\n\nTo finish a protein: pat it very dry, get a pan blazing hot with a neutral high-smoke-point oil, and sear hard on each side just until deeply browned. Thicker cuts (ribeye, NY strip, filet, pork tenderloin) do better rested on the counter 15-20 minutes first. Steaks are cooked to 131F medium rare, pork to 140F medium.",
    "loop": "Return your clean mason jars or meal containers at delivery and save on your next order. Swap or return a mason jar: $2.00 off that item. Return a meal container: $1.00 off your order per container returned. Stack as many as you have. All prices are all-in (tax included).",
    "whatIsSousVide": "Sous vide (pronounced \"soo veed,\" French for \"under vacuum\") is a cooking method where food is sealed in an airtight bag and cooked in a precisely temperature-controlled water bath. Because the water stays at one exact temperature the whole time, the food cooks perfectly and evenly all the way through, with no overcooked edges and no undercooked center. For this menu, that means your protein arrives already cooked to the perfect point, and all you have to do is add a quick sear for color and crust, or a fast reheat for vegetables.",
    "bagNote": "All bags used for these items are BPA-free and food-safe for sous vide cooking and freezer storage. Once you're done, feel free to toss them. Trying to cut down on single-use plastic? There's a reusable option for regulars, so ask about it.",
    "seasoningNote": "Every bag, proteins and vegetables alike, is seasoned with salt, sugar, fresh thyme, and butter before cooking. The sugar isn't there to make things sweet. On the proteins it works with the salt to form a light dry brine that helps them hold moisture and brown better, and on the vegetables it draws out their natural sweetness. Contains: Dairy (butter).",
    "finishingProtein": "Remove the protein from the bag and pat it very dry with a paper towel — this is the key to a great crust. Get a pan blazing hot with a neutral, high-smoke-point oil, then sear hard on each side just until deeply browned. Thicker cuts (ribeye, NY strip, filet, pork tenderloin) benefit from sitting out on the counter for 15-20 minutes before searing. All steaks are cooked to 131°F (medium rare), pork tenderloin to 140°F (medium).",
    "finishingVeg": "Place the sealed bag in a pot of simmering water for a few minutes to reheat. Once warmed through, carefully cut the bag open and pour out the liquid. Either plate the vegetables as-is, or pour that liquid into a small pan and reduce it into a glaze, then spoon it back over.",
    "butterAdd": "Any sous vide protein can come with a container of whipped lemon, garlic, and herb butter to melt over the top right after searing. Highly recommended on the steaks and the pork. + $2.00 per container.",
    "sousVideVeg": "Fresh vegetables sealed in the bag with butter, salt, sugar, and thyme, then cooked sous vide at precise temperatures until perfectly tender. Reheat in simmering water in the sealed bag, then plate. All vegetables come with 2 servings per bag. Single-serving portions available by request.",
    "saucesNote": "All sauces come in 2oz containers. We recommend 1-2 containers per 2 servings depending on how saucy you like it.",
    "dryBrineNote": "Every sous vide protein spends 24 hours in a salt and sugar dry brine before it goes in the bag. This isn't optional and it isn't a garnish step, it's what makes the whole method work. The salt draws moisture out initially, then that moisture gets reabsorbed along with the salt, seasoning the meat all the way through instead of just the surface. The sugar helps with browning later, since sous vide never gets the meat hot enough on its own to develop real color or crust. That's on you and the pan. The result: better seasoning depth than a quick pre-cook salt would give you, and a better sear once you get it in a hot pan at home, because the surface is drier and takes color faster."
  };

// Dishes the registry costs and builds but menu.html deliberately never
// renders. Mirrors the OFF_MENU set in tests/library_sync.mjs; that copy and
// the different-but-similar one in tools/syncMainMenu.mjs are still separate,
// which is a duplication worth closing on purpose rather than in passing.
export const OFF_MENU_DISHES = [
    "Homemade Waffles",
    // OFF THE MENU Aug 2, in Kevin's words. Treat both as graveyard dishes.
    //
    // Coriander Lamb Steak over Gigantes Beans — "it just didn't vibe well with
    // me". No further reason; that is the whole ruling and it is enough.
    //
    // Bone-In Pork Rib Chop with All the Fixings — "used too many containers
    // and had too many parts using different equipment". Worth keeping as a
    // recorded reason rather than a bare removal: it is the clearest statement
    // on record of the operational ceiling for a single dish, and it applies to
    // anything proposed in future with the same shape.
    //
    // They were ALREADY absent from the customer menu before this, but only by
    // not appearing in the dinners list — nothing said why, and nothing would
    // have stopped them being re-added without their Walk 2 data. Neither has
    // reheat data, so if either ever comes back it needs the full dish-by-dish
    // pass first or it arrives with no reheat card, no freeze guidance, and no
    // lens verdict.
    "Coriander Lamb Steak over Gigantes Beans",
    "Bone-In Pork Rib Chop with All the Fixings",
    // Pulled from the customer menu Jul 29. OFF-MENU rather than deleted, on
    // Kevin's call: the dishes are fully built, so the recipe, cost anchors,
    // container mapping, equipment claims, and the cider beurre blanc work all
    // stay in the registry. Keeping the record is also what lets a dossier entry
    // explain WHY each one came off, which deletion would have thrown away.
    "Coriander Lamb Steak over Gigantes Beans",
    "Bone-In Pork Rib Chop with All the Fixings"
  ];

// The order dinners appear in the LIBRARY blob. The blob is a lookup keyed by
// name, so this is cosmetic to the browser — but pinning it is what lets the
// build reproduce the committed page byte for byte, which is the only way to
// verify a migration of a 100 KB file. A dish with copy that is missing from
// this list is APPENDED, never dropped.
export const DINNER_ORDER = [
    "Shrimp or Tofu with Asparagus in Black Bean Sauce",
    "Thai Basil Chicken (Pad Krapow Gai)",
    "Saffron Pork Ragu",
    "Mushroom Ragu",
    "Pork with Mustard Tarragon Cream Sauce",
    "Mapo Eggplant",
    "Gumbo",
    "Texas Gulf Shrimp or Tofu and Chinese Broccoli",
    "Bo Ssam",
    "Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice",
    "Stir Fried Long Beans with Ground Pork or Tofu",
    "Pasta with Homegrown Tomato Sauce",
    "Orecchiette with Bitter Greens and Anchovies",
    "Bolognese",
    "Boeuf Bourguignon (Beef Stew)",
    "Brunswick Stew",
    "Chili",
    "Indian Style Curry",
    "Tex-Mex Kit",
    "Leblanc Inspired Japanese Curry",
    "Pappardelle with Vegetables and Mint",
    "Coriander Lamb Steak over Gigantes Beans",
    "Pork Chop with Kabocha Purée and Charred Broccolini",
    "Bone-In Pork Rib Chop with All the Fixings",
    "Steak au Poivre",
    "Tea-Smoked Chicken with Dashi Polenta and Alabama White Sauce"
  ];

export const LIBRARY_COMMENT = "LTB Dish Library — canonical customer-facing copy. Keyed by exact dish name matching the app's ALL_DINNERS / ALWAYS_MENU names. The menu page and order form both read from the published subset of this. Edit copy here (or via chat) once; it persists forever.";
