// rowanPublication.js — THE PUBLICATION CONTRACT (Dad's Kitchen, Phase 1).
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS IS
//
// One function turns the LTB record into a bundle the companion app can read.
// This module decides WHAT crosses; it does not move anything. There is no
// network call in this file and there must never be one: transport is Phase 2
// and lives behind its own token, in its own worker, in its own repo.
//
// ═══════════════════════════════════════════════════════════════════════════
// KEVIN'S FOUR RULINGS, Aug 5, and what each one deleted from the design
//
// 1. "The first bundle is for long term memories. Yeaaaars down the line."
//    So nothing here is shaped for a toddler reading it tomorrow. Records keep
//    their full text and their dates, and the AUDIENCE TAG on a derivative
//    TRAVELS rather than being used to filter. Deciding what a six-year-old
//    sees is the companion app's job at read time; a bundle that dropped the
//    older material would have to be rebuilt to get it back.
//
// 2. "Anything related to him goes."
//    So there is no curation step and no approval queue. The only question a
//    store faces is whether it is ABOUT HIM, and every store in the backup is
//    answered explicitly below — published with a projector, or excluded with
//    a stated reason. There is no third option.
//
// 3. "It can all publish without my approval."
//    So there is no `approved` flag, no review state, and no pending queue.
//    The DELETED approval machinery is worth naming: an approval gate would
//    have meant a note he wrote today sits invisible until he remembers to
//    tick it, which is the opposite of what a record for later is for.
//
// 4. "I don't plan on there being an unpublished version. Every publish should
//    just be syncing his app with mine."
//    So a bundle is a COMPLETE SNAPSHOT, never a delta, and the receiver
//    REPLACES rather than merges. This is what makes rule 3 safe: with no
//    revocation, the only way to unsay something is to delete it here and
//    publish again, and a snapshot propagates that automatically. A delta
//    format could not — it would have to carry tombstones, which is a
//    revocation system under a different name.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE ONE GUARDRAIL "ANYTHING RELATED TO HIM" NEEDS
//
// Other people's words are not his. Household memories, passport cabinets and
// accommodation requests are written BY customers ABOUT their own families and
// their own bodies, and they are in the backup right next to Rowan's material.
// "Related to him" is not the same as "in the same app". Those three are
// excluded by name below, and the test asserts they can never appear.
//
// ═══════════════════════════════════════════════════════════════════════════
// PERSONAL IS THE SELECTOR, NOT PRIVATE
//
// Journal entries carry both flags and they are different axes. `private`
// means business-internal, do not show a CUSTOMER. `personal` means written
// for his son. Rowan is not a customer, so `private` is not the filter here —
// filtering on it would drop every provenance entry, and provenance is the
// most Rowan-relevant material in the journal (it is where a dish came from
// and who taught it). `personal` selects in; nothing else does.

import { normalizeQuestions } from './rowanQuestions.js';
import { normalizeNotes } from './notesForRowan.js';
import { normalizeBoards, normalizeRoleLog } from './rowanParticipation.js';
import { normalizeDerivatives } from './derivatives.js';
import { normalizeJournal } from './journal.js';
import { BIRTH_YEAR, BIRTH_MONTH } from './rowan.js';

// The wire format the companion app reads. Bumped only when a receiver that
// understands version N would MISREAD a version N+1 bundle. A receiver must
// refuse a format it does not know rather than guessing at it.
export const BUNDLE_FORMAT = 1;

// Snapshot, always. See ruling 4. Stated in the bundle itself so a receiver
// never has to infer replace-versus-merge from the shape of what it got.
export const PUBLISH_MODE = 'snapshot';

// Audiences whose derivatives are HIS. The other three (customer, cook,
// maintainer) are written for someone else and stay behind.
export const ROWAN_AUDIENCES = ['rowanYounger', 'rowanOlder'];

const arr = (v) => (Array.isArray(v) ? v : []);
const byTime = (key) => (a, b) => (a[key] || 0) - (b[key] || 0) || String(a.id).localeCompare(String(b.id));

// ── MEDIA IS CARRIED BY REFERENCE, NEVER BY VALUE ───────────────────────────
// Same rule the durable archive follows: filename, kind, size, checksum. No
// bytes, no URLs, and above all no tokens — a bundle is a file that can be
// mailed, and a signed URL inside one is a credential someone can forward.
// Phase 2's transport reads this manifest to know what to move.
function mediaRef(m, from, recordId) {
  if (!m || !m.mediaKey) return null;
  return {
    from,
    recordId: String(recordId),
    kind: m.kind || 'audio',
    mediaKey: m.mediaKey,
    contentType: m.contentType || '',
    bytes: Number(m.bytes) || 0,
    checksum: m.checksum || '',
  };
}

