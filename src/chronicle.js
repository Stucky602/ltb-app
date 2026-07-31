// src/chronicle.js — the complete story of one week of service.
//
// WHAT THIS IS FOR
//
// The app can already answer a dozen narrow questions: what was on the menu,
// who ordered, what it cost, which containers went out, what people said. It
// cannot answer the one question that matters most in five years:
//
//   "Show me the whole week of August 12."
//
// Every piece of that already exists. It exists in seven different places, each
// keyed differently, and nothing joins them. This file does the joining. It is
// ASSEMBLY, not new data — which is why it could not have been written until
// recipe versions, amendments, containers, cues, and the journal all landed.
//
// IMMUTABLE ONCE ARCHIVED. A chapter is a record of what happened, and a record
// that rewrites itself when a dish is renamed or a price changes is not a
// record. So a chapter resolves everything at build time and stores the answers
// rather than pointers — the same reason a recipe version stores a snapshot
// instead of a reference.
//
// THE HONESTY RULE, and it matters more here than anywhere else in the app.
// This is the document Kevin intends to hand to his son. A chapter that quietly
// omits what it could not find would be worse than useless: it would be
// convincing. So every section reports what is MISSING alongside what is there,
// and `gaps` is a first-class field rather than an afterthought.

import { versionById, versionLabel, currentVersionFor } from './recipeVersions.js';
import { dishIdFor } from './dishIdentity.js';
import { containersForDish } from './containers.js';

// A chapter is built from a week's ledger row plus everything that touched it.
// Nothing here reaches for globals: the caller passes the world in, so the same
// function builds a chapter for last week or for a week in 2031.
export function buildChapter({
  week,                 // the ledger row: { stamp, label, dishes, publishedAt, paused }
  orders = [],
  journal = null,
  amendments = [],
  visualCues = [],
  feedback = [],
  regulars = [],
  now = null,
} = {}) {
  if (!week || !week.stamp) return null;

  const start = week.stamp;
  const end = start + 7 * 24 * 60 * 60 * 1000;
  const inWeek = (ts) => {
    const t = typeof ts === 'number' ? ts : Date.parse(ts || 0);
    return t >= start && t < end;
  };

  const gaps = [];

  // ── The menu, and which recipe version each dish was at ──────────────────
  const menu = (week.dishes || []).map(name => {
    const dishId = dishIdFor(name);
    // PER DISH. The first version of this took the first version id from any
    // order in the week, so a dish nobody had recorded a version for silently
    // inherited a different dish's — the exact class of confident wrong answer
    // this file is supposed to prevent.
    //
    // A KNOWN LIMITATION worth stating: the version fields live on the ORDER,
    // not the line item, so a multi-dish order carries one id for everything in
    // it. That is only reliable when every dish in the order was at its current
    // version, which is the normal case but not a guarantee. Moving the fields
    // to the item is the fix; until then a chapter reports what it has and the
    // gap below says how it got it.
    const orderVersion = orders
      .filter(o => inWeek(o.createdAt || o.date))
      .filter(o => (o.items || []).some(it => (it.dishId || dishIdFor(it.name)) === dishId))
      .map(o => o.servedRecipeVersionId || o.offeredRecipeVersionId)
      .find(Boolean) || null;

    const version = orderVersion || (dishId ? (currentVersionFor(dishId) || {}).id : null);
    if (!orderVersion) {
      gaps.push(`No order recorded a recipe version for ${name}; the version shown is the one current when this chapter was built.`);
    }
    return {
      name,
      dishId: dishId || null,
      recipeVersionId: version,
      versionLabel: versionLabel(version),
      versionWasRecorded: !!orderVersion,
      packaging: (dishId && containersForDish(dishId)) || null,
    };
  });

  // ── Orders and the economics ─────────────────────────────────────────────
  const weekOrders = orders.filter(o => inWeek(o.createdAt || o.date));
  const households = new Set(weekOrders.map(o => o.regularId).filter(Boolean));

  let revenue = 0;
  let unpriced = 0;
  for (const o of weekOrders) {
    for (const it of (o.items || [])) {
      const line = Number(it.price) * (Number(it.qty) || 0);
      if (Number.isFinite(line)) revenue += line;
      else unpriced++;
    }
  }
  if (unpriced) gaps.push(`${unpriced} order line${unpriced === 1 ? '' : 's'} had no price recorded, so the revenue figure is incomplete.`);

  // ── Containers ───────────────────────────────────────────────────────────
  const containers = {};
  for (const o of weekOrders) {
    for (const it of (o.items || [])) {
      const mix = containersForDish(it.name);
      if (!mix) continue;
      for (const [type, n] of Object.entries(mix)) {
        containers[type] = (containers[type] || 0) + n * (Number(it.qty) || 1);
      }
    }
  }

  // ── Everything else that happened ────────────────────────────────────────
  const weekAmendments = (amendments || []).filter(a => inWeek(a.submittedAt));
  const weekCues = (visualCues || []).filter(c => inWeek(c.capturedAt) && c.status === 'stored');
  const weekFeedback = (feedback || []).filter(f => inWeek(f.at || f.createdAt));

  const entries = ((journal && journal.entries) || []).filter(e => inWeek(e.createdAt || e.at));

  if (!entries.length) {
    gaps.push('Nothing was written in the journal this week, so the record holds what happened but not why.');
  }
  if (!weekCues.length) {
    gaps.push('No photographs were taken this week.');
  }

  return {
    schema: 1,
    stamp: week.stamp,
    label: week.label || '',
    publishedAt: week.publishedAt || null,
    paused: !!week.paused,
    builtAt: (now ? new Date(now) : new Date()).toISOString(),

    menu,
    orders: {
      count: weekOrders.length,
      households: households.size,
      revenue: Math.round(revenue * 100) / 100,
      items: weekOrders.reduce((n, o) => n + (o.items || []).length, 0),
    },
    containers,
    amendments: weekAmendments.map(a => ({
      orderId: a.orderId,
      status: a.status,
      at: a.submittedAt,
      reason: (a.decision && a.decision.reason) || null,
    })),
    cues: weekCues.map(c => ({ dishId: c.dishId, step: c.step, kind: c.kind, mediaKey: c.mediaKey, recipeVersionId: c.recipeVersionId })),
    feedback: weekFeedback.map(f => ({ dish: f.dish || null, verdict: f.verdict || null })),
    journalEntryIds: entries.map(e => e.id).filter(Boolean),
    journalEntryCount: entries.length,

    // What this chapter could not find out. Never empty by accident.
    gaps,
  };
}

