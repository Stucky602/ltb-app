// ═══ RECEIPT SCANNER GATE — fusion, phantom matches, unit-price bugs ═════════
// Jul 13 2026 (Fable). Pins the three bug classes diagnosed from Kevin's real
// H-E-B receipt + screenshots:
//   Bug 1 — line total leaked out as the per-unit price ("3 @ 3.98" → $11.94)
//   Bug 2 — line fusion + phantom matches (TOMATO…OAXACA chimera, phantom
//           mushrooms, phantom "merged ×2" evaporated milk)
//   Bug 3 — jumbo red onion priced per-each instead of bridged to per-lb
// Run: node tests/receipt_scan.mjs   (part of the gate battery)
//
// Fixtures are SYNTHETIC mirrors of the real receipt lines, scored against a
// self-contained seed (so this suite never drifts with the live ingredient
// DB). The onion entries are costed per POUND here, mirroring how Kevin costs
// onions — the each→lb bridge only fires when the ingredient's costing unit
// is lb.

import {
  buildReviewPlan, parsePastedReceipt, derivePerUnit, onePackPriceFor,
  looksFusedLine, defaultAccept, scoreNamePair, FUZZY_WEAK,
  mergeExtractions, reconcileReceipt, confidenceTier, perUnitFromUserWeight, autoApplyAllowed,
} from '../src/receiptMatch.js';

const fails = [];
const F = (rule, msg) => fails.push(`[${rule}] ${msg}`);
const near = (a, b, tol = 0.005) => a != null && Math.abs(a - b) <= tol;

// Self-contained seed. Names/units mirror the live DB shapes that matter for
// these bugs; onions per-lb (see header note).
const SEED = [
  { id: 'egg_taglierini', name: 'Egg taglierini', unit: 'pack', baseline: 3.98, current: 3.98 },
  { id: 'egg_pappardelle', name: 'Egg pappardelle', unit: 'pack', baseline: 4.2, current: 4.2 },
  { id: 'chicken_basics_stock', name: 'Kitchen Basics stock', unit: 'carton', baseline: 2.98, current: 2.98 },
  { id: 'chicken_stock', name: 'Chicken stock', unit: 'cup', baseline: 0.745, current: 0.745 },
  { id: 'beef_stock', name: 'Beef stock', unit: 'cup', baseline: 0.75, current: 0.75 },
  { id: 'butter', name: 'Butter', unit: 'stick', baseline: 0.95, current: 0.95 },
  { id: 'mushrooms', name: 'Mushrooms', unit: 'lb', baseline: 5.0, current: 8.99 },
  { id: 'tomato_can', name: 'Canned tomato (28oz)', unit: 'can', baseline: 3.54, current: 3.54 },
  { id: 'peeled_tomatoes', name: 'Peeled tomatoes (14oz)', unit: 'can', baseline: 1.08, current: 1.08 },
  { id: 'oaxaca', name: 'Oaxaca cheese', unit: 'lb', baseline: 8.12, current: 8.12 },
  { id: 'evaporated_milk', name: 'Evaporated milk', unit: 'cup', baseline: 1.53, current: 1.53 },
  { id: 'milk', name: 'Milk', unit: 'cup', baseline: 0.275, current: 0.275 },
  { id: 'red_onion', name: 'Red onion', unit: 'lb', baseline: 2.0, current: 2.0 },
  { id: 'onion', name: 'Onion (yellow)', unit: 'lb', baseline: 0.99, current: 0.99 },
  { id: 'garlic', name: 'Garlic', unit: 'head', baseline: 0.5, current: 0.5 },
  { id: 'cilantro', name: 'Cilantro', unit: 'bunch', baseline: 0.5, current: 0.5 },
];
const plan = (lines, aliases = {}) => buildReviewPlan({ store: 'H-E-B', lines }, SEED, aliases);
const allOf = (p) => [...p.buckets.matched, ...p.buckets.review, ...p.buckets.needsConversion, ...p.buckets.needsPrice, ...p.buckets.unmatched, ...p.buckets.ignored];

