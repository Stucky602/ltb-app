// tests/fixtures/state.mjs — a representative snapshot of real app state.
//
// WHY THIS EXISTS: a whole class of checks in this app could only ever run at
// RUNTIME, because the data they check lives in one device's localStorage. The
// orphaned-name detector was written off as "cannot be a gate test" for exactly
// that reason, and the container shortage math, the coverage read, and the
// weekly question were all in the same position. That was a limitation being
// accepted rather than fixed.
//
// This fixture is the fix. It is deliberately NASTY: it contains the awkward
// cases that have actually caused bugs in this project, not a tidy happy path.
// A fixture that only holds clean data proves nothing, because clean data was
// never the problem.
//
// Built from the REAL registry, so dish names, variants, and prices are the
// ones that actually ship. Dates are fixed so nothing here can drift by
// weekday, month, or year.

import { DISHES, ALWAYS_ITEMS } from '../../src/dishes.js';

// The clock every fixture-driven test should use. Wednesday, so the order
// window is open and the business week has just started.
export const FIXTURE_NOW = new Date('2026-07-29T12:00:00Z');

const dinner = (i) => DISHES[i % DISHES.length];
const variantOf = (d, i = 0) => (d.variants && d.variants[i] && d.variants[i].label) || '';
const alwaysNamed = (needle) =>
  Object.values(ALWAYS_ITEMS).flat().find(x => x.name.includes(needle))
  || Object.values(ALWAYS_ITEMS).flat()[0];

const JAR_ITEM = alwaysNamed('Queso');
const D0 = dinner(0), D1 = dinner(1), D2 = dinner(2), D3 = dinner(3);

// ── ORDERS ──────────────────────────────────────────────────────────────────
// The awkward cases, each one deliberate:
//   o-form     an order from the customer form: NO `category` on its items,
//              which is the exact shape that split the cook list into two
//              lines for one dish
//   o-manual   the same dish and variant entered by hand, WITH a category
//   o-house    a house order, which must never enter a metric
//   o-orphan   carries a dish name the registry no longer knows and that
//              DISH_RENAMES does not map
//   o-renamed  carries a HISTORICAL name that DOES map through DISH_RENAMES
//   o-archived archived but delivered, so it still counts as gone-out
//   o-omakase  an omakase line, which is priced but not packed
export const FIXTURE_ORDERS = [
  {
    id: 'o-form', customer: 'Dave', regularId: 'r-dave', status: 'Confirmed',
    createdAt: '2026-07-29T09:00:00Z', total: 80, paid: false,
    items: [{ name: D0.name, variant: variantOf(D0), qty: 2 }],
  },
  {
    id: 'o-manual', customer: 'Sara', regularId: 'r-sara', status: 'Confirmed',
    createdAt: '2026-07-29T10:00:00Z', total: 40, paid: true,
    items: [{ name: D0.name, variant: variantOf(D0), qty: 3, category: 'dinners' }],
  },
  {
    id: 'o-house', customer: 'House', house: true, status: 'Delivered',
    createdAt: '2026-07-23T10:00:00Z', total: 0, paid: true,
    items: [{ name: D1.name, variant: variantOf(D1), qty: 1 }],
  },
  {
    id: 'o-orphan', customer: 'Mike', status: 'Delivered', archived: true,
    createdAt: '2026-05-02T10:00:00Z', total: 45, paid: true,
    items: [{ name: 'Curry of the Week', qty: 1 }, { name: 'A Dish That Never Was', qty: 1 }],
  },
  {
    id: 'o-renamed', customer: 'Priya', status: 'Delivered', archived: true,
    createdAt: '2026-06-11T10:00:00Z', total: 52, paid: true,
    items: [{ name: 'Chicken Breast', qty: 1 }],
  },
  {
    id: 'o-archived', customer: 'Tom', regularId: 'r-tom', status: 'Delivered', archived: true,
    createdAt: '2026-07-15T10:00:00Z', total: 96, paid: true, containerReturns: 3,
    items: [{ name: D2.name, variant: variantOf(D2), qty: 2 }, { name: JAR_ITEM.name, qty: 1 }],
  },
  {
    id: 'o-omakase', customer: 'Lee', status: 'Confirmed',
    createdAt: '2026-07-29T11:00:00Z', total: 60, paid: false,
    items: [{ name: 'Omakase', omakase: true, qty: 1, price: 60 }],
  },
];

