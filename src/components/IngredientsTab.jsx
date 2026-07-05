import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Pencil, X, RotateCcw, ArrowUpDown, Camera } from '../icons.jsx';
import {
  INGREDIENT_SEED, CATEGORY_ORDER, CATEGORY_LABELS_ING,
} from '../ingredients.js';

// Divergence color: green as current drops below baseline, red as it rises above.
// Intensity scales with % drift, capped at 40% for full saturation.
function divergenceStyle(baseline, current) {
  if (!baseline || baseline <= 0) return {};
  const pct = (current - baseline) / baseline; // + = more expensive, - = cheaper
  if (Math.abs(pct) < 0.02) return {}; // within 2% = neutral, no highlight
  const mag = Math.min(Math.abs(pct) / 0.40, 1); // 0..1 saturation
  const alpha = 0.12 + mag * 0.33; // 0.12..0.45
  if (pct < 0) {
    // cheaper — green
    return {
      background: `rgba(63, 184, 160, ${alpha})`,
      borderColor: `rgba(63, 184, 160, ${0.4 + mag * 0.5})`,
    };
  }
  // pricier — red
  return {
    background: `rgba(224, 130, 138, ${alpha})`,
    borderColor: `rgba(224, 130, 138, ${0.4 + mag * 0.5})`,
  };
}

