// audit_log.mjs — gate suite for src/auditLog.js
import {
  AUDIT_CAP, SOURCES, auditEntry, appendAudit,
  diffIngredientCosts, menuFingerprint, diffMenuFingerprint, diffAliases,
} from '../src/auditLog.js';

let fails = 0;
const ok = (cond, msg) => {
  if (cond) console.log('  ✓ ' + msg);
  else { console.log('  ✗ ' + msg); fails++; }
};

// ── entry shape ──────────────────────────────────────────────────────────────
const e = auditEntry({ target: 'filet', field: 'current', from: 25, to: 0, source: SOURCES.DEPLOY });
ok(typeof e.at === 'string' && !Number.isNaN(Date.parse(e.at)), 'entry stamps a parseable ISO timestamp');
ok(e.from === 25 && e.to === 0, 'entry carries from → to');
ok(!('meta' in e), 'entry omits empty meta');
ok('meta' in auditEntry({ target: 'x', field: 'f', from: 1, to: 2, source: SOURCES.RECEIPT, meta: { raw: 'HEB FILET' } }), 'entry keeps non-empty meta');

// ── append + bounding ────────────────────────────────────────────────────────
ok(appendAudit([], []).length === 0, 'appending nothing to nothing stays empty');
const existing = [auditEntry({ target: 'a', field: 'current', from: 1, to: 2, source: SOURCES.MANUAL })];
ok(appendAudit(existing, []) === existing, 'appending nothing returns the log untouched');

let big = [];
for (let i = 0; i < 600; i++) big.push(auditEntry({ target: 'i' + i, field: 'current', from: 1, to: 2, source: SOURCES.MANUAL }));
const bounded = appendAudit([], big);
ok(bounded.length === AUDIT_CAP, `600 entries bound to cap (${bounded.length} === ${AUDIT_CAP})`);
ok(bounded[bounded.length - 1].target === 'i599', 'bounding keeps the NEWEST entries, drops the oldest');

const ancient = { at: new Date(Date.now() - 200 * 24 * 3600e3).toISOString(), target: 'old', field: 'current', from: 1, to: 2, source: SOURCES.MANUAL };
const withAncient = appendAudit([ancient], [auditEntry({ target: 'new', field: 'current', from: 1, to: 2, source: SOURCES.MANUAL })]);
ok(!withAncient.some(x => x.target === 'old'), '200-day-old entry aged out (90 day window)');
ok(withAncient.some(x => x.target === 'new'), 'fresh entry survives the age filter');

const undated = { at: 'not-a-date', target: 'weird', field: 'current', from: 1, to: 2, source: SOURCES.MANUAL };
ok(appendAudit([undated], [auditEntry({ target: 'n', field: 'c', from: 1, to: 2, source: SOURCES.MANUAL })]).some(x => x.target === 'weird'),
  'unparseable timestamp is KEPT, never silently dropped');

// ── ingredient cost diffs ────────────────────────────────────────────────────
const prevIng = [{ id: 'filet', current: 24.99, baseline: 24.99 }, { id: 'butter', current: 4.5, baseline: 4.5 }];
const nextIng = [{ id: 'filet', current: 0, baseline: 24.99 }, { id: 'butter', current: 4.5, baseline: 4.5 }];
const ingDiff = diffIngredientCosts(prevIng, nextIng, SOURCES.DEPLOY);
ok(ingDiff.length === 1, 'only the CHANGED ingredient is logged, unchanged ones are silent');
ok(ingDiff[0].target === 'filet' && ingDiff[0].from === 24.99 && ingDiff[0].to === 0, 'the $0 filet case is captured with old → new');

ok(diffIngredientCosts(prevIng, prevIng, SOURCES.MANUAL).length === 0, 'identical input logs nothing (idempotent)');

const created = diffIngredientCosts(prevIng, [...prevIng, { id: 'saffron', current: 12, baseline: 12 }], SOURCES.MANUAL);
ok(created.length === 1 && created[0].meta && created[0].meta.created === true, 'a new ingredient is logged as created');

