// voiceCommands.js — #17 hands-free kitchen commands (engine, pure)
// Deterministic tier ONLY: pattern-matched commands cost zero tokens and
// cover the wet-hands 90% (status flips, counts, archive). Anything the
// patterns can't parse returns { kind: 'unparsed' } with the transcript so
// the UI can say "didn't catch that" honestly. A Claude fallback tier is the
// documented upgrade path, deliberately NOT wired in v1.
import { nameMatchType, normName } from './utils.js';
import { DISHES, ALL_ALWAYS_ITEMS } from './dishes.js';

const ALL_ITEM_NAMES = [...DISHES.map(d => d.name), ...ALL_ALWAYS_ITEMS.map(i => i.name)];

const WORD_NUMS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1 };
const num = (w) => WORD_NUMS[w] != null ? WORD_NUMS[w] : (parseInt(w, 10) || null);

// Fuzzy item match: normName containment both ways, longest name wins so
// "pork chop" prefers Thick-Cut Pork Chop over Pork Tenderloin.
export function matchItemName(spoken) {
  const s = normName(spoken);
  if (!s) return null;
  const hits = ALL_ITEM_NAMES.filter(n => {
    const nn = normName(n);
    return nn.includes(s) || s.includes(nn);
  }).sort((a, b) => b.length - a.length);
  return hits[0] || null;
}

// Find the active (non-archived) order whose customer matches the spoken name.
export function matchOrder(orders, spokenName) {
  const active = (orders || []).filter(o => !o.archived);
  const exact = active.filter(o => nameMatchType(o.customer || '', spokenName) === 'exact');
  const partial = active.filter(o => nameMatchType(o.customer || '', spokenName) === 'partial');
  // Voice safety: a wrong-person action is worse than a re-ask. Even a clean
  // exact match is treated as ambiguous when OTHER orders also plausibly
  // answer to the name ("Sara" when Sara AND Sara Miller both have orders).
  if (exact.length === 1 && partial.length === 0) return { order: exact[0] };
  if (exact.length + partial.length > 1) return { ambiguous: [...exact, ...partial] };
  if (exact.length === 1) return { ambiguous: [...exact, ...partial] };
  if (partial.length === 1) return { order: partial[0] };
  return {};
}

// parseVoiceCommand(transcript, orders) → typed action or { kind: 'unparsed' }
export function parseVoiceCommand(transcript, orders) {
  const t = String(transcript || '').toLowerCase().replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return { kind: 'unparsed', transcript };

  // "archive delivered" / "archive the delivered orders"
  if (/^archive( the)?( all)? delivered( orders)?$/.test(t)) {
    return { kind: 'archiveDelivered' };
  }

  // "mark <name> (as) delivered|paid|cooking|packed" — status words map to app statuses
  let m = t.match(/^mark (.+?) (?:as )?(delivered|paid|cooking|ready|ordered)$/); // real STATUSES only: Ordered/Cooking/Ready/Delivered (+paid flag)
  if (m) {
    const who = matchOrder(orders, m[1]);
    if (who.ambiguous) return { kind: 'ambiguous', names: who.ambiguous.map(o => o.customer), transcript };
    if (!who.order) return { kind: 'noMatch', name: m[1], transcript };
    if (m[2] === 'paid') return { kind: 'update', orderId: who.order.id, customer: who.order.customer, patch: { paid: true }, say: `${who.order.customer} marked paid` };
    const status = m[2][0].toUpperCase() + m[2].slice(1);
    return { kind: 'update', orderId: who.order.id, customer: who.order.customer, patch: { status }, say: `${who.order.customer} marked ${m[2]}` };
  }

  // "how many <item>( bags| orders)?( left| total)?" — unit count across active orders
  m = t.match(/^how (?:many|much) (.+?)(?: bags?| orders?| units?)?(?: left| total| do i have)?$/);
  if (m) {
    const item = matchItemName(m[1]);
    if (!item) return { kind: 'noMatch', name: m[1], transcript };
    let units = 0, ordersWith = 0;
    for (const o of (orders || [])) {
      if (o.archived || o.status === 'Delivered') continue;
      let mine = 0;
      for (const it of (o.items || [])) if (it.name === item) mine += Number(it.qty) || 1;
      if (mine > 0) { units += mine; ordersWith++; }
    }
    return { kind: 'count', item, units, ordersWith, say: `${units} ${item} across ${ordersWith} active order${ordersWith !== 1 ? 's' : ''}` };
  }

  // "add <qty>? <item> to <name>('s)( order)?"
  m = t.match(/^add (?:(\w+) )?(.+?) to (.+?)(?:'s)?(?: order)?$/);
  if (m) {
    const qty = m[1] ? num(m[1]) : 1;
    const itemSpoken = qty === null && m[1] ? `${m[1]} ${m[2]}` : m[2];
    const item = matchItemName(itemSpoken);
    if (!item) return { kind: 'noMatch', name: itemSpoken, transcript };
    const who = matchOrder(orders, m[3]);
    if (who.ambiguous) return { kind: 'ambiguous', names: who.ambiguous.map(o => o.customer), transcript };
    if (!who.order) return { kind: 'noMatch', name: m[3], transcript };
    return { kind: 'addItem', orderId: who.order.id, customer: who.order.customer, item, qty: qty || 1, say: `Add ${qty || 1} ${item} to ${who.order.customer}` };
  }

  return { kind: 'unparsed', transcript };
}
