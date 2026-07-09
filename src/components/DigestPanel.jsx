import React, { useState, useMemo } from 'react';
import { buildWeeklyDigest } from '../digest.js';
import { currency } from '../utils.js';
const C = { panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0', faint: '#6b7570', good: '#5DCAA5', warn: '#EF9F27', bad: '#e0828a' };
const S = {
  section: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, margin: '10px 0' },
  head: { display: 'flex', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', color: C.dim, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', padding: 0 },
  h: { fontSize: 12, fontWeight: 700, color: C.good, margin: '10px 0 3px', textTransform: 'uppercase', letterSpacing: 0.4 },
  p: { fontSize: 12.5, color: C.text, margin: '2px 0', lineHeight: 1.5 },
  dim: { color: C.dim },
};

// #6 The Monday briefing — everything the app knows, in one read.
export function DigestPanel({ orders, regulars, liveCostMap, baseCostMap }) {
  const [open, setOpen] = useState(false);
  const d = useMemo(() => open ? buildWeeklyDigest(orders || [], regulars || [], { liveCostMap, baseCostMap }) : null,
    [open, orders, regulars, liveCostMap, baseCostMap]);
  return (
    <div style={S.section}>
      <button style={S.head} onClick={() => setOpen(o => !o)}>
        <span>Monday briefing · the week at a glance</span><span>{open ? '▲' : '▼'}</span>
      </button>
      {d && (
        <div>
          <div style={S.h}>Money</div>
          <div style={S.p}>
            {d.week.count} order{d.week.count !== 1 ? 's' : ''} this week, {currency(d.week.revenue)} revenue, {currency(d.week.profit)} profit
            {d.revenueDeltaPct != null && <span style={{ color: d.revenueDeltaPct >= 0 ? C.good : C.warn }}> ({d.revenueDeltaPct >= 0 ? '+' : ''}{d.revenueDeltaPct}% vs last week)</span>}.
          </div>
          {d.week.top.length > 0 && <div style={{ ...S.p, ...S.dim }}>Top sellers: {d.week.top.map(([n, u]) => `${n} (${u})`).join(' · ')}</div>}

          {d.quiet.length > 0 && (<>
            <div style={S.h}>Gone quiet</div>
            {d.quiet.map(q => <div key={q.display} style={S.p}>{q.display}: no order in {q.weeks} weeks ({q.orders} lifetime). Maybe a nudge?</div>)}
          </>)}

          {d.marginWatch.length > 0 && (<>
            <div style={S.h}>Margin watch</div>
            {d.marginWatch.map(m => <div key={m.name} style={{ ...S.p, color: m.underFloor ? C.bad : C.warn }}>{m.name}: worst variant {m.pct}%{m.underFloor ? ' — under the floor' : ''}</div>)}
          </>)}

          {d.drifters.length > 0 && (<>
            <div style={S.h}>Cost movers</div>
            {d.drifters.map(m => <div key={m.name} style={S.p}>{m.name}: costs {m.driftPct > 0 ? 'up' : 'down'} {Math.abs(m.driftPct)}% vs anchor.</div>)}
          </>)}

          <div style={S.h}>A week that would balance</div>
          {d.proposal.picks.slice(0, 6).map(p => (
            <div key={p.name} style={S.p}><b>{p.name}</b> <span style={S.dim}>· {p.why.join(' · ')}</span></div>
          ))}
          {d.proposal.notes.map((n, i) => <div key={i} style={{ ...S.p, color: C.warn }}>{n}</div>)}
        </div>
      )}
    </div>
  );
}
