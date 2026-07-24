// tests/preserveScroll.mjs — P3: the list must not lose Kevin's place when
// an action re-renders it.
//
// Three things worth pinning, all of which are easy to get wrong:
//   1. It only restores when ARMED. An ordinary re-render (typing in the
//      search box, a background poll landing) must never move the page.
//   2. It CLAMPS. If the action shortened the list, the old offset can
//      exceed the new maximum scroll, and an unclamped restore would look
//      like the jump it was meant to prevent.
//   3. It restores at the right TIME. useLayoutEffect fires before paint;
//      useEffect would let the browser paint the wrong position first and
//      show a flicker. jsdom cannot observe paint, so this is verified by
//      asserting the hook uses useLayoutEffect at the source level.
//
// Run: node tests/preserveScroll.mjs

import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import path from 'node:path';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

// ── 3. The timing guarantee, checked at the source ──────────────────────────
const source = readFileSync(new URL('../src/usePreserveScroll.js', import.meta.url), 'utf8');
ok(/useLayoutEffect/.test(source),
  'restores in useLayoutEffect (before paint) — useEffect would flicker the wrong position first');
ok(!/useEffect\(/.test(source.replace(/useLayoutEffect/g, '')),
  'does not use plain useEffect for the restore, which would be too late');

const dir = path.join(process.cwd(), '.scroll-check');
mkdirSync(dir, { recursive: true });
const src = path.join(dir, 'harness.jsx');
const out = path.join(dir, 'harness.cjs');
writeFileSync(src, `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { usePreserveScroll } from '../src/usePreserveScroll.js';

function Harness({ items, armed }) {
  const capture = usePreserveScroll(items.length);
  window.__capture = capture;
  return React.createElement('div', null, items.map(i => React.createElement('div', { key: i, style: { height: 100 } }, 'row ' + i)));
}
window.__mount = (items, armed) => {
  if (!window.__root) window.__root = createRoot(document.getElementById('app'));
  window.__root.render(React.createElement(Harness, { items, armed }));
};
`);
execFileSync('node_modules/.bin/esbuild', [src, '--bundle', '--loader:.jsx=jsx',
  '--format=iife', '--platform=browser', '--outfile=' + out], { stdio: 'pipe' });

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { runScripts: 'dangerously', pretendToBeVisual: true });
const { window } = dom;

// jsdom has no layout, so scrollHeight is always 0 and window.scrollTo is a
// no-op. Model both: a settable scrollY, a scrollTo that records what it was
// asked for, and a scrollHeight we control to test clamping.
let scrollY = 0;
let scrollToCalls = [];
Object.defineProperty(window, 'scrollY', { get: () => scrollY, configurable: true });
Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
let docHeight = 5000;
Object.defineProperty(window.document.documentElement, 'scrollHeight', { get: () => docHeight, configurable: true });
window.scrollTo = (x, y) => { scrollToCalls.push(y); scrollY = y; };

const scriptEl = window.document.createElement('script');
scriptEl.textContent = readFileSync(out, 'utf8');
window.document.body.appendChild(scriptEl);

const flush = () => new Promise(r => setTimeout(r, 20));

(async () => {
  const many = Array.from({ length: 40 }, (_, i) => i);
  window.__mount(many);
  await flush();
  scrollToCalls = [];

  // ── 1. Unarmed re-render must not move the page ───────────────────────────
  scrollY = 1200;
  window.__mount(many.slice(0, 39)); // list changed, but capture() never called
  await flush();
  ok(scrollToCalls.length === 0,
    'an ordinary re-render never scrolls — only an explicit capture() arms a restore');

  // ── The armed happy path ──────────────────────────────────────────────────
  scrollY = 1200;
  window.__capture();          // Kevin taps something 1200px down
  window.__mount(many.slice(0, 38)); // the action re-renders the list
  await flush();
  ok(scrollToCalls.length === 1 && scrollToCalls[0] === 1200,
    'an armed action restores the exact scroll position Kevin was at');

  // ── Restore is one-shot ───────────────────────────────────────────────────
  scrollToCalls = [];
  window.__mount(many.slice(0, 37)); // another re-render, not armed
  await flush();
  ok(scrollToCalls.length === 0,
    'the restore fires once and disarms — it does not pin the page on every later render');

  // ── 2. Clamping to a shortened list ───────────────────────────────────────
  scrollY = 4000;
  docHeight = 1000;            // the action removed most of the list
  window.__capture();
  window.__mount(many.slice(0, 3));
  await flush();
  const last = scrollToCalls[scrollToCalls.length - 1];
  ok(last === 200,
    `clamps to the shortened page's real maximum (1000 - 800 = 200), not the stale 4000 — got ${last}`);

  // ── Never scrolls to a negative offset ────────────────────────────────────
  scrollY = 500;
  docHeight = 300;             // page now shorter than the viewport
  window.__capture();
  window.__mount(many.slice(0, 1));
  await flush();
  ok(scrollToCalls[scrollToCalls.length - 1] === 0,
    'a page shorter than the viewport clamps to 0, never a negative offset');

  console.log(`PRESERVE SCROLL: ALL PASS (${pass} checks)`);
  rmSync(dir, { recursive: true, force: true });
})().catch(e => {
  console.error(e);
  rmSync(dir, { recursive: true, force: true });
  process.exit(1);
});
