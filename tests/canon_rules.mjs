// tests/canon_rules.mjs — the rules Kevin confirmed, and the copy checks.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THERE ARE ONLY TWO RULES
//
// A rule qualifies only if Kevin SAID it, it is checkable from recorded data,
// and violating it is a real defect. Two statements currently clear all three
// bars. That is a finding, not a placeholder: a rules file that fills up with
// things nobody agreed to becomes a generic rules engine, which the systems
// master explicitly rejects and which would start failing builds over opinions.
//
// The test below asserts the SHAPE of eligibility — every rule cites a source —
// rather than a count, so adding a genuinely confirmed rule does not trip it.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE COPY CHECKS RATCHET, THEY DO NOT GATE
//
// Cloudflare runs `npm test` on deploy. A new check that instantly goes red
// takes the customer site down over copy that predates it, and the four
// findings below are questions for Kevin about food, not bugs anyone can fix by
// editing code. So the baseline is recorded and the assertion is that it does
// not GROW — the same ratchet tests/reheat_copy_lint.mjs already uses, for the
// same reason.

import {
  CANON_RULES, UNDIVIDABLE_MODES, canonRuleCount, runCanonChecks,
  checkBagIsVessel, checkTwoNightIndependence, checkFreezeClaims,
  checkPartialHeatHasDivision, checkProjectionsApproved,
} from '../src/canonRules.js';
import { SPLIT_PACKAGING } from '../src/splitPackaging.js';
import { REHEAT_DATA } from '../src/reheatData.js';
import {
  emptyDerivatives, draftDerivative, approveDerivative, derivativeFor,
} from '../src/derivatives.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// ── Eligibility ─────────────────────────────────────────────────────────────
{
  ok('every canon rule cites where Kevin said it',
    CANON_RULES.every(r => r.source && r.statement && r.why),
    'a rule with no source is an opinion that can fail a build');
  ok('rule ids are unique',
    new Set(CANON_RULES.map(r => r.id)).size === CANON_RULES.length);
  ok('there is at least one rule and the count is small',
    canonRuleCount() >= 1 && canonRuleCount() <= 10,
    'this file filling up is the signal it has become a generic rules engine');
}

