// tests/listControls.mjs — V1 (sort/filter), V2 (search), V3 (windowing).
// Pure module, no DOM. Run: node tests/listControls.mjs

import assert from 'node:assert';
import {
  sortList, filterByStatus, searchList, orderHaystacks, windowList, DEFAULT_WINDOW,
} from '../src/listControls.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

const orders = [
  { id: 'a', customer: 'Zed', createdAt: '2026-07-01T00:00:00Z', status: 'Cooking', paid: true, items: [{ name: 'Bo Ssam', variant: 'Small' }], notes: 'no cilantro' },
  { id: 'b', customer: 'Amy', createdAt: '2026-07-20T00:00:00Z', status: 'Delivered', paid: false, items: [{ name: 'Bolognese' }], notes: '' },
  { id: 'c', customer: 'Mid', createdAt: '2026-07-10T00:00:00Z', status: 'Cooking', paid: true, items: [{ name: 'Leblanc', note: 'extra parm' }], notes: '' },
];

// ── sort ─────────────────────────────────────────────────────────────────────
ok(sortList(orders, 'newest').map(o => o.id).join() === 'b,c,a', 'newest sorts by date descending');
ok(sortList(orders, 'oldest').map(o => o.id).join() === 'a,c,b', 'oldest sorts ascending');
ok(sortList(orders, 'name').map(o => o.id).join() === 'b,c,a', 'name sorts alphabetically (Amy, Mid, Zed)');
ok(sortList(orders, 'unpaidFirst')[0].id === 'b', 'unpaid-first surfaces the unpaid order first');
ok(sortList(orders, 'status').every((o, i, arr) => i === 0 || arr[i - 1].status.localeCompare(o.status) <= 0), 'status groups alphabetically');
ok(sortList(orders)[0].id === 'b', 'no field given defaults to newest');
ok(sortList(orders, 'newest') !== orders, 'sortList never mutates — returns a new array');
ok(orders[0].id === 'a', 'the original array order is untouched');

// ── filter ───────────────────────────────────────────────────────────────────
ok(filterByStatus(orders, 'Cooking').length === 2, 'status filter narrows correctly');
ok(filterByStatus(orders, null).length === 3, 'null status means "all", not "nothing"');
ok(filterByStatus(orders, '').length === 3, 'empty-string status also means "all"');

// ── search ───────────────────────────────────────────────────────────────────
ok(searchList(orders, 'bo ssam', orderHaystacks).map(o => o.id).join() === 'a', 'search matches an item name');
ok(searchList(orders, 'CILANTRO', orderHaystacks).map(o => o.id).join() === 'a', 'search is case-insensitive and matches notes');
ok(searchList(orders, 'parm', orderHaystacks).map(o => o.id).join() === 'c', 'search matches a per-item note');
ok(searchList(orders, '   ', orderHaystacks).length === 3, 'whitespace-only query returns everything untouched');
ok(searchList(orders, '', orderHaystacks) === orders, 'empty query is a genuine no-op, not a filtered copy');
ok(searchList(orders, 'zzz-nothing', orderHaystacks).length === 0, 'no match returns empty, not everything');

// ── window ───────────────────────────────────────────────────────────────────
const many = Array.from({ length: 120 }, (_, i) => ({ id: i }));
const w = windowList(many, DEFAULT_WINDOW);
ok(w.shown.length === 50 && w.total === 120 && w.hiddenCount === 70,
  'windowing shows the first 50 and reports exactly how many are hidden — nothing is dropped, only deferred');
ok(windowList(many, null).shown.length === 120, 'a null limit renders everything (the escape hatch)');
ok(windowList([], 50).hiddenCount === 0, 'an empty list windows cleanly with nothing hidden');
ok(windowList(many.slice(0, 10), 50).hiddenCount === 0, 'a list shorter than the window hides nothing');

console.log(`LIST CONTROLS: ALL PASS (${pass} checks)`);
