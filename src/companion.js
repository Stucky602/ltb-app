// companion.js — #2 the customer kitchen companion (engine, pure)
// Renders a self-contained, branded per-order HTML page: the LTB logo, their
// dishes, and exactly how to bring each home — all reheat/sear/frozen wording
// pulled from the canonical engine (buildReheatBlocks + itemHandling), so this
// page can never disagree with the order card or the labels.
import { buildReheatBlocks, itemHandling } from './recipes.js';
import { isPerLbItem } from './menu.js';
import { ALWAYS_ITEMS } from './dishes.js';
import { LTB_LOGO } from './ltbLogo.js';
import { parseServings } from './dishReport.js';

const CATEGORY_OF = {};
for (const [cat, items] of Object.entries(ALWAYS_ITEMS)) for (const it of items) CATEGORY_OF[it.name] = cat;

const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));


// Compact grounding context for the /ask endpoint: the customer's order and
// the exact canon reheat text shown on their page. Kept small on purpose —
// this is the per-question token cost.
export function companionContext(order) {
  const items = (order.items || []).map(it =>
    `${Number(it.qty) || 1}x ${it.name}${it.variant ? ` (${it.variant})` : ''}`).join('; ');
  const blocks = buildReheatBlocks(order).map(b =>
    `${b.title} [${b.dishes.join(', ')}]: ${(Array.isArray(b.body) ? b.body : [b.body]).join(' ')}`).join('\n');
  const handleNotes = (order.items || []).map(it => {
    const h = itemHandling(it.name, { category: CATEGORY_OF[it.name] || null, isPerLb: isPerLbItem(it.name) });
    return h.cue ? `${it.name}: ${h.cue}` : null;
  }).filter(Boolean).join('\n');
  return `CUSTOMER: ${order.customer || 'Friend'}\nORDER: ${items}\nINSTRUCTIONS SHOWN ON THEIR PAGE:\n${blocks}\nITEM HANDLING:\n${handleNotes}`;
}

