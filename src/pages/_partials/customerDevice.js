// _partials/customerDevice.js — the customer half of device identity.
//
// ES5 and standalone on purpose: form.html and order.html are hand-written
// pages that no bundler touches, so they cannot import src/customerDevice.js.
// The two files do different jobs and barely overlap — this one mints, stores,
// and forgets; the app-side module binds, revokes, and builds snapshots. Keep
// it that way. If they ever need to share logic, generate this from that rather
// than copying by hand.
//
// WHAT THIS IS: a random value this browser stores about itself, so Kevin's
// site can greet a returning customer without an account and without a private
// weekly link.
//
// WHAT IT IS NOT: a login, and not a fingerprint. No canvas hashing, no font
// probing, nothing derived from the device at all. The customer can clear it
// whenever they like and the site keeps working.

(function () {
  var KEY = 'ltb-customer-device';

  function mint() {
    try {
      if (!window.crypto || !window.crypto.getRandomValues) return null;
      var bytes = new Uint8Array(32);
      window.crypto.getRandomValues(bytes);
      var bin = '';
      for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) { return null; }
  }

  // Returns the token, minting on first use. Returns null when storage is
  // unavailable (private browsing), and every caller must treat null as
  // "generic page" rather than as an error. Personalization is an enhancement;
  // it must never be able to block ordering.
  window.__ltbDeviceToken = function () {
    try {
      // Read guarded separately from mint, so a corrupted value self-heals
      // instead of leaving this browser permanently unrecognisable.
      var parsed = null;
      try {
        var raw = localStorage.getItem(KEY);
        if (raw) parsed = JSON.parse(raw);
      } catch (e2) { parsed = null; }

      if (parsed && typeof parsed.token === 'string' && parsed.token.length >= 20) {
        parsed.lastUsedAt = new Date().toISOString();
        localStorage.setItem(KEY, JSON.stringify(parsed));
        return parsed.token;
      }
      var token = mint();
      if (!token) return null;
      localStorage.setItem(KEY, JSON.stringify({
        token: token,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      }));
      return token;
    } catch (e) { return null; }
  };

  // "Not you?" — clears this device's credential only. Deliberately does NOT
  // clear the saved name and address prefill, which is a separate convenience
  // the person may still want, and deliberately does not tell the worker:
  // revoking server-side is Kevin's action, not something a visitor can do.
  window.__ltbForgetDevice = function () {
    try { localStorage.removeItem(KEY); return true; } catch (e) { return false; }
  };
}());
