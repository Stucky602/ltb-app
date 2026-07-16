// syncMainMenu.mjs — #2 menu codegen (lean, price-drift killer)
// dishes.js is the single source of truth for PRICES. This tool rewrites every
// price span in main-menu.html from the registry. The invariant suite CATCHES
// drift; this tool FIXES it. Idempotent: running twice changes nothing.
//   node tools/syncMainMenu.mjs          → report drift (exit 1 if any)
//   node tools/syncMainMenu.mjs --write  → rewrite main-menu.html in place
import { readFileSync, writeFileSync } from 'fs';
import { DISHES, ALL_ALWAYS_ITEMS } from '../src/dishes.js';

const PATH = new URL('../main-menu.html', import.meta.url).pathname;
let html = readFileSync(PATH, 'utf8');
const write = process.argv.includes('--write');

const money = (n) => Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
let drift = 0, patched = 0;

function cardBounds(name) {
  const tag = `<div class="dish-name">${name}</div>`;
  const start = html.indexOf(tag);
  if (start < 0) return null;
  const next = html.indexOf('<div class="dish-name">', start + tag.length);
  return { start, end: next < 0 ? html.length : next };
}

function syncCard(name, expected) {
  const b = cardBounds(name);
  if (!b) { console.log(`  MISSING card: ${name}`); drift++; return; }
  let seg = html.slice(b.start, b.end);
  const spanRe = /<span class="price-amt">([^<]*)<\/span>/g;
  const found = [...seg.matchAll(spanRe)];
  if (found.length < expected.length) {
    console.log(`  ${name}: only ${found.length} price spans for ${expected.length} registry variants — fix by hand`);
    drift++; return;
  }
  // A card's own prices always come first within its bounds; extra spans
  // belong to sectioned items (veg lists) that follow without dish-name divs.
  let i = 0, changed = false;
  seg = seg.replace(spanRe, (m, cur) => {
    if (i >= expected.length) return m; // past this card's own prices
    const want = expected[i++];
    if (cur.trim() === want) return m;
    changed = true; drift++;
    console.log(`  ${name}: "${cur.trim()}" → "${want}"`);
    return `<span class="price-amt">${want}</span>`;
  });
  if (changed && write) { html = html.slice(0, b.start) + seg + html.slice(b.end); patched++; }
}

for (const d of DISHES) syncCard(d.name, d.variants.map(v => money(v.price)));

// ── ALLERGEN LINE SYNC (Jul 16) ──────────────────────────────────────────────
// copy.contains in the registry is the canon for the customer allergen claim.
// Unlike desc/reheat — which main-menu deliberately adapts (condensed reheats,
// catalog-voice descriptions) — the allergen line has ZERO legitimate variance
// between surfaces. The Jul 16 audit found main-menu telling tofu customers
// the Chinese Broccoli dish was shellfish-free while menu.html correctly
// warned about the oyster sauce in the base. That class of drift ends here.
// Same contract as prices: report drift, --write to fix, idempotent.
const containsRe = /<div class="contains">Allergens: ([^<]*)<\/div>/;
function syncContains(name, want) {
  if (want == null) return; // dish without a contains canon: nothing to hold
  const b = cardBounds(name);
  if (!b) return; // MISSING card already reported by the price sync above
  let seg = html.slice(b.start, b.end);
  const m = seg.match(containsRe);
  if (!m) {
    console.log(`  ${name}: card has no "Allergens:" line — add one by hand, then --write keeps it`);
    drift++; return;
  }
  if (m[1] === want) return;
  drift++;
  console.log(`  ${name} allergens: "${m[1].slice(0, 60)}${m[1].length > 60 ? '...' : ''}" → "${want.slice(0, 60)}${want.length > 60 ? '...' : ''}"`);
  if (write) {
    seg = seg.replace(containsRe, `<div class="contains">Allergens: ${want}</div>`);
    html = html.slice(0, b.start) + seg + html.slice(b.end);
    patched++;
  }
}
for (const d of DISHES) syncContains(d.name, d.copy ? d.copy.contains : null);

// SCOPE: dinners + card-style bag items only. Veg/add-on SECTIONS use a
// different HTML shape (no dish-name divs) — the invariant suite still guards
// their prices; this tool reports them as out-of-scope instead of failing.
const CARDLESS = new Set(['Homemade Waffles', 'Carrots', 'Baby Gold Potatoes', 'Corn (off the cob)', 'Kabocha Squash', 'Parsnips', 'Asparagus', 'Garlic Confit']);
// Prime steaks render as a sub-line inside their parent steak's card (not their
// own card), so they're cardless for the card sync — but we still verify the
// Prime price appears correctly, guarding against drift on that sub-line.
for (const b of (ALL_ALWAYS_ITEMS || [])) {
  const pm = /^(.*) - Prime$/.exec(b.name);
  if (pm && b.perLb) {
    CARDLESS.add(b.name);
    const parent = pm[1];
    const bnds = cardBounds(parent);
    const wantLine = `<span class="price-label">Prime, by weight</span><div class="price-right"><span class="price-amt">${money(b.pricePerLb)}/lb + $2.00 bag</span>`;
    if (!bnds) { console.log(`  MISSING parent card for Prime: ${parent}`); drift++; }
    else if (!html.slice(bnds.start, bnds.end).includes(wantLine)) {
      console.log(`  Prime sub-line drift on ${parent}: expected ${money(b.pricePerLb)}/lb`);
      drift++;
    }
  }
}
for (const b of (ALL_ALWAYS_ITEMS || [])) {
  if (CARDLESS.has(b.name)) continue;
  if (b.perLb) syncCard(b.name, [`${money(b.pricePerLb)}/lb + $2.00 bag`]);
  else if (b.variants && b.variants.length) syncCard(b.name, b.variants.map(v => money(v.price)));
}

if (write && patched) { writeFileSync(PATH, html); console.log(`WROTE main-menu.html (${patched} cards patched)`); }
else if (drift) { console.log(`${drift} drift(s) found${write ? '' : ' — run with --write to fix'}`); process.exit(1); }
else console.log('main-menu.html prices and allergen lines in sync with dishes.js ✓');
