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

// Desserts have no cuisine of their own and do not want one; they get their
// own chapter at the back of the book.
export const SWEETS_LABEL = 'Sweets';

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

// `currentOrder` is the delivery this page belongs to. Anything stamped by it
// that they had never had before is the "new this delivery" moment, which is
// the whole reason to open the book again.
export function buildPassport(reg, allOrders, currentOrder) {
  if (!reg) return null;

  const mine = ordersForRegular(reg, allOrders);
  const stampable = stampableDishes();
  const stampableNames = new Set(stampable.map(s => s.name));

  // What they had BEFORE this delivery, so the new stamps can be identified.
  const before = new Set();
  const ever = new Set();
  const curId = currentOrder && currentOrder.id;
  for (const o of mine) {
    for (const it of (o.items || [])) {
      if (!it.name || !stampableNames.has(it.name)) continue; // retired/bag/addon: no stamp
      ever.add(it.name);
      if (!curId || o.id !== curId) before.add(it.name);
    }
  }

  const pagesMap = new Map();
  for (const s of stampable) {
    if (!pagesMap.has(s.cuisine)) pagesMap.set(s.cuisine, []);
    pagesMap.get(s.cuisine).push({
      name: s.name,
      stamped: ever.has(s.name),
      isNew: ever.has(s.name) && !before.has(s.name),
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

  return {
    tried: ever.size,
    total: stampable.length,
    cuisinesVisited: pages.filter(p => p.stamped > 0).length,
    cuisinesTotal: pages.length,
    pages,
    newStamps,
    complete: ever.size === stampable.length,
  };
}
