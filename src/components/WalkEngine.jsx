// WalkEngine.jsx — one generic surface for "step through a list, answer
// something per item, save as you go, stop anywhere."
//
// WHY THIS EXISTS
// Eight separate walks got hand-built in chat over two sessions: the container
// audit, the effort rating pass, the wow-path assignment, the equipment
// inventory, the allergen verification, the pipeline triage, the dossier
// harvest, the pairwise dish ranking. Every one was the same shape and every
// one was a one-off. The app has plenty of surfaces for ENTRY (add an order,
// add an entry, add a dish) and almost none for REVIEW. This is that surface,
// built once so the ninth walk is a config object instead of a new component.
//
// THE PRE-FILL ARGUMENT, which is why `prefill` exists as a first-class prop
// rather than something a caller bolts on: every walk that went fast carried
// guesses already in the boxes. Every walk that stalled started blank. Kevin
// corrects far faster than he composes, and that pattern held across all
// eight walks. A caller with nothing to guess can pass `prefill={null}` and
// get a blank form; a caller with ANY prior signal (a stored value, a
// heuristic, last week's answer) should use it.
//
// SAVE PER ITEM, NOT PER SESSION. `onSave` fires the moment a field changes,
// not on a final submit. Kevin stops mid-walk routinely — a phone call, an
// order comes in, dinner needs starting — and losing everything answered so
// far because there is no "session complete" event would make every walk as
// fragile as the one-offs it replaces. There is no submit button. Answering
// is saving.
//
// WHAT THIS DELIBERATELY DOES NOT DO
// - No validation framework. A field is either answered or not; the walk does
//   not enforce required fields, because "skip it and come back" has to work
//   for messy real data (an ingredient with no known price yet, a dish nobody
//   can currently rate).
// - No branching logic between fields. If a walk needs "only ask Q2 if Q1 was
//   yes", that is the CALLER'S business logic, expressed as which fields it
//   passes for that item — not something this engine understands.
// - No network. `onSave` is a plain callback; whether it hits localStorage,
//   the backup payload, or nothing at all is entirely up to the caller.

import React, { useState, useMemo } from 'react';

const S = {
  wrap: { background: '#1c2422', border: '1px solid #2d3a36', borderRadius: 12, padding: 14 },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 14.5, fontWeight: 700, color: '#e8e6df' },
  progress: { fontSize: 12, color: '#9aa5a0' },
  bar: { height: 4, background: '#14201d', borderRadius: 2, overflow: 'hidden', marginBottom: 14 },
  barFill: { height: '100%', background: '#4FA36B', transition: 'width .15s' },
  itemLabel: { fontSize: 15.5, fontWeight: 700, color: '#e8e6df', marginBottom: 2 },
  itemSub: { fontSize: 12, color: '#9aa5a0', marginBottom: 12 },
  fieldLabel: { fontSize: 12.5, fontWeight: 700, color: '#D4A050', marginBottom: 6, marginTop: 14 },
  fieldHint: { fontSize: 11.5, color: '#6b7570', marginTop: -3, marginBottom: 6 },
  textarea: { width: '100%', minHeight: 64, background: '#14201d', border: '1px solid #2d3a36',
    borderRadius: 8, color: '#e8e6df', fontSize: 13.5, padding: 9, boxSizing: 'border-box', resize: 'vertical' },
  scaleRow: { display: 'flex', gap: 6 },
  scaleBtn: (active) => ({
    flex: 1, minHeight: 40, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700,
    background: active ? '#D4A050' : '#232d2a', color: active ? '#121a18' : '#e8e6df',
    border: `1px solid ${active ? '#D4A050' : '#2d3a36'}`,
  }),
  chipRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: (active) => ({
    fontSize: 12.5, padding: '7px 11px', borderRadius: 7, cursor: 'pointer',
    background: active ? '#4FA36B' : '#232d2a', color: active ? '#121a18' : '#e8e6df',
    border: `1px solid ${active ? '#4FA36B' : '#2d3a36'}`,
  }),
  keepCutRow: { display: 'flex', gap: 8 },
  keepCutBtn: (active, kind) => ({
    flex: 1, minHeight: 44, borderRadius: 9, cursor: 'pointer', fontSize: 14, fontWeight: 700,
    background: active ? (kind === 'keep' ? '#4FA36B' : '#e0828a') : '#232d2a',
    color: active ? '#121a18' : '#e8e6df',
    border: `1px solid ${active ? (kind === 'keep' ? '#4FA36B' : '#e0828a') : '#2d3a36'}`,
  }),
  navRow: { display: 'flex', gap: 8, marginTop: 18 },
  navBtn: (enabled) => ({
    flex: 1, minHeight: 42, borderRadius: 9, cursor: enabled ? 'pointer' : 'default', fontSize: 14,
    background: enabled ? '#232d2a' : '#181f1d', color: enabled ? '#e8e6df' : '#5c6b66',
    border: '1px solid #2d3a36',
  }),
  skipBtn: { minHeight: 42, padding: '0 16px', borderRadius: 9, cursor: 'pointer', fontSize: 13,
    background: 'none', color: '#9aa5a0', border: '1px solid #2d3a36' },
  savedTick: { fontSize: 11.5, color: '#4FA36B', marginTop: 8, minHeight: 15 },
  done: { textAlign: 'center', padding: '24px 12px', color: '#9aa5a0', fontSize: 13.5 },
};

