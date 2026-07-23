# LTB BUILD QUEUE (spec'd, NOT built) - Jul 20 2026

Kevin-approved work, spec'd for a fresh instance to build in one pass. Nothing here is
implemented. Each item lists WHAT to build, what already exists to build on, and the FILES
TO ASK KEVIN FOR. He uploads files on request the moment you ask, so ask precisely and diff
before editing (his live copy can lead the repo, especially worker.js). Run `npm test`
(18 checks) after each; ship each as a single zip with the repo directory structure built
in. Ignore the `wrangler.jsonc` gate line (scratch-env only).

App context: React PWA, `entry.jsx` -> esbuild -> `app.js`, GitHub -> Cloudflare Pages;
`worker.js` is dashboard-pasted (never in the Pages build). The deep per-file map is in
HANDOFF_18_LTB_DEEP_JUL20.md; read it first if you don't have it.

---

## FILES TO ASK KEVIN FOR (master list, union of all items below)

Ask for these up front; they cover everything queued here. Get his CURRENT copies.

- `src/components/MoneyTab.jsx` - items 3, 5
- `src/styles.js` - item 5 (the single style object; all colors/spacing live here)
- `src/components/BooksPanel.jsx` - items 3, 5
- `src/dishReport.js` - item 2 (dishSalesHistory, buildPortfolioSummary)
- `src/components/RecipesTab.jsx` - items 2, 4 (portfolio radar + vote ranking)
- `src/books.js` - item 3 (monthlyPnl)
- `src/pipelineDishes.js` - item 4 (candidate canon)
- `src/dishCosting.js` - item 4 (costDishVariant / costing) [may already have it]
- `src/components/Modals.jsx` - item 1 (InvoiceModal)
- `src/components/OrderCard.jsx` - item 1 (the pending line)
- `src/menu.js` - item 1 (PER_LB_ITEMS.avgWeightLb) [small, may already have it]
- `worker.js` - item 4 ONLY IF votes are read server-side; ask how the app currently reads
  vote tallies (it may already load them into state via a /votes fetch - check RecipesTab
  first, ask only if unclear)

Do NOT need to ask for: `src/utils.js`, `src/dishes.js`, `src/ingredients.js` unless an item
below says so - they're large and the specs here don't require editing them.

---

## 1. Weight estimate on non-final invoices  [Kevin approved]

**What:** every per-lb item carries `avgWeightLb` in `PER_LB_ITEMS` (`src/menu.js`), and the
invoice/order card already has a "pending" line for weight-pending items. Instead of a bare
"price pending," show an ESTIMATE: `avgWeightLb x pricePerLb`, rendered like
"~$28 est - final on weigh-in." Sets customer expectations, makes a non-final invoice feel
complete.

**Build on:** `PER_LB_ITEMS[name] = { pricePerLb, costPerLb, avgWeightLb, costIngredient }`.
`repricePerLbItem` (in `src/utils.js`) already produces the REAL number once weighed; this is
only the pre-weigh estimate shown in its place. No engine change.

**Where:** the weight-pending render in `InvoiceModal` (`src/components/Modals.jsx`) and the
matching pending line in `src/components/OrderCard.jsx`. Guard it: only show the estimate
when the item is still weight-pending; once weighed, the real number replaces it. Make the
estimate visually distinct (e.g. "~" prefix + a muted "est" tag) so it's never mistaken for
the final charge.

**Files to ask for:** `Modals.jsx`, `OrderCard.jsx`. Effort: low.

---

## 2. Profit contribution ranking  [Kevin approved - "excellent"]

**What:** margin % tells you the health of ONE sale; nothing tells Kevin where the money
actually comes from. Rank every dish by real PROFIT CONTRIBUTION over a window (margin
dollars x how often it sells), so the quiet workhorses (mid-margin, sells every week) and the
dead weight (high-margin, sells twice a quarter) both surface. Decision-changing: what to
feature, what to keep despite thin margin, what to cut, how to weight the week planner.

