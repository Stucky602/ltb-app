// checkPageSync.mjs — fails the build when the same logic diverges between the
// customer pages.
//
// KEPT AFTER THE BUILD STEP LANDED (Jul 2026), on purpose. Read this before
// deleting it.
//
// The original reason for this file is gone. All five pages are now generated
// by tools/buildPages.mjs from shared partials in src/pages/_partials/, so
// `esc`, `noticeHtml`, and `ordersOpen` CANNOT diverge: there is one copy of
// each and the build stamps it into every page. checkPagesBuilt.mjs proves the
// committed pages match that build.
//
// What this now guards is the way BACK. If someone hand-writes a page again,
// drops a page out of the buildPages manifest, or pastes a second copy of one
// of these blocks into a page shell, this fires and checkPagesBuilt does not,
// because from the build's point of view a page with an extra hand-written
// `esc` in it is a perfectly valid source file.
//
// It costs milliseconds and it is the only thing watching that direction.
//
// ── The history it exists because of ────────────────────────────────────────
// Five hand-written ES5 pages shared logic by copy-paste. That cost real money
// twice: the heads-up banner had to be added to three pages separately, the
// order-window gate to three, and BOTH duplications shipped bugs. The failure
// mode was specific and nasty. You fix `noticeHtml` in menu.html because that
// is the page you were looking at, form.html keeps the old version, and
// nothing anywhere reports that two pages now disagree about how to render the
// same thing. It looks fine on the page you tested.
//
// WHAT IT CHECKS, and why it checks it this way
// For each shared block, every page that HAS it must AGREE with the others. A
// page that does not carry it at all is fine — not every page needs a notice.
//
// For JavaScript it compares BEHAVIOUR, not source text. The first version of
// this compared normalised source and immediately reported all five `esc`
// functions as diverged. They were not: all five escaped the same five
// characters to the same entities, and differed only in quote style,
// whitespace, and the parameter name. A check that fires on formatting is a
// check you turn off, and then it is not protecting anything. So the JS blocks
// are evaluated and probed with inputs designed to expose a real difference.
//
// For CSS it compares normalised text, because there is nothing to run.

import { readFileSync, existsSync } from 'node:fs';

const PAGES = ['form.html', 'menu.html', 'main-menu.html', 'order.html', 'pipeline.html'];

// name → extractor. Each returns the block's source, or null if the page does
// not carry it. Deliberately crude string slicing: these are hand-written pages
// and a parser would be a dependency for a job that does not need one.
// Balanced-brace slice from a starting index. The first version of this used
// "find the next newline", which silently truncated every multi-line function
// and left three of the five `esc` copies unevaluable — so they fell back to
// text comparison and reported as diverged when they were identical. A check
// that reports false positives is a check that gets switched off.
function braceBlock(src, from) {
  const open = src.indexOf('{', from);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(from, i + 1); }
  }
  return null;
}

const BLOCKS = {
  // The heads-up banner renderer. Shipped a bug by drifting once already.
  noticeHtml: (src) => {
    const i = src.indexOf('function noticeHtml');
    return i === -1 ? null : braceBlock(src, i);
  },
  // The banner's styling. Two pages rendering the same notice in different
  // colours is a smaller problem than different logic, and still a problem.
  weekNoticeCss: (src) => {
    const i = src.indexOf('.week-notice {');
    if (i === -1) return null;
    const end = src.indexOf('}', i);
    return end === -1 ? null : src.slice(i, end + 1);
  },
  // HTML escaping. An escaping function that differs between pages is a
  // security-shaped problem rather than a cosmetic one: one page escaping less
  // than another IS the bug.
  esc: (src) => {
    const i = src.indexOf('function esc');
    return i === -1 ? null : braceBlock(src, i);
  },
  // The order-window gate. Added to this list Jul 2026, when the page build
  // step unified the last of FOUR copies in THREE shapes: `ordersOpen()` on
  // form/menu/main-menu, an inline `day === 0 || day >= 3` on order.html, and
  // a second inline `day >= 1 && day <= 2` buried in menu.html's render, in
  // the same function that already called ordersOpen() two lines below. Only
  // form.html carried the `?preview=1` bypass, so previewing on a Monday
  // showed the form open and the weekly menu closed.
  //
  // No behaviour probe for this one, deliberately: it reads
  // window.location.search and new Date(), neither of which exists inside the
  // isolated eval, so it falls back to normalised-text comparison. That is
  // sufficient now that all four pages include the same partial.
  ordersOpen: (src) => {
    const i = src.indexOf('function ordersOpen');
    return i === -1 ? null : braceBlock(src, i);
  },
};