const baselineMove = diffIngredientCosts(prevIng, [{ id: 'filet', current: 24.99, baseline: 30 }, prevIng[1]], SOURCES.MANUAL);
ok(baselineMove.length === 1 && baselineMove[0].field === 'baseline', 'baseline movement is logged separately from current');

const withMeta = diffIngredientCosts(prevIng, nextIng, SOURCES.RECEIPT, { filet: { raw: 'HEB PRIME FILET', basis: 'printed_unit_price' } });
ok(withMeta[0].meta.raw === 'HEB PRIME FILET' && withMeta[0].meta.basis === 'printed_unit_price',
  'receipt-scan entries carry the raw line text and derivation basis');

// sub-cent noise must not generate entries
ok(diffIngredientCosts([{ id: 'x', current: 1.00000, baseline: 1 }], [{ id: 'x', current: 1.00001, baseline: 1 }], SOURCES.MANUAL).length === 0,
  'sub-cent float noise does not create log spam');

// ── menu fingerprint (file-deploy detection) ─────────────────────────────────
const menuA = {
  dinner: [{ name: 'Steak au Poivre', variants: [{ label: 'Medium', price: 150, cost: 87.22 }] }],
  bag: [{ name: 'Filet', perLb: true, pricePerLb: 25, costPerLb: 18, variants: [] }],
};
const fpA = menuFingerprint(menuA);
ok(fpA['Steak au Poivre::Medium'].price === 150, 'fingerprint captures dish variant price');
ok(fpA['Filet::(by weight)'].price === 25, 'fingerprint captures per-lb items');

ok(diffMenuFingerprint({}, fpA).length === 0, 'FIRST RUN logs nothing (establishes baseline, no 100-entry flood)');
ok(diffMenuFingerprint(null, fpA).length === 0, 'null previous fingerprint also logs nothing');

const menuB = JSON.parse(JSON.stringify(menuA));
menuB.bag[0].costPerLb = 0; // the $0 filet, shipped by deploy
const deployDiff = diffMenuFingerprint(fpA, menuFingerprint(menuB));
ok(deployDiff.length === 1 && deployDiff[0].field === 'cost' && deployDiff[0].to === 0 && deployDiff[0].source === SOURCES.DEPLOY,
  'a deploy that zeroes a cost anchor IS caught, tagged file-deploy');

const menuC = JSON.parse(JSON.stringify(menuA));
menuC.dinner[0].variants[0].price = 160;
ok(diffMenuFingerprint(fpA, menuFingerprint(menuC))[0].field === 'price', 'a deployed price change is caught');

ok(diffMenuFingerprint(fpA, fpA).length === 0, 'unchanged catalog logs nothing across deploys');

const menuD = { dinner: [], bag: [] };
const removed = diffMenuFingerprint(fpA, menuFingerprint(menuD));
ok(removed.length === 2 && removed.every(r => r.field === 'removed'), 'removed items are logged, not silently forgotten');

// ── alias remaps ─────────────────────────────────────────────────────────────
ok(diffAliases({ 'heb filet': { ingredientId: 'filet' } }, { 'heb filet': { ingredientId: 'filet', seen: 4 } }).length === 0,
  'counter churn on an alias logs NOTHING (signal preserved)');
const remap = diffAliases({ 'heb filet': { ingredientId: 'filet' } }, { 'heb filet': { ingredientId: 'butter' } });
ok(remap.length === 1 && remap[0].from === 'filet' && remap[0].to === 'butter', 'an alias REMAP is logged with old → new ingredient');
ok(diffAliases({}, { 'new str': { ingredientId: 'onion' } }).length === 1, 'a brand new alias mapping is logged');

// ── no PII, structurally ─────────────────────────────────────────────────────
const allEntries = [...ingDiff, ...deployDiff, ...remap, ...withMeta];
const serialized = JSON.stringify(allEntries);
ok(!/customer|address|phone|@/i.test(serialized), 'no PII-shaped fields anywhere in produced entries');

console.log(fails === 0 ? '\nAUDIT LOG: ALL PASS' : `\nAUDIT LOG: ${fails} FAILURES`);
process.exit(fails ? 1 : 0);
