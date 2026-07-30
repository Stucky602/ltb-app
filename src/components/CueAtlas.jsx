// src/components/CueAtlas.jsx — taking and reading the visual cues.
//
// TWO SCREENS, ONE RULE
//
// Capture is used with one hand, in a kitchen, while something is on the heat.
// So: the camera opens on the first tap, the photo is the first thing you see,
// and the labelling happens after the shot rather than before it. Anything that
// asks a question before opening the camera is a question asked while the roux
// darkens.
//
// The rule underneath both screens: NOTHING SAYS SAVED UNTIL THE BYTES ARE
// DURABLE. A cue sits visibly unsaved through compression and upload, and only
// a server-confirmed checksum turns it green. That is why the status is on the
// card rather than in a toast that disappears — a failed upload the cook did
// not notice is a photograph that cannot be retaken.

import React, { useState, useRef, useCallback } from 'react';
import { Check, Trash2, AlertTriangle, ImageIcon } from '../icons.jsx';
import { makeCue, markStored, markFailed, cueComparisonSets, CUE_KINDS } from '../visualCues.js';
import { uploadCue } from '../mediaClient.js';
import { WORKER_BASE, PUBLISH_TOKEN } from '../config.js';
import { versionLabel } from '../recipeVersions.js';

const C = {
  panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0',
  gold: '#D4A050', good: '#5DCAA5', bad: '#e0828a',
};

// Photographs are fetched through the gated worker route, never a public URL.
// The bucket has public access disabled, so this is the only way in.
export function cueSrc(cue) {
  if (!cue || !cue.mediaKey) return null;
  return `${WORKER_BASE}/media/${encodeURIComponent(cue.mediaKey)}?token=${encodeURIComponent(PUBLISH_TOKEN)}`;
}