function Field({ field, value, onChange }) {
  const set = (v) => onChange(field.key, v);
  return (
    <div>
      <div style={S.fieldLabel}>{field.label}</div>
      {field.hint && <div style={S.fieldHint}>{field.hint}</div>}

      {field.type === 'text' && (
        <textarea style={S.textarea} placeholder={field.placeholder || ''} value={value || ''}
          onChange={e => set(e.target.value)} />
      )}

      {field.type === 'scale' && (
        <div style={S.scaleRow}>
          {Array.from({ length: (field.max || 5) - (field.min || 1) + 1 }, (_, i) => (field.min || 1) + i).map(n => (
            <button key={n} style={S.scaleBtn(value === n)} onClick={() => set(n)}>{n}</button>
          ))}
        </div>
      )}

      {field.type === 'checkboxes' && (
        <div style={S.chipRow}>
          {(field.options || []).map(opt => {
            const list = Array.isArray(value) ? value : [];
            const active = list.includes(opt.value ?? opt);
            const label = opt.label ?? opt;
            const v = opt.value ?? opt;
            return (
              <button key={v} style={S.chip(active)}
                onClick={() => set(active ? list.filter(x => x !== v) : [...list, v])}>
                {label}
              </button>
            );
          })}
        </div>
      )}

      {field.type === 'keepcut' && (
        <div style={S.keepCutRow}>
          <button style={S.keepCutBtn(value === 'keep', 'keep')} onClick={() => set('keep')}>
            {field.keepLabel || 'Keep'}
          </button>
          <button style={S.keepCutBtn(value === 'cut', 'cut')} onClick={() => set('cut')}>
            {field.cutLabel || 'Cut'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * @param {object[]} items          the list to walk
 * @param {(item)=>string} itemKey  a stable key per item (drives resume + save)
 * @param {(item)=>string} itemLabel  the display title for an item
 * @param {(item)=>string} [itemSub]  optional subtitle under the title
 * @param {object[]|(item)=>object[]} fields  field configs, or a function of
 *        the item if different items need different fields
 * @param {(item)=>object} [prefill]  best-guess answers for a fresh item.
 *        Ignored for an item that already has a saved answer.
 * @param {object} [initialAnswers]  { [itemKey]: answers } to resume from
 * @param {(itemKey, answers, item)=>void} onSave  fired on every field change
 * @param {(allAnswers)=>void} [onDone]  fired once, after the last item
 * @param {string} [title]
 */
export function WalkEngine({
  items, itemKey, itemLabel, itemSub, fields, prefill, initialAnswers, onSave, onDone, title,
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => ({ ...(initialAnswers || {}) }));
  const [justSaved, setJustSaved] = useState(false);
  const [finished, setFinished] = useState(false);

  const total = items.length;
  const item = items[index];
  const key = item ? itemKey(item) : null;
  const itemFields = useMemo(() => {
    if (!item) return [];
    return typeof fields === 'function' ? fields(item) : fields;
  }, [item, fields]);

  const current = useMemo(() => {
    if (!key) return {};
    if (answers[key]) return answers[key];
    const guess = (prefill && item) ? prefill(item) : {};
    return guess || {};
  }, [key, answers, item, prefill]);

  const answeredCount = Object.keys(answers).length;

  const setField = (fieldKey, value) => {
    const next = { ...current, [fieldKey]: value };
    setAnswers(prev => ({ ...prev, [key]: next }));
    onSave(key, next, item);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
  };

  const goTo = (i) => {
    if (i < 0) return;
    if (i >= total) { setFinished(true); if (onDone) onDone(answers); return; }
    setIndex(i);
    setFinished(false);
  };

  if (!total) {
    return <div style={S.wrap}><div style={S.done}>Nothing to walk through.</div></div>;
  }

  if (finished) {
    return (
      <div style={S.wrap}>
        <div style={S.done}>
          Done. {answeredCount} of {total} answered.
          <div style={{ marginTop: 10 }}>
            <button style={S.navBtn(true)} onClick={() => goTo(0)}>Start over</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        {title && <span style={S.title}>{title}</span>}
        <span style={S.progress}>{index + 1} of {total} \u00b7 {answeredCount} answered</span>
      </div>
      <div style={S.bar}><div style={{ ...S.barFill, width: `${((index + 1) / total) * 100}%` }} /></div>

      <div style={S.itemLabel}>{itemLabel(item)}</div>
      {itemSub && <div style={S.itemSub}>{itemSub(item)}</div>}

      {itemFields.map(f => (
        <Field key={f.key} field={f} value={current[f.key]} onChange={setField} />
      ))}

      <div style={S.savedTick}>{justSaved ? 'Saved' : '\u00a0'}</div>

      <div style={S.navRow}>
        <button style={S.navBtn(index > 0)} disabled={index === 0} onClick={() => goTo(index - 1)}>Back</button>
        <button style={S.skipBtn} onClick={() => goTo(index + 1)}>Skip</button>
        <button style={S.navBtn(true)} onClick={() => goTo(index + 1)}>
          {index === total - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
