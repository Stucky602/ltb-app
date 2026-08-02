// _partials/requestScope.js — "no mushrooms" for this order, or from now on?
//
// THE PROBLEM IT SOLVES
// A customer writes "no mushrooms" in the notes box. Kevin cannot tell whether
// that means tonight's order, this week, or a standing fact about that
// household, and guessing either way is wrong in a way that matters: treating a
// one-off as permanent quietly narrows their menu forever, and treating a
// standing restriction as a one-off serves them something they cannot eat.
//
// So the page asks, once, at the moment they wrote it.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE ORIGINAL NOTE IS NEVER TOUCHED
//
// Scope is ADDITIVE metadata sent alongside the note, not a rewrite of it and
// not a replacement for it. Kevin reads what they actually typed, in their
// words, exactly as before. If this whole file failed to load, the order would
// submit identically minus one field.
//
// ═══════════════════════════════════════════════════════════════════════════
// A FUTURE SCOPE IS A PROPOSAL, NOT A SETTING
//
// Choosing "from now on" does not write anything to a profile. It marks the
// note as a PROPOSED standing preference which Kevin confirms on his side. A
// customer must not be able to permanently reconfigure what they are offered by
// typing a sentence, and Kevin must not discover a silent profile change three
// weeks later when a dish stops appearing.
//
// ═══════════════════════════════════════════════════════════════════════════
// DETECTION IS DELIBERATELY DUMB, AND FAILS TOWARD SILENCE
//
// A fixed list of restriction phrasings, no model and no cleverness. Two
// failure modes and they are not symmetric: a false positive asks a question
// the customer can ignore, and a miss changes nothing at all from today's
// behaviour. Both are survivable, so the matching stays conservative and
// explainable rather than reaching for everything that might be a restriction.
//
// "Extra napkins" and "leave it on the porch" must not trigger it. That is why
// this matches restriction VERBS and allergen words rather than anything that
// looks like an instruction.
//
// ES5, standalone, imports nothing.

(function () {
  // Ordered most to least specific. Each entry is a regex and the reason it is
  // here, so a future reader can tell why a phrase matched.
  var PATTERNS = [
    /\ballerg/i,               // allergic, allergy, allergies
    /\bintoleran/i,            // intolerant, intolerance
    /\bcoeliac\b|\bceliac\b/i,
    /\bcan'?t\s+(eat|have|do)\b/i,
    /\b(no|without)\s+[a-z]/i, // "no mushrooms", "without dairy"
    /\bhold\s+the\b/i,
    /\bleave\s+out\b/i,
    /\bavoid\b/i,
    /\bfree\b/i,               // dairy-free, gluten free
    /\bsub(stitute)?\b/i,
  ];

  function looksLikeRestriction(text) {
    var t = String(text || '').trim();
    if (t.length < 3) return false;
    for (var i = 0; i < PATTERNS.length; i++) {
      if (PATTERNS[i].test(t)) return true;
    }
    return false;
  }

  // The chosen scope, or '' when the question was never asked or never
  // answered. Read by the submit path.
  var chosen = '';

  function currentScope() { return chosen; }

  function scopeRowHtml() {
    return '<div id="scopeRow" style="display:none;margin-top:10px;padding:10px 12px;'
      + 'background:rgba(212,160,80,0.08);border:1px solid #4a3a1e;border-radius:10px;">'
      + '<div style="font-size:13px;color:#e8ede9;font-weight:600;margin-bottom:2px;">'
      + 'Just so I get this right</div>'
      + '<div style="font-size:12px;color:#9aa5a0;line-height:1.5;margin-bottom:8px;" id="scopeAsk">'
      + 'Is that for this order, or something I should remember?</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
      + '<button type="button" class="scope-btn" data-scope="order">Just this order</button>'
      + '<button type="button" class="scope-btn" data-scope="standing">Every order</button>'
      + '</div>'
      // Says plainly that choosing "every order" does not change anything by
      // itself. A customer who thinks they have set a permanent preference and
      // has not is worse off than one who was never offered the option.
      + '<div style="font-size:11px;color:#7a8480;margin-top:7px;line-height:1.45;" id="scopeNote">'
      + 'Either way your note reaches me exactly as you wrote it.</div>'
      + '</div>';
  }

  function wireScope() {
    var notes = document.getElementById('custNotes');
    var row = document.getElementById('scopeRow');
    if (!notes || !row || notes.__scopeWired) return;
    notes.__scopeWired = true;

    function reconsider() {
      var hit = looksLikeRestriction(notes.value);
      row.style.display = hit ? 'block' : 'none';
      // Clearing the note clears the answer: a scope left behind from text the
      // customer deleted would describe a restriction that is no longer there.
      if (!hit) {
        chosen = '';
        setPressed(null);
      }
    }

    function setPressed(scope) {
      var btns = row.getElementsByClassName('scope-btn');
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute('data-scope') === scope;
        btns[i].style.background = on ? 'var(--teal-mid)' : '#232d2a';
        btns[i].style.color = on ? '#fff' : '#c9d1cd';
      }
      var note = document.getElementById('scopeNote');
      if (!note) return;
      if (scope === 'standing') {
        note.textContent = 'I will make a note to remember it going forward. '
          + 'Nothing changes on your account automatically \u2014 I will confirm it myself.';
      } else if (scope === 'order') {
        note.textContent = 'Just this one. Your note reaches me exactly as you wrote it.';
      } else {
        note.textContent = 'Either way your note reaches me exactly as you wrote it.';
      }
    }

    notes.addEventListener('input', reconsider);
    notes.addEventListener('blur', reconsider);

    var btns = row.getElementsByClassName('scope-btn');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          chosen = btn.getAttribute('data-scope');
          setPressed(chosen);
        });
      })(btns[i]);
    }
    reconsider();
  }

  window.__ltbScopeRowHtml = scopeRowHtml;
  window.__ltbWireScope = wireScope;
  window.__ltbNoteScope = currentScope;
  window.__ltbLooksLikeRestriction = looksLikeRestriction;
})();
