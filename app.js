var LTBApp = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // LTB_Order_Tracker.jsx
  var LTB_Order_Tracker_exports = {};
  __export(LTB_Order_Tracker_exports, {
    default: () => LTBOrderTracker
  });
  var import_react = __toESM(__require("react"));
  var import_lucide_react = __require("lucide-react");
  var ALL_DINNERS = [
    { name: "Indian Style Curry", variants: [
      { label: "Chicken, Small (~4-5)", price: 27, cost: 14.97 },
      { label: "Shrimp, Small (~4-5)", price: 36, cost: 23.97 },
      { label: "Chickpea, Small (~4-5)", price: 22, cost: 9.97 },
      { label: "Chicken, Large (~8-10)", price: 50, cost: 23.94 },
      { label: "Shrimp, Large (~8-10)", price: 70, cost: 32.94 },
      { label: "Chickpea, Large (~8-10)", price: 40, cost: 18.94 }
    ] },
    { name: "Shrimp or Tofu with Asparagus in Black Bean Sauce", variants: [
      { label: "Shrimp, Small Batch (~3-4)", price: 40, cost: 21.99 },
      { label: "Shrimp, Large Batch (~7-8)", price: 75, cost: 42.98 },
      { label: "Tofu, Small Batch (~3-4)", price: 25, cost: 10.6 },
      { label: "Tofu, Large Batch (~7-8)", price: 45, cost: 20.2 }
    ] },
    { name: "Texas Gulf Shrimp or Tofu and Chinese Broccoli", variants: [
      { label: "Shrimp, Small Batch (~4)", price: 40, cost: 19.56 },
      { label: "Shrimp, Large Batch (~8)", price: 75, cost: 38.12 },
      { label: "Tofu, Small Batch (~4)", price: 25, cost: 8.17 },
      { label: "Tofu, Large Batch (~8)", price: 45, cost: 15.34 }
    ] },
    { name: "Cumin Mushroom Noodles", variants: [
      { label: "Small (~3-4)", price: 40, cost: 18.35 },
      { label: "Large (~6-8)", price: 75, cost: 35.7 },
      { label: "Small (~3-4) + Asian Greens", price: 45, cost: 20.35 },
      { label: "Large (~6-8) + Asian Greens", price: 80, cost: 37.7 }
    ] },
    { name: "Thai Basil Chicken (Pad Krapow Gai)", variants: [
      { label: "Small (~3-4)", price: 30, cost: 13.35 },
      { label: "Large (~7-8)", price: 55, cost: 25.7 }
    ] },
    { name: "Pasta with Red Sauce", variants: [
      { label: "Base (~4)", price: 15, cost: 7.24 },
      { label: "With Beef or Turkey", price: 30, cost: 14.24 },
      { label: "With Mushrooms", price: 21, cost: 10.24 },
      { label: "With Both", price: 36, cost: 17.24 }
    ] },
    { name: "Bolognese", variants: [
      { label: "Small (split order, ~4)", price: 35, cost: 16.79 },
      { label: "Large (~8)", price: 60, cost: 32.57 }
    ] },
    { name: "Tex-Mex Kit", variants: [
      { label: "Pulled Pork, Small (~5-6)", price: 42, cost: 19.21 },
      { label: "Pulled Pork, Large (~9-10)", price: 80, cost: 37.42 },
      { label: "Pulled Beef, Small (~5-6)", price: 60, cost: 28.05 },
      { label: "Pulled Beef, Large (~9-10)", price: 115, cost: 55.1 }
    ] },
    { name: "Brunswick Stew", variants: [
      { label: "Small (~4)", price: 35, cost: 15.55 },
      { label: "Large (~8)", price: 65, cost: 31.1 }
    ] },
    { name: "Boeuf Bourguignon (Beef Stew)", variants: [
      { label: "~6 servings", price: 100, cost: 45.08 },
      { label: "With 1 lb mushrooms", price: 112, cost: 51.08 }
    ] },
    { name: "Chili", variants: [
      { label: "Small (split order, ~3-4)", price: 45, cost: 18.53 },
      { label: "Large (~6-8)", price: 80, cost: 37.06 }
    ] },
    { name: "Saffron Pork Ragu", variants: [
      { label: "~4 servings", price: 40, cost: 16.48 }
    ] },
    { name: "Mapo Eggplant", variants: [
      { label: "~5-6 servings", price: 35, cost: 13.63 }
    ] },
    { name: "Gumbo", variants: [
      { label: "Small (split order, ~3-4)", price: 40, cost: 15.31 },
      { label: "Large (~7-8)", price: 65, cost: 30.63 }
    ] },
    { name: "Stir Fried Long Beans with Ground Pork", variants: [
      { label: "Small (~4)", price: 30, cost: 11.58 },
      { label: "Large (~8)", price: 55, cost: 23.16 }
    ] }
  ];
  var DEFAULT_WEEK = ["Indian Style Curry", "Texas Gulf Shrimp or Tofu and Chinese Broccoli", "Cumin Mushroom Noodles", "Bolognese"];
  var ALWAYS_MENU = {
    breakfast: [
      { name: "Homemade Waffles", variants: [{ label: "Set of 12", price: 7, cost: 2.78 }] }
    ],
    fruit: [
      { name: "Fresh Cut Pineapple", variants: [{ label: "Per Container", price: 6, cost: 2.5 }] },
      { name: "Seasonal Cantaloupe", variants: [{ label: "Per Container", price: 6, cost: 3 }] }
    ],
    desserts: [
      { name: "Chocolate Chip Cookies", variants: [
        { label: "1 Dozen (Standard)", price: 25, cost: 11.33 },
        { label: "1 Dozen (Premium Valrhona)", price: 40, cost: 23.33 }
      ] },
      { name: "Peanut Butter Fudge", variants: [{ label: "1 Batch", price: 15, cost: 4.35 }] }
    ],
    addons: [
      { name: "Queso", variants: [
        { label: "Per Pint Jar", price: 12, cost: 4.87 },
        { label: "With jar swap", price: 10, cost: 3.62 }
      ] },
      { name: "Pickled Onions or Carrots", variants: [
        { label: "Standard", price: 7.5, cost: 4 },
        { label: "With jar swap", price: 5.5, cost: 2.75 }
      ] },
      { name: "Chili Oil", variants: [
        { label: "Per Jar", price: 10, cost: 4.07 },
        { label: "With jar swap", price: 8, cost: 3.07 }
      ] },
      { name: "Thyme or Lavender Syrup", variants: [
        { label: "Per Jar", price: 7, cost: 3.67 },
        { label: "With jar swap", price: 5, cost: 1.67 }
      ] },
      { name: "Vanilla Syrup", variants: [
        { label: "Per Jar", price: 12, cost: 7.17 },
        { label: "With jar swap", price: 10, cost: 5.17 }
      ] },
      { name: "Vanilla Lavender Syrup", variants: [
        { label: "Per Jar", price: 13, cost: 8.17 },
        { label: "With jar swap", price: 11, cost: 6.17 }
      ] }
    ],
    bag: [
      { name: "Ribeye", perLb: true, pricePerLb: 25, costPerLb: 19, variants: [{ label: "price by weight", price: 26.5, cost: 19 }] },
      { name: "NY Strip", perLb: true, pricePerLb: 23, costPerLb: 17.49, variants: [{ label: "price by weight", price: 24.5, cost: 17.49 }] },
      { name: "Filet Mignon", perLb: true, pricePerLb: 34, costPerLb: 24.99, variants: [{ label: "price by weight", price: 35.5, cost: 24.99 }] },
      { name: "Chicken Breast", perLb: true, pricePerLb: 9, costPerLb: 6, variants: [{ label: "price by weight", price: 10.5, cost: 6 }] },
      { name: "Pork Tenderloin", perLb: true, pricePerLb: 15, costPerLb: 8, variants: [{ label: "price by weight", price: 20.25, cost: 10 }] },
      { name: "Whipped Lemon Garlic Herb Butter", variants: [{ label: "Per Container", price: 2, cost: 1 }] },
      { name: "Baby Gold Potatoes", variants: [{ label: "2 servings", price: 7, cost: 2.5 }] },
      { name: "Carrots", variants: [{ label: "2 servings", price: 6, cost: 1.83 }] }
    ]
  };
  var PER_LB_ITEMS = {};
  ALWAYS_MENU.bag.forEach((it) => {
    if (it.perLb) PER_LB_ITEMS[it.name] = { pricePerLb: it.pricePerLb, costPerLb: it.costPerLb };
  });
  function isPerLbItem(name) {
    return !!PER_LB_ITEMS[name];
  }
  var FULL_MENU = { dinner: ALL_DINNERS, ...ALWAYS_MENU };
  function buildMenu(selectedDinners) {
    return { dinner: ALL_DINNERS.filter((d) => selectedDinners.includes(d.name)), ...ALWAYS_MENU };
  }
  var CATEGORY_LABELS = {
    dinner: "Dinner",
    breakfast: "Breakfast",
    fruit: "Fresh Cut Fruit",
    desserts: "Desserts",
    addons: "Add-Ons & Extras",
    bag: "Stuff in a Bag"
  };
  var STATUSES = ["Ordered", "Cooking", "Ready", "Delivered"];
  var STATUS_COLORS = {
    Ordered: "#7F77DD",
    Cooking: "#EF9F27",
    Ready: "#1D9E75",
    Delivered: "#5F5E5A"
  };
  var SURCHARGE = 2;
  var ORDERS_KEY = "ltb-orders";
  var CHECKS_KEY = "ltb-cook-checks";
  var SHOPPING_KEY = "ltb-shopping";
  var WEEK_KEY = "ltb-week";
  var I = (name, q, u, staple = false) => ({ name, q, u, staple });
  var RECIPES = {
    "Indian Style Curry": {
      factors: {
        "Chickpea, Small (~4-5)": 0.5,
        "Chicken, Small (~4-5)": 0.5,
        "Shrimp, Small (~4-5)": 0.5,
        "Chickpea, Large (~8-10)": 1,
        "Chicken, Large (~8-10)": 1,
        "Shrimp, Large (~8-10)": 1
      },
      base: [
        I("Canned tomatoes", 1, "28oz can"),
        I("Red onion", 28, "oz"),
        I("Butter", 2, "sticks"),
        I("Kitchen Basics chicken stock", 32, "oz"),
        I("Limes", 2, ""),
        I("Weekly vegetables + chickpeas", 1, "lb"),
        I("Mix of spicy peppers", 1, "handful"),
        I("Curry powder", 0.25, "cup", true),
        I("Brown sugar", 2, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ],
      extras: {
        "Chicken, Small (~4-5)": [I("Chicken thighs", 1, "lb")],
        "Chicken, Large (~8-10)": [I("Chicken thighs", 1, "lb")],
        "Shrimp, Small (~4-5)": [I("Shrimp", 1, "lb")],
        "Shrimp, Large (~8-10)": [I("Shrimp", 1, "lb")]
      }
    },
    "Texas Gulf Shrimp or Tofu and Chinese Broccoli": {
      factors: {
        "Shrimp, Small Batch (~4)": 1,
        "Shrimp, Large Batch (~8)": 2,
        "Tofu, Small Batch (~4)": 1,
        "Tofu, Large Batch (~8)": 2
      },
      base: [
        I("Chinese broccoli", 8, "oz"),
        I("Garlic", 3, "cloves"),
        I("Ginger", 1, "knob"),
        I("Oyster sauce", 3, "tbsp", true),
        I("Soy sauce", 2, "tbsp", true),
        I("Dark soy sauce", 1, "tbsp", true),
        I("House chili oil", 2, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ],
      extras: {
        "Shrimp, Small Batch (~4)": [I("Shrimp", 1, "lb")],
        "Shrimp, Large Batch (~8)": [I("Shrimp", 1, "lb")],
        "Tofu, Small Batch (~4)": [I("Tofu", 1, "block")],
        "Tofu, Large Batch (~8)": [I("Tofu", 1, "block")]
      }
    },
    "Cumin Mushroom Noodles": {
      factors: {
        "Small (~3-4)": 0.5,
        "Large (~6-8)": 1,
        "Small (~3-4) + Asian Greens": 0.5,
        "Large (~6-8) + Asian Greens": 1
      },
      base: [
        I("Mushrooms", 3, "lb"),
        I("Garlic", 16, "cloves"),
        I("Ginger", 4, "knobs"),
        I("Red onion (large)", 2, ""),
        I("Cilantro", 1, "bunch"),
        I("Fresh noodles (not dried)", 1, "batch"),
        I("Cumin + spices", 1, "blend", true),
        I("Chinkiang vinegar", 6, "tbsp", true),
        I("Shaoxing wine", 0.5, "cup", true),
        I("House chili oil", 1, "cup", true)
      ],
      extras: {
        "Small (~3-4) + Asian Greens": [{ ...I("Asian greens", 1, "lb"), fixed: true }],
        "Large (~6-8) + Asian Greens": [{ ...I("Asian greens", 1, "lb"), fixed: true }]
      }
    },
    "Bolognese": {
      factors: { "Small (split order, ~4)": 0.5, "Large (~8)": 1 },
      base: [
        I("Ground pork", 1, "lb"),
        I("Ground lamb", 1, "lb"),
        I("Ground beef", 1, "lb"),
        I("Whole milk", 1, "cup"),
        I("Red wine", 1, "bottle"),
        I("Tomato paste", 1, "small can"),
        I("Fresh thyme", 1, "bunch"),
        I("Onion", 1, ""),
        I("Carrot", 1, ""),
        I("Garlic", 4, "cloves"),
        I("Pasta (ask customer for shape!)", 2, "lb"),
        I("Nutmeg", 1, "pinch", true)
      ]
    },
    "Shrimp or Tofu with Asparagus in Black Bean Sauce": {
      factors: {
        "Shrimp, Small Batch (~3-4)": 1,
        "Shrimp, Large Batch (~7-8)": 2,
        "Tofu, Small Batch (~3-4)": 1,
        "Tofu, Large Batch (~7-8)": 2
      },
      base: [
        I("Asparagus", 1, "lb"),
        I("Scallions", 1, "bunch"),
        I("Garlic", 3, "cloves"),
        I("Ginger", 1, "knob"),
        I("Soy + Shaoxing + black beans + sugar", 1, "batch", true),
        I("Rice (included with order)", 1, "batch", true)
      ],
      extras: {
        "Shrimp, Small Batch (~3-4)": [I("Shrimp", 1, "lb")],
        "Shrimp, Large Batch (~7-8)": [I("Shrimp", 1, "lb")],
        "Tofu, Small Batch (~3-4)": [I("Tofu", 1, "block")],
        "Tofu, Large Batch (~7-8)": [I("Tofu", 1, "block")]
      }
    },
    "Thai Basil Chicken (Pad Krapow Gai)": {
      factors: { "Small (~3-4)": 1, "Large (~7-8)": 2 },
      base: [
        I("Ground chicken", 1, "lb"),
        I("Asparagus", 8, "oz"),
        I("Thai basil", 1, "bunch"),
        I("Garlic", 6, "cloves"),
        I("Limes", 1, ""),
        I("Oyster + soy + fish sauce + sugar", 1, "batch", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    },
    "Pasta with Red Sauce": {
      factors: { "Base (~4)": 1, "With Beef or Turkey": 1, "With Mushrooms": 1, "With Both": 1 },
      base: [
        I("Canned tomatoes", 1, "28oz can"),
        I("Garlic", 5, "cloves"),
        I("Pasta", 1, "lb"),
        I("Good olive oil", 1, "glug", true)
      ],
      extras: {
        "With Beef or Turkey": [I("Ground beef or turkey", 1, "lb")],
        "With Mushrooms": [I("Baby bella mushrooms", 8, "oz")],
        "With Both": [I("Ground beef or turkey", 1, "lb"), I("Baby bella mushrooms", 8, "oz")]
      }
    },
    "Tex-Mex Kit": {
      factors: {
        "Pulled Pork, Small (~5-6)": 1,
        "Pulled Pork, Large (~9-10)": 2,
        "Pulled Beef, Small (~5-6)": 1,
        "Pulled Beef, Large (~9-10)": 2
      },
      base: [
        I("Beans (for refried)", 1, "lb"),
        I("Tomatoes (pico)", 1, "lb"),
        I("Red onion", 1.5, "lb"),
        I("Cilantro", 1, "bunch"),
        I("Limes", 8, ""),
        I("Garlic", 4, "cloves"),
        I("HEB bakery tortillas", 1, "10-ct pack"),
        I("Dried peppers (red sauce)", 8, "oz"),
        I("Orange juice", 1, "small bottle"),
        I("Tex-Mex spices", 1, "blend", true)
      ],
      extras: {
        "Pulled Pork, Small (~5-6)": [I("Bone-in pork butt", 4, "lb")],
        "Pulled Pork, Large (~9-10)": [I("Bone-in pork butt", 4, "lb")],
        "Pulled Beef, Small (~5-6)": [I("Beef chuck roast", 2.5, "lb")],
        "Pulled Beef, Large (~9-10)": [I("Beef chuck roast", 2.5, "lb")]
      }
    },
    "Brunswick Stew": {
      factors: { "Small (~4)": 1, "Large (~8)": 2 },
      base: [
        I("Chicken thighs", 1, "lb"),
        I("Salt pork", 2, "oz"),
        I("Chicken stock", 4, "cups"),
        I("Canned peeled tomatoes", 1, "14oz can"),
        I("Red potatoes", 0.5, "lb"),
        I("Onion", 1, "lb"),
        I("Corn", 3, "ears"),
        I("Dried lima beans", 5, "oz"),
        I("Worcestershire + vinegar + flour", 1, "batch", true)
      ]
    },
    "Boeuf Bourguignon (Beef Stew)": {
      factors: { "~6 servings": 1, "With 1 lb mushrooms": 1 },
      base: [
        I("Beef chuck roast", 2.5, "lb"),
        I("Red potatoes", 1.5, "lb"),
        I("Carrots", 1.5, "lb"),
        I("Red wine", 1, "bottle"),
        I("Beef stock", 8, "cups"),
        I("Fresh thyme", 1, "bunch"),
        I("Tomato paste", 1, "small can"),
        I("Onion", 1, "lb"),
        I("Bay + salt + pepper + vinegar", 1, "batch", true)
      ],
      extras: {
        "With 1 lb mushrooms": [I("Mushrooms", 1, "lb")]
      }
    },
    "Chili": {
      factors: { "Small (split order, ~3-4)": 0.5, "Large (~6-8)": 1 },
      base: [
        I("Ground beef", 2, "lb"),
        I("Dried kidney beans", 1, "lb"),
        I("Assorted dried chilis", 1, "bag"),
        I("Chicken broth", 4, "cups"),
        I("Canned tomatoes", 1, "28oz can"),
        I("Dark chocolate", 1, "oz"),
        I("Anchovies", 1, "tin"),
        I("Tomato paste", 1, "small can"),
        I("Limes", 1, ""),
        I("Espresso + bourbon + marmite + soy + spices", 1, "batch", true)
      ]
    },
    "Homemade Waffles": {
      factors: { "Set of 12": 1 },
      base: [
        I("Milk", 2, "cups"),
        I("Butter", 1, "stick"),
        I("Flour", 270, "g", true),
        I("Eggs", 2, "", true),
        I("Gallon ziplock bag", 1, "", true)
      ]
    },
    "Fresh Cut Pineapple": {
      factors: { "Per Container": 0.5 },
      base: [I("Pineapple (1 makes 2 containers)", 1, "")]
    },
    "Seasonal Cantaloupe": {
      factors: { "Per Container": 1 },
      base: [I("Seasonal cantaloupe (HEB melons)", 1, "")]
    },
    "Chocolate Chip Cookies": {
      factors: { "1 Dozen (Standard)": 1, "1 Dozen (Premium Valrhona)": 1 },
      base: [
        I("Butter", 2, "sticks"),
        I("Flour", 322, "g", true),
        I("Eggs", 3, "", true),
        I("Brown + white sugar", 1, "batch", true)
      ],
      extras: {
        "1 Dozen (Standard)": [I("Guittard chocolate (low + high %)", 290, "g")],
        "1 Dozen (Premium Valrhona)": [I("Valrhona chocolate", 290, "g")]
      }
    },
    "Peanut Butter Fudge": {
      factors: { "1 Batch": 1 },
      base: [
        I("Peanut butter", 0.5, "cup"),
        I("Evaporated milk", 0.75, "cup"),
        I("Butter", 3, "tbsp"),
        I("Sugar + karo + cocoa + vanilla", 1, "batch", true)
      ]
    },
    "Queso": {
      factors: { "Per Pint Jar": 0.5, "With jar swap": 0.5 },
      base: [
        I("Oaxaca cheese", 250, "g"),
        I("Colby Jack", 250, "g"),
        I("Poblano pepper", 90, "g"),
        I("Sweet onion", 135, "g"),
        I("Habaneros", 2, ""),
        I("Dried ancho chili", 9, "g"),
        I("Limes", 1, ""),
        I("Cilantro", 15, "g"),
        I("Sodium citrate", 20, "g", true),
        I("Pint mason jar", 2, "", false)
      ]
    },
    "Pickled Onions or Carrots": {
      factors: { "Standard": 1, "With jar swap": 1 },
      base: [
        I("Onions or carrots (for pickling)", 1, "lb"),
        I("Pint mason jar", 1, ""),
        I("Pickling vinegar + spices", 1, "batch", true)
      ]
    },
    "Chili Oil": {
      factors: { "Per Jar": 0.5, "With jar swap": 0.5 },
      base: [
        I("Ginger", 4, "knobs"),
        I("Pint mason jar", 2, ""),
        I("Chili flakes + whole spices + oil", 1, "batch", true)
      ]
    },
    "Thyme or Lavender Syrup": {
      factors: { "Per Jar": 1, "With jar swap": 1 },
      base: [
        I("Fresh thyme or lavender", 1, "bunch"),
        I("Pint mason jar", 1, ""),
        I("Sugar", 1, "cup", true)
      ]
    },
    "Vanilla Syrup": {
      factors: { "Per Jar": 1, "With jar swap": 1 },
      base: [
        I("Pint mason jar", 1, ""),
        I("House vanilla extract + beans", 1, "batch", true),
        I("Sugar", 1, "cup", true)
      ]
    },
    "Vanilla Lavender Syrup": {
      factors: { "Per Jar": 1, "With jar swap": 1 },
      base: [
        I("Fresh lavender", 1, "bunch"),
        I("Pint mason jar", 1, ""),
        I("House vanilla extract + beans", 1, "batch", true),
        I("Sugar", 1, "cup", true)
      ]
    },
    "Ribeye": {
      factors: { "price by weight": 1 },
      base: [I("Ribeye", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "NY Strip": {
      factors: { "price by weight": 1 },
      base: [I("NY Strip", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Filet Mignon": {
      factors: { "price by weight": 1 },
      base: [I("Filet Mignon", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Chicken Breast": {
      factors: { "price by weight": 1 },
      base: [I("Chicken breast", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Baby Gold Potatoes": {
      factors: { "2 servings": 1 },
      base: [I("Baby gold potatoes", 0.6, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Carrots": {
      factors: { "2 servings": 1 },
      base: [I("Carrots", 0.6, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Pork Tenderloin": {
      factors: { "price by weight": 1 },
      base: [I("Pork tenderloin", 1.25, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Saffron Pork Ragu": {
      factors: { "~4 servings": 1 },
      base: [
        I("Ground pork", 1, "lb"),
        I("Fennel bulb", 1, ""),
        I("Onion", 1, ""),
        I("Garlic", 4, "cloves"),
        I("Crushed tomatoes", 1, "can"),
        I("Dry sherry", 0.5, "cup"),
        I("Saffron", 1, "pinch", true),
        I("Pasta (ask customer for shape!)", 1, "lb")
      ]
    },
    "Mapo Eggplant": {
      factors: { "~5-6 servings": 1 },
      base: [
        I("Chinese eggplant", 2, "lb"),
        I("Ground chicken", 0.5, "lb"),
        I("Doubanjiang", 3, "tbsp"),
        I("Garlic", 4, "cloves"),
        I("Ginger", 1, "knob"),
        I("Scallions", 1, "bunch"),
        I("House chili oil", 0.25, "cup", true),
        I("Sichuan peppercorns", 1, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    },
    "Gumbo": {
      factors: { "Small (split order, ~3-4)": 0.5, "Large (~7-8)": 1 },
      base: [
        I("Chicken thighs", 2, "lb"),
        I("Boudin", 1, "lb"),
        I("Onion", 1, ""),
        I("Green bell pepper", 1, ""),
        I("Celery", 3, "stalks"),
        I("Garlic", 4, "cloves"),
        I("Flour", 1, "cup"),
        I("Okra", 0.5, "lb"),
        I("Cajun spices", 1, "blend", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    },
    "Stir Fried Long Beans with Ground Pork": {
      factors: { "Small (~4)": 0.5, "Large (~8)": 1 },
      base: [
        I("Long beans", 1.5, "lb"),
        I("Ground pork", 1, "lb"),
        I("Doubanjiang", 2, "tbsp"),
        I("Garlic", 6, "cloves"),
        I("Scallions", 1, "bunch"),
        I("Soy sauce", 2, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    }
  };
  var INGREDIENT_SYNONYMS = {
    "scallion": "green onion",
    "scallions": "green onion",
    "spring onion": "green onion",
    "coriander": "cilantro",
    "chili": "chile",
    "chilli": "chile"
  };
  function normalizeIngredientName(name) {
    let n = String(name).toLowerCase().trim();
    n = n.replace(/\s*\(.*?\)\s*/g, " ").trim();
    n = n.replace(/\s+/g, " ");
    n = n.split(" ").map((w) => {
      if (INGREDIENT_SYNONYMS[w]) return INGREDIENT_SYNONYMS[w];
      if (w.length > 4 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
      return w;
    }).join(" ");
    return INGREDIENT_SYNONYMS[n] || n;
  }
  function generateShoppingItems(activeOrders, includeStaples) {
    const agg = /* @__PURE__ */ new Map();
    const unknown = [];
    const addIng = (name, qty, unit, staple, factor) => {
      const norm = normalizeIngredientName(name);
      const normUnit = unit.length > 3 && unit.endsWith("s") && !unit.endsWith("ss") ? unit.slice(0, -1) : unit;
      const key = `${norm}|${normUnit}`;
      if (!agg.has(key)) agg.set(key, { display: name, u: unit, q: 0, staple });
      agg.get(key).q += qty * factor;
    };
    activeOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        if (isPerLbItem(it.name)) {
          const lbs = (typeof it.weight === "number" && it.weight > 0 ? it.weight : 1) * it.qty;
          addIng(it.name, lbs, "lb", false, 1);
          if (includeStaples) addIng("Sous vide bag + seasonings", 1, "", true, it.qty);
          return;
        }
        const recipe = RECIPES[it.name];
        if (!recipe) {
          unknown.push(`${it.qty}x ${it.name} (${it.variant}) \u2014 no recipe data, plan manually`);
          return;
        }
        const factor = (recipe.factors?.[it.variant] ?? 1) * it.qty;
        const ings = [...recipe.base || [], ...(recipe.extras || {})[it.variant] || []];
        ings.forEach((ing) => {
          if (ing.staple && !includeStaples) return;
          addIng(ing.name, ing.q, ing.u, ing.staple, ing.fixed ? it.qty : factor);
        });
      });
    });
    const fmtQ = (q) => String(Math.round(q * 100) / 100);
    const lines = Array.from(agg.values()).sort((a, b) => a.staple === b.staple ? a.display.localeCompare(b.display) : a.staple ? 1 : -1).map((x) => {
      const qty = x.u ? `${fmtQ(x.q)} ${x.u}` : fmtQ(x.q);
      return `${x.display} \u2014 ${qty}${x.staple ? " (staple)" : ""}`;
    });
    return [...lines, ...unknown];
  }
  var uid = () => Math.random().toString(36).slice(2, 10);
  var currency = (n) => `$${(Number(n) || 0).toFixed(2)}`;
  var round2 = (n) => Math.round(n * 100) / 100;
  function discountAmount(itemsTotal, discountType, discountValue) {
    if (!discountType || !discountValue) return 0;
    if (discountType === "percent") return round2(itemsTotal * (discountValue / 100));
    return round2(Math.min(discountValue, itemsTotal));
  }
  function itemsUpchargeTotal(items) {
    return round2((items || []).reduce((sum, it) => {
      const amt = it.upcharge && typeof it.upcharge.amount === "number" ? it.upcharge.amount : 0;
      return sum + amt * it.qty;
    }, 0));
  }
  function customChargesTotal(customCharges) {
    return round2((customCharges || []).reduce((sum, ch) => sum + (Number(ch.amount) || 0), 0));
  }
  function itemsBaseTotal(items) {
    return round2((items || []).reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0));
  }
  function orderTotal(items, jarSwaps, containerReturns, discountType, discountValue, customCharges, waiveSurcharge) {
    const base = itemsBaseTotal(items);
    const upcharges = itemsUpchargeTotal(items);
    const custom = customChargesTotal(customCharges);
    const disc = discountAmount(base, discountType, discountValue);
    const surcharge = waiveSurcharge ? 0 : SURCHARGE;
    return round2(base + upcharges - disc + custom + surcharge - (jarSwaps || 0) * 2 - (containerReturns || 0) * 1);
  }
  function repricePerLbItem(it) {
    const info = PER_LB_ITEMS[it.name];
    if (!info) return it;
    const lbs = typeof it.weight === "number" && it.weight > 0 ? it.weight : 1;
    const BAG = 1.5;
    return {
      ...it,
      weightPending: false,
      price: round2(info.pricePerLb * lbs + BAG),
      cost: round2(info.costPerLb * lbs)
    };
  }
  function itemCost(it) {
    if (typeof it.cost === "number") return it.cost;
    const menuItem = (FULL_MENU[it.category] || []).find((m) => m.name === it.name);
    const variant = menuItem?.variants.find((v) => v.label === it.variant);
    return typeof variant?.cost === "number" ? variant.cost : null;
  }
  function orderCostInfo(order) {
    let cost = 0;
    let complete = true;
    (order.items || []).forEach((it) => {
      const c = itemCost(it);
      if (c === null) complete = false;
      else cost += c * it.qty;
    });
    return { cost: round2(cost), complete };
  }
  function groupKeyFor(order, mode) {
    const d = new Date(order.createdAt || 0);
    if (mode === "week") {
      const day = (d.getDay() + 6) % 7;
      const mon = new Date(d);
      mon.setDate(d.getDate() - day);
      return {
        label: `Week of ${mon.toLocaleDateString(void 0, { month: "short", day: "numeric" })}`,
        stamp: new Date(mon.getFullYear(), mon.getMonth(), mon.getDate()).getTime()
      };
    }
    if (mode === "month") {
      return {
        label: d.toLocaleDateString(void 0, { month: "long", year: "numeric" }),
        stamp: new Date(d.getFullYear(), d.getMonth(), 1).getTime()
      };
    }
    if (mode === "year") {
      return { label: String(d.getFullYear()), stamp: new Date(d.getFullYear(), 0, 1).getTime() };
    }
    return { label: "", stamp: 0 };
  }
  function formatDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(void 0, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }
  function orderToText(order) {
    const lines = [`LTB Order \u2014 ${order.customer}`];
    (order.items || []).forEach((it) => {
      const up = it.upcharge && it.upcharge.amount ? it.price + it.upcharge.amount : it.price;
      lines.push(`${it.qty}x ${it.name} (${it.variant}) \u2014 ${currency(up * it.qty)}`);
      if (it.upcharge && it.upcharge.amount)
        lines.push(`   + ${it.upcharge.label || "Upcharge"} (+${currency(it.upcharge.amount)} ea)`);
      if (it.note) lines.push(`   note: ${it.note}`);
    });
    const base = itemsBaseTotal(order.items);
    const disc = discountAmount(base, order.discountType, order.discountValue);
    if (disc > 0) {
      const label = order.discountType === "percent" ? `${order.discountValue}% discount` : "Discount";
      lines.push(`${label} \u2014 -${currency(disc)}`);
    }
    (order.customCharges || []).forEach((ch) => {
      lines.push(`${ch.label || "Charge"} \u2014 ${currency(Number(ch.amount) || 0)}`);
    });
    if (!order.waiveSurcharge) lines.push(`Order surcharge \u2014 ${currency(SURCHARGE)}`);
    if (order.jarSwaps > 0)
      lines.push(`Jar swap x${order.jarSwaps} \u2014 -${currency(order.jarSwaps * 2)}`);
    if (order.containerReturns > 0)
      lines.push(`Container return x${order.containerReturns} \u2014 -${currency(order.containerReturns)}`);
    lines.push(`Total: ${currency(order.total)}`);
    if (order.notes) lines.push(`Notes: ${order.notes}`);
    return lines.join("\n");
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  }
  var localStore = {
    async get(key) {
      const value = window.localStorage.getItem(key);
      return value === null ? null : { key, value };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
      return { key, value };
    },
    async delete(key) {
      window.localStorage.removeItem(key);
      return { key, deleted: true };
    },
    async list(prefix) {
      const keys = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (!prefix || k.startsWith(prefix))) keys.push(k);
      }
      return { keys };
    }
  };
  var store = typeof window !== "undefined" && window.storage ? window.storage : localStore;
  async function loadJSON(key, fallback) {
    try {
      const result = await store.get(key);
      return result ? JSON.parse(result.value) : fallback;
    } catch {
      return fallback;
    }
  }
  async function saveJSON(key, value) {
    let serialized;
    try {
      serialized = JSON.stringify(value);
    } catch (e) {
      return { ok: false, error: "Could not serialize data", bytes: 0 };
    }
    const bytes = serialized.length;
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await store.set(key, serialized);
        if (result) return { ok: true, error: null, bytes };
        lastErr = "Storage returned empty";
      } catch (e) {
        lastErr = e && e.message || "Storage threw an error";
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 150));
    }
    return { ok: false, error: lastErr, bytes };
  }
  function saveError(res) {
    if (res && res.ok) return null;
    const bytes = res ? res.bytes : 0;
    if (bytes > 4.8 * 1024 * 1024) {
      return `Storage full: this data is ${(bytes / 1024 / 1024).toFixed(1)}MB, over the ~5MB limit. Archive or delete old orders, then it will save.`;
    }
    const detail = res && res.error ? ` (${res.error})` : "";
    return `Could not save${detail}. Your changes are shown but not yet stored \u2014 try again.`;
  }
  var PHOTO_PREFIX = "ltb-photo-";
  var PHOTO_TTL_DAYS = 30;
  function photoKey(orderId, itemIdx) {
    return `${PHOTO_PREFIX}${orderId}-${itemIdx}`;
  }
  async function savePhoto(orderId, itemIdx, base64) {
    try {
      const r = await store.set(photoKey(orderId, itemIdx), JSON.stringify({ d: base64, t: Date.now() }));
      return !!r;
    } catch {
      return false;
    }
  }
  async function loadPhoto(orderId, itemIdx) {
    try {
      const r = await store.get(photoKey(orderId, itemIdx));
      if (!r) return null;
      const parsed = JSON.parse(r.value);
      return parsed.d || null;
    } catch {
      return null;
    }
  }
  async function deletePhoto(orderId, itemIdx) {
    try {
      await store.delete(photoKey(orderId, itemIdx));
    } catch {
    }
  }
  async function photoStorageBytes() {
    try {
      const res = await store.list(PHOTO_PREFIX);
      const keys = res && res.keys || [];
      let bytes = 0;
      for (const k of keys) {
        try {
          const r = await store.get(k);
          if (r && r.value) bytes += r.value.length;
        } catch {
        }
      }
      return { bytes, count: keys.length };
    } catch {
      return { bytes: 0, count: 0 };
    }
  }
  async function cleanupPhotos(orders) {
    try {
      const res = await store.list(PHOTO_PREFIX);
      const keys = res && res.keys || [];
      if (keys.length === 0) return;
      const byId = new Map((orders || []).map((o) => [o.id, o]));
      const cutoff = Date.now() - PHOTO_TTL_DAYS * 24 * 60 * 60 * 1e3;
      for (const k of keys) {
        const rest = k.slice(PHOTO_PREFIX.length);
        const lastDash = rest.lastIndexOf("-");
        const orderId = lastDash >= 0 ? rest.slice(0, lastDash) : rest;
        const order = byId.get(orderId);
        let remove = false;
        if (!order) remove = true;
        else if (order.archived) remove = true;
        else {
          try {
            const r = await store.get(k);
            const t = r ? JSON.parse(r.value).t || 0 : 0;
            const stamp = t || new Date(order.createdAt || 0).getTime();
            if (stamp < cutoff) remove = true;
          } catch {
          }
        }
        if (remove) {
          try {
            await store.delete(k);
          } catch {
          }
        }
      }
    } catch {
    }
  }
  var fmtBytes = (b) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  };
  function menuForPrompt(menu) {
    const lines = [];
    Object.entries(menu).forEach(([cat, items]) => {
      items.forEach((item) => {
        item.variants.forEach((v) => {
          lines.push(`category="${cat}" name="${item.name}" variant="${v.label}" price=$${v.price}`);
        });
      });
    });
    return lines.join("\n");
  }
  async function fileToJpegBase64(file, maxDim = 1100, quality = 0.72) {
    const draw = (source, width, height) => {
      const scale = Math.min(1, maxDim / Math.max(width, height));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(source, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (!dataUrl || dataUrl.length < 100) throw new Error("Image conversion produced no data");
      return dataUrl.split(",")[1];
    };
    if (typeof createImageBitmap === "function") {
      try {
        const bmp = await createImageBitmap(file);
        const result = draw(bmp, bmp.width, bmp.height);
        bmp.close && bmp.close();
        return result;
      } catch (e) {
      }
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          resolve(draw(img, img.naturalWidth || img.width, img.naturalHeight || img.height));
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not decode image"));
      };
      img.src = url;
    });
  }
  async function parseOrderText(messageText, imageBase64, menu) {
    const intro = imageBase64 ? `You are an order parser for a small meal prep business. A customer sent a PHOTO of the menu with items circled, highlighted, or marked \u2014 possibly with handwritten notes on it${messageText ? ", along with this text message" : ""}.
Identify which menu items are circled/marked in the photo, and read any handwritten notes (like "sauce on side") into "notes".${messageText ? `

Their accompanying text:
"""
${messageText}
"""` : ""}` : `You are an order parser for a small meal prep business. A customer sent this text message with their order:

"""
${messageText}
"""`;
    const prompt = `${intro}

Here is the complete CURRENT menu. Each line is one orderable option:
${menuForPrompt(menu)}

Match what the customer asked for to menu options. Rules:
- Use EXACT category, name, and variant strings from the menu above.
- The customer may be looking at an OLDER version of the menu. If a marked item does not exist on the current menu, do NOT substitute a similar item \u2014 describe it in "notes" instead so the chef can follow up.
- If the customer mentions returning or swapping a jar for a jar item, choose the "With jar swap" variant of that item if one exists.
- "jarSwaps" should equal the number of jar items ordered with the jar-swap variant.
- "containerReturns" is the number of meal containers the customer says they will return (not jars).
- PER-ITEM NOTES: if a request clearly attaches to ONE specific item (e.g. "chili oil on the side", "extra spicy", "no cilantro"), put it in that item's "note" field, NOT in the order-level notes.
- ADD-ONS: some items have add-on options baked into their variants (e.g. a dish with a "+ Asian Greens" or "With Mushrooms" variant). If the customer asks for an add-on that EXISTS as a variant of that item (look for variants with + or "With" in the label, or a higher price than the base), select that upgraded variant \u2014 do NOT create an upcharge and do NOT flag it. Example: customer says "small mushroom noodles with Asian greens" \u2192 select variant "Small (~3-4) + Asian Greens", not "Small (~3-4)".
- OFF-MENU EXTRAS (upcharge): only if the customer asks to add something to an item that is NOT an available variant of that item (e.g. "add mushrooms" to a dish that has no mushroom option), set that item's "upcharge" to {"label":"short description","amount":null} with amount null. Do NOT also write a reviewReason for it \u2014 the app detects unpriced upcharges automatically. Just set the upcharge object.
- WEIGHT FOR PROTEINS: items named exactly "Ribeye", "NY Strip", "Filet Mignon", or "Chicken Breast" are priced by the pound, weighed by the chef after shopping. Do NOT price them, do NOT set an upcharge, and do NOT write a reviewReason about their weight. If the customer mentions an intended amount (e.g. "1 lb chicken", "ribeye about half a pound", "a 12 oz NY strip"), put that amount in the item's "note" field as a reminder (e.g. note "about 1 lb"). Always leave "weight" null.
- Order-level "notes" is only for things that don't attach to a single item (delivery time, general messages).
- CARROTS: if someone says "carrots" without qualification, match it to the sous vide bag item (category "bag", name "Carrots", variant "2 servings"). Only match to "Pickled Onions or Carrots" if they specifically say "pickled carrots".
- reviewReasons: ONLY use this for genuine ambiguity the app cannot detect on its own \u2014 an unclear quantity, an item you couldn't confidently match, or a confusing request. Do NOT add reviewReasons for unpriced upcharges or for protein weights; those are handled automatically. If everything is clear, return an empty reviewReasons array.

Respond with ONLY a JSON object, no markdown fences, no explanation. Shape:
{"items":[{"category":"...","name":"...","variant":"...","qty":1,"note":"","upcharge":null,"weight":null}],"jarSwaps":0,"containerReturns":0,"notes":"","reviewReasons":[]}`;
    const content = imageBase64 ? [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
      { type: "text", text: prompt }
    ] : prompt;
    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2e3,
          messages: [{ role: "user", content }]
        })
      });
    } catch (e) {
      throw new Error(`[network layer] ${e && e.message ? e.message : "request failed"}`);
    }
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Non-JSON response (HTTP ${response.status}): ${raw.slice(0, 180)}`);
    }
    if (data.error) {
      const detail = typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error);
      throw new Error(`HTTP ${response.status} \u2014 ${String(detail).slice(0, 120)} \u2014 raw: ${raw.slice(0, 180)}`);
    }
    if (!response.ok) {
      throw new Error(`API ${response.status}: ${raw.slice(0, 180)}`);
    }
    const text = (data.content || []).map((b) => b.type === "text" ? b.text : "").join("");
    if (!text.trim()) {
      throw new Error(`Empty response from parser \u2014 HTTP ${response.status}, raw: ${raw.slice(0, 120)}`);
    }
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
    return validateParsedOrder(parsed, menu);
  }
  function validateParsedOrder(parsed, menu) {
    const items = [];
    const misses = [];
    (parsed.items || []).forEach((pi) => {
      let matched = null;
      const cats = pi.category && menu[pi.category] ? [pi.category] : Object.keys(menu);
      for (const cat of cats) {
        const menuItem = menu[cat].find((m) => m.name.toLowerCase() === String(pi.name || "").toLowerCase());
        if (menuItem) {
          const variant = menuItem.variants.find((v) => v.label.toLowerCase() === String(pi.variant || "").toLowerCase()) || (menuItem.variants.length === 1 ? menuItem.variants[0] : null);
          if (variant) {
            let upcharge = null;
            if (!isPerLbItem(menuItem.name) && pi.upcharge && (pi.upcharge.label || pi.upcharge.amount != null)) {
              upcharge = {
                label: String(pi.upcharge.label || "Upcharge").slice(0, 40),
                amount: typeof pi.upcharge.amount === "number" ? pi.upcharge.amount : 0
              };
            }
            matched = {
              category: cat,
              name: menuItem.name,
              variant: variant.label,
              price: variant.price,
              cost: variant.cost,
              qty: Math.max(1, parseInt(pi.qty) || 1),
              note: pi.note ? String(pi.note).slice(0, 200) : "",
              upcharge
            };
            if (isPerLbItem(menuItem.name)) {
              matched.weightPending = true;
              matched.price = 0;
              matched.cost = 0;
              matched.weight = void 0;
            }
            break;
          }
        }
      }
      if (matched) {
        const dup = items.find((i) => i.category === matched.category && i.name === matched.name && i.variant === matched.variant && !i.note && !i.upcharge && !matched.note && !matched.upcharge);
        if (dup) dup.qty += matched.qty;
        else items.push(matched);
      } else misses.push(`${pi.qty || 1}x ${pi.name || "?"} ${pi.variant ? `(${pi.variant})` : ""}`.trim());
    });
    let notes = String(parsed.notes || "").trim();
    const overlapRe = /\b(upcharge|price|weigh|weight|pound|per lb|per-lb|couldn'?t match|could not match|not on the menu|off[- ]menu)\b/i;
    const reviewReasons = (Array.isArray(parsed.reviewReasons) ? parsed.reviewReasons : []).map((r) => String(r).trim()).filter(Boolean).filter((r) => !overlapRe.test(r));
    if (misses.length > 0) {
      reviewReasons.push(`Couldn't match to this week's menu: ${misses.join(", ")}`);
      notes = [notes, `Could not auto-match: ${misses.join(", ")} \u2014 review!`].filter(Boolean).join("\n");
    }
    items.forEach((it) => {
      if (it.upcharge && !it.upcharge.amount) {
        reviewReasons.push(`Set a price for "${it.upcharge.label}" on ${it.name}`);
      }
    });
    const seen = /* @__PURE__ */ new Set();
    const dedupedReasons = reviewReasons.filter((r) => {
      const k = r.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return {
      items,
      jarSwaps: Math.max(0, parseInt(parsed.jarSwaps) || 0),
      containerReturns: Math.max(0, parseInt(parsed.containerReturns) || 0),
      notes,
      reviewReasons: dedupedReasons
    };
  }
  async function parseAmendment(order, messageText, menu) {
    const currentLines = (order.items || []).map((it) => {
      const bits = [`${it.qty}x ${it.name} (${it.variant})`];
      if (it.note) bits.push(`note: ${it.note}`);
      if (it.upcharge && it.upcharge.label) bits.push(`upcharge: ${it.upcharge.label}${it.upcharge.amount ? ` $${it.upcharge.amount}` : " (unpriced)"}`);
      return "  - " + bits.join(", ");
    }).join("\n");
    const currentExtras = [];
    if (order.jarSwaps > 0) currentExtras.push(`jarSwaps: ${order.jarSwaps}`);
    if (order.containerReturns > 0) currentExtras.push(`containerReturns: ${order.containerReturns}`);
    if (order.notes) currentExtras.push(`order notes: ${order.notes}`);
    const prompt = `You are an order parser for a small meal prep business. An EXISTING order needs to be amended based on a new follow-up message from the customer.

THE CURRENT ORDER (for ${order.customer}):
${currentLines || "  (no items)"}
${currentExtras.length ? currentExtras.join("\n") : ""}

THE FOLLOW-UP MESSAGE:
"""
${messageText}
"""

Here is the complete CURRENT menu. Each line is one orderable option:
${menuForPrompt(menu)}

Apply the customer's requested changes to the current order and return the COMPLETE updated order (not just the changes). Keep every existing item that wasn't changed, exactly as it was (same variant, note, upcharge). Apply additions, removals, quantity changes, and variant changes as requested. Follow these rules:
- Use EXACT category, name, and variant strings from the menu.
- Keep existing per-item notes and upcharges unless the customer's message changes them.
- ADD-ONS: if the customer asks for an add-on that EXISTS as a variant of an item, switch to that variant. Do not create an upcharge for it.
- OFF-MENU EXTRAS: only if they ask to add something that is NOT an available variant, set that item's "upcharge" to {"label":"...","amount":null}. Do not also add a reviewReason for it.
- PER-LB PROTEINS (Ribeye, NY Strip, Filet Mignon, Chicken Breast): never price or weight them; put any stated amount in the item "note". Leave weight null.
- reviewReasons: ONLY for genuine ambiguity you cannot resolve (an unclear request, an item you couldn't match). Do not flag upcharges or weights.

Respond with ONLY a JSON object, no markdown fences, no explanation. Shape:
{"items":[{"category":"...","name":"...","variant":"...","qty":1,"note":"","upcharge":null,"weight":null}],"jarSwaps":0,"containerReturns":0,"notes":"","reviewReasons":[]}`;
    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2e3,
          messages: [{ role: "user", content: prompt }]
        })
      });
    } catch (e) {
      throw new Error(`[network layer] ${e && e.message ? e.message : "request failed"}`);
    }
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Non-JSON response (HTTP ${response.status}): ${raw.slice(0, 180)}`);
    }
    if (data.error) {
      const detail = typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error);
      throw new Error(`HTTP ${response.status} \u2014 ${String(detail).slice(0, 120)}`);
    }
    if (!response.ok) throw new Error(`API ${response.status}: ${raw.slice(0, 180)}`);
    const text = (data.content || []).map((b) => b.type === "text" ? b.text : "").join("");
    if (!text.trim()) throw new Error("Empty response from parser");
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
    const validated = validateParsedOrder(parsed, menu);
    return {
      ...validated,
      id: order.id,
      customer: order.customer,
      status: order.status,
      paid: order.paid,
      archived: order.archived,
      createdAt: order.createdAt,
      discountType: order.discountType,
      discountValue: order.discountValue,
      customCharges: order.customCharges || [],
      _amended: true
    };
  }
  function ImportModal({ onSubmit, onCancel }) {
    const [text, setText] = (0, import_react.useState)("");
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceOverlay, onClick: onCancel }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.importModalCard, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalTitle }, "Paste backup"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 18 }))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.importModalHint }, "Open your backup note, select all, copy, then long-press in the box below and paste."), /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "140px", fontSize: "11px", fontFamily: "monospace" },
        placeholder: "Paste your LTB backup JSON here...",
        value: text,
        onChange: (e) => setText(e.target.value),
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...text.trim() ? {} : styles.saveBtnDisabled },
        disabled: !text.trim(),
        onClick: () => onSubmit(text)
      },
      "Restore orders"
    )));
  }
  function LTBOrderTracker() {
    const [orders, setOrders] = (0, import_react.useState)(null);
    const [cookChecks, setCookChecks] = (0, import_react.useState)({});
    const [shopping, setShopping] = (0, import_react.useState)([]);
    const [weekDishes, setWeekDishes] = (0, import_react.useState)(DEFAULT_WEEK);
    const [loading, setLoading] = (0, import_react.useState)(true);
    const [error, setError] = (0, import_react.useState)(null);
    const [view, setView] = (0, import_react.useState)("orders");
    const [formMode, setFormMode] = (0, import_react.useState)(null);
    const [showPaste, setShowPaste] = (0, import_react.useState)(false);
    const [showAmend, setShowAmend] = (0, import_react.useState)(false);
    const [showCsv, setShowCsv] = (0, import_react.useState)(false);
    const [expandedOrder, setExpandedOrder] = (0, import_react.useState)(null);
    (0, import_react.useEffect)(() => {
      let mounted = true;
      (async () => {
        const [loadedOrders, loadedChecks, loadedShopping, loadedWeek] = await Promise.all([
          loadJSON(ORDERS_KEY, []),
          loadJSON(CHECKS_KEY, {}),
          loadJSON(SHOPPING_KEY, []),
          loadJSON(WEEK_KEY, null)
        ]);
        if (!mounted) return;
        const migrated = loadedOrders.map((o) => ({
          ...o,
          items: o.items || [],
          paid: o.paid === void 0 ? o.status === "Delivered" : o.paid,
          archived: o.archived || false,
          discountType: o.discountType || null,
          discountValue: o.discountValue || 0,
          customCharges: o.customCharges || [],
          jarSwaps: o.jarSwaps || 0,
          containerReturns: o.containerReturns || 0,
          waiveSurcharge: o.waiveSurcharge || false,
          total: Number(o.total) || 0
        }));
        setOrders(migrated);
        setCookChecks(loadedChecks || {});
        setShopping(loadedShopping || []);
        if (loadedWeek && Array.isArray(loadedWeek.selected)) {
          const valid = loadedWeek.selected.filter((n) => ALL_DINNERS.some((d) => d.name === n));
          setWeekDishes(valid.length > 0 ? valid : DEFAULT_WEEK);
        }
        setLoading(false);
        cleanupPhotos(migrated);
      })();
      return () => {
        mounted = false;
      };
    }, []);
    const persistOrders = (0, import_react.useCallback)(async (next) => {
      setOrders(next);
      const res = await saveJSON(ORDERS_KEY, next);
      setError(saveError(res));
      return res;
    }, []);
    const persistShopping = (0, import_react.useCallback)((next) => {
      setShopping(next);
      saveJSON(SHOPPING_KEY, next).then((res) => setError(saveError(res)));
    }, []);
    const saveOrder = (0, import_react.useCallback)((order) => {
      setOrders((prev) => {
        const exists = (prev || []).some((o) => o.id === order.id);
        const next = exists ? (prev || []).map((o) => o.id === order.id ? order : o) : [order, ...prev || []];
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
      setFormMode(null);
    }, []);
    const importOrders = (0, import_react.useCallback)((parsedOrders) => {
      const newOrders = parsedOrders.map((p) => {
        const items = p.items || [];
        const total = orderTotal(items, p.jarSwaps || 0, p.containerReturns || 0, null, 0, [], false);
        return {
          id: uid(),
          customer: p.customer,
          items,
          jarSwaps: p.jarSwaps || 0,
          containerReturns: p.containerReturns || 0,
          notes: p.notes || "",
          discountType: null,
          discountValue: 0,
          customCharges: [],
          waiveSurcharge: false,
          total,
          status: "Ordered",
          paid: false,
          archived: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
      setOrders((prev) => {
        const next = [...newOrders, ...prev || []];
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
      setShowCsv(false);
      setExportMsg(`Imported ${newOrders.length} order${newOrders.length !== 1 ? "s" : ""} from the sheet.`);
      setTimeout(() => setExportMsg(null), 4e3);
    }, []);
    const updateOrder = (0, import_react.useCallback)((id, patch) => {
      setOrders((prev) => {
        const next = (prev || []).map((o) => o.id === id ? { ...o, ...patch } : o);
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const deleteOrder = (0, import_react.useCallback)((id) => {
      setOrders((prev) => {
        const target = (prev || []).find((o) => o.id === id);
        if (target) (target.items || []).forEach((it, i) => {
          if (it.hasPhoto) deletePhoto(id, i);
        });
        const next = (prev || []).filter((o) => o.id !== id);
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const archiveDelivered = (0, import_react.useCallback)(() => {
      persistOrders((orders || []).map(
        (o) => o.status === "Delivered" && !o.archived ? { ...o, archived: true } : o
      ));
    }, [orders, persistOrders]);
    const [exportMsg, setExportMsg] = (0, import_react.useState)(null);
    const exportData = (0, import_react.useCallback)(async () => {
      const payload = {
        version: "ltb-v1",
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        orders: orders || [],
        shopping,
        weekDishes
      };
      const json = JSON.stringify(payload, null, 2);
      try {
        await navigator.clipboard.writeText(json);
        setExportMsg("Copied! Paste into Notes or anywhere to save.");
      } catch {
        try {
          const ta = document.createElement("textarea");
          ta.value = json;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          setExportMsg("Copied! Paste into Notes or anywhere to save.");
        } catch {
          setExportMsg("Could not copy automatically. Try the export from Safari (not home screen).");
        }
      }
      setTimeout(() => setExportMsg(null), 4e3);
    }, [orders, shopping, weekDishes]);
    const importData = (0, import_react.useCallback)(async (e) => {
      let json;
      if (typeof e === "string") {
        json = e;
      } else {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        e.target.value = "";
        json = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = (ev) => res(ev.target.result);
          r.onerror = () => rej(new Error("Could not read file"));
          r.readAsText(file);
        });
      }
      try {
        const payload = JSON.parse(json);
        if (!payload.version || !Array.isArray(payload.orders)) {
          setError("That doesn't look like an LTB backup. Nothing was changed.");
          return;
        }
        const ok = window.confirm(
          `Import ${payload.orders.length} orders from ${payload.exportedAt?.slice(0, 10) || "backup"}?

This will replace your current orders.`
        );
        if (!ok) return;
        const res = await persistOrders(payload.orders);
        if (!res.ok) return;
        if (Array.isArray(payload.shopping)) {
          setShopping(payload.shopping);
          await saveJSON(SHOPPING_KEY, payload.shopping);
        }
        if (Array.isArray(payload.weekDishes)) {
          setWeekDishes(payload.weekDishes);
          await saveJSON(WEEK_KEY, { selected: payload.weekDishes });
        }
        setExportMsg(`Imported ${payload.orders.length} orders successfully.`);
        setTimeout(() => setExportMsg(null), 4e3);
        setError(null);
      } catch {
        setError("Couldn't read that backup \u2014 make sure you copied the full text.");
      }
    }, [persistOrders]);
    const [showImportModal, setShowImportModal] = (0, import_react.useState)(false);
    const pasteImport = (0, import_react.useCallback)(() => {
      setShowImportModal(true);
    }, []);
    const submitImport = (0, import_react.useCallback)(async (text) => {
      setShowImportModal(false);
      if (!text.trim()) return;
      try {
        const payload = JSON.parse(text.trim());
        if (!payload.version || !Array.isArray(payload.orders)) {
          setError("That doesn't look like an LTB backup. Nothing was changed.");
          return;
        }
        const res = await persistOrders(payload.orders);
        if (!res.ok) {
          return;
        }
        if (Array.isArray(payload.shopping)) {
          setShopping(payload.shopping);
          await saveJSON(SHOPPING_KEY, payload.shopping);
        }
        if (Array.isArray(payload.weekDishes)) {
          setWeekDishes(payload.weekDishes);
          await saveJSON(WEEK_KEY, { selected: payload.weekDishes });
        }
        setExportMsg(`Imported ${payload.orders.length} orders successfully.`);
        setTimeout(() => setExportMsg(null), 4e3);
        setError(null);
      } catch {
        setError("Couldn't read that \u2014 make sure you copied the full backup text.");
      }
    }, [persistOrders]);
    const currentOrders = (0, import_react.useMemo)(() => (orders || []).filter((o) => !o.archived), [orders]);
    const activeOrders = (0, import_react.useMemo)(() => currentOrders.filter((o) => o.status !== "Delivered"), [currentOrders]);
    const deliveredOrders = (0, import_react.useMemo)(() => currentOrders.filter((o) => o.status === "Delivered"), [currentOrders]);
    const stats = (0, import_react.useMemo)(() => {
      const booked = currentOrders.reduce((s, o) => s + o.total, 0);
      const unpaid = currentOrders.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0);
      return { active: activeOrders.length, booked: round2(booked), unpaid: round2(unpaid) };
    }, [currentOrders, activeOrders]);
    const activeFinancials = (0, import_react.useMemo)(() => {
      let revenue = 0;
      let cost = 0;
      activeOrders.forEach((o) => {
        revenue += o.total;
        cost += orderCostInfo(o).cost;
      });
      return { revenue: round2(revenue), cost: round2(cost), profit: round2(revenue - cost) };
    }, [activeOrders]);
    const recentCustomers = (0, import_react.useMemo)(() => {
      const seen = /* @__PURE__ */ new Set();
      const names = [];
      for (const o of orders || []) {
        const name = (o.customer || "").trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          names.push(name);
        }
        if (names.length >= 6) break;
      }
      return names;
    }, [orders]);
    const cookingList = (0, import_react.useMemo)(() => {
      const map = /* @__PURE__ */ new Map();
      activeOrders.forEach((o) => {
        (o.items || []).forEach((it) => {
          const key = `${it.category}::${it.name}::${it.variant}`;
          if (!map.has(key)) {
            map.set(key, { key, category: it.category, name: it.name, variant: it.variant, qty: 0 });
          }
          map.get(key).qty += it.qty;
        });
      });
      const catOrder = Object.keys(CATEGORY_LABELS);
      return Array.from(map.values()).sort(
        (a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || a.name.localeCompare(b.name)
      );
    }, [activeOrders]);
    const toggleCheck = (0, import_react.useCallback)((key) => {
      setCookChecks((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        const validKeys = new Set(cookingList.map((it) => it.key));
        Object.keys(next).forEach((k) => {
          if (!validKeys.has(k)) delete next[k];
        });
        saveJSON(CHECKS_KEY, next);
        return next;
      });
    }, [cookingList]);
    const resetChecks = (0, import_react.useCallback)(() => {
      setCookChecks({});
      saveJSON(CHECKS_KEY, {});
    }, []);
    const menu = (0, import_react.useMemo)(() => buildMenu(weekDishes), [weekDishes]);
    const toggleWeekDish = (0, import_react.useCallback)((name) => {
      setWeekDishes((prev) => {
        const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
        saveJSON(WEEK_KEY, { selected: next }).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const generateShopping = (0, import_react.useCallback)((includeStaples) => {
      const lines = generateShoppingItems(activeOrders, includeStaples);
      setShopping((prev) => {
        const checkedByText = new Map(prev.filter((it) => it.checked).map((it) => [it.text, true]));
        const manual = prev.filter((it) => !it.auto);
        const autos = lines.map((text) => ({
          id: uid(),
          text,
          checked: !!checkedByText.get(text),
          auto: true
        }));
        const next = [...autos, ...manual];
        saveJSON(SHOPPING_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, [activeOrders]);
    if (loading) {
      return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.page }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loadingText }, "Loading orders..."));
    }
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.page }, /* @__PURE__ */ import_react.default.createElement("header", { style: styles.header }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.headerTop }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.logoMark }, "LTB"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.headerCenter }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.title }, "Order tracker"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.subtitle }, "Lettuce, Turnip, The Beet \xB7 v8.7-GH")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.headerActions }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.headerActionBtn, onClick: exportData, title: "Copy backup to clipboard" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Download, { size: 16 })), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.headerActionBtn, onClick: pasteImport, title: "Paste backup from clipboard" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Upload, { size: 16 })))), exportMsg && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.exportMsg }, exportMsg), /* @__PURE__ */ import_react.default.createElement("nav", { style: styles.tabs }, [
      ["orders", "Orders"],
      ["cook", "Cook"],
      ["shop", "Shop"],
      ["money", "Money"],
      ["week", "Week"]
    ].map(([key, label]) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key,
        style: { ...styles.tab, ...view === key ? styles.tabActive : {} },
        onClick: () => setView(key)
      },
      label,
      key === "orders" && stats.active > 0 && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.tabBadge }, stats.active)
    )))), error && /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: styles.errorBanner,
        onClick: async () => {
          const res = await saveJSON(ORDERS_KEY, orders || []);
          setError(saveError(res));
          if (res.ok) {
            setExportMsg("Saved.");
            setTimeout(() => setExportMsg(null), 2500);
          }
        }
      },
      error,
      /* @__PURE__ */ import_react.default.createElement("span", { style: styles.errorRetry }, "Tap to retry saving")
    ), showImportModal && /* @__PURE__ */ import_react.default.createElement(ImportModal, { onSubmit: submitImport, onCancel: () => setShowImportModal(false) }), /* @__PURE__ */ import_react.default.createElement("main", { style: styles.main }, view === "orders" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(StatsBar, { stats }), !formMode && !showPaste && !showAmend && !showCsv && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.topActions }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.newOrderBtn, onClick: () => setFormMode("new") }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Plus, { size: 18 }), "New order"), /* @__PURE__ */ import_react.default.createElement("button", { style: { ...styles.pasteBtn, ...styles.disabledBtn }, onClick: () => {
    }, disabled: true, "aria-disabled": "true" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.ClipboardPaste, { size: 18 }), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.struckText }, "Paste a text")), /* @__PURE__ */ import_react.default.createElement("button", { style: { ...styles.amendBtn, ...styles.disabledBtn }, onClick: () => {
    }, disabled: true, "aria-disabled": "true" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Pencil, { size: 16 }), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.struckText }, "Amend via text")), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.csvBtn, onClick: () => setShowCsv(true) }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.FileText, { size: 16 }), "Import from sheet")), showPaste && /* @__PURE__ */ import_react.default.createElement(
      PasteOrderCard,
      {
        menu,
        onParsed: (draft) => {
          setShowPaste(false);
          setFormMode(draft);
        },
        onCancel: () => setShowPaste(false)
      }
    ), showAmend && /* @__PURE__ */ import_react.default.createElement(
      AmendOrderCard,
      {
        menu,
        orders: activeOrders,
        onAmended: (draft) => {
          setShowAmend(false);
          setFormMode(draft);
        },
        onCancel: () => setShowAmend(false)
      }
    ), showCsv && /* @__PURE__ */ import_react.default.createElement(
      CsvImportCard,
      {
        menu,
        onImport: importOrders,
        onCancel: () => setShowCsv(false)
      }
    ), formMode && /* @__PURE__ */ import_react.default.createElement(
      OrderForm,
      {
        menu,
        initial: formMode === "new" ? null : formMode,
        recentCustomers,
        onSave: saveOrder,
        onCancel: () => setFormMode(null)
      }
    ), activeOrders.length === 0 && !formMode && !showPaste && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyTitle }, "No active orders"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyBody }, 'Tap "New order" to build one, or "Import from sheet" to pull in orders from the Google Form.')), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderList }, activeOrders.map((order) => /* @__PURE__ */ import_react.default.createElement(
      OrderCard,
      {
        key: order.id,
        order,
        expanded: expandedOrder === order.id,
        onToggle: () => setExpandedOrder(expandedOrder === order.id ? null : order.id),
        onUpdate: (patch) => updateOrder(order.id, patch),
        onDelete: () => deleteOrder(order.id),
        onEdit: () => {
          setFormMode(order);
          setExpandedOrder(null);
        }
      }
    ))), deliveredOrders.length > 0 && /* @__PURE__ */ import_react.default.createElement("details", { style: styles.deliveredSection }, /* @__PURE__ */ import_react.default.createElement("summary", { style: styles.deliveredSummary }, "Delivered (", deliveredOrders.length, ")"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderList }, deliveredOrders.map((order) => /* @__PURE__ */ import_react.default.createElement(
      OrderCard,
      {
        key: order.id,
        order,
        expanded: expandedOrder === order.id,
        onToggle: () => setExpandedOrder(expandedOrder === order.id ? null : order.id),
        onUpdate: (patch) => updateOrder(order.id, patch),
        onDelete: () => deleteOrder(order.id),
        onEdit: () => {
          setFormMode(order);
          setExpandedOrder(null);
        }
      }
    ))), /* @__PURE__ */ import_react.default.createElement(ArchiveDeliveredButton, { count: deliveredOrders.length, onArchive: archiveDelivered }))), view === "cook" && /* @__PURE__ */ import_react.default.createElement(
      CookingList,
      {
        items: cookingList,
        orderCount: activeOrders.length,
        revenue: activeFinancials.revenue,
        checks: cookChecks,
        onToggle: toggleCheck,
        onReset: resetChecks
      }
    ), view === "shop" && /* @__PURE__ */ import_react.default.createElement(
      ShoppingList,
      {
        items: shopping,
        onChange: persistShopping,
        onGenerate: generateShopping,
        activeCount: activeOrders.length,
        estCost: activeFinancials.cost
      }
    ), view === "money" && /* @__PURE__ */ import_react.default.createElement(MoneyTab, { orders: orders || [], onUpdate: updateOrder }), view === "week" && /* @__PURE__ */ import_react.default.createElement(WeekTab, { selected: weekDishes, onToggle: toggleWeekDish })));
  }
  function WeekTab({ selected, onToggle }) {
    return /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genTitle }, "This week's dinner lineup"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genHint }, "Check the dishes you're offering. The order picker, text parser, and shopping list follow this instantly. Existing orders aren't affected. The customer-facing PDF still comes from Claude \u2014 just tell it your picks (or send it a screenshot of this screen)."), selected.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parseError }, "No dishes selected \u2014 the Dinner section will be empty on new orders.")), ALL_DINNERS.map((dish) => {
      const isOn = selected.includes(dish.name);
      const prices = dish.variants.map((v) => v.price);
      const lo = Math.min(...prices);
      const hi = Math.max(...prices);
      const priceLabel = lo === hi ? currency(lo) : `${currency(lo)}\u2013${currency(hi)}`;
      return /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          key: dish.name,
          style: { ...styles.cookItem, ...isOn ? {} : { opacity: 0.55 } },
          onClick: () => onToggle(dish.name)
        },
        /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.checkbox, ...isOn ? styles.checkboxChecked : {} } }, isOn && /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Check, { size: 14, color: "#1a1a1a" })),
        /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemText }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemName }, dish.name), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemVariant }, dish.variants.length, " option", dish.variants.length !== 1 ? "s" : "", " \xB7 ", priceLabel)),
        /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.cookItemQty, color: isOn ? "#5DCAA5" : "#5F5E5A", fontSize: "11px", fontWeight: 700 } }, isOn ? "ON" : "OFF")
      );
    }));
  }
  function StatsBar({ stats }) {
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statsBar }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statValue }, stats.active), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "Active")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statValue }, currency(stats.booked)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "This week")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.statValue, ...stats.unpaid > 0 ? { color: "#EF9F27" } : {} } }, currency(stats.unpaid)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "Unpaid")));
  }
  function QtyControl({ value, onChange, min = 0 }) {
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.qtyControl, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.qtyBtn, onClick: () => onChange(Math.max(min, value - 1)), "aria-label": "Decrease" }, "\u2212"), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.qtyValue }, value), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.qtyBtn, onClick: () => onChange(value + 1), "aria-label": "Increase" }, "+"));
  }
  function parseDelimited(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    const delim = text.includes("	") ? "	" : ",";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else inQuotes = false;
        } else field += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === delim) {
          row.push(field);
          field = "";
        } else if (ch === "\n") {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        } else if (ch === "\r") {
        } else field += ch;
      }
    }
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c.trim()));
  }
  function rowToOrderText(headerMap) {
    const parts = [];
    let customer = "";
    Object.entries(headerMap).forEach(([header, value]) => {
      const h = header.toLowerCase().trim();
      const v = String(value || "").trim();
      if (!v || v.toLowerCase() === "none") return;
      if (h.includes("timestamp")) return;
      if ((h === "name" || h.includes("your name")) && !customer) {
        customer = v;
        return;
      }
      parts.push(`${header}: ${v}`);
    });
    return { customer, text: parts.join("\n") };
  }
  function PasteOrderCard({ menu, onParsed, onCancel }) {
    const [text, setText] = (0, import_react.useState)("");
    const [imageFile, setImageFile] = (0, import_react.useState)(null);
    const [parsing, setParsing] = (0, import_react.useState)(false);
    const [parseError, setParseError] = (0, import_react.useState)(null);
    const canParse = !!text.trim() || !!imageFile;
    const onPickImage = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) setImageFile(file);
      e.target.value = "";
    };
    const parse = async () => {
      if (!canParse) return;
      setParsing(true);
      setParseError(null);
      let imageBase64 = null;
      if (imageFile) {
        try {
          imageBase64 = await fileToJpegBase64(imageFile);
        } catch (e) {
          setParseError("Couldn't read the photo file. If it's a photo from your camera roll (HEIC), try taking a screenshot of it and attaching that instead.");
          setParsing(false);
          return;
        }
      }
      try {
        const draft = await parseOrderText(text.trim(), imageBase64, menu);
        if (draft.items.length === 0 && !draft.notes) {
          setParseError("Couldn't find any menu items in that. Add the order manually?");
          setParsing(false);
          return;
        }
        onParsed(draft);
      } catch (e) {
        const msg = e && e.message || "";
        if (imageBase64 && msg.startsWith("Non-JSON response (HTTP 200)")) {
          setParseError("Claude's artifact platform doesn't support reading photos yet (text works fine). Type the circled items into the text box instead \u2014 the photo button will start working if Anthropic enables image support.");
        } else {
          const detail = msg ? ` (${msg})` : "";
          setParseError(`Couldn't process that${detail}. Try again, or add the order manually.`);
        }
        setParsing(false);
      }
    };
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formTitle }, "Paste a customer order"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 18 }))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pasteHint }, "Paste their text and I'll match it to the current menu and pre-fill the order \u2014 you just add their name and double-check. Items from an old menu get flagged in notes instead of guessed. (Photo reading is built in but waiting on platform support \u2014 text is the reliable path.)"), /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "90px" },
        placeholder: 'e.g. "Hey! Can I get a large mushroom noodles, 2 quesos (will return one jar), and a pineapple?"',
        value: text,
        onChange: (e) => setText(e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.attachRow }, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.attachBtn }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Image, { size: 15 }), imageFile ? "Change photo" : "Attach a photo", /* @__PURE__ */ import_react.default.createElement("input", { type: "file", accept: "image/*", onChange: onPickImage, style: { display: "none" } })), imageFile && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.attachChip }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.attachName }, imageFile.name || "photo"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: () => setImageFile(null), "aria-label": "Remove photo" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 14 })))), parseError && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parseError }, parseError), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!canParse || parsing ? styles.saveBtnDisabled : {} },
        onClick: parse,
        disabled: !canParse || parsing
      },
      parsing ? imageFile ? "Reading the photo..." : "Reading order..." : "Build the order"
    ));
  }
  function AmendOrderCard({ menu, orders, onAmended, onCancel }) {
    const [selectedId, setSelectedId] = (0, import_react.useState)(orders.length === 1 ? orders[0].id : "");
    const [text, setText] = (0, import_react.useState)("");
    const [parsing, setParsing] = (0, import_react.useState)(false);
    const [parseError, setParseError] = (0, import_react.useState)(null);
    const selectedOrder = orders.find((o) => o.id === selectedId) || null;
    const canParse = !!selectedOrder && !!text.trim();
    const parse = async () => {
      if (!canParse) return;
      setParsing(true);
      setParseError(null);
      try {
        const draft = await parseAmendment(selectedOrder, text.trim(), menu);
        if (draft.items.length === 0) {
          setParseError("That left the order with no items. If you meant to clear it, edit the order directly instead.");
          setParsing(false);
          return;
        }
        onAmended(draft);
      } catch (e) {
        const msg = e && e.message || "";
        const detail = msg ? ` (${msg})` : "";
        setParseError(`Couldn't process that change${detail}. Try again, or edit the order directly.`);
        setParsing(false);
      }
    };
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formTitle }, "Amend an order via text"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 18 }))), orders.length === 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pasteHint }, "No active orders to amend yet.") : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pasteHint }, "Pick the customer's order, paste their follow-up message, and I'll apply the change and open the updated order for you to review before saving."), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Which order?"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.amendOrderPicker }, orders.map((o) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: o.id,
        style: { ...styles.amendOrderChip, ...selectedId === o.id ? styles.amendOrderChipActive : {} },
        onClick: () => setSelectedId(o.id)
      },
      /* @__PURE__ */ import_react.default.createElement("span", { style: styles.amendChipName }, o.customer),
      /* @__PURE__ */ import_react.default.createElement("span", { style: styles.amendChipMeta }, (o.items || []).reduce((s, it) => s + it.qty, 0), " items \xB7 ", currency(o.total))
    ))), selectedOrder && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.amendCurrentBox }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.amendCurrentTitle }, "Current order:"), (selectedOrder.items || []).map((it, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: i, style: styles.amendCurrentItem }, it.qty, "\xD7 ", it.name, " ", /* @__PURE__ */ import_react.default.createElement("span", { style: styles.orderItemVariant }, "(", isPerLbItem(it.name) && it.weight > 0 ? `${it.weight} lb` : it.variant, ")")))), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Their follow-up message"), /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "80px" },
        placeholder: 'e.g. "Actually can you make the curry large, and add a dozen cookies?"',
        value: text,
        onChange: (e) => setText(e.target.value)
      }
    ), parseError && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parseError }, parseError), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!canParse || parsing ? styles.saveBtnDisabled : {} },
        onClick: parse,
        disabled: !canParse || parsing
      },
      parsing ? "Applying the change..." : "Apply change"
    )));
  }
  function CsvImportCard({ menu, onImport, onCancel }) {
    const [text, setText] = (0, import_react.useState)("");
    const [parsing, setParsing] = (0, import_react.useState)(false);
    const [progress, setProgress] = (0, import_react.useState)(null);
    const [results, setResults] = (0, import_react.useState)(null);
    const [parseError, setParseError] = (0, import_react.useState)(null);
    const run = async () => {
      setParseError(null);
      const rows = parseDelimited(text);
      if (rows.length < 2) {
        setParseError("Need a header row plus at least one order row. Copy the rows from your Sheet including the header.");
        return;
      }
      const headers = rows[0].map((h) => h.trim());
      const dataRows = rows.slice(1);
      setParsing(true);
      setProgress({ done: 0, total: dataRows.length });
      const out = [];
      for (let r = 0; r < dataRows.length; r++) {
        const cells = dataRows[r];
        const headerMap = {};
        headers.forEach((h, i) => {
          headerMap[h] = cells[i] || "";
        });
        const { customer, text: orderText } = rowToOrderText(headerMap);
        if (!orderText.trim()) {
          setProgress({ done: r + 1, total: dataRows.length });
          continue;
        }
        try {
          const parsed = await parseOrderText(orderText, null, menu);
          out.push({
            customer: customer || `Row ${r + 1}`,
            order: { ...parsed, customer: customer || `Row ${r + 1}` },
            error: null
          });
        } catch (e) {
          out.push({
            customer: customer || `Row ${r + 1}`,
            order: null,
            error: e && e.message || "parse failed"
          });
        }
        setProgress({ done: r + 1, total: dataRows.length });
      }
      setResults(out);
      setParsing(false);
    };
    const importAll = () => {
      const good = results.filter((r) => r.order && r.order.items.length > 0);
      onImport(good.map((r) => r.order));
    };
    const goodCount = results ? results.filter((r) => r.order && r.order.items.length > 0).length : 0;
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formTitle }, "Import from Google Sheet"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 18 }))), !results ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pasteHint }, "In your Google Sheet, select the order rows ", /* @__PURE__ */ import_react.default.createElement("strong", null, "including the header row"), ", copy, and paste below. Each row becomes an order you can review before saving."), /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "120px", fontSize: "12px" },
        placeholder: "Paste your copied spreadsheet rows here...",
        value: text,
        onChange: (e) => setText(e.target.value)
      }
    ), parseError && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parseError }, parseError), parsing && progress && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.csvProgress }, "Reading orders... ", progress.done, "/", progress.total), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!text.trim() || parsing ? styles.saveBtnDisabled : {} },
        onClick: run,
        disabled: !text.trim() || parsing
      },
      parsing ? "Reading..." : "Read orders"
    )) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pasteHint }, goodCount, " order", goodCount !== 1 ? "s" : "", " ready to import", results.length - goodCount > 0 ? `, ${results.length - goodCount} with issues` : "", "."), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.csvResultsList }, results.map((r, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: i, style: styles.csvResultRow }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.csvResultName }, r.customer), r.order && r.order.items.length > 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.csvResultItems }, r.order.items.map((it, j) => /* @__PURE__ */ import_react.default.createElement("span", { key: j, style: styles.csvResultItem }, it.qty, "\xD7 ", it.name, j < r.order.items.length - 1 ? "," : "")), r.order.reviewReasons && r.order.reviewReasons.length > 0 && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.csvResultFlag }, " \xB7 ", r.order.reviewReasons.length, " to review")) : /* @__PURE__ */ import_react.default.createElement("div", { style: styles.csvResultError }, r.error ? "Could not read this row" : "No items matched")))), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...goodCount === 0 ? styles.saveBtnDisabled : {} },
        onClick: importAll,
        disabled: goodCount === 0
      },
      "Import ",
      goodCount,
      " order",
      goodCount !== 1 ? "s" : ""
    ), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.csvBackBtn, onClick: () => {
      setResults(null);
      setText("");
    } }, "Start over")));
  }
  function ReviewModal({ reasons, items, onApplyNote, onApplyUpcharge, onApplyWeight, onAddCustomCharge, onResolve, onClose }) {
    const [idx, setIdx] = (0, import_react.useState)(0);
    const [resolved, setResolved] = (0, import_react.useState)({});
    const total = reasons.length;
    const allDone = Object.keys(resolved).length >= total;
    const matchItem = (reason2) => {
      const lower = reason2.toLowerCase();
      let best = -1;
      items.forEach((it, i) => {
        if (lower.includes(it.name.toLowerCase())) best = i;
      });
      return best;
    };
    const reason = reasons[idx];
    const itemIdx = reason ? matchItem(reason) : -1;
    const item = itemIdx >= 0 ? items[itemIdx] : null;
    const [noteInput, setNoteInput] = (0, import_react.useState)("");
    const [upLabel, setUpLabel] = (0, import_react.useState)("");
    const [upAmount, setUpAmount] = (0, import_react.useState)("");
    const [weightInput, setWeightInput] = (0, import_react.useState)("");
    const [chargeLabel, setChargeLabel] = (0, import_react.useState)("");
    const [chargeAmount, setChargeAmount] = (0, import_react.useState)("");
    (0, import_react.useEffect)(() => {
      setNoteInput(item?.note || "");
      setUpLabel(item?.upcharge?.label || "");
      setUpAmount(item?.upcharge?.amount ? String(item.upcharge.amount) : "");
      setWeightInput(item?.weight ? String(item.weight) : "");
      setChargeLabel("");
      setChargeAmount("");
    }, [idx]);
    const markResolved = () => {
      setResolved((prev) => ({ ...prev, [idx]: true }));
      onResolve(idx);
      const next = reasons.findIndex((_, i) => i !== idx && !resolved[i]);
      if (next >= 0) setIdx(next);
    };
    const isWeightReason = /weight/i.test(reason || "");
    const isUpchargeReason = /price for|upcharge/i.test(reason || "");
    const isMatchReason = /match|menu/i.test(reason || "");
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceOverlay, onClick: onClose }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalCard, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalTitle }, "Let's sort this out"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onClose, "aria-label": "Close" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 18 }))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewProgress }, Object.keys(resolved).length, " of ", total, " handled"), !allDone && reason && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewStep }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewReasonBox }, reason), item && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewItemContext }, "On: ", /* @__PURE__ */ import_react.default.createElement("strong", null, item.qty, "\xD7 ", item.name), " (", item.variant, ")"), isWeightReason && item && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewField }, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "How many pounds? (", currency(PER_LB_ITEMS[item.name]?.pricePerLb || 0), "/lb + $1.50 bag)"), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: styles.input,
        type: "number",
        inputMode: "decimal",
        placeholder: "e.g. 0.5",
        value: weightInput,
        onChange: (e) => setWeightInput(e.target.value),
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.doneItemBtn, marginTop: "8px", alignSelf: "flex-start", ...parseFloat(weightInput) > 0 ? {} : styles.saveBtnDisabled },
        disabled: !(parseFloat(weightInput) > 0),
        onClick: () => {
          onApplyWeight(itemIdx, weightInput);
          markResolved();
        }
      },
      "Set weight & price"
    )), isUpchargeReason && item && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewField }, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "What should this cost?"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.upchargeRow }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 2, marginTop: 0 },
        placeholder: "label",
        value: upLabel,
        onChange: (e) => setUpLabel(e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 1, marginTop: 0 },
        type: "number",
        inputMode: "decimal",
        placeholder: "$",
        value: upAmount,
        onChange: (e) => setUpAmount(e.target.value),
        autoFocus: true
      }
    )), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.doneItemBtn, marginTop: "8px", alignSelf: "flex-start", ...parseFloat(upAmount) > 0 ? {} : styles.saveBtnDisabled },
        disabled: !(parseFloat(upAmount) > 0),
        onClick: () => {
          onApplyUpcharge(itemIdx, upLabel || "Upcharge", upAmount);
          markResolved();
        }
      },
      "Set upcharge"
    )), !isWeightReason && !isUpchargeReason && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewField }, item && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Add a note to this item"), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: styles.input,
        placeholder: "e.g. chili oil on the side",
        value: noteInput,
        onChange: (e) => setNoteInput(e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.reviewActionBtn, ...noteInput.trim() ? {} : styles.saveBtnDisabled },
        disabled: !noteInput.trim(),
        onClick: () => {
          onApplyNote(itemIdx, noteInput.trim());
          markResolved();
        }
      },
      "Add note & resolve"
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewOr }, "or")), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Add a custom charge for this request"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.upchargeRow }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 2, marginTop: 0 },
        placeholder: "what for?",
        value: chargeLabel,
        onChange: (e) => setChargeLabel(e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 1, marginTop: 0 },
        type: "number",
        inputMode: "decimal",
        placeholder: "$",
        value: chargeAmount,
        onChange: (e) => setChargeAmount(e.target.value)
      }
    )), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.reviewActionBtn, ...chargeLabel.trim() && parseFloat(chargeAmount) > 0 ? {} : styles.saveBtnDisabled },
        disabled: !(chargeLabel.trim() && parseFloat(chargeAmount) > 0),
        onClick: () => {
          onAddCustomCharge(chargeLabel.trim(), parseFloat(chargeAmount));
          markResolved();
        }
      },
      "Add charge & resolve"
    )), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.reviewSkipBtn, onClick: markResolved }, "Nothing needed, mark handled"), total > 1 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewNav }, reasons.map((_, i) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: i,
        style: {
          ...styles.reviewDot,
          ...i === idx ? styles.reviewDotActive : {},
          ...resolved[i] ? styles.reviewDotDone : {}
        },
        onClick: () => setIdx(i),
        "aria-label": `Item ${i + 1}`
      }
    )))), allDone && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewDone }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Check, { size: 28, color: "#1D9E75" }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewDoneText }, "All sorted. You're good to save."), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.doneItemBtn, onClick: onClose }, "Back to order"))));
  }
  function OrderForm({ menu, initial, recentCustomers, onSave, onCancel }) {
    const isEdit = !!initial?.id;
    const [customer, setCustomer] = (0, import_react.useState)(initial?.customer || "");
    const [items, setItems] = (0, import_react.useState)(initial?.items || []);
    const [jarSwaps, setJarSwaps] = (0, import_react.useState)(initial?.jarSwaps || 0);
    const [containerReturns, setContainerReturns] = (0, import_react.useState)(initial?.containerReturns || 0);
    const [notes, setNotes] = (0, import_react.useState)(initial?.notes || "");
    const [discountType, setDiscountType] = (0, import_react.useState)(initial?.discountType || null);
    const [discountValue, setDiscountValue] = (0, import_react.useState)(initial?.discountValue ? String(initial.discountValue) : "");
    const [customCharges, setCustomCharges] = (0, import_react.useState)(initial?.customCharges || []);
    const [waiveSurcharge, setWaiveSurcharge] = (0, import_react.useState)(!!initial?.waiveSurcharge);
    const [pickerCategory, setPickerCategory] = (0, import_react.useState)(null);
    const [reviewReasons, setReviewReasons] = (0, import_react.useState)(initial?.reviewReasons || []);
    const [expandedItem, setExpandedItem] = (0, import_react.useState)(null);
    const [showReview, setShowReview] = (0, import_react.useState)(false);
    const discNum = parseFloat(discountValue) || 0;
    const itemsTotal = itemsBaseTotal(items);
    const disc = discountAmount(itemsTotal, discountType, discNum);
    const total = orderTotal(items, jarSwaps, containerReturns, discountType, discNum, customCharges, waiveSurcharge);
    const itemCount = items.reduce((s, it) => s + it.qty, 0);
    const findItemIndex = (category, name, variant) => items.findIndex((i) => i.category === category && i.name === name && i.variant === variant.label);
    const addItem = (category, name, variant) => {
      const base = { category, name, variant: variant.label, price: variant.price, cost: variant.cost, qty: 1, note: "", upcharge: null };
      if (isPerLbItem(name)) {
        base.weightPending = true;
        base.price = 0;
        base.cost = 0;
      }
      setItems((prev) => [...prev, base]);
    };
    const setQty = (idx, qty) => {
      setItems((prev) => {
        const next = [...prev];
        if (qty <= 0) next.splice(idx, 1);
        else next[idx] = { ...next[idx], qty };
        return next;
      });
    };
    const setItemNote = (idx, note) => {
      setItems((prev) => prev.map((it, i) => i === idx ? { ...it, note } : it));
    };
    const setItemUpcharge = (idx, label, amount) => {
      setItems((prev) => prev.map((it, i) => {
        if (i !== idx) return it;
        if (!label && !amount) return { ...it, upcharge: null };
        return { ...it, upcharge: { label: label || "Upcharge", amount: parseFloat(amount) || 0 } };
      }));
    };
    const setItemWeight = (idx, weightStr) => {
      setItems((prev) => prev.map((it, i) => {
        if (i !== idx) return it;
        const w = parseFloat(weightStr);
        const updated = { ...it, weight: w > 0 ? w : void 0 };
        return isPerLbItem(it.name) && w > 0 ? repricePerLbItem(updated) : updated;
      }));
    };
    const hasPerLbItems = items.some((it) => isPerLbItem(it.name));
    const repriceAllSousVide = () => {
      setItems((prev) => prev.map((it) => isPerLbItem(it.name) ? repricePerLbItem(it) : it));
    };
    const addCustomCharge = () => setCustomCharges((prev) => [...prev, { id: uid(), label: "", amount: "" }]);
    const updateCustomCharge = (id, field, val) => setCustomCharges((prev) => prev.map((ch) => ch.id === id ? { ...ch, [field]: val } : ch));
    const removeCustomCharge = (id) => setCustomCharges((prev) => prev.filter((ch) => ch.id !== id));
    const dismissReview = (i) => setReviewReasons((prev) => prev.filter((_, idx) => idx !== i));
    const save = () => {
      if (!customer.trim() || items.length === 0) return;
      const cleanCharges = customCharges.map((ch) => ({ id: ch.id, label: (ch.label || "").trim(), amount: parseFloat(ch.amount) || 0 })).filter((ch) => ch.label && ch.amount);
      onSave({
        id: initial?.id || uid(),
        customer: customer.trim(),
        items,
        jarSwaps,
        containerReturns,
        notes: notes.trim(),
        discountType: discNum > 0 ? discountType : null,
        discountValue: discNum > 0 ? discNum : 0,
        customCharges: cleanCharges,
        waiveSurcharge,
        total: orderTotal(items, jarSwaps, containerReturns, discountType, discNum, cleanCharges, waiveSurcharge),
        status: initial?.status || "Ordered",
        paid: initial?.paid || false,
        archived: initial?.archived || false,
        createdAt: initial?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      });
    };
    const showChips = !isEdit && !customer.trim() && recentCustomers.length > 0;
    const selectedByCategory = (0, import_react.useMemo)(() => {
      const counts = {};
      items.forEach((it) => {
        counts[it.category] = (counts[it.category] || 0) + it.qty;
      });
      return counts;
    }, [items]);
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formTitle }, isEdit ? `Edit order \u2014 ${initial.customer}` : "New order"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 18 }))), reviewReasons.length > 0 && /* @__PURE__ */ import_react.default.createElement("button", { style: styles.reviewOpenBtn, onClick: () => setShowReview(true) }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.AlertTriangle, { size: 16 }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewOpenText }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewOpenTitle }, reviewReasons.length, " thing", reviewReasons.length !== 1 ? "s" : "", " to sort out"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewOpenSub }, "Tap to work through them")), /* @__PURE__ */ import_react.default.createElement(import_lucide_react.ChevronDown, { size: 16, style: { transform: "rotate(-90deg)" } })), showReview && /* @__PURE__ */ import_react.default.createElement(
      ReviewModal,
      {
        reasons: reviewReasons,
        items,
        onApplyNote: setItemNote,
        onApplyUpcharge: setItemUpcharge,
        onApplyWeight: setItemWeight,
        onAddCustomCharge: (label, amount) => setCustomCharges((prev) => [...prev, { id: uid(), label, amount: String(amount) }]),
        onResolve: (i) => dismissReview(i),
        onClose: () => setShowReview(false)
      }
    ), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Customer"), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: styles.input,
        placeholder: "Who's this for?",
        value: customer,
        onChange: (e) => setCustomer(e.target.value),
        autoFocus: !isEdit && items.length > 0
      }
    ), showChips && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.chipRow }, recentCustomers.map((name) => /* @__PURE__ */ import_react.default.createElement("button", { key: name, style: styles.chip, onClick: () => setCustomer(name) }, name))), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Items"), itemCount > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.selectedSummary }, itemCount, " item", itemCount !== 1 ? "s" : "", " selected \xB7 ", currency(itemsTotal)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.categoryGrid }, Object.keys(menu).map((cat) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: cat,
        style: {
          ...styles.categoryBtn,
          ...pickerCategory === cat ? styles.categoryBtnActive : {}
        },
        onClick: () => setPickerCategory(pickerCategory === cat ? null : cat)
      },
      CATEGORY_LABELS[cat],
      selectedByCategory[cat] > 0 && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.catCount }, selectedByCategory[cat]),
      pickerCategory === cat ? /* @__PURE__ */ import_react.default.createElement(import_lucide_react.ChevronUp, { size: 16 }) : /* @__PURE__ */ import_react.default.createElement(import_lucide_react.ChevronDown, { size: 16 })
    ))), pickerCategory && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.picker }, menu[pickerCategory].map((menuItem) => /* @__PURE__ */ import_react.default.createElement("div", { key: menuItem.name, style: styles.pickerGroup }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pickerGroupName }, menuItem.name), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pickerVariants }, menuItem.variants.map((variant) => {
      const idx = findItemIndex(pickerCategory, menuItem.name, variant);
      const selected = idx >= 0;
      return /* @__PURE__ */ import_react.default.createElement(
        "div",
        {
          key: variant.label,
          style: { ...styles.variantBtn, ...selected ? styles.variantBtnSelected : {} },
          onClick: () => !selected && addItem(pickerCategory, menuItem.name, variant),
          role: "button",
          tabIndex: 0
        },
        /* @__PURE__ */ import_react.default.createElement("span", { style: styles.variantLabel }, variant.label),
        selected ? /* @__PURE__ */ import_react.default.createElement(QtyControl, { value: items[idx].qty, onChange: (q) => setQty(idx, q) }) : /* @__PURE__ */ import_react.default.createElement("span", { style: styles.variantPrice }, currency(variant.price))
      );
    }))))), items.length > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewList }, items.map((it, idx) => {
      const open = expandedItem === idx;
      const hasExtra = it.note || it.upcharge;
      return /* @__PURE__ */ import_react.default.createElement("div", { key: `${it.category}-${it.name}-${it.variant}-${idx}`, style: styles.reviewItemCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewRow }, /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          style: styles.reviewItemMain,
          onClick: () => setExpandedItem(open ? null : idx)
        },
        /* @__PURE__ */ import_react.default.createElement("span", { style: styles.reviewText }, it.qty, "\xD7 ", it.name, " ", /* @__PURE__ */ import_react.default.createElement("span", { style: styles.orderItemVariant }, "(", it.variant, ")")),
        hasExtra && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.itemExtraDot })
      ), /* @__PURE__ */ import_react.default.createElement(QtyControl, { value: it.qty, onChange: (q) => setQty(idx, q) })), !open && isPerLbItem(it.name) && (it.weight > 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemUpchargePreview }, it.weight, " lb \xB7 ", currency(it.price)) : /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemUpchargeNeedsPrice }, "set weight \u2304")), !open && it.note && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemNotePreview }, "\u201C", it.note, "\u201D"), !open && it.upcharge && it.upcharge.amount > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemUpchargePreview }, "+ ", it.upcharge.label, " (", currency(it.upcharge.amount), ")"), !open && it.upcharge && !it.upcharge.amount && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemUpchargeNeedsPrice }, "+ ", it.upcharge.label, " \u2014 set a price \u2304"), open && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemEditor }, isPerLbItem(it.name) && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightDeferNote }, "Priced by weight (", currency(PER_LB_ITEMS[it.name].pricePerLb), "/lb + $1.50 bag). Set the actual weight from the order after you've weighed it."), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Note for this item"), /* @__PURE__ */ import_react.default.createElement(
        "input",
        {
          style: styles.input,
          placeholder: "e.g. chili oil on the side",
          value: it.note || "",
          onChange: (e) => setItemNote(idx, e.target.value)
        }
      ), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Upcharge (optional)"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.upchargeRow }, /* @__PURE__ */ import_react.default.createElement(
        "input",
        {
          style: { ...styles.input, flex: 2, marginTop: 0 },
          placeholder: "label, e.g. extra protein",
          value: it.upcharge?.label || "",
          onChange: (e) => setItemUpcharge(idx, e.target.value, it.upcharge?.amount || "")
        }
      ), /* @__PURE__ */ import_react.default.createElement(
        "input",
        {
          style: { ...styles.input, flex: 1, marginTop: 0 },
          type: "number",
          inputMode: "decimal",
          placeholder: "$",
          value: it.upcharge?.amount || "",
          onChange: (e) => setItemUpcharge(idx, it.upcharge?.label || "Upcharge", e.target.value)
        }
      )), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemEditorActions }, hasExtra && /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          style: styles.clearItemExtra,
          onClick: () => {
            setItemNote(idx, "");
            setItemUpcharge(idx, "", "");
          }
        },
        "Clear"
      ), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.doneItemBtn, onClick: () => setExpandedItem(null) }, "Done"))));
    })), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopRow }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopField }, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Jar swaps"), /* @__PURE__ */ import_react.default.createElement(QtyControl, { value: jarSwaps, onChange: setJarSwaps }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopHint }, "\u2212$2.00 each")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopField }, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Containers returned"), /* @__PURE__ */ import_react.default.createElement(QtyControl, { value: containerReturns, onChange: setContainerReturns }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopHint }, "\u2212$1.00 each"))), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Discount"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.discountRow }, [
      [null, "None"],
      ["percent", "%"],
      ["dollar", "$"]
    ].map(([type, label]) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: label,
        style: {
          ...styles.discountTypeBtn,
          ...discountType === type ? styles.discountTypeBtnActive : {}
        },
        onClick: () => setDiscountType(type)
      },
      label
    )), discountType && /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 1, marginTop: 0 },
        type: "number",
        inputMode: "decimal",
        min: "0",
        placeholder: discountType === "percent" ? "e.g. 10" : "e.g. 5.00",
        value: discountValue,
        onChange: (e) => setDiscountValue(e.target.value)
      }
    )), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Custom charges"), customCharges.length > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.customChargeList }, customCharges.map((ch) => /* @__PURE__ */ import_react.default.createElement("div", { key: ch.id, style: styles.customChargeRow }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 2, marginTop: 0 },
        placeholder: "what for? e.g. special request",
        value: ch.label,
        onChange: (e) => updateCustomCharge(ch.id, "label", e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 1, marginTop: 0 },
        type: "number",
        inputMode: "decimal",
        placeholder: "$",
        value: ch.amount,
        onChange: (e) => updateCustomCharge(ch.id, "amount", e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: () => removeCustomCharge(ch.id), "aria-label": "Remove charge" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 16 }))))), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.addChargeBtn, onClick: addCustomCharge }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Plus, { size: 15 }), " Add a custom charge"), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Notes"), /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: styles.textarea,
        placeholder: "Anything that isn't tied to one item (delivery time, general message)...",
        value: notes,
        onChange: (e) => setNotes(e.target.value)
      }
    ), itemsUpchargeTotal(items) > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.extraLine }, /* @__PURE__ */ import_react.default.createElement("span", null, "Item upcharges"), /* @__PURE__ */ import_react.default.createElement("span", null, "+", currency(itemsUpchargeTotal(items)))), disc > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.discountLine }, /* @__PURE__ */ import_react.default.createElement("span", null, "Discount", discountType === "percent" ? ` (${discNum}%)` : ""), /* @__PURE__ */ import_react.default.createElement("span", null, "\u2212", currency(disc))), customChargesTotal(customCharges) > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.extraLine }, /* @__PURE__ */ import_react.default.createElement("span", null, "Custom charges"), /* @__PURE__ */ import_react.default.createElement("span", null, "+", currency(customChargesTotal(customCharges)))), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: styles.waiveSurchargeRow,
        onClick: () => setWaiveSurcharge((v) => !v)
      },
      /* @__PURE__ */ import_react.default.createElement("span", { style: styles.waiveSurchargeLabel }, /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.waiveCheckbox, ...waiveSurcharge ? styles.waiveCheckboxOn : {} } }, waiveSurcharge && /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Check, { size: 12 })), "Waive the $2 surcharge"),
      /* @__PURE__ */ import_react.default.createElement("span", { style: styles.waiveSurchargeHint }, waiveSurcharge ? "waived" : "applied")
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.totalRow }, /* @__PURE__ */ import_react.default.createElement("span", null, "Total ", waiveSurcharge ? "(surcharge waived)" : "(incl. $2 surcharge)"), /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.totalValue, ...total < 0 ? { color: "#E8799A" } : {} } }, currency(total))), total < 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.negativeTotalNote }, "This order is below zero, so you'll be covering ", currency(Math.abs(total)), " out of pocket. Saved as-is."), hasPerLbItems && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightDeferNote }, "Sous vide proteins are priced by weight \u2014 save the order, then set each weight from the order card once you've weighed them."), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!customer.trim() || items.length === 0 ? styles.saveBtnDisabled : {} },
        onClick: save,
        disabled: !customer.trim() || items.length === 0
      },
      isEdit ? "Save changes" : "Save order"
    ));
  }
  function InvoiceModal({ order, onClose }) {
    const disc = discountAmount(itemsBaseTotal(order.items), order.discountType, order.discountValue);
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString(void 0, { month: "long", day: "numeric", year: "numeric" }) : "";
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceOverlay, onClick: onClose }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceScroll, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceLogo }, "LTB"), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceBrand }, "Lettuce, Turnip, The Beet"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTagline }, "meal prep, delivered fresh"))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceMeta }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.invoiceCustomer }, order.customer), dateStr && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.invoiceDate }, dateStr)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceDivider }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceItems }, (order.items || []).map((it, idx) => {
      const up = it.upcharge && it.upcharge.amount ? it.upcharge.amount : 0;
      const lineTotal = (it.price + up) * it.qty;
      return /* @__PURE__ */ import_react.default.createElement("div", { key: idx, style: styles.invoiceItemBlock }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceItemLine }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.invoiceItemName }, it.qty, "\xD7 ", it.name), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.invoiceItemPrice }, currency(lineTotal))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceItemVariant }, isPerLbItem(it.name) && it.weight ? `${it.weight} lb` : it.variant), it.upcharge && it.upcharge.amount > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceItemExtra }, "+ ", it.upcharge.label, " (", currency(it.upcharge.amount), " ea)"), it.note && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceItemNote }, "\u201C", it.note, "\u201D"));
    })), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceDivider }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTotals }, disc > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTotalRow }, /* @__PURE__ */ import_react.default.createElement("span", { style: { color: "#C0517A" } }, "Discount", order.discountType === "percent" ? ` (${order.discountValue}%)` : ""), /* @__PURE__ */ import_react.default.createElement("span", { style: { color: "#C0517A" } }, "\u2212", currency(disc))), (order.customCharges || []).map((ch) => /* @__PURE__ */ import_react.default.createElement("div", { key: ch.id, style: styles.invoiceTotalRow }, /* @__PURE__ */ import_react.default.createElement("span", null, ch.label), /* @__PURE__ */ import_react.default.createElement("span", null, currency(Number(ch.amount) || 0)))), !order.waiveSurcharge && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTotalRow }, /* @__PURE__ */ import_react.default.createElement("span", null, "Order surcharge"), /* @__PURE__ */ import_react.default.createElement("span", null, currency(SURCHARGE))), order.jarSwaps > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTotalRow }, /* @__PURE__ */ import_react.default.createElement("span", null, "Jar swap x", order.jarSwaps), /* @__PURE__ */ import_react.default.createElement("span", null, "\u2212", currency(order.jarSwaps * 2))), order.containerReturns > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTotalRow }, /* @__PURE__ */ import_react.default.createElement("span", null, "Containers returned x", order.containerReturns), /* @__PURE__ */ import_react.default.createElement("span", null, "\u2212", currency(order.containerReturns)))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceGrandTotal }, /* @__PURE__ */ import_react.default.createElement("span", null, "Total"), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.invoiceGrandValue }, currency(order.total))), order.notes && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceNotes }, order.notes), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceFooter }, "All prices all-in. Thanks for the order!")), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.invoiceClose, onClick: onClose }, "Done"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceHint }, "Screenshot the card above to send it.")));
  }
  function WeightPhotoModal({ orderId, itemIdx, item, stepLabel, onApply, onClose }) {
    const [weight, setWeight] = (0, import_react.useState)(item.weight > 0 ? String(item.weight) : "");
    const [photoBase64, setPhotoBase64] = (0, import_react.useState)(null);
    const [existingPhoto, setExistingPhoto] = (0, import_react.useState)(null);
    const [busy, setBusy] = (0, import_react.useState)(false);
    const [err, setErr] = (0, import_react.useState)("");
    (0, import_react.useEffect)(() => {
      let live = true;
      if (item.hasPhoto) {
        loadPhoto(orderId, itemIdx).then((d) => {
          if (live && d) setExistingPhoto(d);
        });
      }
      return () => {
        live = false;
      };
    }, [orderId, itemIdx]);
    const info = PER_LB_ITEMS[item.name] || { pricePerLb: 0, costPerLb: 0 };
    const w = parseFloat(weight);
    const livePrice = w > 0 ? round2(info.pricePerLb * w + 1.5) : null;
    const onPickPhoto = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      setErr("");
      setBusy(true);
      try {
        const b64 = await fileToJpegBase64(file, 900, 0.6);
        setPhotoBase64(b64);
      } catch (e2) {
        setErr("Could not read that image. Try another.");
      } finally {
        setBusy(false);
      }
    };
    const submit = async () => {
      if (!(w > 0)) return;
      setBusy(true);
      await onApply(itemIdx, Math.round(w * 100) / 100, photoBase64);
      setBusy(false);
      if (!stepLabel) onClose();
    };
    const shownPhoto = photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : existingPhoto ? `data:image/jpeg;base64,${existingPhoto}` : null;
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceOverlay, onClick: onClose }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightModalCard, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalHeader }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalTitle }, item.name), stepLabel && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightStepLabel }, stepLabel)), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onClose, "aria-label": "Close" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 18 }))), item.note && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightIntentNote }, "Customer asked: ", item.note), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Actual weight (lb) \u2014 ", currency(info.pricePerLb), "/lb + $1.50 bag"), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: styles.input,
        type: "number",
        inputMode: "decimal",
        placeholder: "e.g. 0.5",
        value: weight,
        onChange: (e) => setWeight(e.target.value),
        autoFocus: true
      }
    ), livePrice !== null && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightPriceHint }, "= ", currency(livePrice), " each"), /* @__PURE__ */ import_react.default.createElement("label", { style: { ...styles.miniLabel, marginTop: "14px" } }, "Proof photo (optional) \u2014 item on the scale"), shownPhoto ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.photoPreviewWrap }, /* @__PURE__ */ import_react.default.createElement("img", { src: shownPhoto, alt: "scale", style: styles.photoPreview }), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.photoRemoveBtn, onClick: () => {
      setPhotoBase64(null);
      setExistingPhoto(null);
    } }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 13 }), " Remove")) : /* @__PURE__ */ import_react.default.createElement("label", { style: styles.photoUploadBtn }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Image, { size: 15 }), busy ? "Working\u2026" : "Add scale photo", /* @__PURE__ */ import_react.default.createElement("input", { type: "file", accept: "image/*", onChange: onPickPhoto, style: { display: "none" } })), err && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parseError }, err), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightModalHint }, "Photos are compressed, saved to this order, and auto-deleted after a month."), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, marginTop: "14px", ...w > 0 && !busy ? {} : styles.saveBtnDisabled },
        onClick: submit,
        disabled: !(w > 0) || busy
      },
      stepLabel ? "Save & next" : "Save weight"
    )));
  }
  function OrderCard({ order, expanded, onToggle, onUpdate, onDelete, onEdit }) {
    const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
    const [copied, setCopied] = (0, import_react.useState)(false);
    const [editingNotes, setEditingNotes] = (0, import_react.useState)(false);
    const [notesDraft, setNotesDraft] = (0, import_react.useState)("");
    const [showInvoice, setShowInvoice] = (0, import_react.useState)(false);
    const [weightFlow, setWeightFlow] = (0, import_react.useState)(null);
    const perLbIdxs = (order.items || []).map((it, i) => isPerLbItem(it.name) ? i : -1).filter((i) => i >= 0);
    const anyPending = perLbIdxs.some((i) => order.items[i].weightPending || !(order.items[i].weight > 0));
    const applyWeight = async (itemIdx, weight, photoBase64) => {
      const items = order.items.map((it, i) => {
        if (i !== itemIdx) return it;
        const updated = repricePerLbItem({ ...it, weight });
        if (photoBase64) updated.hasPhoto = true;
        return updated;
      });
      const patch = {
        items,
        total: orderTotal(items, order.jarSwaps, order.containerReturns, order.discountType, order.discountValue, order.customCharges, order.waiveSurcharge)
      };
      onUpdate(patch);
      if (photoBase64) await savePhoto(order.id, itemIdx, photoBase64);
      setWeightFlow((prev) => {
        if (!prev || prev.mode !== "walk") return null;
        const nextPos = prev.pos + 1;
        return nextPos < prev.queue.length ? { ...prev, pos: nextPos } : null;
      });
    };
    const itemsTotal = (order.items || []).reduce((s, it) => s + it.price * it.qty, 0);
    const disc = discountAmount(itemsTotal, order.discountType, order.discountValue);
    const cycleStatus = (e) => {
      e.stopPropagation();
      const idx = STATUSES.indexOf(order.status);
      onUpdate({ status: STATUSES[(idx + 1) % STATUSES.length] });
    };
    const togglePaid = (e) => {
      e.stopPropagation();
      onUpdate({ paid: !order.paid });
    };
    const doCopy = async () => {
      const ok = await copyText(orderToText(order));
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    };
    const startNotes = () => {
      setNotesDraft(order.notes || "");
      setEditingNotes(true);
    };
    const saveNotes = () => {
      onUpdate({ notes: notesDraft.trim() });
      setEditingNotes(false);
    };
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCardHeader, onClick: onToggle, role: "button", tabIndex: 0 }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCardLeft }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCustomer }, order.customer), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderMeta }, (order.items || []).reduce((s, it) => s + it.qty, 0), " item", (order.items || []).reduce((s, it) => s + it.qty, 0) !== 1 ? "s" : "", " ", "\xB7 ", currency(order.total), disc > 0 ? " \xB7 disc" : "", order.createdAt ? ` \xB7 ${formatDate(order.createdAt)}` : "")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCardRight }, /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: {
          ...styles.paidPill,
          ...order.paid ? { background: "#1D9E7522", color: "#1D9E75" } : { background: "#EF9F2722", color: "#EF9F27" }
        },
        onClick: togglePaid
      },
      order.paid ? "Paid" : "Unpaid"
    ), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.statusPill, background: `${STATUS_COLORS[order.status]}22`, color: STATUS_COLORS[order.status] },
        onClick: cycleStatus
      },
      order.status
    ), expanded ? /* @__PURE__ */ import_react.default.createElement(import_lucide_react.ChevronUp, { size: 18 }) : /* @__PURE__ */ import_react.default.createElement(import_lucide_react.ChevronDown, { size: 18 }))), expanded && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCardBody }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderItemsList }, (order.items || []).map((it, idx) => {
      const perLb = isPerLbItem(it.name);
      const pending = perLb && (it.weightPending || !(it.weight > 0));
      const up = it.upcharge && it.upcharge.amount ? it.upcharge.amount : 0;
      const lineTotal = (it.price + up) * it.qty;
      return /* @__PURE__ */ import_react.default.createElement("div", { key: idx, style: styles.orderItemBlock }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderItemLine }, /* @__PURE__ */ import_react.default.createElement("span", null, it.qty, "\xD7 ", it.name, " ", /* @__PURE__ */ import_react.default.createElement("span", { style: styles.orderItemVariant }, "(", perLb && it.weight > 0 ? `${it.weight} lb` : it.variant, ")")), /* @__PURE__ */ import_react.default.createElement("span", null, pending ? /* @__PURE__ */ import_react.default.createElement("span", { style: styles.pendingPrice }, "weigh after shopping") : currency(lineTotal))), it.upcharge && it.upcharge.amount > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderItemSub }, "+ ", it.upcharge.label, " (", currency(it.upcharge.amount), " ea)"), it.note && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderItemNote }, "\u201C", it.note, "\u201D"), perLb && /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          style: styles.setWeightBtn,
          onClick: () => setWeightFlow({ mode: "single", queue: [idx], pos: 0 })
        },
        /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Scale, { size: 12 }),
        " ",
        it.weight > 0 ? "Update weight" : "Set weight",
        it.hasPhoto ? " \xB7 \u{1F4F7}" : ""
      ));
    }), disc > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.orderItemLine, color: "#E8799A" } }, /* @__PURE__ */ import_react.default.createElement("span", null, "Discount", order.discountType === "percent" ? ` (${order.discountValue}%)` : ""), /* @__PURE__ */ import_react.default.createElement("span", null, "\u2212", currency(disc))), (order.customCharges || []).map((ch) => /* @__PURE__ */ import_react.default.createElement("div", { key: ch.id, style: styles.orderItemLine }, /* @__PURE__ */ import_react.default.createElement("span", null, ch.label), /* @__PURE__ */ import_react.default.createElement("span", null, currency(Number(ch.amount) || 0))))), (order.jarSwaps > 0 || order.containerReturns > 0) && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopSummary }, order.jarSwaps > 0 && /* @__PURE__ */ import_react.default.createElement("span", null, order.jarSwaps, " jar swap", order.jarSwaps > 1 ? "s" : "", " (\u2212", currency(order.jarSwaps * 2), ")"), order.containerReturns > 0 && /* @__PURE__ */ import_react.default.createElement("span", null, order.containerReturns, " container", order.containerReturns > 1 ? "s" : "", " returned (\u2212", currency(order.containerReturns * 1), ")")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.notesBlock }, editingNotes ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "50px" },
        value: notesDraft,
        onChange: (e) => setNotesDraft(e.target.value),
        placeholder: "Add a note for this order...",
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.notesEditActions }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmYesGreen, onClick: saveNotes }, "Save note"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmNo, onClick: () => setEditingNotes(false) }, "Cancel"))) : order.notes ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderNotes, onClick: startNotes, role: "button", tabIndex: 0 }, order.notes, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.notesEditHint }, " \u2014 tap to edit")) : /* @__PURE__ */ import_react.default.createElement("button", { style: styles.addNoteBtn, onClick: startNotes }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Pencil, { size: 13 }), "Add note")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCardFooter }, perLbIdxs.length > 1 && /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: styles.updateAllWeightsBtn,
        onClick: () => setWeightFlow({ mode: "walk", queue: perLbIdxs, pos: 0 })
      },
      /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Scale, { size: 14 }),
      anyPending ? "Set sous vide weights" : "Update sous vide weights",
      " (",
      perLbIdxs.length,
      ")"
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statusRow }, STATUSES.map((s) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: s,
        style: {
          ...styles.statusOption,
          ...order.status === s ? { background: STATUS_COLORS[s], color: "#1a1a1a", borderColor: STATUS_COLORS[s] } : {}
        },
        onClick: () => onUpdate({ status: s })
      },
      s
    ))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.actionRow }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.actionBtn, onClick: onEdit }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Pencil, { size: 14 }), "Edit"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.actionBtn, onClick: doCopy }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Copy, { size: 14 }), copied ? "Copied!" : "Copy text"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.actionBtn, onClick: () => setShowInvoice(true) }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.FileText, { size: 14 }), "Invoice"), confirmDelete ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.confirmRow }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmYes, onClick: onDelete }, "Delete"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmNo, onClick: () => setConfirmDelete(false) }, "Cancel")) : /* @__PURE__ */ import_react.default.createElement("button", { style: { ...styles.actionBtn, color: "#993556" }, onClick: () => setConfirmDelete(true) }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Trash2, { size: 14 }), "Remove")))), showInvoice && /* @__PURE__ */ import_react.default.createElement(InvoiceModal, { order, onClose: () => setShowInvoice(false) }), weightFlow && (() => {
      const itemIdx = weightFlow.queue[weightFlow.pos];
      const it = order.items[itemIdx];
      if (!it) return null;
      return /* @__PURE__ */ import_react.default.createElement(
        WeightPhotoModal,
        {
          orderId: order.id,
          itemIdx,
          item: it,
          stepLabel: weightFlow.mode === "walk" ? `${weightFlow.pos + 1} of ${weightFlow.queue.length}` : null,
          onApply: applyWeight,
          onClose: () => setWeightFlow(null)
        }
      );
    })());
  }
  function ArchiveDeliveredButton({ count, onArchive }) {
    const [confirm, setConfirm] = (0, import_react.useState)(false);
    if (confirm) {
      return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.clearConfirmRow }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.confirmText }, "Archive all ", count, " delivered order", count !== 1 ? "s" : "", "? They stay in the Money tab."), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmYesGreen, onClick: () => {
        onArchive();
        setConfirm(false);
      } }, "Archive"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmNo, onClick: () => setConfirm(false) }, "Cancel"));
    }
    return /* @__PURE__ */ import_react.default.createElement("button", { style: styles.clearDeliveredBtn, onClick: () => setConfirm(true) }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Archive, { size: 14 }), "Archive all delivered (start a new week)");
  }
  function CookingList({ items, orderCount, revenue, checks, onToggle, onReset }) {
    if (items.length === 0) {
      return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyTitle }, "Nothing to cook yet"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyBody }, "Active orders will roll up into a cooking list here."));
    }
    const grouped = {};
    items.forEach((it) => {
      if (!grouped[it.category]) grouped[it.category] = [];
      grouped[it.category].push(it);
    });
    const doneCount = items.filter((it) => checks[it.key]).length;
    return /* @__PURE__ */ import_react.default.createElement("div", null, revenue > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookRevenueBar }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.cookRevenueLabel }, "In active orders"), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.cookRevenueValue }, currency(revenue))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookSummary }, doneCount, "/", items.length, " done \xB7 from ", orderCount, " active order", orderCount !== 1 ? "s" : ""), doneCount > 0 && /* @__PURE__ */ import_react.default.createElement("button", { style: styles.resetBtn, onClick: onReset }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.RotateCcw, { size: 13 }), "Reset")), Object.entries(grouped).map(([cat, catItems]) => /* @__PURE__ */ import_react.default.createElement("div", { key: cat, style: styles.cookCategory }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookCategoryTitle }, CATEGORY_LABELS[cat]), catItems.map((it) => {
      const isChecked = !!checks[it.key];
      return /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          key: it.key,
          style: { ...styles.cookItem, ...isChecked ? styles.cookItemChecked : {} },
          onClick: () => onToggle(it.key)
        },
        /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.checkbox, ...isChecked ? styles.checkboxChecked : {} } }, isChecked && /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Check, { size: 14, color: "#1a1a1a" })),
        /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemText }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemName }, it.name), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemVariant }, it.variant)),
        /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemQty }, "\xD7", it.qty)
      );
    }))));
  }
  function ShoppingList({ items, onChange, onGenerate, activeCount, estCost }) {
    const [input, setInput] = (0, import_react.useState)("");
    const [includeStaples, setIncludeStaples] = (0, import_react.useState)(false);
    const [confirmClear, setConfirmClear] = (0, import_react.useState)(false);
    const addItems = () => {
      const lines = input.split("\n").map((l) => l.replace(/^[\s•*\-–—]+|^\d+[.)]\s*/g, "").trim()).filter(Boolean);
      if (lines.length === 0) return;
      const additions = lines.map((text) => ({ id: uid(), text, checked: false }));
      onChange([...items, ...additions]);
      setInput("");
    };
    const toggle = (id) => {
      onChange(items.map((it) => it.id === id ? { ...it, checked: !it.checked } : it));
    };
    const remove = (id) => {
      onChange(items.filter((it) => it.id !== id));
    };
    const uncheckAll = () => {
      onChange(items.map((it) => ({ ...it, checked: false })));
    };
    const doneCount = items.filter((it) => it.checked).length;
    return /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genTitle }, "Build list from this week's orders"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genHint }, "Reads every active order and adds up the ingredients per recipe. Re-tap any time orders change \u2014 your manual items and checkmarks stay put."), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.genToggleRow }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        type: "checkbox",
        checked: includeStaples,
        onChange: (e) => setIncludeStaples(e.target.checked),
        style: styles.genCheckbox
      }
    ), "Include pantry staples (soy, spices, oils, etc.)"), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, marginTop: "8px", ...activeCount === 0 ? styles.saveBtnDisabled : {} },
        onClick: () => onGenerate(includeStaples),
        disabled: activeCount === 0
      },
      activeCount === 0 ? "No active orders yet" : `Generate from ${activeCount} active order${activeCount !== 1 ? "s" : ""}`
    )), estCost > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.shopCostBar }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.shopCostLabel }, "Est. ingredient spend for active orders"), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.shopCostValue }, "~", currency(estCost))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.shopInputRow }, /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "44px", flex: 1 },
        placeholder: "Add an item \u2014 or paste a whole list, one item per line",
        value: input,
        onChange: (e) => setInput(e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.shopAddBtn, ...!input.trim() ? styles.saveBtnDisabled : {} },
        onClick: addItems,
        disabled: !input.trim()
      },
      /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Plus, { size: 18 })
    )), items.length === 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyTitle }, "Shopping list is empty"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyBody }, "Type items one at a time, or paste a whole ingredient list and each line becomes its own entry.")) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookSummary }, doneCount, "/", items.length, " in the cart"), doneCount > 0 && /* @__PURE__ */ import_react.default.createElement("button", { style: styles.resetBtn, onClick: uncheckAll }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.RotateCcw, { size: 13 }), "Uncheck all")), /* @__PURE__ */ import_react.default.createElement("div", null, items.map((it) => /* @__PURE__ */ import_react.default.createElement("div", { key: it.id, style: { ...styles.shopItem, ...it.checked ? styles.cookItemChecked : {} } }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.shopItemMain, onClick: () => toggle(it.id) }, /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.checkbox, ...it.checked ? styles.checkboxChecked : {} } }, it.checked && /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Check, { size: 14, color: "#1a1a1a" })), /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.shopItemText, ...it.checked ? styles.shopItemTextChecked : {} } }, it.text)), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.shopDeleteBtn, onClick: () => remove(it.id), "aria-label": `Remove ${it.text}` }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 15 }))))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.shopBulkRow }, doneCount > 0 && /* @__PURE__ */ import_react.default.createElement("button", { style: styles.resetBtn, onClick: () => onChange(items.filter((it) => !it.checked)) }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Trash2, { size: 13 }), "Remove checked (", doneCount, ")"), confirmClear ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.confirmRow }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.confirmText }, "Delete the whole list?"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmYes, onClick: () => {
      onChange([]);
      setConfirmClear(false);
    } }, "Clear"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmNo, onClick: () => setConfirmClear(false) }, "Cancel")) : /* @__PURE__ */ import_react.default.createElement("button", { style: { ...styles.resetBtn, color: "#993556" }, onClick: () => setConfirmClear(true) }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Trash2, { size: 13 }), "Clear list"))));
  }
  function ProfitChart({ series }) {
    const W = 320, H = 160;
    const padL = 8, padR = 8, padT = 14, padB = 26;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const profits = series.map((s) => s.profit);
    const maxP = Math.max(...profits, 0);
    const minP = Math.min(...profits, 0);
    const range = maxP - minP || 1;
    const yFor = (p) => padT + plotH - (p - minP) / range * plotH;
    const zeroY = yFor(0);
    const n = series.length;
    const slotW = plotW / n;
    const barW = Math.min(slotW * 0.6, 34);
    const labelStep = Math.ceil(n / 6);
    const linePts = series.map((s, i) => {
      const cx = padL + slotW * i + slotW / 2;
      return `${cx},${yFor(s.profit)}`;
    }).join(" ");
    const totalProfit = round2(series.reduce((sum, s) => sum + s.profit, 0));
    const avgProfit = round2(totalProfit / n);
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.chartCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.chartHeader }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.chartTitle }, "Profit over time"), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.chartSubtitle }, "avg ", currency(avgProfit), "/period")), /* @__PURE__ */ import_react.default.createElement("svg", { viewBox: `0 0 ${W} ${H}`, style: styles.chartSvg, preserveAspectRatio: "xMidYMid meet" }, /* @__PURE__ */ import_react.default.createElement("line", { x1: padL, y1: zeroY, x2: W - padR, y2: zeroY, stroke: "#37403c", strokeWidth: "1", strokeDasharray: "3,3" }), series.map((s, i) => {
      const cx = padL + slotW * i + slotW / 2;
      const y = yFor(s.profit);
      const barTop = Math.min(y, zeroY);
      const barH = Math.abs(y - zeroY);
      const positive = s.profit >= 0;
      return /* @__PURE__ */ import_react.default.createElement(
        "rect",
        {
          key: i,
          x: cx - barW / 2,
          y: barTop,
          width: barW,
          height: Math.max(barH, 1),
          rx: "2",
          fill: positive ? "#1D9E7544" : "#EF444444"
        }
      );
    }), n >= 2 && /* @__PURE__ */ import_react.default.createElement("polyline", { points: linePts, fill: "none", stroke: "#5DCAA5", strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round" }), series.map((s, i) => {
      const cx = padL + slotW * i + slotW / 2;
      return /* @__PURE__ */ import_react.default.createElement("circle", { key: i, cx, cy: yFor(s.profit), r: "2.5", fill: "#5DCAA5" });
    }), series.map((s, i) => {
      if (i % labelStep !== 0 && i !== n - 1) return null;
      const cx = padL + slotW * i + slotW / 2;
      return /* @__PURE__ */ import_react.default.createElement("text", { key: i, x: cx, y: H - 8, textAnchor: "middle", fontSize: "8", fill: "#7a8480" }, shortLabel(s.label));
    })), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.chartLegend }, "Each bar is one ", series.length > 1 ? "period" : "period", "'s estimated profit. Green line shows the trend."));
  }
  function shortLabel(label) {
    if (!label) return "";
    return label.replace(/^Week of /, "").replace(/^Week /, "W").slice(0, 9);
  }
  function MoneyTab({ orders, onUpdate }) {
    const [sortField, setSortField] = (0, import_react.useState)("date");
    const [sortDir, setSortDir] = (0, import_react.useState)("desc");
    const [groupMode, setGroupMode] = (0, import_react.useState)("none");
    const [unpaidOnly, setUnpaidOnly] = (0, import_react.useState)(false);
    const [openPhotos, setOpenPhotos] = (0, import_react.useState)(null);
    const [storage, setStorage] = (0, import_react.useState)(null);
    const [search, setSearch] = (0, import_react.useState)("");
    const [showChart, setShowChart] = (0, import_react.useState)(false);
    (0, import_react.useEffect)(() => {
      let live = true;
      photoStorageBytes().then((s) => {
        if (live) setStorage(s);
      });
      return () => {
        live = false;
      };
    }, [orders]);
    const filtered = (0, import_react.useMemo)(() => {
      let arr = unpaidOnly ? orders.filter((o) => !o.paid) : orders;
      const q = search.trim().toLowerCase();
      if (q) arr = arr.filter((o) => (o.customer || "").toLowerCase().includes(q));
      return arr;
    }, [orders, unpaidOnly, search]);
    const totals = (0, import_react.useMemo)(() => {
      let booked = 0, collected = 0, cost = 0, costComplete = true;
      filtered.forEach((o) => {
        booked += o.total;
        if (o.paid) collected += o.total;
        const info = orderCostInfo(o);
        cost += info.cost;
        if (!info.complete) costComplete = false;
      });
      return {
        booked: round2(booked),
        collected: round2(collected),
        outstanding: round2(booked - collected),
        profit: round2(booked - cost),
        costComplete,
        count: filtered.length
      };
    }, [filtered]);
    const sorted = (0, import_react.useMemo)(() => {
      const arr = [...filtered];
      arr.sort((a, b) => {
        let cmp = 0;
        if (sortField === "date") cmp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortField === "total") cmp = a.total - b.total;
        if (sortField === "name") cmp = (a.customer || "").localeCompare(b.customer || "");
        return sortDir === "asc" ? cmp : -cmp;
      });
      return arr;
    }, [filtered, sortField, sortDir]);
    const groups = (0, import_react.useMemo)(() => {
      if (groupMode === "none") return [{ label: null, stamp: 0, orders: sorted }];
      const map = /* @__PURE__ */ new Map();
      sorted.forEach((o) => {
        const { label, stamp } = groupKeyFor(o, groupMode);
        if (!map.has(label)) map.set(label, { label, stamp, orders: [] });
        map.get(label).orders.push(o);
      });
      return Array.from(map.values()).sort((a, b) => b.stamp - a.stamp);
    }, [sorted, groupMode]);
    const profitSeries = (0, import_react.useMemo)(() => {
      const mode = groupMode === "none" ? "week" : groupMode;
      const map = /* @__PURE__ */ new Map();
      filtered.forEach((o) => {
        const { label, stamp } = groupKeyFor(o, mode);
        if (!map.has(label)) map.set(label, { label, stamp, profit: 0, revenue: 0 });
        const e = map.get(label);
        e.revenue += o.total;
        e.profit += o.total - orderCostInfo(o).cost;
      });
      return Array.from(map.values()).sort((a, b) => a.stamp - b.stamp).map((e) => ({ ...e, profit: round2(e.profit), revenue: round2(e.revenue) }));
    }, [filtered, groupMode]);
    const setSort = (field) => {
      if (sortField === field) {
        setSortDir((d) => d === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDir(field === "name" ? "asc" : "desc");
      }
    };
    if (orders.length === 0) {
      return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyTitle }, "No history yet"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyBody }, "Every order you save shows up here \u2014 including archived past weeks."));
    }
    return /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyStatsBar }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statValue }, currency(totals.booked)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, unpaidOnly ? "Unpaid total" : "Revenue")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.statValue, color: "#1D9E75" } }, currency(totals.profit), totals.costComplete ? "" : "*"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "Est. profit")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.statValue, color: "#1D9E75" } }, currency(totals.collected)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "Collected")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.statValue, ...totals.outstanding > 0 ? { color: "#EF9F27" } : {} } }, currency(totals.outstanding)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "Outstanding"))), !totals.costComplete && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyFootnote }, "* some items predate cost tracking, so profit is partial"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.sortRow }, [
      ["date", "Date"],
      ["total", "Amount"],
      ["name", "Customer"]
    ].map(([field, label]) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: field,
        style: { ...styles.sortBtn, ...sortField === field ? styles.sortBtnActive : {} },
        onClick: () => setSort(field)
      },
      label,
      sortField === field && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.sortDirText }, sortDir === "asc" ? "\u2191" : "\u2193")
    )), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.sortBtn, ...unpaidOnly ? { color: "#EF9F27", borderColor: "#EF9F27" } : {} },
        onClick: () => setUnpaidOnly((v) => !v)
      },
      "Unpaid only"
    )), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.sortRow }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupLabel }, "Group:"), [
      ["none", "None"],
      ["week", "Week"],
      ["month", "Month"],
      ["year", "Year"]
    ].map(([mode, label]) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: mode,
        style: { ...styles.sortBtn, ...groupMode === mode ? styles.sortBtnActive : {} },
        onClick: () => setGroupMode(mode)
      },
      label
    )), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyCount }, totals.count, " order", totals.count !== 1 ? "s" : "")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneySearchRow }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: styles.moneySearchInput,
        placeholder: "Search by customer name...",
        value: search,
        onChange: (e) => setSearch(e.target.value)
      }
    ), search && /* @__PURE__ */ import_react.default.createElement("button", { style: styles.moneySearchClear, onClick: () => setSearch(""), "aria-label": "Clear search" }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.X, { size: 15 })), profitSeries.length >= 2 && /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.chartToggleBtn, ...showChart ? styles.chartToggleBtnActive : {} },
        onClick: () => setShowChart((v) => !v)
      },
      showChart ? "Hide graph" : "Graph"
    )), showChart && profitSeries.length >= 2 && /* @__PURE__ */ import_react.default.createElement(ProfitChart, { series: profitSeries }), groups.map((group) => {
      let gRev = 0, gCost = 0, gCollected = 0;
      group.orders.forEach((o) => {
        gRev += o.total;
        gCost += orderCostInfo(o).cost;
        if (o.paid) gCollected += o.total;
      });
      const gProfit = round2(gRev - gCost);
      const gOutstanding = round2(gRev - gCollected);
      return /* @__PURE__ */ import_react.default.createElement("div", { key: group.label || "all", style: styles.moneyGroup }, group.label && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupHeaderRich }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupHeaderTop }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupTitle }, group.label), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupOrderCount }, group.orders.length, " order", group.orders.length !== 1 ? "s" : "")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupStatsRow }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupStat }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupStatValue }, currency(round2(gRev))), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupStatLabel }, "revenue")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupStat }, /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.groupStatValue, color: "#1D9E75" } }, currency(gProfit)), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupStatLabel }, "profit")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupStat }, /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.groupStatValue, color: gOutstanding > 0 ? "#EF9F27" : "#9aa5a0" } }, currency(gOutstanding)), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupStatLabel }, "outstanding")))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyList }, group.orders.map((o) => {
        const info = orderCostInfo(o);
        const profit = round2(o.total - info.cost);
        const photoItems = (o.items || []).map((it, i) => ({ it, i })).filter(({ it }) => it.hasPhoto);
        return /* @__PURE__ */ import_react.default.createElement("div", { key: o.id, style: { ...styles.moneyRowWrap, ...o.archived ? { opacity: 0.65 } : {} } }, /* @__PURE__ */ import_react.default.createElement(
          "div",
          {
            style: { ...styles.moneyRow, ...photoItems.length ? { cursor: "pointer" } : {} },
            onClick: photoItems.length ? () => setOpenPhotos(openPhotos === o.id ? null : o.id) : void 0
          },
          /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyRowLeft }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyName }, o.customer, photoItems.length > 0 && /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Camera, { size: 12, style: { marginLeft: 6, verticalAlign: "middle", opacity: 0.7 } })), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyMeta }, formatDate(o.createdAt), o.archived ? " \xB7 archived" : ` \xB7 ${o.status}`, photoItems.length > 0 ? ` \xB7 ${photoItems.length} photo${photoItems.length !== 1 ? "s" : ""}` : "")),
          /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyRowRight }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyAmounts }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.moneyAmount }, currency(o.total)), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.moneyProfit }, info.complete || info.cost > 0 ? `+${currency(profit)}${info.complete ? "" : "*"}` : "\u2014")), /* @__PURE__ */ import_react.default.createElement(
            "button",
            {
              style: {
                ...styles.paidPill,
                ...o.paid ? { background: "#1D9E7522", color: "#1D9E75" } : { background: "#EF9F2722", color: "#EF9F27" }
              },
              onClick: (e) => {
                e.stopPropagation();
                onUpdate(o.id, { paid: !o.paid });
              }
            },
            o.paid ? "Paid" : "Unpaid"
          ))
        ), openPhotos === o.id && photoItems.length > 0 && /* @__PURE__ */ import_react.default.createElement(OrderPhotos, { orderId: o.id, photoItems }));
      })));
    }), storage && storage.count > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.storageGauge }, /* @__PURE__ */ import_react.default.createElement(import_lucide_react.Camera, { size: 13 }), /* @__PURE__ */ import_react.default.createElement("span", null, storage.count, " scale photo", storage.count !== 1 ? "s" : "", " stored \xB7 ", fmtBytes(storage.bytes)), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.storageGaugeNote }, "auto-deleted after 1 month")));
  }
  function OrderPhotos({ orderId, photoItems }) {
    const [photos, setPhotos] = (0, import_react.useState)({});
    (0, import_react.useEffect)(() => {
      let live = true;
      (async () => {
        for (const { i } of photoItems) {
          const d = await loadPhoto(orderId, i);
          if (!live) return;
          setPhotos((prev) => ({ ...prev, [i]: d || "none" }));
        }
      })();
      return () => {
        live = false;
      };
    }, [orderId]);
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderPhotosWrap }, photoItems.map(({ it, i }) => /* @__PURE__ */ import_react.default.createElement("div", { key: i, style: styles.orderPhotoItem }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderPhotoLabel }, it.name, it.weight > 0 ? ` \xB7 ${it.weight} lb` : ""), photos[i] === void 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderPhotoLoading }, "loading\u2026"), photos[i] === "none" && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderPhotoLoading }, "photo expired or missing"), photos[i] && photos[i] !== "none" && /* @__PURE__ */ import_react.default.createElement("img", { src: `data:image/jpeg;base64,${photos[i]}`, alt: `${it.name} on scale`, style: styles.orderPhotoImg }))));
  }
  var TEAL_DARK = "#1a3a3a";
  var TEAL_MID = "#2E6B6B";
  var TEAL_LIGHT = "#5DCAA5";
  var GOLD = "#C49A3C";
  var CREAM = "#F5F0E8";
  var DARK = "#1a1a1a";
  var CARD = "#222826";
  var styles = {
    page: {
      minHeight: "100vh",
      background: DARK,
      color: CREAM,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: "40px"
    },
    loadingText: {
      padding: "40px 20px",
      textAlign: "center",
      color: "#9aa5a0"
    },
    header: {
      background: TEAL_DARK,
      borderBottom: `2px solid ${GOLD}`,
      padding: "16px 16px 0",
      position: "sticky",
      top: 0,
      zIndex: 10
    },
    headerTop: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "14px"
    },
    headerCenter: {
      flex: 1
    },
    headerActions: {
      display: "flex",
      gap: "6px",
      alignItems: "center",
      flexShrink: 0
    },
    headerActionBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "34px",
      height: "34px",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "8px",
      color: "#9aa5a0",
      cursor: "pointer",
      flexShrink: 0
    },
    exportMsg: {
      fontSize: "12px",
      color: TEAL_LIGHT,
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "6px",
      padding: "7px 12px",
      margin: "0 16px 8px",
      textAlign: "center"
    },
    importModalCard: {
      width: "100%",
      maxWidth: "420px",
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "18px",
      boxSizing: "border-box"
    },
    importModalHint: {
      fontSize: "13px",
      color: "#9aa5a0",
      marginBottom: "10px",
      lineHeight: 1.4
    },
    logoMark: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      background: "#085041",
      border: `1.5px solid ${TEAL_LIGHT}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "13px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      flexShrink: 0
    },
    title: {
      fontSize: "17px",
      fontWeight: 700,
      color: "#fff"
    },
    subtitle: {
      fontSize: "12px",
      color: TEAL_LIGHT
    },
    tabs: {
      display: "flex",
      gap: "2px"
    },
    tab: {
      flex: 1,
      background: "transparent",
      border: "none",
      color: "#9aa5a0",
      fontSize: "13px",
      fontWeight: 600,
      padding: "10px 4px",
      borderBottom: "2px solid transparent",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px"
    },
    tabActive: {
      color: TEAL_LIGHT,
      borderBottom: `2px solid ${TEAL_LIGHT}`
    },
    tabBadge: {
      background: TEAL_LIGHT,
      color: "#04342C",
      borderRadius: "10px",
      fontSize: "11px",
      fontWeight: 700,
      padding: "1px 7px"
    },
    errorBanner: {
      display: "block",
      width: "100%",
      background: "#501313",
      color: "#F7C1C1",
      padding: "10px 16px",
      fontSize: "13px",
      textAlign: "center",
      border: "none",
      borderBottom: "1px solid #6b1a1a",
      cursor: "pointer"
    },
    errorRetry: {
      display: "block",
      fontSize: "11px",
      color: "#F7C1C1",
      opacity: 0.7,
      marginTop: "3px",
      textDecoration: "underline"
    },
    main: {
      padding: "16px",
      maxWidth: "560px",
      margin: "0 auto"
    },
    statsBar: {
      display: "flex",
      gap: "8px",
      marginBottom: "14px"
    },
    statTile: {
      flex: 1,
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "10px",
      padding: "10px 8px",
      textAlign: "center"
    },
    statValue: {
      fontSize: "16px",
      fontWeight: 700,
      color: TEAL_LIGHT
    },
    statLabel: {
      fontSize: "11px",
      color: "#9aa5a0",
      marginTop: "2px"
    },
    topActions: {
      display: "flex",
      gap: "8px",
      marginBottom: "16px",
      flexWrap: "wrap"
    },
    newOrderBtn: {
      flex: 1.4,
      background: "#085041",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "14px",
      fontSize: "15px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      cursor: "pointer"
    },
    pasteBtn: {
      flex: 1,
      background: "transparent",
      color: "#B5A2E8",
      border: "1px solid #7F77DD",
      borderRadius: "10px",
      padding: "14px",
      fontSize: "14px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      cursor: "pointer"
    },
    // Disabled-button look for the dormant AI text features (GitHub build).
    disabledBtn: {
      opacity: 0.4,
      cursor: "not-allowed",
      filter: "grayscale(100%)"
    },
    // Strikethrough applied to the button label text only (keeps the icon intact).
    struckText: {
      textDecoration: "line-through",
      textDecorationThickness: "2px"
    },
    pasteHint: {
      fontSize: "12px",
      color: "#9aa5a0",
      lineHeight: 1.5,
      marginBottom: "8px"
    },
    attachRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginTop: "8px",
      flexWrap: "wrap"
    },
    attachBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#B5A2E8",
      background: "transparent",
      border: "1px solid #7F77DD",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer"
    },
    attachChip: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "4px 4px 4px 10px"
    },
    attachName: {
      fontSize: "12px",
      color: CREAM,
      maxWidth: "140px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    shopBulkRow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginTop: "12px",
      flexWrap: "wrap"
    },
    parseError: {
      fontSize: "12px",
      color: "#F7C1C1",
      background: "#501313",
      borderRadius: "6px",
      padding: "8px 10px",
      marginTop: "8px"
    },
    emptyState: {
      textAlign: "center",
      padding: "48px 20px",
      color: "#9aa5a0"
    },
    emptyTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: CREAM,
      marginBottom: "6px"
    },
    emptyBody: {
      fontSize: "13px",
      lineHeight: 1.5
    },
    orderList: {
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    orderCard: {
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "10px",
      overflow: "hidden"
    },
    orderCardHeader: {
      width: "100%",
      padding: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      color: CREAM,
      textAlign: "left"
    },
    orderCardLeft: {
      display: "flex",
      flexDirection: "column",
      gap: "3px",
      minWidth: 0
    },
    orderCustomer: {
      fontSize: "15px",
      fontWeight: 600
    },
    orderMeta: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    orderCardRight: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexShrink: 0
    },
    paidPill: {
      fontSize: "11px",
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: "12px",
      cursor: "pointer",
      border: "none"
    },
    statusPill: {
      fontSize: "11px",
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: "12px",
      cursor: "pointer",
      border: "none"
    },
    orderCardBody: {
      padding: "0 14px 14px",
      borderTop: "1px solid #37403c"
    },
    orderItemsList: {
      padding: "12px 0 4px",
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    orderItemLine: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: CREAM,
      gap: "10px"
    },
    orderItemVariant: {
      color: "#9aa5a0",
      fontSize: "12px"
    },
    loopSummary: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      fontSize: "12px",
      color: TEAL_LIGHT,
      padding: "8px 0",
      borderTop: "1px dashed #37403c",
      marginTop: "4px"
    },
    notesBlock: {
      borderTop: "1px dashed #37403c",
      marginTop: "4px",
      paddingTop: "8px"
    },
    orderNotes: {
      fontSize: "12px",
      color: "#cccccc",
      fontStyle: "italic",
      cursor: "pointer",
      lineHeight: 1.5
    },
    notesEditHint: {
      color: "#7a8480",
      fontSize: "11px"
    },
    addNoteBtn: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "2px 0"
    },
    notesEditActions: {
      display: "flex",
      gap: "8px",
      marginTop: "6px"
    },
    orderCardFooter: {
      marginTop: "10px"
    },
    statusRow: {
      display: "flex",
      gap: "6px",
      flexWrap: "wrap",
      marginBottom: "10px"
    },
    statusOption: {
      flex: "1 1 auto",
      fontSize: "12px",
      fontWeight: 600,
      padding: "7px 10px",
      borderRadius: "8px",
      border: "1px solid #37403c",
      background: "transparent",
      color: "#9aa5a0",
      cursor: "pointer"
    },
    actionRow: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      flexWrap: "wrap"
    },
    actionBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "4px 0"
    },
    confirmRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px"
    },
    confirmText: {
      color: "#cccccc",
      fontSize: "12px"
    },
    confirmYes: {
      background: "#993556",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    confirmYesGreen: {
      background: "#1D9E75",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    confirmNo: {
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "12px",
      cursor: "pointer"
    },
    deliveredSection: {
      marginTop: "20px"
    },
    deliveredSummary: {
      fontSize: "13px",
      fontWeight: 600,
      color: "#9aa5a0",
      cursor: "pointer",
      padding: "8px 0"
    },
    clearDeliveredBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "1px dashed #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      cursor: "pointer",
      marginTop: "10px",
      width: "100%",
      justifyContent: "center"
    },
    clearConfirmRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      marginTop: "10px",
      flexWrap: "wrap"
    },
    // Form
    formCard: {
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "16px",
      marginBottom: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    formHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "8px"
    },
    formTitle: {
      fontSize: "16px",
      fontWeight: 700,
      color: "#fff"
    },
    iconBtn: {
      background: "transparent",
      border: "none",
      color: "#9aa5a0",
      cursor: "pointer",
      padding: "4px"
    },
    label: {
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      marginTop: "10px",
      marginBottom: "4px"
    },
    input: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "14px",
      color: CREAM,
      outline: "none"
    },
    chipRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "6px"
    },
    chip: {
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "5px 12px",
      cursor: "pointer"
    },
    textarea: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "14px",
      color: CREAM,
      outline: "none",
      minHeight: "60px",
      resize: "vertical",
      fontFamily: "inherit"
    },
    selectedSummary: {
      fontSize: "12px",
      color: TEAL_LIGHT,
      fontWeight: 600,
      marginBottom: "4px"
    },
    qtyControl: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    qtyBtn: {
      width: "26px",
      height: "26px",
      borderRadius: "6px",
      border: "1px solid #37403c",
      background: "transparent",
      color: TEAL_LIGHT,
      fontSize: "16px",
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    qtyValue: {
      fontSize: "14px",
      fontWeight: 600,
      minWidth: "16px",
      textAlign: "center"
    },
    categoryGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "6px"
    },
    categoryBtn: {
      fontSize: "12px",
      fontWeight: 600,
      color: "#cccccc",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "8px 10px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    categoryBtnActive: {
      color: TEAL_LIGHT,
      borderColor: TEAL_LIGHT,
      background: "#0f2e2a"
    },
    catCount: {
      background: GOLD,
      color: "#1a1a1a",
      borderRadius: "8px",
      fontSize: "10px",
      fontWeight: 700,
      padding: "1px 6px"
    },
    picker: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px",
      marginTop: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    pickerGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    pickerGroupName: {
      fontSize: "12px",
      fontWeight: 700,
      color: "#fff"
    },
    pickerVariants: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    variantBtn: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "6px",
      padding: "8px 10px",
      fontSize: "12px",
      color: CREAM,
      cursor: "pointer",
      textAlign: "left",
      minHeight: "38px"
    },
    variantBtnSelected: {
      borderColor: TEAL_LIGHT,
      background: "#0f2e2a"
    },
    variantLabel: {
      color: CREAM,
      flex: 1,
      paddingRight: "8px"
    },
    variantPrice: {
      color: GOLD,
      fontWeight: 700
    },
    reviewList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginTop: "10px",
      paddingTop: "10px",
      borderTop: "1px dashed #37403c"
    },
    reviewRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px"
    },
    reviewText: {
      fontSize: "13px",
      color: CREAM,
      flex: 1
    },
    loopRow: {
      display: "flex",
      gap: "12px",
      marginTop: "4px"
    },
    loopField: {
      flex: 1,
      display: "flex",
      flexDirection: "column"
    },
    loopHint: {
      fontSize: "11px",
      color: "#9aa5a0",
      marginTop: "4px"
    },
    discountRow: {
      display: "flex",
      gap: "6px",
      alignItems: "stretch"
    },
    discountTypeBtn: {
      fontSize: "13px",
      fontWeight: 700,
      color: "#9aa5a0",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "8px 14px",
      cursor: "pointer"
    },
    discountTypeBtnActive: {
      color: "#E8799A",
      borderColor: "#E8799A",
      background: "#2e1a22"
    },
    discountLine: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: "#E8799A",
      fontWeight: 600,
      marginTop: "12px"
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM,
      marginTop: "8px",
      paddingTop: "10px",
      borderTop: `1px solid ${TEAL_MID}`
    },
    waiveSurchargeRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "8px 0 2px",
      marginTop: "4px"
    },
    waiveSurchargeLabel: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      color: "#9aa5a0"
    },
    waiveCheckbox: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "18px",
      height: "18px",
      borderRadius: "4px",
      border: "1px solid #4a5450",
      background: "#1a1a1a",
      color: "#0c1410",
      flexShrink: 0
    },
    waiveCheckboxOn: {
      background: TEAL_LIGHT,
      borderColor: TEAL_LIGHT
    },
    waiveSurchargeHint: {
      fontSize: "11px",
      color: "#7a8480",
      fontStyle: "italic"
    },
    negativeTotalNote: {
      fontSize: "12px",
      color: "#E8799A",
      background: "#2a1419",
      border: "1px solid #5a2433",
      borderRadius: "8px",
      padding: "8px 12px",
      marginTop: "8px",
      lineHeight: 1.4
    },
    totalValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: GOLD
    },
    saveBtn: {
      marginTop: "12px",
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "8px",
      padding: "12px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer"
    },
    saveBtnDisabled: {
      opacity: 0.4,
      cursor: "not-allowed"
    },
    // Cooking list
    cookHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "12px"
    },
    cookSummary: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    resetBtn: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "6px",
      padding: "5px 10px",
      cursor: "pointer"
    },
    cookCategory: {
      marginBottom: "16px"
    },
    cookCategoryTitle: {
      fontSize: "13px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      marginBottom: "6px",
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    },
    cookItem: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      marginBottom: "6px",
      cursor: "pointer",
      textAlign: "left"
    },
    cookItemChecked: {
      opacity: 0.5
    },
    checkbox: {
      width: "18px",
      height: "18px",
      borderRadius: "5px",
      border: "1.5px solid #5F5E5A",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    checkboxChecked: {
      background: TEAL_LIGHT,
      borderColor: TEAL_LIGHT
    },
    cookItemText: {
      flex: 1
    },
    cookItemName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    cookItemVariant: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    cookItemQty: {
      fontSize: "14px",
      fontWeight: 700,
      color: GOLD
    },
    // Shopping list
    genCard: {
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "14px",
      marginBottom: "14px"
    },
    genTitle: {
      fontSize: "14px",
      fontWeight: 700,
      color: "#fff",
      marginBottom: "4px"
    },
    genHint: {
      fontSize: "12px",
      color: "#9aa5a0",
      lineHeight: 1.5,
      marginBottom: "8px"
    },
    genToggleRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px",
      color: CREAM,
      cursor: "pointer"
    },
    genCheckbox: {
      width: "16px",
      height: "16px",
      accentColor: TEAL_LIGHT
    },
    shopInputRow: {
      display: "flex",
      gap: "8px",
      marginBottom: "14px",
      alignItems: "flex-start"
    },
    shopAddBtn: {
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "8px",
      width: "44px",
      height: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flexShrink: 0
    },
    shopItem: {
      display: "flex",
      alignItems: "center",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "8px",
      marginBottom: "6px",
      overflow: "hidden"
    },
    shopItemMain: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: "transparent",
      border: "none",
      padding: "11px 12px",
      cursor: "pointer",
      textAlign: "left"
    },
    shopItemText: {
      fontSize: "14px",
      color: CREAM
    },
    shopItemTextChecked: {
      textDecoration: "line-through",
      color: "#9aa5a0"
    },
    shopDeleteBtn: {
      background: "transparent",
      border: "none",
      color: "#5F5E5A",
      cursor: "pointer",
      padding: "11px 12px",
      flexShrink: 0
    },
    // Money tab
    moneyStatsBar: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginBottom: "8px"
    },
    moneyStatTile: {
      flex: "1 1 45%",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "10px",
      padding: "10px 8px",
      textAlign: "center"
    },
    moneyFootnote: {
      fontSize: "10px",
      color: "#7a8480",
      fontStyle: "italic",
      marginBottom: "8px"
    },
    groupLabel: {
      fontSize: "12px",
      color: "#9aa5a0",
      fontWeight: 600
    },
    moneyGroup: {
      marginBottom: "14px"
    },
    groupHeader: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "8px",
      padding: "4px 2px 6px",
      flexWrap: "wrap"
    },
    groupTitle: {
      fontSize: "13px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      textTransform: "uppercase",
      letterSpacing: "0.04em"
    },
    groupTotals: {
      fontSize: "11px",
      color: "#9aa5a0"
    },
    moneyAmounts: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end"
    },
    moneyProfit: {
      fontSize: "11px",
      fontWeight: 600,
      color: "#1D9E75"
    },
    sortRow: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      marginBottom: "12px",
      flexWrap: "wrap"
    },
    sortBtn: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "6px 10px",
      cursor: "pointer"
    },
    sortBtnActive: {
      color: TEAL_LIGHT,
      borderColor: TEAL_LIGHT
    },
    sortDirText: {
      fontSize: "11px"
    },
    moneyCount: {
      marginLeft: "auto",
      fontSize: "12px",
      color: "#9aa5a0"
    },
    moneyList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    moneyRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      gap: "10px"
    },
    moneyRowLeft: {
      minWidth: 0
    },
    moneyName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    moneyMeta: {
      fontSize: "11px",
      color: "#9aa5a0",
      marginTop: "2px"
    },
    moneyRowRight: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flexShrink: 0
    },
    moneyAmount: {
      fontSize: "14px",
      fontWeight: 700,
      color: GOLD
    },
    // Review banner (AI flags)
    // Per-item editor
    reviewItemCard: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "8px 10px",
      marginBottom: "6px"
    },
    reviewItemMain: {
      flex: 1,
      background: "transparent",
      border: "none",
      textAlign: "left",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: 0
    },
    itemExtraDot: {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: TEAL_LIGHT,
      flexShrink: 0
    },
    itemNotePreview: {
      fontSize: "11px",
      color: "#9aa5a0",
      fontStyle: "italic",
      marginTop: "3px"
    },
    itemUpchargePreview: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      marginTop: "3px"
    },
    itemUpchargeNeedsPrice: {
      fontSize: "11px",
      color: "#EF9F27",
      marginTop: "3px",
      fontWeight: 600
    },
    itemEditor: {
      marginTop: "8px",
      paddingTop: "8px",
      borderTop: "1px dashed #37403c"
    },
    miniLabel: {
      fontSize: "11px",
      fontWeight: 600,
      color: "#9aa5a0",
      display: "block",
      marginTop: "6px",
      marginBottom: "3px"
    },
    upchargeRow: {
      display: "flex",
      gap: "6px"
    },
    itemEditorActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
      marginTop: "8px"
    },
    clearItemExtra: {
      background: "transparent",
      color: "#993556",
      border: "none",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    doneItemBtn: {
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "6px",
      padding: "5px 14px",
      fontSize: "12px",
      fontWeight: 700,
      cursor: "pointer"
    },
    // Custom charges
    customChargeList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginBottom: "6px"
    },
    customChargeRow: {
      display: "flex",
      gap: "6px",
      alignItems: "center"
    },
    addChargeBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      background: "transparent",
      border: "1px dashed #2E6B6B",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer",
      marginTop: "2px"
    },
    extraLine: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: "#cccccc",
      marginTop: "10px"
    },
    // Order card per-item sub-lines
    orderItemBlock: {
      display: "flex",
      flexDirection: "column",
      gap: "2px"
    },
    orderItemSub: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      paddingLeft: "2px"
    },
    orderItemNote: {
      fontSize: "11px",
      color: "#9aa5a0",
      fontStyle: "italic",
      paddingLeft: "2px"
    },
    // Invoice
    invoiceOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "20px 12px",
      zIndex: 100,
      overflowY: "auto"
    },
    invoiceScroll: {
      width: "100%",
      maxWidth: "380px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    },
    invoiceCard: {
      width: "100%",
      background: "linear-gradient(160deg, #14302e 0%, #1a1a1a 55%)",
      border: `1px solid ${GOLD}`,
      borderRadius: "16px",
      padding: "20px",
      boxSizing: "border-box"
    },
    invoiceHeader: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "14px"
    },
    invoiceLogo: {
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      background: "#085041",
      border: `2px solid ${TEAL_LIGHT}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      flexShrink: 0
    },
    invoiceBrand: {
      fontSize: "15px",
      fontWeight: 700,
      color: "#fff"
    },
    invoiceTagline: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      fontStyle: "italic"
    },
    invoiceMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: "8px"
    },
    invoiceCustomer: {
      fontSize: "17px",
      fontWeight: 700,
      color: CREAM
    },
    invoiceDate: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    invoiceDivider: {
      height: "1px",
      background: "#37403c",
      margin: "12px 0"
    },
    invoiceItems: {
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    invoiceItemBlock: {
      display: "flex",
      flexDirection: "column",
      gap: "1px"
    },
    invoiceItemLine: {
      display: "flex",
      justifyContent: "space-between",
      gap: "10px"
    },
    invoiceItemName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    invoiceItemPrice: {
      fontSize: "14px",
      fontWeight: 700,
      color: CREAM,
      flexShrink: 0
    },
    invoiceItemVariant: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    invoiceItemExtra: {
      fontSize: "11px",
      color: TEAL_LIGHT
    },
    invoiceItemNote: {
      fontSize: "11px",
      color: "#b8a06a",
      fontStyle: "italic"
    },
    invoiceTotals: {
      display: "flex",
      flexDirection: "column",
      gap: "5px"
    },
    invoiceTotalRow: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: "#cccccc"
    },
    invoiceGrandTotal: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "12px",
      paddingTop: "12px",
      borderTop: `1px solid ${GOLD}`
    },
    invoiceGrandValue: {
      fontSize: "22px",
      fontWeight: 700,
      color: GOLD
    },
    invoiceNotes: {
      fontSize: "12px",
      color: "#9aa5a0",
      fontStyle: "italic",
      marginTop: "12px",
      paddingTop: "10px",
      borderTop: "1px dashed #37403c"
    },
    invoiceFooter: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      textAlign: "center",
      marginTop: "14px"
    },
    invoiceClose: {
      marginTop: "16px",
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "10px",
      padding: "12px 40px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer"
    },
    invoiceHint: {
      fontSize: "12px",
      color: "#9aa5a0",
      marginTop: "8px",
      textAlign: "center"
    },
    // Review open button (replaces passive banner)
    reviewOpenBtn: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      background: "#3a2e08",
      border: "1px solid #C49A3C",
      borderRadius: "10px",
      padding: "12px 14px",
      cursor: "pointer",
      marginBottom: "10px",
      color: GOLD,
      textAlign: "left"
    },
    reviewOpenText: { flex: 1 },
    reviewOpenTitle: { fontSize: "13px", fontWeight: 700, color: GOLD },
    reviewOpenSub: { fontSize: "11px", color: "#cbb87a", marginTop: "1px" },
    // Review modal
    reviewModalCard: {
      width: "100%",
      maxWidth: "420px",
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "18px",
      boxSizing: "border-box"
    },
    reviewModalHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "4px"
    },
    reviewModalTitle: { fontSize: "17px", fontWeight: 700, color: "#fff" },
    reviewProgress: { fontSize: "12px", color: "#9aa5a0", marginBottom: "14px" },
    reviewStep: { display: "flex", flexDirection: "column" },
    reviewReasonBox: {
      background: "#1a1a1a",
      border: "1px solid #C49A3C",
      borderRadius: "8px",
      padding: "12px",
      fontSize: "14px",
      color: CREAM,
      lineHeight: 1.4
    },
    reviewItemContext: {
      fontSize: "12px",
      color: "#9aa5a0",
      marginTop: "8px"
    },
    reviewField: {
      display: "flex",
      flexDirection: "column",
      marginTop: "12px"
    },
    reviewActionBtn: {
      marginTop: "8px",
      alignSelf: "flex-start",
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer"
    },
    reviewOr: {
      fontSize: "11px",
      color: "#7a8480",
      textAlign: "center",
      margin: "10px 0 4px",
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    },
    reviewSkipBtn: {
      marginTop: "14px",
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "9px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    reviewNav: {
      display: "flex",
      justifyContent: "center",
      gap: "6px",
      marginTop: "14px"
    },
    reviewDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      border: "none",
      background: "#37403c",
      cursor: "pointer",
      padding: 0
    },
    reviewDotActive: { background: TEAL_LIGHT },
    reviewDotDone: { background: "#1D9E75" },
    reviewDone: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
      padding: "24px 0 8px",
      textAlign: "center"
    },
    reviewDoneText: { fontSize: "14px", color: CREAM, fontWeight: 600 },
    // Sous vide reprice button
    sousVideBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: "100%",
      marginTop: "12px",
      background: "#0f2e2a",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "11px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer"
    },
    weightPriceHint: {
      fontSize: "12px",
      color: TEAL_LIGHT,
      marginTop: "4px",
      fontWeight: 600
    },
    // Pending weight state on order cards
    pendingPrice: {
      fontSize: "12px",
      color: "#EF9F27",
      fontStyle: "italic",
      fontWeight: 600
    },
    setWeightBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      marginTop: "5px",
      background: "#0f2e2a",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "11px",
      fontWeight: 600,
      cursor: "pointer"
    },
    updateAllWeightsBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: "100%",
      marginBottom: "10px",
      background: "#0f2e2a",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "11px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer"
    },
    // Weight + photo modal
    weightModalCard: {
      width: "100%",
      maxWidth: "400px",
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "18px",
      boxSizing: "border-box",
      maxHeight: "88vh",
      overflowY: "auto"
    },
    weightStepLabel: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      marginTop: "2px"
    },
    amendBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      flex: "1 1 100%",
      background: "#2a2333",
      color: "#b89adb",
      border: "1px solid #6b51a0",
      borderRadius: "10px",
      padding: "13px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer"
    },
    amendOrderPicker: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginBottom: "4px"
    },
    amendOrderChip: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      cursor: "pointer",
      textAlign: "left",
      width: "100%"
    },
    amendOrderChipActive: {
      borderColor: TEAL_LIGHT,
      background: "#0f2e2a"
    },
    amendChipName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    amendChipMeta: {
      fontSize: "12px",
      color: "#9aa5a0",
      flexShrink: 0
    },
    amendCurrentBox: {
      background: "#14302e",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "10px 12px",
      margin: "4px 0 4px"
    },
    amendCurrentTitle: {
      fontSize: "11px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: "6px"
    },
    amendCurrentItem: {
      fontSize: "13px",
      color: CREAM,
      padding: "2px 0"
    },
    weightDeferNote: {
      fontSize: "12px",
      color: "#9aa5a0",
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "10px 12px",
      margin: "10px 0 0",
      lineHeight: 1.4
    },
    weightIntentNote: {
      fontSize: "12px",
      color: "#9aa5a0",
      fontStyle: "italic",
      background: "#1a1a1a",
      borderRadius: "6px",
      padding: "8px 10px",
      margin: "4px 0 12px"
    },
    weightModalHint: {
      fontSize: "11px",
      color: "#7a8480",
      marginTop: "8px",
      lineHeight: 1.4
    },
    photoUploadBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: "100%",
      background: "#1a1a1a",
      color: TEAL_LIGHT,
      border: "1px dashed #2E6B6B",
      borderRadius: "8px",
      padding: "14px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      boxSizing: "border-box"
    },
    photoPreviewWrap: {
      position: "relative",
      borderRadius: "8px",
      overflow: "hidden",
      border: "1px solid #37403c"
    },
    photoPreview: {
      width: "100%",
      display: "block",
      maxHeight: "260px",
      objectFit: "contain",
      background: "#000"
    },
    photoRemoveBtn: {
      position: "absolute",
      top: "8px",
      right: "8px",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      background: "rgba(0,0,0,0.7)",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 9px",
      fontSize: "11px",
      fontWeight: 600,
      cursor: "pointer"
    },
    // Storage gauge in Money tab
    storageGauge: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px",
      color: "#9aa5a0",
      padding: "12px 14px",
      marginTop: "8px",
      background: CARD,
      borderRadius: "8px",
      flexWrap: "wrap"
    },
    storageGaugeNote: {
      fontSize: "11px",
      color: "#7a8480",
      marginLeft: "auto"
    },
    // Order photos in Money tab
    moneyRowWrap: {
      display: "flex",
      flexDirection: "column"
    },
    orderPhotosWrap: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      padding: "10px 4px 4px"
    },
    orderPhotoItem: {
      display: "flex",
      flexDirection: "column",
      gap: "5px"
    },
    orderPhotoLabel: {
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT
    },
    orderPhotoLoading: {
      fontSize: "11px",
      color: "#7a8480",
      fontStyle: "italic"
    },
    orderPhotoImg: {
      width: "100%",
      borderRadius: "8px",
      border: "1px solid #37403c",
      maxHeight: "320px",
      objectFit: "contain",
      background: "#000"
    },
    // Cook tab revenue bar
    cookRevenueBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "12px 14px",
      marginBottom: "12px"
    },
    cookRevenueLabel: {
      fontSize: "13px",
      color: "#9aa5a0"
    },
    cookRevenueValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: TEAL_LIGHT
    },
    // Shop tab cost bar
    shopCostBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "10px",
      padding: "11px 14px",
      marginBottom: "12px"
    },
    shopCostLabel: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    shopCostValue: {
      fontSize: "16px",
      fontWeight: 700,
      color: GOLD
    },
    // Money tab search row
    moneySearchRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "12px"
    },
    moneySearchInput: {
      flex: 1,
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "14px",
      color: CREAM,
      outline: "none"
    },
    moneySearchClear: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "32px",
      height: "32px",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "8px",
      color: "#9aa5a0",
      cursor: "pointer",
      flexShrink: 0
    },
    chartToggleBtn: {
      background: "transparent",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "8px 14px",
      fontSize: "13px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      cursor: "pointer",
      flexShrink: 0
    },
    chartToggleBtnActive: {
      background: "#0f2e2a",
      borderColor: TEAL_LIGHT
    },
    // Rich per-group summary header
    groupHeaderRich: {
      background: "#14302e",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "12px 14px",
      marginBottom: "8px"
    },
    groupHeaderTop: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: "10px"
    },
    groupOrderCount: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    groupStatsRow: {
      display: "flex",
      gap: "8px"
    },
    groupStat: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "2px"
    },
    groupStatValue: {
      fontSize: "15px",
      fontWeight: 700,
      color: CREAM
    },
    groupStatLabel: {
      fontSize: "10px",
      color: "#7a8480",
      textTransform: "uppercase",
      letterSpacing: "0.04em"
    },
    // Profit chart
    chartCard: {
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "14px"
    },
    chartHeader: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: "8px"
    },
    chartTitle: {
      fontSize: "14px",
      fontWeight: 700,
      color: CREAM
    },
    chartSubtitle: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    chartSvg: {
      width: "100%",
      height: "auto",
      display: "block"
    },
    chartLegend: {
      fontSize: "11px",
      color: "#7a8480",
      marginTop: "8px",
      lineHeight: 1.4
    },
    // CSV import
    csvBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      flex: "1 1 100%",
      background: "#1f2937",
      color: "#93b4d4",
      border: "1px solid #3d5a7a",
      borderRadius: "10px",
      padding: "13px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer"
    },
    csvProgress: {
      fontSize: "13px",
      color: TEAL_LIGHT,
      textAlign: "center",
      padding: "8px 0"
    },
    csvResultsList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginBottom: "12px",
      maxHeight: "320px",
      overflowY: "auto"
    },
    csvResultRow: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px"
    },
    csvResultName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM,
      marginBottom: "3px"
    },
    csvResultItems: {
      fontSize: "12px",
      color: "#9aa5a0",
      lineHeight: 1.4
    },
    csvResultItem: {
      marginRight: "4px"
    },
    csvResultFlag: {
      color: "#EF9F27"
    },
    csvResultError: {
      fontSize: "12px",
      color: "#E8799A",
      fontStyle: "italic"
    },
    csvBackBtn: {
      width: "100%",
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      marginTop: "8px"
    }
  };
  return __toCommonJS(LTB_Order_Tracker_exports);
})();
