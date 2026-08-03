// RowanTab.jsx — the record itself.
//
// It leads with the RANKING because Kevin asked for it by name, and with the
// two movement lists right underneath, because those are the only things here
// that a preference list could never tell him. A dish his son scored 1 and
// later scored 5 is the entire reason this stores a series instead of a
// current opinion.
//
// Every number on this screen excludes entries flagged as unfair tests. They
// stay visible in a dish's own timeline, because they happened, and they are
// kept out of anything derived, because a rating given while teething is
// evidence about a Tuesday and not about a dish.

import React, { useState, useEffect, useMemo } from 'react';
import {
  RATING_LABELS, formatAge, topDishes, dishSummary, seriesFor,
  coverage, untried, writtenEntries, capsuleTimeline, vocabularyByAge,
} from '../rowan.js';
import { WORKER_BASE, PUBLISH_TOKEN } from '../config.js';
import {
  addQuestion, answerQuestion, unansweredQuestions, answeredQuestions,
} from '../rowanQuestions.js';
import { addNote, notesTimeline, NOTE_SUBJECTS } from '../notesForRowan.js';
import { GOLD, styles } from '../styles.js';
import { RowanMysteryBoards } from './RowanMysteryBoards.jsx';
import { RowanKitchenRoles } from './RowanKitchenRoles.jsx';

const SWATCH = { 1: '#E24B4A', 2: '#C77B3A', 3: '#9aa5a0', 4: '#7FA86B', 5: '#4FA36B' };
const C = { text: '#e8e6df', faint: '#9aa5a0', border: '#2d3a36', card: '#1c2422' };

const S = {
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10 },
  h: { fontSize: 14.5, fontWeight: 700, marginBottom: 6, color: C.text },
  faint: { fontSize: 12.5, color: C.faint, lineHeight: 1.5 },
  row: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: `1px solid ${C.border}` },
  pill: (n) => ({
    minWidth: 24, height: 24, borderRadius: 6, background: SWATCH[n], color: '#121a18',
    fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', flex: '0 0 auto',
  }),
};



