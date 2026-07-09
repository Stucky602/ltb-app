// labels.js — #7 bag labels + packing slips (engine, pure)
// Turns the week's active orders into (a) labels per PHYSICAL PACKAGE and
// (b) a per-customer packing checklist. All reheat cues and packaging
// semantics come from the canonical itemHandling() in recipes.js — labels can
// no longer invent instructions (the cantaloupe-with-a-reheat-cue bug) or
// split single-package items into fake 1-of-2 containers (the cookies bug).
import { itemHandling } from './recipes.js';
import { isPerLbItem } from './menu.js';
import { perLbBagCount } from './utils.js';
import { ALWAYS_ITEMS, DISHES } from './dishes.js';

// name → category (dinners aren't in ALWAYS_ITEMS; itemHandling detects them
// via the reheat bucket, so no category needed for those).
const CATEGORY_OF = {};
for (const [cat, items] of Object.entries(ALWAYS_ITEMS)) {
  for (const it of items) CATEGORY_OF[it.name] = cat;
}

export function buildLabelSheet(orders, opts = {}) {
  // Default: orders still to be cooked/delivered. Caller can pass
  // opts.statuses to override (e.g. ['Delivered'] to reprint).
  const active = (orders || []).filter(o =>
    !o.archived && (opts.statuses ? opts.statuses.includes(o.status) : o.status !== 'Delivered'));
  const labels = [];
  const packing = [];
  for (const o of active) {
    const customer = o.customer || o.name || '—';
    const packItems = [];
    let containers = 0;
    for (const it of (o.items || [])) {
      const qty = Number(it.qty) || 1;
      const perLb = isPerLbItem(it.name);
      const h = itemHandling(it.name, { category: CATEGORY_OF[it.name] || null, isPerLb: perLb });
      const weighed = perLb && typeof it.weight === 'number' && it.weight > 0;

      // How many physical packages does this line produce?
      const units =
        h.packaging === 'per-bag' ? (weighed ? perLbBagCount(qty) : 1)
        : h.packaging === 'per-qty' ? qty
        : 1; // 'single' — one package no matter the qty (cookies, fruit, syrups)

      for (let u = 1; u <= units; u++) {
        labels.push({
          customer,
          dish: h.packaging === 'single' && qty > 1 ? `${qty}× ${it.name}` : it.name,
          variant: it.variant || '',
          seq: units > 1 ? `${u}/${units}` : '',
          weight: weighed ? `${it.weight} lb total` : '',
          cue: h.cue, // '' for non-reheatables — the renderer must show nothing
        });
      }
      containers += units;
      packItems.push(`${qty}× ${it.name}${it.variant ? ` (${it.variant})` : ''}${h.packaging === 'per-bag' && weighed && units !== qty ? ` — ${units} bag${units > 1 ? 's' : ''}` : ''}`);
    }
    packing.push({ customer, items: packItems, containers, paid: !!o.paid, status: o.status || '' });
  }
  labels.sort((a, b) => a.customer.localeCompare(b.customer) || a.dish.localeCompare(b.dish));
  packing.sort((a, b) => a.customer.localeCompare(b.customer));
  return { labels, packing, containerTotal: labels.length };
}
