// tests/customer_identity.mjs — recognising a returning customer.
//
// WHAT THIS PROTECTS
//
// Two separate promises, and the second one is the dangerous one.
//
// 1. RECOGNITION IS CORRECT. One device resolves to one profile, another
//    person's device never resolves to yours, and a revoked device stops
//    working without taking that customer's other devices down with it.
//
// 2. THE PERSONALIZED PAYLOAD LEAKS NOTHING. The landing page is a PUBLIC
//    surface. Anything the snapshot carries is one stolen phone, one shared
//    screen, or one shoulder-glance away from a stranger. So the assertions
//    below check for the ABSENCE of address, phone, order history, and regular
//    ids — testing for absence rather than presence, because the failure that
//    matters here is a leak, not a gap.
//
// The privacy-wall assertion at the bottom is the structural version of the
// same thing: no customer page may import a module that holds real customer
// data, so a future "simplification" cannot quietly route PII to the public
// page. journal.js has been walled off this way for a while; this extends the
// wall to the modules Feature 5 introduces a temptation around.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  mintDeviceToken, ensureDeviceToken, forgetDevice, DEVICE_KEY,
  ensureProfileId, deviceLabel, generateClaimCode, claimIsUsable, isClaimExpired,
  CLAIM_TTL_MS, buildProfileSnapshot, sanitizeSnapshot,
} from '../src/customerDevice.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

// A localStorage stand-in.
function fakeStore() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    _size: () => m.size,
  };
}
const realCrypto = (await import('crypto')).webcrypto;
globalThis.btoa = globalThis.btoa || (s => Buffer.from(s, 'binary').toString('base64'));

// ── Minting ─────────────────────────────────────────────────────────────────
{
  const a = mintDeviceToken(realCrypto);
  const b = mintDeviceToken(realCrypto);
  ok('a token is minted', typeof a === 'string' && a.length >= 20, String(a));
  ok('two mints differ', a !== b);
  ok('the token is url-safe', /^[A-Za-z0-9_-]+$/.test(a), a);
  ok('and carries at least 128 bits', a.length >= 22,
    '32 raw bytes base64url is ~43 chars; anything short of 128 bits is guessable');

  // Not a fingerprint: nothing about the device may feed the value.
  // Comments stripped first: the module's own documentation says "no canvas
  // hashing, no font probing", which the first version of this check matched.
  const src = fs.readFileSync(path.join(ROOT, 'src/customerDevice.js'), 'utf8')
    .replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  ok('no canvas, font, or screen probing anywhere in the module',
    !/canvas|getContext|screen\.|navigator\.plugins|fonts/i.test(src),
    'a credential derived from the device is a fingerprint by another name');
}

// ── Storage round-trip ──────────────────────────────────────────────────────
{
  const store = fakeStore();
  const first = ensureDeviceToken(store, realCrypto);
  const second = ensureDeviceToken(store, realCrypto);
  ok('the same browser keeps the same token', first === second);
  ok('and it persists under the documented key', !!store.getItem(DEVICE_KEY));

  ok('forgetting clears it', forgetDevice(store) === true && store.getItem(DEVICE_KEY) === null);
  const third = ensureDeviceToken(store, realCrypto);
  ok('and the next visit mints a fresh one', third !== first);

  // Private browsing: storage throws. This must degrade, never throw upward.
  const hostile = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); }, removeItem: () => { throw new Error('denied'); } };
  ok('storage being unavailable returns null rather than throwing',
    ensureDeviceToken(hostile, realCrypto) === null,
    'personalization is an enhancement and must never be able to block ordering');
  ok('and forgetting is survivable too', forgetDevice(hostile) === false);

  // A corrupted value must self-heal rather than wedge the page.
  const corrupt = fakeStore();
  corrupt.setItem(DEVICE_KEY, 'not json at all');
  ok('a corrupt stored value is replaced, not fatal', typeof ensureDeviceToken(corrupt, realCrypto) === 'string');
}

