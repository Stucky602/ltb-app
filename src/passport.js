// ─── Dish passport ───────────────────────────────────────────────────────────
// A record of what someone has actually eaten here, grouped by cuisine so it
// reads like travel rather than a punch card. Deliberately NOT a loyalty
// scheme: no points, no streaks, no ranking against anyone else. It reflects
// something true back to a person and asks nothing of them.
//
// Rules Kevin set, all load-bearing:
//   - Dinners and desserts stamp. Bagged proteins, add-ons, and sauces do not
//     (a pound of filet is an ingredient, not a dish, and 17 bag items would
//     drown the book).
//   - Variants do not matter. Bo Ssam Small and Bo Ssam Large are one stamp.
//   - Retired dishes are ignored. A stamp only exists for something currently
//     on the full menu, so the denominator never drifts.
//   - Regulars only. A one-off customer has no history worth a passport.
import { DISHES } from './dishes.js';
import { ALWAYS_MENU } from './menu.js';
import { DISH_RENAMES } from './utils.js';

// Desserts have no cuisine of their own and do not want one; they get their
// own chapter at the back of the book.
export const SWEETS_LABEL = 'Sweets';

// Everything that was never a "dish" and so can never be a retired one either:
// bagged proteins, add-ons, sauces, breakfast, fruit. Built from the same menu
// data the stampable set uses, so it cannot drift.
const NON_DISH = new Set([
  ...(ALWAYS_MENU.bag || []),
  ...(ALWAYS_MENU.addons || []),
  ...(ALWAYS_MENU.sauces || []),
  ...(ALWAYS_MENU.breakfast || []),
  ...(ALWAYS_MENU.fruit || []),
].map(d => d.name));

// "Spotlight" is a menu TIER, not a cuisine: those five dishes (Steak au
// Poivre, Boeuf Bourguignon, the rib chop, and friends) are the big-ticket
// centerpieces. Reassigning their cuisine in the registry is Kevin's call, not
// something to guess at here, so the book gives them an honest chapter name
// instead of pretending "Spotlight" is a place.
const PAGE_LABELS = { Spotlight: 'The Big Ones', Other: 'Everything Else' };
export function pageLabel(cuisine) { return PAGE_LABELS[cuisine] || cuisine; }

// The full stampable set, in book order: cuisines alphabetically, sweets last.
export function stampableDishes() {
  const out = [];
  for (const d of DISHES) {
    out.push({ name: d.name, cuisine: d.cuisine || 'Other' });
  }
  for (const d of (ALWAYS_MENU.desserts || [])) {
    out.push({ name: d.name, cuisine: SWEETS_LABEL });
  }
  return out;
}

function pageOrder(a, b) {
  // Sweets always sits last; everything else is alphabetical.
  if (a === SWEETS_LABEL) return 1;
  if (b === SWEETS_LABEL) return -1;
  return a.localeCompare(b);
}

// Every order belonging to this regular, matched the same way the rest of the
// app does it (id first, then name, since older orders predate linking).
export function ordersForRegular(reg, allOrders) {
  if (!reg) return [];
  const name = String(reg.name || '').toLowerCase();
  return (allOrders || []).filter(o =>
    (o.regularId && o.regularId === reg.id)
    || (name && String(o.customer || '').toLowerCase() === name));
}

// Two ways a real meal can fail to stamp itself, both handled here:
//   1. The dish was renamed. DISH_RENAMES already maps old names to current
//      ones for the rest of the app; the passport now applies it too, so an
//      order placed under the old name still lands on the right stamp.
//   2. Kevin knows something the order history does not. Food handed over in
//      person, an order placed before the app existed, a name change that
//      predates DISH_RENAMES. `reg.passportGrants` is a plain list of dish
//      names he has granted by hand, and `reg.passportRevokes` takes one back.
function canonicalName(name) {
  let n = String(name || '');
  // Renames can chain, but the map is tiny and acyclic; cap it anyway.
  for (let i = 0; i < 5 && DISH_RENAMES[n]; i++) n = DISH_RENAMES[n];
  return n;
}

