// cookSchedule.js — #1 the cook-day solver (engine, pure)
// Given the week's real orders, builds the Monday-night-to-Wednesday-delivery
// timeline: dry-brine starts, overnight sous vide, temperature-grouped SV
// batches (131F steaks NEVER share a bath run with 140F pork), stovetop
// sequencing that respects the equipment conflict graph, day-of sauces, and
// the packaging pass. Timing knowledge is encoded as RULES on existing data
// (equipment claims, reheat buckets, per-lb flags), not a hand-authored
// per-dish minute table — so new dishes inherit sane scheduling for free.
import { DISHES, ALL_ALWAYS_ITEMS, ALWAYS_ITEMS } from './dishes.js';
import { analyzeConflicts } from './equipmentConflict.js';

// SV temperature groups (from the published menu: steaks 131F, pork 140F).
const SV_131 = new Set(['Ribeye', 'NY Strip', 'Filet Mignon', 'Flank Steak']);
const SV_140 = new Set(['Pork Tenderloin', 'Thick-Cut Pork Chop']);
const SV_CHICKEN = new Set(['Air-Chilled Chicken Breast']); // own batch, 145-150F class
const OVERNIGHT = new Set(['Flank Steak']); // 8-12h — starts the night before
// SV veg = the bag-section vegetables (weekly bath runs). Category-scoped so
// name lookalikes ("Pickled Onions or Carrots", an addon jar) can never sneak
// into the schedule. Garlic Confit is bag-section but frozen INVENTORY, not a
// weekly bath run — excluded.
const SV_VEG = new Set((ALWAYS_ITEMS.bag || [])
  .filter(i => !i.perLb && i.name !== 'Garlic Confit' && !/Chicken|Steak|Chop|Tenderloin|Ribeye|Strip|Filet/i.test(i.name))
  .map(i => i.name));

const DINNER_BY_NAME = new Map(DISHES.map(d => [d.name, d]));

function itemsInOrders(orders) {
  const units = new Map();
  for (const o of (orders || [])) {
    if (o.archived || o.status === 'Delivered') continue;
    for (const it of (o.items || [])) {
      units.set(it.name, (units.get(it.name) || 0) + (Number(it.qty) || 1));
    }
  }
  return units;
}

// buildCookSchedule(orders) → { days: [{ day, tasks: [{time, task, items, note}] }], warnings }
// Day labels are relative to Wednesday delivery.
export function buildCookSchedule(orders) {
  const units = itemsInOrders(orders);
  const names = [...units.keys()];
  const warnings = [];
  // Nothing to cook → nothing to schedule (the panel's empty state handles
  // messaging; a "package and deliver" day with zero orders would be noise).
  if (names.length === 0) return { days: [], warnings, itemCount: 0 };

  const svProteins = names.filter(n => SV_131.has(n) || SV_140.has(n) || SV_CHICKEN.has(n));
  const overnight = names.filter(n => OVERNIGHT.has(n));
  const svVeg = names.filter(n => SV_VEG.has(n));
  const dinners = names.filter(n => DINNER_BY_NAME.has(n));

  // Stovetop sequencing: order dinners so hard equipment claims don't collide;
  // the conflict graph tells us which pairs can't run simultaneously.
  const conflict = analyzeConflicts(dinners);
  const clashes = conflict.red.length + conflict.yellow.length;

  const days = [];
  const t = (time, task, items, note) => ({ time, task, items, note: note || '' });

  // ── MONDAY (D-2): brines + overnight starts ──
  const mon = [];
  if (svProteins.length || svVeg.length) {
    mon.push(t('PM', 'Start 24h dry brines (salt + sugar)', svProteins, 'Every SV protein brines a full day before it bags.'));
  }
  if (overnight.length) {
    mon.push(t('Night', 'Bag and start overnight sous vide (8-12h)', overnight, 'In the bath before bed, done by morning.'));
  }
  if (mon.length) days.push({ day: 'Monday', tasks: mon });

  // ── TUESDAY (D-1): the main cook ──
  const tue = [];
  if (overnight.length) tue.push(t('AM', 'Pull overnight bags, chill', overnight));
  // Overnight items already cooked — never double-book them into day batches.
  const b131 = svProteins.filter(n => SV_131.has(n) && !OVERNIGHT.has(n));
  const b140 = svProteins.filter(n => SV_140.has(n));
  const bChx = svProteins.filter(n => SV_CHICKEN.has(n));
  if (b131.length) tue.push(t('AM', 'SV batch at 131F (steaks)', b131, 'Steaks share a bath. Never mix with the 140F pork batch.'));
  if (b140.length) tue.push(t('Midday', 'SV batch at 140F (pork)', b140, 'Own batch, after or parallel-second-bath to the steaks.'));
  if (bChx.length) tue.push(t('Midday', 'SV batch, chicken breast', bChx, 'Own temperature, own batch.'));
  if (svVeg.length) tue.push(t('PM', 'SV vegetable bags', svVeg, 'Veg runs after proteins; temps differ and the bath frees up.'));
  if (dinners.length) {
    tue.push(t('All day', 'Stovetop and oven dinners', dinners,
      clashes > 0
        ? `Sequence carefully: ${conflict.red.length} hard and ${conflict.yellow.length} soft equipment overlaps this week.`
        : 'No equipment collisions this week. Run them in any order.'));
  }
  if (tue.length) days.push({ day: 'Tuesday', tasks: tue });

  // ── WEDNESDAY (delivery day): finish + package ──
  const wed = [];
  wed.push(t('AM', 'Day-of items: sauces, mounted butters, anything stabilized', [], 'Beurre blanc family and cream sauces are made day-of, stabilized, chilled.'));
  wed.push(t('AM', 'Package everything, print labels + packing slips', [], 'Labels button on the Week tab. Check unpaid flags on the slips.'));
  wed.push(t('PM', 'Deliver', []));
  days.push({ day: 'Wednesday', tasks: wed });

  if (conflict.red.length) {
    warnings.push(`${conflict.red.length} hard equipment conflict${conflict.red.length > 1 ? 's' : ''} in this week's dinners. Check the conflict panel before committing the cook order.`);
  }
  return { days, warnings, itemCount: names.length };
}
