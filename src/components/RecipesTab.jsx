import React, { useState, useMemo, useEffect } from 'react';
import { TEAL_DARK, TEAL_MID, TEAL_LIGHT, GOLD, CREAM, DARK, CARD } from '../styles.js';
import { currency, itemCost, copyText } from '../utils.js';
import { WORKER_BASE, PUBLISH_TOKEN } from '../config.js';
import { itemHandling } from '../recipes.js';
import { MARGIN_BUFFER, costPipelineIngredients, pipelineMarginAt, baselineCostMap } from '../dishCosting.js';
import {
  buildDishReport, buildPortfolioSummary, reportableDishes, buildServingAudit, dishSalesHistory,
} from '../dishReport.js';
import { PIPELINE_DISHES } from '../pipelineDishes.js';
import { buildPromoteScaffold, newPromoteChecklist } from '../promoteScaffold.js';

// ── Local palette (matches the app's dark-teal look) ────────────────────────
const C = {
  panel: '#1c2422', panelAlt: '#232d2a', border: '#2d3a36', borderSoft: '#37403c',
  text: '#e8ede9', dim: '#9aa5a0', faint: '#6b7570',
  good: '#5DCAA5', goodMuted: '#5a8f6a', warn: GOLD || '#EF9F27', bad: '#993556', badText: '#e0828a',
};
const marginColor = (pct) => (pct >= 55 ? C.goodMuted : pct >= 40 ? C.warn : C.bad);

// ── Cost-history sparkline (same shape as IngredientsTab) ───────────────────
function Sparkline({ points, width = 120, height = 30 }) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min, n = points.length;
  const y = (v) => (span < 1e-9 ? height / 2 : height - 3 - ((v - min) / span) * (height - 6));
  const x = (i) => (n === 1 ? 0 : (i / (n - 1)) * (width - 2) + 1);
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const dir = points[n - 1] - points[0];
  const color = Math.abs(dir) < points[0] * 0.01 ? C.dim : (dir < 0 ? C.good : C.badText);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
      <circle cx={x(n - 1)} cy={y(points[n - 1])} r="2" fill={color} />
    </svg>
  );
}

const S = {
  wrap: { padding: '12px 0 40px', color: C.text },
  h2: { fontSize: 16, fontWeight: 700, margin: '0 0 4px' },
  hint: { fontSize: 12, color: C.dim, margin: '0 0 12px', lineHeight: 1.4 },
  section: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.dim, margin: '0 0 8px' },
  select: { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.panelAlt, color: C.text, fontSize: 14, marginBottom: 10 },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: (on) => ({ padding: '7px 12px', borderRadius: 8, border: `1px solid ${on ? C.good : C.border}`, background: on ? 'rgba(93,202,165,0.15)' : C.panelAlt, color: on ? C.good : C.dim, fontSize: 13, fontWeight: 600, cursor: 'pointer' }),
  toggle: (on) => ({ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: on ? '#1D9E75' : C.panelAlt, color: on ? '#0f1513' : C.dim, fontWeight: 700, fontSize: 14, cursor: 'pointer' }),
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, padding: '3px 0', fontSize: 13 },
  ingRow: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', fontSize: 13, borderBottom: `1px solid ${C.border}` },
  banner: (kind) => ({ padding: '9px 11px', borderRadius: 8, fontSize: 12.5, lineHeight: 1.45, marginTop: 8, background: kind === 'bad' ? 'rgba(153,53,86,0.18)' : kind === 'warn' ? 'rgba(239,159,39,0.12)' : 'rgba(93,202,165,0.12)', color: kind === 'bad' ? C.badText : kind === 'warn' ? C.warn : C.good, border: `1px solid ${kind === 'bad' ? '#5c2a3a' : kind === 'warn' ? '#4a3a1e' : '#28483d'}` }),
  collapseBtn: { display: 'flex', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', color: C.dim, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', padding: '2px 0' },
  notes: { width: '100%', minHeight: 70, boxSizing: 'border-box', background: C.panelAlt, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: 9, fontSize: 13, fontFamily: 'inherit' },
  saveBtn: { width: '100%', marginTop: 6, padding: '9px', borderRadius: 8, border: 'none', background: '#1D9E75', color: '#0f1513', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  portTh: { textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.4, padding: '4px 6px', cursor: 'pointer', userSelect: 'none' },
  portTd: { fontSize: 12, padding: '5px 6px', borderTop: `1px solid ${C.border}` },
};

