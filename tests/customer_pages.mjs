// Functional gate for the two pages customers actually touch. Everything else
// in this suite tests the app; form.html and menu.html are hand-written ES5
// that no bundler checks, so a regression there ships silently. Booted in
// jsdom with a stubbed fetch, exactly as they run on a phone.
import { JSDOM } from 'jsdom';
import fs from 'fs';

let failed = 0;
function check(name, cond, extra) {
  if (cond) { console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}

const form = fs.readFileSync('form.html', 'utf8');
const menu = fs.readFileSync('menu.html', 'utf8');
const landing = fs.existsSync('order.html') ? fs.readFileSync('order.html', 'utf8') : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CFG = {
  weekLabel: 'Week of Jul 22',
  dishes: [
    { name: 'Meat Dish', variants: [{ label: 'Small (~4)', price: 40, cost: 20 }] },
    { name: 'Veg Dish', variants: [{ label: 'Small (~4)', price: 30, cost: 12 }], diet: { veg: true } },
  ],
};

function boot(html, cfg, store) {
  const s = store || {};
  return new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://x.test/',
    beforeParse(w) {
      w.fetch = () => Promise.resolve({ json: () => Promise.resolve(cfg) });
      Object.defineProperty(w, 'localStorage', {
        value: {
          getItem: k => (k in s ? s[k] : null),
          setItem: (k, v) => { s[k] = String(v); },
          removeItem: k => { delete s[k]; },
          clear: () => { for (const k of Object.keys(s)) delete s[k]; },
        },
        configurable: true,
      });
    },
  });
}

console.log('form.html');
{
  const dom = boot(form, CFG); await sleep(150);
  const d = dom.window.document, w = dom.window;

  check('omakase card renders every week', !!d.getElementById('omakaseBudget'));
  check('size buttons state what they feed', /serves ~4/.test(d.getElementById('omSizeSmall').textContent)
    && /serves ~8/.test(d.getElementById('omSizeLarge').textContent));
  check('size is explained as per-meal, not total', /more than one meal/.test(d.body.innerHTML)
    && /about 4 servings/.test(d.body.innerHTML));

  const b = d.getElementById('omakaseBudget');
  b.value = '400'; w.omakaseBudgetInput();
  check('$300 nudge appears over the line', /prime filet mignon/.test(d.getElementById('omakaseBigNote').innerHTML));
  b.value = '250'; w.omakaseBudgetInput();
  check('$300 nudge is never advertised below it', d.getElementById('omakaseBigNote').innerHTML === '');

  b.value = '20';
  d.getElementById('custName').value = 'Test'; d.getElementById('custAddress').value = '1 St';
  w.openReview();
  check('omakase under $50 blocks review', /minimum is \$50/.test(d.getElementById('msgArea').innerHTML));

  b.value = '75'; d.getElementById('omakaseNote').value = 'absolutely no clams';
  w.openReview();
  check('the note to the chef is elevated in review', /YOUR NOTE TO THE CHEF/.test(d.body.innerHTML) && /absolutely no clams/.test(d.body.innerHTML));
  check('an omakase budget reads as a max', / max/.test(d.body.innerHTML));

  w.setDiet('veg');
  check('diet filter hides what it should', d.getElementById('dishblk_0_0').style.display === 'none');
  check('diet filter keeps what it should', d.getElementById('dishblk_0_1').style.display !== 'none');
  w.setDiet('veg');
  w.changeQty('0_0_0', 1); w.setDiet('veg'); await sleep(20);
  check('a dish already in the cart is never hidden', d.getElementById('dishblk_0_0').style.display !== 'none');
}

