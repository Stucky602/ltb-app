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

  // The stock line is a WEAK name ("REAL CHKN ST") — it must land in review
  // (ask Kevin), never silently matched, with Kitchen Basics offered.
  const ps = plan([{ item_name: 'KITCH BASICS REAL CHKN ST', quantity: 4, unit: 'Ea', line_total: 11.92, unit_price_printed: null }]);
  if (ps.buckets.matched.length) F('bug1', 'weak stock name must not auto-match');
  const rg = ps.buckets.review[0];
  if (!rg || !rg.candidates.some(c => c.id === 'chicken_basics_stock')) F('bug1', `stock review candidates: ${JSON.stringify(rg && rg.candidates.map(c => c.id))}`);

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
  const p = plan([{ item_name: 'JUMBO RED ONION', quantity: 2, unit: 'Ea', unit_price_printed: 2.99, line_total: 5.98 }]);
  const g = p.buckets.matched.find(x => x.ingredientId === 'red_onion');
  if (!g) F('bug3', `jumbo red onion not matched: ${JSON.stringify(allOf(p).map(x => ({ s: x.status, id: x.ingredientId })))}`);
  else {
    if (!near(g.perUnit, 3.518, 0.01)) F('bug3', `perUnit ${g.perUnit}, want 2.99/0.85 ≈ 3.52/lb — not $2.99/each`);
    if (g.basis !== 'converted' || !g.conversion || g.conversion.toUnit !== 'lb') F('bug3', `must record a per-lb conversion: ${JSON.stringify({ b: g.basis, c: g.conversion })}`);
  }
  // Photo shape: qty + total only — total_div_qty now rides the same bridge.
  const p2 = plan([{ item_name: 'JUMBO RED ONION', quantity: 2, unit: null, line_total: 5.98, unit_price_printed: null }]);
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

// ─── report ──────────────────────────────────────────────────────────────────
if (fails.length) {
  console.error(`RECEIPT SCAN GATE: ${fails.length} FAILURE(S)`);
  for (const f of fails) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log('RECEIPT SCAN GATE: ALL PASS');
