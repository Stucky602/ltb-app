// DossierRecord.jsx — the Record tab's reading surface for the dossier.
//
// READ-ONLY, DELIBERATELY. Kevin: "no entries allowed here, this is only
// records as the tab says." Everything in this file displays and nothing
// writes. General entries arrive by HARVEST — drafted out of a conversation and
// seeded — which is not a missing feature but the whole design: correcting a
// draft is far lower friction than facing a blank textarea, and the blank
// textarea is exactly why most of this material had never been written down.
//
// TWO WAYS IN, because the record has two shapes:
//   - CHAPTERS, for everything that belongs to no single dish. Most of Kevin's
//     past tense is not dish-shaped, and until chapters existed it had a data
//     model and nowhere to be found.
//   - A DISH PICKER, which mirrors the per-dish dossier from the Recipes tab.
//     Reusing the same rendering is normally a smell and is right here: there
//     is one dossier, and two doors into it should not show two versions of it.
//
// Chapter titles lean toward his son on purpose, with Kevin's explicit
// permission. These are the entries most likely to be read by someone who was
// not there, and a heading like "general" tells that reader nothing about why
// any of it was kept.

import React, { useState } from 'react';
import { GENERAL_CHAPTERS, entriesForChapter, chapterCounts, entriesForDish } from '../journal.js';
import { ChevronDown } from '../icons.jsx';
import { GOLD } from '../styles.js';

const C = { text: '#e8e6df', faint: '#9aa5a0', border: '#2d3a36', card: '#1c2422' };

const S = {
  h: { fontSize: 14.5, fontWeight: 700, color: C.text },
  faint: { fontSize: 12.5, color: C.faint, lineHeight: 1.5 },
  row: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, padding: '10px 0', borderTop: `1px solid ${C.border}`, background: 'none',
    border: 'none', color: C.text, textAlign: 'left', cursor: 'pointer',
  },
  entry: { borderTop: `1px solid ${C.border}`, padding: '8px 0' },
  meta: { fontSize: 10.5, color: C.faint, display: 'flex', gap: 8, flexWrap: 'wrap' },
  body: { fontSize: 13, color: C.text, lineHeight: 1.55, margin: '3px 0 0', whiteSpace: 'pre-wrap' },
  select: {
    width: '100%', background: '#14201d', border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, fontSize: 13, padding: 9, boxSizing: 'border-box', marginTop: 8,
  },
};

function Entry({ e }) {
  return (
    <div style={S.entry}>
      <div style={S.meta}>
        <span>{e.type}</span>
        {e.ts && <span>{new Date(e.ts).toLocaleDateString()}</span>}
        {e.undated && <span>date approximate</span>}
        {/* Harvested vs written is the one provenance distinction that cannot be
            recovered later, so it is always on the face of the entry. */}
        {e.origin === 'harvested' && <span style={{ color: GOLD }}>harvested</span>}
        {e.transferable && <span>holds beyond this dish</span>}
        {e.personal && <span style={{ color: GOLD }}>for Rowan</span>}
        {e.private && <span>private</span>}
      </div>
      <p style={S.body}>{e.text}</p>
    </div>
  );
}

export function DossierRecord({ journal, dishNames }) {
  const [open, setOpen] = useState(false);
  const [chapter, setChapter] = useState(null);
  const [dish, setDish] = useState('');
  const counts = chapterCounts(journal);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const dishEntries = dish ? entriesForDish(journal, dish) : [];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%', padding: '13px 14px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', background: 'none', border: 'none',
          color: C.text, textAlign: 'left', cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={S.h}>Dossier</span>
          <span style={{ fontSize: 11.5, color: C.faint }}>read the record</span>
        </span>
        <ChevronDown size={18} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', color: C.faint }} />
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          <div style={S.faint}>
            Reading only. Entries are written in the Recipes tab for dishes, and the chapters below
            come out of conversation rather than a form. {total} {total === 1 ? 'entry' : 'entries'}
            {' '}filed across {GENERAL_CHAPTERS.length} chapters.
          </div>

          {GENERAL_CHAPTERS.map(c => {
            const n = counts[c.id] || 0;
            const isOpen = chapter === c.id;
            return (
              <div key={c.id}>
                <button style={S.row} onClick={() => setChapter(isOpen ? null : c.id)} aria-expanded={isOpen}>
                  <span style={{ flex: 1 }}>
                    <span style={{ fontSize: 13.5, color: C.text }}>{c.title}</span>
                    <span style={{ ...S.faint, display: 'block', fontSize: 11.5 }}>{c.blurb}</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: n ? GOLD : C.faint }}>
                    {n || 'empty'}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ paddingLeft: 2, paddingBottom: 8 }}>
                    {/* An empty chapter says so rather than hiding. At zero it
                        is the worklist, same as the coverage card. */}
                    {n === 0
                      ? <div style={{ ...S.faint, padding: '6px 0' }}>Nothing filed here yet. It fills from conversation, not from a form.</div>
                      : entriesForChapter(journal, c.id).map(e => <Entry key={e.id} e={e} />)}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 10 }}>
            <div style={{ fontSize: 12.5, color: C.text }}>Any dish</div>
            <div style={{ ...S.faint, fontSize: 11.5 }}>
              The same entries the Recipes tab shows, without leaving the record.
            </div>
            <select style={S.select} value={dish} onChange={e => { setDish(e.target.value); setChapter(null); }}>
              <option value="">Pick a dish…</option>
              {(dishNames || []).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {dish && (
              dishEntries.length === 0
                ? <div style={{ ...S.faint, padding: '8px 0' }}>Nothing written about {dish} yet.</div>
                : dishEntries.map(e => <Entry key={e.id} e={e} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
