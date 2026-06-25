// Master catalog: ALL_DINNERS (dishes), ALWAYS_MENU (always-available), category labels, statuses.

// ═══════════════════════════════════════════════════════════════════════════
// MENU — Week of June 22–28. Edit this block each week to match the weekly menu.
// ═══════════════════════════════════════════════════════════════════════════
// ALL dinner dishes Kevin can make (the master menu). The Week tab picks which
// are active; everything else below is always available.
export const ALL_DINNERS = [
  // ── American / Southern / Tex-Mex ─────────────────────────────────────────
  { name: 'Boeuf Bourguignon (Beef Stew)', variants: [
    { label: '~6 servings', price: 100, cost: 45.08 },
    { label: 'With 1 lb mushrooms', price: 112, cost: 51.08 },
  ]},
  { name: 'Brunswick Stew', variants: [
    { label: 'Small (~4)', price: 35, cost: 15.55 },
    { label: 'Large (~8)', price: 65, cost: 31.1 },
  ]},
  { name: 'Chili', variants: [
    { label: 'Small (split order, ~3-4)', price: 45, cost: 18.53 },
    { label: 'Large (~6-8)', price: 80, cost: 37.06 },
  ]},
  { name: 'Gumbo', variants: [
    { label: 'Small (split order, ~3-6)', price: 40, cost: 16.57 },
    { label: 'Large (~8-12)', price: 75, cost: 33.16 },
  ]},
  { name: 'Tex-Mex Kit', variants: [
    { label: 'Pulled Pork, Small (~5-6)', price: 42, cost: 19.21 },
    { label: 'Pulled Pork, Large (~9-10)', price: 80, cost: 37.42 },
    { label: 'Pulled Beef, Small (~5-6)', price: 60, cost: 28.05 },
    { label: 'Pulled Beef, Large (~9-10)', price: 115, cost: 55.1 },
  ]},
  // ── Curry ──────────────────────────────────────────────────────────────────
  { name: 'Indian Style Curry', variants: [
    { label: 'Chickpea, Small (~4-5)', price: 22, cost: 9.97 },
    { label: 'Chicken, Small (~4-5)', price: 27, cost: 14.97 },
    { label: 'Shrimp, Small (~4-5)', price: 40, cost: 23.97 },
    { label: 'Chickpea, Large (~8-10)', price: 40, cost: 18.94 },
    { label: 'Chicken, Large (~8-10)', price: 50, cost: 23.94 },
    { label: 'Shrimp, Large (~8-10)', price: 75, cost: 32.94 },
  ]},
  { name: 'Leblanc Inspired Japanese Curry', variants: [
    { label: 'Small (split order, ~4)', price: 40, cost: 18.76 },
    { label: 'Large (~8)', price: 75, cost: 37.51 },
  ]},
  // ── East Asian ─────────────────────────────────────────────────────────────
  { name: 'Cumin Mushroom Noodles', variants: [
    { label: 'Small (~3-4)', price: 40, cost: 19.86 },
    { label: 'Large (~6-8)', price: 75, cost: 38.65 },
    { label: 'Small (~3-4) + Asian Greens (1/2 lb)', price: 45, cost: 22.03 },
    { label: 'Large (~6-8) + Asian Greens (1 lb)', price: 80, cost: 40.81 },
  ]},
  { name: 'Mapo Eggplant', variants: [
    { label: 'Small (~5-6 servings)', price: 35, cost: 14.75 },
    { label: 'Large (~10-12 servings)', price: 65, cost: 29.51 },
  ]},
  { name: 'Shrimp or Tofu with Asparagus in Black Bean Sauce', variants: [
    { label: 'Shrimp, Small Batch (~3-4)', price: 40, cost: 21.99 },
    { label: 'Shrimp, Large Batch (~7-8)', price: 75, cost: 42.98 },
    { label: 'Tofu, Small Batch (~3-4)', price: 25, cost: 10.6 },
    { label: 'Tofu, Large Batch (~7-8)', price: 45, cost: 20.2 },
  ]},
  { name: 'Stir Fried Long Beans with Ground Pork', variants: [
    { label: 'Small (~4), Ground Pork', price: 30, cost: 12.54 },
    { label: 'Large (~8), Ground Pork', price: 55, cost: 25.07 },
    { label: 'Small (~4), Tofu', price: 30, cost: 12.54 },
    { label: 'Large (~8), Tofu', price: 55, cost: 25.07 },
  ]},
  { name: 'Texas Gulf Shrimp or Tofu and Chinese Broccoli', variants: [
    { label: 'Shrimp, Small Batch (~4)', price: 40, cost: 19.56 },
    { label: 'Shrimp, Large Batch (~8)', price: 75, cost: 38.12 },
    { label: 'Tofu, Small Batch (~4)', price: 25, cost: 8.17 },
    { label: 'Tofu, Large Batch (~8)', price: 45, cost: 15.34 },
  ]},
  { name: 'Thai Basil Chicken (Pad Krapow Gai)', variants: [
    { label: 'Small (~3-4)', price: 30, cost: 14.45 },
    { label: 'Large (~7-8)', price: 55, cost: 27.82 },
  ]},
  // ── Italian ────────────────────────────────────────────────────────────────
  { name: 'Bolognese', variants: [
    { label: 'Small (split order, ~4)', price: 40, cost: 16.79 },
    { label: 'Large (~8)', price: 70, cost: 32.57 },
    { label: 'Small (split order, ~4) + Egg Pappardelle', price: 50, cost: 26.79 },
    { label: 'Large (~8) + Egg Pappardelle', price: 85, cost: 42.57 },
  ]},
  { name: 'Pasta with Homegrown Tomato Sauce', variants: [
    { label: 'Base (~4)', price: 20, cost: 7.24 },
    { label: 'With Beef or Turkey', price: 35, cost: 14.24 },
    { label: 'With Mushrooms', price: 26, cost: 10.24 },
    { label: 'With Both', price: 41, cost: 17.24 },
  ]},
  { name: 'Pappardelle with Vegetables and Mint', variants: [
    { label: 'Small (~2-3)', price: 30, cost: 15.48 },
    { label: 'Large (~5-6)', price: 55, cost: 30.96 },
  ]},
  { name: 'Saffron Pork Ragu', variants: [
    { label: 'Small (~4 servings)', price: 40, cost: 17.84 },
    { label: 'Large (~8 servings)', price: 75, cost: 35.68 },
    { label: 'Small (~4 servings) + Polenta', price: 48, cost: 23.25 },
    { label: 'Large (~8 servings) + Polenta', price: 90, cost: 46.5 },
  ]},
];

