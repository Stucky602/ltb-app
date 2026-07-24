# Round: two bug fixes + four features

Delta only. Nothing else in the repo moves.

## BUG 1 — "body is disturbed or locked" (mine, from last round)
A `Response` body is a one-shot stream. `publishWeek` already ended with
`return res.json()`, and the dropped-fields check I added last round read the
body a SECOND time. The publish itself succeeded (which is why your notice went
live), then the function threw at the very end and WeekTab reported a failure
for work that had landed. That is the worst shape a bug can take, because it
teaches you to distrust a success message. Now parsed exactly once and reused.

## BUG 2 — the order window was walkable, in TWO places
You flagged `main-menu.html`. There was a second one: **`menu.html`'s "Place
Your Order" CTA was also ungated**, and that is your most-used path. Neither
checked the day. `form.html` had no self-gate at all, so any link reached it on
any day.

Fixed at the source: **form.html now gates itself** (Sun + Wed-Sat open,
Mon/Tue closed, same rule as order.html) and renders a plain "orders are
closed" panel with NO form. Link-level gating is whack-a-mole; the form is the
one place a gate cannot be walked around. Both links now render as plain text
outside the window instead of dead links.

`?preview=1` on form.html bypasses the gate so you can still check the form on
a Monday. Say the word if you would rather not have that.

The heads-up banner still renders on a closed day, since a heads-up matters
just as much when nobody can order.

7 checks folded into `customer_pages.mjs` with a FROZEN clock, so they can
never flake depending on which weekday the gate runs.

## FEATURE 1 + 2 — one question a week (NEW `src/dossierPrompts.js`)
Appears in the Monday briefing. One question, about one dish, chosen because
its record is the thinnest thing on this week's menu. Priority order:
1. a dish with NOTHING written
2. a dish nobody has written about in 6+ months
3. the thinnest record on the week

**It never reads order history.** History was backfilled, so "first time ever
cooked" measures data entry, not reality — the same trap that killed the
passport rare badge. Every trigger reads this week's menu plus timestamps you
wrote yourself. A source-level test enforces that the engine cannot touch
orders.

**Self-clearing**: computed from current state, so answering moves the target
to the next dish by itself. No dismissal flag, nothing to persist, nothing to
get out of sync. Wording rotates weekly so it does not become wallpaper.

## FEATURE 3 — the arc view
"Read as an arc" toggle on any dossier with more than one entry. Flips to
oldest-first, so the dossier reads as how the dish changed rather than as a
feed. Newest-first stays the default.

## FEATURE 5 — Queso: already done, nothing built
`Queso` is already in `REPORTABLE_ALWAYS_ITEMS`, so it is already selectable in
the Recipes picker and already has a dossier. Cookies, Fudge, and Brownies come
along with it. That predates this session.

## FEATURE 9 — the interchange contract
The archive's embedded JSON now carries `schema` (a version) and `fields` (a
self-describing map of its own shape). It is the seam the separate teaching app
will read years from now, from a file written today, so it documents itself
rather than depending on this codebase's comments. Rules for changing it are in
the file.

## Files
- src/App.jsx                     MOD — single body read; DigestPanel props
- src/dossierPrompts.js           NEW — the weekly question engine
- src/components/DigestPanel.jsx  MOD — renders the question
- src/components/JournalPanel.jsx MOD — the arc toggle
- src/archiveExport.js            MOD — versioned interchange contract
- form.html                       MOD — the authoritative order-window gate
- menu.html                       MOD — gated CTA
- main-menu.html                  MOD — gated "Go order"
- package.json                    MOD — gate 29 -> 30
- tests/dossierPrompts.mjs        NEW — 16 checks
- tests/archive.mjs               MOD — 36 (schema pins)
- tests/customer_pages.mjs        MOD — 7 order-window checks, frozen clock
