import React, { useState, useMemo } from 'react';
import {
  dossierCoverage, dossierComposition, entriesOnThisDay, orphanedDishNames,
  principleIndex, UNNAMED_PRINCIPLE, recentlyDeleted, restoreEntry,
  JOURNAL_TYPES, JOURNAL_TYPE_ORDER,
} from '../journal.js';
import { weeklyDossierPrompt } from '../dossierPrompts.js';
import { currentWeekInfo } from '../timeBanners.js';
import { sameMonthPreviousYears } from '../weekLedger.js';
import { buildArchiveHtml, buildRecordsHtml } from '../archiveExport.js';
import { buildBundleManifest, BUNDLE_README } from '../visualCues.js';
import { buildChronicle } from '../chronicle.js';
import { buildZip } from '../zipWriter.js';
import { WORKER_BASE, PUBLISH_TOKEN } from '../config.js';
import { DISH_RENAMES } from '../utils.js';
import { parseImport, candidateToEntry, importSummary, IMPORT_FORMAT_HELP } from '../journalImport.js';
import { addEntry } from '../journal.js';
import { styles } from '../styles.js';
import { addPractice, updatePractice } from '../practices.js';
import { searchCorpus, CORPUS_KINDS, KIND_LABELS } from '../corpus.js';
import {
  addCapture, fileCapture, discardCapture, unsortedCaptures, inboxCounts,
  proposeFor, FILE_DESTINATIONS,
} from '../captureInbox.js';
import { WALKS, recordWalkAnswer, walkProgress } from '../walks.js';
import { addTerm, updateTerm, termCounts } from '../terms.js';
import {
  flagRecord, resolveClarification, dismissClarification,
  clarificationsByReason, clarificationCounts, READER_REASONS,
} from '../clarifications.js';
import { WalkEngine } from './WalkEngine.jsx';

// The Record tab. NOT a new feature: a restructure.
//
// The app was architected as an order tracker with a knowledge base bolted on.
// The archive lived as a button inside the Money tab, the weekly question was
// one section out of eleven in the Monday briefing, and the coverage of the
// whole record was not visible anywhere. Meanwhile the stated purpose of the
// thing is the reverse: a structured body of how Kevin cooks, which currently
// earns its keep by running a meal-prep business.
//
// So the shape of the app now matches the purpose of the app. Everything that
// reads ACROSS the record lives here. Writing a single dish's entry stays in
// the Recipes tab, deliberately, because you write about a dish while looking
// at that dish.
//
// Three groups, in the order the work actually happens:
//   WRITE — what to add next
//   READ  — what the record already says
//   KEEP  — making sure it survives
const C = { panel: '#1c2422', border: '#2d3a36', text: '#e8ede9', dim: '#9aa5a0', faint: '#6b7570', good: '#5DCAA5', warn: '#EF9F27', gold: '#D4A050', bad: '#e0828a' };
const S = {
  wrap: { padding: '4px 0 40px' },
  group: { fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: 1, textTransform: 'uppercase', margin: '18px 0 6px' },
  card: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, margin: '8px 0' },
  h: { fontSize: 12, fontWeight: 700, color: C.good, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  p: { fontSize: 12.5, color: C.text, lineHeight: 1.5, margin: '3px 0' },
  dim: { color: C.dim },
  faint: { fontSize: 11, color: C.faint },
  btn: (accent) => ({ minHeight: 44, padding: '10px 16px', borderRadius: 8, border: `1px solid ${accent || C.border}`, background: '#232d2a', color: accent || C.text, fontWeight: 700, fontSize: 13, cursor: 'pointer' }),
  chipRow: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 },
};

const fmtDate = (ts) => { try { return new Date(ts).toLocaleDateString(); } catch { return ''; } };






