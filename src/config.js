// Storage keys, worker URLs, tokens.
export const SURCHARGE = 2;

export const ORDERS_KEY = 'ltb-orders';
export const CHECKS_KEY = 'ltb-cook-checks';
export const DELIVER_CHECKS_KEY = 'ltb-deliver-checks';
export const DISH_NOTES_KEY = 'ltb-dish-notes';
export const PIPELINE_JOURNAL_KEY = 'ltb-pipeline-journal';
export const WEEK_NOTES_KEY = 'ltb-week-notes';
// The Week tab's heads-up banner: { text, on }. Kept apart from the publish
// itself so last month's wording can sit in the box unchecked and harmless,
// then be re-armed in one tap. WeekTab.jsx imports this; it was missing here,
// which is a build-stopping error in esbuild ("no matching export"), so any
// checkout with WeekTab and without this key cannot build.
export const WEEK_NOTICE_KEY = 'ltb-week-notice';
export const SHOPPING_KEY = 'ltb-shopping';
export const WEEK_KEY = 'ltb-week';
export const PENDING_KEY = 'ltb-pending-orders';
export const FEEDBACK_KEY = 'ltb_dish_feedback_v1'; // per-dish feedback: { [dish]: { tally: {good,meh,bad}, notes: [...] } }
// The knowledge journal (K1–K8): decisions, price rationale, provenance,
// done-cues, adjustments, techniques, mistakes, retirements. Rides the
// backup ring. DISH_NOTES_KEY is retired into it (one-way boot migration,
// schema v2); the old key is kept above only so the migration can read it.
export const JOURNAL_KEY = 'ltb-journal';
// Forward-only record of what was on the menu each business week, UPSERTED by
// week stamp so the several publishes a single week receives collapse into one
// row. Exists for seasonal recall, not restore (that is config-history).
export const WEEK_LEDGER_KEY = 'ltb-week-ledger';
// Kevin's note about where archive copies are kept. Small, and it PRINTS INTO
// the archive, because the one person who needs it most will not have the app.
export const COPIES_NOTE_KEY = 'ltb-copies-note';
// One row per archive ever generated: {generatedAt, entryCount}. Tiny, and it
// is what lets each archive know it is the Nth rather than pretending to be the
// only one. The series IS the artifact.
export const ARCHIVE_HISTORY_KEY = 'ltb-archive-history';
// Visual cue METADATA only. The photographs live in R2; this holds what each
// one shows, which recipe version it belongs to, and whether its bytes landed.
export const VISUAL_CUES_KEY = 'ltb-visual-cues';
// Customer feature flags. Kevin's operational settings, published with the week.
export const CUSTOMER_FLAGS_KEY = 'ltb-customer-flags';
// M1: owned container counts + the meal-pool manual adjustment. Rides the
// backup ring. Costs and type definitions live in containers.js (they are
// registry facts, not per-device state); this key holds only what varies:
// how many Kevin OWNS, and his correction to the outstanding-pool math.
export const CONTAINER_INVENTORY_KEY = 'ltb-container-inventory';
export const REGULARS_KEY = 'ltb-regulars';
export const INVENTORY_KEY = 'ltb-inventory';
// Backup health: { lastOkAt } — the last time the ring CONFIRMED it holds this
// device's data. Persisted because an in-memory flag resets on every refresh,
// and a health signal that forgets is a health signal that lies.
export const BACKUP_STATE_KEY = 'ltb-backup-state';
// A push failing right now is not an emergency: phones lose signal and the
// 15-minute tick retries. Three missed cycles is a real problem. Warn at the
// gap, not the blip — a warning that cries wolf gets learned into furniture.
export const BACKUP_STALE_MS = 45 * 60 * 1000;
// Append-only trail of money-affecting changes. Rides the backup snapshot.
export const AUDIT_LOG_KEY = 'ltb-audit-log';
// Last-seen catalog prices/costs. Dish prices live in dishes.js and change by
// DEPLOY, so nothing in the running app can witness the edit. Diffing this
// fingerprint on boot is the only way the app notices a deploy moved a number.
export const MENU_FINGERPRINT_KEY = 'ltb-menu-fingerprint';
// What Kevin actually OWNS. Distinct from the per-dish `equipment` field in the
// registry, which is a scheduling vocabulary (ovenLow, largePot, dutch, wok)
// used for cook-day conflict detection. This is a plain list of real objects,
// because the archive kept referring to "the siphon" and "the sous vide"
// without ever saying what they were.
export const EQUIPMENT_KEY = 'ltb_equipment_v1';
// The confirmed start of REAL order data. Everything dated before it was typed
// in from memory when the app was built, so counts over it measure data entry.
// Null until Kevin confirms a proposal, and while it is null nothing changes —
// see realDataEpoch.js.
// The son's food log. Menu dishes only, by design — see rowan.js.
export const ROWAN_LOG_KEY = 'ltb_rowan_log_v1';
// The practice library: how Kevin works when the knowledge belongs to no
// single dish. Private, Kevin-confirmed only, rides the backup.
export const PRACTICES_KEY = 'ltb_practices_v1';
// The capture inbox: shared artifacts saved before they are classified.
// Text and metadata only; blobs live in R2 or the pending Cache bucket.
export const CAPTURE_INBOX_KEY = 'ltb_capture_inbox_v1';
// Packaged-product label versions: what was actually printed on the package,
// and when. Ships empty; fills only as Kevin records labels.
export const LABEL_VERSIONS_KEY = 'ltb_label_versions_v1';
// Answers Kevin gives inside a walk. Saved per item as he goes; there is no
// submit, so this is the only thing standing between a walk and losing it.
export const WALK_ANSWERS_KEY = 'ltb_walk_answers_v1';
// Kevin speaking directly to Rowan, and the ledger of product decisions with
// the reasoning attached. Both private; both ship empty.
export const NOTES_ROWAN_KEY = 'ltb_notes_rowan_v1';
export const DECISION_LEDGER_KEY = 'ltb_decision_ledger_v1';
// The knowledge core's three stores. Terms and anatomy are Kevin's words about
// food and language; derivatives are the single approved gate between a private
// record and any other reader.
export const TERMS_KEY = 'ltb_terms_v1';
export const ANATOMY_KEY = 'ltb_anatomy_v1';
export const DERIVATIVES_KEY = 'ltb_derivatives_v1';
// Rowan's questions, and the Future Reader Test's queue of records a later
// reader could not follow.
export const ROWAN_QUESTIONS_KEY = 'ltb_rowan_questions_v1';
export const CLARIFICATIONS_KEY = 'ltb_clarifications_v1';
// Kevin's own ranking of the menu, kept as a dated SERIES rather than a single
// list, because the whole reason he wanted it recorded is that it drifts.
export const DISH_RANKING_KEY = 'ltb_dish_rankings_v1';
export const REAL_DATA_EPOCH_KEY = 'ltb_real_data_epoch_v1';
// The five below were declared inline in App.jsx rather than here, which meant
// storage keys lived in two places and only one of them was findable. Moved
// verbatim (same strings, so no device sees a migration) when backupRestore.js
// was split out and needed four of them. Values unchanged.
export const INGREDIENTS_KEY = 'ltb_ingredients_v1';
export const COST_HISTORY_KEY = 'ltb_cost_history_v1';
// T2: the last business-week stamp this device has SEEN (not the same as
// SCHEMA_VERSION or any other guard — just a rollover flag). One key, one
// banner, per the plan.
export const LAST_SEEN_WEEK_KEY = 'ltb-last-seen-week';
export const RECEIPT_ALIASES_KEY = 'ltb_receipt_aliases_v1';
// Worker pending ids Kevin has already accepted or rejected. The worker is the
// durable order queue; this ledger stops a re-poll from resurrecting an order
// he already handled if the worker's own delete didn't land.
export const HANDLED_PENDING_KEY = 'ltb_handled_pending_v1';

