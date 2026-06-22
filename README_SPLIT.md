# LTB Order Tracker — Module Split (v9.9-split-1)

The 9,824-line monolith JSX has been split into 18 files. Source is in `src/`. A working `app.js` is included as a known-good fallback in case the Cloudflare build doesn't go smoothly the first time.

## What was verified
- `npm install && npm run build` runs clean (no errors, no warnings)
- Bundle parses cleanly in Node (no syntax errors, no TDZ traps)
- All 452 `styles.X` references resolve against the 456 defined keys
- All major components and key functions present in the output bundle
- 0 "Dynamic require of" hits

## File map

```
package.json           tells Cloudflare how to build
entry.jsx              entry point (imports App)
app.js                 built bundle (KEEP this as a fallback — see step 3)
src/
  App.jsx              main LTBOrderTracker component
  styles.js            palette + the giant `styles` object (~3,000 lines)
  icons.jsx            inlined SVG icons
  menu.js              ALL_DINNERS, ALWAYS_MENU, categories, statuses
  recipes.js           RECIPES, shopping-list logic, reheat blocks
  config.js            storage keys, worker URLs, tokens, VAPID public key
  utils.js             all pure helpers (pricing, regulars, photos, AI api, CSV parsers)
  components/
    ImportModal.jsx
    RegularsTab.jsx    (Tab + Form + Profile + LinkPrompt)
    WeekTab.jsx
    OrderInputs.jsx    (StatsBar, QtyControl, PasteOrderCard, AmendOrderCard, CsvImportCard, ReviewModal)
    OrderForm.jsx
    OrderCard.jsx
    Modals.jsx         (InvoiceModal, ReheatModal, WeightPhotoModal)
    CookTabs.jsx       (CookingList, DeliverList, ArchiveDeliveredButton)
    ShoppingList.jsx
    MoneyTab.jsx       (MoneyTab + ProfitChart + OrderPhotos)
```

## What goes where in GitHub

Repo root (alongside your existing `index.html`, `form.html`, etc.):
- `package.json`
- `entry.jsx`
- `app.js` (this overwrites your current `app.js` with a freshly-built copy — same code, just compiled from the split sources)
- `src/` folder (entire thing, with all subfolders)

Nothing else in your repo gets touched. `index.html`, `manifest.json`, `sw.js`, `ltb-icon.png`, `ltb-worker-v3.js`, the HTML pages, the PDF — all unchanged.

## Deployment plan (3 steps)

### Step 1 — Upload everything to GitHub
Drag the contents of this folder into your repo. The `src/` folder will be created as a new directory.

Confirm by visiting your repo: you should see `package.json`, `entry.jsx`, the updated `app.js`, and a new `src/` folder.

### Step 2 — Verify the app still works
Because the new `app.js` was built from the split sources, your app should work identically right now. Open it in your iPhone PWA. If anything looks broken, tell me before doing step 3.

### Step 3 — Wire up Cloudflare to build automatically (optional but recommended)
This is the part that ends the "Kevin asks Claude to rebuild the bundle every time" cycle. You'll do this in the Cloudflare dashboard.

I'll walk you through this in chat once steps 1–2 are confirmed working. The short version:
- Go to Workers Assets settings for `ltb-app`
- Add a build command: `npm install && npm run build`
- Save

After that, anytime you push source changes to GitHub, Cloudflare runs the build and the app updates. You stop touching `app.js` directly.

## If Cloudflare's auto-build fails for any reason
The pre-built `app.js` is already in the repo and will continue serving your app exactly as it does today. So step 3 is reversible — if it doesn't work, we turn off the build command and you're back to the manual flow with no downtime.

## What was NOT done in this session
These are still pending from the handoff doc:
- Large Gumbo → $75 (orders closed Sunday, but I didn't make this change in the source)
- `menu.html` back-to-start link
- Sauce & Add-on Inventory border: orange → teal (needs verification)
- Custom domain setup

All easier to do now against the modular structure. Tell me which to tackle first.
