import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Check, ChevronDown, ChevronUp, X, Pencil, Copy, RotateCcw,
  ClipboardPaste, ArrowUpDown, Archive, ImageIcon, AlertTriangle, FileText,
  Scale, Camera, Download, Upload, Flame, Bell,
} from './icons.jsx';
import {
  ALL_DINNERS, ALWAYS_MENU, DEFAULT_WEEK, PER_LB_ITEMS, FULL_MENU,
  isPerLbItem, buildMenu, CATEGORY_LABELS, STATUSES, STATUS_COLORS,
} from './menu.js';
import {
  RECIPES, INGREDIENT_SYNONYMS, SOUS_VIDE_VEG, DINNER_REHEAT_BUCKET,
  RICE_DISHES, PASTA_DISHES, NOODLE_DISHES,
  normalizeIngredientName, generateShoppingItems, buildAutoShoppingRows, buildReheatBlocks,
} from './recipes.js';
import {
  SURCHARGE, WORKER_BASE, PENDING_POLL_URL, CONFIG_PUBLISH_URL,
  PUBLISH_TOKEN, VAPID_PUBLIC_KEY, USE_LEGACY_CSV, FORM_CSV_URL,
  ORDERS_KEY, CHECKS_KEY, DELIVER_CHECKS_KEY, DISH_NOTES_KEY, PIPELINE_JOURNAL_KEY, WEEK_NOTES_KEY,
  JOURNAL_KEY, CONTAINER_INVENTORY_KEY, WEEK_LEDGER_KEY, COPIES_NOTE_KEY, ARCHIVE_HISTORY_KEY, SW_VERSION_KEY,
  SHOPPING_KEY, WEEK_KEY, PENDING_KEY, SEEN_ROWS_KEY,
  BACKUP_STATE_KEY, BACKUP_STALE_MS, AUDIT_LOG_KEY,
  LAST_SEEN_WEEK_KEY, HANDLED_PENDING_KEY,
} from './config.js';
import {
  uid, currency, round2, DISH_CUISINE, dishCuisine, normName,
  MIN_ORDERS_FOR_INSIGHT, localStore, store, PHOTO_PREFIX, PHOTO_TTL_DAYS, fmtBytes,
  urlBase64ToUint8Array, onStorageFull, storageFootprint, nameMatchType, regularNames, regularDisplayName,
  buildInsights, insightStamp, loadHtml2Canvas,
  discountAmount, itemsUpchargeTotal, customChargesTotal, itemsBaseTotal,
  orderTotal, repricePerLbItem, itemCost, orderCostInfo,
  optionsSummary, noteWithoutOptions, normalizeAddons, itemAddons,
  groupKeyFor, formatDate, orderToText, copyText, loadJSON, saveJSON, saveError,
  photoKey, savePhoto, loadPhoto, photoStorageBytes,
  menuForPrompt, fileToJpegBase64, parseOrderText, validateParsedOrder, parseAmendment,
  parseFormRow, parseDelimited, rowToOrderText, parseFormNotes,
  houseOrderPatch, isHouseOrder, HOUSE_DISCOUNT_PERCENT,
} from './utils.js';
// migrations.js, seedReconcile.js, and INGREDIENT_SEED are no longer imported
// here at all: the schema guard, the seed reconcile, and the deploy-fingerprint
// diff all moved with boot hydration into bootHydrate.js, and the restore-side
// copies of the same guards live in backupRestore.js. Both of those are choke
// points by design. If a third caller ever needs them, that is a signal to ask
// why, not to re-add the import.
import { emptyJournal, normalizeJournal } from './journal.js';
import { recordWeek, normalizeLedger } from './weekLedger.js';
import { useWakeLock } from './useWakeLock.js';
import { usePreserveScroll } from './usePreserveScroll.js';
import { currentWeekInfo, msUntilDeadline, formatCountdown, intakeVsMedian, weekRolledOver } from './timeBanners.js';
import { sortList, filterByStatus, searchList, orderHaystacks, windowList, DEFAULT_WINDOW } from './listControls.js';
import { containerReport, normalizeContainerConfig } from './containers.js';
import { extractNotice } from './weekNotice.js';
import { SOURCES, appendAudit, auditEntry } from './auditLog.js';
import { TEAL_DARK, TEAL_MID, TEAL_LIGHT, GOLD, CREAM, DARK, CARD, styles } from './styles.js';

import { ImportModal } from './components/ImportModal.jsx';
import { LinkRegularPrompt, RegularsTab, RegularForm, RegularProfile } from './components/RegularsTab.jsx';
import { WeekTab } from './components/WeekTab.jsx';
import { StatsBar, QtyControl, PasteOrderCard, AmendOrderCard, CsvImportCard, ReviewModal } from './components/OrderInputs.jsx';
import { OrderForm } from './components/OrderForm.jsx';
import { InvoiceModal, ReheatModal, WeightPhotoModal } from './components/Modals.jsx';
import { OrderCard } from './components/OrderCard.jsx';
import { ArchiveDeliveredButton, CookingList, DeliverList } from './components/CookTabs.jsx';
import { ShoppingList } from './components/ShoppingList.jsx';
import { MoneyTab } from './components/MoneyTab.jsx';
import { undecidedOmakases, omakaseStats, omakasePriceUnsettled } from './omakase.js';
import { weekOneBottle } from './weekPlanner.js';
import { customerFavorites } from './favorites.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { RecipesTab } from './components/RecipesTab.jsx';
import { RecordTab } from './components/RecordTab.jsx';
import { reportableDishes } from './dishReport.js';
import { buildCookList } from './cookList.js';
import { FeedbackCard } from './components/FeedbackCard.jsx';
import { PlannerPanel } from './components/PlannerPanel.jsx';
import { RegularsIntelPanel } from './components/RegularsIntelPanel.jsx';
import { LabelsSheet } from './components/LabelsSheet.jsx';
import { DigestPanel } from './components/DigestPanel.jsx';
import { SchedulePanel } from './components/SchedulePanel.jsx';
import { IngredientsTab } from './components/IngredientsTab.jsx';
import { ReceiptScan } from './components/ReceiptScan.jsx';
import { baselineCostMap, liveCostMapFrom } from './dishCosting.js';
import {
  djb2, buildBackupPayload as buildPayload, applyBackupPayload as applyPayload,
  postBackupSnapshot, fetchBackupList, fetchBackupSnapshot, relativeAge,
} from './backupRestore.js';
import { BackupModal } from './components/BackupModal.jsx';
import { hydrateFromStorage } from './bootHydrate.js';
// Namespaced rather than named: every one of these has a same-named thin
// wrapper below, and `ops.updateOrder` inside `const updateOrder = ...` reads
// unambiguously where a bare import would shadow itself.
import * as ops from './orderOps.js';
import * as fb from './feedbackSync.js';
import * as ing from './ingredientOps.js';

