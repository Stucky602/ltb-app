// dish_identity_consumers.mjs — proves the five subsystems that used to match
// dishes by DISPLAY STRING now match by stable id.
//
// WHY THIS MATTERS MORE THAN IT LOOKS
// A rename used to fork a dish's history in silence. Orders placed as "Chicken
// Breast" and orders placed as "Air-Chilled Chicken Breast" are the same dish
// to a human and were two different dishes to passport stamps, favorites,
// attach rates, and the repricing scoreboard. Nothing errored. The counts were
// just quietly wrong, each one understating a dish by however many orders
// predated its rename, and every number derived from them inherited the split.
//
// Each test below builds order history that straddles a REAL rename from
// DISH_RENAMES and asserts the two halves come back as one dish. Run these
// against the pre-migration code and every one of them fails.

import { buildPassport } from '../src/passport.js';
import { dishOrderSignal } from '../src/favorites.js';
import { attachRates, usualOrder } from '../src/regularsIntel.js';
import { resolveDishId, dishIdFor, dishNameFor } from '../src/dishIdentity.js';

let failed = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failed++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}

const OLD = 'Curry of the Week';
const NEW = 'Indian Style Curry';

// Sanity: the fixture rename is real and both names land on one id.
check('the two names used below really are one dish',
  dishIdFor(OLD) && dishIdFor(OLD) === dishIdFor(NEW),
  `${dishIdFor(OLD)} vs ${dishIdFor(NEW)}`);

const iso = (d) => new Date(d).toISOString();
const order = (id, customer, name, when, extra = {}) => ({
  id, customer, createdAt: iso(when), status: 'Delivered', archived: true, paid: true, total: 40,
  items: [{ name, variant: 'Small (~4)', qty: 1, price: 40, cost: 18, ...extra }],
});

// Two households, each ordering the same dish twice, half under each name.
const HISTORY = [
  order('o1', 'Dave', OLD, '2026-03-01'),
  order('o2', 'Dave', NEW, '2026-06-01'),
  order('o3', 'Sara', OLD, '2026-03-08'),
  order('o4', 'Sara', NEW, '2026-06-08'),
];

// ── favorites: one dish, two repeat households ──────────────────────────────
{
  const sig = dishOrderSignal(HISTORY);
  const keys = Object.keys(sig).filter(k => k === OLD || k === NEW);
  check('favorites reports the renamed dish ONCE, not once per name',
    keys.length === 1, `got keys: ${keys.join(', ')}`);
  const entry = sig[NEW] || sig[OLD];
  check('favorites reports it under its CURRENT name', !!sig[NEW], `keys: ${keys.join(', ')}`);
  check('favorites counts all four orders, not two', entry && entry.orders === 4,
    entry && `orders=${entry.orders}`);
  check('favorites sees both households as repeaters',
    entry && entry.households === 2 && entry.repeaters === 2,
    entry && `households=${entry.households} repeaters=${entry.repeaters}`);
}

// ── passport: one stamp, dated from the FIRST time they had it ──────────────
{
  const reg = { id: 'r1', names: ['Dave'], name: 'Dave', linkedOrderIds: ['o1', 'o2'] };
  const pass = buildPassport(reg, HISTORY, HISTORY[1]);
  if (!pass) {
    check('passport builds for the fixture regular', false, 'buildPassport returned null');
  } else {
    // The book is pages of dishes, not a flat stamp list.
    const all = (pass.pages || []).flatMap(pg => pg.dishes || []);
    const hits = all.filter(d => d.name === OLD || d.name === NEW);
    check('the renamed dish appears ONCE in the book, not once per name',
      hits.length === 1, `got ${hits.length}: ${hits.map(d => d.name).join(', ')}`);
    const st = hits[0];
    check('it appears under the CURRENT name', !!st && st.name === NEW, st && st.name);
    check('it is actually stamped', !!st && st.stamped === true, st && `stamped=${st.stamped}`);
    check('the stamp counts BOTH orders, across the rename',
      !!st && st.times === 2, st && `times=${st.times}`);
    // The pre-rename order is the real first, and it is the older of the two.
    check('"first had" dates from the order placed under the OLD name',
      !!st && st.firstHad && new Date(st.firstHad).getTime() <= Date.parse(iso('2026-03-02')),
      st && `firstHad=${st.firstHad}`);
  }
}

// ── regularsIntel: attach rate is a ratio, so a split corrupts both halves ───
{
  const rates = attachRates(HISTORY, 'Dave');
  const rows = rates.filter(r => r.dish === OLD || r.dish === NEW);
  check('attach rates list the renamed dish once', rows.length === 1,
    `got ${rows.map(r => r.dish).join(', ')}`);
  check('attach rates use the current name', !rows[0] || rows[0].dish === NEW, rows[0] && rows[0].dish);
  check('attach rate counts both of this customer\'s weeks',
    !rows[0] || rows[0].ordered === 2, rows[0] && `ordered=${rows[0].ordered}`);

  const usual = usualOrder(HISTORY, 'Dave');
  const mine = usual.filter(u => u.name === OLD || u.name === NEW);
  check('the customer\'s "usual" merges both names into one suggestion',
    mine.length === 1, `got ${mine.map(u => u.name).join(', ')}`);
  check('the usual is offered under the current name', !mine[0] || mine[0].name === NEW, mine[0] && mine[0].name);
  check('the usual counts both orders', !mine[0] || mine[0].times === 2, mine[0] && `times=${mine[0].times}`);
}

// ── a stored dishId beats a name the registry no longer knows ───────────────
{
  const id = dishIdFor(NEW);
  check('a stored dishId wins over an unrecognisable name',
    resolveDishId({ dishId: id, name: 'Some Name Nobody Remembers' }) === id);
  check('an unresolvable record with no id resolves to null',
    resolveDishId({ name: 'Definitely Not A Dish' }) === null);
  check('dishNameFor falls back to the record name for an unknown id',
    dishNameFor('nope', 'Fallback Label') === 'Fallback Label');
}

// ── orphans do not collapse together ────────────────────────────────────────
// The one thing a naive "group by resolved id" migration gets wrong: two
// DIFFERENT unresolvable dishes both resolve to null and would merge into a
// single bucket, inventing a dish that never existed.
{
  const orphans = [
    order('x1', 'Dave', 'Ghost Dish One', '2026-05-01'),
    order('x2', 'Dave', 'Ghost Dish Two', '2026-05-02'),
  ];
  const sig = dishOrderSignal(orphans);
  check('two unresolvable dishes stay separate rather than merging into one',
    !!sig['Ghost Dish One'] && !!sig['Ghost Dish Two'],
    `keys: ${Object.keys(sig).join(', ')}`);
}

console.log(failed === 0 ? '\nDISH IDENTITY CONSUMERS: ALL PASS' : `\nDISH IDENTITY CONSUMERS: ${failed} FAILURES`);
process.exit(failed ? 1 : 0);
