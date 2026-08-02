// containers.js — M1 (container inventory) + M2 (packaging cost), pure.
//
// THE PROBLEM M1 SOLVES: the jar ledger knows who HOLDS what; nothing knows
// how many containers Kevin OWNS. "Cannot pack next week" should surface on
// Sunday when orders close, not Wednesday morning with food ready and
// nothing to put it in.
//
// THE FLEET (Kevin, Jul 24 2026 — costs are per unit):
//   rect38  38 oz rectangle   $0.52   the dinner container
//   round8   8 oz round       $0.29
//   round16 16 oz round       $0.35
//   round32 32 oz round       $0.58
//   jar     pint mason jar    $1.12   ADD-ONS ONLY (queso, chili oil…),
//                                     never dinners — Kevin's explicit rule,
//                                     and it matches the jar ledger's own
//                                     JAR_SHIPPING_NAMES definition exactly.
//
// CUSTODY MODEL, and why it is shaped this way:
//   - Jars: EXACT, per the existing ledger (jarsOutForRegular). Untouched.
//   - Meal containers (the four non-jar types): outbound is computable
//     per-type from order items; RETURNS are not typed — Kevin logs one
//     `containerReturns` number on the final invoice. The jar ledger
//     credits that number against jars first and FLOORS at zero, which
//     means any credit beyond the jars a regular actually held is silently
//     discarded by the jar math. That discarded overflow is precisely the
//     meal containers coming back on the same invoice. So the meal pool
//     consumes EXACTLY the spillover the jar ledger throws away: one
//     logged number feeds both ledgers with zero double-counting, and the
//     accounting identity (outbound = held + returned) survives.
//   - The meal pool is tracked as a POOL (all four types summed), not
//     per-type, because an untyped return cannot honestly be allocated to
//     a type. Per-type numbers exist where they are real: OWNED (config)
//     and DEMAND (next week's orders). Fake per-type custody would be
//     precision that lies.
//   - `manualAdjust` is Kevin's override (his explicit ask): containers
//     found in a cupboard, a customer who moved away with three of them —
//     positive means "more are actually out than the math says", negative
//     means fewer.
//
// Forward-only from MEAL_CONTAINER_EPOCH, same pattern as the jar ledger:
// pre-epoch orders never tracked returns, so counting their outbound would
// manufacture phantom custody.

import { itemHandling } from './recipes.js';
import { isPerLbItem } from './menu.js';
import { perLbBagCount, orderOutboundJars, jarsOutForRegular, JAR_LEDGER_EPOCH, isOmakaseItem } from './utils.js';
import { ALWAYS_ITEMS, DISHES } from './dishes.js';
import { dishIdFor, resolveDishId } from './dishIdentity.js';
import { ALWAYS_MENU } from './menu.js';

// RESET Jul 26, and the reset is the point rather than an accident.
//
// The pool counts containers out in the field: tracked units on delivered
// orders, minus what has come back. It has to start SOMEWHERE, because there
// was never a full history of returns to count from.
//
// It started Jul 24. That start line is now retired, because the two days of
// data behind it were computed under the OLD composition model, where almost
// every dinner fell through to a 32 oz round default. The TOTALS from that
// window are roughly right and the TYPES are wrong — it would report round32s
// in the field when round48s actually are. Per-type accuracy is the entire
// reason this tracking exists, so inheriting numbers that are wrong in exactly
// that dimension would have poisoned the thing it was built for.
//
// Kevin's call, and the right one: two days is a cheap thing to lose. Every
// container counted from here is counted against the audited mapping.
//
// If this ever needs resetting again, the test is the same: has the way
// containers are DERIVED changed? A pricing change or an owned-count change
// does not need a new epoch. A mapping change does.
export const MEAL_CONTAINER_EPOCH = Date.parse('2026-07-26');

export const CONTAINER_TYPES = {
  rect38:  { label: '38 oz rectangle', cost: 0.52 },
  round8:  { label: '8 oz round',      cost: 0.29 },
  round16: { label: '16 oz round',     cost: 0.35 },
  round32: { label: '32 oz round',     cost: 0.58 },
  // Added Jul 26. SOME braises need more volume than the 32 holds. Which ones
  // is not knowable from the data — it is a per-dish fact Kevin holds, so it
  // lands in DISH_CONTAINERS below rather than being inferred from a category.
  round48: { label: '48 oz round',     cost: 1.38 },
  // Cookies only, and that exclusivity is the point: it is not a general large
  // rectangle and must not be reached for as one, or the packaging spend for a
  // cookie order quietly lands on dinners.
  rectXL:  { label: 'XL rectangle with lid (cookies)', cost: 1.49 },
  jar:     { label: 'Pint mason jar',  cost: 1.12 },
  // EIGHTH TYPE, added Jul 31. H-E-B 2 oz clear plastic cups WITH LIDS, 50 for
  // $3.44. At just under seven cents it is by far the cheapest thing in the
  // fleet — the next cheapest is round8 at $0.29 — so it barely moves a margin
  // and exists mostly to be COUNTED. Holds the finishing sauces and, from
  // Walk 2, the gumbo's filé.
  cup2:    { label: '2 oz cup with lid', cost: 0.0688 },
};
export const CONTAINER_TYPE_ORDER = ['rect38', 'round8', 'round16', 'round32', 'round48', 'rectXL', 'jar', 'cup2'];

// Every zeroed tally in this file is built from the registry, never written out
// by hand. Two hand-written literals used to seed the breakdown, so adding a
// container type on Jul 26 produced `undefined` units for it, and
// `undefined * cost` is NaN — which then propagated into the packaging total
// without anything throwing. A tally that cannot go stale is worth the helper.
export const emptyBreakdown = () => {
  const out = {};
  for (const t of CONTAINER_TYPE_ORDER) out[t] = 0;
  out.bag = 0;
  return out;
};