// Draft persistence: build an order, then boot a second time against the same
// storage and confirm it comes back.
{
  const store = {};
  const d1 = boot(form, CFG, store); await sleep(150);
  d1.window.changeQty('0_0_0', 2);
  d1.window.document.getElementById('omakaseBudget').value = '120';
  d1.window.omakaseBudgetInput();
  d1.window.setOmakaseSize('Large');
  await sleep(400);
  check('an in-progress order is saved', !!store['ltb-cart-draft']);

  const d2 = boot(form, CFG, store); await sleep(200);
  check('cart survives a reload', d2.window.document.getElementById('qty_0_0_0').textContent.trim() === '2');
  check('omakase inputs survive a reload', d2.window.document.getElementById('omakaseBudget').value === '120'
    && /om-size-on/.test(d2.window.document.getElementById('omSizeLarge').className));

  const stale = { 'ltb-cart-draft': JSON.stringify({ savedAt: Date.now(), weekLabel: 'Week of Jul 15', cart: { '0_0_0': 5 } }) };
  const d3 = boot(form, CFG, stale); await sleep(200);
  check('a draft from another week is discarded, not restored onto the wrong dishes',
    d3.window.document.getElementById('qty_0_0_0').textContent.trim() === '0' && !stale['ltb-cart-draft']);
}

// Week off
{
  const dom = boot(form, { ...CFG, paused: true, pausedMsg: 'Back on the 30th.' }); await sleep(150);
  const h = dom.window.document.body.innerHTML;
  check('a paused week says so instead of showing a menu', /Taking this week off/.test(h) && /Back on the 30th/.test(h));
  check('a paused week cannot be ordered from', !dom.window.document.getElementById('reviewBtn'));
}

// M4: the fridge-space note. Kevin's exact thresholds — 4+ Large portions
// or 8+ Smalls — and BELOW them nobody needs warning, so silence below is
// as much the spec as the note above. Asserted by ELEMENT
// (.container-space-note), never by page text, per the gate's own rule.
// Per-lb cuts are vacuum bags and never count toward either threshold.
{
  const BIG = { weekLabel: 'Week of Jul 22', dishes: [
    { name: 'Big Dish', variants: [{ label: 'Small (~4)', price: 40, cost: 20 }, { label: 'Large (~8)', price: 80, cost: 40 }] },
  ] };
  const drive = async (variantIdx, times) => {
    const dom = boot(form, BIG); await sleep(150);
    const d = dom.window.document, w = dom.window;
    d.getElementById('custName').value = 'Test';
    for (let i = 0; i < times; i++) w.changeQty('0_0_' + variantIdx, 1);
    w.openReview();
    return d;
  };
  let d = await drive(1, 4);
  check('4 large portions trigger the fridge-space note', !!d.querySelector('.container-space-note'));
  check('the fridge-space note never blocks submitting', !!d.getElementById('submitBtn'));
  d = await drive(1, 3);
  check('3 larges stay silent — below the threshold nobody needs warning', !d.querySelector('.container-space-note'));
  d = await drive(0, 8);
  check('8 smalls trigger the fridge-space note', !!d.querySelector('.container-space-note'));
  d = await drive(0, 7);
  check('7 smalls stay silent', !d.querySelector('.container-space-note'));
}

