# DAD'S KITCHEN: PHASE 1 RECORD, AND THE PHASE 2 BRIEF

**Version:** 1.0
**Created:** August 5, 2026
**Parent:** `DADS_KITCHEN_ROWAN_APP_ARCHITECTURE_v2_0_REPO_GROUNDED.md`, section 25
**Ships with:** `LTB_PAIRINGS_AND_PHASE1.zip` (14 files + this MD)
**Repo state after this lands:** v10.2.0, gate **85** commands, schema v5, zero recipe versions cut.

---

## 0. WHAT HAPPENED TO PHASE 0

**It was already built.** `DADS_KITCHEN_PHASE_0_BRIEF.md` v1.0 was written Aug 2 and
executed before this chat opened. All four workstreams verified against the tree, not
against a document:

- `fromRowan()` reads `at` / `note` / `familyNote` with no dead fallbacks, and handles the
  array shape. A real `makeEntry()` round-trips through `buildCorpus()` with date, note,
  and family note intact.
- `src/rowanArchive.js` exists and `archiveExport.js` calls it. It covers **nine** stores,
  not the eight the brief named: `accommodations` joined after the brief was written and
  the completeness gate caught it.
- `RowanTab.jsx` is 499 lines with the five specified sub-tabs.
- Both panes exist and mount; `app_render` clicks all five sub-tabs and asserts the
  absences (no session counts, no streaks, no favourite role, no overdue framing).

The completeness gate was proven able to fail by deleting the `notesRowan` renderer and
watching it go red by name.

**The brief's own numbers are stale and its file list is short.** It says gate 81 or 82;
the tree said 84 and now says 85. It does not name `src/accommodation.js` or
`src/rowanArchive.js`, which did not exist when it was written. Its §2 instruction stands
and is the reason this was caught: the tree wins.

---

## 1. THE FOUR RULINGS PHASE 1 IS BUILT ON

Kevin, Aug 5, answering the scoping questions:

1. **"The first bundle is for long term memories. Yeaaaars down the line."**
2. **"Anything related to him goes."**
3. **"It can all publish without my approval. Age appropriate in this case isn't anything
   offensive or anything like that."**
4. **"I don't plan on there being an unpublished version. Every publish should just be
   syncing his app with mine basically."**

Each one **deleted** a subsystem, and that is worth recording because the deleted things
are what a later reader will otherwise propose again:

| Ruling | What it deleted |
|---|---|
| 1 | Age gating at publish time. The audience tag TRAVELS; the companion decides at read time. A bundle that dropped older material would need rebuilding to get it back. |
| 2 | The curation step. Every store is answered explicitly instead. |
| 3 | The approval queue, the pending state, the review UI. A note written today would otherwise sit invisible until Kevin remembered to tick it, which is the opposite of a record for later. |
| 4 | Revocation, tombstones, and the delta format. A snapshot makes unpublishing free: delete it in LTB, publish again, gone. |

**Ruling 4 is what makes ruling 3 safe.** With no approval gate and no revocation, the
only way to unsay something is to delete it and republish, and only a snapshot propagates
that. A delta format would have to carry tombstones, which is a revocation system wearing
a different name.

---

## 2. THE ONE GUARDRAIL ADDED TO "ANYTHING RELATED TO HIM"

**Other people's words are not his.** Household memories, passport cabinets, and
accommodation requests are written BY customers ABOUT their own families and their own
bodies, and they sit in the same backup as Rowan's material. "Related to him" is not the
same as "in the same app."

Excluded by name with reasons, alongside customer names, addresses, and order history.
`tests/rowan_publication.mjs` loads a payload where every held-back store contains a
marker string and asserts the marker appears nowhere in the built bundle. It asserts
against the RENDERED bundle rather than the registry, because a projector can reach a
store the registry does not name.

**If this guardrail is wrong, say so and it comes out in one line.** It was applied rather
than asked because shipping a customer's dietary restrictions into a child's app is not
the kind of thing to get wrong while waiting for an answer.

---

## 3. `PERSONAL` IS THE SELECTOR, NOT `PRIVATE`

Journal entries carry both flags and they are different axes. `private` means
business-internal, do not show a **customer**. `personal` means written for his son.

Rowan is not a customer, so `private` is not the filter. Filtering on it would drop every
provenance entry, and provenance is the most Rowan-relevant material in the journal: where
a dish came from, who taught it, what it is adapted from. Provenance entries default to
`personal: true`, so **the 26 harvested dossier entries travel**.

