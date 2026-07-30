// src/amendments.js — customer-requested order changes.
//
// THE ONE RULE THIS FILE EXISTS TO ENFORCE
//
// An amendment request NEVER mutates the accepted order. It is a proposal.
// Kevin accepts or rejects it, and only acceptance writes to the order. That is
// not a UI nicety: shopping, prep, capacity, and special sourcing can all make
// a technically valid menu change impossible, and he is the only one who knows.
//
// So five things are preserved for every amendment, and losing any of them
// makes the audit trail worthless:
//
//   1. the original order          (untouched until acceptance)
//   2. the customer's requested diff
//   3. the accept/reject decision
//   4. the applied result
//   5. when, and why if a reason was given
//
// STRUCTURED PATCHES, NEVER PROSE. Kevin's app can already parse a natural
// language amendment out of a text message, and that is exactly what this
// replaces. A parsed instruction is a guess; an op is a fact. Ops are the wire
// format between the customer page, the worker, and the owner app.
//
// PRICING IS NEVER TRUSTED FROM THE CUSTOMER. Every total here is recomputed
// from the published week config. The customer page shows an estimate so the
// person knows roughly what they are asking for; the number that counts is the
// one this file derives.

import { dishIdFor, resolveDishId } from './dishIdentity.js';

// ── Op shapes ───────────────────────────────────────────────────────────────
//
// Each op names a dish by dishId, never by display string, so a rename between
// order and amendment cannot orphan a request.
//
//   { op: 'setQty',      dishId, variant, qty }
//   { op: 'addItem',     dishId, variant, qty }
//   { op: 'removeItem',  dishId, variant }
//   { op: 'setOption',   dishId, variant, key, value }   // spice level, protein choice
//   { op: 'setNote',     dishId, variant, note }         // omakase note
//   { op: 'setContact',  field, value }                  // address | phone
//   { op: 'cancelOrder' }
export const OPS = ['setQty', 'addItem', 'removeItem', 'setOption', 'setNote', 'setContact', 'cancelOrder'];

export const AMENDMENT_STATUS = ['pending', 'accepted', 'rejected', 'superseded'];

const CONTACT_FIELDS = ['address', 'phone'];

function sameItem(item, op) {
  const itemId = resolveDishId(item) || dishIdFor(item.name);
  if (itemId !== op.dishId) return false;
  // A variant of null on the op means "whichever variant of this dish", which
  // only makes sense when the order carries exactly one.
  if (op.variant == null) return true;
  return (item.variant || item.label || null) === op.variant;
}

// ── Validation ──────────────────────────────────────────────────────────────
//
// Runs BEFORE anything is stored, and again before anything is applied. The
// second run is not paranoia: the published menu can change between a customer
// submitting and Kevin deciding, and an op that was valid on Sunday can be
// invalid on Monday.
export function validatePatch(patch, ctx = {}) {
  const errors = [];
  const { offered = null, order = null, now = Date.now(), amendmentsCloseAt = null } = ctx;

  if (!Array.isArray(patch) || patch.length === 0) {
    return ['An amendment must contain at least one change.'];
  }
  if (patch.length > 40) {
    return ['That is more changes than an amendment should carry. Place a new order instead.'];
  }

  if (amendmentsCloseAt && now > Date.parse(amendmentsCloseAt)) {
    errors.push('Amendments for this week are closed.');
  }

  for (const op of patch) {
    if (!op || typeof op !== 'object') { errors.push('Malformed change.'); continue; }
    if (!OPS.includes(op.op)) { errors.push(`Unknown change type: ${op.op}`); continue; }

    if (op.op === 'cancelOrder') continue;

    if (op.op === 'setContact') {
      if (!CONTACT_FIELDS.includes(op.field)) errors.push(`Cannot change ${op.field}.`);
      if (typeof op.value !== 'string' || !op.value.trim()) errors.push('That field cannot be empty.');
      if (String(op.value).length > 300) errors.push('That is too long.');
      continue;
    }

    if (!op.dishId) { errors.push('A change is missing its dish.'); continue; }

    // NEVER trust a price off the wire. If one is present the client is either
    // broken or probing; either way the op is refused rather than sanitised,
    // because silently dropping the field would hide the fact that it was sent.
    if ('price' in op || 'total' in op || 'cost' in op) {
      errors.push('Prices are set by the kitchen and cannot be sent with a change.');
      continue;
    }

    if (op.op === 'setQty' || op.op === 'addItem') {
      const q = Number(op.qty);
      if (!Number.isInteger(q)) { errors.push('Quantity must be a whole number.'); continue; }
      if (q < 0) { errors.push('Quantity cannot be negative.'); continue; }
      if (q > 20) { errors.push('That quantity is beyond what a single order should carry.'); continue; }
    }

    // Is the dish actually on this week's menu, at that variant?
    if (offered) {
      const dish = offered.find(d => (d.dishId || dishIdFor(d.name)) === op.dishId);
      if (!dish) {
        errors.push('One of those dishes is not on this week\u2019s menu.');
        continue;
      }
      if (op.variant != null && Array.isArray(dish.variants)) {
        const labels = dish.variants.map(v => v.label);
        if (!labels.includes(op.variant)) errors.push(`"${op.variant}" is not a size offered for that dish.`);
      }
    }

    // removeItem / setOption / setNote must target something the order has.
    if (order && ['removeItem', 'setOption', 'setNote', 'setQty'].includes(op.op)) {
      const hit = (order.items || []).some(it => sameItem(it, op));
      if (!hit && op.op !== 'setQty') errors.push('That item is not on the order.');
    }
  }

  return errors;
}

