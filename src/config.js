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
export const SEEN_ROWS_KEY = 'ltb-seen-rows';
export const REGULARS_KEY = 'ltb-regulars';
export const INVENTORY_KEY = 'ltb-inventory';

export const WORKER_BASE = 'https://ltb-proxy.strickland-kevinj.workers.dev';
export const PENDING_POLL_URL = WORKER_BASE + '/pending';
export const CONFIG_PUBLISH_URL = WORKER_BASE + '/config';
export const PUBLISH_TOKEN = 'ltb-publish-2026';
export const VAPID_PUBLIC_KEY = 'BD96MjYlJ5dAdlTEzTMLi1hAlDmy-s2d6eO5B2aavlXFdueX9jSH4BOKJpDLE2MdOKvttlwOdSrs0tjFEio3EU8';

// Legacy Google Forms CSV polling — inactive (kept as fallback).
export const USE_LEGACY_CSV = false;
export const FORM_CSV_URL = 'https://ltb-proxy.strickland-kevinj.workers.dev/sheet';
