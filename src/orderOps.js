// orderOps.js — everything that changes an order, a regular, or the add-on
// inventory. Order CRUD, the pending-order drain, bulk actions, archiving,
// regular CRUD, linking, merge/unmerge, and the backfill.
//
// WHY THESE LIVE TOGETHER
// They look like three subjects and behave like one. Accepting a pending order
// mints an order, decrements inventory, links a regular, back-fills that
// regular's address and phone, and clears the worker queue, in that order, and
// the order matters. Splitting orders from regulars would put half of that
// sequence in each file and hide the coupling rather than remove it.
//
// NO HOOKS HERE, same rule as backupRestore.js and bootHydrate.js. Each export
// takes its arguments plus a `deps` bag of setters and current values. App.jsx
// keeps one thin useCallback per operation with its original dependency array,
// so the hook count and hook order are exactly what they were before the split.
//
// A NOTE ON THE WRITE PATTERN
// `persist` below is the shape that appeared thirty-five times in App.jsx:
// save, then hand the result to setError. saveError(res) returns null on
// success, so the same call both raises the banner and clears it.
//
// As of Jul 2026 EVERY data write in this module goes through it. It used to be
// mixed — 46 of 81 writes app-wide were silent — and the reasoning for each
// silent one was locally sound: the worker holds pending orders, the order write
// already reported, and so on. Collectively it added up to an app that could
// lose a tick, a note, or a decrement without saying anything, which is the
// worst failure this thing can have. Kevin's call, and his reasoning was that
// early noise is a one-off cost: "we'll figure them out quickly, not see them
// much more if ever, and they will be past issues."

import { ensureProfileId } from './customerDevice.js';
import { stampItemVersions } from './recipeVersions.js';
import {
  ORDERS_KEY, REGULARS_KEY, INVENTORY_KEY, PENDING_KEY, HANDLED_PENDING_KEY,
  WORKER_BASE, PUBLISH_TOKEN,
} from './config.js';
import {
  uid, saveJSON, saveError, deletePhoto, orderTotal, stampItemCosts,
  normalizePendingItems, regularMatchType, regularAllNames,
  mergeRegulars, unmergeRegular, backfillRegularLinks, HOUSE_DISCOUNT_PERCENT,
} from './utils.js';

// Add-on items that draw down a physical stock count when an order is created.
// Was rebuilt on every render as a component-scope literal; it is a registry
// fact and nothing reads its identity, so module scope is its right home.
export const INVENTORY_ADDON_MAP = {
  'Queso': 'queso_0',
  'Chili Oil': 'chiliOil',
  'Chimichurri': 'chimichurri',
  'Romesco': 'romesco',
  'Chermoula': 'chermoula',
  'Miso Butter Sauce': 'misoButter',
  'Whipped Lemon Garlic Herb Butter': 'whippedButter',
};

const persist = (key, value, setError) => {
  saveJSON(key, value).then(res => setError(saveError(res)));
};

// ── Orders ──────────────────────────────────────────────────────────────────

export async function persistOrders(next, { setOrders, setError }) {
  setOrders(next);
  const res = await saveJSON(ORDERS_KEY, next);
  setError(saveError(res));
  return res;
}

