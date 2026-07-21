import React, { useState, useMemo } from 'react';
import { monthlyPnl, pnlToCsv, marginTrend, costDrivers } from '../books.js';
import { currency } from '../utils.js';
const C = { panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0', faint: '#6b7570', good: '#5DCAA5', warn: '#EF9F27', bad: '#e0828a' };
const S = {
  section: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, margin: '10px 0' },
  title: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.dim, margin: 0 },
  head: { display: 'flex', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', color: C.dim, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', padding: 0 },
  row: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', fontSize: 12.5, borderBottom: `1px solid ${C.border}`, color: C.text },
};

// Tiny inline sparkline of the monthly blended-margin series. Higher = better,
// so a downward slope is the bad direction (colored accordingly on alert).
function MarginSparkline({ series, alert, width = 200, height = 30 }) {
  const pts = (series || []).map(s => s.marginPct);
  if (pts.length < 2) return null;
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min, n = pts.length;
  const y = (v) => (span < 1e-9 ? height / 2 : height - 3 - ((v - min) / span) * (height - 6));
  const x = (i) => (i / (n - 1)) * (width - 2) + 1;
  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const color = alert ? '#e0828a' : '#5DCAA5';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
      <circle cx={x(n - 1)} cy={y(pts[n - 1])} r="2" fill={color} />
    </svg>
  );
}

// #8 monthly P&L — lives in the Money tab. CSV export for tax season.
// costHistory/baseCostMap/ingredientName are optional; when present the panel
// also shows an SPC-style blended-margin trend with a "driven by" attribution.
export function BooksPanel({ orders, receiptLog, costHistory, baseCostMap, ingredientName }) {
  const [open, setOpen] = useState(false);
  const rows = useMemo(() => open ? monthlyPnl(orders || [], receiptLog || []) : [], [open, orders, receiptLog]);
  const trend = useMemo(() => open ? marginTrend(orders || []) : null, [open, orders]);
  const drivers = useMemo(
    () => (open && trend && trend.alert && costHistory) ? costDrivers(costHistory, baseCostMap, ingredientName) : [],
    [open, trend, costHistory, baseCostMap, ingredientName]
  );
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

      {/* Blended-margin trend (SPC): the slow creep no single order shows. */}
      {open && trend && trend.series.length >= 2 && (
        <div style={{ margin: '8px 0 10px', padding: '9px 11px', borderRadius: 8,
          background: trend.alert ? 'rgba(224,130,138,0.10)' : 'rgba(93,202,165,0.08)',
          border: `1px solid ${trend.alert ? '#5c2a3a' : '#28483d'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.dim }}>
              Blended margin trend
            </span>
            <span style={{ fontSize: 12.5, color: C.text }}>
              {trend.latestPct}%
              {trend.deltaPts != null && (
                <span style={{ color: trend.deltaPts < 0 ? C.bad : trend.deltaPts > 0 ? C.good : C.dim, fontWeight: 700, marginLeft: 6 }}>
                  {trend.deltaPts > 0 ? '+' : ''}{trend.deltaPts} pts / {trend.window} mo
                </span>
              )}
            </span>
          </div>
          {/* Sparkline of the monthly margin series. */}
          <div style={{ marginTop: 6 }}>
            <MarginSparkline series={trend.series} alert={trend.alert} />
          </div>
          {trend.alert && (
            <div style={{ fontSize: 12, color: C.bad, marginTop: 6, lineHeight: 1.4 }}>
              Blended margin down {Math.abs(trend.deltaPts)} points over {trend.window} months
              {drivers.length > 0 && (
                <>, driven by {drivers.map(d => `${d.name} (${d.pctMove > 0 ? '+' : ''}${d.pctMove}%)`).join(', ')}</>
              )}.
            </div>
          )}
        </div>
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
