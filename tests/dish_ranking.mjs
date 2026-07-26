// dish_ranking.mjs — Kevin's own ranking, kept as a series.
//
// The assertions that matter are the ones about DRIFT and about matching by
// stable id. A ranking that cannot survive a dish rename is worse than none,
// because it silently reports a dish as "left the menu" when it was only
// renamed, and that is exactly the failure the identity module exists to stop.

import { SEED_RANKING, addRanking, latest, rankOf, drift, tasteVsSales, tasteVsSon, staleness } from '../src/dishRanking.js';

let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log('  ✓ ' + n)) : (f++, console.log('  ✗ ' + n + (x ? ' — ' + x : ''))); };

ok('the seed ranking holds all 27 dinners', SEED_RANKING.order.length === 27, String(SEED_RANKING.order.length));
ok('the seed has no duplicates', new Set(SEED_RANKING.order).size === 27);
ok('Bolognese is first', SEED_RANKING.order[0] === 'Bolognese');

let list = addRanking([], SEED_RANKING);
ok('a ranking stores whole', latest(list).order.length === 27);
ok('rankOf is 1-indexed', rankOf(latest(list), 'Bolognese') === 1);
ok('rankOf finds a mid-list dish', rankOf(latest(list), 'Steak au Poivre') === 11);
ok('rankOf returns null for an unknown dish', rankOf(latest(list), 'Not A Dish') === null);

// A second ranking a year later: two dishes swap ends.
const later = {
  rankedAt: '2027-07-26T00:00:00.000Z',
  order: (() => {
    const o = SEED_RANKING.order.slice();
    o.splice(o.indexOf('Steak au Poivre'), 1);
    o.unshift('Steak au Poivre');
    return o;
  })(),
};
list = addRanking(list, later);
ok('rankings keep in date order', latest(list).rankedAt === later.rankedAt);

const d = drift(list);
ok('drift finds the mover', d.movers.length > 0 && d.movers[0].dish === 'Steak au Poivre', JSON.stringify(d.movers[0]));
ok('a dish moving UP reports a positive delta', d.movers[0].delta === 10, String(d.movers[0].delta));
ok('drift reports from and to', d.from && d.to && d.from.rankedAt !== d.to.rankedAt);
ok('nothing entered or left when the menu is unchanged', d.entered.length === 0 && d.left.length === 0);
ok('a single ranking has no drift', drift([SEED_RANKING]).movers.length === 0);

// Taste against sales.
const signal = { 'Bolognese': { orders: 1 }, 'Chili': { orders: 40 }, 'Gumbo': { orders: 20 } };
const tvs = tasteVsSales(SEED_RANKING, signal);
const chili = tvs.find(r => r.dish === 'Chili');
const bol = tvs.find(r => r.dish === 'Bolognese');
ok('sales rank is by order count', chili.salesRank === 1 && bol.salesRank === 3, JSON.stringify([chili, bol]));
ok('a dish that outsells his taste shows a positive gap', chili.gap === 5, String(chili.gap));
ok('a dish he rates above its sales shows a negative gap', bol.gap === -2, String(bol.gap));
ok('never-ordered dishes are flagged, not scored', tvs.find(r => r.dish === 'Mapo Eggplant').neverOrdered === true);

// Taste against the son.
const son = [{ dish: 'Bolognese', average: 5, entries: 3 }, { dish: 'Chili', average: 2, entries: 2 }];
const tv = tasteVsSon(SEED_RANKING, son);
ok('only dishes both have an opinion on are compared', tv.length === 2, String(tv.length));
ok('agreement is within two places', tv.find(r => r.dish === 'Bolognese').agree === true);
ok('an empty food log compares nothing', tasteVsSon(SEED_RANKING, []).length === 0);

// Staleness.
const st = staleness(SEED_RANKING, ['Bolognese', 'A Brand New Dish']);
ok('staleness lists what left the menu', st.missing.length === 26);
ok('staleness lists what was added since', st.added.length === 1 && st.added[0] === 'A Brand New Dish');

console.log(f === 0 ? '\nDISH RANKING: ALL PASS' : `\nDISH RANKING: ${f} FAILURES`);
process.exit(f ? 1 : 0);
