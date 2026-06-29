import React, { useState, useMemo, useCallback } from 'react';
import { X, Check, Camera, Trash2, Plus } from '../icons.jsx';
import { fileToJpegBase64, extractReceipt, currency } from '../utils.js';
import { normalizeIngredientName } from '../recipes.js';
import { CATEGORY_ORDER, CATEGORY_LABELS_ING, INGREDIENT_SEED } from '../ingredients.js';
import { buildReviewPlan, defaultAccept, normalizeUnit, convertPerUnit } from '../receiptMatch.js';

const TEAL_LIGHT = '#3fb8a0';
const RED = '#e0828a';
const GOLD = '#c9a84c';

// ── stages ──────────────────────────────────────────────────────────────────
// capture -> extracting -> review (the work happens here) -> done
export function ReceiptScan({ ingredients, aliases, onSaveAliases, onCommit, onClose }) {
  const [stage, setStage] = useState('capture');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [imgB64, setImgB64] = useState(null);
  const [plan, setPlan] = useState(null);          // buildReviewPlan output
  const [rows, setRows] = useState([]);            // working review rows (mutable copy)
  const [localAliases, setLocalAliases] = useState(aliases || {}); // staged alias edits
  const [picker, setPicker] = useState(null);      // { rowIdx } -> disambiguation popup open
  const [addNew, setAddNew] = useState(null);      // { rowIdx, name, unit, category } -> inline create

  const seed = ingredients || [];

  // ---- capture ----
  const onPick = useCallback(async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setErr(''); setBusy(true);
    try {
      const b64 = await fileToJpegBase64(file, 1600, 0.7); // receipts need legible text
      setImgB64(b64);
      setStage('extracting');
      const extracted = await extractReceipt(b64);
      const p = buildReviewPlan(extracted, seed, aliases || {});
      setPlan(p);
      setRows(planToRows(p));
      setStage('review');
    } catch (e2) {
      const msg = e2 && e2.message === 'OUT_OF_CREDITS'
        ? 'The AI service is out of credits. Add credits and try again.'
        : `Could not read that receipt. ${e2 && e2.message ? e2.message : ''}`;
      setErr(msg);
      setStage('capture');
    } finally {
      setBusy(false);
    }
  }, [seed, aliases]);

  // ---- build working rows from the plan ----
  function planToRows(p) {
    const out = [];
    p.buckets.matched.forEach(g => out.push(makeRow(g, 'matched')));
    p.buckets.needsPrice.forEach(g => out.push(makeRow(g, 'needsPrice')));
    p.buckets.unmatched.forEach(g => out.push(makeRow(g, 'unmatched')));
    p.buckets.ignored.forEach(g => out.push(makeRow(g, 'ignored')));
    return out;
  }
  function makeRow(g, status) {
    return {
      ...g,
      status,
      // accept toggle: only meaningful for matched/needsPrice; default per basis
      accept: status === 'matched' ? defaultAccept(g) : (status === 'needsPrice' ? false : false),
      priceInput: '',          // for needsPrice: typed per-unit
      acceptedPerUnit: status === 'matched' ? g.perUnit : null,
    };
  }

  // ---- helpers to mutate a row ----
  const patchRow = useCallback((idx, patch) => {
    setRows(rs => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }, []);

  // ---- disambiguation actions ----
  const resolveToIngredient = useCallback((idx, ingredientId, writeAlias) => {
    const ing = seed.find(s => s.id === ingredientId);
    setRows(rs => rs.map((r, i) => {
      if (i !== idx) return r;
      // re-derive price basis now that it's matched
      const line = r.line;
      let perUnit = null, basis = null, status = 'matched', accept = false;
      if (line.unit_price_printed != null) { perUnit = line.unit_price_printed; basis = 'printed_unit_price'; accept = true; }
      else if (line.weighed && line.quantity != null && line.line_total != null) { perUnit = round(line.line_total / line.quantity); basis = 'total_div_weight'; accept = true; }
      else if (r.needsPrice || (line.weighed && line.quantity == null)) { status = 'needsPrice'; }
      else if (line.line_total != null) { perUnit = line.line_total; basis = 'line_total'; accept = false; }
      // auto-convert receipt unit → ingredient costing unit (e.g. per gal → per cup)
      let conversion = null;
      if (perUnit != null && (basis === 'printed_unit_price' || basis === 'total_div_weight')) {
        const conv = convertPerUnit(perUnit, normalizeUnit(line.unit), ing ? ing.unit : null, ingredientId);
        if (conv) { perUnit = conv.perUnit; conversion = { fromUnit: conv.fromUnit, toUnit: conv.toUnit, factor: conv.factor, basis }; basis = 'converted'; }
      }
      return { ...r, status, ingredientId, ingredient: ing, perUnit, basis, conversion, accept, acceptedPerUnit: accept ? perUnit : null };
    }));
    if (writeAlias) {
      const key = normalizeIngredientName(rows[idx].line.item_name);
      setLocalAliases(a => ({ ...a, [key]: { ...(a[key] || {}), ingredientId } }));
    }
    setPicker(null);
  }, [seed, rows]);

  const ignoreRow = useCallback((idx, always) => {
    setRows(rs => rs.map((r, i) => (i === idx ? { ...r, status: 'ignored', accept: false } : r)));
    if (always) {
      const key = normalizeIngredientName(rows[idx].line.item_name);
      setLocalAliases(a => ({ ...a, [key]: { action: 'IGNORE_ALWAYS' } }));
    }
    setPicker(null);
  }, [rows]);

  // H-Mart flat-price escape: stop prompting weight, use line total
  const useFlatPrice = useCallback((idx) => {
    setRows(rs => rs.map((r, i) => {
      if (i !== idx) return r;
      const perUnit = r.line.line_total;
      return { ...r, status: 'matched', basis: 'line_total', perUnit, accept: false, acceptedPerUnit: null };
    }));
    const key = normalizeIngredientName(rows[idx].line.item_name);
    setLocalAliases(a => ({ ...a, [key]: { ...(a[key] || {}), pricing: 'FLAT' } }));
  }, [rows]);

  // ---- inline new ingredient ----
  const confirmAddNew = useCallback(() => {
    const { rowIdx, name, unit, category } = addNew;
    const nm = (name || '').trim();
    if (!nm) return;
    const line = rows[rowIdx].line;
    const cost = line.line_total != null ? line.line_total : 0;
    const id = nm.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + Date.now().toString(36).slice(-4);
    const newIng = { id, name: nm, unit: (unit || 'each').trim(), baseline: cost, current: cost, category: category || 'pantry' };
    // stash on the row so commit can create it; mark accepted
    patchRow(rowIdx, { status: 'matched', ingredientId: id, ingredient: newIng, perUnit: cost, basis: 'line_total', accept: true, acceptedPerUnit: cost, _createIngredient: newIng });
    const key = normalizeIngredientName(line.item_name);
    setLocalAliases(a => ({ ...a, [key]: { ingredientId: id } }));
    setAddNew(null);
  }, [addNew, rows, patchRow]);

  // ---- commit ----
  const acceptedCount = useMemo(() => rows.filter(r => (r.status === 'matched' || r.status === 'needsPrice') && r.accept && validPerUnit(r)).length, [rows]);

  const doCommit = useCallback(() => {
    const updates = [];
    const newIngredients = [];
    rows.forEach(r => {
      if ((r.status === 'matched' || r.status === 'needsPrice') && r.accept) {
        const pu = effectivePerUnit(r);
        if (pu != null && r.ingredientId) {
          updates.push({ id: r.ingredientId, cost: round(pu) });
          if (r._createIngredient) newIngredients.push(r._createIngredient);
        }
      }
    });
    // Price links: some ingredients always share a cost (e.g. Guittard low/high %).
    // When a receipt updates either side, mirror the same cost onto its partner(s)
    // so the two never drift apart, whichever one the receipt happened to name.
    const updatedIds = new Set(updates.map(u => u.id));
    const linkExtras = [];
    updates.forEach(u => {
      INGREDIENT_SEED.forEach(seed => {
        // u.id is the source -> push to anything linking to it
        if (seed.priceLink === u.id && !updatedIds.has(seed.id)) linkExtras.push({ id: seed.id, cost: u.cost });
        // u.id links to a source -> also set the source to match
        const self = INGREDIENT_SEED.find(s => s.id === u.id);
        if (self && self.priceLink === seed.id && !updatedIds.has(seed.id)) linkExtras.push({ id: seed.id, cost: u.cost });
      });
    });
    linkExtras.forEach(e => { if (!updatedIds.has(e.id)) { updates.push(e); updatedIds.add(e.id); } });
    // persist aliases (staged edits this session)
    onSaveAliases(localAliases);
    // commit costs stamped with purchase date (App handler handles new-ingredient ids via current map)
    onCommit(updates, plan ? plan.receipt_date : null, newIngredients);
    setStage('done');
  }, [rows, localAliases, onCommit, onSaveAliases, plan]);

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.card} onClick={e => e.stopPropagation()}>
        <div style={S.header}>
          <div style={S.title}>Scan receipt</div>
          <button style={S.iconBtn} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {stage === 'capture' && (
          <div>
            <p style={S.help}>Photograph a store receipt or pick one from your camera roll. Costs only update for items on the receipt, and nothing changes until you confirm each one.</p>
            <label style={S.captureBtn}>
              <Camera size={18} />
              {busy ? 'Working…' : 'Take photo or choose'}
              <input type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
            </label>
            {err && <div style={S.error}>{err}</div>}
          </div>
        )}

        {stage === 'extracting' && (
          <div style={S.center}>
            {imgB64 && <img src={`data:image/jpeg;base64,${imgB64}`} alt="receipt" style={S.thumb} />}
            <div style={S.spinner}>Reading the receipt…</div>
          </div>
        )}

        {stage === 'review' && plan && (
          <ReviewBody
            plan={plan} rows={rows} seed={seed}
            patchRow={patchRow}
            onOpenPicker={(idx) => setPicker({ rowIdx: idx })}
            onUseFlatPrice={useFlatPrice}
            acceptedCount={acceptedCount}
            onCommit={doCommit}
          />
        )}

        {stage === 'done' && (
          <div style={S.center}>
            <div style={{ color: TEAL_LIGHT, fontSize: 40, marginBottom: 8 }}><Check size={40} /></div>
            <div style={S.doneTitle}>{acceptedCount} cost{acceptedCount === 1 ? '' : 's'} updated</div>
            <div style={S.help}>Stamped to {plan && plan.receipt_date ? plan.receipt_date : 'today'}. Dishes using these ingredients have recomputed.</div>
            <button style={S.primaryBtn} onClick={onClose}>Done</button>
          </div>
        )}
      </div>

      {/* disambiguation popup */}
      {picker && (
        <DisambiguationPopup
          row={rows[picker.rowIdx]} seed={seed}
          onPick={(id, writeAlias) => resolveToIngredient(picker.rowIdx, id, writeAlias)}
          onIgnore={(always) => ignoreRow(picker.rowIdx, always)}
          onAddNew={() => { setAddNew({ rowIdx: picker.rowIdx, name: rows[picker.rowIdx].line.item_name, unit: '', category: 'pantry' }); setPicker(null); }}
          onClose={() => setPicker(null)}
        />
      )}

      {/* inline new-ingredient mini form */}
      {addNew && (
        <div style={S.overlay} onClick={() => setAddNew(null)}>
          <div style={S.smallCard} onClick={e => e.stopPropagation()}>
            <div style={S.header}>
              <div style={S.title}>Add new ingredient</div>
              <button style={S.iconBtn} onClick={() => setAddNew(null)}><X size={18} /></button>
            </div>
            <input style={S.input} placeholder="Name" value={addNew.name} onChange={e => setAddNew({ ...addNew, name: e.target.value })} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="Unit (lb, each…)" value={addNew.unit} onChange={e => setAddNew({ ...addNew, unit: e.target.value })} />
              <select style={{ ...S.input, flex: 1 }} value={addNew.category} onChange={e => setAddNew({ ...addNew, category: e.target.value })}>
                {CATEGORY_ORDER.map(c => <option key={c} value={c}>{CATEGORY_LABELS_ING[c]}</option>)}
              </select>
            </div>
            <div style={S.reconcileNote}>Cost will start at this receipt's line total. You can refine it later in the Ingredients tab.</div>
            <button style={S.primaryBtn} onClick={confirmAddNew}>Add &amp; map</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── review body ──────────────────────────────────────────────────────────────
function ReviewBody({ plan, rows, seed, patchRow, onOpenPicker, onUseFlatPrice, acceptedCount, onCommit }) {
  const matched = rows.map((r, i) => ({ r, i })).filter(x => x.r.status === 'matched');
  const needs = rows.map((r, i) => ({ r, i })).filter(x => x.r.status === 'needsPrice');
  const unmatched = rows.map((r, i) => ({ r, i })).filter(x => x.r.status === 'unmatched');
  const ignored = rows.map((r, i) => ({ r, i })).filter(x => x.r.status === 'ignored');

  return (
    <div>
      <div style={S.metaLine}>
        {plan.store || 'Receipt'}{plan.receipt_date ? ` · ${plan.receipt_date}` : ' · date not found (uses today)'}
      </div>

      {needs.length > 0 && (
        <Section title="Need a price">
          {needs.map(({ r, i }) => <NeedsPriceRow key={i} r={r} idx={i} patchRow={patchRow} onOpenPicker={onOpenPicker} onUseFlatPrice={onUseFlatPrice} />)}
        </Section>
      )}

      {matched.length > 0 && (
        <Section title="Matched — confirm each">
          {matched.map(({ r, i }) => <MatchedRow key={i} r={r} idx={i} patchRow={patchRow} onOpenPicker={onOpenPicker} />)}
        </Section>
      )}

      {unmatched.length > 0 && (
        <Section title="Unmatched (ignored unless you map them)">
          {unmatched.map(({ r, i }) => <UnmatchedRow key={i} r={r} idx={i} onOpenPicker={onOpenPicker} />)}
        </Section>
      )}

      {ignored.length > 0 && (
        <Section title="Ignored">
          {ignored.map(({ r, i }) => (
            <div key={i} style={S.ignoredRow}>
              <span>{r.line.item_name}{r.count > 1 ? ` ×${r.count}` : ''}</span>
              <button style={S.linkBtn} onClick={() => onOpenPicker(i)}>map</button>
            </div>
          ))}
        </Section>
      )}

      <button
        style={{ ...S.primaryBtn, marginTop: 16, ...(acceptedCount > 0 ? {} : S.primaryBtnDisabled) }}
        onClick={onCommit}
        disabled={acceptedCount === 0}
      >
        {acceptedCount > 0 ? `Update ${acceptedCount} cost${acceptedCount === 1 ? '' : 's'}` : 'Accept at least one line'}
      </button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={S.section}>
      <div style={S.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

// matched row: shows current -> receipt-implied, with accept toggle + unit reconcile
function MatchedRow({ r, idx, patchRow, onOpenPicker }) {
  const ing = r.ingredient;
  const cur = ing ? ing.current : null;
  const implied = effectivePerUnit(r);
  const mismatchRisk = r.basis === 'line_total'; // box-vs-stick guard
  return (
    <div style={{ ...S.row, ...(r.accept ? S.rowOn : {}) }}>
      <div style={S.rowTop}>
        <div style={S.rowName}>{r.line.item_name}{r.count > 1 ? ` ×${r.count}` : ''}</div>
        <button style={S.acceptToggle(r.accept)} onClick={() => patchRow(idx, { accept: !r.accept })}>
          {r.accept ? <Check size={15} /> : null}
        </button>
      </div>
      <div style={S.mapLine}>
        → {ing ? ing.name : '—'} <button style={S.linkBtn} onClick={() => onOpenPicker(idx)}>change</button>
      </div>
      <div style={S.reconcile}>
        <span style={S.curCost}>now {cur != null ? currency(cur) : '—'}{ing ? `/${ing.unit}` : ''}</span>
        <span style={S.arrow}>→</span>
        <span style={S.newCost}>{implied != null ? currency(implied) : '—'}{ing ? `/${ing.unit}` : ''}</span>
      </div>
      {r.conversion && (
        <div style={S.convNote}>
          Converted from receipt price per {r.conversion.fromUnit} ({r.conversion.factor % 1 === 0 ? `${r.conversion.factor} ${r.conversion.toUnit}s per ${r.conversion.fromUnit}` : `${round(r.conversion.factor)}× ${r.conversion.toUnit}`}).
        </div>
      )}
      {mismatchRisk && (
        <div style={S.warn}>
          Receipt gives a line total ({currency(r.line.line_total)}), not a per-{ing ? ing.unit : 'unit'} price. Confirm this equals one {ing ? ing.unit : 'unit'}, or edit below.
        </div>
      )}
      <EditablePerUnit r={r} idx={idx} patchRow={patchRow} />
    </div>
  );
}

// needs-price row: a weighed item with no weight printed; type per-unit, or
// fall back to the line total via "Flat price".
function NeedsPriceRow({ r, idx, patchRow, onOpenPicker, onUseFlatPrice }) {
  const ing = r.ingredient;
  const reasonText = 'Weighed item, no weight printed. Enter the price per ' + (ing ? ing.unit : 'unit') + ', or use the flat total.';
  return (
    <div style={{ ...S.row, ...(r.accept ? S.rowOn : {}) }}>
      <div style={S.rowTop}>
        <div style={S.rowName}>{r.line.item_name}{r.count > 1 ? ` ×${r.count}` : ''} <span style={S.subtle}>({currency(r.line.line_total)})</span></div>
        <button style={S.acceptToggle(r.accept && validPerUnit(r))} onClick={() => { if (validPerUnit(r)) patchRow(idx, { accept: !r.accept }); }}>
          {r.accept && validPerUnit(r) ? <Check size={15} /> : null}
        </button>
      </div>
      <div style={S.mapLine}>
        → {ing ? ing.name : '—'} <button style={S.linkBtn} onClick={() => onOpenPicker(idx)}>change</button>
      </div>
      <div style={S.hint}>{reasonText}</div>
      <div style={S.priceRow}>
        <span style={S.dollar}>$</span>
        <input
          style={S.priceInput}
          type="number" inputMode="decimal" step="0.01" placeholder={`per ${ing ? ing.unit : 'unit'}`}
          value={r.priceInput}
          onChange={e => {
            const v = e.target.value;
            const num = parseFloat(v);
            patchRow(idx, { priceInput: v, acceptedPerUnit: isNaN(num) ? null : num, accept: !isNaN(num) && num > 0 });
          }}
        />
        <button style={S.flatBtn} onClick={() => onUseFlatPrice(idx)}>Flat price</button>
      </div>
    </div>
  );
}

function UnmatchedRow({ r, idx, onOpenPicker }) {
  return (
    <div style={S.row}>
      <div style={S.rowTop}>
        <div style={S.rowName}>{r.line.item_name}{r.count > 1 ? ` ×${r.count}` : ''} <span style={S.subtle}>({currency(r.line.line_total)})</span></div>
      </div>
      <div style={S.hint}>Not matched. Ignored unless you map it.</div>
      <button style={S.mapBtn} onClick={() => onOpenPicker(idx)}>Map this item</button>
    </div>
  );
}

// optional manual per-unit edit on a matched row (lets Kevin correct box->stick)
function EditablePerUnit({ r, idx, patchRow }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return <button style={S.tinyLink} onClick={() => setOpen(true)}>edit cost</button>;
  }
  return (
    <div style={S.priceRow}>
      <span style={S.dollar}>$</span>
      <input
        style={S.priceInput} type="number" inputMode="decimal" step="0.01"
        defaultValue={effectivePerUnit(r) != null ? effectivePerUnit(r) : ''}
        onChange={e => {
          const num = parseFloat(e.target.value);
          patchRow(idx, { acceptedPerUnit: isNaN(num) ? null : num });
        }}
      />
      <button style={S.flatBtn} onClick={() => setOpen(false)}>ok</button>
    </div>
  );
}

// ── disambiguation popup (the 3-way exit) ───────────────────────────────────
function DisambiguationPopup({ row, seed, onPick, onIgnore, onAddNew, onClose }) {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const [ignoreMode, setIgnoreMode] = useState(false);

  const candidates = row.candidates || [];
  const allFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? seed.filter(s => s.name.toLowerCase().includes(q)) : seed;
    const byCat = {};
    list.forEach(s => { const c = s.category || 'pantry'; (byCat[c] = byCat[c] || []).push(s); });
    return byCat;
  }, [seed, search]);

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.smallCard} onClick={e => e.stopPropagation()}>
        <div style={S.header}>
          <div style={S.title}>“{row.line.item_name}”</div>
          <button style={S.iconBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {ignoreMode ? (
          <div>
            <div style={S.hint}>Skip this line?</div>
            <button style={S.choiceBtn} onClick={() => onIgnore(false)}>Ignore just this once</button>
            <button style={S.choiceBtn} onClick={() => onIgnore(true)}>Always ignore “{row.line.item_name}”</button>
            <button style={S.linkBtn} onClick={() => setIgnoreMode(false)}>back</button>
          </div>
        ) : !showAll ? (
          <div>
            {candidates.length > 0 && (
              <>
                <div style={S.popHint}>Is it one of these?</div>
                {candidates.map(c => (
                  <button key={c.id} style={S.choiceBtn} onClick={() => onPick(c.id, true)}>
                    {c.name} <span style={S.scoreTag}>{Math.round(c.score * 100)}%</span>
                  </button>
                ))}
              </>
            )}
            <button style={S.choiceBtnAlt} onClick={() => setShowAll(true)}>It's something else in my list…</button>
            <button style={S.choiceBtnAlt} onClick={() => setIgnoreMode(true)}>Ignore this line</button>
            <button style={S.choiceBtnGhost} onClick={onAddNew}><Plus size={13} /> Add as new ingredient</button>
          </div>
        ) : (
          <div>
            <input style={S.input} placeholder="Search ingredients…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
            <div style={S.pickScroll}>
              {CATEGORY_ORDER.filter(c => allFiltered[c]).map(c => (
                <div key={c}>
                  <div style={S.pickCat}>{CATEGORY_LABELS_ING[c]}</div>
                  {allFiltered[c].map(s => (
                    <button key={s.id} style={S.choiceBtn} onClick={() => onPick(s.id, true)}>
                      {s.name} <span style={S.subtle}>per {s.unit}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <button style={S.linkBtn} onClick={() => setShowAll(false)}>back</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────
function round(n) { return Math.round(n * 1000) / 1000; }
function effectivePerUnit(r) {
  if (r.acceptedPerUnit != null) return r.acceptedPerUnit;
  return r.perUnit != null ? r.perUnit : null;
}
function validPerUnit(r) {
  const v = effectivePerUnit(r);
  return v != null && v > 0;
}

// ── styles ──────────────────────────────────────────────────────────────────
const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 12px', zIndex: 200, overflowY: 'auto' },
  card: { width: '100%', maxWidth: 420, background: '#222826', border: '1px solid #2d6a6a', borderRadius: 14, padding: 18, boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' },
  smallCard: { width: '100%', maxWidth: 380, background: '#222826', border: '1px solid #2d6a6a', borderRadius: 14, padding: 16, boxSizing: 'border-box', maxHeight: '85vh', overflowY: 'auto', zIndex: 210 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: 700, color: '#fff' },
  iconBtn: { background: 'transparent', border: 'none', color: '#9aa5a0', cursor: 'pointer', padding: 4, display: 'flex' },
  help: { fontSize: 13, color: '#9aa5a0', lineHeight: 1.5, marginBottom: 14 },
  captureBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: TEAL_LIGHT, color: '#04342C', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  error: { marginTop: 12, fontSize: 13, color: RED, lineHeight: 1.5 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '12px 0' },
  thumb: { maxWidth: 160, maxHeight: 200, borderRadius: 8, marginBottom: 12, opacity: 0.8 },
  spinner: { fontSize: 14, color: GOLD, fontWeight: 600 },
  doneTitle: { fontSize: 18, fontWeight: 700, color: '#e8e2d4', marginBottom: 6 },
  metaLine: { fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: '#9aa5a0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  row: { background: '#232a28', border: '1px solid #2d3a36', borderRadius: 10, padding: 11, marginBottom: 8 },
  rowOn: { borderColor: TEAL_LIGHT, background: 'rgba(63,184,160,0.08)' },
  rowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  rowName: { fontSize: 14, color: '#e8e2d4', fontWeight: 600, flex: 1 },
  subtle: { fontSize: 12, color: '#9aa5a0', fontWeight: 400 },
  mapLine: { fontSize: 12, color: '#c8d0cc', marginTop: 3 },
  reconcile: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 },
  curCost: { fontSize: 13, color: '#9aa5a0' },
  arrow: { color: '#6b7a74' },
  newCost: { fontSize: 14, color: TEAL_LIGHT, fontWeight: 700 },
  warn: { fontSize: 11.5, color: '#e8c87a', background: 'rgba(232,200,122,0.08)', borderRadius: 6, padding: '6px 8px', marginTop: 6, lineHeight: 1.4 },
  convNote: { fontSize: 11, color: '#8fb9ad', marginTop: 5, lineHeight: 1.4, fontStyle: 'italic' },
  hint: { fontSize: 12, color: '#9aa5a0', marginTop: 4, lineHeight: 1.4 },
  priceRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 },
  dollar: { color: '#9aa5a0', fontSize: 14 },
  priceInput: { flex: 1, background: '#1a1a1a', border: '1px solid #37403c', borderRadius: 8, padding: '8px 10px', color: '#e8e2d4', fontSize: 14, outline: 'none' },
  flatBtn: { background: '#2d6a6a', color: '#e8e2d4', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  acceptToggle: (on) => ({ width: 26, height: 26, borderRadius: 7, border: on ? 'none' : '1.5px solid #4a5550', background: on ? TEAL_LIGHT : 'transparent', color: '#04342C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
  mapBtn: { marginTop: 8, width: '100%', background: 'transparent', border: '1px solid #37403c', color: '#c8d0cc', borderRadius: 8, padding: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  ignoredRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#7a857f', padding: '5px 2px' },
  linkBtn: { background: 'transparent', border: 'none', color: TEAL_LIGHT, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '2px 4px' },
  tinyLink: { background: 'transparent', border: 'none', color: '#7a857f', fontSize: 11, cursor: 'pointer', padding: '4px 0 0', textDecoration: 'underline' },
  primaryBtn: { width: '100%', background: TEAL_LIGHT, color: '#04342C', border: 'none', borderRadius: 10, padding: 13, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  primaryBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  input: { width: '100%', background: '#1a1a1a', border: '1px solid #37403c', borderRadius: 8, padding: '10px 12px', color: '#e8e2d4', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 },
  reconcileNote: { fontSize: 12, color: '#9aa5a0', lineHeight: 1.4, margin: '4px 0 10px' },
  popHint: { fontSize: 12, color: '#9aa5a0', marginBottom: 8 },
  choiceBtn: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', background: '#232a28', border: '1px solid #2d3a36', borderRadius: 9, padding: '11px 12px', color: '#e8e2d4', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 6 },
  choiceBtnAlt: { width: '100%', textAlign: 'left', background: 'transparent', border: '1px solid #37403c', borderRadius: 9, padding: '11px 12px', color: '#c8d0cc', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 6 },
  choiceBtnGhost: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: 'transparent', border: '1px dashed #37403c', borderRadius: 9, padding: 11, color: '#9aa5a0', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 2 },
  scoreTag: { fontSize: 11, color: GOLD, fontWeight: 700 },
  pickScroll: { maxHeight: '46vh', overflowY: 'auto', margin: '4px 0 8px' },
  pickCat: { fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: 0.5, margin: '8px 0 4px' },
};