// Kevin's counts as of Jul 24 — stated as placeholders ("for now assume"),
// so the app treats these as DEFAULTS for a fresh install and the real
// numbers live in localStorage, editable in the Money tab's packaging card.
// The two Jul 26 additions default to 0 OWNED rather than to the 5 the others
// carry. Kevin stated 5-of-each as a placeholder for the original four; he has
// not said how many 48s or cookie rectangles he has. Defaulting them to 5 would
// invent stock and could report "you have enough" when he has none, which is
// the exact failure the shortage check exists to prevent. Zero is the honest
// unknown, and it announces itself the first time either is needed.
// REAL COUNTS, from Kevin Jul 26. These replace the 5-of-each placeholder that
// had stood since the fleet was first modelled, and they change what the Sunday
// check means: it was comparing real demand against invented stock.
//
// THE BINDING CONSTRAINT IS THE 16 OZ ROUND, and it is not close. Five owned
// against SIXTEEN dishes that need one, because it is the rice container. Two
// rice dinners plus a Large exhausts it. Nothing else on this list is close to
// its limit — there are 33 of the 8 oz and only two dishes use them.
//
// rect38 RESOLVED Jul 26: Kevin's inventory said "32 oz rectangles" and he
// confirmed that was his slip — it is the 38 oz. The count of 16 was always
// correct and the label was correct too, so nothing moved. Recorded because the
// next person to compare his inventory note against this table will spot the
// same mismatch and should not have to re-ask.
// REAL COUNTS, verified against Kevin's app by screenshot in Walk 5 (Jul 30).
// These were placeholders and three were wrong — round16 said 5 against a real
// 16, which is the single most-used container on the board. Only bites on a
// fresh device or a restore, but that is exactly when a wrong number is least
// likely to be noticed.
export const DEFAULT_OWNED = { rect38: 15, round8: 30, round16: 16, round32: 5, round48: 6, rectXL: 1, jar: 23, cup2: 20 };

export function normalizeContainerConfig(raw) {
  const owned = {};
  for (const t of CONTAINER_TYPE_ORDER) {
    const v = raw && raw.owned && Number(raw.owned[t]);
    owned[t] = Number.isFinite(v) && v >= 0 ? Math.floor(v) : DEFAULT_OWNED[t];
  }
  const adj = raw && Number(raw.mealAdjust);
  return { owned, mealAdjust: Number.isFinite(adj) ? Math.floor(adj) : 0 };
}

// ── Container type per physical package ────────────────────────────────────
// CORRECTED Jul 24 from Kevin's actual practice. The first pass assumed
// "dinners → 38 oz rectangle", which was wrong in an instructive way:
//
//   - 32 oz round is the DINNER workhorse. A small (~4 servings) of anything
//     saucy — pasta sauce, stew, curry — fits it almost perfectly.
//   - 8 oz round is for condiment-scale sauces (Alabama white sauce and the
//     sauces category: chimichurri, romesco, chermoula, and the butters).
//   - 16 oz round is the middle ground: desserts, fruit, breakfast, purées.
//   - 38 oz rectangle is NOT the default dinner box. It is for odd,
//     awkward components that fit nothing else — charred broccolini that
//     isn't bagged, the chicken portion of the tea-smoked chicken.
//   - Pint mason jar is add-ons only (queso, chili oil, syrups), never a
//     dinner. Enforced by the canonical jar rule, not by this table.
//
// THE REAL SHAPE, and the honest limit of this model: a plated dinner ships
// as SEVERAL containers of DIFFERENT types — the tea-smoked chicken is a
// rectangle for the chicken, a round for the polenta, an 8 oz for the sauce.
// DISH_CONTAINERS below expresses that. It is seeded only with the two
// dishes Kevin described; every other multi-component dinner currently
// resolves to a single default container and is therefore UNDERCOUNTED.
// Filling this map in dish by dish is a 20-minute pass with Kevin and the
// single highest-value correction left in the container model.
// ── AUDIT STATUS ───────────────────────────────────────────────────────────
// Only the dishes listed in DISH_CONTAINERS have a CONFIRMED composition. Every
// other multi-component dinner resolves to a single container and is therefore
// UNDERCOUNTED, which means the Sunday shortage check can tell Kevin he is fine
// when he is not.
//
// Deliberately NOT auto-populated with inferred mappings. Kevin's naming
// conventions (docs/NAMING.md) make it easy to guess which dinners have several
// components, but "Orecchiette with Bitter Greens and Anchovies" is one bowl
// while "Pork Chop with Kabocha Purée and Charred Broccolini" is three
// containers, and nothing in the data distinguishes them. A guessed mapping
// that LOOKS authoritative is worse than an obvious undercount, because the
// undercount at least announces itself.
//
// So the honest move is to make the gap VISIBLE and let the check say what it
// does not know. containerAuditStatus() below is what the Record tab and the
// Sunday warning read.
// ── THE MAPPING ─────────────────────────────────────────────────────────────
// All 27 dinners, audited with Kevin dish by dish on Jul 26 2026. Nothing here
// is inferred. This replaces the two-dish seed and the category guessing that
// stood in for it, and it corrects the model's founding assumption: round32 was
// treated as the dinner workhorse and it is not. round48 is the braise
// workhorse, and round16 is the single most-used container on the menu because
// it is the rice container.
//
// VALUES ARE COUNTS, not a list of type names. The array form could not express
// 3 bags for Steak au Poivre or 2 for the Bourguignon, which is why it changed.
//
// EVERY MAPPING IS FOR A SMALL PORTION. Scaling lives in containersForItem():
// Large is 2x, and on a dish with three sizes Medium is 2x and Large is 3x.
//
// `bag` IS PRESENT BUT NOT TRACKED. Sous vide bags are covered by the existing
// $2 bag charge, are not reusable, and there is nothing to keep count of. They
// stay in the mapping because they describe the dish honestly; they are
// excluded from owned counts, the Sunday shortage check, and the custody pool.
//
// Ambiguities are FLAGGED, not resolved — see CONTAINER_AMBIGUITIES below.
// LOOKUP HELPER — always go through this, never index DISH_CONTAINERS directly.
//
// The map was keyed by DISPLAY NAME until Jul 30. That meant renaming a dish
// silently detached its container mapping: the dish kept selling, the cost
// engine stopped charging for its containers, and nothing failed. Every other
// consumer in the app (passport, regularsIntel, favorites, repricing,
// dishCosting) had already moved to dishId; containers.js and menu.js were the
// two holdouts.
//
// Rekeyed before recipe versioning specifically, because packaging is part of a
// version snapshot and a version registry is append-only. Freezing a
// name-keyed mapping into permanent history would make the defect
// unfixable-in-place rather than merely present.
//
// dishIdFor follows DISH_RENAMES, so a historical name on an old order still
// lands on the right dish.
// VARIANT-AWARE, added Jul 31 for the rice rule.
//
// Everywhere else in this model, scaling from Small to Large means MORE of the
// same container. Rice is the one place the container TYPE changes instead:
// Kevin's rule is 2 cups in a round16 for a Small, 4 cups in a round32 for a
// Large. Nothing here could express that, so every rice dish was recorded with
// a flat round16 no matter what size went out.
//
// An entry is EITHER the old flat map (unchanged, ignores the variant, and
// every existing call site keeps working untouched) OR:
//
//   { base: {...}, byVariant: [ { match: /large/i, map: {...} }, ... ] }
//
// The first matching rule wins and its map is MERGED onto base. Rules are
// ordered, so put the specific ones first and a catch-all last. When no variant
// is supplied, a byVariant entry falls back to base plus the LAST rule, which
// is the Small case — the common order, and the safer direction to guess.
export function containersForDish(nameOrRecord, variantLabel) {
  if (!nameOrRecord) return null;
  const id = typeof nameOrRecord === 'string'
    ? dishIdFor(nameOrRecord)
    : resolveDishId(nameOrRecord);
  const entry = (id && DISH_CONTAINERS[id]) || null;
  if (!entry) return null;
  if (!entry.byVariant) return entry;

  const rules = entry.byVariant;
  const label = variantLabel != null
    ? String(variantLabel)
    : (typeof nameOrRecord === 'object' && nameOrRecord ? String(nameOrRecord.variant || '') : '');

  let picked = null;
  if (label) picked = rules.find(r => r.match.test(label)) || null;
  if (!picked) picked = rules[rules.length - 1];

  const out = { ...(entry.base || {}) };
  for (const [k, v] of Object.entries(picked.map || {})) out[k] = (out[k] || 0) + v;
  return out;
}