// ── THE PROJECTORS ──────────────────────────────────────────────────────────
// Each reads ONE backup field and returns records plus any media references.
// They read through the store's own normalizer rather than trusting the raw
// payload, so a hand-edited backup cannot put a shape into the bundle that the
// app itself would reject.

function projectTastings(raw) {
  // His own record: what he ate, what he thought, how old he was. `fairTest`
  // travels because a rating taken on a bad night means something different,
  // and the companion needs the same caveat the owner app has.
  const records = arr(raw).filter(e => e && e.id).map(e => ({
    id: String(e.id),
    dish: e.dish || '',
    dishId: e.dishId || '',
    rating: Number.isFinite(e.rating) ? e.rating : null,
    note: e.note || '',
    familyNote: e.familyNote || '',
    fairTest: e.fairTest !== false,
    at: e.at || '',
    ageMonths: Number.isFinite(e.ageMonths) ? e.ageMonths : null,
    capsuleKey: e.capsule && e.capsule.mediaKey ? e.capsule.mediaKey : null,
  })).sort((a, b) => String(a.at).localeCompare(String(b.at)) || a.id.localeCompare(b.id));
  const media = arr(raw)
    .map(e => mediaRef(e && e.capsule, 'tastings', e && e.id))
    .filter(Boolean);
  return { records, media };
}

function projectQuestions(raw) {
  // What he asked and what his father answered. An UNANSWERED question is a
  // valid, complete record and travels as one — the companion shows it open,
  // never as a gap. `evidence` ids travel so a later reader can follow an
  // answer back to what it drew on.
  const store = normalizeQuestions(raw);
  const records = store.questions.map(q => ({
    id: q.id,
    text: q.text,
    askedAt: q.askedAt,
    ageMonths: q.ageMonths,
    subjectKind: q.subjectKind,
    subjectId: q.subjectId,
    answer: q.answer,
    answeredAt: q.answeredAt,
    evidence: q.evidence,
    capsuleKey: q.capsule ? q.capsule.mediaKey : null,
  })).sort((a, b) => String(a.askedAt).localeCompare(String(b.askedAt)) || a.id.localeCompare(b.id));
  const media = store.questions.map(q => mediaRef(q.capsule, 'questions', q.id)).filter(Boolean);
  return { records, media };
}

function projectNotes(raw) {
  // Kevin writing directly to Rowan. Exact text, never summarised, never
  // shortened, and no lock framing anywhere downstream: this is the warmest
  // material in the app and it should read as a letter.
  const store = normalizeNotes(raw);
  const records = store.notes.map(n => ({
    id: n.id,
    text: n.text,
    subjectKind: n.subjectKind,
    subjectId: n.subjectId,
    subjectLabel: n.subjectLabel,
    at: n.at,
    ageMonths: n.ageMonths,
    mediaKeys: n.media.map(m => m.mediaKey),
  })).sort(byTime('at'));
  const media = store.notes.flatMap(n => n.media.map(m => mediaRef(m, 'notes', n.id)).filter(Boolean));
  return { records, media };
}

function projectBoards(raw) {
  // Open is the normal state and travels as such. Explanations are APPENDED
  // evidence, so the sequence of how the answer changed as he got older is the
  // record; the bundle keeps entry order rather than collapsing to the latest.
  const store = normalizeBoards(raw);
  const records = store.boards.map(b => ({
    id: b.id,
    question: b.question,
    openedAt: b.openedAt,
    ageMonths: b.ageMonths,
    subjectId: b.subjectId,
    tags: b.tags,
    entries: b.entries.map(e => ({ kind: e.kind, text: e.text, ref: e.ref, at: e.at, ageMonths: e.ageMonths })),
    finalAnswer: b.finalAnswer,
    answeredAt: b.answeredAt,
  })).sort(byTime('openedAt'));
  return { records, media: [] };
}

function projectRoleSessions(raw) {
  // A LIST OF WHAT HAPPENED, AND NOTHING COMPUTED OVER IT. No totals, no
  // counts per role, no streak, no favourite. The module refuses to compute
  // them and so does this: a projector that summed sessions would reintroduce
  // the scoreboard at the boundary, where the module's own test cannot see it.
  const store = normalizeRoleLog(raw);
  const records = store.sessions.map(s => ({
    id: s.id,
    roles: s.roles,
    at: s.at,
    ageMonths: s.ageMonths,
    note: s.note,
    produced: s.produced,
  })).sort(byTime('at'));
  return { records, media: [] };
}

