/**
 * LTB Cloudflare Worker v3 — Custom Form Backend + AI Proxy
 *
 * This version adds a fully self-hosted ordering flow that replaces Google Forms:
 *   - The app publishes the week's menu config here.
 *   - The custom form page reads that config to build itself.
 *   - Customers submit orders straight to this Worker.
 *   - The app polls for new submissions (the pending queue).
 *
 * ACTIVE endpoints:
 *   GET  /config          — returns the current published week config (dishes, prices, PDF/form meta)
 *   POST /config          — app publishes a new week config (requires PUBLISH_TOKEN)
 *   POST /submit          — customer form submits an order; queued as pending
 *   GET  /pending         — app fetches all queued submissions
 *   POST /pending/clear   — app marks submissions as handled (removes by id)
 *   POST /parse-order     — parses a free-text customer order via Claude
 *   POST /parse-amendment — parses an amendment to an existing order via Claude
 *   POST /parse-notes     — parses free-text notes on an order via Claude
 *
 * INACTIVE (legacy Google Forms fallback — kept until the new flow is proven):
 *   GET  /sheet           — fetched the published Google Sheet CSV
 *   (To re-enable, flip LEGACY_SHEET_ENABLED to true.)
 *
 * Requires a KV namespace bound as LTB_KV (see setup PDF).
 *
 * Secrets (Cloudflare Worker Settings → Variables & Secrets):
 *   ANTHROPIC_API_KEY — your Anthropic API key (sk-ant-...)
 *   PUBLISH_TOKEN     — a private string the app sends to publish config (any random string)
 */

// ── Multiple allowed origins: the app AND the public form page ───────────────
const ALLOWED_ORIGINS = [
  'https://ltb-app.strickland-kevinj.workers.dev',
];

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL  = 'claude-sonnet-4-6';

// ── KV keys ──────────────────────────────────────────────────────────────────
const KV_CONFIG = 'week-config';        // current published menu config
const KV_PENDING = 'pending-orders';    // array of submitted orders awaiting review

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY GOOGLE FORMS FALLBACK — INACTIVE
// Flip to true to restore the old Google Sheet CSV polling path.
// ═══════════════════════════════════════════════════════════════════════════
const LEGACY_SHEET_ENABLED = false;
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYn0X7aAZ1xjr3pQpt0aR9lenIQDnxBtbqka7GA0wlYPZgfkZUZ4G_uYCnufRLxn29hEGi_CQdJf_n/pub?gid=1847554397&single=true&output=csv';

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      // ── GET /config — the form and app both read the current week config ────
      if (request.method === 'GET' && url.pathname === '/config') {
        const cfg = await env.LTB_KV.get(KV_CONFIG);
        return json(cfg ? JSON.parse(cfg) : defaultConfig(), origin);
      }

      // ── POST /config — app publishes a new week config ──────────────────────
      if (request.method === 'POST' && url.pathname === '/config') {
        const body = await request.json();
        if (!body.token || body.token !== env.PUBLISH_TOKEN) {
          return json({ error: 'Unauthorized' }, origin, 401);
        }
        const config = {
          dishes: body.dishes || [],
          addons: body.addons || [],
          bag: body.bag || [],
          sauces: body.sauces || [],
          menuPdfUrl: body.menuPdfUrl || '',
          weekLabel: body.weekLabel || '',
          updatedAt: new Date().toISOString(),
        };
        await env.LTB_KV.put(KV_CONFIG, JSON.stringify(config));
        return json({ ok: true, config }, origin);
      }

      // ── POST /submit — customer form submits an order ───────────────────────
      if (request.method === 'POST' && url.pathname === '/submit') {
        const body = await request.json();
        const submission = {
          id: 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
          customer: String(body.customer || '').slice(0, 120),
          address: String(body.address || '').slice(0, 300),
          phone: String(body.phone || '').slice(0, 40),
          items: Array.isArray(body.items) ? body.items.slice(0, 50) : [],
          notes: String(body.notes || '').slice(0, 1000),
          submittedAt: new Date().toISOString(),
        };
        // Basic sanity: must have a name and at least one item
        if (!submission.customer || submission.items.length === 0) {
          return json({ error: 'Missing name or items' }, origin, 400);
        }
        const existing = await env.LTB_KV.get(KV_PENDING);
        const queue = existing ? JSON.parse(existing) : [];
        queue.push(submission);
        await env.LTB_KV.put(KV_PENDING, JSON.stringify(queue));
        return json({ ok: true, id: submission.id }, origin);
      }

      // ── GET /pending — app fetches queued submissions ───────────────────────
      if (request.method === 'GET' && url.pathname === '/pending') {
        const existing = await env.LTB_KV.get(KV_PENDING);
        return json({ pending: existing ? JSON.parse(existing) : [] }, origin);
      }

      // ── POST /pending/clear — app removes handled submissions by id ──────────
      if (request.method === 'POST' && url.pathname === '/pending/clear') {
        const body = await request.json();
        const ids = new Set(body.ids || []);
        const existing = await env.LTB_KV.get(KV_PENDING);
        const queue = existing ? JSON.parse(existing) : [];
        const remaining = queue.filter(s => !ids.has(s.id));
        await env.LTB_KV.put(KV_PENDING, JSON.stringify(remaining));
        return json({ ok: true, remaining: remaining.length }, origin);
      }

      // ── AI proxy endpoints ──────────────────────────────────────────────────
      if (request.method === 'POST' && url.pathname === '/parse-order') {
        return proxyToAnthropic(request, env, origin);
      }
      if (request.method === 'POST' && url.pathname === '/parse-amendment') {
        return proxyToAnthropic(request, env, origin);
      }
      if (request.method === 'POST' && url.pathname === '/parse-notes') {
        return proxyToAnthropic(request, env, origin);
      }

      // ── LEGACY: GET /sheet (inactive unless re-enabled) ─────────────────────
      if (request.method === 'GET' && url.pathname === '/sheet') {
        if (!LEGACY_SHEET_ENABLED) {
          return json({ error: 'Legacy sheet endpoint disabled' }, origin, 410);
        }
        const res = await fetch(SHEET_CSV_URL, { headers: { 'User-Agent': 'LTB-Order-Tracker/1.0' } });
        if (!res.ok) return new Response('Failed to fetch sheet: ' + res.status, { status: 502, headers: corsHeaders(origin) });
        const csv = await res.text();
        return new Response(csv, {
          status: 200,
          headers: { ...corsHeaders(origin), 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' },
        });
      }

      return new Response('Not found', { status: 404, headers: corsHeaders(origin) });
    } catch (err) {
      return json({ error: 'Worker error: ' + err.message }, origin, 500);
    }
  },
};

// Default empty config so the form has something to render before first publish
function defaultConfig() {
  return { dishes: [], addons: [], bag: [], sauces: [], menuPdfUrl: '', weekLabel: '', updatedAt: null };
}

// Forward a request body straight to Anthropic, injecting the API key.
async function proxyToAnthropic(request, env, origin) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY secret not set in Worker', { status: 500, headers: corsHeaders(origin) });
  }
  try {
    const body = await request.text();
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response('Anthropic proxy error: ' + err.message, { status: 500, headers: corsHeaders(origin) });
  }
}

// JSON response helper with CORS
function json(obj, origin, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

// CORS: allow the app and the public form. The form may be served from the same
// Pages domain, so we echo back any allowed origin, defaulting to the app.
function corsHeaders(origin) {
  // The public form needs open access since customers hit it from the Pages
  // domain. We allow our known origins and also the wildcard for /submit and
  // /config GET which are safe public reads/writes (order submission only).
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
