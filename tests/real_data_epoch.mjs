// real_data_epoch.mjs — the line between order history that HAPPENED and order
// history that was TYPED IN.
//
// WHY THE SAFETY PROPERTIES MATTER MORE THAN THE DETECTOR
// A wrong epoch silently corrupts every feature that depends on it, and the
// failure is invisible: counts just quietly exclude real orders. So the tests
// that matter most here are not "does it find the seam" but "does it refuse to
// guess". With no epoch confirmed, NOTHING changes anywhere — that is what
// makes this safe to ship before Kevin has looked at it.

import { proposeEpoch, isBackfilled, stampBackfilled, realOrdersOnly, epochSummary } from '../src/realDataEpoch.js';
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){pass++;console.log('  ✓ '+n);} else {fail++;console.log('  ✗ '+n+(x?' — '+x:''));} };
const DAY=86400000, WEEK=7*DAY;
const mk=(iso)=>({ id:Math.random().toString(36).slice(2), createdAt:new Date(iso).toISOString() });
const at=(base,days)=>mk(base+days*DAY);

// A realistic history: sparse remembered months, a gap, then regular weekly live.
const T0=Date.parse('2026-01-05');
const remembered=[0,21,60,95,130].map(d=>at(T0,d));            // ~monthly, patchy
const gapThen=Date.parse('2026-06-03');
const live=[];
for(let w=0;w<8;w++) live.push(mk(gapThen+w*WEEK));
{
  const r=proposeEpoch([...remembered,...live]);
  ok('detects the seam in a sparse-then-weekly history', r.proposed!==null, JSON.stringify(r).slice(0,140));
  ok('lands on the start of live operation, within a week',
     r.proposed && Math.abs(Date.parse(r.proposed)-gapThen)<=WEEK, r.proposed);
  ok('reports high confidence when gap and cadence agree', r.confidence==='high', r.confidence+': '+r.reason);
  ok('shows its evidence', r.evidence && r.evidence.largestGapDays>20, JSON.stringify(r.evidence));
}
// A fully live history has no seam and must NOT invent one.
{
  const all=[]; for(let w=0;w<20;w++) all.push(mk(T0+w*WEEK));
  const r=proposeEpoch(all);
  ok('a continuous weekly history proposes nothing', r.proposed===null, r.confidence+': '+r.reason);
}
// Too little data must decline rather than guess.
{
  const r=proposeEpoch([at(T0,0),at(T0,7),at(T0,14)]);
  ok('declines on too little history', r.proposed===null && r.confidence==='none');
  ok('says why it declined', /enough/i.test(r.reason), r.reason);
}
// No epoch = nothing changes. This is the safety property.
{
  const orders=[...remembered,...live];
  ok('with no epoch, nothing is backfilled', orders.every(o=>!isBackfilled(o,null)));
  ok('with no epoch, realOrdersOnly returns everything', realOrdersOnly(orders,null).length===orders.length);
  ok('with no epoch, stampBackfilled is a no-op by identity', stampBackfilled(orders,null)===orders);
  ok('with no epoch, the summary says so', epochSummary(orders,null).label==='all recorded orders');
}
// With an epoch, the split is clean and idempotent.
{
  const orders=[...remembered,...live];
  const epoch=new Date(gapThen).toISOString();
  const stamped=stampBackfilled(orders,epoch);
  ok('stamps exactly the remembered orders', stamped.filter(o=>o.backfilled).length===remembered.length,
     String(stamped.filter(o=>o.backfilled).length));
  ok('leaves the live orders unstamped', stamped.filter(o=>!o.backfilled).length===live.length);
  ok('stamping is idempotent by identity', stampBackfilled(stamped,epoch)===stamped);
  ok('realOrdersOnly drops the backfilled ones', realOrdersOnly(stamped,epoch).length===live.length);
  const s=epochSummary(stamped,epoch);
  ok('the summary counts both sides', s.real===live.length && s.backfilled===remembered.length, JSON.stringify(s));
}
// An explicit stamp beats the date, so a hand-correction sticks.
{
  const o={ id:'x', createdAt:new Date(gapThen+WEEK).toISOString(), backfilled:true };
  ok('an explicit backfilled flag wins over the date', isBackfilled(o,new Date(gapThen).toISOString()));
}
console.log(fail === 0 ? '\nREAL DATA EPOCH: ALL PASS' : `\nREAL DATA EPOCH: ${fail} FAILURES`);
process.exit(fail?1:0);
