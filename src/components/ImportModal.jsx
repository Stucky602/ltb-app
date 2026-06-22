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

export function ImportModal({ onSubmit, onCancel }) {
  const [text, setText] = useState('');
  return (
    <div style={styles.invoiceOverlay} onClick={onCancel}>
      <div style={styles.importModalCard} onClick={e => e.stopPropagation()}>
        <div style={styles.reviewModalHeader}>
          <div style={styles.reviewModalTitle}>Paste backup</div>
          <button style={styles.iconBtn} onClick={onCancel} aria-label="Cancel"><X size={18} /></button>
        </div>
        <div style={styles.importModalHint}>
          Open your backup note, select all, copy, then long-press in the box below and paste.
        </div>
        <textarea
          style={{ ...styles.textarea, minHeight: '140px', fontSize: '11px', fontFamily: 'monospace' }}
          placeholder='Paste your LTB backup JSON here...'
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
        />
        <button
          style={{ ...styles.saveBtn, ...(text.trim() ? {} : styles.saveBtnDisabled) }}
          disabled={!text.trim()}
          onClick={() => onSubmit(text)}
        >
          Restore orders
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main App
// ═══════════════════════════════════════════════════════════════════════════