// The raw entry, variant rules and all. Anything auditing the MODEL rather than
// resolving one order wants this — a variant-aware entry has no single truth.
export function containerEntryFor(nameOrRecord) {
  if (!nameOrRecord) return null;
  const id = typeof nameOrRecord === 'string'
    ? dishIdFor(nameOrRecord)
    : resolveDishId(nameOrRecord);
  return (id && DISH_CONTAINERS[id]) || null;
}

export const DISH_CONTAINERS = {
  // Braises and stews: round48 is the container this menu actually runs on.
  'boeuf-bourguignon-beef-stew':                   { round48: 1, bag: 2 },  // Boeuf Bourguignon (Beef Stew)
  'chili':                                         { round48: 1 },  // Chili
  'brunswick-stew':                                { round48: 1 },  // Brunswick Stew

  // Rice dishes. The round16 here is TWO CUPS OF RICE, and that is a container
  // holding an ingredient, not an ingredient itself — the rice belongs in the
  // recipe, the round16 belongs here. Do not promote "2 cups rice" into a
  // packaging line; that conflates two different objects that happen to get
  // described in the same sentence.
  'leblanc-inspired-japanese': {
    base: { round48: 1, bag: 1 },
    byVariant: [
      { match: /large/i, map: { round32: 1 } },
      { match: /./,      map: { round16: 1 } },
    ],
  },

  // ── RICE DISHES: the container TYPE changes with size ────────────────────
  // Kevin's rule (Walk 2): 2 cups of rice in a round16 for a Small, 4 cups in a
  // round32 for a Large. Capacity confirmed — 4 cups fits the round32 and the
  // lid closes, barely. This is the only place in the model where scaling
  // changes the type rather than the count, which is why byVariant exists.
  //
  // Fleet is NOT a concern here and Kevin ruled so explicitly: he owns 5
  // round32 against 16 round16, most people order the Small, and if a Large
  // comes in he picks more up at H-E-B along with everything else.
  'gumbo': {
    // The cup2 is the FILÉ, added Walk 2: the gumbo now leaves the kitchen
    // without its final thickening and the customer sprinkles their own in.
    base: { round48: 1, cup2: 1 },
    byVariant: [
      { match: /large/i, map: { round32: 1 } },
      { match: /./,      map: { round16: 1 } },
    ],
  },
  'indian-style-curry': {
    // The bag is CONDITIONAL — Kevin bags roughly $2/lb of add-on vegetables
    // some weeks, or the protein for one specific household. Not modelled here
    // because it is not a fact about the size.
    base: { round48: 1 },
    byVariant: [
      { match: /large/i, map: { round32: 1 } },
      { match: /./,      map: { round16: 1 } },
    ],
  },
  'mapo-eggplant': {
    base: { round48: 1 },
    byVariant: [
      { match: /large/i, map: { round32: 1 } },
      { match: /./,      map: { round16: 1 } },
    ],
  },
  'thai-basil-chicken-pad':                        { round16: 1, bag: 1 },  // Thai Basil Chicken (Pad Krapow Gai)
  'texas-gulf-shrimp-or-tofu':                     { round16: 1, bag: 1 },  // Texas Gulf Shrimp or Tofu and Chinese Broccoli
  'shrimp-or-tofu-with':                           { round16: 1, bag: 1 },  // Shrimp or Tofu with Asparagus in Black Bean Sauce
  'stir-fried-long-beans-with':                    { round16: 1, bag: 1 },  // Stir Fried Long Beans with Ground Pork or Tofu
  'pecan-mole-fesenjan-beef-and':                  { round8: 1, round16: 1, round48: 1, bag: 1 },  // Pecan Mole-Fesenjan, Beef and Kabocha
  // AMBIGUITY 6a, RESOLVED Jul 26 by Kevin: "the rice is only for that variant.
  // Same for the need of the container." The round16 is the rice container, so
  // it follows the rice exactly — Beef and Lamb variants get it, Mushroom does
  // not. Resolved at breakdown time in containerTypesFor, not here, because the
  // mapping is keyed by DISH and this is the one dish that is really two.
  'cumin-mushroom-noodles-cumin': {
    // TWO CORRECTIONS from Walk 2. The MUSHROOM versions carry no rice at all —
    // they are bag-plus-noodle-pack, and the flat map gave every variant a
    // round16 it never shipped. Only the beef and lamb versions get rice, and
    // then the size rule applies. Noodles are a passthrough and never appear.
    base: { bag: 1 },
    byVariant: [
      { match: /mushroom/i,                    map: {} },
      { match: /(beef|lamb).*large/i,          map: { round32: 1 } },
      { match: /./,                            map: { round16: 1 } },
    ],
  },
  'bo-ssam': {
    // round8 is the ginger scallion sauce; the kimchi is a passthrough in its
    // own store-bought container and is not tracked here.
    base: { round8: 1, bag: 1 },
    byVariant: [
      { match: /large/i, map: { round32: 1 } },
      { match: /./,      map: { round16: 1 } },
    ],
  },

  // Pasta sauces and lighter braises.
  'bolognese':                                     { round32: 1 },  // Bolognese
  'mushroom-ragu': {
    // THE POLENTA SHIPS IN A BAG and this map did not say so, which is a real
    // packing undercount as well as a costing one. Found Aug 2 when the
    // two-night derivation wanted to charge for a second sealed bag on a dish
    // whose container map listed no first one.
    //
    // Variant-scoped because the polenta is an OPTIONAL variation: the plain
    // variants genuinely ship one container and nothing else.
    // The rules ADD to base rather than replacing it (see resolve above), so
    // the polenta rule carries only the bag. Repeating round32 here shipped two
    // containers for a one-container dish.
    base: { round32: 1 },
    byVariant: [
      { match: /polenta/i, map: { bag: 1 } },
      { match: /./,        map: {} },
    ],
  },  // Mushroom Ragu
  'pasta-with-homegrown-tomato':                   { round32: 1 },  // Pasta with Homegrown Tomato Sauce
  'saffron-pork-ragu': {
    // THE POLENTA SHIPS IN A BAG and this map did not say so, which is a real
    // packing undercount as well as a costing one. Found Aug 2 when the
    // two-night derivation wanted to charge for a second sealed bag on a dish
    // whose container map listed no first one.
    //
    // Variant-scoped because the polenta is an OPTIONAL variation: the plain
    // variants genuinely ship one container and nothing else.
    // The rules ADD to base rather than replacing it (see resolve above), so
    // the polenta rule carries only the bag. Repeating round32 here shipped two
    // containers for a one-container dish.
    base: { round32: 1 },
    byVariant: [
      { match: /polenta/i, map: { bag: 1 } },
      { match: /./,        map: {} },
    ],
  },  // Saffron Pork Ragu
  'orecchiette-with-bitter':                       { round16: 1 },  // Orecchiette with Bitter Greens and Anchovies

  // Composed plates. The rectangles hold awkward solids that are not bagged,
  // and two of the three are charred broccolini.
  'tea-smoked-chicken-with':                       { round8: 1, rect38: 1, bag: 1 },  // Tea-Smoked Chicken with Dashi Polenta and Alabama White Sauce
  'bone-in-pork-rib-chop-with':                    { round16: 1, rect38: 1, bag: 2 },  // Bone-In Pork Rib Chop with All the Fixings
  // AMBIGUITY 6b: Kevin confirmed bag x1, but his own note says "chop and purée
  // in the bags", plural. Left at 1 pending his answer rather than rounded up.
  'pork-chop-with-kabocha-pur-e':                  { rect38: 1, bag: 2 },  // Pork Chop with Kabocha Purée and Charred Broccolini  // TWO bags: pork and kabocha puree (Walk 2 dish 23)
  'steak-au-poivre':                               { round16: 1, bag: 3 },  // Steak au Poivre
  'pork-with-mustard-tarragon':                    { round16: 1, bag: 1 },  // Pork with Mustard Tarragon Cream Sauce

  // Zero tracked containers. Worth stating explicitly, because an empty mapping
  // and a missing mapping used to look identical and the second one silently
  // fell through to a default.
  'pappardelle-with-vegetables':                   { bag: 1 },  // Pappardelle with Vegetables and Mint
  'coriander-lamb-steak-over':                     { bag: 2 },  // Coriander Lamb Steak over Gigantes Beans

  'tex-mex-kit': {
    // REBUILT from Walk 2. The old flat map was wrong twice over: it did not
    // vary by size, and it did not carry the rice the kit is supposed to
    // include. Kevin: "odd, I thought it came with rice. It should if not."
    //
    // Per size: rice AND beans each take a round16 on a Small and a round32 on
    // a Large; the protein sits in its braise in the round48. Tortillas are a
    // passthrough. So a Large is TWO round32s, not one.
    // Kevin, Jul 31: a Large DOES take two protein containers. Because a sized
    // entry bypasses the portion multiplier, the doubling has to be stated here
    // rather than inferred — which is the tradeoff that shape buys.
    byVariant: [
      { match: /large/i, map: { round48: 2, round32: 2 } },
      { match: /./,      map: { round48: 1, round16: 2 } },
    ],
  },

  // Always-items, settled separately by Kevin.
  'chocolate-chip-cookies':                        { rectXL: 1 },  // Chocolate Chip Cookies
  // Kevin, Jul 31: brownies get the same XL rectangle as the cookies. This said
  // round48 and was a LIVE wrong value — costed 11 cents light and counted
  // against the braise workhorse instead of the one XL he owns.
  'brownies':                                      { rectXL: 1 },
  'peanut-butter-fudge':                           { rect38: 1 },  // Peanut Butter Fudge

  // FRUIT. All three come in the 38 oz rectangle and none of them was linked,
  // so the container was neither counted against the fleet nor charged for.
  // Kevin owns 15 of these and four other items already use them, so fruit
  // sharing the type matters for the shortage warning as well as the cost.
  'fresh-cut-pineapple':                           { rect38: 1 },
  'seasonal-cantaloupe':                           { rect38: 1 },
  'seasonal-stone-fruit':                          { rect38: 1 },
};