// ─── 1. BUG 1: line total ÷ quantity for non-weighed each-style lines ────────
{
  // The three real screenshot lines (photo-extraction shape: qty + total, no
  // printed rate). Before the fix these derived 11.94 / 11.92 / 3.88.
  const nests = derivePerUnit({ item_name: 'CM EGG TAGLIERINI NESTS', quantity: 3, unit: 'Ea', line_total: 11.94, unit_price_printed: null });
  if (!near(nests.perUnit, 3.98) || nests.basis !== 'total_div_qty') F('bug1', `taglierini: ${JSON.stringify(nests)}, want 3.98/total_div_qty`);
  const stock = derivePerUnit({ item_name: 'KITCH BASICS REAL CHKN ST', quantity: 4, unit: null, line_total: 11.92, unit_price_printed: null });
  if (!near(stock.perUnit, 2.98) || stock.basis !== 'total_div_qty') F('bug1', `stock: ${JSON.stringify(stock)}, want 2.98/total_div_qty`);
  const butter = derivePerUnit({ item_name: 'HEB SI UNSALTD BUTTER QTR', quantity: 4, unit: 'Ea', line_total: 3.88, unit_price_printed: null });
  if (!near(butter.perUnit, 0.97) || butter.basis !== 'total_div_qty') F('bug1', `butter: ${JSON.stringify(butter)}, want 0.97/total_div_qty`);

  // qty 1 / qty null keep the raw line_total basis (unchanged fallback).
  const one = derivePerUnit({ item_name: 'X', quantity: 1, line_total: 2.49 });
  if (one.basis !== 'line_total' || one.perUnit !== 2.49) F('bug1', `qty-1 must stay line_total: ${JSON.stringify(one)}`);
  const noQty = derivePerUnit({ item_name: 'X', line_total: 2.49 });
  if (noQty.basis !== 'line_total') F('bug1', `qty-null must stay line_total: ${JSON.stringify(noQty)}`);

  // Weighed lines never double-divide: the weighed branch still owns them.
  const weighed = derivePerUnit({ item_name: 'YELLOW ONION', weighed: true, quantity: 2.95, unit: 'lb', line_total: 2.04 });
  if (weighed.basis !== 'total_div_weight' || !near(weighed.perUnit, 0.692, 0.002)) F('bug1', `weighed: ${JSON.stringify(weighed)}`);
  // Printed rate still wins outright.
  const printed = derivePerUnit({ item_name: 'X', quantity: 4, unit: 'Ea', unit_price_printed: 0.97, line_total: 3.88 });
  if (printed.basis !== 'printed_unit_price' || printed.perUnit !== 0.97) F('bug1', `printed: ${JSON.stringify(printed)}`);
  // Non-each units are NOT divided here (pack semantics belong to the
  // conversion layer, which uses onePackPriceFor).
  const packUnit = derivePerUnit({ item_name: 'GARLIC', quantity: 5, unit: '5 pack', line_total: 3.0 });
  if (packUnit.basis !== 'line_total') F('bug1', `non-each unit must stay line_total: ${JSON.stringify(packUnit)}`);

  // Agreement with onePackPriceFor on each-unit lines (the two functions
  // disagreeing is what let the display show the raw total).
  for (const l of [
    { quantity: 3, unit: 'Ea', line_total: 11.94, unit_price_printed: null },
    { quantity: 4, unit: 'Ea', line_total: 11.92, unit_price_printed: null },
    { quantity: 4, unit: 'Ea', line_total: 3.88, unit_price_printed: null },
  ]) {
    if (!near(derivePerUnit(l).perUnit, onePackPriceFor(l, 'each'), 0.0001)) F('bug1', `derivePerUnit disagrees with onePackPriceFor: ${JSON.stringify(l)}`);
  }

  // Pipeline: taglierini auto-matches and carries the divided price; a sane
  // total_div_qty basis is trustworthy enough to default-accept.
  const p = plan([{ item_name: 'CM EGG TAGLIERINI NESTS', quantity: 3, unit: 'Ea', line_total: 11.94, unit_price_printed: null }]);
  const tg = p.buckets.matched.find(g => g.ingredientId === 'egg_taglierini');
  if (!tg) F('bug1', `taglierini not auto-matched: ${JSON.stringify(allOf(p).map(g => ({ s: g.status, id: g.ingredientId })))}`);
  else {
    if (!near(tg.perUnit, 3.98)) F('bug1', `taglierini pipeline perUnit ${tg.perUnit}, want 3.98`);
    if (!defaultAccept(tg, 3.98)) F('bug1', 'sane total_div_qty must default-accept');
  }

  // The stock line name is weak OCR ("REAL CHKN ST") — pre-Jul-14 it pinned
  // as review. Kevin has since SEEDED the alias (D2), so the string now
  // auto-matches AND converts carton → cup via the seeded packQty (4 cups per
  // 32 oz carton) in one step: 4 cartons, $11.92, → $2.98/carton → $0.745/cup.
  const ps = plan([{ item_name: 'KITCH BASICS REAL CHKN ST', quantity: 4, unit: 'Ea', line_total: 11.92, unit_price_printed: null }]);
  const sg = ps.buckets.matched.find(g => g.ingredientId === 'chicken_stock');
  if (!sg || !near(sg.perUnit, 0.745)) F('bug1', `seeded chicken stock 4-carton: ${JSON.stringify(sg && { p: sg.perUnit, b: sg.basis })}, want 0.745/cup`);
  // The weak-fuzzy invariant survives on an UNSEEDED sibling string: it must
  // never silently auto-match (review or unmatched are both fine).
  const pw = plan([{ item_name: 'KITCH BASICS REAL VEG ST', quantity: 4, unit: 'Ea', line_total: 11.92, unit_price_printed: null }]);
  if (pw.buckets.matched.length) F('bug1', `unseeded weak name must not auto-match: ${JSON.stringify(pw.buckets.matched.map(g => g.ingredientId))}`);

  // BUTTER, both shapes. Photo-shape "4 Ea, total 3.88" itemizes STICKS —
  // per-unit is 0.97/stick, and the pack override must NOT divide again
  // (0.2425/stick would fail the sanity band the 0.97 reading passes).
  const pb = plan([{ item_name: 'HEB SI UNSALTD BUTTER QTR', quantity: 4, unit: 'Ea', line_total: 3.88, unit_price_printed: null }]);
  const bg = pb.buckets.matched.find(g => g.ingredientId === 'butter');
  if (!bg || !near(bg.perUnit, 0.97)) F('bug1', `butter 4-Ea: ${JSON.stringify(bg && { p: bg.perUnit, b: bg.basis, c: bg.conversion })}, want 0.97/stick`);
  // Single-box shape "1 Ea, total 3.88" is one whole 1-lb box → ÷4 as always.
  const pb1 = plan([{ item_name: 'HEB SI UNSALTD BUTTER QTR', quantity: null, unit: null, line_total: 3.88, unit_price_printed: null }]);
  const bg1 = pb1.buckets.matched.find(g => g.ingredientId === 'butter');
  if (!bg1 || !near(bg1.perUnit, 0.97)) F('bug1', `butter 1-box: ${JSON.stringify(bg1 && bg1.perUnit)}, want 0.97 (3.88/4)`);

  // Multi-qty PACK items still divide (regression guard for the tiebreak):
  // 4 stock cartons at 2.98 apiece → 0.745/cup via the ÷4 carton override.
  const pk = plan([{ item_name: 'KITCH BASIC UNSLTD BEEF', quantity: 4, unit: 'Ea', line_total: 11.92, unit_price_printed: null }]);
  const kg = pk.buckets.matched.find(g => g.ingredientId === 'beef_stock');
  if (!kg || !near(kg.perUnit, 0.745)) F('bug1', `beef stock 4-carton: ${JSON.stringify(kg && kg.perUnit)}, want 0.745/cup`);
}

