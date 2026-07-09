import React, { useState, useMemo } from 'react';
import { attachRates, usualOrder } from '../regularsIntel.js';
const C = { panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0', faint: '#6b7570', good: '#5DCAA5', warn: '#EF9F27', bad: '#e0828a' };
const S = {
  section: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, margin: '10px 14px' },
  title: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.dim, margin: 0 },
  head: { display: 'flex', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', color: C.dim, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', padding: 0 },
  row: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', fontSize: 12.5, borderBottom: `1px solid ${C.border}`, color: C.text },
};

// #4 regulars intelligence — attach rate per menu appearance, plus the usual.
export function RegularsIntelPanel({ orders, customers }) {
  const [who, setWho] = useState('');
  const rates = useMemo(() => who ? attachRates(orders || [], who).slice(0, 8) : [], [orders, who]);
  const usual = useMemo(() => who ? usualOrder(orders || [], who) : [], [orders, who]);
  const names = useMemo(() => {
    if (customers && customers.length) return customers;
    const s = new Set(); (orders || []).forEach(o => { const n = o.customer || o.name; if (n) s.add(n); });
    return [...s].sort();
  }, [orders, customers]);
  return (
    <div style={S.section}>
      <div style={S.title}>Customer intel</div>
      <select value={who} onChange={e => setWho(e.target.value)}
        style={{ width: '100%', margin: '8px 0', padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#232d2a', color: C.text, fontSize: 13 }}>
        <option value="">Pick a customer…</option>
        {names.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      {who && usual.length > 0 && (
        <div style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>
          <span style={{ color: C.faint, textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>The usual: </span>
          {usual.map(u => `${u.usualQty}× ${u.name}${u.variant ? ` (${u.variant})` : ''}`).join(' · ')}
        </div>
      )}
      {who && rates.map(r => (
        <div key={r.dish} style={S.row}>
          <span style={{ flex: 1 }}>{r.dish}</span>
          <span style={{ color: r.appearances >= 2 && r.attachPct >= 75 ? C.good : C.dim, fontWeight: 700, fontSize: 12 }}>
            {r.ordered}/{r.appearances} on menu · {r.attachPct}%
          </span>
        </div>
      ))}
      {who && !rates.length && <div style={{ fontSize: 12, color: C.faint }}>No order history for {who} yet.</div>}
    </div>
  );
}
