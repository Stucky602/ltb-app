// All pure-JS helpers: uid/currency/formatting, name matching, regulars helpers, insights,
// pricing math, localStorage wrapper, photo storage, and the AI order-parsing API client.
import { FULL_MENU, ALL_DINNERS, PER_LB_ITEMS, isPerLbItem } from './menu.js';
import { SURCHARGE, WORKER_BASE } from './config.js';
import { DISHES } from './dishes.js';

export const uid = () => Math.random().toString(36).slice(2, 10);
export const currency = (n) => `$${(Number(n) || 0).toFixed(2)}`;
export const round2 = (n) => Math.round(n * 100) / 100;

// Converts a base64url VAPID public key to the Uint8Array the PushManager expects.
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// ─── Regulars: cuisine map + name matching + insight generation ─────────────
// Maps each dish to a loose cuisine bucket so insights can spot patterns like
// "tends to favor Chinese dishes". A dish missing here is bucketed "Other".
export const DISH_CUISINE = {};
DISHES.forEach(d => { if (d.cuisine) DISH_CUISINE[d.name] = d.cuisine; });
export const dishCuisine = (name) => DISH_CUISINE[name] || 'Other';

// Normalize a name for comparison: lowercase, trim, collapse spaces.
export const normName = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');

// Returns 'exact' if two names match fully, 'partial' if they share a first
// name (or one contains the other), or null if no meaningful match.
export function nameMatchType(a, b) {
  const na = normName(a), nb = normName(b);
  if (!na || !nb) return null;
  if (na === nb) return 'exact';
  const fa = na.split(' ')[0], fb = nb.split(' ')[0];
  if (fa && fa === fb) return 'partial';
  if (na.includes(nb) || nb.includes(na)) return 'partial';
  return null;
}

// Get a regular's list of names. Supports both the new `names` array and the
// older single `name` field (for profiles saved before couples were added).
export function regularNames(reg) {
  if (!reg) return [];
  if (Array.isArray(reg.names) && reg.names.length) {
    return reg.names.map(n => String(n || '').trim()).filter(Boolean);
  }
  return reg.name ? [String(reg.name).trim()] : [];
}

// A regular's display name: joins multiple names with "&" (e.g. "Sarah & Mike").
export function regularDisplayName(reg) {
  const names = regularNames(reg);
  if (names.length === 0) return '(unnamed)';
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
}

// Best match type between an incoming customer name and ANY of a regular's
// names. Returns 'exact' if any name matches exactly, else 'partial' if any
// partially matches, else null. This is what lets either person in a couple
// auto-link to the same shared profile.
export function regularMatchType(reg, customerName) {
  let best = null;
  for (const nm of regularNames(reg)) {
    const m = nameMatchType(nm, customerName);
    if (m === 'exact') return 'exact';
    if (m === 'partial') best = 'partial';
  }
  return best;
}

// Build auto-insights from a regular's linked order history.
// Only surfaces patterns once there are MIN_ORDERS_FOR_INSIGHT orders, and is
// menu-availability-aware: it weighs "ordered X of the N times it was offered"
// rather than raw counts, so occasional dishes aren't unfairly buried.
export const MIN_ORDERS_FOR_INSIGHT = 5;
export function buildInsights(linkedOrders) {
  const orders = (linkedOrders || []).filter(o => o && Array.isArray(o.items));
  if (orders.length < MIN_ORDERS_FOR_INSIGHT) return [];

  const insights = [];
  const cuisineCount = {};
  const dishCount = {};
  let totalDishLines = 0;

  orders.forEach(o => {
    o.items.forEach(it => {
      // Only count actual dinner dishes for cuisine/dish patterns, not add-ons
      if (!ALL_DINNERS.some(d => d.name === it.name)) return;
      const c = dishCuisine(it.name);
      cuisineCount[c] = (cuisineCount[c] || 0) + 1;
      dishCount[it.name] = (dishCount[it.name] || 0) + 1;
      totalDishLines += 1;
    });
  });

  // Cuisine lean: if one cuisine is >= 50% of dish lines and appears 3+ times
  if (totalDishLines >= 4) {
    const sorted = Object.entries(cuisineCount).sort((a, b) => b[1] - a[1]);
    if (sorted.length && sorted[0][1] >= 3 && sorted[0][1] / totalDishLines >= 0.5 && sorted[0][0] !== 'Other') {
      insights.push(`Tends to favor ${sorted[0][0]} dishes (${sorted[0][1]} of ${totalDishLines} dinner orders).`);
    }
  }

  // Repeat-dish favorite: any single dish ordered 3+ times
  const favDish = Object.entries(dishCount).sort((a, b) => b[1] - a[1])[0];
  if (favDish && favDish[1] >= 3) {
    insights.push(`Repeat favorite: ${favDish[0]} (ordered ${favDish[1]} times).`);
  }

  // Spice preference from order/item notes
  const spiceNotes = [];
  orders.forEach(o => {
    const blob = ((o.notes || '') + ' ' + (o.items || []).map(it => it.note || '').join(' ')).toLowerCase();
    const m = blob.match(/spice\s*(?:level\s*)?(\d)/);
    if (m) spiceNotes.push(parseInt(m[1], 10));
  });
  if (spiceNotes.length >= 3) {
    const avg = spiceNotes.reduce((a, b) => a + b, 0) / spiceNotes.length;
    if (Math.max(...spiceNotes) - Math.min(...spiceNotes) <= 1) {
      insights.push(`Consistent spice preference around level ${Math.round(avg)}.`);
    }
  }

  // Add-on habit: someone who orders queso / chili oil / sauces often
  const addonCount = {};
  orders.forEach(o => {
    o.items.forEach(it => {
      if (ALL_DINNERS.some(d => d.name === it.name)) return;
      addonCount[it.name] = (addonCount[it.name] || 0) + 1;
    });
  });
  const favAddon = Object.entries(addonCount).sort((a, b) => b[1] - a[1])[0];
  if (favAddon && favAddon[1] >= 3) {
    insights.push(`Regularly adds ${favAddon[0]} (${favAddon[1]} orders).`);
  }

  return insights;
}

// Format an insight line with a datestamp marker for the notes field.
export function insightStamp(text) {
  const d = new Date();
  const mo = d.toLocaleDateString(undefined, { month: 'short' });
  return `[Auto-insight \u00b7 ${mo} ${d.getDate()}] ${text}`;
}

// Lazy-load html2canvas from CDN the first time the user shares an invoice.
// Cached on window after first load so subsequent shares are instant.
let _html2canvasPromise = null;
export function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (_html2canvasPromise) return _html2canvasPromise;
  _html2canvasPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = () => resolve(window.html2canvas || null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return _html2canvasPromise;
}