**Build on:** `dishSalesHistory` in `src/dishReport.js` already computes per-dish `units`,
`revenue`, `cost`, `orderCount` over a window - so profit per dish = revenue - cost is one
step away; it just isn't assembled into a ranking. `buildPortfolioSummary` (same file) builds
the per-dish portfolio rows the Recipes-tab radar renders. Add a `profitContribution` field
(total margin dollars over the window) to the summary rows, and a sort mode / view that ranks
by it.

**Where:** `src/dishReport.js` (compute + expose the field) and the portfolio radar in
`src/components/RecipesTab.jsx` (add a "by profit $" sort mode alongside the existing margin/
drift columns, and show the dollar figure). Consider a window selector (this month / quarter
/ all) reusing the sales-history window logic. If any invariants fixture pins
`buildPortfolioSummary`'s row shape, update it (search `tests/invariants.mjs` for
`buildPortfolioSummary` / `report-portfolio`).

**Files to ask for:** `dishReport.js`, `RecipesTab.jsx`. Effort: medium. Data mostly exists.

---

## 3. Blended-margin trend, SPC-style  [Kevin approved]

**What:** per-ingredient price drift already exists; what erodes a food business is slow and
invisible - blended food cost creeping from 42% to 47% over two months, no single order ever
showing it. Roll the monthly P&L into a trend with an alert threshold: "blended cost up 4
points over 8 weeks, driven by [top 3 ingredients]." Statistical process control applied to
margins, which suits Kevin's CQV/validation background.

**Build on:** `monthlyPnl` in `src/books.js` already produces per-month `revenue`, `cogs`,
`profit`, `marginPct`. Sequence those months into a trend series, compute the delta over a
trailing window, and flag when the blended margin drops beyond a threshold. For the "driven
by" attribution, cross-reference the per-ingredient drift the receipt engine already tracks
(`priceDriftReport` / cost history) to name the biggest movers in the window.

**Where:** extend `src/components/BooksPanel.jsx` (the "BOOKS - MONTHLY P&L" dropdown in the
Money tab) with a trend line + the alert, or add a compact trend strip to `MoneyTab.jsx`.
Keep it inside the existing collapsible P&L section so it doesn't add top-level clutter (see
item 5). If books.js needs a new export (e.g. `marginTrend(orders, window)`), add it there.

**Files to ask for:** `books.js`, `BooksPanel.jsx`, `MoneyTab.jsx`. Effort: medium.

---

## 4. Connect voting to money (pipeline-to-economics)  [Kevin approved]

**What:** Kevin votes on pipeline candidates, but the votes and the economics live in
separate worlds, so "should I graduate this dish" is still a gut call. For each candidate
with real interest, show what it WOULD cost and what margin it'd hold at a sane price if he
ran it, so promoting a dish is a decision with demand AND dollars in front of him. Directly
supports the polyglot menu expansion he's actively working.

**Build on:** `src/pipelineDishes.js` is the candidate canon (30 dishes, with `ingredients[]`
that are EMPTY until developed - so a candidate can only be costed once its recipe exists;
for un-developed candidates, show votes only + "needs recipe to cost"). Vote tallies: check
how `RecipesTab.jsx` currently surfaces votes (it ranks them owner-side) - the tallies are
likely already fetched into state from the worker `/votes` route. `costDishVariant` +
`baselineCostMap` (`src/dishCosting.js`) cost any dish that has a resolvable recipe. For a
developed candidate, cost it at a target price and show the would-be margin next to its vote
rank.

**Where:** the vote-ranking view in `src/components/RecipesTab.jsx` (add a cost/margin column
or a "if you ran this at $X" line per candidate). Requires the candidate to have a costable
recipe; gate gracefully when it doesn't.