// ─── 2. BUG 2b: phantom matches land UNMATCHED, never auto/review ────────────
{
  // A garbled fragment sharing only a PREFIX with "Mushrooms" — the phantom
  // mushroom card. Prefix-only overlap can no longer clear the review bar.
  const p1 = plan([{ item_name: 'BUG MUSHRO', line_total: 4.99 }]);
  if (!p1.buckets.unmatched.length || p1.buckets.matched.length || p1.buckets.review.length)
    F('bug2-phantom', `prefix-only fragment must land unmatched: ${JSON.stringify(allOf(p1).map(g => ({ s: g.status, id: g.ingredientId })))}`);
  if (scoreNamePair('BUG MUSHRO', 'Mushrooms') >= FUZZY_WEAK) F('bug2-phantom', 'prefix-only score must fall below FUZZY_WEAK');

  // A lone-token garble is a probable OCR fragment: only an EXACT name may
  // bind. "MUSHRO" → unmatched; "CILANTRO" (exact) still auto-matches.
  const p2 = plan([{ item_name: 'MUSHRO', line_total: 4.99 }]);
  if (!p2.buckets.unmatched.length || p2.buckets.matched.length || p2.buckets.review.length) F('bug2-phantom', 'single-token fragment must land unmatched');
  const p3 = plan([{ item_name: 'CILANTRO', line_total: 0.45, weighed: true }]);
  const cg = p3.buckets.matched.find(g => g.ingredientId === 'cilantro');
  if (!cg || cg.perUnit !== 0.45) F('bug2-phantom', `exact single-token must still match (sold-by-each): ${JSON.stringify(cg && cg.perUnit)}`);

  // Happy path: a real mushroom line still auto-matches (don't over-tighten).
  const p4 = plan([{ item_name: 'WHITE MUSHROOMS', quantity: 0.62, unit: 'lb', weighed: true, line_total: 5.57 }]);
  const mg = p4.buckets.matched.find(g => g.ingredientId === 'mushrooms');
  if (!mg || !near(mg.perUnit, 8.984, 0.01)) F('bug2-phantom', `real mushrooms must match: ${JSON.stringify(mg && mg.perUnit)}`);
}

// ─── 3. BUG 2a: no tomato/oaxaca fusion ──────────────────────────────────────
{
  // Parser adjacency: a name line whose detail line the OCR mangled must NOT
  // wait around and grab a later, unrelated detail line.
  const txt = [
    'H-E-B',
    '3 HEB WHOLE PEELED TOMATOES',
    '@@ $$ mangled ocr junk $$',        // the tomatoes' detail line, destroyed
    '  1 Ea. @ 1/ 4.24 F  4.24',        // the OAXACA detail — its name line was lost
    '4 LA VAQUITA OAXACA  F  4.24',     // oaxaca as a one-liner elsewhere
    '*** Sale Subtotal***  8.48',
  ].join('\n');
  const p = parsePastedReceipt(txt);
  if (p.lines.some(l => /TOMATO/i.test(l.item_name) && /OAXACA/i.test(l.item_name)))
    F('bug2-fusion', `parser fused tomato+oaxaca: ${JSON.stringify(p.lines.map(l => l.item_name))}`);
  if (p.lines.some(l => /TOMATO/i.test(l.item_name) && l.line_total === 4.24))
    F('bug2-fusion', 'stale tomato name paired with the oaxaca detail line');
  if (!p.unparsed.some(l => /PEELED TOMATOES/.test(l)))
    F('bug2-fusion', `desynced name must be flushed to unparsed (visible), got: ${JSON.stringify(p.unparsed)}`);
  if (p.lines.some(l => /^Ea\.?\s*@/i.test(l.item_name)))
    F('bug2-fusion', 'orphaned detail line must not emit as a junk item');
  const oax = p.lines.find(l => l.item_name === 'LA VAQUITA OAXACA');
  if (!oax || oax.line_total !== 4.24) F('bug2-fusion', `oaxaca one-liner must parse cleanly: ${JSON.stringify(oax)}`);

  // Classifier: an ALREADY-fused name (photo-extraction chimera) routes to
  // UNMATCHED — never auto/review onto canned tomato.
  if (!looksFusedLine('HEB WHOLE PEELED TOMATOES 4 LA VAQUITA OAXACA')) F('bug2-fusion', 'fused-line detector missed the chimera');
  for (const clean of ['SHRIMP GULF BRN 31 40 HLS', '10 CT FLOUR TORTILLA SCAN', 'GHIRARDELLI 100% COCOA UN', 'EMERALD CRUNCH DM 11-12 C', 'GARLIC PK 5PC', 'MODELO ESPECIAL 12PK', 'FRESH CARROTS 2#']) {
    if (looksFusedLine(clean)) F('bug2-fusion', `false positive on clean name: ${clean}`);
  }
  const pf = plan([{ item_name: 'HEB WHOLE PEELED TOMATOES 4 LA VAQUITA OAXACA', line_total: 4.24 }]);
  const fg = allOf(pf)[0];
  if (!fg || fg.status !== 'unmatched' || !fg.suspectFusion)
    F('bug2-fusion', `fused chimera must land unmatched+flagged: ${JSON.stringify(fg && { s: fg.status, f: fg.suspectFusion, id: fg.ingredientId })}`);

  // The oaxaca line on its own points at the CHEESE (review with oaxaca on
  // top is fine — it must never bind to a tomato id).
  const po = plan([{ item_name: 'LA VAQUITA OAXACA', line_total: 4.24 }]);
  const og = allOf(po)[0];
  if (!og) F('bug2-fusion', 'oaxaca line vanished');
  else {
    if (og.ingredientId && /tomato/.test(og.ingredientId)) F('bug2-fusion', `oaxaca bound to a tomato id: ${og.ingredientId}`);
    if (og.status === 'review' && og.candidates.length && og.candidates[0].id !== 'oaxaca') F('bug2-fusion', `oaxaca must top its own review card: ${JSON.stringify(og.candidates.map(c => c.id))}`);
    if (og.status === 'matched' && og.ingredientId !== 'oaxaca') F('bug2-fusion', `oaxaca matched to ${og.ingredientId}`);
  }
}

