# BATCH NOTES (running; becomes the README in the end-of-B7 zip)

## Ship list so far (new or modified only)

**B1 — the knowledge base (K1–K9, absorbed T3):**
- src/journal.js                      NEW — the substrate. Eight entry types, dating built in, rename-following, dishNotes fold, retirement nudge, publicEntries.
- src/components/JournalPanel.jsx     NEW — the dossier UI (named export; render-gated).
- src/config.js                       MOD — JOURNAL_KEY added; DISH_NOTES_KEY retained only for the boot migration read.
- src/migrations.js                   MOD — SCHEMA_VERSION 2; v1→v2 dishNotes fold (idempotent, non-destructive).
- src/utils.js                        MOD — RENAME_HISTORY beside DISH_RENAMES (K9), one honest row, unrecorded date stays null.
- src/App.jsx                         MOD — journal state, boot hydrate + one-way migration, saveJournal, journal on the backup ring both directions, knownDishNames memo, props to RecipesTab and MoneyTab.
- src/components/RecipesTab.jsx       MOD — cook-notes UI retired; content studio grounds ONLY in publicEntries; sub-floor warning cites the recorded rationale (K1/K2 hook); JournalPanel rendered tab-wide.
- tests/journal.mjs                   NEW — 29 checks incl. the PRIVACY WALL (customer surfaces must never import journal.js).
- tests/migrations.mjs                MOD — 3 new pins on the v1→v2 fold (13 total).
- tests/invariants.mjs                MOD — K9 lockstep: DISH_RENAMES ↔ RENAME_HISTORY can never drift.
- tests/component_render.mjs          MOD — JournalPanel case + 3 markup assertions.

**B2 — the archive (K10 + M3):**
- src/archiveExport.js                NEW — buildArchiveHtml (self-contained, printable, private entries INCLUDED per decision 6a, embedded JSON for machine recovery) + buildRecordsHtml (delivery log with declared allergens, house included and marked).
- src/components/MoneyTab.jsx         MOD — "The durable record" section after the audit panel: two 44px buttons, on-device Blob downloads, explicit-action only.
- tests/archive.mjs                   NEW — 27 checks: self-containment (no external anything), print CSS, privacy inclusion, escaping, JSON round-trip, house-excluded sales counts, records table.

## One-line edits needed on Kevin's side (files not in the upload set)
- package.json: add `node tests/journal.mjs` and `node tests/archive.mjs` to the test chain (gate goes 20 → 22 commands).
- component_render.mjs's JournalPanel case runs inside the existing gate command; no package.json change needed for it.

## Verified in this scratch checkout
- node tests/journal.mjs      → 29/29
- node tests/migrations.mjs   → 13/13
- node tests/archive.mjs      → 27/27 (against the REAL dishes.js registry)
- JournalPanel render-verified through the real utils.js path, both scopes (business + dish), nudge/entry/private assertions green.
- esbuild transform clean: App.jsx, RecipesTab.jsx, MoneyTab.jsx, JournalPanel.jsx.
- Sample archive generated from the real 27-dish registry: ~39KB, one file, opens anywhere. Preview kept OUTSIDE the repo tree for the final handoff.

## Not shipped / scratch-only
- src/menu.js in this checkout is a STUB (real one was never uploaded) existing only so the render gate could bundle through the real utils.js. It is EXCLUDED from the zip. If it ever appears in a diff, something went wrong.
- node_modules, package.json, package-lock.json here are scratch tooling, not repo files.

## Flags for Kevin (no action needed yet)
- invariants.mjs and component_render.mjs changes are verified for syntax but can only fully RUN in the real tree (they import modules not uploaded). First real `npm test` proves them.
- The archive's sales summary is pure counting (units, households, first/last), costing deliberately excluded — costing is a moving target and the archive is a record.
- Optional, undecided: a digest line when the last archive download is >1 year old. Not built; say the word in B6 if wanted.
- DigestPanel under-floor list does not yet cite dossier rationale (only the RecipesTab detail banner does). Cheap follow-up if wanted.

## ROUND 2 (Jul 24, after Kevin's feedback) — read this first

