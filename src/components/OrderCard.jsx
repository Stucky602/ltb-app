import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { companionHtml, companionContext } from '../companion.js';
import { INGREDIENT_SEED } from '../ingredients.js';
import { DISHES } from '../dishes.js';
import { unitOptionsFor, resolveDishVariant } from '../dishCosting.js';
import { pastOmakasesFor } from '../omakase.js';
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
  OMAKASE_TEMPLATES_KEY, OMAKASE_REG_QUEUE_KEY,
  SHOPPING_KEY, WEEK_KEY, PENDING_KEY, SEEN_ROWS_KEY, REGULARS_KEY, INVENTORY_KEY,
} from '../config.js';
import {
  uid, currency, round2, itemAddons, DISH_CUISINE, dishCuisine, normName,
  MIN_ORDERS_FOR_INSIGHT, localStore, store, PHOTO_PREFIX, PHOTO_TTL_DAYS, fmtBytes,
  urlBase64ToUint8Array, nameMatchType, regularNames, regularDisplayName,
  regularMatchType, buildInsights, insightStamp, loadHtml2Canvas,
  discountAmount, itemsUpchargeTotal, customChargesTotal, itemsBaseTotal,
  orderTotal, repricePerLbItem, itemCost, orderCostInfo,
  groupKeyFor, formatDate, orderToText, copyText, loadJSON, saveJSON, saveError,
  photoKey, savePhoto, loadPhoto, deletePhoto, photoStorageBytes, cleanupPhotos,
  menuForPrompt, fileToJpegBase64, parseOrderText, validateParsedOrder, parseAmendment,
  parseFormRow, parseDelimited, rowToOrderText, parseFormNotes,
  optionsSummary, noteWithoutOptions,
} from '../utils.js';
import { TEAL_DARK, TEAL_MID, TEAL_LIGHT, GOLD, CREAM, DARK, CARD, styles } from '../styles.js';
import { InvoiceModal, ReheatModal, WeightPhotoModal, perLbEstimate } from './Modals.jsx';

// Dish passport for the companion page — REGULARS ONLY. An order linked to a
// regular (regularId, or exact name match) gets { tried, total, missing } over
// the full dinner catalog; anyone else gets null and no card. History is that
// customer's orders by the same linkage.
function buildPassport(order, regulars, allOrders) {
  const reg = (order.regularId && (regulars || []).find(r => r.id === order.regularId))
    || (regulars || []).find(r => (r.name || '').toLowerCase() === (order.customer || '').toLowerCase());
  if (!reg) return null;
  const mine = (allOrders || []).filter(o =>
    (o.regularId && o.regularId === reg.id) ||
    ((o.customer || '').toLowerCase() === (reg.name || '').toLowerCase()));
  const tried = new Set();
  for (const o of mine) for (const it of (o.items || [])) tried.add(it.name);
  const dinnerNames = ALL_DINNERS.map(d => d.name);
  const triedDinners = dinnerNames.filter(n => tried.has(n));
  return {
    tried: triedDinners.length,
    total: dinnerNames.length,
    missing: dinnerNames.filter(n => !tried.has(n)),
  };
}

// Omakase fulfillment: catalog of menu picks (dish+variant -> registry cost).
const OMAKASE_CATALOG = (() => {
  const out = [];
  Object.keys(FULL_MENU).forEach(cat => {
    (FULL_MENU[cat] || []).forEach(dish => {
      (dish.variants || []).forEach(v => {
        out.push({ key: dish.name + '|' + v.label, name: dish.name, variant: v.label, cost: v.cost || 0, price: v.price || 0 });
      });
    });
  });
  return out;
})();

const OMA_ING = INGREDIENT_SEED.map(i => ({ id: i.id, name: i.name, unit: i.unit || '', baseline: i.baseline || 0 }));
const OMA_ING_BY_ID = {};
OMA_ING.forEach(i => { OMA_ING_BY_ID[i.id] = i; });

// Cost one ingredient row: convert the typed amount into the ingredient's
// native unit (the engine's own conv, so it can never drift from how dishes are
// costed), then price it off the LIVE cost map, falling back to the seed.
function omaIngCost(id, qty, unit, liveCost) {
  const opts = unitOptionsFor(id);
  const opt = opts.find(o => o.label === unit) || opts[0];
  const native = opt ? opt.toNative(Number(qty) || 0) : 0;
  const per = (liveCost && typeof liveCost[id] === 'number') ? liveCost[id] : ((OMA_ING_BY_ID[id] || {}).baseline || 0);
  return round2((Number(native) || 0) * per);
}

