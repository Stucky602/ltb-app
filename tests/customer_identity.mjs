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

console.log(f === 0 ? '\nCUSTOMER IDENTITY: ALL PASS' : `\nCUSTOMER IDENTITY: ${f} FAILURES`);
process.exit(f ? 1 : 0);
