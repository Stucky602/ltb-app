// _partials/household.js — the two things a customer tells Kevin about
// themselves: that they are away, and how many jars they are holding.
//
// BOTH ARE OPT-IN AND BOTH ARE REVERSIBLE. Neither is a score, a streak, or a
// nudge. Away is availability the CUSTOMER controls — a "quiet customer" list
// was proposed for the owner side and correctly declined, and this is the
// opposite of that: the person says it, sees it, and can undo it in one tap.
//
// The jar line exists because people genuinely forget, not to shame anyone into
// returning them. So it states a number and offers to note an intention. There
// is no consequence attached to any of the answers, including "not this week".
//
// CONTEXT, NOT CONFIGURATION. Neither block renders unless it has something to
// say: no jars means no jar row, and the away control only appears once the
// flag is on. That is the pattern the amend surface already follows and the
// reason the landing page has not become a settings screen.
//
// ES5, standalone, imports nothing.

(function () {
  function el(id) { return document.getElementById(id); }
  function esc(v) { return String(v == null ? '' : v).replace(/[<>&"]/g, ''); }

  function describeAway(a) {
    if (!a || !a.kind) return '';
    if (a.kind === 'until') return 'Away until ' + esc(String(a.until).slice(0, 10));
    if (a.kind === 'menus') return 'Away for the next ' + a.remaining + ' menu' + (a.remaining === 1 ? '' : 's');
    return 'Away this week';
  }

  function post(away, done) {
    var token = (typeof __ltbDeviceTokenPeek === 'function') ? __ltbDeviceTokenPeek() : null;
    if (!token) { done(false); return; }
    fetch(WORKER + '/customer-away', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-LTB-Device': token },
      body: JSON.stringify({ away: away })
    }).then(function (r) { return r.json(); })
      .then(function (j) { done(!!(j && j.ok), j && j.away); })
      // Never claims it landed when it did not. Somebody who believes Kevin
      // knows they are away, when he does not, gets food they cannot use.
      .catch(function () { done(false); });
  }

  function renderAway(state) {
    var box = el('householdAway');
    if (!box) return;
    if (state) {
      box.innerHTML = '<div class="hh-active">' + describeAway(state)
        + '<button type="button" id="hhBack">I&rsquo;m back</button></div>';
      el('hhBack').addEventListener('click', function () {
        el('hhBack').disabled = true;
        post(null, function (ok) {
          if (ok) renderAway(null);
          else { el('hhBack').disabled = false; box.insertAdjacentHTML('beforeend', '<div class="hh-fail">That did not save. Try again.</div>'); }
        });
      });
      return;
    }
    box.innerHTML = '<button type="button" class="hh-link" id="hhAwayOpen">Going to be away?</button>'
      + '<div id="hhAwayPick" style="display:none">'
      + '<button type="button" class="hh-opt" data-kind="week">Just this week</button>'
      + '<button type="button" class="hh-opt" data-kind="menus" data-n="3">Next three menus</button>'
      + '<button type="button" class="hh-opt" data-kind="until">Until a date</button>'
      + '<input type="date" id="hhUntil" style="display:none" />'
      + '<div class="hh-note">You can still order any week you like. This just tells Kevin not to expect you.</div>'
      + '</div>';

    el('hhAwayOpen').addEventListener('click', function () {
      el('hhAwayPick').style.display = '';
      el('hhAwayOpen').style.display = 'none';
    });

    var opts = box.querySelectorAll('.hh-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].addEventListener('click', function (e) {
        var kind = e.target.getAttribute('data-kind');
        if (kind === 'until') {
          var d = el('hhUntil');
          d.style.display = '';
          d.focus();
          d.onchange = function () {
            if (!d.value) return;
            post({ kind: 'until', until: d.value }, function (ok, saved) { if (ok) renderAway(saved); });
          };
          return;
        }
        var payload = kind === 'menus' ? { kind: 'menus', remaining: 3 } : { kind: 'week' };
        post(payload, function (ok, saved) { if (ok) renderAway(saved); });
      });
    }
  }

  function renderJars(count) {
    var box = el('householdJars');
    if (!box || !count) return;   // no jars, no row
    box.innerHTML = '<span class="hh-jars">Jars at your place: <b>' + count + '</b></span>'
      + '<button type="button" class="hh-link" id="hhJarsBack">Bringing them back</button>';
    el('hhJarsBack').addEventListener('click', function () {
      // Deliberately does NOT change the ledger. Kevin's count is the real one
      // and is reconciled on delivery; this is a heads-up, not an accounting
      // entry, and two sources for the same number is how they disagree.
      var token = (typeof __ltbDeviceTokenPeek === 'function') ? __ltbDeviceTokenPeek() : null;
      if (!token) return;
      el('hhJarsBack').disabled = true;
      fetch(WORKER + '/customer-away', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-LTB-Device': token },
        body: JSON.stringify({ jarsReturning: count })
      }).then(function () {
        box.innerHTML = '<span class="hh-jars">Thanks &mdash; Kevin will look out for ' + count + '.</span>';
      }).catch(function () {
        el('hhJarsBack').disabled = false;
      });
    });
  }

  // Called by personalize.js once it knows who this is and what is switched on.
  window.__ltbHousehold = function (data) {
    if (!data) return;
    if (typeof __ltbFlag === 'function' && __ltbFlag('awayMode')) renderAway(data.away || null);
    if (typeof __ltbFlag === 'function' && __ltbFlag('jarReturn')) renderJars(Number(data.jarsOut) || 0);
  };
}());
