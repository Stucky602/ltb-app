// RowanLogCard.jsx — the permanent card at the top of Orders for logging what
// his son thought of a dish.
//
// COLLAPSED BY DEFAULT, and shaped like an order card on purpose. It is
// permanent and it sits above every real order, so at full height it pushed the
// actual work down the page every single time the app opened. Kevin: "I want it
// in the same format as actual orders because those are tabs I can minimize,
// and this takes up a lot of space." Matching the order-card affordance also
// means there is nothing new to learn: the thing that collapses looks like the
// other things that collapse.
//
// Collapse state is LOCAL and resets on reload, unlike the expanded-order state
// in App.jsx which tracks which specific order is open. There is only ever one
// of these, so lifting it would be state in App.jsx that no other component
// could ever read.
//
// WHY IT LIVES IN ORDERS AND NEVER GOES AWAY
// A record like this is only worth having if it actually gets filled in, and
// capture that needs three taps to reach gets used twice and then forgotten.
// Orders is the tab the app opens on, so this sits where Kevin already is:
// pick a dish, tap a number, type, log. It is deliberately not dismissible and
// deliberately not tied to an order, because it is not an order — it is a card
// shaped like one so it lands in the muscle memory that already exists.
//
// TWO NOTE FIELDS, KEPT APART ON PURPOSE
// The first is about the food and is what Kevin cooks from. The second is
// about the moment and is written for his son to read one day. They serve
// different readers and merging them would make both worse: cooking notes
// buried in sentiment, sentiment buried in cooking notes.

import React, { useState, useEffect } from 'react';
import { RATING_LABELS, formatAge, ageAt } from '../rowan.js';
import { AUDIO_MAX_SECONDS } from '../mediaClient.js';
import { ChevronDown } from '../icons.jsx';
import { GOLD, styles } from '../styles.js';

const SWATCH = { 1: '#E24B4A', 2: '#C77B3A', 3: '#9aa5a0', 4: '#7FA86B', 5: '#4FA36B' };

