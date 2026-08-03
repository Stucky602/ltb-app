// tests/notes_and_ledger.mjs — the two stores approved Aug 2 that needed
// nothing from Kevin to build.
//
// NOTES FOR ROWAN: the property is that nothing improves it. No generator, no
// summariser, no milestone gate. Kevin's instruction was that it stay
// intentionally simple, and every feature anyone would be tempted to add here
// replaces his words with something smoother.
//
// DECISION LEDGER: the property is that a decision without its REASONING is the
// thing that gets re-proposed, and a decision without a reconsideration
// condition hardens into dogma.

import {
  emptyNotes, normalizeNotes, addNote, attachMedia, removeNote,
  notesTimeline, notesAbout, noteCounts, NOTE_SUBJECTS,
} from '../src/notesForRowan.js';
import {
  emptyLedger, normalizeLedger, addDecision, updateDecision, supersedeDecision,
  findDecisions, settledDecisions, decisionCounts, DECISION_STATUSES,
} from '../src/decisionLedger.js';
import { readFileSync } from 'node:fs';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// ── NOTES FOR ROWAN ─────────────────────────────────────────────────────────
{
  ok('it ships empty', emptyNotes().notes.length === 0);

  let s = addNote(emptyNotes(), { text: 'The first thing I want you to know about heat.' });
  ok('a note saves with words alone', s.notes.length === 1);
  ok('and needs no subject', s.notes[0].subjectKind === 'none',
    'some things are about a dish; some are just things he wanted to say');

  ok('an empty note is refused',
    addNote(emptyNotes(), { text: '   ' }).notes.length === 0);
  const mediaOnly = addNote(emptyNotes(), {
    text: '', media: [{ kind: 'audio', mediaKey: 'nr_1.webm', seconds: 30 }],
  });
  ok('but audio alone is enough', mediaOnly.notes.length === 1);

  const linked = addNote(emptyNotes(), {
    text: 'Why we wait a day.', subjectKind: 'practice', subjectId: 'pr_seed_fridge_rest',
  });
  ok('a note can hang off a real record', notesAbout(linked, 'practice').length === 1);
  ok('an unknown subject falls back rather than being stored',
    normalizeNotes({ notes: [{ id: 'a', text: 'x', subjectKind: 'planet' }] }).notes[0].subjectKind === 'none');

  s = attachMedia(s, s.notes[0].id, { kind: 'photo', mediaKey: 'nr_p.webp' });
  ok('media attaches by key, never bytes',
    normalizeNotes(s).notes[0].media[0].mediaKey === 'nr_p.webp');
  ok('media with no key is refused',
    attachMedia(s, s.notes[0].id, { kind: 'photo' }).notes[0].media.length === 1);

  // DELETION IS ALLOWED, unlike almost every other store here.
  ok('a note can be deleted outright',
    removeNote(s, s.notes[0].id).notes.length === 0,
    'elsewhere records are marked rather than erased; a private message to his son is different, '
    + 'and an app that preserved it against his wishes would have overruled him about his own words');

  let many = addNote(emptyNotes(), { text: 'later', at: 2000 });
  many = addNote(many, { text: 'earlier', at: 1000 });
  ok('the timeline runs oldest first, which is how it will be read',
    notesTimeline(many)[0].text === 'earlier');

  ok('counts add up', noteCounts(many).total === 2);
  ok('every subject has a label the UI can show', NOTE_SUBJECTS.every(x => x.id && x.label));

  // The property that matters most.
  const src = readFileSync(new URL('../src/notesForRowan.js', import.meta.url), 'utf8');
  ok('nothing in the module generates, rewrites, or summarises a note',
    !/summari|rewrite|generate|polish|suggest/i.test(
      src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')),
    'Kevin: not generated, not rewritten, not delayed by artificial milestones');
  // Comments stripped for BOTH checks. The header of that file explains why
  // there are no milestones, so it contains the word — the same self-matching
  // trap this repo has now hit six times.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('and there is no unlock, milestone, or scheduled release',
    !/unlock|milestone|releaseAt|deliverAt|age >= /i.test(code),
    'a note is available from the moment he writes it');
}

