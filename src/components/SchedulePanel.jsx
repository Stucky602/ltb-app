import React, { useState, useMemo } from 'react';
import { buildCookSchedule } from '../cookSchedule.js';
const C = { panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0', faint: '#6b7570', good: '#5DCAA5', warn: '#EF9F27' };
const S = {
  section: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, margin: '10px 0' },
  head: { display: 'flex', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', color: C.dim, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', padding: 0 },
  day: { fontSize: 13, fontWeight: 800, color: C.good, margin: '10px 0 4px' },
  task: { fontSize: 12.5, color: C.text, padding: '4px 0', borderBottom: `1px solid ${C.border}` },
};

// #1 The cook-day timeline — Monday brines to Wednesday delivery, from the
// week's REAL orders: temp-grouped SV batches, overnight starts, equipment-
// aware stovetop sequencing, day-of sauces, packaging.
export function SchedulePanel({ orders }) {
  const [open, setOpen] = useState(false);
  const sched = useMemo(() => open ? buildCookSchedule(orders || []) : null, [open, orders]);
  return (
    <div style={S.section}>
      <button style={S.head} onClick={() => setOpen(o => !o)}>
        <span>Cook plan · Monday to delivery</span><span>{open ? '▲' : '▼'}</span>
      </button>
      {sched && sched.itemCount === 0 && <div style={{ fontSize: 12.5, color: C.faint, marginTop: 8 }}>No active orders yet. The plan builds itself from real orders.</div>}
      {sched && sched.warnings.map((w, i) => (
        <div key={i} style={{ fontSize: 12, color: C.warn, marginTop: 8 }}>⚠ {w}</div>
      ))}
      {sched && sched.days.map(day => (
        <div key={day.day}>
          <div style={S.day}>{day.day}</div>
          {day.tasks.map((t, i) => (
            <div key={i} style={S.task}>
              <span style={{ color: C.dim, fontWeight: 700 }}>{t.time}</span> — {t.task}
              {t.items.length > 0 && <span style={{ color: C.dim }}> · {t.items.join(', ')}</span>}
              {t.note && <div style={{ fontSize: 11, color: C.faint }}>{t.note}</div>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
