// auditLog.js — append-only trail of money-affecting changes. Pure module.
//
// WHY THIS EXISTS
// The duplicate `Filet mignon` LINE_MAP key silently zeroed the filet's cost
// TWICE and went unnoticed for weeks. "Why is this margin weird?" currently
// requires archaeology: guess what changed, guess when, guess which deploy or
// receipt did it. This turns that into a scroll.
//
// DESIGN DECISIONS
//
// Rides the backup snapshot, not its own KV route. Every worker route is a
// thing a full-file paste can silently delete — that is, by direct evidence
// from this project, the highest-frequency failure mode in the system. The
// audit log is also read at exactly the moment you'd restore, so coupling its
// lifecycle to the snapshot's is a feature.
//
// Append-only in practice. A correction is a new entry, never an edit. The
// log lives inside a replaceable snapshot, so restoring an old backup rewinds
// it. Accepted: this is a diagnostic, not a legal record.
//
// NO PII, EVER. Ingredient ids, dish names, prices, timestamps. Never a
// customer name, address, or phone. Enforced by what the diff functions read:
// none of them are handed an order.

export const AUDIT_CAP = 500;
export const AUDIT_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

// Where a change came from. The receipt-scan case additionally carries the
// line's raw text and derivation basis, so a bad cost traces to the exact
// scanned line that set it.
//
// SEED is distinct from DEPLOY on purpose. Both originate in a file edit, but
// DEPLOY entries are the app NOTICING a catalog change after the fact
// (menuFingerprint diffing), while SEED entries are the app CHANGING Kevin's
// stored data to match a file he edited. The second one rewrites live state;
// when a cost looks wrong, "did something rewrite my DB on boot?" is a
// different question from "did the menu move?" and deserves its own answer.
export const SOURCES = {
  MANUAL: 'manual-edit',
  RECEIPT: 'receipt-scan',
  DEPLOY: 'file-deploy',
  PUBLISH: 'publish',
  SEED: 'seed-reconcile',
};

// Costs are floats. Anything under a hundredth of a cent is noise, not a
// change worth a log line.
const EPS = 0.0001;
const moved = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) > EPS;

export function auditEntry({ target, field, from, to, source, meta }) {
  const e = {
    at: new Date().toISOString(),
    target: String(target),
    field: String(field),
    from: from === undefined ? null : from,
    to: to === undefined ? null : to,
    source,
  };
  if (meta && Object.keys(meta).length) e.meta = meta;
  return e;
}

// Bounded BOTH ways: 90 days of history, and never more than 500 entries.
// This rides in a snapshot that pushes every 15 minutes, so unbounded growth
// would quietly inflate every backup in the ring.
export function appendAudit(log, entries) {
  if (!entries || !entries.length) return Array.isArray(log) ? log : [];
  const merged = [...(Array.isArray(log) ? log : []), ...entries];
  const cutoff = Date.now() - AUDIT_MAX_AGE_MS;
  const fresh = merged.filter(e => {
    const t = Date.parse(e && e.at);
    return Number.isNaN(t) ? true : t >= cutoff;
  });
  return fresh.length > AUDIT_CAP ? fresh.slice(fresh.length - AUDIT_CAP) : fresh;
}

// Ingredient `current` cost changes. `metaById` optionally carries per-id
// context — for receipts, the raw line text and derivation basis.
export function diffIngredientCosts(prev, next, source, metaById) {
  const prevById = new Map((prev || []).map(i => [i.id, i]));
  const out = [];
  for (const i of (next || [])) {
    const before = prevById.get(i.id);
    const meta = (metaById && metaById[i.id]) || null;
    if (!before) {
      out.push(auditEntry({
        target: i.id, field: 'current', from: null, to: i.current, source,
        meta: { ...(meta || {}), created: true },
      }));
    } else if (moved(before.current, i.current)) {
      out.push(auditEntry({ target: i.id, field: 'current', from: before.current, to: i.current, source, meta }));
    }
    // baseline is the canonical anchor and should essentially never move.
    // When it does, that is exactly the kind of change worth a loud record.
    if (before && moved(before.baseline, i.baseline)) {
      out.push(auditEntry({ target: i.id, field: 'baseline', from: before.baseline, to: i.baseline, source, meta }));
    }
  }
  return out;
}

// A flat {"Dish::Variant": {price, cost}} snapshot of the whole catalog.
// Dish prices and cost anchors live in dishes.js, so they change by DEPLOY,
// not by any in-app action — nothing in the running app can observe the edit
// happening. Fingerprinting the catalog and diffing it on boot is the only
// way the app can notice that a deploy moved a number. This is the check that
// would have caught the $0 filet the morning it shipped.
export function menuFingerprint(fullMenu) {
  const fp = {};
  for (const items of Object.values(fullMenu || {})) {
    for (const item of (items || [])) {
      if (item.perLb) {
        fp[item.name + '::(by weight)'] = { price: item.pricePerLb ?? null, cost: item.costPerLb ?? null };
      }
      for (const v of (item.variants || [])) {
        fp[item.name + '::' + v.label] = { price: v.price ?? null, cost: v.cost ?? null };
      }
    }
  }
  return fp;
}

