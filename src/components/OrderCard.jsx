import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { companionHtml, companionContext } from '../companion.js';
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
  optionsSummary, noteWithoutOptions,
} from '../utils.js';
import { TEAL_DARK, TEAL_MID, TEAL_LIGHT, GOLD, CREAM, DARK, CARD, styles } from '../styles.js';
import { InvoiceModal, ReheatModal, WeightPhotoModal } from './Modals.jsx';

export function OrderCard({ order, regulars, expanded, onToggle, onUpdate, onDelete, onEdit, onMakeRegular, onLinkRegular }) {
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

  const perLbIdxs = (order.items || [])
    .map((it, i) => (isPerLbItem(it.name) ? i : -1))
    .filter(i => i >= 0);
  const anyPending = perLbIdxs.some(i => order.items[i].weightPending || !(order.items[i].weight > 0));

  // Apply a weight (and optional photo) to one item, then advance if walking
  const applyWeight = async (itemIdx, weight, photoBase64) => {
    const items = order.items.map((it, i) => {
      if (i !== itemIdx) return it;
      const updated = repricePerLbItem({ ...it, weight });
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
          <div style={styles.orderItemsList}>
            {(order.items || []).map((it, idx) => {
              const perLb = isPerLbItem(it.name);
              const pending = perLb && (it.weightPending || !(it.weight > 0));
              const up = it.upcharge && it.upcharge.amount ? it.upcharge.amount : 0;
              const lineTotal = (it.price + up) * it.qty;
              return (
                <div key={idx} style={styles.orderItemBlock}>
                  <div style={styles.orderItemLine}>
                    <span>{it.qty}&times; {it.name} <span style={styles.orderItemVariant}>({perLb && it.weight > 0 ? `${it.weight} lb` : it.variant})</span></span>
                    <span>{pending ? <span style={styles.pendingPrice}>weigh after shopping</span> : currency(lineTotal)}</span>
                  </div>
                  {it.upcharge && typeof it.upcharge === 'object' && it.upcharge.amount > 0 ? (
                    <div style={styles.orderItemSub}>+ {it.upcharge.label} ({currency(it.upcharge.amount)} ea)</div>
                  ) : null}
                  {optionsSummary(it) && <div style={styles.orderItemSub}>{optionsSummary(it)}</div>}
                  {noteWithoutOptions(it.note) && <div style={styles.orderItemNote}>“{noteWithoutOptions(it.note)}”</div>}
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
                  body: JSON.stringify({ token: PUBLISH_TOKEN, id: cid, html: companionHtml(order, cid), context: companionContext(order) }),
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
