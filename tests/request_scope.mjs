// tests/request_scope.mjs — the scope question and the pack choice, tested
// against the BUILT page rather than its source.
//
// WHY THE BUILT PAGE. form.html is generated from src/pages/ plus partials, and
// a partial that fails to be included is invisible in the source and fatal on
// the page. tools/checkPagesBuilt.mjs proves the two AGREE; this proves the
// result actually behaves.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE TWO PROPERTIES
//
// 1. THE CUSTOMER'S NOTE IS NEVER MODIFIED. Scope is metadata sent alongside
//    it. Kevin reads what they typed, in their words. If the scope machinery
//    vanished entirely the order would submit identically minus one field.
//
// 2. A STANDING SCOPE IS A PROPOSAL. Nothing writes a profile. A customer must
//    not be able to permanently narrow their own menu by typing a sentence, and
//    Kevin must not find a preference changed under him.
//
// And for packs: NOTHING IS OFFERED that Kevin has not declared. The map is
// empty, so the published week carries no `packs` and the page renders no
// choice. That is the safe state, not an unfinished one.

import { readFileSync } from 'node:fs';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

const page = readFileSync(new URL('../form.html', import.meta.url), 'utf8');

// ── The partial actually made it into the build ─────────────────────────────
{
  ok('the scope partial is inlined into form.html',
    page.includes('__ltbScopeRowHtml') && page.includes('__ltbLooksLikeRestriction'),
    'an @include that silently failed would leave the page working and the feature absent');
  ok('the scope row is rendered under the notes field',
    /custNotes[\s\S]{0,400}__ltbScopeRowHtml/.test(page),
    'it has to sit where the note was typed, not somewhere else on the form');
  ok('the render path wires it',
    page.includes('__ltbWireScope'),
    'wiring runs after innerHTML, which destroys handlers on every redraw');
  ok('every call site is guarded against the partial being absent',
    (page.match(/typeof __ltbScopeRowHtml === 'function'/g) || []).length >= 1
    && (page.match(/typeof __ltbWireScope === 'function'/g) || []).length >= 1
    && (page.match(/typeof __ltbNoteScope === 'function'/g) || []).length >= 1,
    'a page rendered before the partial loads must still submit an order');
}

// ── Detection: conservative, and biased toward saying nothing ───────────────
{
  // Evaluate the partial's matcher in isolation, exactly as shipped.
  const src = readFileSync(new URL('../src/pages/_partials/requestScope.js', import.meta.url), 'utf8');
  const win = {};
  new Function('window', src)(win);
  const looks = win.__ltbLooksLikeRestriction;

  const SHOULD = [
    'no mushrooms', 'No Mushrooms please', 'without dairy', 'allergic to shellfish',
    'lactose intolerant', 'can\'t eat pork', 'hold the cilantro', 'please leave out the onion',
    'avoid nuts', 'gluten free if possible',
  ];
  ok('it recognises the phrasings people actually use',
    SHOULD.every(t => looks(t)),
    SHOULD.filter(t => !looks(t)).join(' | '));

  const SHOULD_NOT = [
    'leave it on the porch', 'extra napkins please', 'ring the doorbell twice',
    'text me when you are close', 'spicy please', '',
  ];
  ok('and stays quiet for ordinary delivery notes',
    SHOULD_NOT.every(t => !looks(t)),
    'a false positive is survivable but interrogating "extra napkins" is not the point: '
    + SHOULD_NOT.filter(t => looks(t)).join(' | '));

  ok('a miss changes nothing, so it fails toward silence',
    looks('mushrooms are the worst') === false,
    'not matching is the same as today; the order submits with the note as written');
}