// Recorded so they are not rediscovered as new findings later. Each is a real
// open question, and each is deliberately UNRESOLVED in the mapping above.
export const CONTAINER_AMBIGUITIES = [
  { id: '6a', dish: 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice',
    resolved: true,
    note: 'RESOLVED Jul 26. The round16 is the rice container, so it applies ONLY to the Beef and Lamb variants; Mushroom is bag-only. Enforced in containerTypesFor by the same test riceUnits uses, so the container and the rice can never disagree.' },
  { id: '6b', dish: 'Pork Chop with Kabocha Purée and Charred Broccolini',
    note: 'Kevin confirmed one bag, but his note says "chop and purée in the bags", plural. Probably 2. Ask before changing.' },
  { id: '6c', dish: 'Bo Ssam',
    note: 'The ssam sauce would likely need its own round8, but that component does not exist in the app yet. Do NOT add it.' },
  { id: '6d', dish: 'Chili',
    note: 'Rice with chili is not part of the standard build. Kevin would give 2 cups in a round16 and "likely do it for free". Not modelled on purpose.' },
  { id: '6e', dish: 'Mapo Eggplant',
    note: 'A round32 could substitute for the round16 if needed. That is flexibility, not a second mapping. round16 stays canonical.' },
];

// The one type that never counts against the fleet. Kept separate from
// CONTAINER_TYPES so every consumer asks the same question the same way.
// ── WHEN THE SHORTAGE WARNING IS ALLOWED TO SPEAK ───────────────────────────
// Monday onward, never Sunday. Kevin: "I only need the warning on monday not
// sunday after the system compares total container requirements to the weekly
// orders."
//
// The reason is that the demand figure is not FINISHED on Sunday. Orders close
// Sunday at 23:59, so a Sunday warning is computed against a half-full order
// book and is wrong in both directions: it can cry shortage over orders that
// never arrive, and it can stay quiet while the orders that would cause a real
// shortage are still coming in. A warning that is sometimes wrong in the
// reassuring direction is worse than no warning.
//
// Monday is the first moment the week's requirement is a fact rather than a
// forecast, and it still leaves two clear days before Wednesday delivery.
//
// Tuesday and Wednesday keep showing it: a shortage does not stop being true
// because a day passed, and Wednesday morning with the food cooked is exactly
// when Kevin least wants to discover it.
export function shortageWarningDue(now = new Date()) {
  const d = now.getDay(); // 0 Sun … 6 Sat
  return d >= 1 && d <= 3; // Mon, Tue, Wed
}

