// src/customerDevice.js — recognising a returning customer without an account.
//
// THE PROBLEM THIS SOLVES, AND THE HONEST LIMIT OF IT
//
// Kevin approved a personalized weekly landing page on one condition: customers
// visit the SAME ordinary URL every week and get a view that is theirs, without
// making an account and without being sent a fresh private link.
//
// That is achievable with a per-browser credential, and it is NOT achievable on
// a brand-new device with no bridge. Nobody can identify a person on a phone
// that has never been here, with no cookie and no account, and this file does
// not pretend otherwise. A new phone needs one explicit one-time claim code.
// That is a real cost of the design, not a bug in it.
//
// WHAT THIS IS NOT
//
// Not a login. Not an account. Not a browser fingerprint — no canvas hashing,
// no font probing, no screen-size correlation. A random value this browser
// stores about itself, which the customer can clear at any time by tapping
// "Not you?". If they clear it they get the generic page, which works fine.
//
// SECURITY POSTURE
//
// The raw token is a bearer credential. It travels in a header, never a query
// string, so it stays out of Cloudflare's request logs and browser history. The
// worker stores only sha256(token) — a leak of the KV store therefore does not
// hand anyone a working credential. Nothing about the customer's name, address,
// or phone is used for identification, ever; those are convenience prefill and
// remain exactly that.

// ── Minting ─────────────────────────────────────────────────────────────────

export const DEVICE_KEY = 'ltb-customer-device';

// 32 bytes = 256 bits, comfortably past the 128-bit floor. base64url so it
// survives a header without escaping.
export function mintDeviceToken(cryptoImpl) {
  const c = cryptoImpl || (typeof crypto !== 'undefined' ? crypto : null);
  if (!c || !c.getRandomValues) return null;
  const bytes = new Uint8Array(32);
  c.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Reads the stored credential, minting one on first use. Returns null when
// storage is unavailable (private browsing, storage disabled), and the caller
// must treat that as "generic page" rather than as an error — personalization
// is progressive enhancement and its absence must never block ordering.
export function ensureDeviceToken(storage, cryptoImpl) {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return null;
  try {
    // The read is guarded SEPARATELY from the mint. A corrupted value used to
    // throw out of JSON.parse into the outer catch, which returned null — so a
    // single bad write left that browser permanently unrecognisable with no way
    // back except clearing storage by hand. A corrupt value should self-heal.
    let parsed = null;
    try {
      const raw = store.getItem(DEVICE_KEY);
      if (raw) parsed = JSON.parse(raw);
    } catch (e) { parsed = null; }

    if (parsed && typeof parsed.token === 'string' && parsed.token.length >= 20) {
      parsed.lastUsedAt = new Date().toISOString();
      store.setItem(DEVICE_KEY, JSON.stringify(parsed));
      return parsed.token;
    }
    const token = mintDeviceToken(cryptoImpl);
    if (!token) return null;
    store.setItem(DEVICE_KEY, JSON.stringify({
      token, createdAt: new Date().toISOString(), lastUsedAt: new Date().toISOString(),
    }));
    return token;
  } catch (e) {
    return null;
  }
}

// "Not you?" — clears ONLY this device's credential. Never touches the saved
// name/address prefill, which is a separate convenience the customer may still
// want, and never reaches the worker: revoking server-side is Kevin's action,
// not something a page visitor can trigger for someone else.
export function forgetDevice(storage) {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return false;
  try { store.removeItem(DEVICE_KEY); return true; } catch (e) { return false; }
}

// ── Owner-side records ──────────────────────────────────────────────────────
//
// A regular gains an opaque profileId, deliberately unrelated to their name or
// their regular id. It is what the worker keys personalization on, so a leak of
// worker data reveals no identity — just that some profile ordered some dishes.
export function ensureProfileId(regular, uuid) {
  if (regular && regular.customerProfileId) return regular.customerProfileId;
  const gen = uuid || (typeof crypto !== 'undefined' && crypto.randomUUID
    ? () => crypto.randomUUID()
    : () => 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36));
  return gen();
}

// Devices are shown to Kevin with anonymous labels. Deriving a rough label from
// the user agent is fine; storing the full string is not, because it is a
// fingerprint by another name.
export function deviceLabel(userAgent) {
  const ua = String(userAgent || '');
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android device';
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Safari/i.test(ua)) return 'Safari device';
  if (/Chrome/i.test(ua)) return 'Chrome device';
  return 'Device';
}

