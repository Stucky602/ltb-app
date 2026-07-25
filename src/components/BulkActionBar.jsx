// BulkActionBar.jsx — the strip that appears in select mode.
//
// EVERY BUTTON NAMES ITS OWN COUNT, on purpose. A bulk action that does not
// say how many rows it will touch is a bulk action you check twice, and the
// number shown here is the number that actually changes: house orders are
// excluded at the selection layer above rather than silently skipped here, so
// the count on the button can never overstate the work.
//
// Both actions are disabled at zero rather than hidden, so the bar does not
// reflow out from under a thumb already moving toward it.

import React from 'react';
import { GOLD } from '../styles.js';

export function BulkActionBar({ selectedCount, selectableCount, onSelectAll, onClear, onMarkPaid, onArchive }) {
  return (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(212,160,80,0.08)', border: '1px solid #D4A050', borderRadius: 10, padding: '8px 10px', marginBottom: 10 }}>
    <span style={{ fontSize: 12.5, color: '#e8ede9', fontWeight: 700 }}>
      {selectedCount} selected
    </span>
    <button
      onClick={onSelectAll}
      style={{ minHeight: 36, padding: '6px 10px', borderRadius: 7, border: '1px solid #37403c', background: 'transparent', color: '#9aa5a0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
    >
      Select all {selectableCount} shown
    </button>
    {selectedCount > 0 && (
      <button
        onClick={onClear}
        style={{ minHeight: 36, padding: '6px 10px', borderRadius: 7, border: '1px solid #37403c', background: 'transparent', color: '#9aa5a0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
      >
        Clear
      </button>
    )}
    <span style={{ flex: 1 }} />
    <button
      disabled={selectedCount === 0}
      onClick={onMarkPaid}
      style={{ minHeight: 44, padding: '9px 14px', borderRadius: 8, border: 'none', background: selectedCount ? '#2f6f57' : '#232d2a', color: selectedCount ? '#fff' : '#5a635f', fontWeight: 700, fontSize: 12.5, cursor: selectedCount ? 'pointer' : 'default' }}
    >
      Mark {selectedCount || ''} paid
    </button>
    <button
      disabled={selectedCount === 0}
      onClick={onArchive}
      style={{ minHeight: 44, padding: '9px 14px', borderRadius: 8, border: `1px solid ${selectedCount ? '#37403c' : '#232d2a'}`, background: 'transparent', color: selectedCount ? '#9aa5a0' : '#5a635f', fontWeight: 700, fontSize: 12.5, cursor: selectedCount ? 'pointer' : 'default' }}
    >
      Archive {selectedCount || ''}
    </button>
  </div>
  );
}
