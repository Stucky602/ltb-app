import React, { useState, useMemo, useEffect } from 'react';
import { TEAL_DARK, TEAL_MID, TEAL_LIGHT, GOLD, CREAM, DARK, CARD } from '../styles.js';
import { currency } from '../utils.js';
import { MARGIN_BUFFER } from '../dishCosting.js';
import {
  buildDishReport, buildPortfolioSummary, reportableDishes,
} from '../dishReport.js';

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
  wrap: { padding: '12px 14px 40px', color: C.text },
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

export function RecipesTab({ liveCostMap, baseCostMap, costHistory, dishNotes, onSaveDishNote, weekDishes }) {
  const [dish, setDish] = useState('');
  const [flavorIdx, setFlavorIdx] = useState(0);
  const [size, setSize] = useState('small'); // 'small' | 'large' | 'only'
  const [noteText, setNoteText] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [portSort, setPortSort] = useState('margin');

  const ctx = useMemo(() => ({ liveCostMap, baseCostMap, costHistory }), [liveCostMap, baseCostMap, costHistory]);
  const report = useMemo(() => (dish ? buildDishReport(dish, ctx) : null), [dish, ctx]);
  const portfolio = useMemo(() => buildPortfolioSummary(ctx), [ctx]);

  const dishes = useMemo(() => reportableDishes(), []);
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
  const cot = (report && currentVariant) ? report.costOverTimeFor(currentVariant.label) : null;
  const reheat = (report && currentVariant) ? report.reheatFor(currentVariant.label) : [];
  const scaleForFlavor = (report && group) ? report.scaling.find(s => s.flavor === group.flavor) : null;

  const pickFlavor = (i) => {
    setFlavorIdx(i);
    const g = report.decomposition.groups[i];
    setSize(g.small ? 'small' : g.large ? 'large' : 'only');
  };

  // ── Portfolio sorting ──
  const sortedPortfolio = useMemo(() => {
    const arr = [...portfolio];
    if (portSort === 'margin') arr.sort((a, b) => a.worstMarginPct - b.worstMarginPct);
    else if (portSort === 'gap') arr.sort((a, b) => Math.abs(b.maxAnchorGapPct ?? 0) - Math.abs(a.maxAnchorGapPct ?? 0));
    else if (portSort === 'drift') arr.sort((a, b) => Math.abs(b.maxDriftPct) - Math.abs(a.maxDriftPct));
    return arr;
  }, [portfolio, portSort]);

  return (
    <div style={S.wrap}>
      <h2 style={S.h2}>Recipes</h2>
      <p style={S.hint}>Full recipe, cost, and margin intelligence for any dinner. Pick a dish, then a version.</p>

      {/* ── Portfolio radar ── */}
      <div style={S.section}>
        <button style={S.collapseBtn} onClick={() => setShowPortfolio(o => !o)}>
          <span>Menu overview · margin & re-anchor radar</span>
          <span>{showPortfolio ? '▲' : '▼'}</span>
        </button>
        {showPortfolio && (
          <div style={{ marginTop: 8, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={S.portTh} onClick={() => setPortSort('name')}>Dish</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }} onClick={() => setPortSort('margin')}>Worst margin{portSort === 'margin' ? ' ▾' : ''}</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }} onClick={() => setPortSort('gap')}>Anchor gap{portSort === 'gap' ? ' ▾' : ''}</th>
                  <th style={{ ...S.portTh, textAlign: 'right' }} onClick={() => setPortSort('drift')}>Drift{portSort === 'drift' ? ' ▾' : ''}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPortfolio.map(r => (
                  <tr key={r.name} style={{ cursor: 'pointer' }} onClick={() => setDish(r.name)}>
                    <td style={{ ...S.portTd, color: r.name === dish ? C.good : C.text }}>
                      {thisWeek.has(r.name) ? '● ' : ''}{r.name}
                    </td>
                    <td style={{ ...S.portTd, textAlign: 'right', color: marginColor(r.worstMarginPct), fontWeight: 700 }}>
                      {r.worstMarginPct}%{r.underFloor ? ' ⚠' : ''}
                    </td>
                    <td style={{ ...S.portTd, textAlign: 'right', color: Math.abs(r.maxAnchorGapPct ?? 0) >= 10 ? C.warn : C.faint }}>
                      {r.maxAnchorGapPct == null ? '—' : `${r.maxAnchorGapPct > 0 ? '+' : ''}${r.maxAnchorGapPct}%`}
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

      {report && (
        <>
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
                <span style={{ color: C.dim }}>Margin</span>
                <span style={{ color: marginColor(econ.marginLivePct), fontWeight: 700 }}>{currency(econ.marginLive)} · {econ.marginLivePct.toFixed(0)}%</span>
              </div>
              <div style={{ ...S.row, fontSize: 11, color: C.faint }}>
                <span>True cost ~{currency(econ.rawCost)} (buffer ×{MARGIN_BUFFER})</span>
                {econ.pricePerServing && <span>{currency(econ.pricePerServing)}/serving</span>}
              </div>
              {Math.abs(econ.liveCost - econ.anchorCost) > 0.005 && (
                <div style={{ ...S.row, fontSize: 11, color: C.dim }}>
                  <span>Baseline anchor</span><span>{currency(econ.anchorCost)} · {econ.marginBasePct.toFixed(0)}%</span>
                </div>
              )}
              {econ.anchorGapPct != null && Math.abs(econ.anchorGapPct) >= 10 && (
                <div style={S.banner('warn')}>
                  Anchor is {Math.abs(econ.anchorGapPct)}% {econ.anchorGapPct > 0 ? 'below' : 'above'} today's ingredient reality (recomputes to {currency(econ.recomputedRaw)}).
                  {dish === 'Pasta with Homegrown Tomato Sauce' ? ' Garden economics — this is what it would cost if you bought the tomatoes.' : ' Worth a re-anchor when you next reprice.'}
                </div>
              )}
              {econ.underFloor && (
                <div style={S.banner('bad')}>
                  Below the {report.floorPct}% floor. {econ.priceToHoldFloor ? `About ${currency(econ.priceToHoldFloor.suggested)} would hold it.` : ''}
                </div>
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
        </>
      )}
    </div>
  );
}