// ── The note is never rewritten ─────────────────────────────────────────────
{
  ok('the submit payload sends notes AND noteScope as separate fields',
    /notes:\s*notes,\s*noteScope:/.test(page),
    'scope must ride alongside the note, never replace or annotate it');

  const worker = readFileSync(new URL('../worker.js', import.meta.url), 'utf8');
  ok('the worker stores the note untouched',
    /notes:\s*String\(body\.notes \|\| ''\)\.slice\(0, 1000\)/.test(worker),
    'this line must not have grown any scope-aware processing');
  ok('and whitelists noteScope on /submit',
    worker.includes("body.noteScope === 'standing'"),
    'the endpoint picks fields one by one, so an unlisted field is silently dropped');
  ok('and on /amendments, where a standing request is just as likely',
    (worker.match(/noteScope: \(body\.noteScope === 'order'/g) || []).length === 2);
  ok('an unrecognised scope value is stored as empty, not passed through',
    /\?\s*body\.noteScope\s*:\s*''/.test(worker),
    'only the two real scopes exist; anything else means the question was not answered');
}

// ── A standing scope proposes, it does not configure ────────────────────────
{
  const worker = readFileSync(new URL('../worker.js', import.meta.url), 'utf8');
  // The failure this guards: a future edit that "helpfully" applies the scope.
  const submitBlock = worker.slice(worker.indexOf("url.pathname === '/submit'"),
    worker.indexOf("url.pathname === '/submit'") + 4000);
  ok('the submit route writes no profile when a scope is standing',
    !/noteScope[\s\S]{0,600}PROFILE_PREFIX/.test(submitBlock),
    'a customer must not be able to reconfigure what they are offered by typing a sentence');

  const card = readFileSync(new URL('../src/components/OrderCard.jsx', import.meta.url), 'utf8');
  ok('the order card surfaces a standing request to Kevin',
    card.includes("order.noteScope === 'standing'"),
    'silently filing it would be the same failure in the other direction');
  ok('and says plainly that nothing has been changed',
    /Nothing has been changed on their\s*\n?\s*profile/.test(card));
}

// ── Packs: nothing offered until Kevin declares one ─────────────────────────
{
  ok('the pack chooser exists on the page',
    page.includes('packBtnHtml') && page.includes('How would you like it packed?'));
  ok('it renders only when the published variant carried packs',
    /if \(v\.packs && __ltbPackFlag\(\)\)/.test(page),
    'eligibility AND the flag, so an undeclared dish can never show the option');
  // FLAG RETIRED Aug 2. The option is live, so the switch went rather than
  // sitting in the panel as a permanent maybe.
  //
  // It is still gated where it matters, and more tightly than a flag ever was:
  // a variant only carries `packs` when the derived rule finds a component that
  // must be reheated sealed. Containers are never split — a customer pours what
  // they need out of one — so most dishes have nothing to offer and the chooser
  // never renders for them.
  ok('the pack chooser is no longer flagged',
    /function __ltbPackFlag\(\) \{ return true; \}/.test(page));
  ok('and no page still reads a splitPack flag',
    !page.includes('splitPack'),
    'a page reading a flag the app no longer declares would silently read undefined');
  ok('but it still only renders when the published variant carried packs',
    /if \(v\.packs && __ltbPackFlag\(\)\)/.test(page),
    'eligibility is the real gate: an undeclared dish must never show the option');
  ok('footprint text travels with the option rather than being computed on the page',
    page.includes('esc(footprint)'),
    'the words a customer reads must come from the container map the kitchen packs from');
  ok('an item only carries packShape when the customer chose the non-default',
    /packSelections\[vk2\] === 'twoNight'/.test(page),
    'no packShape means Family, which is every order ever placed');
}

// ── The pack path actually lights up when a dish IS declared ────────────────
//
// Everything above proves the empty state is safe. This proves the feature is
// wired rather than merely absent — an empty map makes every "nothing is
// offered" assertion pass whether the plumbing works or not.
//
// Declares one dish into the canon inside try/finally, exactly as Kevin will
// after the two-night walk, and checks the PUBLISHED payload, because
// form.html is standalone ES5 and can only see what publishing sends it.
{
  const { SPLIT_PACKAGING } = await import('../src/splitPackaging.js');
  const { publishWeek } = await import('../src/publishWeek.js');

  let captured = null;
  const realFetch = globalThis.fetch;
  const realLS = globalThis.localStorage;
  globalThis.fetch = async (u, o) => {
    if (String(u).includes('/config')) captured = JSON.parse(o.body);
    return { ok: true, json: async () => ({ ok: true, dropped: [] }) };
  };
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  // SMALL. Large was removed from the feature on Aug 2 — it already ships as
  // two of everything, so it is split by construction.
  Object.assign(SPLIT_PACKAGING, {
    chili: { byVariant: [{ match: /small/i, family: { round48: 1 }, twoNight: { round32: 2 }, surchargeCents: 300 }] },
  });
  try {
    try {
      await publishWeek(['Chili'], '', 'W', null, { requestCounts: {}, favorites: [] },
        { recordAudit: () => {}, setNotice: () => {}, setWeekLedger: () => {} });
    } catch (e) { /* the publish path does more than we need; the payload is captured either way */ }

    const dish = ((captured && captured.dishes) || []).find(d => d.name === 'Chili');
    const small = dish && dish.variants.find(v => /small/i.test(v.label));
    const large = dish && dish.variants.find(v => /large/i.test(v.label));

    ok('a declared SMALL publishes its pack options',
      !!(small && small.packs),
      'without this the page has nothing to render no matter how correct the UI is');
    ok('the Large publishes none, because Large is out of the feature',
      !!(large && !large.packs),
      'a Large already ships as two of everything; doubling again would make quarters');
    ok('the footprint reads as containers a person can picture',
      small.packs.twoNight.footprint === '2 \u00d7 32 oz round'
      && small.packs.family.footprint === '48 oz round',
      JSON.stringify(small.packs));
    ok('the surcharge travels in cents, on the split only',
      small.packs.twoNight.surchargeCents === 300 && !('surchargeCents' in small.packs.family));
  } finally {
    delete SPLIT_PACKAGING.chili;
    globalThis.fetch = realFetch;
    globalThis.localStorage = realLS;
  }
  // The map is no longer empty at rest — Steak au Poivre is a declared
  // exception at Kevin's ruling — so this checks the FIXTURE is gone rather
  // than that nothing is declared.
  ok('the fixture is cleaned up',
    !('chili' in SPLIT_PACKAGING),
    'a test that leaves its own fixture behind would turn the feature on for real');
}

console.log(failed === 0 ? '\nREQUEST SCOPE + PACKS: ALL PASS' : `\nREQUEST SCOPE + PACKS: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
