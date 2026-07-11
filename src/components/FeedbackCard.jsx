import React from 'react';
import { GOLD, TEAL_LIGHT, styles } from '../styles.js';

// ─── Dish feedback triage card (Jul 11) ─────────────────────────────────────
// Renders one incoming feedback entry on the Orders page, visually distinct
// from a real order (gold accent, "Dish feedback" label). One-tap triage:
//  - note present:  [Save tally only] [Save tally + note] [Ignore]
//  - no note:       [Save] [Ignore]
// Save modes map to applyFeedbackSave's 'tally' | 'tallyNote'.

const VERDICT_META = {
  good: { label: 'Perfect', color: TEAL_LIGHT },
  meh: { label: 'A little off', color: GOLD },
  bad: { label: 'Had trouble', color: '#d98a7e' },
};

const btnBase = {
  padding: '7px 12px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 12,
};

export function FeedbackCard({ entry, onSave, onIgnore }) {
  const meta = VERDICT_META[entry.verdict] || { label: entry.verdict, color: '#c8cfc9' };
  const hasNote = !!(entry.note && entry.note.trim());
  const when = entry.at ? new Date(entry.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

  return (
    <div style={{ ...styles.pendingCard, borderLeft: `3px solid ${GOLD}` }}>
      <div style={styles.pendingCardHeader}>
        <div style={{ ...styles.pendingCardName, color: GOLD, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Dish feedback
        </div>
        {when && <div style={styles.pendingCardTime}>{when}</div>}
      </div>
      <div style={{ margin: '6px 0 4px', fontSize: 15, fontWeight: 700, color: '#e8ede9' }}>
        {entry.dish}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: meta.color, marginBottom: hasNote ? 4 : 10 }}>
        {meta.label}
      </div>
      {hasNote && (
        <div style={{ fontSize: 13, color: '#c8cfc9', fontStyle: 'italic', marginBottom: 10 }}>
          &ldquo;{entry.note.trim()}&rdquo;
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {hasNote ? (
          <>
            <button style={{ ...btnBase, background: '#2a3a35', color: TEAL_LIGHT }} onClick={() => onSave(entry, 'tally')}>
              Save tally only
            </button>
            <button style={{ ...btnBase, background: TEAL_LIGHT, color: '#1a1a1a' }} onClick={() => onSave(entry, 'tallyNote')}>
              Save tally + note
            </button>
          </>
        ) : (
          <button style={{ ...btnBase, background: TEAL_LIGHT, color: '#1a1a1a' }} onClick={() => onSave(entry, 'tally')}>
            Save
          </button>
        )}
        <button style={{ ...btnBase, background: '#2a2f2d', color: '#8a938e' }} onClick={() => onIgnore(entry)}>
          Ignore
        </button>
      </div>
    </div>
  );
}