function projectDerivatives(raw) {
  // Only the two Rowan audiences. The tag TRAVELS (ruling 1) so the companion
  // can choose by age at read time; this is not a filter on his behalf.
  //
  // ONE EXISTING CONTRACT OVERRIDES RULING 3 HERE, AND KEVIN SHOULD KNOW IT.
  // `derivatives.js` states at its own normalizer that a derivative with no
  // `approvedAt` "is a draft and must not be projected anywhere". That is not
  // an approval QUEUE — Kevin ruled those out — it is the difference between
  // finished words and half-written ones, and a draft is the second kind. So
  // drafts and superseded text stay behind while everything finished travels
  // with no further tick required.
  //
  // The consequence, stated because it is the kind of emptiness that reads as
  // a bug: with zero approved derivatives this section is empty forever. One
  // line from Kevin flips it to publish drafts too.
  const store = normalizeDerivatives(raw);
  const records = store.derivatives
    .filter(d => ROWAN_AUDIENCES.includes(d.audience))
    .filter(d => d.approvedAt && !d.supersededAt)
    .map(d => ({
      id: d.id,
      sourceRecordId: d.sourceRecordId,
      audience: d.audience,
      text: d.text,
      approvedAt: d.approvedAt,
      at: d.ts || 0,
    }))
    .sort((a, b) => (a.at || 0) - (b.at || 0) || String(a.id).localeCompare(String(b.id)));
  return { records, media: [] };
}

function projectJournal(raw) {
  // `personal` selects in. See the header: this is deliberately NOT filtered on
  // `private`, which is the customer axis and would drop every provenance
  // entry — the where-it-came-from material that is the whole point.
  //
  // `normalizeJournal` keeps tombstones in a SEPARATE `deleted` array, so
  // reading `entries` excludes them by construction. That is the whole unpublish
  // mechanism under snapshot publishing: delete it here, publish again, gone.
  // The timestamp field is `ts` and it is an ISO STRING, not the numeric `at`
  // every other store in this file uses.
  const store = normalizeJournal(raw);
  const records = arr(store.entries)
    .filter(e => e && e.personal)
    .map(e => ({
      id: String(e.id),
      type: e.type || '',
      dish: e.dish || '',
      text: e.text || '',
      ts: e.ts || '',
      origin: e.origin || 'written',
      transferable: !!e.transferable,
    }))
    .sort((a, b) => String(a.ts).localeCompare(String(b.ts)) || a.id.localeCompare(b.id));
  return { records, media: [] };
}

// ── THE REGISTRY ────────────────────────────────────────────────────────────
// Keyed by the BACKUP PAYLOAD FIELD NAME, so the completeness gate can walk
// `buildBackupPayload()` in the code and prove every store was answered. A
// hand-typed list would be maintained by the same person who forgot a store,
// which is the exact case it exists to catch.
export const PUBLISHED_STORES = {
  rowanLog: { label: 'What he ate and what he thought', project: projectTastings, key: 'tastings' },
  rowanQuestions: { label: 'What he asked', project: projectQuestions, key: 'questions' },
  notesRowan: { label: 'Notes from Dad', project: projectNotes, key: 'notes' },
  rowanBoards: { label: 'Mystery boards', project: projectBoards, key: 'boards' },
  rowanRoles: { label: 'Kitchen roles', project: projectRoleSessions, key: 'roleSessions' },
  derivatives: { label: 'Written for him', project: projectDerivatives, key: 'derivatives' },
  journal: { label: 'Written for him, from the kitchen record', project: projectJournal, key: 'journal' },
};

// EVERY OTHER BACKUP FIELD, WITH THE REASON IT STAYS. Not a convenience list:
// the gate fails if a field is in neither map, so adding a store to the backup
// forces a decision here rather than a silent omission.
export const NOT_PUBLISHED = {
  version: 'a format marker, not content',
  schemaVersion: 'a format marker, not content',
  exportedAt: 'metadata about the backup itself',

  // OTHER PEOPLE'S WORDS. The guardrail on "anything related to him goes".
  householdMemories: 'written BY customer households ABOUT their own families — not his to receive',
  passportCabinets: 'a household\'s own filing of its own orders — theirs, not his',
  accommodations: 'customer dietary requests; someone else\'s body, recorded for the kitchen',
  regulars: 'names, addresses, and contact details of real customers',
  orders: 'what other households bought, and what they paid',

  // THE BUSINESS. Real, worth keeping, and not about him.
  shopping: 'a working list for one week',
  weekDishes: 'this week only',
  inventory: 'a live count',
  containerInventory: 'a live count',
  ingredientsDb: 'a working price list',
  costHistory: 'operational pricing history',
  receiptAliases: 'a scanner lookup table',
  auditLog: 'an operational trace of app actions',
  weekLedger: 'operational week state',
  handledPending: 'an operational guard against re-polling an accepted order',
  customerFlags: 'rollout state, not content',
  dishRankings: 'Kevin ranking dishes against each other for the business',
  realDataEpoch: 'a marker for when order history became real',
  copiesNote: 'an operational note about backup copies',
  archiveHistory: 'metadata about previous archive exports',
  pipelineJournal: 'development notes on dishes that may never ship',

  // KITCHEN KNOWLEDGE. The teaching layer is a LATER read of this pool, not
  // Phase 1, and shipping it now would commit the companion to a shape nobody
  // has designed. Recorded as deferred rather than refused.
  practices: 'kitchen practice records — deferred, a teaching-layer decision rather than a memory one',
  terms: 'terms of art — deferred with practices, and five are still unconfirmed',
  anatomy: 'recipe anatomy — deferred with practices',
  labelVersions: 'purchased-product label evidence, kept for allergen answers',
  visualCues: 'media references for the kitchen page; owner tooling',
  clarifications: 'working notes on ambiguous records',
  captureInbox: 'an unsorted inbox by definition; sorted items land in a store that does travel',
  decisionLedger: 'product decisions about the app itself, not about him',
  walkAnswers: 'superseded — walks moved out of the app on Aug 2',
};

