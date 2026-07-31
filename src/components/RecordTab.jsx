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

export function RecordTab({
  journal, onSaveJournal, dishNames, weekDishes, orders, knownNames,
  weekLedger, askLog, onPullQuestions, copiesNote, onSaveCopiesNote, containerAudit, archiveHistory, onArchiveDownloaded,
  onAnswerQuestion,
  realDataEpoch, epochProposal, epochSummary, onConfirmEpoch,
  ranking, rankingDrift, tasteVsSales, tasteVsSon, rankingStale,
  patterns, tasteVsPractice, visualCues, amendments,
}) {
  const [msg, setMsg] = useState(null);
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
      {/* ══ WRITE ══════════════════════════════════════════════════════════ */}
      <div style={S.group}>Write</div>

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

      {/* ══ READ ═══════════════════════════════════════════════════════════ */}
      <div style={S.group}>Read</div>

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

      {/* ══ KEEP ═══════════════════════════════════════════════════════════ */}
      <div style={S.group}>Keep</div>

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
              <div style={S.faint}>
                Confirmed as {new Date(realDataEpoch).toLocaleDateString()}. Counts that would be
                misleading over typed-in history now use {epochSummary?.real ?? 0} real order
                {(epochSummary?.real ?? 0) === 1 ? '' : 's'} and set aside{' '}
                {epochSummary?.backfilled ?? 0} entered from memory. Nothing was deleted.
              </div>
              <button style={{ ...S.btn(C.border), marginTop: 8 }} onClick={() => onConfirmEpoch(null)}>
                Unset
              </button>
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
    </div>
  );
}