// ── NOTES FOR ROWAN ─────────────────────────────────────────────────────────
// Kevin speaking directly to him, which is none of the other things in this
// tab: not Rowan reacting, not Rowan asking, not the kitchen's record.
//
// Deliberately plain. No prompts, no streak, no completion meter, and nothing
// that summarises or tidies what he wrote. Kevin's own instruction: keep it
// simple. Anything that improved the prose would replace the only thing worth
// keeping.
function NotesForRowanPane({ store, onSave, dishNames }) {
  const [text, setText] = useState('');
  const [subjectKind, setSubjectKind] = useState('none');
  const [subjectLabel, setSubjectLabel] = useState('');
  const notes = notesTimeline(store);

  const fld = {
    width: '100%', boxSizing: 'border-box', background: '#14201d',
    border: '1px solid #2d3a36', borderRadius: 8, color: '#e8e6df', fontSize: 12.5, padding: 8,
  };

  return (
    <div style={S.card}>
      <div style={S.h}>Notes for Rowan</div>
      <div style={S.faint}>
        Things you want to tell him. Not about a meal unless you want them to be.
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Say it however you want to say it"
        style={{ ...fld, minHeight: 80, marginTop: 8 }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
        <select value={subjectKind} onChange={e => setSubjectKind(e.target.value)}
          style={{ ...fld, flex: '1 1 150px', width: 'auto' }}>
          {NOTE_SUBJECTS.map(sub => <option key={sub.id} value={sub.id}>{sub.label}</option>)}
        </select>
        {subjectKind !== 'none' && (
          <input value={subjectLabel} onChange={e => setSubjectLabel(e.target.value)}
            placeholder="Which one" style={{ ...fld, flex: '1 1 150px', width: 'auto' }} />
        )}
      </div>
      <button
        onClick={() => {
          const t = text.trim();
          if (!t) return;
          onSave(prev => addNote(prev, {
            text: t,
            subjectKind,
            subjectLabel: subjectKind === 'none' ? '' : subjectLabel.trim(),
            ageMonths: ageAt(new Date().toISOString()),
          }));
          setText(''); setSubjectLabel(''); setSubjectKind('none');
        }}
        style={{ marginTop: 8, background: '#232d2a', border: '1px solid #D4A050', borderRadius: 8,
          color: '#D4A050', fontSize: 12.5, fontWeight: 700, padding: '9px 16px', cursor: 'pointer' }}
      >Save it</button>

      {notes.map(n => (
        <div key={n.id} style={{ borderTop: '1px solid #2d3a36', paddingTop: 9, marginTop: 9 }}>
          <div style={{ fontSize: 11, color: '#9aa5a0' }}>
            {new Date(n.at).toLocaleDateString()}
            {Number.isFinite(n.ageMonths) ? ` \u00b7 he was ${formatAge(n.ageMonths)}` : ''}
            {n.subjectLabel ? ` \u00b7 ${n.subjectLabel}` : ''}
          </div>
          <div style={{ fontSize: 13, color: '#e8e6df', marginTop: 3, whiteSpace: 'pre-wrap' }}>{n.text}</div>
        </div>
      ))}
    </div>
  );
}

// ── QUESTIONS ───────────────────────────────────────────────────────────────
// The unanswered ones come first and stay visible. A question with no answer is
// not an incomplete record — it is a list of things Kevin still owes his son,
// in his son's words, and it must not quietly resolve itself.
function QuestionsPane({ questions, onSave }) {
  const [draft, setDraft] = useState('');
  const [answering, setAnswering] = useState(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const open = unansweredQuestions(questions);
  const done = answeredQuestions(questions);

  const Row = ({ q }) => (
    <div style={{ borderTop: '1px solid #2d3a36', paddingTop: 8, marginTop: 8 }}>
      <div style={{ fontSize: 13, color: '#e8e6df' }}>&ldquo;{q.text}&rdquo;</div>
      <div style={{ fontSize: 11, color: '#9aa5a0', marginTop: 2 }}>
        {new Date(q.askedAt).toLocaleDateString()}
        {Number.isFinite(q.ageMonths) ? ` \u00b7 ${formatAge(q.ageMonths)}` : ''}
        {q.subjectId ? ` \u00b7 ${q.subjectId}` : ''}
      </div>
      {q.answer ? (
        <div style={{ fontSize: 12.5, color: '#c9d1cd', marginTop: 5, paddingLeft: 8,
          borderLeft: '2px solid #5DCAA5' }}>{q.answer}</div>
      ) : answering === q.id ? (
        <>
          <textarea
            value={answerDraft}
            onChange={e => setAnswerDraft(e.target.value)}
            placeholder="Your answer, in your words"
            style={{ width: '100%', minHeight: 60, marginTop: 6, boxSizing: 'border-box',
              background: '#14201d', border: '1px solid #2d3a36', borderRadius: 8,
              color: '#e8e6df', fontSize: 12.5, padding: 8 }}
          />
          {/* No draft, no suggestion, no auto-fill anywhere near this box. A
              child reading it in twenty years has to be able to trust that
              every answer here came from his father. */}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button
              onClick={() => { onSave(prev => answerQuestion(prev, q.id, answerDraft)); setAnswering(null); setAnswerDraft(''); }}
              style={{ background: '#232d2a', border: '1px solid #5DCAA5', borderRadius: 8,
                color: '#5DCAA5', fontSize: 12, fontWeight: 700, padding: '7px 12px', cursor: 'pointer' }}
            >Save answer</button>
            <button onClick={() => setAnswering(null)}
              style={{ background: '#232d2a', border: '1px solid #2d3a36', borderRadius: 8,
                color: '#9aa5a0', fontSize: 12, padding: '7px 12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </>
      ) : (
        <button onClick={() => { setAnswering(q.id); setAnswerDraft(''); }}
          style={{ marginTop: 6, background: 'none', border: '1px solid #2d3a36', borderRadius: 8,
            color: '#D4A050', fontSize: 12, padding: '6px 11px', cursor: 'pointer' }}>
          Answer this
        </button>
      )}
    </div>
  );

  return (
    <div style={S.card}>
      <div style={S.h}>What he asked</div>
      <div style={S.faint}>
        {open.length > 0
          ? `${open.length} still waiting on you.`
          : 'Questions he asks, and what you told him.'}
      </div>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder="Write down what he asked, in his words"
        style={{ width: '100%', minHeight: 50, marginTop: 8, boxSizing: 'border-box',
          background: '#14201d', border: '1px solid #2d3a36', borderRadius: 8,
          color: '#e8e6df', fontSize: 12.5, padding: 8 }}
      />
      <button
        onClick={() => { const t = draft.trim(); if (!t) return; onSave(prev => addQuestion(prev, { text: t })); setDraft(''); }}
        style={{ marginTop: 6, background: '#232d2a', border: '1px solid #D4A050', borderRadius: 8,
          color: '#D4A050', fontSize: 12.5, fontWeight: 700, padding: '8px 14px', cursor: 'pointer' }}
      >Save the question</button>
      {open.map(q => <Row key={q.id} q={q} />)}
      {done.length > 0 && (
        <>
          <div style={{ ...S.h, marginTop: 14 }}>Answered</div>
          {done.map(q => <Row key={q.id} q={q} />)}
        </>
      )}
    </div>
  );
}

// ── VOCABULARY ──────────────────────────────────────────────────────────────
// Derived, sourced, and NOT a score. See the note in rowan.js: this must never
// grade him, compare him to anyone, or imply a technical word beats a plain one.
function VocabularyPane({ log }) {
  const bands = useMemo(() => vocabularyByAge(log), [log]);
  if (!bands.length) return null;
  return (
    <div style={S.card}>
      <div style={S.h}>Words, as they arrived</div>
      <div style={S.faint}>
        First time each word shows up. Words from a recording are his; words from your own
        notes are yours about him, and they are marked apart.
      </div>
      {bands.map(b => (
        <div key={b.from} style={{ borderTop: '1px solid #2d3a36', paddingTop: 8, marginTop: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#D4A050' }}>
            {formatAge(b.from)} to {formatAge(b.to)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
            {b.words.map(w => (
              <span key={w.word} title={`${w.dish} \u00b7 ${new Date(w.at).toLocaleDateString()}`}
                style={{ fontSize: 12, padding: '3px 8px', borderRadius: 999,
                  border: '1px solid ' + (w.voice === 'rowan' ? '#5DCAA5' : '#2d3a36'),
                  color: w.voice === 'rowan' ? '#5DCAA5' : '#9aa5a0' }}>
                {w.word}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// One capsule. The audio element is the point; the transcript is a text field
// beside it that can be corrected freely, because correcting words cannot touch
// the recording — editTranscript only ever writes the transcript fields.
function CapsuleRow({ entry, onSaveTranscript }) {
  const c = entry.capsule;
  const [text, setText] = useState(c.transcript || '');
  const [editing, setEditing] = useState(false);

  // FETCHED WITH A HEADER, NOT A QUERY STRING, then played from a blob URL.
  //
  // An <audio src> cannot carry a custom header, so the obvious version puts
  // the publish token in the URL — which is exactly what worker.js's tokenOk()
  // comment says to stop doing: a token in a URL lands in Cloudflare's request
  // logs, in browser history, and in any Referer the page emits. The
  // query-string branch is kept alive there only for un-updated callers, and
  // adding a NEW one would push that cleanup further away rather than nearer.
  //
  // preload is 'none' by way of loading on demand: nothing is fetched until
  // Kevin taps play, so opening the tab does not pull every recording he has.
  const [src, setSrc] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const load = async () => {
    if (src) return;
    try {
      const res = await fetch(`${WORKER_BASE}/media/${encodeURIComponent(c.mediaKey)}`, {
        headers: { 'X-LTB-Token': PUBLISH_TOKEN },
      });
      if (!res.ok) { setLoadErr('That recording could not be loaded.'); return; }
      setSrc(URL.createObjectURL(await res.blob()));
    } catch (e) {
      setLoadErr('That recording could not be loaded.');
    }
  };
  // Object URLs are held by the document until revoked, so a long session
  // scrolling this list would leak every clip it touched.
  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);
  return (
    <div style={{ borderTop: '1px solid #2d3a36', paddingTop: 8, marginTop: 8 }}>
      <div style={{ fontSize: 12, color: '#9aa5a0' }}>
        {new Date(entry.at).toLocaleDateString()} · {formatAge(entry.ageMonths)} · {entry.dish}
        {c.seconds ? ` · ${c.seconds}s` : ''}
      </div>
      {src
        ? <audio controls autoPlay src={src} style={{ width: '100%', marginTop: 6 }} />
        : (
          <button
            onClick={load}
            style={{ width: '100%', marginTop: 6, background: '#232d2a', border: '1px solid #2d3a36',
              borderRadius: 8, color: '#D4A050', fontSize: 12.5, fontWeight: 700,
              padding: '9px', cursor: 'pointer' }}
          >Play</button>
        )}
      {loadErr && <div style={{ fontSize: 11.5, color: '#e0828a', marginTop: 4 }}>{loadErr}</div>}
      {editing ? (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What he said, in your words"
            style={{ width: '100%', minHeight: 54, marginTop: 6, boxSizing: 'border-box',
              background: '#14201d', border: '1px solid #2d3a36', borderRadius: 8,
              color: '#e8e6df', fontSize: 12.5, padding: 8 }}
          />
          <button
            onClick={() => { onSaveTranscript && onSaveTranscript(entry.id, text); setEditing(false); }}
            style={{ marginTop: 6, background: '#232d2a', border: '1px solid #5DCAA5', borderRadius: 8,
              color: '#5DCAA5', fontSize: 12, fontWeight: 700, padding: '7px 12px', cursor: 'pointer' }}
          >Save words</button>
        </>
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{ marginTop: 6, fontSize: 12.5, color: c.transcript ? '#e8e6df' : '#6b7570', cursor: 'pointer' }}
        >
          {c.transcript || 'Add what he said'}
        </div>
      )}
    </div>
  );
}

export function RowanTab({
  log, dishNames, onSaveTranscript, questions, onSaveQuestions, notesRowan, onSaveNotes,
  rowanBoards, onSaveBoards, rowanRoles, onSaveRoles,
}) {
  const [open, setOpen] = useState(null);
  const [sub, setSub] = useState('record');
  const ranked = topDishes(log);
  const cov = coverage(log, dishNames);
  const notYet = untried(log, dishNames);
  const family = writtenEntries(log, { familyOnly: true });
  const capsules = capsuleTimeline(log);

  const movers = ranked
    .map(r => ({ ...r, s: dishSummary(log, r.dish) }))
    .filter(r => r.s && (r.s.cameAround || r.s.wentOff));

  if (!(log || []).length) {
    return (
      <div style={S.card}>
        <div style={S.h}>Nothing logged yet</div>
        <div style={S.faint}>
          The card at the top of Orders is where this gets filled in. Pick a dish, tap a number
          from 1 to 5, write what happened. It builds from there.
          <br /><br />
          The point of it is the series rather than any one rating: a dish he refuses at two and
          loves at four is the thing worth having, and you only see that by logging the refusals too.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* SUB-TABS, added before Boards and Roles are mounted rather than after.
          The tab is 461 lines; adding two more panes inline would recreate the
          App.jsx problem at a smaller scale, which is the whole reason the
          brief puts this step first.

          Pure structural change: every section below is the same component with
          the same props and the same save paths, wrapped in a chooser. No state
          moved out of App.jsx, no new hooks beyond the one selector. */}
      {/* The SAME style keys the Record tab already uses. Inventing S.subToggle
          here would have rendered an unstyled row — those keys do not exist. */}
      <div style={styles.cookSubToggle}>
        {[['record', 'Record'], ['questions', 'Questions'], ['dad', 'From Dad'],
          ['mysteries', 'Mysteries'], ['roles', 'Roles']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSub(id)}
            style={{ ...styles.cookSubBtn, ...(sub === id ? styles.cookSubBtnActive : {}) }}
          >{label}</button>
        ))}
      </div>

      {sub === 'record' && (<>
      <div style={S.card}>
        <div style={S.h}>His dishes, best first</div>
        <div style={S.faint}>
          Averaged across every fair tasting. {cov.tried} of {cov.total} dishes rated.
        </div>
        {ranked.map(r => {
          const s = dishSummary(log, r.dish);
          const isOpen = open === r.dish;
          return (
            <div key={r.dish}>
              <div style={{ ...S.row, cursor: 'pointer' }} onClick={() => setOpen(isOpen ? null : r.dish)}>
                <span style={S.pill(Math.round(r.average))}>{r.average.toFixed(1)}</span>
                <span style={{ flex: 1, fontSize: 13.5, color: C.text }}>{r.dish}</span>
                {s && s.cameAround && <span style={{ fontSize: 11, color: '#4FA36B' }}>came around</span>}
                {s && s.wentOff && <span style={{ fontSize: 11, color: '#E24B4A' }}>went off it</span>}
                <span style={{ fontSize: 11.5, color: C.faint }}>
                  {r.entries} {r.entries === 1 ? 'time' : 'times'}
                </span>
              </div>
              {isOpen && (
                <div style={{ padding: '4px 0 10px 32px' }}>
                  {seriesFor(log, r.dish).map(e => (
                    <div key={e.id} style={{ marginTop: 7, opacity: e.fairTest ? 1 : 0.55 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={S.pill(e.rating)}>{e.rating}</span>
                        <span style={{ fontSize: 12.5, color: C.text }}>{formatAge(e.ageMonths)}</span>
                        <span style={{ fontSize: 11.5, color: C.faint }}>{RATING_LABELS[e.rating]}</span>
                        {!e.fairTest && <span style={{ fontSize: 11, color: C.faint }}>· not counted</span>}
                      </div>
                      {e.note && <div style={{ ...S.faint, marginTop: 3 }}>{e.note}</div>}
                      {e.familyNote && (
                        <div style={{ ...S.faint, marginTop: 3, fontStyle: 'italic', color: GOLD }}>
                          {e.familyNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {movers.length > 0 && (
        <div style={S.card}>
          <div style={S.h}>Dishes that moved</div>
          <div style={S.faint}>
            The reason this keeps every rating instead of the latest one. Tastes double back, and
            a dish written off at two can come good at four.
          </div>
          {movers.map(m => (
            <div key={m.dish} style={S.row}>
              <span style={{ flex: 1, fontSize: 13.5, color: C.text }}>{m.dish}</span>
              <span style={{ fontSize: 12, color: m.s.cameAround ? '#4FA36B' : '#E24B4A' }}>
                {m.s.first.rating} at {formatAge(m.s.first.ageMonths)}
                {' \u2192 '}
                {m.s.latestFair.rating} at {formatAge(m.s.latestFair.ageMonths)}
              </span>
            </div>
          ))}
        </div>
      )}

      <VocabularyPane log={log} />

      {capsules.length > 0 && (
        <div style={S.card}>
          {/* CHRONOLOGICAL, and that ordering IS the feature. Any one capsule is
              a toddler saying something about dinner. Played in order across
              years, it is the thing this tab exists to hold: how his words and
              his relationship to the food changed. Sorting by dish or by rating
              would break the only view that shows it. */}
          <div style={S.h}>His voice</div>
          <div style={S.faint}>
            {capsules.length} recording{capsules.length === 1 ? '' : 's'}, oldest first.
          </div>
          {capsules.map(e => (
            <CapsuleRow key={e.id} entry={e} onSaveTranscript={onSaveTranscript} />
          ))}
        </div>
      )}

      {family.length > 0 && (
        <div style={S.card}>
          <div style={S.h}>Family notes</div>
          <div style={S.faint}>
            Gathered out of the per-dish entries and kept together, because these are the part
            written for him rather than for the kitchen.
          </div>
          {family.map(e => (
            <div key={e.id} style={{ ...S.row, display: 'block' }}>
              <div style={{ fontSize: 11.5, color: C.faint }}>
                {e.dish} · {formatAge(e.ageMonths)}
              </div>
              <div style={{ fontSize: 13.5, color: C.text, marginTop: 3 }}>{e.familyNote}</div>
            </div>
          ))}
        </div>
      )}

      {notYet.length > 0 && (
        <div style={S.card}>
          <div style={S.h}>Not tried yet</div>
          <div style={S.faint}>The worklist, not a scold. {notYet.length} left.</div>
          <div style={{ ...S.faint, marginTop: 6, color: C.text }}>{notYet.join(' · ')}</div>
        </div>
      )}
      </>)}

      {sub === 'questions' && <QuestionsPane questions={questions} onSave={onSaveQuestions} />}

      {sub === 'dad' && (
        <NotesForRowanPane store={notesRowan} onSave={onSaveNotes} dishNames={dishNames} />
      )}

      {sub === 'mysteries' && (
        <RowanMysteryBoards store={rowanBoards} onSave={onSaveBoards} />
      )}
      {sub === 'roles' && (
        <RowanKitchenRoles store={rowanRoles} onSave={onSaveRoles} weekDishes={dishNames} />
      )}
    </div>
  );
}