function StatusChip({ status }) {
  if (status === 'stored') {
    return <span style={{ color: C.good, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Saved</span>;
  }
  if (status === 'uploading') {
    return <span style={{ color: C.gold, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}><span aria-hidden>&#8635;</span> Saving…</span>;
  }
  if (status === 'failed') {
    return <span style={{ color: C.bad, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} /> Not saved</span>;
  }
  return <span style={{ color: C.dim, fontSize: 11 }}>Waiting</span>;
}

export function CueCapture({ dishName, cues, onSaveCues }) {
  const fileRef = useRef(null);
  const [draft, setDraft] = useState(null);   // { cue, previewUrl, file }
  const [busy, setBusy] = useState(false);

  const onPick = useCallback((e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Labelled AFTER the shot. Asking first is asking while the pan is hot.
    setDraft({
      file,
      previewUrl: URL.createObjectURL(file),
      cue: makeCue({ dishName, step: '', kind: 'target' }),
    });
    e.target.value = '';
  }, [dishName]);

  const save = useCallback(async () => {
    if (!draft) return;
    setBusy(true);
    const working = { ...draft.cue, status: 'uploading' };
    onSaveCues([...(cues || []), working]);

    const result = await uploadCue(working, draft.file, { workerBase: WORKER_BASE, token: PUBLISH_TOKEN });
    const settled = result.ok
      ? markStored(working, result)
      : markFailed(working, result.reason);

    // Replace in place, so a failure stays visible on the card instead of
    // vanishing into a toast the cook did not see.
    onSaveCues([...(cues || []).filter(c => c.id !== working.id), settled]);
    URL.revokeObjectURL(draft.previewUrl);
    setDraft(null);
    setBusy(false);
  }, [draft, cues, onSaveCues]);

  const retry = useCallback(async (cue) => {
    // Only metadata survives a failure — the bytes were never stored, and the
    // original File is long gone. Retaking is the honest path, so say so.
    onSaveCues((cues || []).filter(c => c.id !== cue.id));
  }, [cues, onSaveCues]);

  const mine = (cues || []).filter(c => c.dishName === dishName || c.dishId);

  return (
    <div>
      <input
        ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={onPick} style={{ display: 'none' }}
      />

      {!draft && (
        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`,
            background: 'transparent', color: C.text, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}
        ><ImageIcon size={14} /> Take a cue photo</button>
      )}

      {draft && (
        <div style={{ border: `1px solid ${C.gold}`, borderRadius: 8, padding: 10, marginTop: 8 }}>
          <img src={draft.previewUrl} alt="" style={{ width: '100%', borderRadius: 6, marginBottom: 8 }} />
          <input
            value={draft.cue.step}
            onChange={e => setDraft({ ...draft, cue: { ...draft.cue, step: e.target.value } })}
            placeholder="Which step? e.g. Dark roux"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, marginBottom: 6, border: `1px solid ${C.border}`, background: '#151d1b', color: C.text, fontSize: 13 }}
          />
          <select
            value={draft.cue.kind}
            onChange={e => setDraft({ ...draft, cue: { ...draft.cue, kind: e.target.value } })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, marginBottom: 6, border: `1px solid ${C.border}`, background: '#151d1b', color: C.text, fontSize: 13 }}
          >
            {CUE_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <input
            value={draft.cue.note}
            onChange={e => setDraft({ ...draft, cue: { ...draft.cue, note: e.target.value } })}
            placeholder="What should someone notice? (optional)"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, marginBottom: 8, border: `1px solid ${C.border}`, background: '#151d1b', color: C.text, fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={save} disabled={busy || !draft.cue.step.trim()}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.good}`, background: 'transparent', color: C.good, fontSize: 13, cursor: 'pointer', opacity: draft.cue.step.trim() ? 1 : 0.5 }}
            >{busy ? 'Saving…' : 'Save this cue'}</button>
            <button
              onClick={() => { URL.revokeObjectURL(draft.previewUrl); setDraft(null); }}
              style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.dim, fontSize: 13, cursor: 'pointer' }}
            >Discard</button>
          </div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>
            Filed against {versionLabel(draft.cue.recipeVersionId)}
          </div>
        </div>
      )}

      {/* Anything that did not make it. Kept visible rather than tidied away:
          the photograph cannot be retaken later, so the cook needs to know NOW
          that it is gone. */}
      {mine.filter(c => c.status === 'failed').map(c => (
        <div key={c.id} style={{ marginTop: 8, padding: 8, borderRadius: 6, border: `1px solid ${C.bad}`, fontSize: 12, color: C.bad }}>
          “{c.step}” never saved{c.failureReason ? ` — ${c.failureReason}` : ''}. The photo is gone; it needs retaking.
          <button
            onClick={() => retry(c)}
            style={{ marginLeft: 8, background: 'none', border: 0, color: C.dim, fontSize: 11, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}
          >Clear</button>
        </div>
      ))}
    </div>
  );
}

// The reading screen. Target beside contrast is the entire point — one photo of
// a correct roux teaches less than a correct one next to one taken two minutes
// later.
export function CueGallery({ dishName, cues, onSaveCues }) {
  const sets = cueComparisonSets(cues, dishName);
  if (!sets.length) return null;

  const remove = (cue) => {
    if (!window.confirm(`Remove the cue for “${cue.step}”? The photograph is deleted too.`)) return;
    fetch(`${WORKER_BASE}/media/${encodeURIComponent(cue.mediaKey)}`, {
      method: 'DELETE', headers: { 'X-LTB-Token': PUBLISH_TOKEN },
    }).catch(() => {});
    onSaveCues((cues || []).filter(c => c.id !== cue.id));
  };

  return (
    <div>
      {sets.map(set => {
        const shown = [...set.target, ...set.contrast, ...set.other].filter(c => c.status === 'stored');
        if (!shown.length) return null;
        return (
          <div key={set.step} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>{set.step}</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {shown.map(c => (
                <div key={c.id} style={{ minWidth: 150, maxWidth: 190 }}>
                  <img
                    src={cueSrc(c)} alt={c.step}
                    style={{
                      width: '100%', borderRadius: 6, display: 'block',
                      border: `2px solid ${c.kind === 'target' ? C.good : c.kind === 'step' || c.kind === 'plating' ? C.border : C.bad}`,
                    }}
                  />
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4, color: c.kind === 'target' ? C.good : c.kind === 'step' || c.kind === 'plating' ? C.dim : C.bad }}>
                    {(CUE_KINDS.find(k => k.id === c.kind) || {}).label || c.kind}
                  </div>
                  {c.note && <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.4, marginTop: 2 }}>{c.note}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <StatusChip status={c.status} />
                    <button
                      onClick={() => remove(c)}
                      style={{ background: 'none', border: 0, padding: 0, color: C.dim, cursor: 'pointer' }}
                      aria-label="Remove cue"
                    ><Trash2 size={12} /></button>
                  </div>
                  {/* Which recipe this was true of. A cue photographed under an
                      older version is not wrong, it is historical, and saying so
                      is the difference between the two. */}
                  <div style={{ fontSize: 10, color: '#6b7570', marginTop: 2 }}>
                    {versionLabel(c.recipeVersionId)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