// ─── 4. BUG 2c: no phantom "merged ×2" evaporated milk ───────────────────────
{
  // The real Carnation line plus an unrelated garble: exactly ONE evaporated
  // milk group, no merge, and the garble stays unmatched.
  const p = plan([
    { item_name: 'CARNATION EVAPORATED MILK', quantity: null, unit: null, line_total: 1.64, unit_price_printed: null },
    { item_name: 'LEA VACUM MLK', quantity: null, unit: null, line_total: 1.64, unit_price_printed: null },
  ]);
  const evGroups = allOf(p).filter(g => g.ingredientId === 'evaporated_milk');
  if (evGroups.length !== 1) F('bug2-merge', `want exactly 1 evaporated-milk group, got ${evGroups.length}`);
  else {
    const ev = evGroups[0];
    if (ev.mergedFrom) F('bug2-merge', `phantom merge happened: ${JSON.stringify(ev.mergedFrom)}`);
    if (ev.count !== 1 || ev.lines.length !== 1) F('bug2-merge', `phantom line pooled in: count ${ev.count}`);
    if (!near(ev.perUnit, 1.093, 0.005)) F('bug2-merge', `carnation can: ${ev.perUnit}, want 1.64/1.5 = 1.093/cup`);
  }
  if (!p.buckets.unmatched.some(g => /LEA VACUM/.test(g.line.item_name))) F('bug2-merge', 'the garble must land unmatched');

  // Defense in depth: two alias-taught lines whose prices AGREE with each
  // other but both fail the sanity band (a pair of consistent misreads) must
  // NOT pool into one silent wrong price — both stay separate rows.
  const al = { 'brand a evaporated milk': { ingredientId: 'evaporated_milk' }, 'brand b evaporated milk': { ingredientId: 'evaporated_milk' } };
  const p2 = plan([
    { item_name: 'BRAND A EVAPORATED MILK', quantity: 2, unit: 'Ea', line_total: 24.0, unit_price_printed: null },
    { item_name: 'BRAND B EVAPORATED MILK', quantity: 2, unit: 'Ea', line_total: 24.0, unit_price_printed: null },
  ], al);
  const warned = allOf(p2).filter(g => g.ingredientId === 'evaporated_milk');
  if (warned.length !== 2) F('bug2-merge', `warned sides must stay split, got ${warned.length} group(s)`);
  if (warned.some(g => g.mergedFrom)) F('bug2-merge', 'suspect sides must never pool');

  // Happy path: two clean lines of the SAME string still pool (v3.4 behavior
  // preserved) — weighed yellow onion via alias (the raw name is a deliberate
  // onion-family near-tie that goes to review, so the pin uses the taught
  // path, mirroring the v3.4 invariants), quantity-weighted.
  const p3 = plan([
    { item_name: 'YELLOW ONION', quantity: 2.95, unit: 'lb', line_total: 2.04, weighed: true },
    { item_name: 'YELLOW ONION', quantity: 1.92, unit: 'lb', line_total: 1.52, weighed: true },
  ], { 'yellow onion': { ingredientId: 'onion' } });
  const on = allOf(p3).find(g => g.ingredientId === 'onion');
  if (!on || on.count !== 2 || !(on.pooledWeight > 4.8)) F('bug2-merge', `clean same-string pooling must survive: ${JSON.stringify(on && { c: on.count, w: on.pooledWeight })}`);
}

