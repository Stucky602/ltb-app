import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Check, ChevronDown, ChevronUp, X, Pencil, Copy, RotateCcw,
  ClipboardPaste, ArrowUpDown, Archive, ImageIcon, AlertTriangle, FileText,
  Scale, Camera, Download, Upload, Flame, Bell,
} from './icons.jsx';
import {
  ALWAYS_MENU, DEFAULT_WEEK, FULL_MENU,
  isPerLbItem, buildMenu, CATEGORY_LABELS, STATUSES, STATUS_COLORS,
} from './menu.js';
import {
  RECIPES, INGREDIENT_SYNONYMS, SOUS_VIDE_VEG, DINNER_REHEAT_BUCKET,
  RICE_DISHES, PASTA_DISHES, NOODLE_DISHES,
  normalizeIngredientName, generateShoppingItems, buildAutoShoppingRows, buildReheatBlocks,
} from './recipes.js';
import {
  SURCHARGE, WORKER_BASE, PENDING_POLL_URL,
  PUBLISH_TOKEN, VAPID_PUBLIC_KEY, ensurePublishToken,
  ORDERS_KEY, CHECKS_KEY, DELIVER_CHECKS_KEY, DISH_NOTES_KEY, PIPELINE_JOURNAL_KEY, WEEK_NOTES_KEY,
  JOURNAL_KEY, CONTAINER_INVENTORY_KEY, COPIES_NOTE_KEY, ARCHIVE_HISTORY_KEY, SW_VERSION_KEY,
  SHOPPING_KEY, WEEK_KEY,
  BACKUP_STATE_KEY, BACKUP_STALE_MS, AUDIT_LOG_KEY,
  LAST_SEEN_WEEK_KEY, HANDLED_PENDING_KEY, REAL_DATA_EPOCH_KEY, ROWAN_LOG_KEY, DISH_RANKING_KEY, VISUAL_CUES_KEY, CUSTOMER_FLAGS_KEY,
  PRACTICES_KEY, CAPTURE_INBOX_KEY, LABEL_VERSIONS_KEY, WALK_ANSWERS_KEY,
  TERMS_KEY, ANATOMY_KEY, DERIVATIVES_KEY, ROWAN_QUESTIONS_KEY, CLARIFICATIONS_KEY,
  NOTES_ROWAN_KEY, DECISION_LEDGER_KEY, ROWAN_BOARDS_KEY, ROWAN_ROLES_KEY, HOUSEHOLD_MEMORIES_KEY, PASSPORT_CABINETS_KEY,
} from './config.js';
import {
  uid, currency, round2, DISH_CUISINE, dishCuisine, normName,
  MIN_ORDERS_FOR_INSIGHT, localStore, store, PHOTO_PREFIX, PHOTO_TTL_DAYS, fmtBytes,
  urlBase64ToUint8Array, onStorageFull, storageFootprint, nameMatchType, regularNames, regularDisplayName,
  buildInsights, insightStamp, loadHtml2Canvas,
  discountAmount, itemsUpchargeTotal, customChargesTotal, itemsBaseTotal,
  orderTotal, repricePerLbItem, itemCost, orderCostInfo,
  optionsSummary, noteWithoutOptions, itemAddons,
  groupKeyFor, formatDate, orderToText, copyText, loadJSON, saveJSON, saveError,
  photoKey, savePhoto, loadPhoto, photoStorageBytes,
  menuForPrompt, fileToJpegBase64, parseOrderText, validateParsedOrder, parseAmendment,
  parseFormNotes,
  houseOrderPatch, isHouseOrder, HOUSE_DISCOUNT_PERCENT,
} from './utils.js';
// migrations.js, seedReconcile.js, and INGREDIENT_SEED are no longer imported
// here at all: the schema guard, the seed reconcile, and the deploy-fingerprint
// diff all moved with boot hydration into bootHydrate.js, and the restore-side
// copies of the same guards live in backupRestore.js. Both of those are choke
// points by design. If a third caller ever needs them, that is a signal to ask
// why, not to re-add the import.
import { emptyJournal, normalizeJournal, addEntry as addJournalEntry } from './journal.js';
import { normalizeLedger } from './weekLedger.js';
import { useWakeLock } from './useWakeLock.js';
import { usePreserveScroll } from './usePreserveScroll.js';
import { currentWeekInfo, msUntilDeadline, formatCountdown, intakeVsMedian, weekRolledOver } from './timeBanners.js';
import { sortList, filterByStatus, searchList, orderHaystacks, windowList, DEFAULT_WINDOW } from './listControls.js';
import { containerReport, normalizeContainerConfig } from './containers.js';
import { appendAudit } from './auditLog.js';
import { TEAL_DARK, TEAL_MID, TEAL_LIGHT, GOLD, CREAM, DARK, CARD, styles } from './styles.js';

