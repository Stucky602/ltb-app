// PendingOrders.jsx — the queue of customer form submissions waiting to be
// accepted or rejected, and the expanded card for whichever one is open.
//
// THE MARGIN LINE IS THE POINT OF THIS SCREEN. Accept is the last moment a
// money mistake is cheap, and before that line existed it was a blind tap.
// Omakase items carry cost 0 until Kevin logs what actually went into them, so
// they are held OUT of the margin rather than flattering it, and the card says
// so in as many words instead of quietly excluding them.
//
// Two states on purpose: a compact row per submission, and at most one
// expanded card. Accepting mints an order and draws down inventory, so it sits
// behind the expansion rather than on a row where a scroll-tap could reach it.
//
// The AI note parse is opt-in per submission and its result is held by the
// caller, so re-expanding a card does not re-spend a call on notes already
// interpreted.

import React from 'react';
import { Check, X, ChevronDown } from '../icons.jsx';
import { currency, optionsSummary, noteWithoutOptions, itemAddons, parseFormNotes } from '../utils.js';
import { GOLD, TEAL_LIGHT, styles } from '../styles.js';

export function PendingOrders({
  pendingOrders, showPendingIdx, setShowPendingIdx,
  parsedNotes, setParsedNotes, parsingNotes, setParsingNotes,
  onAccept, onDismiss,
}) {
  return (
    <div style={styles.pendingSection}>
      <div style={styles.pendingSectionHeader}>
        <span style={styles.pendingBadge}>{pendingOrders.length}</span>
        <span style={styles.pendingSectionTitle}>Pending form order{pendingOrders.length !== 1 ? 's' : ''}</span>
      </div>
      {pendingOrders.map((p, idx) => (
        showPendingIdx === idx ? (
          <div key={p.pendingId} style={styles.pendingCard}>
            <div style={styles.pendingCardHeader}>
              <div style={styles.pendingCardName}>{p.customer}</div>
              <div style={styles.pendingCardTime}>{p.timestamp}</div>
              {(p.address || p.phone) && (
                <div style={styles.pendingContactRow}>
                  {p.address && <span style={styles.pendingContact}>📍 {p.address}</span>}
                  {p.phone && <span style={styles.pendingContact}>📞 {p.phone}</span>}
                </div>
              )}
            </div>
            <div style={styles.pendingItemList}>
              {p.items.map((it, i) => (
                <div key={i} style={styles.pendingItem}>
                  <span style={styles.pendingItemName}>{it.name}</span>
                  {it.variant && <span style={styles.pendingItemVariant}> — {it.variant}</span>}
                  <span style={styles.pendingItemPrice}> ${it.price.toFixed(2)}</span>
                  {optionsSummary(it) && <span style={{ ...styles.pendingItemVariant, color: TEAL_LIGHT, fontWeight: 700 }}> · {optionsSummary(it)}</span>}
                  {noteWithoutOptions(it.note) && <span style={styles.pendingItemVariant}> · “{noteWithoutOptions(it.note)}”</span>}
                  {itemAddons(it).map((a, ai) => (
                    <div key={ai} style={{ ...styles.pendingItemVariant, display: 'block', marginLeft: 10, color: GOLD }}>
                      + {a.request} <span style={{ fontStyle: 'italic', opacity: 0.85 }}>(at cost, price pending)</span>
                    </div>
                  ))}
                </div>
              ))}
              {(() => {
                // Accept is the last moment a money mistake is cheap,
                // and it was blind. Omakase carries cost 0 until it is
                // logged, so it is held out of the margin rather than
                // flattering it.
                const items = p.items || [];
                const priced = items.filter(it => !it.omakase);
                const hasOma = items.some(it => it.omakase);
                const rev = items.reduce((n, it) => n + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
                const pRev = priced.reduce((n, it) => n + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
                const pCost = priced.reduce((n, it) => n + (Number(it.cost) || 0) * (Number(it.qty) || 1), 0);
                const pct = pRev > 0 ? Math.round((1 - pCost / pRev) * 100) : null;
                if (!items.length) return null;
                return (
                  <div style={{ fontSize: 11.5, color: '#9aa5a0', marginTop: 6, paddingTop: 6, borderTop: '1px solid #2a332f' }}>
                    Revenue {currency(rev)} · est. cost {currency(pCost)}
                    {pct != null ? ` · ~${pct}% margin` : ''}
                    {hasOma ? ' · omakase cost TBD, not counted' : ''}
                  </div>
                );
              })()}
              {p.notes && (
                <div style={styles.pendingNotesSection}>
                  <div style={styles.pendingNotes}>Notes: {p.notes}</div>
                  {parsedNotes[p.pendingId] ? (
                    <div style={styles.parsedNotesCard}>
                      <div style={styles.parsedNotesTitle}>AI interpretation</div>
                      {parsedNotes[p.pendingId].summary && (
                        <div style={styles.parsedNotesSummary}>{parsedNotes[p.pendingId].summary}</div>
                      )}
                      {['spice','substitutions','extras','delivery','other'].map(k =>
                        parsedNotes[p.pendingId][k] ? (
                          <div key={k} style={styles.parsedNotesItem}>
                            <span style={styles.parsedNotesKey}>{k}:</span> {parsedNotes[p.pendingId][k]}
                          </div>
                        ) : null
                      )}
                    </div>
                  ) : (
                    <button
                      style={styles.parseNotesBtn}
                      disabled={parsingNotes === p.pendingId}
                      onClick={async () => {
                        setParsingNotes(p.pendingId);
                        const result = await parseFormNotes(p.notes);
                        if (result) setParsedNotes(prev => ({ ...prev, [p.pendingId]: result }));
                        setParsingNotes(null);
                      }}
                    >
                      {parsingNotes === p.pendingId ? 'Parsing...' : 'Parse notes with AI'}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div style={styles.pendingActions}>
              <button style={styles.pendingAcceptBtn} onClick={() => onAccept(p)}>
                <Check size={16} /> Accept
              </button>
              <button style={styles.pendingRejectBtn} onClick={() => onDismiss(p.pendingId)}>
                <X size={16} /> Reject
              </button>
              <button style={styles.pendingBackBtn} onClick={() => setShowPendingIdx(null)}>
                Back
              </button>
            </div>
          </div>
        ) : (
          <button key={p.pendingId} style={styles.pendingRow} onClick={() => setShowPendingIdx(idx)}>
            <span style={styles.pendingRowName}>{p.customer}</span>
            <span style={styles.pendingRowCount}>{p.items.length} item{p.items.length !== 1 ? 's' : ''}</span>
            <ChevronDown size={16} />
          </button>
        )
      ))}
    </div>
  );
}