function pctLabel(baseline, current) {
  if (!baseline || baseline <= 0) return null;
  const pct = ((current - baseline) / baseline) * 100;
  if (Math.abs(pct) < 0.5) return null;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(0)}%`;
}

// Compact cost-history sparkline. `points` is a time-sorted array of numbers
// (cost at each recorded moment). Draws a small line; the last point is dotted
// and the line is tinted by overall direction (green = trending down/cheaper,
// red = trending up/pricier, neutral grey = flat). Renders nothing for <2 pts.
function Sparkline({ points, width = 56, height = 18 }) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min;
  const n = points.length;
  // Flat series (no movement) — draw a centered neutral line.
  const y = (v) => {
    if (span < 1e-9) return height / 2;
    // higher cost = higher on screen inverted (SVG y grows downward)
    return height - 2 - ((v - min) / span) * (height - 4);
  };
  const x = (i) => (n === 1 ? 0 : (i / (n - 1)) * (width - 2) + 1);
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const first = points[0];
  const last = points[n - 1];
  const dir = last - first;
  const color = Math.abs(dir) < first * 0.01 ? '#9aa5a0' : (dir < 0 ? '#3fb8a0' : '#e0828a');
  const lastX = x(n - 1), lastY = y(last);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
      <circle cx={lastX} cy={lastY} r="1.8" fill={color} />
    </svg>
  );
}

export function IngredientsTab({ ingredients, costHistory, onChange, onScanReceipt }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // id being edited
  const [editVal, setEditVal] = useState('');
  const [adding, setAdding] = useState(false);
  const [newIng, setNewIng] = useState({ name: '', unit: '', current: '', category: 'produce' });
  const [showStandouts, setShowStandouts] = useState(false);

  const list = ingredients && ingredients.length ? ingredients : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(i => i.name.toLowerCase().includes(q));
  }, [list, search]);

  const byCategory = useMemo(() => {
    const groups = {};
    filtered.forEach(i => {
      const c = i.category || 'pantry';
      if (!groups[c]) groups[c] = [];
      groups[c].push(i);
    });
    Object.keys(groups).forEach(c => groups[c].sort((a, b) => a.name.localeCompare(b.name)));
    return groups;
  }, [filtered]);

  const standouts = useMemo(() => {
    const moved = list
      .map(i => ({ ...i, pct: i.baseline > 0 ? (i.current - i.baseline) / i.baseline : 0 }))
      .filter(i => Math.abs(i.pct) >= 0.05)
      .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
    return {
      up: moved.filter(i => i.pct > 0).slice(0, 8),
      down: moved.filter(i => i.pct < 0).slice(0, 8),
    };
  }, [list]);

  // Group cost-history points by ingredient id, time-sorted, reduced to a plain
  // array of cost numbers per id for the sparkline. Consecutive duplicate costs
  // are collapsed so a flat series doesn't render as a busy flat line, but at
  // least two distinct points are always kept when movement exists.
  const historyById = useMemo(() => {
    const map = {};
    (costHistory || []).forEach(p => {
      if (!p || p.id == null) return;
      (map[p.id] = map[p.id] || []).push(p);
    });
    Object.keys(map).forEach(id => {
      const sorted = map[id].slice().sort((a, b) => a.t - b.t);
      const costs = [];
      sorted.forEach(p => {
        if (!costs.length || Math.abs(costs[costs.length - 1] - p.cost) > 1e-9) costs.push(p.cost);
      });
      map[id] = costs;
    });
    return map;
  }, [costHistory]);

  const startEdit = useCallback((ing) => {
    setEditing(ing.id);
    setEditVal(String(ing.current));
  }, []);

  const saveEdit = useCallback((id) => {
    const v = parseFloat(editVal);
    if (isNaN(v) || v < 0) { setEditing(null); return; }
    onChange(list.map(i => i.id === id ? { ...i, current: v } : i));
    setEditing(null);
  }, [editVal, list, onChange]);

  const resetToBaseline = useCallback((id) => {
    onChange(list.map(i => i.id === id ? { ...i, current: i.baseline } : i));
  }, [list, onChange]);

  const setAsBaseline = useCallback((id) => {
    onChange(list.map(i => i.id === id ? { ...i, baseline: i.current } : i));
  }, [list, onChange]);

  const removeIng = useCallback((id) => {
    if (!window.confirm('Remove this ingredient?')) return;
    onChange(list.filter(i => i.id !== id));
  }, [list, onChange]);

  const addIngredient = useCallback(() => {
    const name = newIng.name.trim();
    if (!name) return;
    const cur = parseFloat(newIng.current) || 0;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + Date.now().toString(36).slice(-4);
    onChange([...list, {
      id, name, unit: newIng.unit.trim() || 'each',
      baseline: cur, current: cur, category: newIng.category,
    }]);
    setNewIng({ name: '', unit: '', current: '', category: 'produce' });
    setAdding(false);
  }, [newIng, list, onChange]);

  const cats = CATEGORY_ORDER.filter(c => byCategory[c] && byCategory[c].length);

  return (
    <div style={S.wrap}>
      {onScanReceipt && (
        <button style={S.scanBtn} onClick={onScanReceipt}>
          <Camera size={16} /> Scan receipt to update costs
        </button>
      )}
      <div style={S.topBar}>
        <div style={S.searchBox}>
          <input
            style={S.searchInput}
            placeholder="Search ingredients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <X size={15} color="#9aa5a0" style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />}
        </div>
        <button style={S.standoutBtn} onClick={() => setShowStandouts(s => !s)}>
          <ArrowUpDown size={15} /> Standouts
        </button>
      </div>

      {showStandouts && (
        <div style={S.standoutPanel}>
          <div style={S.standoutHeader}>Biggest movers vs. baseline</div>
          {standouts.up.length === 0 && standouts.down.length === 0 && (
            <div style={S.standoutEmpty}>Nothing has moved more than 5% from baseline yet. Adjust some costs to see trends here.</div>
          )}
          {standouts.up.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ ...S.standoutSub, color: '#e0828a' }}>↑ Getting pricier</div>
              {standouts.up.map(i => (
                <div key={i.id} style={S.standoutRow}>
                  <span>{i.name}</span>
                  <span style={{ color: '#e0828a', fontWeight: 700 }}>{pctLabel(i.baseline, i.current)} (${i.current.toFixed(2)})</span>
                </div>
              ))}
            </div>
          )}
          {standouts.down.length > 0 && (
            <div>
              <div style={{ ...S.standoutSub, color: '#3fb8a0' }}>↓ Getting cheaper</div>
              {standouts.down.map(i => (
                <div key={i.id} style={S.standoutRow}>
                  <span>{i.name}</span>
                  <span style={{ color: '#3fb8a0', fontWeight: 700 }}>{pctLabel(i.baseline, i.current)} (${i.current.toFixed(2)})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={S.countLine}>
        {list.length} ingredients · tap a cost to update it
      </div>

      {cats.map(cat => (
        <div key={cat} style={S.catBlock}>
          <div style={S.catTitle}>{CATEGORY_LABELS_ING[cat] || cat}</div>
          {byCategory[cat].map(ing => {
            const dStyle = divergenceStyle(ing.baseline, ing.current);
            const label = pctLabel(ing.baseline, ing.current);
            const isEdit = editing === ing.id;
            return (
              <div key={ing.id} style={{ ...S.row, ...dStyle }}>
                <div style={S.rowMain}>
                  <div style={S.rowName}>{ing.name}</div>
                  <div style={S.rowUnit}>per {ing.unit}</div>
                </div>
                <div style={S.rowRight}>
                  {isEdit ? (
                    <div style={S.editWrap}>
                      <span style={S.dollar}>$</span>
                      <input
                        style={S.editInput}
                        type="number"
                        step="0.01"
                        autoFocus
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(ing.id); if (e.key === 'Escape') setEditing(null); }}
                        onBlur={() => saveEdit(ing.id)}
                      />
                    </div>
                  ) : (
                    <div style={S.costCol} onClick={() => startEdit(ing)}>
                      <div style={S.curCost}>${ing.current.toFixed(2)}</div>
                      {label && <div style={S.pctTag}>{label}</div>}
                      {Math.abs(ing.current - ing.baseline) > 0.005 && (
                        <div style={S.baseCost}>base ${ing.baseline.toFixed(2)}</div>
                      )}
                      {historyById[ing.id] && historyById[ing.id].length >= 2 && (
                        <div style={S.sparkWrap} title="Cost history">
                          <Sparkline points={historyById[ing.id]} />
                        </div>
                      )}
                    </div>
                  )}
                  <div style={S.rowActions}>
                    {Math.abs(ing.current - ing.baseline) > 0.005 && (
                      <button style={S.iconBtn} title="Reset to baseline" onClick={() => resetToBaseline(ing.id)}>
                        <RotateCcw size={14} />
                      </button>
                    )}
                    <button style={S.iconBtn} title="Set current as new baseline" onClick={() => setAsBaseline(ing.id)}>
                      <Pencil size={14} />
                    </button>
                    <button style={{ ...S.iconBtn, color: '#e0828a' }} title="Remove" onClick={() => removeIng(ing.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {adding ? (
        <div style={S.addForm}>
          <input style={S.addInput} placeholder="Ingredient name" value={newIng.name}
            onChange={e => setNewIng({ ...newIng, name: e.target.value })} autoFocus />
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...S.addInput, flex: 1 }} placeholder="Unit (lb, head…)" value={newIng.unit}
              onChange={e => setNewIng({ ...newIng, unit: e.target.value })} />
            <input style={{ ...S.addInput, flex: 1 }} placeholder="Cost $" type="number" step="0.01" value={newIng.current}
              onChange={e => setNewIng({ ...newIng, current: e.target.value })} />
          </div>
          <select style={S.addInput} value={newIng.category}
            onChange={e => setNewIng({ ...newIng, category: e.target.value })}>
            {CATEGORY_ORDER.map(c => <option key={c} value={c}>{CATEGORY_LABELS_ING[c]}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={S.addConfirm} onClick={addIngredient}>Add</button>
            <button style={S.addCancel} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button style={S.addBtn} onClick={() => setAdding(true)}>
          <Plus size={16} /> Add ingredient
        </button>
      )}
    </div>
  );
}

const S = {
  wrap: { padding: '12px 12px 40px' },
  scanBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: '#2d6a6a', color: '#e8e2d4', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 12 },
  topBar: { display: 'flex', gap: 8, marginBottom: 12 },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#1a1a1a', border: '1px solid #37403c', borderRadius: 10, padding: '9px 12px' },
  searchInput: { flex: 1, background: 'transparent', border: 'none', color: '#e8e2d4', fontSize: 14, outline: 'none' },
  standoutBtn: { display: 'flex', alignItems: 'center', gap: 6, background: '#2d6a6a', color: '#e8e2d4', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  standoutPanel: { background: '#232a28', border: '1px solid #2d6a6a', borderRadius: 12, padding: 14, marginBottom: 14 },
  standoutHeader: { fontSize: 13, fontWeight: 700, color: '#c9a84c', marginBottom: 10 },
  standoutEmpty: { fontSize: 13, color: '#9aa5a0', lineHeight: 1.5 },
  standoutSub: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  standoutRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#e8e2d4', padding: '3px 0' },
  countLine: { fontSize: 12, color: '#9aa5a0', marginBottom: 12, fontStyle: 'italic' },
  catBlock: { marginBottom: 18 },
  catTitle: { fontSize: 11, fontWeight: 700, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#232a28', border: '1px solid #2d3a36', borderRadius: 10, padding: '10px 12px', marginBottom: 6 },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, color: '#e8e2d4', fontWeight: 600 },
  rowUnit: { fontSize: 11, color: '#9aa5a0', marginTop: 1 },
  rowRight: { display: 'flex', alignItems: 'center', gap: 8 },
  costCol: { textAlign: 'right', cursor: 'pointer', minWidth: 64 },
  curCost: { fontSize: 15, fontWeight: 700, color: '#e8e2d4' },
  pctTag: { fontSize: 11, fontWeight: 700, marginTop: 1, opacity: 0.9 },
  baseCost: { fontSize: 10, color: '#9aa5a0', marginTop: 1 },
  sparkWrap: { marginTop: 3, display: 'flex', justifyContent: 'flex-end' },
  editWrap: { display: 'flex', alignItems: 'center', background: '#1a1a1a', border: '1px solid #3fb8a0', borderRadius: 8, padding: '4px 8px' },
  dollar: { color: '#9aa5a0', fontSize: 14 },
  editInput: { width: 60, background: 'transparent', border: 'none', color: '#e8e2d4', fontSize: 15, fontWeight: 700, outline: 'none', textAlign: 'right' },
  rowActions: { display: 'flex', gap: 2 },
  iconBtn: { background: 'transparent', border: 'none', color: '#9aa5a0', cursor: 'pointer', padding: 5, display: 'flex', alignItems: 'center', borderRadius: 6 },
  addBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: 'transparent', border: '1px dashed #37403c', color: '#9aa5a0', borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 6 },
  addForm: { background: '#232a28', border: '1px solid #2d6a6a', borderRadius: 12, padding: 14, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 },
  addInput: { background: '#1a1a1a', border: '1px solid #37403c', borderRadius: 8, padding: '10px 12px', color: '#e8e2d4', fontSize: 14, outline: 'none', width: '100%' },
  addConfirm: { flex: 1, background: '#3fb8a0', color: '#04342C', border: 'none', borderRadius: 8, padding: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  addCancel: { flex: 1, background: 'transparent', color: '#9aa5a0', border: '1px solid #37403c', borderRadius: 8, padding: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};