// Default weekly selection (used until a selection is saved from the Week tab)
export const DEFAULT_WEEK = ['Shrimp or Tofu with Asparagus in Black Bean Sauce', 'Thai Basil Chicken (Pad Krapow Gai)', 'Saffron Pork Ragu', 'Mapo Eggplant', 'Gumbo'];

export const ALWAYS_MENU = {
  breakfast: [
    { name: 'Homemade Waffles', variants: [{ label: 'Set of 12', price: 7, cost: 2.78 }] },
  ],
  fruit: [
    { name: 'Fresh Cut Pineapple', variants: [{ label: 'Per Container', price: 6, cost: 2.5 }] },
    { name: 'Seasonal Cantaloupe', variants: [{ label: 'Per Container', price: 6, cost: 3 }] },
  ],
  desserts: [
    { name: 'Chocolate Chip Cookies', variants: [
      { label: '1 Dozen (Standard)', price: 25, cost: 11.33 },
      { label: '1 Dozen (Premium Valrhona)', price: 40, cost: 23.33 },
    ]},
    { name: 'Peanut Butter Fudge', variants: [{ label: '1 Batch', price: 15, cost: 4.35 }] },
  ],
  addons: [
    { name: 'Queso', variants: [
      { label: 'Per Pint Jar', price: 12, cost: 4.87 },
      { label: 'With jar swap', price: 10, cost: 3.62 },
    ]},
    { name: 'Pickled Onions or Carrots', variants: [
      { label: 'Standard', price: 7.5, cost: 4 },
      { label: 'With jar swap', price: 5.5, cost: 2.75 },
    ]},
    { name: 'Chili Oil', variants: [
      { label: 'Per Jar', price: 10, cost: 4.07 },
      { label: 'With jar swap', price: 8, cost: 3.07 },
    ]},
    { name: 'Thyme or Lavender Syrup', variants: [
      { label: 'Per Jar', price: 7, cost: 3.67 },
      { label: 'With jar swap', price: 5, cost: 1.67 },
    ]},
    { name: 'Vanilla Syrup', variants: [
      { label: 'Per Jar', price: 12, cost: 7.17 },
      { label: 'With jar swap', price: 10, cost: 5.17 },
    ]},
    { name: 'Vanilla Lavender Syrup', variants: [
      { label: 'Per Jar', price: 13, cost: 8.17 },
      { label: 'With jar swap', price: 11, cost: 6.17 },
    ]},
  ],
  bag: [
    { name: 'Ribeye', perLb: true, pricePerLb: 25, costPerLb: 19, variants: [{ label: 'price by weight', price: 26.5, cost: 19 }] },
    { name: 'NY Strip', perLb: true, pricePerLb: 23, costPerLb: 17.49, variants: [{ label: 'price by weight', price: 24.5, cost: 17.49 }] },
    { name: 'Filet Mignon', perLb: true, pricePerLb: 34, costPerLb: 24.99, variants: [{ label: 'price by weight', price: 35.5, cost: 24.99 }] },
    { name: 'Chicken Breast', perLb: true, pricePerLb: 9, costPerLb: 6, variants: [{ label: 'price by weight', price: 10.5, cost: 6 }] },
    { name: 'Pork Tenderloin', perLb: true, pricePerLb: 15, costPerLb: 8, variants: [{ label: 'price by weight', price: 16.5, cost: 8 }] },
    { name: 'Carrots', variants: [{ label: '~2 servings', price: 6, cost: 1.83 }] },
    { name: 'Baby Gold Potatoes', variants: [{ label: '~2 servings', price: 7, cost: 2.5 }] },
    { name: 'Corn (off the cob)', variants: [{ label: '~2 servings', price: 7, cost: 2.0 }] },
    { name: 'Parsnips', variants: [{ label: '~2 servings', price: 7, cost: 2.0 }] },
    { name: 'Asparagus', variants: [
      { label: 'Whole (~2 servings)', price: 8, cost: 3.0 },
      { label: 'Bite-size (~2 servings)', price: 8, cost: 3.0 },
    ]},
  ],
  sauces: [
    { name: 'Chimichurri', variants: [{ label: 'Per Container', price: 3, cost: 0.40 }] },
    { name: 'Romesco', variants: [{ label: 'Per Container', price: 4, cost: 0.80 }] },
    { name: 'Chermoula', variants: [{ label: 'Per Container', price: 3, cost: 0.40 }] },
    { name: 'Miso Butter Sauce', variants: [{ label: 'Per Container', price: 3, cost: 0.55 }] },
    { name: 'Whipped Lemon Garlic Herb Butter', variants: [{ label: 'Per Container', price: 3, cost: 0.45 }] },
  ],
};