import { ImportModal } from './components/ImportModal.jsx';
import { LinkRegularPrompt, RegularsTab, RegularForm, RegularProfile } from './components/RegularsTab.jsx';
import { WeekTab } from './components/WeekTab.jsx';
import { StatsBar, QtyControl, PasteOrderCard, AmendOrderCard, ReviewModal } from './components/OrderInputs.jsx';
import { OrderForm } from './components/OrderForm.jsx';
import { InvoiceModal, ReheatModal, WeightPhotoModal } from './components/Modals.jsx';
import { OrderCard } from './components/OrderCard.jsx';
import { ArchiveDeliveredButton, CookingList, DeliverList } from './components/CookTabs.jsx';
import { ShoppingList } from './components/ShoppingList.jsx';
import { MoneyTab } from './components/MoneyTab.jsx';
import { undecidedOmakases, omakaseStats, omakasePriceUnsettled } from './omakase.js';
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
import { AppHeader } from './components/AppHeader.jsx';
import { OrderBanners } from './components/OrderBanners.jsx';
import { PendingOrders } from './components/PendingOrders.jsx';
import { OrderListControls } from './components/OrderListControls.jsx';
import { BulkActionBar } from './components/BulkActionBar.jsx';
import { hydrateFromStorage } from './bootHydrate.js';
import { buildCorpus } from './corpus.js';
// Namespaced rather than named: every one of these has a same-named thin
// wrapper below, and `ops.updateOrder` inside `const updateOrder = ...` reads
// unambiguously where a bare import would shadow itself.
import * as ops from './orderOps.js';
import * as fb from './feedbackSync.js';
import * as ing from './ingredientOps.js';
import * as pub from './publishWeek.js';
import * as poll from './pendingPoll.js';
import { AmendmentQueue } from './components/AmendmentQueue.jsx';
import { acceptAmendment, supersedePending } from './amendments.js';
import { buildProfileSnapshot, sanitizeSnapshot, generateClaimCode, ensureProfileId } from './customerDevice.js';
import { normalizeFlags } from './featureFlags.js';
import { jarsOutForRegular } from './utils.js';
import { dishIdFor } from './dishIdentity.js';
import { containerCustody } from './containers.js';
import { proposeEpoch, stampBackfilled, epochSummary } from './realDataEpoch.js';
import { makeEntry as makeRowanEntry, addEntry as addRowanEntry, attachCapsule, editTranscript } from './rowan.js';
import { uploadAudio } from './mediaClient.js';
import { RowanLogCard } from './components/RowanLogCard.jsx';
import { RowanTab } from './components/RowanTab.jsx';
import { cookingPatterns, tasteVsPractice } from './cookingPatterns.js';
import { SEED_RANKING, addRanking, latest as latestRanking, drift as rankingDrift, tasteVsSales, tasteVsSon, staleness as rankingStaleness } from './dishRanking.js';
import { dishOrderSignal } from './favorites.js';
import { topDishes as sonTopDishes } from './rowan.js';
// Menu dishes only, deliberately: he eats yoghurt and berries too and that is
// not what the record is for. See the header comment in rowan.js.
const ALL_MENU_DISH_NAMES = [
  ...Object.values(FULL_MENU).flat().map(d => (typeof d === 'string' ? d : d && d.name)),
].filter(Boolean).filter((n, i, a) => a.indexOf(n) === i).sort();

