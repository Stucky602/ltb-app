// containerDeposits.js — a deposit on every returnable that leaves the kitchen.
//
// ═══════════════════════════════════════════════════════════════════════════
// IT IS A DEPOSIT, NOT A PASSTHROUGH
//
// Kevin, Aug 2: "$1 for containers and $2 for jars as an incentive to return...
// so if they don't return then I make a little extra."
//
// That is the whole design and it settles a question the walk left open. A
// passthrough is something bought and resold at cost — the money is never
// really his. A deposit IS his if it is not reclaimed, so it cannot be modelled
// as pasta.
//
// The semantics still hold from his earlier ruling: **nobody owes a container.**
// "I hope to get them back someday, but I don't EXPECT them back." So nothing
// here renders as a debt, nothing is attributed to a named household as
// outstanding, and a return is never repayment. Money moving is not the same
// as an obligation existing.
//
// ═══════════════════════════════════════════════════════════════════════════
// IT TOUCHES NEITHER MARGIN, AND THAT IS DELIBERATE
//
// The app already has two margin figures, and the deposit belongs in neither:
//
//   VALUE-ADD MARGIN measures the health of the dish Kevin actually cooks.
//   Holding a deposit is not cooking. Excluded for the same reason pasta is.
//
//   BLENDED MARGIN is the honest bottom line, and this is the one where the
//   instinct to include it is WRONG. If a deposit counted as revenue when
//   charged, a dish would look more profitable when a customer keeps a tub and
//   less profitable when they bring it back — while the dish was cooked exactly
//   the same both times. **A dish's margin must never move because of somebody
//   else's return habits.**
//
// So it is reported on its own, as forfeited-deposit income. That is a line
// worth seeing separately anyway: it says whether the incentive is working,
// which folding it into margin would hide.
//
// ═══════════════════════════════════════════════════════════════════════════
// NOTHING FIRES WHEN A CONTAINER IS NOT RETURNED
//
// A return is an event; keeping something is the absence of one. Without a rule
// the money sits in limbo forever and never appears anywhere.
//
// Kevin's answer: 90 days. After that an unreturned deposit is deemed kept and
// becomes income. It is a DERIVED figure recomputed from the orders every time,
// never a stored balance — so a late return simply produces a smaller number
// next time, with nothing to reverse.

import { orderContainerBreakdown } from './containers.js';

export const DEPOSIT_CENTS = { jar: 200, container: 100 };

// NOT RETURNABLE, SO NOT CHARGED. The 2 oz filé cup never comes back, and a
// deposit that can never be reclaimed is not a deposit — it is a dollar for a
// cup that costs under seven cents. Kevin: "that's fair, I have the $2
// surcharge on all orders for things like this anyway."
//
// It stays in the outbound container inventory: he still tracks every one he
// gives out. Outbound-only is deliberate here, unlike the accidental asymmetry
// this whole change fixes.
export const NON_RETURNABLE = new Set(['cup2']);

// A sous vide bag is not a returnable at all and never enters any of this.
export const NOT_A_CONTAINER = new Set(['bag']);

export const FORFEIT_AFTER_DAYS = 90;
const DAY = 24 * 60 * 60 * 1000;

export const isJarType = (type) => type === 'jar';
export function depositCentsFor(type) {
  if (NOT_A_CONTAINER.has(type) || NON_RETURNABLE.has(type)) return 0;
  return isJarType(type) ? DEPOSIT_CENTS.jar : DEPOSIT_CENTS.container;
}

// ── Outbound ────────────────────────────────────────────────────────────────
//
// DERIVED, NEVER TYPED. The container map already knows what every dish and
// variant ships in, and the omakase card records the rest. Asking Kevin to
// type an outbound count would be asking for something he already told the app.
export function depositsOutFor(order) {
  const breakdown = orderContainerBreakdown(order) || {};
  const byType = {};
  let cents = 0;
  for (const [type, n] of Object.entries(breakdown)) {
    const count = Number(n) || 0;
    if (count <= 0) continue;
    const each = depositCentsFor(type);
    if (!each) continue;
    byType[type] = count;
    cents += each * count;
  }
  return { byType, cents };
}

