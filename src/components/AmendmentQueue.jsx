// src/components/AmendmentQueue.jsx — Kevin's accept/reject surface.
//
// Sits with the pending-order queue because it is the same kind of decision:
// something arrived from a customer and it needs a yes or a no before it counts.
//
// THE DIVISION OF LABOUR, which is the only structural thing worth knowing:
//   worker   stores the request and the recorded decision
//   this UI  shows what accepting would do, and asks
//   App.jsx  applies the patch to the order — ONE writer, one commit
//
// The worker never touches an order. That is why accepting is safe to retry:
// applyPatch is pure, acceptAmendment refuses a non-pending record, and the
// order only ever changes through the app's existing save path.
//
// The sentences shown here come from describePatch, the SAME function the
// customer page uses. A request that reads one way to the person asking and
// another way to the person deciding is how a misunderstanding gets approved.

import React, { useState } from 'react';
import { describePatch, priceDelta } from '../amendments.js';

const C = {
  panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0',
  gold: '#D4A050', good: '#5DCAA5', bad: '#e0828a',
};

export function AmendmentQueue({ amendments, orders, offered, onAccept, onReject, styles }) {
  const [reasonFor, setReasonFor] = useState(null);
  const [reason, setReason] = useState('');

  const pending = (amendments || []).filter(a => a.status === 'pending');
  if (!pending.length) return null;

  return (
    <div style={styles?.pendingSection}>
      <div style={styles?.pendingSectionHeader}>
        <span style={{ ...(styles?.pendingBadge || {}), background: C.gold, color: '#1a1a1a' }}>{pending.length}</span>
        <span>Change {pending.length === 1 ? 'request' : 'requests'}</span>
      </div>

      {pending.map(amd => {
        const order = (orders || []).find(o => o.id === amd.orderId) || null;
        const lines = describePatch(amd.requestedPatch, { offered });
        const money = order ? priceDelta(order, amd.requestedPatch, offered) : null;
        const asking = reasonFor === amd.id;

        return (
          <div key={amd.id} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 10, background: C.panel }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                {order ? order.customer : 'Unknown order'}
              </span>
              <span style={{ fontSize: 11, color: C.dim }}>
                {new Date(amd.submittedAt).toLocaleString()}
              </span>
            </div>

            {/* The order this touches. Without it the diff is unreadable —
                "change to 3" means nothing if you cannot see it was 1. */}
            {order && (
              <div style={{ fontSize: 12, color: C.dim, marginBottom: 8, lineHeight: 1.5 }}>
                {(order.items || []).map((it, i) => (
                  <div key={i}>{it.qty} × {it.name}{it.variant ? ` (${it.variant})` : ''}</div>
                ))}
              </div>
            )}

            <div style={{ borderLeft: `3px solid ${C.gold}`, paddingLeft: 10, marginBottom: 8 }}>
              {lines.map((l, i) => (
                <div key={i} style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{l}</div>
              ))}
            </div>

            {amd.customerNote && (
              <div style={{ fontSize: 12, color: C.dim, fontStyle: 'italic', marginBottom: 8 }}>
                “{amd.customerNote}”
              </div>
            )}

            {money && (
              <div style={{ fontSize: 12, color: C.dim, marginBottom: 10 }}>
                ${money.before} → <b style={{ color: money.delta >= 0 ? C.good : C.bad }}>${money.after}</b>
                {money.delta !== 0 && ` (${money.delta > 0 ? '+' : ''}$${money.delta})`}
                {/* An item that has left the menu since the order was placed.
                    Surfaced rather than swallowed, because the total is wrong
                    without it and a silently wrong total is worse than none. */}
                {money.unpriced.length > 0 && (
                  <div style={{ color: C.bad, marginTop: 4 }}>
                    Not on this week’s menu, so not priced: {money.unpriced.join(', ')}
                  </div>
                )}
              </div>
            )}

            {!order && (
              <div style={{ fontSize: 12, color: C.bad, marginBottom: 10 }}>
                This request names an order that is no longer here. Accepting would do nothing.
              </div>
            )}

            {asking ? (
              <div>
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Why not? (optional, the customer sees this)"
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6, marginBottom: 8,
                    border: `1px solid ${C.border}`, background: '#151d1b', color: C.text, fontSize: 13,
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { onReject(amd, reason); setReasonFor(null); setReason(''); }}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.bad}`, background: 'transparent', color: C.bad, fontSize: 13, cursor: 'pointer' }}
                  >Send rejection</button>
                  <button
                    onClick={() => { setReasonFor(null); setReason(''); }}
                    style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, fontSize: 13, cursor: 'pointer' }}
                  >Back</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onAccept(amd)}
                  disabled={!order}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 13,
                    border: `1px solid ${order ? C.good : C.border}`, background: 'transparent',
                    color: order ? C.good : C.dim, cursor: order ? 'pointer' : 'not-allowed',
                  }}
                >Accept</button>
                <button
                  onClick={() => setReasonFor(amd.id)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, fontSize: 13, cursor: 'pointer' }}
                >Reject</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