// ── Profile ids are opaque ──────────────────────────────────────────────────
{
  const reg = { id: 'reg_7', name: 'Kevin Strickland' };
  const id = ensureProfileId(reg, () => 'uuid-1');
  ok('a profile id is minted for a regular', id === 'uuid-1');
  ok('an existing one is reused', ensureProfileId({ ...reg, customerProfileId: 'kept' }) === 'kept');
  ok('it is not derived from the name', !/kevin|strickland/i.test(id),
    'the worker keys personalization on this; it must reveal no identity');
  ok('nor from the regular id', !id.includes('reg_7'));
}

// ── Device labels describe, they do not fingerprint ─────────────────────────
{
  ok('an iPhone is labelled', deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)') === 'iPhone');
  ok('an unknown agent still gets a label', deviceLabel('') === 'Device');
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0';
  ok('the label is short and carries no version detail',
    deviceLabel(ua).length < 20 && !/537|120|10_15/.test(deviceLabel(ua)), deviceLabel(ua));
}

// ── Claim codes ─────────────────────────────────────────────────────────────
{
  const code = generateClaimCode(realCrypto);
  ok('a claim code is generated', /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code), code);
  ok('it avoids characters that are ambiguous read aloud', !/[O0I1]/.test(code),
    'Kevin reads these to people over the phone');

  const codes = new Set();
  for (let i = 0; i < 200; i++) codes.add(generateClaimCode(realCrypto));
  ok('200 codes are effectively unique', codes.size >= 198, String(codes.size));

  const now = Date.now();
  const live = { profileId: 'p1', expiresAt: new Date(now + CLAIM_TTL_MS).toISOString(), used: false };
  ok('a fresh code is usable', claimIsUsable(live, now).ok);
  ok('a used code is not', claimIsUsable({ ...live, used: true }, now).ok === false);
  ok('an expired code is not', claimIsUsable({ ...live, expiresAt: new Date(now - 1000).toISOString() }, now).ok === false);
  ok('an unknown code is not', claimIsUsable(null, now).ok === false);
  ok('expiry is a real check, not a formality', isClaimExpired({ expiresAt: new Date(now - 1).toISOString() }, now));
  ok('a refusal explains itself in plain words',
    /expired|used|recognised/i.test(claimIsUsable({ ...live, used: true }, now).reason));
}

// ── The snapshot: what it says ──────────────────────────────────────────────
{
  const regular = { id: 'reg_1', name: 'Kevin Strickland', customerProfileId: 'p1' };
  const orders = [
    { regularId: 'reg_1', date: '2026-06-01', items: [{ dishId: 'bolognese', qty: 1 }, { dishId: 'gumbo', qty: 1 }] },
    { regularId: 'reg_1', date: '2026-06-15', items: [{ dishId: 'bolognese', qty: 2 }] },
    { regularId: 'reg_1', date: '2026-07-01', items: [{ dishId: 'bolognese', qty: 1 }] },
    { regularId: 'reg_OTHER', date: '2026-07-02', items: [{ dishId: 'chili', qty: 5 }] },
  ];
  const snap = buildProfileSnapshot({
    regular, orders, weekLabel: 'Week of Aug 3',
    weekDishIds: ['bolognese', 'gumbo', 'chili'],
  });

  ok('it greets by first name only', snap.greeting === 'Kevin',
    'a surname on a public page is more than the greeting needs');
  ok('a repeatedly ordered dish is marked usual', snap.annotations.bolognese.usual === true);
  ok('and counts correctly across orders', snap.annotations.bolognese.timesOrdered === 4,
    String(snap.annotations.bolognese.timesOrdered));
  ok('a once-ordered dish is not a usual', snap.annotations.gumbo.usual === false);
  ok('an unordered dish is marked new to them', snap.annotations.chili.newToYou === true);
  ok('another customer\u2019s orders do not leak in', snap.annotations.chili.timesOrdered === 0,
    'chili was ordered 5 times by a DIFFERENT regular');
  ok('the last-had date is recorded', snap.annotations.bolognese.lastHad === '2026-07-01');
  ok('annotations are keyed by dishId', Object.keys(snap.annotations).every(k => /^[a-z0-9-]+$/.test(k)),
    'a display-name key would drop a customer\u2019s whole history on a rename');
}

