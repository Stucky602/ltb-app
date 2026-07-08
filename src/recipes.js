// Recipe aggregation (shopping list) and per-order reheat blocks.
// ═══════════════════════════════════════════════════════════════════════════
// Per-dish DATA (recipes, reheat buckets, rice/pasta/noodle membership, stew
// veg copy) lives in the dish registry (src/dishes.js) and is DERIVED here.
// This module keeps the same public exports as before (RECIPES, RICE_DISHES,
// DINNER_REHEAT_BUCKET, buildReheatBlocks, ...) so nothing downstream changes.
// The LOGIC (shopping aggregation, reheat card assembly with all its per-dish
// special cases) still lives here. To add/edit a dish: edit dishes.js.
// ═══════════════════════════════════════════════════════════════════════════
import { ALL_DINNERS, ALWAYS_MENU, PER_LB_ITEMS, isPerLbItem } from './menu.js';
import { DISHES, ALL_ALWAYS_ITEMS, I } from './dishes.js';

// Recipe-line helper — now defined in dishes.js; re-exported for compatibility.
export { I };

// RECIPES — per-batch ingredients for shopping list generation, keyed by dish
// name. "staple: true" = pantry items Kevin keeps stocked (skipped unless
// toggled on). "factors" maps each menu variant to a batch multiplier of the
// base recipe. "extras" adds variant-specific ingredients (scaled by the same
// factor). Assembled from the registry: dinners first, then always-menu items.
export const RECIPES = {};
DISHES.forEach(d => { if (d.recipe) RECIPES[d.name] = d.recipe; });
ALL_ALWAYS_ITEMS.forEach(it => { if (it.recipe) RECIPES[it.name] = it.recipe; });

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

// ── All the per-dish reheat/starch identity data below is DERIVED from the
// dish registry (dishes.js). Rename or add a dish there; these follow. ──────

// Dinner → reheat bucket id ('bagged' | 'stovetop' | 'pasta' | 'kit').
export const DINNER_REHEAT_BUCKET = {};
DISHES.forEach(d => { if (d.reheat) DINNER_REHEAT_BUCKET[d.name] = d.reheat; });

// Dishes that include uncooked rice with the order.
export const RICE_DISHES = new Set(DISHES.filter(d => d.rice).map(d => d.name));
// Dishes that include uncooked pasta/noodles.
export const PASTA_DISHES = new Set(DISHES.filter(d => d.pasta).map(d => d.name));
export const NOODLE_DISHES = new Set(DISHES.filter(d => d.noodle).map(d => d.name));
// Bagged dishes whose reheat ends with "mix with cooked pasta" instead of "plate"
export const BAGGED_PASTA_DISHES = new Set(DISHES.filter(d => d.baggedPasta).map(d => d.name));