// Which catalog items are priced by weight (sous vide proteins)
export const PER_LB_ITEMS = {};
ALWAYS_MENU.bag.forEach(it => {
  if (it.perLb) PER_LB_ITEMS[it.name] = { pricePerLb: it.pricePerLb, costPerLb: it.costPerLb };
});
export function isPerLbItem(name) {
  return !!PER_LB_ITEMS[name];
}

// Full catalog (for cost lookups on past orders, whatever week they were from)
export const FULL_MENU = { dinner: ALL_DINNERS, ...ALWAYS_MENU };

// The menu for a given weekly selection
export function buildMenu(selectedDinners) {
  return { dinner: ALL_DINNERS.filter(d => selectedDinners.includes(d.name)), ...ALWAYS_MENU };
}

export const CATEGORY_LABELS = {
  dinner: 'Dinner',
  breakfast: 'Breakfast',
  fruit: 'Fresh Cut Fruit',
  desserts: 'Desserts',
  addons: 'Add-Ons & Extras',
  bag: 'Stuff in a Bag',
};

export const STATUSES = ['Ordered', 'Cooking', 'Ready', 'Delivered'];
export const STATUS_COLORS = {
  Ordered: '#7F77DD',
  Cooking: '#EF9F27',
  Ready: '#1D9E75',
  Delivered: '#5F5E5A',
};

