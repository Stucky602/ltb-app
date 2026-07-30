// tests/amendments.mjs — customer-requested order changes.
//
// WHAT THIS PROTECTS
//
// The whole feature rests on one promise: a request never changes the order.
// Break that and the customer's ask silently becomes the customer's edit, which
// is exactly the situation Kevin needs to not be in, because shopping, prep,
// and capacity are things only he knows about.
//
// The second promise is that an accepted patch applies EXACTLY once. A retry, a
// double-tap, or a re-render must not double a quantity. That is asserted by
// accepting twice and checking the second call is a no-op, rather than by
// trusting the caller to be careful.
//
// The third is that the customer cannot set a price. Every total is recomputed
// from the published week config, and an op arriving with a price attached is
// REFUSED rather than sanitised — silently stripping the field would hide the
// fact that a client sent it.

import {
  OPS, AMENDMENT_STATUS, validatePatch, applyPatch, describePatch,
  priceOrder, priceDelta, makeAmendment, acceptAmendment, rejectAmendment,
  supersedePending,
} from '../src/amendments.js';
import { ALL_DINNERS } from '../src/menu.js';
import { dishIdFor } from '../src/dishIdentity.js';

let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

// Real dishes and real prices, so the pricing assertions mean something.
const offered = ALL_DINNERS.slice(0, 5).map(d => ({ ...d, dishId: dishIdFor(d.name) }));
const A = offered[0], B = offered[1];
const baseOrder = () => ({
  id: 'o1', customer: 'Test', address: '1 Road', phone: '555',
  items: [{ name: A.name, dishId: A.dishId, variant: A.variants[0].label, qty: 1 }],
});

// ── The order is never mutated ──────────────────────────────────────────────
{
  const order = baseOrder();
  const snapshot = JSON.stringify(order);
  const patch = [{ op: 'setQty', dishId: A.dishId, variant: A.variants[0].label, qty: 5 }];

  const result = applyPatch(order, patch);
  ok('applyPatch returns a new order', result !== order);
  ok('and leaves the original untouched', JSON.stringify(order) === snapshot,
    'a request that edits the order in place is the failure this feature exists to prevent');
  ok('the items array is not shared', result.items !== order.items);
  ok('the change landed on the copy', result.items[0].qty === 5);
}

// ── Exactly once ────────────────────────────────────────────────────────────
{
  const order = baseOrder();
  const amd = makeAmendment({ orderId: 'o1', patch: [{ op: 'addItem', dishId: B.dishId, variant: B.variants[0].label, qty: 2 }], idempotencyKey: 'abcdefgh' });

  const first = acceptAmendment(amd, order);
  ok('accepting applies the patch', first.applied && first.order.items.length === 2);
  ok('and records the decision', first.amendment.status === 'accepted' && !!first.amendment.decision.at);
  ok('and preserves the applied result for the audit trail', !!first.amendment.appliedResult);

  const second = acceptAmendment(first.amendment, first.order);
  ok('accepting a second time is a no-op', second.applied === false, second.reason);
  ok('and does not double the quantity',
    second.order.items.find(i => i.dishId === B.dishId).qty === 2,
    'a double-tap in the owner UI would otherwise silently double an order');

  const rej = rejectAmendment(makeAmendment({ orderId: 'o1', patch: [], idempotencyKey: 'zzzzzzzz' }), { reason: 'no capacity' });
  ok('rejecting records the reason', rej.amendment.status === 'rejected' && rej.amendment.decision.reason === 'no capacity');
  ok('and changes nothing about the order', rej.applied === false);

  const already = rejectAmendment(rej.amendment, { reason: 'changed my mind' });
  ok('a decided amendment cannot be re-decided', already.applied === false && already.amendment.decision.reason === 'no capacity');
}

// ── Prices come from the menu, never the wire ───────────────────────────────
{
  const order = baseOrder();
  const withPrice = [{ op: 'setQty', dishId: A.dishId, variant: A.variants[0].label, qty: 2, price: 0 }];
  const errs = validatePatch(withPrice, { offered, order });
  ok('an op carrying a price is refused', errs.length > 0, errs.join('; '));
  ok('and the refusal names the reason plainly', /price/i.test(errs[0]));

  for (const field of ['total', 'cost']) {
    const e = validatePatch([{ op: 'setQty', dishId: A.dishId, variant: A.variants[0].label, qty: 2, [field]: 1 }], { offered, order });
    ok(`a "${field}" field is refused too`, e.length > 0);
  }

  const priced = priceOrder(order, offered);
  ok('an order prices from the published menu', priced.total === A.variants[0].price, String(priced.total));
  ok('and reports nothing unpriceable', priced.unpriced.length === 0);

  const d = priceDelta(order, [{ op: 'setQty', dishId: A.dishId, variant: A.variants[0].label, qty: 3 }], offered);
  ok('the delta is derived, not supplied', d.delta === A.variants[0].price * 2, JSON.stringify(d));

  // A dish that has left the menu must surface, not vanish into a wrong total.
  const stale = { ...baseOrder(), items: [{ name: 'Gone Dish', dishId: 'gone-dish', variant: 'Small', qty: 1 }] };
  const s = priceOrder(stale, offered);
  ok('an item no longer on the menu is reported rather than silently zeroed',
    s.unpriced.length === 1 && s.total === 0);
}

