// tests/feature_flags.mjs — kill switches for customer capabilities.
//
// WHY THIS EXISTS
//
// A great deal of customer-facing surface landed on ltbaustin.com in one day.
// Without a switch, a fault in any of it means editing code, pushing, waiting
// for a build, and hoping the gate is green, while the thing is broken in front
// of the people trying to order dinner.
//
// THE ASSERTION THAT MATTERS MOST is the last group: with every optional flag
// off, a customer can still see the menu and place an order. A flag may remove
// a nicety. A flag must never be able to stop somebody ordering. That is the
// difference between a safety mechanism and a new way to break the site.
//
// The second thing guarded here is the DUPLICATED EVALUATOR. worker.js is
// pasted into the Cloudflare dashboard by hand and cannot import from the repo,
// so the flag logic exists twice. A drifted copy would hand customers a
// different answer than the owner app believes it published, silently.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import {
  FLAGS, FLAG_IDS, STAGES, STAGE_IDS, DEFAULT_FLAGS,
  normalizeFlags, flagEnabled, resolveForCustomer, describeStage, NEVER_FLAGGED,
} from '../src/featureFlags.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

// ── The registry ────────────────────────────────────────────────────────────
{
  ok('there are flags', FLAGS.length > 0, String(FLAGS.length));
  ok('every flag has an id, a label, and a reason',
    FLAGS.every(x => x.id && x.label && x.why),
    'the reason is what Kevin reads when deciding whether to turn it off at 6am');
  ok('ids are unique', new Set(FLAG_IDS).size === FLAG_IDS.length);
  ok('every flag has a default', FLAG_IDS.every(id => DEFAULT_FLAGS[id]));

  // A declared flag nothing checks is a switch wired to nothing.
  const src = [
    fs.readFileSync(path.join(ROOT, 'src/pages/_partials/personalize.js'), 'utf8'),
    fs.readFileSync(path.join(ROOT, 'src/pages/form.page.html'), 'utf8'),
    fs.readFileSync(path.join(ROOT, 'worker.js'), 'utf8'),
  ].join('\n');
  const wired = ['personalization', 'amendments', 'claimCode', 'requestBox'];
  const unwired = wired.filter(id => !src.includes(id));
  ok('every flag for a SHIPPED capability is actually checked somewhere',
    unwired.length === 0, unwired.join(', '));
}

// ── Stages ──────────────────────────────────────────────────────────────────
{
  ok('stages run least to most exposed',
    STAGE_IDS[0] === 'off' && STAGE_IDS[STAGE_IDS.length - 1] === 'on',
    '"wider than it was" should read left to right in the owner UI');
  ok('every stage explains itself', STAGES.every(s => s.note));

  const f1 = normalizeFlags({ x: { stage: 'nonsense' } });
  ok('an unknown stage falls back to off', f1.personalization.stage === DEFAULT_FLAGS.personalization.stage);
  ok('an unknown flag id is dropped entirely', !('x' in f1));
  ok('a percentage is clamped', normalizeFlags({ personalization: { stage: 'percent', percent: 900 } }).personalization.percent === 100);
  ok('and cannot go negative', normalizeFlags({ personalization: { stage: 'percent', percent: -5 } }).personalization.percent === 0);
  ok('the tester list is capped', normalizeFlags({ personalization: { stage: 'testers', testers: Array(50).fill('p') } }).personalization.testers.length === 20);
}

