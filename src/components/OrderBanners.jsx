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

// The container and deadline strips are DISMISSIBLE, and dismissal is keyed
// rather than permanent. The deadline strip is keyed to the week, so closing it
// buys back the screen now and it returns next week when it means something
// again. The container strip is keyed to the SHORTAGE ITSELF, so dismissing
// "short 4 of the 32oz round" does not also silence a different shortage that
// appears tomorrow. Permanent dismissal was the wrong shape here: both of these
// are warnings, and a warning you can switch off forever is one you will
// eventually switch off and regret.
export function OrderBanners({
  weekRollover, markWeekSeen, containerStatus, deadlineMs, intake,
  dismissed, onDismiss,
}) {
  const shortageKey = containerStatus && containerStatus.shortages && containerStatus.shortages.length
    ? 'containers:' + containerStatus.shortages.map(s => `${s.label}:${s.need}/${s.have}`).join(',')
    : null;
  const deadlineKey = 'deadline:' + new Date().toISOString().slice(0, 10);
  const isDismissed = (k) => !!(k && dismissed && dismissed[k]);
  const closeBtn = (k) => (
    <button
      onClick={(e) => { e.stopPropagation(); onDismiss(k); }}
      aria-label="Dismiss"
      style={{
        position: 'absolute', top: 4, right: 6, background: 'none', border: 'none',
        color: 'inherit', opacity: 0.65, fontSize: 17, lineHeight: 1, cursor: 'pointer',
        padding: '2px 6px',
      }}
    >
      &times;
    </button>
  );
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
    {containerStatus.shortages.length === 0 && (containerStatus.atRisk || []).length > 0 && !isDismissed('containers:atrisk') && (
      <div style={{ position: 'relative', background: 'rgba(239,159,39,0.10)', border: '1px solid #EF9F27', borderRadius: 10, padding: '9px 26px 9px 12px', marginBottom: 10, fontSize: 12.5, color: '#e8ede9' }}>
        {closeBtn('containers:atrisk')}
        <b style={{ color: '#EF9F27' }}>Containers might be tight:</b>
        {' '}{containerStatus.atRisk.map(r => r.label).join(', ')}.
        {' '}{containerStatus.audit.unconfirmed.length} dinner{containerStatus.audit.unconfirmed.length === 1 ? '' : 's'} still
        {' '}count as one container each because their real composition has not been confirmed,
        {' '}so this week's demand is a floor, not a figure. Record tab &rarr; Container audit.
      </div>
    )}
    {containerStatus.shortages.length > 0 && !isDismissed(shortageKey) && (
      <div style={{ position: 'relative', background: 'rgba(224,130,138,0.10)', border: '1px solid #e0828a', borderRadius: 10, padding: '9px 26px 9px 12px', marginBottom: 10, fontSize: 12.5, color: '#e8ede9' }}>
        {closeBtn(shortageKey)}
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
    {deadlineMs > 0 && deadlineMs < 3 * 86400000 && !isDismissed(deadlineKey) && (
      <div style={{ position: 'relative', background: 'rgba(212,160,80,0.10)', border: '1px solid #D4A050', borderRadius: 10, padding: '9px 26px 9px 12px', marginBottom: 10, fontSize: 12.5, color: '#e8ede9' }}>
        {closeBtn(deadlineKey)}
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
