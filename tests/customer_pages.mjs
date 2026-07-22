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
  check('sizes state what they feed', /serves ~4/.test(d.getElementById('omSizeSmall').textContent) && /serves about 4/.test(d.body.innerHTML));

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

console.log('menu.html');
{
  const dom = boot(menu, CFG); await sleep(150);
  const h = dom.window.document.body.innerHTML;
  check('omakase is pitched above the dinners', h.indexOf('Omakase') < h.indexOf("This Week's Dinners"));
  check('sizes are explained on the menu too', /serves about 4/.test(h));
}
{
  const dom = boot(menu, { weekLabel: 'W', dishes: [], paused: true }); await sleep(150);
  check('a paused week beats the empty-menu notice', /Taking this week off/.test(dom.window.document.body.innerHTML));
}

console.log(failed === 0 ? '\nCUSTOMER PAGES: ALL PASS' : `\nCUSTOMER PAGES: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
