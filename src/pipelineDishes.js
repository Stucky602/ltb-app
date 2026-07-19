// pipelineDishes.js — CANON for the dish pipeline (candidates in testing).
//
// This is the single source of truth for the vote KEY of every pipeline dish.
// tools/syncPipeline.mjs CHECKS worker.js PIPELINE_DISHES and pipeline.html
// data-dish against this file and fails the gate on any drift.
//
// FROZEN CONTRACT: `key` == worker PIPELINE_DISHES entry == pipeline.html
// data-dish. Renaming a key orphans every ballot already cast for it. To
// retire a shipped dish, set status:'shipped' HERE (repo-facing truth), which
// tells syncPipeline it must be commented-out in the worker and absent from
// pipeline.html. The app's localStorage journal carries the working status view;
// this repo flag is the deploy-facing one. Default (no status) == 'testing'.
//
// What Promote scaffolds from each entry (see RecipesTab): ingredients (names +
// nature, NEVER quantities), allergenFlags (seed the dish's allergens{}), diet,
// title, desc. The Big 3 — final description, reheat card, and margins — are
// NEVER scaffolded; they're written with Kevin.
//
// `nature` drives conversion scaffolding: 'weight' | 'fluid' | 'each' | 'batch'.

export const PIPELINE_DISHES = [
  {
    key: "Suya Flank Steak",
    title: "Suya Flank Steak, Coconut Rice, Cucumber Kachumbari",
    origin: "Nigeria &middot; Kenya &middot; Vietnam &middot; Texas",
    diet: null,
    allergenFlags: { peanut: true },
    desc: "Seared flank steak under a thick peanut crust: ground peanuts, ginger, and cayenne, toasted into a shell the way Nigerian street vendors do it. Coconut rice underneath, a sharp cucumber and red onion salad on the side, and a dark burnt-sugar and tamarind drizzle over the top.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Kabocha Char Siu",
    title: "Kabocha Char Siu, Shiitake-Dashi Rice, Pickles",
    origin: "Canton &middot; Italy &middot; Japan &middot; Vegetarian",
    diet: "veg",
    allergenFlags: {},
    desc: "Kabocha squash roasted in wedges and lacquered with Chinese barbecue glaze, the same one that goes on char siu pork, with fennel, rosemary, and garlic worked in. Over rice cooked with a mushroom and seaweed packet, with pickles on the side to cut the sweetness. Vegetarian, and it carves and eats like a roast.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Kare-Kare with XO",
    title: "Kare-Kare with XO Sauce",
    origin: "Philippines &middot; Hong Kong &middot; West Africa &middot; Texas Gulf",
    diet: null,
    allergenFlags: { peanut: true, shellfish: true },
    desc: "Filipino oxtail stew in a toasted peanut sauce, thickened with ground peanuts and toasted rice, no flour or cream. The oxtail cooks down until it is glossy and falling apart. Long beans and eggplant in the pot, and a jar of XO on the side: a Hong Kong condiment of dried shrimp, ham, and chile for when you want the bowl louder. Over rice.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Khoresh-e Gheimeh",
    title: "Khoresh-e Gheimeh, Persian Dried Lime Braise",
    origin: "Iran",
    diet: null,
    allergenFlags: {},
    desc: "A Persian braise of beef and yellow split peas, built around dried limes that leak a deep, funky sourness into the pot as it cooks. Not sharp like lemon, more savory and bitter, with no sweetness anywhere. The split peas melt down and round it out. Over saffron rice.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Fesenjan",
    title: "Fesenjan, Walnut and Pomegranate Braise",
    origin: "Iran &middot; Georgia &middot; Mexico",
    diet: null,
    allergenFlags: { treenut: true },
    desc: "Chicken braised in a sauce of ground walnuts and pomegranate molasses, cooked down until it goes nearly black. Sour, deep, and rich, closer to savory than sweet. This is made a day or two ahead on purpose, so yours arrives the way it is supposed to be. Over saffron rice.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Sauerbraten Beef Cheeks",
    title: "Sauerbraten Beef Cheeks, Caraway-Juniper Potatoes, Braised Red Cabbage",
    origin: "Germany",
    diet: null,
    allergenFlags: { dairy: true, gluten: true },
    desc: "Beef cheeks marinated four days in vinegar and red wine, then braised until they go to silk. The sauce is thickened with gingersnaps and studded with dried sour cherries. Braised red cabbage on the side, and potatoes with caraway and juniper. The long marinade is the recipe, not a shortcut.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Yogurt-Braised Lamb",
    title: "Yogurt-Braised Lamb, Alkaline Noodles, Aleppo-Mint Brown Butter",
    origin: "Persia &middot; India &middot; Japan &middot; Turkey",
    diet: null,
    allergenFlags: { dairy: true, gluten: true },
    desc: "Lamb shoulder braised in yogurt until it falls apart into a thick, tangy sauce. Over chewy alkaline noodles, with charred scallions on top. At the table you pour hot brown butter with Aleppo pepper and dried mint over the whole plate.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Nixtamal Grits",
    title: "Nixtamal Grits, Braised Greens, Country Ham, Bottarga",
    origin: "Mexico &middot; American South &middot; Italy",
    diet: null,
    allergenFlags: { fish: true, dairy: true },
    desc: "Grits made from lime-treated corn, the same process behind tortillas, which makes them rounder and deeper than regular grits. Braised collards and country ham through them, with cured fish roe grated over the top like parmesan. The roe reads as salt and depth, not fish.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Umeboshi Chicken",
    title: "Umeboshi and Charred Preserved Lemon Chicken, Negi-Shio, Blistered Shishitos",
    origin: "Morocco &middot; Japan &middot; Sichuan",
    diet: null,
    allergenFlags: {},
    desc: "Smoked-then-seared chicken thighs with a sauce of Japanese pickled plum and Moroccan preserved lemon, the lemon charred hard in a wok until it turns dark and bitter. A burnt-lemon scallion oil over the top, blistered shishito peppers on the side, plain rice underneath.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Two-Garum Pasta",
    title: "Two-Garum Pasta: Gulf Shrimp, Colatura, Fish Sauce, Garlic Confit",
    origin: "Amalfi &middot; Vietnam &middot; Rome &middot; Texas Gulf",
    diet: "pesc",
    allergenFlags: { shellfish: true, fish: true, gluten: true },
    desc: "Shrimp, garlic, chile, and olive oil over pasta, with a sauce built on two fermented fish sauces from opposite sides of the world: Italian colatura and Vietnamese nuoc mam. It does not taste like fish. It tastes like the best garlic-and-oil pasta you have had.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Shrimp and Grits",
    title: "Shrimp and Grits: &Eacute;touff&eacute;e and XO",
    origin: "Louisiana &middot; Hong Kong &middot; Japan &middot; Texas Gulf",
    diet: null,
    allergenFlags: { shellfish: true, dairy: true, gluten: true },
    desc: "Shrimp and grits done two ways at once: a Louisiana etouffee, a stock-and-roux sauce off the shrimp shells, folded together with XO, the Hong Kong condiment of dried shrimp and ham. Fresh shrimp and concentrated shrimp in the same bowl. The grits are cooked in dashi, which reads as grits that taste like more than grits.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Collard Saag",
    title: "Collard Saag, Seared Halloumi, Rice",
    origin: "Punjab &middot; American South &middot; Cyprus &middot; Vegetarian",
    diet: "veg",
    allergenFlags: { dairy: true },
    desc: "Punjabi saag made with collards instead of mustard greens, cooked down for hours with ginger, garlic, and chile until dark and silky. Seared halloumi on top instead of paneer: a brined, salty cheese you sear yourself, and it cannot melt or overcook. Over rice.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Pork Tenderloin Agrodolce",
    title: "Pork Tenderloin, Double Dark Vinegar Agrodolce, Seared Polenta Cakes",
    origin: "Sicily &middot; Modena &middot; Zhenjiang &middot; France",
    diet: null,
    allergenFlags: { dairy: true },
    desc: "Pork tenderloin with a dark, sweet-sour onion sauce built on two aged vinegars, Italian balsamic and Chinese black vinegar, cooked down with onions until jammy. Underneath, polenta set overnight into a slab and cut into cakes that you sear crisp on the outside and molten in the middle.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Octopus Soy-Dashi-Pimenton",
    title: "Octopus, Soy-Dashi-Piment&oacute;n, Baby Golds",
    origin: "Galicia &middot; Japan",
    diet: "pesc",
    allergenFlags: {},
    desc: "Octopus braised until spoon-tender in a liquid that splits the difference between Spain and Japan: soy, dashi, and mirin on one side, smoked paprika and olive oil on the other. Over baby gold potatoes. Warm it gently, or sear it hard for char, both are right.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Three-Branch Caramel Pork",
    title: "Three-Branch Caramel Pork",
    origin: "China &middot; Vietnam &middot; Philippines",
    diet: null,
    allergenFlags: { fish: true, gluten: true, soy: true },
    desc: "Pork shoulder braised dark in burnt-sugar caramel and fish sauce, with fermented black beans and a pineapple edge. It follows one dish across three countries, from Chinese red-cooked pork to Vietnamese thit kho to Filipino humba, and uses all three in one pot. Over rice.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Kufteh Tabrizi",
    title: "Kufteh Tabrizi, the Sicilian Reading",
    origin: "Persia &middot; Azerbaijan &middot; Sicily",
    diet: null,
    allergenFlags: { treenut: true },
    desc: "A large lamb-and-rice meatball with a hidden core of dried fruit, walnuts, and fried onion, poached in a light saffron broth. You find the treasure with a spoon. Persian by way of Sicily, which makes nearly the same thing. The rice is inside the meat, so the meatball is the whole dinner.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Garlic in Two Times Pork Chop",
    title: "Thick-Cut Pork Chop, Garlic in Two Times",
    origin: "House programs &middot; France &middot; Korea by Japan",
    diet: null,
    allergenFlags: { dairy: true },
    desc: "A thick pork chop with a sauce of garlic in two states: confit, cooked slow in oil until sweet and mellow, and black garlic, aged a month until it turns dark and tastes of molasses. Both made here, mashed into one sauce. Potatoes and peppery watercress alongside.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Wok-Smoked Tri-Tip",
    title: "Wok-Smoked Tri-Tip, Santa Maria Beans",
    origin: "Santa Maria Valley &middot; Sichuan &middot; France",
    diet: null,
    allergenFlags: {},
    desc: "Santa Maria tri-tip, California ranch barbecue, with the smoke done indoors in a wok over oak and tea. Cooked sous vide first, then smoked and seared, sliced pink like a roast. Pinquito beans cooked with bacon and chile on the side, and a fresh salsa.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Pasta alla Genovese",
    title: "Pasta alla Genovese",
    origin: "Naples &middot; France",
    diet: null,
    allergenFlags: { dairy: true, gluten: true },
    desc: "A Neapolitan onion sauce: four pounds of onions and a piece of beef cooked down most of a day until brown, sweet, and deep, closer to French onion soup than to red sauce. No tomato in it at all. The beef shreds back in, over rigatoni with a lot of cheese. Mild, start to finish.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Wok-Smoked Dal Makhani",
    title: "Wok-Smoked Dal Makhani",
    origin: "Punjab &middot; Sichuan &middot; Vegetarian",
    diet: "veg",
    allergenFlags: { dairy: true },
    desc: "Black lentils simmered for hours until creamy from their own starch, finished with butter, cream, and tomato. The butter and cream take a hit of wok smoke first, a stovetop version of the live-coal trick the dish traditionally uses. Mild, rich, deeply smoky. Over rice.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Georgia Bomb Meatballs",
    title: "Georgia Bomb Meatballs",
    origin: "American South · China · France",
    diet: null,
    allergenFlags: {},
    desc: "Smoked pork meatballs with a cube of rich smoked-pork demi-glace frozen inside each one. It melts as they cook, so when you break one open with a spoon, smoky liquid floods out into a thin, sharp tomato-vinegar braise. Over grits cooked in the same smoked-pork stock. Breaking one open is the point.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Smothered Turkey Yassa",
    title: "Smothered Turkey Yassa",
    origin: "Senegal · American South · France",
    diet: null,
    allergenFlags: {},
    desc: "Turkey thighs marinated overnight, then braised in a mountain of slow-cooked onions that carry both a Southern black-pepper roux and the mustard, lemon, and chile of Senegalese yassa. Green olives warm in the gravy, lime on the side. Mild by design, the chile goes in whole and comes back out. Over rice.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Quail Black Oil Celery Root",
    title: "Quail, Black Oil, Celery Root",
    origin: "Japan · Oaxaca · Turkey · Texas",
    diet: null,
    allergenFlags: {},
    desc: "Texas quail over a pale celery root purée, finished with an oil deliberately burned to black: charred garlic and charred chile, bridged with Turkish Urfa pepper. Because it's carbon, the oil tastes the same on day three as day one. Pickled shallot and herbs cut through. A small, crisp bird on a white plate under a black oil.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Viet-Cajun Skillet Boil",
    title: "Viet-Cajun Skillet Boil",
    origin: "Houston · Vietnam · Louisiana · Texas Gulf",
    diet: "pesc",
    allergenFlags: { shellfish: true, fish: true },
    desc: "A skillet version of the Gulf Coast boil Vietnamese shrimping families built out of the Louisiana crawfish boil: Gulf shrimp, andouille, potatoes, and smoked corn tossed through a butter loaded with garlic, fish sauce, cayenne, and lemon pepper. One pan, ninety seconds for the shrimp. Grab a baguette the day of, sopping the butter is half of it.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Wok-Smoked Flank White Sauce",
    title: "Wok-Smoked Flank, White Sauce Family Reunion",
    origin: "Lebanon · Alabama · Mexico · Texas",
    diet: null,
    allergenFlags: {},
    desc: "Wok-smoked flank steak, sliced thin, under a cold white garlic sauce that blends three that were invented separately for smoked meat: Lebanese toum, Alabama white sauce, and Mexican crema. Each is too much alone; together they balance. Blistered green beans and buttered baby gold potatoes on the side. The sauce goes on cold at the table.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Hoja Santa Pork Tenderloin",
    title: "Hoja Santa Pork Tenderloin, Fil&eacute; Pan Sauce",
    origin: "Veracruz · Louisiana · Texas",
    diet: null,
    allergenFlags: {},
    desc: "Pork tenderloin wrapped in hoja santa leaves and cooked sous vide, so the leaf's root-beer-and-sassafras flavor works into the meat for hours. The pan sauce is thickened with filé, the ground sassafras leaf that thickens gumbo, closing the loop. Pickled jalapeño and capers ride cold and sharp. Baby gold potatoes on the side.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Charred Allium Trinity Pasta",
    title: "Charred Allium Trinity Pasta",
    origin: "Korea · France · Italy · Vegetarian",
    diet: "veg",
    allergenFlags: { dairy: true, gluten: true },
    desc: "One onion family, three ways, folded into butter over fresh pappardelle: scallions charred black, leeks burned to a fine ash and dusted over the top like pepper, and sweet garlic confit made here. It's cacio e pepe's structure with alliums instead of cheese. Mild, dramatic to look at, vegetarian.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Lamb Leg Steak Black Lime Freekeh",
    title: "Lamb Leg Steak, Burnt Honey and Black Lime Glaze, Freekeh",
    origin: "Oman · Vietnam · Levant · France",
    diet: null,
    allergenFlags: { fish: true, dairy: true, gluten: true },
    desc: "Lamb under a glaze of three voices: honey burned dark past sweet, Omani black lime for smoky sour, and fish sauce for a salty floor. Broiled until it lacquers. Underneath, freekeh, the green wheat that tastes faintly of fire, folded with mint. Cold lemon yogurt catches the burnt edges.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Mushroom Escabeche Polenta Cakes",
    title: "Mushroom Escabeche, Seared Polenta Cakes",
    origin: "Spain · Italy · France · Vegetarian",
    diet: "veg",
    allergenFlags: { dairy: true },
    desc: "Mushrooms cooked and marinated in a sharp Spanish escabeche that only improves in the fridge for a week. Over polenta set overnight into a slab, cut into cakes you sear yourself: ninety seconds a side, crisp outside, molten center. The cool sharp mushrooms go over the hot cakes. Nothing needs reheating.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
  {
    key: "Blackened Hanger Steak Coconut Corn",
    title: "Blackened Hanger Steak, Coconut Creamed Corn, Tomato Sambol",
    origin: "Sri Lanka · Louisiana · Texas",
    diet: null,
    allergenFlags: {},
    desc: "Hanger steak under a blackening crust that fuses two traditions built to the edge of scorched: Sri Lankan roasted spice and Louisiana blackening, bridged with ancho and guajillo. Under it, creamed corn made with coconut milk and green chile, thickened by the corn's own starch. A raw tomato and red onion sambol rides cold and sharp.",
    openQuestions: [],
    ingredients: [], // names + nature only, filled as Kevin develops the dish
  },
];