// ── The week heads-up banner (published from the Week tab) ────────────────
// This feature was wired end to end EXCEPT that publishWeek dropped the
// value and no page rendered it, so checking the box did nothing anywhere.
// These checks exist so that can never be true again silently: the banner
// must appear on all three customer surfaces when published, and must
// DISAPPEAR when an unchecked week is published (an empty notice clears it).
{
  const NOTICE = 'Delivery slides to Thursday this week.';
  const withNotice = { ...CFG, notice: NOTICE };

  const f1 = boot(form, withNotice); await sleep(150);
  check('form.html shows a published heads-up banner',
    !!f1.window.document.querySelector('.week-notice')
    && f1.window.document.querySelector('.week-notice').textContent.includes(NOTICE));

  const f2 = boot(form, { ...CFG, notice: '' }); await sleep(150);
  check('form.html shows NO banner when the week publishes an empty notice',
    !f2.window.document.querySelector('.week-notice'));

  const f3 = boot(form, CFG); await sleep(150);
  check('form.html shows no banner when the field is absent entirely',
    !f3.window.document.querySelector('.week-notice'));

  // A paused week still needs its banner — "we're off AND here's why" is
  // exactly when a heads-up matters most.
  const f4 = boot(form, { ...CFG, paused: true, pausedMsg: 'Back next week.', notice: NOTICE }); await sleep(150);
  check('form.html shows the banner even on a paused week',
    !!f4.window.document.querySelector('.week-notice'));

  const m1 = boot(menu, withNotice); await sleep(150);
  check('menu.html shows a published heads-up banner',
    !!m1.window.document.querySelector('.week-notice')
    && m1.window.document.querySelector('.week-notice').textContent.includes(NOTICE));

  const m2 = boot(menu, CFG); await sleep(150);
  check('menu.html shows no banner when none is published',
    !m2.window.document.querySelector('.week-notice'));

  const m3 = boot(menu, { ...CFG, paused: true, pausedMsg: 'Back next week.', notice: NOTICE }); await sleep(150);
  check('menu.html shows the banner even on a paused week',
    !!m3.window.document.querySelector('.week-notice'));

  // The banner is escaped like everything else customers can see.
  const m4 = boot(menu, { ...CFG, notice: '<script>alert(1)</script>' }); await sleep(150);
  check('a published notice is HTML-escaped, never executed',
    !/<script>alert\(1\)<\/script>/.test(m4.window.document.querySelector('.week-notice').innerHTML));

  if (landing) {
    const l1 = boot(landing, withNotice); await sleep(200);
    check('order.html (landing) shows a published heads-up banner',
      !!l1.window.document.querySelector('.week-notice')
      && l1.window.document.querySelector('.week-notice').textContent.includes(NOTICE));

    const l2 = boot(landing, CFG); await sleep(200);
    check('order.html shows no banner when none is published',
      !l2.window.document.querySelector('.week-notice'));

    // The landing page was fully static before this feature. A dead worker
    // must leave it exactly as it was, never an error state.
    const l3 = new JSDOM(landing, { runScripts: 'dangerously', url: 'https://x.test/',
      beforeParse(w) { w.fetch = () => Promise.reject(new Error('worker down')); } });
    await sleep(200);
    check('order.html survives a dead worker with no banner and no error',
      !l3.window.document.querySelector('.week-notice')
      && !!l3.window.document.getElementById('orderBtn'));
  }
}


