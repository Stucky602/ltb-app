// Renders real components with real data. esbuild compiles a temporal dead zone
// error just fine (a `const` read above its own declaration is valid syntax),
// so the only way to catch one is to actually render. Kevin hit exactly this on
// the Money tab: DigestPanel's `needs` memo read `open` fifteen lines before
// `open` existed, and the whole tab went to the error boundary.
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

let failed = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failed++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}

const ORDERS = `[
  { id:'a', customer:'Dave', createdAt:new Date().toISOString(), total:75, paid:false,
    items:[{ name:'Omakase', omakase:true, qty:1, price:75, budgetMax:75, components:[] }] },
  { id:'b', customer:'Sara', createdAt:new Date().toISOString(), total:40, paid:true,
    items:[{ name:'Bo Ssam', variant:'Small (~4 servings)', qty:1, price:40, cost:20 }] },
  { id:'h', customer:'House', house:true, createdAt:new Date().toISOString(), total:0, paid:true, items:[] },
]`;
const REGULARS = `[{ id:'r1', names:['Dave'], name:'Dave', dietary:'no cilantro' }]`;

// [componentName, importPath, propsExpression]
const CASES = [
  ['DigestPanel', './src/components/DigestPanel.jsx',
    `{ orders: ${ORDERS}, regulars: ${REGULARS}, liveCostMap: {}, baseCostMap: {} }`],
  ['ErrorBoundary', './src/components/ErrorBoundary.jsx',
    `{ label: 'test', children: React.createElement('div', null, 'child') }`],
  // The invoice has to EXPLAIN its own total. At-cost add-ons counted toward
  // the money but rendered nowhere, so a customer saw a number that did not
  // match the lines above it.
  // The dossier (K1–K8). Real journal data including a private entry and a
  // retired dish with no retirement record, so the nudge path renders too.
  ['JournalPanel', './src/components/JournalPanel.jsx',
    `{ dish: 'Bo Ssam',
       journal: { version: 1, entries: [
         { id: 'j1', ts: '2026-07-24T06:00:00Z', type: 'decision', subject: { kind: 'dish', dish: 'Bo Ssam' },
           text: 'Kimchi is passthrough on purpose.', private: false },
         { id: 'j2', ts: '2026-07-24T06:01:00Z', type: 'provenance', subject: { kind: 'dish', dish: 'Bo Ssam' },
           text: 'Private provenance line.', private: true },
       ] },
       onSaveJournal: () => {} }`],
  ['InvoiceModal', './src/components/Modals.jsx',
    `{ order: { id:'o1', customer:'Dave', createdAt:'2026-07-20', total: 110.5,
        items: [{ name:'Bolognese', variant:'Large (~8)', qty:1, price:100, cost:45,
          addons:[{ id:'a1', request:'Block of good parm', cost:8.5, pending:false },
                  { id:'a2', request:'Extra chili oil', cost:null, pending:true }] }] },
      onClose: () => {} }`],
];

// Scratch dir INSIDE the project. Bundling from /tmp resolves a second copy of
// React and every render dies with "Invalid hook call" instead of the real
// result, which is a confusing way to fail.
const dir = path.join(process.cwd(), '.render-check');
mkdirSync(dir, { recursive: true });
for (const [name, imp, props] of CASES) {
  const src = path.join(dir, `${name}.jsx`);
  const out = path.join(dir, `${name}.cjs`);
  writeFileSync(src, `
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ${name} } from '${path.relative(dir, path.resolve(imp)).split(path.sep).join('/')}';
const html = renderToStaticMarkup(React.createElement(${name}, ${props}));
if (!html || !html.length) { console.error('EMPTY'); process.exit(1); }
console.log(html);
`);
  try {
    execFileSync('node_modules/.bin/esbuild', [src, '--bundle', '--loader:.jsx=jsx',
      '--format=cjs', '--platform=node', '--outfile=' + out], { stdio: 'pipe' });
    const stdout = String(execFileSync('node', [out], { stdio: 'pipe' }) || '');
    check(`${name} renders with real data`, true);
    if (name === 'JournalPanel') {
      check('dossier renders the selected dish\'s entries', /Kimchi is passthrough/.test(stdout));
      check('dossier marks a private entry as private', /private/.test(stdout));
      // The retirement nudge is deliberately GONE from the dossier: it listed
      // dishes unrelated to the one on screen. The signal lives on as
      // orphanedDishNames in the Monday briefing (see tests/journal.mjs), so
      // this asserts its ABSENCE rather than silently dropping the check.
      check('dossier does NOT carry the retirement nudge any more', !/No retirement record/.test(stdout));
    }
    if (name === 'InvoiceModal') {
      check('invoice shows at-cost add-ons as line items', /Block of good parm/.test(stdout));
      check('invoice shows a pending add-on too', /Extra chili oil/.test(stdout));
    }
  } catch (e) {
    const msg = String((e.stderr || e.stdout || e.message)).split('\n')
      .find(l => /Error|error/.test(l)) || 'render failed';
    check(`${name} renders with real data`, false, msg.trim());
  }
  try { unlinkSync(src); unlinkSync(out); } catch { /* scratch dir, ignore */ }
}
try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }

console.log(failed === 0 ? '\nCOMPONENT RENDER: ALL PASS' : `\nCOMPONENT RENDER: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