// ── DECISION LEDGER ─────────────────────────────────────────────────────────
{
  ok('it ships empty', emptyLedger().decisions.length === 0,
    'seeding it from a backlog would repeat the practice-seed failure, and worse: '
    + 'its whole purpose is to be the authority nobody re-litigates');

  let s = addDecision(emptyLedger(), {
    title: 'Menu PDFs',
    why: 'The order form already carries the menu.',
    source: 'Kevin, backlog 8F',
    reconsiderIf: 'The order form stops carrying the full menu.',
    status: 'declined',
  });
  ok('a decision records the reasoning, not just the outcome',
    s.decisions[0].why.length > 0,
    'the outcome survives in the code; the reasoning is what gets lost and re-proposed');
  ok('and where Kevin said it', s.decisions[0].source.length > 0);
  ok('and what would reopen it', s.decisions[0].reconsiderIf.length > 0,
    'a decision with no stated conditions is indistinguishable from dogma');

  ok('a decision with no title is refused',
    addDecision(emptyLedger(), { why: 'x' }).decisions.length === 0);
  ok('an unknown status falls back to proposed, never approved',
    normalizeLedger({ decisions: [{ id: 'a', title: 't', status: 'shipped-probably' }] })
      .decisions[0].status === 'proposed',
    'falling back to approved would let a malformed record authorise something');

  ok('the search finds it by a word from the reasoning',
    findDecisions(s, 'order form').length === 1,
    'a collaborator asks "why no menu pdf" in their own words, not the entry title');
  ok('and returns nothing for an unrelated query',
    findDecisions(s, 'zzzqq').length === 0);

  ok('settled decisions are the ones that should stop a proposal',
    settledDecisions(s).length === 1);

  const sup = supersedeDecision(s, s.decisions[0].id, {
    title: 'Menu PDFs, revisited', why: 'The form changed.', status: 'approved',
  });
  const old = normalizeLedger(sup).decisions.find(d => d.id === s.decisions[0].id);
  ok('superseding KEEPS the old decision and points forward',
    old.status === 'superseded' && !!old.supersededBy,
    'a document written against the old decision should still be readable');
  ok('and the superseded one stops counting as settled',
    settledDecisions(sup).length === 0);

  const counts = decisionCounts(addDecision(s, { title: 'No reason given' }));
  ok('entries with no reconsideration condition are countable',
    counts.withoutReconsiderIf === 1,
    'they are the ones most likely to harden into dogma');
  ok('every status is distinct', new Set(DECISION_STATUSES).size === DECISION_STATUSES.length);
}

// ── OMAKASE CONTAINERS ACTUALLY RECONCILE ───────────────────────────────────
//
// Kevin: "make sure it ACTUALLY reconciles vs inventory, and also reconciles
// back if I say add one to begin with but then remove it before delivered.
// Double check it's an actual function doing something vs just storing data."
//
// It is not stored-and-forgotten. Container demand and custody are DERIVED from
// the live orders on every read, so an omakase's recorded containers feed both,
// and editing or removing them simply produces a smaller number next time.
// A delta-based design would have needed reversal bookkeeping and would drift
// the first time a save was interrupted.
{
  const { orderContainerBreakdown, sumBreakdowns, containerCustody, RETURNABLE_TYPES } =
    await import('../src/containers.js');

  const withUsed = (used, status = 'Ordered') => ({
    status, createdAt: new Date().toISOString(),
    items: [{ name: 'Omakase', omakase: true, ...(used ? { containersUsed: used } : {}) }],
  });

  ok('an omakase with no containers recorded contributes nothing',
    orderContainerBreakdown(withUsed(null)).round16 === 0,
    'it used to be skipped outright, which was right while there was no way to record them');

  const b = orderContainerBreakdown(withUsed({ round16: 2, round32: 1 }));
  ok('recorded containers reach the weekly demand, BY TYPE',
    b.round16 === 2 && b.round32 === 1,
    'a flat count cannot reconcile: the fleet has 16 of the 16oz and 5 of the 32');

  ok('the migration bucket is NOT charged to a real type',
    orderContainerBreakdown(withUsed({ unspecified: 3 })).round16 === 0,
    'orders logged before types existed have an untyped debt; guessing a type would be a guess');

  // THE REVERSAL, which is the part Kevin asked about.
  ok('removing a row reduces demand with no undo step',
    sumBreakdowns([withUsed({ round16: 2 })]).round16 === 2
    && sumBreakdowns([withUsed({ round16: 0 })]).round16 === 0
    && sumBreakdowns([withUsed(null)]).round16 === 0,
    'demand is recomputed from the orders, so there is nothing to reverse');

  ok('and lowering a count lowers it rather than adding again',
    sumBreakdowns([withUsed({ round16: 1 })]).round16 === 1,
    'a delta-based version would have double-counted on a second save');

  // Custody: once delivered, they are out at a household.
  const cust = containerCustody([withUsed({ round16: 2 }, 'Delivered')], []);
  const row = cust.rows.find(r => r.type === 'round16');
  ok('a DELIVERED omakase shows its containers as out',
    row.out === 2 && row.onHandMin === row.owned - 2,
    JSON.stringify(row));
  ok('and the household appears as a holder',
    cust.holders.length === 1 && cust.holders[0].outstanding === 2);

  ok('sous vide bags are not offered as returnables',
    !RETURNABLE_TYPES.some(t => t.id === 'bag'),
    'a bag is not a returnable and never comes back');
}

