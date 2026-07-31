// tests/chronicle.mjs — the complete story of one week.
//
// WHY THIS EXISTS
//
// The app could already answer a dozen narrow questions and could not answer
// "show me the whole week of August 12". Every piece existed, in seven places,
// keyed differently, with nothing joining them. This is the join.
//
// THE ASSERTION THAT MATTERS MOST is that a chapter reports what it does NOT
// know. This is the document Kevin intends to hand to his son. A chapter that
// quietly dropped what it could not find would be worse than an incomplete one,
// because it would be convincing. So `gaps` is checked as hard as the content.
//
// The second thing guarded is immutability. A record that rewrites itself when
// a dish is renamed is not a record, so a chapter resolves everything at build
// time and rebuilding the same week must produce the same fingerprint.

import { buildChapter, buildChronicle, narrateChapter, chapterFingerprint } from '../src/chronicle.js';

let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? '\n      ' + x : ''))); };

const STAMP = Date.parse('2026-08-10T00:00:00Z');
const day = (n) => new Date(STAMP + n * 86400000).toISOString();

const world = () => ({
  orders: [
    { id: 'o1', regularId: 'r1', createdAt: day(1), servedRecipeVersionId: 'chili@2026-07-30-a', items: [{ name: 'Chili', dishId: 'chili', qty: 2, price: 45 }] },
    { id: 'o2', regularId: 'r2', createdAt: day(2), items: [{ name: 'Gumbo', dishId: 'gumbo', qty: 1, price: 50 }] },
    { id: 'o3', regularId: 'r1', createdAt: day(40), items: [{ name: 'Chili', qty: 1, price: 45 }] },  // next month
  ],
  journal: { entries: [{ id: 'j1', createdAt: day(3) }, { id: 'j2', createdAt: day(99) }] },
  amendments: [
    { orderId: 'o1', status: 'accepted', submittedAt: day(1) },
    { orderId: 'o9', status: 'rejected', submittedAt: day(60) },
  ],
  visualCues: [
    { dishId: 'gumbo', step: 'Dark roux', kind: 'target', status: 'stored', mediaKey: 'g.webp', capturedAt: day(2), recipeVersionId: 'gumbo@2026-07-30-a' },
    { dishId: 'chili', step: 'Bloom', kind: 'target', status: 'failed', capturedAt: day(2) },
  ],
  feedback: [{ dish: 'Chili', verdict: 'good', at: day(4) }],
});

const WEEK = { stamp: STAMP, label: 'Week of Aug 10', dishes: ['Chili', 'Gumbo'], publishedAt: day(0) };

// ── The week is a boundary, not a suggestion ────────────────────────────────
{
  const ch = buildChapter({ week: WEEK, ...world() });
  ok('a chapter is built', !!ch);
  ok('it carries the week label', ch.label === 'Week of Aug 10');

  ok('orders from OTHER weeks are excluded', ch.orders.count === 2,
    `${ch.orders.count} — the day-40 order belongs to another chapter`);
  ok('journal entries from other weeks too', ch.journalEntryCount === 1);
  ok('and amendments', ch.amendments.length === 1);

  ok('households are counted, not orders', ch.orders.households === 2);
  ok('revenue adds up', ch.orders.revenue === 140, String(ch.orders.revenue));
}

// ── It says what it does not know ───────────────────────────────────────────
{
  const ch = buildChapter({ week: WEEK, ...world() });
  ok('gaps is a first-class field', Array.isArray(ch.gaps));

  // Gumbo's order recorded no version; Chili's did.
  ok('a dish whose version was never recorded is flagged',
    ch.gaps.some(g => /Gumbo/.test(g) && /version/i.test(g)),
    ch.gaps.join(' | '));
  ok('and the menu entry says so rather than implying certainty',
    ch.menu.find(m => m.name === 'Gumbo').versionWasRecorded === false);
  ok('while a recorded one is marked as recorded',
    ch.menu.find(m => m.name === 'Chili').versionWasRecorded === true);

  const quiet = buildChapter({ week: WEEK, orders: [], journal: { entries: [] }, visualCues: [] });
  ok('an empty journal is reported, not hidden',
    quiet.gaps.some(g => /journal/i.test(g)),
    'the record holds what happened but not why, and should say so');
  ok('so is the absence of photographs', quiet.gaps.some(g => /photograph/i.test(g)));

  const noPrice = buildChapter({
    week: WEEK,
    orders: [{ id: 'x', regularId: 'r1', createdAt: day(1), items: [{ name: 'Chili', qty: 1 }] }],
  });
  ok('an unpriced line is counted and admitted',
    noPrice.gaps.some(g => /price/i.test(g)),
    'a revenue figure that silently omits lines is worse than no figure');
}

