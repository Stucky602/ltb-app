// rowanParticipation.js — Living Mystery Boards, and Rowan's Kitchen Roles.
//
// Two stores in one file because they are the same size, always travel
// together, and are both about Rowan TAKING PART rather than reacting. Split
// them if either grows.
//
// ═══════════════════════════════════════════════════════════════════════════
// PART ONE — LIVING MYSTERY BOARDS
//
// A board is a genuine long-running question. Not a quiz, not a project with a
// due date: something he actually wondered, that accumulates evidence over
// years and may never resolve.
//
// It is deliberately NOT the same thing as a question capsule. A capsule is one
// question with one eventual answer from Kevin. A board is the case file: the
// original question, recordings, photos, cues, Kevin's explanations as they
// CHANGE, later observations, and — if one ever arrives — a final answer.
//
//   * REAL CURIOSITY ONLY. Nothing here generates a question for him to be
//     curious about. A board starts because he asked something.
//   * IT MAY STAY OPEN FOR YEARS, and that is a valid state rather than an
//     incomplete one. Nothing nags, nothing expires, nothing marks it overdue.
//   * NEVER INVENT EVIDENCE. Every entry is a real record or Kevin's own words.
//   * THE JOURNEY IS KEPT, NOT JUST THE ANSWER. Kevin's explanations are
//     appended rather than replaced, because how his answer changed as Rowan
//     got older is the interesting part — and a store that overwrote them would
//     leave only the last one, which is the least interesting.
//
// ═══════════════════════════════════════════════════════════════════════════
// PART TWO — KITCHEN ROLES
//
// Age-appropriate ways to actually take part in a real cook: Observer, Smell
// Checker, Question Keeper, Story Keeper, Portion Counter.
//
// NO POINTS, LEVELS, BADGES, STREAKS, OR MASTERY. Kevin's list, and it is not a
// stylistic preference — it is the whole design. The participation is the
// reward. A streak turns a Tuesday with his father into a thing he is failing
// to keep up, and a mastery track turns being five into a deficiency.
//
// So this records that he took a role on a day, and nothing else. There is no
// score to read back and nothing accumulates. A test asserts the absence.

export const PARTICIPATION_VERSION = 1;

const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');
const list = (v, max = 30) => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x).slice(0, max) : []);

// ── PART ONE: BOARDS ────────────────────────────────────────────────────────

// What can be pinned to a board. All of these already exist as records
// elsewhere, so a board LINKS rather than copies — the recording stays the
// recording, and a board never becomes a second, drifting copy of it.
export const EVIDENCE_KINDS = ['capsule', 'question', 'photo', 'cue', 'observation', 'explanation'];

export function emptyBoards() {
  return { version: PARTICIPATION_VERSION, boards: [] };
}

function cleanEntry(e) {
  if (!e || typeof e !== 'object') return null;
  if (!EVIDENCE_KINDS.includes(e.kind)) return null;
  const text = str(e.text);
  const ref = str(e.ref, 200);
  // An entry that points at nothing and says nothing is not evidence.
  if (!text.trim() && !ref) return null;
  return {
    kind: e.kind,
    text,
    ref,
    at: typeof e.at === 'number' ? e.at : Date.now(),
    ageMonths: Number.isFinite(e.ageMonths) ? e.ageMonths : null,
  };
}

export function normalizeBoards(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.boards)) return emptyBoards();
  const seen = new Set();
  const boards = [];
  for (const b of raw.boards) {
    if (!b || typeof b !== 'object' || !b.id || seen.has(b.id)) continue;
    const question = str(b.question, 2000).trim();
    if (!question) continue; // a board with no question is not a board
    seen.add(b.id);
    boards.push({
      id: String(b.id),
      question,
      openedAt: typeof b.openedAt === 'number' ? b.openedAt : Date.now(),
      ageMonths: Number.isFinite(b.ageMonths) ? b.ageMonths : null,
      subjectId: str(b.subjectId, 120),
      entries: Array.isArray(b.entries) ? b.entries.map(cleanEntry).filter(Boolean) : [],
      // Optional forever. Absent is the normal state, not a missing field.
      finalAnswer: str(b.finalAnswer),
      answeredAt: typeof b.answeredAt === 'number' ? b.answeredAt : null,
      tags: list(b.tags),
    });
  }
  return { version: PARTICIPATION_VERSION, boards };
}

