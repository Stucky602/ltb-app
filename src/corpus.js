// corpus.js — one readable surface over everything the record holds.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
//
// Kevin's knowledge is spread across nine stores that were each built for their
// own job and share no shape: the journal (dish entries and general chapters),
// the recipe version registry, Chronicle chapters, visual cues, the Walk 2
// reheat data, the Rowan log, the practice library, the week ledger, and the
// orders themselves. Nothing could read across them. "Why is there ice in the
// Leblanc squash bag?" has an answer sitting in a dossier entry, and there was
// no way to ask.
//
// This file is the adapter layer, and nothing more. It normalises every store
// into one record shape and provides a deterministic index over it. It does NOT
// answer questions, summarise, or generate. Every result is a real record with
// a link back to where it lives.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE RULE THIS FILE ENFORCES: EVIDENCE, NEVER SYNTHESIS
//
// Search returns records. When nothing matches, it says so and stops. It never
// fills the gap from general culinary knowledge, and it never composes an
// answer that no single record supports. That is not a limitation to be lifted
// later by bolting a model onto the end — it is the property that makes the
// answers trustworthy, and any synthesis layer added on top must keep every
// claim traceable to the records below it.
//
// ═══════════════════════════════════════════════════════════════════════════
// PRIVACY
//
// This module imports journal.js, so it is behind the privacy wall by
// construction: any customer surface that reached this file would reach the
// journal through it and tests/journal.mjs would fail on the import graph. That
// is deliberate. Do not "decouple" it from the journal to make it reusable — the
// coupling is what makes the wall protect it.

import { normalizeJournal, GENERAL_CHAPTERS } from './journal.js';
import { normalizePractices } from './practices.js';
import { normalizeTerms } from './terms.js';
import { normalizeAnatomy, CRITICALITY_LABELS } from './anatomy.js';
import { RECIPE_VERSIONS } from './recipeVersions.js';
import { REHEAT_DATA } from './reheatData.js';
import { dishNameFor } from './dishIdentity.js';

// A corpus record. `link` is where the UI can send Kevin to see it in place:
// { view, sub } — the tab and, where the tab has them, the sub-tab.
const rec = (r) => ({
  id: r.id,
  kind: r.kind,
  dishId: r.dishId || null,
  date: typeof r.date === 'number' ? r.date : null,
  title: r.title || '',
  text: r.text || '',
  link: r.link || null,
});

const safeName = (dishId) => {
  if (!dishId) return '';
  try { return dishNameFor(dishId, '') || ''; } catch { return ''; }
};

// ── Adapters ────────────────────────────────────────────────────────────────
// Every one of these is defensive: a missing or malformed store yields an empty
// list rather than throwing. Ask must never fail to open because one store on
// one device is in a shape nobody predicted.

export function fromJournal(journal) {
  let j;
  try { j = normalizeJournal(journal); } catch { return []; }
  const chapterLabel = (id) => (GENERAL_CHAPTERS.find(c => c.id === id) || {}).label || 'General';
  return (j.entries || []).map(e => {
    const isDish = e.subject && e.subject.kind === 'dish';
    return rec({
      id: 'j:' + e.id,
      kind: 'journal',
      dishId: isDish ? (e.subject.dishId || null) : null,
      date: e.ts,
      title: isDish
        ? `${e.subject.dish} · ${e.type}`
        : `${chapterLabel(e.subject && e.subject.chapter)} · ${e.type}`,
      text: e.text || '',
      link: { view: 'record', sub: 'read' },
    });
  });
}

export function fromPractices(store) {
  let s;
  try { s = normalizePractices(store); } catch { return []; }
  return (s.entries || []).map(p => rec({
    id: 'pr:' + p.id,
    kind: 'practice',
    date: p.ts,
    title: `Practice · ${p.status}`,
    // why/where/exceptions are searchable too: "which practices mention Monday
    // preparation" has to match a reason, not just a headline.
    text: [p.text, p.why, p.where, p.exceptions, ...(p.examples || [])].filter(Boolean).join(' \u00b7 '),
    link: { view: 'record', sub: 'practice' },
  }));
}