// ── Order window (Wed-Sun) ─────────────────────────────────────────────────
// order.html greyed out its own button, but menu.html and main-menu.html both
// linked STRAIGHT to form.html with no gate, so anyone following those could
// order on a Monday — which actually happened. form.html now gates itself,
// because link-level gating is whack-a-mole and the form is the one place a
// gate cannot be walked around. Clock is frozen so this never flakes by weekday.
{
  const CFG2 = { weekLabel: 'Week of Jul 22', dishes: [{ name: 'Gumbo', variants: [{ label: 'Small (~4)', price: 40, cost: 20 }] }] };
  const bootAt = (html, cfg, dayISO, url) => new JSDOM(html, { runScripts: 'dangerously', url: url || 'https://x.test/', beforeParse(w) {
    const Real = w.Date;
    const Fake = function (...a) { return a.length ? new Real(...a) : new Real(dayISO); };
    Fake.now = () => new Real(dayISO).getTime(); Fake.parse = Real.parse; Fake.UTC = Real.UTC;
    Fake.prototype = Real.prototype; w.Date = Fake;
    w.fetch = () => Promise.resolve({ json: () => Promise.resolve(cfg) });
    const st = {};
    Object.defineProperty(w, 'localStorage', { value: { getItem: k => (k in st ? st[k] : null), setItem: (k, v) => { st[k] = String(v); }, removeItem: k => { delete st[k]; }, clear: () => {} }, configurable: true });
  } });
  const MON = '2026-07-27T10:00:00', WED = '2026-07-29T10:00:00';
  const mainMenu = fs.existsSync('main-menu.html') ? fs.readFileSync('main-menu.html', 'utf8') : null;

  let g1 = bootAt(form, CFG2, MON); await sleep(200);
  check('form.html on a MONDAY shows closed and renders NO order form',
    /Orders are closed right now/.test(g1.window.document.body.textContent) && !g1.window.document.getElementById('reviewBtn'));
  let g2 = bootAt(form, CFG2, WED); await sleep(200);
  check('form.html on a WEDNESDAY renders the form normally', !!g2.window.document.getElementById('reviewBtn'));
  let g3 = bootAt(form, { ...CFG2, notice: 'Heads up.' }, MON); await sleep(200);
  check('the heads-up banner still shows on a closed day', !!g3.window.document.querySelector('.week-notice'));

  let g4 = bootAt(menu, CFG2, MON); await sleep(200);
  check('menu.html on a MONDAY offers NO link to the form',
    !g4.window.document.querySelector('a[href="form.html"]'));
  let g5 = bootAt(menu, CFG2, WED); await sleep(200);
  check('menu.html on a WEDNESDAY offers the order link', !!g5.window.document.querySelector('a[href="form.html"]'));

  if (mainMenu) {
    let g6 = bootAt(mainMenu, CFG2, MON); await sleep(250);
    check('main-menu.html on a MONDAY offers no "Go order" link', !g6.window.document.querySelector('a[href="form.html"]'));
    let g7 = bootAt(mainMenu, CFG2, WED); await sleep(250);
    check('main-menu.html on a WEDNESDAY offers "Go order"', !!g7.window.document.querySelector('a[href="form.html"]'));
  }

  // order.html's own gate. It greys the button rather than hiding a link, and
  // NOTHING covered it until the rule moved into _partials/orderWindow.js —
  // the page whose gate was written first was the only one not asserted on.
  if (landing) {
    const btnOf = (dom) => dom.window.document.getElementById('orderBtn');
    let o1 = bootAt(landing, CFG2, MON); await sleep(200);
    check('order.html on a MONDAY greys its order button and says why',
      /btn-inactive/.test(btnOf(o1).className)
      && !btnOf(o1).getAttribute('href')
      && o1.window.document.getElementById('orderMsg').style.display === 'block');

    let o2 = bootAt(landing, CFG2, WED); await sleep(200);
    check('order.html on a WEDNESDAY leaves the button live',
      !/btn-inactive/.test(btnOf(o2).className)
      && btnOf(o2).getAttribute('href') === 'form.html');

    // ?preview=1 is Kevin's, not a customer's. A customer never has it in
    // their URL, so this cannot change what anyone else sees.
    let o3 = bootAt(landing, CFG2, MON, 'https://x.test/order.html?preview=1'); await sleep(200);
    check('order.html on a MONDAY with ?preview=1 stays orderable for Kevin',
      !/btn-inactive/.test(btnOf(o3).className)
      && btnOf(o3).getAttribute('href') === 'form.html');
  }
}

console.log('menu.html');
{
  const dom = boot(menu, CFG); await sleep(150);
  const h = dom.window.document.body.innerHTML;
  check('omakase is pitched above the dinners', h.indexOf('Omakase') < h.indexOf("This Week's Dinners"));
  check('menu explains size as per-meal too', /more than one meal/.test(h) && /about 4 servings/.test(h));
}
{
  const dom = boot(menu, { weekLabel: 'W', dishes: [], paused: true }); await sleep(150);
  check('a paused week beats the empty-menu notice', /Taking this week off/.test(dom.window.document.body.innerHTML));
}

// Offline submit queue: the last unprotected inch between a customer's thumb
// and the worker.
{
  const store = {};
  const dom = boot(form, CFG, store); await sleep(150);
  dom.window.fetch = (url) => (String(url).includes('/submit')
    ? Promise.reject(new Error('offline'))
    : Promise.resolve({ ok: true, json: () => Promise.resolve(CFG) }));
  dom.window.changeQty('0_0_0', 1);
  dom.window.document.getElementById('custName').value = 'Dave';
  dom.window.document.getElementById('custAddress').value = '1 St';
  dom.window.submitOrder(); await sleep(200);
  check('a submit that fails offline is kept, not lost', !!store['ltb-submit-queue']
    && JSON.parse(store['ltb-submit-queue']).length === 1);
  check('the customer is told it is saved and will send itself', /saved on this phone/.test(dom.window.document.body.innerHTML));

  const queuedId = JSON.parse(store['ltb-submit-queue'])[0].clientId;
  const sent = [];
  const dom2 = new JSDOM(form, {
    runScripts: 'dangerously', url: 'https://x.test/',
    beforeParse(w) {
      w.fetch = (url, opts) => {
        if (String(url).includes('/submit')) { sent.push(JSON.parse(opts.body)); return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) }); }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(CFG) });
      };
      Object.defineProperty(w, 'localStorage', { value: {
        getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); },
        removeItem: k => { delete store[k]; }, clear: () => {},
      }, configurable: true });
    },
  });
  await sleep(300);
  check('a queued order sends itself on the next visit', sent.length === 1);
  check('the retry reuses the original id, so it can never duplicate', sent.length === 1 && sent[0].clientId === queuedId);
  void dom2;
}