---

## 4. WHAT SHIPPED (Phase 1)

| File | What it is |
|---|---|
| `src/rowanPublication.js` NEW | The contract. `PUBLISHED_STORES` (7 projectors, keyed by backup field name), `NOT_PUBLISHED` (33 fields with stated reasons), `buildRowanBundle()`, `bundleFingerprint()`, `describeBundle()`. **No network call, and a test asserts there never is one.** |
| `tools/rowanDryRun.mjs` NEW | `node tools/rowanDryRun.mjs [backup.json] [--out file.json]`. Builds twice, compares fingerprints, checks every field in the source is answered, prints what the bundle does NOT contain, writes the file. Transmits nothing. |
| `tests/rowan_publication.mjs` NEW | 32 checks. Gate command 85. |
| `tests/journal.mjs` | `src/rowanPublication.js` added to `PROTECTED`. It reads every protected store at once, so a customer surface reaching it would leak all of them together rather than one. |

**Published:** `rowanLog`, `rowanQuestions`, `notesRowan`, `rowanBoards`, `rowanRoles`,
`derivatives` (Rowan audiences only), `journal` (`personal` only). Plus a `dishIndex` of
the dishes his own records point at, so the companion can print "Bolognese" instead of an
id. **That index is deliberately not the recipe book** — shipping recipes is a separate
decision nobody has made.

**Media is carried by reference:** key, kind, bytes, checksum. No bytes, no URLs, and no
tokens, because a bundle is a file that can be mailed and a signed URL inside one is a
credential someone can forward. Asserted.

**Every bundle reports what it does not know**, in the Chronicle's spirit. An empty store
prints "nothing recorded yet" rather than vanishing.

**Determinism is the point of the dry run.** Same stores in, same fingerprint out, with
`builtAt` excluded. Build twice and compare: any difference is the builder being
non-deterministic rather than the record having changed.

### Why the dry run reads a backup file rather than the app

The record lives in one device's localStorage and a CLI tool cannot reach it. Building a
second export path would mean two definitions of "current state" that can disagree. The
backup payload **is** the state, it already exists, and Kevin already knows how to produce
one. `PUBLISHED_STORES` is keyed by backup field name for exactly this reason.

---

## 5. THE ONE CONFLICT KEVIN SHOULD RULE ON

**Derivatives are the single place an existing in-code contract overrides ruling 3.**

`derivatives.js` states at its own normalizer that a derivative with no `approvedAt` "is a
draft and must not be projected anywhere." That is not an approval queue — it is the
difference between finished words and half-written ones, and a draft is the second kind.
So drafts and superseded text stay behind while everything finished travels with no
further tick required.

**The consequence, stated because this kind of emptiness reads as a bug:** with zero
approved derivatives today, that section is empty forever. One line from Kevin flips it to
publish drafts too.

---

## 6. THE ANSWER PHASE 1 WAS BUILT TO PRODUCE

Run the dry run against a real backup export. On the repo as it stands, every published
store is empty except whatever is on Kevin's device, and he has said it is "very little."

If that holds, **the next work is content, not code.** That is the finding, not a failure:
§9 of the Phase 0 brief said the thinness of the first bundle would tell Kevin whether the
next work is code or content, and Phase 1 exists to ask that question cheaply rather than
to answer it optimistically. Building Phase 2's transport before there is anything worth
transporting would be building a door for an empty room.

---

## 7. PHASE 2 BRIEF: THE WORKER AND ENROLLMENT

**Not started, deliberately.** Everything Phase 2 needs is either a Cloudflare resource
only Kevin can create, or a decision only he can make. Writing transport against an
endpoint that does not exist would be the **sixth** instance of the wired-on-one-side class
this repo has already paid for five times (feature flags, the version-stamp write sites,
Tex-Mex rice, WalkEngine, `priceDisplay`). Every one of those shipped green, looked
finished, and did nothing.

### 7.1 What Kevin must create, in order

1. **A `dads-kitchen` repo.** Separate, per the architecture. The companion is a separately
   deployed, separately authenticated product.
2. **A `rowan-library-worker`** in Cloudflare, with its own KV namespace and its own R2
   binding. **Never reuse `PUBLISH_TOKEN`.** A new `ROWAN_PUBLISH_TOKEN`.
3. **DNS for `rowan.ltbaustin.com`** and a Cloudflare Access policy on it.