export const WORKER_BASE = 'https://ltb-proxy.strickland-kevinj.workers.dev';
export const PENDING_POLL_URL = WORKER_BASE + '/pending';
export const CONFIG_PUBLISH_URL = WORKER_BASE + '/config';
// Omakase: saved component groups, and the review-later queue of things Kevin
// used that the ingredient registry does not know about yet.
// Last service-worker version this device saw, so an update banner only
// appears on a real change and never on first install.
export const SW_VERSION_KEY = 'ltb-sw-version';

export const OMAKASE_TEMPLATES_KEY = 'ltb-omakase-templates';
export const OMAKASE_REG_QUEUE_KEY = 'ltb-omakase-reg-queue';

// ── The owner token ─────────────────────────────────────────────────────────
//
// THIS USED TO BE A STRING LITERAL, and that string was compiled into app.js.
// index.html loads app.js, .assetsignore deliberately does NOT exclude it, so
// the bundle is served publicly at the site root. Anyone who opened the
// homepage could read the token out of it and then call /backup, which returns
// full snapshots: customer names, addresses, phone numbers, the private
// journal, and Rowan's log.
//
// It is now read at runtime from localStorage and never appears in the bundle.
// tests/no_secrets.mjs fails the build if a literal is ever put back.
//
// BE CLEAR ABOUT WHAT THIS IS AND IS NOT. This removes a published secret from
// a public file. It is NOT authentication: anyone with devtools on a device
// that has already been unlocked can still read localStorage. The real owner
// boundary is Cloudflare Access in front of index.html, which is free at this
// scale and is the actual fix. This is the part that can be done in code.
//
// A `let` on purpose: ES live bindings mean the seventeen modules that
// `import { PUBLISH_TOKEN }` see the value the moment it is set, without any of
// them changing.
export let PUBLISH_TOKEN = '';

export function setPublishToken(token) {
  PUBLISH_TOKEN = String(token || '').trim();
  try {
    if (PUBLISH_TOKEN) localStorage.setItem('ltb-owner-token', PUBLISH_TOKEN);
    else localStorage.removeItem('ltb-owner-token');
  } catch { /* private mode, or a non-browser import in the test gate */ }
  return PUBLISH_TOKEN;
}

// Prompts once if nothing is stored. Returns '' if the person declines, which
// leaves every owner route failing 401 rather than silently doing nothing.
export function ensurePublishToken() {
  if (PUBLISH_TOKEN) return PUBLISH_TOKEN;
  try {
    const stored = localStorage.getItem('ltb-owner-token');
    if (stored) return setPublishToken(stored);
    const entered = typeof prompt === 'function'
      ? prompt('Owner token (stored on this device only):')
      : '';
    return setPublishToken(entered);
  } catch {
    return '';
  }
}

// Read at module load so a device that has already been set up never prompts.
// Guarded because the test gate imports this file under node, where there is
// no localStorage.
try {
  const stored = typeof localStorage !== 'undefined' && localStorage.getItem('ltb-owner-token');
  if (stored) PUBLISH_TOKEN = stored;
} catch { /* no storage available */ }
export const VAPID_PUBLIC_KEY = 'BD96MjYlJ5dAdlTEzTMLi1hAlDmy-s2d6eO5B2aavlXFdueX9jSH4BOKJpDLE2MdOKvttlwOdSrs0tjFEio3EU8';

// Legacy Google Forms CSV polling — inactive (kept as fallback).