// Stovetop dishes with a separate sous vide veg bag get fully dedicated cards
// (main + veg bag), never the shared generic stovetop block — each one's title
// is its own dish name, never combined with another dish on the same card.
export const STEW_VEG_COPY = {};
DISHES.forEach(d => { if (d.stewVegCopy) STEW_VEG_COPY[d.name] = d.stewVegCopy; });

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
  let hasBoSsam = false;

  const seen = new Set();

  // Saffron Pork Ragu's starch is variant-dependent (Polenta REPLACES pasta,
  // never both), so this has to be resolved by scanning every line item for
  // this dish up front — the dedup loop below only looks at the first
  // occurrence of each dish name, which would silently miss a second Ragu
  // line item with a different variant (e.g. one Small plain + one Large +
  // Polenta in the same order).
  let hasPolenta = false;
  let raguNeedsPasta = false;
  items.forEach(it => {
    if (it.name !== 'Saffron Pork Ragu') return;
    if (it.variant && it.variant.includes('Polenta')) hasPolenta = true;
    else raguNeedsPasta = true;
  });

  // Mushroom Ragu — same variant-dependent starch as Saffron Ragu (Polenta
  // REPLACES the egg pappardelle), but it gets its own dedicated cards with
  // its own wording rather than the shared generic pasta text. Up-front scan
  // so a mixed pasta + polenta order keeps both cards.
  let mushroomRaguPasta = false;
  let mushroomRaguPolenta = false;
  items.forEach(it => {
    if (it.name !== 'Mushroom Ragu') return;
    if (it.variant && it.variant.includes('Polenta')) mushroomRaguPolenta = true;
    else mushroomRaguPasta = true;
  });

  // Pork with Mustard Tarragon Cream Sauce — dedicated 3-part card (sear the
  // sous vide pork, warm the sauce, cook the taglierini fresh).
  let porkMustardOrdered = items.some(it => it.name === 'Pork with Mustard Tarragon Cream Sauce');

  // Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice: the Beef/Lamb
  // noodles for rice, so they need their own rice-cooking instructions
  // instead of being lumped into the shared noodle/pasta bucket text. Same
  // up-front full-item scan as Ragu above, so a mixed order (one noodle
  // variant + one beef variant) keeps both cards.
  const CUMIN_DUAL = 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice';
  let cuminNoodleOrdered = false;
  let cuminMeatOnRiceOrdered = false;
  items.forEach(it => {
    if (it.name !== CUMIN_DUAL) return;
    if (it.variant && /^(beef|lamb),/i.test(it.variant)) cuminMeatOnRiceOrdered = true;
    else cuminNoodleOrdered = true;
  });

  items.forEach(it => {
    const name = it.name;
    if (seen.has(name)) return;
    if (isPerLbItem(name)) { proteins.push(name); seen.add(name); return; }
    if (SOUS_VIDE_VEG.includes(name)) { veg.push(name); seen.add(name); return; }
    if (name === 'Queso') { hasQueso = true; seen.add(name); return; }
    if (name === 'Bo Ssam') { hasBoSsam = true; seen.add(name); return; }
    if (name === 'Saffron Pork Ragu') {
      // Only goes in the shared pasta card if at least one ordered batch
      // actually includes pasta; a Polenta-only order gets no pasta card at
      // all for this dish (it never had pasta to cook).
      seen.add(name);
      if (raguNeedsPasta) byBucket.pasta.push(name);
      return;
    }
    if (name === CUMIN_DUAL) {
      // Same idea: only goes in the shared noodle/pasta card when a noodle
      // variant was actually ordered. The Beef variant gets its own card
      // (added near Bo Ssam's dedicated block below).
      seen.add(name);
      if (cuminNoodleOrdered) byBucket.pasta.push(name);
      return;
    }
    if (name === 'Mushroom Ragu') {
      // Dedicated cards (below), never the shared generic pasta text.
      seen.add(name);
      return;
    }
    if (name === 'Pork with Mustard Tarragon Cream Sauce') {
      // Dedicated 3-part card (below), never the shared generic pasta text.
      seen.add(name);
      return;
    }
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
  // Boeuf and Leblanc get their own dedicated cards (never the shared generic
  // text), so the rest of the stovetop dishes use the shared block below.
  const genericStovetop = byBucket.stovetop.filter(n => !STEW_VEG_COPY[n]);
  if (genericStovetop.length) {
    let body = 'Comes in a container. Warm gently on the stove over medium-low until heated through. If it looks a little thick, add a splash of water to loosen it.';
    if (listHasRice(genericStovetop)) body += ' Cook the included rice fresh.';
    blocks.push({ title: 'Reheat on the stovetop', dishes: genericStovetop, body });
  }

  // Stew/curry dishes with a separate sous vide veg bag — one card per dish
  // (never combined with another dish), with the main reheat and the veg-bag
  // instructions as two paragraphs within that single card.
  byBucket.stovetop.filter(n => STEW_VEG_COPY[n]).forEach(name => {
    const copy = STEW_VEG_COPY[name];
    let mainBody = copy.main;
    if (RICE_DISHES.has(name)) mainBody += ' Cook the included rice fresh.';
    blocks.push({ title: name, dishes: [name], body: [mainBody, copy.veg] });
  });

  // ── Pasta / noodle dishes ──────────────────────────────────────────────
  if (byBucket.pasta.length) {
    const hasP = listHasPasta(byBucket.pasta);
    const hasN = listHasNoodle(byBucket.pasta);
    const carb = hasP && hasN ? 'pasta/noodles' : hasN ? 'noodles' : 'pasta';
    let body = `Cook the included ${carb} fresh. Warm the sauce gently on the stove, adding a splash of pasta water to loosen if needed, then toss together.`;
    blocks.push({ title: 'Cook fresh, warm the sauce', dishes: byBucket.pasta, body });
  }

  // ── Polenta bag (Saffron Pork Ragu polenta variants) ──────────────────
  if (hasPolenta) {
    blocks.push({
      title: 'Reheat the polenta bag',
      dishes: ['Saffron Pork Ragu'],
      body: 'Bring a pot of water to a gentle simmer and place the sealed polenta bag in until heated through, then cut open and plate alongside the ragu.',
    });
  }

  // ── Mushroom Ragu — dedicated cards, split by variant ─────────────────
  if (mushroomRaguPasta) {
    blocks.push({
      title: 'Reheat the sauce, cook the pasta',
      dishes: ['Mushroom Ragu'],
      body: 'Comes in a container, ready to go. Empty the sauce into a saucepan and warm it over medium-low, stirring now and then, while you boil your pasta in lightly salted water. Once the pasta is cooked and drained, toss it with the sauce and a splash of the pasta water to loosen it, then finish with a little parm if you have it.',
    });
  }
  if (mushroomRaguPolenta) {
    blocks.push({
      title: 'Reheat the sauce and polenta',
      dishes: ['Mushroom Ragu'],
      body: 'Comes in a container with the polenta sealed in a separate sous vide bag. Warm the sauce in a saucepan over medium-low, stirring now and then. Reheat the polenta bag in simmering water for a few minutes until hot, then cut it open, spoon it out, and top with the sauce and a little parm if you have it.',
    });
  }

  // ── Pork with Mustard Tarragon Cream Sauce — dedicated 3-part card ─────
  if (porkMustardOrdered) {
    blocks.push({
      title: 'Sear the pork, warm the sauce, cook the pasta',
      dishes: ['Pork with Mustard Tarragon Cream Sauce'],
      body: 'Three parts: the pork in a sealed bag, the sauce in a container, and the taglierini to cook fresh. For the pork, pat it very dry, then sear hard on each side in a blazing-hot pan just until deeply browned on each side. Cut it into half-inch to one-inch medallions after searing. Warm the sauce in a saucepan over medium-low, stirring now and then, while you boil your pasta in lightly salted water. Once the pasta is cooked and drained, toss it with the sauce, then plate with the pork on top.',
    });
  }

  // ── Tex-Mex Kit ────────────────────────────────────────────────────────
  if (byBucket.kit.length) {
    blocks.push({
      title: 'Assemble at home',
      dishes: byBucket.kit,
      body: 'Components travel separately with assembly notes. Warm the protein gently before building. The beans travel in a separate bag — warm them on the stovetop or in the microwave.',
    });
  }

  // ── Bo Ssam (pork pre-pulled and bagged; sauce + kimchi are cold, ready) ──
  if (hasBoSsam) {
    blocks.push({
      title: 'Bo Ssam',
      dishes: ['Bo Ssam'],
      body: 'The pork comes pre-pulled and sealed in a bag — bring a pot of water to a gentle simmer and place the sealed bag in until heated through. The ginger scallion sauce and kimchi are ready straight from the fridge, no reheating needed. Cook the rice fresh.',
    });
  }

  // ── Cumin Beef/Lamb on Rice (same sauce as the noodle version, rice instead) ──
  if (cuminMeatOnRiceOrdered) {
    blocks.push({
      title: CUMIN_DUAL,
      dishes: [CUMIN_DUAL],
      body: 'Warm the meat and sauce gently on the stove, adding a splash of water to loosen if needed. Cook the included rice fresh and serve the meat over the top.',
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

