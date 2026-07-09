// labels.js — #7 bag labels + packing slips (engine, pure)
// Turns the week's active orders into (a) one label per physical container
// and (b) a per-customer packing checklist. Reheat cue comes from the LIVE
// order reheat engine, so labels never drift from the customer cards.
import { buildReheatBlocks } from './recipes.js';
import { isPerLbItem } from './menu.js';
import { perLbBagCount } from './utils.js';

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
      const weighed = isPerLbItem(it.name) && typeof it.weight === 'number' && it.weight > 0;
      const units = weighed ? perLbBagCount(qty) : qty; // per-lb: one label per BAG
      const blocks = buildReheatBlocks({ items: [{ name: it.name, variant: it.variant }] });
      const cue = blocks.length ? blocks[0].title : 'Reheat gently';
      for (let u = 1; u <= units; u++) {
        labels.push({
          customer, dish: it.name, variant: it.variant || '',
          seq: units > 1 ? `${u}/${units}` : '',
          weight: weighed ? `${it.weight} lb total` : '',
          cue,
        });
      }
      containers += units;
      packItems.push(`${qty}× ${it.name}${it.variant ? ` (${it.variant})` : ''}${weighed ? ` — ${units} bag${units > 1 ? 's' : ''}` : ''}`);
    }
    packing.push({ customer, items: packItems, containers, paid: !!o.paid, status: o.status || '' });
  }
  labels.sort((a, b) => a.customer.localeCompare(b.customer) || a.dish.localeCompare(b.dish));
  packing.sort((a, b) => a.customer.localeCompare(b.customer));
  return { labels, packing, containerTotal: labels.length };
}