export default function LTBOrderTracker() {
  // ── Owner token ───────────────────────────────────────────────────────────
  // Prompts once per device and stores it in localStorage. It used to be a
  // string literal in src/config.js, which meant it shipped inside app.js —
  // and index.html serves app.js publicly, so the token that guards /backup
  // (customer addresses, phone numbers, the private journal, Rowan's log) was
  // readable by anyone who opened the site. Runs before any effect that talks
  // to an owner route.
  //
  // This is not authentication. It removes a published secret from a public
  // file. Cloudflare Access in front of index.html is the actual boundary.
  React.useEffect(() => { ensurePublishToken(); }, []);

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
        // The other deliberate survivor: per-device service-worker bookkeeping, not
    // Kevin's data. Nothing is lost if it fails, and the update prompt is
    // self-correcting on the next boot.
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
  // EQUIPMENT INVENTORY REMOVED Jul 30. It fed exactly one thing — the archive's
  // "The equipment these assume" section — and Kevin killed that section from
  // both the Record tab and the archive because it was pointless and looked bad.
  // What remained was a seed file, a boot hydrate, a state hook, and a backup
  // slot, all feeding nothing.
  //
  // The STORAGE KEY is deliberately left alone: ltb_equipment_v1 may still hold
  // a list on Kevin's devices, and deleting it on upgrade would throw away data
  // he typed in by hand for a section that could come back.

  // The real-data epoch. Null means unconfirmed, which is the safe default:
  // every dependent feature stays exactly where it is today rather than acting
  // on a guess. Confirming it STAMPS the affected orders so the flag rides the
  // backup and survives on any device, instead of being recomputed from a date
  // that could later move.
  const [realDataEpoch, setRealDataEpoch] = useState(null);
  // The son's food log. Append-only: a rating is never edited or replaced,
  // because the series IS the record and overwriting it would erase the only
  // thing this store exists to show.
  const [rowanLog, setRowanLog] = useState([]);
  const [practices, setPractices] = useState(() => ({ version: 1, entries: [] }));
  const [captureInbox, setCaptureInbox] = useState(() => ({ version: 1, items: [] }));
  const [labelVersions, setLabelVersions] = useState(() => ({ version: 1, labels: [] }));
  const [walkAnswers, setWalkAnswers] = useState(() => ({ version: 1, walks: {} }));
  const [terms, setTerms] = useState(() => ({ version: 1, terms: [] }));
  const [anatomy, setAnatomy] = useState(() => ({ version: 1, entries: [] }));
  const [derivatives, setDerivatives] = useState(() => ({ version: 1, derivatives: [] }));
  const [rowanQuestions, setRowanQuestions] = useState(() => ({ version: 1, questions: [] }));
  const [clarifications, setClarifications] = useState(() => ({ version: 1, items: [] }));
  const [notesRowan, setNotesRowan] = useState(() => ({ version: 1, notes: [] }));
  const [decisionLedger, setDecisionLedger] = useState(() => ({ version: 1, decisions: [] }));
  const [rowanBoards, setRowanBoards] = useState(() => ({ version: 1, boards: [] }));
  const [rowanRoles, setRowanRoles] = useState(() => ({ version: 1, sessions: [] }));
  const [householdMemories, setHouseholdMemories] = useState(() => ({ version: 1, memories: [] }));
  const [passportCabinets, setPassportCabinets] = useState(() => ({ version: 1, cabinets: [] }));
  // Banner dismissals. Deliberately NOT persisted: these are warnings, and the
  // keys already scope them tightly (per-day for the deadline, per-shortage for
  // containers), so a reload restoring them is the right amount of insistence.
  // Kevin's own ranking, a dated series. Seeded with the Jul 26 head-to-head so
  // the record starts with real data instead of an empty state.
  const [dishRankings, setDishRankings] = useState([SEED_RANKING]);
  const saveRanking = useCallback((ranking) => {
    setDishRankings(prev => {
      const next = addRanking(prev || [], ranking);
      saveJSON(DISH_RANKING_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  // Owned container counts are the ONE editable number in the inventory panel;
  // `out` is derived from delivered orders through the audited map, so it is not
  // something to type over. Buying more, losing one, or finding a stack in the
  // garage are all changes to OWNED.
  const setOwnedContainers = useCallback((type, value) => {
    setContainerConfig(prev => {
      const cur = normalizeContainerConfig(prev);
      const next = { ...cur, owned: { ...cur.owned, [type]: Math.max(0, Number(value) || 0) } };
      saveJSON(CONTAINER_INVENTORY_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const [dismissedBanners, setDismissedBanners] = useState({});
  const dismissBanner = useCallback((k) => {
    if (k) setDismissedBanners(prev => ({ ...prev, [k]: true }));
  }, []);
  const logRowan = useCallback((input) => {
    // ORDER MATTERS: the entry is saved FIRST, synchronously, and the audio
    // uploads after. A failed or slow upload then costs the recording and never
    // the rating — and the rating is the thing the whole longitudinal series is
    // built from. Doing it the other way round would mean a dropped connection
    // silently loses a logged meal.
    const { clip, ...rest } = input || {};
    const entry = makeRowanEntry(rest);
    setRowanLog(prev => {
      const next = addRowanEntry(prev || [], entry);
      saveJSON(ROWAN_LOG_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
    if (!clip || !clip.blob) return;
    uploadAudio(entry.id, clip.blob, { workerBase: WORKER_BASE, token: PUBLISH_TOKEN })
      .then(res => {
        if (!res.ok) {
          // Named plainly. The entry survived; only the recording did not, and
          // Kevin needs to know which so he can decide whether to re-record.
          setError('The note was saved but the recording did not upload: ' + res.reason);
          return;
        }
        setRowanLog(prev => {
          const next = attachCapsule(prev || [], entry.id, {
            mediaKey: res.mediaKey, contentType: res.contentType,
            seconds: clip.seconds, bytes: res.bytes, checksum: res.checksum,
          });
          saveJSON(ROWAN_LOG_KEY, next).then(r => setError(saveError(r)));
          return next;
        });
      })
      .catch(() => setError('The note was saved but the recording did not upload.'));
  }, []);

  const saveRowanTranscript = useCallback((entryId, text) => {
    setRowanLog(prev => {
      const next = editTranscript(prev || [], entryId, text);
      saveJSON(ROWAN_LOG_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveNotesRowan = useCallback((updater) => {
    setNotesRowan(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(NOTES_ROWAN_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveRowanBoards = useCallback((updater) => {
    setRowanBoards(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(ROWAN_BOARDS_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveRowanRoles = useCallback((updater) => {
    setRowanRoles(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(ROWAN_ROLES_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveDecisionLedger = useCallback((updater) => {
    setDecisionLedger(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(DECISION_LEDGER_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveRowanQuestions = useCallback((updater) => {
    setRowanQuestions(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(ROWAN_QUESTIONS_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveClarifications = useCallback((updater) => {
    setClarifications(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(CLARIFICATIONS_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveTerms = useCallback((updater) => {
    setTerms(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(TERMS_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveAnatomy = useCallback((updater) => {
    setAnatomy(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(ANATOMY_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveDerivatives = useCallback((updater) => {
    setDerivatives(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(DERIVATIVES_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveWalkAnswers = useCallback((updater) => {
    setWalkAnswers(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(WALK_ANSWERS_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveLabelVersions = useCallback((updater) => {
    setLabelVersions(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(LABEL_VERSIONS_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveCaptureInbox = useCallback((updater) => {
    setCaptureInbox(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(CAPTURE_INBOX_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const savePractices = useCallback((updater) => {
    setPractices(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(PRACTICES_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const epochProposal = useMemo(() => proposeEpoch(orders || []), [orders]);
  const confirmEpoch = useCallback((iso) => {
    const v = iso ? new Date(iso).toISOString() : null;
    setRealDataEpoch(v);
    saveJSON(REAL_DATA_EPOCH_KEY, v).then(r => setError(saveError(r)));
    setOrders(prev => {
      const next = stampBackfilled(prev || [], v);
      if (next === prev) return prev;
      saveJSON(ORDERS_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, []);
  const saveEquipment = useCallback((next) => {
    const clean = (Array.isArray(next) ? next : [])
      .map(e => ({ name: String(e.name || '').slice(0, 80), note: String(e.note || '').slice(0, 200) }))
      .filter(e => e.name)
      .slice(0, 60);
    setEquipment(clean);
    saveJSON(EQUIPMENT_KEY, clean).then(r => setError(saveError(r)));
  }, []);
  // Stamped each time an archive is downloaded, so the NEXT one knows where it
  // sits in the series.
  const recordArchive = useCallback((entryCount) => {
    setArchiveHistory(prev => {
      const next = [...prev, { generatedAt: new Date().toISOString(), entryCount }].slice(-40);
      saveJSON(ARCHIVE_HISTORY_KEY, next).then(r => setError(saveError(r)));
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
  // Set only by the boot catch below. Non-null means hydration threw and the
  // app must not render its normal UI on top of half-loaded state.
  const [bootError, setBootError] = useState(null);
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
    saveJSON(LAST_SEEN_WEEK_KEY, stamp).then(r => setError(saveError(r)));
  }, []);
  const [showLabels, setShowLabels] = useState(false); // bag-labels print sheet
  const [formMode, setFormMode] = useState(null);
  const [showPaste, setShowPaste] = useState(false);
  const [showAmend, setShowAmend] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [waitingOpen, setWaitingOpen] = useState(true);

  // ── Amendments ────────────────────────────────────────────────────────────
  // Customer change requests. The worker stores them; nothing there ever writes
  // to an order. Applying an accepted patch happens HERE, through updateOrder,
  // so the order keeps exactly one writer.
  const [amendments, setAmendments] = useState([]);

  // How many decisions are waiting, across all three queues.
  //
  // DECLARED HERE, BELOW `amendments`, AND THAT POSITION IS LOAD-BEARING. The
  // first version sat next to `pendingOrders` about ten lines above this and
  // crashed the whole app with "Cannot access 'amendments' before
  // initialization" — a const is in its temporal dead zone until its own
  // declaration runs, so reading one from a line above is a hard throw at mount,
  // not a warning. Same failure that the updateRegular dep-array move caused.
  // If this ever needs another input, declare it BELOW that input too.
  //
  // Derived rather than stored: each queue already owns its own truth
  // (AmendmentQueue filters to status 'pending' internally and renders null
  // when empty), so a second stored count could disagree with what is actually
  // on screen — the container-custody lesson in a smaller place.
  const waitingCount =
    pendingFeedback.length +
    (amendments || []).filter(a => a.status === 'pending').length +
    pendingOrders.length;

  // Visual cue METADATA. The photographs themselves live in R2; this is the
  // record of what each one shows, which recipe version it belongs to, and
  // whether its bytes actually landed. Rides backup — the bytes do not, which
  // is exactly why the archive bundle carries checksums.
  const [visualCues, setVisualCues] = useState([]);

  // The searchable corpus. Rebuilt when its stores change rather than
  // persisted: it is derived data, and a stored index that drifted from the
  // records would answer confidently with something no longer there.
  //
  // DECLARED HERE, BELOW ALL FOUR STORES IT READS, and the position is
  // load-bearing. The first attempt sat next to `practices` and crashed the app
  // at mount with "Cannot access 'visualCues' before initialization" — the same
  // temporal-dead-zone throw that waitingCount hit in the batch before this
  // one, in the same file, for the same reason. A const is unreadable until its
  // own line runs. Twice in two batches: when adding a derived value, find the
  // LAST of its inputs and go below that.
  const corpus = useMemo(
    () => buildCorpus({ journal, practices, visualCues, rowanLog, terms, anatomy }),
    [journal, practices, visualCues, rowanLog, terms, anatomy]);

  // ── Customer feature flags ────────────────────────────────────────────────
  // Kill switches for optional customer capabilities. They publish WITH the
  // week, so turning one off is a publish rather than a deploy — which is the
  // whole point of having them.
  const [customerFlags, setCustomerFlags] = useState(() => normalizeFlags(null));

  const saveCustomerFlags = useCallback((next) => {
    const clean = normalizeFlags(next);
    setCustomerFlags(clean);
    try { localStorage.setItem(CUSTOMER_FLAGS_KEY, JSON.stringify(clean)); }
    catch (e) { setError('Could not save the feature settings on this device.'); }
  }, []);

  const saveVisualCues = useCallback((next) => {
    setVisualCues(next);
    try { localStorage.setItem(VISUAL_CUES_KEY, JSON.stringify(next)); }
    catch (e) { setError('Could not save the cue list on this device.'); }
  }, []);

  // Who has said they are away. Fetched rather than derived: the customer sets
  // it against their device, and Kevin needs it BEFORE he shops, not after he
  // notices somebody did not order.
  const [awayList, setAwayList] = useState([]);

  const loadAway = useCallback(async () => {
    if (!PUBLISH_TOKEN) return;
    try {
      const r = await fetch(WORKER_BASE + '/customer-away', { headers: { 'X-LTB-Token': PUBLISH_TOKEN } });
      if (!r.ok) return;
      const j = await r.json();
      setAwayList(Array.isArray(j.away) ? j.away : []);
    } catch (e) { /* offline: the list simply does not appear */ }
  }, []);

  React.useEffect(() => { loadAway(); }, [loadAway]);

  const loadAmendments = useCallback(async () => {
    if (!PUBLISH_TOKEN) return;
    try {
      const r = await fetch(WORKER_BASE + '/amendments', { headers: { 'X-LTB-Token': PUBLISH_TOKEN } });
      if (!r.ok) return;
      const j = await r.json();
      setAmendments(Array.isArray(j.amendments) ? j.amendments : []);
    } catch (e) { /* offline: the queue simply does not appear */ }
  }, []);

  React.useEffect(() => { loadAmendments(); }, [loadAmendments]);

  const decideAmendment = useCallback(async (amd, status, reason) => {
    try {
      await fetch(WORKER_BASE + '/amendments/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-LTB-Token': PUBLISH_TOKEN },
        body: JSON.stringify({ id: amd.id, status, reason: reason || null }),
      });
    } catch (e) { /* recorded locally below regardless; the worker is retried on next load */ }
    setAmendments(prev => prev.map(a => (a.id === amd.id
      ? { ...a, status, decision: { at: new Date().toISOString(), by: 'owner', reason: reason || null } }
      : a)));
  }, []);


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
      setAuditLog, setNotice, setRealDataEpoch, setRowanLog, setDishRankings, setVisualCues,
      // setCustomerFlags was MISSING here while bootHydrate destructured it,
      // so the moment a device had flags stored (i.e. the first publish with a
      // flag set), boot threw "setCustomerFlags is not a function" and the app
      // never left "Loading orders...". A device with no flags stored short-
      // circuited the guard and booted fine, which is why this shipped green.
      // tests/boot_deps.mjs now fails the build if this list drifts again.
      setCustomerFlags,
      setPractices,
      setCaptureInbox,
      setLabelVersions,
      setWalkAnswers,
      setTerms,
      setAnatomy,
      setDerivatives,
      setRowanQuestions,
      setClarifications,
      setNotesRowan,
      setDecisionLedger,
      setRowanBoards,
      setRowanRoles,
      setHouseholdMemories,
      setPassportCabinets,
      handledPendingRef, pollWorkerPending,
    }).catch(err => {
      // A rejected promise inside an effect does NOT reach an error boundary,
      // so without this a boot throw is INVISIBLE: no message, no red screen,
      // just the loading text forever. Show the real error instead.
      //
      // Deliberately does NOT fall through to the normal UI. A boot that threw
      // halfway has some state hydrated and some still at its empty initial
      // value, and letting the app render on top of that invites a save that
      // overwrites good stored data with the empty half. Failing to a dead-end
      // screen keeps localStorage untouched and recoverable.
      if (mounted) setBootError((err && err.message) || String(err));
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

  // The Google-Forms CSV path was removed in full. It had been dead for months
  // (USE_LEGACY_CSV was false) and was also BROKEN: checkFormNow and
  // pollFormOrders both called fetchFormRows(), which utils.js declares without
  // `export` and App.jsx never imported. Turning the flag back on would have
  // thrown a ReferenceError on the first call. Orders arrive via the worker's
  // /pending queue below, which is the durable path and has been for a long time.

  // ── Worker intake ─────────────────────────────────────────────────────────
  // Body in pendingPoll.js. The rule worth knowing from here: polling NEVER
  // clears the worker queue. An order leaves it only via dismissPending.
  const workerPollRef = React.useRef(null);
  // `self` lets the two-minute reschedule re-enter through this wrapper rather
  // than the bare module function, which would lose the deps bag on tick two.
  const pollWorkerPending = React.useCallback(async (reschedule = true) => poll.pollWorkerPending(reschedule, {
    setPendingOrders, handledPendingRef, workerPollRef, setError,
    self: (r) => pollWorkerPending(r),
  }), []);

  const checkWorkerNow = React.useCallback(async () => poll.checkWorkerNow({
    setCheckingForm, pollWorkerPending,
  }), [pollWorkerPending]);

  // ── Publishing ────────────────────────────────────────────────────────────
  // Bodies in publishWeek.js. Two rules live in there and are worth knowing
  // from here: the publish response body is read exactly once, and a field the
  // worker did not recognise raises a banner rather than passing silently.
  const fetchConfigHistory = React.useCallback(async () => pub.fetchConfigHistory(), []);
  const restoreConfig = React.useCallback(async (index) => pub.restoreConfig(index), []);
  const publishWeek = React.useCallback(
    async (currentWeekDishes, menuPdfUrl, weekLabel, pausedOpts, extras) => {
      // ── Personalized snapshots ──────────────────────────────────────────
      // Built HERE, where the trusted data lives, and sanitized before it goes
      // anywhere near the worker. Only regulars who have actually bound a
      // device get one — publishing a snapshot for someone with no device is
      // data sitting in KV that nothing will ever read.
      const weekDishIds = (currentWeekDishes || [])
        .map(d => dishIdFor(typeof d === 'string' ? d : d.name))
        .filter(Boolean);

      const profileSnapshots = {};
      for (const r of (regulars || [])) {
        if (!r || !r.customerProfileId) continue;
        if (!Array.isArray(r.deviceHashes) || r.deviceHashes.length === 0) continue;
        const snap = sanitizeSnapshot(buildProfileSnapshot({
          regular: r,
          orders: orders || [],
          weekLabel: weekLabel || '',
          weekDishIds,
          // From the EXISTING jar ledger, not a second count. A number the
          // customer sees that Kevin cannot reconcile with his own is worse
          // than no number at all.
          jarsOut: jarsOutForRegular(r.id, orders || []),
        }));
        if (snap) profileSnapshots[r.customerProfileId] = snap;
      }

      return pub.publishWeek(currentWeekDishes, menuPdfUrl, weekLabel, pausedOpts,
        { ...(extras || {}), profileSnapshots }, {
          setWeekLedger, setNotice, recordAudit,
        });
    },
    [recordAudit, regulars, orders]);

  const dismissPending = useCallback((pendingId) => ops.dismissPending(pendingId, {
    setPendingOrders, handledPendingRef, setShowPendingIdx, setError,
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

  // Tells the worker that this browser belongs to this customer profile.
  // Fire-and-forget by design: a failed bind leaves the order correct and the
  // customer merely unrecognised, and the next order retries it.
  const bindCustomerDevice = useCallback(async (deviceHash, profileId, label) => {
    if (!PUBLISH_TOKEN || !deviceHash || !profileId) return;
    try {
      await fetch(WORKER_BASE + '/customer-device/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-LTB-Token': PUBLISH_TOKEN },
        body: JSON.stringify({ deviceHash, profileId, label: label || 'Device' }),
      });
    } catch (e) { /* retried on the customer's next order */ }
  }, []);

  const linkOrderToRegular = useCallback((regularId, orderId, order = null) =>
    ops.linkOrderToRegular(regularId, orderId, {
      setRegulars, setError, order, bindDevice: bindCustomerDevice,
    }), [bindCustomerDevice]);

  const unlinkOrderFromRegular = useCallback((regularId, orderId) => ops.unlinkOrderFromRegular(regularId, orderId, { setRegulars, setError }), []);

  const adjustInventory = useCallback((key, delta) => ops.adjustInventory(key, delta, { setInventory, setError }), []);

  const setInventoryCount = useCallback((key, value) => ops.setInventoryCount(key, value, { setInventory, setError }), []);

  // ORDER MATTERS HERE. These two sit BELOW the regulars and inventory
  // callbacks on purpose: both name those callbacks in their dependency
  // arrays, and a dependency array is evaluated at declaration time. Declared
  // any earlier, `[updateRegular]` reads a const that does not exist yet and
  // the whole app dies on mount with a temporal dead zone error. That is not
  // hypothetical; it is what happened the moment the empty array that used to
  // sit on autoFillRegularContact was replaced with an honest one.
  // ── Auto-fill regular contact info from incoming order ─────────────────────
  // Called after linking an order to a regular. If the regular has no address
  // or phone and the order does, fills in the blank fields and shows a banner.
  // updateRegular is itself a []-dep useCallback, so its identity never moves
  // and the old empty array here was not actually producing a stale closure.
  // It was still a lie: this DOES depend on updateRegular, and the next person
  // to give updateRegular a real dependency would have broken this silently.
  // Naming it costs nothing at runtime and makes the dependency true.
  const autoFillRegularContact = useCallback((reg, order) => ops.autoFillRegularContact(reg, order, {
    updateRegular, setExportMsg,
  }), [updateRegular]);

  const acceptPending = useCallback((pending) => ops.acceptPending(pending, {
    handledPendingRef, regulars, setOrders, setError, adjustInventory,
    linkOrderToRegular, autoFillRegularContact, setLinkPrompt, dismissPending,
    setShowPendingIdx,
  }), [regulars, autoFillRegularContact]);

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

  const onAcceptAmendment = useCallback((amd) => {
    const order = (orders || []).find(o => o.id === amd.orderId);
    if (!order) return;
    // acceptAmendment refuses anything not pending, so a double-tap cannot
    // apply the patch twice even if this handler runs twice.
    const result = acceptAmendment(amd, order);
    if (!result.applied) return;
    // updateOrder takes (id, patch) — pass only what changed.
    updateOrder(order.id, { items: result.order.items, cancelled: !!result.order.cancelled });
    setAmendments(prev => supersedePending(prev, amd.orderId, amd.id));
    decideAmendment(amd, 'accepted', null);
  }, [orders, updateOrder, decideAmendment]);

  const onRejectAmendment = useCallback((amd, reason) => {
    decideAmendment(amd, 'rejected', reason);
  }, [decideAmendment]);

  // Revoke ONE device. Recorded on the regular as well as on the worker so the
  // panel still reads correctly offline, and so a revocation survives a restore
  // from backup — the worker's KV is not in the backup ring.
  const onRevokeDevice = useCallback(async (regular, deviceHash) => {
    try {
      await fetch(WORKER_BASE + '/customer-device/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-LTB-Token': PUBLISH_TOKEN },
        body: JSON.stringify({ deviceHash }),
      });
    } catch (e) { /* recorded locally regardless; re-pushed on the next revoke */ }
    updateRegular(regular.id, {
      revokedDeviceHashes: [...(regular.revokedDeviceHashes || []), deviceHash],
    });
  }, [updateRegular]);

  // A one-time code for a new phone. Generated locally so Kevin can read it out
  // immediately, then registered with the worker; if that registration fails the
  // code will not work, so the failure is surfaced rather than swallowed.
  const onClaimCode = useCallback(async (regular) => {
    // MINT THE PROFILE ID HERE IF THERE IS NONE.
    //
    // It used to be created only inside linkOrderToRegular, when an order
    // arrived carrying a device hash. That made claim codes useless for exactly
    // the people who need them: every customer who existed before device
    // identity had no profile id, so the button was permanently disabled, and
    // the only way to get one was to order from a device that enrolled — which
    // is the thing the code exists to make possible. Chicken and egg.
    //
    // A profile id is just an opaque identifier. It needs no order to be valid,
    // and creating one commits nothing.
    let profileId = regular.customerProfileId;
    if (!profileId) {
      profileId = ensureProfileId(regular);
      updateRegular(regular.id, { customerProfileId: profileId });
    }

    const code = generateClaimCode();
    try {
      const r = await fetch(WORKER_BASE + '/customer-device/claim-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-LTB-Token': PUBLISH_TOKEN },
        body: JSON.stringify({ profileId, code }),
      });
      if (!r.ok) throw new Error('claim code not registered');
    } catch (e) {
      setError('Could not create that code. Check the connection and try again.');
      return null;
    }
    return code;
  }, [updateRegular]);


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
    orders, shopping, weekDishes, regulars, inventory, ingredientsDb, visualCues, customerFlags,
    costHistory, receiptAliases, auditLog, pipelineJournal, journal,
    containerConfig, weekLedger, copiesNote,
    archiveHistory, realDataEpoch, rowanLog, dishRankings, practices, captureInbox, labelVersions, walkAnswers, terms, anatomy, derivatives, rowanQuestions, clarifications, notesRowan, decisionLedger, rowanBoards, rowanRoles, householdMemories, passportCabinets,
    handledPending: handledPendingRef.current,
  }), [orders, shopping, weekDishes, regulars, inventory, ingredientsDb, costHistory, receiptAliases, auditLog, pipelineJournal, journal, containerConfig, weekLedger, copiesNote, archiveHistory, realDataEpoch, rowanLog, dishRankings, visualCues, customerFlags, practices, captureInbox, labelVersions, walkAnswers, terms, anatomy, derivatives, rowanQuestions, clarifications, notesRowan, decisionLedger, rowanBoards, rowanRoles, householdMemories, passportCabinets]);

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
    // Stays quiet deliberately, and it is one of only two. This records whether
    // the BACKUP is healthy; raising a storage-failure banner from inside it
    // would report the backup subsystem's own bookkeeping as a data problem,
    // and a failure here already shows up as the red backup arrow.
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
    setAuditLog, setArchiveHistory, setRealDataEpoch, setRowanLog, setDishRankings, setVisualCues, setCustomerFlags, setPractices, setCaptureInbox, setLabelVersions, setWalkAnswers, setTerms, setAnatomy, setDerivatives, setRowanQuestions, setClarifications, setNotesRowan, setDecisionLedger, setRowanBoards, setRowanRoles, setHouseholdMemories, setPassportCabinets, setError, setExportMsg, setNotice, handledPendingRef,
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
      saveJSON(CHECKS_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, [cookingList]);

  const resetChecks = useCallback(() => {
    setCookChecks({});
    saveJSON(CHECKS_KEY, {}).then(r => setError(saveError(r)));
  }, []);

  const toggleDeliverCheck = useCallback((key) => {
    setDeliverChecks(prev => {
      const next = { ...prev, [key]: !prev[key] };
      const validKeys = new Set();
      deliverList.forEach(grp => grp.items.forEach(it => validKeys.add(it.key)));
      Object.keys(next).forEach(k => { if (!validKeys.has(k)) delete next[k]; });
      saveJSON(DELIVER_CHECKS_KEY, next).then(r => setError(saveError(r)));
      return next;
    });
  }, [deliverList]);

  const resetDeliverChecks = useCallback(() => {
    setDeliverChecks({});
    saveJSON(DELIVER_CHECKS_KEY, {}).then(r => setError(saveError(r)));
  }, []);

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

  // Journal writer: accepts the next store OR an updater fn, same contract as
  // savePipelineJournal. Writes surface quota failures through saveError —
  // this is the knowledge base, and a silent lost entry is the exact failure
  // the record exists to prevent.
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
      saveJSON(PIPELINE_JOURNAL_KEY, next).then(r => setError(saveError(r)));
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
      saveJSON(ORDERS_KEY, next).then(r => setError(saveError(r)));
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

  if (bootError) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.loadingText, color: '#ff6b6b', fontWeight: 700 }}>
          Startup failed
        </div>
        <div style={{ ...styles.loadingText, fontSize: 14, opacity: 0.85, padding: '0 20px' }}>
          Your saved data has NOT been touched or changed. Nothing was lost.
        </div>
        <div style={{ ...styles.loadingText, fontSize: 13, opacity: 0.7, padding: '12px 20px', fontFamily: 'monospace', wordBreak: 'break-word' }}>
          {bootError}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingText}>Loading orders...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <AppHeader
        storageFull={storageFull} storageBytes={storageBytes} swUpdate={swUpdate}
        notifPerm={notifPerm} onEnablePush={enablePushNotifications}
        backupFailing={backupFailing} onOpenBackup={openBackupModal} onPasteImport={pasteImport}
        exportMsg={exportMsg} notice={notice} onDismissNotice={() => setNotice(null)}
        view={view} setView={setView} activeCount={stats.active}
      />

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
            linkOrderToRegular(regularId, linkPrompt.order.id, linkPrompt.order);
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
            {/* Permanently first. Capture that takes three taps to reach gets
                used twice; this sits where Kevin already is when the app opens. */}
            <RowanLogCard dishNames={ALL_MENU_DISH_NAMES} onLog={logRowan} />
            <OrderBanners
              weekRollover={weekRollover}
              markWeekSeen={markWeekSeen}
              containerStatus={containerStatus}
              deadlineMs={deadlineMs}
              intake={intake}
              dismissed={dismissedBanners}
              onDismiss={dismissBanner}
            />
            <StatsBar stats={stats} />

            {!formMode && !showPaste && !showAmend && (
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

            {/* ══ WAITING ON YOU ═════════════════════════════════════════════
                 Three separate decision queues — dish feedback, change
                 requests, pending orders — each with its own header, stacked
                 between the order-entry buttons and the order list. Each one is
                 individually small; together they pushed the actual orders down
                 a screen on any busy week, and none of them told Kevin how much
                 was waiting in total without scrolling all three.

                 One band, one number. It expands whenever anything is waiting,
                 because these are decisions and a collapsed decision is a
                 forgotten one. Collapsing is for when he has seen them and
                 wants his order list back. When nothing is waiting the whole
                 band disappears rather than sitting there saying zero.

                 The queues inside are UNTOUCHED and keep their own headers and
                 counts; this only stops them from being three unrelated things
                 in a row. ═══════════════════════════════════════════════ */}
            {waitingCount > 0 && !formMode && !showPaste && (
              <div style={{ margin: '0 0 10px' }}>
                <button
                  onClick={() => setWaitingOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    background: 'rgba(212,160,80,0.10)', border: '1px solid #D4A050',
                    borderRadius: 10, padding: '9px 11px', cursor: 'pointer',
                    color: '#D4A050', fontSize: 12.5, fontWeight: 700, textAlign: 'left',
                  }}
                >
                  <span style={{ ...styles.pendingBadge, background: GOLD, color: '#1a1a1a' }}>{waitingCount}</span>
                  <span style={{ flex: 1 }}>Waiting on you</span>
                  <span>{waitingOpen ? '▲' : '▼'}</span>
                </button>
              </div>
            )}

            {waitingOpen && (<>
            {pendingFeedback.length > 0 && !formMode && !showPaste && (
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

            {!formMode && !showPaste && (
              <AmendmentQueue
                amendments={amendments}
                orders={orders || []}
                offered={(menu && menu.dinner) || []}
                onAccept={onAcceptAmendment}
                onReject={onRejectAmendment}
                styles={styles}
              />
            )}

            {pendingOrders.length > 0 && !formMode && !showPaste && (
              <PendingOrders
                pendingOrders={pendingOrders}
                showPendingIdx={showPendingIdx} setShowPendingIdx={setShowPendingIdx}
                parsedNotes={parsedNotes} setParsedNotes={setParsedNotes}
                parsingNotes={parsingNotes} setParsingNotes={setParsingNotes}
                onAccept={acceptPending}
                onDismiss={dismissPending}
              />
            )}
            </>)}

            {undecidedOma.length > 0 && (
              <div style={{ background: 'rgba(212,160,80,0.10)', border: '1px solid #D4A050', borderRadius: 10, padding: '8px 10px', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#D4A050' }}>Omakase undecided: </span>
                <span style={{ fontSize: 12, color: '#e8ede9' }}>
                  {undecidedOma.map(u => `${u.customer} (${new Date(u.createdAt).toLocaleDateString()})`).join(', ')}
                </span>
              </div>
            )}

            {(activeOrders.length > 6 || deliveredOrders.length > 6) && (
              <OrderListControls
                orderSearch={orderSearch} setOrderSearch={setOrderSearch}
                orderSort={orderSort} setOrderSort={setOrderSort}
                orderStatusFilter={orderStatusFilter} setOrderStatusFilter={setOrderStatusFilter}
                statuses={STATUSES}
                selectMode={selectMode}
                onToggleSelectMode={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
              />
            )}

            {selectMode && (
              <BulkActionBar
                selectedCount={selectedCount}
                selectableCount={selectableActive.length}
                onSelectAll={selectAllVisible}
                onClear={clearSelection}
                onMarkPaid={() => runBulk(bulkMarkPaid)}
                onArchive={() => runBulk(bulkArchive)}
              />
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
                    labelVersions={labelVersions}
                    customerFlags={customerFlags}
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
                      labelVersions={labelVersions}
                      customerFlags={customerFlags}
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
            custody={containerCustody(orders || [], containerConfig)}
            containerConfig={containerConfig}
            onSetOwned={setOwnedContainers}
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
            <MoneyTab orders={orders || []} onUpdate={updateOrder} auditLog={auditLog} costHistory={costHistory} baseCostMap={baseCostMap} ingredientName={ingredientName} />
            <DigestPanel orders={orders || []} regulars={regulars} liveCostMap={liveCostMap} baseCostMap={baseCostMap} onPullFeedback={pullKitchenFeedback} onCloseOut={closeOutWeek} />
          </>
        )}

        {view === 'record' && (
          <RecordTab
            /* For the durable archive. RecordTab does not edit these; it hands
               them to buildArchiveHtml, which rendered every section empty until
               they were passed. */
            rowanQuestions={rowanQuestions}
            notesRowan={notesRowan}
            rowanBoards={rowanBoards}
            rowanRoles={rowanRoles}
            householdMemories={householdMemories}
            passportCabinets={passportCabinets}
            derivatives={derivatives}
            decisionLedger={decisionLedger}
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
            ranking={latestRanking(dishRankings)}
            rankingDrift={rankingDrift(dishRankings)}
            tasteVsSales={tasteVsSales(latestRanking(dishRankings), dishOrderSignal(orders || []))}
            tasteVsSon={tasteVsSon(latestRanking(dishRankings), sonTopDishes(rowanLog))}
            rankingStale={rankingStaleness(latestRanking(dishRankings), ALL_MENU_DISH_NAMES)}
            realDataEpoch={realDataEpoch}
            epochProposal={epochProposal}
            epochSummary={epochSummary(orders, realDataEpoch)}
            onConfirmEpoch={confirmEpoch}
            patterns={cookingPatterns(orders || [], realDataEpoch)}
            tasteVsPractice={tasteVsPractice(cookingPatterns(orders || [], realDataEpoch), latestRanking(dishRankings))}
            onAnswerQuestion={({ dish, type, text }) => saveJournal(prev => addJournalEntry(prev, {
              subject: { kind: 'dish', dish }, type, text, origin: 'written',
            }))}
            practices={practices}
            onSavePractices={savePractices}
            captureInbox={captureInbox}
            onSaveCapture={saveCaptureInbox}
            terms={terms}
            onSaveTerms={saveTerms}
            clarifications={clarifications}
            onSaveClarifications={saveClarifications}
            ingredients={ingredientsDb}
            corpus={corpus}
            onArchiveDownloaded={recordArchive}
          />
        )}

        {view === 'recipes' && (
          <RecipesTab auditLog={auditLog}
            anatomy={anatomy}
            onSaveAnatomy={saveAnatomy}
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
              onRevokeDevice={onRevokeDevice}
              onClaimCode={onClaimCode}
              onUnlink={unlinkOrderFromRegular}
            />
            <RegularsIntelPanel orders={orders || []} regulars={regulars} weekDishes={weekDishes} onMerge={doMergeRegulars} onUnmerge={doUnmergeRegular} onUpdateRegular={updateRegular} onBackfill={runBackfill} onLinkSuggestion={linkSuggestionToRegular} />
          </>
        )}

        {view === 'week' && (
          <>
            <WeekTab
              awayList={awayList}
              regulars={regulars || []}
              customerFlags={customerFlags}
              onSaveFlags={saveCustomerFlags} selected={weekDishes} onToggle={toggleWeekDish} onPublish={publishWeek} liveCostMap={liveCostMap} baseCostMap={baseCostMap} orders={orders || []} dishFeedback={dishFeedback} onFetchHistory={fetchConfigHistory} onRestoreConfig={restoreConfig} />
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

        {view === 'rowan' && (
          <RowanTab log={rowanLog} dishNames={ALL_MENU_DISH_NAMES} onSaveTranscript={saveRowanTranscript} questions={rowanQuestions} onSaveQuestions={saveRowanQuestions} notesRowan={notesRowan} onSaveNotes={saveNotesRowan} rowanBoards={rowanBoards} onSaveBoards={saveRowanBoards} rowanRoles={rowanRoles} onSaveRoles={saveRowanRoles} />
        )}
        {view === 'ingredients' && (
          <IngredientsTab ingredients={ingredientsDb} costHistory={costHistory} onChange={updateIngredients} onScanReceipt={() => { setDebugScan(false); setShowReceiptScan(true); }} onDebugScan={() => { setDebugScan(true); setShowReceiptScan(true); }} aliases={receiptAliases} onSaveAliases={saveReceiptAliases} labelVersions={labelVersions} onSaveLabels={saveLabelVersions} />
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
