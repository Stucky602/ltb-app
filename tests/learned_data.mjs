// tests/learned_data.mjs — the learned-data review layer.
//
// The scanner learns silently and permanently. This module is the window into
// what it believes, and the delete button is the only escape from a bad learn.
// The tests care most about two things: that a wrong learn can be REMOVED, and
// that removing or remapping one doesn't quietly corrupt a neighbouring fact.

import assert from 'node:assert/strict';
import {
  summarizeLearnedData, learnedDataStats, deleteLearnedEntry, remapLearnedEntry,
  originOf, ORIGIN,
} from '../src/learnedData.js';
import { INGREDIENT_SEED } from '../src/ingredients.js';
import { diffAliases, SOURCES } from '../src/auditLog.js';

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed += 1; }
  catch (e) { console.error(`\n[learned-data] FAIL: ${name}\n  ${e.message}\n`); process.exit(1); }
};

const DB = [
  { id: 'corn', name: 'Corn', unit: 'ear', baseline: 0.25, current: 0.25 },
  { id: 'lemon', name: 'Lemon', unit: 'each', baseline: 0.5, current: 0.5 },
  { id: 'thyme_fresh', name: 'Thyme (fresh)', unit: 'sprig', baseline: 0.1993, current: 0.1993 },
];

// ── origin ────────────────────────────────────────────────────────────────
test('a bare mapping is seeded; one with counters is learned', () => {
  assert.equal(originOf({ ingredientId: 'corn' }), ORIGIN.SEEDED);
  assert.equal(originOf({ ingredientId: 'corn', confirms: 2 }), ORIGIN.LEARNED);
  assert.equal(originOf({ ingredientId: 'corn', packQty: 8, packObs: 1 }), ORIGIN.LEARNED);
  assert.equal(originOf({ ingredientId: 'corn', storeSeen: { HEB: 3 } }), ORIGIN.LEARNED);
});

test('ignores are recognized both ways', () => {
  assert.equal(originOf({ action: 'IGNORE_ALWAYS' }), ORIGIN.IGNORED);
  // learned ignore: seen unmapped 3+ times, the classifier stops asking
  assert.equal(originOf({ seenUnmatched: 3 }), ORIGIN.IGNORED);
  assert.equal(originOf({ seenUnmatched: 2 }), ORIGIN.LEARNED, 'under the threshold it is not yet an ignore');
});

// ── summarize ─────────────────────────────────────────────────────────────
test('resolves ingredient names for display', () => {
  const rows = summarizeLearnedData({ 'fresh corn': { ingredientId: 'corn', confirms: 2 } }, DB);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].ingredientName, 'Corn');
  assert.equal(rows[0].unit, 'ear');
  assert.equal(rows[0].origin, ORIGIN.LEARNED);
});

test('an alias pointing at a dead ingredient is flagged orphaned', () => {
  // This is the quiet killer: baselineCostMap is built from the seed, so a
  // mapping to an id that no longer exists resolves to nothing. Same shape as
  // the $0 filet — a costing input that is wrong rather than missing.
  const rows = summarizeLearnedData({ 'old thing': { ingredientId: 'deleted_ingredient', confirms: 5 } }, DB);
  assert.equal(rows[0].orphaned, true);
  assert.match(rows[0].ingredientName, /NOT IN DB/);
});

test('orphans sort to the very top', () => {
  const rows = summarizeLearnedData({
    'aaa first alphabetically': { ingredientId: 'corn' },
    'zzz broken': { ingredientId: 'gone', confirms: 1 },
  }, DB);
  assert.equal(rows[0].norm, 'zzz broken', 'the actively-wrong row must lead');
});

test('ignores outrank learned, learned outranks seeded', () => {
  const rows = summarizeLearnedData({
    'c seeded': { ingredientId: 'corn' },
    'b learned': { ingredientId: 'lemon', confirms: 2 },
    'a ignored': { action: 'IGNORE_ALWAYS' },
  }, DB);
  assert.deepEqual(rows.map(r => r.origin), [ORIGIN.IGNORED, ORIGIN.LEARNED, ORIGIN.SEEDED]);
});

test('habitual store needs 2+ sightings and no tie', () => {
  const rows = summarizeLearnedData({
    once: { ingredientId: 'corn', storeSeen: { HEB: 1 } },
    twice: { ingredientId: 'corn', storeSeen: { HEB: 2 } },
    tied: { ingredientId: 'corn', storeSeen: { HEB: 2, 'H-Mart': 2 } },
  }, DB);
  const by = Object.fromEntries(rows.map(r => [r.norm, r]));
  assert.equal(by.once.habitualStore, null, 'one sighting is not a habit');
  assert.equal(by.twice.habitualStore, 'HEB');
  assert.equal(by.tied.habitualStore, null, 'a tie is not a habit');
});

test('junk entries are skipped, not crashed on', () => {
  const rows = summarizeLearnedData({ a: null, b: 'nonsense', c: { ingredientId: 'corn' } }, DB);
  assert.equal(rows.length, 1);
});

test('an empty or missing map summarizes to nothing', () => {
  assert.deepEqual(summarizeLearnedData({}, DB), []);
  assert.deepEqual(summarizeLearnedData(null, DB), []);
  assert.deepEqual(summarizeLearnedData(undefined, undefined), []);
});