export function diffMenuFingerprint(prevFp, nextFp) {
  if (!prevFp || !Object.keys(prevFp).length) return []; // first run: establish the baseline, don't log the whole catalog
  const out = [];
  for (const key of Object.keys(nextFp || {})) {
    const before = prevFp[key];
    const after = nextFp[key];
    if (!before) {
      out.push(auditEntry({ target: key, field: 'added', from: null, to: after.price, source: SOURCES.DEPLOY }));
      continue;
    }
    if (moved(before.price, after.price)) {
      out.push(auditEntry({ target: key, field: 'price', from: before.price, to: after.price, source: SOURCES.DEPLOY }));
    }
    if (moved(before.cost, after.cost)) {
      out.push(auditEntry({ target: key, field: 'cost', from: before.cost, to: after.cost, source: SOURCES.DEPLOY }));
    }
  }
  for (const key of Object.keys(prevFp)) {
    if (!(nextFp || {})[key]) {
      out.push(auditEntry({ target: key, field: 'removed', from: prevFp[key].price, to: null, source: SOURCES.DEPLOY }));
    }
  }
  return out;
}

// Seed reconciliation. Takes the `changes` array from reconcileIngredients()
// rather than a prev/next pair, because the WHY matters here and a plain diff
// can't see it: a unit change and a baseline change can move `current` by the
// same amount for completely different reasons, and only one of them means
// "your learned price was thrown away."
//
// Emits up to two entries per row — the baseline move (the anchor changed)
// and, when the unit changed, the discarded current (the learned price died).
// The unit entry carries the old and new unit in meta, because "1.91 -> 0.20"
// is alarming until you can see it was per-bunch and is now per-sprig.
export function diffReconcile(changes) {
  const out = [];
  for (const c of (changes || [])) {
    if (c.action === 'insert') {
      out.push(auditEntry({
        target: c.id, field: 'current', from: null, to: c.currentTo, source: SOURCES.SEED,
        meta: { created: true, basis: 'new in seed' },
      }));
      continue;
    }
    if (moved(c.from, c.to)) {
      out.push(auditEntry({
        target: c.id, field: 'baseline', from: c.from, to: c.to, source: SOURCES.SEED,
        meta: { basis: 'seed edit' },
      }));
    }
    // The baseline-only case moves `current` too when it was never learned —
    // an untouched row follows its anchor. Log it: it is still a cost change,
    // and "why did my asparagus price move on its own?" needs an answer.
    if (c.action === 'baseline' && moved(c.currentFrom, c.currentTo)) {
      out.push(auditEntry({
        target: c.id, field: 'current', from: c.currentFrom, to: c.currentTo, source: SOURCES.SEED,
        meta: { basis: 'followed new baseline (no receipt had ever moved it)' },
      }));
    }
    if (c.action === 'unit') {
      out.push(auditEntry({
        target: c.id, field: 'current', from: c.currentFrom, to: c.currentTo, source: SOURCES.SEED,
        meta: {
          basis: `unit changed ${c.fromUnit} -> ${c.toUnit}; learned price discarded (was in ${c.fromUnit})`,
        },
      }));
    }
  }
  return out;
}

// Alias remaps only. The alias map also carries sighting counters and store
// facts that churn on every scan and affect no money — logging those would
// bury the signal. Only a change to WHICH ingredient a receipt string resolves
// to can silently land a cost on the wrong ingredient, so only that is logged.
export function diffAliases(prev, next) {
  const out = [];
  const p = prev || {};
  const n = next || {};
  for (const key of Object.keys(n)) {
    const before = p[key] ? p[key].ingredientId : undefined;
    const after = n[key] ? n[key].ingredientId : undefined;
    if (before === after) continue;
    if (before === undefined && after === undefined) continue;
    out.push(auditEntry({
      target: key, field: 'alias', from: before ?? null, to: after ?? null, source: SOURCES.RECEIPT,
    }));
  }
  // Deletions. The loop above only walks keys present in `next`, so a removed
  // alias produced no entry at all — the one action that cannot be undone by
  // scanning another receipt was also the only one leaving no trace. Added
  // Jul 15 alongside the learned-data panel, whose whole purpose is deleting
  // bad learns: shipping a delete button without this would have made the app
  // quietly forget things with no record of who told it to.
  for (const key of Object.keys(p)) {
    if (key in n) continue;
    const before = p[key] ? p[key].ingredientId : undefined;
    out.push(auditEntry({
      target: key, field: 'alias', from: before ?? null, to: null, source: SOURCES.MANUAL,
      meta: { basis: 'forgotten from the learned-data panel' },
    }));
  }
  return out;
}
