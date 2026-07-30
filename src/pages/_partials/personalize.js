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
        at: Date.now()
      }));
    } catch (e) { /* no storage: the form simply shows the generic view */ }
  }

  function clearStash() {
    try { sessionStorage.removeItem('ltb-personal'); } catch (e) {}
  }

  try {
    var token = (typeof __ltbDeviceToken === 'function') ? __ltbDeviceToken() : null;
    // No credential means a browser that has never ordered. Do NOT mint one
    // here: a person who is only reading the menu should not be carrying a
    // credential, and minting on page load would give one to every visitor.
    if (!token) return;

    fetch(WORKER + '/customer-home', { headers: { 'X-LTB-Device': token } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || data.recognized !== true) { clearStash(); return; }

        var slot = el('weekNotice');
        if (!slot) return;
        // Inserted BEFORE the notice rather than replacing it. The week's
        // heads-up banner is more important than a greeting and must not be
        // displaced by one.
        slot.insertAdjacentHTML('beforebegin', greetingHtml(data.greeting, data.weekLabel));
        stash(data);

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
