// tests/state_checks.mjs — the checks that used to be runtime-only.
//
// Everything here was previously impossible to gate, because the data lives in
// one device's localStorage. tests/fixtures/state.mjs makes it possible, and
// the fixture is deliberately nasty: it holds the awkward cases that have
// actually caused bugs here, not a tidy happy path.
//
// Run: node tests/state_checks.mjs

import assert from 'node:assert';
import {
  FIXTURE_ORDERS, FIXTURE_ALL_ORDERS, FIXTURE_JOURNAL, FIXTURE_REGULARS,
  FIXTURE_WEEK_DISHES, FIXTURE_WEEK_LEDGER, FIXTURE_CONTAINER_CONFIG,
  FIXTURE_KNOWN_NAMES, FIXTURE_DISH_NAMES, FIXTURE_NOW,
} from './fixtures/state.mjs';
import {
  orphanedDishNames, dossierCoverage, dossierComposition, entriesOnThisDay,
  entriesForDish, recentlyDeleted, transferableEntries, publicEntries,
} from '../src/journal.js';
import { containerReport, mealContainersOut, packagingCost } from '../src/containers.js';
import { buildCookList } from '../src/cookList.js';
import { weeklyDossierPrompt } from '../src/dossierPrompts.js';
import { sameMonthPreviousYears } from '../src/weekLedger.js';
import { DISH_RENAMES } from '../src/utils.js';
import { FULL_MENU, CATEGORY_LABELS } from '../src/menu.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

// ── ORPHANED NAMES — the check I said could not be gated ────────────────────
const orphans = orphanedDishNames(FIXTURE_ALL_ORDERS, FIXTURE_KNOWN_NAMES, DISH_RENAMES);
const orphanNames = orphans.map(o => o.name);
ok(orphanNames.includes('A Dish That Never Was'),
  'a name the registry does not know and DISH_RENAMES does not map IS an orphan');
ok(!orphanNames.includes('Curry of the Week'),
  'a HISTORICAL name that maps through DISH_RENAMES is NOT an orphan — it resolves');
ok(!orphanNames.includes('Chicken Breast'), 'nor is the renamed chicken');
ok(!orphanNames.some(n => /Omakase/.test(n)), 'an omakase line is not a catalog dish');
ok(orphans.length === 1, 'exactly one genuine orphan in the fixture, and it is the fabricated one');

// ── COOK LIST — form and manual entries must collapse ───────────────────────
const cook = buildCookList(FIXTURE_ORDERS, FULL_MENU, Object.keys(CATEGORY_LABELS));
const firstDish = cook.filter(r => r.name === FIXTURE_DISH_NAMES[0]);
ok(firstDish.length === 1,
  'the form order and the manual entry for one dish collapse to ONE line, gated at build time now');
ok(firstDish[0].qty === 5, 'and their counts add up (2 + 3) instead of sitting on two lines');
ok(cook.every(r => r.category), 'every line lands in a bucket, including the ones from the form');

// ── CONTAINER MATH — the Sunday check ───────────────────────────────────────
const report = containerReport(FIXTURE_ORDERS, FIXTURE_REGULARS, FIXTURE_CONTAINER_CONFIG);
ok(report.rows.length === 5, 'the Sunday check reports on all five container types');
ok(report.rows.every(r => r.need >= 0 && r.have >= 0), 'no negative demand or availability');
ok(report.shortages.every(s => s.short === s.need - s.have), 'a shortage is exactly need minus have');
ok(typeof report.mealOut === 'number' && report.mealOut >= 0, 'the meal pool never goes negative');
ok(mealContainersOut(FIXTURE_ORDERS, FIXTURE_CONTAINER_CONFIG) >= 0, 'and neither does it in isolation');
// House orders go in real containers, so they DO count as demand.
ok(report.rows.reduce((s, r) => s + r.need, 0) > 0, 'the week actually needs containers');
const pc = packagingCost(FIXTURE_ORDERS);
ok(pc.total >= 0 && Number.isFinite(pc.total), 'packaging cost is a real number');

// ── THE RECORD'S OWN SHAPE ──────────────────────────────────────────────────
const cov = dossierCoverage(FIXTURE_JOURNAL, FIXTURE_DISH_NAMES, DISH_RENAMES);
ok(cov.total === FIXTURE_DISH_NAMES.length, 'coverage walks the whole catalog');
ok(cov.rows[0].entries === 0, 'and puts an empty dish first, because it is a worklist');
ok(cov.documented + cov.empty === cov.total, 'documented and empty account for every dish');
const comp = dossierComposition(FIXTURE_JOURNAL);
ok(comp.total === FIXTURE_JOURNAL.entries.length, 'composition counts every entry');
ok(comp.missing.includes('mistake'),
  'and names the types with nothing in them — the fixture has no mistakes on purpose');
ok(comp.private === 1 && comp.transferable === 1, 'private and transferable counts are separate reads');

// ── RENAME-FOLLOWING inside the journal ─────────────────────────────────────
const renamedTarget = DISH_RENAMES['Chicken Breast'];
ok(renamedTarget, 'the fixture depends on the chicken rename existing');
ok(entriesForDish(FIXTURE_JOURNAL, renamedTarget, DISH_RENAMES).length === 1,
  'an entry filed under a historical dish name follows the rename to its current name');

// ── ON THIS DAY, against a frozen clock ─────────────────────────────────────
const otd = entriesOnThisDay(FIXTURE_JOURNAL, new Date('2026-07-29T12:00:00Z'), DISH_RENAMES);
ok(otd.length === 1 && otd[0].yearsAgo === 1, 'exactly one memory from a year ago today');
ok(!otd.some(e => e.undated), 'and the undated migration artifact is not one of them');

// ── PRIVACY, on real-shaped data ────────────────────────────────────────────
ok(publicEntries(FIXTURE_JOURNAL.entries).length === FIXTURE_JOURNAL.entries.length - 1,
  'exactly the private entry is withheld from anything customer-facing');
ok(transferableEntries(FIXTURE_JOURNAL, DISH_RENAMES).length === 1, 'one flagged principle');
ok(recentlyDeleted(FIXTURE_JOURNAL, new Date('2026-07-29T12:00:00Z')).length === 1,
  'the tombstone is still inside its undo window');

// ── THE WEEKLY QUESTION ─────────────────────────────────────────────────────
const q = weeklyDossierPrompt(FIXTURE_JOURNAL, FIXTURE_WEEK_DISHES, 'w', FIXTURE_NOW, DISH_RENAMES);
ok(q && FIXTURE_WEEK_DISHES.includes(q.dish),
  'the question is always about a dish being cooked THIS week, never one to reconstruct from memory');
ok(typeof q.question === 'string' && q.question.length > 20, 'and it is a real sentence');

// ── SEASONAL RECALL ─────────────────────────────────────────────────────────
const season = sameMonthPreviousYears(FIXTURE_WEEK_LEDGER, new Date('2026-07-29T12:00:00Z'));
ok(season.length === 1, 'July of a previous year is recalled, this July is not');
ok(season[0].dishes.length > 0, 'and it remembers what was on that menu');

console.log(`STATE CHECKS: ALL PASS (${pass} checks)`);