export function discountAmount(itemsTotal, discountType, discountValue) {
  if (!discountType || !discountValue) return 0;
  if (discountType === 'percent') return round2(itemsTotal * (discountValue / 100));
  return round2(Math.min(discountValue, itemsTotal));
}

// Sum of per-item upcharges (each item may carry one {label, amount})
export function itemsUpchargeTotal(items) {
  return round2((items || []).reduce((sum, it) => {
    const amt = it.upcharge && typeof it.upcharge.amount === 'number' ? it.upcharge.amount : 0;
    return sum + amt * it.qty;
  }, 0));
}

// Sum of order-level custom charges (each {label, amount})
export function customChargesTotal(customCharges) {
  return round2((customCharges || []).reduce((sum, ch) => sum + (Number(ch.amount) || 0), 0));
}

// Base price of items only (before upcharges) — discount applies to this
export function itemsBaseTotal(items) {
  return round2((items || []).reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0));
}

export function orderTotal(items, jarSwaps, containerReturns, discountType, discountValue, customCharges, waiveSurcharge) {
  const base = itemsBaseTotal(items);
  const upcharges = itemsUpchargeTotal(items);
  const custom = customChargesTotal(customCharges);
  const disc = discountAmount(base, discountType, discountValue);
  const surcharge = waiveSurcharge ? 0 : SURCHARGE;
  return round2(base + upcharges - disc + custom + surcharge - (jarSwaps || 0) * 2 - (containerReturns || 0) * 1);
}

// Recompute a per-lb item's price and cost from its weight (rounded to cents).
// Refuses to price an item that has never been weighed: the old behavior
// defaulted to 1 lb, which meant the "reprice all" button silently fabricated
// a weight for any still-pending protein, cleared weightPending, and (post
// cost-basis) froze the fabricated number as a permanent snapshot.
export function repricePerLbItem(it) {
  const info = PER_LB_ITEMS[it.name];
  if (!info) return it;
  if (!(typeof it.weight === 'number' && it.weight > 0)) return it; // not weighed yet
  const lbs = it.weight;
  const BAG = 1.5; // per-bag surcharge baked into each protein bag
  return {
    ...it,
    weightPending: false,
    price: round2(info.pricePerLb * lbs + BAG),
    cost: round2(info.costPerLb * lbs),
    costSource: 'snapshot',
  };
}

// ─── Cost-basis snapshots ────────────────────────────────────────────────────
// The economics foundation: every order item should carry `cost` (its per-unit
// cost basis, frozen at order time) and `costSource`:
//   'snapshot'   — stamped from the then-current registry when the order was
//                  created/accepted/weighed. The truthful historical basis.
//   'backfilled' — stamped later (migration) with the registry anchor of THAT
//                  moment, because the item predates stamping. Honest estimate,
//                  flagged so analytics can mark it.
// Without a stamp, cost falls back to the CURRENT registry anchor, which shifts
// every time a dish is re-anchored/repriced — fine as a last resort, useless
// for longitudinal analysis. That fallback is also rename-fragile, hence the
// alias maps below.

// Dishes/variants renamed after orders referencing them may already exist.
// Maps OLD stored name → CURRENT registry name so unstamped historical items
// can still be costed and backfilled. Append here on any future rename.
export const DISH_RENAMES = {
  'Cumin Mushroom Noodles / Cumin Beef on Rice': 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice',
};
export const VARIANT_RENAMES = {
  'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice': {
    'Small (~3-4)': 'Mushroom, Small (~3-4)',
    'Large (~6-8)': 'Mushroom, Large (~6-8)',
    'Small (~3-4) + Asian Greens (1/2 lb)': 'Mushroom, Small (~3-4) + Asian Greens (1/2 lb)',
    'Large (~6-8) + Asian Greens (1 lb)': 'Mushroom, Large (~6-8) + Asian Greens (1 lb)',
  },
  'Boeuf Bourguignon (Beef Stew)': {
    '~6 servings': '~4 servings',
    'With 1 lb mushrooms (~6 servings)': 'With 1 lb mushrooms',
  },
};

// Find the current registry variant for an item, surviving dish/variant
// renames and a missing category (customer-submitted items carry none).
export function menuVariantFor(name, variantLabel, category) {
  const canonName = DISH_RENAMES[name] || name;
  const vmap = VARIANT_RENAMES[canonName] || {};
  const canonVariant = (vmap[variantLabel] || variantLabel) ?? '';
  const pools = category && FULL_MENU[category]
    ? [FULL_MENU[category]]
    : Object.values(FULL_MENU);
  for (const pool of pools) {
    const mi = (pool || []).find(m => m.name === canonName);
    if (!mi) continue;
    const v = (mi.variants || []).find(x => x.label === canonVariant);
    if (v) return v;
  }
  return null;
}

// True when the item carries a usable frozen cost basis. cost === 0 only
// counts for weight-pending per-lb items (deliberate placeholder until
// weighing); anywhere else a 0 is a degenerate value (e.g. form.html's
// `v.cost || 0`) that must NOT freeze as "this cost nothing".
function hasCostBasis(it) {
  if (typeof it.cost !== 'number') return false;
  if (it.cost > 0) return true;
  return !!it.weightPending;
}

// Stamp cost bases onto items that lack one, from the current registry.
// `source` labels how the stamp happened ('snapshot' at creation/acceptance,
// 'backfilled' for later migration). Idempotent: already-stamped items keep
// their cost; they just gain a 'snapshot' tag if untagged (they WERE stamped
// at creation — that's a genuine snapshot). With `reStamp`, a registry match
// OVERRIDES the existing cost — used at customer-order acceptance so the
// app's own registry is authoritative over client-submitted numbers.
//
// Per-lb proteins are special: the registry's 'By weight' variant carries a
// $/lb RATE, not an item cost, so stamping it would freeze a rate as a basis.
// Their only legitimate basis comes from weighing (repricePerLbItem); here we
// only tag an existing weighed basis, never fabricate one.
export function stampItemCosts(items, source = 'snapshot', { reStamp = false } = {}) {
  return (items || []).map(it => {
    if (it.weightPending) return it; // weighed later; repricePerLbItem stamps it
    if (isPerLbItem(it.name)) {
      if (typeof it.cost === 'number' && it.cost > 0 && typeof it.weight === 'number' && it.weight > 0) {
        return it.costSource ? it : { ...it, costSource: 'snapshot' }; // genuinely weighed
      }
      return it; // unweighed per-lb — no basis until weighed, never stamp the rate
    }
    const v = reStamp || !hasCostBasis(it) ? menuVariantFor(it.name, it.variant, it.category) : null;
    if (v && typeof v.cost === 'number' && v.cost > 0) {
      return { ...it, cost: v.cost, costSource: source };
    }
    if (hasCostBasis(it)) {
      return it.costSource ? it : { ...it, costSource: 'snapshot' };
    }
    return it; // unstampable (off-menu + no basis) — stays incomplete, shows the *
  });
}

