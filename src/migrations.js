// migrations.js — schema versioning for locally stored app data.
//
// THREAT MODEL, corrected from the original plan doc:
// The doc assumed sw.js caches an old app.js and serves it after data has
// migrated forward on that device. Checked: sw.js has no fetch handler and
// no Cache API calls at all — it only handles push notifications. That
// specific mechanism does not exist in this app. Guarding against it would
// have built a lock for a door that isn't there.
//
// The real gap is RESTORE, not reload. localStorage never syncs between
// Kevin's iPhone and PC, so a stale device never sees new-shaped data by
// itself. But the backup ring does cross devices: Device A updates first,
// backs up (schema v2). Device B is still on old code (still understands
// only v1) and restores that same ring entry. That is old code, new data,
// on one real device, via the restore button — no phone/PC split required,
// and no service worker involved.
//
// So the guard lives in TWO places, both already single choke points:
//   1. Boot load  (the one useEffect that hydrates all local state)
//   2. Restore    (applyBackupPayload — the ONE function all four restore
//                  paths — online, file, paste, and their shared caller —
//                  already funnel through)
//
// SCHEMA_VERSION is unrelated to the 'ltb-v1' string already stamped on
// every backup payload. That string is an EXPORT FORMAT marker (checked by
// the worker's /backup validation and has never changed) and stays as-is.
// SCHEMA_VERSION tracks the SHAPE of the data underneath it and starts
// separately at 1.

export const SCHEMA_VERSION = 1;
export const SCHEMA_VERSION_KEY = 'ltb-schema-version';

// Ordered, one function per step. Each MUST be:
//   - idempotent        — running it twice changes nothing the second time
//   - non-destructive    — never drop a field it doesn't recognize
// Add v1→v2 here when the next real shape change lands. There is nothing to
// migrate yet, since v1 is the current shape — this scaffold exists so the
// NEXT change has a slot instead of an excuse to skip stamping.
const MIGRATIONS = {
  // 1: (data) => data,  // example shape for the next entry
};

// Runs every migration step between `fromVersion` and SCHEMA_VERSION, in
// order. Called on data that is OLDER than or equal to current — never on
// data that is newer (see assessForwardCompat below, which callers must
// check FIRST).
export function migrateForward(data, fromVersion) {
  let version = fromVersion;
  let out = data;
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (step) out = step(out);
    version += 1;
  }
  return out;
}

// The forward-compat guard. Three outcomes:
//   'current'   — matches running code, nothing to do
//   'migrate'    — older than running code, safe to migrateForward()
//   'refuse'    — NEWER than running code (old code, new data). Do NOT
//                 migrate down. Silent downgrade is how data dies — the
//                 caller must warn and leave the data untouched.
export function assessForwardCompat(storedVersion) {
  const v = Number.isInteger(storedVersion) ? storedVersion : 0; // unstamped = pre-versioning = v0
  if (v === SCHEMA_VERSION) return { outcome: 'current', storedVersion: v };
  if (v > SCHEMA_VERSION) return { outcome: 'refuse', storedVersion: v };
  return { outcome: 'migrate', storedVersion: v };
}

export const REFUSE_MESSAGE =
  "This device's app is older than the data it just tried to load. " +
  'Reload the app (or wait for the next auto-update) before continuing — ' +
  'nothing was changed.';
