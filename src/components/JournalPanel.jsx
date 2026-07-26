import React, { useState, useMemo } from 'react';
import {
  JOURNAL_TYPES, JOURNAL_TYPE_ORDER, addEntry, removeEntry,
  entriesForDish, canBeTransferable, supersededIds, staleByRevision,
} from '../journal.js';
import { DISH_RENAMES } from '../utils.js';

// The dossier (K1–K8 capture UI). Owner-side ONLY — this component and
// journal.js must never be reachable from a customer surface; the privacy
// wall in tests/journal.mjs enforces the import side of that.
// House panel pattern (see DigestPanel): local palette, no styles.js coupling.
const C = { panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0', faint: '#6b7570', good: '#5DCAA5', warn: '#EF9F27', gold: '#D4A050', bad: '#e0828a' };
const S = {
  section: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, margin: '10px 0' },
  title: { fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  chip: (on) => ({ padding: '4px 10px', borderRadius: 12, border: `1px solid ${on ? C.good : C.border}`, background: on ? 'rgba(93,202,165,0.15)' : 'transparent', color: on ? C.good : C.dim, fontSize: 11, fontWeight: 700, cursor: 'pointer' }),
  entry: { borderTop: `1px solid ${C.border}`, padding: '8px 0' },
  meta: { fontSize: 10.5, color: C.faint, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  text: { fontSize: 13, color: C.text, lineHeight: 1.55, margin: '3px 0 0', whiteSpace: 'pre-wrap' },
  input: { width: '100%', minHeight: 70, background: '#14201d', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: 9, boxSizing: 'border-box', fontFamily: 'inherit' },
  // Kitchen hands: 44px is the floor for anything tapped mid-cook (P2 rule).
  saveBtn: { marginTop: 8, minHeight: 44, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2f6f57', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  delBtn: { background: 'transparent', border: 'none', color: C.faint, fontSize: 10.5, cursor: 'pointer', padding: '2px 4px' },
  lockRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: C.dim, cursor: 'pointer', userSelect: 'none' },
};

const fmtDate = (ts) => { try { return new Date(ts).toLocaleDateString(); } catch { return ''; } };

function Entry({ e, onDelete, isSuperseded, isStale }) {
  const [confirm, setConfirm] = useState(false);
  const t = JOURNAL_TYPES[e.type] || { label: e.type };
  if (e.type === 'revision') {
    // A divider, not an entry. Everything on the older side of it describes a
    // dish that no longer exists in that form.
    return (
      <div style={{ borderTop: `2px solid ${C.gold}`, margin: '14px 0 8px', paddingTop: 6 }}>
        <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Recipe changed · {e.undated ? 'undated' : fmtDate(e.ts)}
        </div>
        <div style={{ ...S.text, color: C.dim }}>{e.text}</div>
      </div>
    );
  }
  return (
    <div style={S.entry}>
      <div style={S.meta}>
        <span style={{ color: e.type === 'retirement' ? C.bad : e.type === 'price' || e.type === 'decision' ? C.gold : C.good, fontWeight: 700 }}>{t.label}</span>
        <span>{e.undated ? 'undated' : fmtDate(e.ts)}</span>
        {e.private && <span style={{ color: C.gold }}>🔒 private</span>}
        {/* Attribution rides ON the entry rather than in the body text. An
            unattributed validation is just a compliment, and a reader in twenty
            years has no way to recover who said it. */}
        {e.type === 'validation' && e.by && <span style={{ color: C.gold, fontWeight: 700 }}>— {e.by}</span>}
        {e.transferable && <span style={{ color: C.good, fontWeight: 700 }}>↗ holds beyond this dish</span>}
        {e.confidence === 'firm' && <span style={{ color: C.good }}>firm</span>}
        {e.confidence === 'working' && <span style={{ color: C.dim }}>working idea</span>}
        {isSuperseded && <span style={{ color: C.warn, fontWeight: 700 }}>replaced by a later note</span>}
        {isStale && <span style={{ color: C.warn }}>describes an older version</span>}
        {e.migrated && <span>migrated cook note</span>}
        <span style={{ flex: 1 }} />
        {confirm
          ? (<>
              <button style={{ ...S.delBtn, color: C.bad, fontWeight: 700 }} onClick={() => onDelete(e.id)}>delete</button>
              <button style={S.delBtn} onClick={() => setConfirm(false)}>keep</button>
            </>)
          : <button style={S.delBtn} onClick={() => setConfirm(true)}>×</button>}
      </div>
      <div style={S.text}>{e.text}</div>
    </div>
  );
}

// dish: the currently selected dish ('' = none → general view only)
export function JournalPanel({ dish, journal, onSaveJournal }) {
  const [type, setType] = useState('technique');
  const [text, setText] = useState('');
  const [priv, setPriv] = useState(JOURNAL_TYPES.technique.privateDefault);
  // The transferable flag. Off by default — most of what gets written is
  // about THIS dish, and a flag that is usually on carries no information.
  const [transferable, setTransferable] = useState(false);
  // Two states only. A scale invites agonising over 3 vs 4 and tells a reader
  // nothing extra; unmarked is a real third answer and stays the default.
  const [confidence, setConfidence] = useState(null);
  // Which existing entry this one replaces, if any.
  const [supersedes, setSupersedes] = useState('');
  const [typeTouchedPriv, setTypeTouchedPriv] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  // The arc: read oldest-first and a dossier stops being a feed and becomes
  // the story of how the dish changed. This is the single most teaching-shaped
  // read of the pool, and it costs a sort order.
  const [arc, setArc] = useState(false);

  // Per-dish only. The business-wide scope was removed (Kevin, Jul 24): it
  // cluttered every recipe with a view that had nothing to do with the dish on
  // screen. Business-level entries already in the journal are preserved on
  // disk and still ride the backup and the archive — they simply have no
  // editor here. Nothing was deleted.
  const superseded = useMemo(() => supersededIds(journal), [journal]);
  const staleIds = useMemo(() => (dish ? staleByRevision(journal, dish, DISH_RENAMES) : new Set()), [journal, dish]);

  const entries = useMemo(() => {
    if (!dish) return [];
    const list = [...entriesForDish(journal, dish, DISH_RENAMES)];
    return arc
      ? list.sort((a, b) => String(a.ts).localeCompare(String(b.ts)))
      : list.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  }, [journal, dish, arc]);


  const pickType = (t) => {
    setType(t);
    if (!canBeTransferable(t)) setTransferable(false);
    // Follow the type's privacy default until Kevin touches the lock himself;
    // after that his choice sticks for this draft.
    if (!typeTouchedPriv) setPriv(JOURNAL_TYPES[t].privateDefault);
  };

  const save = () => {
    if (!text.trim()) return;
    if (!dish) return;
    const subject = { kind: 'dish', dish };
    onSaveJournal(prev => addEntry(prev, {
      type, subject, text, private: priv, transferable,
      ...(confidence ? { confidence } : {}),
      ...(supersedes ? { supersedes } : {}),
    }));
    setText('');
    setTransferable(false);
    setConfidence(null);
    setSupersedes('');
    setTypeTouchedPriv(false);
    setPriv(JOURNAL_TYPES[type].privateDefault);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  // No dish selected means no dossier — the panel simply is not there.
  if (!dish) return null;

  return (
    <div style={S.section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={S.title}>Dossier · {dish}</div>
        {entries.length > 1 && (
          <button style={S.chip(arc)} onClick={() => setArc(a => !a)}>
            {arc ? 'Newest first' : 'Read as an arc'}
          </button>
        )}
      </div>
      {arc && entries.length > 1 && (
        <div style={{ fontSize: 11, color: C.faint, marginBottom: 6 }}>
          Oldest first: how this dish changed, in order.
        </div>
      )}


      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', margin: '6px 0 8px' }}>
        {JOURNAL_TYPE_ORDER.map(t => (
          <button key={t} style={S.chip(type === t)} onClick={() => pickType(t)} title={JOURNAL_TYPES[t].hint}>
            {JOURNAL_TYPES[t].label}
          </button>
        ))}
      </div>
      <textarea
        style={S.input}
        placeholder={JOURNAL_TYPES[type].hint}
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: C.faint }}>How sure?</span>
        {[['firm', 'Firm rule'], ['working', 'Working idea']].map(([v, label]) => (
          <button key={v} style={S.chip(confidence === v)} onClick={() => setConfidence(c => (c === v ? null : v))}>
            {label}
          </button>
        ))}
        {entries.length > 0 && (
          <select
            value={supersedes}
            onChange={e => setSupersedes(e.target.value)}
            style={{ flex: '1 1 140px', minWidth: 120, background: '#14201d', border: `1px solid ${C.border}`, borderRadius: 7, color: C.dim, fontSize: 11.5, padding: '5px 6px' }}
          >
            <option value="">Replaces nothing</option>
            {entries.filter(e => e.type !== 'revision').slice(0, 20).map(e => (
              <option key={e.id} value={e.id}>Replaces: {e.text.slice(0, 40)}</option>
            ))}
          </select>
        )}
      </div>

      {canBeTransferable(type) && (
        <div
          style={{ ...S.lockRow, color: transferable ? C.good : C.dim }}
          onClick={() => setTransferable(v => !v)}
        >
          <span style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${transferable ? C.good : '#5F5E5A'}`, background: transferable ? C.good : 'transparent', color: '#14201d', fontSize: 12, fontWeight: 800, lineHeight: 1 }}>
            {transferable ? '✓' : ''}
          </span>
          <span>{transferable
            ? 'Holds beyond this dish — a principle, not just this recipe'
            : 'This holds beyond this dish'}</span>
        </div>
      )}
      <div style={S.lockRow} onClick={() => { setPriv(p => !p); setTypeTouchedPriv(true); }}>
        <span style={{ fontSize: 15 }}>{priv ? '🔒' : '🔓'}</span>
        <span>{priv ? 'Private — never leaves the owner app, excluded from the content studio' : 'Owner-app only — usable by the content studio'}</span>
      </div>
      <button style={S.saveBtn} onClick={save}>{savedFlash ? '✓ Saved' : 'Add to the record'}</button>

      {entries.length === 0
        ? <div style={{ fontSize: 12, color: C.faint, marginTop: 10 }}>Nothing recorded yet. The whys are the most perishable thing in this app — costs are on receipts, reasons are only in your head.</div>
        : <div style={{ marginTop: 10 }}>{entries.map(e => (
            <Entry
              key={e.id}
              e={e}
              isSuperseded={superseded.has(e.id)}
              isStale={staleIds.has(e.id)}
              onDelete={(id) => onSaveJournal(prev => removeEntry(prev, id))}
            />
          ))}</div>}
    </div>
  );
}