export const UNTRACKED_TYPES = new Set(['bag']);
export const isTrackedType = (t) => !UNTRACKED_TYPES.has(t);


// Category defaults for everything without an explicit composition above.
export const CATEGORY_TYPE_DEFAULTS = {
  sauces: 'round8',      // condiment scale, per the Alabama white sauce rule
  desserts: 'round16',
  // Fresh cut fruit goes in the 38 oz RECTANGLE, not a round (Kevin, Jul 27).
  // The cantaloupe and the pineapple are the whole category. This was round16,
  // which is the tightest type in the fleet, so every fruit order was quietly
  // competing with the rice dishes for a container it never needed.
  fruit: 'rect38',
  breakfast: 'round16',
  // Add-ons go in JARS, per the Jul 26 audit: "every add-on Kevin can think of
  // → jar x1". They had no default, so they fell through to the round16
  // catch-all — which meant five quesos read as five sixteen-ounce rounds and
  // helped push a week's demand to 19 when the true figure was 6.
  addons: 'jar',
};
// Per-dish single-type overrides, for dishes that need a non-default box but
// are not multi-container. Cheaper to edit than DISH_CONTAINERS.
export const CATEGORY_TYPE_OVERRIDES = {
  // 'Some Dessert': 'round8',
};
export const DEFAULT_DINNER_TYPE = 'round32'; // the workhorse

// Everything that ships in a sous vide bag, from the menu itself rather than a
// second hand-typed list. Per-lb proteins, sous vide veg, and the confit.
export const BAGGED_NAMES = new Set(
  (ALWAYS_MENU.bag || []).map(d => (typeof d === 'string' ? d : d && d.name)).filter(Boolean),
);

// Dinners whose name suggests several components, per Kevin's own conventions:
// `with` attaches accompaniments, `and` joins co-equal parts, `over` a base.
// These are CANDIDATES for the audit, not conclusions — some are one bowl.
const COMPONENT_SPLIT = / with | and | over | in (?!a )/i;

function nameComponents(dishName) {
  return String(dishName || '').split(COMPONENT_SPLIT).map(s => s.trim()).filter(Boolean);
}

// What the container model actually knows, and what it does not. The Sunday
// check reads this so it can state its own confidence instead of implying
// precision it has not earned.
export function containerAuditStatus(dishList) {
  const dishes = dishList || DISHES.map(d => d.name);
  const confirmed = [];
  const unconfirmed = [];
  for (const name of dishes) {
    const parts = nameComponents(name);
    // Counts the TRACKED units, not the number of distinct types, and not the
    // bags. `.length` used to work because the mapping was an array; it is now
    // an object of counts, and a stale `.length` here returns undefined and
    // poisons every sum downstream with NaN.
    const mixByName = containersForDish(name);
    if (mixByName) {
      const mix = mixByName;
      const units = Object.entries(mix)
        .filter(([t]) => isTrackedType(t))
        .reduce((n, [, q]) => n + (Number(q) || 0), 0);
      confirmed.push({ dish: name, containers: units });
      continue;
    }
    if (parts.length > 1) unconfirmed.push({ dish: name, components: parts, assumed: 1 });
  }
  return {
    confirmed,
    unconfirmed,
    // The most the Sunday check could be undercounting by, if every
    // unconfirmed candidate turned out to be one container per component.
    maxUndercount: unconfirmed.reduce((s, u) => s + (u.components.length - 1), 0),
    complete: unconfirmed.length === 0,
  };
}

// name → category, same derivation labels.js uses.
const CATEGORY_OF = {};
for (const [cat, items] of Object.entries(ALWAYS_ITEMS)) {
  for (const it of items) CATEGORY_OF[it.name] = cat;
}
const DINNER_NAMES = new Set(DISHES.map(d => d.name));

// The jar rule, restated from utils.js: an item is a jar item iff it
// contributes to orderOutboundJars. Checked per-item by probing a one-item
// order through the CANONICAL function rather than copying its name set —
// if the jar rule ever changes in utils.js, this follows automatically.
function isJarItem(it) {
  return orderOutboundJars({ items: [{ ...it, qty: 1 }] }) > 0;
}