export function saveOrder(order, deps) {
  const { regulars, setOrders, setInventory, setError, setFormMode } = deps;
  // Auto-house: a manual "New order" builds the order in OrderForm without a
  // regularId or house flag, so an order for the wife (a house regular) was
  // counted against metrics and Kevin had to enter the 100% by hand. If the
  // customer matches a house regular by link OR exact name, make it a proper
  // house order here (free, flagged, linked) so isHouseOrder excludes it
  // everywhere. Exact name only, since house means free. Idempotent.
  let o = order;
  const houseReg = (regulars || []).find(r => r.house && (o.regularId === r.id || regularMatchType(r, o.customer) === 'exact'));
  if (houseReg && (!o.house || o.total !== 0 || o.regularId !== houseReg.id)) {
    o = { ...o, house: true, regularId: houseReg.id, waiveSurcharge: true, discountType: 'percent', discountValue: HOUSE_DISCOUNT_PERCENT, total: 0 };
  }
  setOrders(prev => {
    const exists = (prev || []).some(x => x.id === o.id);
    const next = exists
      ? (prev || []).map(x => (x.id === o.id ? o : x))
      : [o, ...(prev || [])];
    persist(ORDERS_KEY, next, setError);
    if (!exists) {
      (o.items || []).forEach(it => {
        const invKey = INVENTORY_ADDON_MAP[it.name];
        if (invKey) {
          setInventory(inv => {
            const current = Number(inv[invKey]) || 0;
            const updated = { ...inv, [invKey]: Math.max(0, current - (it.qty || 1)) };
            persist(INVENTORY_KEY, updated, setError);
            return updated;
          });
        }
      });
    }
    return next;
  });
  setFormMode(null);
}

export function importOrders(parsedOrders, deps) {
  const { setOrders, setError, setShowCsv, setExportMsg } = deps;
  const newOrders = parsedOrders.map(p => {
    const items = p.items || [];
    const total = orderTotal(items, p.jarSwaps || 0, p.containerReturns || 0, null, 0, [], false);
    return {
      id: uid(),
      customer: p.customer,
      items,
      jarSwaps: p.jarSwaps || 0,
      containerReturns: p.containerReturns || 0,
      notes: p.notes || '',
      discountType: null,
      discountValue: 0,
      customCharges: [],
      waiveSurcharge: false,
      total,
      status: 'Ordered',
      paid: false,
      archived: false,
      createdAt: new Date().toISOString(),
    };
  });
  setOrders(prev => {
    const next = [...newOrders, ...(prev || [])];
    persist(ORDERS_KEY, next, setError);
    return next;
  });
  setShowCsv(false);
  setExportMsg(`Imported ${newOrders.length} order${newOrders.length !== 1 ? 's' : ''} from the sheet.`);
  setTimeout(() => setExportMsg(null), 4000);
}

// SERVED VERSION, per item, recorded the moment an order reaches Delivered.
//
// Applied by RESULT rather than by patch: any order that comes out of an update
// sitting in Delivered gets stamped, whichever path put it there. That covers
// the Mark Delivered button, the bulk action bar, a status change made through
// the details toggle, and anything added later — none of which have to remember
// to call this.
//
// Idempotent twice over. stampItemVersions never overwrites a field that is
// already set, and an order already Delivered has nothing left to fill, so
// re-tapping the button or bulk-marking an order that was already delivered
// cannot rewrite history.
function stampServed(order) {
  if (!order || order.status !== 'Delivered') return order;
  const items = stampItemVersions(order.items, 'servedRecipeVersionId');
  // Preserve object identity when nothing changed. React children compare by
  // reference, and handing back a fresh array on every unrelated status change
  // would re-render every order card in the list for no reason.
  const changed = items.some((it, i) => it !== (order.items || [])[i]);
  return changed ? { ...order, items } : order;
}

export function updateOrder(id, patch, { setOrders, setError }) {
  setOrders(prev => {
    const next = (prev || []).map(o => (o.id === id ? stampServed({ ...o, ...patch }) : o));
    persist(ORDERS_KEY, next, setError);
    return next;
  });
}

export function deleteOrder(id, { setOrders, setError }) {
  setOrders(prev => {
    const target = (prev || []).find(o => o.id === id);
    if (target) (target.items || []).forEach((it, i) => { if (it.hasPhoto) deletePhoto(id, i); });
    const next = (prev || []).filter(o => o.id !== id);
    persist(ORDERS_KEY, next, setError);
    return next;
  });
}

