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
  optionsSummary, noteWithoutOptions, itemAddons,
} from '../utils.js';
import { TEAL_DARK, TEAL_MID, TEAL_LIGHT, GOLD, CREAM, DARK, CARD, styles } from '../styles.js';

// Pre-weigh estimate for a per-lb sous-vide item: avgWeightLb × pricePerLb plus
// the flat $1.50 bag fee, matching exactly how WeightPhotoModal prices the
// real charge (pricePerLb × weight + 1.5). Shown IN PLACE OF a bare "pending"
// so a non-final invoice reads as a real number. Returns null when the item
// isn't a per-lb item or has no avgWeightLb to estimate from. `qty` scales it
// like every other line. This is a display estimate only — the true number
// from repricePerLbItem replaces it the moment a weight is entered.
const LB_BAG_FEE = 1.5;
export function perLbEstimate(name, qty = 1) {
  const info = PER_LB_ITEMS[name];
  if (!info || !(info.avgWeightLb > 0) || !(info.pricePerLb > 0)) return null;
  const per = info.avgWeightLb * info.pricePerLb + LB_BAG_FEE;
  return Math.round(per * (qty || 1) * 100) / 100;
}

export function InvoiceModal({ order, onClose }) {
  const disc = discountAmount(itemsBaseTotal(order.items), order.discountType, order.discountValue);
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  // Detect unweighed sous-vide proteins: per-lb items with no weight set yet.
  // When any exist, the invoice total isn't final and we warn in three places.
  const unweighedItems = (order.items || []).filter(it => isPerLbItem(it.name) && !(it.weight > 0));
  const hasUnweighed = unweighedItems.length > 0;

  const [sharing, setSharing] = useState(false);
  const cardRef = React.useRef(null);

  // Share the invoice as an image via the iOS/Android native share sheet.
  // Uses html2canvas (loaded from CDN) to rasterize the card, then the Web
  // Share API. Falls back to a friendly message if sharing isn't supported.
  const shareInvoice = async () => {
    setSharing(true);
    try {
      const html2canvas = await loadHtml2Canvas();
      if (!html2canvas || !cardRef.current) {
        setSharing(false);
        alert('Could not prepare the image. You can screenshot the card instead.');
        return;
      }
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (!blob) { setSharing(false); return; }
      const file = new File([blob], `LTB-invoice-${order.customer || 'order'}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        // Fallback: trigger a download of the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // User cancelling the share sheet throws — ignore that quietly
      if (e && e.name !== 'AbortError') {
        alert('Sharing failed: ' + (e.message || 'unknown error') + '. You can screenshot instead.');
      }
    }
    setSharing(false);
  };

  return (
    <div style={styles.invoiceOverlay} onClick={onClose}>
      <div style={styles.invoiceScroll} onClick={e => e.stopPropagation()}>
        {/* The card itself — sized to fit one iPhone screen for a clean screenshot */}
        <div style={styles.invoiceCard} ref={cardRef}>
          <div style={styles.invoiceHeader}>
            <div style={styles.invoiceLogo}>LTB</div>
            <div>
              <div style={styles.invoiceBrand}>Lettuce, Turnip, The Beet</div>
              <div style={styles.invoiceTagline}>meal prep, delivered fresh</div>
            </div>
          </div>

          {hasUnweighed && (
            <div style={styles.invoiceNotFinalBanner}>
              NOT FINAL — total will increase once protein weights are added
            </div>
          )}

          <div style={styles.invoiceMeta}>
            <span style={styles.invoiceCustomer}>{order.customer}</span>
            {dateStr && <span style={styles.invoiceDate}>{dateStr}</span>}
          </div>

          <div style={styles.invoiceDivider} />

          <div style={styles.invoiceItems}>
            {(order.items || []).map((it, idx) => {
              const up = it.upcharge && it.upcharge.amount ? it.upcharge.amount : 0;
              const lineTotal = (it.price + up) * it.qty;
              const itemUnweighed = isPerLbItem(it.name) && !(it.weight > 0);
              const isLb = isPerLbItem(it.name) && it.weight > 0;
              const lbBasePrice = isLb ? round2((it.price - 1.5) * it.qty) : null;
              const est = itemUnweighed ? perLbEstimate(it.name, it.qty) : null;
              return (
                <div key={idx} style={styles.invoiceItemBlock}>
                  <div style={styles.invoiceItemLine}>
                    <span style={styles.invoiceItemName}>
                      {it.qty}&times; {it.name}
                    </span>
                    <span style={styles.invoiceItemPrice}>
                      {itemUnweighed
                        ? (est != null
                            ? <span style={styles.invoiceItemEst}>~{currency(est)}<span style={styles.invoiceEstTag}>est</span></span>
                            : 'TBD')
                        : currency(lineTotal)}
                    </span>
                  </div>
                  <div style={styles.invoiceItemVariant}>{isLb ? `${it.weight} lb` : it.variant}</div>
                  {isLb && (
                    <div style={styles.invoiceItemExtra}>
                      {currency(lbBasePrice)} meat + $1.50 bag &amp; seasonings
                    </div>
                  )}
                  {itemUnweighed && (
                    <div style={styles.invoiceItemPending}>
                      {est != null ? 'estimate — final on weigh-in' : 'weight not set — price pending'}
                    </div>
                  )}
                  {it.upcharge && typeof it.upcharge === 'object' && it.upcharge.amount > 0 ? (
                    <div style={styles.invoiceItemExtra}>+ {it.upcharge.label} ({currency(it.upcharge.amount)} ea)</div>
                  ) : null}
                  {/* At-cost extras (a block of parm, chili fixings). These already
                      counted toward the total via itemAddonsTotal, but the invoice
                      never showed them, so the math looked right and unexplained.
                      Pending ones are shown too: a customer should see that they
                      asked for something, even before it has a price. */}
                  {itemAddons(it).map(a => (
                    <div key={a.id} style={styles.invoiceItemExtra}>
                      + {a.request} {a.pending ? '(price pending)' : '(' + currency(a.cost) + ', at cost)'}
                    </div>
                  ))}
                  {optionsSummary(it) && <div style={styles.invoiceItemExtra}>{optionsSummary(it)}</div>}
                  {noteWithoutOptions(it.note) && <div style={styles.invoiceItemNote}>"{noteWithoutOptions(it.note)}"</div>}
                  {it.omakase && it.underNote ? (
                    <div style={styles.invoiceItemExtra}>Came in under: {it.underNote}</div>
                  ) : null}
                  {it.omakase && it.budgetMax != null && it.price < it.budgetMax ? (
                    <div style={styles.invoiceItemExtra}>(your max was {currency(it.budgetMax)})</div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div style={styles.invoiceDivider} />

          <div style={styles.invoiceTotals}>
            {disc > 0 && (
              <div style={styles.invoiceTotalRow}>
                <span style={{ color: '#C0517A' }}>Discount{order.discountType === 'percent' ? ` (${order.discountValue}%)` : ''}</span>
                <span style={{ color: '#C0517A' }}>−{currency(disc)}</span>
              </div>
            )}
            {(order.customCharges || []).map(ch => (
              <div key={ch.id} style={styles.invoiceTotalRow}>
                <span>{ch.label}</span>
                <span>{currency(Number(ch.amount) || 0)}</span>
              </div>
            ))}
            {!order.waiveSurcharge && (
              <div style={styles.invoiceTotalRow}>
                <span>Order surcharge</span>
                <span>{currency(SURCHARGE)}</span>
              </div>
            )}
            {order.jarSwaps > 0 && (
              <div style={styles.invoiceTotalRow}>
                <span>Jar swap x{order.jarSwaps}</span>
                <span>−{currency(order.jarSwaps * 2)}</span>
              </div>
            )}
            {order.containerReturns > 0 && (
              <div style={styles.invoiceTotalRow}>
                <span>Containers returned x{order.containerReturns}</span>
                <span>−{currency(order.containerReturns)}</span>
              </div>
            )}
          </div>

          <div style={styles.invoiceGrandTotal}>
            <span>Total{hasUnweighed ? ' (so far)' : ''}</span>
            <span style={styles.invoiceGrandValue}>{currency(order.total)}</span>
          </div>
          {hasUnweighed && (
            <div style={styles.invoiceTotalPendingNote}>
              This total will go up once the {unweighedItems.length} weighed item{unweighedItems.length !== 1 ? 's are' : ' is'} measured.
            </div>
          )}

          {order.notes && <div style={styles.invoiceNotes}>{order.notes}</div>}

          <div style={styles.invoiceFooter}>All prices all-in. Thanks for the order!</div>
        </div>

        <button style={styles.invoiceShareBtn} onClick={shareInvoice} disabled={sharing}>
          {sharing ? 'Preparing…' : 'Share invoice'}
        </button>
        <button style={styles.invoiceClose} onClick={onClose}>
          Done
        </button>
        <div style={styles.invoiceHint}>Share sends the card as an image, or screenshot it.</div>
      </div>
    </div>
  );
}

// ─── Reheat instructions card (shareable image, mirrors the invoice) ────────
export function ReheatModal({ order, onClose }) {
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  const blocks = useMemo(() => buildReheatBlocks(order), [order]);
  const [sharing, setSharing] = useState(false);
  const cardRef = React.useRef(null);

  const shareReheat = async () => {
    setSharing(true);
    try {
      const html2canvas = await loadHtml2Canvas();
      if (!html2canvas || !cardRef.current) {
        setSharing(false);
        alert('Could not prepare the image. You can screenshot the card instead.');
        return;
      }
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (!blob) { setSharing(false); return; }
      const file = new File([blob], `LTB-reheat-${order.customer || 'order'}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      if (e && e.name !== 'AbortError') {
        alert('Sharing failed: ' + (e.message || 'unknown error') + '. You can screenshot instead.');
      }
    }
    setSharing(false);
  };

  return (
    <div style={styles.invoiceOverlay} onClick={onClose}>
      <div style={styles.invoiceScroll} onClick={e => e.stopPropagation()}>
        <div style={styles.invoiceCard} ref={cardRef}>
          <div style={styles.invoiceHeader}>
            <div style={styles.invoiceLogo}>LTB</div>
            <div>
              <div style={styles.invoiceBrand}>Lettuce, Turnip, The Beet</div>
              <div style={styles.reheatSubhead}>Reheat Instructions</div>
            </div>
          </div>

          <div style={styles.invoiceMeta}>
            <span style={styles.invoiceCustomer}>{order.customer}</span>
            {dateStr && <span style={styles.invoiceDate}>{dateStr}</span>}
          </div>

          <div style={styles.invoiceDivider} />

          <div style={styles.reheatBlocks}>
            {blocks.map((b, idx) => (
              <div key={idx} style={styles.reheatBlock}>
                <div style={styles.reheatDishes}>
                  {b.dishes.join(', ')}
                </div>
                {Array.isArray(b.body)
                  ? b.body.map((p, pi) => (
                      <div key={pi} style={{ ...styles.reheatBody, ...(pi > 0 ? { marginTop: 8 } : {}) }}>{p}</div>
                    ))
                  : <div style={styles.reheatBody}>{b.body}</div>}
              </div>
            ))}
          </div>

          <div style={styles.invoiceFooter}>Cooked ahead, finished by you. Enjoy!</div>
        </div>

        <button style={styles.invoiceShareBtn} onClick={shareReheat} disabled={sharing}>
          {sharing ? 'Preparing…' : 'Share instructions'}
        </button>
        <button style={styles.invoiceClose} onClick={onClose}>
          Done
        </button>
        <div style={styles.invoiceHint}>Share sends the card as an image, or screenshot it.</div>
      </div>
    </div>
  );
}

// ─── Weight + scale-photo popup for a single sous-vide protein ──────────────
export function WeightPhotoModal({ orderId, itemIdx, item, stepLabel, onApply, onClose }) {
  const [weight, setWeight] = useState(item.weight > 0 ? String(item.weight) : '');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Load any previously-saved photo for this item
  useEffect(() => {
    let live = true;
    if (item.hasPhoto) {
      loadPhoto(orderId, itemIdx).then(d => { if (live && d) setExistingPhoto(d); });
    }
    return () => { live = false; };
  }, [orderId, itemIdx]); // eslint-disable-line

  const info = PER_LB_ITEMS[item.name] || { pricePerLb: 0, costPerLb: 0 };
  const w = parseFloat(weight);
  const livePrice = w > 0 ? round2(info.pricePerLb * w + 1.5) : null;

  const onPickPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setErr('');
    setBusy(true);
    try {
      // Compress hard: scale photos only need to be legible, not high-res
      const b64 = await fileToJpegBase64(file, 900, 0.6);
      setPhotoBase64(b64);
    } catch (e2) {
      setErr('Could not read that image. Try another.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!(w > 0)) return;
    setBusy(true);
    await onApply(itemIdx, Math.round(w * 100) / 100, photoBase64);
    setBusy(false);
    // onApply handles advancing/closing for the walk; close here for single
    if (!stepLabel) onClose();
  };

  const shownPhoto = photoBase64
    ? `data:image/jpeg;base64,${photoBase64}`
    : existingPhoto
      ? `data:image/jpeg;base64,${existingPhoto}`
      : null;

  return (
    <div style={styles.invoiceOverlay} onClick={onClose}>
      <div style={styles.weightModalCard} onClick={e => e.stopPropagation()}>
        <div style={styles.reviewModalHeader}>
          <div>
            <div style={styles.reviewModalTitle}>{item.name}</div>
            {stepLabel && <div style={styles.weightStepLabel}>{stepLabel}</div>}
          </div>
          <button style={styles.iconBtn} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {item.note && <div style={styles.weightIntentNote}>Customer asked: {item.note}</div>}

        <label style={styles.miniLabel}>Actual weight (lb) — {currency(info.pricePerLb)}/lb + $1.50 bag</label>
        <input
          style={styles.input}
          type="number"
          inputMode="decimal"
          placeholder="e.g. 0.5"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          autoFocus
        />
        {livePrice !== null && (
          <div style={styles.weightPriceHint}>= {currency(livePrice)} each</div>
        )}

        <label style={{ ...styles.miniLabel, marginTop: '14px' }}>Proof photo (optional) — item on the scale</label>
        {shownPhoto ? (
          <div style={styles.photoPreviewWrap}>
            <img src={shownPhoto} alt="scale" style={styles.photoPreview} />
            <button style={styles.photoRemoveBtn} onClick={() => { setPhotoBase64(null); setExistingPhoto(null); }}>
              <X size={13} /> Remove
            </button>
          </div>
        ) : (
          <label style={styles.photoUploadBtn}>
            <ImageIcon size={15} />
            {busy ? 'Working…' : 'Add scale photo'}
            <input type="file" accept="image/*" onChange={onPickPhoto} style={{ display: 'none' }} />
          </label>
        )}
        {err && <div style={styles.parseError}>{err}</div>}
        <div style={styles.weightModalHint}>Photos are compressed, saved to this order, and auto-deleted after a month.</div>

        <button
          style={{ ...styles.saveBtn, marginTop: '14px', ...(w > 0 && !busy ? {} : styles.saveBtnDisabled) }}
          onClick={submit}
          disabled={!(w > 0) || busy}
        >
          {stepLabel ? 'Save & next' : 'Save weight'}
        </button>
      </div>
    </div>
  );
}

// ─── Order Card ─────────────────────────────────────────────────────────────
