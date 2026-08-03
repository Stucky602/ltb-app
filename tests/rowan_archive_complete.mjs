// tests/rowan_archive_complete.mjs — no store may ride the backup and be
// invisible in the archive.
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS IS THE DURABLE HALF OF THE WORK
//
// Eight stores rode the backup and were absent from the archive: Rowan's
// questions, the notes to him, the mystery boards, the kitchen roles, the
// households' memories and cabinets, the derivatives, and the decision ledger.
// The data was safe and unreadable by anyone without the app.
//
// Nothing caught it because nothing was looking. Adding the eight fixes today;
// this test fixes tomorrow.
//
// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY-DRIVEN, NEVER A COUNT
//
// The field list is read from `buildBackupPayload()` IN THE CODE. A hand-typed
// list would have to be updated by the same person who forgot the archive, so
// it would drift in exactly the case it exists to catch.
//
// Every backup field must be either rendered by the archive, or on the
// exclusion list below WITH A STATED REASON. There is no third option and no
// silent pass.

import { readFileSync } from 'node:fs';
import { ROWAN_ARCHIVE_SECTIONS, buildRowanArchiveSections } from '../src/rowanArchive.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// OPERATIONAL STORES, deliberately not in the archive. Each carries the reason,
// because "we decided not to" is the thing that gets forgotten and then
// re-litigated.
const EXCLUDED = {
  version: 'a format marker, not content',
  schemaVersion: 'a format marker, not content',
  exportedAt: 'metadata about the backup itself',
  orders: 'already rendered by the archive through sales and dish sections',
  shopping: 'a working list for one week; superseded the moment it is used',
  weekDishes: 'this week only; the Chronicle holds the durable version',
  regulars: 'contact details, deliberately not printed into a shared artifact',
  inventory: 'a live count, meaningless once the date passes',
  containerInventory: 'a live count',
  ingredientsDb: 'a working price list; the dish sections carry what mattered',
  costHistory: 'operational pricing history, not legacy material',
  receiptAliases: 'a scanner lookup table',
  auditLog: 'operational trace of app actions',
  captureInbox: 'an unsorted inbox by definition; sorted items land elsewhere',
  customerFlags: 'rollout state, not content',
  walkAnswers: 'superseded — walks moved out of the app on Aug 2',
  copiesNote: 'already rendered in its own section',
  archiveHistory: 'metadata about previous archives',
  weekLedger: 'operational week state',
  pipelineJournal: 'rendered through the journal sections',
  journal: 'rendered by the journal sections',
  visualCues: 'media references only; the cue atlas is owner tooling',
  labelVersions: 'operational allergen record; not Rowan-facing legacy',
  clarifications: 'flags on other records rather than content of its own',
  practices: 'rendered by the journal/practice sections of the main archive',
  terms: 'rendered by the main archive',
  anatomy: 'rendered by the main archive',
  rowanLog: 'the tasting log is rendered by the main archive personal sections',
  // Caught by this gate on its first run, which is the point of it existing.
  realDataEpoch: 'a boundary marker saying where real orders begin, not content',
  dishRankings: 'a head-to-head ranking Kevin took once; operational preference data',
  handledPending: 'an idempotency guard against double-accepting a pending order',
};

// ── Read the payload fields from the code ───────────────────────────────────
const backupSrc = readFileSync(new URL('../src/backupRestore.js', import.meta.url), 'utf8');
const fnStart = backupSrc.indexOf('export function buildBackupPayload');
const body = backupSrc.slice(fnStart, backupSrc.indexOf('\n}', fnStart));
const fields = [...new Set(
  [...body.matchAll(/^\s{4}([a-zA-Z][\w]*)\s*:/gm)].map(m => m[1]),
)];

ok(`the payload field list was read from the code (${fields.length} fields)`,
  fields.length > 20,
  'a hand-typed list drifts in exactly the case this exists to catch');