// Catalog page
{
  const catalog = fs.readFileSync('main-menu.html', 'utf8');
  const dom = boot(catalog, { weekLabel: 'W', dishes: [{ name: 'Bo Ssam' }] }); await sleep(200);
  const d = dom.window.document;
  check('catalog blocks carry the data the filters need', d.querySelectorAll('.dish[data-cuisine]').length > 20);
  check('diet and cuisine chips render', !!d.getElementById('dietChips') && !!d.getElementById('cuisineChips'));
  const before = Array.from(d.querySelectorAll('.dish[data-name]')).filter(e => e.style.display !== 'none').length;
  dom.window.__catFilter('diet', 'vegan');
  const after = Array.from(d.querySelectorAll('.dish[data-name]')).filter(e => e.style.display !== 'none').length;
  check('a diet filter actually narrows the catalog', after > 0 && after < before);
  dom.window.__catFilter('diet', 'vegan');
  check('tapping the same chip clears it', Array.from(d.querySelectorAll('.dish[data-name]')).filter(e => e.style.display !== 'none').length === before);
  check('this week is badged onto the catalog', /on this week's menu/.test(d.body.innerHTML));
}

// One bottle for the week, and the by-request chip
{
  const dom = boot(menu, { ...CFG, oneBottle: { label: 'Crisp lager', note: 'Crisp lager works with everything on the menu this week.' } });
  await sleep(150);
  check('the week one-bottle card renders when published', /One bottle for the week/.test(dom.window.document.body.innerHTML));
}
{
  const cfg = { ...CFG, dishes: [{ ...CFG.dishes[0], requested: true }] };
  const dom = boot(form, cfg); await sleep(150);
  check('a dish that made the week by request says so', /by request/.test(dom.window.document.body.innerHTML));
}

// Customer favorite: earned at publish, shown on every customer surface.
{
  const favCfg = { ...CFG, dishes: [{ ...CFG.dishes[0], favorite: true }, CFG.dishes[1]] };
  const dom = boot(form, favCfg); await sleep(150);
  check('the order form marks a customer favorite', !!dom.window.document.querySelector('.fav-chip'));
  const dom2 = boot(menu, favCfg); await sleep(150);
  check('the weekly menu marks it too', !!dom2.window.document.querySelector('.fav-chip'));
  const plain = boot(form, CFG); await sleep(150);
  check('a dish that has not earned it stays unmarked', !plain.window.document.querySelector('.fav-chip'));
}

// ── pipeline.html: the roster now arrives at runtime ────────────────────────
// The 30 cards in this page are generated from src/pipelineDishes.js at build
// time. Once the app publishes a roster, the page swaps them for it. Both
// halves need proving: the swap, and the fallback that carries the page when
// the swap does not happen, because the worker deploys by hand-paste and there
// is always a window where it has not been pasted.
//
// This needs its own boot: the page fetches two different endpoints and the
// shared one above answers every URL with the same config object.
console.log('\npipeline.html');
{
  const pipeline = fs.readFileSync('pipeline.html', 'utf8');
  const bootPipeline = (routes) => new JSDOM(pipeline, {
    runScripts: 'dangerously',
    url: 'https://x.test/',
    beforeParse(w) {
      w.fetch = (u) => {
        const hit = Object.keys(routes).find(k => String(u).indexOf(k) >= 0);
        return hit
          ? Promise.resolve({ ok: true, json: () => Promise.resolve(routes[hit]) })
          : Promise.reject(new Error('unrouted ' + u));
      };
      Object.defineProperty(w, 'localStorage', {
        value: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
        configurable: true,
      });
    },
  });
  const VOTES = { top: [{ dish: 'Fesenjan', votes: 3 }], ballots: 2 };

  // Nothing published yet: exactly the page as it shipped.
  {
    const d = bootPipeline({ '/config': { pipeline: [] }, '/votes': VOTES }).window.document;
    await sleep(150);
    const cards = d.querySelectorAll('.dish[data-dish]');
    check('an empty roster leaves the built-in cards alone', cards.length === 30, `got ${cards.length}`);
    check('every built-in card has exactly one vote button',
      d.querySelectorAll('.vote-btn').length === cards.length);
    check('the All count matches the built-in cards',
      /All 30/.test(d.querySelector('.filter-btn[data-filter="all"]').textContent));
  }

  // A published roster replaces them.
  {
    const roster = [
      { key: 'Suya Flank Steak', title: 'Suya Flank Steak, Coconut Rice', origin: 'Nigeria &middot; Texas', desc: 'Peanut crust.', diet: null, contains: 'Contains: Peanuts.' },
      { key: 'Brand New Thing', title: 'Brand New Thing', origin: 'Nowhere', desc: 'Green.', diet: 'veg', note: 'Still testing.' },
    ];
    const dom = bootPipeline({ '/config': { pipeline: roster }, '/votes': { top: [{ dish: 'Brand New Thing', votes: 5 }], ballots: 4 } });
    await sleep(150);
    const d = dom.window.document;
    const cards = d.querySelectorAll('.dish[data-dish]');
    check('a published roster replaces the built-in cards', cards.length === 2, `got ${cards.length}`);
    check('a dish the build never knew about is on the page',
      !!d.querySelector('[data-dish="Brand New Thing"]'));
    check('the All count follows the published roster',
      /All 2/.test(d.querySelector('.filter-btn[data-filter="all"]').textContent));
    check('vote buttons are wired once, not twice',
      d.querySelectorAll('.vote-btn').length === 2, `got ${d.querySelectorAll('.vote-btn').length}`);
    check('the diet pill is re-applied to swapped-in cards',
      d.querySelectorAll('.diet-pill').length === 1);
    // Authored entities must survive. The generator does not escape them and
    // neither does the runtime renderer, which is the one thing both must agree on.
    check('an authored HTML entity still renders as its character',
      d.querySelector('.dish-origin').textContent.includes('·'),
      d.querySelector('.dish-origin').textContent);
    check('the board re-labels itself from the new cards',
      /Brand New Thing/.test(d.querySelector('.board-name').textContent));
    check('cards stay siblings of the vote bar, with no wrapper element',
      d.getElementById('voteBar').previousElementSibling.className === 'dish');
    // The filter closed over a NodeList once. After a swap those nodes are
    // detached, and hiding a detached node looks exactly like success.
    d.querySelector('.filter-btn[data-filter="veg"]').click();
    const visible = [...d.querySelectorAll('.dish[data-dish]')].filter(c => c.style.display !== 'none');
    check('filtering still works on swapped-in cards', visible.length === 1
      && visible[0].getAttribute('data-dish') === 'Brand New Thing', `${visible.length} visible`);
  }

  // The roster lands as markup, so a tag in it must not become an element.
  {
    const d = bootPipeline({
      '/config': { pipeline: [{ key: 'X', title: '<img src=x onerror=boom>', origin: 'O', desc: 'D' }] },
      '/votes': { top: [], ballots: 0 },
    }).window.document;
    await sleep(150);
    check('a tag in the published roster is rendered as text, not injected',
      d.querySelectorAll('.dish img').length === 0
      && d.querySelector('.dish-name').textContent.includes('<img'));
  }

  // A worker that has not been pasted yet has no pipeline field at all.
  {
    const d = bootPipeline({ '/config': { weekLabel: 'Week of Jul 22' }, '/votes': VOTES }).window.document;
    await sleep(150);
    check('a config with no roster field at all leaves the page intact',
      d.querySelectorAll('.dish[data-dish]').length === 30);
  }
}

console.log(failed === 0 ? '\nCUSTOMER PAGES: ALL PASS' : `\nCUSTOMER PAGES: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
