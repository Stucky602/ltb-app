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
  menuForPrompt, fileToJpegBase64, parseOrderText, validateParsedOrder, parseAmendment, diffOrders,
  parseFormRow, parseDelimited, rowToOrderText, parseFormNotes,
} from '../utils.js';
import { TEAL_DARK, TEAL_MID, TEAL_LIGHT, GOLD, CREAM, DARK, CARD, styles } from '../styles.js';

export function StatsBar({ stats }) {
  return (
    <div style={styles.statsBar}>
      <div style={styles.statTile}>
        <div style={styles.statValue}>{stats.active}</div>
        <div style={styles.statLabel}>Active</div>
      </div>
      <div style={styles.statTile}>
        <div style={styles.statValue}>{currency(stats.booked)}</div>
        <div style={styles.statLabel}>This week</div>
      </div>
      <div style={styles.statTile}>
        <div style={{ ...styles.statValue, ...(stats.unpaid > 0 ? { color: '#EF9F27' } : {}) }}>
          {currency(stats.unpaid)}
        </div>
        <div style={styles.statLabel}>Unpaid</div>
      </div>
    </div>
  );
}

// ─── Shared Quantity Control ────────────────────────────────────────────────
export function QtyControl({ value, onChange, min = 0 }) {
  return (
    <div style={styles.qtyControl} onClick={e => e.stopPropagation()}>
      <button style={styles.qtyBtn} onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease">−</button>
      <span style={styles.qtyValue}>{value}</span>
      <button style={styles.qtyBtn} onClick={() => onChange(value + 1)} aria-label="Increase">+</button>
    </div>
  );
}

