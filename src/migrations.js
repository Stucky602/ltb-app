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

import { migrateDishNotes, normalizeJournal } from './journal.js';
import { dishIdFor } from './dishIdentity.js';

export const SCHEMA_VERSION = 5;
export const SCHEMA_VERSION_KEY = 'ltb-schema-version';

// Ordered, one function per step. Each MUST be:
//   - idempotent        — running it twice changes nothing the second time
//   - non-destructive    — never drop a field it doesn't recognize
const MIGRATIONS = {
  // v1 → v2 (Jul 24 2026): the knowledge journal lands and the legacy
  // dishNotes store retires into it. Payloads never actually CARRIED
  // dishNotes (it lived on-device only and buildBackupPayload never included
  // it), so for real ring snapshots this step is normalize-only — but a
  // hand-made or file payload could carry one, and folding is cheap. The
  // fold is idempotent by content (migrateDishNotes dedupes migrated
  // entries), and dishNotes is left ON the payload untouched: this step
  // recognizes it, but dropping fields is not this function's job.
  1: (data) => {
    if (!data || typeof data !== 'object') return data;
    const journal = migrateDishNotes(normalizeJournal(data.journal), data.dishNotes || null);
    return { ...data, journal };
  },

  // v2 → v3 (Jul 24 2026): STABLE DISH IDENTITY.
  // Every subsystem identified a dish by its display string, which made every
  // rename a data migration and had already fragmented four dishes' history by
  // the time this was written. This stamps `dishId` onto stored order items
  // and journal subjects.
  //
  // ADDITIVE AND NON-DESTRUCTIVE, deliberately: `name` is KEPT on every record.
  // Readers that still resolve by name (passport.js, dishCosting.js,
  // favorites.js, regularsIntel.js, repricing.js) keep working untouched, and
  // move to ids one at a time. Nothing is removed until every reader has moved.
  //
  // A record whose name resolves to NOTHING is left exactly as it is rather
  // than being guessed at or dropped. Those are real orphans and the Record
  // tab reports them; silently inventing an id for one would bury the very
  // problem this migration exists to surface.
  2: (data) => {
    if (!data || typeof data !== 'object') return data;
    const out = { ...data };

    if (Array.isArray(data.orders)) {
      out.orders = data.orders.map(o => {
        if (!o || !Array.isArray(o.items)) return o;
        let touched = false;
        const items = o.items.map(it => {
          if (!it || it.dishId || !it.name || it.omakase) return it;
          const id = dishIdFor(it.name);
          if (!id) return it;
          touched = true;
          return { ...it, dishId: id };
        });
        return touched ? { ...o, items } : o;
      });
    }

    if (data.journal && Array.isArray(data.journal.entries)) {
      out.journal = {
        ...data.journal,
        entries: data.journal.entries.map(e => {
          if (!e || !e.subject || e.subject.kind !== 'dish' || e.subject.dishId) return e;
          const id = dishIdFor(e.subject.dish);
          if (!id) return e;
          return { ...e, subject: { ...e.subject, dishId: id } };
        }),
      };
    }

    return out;
  },
  // v3 → v4 (Jul 30 2026): IMMUTABLE RECIPE VERSIONS.
  // Orders gain two fields recording which exact recipe version was offered
  // when the customer ordered, and which was actually cooked. They are normally
  // the same, but Kevin can refine a dish after orders are placed and before
  // Tuesday's cook, so one field cannot honestly mean both.
  //
  // BOTH ARE SET TO null AND STAY THAT WAY. Every order that existed before
  // versioning is genuinely unknown, and the UI renders it as
  // "Legacy — exact recipe version unrecorded". Backfilling them to the oldest
  // recorded version because it happens to be the oldest one in code would
  // assert a fact nobody knows, and the whole point of an immutable registry is
  // that it does not lie about history.
  //
  // Additive and non-destructive, same as v3: nothing is dropped.
  3: (data) => {
    if (!data || typeof data !== 'object') return data;
    const orders = Array.isArray(data.orders) ? data.orders.map((o) => {
      if (!o || typeof o !== 'object') return o;
      if ('offeredRecipeVersionId' in o && 'servedRecipeVersionId' in o) return o;
      return {
        ...o,
        offeredRecipeVersionId: o.offeredRecipeVersionId ?? null,
        servedRecipeVersionId: o.servedRecipeVersionId ?? null,
      };
    }) : data.orders;
    return { ...data, orders };
  },

  // v4 → v5 (Aug 1 2026): RECIPE VERSIONS MOVE TO THE LINE ITEM.
  // The v4 fields sat on the ORDER, so a four-dish order carried one id for all
  // four. chronicle.js documented that as a known limitation in its own source.
  // The fields now live per item, where a version can actually be true.
  //
  // THE ORDER-LEVEL FIELDS ARE LEFT IN PLACE, NOT DELETED. They are recorded
  // history; a migration that strips them would destroy data to tidy a shape.
  // chronicle.js reads item-level first and falls back to them.
  //
  // INHERITANCE CARRIES A MARKER. Where an order has a version id, each of its
  // items inherits it and is flagged `versionInherited: true`. That flag is the
  // whole honesty of this step. The order-level value was recorded truth, but
  // it was truth about the ORDER, and applying it to each dish is an assumption
  // — correct whenever every dish was at its current version, which is the
  // normal case and not a guarantee. The marker is how the hedge travels with
  // the value, the same principle as the `tested` flag on freeze verdicts.
  //
  // In practice this does almost nothing today: v3 → v4 deliberately set both
  // fields to null and refused to backfill, and nothing has ever written them
  // since, so nearly every order has nothing to inherit and is returned
  // untouched. The step exists for correctness on any device that does hold a
  // value, and so the chain is honest about when the shape changed.
  //
  // Additive and non-destructive, same as v3 and v4.
  4: (data) => {
    if (!data || typeof data !== 'object') return data;
    const orders = Array.isArray(data.orders) ? data.orders.map((o) => {
      if (!o || typeof o !== 'object' || !Array.isArray(o.items)) return o;
      const offered = o.offeredRecipeVersionId ?? null;
      const served = o.servedRecipeVersionId ?? null;
      if (offered === null && served === null) return o; // nothing to inherit
      let touched = false;
      const items = o.items.map((it) => {
        if (!it || typeof it !== 'object') return it;
        if ('offeredRecipeVersionId' in it || 'servedRecipeVersionId' in it) return it;
        touched = true;
        return {
          ...it,
          offeredRecipeVersionId: offered,
          servedRecipeVersionId: served,
          versionInherited: true,
        };
      });
      return touched ? { ...o, items } : o;
    }) : data.orders;
    return { ...data, orders };
  },

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
