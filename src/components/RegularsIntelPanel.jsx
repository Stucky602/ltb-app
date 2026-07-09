import React, { useState, useMemo } from 'react';
import { attachRates, usualOrder } from '../regularsIntel.js';
import { regularDisplayName, regularAllNames, regularNames, regularMatchType } from '../utils.js';
const C = { panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0', faint: '#6b7570', good: '#5DCAA5', warn: '#EF9F27', bad: '#e0828a' };
const S = {
  section: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, margin: '10px 14px' },
  title: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.dim, margin: 0 },
  row: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', fontSize: 12.5, borderBottom: `1px solid ${C.border}`, color: C.text },
  btn: { padding: '7px 12px', borderRadius: 7, border: `1px solid ${C.border}`, background: '#232d2a', color: C.good, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  select: { width: '100%', margin: '6px 0', padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#232d2a', color: C.text, fontSize: 13 },
};

// Customer intel + the regulars maintenance tools (merge, backfill).
// Merge is NON-DESTRUCTIVE: the source's names become the target's aliases,
// original order records are never rewritten, and every merge is reversible.
export function RegularsIntelPanel({ orders, regulars, weekDishes, onMerge, onUnmerge, onUpdateRegular, onBackfill, onLinkSuggestion }) {
  const [who, setWho] = useState('');
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [backfillResult, setBackfillResult] = useState(null);
  const [confirmMerge, setConfirmMerge] = useState(false);

  // If the picked order-name belongs to a regular, query with their WHOLE
  // identity (names + merge aliases) — merges pay off in the intel too.
  const whoNames = useMemo(() => {
    if (!who) return null;
    // The dropdown shows regular DISPLAY names for merged people, so match on
    // display name first, then fall back to name/alias matching.
    const reg = (regulars || []).find(r => regularDisplayName(r) === who)
      || (regulars || []).find(r => regularMatchType(r, who) === 'exact');
    return reg ? regularAllNames(reg) : who;
  }, [who, regulars]);
  const rates = useMemo(() => whoNames ? attachRates(orders || [], whoNames).slice(0, 8) : [], [orders, whoNames]);
  const usual = useMemo(() => whoNames ? usualOrder(orders || [], whoNames) : [], [orders, whoNames]);
  // Dropdown identities: one entry per PERSON, not per order-name string. A
  // name that is an alias of a merged regular collapses under that regular's
  // display name, so "Jessica" and "Jessica Gardner" show as one entry after
  // a merge. Names not tied to any regular show as themselves.
  const names = useMemo(() => {
    const claimed = new Map(); // lowercased order-name -> regular display name
    for (const r of (regulars || [])) {
      const disp = regularDisplayName(r);
      for (const nm of regularAllNames(r)) claimed.set(String(nm).toLowerCase(), disp);
    }
    const s = new Set();
    (orders || []).forEach(o => {
      const raw = o.customer || o.name;
      if (!raw) return;
      s.add(claimed.get(String(raw).toLowerCase()) || raw);
    });
    return [...s].sort();
  }, [orders, regulars]);
  // Week-gated nudges: dishes this customer orders whenever offered, ON the menu now.
  const week = useMemo(() => new Set(weekDishes || []), [weekDishes]);
  const nudges = useMemo(() => rates.filter(r => week.has(r.dish) && r.appearances >= 2 && r.attachPct >= 60), [rates, week]);

  const regList = regulars || [];
  const doMerge = () => {
    if (!mergeTarget || !mergeSource || mergeTarget === mergeSource) return;
    onMerge && onMerge(mergeTarget, mergeSource);
    setMergeSource(''); setMergeTarget(''); setConfirmMerge(false);
  };

  return (
    <>
      <div style={S.section}>
        <div style={S.title}>Customer intel</div>
        <select value={who} onChange={e => setWho(e.target.value)} style={S.select}>
          <option value="">Pick a customer…</option>
          {names.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {who && nudges.length > 0 && (
          <div style={{ background: 'rgba(93,202,165,0.10)', border: '1px solid #28483d', borderRadius: 8, padding: '7px 10px', margin: '4px 0 8px', fontSize: 12, color: C.good }}>
            {nudges.map(n => `${who.split(' ')[0]} orders ${n.dish} whenever it's on the menu (${n.ordered}/${n.appearances}). It's on this week.`).join(' ')}
          </div>
        )}
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

      <div style={S.section}>
        <div style={S.title}>Merge duplicate regulars</div>
        <div style={{ fontSize: 11.5, color: C.faint, margin: '6px 0' }}>
          Folds one regular into another. Their names become the keeper's aliases, their orders re-link, and it's reversible. Never automatic. It could really be two different Jessicas, so you decide.
        </div>
        <select value={mergeSource} onChange={e => { setMergeSource(e.target.value); setConfirmMerge(false); }} style={S.select}>
          <option value="">Fold this one…</option>
          {regList.map(r => <option key={r.id} value={r.id}>{regularDisplayName(r)}</option>)}
        </select>
        <select value={mergeTarget} onChange={e => { setMergeTarget(e.target.value); setConfirmMerge(false); }} style={S.select}>
          <option value="">…into this one</option>
          {regList.filter(r => r.id !== mergeSource).map(r => <option key={r.id} value={r.id}>{regularDisplayName(r)}</option>)}
        </select>
        {mergeSource && mergeTarget && !confirmMerge && (
          <button style={S.btn} onClick={() => setConfirmMerge(true)}>Review merge</button>
        )}
        {confirmMerge && (
          <div style={{ fontSize: 12, color: C.warn, margin: '6px 0' }}>
            "{regularDisplayName(regList.find(r => r.id === mergeSource))}" folds into "{regularDisplayName(regList.find(r => r.id === mergeTarget))}". Reversible from the keeper's card below.{' '}
            <button style={{ ...S.btn, borderColor: C.warn, color: C.warn, marginLeft: 6 }} onClick={doMerge}>Merge</button>
          </div>
        )}
        {/* Merged-alias visibility + unmerge, per regular */}
        {regList.filter(r => (r.aliases && r.aliases.length) || (r.mergedFrom && r.mergedFrom.length)).map(r => (
          <div key={r.id} style={{ ...S.row, display: 'block' }}>
            <span style={{ fontWeight: 700 }}>{regularDisplayName(r)}</span>
            {r.aliases && r.aliases.length > 0 && (
              <span style={{ color: C.dim }}> — also answers to: {r.aliases.join(', ')}</span>
            )}
            {(r.mergedFrom || []).map(m => (
              <button key={m.snapshot.id} style={{ ...S.btn, padding: '2px 8px', fontSize: 10.5, marginLeft: 8, color: C.dim }}
                onClick={() => onUnmerge && onUnmerge(r.id, m.snapshot.id)}>
                Unmerge {regularNames(m.snapshot)[0] || 'merged profile'}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div style={S.section}>
        <div style={S.title}>Backfill order history</div>
        <div style={{ fontSize: 11.5, color: C.faint, margin: '6px 0' }}>
          Links orders from before the regulars system to their people. Exact name and alias matches link automatically; close-but-not-exact names are listed for you to decide.
        </div>
        <button style={S.btn} onClick={() => setBackfillResult(onBackfill ? onBackfill() : null)}>Run backfill</button>
        {backfillResult && (
          <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>
            Linked {backfillResult.autoCount} order{backfillResult.autoCount !== 1 ? 's' : ''} automatically.
            {backfillResult.suggestions.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 6 }}>
                  {backfillResult.suggestions.length} order{backfillResult.suggestions.length !== 1 ? 's' : ''} are a close-but-not-exact name match. Link each to the right person, or leave it:
                </div>
                {backfillResult.suggestions.map(sg => (
                  <div key={sg.orderId} style={{ padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ color: C.text, fontWeight: 700, marginBottom: 3 }}>"{sg.name}"</div>
                    {sg.candidates.map(cand => (
                      <button key={cand.id}
                        style={{ ...S.btn, padding: '3px 9px', fontSize: 11.5, marginRight: 5, marginBottom: 4 }}
                        onClick={() => {
                          onLinkSuggestion && onLinkSuggestion(sg.orderId, cand.id);
                          // Drop this suggestion from the list once handled.
                          setBackfillResult(prev => prev ? { ...prev, suggestions: prev.suggestions.filter(x => x.orderId !== sg.orderId) } : prev);
                        }}>
                        Link to {cand.display}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
