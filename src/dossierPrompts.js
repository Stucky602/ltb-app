// dossierPrompts.js — ONE question a week, aimed at the emptiest record.
//
// WHY THIS EXISTS: a ten-year knowledge pool does not fail by crashing, it
// fails by TAPERING. Kevin will write a lot in month one and less in month
// fourteen, and nothing in the app would ever notice. This is the forcing
// function: after the week closes, one question, about one dish, chosen
// because its record is the thinnest thing on this week's menu.
//
// ONE question, deliberately. A checklist gets ignored; a single question gets
// answered. If it ever grows into a form, it has failed.
//
// THE BACKFILL RULE, and why this ignores order history entirely:
// order history was typed in when the app was built, so "first time this dish
// was ever cooked" measures DATA ENTRY, not reality — the same trap that
// killed the passport rare badge and seasonal firsts. So no trigger here reads
// order history. Every one of them reads (a) which dishes are on THIS week's
// menu and (b) the timestamps of entries KEVIN HIMSELF WROTE. Both are real.
//
// SELF-CLEARING BY CONSTRUCTION: the prompt is computed from current state, so
// answering it moves the target to the next-thinnest dish automatically. There
// is no dismissal flag, no "asked on" ledger, nothing to persist and nothing
// to get out of sync.

import { normalizeJournal, canonDishName, JOURNAL_TYPES } from './journal.js';

// A record older than this is stale even if it is long. Six months is roughly
// the point where Kevin's own account of a dish stops matching what he
// actually does now.
export const STALE_MONTHS = 6;

// Question text per trigger. Several per kind so the weekly prompt does not
// become wallpaper — the same sentence every Monday stops being read by week
// five, which would defeat the entire purpose.
const QUESTIONS = {
  never: [
    'has nothing written down at all. What does done look like, in your words?',
    'has an empty record. If someone else had to cook it Wednesday, what would they get wrong?',
    'has never been written up. What is the one thing that makes or breaks it?',
  ],
  stale: [
    'has not been written about in a while. What do you do differently now?',
    'was last noted a while back. Has anything about it changed since?',
    'has an old record. Would past-you recognize how you make it today?',
  ],
  thin: [
    'has the thinnest record on this week. What is missing from it?',
    'is the least documented thing you are cooking. What would you add?',
    'has only a little written down. What is the next thing worth saying about it?',
  ],
};

// Deterministic pick, rotated by week, so the wording changes week to week but
// is stable within a week (no reshuffling on every render).
function pick(list, weekStamp) {
  let h = 0;
  for (let i = 0; i < String(weekStamp).length; i++) h = (h * 31 + String(weekStamp).charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// weekDishes: the names on this week's menu. The question is always about
// something Kevin is ACTUALLY COOKING this week — asking about a dish he has
// not touched in months is asking him to reconstruct, which is exactly the
// unreliable memory this whole system exists to get ahead of.
export function weeklyDossierPrompt(journal, weekDishes, weekStamp, now, renames) {
  const j = normalizeJournal(journal);
  const names = (weekDishes || []).filter(Boolean);
  if (!names.length) return null;

  const at = (now || new Date()).getTime();
  const counts = new Map();
  const newest = new Map();
  for (const name of names) {
    counts.set(name, 0);
    newest.set(name, null);
  }
  const canonOf = new Map(names.map(n => [canonDishName(n, renames), n]));
  for (const e of j.entries) {
    if (!e.subject || e.subject.kind !== 'dish') continue;
    const target = canonOf.get(canonDishName(e.subject.dish, renames));
    if (!target) continue;
    counts.set(target, counts.get(target) + 1);
    const prev = newest.get(target);
    if (!prev || String(e.ts) > String(prev)) newest.set(target, e.ts);
  }

  // Priority 1: a dish with NOTHING written. Alphabetical among ties so the
  // choice is stable and never looks random.
  const empty = names.filter(n => counts.get(n) === 0).sort();
  if (empty.length) {
    return { kind: 'never', dish: empty[0], question: `${empty[0]} ${pick(QUESTIONS.never, weekStamp)}`, entryCount: 0 };
  }

  // Priority 2: the dish whose newest entry is oldest, if that is past STALE_MONTHS.
  let stalest = null;
  for (const n of names) {
    const ts = newest.get(n);
    if (!ts) continue;
    if (!stalest || String(ts) < String(newest.get(stalest))) stalest = n;
  }
  if (stalest) {
    const age = at - Date.parse(newest.get(stalest));
    if (age > STALE_MONTHS * MONTH_MS) {
      return {
        kind: 'stale', dish: stalest, entryCount: counts.get(stalest),
        lastWritten: newest.get(stalest),
        question: `${stalest} ${pick(QUESTIONS.stale, weekStamp)}`,
      };
    }
  }

  // Priority 3: the thinnest record on the week.
  const thinnest = [...names].sort((a, b) => counts.get(a) - counts.get(b) || a.localeCompare(b))[0];
  return {
    kind: 'thin', dish: thinnest, entryCount: counts.get(thinnest),
    question: `${thinnest} ${pick(QUESTIONS.thin, weekStamp)}`,
  };
}

// Which entry TYPE the question is really asking for, so the dossier form can
// open pre-set to it instead of making Kevin pick. `never` asks for done-cues
// (the thing a recipe cannot carry); the others just ask for more technique.
export function suggestedTypeFor(prompt) {
  if (!prompt) return 'technique';
  const t = prompt.kind === 'never' ? 'doneCues' : 'technique';
  return JOURNAL_TYPES[t] ? t : 'technique';
}
