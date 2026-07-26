// Sun(0) and Wed-Sat(3-6) open, Mon and Tue closed. The other half of the
// reason this build step exists: this rule was added to three pages
// separately, one copy was missed, and someone ordered on a Monday.
// `?preview=1` bypasses it so Kevin can check any page on any day.
function ordersOpen() {
  if (/[?&]preview=1/.test(window.location.search)) return true;
  var d = new Date().getDay();
  return d === 0 || d >= 3;
}
