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
        variants: [{ label: 'By weight', price: info.pricePerLb, cost: info.costPerLb }],
      };
    }
    return {
      name: item.name,
      variants: (item.variants || []).map(v => ({ label: v.label, price: v.price, cost: v.cost || 0 })),
      ...(item.spotlight ? { spotlight: true } : {}), // spotlight dinners route to their own form header
      ...(item.options ? { options: item.options } : {}), // form.html renders pickers from this (Batch 3)
      ...(item.diet ? { diet: item.diet } : {}), // menu.html dietary filter reads veg/pesc tags from this
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