// ── A cue that never uploaded is not in the record ──────────────────────────
{
  const ch = buildChapter({ week: WEEK, ...world() });
  ok('only stored photographs are listed', ch.cues.length === 1,
    'a failed upload has no bytes; listing it would promise a file that is not there');
  ok('and each carries the recipe version it was true of',
    ch.cues.every(c => !!c.recipeVersionId));
}

// ── Immutability ────────────────────────────────────────────────────────────
{
  const a = buildChapter({ week: WEEK, ...world() });
  const b = buildChapter({ week: WEEK, ...world() });
  ok('rebuilding the same week gives the same fingerprint',
    chapterFingerprint(a) === chapterFingerprint(b),
    'a record that changes when rebuilt is not a record');

  ok('the fingerprint ignores when it was built',
    chapterFingerprint({ ...a, builtAt: 'different' }) === chapterFingerprint(a));

  const changed = buildChapter({
    week: WEEK,
    ...world(),
    orders: [{ id: 'o1', regularId: 'r1', createdAt: day(1), items: [{ name: 'Chili', dishId: 'chili', qty: 9, price: 45 }] }],
  });
  ok('but it does notice the week actually differing',
    chapterFingerprint(changed) !== chapterFingerprint(a));

  ok('a null chapter fingerprints to null', chapterFingerprint(null) === null);
}

// ── Containers come from the real mapping ───────────────────────────────────
{
  const ch = buildChapter({ week: WEEK, ...world() });
  const total = Object.values(ch.containers).reduce((x, y) => x + y, 0);
  ok('containers are counted from the dish mapping', total > 0, JSON.stringify(ch.containers));
  ok('and scale with quantity',
    buildChapter({ week: WEEK, orders: [{ id: 'q', createdAt: day(1), items: [{ name: 'Chili', qty: 4 }] }] })
      .containers.round48 === 4);
}

// ── The narration is prose, for a person ────────────────────────────────────
{
  const text = narrateChapter(buildChapter({ week: WEEK, ...world() }));
  ok('it opens with the week', /^Week of Aug 10/.test(text));
  ok('it states the orders in a sentence', /2 orders from 2 households/.test(text));
  ok('it counts containers', /containers went out/.test(text));
  ok('and it prints the gaps as part of the story',
    /What this record does not know/.test(text),
    'a chapter that reads as complete when it is not is the failure this file is shaped around');

  const paused = narrateChapter(buildChapter({ week: { ...WEEK, paused: true }, orders: [] }));
  ok('a week off narrates as a week off', /No menu this week/.test(paused));

  ok('a null chapter narrates to nothing rather than throwing', narrateChapter(null) === '');
}

// ── The whole run ───────────────────────────────────────────────────────────
{
  const ledger = { weeks: [{ ...WEEK }, { stamp: STAMP + 7 * 86400000, label: 'Week of Aug 17', dishes: ['Bolognese'] }] };
  const chapters = buildChronicle(ledger, world());
  ok('every week in the ledger becomes a chapter', chapters.length === 2);
  ok('and they come out in order', chapters[0].stamp < chapters[1].stamp);
  ok('a week with no orders is still a chapter',
    chapters[1].orders.count === 0,
    '"no orders" is a fact about a week; skipping it leaves a hole that reads as missing data');
  ok('an empty ledger yields no chapters', buildChronicle({ weeks: [] }, {}).length === 0);
  ok('a missing ledger is survivable', buildChronicle(null, {}).length === 0);
}

console.log(f === 0 ? '\nCHRONICLE: ALL PASS' : `\nCHRONICLE: ${f} FAILURES`);
process.exit(f ? 1 : 0);
