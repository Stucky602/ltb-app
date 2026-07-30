// "Want a dish back?" — one implementation, used by the order form.
//
// MOVED FROM THE WEEKLY MENU (Kevin, Jul 30). It lived on menu.html, which is
// the browsing page, and the ask belongs where somebody is already in the act of
// telling him what they want. A person reading the menu is deciding; a person on
// the form has decided, and that is the moment they notice what is missing.
//
// Trust-based and anonymous, exactly as before: no name, no device, no order
// attached. It is a request, not an order, and the wording carries that — a
// different verb and a different colour from everything else on the page.
//
// Built from ALL_DINNER_NAMES (the whole registry) rather than the published
// week, because asking for a dish that IS on this week is not a request, it is
// an order, and there is a button for that already.
function requestBoxHtml() {
  if (typeof ALL_DINNER_NAMES === 'undefined' || !ALL_DINNER_NAMES.length) return '';
  var opts = ALL_DINNER_NAMES.map(function (n) {
    return '<option value="' + n.replace(/"/g, '&quot;') + '">' + n + '</option>';
  }).join('');
  return '<div class="request-box" id="requestBox">'
    + '<div class="request-head">Want a dish back?</div>'
    + '<div class="request-sub">Not an order &mdash; just tell me what you&rsquo;re hoping to see. No promises, but it helps me plan.</div>'
    + '<select id="requestSelect"><option value="">Pick a dish&hellip;</option>' + opts + '</select>'
    + '<input id="requestNote" type="text" maxlength="200" placeholder="Optional note (why, when, etc.)" />'
    + '<button id="requestBtn" type="button">Send request</button>'
    + '<div class="request-done" id="requestDone"></div>'
    + '</div>';
}

// Wired AFTER the DOM exists. Called from the render path, not on load.
function wireRequestBox() {
  var rb = document.getElementById('requestBtn');
  if (!rb || rb.__wired) return;
  rb.__wired = true;
  rb.addEventListener('click', function () {
    var sel = document.getElementById('requestSelect');
    var note = document.getElementById('requestNote');
    var done = document.getElementById('requestDone');
    var dish = sel ? sel.value : '';
    if (!dish) { done.textContent = 'Pick a dish first.'; done.className = 'request-done err'; return; }
    rb.disabled = true;
    fetch(WORKER + '/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dish: dish, note: note ? note.value : '' })
    }).then(function (r) {
      if (!r.ok) throw new Error('bad');
      done.textContent = 'Got it \u2014 thanks. I\u2019ll take it into account.';
      done.className = 'request-done ok';
      if (sel) sel.value = '';
      if (note) note.value = '';
    }).catch(function () {
      // Never claims success it did not get. A request that silently vanished
      // is worse than one the person knows to send again.
      done.textContent = 'That did not send. Try again in a moment.';
      done.className = 'request-done err';
    }).then(function () { rb.disabled = false; });
  });
}