// Normalize customer-form items into the canonical shapes the rest of the app
// assumes. The form (form.html) is the one entry path that ships a different
// item shape: per-lb proteins arrive with the $/lb RATE in `price` and `cost`
// and no `weightPending` flag — so order totals counted a rate as a price and
// (post cost-basis) the rate froze as a cost snapshot. Manual entry and the
// AI-parse path both use weightPending:true / price 0 until weighing; this
// brings accepted customer orders to the same shape. Run BEFORE stampItemCosts
// and BEFORE orderTotal at acceptance.
export function normalizePendingItems(items) {
  return (items || []).map(it => {
    if (!isPerLbItem(it.name)) return it;
    if (typeof it.weight === 'number' && it.weight > 0) return it; // already genuinely weighed
    const n = { ...it, weightPending: true, price: 0, cost: 0 };
    delete n.costSource;
    return n;
  });
}

// Cost lookup: prefer the frozen per-item basis, fall back to the current
// registry anchor (rename-immune, category-optional). Weight-pending per-lb
// items report 0 until weighed.
export function itemCost(it) {
  if (it.weightPending) return typeof it.cost === 'number' ? it.cost : 0;
  if (hasCostBasis(it)) return it.cost;
  const v = menuVariantFor(it.name, it.variant, it.category);
  return v && typeof v.cost === 'number' ? v.cost : null;
}

// { cost, complete } — complete=false when any item has no cost data
export function orderCostInfo(order) {
  let cost = 0;
  let complete = true;
  (order.items || []).forEach(it => {
    const c = itemCost(it);
    if (c === null) complete = false;
    else cost += c * it.qty;
  });
  return { cost: round2(cost), complete };
}

