// ─── Customer favorites ──────────────────────────────────────────────────────
// Which dishes have actually earned their reputation, computed from two
// independent signals rather than one:
//
//   1. REPEAT ORDERS. Someone ordering a dish four separate times is the
//      strongest evidence a dish is good, and it needs no one to fill in a
//      form. Repeat customers matter more than raw volume: five orders from
//      one household is a smaller signal than five different people.
//   2. FEEDBACK. The good/meh/bad verdicts already collected on kitchen pages.
//
// Deliberately NOT "nothing went wrong": an absence of complaints is weak
// evidence, since most people never leave feedback at all. A favorite has to
// be something people came BACK for.
//
// Two guards worth keeping:
//   - House orders never count. The wife eating something is not a customer
//     signal, and this has leaked into other metrics twice before.
//   - Nothing qualifies on thin evidence. A dish that ran once and got one
//     nice comment is not a favorite yet, and saying so would cheapen the
//     badge everywhere else it appears.
import { isHouseOrder } from './utils.js';

// A dish must clear BOTH a volume floor and a quality floor. The thresholds
// are deliberately conservative: a badge that appears on half the menu says
// nothing at all.
export const FAVORITE_RULES = {
  minOrders: 4,        // total times ordered, across everyone
  minHouseholds: 2,    // by at least this many different people
  minRepeatRate: 0.3,  // and at least this share came back for it a second time
  minFeedback: 3,      // OR: this many verdicts...
  minGoodRate: 0.8,    // ...of which this share said it was perfect
};

// Order-side signal for every dish: how many times, how many distinct
// households, and how many of those households came back for it again.
export function dishOrderSignal(orders) {
  const out = {};
  for (const o of (orders || [])) {
    if (isHouseOrder(o)) continue;
    const who = o.regularId || String(o.customer || '').trim().toLowerCase();
    if (!who) continue;
    for (const it of (o.items || [])) {
      if (!it.name || it.omakase) continue;
      const e = out[it.name] || (out[it.name] = { orders: 0, households: new Map() });
      e.orders += Number(it.qty) || 1;
      e.households.set(who, (e.households.get(who) || 0) + 1);
    }
  }
  const shaped = {};
  for (const [name, e] of Object.entries(out)) {
    const households = e.households.size;
    const repeaters = [...e.households.values()].filter(n => n > 1).length;
    shaped[name] = {
      orders: e.orders,
      households,
      repeaters,
      repeatRate: households ? repeaters / households : 0,
    };
  }
  return shaped;
}

// Feedback-side signal: verdict counts and the share that said "perfect".
export function dishFeedbackSignal(dishFeedback) {
  const out = {};
  for (const [name, fb] of Object.entries(dishFeedback || {})) {
    const t = (fb && fb.tally) || {};
    const good = Number(t.good) || 0;
    const meh = Number(t.meh) || 0;
    const bad = Number(t.bad) || 0;
    const total = good + meh + bad;
    if (!total) continue;
    out[name] = { good, meh, bad, total, goodRate: good / total };
  }
  return out;
}

// The verdict for one dish. `why` is the human reason, used in tooltips and in
// Kevin's own view so a badge is never unexplained.
export function favoriteStatus(name, orderSig, fbSig, rules = FAVORITE_RULES) {
  const o = orderSig[name] || { orders: 0, households: 0, repeaters: 0, repeatRate: 0 };
  const f = fbSig[name] || null;

  const byOrders = o.orders >= rules.minOrders
    && o.households >= rules.minHouseholds
    && o.repeatRate >= rules.minRepeatRate;
  const byFeedback = !!f && f.total >= rules.minFeedback && f.goodRate >= rules.minGoodRate;

  // A dish people actively disliked is never a favorite, however often it sold.
  const disliked = !!f && f.total >= rules.minFeedback && f.goodRate < 0.5;
  if (disliked) return { favorite: false, why: 'feedback is mixed' };

  if (!byOrders && !byFeedback) return { favorite: false, why: 'not enough evidence yet' };

  const reasons = [];
  if (byOrders) reasons.push(`${o.repeaters} of ${o.households} came back for it`);
  if (byFeedback) reasons.push(`${f.good} of ${f.total} called it perfect`);
  return {
    favorite: true,
    both: byOrders && byFeedback,
    why: reasons.join(', '),
    orders: o.orders,
    households: o.households,
  };
}

// Every current favorite, strongest first. `both` means it cleared the bar on
// repeat orders AND on feedback, which is the strongest thing this can say.
export function customerFavorites(orders, dishFeedback, rules = FAVORITE_RULES) {
  const orderSig = dishOrderSignal(orders);
  const fbSig = dishFeedbackSignal(dishFeedback);
  const names = new Set([...Object.keys(orderSig), ...Object.keys(fbSig)]);
  const out = [];
  for (const name of names) {
    const st = favoriteStatus(name, orderSig, fbSig, rules);
    if (st.favorite) out.push({ name, ...st });
  }
  return out.sort((a, b) => (b.both === a.both ? (b.orders || 0) - (a.orders || 0) : (b.both ? 1 : -1)));
}