// "Log what you made" for an omakase item. Rows are menu picks, registry
// ingredients, or free text; the sum becomes it.cost (costSource manual) so the
// order's margin is real, and the final charge can only move DOWN from the
// budget the customer set.
function OmakaseLogger({ item, order, onUpdate, allOrders, perLbLiveCost, weekDishes, restrictions }) {
  const budgetMax = item.budgetMax != null ? item.budgetMax : (item.price || 0);
  const [rows, setRows] = useState((item.components && item.components.length) ? item.components : []);
  const [charge, setCharge] = useState(item.price != null ? String(item.price) : String(budgetMax));
  const [underNote, setUnderNote] = useState(item.underNote || '');
  const [bigPath, setBigPath] = useState(item.bigPath || '');
  const [search, setSearch] = useState('');
  const [showPast, setShowPast] = useState(false);
  const [selMode, setSelMode] = useState(false);
  const [sel, setSel] = useState({});
  const [tplName, setTplName] = useState('');
  const [templates, setTemplates] = useState([]);
  const [showTpl, setShowTpl] = useState(false);

  useEffect(() => { loadJSON(OMAKASE_TEMPLATES_KEY, []).then(t => setTemplates(t || [])); }, []);

  const estCost = round2(rows.reduce((s, c) => s + (Number(c.cost) || 0), 0));
  const menuValue = round2(rows.reduce((s, c) => s + (Number(c.refPrice) || 0), 0));
  const chargeNum = Math.min(budgetMax, Math.max(0, parseFloat(charge) || 0));
  const marginPct = chargeNum > 0 ? Math.round((1 - estCost / chargeNum) * 100) : 0;
  const pctOfBudget = budgetMax > 0 ? Math.round((estCost / budgetMax) * 100) : 0;

  // Ingredients already being bought for this week's menu, so a component that
  // rides the existing shop is visibly cheaper to make than a special trip.
  const weekIngIds = useMemo(() => {
    const set = new Set();
    for (const name of (weekDishes || [])) {
      const d = DISHES.find(x => x.name === name);
      if (!d || !d.variants || !d.variants.length) continue;
      try {
        (resolveDishVariant(name, d.variants[d.variants.length - 1].label) || []).forEach(l => set.add(l.id));
      } catch { /* a dish without a resolvable recipe just contributes nothing */ }
    }
    return set;
  }, [weekDishes]);
  const weekNames = useMemo(() => new Set(weekDishes || []), [weekDishes]);

  const past = useMemo(
    () => pastOmakasesFor(order.regularId, allOrders || [], order.id),
    [order.regularId, order.id, allOrders]
  );
  const pastNotes = useMemo(() => {
    const seen = [];
    past.forEach(p => { if (p.note && seen.indexOf(p.note) === -1) seen.push(p.note); });
    return seen;
  }, [past]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return OMA_ING.filter(i => i.name.toLowerCase().indexOf(q) !== -1).slice(0, 5);
  }, [search]);

  const setRow = (i, patch) => setRows(r => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const dropRow = (i) => setRows(r => r.filter((_, j) => j !== i));

  const pickMenu = (i, key) => {
    const c = OMAKASE_CATALOG.find(x => x.key === key);
    if (c) setRow(i, { menuKey: key, label: c.name + ' (' + c.variant + ')', cost: c.cost, refPrice: c.price, dishName: c.name });
    else setRow(i, { menuKey: '', label: '', cost: 0, refPrice: 0, dishName: '' });
  };
  const addIngredient = (ing) => {
    setRows(r => [...r, { ing: true, ingredientId: ing.id, qty: 1, unit: ing.unit || 'each', label: ing.name + ' - 1 ' + (ing.unit || ''), cost: omaIngCost(ing.id, 1, ing.unit || 'each', perLbLiveCost) }]);
    setSearch('');
  };
  const setIngAmount = (i, row, qty, unit) => {
    const q = qty != null ? qty : row.qty;
    const u = unit != null ? unit : row.unit;
    setRow(i, { qty: q, unit: u, cost: omaIngCost(row.ingredientId, q, u, perLbLiveCost), label: (OMA_ING_BY_ID[row.ingredientId] || {}).name + ' - ' + q + ' ' + u });
  };
  const addOffMenu = (label) => {
    setRows(r => [...r, { fromMenu: false, label: label || '', cost: 0, regFlag: !!label }]);
    setSearch('');
  };

  const applyTemplate = (t) => {
    const fresh = (t.rows || []).map(row => {
      if (row.ing) return { ...row, cost: omaIngCost(row.ingredientId, row.qty, row.unit, perLbLiveCost) };
      if (row.fromMenu && row.menuKey) {
        const c = OMAKASE_CATALOG.find(x => x.key === row.menuKey);
        return c ? { ...row, cost: c.cost, refPrice: c.price } : { ...row };
      }
      return { ...row };
    });
    setRows(r => [...r, ...fresh]);
    setShowTpl(false);
  };
  const saveTemplate = async () => {
    const picked = rows.filter((_, i) => sel[i]);
    if (!picked.length || !tplName.trim()) return;
    const next = [...templates, { name: tplName.trim(), rows: picked.map(r => ({ ...r })) }];
    setTemplates(next); await saveJSON(OMAKASE_TEMPLATES_KEY, next);
    setSelMode(false); setSel({}); setTplName('');
  };
  const dropTemplate = async (name) => {
    const next = templates.filter(t => t.name !== name);
    setTemplates(next); await saveJSON(OMAKASE_TEMPLATES_KEY, next);
  };

  const save = async () => {
    setCharge(String(chargeNum));
    // Anything typed that the registry does not know about collects in a queue
    // on the Ingredients tab. Nothing auto-writes to ingredients.js: Kevin
    // reviews the real number before it becomes a tracked ingredient.
    const flagged = rows.filter(r => r.regFlag && r.label);
    if (flagged.length) {
      const q = (await loadJSON(OMAKASE_REG_QUEUE_KEY, [])) || [];
      const have = new Set(q.map(x => String(x.label || '').toLowerCase()));
      const add = flagged
        .filter(r => !have.has(String(r.label).toLowerCase()))
        .map(r => ({ label: r.label, cost: r.cost || 0, date: new Date().toISOString(), orderId: order.id }));
      if (add.length) await saveJSON(OMAKASE_REG_QUEUE_KEY, [...q, ...add]);
    }
    const items = order.items.map(it => (it.omakase
      ? {
        ...it,
        components: rows,
        cost: estCost,
        costSource: 'manual',
        price: chargeNum,
        ...(underNote.trim() ? { underNote: underNote.trim() } : {}),
        ...(bigPath ? { bigPath } : {}),
      }
      : it));
    onUpdate({
      items,
      total: orderTotal(items, order.jarSwaps, order.containerReturns, order.discountType, order.discountValue, order.customCharges, order.waiveSurcharge),
    });
  };

  const inp = { padding: '5px 7px', borderRadius: 6, border: '1px solid #3a4441', background: '#202623', color: '#e8ede9', fontSize: 13 };
  const btn = { ...inp, cursor: 'pointer' };
  const tag = (text, color) => <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: color + '22', color, marginLeft: 6, whiteSpace: 'nowrap' }}>{text}</span>;

  return (
    <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: 'rgba(212,160,80,0.06)', border: '1px solid #3a453f' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#D4A050', marginBottom: 8 }}>Log what you made (customer max {currency(budgetMax)})</div>

      {restrictions ? (
        <div style={{ fontSize: 11.5, color: '#EF9F27', marginBottom: 8, fontWeight: 600 }}>Standing: {restrictions}</div>
      ) : null}

      {past.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => setShowPast(o => !o)} style={{ background: 'none', border: 'none', color: '#9aa5a0', fontSize: 11.5, cursor: 'pointer', padding: 0 }}>
            Past omakases ({past.length}) {showPast ? '\u25b2' : '\u25bc'}
          </button>
          {pastNotes.length > 0 && (
            <div style={{ fontSize: 11, color: '#EF9F27', marginTop: 3 }}>Past notes: {pastNotes.join(' \u00b7 ')}</div>
          )}
          {showPast && (
            <div style={{ marginTop: 5 }}>
              {past.map((p, i) => (
                <div key={i} style={{ fontSize: 11, color: '#9aa5a0', padding: '2px 0' }}>
                  {p.date ? new Date(p.date).toLocaleDateString() : '?'} · {p.labels.length ? p.labels.join(', ') : 'never logged'} · {currency(p.price || 0)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {rows.map((row, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {selMode && (
              <input type="checkbox" checked={!!sel[i]} onChange={e => setSel(s => ({ ...s, [i]: e.target.checked }))} />
            )}
            {row.fromMenu ? (
              <select value={row.menuKey || ''} onChange={e => pickMenu(i, e.target.value)} style={{ ...inp, flex: 1 }}>
                <option value="">Pick a dish…</option>
                {OMAKASE_CATALOG.map(c => <option key={c.key} value={c.key}>{c.name} ({c.variant})</option>)}
              </select>
            ) : row.ing ? (
              <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: '#e8ede9', flex: 1 }}>{(OMA_ING_BY_ID[row.ingredientId] || {}).name || row.ingredientId}</span>
                <input type="number" step="0.25" min="0" value={row.qty} onChange={e => setIngAmount(i, row, parseFloat(e.target.value) || 0, null)} style={{ ...inp, width: 58 }} />
                {(() => {
                  const opts = unitOptionsFor(row.ingredientId);
                  return opts.length > 1 ? (
                    <select value={row.unit} onChange={e => setIngAmount(i, row, null, e.target.value)} style={{ ...inp, width: 68 }}>
                      {opts.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
                    </select>
                  ) : <span style={{ fontSize: 11, color: '#7a8480', width: 68 }}>{row.unit}</span>;
                })()}
              </div>
            ) : (
              <input value={row.label} placeholder="What you made" onChange={e => setRow(i, { label: e.target.value })} style={{ ...inp, flex: 1 }} />
            )}
            <input type="number" step="0.01" min="0" value={row.cost} onChange={e => setRow(i, { cost: parseFloat(e.target.value) || 0 })} style={{ ...inp, width: 66 }} title="cost" />
            <button onClick={() => dropRow(i)} style={{ padding: '4px 8px', cursor: 'pointer', color: '#EF9F27', border: 'none', background: 'none', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ paddingLeft: selMode ? 22 : 0 }}>
            {row.fromMenu && row.dishName && weekNames.has(row.dishName) && tag('on this week\u2019s menu', '#5DCAA5')}
            {row.ing && weekIngIds.has(row.ingredientId) && tag('already buying this week', '#5DCAA5')}
            {row.regFlag && tag('not in registry', '#EF9F27')}
            {(row.ing || row.fromMenu === false) && (
              <input
                value={row.reheat || ''} placeholder="+ reheat note (optional)"
                onChange={e => setRow(i, { reheat: e.target.value })}
                style={{ ...inp, width: '100%', marginTop: 4, fontSize: 11.5, background: 'transparent', border: '1px dashed #3a4441' }}
              />
            )}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setRows(r => [...r, { fromMenu: true, menuKey: '', label: '', cost: 0, refPrice: 0 }])} style={btn}>+ menu item</button>
        <button onClick={() => setRows(r => [...r, { fromMenu: false, label: '', cost: 0 }])} style={btn}>+ off-menu</button>
        {templates.length > 0 && <button onClick={() => setShowTpl(o => !o)} style={btn}>+ template</button>}
        {rows.length > 0 && <button onClick={() => { setSelMode(m => !m); setSel({}); }} style={btn}>{selMode ? 'cancel' : 'save as template'}</button>}
      </div>

      {showTpl && (
        <div style={{ marginBottom: 8, padding: 6, borderRadius: 6, border: '1px solid #3a4441' }}>
          {templates.map(t => (
            <div key={t.name} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '2px 0' }}>
              <button onClick={() => applyTemplate(t)} style={{ ...btn, flex: 1, textAlign: 'left' }}>{t.name} ({(t.rows || []).length})</button>
              <button onClick={() => dropTemplate(t.name)} style={{ padding: '4px 8px', cursor: 'pointer', color: '#EF9F27', border: 'none', background: 'none' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {selMode && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
          <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="Name this group (e.g. chocolate mousse)" style={{ ...inp, flex: 1 }} />
          <button onClick={saveTemplate} style={{ ...btn, background: '#2f6f57', color: '#fff', border: 'none', fontWeight: 700 }}>Save</button>
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="+ ingredient (type to search)" style={{ ...inp, width: '100%' }} />
        {search.trim().length >= 2 && (
          <div style={{ marginTop: 4, border: '1px solid #3a4441', borderRadius: 6, overflow: 'hidden' }}>
            {matches.map(m => (
              <div key={m.id} onClick={() => addIngredient(m)} style={{ padding: '6px 8px', cursor: 'pointer', fontSize: 12.5, color: '#e8ede9', borderBottom: '1px solid #2a332f' }}>
                {m.name} <span style={{ color: '#7a8480', fontSize: 11 }}>({m.unit})</span>
              </div>
            ))}
            {matches.length === 0 && (
              <div onClick={() => addOffMenu(search.trim())} style={{ padding: '6px 8px', cursor: 'pointer', fontSize: 12.5, color: '#EF9F27' }}>
                Not in the registry - add “{search.trim()}” as a one-off
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize: 11.5, color: '#9aa5a0', marginBottom: 4 }}>
        Est. cost {currency(estCost)}{menuValue > 0 ? ' \u00b7 menu value ' + currency(menuValue) : ''} · margin {marginPct}%
      </div>
      {budgetMax > 0 && (
        <div style={{ fontSize: 11.5, marginBottom: 6, fontWeight: pctOfBudget >= 60 ? 700 : 400, color: pctOfBudget >= 60 ? '#EF9F27' : '#7a8480' }}>
          cost is {pctOfBudget}% of their budget{pctOfBudget >= 60 ? ' (40% margin line)' : ''}
        </div>
      )}
      {estCost > 0 && chargeNum > 0 && estCost <= 0.4 * chargeNum && (
        <div style={{ fontSize: 11, color: '#7a8480', marginBottom: 6 }}>
          Running well under what they are paying. Worth adding something, or charging less.
        </div>
      )}
      {budgetMax > 300 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#7a8480' }}>which way did it go?</span>
          {[['multi', 'went multi-dish'], ['premium', 'went premium']].map(([k, label]) => (
            <button key={k} onClick={() => setBigPath(bigPath === k ? '' : k)}
              style={{ ...btn, borderColor: bigPath === k ? '#D4A050' : '#3a4441', color: bigPath === k ? '#D4A050' : '#e8ede9', fontSize: 11 }}>{label}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#c9d1cd' }}>Final charge $</span>
        <input type="number" step="0.5" min="0" max={budgetMax} value={charge} onChange={e => setCharge(e.target.value)} style={{ ...inp, width: 80 }} />
        <span style={{ fontSize: 10.5, color: '#7a8480' }}>max {currency(budgetMax)}</span>
        <button onClick={save} style={{ padding: '6px 14px', borderRadius: 6, cursor: 'pointer', background: '#2f6f57', color: '#fff', border: 'none', fontWeight: 700, marginLeft: 'auto' }}>Save</button>
      </div>
      {chargeNum < budgetMax && (
        <input
          value={underNote} onChange={e => setUnderNote(e.target.value)}
          placeholder="Why it came in under (optional, shows on their invoice)"
          style={{ ...inp, width: '100%', marginTop: 6 }}
        />
      )}
    </div>
  );
}

export function OrderCard({ order, regulars, expanded, onToggle, onUpdate, onDelete, onEdit, onMakeRegular, onLinkRegular, allOrders, perLbLiveCost, weekDishes }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [editingContact, setEditingContact] = useState(false);
  const [addressDraft, setAddressDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [copyMsg, setCopyMsg] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showReheat, setShowReheat] = useState(false);
  // Whether this order has anything that needs reheat/finish instructions.
  const hasReheatable = useMemo(() => buildReheatBlocks(order).length > 0, [order]);
  // Weight-entry popup: null when closed, or { mode: 'single'|'walk', queue: [idx...], pos: 0 }
  const [weightFlow, setWeightFlow] = useState(null);
  // At-cost add-on price editor: null, or { itemIdx, addonId, val } — the
  // add-on twin of the weight flow: request known at order time, price set
  // after shopping, resolved cost folds into the total via orderTotal.
  const [addonEdit, setAddonEdit] = useState(null);

  const perLbIdxs = (order.items || [])
    .map((it, i) => (isPerLbItem(it.name) ? i : -1))
    .filter(i => i >= 0);
  const anyPending = perLbIdxs.some(i => order.items[i].weightPending || !(order.items[i].weight > 0));

  // Apply a weight (and optional photo) to one item, then advance if walking
  const applyWeight = async (itemIdx, weight, photoBase64) => {
    const items = order.items.map((it, i) => {
      if (i !== itemIdx) return it;
      const updated = repricePerLbItem({ ...it, weight }, perLbLiveCost);
      if (photoBase64) updated.hasPhoto = true;
      return updated;
    });
    const patch = {
      items,
      total: orderTotal(items, order.jarSwaps, order.containerReturns, order.discountType, order.discountValue, order.customCharges, order.waiveSurcharge),
    };
    onUpdate(patch);
    if (photoBase64) await savePhoto(order.id, itemIdx, photoBase64);

    // advance the walk, or close
    setWeightFlow(prev => {
      if (!prev || prev.mode !== 'walk') return null;
      const nextPos = prev.pos + 1;
      return nextPos < prev.queue.length ? { ...prev, pos: nextPos } : null;
    });
  };

  // Commit a priced add-on: same patch pattern as the weight commit — new
  // items array, orderTotal recomputed, one onUpdate.
  const applyAddonCost = (itemIdx, addonId, costNum) => {
    const items = order.items.map((it, i) => {
      if (i !== itemIdx) return it;
      const addons = itemAddons(it).map(a => (a.id === addonId ? { ...a, cost: round2(costNum), pending: false } : a));
      return { ...it, addons };
    });
    onUpdate({
      items,
      total: orderTotal(items, order.jarSwaps, order.containerReturns, order.discountType, order.discountValue, order.customCharges, order.waiveSurcharge),
    });
    setAddonEdit(null);
  };

  const itemsTotal = (order.items || []).reduce((s, it) => s + it.price * it.qty, 0);
  const disc = discountAmount(itemsTotal, order.discountType, order.discountValue);

  // Determine if this order belongs to a regular (by linked id or name match)
  const matchedRegular = useMemo(() => {
    if (!regulars || regulars.length === 0) return null;
    if (order.regularId) {
      const byId = regulars.find(r => r.id === order.regularId);
      if (byId) return byId;
    }
    return regulars.find(r => regularMatchType(r, order.customer) === 'exact') || null;
  }, [regulars, order.regularId, order.customer]);

  const isRegular = !!matchedRegular;
  // Make-a-regular star: shown when this order isn't linked to any regular.
  // Near-miss names ("Jessica" when "Jessica Gardner" exists) offer a MERGE
  // into the existing regular instead of creating a duplicate — same alias
  // mechanism as the Regulars-tab merge, applied at the point of entry.
  const [starOpen, setStarOpen] = useState(false);
  const nearMisses = useMemo(() => {
    if (isRegular || !regulars || !order.customer) return [];
    return regulars.filter(r => regularMatchType(r, order.customer) === 'partial');
  }, [isRegular, regulars, order.customer]);
  const regularDiscount = matchedRegular ? (matchedRegular.discountPercent || 0) : 0;
  // The discount toggle is "on" when the order currently carries the regular's percent
  const discountOn = order.discountType === 'percent' && order.discountValue === regularDiscount && regularDiscount > 0;

  const toggleRegularDiscount = (e) => {
    e.stopPropagation();
    if (discountOn) {
      // Turn off
      const total = orderTotal(order.items, order.jarSwaps, order.containerReturns, null, 0, order.customCharges, order.waiveSurcharge);
      onUpdate({ discountType: null, discountValue: 0, total });
    } else {
      // Turn on with the regular's percent
      const total = orderTotal(order.items, order.jarSwaps, order.containerReturns, 'percent', regularDiscount, order.customCharges, order.waiveSurcharge);
      onUpdate({ discountType: 'percent', discountValue: regularDiscount, total });
    }
  };

  const cycleStatus = (e) => {
    e.stopPropagation();
    const idx = STATUSES.indexOf(order.status);
    onUpdate({ status: STATUSES[(idx + 1) % STATUSES.length] });
  };

  const togglePaid = (e) => {
    e.stopPropagation();
    onUpdate({ paid: !order.paid });
  };

  const doCopy = async () => {
    const ok = await copyText(orderToText(order));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const startNotes = () => {
    setNotesDraft(order.notes || '');
    setEditingNotes(true);
  };

  const saveNotes = () => {
    onUpdate({ notes: notesDraft.trim() });
    setEditingNotes(false);
  };

  const startContact = () => {
    setAddressDraft(order.address || '');
    setPhoneDraft(order.phone || '');
    setEditingContact(true);
  };

  const saveContact = () => {
    onUpdate({ address: addressDraft.trim(), phone: phoneDraft.trim() });
    setEditingContact(false);
  };

  return (
    <div style={styles.orderCard}>
      <div style={styles.orderCardHeader} onClick={onToggle} role="button" tabIndex={0}>
        <div style={styles.orderCardLeft}>
          <div style={styles.orderCustomer}>
            {order.customer}
            {isRegular && <span style={styles.orderRegularStar}> ★</span>}
          </div>
          <div style={styles.orderMeta}>
            {(order.items || []).reduce((s, it) => s + it.qty, 0)} item{(order.items || []).reduce((s, it) => s + it.qty, 0) !== 1 ? 's' : ''}
            {' '}· {currency(order.total)}
            {disc > 0 ? ' · disc' : ''}
            {order.createdAt ? ` · ${formatDate(order.createdAt)}` : ''}
          </div>
        </div>
        <div style={styles.orderCardRight}>
          <button
            style={{
              ...styles.paidPill,
              ...(order.paid
                ? { background: '#1D9E7522', color: '#1D9E75' }
                : { background: '#EF9F2722', color: '#EF9F27' }),
            }}
            onClick={togglePaid}
          >
            {order.paid ? 'Paid' : 'Unpaid'}
          </button>
          <button
            style={{ ...styles.statusPill, background: `${STATUS_COLORS[order.status]}22`, color: STATUS_COLORS[order.status] }}
            onClick={cycleStatus}
          >
            {order.status}
          </button>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && (
        <div style={styles.orderCardBody}>
          {(() => {
            // Standing restrictions live on the regular. Surfaced here so they
            // are in front of Kevin while he is fulfilling, not one tab away.
            const reg = (regulars || []).find(x => x.id === order.regularId);
            const standing = reg ? [reg.dietary, reg.spice].filter(Boolean).join(' \u00b7 ') : '';
            return standing
              ? <div style={{ fontSize: 12, color: '#EF9F27', fontWeight: 600, marginBottom: 8 }}>Standing: {standing}</div>
              : null;
          })()}
          {(() => {
            // First order: no linked regular, no name match, and nothing older
            // under the same name. Worth knowing before you cook, not after.
            if (order.regularId) return null;
            const nm = String(order.customer || '').trim().toLowerCase();
            if (!nm) return null;
            const knownRegular = (regulars || []).some(r => (regularNames(r) || []).some(n => String(n).trim().toLowerCase() === nm));
            if (knownRegular) return null;
            const t = new Date(order.createdAt || 0).getTime();
            const older = (allOrders || []).some(o => o.id !== order.id
              && String(o.customer || '').trim().toLowerCase() === nm
              && new Date(o.createdAt || 0).getTime() < t);
            return older ? null : <div style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 700, color: '#5DCAA5', border: '1px solid #5DCAA5', borderRadius: 5, padding: '2px 6px', marginBottom: 8 }}>first order</div>;
          })()}
          <div style={styles.orderItemsList}>
            {(order.items || []).map((it, idx) => {
              const perLb = isPerLbItem(it.name);
              const pending = perLb && (it.weightPending || !(it.weight > 0));
              const up = it.upcharge && it.upcharge.amount ? it.upcharge.amount : 0;
              const lineTotal = (it.price + up) * it.qty;
              const est = pending ? perLbEstimate(it.name, it.qty) : null;
              return (
                <div key={idx} style={styles.orderItemBlock}>
                  <div style={styles.orderItemLine}>
                    <span>{it.qty}&times; {it.name} <span style={styles.orderItemVariant}>({perLb && it.weight > 0 ? `${it.weight} lb` : it.variant})</span></span>
                    <span>
                      {pending
                        ? (est != null
                            ? <span style={styles.pendingPrice}>~{currency(est)} <span style={styles.pendingEstTag}>est</span></span>
                            : <span style={styles.pendingPrice}>weigh after shopping</span>)
                        : currency(lineTotal)}
                    </span>
                  </div>
                  {pending && est != null && (
                    <div style={styles.orderItemSub}>estimate at ~{PER_LB_ITEMS[it.name].avgWeightLb} lb — final on weigh-in</div>
                  )}
                  {it.upcharge && typeof it.upcharge === 'object' && it.upcharge.amount > 0 ? (
                    <div style={styles.orderItemSub}>+ {it.upcharge.label} ({currency(it.upcharge.amount)} ea)</div>
                  ) : null}
                  {optionsSummary(it) && <div style={styles.orderItemSub}>{optionsSummary(it)}</div>}
                  {itemAddons(it).map(a => (
                    <div key={a.id} style={{ ...styles.orderItemSub, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span>
                        + {a.request}{' '}
                        {a.pending
                          ? <span style={styles.pendingPrice}>price pending (at cost)</span>
                          : <span>({currency(a.cost)} at cost)</span>}
                      </span>
                      {addonEdit && addonEdit.itemIdx === idx && addonEdit.addonId === a.id ? (
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="number" inputMode="decimal" step="0.01" min="0"
                            value={addonEdit.val}
                            onChange={e => setAddonEdit({ ...addonEdit, val: e.target.value })}
                            style={{ width: 72, padding: '4px 6px', borderRadius: 6, border: '1px solid #3a4441', background: '#202623', color: '#e8ede9', fontSize: 13 }}
                            autoFocus
                          />
                          <button style={styles.setWeightBtn} onClick={() => { const n = parseFloat(addonEdit.val); if (!(n >= 0)) return; applyAddonCost(idx, a.id, n); }}>Save</button>
                          <button style={{ ...styles.setWeightBtn, opacity: 0.7 }} onClick={() => setAddonEdit(null)}>✕</button>
                        </span>
                      ) : (
                        <button style={styles.setWeightBtn} onClick={() => setAddonEdit({ itemIdx: idx, addonId: a.id, val: a.pending ? '' : String(a.cost) })}>
                          {a.pending ? 'Set price' : 'Edit price'}
                        </button>
                      )}
                    </div>
                  ))}
                  {noteWithoutOptions(it.note) && <div style={styles.orderItemNote}>“{noteWithoutOptions(it.note)}”</div>}
                  {it.omakase && <OmakaseLogger item={it} order={order} onUpdate={onUpdate} allOrders={allOrders} perLbLiveCost={perLbLiveCost} weekDishes={weekDishes} restrictions={(() => { const r = (regulars || []).find(x => x.id === order.regularId); return r ? [r.dietary, r.spice].filter(Boolean).join(' \u00b7 ') : ''; })()} />}
                  {perLb && (
                    <button
                      style={styles.setWeightBtn}
                      onClick={() => setWeightFlow({ mode: 'single', queue: [idx], pos: 0 })}
                    >
                      <Scale size={12} /> {it.weight > 0 ? 'Update weight' : 'Set weight'}{it.hasPhoto ? ' · 📷' : ''}
                    </button>
                  )}
                </div>
              );
            })}
            {disc > 0 && (
              <div style={{ ...styles.orderItemLine, color: '#E8799A' }}>
                <span>Discount{order.discountType === 'percent' ? ` (${order.discountValue}%)` : ''}</span>
                <span>−{currency(disc)}</span>
              </div>
            )}
            {(order.customCharges || []).map(ch => (
              <div key={ch.id} style={styles.orderItemLine}>
                <span>{ch.label}</span>
                <span>{currency(Number(ch.amount) || 0)}</span>
              </div>
            ))}
          </div>

          {(order.jarSwaps > 0 || order.containerReturns > 0) && (
            <div style={styles.loopSummary}>
              {order.jarSwaps > 0 && <span>{order.jarSwaps} jar swap{order.jarSwaps > 1 ? 's' : ''} (−{currency(order.jarSwaps * 2)})</span>}
              {order.containerReturns > 0 && <span>{order.containerReturns} container{order.containerReturns > 1 ? 's' : ''} returned (−{currency(order.containerReturns * 1)})</span>}
            </div>
          )}

          {/* Regular discount toggle — only shows for regulars with a discount */}
          {isRegular && regularDiscount > 0 && (
            <button style={styles.regularDiscountToggle} onClick={toggleRegularDiscount}>
              <span style={styles.regularDiscountLabel}>
                ★ {regularDisplayName(matchedRegular)}'s {regularDiscount}% discount
              </span>
              <span style={{ ...styles.toggleSwitch, ...(discountOn ? styles.toggleSwitchOn : {}) }}>
                <span style={{ ...styles.toggleKnob, ...(discountOn ? styles.toggleKnobOn : {}) }} />
              </span>
            </button>
          )}

          {/* Address / phone — inline editable, same pattern as notes */}
          <div style={styles.notesBlock}>
            {editingContact ? (
              <>
                <input
                  style={{ ...styles.textarea, minHeight: 'unset', padding: '8px 10px', marginBottom: '6px' }}
                  value={addressDraft}
                  onChange={e => setAddressDraft(e.target.value)}
                  placeholder="Address…"
                  autoFocus
                />
                <input
                  style={{ ...styles.textarea, minHeight: 'unset', padding: '8px 10px', marginBottom: '6px' }}
                  value={phoneDraft}
                  onChange={e => setPhoneDraft(e.target.value)}
                  placeholder="Phone…"
                />
                <div style={styles.notesEditActions}>
                  <button style={styles.confirmYesGreen} onClick={saveContact}>Save</button>
                  <button style={styles.confirmNo} onClick={() => setEditingContact(false)}>Cancel</button>
                </div>
              </>
            ) : (order.address || order.phone) ? (
              <div style={styles.orderContactBlock} onClick={startContact} role="button" tabIndex={0}>
                {order.address && <div style={styles.orderContactRow}>📍 {order.address}</div>}
                {order.phone && <div style={styles.orderContactRow}>📞 {order.phone}</div>}
                {order.address && (
                  <div style={styles.contactBtnRow} onClick={e => e.stopPropagation()}>
                    <button style={styles.contactActionBtn} onClick={() => {
                      navigator.clipboard.writeText(order.address);
                      setCopyMsg('Address copied!');
                      setTimeout(() => setCopyMsg(null), 2500);
                    }}>
                      Copy address
                    </button>
                    <button style={styles.contactActionBtn} onClick={() => {
                      window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(order.address), '_blank');
                    }}>
                      Open in Maps
                    </button>
                  </div>
                )}
                <span style={styles.notesEditHint}>tap to edit</span>
                {copyMsg && <span style={{ ...styles.notesEditHint, color: TEAL_LIGHT }}>{copyMsg}</span>}
              </div>
            ) : (
              <button style={styles.addNoteBtn} onClick={startContact}>
                <Pencil size={13} />
                Add address / phone
              </button>
            )}
          </div>

          {/* Inline notes: view, edit in place */}
          <div style={styles.notesBlock}>
            {editingNotes ? (
              <>
                <textarea
                  style={{ ...styles.textarea, minHeight: '50px' }}
                  value={notesDraft}
                  onChange={e => setNotesDraft(e.target.value)}
                  placeholder="Add a note for this order..."
                  autoFocus
                />
                <div style={styles.notesEditActions}>
                  <button style={styles.confirmYesGreen} onClick={saveNotes}>Save note</button>
                  <button style={styles.confirmNo} onClick={() => setEditingNotes(false)}>Cancel</button>
                </div>
              </>
            ) : order.notes ? (
              <div style={styles.orderNotes} onClick={startNotes} role="button" tabIndex={0}>
                {order.notes}
                <span style={styles.notesEditHint}> — tap to edit</span>
              </div>
            ) : (
              <button style={styles.addNoteBtn} onClick={startNotes}>
                <Pencil size={13} />
                Add note
              </button>
            )}
          </div>

          <div style={styles.orderCardFooter}>
            {perLbIdxs.length > 1 && (
              <button
                style={styles.updateAllWeightsBtn}
                onClick={() => setWeightFlow({ mode: 'walk', queue: perLbIdxs, pos: 0 })}
              >
                <Scale size={14} />
                {anyPending ? 'Set sous vide weights' : 'Update sous vide weights'} ({perLbIdxs.length})
              </button>
            )}
            <div style={styles.statusRow}>
              {STATUSES.map(s => (
                <button
                  key={s}
                  style={{
                    ...styles.statusOption,
                    ...(order.status === s ? { background: STATUS_COLORS[s], color: '#1a1a1a', borderColor: STATUS_COLORS[s] } : {}),
                  }}
                  onClick={() => onUpdate({ status: s })}
                >
                  {s}
                </button>
              ))}
            </div>

            {starOpen && nearMisses.length > 0 && (
              <div style={{ background: '#232d2a', border: '1px solid #2d3a36', borderRadius: 8, padding: 10, margin: '8px 0', fontSize: 12.5 }}>
                <div style={{ color: '#9aa5a0', marginBottom: 6 }}>
                  "{order.customer}" looks close to an existing regular. Link this order to them (adds "{order.customer}" as one of their names), or create a separate new regular.
                </div>
                {nearMisses.map(r => (
                  <button key={r.id} style={{ ...styles.actionBtn, width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
                    onClick={() => { onLinkRegular && onLinkRegular(r.id, order); setStarOpen(false); }}>
                    Link to {regularDisplayName(r)}
                  </button>
                ))}
                <button style={{ ...styles.actionBtn, width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => { onMakeRegular && onMakeRegular(order); setStarOpen(false); }}>
                  It's someone new. Create a regular
                </button>
              </div>
            )}
            <div style={styles.actionRow}>
              <button style={styles.actionBtn} onClick={onEdit}>
                <Pencil size={14} />
                Edit
              </button>
              {!isRegular && onMakeRegular && (
                <button style={styles.actionBtn} onClick={() => {
                  if (nearMisses.length) setStarOpen(o => !o);
                  else onMakeRegular(order);
                }}>
                  ★ Make regular
                </button>
              )}
              <button style={styles.actionBtn} onClick={doCopy}>
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy text'}
              </button>
              <button style={styles.actionBtn} onClick={() => {
                // Kitchen companion. iOS Safari refuses clipboard writes after
                // an awaited fetch (transient-activation rule), so: copy the
                // link FIRST inside the tap gesture, then push the page. If
                // the push fails, the copied link just 404s with a friendly
                // message and we tell Kevin here too.
                const cid = order.id + '-' + Math.random().toString(36).slice(2, 8);
                const link = WORKER_BASE + '/k?id=' + cid;
                navigator.clipboard.writeText(link).catch(() => {});
                // Remember the page id on the order so kitchen feedback can
                // find its way home to this exact order record.
                onUpdate && onUpdate({ kitchenPageId: cid });
                setCopyMsg('Kitchen link copied. Uploading the page…');
                fetch(WORKER_BASE + '/companion', {
                  method: 'POST', headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ token: PUBLISH_TOKEN, id: cid, html: companionHtml(order, cid, { passport: buildPassport(order, regulars, allOrders) }), context: companionContext(order, { passport: buildPassport(order, regulars, allOrders) }) }),
                }).then(res => {
                  if (!res.ok) throw new Error('push failed');
                  setCopyMsg('Kitchen link copied and live. Send it to ' + (order.customer || 'them') + '.');
                }).catch(() => {
                  setCopyMsg('Page upload failed (deploy the v6 worker?). The copied link will not work yet.');
                }).finally(() => setTimeout(() => setCopyMsg(null), 5000));
              }}>
                🍳 Kitchen link
              </button>
              <button style={styles.actionBtn} onClick={() => setShowInvoice(true)}>
                <FileText size={14} />
                Invoice
              </button>
              <button
                style={hasReheatable ? styles.actionBtn : { ...styles.actionBtn, opacity: 0.4, cursor: 'not-allowed' }}
                onClick={() => hasReheatable && setShowReheat(true)}
                disabled={!hasReheatable}
              >
                <Flame size={14} />
                Reheat
              </button>
              {confirmDelete ? (
                <div style={styles.confirmRow}>
                  <button style={styles.confirmYes} onClick={onDelete}>Delete</button>
                  <button style={styles.confirmNo} onClick={() => setConfirmDelete(false)}>Cancel</button>
                </div>
              ) : (
                <button style={{ ...styles.actionBtn, color: '#993556' }} onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showInvoice && <InvoiceModal order={order} onClose={() => setShowInvoice(false)} />}
      {showReheat && <ReheatModal order={order} onClose={() => setShowReheat(false)} />}
      {weightFlow && (() => {
        const itemIdx = weightFlow.queue[weightFlow.pos];
        const it = order.items[itemIdx];
        if (!it) return null;
        return (
          <WeightPhotoModal
            orderId={order.id}
            itemIdx={itemIdx}
            item={it}
            stepLabel={weightFlow.mode === 'walk' ? `${weightFlow.pos + 1} of ${weightFlow.queue.length}` : null}
            onApply={applyWeight}
            onClose={() => setWeightFlow(null)}
          />
        );
      })()}
    </div>
  );
}
