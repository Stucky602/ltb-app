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
  orderTotal, repricePerLbItem, itemCost, orderCostInfo, jarsOutForRegular,
  groupKeyFor, formatDate, orderToText, copyText, loadJSON, saveJSON, saveError,
  photoKey, savePhoto, loadPhoto, deletePhoto, photoStorageBytes, cleanupPhotos,
  menuForPrompt, fileToJpegBase64, parseOrderText, validateParsedOrder, parseAmendment,
  parseFormRow, parseDelimited, rowToOrderText, parseFormNotes,
} from '../utils.js';
import { TEAL_DARK, TEAL_MID, TEAL_LIGHT, GOLD, CREAM, DARK, CARD, styles } from '../styles.js';
import { omakaseItemsOf } from '../omakase.js';

export function LinkRegularPrompt({ order, candidates, onLink, onSkip }) {
  return (
    <div style={styles.invoiceOverlay} onClick={onSkip}>
      <div style={styles.linkPromptCard} onClick={e => e.stopPropagation()}>
        <div style={styles.linkPromptTitle}>This looks like a regular</div>
        <div style={styles.linkPromptBody}>
          The order from <b>{order.customer}</b> might match one of your regulars. Want to link it?
        </div>
        <div style={styles.linkPromptList}>
          {candidates.map(r => (
            <button key={r.id} style={styles.linkPromptCandidate} onClick={() => onLink(r.id)}>
              <span style={styles.linkPromptCandidateName}>{regularDisplayName(r)} ★</span>
              {r.discountPercent > 0 && (
                <span style={styles.linkPromptCandidateMeta}>{r.discountPercent}% off applies</span>
              )}
            </button>
          ))}
        </div>
        <button style={styles.linkPromptSkip} onClick={onSkip}>Not a regular / skip</button>
      </div>
    </div>
  );
}