### 1. THE HEADS-UP BANNER BUG — fixed, and it was broken in TWO places
Kevin: checking "show heads up banner this week" and publishing landed on no page at all.
Root cause, both halves silent on their own:
- **`publishWeek` dropped it.** The function signature already accepted `extras`, and used it for
  `requestCounts` and `favorites` — but the payload object built at line ~805 had NO notice field of
  any kind. The value never reached the worker, so no page could have shown it.
- **No customer page rendered a notice**, even had one arrived. `order.html` didn't even fetch
  `/config` — it was a fully static page.

Fix:
- `src/weekNotice.js` NEW — `extractNotice()` + `normalizeNotice()`. WeekTab.jsx was NOT available,
  so the key it passes is unknown; rather than guess one name and fail silently a second time, this
  accepts every plausible shape (`notice`, `noticeText`, `weekNotice`, `banner`, `headsUp`,
  `heads_up`; plain string or `{text|message|value, enabled|show|active}`; on `extras`, on
  `pausedOpts`, or as a 6th positional arg). **This is a compatibility shim, not a design** — collapse
  it to the one real key once WeekTab.jsx is in hand.
- `src/App.jsx` MOD — `publishWeek` gained a 6th param `noticeArg` and the payload now always carries
  `notice: extractNotice(...)`. **Always present, never conditional** — an unchecked box must publish
  `''` to CLEAR last week's banner, the same contract `pausedMsg` already uses.
- `form.html`, `menu.html`, `order.html` MOD — each renders `.week-notice` from `config.notice`.
  Shows on paused weeks too (that is exactly when a heads-up matters most), escaped like all
  customer-visible text, and silent when the field is empty or absent.
- `order.html` specifically: gained its FIRST `fetch('/config')`. Strictly additive — a dead worker
  leaves the page byte-for-byte as it behaved before, no error state.
- `tests/weekNotice.mjs` NEW (24 checks) + 12 banner checks folded into `tests/customer_pages.mjs`.
  **Verified live against the real pages before shipping**: renders on all three, silent when
  unpublished, survives paused, escaped, dead-worker-safe.

**RESOLVED — WeekTab.jsx received.** WeekTab was never at fault. It correctly sends
`extras.notice = noticeOn ? notice.trim() : ''` on BOTH publish paths (normal and paused), already
separates the TEXT from the arm-switch, already persists both, and its own comment already states
the clear-on-uncheck rule. The break was 100% in `publishWeek`. The defensive multi-key shim has
been COLLAPSED to the one real contract (`extras.notice`), and `tests/weekNotice.mjs` now pins that
contract against WeekTab.jsx's source — if the key is ever renamed, the gate fails loudly instead of
the banner silently going dead again.

**SECOND BUG FOUND while reading WeekTab: `WEEK_NOTICE_KEY` was missing from `config.js`.**
WeekTab imports it, and a missing named export is a BUILD-STOPPING esbuild error, not a warning
(verified with a minimal repro). Since Kevin's app runs, his live config.js must already define it —
meaning MY copy was stale. Now added, so my config.js is a superset and safe to drop in.
Value used: `'ltb-week-notice'`. If his live value differs, the only consequence is the saved banner
text resets once — worth a glance, harmless either way.

Remaining unverified assumption: that the worker stores unknown config fields wholesale.
Well-supported (`paused`, `pausedMsg`, and `oneBottle` were all added this way and work), but
`worker.js` was never available to confirm.

**⚠ CONFIG.JS MERGE WARNING.** My `src/config.js` descends from Kevin's batch-1 upload and adds
exactly three keys: `JOURNAL_KEY`, `CONTAINER_INVENTORY_KEY`, `WEEK_NOTICE_KEY`. The
WEEK_NOTICE_KEY discovery proves his live copy drifted ahead of mine at least once. If he has added
any OTHER key since that upload, dropping my file in would revert it. **Diff this one file before
overwriting** — it is the only file in the package where a blind replace could regress something.

