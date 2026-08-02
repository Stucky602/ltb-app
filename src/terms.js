// terms.js — what Kevin means by his own words.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
//
// This project runs on a private vocabulary. "Reheat gate", "wow path",
// "customer clock", "bag is the vessel", "prospecting" — each is a precise idea
// with a history, and each has already been misread at least once by someone
// working from the words alone. "Prospecting" was read as menu development when
// it means the opposite. "Cook" as a cut-gate reason was read as a compliment
// about difficulty when it means "not right for LTB", and Kevin had to correct
// that twice.
//
// Both of those cost real work. A term that means something specific and is
// only defined in a chat transcript will be misread again, by a future
// collaborator, by a future handoff document, and eventually by Rowan.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE FIELD THAT MATTERS MOST IS `misreadings`
//
// A definition tells you what a word means. It does not stop the specific wrong
// reading that keeps happening, because whoever makes that mistake believes
// they have understood. Recording the misreading alongside the definition is
// what makes the entry defensive rather than merely descriptive — it is the
// difference between "prospecting means X" and "prospecting means X, and it is
// repeatedly mistaken for menu development, which is nearly its opposite."
//
// ═══════════════════════════════════════════════════════════════════════════
// DEFINITIONS CHANGE, AND THE OLD ONE IS NOT DELETED
//
// `history` keeps superseded definitions with the date they stopped applying,
// for the same reason label versions do: a decision made in March was made
// against March's meaning of the word, and a document written then should still
// be readable. Same append-only rule as everywhere else in this app.
//
// Seeds arrive `proposed`, from terms recorded in Kevin's own materials, each
// citing where the wording came from. A proposal is not a definition.

export const TERMS_VERSION = 1;
export const TERM_STATUSES = ['proposed', 'confirmed', 'retired'];

export function emptyTerms() {
  return { version: TERMS_VERSION, terms: [] };
}

const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');
const list = (v, max = 30) => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x).slice(0, max) : []);

export function normalizeTerms(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.terms)) return emptyTerms();
  const seen = new Set();
  const terms = [];
  for (const t of raw.terms) {
    if (!t || typeof t !== 'object' || !t.id || seen.has(t.id)) continue;
    seen.add(t.id);
    terms.push({
      id: String(t.id),
      term: str(t.term, 120),
      definition: str(t.definition),
      examples: list(t.examples),
      nonExamples: list(t.nonExamples),
      // The defensive field. See the header.
      misreadings: list(t.misreadings),
      relatedPractices: list(t.relatedPractices),
      relatedCode: list(t.relatedCode),
      history: Array.isArray(t.history)
        ? t.history.slice(0, 20).map(h => ({
          definition: str(h && h.definition),
          supersededAt: typeof (h && h.supersededAt) === 'number' ? h.supersededAt : null,
        }))
        : [],
      sources: list(t.sources),
      status: TERM_STATUSES.includes(t.status) ? t.status : 'proposed',
      ts: typeof t.ts === 'number' ? t.ts : Date.now(),
    });
  }
  return { version: TERMS_VERSION, terms };
}