Until 1 through 3 exist there is nothing for LTB-side transport code to point at, and a
config field holding a placeholder host is a live misconfiguration waiting to be forgotten.

### 7.2 The decisions that block the build

- **How many devices, and who holds them?** The architecture says one-time enrollment to a
  revocable device session. For a bundle aimed years ahead, the realistic reader count is
  one, later. That may collapse the whole enrollment design into "Kevin installs it on one
  device," which is a much smaller build.
- **Does the bundle land as a file or a POST?** With snapshot semantics and a reader years
  away, a periodically exported file that Kevin drops somewhere may beat a live sync path
  entirely. The sync only earns its complexity if something reads it soon.
- **Where do the media bytes go?** The manifest names keys in LTB's R2. The companion
  either gets its own R2 and the bytes are copied on publish, or it reads LTB's behind a
  signed route — which is the same unsolved problem blocking the `visualCues` flag today.
  **These are one problem, not two**, and solving it once fixes both.

### 7.3 What Phase 2 must NOT do

- Reuse the LTB publish token.
- Couple a Rowan publish to the weekly menu publish.
- Read LTB localStorage cross-origin.
- Put a URL or a token inside a bundle. The manifest carries keys and checksums; the
  transport resolves them at move time, holding the credential itself.

---

## 8. ALSO IN THIS ZIP: THE DUPLICATED DRINK PAIRINGS

Unrelated to Dad's Kitchen, reported by Kevin from the live catalog.

**Fifteen of twenty-five dinner cards printed "Goes well with" twice**, over the identical
five drinks. Pre-existing in `LTB.zip` and untouched by either fix zip; it came from the
Aug 3-5 catalog collapse.

**Why an 84-command gate never saw it.** `syncMainMenu`'s own check called `seg.match()` on
a non-global regex, which returns the FIRST block only. It found that block matched canon
and returned. The invariants read prices out of these cards and never counted anything
structural.

**How they got there, which is the same fact.** The collapse added the new `<details>` form
without removing the old `<div>` form. The next `--write` matched the `<div>` (earlier in
the card), replaced **that** with the canonical block, and left the `<details>` standing.
Two identical blocks, and from then on the first match equalled what the tool wanted, so it
returned early forever.

**Fixed at the tool, not by hand.** `syncPairings` now matches ALL blocks in a card: the
first becomes canon, every later one is deleted, and duplication is reported by name rather
than silently repaired, because a second block reappearing would mean something upstream is
inserting. Source repaired by running the tool, then `buildPages --write`. 40 blocks → 25,
`main-menu.html` down about 9 KB.

**Two new gates in `tests/customer_pages.mjs`**, counted through the DOM rather than by
grepping the page: no catalog card carries more than one pairings block, and no card names
the same drink twice. The weekly menu gets the same two assertions per card even though it
builds its block at render time and cannot inherit the fault, because both surfaces read
the same canon. Proven able to fail by injecting a duplicate.

Canon itself was clean: no dish repeats a drink inside its own list.

### Reported, not fixed

