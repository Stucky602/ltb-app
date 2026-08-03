import React, { useState } from 'react';
import { styles } from '../styles.js';
import { logRoles, rolesTimeline, KITCHEN_ROLES } from '../rowanParticipation.js';
import { ageAt, formatAge } from '../rowan.js';

// RowanKitchenRoles.jsx — what he did while the cooking happened.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE DESIGN IS THE ABSENCE, AND THE RENDER LAYER CAN BREAK IT ALONE
//
// The store has a tested absence of scoring: no exported reader totals, ranks,
// or streaks anything. That guarantee stops at the module boundary. A pane can
// reintroduce every one of them without touching the store, just by computing
// over the list it was handed.
//
// So there is deliberately nothing here that:
//   * counts sessions, in total or per role
//   * names a most-used or favourite role
//   * shows a streak, a gap, or a "last time" nudge
//   * suggests a role to try next
//
// **If a display string so much as counts sessions per role, it is wrong.**
// A streak turns a Tuesday with his father into something he is failing to keep
// up, and a mastery track turns being five into a deficiency.
//
// The list is a list. Nothing is computed over it.
export function RowanKitchenRoles({ store, onSave, weekDishes }) {
  const [picked, setPicked] = useState([]);
  const [note, setNote] = useState('');
  const [context, setContext] = useState('');
  const sessions = rolesTimeline(store);

  const fld = {
    width: '100%', boxSizing: 'border-box', background: '#14201d',
    border: '1px solid #2d3a36', borderRadius: 8, color: '#e8e6df', fontSize: 12.5, padding: 8,
  };

  const toggle = (id) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  return (
    <div>
      <div style={styles.genCard}>
        <div style={styles.genTitle}>In the kitchen</div>
        <div style={styles.genHint}>
          What he did while you cooked. Taking part is the whole of it.
        </div>

        {/* THE FIVE RECORDED ROLES ONLY. No role creation this phase, and no
            "other" field — a free-text role would be a sixth role by another
            name and the vocabulary is Kevin's to extend deliberately. */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {KITCHEN_ROLES.map(r => (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              title={r.what}
              style={{
                ...styles.btnGhost, cursor: 'pointer',
                ...(picked.includes(r.id) ? { borderColor: '#D4A050', color: '#D4A050' } : {}),
              }}
            >{r.label}</button>
          ))}
        </div>

        <input
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="What were you making? (optional)"
          list="rk-dishes"
          style={{ ...fld, marginTop: 8 }}
        />
        <datalist id="rk-dishes">
          {(weekDishes || []).map(d => <option key={d} value={d} />)}
        </datalist>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Anything worth remembering (optional)"
          style={{ ...fld, minHeight: 52, marginTop: 6 }}
        />

        <button
          onClick={() => {
            if (!picked.length) return;
            onSave(prev => logRoles(prev, picked, {
              note: [context.trim(), note.trim()].filter(Boolean).join(' \u2014 '),
              ageMonths: ageAt(new Date().toISOString()),
            }));
            setPicked([]); setNote(''); setContext('');
          }}
          style={{ ...styles.btnGhost, marginTop: 8, cursor: 'pointer' }}
        >Save it</button>
      </div>

      {/* A LIST OF WHAT HAPPENED. Newest last, so it reads as a history rather
          than a feed — and with no header count, because a count is the first
          step back toward a scoreboard. */}
      {sessions.length > 0 && (
        <div style={styles.genCard}>
          {sessions.map(s => (
            <div key={s.id} style={{ borderTop: '1px solid #2d3a36', paddingTop: 7, marginTop: 7 }}>
              <div style={{ fontSize: 11, color: '#9aa5a0' }}>
                {new Date(s.at).toLocaleDateString()}
                {Number.isFinite(s.ageMonths) ? ` \u00b7 he was ${formatAge(s.ageMonths)}` : ''}
              </div>
              <div style={{ fontSize: 13, color: '#e8e6df', marginTop: 2 }}>
                {s.roles.map(id => (KITCHEN_ROLES.find(r => r.id === id) || {}).label || id).join(', ')}
              </div>
              {s.note && (
                <div style={{ fontSize: 12.5, color: '#c9d1cd', marginTop: 2 }}>{s.note}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