// ─── 5. BUG 3: jumbo red onion bridges per-each → per-lb ─────────────────────
{
  // Pasted shape: "2 Ea. @ 1/ 2.99" — printed per-each rate.
  const p = plan([{ item_name: 'JUMBO RED ONION', quantity: 2, unit: 'Ea', unit_price_printed: 2.99, line_total: 5.98 }], { 'jumbo red onion': { ingredientId: 'red_onion' } });
  const g = p.buckets.matched.find(x => x.ingredientId === 'red_onion');
  if (!g) F('bug3', `jumbo red onion not matched: ${JSON.stringify(allOf(p).map(x => ({ s: x.status, id: x.ingredientId })))}`);
  else {
    if (!near(g.perUnit, 3.518, 0.01)) F('bug3', `perUnit ${g.perUnit}, want 2.99/0.85 ≈ 3.52/lb — not $2.99/each`);
    if (g.basis !== 'converted' || !g.conversion || g.conversion.toUnit !== 'lb') F('bug3', `must record a per-lb conversion: ${JSON.stringify({ b: g.basis, c: g.conversion })}`);
  }
  // Photo shape: qty + total only — total_div_qty now rides the same bridge.
  const p2 = plan([{ item_name: 'JUMBO RED ONION', quantity: 2, unit: null, line_total: 5.98, unit_price_printed: null }], { 'jumbo red onion': { ingredientId: 'red_onion' } });
  const g2 = p2.buckets.matched.find(x => x.ingredientId === 'red_onion');
  if (!g2 || !near(g2.perUnit, 3.518, 0.01)) F('bug3', `photo-shape jumbo: ${JSON.stringify(g2 && g2.perUnit)}, want ≈3.52/lb`);

  // Non-jumbo control keeps the standard 0.6 lb average. ("RED ONION" alone
  // is an onion-family near-tie → review by design, so the control pins the
  // alias path; the conversion under test is identical.)
  const p3 = plan([{ item_name: 'RED ONION', quantity: 2, unit: 'Ea', unit_price_printed: 1.2, line_total: 2.4 }], { 'red onion': { ingredientId: 'red_onion' } });
  const g3 = p3.buckets.matched.find(x => x.ingredientId === 'red_onion');
  if (!g3 || !near(g3.perUnit, 2.0, 0.01)) F('bug3', `standard red onion: ${JSON.stringify(g3 && g3.perUnit)}, want 1.20/0.6 = 2.00/lb`);
}

// ─── 6. Happy-path regression: a clean two-line H-E-B pair, end to end ───────
{
  const txt = [
    'H-E-B',
    '1 KITCH BASIC UNSLTD BEEF',
    '  2 Ea. @ 1/ 2.98 F  5.96',
    '7 CILANTRO  F  0.45',
    '9 HEB WHOLE MILK  FW  3.70',
    '*** Sale Subtotal***  10.11',
  ].join('\n');
  const p = parsePastedReceipt(txt);
  if (p.store !== 'H-E-B') F('happy', `store: ${p.store}`);
  if (p.lines.length !== 3) F('happy', `want 3 lines, got ${p.lines.length}: ${JSON.stringify(p.lines.map(l => l.item_name))}`);
  const beef = p.lines.find(l => /KITCH/.test(l.item_name));
  if (!beef || beef.quantity !== 2 || beef.unit_price_printed !== 2.98 || beef.line_total !== 5.96 || beef.unit !== 'ea')
    F('happy', `2-Ea pair must parse exactly as before: ${JSON.stringify(beef)}`);
  if (p.printed_subtotal !== 10.11) F('happy', `subtotal: ${p.printed_subtotal}`);

  const rp = buildReviewPlan(p, SEED, {});
  const bs = rp.buckets.matched.find(g => g.ingredientId === 'beef_stock');
  if (!bs || !near(bs.perUnit, 0.745)) F('happy', `beef stock carton ÷4: ${JSON.stringify(bs && bs.perUnit)}, want 0.745/cup`);
  const mk = rp.buckets.matched.find(g => g.ingredientId === 'milk');
  if (!mk || !near(mk.perUnit, 0.231, 0.002)) F('happy', `milk gallon rule: ${JSON.stringify(mk && mk.perUnit)}, want 0.231/cup`);
}