// Group label for the Money tab; weeks start Monday to match the menu cycle
export function groupKeyFor(order, mode) {
  const d = new Date(order.createdAt || 0);
  if (mode === 'week') {
    const day = (d.getDay() + 6) % 7; // Mon=0
    const mon = new Date(d);
    mon.setDate(d.getDate() - day);
    return {
      label: `Week of ${mon.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      stamp: new Date(mon.getFullYear(), mon.getMonth(), mon.getDate()).getTime(),
    };
  }
  if (mode === 'month') {
    return {
      label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      stamp: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
    };
  }
  if (mode === 'year') {
    return { label: String(d.getFullYear()), stamp: new Date(d.getFullYear(), 0, 1).getTime() };
  }
  return { label: '', stamp: 0 };
}

export function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// Formatted plain-text summary, ready to paste into a text message
export function orderToText(order) {
  const lines = [`LTB Order — ${order.customer}`];
  (order.items || []).forEach(it => {
    const up = it.upcharge && it.upcharge.amount ? it.price + it.upcharge.amount : it.price;
    lines.push(`${it.qty}x ${it.name} (${it.variant}) — ${currency(up * it.qty)}`);
    if (it.upcharge && it.upcharge.amount)
      lines.push(`   + ${it.upcharge.label || 'Upcharge'} (+${currency(it.upcharge.amount)} ea)`);
    if (it.note) lines.push(`   note: ${it.note}`);
  });
  const base = itemsBaseTotal(order.items);
  const disc = discountAmount(base, order.discountType, order.discountValue);
  if (disc > 0) {
    const label = order.discountType === 'percent' ? `${order.discountValue}% discount` : 'Discount';
    lines.push(`${label} — -${currency(disc)}`);
  }
  (order.customCharges || []).forEach(ch => {
    lines.push(`${ch.label || 'Charge'} — ${currency(Number(ch.amount) || 0)}`);
  });
  if (!order.waiveSurcharge) lines.push(`Order surcharge — ${currency(SURCHARGE)}`);
  if (order.jarSwaps > 0)
    lines.push(`Jar swap x${order.jarSwaps} — -${currency(order.jarSwaps * 2)}`);
  if (order.containerReturns > 0)
    lines.push(`Container return x${order.containerReturns} — -${currency(order.containerReturns)}`);
  lines.push(`Total: ${currency(order.total)}`);
  if (order.notes) lines.push(`Notes: ${order.notes}`);
  return lines.join('\n');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE BACKEND — GitHub Pages / localStorage build
// ═══════════════════════════════════════════════════════════════════════════
// This build runs as a standalone site (GitHub Pages) instead of inside the
// Claude artifact sandbox, so the sandbox's async window.storage API isn't
// available. The shim below reimplements the exact same interface on top of
// browser localStorage, so every call site downstream (loadJSON/saveJSON, the
// photo helpers, the storage gauge) keeps working without changes.
//
// Interface kept identical to the sandbox API:
//   get(key)        -> { key, value } | null   (null when missing; never throws)
//   set(key, value) -> { key, value }          (throws if quota exceeded)
//   delete(key)     -> { key, deleted: true }
//   list(prefix)    -> { keys: [...] }
//
// localStorage is synchronous; these stay async so all the existing `await`
// calls continue to work untouched. Unlike the sandbox, localStorage persists
// across home-screen re-adds (tied to the Safari origin), so data survives app
// updates as long as Safari website data isn't cleared.
export const localStore = {
  async get(key) {
    const value = window.localStorage.getItem(key);
    return value === null ? null : { key, value };
  },
  async set(key, value) {
    // Throws QuotaExceededError when full — callers already handle the throw.
    window.localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key) {
    window.localStorage.removeItem(key);
    return { key, deleted: true };
  },
  async list(prefix) {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (!prefix || k.startsWith(prefix))) keys.push(k);
    }
    return { keys };
  },
};

// Single accessor used everywhere below. Falls back to the sandbox API if it
// somehow exists (harmless), otherwise uses the localStorage shim.
export const store = (typeof window !== 'undefined' && window.storage) ? window.storage : localStore;

// Storage wrappers — get() returns null on missing keys, so always guard
export async function loadJSON(key, fallback) {
  try {
    const result = await store.get(key);
    return result ? JSON.parse(result.value) : fallback;
  } catch {
    return fallback;
  }
}

// Returns { ok, error, bytes } so callers can show the real failure reason.
// Retries once on failure, since WKWebView storage writes occasionally fail transiently.
export async function saveJSON(key, value) {
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch (e) {
    return { ok: false, error: 'Could not serialize data', bytes: 0 };
  }
  const bytes = serialized.length;
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await store.set(key, serialized);
      if (result) return { ok: true, error: null, bytes };
      lastErr = 'Storage returned empty';
    } catch (e) {
      lastErr = (e && e.message) || 'Storage threw an error';
    }
    // brief pause before the retry
    if (attempt === 0) await new Promise(r => setTimeout(r, 150));
  }
  return { ok: false, error: lastErr, bytes };
}

// Translate a saveJSON result into a user-facing error (or null on success).
// Calls out the 5MB-per-key limit specifically, since that's the usual culprit
// once order history grows or photos pile up.
export function saveError(res) {
  if (res && res.ok) return null;
  const bytes = res ? res.bytes : 0;
  if (bytes > 4.8 * 1024 * 1024) {
    return `Storage full: this data is ${(bytes / 1024 / 1024).toFixed(1)}MB, over the ~5MB limit. Archive or delete old orders, then it will save.`;
  }
  const detail = res && res.error ? ` (${res.error})` : '';
  return `Could not save${detail}. Your changes are shown but not yet stored — try again.`;
}

// ─── Scale-photo storage (one key per sous-vide item, kept out of the orders blob) ───
export const PHOTO_PREFIX = 'ltb-photo-';
export const PHOTO_TTL_DAYS = 30; // auto-delete proof photos after one month

export function photoKey(orderId, itemIdx) {
  return `${PHOTO_PREFIX}${orderId}-${itemIdx}`;
}

export async function savePhoto(orderId, itemIdx, base64) {
  try {
    const r = await store.set(photoKey(orderId, itemIdx), JSON.stringify({ d: base64, t: Date.now() }));
    return !!r;
  } catch {
    return false;
  }
}

export async function loadPhoto(orderId, itemIdx) {
  try {
    const r = await store.get(photoKey(orderId, itemIdx));
    if (!r) return null;
    const parsed = JSON.parse(r.value);
    return parsed.d || null;
  } catch {
    return null;
  }
}

export async function deletePhoto(orderId, itemIdx) {
  try { await store.delete(photoKey(orderId, itemIdx)); } catch { /* ignore */ }
}

// Estimate total bytes used by stored photos (for the storage gauge)
export async function photoStorageBytes() {
  try {
    const res = await store.list(PHOTO_PREFIX);
    const keys = (res && res.keys) || [];
    let bytes = 0;
    for (const k of keys) {
      try {
        const r = await store.get(k);
        if (r && r.value) bytes += r.value.length;
      } catch { /* skip */ }
    }
    return { bytes, count: keys.length };
  } catch {
    return { bytes: 0, count: 0 };
  }
}

// Delete photos whose order is archived or older than the TTL.
// `orders` is the current list so we can check age/archived status.
export async function cleanupPhotos(orders) {
  try {
    const res = await store.list(PHOTO_PREFIX);
    const keys = (res && res.keys) || [];
    if (keys.length === 0) return;
    const byId = new Map((orders || []).map(o => [o.id, o]));
    const cutoff = Date.now() - PHOTO_TTL_DAYS * 24 * 60 * 60 * 1000;
    for (const k of keys) {
      // key shape: ltb-photo-{orderId}-{itemIdx}; orderId is everything between prefix and last dash
      const rest = k.slice(PHOTO_PREFIX.length);
      const lastDash = rest.lastIndexOf('-');
      const orderId = lastDash >= 0 ? rest.slice(0, lastDash) : rest;
      const order = byId.get(orderId);
      let remove = false;
      if (!order) remove = true;              // orphaned (order deleted)
      else if (order.archived) remove = true; // archived orders drop their photos
      else {
        // age check via the stored timestamp, falling back to order date
        try {
          const r = await store.get(k);
          const t = r ? (JSON.parse(r.value).t || 0) : 0;
          const stamp = t || new Date(order.createdAt || 0).getTime();
          if (stamp < cutoff) remove = true;
        } catch { /* leave it */ }
      }
      if (remove) { try { await store.delete(k); } catch { /* ignore */ } }
    }
  } catch { /* ignore */ }
}

export const fmtBytes = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

// ─── AI order parsing ───────────────────────────────────────────────────────
// Compact menu description sent to the model so it can match free-form text
export function menuForPrompt(menu) {
  const lines = [];
  Object.entries(menu).forEach(([cat, items]) => {
    items.forEach(item => {
      item.variants.forEach(v => {
        lines.push(`category="${cat}" name="${item.name}" variant="${v.label}" price=$${v.price}`);
      });
    });
  });
  return lines.join('\n');
}

// Downscale + re-encode any image (incl. iPhone HEIC in Safari) to JPEG base64.
// Tries createImageBitmap first (broader format + EXIF support), then <img> fallback.
export async function fileToJpegBase64(file, maxDim = 1100, quality = 0.72) {
  const draw = (source, width, height) => {
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(source, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (!dataUrl || dataUrl.length < 100) throw new Error('Image conversion produced no data');
    return dataUrl.split(',')[1];
  };

  // Attempt 1: createImageBitmap
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file);
      const result = draw(bmp, bmp.width, bmp.height);
      bmp.close && bmp.close();
      return result;
    } catch (e) {
      // fall through to <img> path
    }
  }

  // Attempt 2: object URL + <img>
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        resolve(draw(img, img.naturalWidth || img.width, img.naturalHeight || img.height));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not decode image')); };
    img.src = url;
  });
}

export async function parseOrderText(messageText, imageBase64, menu) {
  const intro = imageBase64
    ? `You are an order parser for a small meal prep business. A customer sent a PHOTO of the menu with items circled, highlighted, or marked — possibly with handwritten notes on it${messageText ? ', along with this text message' : ''}.
Identify which menu items are circled/marked in the photo, and read any handwritten notes (like "sauce on side") into "notes".${messageText ? `\n\nTheir accompanying text:\n"""\n${messageText}\n"""` : ''}`
    : `You are an order parser for a small meal prep business. A customer sent this text message with their order:

"""
${messageText}
"""`;

  const prompt = `${intro}

Here is the complete CURRENT menu. Each line is one orderable option:
${menuForPrompt(menu)}

Match what the customer asked for to menu options. Rules:
- Use EXACT category, name, and variant strings from the menu above.
- The customer may be looking at an OLDER version of the menu. If a marked item does not exist on the current menu, do NOT substitute a similar item — describe it in "notes" instead so the chef can follow up.
- If the customer mentions returning or swapping a jar for a jar item, choose the "With jar swap" variant of that item if one exists.
- "jarSwaps" should equal the number of jar items ordered with the jar-swap variant.
- "containerReturns" is the number of meal containers the customer says they will return (not jars).
- PER-ITEM NOTES: if a request clearly attaches to ONE specific item (e.g. "chili oil on the side", "extra spicy", "no cilantro"), put it in that item's "note" field, NOT in the order-level notes.
- ADD-ONS: some items have add-on options baked into their variants (e.g. a dish with a "+ Asian Greens" or "With Mushrooms" variant). If the customer asks for an add-on that EXISTS as a variant of that item (look for variants with + or "With" in the label, or a higher price than the base), select that upgraded variant — do NOT create an upcharge and do NOT flag it. Example: customer says "small mushroom noodles with Asian greens" → select variant "Small (~3-4) + Asian Greens", not "Small (~3-4)".
- OFF-MENU EXTRAS (upcharge): only if the customer asks to add something to an item that is NOT an available variant of that item (e.g. "add mushrooms" to a dish that has no mushroom option), set that item's "upcharge" to {"label":"short description","amount":null} with amount null. Do NOT also write a reviewReason for it — the app detects unpriced upcharges automatically. Just set the upcharge object.
- WEIGHT FOR PROTEINS: items named exactly "Ribeye", "NY Strip", "Filet Mignon", "Flank Steak", "Thick-Cut Pork Chop", "Pork Tenderloin", or "Air-Chilled Chicken Breast" are priced by the pound, weighed by the chef after shopping. Do NOT price them, do NOT set an upcharge, and do NOT write a reviewReason about their weight. If the customer mentions an intended amount (e.g. "1 lb chicken", "ribeye about half a pound", "a 12 oz NY strip"), put that amount in the item's "note" field as a reminder (e.g. note "about 1 lb"). Always leave "weight" null.
- Order-level "notes" is only for things that don't attach to a single item (delivery time, general messages).
- CARROTS: if someone says "carrots" without qualification, match it to the sous vide bag item (category "bag", name "Carrots", variant "2 servings"). Only match to "Pickled Onions or Carrots" if they specifically say "pickled carrots".
- reviewReasons: ONLY use this for genuine ambiguity the app cannot detect on its own — an unclear quantity, an item you couldn't confidently match, or a confusing request. Do NOT add reviewReasons for unpriced upcharges or for protein weights; those are handled automatically. If everything is clear, return an empty reviewReasons array.

Respond with ONLY a JSON object, no markdown fences, no explanation. Shape:
{"items":[{"category":"...","name":"...","variant":"...","qty":1,"note":"","upcharge":null,"weight":null}],"jarSwaps":0,"containerReturns":0,"notes":"","reviewReasons":[]}`;

  const content = imageBase64
    ? [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: prompt },
      ]
    : prompt;

  let response;
  try {
    response = await fetch('https://ltb-proxy.strickland-kevinj.workers.dev/parse-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content }],
      }),
    });
  } catch (e) {
    // Thrown by the artifact runtime's network layer, before any response reached us
    throw new Error(`[network layer] ${e && e.message ? e.message : 'request failed'}`);
  }
  // Read raw text first so we can show exactly what came back if anything fails
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Non-JSON response (HTTP ${response.status}): ${raw.slice(0, 180)}`);
  }
  if (data.error) {
    const errType = data.error.type || '';
    const detail = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
    // Surface a clear message for billing issues rather than a cryptic API error
    if (response.status === 402 || errType === 'credit_balance_too_low') {
      throw new Error('OUT_OF_CREDITS');
    }
    throw new Error(`HTTP ${response.status} — ${String(detail).slice(0, 120)} — raw: ${raw.slice(0, 180)}`);
  }
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${raw.slice(0, 180)}`);
  }
  const text = (data.content || []).map(b => (b.type === 'text' ? b.text : '')).join('');
  if (!text.trim()) {
    throw new Error(`Empty response from parser — HTTP ${response.status}, raw: ${raw.slice(0, 120)}`);
  }
  // Strip fences and extract the outermost JSON object even if the model added prose
  const clean = text.replace(/```json|```/g, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);

  return validateParsedOrder(parsed, menu);
}

// Phase 3 — receipt line-item extraction. Mirrors parseOrderText's proxy-call
// shape exactly, but hits /parse-receipt and returns the raw extracted JSON
// (store, receipt_date, lines[]). The MODEL ONLY EXTRACTS — all matching and
// costing happen later in app code (receiptMatch.js). Prompt is intentionally
// strict: extract only, null anything not literally printed, never guess.
const RECEIPT_EXTRACTION_PROMPT = `You are a receipt line-item extractor. Your ONLY job is to read a photographed grocery receipt and return its line items as strict JSON. You do not interpret, match, categorize, or price anything. You transcribe what is literally printed.

The image may be rotated, upside down, wrinkled, or faded. Read it regardless of orientation.

These receipts come from three store layouts. Items often span TWO printed lines — combine them into ONE line object:

- H-E-B: a line number + NAME on one line, and the quantity/price detail on the NEXT line, e.g.:
    "1 KITCH BASICS UNSLTD BEEF"
    "    2 Ea. @ 1/ 2.98 F   5.96"
  This is ONE item: name "KITCH BASICS UNSLTD BEEF", it's 2 each at $2.98, line_total 5.96, flag F. Put quantity=2, unit="ea", unit_price_printed=2.98 when an "N Ea. @ ... <price>" detail line is present. A weighed item shows "2#" or a weight; flags: T (taxed), F (food/exempt), FW (food + weighed). When the NAME line already carries the flag and total with no separate detail line (e.g. "7 ANISE FENNEL  FW  3.98"), that's the whole item. Has a "Sale Subtotal", "Sales Tax", "Total Sale".
- H-E-B GO: same family. Weighed items may print NO weight, only the total (e.g. "PREMIUM BANANAS  FW  0.61"). Store-brand names are often truncated mid-word (e.g. "CLABBER GIRL BAKING POWDE", "GHIRARDELLI 100% COCOA UN"). Transcribe the truncation exactly; do not complete the word.
- H-Mart: no line numbers; the item NAME and total are on one line with the flag on the right (e.g. "GARLIC PK 5PC  2.99  F"). A WEIGHED item prints a weight-times-rate line DIRECTLY ABOVE the name, and the name line is prefixed "WT", e.g.:
    "2.95 lb @ 0.69 /lb"
    "WT    YELLOW ONION    2.04 F"
  This is ONE item: name "YELLOW ONION", weighed=true, quantity=2.95, unit="lb", unit_price_printed=0.69, line_total=2.04. The same item can appear on multiple lines (each its own object). Tax may show as "TAX 0.00".

  Per-line type detection (H-Mart AND H-E-B):
  (a) BY THE POUND (weighed): a weight-times-rate pattern is present ("2.95 lb @ 0.69 /lb", a "WT" prefix, "2#", "NET WT 0.75 LB"). weighed=true, quantity=<weight>, unit="lb", unit_price_printed=<per-lb rate>, line_total=<charged total>.
  (b) BY A PACK/COUNT: the name shows a pack marker like "PK 5PC", "5 PACK", "8 CT", "BAG", "BTL"/"BOTTLE", or it's just "<NAME> <price> <flag>" with NO weight and NO "@" rate. weighed=false. If a pack count is printed (e.g. "5PC" = 5 pieces), put that number in quantity and unit="pack"; for a single bag/bottle/carton with no count, set unit="pack" (or "bottle"/"bag"/"carton" as printed) and quantity=null. Otherwise quantity=null, unit=null. unit_price_printed=null, line_total=<price>.
  Decide PER LINE from what is actually printed. Do NOT assume a whole store is one type. No weight and no "@" rate means it is a pack/count line (weighed=false).

Return ONLY a JSON object. No prose, no explanation, no markdown code fences. The object has exactly these keys:

{
  "store": <string|null>,
  "receipt_date": <string|null>,
  "lines": [
    {
      "raw_text": <string>,
      "item_name": <string>,
      "quantity": <number|null>,
      "unit": <string|null>,
      "line_total": <number|null>,
      "unit_price_printed": <number|null>,
      "tax_flag": <string|null>,
      "weighed": <boolean>
    }
  ]
}

Field rules:
- store: best guess "H-E-B", "H-E-B GO", "H-Mart", or null if unclear.
- receipt_date: the PURCHASE/transaction date printed on the receipt, normalized to "YYYY-MM-DD". Use the transaction date, NOT an "expires on" date or any future date. null if not legibly present.
- item_name: the product name as printed, verbatim. Do NOT expand, correct, or normalize. Keep truncations and store-brand abbreviations.
- quantity / unit: ONLY if literally printed on the line. quantity is the number; unit is the printed unit token. Examples: "2#" -> quantity 2, unit "lb" ("#" means lb); "1 GAL" -> quantity 1, unit "gal"; "16 OZ" -> quantity 16, unit "oz"; "0.5 GAL" -> quantity 0.5, unit "gal". Transcribe the unit token as printed (gal, lb, oz, qt, pt, fl oz, g, kg, ml, l). Both null if no quantity/unit is printed. NEVER infer or guess.
- line_total: the dollar total charged for the line. null only if genuinely unreadable.
- unit_price_printed: a per-unit price ONLY if one is literally printed on the line. null otherwise. NEVER compute it yourself.
- tax_flag: "T", "F", or "FW" exactly as printed. null if no flag printed.
- weighed: true if the line is a weighed item (flag contains "W", or the line shows "#"/"lb"/a weight). false otherwise.

HARD RULES:
- Extract ONLY item lines. Exclude subtotals, tax lines, totals, payment/card info, store address, phone, survey text, barcodes, "items purchased", return policy.
- NEVER guess a quantity, weight, or unit price that is not printed. A weighed item with no printed weight has quantity=null, unit=null, weighed=true.
- Transcribe item names verbatim, including truncations. Do not "fix" them.
- Do not map items to ingredients. Transcribe everything that is an item line, including beer, paper goods, etc.
- If the whole receipt is unreadable, return {"store": null, "receipt_date": null, "lines": []}.
- Output the JSON object and nothing else.`;

export async function extractReceipt(imageBase64) {
  const content = [
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
    { type: 'text', text: RECEIPT_EXTRACTION_PROMPT },
  ];

  let response;
  try {
    response = await fetch(WORKER_BASE + '/parse-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content }],
      }),
    });
  } catch (e) {
    throw new Error(`[network layer] ${e && e.message ? e.message : 'request failed'}`);
  }
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Non-JSON response (HTTP ${response.status}): ${raw.slice(0, 180)}`);
  }
  if (data.error) {
    const errType = data.error.type || '';
    const detail = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
    if (response.status === 402 || errType === 'credit_balance_too_low') {
      throw new Error('OUT_OF_CREDITS');
    }
    throw new Error(`HTTP ${response.status} — ${String(detail).slice(0, 120)} — raw: ${raw.slice(0, 180)}`);
  }
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${raw.slice(0, 180)}`);
  }
  const text = (data.content || []).map(b => (b.type === 'text' ? b.text : '')).join('');
  if (!text.trim()) {
    throw new Error(`Empty response from receipt parser — HTTP ${response.status}, raw: ${raw.slice(0, 120)}`);
  }
  const clean = text.replace(/```json|```/g, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  let parsed;
  try {
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
  } catch (e) {
    // The model's JSON came back malformed — almost always because a long
    // receipt hit the token ceiling and the "lines" array was cut off mid-object
    // (the classic "Expected ']'"). Salvage what we can: keep every COMPLETE
    // line object that streamed before the cut, then close the array/object so
    // the user still gets most of the receipt instead of a hard failure.
    const salvaged = salvageReceiptJson(clean);
    if (salvaged) {
      parsed = salvaged;
    } else if (data.stop_reason === 'max_tokens') {
      throw new Error('That receipt has too many items to read in one pass. Try cropping to fewer items per photo, or scan it in two halves.');
    } else {
      throw new Error(`Could not read that receipt (the scan came back garbled). Try a flatter, sharper photo with even lighting.`);
    }
  }

  // shape guard: always return the expected skeleton
  return {
    store: parsed.store || null,
    receipt_date: parsed.receipt_date || null,
    lines: Array.isArray(parsed.lines) ? parsed.lines : [],
  };
}

// Recover a usable receipt object from JSON that was truncated mid-array (the
// model hit its token ceiling). Strategy: pull store/receipt_date if present,
// then walk the "lines" array keeping only complete {...} objects, stopping at
// the first one that doesn't fully close. Returns a valid object or null if
// nothing salvageable.
export function salvageReceiptJson(clean) {
  try {
    const store = (clean.match(/"store"\s*:\s*"([^"]*)"/) || [])[1] || null;
    const date = (clean.match(/"receipt_date"\s*:\s*"([^"]*)"/) || [])[1] || null;
    const linesStart = clean.indexOf('"lines"');
    if (linesStart === -1) return null;
    const bracket = clean.indexOf('[', linesStart);
    if (bracket === -1) return null;

    const objs = [];
    let depth = 0, start = -1, inStr = false, esc = false;
    for (let i = bracket + 1; i < clean.length; i++) {
      const ch = clean[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') { inStr = true; continue; }
      if (ch === '{') { if (depth === 0) start = i; depth++; }
      else if (ch === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          const frag = clean.slice(start, i + 1);
          try { objs.push(JSON.parse(frag)); } catch (_) { /* skip a bad fragment */ }
          start = -1;
        }
      } else if (ch === ']' && depth === 0) {
        break;
      }
    }
    if (!objs.length) return null;
    return { store, receipt_date: date, lines: objs };
  } catch (_) {
    return null;
  }
}

// Shared validation: turn a raw parsed order object into clean items + flags.
// Used by both the new-order parser and the amend-order parser.
export function validateParsedOrder(parsed, menu) {
  // Validate every parsed item against the real menu; collect misses into notes
  const items = [];
  const misses = [];
  (parsed.items || []).forEach(pi => {
    let matched = null;
    const cats = pi.category && menu[pi.category] ? [pi.category] : Object.keys(menu);
    for (const cat of cats) {
      const menuItem = menu[cat].find(m => m.name.toLowerCase() === String(pi.name || '').toLowerCase());
      if (menuItem) {
        const variant = menuItem.variants.find(v => v.label.toLowerCase() === String(pi.variant || '').toLowerCase())
          || (menuItem.variants.length === 1 ? menuItem.variants[0] : null);
        if (variant) {
          // Normalize a per-item upcharge: AI returns {label, amount:null}; chef fills amount later.
          // Per-lb proteins never carry an upcharge (their pricing is weight-based).
          let upcharge = null;
          if (!isPerLbItem(menuItem.name) && pi.upcharge && (pi.upcharge.label || pi.upcharge.amount != null)) {
            upcharge = {
              label: String(pi.upcharge.label || 'Upcharge').slice(0, 40),
              amount: typeof pi.upcharge.amount === 'number' ? pi.upcharge.amount : 0,
            };
          }
          matched = {
            category: cat, name: menuItem.name, variant: variant.label,
            price: variant.price, cost: variant.cost, costSource: 'snapshot',
            qty: Math.max(1, parseInt(pi.qty) || 1),
            note: pi.note ? String(pi.note).slice(0, 200) : '',
            upcharge,
          };
          // Per-lb proteins are weighed after shopping: start pending (no price yet)
          if (isPerLbItem(menuItem.name)) {
            matched.weightPending = true;
            matched.price = 0;
            matched.cost = 0;
            matched.weight = undefined;
          }
          break;
        }
      }
    }
    if (matched) {
      // Only merge duplicates when they have no distinguishing note/upcharge
      const dup = items.find(i =>
        i.category === matched.category && i.name === matched.name && i.variant === matched.variant
        && !i.note && !i.upcharge && !matched.note && !matched.upcharge);
      if (dup) dup.qty += matched.qty;
      else items.push(matched);
    }
    else misses.push(`${pi.qty || 1}x ${pi.name || '?'} ${pi.variant ? `(${pi.variant})` : ''}`.trim());
  });

  let notes = String(parsed.notes || '').trim();

  // Build the review list. The app is the single source of truth for two kinds of
  // flags — unpriced upcharges and unmatched items — so we strip any AI-supplied
  // reasons that overlap with those (and any about protein weight, which we never
  // prompt for at parse time) to prevent double prompts.
  const overlapRe = /\b(upcharge|price|weigh|weight|pound|per lb|per-lb|couldn'?t match|could not match|not on the menu|off[- ]menu)\b/i;
  const reviewReasons = (Array.isArray(parsed.reviewReasons) ? parsed.reviewReasons : [])
    .map(r => String(r).trim())
    .filter(Boolean)
    .filter(r => !overlapRe.test(r));

  if (misses.length > 0) {
    reviewReasons.push(`Couldn't match to this week's menu: ${misses.join(', ')}`);
    notes = [notes, `Could not auto-match: ${misses.join(', ')} — review!`].filter(Boolean).join('\n');
  }
  // Unpriced upcharges: the one and only place this flag is generated
  items.forEach(it => {
    if (it.upcharge && !it.upcharge.amount) {
      reviewReasons.push(`Set a price for "${it.upcharge.label}" on ${it.name}`);
    }
  });
  // De-dupe any identical strings just in case
  const seen = new Set();
  const dedupedReasons = reviewReasons.filter(r => {
    const k = r.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return {
    items,
    jarSwaps: Math.max(0, parseInt(parsed.jarSwaps) || 0),
    containerReturns: Math.max(0, parseInt(parsed.containerReturns) || 0),
    notes,
    reviewReasons: dedupedReasons,
  };
}

// Amend an EXISTING order from a follow-up text. Sends the AI the current order
// contents plus the new message, and asks for the COMPLETE updated order so the
// chef can review it in the normal form before saving.
export async function parseAmendment(order, messageText, menu) {
  // Describe the current order plainly for the model
  const currentLines = (order.items || []).map(it => {
    const bits = [`${it.qty}x ${it.name} (${it.variant})`];
    if (it.note) bits.push(`note: ${it.note}`);
    if (it.upcharge && it.upcharge.label) bits.push(`upcharge: ${it.upcharge.label}${it.upcharge.amount ? ` $${it.upcharge.amount}` : ' (unpriced)'}`);
    return '  - ' + bits.join(', ');
  }).join('\n');
  const currentExtras = [];
  if (order.jarSwaps > 0) currentExtras.push(`jarSwaps: ${order.jarSwaps}`);
  if (order.containerReturns > 0) currentExtras.push(`containerReturns: ${order.containerReturns}`);
  if (order.notes) currentExtras.push(`order notes: ${order.notes}`);

  const prompt = `You are an order parser for a small meal prep business. An EXISTING order needs to be amended based on a new follow-up message from the customer.

