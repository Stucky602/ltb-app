// tests/library_sync.mjs — every dish in the registry must have customer-facing
// copy in menu.html's LIBRARY, and every LIBRARY entry must name a real dish.
//
// WHY THIS EXISTS
//
// `tools/syncMainMenu.mjs` guards PRICES in main-menu.html. Nothing guarded
// COPY in menu.html. The two files are hand-edited together every time a dish
// is built, which means the failure mode is simply forgetting one of them:
// a dish ships, appears on the weekly menu, and has no description under it.
// No test fails, because no test looks. The Orecchiette build (Jul 2026) was
// exactly this shape — both files edited by hand, nothing checking they agree.
//
// CHECK-ONLY, no --write. syncMainMenu can rewrite prices because a price is
// derivable from the registry: dishes.js knows the number. A description is
// prose Kevin writes; there is nothing to generate it FROM. A --write here
// could only ever insert a placeholder, and a placeholder that satisfies the
// gate is worse than a failure, because it ships silently.
//
// It lives in tests/ rather than tools/ for the same reason: tools/ in this
// repo means "codegen that can fix the thing it checks." This can't fix
// anything. It can only tell Kevin what to write.
//
// WHAT COUNTS AS PRESENT
//   desc   — required, non-empty. This is the dish's whole pitch.
//   reheat — required, non-empty for dinners. The reheat instructions ARE the
//            product: LTB sells food that reheats well, and a dinner with no
//            reheat copy is a dish the customer doesn't know how to finish.
//            Add-ons and sauces don't need one (nothing to reheat).
// `contains` is deliberately NOT required. An empty allergen string is a
// legitimate answer (see the syrups), and a gate that forces the field would
// pressure someone into typing something to make it pass. Allergen accuracy is
// tests/allergens.mjs's job, against the recipe rather than the prose.
//
// ── MATCH LAYER (Jul 16) — presence was never the real failure mode ─────────
// The Brunswick drift (Jul 15) proved it: all three surfaces HAD text, just
// three different texts, and the presence check above was green the whole
// time. So dinners now carry a `copy:` canon in the registry (dishes.js),
// and this gate's second job is equality: every LIBRARY dinner field
// (desc / reheat / contains / note / spice) must match the canon VERBATIM.
// Edit the canon in dishes.js; menu.html must be updated to agree or the
// build fails. There is no --write for menu.html: the LIBRARY blob is a
// hand-owned single-line JSON literal, and a serializer that rewrites it is
// a bigger hazard than a red test that says exactly what to paste where.
//
// The canon also has to agree with the IN-APP cook card. For dishes with
// stewVegCopy (the Boeuf/Leblanc/Brunswick two-part pattern), the customer
// reheat canon must CONTAIN stewVegCopy.main and .veg verbatim — that link
// is precisely what drifted in the Brunswick incident.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DISHES, ALL_ALWAYS_ITEMS } from '../src/dishes.js';

const PATH = new URL('../menu.html', import.meta.url).pathname;
const html = readFileSync(PATH, 'utf8');

// The LIBRARY is a single-line JSON object literal assigned to `var LIBRARY`.
// Slice from the brace to the terminating `};` and parse it, rather than
// regexing at the copy — a description containing a brace shouldn't break this.
const start = html.indexOf('var LIBRARY = ');
assert.ok(start >= 0, '[library-sync] could not find `var LIBRARY = ` in menu.html — did the file structure change?');
const braceAt = html.indexOf('{', start);
const endAt = html.indexOf('};', braceAt);
assert.ok(endAt > braceAt, '[library-sync] could not find the end of the LIBRARY object in menu.html');

let LIBRARY;
try {
  LIBRARY = JSON.parse(html.slice(braceAt, endAt + 1));
} catch (e) {
  assert.fail(`[library-sync] LIBRARY in menu.html is not parseable JSON: ${e.message}`);
}

// Copy sections keyed by dish name. `static` holds page furniture (the intro,
// the bagged-dish note) rather than dishes, so it is not a lookup source.
const SECTIONS = ['dinners', 'addons', 'bag', 'sauces'];
const entries = new Map();
for (const section of SECTIONS) {
  for (const [name, copy] of Object.entries(LIBRARY[section] || {})) {
    entries.set(name, { copy, section });
  }
}

