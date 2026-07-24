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

export function ArchiveDeliveredButton({ count, onArchive }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <div style={styles.clearConfirmRow}>
        <span style={styles.confirmText}>Archive all {count} delivered order{count !== 1 ? 's' : ''}? They stay in the Money tab.</span>
        <button style={styles.confirmYesGreen} onClick={() => { onArchive(); setConfirm(false); }}>Archive</button>
        <button style={styles.confirmNo} onClick={() => setConfirm(false)}>Cancel</button>
      </div>
    );
  }
  return (
    <button style={styles.clearDeliveredBtn} onClick={() => setConfirm(true)}>
      <Archive size={14} />
      Archive all delivered (start a new week)
    </button>
  );
}

// ─── Cooking List ───────────────────────────────────────────────────────────
export function CookingList({ items, orderCount, revenue, checks, onToggle, onReset }) {
  if (items.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyTitle}>Nothing to cook yet</div>
        <div style={styles.emptyBody}>Active orders will roll up into a cooking list here.</div>
      </div>
    );
  }

  const grouped = {};
  items.forEach(it => {
    if (!grouped[it.category]) grouped[it.category] = [];
    grouped[it.category].push(it);
  });

  const doneCount = items.filter(it => checks[it.key]).length;

  return (
    <div>
      {revenue > 0 && (
        <div style={styles.cookRevenueBar}>
          <span style={styles.cookRevenueLabel}>In active orders</span>
          <span style={styles.cookRevenueValue}>{currency(revenue)}</span>
        </div>
      )}
      <div style={styles.cookHeader}>
        <div style={styles.cookSummary}>
          {doneCount}/{items.length} done · from {orderCount} active order{orderCount !== 1 ? 's' : ''}
        </div>
        {doneCount > 0 && (
          <button style={styles.resetBtn} onClick={onReset}>
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} style={styles.cookCategory}>
          <div style={styles.cookCategoryTitle}>{CATEGORY_LABELS[cat]}</div>
          {catItems.map(it => {
            const isChecked = !!checks[it.key];
            return (
              <button
                key={it.key}
                style={{ ...styles.cookItem, ...(isChecked ? styles.cookItemChecked : {}) }}
                onClick={() => onToggle(it.key)}
              >
                <div style={{ ...styles.checkbox, ...(isChecked ? styles.checkboxChecked : {}) }}>
                  {isChecked && <Check size={14} color="#1a1a1a" />}
                </div>
                <div style={styles.cookItemText}>
                  <div style={styles.cookItemName}>{it.name}</div>
                  <div style={styles.cookItemVariant}>{it.variant}</div>
                </div>
                <div style={styles.cookItemQty}>&times;{it.qty}</div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Deliver List ───────────────────────────────────────────────────────────
// Same active-order items as the cooking list, regrouped by customer so each
// bag can be packed and checked off independently while staging deliveries.
export function DeliverList({ groups, orderCount, checks, onToggle, onReset, omakaseUnconfirmed, onConfirmOmakase }) {
  if (groups.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyTitle}>Nothing to deliver yet</div>
        <div style={styles.emptyBody}>Active orders will roll up by customer here.</div>
      </div>
    );
  }

  const allItems = groups.flatMap(g => g.items);
  const doneCount = allItems.filter(it => checks[it.key]).length;
  const pendingOma = omakaseUnconfirmed || [];

  return (
    <div>
      {pendingOma.length > 0 && (
        <div style={{ background: 'rgba(212,160,80,0.10)', border: '1px solid #D4A050', borderRadius: 10, padding: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#D4A050', marginBottom: 6 }}>
            Omakase price not settled
          </div>
          {pendingOma.map(p => (
            <div key={p.orderId} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
              <span style={{ flex: 1, fontSize: 12.5, color: '#e8ede9' }}>
                {p.customer} is still at the {currency(p.price)} max
              </span>
              <button
                onClick={() => onConfirmOmakase && onConfirmOmakase(p.orderId)}
                style={{ padding: '5px 12px', minHeight: 44, borderRadius: 6, cursor: 'pointer', background: '#2f6f57', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12 }}
              >
                Confirm {currency(p.price)}
              </button>
            </div>
          ))}
          <div style={{ fontSize: 10.5, color: '#7a8480', marginTop: 4 }}>
            Adjust it on the order itself if it should be less.
          </div>
        </div>
      )}
      <div style={styles.cookHeader}>
        <div style={styles.cookSummary}>
          {doneCount}/{allItems.length} packed · {orderCount} active order{orderCount !== 1 ? 's' : ''}
        </div>
        {doneCount > 0 && (
          <button style={styles.resetBtn} onClick={onReset}>
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>
      {groups.map(grp => {
        const grpDone = grp.items.filter(it => checks[it.key]).length;
        const allDone = grpDone === grp.items.length;
        return (
          <div key={grp.orderId} style={styles.cookCategory}>
            <div style={{ ...styles.cookCategoryTitle, ...(allDone ? styles.deliverCustDone : {}) }}>
              {grp.customer} · {grpDone}/{grp.items.length}
            </div>
            {grp.items.map(it => {
              const isChecked = !!checks[it.key];
              return (
                <button
                  key={it.key}
                  style={{ ...styles.cookItem, ...(isChecked ? styles.cookItemChecked : {}) }}
                  onClick={() => onToggle(it.key)}
                >
                  <div style={{ ...styles.checkbox, ...(isChecked ? styles.checkboxChecked : {}) }}>
                    {isChecked && <Check size={14} color="#1a1a1a" />}
                  </div>
                  <div style={styles.cookItemText}>
                    <div style={styles.cookItemName}>{it.name}</div>
                    <div style={styles.cookItemVariant}>{it.variant}</div>
                  </div>
                  <div style={styles.cookItemQty}>&times;{it.qty}</div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shopping List ──────────────────────────────────────────────────────────