// ── Returns ─────────────────────────────────────────────────────────────────
//
// TYPED, because a generic count cannot be credited back to the right part of
// the fleet — which is the bug this walk was called to fix.
export function normalizeReturns(raw) {
  const out = {};
  for (const [type, n] of Object.entries(raw || {})) {
    const count = Math.max(0, Math.round(Number(n) || 0));
    if (!count) continue;
    // A type that cannot come back is not recorded as having come back.
    if (NOT_A_CONTAINER.has(type) || NON_RETURNABLE.has(type)) continue;
    out[type] = count;
  }
  return out;
}

export function creditCentsFor(returnsByType) {
  const clean = normalizeReturns(returnsByType);
  return Object.entries(clean).reduce((sum, [type, n]) => sum + depositCentsFor(type) * n, 0);
}

// The flat customer-facing rates are unchanged: any jar $2, any container $1.
// The FLEET's real costs are untouched by all of this — the mason jar is still
// $1.12 and cup2 is still $0.0688, and those still drive the real economics.
// This layer sits on top.
export function returnSummary(returnsByType) {
  const clean = normalizeReturns(returnsByType);
  const jars = Object.entries(clean).filter(([t]) => isJarType(t)).reduce((n, [, v]) => n + v, 0);
  const containers = Object.entries(clean).filter(([t]) => !isJarType(t)).reduce((n, [, v]) => n + v, 0);
  return { byType: clean, jars, containers, creditCents: creditCentsFor(clean) };
}

// ── The ledger ──────────────────────────────────────────────────────────────
//
// PER ORDER, and phrased as circulation rather than debt. `outstanding` is what
// has not come back yet; it is not owed.
export function orderDepositState(order, now = Date.now()) {
  const out = depositsOutFor(order);
  const back = normalizeReturns(order && order.containerReturnsByType);
  const at = new Date((order && (order.deliveredAt || order.createdAt)) || 0).getTime();
  const age = at ? Math.floor((now - at) / DAY) : 0;

  const outstanding = {};
  for (const [type, n] of Object.entries(out.byType)) {
    const left = n - (back[type] || 0);
    if (left > 0) outstanding[type] = left;
  }
  const outstandingCents = Object.entries(outstanding)
    .reduce((sum, [type, n]) => sum + depositCentsFor(type) * n, 0);

  return {
    chargedCents: out.cents,
    creditedCents: creditCentsFor(back),
    outstanding,
    outstandingCents,
    daysSinceDelivery: age,
    // DEEMED KEPT, not "owed". After 90 days the money stops being in limbo and
    // becomes income, and a late return simply makes this smaller next time.
    forfeited: !!at && age >= FORFEIT_AFTER_DAYS && outstandingCents > 0,
  };
}

// RECOMPUTED FROM THE ORDERS EVERY TIME. Never a stored balance: a late return,
// a corrected count, or a deleted order all just produce a different number,
// with nothing to reverse and nothing to drift.
export function forfeitedDepositIncome(orders, now = Date.now()) {
  let cents = 0;
  let orderCount = 0;
  const byType = {};
  for (const o of orders || []) {
    const st = orderDepositState(o, now);
    if (!st.forfeited) continue;
    orderCount++;
    cents += st.outstandingCents;
    for (const [type, n] of Object.entries(st.outstanding)) byType[type] = (byType[type] || 0) + n;
  }
  return { cents, orders: orderCount, byType, afterDays: FORFEIT_AFTER_DAYS };
}

// Still in circulation and not yet deemed kept. Deliberately NOT broken out by
// household: nobody owes a container, and a per-person outstanding list is a
// debtors' register whatever it is labelled.
export function inCirculation(orders, now = Date.now()) {
  const byType = {};
  let cents = 0;
  for (const o of orders || []) {
    const st = orderDepositState(o, now);
    if (st.forfeited) continue;
    for (const [type, n] of Object.entries(st.outstanding)) byType[type] = (byType[type] || 0) + n;
    cents += st.outstandingCents;
  }
  return { byType, cents };
}
