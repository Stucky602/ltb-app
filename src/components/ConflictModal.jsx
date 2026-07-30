import React from 'react';
import { X, AlertTriangle, Check } from '../icons.jsx';
import { styles } from '../styles.js';
import { analyzeConflicts, weekEffortSummary } from '../equipmentConflict.js';

// ─── Kitchen equipment conflict checker (producer-facing) ───────────────────
// Runs analyzeConflicts on the checked dishes and shows red (hard jam) and
// yellow (soft / resolvable) flags so Kevin sees collisions BEFORE publishing.
// Band colours. Green under 10, yellow 10-14, red 15+ — the thresholds
// themselves live in equipmentConflict.js so they cannot drift.
const EFFORT_COLOR = { green: '#7abf7a', yellow: '#EF9F27', red: '#e0828a' };
const EFFORT_TINT = { green: 'rgba(122,191,122,0.10)', yellow: 'rgba(239,159,39,0.10)', red: 'rgba(224,130,138,0.10)' };

export function ConflictModal({ selected, onClose }) {
  const result = analyzeConflicts(selected);
  const { red, yellow, clear } = result;
  const effort = weekEffortSummary(selected);

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

        {/* Total effort — ALWAYS shown, not just on a demanding week. The
            number was already being computed and was only surfacing inside the
            heavy-week branch, so most weeks never displayed it at all. */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px', marginBottom: 10, borderRadius: 6,
          border: '1px solid ' + EFFORT_COLOR[effort.band],
          background: EFFORT_TINT[effort.band],
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: EFFORT_COLOR[effort.band] }}>
            Total Effort = {effort.total}
          </span>
          <span style={{ fontSize: 11, color: '#9aa5a0' }}>
            {effort.rows.length} dish{effort.rows.length === 1 ? '' : 'es'} scored
          </span>
        </div>

        {effort.heavy && (
          <div style={styles.conflictRowYellow}>
            <div style={styles.conflictRowHead}>
              <AlertTriangle size={14} color="#EF9F27" />
              <span style={styles.conflictResYellow}>Demanding week</span>
            </div>
            <div style={styles.conflictDishes}>{effort.demandingNames.join('  ·  ')}</div>
            <div style={styles.conflictNote}>
              {effort.demandingCount} dish{effort.demandingCount === 1 ? '' : 'es'} at 4 or 5 on your own
              effort scale (total {effort.total} across the week). Not a conflict, just a heads-up
              before Sunday locks it in.
            </div>
          </div>
        )}

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