// ─── 7. TWO-PHOTO SPLIT SCAN: merge + whole-receipt reconcile (A3/A4) ────────
{
  const TOP = { store: 'H-E-B', lines: [
    { raw_text: '1 CILANTRO F 0.45', item_name: 'CILANTRO', quantity: null, unit: null, line_total: 0.45, unit_price_printed: null, weighed: true },
    { raw_text: '2 GARLIC F 0.50', item_name: 'GARLIC', quantity: null, unit: null, line_total: 0.50, unit_price_printed: null, weighed: false },
  ], printed_subtotal: null };
  const BOTTOM = { store: null, lines: [
    { raw_text: '3 HEB WHOLE MILK FW 3.70', item_name: 'HEB WHOLE MILK', quantity: null, unit: null, line_total: 3.70, unit_price_printed: null, weighed: false },
  ], printed_subtotal: 4.65 };

  // (a) bottom-only subtotal IS the whole receipt's — single_photo2 + reconcile ok.
  const m = mergeExtractions(TOP, BOTTOM);
  if (m.lines.length !== 3) F('two-photo', `merged lines: ${m.lines.length}, want 3`);
  if (m.lines[0].item_name !== 'CILANTRO' || m.lines[2].item_name !== 'HEB WHOLE MILK') F('two-photo', 'order must be top lines then bottom lines');
  if (m.store !== 'H-E-B') F('two-photo', `store must come from photo 1: ${m.store}`);
  if (m.printed_subtotal !== 4.65 || m.subtotalDecision.mode !== 'single_photo2') F('two-photo', `subtotal decision: ${JSON.stringify(m.subtotalDecision)}`);
  const r = reconcileReceipt(m);
  if (!r || !r.ok) F('two-photo', `whole-receipt reconcile must pass: ${JSON.stringify(r)}`);

  // (b) two PARTIAL subtotals sum to the whole.
  const mB = mergeExtractions({ ...TOP, printed_subtotal: 0.95 }, { ...BOTTOM, printed_subtotal: 3.70 });
  if (mB.printed_subtotal !== 4.65 || mB.subtotalDecision.mode !== 'summed') F('two-photo', `partials must SUM: ${JSON.stringify(mB.subtotalDecision)}`);
  if (!reconcileReceipt(mB).ok) F('two-photo', 'summed reconcile must pass');

  // (c) both present but photo 2 already carries the WHOLE figure — prefer the
  // single real Sale Subtotal over summing (Kevin's rule).
  const mC = mergeExtractions({ ...TOP, printed_subtotal: 0.95 }, { ...BOTTOM, printed_subtotal: 4.65 });
  if (mC.printed_subtotal !== 4.65 || mC.subtotalDecision.mode !== 'single_photo2') F('two-photo', `whole-figure bottom must win: ${JSON.stringify(mC.subtotalDecision)}`);

  // (d) exact duplicate (raw_text AND line_total) dropped ONCE; same name+total
  // with different raw_text is a real second purchase and is kept.
  const dupLine = TOP.lines[1];
  const mD = mergeExtractions(TOP, { ...BOTTOM, lines: [dupLine, ...BOTTOM.lines] });
  if (mD.lines.length !== 3 || mD.subtotalDecision.droppedDuplicates !== 1) F('two-photo', `dup safety net: ${mD.lines.length} lines, dropped ${mD.subtotalDecision.droppedDuplicates}`);
  const mD2 = mergeExtractions(TOP, { ...BOTTOM, lines: [{ ...dupLine, raw_text: '9 GARLIC F 0.50' }, ...BOTTOM.lines] });
  if (mD2.lines.length !== 4) F('two-photo', 'different raw_text must not dedupe');

  // (e) store falls back to photo 2; no subtotal anywhere → reconcile null.
  const mE = mergeExtractions({ ...TOP, store: null }, { ...BOTTOM, store: 'H-MART', printed_subtotal: null });
  if (mE.store !== 'H-MART') F('two-photo', `store fallback: ${mE.store}`);
  if (reconcileReceipt(mE) !== null) F('two-photo', 'no subtotal anywhere must reconcile null');

  // (f) the merged receipt flows through buildReviewPlan like any single scan.
  const p = buildReviewPlan(m, SEED, {});
  if (!allOf(p).length) F('two-photo', 'merged receipt must classify');

  // (g) defensive: merging with a missing second half is harmless (the single-
  // photo path bypasses merge entirely; this pins the degenerate call anyway).
  const mG = mergeExtractions(BOTTOM, null);
  if (mG.lines.length !== 1 || mG.printed_subtotal !== 4.65 || mG.subtotalDecision.mode !== 'single_photo1') F('two-photo', `null second half: ${JSON.stringify(mG.subtotalDecision)}`);
}

// ─── 8. B: post-extraction quantity repair (safety net beneath A) ────────────
{
  // The 4-carton stock line as the photo path ACTUALLY returns it when the
  // small "4 Ea. @ ..." detail is unresolved: quantity null, total only.
  // Pre-repair this derived $2.98/cup (packQty divide with packsBought 1) —
  // 4x high, Kevin's "multiplying the price" report.
  const line = { item_name: 'KITCH BASICS REAL CHKN ST', quantity: null, unit: null, line_total: 11.92, unit_price_printed: null, weighed: false };
  const p = plan([line]);
  const g = p.buckets.matched.find(x => x.ingredientId === 'chicken_stock');
  if (!g) F('qty-repair', `must still alias-match: ${JSON.stringify(allOf(p).map(x => ({ s: x.status, id: x.ingredientId })))}`);
  else {
    if (!near(g.perUnit, 0.745)) F('qty-repair', `perUnit ${g.perUnit}, want 0.745/cup (11.92 = 4 x $2.98 carton)`);
    if (!g.qtyInference || g.qtyInference.qty !== 4 || !near(g.qtyInference.perPack, 2.98)) F('qty-repair', `inference: ${JSON.stringify(g.qtyInference)}`);
    if (g.line.quantity !== 4) F('qty-repair', 'quantity must be back-filled onto the line');
    if (confidenceTier(g, 0.745) !== 'check') F('qty-repair', `inferred qty must cap at check tier, got ${confidenceTier(g, 0.745)}`);
  }

  // A ratio that is NOT a clean integer must never infer.
  const p2 = plan([{ ...line, line_total: 10.40 }]); // 10.40 / 2.98 = 3.49
  const g2 = allOf(p2).find(x => x.ingredientId === 'chicken_stock');
  if (g2 && g2.qtyInference) F('qty-repair', 'ambiguous ratio must NOT infer');

  // n = 1 (one carton, total only) needs no inference; packQty divides as always.
  const p3 = plan([{ ...line, line_total: 2.98 }]);
  const g3 = allOf(p3).find(x => x.ingredientId === 'chicken_stock');
  if (!g3 || !near(g3.perUnit, 0.745) || g3.qtyInference) F('qty-repair', `single carton: ${JSON.stringify(g3 && { p: g3.perUnit, q: g3.qtyInference })}`);

  // No packQty on the alias → never fires (an unlearned pack still ASKS).
  const al = { 'mystery carton': { ingredientId: 'chicken_stock' } };
  const p4 = plan([{ item_name: 'MYSTERY CARTON', quantity: null, unit: null, line_total: 11.92, unit_price_printed: null }], al);
  const g4 = allOf(p4).find(x => x.ingredientId === 'chicken_stock');
  if (g4 && g4.qtyInference) F('qty-repair', 'no packQty must mean no inference');

  // Weighed lines never repair (weight belongs to weightSuggestion).
  const p5 = plan([{ ...line, weighed: true }]);
  const g5 = allOf(p5).find(x => x.ingredientId === 'chicken_stock');
  if (g5 && g5.qtyInference) F('qty-repair', 'weighed lines never infer quantity');
}