// ── Evaluation ──────────────────────────────────────────────────────────────
{
  const flags = normalizeFlags({
    personalization: { stage: 'on' },
    amendments: { stage: 'owner' },
    awayMode: { stage: 'testers', testers: ['p1'] },
    jarReturn: { stage: 'percent', percent: 50 },
    requestBox: { stage: 'off' },
  });

  ok('on means on for everyone', flagEnabled(flags, 'personalization', {}));
  ok('off means off even for the owner', !flagEnabled(flags, 'requestBox', { isOwner: true }));
  ok('owner-stage reaches the owner', flagEnabled(flags, 'amendments', { isOwner: true }));
  ok('and nobody else', !flagEnabled(flags, 'amendments', { profileId: 'p9' }));
  ok('a tester sees it', flagEnabled(flags, 'awayMode', { profileId: 'p1' }));
  ok('a non-tester does not', !flagEnabled(flags, 'awayMode', { profileId: 'p2' }));
  ok('an unknown flag is off, not on', !flagEnabled(flags, 'notAThing', {}));

  // An anonymous browser cannot be bucketed, and must not be guessed at.
  ok('an unrecognised browser gets the generic experience for staged flags',
    !flagEnabled(flags, 'jarReturn', {}) && !flagEnabled(flags, 'awayMode', {}));

  // STABILITY. A percentage that re-rolls per page load shows a feature on
  // Monday and hides it on Tuesday, which reads as a bug and cannot be reported.
  let stable = true;
  for (let i = 0; i < 100; i++) {
    if (flagEnabled(flags, 'jarReturn', { profileId: 'steady' }) !== flagEnabled(flags, 'jarReturn', { profileId: 'steady' })) stable = false;
  }
  ok('a percentage rollout is stable per customer', stable,
    'the same people must keep seeing it until the number changes');

  const hits = Array.from({ length: 600 }, (_, i) => flagEnabled(flags, 'jarReturn', { profileId: 'p' + i })).filter(Boolean).length;
  ok('and it lands near the requested share', Math.abs(hits / 600 * 100 - 50) < 8, `${(hits / 600 * 100).toFixed(1)}%`);
}

// ── What reaches a customer ─────────────────────────────────────────────────
{
  const flags = normalizeFlags({ awayMode: { stage: 'testers', testers: ['p1', 'p2', 'p3'] }, jarReturn: { stage: 'percent', percent: 30 } });
  const payload = resolveForCustomer(flags, { profileId: 'p1' });
  const blob = JSON.stringify(payload);

  ok('a customer gets a flat map of booleans',
    Object.values(payload).every(v => typeof v === 'boolean'));
  ok('and every flag is answered', Object.keys(payload).length === FLAG_IDS.length);
  ok('no stage leaks', !blob.includes('stage'));
  ok('no tester list leaks', !blob.includes('p2') && !blob.includes('testers'),
    'shipping the list tells a customer how many households are in a test');
  ok('no percentage leaks', !blob.includes('30'));
}

// ── The two evaluators must agree ───────────────────────────────────────────
{
  const worker = fs.readFileSync(path.join(ROOT, 'worker.js'), 'utf8');
  ok('the worker carries its own evaluator', /function resolveFlags/.test(worker),
    'it is hand-pasted and cannot import from the repo');

  const m = worker.match(/const FLAG_DEFAULTS = \{([^}]*)\}/);
  ok('and declares the same flag ids', !!m);
  if (m) {
    const workerIds = [...m[1].matchAll(/(\w+)\s*:/g)].map(x => x[1]);
    const missing = FLAG_IDS.filter(id => !workerIds.includes(id));
    const extra = workerIds.filter(id => !FLAG_IDS.includes(id));
    ok('with nothing missing', missing.length === 0, missing.join(', '));
    ok('and nothing extra', extra.length === 0, extra.join(', '));
  }

  ok('the worker uses the same stable hash', /16777619/.test(worker) && /2166136261/.test(worker),
    'a different hash would bucket the same customer differently on each side');
  ok('and the same stage names', STAGE_IDS.filter(x => x !== 'off').every(x => worker.includes(`'${x}'`)));
}

