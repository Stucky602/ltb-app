import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Trash2, Check, ChevronDown, ChevronUp, X, Pencil, Copy, RotateCcw,
  ClipboardPaste, ArrowUpDown, Archive, ImageIcon, AlertTriangle, FileText,
  Scale, Camera, Download, Upload, Flame, Bell,
} from '../icons.jsx';
import {
  ALL_DINNERS, ALWAYS_MENU, DEFAULT_WEEK, PER_LB_ITEMS, FULL_MENU,
  isPerLbItem, buildMenu, CATEGORY_LABELS, STATUSES, STATUS_COLORS,
} from '../menu.js';
import {
  RECIPES, INGREDIENT_SYNONYMS, SOUS_VIDE_VEG, DINNER_REHEAT_BUCKET,
  RICE_DISHES, PASTA_DISHES, NOODLE_DISHES,
  normalizeIngredientName, generateShoppingItems, buildReheatBlocks,
} from '../recipes.js';
import {
  SURCHARGE, WORKER_BASE, PENDING_POLL_URL, CONFIG_PUBLISH_URL,
  PUBLISH_TOKEN, VAPID_PUBLIC_KEY, USE_LEGACY_CSV, FORM_CSV_URL,
  ORDERS_KEY, CHECKS_KEY, DELIVER_CHECKS_KEY, DISH_NOTES_KEY, WEEK_NOTES_KEY,
  SHOPPING_KEY, WEEK_KEY, PENDING_KEY, SEEN_ROWS_KEY, REGULARS_KEY, INVENTORY_KEY,
} from '../config.js';
import {
  uid, currency, round2, DISH_CUISINE, dishCuisine, normName,
  MIN_ORDERS_FOR_INSIGHT, localStore, store, PHOTO_PREFIX, PHOTO_TTL_DAYS, fmtBytes,
  urlBase64ToUint8Array, nameMatchType, regularNames, regularDisplayName,
  regularMatchType, buildInsights, insightStamp, loadHtml2Canvas,
  discountAmount, itemsUpchargeTotal, customChargesTotal, itemsBaseTotal,
  orderTotal, repricePerLbItem, itemCost, orderCostInfo,
  groupKeyFor, formatDate, orderToText, copyText, loadJSON, saveJSON, saveError,
  photoKey, savePhoto, loadPhoto, deletePhoto, photoStorageBytes, cleanupPhotos,
  menuForPrompt, fileToJpegBase64, parseOrderText, validateParsedOrder, parseAmendment,
  parseFormRow, parseDelimited, rowToOrderText, parseFormNotes,
} from '../utils.js';
import { TEAL_DARK, TEAL_MID, TEAL_LIGHT, GOLD, CREAM, DARK, CARD, styles } from '../styles.js';
import { WeeklySummaryModal } from './WeeklySummary.jsx';

