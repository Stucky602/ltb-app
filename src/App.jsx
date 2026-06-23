import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  normalizeIngredientName, generateShoppingItems, buildReheatBlocks,
} from './recipes.js';
import {
  SURCHARGE, WORKER_BASE, PENDING_POLL_URL, CONFIG_PUBLISH_URL,
  PUBLISH_TOKEN, VAPID_PUBLIC_KEY, USE_LEGACY_CSV, FORM_CSV_URL,
  ORDERS_KEY, CHECKS_KEY, DELIVER_CHECKS_KEY, DISH_NOTES_KEY, WEEK_NOTES_KEY,
  SHOPPING_KEY, WEEK_KEY, PENDING_KEY, SEEN_ROWS_KEY, REGULARS_KEY, INVENTORY_KEY,
} from './config.js';
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

export default function LTBOrderTracker() {
  // Inject spin keyframe for the check-form button loading indicator
  React.useEffect(() => {
    if (!document.getElementById('ltb-spin-style')) {
      const s = document.createElement('style');
      s.id = 'ltb-spin-style';
      s.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      document.head.appendChild(s);
    }
  }, []);

  // ── Service worker + push notification registration ───────────────────
  const [notifPerm, setNotifPerm] = React.useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  // Register the SW on load — no permission needed for this step.
  React.useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(e => {
      console.warn('SW registration failed:', e.message);
    });
  }, []);

  // Called when the user taps the bell button — requires a user gesture on iOS.
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
  const [cookSubView, setCookSubView] = useState('cook'); // 'cook' | 'deliver'
  const [dishNotes, setDishNotes] = useState({});         // { [dishName]: string }
  const [shopping, setShopping] = useState([]);
  const [weekDishes, setWeekDishes] = useState(DEFAULT_WEEK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('orders'); // 'orders' | 'cook' | 'shop' | 'money'
  const [formMode, setFormMode] = useState(null); // null | 'new' | order/draft object
  const [showPaste, setShowPaste] = useState(false);
  const [showAmend, setShowAmend] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]); // form submissions awaiting review
  const [showPendingIdx, setShowPendingIdx] = useState(null); // which pending order is open
  const [checkingForm, setCheckingForm] = useState(false); // true while manual form poll is running
  const [parsedNotes, setParsedNotes] = useState({}); // pendingId -> parsed notes object
  const [parsingNotes, setParsingNotes] = useState(null); // pendingId currently being parsed
  const [regulars, setRegulars] = useState([]); // VIP customer profiles
  const [inventory, setInventory] = useState({}); // sauce/add-on stock counts
  const [linkPrompt, setLinkPrompt] = useState(null); // {order, candidates} when confirming a regular link
  const [expandedOrder, setExpandedOrder] = useState(null);

  // ── Initial load ──────────────────────────────────────────────────────
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
      // Migrations for older saved orders
      const migrated = loadedOrders.map(o => ({
        ...o,
        // Item-level migration: form-imported orders previously stored
        // `upcharge: 0` (a number) and `lbs: null`, which broke rendering.
        // Normalize upcharge to either a proper {label, amount} object or
        // undefined, and drop the stray lbs field.
        items: (o.items || []).map(it => {
          const clean = { ...it };
          if (clean.upcharge != null && typeof clean.upcharge !== 'object') {
            delete clean.upcharge;
          }
          if ('lbs' in clean) delete clean.lbs;
          return clean;
        }),
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
      if (loadedWeek && Array.isArray(loadedWeek.selected)) {
        // Keep only dishes that still exist in the catalog
        const valid = loadedWeek.selected.filter(n => ALL_DINNERS.some(d => d.name === n));
        setWeekDishes(valid.length > 0 ? valid : DEFAULT_WEEK);
      }
      // Load any pending form orders from localStorage
      const savedPending = await loadJSON(PENDING_KEY, []);
      if (mounted) setPendingOrders(savedPending || []);

      // Load regulars and inventory
      const savedRegulars = await loadJSON(REGULARS_KEY, []);
      // Migrate legacy single-name profiles to the names[] model for couples.
      const migratedRegulars = (savedRegulars || []).map(r => {
        if (Array.isArray(r.names) && r.names.length) return r;
        const names = r.name ? [String(r.name).trim()] : [];
        return { ...r, names, name: names[0] || '' };
      });
      if (mounted) setRegulars(migratedRegulars);
      const savedInventory = await loadJSON(INVENTORY_KEY, {});
      if (mounted) setInventory(savedInventory || {});

      setLoading(false);
      // Prune proof photos that are orphaned, archived, or older than the TTL
      cleanupPhotos(migrated);
      // Start the order intake poll. New path = Worker /pending; legacy = CSV.
      if (USE_LEGACY_CSV) {
        pollFormOrders(migrated, savedPending || []);
      } else {
        pollWorkerPending();
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Persistence ───────────────────────────────────────────────────────
  // Returns the saveJSON result so callers (like import) can await + verify.
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

  // ── Order operations ──────────────────────────────────────────────────
  // Map from menu item name to inventory key for auto-decrement on order save.
  const INVENTORY_ADDON_MAP = {
    'Queso': 'queso_0', // defaults to no-heat; adjust manually in inventory if a different spice level
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

      // Auto-decrement inventory for tracked add-ons on NEW orders only
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

  // Bulk-add orders parsed from a Google Sheet / CSV paste. Each gets a fresh id,
  // computed total, and default status so it lands as a normal new order.
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


  // Manual "Check for new orders" button handler
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

  // Long-press "Check for new orders" to reset seen rows from the past 7 days,
  // so recent orders get re-queued as pending without dredging up old history.
  const resetRecentSeenRows = React.useCallback(async () => {
    const seenRaw = await loadJSON(SEEN_ROWS_KEY, {});
    const seen = seenRaw || {};
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago in ms

    // Google Sheets timestamps are in the format "M/D/YYYY H:MM:SS" or similar.
    // Parse them and remove any that fall within the past 7 days.
    let removed = 0;
    const updated = {};
    Object.entries(seen).forEach(([ts, val]) => {
      const parsed = new Date(ts);
      if (!isNaN(parsed.getTime()) && parsed.getTime() >= cutoff) {
        // Recent — remove from seen so it gets re-queued
        removed++;
      } else {
        // Old or unparseable — keep
        updated[ts] = val;
      }
    });

    await saveJSON(SEEN_ROWS_KEY, updated);
    alert('Reset ' + removed + ' recent order' + (removed !== 1 ? 's' : '') + ' from seen history. Tap "Check for new orders" to re-import them.');
  }, []);

  // ── Form polling: fetch the published CSV, find new rows, queue as pending ──
  // Uses a ref to avoid stale closure issues with state.
  const pollFormOrders = React.useCallback(async (existingOrders, existingPending) => {
    const rows = await fetchFormRows();
    if (!rows) return; // network failure — silently skip

    // Load seen row timestamps from localStorage
    const seenRaw = await loadJSON(SEEN_ROWS_KEY, {});
    const seen = seenRaw || {};

    const newPending = [];
    rows.forEach(row => {
      const ts = row['Timestamp'] || row['timestamp'] || '';
      if (!ts || seen[ts]) return; // already processed
      const { customer, items, notes } = parseFormRow(row);
      if (items.length === 0 && !notes) return; // blank row
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
      // Still save seen map if it changed (even if no new pending)
      await saveJSON(SEEN_ROWS_KEY, seen);
    }

    // Schedule next poll in 5 minutes
    setTimeout(() => pollFormOrders(existingOrders, existingPending), 5 * 60 * 1000);
  }, []);

  // ── Worker pending poll (NEW intake path) ──────────────────────────────────
  // Pulls submissions from the Worker /pending endpoint, adds any not already
  // in our queue (tracked by submission id), then clears them from the Worker
  // so they aren't pulled again. Self-reschedules every 2 minutes via a ref to
  // avoid a circular callback dependency.
  const workerPollRef = React.useRef(null);
  const pollWorkerPending = React.useCallback(async (reschedule = true) => {
    try {
      const res = await fetch(PENDING_POLL_URL, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const submissions = (data && data.pending) || [];
        if (submissions.length > 0) {
          const mapped = submissions.map(s => ({
            pendingId: s.id, // use the Worker's submission id as our pending id
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
          // Clear pulled submissions from the Worker so they aren't re-fetched
          const ids = submissions.map(s => s.id);
          fetch(WORKER_BASE + '/pending/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          }).catch(() => {});
        }
      }
    } catch (e) {
      // network hiccup — just try again next cycle
    }
    if (reschedule) {
      if (workerPollRef.current) clearTimeout(workerPollRef.current);
      workerPollRef.current = setTimeout(() => pollWorkerPending(true), 2 * 60 * 1000);
    }
  }, []);

  // Manual "check now" for the Worker pending queue (used by the button)
  const checkWorkerNow = React.useCallback(async () => {
    setCheckingForm(true);
    await pollWorkerPending(false); // don't disturb the scheduled cycle
    setCheckingForm(false);
  }, [pollWorkerPending]);

  // ── Publish the week: push active menu config to the Worker ────────────────
  // Builds the config the custom form reads (dinners, add-ons, desserts, etc.),
  // then POSTs it to /config with the publish token.
  const publishWeek = React.useCallback(async (currentWeekDishes, menuPdfUrl, weekLabel) => {
    const activeMenu = buildMenu(currentWeekDishes || []);
    const toVariants = (item) => {
      const info = PER_LB_ITEMS[item.name];
      if (info) {
        // Per-lb items: publish pricePerLb only (no $1.50 baked in).
        // The form and menu page display "$X/lb + $1.50 bag" from the perLb flag.
        return {
          name: item.name,
          perLb: true,
          pricePerLb: info.pricePerLb,
          variants: [{ label: 'By weight', price: info.pricePerLb, cost: info.costPerLb }],
        };
      }
      return {
        name: item.name,
        variants: (item.variants || []).map(v => ({ label: v.label, price: v.price, cost: v.cost || 0 })),
      };
    };
    // Customers can order this week's dinners plus all always-available items.
    const dishes = (activeMenu.dinner || []).map(toVariants);
    // Note: breakfast (waffles) excluded from published config intentionally.
    // Waffles are available by request via order notes only — not listed publicly.
    const fruit = (activeMenu.fruit || []).map(toVariants);
    const desserts = (activeMenu.desserts || []).map(toVariants);
    const addons = (activeMenu.addons || []).map(toVariants);
    const bag = (activeMenu.bag || []).map(toVariants);
    const sauces = (activeMenu.sauces || []).map(toVariants);

    const payload = {
      token: PUBLISH_TOKEN,
      dishes, fruit, desserts, addons, bag, sauces,
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

  // Accept a pending order — convert to a real order and add to active.
  // Auto-links to a regular on exact full-name match (and pre-applies their
  // lifetime discount); on a partial match, queues a prompt to confirm.
  const acceptPending = useCallback((pending) => {
    const orderId = uid();

    // Look for a matching regular — checks ALL names on each profile, so either
    // person in a couple links to the same shared profile.
    let exactReg = null;
    const partialRegs = [];
    regulars.forEach(r => {
      const m = regularMatchType(r, pending.customer);
      if (m === 'exact') exactReg = r;
      else if (m === 'partial') partialRegs.push(r);
    });

    // If exact match has a lifetime discount, pre-apply it (toggle defaults on)
    const discountType = exactReg && exactReg.discountPercent > 0 ? 'percent' : null;
    const discountValue = exactReg && exactReg.discountPercent > 0 ? exactReg.discountPercent : 0;
    const total = orderTotal(pending.items, 0, 0, discountType, discountValue, [], false);

    const order = {
      id: orderId,
      // Keep the actual name the customer ordered under, not the profile's
      // primary — so you can see which half of a couple placed it.
      customer: pending.customer,
      address: pending.address || '',
      phone: pending.phone || '',
      items: pending.items,
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

    // Auto-decrement inventory for any tracked add-ons in this order
    (order.items || []).forEach(it => {
      const invKey = INVENTORY_ADDON_MAP[it.name];
      if (invKey) adjustInventory(invKey, -(it.qty || 1));
    });

    // Auto-link silently on exact match
    if (exactReg) {
      linkOrderToRegular(exactReg.id, orderId);
    } else if (partialRegs.length > 0) {
      // Queue a prompt to confirm a partial match
      setLinkPrompt({ order, candidates: partialRegs });
    }

    dismissPending(pending.pendingId);
    setShowPendingIdx(null);
  }, [regulars]);


  // Reject a pending order — remove from queue without adding to orders
  const dismissPending = useCallback((pendingId) => {
    setPendingOrders(prev => {
      const next = prev.filter(p => p.pendingId !== pendingId);
      saveJSON(PENDING_KEY, next);
      return next;
    });
    setShowPendingIdx(null);
  }, []);

  // ── Regulars management ────────────────────────────────────────────────────
  const persistRegulars = useCallback((next) => {
    setRegulars(next);
    saveJSON(REGULARS_KEY, next).then(res => setError(saveError(res)));
  }, []);

  const addRegular = useCallback((profile) => {
    // Normalize incoming names into a clean array (supports couples/groups).
    const names = (Array.isArray(profile.names) ? profile.names : [profile.name])
      .map(n => String(n || '').trim())
      .filter(Boolean);
    const reg = {
      id: uid(),
      names,
      name: names[0] || '', // legacy primary, kept for backward compatibility
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

  // Link an order to a regular (by id), and refresh that regular's insights.
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

  // ── Inventory management ───────────────────────────────────────────────────
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


  const updateOrder = useCallback((id, patch) => {
    setOrders(prev => {
      const next = (prev || []).map(o => (o.id === id ? { ...o, ...patch } : o));
      saveJSON(ORDERS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  const deleteOrder = useCallback((id) => {
    setOrders(prev => {
      const target = (prev || []).find(o => o.id === id);
      // Clean up any saved scale photos for this order
      if (target) (target.items || []).forEach((it, i) => { if (it.hasPhoto) deletePhoto(id, i); });
      const next = (prev || []).filter(o => o.id !== id);
      saveJSON(ORDERS_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  // Archiving keeps the order for the Money tab but removes it from weekly views
  const archiveDelivered = useCallback(() => {
    persistOrders((orders || []).map(o =>
      o.status === 'Delivered' && !o.archived ? { ...o, archived: true } : o
    ));
  }, [orders, persistOrders]);

  // ── Export / Import ───────────────────────────────────────────────────
  const [exportMsg, setExportMsg] = useState(null);

  const exportData = useCallback(async () => {
    const payload = {
      version: 'ltb-v1',
      exportedAt: new Date().toISOString(),
      orders: orders || [],
      shopping,
      weekDishes,
      regulars,
      inventory,
    };
    const json = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setExportMsg('Copied! Paste into Notes or anywhere to save.');
    } catch {
      // clipboard API also sometimes needs a user gesture context — try the old way
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
  }, [orders, shopping, weekDishes, regulars, inventory]);

  const importData = useCallback(async (e) => {
    // Called with either a file input event or a raw JSON string (from paste import)
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
      const res = await persistOrders(payload.orders);
      if (!res.ok) return; // persistOrders set the specific error already
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
      setExportMsg(`Imported ${payload.orders.length} orders successfully.`);
      setTimeout(() => setExportMsg(null), 4000);
      setError(null);
    } catch {
      setError("Couldn't read that backup — make sure you copied the full text.");
    }
  }, [persistOrders]);

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
      const res = await persistOrders(payload.orders);
      if (!res.ok) {
        // Save failed — tell the user honestly; persistOrders already set the error
        return;
      }
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
      setExportMsg(`Imported ${payload.orders.length} orders successfully.`);
      setTimeout(() => setExportMsg(null), 4000);
      setError(null);
    } catch {
      setError("Couldn't read that — make sure you copied the full backup text.");
    }
  }, [persistOrders]);

  // ── Derived data ──────────────────────────────────────────────────────
  const currentOrders = useMemo(() => (orders || []).filter(o => !o.archived), [orders]);
  const activeOrders = useMemo(() => currentOrders.filter(o => o.status !== 'Delivered'), [currentOrders]);
  const deliveredOrders = useMemo(() => currentOrders.filter(o => o.status === 'Delivered'), [currentOrders]);

  // Stats bar covers the current (non-archived) week; Money tab covers all time
  const stats = useMemo(() => {
    const booked = currentOrders.reduce((s, o) => s + o.total, 0);
    const unpaid = currentOrders.filter(o => !o.paid).reduce((s, o) => s + o.total, 0);
    return { active: activeOrders.length, booked: round2(booked), unpaid: round2(unpaid) };
  }, [currentOrders, activeOrders]);

  // Revenue + estimated ingredient cost tied up in active (not-yet-delivered) orders.
  // Gives a quick gut check while cooking and shopping. weightPending proteins
  // contribute $0 until weighed, which is correct (not bought yet).
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

  // Same active-order items as the cook list, but grouped by customer order so
  // each bag can be packed and checked off independently. Keys are stable per
  // order+item so checking one customer's dish never affects another's.
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

  // The menu in effect this week — drives the picker, AI parser, and new orders
  const menu = useMemo(() => buildMenu(weekDishes), [weekDishes]);

  const toggleWeekDish = useCallback((name) => {
    setWeekDishes(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name];
      saveJSON(WEEK_KEY, { selected: next }).then(res => setError(saveError(res)));
      return next;
    });
  }, []);

  // Regenerate auto items from active orders; manual items and checked states survive
  const generateShopping = useCallback((includeStaples) => {
    const lines = generateShoppingItems(activeOrders, includeStaples);
    setShopping(prev => {
      const checkedByText = new Map(prev.filter(it => it.checked).map(it => [it.text, true]));
      const manual = prev.filter(it => !it.auto);
      const autos = lines.map(text => ({
        id: uid(),
        text,
        checked: !!checkedByText.get(text),
        auto: true,
      }));
      const next = [...autos, ...manual];
      saveJSON(SHOPPING_KEY, next).then(res => setError(saveError(res)));
      return next;
    });
  }, [activeOrders]);

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
            <div style={styles.subtitle}>Lettuce, Turnip, The Beet · v9.9-GH</div>
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
            <button style={styles.headerActionBtn} onClick={exportData} title="Copy backup to clipboard">
              <Download size={16} />
            </button>
            <button style={styles.headerActionBtn} onClick={pasteImport} title="Paste backup from clipboard">
              <Upload size={16} />
            </button>
          </div>
        </div>
        {exportMsg && <div style={styles.exportMsg}>{exportMsg}</div>}
        <nav style={styles.tabs}>
          {[
            ['orders', 'Orders'],
            ['cook', 'Cook'],
            ['shop', 'Shop'],
            ['money', 'Money'],
            ['regulars', 'Regulars'],
            ['week', 'Week'],
          ].map(([key, label]) => (
            <button
              key={key}
              style={{ ...styles.tab, ...(view === key ? styles.tabActive : {}) }}
              onClick={() => setView(key)}
            >
              {label}
              {key === 'orders' && stats.active > 0 && <span style={styles.tabBadge}>{stats.active}</span>}
            </button>
          ))}
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

      {linkPrompt && (
        <LinkRegularPrompt
          order={linkPrompt.order}
          candidates={linkPrompt.candidates}
          onLink={(regularId) => {
            linkOrderToRegular(regularId, linkPrompt.order.id);
            // Also stamp the regularId onto the order and apply discount if any
            const reg = regulars.find(r => r.id === regularId);
            if (reg) {
              const patch = { regularId };
              if (reg.discountPercent > 0) {
                patch.discountType = 'percent';
                patch.discountValue = reg.discountPercent;
                patch.total = orderTotal(linkPrompt.order.items, linkPrompt.order.jarSwaps, linkPrompt.order.containerReturns, 'percent', reg.discountPercent, linkPrompt.order.customCharges, linkPrompt.order.waiveSurcharge);
              }
              updateOrder(linkPrompt.order.id, patch);
            }
            setLinkPrompt(null);
          }}
          onSkip={() => setLinkPrompt(null)}
        />
      )}

      <main style={styles.main}>
        {view === 'orders' && (
          <>
            <StatsBar stats={stats} />

            {!formMode && !showPaste && !showAmend && !showCsv && (
              <div style={styles.topActions}>
                <button style={styles.newOrderBtn} onClick={() => setFormMode('new')}>
                  <Plus size={18} />
                  New order
                </button>
                {/* AI text parsing is disabled in the GitHub/localStorage build.
                    Anthropic's API can't be called directly from a public static
                    site (no sandbox auth, CORS blocked). The full parser code is
                    left intact below — to re-enable, restore the onClick handlers
                    and remove the strikethrough/disabled styling, then point the
                    fetch calls at a server-side proxy (see setup notes). */}
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

            {/* ── Pending form orders queue ── */}
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
            activeCount={activeOrders.length}
            estCost={activeFinancials.cost}
            weekDishes={weekDishes}
            inventory={inventory}
            onAdjustInventory={adjustInventory}
            onSetInventory={setInventoryCount}
            dishNotes={dishNotes}
            onSaveDishNote={saveDishNote}
          />
        )}

        {view === 'money' && (
          <MoneyTab orders={orders || []} onUpdate={updateOrder} />
        )}

        {view === 'regulars' && (
          <RegularsTab
            regulars={regulars}
            orders={orders || []}
            onAdd={addRegular}
            onUpdate={updateRegular}
            onDelete={deleteRegular}
            onLink={linkOrderToRegular}
            onUnlink={unlinkOrderFromRegular}
          />
        )}

        {view === 'week' && (
          <WeekTab selected={weekDishes} onToggle={toggleWeekDish} onPublish={publishWeek} />
        )}
      </main>
    </div>
  );
}

// ─── Prompt to link a form order to a regular on a partial name match ───────