// ── LIVING MYSTERY BOARDS ───────────────────────────────────────────────────
//
// A genuine long-running question of Rowan's, with evidence accumulating over
// years. Not a quiz and not a project with a due date.
{
  const {
    emptyBoards, openBoard, addEvidence, answerBoard, openBoards, answeredBoards,
    boardTimeline, boardCounts, EVIDENCE_KINDS,
  } = await import('../src/rowanParticipation.js');
  const fs = await import('node:fs');

  ok('it ships empty', emptyBoards().boards.length === 0);

  let s = openBoard(emptyBoards(), 'Why does the bread get hard?');
  ok('a board opens from a real question', s.boards.length === 1);
  ok('a board with no question is refused',
    openBoard(emptyBoards(), '   ').boards.length === 0,
    'nothing here generates a question for him to be curious about');

  const id = s.boards[0].id;
  ok('an open board has no answer and that is a valid state',
    openBoards(s).length === 1 && answeredBoards(s).length === 0,
    'it may stay open for years; nothing nags, expires, or marks it overdue');

  s = addEvidence(s, id, { kind: 'capsule', ref: 'cap_1', at: 100 });
  s = addEvidence(s, id, { kind: 'explanation', text: 'The starch goes firm again as it cools.', at: 200 });
  s = addEvidence(s, id, { kind: 'explanation', text: 'It is called retrogradation.', at: 300 });
  ok('explanations APPEND rather than replace',
    boardTimeline(s, id).filter(e => e.kind === 'explanation').length === 2,
    'how his answer changed as Rowan got older is the interesting part; overwriting leaves only the last one');
  ok('and the timeline runs oldest first',
    boardTimeline(s, id)[0].kind === 'capsule');

  ok('evidence pointing at nothing and saying nothing is refused',
    addEvidence(s, id, { kind: 'photo' }).boards[0].entries.length === 3);
  ok('an unknown evidence kind is refused',
    addEvidence(s, id, { kind: 'invention', text: 'x' }).boards[0].entries.length === 3,
    'never invent evidence — the kinds are a whitelist');

  s = answerBoard(s, id, 'Retrogradation. It firms up as it cools.');
  ok('a final answer does not delete the journey',
    boardTimeline(s, id).length === 3 && !!s.boards[0].finalAnswer,
    'the point is the sequence, not the conclusion');
  ok('and it moves the board to answered',
    answeredBoards(s).length === 1 && openBoards(s).length === 0);
  ok('counts add up', boardCounts(s).evidence === 3);

  const src = fs.readFileSync(new URL('../src/rowanParticipation.js', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('nothing generates a question or an answer',
    !/generate|suggest|prompt|autoAnswer/i.test(code),
    'real curiosity only');
}

// ── KITCHEN ROLES ───────────────────────────────────────────────────────────
//
// THE WHOLE DESIGN IS THE ABSENCE. Kevin: no points, levels, badges, streaks,
// or mastery. A streak turns a Tuesday with his father into something he is
// failing to keep up.
{
  const {
    emptyRoleLog, logRoles, rolesTimeline, KITCHEN_ROLES, ROLE_IDS,
  } = await import('../src/rowanParticipation.js');
  const fs = await import('node:fs');

  let r = logRoles(emptyRoleLog(), ['smell', 'questions'], {}, 500);
  ok('a session records the roles he took', rolesTimeline(r).length === 1);
  ok('an unknown role is dropped rather than stored',
    logRoles(emptyRoleLog(), ['ceo']).sessions.length === 0);
  ok('every role has a label and something he can actually do',
    KITCHEN_ROLES.every(x => x.id && x.label && x.what) && ROLE_IDS.length === 5);

  r = logRoles(r, ['observer'], {}, 900);
  ok('the timeline runs oldest first and nothing else is derived',
    rolesTimeline(r).length === 2 && rolesTimeline(r)[0].at === 500);

  const exported = Object.keys(await import('../src/rowanParticipation.js'));
  const scoreish = exported.filter(k => /streak|score|total|count|level|badge|mastery|best|longest|favourite|favorite/i.test(k)
    && !/boardCounts/.test(k));
  ok('the module exports NO reader that scores or totals participation',
    scoreish.length === 0,
    scoreish.join(', '));

  const src = fs.readFileSync(new URL('../src/rowanParticipation.js', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('and no streak, badge, level, or mastery anywhere in the code',
    !/streak|badge|\blevel\b|mastery|points/i.test(code),
    'the participation itself is the reward');
}

// ── HOUSEHOLD MEMORIES ──────────────────────────────────────────────────────
//
// What a dish means to the family that ate it, IN THEIR OWN WORDS.
//
// This is the inverse of Passport Story Doors, which Kevin rejected because
// inferred narrative goes inaccurate or over-generated. Nothing here is
// inferred, so there is nothing to over-generate.
{
  const {
    emptyMemories, addMemory, updateMemory, removeMemory, memoriesForDish,
    memoriesForHousehold, dishMemorySummary, publiclyShareable, memoryCounts,
  } = await import('../src/householdMemories.js');
  const fs = await import('node:fs');

  ok('it ships empty', emptyMemories().memories.length === 0);

  let s = addMemory(emptyMemories(), {
    dishName: 'Bolognese', householdId: 'h1',
    text: 'First thing we ate in the new house.',
  });
  ok('a household writes its own memory', s.memories.length === 1);
  ok('and it is shared with Kevin by default',
    s.memories[0].shareWithKevin === true,
    'there is no reason to write it otherwise');
  ok('but NOT shared publicly by default',
    s.memories[0].sharePublicly === false,
    'their memory of a dinner is not menu copy');

  // THE OCCASION LIST IS GONE. It was a fixed set I had written, and Passport
  // Cabinets do that job better because the household names the cabinet itself.
  // This store is now purely the story half.
  ok('a memory with no words is refused',
    addMemory(emptyMemories(), { dishName: 'X' }).memories.length === 0);

  s = addMemory(s, { dishName: 'Bolognese', householdId: 'h2', text: 'Sunday one.' });
  s = addMemory(s, { dishName: 'Chili', householdId: 'h1', text: 'Cold week.' });

  ok('memories group by dish', memoriesForDish(s, 'bolognese').length === 2,
    'the lookup is case-insensitive because a customer typed the name');
  ok('and by household', memoriesForHousehold(s, 'h1').length === 2);

  const sum = dishMemorySummary(s, 'Bolognese');
  ok('Kevin sees their words', sum.shared === 2 && sum.notes.length === 2);

  const hidden = addMemory(s, { dishName: 'Gumbo', householdId: 'h3', text: 'private', shareWithKevin: false });
  ok('a memory withheld from Kevin does not reach him',
    dishMemorySummary(hidden, 'Gumbo').shared === 0);

  ok('nothing is publicly shareable unless explicitly marked',
    publiclyShareable(s).length === 0,
    'showing one household\'s words to another is a separate, explicit act');

  // Their words, their call.
  const id = s.memories[0].id;
  ok('a household can edit its own memory',
    updateMemory(s, id, { text: 'Second thing, actually.' }).memories[0].text === 'Second thing, actually.');
  ok('and delete it outright',
    removeMemory(s, id).memories.length === s.memories.length - 1,
    'an app that preserved somebody\'s words about their own dinner against their wishes has overruled them');

  ok('counts add up', memoryCounts(s).total === 3);

  const src = fs.readFileSync(new URL('../src/householdMemories.js', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('NOTHING is inferred, suggested, or generated here',
    !/infer|suggest|generate|recommend|predict/i.test(code),
    'that is exactly why this can exist while Passport Story Doors could not');
  ok('and no reader ranks dishes as popular or best-for',
    !/popular|bestFor|topDish|ranking/i.test(code),
    'Kevin reads the counts and decides; the app does not tell a customer a dish is good for weeknights');
}

// ── PASSPORT CABINETS ───────────────────────────────────────────────────────
//
// A household arranging its own passport stamps into collections it named
// itself. "Everyone agrees" is a thing a family knows about itself and no list
// of mine would have contained it.
//
// It survives where two neighbours did not: Story Doors inferred narrative
// (nothing here is inferred) and Superlatives crowned one winner (a cabinet
// holds as many dishes as they want).
{
  const c = await import('../src/passportCabinets.js');
  const fs = await import('node:fs');

  ok('it ships empty', c.emptyCabinets().cabinets.length === 0);

  let s = c.createCabinet(c.emptyCabinets(), 'h1', 'Meals we serve guests');
  const id = s.cabinets[0].id;
  ok('a household names its own cabinet', s.cabinets[0].name === 'Meals we serve guests');
  ok('an unnamed cabinet is refused', c.createCabinet(s, 'h1', '  ').cabinets.length === 1);

  s = c.fileDish(s, id, 'Bo Ssam');
  s = c.fileDish(s, id, 'Bolognese');
  s = c.fileDish(s, id, 'Bo Ssam');
  ok('dishes file, and a duplicate does not double up',
    c.dishesIn(s, id).length === 2);
  ok('and MANY dishes can hold the same role',
    c.dishesIn(s, id).length > 1,
    'this is the difference from the rejected Superlatives, which crowned one winner');
  ok('order is preserved as the household arranged it',
    c.dishesIn(s, id)[0] === 'Bo Ssam',
    'nothing sorts this alphabetically; the order they chose is part of what they made');

  // THE RULE.
  let p = c.proposeCabinet(s, 'h1', 'Best busy-night dinners', 'You ordered these on five weeknights.', ['Gumbo']);
  const pid = p.cabinets[p.cabinets.length - 1].id;
  ok('LTB may propose a cabinet', c.proposalsFor(p, 'h1').length === 1);
  ok('and the proposal says WHY, so they can disagree with the reasoning',
    c.proposalsFor(p, 'h1')[0].because.length > 0);
  ok('a proposal is NOT one of their cabinets until accepted',
    c.cabinetsFor(p, 'h1').length === 1,
    'nothing reads a proposed cabinet as belonging to the household');
  ok('and NOTHING can be filed into a proposed cabinet',
    c.fileDish(p, pid, 'Chili').cabinets.find(x => x.id === pid).dishes.length === 1,
    'a dish entering their cabinet without their say is the app deciding what their food means');

  p = c.acceptProposal(p, pid);
  ok('accepting makes it theirs', c.cabinetsFor(p, 'h1').length === 2);
  ok('and filing works from then on',
    c.dishesIn(c.fileDish(p, pid, 'Chili'), pid).length === 2);
  ok('declining removes it entirely',
    c.proposalsFor(c.declineProposal(p, pid), 'h1').length === 0);

  // The returning-dish line.
  ok('a dish reports which cabinets hold it',
    c.cabinetsHolding(s, 'h1', 'bo ssam')[0].name === 'Meals we serve guests',
    'case-insensitive: the customer typed the name');
  const proposedOnly = c.proposeCabinet(c.emptyCabinets(), 'h1', 'Guessed', 'why', ['Chili']);
  ok('a proposed cabinet never claims to hold a dish',
    c.cabinetsHolding(proposedOnly, 'h1', 'Chili').length === 0,
    'they should never be told a dish is in something they have not agreed to');

  s = c.renameCabinet(s, id, 'For company');
  ok('cabinets rename', c.cabinetsFor(s, 'h1')[0].name === 'For company');
  ok('and delete', c.deleteCabinet(s, id).cabinets.filter(x => x.householdId === 'h1' && x.status === 'kept').length === 0);
  ok('unfiling removes just the one dish', c.dishesIn(c.unfileDish(s, id, 'Bo Ssam'), id).length === 1);

  let many = c.createCabinet(c.createCabinet(c.emptyCabinets(), 'h1', 'A'), 'h1', 'B');
  const ids = many.cabinets.map(x => x.id);
  many = c.reorderCabinets(many, 'h1', [ids[1], ids[0]]);
  ok('cabinets reorder', c.cabinetsFor(many, 'h1')[0].name === 'B');

  const src = fs.readFileSync(new URL('../src/passportCabinets.js', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('no completion, progress, streak, or unlock mechanic',
    !/complete|progress|streak|badge|unlock/i.test(code),
    'a checklist is Kevin\'s idea of what they should try; a cabinet is their idea of what their food is for');

  // ── RECALL IS ALLOWED. RECOMMENDATION IS NOT. ─────────────────────────────
  //
  // I first ruled out anything resembling "suggest a dish" and that was too
  // broad. Kevin pushed back and the line is worth keeping explicit:
  //
  //   RECALL — naming a dish THEY filed which is on the menu now. The household
  //   already said what it is for; the only new fact is availability.
  //   RECOMMENDATION — "you might like Rendang". Inferred taste, which is the
  //   exact thing Passport Story Doors was rejected for.
  let w = c.createCabinet(c.emptyCabinets(), 'h1', 'Best busy-night dinners');
  const wid = w.cabinets[0].id;
  w = c.fileDish(w, wid, 'Bolognese');
  w = c.fileDish(w, wid, 'Gumbo');

  const wk = c.thisWeekFromCabinets(w, 'h1', ['Bolognese', 'Chili', 'Gumbo']);
  ok('a cabinet reports which of ITS dishes are on the menu this week',
    wk.length === 1 && wk[0].dishes.length === 2);
  ok('and it CANNOT surface a dish the household never filed',
    !wk.some(x => x.dishes.includes('Chili')),
    'there is nothing for it to be wrong about, because it only recalls their own choices');
  ok('a household with no cabinets gets silence, not a suggestion',
    c.thisWeekFromCabinets(c.emptyCabinets(), 'h1', ['Bolognese']).length === 0);
  ok('and an empty menu returns nothing rather than everything',
    c.thisWeekFromCabinets(w, 'h1', []).length === 0);
  ok('it never says how many of a cabinet are available or left to try',
    wk.every(x => !('remaining' in x) && !('of' in x) && !('total' in x)),
    'a cabinet is not a set to finish');

  ok('a dish in a cabinet gets the recall line',
    /This is in your Best busy-night dinners cabinet\./.test(c.cabinetLineFor(w, 'h1', 'Gumbo')));
  ok('a dish in none of their cabinets gets NULL, not a cheerful nothing',
    c.cabinetLineFor(w, 'h1', 'Chili') === null);
  ok('and cabinet counts do not rank anything',
    !/rank|popular|top/i.test(code));
}

// ── GROUNDED RECOMMENDATIONS ────────────────────────────────────────────────
//
// Kevin: "only based on actual reasoning though (like the having had every
// other similar dish) so it always has a grounded reasoning why."
//
// So a rule may only fire on something COUNTABLE in the household's own
// records, and the reason shown is that same fact in words. No taste modelling:
// "you would probably like this" is inferred preference, which is what Passport
// Story Doors was rejected for and is unfalsifiable in a way a count is not.
{
  const rec = await import('../src/recommendations.js');
  const { DISHES } = await import('../src/dishes.js');
  const fs = await import('node:fs');

  const now = Date.now();
  const mk = (name, daysAgo) => ({
    regularId: 'h1', createdAt: new Date(now - daysAgo * 86400000).toISOString(),
    items: [{ name }],
  });
  const chinese = DISHES.filter(d => d.cuisine === 'Chinese').map(d => d.name);
  const history = chinese.slice(0, 4).map((n, i) => mk(n, 300 - i * 20));
  const all = (o) => rec.recommendationsFor({
    orders: history, householdId: 'h1', weekDishNames: chinese, eligible: () => true, now, ...o,
  });

  const r = all();
  // TAGS NOW WIN OVER CUISINE, which is the intended order: tags are the
  // grouping Kevin actually thinks in, and cuisine is the fallback for dishes
  // he has not tagged. This assertion used to expect the cuisine sentence
  // because tags did not exist yet.
  ok('a rule fires when they have had every other one of a group',
    r.length === 1 && /every other|\d+ of the \d+/.test(r[0].why),
    JSON.stringify(r));
  ok('and the evidence travels with it so anyone can check the claim',
    r[0].evidence && typeof r[0].evidence.total === 'number' && r[0].evidence.tried > 0,
    JSON.stringify(r[0].evidence));
  ok('the tag rule is preferred over cuisine when both could fire',
    r[0].ruleId === 'tagNearlyComplete',
    'cuisine splits the six stir-fries across two values; tags are what a customer groups by');

  ok('a dish they have already tried is not recommended back to them',
    !r.some(x => chinese.slice(0, 4).includes(x.dishName)));

  // The hard refusals.
  ok('NOTHING is recommended without a restriction filter',
    rec.recommendationsFor({ orders: history, householdId: 'h1', weekDishNames: chinese, now }).length === 0,
    'recommending food to somebody whose restrictions are unknown is the one failure here that could hurt');
  ok('and nothing that fails the filter gets through',
    all({ eligible: () => false }).length === 0);
  ok('nothing off this week\'s menu is recommended',
    all({ weekDishNames: [] }).length === 0,
    'a perfect recommendation for something unavailable is an annoyance');
  ok('nothing already in the order is recommended',
    all({ alreadyOrdered: [chinese[4]] }).length === 0);

  // A household with no history.
  ok('a new household gets NOTHING rather than a padded list',
    rec.recommendationsFor({ orders: [], householdId: 'h1', weekDishNames: chinese, eligible: () => true, now }).length === 0,
    'padding with something weakly justified is how a feature like this stops being trusted');
  ok('and that state is reportable rather than silent',
    rec.hasEnoughHistory([], 'h1') === false && rec.hasEnoughHistory(history, 'h1') === true);

  // The other two rules.
  const repeat = rec.recommendationsFor({
    orders: [mk('Bolognese', 10), mk('Bolognese', 40), mk('Bolognese', 70)],
    householdId: 'h1', weekDishNames: ['Bolognese'], eligible: () => true, now,
  });
  ok('a repeat favourite states the count', /ordered this 3 times/.test(repeat[0].why));

  const lapsed = rec.recommendationsFor({
    orders: [mk('Bolognese', 300), mk('Bolognese', 290)],
    householdId: 'h1', weekDishNames: ['Bolognese'], eligible: () => true, now,
  });
  ok('a lapsed dish states how long it has been',
    /not in about \d+ months/.test(lapsed[0].why) && lapsed[0].evidence.daysSince >= 90);

  ok('one dish gets ONE reason, not a stack of them',
    repeat.length === 1 && Object.keys(repeat[0]).includes('ruleId'),
    'stacking reasons reads as a sales pitch');

  ok('thresholds are high enough that two orders is not "a favourite"',
    rec.recommendationsFor({
      orders: [mk('Bolognese', 10), mk('Bolognese', 40)],
      householdId: 'h1', weekDishNames: ['Bolognese'], eligible: () => true, now,
    }).length === 0,
    'a rule that fires on two orders is noise dressed as insight');

  const src = fs.readFileSync(new URL('../src/recommendations.js', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('nothing models taste, scores, or predicts a preference',
    !/probably|might like|predict|affinity|similarity|score|weight/i.test(code),
    'every reason has to be a fact that is either true or not');
  ok('and every rule returns a `why` alongside its evidence',
    (code.match(/ruleId:/g) || []).length === (code.match(/evidence:/g) || []).length,
    'a recommendation without its evidence cannot be checked');
}

// ── CONTAINER DEPOSITS ──────────────────────────────────────────────────────
//
// Kevin's ruling: $1 a container, $2 a jar, charged out as an incentive to
// return — "so if they don't return then I make a little extra."
//
// It is a DEPOSIT, not a passthrough. A passthrough is bought and resold at
// cost and the money is never really his; a deposit IS his if it is not
// reclaimed, so it cannot be modelled as pasta.
{
  const d = await import('../src/containerDeposits.js');
  const { orderTotal } = await import('../src/utils.js');
  const fs = await import('node:fs');
  const now = Date.now();
  const mk = (used, daysAgo, returns) => ({
    status: 'Delivered', deliveredAt: new Date(now - daysAgo * 86400000).toISOString(),
    items: [{ name: 'Omakase', omakase: true, containersUsed: used }],
    ...(returns ? { containerReturnsByType: returns } : {}),
  });

  const out = d.depositsOutFor(mk({ round16: 2, jar: 1 }, 10));
  ok('a jar is $2 and a container is $1, flat',
    out.cents === 400 && out.byType.round16 === 2);
  ok('and the outbound side is DERIVED, never typed',
    Object.keys(out.byType).length === 2,
    'the container map already knows; asking Kevin to type it asks for what he told the app');

  // cup2.
  ok('the 2 oz cup is NOT charged a deposit',
    d.depositsOutFor(mk({ cup2: 5 }, 10)).cents === 0,
    'a deposit that can never be reclaimed is not a deposit, it is a dollar for a seven-cent cup');
  // Outbound-only: charged nothing, but the inventory still sees every one.
  const { orderContainerBreakdown } = await import('../src/containers.js');
  ok('but the container inventory still counts every one he gives out',
    orderContainerBreakdown(mk({ cup2: 5, round16: 1 }, 10)).cup2 === 5,
    'that asymmetry is deliberate, unlike the accidental one this walk fixes');
  ok('and it cannot be recorded as returned either',
    d.creditCentsFor({ cup2: 3 }) === 0);
  ok('a sous vide bag is never in any of this',
    d.depositsOutFor(mk({ bag: 4 }, 10)).cents === 0 && d.creditCentsFor({ bag: 2 }) === 0);

  // Returns are typed.
  const st = d.orderDepositState(mk({ round16: 2, jar: 1 }, 10, { round16: 1 }), now);
  ok('a typed return credits the right rate',
    st.creditedCents === 100 && st.chargedCents === 400);
  ok('and what has not come back is reported BY TYPE',
    st.outstanding.round16 === 1 && st.outstanding.jar === 1,
    'a generic count cannot be credited back to the right part of the fleet — the bug this fixes');

  // The 90-day rule.
  ok('nothing is forfeited before 90 days',
    d.orderDepositState(mk({ jar: 1 }, 89), now).forfeited === false);
  ok('and it is deemed kept after',
    d.orderDepositState(mk({ jar: 1 }, 91), now).forfeited === true,
    'nothing fires when a container is NOT returned, so without a rule the money sits in limbo forever');

  const income = d.forfeitedDepositIncome([mk({ jar: 1 }, 91), mk({ jar: 1 }, 10)], now);
  ok('forfeited income counts only the aged ones', income.cents === 200 && income.orders === 1);

  // The reversal property.
  const late = mk({ jar: 1 }, 91, { jar: 1 });
  ok('a LATE return simply makes the income smaller, with nothing to reverse',
    d.forfeitedDepositIncome([late], now).cents === 0,
    'it is recomputed from the orders every time and is never a stored balance');

  ok('circulation excludes what has already been deemed kept',
    d.inCirculation([mk({ jar: 1 }, 91)], now).cents === 0);

  // The total.
  const items = [{ name: 'X', price: 30, qty: 1 }];
  ok('the deposit rides the invoice',
    orderTotal(items, 0, 0, 'none', 0, [], true, 400) === 34,
    'it has to be visible, or it cannot be an incentive');
  ok('and existing call sites are unchanged',
    orderTotal(items, 0, 0, 'none', 0, [], true) === 30);
  ok('a discount does not shrink the deposit',
    orderTotal(items, 0, 0, 'percent', 50, [], true, 400) === 19,
    'crediting back more than was charged is the failure; the rates are flat by ruling');

  // Margins.
  const src = fs.readFileSync(new URL('../src/containerDeposits.js', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('the deposit module touches NEITHER margin calculation',
    !/margin|blended|valueAdd/i.test(code),
    'a dish must never look more profitable because a customer kept a tub, or less because they brought it back');
  ok('and no reader breaks outstanding deposits down by household',
    !/byRegular|byHousehold|owes|debt/i.test(code),
    'nobody owes a container; a per-person outstanding list is a debtors\' register whatever it is labelled');
}

// ── DISH TAGS ───────────────────────────────────────────────────────────────
//
// "A tag is a CROSSLINK, not a classification." Kevin put pasta sauce on Chili
// deliberately — "I want to ensure it'll crosslink with the italian ones" — and
// did the same on the Pork with Mustard Tarragon. **Chili is a pasta sauce
// because he says it is.** Nothing here validates that, on purpose.
{
  const t = await import('../src/dishTags.js');
  const rec = await import('../src/recommendations.js');
  const fs = await import('node:fs');

  // His own tally, from the walk. If these drift, the data was edited.
  const expected = {
    'comfort food': 10, 'pasta sauce': 9, 'stir fry': 6, 'braise': 6,
    'soup or stew': 4, 'grilled or seared': 4, curry: 2, roux: 2, kit: 1, smoked: 1,
  };
  const tally = t.tagTally();
  ok('the tally matches Kevin\'s exactly',
    Object.entries(expected).every(([k, v]) => tally[k] === v),
    JSON.stringify(tally));

  ok('stir fry lands on SIX, which cuisine could never express',
    tally['stir fry'] === 6,
    'those six were split across Chinese and Thai, so the strongest rule could never fire');

  // Variant scoping.
  const cumin = 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice';
  ok('the Cumin noodles are a pasta sauce',
    t.tagsFor(cumin, 'Mushroom, Small').includes('pasta sauce'));
  ok('and the Cumin rice is NOT',
    !t.tagsFor(cumin, 'Beef, Small').includes('pasta sauce'),
    'flattening them onto the parent would crosslink a rice dish to the Italians');
  ok('but both are stir fry',
    t.tagsFor(cumin, 'Mushroom, Small').includes('stir fry')
    && t.tagsFor(cumin, 'Beef, Small').includes('stir fry'));
  ok('and they count as TWO units, matching his table',
    t.dishesWithTag('stir fry').filter(n => n === cumin).length === 2,
    'one menu entry, two things a customer orders');

  ok('Bolognese records the one NEGATIVE on the board',
    t.excludedTags('Bolognese').includes('soup or stew'),
    'kept so a later pass cannot quietly re-add something he ruled out');
  ok('Bo Ssam is PARKED, not untagged',
    t.isParked('Bo Ssam') && t.tagsFor('Bo Ssam').length === 0,
    'he said he would think of one; nothing here proposes a tag for him');

  ok('a tag can carry required copy',
    t.copyFor('Chili', 'pasta sauce') === 'Seriously, try it with macaroni.');
  ok('and it is scoped to that dish and tag, not general',
    t.copyFor('Bolognese', 'pasta sauce') === null,
    'a general blurb would say it to people never told anything about pasta sauce');

  // The recommender.
  const now = Date.now();
  const mk = (n, d) => ({ regularId: 'h1', createdAt: new Date(now - d * 86400000).toISOString(), items: [{ name: n }] });
  const fire = (names, k) => rec.recommendationsFor({
    orders: names.slice(0, k).map((n, i) => mk(n, 60 - i)),
    householdId: 'h1', weekDishNames: names, eligible: () => true, now,
  }).filter(x => x.ruleId === 'tagNearlyComplete');

  const sf = [...new Set(t.dishesWithTag('stir fry'))];
  ok('a narrow tag fires when they have had every other one',
    fire(sf, sf.length - 1).some(x => /every other stir fry/.test(x.why)));

  // THE DAMPENING. Kevin was offered trimming and splitting and chose neither.
  const cf = [...new Set(t.dishesWithTag('comfort food'))];
  // Checks the COMFORT FOOD claim specifically. The first version asserted that
  // NO tag rule fired, which was wrong: those ten dishes overlap with soup or
  // stew, so ordering five of them legitimately completes that narrower tag —
  // and that firing is correct behaviour, not noise.
  ok('a BROAD tag does not claim "every other" at half the menu',
    !fire(cf, 5).some(x => x.evidence.tag === 'comfort food'),
    '"every other comfort food" across ten dishes says almost nothing');
  ok('but it still fires when they really have had every other one',
    fire(cf, cf.length - 1).some(x => /every other comfort food/.test(x.why)),
    'the tag is true of all ten and stays on all ten — it is weighted, not trimmed');

  ok('singleton tags never drive a recommendation',
    t.isSingletonTag('kit') && t.isSingletonTag('smoked'),
    'they group nothing, though they may still earn their place as menu filters');

  const src = fs.readFileSync(new URL('../src/dishTags.js', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('nothing validates or corrects a tag',
    !/validate|invalid|correct|taxonom/i.test(code),
    'a validator objecting to Chili being a pasta sauce has misread the feature');
}

console.log(failed === 0 ? '\nNOTES + LEDGER: ALL PASS' : `\nNOTES + LEDGER: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