// ── THE BUNDLE ──────────────────────────────────────────────────────────────

export function buildRowanBundle(payload, opts = {}) {
  const src = payload && typeof payload === 'object' ? payload : {};
  const now = opts.now || Date.now();
  const records = {};
  const counts = {};
  const media = [];
  const gaps = [];

  for (const [field, spec] of Object.entries(PUBLISHED_STORES)) {
    const out = spec.project(src[field]);
    records[spec.key] = out.records;
    counts[spec.key] = out.records.length;
    for (const m of out.media) media.push(m);
    // EVERY BUNDLE REPORTS WHAT IT DOES NOT KNOW, in the Chronicle's spirit.
    // An empty store is a fact about the record, not a defect, and a reader
    // who is told "nothing recorded" will not mistake silence for absence of
    // the feature.
    if (!out.records.length) gaps.push(`${spec.label}: nothing recorded yet`);
  }

  // The dish names his own records point at, and only those. Enough for the
  // companion to render "Bolognese" instead of an id; deliberately NOT the
  // recipe book, which is a separate decision nobody has made.
  const dishIndex = [];
  const seenDish = new Set();
  for (const t of records.tastings) {
    const key = t.dishId || t.dish;
    if (!key || seenDish.has(key)) continue;
    seenDish.add(key);
    dishIndex.push({ dishId: t.dishId, name: t.dish });
  }
  dishIndex.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  media.sort((a, b) => String(a.mediaKey).localeCompare(String(b.mediaKey)));
  if (media.length) {
    gaps.push(`${media.length} media file(s) are referenced by key only; the bytes are not in this bundle`);
  }

  const bundle = {
    format: BUNDLE_FORMAT,
    mode: PUBLISH_MODE,
    // Stated so a receiver never infers it: this bundle is the whole record as
    // of builtAt, and anything it does not contain has been deleted or was
    // never written.
    replaces: 'everything previously received',
    builtAt: new Date(now).toISOString(),
    child: { birthYear: BIRTH_YEAR, birthMonth: BIRTH_MONTH },
    counts,
    records,
    dishIndex,
    media,
    gaps,
  };
  bundle.fingerprint = bundleFingerprint(bundle);
  return bundle;
}

// SAME STORES IN, SAME FINGERPRINT OUT. `builtAt` is excluded, which is what
// makes a dry run checkable: build twice, compare, and any difference is the
// builder being non-deterministic rather than the record having changed.
export function bundleFingerprint(bundle) {
  if (!bundle) return null;
  const subject = {
    format: bundle.format,
    mode: bundle.mode,
    records: bundle.records,
    dishIndex: bundle.dishIndex,
    media: bundle.media,
  };
  const s = JSON.stringify(subject);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// Plain sentences for the dry-run report. A count of zero is printed, never
// skipped: "nothing recorded yet" is the finding Phase 1 exists to produce.
export function describeBundle(bundle) {
  if (!bundle) return 'No bundle.';
  const lines = [`Bundle format ${bundle.format}, ${bundle.mode}, fingerprint ${bundle.fingerprint}.`];
  for (const [field, spec] of Object.entries(PUBLISHED_STORES)) {
    const n = bundle.counts[spec.key] || 0;
    lines.push(`  ${spec.label}: ${n === 0 ? 'nothing recorded yet' : `${n} record${n === 1 ? '' : 's'}`}  (${field})`);
  }
  lines.push(`  Media referenced: ${bundle.media.length}`);
  lines.push(`  Dishes named: ${bundle.dishIndex.length}`);
  return lines.join('\n');
}
