// companion.js — #2 the customer kitchen companion (engine, pure)
// Renders a self-contained, branded per-order HTML page: the LTB logo, their
// dishes, and exactly how to bring each home — all reheat/sear/frozen wording
// pulled from the canonical engine (buildReheatBlocks + itemHandling), so this
// page can never disagree with the order card or the labels.
import { buildReheatBlocks, itemHandling } from './recipes.js';
import { expandOrderForReheat, omakaseCustomReheat, omakaseItemsOf } from './omakase.js';
import { isPerLbItem } from './menu.js';
import { ALWAYS_ITEMS, DISHES } from './dishes.js';
import { DRINKS } from './drinks.js';
import { LTB_LOGO } from './ltbLogo.js';
import { parseServings } from './dishReport.js';

const CATEGORY_OF = {};
for (const [cat, items] of Object.entries(ALWAYS_ITEMS)) for (const it of items) CATEGORY_OF[it.name] = cat;

const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));


// Compact grounding context for the /ask endpoint: the customer's order and
// the exact canon reheat text shown on their page. Kept small on purpose —
// this is the per-question token cost.
export function companionContext(order, opts = {}) {
  const items = (order.items || []).map(it =>
    `${Number(it.qty) || 1}x ${it.name}${it.variant ? ` (${it.variant})` : ''}`).join('; ');
  const blocks = buildReheatBlocks(expandOrderForReheat(order)).map(b =>
    `${b.title} [${b.dishes.join(', ')}]: ${(Array.isArray(b.body) ? b.body : [b.body]).join(' ')}`).join('\n');
  const handleNotes = (order.items || []).map(it => {
    const h = itemHandling(it.name, { category: CATEGORY_OF[it.name] || null, isPerLb: isPerLbItem(it.name) });
    return h.cue ? `${it.name}: ${h.cue}` : null;
  }).filter(Boolean).join('\n');

  // Pairings — the /ask bot must be grounded in what the page shows, or it
  // contradicts the card printed right above the question box. Same canon as
  // companionHtml (dishes.js copy.pairings), rendered as text. The one-bottle
  // intersection mirrors the page's logic so both agree.
  const PAIRINGS_BY_NAME = {};
  for (const d of DISHES) if (d.copy && d.copy.pairings) PAIRINGS_BY_NAME[d.name] = d.copy.pairings;
  const withPairs = (order.items || []).filter(it => PAIRINGS_BY_NAME[it.name]);
  let pairingText = '';
  if (withPairs.length) {
    const secs = withPairs.map(it =>
      `${it.name}: ` + PAIRINGS_BY_NAME[it.name].map(pr => `${pr.drink} (${pr.why})`).join('; ')
    ).join('\n');
    let oneBottle = '';
    if (withPairs.length >= 2) {
      const cover = {};
      for (const it of withPairs) for (const pr of PAIRINGS_BY_NAME[it.name]) {
        if (!pr.id) continue;
        (cover[pr.id] = cover[pr.id] || new Set()).add(it.name);
      }
      let best = null;
      for (const [id, set] of Object.entries(cover)) {
        const kind = (DRINKS[id] || {}).kind;
        const score = set.size * 10 + (kind === 'wine' ? 1 : 0);
        if (set.size >= 2 && (!best || score > best.score)) best = { id, set, score };
      }
      if (best) {
        const label = (DRINKS[best.id] || {}).label || best.id;
        oneBottle = best.set.size === withPairs.length
          ? `One bottle for the whole order: ${label} works with everything ordered.`
          : `Closest single bottle: ${label} covers ${best.set.size} of ${withPairs.length} dinners.`;
      }
    }
    pairingText = `\nDRINK PAIRINGS (what their page recommends):\n${oneBottle ? oneBottle + '\n' : ''}${secs}`;
  }

  // Passport — regulars only; the app supplies opts.passport when the order is
  // linked to a regular. Absent for everyone else, same as the page card.
  let passportText = '';
  if (opts.passport && opts.passport.total > 0) {
    const pp = opts.passport;
    const missing = (pp.missing || []).slice(0, 5);
    passportText = `\nDISH PASSPORT: had ${pp.tried} of ${pp.total} dinners on the full menu.` +
      (missing.length ? ` Not yet tried: ${missing.join(', ')}.` : ` Has tried everything.`);
  }

  return `CUSTOMER: ${order.customer || 'Friend'}\nORDER: ${items}\nINSTRUCTIONS SHOWN ON THEIR PAGE:\n${blocks}\nITEM HANDLING:\n${handleNotes}${pairingText}${passportText}`;
}

