// Shopping-list consolidation + ounce normalization (Jul 13).
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS: Kevin's list showed the same grocery item on multiple
// lines — "16 cups chicken stock" next to "1 lb Kitchen Basics chicken
// stock", and 14oz cans of tomatoes that couldn't sum with 28oz cans. The
// fix canonicalized names in dishes.js and taught the aggregation layer
// three things: NNoz-can units resolve to ounces, bare ounces fold into
// whichever family the same ingredient already uses, and volume renders in
// ounces by default. This suite pins the exact reported cases plus the
// invariants that must NOT regress (family separation, composite
// passthrough, butter-to-sticks, idempotency, and both aggregation paths
// agreeing with each other).
//
// Run:  node tests/shopping_merge.mjs
// ═══════════════════════════════════════════════════════════════════════════
import { mergeShoppingRows, parseShoppingLine, generateShoppingItems } from '../src/recipes.js';

let fails = 0;
const F = (tag, msg) => { fails++; console.error(`  ✗ FAIL [${tag}] ${msg}`); };
const row = (id, text, checked = false) => ({ id, text, checked });
const texts = (rows) => rows.map(r => r.text);

// ─── 1. Tomato cans: 3 × 14oz + 0.5 × 28oz = 56 oz, ONE row ────────────────
{
  const m = mergeShoppingRows([
    row('a', '3 14oz can Canned tomatoes'),
    row('b', '0.5 28oz can Canned tomatoes'),
  ]);
  if (m.length !== 1) F('cans', `want 1 row, got ${m.length}: ${JSON.stringify(texts(m))}`);
  else if (!/^Canned tomatoes — 56 oz$/.test(m[0].text)) F('cans', `want "Canned tomatoes — 56 oz", got "${m[0].text}"`);
}

// ─── 1b. Can-size parsing handles both spacings and generator format ────────
{
  const a = parseShoppingLine('Canned tomatoes — 2 14oz can');
  if (!(a.qty === 28 && a.unit === 'oz')) F('can-parse', `format A: ${JSON.stringify(a)}`);
  const b = parseShoppingLine('1 28 oz can Canned tomatoes');
  if (!(b.qty === 28 && b.unit === 'oz' && b.name === 'Canned tomatoes')) F('can-parse', `spaced format B: ${JSON.stringify(b)}`);
  // "small can" has no stated size — stays an opaque count, never fabricates oz
  const c = parseShoppingLine('Tomato paste — 1 small can');
  if (!(c.qty === 1 && c.unit === 'small can')) F('can-parse', `small can must stay opaque: ${JSON.stringify(c)}`);
}

// ─── 2. Stock: cups + oz fold, ONE row, rendered in oz ──────────────────────
{
  const m = mergeShoppingRows([
    row('a', 'Chicken stock — 4 cups'),
    row('b', 'Chicken stock — 32 oz'),
  ]);
  if (m.length !== 1) F('stock', `want 1 row, got ${m.length}: ${JSON.stringify(texts(m))}`);
  else if (!/^Chicken stock — 64 oz$/.test(m[0].text)) F('stock', `want "Chicken stock — 64 oz", got "${m[0].text}"`);
}

// ─── 3. Volume ≥ 2 oz renders oz; tiny amounts keep tbs/tsp ─────────────────
{
  const m = mergeShoppingRows([row('a', 'Heavy cream — 0.5 cup')]); // 4 oz
  if (!/^Heavy cream — 4 oz$/.test(m[0].text)) F('oz-render', `0.5 cup must render 4 oz: "${m[0].text}"`);
  const t = mergeShoppingRows([row('a', 'Vanilla — 1 tsp')]);
  if (!/^Vanilla — 1 tsp$/.test(t[0].text)) F('oz-render', `tiny stays tsp: "${t[0].text}"`);
  const tb = mergeShoppingRows([row('a', 'Soy sauce — 2 tbs')]); // 1 oz — under the 2 oz line
  if (!/^Soy sauce — 2 tbs$/.test(tb[0].text)) F('oz-render', `sub-2oz stays tbs: "${tb[0].text}"`);
}

// ─── 4. Composite/bundled entries never merge, pass through unchanged ───────
{
  const m = mergeShoppingRows([
    row('a', 'Sugar + karo + cocoa + vanilla — 1 batch'),
    row('b', 'Brown + white sugar — 1 batch'),
  ]);
  if (m.length !== 2) F('composite', `bundles must stay distinct rows: ${JSON.stringify(texts(m))}`);
  if (!texts(m).includes('Sugar + karo + cocoa + vanilla — 1 batch')) F('composite', `bundle text must survive verbatim: ${JSON.stringify(texts(m))}`);
}

// ─── 5. Families never cross-merge ──────────────────────────────────────────
{
  // Different ingredients, different families: trivially distinct.
  const m = mergeShoppingRows([row('a', 'Flour — 2 cup'), row('b', 'Pork shoulder — 2 lb')]);
  if (m.length !== 2) F('families', `cup item and lb item must stay distinct: ${JSON.stringify(texts(m))}`);
  // SAME ingredient in cups and in lb: volume and heavy weight stay separate.
  const f = mergeShoppingRows([row('a', 'Flour — 1 lb'), row('b', 'Flour — 2 cup')]);
  if (f.length !== 2) F('families', `same-name vol and wt must NOT cross-merge: ${JSON.stringify(texts(f))}`);
}