// `currentOrder` is the delivery this page belongs to. Anything stamped by it
// that they had never had before is the "new this delivery" moment, which is
// the whole reason to open the book again.
export function buildPassport(reg, allOrders, currentOrder) {
  if (!reg) return null;

  const mine = ordersForRegular(reg, allOrders);
  const everyone = allOrders || [];
  const stampable = stampableDishes();
  const stampableNames = new Set(stampable.map(s => s.name));

  // What they had BEFORE this delivery, so the new stamps can be identified.
  // Also the date each dish was FIRST had: a stamp without a date is just a
  // label, and the date is what makes the book feel like a record.
  const before = new Set();
  const ever = new Set();
  const firstHad = {};
  const curId = currentOrder && currentOrder.id;
  for (const o of mine) {
    const when = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    for (const it of (o.items || [])) {
      const name = canonicalName(it.name);
      if (!name || !stampableNames.has(name)) continue; // retired/bag/addon: no stamp
      ever.add(name);
      if (when && (!firstHad[name] || when < firstHad[name])) firstHad[name] = when;
      if (!curId || o.id !== curId) before.add(name);
    }
  }

  // How many times they have had each dish, for the stamp detail view.
  const timesHad = {};
  for (const o of mine) {
    for (const it of (o.items || [])) {
      const name = canonicalName(it.name);
      if (!stampableNames.has(name)) continue;
      timesHad[name] = (timesHad[name] || 0) + (Number(it.qty) || 1);
    }
  }

  // First-ever, computed across ALL orders.
  //
  // NOTE: a "rare dish" badge used to live here too and was REMOVED on purpose.
  // Order history was backfilled when the app was built, so a dish's eater
  // count measures what got typed in, not what people actually ate. A badge
  // resting on that is decoration over a wrong number. Do not re-add it unless
  // the history it depends on becomes trustworthy.
  const firstEverBy = {};   // dish -> earliest order timestamp anyone had it
  for (const o of everyone) {
    if (o.house) continue;
    const when = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    const who = o.regularId || String(o.customer || '').toLowerCase();
    for (const it of (o.items || [])) {
      const name = canonicalName(it.name);
      if (!stampableNames.has(name)) continue;
      if (when && (!firstEverBy[name] || when < firstEverBy[name].when)) firstEverBy[name] = { when, who };
    }
  }
  const meId = reg.id || String(reg.name || '').toLowerCase();

  // Retired dishes: things they genuinely ate that are no longer on the menu.
  // Until now these vanished from the book entirely, which quietly pretended a
  // real meal never happened. They get a memorial chapter instead: earned, but
  // never counted against the 30, since the denominator has to stay stable.
  // Bag items, add-ons, and sauces are excluded the same way they always are.
  const retired = {};
  for (const o of mine) {
    const when = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    for (const it of (o.items || [])) {
      const name = canonicalName(it.name);
      if (!name || stampableNames.has(name)) continue;
      if (it.omakase) continue;              // omakase earns a visa, not a stamp
      if (NON_DISH.has(name)) continue;      // never a dish in the first place
      if (!retired[name]) retired[name] = { name, times: 0, firstHad: null };
      retired[name].times += (Number(it.qty) || 1);
      if (when && (!retired[name].firstHad || when < retired[name].firstHad)) retired[name].firstHad = when;
    }
  }

  // Manual grants: Kevin's memory is a legitimate source. A granted dish is
  // never "new this delivery" (it was earned some time ago, not tonight), and
  // it carries no date unless the history happens to supply one.
  for (const raw of (reg.passportGrants || [])) {
    const name = canonicalName(raw);
    if (!stampableNames.has(name)) continue;
    ever.add(name);
    before.add(name);
  }
  // Revokes win over everything, so a mistaken grant is fully undoable.
  for (const raw of (reg.passportRevokes || [])) {
    const name = canonicalName(raw);
    ever.delete(name);
    before.delete(name);
    delete firstHad[name];
  }

  const pagesMap = new Map();
  for (const s of stampable) {
    if (!pagesMap.has(s.cuisine)) pagesMap.set(s.cuisine, []);
    pagesMap.get(s.cuisine).push({
      name: s.name,
      stamped: ever.has(s.name),
      isNew: ever.has(s.name) && !before.has(s.name),
      firstHad: firstHad[s.name] || null,
      granted: (reg.passportGrants || []).some(g => canonicalName(g) === s.name) && !firstHad[s.name],
      times: timesHad[s.name] || 0,
      firstEver: !!(firstEverBy[s.name] && firstEverBy[s.name].who === meId && ever.has(s.name)),
      requested: ever.has(s.name) && (reg.passportRequests || []).some(r => canonicalName(r) === s.name),
    });
  }

  const pages = [...pagesMap.entries()]
    .sort((a, b) => pageOrder(a[0], b[0]))
    .map(([cuisine, dishes]) => {
      const got = dishes.filter(d => d.stamped).length;
      return {
        cuisine,
        label: pageLabel(cuisine),
        dishes: dishes.sort((a, b) => a.name.localeCompare(b.name)),
        stamped: got,
        total: dishes.length,
        complete: got === dishes.length,
      };
    });

  const newStamps = [];
  for (const p of pages) for (const d of p.dishes) if (d.isNew) newStamps.push(d.name);

  // Omakase earns a VISA, not a stamp: it is not a dish, it is a act of trust,
  // and it deserves its own page rather than being folded into a cuisine.
  const visas = [];
  for (const o of mine) {
    for (const it of (o.items || [])) {
      if (!it.omakase) continue;
      visas.push({
        date: o.createdAt || null,
        size: it.variant || '',
        budget: it.budgetMax != null ? it.budgetMax : (it.price || 0),
        isNew: !!(curId && o.id === curId),
      });
    }
  }
  visas.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // Issued: the date of their first order with LTB, which is the quiet way of
  // saying "you have been here a while."
  let issued = null;
  for (const o of mine) {
    const w = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    if (w && (!issued || w < issued)) issued = w;
  }

  // A cuisine they had never touched before this delivery.
  const newCuisines = [];
  for (const p of pages) {
    const newHere = p.dishes.filter(d => d.isNew);
    if (!newHere.length) continue;
    const hadBefore = p.dishes.some(d => d.stamped && !d.isNew);
    if (!hadBefore) newCuisines.push(p.label);
  }

  return {
    tried: ever.size,
    total: stampable.length,
    cuisinesVisited: pages.filter(p => p.stamped > 0).length,
    cuisinesTotal: pages.length,
    pages,
    newStamps,
    newCuisines,
    visas,
    retired: Object.values(retired).sort((a, b) => (b.firstHad || 0) - (a.firstHad || 0)),
    issued,
    chaptersComplete: pages.filter(p => p.complete).length,
    complete: ever.size === stampable.length,
  };
}