export function fromRecipeVersions() {
  // Field names checked against the generated registry rather than assumed:
  // it is `effectiveAt`, not `at`, and the human text lives in `dishName` plus
  // the status. A version record carries no prose note of its own — the WHY of
  // a version lives in the journal entry it points at via revisionEntryId, and
  // that entry is already in the corpus through fromJournal.
  return (RECIPE_VERSIONS || []).map(v => rec({
    id: 'rv:' + v.id,
    kind: 'recipeVersion',
    dishId: v.dishId || null,
    date: v.effectiveAt ? Date.parse(v.effectiveAt) || null : null,
    title: `${v.dishName || safeName(v.dishId) || v.dishId} · ${v.id}`,
    text: [
      v.dishName,
      v.status === 'current' ? 'current version' : v.status,
      v.parentVersionId ? `supersedes ${v.parentVersionId}` : 'first recorded version',
    ].filter(Boolean).join(' \u00b7 '),
    link: { view: 'recipes', sub: 'dishes' },
  }));
}

export function fromReheatData() {
  const out = [];
  for (const [dishId, d] of Object.entries(REHEAT_DATA || {})) {
    if (!d) continue;
    const name = safeName(dishId) || dishId;
    const bits = [];
    if (d.timing && d.timing.note) bits.push(d.timing.note);
    if (d.safety) bits.push([].concat(d.safety).join(' '));
    if (d.askBox) bits.push([].concat(d.askBox).join(' '));
    for (const c of d.components || []) {
      const f = c.freeze || {};
      // The hedge travels with the value here exactly as it does on the card:
      // an untested verdict must never read in search as a tested one.
      if (f.verdict) {
        bits.push(`${c.key}: freezes ${f.verdict}${f.tested ? '' : ' (not yet tested)'}${f.note ? ` — ${f.note}` : ''}`);
      }
      if (c.divide && c.divide.note) bits.push(`${c.key}: ${c.divide.note}`);
    }
    if (!bits.length) continue;
    out.push(rec({
      id: 'rh:' + dishId,
      kind: 'reheat',
      dishId,
      title: `${name} · reheat walk`,
      text: bits.join(' \u00b7 '),
      link: { view: 'recipes', sub: 'dishes' },
    }));
  }
  return out;
}

export function fromChronicle(chapters) {
  return (Array.isArray(chapters) ? chapters : []).map(c => rec({
    id: 'ch:' + (c.week || c.stamp || Math.random().toString(36).slice(2)),
    kind: 'chronicle',
    date: c.stamp ? Date.parse(c.stamp) || null : null,
    title: `Week of ${c.week || c.label || 'unknown'}`,
    text: [
      (c.menu || []).map(m => m.name).join(', '),
      ...(c.gaps || []),
    ].filter(Boolean).join(' \u00b7 '),
    link: { view: 'record', sub: 'keep' },
  }));
}

export function fromVisualCues(cues) {
  const list = Array.isArray(cues) ? cues : Object.values(cues || {}).flat();
  return list.filter(Boolean).map(c => rec({
    id: 'vc:' + (c.id || c.key || Math.random().toString(36).slice(2)),
    kind: 'cue',
    dishId: c.dishId || null,
    date: c.ts || null,
    title: `${safeName(c.dishId) || c.dish || 'Cue'} · ${c.step || 'visual cue'}`,
    text: [c.caption, c.note, c.what].filter(Boolean).join(' \u00b7 '),
    link: { view: 'recipes', sub: 'dishes' },
  }));
}

export function fromRowan(log) {
  const list = Array.isArray(log) ? log : (log && log.entries) || [];
  return list.filter(Boolean).map(e => rec({
    id: 'rw:' + (e.id || e.ts),
    kind: 'rowan',
    dishId: e.dishId || null,
    date: e.ts || null,
    title: `${e.dish || safeName(e.dishId) || 'Dish'} · rated ${e.verdict ?? e.rating ?? '?'}`,
    text: [e.notes, e.familyNotes, e.note].filter(Boolean).join(' \u00b7 '),
    link: { view: 'rowan' },
  }));
}

export function fromTerms(store) {
  let s;
  try { s = normalizeTerms(store); } catch { return []; }
  return (s.terms || []).map(t => rec({
    id: 'tm:' + t.id,
    kind: 'term',
    date: t.ts,
    title: `${t.term} · ${t.status}`,
    // The misreadings are searchable too, which is half the point of recording
    // them: someone asking the question the wrong way round should still land
    // on the entry that corrects it.
    text: [t.definition, ...(t.examples || []), ...(t.misreadings || [])].filter(Boolean).join(' \u00b7 '),
    link: { view: 'record', sub: 'practice' },
  }));
}