// Orders typed in when the app was built. They are REAL history in the sense
// that the food happened, but they are NOT evidence of anything the app can
// count, because their timestamps record data entry. Every standing filter
// about backfilled history exists because of these.
export const FIXTURE_BACKFILLED_ORDERS = [
  { id: 'b-1', customer: 'Old Friend', status: 'Delivered', archived: true,
    createdAt: '2026-01-14T03:11:00Z', total: 40, paid: true,
    items: [{ name: D3.name, variant: variantOf(D3), qty: 1 }] },
  { id: 'b-2', customer: 'Old Friend', status: 'Delivered', archived: true,
    createdAt: '2026-01-14T03:12:00Z', total: 40, paid: true,
    items: [{ name: D3.name, variant: variantOf(D3), qty: 1 }] },
  { id: 'b-3', customer: 'Another', status: 'Delivered', archived: true,
    createdAt: '2026-01-14T03:14:00Z', total: 80, paid: true,
    items: [{ name: D1.name, variant: variantOf(D1), qty: 2 }] },
];

export const FIXTURE_ALL_ORDERS = [...FIXTURE_BACKFILLED_ORDERS, ...FIXTURE_ORDERS];

// ── JOURNAL ─────────────────────────────────────────────────────────────────
// Includes a private entry, a transferable one, a migrated+undated one, an
// entry filed under a HISTORICAL dish name, and a tombstone inside the undo
// window. Every one of those has its own read path.
export const FIXTURE_JOURNAL = {
  version: 1,
  entries: [
    { id: 'j-1', ts: '2025-07-29T08:00:00Z', type: 'technique',
      subject: { kind: 'dish', dish: D0.name },
      text: 'Written a year ago today, so the on-this-day read has something to find.',
      private: false, transferable: false },
    { id: 'j-2', ts: '2026-07-01T08:00:00Z', type: 'provenance',
      subject: { kind: 'dish', dish: D0.name },
      text: 'A private provenance line that must never reach a customer surface.',
      private: true, transferable: false },
    { id: 'j-3', ts: '2026-07-02T08:00:00Z', type: 'adjustment',
      subject: { kind: 'dish', dish: D1.name },
      text: 'Flat means it wants acid before it wants salt.',
      private: false, transferable: true },
    { id: 'j-4', ts: '2026-07-03T08:00:00Z', type: 'technique',
      subject: { kind: 'dish', dish: 'Chicken Breast' },
      text: 'Filed under a name the registry no longer uses; must follow the rename.',
      private: false, transferable: false },
    { id: 'j-5', ts: '2026-06-01T08:00:00Z', type: 'technique',
      subject: { kind: 'dish', dish: D2.name },
      text: 'A migrated cook note with no real date.',
      private: false, transferable: false, migrated: true, undated: true },
    { id: 'j-6', ts: '2026-07-05T08:00:00Z', type: 'price',
      subject: { kind: 'dish', dish: D2.name },
      text: 'Deliberately below the floor. Volume play, not an oversight.',
      private: false, transferable: false },
  ],
  deleted: [
    { id: 'j-gone', ts: '2026-07-10T08:00:00Z', type: 'mistake',
      subject: { kind: 'dish', dish: D1.name },
      text: 'Deleted but still inside the 30-day window.',
      private: false, transferable: false, deletedAt: '2026-07-20T08:00:00Z' },
  ],
};

export const FIXTURE_REGULARS = [
  { id: 'r-dave', names: ['Dave'], name: 'Dave', linkedOrderIds: ['o-form'] },
  { id: 'r-sara', names: ['Sara'], name: 'Sara', linkedOrderIds: ['o-manual'] },
  { id: 'r-tom', names: ['Tom', 'Thomas'], name: 'Tom', linkedOrderIds: ['o-archived'] },
];

export const FIXTURE_WEEK_DISHES = [D0.name, D1.name, D2.name];

export const FIXTURE_WEEK_LEDGER = {
  weeks: [
    { stamp: Date.parse('2025-07-23'), label: 'Week of Jul 23', dishes: [D0.name, D3.name], publishedAt: '2025-07-23T10:00:00Z' },
    { stamp: Date.parse('2026-07-22'), label: 'Week of Jul 22', dishes: [D0.name, D1.name], publishedAt: '2026-07-22T10:00:00Z' },
  ],
};

export const FIXTURE_CONTAINER_CONFIG = {
  owned: { rect38: 5, round8: 5, round16: 5, round32: 5, jar: 12 },
  mealAdjust: 0,
};

// Every name the app still serves. What falls outside it and does not map
// through DISH_RENAMES is an orphan.
export const FIXTURE_KNOWN_NAMES = new Set([
  ...DISHES.map(d => d.name),
  ...Object.values(ALWAYS_ITEMS).flat().map(i => i.name),
]);

export const FIXTURE_DISH_NAMES = DISHES.map(d => d.name);
