// carlFilter.js — the Carl toggle on the customer catalog.
//
// Reads ONLY attributes stamped onto each card by tools/syncMainMenu.mjs from
// src/carl.js. There is no allergen logic in here and there must never be: a
// second copy of the rules on the client is a second copy that can be wrong,
// and the one that is wrong is the one nobody tests. This file shows, hides,
// and prints a line. That is all.
//
//   data-carl="ok|swap|no"   worst-case verdict across the card's variants
//   data-carl-say="..."      the yellow line, already composed
//   data-carl-dead="0,3"     indices of price rows that are dead for Carl,
//                            positional against the card's own price rows
//                            (the same positional contract syncMainMenu uses
//                            to rewrite prices, so the two cannot disagree)
//
// IT HIDES WITH A CLASS, NOT style.display. The catalog's diet and cuisine
// filters already own style.display on these same cards. The first version of
// this used style.display too and silently broke the diet filter: every
// __carlApply pass reset display to '' and un-hid everything the diet filter
// had just hidden. tests/customer_pages.mjs caught it. Classes compose, inline
// styles fight, so the two filters now cannot interfere with each other and no
// re-apply hook is needed after a catalog filter runs.
//
// ES5 on purpose. These pages carry no build step and no polyfills.
var __carlOn = false;

function __carlCards() {
  return document.querySelectorAll('.dish[data-carl]');
}

function __carlApply() {
  var cards = __carlCards();
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var verdict = card.getAttribute('data-carl') || 'no';
    var say = card.getAttribute('data-carl-say') || '';
    var deadRows = (card.getAttribute('data-carl-dead') || '').split(',');

    // Dead cards disappear entirely. A menu of things he cannot have is a list
    // of disappointments (Kevin's call, Jul 29).
    var cbase = card.className.replace(/\s*carl-hidden/g, '');
    card.className = (__carlOn && verdict === 'no') ? cbase + ' carl-hidden' : cbase;

    // Per-variant deadness: hide just those price rows. The chickpea curry is
    // the case this exists for — the chicken and shrimp versions are fine.
    // Both row shapes: the two menus render .prices .price-row, the order form
    // renders .variant-row. One selector so the partial serves all three
    // surfaces rather than being forked per page.
    var rows = card.querySelectorAll('.prices .price-row, .variant-row');
    for (var r = 0; r < rows.length; r++) {
      var isDead = false;
      for (var d = 0; d < deadRows.length; d++) {
        if (deadRows[d] !== '' && Number(deadRows[d]) === r) isDead = true;
      }
      var base = rows[r].className.replace(/\s*carl-hidden/g, '');
      rows[r].className = (__carlOn && isDead) ? base + ' carl-hidden' : base;
    }

    // The yellow line. Created once, then shown or hidden.
    var line = card.querySelector('.carl-say');
    if (__carlOn && say) {
      if (!line) {
        line = document.createElement('div');
        line.className = 'carl-say';
        var prices = card.querySelector('.prices');
        if (prices) card.insertBefore(line, prices);
        else card.appendChild(line);
      }
      line.textContent = say;
      line.style.display = '';
    } else if (line) {
      line.style.display = 'none';
    }
  }
}

function __carlToggle() {
  __carlOn = !__carlOn;
  var btn = document.getElementById('carlChip');
  if (btn) {
    btn.className = 'cat-chip' + (__carlOn ? ' on' : '');
    btn.setAttribute('aria-pressed', __carlOn ? 'true' : 'false');
  }
  var note = document.getElementById('carlNote');
  if (note) note.style.display = __carlOn ? '' : 'none';
  __carlApply();
}

// EXPORTED TO window EXPLICITLY. This partial is included inside the catalog's
// filter IIFE, so these are closure-scoped by default — and an inline
// onclick="__carlToggle()" resolves against the global scope, not the closure.
// So the button silently did nothing until this was added. Same reason the
// catalog's own filter does window.__catFilter = ... rather than relying on a
// bare function declaration.
window.__carlToggle = __carlToggle;
window.__carlApply = __carlApply;