THE CURRENT ORDER (for ${order.customer}):
${currentLines || '  (no items)'}
${currentExtras.length ? currentExtras.join('\n') : ''}

THE FOLLOW-UP MESSAGE:
"""
${messageText}
"""

Here is the complete CURRENT menu. Each line is one orderable option:
${menuForPrompt(menu)}

Apply the customer's requested changes to the current order and return the COMPLETE updated order (not just the changes). Keep every existing item that wasn't changed, exactly as it was (same variant, note, upcharge). Apply additions, removals, quantity changes, and variant changes as requested. Follow these rules:
- Use EXACT category, name, and variant strings from the menu.
- Keep existing per-item notes and upcharges unless the customer's message changes them.
- ADD-ONS: if the customer asks for an add-on that EXISTS as a variant of an item, switch to that variant. Do not create an upcharge for it.
- OFF-MENU EXTRAS: only if they ask to add something that is NOT an available variant, set that item's "upcharge" to {"label":"...","amount":null}. Do not also add a reviewReason for it.
- PER-LB PROTEINS (Ribeye, NY Strip, Filet Mignon, Flank Steak, Thick-Cut Pork Chop, Pork Tenderloin, Air-Chilled Chicken Breast): never price or weight them; put any stated amount in the item "note". Leave weight null.
- reviewReasons: ONLY for genuine ambiguity you cannot resolve (an unclear request, an item you couldn't match). Do not flag upcharges or weights.

Respond with ONLY a JSON object, no markdown fences, no explanation. Shape:
{"items":[{"category":"...","name":"...","variant":"...","qty":1,"note":"","upcharge":null,"weight":null}],"jarSwaps":0,"containerReturns":0,"notes":"","reviewReasons":[]}`;

  let response;
  try {
    response = await fetch('https://ltb-proxy.strickland-kevinj.workers.dev/parse-amendment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch (e) {
    throw new Error(`[network layer] ${e && e.message ? e.message : 'request failed'}`);
  }
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Non-JSON response (HTTP ${response.status}): ${raw.slice(0, 180)}`);
  }
  if (data.error) {
    const errType = data.error.type || '';
    const detail = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
    if (response.status === 402 || errType === 'credit_balance_too_low') {
      throw new Error('OUT_OF_CREDITS');
    }
    throw new Error(`HTTP ${response.status} — ${String(detail).slice(0, 120)}`);
  }
  if (!response.ok) throw new Error(`API ${response.status}: ${raw.slice(0, 180)}`);
  const text = (data.content || []).map(b => (b.type === 'text' ? b.text : '')).join('');
  if (!text.trim()) throw new Error('Empty response from parser');
  const clean = text.replace(/```json|```/g, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);

  const validated = validateParsedOrder(parsed, menu);
  // Preserve the order's identity and status so saving updates in place
  return {
    ...validated,
    id: order.id,
    customer: order.customer,
    status: order.status,
    paid: order.paid,
    archived: order.archived,
    createdAt: order.createdAt,
    discountType: order.discountType,
    discountValue: order.discountValue,
    customCharges: order.customCharges || [],
    _amended: true,
  };
}