export function openBoard(store, question, extra = {}, now = Date.now()) {
  const s = normalizeBoards(store);
  const q = str(question, 2000).trim();
  if (!q) return s;
  const id = extra.id || `mb_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  if (s.boards.some(b => b.id === id)) return s;
  const built = normalizeBoards({ boards: [{ ...extra, id, question: q, openedAt: now }] }).boards[0];
  return built ? { ...s, boards: [built, ...s.boards] } : s;
}

// Evidence APPENDS. Nothing here replaces an earlier entry, including an
// explanation — see the header: how Kevin's answer changed is the record.
export function addEvidence(store, boardId, entry, now = Date.now()) {
  const s = normalizeBoards(store);
  const e = cleanEntry({ ...entry, at: (entry && entry.at) || now });
  if (!e) return s;
  return {
    ...s,
    boards: s.boards.map(b => (b.id === boardId ? { ...b, entries: [...b.entries, e] } : b)),
  };
}

// A final answer does NOT close or hide the journey. It is one more thing the
// board holds.
export function answerBoard(store, boardId, answer, now = Date.now()) {
  const s = normalizeBoards(store);
  const text = str(answer).trim();
  if (!text) return s;
  return {
    ...s,
    boards: s.boards.map(b => (b.id === boardId ? { ...b, finalAnswer: text, answeredAt: now } : b)),
  };
}

export const openBoards = (store) => normalizeBoards(store).boards.filter(b => !b.finalAnswer);
export const answeredBoards = (store) => normalizeBoards(store).boards.filter(b => !!b.finalAnswer);

// Oldest evidence first — the point of a board is the sequence.
export function boardTimeline(store, boardId) {
  const b = normalizeBoards(store).boards.find(x => x.id === boardId);
  return b ? [...b.entries].sort((x, y) => x.at - y.at) : [];
}

export function boardCounts(store) {
  const b = normalizeBoards(store).boards;
  return {
    total: b.length,
    open: b.filter(x => !x.finalAnswer).length,
    answered: b.filter(x => !!x.finalAnswer).length,
    evidence: b.reduce((n, x) => n + x.entries.length, 0),
  };
}

// ── PART TWO: KITCHEN ROLES ─────────────────────────────────────────────────

// Kevin's own list. Each is something a small child can actually do during a
// real cook, which is the whole bar.
export const KITCHEN_ROLES = [
  { id: 'observer', label: 'Observer', what: 'Watches and says what he notices.' },
  { id: 'smell', label: 'Smell Checker', what: 'Smells things and reports.' },
  { id: 'questions', label: 'Question Keeper', what: 'Asks whatever he wants; the questions get written down.' },
  { id: 'story', label: 'Story Keeper', what: 'Remembers what happened and tells it back.' },
  { id: 'portions', label: 'Portion Counter', what: 'Counts things into containers.' },
];

export const ROLE_IDS = KITCHEN_ROLES.map(r => r.id);

export function emptyRoleLog() {
  return { version: PARTICIPATION_VERSION, sessions: [] };
}

export function normalizeRoleLog(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.sessions)) return emptyRoleLog();
  const seen = new Set();
  const sessions = [];
  for (const x of raw.sessions) {
    if (!x || typeof x !== 'object' || !x.id || seen.has(x.id)) continue;
    const roles = list(x.roles).filter(r => ROLE_IDS.includes(r));
    if (!roles.length) continue;
    seen.add(x.id);
    sessions.push({
      id: String(x.id),
      roles,
      at: typeof x.at === 'number' ? x.at : Date.now(),
      ageMonths: Number.isFinite(x.ageMonths) ? x.ageMonths : null,
      note: str(x.note, 2000),
      // What the session happened to produce, by reference. Not a reward and
      // not a requirement — plenty of sessions produce nothing at all.
      produced: list(x.produced),
    });
  }
  return { version: PARTICIPATION_VERSION, sessions };
}

export function logRoles(store, roles, extra = {}, now = Date.now()) {
  const s = normalizeRoleLog(store);
  const id = extra.id || `kr_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  if (s.sessions.some(x => x.id === id)) return s;
  const built = normalizeRoleLog({ sessions: [{ ...extra, id, roles, at: now }] }).sessions[0];
  return built ? { ...s, sessions: [built, ...s.sessions] } : s;
}

// DELIBERATELY THE ONLY READ. It answers "what has he done", never "how much",
// "how often", or "how well".
//
// There is no streak, no total, no longest run, no favourite role, no
// suggestion of what to try next. Every one of those is a scoreboard wearing a
// friendlier name, and a scoreboard turns cooking with his father into
// something he can fall behind on.
export function rolesTimeline(store) {
  return [...normalizeRoleLog(store).sessions].sort((a, b) => a.at - b.at);
}
