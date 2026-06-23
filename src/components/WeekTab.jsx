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

export function WeekTab({ selected, onToggle, onPublish }) {
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [weekLabel, setWeekLabel] = useState('');

  // Compute the next Sunday (order due date) and following Wednesday (delivery).
  const computeWeekLabel = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    // The order window closes Sunday and delivers Wednesday.
    // If today is Sun (0): use today as the deadline.
    // If today is Mon-Wed (1-3): the window just closed; next cycle starts next Thu,
    //   so point to the upcoming Sunday.
    // If today is Thu-Sat (4-6): orders are open, deadline is this coming Sunday.
    let daysToSun;
    if (day === 0) daysToSun = 0;           // today is Sunday
    else if (day <= 3) daysToSun = 7 - day; // Mon-Wed: next Sunday
    else daysToSun = 7 - day;               // Thu-Sat: this coming Sunday
    const sun = new Date(now); sun.setDate(now.getDate() + daysToSun);
    const wed = new Date(sun); wed.setDate(sun.getDate() + 3);
    const fmt = (d) => d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    return `Orders due Sunday ${fmt(sun)} · Delivery Wednesday ${fmt(wed)}`;
  };

  // Push the active menu config to the Worker so the custom form updates.
  const doPublish = async () => {
    setPublishing(true);
    setPublishMsg(null);
    try {
      await onPublish(selected, pdfUrl.trim(), weekLabel.trim() || computeWeekLabel());
      setPublishMsg({ ok: true, text: "Published! The order form now shows this week's menu." });
    } catch (e) {
      setPublishMsg({ ok: false, text: (e && e.message) || 'Publish failed. Check your connection and try again.' });
    }
    setPublishing(false);
  };

  // Generate Google Form dropdown options from the active week's dishes.
  // Format: one option per variant, "No thanks" first, then each size/price.
  const generateDropdown = () => {
    if (selected.length === 0) return '';
    const lines = [];
    selected.forEach(name => {
      const dish = ALL_DINNERS.find(d => d.name === name);
      if (!dish) return;
      lines.push(`--- ${dish.name} ---`);
      lines.push('No thanks');
      dish.variants.forEach(v => {
        lines.push(`${v.label} — $${v.price}`);
      });
      lines.push(''); // blank line between dishes
    });
    return lines.join('\n').trim();
  };

  const copyDropdown = () => {
    const text = generateDropdown();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback for older iOS
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div>
      <div style={styles.genCard}>
        <div style={styles.genTitle}>This week's dinner lineup</div>
        <div style={styles.genHint}>
          Check the dishes you're offering. The order picker, text parser, and shopping
          list follow this instantly. Existing orders aren't affected.
          The customer-facing PDF still comes from Claude — just tell it your picks
          (or send it a screenshot of this screen).
        </div>
        {selected.length === 0 && (
          <div style={styles.parseError}>No dishes selected — the Dinner section will be empty on new orders.</div>
        )}
      </div>

      {ALL_DINNERS.map(dish => {
        const isOn = selected.includes(dish.name);
        const prices = dish.variants.map(v => v.price);
        const lo = Math.min(...prices);
        const hi = Math.max(...prices);
        const priceLabel = lo === hi ? currency(lo) : `${currency(lo)}–${currency(hi)}`;
        return (
          <button
            key={dish.name}
            style={{ ...styles.cookItem, ...(isOn ? {} : { opacity: 0.55 }) }}
            onClick={() => onToggle(dish.name)}
          >
            <div style={{ ...styles.checkbox, ...(isOn ? styles.checkboxChecked : {}) }}>
              {isOn && <Check size={14} color="#1a1a1a" />}
            </div>
            <div style={styles.cookItemText}>
              <div style={styles.cookItemName}>{dish.name}</div>
              <div style={styles.cookItemVariant}>
                {dish.variants.length} option{dish.variants.length !== 1 ? 's' : ''} · {priceLabel}
              </div>
            </div>
            <div style={{ ...styles.cookItemQty, color: isOn ? '#5DCAA5' : '#5F5E5A', fontSize: '11px', fontWeight: 700 }}>
              {isOn ? 'ON' : 'OFF'}
            </div>
          </button>
        );
      })}

      {selected.length > 0 && (
        <div style={styles.genCard}>
          <div style={styles.genTitle}>Publish this week's menu</div>
          <div style={styles.genHint}>
            Pushes the checked dishes and prices to your order form instantly.
            Customers see the new menu the moment you publish. Optionally add the
            menu PDF link and a week label that show on the form.
          </div>
          <button
            style={{ ...styles.saveBtn, marginTop: '10px', background: publishMsg?.ok ? '#1D9E75' : undefined }}
            onClick={doPublish}
            disabled={publishing}
          >
            {publishing ? 'Publishing…' : publishMsg?.ok ? '✓ Published!' : 'Publish to order form'}
          </button>
          {publishMsg && (
            <div style={publishMsg.ok ? styles.publishOk : styles.publishErr}>{publishMsg.text}</div>
          )}
        </div>
      )}

      {USE_LEGACY_CSV && selected.length > 0 && (
        <div style={styles.genCard}>
          <div style={styles.genTitle}>Google Form dropdown options</div>
          <div style={styles.genHint}>
            Copy these and paste them into your Google Form question options for the week.
            Each dish gets a "No thanks" option first, then each size and price.
          </div>
          <button style={{ ...styles.saveBtn, marginTop: '8px', background: copied ? '#1D9E75' : undefined }} onClick={copyDropdown}>
            {copied ? '✓ Copied to clipboard!' : 'Copy form options'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Stats Bar ──────────────────────────────────────────────────────────────
