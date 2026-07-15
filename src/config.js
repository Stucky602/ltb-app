// Storage keys, worker URLs, tokens.
export const SURCHARGE = 2;

export const ORDERS_KEY = 'ltb-orders';
export const CHECKS_KEY = 'ltb-cook-checks';
export const DELIVER_CHECKS_KEY = 'ltb-deliver-checks';
export const DISH_NOTES_KEY = 'ltb-dish-notes';
export const WEEK_NOTES_KEY = 'ltb-week-notes';
export const SHOPPING_KEY = 'ltb-shopping';
export const WEEK_KEY = 'ltb-week';
export const PENDING_KEY = 'ltb-pending-orders';
export const FEEDBACK_KEY = 'ltb_dish_feedback_v1'; // per-dish feedback: { [dish]: { tally: {good,meh,bad}, notes: [...] } }
export const SEEN_ROWS_KEY = 'ltb-seen-rows';
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

export const WORKER_BASE = 'https://ltb-proxy.strickland-kevinj.workers.dev';
export const PENDING_POLL_URL = WORKER_BASE + '/pending';
export const CONFIG_PUBLISH_URL = WORKER_BASE + '/config';
export const PUBLISH_TOKEN = 'ltb-publish-2026';
export const VAPID_PUBLIC_KEY = 'BD96MjYlJ5dAdlTEzTMLi1hAlDmy-s2d6eO5B2aavlXFdueX9jSH4BOKJpDLE2MdOKvttlwOdSrs0tjFEio3EU8';

// Legacy Google Forms CSV polling — inactive (kept as fallback).
export const USE_LEGACY_CSV = false;
export const FORM_CSV_URL = 'https://ltb-proxy.strickland-kevinj.workers.dev/sheet';
