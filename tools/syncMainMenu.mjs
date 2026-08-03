// syncMainMenu.mjs — #2 menu codegen (lean, price-drift killer)
// dishes.js is the single source of truth for PRICES. This tool rewrites every
// price span in main-menu.html from the registry. The invariant suite CATCHES
// drift; this tool FIXES it. Idempotent: running twice changes nothing.
//   node tools/syncMainMenu.mjs          → report drift (exit 1 if any)
//   node tools/syncMainMenu.mjs --write  → rewrite main-menu.html in place
import { readFileSync, writeFileSync } from 'fs';
import { DISHES, ALL_ALWAYS_ITEMS } from '../src/dishes.js';
import { resolveDishVariant } from '../src/dishCosting.js';
import { carlCardSummary } from '../src/carl.js';

// KEPT, NOT FOLDED INTO buildPages.mjs (Jul 2026, page build step). The build
// generates main-menu.html from src/pages/main-menu.page.html, so this tool now
// reads and writes the SOURCE. That matters: if it kept writing the generated
// root file, the two would fight and checkPagesBuilt.mjs would fail on the next
// run. Source in, source out; the build carries the change through.
//
// It stays a separate tool because it does something the build cannot. Cards in
// main-menu.html are PLACED BY HAND under editorial section heads that are
// coarser than canon cuisine, so the card LIST is authored. This tool rewrites
// the FIELDS inside each authored card. Folding it in would mean generating the
// card list, which would throw away that hand-ordering.
const PATH = new URL('../src/pages/main-menu.page.html', import.meta.url).pathname;
let html = readFileSync(PATH, 'utf8');
const write = process.argv.includes('--write');

const attrEsc = (x) => String(x).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const money = (n) => Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
let drift = 0, patched = 0;

// Off-menu dinners: costed and built in the registry, but never rendered on the
// customer menu (mirror of tests/library_sync.mjs OFF_MENU). No card, by design.
// Fesenjan graduated to the live menu Jul 29, so the set is empty. Kept rather
// than deleted: the exemption mechanism is still the right one for the next
// costed-but-unlisted dish, and the three OFF_MENU copies across this file,
// src/menuLibrary.js, and tests/library_sync.mjs are a known duplication.
const OFF_MENU = new Set([
  'Coriander Lamb Steak over Gigantes Beans',
  'Bone-In Pork Rib Chop with All the Fixings',
]);

function cardBounds(name) {
  const tag = `<div class="dish-name">${name}</div>`;
  const start = html.indexOf(tag);
  if (start < 0) return null;
  const next = html.indexOf('<div class="dish-name">', start + tag.length);
  return { start, end: next < 0 ? html.length : next };
}

