import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { preflightWeek } from '../publishPreflight.js';
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
import { costDishVariant, driftBorder } from '../dishCosting.js';
import { ConflictModal } from './ConflictModal.jsx';

export function WeekTab({ selected, onToggle, onPublish, liveCostMap, baseCostMap, orders }) {
  // Composer intelligence: what a dish actually earned lately, and when it last
  // ran. Requests already show as the green "req" chip. Quarter window.
  const dishIntel = useMemo(() => {
    const cutoff = Date.now() - 90 * 86400000;
    const out = {};
    for (const o of (orders || [])) {
      if (o.house) continue;
      const t = new Date(o.createdAt || 0).getTime();
      for (const it of (o.items || [])) {
        if (!it.name || it.omakase) continue;
        const e = out[it.name] || (out[it.name] = { last: 0, profit: 0 });
        if (t > e.last) e.last = t;
        if (t >= cutoff) {
          const qty = Number(it.qty) || 1;
          e.profit += ((Number(it.price) || 0) - (Number(it.cost) || 0)) * qty;
        }
      }
    }
    return out;
  }, [orders]);
  // Pre-publish audit (pure): warnings render above the button, never block.
  const preflight = useMemo(
    () => preflightWeek(selected, { liveCostMap, baseCostMap }),
    [selected, liveCostMap, baseCostMap]
  );
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [weekLabel, setWeekLabel] = useState('');
  const [showConflicts, setShowConflicts] = useState(false);

  // ── Customer dish requests (informational; NOT wired into scoring) ─────────
  // Fetched once on mount. A count chip next to a dish tells Kevin what people
  // asked for back, next to the compose decision — it does not change it.
  const [requestCounts, setRequestCounts] = useState(null); // { dishName: n }
  const [requestNotes, setRequestNotes] = useState({}); // { dishName: [{at, note}] }
  const [requestRanked, setRequestRanked] = useState([]); // [{ dish, requests, notes }] ranked
  const [requestTotal, setRequestTotal] = useState(0);
  const [showRequests, setShowRequests] = useState(false); // panel collapsed by default
  const [expandedReq, setExpandedReq] = useState(null);  // dishName whose notes are open
  useEffect(() => {
    let alive = true;
    fetch(WORKER_BASE + '/requests?token=' + encodeURIComponent(PUBLISH_TOKEN))
      .then(r => r.ok ? r.json() : Promise.reject(new Error('bad')))
      .then(j => {
        if (!alive) return;
        const m = {}, notes = {};
        for (const c of (j.counts || [])) { m[c.dish] = c.requests; if ((c.notes || []).length) notes[c.dish] = c.notes; }
        setRequestCounts(m);
        setRequestNotes(notes);
        setRequestRanked(j.counts || []);
        setRequestTotal(j.total || 0);
      })
      .catch(() => { if (alive) setRequestCounts({}); });
    return () => { alive = false; };
  }, []);

  // Compute the next Sunday (order due date) and following Wednesday (delivery).
  const computeWeekLabel = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    // The order window closes Sunday and delivers Wednesday.
    // If today is Sun (0): use today as the deadline.
    // If today is Mon-Tue (1-2): the window just closed; next cycle starts this
    //   Wed, so point to the upcoming Sunday.
    // If today is Wed-Sat (3-6): orders are open, deadline is this coming Sunday.
    let daysToSun;
    if (day === 0) daysToSun = 0;           // today is Sunday
    else daysToSun = 7 - day;               // Mon-Sat: this coming (or next) Sunday
    const sun = new Date(now); sun.setDate(now.getDate() + daysToSun);
    const wed = new Date(sun); wed.setDate(sun.getDate() + 3);
    const fmt = (d) => d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    return `Orders due Sunday ${fmt(sun)} · Delivery Wednesday ${fmt(wed)}`;
  };

  // Take the week off: publishes a paused config so both customer pages say so
  // plainly instead of looking broken. Publishing a normal week clears it.
  const [pauseMsg, setPauseMsg] = useState('');
  const [pausing, setPausing] = useState(false);
  const doPause = async () => {
    setPausing(true); setPublishMsg(null);
    try {
      await onPublish(selected, pdfUrl.trim(), weekLabel.trim() || computeWeekLabel(), {
        paused: true, pausedMsg: pauseMsg.trim() || 'Taking this week off, back next week.',
      });
      setPublishMsg({ ok: true, text: 'Week paused. The form and menu now say you are off this week.' });
    } catch (e) {
      setPublishMsg({ ok: false, text: (e && e.message) || 'Could not pause the week.' });
    }
    setPausing(false);
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
      {/* ── Most-wanted this week ── a ranked view of customer requests, so the
          stream is something Kevin CHECKS, not something he walks past on the
          tiles. The per-tile chips stay too; this is the summary. */}
      {requestRanked.length > 0 && (
        <div style={styles.genCard}>
          <button
            onClick={() => setShowRequests(o => !o)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#5DCAA5', fontSize: '14px', fontWeight: 700, padding: 0 }}
          >
            <span>Most wanted this week · {requestTotal} request{requestTotal === 1 ? '' : 's'}</span>
            <span>{showRequests ? '▲' : '▼'}</span>
          </button>
          {showRequests && (
            <div style={{ marginTop: 10 }}>
              {requestRanked.map((r, i) => {
                const isOn = selected.includes(r.dish);
                return (
                  <div key={r.dish} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < requestRanked.length - 1 ? '1px solid #24312d' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 20, textAlign: 'right', color: '#6b7570', fontSize: '12px', flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ flex: 1, fontSize: '13.5px', color: '#d8d2c4' }}>{r.dish}</span>
                      {isOn && <span style={{ fontSize: '10px', fontWeight: 700, color: '#5DCAA5', background: 'rgba(93,202,165,0.14)', borderRadius: 6, padding: '1px 6px' }}>on the menu ✓</span>}
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#5DCAA5' }}>{r.requests}</span>
                    </div>
                    {(r.notes || []).length > 0 && (
                      <div style={{ marginLeft: 28, marginTop: 3, fontSize: '11px', color: '#9aa5a0', lineHeight: 1.5 }}>
                        {r.notes.map((n, ni) => (
                          <div key={ni}>“{n.note}” <span style={{ color: '#6b7570' }}>· {String(n.at || '').slice(0, 10)}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ fontSize: '11px', color: '#6b7570', marginTop: 4 }}>
                Requests are a signal, not a rule. They don't change the lineup on their own.
              </div>
            </div>
          )}
        </div>
      )}

      <div style={styles.genCard}>
        <div style={styles.genTitle}>This week's dinner lineup</div>
        <div style={styles.genHint}>
          Check the dishes you're offering. The order picker, text parser, and shopping
          list follow this instantly. Existing orders aren't affected.
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
        // Worst-variant drift (version A): the most-pricier variant drives the border,
        // so a red edge flags "something in here got more expensive — take a look."
        let worst = null;
        if (liveCostMap && baseCostMap) {
          dish.variants.forEach(v => {
            const r = costDishVariant(dish.name, v.label, v.cost, liveCostMap, baseCostMap);
            if (r && !r.unknown && (worst === null || r.pctDrift > worst)) worst = r.pctDrift;
          });
        }
        const bdr = (isOn && worst !== null) ? driftBorder(worst) : null;
        return (
          <button
            key={dish.name}
            style={{
              ...styles.cookItem,
              ...(isOn ? {} : { opacity: 0.55 }),
              ...(bdr ? { borderColor: bdr.borderColor, borderWidth: bdr.borderWidth, borderStyle: 'solid' } : {}),
            }}
            onClick={() => onToggle(dish.name)}
          >
            <div style={{ ...styles.checkbox, ...(isOn ? styles.checkboxChecked : {}) }}>
              {isOn && <Check size={14} color="#1a1a1a" />}
            </div>
            <div style={styles.cookItemText}>
              <div style={styles.cookItemName}>
                {dish.name}
                {requestCounts && requestCounts[dish.name] > 0 && (
                  <span
                    onClick={(ev) => { ev.stopPropagation(); if (requestNotes[dish.name]) setExpandedReq(expandedReq === dish.name ? null : dish.name); }}
                    style={{ marginLeft: 6, fontSize: '10px', fontWeight: 700, color: '#5DCAA5', background: 'rgba(93,202,165,0.14)', borderRadius: 6, padding: '1px 6px', cursor: requestNotes[dish.name] ? 'pointer' : 'default' }}
                  >
                    {requestCounts[dish.name]} req{requestNotes[dish.name] ? (expandedReq === dish.name ? ' ▲' : ' ▾') : ''}
                  </span>
                )}
              </div>
              {expandedReq === dish.name && requestNotes[dish.name] && (
                <div style={{ marginTop: 4, fontSize: '11px', color: '#9aa5a0', lineHeight: 1.5 }} onClick={(ev) => ev.stopPropagation()}>
                  {requestNotes[dish.name].map((n, ni) => (
                    <div key={ni}>“{n.note}” <span style={{ color: '#6b7570' }}>· {String(n.at || '').slice(0, 10)}</span></div>
                  ))}
                </div>
              )}
              <div style={styles.cookItemVariant}>
                {dish.variants.length} option{dish.variants.length !== 1 ? 's' : ''} · {priceLabel}
                {(() => {
                  const d = dishIntel[dish.name];
                  if (!d) return <span style={{ marginLeft: 6, fontSize: '10px', color: '#6b7570' }}>never run</span>;
                  const wks = d.last ? Math.floor((Date.now() - d.last) / (7 * 86400000)) : null;
                  return (
                    <span style={{ marginLeft: 6, fontSize: '10px', color: '#6b7570' }}>
                      {wks === 0 ? 'this week' : wks === 1 ? '1 wk ago' : `${wks} wks ago`}
                      {d.profit > 0 ? ` · ${currency(Math.round(d.profit))}/qtr` : ''}
                    </span>
                  );
                })()}
                {worst !== null && Math.abs(worst) >= 2 && (
                  <span style={{ color: worst > 0 ? '#e0828a' : '#5DCAA5', fontWeight: 700, opacity: isOn ? 1 : 0.75 }}>
                    {' · '}{worst > 0 ? '↑' : '↓'}{Math.abs(worst).toFixed(0)}% vs base
                  </span>
                )}
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
          {preflight.length > 0 && (
            <div style={{ margin: '8px 0 10px' }}>
              {preflight.map((w, i) => (
                <div key={i} style={{
                  fontSize: 12, lineHeight: 1.4, padding: '7px 10px', borderRadius: 8, marginBottom: 5,
                  background: w.level === 'warn' ? 'rgba(239,159,39,0.12)' : 'rgba(93,202,165,0.10)',
                  border: `1px solid ${w.level === 'warn' ? '#4a3a1e' : '#28483d'}`,
                  color: w.level === 'warn' ? '#EF9F27' : '#9aa5a0',
                }}>
                  {w.level === 'warn' ? '⚠ ' : ''}{w.text}
                </div>
              ))}
            </div>
          )}
          <div style={styles.conflictBtnRow}>
            <button
              style={{ ...styles.saveBtn, marginTop: 0, flex: 1, background: publishMsg?.ok ? '#1D9E75' : undefined }}
              onClick={doPublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing…' : publishMsg?.ok ? '✓ Published!' : 'Publish to order form'}
            </button>
            <button
              style={styles.conflictBtn}
              onClick={() => setShowConflicts(true)}
              aria-label="Check kitchen conflicts"
            >
              <AlertTriangle size={15} /> Check conflicts
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
            <input
              value={pauseMsg}
              onChange={e => setPauseMsg(e.target.value)}
              placeholder="Taking this week off, back next week."
              style={{ ...styles.input, flex: 1, marginTop: 0 }}
            />
            <button
              style={{ ...styles.conflictBtn, whiteSpace: 'nowrap' }}
              onClick={doPause}
              disabled={pausing}
            >
              {pausing ? 'Pausing…' : 'Take the week off'}
            </button>
          </div>
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

      {showConflicts && (
        <ConflictModal selected={selected} onClose={() => setShowConflicts(false)} />
      )}
    </div>
  );
}

// ─── Stats Bar ──────────────────────────────────────────────────────────────
