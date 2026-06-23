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

export function ShoppingList({ items, onChange, onGenerate, activeCount, estCost, weekDishes, inventory, onAdjustInventory, onSetInventory, dishNotes, onSaveDishNote }) {
  const [input, setInput] = useState('');
  const [includeStaples, setIncludeStaples] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // ── Single-dish test-run picker ───────────────────────────────────────────
  const [dishPickerOpen, setDishPickerOpen] = useState(false); // collapsed by default
  const [inventoryOpen, setInventoryOpen] = useState(false); // collapsed by default
  const [refCardOpen, setRefCardOpen] = useState(false);      // collapsed by default
  const [refDish, setRefDish] = useState('');                 // selected dish in dropdown
  const [refData, setRefData] = useState(null);               // loaded card data
  const [noteText, setNoteText] = useState('');               // draft note text
  const [pickerDish, setPickerDish] = useState(null);   // dish name selected in picker
  const [pickerVariant, setPickerVariant] = useState(''); // which variant/size
  const [pickerCount, setPickerCount] = useState(1);     // how many batches
  const [pickerStaples, setPickerStaples] = useState(false);

  // All dishes that have recipes, sorted: this week's first, then rest alphabetically
  const allPickerDishes = useMemo(() => {
    const withRecipe = Object.keys(RECIPES);
    const thisWeek = new Set(weekDishes || []);
    return [
      ...withRecipe.filter(d => thisWeek.has(d)).sort(),
      ...withRecipe.filter(d => !thisWeek.has(d)).sort(),
    ];
  }, [weekDishes]);

  // When user picks a dish, default to its smallest variant (lowest factor)
  const selectPickerDish = (dishName) => {
    setPickerDish(dishName);
    const recipe = RECIPES[dishName];
    if (!recipe) return;
    const variants = Object.entries(recipe.factors).sort((a, b) => a[1] - b[1]);
    setPickerVariant(variants[0]?.[0] || '');
    setPickerCount(1);
  };

  // Derive the serving label from the variant label (grab the parenthetical or full label)
  const servingLabel = (variant) => {
    const m = variant.match(/\(([^)]+)\)/);
    return m ? m[1] : variant;
  };

  // Generate ingredients for the selected dish+variant+count and add to list
  const addDishToList = () => {
    if (!pickerDish || !pickerVariant) return;
    const recipe = RECIPES[pickerDish];
    if (!recipe) return;
    const factor = (recipe.factors[pickerVariant] || 1) * pickerCount;
    const lines = [];

    // Section header
    lines.push({ id: uid(), text: `── ${pickerDish} (${pickerVariant}${pickerCount > 1 ? ` × ${pickerCount}` : ''}) ──`, checked: false });

    recipe.base.forEach(ing => {
      if (ing.staple && !pickerStaples) return;
      const qty = ing.q * factor;
      const qtyStr = qty % 1 === 0 ? String(qty) : qty.toFixed(1).replace(/\.0$/, '');
      lines.push({ id: uid(), text: `${qtyStr}${ing.u ? ' ' + ing.u : ''} ${ing.name}`, checked: false });
    });

    // Extras for this variant
    const extras = recipe.extras?.[pickerVariant] || [];
    extras.forEach(ing => {
      if (ing.staple && !pickerStaples) return;
      const qty = ing.fixed ? ing.q : ing.q * factor;
      const qtyStr = qty % 1 === 0 ? String(qty) : qty.toFixed(1);
      lines.push({ id: uid(), text: `${qtyStr}${ing.u ? ' ' + ing.u : ''} ${ing.name}`, checked: false });
    });

    onChange([...items, ...lines]);
    setPickerDish(null);
  };

  // Supports pasting a whole multi-line list at once; strips bullets/numbering
  const addItems = () => {
    const lines = input
      .split('\n')
      .map(l => l.replace(/^[\s•*\-–—]+|^\d+[.)]\s*/g, '').trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    const additions = lines.map(text => ({ id: uid(), text, checked: false }));
    onChange([...items, ...additions]);
    setInput('');
  };

  const toggle = (id) => {
    onChange(items.map(it => (it.id === id ? { ...it, checked: !it.checked } : it)));
  };

  const remove = (id) => {
    onChange(items.filter(it => it.id !== id));
  };

  const uncheckAll = () => {
    onChange(items.map(it => ({ ...it, checked: false })));
  };

  const doneCount = items.filter(it => it.checked).length;

  return (
    <div>
      {/* ── Sauce & Add-on Inventory Tracker ──────────────────────────────── */}
      <div style={styles.inventorySection}>
        <button style={styles.collapsibleHeader} onClick={() => setInventoryOpen(o => !o)}>
          <span style={styles.inventoryTitle}>Sauce &amp; Add-on Inventory</span>
          <span style={styles.collapseChevron}>{inventoryOpen ? '▲' : '▼'}</span>
        </button>
        {inventoryOpen && <>
        <div style={styles.inventoryHint}>
          Tap +/− to adjust stock. Auto-decrements when add-ons are ordered.
          2oz frozen sauces warn yellow under 5, red under 2.
        </div>

        {/* 2oz frozen sauces */}
        <div style={styles.inventoryGroup}>
          <div style={styles.inventoryGroupLabel}>2oz frozen sauces</div>
          {[
            { key: 'chimichurri', label: 'Chimichurri' },
            { key: 'romesco', label: 'Romesco' },
            { key: 'chermoula', label: 'Chermoula' },
            { key: 'misoButter', label: 'Miso Butter Sauce' },
            { key: 'whippedButter', label: 'Whipped Lemon Garlic Herb Butter' },
          ].map(({ key, label }) => {
            const count = Number(inventory?.[key]) || 0;
            const countStyle = count < 2
              ? styles.inventoryCountRed
              : count < 5
              ? styles.inventoryCountYellow
              : styles.inventoryCount;
            return (
              <div key={key} style={styles.inventoryRow}>
                <span style={styles.inventoryName}>{label}</span>
                <div style={styles.inventoryControls}>
                  <button style={styles.inventoryBtn} onClick={() => onAdjustInventory(key, -1)}>−</button>
                  <span style={countStyle}>{count}</span>
                  <button style={styles.inventoryBtn} onClick={() => onAdjustInventory(key, 1)}>+</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Jars — no color warnings */}
        <div style={styles.inventoryGroup}>
          <div style={styles.inventoryGroupLabel}>Jars</div>

          {/* Queso: tracked by spice level (0, 1, or 2 habaneros) */}
          <div style={styles.inventoryRow}>
            <span style={styles.inventoryName}>Queso</span>
          </div>
          {[
            { key: 'queso_0', label: 'No Heat (0)' },
            { key: 'queso_1', label: 'Medium (1 hab.)' },
            { key: 'queso_2', label: 'Hot (2 hab.)' },
          ].map(({ key, label }) => {
            const count = Number(inventory?.[key]) || 0;
            return (
              <div key={key} style={{ ...styles.inventoryRow, paddingLeft: '10px' }}>
                <span style={{ ...styles.inventoryName, fontSize: '12px', color: '#9aa5a0' }}>{label}</span>
                <div style={styles.inventoryControls}>
                  <button style={styles.inventoryBtn} onClick={() => onAdjustInventory(key, -1)}>−</button>
                  <span style={styles.inventoryCount}>{count}</span>
                  <button style={styles.inventoryBtn} onClick={() => onAdjustInventory(key, 1)}>+</button>
                </div>
              </div>
            );
          })}

          {/* Chili Oil */}
          {[{ key: 'chiliOil', label: 'Chili Oil' }].map(({ key, label }) => {
            const count = Number(inventory?.[key]) || 0;
            return (
              <div key={key} style={styles.inventoryRow}>
                <span style={styles.inventoryName}>{label}</span>
                <div style={styles.inventoryControls}>
                  <button style={styles.inventoryBtn} onClick={() => onAdjustInventory(key, -1)}>−</button>
                  <span style={styles.inventoryCount}>{count}</span>
                  <button style={styles.inventoryBtn} onClick={() => onAdjustInventory(key, 1)}>+</button>
                </div>
              </div>
            );
          })}
        </div>
        </>}
      </div>

      {/* ── Single-dish ingredient list picker ───────────────────────────── */}
      <div style={styles.genCard}>
        <button style={styles.collapsibleHeader} onClick={() => { setDishPickerOpen(o => !o); setPickerDish(null); }}>
          <span style={styles.genTitle}>Single Dish Ingredient List</span>
          <span style={styles.collapseChevron}>{dishPickerOpen ? '▲' : '▼'}</span>
        </button>
        {dishPickerOpen && <>
        <div style={styles.genHint}>
          Pick any dish to get its ingredient list. This week's menu is highlighted.
        </div>

        {/* Dish grid */}
        <div style={styles.dishPickerGrid}>
          {allPickerDishes.map(d => {
            const isThisWeek = (weekDishes || []).includes(d);
            const isSelected = pickerDish === d;
            return (
              <button
                key={d}
                style={{
                  ...styles.dishPickerChip,
                  ...(isSelected ? styles.dishPickerChipSelected : {}),
                  ...(isThisWeek && !isSelected ? styles.dishPickerChipWeek : {}),
                }}
                onClick={() => selectPickerDish(d)}
              >
                {isThisWeek && <span style={styles.dishPickerDot}>●</span>}
                {d}
              </button>
            );
          })}
        </div>

        {/* Variant + count selectors */}
        {pickerDish && RECIPES[pickerDish] && (
          <div style={styles.dishPickerControls}>
            <div style={styles.miniLabel}>Size</div>
            <div style={styles.dishPickerVariants}>
              {Object.entries(RECIPES[pickerDish].factors)
                .sort((a, b) => a[1] - b[1])
                .map(([v]) => (
                  <button
                    key={v}
                    style={{
                      ...styles.dishPickerVariantBtn,
                      ...(pickerVariant === v ? styles.dishPickerVariantBtnOn : {}),
                    }}
                    onClick={() => setPickerVariant(v)}
                  >
                    {v}
                    <span style={styles.dishPickerServing}> · {servingLabel(v)}</span>
                  </button>
                ))}
            </div>

            <div style={styles.dishPickerCountRow}>
              <div style={styles.miniLabel}>Batches</div>
              <div style={styles.dishPickerCounter}>
                <button style={styles.inventoryBtn} onClick={() => setPickerCount(c => Math.max(1, c - 1))}>−</button>
                <span style={styles.inventoryCount}>{pickerCount}</span>
                <button style={styles.inventoryBtn} onClick={() => setPickerCount(c => c + 1)}>+</button>
              </div>
            </div>

            <label style={{ ...styles.genToggleRow, marginTop: '8px' }}>
              <input
                type="checkbox"
                checked={pickerStaples}
                onChange={e => setPickerStaples(e.target.checked)}
                style={styles.genCheckbox}
              />
              Include pantry staples
            </label>

            <button style={{ ...styles.saveBtn, marginTop: '10px' }} onClick={addDishToList}>
              Add ingredients to list
            </button>
          </div>
        )}
        </>}
      </div>

      <div style={styles.genCard}>
        <div style={styles.genTitle}>Build list from this week's orders</div>
        <div style={styles.genHint}>
          Reads every active order and adds up the ingredients per recipe. Re-tap any time orders change — your manual items and checkmarks stay put.
        </div>
        <label style={styles.genToggleRow}>
          <input
            type="checkbox"
            checked={includeStaples}
            onChange={e => setIncludeStaples(e.target.checked)}
            style={styles.genCheckbox}
          />
          Include pantry staples (soy, spices, oils, etc.)
        </label>
        <button
          style={{ ...styles.saveBtn, marginTop: '8px', ...(activeCount === 0 ? styles.saveBtnDisabled : {}) }}
          onClick={() => onGenerate(includeStaples)}
          disabled={activeCount === 0}
        >
          {activeCount === 0 ? 'No active orders yet' : `Generate from ${activeCount} active order${activeCount !== 1 ? 's' : ''}`}
        </button>
      </div>

      {estCost > 0 && (
        <div style={styles.shopCostBar}>
          <span style={styles.shopCostLabel}>Est. ingredient spend for active orders</span>
          <span style={styles.shopCostValue}>~{currency(estCost)}</span>
        </div>
      )}

      <div style={styles.shopInputRow}>
        <textarea
          style={{ ...styles.textarea, minHeight: '44px', flex: 1 }}
          placeholder="Add an item — or paste a whole list, one item per line"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          style={{ ...styles.shopAddBtn, ...(!input.trim() ? styles.saveBtnDisabled : {}) }}
          onClick={addItems}
          disabled={!input.trim()}
        >
          <Plus size={18} />
        </button>
      </div>

      {items.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyTitle}>Shopping list is empty</div>
          <div style={styles.emptyBody}>Type items one at a time, or paste a whole ingredient list and each line becomes its own entry.</div>
        </div>
      ) : (
        <>
          <div style={styles.cookHeader}>
            <div style={styles.cookSummary}>{doneCount}/{items.length} in the cart</div>
            {doneCount > 0 && (
              <button style={styles.resetBtn} onClick={uncheckAll}>
                <RotateCcw size={13} />
                Uncheck all
              </button>
            )}
          </div>
          <div>
            {items.map(it => (
              <div key={it.id} style={{ ...styles.shopItem, ...(it.checked ? styles.cookItemChecked : {}) }}>
                <button style={styles.shopItemMain} onClick={() => toggle(it.id)}>
                  <div style={{ ...styles.checkbox, ...(it.checked ? styles.checkboxChecked : {}) }}>
                    {it.checked && <Check size={14} color="#1a1a1a" />}
                  </div>
                  <span style={{ ...styles.shopItemText, ...(it.checked ? styles.shopItemTextChecked : {}) }}>
                    {it.text}
                  </span>
                </button>
                <button style={styles.shopDeleteBtn} onClick={() => remove(it.id)} aria-label={`Remove ${it.text}`}>
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>

          <div style={styles.shopBulkRow}>
            {doneCount > 0 && (
              <button style={styles.resetBtn} onClick={() => onChange(items.filter(it => !it.checked))}>
                <Trash2 size={13} />
                Remove checked ({doneCount})
              </button>
            )}
            {confirmClear ? (
              <div style={styles.confirmRow}>
                <span style={styles.confirmText}>Delete the whole list?</span>
                <button style={styles.confirmYes} onClick={() => { onChange([]); setConfirmClear(false); }}>Clear</button>
                <button style={styles.confirmNo} onClick={() => setConfirmClear(false)}>Cancel</button>
              </div>
            ) : (
              <button style={{ ...styles.resetBtn, color: '#993556' }} onClick={() => setConfirmClear(true)}>
                <Trash2 size={13} />
                Clear list
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Dish Reference Card ──────────────────────────────────────────── */}
      <div style={styles.inventorySection}>
        <button style={styles.collapsibleHeader} onClick={() => setRefCardOpen(o => !o)}>
          <span style={styles.inventoryTitle}>Dish Reference Card</span>
          <span style={styles.collapseChevron}>{refCardOpen ? '▲' : '▼'}</span>
        </button>
        {refCardOpen && (
          <div>
            <div style={styles.inventoryHint}>
              Full ingredient breakdown, margins, and cook notes for any dish.
            </div>
            <div style={styles.refCardPickerRow}>
              <select
                style={styles.refCardSelect}
                value={refDish}
                onChange={e => { setRefDish(e.target.value); setRefData(null); }}
              >
                <option value="">Select a dish…</option>
                {(() => {
                  const thisWeek = new Set(weekDishes || []);
                  const withRecipe = Object.keys(RECIPES);
                  const thisWeekDishes = withRecipe.filter(d => thisWeek.has(d)).sort();
                  const otherDishes = withRecipe.filter(d => !thisWeek.has(d)).sort();
                  return [
                    thisWeekDishes.length > 0 && (
                      <optgroup key="week" label="This week">
                        {thisWeekDishes.map(d => <option key={d} value={d}>{d}</option>)}
                      </optgroup>
                    ),
                    otherDishes.length > 0 && (
                      <optgroup key="other" label="Other dishes">
                        {otherDishes.map(d => <option key={d} value={d}>{d}</option>)}
                      </optgroup>
                    ),
                  ].filter(Boolean);
                })()}
              </select>
              <button
                style={{ ...styles.saveBtn, marginTop: 0, flexShrink: 0, opacity: refDish ? 1 : 0.4 }}
                disabled={!refDish}
                onClick={() => {
                  if (!refDish) return;
                  const recipe = RECIPES[refDish];
                  const menuDish = ALL_DINNERS.find(d => d.name === refDish);
                  const variants = menuDish?.variants || [];
                  setNoteText((dishNotes || {})[refDish] || '');
                  setRefData({ recipe, variants });
                }}
              >
                Load
              </button>
            </div>

            {refData && (
              <div style={styles.refCardBody}>
                {/* ── Margins table ── */}
                {refData.variants.length > 0 && (
                  <div style={styles.refCardSection}>
                    <div style={styles.refCardSectionTitle}>Margins by variant</div>
                    {refData.variants.map(v => {
                      const margin = v.price - v.cost;
                      const pct = v.price > 0 ? Math.round((margin / v.price) * 100) : 0;
                      const color = pct >= 55 ? '#5a8f6a' : pct >= 40 ? GOLD : '#993556';
                      return (
                        <div key={v.label} style={styles.refCardRow}>
                          <span style={styles.refCardVariantLabel}>{v.label}</span>
                          <span style={styles.refCardPrice}>{currency(v.price)}</span>
                          <span style={styles.refCardCost}>cost {currency(v.cost)}</span>
                          <span style={{ ...styles.refCardMargin, color }}>
                            {currency(margin)} · {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Ingredient list (base recipe, factor=1) ── */}
                {refData.recipe && (
                  <div style={styles.refCardSection}>
                    <div style={styles.refCardSectionTitle}>Base ingredients (1× batch)</div>
                    {refData.recipe.base.map((ing, i) => (
                      <div key={i} style={styles.refCardIngRow}>
                        <span style={{ ...styles.refCardIngName, ...(ing.staple ? styles.refCardIngStaple : {}) }}>
                          {ing.name}{ing.staple ? ' ✦' : ''}
                        </span>
                        <span style={styles.refCardIngQty}>
                          {ing.q} {ing.u}
                        </span>
                      </div>
                    ))}
                    {refData.recipe.extras && Object.keys(refData.recipe.extras).length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ ...styles.refCardSectionTitle, fontSize: '11px', opacity: 0.7 }}>Variant extras</div>
                        {Object.entries(refData.recipe.extras).map(([vLabel, ings]) => (
                          <div key={vLabel} style={{ marginBottom: '6px' }}>
                            <div style={styles.refCardExtrasLabel}>{vLabel}</div>
                            {ings.map((ing, i) => (
                              <div key={i} style={styles.refCardIngRow}>
                                <span style={styles.refCardIngName}>{ing.name}</span>
                                <span style={styles.refCardIngQty}>{ing.q} {ing.u}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Cook notes ── */}
                <div style={styles.refCardSection}>
                  <div style={styles.refCardSectionTitle}>Cook notes</div>
                  <textarea
                    style={styles.refCardNotes}
                    placeholder="Add notes about this dish — technique reminders, timing, substitutions, anything you want to remember…"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                  />
                  <button
                    style={{ ...styles.saveBtn, marginTop: '6px', width: '100%' }}
                    onClick={() => onSaveDishNote(refDish, noteText)}
                  >
                    Save notes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