// ── Applying ────────────────────────────────────────────────────────────────
//
// PURE. Takes an order, returns a new order. No state, no side effects, no
// network. That is what lets the owner app preview the result before accepting
// and produce exactly the same thing on acceptance.
export function applyPatch(order, patch) {
  if (!order) return order;
  let items = [...(order.items || [])];
  let next = { ...order };

  for (const op of patch || []) {
    switch (op.op) {
      case 'cancelOrder':
        next.cancelled = true;
        items = [];
        break;

      case 'setContact':
        next[op.field] = String(op.value).trim();
        break;

      case 'setQty': {
        const idx = items.findIndex(it => sameItem(it, op));
        if (idx === -1) {
          if (Number(op.qty) > 0) items.push({ name: op.name || null, dishId: op.dishId, variant: op.variant, qty: Number(op.qty) });
        } else if (Number(op.qty) === 0) {
          items.splice(idx, 1);
        } else {
          items[idx] = { ...items[idx], qty: Number(op.qty) };
        }
        break;
      }

      case 'addItem': {
        const idx = items.findIndex(it => sameItem(it, op));
        if (idx === -1) {
          items.push({ name: op.name || null, dishId: op.dishId, variant: op.variant, qty: Number(op.qty) || 1 });
        } else {
          items[idx] = { ...items[idx], qty: (Number(items[idx].qty) || 0) + (Number(op.qty) || 1) };
        }
        break;
      }

      case 'removeItem':
        items = items.filter(it => !sameItem(it, op));
        break;

      case 'setOption': {
        const idx = items.findIndex(it => sameItem(it, op));
        if (idx !== -1) items[idx] = { ...items[idx], [op.key]: op.value };
        break;
      }

      case 'setNote': {
        const idx = items.findIndex(it => sameItem(it, op));
        if (idx !== -1) items[idx] = { ...items[idx], note: String(op.note || '') };
        break;
      }

      default:
        break;
    }
  }

  next.items = items;
  return next;
}

// ── Describing ──────────────────────────────────────────────────────────────
//
// The customer sees this before submitting and Kevin sees it in the queue. Both
// read the SAME sentences, deliberately: a request that reads one way to the
// person asking and another way to the person deciding is how a misunderstanding
// gets approved.
export function describePatch(patch, ctx = {}) {
  const nameFor = (op) => {
    if (op.name) return op.name;
    const d = (ctx.offered || []).find(x => (x.dishId || dishIdFor(x.name)) === op.dishId);
    return d ? d.name : op.dishId;
  };
  const size = (op) => (op.variant ? ` (${op.variant})` : '');
  const out = [];

  for (const op of patch || []) {
    switch (op.op) {
      case 'cancelOrder': out.push('Cancel the whole order'); break;
      case 'setContact': out.push(`Change ${op.field} to ${op.value}`); break;
      case 'setQty':
        out.push(Number(op.qty) === 0
          ? `Remove ${nameFor(op)}${size(op)}`
          : `Change ${nameFor(op)}${size(op)} to ${op.qty}`);
        break;
      case 'addItem': out.push(`Add ${op.qty || 1} × ${nameFor(op)}${size(op)}`); break;
      case 'removeItem': out.push(`Remove ${nameFor(op)}${size(op)}`); break;
      case 'setOption': out.push(`${nameFor(op)}${size(op)}: ${op.key} → ${op.value}`); break;
      case 'setNote': out.push(`${nameFor(op)}${size(op)}: note updated`); break;
      default: break;
    }
  }
  return out;
}