**The seven bag-steak cards each carry THREE `<details>` blocks all labelled "Reheating and
notes"**, with different content: the sear instructions, then `+ $2.00 per bag for
seasoning and packaging`, then `Averages approx. 0.75 lb per piece`. The last two are
ORDERING facts hidden behind a reheating label, which is the exact failure the handoff
named on Aug 3 ("the first collapse buried ordering facts under a Reheating label").

Not fixed here because the repair is a wording and visibility call, and this repo's
standing rule is not to guess Kevin's wording. The likely right answer is that the
surcharge and the average weight are visible lines next to the price, not collapsibles.

---

## 9. ALSO IN THIS ZIP: THE OMAKASE CAP, AND FOUR CRASHES OF ONE CLASS

Reported by Kevin Aug 5, both unrelated to Dad's Kitchen.

### 9.1 The charge was capped, and the cap ratcheted down

**Two compounding defects.** `chargeNum` was `Math.min(budgetMax, ...)` and the input
carried `max={budgetMax}`, so the customer's stated figure was a hard ceiling in two
places at once. And `budgetMax` falls back to `item.price` when nobody stated one, while
the save OVERWRITES `item.price` with the charge — so every save pulled the ceiling down
onto the last charge, permanently, with no way back up. Reducing a total once locked it
there.

**Kevin's ruling: "the max amount is whatever I type. If I type something insane I can get
a prompt though."**

- No clamp, and no `max` attribute on the input (a `max` on a number input is the same
  ceiling enforced by the browser, in a second place).
- The stated figure sits beside the field as information. Over it, the field border and
  the label turn gold and a line states the overage.
- A wild number gets ONE confirm at save: five times the stated figure, or past $2,000
  when nothing was stated. **The trigger is deliberately wide** — a prompt that fires on
  an ordinary overage is one he learns to dismiss without reading, and then it protects
  nothing.
- `budgetMax` is frozen the first time the charge actually MOVES. Only then, because
  stamping it on an unchanged save would leave `price === budgetMax` on an order that
  never had a stated budget, and `omakasePriceUnsettled` reads exactly that pair as
  "still sitting at the customer's max" — a fresh false alert on the deliver screen and
  in the digest, caused by a fix for something else.

### 9.2 "Can't find variable: returnSummary" — and it was four, not one

**Not omakase-specific.** `OrderForm.jsx` called `returnSummary` in its component body
without importing it, so EVERY tap of Edit threw before the form drew a single field. The
bundle carried one reference and zero definitions.

**Fixing that one name would have produced the identical bug report with a different name
in it:** `depositsOutFor()` at line 204 was missing exactly the same way, hiding behind
the first crash.

`tests/jsx_symbols.mjs` closed this class for `<Component>` references on Jul 30 and could
not see a plain function call. Extended, and **it found two more on its first run**:

- **`ageAt()` in `RowanTab.jsx`** — called by the **Save it** button for Notes to Rowan.
  Pressing it threw and the note was never written. That is the store Phase 1 exists to
  publish, and it may be a large part of why the record holds so little.
- **`setEquipment()` in `App.jsx`** — an orphan of the Jul 30 equipment removal, inside a
  `saveEquipment` callback nothing calls. Dead, but it would have thrown the instant
  anything invoked it. Removed; `EQUIPMENT_KEY` stays in `config.js` as intended.

**The check is deliberately narrow:** a name is flagged only when EVERY occurrence in the
file is a call site, and a call site has no space before its paren. That makes it blind to
a free global called twice, and blind to `fn (x)` written with a space. The trade is
worth it — a wider rule needs real scope analysis, and a guard that cries wolf on ordinary
code gets deleted the first time it is inconvenient.

**Three passes to make it honest, and one is worth carrying forward.**
`accept="image/*"` opens a block comment as far as a naive stripper is concerned, and the
lazy match then ran to the next real `*/` and swallowed several hundred lines of
`OrderInputs.jsx` including two `useState` declarations, which the check then reported as
missing. Same family as the apostrophe that ate declarations out of `ReceiptScan.jsx`.
Both checks now share one stripper that requires a real comment to open at a line start or
after whitespace. The other two passes: method definitions (`constructor(props) {`) read
as calls, and JSX prose (`Reheat (what the customer sees)`) read as calls until the
no-space rule went in.

---

## 10. VERIFICATION

- Three consecutive full gate runs, **85 commands**, exit 0, on a tree rebuilt from
  `LTB.zip` + both fix zips + this zip.
- The omakase charge, the Edit crash, and all four free-identifier bugs verified fixed.
- `npm run build` (the literal Cloudflare command) exit 0.
- `snapshotVersions`: all 27 dinners match, **zero versions cut**.
- New gates proven able to FAIL, then restored: a forgotten store, an injected customer
  leak, a duplicated pairings block, and the exact shipped `returnSummary` shape.
- `package.json` changed by exactly one added command; every test file it names is either
  already on the repo or in this zip.
- File list built by diffing the tree against the pushed baseline, not by hand.

---

## 11. OWED AFTER THE PUSH

- Hard-refresh once past the old service worker.
- Look at the catalog on a phone and confirm each dinner shows one "Goes well with".
- Export a backup and run `node tools/rowanDryRun.mjs <that file>`. That is the Phase 1
  deliverable and the answer to §6.
- Rule on §5 (derivative drafts) and §2 (the customer-content guardrail).
- Open an order with an omakase on it, tap Edit (it used to throw), then push the charge
  ABOVE what they said and confirm the gold overage line reads right.
- Try saving a Note to Rowan. That button never worked; it should now.
- Decide §7.2 before any Phase 2 work starts.
- **Note for whoever runs the gate locally:** `npm run build` leaves `app.js` at the repo
  root, and `checkRepoStructure` fails on a committed `app.js` by design. Delete it after
  building. It is not a repo file and is not in this zip.
