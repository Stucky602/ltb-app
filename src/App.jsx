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
  ORDERS_KEY, CHECKS_KEY, DELIVER_CHECKS_KEY, DISH_NOTES_KEY, WEEK_NOTES_KEY,
  SHOPPING_KEY, WEEK_KEY, PENDING_KEY, SEEN_ROWS_KEY, REGULARS_KEY, INVENTORY_KEY,
} from './config.js';
const INGREDIENTS_KEY = 'ltb_ingredients_v1';
const COST_HISTORY_KEY = 'ltb_cost_history_v1';
const RECEIPT_ALIASES_KEY = 'ltb_receipt_aliases_v1';
import {
  uid, currency, round2, DISH_CUISINE, dishCuisine, normName,
  MIN_ORDERS_FOR_INSIGHT, localStore, store, PHOTO_PREFIX, PHOTO_TTL_DAYS, fmtBytes,
  urlBase64ToUint8Array, nameMatchType, regularNames, regularDisplayName,
  regularMatchType, buildInsights, insightStamp, loadHtml2Canvas,
  discountAmount, itemsUpchargeTotal, customChargesTotal, itemsBaseTotal,
  orderTotal, repricePerLbItem, itemCost, orderCostInfo, stampItemCosts, normalizePendingItems,
  groupKeyFor, formatDate, orderToText, copyText, loadJSON, saveJSON, saveError,
  photoKey, savePhoto, loadPhoto, deletePhoto, photoStorageBytes, cleanupPhotos,
  menuForPrompt, fileToJpegBase64, parseOrderText, validateParsedOrder, parseAmendment,
  parseFormRow, parseDelimited, rowToOrderText, parseFormNotes,
  mergeRegulars, unmergeRegular, backfillRegularLinks, regularAllNames,
} from './utils.js';
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
import { RecipesTab } from './components/RecipesTab.jsx';
import { PlannerPanel } from './components/PlannerPanel.jsx';
import { RegularsIntelPanel } from './components/RegularsIntelPanel.jsx';
import { LabelsSheet } from './components/LabelsSheet.jsx';
import { DigestPanel } from './components/DigestPanel.jsx';
import { SchedulePanel } from './components/SchedulePanel.jsx';
import { VoiceMode } from './components/VoiceMode.jsx';
import { IngredientsTab } from './components/IngredientsTab.jsx';
import { ReceiptScan } from './components/ReceiptScan.jsx';
import { INGREDIENT_SEED } from './ingredients.js';
import { baselineCostMap, liveCostMapFrom } from './dishCosting.js';

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

  React.useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(e => {
      console.warn('SW registration failed:', e.message);
    });
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
  const [dishNotes, setDishNotes] = useState({});
  const [shopping, setShopping] = useState([]);
  const [booted, setBooted] = useState(false);
  const [includeStaples, setIncludeStaples] = useState(() => localStore.get('ltb_staples_pref') === '1');
  const [weekDishes, setWeekDishes] = useState(DEFAULT_WEEK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('orders');
  const [showLabels, setShowLabels] = useState(false); // bag-labels print sheet
  const [formMode, setFormMode] = useState(null);
  const [showPaste, setShowPaste] = useState(false);
  const [showAmend, setShowAmend] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [ingredientsDb, setIngredientsDb] = useState([]);
  const [costHistory, setCostHistory] = useState([]); // [{ t, id, cost }] lightweight time-series
  const [receiptAliases, setReceiptAliases] = useState({}); // normReceiptStr -> { ingredientId?, action?, pricing? }
  const [showReceiptScan, setShowReceiptScan] = useState(false);
  const [showPendingIdx, setShowPendingIdx] = useState(null);
  const [checkingForm, setCheckingForm] = useState(false);
  const [parsedNotes, setParsedNotes] = useState({});
  const [parsingNotes, setParsingNotes] = useState(null);
  const [regulars, setRegulars] = useState([]);
  const [inventory, setInventory] = useState({});
  const [linkPrompt, setLinkPrompt] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [loadedOrders, loadedChecks, loadedShopping, loadedWeek, loadedDeliverChecks, loadedDishNotes] = await Promise.all([
        loadJSON(ORDERS_KEY, []),
        loadJSON(CHECKS_KEY, {}),
        loadJSON(SHOPPING_KEY, []),
        loadJSON(WEEK_KEY, null),
        loadJSON(DELIVER_CHECKS_KEY, {}),
        loadJSON(DISH_NOTES_KEY, {}),
      ]);
      if (!mounted) return;
      const migrated = loadedOrders.map(o => ({
        ...o,
        // Cost-basis migration: items stamped at creation keep their frozen
        // cost (tagged 'snapshot'); items predating stamping get today's
        // registry anchor, honestly tagged 'backfilled'. Idempotent.
        items: stampItemCosts((o.items || []).map(it => {
          const clean = { ...it };
          if (clean.upcharge != null && typeof clean.upcharge !== 'object') {
            delete clean.upcharge;
          }
          if ('lbs' in clean) delete clean.lbs;
          return clean;
        }), 'backfilled'),
        paid: o.paid === undefined ? o.status === 'Delivered' : o.paid,
        archived: o.archived || false,
        discountType: o.discountType || null,
        discountValue: o.discountValue || 0,
        customCharges: o.customCharges || [],
        jarSwaps: o.jarSwaps || 0,
        containerReturns: o.containerReturns || 0,
        waiveSurcharge: o.waiveSurcharge || false,
        total: Number(o.total) || 0,
      }));
      setOrders(migrated);
      setCookChecks(loadedChecks || {});
      setDeliverChecks(loadedDeliverChecks || {});
      setDishNotes(loadedDishNotes || {});
      setShopping(loadedShopping || []);
      setBooted(true);
      if (loadedWeek && Array.isArray(loadedWeek.selected)) {
        const valid = loadedWeek.selected.filter(n => ALL_DINNERS.some(d => d.name === n));
        setWeekDishes(valid.length > 0 ? valid : DEFAULT_WEEK);
      }
      const savedPending = await loadJSON(PENDING_KEY, []);
      if (mounted) setPendingOrders(savedPending || []);

      const savedRegulars = await loadJSON(REGULARS_KEY, []);
      const migratedRegulars = (savedRegulars || []).map(r => {
        if (Array.isArray(r.names) && r.names.length) return r;
        const names = r.name ? [String(r.name).trim()] : [];
        return { ...r, names, name: names[0] || '' };
      });
      if (mounted) setRegulars(migratedRegulars);
      const savedInventory = await loadJSON(INVENTORY_KEY, {});
      if (mounted) setInventory(savedInventory || {});

      const savedIngredients = await loadJSON(INGREDIENTS_KEY, null);
      let ingForHistory = null;
      if (savedIngredients && Array.isArray(savedIngredients) && savedIngredients.length) {
        if (mounted) setIngredientsDb(savedIngredients);
        ingForHistory = savedIngredients;
      } else {
        // First run: seed from the canonical baseline. current = baseline at seed time.
        const seeded = INGREDIENT_SEED.map(i => ({ ...i, current: i.baseline }));
        if (mounted) setIngredientsDb(seeded);
        saveJSON(INGREDIENTS_KEY, seeded);
        ingForHistory = seeded;
      }

      // Cost history (lightweight time-series). Seed an initial snapshot on first run
      // so trends have a starting anchor; afterward append on each cost edit.
      const savedHistory = await loadJSON(COST_HISTORY_KEY, null);
      if (savedHistory && Array.isArray(savedHistory) && savedHistory.length) {
        if (mounted) setCostHistory(savedHistory);
      } else {
        const t = Date.now();
        const snapshot = (ingForHistory || []).map(i => ({ t, id: i.id, cost: i.current }));
        if (mounted) setCostHistory(snapshot);
        saveJSON(COST_HISTORY_KEY, snapshot);
      }

      // Receipt aliases (Phase 3): learned receipt-string -> ingredient mappings,
      // always-ignore items, and flat-price flags. Empty map on first run.
      const savedAliases = await loadJSON(RECEIPT_ALIASES_KEY, null);
      if (mounted && savedAliases && typeof savedAliases === 'object') {
        setReceiptAliases(savedAliases);
      }

      setLoading(false);
      cleanupPhotos(migrated);
      if (USE_LEGACY_CSV) {
        pollFormOrders(migrated, savedPending || []);
      } else {
        pollWorkerPending();
      }
    })();
    return () => { mounted = false; };
  }, []);

  const persistOrders = useCallback(async (next) => {
    setOrders(next);
    const res = await saveJSON(ORDERS_KEY, next);
    setError(saveError(res));
    return res;
  }, []);

  const persistShopping = useCallback((next) => {
    setShopping(next);
    saveJSON(SHOPPING_KEY, next).then(res => setError(saveError(res)));
  }, []);

  const INVENTORY_ADDON_MAP = {
    'Queso': 'queso_0',
    'Chili Oil': 'chiliOil',
    'Chimichurri': 'chimichurri',
    'Romesco': 'romesco',
    'Chermoula': 'chermoula',
    'Miso Butter Sauce': 'misoButter',
    'Whipped Lemon Garlic Herb Butter': 'whippedButter',
  };

  const saveOrder = useCallback((order) => {
    setOrders(prev => {
      const exists = (prev || []).some(o => o.id === order.id);
      const next = exists
        ? (prev || []).map(o => (o.id === order.id ? order : o))
        : [order, ...(prev || [])];
      saveJSON(ORDERS_KEY, next).then(res => setError(saveError(res)));
      if (!exists) {
        (order.items || []).forEach(it => {
          const invKey = INVENTORY_ADDON_MAP[it.name];
          if (invKey) {
            setInventory(inv => {
              const current = Number(inv[invKey]) || 0;
              const updated = { ...inv, [invKey]: Math.max(0, current - (it.qty || 1)) };
              saveJSON(INVENTORY_KEY, updated);
              return updated;
            });
          }
        });
      }
      return next;
    });
    setFormMode(null);
  }, []);

  const importOrders = useCallback((parsedOrders) => {
    const newOrders = parsedOrders.map(p => {
      const items = p.items || [];
      const total = orderTotal(items, p.jarSwaps || 0, p.containerReturns || 0, null, 0, [], false);
      return {
        id: uid(),
        customer: p.customer,
        items,
        jarSwaps: p.jarSwaps || 0,
        containerReturns: p.containerReturns || 0,
        notes: p.notes || '',
        discountType: null,
        discountValue: 0,
        customCharges: [],
        waiveSurcharge: false,
        total,
        status: 'Ordered',
        paid: false,
        archived: false,
        createdAt: new Date().toISOString(),
      };
    });
    setOrders(prev => {
      const next = [...newOrders, ...(prev || [])];
      saveJSON(ORDERS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
    setShowCsv(false);
    setExportMsg(`Imported ${newOrders.length} order${newOrders.length !== 1 ? 's' : ''} from the sheet.`);
    setTimeout(() => setExportMsg(null), 4000);
  }, []);

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
              price: it.price, cost: it.cost || 0, note: '', hasPhoto: false,
            })) : [],
            notes: s.notes || '',
          }));
          setPendingOrders(prev => {
            const have = new Set((prev || []).map(p => p.pendingId));
            const fresh = mapped.filter(m => !have.has(m.pendingId));
            if (fresh.length === 0) return prev;
            const updated = [...(prev || []), ...fresh];
            saveJSON(PENDING_KEY, updated);
            return updated;
          });
          const ids = submissions.map(s => s.id);
          fetch(WORKER_BASE + '/pending/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, token: PUBLISH_TOKEN }),
          }).catch(() => {});
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

  const publishWeek = React.useCallback(async (currentWeekDishes, menuPdfUrl, weekLabel) => {
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
      };
    };
    const allDinners = (activeMenu.dinner || []).map(toVariants);
    const dishes = allDinners.filter(d => !d.spotlight);
    const spotlight = allDinners.filter(d => d.spotlight);
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
    return res.json();
  }, []);

  // ── Auto-fill regular contact info from incoming order ─────────────────────
  // Called after linking an order to a regular. If the regular has no address
  // or phone and the order does, fills in the blank fields and shows a banner.
  const autoFillRegularContact = useCallback((reg, order) => {
    const infoPatch = {};
    if (!reg.address && order.address) infoPatch.address = order.address;
    if (!reg.phone && order.phone) infoPatch.phone = order.phone;
    if (Object.keys(infoPatch).length > 0) {
      updateRegular(reg.id, infoPatch);
      const fields = [infoPatch.address && 'address', infoPatch.phone && 'phone']
        .filter(Boolean).join(' and ');
      const name = (reg.names && reg.names[0]) || reg.name || 'Regular';
      setExportMsg(`${name}'s ${fields} saved to Regulars.`);
      setTimeout(() => setExportMsg(null), 4000);
    }
  }, []);

  const acceptPending = useCallback((pending) => {
    const orderId = uid();

    let exactReg = null;
    const partialRegs = [];
    regulars.forEach(r => {
      const m = regularMatchType(r, pending.customer);
      if (m === 'exact') exactReg = r;
      else if (m === 'partial') partialRegs.push(r);
    });

    const discountType = exactReg && exactReg.discountPercent > 0 ? 'percent' : null;
    const discountValue = exactReg && exactReg.discountPercent > 0 ? exactReg.discountPercent : 0;

    // Normalize the customer-form item shape FIRST (per-lb proteins arrive with
    // the $/lb rate in price/cost and no weightPending — see normalizePendingItems),
    // then total and stamp. Order of operations matters: totaling before
    // normalizing counts a rate as a price; stamping before normalizing freezes
    // a rate as a cost basis.
    const normalizedItems = normalizePendingItems(pending.items);
    const total = orderTotal(normalizedItems, 0, 0, discountType, discountValue, [], false);

    // Re-stamp cost bases from the app's own registry at acceptance — the
    // registry is authoritative over whatever the customer form submitted
    // (which can be stale, zero-coerced, or tampered). Items the registry
    // can't match keep any client value they carried.
    const stampedItems = stampItemCosts(normalizedItems, 'snapshot', { reStamp: true });

    const order = {
      id: orderId,
      customer: pending.customer,
      address: pending.address || '',
      phone: pending.phone || '',
      items: stampedItems,
      jarSwaps: 0,
      containerReturns: 0,
      notes: pending.notes || '',
      discountType,
      discountValue,
      customCharges: [],
      waiveSurcharge: false,
      total,
      status: 'Ordered',
      paid: false,
      archived: false,
      regularId: exactReg ? exactReg.id : null,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => {
      const next = [order, ...(prev || [])];
      saveJSON(ORDERS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });

    (order.items || []).forEach(it => {
      const invKey = INVENTORY_ADDON_MAP[it.name];
      if (invKey) adjustInventory(invKey, -(it.qty || 1));
    });

    if (exactReg) {
      linkOrderToRegular(exactReg.id, orderId);
      autoFillRegularContact(exactReg, order);
    } else if (partialRegs.length > 0) {
      setLinkPrompt({ order, candidates: partialRegs });
    }

    dismissPending(pending.pendingId);
    setShowPendingIdx(null);
  }, [regulars, autoFillRegularContact]);

  const dismissPending = useCallback((pendingId) => {
    setPendingOrders(prev => {
      const next = prev.filter(p => p.pendingId !== pendingId);
      saveJSON(PENDING_KEY, next);
      return next;
    });
    setShowPendingIdx(null);
  }, []);

  const persistRegulars = useCallback((next) => {
    setRegulars(next);
    saveJSON(REGULARS_KEY, next).then(res => setError(saveError(res)));
  }, []);

  const addRegular = useCallback((profile) => {
    const names = (Array.isArray(profile.names) ? profile.names : [profile.name])
      .map(n => String(n || '').trim())
      .filter(Boolean);
    const reg = {
      id: uid(),
      names,
      name: names[0] || '',
      address: profile.address || '',
      phone: profile.phone || '',
      dietary: profile.dietary || '',
      spice: profile.spice || '',
      discountPercent: Number(profile.discountPercent) || 0,
      notes: profile.notes || '',
      linkedOrderIds: profile.linkedOrderIds || [],
      lastInsightSig: '',
      createdAt: new Date().toISOString(),
    };
    setRegulars(prev => {
      const next = [...prev, reg];
      saveJSON(REGULARS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
    return reg.id;
  }, []);

  const updateRegular = useCallback((id, patch) => {
    setRegulars(prev => {
      const next = prev.map(r => (r.id === id ? { ...r, ...patch } : r));
      saveJSON(REGULARS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  const deleteRegular = useCallback((id) => {
    setRegulars(prev => {
      const next = prev.filter(r => r.id !== id);
      saveJSON(REGULARS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  // ── STARTUP AUTOMATIONS (Jul 9): run once per session, silently. Feedback
  // pull only fires when any order carries a kitchenPageId; backfill is safe
  // by construction (exact/alias matches only — partials never auto-link).
  const startupRan = useRef(false);
  useEffect(() => {
    if (!booted || startupRan.current) return;
    startupRan.current = true;
    if ((orders || []).some(o => o.kitchenPageId)) {
      pullKitchenFeedback().catch(() => {}); // offline or v8 not deployed: silently skip
    }
    if ((regulars || []).length && (orders || []).some(o => !o.regularId)) {
      try { runBackfill(); } catch (e) { /* silent */ }
    }
  }, [booted]);

  const linkOrderToRegular = useCallback((regularId, orderId) => {
    setRegulars(prev => {
      const next = prev.map(r => {
        if (r.id !== regularId) return r;
        const linkedOrderIds = r.linkedOrderIds.includes(orderId)
          ? r.linkedOrderIds
          : [...r.linkedOrderIds, orderId];
        return { ...r, linkedOrderIds };
      });
      saveJSON(REGULARS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  const unlinkOrderFromRegular = useCallback((regularId, orderId) => {
    setRegulars(prev => {
      const next = prev.map(r =>
        r.id === regularId
          ? { ...r, linkedOrderIds: r.linkedOrderIds.filter(oid => oid !== orderId) }
          : r
      );
      saveJSON(REGULARS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  const adjustInventory = useCallback((key, delta) => {
    setInventory(prev => {
      const current = Number(prev[key]) || 0;
      const next = { ...prev, [key]: Math.max(0, current + delta) };
      saveJSON(INVENTORY_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  const setInventoryCount = useCallback((key, value) => {
    setInventory(prev => {
      const next = { ...prev, [key]: Math.max(0, Number(value) || 0) };
      saveJSON(INVENTORY_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  const updateIngredients = useCallback((next) => {
    // Diff against current state to log only changed costs into history.
    setIngredientsDb(prev => {
      const prevById = {};
      (prev || []).forEach(i => { prevById[i.id] = i.current; });
      const t = Date.now();
      const points = [];
      (next || []).forEach(i => {
        const before = prevById[i.id];
        // log when a new ingredient appears or its current cost moved
        if (before === undefined || Math.abs((before || 0) - (i.current || 0)) > 0.0001) {
          points.push({ t, id: i.id, cost: i.current });
        }
      });
      if (points.length) {
        setCostHistory(h => {
          const merged = [...(h || []), ...points];
          // cap history to keep storage small (~last 4000 points)
          const capped = merged.length > 4000 ? merged.slice(merged.length - 4000) : merged;
          saveJSON(COST_HISTORY_KEY, capped).then(res => setError(saveError(res)));
          return capped;
        });
      }
      return next;
    });
    saveJSON(INGREDIENTS_KEY, next).then(res => setError(saveError(res)));
  }, []);

  // Phase 3 — receipt commit. Twin of updateIngredients, but stamps cost-history
  // points with the receipt's PURCHASE date (not the scan moment). `updates` is
  // [{ id, cost }] for accepted lines only. `purchaseDate` is an ISO 'YYYY-MM-DD'
  // string or null (fallback: now). Never touches baseline.
  const commitReceiptCosts = useCallback((updates, purchaseDate, newIngredients) => {
    if ((!updates || !updates.length) && (!newIngredients || !newIngredients.length)) return;
    const stamp = (() => {
      if (purchaseDate) {
        const ms = Date.parse(purchaseDate);
        if (!isNaN(ms)) return ms;
      }
      return Date.now();
    })();
    const byId = {};
    (updates || []).forEach(u => { byId[u.id] = u.cost; });
    setIngredientsDb(prev => {
      // first, append any inline-created ingredients (so cost updates resolve)
      const created = (newIngredients || []).filter(ni => !(prev || []).some(i => i.id === ni.id));
      const base = [...(prev || []), ...created];
      const next = base.map(i => (byId[i.id] != null ? { ...i, current: byId[i.id] } : i));
      const prevById = {};
      base.forEach(i => { prevById[i.id] = i.current; });
      const t = stamp;
      const points = [];
      // log created ingredients' initial cost + any moved currents
      created.forEach(ni => { points.push({ t, id: ni.id, cost: ni.current }); });
      Object.keys(byId).forEach(id => {
        const before = prevById[id];
        const after = byId[id];
        if (before === undefined || Math.abs((before || 0) - (after || 0)) > 0.0001) {
          // avoid double-logging a just-created ingredient whose cost equals its seed
          if (!created.some(c => c.id === id && Math.abs((c.current || 0) - (after || 0)) < 0.0001)) {
            points.push({ t, id, cost: after });
          }
        }
      });
      if (points.length) {
        setCostHistory(h => {
          const merged = [...(h || []), ...points].sort((a, b) => a.t - b.t);
          const capped = merged.length > 4000 ? merged.slice(merged.length - 4000) : merged;
          saveJSON(COST_HISTORY_KEY, capped).then(res => setError(saveError(res)));
          return capped;
        });
      }
      saveJSON(INGREDIENTS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  // Persist learned receipt aliases (merge + save).
  const saveReceiptAliases = useCallback((nextAliases) => {
    setReceiptAliases(nextAliases);
    saveJSON(RECEIPT_ALIASES_KEY, nextAliases).then(res => setError(saveError(res)));
  }, []);

  const updateOrder = useCallback((id, patch) => {
    setOrders(prev => {
      const next = (prev || []).map(o => (o.id === id ? { ...o, ...patch } : o));
      saveJSON(ORDERS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  // ── Make-a-regular star (OrderCard) ────────────────────────────────────────
  const makeRegularFromOrder = useCallback((order) => {
    const id = addRegular({
      names: [order.customer || ''],
      address: order.address || '',
      phone: order.phone || '',
      linkedOrderIds: [order.id],
    });
    updateOrder(order.id, { regularId: id });
  }, [addRegular, updateOrder]);

  // Link an order to an EXISTING regular from the star's near-miss chooser.
  // The order's name becomes an alias on the regular (non-destructive merge
  // mechanism) so all past and future orders under that name match too.
  const linkOrderWithAlias = useCallback((regularId, order) => {
    setRegulars(prev => {
      const next = prev.map(r => {
        if (r.id !== regularId) return r;
        const has = regularAllNames(r).some(n => n.toLowerCase() === String(order.customer || '').toLowerCase());
        return {
          ...r,
          aliases: has ? (r.aliases || []) : [...(r.aliases || []), order.customer],
          linkedOrderIds: r.linkedOrderIds.includes(order.id) ? r.linkedOrderIds : [...r.linkedOrderIds, order.id],
        };
      });
      saveJSON(REGULARS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
    updateOrder(order.id, { regularId });
  }, [updateOrder]);

  // ── Merge / unmerge (non-destructive, reversible) ───────────────────────────
  const doMergeRegulars = useCallback((targetId, sourceId) => {
    setRegulars(prev => {
      const { regulars: next, relinkOrderIds } = mergeRegulars(prev, targetId, sourceId);
      if (relinkOrderIds.length) {
        setOrders(po => {
          const on = (po || []).map(o => (relinkOrderIds.includes(o.id) ? { ...o, regularId: targetId } : o));
          saveJSON(ORDERS_KEY, on).then(res => setError(saveError(res)));
          return on;
        });
      }
      saveJSON(REGULARS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  const doUnmergeRegular = useCallback((targetId, snapshotId) => {
    setRegulars(prev => {
      const next = unmergeRegular(prev, targetId, snapshotId);
      saveJSON(REGULARS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  // ── Backfill pre-regulars orders (exact/alias auto; partial = suggestions) ──
  // Voice add-item: append a single-variant item to an order, repriced via
  // the same math every other item flows through (stamp totals via updateOrder).
  const voiceAddItem = useCallback((orderId, item) => {
    setOrders(prev => {
      const next = (prev || []).map(o => {
        if (o.id !== orderId) return o;
        const items = [...(o.items || []), item];
        // Refresh the STORED total with the same math every surface uses —
        // otherwise the card header shows the pre-voice total.
        const total = orderTotal(items, o.jarSwaps, o.containerReturns, o.discountType, o.discountValue, o.customCharges, o.waiveSurcharge);
        return { ...o, items, total };
      });
      saveJSON(ORDERS_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);

  // ── CLOSE OUT THE WEEK (one tap): pull any last kitchen feedback, then
  // archive everything delivered. The ritual, automated.
  const closeOutWeek = useCallback(async () => {
    let fb = { attached: 0 };
    try { fb = await pullKitchenFeedback(); } catch (e) { /* offline is fine */ }
    const deliveredCount = (orders || []).filter(o => o.status === 'Delivered' && !o.archived).length;
    archiveDelivered();
    return { feedback: fb.attached || 0, archived: deliveredCount };
  }, [orders]);

  // ── Kitchen feedback sync (Option B: feedback lives ON the order) ──────────
  // Pulls tapped verdicts from the worker, attaches each to the order whose
  // kitchenPageId matches, persists, then clears the consumed KV keys. Pages
  // with no matching order (expired/foreign) are cleared too, so they don't
  // pile up forever.
  const pullKitchenFeedback = useCallback(async () => {
    const res = await fetch(WORKER_BASE + '/feedback/pending?token=' + encodeURIComponent(PUBLISH_TOKEN));
    if (!res.ok) throw new Error('pull failed');
    const { feedback } = await res.json();
    if (!feedback || !feedback.length) return { attached: 0, orphaned: 0 };
    // Compute attachment OUTSIDE the state updater: updaters can run twice
    // under StrictMode (double-counting) and run AFTER this function returns
    // (the toast would always read 0). Derive next from current orders, then
    // dispatch it whole.
    const byPage = new Map(feedback.map(f => [f.pageId, f]));
    let attached = 0, orphaned = 0;
    const next = (orders || []).map(o => {
      const hit = o.kitchenPageId ? byPage.get(o.kitchenPageId) : null;
      if (!hit) return o;
      attached += hit.entries.length;
      byPage.delete(o.kitchenPageId);
      return { ...o, feedback: [...(o.feedback || []), ...hit.entries] };
    });
    for (const leftover of byPage.values()) orphaned += leftover.entries.length;
    const consumed = feedback.map(f => f.pageId);
    setOrders(next);
    saveJSON(ORDERS_KEY, next).then(r => setError(saveError(r)));
    await fetch(WORKER_BASE + '/feedback/clear', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: PUBLISH_TOKEN, pageIds: consumed }),
    });
    return { attached, orphaned };
  }, [orders]);

  // Resolve a backfill near-miss inline: link an order (by id, archived or
  // not) to the chosen regular, reusing the alias-merge mechanism so the
  // order's name is remembered on that regular going forward.
  const linkSuggestionToRegular = useCallback((orderId, regularId) => {
    const order = (orders || []).find(o => o.id === orderId);
    if (order) linkOrderWithAlias(regularId, order);
  }, [orders, linkOrderWithAlias]);

  const runBackfill = useCallback(() => {
    const { auto, suggestions } = backfillRegularLinks(regulars, orders || []);
    if (auto.length) {
      setOrders(po => {
        const byId = new Map(auto.map(a => [a.orderId, a.regularId]));
        const on = (po || []).map(o => (byId.has(o.id) ? { ...o, regularId: byId.get(o.id) } : o));
        saveJSON(ORDERS_KEY, on).then(res => setError(saveError(res)));
        return on;
      });
      setRegulars(prev => {
        const next = prev.map(r => {
          const mine = auto.filter(a => a.regularId === r.id).map(a => a.orderId);
          if (!mine.length) return r;
          return { ...r, linkedOrderIds: [...new Set([...(r.linkedOrderIds || []), ...mine])] };
        });
        saveJSON(REGULARS_KEY, next).then(res => setError(saveError(res)));
        return next;
      });
    }
    return { autoCount: auto.length, suggestions };
  }, [regulars, orders]);

  const deleteOrder = useCallback((id) => {
    setOrders(prev => {
      const target = (prev || []).find(o => o.id === id);
      if (target) (target.items || []).forEach((it, i) => { if (it.hasPhoto) deletePhoto(id, i); });
      const next = (prev || []).filter(o => o.id !== id);
      saveJSON(ORDERS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  const archiveDelivered = useCallback(() => {
    persistOrders((orders || []).map(o =>
      o.status === 'Delivered' && !o.archived ? { ...o, archived: true } : o
    ));
  }, [orders, persistOrders]);

  const [exportMsg, setExportMsg] = useState(null);

  // ── Backup payload + online backup ring (v9.20) ──────────────────────────
  // One builder for every path that serializes app data (clipboard copy,
  // file download, auto-push). Shape unchanged from the v9.18 exportData —
  // the worker validates version + orders on push, and restore validates
  // the same fields, so old Notes-paste backups stay importable.
  const buildBackupPayload = useCallback(() => ({
    version: 'ltb-v1',
    exportedAt: new Date().toISOString(),
    orders: orders || [],
    shopping,
    weekDishes,
    regulars,
    inventory,
    ingredientsDb,
    costHistory,
    receiptAliases,
  }), [orders, shopping, weekDishes, regulars, inventory, ingredientsDb, costHistory, receiptAliases]);

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

  const pushBackup = useCallback(async () => {
    try {
      const payload = payloadRef.current();
      if ((payload.orders || []).length === 0 && (payload.costHistory || []).length === 0) return;
      const { exportedAt, ...stable } = payload;
      const hash = String(djb2(JSON.stringify(stable)));
      if (hash === lastPushedHash.current) return;
      const res = await fetch(WORKER_BASE + '/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: PUBLISH_TOKEN, snapshot: payload }),
      });
      if (res.ok) lastPushedHash.current = hash;
    } catch { /* offline or worker down — next tick retries; silence is the feature */ }
  }, []);

  useEffect(() => {
    if (loading) return;
    pushBackup(); // on-open push, once data is actually loaded
    const tick = setInterval(pushBackup, 15 * 60 * 1000);
    const onVis = () => { if (document.visibilityState === 'hidden') pushBackup(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', onVis); };
  }, [loading, pushBackup]);

  // ── Shared restore body (v9.20) ───────────────────────────────────────────
  // ONE implementation applied by all three restore paths (file/paste/online)
  // — previously importData and submitImport were 45-line twins, the exact
  // "same logic in N places" footgun. Validation and any confirm dialog stay
  // with the CALLER; this just applies a validated payload.
  const applyBackupPayload = useCallback(async (payload) => {
    const res = await persistOrders((payload.orders || []).map(o => ({ ...o, items: stampItemCosts(o.items, 'backfilled') })));
    if (!res.ok) return false;
    if (Array.isArray(payload.shopping)) {
      setShopping(payload.shopping);
      await saveJSON(SHOPPING_KEY, payload.shopping);
    }
    if (Array.isArray(payload.weekDishes)) {
      setWeekDishes(payload.weekDishes);
      await saveJSON(WEEK_KEY, { selected: payload.weekDishes });
    }
    if (Array.isArray(payload.regulars)) {
      setRegulars(payload.regulars);
      await saveJSON(REGULARS_KEY, payload.regulars);
    }
    if (payload.inventory && typeof payload.inventory === 'object') {
      setInventory(payload.inventory);
      await saveJSON(INVENTORY_KEY, payload.inventory);
    }
    if (Array.isArray(payload.ingredientsDb)) {
      setIngredientsDb(payload.ingredientsDb);
      await saveJSON(INGREDIENTS_KEY, payload.ingredientsDb);
    }
    if (Array.isArray(payload.costHistory)) {
      setCostHistory(payload.costHistory);
      await saveJSON(COST_HISTORY_KEY, payload.costHistory);
    }
    if (payload.receiptAliases && typeof payload.receiptAliases === 'object') {
      setReceiptAliases(payload.receiptAliases);
      await saveJSON(RECEIPT_ALIASES_KEY, payload.receiptAliases);
    }
    setExportMsg(`Imported ${(payload.orders || []).length} orders successfully.`);
    setTimeout(() => setExportMsg(null), 4000);
    setError(null);
    return true;
  }, [persistOrders]);

  // ── Online restore (v9.20) ────────────────────────────────────────────────
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupList, setBackupList] = useState(null); // null=loading, []=none, 'error'=unreachable

  const openBackupModal = useCallback(async () => {
    setShowBackupModal(true);
    setBackupList(null);
    try {
      const res = await fetch(WORKER_BASE + '/backup/list', { cache: 'no-store', headers: { 'X-LTB-Token': PUBLISH_TOKEN } });
      const j = await res.json();
      setBackupList(res.ok && Array.isArray(j.backups) ? j.backups : 'error');
    } catch {
      setBackupList('error');
    }
  }, []);

  const restoreFromOnline = useCallback(async (age) => {
    try {
      const res = await fetch(WORKER_BASE + '/backup?age=' + age, { cache: 'no-store', headers: { 'X-LTB-Token': PUBLISH_TOKEN } });
      const j = await res.json();
      if (!res.ok || !j.snapshot) {
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

  const stats = useMemo(() => {
    const booked = currentOrders.reduce((s, o) => s + o.total, 0);
    const unpaid = currentOrders.filter(o => !o.paid).reduce((s, o) => s + o.total, 0);
    return { active: activeOrders.length, booked: round2(booked), unpaid: round2(unpaid) };
  }, [currentOrders, activeOrders]);

  const activeFinancials = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    activeOrders.forEach(o => {
      revenue += o.total;
      cost += orderCostInfo(o).cost;
    });
    return { revenue: round2(revenue), cost: round2(cost), profit: round2(revenue - cost) };
  }, [activeOrders]);

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

  const cookingList = useMemo(() => {
    const map = new Map();
    activeOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const key = `${it.category}::${it.name}::${it.variant}`;
        if (!map.has(key)) {
          map.set(key, { key, category: it.category, name: it.name, variant: it.variant, qty: 0 });
        }
        map.get(key).qty += it.qty;
      });
    });
    const catOrder = Object.keys(CATEGORY_LABELS);
    return Array.from(map.values()).sort(
      (a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || a.name.localeCompare(b.name)
    );
  }, [activeOrders]);

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

  const saveDishNote = useCallback((dishName, text) => {
    setDishNotes(prev => {
      const next = { ...prev, [dishName]: text };
      saveJSON(DISH_NOTES_KEY, next);
      return next;
    });
  }, []);

  const menu = useMemo(() => buildMenu(weekDishes), [weekDishes]);

  // Cost maps for live dish costing (Option B). baseline is static from the seed;
  // live reflects the current edited ingredient costs.
  const baseCostMap = useMemo(() => baselineCostMap(), []);
  const liveCostMap = useMemo(() => liveCostMapFrom(ingredientsDb), [ingredientsDb]);

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

  // ── SELF-MAINTAINING LIST (Jul 9 automation): the auto layer regenerates
  // whenever active orders change — a late order updates quantities by
  // itself, no Generate tap, no single-dish picker workaround. Manual rows
  // and checkmarks (keyed by ingredient NAME, so quantity changes don't
  // uncheck things mid-shop) always survive.
  const autoRegenRef = useRef('');
  useEffect(() => {
    if (!booted) return;
    const sig = JSON.stringify(activeOrders.map(o => [o.id, (o.items || []).map(it => [it.name, it.variant, it.qty, it.weight])])) + '|' + includeStaples;
    if (sig === autoRegenRef.current) return;
    autoRegenRef.current = sig;
    generateShopping(includeStaples);
  }, [booted, activeOrders, includeStaples, generateShopping]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingText}>Loading orders...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.logoMark}>LTB</div>
          <div style={styles.headerCenter}>
            <div style={styles.title}>Order tracker</div>
            <div style={styles.subtitle}>Lettuce, Turnip, The Beet · v9.20-GH</div>
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
            <button style={styles.headerActionBtn} onClick={openBackupModal} title="Backup & restore">
              <Download size={16} />
            </button>
            <button style={styles.headerActionBtn} onClick={pasteImport} title="Paste backup from clipboard">
              <Upload size={16} />
            </button>
          </div>
        </div>
        {exportMsg && <div style={styles.exportMsg}>{exportMsg}</div>}
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
              ['week', 'Week'],
              ['recipes', 'Recipes'],
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
              if (reg.discountPercent > 0) {
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
          <VoiceMode orders={orders || []} onUpdate={updateOrder} onAddItem={voiceAddItem} onArchiveDelivered={archiveDelivered} />
        )}
        {view === 'orders' && (
          <>
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
                          </div>
                        ))}
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

            <div style={styles.orderList}>
              {activeOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  regulars={regulars}
                  expanded={expandedOrder === order.id}
                  onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  onUpdate={(patch) => updateOrder(order.id, patch)}
                  onDelete={() => deleteOrder(order.id)}
                  onEdit={() => { setFormMode(order); setExpandedOrder(null); }}
                  onMakeRegular={makeRegularFromOrder}
                  onLinkRegular={linkOrderWithAlias}
                />
              ))}
            </div>

            {deliveredOrders.length > 0 && (
              <details style={styles.deliveredSection}>
                <summary style={styles.deliveredSummary}>
                  Delivered ({deliveredOrders.length})
                </summary>
                <div style={styles.orderList}>
                  {deliveredOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      regulars={regulars}
                      expanded={expandedOrder === order.id}
                      onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      onUpdate={(patch) => updateOrder(order.id, patch)}
                      onDelete={() => deleteOrder(order.id)}
                      onEdit={() => { setFormMode(order); setExpandedOrder(null); }}
                      onMakeRegular={makeRegularFromOrder}
                      onLinkRegular={linkOrderWithAlias}
                    />
                  ))}
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
            <MoneyTab orders={orders || []} onUpdate={updateOrder} />
            <DigestPanel orders={orders || []} regulars={regulars} liveCostMap={liveCostMap} baseCostMap={baseCostMap} onPullFeedback={pullKitchenFeedback} onCloseOut={closeOutWeek} />
          </>
        )}

        {view === 'recipes' && (
          <RecipesTab
            liveCostMap={liveCostMap}
            baseCostMap={baseCostMap}
            costHistory={costHistory}
            dishNotes={dishNotes}
            onSaveDishNote={saveDishNote}
            weekDishes={weekDishes}
            orders={orders || []}
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
            <WeekTab selected={weekDishes} onToggle={toggleWeekDish} onPublish={publishWeek} liveCostMap={liveCostMap} baseCostMap={baseCostMap} />
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
          <IngredientsTab ingredients={ingredientsDb} costHistory={costHistory} onChange={updateIngredients} onScanReceipt={() => setShowReceiptScan(true)} />
        )}
      </main>

      {showReceiptScan && (
        <ReceiptScan
          ingredients={ingredientsDb}
          costHistory={costHistory}
          aliases={receiptAliases}
          onSaveAliases={saveReceiptAliases}
          onCommit={commitReceiptCosts}
          onClose={() => setShowReceiptScan(false)}
        />
      )}
    </div>
  );
}

// ── Backup helpers + modal (v9.20) ──────────────────────────────────────────
// djb2 string hash — throttles auto-push (skip identical payloads). Not
// crypto, just cheap change detection.
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

// "26 hours ago" style honesty for the restore picker — never pretend a
// snapshot is exactly the age Kevin asked for.
function relativeAge(iso) {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const mins = Math.round(ms / 60e3);
  if (mins < 2) return 'just now';
  if (mins < 90) return `${mins} minutes ago`;
  const hours = Math.round(ms / 3600e3);
  if (hours < 48) return `${hours} hours ago`;
  return `${Math.round(ms / 86400e3)} days ago`;
}

// The four approximate restore targets, resolved against the REAL list:
// each option shows the actual nearest snapshot's true age, and options
// that resolve to the same snapshot collapse into one (no fake choices).
function resolveRestoreOptions(list) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const now = Date.now();
  const targets = [
    { age: 'recent', label: 'Most recent', ms: 0 },
    { age: '1h', label: 'About 1 hour ago', ms: 3600e3 },
    { age: '1d', label: 'About 1 day ago', ms: 24 * 3600e3 },
    { age: '3d', label: 'About 3 days ago', ms: 72 * 3600e3 },
  ];
  const seen = new Set();
  const options = [];
  for (const t of targets) {
    let best = null;
    let bestDiff = Infinity;
    for (const b of list) {
      const diff = Math.abs((now - Date.parse(b.timestamp)) - t.ms);
      if (diff < bestDiff) { bestDiff = diff; best = b; }
    }
    if (!best || seen.has(best.timestamp)) continue;
    seen.add(best.timestamp);
    options.push({ ...t, timestamp: best.timestamp, orders: best.orders });
  }
  return options;
}

function BackupModal({ list, onRestore, onRestoreFile, onDownloadFile, onCopy, onClose }) {
  const m = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    box: { background: '#1c2422', border: '1px solid #2d3a36', borderRadius: 12, padding: 18, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', color: '#e8e6df' },
    h: { margin: '0 0 4px', fontSize: 17, fontWeight: 700 },
    sub: { margin: '0 0 14px', fontSize: 12.5, color: '#9aa5a0', lineHeight: 1.45 },
    section: { fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#9aa5a0', margin: '16px 0 8px' },
    opt: { display: 'block', width: '100%', textAlign: 'left', background: '#232d2a', border: '1px solid #2d3a36', borderRadius: 10, padding: '10px 12px', marginBottom: 8, color: '#e8e6df', cursor: 'pointer' },
    optTitle: { fontSize: 14.5, fontWeight: 600 },
    optMeta: { fontSize: 12, color: '#9aa5a0', marginTop: 2 },
    row: { display: 'flex', gap: 8 },
    smallBtn: { flex: 1, background: '#232d2a', border: '1px solid #2d3a36', borderRadius: 10, padding: '10px 8px', color: '#e8e6df', fontSize: 13.5, cursor: 'pointer' },
    close: { display: 'block', width: '100%', marginTop: 14, background: 'none', border: 'none', color: '#9aa5a0', fontSize: 14, padding: 8, cursor: 'pointer' },
    note: { fontSize: 12, color: '#9aa5a0', lineHeight: 1.45 },
    fileLabel: { display: 'block', width: '100%', textAlign: 'center', background: '#232d2a', border: '1px solid #2d3a36', borderRadius: 10, padding: '10px 8px', color: '#e8e6df', fontSize: 13.5, cursor: 'pointer', boxSizing: 'border-box' },
  };
  const options = Array.isArray(list) ? resolveRestoreOptions(list) : [];
  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.box} onClick={e => e.stopPropagation()}>
        <h3 style={m.h}>Backup &amp; Restore</h3>
        <p style={m.sub}>The app backs itself up online automatically while it's open. Restoring replaces what's on this device.</p>

        <div style={m.section}>Restore from online</div>
        {list === null && <div style={m.note}>Checking for backups…</div>}
        {list === 'error' && <div style={m.note}>Couldn't reach the backup server. You can still restore from a file below.</div>}
        {Array.isArray(list) && options.length === 0 && <div style={m.note}>No online backups yet. They'll start appearing after the app has been open with data in it.</div>}
        {options.map(o => (
          <button key={o.age} style={m.opt} onClick={() => onRestore(o.age)}>
            <div style={m.optTitle}>{o.label}</div>
            <div style={m.optMeta}>
              {relativeAge(o.timestamp)} · {formatDate(o.timestamp)}
              {o.orders != null ? ` · ${o.orders} orders` : ''}
            </div>
          </button>
        ))}

        <div style={m.section}>Restore from file</div>
        <label style={m.fileLabel}>
          Choose a backup file…
          <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onRestoreFile} />
        </label>

        <div style={m.section}>Save a copy</div>
        <div style={m.row}>
          <button style={m.smallBtn} onClick={onDownloadFile}>Download file</button>
          <button style={m.smallBtn} onClick={onCopy}>Copy to clipboard</button>
        </div>

        <button style={m.close} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