// ─── Paste-a-text order intake ──────────────────────────────────────────────
// ─── Google Form CSV → order object (no AI needed) ───────────────────────────
export function PasteOrderCard({ menu, onParsed, onCancel }) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  const canParse = !!text.trim() || !!imageFile;

  const onPickImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setImageFile(file);
    e.target.value = ''; // allow re-picking the same file
  };

  const parse = async () => {
    if (!canParse) return;
    setParsing(true);
    setParseError(null);

    // Step 1: read/convert the photo (most common failure point on iPhone)
    let imageBase64 = null;
    if (imageFile) {
      try {
        imageBase64 = await fileToJpegBase64(imageFile);
      } catch (e) {
        setParseError("Couldn't read the photo file. If it's a photo from your camera roll (HEIC), try taking a screenshot of it and attaching that instead.");
        setParsing(false);
        return;
      }
    }

    // Step 2: send to the parser
    try {
      const draft = await parseOrderText(text.trim(), imageBase64, menu);
      if (draft.items.length === 0 && !draft.notes) {
        setParseError("Couldn't find any menu items in that. Add the order manually?");
        setParsing(false);
        return;
      }
      onParsed(draft); // opens the order form pre-filled; name still required
    } catch (e) {
      const msg = (e && e.message) || '';
      // Empty 200 with an image attached = the artifact AI platform doesn't
      // currently process images (text-only). Say so honestly.
      if (msg === 'OUT_OF_CREDITS') {
        setParseError("Out of Anthropic API credits — top up at console.anthropic.com to restore AI parsing. You can still add orders manually in the meantime.");
      } else if (imageBase64 && msg.startsWith('Non-JSON response (HTTP 200)')) {
        setParseError("Claude's artifact platform doesn't support reading photos yet (text works fine). Type the circled items into the text box instead — the photo button will start working if Anthropic enables image support.");
      } else {
        const detail = msg ? ` (${msg})` : '';
        setParseError(`Couldn't process that${detail}. Try again, or add the order manually.`);
      }
      setParsing(false);
    }
  };

  return (
    <div style={styles.formCard}>
      <div style={styles.formHeader}>
        <div style={styles.formTitle}>Paste a customer order</div>
        <button style={styles.iconBtn} onClick={onCancel} aria-label="Cancel">
          <X size={18} />
        </button>
      </div>
      <div style={styles.pasteHint}>
        Paste their text and I'll match it to the current menu and pre-fill the order — you just add their name and double-check. Items from an old menu get flagged in notes instead of guessed. (Photo reading is built in but waiting on platform support — text is the reliable path.)
      </div>
      <textarea
        style={{ ...styles.textarea, minHeight: '90px' }}
        placeholder={'e.g. "Hey! Can I get a large mushroom noodles, 2 quesos (will return one jar), and a pineapple?"'}
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div style={styles.attachRow}>
        <label style={styles.attachBtn}>
          <ImageIcon size={15} />
          {imageFile ? 'Change photo' : 'Attach a photo'}
          <input type="file" accept="image/*" onChange={onPickImage} style={{ display: 'none' }} />
        </label>
        {imageFile && (
          <div style={styles.attachChip}>
            <span style={styles.attachName}>{imageFile.name || 'photo'}</span>
            <button style={styles.iconBtn} onClick={() => setImageFile(null)} aria-label="Remove photo">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      {parseError && <div style={styles.parseError}>{parseError}</div>}
      <button
        style={{ ...styles.saveBtn, ...((!canParse || parsing) ? styles.saveBtnDisabled : {}) }}
        onClick={parse}
        disabled={!canParse || parsing}
      >
        {parsing ? (imageFile ? 'Reading the photo...' : 'Reading order...') : 'Build the order'}
      </button>
    </div>
  );
}

// ─── Amend an existing order from a follow-up text ──────────────────────────
export function AmendOrderCard({ menu, orders, onAmended, onCancel }) {
  const [selectedId, setSelectedId] = useState(orders.length === 1 ? orders[0].id : '');
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  // Batch 4: an amendment MUTATES an existing order — never apply silently.
  // The parse result is held here as a diff preview until Kevin confirms.
  const [preview, setPreview] = useState(null); // { draft, diff }

  const selectedOrder = orders.find(o => o.id === selectedId) || null;
  const canParse = !!selectedOrder && !!text.trim();

  const parse = async () => {
    if (!canParse) return;
    setParsing(true);
    setParseError(null);
    setPreview(null);
    try {
      const draft = await parseAmendment(selectedOrder, text.trim(), menu);
      if (draft.items.length === 0) {
        setParseError("That left the order with no items. If you meant to clear it, edit the order directly instead.");
        setParsing(false);
        return;
      }
      setPreview({ draft, diff: diffOrders(selectedOrder, draft) });
      setParsing(false);
    } catch (e) {
      const msg = (e && e.message) || '';
      const detail = msg ? ` (${msg})` : '';
      if ((e && e.message) === 'OUT_OF_CREDITS') {
        setParseError("Out of Anthropic API credits — top up at console.anthropic.com to restore AI features.");
      } else {
        setParseError(`Couldn't process that change${detail}. Try again, or edit the order directly.`);
      }
      setParsing(false);
    }
  };

  return (
    <div style={styles.formCard}>
      <div style={styles.formHeader}>
        <div style={styles.formTitle}>Amend an order via text</div>
        <button style={styles.iconBtn} onClick={onCancel} aria-label="Cancel">
          <X size={18} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={styles.pasteHint}>No active orders to amend yet.</div>
      ) : (
        <>
          <div style={styles.pasteHint}>
            Pick the customer's order, paste their follow-up message, and I'll apply the change and open the updated order for you to review before saving.
          </div>

          <label style={styles.label}>Which order?</label>
          <div style={styles.amendOrderPicker}>
            {orders.map(o => (
              <button
                key={o.id}
                style={{ ...styles.amendOrderChip, ...(selectedId === o.id ? styles.amendOrderChipActive : {}) }}
                onClick={() => setSelectedId(o.id)}
              >
                <span style={styles.amendChipName}>{o.customer}</span>
                <span style={styles.amendChipMeta}>
                  {(o.items || []).reduce((s, it) => s + it.qty, 0)} items · {currency(o.total)}
                </span>
              </button>
            ))}
          </div>

          {selectedOrder && (
            <div style={styles.amendCurrentBox}>
              <div style={styles.amendCurrentTitle}>Current order:</div>
              {(selectedOrder.items || []).map((it, i) => (
                <div key={i} style={styles.amendCurrentItem}>
                  {it.qty}× {it.name} <span style={styles.orderItemVariant}>({isPerLbItem(it.name) && it.weight > 0 ? `${it.weight} lb` : it.variant})</span>
                </div>
              ))}
            </div>
          )}

          <label style={styles.label}>Their follow-up message</label>
          <textarea
            style={{ ...styles.textarea, minHeight: '80px' }}
            placeholder={'e.g. "Actually can you make the curry large, and add a dozen cookies?"'}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          {parseError && <div style={styles.parseError}>{parseError}</div>}

          {preview && (
            <div style={styles.amendCurrentBox}>
              <div style={styles.amendCurrentTitle}>What will change:</div>
              {preview.diff.isEmpty && (
                <div style={styles.amendCurrentItem}>No changes detected — the parsed order matches what's there. Open it anyway to edit by hand, or rephrase the message.</div>
              )}
              {preview.diff.added.map((it, i) => (
                <div key={'a' + i} style={{ ...styles.amendCurrentItem, color: '#1D9E75' }}>+ {it.qty}× {it.name} ({it.variant})</div>
              ))}
              {preview.diff.removed.map((it, i) => (
                <div key={'r' + i} style={{ ...styles.amendCurrentItem, color: '#993556' }}>− {it.qty}× {it.name} ({it.variant})</div>
              ))}
              {preview.diff.changed.map((c, i) => (
                <div key={'c' + i} style={{ ...styles.amendCurrentItem, color: '#EF9F27' }}>~ {c.item.name}: {c.deltas.join(', ')}</div>
              ))}
              {preview.diff.extras.map((x, i) => (
                <div key={'x' + i} style={{ ...styles.amendCurrentItem, color: '#EF9F27' }}>~ {x}</div>
              ))}
              {(preview.draft.pendingActions || []).length > 0 && (
                <div style={styles.amendCurrentItem}>+ {preview.draft.pendingActions.length} request{preview.draft.pendingActions.length !== 1 ? 's' : ''} to sort out in review</div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button style={styles.doneItemBtn} onClick={() => onAmended(preview.draft)}>
                  Looks right — open to review
                </button>
                <button style={styles.confirmNo} onClick={() => setPreview(null)}>Cancel</button>
              </div>
            </div>
          )}

          {!preview && (
            <button
              style={{ ...styles.saveBtn, ...((!canParse || parsing) ? styles.saveBtnDisabled : {}) }}
              onClick={parse}
              disabled={!canParse || parsing}
            >
              {parsing ? 'Reading the change...' : 'Preview the change'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Import orders from a Google Sheet / CSV paste ──────────────────────────
export function CsvImportCard({ menu, onImport, onCancel }) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total }
  const [results, setResults] = useState(null); // [{ customer, order, error, raw }]
  const [parseError, setParseError] = useState(null);

  const run = async () => {
    setParseError(null);
    const rows = parseDelimited(text);
    if (rows.length < 2) {
      setParseError('Need a header row plus at least one order row. Copy the rows from your Sheet including the header.');
      return;
    }
    const headers = rows[0].map(h => h.trim());
    const dataRows = rows.slice(1);
    setParsing(true);
    setProgress({ done: 0, total: dataRows.length });

    const out = [];
    for (let r = 0; r < dataRows.length; r++) {
      const cells = dataRows[r];
      const headerMap = {};
      headers.forEach((h, i) => { headerMap[h] = cells[i] || ''; });
      const { customer, text: orderText } = rowToOrderText(headerMap);
      if (!orderText.trim()) {
        setProgress({ done: r + 1, total: dataRows.length });
        continue;
      }
      try {
        const parsed = await parseOrderText(orderText, null, menu);
        // CSV orders save directly (no per-order review modal), so prompted
        // actions fold into reviewReasons — they surface on the row flag and
        // again if the order is opened for editing. Auto-applied results
        // (options/notes) are already executed on the items.
        const foldedReasons = [
          ...(parsed.reviewReasons || []),
          ...(parsed.pendingActions || []).map(a =>
            a.type === 'custom-charge' ? `Custom request: "${a.label}" — price it or skip it`
            : a.type === 'set-option' ? `They asked "${a.source}" — set the spice level on ${(parsed.items[a.itemIdx] || {}).name || 'the item'}`
            : `They asked "${a.text}" on ${(parsed.items[a.itemIdx] || {}).name || 'an item'} — add as a prep note?`),
        ];
        const { pendingActions: _pa, autoApplied: _aa, ...rest } = parsed;
        out.push({
          customer: customer || `Row ${r + 1}`,
          order: { ...rest, reviewReasons: foldedReasons, customer: customer || `Row ${r + 1}` },
          error: null,
        });
      } catch (e) {
        out.push({
          customer: customer || `Row ${r + 1}`,
          order: null,
          error: (e && e.message) || 'parse failed',
        });
      }
      setProgress({ done: r + 1, total: dataRows.length });
    }
    setResults(out);
    setParsing(false);
  };

  const importAll = () => {
    const good = results.filter(r => r.order && r.order.items.length > 0);
    onImport(good.map(r => r.order));
  };

  const goodCount = results ? results.filter(r => r.order && r.order.items.length > 0).length : 0;

  return (
    <div style={styles.formCard}>
      <div style={styles.formHeader}>
        <div style={styles.formTitle}>Import from Google Sheet</div>
        <button style={styles.iconBtn} onClick={onCancel} aria-label="Cancel"><X size={18} /></button>
      </div>

      {!results ? (
        <>
          <div style={styles.pasteHint}>
            In your Google Sheet, select the order rows <strong>including the header row</strong>, copy, and paste below. Each row becomes an order you can review before saving.
          </div>
          <textarea
            style={{ ...styles.textarea, minHeight: '120px', fontSize: '12px' }}
            placeholder={'Paste your copied spreadsheet rows here...'}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          {parseError && <div style={styles.parseError}>{parseError}</div>}
          {parsing && progress && (
            <div style={styles.csvProgress}>Reading orders... {progress.done}/{progress.total}</div>
          )}
          <button
            style={{ ...styles.saveBtn, ...((!text.trim() || parsing) ? styles.saveBtnDisabled : {}) }}
            onClick={run}
            disabled={!text.trim() || parsing}
          >
            {parsing ? 'Reading...' : 'Read orders'}
          </button>
        </>
      ) : (
        <>
          <div style={styles.pasteHint}>
            {goodCount} order{goodCount !== 1 ? 's' : ''} ready to import{results.length - goodCount > 0 ? `, ${results.length - goodCount} with issues` : ''}.
          </div>
          <div style={styles.csvResultsList}>
            {results.map((r, i) => (
              <div key={i} style={styles.csvResultRow}>
                <div style={styles.csvResultName}>{r.customer}</div>
                {r.order && r.order.items.length > 0 ? (
                  <div style={styles.csvResultItems}>
                    {r.order.items.map((it, j) => (
                      <span key={j} style={styles.csvResultItem}>
                        {it.qty}× {it.name}{j < r.order.items.length - 1 ? ',' : ''}
                      </span>
                    ))}
                    {r.order.reviewReasons && r.order.reviewReasons.length > 0 && (
                      <span style={styles.csvResultFlag}> · {r.order.reviewReasons.length} to review</span>
                    )}
                  </div>
                ) : (
                  <div style={styles.csvResultError}>
                    {r.error ? 'Could not read this row' : 'No items matched'}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            style={{ ...styles.saveBtn, ...(goodCount === 0 ? styles.saveBtnDisabled : {}) }}
            onClick={importAll}
            disabled={goodCount === 0}
          >
            Import {goodCount} order{goodCount !== 1 ? 's' : ''}
          </button>
          <button style={styles.csvBackBtn} onClick={() => { setResults(null); setText(''); }}>
            Start over
          </button>
        </>
      )}
    </div>
  );
}

// ─── Review Modal: walk each flagged thing and resolve it inline ─────────────
export function ReviewModal({ reasons, actions = [], items, onApplyNote, onApplyOption, onApplyUpcharge, onApplyWeight, onAddCustomCharge, onResolve, onResolveAction, onClose }) {
  // Unified steps (Batch 4): typed ACTIONS from the intent router first
  // (they execute on approval), then legacy free-text reasons.
  const steps = [
    ...actions.map((a, ai) => ({ kind: 'action', a, ai })),
    ...reasons.map((r, ri) => ({ kind: 'reason', r, ri })),
  ];
  const [idx, setIdx] = useState(0);
  const [resolved, setResolved] = useState({}); // step index -> true

  const total = steps.length;
  const allDone = Object.keys(resolved).length >= total;

  // Try to associate a legacy reason with a specific item by name match
  const matchItem = (reason) => {
    const lower = reason.toLowerCase();
    let best = -1;
    items.forEach((it, i) => {
      if (lower.includes(it.name.toLowerCase())) best = i;
    });
    return best;
  };

  const step = steps[idx];
  const action = step && step.kind === 'action' ? step.a : null;
  const reason = step && step.kind === 'reason' ? step.r : null;
  const itemIdx = action ? (action.itemIdx ?? -1) : (reason ? matchItem(reason) : -1);
  const item = itemIdx >= 0 ? items[itemIdx] : null;

  // Local inputs for the current step
  const [noteInput, setNoteInput] = useState('');
  const [upLabel, setUpLabel] = useState('');
  const [upAmount, setUpAmount] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [chargeLabel, setChargeLabel] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');

  // Reset inputs when moving to a new step
  useEffect(() => {
    setNoteInput(item?.note || '');
    setUpLabel(item?.upcharge?.label || '');
    setUpAmount(item?.upcharge?.amount ? String(item.upcharge.amount) : '');
    setWeightInput(item?.weight ? String(item.weight) : '');
    setChargeLabel('');
    setChargeAmount('');
  }, [idx]); // eslint-disable-line

  const markResolved = () => {
    setResolved(prev => ({ ...prev, [idx]: true }));
    if (step.kind === 'action') { if (onResolveAction) onResolveAction(step.ai); }
    else onResolve(step.ri);
    // advance to next unresolved
    const next = steps.findIndex((_, i) => i !== idx && !resolved[i]);
    if (next >= 0) setIdx(next);
  };

  const isWeightReason = /weight/i.test(reason || '');
  const isUpchargeReason = /price for|upcharge/i.test(reason || '');
  const isMatchReason = /match|menu/i.test(reason || '');

  return (
    <div style={styles.invoiceOverlay} onClick={onClose}>
      <div style={styles.reviewModalCard} onClick={e => e.stopPropagation()}>
        <div style={styles.reviewModalHeader}>
          <div style={styles.reviewModalTitle}>Let's sort this out</div>
          <button style={styles.iconBtn} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div style={styles.reviewProgress}>{Object.keys(resolved).length} of {total} handled</div>

        {!allDone && action && (
          <div style={styles.reviewStep}>
            {/* Vague spice ask — one-tap level buttons, straight to the item */}
            {action.type === 'set-option' && action.key === 'spice' && (
              <>
                <div style={styles.reviewReasonBox}>They asked: “{action.source}” — set the spice level on {item ? item.name : 'this item'}?</div>
                <div style={{ display: 'flex', gap: '6px', margin: '10px 0' }}>
                  {Array.from({ length: (action.max || 5) - (action.min || 1) + 1 }, (_, i) => (action.min || 1) + i).map(level => (
                    <button
                      key={level}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        background: level === action.suggest ? '#1D9E75' : '#2a2f2d',
                        color: level === action.suggest ? '#1a1a1a' : '#c8cfc9',
                        fontWeight: 700, fontSize: '15px',
                      }}
                      onClick={() => { onApplyOption(action.itemIdx, 'spice', level); markResolved(); }}
                    >{level}</button>
                  ))}
                </div>
                <button style={styles.reviewSkipBtn || styles.confirmNo} onClick={markResolved}>Skip</button>
              </>
            )}

            {/* Tier 2: option-ish ask on a dish without that option — propose a prep note */}
            {action.type === 'add-item-note' && (
              <>
                <div style={styles.reviewReasonBox}>
                  {item ? item.name : 'This dish'} has no {action.tier2 === 'pasta' ? 'pasta' : 'spice'} setting, but I can add a prep note “{action.text}” to it. Do that?
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    style={styles.doneItemBtn}
                    onClick={() => {
                      onApplyNote(action.itemIdx, [item && item.note, action.text].filter(Boolean).join('. '));
                      markResolved();
                    }}
                  >Add the note</button>
                  <button style={styles.confirmNo} onClick={markResolved}>Skip</button>
                </div>
              </>
            )}

            {/* Billable service ask — custom charge with Kevin-set price */}
            {action.type === 'custom-charge' && (
              <>
                <div style={styles.reviewReasonBox}>Custom request: “{action.label}” — add it as a line item?</div>
                <div style={styles.upchargeRow}>
                  <input
                    style={{ ...styles.input, flex: 2, marginTop: 0 }}
                    value={chargeLabel || action.label}
                    onChange={e => setChargeLabel(e.target.value)}
                  />
                  <input
                    style={{ ...styles.input, flex: 1, marginTop: 0 }}
                    type="number"
                    inputMode="decimal"
                    placeholder="$"
                    value={chargeAmount}
                    onChange={e => setChargeAmount(e.target.value)}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    style={{ ...styles.doneItemBtn, ...(parseFloat(chargeAmount) > 0 ? {} : styles.saveBtnDisabled) }}
                    disabled={!(parseFloat(chargeAmount) > 0)}
                    onClick={() => { onAddCustomCharge(chargeLabel || action.label, parseFloat(chargeAmount)); markResolved(); }}
                  >Add charge</button>
                  <button style={styles.confirmNo} onClick={markResolved}>Skip</button>
                </div>
              </>
            )}
          </div>
        )}

        {!allDone && reason && (
          <div style={styles.reviewStep}>
            <div style={styles.reviewReasonBox}>{reason}</div>
            {item && (
              <div style={styles.reviewItemContext}>
                On: <strong>{item.qty}&times; {item.name}</strong> ({item.variant})
              </div>
            )}

            {/* Weight resolution for per-lb proteins */}
            {isWeightReason && item && (
              <div style={styles.reviewField}>
                <label style={styles.miniLabel}>How many pounds? ({currency(PER_LB_ITEMS[item.name]?.pricePerLb || 0)}/lb + $1.50 bag)</label>
                <input
                  style={styles.input}
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 0.5"
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  autoFocus
                />
                <button
                  style={{ ...styles.doneItemBtn, marginTop: '8px', alignSelf: 'flex-start', ...(parseFloat(weightInput) > 0 ? {} : styles.saveBtnDisabled) }}
                  disabled={!(parseFloat(weightInput) > 0)}
                  onClick={() => { onApplyWeight(itemIdx, weightInput); markResolved(); }}
                >
                  Set weight & price
                </button>
              </div>
            )}

            {/* Upcharge pricing */}
            {isUpchargeReason && item && (
              <div style={styles.reviewField}>
                <label style={styles.miniLabel}>What should this cost?</label>
                <div style={styles.upchargeRow}>
                  <input
                    style={{ ...styles.input, flex: 2, marginTop: 0 }}
                    placeholder="label"
                    value={upLabel}
                    onChange={e => setUpLabel(e.target.value)}
                  />
                  <input
                    style={{ ...styles.input, flex: 1, marginTop: 0 }}
                    type="number"
                    inputMode="decimal"
                    placeholder="$"
                    value={upAmount}
                    onChange={e => setUpAmount(e.target.value)}
                    autoFocus
                  />
                </div>
                <button
                  style={{ ...styles.doneItemBtn, marginTop: '8px', alignSelf: 'flex-start', ...(parseFloat(upAmount) > 0 ? {} : styles.saveBtnDisabled) }}
                  disabled={!(parseFloat(upAmount) > 0)}
                  onClick={() => { onApplyUpcharge(itemIdx, upLabel || 'Upcharge', upAmount); markResolved(); }}
                >
                  Set upcharge
                </button>
              </div>
            )}

            {/* Generic / off-menu / ambiguous: offer note, upcharge, or custom charge */}
            {!isWeightReason && !isUpchargeReason && (
              <div style={styles.reviewField}>
                {item && (
                  <>
                    <label style={styles.miniLabel}>Add a note to this item</label>
                    <input
                      style={styles.input}
                      placeholder="e.g. chili oil on the side"
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                    />
                    <button
                      style={{ ...styles.reviewActionBtn, ...(noteInput.trim() ? {} : styles.saveBtnDisabled) }}
                      disabled={!noteInput.trim()}
                      onClick={() => { onApplyNote(itemIdx, noteInput.trim()); markResolved(); }}
                    >
                      Add note & resolve
                    </button>
                    <div style={styles.reviewOr}>or</div>
                  </>
                )}
                <label style={styles.miniLabel}>Add a custom charge for this request</label>
                <div style={styles.upchargeRow}>
                  <input
                    style={{ ...styles.input, flex: 2, marginTop: 0 }}
                    placeholder="what for?"
                    value={chargeLabel}
                    onChange={e => setChargeLabel(e.target.value)}
                  />
                  <input
                    style={{ ...styles.input, flex: 1, marginTop: 0 }}
                    type="number"
                    inputMode="decimal"
                    placeholder="$"
                    value={chargeAmount}
                    onChange={e => setChargeAmount(e.target.value)}
                  />
                </div>
                <button
                  style={{ ...styles.reviewActionBtn, ...(chargeLabel.trim() && parseFloat(chargeAmount) > 0 ? {} : styles.saveBtnDisabled) }}
                  disabled={!(chargeLabel.trim() && parseFloat(chargeAmount) > 0)}
                  onClick={() => { onAddCustomCharge(chargeLabel.trim(), parseFloat(chargeAmount)); markResolved(); }}
                >
                  Add charge & resolve
                </button>
              </div>
            )}

            <button style={styles.reviewSkipBtn} onClick={markResolved}>
              Nothing needed, mark handled
            </button>

            {total > 1 && (
              <div style={styles.reviewNav}>
                {reasons.map((_, i) => (
                  <button
                    key={i}
                    style={{
                      ...styles.reviewDot,
                      ...(i === idx ? styles.reviewDotActive : {}),
                      ...(resolved[i] ? styles.reviewDotDone : {}),
                    }}
                    onClick={() => setIdx(i)}
                    aria-label={`Item ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {allDone && (
          <div style={styles.reviewDone}>
            <Check size={28} color="#1D9E75" />
            <div style={styles.reviewDoneText}>All sorted. You're good to save.</div>
            <button style={styles.doneItemBtn} onClick={onClose}>Back to order</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Order Form (new + edit + parsed draft) ─────────────────────────────────