// ─── Regulars Tab: VIP customer profiles ───────────────────────────────────
export function RegularsTab({ regulars, orders, onAdd, onUpdate, onDelete, onLink, onUnlink }) {
  const [mode, setMode] = useState('list'); // 'list' | 'add' | 'profile'
  const [activeId, setActiveId] = useState(null);

  const activeRegular = regulars.find(r => r.id === activeId) || null;
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsWindow, setAnalyticsWindow] = useState('all'); // month | quarter | all

  const REG_PERIOD_DAYS = { month: 30, quarter: 90, all: null };
  const analytics = useMemo(() => {
    const days = REG_PERIOD_DAYS[analyticsWindow];
    const cutoff = days ? Date.now() - days * 86400000 : null;
    const rows = (regulars || []).map(r => {
      let ordersCount = 0, revenue = 0, cost = 0, complete = true, lastTs = 0, isHouse = false;
      for (const o of (orders || [])) {
        if (o.regularId !== r.id) continue;
        const t = new Date(o.createdAt || 0).getTime();
        if (cutoff && !(t >= cutoff)) continue;
        if (o.house) { isHouse = true; continue; } // house account: never in the money
        ordersCount++;
        revenue += (o.total || 0);
        const ci = orderCostInfo(o);
        cost += ci.cost;
        if (!ci.complete) complete = false;
        if (t > lastTs) lastTs = t;
      }
      return {
        id: r.id, name: regularDisplayName(r), isHouse,
        orders: ordersCount, revenue: round2(revenue), profit: round2(revenue - cost),
        complete, lastTs, jarsOut: jarsOutForRegular(r.id, orders),
        omaCount: (orders || []).filter(o => o.regularId === r.id).reduce((n, o) => n + omakaseItemsOf(o).length, 0),
      };
    });
    rows.sort((a, b) => (a.isHouse - b.isHouse) || (b.profit - a.profit));
    return rows;
  }, [regulars, orders, analyticsWindow]);

  if (mode === 'add') {
    return (
      <RegularForm
        onSave={(profile) => { onAdd(profile); setMode('list'); }}
        onCancel={() => setMode('list')}
      />
    );
  }

  if (mode === 'profile' && activeRegular) {
    return (
      <RegularProfile
        regular={activeRegular}
        orders={orders}
        allRegulars={regulars}
        onUpdate={onUpdate}
        onDelete={(id) => { onDelete(id); setMode('list'); setActiveId(null); }}
        onLink={onLink}
        onUnlink={onUnlink}
        onBack={() => { setMode('list'); setActiveId(null); }}
      />
    );
  }

  // List view
  return (
    <div>
      <div style={styles.genCard}>
        <div style={styles.genTitle}>Regulars</div>
        <div style={styles.genHint}>
          Your VIP customers. Tap one to see their profile, order history, and the
          patterns Claude spots over time. New form orders auto-link to a regular when
          the full name matches exactly.
        </div>
      </div>

      <button style={styles.addRegularBtn} onClick={() => setMode('add')}>
        <Plus size={18} /> Add a regular
      </button>

      {regulars.length > 0 && (
        <div style={{ background: CARD, border: '1px solid #2f3a36', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <button
            onClick={() => setShowAnalytics(o => !o)}
            style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: GOLD, fontWeight: 700, fontSize: 14, cursor: 'pointer', padding: 0 }}
          >
            <span>Regular analytics</span>
            <span>{showAnalytics ? '▲' : '▼'}</span>
          </button>
          {showAnalytics && (
            <div style={{ marginTop: 10, overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: '#7a8480', letterSpacing: 0.5 }}>WINDOW</span>
                {[['month', 'This month'], ['quarter', 'Quarter'], ['all', 'All time']].map(([k, label]) => (
                  <button key={k} onClick={() => setAnalyticsWindow(k)}
                    style={{ padding: '3px 8px', fontSize: 11, borderRadius: 7, cursor: 'pointer', border: '1px solid ' + (analyticsWindow === k ? GOLD : '#3a453f'), background: analyticsWindow === k ? 'rgba(212,160,80,0.15)' : 'transparent', color: analyticsWindow === k ? GOLD : CREAM }}>
                    {label}
                  </button>
                ))}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ color: '#7a8480', textAlign: 'left' }}>
                    <th style={{ padding: '4px 6px' }}>Name</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Orders</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Revenue</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Profit</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Last</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>Jars</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right' }}>&#127843;</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map(row => (
                    <tr key={row.id} style={{ borderTop: '1px solid #2a332f', color: CREAM }}>
                      <td style={{ padding: '5px 6px' }}>{row.name}{row.isHouse ? <span style={{ color: '#7a8480' }}> (house)</span> : ''}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right' }}>{row.isHouse ? '—' : row.orders}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right' }}>{row.isHouse ? '—' : currency(row.revenue)}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', color: row.isHouse ? '#7a8480' : (row.profit >= 0 ? '#5DCAA5' : '#EF9F27'), fontWeight: 700 }}>{row.isHouse ? '—' : currency(row.profit) + (row.complete ? '' : '*')}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', color: '#9aa5a0' }}>{row.lastTs ? formatDate(new Date(row.lastTs).toISOString()) : '—'}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, color: row.jarsOut > 0 ? GOLD : '#7a8480' }}>{row.jarsOut}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', color: row.omaCount > 0 ? GOLD : '#7a8480' }}>{row.omaCount > 0 ? 'x' + row.omaCount : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics.some(r => !r.complete) && <div style={{ fontSize: 10, color: '#7a8480', marginTop: 6 }}>* some orders predate cost tracking, so profit is partial</div>}
            </div>
          )}
        </div>
      )}

      {regulars.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyTitle}>No regulars yet</div>
          <div style={styles.emptyBody}>Add your repeat customers to track their preferences and order history.</div>
        </div>
      ) : (
        <div style={styles.regularsList}>
          {regulars.map(r => {
            const linkedCount = (r.linkedOrderIds || []).length;
            return (
              <button
                key={r.id}
                style={styles.regularRow}
                onClick={() => { setActiveId(r.id); setMode('profile'); }}
              >
                <div style={styles.regularRowLeft}>
                  <div style={styles.regularRowName}>
                    {regularDisplayName(r)} <span style={styles.regularStar}>★</span>
                  </div>
                  <div style={styles.regularRowMeta}>
                    {linkedCount} order{linkedCount !== 1 ? 's' : ''}
                    {r.discountPercent > 0 ? ` · ${r.discountPercent}% off` : ''}
                  </div>
                </div>
                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Add / edit a regular's profile fields ─────────────────────────────────
export function RegularForm({ regular, onSave, onCancel }) {
  // Names is now an array to support couples/groups. Seed from the existing
  // profile (new `names` array or legacy single `name`), always keep >= 1 input.
  const seedNames = regular ? regularNames(regular) : [];
  const [names, setNames] = useState(seedNames.length ? seedNames : ['']);
  const [address, setAddress] = useState(regular?.address || '');
  const [phone, setPhone] = useState(regular?.phone || '');
  const [dietary, setDietary] = useState(regular?.dietary || '');
  const [spice, setSpice] = useState(regular?.spice || '');
  const [discountPercent, setDiscountPercent] = useState(regular?.discountPercent ? String(regular.discountPercent) : '');
  const [house, setHouse] = useState(!!regular?.house);

  const cleanNames = names.map(n => n.trim()).filter(Boolean);
  const canSave = cleanNames.length > 0;
  const MAX_NAMES = 3;

  const updateName = (idx, value) => {
    setNames(prev => prev.map((n, i) => (i === idx ? value : n)));
  };
  const addName = () => {
    if (names.length < MAX_NAMES) setNames(prev => [...prev, '']);
  };
  const removeName = (idx) => {
    setNames(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };

  return (
    <div>
      <div style={styles.genCard}>
        <div style={styles.genTitle}>{regular ? 'Edit profile' : 'New regular'}</div>
      </div>
      <div style={styles.regularFormCard}>
        <label style={styles.miniLabel}>Name(s) *</label>
        {names.map((nm, idx) => (
          <div key={idx} style={styles.nameRow}>
            <input
              style={{ ...styles.input, marginBottom: 0, flex: 1 }}
              value={nm}
              onChange={e => updateName(idx, e.target.value)}
              placeholder={idx === 0 ? 'Full name (helps form orders auto-link)' : 'Partner / second name'}
            />
            {names.length > 1 && (
              <button style={styles.nameRemoveBtn} onClick={() => removeName(idx)} aria-label="Remove name">×</button>
            )}
          </div>
        ))}
        {names.length < MAX_NAMES && (
          <button style={styles.addNameBtn} onClick={addName}>+ Add another name</button>
        )}
        <div style={styles.regularFormHint}>
          Add both people in a couple so either name on a form order links to this same profile.
        </div>

        <label style={styles.miniLabel}>Address</label>
        <input style={styles.input} value={address} onChange={e => setAddress(e.target.value)} placeholder="For your delivery reference" />

        <label style={styles.miniLabel}>Phone</label>
        <input style={styles.input} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />

        <label style={styles.miniLabel}>Dietary restrictions</label>
        <input style={styles.input} value={dietary} onChange={e => setDietary(e.target.value)} placeholder="e.g. no peanuts, dairy-free" />

        <label style={styles.miniLabel}>Preferred spice level</label>
        <input style={styles.input} value={spice} onChange={e => setSpice(e.target.value)} placeholder="e.g. level 3, mild" />

        <label style={styles.houseRow}>
          <input type="checkbox" checked={house} onChange={e => setHouse(e.target.checked)} style={styles.houseCheckbox} />
          <span style={styles.houseLabel}>House account</span>
        </label>
        <div style={styles.regularFormHint}>
          Free, and invisible to every business metric: no revenue, no cost, no profit, no demand history.
          Their orders still show up in the shopping list, cook schedule, labels, and packing slips, because you
          still have to buy the food and cook it. Overrides any lifetime discount below.
        </div>

        <label style={styles.miniLabel}>Lifetime discount (%)</label>
        <input
          style={{ ...styles.input, opacity: house ? 0.4 : 1 }}
          type="number" inputMode="decimal"
          value={house ? '' : discountPercent}
          disabled={house}
          onChange={e => setDiscountPercent(e.target.value)}
          placeholder={house ? 'Not used on a house account' : 'e.g. 20 for Mom, 5 for testers'}
        />
        <div style={styles.regularFormHint}>
          {house
            ? 'A house account is already 100% off, so this does nothing.'
            : 'Auto-applies to their orders. You can toggle it off per order.'}
        </div>

        <div style={styles.regularFormActions}>
          <button style={styles.confirmNo} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...styles.confirmYesGreen, opacity: canSave ? 1 : 0.5 }}
            disabled={!canSave}
            onClick={() => onSave({ names: cleanNames, address, phone, dietary, spice, discountPercent, house })}
          >
            {regular ? 'Save changes' : 'Add regular'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Regular profile: summary, insights, history, order linking ────────────
export function RegularProfile({ regular, orders, allRegulars, onUpdate, onDelete, onLink, onUnlink, onBack }) {
  const [editing, setEditing] = useState(false);          // editing the detail form
  const [editingNotes, setEditingNotes] = useState(false); // editing the notes field
  const [notesDraft, setNotesDraft] = useState(regular.notes || '');
  const [showLinkBrowser, setShowLinkBrowser] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Resolve linked orders from ids
  const linkedOrders = useMemo(
    () => (regular.linkedOrderIds || [])
      .map(oid => orders.find(o => o.id === oid))
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [regular.linkedOrderIds, orders]
  );

  // Summary stats
  const totalOrders = linkedOrders.length;
  const totalSpent = linkedOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const lastOrder = linkedOrders[0];

  // Auto-insights — recomputed live from linked history
  const insights = useMemo(() => buildInsights(linkedOrders), [linkedOrders]);

  // When insights change, append any new ones into the notes field (datestamped),
  // but only once per unique insight signature so we don't spam duplicates.
  useEffect(() => {
    if (insights.length === 0) return;
    const sig = insights.join(' | ');
    if (regular.lastInsightSig === sig) return;

    // Figure out which insight lines are genuinely new vs already in notes
    const existingNotes = regular.notes || '';
    const newLines = insights
      .filter(text => !existingNotes.includes(text))
      .map(text => insightStamp(text));

    if (newLines.length > 0) {
      const updatedNotes = existingNotes
        ? existingNotes + '\n' + newLines.join('\n')
        : newLines.join('\n');
      onUpdate(regular.id, { notes: updatedNotes, lastInsightSig: sig });
      setNotesDraft(updatedNotes);
    } else {
      onUpdate(regular.id, { lastInsightSig: sig });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insights]);

  const saveNotes = () => {
    onUpdate(regular.id, { notes: notesDraft });
    setEditing(false);
  };

  // Orders available to link (not already linked), filtered by search
  const linkableOrders = useMemo(() => {
    const linkedSet = new Set(regular.linkedOrderIds || []);
    const q = normName(linkSearch);
    return orders
      .filter(o => !linkedSet.has(o.id))
      .filter(o => !q || normName(o.customer).includes(q))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders, regular.linkedOrderIds, linkSearch]);

  if (editing) {
    return (
      <RegularForm
        regular={regular}
        onSave={(profile) => {
          const names = (profile.names || []).map(n => String(n || '').trim()).filter(Boolean);
          onUpdate(regular.id, {
            names,
            name: names[0] || '', // keep legacy primary in sync
            address: profile.address,
            phone: profile.phone,
            dietary: profile.dietary,
            spice: profile.spice,
            discountPercent: Number(profile.discountPercent) || 0,
            house: !!profile.house,
          });
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div>
      <button style={styles.profileBackBtn} onClick={onBack}>
        ‹ All regulars
      </button>

      {/* Header / summary */}
      <div style={styles.profileHeader}>
        <div style={styles.profileName}>{regularDisplayName(regular)} <span style={styles.regularStar}>★</span></div>
        <div style={styles.profileSummaryGrid}>
          <div style={styles.profileStat}>
            <div style={styles.profileStatNum}>{totalOrders}</div>
            <div style={styles.profileStatLabel}>orders</div>
          </div>
          <div style={styles.profileStat}>
            <div style={styles.profileStatNum}>{currency(totalSpent)}</div>
            <div style={styles.profileStatLabel}>total spent</div>
          </div>
          <div style={styles.profileStat}>
            <div style={styles.profileStatNum}>{lastOrder ? formatDate(lastOrder.createdAt) : '—'}</div>
            <div style={styles.profileStatLabel}>last order</div>
          </div>
          <div style={styles.profileStat}>
            <div style={styles.profileStatNum}>{jarsOutForRegular(regular.id, orders)}</div>
            <div style={styles.profileStatLabel}>containers out</div>
          </div>
          {(() => {
            // Most-ordered dish, and how many omakases they have trusted him with.
            const tally = {}; let omaCount = 0;
            for (const o of linkedOrders) {
              omaCount += omakaseItemsOf(o).length;
              for (const it of (o.items || [])) {
                if (!it.name) continue;
                tally[it.name] = (tally[it.name] || 0) + (Number(it.qty) || 1);
              }
            }
            const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
            return (
              <>
                {top ? (
                  <div style={styles.profileStat}>
                    <div style={{ ...styles.profileStatNum, fontSize: 13 }}>{top[0]}</div>
                    <div style={styles.profileStatLabel}>most ordered ({top[1]}x)</div>
                  </div>
                ) : null}
                {omaCount > 0 ? (
                  <div style={styles.profileStat}>
                    <div style={styles.profileStatNum}>&#127843; x{omaCount}</div>
                    <div style={styles.profileStatLabel}>omakase</div>
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>
        {regular.house ? (
          <div style={styles.profileHouseBadge}>House account &middot; free, and not counted in any metric</div>
        ) : regular.discountPercent > 0 ? (
          <div style={styles.profileDiscountBadge}>{regular.discountPercent}% lifetime discount</div>
        ) : null}
      </div>

      {/* Contact + prefs */}
      <div style={styles.profileSection}>
        <div style={styles.profileSectionTitle}>Details</div>
        {regular.address ? <div style={styles.profileField}><span style={styles.profileFieldKey}>Address:</span> {regular.address}</div> : null}
        {regular.phone ? <div style={styles.profileField}><span style={styles.profileFieldKey}>Phone:</span> {regular.phone}</div> : null}
        {regular.dietary ? <div style={styles.profileField}><span style={styles.profileFieldKey}>Dietary:</span> {regular.dietary}</div> : null}
        {regular.spice ? <div style={styles.profileField}><span style={styles.profileFieldKey}>Spice:</span> {regular.spice}</div> : null}
        {!regular.address && !regular.phone && !regular.dietary && !regular.spice && (
          <div style={styles.profileFieldEmpty}>No details added yet.</div>
        )}
        <button style={styles.profileEditBtn} onClick={() => setEditing(true)}>
          <Pencil size={13} /> Edit details
        </button>
      </div>

      {/* Notes (includes auto-insights) */}
      <div style={styles.profileSection}>
        <div style={styles.profileSectionTitle}>Notes &amp; insights</div>
        {editingNotes ? (
          <>
            <textarea
              style={{ ...styles.textarea, minHeight: '90px' }}
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              placeholder="Free-form notes. Auto-insights from Claude appear here too, datestamped."
              autoFocus
            />
            <div style={styles.regularFormActions}>
              <button style={styles.confirmNo} onClick={() => { setNotesDraft(regular.notes || ''); setEditingNotes(false); }}>Cancel</button>
              <button style={styles.confirmYesGreen} onClick={saveNotes}>Save notes</button>
            </div>
          </>
        ) : (
          <>
            {notesDraft ? (
              <div style={styles.profileNotes}>
                {notesDraft.split('\n').map((line, i) => (
                  <div key={i} style={line.startsWith('[Auto-insight') ? styles.profileInsightLine : styles.profileNoteLine}>
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.profileFieldEmpty}>
                No notes yet. Insights appear automatically after {MIN_ORDERS_FOR_INSIGHT} orders.
              </div>
            )}
            <button style={styles.profileEditBtn} onClick={() => { setNotesDraft(regular.notes || ''); setEditingNotes(true); }}>
              <Pencil size={13} /> Edit notes
            </button>
          </>
        )}
      </div>

      {/* Order history */}
      <div style={styles.profileSection}>
        <div style={styles.profileSectionTitle}>Order history ({totalOrders})</div>
        {linkedOrders.length === 0 ? (
          <div style={styles.profileFieldEmpty}>No orders linked yet.</div>
        ) : (
          <div style={styles.profileHistoryList}>
            {linkedOrders.map(o => (
              <div key={o.id} style={styles.profileHistoryRow}>
                <div style={styles.profileHistoryLeft}>
                  <div style={styles.profileHistoryDate}>{o.createdAt ? formatDate(o.createdAt) : 'undated'}</div>
                  <div style={styles.profileHistoryItems}>
                    {(o.items || []).map(it => `${it.qty}× ${it.name}`).join(', ') || 'No items'}
                  </div>
                </div>
                <div style={styles.profileHistoryRight}>
                  <span style={styles.profileHistoryTotal}>{currency(o.total)}</span>
                  <button style={styles.profileUnlinkBtn} onClick={() => onUnlink(regular.id, o.id)}>unlink</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button style={styles.profileLinkBtn} onClick={() => setShowLinkBrowser(!showLinkBrowser)}>
          {showLinkBrowser ? 'Close' : '+ Link past orders'}
        </button>

        {showLinkBrowser && (
          <div style={styles.linkBrowser}>
            <input
              style={styles.input}
              placeholder="Search orders by name..."
              value={linkSearch}
              onChange={e => setLinkSearch(e.target.value)}
            />
            <div style={styles.linkBrowserList}>
              {linkableOrders.length === 0 ? (
                <div style={styles.profileFieldEmpty}>No matching orders to link.</div>
              ) : (
                linkableOrders.slice(0, 30).map(o => (
                  <button key={o.id} style={styles.linkBrowserRow} onClick={() => onLink(regular.id, o.id)}>
                    <div style={styles.linkBrowserRowLeft}>
                      <span style={styles.linkBrowserName}>{o.customer}</span>
                      <span style={styles.linkBrowserItems}>
                        {(o.items || []).map(it => it.name).join(', ').slice(0, 50)}
                      </span>
                    </div>
                    <span style={styles.linkBrowserMeta}>
                      {o.createdAt ? formatDate(o.createdAt) : ''} · {currency(o.total)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete */}
      <div style={styles.profileSection}>
        {confirmDelete ? (
          <div style={styles.profileDeleteConfirm}>
            <span>Remove this regular? Their order history stays, just unlinked.</span>
            <div style={styles.regularFormActions}>
              <button style={styles.confirmNo} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button style={styles.confirmDeleteRed} onClick={() => onDelete(regular.id)}>Remove</button>
            </div>
          </div>
        ) : (
          <button style={styles.profileDeleteBtn} onClick={() => setConfirmDelete(true)}>
            <Trash2 size={13} /> Remove regular
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Week Tab: pick this week's dinner lineup ──────────────────────────────
