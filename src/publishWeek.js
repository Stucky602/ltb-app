// publishWeek.js — the path that puts a week in front of customers, plus the
// two calls that read and roll back publish history.
//
// THIS IS THE FILE WITH THE SHARPEST EDGE IN THE APP
// Everything else here can be fixed by reloading. A bad publish is visible to
// every customer immediately, and two of its failure modes have already
// happened:
//
//   1. THE BODY IS READ EXACTLY ONCE. A Response body is a one-shot stream.
//      This function once read it twice, and because the second read threw
//      "body is disturbed or locked" AFTER the publish had already landed, a
//      successful publish reported failure. That is the worst shape a bug can
//      take: it teaches you to distrust a success message that was telling the
//      truth. The parsed value is captured once and reused. Do not add a second
//      `await res.json()` or `await res.text()` anywhere below.
//
//   2. FIELDS GET SILENTLY DROPPED IN TRANSIT. The worker rebuilds its stored
//      config from its own field list and discards anything it does not
//      recognise. `notice`, `oneBottle`, and `paused` have each been lost that
//      way, fully built here and fully rendered on the customer page, dying in
//      the middle. The worker now returns a `dropped` array and this raises a
//      banner naming it. A publish that quietly loses data must never look
//      like a clean publish.
//
// Extracted from App.jsx unchanged. No hooks; the three setters it needs
// arrive in a deps bag, and App.jsx keeps a thin useCallback with the original
// [recordAudit] dependency.

import {
  WORKER_BASE, PUBLISH_TOKEN, CONFIG_PUBLISH_URL, WEEK_LEDGER_KEY,
} from './config.js';
import { ALL_DINNERS, PER_LB_ITEMS, buildMenu } from './menu.js';
import { PIPELINE_DISHES } from './pipelineDishes.js';
import { normalizeFlags } from './featureFlags.js';
import {
  isSplitEligible, containersForPack, surchargeCentsFor, describeFootprint, containerCount,
} from './splitPackaging.js';
import { CONTAINER_TYPES } from './containers.js';
import { dishIdFor } from './dishIdentity.js';
import { saveJSON } from './utils.js';
import { recordWeek } from './weekLedger.js';
import { extractNotice } from './weekNotice.js';
import { weekOneBottle } from './weekPlanner.js';
import { SOURCES, auditEntry } from './auditLog.js';

  // Publish history: the config drives the entire customer surface and had no
  // undo. The worker keeps the last few; these two just read and restore.