// ── Validation ──────────────────────────────────────────────────────────────
{
  const order = baseOrder();
  const v = (patch, ctx = {}) => validatePatch(patch, { offered, order, ...ctx });

  ok('an empty patch is refused', v([]).length > 0);
  ok('a non-array patch is refused', v(null).length > 0);
  ok('an unknown op is refused', v([{ op: 'dropTable' }]).length > 0);
  ok('a negative quantity is refused', v([{ op: 'setQty', dishId: A.dishId, variant: A.variants[0].label, qty: -1 }]).length > 0);
  ok('a fractional quantity is refused', v([{ op: 'setQty', dishId: A.dishId, variant: A.variants[0].label, qty: 1.5 }]).length > 0);
  ok('an absurd quantity is refused', v([{ op: 'setQty', dishId: A.dishId, variant: A.variants[0].label, qty: 999 }]).length > 0);
  ok('a dish not on the menu is refused',
    v([{ op: 'addItem', dishId: 'not-a-dish', variant: 'Small', qty: 1 }]).length > 0);
  ok('a variant the dish does not offer is refused',
    v([{ op: 'addItem', dishId: A.dishId, variant: 'Enormous', qty: 1 }]).length > 0);
  ok('changing an unsupported contact field is refused',
    v([{ op: 'setContact', field: 'name', value: 'X' }]).length > 0);
  ok('changing address is allowed', v([{ op: 'setContact', field: 'address', value: '2 Road' }]).length === 0);

  ok('a valid patch passes clean',
    v([{ op: 'setQty', dishId: A.dishId, variant: A.variants[0].label, qty: 2 }]).length === 0);
}

// ── The deadline is a timestamp, not prose ──────────────────────────────────
{
  const order = baseOrder();
  const patch = [{ op: 'setQty', dishId: A.dishId, variant: A.variants[0].label, qty: 2 }];

  const open = validatePatch(patch, { offered, order, now: Date.parse('2026-07-30T00:00:00Z'), amendmentsCloseAt: '2026-07-31T00:00:00Z' });
  ok('before the deadline a change is allowed', open.length === 0);

  const closed = validatePatch(patch, { offered, order, now: Date.parse('2026-08-01T00:00:00Z'), amendmentsCloseAt: '2026-07-31T00:00:00Z' });
  ok('after it, refused', closed.length > 0, closed.join('; '));

  const noDeadline = validatePatch(patch, { offered, order, now: Date.now(), amendmentsCloseAt: null });
  ok('an unset deadline means open, not closed', noDeadline.length === 0,
    'an empty published field must never read as "closed" or a publish gap stops all amendments');
}

// ── Both sides read the same sentences ──────────────────────────────────────
{
  const patch = [
    { op: 'setQty', dishId: A.dishId, variant: A.variants[0].label, qty: 0 },
    { op: 'addItem', dishId: B.dishId, variant: B.variants[0].label, qty: 2 },
    { op: 'cancelOrder' },
  ];
  const lines = describePatch(patch, { offered });
  ok('a zero quantity reads as a removal, not "change to 0"', /^Remove /.test(lines[0]), lines[0]);
  ok('an addition names the dish and the count', /^Add 2 × /.test(lines[1]), lines[1]);
  ok('cancelling the order says so', /Cancel the whole order/.test(lines[2]));
  ok('every op produced a sentence', lines.length === patch.length);
}

// ── Superseding ─────────────────────────────────────────────────────────────
{
  const older = makeAmendment({ orderId: 'o1', patch: [{ op: 'cancelOrder' }], idempotencyKey: 'aaaaaaaa' });
  const newer = makeAmendment({ orderId: 'o1', patch: [{ op: 'cancelOrder' }], idempotencyKey: 'bbbbbbbb' });
  const other = makeAmendment({ orderId: 'o2', patch: [{ op: 'cancelOrder' }], idempotencyKey: 'cccccccc' });

  const after = supersedePending([older, newer, other], 'o1', newer.id);
  ok('an older pending request for the same order is superseded',
    after.find(a => a.id === older.id).status === 'superseded');
  ok('the newest stays pending', after.find(a => a.id === newer.id).status === 'pending');
  ok('another order is untouched', after.find(a => a.id === other.id).status === 'pending',
    'the queue must never show two live proposals that contradict each other');
}

// ── Shape contracts ─────────────────────────────────────────────────────────
{
  ok('the op list is exported for the client to validate against', OPS.length >= 6);
  ok('the status list is exported', AMENDMENT_STATUS.includes('superseded'));
  const amd = makeAmendment({ orderId: 'o1', patch: [{ op: 'cancelOrder' }], idempotencyKey: 'dddddddd' });
  ok('a new amendment starts pending', amd.status === 'pending');
  ok('and carries its idempotency key', amd.idempotencyKey === 'dddddddd');
  ok('and an empty decision', amd.decision.at === null && amd.decision.by === null);
  ok('the customer note is length-capped',
    makeAmendment({ orderId: 'o1', patch: [], customerNote: 'x'.repeat(9999), idempotencyKey: 'eeeeeeee' }).customerNote.length === 500);
}

console.log(f === 0 ? '\nAMENDMENTS: ALL PASS' : `\nAMENDMENTS: ${f} FAILURES`);
process.exit(f ? 1 : 0);