export function RowanLogCard({ dishNames, onLog }) {
  const [open, setOpen] = useState(false);
  const [dish, setDish] = useState('');
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [familyNote, setFamilyNote] = useState('');
  const [fairTest, setFairTest] = useState(true);
  const [saved, setSaved] = useState(false);
  // ── VOICE CAPSULE ─────────────────────────────────────────────────────────
  // One tap, no prompt, no streak, and no nudge after a meal. This is offered
  // and never asked for: a record that pressures you into filling it is one you
  // start avoiding, and the point is that it survives decades, not that it is
  // complete.
  const [rec, setRec] = useState(null);      // live MediaRecorder
  const [clip, setClip] = useState(null);    // { blob, seconds }
  const [recErr, setRecErr] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const canRecord = typeof window !== 'undefined'
    && typeof window.MediaRecorder !== 'undefined'
    && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const startRec = async () => {
    setRecErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      const startedAt = Date.now();
      mr.ondataavailable = ev => { if (ev.data && ev.data.size) chunks.push(ev.data); };
      mr.onstop = () => {
        // Release the mic. A page holding a live audio track shows a recording
        // indicator on the phone forever and is the kind of thing that gets an
        // app deleted.
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        setClip({ blob, seconds: Math.round((Date.now() - startedAt) / 1000) });
        setRec(null);
      };
      mr.start();
      setRec(mr);
      setElapsed(0);
    } catch (e) {
      // Denied permission is the common case and is not an error state to
      // apologise for; it just says what happened.
      setRecErr('No microphone available, or permission was declined.');
    }
  };
  const stopRec = () => { try { rec && rec.state !== 'inactive' && rec.stop(); } catch (e) { setRec(null); } };

  useEffect(() => {
    if (!rec) return undefined;
    const t = setInterval(() => setElapsed(e => {
      const next = e + 1;
      if (next >= AUDIO_MAX_SECONDS) stopRec();
      return next;
    }), 1000);
    return () => clearInterval(t);
  }, [rec]);

  const ready = !!dish && rating > 0;
  const age = formatAge(ageAt(new Date().toISOString()));

  const submit = () => {
    if (!ready) return;
    // The clip rides along. onLog logs the entry FIRST and uploads after, so a
    // failed upload costs the recording and never the rating.
    onLog({ dish, rating, note, familyNote, fairTest, clip });
    setDish(''); setRating(0); setNote(''); setFamilyNote(''); setFairTest(true);
    setClip(null); setRecErr('');
    setSaved(true);
    // Collapses itself after a log. The common case is one entry per sitting,
    // so leaving it open just re-occupies the screen it was asked to give back.
    setOpen(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const field = {
    width: '100%', background: '#14201d', border: '1px solid #2d3a36', borderRadius: 8,
    color: '#e8e6df', fontSize: 13.5, padding: 9, boxSizing: 'border-box', marginTop: 6,
  };

  return (
    <div style={{
      background: 'rgba(212,160,80,0.06)', border: `1px solid ${GOLD}`,
      borderRadius: 10, overflow: 'hidden', marginBottom: 10,
    }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%', padding: '13px 14px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', cursor: 'pointer', background: 'none',
          border: 'none', textAlign: 'left', color: '#e8e6df',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: GOLD }}>Rowan</span>
          <span style={{ fontSize: 11.5, color: '#9aa5a0' }}>
            {saved ? 'logged' : (open ? age : `${age} \u00b7 log a dish`)}
          </span>
        </span>
        <ChevronDown
          size={18}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', color: '#9aa5a0' }}
        />
      </button>

      {!open ? null : (
      <div style={{ padding: '0 12px 12px' }}>

      <select style={field} value={dish} onChange={e => setDish(e.target.value)}>
        <option value="">Which dish?</option>
        {(dishNames || []).map(n => <option key={n} value={n}>{n}</option>)}
      </select>

      <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setRating(n)}
            title={RATING_LABELS[n]}
            style={{
              flex: 1, minHeight: 40, borderRadius: 8, cursor: 'pointer',
              fontSize: 15, fontWeight: 700,
              background: rating === n ? SWATCH[n] : '#232d2a',
              color: rating === n ? '#121a18' : '#e8e6df',
              border: `1px solid ${rating === n ? SWATCH[n] : '#2d3a36'}`,
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: '#9aa5a0', marginTop: 4, minHeight: 15 }}>
        {rating ? RATING_LABELS[rating] : '1 refused it \u00b7 5 loved it'}
      </div>

      {/* Right now Kevin is reading interest off a nineteen-month-old. Later he
          can just ask, and the same field takes the answer without changing. */}
      <textarea
        style={{ ...field, minHeight: 54, resize: 'vertical' }}
        placeholder="What happened — what he did with it, what you noticed"
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <textarea
        style={{ ...field, minHeight: 44, resize: 'vertical' }}
        placeholder="Family note (for him to read one day)"
        value={familyNote}
        onChange={e => setFamilyNote(e.target.value)}
      />

      {canRecord && (
        <div style={{ marginTop: 8 }}>
          {!clip && !rec && (
            <button
              onClick={startRec}
              style={{ ...field, marginTop: 0, cursor: 'pointer', textAlign: 'left', color: GOLD }}
            >
              Record his voice (optional)
            </button>
          )}
          {rec && (
            <button
              onClick={stopRec}
              style={{ ...field, marginTop: 0, cursor: 'pointer', textAlign: 'left', color: '#E24B4A' }}
            >
              Recording {elapsed}s — tap to stop
            </button>
          )}
          {clip && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ flex: 1, fontSize: 12.5, color: '#9aa5a0' }}>
                {clip.seconds}s recorded
              </span>
              <button
                onClick={() => setClip(null)}
                style={{ background: 'none', border: '1px solid #2d3a36', borderRadius: 8,
                  color: '#9aa5a0', fontSize: 12, padding: '6px 10px', cursor: 'pointer' }}
              >Discard</button>
            </div>
          )}
          {recErr && <div style={{ fontSize: 11.5, color: '#e0828a', marginTop: 4 }}>{recErr}</div>}
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, fontSize: 12.5, color: '#9aa5a0', cursor: 'pointer' }}>
        <input type="checkbox" checked={!fairTest} onChange={e => setFairTest(!e.target.checked)} />
        {/* Kept out of averages rather than thrown away: it happened, it just
            says nothing about the dish. */}
        Tired, teething, or already full — don't count this one
      </label>

      <button
        onClick={submit}
        disabled={!ready}
        style={{
          width: '100%', marginTop: 9, minHeight: 42, borderRadius: 9, cursor: ready ? 'pointer' : 'default',
          background: ready ? GOLD : '#232d2a', color: ready ? '#121a18' : '#5c6b66',
          border: `1px solid ${ready ? GOLD : '#2d3a36'}`, fontSize: 14.5, fontWeight: 700,
        }}
      >
        {saved ? 'Logged' : 'Log it'}
      </button>
      </div>
      )}
    </div>
  );
}
