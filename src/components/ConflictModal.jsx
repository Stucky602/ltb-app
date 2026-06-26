import React from 'react';
import { X, AlertTriangle, Check } from '../icons.jsx';
import { styles } from '../styles.js';
import { analyzeConflicts } from '../equipmentConflict.js';

// ─── Kitchen equipment conflict checker (producer-facing) ───────────────────
// Runs analyzeConflicts on the checked dishes and shows red (hard jam) and
// yellow (soft / resolvable) flags so Kevin sees collisions BEFORE publishing.
export function ConflictModal({ selected, onClose }) {
  const result = analyzeConflicts(selected);
  const { red, yellow, clear } = result;

  return (
    <div style={styles.invoiceOverlay} onClick={onClose}>
      <div style={styles.conflictCard} onClick={e => e.stopPropagation()}>
        <div style={styles.reviewModalHeader}>
          <div style={styles.conflictTitle}>Kitchen conflict check</div>
          <button style={styles.iconBtn} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div style={styles.conflictSub}>
          Based on the {selected.length} dish{selected.length !== 1 ? 'es' : ''} checked on this week.
          Sous vide isn't counted (it runs hands-off).
        </div>

        {clear && (
          <div style={styles.conflictClear}>
            <Check size={18} color="#7abf7a" />
            <span>No conflicts — you're clear to publish.</span>
          </div>
        )}

        {red.length > 0 && (
          <div style={styles.conflictGroup}>
            <div style={styles.conflictGroupLabelRed}>Hard conflicts — can't run at the same time</div>
            {red.map((c, i) => (
              <div key={`r${i}`} style={styles.conflictRowRed}>
                <div style={styles.conflictRowHead}>
                  <AlertTriangle size={14} color="#e0828a" />
                  <span style={styles.conflictResRed}>{c.label}</span>
                </div>
                <div style={styles.conflictDishes}>{c.dishes.join('  ·  ')}</div>
                <div style={styles.conflictNote}>{c.note}</div>
              </div>
            ))}
          </div>
        )}

        {yellow.length > 0 && (
          <div style={styles.conflictGroup}>
            <div style={styles.conflictGroupLabelYellow}>Heads-up — workable, just don't overlap</div>
            {yellow.map((c, i) => (
              <div key={`y${i}`} style={styles.conflictRowYellow}>
                <div style={styles.conflictRowHead}>
                  <AlertTriangle size={14} color="#EF9F27" />
                  <span style={styles.conflictResYellow}>{c.label}</span>
                </div>
                <div style={styles.conflictDishes}>{c.dishes.join('  ·  ')}</div>
                <div style={styles.conflictNote}>{c.note}</div>
              </div>
            ))}
          </div>
        )}

        <button style={{ ...styles.saveBtn, marginTop: '16px', width: '100%' }} onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
