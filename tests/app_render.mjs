// tests/app_render.mjs — the one test that actually MOUNTS App.jsx.
//
// WHY THIS EXISTS
// Before this file, nothing in the 36-command gate compiled or rendered
// App.jsx. Three files mentioned it; all three mentions were comments. That
// meant `npm test` could go green while the largest and most dangerous file in
// the repo was broken, and the only detector was Kevin opening the app.
//
// component_render.mjs cannot cover it. That harness uses renderToStaticMarkup,
// which never runs effects, and App.jsx opens with `if (loading) return
// <Loading/>` where `loading` only clears inside a useEffect. A static render
// would produce eleven words, pass, and prove nothing. That is worse than no
// test, because it looks like coverage.
//
// So: jsdom, a real client render, real effects, and a click through every tab.
// This catches the two bug classes that have actually bitten this file:
//   - TEMPORAL DEAD ZONE. esbuild compiles `const` read above its declaration
//     just fine and it throws at runtime. Same reason component_render exists.
//   - HOOK ORDER. A conditional or reordered hook breaks React at render time
//     and is invisible to every pure-logic suite in the gate. Note the limit
//     found while proving this file can fail: React only complains when the
//     hook COUNT CHANGES between renders. A hook behind a condition that never
//     flips during this run sails through. The mount here goes through at least
//     one loading->loaded transition, which is what makes the common version of
//     that bug (a hook guarded on loaded data) detectable.
//
// WHAT IT DELIBERATELY DOES NOT DO
// It does not assert on content. Numbers, copy, and layout belong to the suites
// that already own them, and pinning them here would make this file fail every
// time a price moved. The single question asked is "does every screen draw
// without throwing", because that is the question nothing else was asking.
//
// The app is mounted WITHOUT the outer ErrorBoundary that entry.jsx wraps it
// in, on purpose: in production the boundary turning a crash into a readable
// screen is correct, but in a test it would swallow the exact failure this file
// exists to catch. The inner compact boundaries (one per order card) stay, so
// those are caught by watching console.error instead.

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import {
  FIXTURE_ALL_ORDERS, FIXTURE_JOURNAL, FIXTURE_REGULARS,
  FIXTURE_WEEK_DISHES, FIXTURE_WEEK_LEDGER, FIXTURE_CONTAINER_CONFIG,
} from './fixtures/state.mjs';

let failed = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failed++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}

// ── 1. Bundle ───────────────────────────────────────────────────────────────
// Scratch dir INSIDE the project. Bundling from /tmp resolves a second copy of
// React and every render dies with "Invalid hook call" instead of the real
// result, which is a confusing way to fail. Same trap component_render hit.
const dir = path.join(process.cwd(), '.app-render-check');
mkdirSync(dir, { recursive: true });
const entry = path.join(dir, 'harness.jsx');
const bundle = path.join(dir, 'harness.cjs');

writeFileSync(entry, `
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
export { React, createRoot, App };
`);

try {
  execFileSync('npx', ['esbuild', entry, '--bundle', '--loader:.jsx=jsx',
    '--outfile=' + bundle, '--format=cjs', '--platform=browser',
    '--define:process.env.NODE_ENV="development"', '--log-level=error'],
    { stdio: 'pipe' });
  check('App.jsx and its 40-odd imports bundle', true);
} catch (e) {
  check('App.jsx and its 40-odd imports bundle', false, String(e.stderr || e.message).slice(0, 400));
  console.log(`\nAPP RENDER: ${failed} FAILURES`);
  rmSync(dir, { recursive: true, force: true });
  process.exit(1);
}

// ── 2. A browser ────────────────────────────────────────────────────────────
// Globals go up BEFORE the bundle is imported. utils.js picks its storage
// backend at module scope (`window.storage || localStore`), so a window that
// arrives late means the app binds to the wrong one and every load returns the
// fallback, which would look like a passing test on an empty app.
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://ltb.test/', pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
// Node 22 ships its own read-only `navigator` global, so plain assignment
// throws. The app only ever feature-detects on it (`'serviceWorker' in
// navigator`), but it has to be jsdom's or that detection reads the wrong
// object.
Object.defineProperty(global, 'navigator', {
  value: dom.window.navigator, configurable: true, writable: true,
});
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
global.cancelAnimationFrame = clearTimeout;
global.IS_REACT_ACT_ENVIRONMENT = true;

// Every network call fails. The app is built to survive being offline (that is
// most of what pollWorkerPending, pushBackup, and pullKitchenFeedback have to
// tolerate), so offline is both the honest default here and the harsher test.
global.fetch = () => Promise.reject(new Error('offline in test'));
dom.window.fetch = global.fetch;

// ── 3. Seed storage ─────────────────────────────────────────────────────────
// The nasty fixture, not a happy path: a form order with no category on its
// items, a house order that must stay out of every metric, backfilled history,
// and a journal carrying a private entry.
const seed = {
  'ltb-orders': FIXTURE_ALL_ORDERS,
  'ltb-journal': FIXTURE_JOURNAL,
  'ltb-regulars': FIXTURE_REGULARS,
  'ltb-week': { selected: FIXTURE_WEEK_DISHES },
  'ltb-week-ledger': FIXTURE_WEEK_LEDGER,
  'ltb-container-inventory': FIXTURE_CONTAINER_CONFIG,
};
for (const [k, v] of Object.entries(seed)) {
  dom.window.localStorage.setItem(k, JSON.stringify(v));
}

