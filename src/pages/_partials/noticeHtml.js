// The week's heads-up banner. Absent or empty renders nothing at all, so
// publishing an unchecked week clears it and a stale message can never linger.
// This had to be added to three pages by hand and one copy was missed, which
// is half the reason the build step exists.
function noticeHtml(cfg) {
  var t = (cfg && cfg.notice) ? String(cfg.notice).trim() : "";
  if (!t) return "";
  return '<div class="week-notice"><b>Heads up this week</b>' + esc(t) + '</div>';
}
