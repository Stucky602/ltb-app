// The week-off notice. ONE renderer, used by all three customer pages.
//
// WHY THIS IS A PARTIAL AND NOT THREE COPIES
//
// It was three copies, and they had already drifted: form.html and menu.html
// each carried their own hardcoded stock sentence about there being no menu,
// with slightly different markup, and order.html — the landing page, the one a
// customer opens first — had NO paused handling at all. So the site announced a
// week off on two pages out of three, in two different wordings, neither of
// which was what Kevin typed.
//
// The old wording is deliberately NOT quoted anywhere in this file. Partials are
// inlined into the built pages, comments and all, and a test asserting that the
// stock sentence is gone would match this comment and fail. That has now
// happened three times in one day, always the same way.
//
// That is the same failure noticeHtml.js exists to prevent, and its header
// already says so: "This had to be added to three pages by hand and one copy
// was missed, which is half the reason the build step exists."
//
// KEVIN'S RULING, Jul 30: the heading is "Taking some time off" — TIME, not
// week, because a week off is not always a week — and the body is EXACTLY what
// he typed and nothing else. No boilerplate prepended, no sentence he did not
// write. If he types nothing, the heading stands alone rather than inventing a
// reason on his behalf.
function pausedHtml(cfg) {
  if (!cfg || !cfg.paused) return "";
  var msg = cfg.pausedMsg ? String(cfg.pausedMsg).trim() : "";
  return '<div class="week-off"><b>Taking some time off</b>'
    + (msg ? '<p>' + esc(msg) + '</p>' : '')
    + '</div>';
}