// ── Claim codes ─────────────────────────────────────────────────────────────
//
// The one-time bridge to a new phone. Short enough to read aloud, single use,
// and short-lived. NOT a weekly link — the handoff forbids those, and rightly:
// a link sent every week is an account with extra steps and worse security.
//
// Ambiguous characters are excluded (no O/0, no I/1) because Kevin will be
// reading these to people over the phone.
const CLAIM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CLAIM_TTL_MS = 15 * 60 * 1000;

export function generateClaimCode(cryptoImpl) {
  const c = cryptoImpl || (typeof crypto !== 'undefined' ? crypto : null);
  const n = 8;
  const out = [];
  if (c && c.getRandomValues) {
    const bytes = new Uint8Array(n);
    c.getRandomValues(bytes);
    for (const b of bytes) out.push(CLAIM_ALPHABET[b % CLAIM_ALPHABET.length]);
  } else {
    for (let i = 0; i < n; i++) out.push(CLAIM_ALPHABET[Math.floor(Math.random() * CLAIM_ALPHABET.length)]);
  }
  // Grouped for reading aloud.
  return out.slice(0, 4).join('') + '-' + out.slice(4).join('');
}

export function isClaimExpired(claim, now) {
  if (!claim || !claim.expiresAt) return true;
  return (now || Date.now()) > Date.parse(claim.expiresAt);
}

export function claimIsUsable(claim, now) {
  if (!claim) return { ok: false, reason: 'That code is not recognised.' };
  if (claim.used) return { ok: false, reason: 'That code has already been used.' };
  if (isClaimExpired(claim, now)) return { ok: false, reason: 'That code has expired. Ask Kevin for a new one.' };
  return { ok: true };
}

// ── The sanitized snapshot ──────────────────────────────────────────────────
//
// What a recognised customer's page is allowed to know. Built owner-side, where
// the trusted data lives, and shipped to the worker at publish time.
//
// EVERYTHING NOT LISTED HERE IS EXCLUDED ON PURPOSE: no address, no phone, no
// full order history, no regular id, no dietary prose, no journal. The customer
// page is a public surface and must stay one. The test asserts the absence of
// each of those fields rather than the presence of the allowed ones, because
// the failure that matters is a leak, not a gap.
//
// Annotations are keyed by dishId. Never by display name — a rename would
// otherwise silently drop a customer's whole history with a dish.
export function buildProfileSnapshot({ regular, orders, weekLabel, weekDishIds, now, currentOrder = null }) {
  const at = now || Date.now();
  const counts = new Map();
  const lastAt = new Map();

  for (const o of orders || []) {
    if (!o || o.regularId !== regular.id) continue;
    const when = Date.parse(o.date || o.createdAt || 0) || 0;
    for (const it of o.items || []) {
      const id = it.dishId;
      if (!id) continue;
      counts.set(id, (counts.get(id) || 0) + (Number(it.qty) || 1));
      if (when > (lastAt.get(id) || 0)) lastAt.set(id, when);
    }
  }

  const annotations = {};
  for (const id of weekDishIds || []) {
    const times = counts.get(id) || 0;
    const last = lastAt.get(id) || null;
    annotations[id] = {
      timesOrdered: times,
      lastHad: last ? new Date(last).toISOString().slice(0, 10) : null,
      newToYou: times === 0,
      // "One of your usuals" needs a real threshold or it means nothing. Three
      // is the smallest number that is not a coincidence.
      usual: times >= 3,
    };
  }

  // The live order, if there is one. Reduced to what the amend surface needs to
  // draw a row: nothing about price, address, or anyone else. The customer
  // already knows what they ordered — this is not a disclosure, it is a form.
  const live = currentOrder ? {
    id: currentOrder.id,
    items: (currentOrder.items || []).map(it => ({
      dishId: it.dishId || null,
      name: it.name || '',
      variant: it.variant || it.label || null,
      qty: Number(it.qty) || 0,
    })),
  } : null;

  return {
    greeting: String(regular.name || '').split(' ')[0] || '',
    weekLabel: String(weekLabel || ''),
    annotations,
    ...(live ? { currentOrder: live } : {}),
    generatedAt: new Date(at).toISOString(),
  };
}

// Belt and braces. Run over any snapshot before it leaves the app: if a future
// edit adds a field that carries PII, this strips it rather than shipping it.
const SNAPSHOT_ALLOWED = new Set(['greeting', 'weekLabel', 'annotations', 'generatedAt', 'currentOrder']);
export function sanitizeSnapshot(snap) {
  if (!snap || typeof snap !== 'object') return null;
  const out = {};
  for (const k of Object.keys(snap)) if (SNAPSHOT_ALLOWED.has(k)) out[k] = snap[k];
  return out;
}