export default function LTBOrderTracker() {
  React.useEffect(() => {
    if (!document.getElementById('ltb-spin-style')) {
      const s = document.createElement('style');
      s.id = 'ltb-spin-style';
      s.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      document.head.appendChild(s);
    }
  }, []);

  const [notifPerm, setNotifPerm] = React.useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  // The service worker does two jobs: it receives push, and it tells us when a
  // new build landed. The second one matters even without push configured, so
  // registration is no longer gated on VAPID.
  const [swUpdate, setSwUpdate] = useState(null);
  React.useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(e => {
      console.warn('SW registration failed:', e.message);
    });
    const onMsg = (e) => {
      const d = e && e.data;
      if (!d || d.type !== 'sw-updated' || !d.version) return;
      // Silent on first install: there is nothing to reload INTO yet.
      loadJSON(SW_VERSION_KEY, null).then(seen => {
        saveJSON(SW_VERSION_KEY, d.version);
        if (seen && seen !== d.version) setSwUpdate(d.version);
      });
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    return () => navigator.serviceWorker.removeEventListener('message', onMsg);
  }, []);

  // Storage: a hard stop when writes start failing, and a soft warning while
  // there is still room to act. 4MB of a ~5MB budget is the warning line.
  const [storageFull, setStorageFull] = useState(false);
  const [storageBytes, setStorageBytes] = useState(0);
  React.useEffect(() => {
    onStorageFull(() => setStorageFull(true));
    const check = () => setStorageBytes(storageFootprint());
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, []);

  const enablePushNotifications = async () => {
    if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotifPerm(permission);
      if (permission !== 'granted') return;
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      await fetch(WORKER_BASE + '/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: PUBLISH_TOKEN, subscription: sub.toJSON() }),
      });
    } catch (e) {
      console.warn('Push setup failed:', e.message);
    }
  };

  const [orders, setOrders] = useState(null);
  const [cookChecks, setCookChecks] = useState({});
  const [deliverChecks, setDeliverChecks] = useState({});
  const [cookSubView, setCookSubView] = useState('cook');
  // The knowledge journal (K1–K8). Replaced dishNotes (schema v2): a flat
  // { dish: text } map had one undated slot per dish, and the whole point of
  // the record is dated, typed, accumulating entries.
  const [journal, setJournal] = useState(emptyJournal());
  // Customer questions pulled from the worker. Not persisted: the worker holds
  // the rolling log, so this is a view of it, not a second copy to drift.
  const [askLog, setAskLog] = useState([]);
  const [weekLedger, setWeekLedger] = useState(() => normalizeLedger(null));
  // Where the archive copies live. Prints INTO the archive, so it is readable
  // by someone who does not have Kevin to ask.
  const [copiesNote, setCopiesNote] = useState('');
  const [archiveHistory, setArchiveHistory] = useState([]);
  // Stamped each time an archive is downloaded, so the NEXT one knows where it
  // sits in the series.
  const recordArchive = useCallback((entryCount) => {
    setArchiveHistory(prev => {
      const next = [...prev, { generatedAt: new Date().toISOString(), entryCount }].slice(-40);
      saveJSON(ARCHIVE_HISTORY_KEY, next);
      return next;
    });
  }, []);
  const saveCopiesNote = useCallback((text) => {
    const v = String(text || '').slice(0, 600);
    setCopiesNote(v);
    saveJSON(COPIES_NOTE_KEY, v).then(r => setError(saveError(r)));
  }, []);
  // M1: owned container counts + meal-pool adjustment (containers.js).
  const [containerConfig, setContainerConfig] = useState(() => normalizeContainerConfig(null));
  // Pipeline test-kitchen journal: { version, entries: { key: { journal:[], status, promoteChecklist } } }
  // Rides the backup ring (below) — day-three verdicts are the whole point of
  // the feature and a device wipe must not lose them.
  const [pipelineJournal, setPipelineJournal] = useState({ version: 1, entries: {} });
  // Per-dish feedback store (persistent) + incoming triage queue (transient).
  // Feedback is dish-linked only — never attached to orders. Queue entries
  // keep their worker pageId; a pageId is cleared from KV only once ALL its
  // entries are triaged, so closing the app mid-triage loses nothing.
  const [dishFeedback, setDishFeedback] = useState({});
  const [pendingFeedback, setPendingFeedback] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [booted, setBooted] = useState(false);
  const [includeStaples, setIncludeStaples] = useState(() => localStore.get('ltb_staples_pref') === '1');
  const [weekDishes, setWeekDishes] = useState(DEFAULT_WEEK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('orders');
  // P1: the screen sleeping mid-cook, by Kevin's own account probably the
  // single most annoying daily thing in the app. Held on cook and shop only
  // — the two tabs a phone sits propped up for while hands are busy.
  useWakeLock(view === 'cook' || view === 'shop');

  // T1: a minute-granularity clock for the deadline countdown. A full
  // re-render every 60s is negligible and keeps "3h 12m" honest without any
  // per-second churn a phone battery would notice.
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClockTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date(), [clockTick]);

  // T2: the business-week rollover flag. Dismissed by TAP, not silently and
  // not by a timer — same rule already applied to `notice` below: an
  // informational banner should not vanish before Kevin has read it.
  const [lastSeenWeek, setLastSeenWeek] = useState(null);
  const markWeekSeen = useCallback((stamp) => {
    setLastSeenWeek(stamp);
    saveJSON(LAST_SEEN_WEEK_KEY, stamp);
  }, []);
  const [showLabels, setShowLabels] = useState(false); // bag-labels print sheet
  const [formMode, setFormMode] = useState(null);
  const [showPaste, setShowPaste] = useState(false);
  const [showAmend, setShowAmend] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  // Ledger of worker pending ids already accepted/rejected (see HANDLED_PENDING_KEY).
  const handledPendingRef = useRef({});
  const [ingredientsDb, setIngredientsDb] = useState([]);
  const [costHistory, setCostHistory] = useState([]); // [{ t, id, cost }] lightweight time-series
  const [receiptAliases, setReceiptAliases] = useState({}); // normReceiptStr -> { ingredientId?, action?, pricing? }
  const [auditLog, setAuditLog] = useState([]);

  // ── Audit trail (v9.23) ───────────────────────────────────────────────────
  // Declared HERE, immediately after its state, and NOT further down: every
  // consumer below (publishWeek, updateIngredients, commitReceiptCosts,
  // saveReceiptAliases) names it in a dep array, and a dep array is
  // evaluated during render. Declared late, those arrays hit the temporal
  // dead zone and the whole app dies at boot with 'can't access lexical
  // declaration recordAudit before initialization'. Keep it above line ~576.
  // ONE writer, so every money-affecting path bounds and persists identically.
  // Append-only: a correction is a new entry, never an edit to an old one.
  const recordAudit = useCallback((entries) => {
    if (!entries || !entries.length) return;
    setAuditLog(prev => {
      const next = appendAudit(prev, entries);
      saveJSON(AUDIT_LOG_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  // Boot notice. Distinct from `error` (which renders as a "tap to retry
  // saving" button, the wrong affordance for good news) and from `exportMsg`
  // (which self-clears in 2.5s — too fast for a message about money moving).
  // Dismissed by tap, not by timer: a silent cost rewrite is exactly the
  // failure mode this whole task exists to end, so the telling can't expire
  // before Kevin has read it.
  const [notice, setNotice] = useState(null);
  const [showReceiptScan, setShowReceiptScan] = useState(false);
  const [debugScan, setDebugScan] = useState(false);
  const [showPendingIdx, setShowPendingIdx] = useState(null);
  const [checkingForm, setCheckingForm] = useState(false);
  const [parsedNotes, setParsedNotes] = useState({});
  const [parsingNotes, setParsingNotes] = useState(null);
  const [regulars, setRegulars] = useState([]);
  const [inventory, setInventory] = useState({});
  const [linkPrompt, setLinkPrompt] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  // V1/V2/V3: orders-list sort, status filter, search, and per-section
  // windowing. One shared helper (listControls.js) behind all three; the
  // list itself stays exactly as fast at 300 orders as it is at 30.
  const [orderSort, setOrderSort] = useState('newest');
  const [orderStatusFilter, setOrderStatusFilter] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllDelivered, setShowAllDelivered] = useState(false);
  // V4: bulk actions. selectMode is off by default so the list looks and
  // behaves exactly as it always has until Kevin asks for it — the
  // checkboxes are not in the way of the normal one-order-at-a-time flow.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // ── Boot hydration ────────────────────────────────────────────────────────
  // The whole pass lives in bootHydrate.js. It is ONE function on purpose:
  // several of these loads feed each other (ingredients -> costHistory, the
  // dishNotes fold into the journal, orders -> the house backfill's rewrite),
  // so the order is load-bearing and splitting it into per-key effects would
  // race them. The header comment there spells out each dependency.
  //
  // The mounted flag stays HERE, owned by the effect that can actually clean
  // it up, and is passed down as a predicate rather than a snapshot value —
  // a boolean would be read once and be wrong forever after unmount.
  useEffect(() => {
    let mounted = true;
    hydrateFromStorage({
      isMounted: () => mounted,
      setLoading, setError, setOrders, setCookChecks, setDeliverChecks,
      setJournal, setLastSeenWeek, setContainerConfig, setWeekLedger,
      setCopiesNote, setArchiveHistory, setDishFeedback, setPipelineJournal,
      setShopping, setBooted, setWeekDishes, setPendingOrders, setRegulars,
      setInventory, setIngredientsDb, setCostHistory, setReceiptAliases,
      setAuditLog, setNotice,
      handledPendingRef, pollFormOrders, pollWorkerPending,
    });
    return () => { mounted = false; };
  }, []);

  // ── Order, regular, and inventory operations ─────────────────────────────
  // Bodies live in orderOps.js. Each wrapper below keeps the dependency array
  // the original useCallback had, so hook count, hook order, and every
  // function identity a child component sees are unchanged by the split.
  const persistOrders = useCallback(async (next) => ops.persistOrders(next, { setOrders, setError }), []);

  // Shopping is not an order operation and stays here: it has exactly one
  // writer and no domain logic worth moving.
  const persistShopping = useCallback((next) => {
    setShopping(next);
    saveJSON(SHOPPING_KEY, next).then(res => setError(saveError(res)));
  }, []);

  const saveOrder = useCallback((order) => ops.saveOrder(order, {
    regulars, setOrders, setInventory, setError, setFormMode,
  }), [regulars]);

  const importOrders = useCallback((parsedOrders) => ops.importOrders(parsedOrders, {
    setOrders, setError, setShowCsv, setExportMsg,
  }), []);

  const checkFormNow = React.useCallback(async () => {
    setCheckingForm(true);
    try {
      alert('Fetching from: ' + FORM_CSV_URL);
      const rows = await fetchFormRows();
      alert('Done. rows=' + (rows === null ? 'null' : Array.isArray(rows) ? rows.length : typeof rows));
      if (!rows) { setCheckingForm(false); return; }
      const seenRaw = await loadJSON(SEEN_ROWS_KEY, {});
      const seen = seenRaw || {};
      const newPending = [];
      rows.forEach(row => {
        const ts = row['Timestamp'] || row['timestamp'] || '';
        if (!ts || seen[ts]) return;
        const { customer, items, notes } = parseFormRow(row);
        if (items.length === 0 && !notes) return;
        newPending.push({
          pendingId: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2),
          timestamp: ts,
          customer,
          items,
          notes,
        });
        seen[ts] = true;
      });
      if (newPending.length > 0) {
        setPendingOrders(prev => {
          const updated = [...prev, ...newPending];
          saveJSON(PENDING_KEY, updated);
          return updated;
        });
        await saveJSON(SEEN_ROWS_KEY, seen);
      } else {
        await saveJSON(SEEN_ROWS_KEY, seen);
      }
    } catch(e) { alert('ERROR: ' + e.message); }
    setCheckingForm(false);
  }, []);

  const resetRecentSeenRows = React.useCallback(async () => {
    const seenRaw = await loadJSON(SEEN_ROWS_KEY, {});
    const seen = seenRaw || {};
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let removed = 0;
    const updated = {};
    Object.entries(seen).forEach(([ts, val]) => {
      const parsed = new Date(ts);
      if (!isNaN(parsed.getTime()) && parsed.getTime() >= cutoff) {
        removed++;
      } else {
        updated[ts] = val;
      }
    });
    await saveJSON(SEEN_ROWS_KEY, updated);
    alert('Reset ' + removed + ' recent order' + (removed !== 1 ? 's' : '') + ' from seen history. Tap "Check for new orders" to re-import them.');
  }, []);

  const pollFormOrders = React.useCallback(async (existingOrders, existingPending) => {
    const rows = await fetchFormRows();
    if (!rows) return;
    const seenRaw = await loadJSON(SEEN_ROWS_KEY, {});
    const seen = seenRaw || {};
    const newPending = [];
    rows.forEach(row => {
      const ts = row['Timestamp'] || row['timestamp'] || '';
      if (!ts || seen[ts]) return;
      const { customer, items, notes } = parseFormRow(row);
      if (items.length === 0 && !notes) return;
      newPending.push({
        pendingId: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        timestamp: ts,
        customer,
        items,
        notes,
      });
      seen[ts] = true;
    });
    if (newPending.length > 0) {
      const updated = [...existingPending, ...newPending];
      setPendingOrders(updated);
      await saveJSON(PENDING_KEY, updated);
      await saveJSON(SEEN_ROWS_KEY, seen);
    } else {
      await saveJSON(SEEN_ROWS_KEY, seen);
    }
    setTimeout(() => pollFormOrders(existingOrders, existingPending), 5 * 60 * 1000);
  }, []);

  const workerPollRef = React.useRef(null);
  const pollWorkerPending = React.useCallback(async (reschedule = true) => {
    try {
      const res = await fetch(PENDING_POLL_URL, { cache: 'no-store', headers: { 'X-LTB-Token': PUBLISH_TOKEN } });
      if (res.ok) {
        const data = await res.json();
        const submissions = (data && data.pending) || [];
        if (submissions.length > 0) {
          const mapped = submissions.map(s => ({
            pendingId: s.id,
            timestamp: s.submittedAt || new Date().toISOString(),
            customer: s.customer || 'Unknown',
            address: s.address || '',
            phone: s.phone || '',
            items: Array.isArray(s.items) ? s.items.map(it => ({
              name: it.name, variant: it.variant, qty: it.qty || 1,
              price: it.price, cost: it.cost || 0,
              note: it.note || '', hasPhoto: false,
              // Preserve customer-selected options (spice level, pasta shape).
              // These were being dropped here, so spice/pasta never reached the
              // order card even though the form sent them correctly.
              ...(it.options ? { options: it.options } : {}),
              // At-cost add-on requests (parm block, fixings): normalize to
              // pending line items — cost unknown until Kevin shops, exactly
              // like the weight system. normalizeAddons dedupes + sanitizes.
              ...((() => { const a = normalizeAddons(it.addons); return a ? { addons: a } : {}; })()),
              ...(it.perLb ? { perLb: it.perLb } : {}),
              ...(it.avgWeightLb != null ? { avgWeightLb: it.avgWeightLb } : {}),
            })) : [],
            notes: s.notes || '',
          }));
          setPendingOrders(prev => {
            const have = new Set((prev || []).map(p => p.pendingId));
            const handled = handledPendingRef.current || {};
            const fresh = mapped.filter(m => !have.has(m.pendingId) && !handled[m.pendingId]);
            if (fresh.length === 0) return prev;
            const updated = [...(prev || []), ...fresh];
            saveJSON(PENDING_KEY, updated);
            return updated;
          });
          // Do NOT clear the worker here. The worker is the durable queue; an
          // order leaves it only when Kevin accepts or rejects it (see
          // dismissPending). Poll is a pure idempotent sync, so a failed local
          // save, a reload, or a restore-over-pending can no longer lose an
          // order the worker had already deleted. Re-syncing a still-queued
          // order is harmless: dedup skips anything already in local pending or
          // in the handled ledger.
        }
      }
    } catch (e) {}
    if (reschedule) {
      if (workerPollRef.current) clearTimeout(workerPollRef.current);
      workerPollRef.current = setTimeout(() => pollWorkerPending(true), 2 * 60 * 1000);
    }
  }, []);

  const checkWorkerNow = React.useCallback(async () => {
    setCheckingForm(true);
    await pollWorkerPending(false);
    setCheckingForm(false);
  }, [pollWorkerPending]);

  // Publish history: the config drives the entire customer surface and had no
  // undo. The worker keeps the last few; these two just read and restore.
  const fetchConfigHistory = React.useCallback(async () => {
    const res = await fetch(`${WORKER_BASE}/config-history?token=${encodeURIComponent(PUBLISH_TOKEN)}`);
    if (!res.ok) throw new Error('Could not load publish history.');
    return res.json();
  }, []);
  const restoreConfig = React.useCallback(async (index) => {
    const res = await fetch(`${WORKER_BASE}/config-restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: PUBLISH_TOKEN, index }),
    });
    if (!res.ok) throw new Error('Restore failed.');
    return res.json();
  }, []);

  const publishWeek = React.useCallback(async (currentWeekDishes, menuPdfUrl, weekLabel, pausedOpts, extras) => {
    const activeMenu = buildMenu(currentWeekDishes || []);
    const toVariants = (item) => {
      const info = PER_LB_ITEMS[item.name];
      if (info) {
        return {
          name: item.name,
          perLb: true,
          pricePerLb: info.pricePerLb,
          avgWeightLb: info.avgWeightLb,
          variants: [{ label: 'By weight', price: info.pricePerLb, cost: info.costPerLb }],
        };
      }
      return {
        name: item.name,
        variants: (item.variants || []).map(v => ({ label: v.label, price: v.price, cost: v.cost || 0 })),
        ...(item.spotlight ? { spotlight: true } : {}), // spotlight dinners route to their own form header
        ...(item.options ? { options: item.options } : {}), // form.html renders pickers from this (Batch 3)
        ...(item.diet ? { diet: item.diet } : {}), // menu.html dietary filter reads veg/pesc tags from this
      };
    };
    const allDinners = (activeMenu.dinner || []).map(toVariants);
    const req = (extras && extras.requestCounts) || {};
    // Customer favorites, earned from repeat orders and feedback rather than
    // declared. Computed at publish so the customer pages need no history.
    const favSet = new Set(((extras && extras.favorites) || []).map(f => f.name));
    const allDinnersTagged = allDinners.map(d => {
      let out = d;
      if (req[d.name] > 0) out = { ...out, requested: true };
      if (favSet.has(d.name)) out = { ...out, favorite: true };
      return out;
    });
    const dishes = allDinnersTagged.filter(d => !d.spotlight);
    const spotlight = allDinnersTagged.filter(d => d.spotlight);
    const fruit = (activeMenu.fruit || []).map(toVariants);
    const desserts = (activeMenu.desserts || []).map(toVariants);
    const addons = (activeMenu.addons || []).map(toVariants);
    const bag = (activeMenu.bag || []).map(toVariants);
    const sauces = (activeMenu.sauces || []).map(toVariants);
    const payload = {
      token: PUBLISH_TOKEN,
      dishes, spotlight, fruit, desserts, addons, bag, sauces,
      menuPdfUrl: menuPdfUrl || '',
      weekLabel: weekLabel || '',
      // One bottle that covers the week, computed from the registry's pairing
      // data at publish time so the customer pages need no drink logic.
      ...(() => { const ob = weekOneBottle(currentWeekDishes || []); return ob ? { oneBottle: ob } : {}; })(),
      // Week off: the form and menu page show a friendly notice instead of an
      // empty menu. Publishing a normal week clears it.
      ...(pausedOpts && pausedOpts.paused
        ? { paused: true, pausedMsg: String(pausedOpts.pausedMsg || '').slice(0, 200) }
        : { paused: false, pausedMsg: '' }),
      // The heads-up banner. This line is the fix for a feature that was
      // wired end to end EXCEPT here: WeekTab collected the message and
      // publishWeek dropped it on the floor, so it never reached the worker
      // and no customer page could have shown it. Always present, never
      // conditional — an unchecked box must publish '' to CLEAR last week's
      // banner, exactly like pausedMsg above.
      notice: extractNotice(pausedOpts, extras),
    };
    const res = await fetch(CONFIG_PUBLISH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Publish failed (' + res.status + '): ' + txt.slice(0, 120));
    }
    // The worker builds the stored config from its OWN field list and reports
    // anything it did not recognize. Surfacing that is the whole defense
    // against a class of bug that has now bitten three times (paused, notice,
    // oneBottle): a field fully built here, fully rendered on the customer
    // page, and silently discarded in transit. A publish that quietly loses
    // data must never look like a clean publish.
    // READ THE BODY EXACTLY ONCE. A Response body is a one-shot stream: this
    // function already ended with `return res.json()`, so adding a second read
    // here threw "body is disturbed or locked" AFTER the publish had actually
    // succeeded. That is the worst shape a bug can take, because it reports
    // failure for work that landed and teaches you to distrust the success
    // message. The parsed value is reused for both jobs below.
    let published = null;
    try {
      published = await res.json();
    } catch (_) { /* an unparseable body is not a failed publish */ }
    // Forward-only seasonal record. UPSERTED by business week, so publishing
    // three times in one week (menu, then omakase, then a notice) leaves one
    // row holding the final state rather than three rows to reconcile later.
    setWeekLedger(prev => {
      const next = recordWeek(prev, allDinners.map(d => d.name), new Date(),
        { paused: !!(pausedOpts && pausedOpts.paused) });
      saveJSON(WEEK_LEDGER_KEY, next);
      return next;
    });
    if (published && Array.isArray(published.dropped) && published.dropped.length) {
      setNotice(
        'Published, but the worker ignored ' + published.dropped.join(', ') +
        '. Those never reach the customer pages; the worker needs the field added to CONFIG_FIELDS.'
      );
    }
    // Publish the full dinner catalog as the request whitelist. Fire-and-forget:
    // a failure here must never block the week publish, and POST /requests just
    // rejects everything until the next successful write. Full ALL_DINNERS, not
    // this week's subset — customers request dishes that AREN'T on this week.
    try {
      await fetch(WORKER_BASE + '/requestable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: PUBLISH_TOKEN, dishes: ALL_DINNERS.map(d => d.name) }),
      });
    } catch (e) { /* non-fatal: week publish already succeeded */ }
    // Logged only on SUCCESS — a failed publish changed nothing customer-facing
    // and shouldn't leave a trail suggesting it did. Records WHEN a price set
    // went live, which is the other half of "why did a customer see that
    // price?" — the file-deploy entries say what the number became, this says
    // when it reached the form. Dish names only, no customer data.
    recordAudit([auditEntry({
      target: 'week',
      field: 'published',
      from: null,
      to: dishes.length + spotlight.length,
      source: SOURCES.PUBLISH,
      meta: {
        dishes: allDinners.map(d => d.name).slice(0, 40),
        ...(weekLabel ? { weekLabel: String(weekLabel).slice(0, 80) } : {}),
      },
    })]);
    return published; // already parsed above; never re-read res
  }, [recordAudit]);

  // ── Auto-fill regular contact info from incoming order ─────────────────────
  // Called after linking an order to a regular. If the regular has no address
  // or phone and the order does, fills in the blank fields and shows a banner.
  const autoFillRegularContact = useCallback((reg, order) => ops.autoFillRegularContact(reg, order, {
    updateRegular, setExportMsg,
  }), []);

  const acceptPending = useCallback((pending) => ops.acceptPending(pending, {
    handledPendingRef, regulars, setOrders, setError, adjustInventory,
    linkOrderToRegular, autoFillRegularContact, setLinkPrompt, dismissPending,
    setShowPendingIdx,
  }), [regulars, autoFillRegularContact]);

  const dismissPending = useCallback((pendingId) => ops.dismissPending(pendingId, {
    setPendingOrders, handledPendingRef, setShowPendingIdx,
  }), []);

  const persistRegulars = useCallback((next) => ops.persistRegulars(next, { setRegulars, setError }), []);

  const addRegular = useCallback((profile) => ops.addRegular(profile, { setRegulars, setError }), []);

  const updateRegular = useCallback((id, patch) => ops.updateRegular(id, patch, { setRegulars, setError }), []);

  const deleteRegular = useCallback((id) => ops.deleteRegular(id, { setRegulars, setError }), []);

  // ── STARTUP AUTOMATIONS (Jul 9): run once per session, silently. Feedback
  // pull only fires when any order carries a kitchenPageId; backfill is safe
  // by construction (exact/alias matches only — partials never auto-link).
  const startupRan = useRef(false);
  useEffect(() => {
    if (!booted || startupRan.current) return;
    startupRan.current = true;
    pullKitchenFeedback().catch(() => {}); // offline or v8 not deployed: silently skip
    if ((regulars || []).length && (orders || []).some(o => !o.regularId)) {
      try { runBackfill(); } catch (e) { /* silent */ }
    }
  }, [booted]);

  const linkOrderToRegular = useCallback((regularId, orderId) => ops.linkOrderToRegular(regularId, orderId, { setRegulars, setError }), []);

  const unlinkOrderFromRegular = useCallback((regularId, orderId) => ops.unlinkOrderFromRegular(regularId, orderId, { setRegulars, setError }), []);

  const adjustInventory = useCallback((key, delta) => ops.adjustInventory(key, delta, { setInventory, setError }), []);

  const setInventoryCount = useCallback((key, value) => ops.setInventoryCount(key, value, { setInventory, setError }), []);

  // ── Ingredient cost writers ──────────────────────────────────────────────
  // Bodies in ingredientOps.js. These are the money-writing paths, and all
  // three funnel through recordAudit so a cost can never move without a trail.
  const updateIngredients = useCallback((next) => ing.updateIngredients(next, {
    setIngredientsDb, setCostHistory, setError, recordAudit,
  }), [recordAudit]);

  // Phase 3 — receipt commit. Twin of updateIngredients, but stamps cost-history
  // points with the receipt's PURCHASE date (not the scan moment). `updates` is
  // [{ id, cost }] for accepted lines only. `purchaseDate` is an ISO 'YYYY-MM-DD'
  // string or null (fallback: now). Never touches baseline.
  const commitReceiptCosts = useCallback((updates, purchaseDate, newIngredients) =>
    ing.commitReceiptCosts(updates, purchaseDate, newIngredients, {
      setIngredientsDb, setCostHistory, setError, recordAudit,
    }), [recordAudit]);

  // Persist learned receipt aliases (merge + save).
  const saveReceiptAliases = useCallback((nextAliases) => ing.saveReceiptAliases(nextAliases, {
    setReceiptAliases, setError, recordAudit,
  }), [recordAudit]);

  const updateOrder = useCallback((id, patch) => ops.updateOrder(id, patch, { setOrders, setError }), []);

  // ── Make-a-regular star (OrderCard) ────────────────────────────────────────
  const makeRegularFromOrder = useCallback((order) => ops.makeRegularFromOrder(order, {
    addRegular, updateOrder,
  }), [addRegular, updateOrder]);

  // Link an order to an EXISTING regular from the star's near-miss chooser.
  // The order's name becomes an alias on the regular (non-destructive merge
  // mechanism) so all past and future orders under that name match too.
  const linkOrderWithAlias = useCallback((regularId, order) => ops.linkOrderWithAlias(regularId, order, {
    setRegulars, setError, updateOrder,
  }), [updateOrder]);

  // ── Merge / unmerge (non-destructive, reversible) ───────────────────────────
  const doMergeRegulars = useCallback((targetId, sourceId) => ops.doMergeRegulars(targetId, sourceId, {
    setRegulars, setOrders, setError,
  }), []);

  const doUnmergeRegular = useCallback((targetId, snapshotId) => ops.doUnmergeRegular(targetId, snapshotId, {
    setRegulars, setError,
  }), []);

  // ── Backfill pre-regulars orders (exact/alias auto; partial = suggestions) ──
  // Voice add-item: append a single-variant item to an order, repriced via
  // the same math every other item flows through (stamp totals via updateOrder).
  // ── CLOSE OUT THE WEEK (one tap): pull any last kitchen feedback, then
  // archive everything delivered. The ritual, automated.
  const closeOutWeek = useCallback(async () => fb.closeOutWeek({
    orders, pullKitchenFeedback, archiveDelivered,
  }), [orders]);

  // ── Kitchen feedback sync (triage flow, Jul 11) ────────────────────────────
  // Pulls tapped verdicts from the worker into a TRIAGE QUEUE (pendingFeedback).
  // Nothing is attached to orders and nothing is cleared on pull — each entry
  // is cleared from KV only when Kevin Saves or Ignores it (and only once all
  // entries sharing its pageId are triaged), so mid-triage app closes are safe.
  // ── Kitchen feedback sync ─────────────────────────────────────────────────
  // Bodies in feedbackSync.js. The rule that shapes them: an entry leaves
  // worker KV only once it AND every sibling sharing its pageId are triaged.
  const pullKitchenFeedback = useCallback(async () => fb.pullKitchenFeedback({ setPendingFeedback }), []);

  // Clear a pageId from worker KV once no queued entries reference it.
  const clearPageIfDone = useCallback(async (queue, pageId) => fb.clearPageIfDone(queue, pageId), []);

  // Save one triaged entry to the per-dish store. mode: 'tally' | 'tallyNote'.
  const saveFeedbackEntry = useCallback((entry, mode) => fb.saveFeedbackEntry(entry, mode, {
    setDishFeedback, setPendingFeedback, setError, clearPageIfDone,
  }), [clearPageIfDone]);

  const ignoreFeedbackEntry = useCallback((entry) => fb.ignoreFeedbackEntry(entry, {
    setPendingFeedback, clearPageIfDone,
  }), [clearPageIfDone]);

  // Reset one dish's live tally (archives current tally+notes to history first).
  const resetDishFeedbackTally = useCallback((dish) => fb.resetDishFeedbackTally(dish, {
    setDishFeedback, setError,
  }), []);

  // Resolve a backfill near-miss inline: link an order (by id, archived or
  // not) to the chosen regular, reusing the alias-merge mechanism so the
  // order's name is remembered on that regular going forward.
  const linkSuggestionToRegular = useCallback((orderId, regularId) => ops.linkSuggestionToRegular(orderId, regularId, {
    orders, linkOrderWithAlias,
  }), [orders, linkOrderWithAlias]);

  const runBackfill = useCallback(() => ops.runBackfill({
    regulars, orders, setOrders, setRegulars, setError,
  }), [regulars, orders]);

  const deleteOrder = useCallback((id) => ops.deleteOrder(id, { setOrders, setError }), []);

  const archiveDelivered = useCallback(() => ops.archiveDelivered({
    orders, persistOrders,
  }), [orders, persistOrders]);

  // ── V4: bulk actions ──────────────────────────────────────────────────────
  // ONE state commit and ONE localStorage write for N orders, never N
  // sequential updateOrder calls: N writes would be N chances to hit the
  // quota guard halfway through, leaving some orders marked and some not
  // with no record of where it stopped. Idempotent by construction — an
  // order already in the target state is returned untouched, so a
  // double-tap can never double-apply.
  const bulkUpdateOrders = useCallback((ids, patch) => ops.bulkUpdateOrders(ids, patch, {
    orders, persistOrders,
  }), [orders, persistOrders]);

  // House orders are $0 and never enter the books, so "mark paid" is
  // meaningless for them — they are filtered out at the selection layer
  // (see selectableOrders) rather than silently skipped here, so the count
  // Kevin sees on the button is the count that actually changes.
  const bulkMarkPaid = useCallback((ids) => bulkUpdateOrders(ids, { paid: true }), [bulkUpdateOrders]);
  const bulkArchive = useCallback((ids) => bulkUpdateOrders(ids, { archived: true }), [bulkUpdateOrders]);

  const [exportMsg, setExportMsg] = useState(null);

  // ── Backup payload + online backup ring (v9.20) ──────────────────────────
  // The payload's shape, and the reason each store is in it, now live in
  // backupRestore.js. This stays a useCallback with the SAME dep list because
  // pushBackup holds it in a ref and re-reads it on every 15-minute tick: the
  // identity of this function is what tells that effect the state moved.
  const buildBackupPayload = useCallback(() => buildPayload({
    orders, shopping, weekDishes, regulars, inventory, ingredientsDb,
    costHistory, receiptAliases, auditLog, pipelineJournal, journal,
    containerConfig, weekLedger, copiesNote,
    archiveHistory,
    handledPending: handledPendingRef.current,
  }), [orders, shopping, weekDishes, regulars, inventory, ingredientsDb, costHistory, receiptAliases, auditLog, pipelineJournal, journal, containerConfig, weekLedger, copiesNote, archiveHistory]);

  const copyBackupToClipboard = useCallback(async () => {
    const json = JSON.stringify(buildBackupPayload(), null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setExportMsg('Copied! Paste into Notes or anywhere to save.');
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = json;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setExportMsg('Copied! Paste into Notes or anywhere to save.');
      } catch {
        setExportMsg('Could not copy automatically. Try the export from Safari (not home screen).');
      }
    }
    setTimeout(() => setExportMsg(null), 4000);
  }, [buildBackupPayload]);

  const downloadBackupFile = useCallback(() => {
    try {
      const payload = buildBackupPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ltb-backup-' + payload.exportedAt.slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      setExportMsg('Backup file saved.');
      setTimeout(() => setExportMsg(null), 4000);
    } catch {
      setExportMsg('Could not save a file here — use Copy to clipboard instead.');
      setTimeout(() => setExportMsg(null), 4000);
    }
  }, [buildBackupPayload]);

  // Auto-push: silent backup to the worker's KV ring on app open, every
  // 15 minutes while open, and when the app goes to the background (iOS
  // kills timers in background — the visibilitychange push captures the
  // latest state on the way out). Hash-throttled: the hash EXCLUDES
  // exportedAt (which changes every call), so a no-op state pushes nothing.
  // Never fires before the initial load completes, and never pushes a
  // fully-empty state (that's either a brand-new install with nothing worth
  // backing up, or a broken load that must not enter the ring).
  const lastPushedHash = useRef(null);
  const payloadRef = useRef(buildBackupPayload);
  useEffect(() => { payloadRef.current = buildBackupPayload; }, [buildBackupPayload]);

  // ── Backup health (v9.21) ─────────────────────────────────────────────────
  // pushBackup() swallows every failure on purpose, and that silence ran a
  // dead /backup route for nine days without one visible symptom. The retry
  // loop still shouldn't interrupt anything, so the failure doesn't get a
  // dialog. It gets the backup arrow in the header, in red. Both header arrows
  // are normally grey, so one turning red is noticeable without being readable.
  const lastOkAtRef = useRef(null);
  const [backupFailing, setBackupFailing] = useState(false);

  useEffect(() => {
    loadJSON(BACKUP_STATE_KEY, null).then(s => {
      if (s && typeof s.lastOkAt === 'number') lastOkAtRef.current = s.lastOkAt;
    }).catch(() => {});
  }, []);

  const markBackupOk = useCallback(() => {
    lastOkAtRef.current = Date.now();
    setBackupFailing(false);
    saveJSON(BACKUP_STATE_KEY, { lastOkAt: lastOkAtRef.current }).catch(() => {});
  }, []);

  // Red only once the gap is real. lastOkAt === null means this device has
  // never had a confirmed backup, which IS the alarm condition — that is the
  // exact state the app sat in from July 6 while reporting nothing.
  const markBackupFailed = useCallback(() => {
    const last = lastOkAtRef.current;
    setBackupFailing(last === null || (Date.now() - last) > BACKUP_STALE_MS);
  }, []);

  const pushBackup = useCallback(async () => {
    try {
      const payload = payloadRef.current();
      // EC-4: skip the push whenever there are no orders, not only when BOTH
      // orders and costHistory are empty. costHistory is effectively permanent,
      // so the old AND-guard let every post-wipe (or post-archive-to-empty)
      // state push a 0-order snapshot into the most-recent ring slot. Over days
      // that evicts the good buckets. A 0-order state has nothing worth saving,
      // so it never enters the ring.
      if ((payload.orders || []).length === 0) return;
      const { exportedAt, ...stable } = payload;
      const hash = String(djb2(JSON.stringify(stable)));
      // Hash match = the ring already holds exactly this data. That's a
      // confirmation, not a gap, so it counts as backed up. Otherwise an idle
      // week would slowly turn the icon red while nothing was wrong.
      if (hash === lastPushedHash.current) { markBackupOk(); return; }
      // postBackupSnapshot swallows its own transport errors and reports a
      // plain boolean, because a thrown fetch and a 500 mean the same thing
      // here: not backed up. The outer catch stays anyway, since djb2 and
      // JSON.stringify above it can still throw on a pathological payload.
      const ok = await postBackupSnapshot(payload);
      if (ok) { lastPushedHash.current = hash; markBackupOk(); }
      else markBackupFailed();
    } catch {
      // Offline or worker down. Next tick retries; the arrow carries the news.
      markBackupFailed();
    }
  }, [markBackupOk, markBackupFailed]);

  useEffect(() => {
    if (loading) return;
    pushBackup(); // on-open push, once data is actually loaded
    const tick = setInterval(pushBackup, 15 * 60 * 1000);
    const onVis = () => { if (document.visibilityState === 'hidden') pushBackup(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', onVis); };
  }, [loading, pushBackup]);

  // ── Shared restore body (v9.20) ───────────────────────────────────────────
  // The implementation moved to backupRestore.js; this is the binding that
  // hands it the setters. Still the ONE choke point every restore path goes
  // through, and the schema forward-compat guard still lives inside it. Do
  // not give any caller a way around this function.
  //
  // The dep list is [persistOrders] and nothing else, matching the original
  // exactly. Every other setter is a stable useState setter or a ref, so
  // React guarantees their identity across renders and naming them would
  // only add churn without adding correctness.
  const applyBackupPayload = useCallback(async (payload) => applyPayload(payload, {
    persistOrders, setShopping, setWeekDishes, setRegulars, setInventory,
    setPipelineJournal, setJournal, setCopiesNote, setWeekLedger,
    setContainerConfig, setIngredientsDb, setCostHistory, setReceiptAliases,
    setAuditLog, setError, setExportMsg, setNotice, handledPendingRef,
  }), [persistOrders]);


  // ── Online restore (v9.20) ────────────────────────────────────────────────
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupList, setBackupList] = useState(null); // null=loading, []=none, 'error'=unreachable

  const openBackupModal = useCallback(async () => {
    setShowBackupModal(true);
    setBackupList(null);
    // fetchBackupList resolves to the array or the 'error' sentinel and never
    // rejects, so the three modal states map straight onto its return value.
    setBackupList(await fetchBackupList());
  }, []);

  const restoreFromOnline = useCallback(async (age) => {
    try {
      const { ok: fetchOk, body: j } = await fetchBackupSnapshot(age);
      if (!fetchOk || !j.snapshot) {
        setError(j.error || 'Could not fetch that backup.');
        return;
      }
      const snap = j.snapshot;
      if (!snap.version || !Array.isArray(snap.orders)) {
        setError("That online backup doesn't look right. Nothing was changed.");
        return;
      }
      // Preview-before-apply: real timestamp, real counts, explicit warning.
      const ok = window.confirm(
        `Restore backup from ${relativeAge(j.timestamp)} (${formatDate(j.timestamp)})?\n\n` +
        `It has ${snap.orders.length} orders — you currently have ${(orders || []).length}.\n\n` +
        `This REPLACES what's on this device. Anything newer than that backup will be lost.`
      );
      if (!ok) return;
      const applied = await applyBackupPayload(snap);
      if (applied) setShowBackupModal(false);
    } catch {
      setError('Could not reach the backup server.');
    }
  }, [orders, applyBackupPayload]);

  const importData = useCallback(async (e) => {
    let json;
    if (typeof e === 'string') {
      json = e;
    } else {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      e.target.value = '';
      json = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = ev => res(ev.target.result);
        r.onerror = () => rej(new Error('Could not read file'));
        r.readAsText(file);
      });
    }
    try {
      const payload = JSON.parse(json);
      if (!payload.version || !Array.isArray(payload.orders)) {
        setError("That doesn't look like an LTB backup. Nothing was changed.");
        return;
      }
      const ok = window.confirm(
        `Import ${payload.orders.length} orders from ${payload.exportedAt?.slice(0, 10) || 'backup'}?\n\nThis will replace your current orders.`
      );
      if (!ok) return;
      await applyBackupPayload(payload);
    } catch {
      setError("Couldn't read that backup — make sure you copied the full text.");
    }
  }, [applyBackupPayload]);

  const [showImportModal, setShowImportModal] = useState(false);

  const pasteImport = useCallback(() => {
    setShowImportModal(true);
  }, []);

  const submitImport = useCallback(async (text) => {
    setShowImportModal(false);
    if (!text.trim()) return;
    try {
      const payload = JSON.parse(text.trim());
      if (!payload.version || !Array.isArray(payload.orders)) {
        setError("That doesn't look like an LTB backup. Nothing was changed.");
        return;
      }
      await applyBackupPayload(payload);
    } catch {
      setError("Couldn't read that — make sure you copied the full backup text.");
    }
  }, [applyBackupPayload]);

  const currentOrders = useMemo(() => (orders || []).filter(o => !o.archived), [orders]);
  const activeOrders = useMemo(() => currentOrders.filter(o => o.status !== 'Delivered'), [currentOrders]);
  const deliveredOrders = useMemo(() => currentOrders.filter(o => o.status === 'Delivered'), [currentOrders]);

  // V1/V2/V3: the same pipeline for both sections — status filter (active
  // section only; "Delivered" is itself a status, so the filter would be a
  // no-op there and just confuses the control), search, sort, then window.
  // Search and sort apply to both, since a name search should find someone
  // whether they're still cooking or already delivered.
  const visibleActiveOrders = useMemo(() => {
    const filtered = filterByStatus(activeOrders, orderStatusFilter);
    const searched = searchList(filtered, orderSearch, orderHaystacks);
    return sortList(searched, orderSort);
  }, [activeOrders, orderStatusFilter, orderSearch, orderSort]);
  const activeWindow = useMemo(
    () => windowList(visibleActiveOrders, showAllActive ? null : DEFAULT_WINDOW),
    [visibleActiveOrders, showAllActive]
  );

  const visibleDeliveredOrders = useMemo(() => {
    const searched = searchList(deliveredOrders, orderSearch, orderHaystacks);
    return sortList(searched, orderSort);
  }, [deliveredOrders, orderSearch, orderSort]);
  const deliveredWindow = useMemo(
    () => windowList(visibleDeliveredOrders, showAllDelivered ? null : DEFAULT_WINDOW),
    [visibleDeliveredOrders, showAllDelivered]
  );

  // P3: arm scroll restoration on any action that changes the order list.
  // Keyed on the count, since that is what changes the page height and thus
  // what moves Kevin's place out from under him.
  const preserveScroll = usePreserveScroll((orders || []).length);

  // ── V4 selection ──────────────────────────────────────────────────────────
  // Selection is scoped to what is VISIBLE. Selecting "all" while a search
  // is active must mean "all six of these", never "all three hundred
  // including the ones filtered out of sight" — a bulk action that reaches
  // past the filter is how someone marks the wrong orders paid.
  // House orders are excluded outright: they are $0 and never enter the
  // books, so "mark paid" is meaningless for them, and including them would
  // make the button's count lie about what it is going to change.
  const selectableActive = useMemo(
    () => activeWindow.shown.filter(o => !isHouseOrder(o)),
    [activeWindow]
  );
  const selectedCount = selectedIds.size;
  const toggleSelected = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(selectableActive.map(o => o.id)));
  }, [selectableActive]);
  // Leaving select mode always clears the selection: a stale selection
  // surviving out of sight is exactly how a later bulk tap hits orders
  // Kevin forgot were checked.
  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);
  const runBulk = useCallback((fn) => {
    preserveScroll();
    fn(selectedIds);
    setSelectedIds(new Set());
    setSelectMode(false);
  }, [preserveScroll, selectedIds]);

  // Money headline numbers exclude house orders. NOTE the filter is here and
  // NOT on currentOrders: the Week tab, cook schedule, shopping list, labels,
  // and packing slips all read currentOrders and MUST still see her orders —
  // you still buy the food and cook it. Only the money is blind to her.
  const stats = useMemo(() => {
    const billable = currentOrders.filter(o => !isHouseOrder(o));
    const booked = billable.reduce((s, o) => s + o.total, 0);
    const unpaid = billable.filter(o => !o.paid).reduce((s, o) => s + o.total, 0);
    return { active: activeOrders.length, booked: round2(booked), unpaid: round2(unpaid) };
  }, [currentOrders, activeOrders]);

  const activeFinancials = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    activeOrders.forEach(o => {
      if (isHouseOrder(o)) return; // free, and her ingredients are a household expense
      revenue += o.total;
      cost += orderCostInfo(o).cost;
    });
    return { revenue: round2(revenue), cost: round2(cost), profit: round2(revenue - cost) };
  }, [activeOrders]);

  // T1: deadline countdown + this-week intake vs the trailing median. Reads
  // from ALL currentOrders (archived still counts, matching the Money tab's
  // own "archived still counts as revenue" rule), not just activeOrders.
  const deadlineMs = useMemo(() => msUntilDeadline(now), [now]);
  const intake = useMemo(() => intakeVsMedian(currentOrders, now, 5), [currentOrders, now]);

  // T2: has the business week rolled over since this device last saw it?
  const weekRollover = useMemo(() => weekRolledOver(lastSeenWeek, now), [lastSeenWeek, now]);

  // M1: the Sunday container check. Demand from every undelivered order,
  // availability from owned counts (jars via the ledger).
  const containerStatus = useMemo(
    () => containerReport(orders || [], regulars || [], containerConfig),
    [orders, regulars, containerConfig]
  );

  const recentCustomers = useMemo(() => {
    const seen = new Set();
    const names = [];
    for (const o of orders || []) {
      const name = (o.customer || '').trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        names.push(name);
      }
      if (names.length >= 6) break;
    }
    return names;
  }, [orders]);

  // Category is DERIVED from the menu by name rather than trusted from the
  // item, and the key is name + variant only. Orders from the customer form
  // do not carry the same category value manual entries do, so the old key
  // split one dish across two lines with two counts. See cookList.js.
  const cookingList = useMemo(
    () => buildCookList(activeOrders, FULL_MENU, Object.keys(CATEGORY_LABELS)),
    [activeOrders]
  );

  const deliverList = useMemo(() => {
    const catOrder = Object.keys(CATEGORY_LABELS);
    return activeOrders.map(o => {
      const items = (o.items || []).map((it, i) => ({
        key: `${o.id}::${i}`,
        category: it.category,
        name: it.name,
        variant: it.variant,
        qty: it.qty,
      })).sort(
        (a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || a.name.localeCompare(b.name)
      );
      return { orderId: o.id, customer: o.customer || 'Unnamed', items };
    }).filter(grp => grp.items.length > 0)
      .sort((a, b) => a.customer.localeCompare(b.customer));
  }, [activeOrders]);

  const toggleCheck = useCallback((key) => {
    setCookChecks(prev => {
      const next = { ...prev, [key]: !prev[key] };
      const validKeys = new Set(cookingList.map(it => it.key));
      Object.keys(next).forEach(k => { if (!validKeys.has(k)) delete next[k]; });
      saveJSON(CHECKS_KEY, next);
      return next;
    });
  }, [cookingList]);

  const resetChecks = useCallback(() => {
    setCookChecks({});
    saveJSON(CHECKS_KEY, {});
  }, []);

  const toggleDeliverCheck = useCallback((key) => {
    setDeliverChecks(prev => {
      const next = { ...prev, [key]: !prev[key] };
      const validKeys = new Set();
      deliverList.forEach(grp => grp.items.forEach(it => validKeys.add(it.key)));
      Object.keys(next).forEach(k => { if (!validKeys.has(k)) delete next[k]; });
      saveJSON(DELIVER_CHECKS_KEY, next);
      return next;
    });
  }, [deliverList]);

  const resetDeliverChecks = useCallback(() => {
    setDeliverChecks({});
    saveJSON(DELIVER_CHECKS_KEY, {});
  }, []);

  // Journal writer: accepts the next store OR an updater fn, same contract as
  // savePipelineJournal. Writes surface quota failures through saveError —
  // this is the knowledge base, and a silent lost entry is the exact failure
  // the record exists to prevent.
  const pullQuestions = useCallback(async () => {
    const r = await fetch(WORKER_BASE + '/ask-log?token=' + encodeURIComponent(PUBLISH_TOKEN));
    if (!r.ok) throw new Error('ask-log ' + r.status);
    const { questions } = await r.json();
    setAskLog(Array.isArray(questions) ? questions : []);
    return (questions || []).length;
  }, []);

  const saveContainerConfig = useCallback((next) => {
    setContainerConfig(prev => {
      const cfg = normalizeContainerConfig(typeof next === 'function' ? next(prev) : next);
      saveJSON(CONTAINER_INVENTORY_KEY, cfg).then(r => setError(saveError(r)));
      return cfg;
    });
  }, []);

  const saveJournal = useCallback((next) => {
    setJournal(prev => {
      const j = normalizeJournal(typeof next === 'function' ? next(prev) : next);
      saveJSON(JOURNAL_KEY, j).then(r => setError(saveError(r)));
      return j;
    });
  }, []);

  // Pipeline journal: full-object replace, matching the localStorage-JSON pattern.
  // RecipesTab hands back the whole next-state (add entry, set status, etc).
  const savePipelineJournal = useCallback((nextEntries) => {
    setPipelineJournal(prev => {
      const next = { version: 1, entries: typeof nextEntries === 'function' ? nextEntries(prev.entries || {}) : nextEntries };
      saveJSON(PIPELINE_JOURNAL_KEY, next);
      return next;
    });
  }, []);

  const menu = useMemo(() => buildMenu(weekDishes), [weekDishes]);

  // Every name the app still serves, for the K8 retirement nudge: anything
  // people ORDERED that falls outside this set is a dish that left the menu.
  // FULL_MENU is the whole catalog (dinners + always items, per-lb included),
  // so retired ALWAYS items nudge too — a dessert that left has a story just
  // as much as a dinner does. Static registry, so no deps.
  // Names the coverage map walks. Same set the Recipes picker offers, so
  // coverage measures exactly what Kevin can actually write about.
  const reportableDishNames = useMemo(() => reportableDishes(), []);
  const knownDishNames = useMemo(() => new Set(Object.values(FULL_MENU).flat().map(m => m.name)), []);

  // Cost maps for live dish costing (Option B). baseline is static from the seed;
  // live reflects the current edited ingredient costs.
  // Omakase whose final price is still sitting at the customer's max: the
  // deliver pass is the last honest moment to settle it.
  const undecidedOma = useMemo(() => undecidedOmakases(orders || []), [orders]);
  const omakaseUnconfirmed = useMemo(() => {
    const out = [];
    for (const o of (orders || [])) {
      if (o.archived) continue;
      if (!omakasePriceUnsettled(o)) continue;
      for (const it of (o.items || [])) {
        if (it.omakase && !it.priceConfirmed) out.push({ orderId: o.id, customer: o.customer, price: it.price || 0 });
      }
    }
    return out;
  }, [orders]);
  const confirmOmakasePrice = useCallback((orderId) => {
    setOrders(prev => {
      const next = (prev || []).map(o => (o.id === orderId
        ? { ...o, items: (o.items || []).map(it => (it.omakase ? { ...it, priceConfirmed: true } : it)) }
        : o));
      saveJSON(ORDERS_KEY, next);
      return next;
    });
  }, []);

  const baseCostMap = useMemo(() => baselineCostMap(), []);
  const liveCostMap = useMemo(() => liveCostMapFrom(ingredientsDb), [ingredientsDb]);
  // (id) => name lookup for the Money-tab margin-trend "driven by [ingredients]" line.
  const ingredientName = useMemo(() => {
    const m = new Map((ingredientsDb || []).map(i => [i.id, i.name]));
    return (id) => m.get(id) || id;
  }, [ingredientsDb]);
  // Money-tab badge: under-floor dishes only (not "watch") so the badge
  // means something and clears when the real problem is fixed, not when
  // every borderline dish happens to drift above 47%.
  const toggleWeekDish = useCallback((name) => {
    setWeekDishes(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name];
      saveJSON(WEEK_KEY, { selected: next }).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  const generateShopping = useCallback((staples) => {
    setShopping(prev => {
      const next = buildAutoShoppingRows(activeOrders, staples, prev, uid);
      saveJSON(SHOPPING_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, [activeOrders]);

  // NOTE (Jul 10, Kevin's explicit request): the shopping list is MANUAL-REFRESH
  // ONLY. Do NOT re-add any effect that auto-regenerates it when orders change.
  // Auto-regen wiped his in-progress list mid-shop (find an item missing today,
  // come back tomorrow, list rebuilt from scratch and lost his progress). The
  // list rebuilds ONLY when he taps the Refresh button. Leave it that way.

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingText}>Loading orders...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {storageFull && (
        <div style={{ background: '#3a1f22', borderBottom: '1px solid #E24B4A', padding: '9px 12px', fontSize: 12.5, color: '#ffd9d9', lineHeight: 1.5 }}>
          <b>Storage is full and changes are not saving.</b> Delete some order photos to free space, then reload. Nothing already saved has been lost.
        </div>
      )}
      {!storageFull && storageBytes > 4 * 1024 * 1024 && (
        <div style={{ background: 'rgba(212,160,80,0.10)', borderBottom: '1px solid #D4A050', padding: '7px 12px', fontSize: 12, color: '#e8ede9' }}>
          Storage is at {(storageBytes / (1024 * 1024)).toFixed(1)}MB of about 5MB. Order photos take the most room.
        </div>
      )}
      {swUpdate && (
        <div
          onClick={() => window.location.reload()}
          style={{ background: 'rgba(93,202,165,0.12)', borderBottom: '1px solid #5DCAA5', padding: '8px 12px', fontSize: 12.5, color: '#e8ede9', cursor: 'pointer' }}
        >
          A new version is ready. <b>Tap to reload.</b>
        </div>
      )}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.logoMark}>LTB</div>
          <div style={styles.headerCenter}>
            <div style={styles.title}>Order tracker</div>
            <div style={styles.subtitle}>Lettuce, Turnip, The Beet · v10.0-GH</div>
          </div>
          <div style={styles.headerActions}>
            {VAPID_PUBLIC_KEY && notifPerm !== 'granted' && notifPerm !== 'unsupported' && (
              <button
                style={{ ...styles.headerActionBtn, color: notifPerm === 'denied' ? '#993556' : GOLD }}
                onClick={enablePushNotifications}
                title={notifPerm === 'denied' ? 'Notifications blocked — enable in Settings' : 'Enable order notifications'}
              >
                <Bell size={16} />
              </button>
            )}
            <button
              style={{ ...styles.headerActionBtn, ...(backupFailing ? { color: '#E24B4A' } : {}) }}
              onClick={openBackupModal}
              title={backupFailing ? "Backups are failing — tap for detail" : "Backup & restore"}
            >
              <Download size={16} />
            </button>
            <button style={styles.headerActionBtn} onClick={pasteImport} title="Paste backup from clipboard">
              <Upload size={16} />
            </button>
          </div>
        </div>
        {exportMsg && <div style={styles.exportMsg}>{exportMsg}</div>}
        {notice && (
          <button
            onClick={() => setNotice(null)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
              background: '#2a2f2d', border: '1px solid ' + GOLD, borderRadius: 8,
              padding: '10px 12px', margin: '8px 0', color: '#F5F0E8',
              fontSize: 12, lineHeight: 1.45, font: 'inherit',
            }}
          >
            {notice}
            <span style={{ display: 'block', marginTop: 4, color: '#5F5E5A', fontSize: 11 }}>
              Tap to dismiss
            </span>
          </button>
        )}
        <nav style={{ borderBottom: '1px solid #2d3a36' }}>
          <div style={{ display: 'flex' }}>
            {[
              ['orders', 'Orders'],
              ['cook', 'Cook'],
              ['shop', 'Shop'],
              ['ingredients', 'Ingredients'],
            ].map(([key, label]) => (
              <button
                key={key}
                style={{ ...styles.tab, ...(view === key ? styles.tabActive : {}), flex: 1 }}
                onClick={() => setView(key)}
              >
                {label}
                {key === 'orders' && stats.active > 0 && <span style={styles.tabBadge}>{stats.active}</span>}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', borderTop: '1px solid #2d3a36' }}>
            {[
              ['money', 'Money'],
              ['regulars', 'Regulars'],
              ['recipes', 'Recipes'],
              ['record', 'Record'],
              ['week', 'Week'],
            ].map(([key, label]) => (
              <button
                key={key}
                style={{ ...styles.tab, ...(view === key ? styles.tabActive : {}), flex: 1, borderBottom: 'none' }}
                onClick={() => setView(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {error && (
        <button
          style={styles.errorBanner}
          onClick={async () => {
            const res = await saveJSON(ORDERS_KEY, orders || []);
            setError(saveError(res));
            if (res.ok) {
              setExportMsg('Saved.');
              setTimeout(() => setExportMsg(null), 2500);
            }
          }}
        >
          {error}
          <span style={styles.errorRetry}>Tap to retry saving</span>
        </button>
      )}
      {showImportModal && (
        <ImportModal onSubmit={submitImport} onCancel={() => setShowImportModal(false)} />
      )}
      {showBackupModal && (
        <BackupModal
          list={backupList}
          onRestore={restoreFromOnline}
          onRestoreFile={importData}
          onDownloadFile={downloadBackupFile}
          onCopy={copyBackupToClipboard}
          onClose={() => setShowBackupModal(false)}
        />
      )}

      {linkPrompt && (
        <LinkRegularPrompt
          order={linkPrompt.order}
          candidates={linkPrompt.candidates}
          onLink={(regularId) => {
            linkOrderToRegular(regularId, linkPrompt.order.id);
            const reg = regulars.find(r => r.id === regularId);
            if (reg) {
              const patch = { regularId };
              // House beats any lifetime discount: the flag means free.
              const housePatch = houseOrderPatch(reg);
              if (housePatch) {
                Object.assign(patch, housePatch);
                patch.total = orderTotal(linkPrompt.order.items, linkPrompt.order.jarSwaps, linkPrompt.order.containerReturns, 'percent', HOUSE_DISCOUNT_PERCENT, linkPrompt.order.customCharges, linkPrompt.order.waiveSurcharge);
              } else if (reg.discountPercent > 0) {
                patch.discountType = 'percent';
                patch.discountValue = reg.discountPercent;
                patch.total = orderTotal(linkPrompt.order.items, linkPrompt.order.jarSwaps, linkPrompt.order.containerReturns, 'percent', reg.discountPercent, linkPrompt.order.customCharges, linkPrompt.order.waiveSurcharge);
              }
              updateOrder(linkPrompt.order.id, patch);
              // Auto-fill blank address/phone on partial-match confirm
              autoFillRegularContact(reg, linkPrompt.order);
            }
            setLinkPrompt(null);
          }}
          onSkip={() => setLinkPrompt(null)}
        />
      )}

      <main style={styles.main}>
        {view === 'orders' && (
          <>
            {/* T2: week rollover — dismissed by tap, not silently, not by a
                timer (same rule as `notice` below: don't let the telling
                expire before Kevin has read it). */}
            {weekRollover.rolled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: 'rgba(93,202,165,0.10)', border: '1px solid #2f6f57', borderRadius: 10, padding: '9px 12px', marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, color: '#e8ede9' }}>New business week: {weekRollover.currentLabel}.</span>
                <button
                  onClick={() => markWeekSeen(weekRollover.currentStamp)}
                  style={{ minHeight: 32, padding: '4px 12px', borderRadius: 6, border: '1px solid #2f6f57', background: 'transparent', color: '#5DCAA5', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                >
                  Got it
                </button>
              </div>
            )}
            {/* M1: the Sunday check. Fires only on a genuine shortage —
                next week's pack needs more of a type than Kevin owns
                (jars: owns minus held). Silent otherwise. */}
            {containerStatus.shortages.length === 0 && (containerStatus.atRisk || []).length > 0 && (
              <div style={{ background: 'rgba(239,159,39,0.10)', border: '1px solid #EF9F27', borderRadius: 10, padding: '9px 12px', marginBottom: 10, fontSize: 12.5, color: '#e8ede9' }}>
                <b style={{ color: '#EF9F27' }}>Containers might be tight:</b>
                {' '}{containerStatus.atRisk.map(r => r.label).join(', ')}.
                {' '}{containerStatus.audit.unconfirmed.length} dinner{containerStatus.audit.unconfirmed.length === 1 ? '' : 's'} still
                {' '}count as one container each because their real composition has not been confirmed,
                {' '}so this week's demand is a floor, not a figure. Record tab &rarr; Container audit.
              </div>
            )}
            {containerStatus.shortages.length > 0 && (
              <div style={{ background: 'rgba(224,130,138,0.10)', border: '1px solid #e0828a', borderRadius: 10, padding: '9px 12px', marginBottom: 10, fontSize: 12.5, color: '#e8ede9' }}>
                <b style={{ color: '#e0828a' }}>Short on containers for this pack:</b>
                {' '}{containerStatus.shortages.map(s => `${s.label} — need ${s.need}, have ${s.have}`).join(' · ')}.
                {containerStatus.mealOut > 0 ? ` ${containerStatus.mealOut} meal container${containerStatus.mealOut !== 1 ? 's' : ''} still out with customers, some may come back before Wednesday.` : ''}
                {containerStatus.demandIsFloor ? ' The real number may be higher: unconfirmed dishes count as one container each.' : ''}
                {' '}Counts live in Money → Packaging.
              </div>
            )}
            {/* T1: Sunday deadline pressure + intake vs a normal week. Pure
                information, never blocking — Kevin already knows his own
                deadline; this just puts the countdown where he's looking. */}
            {deadlineMs > 0 && deadlineMs < 3 * 86400000 && (
              <div style={{ background: 'rgba(212,160,80,0.10)', border: '1px solid #D4A050', borderRadius: 10, padding: '9px 12px', marginBottom: 10, fontSize: 12.5, color: '#e8ede9' }}>
                <b style={{ color: '#D4A050' }}>Orders close in {formatCountdown(deadlineMs)}.</b>
                {' '}{intake.thisWeekCount} order{intake.thisWeekCount !== 1 ? 's' : ''} so far this week
                {intake.median != null ? (
                  intake.thisWeekCount < intake.median
                    ? `, below the usual ${intake.median} — a normal week still has time to catch up.`
                    : `, at or above the usual ${intake.median}.`
                ) : '.'}
              </div>
            )}
            <StatsBar stats={stats} />

            {!formMode && !showPaste && !showAmend && !showCsv && (
              <div style={styles.topActions}>
                <button style={styles.newOrderBtn} onClick={() => setFormMode('new')}>
                  <Plus size={18} />
                  New order
                </button>
                <button style={styles.pasteBtn} onClick={() => setShowPaste(true)}>
                  <ClipboardPaste size={18} />
                  Paste a text
                </button>
                <button style={styles.amendBtn} onClick={() => setShowAmend(true)}>
                  <Pencil size={16} />
                  Amend via text
                </button>
                {USE_LEGACY_CSV && (
                  <button style={styles.csvBtn} onClick={() => setShowCsv(true)}>
                    <FileText size={16} />
                    Import from sheet
                  </button>
                )}
                {USE_LEGACY_CSV && (
                  <button
                    style={styles.checkFormBtn}
                    onClick={checkFormNow}
                    onContextMenu={(e) => { e.preventDefault(); resetRecentSeenRows(); }}
                    onTouchStart={(e) => {
                      const t = setTimeout(() => resetRecentSeenRows(), 700);
                      e.currentTarget._ltbLongPress = t;
                    }}
                    onTouchEnd={(e) => { clearTimeout(e.currentTarget._ltbLongPress); }}
                    onTouchMove={(e) => { clearTimeout(e.currentTarget._ltbLongPress); }}
                    disabled={checkingForm}
                  >
                    <RotateCcw size={16} style={checkingForm ? styles.spinning : undefined} />
                    {checkingForm ? 'Checking...' : 'Check for new orders'}
                  </button>
                )}
              </div>
            )}

            {showPaste && (
              <PasteOrderCard
                menu={menu}
                onParsed={(draft) => { setShowPaste(false); setFormMode(draft); }}
                onCancel={() => setShowPaste(false)}
              />
            )}

            {showAmend && (
              <AmendOrderCard
                menu={menu}
                orders={activeOrders}
                onAmended={(draft) => { setShowAmend(false); setFormMode(draft); }}
                onCancel={() => setShowAmend(false)}
              />
            )}

            {showCsv && (
              <CsvImportCard
                menu={menu}
                onImport={importOrders}
                onCancel={() => setShowCsv(false)}
              />
            )}

            {formMode && (
              <OrderForm
                menu={menu}
                initial={formMode === 'new' ? null : formMode}
                recentCustomers={recentCustomers}
                regulars={regulars}
                orders={orders || []}
                weekDishes={weekDishes}
                perLbLiveCost={liveCostMap}
                onSave={saveOrder}
                onCancel={() => setFormMode(null)}
              />
            )}

            {activeOrders.length === 0 && !formMode && !showPaste && pendingOrders.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyTitle}>No active orders</div>
                <div style={styles.emptyBody}>Tap "New order" to build one, "Paste a text" to auto-read an order, or "Import from sheet" to pull in Google Form orders.</div>
              </div>
            )}

            {pendingFeedback.length > 0 && !formMode && !showPaste && !showCsv && (
              <div style={styles.pendingSection}>
                <div style={styles.pendingSectionHeader}>
                  <span style={{ ...styles.pendingBadge, background: GOLD, color: '#1a1a1a' }}>{pendingFeedback.length}</span>
                  <span style={styles.pendingSectionTitle}>Dish feedback</span>
                </div>
                {pendingFeedback.map(entry => (
                  <FeedbackCard key={entry.id} entry={entry} onSave={saveFeedbackEntry} onIgnore={ignoreFeedbackEntry} />
                ))}
              </div>
            )}

            {pendingOrders.length > 0 && !formMode && !showPaste && !showCsv && (
              <div style={styles.pendingSection}>
                <div style={styles.pendingSectionHeader}>
                  <span style={styles.pendingBadge}>{pendingOrders.length}</span>
                  <span style={styles.pendingSectionTitle}>Pending form order{pendingOrders.length !== 1 ? 's' : ''}</span>
                </div>
                {pendingOrders.map((p, idx) => (
                  showPendingIdx === idx ? (
                    <div key={p.pendingId} style={styles.pendingCard}>
                      <div style={styles.pendingCardHeader}>
                        <div style={styles.pendingCardName}>{p.customer}</div>
                        <div style={styles.pendingCardTime}>{p.timestamp}</div>
                        {(p.address || p.phone) && (
                          <div style={styles.pendingContactRow}>
                            {p.address && <span style={styles.pendingContact}>📍 {p.address}</span>}
                            {p.phone && <span style={styles.pendingContact}>📞 {p.phone}</span>}
                          </div>
                        )}
                      </div>
                      <div style={styles.pendingItemList}>
                        {p.items.map((it, i) => (
                          <div key={i} style={styles.pendingItem}>
                            <span style={styles.pendingItemName}>{it.name}</span>
                            {it.variant && <span style={styles.pendingItemVariant}> — {it.variant}</span>}
                            <span style={styles.pendingItemPrice}> ${it.price.toFixed(2)}</span>
                            {optionsSummary(it) && <span style={{ ...styles.pendingItemVariant, color: TEAL_LIGHT, fontWeight: 700 }}> · {optionsSummary(it)}</span>}
                            {noteWithoutOptions(it.note) && <span style={styles.pendingItemVariant}> · “{noteWithoutOptions(it.note)}”</span>}
                            {itemAddons(it).map((a, ai) => (
                              <div key={ai} style={{ ...styles.pendingItemVariant, display: 'block', marginLeft: 10, color: GOLD }}>
                                + {a.request} <span style={{ fontStyle: 'italic', opacity: 0.85 }}>(at cost, price pending)</span>
                              </div>
                            ))}
                          </div>
                        ))}
                        {(() => {
                          // Accept is the last moment a money mistake is cheap,
                          // and it was blind. Omakase carries cost 0 until it is
                          // logged, so it is held out of the margin rather than
                          // flattering it.
                          const items = p.items || [];
                          const priced = items.filter(it => !it.omakase);
                          const hasOma = items.some(it => it.omakase);
                          const rev = items.reduce((n, it) => n + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
                          const pRev = priced.reduce((n, it) => n + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
                          const pCost = priced.reduce((n, it) => n + (Number(it.cost) || 0) * (Number(it.qty) || 1), 0);
                          const pct = pRev > 0 ? Math.round((1 - pCost / pRev) * 100) : null;
                          if (!items.length) return null;
                          return (
                            <div style={{ fontSize: 11.5, color: '#9aa5a0', marginTop: 6, paddingTop: 6, borderTop: '1px solid #2a332f' }}>
                              Revenue {currency(rev)} · est. cost {currency(pCost)}
                              {pct != null ? ` · ~${pct}% margin` : ''}
                              {hasOma ? ' · omakase cost TBD, not counted' : ''}
                            </div>
                          );
                        })()}
                        {p.notes && (
                          <div style={styles.pendingNotesSection}>
                            <div style={styles.pendingNotes}>Notes: {p.notes}</div>
                            {parsedNotes[p.pendingId] ? (
                              <div style={styles.parsedNotesCard}>
                                <div style={styles.parsedNotesTitle}>AI interpretation</div>
                                {parsedNotes[p.pendingId].summary && (
                                  <div style={styles.parsedNotesSummary}>{parsedNotes[p.pendingId].summary}</div>
                                )}
                                {['spice','substitutions','extras','delivery','other'].map(k =>
                                  parsedNotes[p.pendingId][k] ? (
                                    <div key={k} style={styles.parsedNotesItem}>
                                      <span style={styles.parsedNotesKey}>{k}:</span> {parsedNotes[p.pendingId][k]}
                                    </div>
                                  ) : null
                                )}
                              </div>
                            ) : (
                              <button
                                style={styles.parseNotesBtn}
                                disabled={parsingNotes === p.pendingId}
                                onClick={async () => {
                                  setParsingNotes(p.pendingId);
                                  const result = await parseFormNotes(p.notes);
                                  if (result) setParsedNotes(prev => ({ ...prev, [p.pendingId]: result }));
                                  setParsingNotes(null);
                                }}
                              >
                                {parsingNotes === p.pendingId ? 'Parsing...' : 'Parse notes with AI'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={styles.pendingActions}>
                        <button style={styles.pendingAcceptBtn} onClick={() => acceptPending(p)}>
                          <Check size={16} /> Accept
                        </button>
                        <button style={styles.pendingRejectBtn} onClick={() => dismissPending(p.pendingId)}>
                          <X size={16} /> Reject
                        </button>
                        <button style={styles.pendingBackBtn} onClick={() => setShowPendingIdx(null)}>
                          Back
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button key={p.pendingId} style={styles.pendingRow} onClick={() => setShowPendingIdx(idx)}>
                      <span style={styles.pendingRowName}>{p.customer}</span>
                      <span style={styles.pendingRowCount}>{p.items.length} item{p.items.length !== 1 ? 's' : ''}</span>
                      <ChevronDown size={16} />
                    </button>
                  )
                ))}
              </div>
            )}

            {undecidedOma.length > 0 && (
              <div style={{ background: 'rgba(212,160,80,0.10)', border: '1px solid #D4A050', borderRadius: 10, padding: '8px 10px', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#D4A050' }}>Omakase undecided: </span>
                <span style={{ fontSize: 12, color: '#e8ede9' }}>
                  {undecidedOma.map(u => `${u.customer} (${new Date(u.createdAt).toLocaleDateString()})`).join(', ')}
                </span>
              </div>
            )}

            {/* V1/V2/V3: sort, status filter, and search — the same list is
                one house or three hundred, and this is what keeps it from
                becoming a scroll marathon at scale. */}
            {(activeOrders.length > 6 || deliveredOrders.length > 6) && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                <input
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search name, dish, or note…"
                  style={{ ...styles.input, flex: '1 1 160px', minWidth: 140, padding: '8px 10px', fontSize: 13 }}
                />
                <select
                  value={orderSort}
                  onChange={e => setOrderSort(e.target.value)}
                  style={{ background: '#1a1a1a', border: '1px solid #37403c', borderRadius: 8, color: CREAM, fontSize: 12.5, padding: '8px 8px', minHeight: 36 }}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">By name</option>
                  <option value="unpaidFirst">Unpaid first</option>
                  <option value="status">By status</option>
                </select>
                {STATUSES.length > 0 && (
                  <select
                    value={orderStatusFilter || ''}
                    onChange={e => setOrderStatusFilter(e.target.value || null)}
                    style={{ background: '#1a1a1a', border: '1px solid #37403c', borderRadius: 8, color: CREAM, fontSize: 12.5, padding: '8px 8px', minHeight: 36 }}
                  >
                    <option value="">All statuses</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <button
                  onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                  style={{ minHeight: 36, padding: '7px 12px', borderRadius: 8, border: `1px solid ${selectMode ? GOLD : '#37403c'}`, background: selectMode ? 'rgba(212,160,80,0.15)' : 'transparent', color: selectMode ? GOLD : '#9aa5a0', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                >
                  {selectMode ? 'Done' : 'Select'}
                </button>
              </div>
            )}

            {/* V4: the bulk bar. Only appears in select mode, and every
                button names the exact count it will affect — a bulk action
                that does not say how many is a bulk action you check twice. */}
            {selectMode && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', background: 'rgba(212,160,80,0.08)', border: '1px solid #D4A050', borderRadius: 10, padding: '8px 10px', marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, color: '#e8ede9', fontWeight: 700 }}>
                  {selectedCount} selected
                </span>
                <button
                  onClick={selectAllVisible}
                  style={{ minHeight: 36, padding: '6px 10px', borderRadius: 7, border: '1px solid #37403c', background: 'transparent', color: '#9aa5a0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Select all {selectableActive.length} shown
                </button>
                {selectedCount > 0 && (
                  <button
                    onClick={clearSelection}
                    style={{ minHeight: 36, padding: '6px 10px', borderRadius: 7, border: '1px solid #37403c', background: 'transparent', color: '#9aa5a0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                )}
                <span style={{ flex: 1 }} />
                <button
                  disabled={selectedCount === 0}
                  onClick={() => runBulk(bulkMarkPaid)}
                  style={{ minHeight: 44, padding: '9px 14px', borderRadius: 8, border: 'none', background: selectedCount ? '#2f6f57' : '#232d2a', color: selectedCount ? '#fff' : '#5a635f', fontWeight: 700, fontSize: 12.5, cursor: selectedCount ? 'pointer' : 'default' }}
                >
                  Mark {selectedCount || ''} paid
                </button>
                <button
                  disabled={selectedCount === 0}
                  onClick={() => runBulk(bulkArchive)}
                  style={{ minHeight: 44, padding: '9px 14px', borderRadius: 8, border: `1px solid ${selectedCount ? '#37403c' : '#232d2a'}`, background: 'transparent', color: selectedCount ? '#9aa5a0' : '#5a635f', fontWeight: 700, fontSize: 12.5, cursor: selectedCount ? 'pointer' : 'default' }}
                >
                  Archive {selectedCount || ''}
                </button>
              </div>
            )}

            <div style={styles.orderList}>
              {activeWindow.shown.map(order => {
                const house = isHouseOrder(order);
                const card = (
                  <ErrorBoundary key={order.id} compact label={order.customer || order.id} raw={order}>
                  <OrderCard allOrders={orders || []} perLbLiveCost={liveCostMap} weekDishes={weekDishes}
                    key={order.id}
                    order={order}
                    regulars={regulars}
                    expanded={expandedOrder === order.id}
                    onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    onUpdate={(patch) => { preserveScroll(); updateOrder(order.id, patch); }}
                    onDelete={() => { preserveScroll(); deleteOrder(order.id); }}
                    onEdit={() => { setFormMode(order); setExpandedOrder(null); }}
                    onMakeRegular={makeRegularFromOrder}
                    onLinkRegular={linkOrderWithAlias}
                  />
                  </ErrorBoundary>
                );
                if (!selectMode) return card;
                // A house order shows in the list but cannot be selected:
                // $0 and outside the books, so both bulk actions are
                // meaningless for it. Greyed rather than hidden, so the
                // list Kevin sees in select mode is still the list he
                // knows.
                return (
                  <div key={order.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <button
                      onClick={() => !house && toggleSelected(order.id)}
                      aria-label={house ? 'House orders cannot be selected' : 'Select order'}
                      style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: house ? 'default' : 'pointer', flexShrink: 0, opacity: house ? 0.3 : 1 }}
                    >
                      <span style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${selectedIds.has(order.id) ? GOLD : '#5F5E5A'}`, background: selectedIds.has(order.id) ? GOLD : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedIds.has(order.id) && <Check size={13} color="#1a1a1a" />}
                      </span>
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>{card}</div>
                  </div>
                );
              })}
              {activeWindow.hiddenCount > 0 && (
                <button
                  onClick={() => setShowAllActive(true)}
                  style={{ width: '100%', minHeight: 44, marginTop: 6, padding: '10px', borderRadius: 8, border: '1px dashed #37403c', background: 'transparent', color: '#9aa5a0', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
                >
                  Show {activeWindow.hiddenCount} older order{activeWindow.hiddenCount !== 1 ? 's' : ''}
                </button>
              )}
              {activeWindow.total === 0 && (orderSearch || orderStatusFilter) && (
                <div style={{ ...styles.emptyBody, textAlign: 'center', padding: '14px 0' }}>No orders match.</div>
              )}
            </div>

            {deliveredOrders.length > 0 && (
              <details style={styles.deliveredSection}>
                <summary style={styles.deliveredSummary}>
                  Delivered ({deliveredOrders.length})
                </summary>
                <div style={styles.orderList}>
                  {deliveredWindow.shown.map(order => (
                    <ErrorBoundary key={order.id} compact label={order.customer || order.id} raw={order}>
                    <OrderCard allOrders={orders || []} perLbLiveCost={liveCostMap} weekDishes={weekDishes}
                      key={order.id}
                      order={order}
                      regulars={regulars}
                      expanded={expandedOrder === order.id}
                      onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      onUpdate={(patch) => { preserveScroll(); updateOrder(order.id, patch); }}
                      onDelete={() => { preserveScroll(); deleteOrder(order.id); }}
                      onEdit={() => { setFormMode(order); setExpandedOrder(null); }}
                      onMakeRegular={makeRegularFromOrder}
                      onLinkRegular={linkOrderWithAlias}
                    />
                    </ErrorBoundary>
                  ))}
                  {deliveredWindow.hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAllDelivered(true)}
                      style={{ width: '100%', minHeight: 44, marginTop: 6, padding: '10px', borderRadius: 8, border: '1px dashed #37403c', background: 'transparent', color: '#9aa5a0', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
                    >
                      Show {deliveredWindow.hiddenCount} more delivered order{deliveredWindow.hiddenCount !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
                <ArchiveDeliveredButton count={deliveredOrders.length} onArchive={archiveDelivered} />
              </details>
            )}
          </>
        )}

        {view === 'cook' && (
          <>
            <div style={styles.cookSubToggle}>
              <button
                style={{ ...styles.cookSubBtn, ...(cookSubView === 'cook' ? styles.cookSubBtnActive : {}) }}
                onClick={() => setCookSubView('cook')}
              >
                Cook
              </button>
              <button
                style={{ ...styles.cookSubBtn, ...(cookSubView === 'deliver' ? styles.cookSubBtnActive : {}) }}
                onClick={() => setCookSubView('deliver')}
              >
                Deliver
              </button>
            </div>
            {cookSubView === 'cook' ? (
              <CookingList
                items={cookingList}
                orderCount={activeOrders.length}
                revenue={activeFinancials.revenue}
                checks={cookChecks}
                onToggle={toggleCheck}
                onReset={resetChecks}
              />
            ) : (
              <DeliverList
                omakaseUnconfirmed={omakaseUnconfirmed}
                onConfirmOmakase={confirmOmakasePrice}
                groups={deliverList}
                orderCount={activeOrders.length}
                checks={deliverChecks}
                onToggle={toggleDeliverCheck}
                onReset={resetDeliverChecks}
              />
            )}
          </>
        )}

        {view === 'shop' && (
          <ShoppingList
            items={shopping}
            onChange={persistShopping}
            onGenerate={generateShopping}
            includeStaples={includeStaples}
            onToggleStaples={(v) => { setIncludeStaples(v); localStore.set('ltb_staples_pref', v ? '1' : '0'); }}
            activeCount={activeOrders.length}
            estCost={activeFinancials.cost}
            weekDishes={weekDishes}
            inventory={inventory}
            onAdjustInventory={adjustInventory}
            onSetInventory={setInventoryCount}
          />
        )}

        {view === 'money' && (
          <>
            <MoneyTab orders={orders || []} onUpdate={updateOrder} auditLog={auditLog} costHistory={costHistory} baseCostMap={baseCostMap} ingredientName={ingredientName} containerStatus={containerStatus} onSaveContainerConfig={saveContainerConfig} />
            <DigestPanel orders={orders || []} regulars={regulars} liveCostMap={liveCostMap} baseCostMap={baseCostMap} onPullFeedback={pullKitchenFeedback} onCloseOut={closeOutWeek} />
          </>
        )}

        {view === 'record' && (
          <RecordTab
            journal={journal}
            onSaveJournal={saveJournal}
            dishNames={reportableDishNames}
            weekDishes={weekDishes}
            orders={orders || []}
            knownNames={knownDishNames}
            weekLedger={weekLedger}
            askLog={askLog}
            onPullQuestions={pullQuestions}
            copiesNote={copiesNote}
            onSaveCopiesNote={saveCopiesNote}
            containerAudit={containerStatus.audit}
            archiveHistory={archiveHistory}
            onArchiveDownloaded={recordArchive}
          />
        )}

        {view === 'recipes' && (
          <RecipesTab auditLog={auditLog}
            dishFeedback={dishFeedback}
            onResetDishFeedback={resetDishFeedbackTally}
            liveCostMap={liveCostMap}
            baseCostMap={baseCostMap}
            costHistory={costHistory}
            journal={journal}
            onSaveJournal={saveJournal}
            knownNames={knownDishNames}
            weekDishes={weekDishes}
            orders={orders || []}
            pipelineJournal={pipelineJournal}
            onSavePipelineJournal={savePipelineJournal}
          />
        )}

        {view === 'regulars' && (
          <>
            <RegularsTab
              regulars={regulars}
              orders={orders || []}
              onAdd={addRegular}
              onUpdate={updateRegular}
              onDelete={deleteRegular}
              onLink={linkOrderToRegular}
              onUnlink={unlinkOrderFromRegular}
            />
            <RegularsIntelPanel orders={orders || []} regulars={regulars} weekDishes={weekDishes} onMerge={doMergeRegulars} onUnmerge={doUnmergeRegular} onUpdateRegular={updateRegular} onBackfill={runBackfill} onLinkSuggestion={linkSuggestionToRegular} />
          </>
        )}

        {view === 'week' && (
          <>
            <WeekTab selected={weekDishes} onToggle={toggleWeekDish} onPublish={publishWeek} liveCostMap={liveCostMap} baseCostMap={baseCostMap} orders={orders || []} dishFeedback={dishFeedback} onFetchHistory={fetchConfigHistory} onRestoreConfig={restoreConfig} />
            <PlannerPanel orders={orders || []} weekDishes={weekDishes} liveCostMap={liveCostMap} baseCostMap={baseCostMap} />
            <SchedulePanel orders={orders || []} />
            <div style={{ margin: '10px 0 24px' }}>
              <button
                onClick={() => setShowLabels(true)}
                style={{ width: '100%', padding: '11px', borderRadius: 10, border: '1px solid #2d3a36', background: '#1c2422', color: '#5DCAA5', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Print bag labels + packing slips
              </button>
            </div>
            {showLabels && <LabelsSheet orders={orders || []} onClose={() => setShowLabels(false)} />}
          </>
        )}

        {view === 'ingredients' && (
          <IngredientsTab ingredients={ingredientsDb} costHistory={costHistory} onChange={updateIngredients} onScanReceipt={() => { setDebugScan(false); setShowReceiptScan(true); }} onDebugScan={() => { setDebugScan(true); setShowReceiptScan(true); }} aliases={receiptAliases} onSaveAliases={saveReceiptAliases} />
        )}
      </main>

      {showReceiptScan && (
        <ReceiptScan
          ingredients={ingredientsDb}
          costHistory={costHistory}
          aliases={receiptAliases}
          onSaveAliases={saveReceiptAliases}
          onCommit={commitReceiptCosts}
          onClose={() => { setShowReceiptScan(false); setDebugScan(false); }}
          debug={debugScan}
        />
      )}
    </div>
  );
}