// ── Pricing ─────────────────────────────────────────────────────────────────
//
// From the published config only. `offered` is the week config's dish list, the
// same shape the customer page renders from, so a price that is not on the menu
// cannot enter the total.
export function priceOrder(order, offered) {
  let total = 0;
  const unpriced = [];

  for (const it of (order?.items || [])) {
    const id = resolveDishId(it) || dishIdFor(it.name);
    const dish = (offered || []).find(d => (d.dishId || dishIdFor(d.name)) === id);
    const variant = dish && Array.isArray(dish.variants)
      ? dish.variants.find(v => v.label === (it.variant || it.label))
      : null;
    if (!variant || typeof variant.price !== 'number') {
      unpriced.push(it.name || id || 'unknown item');
      continue;
    }
    total += variant.price * (Number(it.qty) || 0);
  }

  // Reported rather than swallowed. An unpriceable line means the menu moved
  // under the order, and Kevin should see that instead of a quietly wrong total.
  return { total, unpriced };
}

// The number the queue actually shows: what accepting this would do to the week.
export function priceDelta(order, patch, offered) {
  const before = priceOrder(order, offered);
  const after = priceOrder(applyPatch(order, patch), offered);
  return {
    before: before.total,
    after: after.total,
    delta: after.total - before.total,
    unpriced: [...new Set([...before.unpriced, ...after.unpriced])],
  };
}

// ── Records ─────────────────────────────────────────────────────────────────
export function makeAmendment({ orderId, patch, customerNote = '', deviceHash = null, idempotencyKey }) {
  return {
    id: 'amd_' + (idempotencyKey || Math.random().toString(36).slice(2, 10)),
    orderId,
    customerDeviceHash: deviceHash,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    requestedPatch: patch,
    customerNote: String(customerNote || '').slice(0, 500),
    decision: { at: null, by: null, reason: null },
    idempotencyKey: idempotencyKey || null,
  };
}

// Acceptance is the ONLY path that writes to an order, and it must be exactly
// once. The guard is the status, not the caller's discipline: a double-tap in
// the owner UI or a retried request would otherwise apply the patch twice and
// silently double a quantity.
export function acceptAmendment(amendment, order, { by = 'owner', at = null } = {}) {
  if (!amendment || amendment.status !== 'pending') {
    return { amendment, order, applied: false, reason: 'not pending' };
  }
  const applied = applyPatch(order, amendment.requestedPatch);
  return {
    amendment: {
      ...amendment,
      status: 'accepted',
      decision: { at: at || new Date().toISOString(), by, reason: null },
      appliedResult: { items: applied.items, cancelled: !!applied.cancelled },
    },
    order: applied,
    applied: true,
  };
}

export function rejectAmendment(amendment, { by = 'owner', reason = null, at = null } = {}) {
  if (!amendment || amendment.status !== 'pending') {
    return { amendment, applied: false, reason: 'not pending' };
  }
  return {
    amendment: {
      ...amendment,
      status: 'rejected',
      decision: { at: at || new Date().toISOString(), by, reason: reason || null },
    },
    applied: false,
  };
}

// A newer request for the same order supersedes older pending ones, so the
// queue never shows Kevin two live proposals that contradict each other.
export function supersedePending(amendments, orderId, keepId) {
  return (amendments || []).map(a =>
    (a.orderId === orderId && a.status === 'pending' && a.id !== keepId)
      ? { ...a, status: 'superseded' }
      : a);
}