// ── Customer feedback tally + kept notes for one dish ────────────────────────
// Reads the per-dish store written by the Orders-page triage flow. Tally shows
// all three verdicts; notes are collapsed by default so they never overwhelm.
const FB_META = [
  ['good', 'Perfect', '#5DCAA5'],
  ['meh', 'A little off', '#D9B36C'],
  ['bad', 'Had trouble', '#d98a7e'],
];
function FeedbackStrip({ fb, dish, onReset }) {
  const [open, setOpen] = React.useState(false);
  const [histOpen, setHistOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  if (!fb || !fb.tally) return null;
  const total = FB_META.reduce((n, [k]) => n + (fb.tally[k] || 0), 0);
  const notes = Array.isArray(fb.notes) ? fb.notes : [];
  const history = Array.isArray(fb.history) ? fb.history : [];
  if (total === 0 && notes.length === 0 && history.length === 0) return null;

  const hasLive = total > 0 || notes.length > 0;

  return (
    <div style={{ margin: '0 0 14px', padding: '10px 12px', background: '#202623', borderRadius: 10, border: '1px solid #2d3a36' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#D9B36C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Customer feedback
        </span>
        {hasLive && !confirming && (
          <button
            style={{ background: 'none', border: '1px solid #3a4441', color: '#8a938e', fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 6, padding: '3px 8px' }}
            onClick={() => setConfirming(true)}
          >
            Reset tally
          </button>
        )}
      </div>

      {confirming && (
        <div style={{ margin: '0 0 10px', padding: '9px 11px', background: '#2a211f', border: '1px solid #6b4a3f', borderRadius: 8 }}>
          <div style={{ fontSize: 12.5, color: '#e8c9bf', marginBottom: 8 }}>
            Reset this dish&rsquo;s feedback? The current tally and notes get archived to history, and the live count starts fresh.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ background: '#c25f4a', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => { onReset(dish); setConfirming(false); setOpen(false); }}
            >
              Yes, reset
            </button>
            <button
              style={{ background: '#2a2f2d', color: '#c8cfc9', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {hasLive ? (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
            {FB_META.map(([k, label, color]) => (
              <span key={k} style={{ color: (fb.tally[k] || 0) > 0 ? color : '#5a635e', fontWeight: 700 }}>
                {label} ×{fb.tally[k] || 0}
              </span>
            ))}
          </div>
          {notes.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <button
                style={{ background: 'none', border: 'none', color: '#8a938e', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                onClick={() => setOpen(o => !o)}
              >
                {open ? '▾' : '▸'} Notes ({notes.length})
              </button>
              {open && notes.map((n, i) => {
                const meta = FB_META.find(m => m[0] === n.verdict) || FB_META[0];
                return (
                  <div key={i} style={{ marginTop: 6, fontSize: 13, color: '#c8cfc9' }}>
                    <span style={{ color: meta[2], fontWeight: 700 }}>●</span>{' '}
                    <span style={{ fontStyle: 'italic' }}>&ldquo;{n.note}&rdquo;</span>
                    {n.at && <span style={{ color: '#5a635e', fontSize: 11 }}> · {new Date(n.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 12.5, color: '#5a635e', fontStyle: 'italic' }}>No feedback since the last reset.</div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #2d3a36' }}>
          <button
            style={{ background: 'none', border: 'none', color: '#8a938e', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}
            onClick={() => setHistOpen(o => !o)}
          >
            {histOpen ? '▾' : '▸'} History ({history.length} reset{history.length !== 1 ? 's' : ''})
          </button>
          {histOpen && history.map((h, i) => {
            const ht = FB_META.reduce((n, [k]) => n + (h.tally[k] || 0), 0);
            return (
              <div key={i} style={{ marginTop: 8, paddingLeft: 8, borderLeft: '2px solid #2d3a36' }}>
                <div style={{ fontSize: 11, color: '#5a635e', marginBottom: 3 }}>
                  Archived {h.archivedAt ? new Date(h.archivedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''} · {ht} total
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12 }}>
                  {FB_META.map(([k, label, color]) => (
                    <span key={k} style={{ color: (h.tally[k] || 0) > 0 ? color : '#5a635e' }}>
                      {label} ×{h.tally[k] || 0}
                    </span>
                  ))}
                </div>
                {Array.isArray(h.notes) && h.notes.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#8a938e' }}>
                    {h.notes.map((n, j) => (
                      <div key={j} style={{ fontStyle: 'italic' }}>&ldquo;{n.note}&rdquo;</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RecipesTab({ dishFeedback, onResetDishFeedback, liveCostMap, baseCostMap, costHistory, dishNotes, onSaveDishNote, weekDishes, orders, pipelineJournal, onSavePipelineJournal }) {
  const [dish, setDish] = useState('');
  const [flavorIdx, setFlavorIdx] = useState(0);
  const [size, setSize] = useState('small'); // 'small' | 'large' | 'only'
  const [noteText, setNoteText] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [portSort, setPortSort] = useState('margin');
  const [portWindow, setPortWindow] = useState('month'); // profit-$ window: month|quarter|all
  const [salesPeriod, setSalesPeriod] = useState('all'); // week|month|year|all

  const ctx = useMemo(() => ({ liveCostMap, baseCostMap, costHistory }), [liveCostMap, baseCostMap, costHistory]);
  const report = useMemo(() => (dish ? buildDishReport(dish, ctx) : null), [dish, ctx]);
  // ── Content studio state ──
  const [draft, setDraft] = useState(null);
  const [drafting, setDrafting] = useState(false);
  const [draftErr, setDraftErr] = useState(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  useEffect(() => { setDraft(null); setDraftErr(null); }, [dish]);


  // Portfolio rows carry profitContribution over the selected window by feeding
  // real sales (orders + itemCost) into the summary. The window only affects
  // the profit-$ column/sort; margin and drift are window-independent.
  const portfolio = useMemo(
    () => buildPortfolioSummary({ ...ctx, orders: orders || [], costOf: itemCost, period: portWindow }),
    [ctx, orders, portWindow]
  );

  const dishes = useMemo(() => reportableDishes(), []);
  const [showProteins, setShowProteins] = useState(false); // collapsed by default
  const [showVeg, setShowVeg] = useState(false);           // collapsed by default
  const [showDesserts, setShowDesserts] = useState(false); // collapsed by default
  const [showServings, setShowServings] = useState(false); // collapsed by default
  const servingAudit = useMemo(() => buildServingAudit({ all: true }), []);
  const servingFlags = useMemo(() => servingAudit.filter(d => d.anyFlag), [servingAudit]);
  const thisWeek = useMemo(() => new Set(weekDishes || []), [weekDishes]);

  // Reset flavor/size when the dish changes; seed notes.
  useEffect(() => {
    if (!report) return;
    setFlavorIdx(0);
    const g = report.decomposition.groups[0];
    setSize(g.small ? 'small' : g.large ? 'large' : 'only');
    setNoteText((dishNotes || {})[dish] || '');
    setShowBreakdown(false);
  }, [dish]); // eslint-disable-line

  const group = report ? report.decomposition.groups[flavorIdx] : null;
  const currentVariant = useMemo(() => {
    if (!group) return null;
    const v = group[size] || group.only || group.small || group.large;
    return v;
  }, [group, size]);
  const econ = (report && currentVariant) ? report.variantByLabel.get(currentVariant.label) : null;
  const recipe = (report && currentVariant) ? report.recipeFor(currentVariant.label) : null;

  // Grounding facts for the studio: ingredient names (NEVER costs), the canon
  // reheat approach, and Kevin's own cook notes. Only what's true.
  const contentFacts = useMemo(() => {
    if (!dish || !recipe) return '';
    const ings = (recipe.displayLines || []).map(l => l.name).filter(Boolean).join(', ');
    const h = itemHandling(dish, {});
    const notes = (dishNotes || {})[dish] || '';
    return [
      `Ingredients: ${ings}`,
      h.cue ? `Customer finish: ${h.cue}` : '',
      notes ? `Kevin's cook notes: ${notes}` : '',
    ].filter(Boolean).join('\n');
  }, [dish, recipe, dishNotes]);

  const makeDraft = async (angle) => {
    setDrafting(true); setDraftErr(null); setDraft(null);
    try {
      const res = await fetch(WORKER_BASE + '/content', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: PUBLISH_TOKEN, dish, angle, facts: contentFacts }),
      });
      const j = await res.json();
      if (!res.ok || !j.draft) throw new Error(j.error || 'failed');
      setDraft(j.draft);
    } catch (e) {
      setDraftErr('Draft failed. Is the v8 worker deployed and the API key set?');
    }
    setDrafting(false);
  };
  const cot = (report && currentVariant) ? report.costOverTimeFor(currentVariant.label) : null;
  const reheat = (report && currentVariant) ? report.reheatFor(currentVariant.label) : [];
  const scaleForFlavor = (report && group) ? report.scaling.find(s => s.flavor === group.flavor) : null;
  const sales = useMemo(
    () => (dish ? dishSalesHistory(dish, orders || [], itemCost, salesPeriod) : null),
    [dish, orders, salesPeriod]
  );

  const pickFlavor = (i) => {
    setFlavorIdx(i);
    const g = report.decomposition.groups[i];
    setSize(g.small ? 'small' : g.large ? 'large' : 'only');
  };

  // ── Portfolio sorting ──
  const sortedPortfolio = useMemo(() => {
    const arr = [...portfolio];
    if (portSort === 'margin') arr.sort((a, b) => a.worstMarginPct - b.worstMarginPct);
    else if (portSort === 'drift') arr.sort((a, b) => Math.abs(b.maxDriftPct) - Math.abs(a.maxDriftPct));
    else if (portSort === 'profit') arr.sort((a, b) => (b.profitContribution ?? 0) - (a.profitContribution ?? 0));
    return arr;
  }, [portfolio, portSort]);

  // ── Pipeline section state ──────────────────────────────────────────────
  const [showPipeline, setShowPipeline] = useState(false); // collapsed by default
  const [pipeKey, setPipeKey] = useState('');
  const [voteFull, setVoteFull] = useState(null); // { ranking, ballots } from /votes/full
  const [voteErr, setVoteErr] = useState(false);
  // new-journal-entry form
  const [jKind, setJKind] = useState('reheat');
  const [jDayN, setJDayN] = useState('');
  const [jVerdict, setJVerdict] = useState('');
  const [jQ, setJQ] = useState('');
  const [jNote, setJNote] = useState('');
  const [promoteText, setPromoteText] = useState('');
  const [promoteCuisine, setPromoteCuisine] = useState('American');
  const [copiedPromote, setCopiedPromote] = useState(false);

  const journalEntries = (pipelineJournal && pipelineJournal.entries) || {};
  const statusOf = (key) => (journalEntries[key] && journalEntries[key].status) || 'testing';

  // Group the dropdown: testing (alpha) → promoting → shipped/killed.
  const pipeGroups = useMemo(() => {
    const g = { testing: [], promoting: [], done: [] };
    for (const d of PIPELINE_DISHES) {
      const st = d.status || statusOf(d.key);
      if (st === 'shipped' || st === 'killed') g.done.push(d);
      else if (st === 'promoting') g.promoting.push(d);
      else g.testing.push(d);
    }
    const byTitle = (a, b) => a.title.localeCompare(b.title);
    g.testing.sort(byTitle); g.promoting.sort(byTitle); g.done.sort(byTitle);
    return g;
  }, [pipelineJournal]);

  const pipeDish = useMemo(() => PIPELINE_DISHES.find(d => d.key === pipeKey) || null, [pipeKey]);
  const pipeStatus = pipeDish ? (pipeDish.status || statusOf(pipeDish.key)) : null;

  // ── Pipeline economics (item 4) ──────────────────────────────────────────
  // Cost a candidate straight from its own ingredients[] (no RECIPES entry
  // needed). Candidates ship with ingredients:[] until Kevin develops one, so
  // most render "needs recipe to cost"; a developed one shows ballpark cost and
  // a would-be margin at a target price he sets.
  const [pipeTargetPrice, setPipeTargetPrice] = useState('');
  const pipeBaseMap = useMemo(() => baseCostMap || baselineCostMap(), [baseCostMap]);
  const pipeLiveMap = useMemo(() => liveCostMap || pipeBaseMap, [liveCostMap, pipeBaseMap]);
  const pipeCost = useMemo(() => {
    if (!pipeDish) return null;
    return costPipelineIngredients(pipeDish.ingredients, pipeLiveMap, pipeBaseMap);
  }, [pipeDish, pipeLiveMap, pipeBaseMap]);
  const pipeMargin = useMemo(() => {
    const p = parseFloat(pipeTargetPrice);
    return pipelineMarginAt(pipeCost, p);
  }, [pipeCost, pipeTargetPrice]);
  // Reset the target-price field when switching candidates.
  useEffect(() => { setPipeTargetPrice(''); }, [pipeKey]);

  // Fetch full vote standing once when the section opens.
  useEffect(() => {
    if (!showPipeline || voteFull || voteErr) return;
    let alive = true;
    fetch(WORKER_BASE + '/votes/full?token=' + encodeURIComponent(PUBLISH_TOKEN))
      .then(r => r.ok ? r.json() : Promise.reject(new Error('bad')))
      .then(j => { if (alive) setVoteFull(j); })
      .catch(() => { if (alive) setVoteErr(true); });
    return () => { alive = false; };
  }, [showPipeline]); // eslint-disable-line

  const pipeVote = useMemo(() => {
    if (!voteFull || !pipeDish) return null;
    const idx = voteFull.ranking.findIndex(r => r.dish === pipeDish.key);
    if (idx < 0) return null;
    return { rank: idx + 1, of: voteFull.ranking.length, votes: voteFull.ranking[idx].votes, ballots: voteFull.ballots };
  }, [voteFull, pipeDish]);

  const pipeJournal = pipeDish ? (journalEntries[pipeDish.key] || {}) : {};
  const pipeLog = (pipeJournal.journal || []).slice().sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));

  // Which open questions have a verdict logged against them.
  const answeredQ = useMemo(() => {
    const m = {};
    for (const e of (pipeJournal.journal || [])) {
      if (e.questionIdx != null && e.verdict) m[e.questionIdx] = e;
    }
    return m;
  }, [pipeJournal]);

  const addJournalEntry = () => {
    if (!pipeDish) return;
    const entry = {
      at: new Date().toISOString(),
      kind: jKind,
      dayN: jKind === 'reheat' && jDayN ? Number(jDayN) : null,
      verdict: jVerdict || null,
      questionIdx: jQ !== '' ? Number(jQ) : null,
      note: jNote.trim(),
    };
    onSavePipelineJournal(prev => {
      const cur = prev[pipeDish.key] || { journal: [], status: 'testing' };
      return { ...prev, [pipeDish.key]: { ...cur, journal: [...(cur.journal || []), entry] } };
    });
    setJNote(''); setJDayN(''); setJVerdict(''); setJQ('');
  };

  // Delete one journal entry. Entries are a dataset Kevin builds over months, so
  // a typo'd verdict shouldn't be permanent. Matched by its `at` timestamp
  // (unique per add). No confirm dialog — it's one line, and re-adding is trivial.
  const deleteJournalEntry = (at) => {
    if (!pipeDish) return;
    onSavePipelineJournal(prev => {
      const cur = prev[pipeDish.key];
      if (!cur) return prev;
      return { ...prev, [pipeDish.key]: { ...cur, journal: (cur.journal || []).filter(e => e.at !== at) } };
    });
  };

  const doPromote = () => {
    if (!pipeDish) return;
    const text = buildPromoteScaffold(pipeDish, promoteCuisine);
    setPromoteText(text);
    onSavePipelineJournal(prev => {
      const cur = prev[pipeDish.key] || { journal: [], status: 'testing' };
      return { ...prev, [pipeDish.key]: { ...cur, status: 'promoting', promoteChecklist: newPromoteChecklist(pipeDish, promoteCuisine) } };
    });
  };

  const setPipeStatus = (status) => {
    if (!pipeDish) return;
    onSavePipelineJournal(prev => {
      const cur = prev[pipeDish.key] || { journal: [], status: 'testing' };
      return { ...prev, [pipeDish.key]: { ...cur, status } };
    });
  };

  // Toggle one promote-checklist surface done/undone, so a half-finished promote
  // is visible at a glance instead of hiding behind a single "promoting" label.
  const toggleChecklistItem = (itemId) => {
    if (!pipeDish) return;
    onSavePipelineJournal(prev => {
      const cur = prev[pipeDish.key];
      if (!cur || !cur.promoteChecklist) return prev;
      const items = cur.promoteChecklist.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it);
      return { ...prev, [pipeDish.key]: { ...cur, promoteChecklist: { ...cur.promoteChecklist, items } } };
    });
  };

  return (
    <div style={S.wrap}>
      <h2 style={S.h2}>Recipes</h2>
      <p style={S.hint}>Full recipe, cost, and margin intelligence for any dinner. Pick a dish, then a version.</p>

      {/* ── PIPELINE — candidates in testing ── */}
      <div style={S.section}>
        <button style={S.collapseBtn} onClick={() => setShowPipeline(o => !o)}>
          <span>Pipeline · {pipeGroups.testing.length} in testing</span>
          <span>{showPipeline ? '▲' : '▼'}</span>
        </button>
        {showPipeline && (
          <div style={{ marginTop: 10 }}>
            {/* Full board — every candidate, ranked, titles not keys. */}
            {voteFull && (
              <div style={{ ...S.section, maxHeight: 220, overflowY: 'auto' }}>
                <div style={S.sectionTitle}>The board · {voteFull.ballots} ballot{voteFull.ballots === 1 ? '' : 's'}</div>
                {voteFull.ranking.map((r, i) => {
                  const cd = PIPELINE_DISHES.find(x => x.key === r.dish);
                  const developed = cd && Array.isArray(cd.ingredients) && cd.ingredients.length > 0;
                  return (
                    <div key={r.dish} onClick={() => { setPipeKey(r.dish); setPromoteText(''); }}
                      style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: 1.7, cursor: 'pointer', color: r.dish === pipeKey ? C.good : (r.votes === 0 ? C.faint : C.text) }}>
                      <span style={{ width: 22, textAlign: 'right', color: C.faint, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ flex: 1 }}>
                        {cd ? cd.title : r.dish}
                        {developed && <span title="recipe costable" style={{ color: C.good, marginLeft: 5, fontSize: 11 }}>$</span>}
                      </span>
                      <span style={{ color: r.votes > 0 ? C.good : C.faint, fontWeight: 700 }}>{r.votes}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {voteErr && <div style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>Couldn't load the vote board.</div>}

            <select style={S.select} value={pipeKey} onChange={e => { setPipeKey(e.target.value); setPromoteText(''); }}>
              <option value="">Pick a candidate…</option>
              <optgroup label="Testing">
                {pipeGroups.testing.map(d => <option key={d.key} value={d.key}>{d.title}</option>)}
              </optgroup>
              {pipeGroups.promoting.length > 0 && (
                <optgroup label="Promoting">
                  {pipeGroups.promoting.map(d => <option key={d.key} value={d.key}>{d.title}</option>)}
                </optgroup>
              )}
              {pipeGroups.done.length > 0 && (
                <optgroup label="Shipped / Killed">
                  {pipeGroups.done.map(d => <option key={d.key} value={d.key}>{d.title} ({d.status || statusOf(d.key)})</option>)}
                </optgroup>
              )}
            </select>

            {pipeDish && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{pipeDish.title}</div>
                <div style={{ fontSize: 12, color: C.dim, marginBottom: 6 }}>{pipeDish.origin.replace(/&middot;/g, '·')}</div>
                <div style={S.chipRow}>
                  {pipeDish.diet && <span style={{ ...S.chip(true), cursor: 'default' }}>{pipeDish.diet}</span>}
                  {Object.keys(pipeDish.allergenFlags || {}).map(a => (
                    <span key={a} style={{ ...S.chip(false), cursor: 'default' }}>{a}</span>
                  ))}
                  <span style={{ ...S.chip(false), cursor: 'default', color: pipeStatus === 'testing' ? C.good : C.warn }}>{pipeStatus}</span>
                </div>
                <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5, marginBottom: 4 }}>{pipeDish.desc}</div>
                <div style={{ fontSize: 10.5, color: C.faint, marginBottom: 10 }}>Copy is canon; edit in pipelineDishes.js.</div>

                {/* Vote standing */}
                <div style={S.section}>
                  <div style={S.sectionTitle}>Vote standing</div>
                  {voteErr && <div style={{ fontSize: 12, color: C.dim }}>Couldn't load votes.</div>}
                  {!voteErr && !voteFull && <div style={{ fontSize: 12, color: C.dim }}>Loading…</div>}
                  {pipeVote && (
                    <div style={{ fontSize: 13, color: C.text }}>
                      Rank <b style={{ color: C.good }}>#{pipeVote.rank}</b> of {pipeVote.of} · <b>{pipeVote.votes}</b> vote{pipeVote.votes === 1 ? '' : 's'} · {pipeVote.ballots} ballot{pipeVote.ballots === 1 ? '' : 's'} total
                    </div>
                  )}
                  {voteFull && !pipeVote && <div style={{ fontSize: 12, color: C.dim }}>Not on the current vote board.</div>}
                </div>

                {/* Economics — votes tell you demand; this tells you dollars.
                    Costs the candidate from its own ingredient list; gates
                    gracefully when the recipe isn't developed yet. */}
                <div style={S.section}>
                  <div style={S.sectionTitle}>Economics</div>
                  {!pipeCost || pipeCost.total === 0 ? (
                    <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5 }}>
                      Needs recipe to cost. Add this candidate's ingredients in <code style={{ color: C.faint }}>pipelineDishes.js</code> (name, qty, unit) and a ballpark cost and margin show up here.
                    </div>
                  ) : !pipeCost.costable ? (
                    <div style={{ fontSize: 12.5, color: C.warn, lineHeight: 1.5 }}>
                      Partially costable: {pipeCost.resolvedCount} of {pipeCost.total} lines resolved.
                      {pipeCost.missing.length > 0 && (
                        <div style={{ fontSize: 11.5, color: C.dim, marginTop: 4 }}>
                          No cost mapping for: {pipeCost.missing.join(', ')}. These names need a LINE_MAP entry (added at Promote).
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, color: C.text, marginBottom: 8 }}>
                        Ballpark cost <b style={{ color: CREAM || '#e8e2d4' }}>{currency(pipeCost.buffered)}</b>
                        <span style={{ fontSize: 11, color: C.faint }}> (raw {currency(pipeCost.raw)} × buffer)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: C.dim }}>If you ran it at</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: 13, color: C.dim }}>$</span>
                          <input
                            type="number" inputMode="decimal" step="1" min="0"
                            placeholder="price"
                            value={pipeTargetPrice}
                            onChange={e => setPipeTargetPrice(e.target.value)}
                            style={{ width: 80, padding: '6px 8px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.panelAlt, color: C.text, fontSize: 13 }}
                          />
                        </span>
                      </div>
                      {pipeMargin && (
                        <div style={{ ...S.banner(pipeMargin.marginPct >= 45 ? 'good' : pipeMargin.marginPct >= 40 ? 'warn' : 'bad'), marginTop: 8 }}>
                          Would hold <b>{pipeMargin.marginPct}%</b> margin ({currency(pipeMargin.marginDollars)} per sale) at {currency(pipeMargin.price)}.
                          {pipeMargin.marginPct < 45 && ' Below the 45% floor.'}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Open questions */}
                {(pipeDish.openQuestions || []).length > 0 && (
                  <div style={S.section}>
                    <div style={S.sectionTitle}>Open questions</div>
                    {pipeDish.openQuestions.map((q, i) => {
                      const a = answeredQ[i];
                      return (
                        <div key={i} style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 4, color: a ? C.faint : C.text }}>
                          <span style={{ textDecoration: a ? 'line-through' : 'none' }}>{q}</span>
                          {a && <span style={{ color: a.verdict === 'held' ? C.good : C.badText, marginLeft: 6 }}>
                            {a.verdict}{a.dayN ? ` · day ${a.dayN}` : ''}
                          </span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Test-kitchen journal */}
                <div style={S.section}>
                  <div style={S.sectionTitle}>Test-kitchen journal</div>
                  {pipeLog.length === 0 && <div style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>No entries yet.</div>}
                  {pipeLog.map((e, i) => (
                    <div key={i} style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 6, borderLeft: `2px solid ${C.border}`, paddingLeft: 8, position: 'relative' }}>
                      <span style={{ color: C.faint }}>{String(e.at || '').slice(0, 10)}</span>{' '}
                      <span style={{ color: C.dim }}>{e.kind}{e.dayN ? ` · day ${e.dayN}` : ''}</span>
                      {e.verdict && <span style={{ color: e.verdict === 'held' ? C.good : C.badText, marginLeft: 4 }}> · {e.verdict}</span>}
                      <button
                        onClick={() => deleteJournalEntry(e.at)}
                        title="Delete this entry"
                        style={{ position: 'absolute', top: 0, right: 0, border: 'none', background: 'none', color: C.faint, fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
                      >×</button>
                      {e.note && <div style={{ color: C.text }}>{e.note}</div>}
                    </div>
                  ))}

                  {/* Add entry */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    <select style={{ ...S.select, width: 'auto', marginBottom: 6 }} value={jKind} onChange={e => setJKind(e.target.value)}>
                      <option value="cook">cook</option>
                      <option value="reheat">reheat</option>
                      <option value="note">note</option>
                    </select>
                    {jKind === 'reheat' && (
                      <input style={{ ...S.select, width: 70, marginBottom: 6 }} type="number" placeholder="day" value={jDayN} onChange={e => setJDayN(e.target.value)} />
                    )}
                    <select style={{ ...S.select, width: 'auto', marginBottom: 6 }} value={jVerdict} onChange={e => setJVerdict(e.target.value)}>
                      <option value="">verdict…</option>
                      <option value="held">held</option>
                      <option value="died">died</option>
                    </select>
                    {(pipeDish.openQuestions || []).length > 0 && (
                      <select style={{ ...S.select, width: 'auto', marginBottom: 6 }} value={jQ} onChange={e => setJQ(e.target.value)}>
                        <option value="">answers Q…</option>
                        {pipeDish.openQuestions.map((q, i) => <option key={i} value={i}>Q{i + 1}</option>)}
                      </select>
                    )}
                  </div>
                  <textarea style={{ ...S.select, minHeight: 44 }} placeholder="What happened?" value={jNote} onChange={e => setJNote(e.target.value)} />
                  <button style={S.chip(false)} onClick={addJournalEntry}>Add journal entry</button>
                </div>

                {/* Promote */}
                {pipeStatus === 'testing' && (
                  <div style={S.section}>
                    <div style={S.sectionTitle}>Promote to the menu</div>
                    <div style={{ fontSize: 11.5, color: C.dim, lineHeight: 1.5, marginBottom: 8 }}>
                      Generates the scaffold for every surface. The Big 3 — description, reheat card, and margins — stay blank on purpose; fill them with Claude. The gate stays red until they're real.
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: C.dim }}>Cuisine:</span>
                      <select style={{ ...S.select, width: 'auto', marginBottom: 0 }} value={promoteCuisine} onChange={e => setPromoteCuisine(e.target.value)}>
                        {['American', 'Southern', 'Tex-Mex', 'Indian', 'Japanese', 'Korean', 'Chinese', 'Thai', 'Italian', 'German', 'Spotlight'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button style={S.chip(true)} onClick={doPromote}>Generate promote scaffold</button>
                    {promoteText && (
                      <div style={{ marginTop: 8 }}>
                        <button style={S.chip(false)} onClick={() => { copyText(promoteText); setCopiedPromote(true); setTimeout(() => setCopiedPromote(false), 1500); }}>
                          {copiedPromote ? 'Copied ✓' : 'Copy scaffold'}
                        </button>
                        <pre style={{ fontSize: 10.5, color: C.dim, background: C.panelAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, marginTop: 8, overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: 260 }}>{promoteText}</pre>
                      </div>
                    )}
                  </div>
                )}
                {pipeStatus === 'promoting' && (
                  <div style={S.section}>
                    <div style={S.sectionTitle}>Promote checklist</div>
                    {(pipeJournal.promoteChecklist ? pipeJournal.promoteChecklist.items : []).map(it => (
                      <div key={it.id} onClick={() => toggleChecklistItem(it.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, lineHeight: 1.6, cursor: 'pointer', color: it.done ? C.faint : C.text }}>
                        <span style={{ display: 'inline-block', width: 15, height: 15, borderRadius: 4, border: `1px solid ${it.done ? C.good : C.border}`, background: it.done ? 'rgba(93,202,165,0.2)' : 'transparent', color: C.good, textAlign: 'center', fontSize: 11, lineHeight: '14px', flexShrink: 0 }}>{it.done ? '✓' : ''}</span>
                        <span style={{ textDecoration: it.done ? 'line-through' : 'none' }}>{it.label}</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, color: C.warn, marginTop: 8 }}>
                      Finish the scaffold with Claude, then run the gate.{' '}
                      <button style={{ ...S.chip(false), marginLeft: 6 }} onClick={() => setPipeStatus('testing')}>Back to testing</button>
                    </div>
                    {promoteText && (
                      <div style={{ marginTop: 8 }}>
                        <button style={S.chip(false)} onClick={() => { copyText(promoteText); setCopiedPromote(true); setTimeout(() => setCopiedPromote(false), 1500); }}>
                          {copiedPromote ? 'Copied ✓' : 'Copy scaffold again'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>


      {/* ── Portfolio radar ── */}
      <div style={S.section}>
        <button style={S.collapseBtn} onClick={() => setShowPortfolio(o => !o)}>
          <span>Menu overview · margin & drift radar</span>
          <span>{showPortfolio ? '▲' : '▼'}</span>
        </button>
        {showPortfolio && (
          <div style={{ marginTop: 8, overflowX: 'auto' }}>
            {/* Profit-$ window selector — only affects the Profit $ column/sort. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 10.5, color: C.faint, textTransform: 'uppercase', letterSpacing: 0.4 }}>Profit window</span>
              {[['month', 'This month'], ['quarter', 'Quarter'], ['all', 'All time']].map(([k, label]) => (
                <button key={k} style={{ ...S.chip(portWindow === k), padding: '4px 9px', fontSize: 11.5 }} onClick={() => setPortWindow(k)}>{label}</button>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.portTh} onClick={() => setPortSort('name')}>Dish</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }} onClick={() => setPortSort('profit')}>Profit ${portSort === 'profit' ? ' ▾' : ''}</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }} onClick={() => setPortSort('margin')}>Worst margin{portSort === 'margin' ? ' ▾' : ''}</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }} onClick={() => setPortSort('drift')}>Drift{portSort === 'drift' ? ' ▾' : ''}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPortfolio.filter(r => (r.group || 'main') === 'main').map(r => (
                  <tr key={r.name} style={{ cursor: 'pointer' }} onClick={() => setDish(r.name)}>
                    <td style={{ ...S.portTd, color: r.name === dish ? C.good : C.text }}>
                      {thisWeek.has(r.name) ? '● ' : ''}{r.name}
                    </td>
                    <td style={{ ...S.portTd, textAlign: 'right', fontWeight: 700, color: (r.profitContribution ?? 0) > 0 ? C.good : C.faint }}>
                      {r.profitContribution == null ? '—' : (r.profitContribution === 0 ? '$0' : currency(r.profitContribution))}
                      {r.orderCount > 0 && (
                        <div style={{ fontSize: 9, fontWeight: 400, color: C.faint }}>{r.units}u · {r.orderCount}ord{r.est ? ' · est' : ''}</div>
                      )}
                    </td>
                    <td style={{ ...S.portTd, textAlign: 'right', color: marginColor(r.hasPassthrough ? r.worstValueAddPct : r.worstMarginPct), fontWeight: 700 }}>
                      {r.hasPassthrough ? r.worstValueAddPct : r.worstMarginPct}%{r.underFloor ? ' ⚠' : ''}
                      {r.hasPassthrough && (
                        <div style={{ fontSize: 9, fontWeight: 400, color: C.faint }}>{r.worstMarginPct}% blended</div>
                      )}
                    </td>
                    <td style={{ ...S.portTd, textAlign: 'right', color: Math.abs(r.maxDriftPct) >= 2 ? (r.maxDriftPct > 0 ? C.badText : C.good) : C.faint }}>
                      {r.maxDriftPct === 0 ? '—' : `${r.maxDriftPct > 0 ? '↑' : '↓'}${Math.abs(r.maxDriftPct)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Dish picker ── */}
      <select style={S.select} value={dish} onChange={e => setDish(e.target.value)}>
        <option value="">Select a dish…</option>
        <optgroup label="This week">
          {dishes.filter(d => thisWeek.has(d)).map(d => <option key={d} value={d}>{d}</option>)}
        </optgroup>
        <optgroup label="All dishes">
          {dishes.filter(d => !thisWeek.has(d)).map(d => <option key={d} value={d}>{d}</option>)}
        </optgroup>
      </select>

      {/* ── Ready to Finish (sous vide proteins) — own collapsed margin radar ── */}
      <div style={S.section}>
        <button style={S.collapseBtn} onClick={() => setShowProteins(o => !o)}>
          <span>Ready to Finish · sous vide proteins</span>
          <span>{showProteins ? '▲' : '▼'}</span>
        </button>
        {showProteins && (
          <div style={{ marginTop: 8, overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '0 0 8px' }}>
              <span style={{ fontSize: 10, color: C.faint, letterSpacing: 0.5 }}>PROFIT WINDOW</span>
              {[['month', 'This month'], ['quarter', 'Quarter'], ['all', 'All time']].map(([k, label]) => (
                <button key={k} style={{ ...S.chip(portWindow === k), padding: '3px 8px', fontSize: 11 }} onClick={() => setPortWindow(k)}>{label}</button>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.portTh}>Item</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }}>Profit $</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }}>Worst margin</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }}>Drift</th>
                </tr>
              </thead>
              <tbody>
                {sortedPortfolio.filter(r => r.group === 'protein').map(r => (
                  <tr key={r.name} style={{ cursor: 'pointer' }} onClick={() => setDish(r.name)}>
                    <td style={{ ...S.portTd, color: r.name === dish ? C.good : C.text }}>{r.name}</td>
                    <td style={{ ...S.portTd, textAlign: 'right', fontWeight: 700, color: (r.profitContribution ?? 0) > 0 ? C.good : C.faint }}>
                      {r.profitContribution == null ? '—' : (r.profitContribution === 0 ? '$0' : currency(r.profitContribution))}
                    </td>
                    <td style={{ ...S.portTd, textAlign: 'right', color: marginColor(r.hasPassthrough ? r.worstValueAddPct : r.worstMarginPct), fontWeight: 700 }}>
                      {r.hasPassthrough ? r.worstValueAddPct : r.worstMarginPct}%{r.underFloor ? ' ⚠' : ''}
                      {r.hasPassthrough && (
                        <div style={{ fontSize: 9, fontWeight: 400, color: C.faint }}>{r.worstMarginPct}% blended</div>
                      )}
                    </td>
                    <td style={{ ...S.portTd, textAlign: 'right', color: Math.abs(r.maxDriftPct) >= 2 ? (r.maxDriftPct > 0 ? C.badText : C.good) : C.faint }}>
                      {r.maxDriftPct === 0 ? '—' : `${r.maxDriftPct > 0 ? '↑' : '↓'}${Math.abs(r.maxDriftPct)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Sous Vide Vegetables — own collapsed margin radar ── */}
      <div style={S.section}>
        <button style={S.collapseBtn} onClick={() => setShowVeg(o => !o)}>
          <span>Sous Vide Vegetables</span>
          <span>{showVeg ? '▲' : '▼'}</span>
        </button>
        {showVeg && (
          <div style={{ marginTop: 8, overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '0 0 8px' }}>
              <span style={{ fontSize: 10, color: C.faint, letterSpacing: 0.5 }}>PROFIT WINDOW</span>
              {[['month', 'This month'], ['quarter', 'Quarter'], ['all', 'All time']].map(([k, label]) => (
                <button key={k} style={{ ...S.chip(portWindow === k), padding: '3px 8px', fontSize: 11 }} onClick={() => setPortWindow(k)}>{label}</button>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.portTh}>Item</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }}>Profit $</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }}>Worst margin</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }}>Drift</th>
                </tr>
              </thead>
              <tbody>
                {sortedPortfolio.filter(r => r.group === 'veg').map(r => (
                  <tr key={r.name} style={{ cursor: 'pointer' }} onClick={() => setDish(r.name)}>
                    <td style={{ ...S.portTd, color: r.name === dish ? C.good : C.text }}>{r.name}</td>
                    <td style={{ ...S.portTd, textAlign: 'right', fontWeight: 700, color: (r.profitContribution ?? 0) > 0 ? C.good : C.faint }}>
                      {r.profitContribution == null ? '—' : (r.profitContribution === 0 ? '$0' : currency(r.profitContribution))}
                    </td>
                    <td style={{ ...S.portTd, textAlign: 'right', color: marginColor(r.hasPassthrough ? r.worstValueAddPct : r.worstMarginPct), fontWeight: 700 }}>
                      {r.hasPassthrough ? r.worstValueAddPct : r.worstMarginPct}%{r.underFloor ? ' ⚠' : ''}
                      {r.hasPassthrough && (
                        <div style={{ fontSize: 9, fontWeight: 400, color: C.faint }}>{r.worstMarginPct}% blended</div>
                      )}
                    </td>
                    <td style={{ ...S.portTd, textAlign: 'right', color: Math.abs(r.maxDriftPct) >= 2 ? (r.maxDriftPct > 0 ? C.badText : C.good) : C.faint }}>
                      {r.maxDriftPct === 0 ? '—' : `${r.maxDriftPct > 0 ? '↑' : '↓'}${Math.abs(r.maxDriftPct)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Desserts (cookies, fudge, brownies) — own collapsed margin radar ── */}
      <div style={S.section}>
        <button style={S.collapseBtn} onClick={() => setShowDesserts(o => !o)}>
          <span>Desserts</span>
          <span>{showDesserts ? '▲' : '▼'}</span>
        </button>
        {showDesserts && (
          <div style={{ marginTop: 8, overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '0 0 8px' }}>
              <span style={{ fontSize: 10, color: C.faint, letterSpacing: 0.5 }}>PROFIT WINDOW</span>
              {[['month', 'This month'], ['quarter', 'Quarter'], ['all', 'All time']].map(([k, label]) => (
                <button key={k} style={{ ...S.chip(portWindow === k), padding: '3px 8px', fontSize: 11 }} onClick={() => setPortWindow(k)}>{label}</button>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.portTh}>Item</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }}>Profit $</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }}>Worst margin</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }}>Drift</th>
                </tr>
              </thead>
              <tbody>
                {sortedPortfolio.filter(r => r.group === 'dessert').map(r => (
                  <tr key={r.name} style={{ cursor: 'pointer' }} onClick={() => setDish(r.name)}>
                    <td style={{ ...S.portTd, color: r.name === dish ? C.good : C.text }}>{r.name}</td>
                    <td style={{ ...S.portTd, textAlign: 'right', fontWeight: 700, color: (r.profitContribution ?? 0) > 0 ? C.good : C.faint }}>
                      {r.profitContribution == null ? '—' : (r.profitContribution === 0 ? '$0' : currency(r.profitContribution))}
                    </td>
                    <td style={{ ...S.portTd, textAlign: 'right', color: marginColor(r.hasPassthrough ? r.worstValueAddPct : r.worstMarginPct), fontWeight: 700 }}>
                      {r.hasPassthrough ? r.worstValueAddPct : r.worstMarginPct}%{r.underFloor ? ' ⚠' : ''}
                      {r.hasPassthrough && (
                        <div style={{ fontSize: 9, fontWeight: 400, color: C.faint }}>{r.worstMarginPct}% blended</div>
                      )}
                    </td>
                    <td style={{ ...S.portTd, textAlign: 'right', color: Math.abs(r.maxDriftPct) >= 2 ? (r.maxDriftPct > 0 ? C.badText : C.good) : C.faint }}>
                      {r.maxDriftPct === 0 ? '—' : `${r.maxDriftPct > 0 ? '↑' : '↓'}${Math.abs(r.maxDriftPct)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Serving-size check — flags label/yield drift from the 4/8 baseline ── */}
      <div style={S.section}>
        <button style={S.collapseBtn} onClick={() => setShowServings(o => !o)}>
          <span>Serving-size check{servingFlags.length ? ` · ${servingFlags.length} ⚠` : ' · all clear'}</span>
          <span>{showServings ? '▲' : '▼'}</span>
        </button>
        {showServings && (
          <div style={{ marginTop: 8 }}>
            <p style={{ ...S.hint, marginTop: 0 }}>
              Target: a small feeds 4, a large 8. Dishes bound by a fixed construct (egg pasta, can/pack sizes, plated cuts) carry an override and are marked <span style={{ color: C.dim }}>bound</span>. A ⚠ means a label drifts from its target by more than 20%. Enter a real cooked batch weight on a dish (cookedWeightG) to also check the claim against actual yield.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={S.portTh}>Dish</th>
                    <th style={{ ...S.portTh, textAlign: 'right' }}>Claim (S / L)</th>
                    <th style={{ ...S.portTh, textAlign: 'right' }}>Target</th>
                    <th style={{ ...S.portTh, textAlign: 'right' }}>Yield*</th>
                    <th style={{ ...S.portTh, textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {servingAudit.map(d => {
                    const small = d.rows.find(r => r.size === 'small');
                    const large = d.rows.find(r => r.size === 'large');
                    const claimS = small && small.claimed != null ? small.claimed : '—';
                    const claimL = large && large.claimed != null ? large.claimed : '—';
                    const realYield = d.cookedWeightG && d.portionTargetG
                      ? Math.round(d.cookedWeightG / d.portionTargetG) : null;
                    return (
                      <tr key={d.name} style={{ cursor: 'pointer' }} onClick={() => setDish(d.name)}>
                        <td style={{ ...S.portTd, color: d.name === dish ? C.good : C.text }}>
                          {d.name}{d.bound ? <span style={{ color: C.faint, fontSize: 11 }}> · bound</span> : ''}
                        </td>
                        <td style={{ ...S.portTd, textAlign: 'right' }}>{claimS} / {claimL}</td>
                        <td style={{ ...S.portTd, textAlign: 'right', color: C.dim }}>{d.target.small} / {d.target.large}</td>
                        <td style={{ ...S.portTd, textAlign: 'right', color: C.faint }}>{realYield != null ? realYield : '—'}</td>
                        <td style={{ ...S.portTd, textAlign: 'right', color: d.anyFlag ? C.badText : C.faint, fontWeight: d.anyFlag ? 700 : 400 }}>
                          {d.anyFlag ? '⚠' : (d.bound ? 'bound' : 'ok')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ ...S.hint, fontSize: 11, color: C.faint }}>*Yield shows real servings only for dishes where you've entered a weighed batch; blank until then.</p>
          </div>
        )}
      </div>

      {report && (
        <>
          {/* ── Customer feedback (dish-linked, saved via the Orders-page triage) ── */}
          <FeedbackStrip fb={(dishFeedback || {})[dish]} dish={dish} onReset={onResetDishFeedback} />

          {/* ── Flavor + size ── */}
          {(report.decomposition.groups.length > 1 || report.decomposition.hasSizeToggle) && (
            <div style={S.section}>
              {report.decomposition.groups.length > 1 && (
                <>
                  <div style={S.sectionTitle}>Version</div>
                  <div style={S.chipRow}>
                    {report.decomposition.groups.map((g, i) => (
                      <button key={g.flavor} style={S.chip(i === flavorIdx)} onClick={() => pickFlavor(i)}>{g.flavor}</button>
                    ))}
                  </div>
                </>
              )}
              {group && group.small && group.large ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button style={S.toggle(size === 'small')} onClick={() => setSize('small')}>
                    Small{group.small && report.variantByLabel.get(group.small.label).servings ? ` · ~${report.variantByLabel.get(group.small.label).servings}` : ''}
                  </button>
                  <button style={S.toggle(size === 'large')} onClick={() => setSize('large')}>
                    Large{group.large && report.variantByLabel.get(group.large.label).servings ? ` · ~${report.variantByLabel.get(group.large.label).servings}` : ''}
                  </button>
                </div>
              ) : group && (group.small || group.large) && !group.only ? (
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{group.small ? 'Small only' : 'Large only'}</div>
              ) : null}
            </div>
          )}

          {/* ── Economics ── */}
          {econ && (
            <div style={S.section}>
              <div style={S.sectionTitle}>{currentVariant.label}</div>
              <div style={S.row}><span style={{ color: C.dim }}>Price</span><span style={{ fontWeight: 700 }}>{currency(econ.price)}</span></div>
              <div style={S.row}>
                <span style={{ color: C.dim }}>Cost (buffered)</span>
                <span>{currency(econ.liveCost)}{Math.abs(econ.driftPct) >= 2 && <span style={{ color: econ.driftPct > 0 ? C.badText : C.good, fontWeight: 700 }}> {econ.driftPct > 0 ? '↑' : '↓'}{Math.abs(econ.driftPct).toFixed(0)}%</span>}</span>
              </div>
              <div style={S.row}>
                <span style={{ color: C.dim }}>Margin{econ.hasPassthrough ? ' (blended)' : ''}</span>
                <span style={{ color: marginColor(econ.hasPassthrough ? econ.valueAddMarginPct : econ.marginLivePct), fontWeight: 700 }}>{currency(econ.marginLive)} · {econ.marginLivePct.toFixed(0)}%</span>
              </div>
              {econ.hasPassthrough && (
                <>
                  <div style={S.row}>
                    <span style={{ color: C.dim }}>Value-add margin</span>
                    <span style={{ color: marginColor(econ.valueAddMarginPct), fontWeight: 700 }}>{econ.valueAddMarginPct.toFixed(0)}%</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: C.faint, padding: '2px 0' }}>
                    {currency(econ.passthroughRaw)} sold at cost, no markup — value-add excludes it from both sides. Judged on this number.
                  </div>
                </>
              )}
              <div style={{ ...S.row, fontSize: 11, color: C.faint }}>
                <span>True cost ~{currency(econ.rawCost)} (buffer ×{MARGIN_BUFFER})</span>
                {econ.pricePerServing && <span>{currency(econ.pricePerServing)}/serving</span>}
              </div>
              {Math.abs(econ.liveCost - econ.anchorCost) > 0.005 && (
                <div style={{ ...S.row, fontSize: 11, color: C.dim }}>
                  <span>Baseline anchor</span><span>{currency(econ.anchorCost)} · {econ.marginBasePct.toFixed(0)}%</span>
                </div>
              )}
              {econ.underFloorEffective && (
                <div style={S.banner('bad')}>
                  Below the {report.floorPct}% floor{econ.hasPassthrough ? ' on value-add basis (pasta already excluded)' : ''}. {econ.priceToHoldFloor && !econ.hasPassthrough ? `About ${currency(econ.priceToHoldFloor.suggested)} would hold it.` : ''}
                </div>
              )}
            </div>
          )}

          {/* ── Sales history (moved from Money tab) ── */}
          {sales && (
            <div style={S.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={S.sectionTitle}>Sales history</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[['week', 'Wk'], ['month', 'Mo'], ['year', 'Yr'], ['all', 'All']].map(([p, lbl]) => (
                    <button key={p} onClick={() => setSalesPeriod(p)}
                      style={{ padding: '3px 9px', borderRadius: 6, border: `1px solid ${salesPeriod === p ? C.good : C.border}`, background: salesPeriod === p ? 'rgba(93,202,165,0.15)' : 'transparent', color: salesPeriod === p ? C.good : C.dim, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              {sales.hasData ? (
                <>
                  <div style={S.row}><span style={{ color: C.dim }}>Units sold</span><span style={{ fontWeight: 700 }}>{sales.units}{sales.orderCount ? ` · ${sales.orderCount} order${sales.orderCount !== 1 ? 's' : ''}` : ''}</span></div>
                  <div style={S.row}><span style={{ color: C.dim }}>Revenue</span><span>{currency(sales.revenue)}</span></div>
                  <div style={S.row}><span style={{ color: C.dim }}>Cost</span><span>{currency(sales.cost)}{sales.est ? ' ‡' : ''}{sales.unknown ? ' *' : ''}</span></div>
                  <div style={S.row}>
                    <span style={{ color: C.dim }}>Profit</span>
                    <span style={{ fontWeight: 700, color: sales.profit >= 0 ? C.good : C.badText }}>
                      {sales.profit >= 0 ? '+' : ''}{currency(sales.profit)} · {sales.marginPct}%
                    </span>
                  </div>
                  {(sales.est || sales.unknown) && (
                    <div style={{ fontSize: 10.5, color: C.faint, marginTop: 6 }}>
                      Revenue is item price + upcharges, before order-level discounts and fees.
                      {sales.est ? ' ‡ includes estimated costs.' : ''}{sales.unknown ? ' * some costs unknown.' : ''}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: C.dim }}>No sales in this period.</div>
              )}
            </div>
          )}

          {/* ── Recipe ── */}
          {recipe && (
            <div style={S.section}>
              <div style={S.sectionTitle}>
                Recipe{recipe.factor !== 1 ? ` · ×${recipe.factor} batch` : ''}
              </div>
              {recipe.displayLines.map((ln, i) => (
                <div key={i} style={S.row}>
                  <span style={{ color: ln.staple ? C.faint : C.text }}>{ln.name}{ln.staple ? ' ✦' : ''}</span>
                  <span style={{ color: C.dim }}>{ln.qty} {ln.unit}</span>
                </div>
              ))}
              {recipe.costDrivers.length > 0 && (
                <div style={{ fontSize: 11.5, color: C.dim, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                  <span style={{ color: C.faint }}>Cost drivers: </span>
                  {recipe.costDrivers.map(d => `${d.name} ${d.pctOfRaw}%`).join(' · ')}
                </div>
              )}
              <button style={{ ...S.collapseBtn, marginTop: 8 }} onClick={() => setShowBreakdown(o => !o)}>
                <span>Full cost breakdown ({currency(recipe.rawTotal)} raw)</span><span>{showBreakdown ? '▲' : '▼'}</span>
              </button>
              {showBreakdown && (
                <div style={{ marginTop: 6 }}>
                  {recipe.costedLines.map((l, i) => (
                    <div key={i} style={S.ingRow}>
                      <span style={{ flex: 1, color: l.staple ? C.faint : C.text }}>{l.name}</span>
                      <span style={{ color: C.dim, width: 90, textAlign: 'right' }}>{l.qty} {l.unit} @ {currency(l.unitCost)}</span>
                      <span style={{ width: 60, textAlign: 'right', fontWeight: 600 }}>{currency(l.lineCost)}</span>
                      <span style={{ width: 42, textAlign: 'right', color: C.faint }}>{l.pctOfRaw}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Cost over time ── */}
          {cot && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Cost over time</div>
              {cot.historyPoints === 0 ? (
                <div style={{ fontSize: 12.5, color: C.dim }}>No receipt history yet for these ingredients. Scanning receipts will populate this.</div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <Sparkline points={cot.dishSeries.map(p => p.rawCost)} width={140} height={34} />
                    <div style={{ fontSize: 12, color: C.dim }}>
                      raw {currency(cot.dishSeries[0].rawCost)} → {currency(cot.dishSeries[cot.dishSeries.length - 1].rawCost)}
                      <div style={{ fontSize: 10.5, color: C.faint }}>{cot.historyPoints} history points</div>
                    </div>
                  </div>
                  {cot.ingredientTrends.slice(0, 6).map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 0' }}>
                      <span style={{ fontSize: 12, flex: 1 }}>{t.name}</span>
                      <Sparkline points={t.points.map(p => p.cost)} width={70} height={18} />
                      <span style={{ fontSize: 11, width: 56, textAlign: 'right', color: (t.pctFromBaseline ?? 0) > 0 ? C.badText : (t.pctFromBaseline ?? 0) < 0 ? C.good : C.faint }}>
                        {t.pctFromBaseline == null ? '—' : `${t.pctFromBaseline > 0 ? '+' : ''}${t.pctFromBaseline}%`}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── Scaling check ── */}
          {scaleForFlavor && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Scaling</div>
              {scaleForFlavor.clean ? (
                <div style={{ fontSize: 13, color: C.good }}>Large = ×{scaleForFlavor.ratio} Small ✓</div>
              ) : (
                <div style={{ fontSize: 12.5, color: C.warn }}>
                  Large scales ×{scaleForFlavor.ratio ?? '?'} on most lines, with exceptions:
                  <div style={{ marginTop: 4, color: C.dim }}>
                    {scaleForFlavor.mismatches.map((m, i) => <div key={i}>· {m.id}: {m.note}</div>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Reheat ── */}
          {reheat.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Reheat (what the customer sees)</div>
              {reheat.map((b, i) => (
                <div key={i} style={{ marginBottom: i < reheat.length - 1 ? 8 : 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: TEAL_LIGHT || C.good, marginBottom: 2 }}>{b.title}</div>
                  <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.45 }}>{Array.isArray(b.body) ? b.body.join(' ') : b.body}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Pairings (canon, same as the customer menus) ── */}
          {report.pairings.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Goes well with</div>
              {report.pairings.map((pr, i) => (
                <div key={i} style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5, marginBottom: i < report.pairings.length - 1 ? 5 : 0 }}>
                  <span style={{ color: CREAM || '#e8e2d4', fontWeight: 600 }}>{pr.drink}</span> — {pr.why}
                </div>
              ))}
            </div>
          )}

          {/* ── Equipment + options ── */}
          {(report.equipment.length > 0 || report.options) && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Equipment & options</div>
              {report.equipment.length > 0 && (
                <div style={{ ...S.chipRow, marginBottom: report.options ? 8 : 0 }}>
                  {report.equipment.map((e, i) => (
                    <span key={i} style={{ fontSize: 11.5, padding: '4px 9px', borderRadius: 7, background: C.panelAlt, border: `1px solid ${C.border}`, color: C.dim }}>
                      {e.label} · {e.kind}
                    </span>
                  ))}
                </div>
              )}
              {report.options && (
                <div style={{ fontSize: 12, color: C.dim }}>
                  Customer options: {report.options.spice ? `spice ${report.options.spice.min}-${report.options.spice.max}` : ''}
                  {report.options.spice && report.options.pasta ? ', ' : ''}
                  {report.options.pasta ? `pasta shape${report.options.pasta.excludeVariants ? ` (not on ${report.options.pasta.excludeVariants.join('/')} variants)` : ''}` : ''}
                </div>
              )}
            </div>
          )}

          {/* ── Cook notes ── */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Cook notes</div>
            <textarea
              style={S.notes}
              placeholder="Technique reminders, timing, substitutions, anything you want to remember…"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
            />
            <button style={S.saveBtn} onClick={() => onSaveDishNote(dish, noteText)}>Save notes</button>
          </div>

          {/* ── Content studio: this dish, told well, in Kevin's voice ── */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Content studio</div>
            <div style={{ fontSize: 12, color: '#8a958f', marginBottom: 8, lineHeight: 1.45 }}>
              Turn this dish into a post. Grounded in the real recipe and your cook notes, written in your voice. Each draft is one small Sonnet call.
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['science', 'Food science'], ['technique', 'Technique'], ['story', 'Behind the dish'], ['caption', 'IG caption']].map(([k, label]) => (
                <button key={k} style={{ ...S.chip(false), opacity: drafting ? 0.5 : 1 }} disabled={drafting} onClick={() => makeDraft(k)}>{label}</button>
              ))}
            </div>
            {drafting && <div style={{ fontSize: 12.5, color: '#9aa5a0', marginTop: 10 }}>Writing…</div>}
            {draftErr && <div style={S.banner('warn')}>{draftErr}</div>}
            {draft && (
              <>
                <div style={{ marginTop: 10, padding: '11px 13px', background: '#14201d', border: '1px solid #2d3a36', borderRadius: 8, fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{draft}</div>
                <button style={S.saveBtn} onClick={async () => { await copyText(draft); setCopiedDraft(true); setTimeout(() => setCopiedDraft(false), 2000); }}>
                  {copiedDraft ? '✓ Copied' : 'Copy draft'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
