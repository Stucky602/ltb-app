// rowanQuestions.js — what he asked, and what Kevin actually answered.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS IS A SEPARATE STORE FROM THE RATINGS
//
// The rowan log records his verdict on a dish: a number, a note, sometimes his
// voice. That is one half of a relationship with food. The other half is the
// questions — why is it that colour, why does yours taste different, why do we
// wait a day — and those are not events attached to a meal. A question can
// arrive in a supermarket, outlive the dish it was about, and be answered years
// later.
//
// So a question is its own record with its own lifecycle, and the most
// important field is the one that is usually EMPTY.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE UNANSWERED STATE IS THE POINT
//
// A question with no answer is not an incomplete record. It is an accurate one:
// a child asked something and nobody has answered it yet. Keeping that visible
// is the entire value — it is a list of things Kevin still owes his son, in his
// son's words, and it does not quietly resolve itself.
//
// ═══════════════════════════════════════════════════════════════════════════
// LTB MUST NEVER GENERATE AN ANSWER AND PRESENT IT AS KEVIN'S
//
// This is the hardest rule in the file and the reason `answer` has no
// auto-fill, no suggestion, and no draft state anywhere in this module. The
// corpus can find records RELATED to a question — that is retrieval, and it
// links to real evidence. It cannot compose the sentence Kevin would have said.
// A child reading this in twenty years must be able to trust that every answer
// here came from his father.
//
// The same rule as the voice capsules, one level up: there, the recording is
// never regenerated; here, the answer is never authored.

export const QUESTIONS_VERSION = 1;

// What a question can be about. Deliberately the entities that already exist,
// because a question links to records rather than copying them.
export const QUESTION_SUBJECTS = ['dish', 'ingredient', 'practice', 'term', 'week', 'general'];

export function emptyQuestions() {
  return { version: QUESTIONS_VERSION, questions: [] };
}

const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');
const list = (v, max = 20) => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x).slice(0, max) : []);

export function normalizeQuestions(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.questions)) return emptyQuestions();
  const seen = new Set();
  const questions = [];
  for (const q of raw.questions) {
    if (!q || typeof q !== 'object' || !q.id || seen.has(q.id)) continue;
    seen.add(q.id);
    // TRIMMED before the emptiness check. '   ' is truthy, so an untrimmed
    // test would let a mis-tap through as a question with no words in it.
    const text = str(q.text, 2000).trim();
    const capsule = q.capsule && typeof q.capsule === 'object' && q.capsule.mediaKey
      ? {
        mediaKey: str(q.capsule.mediaKey, 200),
        contentType: str(q.capsule.contentType, 60) || 'audio/webm',
        seconds: Math.max(0, Math.round(Number(q.capsule.seconds) || 0)),
        bytes: Math.max(0, Math.round(Number(q.capsule.bytes) || 0)),
        checksum: str(q.capsule.checksum, 80),
      }
      : null;
    // A question with neither words nor audio is not a question.
    if (!text && !capsule) continue;
    questions.push({
      id: String(q.id),
      text,
      capsule,
      askedAt: str(q.askedAt, 40) || new Date().toISOString(),
      ageMonths: Number.isFinite(q.ageMonths) ? q.ageMonths : null,
      subjectKind: QUESTION_SUBJECTS.includes(q.subjectKind) ? q.subjectKind : 'general',
      subjectId: str(q.subjectId, 120),
      // Kevin's words or nothing. Never composed.
      answer: str(q.answer),
      answeredAt: typeof q.answeredAt === 'number' ? q.answeredAt : null,
      // Ids of journal entries, anatomy records, cues, terms — real records the
      // answer draws on. Retrieval is allowed; authorship is not.
      evidence: list(q.evidence),
    });
  }
  return { version: QUESTIONS_VERSION, questions };
}

export function addQuestion(store, partial, now = Date.now()) {
  const s = normalizeQuestions(store);
  const id = (partial && partial.id) || `q_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  if (s.questions.some(q => q.id === id)) return s;
  const next = normalizeQuestions({
    questions: [{ ...partial, id, askedAt: (partial && partial.askedAt) || new Date(now).toISOString() }],
  }).questions[0];
  if (!next) return s; // refused: neither words nor audio
  return { ...s, questions: [next, ...s.questions] };
}

// Answering stamps WHEN, because how long a child waited for an answer is part
// of the record and not an embarrassment to hide.
export function answerQuestion(store, id, answer, evidence, now = Date.now()) {
  const s = normalizeQuestions(store);
  const text = str(answer).trim();
  if (!text) return s; // an empty answer does not mark a question answered
  return {
    ...s,
    questions: s.questions.map(q => (q.id === id
      ? { ...q, answer: text, answeredAt: now, evidence: list(evidence || q.evidence) }
      : q)),
  };
}

export function attachQuestionCapsule(store, id, capsule) {
  const s = normalizeQuestions(store);
  return {
    ...s,
    questions: s.questions.map(q => (q.id === id
      ? normalizeQuestions({ questions: [{ ...q, capsule }] }).questions[0]
      : q)),
  };
}

export const unansweredQuestions = (store) =>
  normalizeQuestions(store).questions.filter(q => !q.answer);

export const answeredQuestions = (store) =>
  normalizeQuestions(store).questions.filter(q => !!q.answer);

export function questionsAbout(store, subjectKind, subjectId) {
  return normalizeQuestions(store).questions
    .filter(q => q.subjectKind === subjectKind && (!subjectId || q.subjectId === subjectId));
}

export function questionCounts(store) {
  const q = normalizeQuestions(store).questions;
  return {
    total: q.length,
    answered: q.filter(x => !!x.answer).length,
    unanswered: q.filter(x => !x.answer).length,
    recorded: q.filter(x => !!x.capsule).length,
  };
}