// ── stats ─────────────────────────────────────────────────────────────────
test('stats count what the header claims', () => {
  const rows = summarizeLearnedData({
    a: { ingredientId: 'corn' },
    b: { ingredientId: 'lemon', confirms: 3 },
    c: { ingredientId: 'thyme_fresh', packQty: 15, packObs: 2 },
    d: { action: 'IGNORE_ALWAYS' },
    e: { ingredientId: 'gone', confirms: 1 },
  }, DB);
  const s = learnedDataStats(rows);
  assert.equal(s.total, 5);
  assert.equal(s.seeded, 1);
  assert.equal(s.ignored, 1);
  assert.equal(s.withPackQty, 1);
  assert.equal(s.orphaned, 1);
});

// ── delete: the whole point ───────────────────────────────────────────────
test('delete removes exactly one entry and nothing else', () => {
  const before = {
    'fresh corn': { ingredientId: 'corn', confirms: 2 },
    'lemons bag': { ingredientId: 'lemon', confirms: 5, packQty: 6 },
  };
  const after = deleteLearnedEntry(before, 'fresh corn');
  assert.equal(after['fresh corn'], undefined);
  assert.deepEqual(after['lemons bag'], before['lemons bag'], 'a neighbour must survive untouched');
});

test('delete does not mutate the input', () => {
  const before = { 'fresh corn': { ingredientId: 'corn' } };
  const frozen = JSON.stringify(before);
  deleteLearnedEntry(before, 'fresh corn');
  assert.equal(JSON.stringify(before), frozen);
});

test('deleting a key that is not there is a harmless no-op', () => {
  const before = { a: { ingredientId: 'corn' } };
  assert.deepEqual(deleteLearnedEntry(before, 'not here'), before);
});

// ── remap ─────────────────────────────────────────────────────────────────
test('remap points at the new ingredient and DROPS packQty', () => {
  // packQty means "this many costing units per package" and the unit belongs
  // to the OLD ingredient. A pack of 15 sprigs remapped to lemons is not 15
  // lemons. Carrying it over would be the unit-change bug one layer up.
  const before = { 'herb pack': { ingredientId: 'thyme_fresh', packQty: 15, packObs: 3, packLastImplied: 15, confirms: 4 } };
  const after = remapLearnedEntry(before, 'herb pack', 'lemon');
  assert.equal(after['herb pack'].ingredientId, 'lemon');
  assert.equal(after['herb pack'].packQty, undefined, 'a pack size in the old unit is meaningless in the new one');
  assert.equal(after['herb pack'].packObs, undefined);
  assert.equal(after['herb pack'].packLastImplied, undefined);
});

test('remap resets confirms', () => {
  // confirms drives auto-promotion. Inheriting the old count would
  // auto-promote Kevin's correction with zero confirmations behind it.
  const before = { x: { ingredientId: 'corn', confirms: 9 } };
  assert.equal(remapLearnedEntry(before, 'x', 'lemon').x.confirms, 0);
});

test('remap un-ignores an ignored line', () => {
  const before = { junk: { action: 'IGNORE_ALWAYS' } };
  const after = remapLearnedEntry(before, 'junk', 'corn');
  assert.equal(after.junk.action, undefined);
  assert.equal(after.junk.ingredientId, 'corn');
});

test('remap keeps store history', () => {
  // Where Kevin shops is true regardless of which ingredient the line means.
  const before = { x: { ingredientId: 'corn', storeSeen: { HEB: 4 } } };
  assert.deepEqual(remapLearnedEntry(before, 'x', 'lemon').x.storeSeen, { HEB: 4 });
});

test('remap does not mutate the input', () => {
  const before = { x: { ingredientId: 'corn', packQty: 5 } };
  const frozen = JSON.stringify(before);
  remapLearnedEntry(before, 'x', 'lemon');
  assert.equal(JSON.stringify(before), frozen);
});

test('remapping a missing key changes nothing', () => {
  const before = { a: { ingredientId: 'corn' } };
  assert.deepEqual(remapLearnedEntry(before, 'nope', 'lemon'), before);
});

// ── against the real seed ─────────────────────────────────────────────────
test('the shipped alias table summarizes without orphans', () => {
  // Every seeded alias must point at an ingredient that exists. One that does
  // not is a silent $0 waiting to happen, and this is the cheapest place to
  // catch it.
  const seedDb = INGREDIENT_SEED.map(i => ({ ...i, current: i.baseline }));
  const rows = summarizeLearnedData({
    'fresh corn': { ingredientId: 'corn' },
    'soli organic thyme': { ingredientId: 'thyme_fresh' },
  }, seedDb);
  assert.equal(learnedDataStats(rows).orphaned, 0);
});

// ── the delete must leave a trace ─────────────────────────────────────────
test('deleting an alias produces an audit entry', () => {
  // The panel's headline feature was, until Jul 15, its only unaudited action:
  // diffAliases only walked keys present in `next`, so a removed key produced
  // nothing. A delete button that makes the app quietly forget, with no record
  // of who told it to, is the exact failure the audit log exists to end.
  const before = { 'fresh corn': { ingredientId: 'corn', confirms: 2 }, keep: { ingredientId: 'lemon' } };
  const after = deleteLearnedEntry(before, 'fresh corn');
  const entries = diffAliases(before, after);
  assert.equal(entries.length, 1, 'exactly the deleted row is logged');
  assert.equal(entries[0].target, 'fresh corn');
  assert.equal(entries[0].from, 'corn');
  assert.equal(entries[0].to, null);
  assert.equal(entries[0].source, SOURCES.MANUAL, 'a delete is Kevin acting, not a receipt');
});

test('a remap through the panel still logs as a remap', () => {
  const before = { x: { ingredientId: 'corn', confirms: 3 } };
  const after = remapLearnedEntry(before, 'x', 'lemon');
  const entries = diffAliases(before, after);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].from, 'corn');
  assert.equal(entries[0].to, 'lemon');
});

console.log(`[learned-data] ${passed} checks passed`);
