// OrderBanners.jsx — the three advisory strips at the top of the Orders tab:
// the business-week rollover, the container check, and the Sunday deadline
// countdown.
//
// ALL THREE ARE INFORMATION AND NEVER A BLOCK. Kevin already knows his own
// deadline and his own container situation; these put the number where he is
// already looking rather than stopping him doing anything. The rollover strip
// is dismissed by TAP and not by a timer, for the same reason the boot notice
// is: an informational message should not expire before it has been read.
//
// The container strip has two forms and they are not interchangeable. Amber
// means "might be tight" and renders ONLY when there is no hard shortage,
// because a real shortfall below would turn it into noise. Red means a genuine
// shortage against what Kevin owns, and it says out loud when the demand
// figure is a floor rather than a count, since an unconfirmed dish is assumed
// to need one container and usually needs more.

import React from 'react';
import { formatCountdown } from '../timeBanners.js';

export function OrderBanners({ weekRollover, markWeekSeen, containerStatus, deadlineMs, intake }) {
  return (
    <>
    {/* T2: week rollover — dismissed by tap, not silently, not by a
        timer (same rule as `notice` below: don't let the telling
        expire before Kevin has read it). */}
    {weekRollover.rolled && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: 'rgba(93,202,165,0.10)', border: '1px solid #2f6f57', borderRadius: 10, padding: '9px 12px', marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, color: '#e8ede9' }}>New business week: {weekRollover.currentLabel}.</span>
        <button
          onClick={() => markWeekSeen(weekRollover.currentStamp)}
          style={{ minHeight: 32, padding: '4px 12px', borderRadius: 6, border: '1px solid #2f6f57', background: 'transparent', color: '#5DCAA5', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          Got it
        </button>
      </div>
    )}
    {/* M1: the Sunday check. Fires only on a genuine shortage —
        next week's pack needs more of a type than Kevin owns
        (jars: owns minus held). Silent otherwise. */}
    {containerStatus.shortages.length === 0 && (containerStatus.atRisk || []).length > 0 && (
      <div style={{ background: 'rgba(239,159,39,0.10)', border: '1px solid #EF9F27', borderRadius: 10, padding: '9px 12px', marginBottom: 10, fontSize: 12.5, color: '#e8ede9' }}>
        <b style={{ color: '#EF9F27' }}>Containers might be tight:</b>
        {' '}{containerStatus.atRisk.map(r => r.label).join(', ')}.
        {' '}{containerStatus.audit.unconfirmed.length} dinner{containerStatus.audit.unconfirmed.length === 1 ? '' : 's'} still
        {' '}count as one container each because their real composition has not been confirmed,
        {' '}so this week's demand is a floor, not a figure. Record tab &rarr; Container audit.
      </div>
    )}
    {containerStatus.shortages.length > 0 && (
      <div style={{ background: 'rgba(224,130,138,0.10)', border: '1px solid #e0828a', borderRadius: 10, padding: '9px 12px', marginBottom: 10, fontSize: 12.5, color: '#e8ede9' }}>
        <b style={{ color: '#e0828a' }}>Short on containers for this pack:</b>
        {' '}{containerStatus.shortages.map(s => `${s.label} — need ${s.need}, have ${s.have}`).join(' · ')}.
        {containerStatus.mealOut > 0 ? ` ${containerStatus.mealOut} meal container${containerStatus.mealOut !== 1 ? 's' : ''} still out with customers, some may come back before Wednesday.` : ''}
        {containerStatus.demandIsFloor ? ' The real number may be higher: unconfirmed dishes count as one container each.' : ''}
        {' '}Counts live in Money → Packaging.
      </div>
    )}
    {/* T1: Sunday deadline pressure + intake vs a normal week. Pure
        information, never blocking — Kevin already knows his own
        deadline; this just puts the countdown where he's looking. */}
    {deadlineMs > 0 && deadlineMs < 3 * 86400000 && (
      <div style={{ background: 'rgba(212,160,80,0.10)', border: '1px solid #D4A050', borderRadius: 10, padding: '9px 12px', marginBottom: 10, fontSize: 12.5, color: '#e8ede9' }}>
        <b style={{ color: '#D4A050' }}>Orders close in {formatCountdown(deadlineMs)}.</b>
        {' '}{intake.thisWeekCount} order{intake.thisWeekCount !== 1 ? 's' : ''} so far this week
        {intake.median != null ? (
          intake.thisWeekCount < intake.median
            ? `, below the usual ${intake.median} — a normal week still has time to catch up.`
            : `, at or above the usual ${intake.median}.`
        ) : '.'}
      </div>
    )}
    </>
  );
}