// ── Rule 1: bag is the vessel ───────────────────────────────────────────────
{
  ok('nothing violates it today, because nothing is declared splittable',
    checkBagIsVessel(SPLIT_PACKAGING).length === 0);

  // The rule has to actually fire, or it is decoration. Bo Ssam's pork is
  // recorded as not-recommended for dividing.
  const offending = Object.keys(REHEAT_DATA).find(id =>
    (REHEAT_DATA[id].components || []).some(c => c.divide && UNDIVIDABLE_MODES.includes(c.divide.mode)));
  const v = checkBagIsVessel({ [offending]: { byVariant: [] } });
  ok('but declaring a dish with an undividable component DOES violate it',
    v.length > 0,
    `expected a violation for ${offending}`);
  ok('and the violation carries the rule and its source, not just "failed"',
    v[0].statement.length > 0 && v[0].source.length > 0,
    '"validation failed" teaches nobody anything and gets worked around');
  ok('and names the component responsible', /Component "/.test(v[0].detail));
}

// ── Rule 2: a two-night pack must reheat independently ──────────────────────
{
  ok('nothing violates it today', checkTwoNightIndependence(SPLIT_PACKAGING).length === 0);

  const single = { d: { byVariant: [{ match: /large/i, family: { round48: 1 }, twoNight: { round48: 1 } }] } };
  ok('a "split" shipping ONE container is a violation',
    checkTwoNightIndependence(single).length === 1,
    'one vessel cannot be heated half at a time, so that is not a split');

  const missing = { d: { byVariant: [{ match: /large/i, family: { round48: 1 } }] } };
  ok('a pack option missing a shape is a violation',
    checkTwoNightIndependence(missing).length === 1);

  const good = { d: { byVariant: [{ match: /large/i, family: { round48: 1 }, twoNight: { round32: 2 } }] } };
  ok('a real split passes', checkTwoNightIndependence(good).length === 0);
}

// ── The single-copy rule ────────────────────────────────────────────────────
{
  const src = await import('node:fs').then(fs =>
    fs.readFileSync(new URL('../src/splitPackaging.js', import.meta.url), 'utf8'));
  ok('splitPackaging IMPORTS the undividable modes rather than redeclaring them',
    src.includes("UNDIVIDABLE_MODES") && !/const BAD_DIVIDE = new Set\(\[/.test(src),
    'the rule and its enforcement as two literals is exactly how they drift apart');

  const canonSrc = await import('node:fs').then(fs =>
    fs.readFileSync(new URL('../src/canonRules.js', import.meta.url), 'utf8'));
  ok('and canonRules does NOT import splitPackaging back',
    !/from '\.\/splitPackaging\.js'/.test(canonSrc),
    'it created a module-level TDZ that threw at load, and rules should not know their subjects anyway');
}

// ── Copy checks: RATCHET, recorded baseline ─────────────────────────────────
{
  // Four components are recorded as pour-and-keep with no note: a customer is
  // told they can heat part of it and not how much, whether it reseals, or what
  // happens to the rest. These are questions for Kevin about food, not bugs.
  // Written down so the number cannot grow unnoticed.
  const PARTIAL_HEAT_BASELINE = 4;
  const found = checkPartialHeatHasDivision();
  ok(`no NEW partial-heat gap (baseline ${PARTIAL_HEAT_BASELINE})`,
    found.length <= PARTIAL_HEAT_BASELINE,
    found.map(f => f.subject).join(', '));
  ok('the baseline has not gone stale either',
    found.length >= PARTIAL_HEAT_BASELINE - 1,
    `only ${found.length} found; if Kevin answered some, lower the baseline`);
  ok('each finding names the dish, the component, and the mode',
    found.every(f => f.subject.includes('/') && /"pour-and-keep"/.test(f.detail)));

  ok('every recorded freeze verdict either is tested or explains itself',
    checkFreezeClaims().length === 0,
    'an untested verdict with no note is a judgement nobody can weigh');
}

// ── Projections need approval ───────────────────────────────────────────────
{
  const SRC = 'anatomy:milk:bolognese@v5';
  let store = draftDerivative(emptyDerivatives(), {
    sourceRecordId: SRC, audience: 'customer', text: 'It supports the texture.',
  });
  const reqs = [{ sourceRecordId: SRC, audience: 'customer' }];

  ok('asking to show an UNAPPROVED record is a violation',
    checkProjectionsApproved(reqs, store, derivativeFor).length === 1,
    'a drafted sentence is not an approved one');

  const id = store.derivatives[0].id;
  store = approveDerivative(store, id);
  ok('and approving it clears the violation',
    checkProjectionsApproved(reqs, store, derivativeFor).length === 0);

  ok('asking for a DIFFERENT audience is still a violation',
    checkProjectionsApproved([{ sourceRecordId: SRC, audience: 'rowanYounger' }], store, derivativeFor).length === 1,
    'approval is per audience; there is no fallback and the check must not invent one');
}

// ── The gate-facing entry point ─────────────────────────────────────────────
{
  ok('runCanonChecks is clean against the real data',
    runCanonChecks({ splitMap: SPLIT_PACKAGING }).length === 0);
  ok('and it defaults to an EMPTY map rather than importing one',
    runCanonChecks().length === 0,
    'the caller supplies the subject; the rules module does not reach for it');
}

// ── The logo is referenced, never inlined ───────────────────────────────────
//
// Aug 1: the 88 KB base64 logo used to be inlined three times into form.html
// and three times into main-menu.html — about 270 KB of a 365 KB page. Gzip
// could not dedupe it (32 KB window, copies ~100 KB apart), so those two pages
// crossed the wire at 229 KB where they now cross at 29 KB.
//
// This guards the regression rather than the fix: the easy way to undo it is
// for someone to "helpfully" inline an icon again so it cannot 404, which is
// the exact reasoning the old code carried.
{
  const fs = await import('node:fs');
  const PAGES = ['form.html', 'main-menu.html', 'order.html', 'menu.html', 'pipeline.html'];
  const present = PAGES.filter(f => fs.existsSync(new URL('../' + f, import.meta.url)));

  ok('every customer page was built', present.length === PAGES.length, present.join(', '));

  for (const f of present) {
    const src = fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
    ok(`${f} inlines no base64 image`,
      !/base64,iVBORw/.test(src),
      'one inlined PNG is 88 KB that gzip cannot compress away');
    ok(`${f} references the logo by URL instead`,
      src.includes('/ltb-logo.png'),
      'a page with neither an inline logo nor a reference has silently lost its icon');
  }

  ok('the asset the pages point at actually exists at the repo root',
    fs.existsSync(new URL('../ltb-logo.png', import.meta.url)),
    'five pages and sw.js all depend on this URL resolving');

  const ignore = fs.readFileSync(new URL('../.assetsignore', import.meta.url), 'utf8');
  ok('and it is not excluded from the served assets',
    !/^ltb-logo\.png$/m.test(ignore),
    'excluding it would 404 every icon and every logo on every page at once');

  const png = fs.readFileSync(new URL('../ltb-logo.png', import.meta.url));
  ok('and it is a real PNG rather than a placeholder',
    png[0] === 0x89 && png.toString('latin1', 1, 4) === 'PNG' && png.length > 1000,
    `${png.length} bytes`);
}

console.log(failed === 0 ? '\nCANON RULES: ALL PASS' : `\nCANON RULES: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
