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
import { PIPELINE_DISHES } from '../src/pipelineDishes.js';
import { DISHES, ALL_ALWAYS_ITEMS } from '../src/dishes.js';
import { resolveDishVariant } from '../src/dishCosting.js';
import { carlCardSummary } from '../src/carl.js';
import {
  DINNER_BAGGED, MENU_ADDONS, MENU_BAG, MENU_SAUCES, MENU_STATIC, LIBRARY_COMMENT,
  OFF_MENU_DISHES, DINNER_ORDER,
} from '../src/menuLibrary.js';

const ROOT = new URL('../', import.meta.url);
const at = (p) => new URL(p, ROOT);

// ── The manifest ────────────────────────────────────────────────────────────
// Pages are migrated ONE AT A TIME, and only pages listed here are built or
// checked. A hand-written page that is not in this list is left completely
// alone, which is what makes a half-finished migration a shippable state
// rather than a broken one. Add a page here in the same commit that adds its
// src/pages/<name>.page.html, never before.
export const PAGES = ['order.html', 'pipeline.html', 'menu.html', 'main-menu.html', 'form.html'];

// Serialises exactly as the hand-written LIBRARY blob was written: one line,
// a space after every colon and comma. JSON.stringify with no spacing omits
// those spaces and JSON.stringify with an indent adds newlines, so neither
// reproduces the file. Matching it byte for byte is what lets the migration be
// verified rather than eyeballed.
function looseJson(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return `[${v.map(looseJson).join(', ')}]`;
  if (typeof v === 'object') {
    return `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${looseJson(x)}`).join(', ')}}`;
  }
  return JSON.stringify(v);
}

// The base64 logo reader lived here and is gone: the three icon generators
// below now emit a URL, so nothing reads src/pages/_partials/ltb-logo.b64 any
// more. That file is now an orphan and is listed in tools/checkRepoStructure.mjs
// for Kevin to delete by hand, since a zip cannot ship a deletion.

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

  // ── Pipeline voting cards ─────────────────────────────────────────────────
  // pipelineDishes.js is already the FROZEN CONTRACT for every vote key:
  // tools/syncPipeline.mjs fails the gate if worker.js or this page disagrees
  // with it. So the page was already downstream of canon in every way except
  // that a human retyped it. Now it is not.
  //
  // Nothing here is escaped, deliberately. The copy in canon carries HTML
  // entities (&middot;, &Eacute;) that were authored as entities, and running
  // them through esc() would render "&amp;middot;" on the page. That is the
  // one place a generator must NOT escape, and it is worth stating out loud.
  pipelineCards: () => {
    const testing = PIPELINE_DISHES.filter((d) => !d.status || d.status === 'testing');
    return testing.map((d) => {
      const lines = [
        `<div class="dish" data-dish="${d.key}"${d.diet ? ` data-diet="${d.diet}"` : ''}>`,
        `  <div class="dish-name">${d.title}</div>`,
        `  <div class="dish-origin">${d.origin}</div>`,
        `  <div class="dish-desc">${d.desc}</div>`,
      ];
      // Note above allergens: the order all four cards carrying both used.
      if (d.note) lines.push(`  <div class="dish-note">${d.note}</div>`);
      if (d.contains) lines.push(`  <div class="contains">${d.contains}</div>`);
      lines.push('</div>');
      return lines.join('\n');
    }).join('\n\n');
  },

  // The "All 30" filter label. A hand-typed count next to a generated list is
  // a promise to update two things whenever you update one.
  pipelineCount: () => {
    const n = PIPELINE_DISHES.filter((d) => !d.status || d.status === 'testing').length;
    return `<button class="filter-btn on" data-filter="all">All ${n}</button>`;
  },

  // ── The icon set ──────────────────────────────────────────────────────────
  //
  // NOW REFERENCED BY URL, NOT INLINED (Kevin, Aug 1). These three markers used
  // to emit `data:image/png;base64,…` and the same 88 KB payload landed THREE
  // times in form.html and three times in main-menu.html.
  //
  // WHY THAT WAS WORSE THAN IT LOOKED. Gzip's window is 32 KB and the copies sat
  // roughly 100 KB apart, so it could not deduplicate them at all: the two pages
  // compressed to about 229 KB each where the same pages without the logo
  // compress to 29 KB. main-menu.html is the kitchen page — the one somebody
  // loads standing over a container, sometimes on bad signal — so 200 KB of
  // avoidable transfer sat directly on the path that matters most.
  //
  // THE 404 ARGUMENT NO LONGER APPLIES, and it is worth writing down why rather
  // than leaving the old reasoning to look sound. The previous note kept these
  // inline so a home-screen icon could never 404. But /ltb-logo.png is already
  // at the repo root, is not in .assetsignore, and is ALREADY relied on by
  // order.html, menu.html, pipeline.html, and by sw.js for push notification
  // icons. The risk was already being taken everywhere else; these two pages
  // were the inconsistency, not the safe case.
  //
  // The service worker caches it on first fetch like any other asset, so the
  // offline story is unchanged after one visit.
  iconAppleTouch: () => '<link rel="apple-touch-icon" href="/ltb-logo.png">',
  iconLink: () => '<link rel="icon" href="/ltb-logo.png">',
  logoImg: () => '<img class="logo" src="/ltb-logo.png" alt="LTB">',

  // ── menu.html's LIBRARY ───────────────────────────────────────────────────
  // The 26 DINNER entries are built from dishes.js. They always had to match it
  // verbatim — tests/library_sync.mjs enforced that field by field, because the
  // Brunswick incident in Jul 2026 was three surfaces carrying three different
  // texts while every presence check stayed green. A rule saying "these two
  // must be identical" is a build step that has not been written yet.
  //
  // Everything else (add-ons, bag items, sauces, the standing prose, and the
  // `bagged` flag) has no registry equivalent and lives in src/menuLibrary.js.
  //
  // library_sync.mjs's header says a serializer for this blob is a bigger
  // hazard than a red test. That was true when the blob was hand-owned and
  // nothing could prove a rewrite was faithful. checkPagesBuilt.mjs proves
  // exactly that, so the reasoning no longer applies and the tool is safe.
  // ── Carl state for the weekly menu ────────────────────────────────────────
  // main-menu.html is static HTML, so tools/syncMainMenu.mjs stamps its cards
  // directly. menu.html builds every card at runtime in renderDish(), so there
  // is nothing to stamp and the data has to arrive as a blob instead.
  //
  // Both come from carlCardSummary() in src/carl.js, deliberately: the collapse
  // from per-variant verdicts to one card's worth of state is the thing most
  // likely to drift if it existed twice, and if it drifted the two menus would
  // disagree about the same dish while both looking correct.
  //
  // Keyed by exact dish name, which is the key renderDish already has in hand.
  // Every dinner the registry knows, names only. The request box needs the FULL
  // library rather than this week's published roster, because the whole point is
  // asking for something that ISN'T on this week — and form.html only ever sees
  // the published config.
  dinnerNames: () => {
    const names = DISHES.map(d => d.name).sort();
    return `var ALL_DINNER_NAMES = ${looseJson(names)};`;
  },

  carlData: () => {
    const out = {};
    for (const item of [...DISHES, ...ALL_ALWAYS_ITEMS]) {
      const c = carlCardSummary(item, resolveDishVariant);
      out[item.name] = { v: c.verdict, say: c.say, dead: c.dead };
    }
    return `var CARL = ${looseJson(out)};`;
  },

  menuLibrary: () => {
    const off = new Set(OFF_MENU_DISHES);
    const eligible = DISHES.filter((d) => !off.has(d.name) && d.copy && d.copy.desc);

    // DINNER_ORDER first, then anything it does not mention. A new dish must
    // never fall out of the menu because someone forgot to list it.
    const rank = new Map(DINNER_ORDER.map((n, i) => [n, i]));
    eligible.sort((a, b) => {
      const ra = rank.has(a.name) ? rank.get(a.name) : Number.MAX_SAFE_INTEGER;
      const rb = rank.has(b.name) ? rank.get(b.name) : Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });

    const dinners = {};
    for (const d of eligible) {
      const c = d.copy;
      const e = { desc: c.desc, reheat: c.reheat, contains: c.contains };
      if (c.note !== undefined) e.note = c.note;
      if (c.spice !== undefined) e.spice = c.spice;
      if (d.cuisine === 'Spotlight' || d.spotlight) e.spotlight = true;
      e.bagged = !!DINNER_BAGGED[d.name];
      e.pairings = c.pairings;
      dinners[d.name] = e;
    }
    const library = {
      _comment: LIBRARY_COMMENT,
      dinners,
      addons: MENU_ADDONS,
      static: MENU_STATIC,
      bag: MENU_BAG,
      sauces: MENU_SAUCES,
    };
    return `var LIBRARY = ${looseJson(library)};`;
  },
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
  return stampBanner(out, name);
}

// Added once ALL FIVE pages were generated, not before. The banner is the only
// warning a person gets when they open a 365 KB file at the repo root and start
// typing. checkPagesBuilt.mjs catches the edit either way, but it catches it
// after the work is done; this catches it before.
//
// It goes AFTER the doctype, never before: a comment ahead of <!DOCTYPE> puts
// old browsers into quirks mode, and these pages are read on whatever phone
// somebody has.
function stampBanner(html, name) {
  const source = `src/pages/${name.replace(/\.html$/, '')}.page.html`;
  const banner = `\n<!-- GENERATED FILE — DO NOT EDIT.\n     Built from ${source} by tools/buildPages.mjs.\n     Edit the source, then run: node tools/buildPages.mjs --write\n     tools/checkPagesBuilt.mjs fails the build if this file is hand-edited. -->`;
  const i = html.indexOf('>', html.indexOf('<!DOCTYPE'));
  if (i < 0) throw new Error(`${name}: no doctype to place the generated banner after`);
  return html.slice(0, i + 1) + banner + html.slice(i + 1);
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
