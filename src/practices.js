// practices.js — how Kevin works, when the knowledge belongs to no single dish.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
//
// The journal records things about DISHES, and general chapters record things
// about his past. Neither has a home for a standing practice: the
// Monday-to-Tuesday fridge rest being working time, cooking only after an order
// exists, gentle heat and never a boil because thick things run hot outside
// while the middle is still cold. Those are not facts about Bolognese. They are
// how the kitchen is run, they apply across dishes, weeks, and customers, and
// until now the only place they existed was chat transcripts and Kevin's head.
//
// This is the file that stops that. It is private, it is Kevin's, and it is the
// same kind of long-horizon record as the dossier: the app earns its keep
// running a meal-prep business, and what it is actually FOR is being a
// structured body of knowledge about how he cooks.
//
// ═══════════════════════════════════════════════════════════════════════════
// TWO RULES THAT SHAPE THE WHOLE FILE
//
// 1. NO TAXONOMY UNTIL THERE IS A CORPUS. There is no category enum here and
//    that is deliberate, on Kevin's instruction. A category list invented in an
//    afternoon before a single real entry exists would decide in advance what
//    kinds of practice are allowed to be recorded, and every later entry would
//    get bent to fit it. Categories emerge from the corpus or they do not
//    happen. The same mistake was already made and corrected once with the
//    journal's nine entry types.
//
// 2. ONLY KEVIN CONFIRMS. Everything seeded below arrives as `proposed`, never
//    `confirmed`, and a proposed entry is not canon: it does not print into the
//    archive, and nothing else may read it as a fact. This is the
//    correcting-beats-composing rule made structural — a drafted practice he
//    corrects in ten seconds beats an empty box he never opens — but it must
//    never let a draft impersonate a decision. The seeds below are Claude's
//    reading of things Kevin SAID; each carries its source so he can check the
//    reading rather than take it on trust.
//
// A note on the reversal: this app previously ruled that the practice layer was
// a DOCUMENT and not a feature, because Claude kept proposing Kevin's own
// existing practices back to him as new ideas. That ruling was about bad
// proposals, not about storage. Kevin approved this as a first-class record on
// Jul 31. The old lesson still applies INSIDE it: "I already do that" is a bug
// report against the record, not a reason to argue.

export const PRACTICES_VERSION = 1;

// proposed  — drafted, not yet Kevin's word. Never canon, never exported.
// confirmed — Kevin's, in his words. Canon.
// retired   — no longer how he works. KEPT, because when a practice stopped
//             being true is itself worth knowing; a decade-long record that
//             silently deletes its own changes of mind is a worse record.
export const PRACTICE_STATUSES = ['proposed', 'confirmed', 'retired'];

export function emptyPractices() {
  return { version: PRACTICES_VERSION, entries: [] };
}

function cleanStr(v, max = 4000) {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

function cleanList(v, max = 40) {
  return Array.isArray(v) ? v.filter(x => typeof x === 'string' && x).slice(0, max) : [];
}

export function normalizePractices(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.entries)) return emptyPractices();
  const seen = new Set();
  const entries = [];
  for (const e of raw.entries) {
    if (!e || typeof e !== 'object' || !e.id || seen.has(e.id)) continue;
    seen.add(e.id);
    entries.push({
      id: String(e.id),
      text: cleanStr(e.text),
      why: cleanStr(e.why),
      where: cleanStr(e.where),
      exceptions: cleanStr(e.exceptions),
      examples: cleanList(e.examples),
      dishIds: cleanList(e.dishIds),
      entryIds: cleanList(e.entryIds),
      sources: cleanList(e.sources),
      status: PRACTICE_STATUSES.includes(e.status) ? e.status : 'proposed',
      lastConfirmedAt: typeof e.lastConfirmedAt === 'number' ? e.lastConfirmedAt : null,
      ts: typeof e.ts === 'number' ? e.ts : Date.now(),
    });
  }
  return { version: PRACTICES_VERSION, entries };
}

