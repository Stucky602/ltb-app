# Delta: renames, dossier cleanup, and four features

Only changed files. `worker.js` must be pasted into the Cloudflare dashboard by
hand as always; nothing deploys it.

## The renames (the real fix behind that screenshot)
Added to `DISH_RENAMES` with matching `RENAME_HISTORY` rows, per your notes:
- `Curry of the Week` -> `Indian Style Curry`
- `Cumin Mushroom Noodles` -> `Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice`
  (recorded as NOT a retirement: the dish never left, variants were added and
  the name grew)
- `Chicken Breast` -> `Air-Chilled Chicken Breast`

Until now those three sat in order history under names the registry did not
know, so they never canonicalized. That was quietly splitting their passport
stamps, per-dish sales counts, and dossier lookups. The nudge box was the only
reason it surfaced at all.

## The box is gone
Removed from the dossier entirely, along with the `orders` and `knownNames`
props it needed. The underlying signal did NOT disappear: it moved to the
Monday briefing as "Names the app does not recognize", where it belongs, since
it is a data-integrity issue and not something to show on every dish.

## What shipped
1. **On this day** — what you wrote on this calendar day in a previous year,
   in the briefing. Excludes today's own writing (not a memory) and `undated`
   entries (their date is a migration artifact, not a real day).
2. **Orphaned-name detector** — finds the next case of the rename bug above.
   NOT a gate test on purpose: order history lives in localStorage, so no
   build-time check can see it. It runs where the data is.
3. **Customer questions are logged.** `/ask` was answering questions and
   storing nothing. The worker now keeps a rolling `ask-log` (200 cap) and
   serves it at `GET /ask-log?token=`. There is a "Pull customer questions"
   button in the briefing. Logged BEFORE the 5-question cap check, because
   somebody hitting the limit is itself a signal that the page left them with
   more questions than it answered.
4. **The archive front door** — `ARCHIVE_INTRO` in `archiveExport.js`, in your
   voice, addressed to your son. **Edit it freely.** It is the one part of the
   archive not generated from data, and it is what turns the file from a
   database into something written to a person. A test enforces no em-dashes.

## Not built, and why
- **Reheat rescue + acknowledged feedback** (the learning loop) needs
  `src/companion.js`. That is the customer surface where the taps happen and I
  do not have it.
- **The per-dish pairing toy** needs `src/weekPlanner.js` (that is where
  `weekOneBottle` lives) plus wherever per-dish pairing data is stored.

Send those two files and both go in the next pass.

## Files
- src/utils.js                    MOD — 3 renames + 3 history rows
- src/journal.js                  MOD — entriesOnThisDay, orphanedDishNames
- src/archiveExport.js            MOD — ARCHIVE_INTRO front door
- src/App.jsx                     MOD — askLog state, pullQuestions, props
- src/components/JournalPanel.jsx MOD — retirement box removed, props trimmed
- src/components/DigestPanel.jsx  MOD — on-this-day, orphans, questions
- src/components/RecipesTab.jsx   MOD — dropped the two unused props
- worker.js                       MOD — ask-log KV + GET /ask-log  (DASHBOARD PASTE)
- tests/journal.mjs               MOD — 58 checks
- tests/archive.mjs               MOD — 40 checks
- HANDOFF_20_LTB_DEEP_JUL24.md    NEW — extended in place from 19

No package.json change; both suites are already in the gate.
