// tests/capture_inbox.mjs — capture must succeed BEFORE classification.
//
// THE PROPERTY THIS FILE EXISTS TO PROTECT
//
// Every other capture surface in this app asks a question first: which dish,
// which entry type, is this private. A question asked before the artifact is
// safe is how the artifact gets lost — Kevin is one-handed in a checkout line,
// and the screenshot is gone the moment he taps away to think about where it
// belongs. So the assertions below are mostly about what does NOT happen at
// save time: no destination, no dish, no type, no privacy decision.
//
// The second property is that raw is IMMUTABLE. Filing derives and links back;
// it never rewrites what arrived. Discarding marks rather than erases, because
// "I decided this was not worth keeping" is recoverable from and "this was
// never captured" is not.

import {
  emptyInbox, normalizeInbox, addCapture, fileCapture, discardCapture,
  markMediaStored, unsortedCaptures, pendingMediaCaptures, inboxCounts,
  proposeFor, captureId, CAPTURE_SOURCES, FILE_DESTINATIONS,
} from '../src/captureInbox.js';

let failed = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.log(`  ✗ ${label}`); if (detail) console.log(`      ${detail}`); }
};

// ── Save before classification, from every route ────────────────────────────
{
  for (const source of CAPTURE_SOURCES) {
    const s = addCapture(emptyInbox(), { source, raw: { text: 'something worth keeping' } });
    const it = s.items[0];
    ok(`a capture from "${source}" lands with its payload intact`,
      !!it && it.raw.text === 'something worth keeping' && it.source === source);
    ok(`  and carries NO classification`,
      !!it && it.status === 'unsorted' && it.filedAs === null,
      'a destination chosen at save time is a question asked before the thing was safe');
  }

  const empty = addCapture(emptyInbox(), { source: 'app', raw: { text: '   ' } });
  ok('an empty capture is refused rather than stored as a blank',
    empty.items.length === 0);

  const url = addCapture(emptyInbox(), { source: 'app', raw: { url: 'https://example.com/x' } });
  ok('a bare link is enough to capture', url.items.length === 1);
  const media = addCapture(emptyInbox(), { source: 'share', raw: { mediaRefs: ['capture_a.webp'] } });
  ok('a bare image is enough to capture', media.items.length === 1);
}

// ── Idempotency: a retried Shortcut post is not a second item ───────────────
{
  const once = addCapture(emptyInbox(), { id: 'cap_fixed', source: 'shortcut', raw: { text: 'x' } });
  const twice = addCapture(once, { id: 'cap_fixed', source: 'shortcut', raw: { text: 'x' } });
  ok('the same capture id cannot land twice',
    twice.items.length === 1,
    'a Shortcut on a bad connection retries; a retry must overwrite itself, not double-triage');
  ok('generated ids are unique', captureId() !== captureId());
}

// ── Raw is immutable ────────────────────────────────────────────────────────
{
  let s = addCapture(emptyInbox(), { source: 'app', raw: { text: 'the original words' } });
  const id = s.items[0].id;
  s = fileCapture(s, id, { destination: 'journal', recordId: 'j_123' });
  const it = normalizeInbox(s).items[0];
  ok('filing records where it went',
    it.status === 'filed' && it.filedAs.destination === 'journal' && it.filedAs.recordId === 'j_123');
  ok('and leaves the original text untouched',
    it.raw.text === 'the original words',
    'the derived record is a copy; the capture stays as evidence of what arrived');
  ok('filing stamps when', !!it.filedAs.at);

  const discarded = discardCapture(s, id);
  ok('discarding MARKS rather than erases',
    normalizeInbox(discarded).items.length === 1 &&
    normalizeInbox(discarded).items[0].status === 'discarded',
    'a mistaken discard has to be recoverable');
}

// ── Media stays out of the store until it is real ───────────────────────────
{
  let s = addCapture(emptyInbox(), { source: 'share', raw: { text: 'a photo' }, media: 'pending' });
  const id = s.items[0].id;
  ok('an item awaiting upload is findable', pendingMediaCaptures(s).length === 1);
  s = markMediaStored(s, id, ['capture_abc.webp']);
  const it = normalizeInbox(s).items[0];
  ok('once uploaded it points at R2 by key',
    it.media === 'r2' && it.raw.mediaRefs[0] === 'capture_abc.webp',
    'bytes never enter this store; localStorage is five megabytes and order photos already strain it');
  ok('and it is no longer pending', pendingMediaCaptures(s).length === 0);
}

// ── Proposals are guesses, and honest about it ──────────────────────────────
{
  const dishes = ['Bolognese', 'Bo Ssam'];
  const link = { raw: { text: '', url: 'https://example.com/recipe', mediaRefs: [] } };
  ok('a bare link proposes a source',
    proposeFor(link, dishes).destination === 'source');

  const withDish = { raw: { text: 'the Bolognese milk trick', url: '', mediaRefs: [] } };
  const p = proposeFor(withDish, dishes);
  ok('text naming a dish proposes a journal entry against that dish',
    p.destination === 'journal' && p.dishId === 'Bolognese');
  ok('and every proposal explains itself',
    !!p.why && /Bolognese/.test(p.why),
    'a suggestion Kevin cannot explain is worse than none in a flow whose job is deciding what something IS');

  ok('no honest guess yields NO proposal rather than a shrug',
    proposeFor({ raw: { text: 'zzz nothing recognisable', url: '', mediaRefs: [] } }, dishes) === null);

  // The property that matters most about proposals.
  const s = addCapture(emptyInbox(), { source: 'app', raw: { text: 'the Bolognese milk trick' } });
  ok('a proposal is NEVER applied automatically',
    s.items[0].status === 'unsorted' && s.items[0].filedAs === null,
    'a guess that files itself is the model deciding what Kevin meant');
}

// ── Store hygiene ───────────────────────────────────────────────────────────
{
  ok('a malformed store normalizes to empty',
    normalizeInbox({ items: 'no' }).items.length === 0 && normalizeInbox(null).items.length === 0);
  ok('an unknown source falls back rather than being stored as-is',
    normalizeInbox({ items: [{ id: 'a', source: 'evil', raw: { text: 'x' } }] }).items[0].source === 'app');
  ok('an unknown status falls back to unsorted',
    normalizeInbox({ items: [{ id: 'a', status: 'weird', raw: { text: 'x' } }] }).items[0].status === 'unsorted');

  let s = emptyInbox();
  s = addCapture(s, { source: 'app', raw: { text: 'one' } });
  s = addCapture(s, { source: 'app', raw: { text: 'two' } });
  s = fileCapture(s, s.items[0].id, { destination: 'journal' });
  const c = inboxCounts(s);
  ok('counts add up', c.total === 2 && c.filed === 1 && c.unsorted === 1);
  ok('unsortedCaptures returns only what still needs a decision',
    unsortedCaptures(s).length === 1);
  ok('every file destination has a label the UI can show',
    FILE_DESTINATIONS.every(d => d.id && d.label));
}

console.log(failed === 0 ? '\nCAPTURE INBOX: ALL PASS' : `\nCAPTURE INBOX: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