export function fromAnatomy(store) {
  let s;
  try { s = normalizeAnatomy(store); } catch { return []; }
  return (s.entries || []).map(e => rec({
    id: 'an:' + e.id,
    kind: 'anatomy',
    dishId: e.dishId || null,
    date: e.ts,
    title: `${safeName(e.dishId) || e.dishId} · ${e.ingredientId}`,
    text: [
      ...(e.roles || []),
      e.criticality ? CRITICALITY_LABELS[e.criticality] : '',
      e.ifOmitted, e.ifMore, e.ifLess, e.misunderstanding,
    ].filter(Boolean).join(' \u00b7 '),
    link: { view: 'recipes', sub: 'dishes' },
  }));
}

// ── Build ───────────────────────────────────────────────────────────────────

export function buildCorpus(stores = {}) {
  return [
    ...fromJournal(stores.journal),
    ...fromPractices(stores.practices),
    ...fromRecipeVersions(),
    ...fromReheatData(),
    ...fromChronicle(stores.chronicle),
    ...fromVisualCues(stores.visualCues),
    ...fromRowan(stores.rowanLog),
    ...fromTerms(stores.terms),
    ...fromAnatomy(stores.anatomy),
  ].filter(r => r.text || r.title);
}

export const CORPUS_KINDS = ['journal', 'practice', 'term', 'anatomy', 'recipeVersion', 'reheat', 'chronicle', 'cue', 'rowan'];

export const KIND_LABELS = {
  journal: 'Journal', practice: 'Practices', term: 'Terms', anatomy: 'Anatomy', recipeVersion: 'Recipe versions',
  reheat: 'Reheat walk', chronicle: 'Chronicle', cue: 'Visual cues', rowan: 'Rowan',
};

// ── Deterministic search ────────────────────────────────────────────────────
//
// Token overlap, nothing cleverer. No stemming, no synonyms, no fuzzy matching:
// every one of those makes a result appear that the user cannot explain, and an
// unexplainable result in a record you are meant to TRUST is worse than a miss.
// A miss sends Kevin to different words; a spooky hit teaches him the search
// knows things it does not.

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'it', 'for',
  'on', 'at', 'with', 'that', 'this', 'was', 'are', 'be', 'as', 'by', 'from', 'what', 'why',
  'how', 'when', 'which', 'does', 'do', 'did', 'i', 'my', 'me', 'we']);

export function tokenize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP.has(t));
}

export function searchCorpus(corpus, query, opts = {}) {
  const terms = tokenize(query);
  const { kinds = null, dishId = null, limit = 40 } = opts;
  let pool = corpus || [];
  if (kinds && kinds.length) pool = pool.filter(r => kinds.includes(r.kind));
  if (dishId) pool = pool.filter(r => r.dishId === dishId);

  // No query but a filter: this is browsing, and returning the filtered set is
  // the honest answer. Newest first.
  if (!terms.length) {
    return [...pool].sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, limit)
      .map(r => ({ ...r, score: 0, excerpt: excerptFor(r.text, []) }));
  }

  const scored = [];
  for (const r of pool) {
    const hay = (r.title + ' ' + r.text).toLowerCase();
    let score = 0, hits = 0;
    for (const t of terms) {
      const n = hay.split(t).length - 1;
      if (n > 0) { hits++; score += Math.min(n, 3); }
    }
    if (!hits) continue;
    // Every term present beats many hits on one term: a record matching both
    // "leblanc" and "ice" is the answer, one matching "ice" five times is not.
    score += hits === terms.length ? terms.length * 3 : 0;
    scored.push({ ...r, score, excerpt: excerptFor(r.text, terms) });
  }
  scored.sort((a, b) => b.score - a.score || (b.date || 0) - (a.date || 0));
  return scored.slice(0, limit);
}

// A window around the first matching term, so a long dossier entry shows the
// part that matched rather than its opening sentence.
export function excerptFor(text, terms, width = 220) {
  const s = String(text || '');
  if (s.length <= width) return s;
  let at = 0;
  for (const t of terms || []) {
    const i = s.toLowerCase().indexOf(t);
    if (i >= 0) { at = i; break; }
  }
  const start = Math.max(0, at - Math.floor(width / 3));
  return (start > 0 ? '\u2026' : '') + s.slice(start, start + width).trim() + (start + width < s.length ? '\u2026' : '');
}
