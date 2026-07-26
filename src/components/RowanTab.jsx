// RowanTab.jsx — the record itself.
//
// It leads with the RANKING because Kevin asked for it by name, and with the
// two movement lists right underneath, because those are the only things here
// that a preference list could never tell him. A dish his son scored 1 and
// later scored 5 is the entire reason this stores a series instead of a
// current opinion.
//
// Every number on this screen excludes entries flagged as unfair tests. They
// stay visible in a dish's own timeline, because they happened, and they are
// kept out of anything derived, because a rating given while teething is
// evidence about a Tuesday and not about a dish.

import React, { useState } from 'react';
import {
  RATING_LABELS, formatAge, topDishes, dishSummary, seriesFor,
  coverage, untried, writtenEntries,
} from '../rowan.js';
import { GOLD, styles } from '../styles.js';

const SWATCH = { 1: '#E24B4A', 2: '#C77B3A', 3: '#9aa5a0', 4: '#7FA86B', 5: '#4FA36B' };
const C = { text: '#e8e6df', faint: '#9aa5a0', border: '#2d3a36', card: '#1c2422' };

const S = {
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10 },
  h: { fontSize: 14.5, fontWeight: 700, marginBottom: 6, color: C.text },
  faint: { fontSize: 12.5, color: C.faint, lineHeight: 1.5 },
  row: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: `1px solid ${C.border}` },
  pill: (n) => ({
    minWidth: 24, height: 24, borderRadius: 6, background: SWATCH[n], color: '#121a18',
    fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', flex: '0 0 auto',
  }),
};

export function RowanTab({ log, dishNames }) {
  const [open, setOpen] = useState(null);
  const ranked = topDishes(log);
  const cov = coverage(log, dishNames);
  const notYet = untried(log, dishNames);
  const family = writtenEntries(log, { familyOnly: true });

  const movers = ranked
    .map(r => ({ ...r, s: dishSummary(log, r.dish) }))
    .filter(r => r.s && (r.s.cameAround || r.s.wentOff));

  if (!(log || []).length) {
    return (
      <div style={S.card}>
        <div style={S.h}>Nothing logged yet</div>
        <div style={S.faint}>
          The card at the top of Orders is where this gets filled in. Pick a dish, tap a number
          from 1 to 5, write what happened. It builds from there.
          <br /><br />
          The point of it is the series rather than any one rating: a dish he refuses at two and
          loves at four is the thing worth having, and you only see that by logging the refusals too.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={S.card}>
        <div style={S.h}>His dishes, best first</div>
        <div style={S.faint}>
          Averaged across every fair tasting. {cov.tried} of {cov.total} dishes rated.
        </div>
        {ranked.map(r => {
          const s = dishSummary(log, r.dish);
          const isOpen = open === r.dish;
          return (
            <div key={r.dish}>
              <div style={{ ...S.row, cursor: 'pointer' }} onClick={() => setOpen(isOpen ? null : r.dish)}>
                <span style={S.pill(Math.round(r.average))}>{r.average.toFixed(1)}</span>
                <span style={{ flex: 1, fontSize: 13.5, color: C.text }}>{r.dish}</span>
                {s && s.cameAround && <span style={{ fontSize: 11, color: '#4FA36B' }}>came around</span>}
                {s && s.wentOff && <span style={{ fontSize: 11, color: '#E24B4A' }}>went off it</span>}
                <span style={{ fontSize: 11.5, color: C.faint }}>
                  {r.entries} {r.entries === 1 ? 'time' : 'times'}
                </span>
              </div>
              {isOpen && (
                <div style={{ padding: '4px 0 10px 32px' }}>
                  {seriesFor(log, r.dish).map(e => (
                    <div key={e.id} style={{ marginTop: 7, opacity: e.fairTest ? 1 : 0.55 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={S.pill(e.rating)}>{e.rating}</span>
                        <span style={{ fontSize: 12.5, color: C.text }}>{formatAge(e.ageMonths)}</span>
                        <span style={{ fontSize: 11.5, color: C.faint }}>{RATING_LABELS[e.rating]}</span>
                        {!e.fairTest && <span style={{ fontSize: 11, color: C.faint }}>· not counted</span>}
                      </div>
                      {e.note && <div style={{ ...S.faint, marginTop: 3 }}>{e.note}</div>}
                      {e.familyNote && (
                        <div style={{ ...S.faint, marginTop: 3, fontStyle: 'italic', color: GOLD }}>
                          {e.familyNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {movers.length > 0 && (
        <div style={S.card}>
          <div style={S.h}>Dishes that moved</div>
          <div style={S.faint}>
            The reason this keeps every rating instead of the latest one. Tastes double back, and
            a dish written off at two can come good at four.
          </div>
          {movers.map(m => (
            <div key={m.dish} style={S.row}>
              <span style={{ flex: 1, fontSize: 13.5, color: C.text }}>{m.dish}</span>
              <span style={{ fontSize: 12, color: m.s.cameAround ? '#4FA36B' : '#E24B4A' }}>
                {m.s.first.rating} at {formatAge(m.s.first.ageMonths)}
                {' \u2192 '}
                {m.s.latestFair.rating} at {formatAge(m.s.latestFair.ageMonths)}
              </span>
            </div>
          ))}
        </div>
      )}

      {family.length > 0 && (
        <div style={S.card}>
          <div style={S.h}>Family notes</div>
          <div style={S.faint}>
            Gathered out of the per-dish entries and kept together, because these are the part
            written for him rather than for the kitchen.
          </div>
          {family.map(e => (
            <div key={e.id} style={{ ...S.row, display: 'block' }}>
              <div style={{ fontSize: 11.5, color: C.faint }}>
                {e.dish} · {formatAge(e.ageMonths)}
              </div>
              <div style={{ fontSize: 13.5, color: C.text, marginTop: 3 }}>{e.familyNote}</div>
            </div>
          ))}
        </div>
      )}

      {notYet.length > 0 && (
        <div style={S.card}>
          <div style={S.h}>Not tried yet</div>
          <div style={S.faint}>The worklist, not a scold. {notYet.length} left.</div>
          <div style={{ ...S.faint, marginTop: 6, color: C.text }}>{notYet.join(' · ')}</div>
        </div>
      )}
    </div>
  );
}