export function archiveDelivered({ orders, persistOrders: persistOrdersFn }) {
  return persistOrdersFn((orders || []).map(o =>
    o.status === 'Delivered' && !o.archived ? { ...o, archived: true } : o
  ));
}

// ONE state commit and ONE localStorage write for N orders, never N
// sequential updateOrder calls: N writes would be N chances to hit the
// quota guard halfway through, leaving some orders marked and some not
// with no record of where it stopped. Idempotent by construction — an
// order already in the target state is returned untouched, so a
// double-tap can never double-apply.
export function bulkUpdateOrders(ids, patch, { orders, persistOrders: persistOrdersFn }) {
  const idSet = ids instanceof Set ? ids : new Set(ids || []);
  if (idSet.size === 0) return;
  persistOrdersFn((orders || []).map(o => (idSet.has(o.id) ? stampServed({ ...o, ...patch }) : o)));
}

// ── The pending-order drain ─────────────────────────────────────────────────

export function acceptPending(pending, deps) {
  const {
    handledPendingRef, regulars, setOrders, setError, adjustInventory,
    linkOrderToRegular: linkFn, autoFillRegularContact: autoFillFn,
    setLinkPrompt, dismissPending: dismissFn, setShowPendingIdx,
  } = deps;
  // EC-1 idempotency guard: a double-tap on a slow phone fires acceptPending
  // twice before the card unmounts, and each call mints a fresh uid() order,
  // doubles the inventory decrement, and double-links the regular. Claim the
  // id synchronously up front so a repeat call bails. dismissPending marks it
  // again at the end, which is idempotent.
  if (!pending) return;
  const claimId = pending.pendingId;
  if (claimId) {
    if (handledPendingRef.current[claimId]) return;
    handledPendingRef.current[claimId] = Date.now();
  }
  const orderId = uid();

  let exactReg = null;
  const partialRegs = [];
  regulars.forEach(r => {
    const m = regularMatchType(r, pending.customer);
    if (m === 'exact') exactReg = r;
    else if (m === 'partial') partialRegs.push(r);
  });

  // A house regular (the wife) is free, full stop: the flag alone implies
  // 100% off, so there is no discount field to set and no way to half-apply
  // it. A normal regular's lifetime discount applies as before.
  const isHouse = !!(exactReg && exactReg.house);
  const discountType = isHouse ? 'percent' : (exactReg && exactReg.discountPercent > 0 ? 'percent' : null);
  const discountValue = isHouse ? HOUSE_DISCOUNT_PERCENT : (exactReg && exactReg.discountPercent > 0 ? exactReg.discountPercent : 0);

  // Normalize the customer-form item shape FIRST (per-lb proteins arrive with
  // the $/lb rate in price/cost and no weightPending — see normalizePendingItems),
  // then total and stamp. Order of operations matters: totaling before
  // normalizing counts a rate as a price; stamping before normalizing freezes
  // a rate as a cost basis.
  const normalizedItems = normalizePendingItems(pending.items);
  const total = orderTotal(normalizedItems, 0, 0, discountType, discountValue, [], isHouse);

  // Re-stamp cost bases from the app's own registry at acceptance — the
  // registry is authoritative over whatever the customer form submitted
  // (which can be stale, zero-coerced, or tampered). Items the registry
  // can't match keep any client value they carried.
  const stampedItems = stampItemCosts(normalizedItems, 'snapshot', { reStamp: true });

  // OFFERED VERSION, per item, recorded here because acceptance is the moment
  // it becomes true: the customer ordered against the recipe as it stood when
  // Kevin accepted, and he may refine a dish between now and Tuesday's cook.
  // Stamped AFTER normalizePendingItems and stampItemCosts, both of which
  // rebuild the item objects — stamping before either would have the versions
  // silently discarded by the next map.
  const versionedItems = stampItemVersions(stampedItems, 'offeredRecipeVersionId');

  const order = {
    id: orderId,
    customer: pending.customer,
    address: pending.address || '',
    phone: pending.phone || '',
    items: versionedItems,
    jarSwaps: 0,
    containerReturns: 0,
    notes: pending.notes || '',
    discountType,
    discountValue,
    customCharges: [],
    // EC-6: a house order (the wife) is free, full stop, so the $2 surcharge
    // is waived too. Leaving it false billed her $2 and fed $2 of phantom
    // revenue into books on every house order.
    waiveSurcharge: isHouse,
    total,
    status: 'Ordered',
    paid: false,
    archived: false,
    regularId: exactReg ? exactReg.id : null,
    // Copied from the regular at link time, not looked up later: books.js and
    // weekPlanner.js only ever see `orders`, never `regulars`.
    house: isHouse,
    createdAt: new Date().toISOString(),
  };
  setOrders(prev => {
    const next = [order, ...(prev || [])];
    persist(ORDERS_KEY, next, setError);
    return next;
  });

  (order.items || []).forEach(it => {
    const invKey = INVENTORY_ADDON_MAP[it.name];
    if (invKey) adjustInventory(invKey, -(it.qty || 1));
  });

  if (exactReg) {
    linkFn(exactReg.id, orderId);
    autoFillFn(exactReg, order);
  } else if (partialRegs.length > 0) {
    setLinkPrompt({ order, candidates: partialRegs });
  }

  dismissFn(pending.pendingId);
  setShowPendingIdx(null);
}