function syncCard(name, expected) {
  if (OFF_MENU.has(name)) return;
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

// A dish with `priceDisplay` shows a COMPRESSED block — one row per display
// entry, not per variant — so sync against what the card actually shows. The
// invariant checks the same way; without this the tool reports drift forever on
// a card that is correct.
for (const d of DISHES) {
  const priced = (d.priceDisplay && d.priceDisplay.length) ? d.priceDisplay : d.variants;
  syncCard(d.name, priced.map(v => money(v.price)));
}

// ── CATALOG ATTRIBUTE SYNC (Jul 22) ──────────────────────────────────────────
// The catalog page can filter by cuisine and diet, but only if each dish block
// carries that data. The registry already knows both, so stamp them onto the
// wrapping <div class="dish"> rather than hand-maintaining a parallel list.
// Same contract as prices and allergens: report drift, --write to fix,
// idempotent. Diet tokens use the same veg/vegan/pesc logic menu.html filters
// on, so the two surfaces can never disagree about what is vegetarian.
function dietTokens(d) {
  const tag = d.diet;
  if (!tag) return '';
  const labels = (d.variants || []).map(v => v.label);
  const has = (key) => {
    if (tag[key] === true) return labels.length > 0;
    return Array.isArray(tag[key]) && tag[key].length > 0;
  };
  const out = [];
  if (has('veg') || has('vegan') || has('veganOnRequest')) out.push('veg');
  if (has('vegan') || has('veganOnRequest')) out.push('vegan');
  if (has('veg') || has('vegan') || has('veganOnRequest') || has('pesc')) out.push('pesc');
  return out.join(' ');
}

// ── CARL ATTRIBUTE SYNC (Jul 29) ─────────────────────────────────────────────
// Dinners are stamped inside syncAttrs() above, which owns their opening tag.
// What is left here is the ALWAYS-ITEMS pass: syncAttrs only loops DISHES, and
// add-on cards carry no data-name at all, so they are located by walking back
// from their dish-name div instead.
// Same contract as the diet tokens above: the registry already knows the answer,
// so stamp it onto the card rather than hand-maintaining a parallel list. The
// client partial (_partials/carlFilter.js) reads these three attributes and
// contains no allergen logic of its own, deliberately — a second copy of the
// rules on the client is a second copy that can be wrong.
//
//   data-carl        worst-case verdict across the card's variants
//   data-carl-say    the composed yellow line, or absent when nothing changes
//   data-carl-dead   indices of price rows dead for Carl, POSITIONAL against
//                    the card's own price rows. That is the same positional
//                    contract syncCard() uses to rewrite prices, so if one is
//                    right the other is too, and if the card gains a row both
//                    break together instead of one drifting silently.
const carlAttrs = (item) => carlCardSummary(item, resolveDishVariant);

// Walk back from the dish-name div to the <div class="dish" that opens its card.
// Add-on cards are packed several to a line and carry no data-name, so they
// cannot be found the way the dinners are.
function cardOpenTag(name) {
  const tag = `<div class="dish-name">${name}</div>`;
  const at = html.indexOf(tag);
  if (at < 0) return null;
  const open = html.lastIndexOf('<div class="dish"', at);
  if (open < 0) return null;
  const close = html.indexOf('>', open);
  if (close < 0 || close > at) return null;
  return { start: open, end: close + 1, text: html.slice(open, close + 1) };
}

let carlDrift = 0, carlPatched = 0, carlMissing = 0;
function syncCarl(item) {
  if (OFF_MENU.has(item.name)) return;
  const t = cardOpenTag(item.name);
  if (!t) { carlMissing++; return; }   // no card on the catalog; not an error
  const a = carlAttrs(item);

  let tag = t.text
    .replace(/\s+data-carl="[^"]*"/g, '')
    .replace(/\s+data-carl-say="[^"]*"/g, '')
    .replace(/\s+data-carl-dead="[^"]*"/g, '');
  let extra = ` data-carl="${a.verdict}"`;
  if (a.say) extra += ` data-carl-say="${attrEsc(a.say)}"`;
  if (a.dead.length) extra += ` data-carl-dead="${a.dead.join(',')}"`;
  tag = tag.replace(/>$/, extra + '>');

  if (tag === t.text) return;
  carlDrift++;
  console.log(`  carl: ${item.name} -> ${a.verdict}${a.dead.length ? ' (dead rows ' + a.dead.join(',') + ')' : ''}`);
  if (write) { html = html.slice(0, t.start) + tag + html.slice(t.end); carlPatched++; }
}

for (const it of ALL_ALWAYS_ITEMS) syncCarl(it);
if (carlDrift) {
  drift += carlDrift;
  patched += carlPatched;
  console.log(`  carl: ${carlDrift} card(s) ${write ? 'stamped' : 'need stamping'}, ${carlMissing} registry item(s) have no catalog card`);
}

function syncAttrs(d) {
  if (OFF_MENU.has(d.name)) return;
  const b = cardBounds(d.name);
  if (!b) return; // already reported by the price sync
  // The wrapping div sits immediately before the dish-name div.
  const openTagEnd = html.lastIndexOf('<div class="dish"', b.start);
  if (openTagEnd < 0) return;
  const closeIdx = html.indexOf('>', openTagEnd);
  if (closeIdx < 0 || closeIdx > b.start) return;
  const current = html.slice(openTagEnd, closeIdx + 1);
  const diet = dietTokens(d);
  // The Carl attributes are emitted HERE rather than in a second pass. The
  // first version of this used its own pass, and the two fought: syncAttrs
  // rebuilds the whole tag from scratch and dropped data-carl, then the Carl
  // pass put it back, so every run reported drift and the tool stopped being
  // idempotent. One tool, one tag, one write.
  const c = carlAttrs(d);
  const want = `<div class="dish" data-name="${d.name.replace(/"/g, '&quot;')}"`
    + ` data-cuisine="${(d.cuisine || 'Other').replace(/"/g, '&quot;')}"`
    + (diet ? ` data-diet="${diet}"` : '')
    + ` data-carl="${c.verdict}"`
    + (c.say ? ` data-carl-say="${attrEsc(c.say)}"` : '')
    + (c.dead.length ? ` data-carl-dead="${c.dead.join(',')}"` : '')
    + '>';
  if (current === want) return;
  drift++;
  console.log(`  ${d.name}: catalog attributes updated`);
  if (write) { html = html.slice(0, openTagEnd) + want + html.slice(closeIdx + 1); patched++; }
}
for (const d of DISHES) syncAttrs(d);

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
  if (OFF_MENU.has(name)) return;
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

// ── Pairings sync ───────────────────────────────────────────────────────────
// Same contract as allergens: canon lives in dishes.js (copy.pairings), this
// tool renders it into each card. The block sits directly BEFORE the
// Allergens line. A card with no block gets one on --write; drift is replaced
// wholesale. Hand-edits to pairings in main-menu.html will be overwritten —
// edit dishes.js instead.
function pairingsBlock(pairs) {
  const rows = pairs.map(x =>
    `<div class="pairing-row"><b>${x.drink}</b> — ${x.why}</div>`).join('');
  return `<div class="pairings"><div class="pairings-head">Goes well with</div>${rows}</div>`;
}
const pairingsRe = /<div class="pairings">.*?<\/div><\/div>/s;
function syncPairings(name, pairs) {
  if (OFF_MENU.has(name)) return;
  if (!pairs || !pairs.length) return;
  const b = cardBounds(name);
  if (!b) return;
  let seg = html.slice(b.start, b.end);
  const want = pairingsBlock(pairs);
  const m = seg.match(pairingsRe);
  if (m && m[0] === want) return;
  drift++;
  console.log(`  ${name} pairings: ${m ? 'stale' : 'MISSING'} → ${pairs.length} drinks`);
  if (write) {
    if (m) seg = seg.replace(pairingsRe, want);
    else seg = seg.replace(/<div class="contains">/, want + '<div class="contains">');
    html = html.slice(0, b.start) + seg + html.slice(b.end);
    patched++;
  }
}
for (const d of DISHES) syncPairings(d.name, d.copy ? d.copy.pairings : null);

// ── SECTION MEMBERSHIP CHECK (Jul 18) ────────────────────────────────────────
// Cards are placed by hand in main-menu.html, and nothing stopped a dinner from
// landing under the wrong sub-head. Two shipped that way: the Tea-Smoked Chicken
// and the base Pork Chop both sat under "Spotlight Dinners" despite canon
// cuisine 'American'. The gate stayed green because every OTHER check finds a
// card by name, not by position.
//
// The section taxonomy in main-menu.html is coarser than canon cuisine (one
// "American / Southern / Tex-Mex" head covers three cuisines; "Curry" and
// "East Asian" split the Asian dishes editorially). So this does NOT try to map
// every cuisine to a section. It enforces the one rule that actually broke and
// is unambiguous: cuisine 'Spotlight' <=> under the "Spotlight Dinners" head,
// and nothing else may sit there. That catches both real bugs; finer section
// rules can be added if a real case ever needs them.
function sectionOf(name) {
  const tag = `<div class="dish-name">${name}</div>`;
  const at = html.indexOf(tag);
  if (at < 0) return null;
  const heads = [...html.slice(0, at).matchAll(/<div class="section-(?:sub-)?head">([^<]+)<\/div>/g)];
  return heads.length ? heads[heads.length - 1][1].trim() : null;
}
const SPOTLIGHT_HEAD = 'Spotlight Dinners';
for (const d of DISHES) {
  if (!cardBounds(d.name)) continue; // MISSING already reported
  const sec = sectionOf(d.name);
  const isSpotlightDish = d.cuisine === 'Spotlight';
  const inSpotlightSection = sec === SPOTLIGHT_HEAD;
  if (isSpotlightDish && !inSpotlightSection) {
    console.log(`  ${d.name}: canon cuisine 'Spotlight' but sits under "${sec}" — move to Spotlight Dinners (by hand)`);
    drift++;
  } else if (!isSpotlightDish && inSpotlightSection) {
    console.log(`  ${d.name}: under "Spotlight Dinners" but canon cuisine is '${d.cuisine}' — not a spotlight dish, move it out (by hand)`);
    drift++;
  }
}

// SCOPE: dinners + card-style bag items only. Veg/add-on SECTIONS use a
// different HTML shape (no dish-name divs) — the invariant suite still guards
// their prices; this tool reports them as out-of-scope instead of failing.
const CARDLESS = new Set(['Homemade Waffles', 'Carrots', 'Baby Gold Potatoes', 'Corn (off the cob)', 'Kabocha Squash', 'Parsnips', 'Asparagus', 'Garlic Confit', 'Pecan Mole-Fesenjan, Beef and Kabocha']);
// GRADE TIERS render as sub-lines inside their parent steak's card rather than
// getting their own, so they are cardless for the card sync — but the price on
// that sub-line still has to be checked, or it drifts from canon silently.
//
// Prime was the only tier until grass fed arrived on Jul 30. The suffix was
// hardcoded here, in menu.page.html's merge, and in menu.page.html's row
// renderer. One list now; adding a tier means adding a string.
const GRADE_TIERS = ['Prime', 'Grass Fed'];
const tierRe = new RegExp(`^(.*) - (${GRADE_TIERS.join('|')})$`);
for (const b of (ALL_ALWAYS_ITEMS || [])) {
  const pm = tierRe.exec(b.name);
  if (pm && b.perLb) {
    CARDLESS.add(b.name);
    const parent = pm[1];
    const tier = pm[2];
    const bnds = cardBounds(parent);
    const wantLine = `<span class="price-label">${tier}, by weight</span><div class="price-right"><span class="price-amt">${money(b.pricePerLb)}/lb + $2.00 bag</span>`;
    if (!bnds) { console.log(`  MISSING parent card for ${tier}: ${parent}`); drift++; }
    else if (!html.slice(bnds.start, bnds.end).includes(wantLine)) {
      console.log(`  ${tier} sub-line missing or drifted on ${parent}: expected ${money(b.pricePerLb)}/lb`);
      drift++;
    }
  }
}
for (const b of (ALL_ALWAYS_ITEMS || [])) {
  if (CARDLESS.has(b.name)) continue;
  if (b.perLb) syncCard(b.name, [`${money(b.pricePerLb)}/lb + $2.00 bag`]);
  else if (b.priceDisplay && b.priceDisplay.length) syncCard(b.name, b.priceDisplay.map(v => money(v.price)));
  else if (b.variants && b.variants.length) syncCard(b.name, b.variants.map(v => money(v.price)));
}

if (write && patched) { writeFileSync(PATH, html); console.log(`WROTE src/pages/main-menu.page.html (${patched} cards patched) — run tools/buildPages.mjs --write to carry it into main-menu.html`); }
else if (drift) { console.log(`${drift} drift(s) found${write ? '' : ' — run with --write to fix'}`); process.exit(1); }
else console.log('main-menu.html prices and allergen lines in sync with dishes.js ✓');
