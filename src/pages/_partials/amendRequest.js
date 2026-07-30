// _partials/amendRequest.js — the customer's "change my order" surface.
//
// Reached from the landing page greeting, so it only exists for a browser Kevin
// has already recognised. There is no way in for a stranger, and that is the
// point: this page shows somebody their own order.
//
// THE ONE THING THE COPY MUST NEVER DO IS PROMISE
//
// Kevin decides. The customer is asking. So every string here says "request",
// "asked", and "waiting" — never "updated", "changed", or "done". A customer who
// believes their change landed and then receives the original order is a worse
// outcome than one who was told plainly that Kevin has to say yes first.
//
// It also never shows a new total as though it were settled. The estimate is
// labelled an estimate, because the real number is priced by the worker from
// the published menu when Kevin accepts.
//
// ES5, standalone, imports nothing.

(function () {
  if (typeof fetch !== 'function') return;

  var patch = [];
  var order = null;

  function esc(v) { return String(v == null ? '' : v).replace(/[<>&"]/g, ''); }

  function el(id) { return document.getElementById(id); }

  // Local estimate only, and labelled as one. The number that counts is the one
  // the worker derives from the published menu at decision time — a customer
  // page cannot be trusted with pricing and is not asked to be.
  function estimate() {
    if (!order) return null;
    var items = applyLocally();
    var total = 0, known = true;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var p = (window.__ltbPrices || {})[it.dishId + '|' + it.variant];
      if (typeof p !== 'number') { known = false; continue; }
      total += p * (it.qty || 0);
    }
    return known ? total : null;
  }

  function applyLocally() {
    var items = (order.items || []).map(function (i) { return { dishId: i.dishId, name: i.name, variant: i.variant, qty: i.qty }; });
    for (var i = 0; i < patch.length; i++) {
      var op = patch[i];
      var idx = -1;
      for (var j = 0; j < items.length; j++) {
        if (items[j].dishId === op.dishId && (op.variant == null || items[j].variant === op.variant)) { idx = j; break; }
      }
      if (op.op === 'setQty') {
        if (idx === -1) continue;
        if (op.qty === 0) items.splice(idx, 1);
        else items[idx].qty = op.qty;
      } else if (op.op === 'cancelOrder') {
        items = [];
      }
    }
    return items;
  }

  function render() {
    var box = el('amendBox');
    if (!box || !order) return;

    var items = applyLocally();
    var est = estimate();
    var html = '<div class="amend-title">Your order</div>';

    for (var i = 0; i < (order.items || []).length; i++) {
      var it = order.items[i];
      var now = null;
      for (var j = 0; j < items.length; j++) {
        if (items[j].dishId === it.dishId && items[j].variant === it.variant) { now = items[j]; break; }
      }
      var gone = !now;
      var changed = now && now.qty !== it.qty;
      html += '<div class="amend-row' + (gone ? ' amend-gone' : '') + '">'
        + '<span class="amend-name">' + esc(it.name) + (it.variant ? ' <span class="amend-var">' + esc(it.variant) + '</span>' : '') + '</span>'
        + '<span class="amend-qty">'
        + '<button type="button" class="amend-btn" data-act="dec" data-id="' + esc(it.dishId) + '" data-var="' + esc(it.variant || '') + '">&minus;</button>'
        + '<b>' + (gone ? 0 : now.qty) + '</b>'
        + '<button type="button" class="amend-btn" data-act="inc" data-id="' + esc(it.dishId) + '" data-var="' + esc(it.variant || '') + '">+</button>'
        + '</span></div>';
      if (changed || gone) {
        html += '<div class="amend-was">was ' + it.qty + '</div>';
      }
    }

    if (patch.length) {
      html += '<div class="amend-est">'
        + (est == null ? 'Kevin will confirm the new total.' : 'Estimated new total: $' + est + '. Kevin confirms the final amount.')
        + '</div>';
      html += '<textarea id="amendNote" class="amend-note" placeholder="Anything he should know? (optional)"></textarea>';
      html += '<button type="button" class="amend-send" id="amendSend">Send this request</button>';
      html += '<div class="amend-caveat">This is a request. Nothing changes until Kevin says yes.</div>';
    } else {
      html += '<div class="amend-hint">Adjust a quantity above to request a change.</div>';
    }

    box.innerHTML = html;
  }

  function bump(dishId, variant, delta) {
    var current = null;
    var items = applyLocally();
    for (var i = 0; i < items.length; i++) {
      if (items[i].dishId === dishId && items[i].variant === variant) { current = items[i].qty; break; }
    }
    if (current == null) current = 0;
    var next = Math.max(0, Math.min(20, current + delta));

    // One op per line, replaced rather than stacked. Sending three setQty ops
    // for the same dish because the customer tapped three times would be an
    // accurate log of their fidgeting and a terrible thing for Kevin to read.
    patch = patch.filter(function (o) { return !(o.op === 'setQty' && o.dishId === dishId && o.variant === variant); });

    var original = null;
    for (var k = 0; k < (order.items || []).length; k++) {
      if (order.items[k].dishId === dishId && order.items[k].variant === variant) { original = order.items[k].qty; break; }
    }
    if (next !== original) patch.push({ op: 'setQty', dishId: dishId, variant: variant, qty: next });
    render();
  }

  function send() {
    var token = (typeof __ltbDeviceToken === 'function') ? __ltbDeviceToken() : null;
    if (!token || !patch.length) return;
    var noteEl = el('amendNote');
    var btn = el('amendSend');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    fetch(WORKER + '/amendments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-LTB-Device': token },
      body: JSON.stringify({
        orderId: order.id,
        patch: patch,
        customerNote: noteEl ? noteEl.value : '',
        // Same idempotency shape the order form uses: a retry from a flaky
        // phone must produce one request, not three.
        idempotencyKey: 'amd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      })
    }).then(function (r) { return r.json(); }).then(function (j) {
      var box = el('amendBox');
      if (!box) return;
      if (j && j.ok) {
        // "Asked", not "changed". The order is exactly as it was.
        box.innerHTML = '<div class="amend-sent">Asked. Kevin will confirm before anything changes.</div>';
      } else {
        box.innerHTML = '<div class="amend-fail">That did not go through. Text Kevin instead.</div>';
      }
    }).catch(function () {
      var box = el('amendBox');
      // NEVER claim success offline. The order form queues submissions because
      // a missed order is recoverable; a missed change request that the customer
      // believes landed is not.
      if (box) box.innerHTML = '<div class="amend-fail">No connection, so nothing was sent. Text Kevin instead.</div>';
    });
  }

  window.__ltbAmendInit = function (currentOrder, prices) {
    order = currentOrder;
    window.__ltbPrices = prices || {};
    patch = [];
    render();
    var box = el('amendBox');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.id === 'amendSend') { send(); return; }
      if (t && t.className === 'amend-btn') {
        bump(t.getAttribute('data-id'), t.getAttribute('data-var') || null, t.getAttribute('data-act') === 'inc' ? 1 : -1);
      }
    });
  };
}());