// ─── 6. Bare oz still folds into lb when lb exists (thighs regression) ──────
{
  const m = mergeShoppingRows([row('a', 'Chicken thighs — 2 lb'), row('b', '8 oz Chicken thighs')]);
  if (m.length !== 1) F('oz-fold', `lb+oz must combine: ${JSON.stringify(texts(m))}`);
  else if (!/^Chicken thighs — 2.5 lb$/.test(m[0].text)) F('oz-fold', `want 2.5 lb, got "${m[0].text}"`);
}

// ─── 7. Butter folds to sticks across sticks, tbs, and oz ───────────────────
{
  const m = mergeShoppingRows([
    row('a', 'Butter — 2 sticks'),
    row('b', 'Butter — 4 tbs'),   // 0.5 stick
    row('c', 'Butter — 4 oz'),    // 1 stick
  ]);
  if (m.length !== 1) F('butter', `butter must fold to one stick row: ${JSON.stringify(texts(m))}`);
  else if (!/^Butter — 3.5 sticks$/.test(m[0].text)) F('butter', `want 3.5 sticks, got "${m[0].text}"`);
}

// ─── 8. Idempotency: merging a merged list changes nothing ──────────────────
{
  const once = mergeShoppingRows([
    row('a', '3 14oz can Canned tomatoes'),
    row('b', '0.5 28oz can Canned tomatoes'),
    row('c', 'Chicken stock — 4 cups'),
    row('d', 'Chicken stock — 32 oz'),
    row('e', 'Butter — 2 sticks'),
    row('f', 'Butter — 4 tbs'),
    row('g', 'grab extra napkins'),
  ]);
  const twice = mergeShoppingRows(once);
  if (JSON.stringify(texts(twice)) !== JSON.stringify(texts(once))) {
    F('idempotent', `re-merge must be a no-op:\n    once:  ${JSON.stringify(texts(once))}\n    twice: ${JSON.stringify(texts(twice))}`);
  }
}

// ─── 9. Generator path agrees: Brunswick + Indian Curry consolidate ─────────
// Brunswick Stew carries stock in CUPS and tomatoes in a 14oz can; Indian
// Style Curry carries stock in OZ (the ex-Kitchen-Basics line) and tomatoes
// in a 28oz can. One order of each must yield ONE stock line and ONE tomato
// line, both in oz — the exact split Kevin reported from the store.
{
  const orders = [
    { status: 'Ordered', items: [{ name: 'Brunswick Stew', variant: 'Small (~4)', qty: 1 }] },
    { status: 'Ordered', items: [{ name: 'Indian Style Curry', variant: 'Chickpea, Large (~8-10)', qty: 1 }] },
  ];
  const lines = generateShoppingItems(orders, false);
  const stock = lines.filter(x => /chicken stock/i.test(x));
  if (stock.length !== 1) F('generator', `want 1 stock line, got ${stock.length}: ${JSON.stringify(stock)}`);
  // Brunswick Small: 4 cups = 32 oz; Curry Large: 32 oz → 64 oz total
  else if (!/^Chicken stock — 64 oz$/.test(stock[0])) F('generator', `want "Chicken stock — 64 oz", got "${stock[0]}"`);
  const toms = lines.filter(x => /^Canned tomatoes/.test(x));
  if (toms.length !== 1) F('generator', `want 1 canned-tomato line, got ${toms.length}: ${JSON.stringify(toms)}`);
  // Brunswick: 1 × 14oz; Curry: 1 × 28oz → 42 oz total
  else if (!/^Canned tomatoes — 42 oz$/.test(toms[0])) F('generator', `want "Canned tomatoes — 42 oz", got "${toms[0]}"`);
  // Crushed tomatoes must NOT be swept into the canned key (Kevin: real
  // product difference at the store) — assert the name stays distinct.
  const crushedMerged = mergeShoppingRows([row('a', 'Crushed tomatoes — 1 can'), row('b', '1 28oz can Canned tomatoes')]);
  if (crushedMerged.length !== 2) F('generator', `crushed and canned tomatoes must stay separate: ${JSON.stringify(texts(crushedMerged))}`);
}

// ─── 10. Old names typed by hand still land in the canonical bucket ─────────
{
  const m = mergeShoppingRows([
    row('a', 'Kitchen Basics chicken stock — 32 oz'),
    row('b', 'Chicken stock — 4 cups'),
  ]);
  if (m.length !== 1) F('synonyms', `old stock name must merge via synonyms: ${JSON.stringify(texts(m))}`);
  const t = mergeShoppingRows([
    row('a', 'Canned peeled tomatoes — 14 oz'),
    row('b', 'Canned tomatoes — 28 oz'),
  ]);
  if (t.length !== 1) F('synonyms', `old peeled-tomato name must merge via synonyms: ${JSON.stringify(texts(t))}`);
}

if (fails) {
  console.error(`\nshopping_merge: ${fails} FAILURE${fails === 1 ? '' : 'S'}`);
  process.exit(1);
}
console.log('shopping_merge: all green');