// ─── Import modal: user pastes backup text into a textarea ──────────────────

// ─── CSV / form helpers (used by App + CsvImportCard) ──────────────────────
export function parseFormRow(headerMap) {
  const items = [];
  const notes = [];
  const priceIndex = {};
  const addToIndex = (item) => {
    (item.variants || []).forEach(v => {
      const key = Math.round(v.price * 100);
      if (!priceIndex[key]) priceIndex[key] = [];
      priceIndex[key].push({ name: item.name, label: v.label, price: v.price, cost: v.cost });
    });
  };
  ALL_DINNERS.forEach(addToIndex);
  Object.values(ALWAYS_MENU).flat().forEach(addToIndex);

  let customer = '';
  Object.entries(headerMap).forEach(([header, value]) => {
    const h = header.toLowerCase().trim();
    const v = String(value || '').trim();
    if (!v || v.toLowerCase() === 'no thanks' || h.includes('timestamp')) return;
    if (h === 'your name' || h.includes('your name')) { customer = v; return; }
    if (h.includes('notes') || h.includes('anything else') || h.includes('quantity') || h.includes('weight')) {
      if (v) notes.push(v);
      return;
    }
    const selections = v.includes(',') ? v.split(',').map(s => s.trim()) : [v];
    selections.forEach(sel => {
      if (!sel || sel.toLowerCase() === 'no thanks') return;
      const priceMatch = sel.match(/[—–-]\s*\$(\d+(?:\.\d+)?)/);
      let matched = null;
      if (priceMatch) {
        const dollars = Math.round(parseFloat(priceMatch[1]) * 100);
        const candidates = priceIndex[dollars] || [];
        if (candidates.length === 1) {
          matched = candidates[0];
        } else if (candidates.length > 1) {
          const hNorm = h.replace(/[^a-z0-9]/g, '');
          matched = candidates.find(c => {
            const cNorm = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cNorm.includes(hNorm.slice(0, 8)) || hNorm.includes(cNorm.slice(0, 8));
          }) || candidates[0];
        }
      }
      if (!matched) {
        const selNorm = sel.toLowerCase().replace(/[^a-z0-9]/g, '');
        let bestScore = 0;
        [...ALL_DINNERS, ...Object.values(ALWAYS_MENU).flat()].forEach(item => {
          (item.variants || []).forEach(variant => {
            const combined = (item.name + ' ' + variant.label).toLowerCase().replace(/[^a-z0-9]/g, '');
            let score = 0;
            for (let i = 0; i < Math.min(selNorm.length, combined.length); i++) {
              if (selNorm[i] === combined[i]) score++;
            }
            if (score > bestScore) {
              bestScore = score;
              matched = { name: item.name, label: variant.label, price: variant.price, cost: variant.cost };
            }
          });
        });
      }
      if (matched) {
        const csvItem = {
          name: matched.name, variant: matched.label, qty: 1,
          price: matched.price,
          note: '', hasPhoto: false,
        };
        if (typeof matched.cost === 'number' && matched.cost > 0) {
          csvItem.cost = matched.cost;
          csvItem.costSource = 'snapshot';
        }
        items.push(csvItem);
      } else {
        notes.push('Unmatched item: ' + sel);
      }
    });
  });
  return { customer: customer || 'Unknown', items, notes: notes.join(' | ') };
}