// ── Every field is archived or explicitly excluded ──────────────────────────
{
  const archived = new Set(Object.keys(ROWAN_ARCHIVE_SECTIONS));
  const unaccounted = fields.filter(f => !archived.has(f) && !(f in EXCLUDED));
  ok('every backup field is either archived or excluded with a reason',
    unaccounted.length === 0,
    `UNACCOUNTED: ${unaccounted.join(', ')} — add a section in src/rowanArchive.js `
    + 'or an exclusion with a stated reason. A store that rides the backup and appears '
    + 'in neither is invisible to anyone without the app.');

  ok('every exclusion states WHY',
    Object.values(EXCLUDED).every(r => typeof r === 'string' && r.length > 10));

  // Guards the inverse: an exclusion for a field that no longer exists is dead
  // weight that makes the list look more considered than it is.
  const stale = Object.keys(EXCLUDED).filter(k => !fields.includes(k));
  ok('no exclusion names a field the payload no longer writes',
    stale.length === 0, stale.join(', '));

  ok('the eight stores that were missing are all archived now',
    ['rowanQuestions', 'notesRowan', 'rowanBoards', 'rowanRoles', 'householdMemories',
      'passportCabinets', 'derivatives', 'decisionLedger'].every(k => archived.has(k)));
}

// ── The sections render honestly ────────────────────────────────────────────
{
  const empty = buildRowanArchiveSections({});
  ok('an entirely empty set still renders every section',
    Object.keys(ROWAN_ARCHIVE_SECTIONS).every(() => true)
    && (empty.html.match(/<h2>/g) || []).length === Object.keys(ROWAN_ARCHIVE_SECTIONS).length,
    'skipping an empty section lets a reader conclude the feature never existed');

  ok('and the empty decision ledger says so rather than vanishing',
    /ships empty on purpose/.test(empty.html));

  const built = buildRowanArchiveSections({
    rowanQuestions: { questions: [{ id: 'q1', text: 'Why does bread go hard?', at: 1 }] },
    notesRowan: { notes: [{ id: 'n1', text: 'Heat is patience.', at: 2 }] },
    rowanBoards: {
      boards: [{
        id: 'b1', question: 'Why does bread go hard?', openedAt: 1,
        entries: [
          { kind: 'explanation', text: 'The starch firms as it cools.', at: 10 },
          { kind: 'explanation', text: 'It is called retrogradation.', at: 20 },
        ],
      }],
    },
    rowanRoles: { sessions: [{ id: 's1', roles: ['smell'], at: 3 }, { id: 's2', roles: ['smell'], at: 4 }] },
    passportCabinets: {
      cabinets: [
        { id: 'c1', name: 'Meals we serve guests', dishes: ['Bo Ssam'], status: 'kept' },
        { id: 'c2', name: 'Guessed', dishes: ['Chili'], status: 'proposed' },
      ],
    },
  });

  ok('an unanswered question renders as OPEN, not as a gap',
    /Still open/.test(built.html) && !/missing|incomplete|sorry/i.test(built.html),
    'a question Rowan asked that was never answered is still the record of him asking');

  ok('both explanations survive, in order',
    built.html.indexOf('starch firms') < built.html.indexOf('retrogradation'),
    'how the answer changed as he aged IS the record; keeping only the latest keeps the least interesting');

  // The absence that is the design.
  ok('kitchen roles compute NOTHING over the sessions',
    !/\b2 sessions|twice|most often|favourite|favorite|streak|total/i.test(built.html),
    'a display string that counts sessions per role is a scoreboard however it is phrased');

  ok('a proposed cabinet renders as proposed and holds nothing',
    /Suggested, not accepted/.test(built.html) && !/Guessed[\s\S]{0,40}Chili/.test(built.html),
    'telling a reader a household filed something they never accepted puts words in their mouth');

  ok('media is listed but never fetched',
    !/https?:\/\//.test(built.html) && !/token=/.test(built.html),
    'an archive that needs a live server is not an archive');
}

// ── It is one export path, not a second archive ─────────────────────────────
{
  const arch = readFileSync(new URL('../src/archiveExport.js', import.meta.url), 'utf8');
  ok('archiveExport CALLS the section builder',
    arch.includes('buildRowanArchiveSections'),
    'a second archive nobody remembers to run is worse than none');

  const mod = readFileSync(new URL('../src/rowanArchive.js', import.meta.url), 'utf8');
  ok('and the builder reads no storage itself',
    !/loadJSON|localStorage/.test(mod),
    'it takes normalized stores as arguments, so it is testable without a browser');
}

console.log(failed === 0 ? '\nROWAN ARCHIVE: ALL PASS' : `\nROWAN ARCHIVE: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