**Files to ask for:** `pipelineDishes.js`, `RecipesTab.jsx`, `dishCosting.js`. Ask how votes
are read into the app (check RecipesTab first; ask for `worker.js` only if the tally source
isn't obvious). Effort: medium; depends on candidate recipes existing.

---

## 5. Money tab restyle / declutter  [Kevin approved]

**The problem (from the Jul 20 screenshot):** the tab opens with Week notes, then FOUR
full-width, tall stat cards stacked vertically (Revenue, Est. profit, Collected, Outstanding)
that eat roughly half the first screen before a single order appears. Below that, every tool
is always present (sort row, group row, search, Graph, Recap, BOOKS - Monthly P&L, Change log
(164)), and then all 30 orders render in one list with active and archived mixed together
(archived just dimmed to ~0.65 opacity).

**Current render order** (`src/components/MoneyTab.jsx`): week notes (~line 300) -> 4 stat
cards (~332-348) -> sort row incl. "Unpaid only" (~375) -> "Group:" None/Week/Month/Year
(~380) -> search + Graph + Recap (~415-422) -> ProfitChart (toggle) -> BooksPanel -> AuditPanel
(Change log) -> grouped order list (~432-465, `group.orders.map`, `o.archived` dims the row).
Styles all live in `src/styles.js` (`statCard`, `statLabel`, `weekNotesTitle`, `groupLabel`,
`moneyRowWrap`, etc.).

**Proposed reorganization (Kevin wants this thought through, not just "dropdown"):**

1. **Vitals as a compact grid, not four stacked cards.** Replace the four full-width tall
   cards with a 2x2 tile grid (Revenue | Est. profit on top, Collected | Outstanding below),
   or a single 4-across strip on wider screens. Same four numbers, roughly one card's worth
   of height instead of four. Keep Outstanding amber/highlighted since it's the one that
   demands action. New tile style in `styles.js` off the existing `statCard`.

2. **Week notes -> slim, collapsed, below the vitals.** It's low-frequency and currently the
   very first thing. Make it a one-line "pencil - week note" affordance that expands on tap,
   placed under the vitals grid, not above it.

3. **Tools behind one control.** Collapse Graph, Recap, BOOKS - Monthly P&L, and Change log
   (164) into a single "Reports" row (a `Reports v` expander or a compact icon strip). They're
   all secondary. KEEP visible: sort (Date/Amount/Customer), "Unpaid only," Group, and search
   - those are used constantly. Item 3's margin-trend lives inside the collapsed P&L section
   so it adds no top-level clutter.

4. **Split the order list - the core of Kevin's ask.** Show ACTIVE (non-archived) orders by
   default - the current week's live orders (the ~6 in the Orders badge). Move ALL archived/
   past orders into a collapsed **"Past orders (N) v"** dropdown, collapsed by default,
   grouped by week/month inside when expanded. Reuse the existing `groupKeyFor` grouping and
   the `o.archived` flag; the per-group stat header (gRev/gCost/gCollected/gOutstanding, ~432-
   458) moves inside the Past dropdown. This alone turns a 30-row wall into ~6 rows + one
   collapsed section.

5. **Optional quick-action:** an "Unpaid - N - $X" chip near the vitals that toggles the
   existing `unpaidOnly` filter, since outstanding money is the actionable thing (the
   screenshot shows Frances Day and Sara Watson both unpaid). This makes collecting a one-tap
   path without a new feature.

**Guardrails:** the Money-tab totals already correctly exclude house orders via `isHouseOrder`
and bucket weeks Wednesday-start via `groupKeyFor` (both fixed Jul 20) - preserve both when
moving things. The archived rows already carry all the data needed for the Past dropdown; this
is a layout change, not a data change.

**Files to ask for:** `MoneyTab.jsx`, `styles.js`. Also `BooksPanel.jsx` if folding the P&L +
margin trend into the Reports expander. Effort: medium (mostly layout + one new collapsed
section).

---

## LATER BUCKET (good ideas, not now)
- Recent-omakase highlights strip on the menu page (nothing to fill it with yet).
- Accept-time anomaly flag on unusual budgets (needs the performance card's history first).
- Audit trail on omakase price/component edits.
- Frequent-omakase loyalty perk (business decision, revisit with real data).

## DECLINED (do NOT re-pitch)
- Companion order status: not needed.
- Model-vs-actual COGS gap: DEAD PERMANENTLY. Kevin's receipts mix non-LTB household
  items, so receipt totals can never be compared against modeled food cost. Every variant
  of "actual vs modeled spend" inherits this and is equally dead.
- Cook-tab dish notes: unneeded.

## DECLINED EARLIER THIS SESSION (do NOT re-pitch)
- Split-order matching: the whole split-order CONCEPT is dead, the family eats the other half.
- Cook-day prep sequencing/timeline: declined twice, do not raise again.
- Seasonal-dish reminders, delivery route grouping, referral tracking, clone-last-week,
  aggregate jar rollup, standing-note memory in the form, adventurousness control, budget
  tiers, meal-count logging, pre-shop ingredient budget, cook-time tracking, weather input,
  cuisine-variety check, substitution flow, fun records, omakase-to-pipeline promotion,
  note-vs-allergen checking.

- Weekly close-out / reconciliation gate - business too small.
- Multi-device push (EC-10 fix) - single device.
- Customer "reorder my usual" - menu changes weekly, nothing to reorder.
- Per-dish content layers (complete-the-plate, finishing move, second life, heat level) -
  Kevin already does all of this by hand; dishes are meant to be complete meals and he
  suggests extras/spices live.
- Food-science "the idea" per-dish note - much of the menu is standards; would get wordy.
- Cross-menu "pairs well together" - customers get the whole menu or 1-2 items, so no middle.
- Per-dish yield/shrinkage tracking + sourcing memory - Kevin rectifies yield in the moment
  and the built-in logic gate helps; not worth it.

## DONE (Jul 20, later)

- **Add-on profit section in the Recipes tab** - built. Queso is now group `addon` in
  `dishReport.js` (out of the dinner radar), and RecipesTab has an "Add-ons" collapsed
  sub-section mirroring proteins/veg/desserts (Profit $ + window selector + margin +
  drift). Queso itself was restructured: 2.5-jar yield, new cheese ratios (283g Oaxaca /
  226g Colby), a $1.50 passthrough mason jar, priced $10 / $8-swap (~53%% value-add).
  Add future add-ons (sauces) by putting their name in `addonNames` in `dishReport.js`.

## DONE - OMAKASE V2 BUILD (Jul 21 2026)

Shipped in LTB_omakase_v2_complete.zip. Full gate green (18 checks, 24 edge cases).

**Phase A - customer surfaces (form.html, menu.html)**
- Small/Large defined concretely: buttons read "serves ~4" / "serves ~8", with a line
  spelling it out and blessing ordering Large for leftovers. Mirrored on the menu page.
- The omakase note now renders as its own gold "YOUR NOTE TO THE CHEF" box in the review
  step and on the success receipt, not a small grey inline afterthought.
- Unadvertised $300 nudge: over $300 only, explains it is Kevin's cue for either multiple
  dishes or premium ingredients on fewer, asks for a hint in the notes. Blocks nothing.
- Diet filter parity: dietMatch ported verbatim from menu.html. Implemented as show/hide
  rather than re-render, because the omakase budget/note and customer details live in the
  DOM and a re-render would wipe them. A dish already in the cart stays visible.
- Week-off mode (customer half): config.paused renders a friendly notice instead of the
  menu on both pages. On menu.html it runs BEFORE the empty-menu notice, so a paused week
  never reads as "no menu published".

**Phase B - the logger (OrderCard.jsx, dishCosting.js, omakase.js, IngredientsTab.jsx)**
- New src/omakase.js: all omakase logic, UI-free and unit-tested.
- Ingredient builder: type-ahead search (2+ chars, max 5 hits), tap to add, amount with the
  native unit plus a unit selector where aliases exist, costed off the live cost map.
- unitOptionsFor(id) in dishCosting.js derives units by PROBING the ingredient's own conv
  function, so options can never drift from how dishes are actually costed.
- Not-in-registry: typing something unknown offers a one-off row; on save it collects in a
  queue rendered on the Ingredients tab ("Flagged from omakase"). Nothing auto-writes to
  ingredients.js.
- Templates: select a subset of rows, name it, save. Re-applying re-derives costs live.
- Memory: past omakases for that regular, plus a persistent "Past notes" line.
- Cook-inside-the-week tags: "on this week's menu" and "already buying this week".
- 60% of budget flag (Kevin's 40% margin line for omakase), low-side check under 40% cost,
  optional under-note, multi-dish vs premium tag above $300, per-row reheat notes.

**Phase C - fulfillment (companion.js, recipes.js, Modals.jsx, CookTabs.jsx, App.jsx)**
- Companion page: "Your omakase" card with components, the under-budget story, and real
  canon reheat text (menu components are expanded into the reheat engine).
- Shopping: menu components expand into real ingredient quantities; typed ingredients and
  off-menu rows become named buy lines; an omakase with nothing logged shows ONE line at
  the customer's budget. The bare omakase line is stripped from the base pass so it no
  longer emits a redundant "no recipe data" row.
- Invoice: under-note and "(your max was $X)" when charged below the max.
- Deliver: an alert card lists any omakase still sitting at the customer's max, with a
  one-tap Confirm.

**Phase D - regulars and orders (RegularsTab.jsx, OrderCard.jsx, App.jsx)**
- Standing restrictions use the EXISTING dietary/spice fields rather than a duplicate
  field, surfaced as an amber line in the expanded order card and inside the logger.
- Most-ordered dish and a nigiri omakase count on the profile; omakase column in the
  analytics table.
- Undecided-omakase banner above the active orders list.
- First-order chip when a customer has no regular and no older order.

**Phase E - analytics and the week (RecipesTab.jsx, MoneyTab.jsx, WeekTab.jsx, App.jsx)**
- Omakase performance card in the Add-ons area: count, revenue, realized margin (over the
  ones with a logged cost), average charge vs average budget, and the big-budget split.
- Money tab: omakase share under the Revenue tile.
- Week composer: last-ran and quarterly profit per dish. Request counts already existed.
- Week-off publish: "Take the week off" with an optional message; publishing a normal week
  clears it.

**Phase F**
- 10 new omakase checks in tests/edge_cases.mjs (24 total).

## DONE - ROBUSTNESS BUILD (Jul 22 2026)

Shipped in LTB_robustness_build.zip. Full gate green: 19 suites, 28 edge cases, and a new
customer-pages gate.

**!! PASTE worker.js !!** It is at the ZIP ROOT and is dashboard-pasted, never part of the
Pages build. Until it is pasted, taking a week off does nothing (see the bug below).

**The paused bug (found while architecting, fixed here).** worker.js POST /config builds
the stored config from an explicit field whitelist, and `paused` was not on it. The app
sent it, both customer pages honored it, and the worker silently threw it away, so the
week-off feature shipped last session has never actually worked in production. Now stored,
returned, and covered by worker_sim.

**Cart draft persistence (form.html).** The whole in-progress order (cart, spice, pasta,
parm, fixings text, and the omakase budget/size/note) is saved locally and restored on
return. Guarded two ways: a draft is discarded unless its weekLabel matches the current
config and it is under 5 days old, because the cart is keyed by menu POSITION and
restoring last week's indexes would put the wrong dishes in someone's cart. Cleared on
successful submit.

**Publish history and rollback (worker.js, WeekTab, App).** The worker keeps the last 5
configs, exposes GET /config-history (metadata only, token via query string) and POST
/config-restore. WeekTab has a "Publish history" list with a two-tap restore. The config
it replaces moves into history rather than being lost. History writes never block a
publish.

**Error boundary (new ErrorBoundary.jsx, entry.jsx, App).** Wrapped at the mount point so
a render throw no longer blanks the whole PWA, and each OrderCard is wrapped in a compact
boundary so one corrupted order quarantines itself with a "copy raw record" button instead
of killing the Orders tab.

**Digest v2 (DigestPanel).** A "Needs a decision" block now opens the briefing: undecided
omakases, omakase prices still sitting at the customer's max, containers out in the wild
with the biggest holder, and unpaid orders with the outstanding total. Paused state is
deliberately omitted, the digest has no config access and should not guess.

**Repricing scoreboard (new repricing.js, RecipesTab).** Every price change in the audit
log becomes a before/after row: units per week and margin dollars per week in the 28 days
either side, house orders excluded, with a "too early to judge" flag under a week. Reads
prices AS STORED on historical orders, since recomputing them against today's registry
would erase the signal.

**Accept-time economics (App).** The expanded pending card now shows revenue, estimated
cost, and margin before you accept. Omakase is held out of the margin and labeled "cost
TBD", since its cost is 0 until logged and would otherwise flatter the number.

**Customer pages joined the gate (new tests/customer_pages.mjs).** 19 functional jsdom
checks on form.html and menu.html, wired into npm test after library_sync. These pages are
hand-written ES5 that no bundler checks, so regressions used to ship silently. The gate
immediately earned its place: it caught that a customer whose only order was a sub-$50
omakase got "please add at least one item" instead of the $50 minimum message, because the
empty-cart check ran before the omakase guard. Fixed in both the review and submit paths.

## DONE - NEXT BUILD: DURABILITY + CATALOG (Jul 22 2026)

Shipped in LTB_next_build.zip. Full gate green: 19 suites, 43 edge cases, 30 customer-page
checks. Nine items across six phases.

**PASTE NOTE:** sw.js is NEW and lives at the repo root. App.jsx has always registered
`/sw.js`, but the file never existed, so the registration 404'd silently. Push notifications
and the update banner both depend on it now.

**Offline submit queue (form.html, key `ltb-submit-queue`).** A customer on bad signal used
to tap Submit and lose the order with no trace on either side. Now the payload is kept on the
phone and retried on next load and on the `online` event, always with its ORIGINAL clientId,
so a retry overwrites itself in KV and can never duplicate. A 4xx is a real rejection and is
dropped rather than retried forever; anything older than 7 days is dropped with an apology.
The customer sees an honest success screen: saved on this phone, will send itself.

**Service worker (new sw.js) + update prompt.** NETWORK-FIRST on purpose: cache is an offline
fallback, never a source of truth, because Kevin ships several times a week and this app is
his operations brain. On activate it deletes old caches and messages open clients; the app
shows "a new version is ready, tap to reload" only when the version actually changed, so a
first install is silent. Registration is no longer gated behind VAPID (the worker now does two
jobs, not just push). checkRepoStructure fails if sw.js goes missing from a zip.

**Storage quota guard (utils.js, App.jsx).** `localStore.set` called setItem with no
try/catch and the comment claimed callers handled the throw. They did not: most call sites end
in `.catch(() => {})`, so a full localStorage meant writes failed silently while the app looked
fine. It now surfaces through an `onStorageFull` hook AND still rejects. A red banner says
changes are not saving; a warning appears past 4MB of the ~5MB budget. `storageFootprint()`
counts the ltb- namespace in UTF-16.

**Omakase component orphan guard (omakase.js).** New `resolveMenuKey` runs a component's
`Dish|Variant` through the existing DISH_RENAMES / VARIANT_RENAMES maps. A saved template can
outlive a rename or a deletion, and an unresolvable component now degrades to a plain labelled
shopping line instead of a broken pseudo-item with a phantom cost.

**Omakase reheat authoring (OrderCard.jsx, companion.js).** Kevin's design exactly: menu-pick
components keep using their canon reheat text automatically, a card-level `reheatCard` field
appears when any row is off-menu, and both render on the kitchen link page when an order has
both. A non-blocking amber nudge fires at save when a component set would produce no reheat
instructions at all.

**Customer catalog with filters (tools/syncMainMenu.mjs, main-menu.html).** The tool now stamps
`data-name`, `data-cuisine`, and `data-diet` onto each generated dish block (diet tokens use the
same veg/vegan/pesc logic menu.html filters on, so the surfaces cannot disagree). main-menu.html
gained diet and cuisine chip filters built from what is actually on the page, so a new cuisine
in the registry needs no HTML edit. It also fetches /config and badges dishes that are on this
week's menu, with a banner linking to the order form. Filtering shows and hides; it never
re-renders.

**By-request chip (App.jsx, WeekTab.jsx, form.html, menu.html).** WeekTab already fetched
request counts; publish now stamps `requested: true` onto those dishes and both customer pages
show a gold "by request" chip. Worker request records carry no customer name, so this badges
the dish and thanks nobody by name, which is the honest version.

**One bottle for the week (weekPlanner.js, menu.html).** `weekOneBottle` mirrors the companion
page's per-order algorithm across the whole published week (ties break toward wine, since that
is what people actually buy a bottle of). Stamped at publish so the customer pages need no
drink logic; menu.html renders it as a card under the intro.

**Taste profile (regularsIntel.js, RegularsTab.jsx, OrderCard.jsx).** `buildTasteProfile`
composes top dishes, cuisine lean, spice range, dietary notes, and past omakase notes from data
that already existed but sat in three places. Renders as a card on the regular's profile and as
a one-liner inside the omakase logger, which is the moment it matters. House accounts return
null, and a regular with one order renders nothing rather than padding.

**Two gotchas found during the build, worth remembering:**
- `ALL_DINNERS` strips dishes to name and variants only. Cuisine (and everything else) survives
  ONLY on the `DISHES` registry objects. The taste profile broke silently on this first.
- `tests/invariants.mjs` located main-menu cards by splitting on the literal string
  `<div class="dish">`, so stamping catalog attributes onto that tag made all 26 dinner cards
  invisible to the check. The matcher now tolerates attributes, the same way it already reads
  through generated prices and allergen lines.

**Corrections recorded (do NOT re-pitch):**
- `publishPreflight.js` is ALREADY WIRED (WeekTab ~line 62, covered in invariants). It renders
  warnings above the publish button on every publish. An earlier round wrongly called it unwired.
- Pairings ALREADY render customer-side on both menu.html and main-menu.html. Only the
  week-level one-bottle callout was missing, and that shipped here.
- Menu PDF generation is dead: Kevin does not make a PDF. Publishing from the Week tab IS the
  menu.

## DONE - KITCHEN LINK FIX (Jul 22 2026)

Shipped in LTB_kitchen_link_fix.zip. Full gate green: 19 suites, worker_sim +10 checks.

**The bug this fixes.** A kitchen companion link Kevin sent a friend worked, then went dead
a few hours later with "expired or does not exist." Extensive live debugging (checked KV
directly via the dashboard) ruled out the TTL (genuinely 30 days), ruled out the new worker
deploy (a deploy never touches stored KV data), and ruled out `/pending/clear` (different key
prefix entirely, cannot reach `companion:` keys). The one fact that survived every check: the
same order had gotten TWO kitchen links, because every tap of the button minted a fresh random
id with no memory of one already existing. The first link's key was genuinely gone from KV
(confirmed via dashboard search, zero results), not merely stale.

**Fix 1: stable per-order id (OrderCard.jsx).** The kitchen link button now reuses
`order.kitchenPageId` if one already exists instead of minting a new random id every tap.
Re-tapping (to refresh after editing an order, say) now updates the SAME link already texted
to a customer, rather than quietly creating a second, disconnected one.

**Fix 2: verify before claiming success (OrderCard.jsx).** After the companion POST succeeds,
the button now reads the page back via `/k?id=` before telling Kevin it's live. A write that
does not actually commit is caught in the moment, not discovered days later as a dead link with
no explanation.

**Fix 3: reject empty writes + honest 404 wording (worker.js).** `POST /companion` now rejects
an empty HTML string (previously only the 200000-char ceiling was checked, so an empty string
sailed through and would have looked identical to a genuinely expired key on read). The 404
message on `GET /k` no longer says "expired," since KV's `get()` cannot tell "never existed"
from "expired" apart, and claiming a specific cause it cannot verify is worse than being
honest that it isn't available and a fresh link is the answer.

**Real debugging note for future sessions:** this incident is a good example of a theory being
falsified by evidence Kevin provided (his wife's OLDER link stayed alive throughout, which
single-handedly ruled out both the TTL theory and the deploy theory). Trust the check over the
plausible-sounding story; three theories died in this thread before the real cause held up.

## STILL OPEN FROM EARLIER (not this session's focus, but live)

- Pecan Mole-Fesenjan go-live: set real Small/Large prices (placeholders $75/$150), remove
  from OFF_MENU + CARDLESS + the two invariants off-menu sets, add its menu.html LIBRARY copy.
- Bo Ssam ssam sauce: blocked on Kevin's ingredient list + quantities.
