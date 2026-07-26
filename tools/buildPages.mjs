// buildPages.mjs — generates the customer HTML pages at the repo root from
// sources in src/pages/.
//
//   node tools/buildPages.mjs           dry run: list pages that would change
//   node tools/buildPages.mjs --write   write the root HTML files
//
// The gate check lives in tools/checkPagesBuilt.mjs, which imports buildAll()
// from here and fails if a committed page disagrees with its source. One tool
// writes, one tool judges; nothing fails the build from two places at once.
//
// WHY THIS EXISTS
// Five hand-written ES5 pages shared logic by copy-paste. The heads-up banner
// had to be added to three pages separately and one copy was missed. The
// order-window gate had to be added to three pages separately and the same
// thing happened. Neither threw, neither looked wrong on the page being
// tested, and both were found by a customer. tools/checkPageSync.mjs stops the
// copies DRIFTING; this stops there being copies.
//
// WHY IT IS THIS SMALL
// No templating engine, no bundler, no framework. The moment a template needs
// an {{#if}} the pages have acquired a second programming language, and the
// person maintaining this in three years is Kevin. Two markers, no
// expressions, no conditionals, no loops. Logic belongs in a partial or in a
// generator, never in a page shell.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { WORKER_BASE } from '../src/config.js';

const ROOT = new URL('../', import.meta.url);
const at = (p) => new URL(p, ROOT);

// ── The manifest ────────────────────────────────────────────────────────────
// Pages are migrated ONE AT A TIME, and only pages listed here are built or
// checked. A hand-written page that is not in this list is left completely
// alone, which is what makes a half-finished migration a shippable state
// rather than a broken one. Add a page here in the same commit that adds its
// src/pages/<name>.page.html, never before.
export const PAGES = ['order.html'];

// ── Generators ──────────────────────────────────────────────────────────────
// A generator renders content that ALREADY HAS A SOURCE OF TRUTH elsewhere in
// the repo. That is the whole point of the marker: if a value can be derived,
// authoring it into a page is how it drifts. Each returns text with no leading
// indentation; the build indents it to match the marker it replaces.
const GENERATORS = {
  // The worker origin is declared once in src/config.js and was then typed by
  // hand into all five customer pages. Nothing compared them, so a worker
  // rename would have left the pages fetching a dead host with no error a
  // customer could see: the banner would just silently never appear.
  workerBase: () => `var WORKER = ${JSON.stringify(WORKER_BASE)};`,
};

// ── The include mechanism ───────────────────────────────────────────────────
// A marker must sit alone on its line. Its own indentation is applied to every
// line of the content that replaces it, so a partial is stored unindented and
// drops into any nesting depth unchanged.
//
// DELIBERATE DEVIATION FROM THE BRIEF, worth knowing about: @generate takes a
// single marker with no @endgenerate. The paired form exists in
// tools/syncMainMenu.mjs because that tool rewrites a region of a COMMITTED
// page in place and has to find the region again on the next run. A build has
// no such problem — the page source and the output are different files, and
// the output is discarded and regenerated every time — so the closing marker
// would be a second thing to keep correct for no benefit.
const MARKER = /^([ \t]*)<!--[ \t]*@(include|generate)[ \t]+(\S+)[ \t]*-->[ \t]*$/gm;
const ANY_MARKER = /@(?:include|generate)\b/g;

function indentTo(text, indent) {
  if (!indent) return text;
  // Blank lines stay blank. Indenting them would emit trailing whitespace,
  // which is invisible in a diff and infuriating in a byte comparison.
  return text.split('\n').map((line) => (line === '' ? line : indent + line)).join('\n');
}

function readPartial(spec, pageName) {
  const url = at(`src/pages/${spec}`);
  if (!existsSync(url)) {
    throw new Error(`${pageName}: @include ${spec} — no such file at src/pages/${spec}`);
  }
  const raw = readFileSync(url, 'utf8');
  if (raw.match(ANY_MARKER)) {
    throw new Error(
      `${pageName}: partial ${spec} contains a marker of its own. Partials are not `
      + 'expanded recursively, deliberately: nesting is how a two-rule template '
      + 'language becomes a five-rule one. Inline it or make it a generator.',
    );
  }
  // A trailing newline in the file is the editor's, not the content's.
  return raw.replace(/\n$/, '');
}

export function buildPage(name) {
  const srcUrl = at(`src/pages/${name.replace(/\.html$/, '')}.page.html`);
  if (!existsSync(srcUrl)) throw new Error(`no page source for ${name}`);
  const src = readFileSync(srcUrl, 'utf8');

  let expanded = 0;
  const out = src.replace(MARKER, (_line, indent, kind, spec) => {
    expanded++;
    if (kind === 'include') return indentTo(readPartial(spec, name), indent);
    const gen = GENERATORS[spec];
    if (!gen) {
      throw new Error(
        `${name}: @generate ${spec} — no generator by that name. `
        + `Known generators: ${Object.keys(GENERATORS).join(', ') || '(none)'}`,
      );
    }
    return indentTo(String(gen()), indent);
  });

  // A marker that is not alone on its line matches nothing and would be copied
  // into the output verbatim, so the page would look built and quietly not be.
  // Count them instead of trusting the shape.
  const present = (src.match(ANY_MARKER) || []).length;
  if (present !== expanded) {
    throw new Error(
      `${name}: ${present} marker(s) in the source but only ${expanded} expanded. `
      + 'A marker must sit alone on its own line, as <!-- @include path --> or '
      + '<!-- @generate name -->.',
    );
  }
  return out;
}

export function buildAll() {
  const out = new Map();
  for (const name of PAGES) out.set(name, buildPage(name));
  return out;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const write = process.argv.includes('--write');
  const built = buildAll();
  let changed = 0;

  for (const [name, content] of built) {
    const url = at(name);
    const current = existsSync(url) ? readFileSync(url, 'utf8') : null;
    if (current === content) continue;
    changed++;
    if (write) {
      writeFileSync(url, content);
      console.log(`  wrote ${name} (${content.length} bytes)`);
    } else {
      console.log(`  ${name} differs from its source (${current === null ? 'missing' : `${current.length} → ${content.length} bytes`})`);
    }
  }

  if (!changed) console.log(`  ${built.size} page(s) already up to date with src/pages/`);
  else if (!write) console.log('  run with --write to regenerate');
}