// The container types ONE unit of this item occupies. Always an array:
// a multi-component dinner genuinely occupies several.
// Small is the authored baseline. A three-size dish reads Medium as 2x and
// Large as 3x; a two-size dish reads Large as 2x. Anything unrecognised stays
// at 1, because inventing a multiplier is how a shortage check starts lying.
export function portionMultiplier(it) {
  // THE SIZE WORD, RANKED AGAINST THE LADDER THAT DISH ACTUALLY OFFERS.
  //
  // Two earlier attempts got this wrong and tests/invariants.mjs caught both.
  // Its rule is that variants of one dish must drift by the SAME percentage
  // under a price shock, which is exactly the invariant a bad multiplier
  // breaks.
  //
  //   v1 regexed the label for "large" and returned 2. A three-size dish came
  //      out 1/2/2 while its ingredients scaled 1/2/3, so Steak au Poivre
  //      drifted 8.5 / 8.5 / 8.0.
  //   v2 used the variant's POSITION in the registry. That is right for a pure
  //      size ladder and nonsense for the cumin dish, whose twelve variants are
  //      protein x size x greens — "Beef, Small" is the fifth entry and is not
  //      five times a small.
  //
  // So: read the SIZE WORD out of the label, and rank it against the sizes that
  // dish actually offers. A dish with a Medium is a three-step ladder; one
  // without is two-step. That is the same thing a person reading the menu
  // would conclude.
  const label = String((it && it.variant) || '').toLowerCase();
  if (!label) return 1;

  const sizeOf = (l) => (/\bmedium\b|\bmed\b/.test(l) ? 'medium'
    : /\blarge\b/.test(l) ? 'large'
    : /\bsmall\b/.test(l) ? 'small' : null);

  const mine = sizeOf(label);
  if (!mine || mine === 'small') return 1;

  const name = it && it.name;
  const dish = DISHES.find(d => d.name === name)
    || Object.values(ALWAYS_ITEMS || {}).flat().find(d => d && d.name === name);
  const sizes = new Set(((dish && dish.variants) || [])
    .map(v => sizeOf(String(v.label).toLowerCase())).filter(Boolean));

  if (mine === 'medium') return 2;
  // Large is the third step only when a Medium exists to be the second.
  return sizes.has('medium') ? 3 : 2;
}



export function containerTypesFor(it) {
  if (!it || !it.name) return [];
  if (isJarItem(it)) return ['jar'];
  if (it.perLb || isPerLbItem(it.name)) return ['bag'];
  // The mapping now carries COUNTS. Expanded into a repeated array here so
  // every existing caller keeps its contract (they count occurrences), while
  // the source of truth gains the quantities the array form could never hold.
  //
  // SCALING. Every mapping is authored for a SMALL portion. Large doubles it,
  // and on a three-size dish Medium doubles and Large triples. Applied here
  // rather than in the mapping so the table stays readable and there is exactly
  // one place the rule lives.
  const mixForItem = containersForDish(it);
  if (mixForItem) {
    // A byVariant entry states the FINAL answer for that size, so the portion
    // multiplier must not run on top of it or a Large gets scaled twice. This
    // is the whole reason the rice rule needed a new shape: everywhere else
    // Large means "two of the same container" and the multiplier is right;
    // for rice the TYPE changes instead and there is nothing left to double.
    const sized = !!containerEntryFor(it) && !!containerEntryFor(it).byVariant;
    const mult = sized ? 1 : portionMultiplier(it);
    const out = [];
    // The one dish that is really two plates in one entry. Its round16 is the
    // rice container, so it appears only on the variants that come with rice.
    // Deliberately the SAME test riceUnits uses in dishCosting.js, so a dish
    // can never be charged for a rice container it did not get, or vice versa.
    // Cumin's mushroom-has-no-rice rule moved INTO its byVariant map on Jul 31,
    // so this hardcoded branch would be a second implementation of the same
    // thing. Kept for flat entries only, which is now nothing — left in place
    // rather than deleted because dishCosting.js runs the identical test for
    // riceUnits and the two must not drift apart.
    const skipRiceContainer = !sized
      && it.name === 'Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice'
      && !/^(beef|lamb),/i.test(String(it.variant || ''));
    for (const [type, n] of Object.entries(mixForItem)) {
      if (type === 'round16' && skipRiceContainer) continue;
      for (let k = 0; k < (Number(n) || 0) * mult; k++) out.push(type);
    }
    return out;
  }
  if (CATEGORY_TYPE_OVERRIDES[it.name]) return [CATEGORY_TYPE_OVERRIDES[it.name]];
  const cat = CATEGORY_OF[it.name] || null;
  if (cat && CATEGORY_TYPE_OVERRIDES[cat]) return [CATEGORY_TYPE_OVERRIDES[cat]];
  if (cat && CATEGORY_TYPE_DEFAULTS[cat]) return [CATEGORY_TYPE_DEFAULTS[cat]];
  // BAGGED ITEMS CONSUME NO TRACKED CONTAINER. ALWAYS_MENU.bag is the
  // authoritative list — it is what the Cook tab groups under "Stuff in a bag"
  // — and every one of them ships in a sous vide bag: the per-lb proteins, the
  // sous vide veg, and the confit.
  //
  // THIS WAS THE 19-VS-5 BUG. The catch-all below used to return round16 for
  // anything with a category and no mapping, so a week with a lot of bagged
  // items reported needing 19 sixteen-ounce rounds when only 5 were real. The
  // shortage banner fired on a number made almost entirely of items that use no
  // container at all, and the one type it fired on is the type that is actually
  // tight — so the warning looked plausible, which is what made it dangerous.
  //
  // Checked BEFORE the catch-all rather than added to CATEGORY_TYPE_DEFAULTS,
  // because 'bag' is not a container type with a default: it is the absence of
  // one, and it must never be reachable by a fallback that means "we do not
  // know".
  if (BAGGED_NAMES.has(it.name)) return ['bag'];

  if (DINNER_NAMES.has(it.name) || !cat) return [DEFAULT_DINNER_TYPE];

  // The last resort. Reaching here means an item exists in a category with no
  // default and no mapping, which is a REGISTRY GAP rather than a container
  // decision. round16 is the least-wrong guess and it is also the tightest type
  // in the fleet, so a gap shows up as a shortage rather than hiding. If this
  // fires for something real, map it properly.
  return ['round16'];
}


// ── Physical packages per order, by type ───────────────────────────────────
// The UNITS math must agree with labels.js (the canon for "how many physical
// packages does this line produce" — the cantaloupe and cookies bugs live
// there). tests/containers.mjs cross-checks this against buildLabelSheet on
// the same order, so the two implementations cannot drift apart silently.
// The types a customer can actually give back, for the omakase entry.
//
// EXCLUDES `bag` — a sous vide bag is not a returnable and never comes back,
// which is Kevin's ruling and the reason the omakase card says so out loud.
// Everything else in the fleet is a real object that cycles.
export const RETURNABLE_TYPES = CONTAINER_TYPE_ORDER
  .filter(t => t !== 'bag')
  .map(t => ({ id: t, label: (CONTAINER_TYPES[t] || {}).label || t }));