export function dismissPending(pendingId, deps) {
  const { setPendingOrders, handledPendingRef, setShowPendingIdx, setError } = deps;
  setPendingOrders(prev => {
    const next = prev.filter(p => p.pendingId !== pendingId);
    // The worker is the durable queue, so a failed write here costs a dedup
    // rather than an order — but "costs a dedup" still means the card comes
    // back on the next poll after Kevin already dealt with it, and he should
    // know why.
    persist(PENDING_KEY, next, setError);
    return next;
  });
  // This is where an order actually leaves the worker queue: Kevin accepted
  // it (acceptPending calls through here) or rejected it. Record the id as
  // handled so a re-poll can't resurrect it, then tell the worker to drop it.
  // The ledger is the durable guard; the network clear is best-effort on top,
  // so a failed clear degrades to a harmless dedup, never a lost order.
  if (pendingId) {
    const ledger = handledPendingRef.current || {};
    ledger[pendingId] = Date.now();
    const keys = Object.keys(ledger);
    if (keys.length > 800) {
      const trimmed = {};
      keys.slice(-400).forEach(k => { trimmed[k] = ledger[k]; });
      handledPendingRef.current = trimmed;
    } else {
      handledPendingRef.current = ledger;
    }
    // This ledger is the ONLY thing stopping a re-poll from resurrecting an
    // order Kevin already handled. Losing it silently is exactly the class of
    // failure that produces a duplicate order nobody can explain.
    persist(HANDLED_PENDING_KEY, handledPendingRef.current, setError);
    fetch(WORKER_BASE + '/pending/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [pendingId], token: PUBLISH_TOKEN }),
    }).catch(() => {});
  }
  setShowPendingIdx(null);
}

// ── Regulars ────────────────────────────────────────────────────────────────

export function persistRegulars(next, { setRegulars, setError }) {
  setRegulars(next);
  persist(REGULARS_KEY, next, setError);
}

export function addRegular(profile, { setRegulars, setError }) {
  const names = (Array.isArray(profile.names) ? profile.names : [profile.name])
    .map(n => String(n || '').trim())
    .filter(Boolean);
  const reg = {
    id: uid(),
    names,
    name: names[0] || '',
    address: profile.address || '',
    phone: profile.phone || '',
    dietary: profile.dietary || '',
    spice: profile.spice || '',
    discountPercent: Number(profile.discountPercent) || 0,
    notes: profile.notes || '',
    linkedOrderIds: profile.linkedOrderIds || [],
    lastInsightSig: '',
    createdAt: new Date().toISOString(),
  };
  setRegulars(prev => {
    const next = [...prev, reg];
    persist(REGULARS_KEY, next, setError);
    return next;
  });
  return reg.id;
}