// ─── C.2: subtotal capture (Jul 14) ──────────────────────────────────────────
// The verified split scan returned printed_subtotal null on BOTH photos even
// though "Sale Subtotal 195.80" was clearly printed — the reconcile safety net
// never fired and a $5.66 line-sum gap went unflagged. Root cause: the prompt's
// subtotal ask was one buried sentence, directly contradicted by the HARD RULE
// "Exclude subtotals". The fix makes the subtotal a standalone CRITICAL block
// with a subtotal_raw_text echo so a miss is visible. A prompt can't run in the
// gate, so these pins assert the prompt TEXT retains the load-bearing parts —
// if someone rewords the prompt and drops one, this fails.
{
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/utils.js', import.meta.url), 'utf8');
  const pins = [
    ['critical-block', 'CRITICAL — THE PRINTED SUBTOTAL IS A REQUIRED FIELD'],
    ['raw-text-field', '"subtotal_raw_text": <string|null>'],
    ['raw-text-rule', 'subtotal_raw_text must also be null'],
    ['look-again', 'a null subtotal is almost certainly a mistake'],
    ['exclusion-carveout', 'MUST still be captured in printed_subtotal and subtotal_raw_text'],
    ['fallback-chain', '"Total Sale", "Total", "Balance"'],
  ];
  for (const [rule, needle] of pins) {
    if (!src.includes(needle)) F('subtotal-prompt', `prompt lost required text (${rule}): "${needle}"`);
  }
  // The old self-contradiction must stay dead: no bare "Exclude subtotals,"
  // hard rule without the carve-out on the same line.
  const bare = /Exclude subtotals,.*return policy\.\s*$/m.test(src) && !src.includes('does NOT mean ignoring it');
  if (bare) F('subtotal-prompt', 'exclusion hard rule regressed to the bare form that contradicts the subtotal ask');

  // Extractions carrying the new subtotal_raw_text key must flow through
  // merge + reconcile unchanged (consumers only read printed_subtotal).
  const a = { store: 'H-E-B', printed_subtotal: 5.00, subtotal_raw_text: 'Sale Subtotal    5.00',
    lines: [{ raw_text: '1 X', item_name: 'X', quantity: null, unit: null, line_total: 5.00, unit_price_printed: null, tax_flag: 'F', weighed: false }] };
  const b = { store: 'H-E-B', printed_subtotal: null, subtotal_raw_text: null, lines: [] };
  const m = mergeExtractions(a, b);
  if (m.printed_subtotal !== 5.00) F('subtotal-prompt', `merge with raw-text key: subtotal ${m.printed_subtotal} !== 5.00`);
  const r = reconcileReceipt(m);
  if (!r || !r.ok) F('subtotal-prompt', `reconcile with raw-text key must pass: ${JSON.stringify(r)}`);
}

