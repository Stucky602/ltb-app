// tests/version_stamping.mjs — the recipe version of a dish must be RECORDED
// when it becomes true, per line item, and never rewritten afterwards.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
//
// `offeredRecipeVersionId` and `servedRecipeVersionId` shipped in schema v4 and
// had ZERO write sites for their entire life. migrations.js created them as
// null, chronicle.js read them, and nothing ever set either one. The Chronicle
// therefore answered every week's version column from `currentVersionFor()` —
// the recipe as it stands today — and flagged it as a gap every time, which is
// the only reason the hole was visible at all.
//
// Nothing in the 66-command gate touched either write moment. Accepting a
// pending order is covered for costs and inventory but was never checked for
// versions, and MARK DELIVERED — the button Kevin presses on every single order
// — was exercised by no test whatsoever. That is what let two fields exist for
// a week without a single writer.
//
// THE PROPERTY THAT MATTERS MOST is not that the stamp happens; it is that it
// happens ONCE. A version recorded at acceptance describes what the customer
// ordered against. If a later update overwrote it, the record would silently
// become "whatever the recipe was the last time anyone touched this order",
// which is worse than null because it looks like data.

import assert from 'node:assert';
import { acceptPending, updateOrder, bulkUpdateOrders } from '../src/orderOps.js';
import { stampItemVersions, currentVersionFor } from '../src/recipeVersions.js';
import { migrateForward, SCHEMA_VERSION } from '../src/migrations.js';
import { dishIdFor } from '../src/dishIdentity.js';
import { DISHES } from '../src/dishes.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// A real dish with a real version, so this tests the registry rather than a mock.
const DISH = DISHES.find(d => currentVersionFor(dishIdFor(d.name)));
assert(DISH, 'no dish in the registry has a current recipe version');
const DISH_VERSION = currentVersionFor(dishIdFor(DISH.name)).id;
const OTHER = DISHES.find(d => d.name !== DISH.name && currentVersionFor(dishIdFor(d.name)));
const OTHER_VERSION = currentVersionFor(dishIdFor(OTHER.name)).id;

console.log(`  · using "${DISH.name}" (${DISH_VERSION}) and "${OTHER.name}" (${OTHER_VERSION})`);

// ── 1. The helper ───────────────────────────────────────────────────────────
{
  const items = [
    { name: DISH.name, variant: DISH.variants[0].label, qty: 1 },
    { name: OTHER.name, variant: OTHER.variants[0].label, qty: 1 },
  ];
  const out = stampItemVersions(items, 'offeredRecipeVersionId');
  ok('each item gets ITS OWN dish version, not the first one found',
    out[0].offeredRecipeVersionId === DISH_VERSION &&
    out[1].offeredRecipeVersionId === OTHER_VERSION,
    `got ${out[0].offeredRecipeVersionId} and ${out[1].offeredRecipeVersionId}`);

  const already = stampItemVersions(
    [{ name: DISH.name, offeredRecipeVersionId: 'rv_ancient' }], 'offeredRecipeVersionId');
  ok('an already-recorded version is NEVER overwritten',
    already[0].offeredRecipeVersionId === 'rv_ancient',
    'the first recording is the true one; a later one is a guess wearing the same name');

  const unknown = stampItemVersions([{ name: 'A Dish That Does Not Exist' }], 'offeredRecipeVersionId');
  ok('an unresolvable dish stamps null rather than inventing a version',
    unknown[0].offeredRecipeVersionId === null,
    'renders as "Legacy — exact recipe version unrecorded", which is honest');

  ok('the other field is left alone',
    out[0].servedRecipeVersionId === undefined,
    'stamping offered must not fabricate a served version for food not yet delivered');
}

// ── 2. ACCEPT stamps the offered version ────────────────────────────────────
{
  let saved = null;
  const pending = {
    pendingId: 'p1',
    customer: 'Test Person',
    items: [
      { name: DISH.name, variant: DISH.variants[0].label, qty: 1 },
      { name: OTHER.name, variant: OTHER.variants[0].label, qty: 1 },
    ],
  };
  acceptPending(pending, {
    handledPendingRef: { current: {} },
    regulars: [],
    setOrders: (fn) => { saved = fn([]); },
    setError: () => {},
    adjustInventory: () => {},
    linkOrderToRegular: () => {},
    autoFillRegularContact: () => {},
    setLinkPrompt: () => {},
    dismissPending: () => {},
    setShowPendingIdx: () => {},
  });
  const order = (saved || [])[0];
  ok('accepting a pending order records the offered version on every item',
    !!order && order.items.every(it => it.offeredRecipeVersionId),
    order ? JSON.stringify(order.items.map(i => i.offeredRecipeVersionId)) : 'no order was created');
  ok('and the versions are per dish, not one repeated across the order',
    !!order && order.items[0].offeredRecipeVersionId !== order.items[1].offeredRecipeVersionId,
    'this is the whole reason the fields moved off the order');
  ok('served is NOT stamped at acceptance',
    !!order && order.items.every(it => !it.servedRecipeVersionId),
    'nothing has been cooked or delivered yet; claiming otherwise would be a lie');
}