// DELIBERATE differences, each with a reason. Not a way to silence the check:
// an entry here is a claim that two pages SHOULD differ, and it has to say why.
// Without this the only options are a permanently red gate or quietly rewriting
// Kevin's CSS to make a tool happy, and both are worse than writing it down.
const EXEMPT = {
  weekNoticeCss: {
    'order.html': 'order.html is the centred landing page, so its notice carries text-align:left and width:100% and slightly tighter spacing (18px margin, 13.5px) to sit correctly in that layout. A deliberate layout adjustment, not drift.',
  },
};

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

// Probes chosen to catch a real difference rather than a cosmetic one: every
// character these functions are supposed to escape, plus the null and empty
// cases that a rewrite tends to get wrong.
const PROBES = {
  esc: ['<script>&"\'</script>', '', null, 0, 'plain text', '&amp; already escaped'],
  noticeHtml: [
    null, {}, { notice: '' }, { notice: '   ' },
    { notice: 'Kitchen closed Thursday' },
    { notice: '<b>bold</b> & "quoted"' },
  ],
};

// Runs a block in isolation and returns its outputs across the probes, so two
// differently-written functions that behave the same compare equal.
function behaviourOf(name, src) {
  const probes = PROBES[name];
  if (!probes) return null;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`${src}; return typeof ${name} === 'function' ? ${name} : null;`)();
    if (typeof fn !== 'function') return null;
    return JSON.stringify(probes.map(p => {
      try { return fn(p); } catch (e) { return 'THREW:' + (e && e.name); }
    }));
  } catch (e) {
    return null; // not evaluable in isolation; fall back to text
  }
}

let failures = 0;
const exempted = [];

for (const [name, extract] of Object.entries(BLOCKS)) {
  const found = new Map(); // key → [pages]
  for (const page of PAGES) {
    if (!existsSync(page)) continue;
    const block = extract(readFileSync(page, 'utf8'));
    if (!block) continue;
    if (EXEMPT[name] && EXEMPT[name][page]) { exempted.push(`${name} on ${page}`); continue; }
    const key = behaviourOf(name, block) || norm(block);
    found.set(key, [...(found.get(key) || []), page]);
  }
  if (found.size === 0) continue;
  if (found.size === 1) {
    const [[, pages]] = [...found.entries()];
    console.log(`  ✓ ${name} agrees across ${pages.length} page${pages.length === 1 ? '' : 's'} (${pages.join(', ')})`);
    continue;
  }
  failures++;
  console.log(`  ✗ ${name} DIVERGED across pages — ${found.size} different behaviours:`);
  let n = 0;
  for (const [key, pages] of found) {
    n++;
    console.log(`      version ${n}: ${pages.join(', ')}`);
    console.log(`        ${key.slice(0, 120)}${key.length > 120 ? '…' : ''}`);
  }
  console.log('    These pages share this logic by copy-paste. One copy was changed and the');
  console.log('    others were not, which is exactly how the heads-up banner and the');
  console.log('    order-window gate each shipped a bug. Make them identical, or if the');
  console.log('    difference is deliberate, rename one so it stops claiming to be the same thing.');
}

for (const e of exempted) console.log(`  · ${e} is exempt, with a stated reason`);
console.log(failures === 0 ? '\nPAGE SYNC: ALL PASS' : `\nPAGE SYNC: ${failures} FAILURES`);
process.exit(failures ? 1 : 0);