// A chapter is only worth calling immutable if something checks it did not
// change. This is a content hash over the fields that describe what HAPPENED,
// deliberately excluding builtAt — rebuilding the same week must produce the
// same fingerprint or the promise is empty.
export function chapterFingerprint(chapter) {
  if (!chapter) return null;
  const subject = {
    stamp: chapter.stamp,
    menu: (chapter.menu || []).map(m => [m.dishId, m.recipeVersionId]),
    orders: chapter.orders,
    containers: chapter.containers,
    amendments: (chapter.amendments || []).map(a => [a.orderId, a.status]),
    cues: (chapter.cues || []).map(c => c.mediaKey),
    journalEntryIds: chapter.journalEntryIds,
  };
  const s = JSON.stringify(subject);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// Plain prose, for the archive. Written as sentences rather than a table
// because the reader in 2046 is a person, not a spreadsheet.
export function narrateChapter(chapter, { includeTitle = true } = {}) {
  if (!chapter) return '';
  const lines = [];
  const o = chapter.orders || {};

  // The archive prints the label as a heading of its own, so it asks for the
  // body without it rather than showing the week name twice.
  if (includeTitle) lines.push(chapter.label || 'A week');

  if (chapter.paused) {
    lines.push('No menu this week.');
  } else {
    lines.push(`${(chapter.menu || []).length} dishes on the menu.`);
    lines.push(o.count
      ? `${o.count} order${o.count === 1 ? '' : 's'} from ${o.households} household${o.households === 1 ? '' : 's'}${o.revenue ? `, $${o.revenue}` : ''}.`
      : 'No orders.');
  }

  const containerTotal = Object.values(chapter.containers || {}).reduce((a, b) => a + b, 0);
  if (containerTotal) lines.push(`${containerTotal} containers went out.`);

  const accepted = (chapter.amendments || []).filter(a => a.status === 'accepted').length;
  if ((chapter.amendments || []).length) {
    lines.push(`${chapter.amendments.length} change request${chapter.amendments.length === 1 ? '' : 's'}, ${accepted} accepted.`);
  }
  if (chapter.journalEntryCount) {
    lines.push(`${chapter.journalEntryCount} journal entr${chapter.journalEntryCount === 1 ? 'y' : 'ies'} written.`);
  }
  if ((chapter.cues || []).length) {
    lines.push(`${chapter.cues.length} photograph${chapter.cues.length === 1 ? '' : 's'} taken.`);
  }

  // The gaps are part of the story, not a footnote. A chapter that reads as
  // complete when it is not is the failure this whole file is shaped around.
  if ((chapter.gaps || []).length) {
    lines.push('');
    lines.push('What this record does not know:');
    for (const g of chapter.gaps) lines.push(`  ${g}`);
  }

  return lines.join('\n');
}

// Build every chapter the ledger can support. Weeks with nothing in them are
// still chapters: "no orders" is a fact about a week, and skipping it would
// leave a hole in the sequence that reads as missing data.
export function buildChronicle(ledger, world = {}) {
  const weeks = ((ledger && ledger.weeks) || []).slice().sort((a, b) => a.stamp - b.stamp);
  return weeks.map(w => buildChapter({ week: w, ...world })).filter(Boolean);
}
