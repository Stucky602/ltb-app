// rowan.mjs — the son's food record.
//
// The assertions that matter most are the ones about EXCLUSION and the ones
// about MOVEMENT. Averages must ignore entries flagged as unfair tests, because
// a rating given while teething is evidence about a Tuesday; and a dish scored
// low and later scored high has to be detectable, because that pattern is the
// entire reason this stores a series instead of a current opinion.

import { makeEntry, addEntry, ageAt, formatAge, seriesFor, dishSummary, topDishes, coverage, untried, writtenEntries,
  attachCapsule, editTranscript, normalizeCapsule, capsuleTimeline, capsuleCount } from '../src/rowan.js';
let p=0,f=0; const ok=(n,c,x)=>{c?(p++,console.log('  ✓ '+n)):(f++,console.log('  ✗ '+n+(x?' — '+x:'')));};
ok('age at birth month is 0', ageAt('2024-12-15T00:00:00Z')===0);
ok('19 months later reads right', ageAt('2026-07-10T00:00:00Z')===19, String(ageAt('2026-07-10T00:00:00Z')));
ok('formats months under a year', formatAge(7)==='7m');
ok('formats years and months', formatAge(19)==='1y 7m', formatAge(19));
ok('formats whole years', formatAge(24)==='2y');
ok('before birth reads null', ageAt('2024-01-01T00:00:00Z')===null);
let log=[];
for (const [r,at,fair] of [[2,'2026-01-10',true],[1,'2026-03-10',true],[5,'2026-07-10',true],[1,'2026-07-12',false]])
  log=addEntry(log, makeEntry({dish:'Bo Ssam', rating:r, note:'n', at:new Date(at).toISOString(), fairTest:fair}));
const s=dishSummary(log,'Bo Ssam');
ok('series keeps every entry including the unfair one', s.entries===4);
ok('the average excludes the unfair test', Math.abs(s.average-(2+1+5)/3)<1e-9, String(s.average));
ok('it counts what it excluded', s.excluded===1);
ok('spots a dish he came around on', s.cameAround===true);
ok('does not claim he went off it', s.wentOff===false);
ok('stamps age on each entry', log[0].ageMonths===13, String(log[0].ageMonths));
const t=topDishes(log);
ok('top dishes ignores unfair entries', t[0].entries===3, JSON.stringify(t));
log=addEntry(log, makeEntry({dish:'Pappardelle', rating:5, at:new Date('2026-06-01').toISOString()}));
ok('top dishes ranks by average', topDishes(log)[0].dish==='Pappardelle');
const c=coverage(log,['Bo Ssam','Pappardelle','Steak au Poivre']);
ok('coverage counts tried vs total', c.tried===2 && c.total===3 && c.pct===67, JSON.stringify(c));
ok('untried lists the worklist', untried(log,['Bo Ssam','Pappardelle','Steak au Poivre'])[0]==='Steak au Poivre');
log=addEntry(log, makeEntry({dish:'Bo Ssam', rating:4, familyNote:'he ate a whole bowl today', at:new Date('2026-07-20').toISOString()}));
ok('family notes are retrievable on their own', writtenEntries(log,{familyOnly:true}).length===1);
ok('family note is stored apart from the food note', writtenEntries(log,{familyOnly:true})[0].note==='');
const off=[]; let l2=[];
for (const [r,at] of [[5,'2026-01-10'],[5,'2026-02-10'],[1,'2026-07-10']]) l2=addEntry(l2, makeEntry({dish:'Bo Ssam',rating:r,at:new Date(at).toISOString()}));
ok('spots a dish he went off', dishSummary(l2,'Bo Ssam').wentOff===true);
ok('ratings clamp to 1-5', makeEntry({dish:'X',rating:99}).rating===5 && makeEntry({dish:'X',rating:-4}).rating===1);

// ── VOICE CAPSULES ──────────────────────────────────────────────────────────
//
// THE PROPERTY: the recording is the artifact, the transcript is a convenience
// beside it. A capsule is a child's voice at an age, recorded once. Anything
// that lets a text edit reach the audio is the failure this section prevents.
{
  const cap = { mediaKey: 'rowan_abc123.webm', contentType: 'audio/webm', seconds: 12, bytes: 40000, checksum: 'deadbeef' };
  let log = addEntry([], makeEntry({ dish: 'Bolognese', rating: 5, at: '2026-01-02T00:00:00.000Z' }));
  const id = log[0].id;

  ok('an entry logs fine with no capsule at all', log[0].capsule === null,
    'the recording is optional and there is deliberately no prompt for it');

  log = attachCapsule(log, id, cap);
  ok('a capsule attaches after the fact', !!log[0].capsule && log[0].capsule.mediaKey === 'rowan_abc123.webm',
    'the entry saves first and the upload lands later, so a slow network costs the audio and never the rating');

  log = editTranscript(log, id, 'he said it was too spicy');
  const c = log[0].capsule;
  ok('editing the transcript stores the words', c.transcript === 'he said it was too spicy');
  ok('and stamps that they were edited', !!c.transcriptEditedAt,
    'a later reader must be able to tell the words were tidied and the recording was not');
  ok('editing the transcript CANNOT touch the recording',
    c.mediaKey === cap.mediaKey && c.bytes === cap.bytes && c.checksum === cap.checksum && c.seconds === cap.seconds,
    'audio is primary, text sits beside it');

  ok('a capsule with no mediaKey is refused rather than stored half-formed',
    normalizeCapsule({ transcript: 'words but no audio' }) === null);
  ok('editTranscript on an entry with no capsule is a no-op',
    editTranscript([{ id: 'x', capsule: null }], 'x', 'hi')[0].capsule === null);

  let multi = addEntry([], makeEntry({ dish: 'Chili', rating: 4, at: '2026-03-01T00:00:00.000Z' }));
  multi = addEntry(multi, makeEntry({ dish: 'Gumbo', rating: 3, at: '2026-02-01T00:00:00.000Z' }));
  multi = attachCapsule(multi, multi.find(e => e.dish === 'Chili').id, cap);
  multi = attachCapsule(multi, multi.find(e => e.dish === 'Gumbo').id, cap);
  const tl = capsuleTimeline(multi);
  ok('the timeline is oldest first', tl.length === 2 && tl[0].dish === 'Gumbo',
    'played in order is how the change over years shows; any other sort loses it');
  ok('entries without a capsule stay out of the timeline',
    capsuleTimeline(addEntry(multi, makeEntry({ dish: 'Bo Ssam', rating: 5 }))).length === 2);
  ok('capsuleCount agrees with the timeline', capsuleCount(multi) === 2);
}

console.log(f===0?'\nROWAN: ALL PASS':`\nROWAN: ${f} FAILURES`); process.exit(f?1:0);
