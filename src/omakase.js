// ─── Omakase: pure helpers ───────────────────────────────────────────────────
// Chef's-choice orders are their own product identity. They deliberately do NOT
// feed dishSalesHistory or the per-dish radar (a dish Kevin picked for someone
// is not customer demand for that dish), so every omakase number the app shows
// comes from here instead. UI-free on purpose: all of this is unit-testable.
import { INGREDIENT_SEED } from './ingredients.js';

const PERIOD_DAYS = { month: 30, quarter: 90, all: null };

let _idToName = null;
function ingredientName(id) {
  if (!_idToName) {
    _idToName = {};
    INGREDIENT_SEED.forEach(i => { _idToName[i.id] = i.name; });
  }
  return _idToName[id] || id;
}

export function isOmakaseItem(it) { return !!(it && it.omakase); }

export function omakaseItemsOf(order) {
  return ((order && order.items) || []).filter(isOmakaseItem);
}

// An omakase is "undecided" until Kevin has logged what he made: no components
// AND no hand-entered cost. This is what the queue banner counts.
export function omakaseUndecided(order) {
  const oms = omakaseItemsOf(order);
  if (!oms.length) return false;
  return oms.some(it => !(it.components && it.components.length) && !(it.cost > 0));
}

// Active (not archived) orders with an undecided omakase, newest first.
export function undecidedOmakases(orders) {
  return (orders || [])
    .filter(o => !o.archived && omakaseUndecided(o))
    .map(o => ({ orderId: o.id, customer: o.customer, createdAt: o.createdAt }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

// Shopping: menu-pick components become pseudo-items so the EXISTING generator
// expands their real recipes into ingredient quantities. Everything else
// becomes a plain reminder line. Kevin's rule: an omakase with nothing logged
// yet shows as ONE line at the customer's budget, so the list is never silently
// short by a whole order. House orders still ship food, so they are included.
export function expandOmakaseForShopping(orders) {
  const pseudoItems = [];
  const extraLines = [];
  for (const o of (orders || [])) {
    if (o.archived) continue;
    for (const it of omakaseItemsOf(o)) {
      const comps = it.components || [];
      if (!comps.length) {
        const budget = it.budgetMax != null ? it.budgetMax : (it.price || 0);
        extraLines.push({
          label: `Omakase ingredients (${o.customer || 'someone'})`,
          note: `$${budget} budget, nothing logged yet`,
        });
        continue;
      }
      for (const c of comps) {
        if (c.fromMenu && c.menuKey) {
          const [name, variant] = String(c.menuKey).split('|');
          if (name && variant) pseudoItems.push({ name, variant, qty: 1 });
        } else if (c.ing && c.ingredientId) {
          extraLines.push({
            label: `${ingredientName(c.ingredientId)} for omakase (${o.customer || 'someone'})`,
            note: c.qty != null ? `${c.qty} ${c.unit || ''}`.trim() : '',
          });
        } else if (c.label) {
          extraLines.push({
            label: `${c.label} for omakase (${o.customer || 'someone'})`,
            note: '',
          });
        }
      }
    }
  }
  return { pseudoItems, extraLines };
}

// What this regular has been served before, newest first. Chef's choice depends
// on remembering what you already made them, and on a "no clams" said months
// ago still being visible today.
export function pastOmakasesFor(regularId, orders, excludeOrderId) {
  if (!regularId) return [];
  const out = [];
  for (const o of (orders || [])) {
    if (o.regularId !== regularId) continue;
    if (excludeOrderId && o.id === excludeOrderId) continue;
    for (const it of omakaseItemsOf(o)) {
      out.push({
        date: o.createdAt,
        labels: (it.components || []).map(c => c.label).filter(Boolean),
        note: it.note || '',
        price: it.price,
      });
    }
  }
  return out.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

// The performance card. Realized margin only counts omakases with a logged
// cost, since an unfulfilled one would read as 100% margin and flatter the
// number. House orders never count (same rule as everywhere else).
export function omakaseStats(orders, period = 'all') {
  const days = PERIOD_DAYS[period];
  const cutoff = days ? Date.now() - days * 86400000 : null;
  let count = 0, revenue = 0, cost = 0, costedCount = 0, costedRevenue = 0;
  let budgetSum = 0, budgetCount = 0, pctSum = 0, pctCount = 0;
  const bigPathSplit = { multi: 0, premium: 0 };
  for (const o of (orders || [])) {
    if (o.house) continue;
    const t = new Date(o.createdAt || 0).getTime();
    if (cutoff && !(t >= cutoff)) continue;
    for (const it of omakaseItemsOf(o)) {
      count++;
      const price = Number(it.price) || 0;
      revenue += price;
      if (it.cost > 0) { cost += it.cost; costedCount++; costedRevenue += price; }
      if (it.budgetMax > 0) {
        budgetSum += it.budgetMax; budgetCount++;
        if (price > 0) { pctSum += price / it.budgetMax; pctCount++; }
      }
      if (it.bigPath === 'multi') bigPathSplit.multi++;
      else if (it.bigPath === 'premium') bigPathSplit.premium++;
    }
  }
  return {
    count,
    revenue: Math.round(revenue * 100) / 100,
    cost: Math.round(cost * 100) / 100,
    costedCount,
    realizedMarginPct: costedRevenue > 0 ? Math.round((1 - cost / costedRevenue) * 1000) / 10 : null,
    avgCharge: count > 0 ? Math.round((revenue / count) * 100) / 100 : 0,
    avgBudget: budgetCount > 0 ? Math.round((budgetSum / budgetCount) * 100) / 100 : 0,
    avgPctOfBudget: pctCount > 0 ? Math.round((pctSum / pctCount) * 1000) / 10 : null,
    bigPathSplit,
  };
}

// Reheat/companion: menu-pick components are real dishes, so the canon reheat
// engine can speak for them. Returns an order whose items include a pseudo-item
// per menu component, leaving the omakase line itself intact.
export function expandOrderForReheat(order) {
  const extra = [];
  for (const it of omakaseItemsOf(order)) {
    for (const c of (it.components || [])) {
      if (c.fromMenu && c.menuKey) {
        const [name, variant] = String(c.menuKey).split('|');
        if (name && variant) extra.push({ name, variant, qty: 1 });
      }
    }
  }
  if (!extra.length) return order;
  return { ...order, items: [...(order.items || []), ...extra] };
}

// Free-text reheat notes Kevin typed on non-menu components.
export function omakaseCustomReheat(order) {
  const out = [];
  for (const it of omakaseItemsOf(order)) {
    for (const c of (it.components || [])) {
      if (c.reheat && String(c.reheat).trim()) out.push({ label: c.label || 'Component', reheat: String(c.reheat).trim() });
    }
  }
  return out;
}
