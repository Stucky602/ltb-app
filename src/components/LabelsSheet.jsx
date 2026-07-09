import React, { useMemo } from 'react';
import { buildLabelSheet } from '../labels.js';

// #7 bag labels + packing slips — print-friendly overlay (window.print()).
export function LabelsSheet({ orders, onClose }) {
  const sheet = useMemo(() => buildLabelSheet(orders || []), [orders]);
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', color: '#111', zIndex: 3000, overflow: 'auto', padding: 20, fontFamily: 'system-ui' }}>
      <style>{`@media print { .no-print { display: none !important; } .label { break-inside: avoid; } }`}</style>
      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button onClick={() => window.print()} style={{ padding: '10px 18px', fontWeight: 700, borderRadius: 8, border: '1px solid #888', cursor: 'pointer' }}>Print</button>
        <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #888', cursor: 'pointer' }}>Close</button>
        <span style={{ alignSelf: 'center', fontSize: 13, color: '#555' }}>{sheet.containerTotal} labels · {sheet.packing.length} customers</span>
      </div>
      {sheet.containerTotal === 0 && (
        <p style={{ color: '#666' }}>No active orders to label. (Delivered orders are hidden; reprint from an order if needed.)</p>
      )}
      <h3 style={{ margin: '4px 0 10px' }}>Labels</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
        {sheet.labels.map((l, i) => (
          <div key={i} className="label" style={{ border: '1.5px solid #333', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{l.customer}{l.seq ? `  ·  ${l.seq}` : ''}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{l.dish}</div>
            {l.variant ? <div style={{ fontSize: 11.5, color: '#444' }}>{l.variant}</div> : null}
            {l.weight ? <div style={{ fontSize: 11.5, color: '#444' }}>{l.weight}</div> : null}
            <div style={{ fontSize: 11, color: '#666', marginTop: 3, fontStyle: 'italic' }}>{l.cue}</div>
          </div>
        ))}
      </div>
      <h3 style={{ margin: '18px 0 10px', pageBreakBefore: 'always' }}>Packing checklist</h3>
      {sheet.packing.map((p, i) => (
        <div key={i} className="label" style={{ border: '1px solid #999', borderRadius: 6, padding: '8px 10px', marginBottom: 8 }}>
          <div style={{ fontWeight: 800 }}>{p.customer} — {p.containers} container{p.containers !== 1 ? 's' : ''}{p.paid ? '' : '  ·  UNPAID'}</div>
          {p.items.map((it, j) => <div key={j} style={{ fontSize: 12.5 }}>☐ {it}</div>)}
        </div>
      ))}
    </div>
  );
}