export function companionHtml(order, pageId = '') {
  const customer = esc(order.customer || 'Friend');
  const firstName = customer.split(' ')[0];
  const blocks = buildReheatBlocks(order);
  const items = order.items || [];
  const handleOf = (name) => itemHandling(name, { category: CATEGORY_OF[name] || null, isPerLb: isPerLbItem(name) });
  const frozen = items.filter(it => /FROZEN/.test(handleOf(it.name).cue));
  const noFuss = items.filter(it => { const h = handleOf(it.name); return !h.reheatable && !/FROZEN/.test(h.cue); });

  const itemRows = items.map(it => {
    const servings = it.variant ? parseServings(it.variant) : null;
    const feeds = servings ? `<span class="feeds">feeds ~${servings}</span>` : '';
    return `<li><span class="qty">${Number(it.qty) || 1}×</span> <b>${esc(it.name)}</b>${it.variant ? ` <span class="v">${esc(it.variant)}</span>` : ''}${feeds}</li>`;
  }).join('');

  // Reheat/sear steps, numbered so the page reads like a short recipe. The
  // sear block (when present) is styled amber; canon owns all the wording.
  const stepCards = blocks.map((b, i) => `
    <div class="card step${/sear/i.test(b.title) ? ' sear' : ''}">
      <div class="stephead"><span class="stepnum">${i + 1}</span><h3>${esc(b.title)}</h3></div>
      <div class="dishes">${b.dishes.map(esc).join(' · ')}</div>
      ${(Array.isArray(b.body) ? b.body : [b.body]).map(p => `<p>${esc(p)}</p>`).join('')}
    </div>`).join('');

  const frozenCard = frozen.length ? `
    <div class="card warn">
      <h3>❄ Keep these frozen</h3>
      <p><b>${frozen.map(f => esc(f.name)).join(', ')}</b> stays in the freezer until you use it. Thaw in the fridge and use within 3 days. Never leave it out at room temperature.</p>
    </div>` : '';

  const noFussCard = noFuss.length ? `
    <div class="card ready">
      <h3>✓ Ready as-is</h3>
      <p><b>${noFuss.map(f => esc(f.name)).join(', ')}</b> — nothing to do. Enjoy straight from the fridge.</p>
    </div>` : '';

  const stepsIntro = blocks.length ? `<div class="lead">When you're ready to eat, here's the plan:</div>` : '';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#14201d">
<meta name="robots" content="noindex">
<title>Your LTB kitchen page</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; background: #14201d; color: #e8ede9; margin: 0; padding: 0 18px 40px; line-height: 1.55; -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 560px; margin: 0 auto; }
  .brand { text-align: center; padding: 26px 0 6px; }
  .brand img { width: 96px; height: 96px; border-radius: 20px; display: block; margin: 0 auto 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.35); }
  .brand .name { color: #5DCAA5; font-weight: 800; letter-spacing: 1.5px; font-size: 12px; text-transform: uppercase; }
  h1 { font-size: 23px; margin: 14px 0 3px; text-align: center; font-weight: 800; }
  .sub { color: #9aa5a0; font-size: 13.5px; margin: 0 auto 20px; text-align: center; max-width: 420px; }
  .lead { color: #cfe0d8; font-size: 14px; font-weight: 600; margin: 22px 4px 4px; }
  ul { list-style: none; padding: 0; margin: 4px 0 0; }
  li { padding: 7px 0; font-size: 14.5px; border-bottom: 1px solid #26322e; }
  li:last-child { border-bottom: none; }
  .qty { color: #5DCAA5; font-weight: 800; margin-right: 4px; }
  .v { color: #9aa5a0; font-size: 12.5px; }
  .feeds { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 10px; background: #24413a; color: #5DCAA5; font-size: 11px; font-weight: 700; vertical-align: middle; }
  .card { background: #1c2422; border: 1px solid #2d3a36; border-radius: 14px; padding: 15px 17px; margin: 12px 0; }
  .card h3 { margin: 0; font-size: 15.5px; color: #5DCAA5; font-weight: 800; }
  .stephead { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
  .stepnum { flex: 0 0 24px; height: 24px; border-radius: 50%; background: #24413a; color: #5DCAA5; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .card.sear { border-color: #4a3a1e; } .card.sear h3 { color: #EF9F27; } .card.sear .stepnum { background: #3d3016; color: #EF9F27; }
  .card.warn { border-color: #5a3237; } .card.warn h3 { color: #e0828a; }
  .card.ready { border-color: #28483d; } .card.ready h3 { color: #5DCAA5; }
  .dishes { font-size: 12px; color: #8a958f; margin: 2px 0 6px 34px; }
  .step p { margin: 6px 0 6px 34px; }
  p { margin: 6px 0; font-size: 13.5px; }
  .foot { color: #6b7570; font-size: 12px; margin-top: 26px; text-align: center; line-height: 1.7; }
  .foot .heart { color: #5DCAA5; }
  .card.ask { border-color: #2f4a42; }
  .asknote { color: #9fb3ab; font-size: 12.5px; }
  .askrow { display: flex; gap: 8px; margin-top: 10px; }
  #q { flex: 1; background: #14201d; border: 1px solid #2d3a36; border-radius: 10px; color: #e8ede9; padding: 10px 12px; font-size: 14px; }
  #q:focus { outline: none; border-color: #5DCAA5; }
  #askbtn { background: #1D9E75; color: #0f1513; border: none; border-radius: 10px; padding: 10px 16px; font-weight: 800; font-size: 14px; }
  #askbtn:disabled { opacity: 0.45; }
  .remain { color: #6b7570; font-size: 11.5px; margin-top: 7px; text-align: right; }
  .qa { margin: 10px 0; }
  .qa .q { color: #cfe0d8; font-weight: 700; font-size: 13.5px; }
  .qa .a { color: #b7c4be; font-size: 13.5px; margin-top: 3px; white-space: pre-wrap; }
  .qa .err { color: #e0828a; font-size: 13px; }
</style></head><body><div class="wrap">
  <div class="brand">
    <img src="${LTB_LOGO}" alt="Lettuce, Turnip, The Beet">
    <div class="name">Lettuce, Turnip, The Beet</div>
  </div>
  <h1>${firstName}, here's your kitchen page</h1>
  <div class="sub">Everything in your order, and exactly how to bring each dish home for its best.</div>
  <div class="card"><h3>Your order</h3><ul>${itemRows}</ul></div>
  ${stepsIntro}
  ${stepCards}
  ${frozenCard}
  ${noFussCard}
  <div class="card ask">
    <h3>Ask about your order</h3>
    <p class="asknote">Not sure about a reheat, a swap, or how long something keeps? Ask here. <b>You get 5 questions on this page</b>, so make them count. For anything about allergies or ingredients, text Kevin directly.</p>
    <div id="thread"></div>
    <div class="askrow">
      <input id="q" type="text" maxlength="300" placeholder="e.g. Can I reheat the gumbo in a microwave?" autocomplete="off">
      <button id="askbtn" onclick="ask()">Ask</button>
    </div>
    <div id="remain" class="remain">5 questions remaining</div>
  </div>
  <div class="foot">Made with care <span class="heart">♥</span><br>Questions about anything? Just text Kevin.<br>This page is yours for 30 days.</div>
</div><script>
var PAGE_ID = "${esc(pageId)}";
var remaining = 5;
function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
function setRemain(n) {
  remaining = n;
  var r = document.getElementById('remain');
  r.textContent = n > 0 ? (n + ' question' + (n === 1 ? '' : 's') + ' remaining') : 'No questions left on this page. Text Kevin for anything else.';
  if (n <= 0) { document.getElementById('q').disabled = true; document.getElementById('askbtn').disabled = true; }
}
function ask() {
  var input = document.getElementById('q');
  var btn = document.getElementById('askbtn');
  var q = (input.value || '').trim();
  if (!q || remaining <= 0) return;
  btn.disabled = true; input.disabled = true;
  var box = el('div', 'qa');
  box.appendChild(el('div', 'q', 'You: ' + q));
  var a = el('div', 'a', 'Thinking...');
  box.appendChild(a);
  document.getElementById('thread').appendChild(box);
  fetch('/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: PAGE_ID, question: q }) })
    .then(function(r) { return r.json().then(function(j) { return { ok: r.ok, j: j }; }); })
    .then(function(res) {
      if (res.ok && res.j.answer) {
        a.textContent = res.j.answer;
        setRemain(typeof res.j.remaining === 'number' ? res.j.remaining : remaining - 1);
        input.value = '';
      } else if (res.j && res.j.error === 'limit') {
        a.className = 'err'; a.textContent = 'That was the last question for this page. Text Kevin for anything else.';
        setRemain(0);
      } else {
        a.className = 'err'; a.textContent = 'That did not go through. Give it another try, or just text Kevin.';
      }
    })
    .catch(function() { a.className = 'err'; a.textContent = 'That did not go through. Give it another try, or just text Kevin.'; })
    .finally(function() { if (remaining > 0) { btn.disabled = false; input.disabled = false; input.focus(); } });
}
document.getElementById('q').addEventListener('keydown', function(e) { if (e.key === 'Enter') ask(); });
</script></body></html>`;
}
