// BackupModal.jsx — the Backup & Restore sheet.
//
// Moved out of the tail of App.jsx unchanged. It was already a module-scope
// component taking nothing but props, so it never belonged in the same file as
// the app: it was sitting below the default export purely because that is where
// it got written. Its two helpers (relativeAge, resolveRestoreOptions) moved to
// backupRestore.js alongside the rest of the restore machinery.
//
// The three-state `list` prop is the whole reason this file reads carefully:
// null means still checking, the string 'error' means the ring is unreachable,
// and an empty array means the ring is reachable and genuinely empty. Those are
// three different sentences to a person deciding whether their data is safe,
// and collapsing any two of them into "no backups" would be a lie at the worst
// possible moment.

import React from 'react';
import { formatDate } from '../utils.js';
import { relativeAge, resolveRestoreOptions } from '../backupRestore.js';

export function BackupModal({ list, onRestore, onRestoreFile, onDownloadFile, onCopy, onClose }) {
  const m = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    box: { background: '#1c2422', border: '1px solid #2d3a36', borderRadius: 12, padding: 18, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', color: '#e8e6df' },
    h: { margin: '0 0 4px', fontSize: 17, fontWeight: 700 },
    sub: { margin: '0 0 14px', fontSize: 12.5, color: '#9aa5a0', lineHeight: 1.45 },
    section: { fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#9aa5a0', margin: '16px 0 8px' },
    opt: { display: 'block', width: '100%', textAlign: 'left', background: '#232d2a', border: '1px solid #2d3a36', borderRadius: 10, padding: '10px 12px', marginBottom: 8, color: '#e8e6df', cursor: 'pointer' },
    optTitle: { fontSize: 14.5, fontWeight: 600 },
    optMeta: { fontSize: 12, color: '#9aa5a0', marginTop: 2 },
    row: { display: 'flex', gap: 8 },
    smallBtn: { flex: 1, background: '#232d2a', border: '1px solid #2d3a36', borderRadius: 10, padding: '10px 8px', color: '#e8e6df', fontSize: 13.5, cursor: 'pointer' },
    close: { display: 'block', width: '100%', marginTop: 14, background: 'none', border: 'none', color: '#9aa5a0', fontSize: 14, padding: 8, cursor: 'pointer' },
    note: { fontSize: 12, color: '#9aa5a0', lineHeight: 1.45 },
    fileLabel: { display: 'block', width: '100%', textAlign: 'center', background: '#232d2a', border: '1px solid #2d3a36', borderRadius: 10, padding: '10px 8px', color: '#e8e6df', fontSize: 13.5, cursor: 'pointer', boxSizing: 'border-box' },
  };
  const options = Array.isArray(list) ? resolveRestoreOptions(list) : [];
  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.box} onClick={e => e.stopPropagation()}>
        <h3 style={m.h}>Backup &amp; Restore</h3>
        <p style={m.sub}>The app backs itself up online automatically while it's open. Restoring replaces what's on this device.</p>

        <div style={m.section}>Restore from online</div>
        {list === null && <div style={m.note}>Checking for backups…</div>}
        {list === 'error' && <div style={m.note}>Couldn't reach the backup server. You can still restore from a file below.</div>}
        {Array.isArray(list) && options.length === 0 && <div style={m.note}>No online backups yet. They'll start appearing after the app has been open with data in it.</div>}
        {options.map(o => (
          <button key={o.age} style={m.opt} onClick={() => onRestore(o.age)}>
            <div style={m.optTitle}>{o.label}</div>
            <div style={m.optMeta}>
              {relativeAge(o.timestamp)} · {formatDate(o.timestamp)}
              {o.orders != null ? ` · ${o.orders} orders` : ''}
            </div>
          </button>
        ))}

        <div style={m.section}>Restore from file</div>
        <label style={m.fileLabel}>
          Choose a backup file…
          <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onRestoreFile} />
        </label>

        <div style={m.section}>Save a copy</div>
        <div style={m.row}>
          <button style={m.smallBtn} onClick={onDownloadFile}>Download file</button>
          <button style={m.smallBtn} onClick={onCopy}>Copy to clipboard</button>
        </div>

        <button style={m.close} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
