// decisionLedger.js — what was decided, why, and what would reopen it.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE PROBLEM THIS EXISTS FOR
//
// Collaborators keep re-proposing things Kevin has already settled, because the
// outcome survives in the code and the REASONING does not. "Menu PDFs: no" is a
// line in a backlog; the reason it is no cannot be reconstructed from the
// absence of a feature.
//
// This session produced several fresh examples of the same failure in the other
// direction — a decision recorded without its reasoning gets applied where it
// does not belong. `bag-is-vessel cannot be divided` was true of the CUSTOMER
// and got applied to Kevin's own packing, twice, until he corrected it.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE FIELD THAT MAKES IT WORTH KEEPING IS `reconsiderIf`
//
// A decision with no stated conditions for revisiting is indistinguishable from
// dogma. Most of Kevin's declines are contingent — menu PDFs are no because the
// order form already carries the menu, which stops being true if the form
// changes. Writing the condition down is what lets a future collaborator tell
// "settled" from "settled given what was true in 2026".
//
// ═══════════════════════════════════════════════════════════════════════════
// IT SHIPS EMPTY, AND THAT IS DELIBERATE AFTER THIS SESSION
//
// There is a strong temptation to seed it from the backlog's declined list. Not
// doing it: four practice seeds were deleted on Aug 2 because they had been
// built from a SPEC's illustrative examples while claiming to cite Kevin's
// recorded statements. A decision ledger seeded the same way would be worse,
// because its whole purpose is to be the authority nobody re-litigates.
//
// Entries arrive when Kevin writes them, or when a decision is made in a
// session and he confirms the wording.

export const LEDGER_VERSION = 1;

export const DECISION_STATUSES = [
  'proposed',   // put to Kevin, not yet answered
  'approved',   // he said yes; may or may not be built
  'built',      // shipped
  'deferred',   // yes in principle, not now
  'declined',   // no
  'superseded', // a later decision replaced it
];

export function emptyLedger() {
  return { version: LEDGER_VERSION, decisions: [] };
}

const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');
const list = (v, max = 20) => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x).slice(0, max) : []);

export function normalizeLedger(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.decisions)) return emptyLedger();
  const seen = new Set();
  const decisions = [];
  for (const d of raw.decisions) {
    if (!d || typeof d !== 'object' || !d.id || seen.has(d.id)) continue;
    if (!str(d.title).trim()) continue;
    seen.add(d.id);
    decisions.push({
      id: String(d.id),
      title: str(d.title, 200),
      // KEVIN'S REASONING, in his words. The outcome without this is the thing
      // that gets re-proposed.
      why: str(d.why),
      // Where he said it. Same provenance rule as the practices: a citation
      // that cannot be followed makes the entry worthless as an authority.
      source: str(d.source, 300),
      dependencies: list(d.dependencies),
      // What would make this worth asking again. See the header.
      reconsiderIf: str(d.reconsiderIf, 1000),
      supersededBy: str(d.supersededBy, 120),
      status: DECISION_STATUSES.includes(d.status) ? d.status : 'proposed',
      at: typeof d.at === 'number' ? d.at : Date.now(),
    });
  }
  return { version: LEDGER_VERSION, decisions };
}

export function addDecision(store, partial, now = Date.now()) {
  const s = normalizeLedger(store);
  if (!partial || !String(partial.title || '').trim()) return s;
  const id = partial.id || `dec_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  if (s.decisions.some(d => d.id === id)) return s;
  const built = normalizeLedger({ decisions: [{ ...partial, id, at: partial.at || now }] }).decisions[0];
  return built ? { ...s, decisions: [built, ...s.decisions] } : s;
}

export function updateDecision(store, id, patch) {
  const s = normalizeLedger(store);
  return {
    ...s,
    decisions: s.decisions.map(d => (d.id === id
      ? normalizeLedger({ decisions: [{ ...d, ...patch, id: d.id, at: d.at }] }).decisions[0]
      : d)),
  };
}

// SUPERSEDING KEEPS BOTH. The old decision stays with a pointer forward, the
// same rule as label versions: a document written against the old decision
// should still be readable.
export function supersedeDecision(store, oldId, replacement, now = Date.now()) {
  let s = normalizeLedger(store);
  const next = addDecision(s, replacement, now);
  const newest = next.decisions[0];
  return {
    ...next,
    decisions: next.decisions.map(d => (d.id === oldId
      ? { ...d, status: 'superseded', supersededBy: newest ? newest.id : '' }
      : d)),
  };
}

// THE LOOKUP A COLLABORATOR SHOULD RUN BEFORE PROPOSING ANYTHING. Matches on
// title and reasoning, so "menu pdf" finds the decline whether or not the entry
// is titled the way the question was asked.
export function findDecisions(store, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(t => t.length > 2);
  if (!terms.length) return [];
  return normalizeLedger(store).decisions
    .map(d => {
      const hay = `${d.title} ${d.why} ${d.reconsiderIf}`.toLowerCase();
      const hits = terms.filter(t => hay.includes(t)).length;
      return { d, hits };
    })
    .filter(x => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map(x => x.d);
}

// Settled means declined or deferred and not yet superseded — the entries that
// should stop a proposal rather than inform one.
export function settledDecisions(store) {
  return normalizeLedger(store).decisions
    .filter(d => (d.status === 'declined' || d.status === 'deferred') && !d.supersededBy);
}

export function decisionCounts(store) {
  const d = normalizeLedger(store).decisions;
  const by = (st) => d.filter(x => x.status === st).length;
  return {
    total: d.length,
    proposed: by('proposed'),
    approved: by('approved'),
    built: by('built'),
    deferred: by('deferred'),
    declined: by('declined'),
    superseded: by('superseded'),
    // An entry with no stated reconsideration condition is the one most likely
    // to harden into dogma, so it is worth being able to count them.
    withoutReconsiderIf: d.filter(x => !x.reconsiderIf.trim()).length,
  };
}
