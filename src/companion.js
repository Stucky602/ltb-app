// companion.js — #2 the customer kitchen companion (engine, pure)
// Renders a self-contained per-order HTML page: their dishes, their reheat
// steps straight from the canonical engine (buildReheatBlocks + itemHandling),
// the sear guide when their order includes finish-at-home proteins, and the
// bagged-dish primer. One source of truth: this page can never disagree with
// the order card or the labels, because it is generated from the same canon.
import { buildReheatBlocks, itemHandling } from './recipes.js';
import { isPerLbItem } from './menu.js';
import { ALWAYS_ITEMS } from './dishes.js';

const CATEGORY_OF = {};
for (const [cat, items] of Object.entries(ALWAYS_ITEMS)) for (const it of items) CATEGORY_OF[it.name] = cat;

const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function companionHtml(order) {
  const customer = esc(order.customer || 'Friend');
  const blocks = buildReheatBlocks(order);
  const items = order.items || [];
  const frozen = items.filter(it => /FROZEN/.test(itemHandling(it.name, { category: CATEGORY_OF[it.name] || null, isPerLb: isPerLbItem(it.name) }).cue));
  const noFuss = items.filter(it => {
    const h = itemHandling(it.name, { category: CATEGORY_OF[it.name] || null, isPerLb: isPerLbItem(it.name) });
    return !h.reheatable && !/FROZEN/.test(h.cue);
  });

  const itemRows = items.map(it =>
    `<li><b>${Number(it.qty) || 1}× ${esc(it.name)}</b>${it.variant ? ` <span class="v">${esc(it.variant)}</span>` : ''}</li>`
  ).join('');

  const blockCards = blocks.map(b => `
    <div class="card${/sear/i.test(b.title) ? ' sear' : ''}">
      <h3>${esc(b.title)}</h3>
      <div class="dishes">${b.dishes.map(esc).join(' · ')}</div>
      ${(Array.isArray(b.body) ? b.body : [b.body]).map(p => `<p>${esc(p)}</p>`).join('')}
    </div>`).join('');

  // NOTE: no hand-written sear card here. buildReheatBlocks already emits the
  // canonical "Sear the proteins" block when the order has finish-at-home
  // proteins — a second sear text would be exactly the wording drift the
  // canon exists to prevent. Canon-first, always.

  const frozenCard = frozen.length ? `
    <div class="card warn">
      <h3>Keep these frozen</h3>
      <p>${frozen.map(f => esc(f.name)).join(', ')}: stays in the freezer until you use it. Thaw in the fridge and use within 3 days. Never leave it at room temperature.</p>
    </div>` : '';

  const noFussCard = noFuss.length ? `
    <div class="card">
      <h3>Ready as-is</h3>
      <p>${noFuss.map(f => esc(f.name)).join(', ')}: nothing to do. Enjoy straight from the fridge.</p>
    </div>` : '';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Your LTB kitchen page</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; background: #14201d; color: #e8ede9; margin: 0; padding: 18px; line-height: 1.55; }
  .wrap { max-width: 560px; margin: 0 auto; }
  h1 { font-size: 21px; margin: 6px 0 2px; } .sub { color: #9aa5a0; font-size: 13px; margin-bottom: 16px; }
  .logo { color: #5DCAA5; font-weight: 800; letter-spacing: 0.5px; font-size: 13px; }
  ul { padding-left: 18px; } li { margin: 3px 0; font-size: 14px; } .v { color: #9aa5a0; font-size: 12px; }
  .card { background: #1c2422; border: 1px solid #2d3a36; border-radius: 12px; padding: 14px 16px; margin: 12px 0; }
  .card h3 { margin: 0 0 4px; font-size: 15px; color: #5DCAA5; }
  .card.sear h3 { color: #EF9F27; } .card.warn { border-color: #5a3237; } .card.warn h3 { color: #e0828a; }
  .dishes { font-size: 12px; color: #9aa5a0; margin-bottom: 6px; }
  p { margin: 6px 0; font-size: 13.5px; }
  .foot { color: #6b7570; font-size: 11.5px; margin-top: 18px; text-align: center; }
</style></head><body><div class="wrap">
  <div class="logo">LETTUCE, TURNIP, THE BEET</div>
  <h1>${customer}, here's your kitchen page</h1>
  <div class="sub">Everything in your order and exactly how to bring it home.</div>
  <div class="card"><h3>Your order</h3><ul>${itemRows}</ul></div>
  ${blockCards}
  ${frozenCard}
  ${noFussCard}
  <div class="foot">Questions? Text Kevin. This page expires in 30 days.</div>
</div></body></html>`;
}
