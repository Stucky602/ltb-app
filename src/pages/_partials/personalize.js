// _partials/personalize.js — the returning-customer greeting on order.html.
//
// PROGRESSIVE ENHANCEMENT, AND THIS IS NOT NEGOTIABLE
//
// The generic page renders first and completely. This runs afterwards and adds
// to it. If the worker is down, the fetch is slow, the customer cleared their
// storage, Kevin revoked the device, or the browser blocks storage entirely,
// the page stays exactly what it is today — a working ordering page.
//
// That is why /customer-home answers 200 with recognized:false on every failure
// path instead of an error status. There is no state in which this file can
// make the page look broken, and there is no state in which a customer cannot
// order because personalization failed.
//
// WHAT IT IS ALLOWED TO KNOW: a first name, the week label, and per-dish
// annotations keyed by dishId. The worker sends nothing else, the owner app
// strips anything else before publishing, and this file would have nothing to
// do with an address even if one arrived.
//
// ES5, standalone, imports nothing. order.html is hand-written and no bundler
// touches it.

(function () {
  if (typeof fetch !== 'function') return;

  // FLAGS. The worker evaluates them for this person and sends booleans. An
  // absent answer means OFF for optional things — a page that cannot reach the
  // worker should show the plain menu rather than half a feature.
  //
  // Nothing about ORDERING is gated. See NEVER_FLAGGED in src/featureFlags.js.
  window.__ltbFlags = {};
  window.__ltbFlag = function (id) { return window.__ltbFlags[id] === true; };

  function el(id) { return document.getElementById(id); }

  function greetingHtml(name, weekLabel) {
    var who = String(name || '').replace(/[<>&"]/g, '');
    if (!who) return '';
    return '<div class="personal-greeting">'
      + '<span class="pg-hi">Hi ' + who + '.</span>'
      + (weekLabel ? ' <span class="pg-week">' + String(weekLabel).replace(/[<>&"]/g, '') + '</span>' : '')
      + '<button type="button" class="pg-forget" id="pgForget">Not you?</button>'
      + '</div>';
  }

  // Annotations ride to form.html in sessionStorage rather than being rendered
  // here, because THIS page does not list dishes — it is a door. The order form
  // is where "new to you" and "one of your usuals" actually mean something next
  // to a dish. sessionStorage rather than a query string: a URL carrying
  // someone's ordering history is a URL that gets shared, screenshotted, and
  // logged.
  function stash(payload) {
    try {
      sessionStorage.setItem('ltb-personal', JSON.stringify({
        greeting: payload.greeting || '',
        weekLabel: payload.weekLabel || '',
        annotations: payload.annotations || {},
        flags: window.__ltbFlags || {},
        at: Date.now()
      }));
    } catch (e) { /* no storage: the form simply shows the generic view */ }
  }

  function clearStash() {
    try { sessionStorage.removeItem('ltb-personal'); } catch (e) {}
  }

  // ── Claim a code ─────────────────────────────────────────────────────────
  //
  // THE ANSWER TO "where does a returning customer on a new phone enter this?"
  // Nowhere, until now — the owner app could generate a code and the worker
  // could redeem one, and there was no box. A feature with no door.
  //
  // The link is deliberately quiet and only appears when this browser is NOT
  // recognised, which is the only moment it means anything. Someone already
  // greeted by name has no use for it, and a permanent "enter a code" prompt on
  // a friends-only site reads like a login wall.
  function claimUi() {
    var slot = el('weekNotice');
    if (!slot) return;
    slot.insertAdjacentHTML('beforebegin',
      '<div class="pg-claim" id="pgClaim">'
      + '<button type="button" id="pgClaimOpen">Ordered before, on a different phone?</button>'
      + '<div id="pgClaimForm" style="display:none">'
      + '<input id="pgClaimCode" type="text" inputmode="text" autocapitalize="characters" '
      + 'maxlength="9" placeholder="ABCD-EFGH" />'
      + '<button type="button" id="pgClaimGo">Connect</button>'
      + '<div id="pgClaimMsg"></div>'
      + '</div></div>');

    el('pgClaimOpen').addEventListener('click', function () {
      el('pgClaimForm').style.display = '';
      el('pgClaimOpen').style.display = 'none';
      el('pgClaimCode').focus();
    });

    el('pgClaimGo').addEventListener('click', function () {
      var code = (el('pgClaimCode').value || '').trim().toUpperCase();
      var msg = el('pgClaimMsg');
      if (code.length < 8) { msg.textContent = 'That code looks too short.'; return; }

      // Minting the credential HERE is the point: the code binds this browser,
      // so this browser needs one before it asks. Everywhere else in the app a
      // token is only minted at order time, and this is the one exception.
      var token = (typeof __ltbDeviceToken === 'function') ? __ltbDeviceToken() : null;
      if (!token) { msg.textContent = 'This browser will not let the site remember you.'; return; }

      el('pgClaimGo').disabled = true;
      msg.textContent = 'Checking\u2026';
      fetch(WORKER + '/customer-device/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-LTB-Device': token },
        body: JSON.stringify({ code: code })
      }).then(function (r) {
        return r.json().then(function (j) { return { ok: r.ok, body: j }; });
      }).then(function (res) {
        if (res.ok && res.body && res.body.ok) {
          msg.textContent = 'Connected. One moment\u2026';
          window.location.reload();
          return;
        }
        // The worker's own wording, which distinguishes expired from used from
        // unrecognised. A single "that did not work" would send someone back to
        // Kevin for a new code when the real problem is a typo.
        msg.textContent = (res.body && res.body.error)
          ? res.body.error.charAt(0).toUpperCase() + res.body.error.slice(1) + '.'
          : 'That did not work. Ask Kevin for a fresh code.';
        el('pgClaimGo').disabled = false;
      }).catch(function () {
        msg.textContent = 'No connection. Try again in a moment.';
        el('pgClaimGo').disabled = false;
      });
    });
  }

  try {
    // PEEK, not mint. The minting version created a credential for anyone who
    // opened the page, which meant the branch below could never be reached and
    // every menu-reader was quietly enrolled. Minting belongs at order time and
    // in the claim handler, nowhere else.
    var token = (typeof __ltbDeviceTokenPeek === 'function') ? __ltbDeviceTokenPeek() : null;
    // No credential means a browser that has never ordered. Do NOT mint one
    // here: a person who is only reading the menu should not be carrying a
    // credential, and minting on page load would give one to every visitor.
    // No credential means this browser has never ordered. Offer the code path
    // and stop. Do NOT mint one here: a person reading the menu should not be
    // carrying a credential they never asked for.
    if (!token) { if (window.__ltbFlag('claimCode')) claimUi(); return; }

    fetch(WORKER + '/customer-home', { headers: { 'X-LTB-Device': token } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        // Flags land even when the browser is unrecognised — that is exactly
        // when the claim-code path matters, and gating it on recognition would
        // make it unreachable for the only people who need it.
        if (data && data.flags) window.__ltbFlags = data.flags;
        if (!data || data.recognized !== true) {
          // Has a token but the worker does not know it: a new device that
          // ordered once and was never linked, or one Kevin revoked. Either way
          // the code is the way back.
          clearStash();
          if (window.__ltbFlag('claimCode')) claimUi();
          return;
        }

        if (!window.__ltbFlag('personalization')) return;
        var slot = el('weekNotice');
        if (!slot) return;
        // Inserted BEFORE the notice rather than replacing it. The week's
        // heads-up banner is more important than a greeting and must not be
        // displaced by one.
        slot.insertAdjacentHTML('beforebegin', greetingHtml(data.greeting, data.weekLabel));
        stash(data);

        // The amend surface appears only for a recognised customer who has a
        // live order this week. Everyone else never sees it exist.
        if (window.__ltbFlag('amendments') && data.currentOrder && typeof __ltbAmendInit === 'function') {
          var box = el('amendBox');
          if (box) {
            box.style.display = '';
            __ltbAmendInit(data.currentOrder, data.prices || {});
          }
        }

        // Household blocks. They read their own flags and render nothing when
        // they have nothing to say.
        if (typeof __ltbHousehold === 'function') __ltbHousehold(data);

        var btn = el('pgForget');
        if (btn) {
          btn.addEventListener('click', function () {
            if (!window.confirm('Forget this device? You will see the standard page from now on.')) return;
            if (typeof __ltbForgetDevice === 'function') __ltbForgetDevice();
            clearStash();
            window.location.reload();
          });
        }
      })
      .catch(function () { /* worker down — the page is exactly as it was */ });
  } catch (e) { /* anything unexpected: stay generic */ }
}());
