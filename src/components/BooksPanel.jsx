import React, { useState, useMemo } from 'react';
import { monthlyPnl, pnlToCsv } from '../books.js';
import { currency } from '../utils.js';
const C = { panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0', faint: '#6b7570', good: '#5DCAA5', warn: '#EF9F27', bad: '#e0828a' };
const S = {
  section: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, margin: '10px 0' },
  title: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.dim, margin: 0 },
  head: { display: 'flex', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', color: C.dim, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', padding: 0 },
  row: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', fontSize: 12.5, borderBottom: `1px solid ${C.border}`, color: C.text },
};

// #8 monthly P&L — lives in the Money tab. CSV export for tax season.
export function BooksPanel({ orders, receiptLog }) {
  const [open, setOpen] = useState(false);
  const rows = useMemo(() => open ? monthlyPnl(orders || [], receiptLog || []) : [], [open, orders, receiptLog]);
  const exportCsv = () => {
    const blob = new Blob([pnlToCsv(rows)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ltb-pnl-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div style={{ ...S.section, margin: '10px 0' }}>
      <button style={S.head} onClick={() => setOpen(o => !o)}>
        <span>Books · monthly P&L</span><span>{open ? '▲' : '▼'}</span>
      </button>
      {open && rows.length === 0 && (
        <div style={{ fontSize: 12.5, color: C.faint, marginTop: 8 }}>No orders yet to report on.</div>
      )}
      {open && rows.map(r => (
        <div key={r.month} style={S.row}>
          <span style={{ width: 62, fontWeight: 700 }}>{r.month}</span>
          <span style={{ color: C.faint, width: 46 }}>{r.orders} ord</span>
          <span style={{ flex: 1, textAlign: 'right' }}>{currency(r.revenue)}</span>
          <span style={{ color: C.dim, flex: 1, textAlign: 'right' }}>−{currency(r.cogs)}{r.cogsComplete ? '' : '*'}</span>
          <span style={{ color: r.profit >= 0 ? C.good : C.bad, fontWeight: 700, flex: 1, textAlign: 'right' }}>{currency(r.profit)} · {r.marginPct}%</span>
        </div>
      ))}
      {open && rows.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 10.5, color: C.faint }}>COGS = per-item cost basis (same math as this tab). * = some costs unknown.</span>
          <button onClick={exportCsv} style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${C.border}`, background: '#232d2a', color: C.good, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Export CSV</button>
        </div>
      )}
    </div>
  );
}
