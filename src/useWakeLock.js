// useWakeLock.js — P1: the screen sleeping mid-cook is, by Kevin's own
// account, probably the single most annoying daily thing in the app. This is
// the ~15-line fix: request a screen wake lock while a given view is active,
// release it on leave, and re-acquire on visibilitychange (iOS releases the
// lock whenever the tab backgrounds, even briefly — switching apps to check
// a text and back must not leave the screen sleeping again).
//
// Supported on iOS 16.4+ Safari/PWA and all modern desktop browsers. On an
// unsupported browser `navigator.wakeLock` is simply undefined and this
// hook is a silent no-op — never throws, never blocks rendering.
import { useEffect, useRef } from 'react';

export function useWakeLock(active) {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !navigator.wakeLock) return;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) { lock.release().catch(() => {}); return; }
        // The sentinel fires its OWN 'release' event whenever the lock ends —
        // whether we released it, or the OS revoked it silently (backgrounding,
        // battery saver). Without this listener, an OS-triggered drop leaves
        // lockRef.current pointing at a dead sentinel, and the visibilitychange
        // handler below (which checks !lockRef.current) never re-acquires.
        lock.addEventListener('release', () => {
          if (lockRef.current === lock) lockRef.current = null;
        });
        lockRef.current = lock;
      } catch {
        // Backgrounded tab, battery saver, or an unsupported context mid-call
        // — none of these are errors worth surfacing. The cook tab just
        // doesn't stay awake this one time; nothing else about the app is
        // affected, so this fails silently by design.
      }
    };

    acquire();
    const onVisibility = () => {
      // iOS drops the lock whenever the page backgrounds. Re-request the
      // moment it's visible again so a quick app-switch to reply to a text
      // doesn't leave the screen dark for the rest of the cook.
      if (document.visibilityState === 'visible' && !lockRef.current) acquire();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (lockRef.current) { lockRef.current.release().catch(() => {}); lockRef.current = null; }
    };
  }, [active]);
}