### 2. M1 CONTAINER TYPING — corrected from Kevin's actual practice
The first pass assumed "dinners → 38 oz rectangle". Wrong, and instructively so:
- **32 oz round is the dinner workhorse** — a small (~4 servings) of anything saucy fits it almost
  perfectly. This is now `DEFAULT_DINNER_TYPE`.
- **8 oz round** is condiment scale (Alabama white sauce; the whole `sauces` category).
- **16 oz round** is the middle ground (desserts, fruit, breakfast, purées).
- **38 oz rectangle** is NOT the dinner default — it is for awkward components that fit nothing else:
  unbagged charred broccolini, the chicken portion of the tea-smoked chicken.
- **Pint jar** stays add-ons only, enforced by the canonical jar rule.

Structural change: `DISH_CONTAINERS` maps a dish to an ARRAY of container types, because a plated
dinner genuinely occupies several of different sizes. Seeded with only the two dishes Kevin
described. **Every other multi-component dinner is still UNDERCOUNTED** — filling this map in is a
~20-minute pass with Kevin and the highest-value correction left in the container model.

The labels.js cross-check was updated rather than deleted: it now asserts
`breakdown == labels.containerTotal + composition extras`, so drift is still caught while the richer
model is allowed.

### 3. CUSTODY — noted, deliberately not changed
Kevin: the existing ledger only distinguishes containers vs jars, not types, and "since the prices
are so close I don't really care." Custody stays a POOL, which is what was already built. Per-type
numbers remain only where they are real (owned counts, next week's demand) — those still matter for
the Sunday check because the fleet is 5 of each.

### 4. package.json — DONE, no longer a manual paste
The real file was uploaded and the chain is written: the 9 new suites are inserted right after
`migrations.mjs` so schema work fails early, before the slower page and render gates.
**Gate is now 29 commands.**

---

## Queue position
B1–B5 CLOSED · V6 phase 1 CLOSED · B6 CLOSED (M1, M2, M4) · next: B7 (R1 restaurant price check + R2 naming doc — chat only, no code) · then the single zip.

## B6 — materials (Fable)
- src/containers.js            NEW — M1 + M2. The fleet (Kevin, Jul 24): rect38 $0.52 (the dinner container), round8 $0.29, round16 $0.35, round32 $0.58, jar $1.12 (add-ons only, matching JAR_SHIPPING_NAMES exactly). Defaults 5 each / 12 jars — Kevin's stated placeholders; real counts live in localStorage, editable in the Money card.
  - THE CUSTODY INSIGHT the whole model rests on: jarsOutForRegular credits jarSwaps+containerReturns against jars and FLOORS at zero — any return beyond a customer's jars is silently discarded by the jar math. That discarded spillover is exactly the meal containers coming home on the same invoice. The meal pool consumes precisely what the jar ledger throws away: one logged number feeds both ledgers, zero double-counting, and Kevin's existing invoice habit needs no change. Plus his manual override (mealAdjust) for what no math can see.
  - Meal-container custody is a POOL (four non-jar types summed), never per-type: an untyped return cannot honestly be allocated to a type, and fake per-type custody would be precision that lies. Per-type numbers exist where they are real: OWNED (config) and DEMAND (next week's orders).
  - Forward-only from MEAL_CONTAINER_EPOCH = Jul 24 2026, jar-ledger pattern. Archived-delivered counts as gone-out; undelivered is demand, not custody. Per-lb cuts are sous vide BAGS — counted, uncosted, never in the inventory.
  - ASSUMPTION FLAGS (Kevin should confirm): dinners → rect38 (near-certain); everything else non-jar → round16 DEFAULT. If a dessert really ships in an 8 oz or 32 oz round, one line in CATEGORY_TYPE_OVERRIDES fixes demand, the Sunday warning, and M2 costs together.
- tests/containers.mjs         NEW — 30 checks. The two that matter most: (1) THE LABELS CROSS-CHECK — breakdown units vs buildLabelSheet.containerTotal on the same order, so the unit math can never drift from the labels canon (where the cantaloupe/cookies bugs lived); (2) jar typing verified THROUGH the canonical orderOutboundJars, never a copied name list. Plus spillover custody, epoch filtering, floors, the Sunday report, jar-fed availability, M2 cent-rounding.
- src/config.js                MOD — CONTAINER_INVENTORY_KEY. New optional payload field, no schema bump (v2 shape unchanged; unknown fields ignored by old code).
- src/App.jsx                  MOD — containerConfig state, boot load, saveContainerConfig, backup ring both directions, containerStatus memo, and the Sunday shortage banner on the Orders view (fires only on genuine shortage; notes meal containers still out).
- src/components/MoneyTab.jsx  MOD — "Packaging & containers" card: per-type owned editors, need-vs-own with jar-held context, meal-pool count + Kevin's adjust field, last-7-days packaging spend (M2, display-only — the card itself says "never in dish margins").
- form.html                    MOD — M4: fridge-space note in the review summary at EXACTLY 4+ Large portions or 8+ Smalls (silence below is as much the spec as the note above). Per-lb cuts never count (bags). Non-blocking. ES5.
- tests/customer_pages.mjs     MOD — five M4 checks folded into the permanent gate, asserted by ELEMENT (.container-space-note). VERIFIED LIVE first via a standalone probe against the real form.html: 4-larges fires, 3 silent, 8-smalls fires, 7 silent, submit never blocked. Full suite still needs menu.html (absent here) to run end-to-end.
- src/omakase.js               THIRD SCRATCH STUB (recipes.js imports it) — exclude from zip alongside src/menu.js and src/icons.jsx.

## package.json test-chain additions (one paste, gate goes 20 → 26 commands)
node tests/journal.mjs && node tests/archive.mjs && node tests/listControls.mjs && node tests/timeBanners.mjs && node tests/wakeLock.mjs && node tests/preserveScroll.mjs && node tests/containers.mjs && node tests/kitchen_weight.mjs

## V6 phase 1 + B5 (Opus)
- tests/kitchen_weight.mjs    NEW — V6 phase 1. Measures companionHtml at the WORST REALISTIC case (a long-tenured regular who has eaten every dish, so the passport is at full size, plus a 6-dinner current order) against the worker's 200k ceiling. Fails the build at 180k, leaving 20k of headroom; advisory warning from 150k. Proven in all three states: passing, warn-band, and failing-with-exit-1. Skips cleanly (exit 0) when companion.js is absent from a partial checkout. Also pins that the fixture actually rendered a passport, so the check can never go green by silently measuring a lighter page than the real worst case.
- src/usePreserveScroll.js    NEW — P3. Captures scrollY before a list-mutating action, restores in useLayoutEffect (before paint; useEffect would flicker the wrong position first). Only restores when explicitly armed, so ordinary re-renders never move the page, and clamps to the shortened page's real maximum so archiving rows away cannot scroll past the end.
- tests/preserveScroll.mjs    NEW — 7 checks incl. the clamping arithmetic, one-shot disarm, and a source-level assertion that the restore uses useLayoutEffect rather than useEffect.
- src/App.jsx                 MOD — V4: bulkUpdateOrders/bulkMarkPaid/bulkArchive as ONE state commit and ONE localStorage write for N orders (N sequential updateOrder calls would be N chances to hit the quota guard halfway, leaving a partial application with no record of where it stopped). Select mode off by default; per-order 44px checkboxes; bulk bar naming exact counts. P3 armed on every order mutation, single and bulk.

### V4 safety properties, audited directly against the handler logic
- Selection is scoped to VISIBLE orders — "select all" while a search is active means the shown ones, never the filtered-out ones.
- House orders cannot be selected (greyed, not hidden): $0 and outside the books, so both bulk actions are meaningless for them, and including them would make the button's count lie.
- Idempotent: a double-tap cannot double-apply.
- Empty selection is a true no-op that returns the same array reference (no spurious write).
- Leaving select mode always clears the selection, so a stale selection can never survive out of sight into a later bulk tap.

## Test tally across all batches
journal 32 · migrations 13 · archive 27 · listControls 21 · timeBanners 21 · wakeLock 6 · preserveScroll 7 · containers 34 · weekNotice 16 = **177 checks, all green**, plus kitchen_weight (skips here, runs real in Kevin's tree) and the 5 M4 checks proven live then folded into customer_pages.mjs.

## B3 — kitchen + time (Sonnet)
- src/useWakeLock.js          NEW — P1. Screen wake lock on cook+shop views. A REAL bug was caught by its own test: the first version only cleared its ref on OUR release call, so an OS-triggered drop (backgrounding to check a text) would never re-acquire on visibilitychange. Fixed by listening to the lock's own 'release' event.
- src/timeBanners.js          NEW — T1 (Sunday-midnight countdown, intake vs trailing median) + T2 (week rollover). Built on utils.groupKeyFor rather than a second week-math implementation, so it can never disagree with the Money tab about what week it is.
- src/styles.js               MOD — P2: fixed the exact 5px/12px-class cook-flow buttons (resetBtn, clearDeliveredBtn) plus confirmYes/confirmYesGreen/confirmNo to a 44px floor. NOTE: the confirm/cancel trio turned out to be SHARED across MoneyTab, OrderCard, and RegularsTab too, not cook-only — bumped everywhere since a bigger confirm button is harmless anywhere. Flagging the scope expansion rather than silently absorbing it.
- src/components/CookTabs.jsx MOD — P2: the omakase price-confirm button's exact 5px 12px padding (the one HANDOFF_18 named directly) now carries minHeight:44.
- src/App.jsx                 MOD — wake lock wired to view==='cook'||'shop'; T1/T2 state, boot load of ltb-last-seen-week, banners rendered atop the Orders view (T2 dismissed by tap, matching the house `notice` pattern — never silently, never by timer).
- tests/wakeLock.mjs          NEW — 6 checks, drives a real React render in jsdom with a faithful EventTarget-based mock (not a stub) of the Wake Lock API.
- tests/timeBanners.mjs       NEW — 21 checks incl. DST-safe day arithmetic, house-excluded/archived-included intake counting, Sunday-is-today edge case.

## B4 — list mechanics (Sonnet)
- src/listControls.js         NEW — the ONE shared helper behind V1 (sort), V2 (search), V3 (window). Dependency-free.
- tests/listControls.mjs      NEW — 21 checks.
- src/App.jsx                 MOD — V1/V2/V3 wired into the Orders view: sort dropdown, status filter, search box (name/dish/note), windowed rendering (50 at a time, "show N older") on BOTH the active and delivered sections. Control bar only renders past 6 orders — invisible until it's needed.
- src/components/RegularsTab.jsx MOD — V5 fixed (analytics table rendered every regular, always → now windowed + searchable, alias-aware via regularAllNames) and V2 extended to the plain regulars list below it, with its own window. Both preserve the true empty-state check separately from the "no matches" message.
- V6 phase 1 (weight gate test) NOT built yet — held for the Opus batch per Kevin's instruction, alongside B5.

## Verification boundary (read before assuming more was checked than was)
- Pure-logic suites (journal, migrations, archive, listControls, timeBanners, wakeLock): 117 checks total, all run for real against real code, all green.
- JournalPanel (B1/B2): actually BUNDLED and RENDERED via esbuild+jsdom against the real utils.js/dishes.js, because its dependency tree is shallow.
- App.jsx, RegularsTab.jsx, CookTabs.jsx (B3/B4 edits): only SYNTAX-TRANSFORMED (esbuild parses the file, confirms valid JS/JSX, catches unclosed tags and the like) — NOT bundled or rendered. Their real dependency trees pull in passport.js, omakase.js, favorites.js, dishCosting.js, menu.js, WeekTab.jsx, and others that were never uploaded. Attempting a full render would mean stubbing half the registry, which risks false confidence from stub behavior rather than real signal — so I stopped short rather than fake it. The real tests/component_render.mjs and tests/invariants.mjs gates will exercise these for real once run against the full tree; that first `npm test` is the real proof, same as flagged for B1/B2.
- Two scratch-only stub files exist in this checkout and MUST be excluded from the final zip: src/menu.js (from B1) and src/icons.jsx (added this batch, covers every lucide icon name CookTabs.jsx/RegularsTab.jsx import). Both exist only so bundling/rendering was possible against the real files that WERE uploaded.
