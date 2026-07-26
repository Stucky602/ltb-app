// RowanLogCard.jsx — the permanent card at the top of Orders for logging what
// his son thought of a dish.
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

import React, { useState } from 'react';
import { RATING_LABELS, formatAge, ageAt } from '../rowan.js';
import { GOLD, styles } from '../styles.js';

const SWATCH = { 1: '#E24B4A', 2: '#C77B3A', 3: '#9aa5a0', 4: '#7FA86B', 5: '#4FA36B' };

export function RowanLogCard({ dishNames, onLog }) {
  const [dish, setDish] = useState('');
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [familyNote, setFamilyNote] = useState('');
  const [fairTest, setFairTest] = useState(true);
  const [saved, setSaved] = useState(false);

  const ready = !!dish && rating > 0;
  const age = formatAge(ageAt(new Date().toISOString()));

  const submit = () => {
    if (!ready) return;
    onLog({ dish, rating, note, familyNote, fairTest });
    setDish(''); setRating(0); setNote(''); setFamilyNote(''); setFairTest(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const field = {
    width: '100%', background: '#14201d', border: '1px solid #2d3a36', borderRadius: 8,
    color: '#e8e6df', fontSize: 13.5, padding: 9, boxSizing: 'border-box', marginTop: 6,
  };

  return (
    <div style={{
      background: 'rgba(212,160,80,0.06)', border: `1px solid ${GOLD}`,
      borderRadius: 12, padding: 12, marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: GOLD }}>Rowan</div>
        <div style={{ fontSize: 11.5, color: '#9aa5a0' }}>{age}</div>
      </div>

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
  );
}