// ─── C.5: user-entered weight → per-unit price (Jul 14) ──────────────────────
// Kevin enters the weight he knows; the app derives the per-unit price he used
// to compute by hand. Pins the doc's canonical case (1 lb 6 oz at $5.98 →
// 1.375 lb → $4.35/lb), the decimal-lb mode, per-oz/per-g ingredient pricing,
// and the fail-closed guards (no weight, no total, non-weight unit → null).
{
  // Canonical: 1 lb 6 oz, $5.98 total, lb-priced ingredient.
  const c = perUnitFromUserWeight({ total: 5.98, lb: 1, oz: 6, ingUnit: 'lb' });
  if (!c || !near(c.weightLb, 1.375) || !near(c.perUnit, 4.349, 0.005)) {
    F('user-weight', `canonical 1lb6oz/$5.98: ${JSON.stringify(c)} (want 1.375 lb, ~$4.349/lb)`);
  }
  // Decimal mode: 2.15 lb printed on the receipt.
  const d = perUnitFromUserWeight({ total: 5.98, decimalLb: 2.15, ingUnit: 'lb' });
  if (!d || !near(d.weightLb, 2.15) || !near(d.perUnit, 2.781, 0.005)) F('user-weight', `decimal 2.15lb: ${JSON.stringify(d)}`);
  // decimalLb, when given, takes precedence over lb+oz (the component passes
  // only the active mode, but the helper's own precedence must be stable).
  const p = perUnitFromUserWeight({ total: 8, lb: 9, oz: 9, decimalLb: 2, ingUnit: 'lb' });
  if (!p || !near(p.weightLb, 2)) F('user-weight', `decimalLb precedence: ${JSON.stringify(p)}`);
  // oz-only split entry (blank lb) works: 8 oz = 0.5 lb.
  const o = perUnitFromUserWeight({ total: 2, oz: 8, ingUnit: 'lb' });
  if (!o || !near(o.weightLb, 0.5) || !near(o.perUnit, 4)) F('user-weight', `oz-only: ${JSON.stringify(o)}`);
  // Ingredient priced per oz gets a per-OZ price: $5.98 / 22 oz.
  const perOz = perUnitFromUserWeight({ total: 5.98, lb: 1, oz: 6, ingUnit: 'oz' });
  if (!perOz || !near(perOz.perUnit, 0.272, 0.005)) F('user-weight', `per-oz pricing: ${JSON.stringify(perOz)}`);
  // Ingredient priced per gram: $5.98 / (1.375 × 453.6 g).
  const perG = perUnitFromUserWeight({ total: 5.98, lb: 1, oz: 6, ingUnit: 'g' });
  if (!perG || !near(perG.perUnit, 0.0096, 0.001)) F('user-weight', `per-g pricing: ${JSON.stringify(perG)}`);
  // Fail closed: zero weight, missing/zero total, negative, non-weight unit.
  if (perUnitFromUserWeight({ total: 5.98, ingUnit: 'lb' }) !== null) F('user-weight', 'zero weight must return null');
  if (perUnitFromUserWeight({ total: null, lb: 1, ingUnit: 'lb' }) !== null) F('user-weight', 'no total must return null');
  if (perUnitFromUserWeight({ total: 0, lb: 1, ingUnit: 'lb' }) !== null) F('user-weight', 'zero total must return null');
  if (perUnitFromUserWeight({ total: 5.98, lb: -2, ingUnit: 'lb' }) !== null) F('user-weight', 'negative weight must return null');
  if (perUnitFromUserWeight({ total: 5.98, lb: 1, ingUnit: 'each' }) !== null) F('user-weight', 'per-each ingredient must return null (weight entry is weight-units only)');
  // Empty-string decimalLb falls through to split mode (UI sends '' when the
  // decimal box is untouched).
  const e = perUnitFromUserWeight({ total: 4, lb: 2, decimalLb: '', ingUnit: 'lb' });
  if (!e || !near(e.weightLb, 2)) F('user-weight', `empty decimalLb must fall through to lb+oz: ${JSON.stringify(e)}`);
}

// ─── C.3: reconcile hard-gates auto-apply (Jul 14) ───────────────────────────
// The real failure this pins: photo 2 read three pork tenderloins at
// $6.62/$6.33/$6.66 instead of $9.33/$9.62/$9.33 — an $8.67 hole. Perfect OCR
// is not achievable; the defense is that a failed reconcile (line sum vs
// printed subtotal) turns auto-accept OFF so misread prices must pass Kevin's
// eyes. Null reconcile (no subtotal at all) keeps prior behavior.
{
  const line = (name, total) => ({ raw_text: name, item_name: name, quantity: null, unit: null, line_total: total, unit_price_printed: null, tax_flag: 'FW', weighed: true });
  // Misread scan: extracted lines sum $19.61, printed subtotal says $28.28.
  const bad = { store: 'H-E-B', printed_subtotal: 28.28, lines: [line('PK NAT BNL TENDERLOIN COV', 6.62), line('PK NAT BNL TENDERLOIN COV', 6.33), line('PK NAT BNL TENDERLOIN COV', 6.66)] };
  const rBad = reconcileReceipt(bad);
  if (!rBad || rBad.ok !== false) F('reconcile-gate', `$8.67 gap must fail the reconcile: ${JSON.stringify(rBad)}`);
  if (autoApplyAllowed(rBad) !== false) F('reconcile-gate', 'failed reconcile must hard-gate auto-apply');
  // Clean scan: sums match — auto-apply allowed.
  const good = { store: 'H-E-B', printed_subtotal: 28.28, lines: [line('PK NAT BNL TENDERLOIN COV', 9.33), line('PK NAT BNL TENDERLOIN COV', 9.62), line('PK NAT BNL TENDERLOIN COV', 9.33)] };
  const rGood = reconcileReceipt(good);
  if (!rGood || rGood.ok !== true) F('reconcile-gate', `matching sums must pass: ${JSON.stringify(rGood)}`);
  if (autoApplyAllowed(rGood) !== true) F('reconcile-gate', 'passing reconcile must allow auto-apply');
  // No subtotal anywhere: reconcile null, prior behavior (auto allowed).
  if (autoApplyAllowed(null) !== true) F('reconcile-gate', 'null reconcile must keep prior behavior');
  // Within tolerance (2% or $1): a $0.90 gap on $28.28 passes.
  const close = { ...good, printed_subtotal: 29.18 };
  if (!reconcileReceipt(close).ok) F('reconcile-gate', 'sub-tolerance gap must still pass (discounts, skipped non-food lines)');
}

// ─── report ──────────────────────────────────────────────────────────────────
if (fails.length) {
  console.error(`RECEIPT SCAN GATE: ${fails.length} FAILURE(S)`);
  for (const f of fails) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log('RECEIPT SCAN GATE: ALL PASS');
