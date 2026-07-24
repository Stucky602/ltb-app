// usePreserveScroll.js — P3: the list jumps to the top after an action.
//
// THE PROBLEM: marking an order paid (or any state change that re-renders a
// long list) can leave the page scrolled somewhere other than where Kevin
// was looking. He taps something forty orders down, the list re-renders, and
// he has to find his place again. Mid-cook, with one hand, that is worse
// than it sounds.
//
// THE MECHANISM: capture window.scrollY the instant BEFORE a state change,
// then restore it in useLayoutEffect after React has committed the new DOM
// but BEFORE the browser paints. useEffect would be too late — the browser
// would paint the jumped position first and the correction would show as a
// visible flicker. useLayoutEffect is the whole reason this works.
//
// Deliberately NOT a scroll-anchoring library or a MutationObserver: the
// only case that matters here is "an action Kevin took re-rendered the list
// he is looking at," and that case knows exactly when it happens, so it can
// just say so.
import { useRef, useLayoutEffect, useCallback } from 'react';

export function usePreserveScroll(dep) {
  // null means "nothing to restore" — the common case. Only a call to
  // capture() arms it, so ordinary re-renders (typing in the search box,
  // a poll landing) never move the page.
  const targetRef = useRef(null);

  const capture = useCallback(() => {
    if (typeof window === 'undefined') return;
    targetRef.current = window.scrollY;
  }, []);

  useLayoutEffect(() => {
    if (targetRef.current == null || typeof window === 'undefined') return;
    const y = targetRef.current;
    targetRef.current = null;
    // The list may now be SHORTER than it was (an order was archived out of
    // it), so the old offset can exceed the new maximum scroll. Clamping
    // means the page lands at the bottom of the shortened list rather than
    // silently refusing to scroll and appearing to jump anyway.
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, Math.min(y, max));
  }, [dep]);

  return capture;
}
