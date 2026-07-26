// HTML escaping for anything that reaches a customer's screen. Shared because
// a page that escapes LESS than its neighbours is the bug, not a style
// difference — and that is invisible until someone publishes a notice with an
// apostrophe in it.
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
