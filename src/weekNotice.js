// weekNotice.js — the "heads up this week" banner, publish side.
//
// THE BUG THIS FIXES: checking "Show a heads-up banner this week" and hitting
// publish landed on no customer page at all. WeekTab was never at fault — it
// correctly passes `extras.notice` on BOTH publish paths (normal and paused),
// already separating the TEXT from the arm-switch and already sending '' when
// unchecked. The break was entirely in publishWeek: it accepted `extras`, used
// it for requestCounts and favorites, and built a payload with no notice field
// of any kind. The value died there, so nothing downstream could show it.
// (The customer pages also rendered no notice, and order.html did not even
// fetch /config — fixed on their side.)
//
// THE CLEAR CONTRACT, which is the subtle half: an unchecked box publishes an
// EMPTY notice rather than omitting the field, and that empty value actively
// CLEARS whatever banner is currently showing. Same rule pausedMsg already
// follows. Without it, a banner would outlive its week just because the words
// were still sitting in the box.

// Long enough for a real message, short enough that it cannot become an essay
// that pushes the menu off the screen. pausedMsg uses 200; a notice carries
// more (delivery changes, substitutions), so 280.
export const NOTICE_MAX = 280;

export function normalizeNotice(raw) {
  if (raw == null) return '';
  if (typeof raw === 'boolean') return ''; // a bare flag carries no message
  return String(raw).trim().slice(0, NOTICE_MAX);
}

// WeekTab sends `extras.notice` as an already-trimmed string, or '' when the
// box is unchecked. Anything else normalizes to '' — which clears, and is the
// safe direction: a malformed publish should never strand a stale banner on a
// customer page.
export function extractNotice(pausedOpts, extras) {
  if (!extras || typeof extras !== 'object') return '';
  return normalizeNotice(extras.notice);
}