export function companionHtml(order, pageId = '', opts = {}) {
  const customer = esc(order.customer || 'Friend');
  const firstName = customer.split(' ')[0];
  const blocks = buildReheatBlocks(expandOrderForReheat(order));
  const items = order.items || [];
  const handleOf = (name) => itemHandling(name, { category: CATEGORY_OF[name] || null, isPerLb: isPerLbItem(name) });
  const frozen = items.filter(it => /FROZEN/.test(handleOf(it.name).cue));
  const noFuss = items.filter(it => { const h = handleOf(it.name); return !h.reheatable && !/FROZEN/.test(h.cue); });

  // Omakase reveal: they are holding an unlabeled box, so the page has to say
  // what it is. Menu components already have canon reheat text (the expanded
  // order above); anything Kevin typed a reheat note for is listed here.
  const omaItems = omakaseItemsOf(order);
  const omaCustom = omakaseCustomReheat(order);
  const omakaseCard = omaItems.length ? omaItems.map(it => {
    const comps = it.components || [];
    const body = comps.length
      ? `<ul>${comps.map(c => `<li><b>${esc(c.label || 'A dish')}</b></li>`).join('')}</ul>`
      : `<p>Still deciding what to make you. It will be worth the wait.</p>`;
    const price = (it.price != null && it.budgetMax != null && it.price < it.budgetMax)
      ? `<p class="omaprice">Charged ${esc('$' + it.price)} against your ${esc('$' + it.budgetMax)} max.${it.underNote ? ' ' + esc(it.underNote) : ''}</p>`
      : '';
    // Kevin's hand-written card for the improvised part of the order. Menu
    // components speak for themselves through the canon reheat blocks above,
    // so an omakase with both correctly shows both.
    const card = it.reheatCard
      ? `<div class="omaheat"><div class="omaheat-head">How to reheat this</div><div>${esc(it.reheatCard).replace(/\n/g, '<br>')}</div></div>`
      : '';
    const extra = omaCustom.length
      ? `<div class="omaheat">${omaCustom.map(x => `<div><b>${esc(x.label)}</b>: ${esc(x.reheat)}</div>`).join('')}</div>`
      : '';
    return `<div class="card"><h3>Your omakase</h3>${body}${price}${card}${extra}</div>`;
  }).join('') : '';

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

  // ── Pairings — for exactly what THIS customer ordered ────────────────────
  // Canon lives in dishes.js copy.pairings, same source the menus render. One
  // block per ordered dinner that has pairings; dishes without them (always-
  // available items, per-lb proteins) simply don't appear.
  const PAIRINGS_BY_NAME = {};
  for (const d of DISHES) if (d.copy && d.copy.pairings) PAIRINGS_BY_NAME[d.name] = d.copy.pairings;
  // ── One bottle for the whole order ──────────────────────────────────────
  // Canonical drink ids make the intersection trivial: if one drink appears in
  // every ordered dinner's pairings, say so up top. If no perfect cover, take
  // the drink covering the most dinners (>=2). Wine wins ties — it's the
  // bottle someone actually brings.
  const dinnersWithPairs = items.filter(it => PAIRINGS_BY_NAME[it.name]);
  let oneBottle = '';
  if (dinnersWithPairs.length >= 2) {
    const cover = {}; // id -> Set of dish names
    for (const it of dinnersWithPairs) {
      for (const pr of PAIRINGS_BY_NAME[it.name]) {
        if (!pr.id) continue;
        (cover[pr.id] = cover[pr.id] || new Set()).add(it.name);
      }
    }
    let best = null;
    for (const [id, set] of Object.entries(cover)) {
      const kind = (DRINKS[id] || {}).kind;
      const score = set.size * 10 + (kind === 'wine' ? 1 : 0);
      if (set.size >= 2 && (!best || score > best.score)) best = { id, set, score };
    }
    if (best) {
      const label = (DRINKS[best.id] || {}).label || best.id;
      const all = best.set.size === dinnersWithPairs.length;
      oneBottle = `<div class="one-bottle">${all
        ? `One bottle covers it: <b>${esc(label)}</b> works with everything you ordered this week.`
        : `Closest to one bottle: <b>${esc(label)}</b> covers ${best.set.size} of your ${dinnersWithPairs.length} dinners.`}</div>`;
    }
  }

  const pairingSections = items
    .filter(it => PAIRINGS_BY_NAME[it.name])
    .map(it => {
      const rows = PAIRINGS_BY_NAME[it.name].map(pr =>
        `<div class="prow"><b>${esc(pr.drink)}</b> — ${esc(pr.why)}</div>`).join('');
      return `<div class="pdish"><div class="pname">${esc(it.name)}</div>${rows}</div>`;
    });
  const pairingsCard = pairingSections.length ? `
    <div class="card pair">
      <h3>What to drink with it</h3>
      ${oneBottle}
      ${pairingSections.join('')}
    </div>` : '';

  // ── Dish passport — REGULARS ONLY (opts.passport supplied by the app when
  // the order is linked to a regular; absent = card absent). Two pieces: a
  // compact strip near the top, and a full passport book that opens over the
  // page when tapped. The book is IN THIS PAGE, not a second URL: no extra KV
  // key, no second link to expire, and it works offline once loaded.
  let passportStrip = '';
  let passportBook = '';
  if (opts.passport && opts.passport.total > 0) {
    const pp = opts.passport;
    const visited = pp.pages.filter(p => p.stamped > 0);
    const newLine = pp.newStamps.length
      ? `<div class="pp-new">New this delivery: ${pp.newStamps.map(esc).join(', ')}</div>`
      : '';

    passportStrip = `
    <button class="pp-strip" onclick="openPassport()" aria-label="Open your dish passport">
      <div class="pp-strip-top">
        <span class="pp-strip-title">Your dish passport</span>
        <span class="pp-strip-open">Open &rsaquo;</span>
      </div>
      <div class="pp-strip-count"><b>${pp.tried}</b> of ${pp.total} stamps &middot; <b>${pp.cuisinesVisited}</b> of ${pp.cuisinesTotal} chapters</div>
      ${newLine}
      <div class="pp-strip-chips">${visited.map(p => `<span class="pp-chip">${esc(p.label)}</span>`).join('')}</div>
    </button>`;

    const spreads = pp.pages.map((page, i) => `
      <div class="pp-page" data-page="${i}">
        <div class="pp-page-head">
          <div class="pp-page-name">${esc(page.label)}</div>
          <div class="pp-page-count">${page.stamped} / ${page.total}${page.complete ? ' &middot; complete' : ''}</div>
        </div>
        <div class="pp-stamps">
          ${page.dishes.map((d, j) => d.stamped
            ? `<div class="pp-stamp${d.isNew ? ' pp-stamp-new' : ''}" style="--rot:${((j * 37) % 9) - 4}deg">
                 <div class="pp-stamp-name">${esc(d.name)}</div>
                 ${d.isNew ? '<div class="pp-stamp-flag">new</div>' : ''}
               </div>`
            : `<div class="pp-blank"><div class="pp-blank-name">${esc(d.name)}</div></div>`).join('')}
        </div>
      </div>`).join('');

    passportBook = `
    <div class="pp-overlay" id="ppOverlay" role="dialog" aria-label="Dish passport" hidden>
      <div class="pp-book">
        <div class="pp-book-head">
          <div>
            <div class="pp-book-title">Dish passport</div>
            <div class="pp-book-owner">${customer}</div>
          </div>
          <button class="pp-close" onclick="closePassport()" aria-label="Close">&times;</button>
        </div>
        <div class="pp-pages" id="ppPages">${spreads}</div>
        <div class="pp-nav">
          <button class="pp-nav-btn" onclick="flipPassport(-1)" aria-label="Previous chapter">&lsaquo;</button>
          <div class="pp-nav-label" id="ppNavLabel"></div>
          <button class="pp-nav-btn" onclick="flipPassport(1)" aria-label="Next chapter">&rsaquo;</button>
        </div>
      </div>
    </div>`;
  }

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
  .card.pair { border-left: 2px solid #2d6a6a; }
  .card.pair h3 { color: #5DCAA5; }
  .pdish { margin-bottom: 12px; }
  .pdish:last-child { margin-bottom: 0; }
  .pname { font-size: 12px; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase; color: #9aa5a0; margin-bottom: 4px; }
  .prow { font-size: 13px; color: #cfe0d8; line-height: 1.5; margin-bottom: 3px; }
  .prow b { color: #e8ede9; font-weight: 600; }
  .one-bottle { font-size: 13.5px; color: #cfe0d8; background: rgba(93,202,165,0.10); border-radius: 8px; padding: 8px 10px; margin-bottom: 10px; line-height: 1.5; }
  .one-bottle b { color: #5DCAA5; }
  /* ── Dish passport ──────────────────────────────────────────────────────
     The strip sits under the title; the book opens over the page. Stamps are
     pure CSS (rotated, ink-toned, slightly irregular) so the page stays light
     and works with no network once loaded. */
  .pp-strip { display: block; width: 100%; text-align: left; margin: 0 0 18px; padding: 12px 14px;
    background: linear-gradient(180deg, rgba(184,152,90,0.10), rgba(184,152,90,0.04));
    border: 1px solid #6b5a34; border-radius: 12px; cursor: pointer; font: inherit; color: inherit; }
  .pp-strip:active { transform: scale(0.995); }
  .pp-strip-top { display: flex; justify-content: space-between; align-items: baseline; }
  .pp-strip-title { font-size: 11px; letter-spacing: 1.2px; text-transform: uppercase; color: #d4b06a; font-weight: 700; }
  .pp-strip-open { font-size: 12px; color: #9aa5a0; }
  .pp-strip-count { font-size: 14px; color: #e8ede9; margin-top: 4px; }
  .pp-strip-count b { color: #d4b06a; }
  .pp-new { font-size: 12.5px; color: #5DCAA5; margin-top: 4px; font-weight: 600; }
  .pp-strip-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
  .pp-chip { font-size: 10.5px; color: #cfe0d8; border: 1px solid #3a453f; border-radius: 999px; padding: 1px 8px; }

  .pp-overlay { position: fixed; inset: 0; background: rgba(8,14,12,0.92); z-index: 50;
    display: flex; align-items: center; justify-content: center; padding: 16px; }
  .pp-overlay[hidden] { display: none; }
  .pp-book { width: 100%; max-width: 560px; max-height: 88vh; display: flex; flex-direction: column;
    background: #1b2320; border: 1px solid #6b5a34; border-radius: 14px; overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.55); }
  .pp-book-head { display: flex; justify-content: space-between; align-items: flex-start;
    padding: 14px 16px; border-bottom: 1px solid #2d3a36; background: rgba(184,152,90,0.07); }
  .pp-book-title { font-size: 10.5px; letter-spacing: 1.4px; text-transform: uppercase; color: #d4b06a; font-weight: 700; }
  .pp-book-owner { font-size: 17px; color: #e8ede9; margin-top: 2px; }
  .pp-close { background: none; border: none; color: #9aa5a0; font-size: 26px; line-height: 1; cursor: pointer; padding: 0 4px; }
  .pp-pages { flex: 1; overflow: hidden; position: relative; }
  .pp-page { display: none; padding: 16px; height: 100%; overflow-y: auto; animation: ppIn 220ms ease; }
  .pp-page.on { display: block; }
  @keyframes ppIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: none; } }
  .pp-page-head { display: flex; justify-content: space-between; align-items: baseline;
    border-bottom: 1px dashed #3a453f; padding-bottom: 8px; margin-bottom: 12px; }
  .pp-page-name { font-size: 19px; color: #e8ede9; font-family: Georgia, 'Times New Roman', serif; }
  .pp-page-count { font-size: 11.5px; color: #9aa5a0; }
  .pp-stamps { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
  .pp-stamp { position: relative; border: 2px solid #b8985a; border-radius: 8px; padding: 12px 8px;
    text-align: center; transform: rotate(var(--rot, 0deg)); background: rgba(184,152,90,0.08); }
  .pp-stamp-name { font-size: 11.5px; color: #d4b06a; font-weight: 700; line-height: 1.25;
    text-transform: uppercase; letter-spacing: 0.3px; }
  .pp-stamp-new { border-color: #5DCAA5; background: rgba(93,202,165,0.10); }
  .pp-stamp-new .pp-stamp-name { color: #5DCAA5; }
  .pp-stamp-flag { position: absolute; top: -8px; right: -6px; font-size: 9px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px; color: #0f1613; background: #5DCAA5;
    border-radius: 999px; padding: 1px 7px; }
  .pp-blank { border: 1px dashed #33403a; border-radius: 8px; padding: 12px 8px; text-align: center; }
  .pp-blank-name { font-size: 11px; color: #55605b; line-height: 1.25; }
  .pp-nav { display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-top: 1px solid #2d3a36; }
  .pp-nav-btn { background: none; border: 1px solid #3a453f; border-radius: 8px; color: #cfe0d8;
    font-size: 18px; line-height: 1; padding: 4px 14px; cursor: pointer; }
  .pp-nav-label { font-size: 12px; color: #9aa5a0; }
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
  .card.fb { border-color: #2f4a42; }
  .fbrow { padding: 8px 0; border-bottom: 1px solid #26322e; }
  .fbrow:last-child { border-bottom: none; }
  .fbname { font-size: 13.5px; font-weight: 700; margin-bottom: 6px; }
  .fbbtns { display: flex; gap: 7px; flex-wrap: wrap; }
  .fbbtn { border-radius: 9px; padding: 7px 11px; font-size: 12.5px; font-weight: 700; border: 1px solid #2d3a36; background: #14201d; color: #b7c4be; }
  .fbbtn.good { color: #5DCAA5; } .fbbtn.meh { color: #EF9F27; } .fbbtn.bad { color: #e0828a; }
  .fbdone { color: #5DCAA5; font-size: 12.5px; font-weight: 700; }
  .fbbtn.sel { border-color: #5DCAA5; background: #1d2a26; }
  .fbnotewrap { display: flex; gap: 7px; margin-top: 8px; }
  .fbnote { flex: 1; background: #14201d; border: 1px solid #2d3a36; border-radius: 9px; color: #e8ede9; padding: 8px 11px; font-size: 13px; }
  .fbnote:focus { outline: none; border-color: #5DCAA5; }
  .fbsend { background: #1D9E75; color: #0f1513; border: none; border-radius: 9px; padding: 8px 14px; font-weight: 800; font-size: 12.5px; }
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
  ${passportStrip}
  <div class="card"><h3>Your order</h3><ul>${itemRows}</ul></div>
  ${omakaseCard}
  ${stepsIntro}
  ${stepCards}
  ${frozenCard}
  ${noFussCard}
  ${pairingsCard}
  ${passportBook}
  <div class="card fb">
    <h3>How did everything come out?</h3>
    <p class="asknote">One tap per dish tells Kevin what worked, and a line about why helps even more. It makes the food better for everyone. You can submit feedback once per dish for this order.</p>
    <div id="fbrows"></div>
  </div>
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
// ── Passport book ─────────────────────────────────────────────────────────
// The book lives in this page, so opening it costs no network. Escape closes,
// arrows and swipe flip chapters. It opens on the first chapter with a new
// stamp, because that is the thing worth seeing.
var ppPage = 0, ppTotal = 0;
function ppRender() {
  var pages = document.querySelectorAll('.pp-page');
  ppTotal = pages.length;
  for (var i = 0; i < pages.length; i++) pages[i].className = 'pp-page' + (i === ppPage ? ' on' : '');
  var label = document.getElementById('ppNavLabel');
  if (label) label.textContent = (ppPage + 1) + ' of ' + ppTotal;
}
function openPassport() {
  var ov = document.getElementById('ppOverlay');
  if (!ov) return;
  var withNew = document.querySelector('.pp-stamp-new');
  var host = withNew ? withNew.closest('.pp-page') : null;
  ppPage = host ? Number(host.getAttribute('data-page')) : 0;
  ov.hidden = false;
  document.body.style.overflow = 'hidden';
  ppRender();
}
function closePassport() {
  var ov = document.getElementById('ppOverlay');
  if (!ov) return;
  ov.hidden = true;
  document.body.style.overflow = '';
}
function flipPassport(dir) {
  if (!ppTotal) return;
  ppPage = (ppPage + dir + ppTotal) % ppTotal;
  ppRender();
}
document.addEventListener('keydown', function (e) {
  var ov = document.getElementById('ppOverlay');
  if (!ov || ov.hidden) return;
  if (e.key === 'Escape') closePassport();
  else if (e.key === 'ArrowRight') flipPassport(1);
  else if (e.key === 'ArrowLeft') flipPassport(-1);
});
(function () {
  var ov = document.getElementById('ppOverlay');
  if (!ov) return;
  // Tap the backdrop to close, but never a tap inside the book itself.
  ov.addEventListener('click', function (e) { if (e.target === ov) closePassport(); });
  var x0 = null;
  var pages = document.getElementById('ppPages');
  if (!pages) return;
  pages.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  pages.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) flipPassport(dx < 0 ? 1 : -1);
    x0 = null;
  }, { passive: true });
})();

var FB_DISHES = ${JSON.stringify(items.map(it => it.name))};
var FB_PAGE = "${esc(pageId)}";
var fbSent = {};
// Feedback is once-per-dish PER ORDER. We remember what was already submitted
// in this browser (keyed by this page's id) so a reload can't double-submit —
// the row locks to a read-only "You said: X" state instead of live buttons.
var FB_STORE = 'ltb_fb_' + FB_PAGE;
function fbLoad() {
  try { return JSON.parse(localStorage.getItem(FB_STORE) || '{}') || {}; } catch (e) { return {}; }
}
function fbRemember(dish, label) {
  try {
    var cur = fbLoad();
    cur[dish] = label;
    localStorage.setItem(FB_STORE, JSON.stringify(cur));
  } catch (e) { /* storage off (private mode): in-memory fbSent still guards this session */ }
}
(function buildFb() {
  var wrap = document.getElementById('fbrows');
  var already = fbLoad();
  FB_DISHES.forEach(function(d) {
    var row = document.createElement('div'); row.className = 'fbrow';
    var nm = document.createElement('div'); nm.className = 'fbname'; nm.textContent = d;

    // Already submitted for this order (persisted): render a locked confirmation.
    if (already[d]) {
      fbSent[d] = true;
      var done = document.createElement('div'); done.className = 'fbdone';
      done.textContent = 'You said: ' + already[d] + ' \\u2713';
      row.appendChild(nm); row.appendChild(done); wrap.appendChild(row);
      return;
    }

    var btns = document.createElement('div'); btns.className = 'fbbtns';
    var noteWrap = document.createElement('div'); noteWrap.className = 'fbnotewrap'; noteWrap.style.display = 'none';
    var note = document.createElement('input'); note.type = 'text'; note.maxLength = 240; note.className = 'fbnote';
    note.placeholder = 'Tell Kevin why (optional)';
    var send = document.createElement('button'); send.className = 'fbsend'; send.textContent = 'Send';
    noteWrap.appendChild(note); noteWrap.appendChild(send);
    var picked = null;
    [['Perfect','good'],['A little off','meh'],['Had trouble','bad']].forEach(function(pair) {
      var b = document.createElement('button'); b.className = 'fbbtn ' + pair[1]; b.textContent = pair[0];
      b.onclick = function() {
        if (fbSent[d]) return;
        picked = pair;
        Array.prototype.forEach.call(btns.children, function(x) { x.classList.remove('sel'); });
        b.classList.add('sel');
        noteWrap.style.display = 'flex';
        note.focus();
      };
      btns.appendChild(b);
    });
    send.onclick = function() {
      if (fbSent[d] || !picked) return;
      fbSent[d] = true;
      var chosenLabel = picked[0];
      fetch('/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: PAGE_ID, dish: d, verdict: picked[1], note: (note.value || '').trim() }) })
        .then(function(r) {
          var done = document.createElement('div'); done.className = 'fbdone';
          if (r.ok) {
            fbRemember(d, chosenLabel); // persist so a reload keeps it locked
            done.textContent = 'Noted: ' + chosenLabel + '. Thanks!';
            row.replaceChildren(nm, done);
          } else {
            fbSent[d] = false;
            done.textContent = 'That did not send. No worries.';
            row.replaceChildren(nm, done);
          }
        })
        .catch(function() { fbSent[d] = false; });
    };
    row.appendChild(nm); row.appendChild(btns); row.appendChild(noteWrap); wrap.appendChild(row);
  });
})();
</script><script>
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
