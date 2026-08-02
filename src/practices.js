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
    sources: ['Kevin, recorded in the cook-week rhythm: close Sunday, shop and seal Monday, cook Tuesday, deliver Wednesday'],
    status: 'proposed',
  },
  {
    id: 'pr_seed_cook_after_order',
    text: 'Nothing gets cooked until an order exists for it.',
    why: 'It is why there is no waste beyond trim, which the recipes already account for.',
    where: 'Every dinner. It is also why robustness ideas built around spoilage and overproduction do not apply here.',
    sources: ['Kevin, Jul 25, rejecting operational generators: no waste beyond trim, because he only cooks after an order exists'],
    status: 'proposed',
  },
  {
    id: 'pr_seed_gentle_heat',
    text: 'Gentle heat, and do not boil. Thick things run hot on the outside while the middle is still cold.',
    why: 'Boiling does not get the centre there faster, it just damages the outside first.',
    where: 'Stated on Brunswick Stew and then repeated across the reheat walk, so it reads as general rather than per dish.',
    sources: ['Kevin, Walk 2, given on Brunswick and repeated'],
    status: 'proposed',
  },
  {
    id: 'pr_seed_freezer_staging',
    text: 'The freezer is used to stage components ahead of the cook day.',
    why: 'It moves work off Tuesday, which is the day with the least room in it.',
    where: 'Across the week rather than any one dish.',
    sources: ['Kevin, Jul 25, noting he already does this when it was proposed to him as new'],
    status: 'proposed',
  },
  {
    id: 'pr_seed_inventory_before_shopping',
    text: 'Containers get counted before shopping, not after running out.',
    why: 'A missing container is only a problem if it is discovered on pack day; found on the shopping trip it is a two-dollar errand.',
    where: 'Weekly, before the H-E-B run.',
    sources: ['Kevin, Jul 25: containers refill with a quick H-E-B trip and he inventories before shopping'],
    status: 'proposed',
  },
  {
    id: 'pr_seed_customer_verb_ceiling',
    text: 'Some finishing work is deliberately kept out of the customer\u2019s kitchen.',
    why: 'The customer is asked to sear a sous vide bag protein, boil a starch, reheat a bag, or run a broiler. Never to handle a raw protein, make a batter, or cook live shellfish. The line is about what can go wrong in someone else\u2019s kitchen, not about difficulty.',
    where: 'Every dish on the menu; it constrains what can be on the menu at all.',
    sources: ['Kevin, recorded as the customer verb ceiling in the food-science platform notes'],
    status: 'proposed',
  },
  {
    id: 'pr_seed_correcting_beats_composing',
    text: 'Correcting a draft beats composing from a blank page, every time.',
    why: 'Capture has to survive being done one-handed in a checkout line. A prefilled wrong answer gets fixed; an empty box gets closed.',
    where: 'Every capture surface in the app, and how work should be handed to him generally.',
    sources: ['Kevin, standing instruction, recorded in how-he-works'],
    status: 'proposed',
  },
  {
    id: 'pr_seed_weekly_unsold_dish',
    text: 'One dish a week gets cooked that is not for sale.',
    why: 'He was already doing this before it was ever suggested as a practice.',
    where: 'Outside the order book entirely.',
    sources: ['Kevin, Jul 24, noted as something he already does unprompted'],
    status: 'proposed',
  },
  {
    id: 'pr_seed_failure_prone_finishes',
    text: 'Work that is easy to get wrong happens here, before delivery, not in the customer\u2019s kitchen.',
    why: 'A finish that fails in someone else\u2019s kitchen fails on my name, and they have none of the context to rescue it.',
    where: 'It is the reason behind the customer verb ceiling rather than a restatement of it.',
    sources: ['Feature systems master, Aug 1, listing it among the practices already evident in how LTB runs'],
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
