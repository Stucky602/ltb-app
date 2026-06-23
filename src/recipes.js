// Recipes (per-batch ingredients), shopping list generation, and per-order reheat blocks.
import { ALL_DINNERS, ALWAYS_MENU, PER_LB_ITEMS, isPerLbItem } from './menu.js';

// ═══════════════════════════════════════════════════════════════════════════
// RECIPES — per-batch ingredients for shopping list generation.
// "staple: true" = pantry items Kevin keeps stocked (skipped unless toggled on).
// "factors" maps each menu variant to a batch multiplier of the base recipe.
// "extras" adds variant-specific ingredients (scaled by the same factor).
// ═══════════════════════════════════════════════════════════════════════════
export const I = (name, q, u, staple = false) => ({ name, q, u, staple });

export const RECIPES = {
  'Indian Style Curry': {
    factors: {
      'Chickpea, Small (~4-5)': 0.5, 'Chicken, Small (~4-5)': 0.5, 'Shrimp, Small (~4-5)': 0.5,
      'Chickpea, Large (~8-10)': 1, 'Chicken, Large (~8-10)': 1, 'Shrimp, Large (~8-10)': 1,
    },
    base: [
      I('Canned tomatoes', 1, '28oz can'),
      I('Red onion', 28, 'oz'),
      I('Butter', 2, 'sticks'),
      I('Kitchen Basics chicken stock', 32, 'oz'),
      I('Limes', 2, ''),
      I('Weekly vegetables + chickpeas', 1, 'lb'),
      I('Mix of spicy peppers', 1, 'handful'),
      I('Curry powder', 0.25, 'cup', true),
      I('Brown sugar', 2, 'tbsp', true),
      I('Rice (included with order)', 1, 'batch', true),
    ],
    extras: {
      'Chicken, Small (~4-5)': [I('Chicken thighs', 1, 'lb')],
      'Chicken, Large (~8-10)': [I('Chicken thighs', 1, 'lb')],
      'Shrimp, Small (~4-5)': [I('Shrimp', 1, 'lb')],
      'Shrimp, Large (~8-10)': [I('Shrimp', 1, 'lb')],
    },
  },
  'Texas Gulf Shrimp or Tofu and Chinese Broccoli': {
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
  'Cumin Mushroom Noodles': {
    factors: {
      'Small (~3-4)': 0.5, 'Large (~6-8)': 1,
      'Small (~3-4) + Asian Greens (1/2 lb)': 0.5, 'Large (~6-8) + Asian Greens (1 lb)': 1,
    },
    base: [
      I('Mushrooms', 3, 'lb'),
      I('Garlic', 16, 'cloves'),
      I('Ginger', 4, 'knobs'),
      I('Red onion (large)', 2, ''),
      I('Cilantro', 1, 'bunch'),
      I('Fresh noodles (not dried)', 1, 'batch'),
      I('Cumin + spices', 1, 'blend', true),
      I('Chinkiang vinegar', 6, 'tbsp', true),
      I('Shaoxing wine', 0.5, 'cup', true),
      I('House chili oil', 1, 'cup', true),
    ],
    extras: {
      'Small (~3-4) + Asian Greens (1/2 lb)': [{ ...I('Asian greens', 0.5, 'lb'), fixed: true }],
      'Large (~6-8) + Asian Greens (1 lb)': [{ ...I('Asian greens', 1, 'lb'), fixed: true }],
    },
  },
  'Bolognese': {
    factors: {
      'Small (split order, ~4)': 0.5, 'Large (~8)': 1,
      'Small (split order, ~4) + Egg Pappardelle': 0.5, 'Large (~8) + Egg Pappardelle': 1,
    },
    base: [
      I('Ground pork', 1, 'lb'),
      I('Ground lamb', 1, 'lb'),
      I('Ground beef', 1, 'lb'),
      I('Whole milk', 1, 'cup'),
      I('Red wine', 1, 'bottle'),
      I('Tomato paste', 1, 'small can'),
      I('Fresh thyme', 1, 'bunch'),
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
  'Shrimp or Tofu with Asparagus in Black Bean Sauce': {
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
  'Thai Basil Chicken (Pad Krapow Gai)': {
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
  'Pasta with Homegrown Tomato Sauce': {
    factors: { 'Base (~4)': 1, 'With Beef or Turkey': 1, 'With Mushrooms': 1, 'With Both': 1 },
    base: [
      I('Homegrown tomatoes', 2, 'lb'),
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
  'Tex-Mex Kit': {
    factors: {
      'Pulled Pork, Small (~5-6)': 1, 'Pulled Pork, Large (~9-10)': 2,
      'Pulled Beef, Small (~5-6)': 1, 'Pulled Beef, Large (~9-10)': 2,
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
  'Brunswick Stew': {
    factors: { 'Small (~4)': 1, 'Large (~8)': 2 },
    base: [
      I('Chicken thighs', 1, 'lb'),
      I('Salt pork', 2, 'oz'),
      I('Chicken stock', 4, 'cups'),
      I('Canned peeled tomatoes', 1, '14oz can'),
      I('Red potatoes', 0.5, 'lb'),
      I('Onion', 1, 'lb'),
      I('Corn', 3, 'ears'),
      I('Dried lima beans', 5, 'oz'),
      I('Worcestershire + vinegar + flour', 1, 'batch', true),
    ],
  },
  'Boeuf Bourguignon (Beef Stew)': {
    factors: { '~6 servings': 1, 'With 1 lb mushrooms': 1 },
    base: [
      I('Beef chuck roast', 2.5, 'lb'),
      I('Red potatoes', 1.5, 'lb'),
      I('Carrots', 1.5, 'lb'),
      I('Red wine', 1, 'bottle'),
      I('Beef stock', 8, 'cups'),
      I('Fresh thyme', 1, 'bunch'),
      I('Tomato paste', 1, 'small can'),
      I('Onion', 1, 'lb'),
      I('Bay + salt + pepper + vinegar', 1, 'batch', true),
    ],
    extras: {
      'With 1 lb mushrooms': [I('Mushrooms', 1, 'lb')],
    },
  },
  'Chili': {
    factors: { 'Small (split order, ~3-4)': 0.5, 'Large (~6-8)': 1 },
    base: [
      I('Ground beef', 2, 'lb'),
      I('Dried kidney beans', 1, 'lb'),
      I('Assorted dried chilis', 1, 'bag'),
      I('Chicken broth', 4, 'cups'),
      I('Canned tomatoes', 1, '28oz can'),
      I('Dark chocolate', 1, 'oz'),
      I('Anchovies', 1, 'tin'),
      I('Tomato paste', 1, 'small can'),
      I('Limes', 1, ''),
      I('Espresso + bourbon + marmite + soy + spices', 1, 'batch', true),
    ],
  },
  'Homemade Waffles': {
    factors: { 'Set of 12': 1 },
    base: [
      I('Milk', 2, 'cups'),
      I('Butter', 1, 'stick'),
      I('Flour', 270, 'g', true),
      I('Eggs', 2, '', true),
      I('Gallon ziplock bag', 1, '', true),
    ],
  },
  'Fresh Cut Pineapple': {
    factors: { 'Per Container': 0.5 },
    base: [I('Pineapple (1 makes 2 containers)', 1, '')],
  },
  'Seasonal Cantaloupe': {
    factors: { 'Per Container': 1 },
    base: [I('Seasonal cantaloupe (HEB melons)', 1, '')],
  },
  'Chocolate Chip Cookies': {
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
  'Peanut Butter Fudge': {
    factors: { '1 Batch': 1 },
    base: [
      I('Peanut butter', 0.5, 'cup'),
      I('Evaporated milk', 0.75, 'cup'),
      I('Butter', 3, 'tbsp'),
      I('Sugar + karo + cocoa + vanilla', 1, 'batch', true),
    ],
  },
  'Queso': {
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
  'Pickled Onions or Carrots': {
    factors: { 'Standard': 1, 'With jar swap': 1 },
    base: [
      I('Onions or carrots (for pickling)', 1, 'lb'),
      I('Pint mason jar', 1, ''),
      I('Pickling vinegar + spices', 1, 'batch', true),
    ],
  },
  'Chili Oil': {
    factors: { 'Per Jar': 0.5, 'With jar swap': 0.5 },
    base: [
      I('Ginger', 4, 'knobs'),
      I('Pint mason jar', 2, ''),
      I('Chili flakes + whole spices + oil', 1, 'batch', true),
    ],
  },
  'Thyme or Lavender Syrup': {
    factors: { 'Per Jar': 1, 'With jar swap': 1 },
    base: [
      I('Fresh thyme or lavender', 1, 'bunch'),
      I('Pint mason jar', 1, ''),
      I('Sugar', 1, 'cup', true),
    ],
  },
  'Vanilla Syrup': {
    factors: { 'Per Jar': 1, 'With jar swap': 1 },
    base: [
      I('Pint mason jar', 1, ''),
      I('House vanilla extract + beans', 1, 'batch', true),
      I('Sugar', 1, 'cup', true),
    ],
  },
  'Vanilla Lavender Syrup': {
    factors: { 'Per Jar': 1, 'With jar swap': 1 },
    base: [
      I('Fresh lavender', 1, 'bunch'),
      I('Pint mason jar', 1, ''),
      I('House vanilla extract + beans', 1, 'batch', true),
      I('Sugar', 1, 'cup', true),
    ],
  },
  'Ribeye': {
    factors: { 'price by weight': 1 },
    base: [I('Ribeye', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)],
  },
  'NY Strip': {
    factors: { 'price by weight': 1 },
    base: [I('NY Strip', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)],
  },
  'Filet Mignon': {
    factors: { 'price by weight': 1 },
    base: [I('Filet Mignon', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)],
  },
  'Chicken Breast': {
    factors: { 'price by weight': 1 },
    base: [I('Chicken breast', 1, 'lb'), I('Sous vide bag + seasonings', 1, '', true)],
  },
  'Baby Gold Potatoes': {
    factors: { '2 servings': 1 },
    base: [I('Baby gold potatoes', 0.6, 'lb'), I('Sous vide bag + seasonings', 1, '', true)],
  },
  'Carrots': {
    factors: { '2 servings': 1 },
    base: [I('Carrots', 0.6, 'lb'), I('Sous vide bag + seasonings', 1, '', true)],
  },
  'Pork Tenderloin': {
    factors: { 'price by weight': 1 },
    base: [I('Pork tenderloin', 1.25, 'lb'), I('Sous vide bag + seasonings', 1, '', true)],
  },
  'Saffron Pork Ragu': {
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
      I('Pasta (ask customer for shape!)', 1, 'lb'),
    ],
    extras: {
      'Small (~4 servings) + Polenta': [I('Polenta + butter + parmesan (bagged)', 1, 'batch')],
      'Large (~8 servings) + Polenta': [I('Polenta + butter + parmesan (bagged)', 1, 'batch')],
    },
  },
  'Mapo Eggplant': {
    factors: { 'Small (~5-6 servings)': 1, 'Large (~10-12 servings)': 2 },
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
  'Gumbo': {
    factors: { 'Small (split order, ~3-4)': 0.5, 'Large (~7-8)': 1 },
    base: [
      I('Chicken thighs', 2, 'lb'),
      I('Boudin', 1, 'lb'),
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
  'Stir Fried Long Beans with Ground Pork': {
    factors: {
      'Small (~4), Ground Pork': 0.5, 'Large (~8), Ground Pork': 1,
      'Small (~4), Tofu': 0.5, 'Large (~8), Tofu': 1,
    },
    base: [
      I('Long beans', 1.5, 'lb'),
      I('Doubanjiang', 2, 'tbsp'),
      I('Garlic', 6, 'cloves'),
      I('Scallions', 1, 'bunch'),
      I('Soy sauce', 2, 'tbsp', true),
      I('Rice (included with order)', 1, 'batch', true),
    ],
    extras: {
      'Small (~4), Ground Pork': [I('Ground pork', 1, 'lb')],
      'Large (~8), Ground Pork': [I('Ground pork', 1, 'lb')],
      'Small (~4), Tofu': [I('Tofu', 1, 'block')],
      'Large (~8), Tofu': [I('Tofu', 1, 'block')],
    },
  },
  'Leblanc Inspired Japanese Curry': {
    factors: { 'Small (split order, ~4)': 0.5, 'Large (~8)': 1 },
    base: [
      I('Wagyu london broil', 1.25, 'lb'),
      I('Kabocha squash', 1, 'lb'),
      I('Carrots', 1, 'lb'),
      I('Onion', 1, ''),
      I('Apple', 1, ''),
      I('Ginger', 1, 'knob'),
      I('Red wine', 1, 'cup'),
      I('Beef stock', 4, 'cups'),
      I('100% dark chocolate', 1, 'square'),
      I('Espresso', 1, 'shot'),
      I('Curry spice blend', 1, 'batch', true),
      I('Honey + fish sauce + butter', 1, 'batch', true),
      I('Bay leaf', 1, '', true),
      I('Rice (included with order)', 1, 'batch', true),
    ],
  },
  'Pappardelle with Vegetables and Mint': {
    factors: { 'Small (split order, ~3-4)': 0.5, 'Large (~6-7)': 1 },
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
};

// Normalize an ingredient name so near-duplicates merge:
// lowercase, strip trailing parenthetical notes, singularize simple plurals,
// collapse whitespace, and map a few known synonyms.
export const INGREDIENT_SYNONYMS = {
  'scallion': 'green onion',
  'scallions': 'green onion',
  'spring onion': 'green onion',
  'coriander': 'cilantro',
  'chili': 'chile',
  'chilli': 'chile',
};
export function normalizeIngredientName(name) {
  let n = String(name).toLowerCase().trim();
  n = n.replace(/\s*\(.*?\)\s*/g, ' ').trim(); // drop parentheticals
  n = n.replace(/\s+/g, ' ');
  // word-level synonym + naive singularization
  n = n.split(' ').map(w => {
    if (INGREDIENT_SYNONYMS[w]) return INGREDIENT_SYNONYMS[w];
    if (w.length > 4 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    return w;
  }).join(' ');
  return INGREDIENT_SYNONYMS[n] || n;
}

// Aggregate ingredients across all active orders into shopping list lines
export function generateShoppingItems(activeOrders, includeStaples) {
  const agg = new Map(); // normKey -> { display, u, q, staple }
  const unknown = [];

  const addIng = (name, qty, unit, staple, factor) => {
    const norm = normalizeIngredientName(name);
    // Singularize the unit too so '2 knobs' and '1 knob' use the same bucket
    const normUnit = unit.length > 3 && unit.endsWith('s') && !unit.endsWith('ss') ? unit.slice(0, -1) : unit;
    const key = `${norm}|${normUnit}`;
    if (!agg.has(key)) agg.set(key, { display: name, u: unit, q: 0, staple });
    agg.get(key).q += qty * factor;
  };

  activeOrders.forEach(o => {
    (o.items || []).forEach(it => {
      // Sous vide proteins priced by weight: use the actual requested weight
      if (isPerLbItem(it.name)) {
        const lbs = (typeof it.weight === 'number' && it.weight > 0 ? it.weight : 1) * it.qty;
        addIng(it.name, lbs, 'lb', false, 1);
        if (includeStaples) addIng('Sous vide bag + seasonings', 1, '', true, it.qty);
        return;
      }
      const recipe = RECIPES[it.name];
      if (!recipe) {
        unknown.push(`${it.qty}x ${it.name} (${it.variant}) — no recipe data, plan manually`);
        return;
      }
      const factor = (recipe.factors?.[it.variant] ?? 1) * it.qty;
      const ings = [...(recipe.base || []), ...((recipe.extras || {})[it.variant] || [])];
      ings.forEach(ing => {
        if (ing.staple && !includeStaples) return;
        // fixed extras (e.g. Asian Greens) are always 1 lb per order regardless of batch size
        addIng(ing.name, ing.q, ing.u, ing.staple, ing.fixed ? it.qty : factor);
      });
    });
  });

  const fmtQ = (q) => String(Math.round(q * 100) / 100);

  const lines = Array.from(agg.values())
    .sort((a, b) => (a.staple === b.staple ? a.display.localeCompare(b.display) : a.staple ? 1 : -1))
    .map(x => {
      const qty = x.u ? `${fmtQ(x.q)} ${x.u}` : fmtQ(x.q);
      return `${x.display} — ${qty}${x.staple ? ' (staple)' : ''}`;
    });

  return [...lines, ...unknown];
}

// ═══════════════════════════════════════════════════════════════════════════
// REHEAT INSTRUCTIONS — groups a customer's reheatable items into shared
// method buckets and renders copy/paste-ready instructions (one image per
// order, mirroring the invoice share flow).
//
// Each dinner maps to a bucket id. Items in the same bucket are listed
// together under one shared instruction block. Sous vide proteins, sous vide
// vegetables, and queso are handled by their own dedicated buckets.
// Non-reheatable items (fruit, desserts, syrups, sauces, pickles, etc.) are
// simply omitted.
// ═══════════════════════════════════════════════════════════════════════════

// Sous vide vegetable names (from ALWAYS_MENU.bag, the non-perLb entries).
export const SOUS_VIDE_VEG = ['Carrots', 'Baby Gold Potatoes', 'Corn (off the cob)', 'Parsnips', 'Asparagus'];

// Dinner → reheat bucket id.
export const DINNER_REHEAT_BUCKET = {
  // Bagged dishes — reheated sealed in simmering water
  'Shrimp or Tofu with Asparagus in Black Bean Sauce': 'bagged',
  'Texas Gulf Shrimp or Tofu and Chinese Broccoli': 'bagged',
  'Thai Basil Chicken (Pad Krapow Gai)': 'bagged',
  'Stir Fried Long Beans with Ground Pork': 'bagged',
  'Pappardelle with Vegetables and Mint': 'bagged',
  // Stovetop in a container — warm gently, splash of water if thick
  'Mapo Eggplant': 'stovetop',
  'Gumbo': 'stovetop',
  'Brunswick Stew': 'stovetop',
  'Chili': 'stovetop',
  'Boeuf Bourguignon (Beef Stew)': 'stovetop',
  'Indian Style Curry': 'stovetop',
  'Leblanc Inspired Japanese Curry': 'stovetop',
  // Pasta / noodle dishes — cook fresh, warm the sauce
  'Bolognese': 'pasta',
  'Pasta with Homegrown Tomato Sauce': 'pasta',
  'Saffron Pork Ragu': 'pasta',
  'Cumin Mushroom Noodles': 'pasta',
  // Tex-Mex Kit — components, assemble at home
  'Tex-Mex Kit': 'kit',
};

// Dishes that include uncooked rice with the order.
export const RICE_DISHES = new Set([
  'Shrimp or Tofu with Asparagus in Black Bean Sauce',
  'Texas Gulf Shrimp or Tofu and Chinese Broccoli',
  'Thai Basil Chicken (Pad Krapow Gai)',
  'Stir Fried Long Beans with Ground Pork',
  'Mapo Eggplant',
  'Gumbo',
  'Indian Style Curry',
  'Leblanc Inspired Japanese Curry',
]);
// Dishes that include uncooked pasta/noodles.
export const PASTA_DISHES = new Set(['Bolognese', 'Pasta with Homegrown Tomato Sauce', 'Saffron Pork Ragu']);
export const NOODLE_DISHES = new Set(['Cumin Mushroom Noodles']);
// Bagged dishes whose reheat ends with "mix with cooked pasta" instead of "plate"
export const BAGGED_PASTA_DISHES = new Set(['Pappardelle with Vegetables and Mint']);

// Build the grouped reheat blocks for an order. Returns an array of
// { title, dishes: [names], body: '...' } ready to render.
export function buildReheatBlocks(order) {
  const items = (order.items || []);
  const blocks = [];

  // Collect dish names by bucket (dedup, preserve first-seen order)
  const byBucket = { bagged: [], stovetop: [], pasta: [], kit: [] };
  const proteins = [];
  const veg = [];
  let hasQueso = false;

  const seen = new Set();
  items.forEach(it => {
    const name = it.name;
    if (seen.has(name)) return;
    if (isPerLbItem(name)) { proteins.push(name); seen.add(name); return; }
    if (SOUS_VIDE_VEG.includes(name)) { veg.push(name); seen.add(name); return; }
    if (name === 'Queso') { hasQueso = true; seen.add(name); return; }
    const b = DINNER_REHEAT_BUCKET[name];
    if (b && byBucket[b]) { byBucket[b].push(name); seen.add(name); }
  });

  // Helper: does a list of dish names include any rice dish? any pasta? noodle?
  const listHasRice = (names) => names.some(n => RICE_DISHES.has(n));
  const listHasPasta = (names) => names.some(n => PASTA_DISHES.has(n));
  const listHasNoodle = (names) => names.some(n => NOODLE_DISHES.has(n));

  // ── Bagged dishes ──────────────────────────────────────────────────────
  if (byBucket.bagged.length) {
    const regularBagged = byBucket.bagged.filter(n => !BAGGED_PASTA_DISHES.has(n));
    const baggedPasta = byBucket.bagged.filter(n => BAGGED_PASTA_DISHES.has(n));

    if (regularBagged.length) {
      let body = 'Bring a pot of water to a gentle simmer and place the sealed bag in until heated through, then cut open and plate. Microwave or stovetop work too if you prefer. See the main menu for additional details.';
      if (listHasRice(regularBagged)) body += ' Cook the included rice fresh.';
      blocks.push({ title: 'Reheat in the bag', dishes: regularBagged, body });
    }

    if (baggedPasta.length) {
      blocks.push({
        title: 'Reheat in the bag (pasta)',
        dishes: baggedPasta,
        body: 'Bring a pot of water to a gentle simmer and place the sealed bag in until heated through, then cut open and mix with cooked pasta.',
      });
    }
  }

  // ── Stovetop in a container ────────────────────────────────────────────
  if (byBucket.stovetop.length) {
    let body = 'Comes in a container. Warm gently on the stove over medium-low until heated through. If it looks a little thick, add a splash of water to loosen it.';
    if (listHasRice(byBucket.stovetop)) body += ' Cook the included rice fresh.';
    blocks.push({ title: 'Reheat on the stovetop', dishes: byBucket.stovetop, body });
  }

  // ── Pasta / noodle dishes ──────────────────────────────────────────────
  if (byBucket.pasta.length) {
    const hasP = listHasPasta(byBucket.pasta);
    const hasN = listHasNoodle(byBucket.pasta);
    const carb = hasP && hasN ? 'pasta/noodles' : hasN ? 'noodles' : 'pasta';
    let body = `Cook the included ${carb} fresh. Warm the sauce gently on the stove, adding a splash of pasta water to loosen if needed, then toss together.`;
    blocks.push({ title: 'Cook fresh, warm the sauce', dishes: byBucket.pasta, body });
  }

  // ── Tex-Mex Kit ────────────────────────────────────────────────────────
  if (byBucket.kit.length) {
    blocks.push({
      title: 'Assemble at home',
      dishes: byBucket.kit,
      body: 'Components travel separately with assembly notes. Warm the protein gently before building.',
    });
  }

  // ── Sous vide proteins (unified sear block) ────────────────────────────
  if (proteins.length) {
    blocks.push({
      title: 'Sear the proteins',
      dishes: proteins,
      body: 'Already cooked through, they just need a sear. Pat dry, then sear in a hot pan with a little oil until a nice crust forms on each side. Rest a few minutes before slicing.',
    });
  }

  // ── Sous vide vegetables (two finishing options) ───────────────────────
  if (veg.length) {
    blocks.push({
      title: 'Reheat the vegetables',
      dishes: veg,
      body: 'Bring a pot of water to a gentle simmer and place the sealed bag in until heated through. Plate as-is, or, if you have a few extra minutes, strain the liquid from the bag into a pan and reduce it down into a glaze to spoon over the top.',
    });
  }

  // ── Queso (verbatim) ───────────────────────────────────────────────────
  if (hasQueso) {
    blocks.push({
      title: 'Reheat the queso',
      dishes: ['Queso'],
      body: 'Remove the lid and microwave at 50% power for 5 minutes. This should loosen it enough to transfer to a sauce pot, then heat on low until it reaches the temperature you want. You can keep microwaving at 50% power instead, but the stovetop finish is the better way to go.',
    });
  }

  return blocks;
}

