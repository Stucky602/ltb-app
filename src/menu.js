// Master catalog — DERIVED from the dish registry (src/dishes.js).
// ═══════════════════════════════════════════════════════════════════════════
// Dish data (names, variants, prices, cost anchors) lives in dishes.js — the
// single source of truth. This module keeps its public exports byte-compatible
// (ALL_DINNERS, ALWAYS_MENU, FULL_MENU, buildMenu, ...) so nothing downstream
// changes. To add or edit a dish: edit dishes.js, not this file.
// ═══════════════════════════════════════════════════════════════════════════
import { DISHES, ALWAYS_ITEMS } from './dishes.js';

// Dinners: { name, variants } in registry order.
export const ALL_DINNERS = DISHES.map(d => ({ name: d.name, variants: d.variants }));

// Always-available items by category, same shapes as before (perLb items keep
// their pricePerLb/costPerLb fields).
export const ALWAYS_MENU = {};
for (const [cat, items] of Object.entries(ALWAYS_ITEMS)) {
  ALWAYS_MENU[cat] = items.map(it => it.perLb
    ? { name: it.name, perLb: true, pricePerLb: it.pricePerLb, costPerLb: it.costPerLb, avgWeightLb: it.avgWeightLb, variants: it.variants }
    : { name: it.name, variants: it.variants });
}

// Default weekly selection (used until a selection is saved from the Week tab)
export const DEFAULT_WEEK = ['Shrimp or Tofu with Asparagus in Black Bean Sauce', 'Thai Basil Chicken (Pad Krapow Gai)', 'Saffron Pork Ragu', 'Mapo Eggplant', 'Gumbo'];

// Which catalog items are priced by weight (sous vide proteins)
export const PER_LB_ITEMS = {};
ALWAYS_MENU.bag.forEach(it => {
  if (it.perLb) PER_LB_ITEMS[it.name] = { pricePerLb: it.pricePerLb, costPerLb: it.costPerLb, avgWeightLb: it.avgWeightLb };
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