// ── 3. MARK DELIVERED stamps the served version ─────────────────────────────
// The button that had no test at all.
{
  const base = {
    id: 'o1', status: 'Cooking',
    items: [
      { name: DISH.name, offeredRecipeVersionId: 'rv_offered_earlier' },
      { name: OTHER.name, offeredRecipeVersionId: 'rv_offered_earlier' },
    ],
  };
  let state = [base];
  updateOrder('o1', { status: 'Delivered' }, {
    setOrders: (fn) => { state = fn(state); }, setError: () => {},
  });
  const o = state[0];
  ok('marking an order Delivered records the served version on every item',
    o.items.every(it => it.servedRecipeVersionId),
    JSON.stringify(o.items.map(i => i.servedRecipeVersionId)));
  ok('and it does not disturb the offered version already on record',
    o.items.every(it => it.offeredRecipeVersionId === 'rv_offered_earlier'),
    'offered and served answer different questions and must not overwrite each other');

  // Re-tap.
  const before = JSON.stringify(state[0].items);
  updateOrder('o1', { status: 'Delivered' }, {
    setOrders: (fn) => { state = fn(state); }, setError: () => {},
  });
  ok('re-tapping Delivered changes nothing',
    JSON.stringify(state[0].items) === before,
    'a second stamp would rewrite what was actually served with what is current now');

  // A status change that is NOT Delivered must not stamp.
  let s2 = [{ id: 'o2', status: 'Ordered', items: [{ name: DISH.name }] }];
  updateOrder('o2', { status: 'Cooking' }, {
    setOrders: (fn) => { s2 = fn(s2); }, setError: () => {},
  });
  ok('moving to any other status stamps nothing',
    !s2[0].items[0].servedRecipeVersionId,
    'served means served');
}

// ── 4. The BULK path stamps too ─────────────────────────────────────────────
// Two code paths reach Delivered. A fix that covered only the button would
// leave the bulk action bar silently writing unversioned history.
{
  let state = [
    { id: 'a', status: 'Cooking', items: [{ name: DISH.name }] },
    { id: 'b', status: 'Cooking', items: [{ name: OTHER.name }] },
    { id: 'c', status: 'Cooking', items: [{ name: DISH.name }] },
  ];
  bulkUpdateOrders(['a', 'b'], { status: 'Delivered' }, {
    orders: state, persistOrders: (next) => { state = next; },
  });
  ok('bulk-marking delivered stamps every selected order',
    state[0].items[0].servedRecipeVersionId === DISH_VERSION &&
    state[1].items[0].servedRecipeVersionId === OTHER_VERSION);
  ok('and leaves unselected orders untouched',
    !state[2].items[0].servedRecipeVersionId);
}

// ── 5. The migration inherits honestly ──────────────────────────────────────
{
  const v4 = {
    orders: [
      {
        id: 'old', offeredRecipeVersionId: 'rv_old', servedRecipeVersionId: 'rv_old_served',
        items: [{ name: DISH.name }, { name: OTHER.name }],
      },
      { id: 'nulls', offeredRecipeVersionId: null, servedRecipeVersionId: null, items: [{ name: DISH.name }] },
    ],
  };
  const out = migrateForward(JSON.parse(JSON.stringify(v4)), 4);
  const old = out.orders[0];
  ok('items inherit the order-level version where one exists',
    old.items.every(it => it.offeredRecipeVersionId === 'rv_old' && it.servedRecipeVersionId === 'rv_old_served'));
  ok('and every inherited item is MARKED as inherited',
    old.items.every(it => it.versionInherited === true),
    'the hedge must travel with the value; an assumption presented as a recording is the failure mode');
  ok('the order-level fields are kept, not stripped',
    old.offeredRecipeVersionId === 'rv_old',
    'recorded history is not deleted to tidy a shape');
  ok('an order with nothing to inherit is returned untouched',
    !('versionInherited' in out.orders[1].items[0]),
    'the v3→v4 step refused to backfill facts nobody knows; this must not undo that');

  const twice = migrateForward(JSON.parse(JSON.stringify(out)), 4);
  ok('the step is idempotent',
    JSON.stringify(twice) === JSON.stringify(out));

  ok(`SCHEMA_VERSION is ${SCHEMA_VERSION}`, SCHEMA_VERSION === 5);
}

console.log(failed === 0 ? '\nVERSION STAMPING: ALL PASS' : `\nVERSION STAMPING: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