export function addPractice(store, partial, now = Date.now()) {
  const s = normalizePractices(store);
  const text = cleanStr(partial && partial.text).trim();
  if (!text) return s; // an empty practice is a mis-tap, not a record
  const id = (partial && partial.id) || `pr_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  if (s.entries.some(e => e.id === id)) return s;
  const entry = normalizePractices({ entries: [{ ...partial, id, text, ts: now }] }).entries[0];
  return { ...s, entries: [...s.entries, entry] };
}

export function updatePractice(store, id, patch, now = Date.now()) {
  const s = normalizePractices(store);
  return {
    ...s,
    entries: s.entries.map(e => {
      if (e.id !== id) return e;
      const next = { ...e, ...patch, id: e.id, ts: e.ts };
      // Confirming stamps WHEN. A practice can drift out of true without anyone
      // noticing, and "he confirmed this two years ago" is a different claim
      // from "he confirmed this last month". The date is how a stale practice
      // becomes visible instead of just becoming wrong.
      if (patch && patch.status === 'confirmed' && e.status !== 'confirmed') {
        next.lastConfirmedAt = now;
      }
      return normalizePractices({ entries: [next] }).entries[0];
    }),
  };
}

export function removePractice(store, id) {
  const s = normalizePractices(store);
  return { ...s, entries: s.entries.filter(e => e.id !== id) };
}

// Canon only. Every reader that presents a practice as Kevin's word must go
// through this, never `entries` directly.
export function confirmedPractices(store) {
  return normalizePractices(store).entries.filter(e => e.status === 'confirmed');
}

export function practiceCounts(store) {
  const e = normalizePractices(store).entries;
  return {
    total: e.length,
    proposed: e.filter(x => x.status === 'proposed').length,
    confirmed: e.filter(x => x.status === 'confirmed').length,
    retired: e.filter(x => x.status === 'retired').length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SEEDS
//
// ═══════════════════════════════════════════════════════════════════════════
// THE PROVENANCE RULE, WRITTEN DOWN AFTER BREAKING IT (Aug 2)
//
// Four seeds were deleted here, not reworded, on Kevin's instruction. He read
// the drafts and did not recognise three of them; the audit found why, and it
// is worth stating plainly so it does not recur.
//
// They were seeded from HANDOFF_28's description of this very feature, which
// reads "Examples include treating the Monday-to-Tuesday refrigerator rest as
// working time, correcting a prepared draft instead of composing from a blank
// page, freezer staging, searing tofu before delivery..." — a spec listing
// HYPOTHETICAL examples of what a practice library might hold. Those became
// entries carrying a `sources` line that claimed they were recorded statements
// of his. They never were.
//
// So: A SPEC IS NOT A SOURCE. Neither is another Claude-written document, and
// neither is this file's own earlier draft. A seed needs a place where Kevin
// said the thing — a walk transcript, a recorded ruling, or data in the repo he
// entered. If the citation cannot be followed to one of those, DELETE the seed
// rather than rewording it: a reworded untraceable entry keeps the provenance
// claim while losing the last link to whatever it came from, which is strictly
// worse than nothing.
//
// The survivors trace. Gentle-heat is the strongest — his own words sit in
// reheatData.js. Fridge-rest appears in HANDOFF_28 as a statement rather than
// an example. The remaining three were confirmed by him in writing on Aug 2.
//
// PROCESS NOTE, also his: a practice shown as a bare title is not confirmable.
// He needs the full statement with its source attached, one at a time. The
// Practices pane does this; anything that summarises these into a list for
// review must not.
//
// Every one of these is something Kevin SAID, recorded at the time, with the
// source named. None is inferred from his behaviour and none is a good idea
// Claude had about how a kitchen should run — that distinction is the entire
// reason this list is safe to ship and would be the first thing to go wrong if
// it were relaxed.
//
// They arrive as `proposed` because a recorded statement is not the same thing
// as a practice he has agreed to write down as canon. He corrects the wording,
// or rejects it, or confirms it. Seeding is idempotent BY TEXT, matching the
// dossier seeds: re-running never duplicates, and an entry Kevin has edited is
// left alone rather than reverted to Claude's draft.
export const PRACTICE_SEEDS = [
  {
    id: 'pr_seed_fridge_rest',
    text: 'The Monday-to-Tuesday rest in the fridge is working time, not waiting.',
    why: 'The menu deliberately favours dishes that get better over that rest, so the gap between cooking and delivery is doing something rather than being tolerated.',
    where: 'The whole cook week. It is part of why braises and stews dominate the board.',
    sources: ['Kevin, confirmed as written, walks side chat Aug 2. Also on record in HANDOFF_28: \'fridge rest is working time\'.'],
    status: 'confirmed',
  },
  {
    id: 'pr_seed_cook_after_order',
    text: 'Nothing gets cooked until an order exists for it.',
    why: 'It is why there is no waste beyond trim, which the recipes already account for.',
    where: 'Every dinner. It is also why robustness ideas built around spoilage and overproduction do not apply here.',
    sources: ['Kevin, confirmed as written, walks side chat Aug 2.'],
    status: 'confirmed',
  },
  {
    id: 'pr_seed_gentle_heat',
    text: 'Gentle heat, and do not boil. Thick things run hot on the outside while the middle is still cold.',
    why: 'Boiling does not get the centre there faster, it just damages the outside first.',
    where: 'Stated on Brunswick Stew and then repeated across the reheat walk, so it reads as general rather than per dish.',
    sources: ['Kevin, confirmed as written, walks side chat Aug 2. His own words are in reheatData.js: thicker items run hot on the outside while the middle is still cold.'],
    status: 'confirmed',
  },
  {
    id: 'pr_seed_inventory_before_shopping',
    text: 'Containers get counted before shopping, not after running out.',
    why: 'A missing container is only a problem if it is discovered on pack day; found on the shopping trip it is a two-dollar errand.',
    where: 'Weekly, before the H-E-B run.',
    sources: ['Kevin, confirmed as written, walks side chat Aug 2 (\'count containers before shopping\').'],
    status: 'confirmed',
  },
  {
    id: 'pr_seed_customer_verb_ceiling',
    // CORRECTED BY KEVIN, Aug 2, and the correction reverses the draft. The
    // original said he ABSORBS the work into the kitchen. He does not: he will
    // not ask the customer to do it AT ALL. Those two readings produce different
    // dishes — one takes a step off the customer's plate, the other removes the
    // dish from consideration.
    //
    // The tofu sear was cited as an example of absorbed labour and that was
    // wrong too. He sears it because it HOLDS ITS TEXTURE. A texture decision,
    // not a labour one.
    text: 'Past what I will ask a customer to do, I do not take the work on \u2014 the dish just does not happen.',
    why: 'Two distinct triggers, and only the first is about cooking at all. (1) The verb is too hard: fried items simply get the boot. '
      + '(2) The packaging burden is too high: pomegranate seeds, pepitas, pickled onions, rice, and tortillas all as separate things to pack and hand over is too much.',
    where: 'It constrains what can be on the menu at all, rather than describing how a dish is prepped.',
    examples: ['Fried items get the boot on the verb trigger.',
      'The pomegranate-seeds-plus-pepitas-plus-pickled-onions-plus-rice-plus-tortillas case is the packaging trigger.'],
    exceptions: 'The tofu sear is NOT an example of this. It is seared for texture, not to spare anyone the work.',
    sources: ['Kevin, walks side chat Aug 2, correcting the earlier draft outright'],
    status: 'proposed',
  },
  {
    id: 'pr_seed_sv_bag_colour',
    text: 'Vegetables never share a sous vide bag, because the colours bleed together.',
    why: 'He gave this as the reason the Leblanc kabocha and carrots are in separate bags.',
    where: 'Stated as current kitchen-wide behaviour across every recipe, not as a Leblanc fact. '
      + 'Confirm or narrow the scope \u2014 it arrived as a general claim and has not been tested against every dish.',
    sources: ['Kevin, walks side chat, Aug 1, explaining the Leblanc two-bag structure'],
    status: 'proposed',
  },
  {
    id: 'pr_seed_bag_is_vessel_practice',
    text: 'When the bag is the vessel, it changes both the packaging and the reheat instructions, not just one.',
    why: 'Opening it early costs the method, so the copy and the pack have to agree or one of them is lying.',
    where: 'Polenta today; anything cooked in its own sealed bag.',
    sources: ['Feature systems master, Aug 1; recorded as a divide mode in reheatData.js'],
    status: 'proposed',
  },
];

// Idempotent by TEXT, not by a flag. A flag would re-seed after any wipe of it,
// and matching on text means an entry Kevin has REWORDED counts as his and is
// never replaced by the draft it came from.
export function seedPractices(store, seeds = PRACTICE_SEEDS, now = Date.now()) {
  let s = normalizePractices(store);
  const have = new Set(s.entries.map(e => e.text.trim().toLowerCase()));
  const haveIds = new Set(s.entries.map(e => e.id));
  for (const seed of seeds) {
    if (haveIds.has(seed.id)) continue;
    if (have.has(String(seed.text).trim().toLowerCase())) continue;
    s = addPractice(s, seed, now);
  }
  return s;
}