// ── EXEMPTIONS ─────────────────────────────────────────────────────────────
// Every entry here needs a reason. "It was failing" is not a reason: an
// exemption is a promise that the dish is fine, and a wrong one turns this
// gate into decoration.
//
// Prime steaks render as a SUB-LINE inside their parent steak's card
// ("Prime, by weight"), not as their own card, so they share the parent's
// description and reheat copy. tools/syncMainMenu.mjs treats them as CARDLESS
// for exactly this reason; this is the same fact seen from the copy side.
// Matched by pattern rather than listed, so a fourth Prime cut inherits it.
const isPrimeSubline = (name) => / - Prime$/.test(name);

// Registry items that are deliberately not on the customer menu. These are
// real dishes Kevin makes and costs, but menu.html never renders them, so
// there is nothing for a description to describe.
const OFF_MENU = new Set([
  'Homemade Waffles', // breakfast item, costed in the app, never listed on menu.html
]);

const exempt = (name) => isPrimeSubline(name) || OFF_MENU.has(name);

const missing = [];
const thin = [];

const check = (name, { needsReheat }) => {
  if (exempt(name)) return;
  const hit = entries.get(name);
  if (!hit) {
    missing.push(`${name}  — no LIBRARY entry at all; this dish would ship with no description`);
    return;
  }
  const { copy } = hit;
  if (!copy.desc || !String(copy.desc).trim()) {
    thin.push(`${name}  — LIBRARY entry exists but its desc is empty`);
  }
  if (needsReheat && (!copy.reheat || !String(copy.reheat).trim())) {
    thin.push(`${name}  — no reheat copy; the customer gets the food and no idea how to finish it`);
  }
};

// Dinners: the full treatment.
for (const d of DISHES) check(d.name, { needsReheat: true });

// Always-available items. Sauces and cut fruit have nothing to reheat; the
// sous vide bag items very much do, and their reheat copy is the product.
for (const item of (ALL_ALWAYS_ITEMS || [])) {
  const hit = entries.get(item.name);
  const section = hit ? hit.section : null;
  check(item.name, { needsReheat: section === 'bag' });
}

// ── MATCH LAYER — LIBRARY must equal the registry canon, field by field ─────
const mismatched = [];
const COPY_FIELDS = ['desc', 'reheat', 'contains', 'note', 'spice'];
// pairings is an ARRAY of {drink, why}, so it gets deep-compared below rather
// than string-compared with the fields above. Same verbatim rule: canon in
// dishes.js, LIBRARY mirrors it exactly.

const shorten = (s) => {
  const t = String(s == null ? '<absent>' : s);
  return t.length > 90 ? t.slice(0, 87) + '...' : t;
};

for (const d of DISHES) {
  if (exempt(d.name)) continue;
  if (!d.copy || typeof d.copy !== 'object') {
    mismatched.push(`${d.name}  — dish has no copy: canon in dishes.js; the gate has nothing to hold menu.html to`);
    continue;
  }
  const hit = entries.get(d.name);
  if (!hit) continue; // the presence layer above already reports this
  for (const f of COPY_FIELDS) {
    const canon = d.copy[f];
    const lib = hit.copy[f];
    // note/spice are optional: absent on both sides is agreement.
    if (canon == null && lib == null) continue;
    if (canon !== lib) {
      mismatched.push(
        `${d.name} . ${f}\n      canon (dishes.js): ${shorten(canon)}\n      LIBRARY (menu.html): ${shorten(lib)}`
      );
    }
  }
  // pairings: deep equality, since it's structured.
  {
    const canon = d.copy.pairings;
    const lib = hit.copy.pairings;
    if (!(canon == null && lib == null) && JSON.stringify(canon) !== JSON.stringify(lib)) {
      mismatched.push(
        `${d.name} . pairings\n      canon (dishes.js): ${shorten(JSON.stringify(canon))}\n      LIBRARY (menu.html): ${shorten(JSON.stringify(lib))}`
      );
    }
  }
  // In-app card link. The Brunswick failure was structural: a two-part dish
  // (container + sous vide bag) whose customer copy said "comes in a
  // container" and never mentioned the bag. The customer reheat is allowed
  // to CONDENSE the in-app stewVegCopy (Leblanc and Boeuf both do, on
  // purpose), so this is not a verbatim check — it asserts the customer
  // copy agrees the dish is two-part and involves a bag. Generic
  // one-container copy on a stewVegCopy dish fails.
  if (d.stewVegCopy) {
    const r = String(d.copy.reheat || '').toLowerCase();
    if (!r.includes('two parts') || !r.includes('bag')) {
      mismatched.push(
        `${d.name} . stewVegCopy\n      this is a two-part dish (stewVegCopy present) but copy.reheat never says so — the exact Brunswick failure`
      );
    }
  }
}

