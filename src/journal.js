// journal.js — the knowledge base (K1–K8), pure and UI-free.
//
// WHY THIS EXISTS: the app is a structured body of knowledge about how Kevin
// cooks, which currently earns its keep by running a meal-prep business. The
// journal is where the WHY lives — decisions, price rationale, provenance,
// what done looks like, fixes, techniques, mistakes, retirements. Costs are
// reconstructible from receipts; "this sauce has broken, you can see it" is
// gone when Kevin forgets it. Perishability outranks convenience.
//
// PRIVACY IS STRUCTURAL, NOT A CHECKBOX. This module must NEVER be imported
// by companion.js, form/menu/main-menu tooling, or anything that composes
// customer-facing output. Diary-shaped material (provenance especially) is
// for Kevin and his son, not for customers. tests/journal.mjs enforces the
// no-import rule by scanning the customer surfaces; the private flag on top
// of that governs the few owner-side paths (the content studio) that draft
// text which LEAVES the device.
//
// Shape follows the pipelineJournal house pattern ({ version, ... }) but the
// body is an append-friendly ARRAY, not a keyed map: a dish accumulates many
// entries over years, and order-of-telling is part of the record.
// One store, one localStorage key (JOURNAL_KEY), rides the backup ring.

export const JOURNAL_VERSION = 1;

// type → { label, hint, privateDefault }
// provenance is private BY DEFAULT (Kevin's explicit call): where a dish came
// from and who taught it is the most perishable thing in the system and the
// most personal. Everything else defaults public-to-the-owner-app but can be
// flipped per entry.
export const JOURNAL_TYPES = {
  decision:   { label: 'Decision',        hint: 'A deliberate call that should not be "fixed" later (passthroughs, sub-floor pricing, exemptions).', privateDefault: false },
  price:      { label: 'Price rationale', hint: 'Why this price is what it is. Sub-floor warnings will cite this.', privateDefault: false },
  provenance: { label: 'Provenance',      hint: 'Where this came from, who taught it, what it is adapted from.', privateDefault: true },
  doneCues:   { label: 'What done looks like', hint: 'Sensory terms, not temperatures. The thing a recipe cannot carry.', privateDefault: false },
  adjustment: { label: 'Adjustment',      hint: 'Tastes flat → what fixes it (acid, salt, fat, heat).', privateDefault: false },
  technique:  { label: 'Technique',       hint: 'How it is actually made. Written while fresh — some dishes run twice a year.', privateDefault: false },
  mistake:    { label: 'Mistake',         hint: 'What went wrong and what fixed it. Kept as data, not fixed and forgotten.', privateDefault: false },
  retirement: { label: 'Retirement',      hint: 'Why a shipped dish was killed.', privateDefault: false },
};
export const JOURNAL_TYPE_ORDER = ['decision', 'price', 'provenance', 'doneCues', 'adjustment', 'technique', 'mistake', 'retirement'];

// Dependency-free id. utils.uid exists, but importing utils would drag menu.js
// and dishes.js into every consumer (including node tests) for eight random
// characters. Not worth the coupling.
const jid = () => 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function emptyJournal() {
  return { version: JOURNAL_VERSION, entries: [] };
}

// Tolerate anything localStorage or a hand-made payload can throw at us.
// Unknown fields on entries are PRESERVED (same non-destructive rule as
// migrations.js): a future field must survive a round-trip through old code.
export function normalizeJournal(raw) {
  if (!raw || typeof raw !== 'object') return emptyJournal();
  const entries = Array.isArray(raw.entries) ? raw.entries.filter(e => e && typeof e === 'object' && typeof e.text === 'string') : [];
  return { version: JOURNAL_VERSION, entries };
}

// ── The one stamping decision (T3 lives here) ──────────────────────────────
// Every entry is born with ts at write time. `undated: true` marks entries
// whose REAL date is unknown (migrated legacy notes): ts still orders them,
// but the UI must show "undated" — a backfilled date would measure when the
// migration ran, not when the note was true. Same principle that killed the
// rare badge.
export function stampEntry(partial, now) {
  const type = JOURNAL_TYPES[partial && partial.type] ? partial.type : 'technique';
  const subject = partial && partial.subject && partial.subject.kind === 'dish' && partial.subject.dish
    ? { kind: 'dish', dish: String(partial.subject.dish) }
    : { kind: 'general' };
  const priv = partial && typeof partial.private === 'boolean'
    ? partial.private
    : JOURNAL_TYPES[type].privateDefault;
  const entry = {
    ...partial, // unknown fields ride along (non-destructive)
    id: (partial && partial.id) || jid(),
    ts: (partial && partial.ts) || (now || new Date()).toISOString(),
    type,
    subject,
    text: String((partial && partial.text) || '').trim(),
    private: priv,
  };
  return entry;
}