export async function fetchConfigHistory() {
  const res = await fetch(`${WORKER_BASE}/config-history?token=${encodeURIComponent(PUBLISH_TOKEN)}`);
  if (!res.ok) throw new Error('Could not load publish history.');
  return res.json();
}
export async function restoreConfig(index) {
  const res = await fetch(`${WORKER_BASE}/config-restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: PUBLISH_TOKEN, index }),
  });
  if (!res.ok) throw new Error('Restore failed.');
  return res.json();
}

export async function publishWeek(currentWeekDishes, menuPdfUrl, weekLabel, pausedOpts, extras, deps) {
  const { setWeekLedger, setNotice, recordAudit } = deps;
  const activeMenu = buildMenu(currentWeekDishes || []);
  const toVariants = (item) => {
    const info = PER_LB_ITEMS[item.name];
    if (info) {
      return {
        name: item.name,
        perLb: true,
        pricePerLb: info.pricePerLb,
        avgWeightLb: info.avgWeightLb,
        // Only present when a package holds more than one piece. Absent
        // otherwise, so the payload does not grow a null on every steak.
        ...(info.piecesPerUnit > 1 ? { piecesPerUnit: info.piecesPerUnit } : {}),
        variants: [{ label: 'By weight', price: info.pricePerLb, cost: info.costPerLb }],
      };
    }
    // PACK OPTIONS. Emitted per variant, and ONLY for variants Kevin has
    // declared splittable — SPLIT_PACKAGING is empty today, so this adds
    // nothing to the payload until he runs the two-night walk. form.html is
    // standalone ES5 and cannot import the registry, so eligibility, container
    // makeup, footprint wording, and surcharge all have to travel with the
    // published week or the page cannot offer the choice at all.
    //
    // The footprint text is generated HERE rather than on the page, so the
    // words a customer reads come from the same container map the kitchen packs
    // from and cannot drift into a second description of the same thing.
    const packsFor = (label) => {
      if (!isSplitEligible(dishIdFor(item.name), label)) return null;
      const id = dishIdFor(item.name);
      const family = containersForPack(id, label, 'family');
      const twoNight = containersForPack(id, label, 'twoNight');
      if (!family || !twoNight) return null;
      return {
        family: { footprint: describeFootprint(family, CONTAINER_TYPES), containers: containerCount(family) },
        twoNight: {
          footprint: describeFootprint(twoNight, CONTAINER_TYPES),
          containers: containerCount(twoNight),
          surchargeCents: surchargeCentsFor(id, label, 'twoNight'),
        },
      };
    };
    return {
      name: item.name,
      variants: (item.variants || []).map(v => {
        const packs = packsFor(v.label);
        return {
          label: v.label, price: v.price, cost: v.cost || 0,
          ...(packs ? { packs } : {}),
        };
      }),
      ...(item.spotlight ? { spotlight: true } : {}), // spotlight dinners route to their own form header
      ...(item.options ? { options: item.options } : {}), // form.html renders pickers from this (Batch 3)
      ...(item.diet ? { diet: item.diet } : {}), // menu.html dietary filter reads veg/pesc tags from this
      // menu.html renders the compressed price block from this; the order form
      // ignores it and keeps offering every variant. Without this line the
      // page's priceDisplay branch is dead code and the weekly menu shows the
      // Cumin as twelve rows. Presentation only — price truth stays in variants.
      ...(item.priceDisplay ? { priceDisplay: item.priceDisplay } : {}),
    };
  };
  const allDinners = (activeMenu.dinner || []).map(toVariants);
  const req = (extras && extras.requestCounts) || {};
  // Customer favorites, earned from repeat orders and feedback rather than
  // declared. Computed at publish so the customer pages need no history.
  const favSet = new Set(((extras && extras.favorites) || []).map(f => f.name));
  const allDinnersTagged = allDinners.map(d => {
    let out = d;
    if (req[d.name] > 0) out = { ...out, requested: true };
    if (favSet.has(d.name)) out = { ...out, favorite: true };
    return out;
  });
  const dishes = allDinnersTagged.filter(d => !d.spotlight);
  const spotlight = allDinnersTagged.filter(d => d.spotlight);
  const fruit = (activeMenu.fruit || []).map(toVariants);
  const desserts = (activeMenu.desserts || []).map(toVariants);
  const addons = (activeMenu.addons || []).map(toVariants);
  const bag = (activeMenu.bag || []).map(toVariants);
  const sauces = (activeMenu.sauces || []).map(toVariants);
  const payload = {
    token: PUBLISH_TOKEN,
    dishes, spotlight, fruit, desserts, addons, bag, sauces,
    menuPdfUrl: menuPdfUrl || '',
    weekLabel: weekLabel || '',
    // One bottle that covers the week, computed from the registry's pairing
    // data at publish time so the customer pages need no drink logic.
    ...(() => { const ob = weekOneBottle(currentWeekDishes || []); return ob ? { oneBottle: ob } : {}; })(),
    // Week off: the form and menu page show a friendly notice instead of an
    // empty menu. Publishing a normal week clears it.
    ...(pausedOpts && pausedOpts.paused
      ? { paused: true, pausedMsg: String(pausedOpts.pausedMsg || '').slice(0, 200) }
      : { paused: false, pausedMsg: '' }),
    // The pipeline roster, straight off canon. pipeline.html renders these
    // cards and the worker validates /votes against them, so publishing the
    // roster is what turns "add a pipeline dish" from five steps across three
    // systems into the same one tap as everything else on the customer site.
    //
    // Testing dishes only. A dish carrying status:'shipped' has graduated to
    // the real menu and must not be votable, which is the same rule
    // tools/syncPipeline.mjs enforces against the worker and the page.
    //
    // `key` is the frozen contract: it is what a ballot in KV records. Never
    // derive it from the title, never tidy it, never renumber it. Changing one
    // orphans every vote already cast for that dish.
    pipeline: PIPELINE_DISHES
      .filter(d => !d.status || d.status === 'testing')
      .map(d => ({
        key: d.key,
        title: d.title,
        origin: d.origin,
        desc: d.desc,
        diet: d.diet || null,
        ...(d.note ? { note: d.note } : {}),
        ...(d.contains ? { contains: d.contains } : {}),
      })),
    // The heads-up banner. This line is the fix for a feature that was
    // wired end to end EXCEPT here: WeekTab collected the message and
    // publishWeek dropped it on the floor, so it never reached the worker
    // and no customer page could have shown it. Always present, never
    // conditional — an unchecked box must publish '' to CLEAR last week's
    // banner, exactly like pausedMsg above.
    notice: extractNotice(pausedOpts, extras),
    // Explicit deadlines, published rather than described in prose. The notice
    // text has always carried the cutoff in words, which is fine for a person
    // and useless to a validator. Amendments need something comparable, and
    // there are TWO because Kevin closes changes once shopping starts without
    // also closing new orders. Empty means "not set", which every consumer must
    // read as open — an empty published field must never mean closed, or a
    // publish gap would silently stop all amendments.
    orderClosesAt: String((extras && extras.orderClosesAt) || ''),
    amendmentsCloseAt: String((extras && extras.amendmentsCloseAt) || ''),
    // CUSTOMER FEATURE FLAGS. The FOURTH instance of the bug documented at the
    // top of this file: WeekTab has always put `customerFlags` in the extras
    // bag on BOTH publish paths, and this function never read it. The flag
    // panel wrote to localStorage, rode the backup, and never left the device,
    // so every stage change Kevin made was inert. Nothing looked broken
    // because the worker falls back to its own FLAG_DEFAULTS when the field is
    // absent, which resolves the five 'on' flags on — so the failure was
    // invisible in exactly the cases people would have noticed it.
    //
    // The `dropped` array cannot catch this class. It guards fields SENT but
    // not whitelisted; this was whitelisted but never sent, and
    // checkWorkerContract read that as forward-compatibility. tests/
    // publish_contract.mjs now closes the gap in both directions.
    //
    // ALWAYS SENT, never conditional. The worker rebuilds its stored config
    // from CONFIG_FIELDS on every publish, so omitting this field would reset
    // every customer to FLAG_DEFAULTS — which is the bug, not a safe default.
    // normalizeFlags fills the full {stage, testers, percent} shape the
    // worker's resolveFlags needs to evaluate testers and percentage stages.
    //
    // ON THE FULL SHAPE GOING OVER THE WIRE: GET /config is unauthenticated
    // and returns the stored config verbatim, so the worker REDACTS this field
    // down to {stage} per flag on the way out (see PASTE_NOTES). Stage alone is
    // what form.html reads and reveals nothing; the tester list and percentage
    // are what the booleans-only rule exists to protect. Until that paste
    // lands, do not use the 'testers' or 'percent' stages — every flag ships
    // with an empty tester list and percent 0 today, so the window is empty in
    // practice, but it stops being empty the moment one is set.
    customerFlags: normalizeFlags((extras && extras.customerFlags) || null),
  };
  const res = await fetch(CONFIG_PUBLISH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Publish failed (' + res.status + '): ' + txt.slice(0, 120));
  }
  // The worker builds the stored config from its OWN field list and reports
  // anything it did not recognize. Surfacing that is the whole defense
  // against a class of bug that has now bitten three times (paused, notice,
  // oneBottle): a field fully built here, fully rendered on the customer
  // page, and silently discarded in transit. A publish that quietly loses
  // data must never look like a clean publish.
  // READ THE BODY EXACTLY ONCE. A Response body is a one-shot stream: this
  // function already ended with `return res.json()`, so adding a second read
  // here threw "body is disturbed or locked" AFTER the publish had actually
  // succeeded. That is the worst shape a bug can take, because it reports
  // failure for work that landed and teaches you to distrust the success
  // message. The parsed value is reused for both jobs below.
  let published = null;
  try {
    published = await res.json();
  } catch (_) { /* an unparseable body is not a failed publish */ }
  // Forward-only seasonal record. UPSERTED by business week, so publishing
  // three times in one week (menu, then omakase, then a notice) leaves one
  // row holding the final state rather than three rows to reconcile later.
  setWeekLedger(prev => {
    const next = recordWeek(prev, allDinners.map(d => d.name), new Date(),
      { paused: !!(pausedOpts && pausedOpts.paused) });
    saveJSON(WEEK_LEDGER_KEY, next);
    return next;
  });
  if (published && Array.isArray(published.dropped) && published.dropped.length) {
    setNotice(
      'Published, but the worker ignored ' + published.dropped.join(', ') +
      '. Those never reach the customer pages; the worker needs the field added to CONFIG_FIELDS.'
    );
  }
  // Publish the full dinner catalog as the request whitelist. Fire-and-forget:
  // a failure here must never block the week publish, and POST /requests just
  // rejects everything until the next successful write. Full ALL_DINNERS, not
  // this week's subset — customers request dishes that AREN'T on this week.
  try {
  // ── Personalized snapshots ─────────────────────────────────────────────
  // Piggybacks the weekly publish deliberately: this is the moment the week
  // becomes real, and a separate trigger would drift out of step with it.
  //
  // Sanitized on the way out. Nothing here carries an address, a phone, an
  // order history, or a regular id — only a first name, the week label, and
  // per-dish annotations keyed by dishId. sanitizeSnapshot() strips anything
  // that is not on the allowlist, so a future edit that adds a PII field
  // fails closed rather than shipping it.
  //
  // Failure is swallowed on purpose. Personalization is an enhancement; a
  // snapshot that does not publish must never fail the week's publish, and
  // the customer page falls back to the generic view on its own.
  if (extras && extras.profileSnapshots && Object.keys(extras.profileSnapshots).length) {
    try {
      await fetch(WORKER_BASE + '/customer-profiles/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-LTB-Token': PUBLISH_TOKEN },
        body: JSON.stringify({ profiles: extras.profileSnapshots }),
      });
    } catch (e) { /* generic page still works */ }
  }

    await fetch(WORKER_BASE + '/requestable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: PUBLISH_TOKEN, dishes: ALL_DINNERS.map(d => d.name) }),
    });
  } catch (e) { /* non-fatal: week publish already succeeded */ }
  // Logged only on SUCCESS — a failed publish changed nothing customer-facing
  // and shouldn't leave a trail suggesting it did. Records WHEN a price set
  // went live, which is the other half of "why did a customer see that
  // price?" — the file-deploy entries say what the number became, this says
  // when it reached the form. Dish names only, no customer data.
  recordAudit([auditEntry({
    target: 'week',
    field: 'published',
    from: null,
    to: dishes.length + spotlight.length,
    source: SOURCES.PUBLISH,
    meta: {
      dishes: allDinners.map(d => d.name).slice(0, 40),
      ...(weekLabel ? { weekLabel: String(weekLabel).slice(0, 80) } : {}),
    },
  })]);
  return published; // already parsed above; never re-read res
}