export function updateRegular(id, patch, { setRegulars, setError }) {
  setRegulars(prev => {
    const next = prev.map(r => (r.id === id ? { ...r, ...patch } : r));
    persist(REGULARS_KEY, next, setError);
    return next;
  });
}

export function deleteRegular(id, { setRegulars, setError }) {
  setRegulars(prev => {
    const next = prev.filter(r => r.id !== id);
    persist(REGULARS_KEY, next, setError);
    return next;
  });
}

export function linkOrderToRegular(regularId, orderId, { setRegulars, setError, order = null, bindDevice = null }) {
  setRegulars(prev => {
    const next = prev.map(r => {
      if (r.id !== regularId) return r;
      const linkedOrderIds = r.linkedOrderIds.includes(orderId)
        ? r.linkedOrderIds
        : [...r.linkedOrderIds, orderId];

      // ── Device enrollment ──────────────────────────────────────────────
      // THIS is the moment a browser becomes a known customer, and it is the
      // right one: Kevin has just decided that this order belongs to this
      // person. Nothing before that decision is trustworthy — an order form
      // can be filled in with anyone's name.
      //
      // The device hash arrives on the order (worker /submit hashed it). The
      // profile id is minted once per regular and reused forever after.
      const enriched = { ...r, linkedOrderIds };
      const hash = order && order.deviceHash;
      if (hash) {
        enriched.customerProfileId = enriched.customerProfileId || ensureProfileId(enriched);
        const known = Array.isArray(enriched.deviceHashes) ? enriched.deviceHashes : [];
        if (!known.includes(hash)) enriched.deviceHashes = [...known, hash];
        // Fire-and-forget to the worker. A failed bind must not fail the link:
        // the order is still correct, the customer just is not recognised yet,
        // and the next order re-attempts it.
        if (typeof bindDevice === 'function') {
          bindDevice(hash, enriched.customerProfileId, order.deviceLabel || 'Device');
        }
      }
      return enriched;
    });
    persist(REGULARS_KEY, next, setError);
    return next;
  });
}

export function unlinkOrderFromRegular(regularId, orderId, { setRegulars, setError }) {
  setRegulars(prev => {
    const next = prev.map(r =>
      r.id === regularId
        ? { ...r, linkedOrderIds: r.linkedOrderIds.filter(oid => oid !== orderId) }
        : r
    );
    persist(REGULARS_KEY, next, setError);
    return next;
  });
}

// Called after linking an order to a regular. If the regular has no address
// or phone and the order does, fills in the blank fields and shows a banner.
export function autoFillRegularContact(reg, order, deps) {
  const { updateRegular: updateFn, setExportMsg } = deps;
  const infoPatch = {};
  if (!reg.address && order.address) infoPatch.address = order.address;
  if (!reg.phone && order.phone) infoPatch.phone = order.phone;
  if (Object.keys(infoPatch).length > 0) {
    updateFn(reg.id, infoPatch);
    const fields = [infoPatch.address && 'address', infoPatch.phone && 'phone']
      .filter(Boolean).join(' and ');
    const name = (reg.names && reg.names[0]) || reg.name || 'Regular';
    setExportMsg(`${name}'s ${fields} saved to Regulars.`);
    setTimeout(() => setExportMsg(null), 4000);
  }
}

export function makeRegularFromOrder(order, deps) {
  const { addRegular: addFn, updateOrder: updateFn } = deps;
  const id = addFn({
    names: [order.customer || ''],
    address: order.address || '',
    phone: order.phone || '',
    linkedOrderIds: [order.id],
  });
  updateFn(order.id, { regularId: id });
}