export function orderContainerBreakdown(order) {
  const out = emptyBreakdown();
  for (const it of ((order && order.items) || [])) {
    if (!it || !it.name) continue;
    // OMAKASE COUNTS ONCE KEVIN HAS SAID WHAT IT USED.
    //
    // It used to be skipped outright — "priced, not packed" — which was true
    // while there was no way to record its containers. There is now: the
    // omakase card takes a per-TYPE count, and this is what makes that entry
    // reconcile rather than just sit in the order.
    //
    // NOTHING NEEDS UNDOING WHEN HE CHANGES IT. Demand is DERIVED from the live
    // orders on every read, so removing a row or dropping a count to zero
    // simply produces a smaller number next time. A delta-based version that
    // subtracted from a stored total would need reversal bookkeeping and would
    // drift the first time a save was interrupted.
    //
    // `unspecified` is deliberately not counted against any type. It is the
    // migration bucket for orders logged before types were recorded, and
    // charging an untyped container to a real type would be a guess — the same
    // rule the audit already applies to its own undercount.
    if (isOmakaseItem(it)) {
      const used = it.containersUsed;
      if (used && typeof used === 'object') {
        for (const [type, n] of Object.entries(used)) {
          if (type in out) out[type] += Number(n) || 0;
        }
      }
      continue;
    }
    const qty = Number(it.qty) || 1;
    const perLb = !!it.perLb || isPerLbItem(it.name);
    const h = itemHandling(it.name, { category: CATEGORY_OF[it.name] || null, isPerLb: perLb });
    const weighed = perLb && typeof it.weight === 'number' && it.weight > 0;
    const units =
      h.packaging === 'per-bag' ? (weighed ? perLbBagCount(qty) : 1)
      : h.packaging === 'per-qty' ? qty
      : 1; // 'single'
    // A multi-component dinner occupies several containers PER unit, so the
    // composition is expanded and each type counted separately.
    for (const type of containerTypesFor(it)) {
      if (type in out) out[type] += units;
    }
  }
  return out;
}

export function sumBreakdowns(orders) {
  const total = emptyBreakdown();
  for (const o of orders || []) {
    const b = orderContainerBreakdown(o);
    for (const k of Object.keys(total)) total[k] += b[k];
  }
  return total;
}

// ── Custody: the meal pool ─────────────────────────────────────────────────
// Outbound = meal-container units on DELIVERED orders since the epoch
// (status Delivered, archived included — archiving is bookkeeping, the
// containers still left the kitchen).
// Credits = the spillover the jar ledger's floor discards, grouped the same
// way the jar ledger groups (per regular; orders with no regular stand
// alone), so a return logged on a LATER invoice than the outbound still
// nets out within the same customer.
// PER-TYPE CUSTODY, added Jul 26.
//
// mealContainersOut() answers "how many of my containers are out there" as ONE
// number. That was the right first answer and it is no longer enough: the fleet
// is lopsided. Thirty-three 8 oz rounds serve two dishes, five 16 oz rounds
// serve sixteen. A pooled figure of "twelve out" is compatible with being
// completely fine and with being unable to cook Wednesday, and nothing in the
// number tells you which.
//
// THE RETURNS PROBLEM, stated honestly rather than hidden.
// Kevin logs container returns as a COUNT, not by type — the order carries
// `containerReturns: 3`, not "two 16s and a 48". So the outbound side is known
// exactly (it is derived from the audited mapping) and the inbound side is not.
// Guessing which types came back would produce a per-type figure that looks
// precise and is invented, which is the failure this whole container model has
// been climbing out of all day.
//
// So returns are applied POOLED and the result says so. Each row reports what
// went out by type, and the report carries a single `returned` count plus a
// flag saying the per-type outstanding figures are UPPER BOUNDS. That is a
// smaller claim than the pooled version made, and it is one that is true.
//
// If Kevin ever logs returns by type, `attributeReturns` below is the only
// thing that needs to change.
export function containerCustody(orders, config) {
  const cfg = normalizeContainerConfig(config);
  const since = (orders || []).filter(o =>
    o && new Date(o.createdAt || 0).getTime() >= MEAL_CONTAINER_EPOCH);
  const delivered = since.filter(o => o.status === 'Delivered' || o.archived);

  const out = emptyBreakdown();
  for (const o of delivered) {
    const b = orderContainerBreakdown(o);
    for (const t of CONTAINER_TYPE_ORDER) out[t] += (b[t] || 0);
  }

  // Credits logged against orders in the window. Jars have their own ledger, so
  // only the meal-container side is counted here.
  let returned = 0;
  for (const o of since) returned += Number(o.containerReturns) || 0;

  // EVERY TRACKED TYPE GETS A ROW, ALWAYS. Jars included — they are a real part
  // of the fleet Kevin counts (23 of them) even though their OUTSTANDING side is
  // tracked by the separate jar ledger rather than by containerReturns, which is
  // why the outbound sum above skips them.
  //
  // THERE IS NO `.filter()` HERE AND THERE MUST NOT BE ONE. A filter on
  // `owned > 0` was the original shape and it was a data-loss bug: backspacing
  // the owned field to empty made the row evaluate to 0, which dropped it from
  // this list, which unmounted the input mid-edit. The count was gone and there
  // was no way to type it back, because the box you would type into had just
  // been removed. A row is a property of the REGISTRY, not of its current
  // value; a type you own zero of is exactly the row you most need visible in
  // order to fix it.
  const rows = CONTAINER_TYPE_ORDER
    .filter(t => isTrackedType(t))
    .map(t => ({
      type: t,
      label: CONTAINER_TYPES[t].label,
      owned: cfg.owned[t] || 0,
      // Jars go out on orders too, but their return side lives in the jar
      // ledger, so `out` here would be a half-truth. Reported as 0 rather than
      // as a number that only counts one direction.
      out: t === 'jar' ? 0 : out[t],
      // UPPER BOUND. Returns are pooled, so the true figure for any one type is
      // somewhere between this and (out - returned). Named so no caller can
      // mistake it for an exact count.
      outstandingMax: t === 'jar' ? 0 : out[t],
      onHandMin: Math.max(0, (cfg.owned[t] || 0) - (t === 'jar' ? 0 : out[t])),
      // Tells the panel not to imply the outstanding figure is meaningful here.
      outTrackedElsewhere: t === 'jar',
    }));

  // WHO HAS WHAT. Grouped by customer from delivered orders inside the window,
  // minus the returns logged against those same orders. Returns are a COUNT and
  // not typed, so a customer's per-type list is what went OUT to them; the
  // `returned` figure on the row is how many of any type have come back.
  //
  // House orders are included, because the containers are just as gone.
  const byCustomer = new Map();
  for (const o of delivered) {
    const who = String(o.customer || 'Unknown').trim() || 'Unknown';
    const b = orderContainerBreakdown(o);
    const rec = byCustomer.get(who) || { customer: who, types: {}, total: 0, returned: 0, orders: 0 };
    let any = false;
    for (const t of CONTAINER_TYPE_ORDER) {
      if (t === 'jar' || !isTrackedType(t)) continue;
      const n = b[t] || 0;
      if (!n) continue;
      rec.types[t] = (rec.types[t] || 0) + n;
      rec.total += n;
      any = true;
    }
    rec.returned += Number(o.containerReturns) || 0;
    if (any) rec.orders += 1;
    byCustomer.set(who, rec);
  }
  const holders = [...byCustomer.values()]
    .map(r => ({ ...r, outstanding: Math.max(0, r.total - r.returned) }))
    .filter(r => r.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);

  const totalOut = rows.reduce((n, r) => n + r.out, 0);
  return {
    since: MEAL_CONTAINER_EPOCH,
    rows,
    holders,
    totalOut,
    returned,
    // The pooled outstanding figure, which IS exact.
    outstanding: Math.max(0, totalOut - returned + cfg.mealAdjust),
    // Tells the UI to describe per-type numbers as "up to", because the return
    // side is not typed. Flip this only when returns are logged by type.
    perTypeIsUpperBound: returned > 0,
  };
}

