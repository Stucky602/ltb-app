// tests/dossierPrompts.mjs — the weekly dossier question (anti-taper).
//
// The rule that shapes every trigger: NO trigger may read order history.
// History was backfilled, so "first time ever cooked" measures data entry, not
// reality — the same trap that killed the passport rare badge. Everything here
// reads this week's menu plus timestamps Kevin himself wrote.
//
// Run: node tests/dossierPrompts.mjs

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { weeklyDossierPrompt, suggestedTypeFor, STALE_MONTHS } from '../src/dossierPrompts.js';
import { emptyJournal, addEntry } from '../src/journal.js';

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

const NOW = new Date('2026-07-24T12:00:00Z');
const WEEK = ['Bolognese', 'Gumbo', 'Chili'];
const ago = (months) => new Date(NOW.getTime() - months * 30 * 24 * 3600 * 1000).toISOString();
const entry = (dish, ts) => ({ type: 'technique', subject: { kind: 'dish', dish }, text: 'note', ts });

// ── Priority 1: an empty record always wins ─────────────────────────────────
let j = emptyJournal();
j = addEntry(j, entry('Bolognese', ago(0)), NOW);
j = addEntry(j, entry('Gumbo', ago(0)), NOW);
let p = weeklyDossierPrompt(j, WEEK, 'w1', NOW);
ok(p.kind === 'never' && p.dish === 'Chili',
  'a dish with NOTHING written beats everything else — the emptiest record is the most urgent');
ok(p.entryCount === 0 && /Chili/.test(p.question), 'the question names the dish and reports an empty record');
ok(suggestedTypeFor(p) === 'doneCues',
  'an empty record asks for done-cues first — the thing a recipe cannot carry');

// ── Priority 2: stale beats thin ────────────────────────────────────────────
let j2 = emptyJournal();
j2 = addEntry(j2, entry('Bolognese', ago(STALE_MONTHS + 2)), NOW); // old, 1 entry
j2 = addEntry(j2, entry('Gumbo', ago(0)), NOW);
j2 = addEntry(j2, entry('Gumbo', ago(0)), NOW);
j2 = addEntry(j2, entry('Chili', ago(0)), NOW);
let p2 = weeklyDossierPrompt(j2, WEEK, 'w1', NOW);
ok(p2.kind === 'stale' && p2.dish === 'Bolognese',
  'once nothing is empty, the dish nobody has written about in months comes next');
ok(suggestedTypeFor(p2) === 'technique', 'a stale record asks for technique, not done-cues again');

// A record that is old but NOT past the threshold is not stale.
let j3 = emptyJournal();
for (const d of WEEK) j3 = addEntry(j3, entry(d, ago(STALE_MONTHS - 2)), NOW);
j3 = addEntry(j3, entry('Gumbo', ago(STALE_MONTHS - 2)), NOW);
let p3 = weeklyDossierPrompt(j3, WEEK, 'w1', NOW);
ok(p3.kind === 'thin', `nothing past ${STALE_MONTHS} months means the question falls through to the thinnest record`);

// ── Priority 3: thinnest, with a stable tie-break ───────────────────────────
let j4 = emptyJournal();
j4 = addEntry(j4, entry('Bolognese', ago(0)), NOW);
j4 = addEntry(j4, entry('Bolognese', ago(0)), NOW);
j4 = addEntry(j4, entry('Gumbo', ago(0)), NOW);
j4 = addEntry(j4, entry('Chili', ago(0)), NOW);
let p4 = weeklyDossierPrompt(j4, WEEK, 'w1', NOW);
ok(p4.kind === 'thin' && p4.entryCount === 1, 'falls through to the least-documented dish on the week');
ok(['Chili', 'Gumbo'].includes(p4.dish), 'and picks one of the genuinely thinnest, not the fattest');
ok(weeklyDossierPrompt(j4, WEEK, 'w1', NOW).dish === p4.dish, 'the choice is deterministic, never random');

// ── SELF-CLEARING: answering moves the target ───────────────────────────────
const answered = addEntry(j, entry('Chili', ago(0)), NOW);
ok(weeklyDossierPrompt(answered, WEEK, 'w1', NOW).dish !== 'Chili',
  'answering the question moves it on by itself — no dismissal flag to persist or get out of sync');

// ── Always about a dish being cooked THIS week ──────────────────────────────
let j5 = emptyJournal();
j5 = addEntry(j5, entry('Bolognese', ago(0)), NOW);
const p5 = weeklyDossierPrompt(j5, ['Bolognese'], 'w1', NOW);
ok(p5.dish === 'Bolognese',
  'never asks about a dish Kevin is not cooking — that would ask him to reconstruct from memory');
ok(weeklyDossierPrompt(j5, [], 'w1', NOW) === null, 'an empty week asks nothing at all');
ok(weeklyDossierPrompt(null, WEEK, 'w1', NOW).kind === 'never', 'an empty journal still produces a question');

// ── Wording rotates by week but is stable within one ────────────────────────
const a = weeklyDossierPrompt(j4, WEEK, 'week-A', NOW).question;
const b = weeklyDossierPrompt(j4, WEEK, 'week-B', NOW).question;
ok(weeklyDossierPrompt(j4, WEEK, 'week-A', NOW).question === a, 'stable within a week — no reshuffle per render');
ok(typeof a === 'string' && typeof b === 'string' && a.length > 20, 'the question is a real sentence');

// ── THE BACKFILL RULE, enforced at the source ───────────────────────────────
const src = readFileSync(new URL('../src/dossierPrompts.js', import.meta.url), 'utf8');
ok(!/\borders\b/.test(src.replace(/\/\/.*$/gm, '')),
  'the engine never touches order history in code — history was backfilled and cannot support "first ever"');

console.log(`DOSSIER PROMPTS: ALL PASS (${pass} checks)`);
