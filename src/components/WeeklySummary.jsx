import React, { useMemo } from 'react';
import { X } from '../icons.jsx';
import { currency, round2, orderCostInfo, groupKeyFor } from '../utils.js';
import { styles } from '../styles.js';

// ─── Weekly cost & profit recap ────────────────────────────────────────────
// Groups ALL orders (including archived) by delivery week, showing revenue,
// estimated ingredient cost, profit, and margin per week — plus a per-dish
// breakdown for the most recent week. Uses the same groupKeyFor(order, 'week')
// signature the Money tab uses, which returns { label, stamp }.
export function WeeklySummaryModal({ orders, onClose }) {
  const weeks = useMemo(() => {
    const map = new Map();
    (orders || []).forEach(o => {
      const { label, stamp } = groupKeyFor(o, 'week');
      if (!map.has(label)) {
        map.set(label, { label, stamp, orders: [], revenue: 0, cost: 0, dishes: new Map() });
      }
      const wk = map.get(label);
      wk.orders.push(o);
      wk.revenue += Number(o.total) || 0;
      wk.cost += orderCostInfo(o).cost;
      (o.items || []).forEach(it => {
        const dk = it.name;
        if (!wk.dishes.has(dk)) wk.dishes.set(dk, { name: it.name, qty: 0 });
        wk.dishes.get(dk).qty += it.qty || 1;
      });
    });
    return Array.from(map.values())
      .map(wk => ({
        ...wk,
        revenue: round2(wk.revenue),
        cost: round2(wk.cost),
        profit: round2(wk.revenue - wk.cost),
        margin: wk.revenue > 0 ? Math.round((1 - wk.cost / wk.revenue) * 100) : 0,
        topDishes: Array.from(wk.dishes.values()).sort((a, b) => b.qty - a.qty),
      }))
      .sort((a, b) => b.stamp - a.stamp);
  }, [orders]);

  const lifetime = useMemo(() => {
    const revenue = weeks.reduce((s, w) => s + w.revenue, 0);
    const cost = weeks.reduce((s, w) => s + w.cost, 0);
    return {
      revenue: round2(revenue),
      cost: round2(cost),
      profit: round2(revenue - cost),
      margin: revenue > 0 ? Math.round((1 - cost / revenue) * 100) : 0,
    };
  }, [weeks]);

  return (
    <div style={styles.invoiceOverlay} onClick={onClose}>
      <div style={styles.summaryModalCard} onClick={e => e.stopPropagation()}>
        <div style={styles.summaryModalHeader}>
          <div style={styles.summaryModalTitle}>Weekly recap</div>
          <button style={styles.summaryModalClose} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={styles.summaryLifetimeRow}>
          <div style={styles.summaryLifetimeStat}>
            <div style={styles.summaryLifetimeNum}>{currency(lifetime.revenue)}</div>
            <div style={styles.summaryLifetimeLabel}>lifetime revenue</div>
          </div>
          <div style={styles.summaryLifetimeStat}>
            <div style={{ ...styles.summaryLifetimeNum, color: '#1D9E75' }}>{currency(lifetime.profit)}</div>
            <div style={styles.summaryLifetimeLabel}>profit · {lifetime.margin}% margin</div>
          </div>
        </div>

        <div style={styles.summaryWeekList}>
          {weeks.length === 0 ? (
            <div style={styles.profileFieldEmpty}>No orders yet.</div>
          ) : (
            weeks.map((wk, idx) => (
              <div key={wk.label} style={styles.summaryWeekCard}>
                <div style={styles.summaryWeekHead}>
                  <span style={styles.summaryWeekDate}>{wk.label}</span>
                  <span style={styles.summaryWeekCount}>{wk.orders.length} order{wk.orders.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={styles.summaryWeekStats}>
                  <div style={styles.summaryWeekStat}>
                    <span style={styles.summaryWeekStatLabel}>Revenue</span>
                    <span style={styles.summaryWeekStatVal}>{currency(wk.revenue)}</span>
                  </div>
                  <div style={styles.summaryWeekStat}>
                    <span style={styles.summaryWeekStatLabel}>Est. cost</span>
                    <span style={styles.summaryWeekStatVal}>{currency(wk.cost)}</span>
                  </div>
                  <div style={styles.summaryWeekStat}>
                    <span style={styles.summaryWeekStatLabel}>Profit</span>
                    <span style={{ ...styles.summaryWeekStatVal, color: '#1D9E75' }}>{currency(wk.profit)}</span>
                  </div>
                  <div style={styles.summaryWeekStat}>
                    <span style={styles.summaryWeekStatLabel}>Margin</span>
                    <span style={styles.summaryWeekStatVal}>{wk.margin}%</span>
                  </div>
                </div>
                {idx === 0 && wk.topDishes.length > 0 && (
                  <div style={styles.summaryDishBreakdown}>
                    <div style={styles.summaryDishTitle}>Dishes this week</div>
                    {wk.topDishes.map(d => (
                      <div key={d.name} style={styles.summaryDishRow}>
                        <span style={styles.summaryDishName}>{d.name}</span>
                        <span style={styles.summaryDishQty}>×{d.qty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={styles.summaryFootnote}>
          Cost is estimated from per-dish ingredient costs. Weight-priced proteins
          only count once weighed. Includes archived orders.
        </div>
      </div>
    </div>
  );
}