export function ProfitChart({ series }) {
  const W = 320, H = 160;
  const padL = 8, padR = 8, padT = 14, padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const profits = series.map(s => s.profit);
  const maxP = Math.max(...profits, 0);
  const minP = Math.min(...profits, 0);
  const range = maxP - minP || 1;

  const yFor = (p) => padT + plotH - ((p - minP) / range) * plotH;
  const zeroY = yFor(0);

  const n = series.length;
  const slotW = plotW / n;
  const barW = Math.min(slotW * 0.6, 34);

  const labelStep = Math.ceil(n / 6);

  const linePts = series.map((s, i) => {
    const cx = padL + slotW * i + slotW / 2;
    return `${cx},${yFor(s.profit)}`;
  }).join(' ');

  const totalProfit = round2(series.reduce((sum, s) => sum + s.profit, 0));
  const avgProfit = round2(totalProfit / n);

  return (
    <div style={styles.chartCard}>
      <div style={styles.chartHeader}>
        <span style={styles.chartTitle}>Profit over time</span>
        <span style={styles.chartSubtitle}>avg {currency(avgProfit)}/period</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={styles.chartSvg} preserveAspectRatio="xMidYMid meet">
        <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="#37403c" strokeWidth="1" strokeDasharray="3,3" />
        {series.map((s, i) => {
          const cx = padL + slotW * i + slotW / 2;
          const y = yFor(s.profit);
          const barTop = Math.min(y, zeroY);
          const barH = Math.abs(y - zeroY);
          const positive = s.profit >= 0;
          return (
            <rect
              key={i}
              x={cx - barW / 2}
              y={barTop}
              width={barW}
              height={Math.max(barH, 1)}
              rx="2"
              fill={positive ? '#1D9E7544' : '#EF444444'}
            />
          );
        })}
        {n >= 2 && <polyline points={linePts} fill="none" stroke="#5DCAA5" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {series.map((s, i) => {
          const cx = padL + slotW * i + slotW / 2;
          return <circle key={i} cx={cx} cy={yFor(s.profit)} r="2.5" fill="#5DCAA5" />;
        })}
        {series.map((s, i) => {
          if (i % labelStep !== 0 && i !== n - 1) return null;
          const cx = padL + slotW * i + slotW / 2;
          return (
            <text key={i} x={cx} y={H - 8} textAnchor="middle" fontSize="8" fill="#7a8480">
              {shortLabel(s.label)}
            </text>
          );
        })}
      </svg>
      <div style={styles.chartLegend}>
        Each bar is one {series.length > 1 ? 'period' : 'period'}'s estimated profit. Green line shows the trend.
      </div>
    </div>
  );
}

export function shortLabel(label) {
  if (!label) return '';
  return label.replace(/^Week of /, '').replace(/^Week /, 'W').slice(0, 9);
}

// ─── Money Tab ──────────────────────────────────────────────────────────────
export function MoneyTab({ orders, onUpdate }) {
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [groupMode, setGroupMode] = useState('none');
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [openPhotos, setOpenPhotos] = useState(null);
  const [storage, setStorage] = useState(null);
  const [search, setSearch] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [weekNotes, setWeekNotes] = useState({});
  const [weekNotesDraft, setWeekNotesDraft] = useState('');
  const [editingWeekNote, setEditingWeekNote] = useState(false);

  const currentWeekKey = useMemo(() => {
    if (!orders.length) return null;
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return groupKeyFor(sorted[0], 'week');
  }, [orders]);

  useEffect(() => {
    loadJSON(WEEK_NOTES_KEY, {}).then(n => setWeekNotes(n || {}));
  }, []);

  const saveWeekNote = () => {
    const next = { ...weekNotes, [currentWeekKey]: weekNotesDraft.trim() };
    setWeekNotes(next);
    saveJSON(WEEK_NOTES_KEY, next);
    setEditingWeekNote(false);
  };

  const startWeekNote = () => {
    setWeekNotesDraft(weekNotes[currentWeekKey] || '');
    setEditingWeekNote(true);
  };

  useEffect(() => {
    let live = true;
    photoStorageBytes().then(s => { if (live) setStorage(s); });
    return () => { live = false; };
  }, [orders]);

  const filtered = useMemo(() => {
    let arr = unpaidOnly ? orders.filter(o => !o.paid) : orders;
    const q = search.trim().toLowerCase();
    if (q) arr = arr.filter(o => (o.customer || '').toLowerCase().includes(q));
    return arr;
  }, [orders, unpaidOnly, search]);

  const totals = useMemo(() => {
    let booked = 0, collected = 0, cost = 0, costComplete = true;
    filtered.forEach(o => {
      booked += o.total;
      if (o.paid) collected += o.total;
      const info = orderCostInfo(o);
      cost += info.cost;
      if (!info.complete) costComplete = false;
    });
    return {
      booked: round2(booked),
      collected: round2(collected),
      outstanding: round2(booked - collected),
      profit: round2(booked - cost),
      costComplete,
      count: filtered.length,
    };
  }, [filtered]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortField === 'total') cmp = a.total - b.total;
      if (sortField === 'name') cmp = (a.customer || '').localeCompare(b.customer || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const groups = useMemo(() => {
    if (groupMode === 'none') return [{ label: null, stamp: 0, orders: sorted }];
    const map = new Map();
    sorted.forEach(o => {
      const { label, stamp } = groupKeyFor(o, groupMode);
      if (!map.has(label)) map.set(label, { label, stamp, orders: [] });
      map.get(label).orders.push(o);
    });
    return Array.from(map.values()).sort((a, b) => b.stamp - a.stamp);
  }, [sorted, groupMode]);

  const profitSeries = useMemo(() => {
    const mode = groupMode === 'none' ? 'week' : groupMode;
    const map = new Map();
    filtered.forEach(o => {
      const { label, stamp } = groupKeyFor(o, mode);
      if (!map.has(label)) map.set(label, { label, stamp, profit: 0, revenue: 0 });
      const e = map.get(label);
      e.revenue += o.total;
      e.profit += o.total - orderCostInfo(o).cost;
    });
    return Array.from(map.values())
      .sort((a, b) => a.stamp - b.stamp)
      .map(e => ({ ...e, profit: round2(e.profit), revenue: round2(e.revenue) }));
  }, [filtered, groupMode]);

  const setSort = (field) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  if (orders.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyTitle}>No history yet</div>
        <div style={styles.emptyBody}>Every order you save shows up here — including archived past weeks.</div>
      </div>
    );
  }

  return (
    <div>
      {currentWeekKey && (
        <div style={styles.weekNotesBlock}>
          <div style={styles.weekNotesTitle}>Week notes</div>
          {editingWeekNote ? (
            <>
              <textarea
                style={{ ...styles.refCardNotes, minHeight: '80px' }}
                value={weekNotesDraft}
                onChange={e => setWeekNotesDraft(e.target.value)}
                placeholder="Jot anything worth remembering about this week — what ran out, what to double, timing notes…"
                autoFocus
              />
              <div style={styles.notesEditActions}>
                <button style={styles.confirmYesGreen} onClick={saveWeekNote}>Save</button>
                <button style={styles.confirmNo} onClick={() => setEditingWeekNote(false)}>Cancel</button>
              </div>
            </>
          ) : weekNotes[currentWeekKey] ? (
            <div style={styles.weekNotesBody} onClick={startWeekNote} role="button" tabIndex={0}>
              {weekNotes[currentWeekKey]}
              <span style={styles.notesEditHint}> — tap to edit</span>
            </div>
          ) : (
            <button style={styles.addNoteBtn} onClick={startWeekNote}>
              <Pencil size={13} />
              Add week notes
            </button>
          )}
        </div>
      )}

      <div style={styles.moneyStatsBar}>
        <div style={styles.moneyStatTile}>
          <div style={styles.statValue}>{currency(totals.booked)}</div>
          <div style={styles.statLabel}>{unpaidOnly ? 'Unpaid total' : 'Revenue'}</div>
        </div>
        <div style={styles.moneyStatTile}>
          <div style={{ ...styles.statValue, color: '#1D9E75' }}>
            {currency(totals.profit)}{totals.costComplete ? '' : '*'}
          </div>
          <div style={styles.statLabel}>Est. profit</div>
        </div>
        <div style={styles.moneyStatTile}>
          <div style={{ ...styles.statValue, color: '#1D9E75' }}>{currency(totals.collected)}</div>
          <div style={styles.statLabel}>Collected</div>
        </div>
        <div style={styles.moneyStatTile}>
          <div style={{ ...styles.statValue, ...(totals.outstanding > 0 ? { color: '#EF9F27' } : {}) }}>
            {currency(totals.outstanding)}
          </div>
          <div style={styles.statLabel}>Outstanding</div>
        </div>
      </div>

      {!totals.costComplete && (
        <div style={styles.moneyFootnote}>* some items predate cost tracking, so profit is partial</div>
      )}

      <div style={styles.sortRow}>
        {[
          ['date', 'Date'],
          ['total', 'Amount'],
          ['name', 'Customer'],
        ].map(([field, label]) => (
          <button
            key={field}
            style={{ ...styles.sortBtn, ...(sortField === field ? styles.sortBtnActive : {}) }}
            onClick={() => setSort(field)}
          >
            {label}
            {sortField === field && <span style={styles.sortDirText}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
          </button>
        ))}
        <button
          style={{ ...styles.sortBtn, ...(unpaidOnly ? { color: '#EF9F27', borderColor: '#EF9F27' } : {}) }}
          onClick={() => setUnpaidOnly(v => !v)}
        >
          Unpaid only
        </button>
      </div>

      <div style={styles.sortRow}>
        <span style={styles.groupLabel}>Group:</span>
        {[
          ['none', 'None'],
          ['week', 'Week'],
          ['month', 'Month'],
          ['year', 'Year'],
        ].map(([mode, label]) => (
          <button
            key={mode}
            style={{ ...styles.sortBtn, ...(groupMode === mode ? styles.sortBtnActive : {}) }}
            onClick={() => setGroupMode(mode)}
          >
            {label}
          </button>
        ))}
        <div style={styles.moneyCount}>{totals.count} order{totals.count !== 1 ? 's' : ''}</div>
      </div>

      <div style={styles.moneySearchRow}>
        <input
          style={styles.moneySearchInput}
          placeholder="Search by customer name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={styles.moneySearchClear} onClick={() => setSearch('')} aria-label="Clear search">
            <X size={15} />
          </button>
        )}
        {profitSeries.length >= 2 && (
          <button
            style={{ ...styles.chartToggleBtn, ...(showChart ? styles.chartToggleBtnActive : {}) }}
            onClick={() => setShowChart(v => !v)}
          >
            {showChart ? 'Hide graph' : 'Graph'}
          </button>
        )}
        <button
          style={{ ...styles.chartToggleBtn, ...(showRecap ? styles.chartToggleBtnActive : {}) }}
          onClick={() => setShowRecap(true)}
        >
          Recap
        </button>
      </div>

      {showChart && profitSeries.length >= 2 && <ProfitChart series={profitSeries} />}
      {showRecap && <WeeklySummaryModal orders={orders} onClose={() => setShowRecap(false)} />}

      {groups.map(group => {
        let gRev = 0, gCost = 0, gCollected = 0;
        group.orders.forEach(o => {
          gRev += o.total;
          gCost += orderCostInfo(o).cost;
          if (o.paid) gCollected += o.total;
        });
        const gProfit = round2(gRev - gCost);
        const gOutstanding = round2(gRev - gCollected);
        return (
          <div key={group.label || 'all'} style={styles.moneyGroup}>
            {group.label && (
              <div style={styles.groupHeaderRich}>
                <div style={styles.groupHeaderTop}>
                  <span style={styles.groupTitle}>{group.label}</span>
                  <span style={styles.groupOrderCount}>{group.orders.length} order{group.orders.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={styles.groupStatsRow}>
                  <div style={styles.groupStat}>
                    <span style={styles.groupStatValue}>{currency(round2(gRev))}</span>
                    <span style={styles.groupStatLabel}>revenue</span>
                  </div>
                  <div style={styles.groupStat}>
                    <span style={{ ...styles.groupStatValue, color: '#1D9E75' }}>{currency(gProfit)}</span>
                    <span style={styles.groupStatLabel}>profit</span>
                  </div>
                  <div style={styles.groupStat}>
                    <span style={{ ...styles.groupStatValue, color: gOutstanding > 0 ? '#EF9F27' : '#9aa5a0' }}>{currency(gOutstanding)}</span>
                    <span style={styles.groupStatLabel}>outstanding</span>
                  </div>
                </div>
              </div>
            )}
            <div style={styles.moneyList}>
              {group.orders.map(o => {
                const info = orderCostInfo(o);
                const profit = round2(o.total - info.cost);
                const photoItems = (o.items || [])
                  .map((it, i) => ({ it, i }))
                  .filter(({ it }) => it.hasPhoto);
                return (
                  <div key={o.id} style={{ ...styles.moneyRowWrap, ...(o.archived ? { opacity: 0.65 } : {}) }}>
                    <div
                      style={{ ...styles.moneyRow, ...(photoItems.length ? { cursor: 'pointer' } : {}) }}
                      onClick={photoItems.length ? () => setOpenPhotos(openPhotos === o.id ? null : o.id) : undefined}
                    >
                      <div style={styles.moneyRowLeft}>
                        <div style={styles.moneyName}>
                          {o.customer}
                          {photoItems.length > 0 && <Camera size={12} style={{ marginLeft: 6, verticalAlign: 'middle', opacity: 0.7 }} />}
                        </div>
                        <div style={styles.moneyMeta}>
                          {formatDate(o.createdAt)}{o.archived ? ' · archived' : ` · ${o.status}`}
                          {photoItems.length > 0 ? ` · ${photoItems.length} photo${photoItems.length !== 1 ? 's' : ''}` : ''}
                        </div>
                      </div>
                      <div style={styles.moneyRowRight}>
                        <div style={styles.moneyAmounts}>
                          <span style={styles.moneyAmount}>{currency(o.total)}</span>
                          <span style={styles.moneyProfit}>
                            {info.complete || info.cost > 0 ? `+${currency(profit)}${info.complete ? '' : '*'}` : '—'}
                          </span>
                        </div>
                        <button
                          style={{
                            ...styles.paidPill,
                            ...(o.paid
                              ? { background: '#1D9E7522', color: '#1D9E75' }
                              : { background: '#EF9F2722', color: '#EF9F27' }),
                          }}
                          onClick={(e) => { e.stopPropagation(); onUpdate(o.id, { paid: !o.paid }); }}
                        >
                          {o.paid ? 'Paid' : 'Unpaid'}
                        </button>
                      </div>
                    </div>
                    {openPhotos === o.id && photoItems.length > 0 && (
                      <OrderPhotos orderId={o.id} photoItems={photoItems} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {storage && storage.count > 0 && (
        <div style={styles.storageGauge}>
          <Camera size={13} />
          <span>{storage.count} scale photo{storage.count !== 1 ? 's' : ''} stored · {fmtBytes(storage.bytes)}</span>
          <span style={styles.storageGaugeNote}>auto-deleted after 1 month</span>
        </div>
      )}
    </div>
  );
}

export function OrderPhotos({ orderId, photoItems }) {
  const [photos, setPhotos] = useState({});

  useEffect(() => {
    let live = true;
    (async () => {
      for (const { i } of photoItems) {
        const d = await loadPhoto(orderId, i);
        if (!live) return;
        setPhotos(prev => ({ ...prev, [i]: d || 'none' }));
      }
    })();
    return () => { live = false; };
  }, [orderId]); // eslint-disable-line

  return (
    <div style={styles.orderPhotosWrap}>
      {photoItems.map(({ it, i }) => (
        <div key={i} style={styles.orderPhotoItem}>
          <div style={styles.orderPhotoLabel}>
            {it.name}{it.weight > 0 ? ` · ${it.weight} lb` : ''}
          </div>
          {photos[i] === undefined && <div style={styles.orderPhotoLoading}>loading…</div>}
          {photos[i] === 'none' && <div style={styles.orderPhotoLoading}>photo expired or missing</div>}
          {photos[i] && photos[i] !== 'none' && (
            <img src={`data:image/jpeg;base64,${photos[i]}`} alt={`${it.name} on scale`} style={styles.orderPhotoImg} />
          )}
        </div>
      ))}
    </div>
  );
}