// ── THE FLOOR: ordering survives every flag being off ───────────────────────
//
// The one assertion this whole file exists for.
{
  ok('the never-flagged list is written down', NEVER_FLAGGED.length >= 4);
  for (const item of ['the menu itself', 'placing an order']) {
    ok(`"${item}" is declared unflaggable`, NEVER_FLAGGED.includes(item));
  }
  const flagIdsLower = FLAG_IDS.map(x => x.toLowerCase());
  ok('and no flag id is about ordering or the menu',
    !flagIdsLower.some(id => /^order|^menu|checkout|allergen|reheat/.test(id)),
    'a switch that stops somebody ordering dinner is not a safety feature');

  // Proven by rendering, not by reading the code.
  const form = fs.readFileSync(path.join(ROOT, 'form.html'), 'utf8');
  const allOff = Object.fromEntries(FLAG_IDS.map(id => [id, { stage: 'off' }]));
  const cfg = {
    weekLabel: 'W',
    dishes: [{ name: 'Chili', variants: [{ label: 'Small', price: 10 }] }],
    bag: [], addons: [], fruit: [], desserts: [], sauces: [], spotlight: [],
    customerFlags: allOff,
  };
  // ?preview=1 — THE PAGE'S OWN ESCAPE HATCH, and without it this test is a
  // clock rather than a test.
  //
  // `ordersOpen()` is pure day-of-week: Sunday, or Wednesday through Saturday.
  // With no override the page rendered "Orders are closed right now" — which
  // has no order button — every Monday and Tuesday. The assertion then failed
  // for a reason with nothing to do with flags, and since Cloudflare runs
  // `npm test` on deploy, THAT WOULD HAVE BLACKED OUT THE SITE on two days a
  // week. It went unnoticed because the suite mostly ran on other days.
  //
  // A gate that depends on what day it is will eventually fail at the worst
  // possible moment.
  // Clock pinned to a Wednesday as well: customer_pages' guard no longer
  // accepts ?preview=1 alone, because preview opens the order window and does
  // nothing about time math (the queue-age failure of Aug 5 2026).
  const dom = new JSDOM(form, {
    runScripts: 'dangerously', url: 'https://ltbaustin.com/?preview=1',
    beforeParse(w) {
      const Real = w.Date;
      const DAY = '2026-07-29T10:00:00'; // a Wednesday, matching customer_pages' DEFAULT_DAY
      const Fake = function (...a) { return a.length ? new Real(...a) : new Real(DAY); };
      Fake.now = () => new Real(DAY).getTime(); Fake.parse = Real.parse; Fake.UTC = Real.UTC;
      Fake.prototype = Real.prototype; w.Date = Fake;
      w.fetch = () => Promise.resolve({ json: () => Promise.resolve(cfg) });
    },
  });
  await new Promise(r => setTimeout(r, 300));
  const d = dom.window.document;

  // A FALSE PASS, FIXED. This matched "Chili" anywhere in the document — and
  // "Chili" appears in the static Carl data baked into the page, so it passed
  // even when nothing rendered at all. Check the rendered container instead.
  const content = d.getElementById('content');
  ok('with EVERY flag off, the dish still renders',
    !!content && /Chili/.test(content.textContent),
    content ? content.textContent.slice(0, 80) : 'no #content');
  ok('and the order button still exists', !!d.getElementById('reviewBtn'),
    'THE floor: a flag may remove a nicety, never the ability to order');
  ok('and the optional request box is correctly hidden', !d.getElementById('requestBox'));
}

// ── Owner-facing description ────────────────────────────────────────────────
{
  ok('a tester stage describes the count', /household/.test(describeStage({ stage: 'testers', testers: ['a'] })));
  ok('an empty tester list says so', /No households/.test(describeStage({ stage: 'testers', testers: [] })));
  ok('a percentage describes the share', /40%/.test(describeStage({ stage: 'percent', percent: 40 })));
  ok('a missing entry reads as off', describeStage(null) === 'Off');
}

console.log(f === 0 ? '\nFEATURE FLAGS: ALL PASS' : `\nFEATURE FLAGS: ${f} FAILURES`);
process.exit(f ? 1 : 0);
