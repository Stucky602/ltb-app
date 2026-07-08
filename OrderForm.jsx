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
  itemOptions, noteWithoutOptions,
} from '../utils.js';
import { TEAL_DARK, TEAL_MID, TEAL_LIGHT, GOLD, CREAM, DARK, CARD, styles } from '../styles.js';
import { QtyControl, ReviewModal } from './OrderInputs.jsx';

// ─── Spice level picker (registry-declared; writes item.options.spice) ──────
// Batch 3: options are FIRST-CLASS item fields now, not "Spice: 3" note-regex.
function SpicePicker({ value, min = 1, max = 5, onChange }) {
  const current = Number(value) || null;
  const levels = [];
  for (let l = min; l <= max; l++) levels.push(l);
  return (
    <div>
      <label style={{ fontSize: '11px', color: '#9aa5a0', display: 'block', marginBottom: '4px' }}>Spice level ({min}–{max})</label>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {levels.map(level => (
          <button
            key={level}
            style={{
              flex: 1, padding: '6px 0', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: current === level ? '#1D9E75' : '#2a2f2d',
              color: current === level ? '#1a1a1a' : '#c8cfc9',
              fontWeight: 700, fontSize: '14px',
            }}
            onClick={() => onChange(current === level ? null : level)}
          >{level}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Pasta shape picker (registry-declared; writes item.options.pasta) ──────
function PastaPicker({ value, placeholder, onChange }) {
  return (
    <div>
      <label style={{ fontSize: '11px', color: '#9aa5a0', display: 'block', marginBottom: '4px' }}>Pasta shape</label>
      <input
        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #3a4040', background: '#1e2422', color: '#e8ede9', fontSize: '14px', marginBottom: '8px', boxSizing: 'border-box' }}
        placeholder={placeholder || 'e.g. rigatoni, pappardelle'}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// Which option controls does this item get? Reads the dish's registry-declared
// `options` (via the menu prop) — NEVER a hardcoded dish-name list. An option
// hides when the variant label contains any excludeVariants substring
// (Polenta replaces pasta; Egg Pappardelle IS the pasta).
function itemOptionDefs(menu, it) {
  const dish = ((menu && menu.dinner) || []).find(d => d.name === it.name);
  const defs = (dish && dish.options) || null;
  if (!defs) return null;
  const out = {};
  for (const [key, def] of Object.entries(defs)) {
    const excl = (def && def.excludeVariants) || [];
    if (excl.some(sub => String(it.variant || '').includes(sub))) continue;
    out[key] = def;
  }
  return Object.keys(out).length ? out : null;
}

export function OrderForm({ menu, initial, recentCustomers, regulars, onSave, onCancel }) {
  const isEdit = !!initial?.id;
  const [customer, setCustomer] = useState(initial?.customer || '');
  // Lift legacy note-embedded options ("Spice: 3. ...") into the structured
  // field when editing an old order, so the pickers show the real state and
  // the note stops carrying option text (Batch 3 migration-on-edit).
  const liftLegacyOptions = (arr) => (arr || []).map(it => {
    if (it.options && (it.options.spice || it.options.pasta)) return it;
    const legacy = itemOptions(it);
    if (legacy.spice == null && !legacy.pasta) return it;
    const options = { ...(it.options || {}) };
    if (legacy.spice != null) options.spice = legacy.spice;
    if (legacy.pasta) options.pasta = legacy.pasta;
    const cleaned = noteWithoutOptions(it.note);
    return { ...it, options, note: cleaned || undefined };
  });
  const [items, setItems] = useState(liftLegacyOptions(initial?.items) || []);
  const [jarSwaps, setJarSwaps] = useState(initial?.jarSwaps || 0);
  const [containerReturns, setContainerReturns] = useState(initial?.containerReturns || 0);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [discountType, setDiscountType] = useState(initial?.discountType || null);
  const [discountValue, setDiscountValue] = useState(initial?.discountValue ? String(initial.discountValue) : '');
  const [customCharges, setCustomCharges] = useState(initial?.customCharges || []);
  const [waiveSurcharge, setWaiveSurcharge] = useState(!!initial?.waiveSurcharge);
  const [pickerCategory, setPickerCategory] = useState(null);
  // Review prompts surfaced by the AI parser; dismissible
  const [reviewReasons, setReviewReasons] = useState(initial?.reviewReasons || []);
  // Batch 4: typed actions the router couldn't auto-apply (vague spice,
  // tier-2 prep notes, billable service asks). Resolved one-tap in the
  // ReviewModal; never persisted onto the saved order.
  const [pendingActions, setPendingActions] = useState(initial?.pendingActions || []);
  const dismissAction = (i) => setPendingActions(prev => prev.filter((_, x) => x !== i));
  // What the router already DID from the customer's own words — shown once.
  const [autoApplied, setAutoApplied] = useState(initial?.autoApplied || []);
  const [expandedItem, setExpandedItem] = useState(null); // idx of item whose note/upcharge editor is open
  const [showReview, setShowReview] = useState(false); // conversational review modal

  const discNum = parseFloat(discountValue) || 0;
  const itemsTotal = itemsBaseTotal(items);
  const disc = discountAmount(itemsTotal, discountType, discNum);
  const total = orderTotal(items, jarSwaps, containerReturns, discountType, discNum, customCharges, waiveSurcharge);
  const itemCount = items.reduce((s, it) => s + it.qty, 0);

  const findItemIndex = (category, name, variant) =>
    items.findIndex(i => i.category === category && i.name === name && i.variant === variant.label);

  const addItem = (category, name, variant) => {
    const base = { category, name, variant: variant.label, price: variant.price, cost: variant.cost, costSource: 'snapshot', qty: 1, note: '', upcharge: null };
    if (isPerLbItem(name)) { base.weightPending = true; base.price = 0; base.cost = 0; delete base.costSource; }
    setItems(prev => [...prev, base]);
  };

  const setQty = (idx, qty) => {
    setItems(prev => {
      const next = [...prev];
      if (qty <= 0) next.splice(idx, 1);
      else next[idx] = { ...next[idx], qty };
      return next;
    });
  };

  const setItemNote = (idx, note) => {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, note } : it)));
  };

  // Set/clear one structured option on an item (null clears it; an empty
  // options object is dropped entirely so untouched items stay lean).
  const setItemOption = (idx, key, value) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const options = { ...(it.options || {}) };
      if (value == null || value === '') delete options[key];
      else options[key] = value;
      if (Object.keys(options).length === 0) {
        const { options: _drop, ...rest } = it;
        return rest;
      }
      return { ...it, options };
    }));
  };

  const setItemUpcharge = (idx, label, amount) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      if (!label && !amount) return { ...it, upcharge: null };
      return { ...it, upcharge: { label: label || 'Upcharge', amount: parseFloat(amount) || 0 } };
    }));
  };

  // Set a per-lb protein's weight and reprice it from pricePerLb
  const setItemWeight = (idx, weightStr) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const w = parseFloat(weightStr);
      const updated = { ...it, weight: w > 0 ? w : undefined };
      return isPerLbItem(it.name) && w > 0 ? repricePerLbItem(updated) : updated;
    }));
  };

  // Reprice every per-lb protein in this order from its current weight (post-shopping button)
  const hasPerLbItems = items.some(it => isPerLbItem(it.name));
  const repriceAllSousVide = () => {
    setItems(prev => prev.map(it => (isPerLbItem(it.name) ? repricePerLbItem(it) : it)));
  };

  const addCustomCharge = () => setCustomCharges(prev => [...prev, { id: uid(), label: '', amount: '' }]);
  const updateCustomCharge = (id, field, val) =>
    setCustomCharges(prev => prev.map(ch => (ch.id === id ? { ...ch, [field]: val } : ch)));
  const removeCustomCharge = (id) => setCustomCharges(prev => prev.filter(ch => ch.id !== id));

  const dismissReview = (i) => setReviewReasons(prev => prev.filter((_, idx) => idx !== i));

  const save = () => {
    if (!customer.trim() || items.length === 0) return;
    const cleanCharges = customCharges
      .map(ch => ({ id: ch.id, label: (ch.label || '').trim(), amount: parseFloat(ch.amount) || 0 }))
      .filter(ch => ch.label && ch.amount);
    // Auto-fill address/phone from a matching Regular if not already set
    const matchedReg = (regulars || []).find(r => regularMatchType(r, customer.trim()) !== 'none');
    const address = initial?.address || matchedReg?.address || '';
    const phone = initial?.phone || matchedReg?.phone || '';
    onSave({
      id: initial?.id || uid(),
      customer: customer.trim(),
      address,
      phone,
      items,
      jarSwaps,
      containerReturns,
      notes: notes.trim(),
      discountType: discNum > 0 ? discountType : null,
      discountValue: discNum > 0 ? discNum : 0,
      customCharges: cleanCharges,
      waiveSurcharge,
      total: orderTotal(items, jarSwaps, containerReturns, discountType, discNum, cleanCharges, waiveSurcharge),
      status: initial?.status || 'Ordered',
      paid: initial?.paid || false,
      archived: initial?.archived || false,
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
  };

  const showChips = !isEdit && !customer.trim() && recentCustomers.length > 0;

  // Group items by category once so the picker can show selected counts
  const selectedByCategory = useMemo(() => {
    const counts = {};
    items.forEach(it => { counts[it.category] = (counts[it.category] || 0) + it.qty; });
    return counts;
  }, [items]);

  // Off-menu catalog: every dish in the full catalog that ISN'T on this week's
  // active menu, grouped by its category. Lets manual/edit orders pull in a past
  // dish (e.g. a returning customer who wants last week's pappardelle) as a real
  // line item — so the reheat card, costing, and drift all work — instead of
  // faking it as a custom charge (which has no dish identity, so its reheat
  // toggle never fires). Admin-only by construction: this whole component is the
  // manual order editor; the customer-facing form is a separate file (form.html).
  const offMenu = useMemo(() => {
    const activeNames = new Set();
    Object.keys(menu).forEach(cat => (menu[cat] || []).forEach(it => activeNames.add(cat + '::' + it.name)));
    const out = {};
    Object.keys(FULL_MENU).forEach(cat => {
      const missing = (FULL_MENU[cat] || []).filter(it => !activeNames.has(cat + '::' + it.name));
      if (missing.length) out[cat] = missing;
    });
    return out;
  }, [menu]);
  const offMenuCount = useMemo(
    () => Object.values(offMenu).reduce((n, arr) => n + arr.length, 0),
    [offMenu]
  );
  const [showOffMenu, setShowOffMenu] = useState(false);

  return (
    <div style={styles.formCard}>
      <div style={styles.formHeader}>
        <div style={styles.formTitle}>{isEdit ? `Edit order — ${initial.customer}` : 'New order'}</div>
        <button style={styles.iconBtn} onClick={onCancel} aria-label="Cancel">
          <X size={18} />
        </button>
      </div>

      {autoApplied.length > 0 && (
        <div style={{ ...styles.reviewOpenBtn, background: '#1c2e28', cursor: 'default', alignItems: 'flex-start' }}>
          <Check size={16} color={'#1D9E75'} style={{ marginTop: 2 }} />
          <div style={styles.reviewOpenText}>
            <div style={styles.reviewOpenTitle}>Applied from their message</div>
            <div style={styles.reviewOpenSub}>{autoApplied.join(' · ')}</div>
          </div>
          <button style={styles.iconBtn} onClick={() => setAutoApplied([])} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      {(reviewReasons.length + pendingActions.length) > 0 && (
        <button style={styles.reviewOpenBtn} onClick={() => setShowReview(true)}>
          <AlertTriangle size={16} />
          <div style={styles.reviewOpenText}>
            <div style={styles.reviewOpenTitle}>{reviewReasons.length + pendingActions.length} thing{(reviewReasons.length + pendingActions.length) !== 1 ? 's' : ''} to sort out</div>
            <div style={styles.reviewOpenSub}>Tap to work through them</div>
          </div>
          <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
        </button>
      )}

      {showReview && (
        <ReviewModal
          reasons={reviewReasons}
          actions={pendingActions}
          items={items}
          onApplyNote={setItemNote}
          onApplyOption={setItemOption}
          onApplyUpcharge={setItemUpcharge}
          onApplyWeight={setItemWeight}
          onAddCustomCharge={(label, amount) =>
            setCustomCharges(prev => [...prev, { id: uid(), label, amount: String(amount) }])}
          onResolve={(i) => dismissReview(i)}
          onResolveAction={dismissAction}
          onClose={() => setShowReview(false)}
        />
      )}

      <label style={styles.label}>Customer</label>
      <input
        style={styles.input}
        placeholder="Who's this for?"
        value={customer}
        onChange={e => setCustomer(e.target.value)}
        autoFocus={!isEdit && items.length > 0}
      />
      {showChips && (
        <div style={styles.chipRow}>
          {recentCustomers.map(name => (
            <button key={name} style={styles.chip} onClick={() => setCustomer(name)}>
              {name}
            </button>
          ))}
        </div>
      )}

      <label style={styles.label}>Items</label>
      {itemCount > 0 && (
        <div style={styles.selectedSummary}>
          {itemCount} item{itemCount !== 1 ? 's' : ''} selected · {currency(itemsTotal)}
        </div>
      )}

      <div style={styles.categoryGrid}>
        {Object.keys(menu).map(cat => (
          <button
            key={cat}
            style={{
              ...styles.categoryBtn,
              ...(pickerCategory === cat ? styles.categoryBtnActive : {}),
            }}
            onClick={() => setPickerCategory(pickerCategory === cat ? null : cat)}
          >
            {CATEGORY_LABELS[cat]}
            {selectedByCategory[cat] > 0 && <span style={styles.catCount}>{selectedByCategory[cat]}</span>}
            {pickerCategory === cat ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        ))}
      </div>

      {pickerCategory && (
        <div style={styles.picker}>
          {menu[pickerCategory].map(menuItem => (
            <div key={menuItem.name} style={styles.pickerGroup}>
              <div style={styles.pickerGroupName}>{menuItem.name}</div>
              <div style={styles.pickerVariants}>
                {menuItem.variants.map(variant => {
                  const idx = findItemIndex(pickerCategory, menuItem.name, variant);
                  const selected = idx >= 0;
                  return (
                    <div
                      key={variant.label}
                      style={{ ...styles.variantBtn, ...(selected ? styles.variantBtnSelected : {}) }}
                      onClick={() => !selected && addItem(pickerCategory, menuItem.name, variant)}
                      role="button"
                      tabIndex={0}
                    >
                      <span style={styles.variantLabel}>{variant.label}</span>
                      {selected ? (
                        <QtyControl value={items[idx].qty} onChange={(q) => setQty(idx, q)} />
                      ) : (
                        <span style={styles.variantPrice}>{currency(variant.price)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Off-menu: pull in any catalog dish not on this week's menu (admin only).
          Comes in as a real line item so reheat + costing work. */}
      {offMenuCount > 0 && (
        <div style={styles.offMenuWrap}>
          <button
            style={styles.offMenuToggle}
            onClick={() => setShowOffMenu(v => !v)}
          >
            <span>Off-menu items ({offMenuCount})</span>
            {showOffMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showOffMenu && (
            <div style={styles.offMenuBody}>
              <div style={styles.offMenuHint}>
                Anything not on this week's menu — for edits and manual orders. Adds as a
                normal item, so reheat instructions and costs work just like on-menu dishes.
              </div>
              {Object.keys(offMenu).map(cat => (
                <div key={cat} style={styles.offMenuCatGroup}>
                  <div style={styles.offMenuCatLabel}>{CATEGORY_LABELS[cat]}</div>
                  {offMenu[cat].map(menuItem => (
                    <div key={menuItem.name} style={styles.pickerGroup}>
                      <div style={styles.pickerGroupName}>{menuItem.name}</div>
                      <div style={styles.pickerVariants}>
                        {menuItem.variants.map(variant => {
                          const idx = findItemIndex(cat, menuItem.name, variant);
                          const selected = idx >= 0;
                          return (
                            <div
                              key={variant.label}
                              style={{ ...styles.variantBtn, ...(selected ? styles.variantBtnSelected : {}) }}
                              onClick={() => !selected && addItem(cat, menuItem.name, variant)}
                              role="button"
                              tabIndex={0}
                            >
                              <span style={styles.variantLabel}>{variant.label}</span>
                              {selected ? (
                                <QtyControl value={items[idx].qty} onChange={(q) => setQty(idx, q)} />
                              ) : (
                                <span style={styles.variantPrice}>{currency(variant.price)}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected items, each expandable to add a note or an upcharge */}
      {items.length > 0 && (
        <div style={styles.reviewList}>
          {items.map((it, idx) => {
            const open = expandedItem === idx;
            const hasExtra = it.note || (it.upcharge && typeof it.upcharge === 'object' && (it.upcharge.label || it.upcharge.amount));
            return (
              <div key={`${it.category}-${it.name}-${it.variant}-${idx}`} style={styles.reviewItemCard}>
                <div style={styles.reviewRow}>
                  <button
                    style={styles.reviewItemMain}
                    onClick={() => setExpandedItem(open ? null : idx)}
                  >
                    <span style={styles.reviewText}>
                      {it.qty}&times; {it.name} <span style={styles.orderItemVariant}>({it.variant})</span>
                    </span>
                    {hasExtra && <span style={styles.itemExtraDot} />}
                  </button>
                  <QtyControl value={it.qty} onChange={(q) => setQty(idx, q)} />
                </div>

                {/* Compact preview of note/upcharge when collapsed */}
                {!open && isPerLbItem(it.name) && (
                  it.weight > 0
                    ? <div style={styles.itemUpchargePreview}>{it.weight} lb · {currency(it.price)}</div>
                    : <div style={styles.itemUpchargeNeedsPrice}>set weight ⌄</div>
                )}
                {!open && it.note && <div style={styles.itemNotePreview}>“{it.note}”</div>}
                {!open && it.options && (it.options.spice || it.options.pasta) && (
                  <div style={styles.itemUpchargePreview}>
                    {[it.options.spice ? `Spice ${it.options.spice}` : null, it.options.pasta || null].filter(Boolean).join(' · ')}
                  </div>
                )}
                {!open && it.upcharge && typeof it.upcharge === 'object' && it.upcharge.amount > 0 ? (
                  <div style={styles.itemUpchargePreview}>+ {it.upcharge.label} ({currency(it.upcharge.amount)})</div>
                ) : null}
                {!open && it.upcharge && typeof it.upcharge === 'object' && it.upcharge.label && !it.upcharge.amount ? (
                  <div style={styles.itemUpchargeNeedsPrice}>+ {it.upcharge.label} — set a price ⌄</div>
                ) : null}

                {/* Option controls — declared per-dish in the registry (dishes.js `options`) */}
                {(() => {
                  const defs = itemOptionDefs(menu, it);
                  if (!defs) return null;
                  return (
                    <>
                      {defs.spice && (
                        <SpicePicker
                          value={it.options && it.options.spice}
                          min={defs.spice.min} max={defs.spice.max}
                          onChange={(v) => setItemOption(idx, 'spice', v)}
                        />
                      )}
                      {defs.pasta && (
                        <PastaPicker
                          value={it.options && it.options.pasta}
                          placeholder={defs.pasta.placeholder}
                          onChange={(v) => setItemOption(idx, 'pasta', v)}
                        />
                      )}
                    </>
                  );
                })()}

                {open && (
                  <div style={styles.itemEditor}>
                    {isPerLbItem(it.name) && (
                      <div style={styles.weightDeferNote}>
                        Priced by weight ({currency(PER_LB_ITEMS[it.name].pricePerLb)}/lb + $1.50 bag). Set the actual weight from the order after you've weighed it.
                      </div>
                    )}
                    <label style={styles.miniLabel}>Note for this item</label>
                    <input
                      style={styles.input}
                      placeholder="e.g. chili oil on the side"
                      value={it.note || ''}
                      onChange={e => setItemNote(idx, e.target.value)}
                    />
                    <label style={styles.miniLabel}>Upcharge (optional)</label>
                    <div style={styles.upchargeRow}>
                      <input
                        style={{ ...styles.input, flex: 2, marginTop: 0 }}
                        placeholder="label, e.g. extra protein"
                        value={it.upcharge?.label || ''}
                        onChange={e => setItemUpcharge(idx, e.target.value, it.upcharge?.amount || '')}
                      />
                      <input
                        style={{ ...styles.input, flex: 1, marginTop: 0 }}
                        type="number"
                        inputMode="decimal"
                        placeholder="$"
                        value={it.upcharge?.amount || ''}
                        onChange={e => setItemUpcharge(idx, it.upcharge?.label || 'Upcharge', e.target.value)}
                      />
                    </div>
                    <div style={styles.itemEditorActions}>
                      {hasExtra && (
                        <button
                          style={styles.clearItemExtra}
                          onClick={() => { setItemNote(idx, ''); setItemUpcharge(idx, '', ''); }}
                        >
                          Clear
                        </button>
                      )}
                      <button style={styles.doneItemBtn} onClick={() => setExpandedItem(null)}>Done</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.loopRow}>
        <div style={styles.loopField}>
          <label style={styles.label}>Jar swaps</label>
          <QtyControl value={jarSwaps} onChange={setJarSwaps} />
          <div style={styles.loopHint}>−$2.00 each</div>
        </div>
        <div style={styles.loopField}>
          <label style={styles.label}>Containers returned</label>
          <QtyControl value={containerReturns} onChange={setContainerReturns} />
          <div style={styles.loopHint}>−$1.00 each</div>
        </div>
      </div>

      <label style={styles.label}>Discount</label>
      <div style={styles.discountRow}>
        {[
          [null, 'None'],
          ['percent', '%'],
          ['dollar', '$'],
        ].map(([type, label]) => (
          <button
            key={label}
            style={{
              ...styles.discountTypeBtn,
              ...(discountType === type ? styles.discountTypeBtnActive : {}),
            }}
            onClick={() => setDiscountType(type)}
          >
            {label}
          </button>
        ))}
        {discountType && (
          <input
            style={{ ...styles.input, flex: 1, marginTop: 0 }}
            type="number"
            inputMode="decimal"
            min="0"
            placeholder={discountType === 'percent' ? 'e.g. 10' : 'e.g. 5.00'}
            value={discountValue}
            onChange={e => setDiscountValue(e.target.value)}
          />
        )}
      </div>

      <label style={styles.label}>Custom charges</label>
      {customCharges.length > 0 && (
        <div style={styles.customChargeList}>
          {customCharges.map(ch => (
            <div key={ch.id} style={styles.customChargeRow}>
              <input
                style={{ ...styles.input, flex: 2, marginTop: 0 }}
                placeholder="what for? e.g. special request"
                value={ch.label}
                onChange={e => updateCustomCharge(ch.id, 'label', e.target.value)}
              />
              <input
                style={{ ...styles.input, flex: 1, marginTop: 0 }}
                type="number"
                inputMode="decimal"
                placeholder="$"
                value={ch.amount}
                onChange={e => updateCustomCharge(ch.id, 'amount', e.target.value)}
              />
              <button style={styles.iconBtn} onClick={() => removeCustomCharge(ch.id)} aria-label="Remove charge">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button style={styles.addChargeBtn} onClick={addCustomCharge}>
        <Plus size={15} /> Add a custom charge
      </button>

      <label style={styles.label}>Notes</label>
      <textarea
        style={styles.textarea}
        placeholder="Anything that isn't tied to one item (delivery time, general message)..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      {itemsUpchargeTotal(items) > 0 && (
        <div style={styles.extraLine}>
          <span>Item upcharges</span>
          <span>+{currency(itemsUpchargeTotal(items))}</span>
        </div>
      )}
      {disc > 0 && (
        <div style={styles.discountLine}>
          <span>Discount{discountType === 'percent' ? ` (${discNum}%)` : ''}</span>
          <span>−{currency(disc)}</span>
        </div>
      )}
      {customChargesTotal(customCharges) > 0 && (
        <div style={styles.extraLine}>
          <span>Custom charges</span>
          <span>+{currency(customChargesTotal(customCharges))}</span>
        </div>
      )}
      <button
        style={styles.waiveSurchargeRow}
        onClick={() => setWaiveSurcharge(v => !v)}
      >
        <span style={styles.waiveSurchargeLabel}>
          <span style={{ ...styles.waiveCheckbox, ...(waiveSurcharge ? styles.waiveCheckboxOn : {}) }}>
            {waiveSurcharge && <Check size={12} />}
          </span>
          Waive the $2 surcharge
        </span>
        <span style={styles.waiveSurchargeHint}>{waiveSurcharge ? 'waived' : 'applied'}</span>
      </button>
      <div style={styles.totalRow}>
        <span>Total {waiveSurcharge ? '(surcharge waived)' : '(incl. $2 surcharge)'}</span>
        <span style={{ ...styles.totalValue, ...(total < 0 ? { color: '#E8799A' } : {}) }}>{currency(total)}</span>
      </div>
      {total < 0 && (
        <div style={styles.negativeTotalNote}>
          This order is below zero, so you'll be covering {currency(Math.abs(total))} out of pocket. Saved as-is.
        </div>
      )}

      {hasPerLbItems && (
        <div style={styles.weightDeferNote}>
          Sous vide proteins are priced by weight — save the order, then set each weight from the order card once you've weighed them.
        </div>
      )}

      <button
        style={{ ...styles.saveBtn, ...(!customer.trim() || items.length === 0 ? styles.saveBtnDisabled : {}) }}
        onClick={save}
        disabled={!customer.trim() || items.length === 0}
      >
        {isEdit ? 'Save changes' : 'Save order'}
      </button>
    </div>
  );
}

// ─── Invoice (branded, one-screen, screenshot-friendly) ─────────────────────
