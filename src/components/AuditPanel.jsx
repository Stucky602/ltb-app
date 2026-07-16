import React, { useState, useMemo } from 'react';
import { styles, GOLD } from '../styles.js';
import { SOURCES } from '../auditLog.js';

// AuditPanel — the money trail, reverse-chronological.
//
// Deliberately plain. This is a diagnostic you open when a number looks
// wrong, not a dashboard you browse. No charts, no summaries, no filters:
// the log is capped at 500 entries, and Ctrl-F beats any filter UI I'd
// build for that size. Every pixel here is trying to answer exactly one
// question — "what changed this number, and when?"

const SOURCE_LABEL = {
  [SOURCES.MANUAL]: 'manual',
  [SOURCES.RECEIPT]: 'receipt',
  [SOURCES.DEPLOY]: 'deploy',
  [SOURCES.PUBLISH]: 'publish',
  [SOURCES.SEED]: 'seed',
};

// Deploy entries are the ones that historically went unnoticed for weeks,
// so they get the one bit of colour in here.
const SOURCE_COLOR = {
  [SOURCES.MANUAL]: '#9aa5a0',
  [SOURCES.RECEIPT]: '#5DCAA5',
  [SOURCES.DEPLOY]: GOLD,
  [SOURCES.PUBLISH]: '#7FB2E5',
  // Seed rows share the deploy gold: both mean "a file edit moved this."
  // Reconcile rows go one further and rewrote stored data, so they carry a
  // basis string in meta explaining themselves.
  [SOURCES.SEED]: GOLD,
};

const money = (v) => (typeof v === 'number' ? '$' + v.toFixed(2) : String(v));

function fmtWhen(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return String(iso || '');
  const d = new Date(t);
  const now = Date.now();
  const mins = Math.round((now - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  if (mins < 60 * 24) return Math.round(mins / 60) + 'h ago';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function Row({ e }) {
  const color = SOURCE_COLOR[e.source] || '#9aa5a0';
  const isMoney = e.field === 'current' || e.field === 'baseline' || e.field === 'price' || e.field === 'cost';
  const show = (v) => (v === null || v === undefined ? '—' : (isMoney ? money(v) : String(v)));
  return (
    <div style={{
      padding: '8px 10px',
      borderBottom: '1px solid #2d3a36',
      fontSize: 12,
      lineHeight: 1.45,
      display: 'flex',
      gap: 10,
      alignItems: 'baseline',
    }}>
      <span style={{ color, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', flexShrink: 0, width: 52 }}>
        {SOURCE_LABEL[e.source] || e.source}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color: '#F5F0E8' }}>{e.target}</span>
        <span style={{ color: '#5F5E5A' }}>{' · '}{e.field}</span>
        <br />
        <span style={{ color: '#9aa5a0' }}>{show(e.from)}</span>
        <span style={{ color: '#5F5E5A' }}>{' → '}</span>
        <span style={{ color: '#F5F0E8', fontWeight: 600 }}>{show(e.to)}</span>
        {e.meta && e.meta.raw && (
          <span style={{ color: '#5F5E5A' }}>{'  ·  "'}{e.meta.raw}{'"'}</span>
        )}
        {e.meta && e.meta.basis && (
          <span style={{ color: '#5F5E5A' }}>{'  ·  '}{e.meta.basis}</span>
        )}
      </span>
      <span style={{ color: '#5F5E5A', flexShrink: 0, fontSize: 11 }}>{fmtWhen(e.at)}</span>
    </div>
  );
}

export function AuditPanel({ log }) {
  const [open, setOpen] = useState(false);
  // Newest first. The stored log is append-order (oldest first) because that
  // is how bounding wants it; display is the reverse.
  const rows = useMemo(() => [...(log || [])].reverse(), [log]);

  return (
    <div style={{ marginTop: 14 }}>
      <button
        style={{ ...styles.chartToggleBtn, ...(open ? styles.chartToggleBtnActive : {}) }}
        onClick={() => setOpen(v => !v)}
      >
        {open ? 'Hide change log' : `Change log (${rows.length})`}
      </button>

      {open && (
        <div style={{ marginTop: 10, background: '#222826', borderRadius: 8, border: '1px solid #2d3a36', overflow: 'hidden' }}>
          <div style={{ padding: '8px 10px', fontSize: 11, color: '#5F5E5A', borderBottom: '1px solid #2d3a36' }}>
            Every change that moved a cost or a price. Newest first, last 500, 90 days.
            Rides your backup, so a restore rewinds it too.
          </div>
          {rows.length === 0 ? (
            <div style={{ padding: '14px 10px', fontSize: 12, color: '#9aa5a0' }}>
              Nothing logged yet. Costs, prices, receipts, and publishes will show up here as they change.
            </div>
          ) : (
            rows.map((e, i) => <Row key={(e.at || '') + i} e={e} />)
          )}
        </div>
      )}
    </div>
  );
}