export function addEntry(journal, partial, now) {
  const j = normalizeJournal(journal);
  const entry = stampEntry(partial, now);
  if (!entry.text) return j; // an empty entry is a mis-tap, not a record
  return { ...j, entries: [...j.entries, entry] };
}

// The journal is Kevin's own diary, so unlike the audit log it is editable:
// correcting your own record is not tampering. removeEntry is a real delete —
// "removed means gone" — not a soft flag.
export function updateEntry(journal, id, patch) {
  const j = normalizeJournal(journal);
  return { ...j, entries: j.entries.map(e => (e.id === id ? stampEntry({ ...e, ...patch, id: e.id, ts: e.ts }) : e)) };
}

export function removeEntry(journal, id) {
  const j = normalizeJournal(journal);
  return { ...j, entries: j.entries.filter(e => e.id !== id) };
}

// ── Reading ────────────────────────────────────────────────────────────────
// renames: pass utils.DISH_RENAMES so an entry written under an old dish name
// follows the dish (the exact silent break that hit the passport). Chain-
// following, capped at 5 hops, same as passport.js.
export function canonDishName(name, renames) {
  let n = name;
  const map = renames || {};
  for (let hop = 0; hop < 5 && map[n]; hop++) n = map[n];
  return n;
}

export function entriesForDish(journal, dishName, renames) {
  const j = normalizeJournal(journal);
  const target = canonDishName(dishName, renames);
  return j.entries.filter(e => e.subject && e.subject.kind === 'dish'
    && canonDishName(e.subject.dish, renames) === target);
}

export function generalEntries(journal) {
  const j = normalizeJournal(journal);
  return j.entries.filter(e => !e.subject || e.subject.kind !== 'dish');
}

// Owner-side surfaces that compose text which LEAVES the device (the content
// studio's worker call) must draw from this, never from raw entries.
export function publicEntries(entries) {
  return (entries || []).filter(e => !e.private);
}

// Newest price rationale for a dish — what the sub-floor warning cites so a
// deliberate spotlight price stops looking like an oversight six months on.
export function latestPriceRationale(journal, dishName, renames) {
  const list = entriesForDish(journal, dishName, renames)
    .filter(e => e.type === 'price' || e.type === 'decision')
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  const priced = list.find(e => e.type === 'price') || list[0];
  return priced || null;
}

// ── Legacy dishNotes migration (one-way, idempotent) ───────────────────────
// dishNotes was { [dishName]: string } — flat, undated, one slot per dish.
// Each non-empty note becomes ONE technique entry marked migrated+undated.
// Idempotent by content: an identical migrated entry for the same dish is
// never added twice, so boot-migration and payload-migration can both run
// without doubling anything.
export function migrateDishNotes(journal, dishNotes, now) {
  let j = normalizeJournal(journal);
  if (!dishNotes || typeof dishNotes !== 'object') return j;
  for (const [dish, text] of Object.entries(dishNotes)) {
    const t = String(text || '').trim();
    if (!t) continue;
    const dupe = j.entries.some(e => e.migrated === true
      && e.subject && e.subject.kind === 'dish' && e.subject.dish === dish
      && e.text === t);
    if (dupe) continue;
    j = addEntry(j, {
      type: 'technique',
      subject: { kind: 'dish', dish },
      text: t,
      migrated: true,
      undated: true, // real date unknown; never invent one
    }, now);
  }
  return j;
}

// ── The retirement nudge (K8, runtime — a gate test cannot see localStorage)
// Dishes that appear in real order history but are no longer in the registry
// and have no retirement entry. Caller passes the name sets so this module
// stays dependency-free:
//   knownNames — every name the app still serves (dinners + always items,
//                per-lb included). Anything outside it that people ORDERED
//                is a dish that left the menu.
// Nudge, never block (Kevin's call).
export function missingRetirementRecords(journal, orders, knownNames, renames) {
  const known = knownNames instanceof Set ? knownNames : new Set(knownNames || []);
  const recorded = new Set(
    normalizeJournal(journal).entries
      .filter(e => e.type === 'retirement' && e.subject && e.subject.kind === 'dish')
      .map(e => canonDishName(e.subject.dish, renames))
  );
  const missing = new Set();
  for (const o of orders || []) {
    for (const it of (o && o.items) || []) {
      if (!it || !it.name || it.omakase) continue; // an omakase is an act of trust, not a catalog dish
      const canon = canonDishName(it.name, renames);
      if (known.has(canon) || recorded.has(canon)) continue;
      missing.add(canon);
    }
  }
  return [...missing].sort();
}