export function mealContainersOut(orders, config) {
  const cfg = normalizeContainerConfig(config);
  const since = (orders || []).filter(o =>
    o && new Date(o.createdAt || 0).getTime() >= MEAL_CONTAINER_EPOCH);

  const delivered = since.filter(o => o.status === 'Delivered' || o.archived);
  let outbound = 0;
  for (const o of delivered) {
    const b = orderContainerBreakdown(o);
    // Summed from the REGISTRY, minus jars (their own ledger) and bags
    // (untracked, not reusable, covered by the $2 charge). This was a
    // hand-written list of four types, so the moment round48 was registered
    // every braise container out in the field became INVISIBLE to the custody
    // pool — and a braise is the most common thing on this menu. Nothing threw;
    // the number was just quietly low.
    outbound += CONTAINER_TYPE_ORDER
      .filter(t => t !== 'jar' && isTrackedType(t))
      .reduce((n, t) => n + (b[t] || 0), 0);
  }

  // Spillover: per customer group, credits beyond what the jar math could
  // absorb. Uses the SAME epoch as this pool for the group's jar side, so
  // both sides of the subtraction see the same orders.
  const groups = new Map();
  for (const o of since) {
    const key = o.regularId || ('order:' + (o.id || Math.random()));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  }
  let spillover = 0;
  for (const list of groups.values()) {
    let jarsOut = 0, credits = 0;
    for (const o of list) {
      jarsOut += orderOutboundJars(o);
      credits += (o.jarSwaps || 0) + (o.containerReturns || 0);
    }
    spillover += Math.max(0, credits - jarsOut);
  }

  return Math.max(0, outbound - spillover + cfg.mealAdjust);
}

// ── The Sunday report ──────────────────────────────────────────────────────
// Demand = next week's pack: every non-archived, non-delivered order
// (house included — her food goes in real containers, same rule as the jar
// ledger). Availability:
//   jars: owned − exactly held (ledger)
//   meal types: owned per type. The pool's outstanding count is shown as
//   ADVISORY context, not subtracted per-type — an untyped debt cannot
//   honestly be charged to a specific type, and Kevin's containers cycle
//   back weekly, so owned-vs-demand is the real Sunday question.
export function containerReport(orders, regulars, config) {
  const cfg = normalizeContainerConfig(config);
  const active = (orders || []).filter(o => o && !o.archived && o.status !== 'Delivered');
  const demand = sumBreakdowns(active);

  const jarsHeld = (regulars || []).reduce((s, r) => s + jarsOutForRegular(r.id, orders || []), 0);
  const jarsAvailable = Math.max(0, cfg.owned.jar - jarsHeld);

  const audit0 = containerAuditStatus();
  // The undercount is not spread evenly, and nothing here knows which type the
  // missing containers would be. So risk is assessed against the WHOLE possible
  // shortfall on every type: if the audit's worst case could push this type past
  // capacity, the check says so rather than staying silent.
  const rows = CONTAINER_TYPE_ORDER.map(t => {
    const need = demand[t] || 0;
    const have = t === 'jar' ? jarsAvailable : cfg.owned[t];
    const short = Math.max(0, need - have);
    // Jars are exact (the ledger tracks them), so they carry no audit risk.
    const riskCeiling = t === 'jar' ? need : need + audit0.maxUndercount;
    return {
      type: t, label: CONTAINER_TYPES[t].label, need, have, short,
      // TRUE when this type is fine on the numbers we have but could be short
      // once the unconfirmed dishes are counted properly. This is the case the
      // old check was silent about, which is the dangerous one: it told Kevin
      // he was fine when it did not actually know.
      atRisk: short === 0 && riskCeiling > have,
      riskCeiling,
    };
  });

  const audit = audit0;
  return {
    rows,
    atRisk: rows.filter(r => r.atRisk),
    // The check reports what it does not know rather than implying precision.
    // Until the audit is done, demand is a FLOOR, not a figure.
    audit,
    demandIsFloor: !audit.complete,
    shortages: rows.filter(r => r.short > 0),
    bags: demand.bag || 0,
    jarsHeld,
    mealOut: mealContainersOut(orders, cfg),
    owned: cfg.owned,
    mealAdjust: cfg.mealAdjust,
  };
}

// ── M2: packaging cost, display-only (Kevin's decision 3a) ─────────────────
// Cost of what physically went out in a set of orders, at per-unit prices.
// DISPLAY ONLY — this never enters the dish margin engine. Containers are
// reusable and returns offset over time; folding a reusable's price into a
// dish margin would misstate both. Bags are consumable but unpriced here
// (not one of the five types Kevin costed); they are COUNTED so the number
// exists the day he wants to cost them.
export function packagingCost(orders) {
  const b = sumBreakdowns(orders);
  let cost = 0;
  const perType = {};
  for (const t of CONTAINER_TYPE_ORDER) {
    perType[t] = { units: b[t], cost: Math.round(b[t] * CONTAINER_TYPES[t].cost * 100) / 100 };
    cost += perType[t].cost;
  }
  return { total: Math.round(cost * 100) / 100, perType, bags: b.bag };
}