assert.equal(
  mismatched.length, 0,
  `[library-sync] ${mismatched.length} cop(ies) disagree with the registry canon:\n\n    ` +
  mismatched.join('\n\n    ') +
  '\n\n  The canon in src/dishes.js (copy:) is the source of truth. Fix the canon\n' +
  '  if it is wrong, then paste the canon text into menu.html LIBRARY so the\n' +
  '  surfaces agree. Never fix menu.html alone.\n'
);

// Orphans: copy for a dish that no longer exists. Not a shipping hazard the
// way a missing entry is (nothing renders it), but it is how menu.html rots —
// and an orphan is often a rename where the new name silently lost its copy.
const known = new Set([
  ...DISHES.map(d => d.name),
  ...(ALL_ALWAYS_ITEMS || []).map(i => i.name),
]);
const orphans = [...entries.keys()].filter(n => !known.has(n));

assert.equal(
  missing.length, 0,
  `[library-sync] ${missing.length} dish(es) in the registry have no LIBRARY entry in menu.html:\n\n    ` +
  missing.join('\n    ') +
  '\n\n  Add copy to the LIBRARY blob in menu.html. This cannot be auto-generated:\n' +
  '  descriptions are prose, and a placeholder that passes the gate is worse\n' +
  '  than a red test.\n'
);

assert.equal(
  thin.length, 0,
  `[library-sync] ${thin.length} LIBRARY entr(ies) are present but incomplete:\n\n    ` +
  thin.join('\n    ') + '\n'
);

assert.equal(
  orphans.length, 0,
  `[library-sync] ${orphans.length} LIBRARY entr(ies) name a dish that is not in the registry:\n\n    ` +
  orphans.join('\n    ') +
  '\n\n  Either the dish was removed (delete the copy) or renamed (move the copy\n' +
  '  to the new name — otherwise the new name has no description).\n'
);

// An exemption that stops matching is worse than no exemption: it silently
// widens to cover nothing while still reading like a promise that the dish is
// handled. If a Prime cut is renamed or Waffles is finally put on the menu,
// this fires and someone re-reads the reasons above.
const allNames = [...DISHES.map(d => d.name), ...(ALL_ALWAYS_ITEMS || []).map(i => i.name)];
const primeHits = allNames.filter(isPrimeSubline);
assert.ok(primeHits.length > 0,
  '[library-sync] the " - Prime" exemption no longer matches any item. Either the Prime ' +
  'cuts were renamed (update the pattern) or removed (delete the exemption).');
for (const name of OFF_MENU) {
  assert.ok(allNames.includes(name),
    `[library-sync] OFF_MENU exempts '${name}', which is no longer in the registry. Delete the exemption.`);
  assert.ok(!entries.has(name),
    `[library-sync] OFF_MENU exempts '${name}' as "never on the customer menu", but it now HAS LIBRARY copy. ` +
    'It is on the menu after all — remove the exemption so its copy is actually checked.');
}

console.log(`[library-sync] ${DISHES.length} dinners + ${(ALL_ALWAYS_ITEMS || []).length} always-items have LIBRARY copy, and all dinner copy matches the registry canon (${primeHits.length} Prime sub-lines + ${OFF_MENU.size} off-menu exempt)`);