export function addTerm(store, partial, now = Date.now()) {
  const s = normalizeTerms(store);
  const term = str(partial && partial.term, 120).trim();
  if (!term) return s;
  const id = (partial && partial.id) || `tm_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  if (s.terms.some(t => t.id === id)) return s;
  const entry = normalizeTerms({ terms: [{ ...partial, id, term, ts: now }] }).terms[0];
  return { ...s, terms: [...s.terms, entry] };
}

// Changing a definition PUSHES the old one into history rather than discarding
// it. Editing any other field does not, because only the definition is the
// thing other records were written against.
export function updateTerm(store, id, patch, now = Date.now()) {
  const s = normalizeTerms(store);
  return {
    ...s,
    terms: s.terms.map(t => {
      if (t.id !== id) return t;
      const changingDefinition = typeof patch.definition === 'string'
        && patch.definition.trim() !== t.definition.trim()
        && t.definition.trim();
      const history = changingDefinition
        ? [{ definition: t.definition, supersededAt: now }, ...t.history]
        : t.history;
      return normalizeTerms({ terms: [{ ...t, ...patch, id: t.id, ts: t.ts, history }] }).terms[0];
    }),
  };
}

export const confirmedTerms = (store) => normalizeTerms(store).terms.filter(t => t.status === 'confirmed');

export function termCounts(store) {
  const t = normalizeTerms(store).terms;
  return {
    total: t.length,
    proposed: t.filter(x => x.status === 'proposed').length,
    confirmed: t.filter(x => x.status === 'confirmed').length,
    retired: t.filter(x => x.status === 'retired').length,
  };
}

// Find a term mentioned in a piece of text. Whole-word, case-insensitive, and
// longest-first so "bag is the vessel" wins over "bag". Used to link a record
// to the vocabulary it uses without anyone tagging anything by hand.
export function termsMentionedIn(store, text) {
  const hay = String(text || '').toLowerCase();
  if (!hay) return [];
  return confirmedTerms(store)
    .filter(t => t.term && hay.includes(t.term.toLowerCase()))
    .sort((a, b) => b.term.length - a.term.length);
}

// ═══════════════════════════════════════════════════════════════════════════
// SEEDS
//
// Every one is a term already in active use in this project's own materials,
// with the definition drawn from how it is actually used there rather than
// invented. All `proposed`: the wording below is Claude's reading, and a term
// Kevin has not approved is not a definition — which matters more here than
// almost anywhere else, because these entries are meant to become the
// authority that future handoffs and explanations defer to.
export const TERM_SEEDS = [
  {
    id: 'tm_seed_reheat_gate',
    term: 'reheat gate',
    definition: 'The test a dish has to pass before it can go on the menu at all: it must survive being '
      + 'cooked, chilled, held for days, and brought back by someone else in their own kitchen — and still '
      + 'be worth the money. A dish that is only excellent straight out of the pan fails.',
    examples: ['A braise that is better on Wednesday than it was on Tuesday passes easily.'],
    nonExamples: ['Anything depending on a crust or a foam that exists for ten minutes.'],
    misreadings: ['It is not a quality bar in general. A dish can be superb and still fail the reheat gate.'],
    sources: ['Used throughout the LTB menu pipeline and the feature systems master'],
    status: 'proposed',
  },
  {
    id: 'tm_seed_wow_path',
    term: 'wow path',
    definition: 'Which lever earns a dish its place on the menu. Recorded per dish and not mutually '
      + 'exclusive: familiar-and-beloved, unfamiliar-and-poppy, or heartstrings.',
    examples: ['Chili is familiarBeloved. Pecan Mole-Fesenjan is unfamiliarPop.'],
    misreadings: ['It is not a rating. Two dishes with different wow paths are not ranked against each other.'],
    relatedCode: ['dishes.js wowPath'],
    sources: ['dishes.js field comment and the menu pipeline notes'],
    status: 'proposed',
  },
  {
    id: 'tm_seed_customer_clock',
    term: 'customer clock',
    definition: 'The order window as the customer experiences it: orders close Sunday night, shopping and '
      + 'sealing happen Monday, cooking Tuesday, delivery Wednesday. Deadlines and banners are all '
      + 'expressed against it.',
    misreadings: ['Not the same as the cook clock. What is late for Kevin and what is late for a customer '
      + 'are different instants.'],
    relatedCode: ['timeBanners.js nextOrderDeadline'],
    sources: ['The cook-week rhythm as recorded in the handoff'],
    status: 'proposed',
  },
  {
    id: 'tm_seed_bag_is_vessel',
    term: 'bag is the vessel',
    definition: 'A component where the sealed bag is part of the cooking method, not just packaging. '
      + 'Opening it early costs you the result, so it cannot be divided, and reheat copy must never tell '
      + 'someone to open it before the warming stage.',
    examples: ['The polenta bag.'],
    nonExamples: ['A bag of pico that is simply a container and can be opened whenever.'],
    misreadings: ['It is not a durability claim about the bag. It is a claim about the method.'],
    relatedCode: ['reheatData.js DIVIDE_MODES bag-is-vessel', 'splitPackaging.js BAD_DIVIDE'],
    sources: ['reheatData.js divide modes; named as an executable canon rule in the systems master'],
    status: 'proposed',
  },
  {
    id: 'tm_seed_prospecting',
    term: 'prospecting',
    definition: 'Exploring the full space of what an interaction could be, in order to find shapes nobody '
      + 'has thought of yet. It is exploration for its own sake first and a source of candidates second.',
    misreadings: ['Repeatedly mistaken for menu development or feature shortlisting, which is nearly the '
      + 'opposite: narrowing toward what ships, rather than widening to see what exists.'],
    sources: ['The polyglot work; corrected once when the scope was read as menu prospecting'],
    status: 'proposed',
  },
];

// Idempotent by id AND by term text, matching the practice seeds: a term Kevin
// has reworded is his, and re-seeding must never restore Claude's draft
// alongside it.
export function seedTerms(store, seeds = TERM_SEEDS, now = Date.now()) {
  let s = normalizeTerms(store);
  const haveIds = new Set(s.terms.map(t => t.id));
  const haveTerms = new Set(s.terms.map(t => t.term.trim().toLowerCase()));
  for (const seed of seeds) {
    if (haveIds.has(seed.id)) continue;
    if (haveTerms.has(String(seed.term).trim().toLowerCase())) continue;
    s = addTerm(s, seed, now);
  }
  return s;
}
