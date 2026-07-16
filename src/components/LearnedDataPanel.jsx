import React, { useState, useMemo } from 'react';
import { Trash2 } from '../icons.jsx';
import { summarizeLearnedData, learnedDataStats, deleteLearnedEntry, ORIGIN } from '../learnedData.js';

// LearnedDataPanel — what the scanner thinks it knows, and a way to unlearn it.
//
// Deliberately plain, same reasoning as AuditPanel: this is a diagnostic you
// open when a cost looks wrong, not a dashboard you browse. A searchable list
// with a delete button per row is the whole ask.
//
// The distinction from the Change log is worth keeping straight. The audit log
// records EVENTS ("this cost moved, on this date, because of this receipt").
// This records BELIEFS ("the app now thinks GRAZA X VRGN means cooking olive
// oil, and that one pack holds 25.4 of them"). A belief has no timestamp and
// never appears in an event log, which is precisely why a wrong one could hide
// forever.
//
// Delete is the only operation offered. Remapping is available where Kevin
// already does it — in the scan flow, with the receipt line in front of him and
// the ingredient picker one tap away. Rebuilding that picker here would be a
// second place to do the same job, and the two would drift. Delete is the thing
// that had NO home: nothing in the scan flow removes an alias, it only refines
// one, and refining a mapping that points at the wrong ingredient just makes it
// more confidently wrong.

const ORIGIN_LABEL = {
  [ORIGIN.SEEDED]: 'seeded',
  [ORIGIN.LEARNED]: 'learned',
  [ORIGIN.IGNORED]: 'ignored',
};

const ORIGIN_COLOR = {
  [ORIGIN.SEEDED]: '#9aa5a0',   // hand-written, least suspect
  [ORIGIN.LEARNED]: '#5DCAA5',  // the app taught itself this
  [ORIGIN.IGNORED]: '#EF9F27',  // the app decided to stop asking
};

function Row({ row, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const color = ORIGIN_COLOR[row.origin] || '#9aa5a0';

  // The facts worth showing, in the order they'd answer "why is this wrong?"
  const facts = [];
  if (row.packQty != null) {
    facts.push(`1 pack = ${row.packQty} ${row.unit || 'unit'}${row.packQty === 1 ? '' : 's'}${row.packObs > 1 ? ` (${row.packObs} scans)` : ''}`);
  }
  if (row.habitualStore) facts.push(`usually ${row.habitualStore}`);
  if (row.soldByEach) facts.push('sold by the each');
  if (row.pricing === 'FLAT') facts.push('flat price');
  if (row.confirms > 0) facts.push(`${row.confirms} confirm${row.confirms === 1 ? '' : 's'}`);
  if (row.rejected.length) facts.push(`rejected: ${row.rejected.join(', ')}`);
  if (row.seenUnmatched > 0 && !row.ingredientId) facts.push(`skipped ${row.seenUnmatched}x`);

  return (
    <div style={{
      padding: '9px 10px',
      borderBottom: '1px solid #2d3a36',
      fontSize: 12,
      lineHeight: 1.45,
      background: row.orphaned ? '#3a2420' : 'transparent',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
        <span style={{ color, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', flexShrink: 0, width: 54 }}>
          {ORIGIN_LABEL[row.origin] || row.origin}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          {/* The raw receipt string is the primary key and the thing Kevin
              recognizes from the paper in his hand. It leads. */}
          <span style={{ color: '#F5F0E8', fontFamily: 'ui-monospace, monospace', fontSize: 11.5 }}>{row.norm}</span>
          <br />
          <span style={{ color: '#5F5E5A' }}>→ </span>
          <span style={{ color: row.orphaned ? '#EF9F27' : '#9aa5a0' }}>
            {row.ingredientName || (row.ignored ? 'never ask about this line' : '—')}
          </span>
          {facts.length > 0 && (
            <div style={{ color: '#5F5E5A', fontSize: 11, marginTop: 2 }}>{facts.join('  ·  ')}</div>
          )}
          {row.orphaned && (
            <div style={{ color: '#EF9F27', fontSize: 11, marginTop: 3 }}>
              This ingredient no longer exists, so this line costs $0 every time it scans. Delete it.
            </div>
          )}
        </span>
        {confirming ? (
          <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => { onDelete(row.norm); setConfirming(false); }}
              style={{ background: '#993556', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', cursor: 'pointer' }}
            >
              Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{ background: 'transparent', border: '1px solid #3a4744', borderRadius: 6, color: '#9aa5a0', fontSize: 11, padding: '4px 8px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            title="Forget this"
            style={{ background: 'transparent', border: 'none', color: '#5F5E5A', cursor: 'pointer', flexShrink: 0, padding: 2 }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export function LearnedDataPanel({ aliases, ingredients, onSave }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => summarizeLearnedData(aliases, ingredients), [aliases, ingredients]);
  const stats = useMemo(() => learnedDataStats(rows), [rows]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.norm.includes(q) ||
      (r.ingredientName || '').toLowerCase().includes(q) ||
      (r.ingredientId || '').includes(q)
    );
  }, [rows, search]);

  const handleDelete = (norm) => onSave(deleteLearnedEntry(aliases, norm));

  return (
    <div style={{ marginTop: 10 }}>
      <button
        style={{
          width: '100%', background: '#222826', border: '1px solid #2d3a36', borderRadius: 8,
          color: stats.orphaned > 0 ? '#EF9F27' : '#9aa5a0', fontSize: 12, padding: '8px 10px',
          cursor: 'pointer', textAlign: 'left', font: 'inherit',
        }}
        onClick={() => setOpen(v => !v)}
      >
        {open ? 'Hide what the scanner learned' : `What the scanner learned (${stats.total})`}
        {stats.orphaned > 0 && ` — ${stats.orphaned} broken`}
      </button>

      {open && (
        <div style={{ marginTop: 8, background: '#222826', borderRadius: 8, border: '1px solid #2d3a36', overflow: 'hidden' }}>
          <div style={{ padding: '8px 10px', fontSize: 11, color: '#5F5E5A', borderBottom: '1px solid #2d3a36' }}>
            Every receipt string the scanner has mapped, plus what it worked out about pack sizes and stores.
            {stats.learned > 0 && ` ${stats.learned} learned from your scans, ${stats.seeded} shipped with the app.`}
            {stats.ignored > 0 && ` ${stats.ignored} it no longer asks about.`}
            {' '}Deleting an entry makes it ask again next time.
          </div>

          <div style={{ padding: '8px 10px', borderBottom: '1px solid #2d3a36' }}>
            <input
              placeholder="Search receipt text or ingredient…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', background: '#1a1f1e', border: '1px solid #2d3a36', borderRadius: 6,
                color: '#F5F0E8', fontSize: 12, padding: '6px 8px', font: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          {shown.length === 0 ? (
            <div style={{ padding: '14px 10px', fontSize: 12, color: '#9aa5a0' }}>
              {rows.length === 0
                ? 'Nothing learned yet. Scan a receipt and the mappings will show up here.'
                : 'No matches.'}
            </div>
          ) : (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {shown.map(r => <Row key={r.norm} row={r} onDelete={handleDelete} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
