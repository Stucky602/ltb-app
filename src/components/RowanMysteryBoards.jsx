import React, { useState } from 'react';
import { styles } from '../styles.js';
import { openBoard, addEvidence, answerBoard, boardTimeline, EVIDENCE_KINDS } from '../rowanParticipation.js';
import { ageAt, formatAge } from '../rowan.js';

// RowanMysteryBoards.jsx — a long question of Rowan's, and everything that has
// accumulated against it.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS UI MUST NOT DO
//
// The module's contract is mostly about absences, and a pane can break every
// one of them without touching the store:
//
//   * OPEN IS THE NORMAL STATE. No expiry, no nag, no "stale" badge, no
//     progress bar, and no prompt to wrap one up. A board may sit open for
//     years and that is the feature.
//   * EVIDENCE APPENDS. Nothing here edits or replaces an earlier entry,
//     including an explanation — how the answer changed as Rowan aged IS the
//     record, and an edit button would quietly destroy it.
//   * THE KINDS ARE A WHITELIST. The form offers only the recorded kinds and
//     has no free-text type field, because "never invent evidence" has to be
//     enforced at the point of entry.
//   * A FINAL ANSWER IS AVAILABLE AND NEVER PUSHED. It is one more thing the
//     board holds, not a completion.
export function RowanMysteryBoards({ store, onSave }) {
  const [q, setQ] = useState('');
  const boards = ((store && store.boards) || []).slice().sort((a, b) => (a.openedAt || 0) - (b.openedAt || 0));

  const fld = {
    width: '100%', boxSizing: 'border-box', background: '#14201d',
    border: '1px solid #2d3a36', borderRadius: 8, color: '#e8e6df', fontSize: 12.5, padding: 8,
  };

  return (
    <div>
      <div style={styles.genCard}>
        <div style={styles.genTitle}>Long questions</div>
        <div style={styles.genHint}>
          Something he actually wondered. It can stay open for years.
        </div>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="What did he ask?"
          style={{ ...fld, marginTop: 8 }}
        />
        <button
          onClick={() => {
            const text = q.trim();
            if (!text) return;
            onSave(prev => openBoard(prev, text, { ageMonths: ageAt(new Date().toISOString()) }));
            setQ('');
          }}
          style={{ ...styles.btnGhost, marginTop: 8, cursor: 'pointer' }}
        >Start a board</button>
      </div>

      {boards.map(b => (
        <BoardCard key={b.id} board={b} store={store} onSave={onSave} fld={fld} />
      ))}
    </div>
  );
}

function BoardCard({ board, store, onSave, fld }) {
  const [kind, setKind] = useState('explanation');
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');
  const [closing, setClosing] = useState(false);
  const timeline = boardTimeline(store, board.id);

  return (
    <div style={styles.genCard}>
      <div style={styles.genTitle}>{board.question}</div>
      <div style={styles.genHint}>
        Asked {board.openedAt ? new Date(board.openedAt).toLocaleDateString() : ''}
        {Number.isFinite(board.ageMonths) ? ` \u00b7 he was ${formatAge(board.ageMonths)}` : ''}
      </div>

      {timeline.map((e, i) => (
        <div key={i} style={{ borderTop: '1px solid #2d3a36', paddingTop: 7, marginTop: 7 }}>
          <div style={{ fontSize: 11, color: '#9aa5a0' }}>
            {new Date(e.at).toLocaleDateString()} \u00b7 {e.kind === 'explanation' ? 'you' : e.kind}
          </div>
          <div style={{ fontSize: 13, color: '#e8e6df', marginTop: 2, whiteSpace: 'pre-wrap' }}>
            {e.text || e.ref}
          </div>
        </div>
      ))}

      {board.finalAnswer && (
        <div style={{ borderTop: '1px solid #2d3a36', paddingTop: 7, marginTop: 7 }}>
          <div style={{ fontSize: 11, color: '#5DCAA5' }}>Where it landed</div>
          <div style={{ fontSize: 13, color: '#e8e6df', marginTop: 2 }}>{board.finalAnswer}</div>
        </div>
      )}

      {/* APPEND ONLY. There is deliberately no edit control on any entry above. */}
      <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
        <select value={kind} onChange={e => setKind(e.target.value)}
          style={{ ...fld, flex: '0 0 150px', width: 'auto' }}>
          {EVIDENCE_KINDS.map(k => <option key={k} value={k}>{k === 'explanation' ? 'what you told him' : k}</option>)}
        </select>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Add to it"
        style={{ ...fld, minHeight: 56, marginTop: 6 }}
      />
      <button
        onClick={() => {
          const t = text.trim();
          if (!t) return;
          onSave(prev => addEvidence(prev, board.id, {
            kind, text: t, ageMonths: ageAt(new Date().toISOString()),
          }));
          setText('');
        }}
        style={{ ...styles.btnGhost, marginTop: 6, cursor: 'pointer' }}
      >Add</button>

      {/* AVAILABLE, NOT PUSHED. Behind a tap, phrased as a place it landed
          rather than as closing a task. */}
      {!board.finalAnswer && !closing && (
        <button
          onClick={() => setClosing(true)}
          style={{ ...styles.btnGhost, marginTop: 6, marginLeft: 6, cursor: 'pointer', color: '#7a8480' }}
        >It got answered</button>
      )}
      {closing && !board.finalAnswer && (
        <>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Where it landed"
            style={{ ...fld, minHeight: 48, marginTop: 6 }}
          />
          <button
            onClick={() => {
              const a = answer.trim();
              if (!a) return;
              onSave(prev => answerBoard(prev, board.id, a));
              setAnswer(''); setClosing(false);
            }}
            style={{ ...styles.btnGhost, marginTop: 6, cursor: 'pointer' }}
          >Save that</button>
        </>
      )}
    </div>
  );
}