// ── 4. Mount ────────────────────────────────────────────────────────────────
// require, not import(): esbuild's CJS output defines its exports as getters,
// which node's static lexer cannot see through, so `import()` hands back a
// namespace of undefineds. require() is also synchronous, which is what we
// want here — the globals above must already be in place when the bundle's
// module scope runs.
const { createRequire } = await import('node:module');
const requireCjs = createRequire(import.meta.url);
const { React, createRoot, App } = requireCjs(bundle);
const act = React.act;

// A compact ErrorBoundary catching a bad order card renders a tidy little
// message and returns to green. That is right in production and useless here,
// so the boundary's own console.error is treated as a test failure.
const caught = [];
const realError = console.error;
console.error = (...args) => {
  if (String(args[0] || '').includes('[ErrorBoundary]')) caught.push(args.slice(0, 3).map(String).join(' '));
  realError.apply(console, args);
};

const container = dom.window.document.getElementById('root');
const root = createRoot(container);

let mountError = null;
try {
  await act(async () => { root.render(React.createElement(App)); });
  // Boot is async: the schema guard, fourteen parallel loads, the dishNotes
  // fold, the ingredients reconcile, and the house backfill all have to settle
  // before `loading` clears and the real tree draws.
  await act(async () => { await new Promise(r => setTimeout(r, 60)); });
} catch (e) {
  mountError = e;
}

check('App mounts and boot hydration completes', !mountError, mountError && mountError.message);
// Absence of the loading text is NOT enough: a crashed mount leaves an empty
// container, which also lacks that string, and the check would pass on the
// worst possible outcome. Demand real content as well.
const text = container.textContent || '';
const bootedPastLoading = !text.includes('Loading orders...') && text.length > 200;
check('boot clears the loading screen and the tree below it draws', bootedPastLoading,
  text.length <= 200 ? `container holds only ${text.length} chars` : 'still on the loading screen');

// ── 5. Every tab ────────────────────────────────────────────────────────────
// `view` is internal state with no prop to set it, so the tabs are driven the
// way Kevin drives them: by clicking the nav. This is what reaches the render
// branches, and the render branches are where a TDZ error hides.
async function clickByText(label) {
  const btn = [...container.querySelectorAll('button')]
    .find(b => b.textContent.trim() === label || b.textContent.trim().startsWith(label));
  if (!btn) return false;
  await act(async () => {
    btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 10));
  });
  return true;
}

const TABS = ['Orders', 'Cook', 'Shop', 'Rowan', 'Ingredients', 'Money', 'Regulars', 'Recipes', 'Record', 'Week'];
for (const tab of TABS) {
  let err = null;
  let found = false;
  try { found = await clickByText(tab); } catch (e) { err = e; }
  if (!found && !err) { check(`${tab} tab renders`, false, 'nav button not found'); continue; }
  const broke = container.textContent.includes('Something broke while drawing this screen');
  check(`${tab} tab renders`, !err && !broke, err ? err.message : (broke ? 'error boundary caught a render throw' : ''));
}

// The Cook tab's Deliver half is a separate branch behind its own toggle, and
// it owns the omakase price-confirm path, so it does not get to hide.
await clickByText('Cook');
let deliverErr = null;
try { await clickByText('Deliver'); } catch (e) { deliverErr = e; }
check('Cook → Deliver renders', !deliverErr, deliverErr && deliverErr.message);

check('no order card fell into its error boundary', caught.length === 0, caught[0]);

// The epoch card renders ONLY from the Record tab, and it was invisible for a
// week because its render condition required a proposal the detector will not
// make on a young order history. Assert it is on the page.
//
// Record now has sub-tabs (Do / Read / Keep) mapped 1:1 onto the group headings
// it already had, so the epoch card sits behind "Keep" where its heading always
// put it. Walk every pane: a broken toggle would otherwise ship silently, since
// a pane that renders nothing looks exactly like a pane whose content moved.
await clickByText('Record');

await clickByText('Do');
check('Record → Do renders the worklist',
  (container.textContent || '').includes('Coverage'),
  `Do pane has ${(container.textContent || '').length} chars`);

// WALKS PANE REMOVED Aug 2 at Kevin's instruction — he wants walks in the MD,
// not collected in the app, because their answers become rules rather than
// per-item records. Asserting its ABSENCE so nobody re-mounts it by habit.
check('Record → Do does NOT show a walks collector',
  !(container.textContent || '').includes('One question at a time'),
  'walks are a conversation; the app should use their answers, not gather them');

await clickByText('Read');
check('Record → Read renders',
  (container.textContent || '').length > 200,
  'Read pane came back empty');

await clickByText('Keep');
const recordText = container.textContent || '';
check('the Record tab shows the real-data epoch card',
  recordText.includes('Where the real data starts'),
  `Keep pane has ${recordText.length} chars and does not mention it`);
check('Record → Keep renders the durable-record export',
  recordText.includes('The durable record'),
  'the export card is missing from Keep');

// Recipes splits the per-dish browser from the menu-development cluster.
// Same reasoning: assert a known card in each pane.
await clickByText('Recipes');
check('Recipes → Dishes is the default pane',
  (container.textContent || '').includes('Menu overview'),
  `Dishes pane has ${(container.textContent || '').length} chars`);

await clickByText('Pipeline');
check('Recipes → Pipeline renders the candidate board',
  (container.textContent || '').includes('in testing'),
  'the pipeline pane did not render its candidates');

await act(async () => { root.unmount(); });
console.error = realError;
rmSync(dir, { recursive: true, force: true });

console.log(failed === 0 ? '\nAPP RENDER: ALL PASS' : `\nAPP RENDER: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