// ── The snapshot: what it must NEVER say ────────────────────────────────────
{
  const regular = {
    id: 'reg_1', name: 'Kevin Strickland', customerProfileId: 'p1',
    address: '123 Private Road, Cedar Park', phone: '512-555-0100',
    dietary: 'no shellfish', spice: 'hot', notes: 'pays late sometimes',
  };
  const orders = [{ regularId: 'reg_1', date: '2026-06-01', items: [{ dishId: 'bolognese', qty: 1 }] }];
  const snap = sanitizeSnapshot(buildProfileSnapshot({
    regular, orders, weekLabel: 'W', weekDishIds: ['bolognese'],
  }));
  const blob = JSON.stringify(snap);

  for (const [what, needle] of [
    ['a street address', '123 Private Road'],
    ['a phone number', '512-555-0100'],
    ['a surname', 'Strickland'],
    ['a dietary note', 'shellfish'],
    ['an owner note', 'pays late'],
    ['the regular id', 'reg_1'],
  ]) {
    ok(`the payload carries no ${what}`, !blob.includes(needle), blob.slice(0, 200));
  }

  ok('and no raw order records', !/"items"/.test(blob),
    'per-dish counts are the annotation; the orders themselves stay private');

  // The allowlist must hold against a future field, not just today's fields.
  const injected = sanitizeSnapshot({ ...snap, address: 'leaked', secretNote: 'leaked' });
  ok('an unexpected field is stripped rather than shipped',
    !JSON.stringify(injected).includes('leaked'),
    'the allowlist is what makes a future edit fail closed instead of leaking');
  ok('a null snapshot is survivable', sanitizeSnapshot(null) === null);
}

// ── The privacy wall ────────────────────────────────────────────────────────
{
  const pagesDir = path.join(ROOT, 'src/pages');
  // customerDevice.js is NOT walled: the pages legitimately include the ES5
  // partial of that name. The wall is about modules holding real customer data,
  // and the partial holds none — it mints a random value and stores it.
  const walled = ['regularsIntel.js', 'passport.js', 'journal.js', 'favorites.js', 'orderOps.js'];
  const offenders = [];

  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!/\.(html|js)$/.test(e.name)) continue;
      const t = fs.readFileSync(full, 'utf8');
      for (const mod of walled) {
        // The build has no import mechanism for these, so any mention is a
        // sign someone is trying.
        if (new RegExp(`(import|require|@include).*${mod.replace('.', '\\.')}`).test(t)) {
          offenders.push(`${path.relative(ROOT, full)} → ${mod}`);
        }
      }
    }
  };
  walk(pagesDir);

  ok('no customer page pulls in a module holding real customer data',
    offenders.length === 0, offenders.join('\n      '));

  // The customer-facing partial must be self-contained ES5.
  const partial = fs.readFileSync(path.join(pagesDir, '_partials/customerDevice.js'), 'utf8');
  ok('the customer device partial imports nothing', !/^import |require\(/m.test(partial));
  ok('and mints nothing at page load', !/__ltbDeviceToken\(\);?$/m.test(partial),
    'a browser that only reads the menu should not be carrying a credential');
}