// ── FUTURE READER TEST ──────────────────────────────────────────────────────
// The queue of records somebody could not follow. Grouped by reason because
// that is how they get answered efficiently: every "which version does this
// apply to" is the same job done six times.
//
// Answering records the answer HERE and does not touch the flagged record.
// Improving the original is a separate, deliberate edit where that record
// lives, not a side effect of clearing a queue.
function ClarificationsPane({ store, onSave, corpus }) {
  const [answering, setAnswering] = useState(null);
  const [draft, setDraft] = useState('');
  const [flagging, setFlagging] = useState(false);
  const [pick, setPick] = useState('');
  const [reason, setReason] = useState('');
  const groups = clarificationsByReason(store);
  const counts = clarificationCounts(store);

  return (
    <div style={S.card}>
      <div style={S.h}>Hard to follow</div>
      <div style={S.faint}>
        {counts.open > 0
          ? `${counts.open} record${counts.open === 1 ? '' : 's'} somebody could not follow.`
          : 'Mark anything a later reader would not be able to act on. Nothing here edits what you wrote.'}
      </div>

      {flagging ? (
        <>
          <select value={pick} onChange={e => setPick(e.target.value)}
            style={{ width: '100%', marginTop: 8, boxSizing: 'border-box', background: '#14201d',
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 8, fontSize: 12.5 }}>
            <option value="">Which record?</option>
            {(corpus || []).slice(0, 200).map(r => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
          <select value={reason} onChange={e => setReason(e.target.value)}
            style={{ width: '100%', marginTop: 6, boxSizing: 'border-box', background: '#14201d',
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 8, fontSize: 12.5 }}>
            <option value="">What is wrong with it?</option>
            {READER_REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button style={S.btn(C.good)} disabled={!pick || !reason} onClick={() => {
              const rec = (corpus || []).find(r => r.id === pick);
              onSave(prev => flagRecord(prev, {
                recordId: pick, recordTitle: rec ? rec.title : '', reason, reader: 'kevin',
              }));
              setFlagging(false); setPick(''); setReason('');
            }}>Flag it</button>
            <button style={S.btn()} onClick={() => setFlagging(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <button style={{ ...S.btn(), marginTop: 8 }} onClick={() => setFlagging(true)}>
          Flag a record
        </button>
      )}

      {groups.map(g => (
        <div key={g.id} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.gold }}>{g.label}</div>
          {g.items.map(c => (
            <div key={c.id} style={{ marginTop: 6 }}>
              <div style={S.p}>{c.recordTitle || c.recordId}</div>
              {c.reader === 'rowan' && <div style={{ ...S.faint, color: C.good }}>Asked by Rowan</div>}
              {answering === c.id ? (
                <>
                  <textarea value={draft} onChange={e => setDraft(e.target.value)}
                    placeholder="What was missing"
                    style={{ width: '100%', minHeight: 54, marginTop: 5, boxSizing: 'border-box',
                      background: '#14201d', border: `1px solid ${C.border}`, borderRadius: 8,
                      color: C.text, padding: 8, fontSize: 12.5 }} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                    <button style={{ ...S.btn(C.good), minHeight: 32, padding: '5px 11px', fontSize: 12 }}
                      onClick={() => { onSave(prev => resolveClarification(prev, c.id, draft)); setAnswering(null); setDraft(''); }}>
                      Save
                    </button>
                    <button style={{ ...S.btn(), minHeight: 32, padding: '5px 11px', fontSize: 12 }}
                      onClick={() => { onSave(prev => dismissClarification(prev, c.id, 'Reads fine as it is.')); setAnswering(null); }}>
                      It is fine as it is
                    </button>
                  </div>
                </>
              ) : (
                <button style={{ ...S.btn(), minHeight: 30, padding: '4px 10px', fontSize: 11.5, marginTop: 4 }}
                  onClick={() => { setAnswering(c.id); setDraft(''); }}>Answer</button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── TERMS OF ART ────────────────────────────────────────────────────────────
// Lives beside Practices because it is the same act: recording something that
// belongs to how Kevin works rather than to one dish. Seeded proposals arrive
// with their source, same contract as the practice drafts.
function TermsPane({ terms, onSave }) {
  const [draft, setDraft] = useState('');
  const [openId, setOpenId] = useState(null);
  const [defDraft, setDefDraft] = useState('');
  const entries = (terms && terms.terms) || [];
  const counts = termCounts(terms);

  const Row = ({ t }) => (
    <div style={{ ...S.card, borderLeft: `3px solid ${t.status === 'confirmed' ? C.good : t.status === 'retired' ? C.faint : C.warn}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.term}</div>
      <div style={{ ...S.p, marginTop: 3 }}>{t.definition}</div>
      {(t.misreadings || []).map((m, i) => (
        // The defensive half. Shown in the warning colour because it exists to
        // stop a specific mistake, not to add detail.
        <div key={i} style={{ ...S.faint, marginTop: 4, color: C.warn }}>Often misread: {m}</div>
      ))}
      {(t.examples || []).map((e, i) => <div key={i} style={{ ...S.faint, marginTop: 2 }}>e.g. {e}</div>)}
      {(t.sources || []).map((src, i) => (
        <div key={i} style={{ ...S.faint, marginTop: 4, fontStyle: 'italic' }}>Source: {src}</div>
      ))}
      {t.history.length > 0 && (
        <div style={{ ...S.faint, marginTop: 5 }}>
          {t.history.length} earlier definition{t.history.length === 1 ? '' : 's'} kept.
        </div>
      )}
      {openId === t.id ? (
        <>
          <textarea
            value={defDraft}
            onChange={e => setDefDraft(e.target.value)}
            style={{ width: '100%', minHeight: 70, marginTop: 6, boxSizing: 'border-box', background: '#14201d',
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 8, fontSize: 12.5 }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button style={S.btn(C.good)} onClick={() => {
              if (defDraft.trim()) onSave(prev => updateTerm(prev, t.id, { definition: defDraft.trim() }));
              setOpenId(null);
            }}>Save wording</button>
            <button style={S.btn()} onClick={() => setOpenId(null)}>Cancel</button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {t.status !== 'confirmed' && (
            <button style={{ ...S.btn(C.good), minHeight: 34, padding: '6px 12px', fontSize: 12 }}
              onClick={() => onSave(prev => updateTerm(prev, t.id, { status: 'confirmed' }))}>
              That is what I mean
            </button>
          )}
          <button style={{ ...S.btn(), minHeight: 34, padding: '6px 12px', fontSize: 12 }}
            onClick={() => { setOpenId(t.id); setDefDraft(t.definition); }}>Reword</button>
          {t.status !== 'retired' && (
            <button style={{ ...S.btn(), minHeight: 34, padding: '6px 12px', fontSize: 12 }}
              onClick={() => onSave(prev => updateTerm(prev, t.id, { status: 'retired' }))}>Not a term</button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div style={S.card}>
        <div style={S.h}>Your words</div>
        <div style={S.faint}>
          What you mean by your own vocabulary, so a future reader does not have to guess.
          {counts.confirmed} confirmed{counts.proposed > 0 ? `, ${counts.proposed} waiting on you` : ''}.
        </div>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="A term to define"
          style={{ width: '100%', marginTop: 8, boxSizing: 'border-box', background: '#14201d',
            border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 8, fontSize: 12.5 }}
        />
        <button style={{ ...S.btn(C.good), marginTop: 6 }} onClick={() => {
          const t = draft.trim();
          if (!t) return;
          onSave(prev => addTerm(prev, { term: t, status: 'confirmed', sources: ['Written by Kevin'] }));
          setDraft('');
        }}>Add</button>
      </div>
      {entries.filter(t => t.status === 'proposed').length > 0 && (
        <>
          <div style={S.h}>Drafts waiting on you</div>
          <div style={{ ...S.faint, marginBottom: 4 }}>
            Read from how you already use these. Not your definition until you say so.
          </div>
          {entries.filter(t => t.status === 'proposed').map(t => <Row key={t.id} t={t} />)}
        </>
      )}
      {entries.filter(t => t.status === 'confirmed').length > 0 && (
        <>
          <div style={{ ...S.h, marginTop: 12 }}>Yours</div>
          {entries.filter(t => t.status === 'confirmed').map(t => <Row key={t.id} t={t} />)}
        </>
      )}
    </>
  );
}

// WALKS PANE REMOVED (Kevin, Aug 2). He does not want walks collected in the
// app: "I need you to actually use the info from the walks to do stuff, so I'd
// rather have the walks in the MD only."
//
// That is the right division. A walk is a conversation, and its ANSWERS become
// rules and data — the two-night walk is the proof: he answered three rules in
// chat and 21 per-dish questions evaporated. An in-app collector invites
// filling in questions one at a time that a single ruling would have deleted.
//
// WalkEngine.jsx and src/walks.js are left in place but unmounted. They are the
// wrong shape for how this actually works, and the honest next step is deleting
// them rather than leaving a second unmounted component to be rediscovered —
// but that is a decision, not a cleanup, so it is recorded rather than taken.

// ── CAPTURE INBOX ───────────────────────────────────────────────────────────
// Sits at the top of Do because that is where the unsorted things are, and
// because an inbox you have to navigate to is an inbox you stop draining.
//
// The capture box asks NOTHING. No dish, no type, no privacy toggle — Save is
// the only control, and everything else happens later during review. That
// ordering is the whole feature.
function CaptureInbox({ inbox, onSave, dishNames }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const items = unsortedCaptures(inbox);
  const counts = inboxCounts(inbox);

  const save = () => {
    const t = text.trim();
    if (!t) return;
    const isUrl = /^https?:\/\/\S+$/i.test(t);
    onSave(prev => addCapture(prev, { source: 'app', raw: isUrl ? { url: t } : { text: t } }));
    setText('');
  };

  return (
    <div style={S.card}>
      <div style={S.h}>Capture</div>
      <div style={S.faint}>
        Paste anything. It saves as it is and you decide what it is later.
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="A note, a link, something you want to keep"
        style={{ width: '100%', minHeight: 54, marginTop: 8, boxSizing: 'border-box', background: '#14201d',
          border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 8, fontSize: 12.5 }}
      />
      <button style={{ ...S.btn(C.good), marginTop: 6 }} onClick={save}>Save</button>

      {counts.unsorted > 0 && (
        <>
          <button
            onClick={() => setOpen(o => !o)}
            style={{ ...S.btn(C.gold), width: '100%', marginTop: 10, minHeight: 38, fontSize: 12.5 }}
          >
            {counts.unsorted} waiting to be sorted {open ? '▲' : '▼'}
          </button>
          {open && items.map(it => (
            <CaptureRow key={it.id} item={it} onSave={onSave} dishNames={dishNames} />
          ))}
        </>
      )}
      {counts.pendingMedia > 0 && (
        <div style={{ ...S.faint, marginTop: 6, color: C.warn }}>
          {counts.pendingMedia} picture{counts.pendingMedia === 1 ? '' : 's'} still uploading.
        </div>
      )}
    </div>
  );
}

function CaptureRow({ item, onSave, dishNames }) {
  const proposal = useMemo(() => proposeFor(item, dishNames || []), [item, dishNames]);
  const [dest, setDest] = useState((proposal && proposal.destination) || '');
  return (
    <div style={{ ...S.card, background: '#161d1b' }}>
      <div style={S.faint}>{fmtDate(item.capturedAt)} · from {item.source}</div>
      {item.raw.url && <div style={{ ...S.p, wordBreak: 'break-all' }}>{item.raw.url}</div>}
      {item.raw.text && <div style={S.p}>{item.raw.text.slice(0, 500)}</div>}
      {item.raw.mediaRefs.length > 0 && (
        <div style={S.faint}>{item.raw.mediaRefs.length} attachment{item.raw.mediaRefs.length === 1 ? '' : 's'}</div>
      )}
      {proposal && (
        // A GUESS, LABELLED. It prefills the dropdown and says why, and it is
        // never applied without a tap. Correcting a wrong guess is faster than
        // choosing from cold; being told it is a guess is what keeps it honest.
        <div style={{ ...S.faint, marginTop: 4, color: C.warn }}>
          Guess: {proposal.why} Change it if that is wrong.
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <select
          value={dest}
          onChange={e => setDest(e.target.value)}
          style={{ flex: 1, minWidth: 130, background: '#14201d', border: `1px solid ${C.border}`,
            borderRadius: 8, color: C.text, padding: 8, fontSize: 12.5 }}
        >
          <option value="">File as…</option>
          {FILE_DESTINATIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        <button
          style={{ ...S.btn(C.good), minHeight: 34, padding: '6px 12px', fontSize: 12 }}
          disabled={!dest}
          onClick={() => dest && onSave(prev => fileCapture(prev, item.id, { destination: dest }))}
        >File</button>
        <button
          style={{ ...S.btn(), minHeight: 34, padding: '6px 12px', fontSize: 12 }}
          onClick={() => onSave(prev => discardCapture(prev, item.id))}
        >Discard</button>
      </div>
    </div>
  );
}

// ── PRACTICES ───────────────────────────────────────────────────────────────
// Kevin's own working practices. The whole design point is the status: a
// PROPOSED entry is a draft Claude assembled from something he said, and it is
// not canon until he confirms it. Proposals are visually distinct and never
// counted as his word anywhere else in the app.
function PracticesPane({ practices, onSave }) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const entries = (practices && practices.entries) || [];
  const proposed = entries.filter(e => e.status === 'proposed');
  const confirmed = entries.filter(e => e.status === 'confirmed');
  const retired = entries.filter(e => e.status === 'retired');

  const setStatus = (id, status) => onSave(prev => updatePractice(prev, id, { status }));
  const saveEdit = (id) => {
    const t = editText.trim();
    if (t) onSave(prev => updatePractice(prev, id, { text: t }));
    setEditing(null); setEditText('');
  };

  const Row = ({ e }) => (
    <div style={{ ...S.card, borderLeft: `3px solid ${e.status === 'confirmed' ? C.good : e.status === 'retired' ? C.faint : C.warn}` }}>
      {editing === e.id ? (
        <>
          <textarea
            value={editText}
            onChange={ev => setEditText(ev.target.value)}
            style={{ width: '100%', minHeight: 70, boxSizing: 'border-box', background: '#14201d',
              border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 8, fontSize: 12.5 }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button style={S.btn(C.good)} onClick={() => saveEdit(e.id)}>Save</button>
            <button style={S.btn()} onClick={() => { setEditing(null); setEditText(''); }}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div style={S.p}>{e.text}</div>
          {e.why && <div style={{ ...S.faint, marginTop: 4 }}>{e.why}</div>}
          {e.where && <div style={{ ...S.faint, marginTop: 2 }}>Where: {e.where}</div>}
          {(e.sources || []).map((src, i) => (
            <div key={i} style={{ ...S.faint, marginTop: 4, fontStyle: 'italic' }}>Source: {src}</div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {e.status !== 'confirmed' && (
              <button style={{ ...S.btn(C.good), minHeight: 34, padding: '6px 12px', fontSize: 12 }}
                onClick={() => setStatus(e.id, 'confirmed')}>
                {e.status === 'proposed' ? 'This is right' : 'Bring back'}
              </button>
            )}
            <button style={{ ...S.btn(), minHeight: 34, padding: '6px 12px', fontSize: 12 }}
              onClick={() => { setEditing(e.id); setEditText(e.text); }}>Reword</button>
            {e.status !== 'retired' && (
              <button style={{ ...S.btn(), minHeight: 34, padding: '6px 12px', fontSize: 12 }}
                onClick={() => setStatus(e.id, 'retired')}>Not how I work</button>
            )}
          </div>
          {e.lastConfirmedAt && (
            <div style={{ ...S.faint, marginTop: 6 }}>Confirmed {fmtDate(e.lastConfirmedAt)}</div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <div style={S.card}>
        <div style={S.h}>How you work</div>
        <div style={S.faint}>
          Things that belong to no single dish. {confirmed.length} confirmed
          {proposed.length > 0 ? `, ${proposed.length} waiting on you` : ''}.
        </div>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Add one in your own words"
          style={{ width: '100%', minHeight: 60, marginTop: 8, boxSizing: 'border-box', background: '#14201d',
            border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 8, fontSize: 12.5 }}
        />
        <button
          style={{ ...S.btn(C.good), marginTop: 6 }}
          onClick={() => {
            const t = draft.trim();
            if (!t) return;
            onSave(prev => addPractice(prev, { text: t, status: 'confirmed', sources: ['Written by Kevin'] }));
            setDraft('');
          }}
        >Add</button>
      </div>

      {proposed.length > 0 && (
        <>
          <div style={S.h}>Drafts waiting on you</div>
          <div style={{ ...S.faint, marginBottom: 4 }}>
            Assembled from things you have said, with the source on each. Not counted as
            yours until you say so.
          </div>
          {proposed.map(e => <Row key={e.id} e={e} />)}
        </>
      )}
      {confirmed.length > 0 && (
        <>
          <div style={{ ...S.h, marginTop: 12 }}>Yours</div>
          {confirmed.map(e => <Row key={e.id} e={e} />)}
        </>
      )}
      {retired.length > 0 && (
        <>
          <div style={{ ...S.h, marginTop: 12 }}>No longer how you work</div>
          <div style={{ ...S.faint, marginBottom: 4 }}>Kept: when something stopped being true is worth knowing.</div>
          {retired.map(e => <Row key={e.id} e={e} />)}
        </>
      )}
    </>
  );
}

// ── ASK THE RECORD ──────────────────────────────────────────────────────────
// Deterministic search over everything the record holds. It returns RECORDS,
// never an answer it composed. When nothing matches it says so and stops, which
// is the property that makes the hits worth trusting.
function AskPane({ corpus }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const results = useMemo(
    () => (q.trim() || kind ? searchCorpus(corpus, q, { kinds: kind ? [kind] : null }) : []),
    [corpus, q, kind]);
  const asked = !!(q.trim() || kind);

  return (
    <>
      <div style={S.card}>
        <div style={S.h}>Ask the record</div>
        <div style={S.faint}>
          Searches {corpus.length} records: the journal, practices, recipe versions, the reheat
          walk, the Chronicle, cues, and Rowan. It only ever shows you what is written down.
        </div>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="e.g. ice in the squash bag"
          style={{ width: '100%', marginTop: 8, boxSizing: 'border-box', background: '#14201d',
            border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 9, fontSize: 13 }}
        />
        <div style={S.chipRow}>
          {['', ...CORPUS_KINDS].map(k => (
            <button
              key={k || 'all'}
              onClick={() => setKind(k)}
              style={{ ...S.btn(kind === k ? C.gold : C.border), minHeight: 30, padding: '5px 10px', fontSize: 11.5 }}
            >{k ? KIND_LABELS[k] : 'Everything'}</button>
          ))}
        </div>
      </div>

      {asked && results.length === 0 && (
        <div style={S.card}>
          <div style={S.p}>The record has nothing matching that.</div>
          <div style={S.faint}>
            It is not guessing on your behalf. If you know it happened, it was never written
            down, and that is worth knowing on its own.
          </div>
        </div>
      )}

      {results.map(r => (
        <div key={r.id} style={S.card}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: C.gold, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {KIND_LABELS[r.kind] || r.kind}
            </span>
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: C.text }}>{r.title}</span>
            {r.date && <span style={S.faint}>{fmtDate(r.date)}</span>}
          </div>
          {r.excerpt && <div style={{ ...S.p, marginTop: 4 }}>{r.excerpt}</div>}
        </div>
      ))}
    </>
  );
}

export function RecordTab({
  journal, onSaveJournal, dishNames, weekDishes, orders, knownNames,
  weekLedger, askLog, onPullQuestions, copiesNote, onSaveCopiesNote, containerAudit, archiveHistory, onArchiveDownloaded,
  onAnswerQuestion,
  practices, onSavePractices, corpus,
  captureInbox, onSaveCapture, dishNames: allDishNames,
  ingredients,
  terms, onSaveTerms,
  clarifications, onSaveClarifications,
  realDataEpoch, epochProposal, epochSummary, onConfirmEpoch,
  ranking, rankingDrift, tasteVsSales, tasteVsSon, rankingStale,
  patterns, tasteVsPractice, visualCues, amendments,
}) {
  const [msg, setMsg] = useState(null);
  const [sub, setSub] = useState('do');
  const [showEpochDetail, setShowEpochDetail] = useState(false);
  const [showAllCoverage, setShowAllCoverage] = useState(false);
  const [noteDraft, setNoteDraft] = useState(null);
  const [paste, setPaste] = useState('');
  const [showImport, setShowImport] = useState(false);
  const candidates = useMemo(() => (paste.trim() ? parseImport(paste) : []), [paste]);
  const impSummary = useMemo(() => importSummary(candidates), [candidates]);

  const wk = useMemo(() => currentWeekInfo(), []);
  const [answer, setAnswer] = useState('');
  const [answerType, setAnswerType] = useState('technique');
  const [answered, setAnswered] = useState(false);
  const [manualEpoch, setManualEpoch] = useState('');
  const question = useMemo(() => weeklyDossierPrompt(journal, weekDishes || [], wk.stamp), [journal, weekDishes, wk]);
  const coverage = useMemo(() => dossierCoverage(journal, dishNames || [], DISH_RENAMES), [journal, dishNames]);
  const composition = useMemo(() => dossierComposition(journal), [journal]);
  const onThisDay = useMemo(() => entriesOnThisDay(journal, new Date(), DISH_RENAMES), [journal]);
  const orphans = useMemo(() => orphanedDishNames(orders || [], knownNames || new Set(), DISH_RENAMES), [orders, knownNames]);
  const principles = useMemo(() => principleIndex(journal, DISH_RENAMES), [journal]);
  const undoable = useMemo(() => recentlyDeleted(journal), [journal]);
  const season = useMemo(() => sameMonthPreviousYears(weekLedger, new Date()), [weekLedger]);

  const downloadDoc = (html, filename, label, after) => {
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setMsg(`${label} downloaded. It opens in any browser, with or without this app, and prints clean.`);
      if (typeof after === 'function') after();
    } catch (e) {
      setMsg(`${label} failed to build. Nothing was changed.`);
    }
    setTimeout(() => setMsg(null), 6000);
  };

  // ── The archive bundle ───────────────────────────────────────────────────
  //
  // A FOLDER, not one file. Kevin's ruling, Jul 30, and it had to be: media
  // cannot live inside a self-contained HTML file without either bloating it
  // past what a browser will open, or pointing at URLs that die with the
  // worker. Neither survives twenty years, which is the only bar that matters
  // for this document.
  //
  // So: archive.html beside media/, a README that explains the folder to
  // someone with no software, and a manifest with checksums so a future reader
  // can tell a missing photograph from a damaged one.
  //
  // Photos are fetched through the gated worker route, one at a time. A photo
  // that will not download is OMITTED and RECORDED in the manifest rather than
  // silently skipped — an archive that quietly drops what it could not fetch
  // misrepresents itself as complete.
  const downloadBundle = async () => {
    setMsg('Building the archive…');
    try {
      // The chronicle is assembled here, from everything the tab already holds.
      const chronicle = buildChronicle(weekLedger, {
        orders: orders || [],
        journal,
        amendments: amendments || [],
        visualCues: visualCues || [],
      });
      const html = buildArchiveHtml({ journal, orders, copiesNote, history: archiveHistory, chronicle });
      const enc = new TextEncoder();
      const stored = (visualCues || []).filter(c => c.status === 'stored' && c.mediaKey);
      const files = [];
      const failedFetches = [];

      for (const cue of stored) {
        try {
          const r = await fetch(`${WORKER_BASE}/media/${encodeURIComponent(cue.mediaKey)}`, {
            headers: { 'X-LTB-Token': PUBLISH_TOKEN },
          });
          if (!r.ok) throw new Error(String(r.status));
          files.push({ path: 'media/' + cue.mediaKey, bytes: new Uint8Array(await r.arrayBuffer()) });
        } catch (e) {
          failedFetches.push(cue);
        }
      }

      const manifest = buildBundleManifest({
        cues: stored.filter(c => !failedFetches.includes(c)),
        archiveBytes: enc.encode(html).length,
      });
      // Fetch failures join the omitted list, so the manifest never claims a
      // file the folder does not contain.
      for (const c of failedFetches) {
        manifest.omitted.push({
          dishId: c.dishId, step: c.step, status: c.status,
          why: 'the photograph could not be downloaded while this archive was built',
        });
      }

      const zip = buildZip([
        { path: 'archive.html', bytes: enc.encode(html) },
        { path: 'README.txt', bytes: enc.encode(BUNDLE_README) },
        { path: 'manifest.json', bytes: enc.encode(JSON.stringify(manifest, null, 2)) },
        ...files,
      ]);

      const blob = new Blob([zip], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LTB_ARCHIVE_${new Date().getFullYear()}_${new Date().toISOString().slice(5, 10)}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      const missing = manifest.omitted.length;
      setMsg(missing
        ? `Archive downloaded with ${files.length} photograph${files.length === 1 ? '' : 's'}. ${missing} could not be included and ${missing === 1 ? 'is' : 'are'} listed in manifest.json.`
        : `Archive downloaded. Unzip it anywhere: archive.html opens in any browser, with or without this app.`);
      if (onArchiveDownloaded) onArchiveDownloaded(journal && journal.entries ? journal.entries.length : 0);
    } catch (e) {
      setMsg('The archive failed to build. Nothing was changed.');
    }
    setTimeout(() => setMsg(null), 8000);
  };

  const coverRows = showAllCoverage ? coverage.rows : coverage.rows.slice(0, 12);

  return (
    <div style={S.wrap}>
      {/* ══ SUB-TABS ═══════════════════════════════════════════════════════
           Record had FIFTEEN cards in one column under three group headings
           that scrolled away, so the headings stopped orienting anything past
           the first screen and every visit paid the scroll cost of all three
           groups. The groups were already Kevin's own (Write / Read / Keep);
           this only stops each one renting space from the other two.

           Named for what he is DOING, not what the app is storing: "Do" is the
           worklist, "Read" is the record looking back, "Keep" is getting it out
           of this device. Same toggle component the Cook tab has used since it
           had the same problem.

           Deliberately NOT persisted and NOT in the router. There is one of
           these per session, the default is the worklist, and a remembered
           sub-tab would mean opening Record to whatever he happened to be doing
           last week. ══════════════════════════════════════════════════════ */}
      <div style={styles.cookSubToggle}>
        {[['do', 'Do'], ['read', 'Read'], ['practice', 'Practice'], ['ask', 'Ask'], ['keep', 'Keep']].map(([key, label]) => (
          <button
            key={key}
            style={{ ...styles.cookSubBtn, ...(sub === key ? styles.cookSubBtnActive : {}) }}
            onClick={() => setSub(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'do' && (<>
      <CaptureInbox inbox={captureInbox} onSave={onSaveCapture} dishNames={allDishNames} />
      <ClarificationsPane store={clarifications} onSave={onSaveClarifications} corpus={corpus} />

      {/* ── THE ANSWER LOOP ──
           This card used to end with directions: "Recipes tab → dish → Dossier."
           Three navigations between reading a question and answering it, and
           the question is asked at the exact moment Kevin has the answer in his
           head. Every step in between is a chance for the thought to go.

           So the box is here. Answer it where you read it, and the entry files
           itself against the right dish with the right type. The coverage
           number above moves on submit, which is the part that closes the loop
           — the point is not gamification for its own sake, it is that the
           worklist visibly shrinks when you feed it. ── */}
      {question && (
        <div style={{ ...S.card, border: `1px solid ${C.good}` }}>
          <div style={S.h}>This week's question</div>
          <div style={S.p}>{question.question}</div>
          <div style={S.faint}>
            {question.kind === 'never' ? 'Nothing on record for it yet.'
              : question.kind === 'stale' ? 'Nothing written about it in months.'
              : `${question.entryCount} entr${question.entryCount === 1 ? 'y' : 'ies'} on record.`}
            {' '}Filed against {question.dish}.
          </div>

          {answered ? (
            <div style={{ ...S.p, color: C.good, marginTop: 8 }}>
              Filed against {question.dish}. Coverage updated.
            </div>
          ) : (
            <>
              <textarea
                style={{ width: '100%', minHeight: 76, marginTop: 8, background: '#14201d',
                  border: `1px solid ${C.border}`, borderRadius: 8, color: C.text,
                  fontSize: 13.5, padding: 9, boxSizing: 'border-box', resize: 'vertical' }}
                placeholder="Answer it here"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {/* The type the prompt was ASKING for is preselected, because
                    choosing a taxonomy is the other thing that stops people
                    writing. Changeable in one tap if the answer went somewhere
                    else, which it often will. */}
                {(question.types || ['technique', 'doneCues', 'adjustment', 'provenance']).map(t => (
                  <button
                    key={t}
                    onClick={() => setAnswerType(t)}
                    style={{ fontSize: 12, padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                      background: answerType === t ? C.good : '#232d2a',
                      color: answerType === t ? '#121a18' : C.text,
                      border: `1px solid ${answerType === t ? C.good : C.border}` }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                disabled={!answer.trim()}
                onClick={() => {
                  onAnswerQuestion({ dish: question.dish, type: answerType, text: answer.trim() });
                  setAnswer(''); setAnswered(true);
                  setTimeout(() => setAnswered(false), 6000);
                }}
                style={{ width: '100%', marginTop: 8, minHeight: 40, borderRadius: 8,
                  cursor: answer.trim() ? 'pointer' : 'default', fontSize: 14, fontWeight: 700,
                  background: answer.trim() ? C.good : '#232d2a',
                  color: answer.trim() ? '#121a18' : '#5c6b66',
                  border: `1px solid ${answer.trim() ? C.good : C.border}` }}
              >
                File it
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Import ──
           The fastest way to fill a decade-long record is not a blank box. It
           is taking what you have ALREADY said, in chat or in a note, and
           correcting it rather than composing it. Parsing saves NOTHING; each
           entry is committed deliberately. ── */}
      <div style={S.card}>
        <button style={{ ...S.h, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: C.good }}
          onClick={() => setShowImport(v => !v)}>
          Import written notes {showImport ? '▲' : '▼'}
        </button>
        {showImport && (
          <>
            <div style={S.faint}>
              Paste blocks separated by blank lines. Nothing saves until you commit each one.
            </div>
            <pre style={{ ...S.faint, background: '#14201d', border: `1px solid ${C.border}`, borderRadius: 6, padding: 8, margin: '6px 0', whiteSpace: 'pre-wrap', fontSize: 11 }}>{IMPORT_FORMAT_HELP}</pre>
            <textarea
              style={{ width: '100%', minHeight: 110, background: '#14201d', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: 9, boxSizing: 'border-box', fontFamily: 'inherit' }}
              placeholder="Paste here…"
              value={paste}
              onChange={e => setPaste(e.target.value)}
            />
            {candidates.length > 0 && (
              <>
                <div style={{ ...S.faint, marginTop: 6 }}>
                  {impSummary.total} block{impSummary.total === 1 ? '' : 's'} · {impSummary.ready} ready
                  {impSummary.blocked > 0 ? ` · ${impSummary.blocked} need a fix` : ''}
                </div>
                {candidates.map(c => (
                  <div key={c.index} style={{ borderTop: `1px solid ${C.border}`, padding: '7px 0' }}>
                    <div style={S.faint}>
                      {c.resolvedDish || c.dish || 'no dish'} · {JOURNAL_TYPES[c.type] ? JOURNAL_TYPES[c.type].label : c.type}
                      {c.confidence ? ` · ${c.confidence}` : ''}{c.private ? ' · private' : ''}
                    </div>
                    <div style={{ ...S.p, color: c.ready ? C.text : C.faint }}>{c.text || '(no text)'}</div>
                    {c.problems.map(p => <div key={p} style={{ ...S.p, color: C.bad }}>{p}</div>)}
                    {c.notes.map(n => <div key={n} style={{ ...S.p, color: C.warn }}>{n}</div>)}
                    {c.ready && (
                      <button
                        style={{ ...S.btn(C.good), minHeight: 34, padding: '5px 12px', fontSize: 12 }}
                        onClick={() => {
                          onSaveJournal(prev => addEntry(prev, candidateToEntry(c)));
                          setPaste(p => p.split(/\n\s*\n/).filter((_, i) => i !== c.index).join('\n\n'));
                        }}
                      >
                        Add this one
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <div style={S.card}>
        <div style={S.h}>Coverage</div>
        <div style={S.faint}>
          {coverage.documented} of {coverage.total} written up{coverage.empty > 0 ? `, ${coverage.empty} with nothing at all` : ''}. Emptiest first.
        </div>
        <div style={{ marginTop: 8 }}>
          {coverRows.map(r => (
            <div key={r.dish} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
              <span style={{ flex: 1, fontSize: 12.5, color: r.entries === 0 ? C.faint : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.dish}</span>
              <span style={{ width: 90, height: 6, borderRadius: 3, background: '#141a18', overflow: 'hidden', flexShrink: 0 }}>
                <span style={{ display: 'block', height: '100%', width: `${Math.min(100, r.entries * 12)}%`, background: r.entries === 0 ? 'transparent' : C.good }} />
              </span>
              <span style={{ width: 22, textAlign: 'right', fontSize: 11.5, color: r.entries === 0 ? C.bad : C.dim }}>{r.entries}</span>
            </div>
          ))}
        </div>
        {coverage.rows.length > 12 && (
          <button style={{ ...S.btn(), width: '100%', marginTop: 8, minHeight: 36, fontSize: 12 }} onClick={() => setShowAllCoverage(v => !v)}>
            {showAllCoverage ? 'Show less' : `Show all ${coverage.rows.length}`}
          </button>
        )}
      </div>

      {/* Earns its place: with an empty journal this says "nothing recorded
          under" all nine types, which reads as broken rather than new.
          Coverage below is the deliberate exception — at all zeros it IS the
          worklist, so it stays visible from day one. */}
      {composition.total >= 5 && (
      <div style={S.card}>
        <div style={S.h}>What kind of record this is</div>
        <div style={S.faint}>
          {composition.total} entr{composition.total === 1 ? 'y' : 'ies'}
          {composition.transferable > 0 ? `, ${composition.transferable} marked as holding beyond their dish` : ''}
          {composition.private > 0 ? `, ${composition.private} private` : ''}.
        </div>
        <div style={S.chipRow}>
          {JOURNAL_TYPE_ORDER.map(t => (
            <span key={t} style={{ padding: '3px 8px', borderRadius: 10, fontSize: 11, border: `1px solid ${composition.byType[t] ? C.border : C.bad}`, color: composition.byType[t] ? C.dim : C.bad }}>
              {JOURNAL_TYPES[t].label} {composition.byType[t]}
            </span>
          ))}
        </div>
        {composition.missing.length > 0 && (
          <div style={{ ...S.p, color: C.warn, marginTop: 8 }}>
            Nothing recorded under: {composition.missing.map(t => JOURNAL_TYPES[t].label).join(', ')}.
            {composition.missing.includes('mistake') && ' A record with no failures in it says cooking is a thing that goes right.'}
          </div>
        )}
      </div>
      )}

      </>)}

      {sub === 'read' && (<>

      {onThisDay.length > 0 && (
        <div style={S.card}>
          <div style={S.h}>On this day</div>
          {onThisDay.slice(0, 4).map(e => (
            <div key={e.id} style={S.p}>
              <span style={S.dim}>{e.yearsAgo} year{e.yearsAgo === 1 ? '' : 's'} ago{e.dish ? `, on ${e.dish}` : ''}:</span> {e.text}
            </div>
          ))}
        </div>
      )}

      {principles.size > 0 && (
      <div style={S.card}>
        <div style={S.h}>Principles</div>
        {false ? null : (
          [...principles.entries()].map(([name, list]) => (
            <div key={name} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>
                {name === UNNAMED_PRINCIPLE ? 'Not yet grouped' : name}
              </div>
              {list.slice(0, 6).map(e => (
                <div key={e.id} style={{ ...S.p, borderLeft: `2px solid ${C.good}`, paddingLeft: 8, margin: '4px 0' }}>
                  {e.text}
                  <div style={S.faint}>{e.dish || 'general'} · {fmtDate(e.ts)}</div>
                </div>
              ))}
              {list.length > 6 && <div style={S.faint}>+{list.length - 6} more</div>}
            </div>
          ))
        )}
      </div>
      )}

      {season.length > 0 && (
        <div style={S.card}>
          <div style={S.h}>This month, previous years</div>
          {season.slice(0, 6).map(w => (
            <div key={w.stamp} style={S.p}>
              <span style={S.dim}>{w.label}:</span> {w.dishes.length ? w.dishes.join(', ') : 'nothing published'}
            </div>
          ))}
        </div>
      )}

      {((askLog || []).length > 0 || onPullQuestions) && (
      <div style={S.card}>
        <div style={S.h}>What customers asked</div>
        {(askLog || []).length === 0 ? (
          <div style={S.faint}>Nothing pulled yet. These are real confusions at the moment of cooking, which is the one kind of teaching data you cannot write from memory.</div>
        ) : (
          (askLog || []).slice(0, 8).map((q, i) => (
            <div key={i} style={S.p}><span style={S.dim}>{fmtDate(q.at)}:</span> "{q.question}"</div>
          ))
        )}
        {onPullQuestions && (
          <button
            style={{ ...S.btn(), width: '100%', marginTop: 8 }}
            onClick={async () => {
              setMsg('Pulling questions…');
              try {
                const n = await onPullQuestions();
                setMsg(n ? `${n} question${n === 1 ? '' : 's'} pulled.` : 'No questions yet.');
              } catch (e) { setMsg('Could not pull questions.'); }
              setTimeout(() => setMsg(null), 4000);
            }}
          >
            Pull customer questions
          </button>
        )}
      </div>
      )}

      {/* MOVED FROM KEEP, Kevin's ruling Aug 1. "What you actually cook" and
          "Your own ranking" are the record looking back at itself, which is what
          Read is for. Keep is for getting things OUT of the device; these two
          were only there because the original grouping predates the sub-tabs.
          The container audit and the epoch card stay in Keep — the epoch card
          because he has already confirmed the decision, so the argument for
          moving it (an unanswered one-tap decision belongs in Do) is spent. */}
      {patterns && (
        <div style={S.card}>
          <div style={S.h}>What you actually cook</div>
          {patterns.unavailable ? (
            <div style={S.faint}>{patterns.reason}</div>
          ) : (
            <>
              <div style={S.faint}>
                {patterns.units} portions across {patterns.weeks} week{patterns.weeks === 1 ? '' : 's'},
                {' '}{patterns.distinct} different dishes, about {patterns.dishesPerWeek} a week.
                {' '}Counted only since the real data starts, so this is cooking and not data entry.
              </div>

              <div style={{ ...S.h, marginTop: 12, fontSize: 13 }}>By technique</div>
              {patterns.techniques.map(t => (
                <div key={t.technique} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12.5 }}>
                  <span style={{ color: C.text, flex: 1, textTransform: 'capitalize' }}>{t.technique}</span>
                  <span style={{ color: C.faint }}>{Math.round(t.share * 100)}% · {t.units}</span>
                </div>
              ))}

              <div style={{ ...S.h, marginTop: 12, fontSize: 13 }}>Most cooked</div>
              {patterns.rows.slice(0, 6).map(r => (
                <div key={r.dish} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12.5 }}>
                  <span style={{ color: C.text, flex: 1 }}>{r.dish}</span>
                  <span style={{ color: C.faint }}>{r.units} · {r.weeksRun}wk</span>
                </div>
              ))}

              {/* Both directions are interesting and neither is a failure. Rated
                  high and rarely cooked usually has a cost or effort reason he
                  already knows. Rated low and cooked often is a workhorse. */}
              {tasteVsPractice && tasteVsPractice.some(t => t.gap != null && Math.abs(t.gap) >= 4) && (
                <>
                  <div style={{ ...S.h, marginTop: 12, fontSize: 13 }}>Taste against practice</div>
                  <div style={{ ...S.faint, marginBottom: 4 }}>
                    Where what you rate highly and what you actually make pull apart.
                  </div>
                  {tasteVsPractice
                    .filter(t => t.gap != null && Math.abs(t.gap) >= 4)
                    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
                    .slice(0, 5)
                    .map(t => (
                      <div key={t.dish} style={{ padding: '4px 0', fontSize: 12.5 }}>
                        <span style={{ color: C.text }}>{t.dish}</span>
                        <span style={{ color: C.faint }}>
                          {' \u00b7 '}you rate it {t.tasteRank}, you cook it {t.cookRank}
                          {t.gap < 0 ? ' \u00b7 makes it less than he rates it' : ' \u00b7 a workhorse'}
                        </span>
                      </div>
                    ))}
                </>
              )}

              {patterns.neverRun.length > 0 && (
                <div style={{ ...S.faint, marginTop: 10 }}>
                  Not cooked at all in this window: {patterns.neverRun.length} dish
                  {patterns.neverRun.length === 1 ? '' : 'es'}. Some are seasonal, some are new.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {ranking && (
        <div style={S.card}>
          <div style={S.h}>Your own ranking</div>
          <div style={S.faint}>
            Taken {new Date(ranking.rankedAt).toLocaleDateString()} by head-to-head over all
            {' '}{ranking.order.length} dinners. One question, asked ~90 times: which would you rather
            eat tonight. Kept as a series, because the whole reason to record it is that it drifts.
            <br /><br />
            <b style={{ color: C.text }}>Last place is not a bad dish.</b> Everything here already
            cleared the reheat gate, so this is preference spread across a set that is uniformly
            good. 27th means least favourite of 27 things you would happily eat.
            {rankingStale && rankingStale.added.length > 0 && (
              <> <b style={{ color: C.warn }}>{rankingStale.added.length} dish{rankingStale.added.length === 1 ? '' : 'es'} joined the menu since</b>, so this is due a re-run.</>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            {ranking.order.slice(0, 10).map((d, i) => (
              <div key={d} style={{ display: 'flex', gap: 10, padding: '5px 0', fontSize: 13.5 }}>
                <span style={{ color: C.faint, minWidth: 18 }}>{i + 1}</span>
                <span style={{ color: C.text }}>{d}</span>
              </div>
            ))}
          </div>

          {rankingDrift && rankingDrift.movers.length > 0 && (
            <>
              <div style={{ ...S.h, marginTop: 14, fontSize: 13 }}>What moved since last time</div>
              {rankingDrift.movers.slice(0, 6).map(m => (
                <div key={m.dish} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12.5 }}>
                  <span style={{ color: m.delta > 0 ? C.good : C.bad, minWidth: 34 }}>
                    {m.delta > 0 ? '\u2191' : '\u2193'}{Math.abs(m.delta)}
                  </span>
                  <span style={{ color: C.text, flex: 1 }}>{m.dish}</span>
                  <span style={{ color: C.faint }}>{m.from} \u2192 {m.to}</span>
                </div>
              ))}
            </>
          )}

          {/* The disagreements, both directions. Neither is a failure: a dish he
              loves that nobody orders is a fact about a friends-only menu that
              exists to please him too. */}
          {tasteVsSales && tasteVsSales.some(r => r.gap != null && Math.abs(r.gap) >= 6) && (
            <>
              <div style={{ ...S.h, marginTop: 14, fontSize: 13 }}>Where you and your customers disagree</div>
              <div style={{ ...S.faint, marginBottom: 4 }}>
                Neither direction is a problem. A dish you rate highly that few people order is a
                fact about a friends-only menu that exists to please you too.
              </div>
              {tasteVsSales
                .filter(r => r.gap != null && Math.abs(r.gap) >= 6)
                .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
                .slice(0, 6)
                .map(r => (
                  <div key={r.dish} style={{ padding: '5px 0', fontSize: 12.5 }}>
                    <span style={{ color: C.text }}>{r.dish}</span>
                    <span style={{ color: C.faint }}>
                      {' \u00b7 '}you {r.tasteRank}, they order it {r.salesRank}
                      {r.gap > 0 ? ' \u00b7 sells better than you rate it' : ' \u00b7 you rate it higher than it sells'}
                    </span>
                  </div>
                ))}
            </>
          )}

          {tasteVsSon && tasteVsSon.length > 0 && (
            <>
              <div style={{ ...S.h, marginTop: 14, fontSize: 13 }}>You and Rowan</div>
              {tasteVsSon.slice(0, 8).map(r => (
                <div key={r.dish} style={{ padding: '5px 0', fontSize: 12.5 }}>
                  <span style={{ color: C.text }}>{r.dish}</span>
                  <span style={{ color: r.agree ? C.good : C.faint }}>
                    {' \u00b7 '}you {r.tasteRank}, him {r.sonRank}
                    {r.agree ? ' \u00b7 agreed' : ''}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      </>)}

      {sub === 'keep' && (<>

      <div style={S.card}>
        <div style={S.h}>The durable record</div>
        <div style={S.faint}>
          Everything above lives in this one device's storage. These two files do not.
          {(archiveHistory || []).length > 0 ? ` This will be number ${archiveHistory.length + 1} in the series.` : ' This would be the first of the series.'}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <button style={S.btn(C.good)} onClick={downloadBundle}>
            Download the yearly archive
          </button>
          <button style={S.btn()} onClick={() => downloadDoc(
            buildRecordsHtml({ orders }),
            `LTB_RECORDS_${new Date().toISOString().slice(0, 10)}.html`,
            'The delivery records')}>
            Download delivery records
          </button>
        </div>
        {msg && <div style={{ ...S.faint, marginTop: 6 }}>{msg}</div>}
      </div>

      <div style={S.card}>
        <div style={S.h}>Where the copies live</div>
        <div style={S.faint}>
          The archive is the highest-stakes thing here and it exists wherever you last saved it.
          Nobody else knows it exists or where to look. This note prints INTO the archive, so it
          is readable by someone who does not have you to ask.
        </div>
        <textarea
          style={{ width: '100%', minHeight: 70, marginTop: 8, background: '#14201d', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: 9, boxSizing: 'border-box', fontFamily: 'inherit' }}
          placeholder="e.g. Yearly archive is emailed to myself every birthday, and a printed copy is in the fire safe."
          value={noteDraft == null ? (copiesNote || '') : noteDraft}
          onChange={e => setNoteDraft(e.target.value)}
        />
        {noteDraft != null && noteDraft !== (copiesNote || '') && (
          <button style={{ ...S.btn(C.good), marginTop: 6 }} onClick={() => { onSaveCopiesNote(noteDraft); setNoteDraft(null); }}>
            Save
          </button>
        )}
      </div>



      {/* ALWAYS RENDERS. This used to be hidden unless the detector had a
          proposal, which meant that on a young or continuous order history the
          card vanished entirely and Kevin had no way to tell whether the
          feature was missing, broken, or just quiet. A panel that disappears
          when it has nothing to propose is indistinguishable from one that was
          never built. It now always says which of the three states it is in. */}
      {true && (
        <div style={S.card}>
          <div style={S.h}>Where the real data starts</div>
          {realDataEpoch ? (
            <>
              {/* CONFIRMED: one line, and the detail behind a toggle.
                  This card is a one-tap decision that, once made, never needs
                  making again — but it kept a full paragraph and a live Unset
                  button permanently expanded among the export cards. A settled
                  question should state its answer and get out of the way. Unset
                  stays one tap away because the decision is reversible by
                  design; it just stops taking a paragraph to say so.

                  NOTE ON ITS HOME: this card lives under Keep because that is
                  the heading it has always sat below. It is arguably a Do item
                  — it is an unanswered one-tap decision, not a record — but
                  re-homing Kevin's own cards is his call, not a refactor's.
                  The UNCONFIRMED
                  branches below are untouched: always-rendering them was a
                  deliberate fix for a card that used to hide when it had
                  nothing to propose, which made it indistinguishable from one
                  that was never built. */}
              <div style={S.faint}>
                Confirmed as {new Date(realDataEpoch).toLocaleDateString()} ·{' '}
                {epochSummary?.real ?? 0} real order{(epochSummary?.real ?? 0) === 1 ? '' : 's'},{' '}
                {epochSummary?.backfilled ?? 0} set aside.
              </div>
              <button
                style={{ ...S.btn(C.border), marginTop: 8, minHeight: 32, padding: '6px 12px', fontSize: 12 }}
                onClick={() => setShowEpochDetail(v => !v)}
              >
                {showEpochDetail ? 'Hide detail' : 'Detail'}
              </button>
              {showEpochDetail && (
                <>
                  <div style={{ ...S.faint, marginTop: 8 }}>
                    Counts that would be misleading over typed-in history now use only the real
                    orders and set aside the ones entered from memory. Nothing was deleted.
                  </div>
                  <button style={{ ...S.btn(C.border), marginTop: 8 }} onClick={() => onConfirmEpoch(null)}>
                    Unset
                  </button>
                </>
              )}
            </>
          ) : !epochProposal?.proposed ? (
            <>
              {/* The detector found nothing, which is a legitimate answer and not
                  a failure. Two very different situations produce it and the
                  reason text distinguishes them: too little history to see a
                  seam, or a history with no seam in it because none of it was
                  typed in. Either way Kevin may simply KNOW the date, so the
                  manual entry is the escape hatch rather than a dead end. */}
              <div style={S.faint}>
                Order history typed in from memory can't be counted honestly, so this draws a line
                between what was entered and what actually happened.
                <br /><br />
                <b style={{ color: C.text }}>No line proposed.</b> {epochProposal?.reason}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={manualEpoch}
                  onChange={e => setManualEpoch(e.target.value)}
                  style={{ flex: 1, background: '#14201d', border: `1px solid ${C.border}`,
                    borderRadius: 8, color: C.text, fontSize: 13.5, padding: 9, boxSizing: 'border-box' }}
                />
                <button
                  disabled={!manualEpoch}
                  onClick={() => onConfirmEpoch(new Date(manualEpoch + 'T00:00:00').toISOString())}
                  style={{ ...S.btn(manualEpoch ? C.good : C.border), flex: '0 0 auto', padding: '0 14px' }}
                >
                  Set it
                </button>
              </div>
              <div style={{ ...S.faint, marginTop: 6 }}>
                Only set this if you know roughly when you stopped typing in old orders. Leaving it
                unset changes nothing, which is the safe default.
              </div>
            </>
          ) : (
            <>
              <div style={S.faint}>
                Order history was typed in from memory when the app was built, so counting over it
                measures data entry rather than what people actually ate. That is why there is no
                "first ever cooked" and no seasonal firsts. Drawing a line brings those back.
                <br /><br />
                <b style={{ color: epochProposal.confidence === 'high' ? C.good : C.warn }}>
                  Best guess: {new Date(epochProposal.proposed).toLocaleDateString()}
                  {epochProposal.confidence === 'low' ? ' (uncertain)' : ''}
                </b>
                <br />
                {epochProposal.reason}
              </div>
              <button style={{ ...S.btn(C.good), marginTop: 8 }} onClick={() => onConfirmEpoch(epochProposal.proposed)}>
                Yes, real orders start here
              </button>
              <div style={{ ...S.faint, marginTop: 6 }}>
                Reversible, and it hides nothing — orders before the line stay exactly where they are,
                they just stop being counted in statistics.
              </div>
            </>
          )}
        </div>
      )}

      {containerAudit && !containerAudit.complete && (
        <div style={{ ...S.card, border: `1px solid ${C.warn}` }}>
          <div style={S.h}>Container audit, unfinished</div>
          <div style={S.faint}>
            {containerAudit.confirmed.length} confirmed, {containerAudit.unconfirmed.length} not.
            Each unconfirmed dinner counts as ONE container, so the Sunday check could be
            undercounting by up to {containerAudit.maxUndercount} containers per unit. Until this is
            done, that check reports a floor rather than a figure.
          </div>
          <div style={{ marginTop: 8 }}>
            {containerAudit.unconfirmed.map(u => (
              <div key={u.dish} style={S.p}>
                <span style={{ color: C.text }}>{u.dish}</span>
                <div style={S.faint}>{u.components.join('  ·  ')}</div>
              </div>
            ))}
          </div>
          <div style={{ ...S.faint, marginTop: 6 }}>
            Components are parsed from the dish name, so some of these are one bowl and not three
            containers. Nothing was guessed into the mapping; confirming them is a pass through
            this list with Claude.
          </div>
        </div>
      )}

      {orphans.length > 0 && (
        <div style={{ ...S.card, border: `1px solid ${C.warn}` }}>
          <div style={S.h}>Names the app does not recognize</div>
          {orphans.map(o => (
            <div key={o.name} style={{ ...S.p, color: C.warn }}>
              "{o.name}" is on {o.orderCount} order{o.orderCount === 1 ? '' : 's'} but is not a dish or a known rename.
            </div>
          ))}
          <div style={S.faint}>Each one splits its dish's passport stamps and sales counts. Add it to DISH_RENAMES if it was renamed.</div>
        </div>
      )}

      {undoable.length > 0 && (
        <div style={S.card}>
          <div style={S.h}>Recently deleted</div>
          <div style={S.faint}>Removed entries stay recoverable for 30 days, then go for good.</div>
          {undoable.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
              <span style={{ flex: 1, fontSize: 12, color: C.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.text}
              </span>
              <span style={S.faint}>{fmtDate(e.deletedAt)}</span>
              <button
                onClick={() => onSaveJournal(prev => restoreEntry(prev, e.id))}
                style={{ minHeight: 32, padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.good}`, background: 'transparent', color: C.good, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
              >
                Undo
              </button>
            </div>
          ))}
        </div>
      )}
      </>)}

      {sub === 'practice' && (
        <>
          <PracticesPane practices={practices} onSave={onSavePractices} />
          <TermsPane terms={terms} onSave={onSaveTerms} />
        </>
      )}

      {sub === 'ask' && (
        <AskPane corpus={corpus} />
      )}
    </div>
  );
}
