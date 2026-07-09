import React, { useState, useMemo } from 'react';
import { scoreWeekCandidates, composeWeek } from '../weekPlanner.js';
const C = { panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0', faint: '#6b7570', good: '#5DCAA5', warn: '#EF9F27', bad: '#e0828a' };
const S = {
  section: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, margin: '10px 14px' },
  title: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.dim, margin: 0 },
  head: { display: 'flex', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', color: C.dim, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', padding: 0 },
  row: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', fontSize: 12.5, borderBottom: `1px solid ${C.border}`, color: C.text },
};

// #3 demand-aware week planner — lives under the Week tab's dish picker.
export function PlannerPanel({ orders, weekDishes, liveCostMap, baseCostMap }) {
  const [open, setOpen] = useState(false);
  const [composed, setComposed] = useState(null); // composer popup
  const ranked = useMemo(
    () => open ? scoreWeekCandidates(orders || [], weekDishes || [], { liveCostMap, baseCostMap }).slice(0, 10) : [],
    [open, orders, weekDishes, liveCostMap, baseCostMap]
  );
  return (
    <div style={S.section}>
      <button style={S.head} onClick={() => setOpen(o => !o)}>
        <span>Planner · what should run next week?</span><span>{open ? '▲' : '▼'}</span>
      </button>
      {open && ranked.length === 0 && (
        <div style={{ fontSize: 12.5, color: C.faint, marginTop: 8 }}>Everything's already picked, or there's no order history yet to rank from.</div>
      )}
      {open && ranked.map(r => (
        <div key={r.name} style={S.row}>
          <span style={{ flex: 1 }}>
            {r.name}
            <span style={{ color: C.faint, fontSize: 11 }}>
              {' '}· {r.weeksSinceLast == null ? 'never run' : r.weeksSinceLast === 0 ? 'ran this week' : `${r.weeksSinceLast} wk ago`}
              {r.runs > 0 ? ` · avg ${r.avgUnits}/run` : ''}
            </span>
          </span>
          {r.newConflicts > 0 && <span style={{ color: C.warn, fontSize: 11 }}>equip clash</span>}
          <span style={{ color: r.underFloor ? C.bad : C.good, fontSize: 11, width: 40, textAlign: 'right' }}>
            {r.worstMarginPct != null ? r.worstMarginPct + '%' : '—'}
          </span>
          <span style={{ fontWeight: 700, width: 34, textAlign: 'right', color: C.text }}>{r.score}</span>
        </div>
      ))}
      {open && <div style={{ fontSize: 10.5, color: C.faint, marginTop: 6 }}>Score = time since last run + avg demand + margin health − equipment clashes with your current picks.</div>}
      {open && (
        <button
          style={{ width: '100%', marginTop: 8, padding: '9px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#232d2a', color: C.good, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
          onClick={() => setComposed(composeWeek(orders || [], { liveCostMap, baseCostMap }))}
        >
          Compose a week for me
        </button>
      )}
      {composed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setComposed(null)}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, maxWidth: 420, width: '100%', maxHeight: '80vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ ...S.title, marginBottom: 8 }}>A week that balances — take it or leave it</div>
            {composed.picks.map(p => (
              <div key={p.name} style={{ padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{p.name} <span style={{ color: C.faint, fontWeight: 400, fontSize: 11 }}>({p.cuisine})</span></div>
                <div style={{ fontSize: 11.5, color: C.dim }}>{p.why.join(' · ')}</div>
              </div>
            ))}
            {composed.notes.map((n, i) => (
              <div key={i} style={{ fontSize: 11.5, color: C.warn, marginTop: 8 }}>{n}</div>
            ))}
            <button style={{ width: '100%', marginTop: 12, padding: '9px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, cursor: 'pointer' }}
              onClick={() => setComposed(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