// ── The offline queue must not enroll twice ─────────────────────────────────
{
  const form = fs.readFileSync(path.join(ROOT, 'src/pages/form.page.html'), 'utf8');
  const mintAt = form.indexOf('submitPayload.deviceToken');
  const queueAt = form.indexOf('enqueueSubmit');
  ok('the token joins the payload before it can be queued',
    mintAt > 0 && queueAt > 0 && mintAt < form.lastIndexOf('enqueueSubmit('),
    'a retry that mints a fresh token enrolls one person twice and splits their history');
  ok('the queued entry stores the whole payload', /q\.push\(\{[^}]*payload: payload/.test(form));
}


// ── The landing page degrades, always ───────────────────────────────────────
//
// Personalization is an enhancement bolted onto a page that already worked.
// Every one of these asserts that the bolt cannot break the page underneath it:
// no credential, worker down, revoked device, blocked storage — all of them end
// with an ordering page that works.
{
  const partial = fs.readFileSync(path.join(ROOT, 'src/pages/_partials/personalize.js'), 'utf8');

  // The rule is about BEHAVIOUR, not a literal line. It was pinned to
  // `if (!token) return;` and broke the moment the claim-code path made that
  // `if (!token) { claimUi(); return; }` — same guarantee, different shape.
  // A fixture pinned to exact source is the same trap as a hardcoded count.
  // Behaviour, not the literal line. This was pinned to the exact source and
  // broke the moment the claim path gained a feature flag — same guarantee,
  // different shape. Third time a pinned source string has done this.
  ok('the greeting bails when there is no credential rather than making one',
    /if \(!token\) \{[^}]*claimUi\(\)[^}]*return;/.test(partial),
    'a visitor who only reads the menu must not be given one');
  ok('the greeting PEEKS rather than minting',
    /__ltbDeviceTokenPeek\(\)/.test(partial),
    'the minting version created a credential for anyone who merely opened the page');
  ok('and the only mint call is inside the claim handler',
    (partial.match(/__ltbDeviceToken\(\)/g) || []).length === 1,
    'minting belongs at order time and in the claim handler, nowhere else');

  ok('a worker failure is caught and ignored', /\.catch\(function/.test(partial));
  ok('an unrecognised response renders nothing', /recognized !== true/.test(partial));
  ok('the whole thing is wrapped so nothing can throw upward', /catch \(e\)/.test(partial));

  ok('the greeting is inserted BEFORE the notice, not over it',
    /insertAdjacentHTML\('beforebegin'/.test(partial),
    "the week's heads-up banner outranks a greeting");

  ok('the name is escaped before it reaches the DOM', /replace\(\/\[<>&"\]\/g/.test(partial));

  ok('history is handed over in sessionStorage, not a URL',
    /sessionStorage/.test(partial) && !/location\.search|\?personal=/.test(partial),
    'a URL carrying ordering history gets shared, screenshotted, and logged');

  ok('"Not you?" confirms before forgetting', /window\.confirm/.test(partial));
  ok('and clears the handover too', /clearStash\(\)/.test(partial));

  const order = fs.readFileSync(path.join(ROOT, 'order.html'), 'utf8');
  ok('the built landing page carries the greeting styles', /personal-greeting/.test(order));
  ok('and asks the worker for it', /customer-home/.test(order));
  // Script contents stripped first: greetingHtml() legitimately BUILDS that
  // markup as a JS string. What must not exist is the markup sitting in the
  // document, which is what an unrecognised visitor would otherwise see.
  const orderBody = order.replace(/<script[\s\S]*?<\/script>/g, '');
  ok('but renders no greeting markup by default', !/class="personal-greeting"/.test(orderBody),
    'the default page must look exactly like what an unknown visitor sees today');
}

// ── The form shows one tag, not a report card ───────────────────────────────
{
  const form = fs.readFileSync(path.join(ROOT, 'form.html'), 'utf8');
  ok('the form reads the handover', /__ltbPersonal/.test(form));
  ok('it tags a dish the customer has never had', /New to you/.test(form));
  ok('and one they order often', /One of your usuals/.test(form));
  ok('the handover goes stale after an hour', /3600000/.test(form),
    'a greeting from last week is worse than none');

  // The count is deliberately NOT rendered.
  ok('no order count is shown next to a dish',
    !/timesOrdered/.test(form),
    '"you have ordered this 4 times" reads like being watched');
  ok('and no last-had date either', !/lastHad/.test(form));

  // One tag per dish, enforced by the else-if.
  ok('a dish gets at most one tag', /if \(pann\.newToYou\)[\s\S]{0,120}else if \(pann\.usual\)/.test(form));
}


// ── The change-request surface never promises ──────────────────────────────
//
// Kevin decides. So the copy says "request", "asked", and "waiting", and never
// "updated", "changed", or "done". A customer who believes their change landed
// and then receives the original order is a worse outcome than one who was told
// plainly that Kevin has to say yes.
{
  const amend = fs.readFileSync(path.join(ROOT, 'src/pages/_partials/amendRequest.js'), 'utf8');
  // Comments stripped: the file's own header explains the rule by quoting the
  // forbidden words, which the first version of this check matched. Second time
  // this exact trap has fired today.
  const amendCode = amend.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  ok('the confirmation says asked, not changed',
    /Asked\./.test(amendCode) && !/(Order updated|Change applied|Done\b)/i.test(amendCode));
  ok('the caveat states nothing changes without Kevin',
    /Nothing changes until Kevin says yes/.test(amend));
  ok('the total is presented as an estimate',
    /Estimated new total/.test(amend) && /confirms the final amount/.test(amend),
    'the real number is priced by the worker from the published menu');

  // The offline rule is the opposite of the order form's, deliberately.
  ok('offline it says nothing was sent',
    /nothing was sent/.test(amend),
    'the order form queues because a missed order is recoverable; a missed change request the customer believes landed is not');
  ok('and it does NOT queue silently', !/enqueue|localStorage\.setItem/.test(amend));

  ok('repeat taps collapse to one op per dish',
    /patch = patch\.filter\(/.test(amend),
    'three setQty ops for one dish is an accurate log of fidgeting and a terrible thing to read');
  ok('a change back to the original sends nothing',
    /if \(next !== original\)/.test(amend));
  ok('the request carries an idempotency key', /idempotencyKey/.test(amend));
  ok('and the device credential', /X-LTB-Device/.test(amend));
  ok('quantities are clamped', /Math\.max\(0, Math\.min\(20/.test(amend));

  const order = fs.readFileSync(path.join(ROOT, 'order.html'), 'utf8');
  ok('the surface is hidden by default',
    /id="amendBox"[^>]*style="display:none"/.test(order),
    'a customer with no live order must never see it exist');
}

// ── The snapshot carries an order without carrying a person ────────────────
{
  const snap = sanitizeSnapshot(buildProfileSnapshot({
    regular: { id: 'r1', name: 'Sarah Jones', address: '99 Secret St', phone: '555-0000' },
    orders: [], weekLabel: 'W', weekDishIds: ['chili'],
    currentOrder: { id: 'o9', items: [{ dishId: 'chili', name: 'Chili', variant: 'Small', qty: 2 }] },
  }));
  const blob = JSON.stringify(snap);

  ok('the live order rides the snapshot', !!snap.currentOrder && snap.currentOrder.items.length === 1);
  ok('and still no address', !blob.includes('Secret'));
  ok('and still no phone', !blob.includes('555-0000'));
  ok('and still no surname', !blob.includes('Jones'));
  ok('the order carries no prices', !/price|total|cost/i.test(blob),
    'a customer page cannot be trusted with pricing and is not asked to be');

  const none = sanitizeSnapshot(buildProfileSnapshot({
    regular: { id: 'r1', name: 'Sarah' }, orders: [], weekLabel: 'W', weekDishIds: [],
  }));
  ok('no live order means no currentOrder key at all', !('currentOrder' in none));
}


// ── The code has somewhere to be typed ─────────────────────────────────────
//
// It did not, until Kevin asked. The owner app could generate a claim code and
// the worker could redeem one, and there was no box on any customer page — a
// feature with no door. This asserts the door exists and behaves.
{
  const pz = fs.readFileSync(path.join(ROOT, 'src/pages/_partials/personalize.js'), 'utf8');
  const code = pz.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  ok('the landing page offers a way to enter a claim code', /pgClaimGo/.test(code));
  ok('and posts it to the redeem endpoint', /customer-device\/claim/.test(code));
  ok('with the device credential attached', /X-LTB-Device/.test(code));

  // Only when it means something.
  ok('the offer appears when the browser is unrecognised',
    /recognized !== true[\s\S]{0,200}claimUi\(\)/.test(code));
  ok('and when it has no credential at all',
    /if \(!token\) \{[^}]*claimUi\(\)[^}]*return;/.test(code),
    'a permanent "enter a code" prompt on a friends-only site reads like a login wall');
  ok('a recognised customer is never shown it',
    !/recognized === true[\s\S]{0,120}claimUi/.test(code));

  // Minting inside the claim handler is the ONE exception to the never-mint-on-
  // load rule, and it has to be, because the code binds this browser.
  ok('the credential is minted inside the claim handler, not on page load',
    /pgClaimGo[\s\S]{0,900}__ltbDeviceToken\(\)/.test(code));

  ok('the code is normalised before sending', /toUpperCase\(\)/.test(code));
  ok('an obviously short code is refused locally', /length < 8/.test(code));

  ok('the worker\u2019s own error wording is shown',
    /res\.body\.error/.test(code),
    'expired, used, and unrecognised are different problems and a single message sends people back for a code they do not need');

  const order = fs.readFileSync(path.join(ROOT, 'order.html'), 'utf8');
  const body = order.replace(/<script[\s\S]*?<\/script>/g, '');
  ok('no claim markup renders by default', !/id="pgClaim"/.test(body),
    'it is inserted only when the page decides this browser needs it');
}

// ── The request box moved to the form ──────────────────────────────────────
{
  const menu = fs.readFileSync(path.join(ROOT, 'menu.html'), 'utf8');
  const form = fs.readFileSync(path.join(ROOT, 'form.html'), 'utf8');

  ok('the weekly menu no longer carries it', !/requestBtn/.test(menu));
  ok('the order form does', /requestBtn/.test(form));
  ok('and it is built from the whole registry, not this week',
    /ALL_DINNER_NAMES/.test(form),
    'asking for a dish that IS on this week is an order, and there is a button for that');
  ok('there is exactly one implementation',
    !/requestBoxHtml/.test(menu) && /requestBoxHtml/.test(form));
  ok('it never claims a send it did not get', /did not send/.test(form));
}


// ── The claim path has to actually be reachable ────────────────────────────
//
// Two bugs Kevin found by trying to use it, and they compounded:
//
//   1. The landing page called the MINTING accessor on load, so the "this
//      browser has no credential yet" branch could never fire — the call that
//      tested for it had just created one — and every menu-reader was quietly
//      enrolled.
//   2. The claim-code button required a customerProfileId, which was only
//      minted when an order was linked from an enrolled device. Every customer
//      predating device identity had none, so a code could never be generated
//      for exactly the people who need one.
{
  const cd = fs.readFileSync(path.join(ROOT, 'src/pages/_partials/customerDevice.js'), 'utf8');
  ok('there is a read that does not mint', /__ltbDeviceTokenPeek/.test(cd));

  const peek = cd.slice(cd.indexOf('__ltbDeviceTokenPeek'));
  const peekBody = peek.slice(0, peek.indexOf('__ltbForgetDevice'));
  ok('and it genuinely never mints', !/mint\(\)/.test(peekBody),
    'a peek that mints is the bug wearing a different name');

  const pz = fs.readFileSync(path.join(ROOT, 'src/pages/_partials/personalize.js'), 'utf8');
  ok('the greeting path uses the peek', /var token = \(typeof __ltbDeviceTokenPeek/.test(pz));
  ok('so a brand-new browser reaches the claim offer',
    /if \(!token\) \{[^}]*claimUi\(\)[^}]*return;/.test(pz));
  ok('and the offer respects its own flag',
    /__ltbFlag\('claimCode'\)/.test(pz),
    'it can be switched off like anything else optional');

  const app = fs.readFileSync(path.join(ROOT, 'src/App.jsx'), 'utf8');
  ok('a claim code mints a profile id when the customer has none',
    /ensureProfileId\(regular\)/.test(app),
    'a profile id is an opaque identifier and needs no order to be valid');

  const rt = fs.readFileSync(path.join(ROOT, 'src/components/RegularsTab.jsx'), 'utf8');
  ok('the button is not gated on having ordered',
    !/disabled=\{busy \|\| !regular\.customerProfileId\}/.test(rt));
  ok('and it tells Kevin where the customer types the code',
    /Ordered before, on a different phone/.test(rt),
    'he asked where it goes, which means the app never said');
}

console.log(f === 0 ? '\nCUSTOMER IDENTITY: ALL PASS' : `\nCUSTOMER IDENTITY: ${f} FAILURES`);
process.exit(f ? 1 : 0);