// Link an order to an EXISTING regular from the star's near-miss chooser.
// The order's name becomes an alias on the regular (non-destructive merge
// mechanism) so all past and future orders under that name match too.
export function linkOrderWithAlias(regularId, order, deps) {
  const { setRegulars, setError, updateOrder: updateFn } = deps;
  setRegulars(prev => {
    const next = prev.map(r => {
      if (r.id !== regularId) return r;
      const has = regularAllNames(r).some(n => n.toLowerCase() === String(order.customer || '').toLowerCase());
      return {
        ...r,
        aliases: has ? (r.aliases || []) : [...(r.aliases || []), order.customer],
        linkedOrderIds: r.linkedOrderIds.includes(order.id) ? r.linkedOrderIds : [...r.linkedOrderIds, order.id],
      };
    });
    persist(REGULARS_KEY, next, setError);
    return next;
  });
  updateFn(order.id, { regularId });
}

// Resolve a backfill near-miss inline: link an order (by id, archived or
// not) to the chosen regular, reusing the alias-merge mechanism so the
// order's name is remembered on that regular going forward.
export function linkSuggestionToRegular(orderId, regularId, deps) {
  const { orders, linkOrderWithAlias: linkFn } = deps;
  const order = (orders || []).find(o => o.id === orderId);
  if (order) linkFn(regularId, order);
}

// ── Merge / unmerge (non-destructive, reversible) ───────────────────────────

export function doMergeRegulars(targetId, sourceId, { setRegulars, setOrders, setError }) {
  setRegulars(prev => {
    const { regulars: next, relinkOrderIds } = mergeRegulars(prev, targetId, sourceId);
    if (relinkOrderIds.length) {
      setOrders(po => {
        const on = (po || []).map(o => (relinkOrderIds.includes(o.id) ? { ...o, regularId: targetId } : o));
        persist(ORDERS_KEY, on, setError);
        return on;
      });
    }
    persist(REGULARS_KEY, next, setError);
    return next;
  });
}

export function doUnmergeRegular(targetId, snapshotId, { setRegulars, setError }) {
  setRegulars(prev => {
    const next = unmergeRegular(prev, targetId, snapshotId);
    persist(REGULARS_KEY, next, setError);
    return next;
  });
}

// Backfill pre-regulars orders. Exact and alias matches link automatically;
// partials come back as suggestions and are never auto-linked, which is what
// makes this safe to run unattended at startup.
export function runBackfill({ regulars, orders, setOrders, setRegulars, setError }) {
  const { auto, suggestions } = backfillRegularLinks(regulars, orders || []);
  if (auto.length) {
    setOrders(po => {
      const byId = new Map(auto.map(a => [a.orderId, a.regularId]));
      const on = (po || []).map(o => (byId.has(o.id) ? { ...o, regularId: byId.get(o.id) } : o));
      persist(ORDERS_KEY, on, setError);
      return on;
    });
    setRegulars(prev => {
      const next = prev.map(r => {
        const mine = auto.filter(a => a.regularId === r.id).map(a => a.orderId);
        if (!mine.length) return r;
        return { ...r, linkedOrderIds: [...new Set([...(r.linkedOrderIds || []), ...mine])] };
      });
      persist(REGULARS_KEY, next, setError);
      return next;
    });
  }
  return { autoCount: auto.length, suggestions };
}

// ── Add-on inventory ────────────────────────────────────────────────────────

export function adjustInventory(key, delta, { setInventory, setError }) {
  setInventory(prev => {
    const current = Number(prev[key]) || 0;
    const next = { ...prev, [key]: Math.max(0, current + delta) };
    persist(INVENTORY_KEY, next, setError);
    return next;
  });
}

export function setInventoryCount(key, value, { setInventory, setError }) {
  setInventory(prev => {
    const next = { ...prev, [key]: Math.max(0, Number(value) || 0) };
    persist(INVENTORY_KEY, next, setError);
    return next;
  });
}