// Fetch the published CSV via the Cloudflare Worker proxy (handles CORS).
// Returns null on network failure.
async function fetchFormRows() {
  try {
    const res = await fetch(FORM_CSV_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    const text = await res.text();
    const rows = parseDelimited(text);
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(cells => {
      const map = {};
      headers.forEach((h, i) => { map[h] = cells[i] || ''; });
      return map;
    });
  } catch {
    return null;
  }
}

// ─── AI notes parser for form orders ─────────────────────────────────────────
export async function parseFormNotes(notes) {
  const prompt = 'You are a helper for a small meal prep chef reviewing customer order notes. '
    + 'The customer placed their order via a structured form (dropdowns), so the main items are already captured. '
    + 'These are their free-text notes: """' + notes + '""" '
    + 'Interpret these notes and return a JSON object with: '
    + '"spice": any spice level request or null, '
    + '"substitutions": any substitution requests as a string or null, '
    + '"extras": any extra items or add-ons mentioned that were not in the form or null, '
    + '"delivery": any delivery instructions or timing notes or null, '
    + '"other": anything else worth flagging for the chef or null, '
    + '"summary": a single short sentence summarizing what action the chef needs to take, or null if notes are routine. '
    + 'Return ONLY valid JSON, no markdown fences, no explanation.';
  try {
    const res = await fetch('https://ltb-proxy.strickland-kevinj.workers.dev/parse-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
    });
    const raw = await res.text();
    const data = JSON.parse(raw);
    const text = (data.content || []).map(b => b.type === 'text' ? b.text : '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : clean);
  } catch { return null; }
}

// ─── CSV / Google Sheet import ──────────────────────────────────────────────
// Parse pasted spreadsheet text (tab- or comma-separated) into rows of cells.
// Handles quoted fields that may contain the delimiter or newlines.
export function parseDelimited(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const delim = text.includes('\t') ? '\t' : ',';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === delim) { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}

// Turn one spreadsheet row (header->value map) into a natural-language order
// string the existing AI parser can read. Skips timestamp/blank/"None" cells.
export function rowToOrderText(headerMap) {
  const parts = [];
  let customer = '';
  Object.entries(headerMap).forEach(([header, value]) => {
    const h = header.toLowerCase().trim();
    const v = String(value || '').trim();
    if (!v || v.toLowerCase() === 'none') return;
    if (h.includes('timestamp')) return;
    if ((h === 'name' || h.includes('your name')) && !customer) { customer = v; return; }
    parts.push(`${header}: ${v}`);
  });
  return { customer, text: parts.join('\n') };
}

