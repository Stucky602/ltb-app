// Golden behavior snapshot. Run before AND after the registry merge; diff must be empty.
// Captures: per-variant resolved ingredients + costs + drift, all dish maps/sets,
// reheat blocks for every dish x variant + tricky mixed orders, conflict analyses.
import { ALL_DINNERS, ALWAYS_MENU, FULL_MENU, DEFAULT_WEEK, CATEGORY_LABELS, PER_LB_ITEMS } from '../src/menu.js';
import { RECIPES, DINNER_REHEAT_BUCKET, RICE_DISHES, PASTA_DISHES, NOODLE_DISHES, BAGGED_PASTA_DISHES, STEW_VEG_COPY, SOUS_VIDE_VEG, buildReheatBlocks, generateShoppingItems } from '../src/recipes.js';
import { resolveDishVariant, costDishVariant, baselineCostMap, LINE_MAP, MARGIN_BUFFER, trueRawCost } from '../src/dishCosting.js';
import { DISH_EQUIPMENT, analyzeConflicts } from '../src/equipmentConflict.js';
import { DISH_CUISINE } from '../src/utils.js';
import fs from 'fs';

const base = baselineCostMap();
const snap = {};

// 1. Costing: every dinner + always-menu variant, resolved + costed at baseline
snap.costing = {};
const allItems = [...ALL_DINNERS];
for (const cat of Object.keys(ALWAYS_MENU)) allItems.push(...ALWAYS_MENU[cat]);
for (const d of allItems) {
  for (const v of d.variants) {
    const key = `${d.name} :: ${v.label}`;
    const resolved = resolveDishVariant(d.name, v.label);
    snap.costing[key] = {
      price: v.price, anchor: v.cost,
      resolved: resolved ? resolved.map(r => ({ id: r.id, qty: Math.round(r.qty * 1e6) / 1e6, fixed: r.fixed })).sort((a, b) => a.id.localeCompare(b.id)) : null,
      cost: costDishVariant(d.name, v.label, v.cost, base, base),
    };
  }
}

// 2. All the dish-identity maps and sets, verbatim
snap.maps = {
  DINNER_REHEAT_BUCKET,
  RICE_DISHES: [...RICE_DISHES].sort(),
  PASTA_DISHES: [...PASTA_DISHES].sort(),
  NOODLE_DISHES: [...NOODLE_DISHES].sort(),
  BAGGED_PASTA_DISHES: [...BAGGED_PASTA_DISHES].sort(),
  STEW_VEG_COPY,
  SOUS_VIDE_VEG,
  DISH_EQUIPMENT,
  DISH_CUISINE,
  DEFAULT_WEEK, CATEGORY_LABELS, PER_LB_ITEMS,
  RECIPE_KEYS: Object.keys(RECIPES).sort(),
  LINE_MAP_KEYS: Object.keys(LINE_MAP).sort(),
  MARGIN_BUFFER,
  trueRaw_100: trueRawCost(100),
};

// 3. Menu structure verbatim
snap.menu = { ALL_DINNERS, ALWAYS_MENU_KEYS: Object.keys(ALWAYS_MENU), FULL_MENU_KEYS: Object.keys(FULL_MENU) };

// 4. Reheat blocks: every dish x every variant as a single-item order
snap.reheat_single = {};
for (const d of allItems) {
  for (const v of d.variants) {
    const blocks = buildReheatBlocks({ items: [{ name: d.name, variant: v.label, qty: 1 }] });
    snap.reheat_single[`${d.name} :: ${v.label}`] = blocks;
  }
}

// 5. Reheat blocks: the tricky mixed orders (per-dish special-case coverage)
const mixed = {
  ragu_mixed: [{ name: 'Saffron Pork Ragu', variant: 'Small (~4 servings)', qty: 1 }, { name: 'Saffron Pork Ragu', variant: 'Large (~8 servings) + Polenta', qty: 1 }],
  ragu_polenta_only: [{ name: 'Saffron Pork Ragu', variant: 'Small (~4 servings) + Polenta', qty: 1 }],
  cumin_mixed: [{ name: 'Cumin Mushroom Noodles / Cumin Beef on Rice', variant: 'Small (~3-4)', qty: 1 }, { name: 'Cumin Mushroom Noodles / Cumin Beef on Rice', variant: 'Beef, Large (~6-8)', qty: 1 }],
  boeuf_leblanc: [{ name: 'Boeuf Bourguignon (Beef Stew)', variant: '~6 servings', qty: 1 }, { name: 'Leblanc Inspired Japanese Curry', variant: 'Small (split order, ~4)', qty: 1 }],
  mega: [
    ...ALL_DINNERS.map(d => ({ name: d.name, variant: d.variants[0].label, qty: 1 })),
    { name: 'Saffron Pork Ragu', variant: 'Large (~8 servings) + Polenta', qty: 1 },
    { name: 'Cumin Mushroom Noodles / Cumin Beef on Rice', variant: 'Beef, Small (~3-4)', qty: 1 },
    { name: 'Queso', variant: 'Per Pint Jar', qty: 1 },
    { name: 'Ribeye', variant: 'price by weight', qty: 1, weight: 1.3 },
    { name: 'Carrots', variant: '~2 servings', qty: 1 },
    { name: 'Asparagus', variant: 'Whole (~2 servings)', qty: 1 },
  ],
};
snap.reheat_mixed = {};
for (const [k, items] of Object.entries(mixed)) snap.reheat_mixed[k] = buildReheatBlocks({ items });

// 6. Shopping list for the mega order (staples on and off)
snap.shopping_mega = generateShoppingItems([{ items: mixed.mega }], false);
snap.shopping_mega_staples = generateShoppingItems([{ items: mixed.mega }], true);

// 7. Conflict analyses for representative weeks
const weeks = {
  all: ALL_DINNERS.map(d => d.name),
  default_week: DEFAULT_WEEK,
  dutch_jam: ['Gumbo', 'Mapo Eggplant'],
  oven_clash: ['Bo Ssam', 'Chocolate Chip Cookies'],
  braise_pair: ['Boeuf Bourguignon (Beef Stew)', 'Leblanc Inspired Japanese Curry'],
  pot_pileup: ['Chili', 'Thai Basil Chicken (Pad Krapow Gai)', 'Shrimp or Tofu with Asparagus in Black Bean Sauce'],
  flex_relief: ['Gumbo', 'Bolognese', 'Indian Style Curry'],
  tofu_polenta: ['Saffron Pork Ragu', 'Stir Fried Long Beans with Ground Pork or Tofu'],
};
snap.conflicts = {};
for (const [k, names] of Object.entries(weeks)) snap.conflicts[k] = analyzeConflicts(names);

const out = process.argv[2] || 'tests/golden.json';
fs.writeFileSync(out, JSON.stringify(snap, null, 1));
console.log('Snapshot written to', out,
  '| costing keys:', Object.keys(snap.costing).length,
  '| reheat singles:', Object.keys(snap.reheat_single).length);
