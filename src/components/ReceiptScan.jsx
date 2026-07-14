import React, { useState, useMemo, useCallback } from 'react';
import { X, Check, Camera, Trash2, Plus } from '../icons.jsx';
import { fileToJpegBase64, extractReceipt, currency } from '../utils.js';
import { normalizeIngredientName } from '../recipes.js';
import { CATEGORY_ORDER, CATEGORY_LABELS_ING, INGREDIENT_SEED } from '../ingredients.js';
import { buildReviewPlan, defaultAccept, normalizeUnit, convertPerUnit, parsePastedReceipt, learnFromAcceptance, learnFromIgnores, learnStoreFact, packShiftAlarm, reconcileReceipt, priceDriftReport, derivePerUnit } from '../receiptMatch.js';

const TEAL_LIGHT = '#3fb8a0';
const RED = '#e0828a';
const GOLD = '#c9a84c';
const TIER_ORDER = { attention: 0, check: 1, auto: 2 }; // review sort: eyes-needed first

// ── stages ──────────────────────────────────────────────────────────────────
// capture -> extracting -> review (the work happens here) -> done
export function ReceiptScan({ ingredients, aliases, onSaveAliases, onCommit, onClose, costHistory, debug }) {
  const [stage, setStage] = useState('capture');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [imgB64, setImgB64] = useState(null);
  const [plan, setPlan] = useState(null);          // buildReviewPlan output
  const [debugText, setDebugText] = useState('');  // debug mode: full copyable scan dump
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [recon, setRecon] = useState(null);        // v3.4 sum-vs-printed-total check (paste path)
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
      // Receipts are long and dense (40+ lines). Downscaling the whole receipt
      // to 1600px crushes each line to ~40px and the vision model misreads the
      // text (names AND prices bleed between adjacent rows). Send a much larger
      // image so small print stays legible. 2600px long-side at 0.85 quality is
      // the sweet spot: legible without blowing the request size.
      const b64 = await fileToJpegBase64(file, 2600, 0.85);
      setImgB64(b64);
      setStage('extracting');
      const extracted = await extractReceipt(b64);
      const p = buildReviewPlan(extracted, seed, aliases || {});
      if (debug) {
        // Debug mode: capture the raw AI extraction, the per-line derivation,
        // and the resulting plan into one copyable block. Same scan, no commit.
        const perLine = (Array.isArray(extracted) ? extracted : (extracted && extracted.lines) || []).map(ln => {
          let d = null; try { d = derivePerUnit(ln); } catch (_) { d = { error: true }; }
          return { name: ln.item_name, qty: ln.quantity, unit: ln.unit, unit_price_printed: ln.unit_price_printed, line_total: ln.line_total, weighed: ln.weighed, derived: d };
        });
        const dump = {
          store: extracted && extracted.store,
          rawExtracted: extracted,
          perLineDerivation: perLine,
          plan: p,
        };
        setDebugText(JSON.stringify(dump, null, 2));
        setStage('debug');
        return;
      }
      setPlan(p);
      setRows(planToRows(p));
      setRecon(reconcileReceipt(extracted)); // verify line sum vs printed subtotal (catches misreads)
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

  // ---- paste path (v3.1): deterministic parser, ZERO model calls ----
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const onPaste = useCallback(() => {
    setErr('');
    const parsed = parsePastedReceipt(pasteText);
    if (!parsed.lines.length) {
      setErr("Couldn't recognize any receipt lines in that text. Try a photo instead, or check the paste includes the item lines.");
      return;
    }
    const p = buildReviewPlan(parsed, seed, aliases || {});
    setPlan(p);
    setRecon(reconcileReceipt(parsed));
    setRows(planToRows(p));
    setStage('review');
    if (parsed.unparsed.length > 3) {
      setErr(`${parsed.unparsed.length} lines weren't recognized and were skipped.`);
    }
  }, [pasteText, seed, aliases]);

  // ---- build working rows from the plan ----
  function planToRows(p) {
    const out = [];
    p.buckets.matched.forEach(g => out.push(makeRow(g, 'matched')));
    p.buckets.needsPrice.forEach(g => out.push(makeRow(g, 'needsPrice')));
    // v2 bridge: the matcher's new review ("I'm unsure — pick one") and
    // needsConversion ("how many per pack?") buckets render through the
    // existing unmatched picker until the dedicated UI lands — their
    // candidates (incl. family suggestions) already show in the picker, and
    // the FLAT hatch covers pack pricing. Never let a bucket go invisible.
    (p.buckets.review || []).forEach(g => out.push(makeRow(g, 'unmatched')));
    (p.buckets.needsConversion || []).forEach(g => out.push(makeRow(g, 'unmatched')));
    p.buckets.unmatched.forEach(g => out.push(makeRow(g, 'unmatched')));
    p.buckets.ignored.forEach(g => out.push(makeRow(g, 'ignored')));
    return out;
  }
  function makeRow(g, status) {
    return {
      ...g,
      status,
      // accept toggle: only meaningful for matched/needsPrice; default per basis
      accept: status === 'matched' ? defaultAccept(g, g.ingredient ? g.ingredient.current : null) : (status === 'needsPrice' ? false : false),
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
      // v3.4 negative learning: remapping AWAY from a suggestion records the
      // rejection so that candidate can't silently auto-win again.
      const prevId = r.ingredientId || r.suggestedId || null;
      const _rejectedId = prevId && prevId !== ingredientId ? prevId : (r._rejectedId || null);
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
      return { ...r, status, ingredientId, ingredient: ing, perUnit, basis, conversion, accept, acceptedPerUnit: accept ? perUnit : null, _rejectedId };
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
      return { ...r, status: 'matched', basis: 'line_total', perUnit, accept: false, acceptedPerUnit: null, _usedFlat: true };
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
    // persist aliases (staged edits this session) + LEARNING (v3.2): every
    // accepted match teaches the matcher — alias, learned pack size from any
    // accepted conversion, and a confirm counter for auto-promotion.
    let learned = { ...localAliases };
    rows.forEach(r => {
      if ((r.status === 'matched' || r.status === 'needsPrice') && r.accept && r.ingredientId) {
        // UPGRADE #3: remember which store this ingredient came from.
        // UPGRADE #5 (merge polish): a consolidated row learns PER PART, so
        // "YELLOW ONION" and "ONIONS YLW JUMBO" each keep their own alias,
        // pack size, and store fact even though they committed as one price.
        for (const part of (r.parts || [r])) {
          if (part.norm && plan && plan.store) learned = learnStoreFact(learned, part.norm, r.ingredientId, plan.store);
          learned = learnFromAcceptance({ ...part, ingredientId: r.ingredientId, perUnit: part.perUnit > 0 ? part.perUnit : effectivePerUnit(r) }, learned,
            { rejectedId: r._rejectedId || null, usedFlatPrice: !!r._usedFlat });
        }
      }
    });
    // v3.4 learned auto-ignore: items Kevin left unmapped count a sighting;
    // after 3 receipts the classifier stops asking about them.
    const unmappedNorms = rows
      .filter(r => r.status === 'unmatched' && !r.ingredientId)
      .map(r => normalizeIngredientName(r.line.item_name));
    if (unmappedNorms.length) learned = learnFromIgnores(unmappedNorms, learned);
    onSaveAliases(learned);
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
            {!showPaste && (
              <button style={{ ...S.captureBtn, background: 'transparent', border: '1px dashed #3a4040', marginTop: 8 }} onClick={() => setShowPaste(true)}>
                Or paste receipt text (no AI needed)
              </button>
            )}
            {showPaste && (
              <div style={{ marginTop: 8 }}>
                <textarea
                  style={{ width: '100%', minHeight: 140, boxSizing: 'border-box', background: '#1e2422', color: '#e8ede9', border: '1px solid #3a4040', borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'monospace' }}
                  placeholder={'Paste the receipt text here — H-E-B or H-Mart format.'}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                />
                <button style={{ ...S.captureBtn, marginTop: 6 }} onClick={onPaste} disabled={!pasteText.trim()}>
                  Read pasted receipt
                </button>
              </div>
            )}
            {err && <div style={S.error}>{err}</div>}
          </div>
        )}

        {stage === 'extracting' && (
          <div style={S.center}>
            {imgB64 && <img src={`data:image/jpeg;base64,${imgB64}`} alt="receipt" style={S.thumb} />}
            <div style={S.spinner}>Reading the receipt…</div>
          </div>
        )}

        {stage === 'debug' && (
          <div style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Debug scan result</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
              This is the raw extraction plus the per-line derivation and the plan. Nothing was committed. Download the JSON file and attach it in the chat (the file is the reliable way to share it), or copy the text.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                style={{ ...S.scanBtn, flex: 1, marginBottom: 0, background: '#12303a', border: '1px solid #4c9cc9', color: '#a8dbe8' }}
                onClick={() => {
                  try {
                    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                    const blob = new Blob([debugText], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ltb-receipt-scan-${stamp}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    setDownloaded(true); setTimeout(() => setDownloaded(false), 2000);
                  } catch (_) { /* fall back to copy/select */ }
                }}
              >
                {downloaded ? 'Downloaded ✓' : 'Download JSON'}
              </button>
              <button
                style={{ ...S.scanBtn, flex: 1, marginBottom: 0 }}
                onClick={async () => {
                  try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      await navigator.clipboard.writeText(debugText);
                    } else {
                      const ta = document.getElementById('debug-scan-dump');
                      if (ta) { ta.select(); document.execCommand('copy'); }
                    }
                    setCopied(true); setTimeout(() => setCopied(false), 2000);
                  } catch (_) { /* fall back to manual select */ }
                }}
              >
                {copied ? 'Copied ✓' : 'Copy text'}
              </button>
            </div>
            <textarea
              id="debug-scan-dump"
              readOnly
              value={debugText}
              onFocus={e => e.target.select()}
              style={{ width: '100%', minHeight: 320, fontFamily: 'monospace', fontSize: 11, whiteSpace: 'pre', background: '#111', color: '#ddd', border: '1px solid #333', borderRadius: 6, padding: 8, boxSizing: 'border-box' }}
            />
          </div>
        )}

        {stage === 'review' && plan && (
          <ReviewBody
            plan={plan} rows={rows} seed={seed} costHistory={costHistory}
            patchRow={patchRow}
            onOpenPicker={(idx) => setPicker({ rowIdx: idx })}
            onUseFlatPrice={useFlatPrice}
            recon={recon}
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
function ReviewBody({ plan, rows, seed, patchRow, onOpenPicker, onUseFlatPrice, acceptedCount, onCommit, costHistory, recon }) {
  const matched = rows.map((r, i) => ({ r, i })).filter(x => x.r.status === 'matched');
  const needs = rows.map((r, i) => ({ r, i })).filter(x => x.r.status === 'needsPrice');
  const unmatched = rows.map((r, i) => ({ r, i })).filter(x => x.r.status === 'unmatched');
  const ignored = rows.map((r, i) => ({ r, i })).filter(x => x.r.status === 'ignored');

  return (
    <div>
      {recon && (
        <div style={{
          fontSize: 12, lineHeight: 1.45, padding: '8px 10px', borderRadius: 8, marginBottom: 10,
          background: recon.ok ? 'rgba(93,202,165,0.10)' : 'rgba(239,159,39,0.12)',
          border: `1px solid ${recon.ok ? '#28483d' : '#4a3a1e'}`,
          color: recon.ok ? '#5DCAA5' : '#EF9F27',
        }}>
          {recon.ok
            ? `Lines sum to ${currency(recon.linesSum)} — matches the receipt ${recon.printedKind} (${currency(recon.printed)}).`
            : `Lines sum to ${currency(recon.linesSum)} but the receipt ${recon.printedKind} is ${currency(recon.printed)} (gap ${currency(Math.abs(recon.gap))}). Small gaps come from discounts or skipped non-food lines; a big gap means an item line wasn't recognized.`}
        </div>
      )}
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
          {[...matched].sort((a, b) => (TIER_ORDER[a.r.tier] ?? 1) - (TIER_ORDER[b.r.tier] ?? 1)).map(({ r, i }) => <MatchedRow key={i} r={r} idx={i} patchRow={patchRow} onOpenPicker={onOpenPicker} costHistory={costHistory} seed={seed} />)}
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
function MatchedRow({ r, idx, patchRow, onOpenPicker, costHistory, seed }) {
  const ing = r.ingredient;
  const cur = ing ? ing.current : null;
  const implied = effectivePerUnit(r);
  const mismatchRisk = r.basis === 'line_total'; // box-vs-stick guard
  // v3.3 drift intelligence: big move vs recent buys + margin blast radius
  const drift = useMemo(() => (r.ingredientId && implied > 0 && seed)
    ? priceDriftReport(r.ingredientId, implied, costHistory || [], seed)
    : null, [r.ingredientId, implied, costHistory, seed]);
  return (
    <div style={{ ...S.row, ...(r.accept ? S.rowOn : {}) }}>
      <div style={S.rowTop}>
        <div style={S.rowName}>
          {r.line.item_name}{r.count > 1 ? ` ×${r.count}` : ''}
          {r.tier === 'auto' && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: TEAL_LIGHT, border: `1px solid ${TEAL_LIGHT}`, borderRadius: 6, padding: '1px 5px' }}>auto</span>}
          {r.mergedFrom && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 6, padding: '1px 5px' }}>merged ×{r.mergedFrom.length}</span>}
        </div>
        <button style={S.acceptToggle(r.accept)} onClick={() => patchRow(idx, { accept: !r.accept })}>
          {r.accept ? <Check size={15} /> : null}
        </button>
      </div>
      <div style={S.mapLine}>
        → {ing ? ing.name : '—'} <button style={S.linkBtn} onClick={() => onOpenPicker(idx)}>change</button>
      </div>
      {r.weightSuggestion && !r.accept && (
        <div style={{ fontSize: 12, color: '#EF9F27', margin: '4px 0 2px', lineHeight: 1.4 }}>
          No weight printed. At your current {currency(r.weightSuggestion.atPrice)}/lb this is ≈{r.weightSuggestion.lb} lb.{' '}
          <button
            style={{ ...S.linkBtn, color: '#5DCAA5', fontWeight: 700 }}
            onClick={() => patchRow(idx, { perUnit: r.weightSuggestion.atPrice, basis: 'inferred_weight', accept: true, acceptedPerUnit: r.weightSuggestion.atPrice })}
          >
            Accept (price unchanged)
          </button>
          {' '}or edit the price if you have the actual weight.
        </div>
      )}
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
      {r.mergedFrom && (
        <div style={{ fontSize: 11, color: GOLD, marginTop: 3 }}>
          Merged {r.mergedFrom.length} receipt lines for this ingredient ({r.mergedFrom.join(' + ')}); price pooled by quantity.
        </div>
      )}
      {r.priceSplit && (
        <div style={{ fontSize: 11, color: RED, marginTop: 3 }}>
          ⚠ Another line matched this ingredient at ${'{'}r.priceSplit.other{'}'} per unit — kept separate because the prices disagree. One may be a misparse.
        </div>
      )}
      {r.packShift && (
        <div style={{ background: '#3a2420', border: '1px solid #5a3a2a', borderRadius: 8, padding: '7px 9px', margin: '6px 0', fontSize: 12, color: '#EF9F27' }}>
          ⚠ {r.packShift.message}
        </div>
      )}
      {r.offStore && (
        <div style={{ fontSize: 11.5, color: '#9aa5a0', margin: '4px 0' }}>
          {r.offStore.message}
        </div>
      )}
      {mismatchRisk && (
        <div style={S.warn}>
          Receipt gives a line total ({currency(r.line.line_total)}
      {drift && (
        <div style={{ background: drift.pctChange > 0 ? '#3a2a20' : '#1c2e28', border: '1px solid #4a3a2a', borderRadius: 8, padding: '7px 9px', margin: '6px 0', fontSize: 12, color: drift.pctChange > 0 ? '#EF9F27' : '#1D9E75' }}>
          {drift.pctChange > 0 ? '▲' : '▼'} {Math.abs(drift.pctChange)}% vs your recent buys (avg {currency(drift.prevAvg)}).
          {drift.dishesUnderFloor.length > 0 && (
            <div style={{ marginTop: 4, color: '#e8ede9' }}>
              Pushes under your margin floor: {drift.dishesUnderFloor.slice(0, 3).join(' · ')}{drift.dishesUnderFloor.length > 3 ? ` +${drift.dishesUnderFloor.length - 3} more` : ''}
            </div>
          )}
        </div>
      )}), not a per-{ing ? ing.unit : 'unit'} price. Confirm this equals one {ing ? ing.unit : 'unit'}, or edit below.
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
