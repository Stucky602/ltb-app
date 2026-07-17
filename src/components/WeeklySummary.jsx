import React, { useMemo } from 'react';
import { X } from '../icons.jsx';
import { currency, round2, orderCostInfo, groupKeyFor, isHouseOrder
} from '../utils.js';

// ─── Weekly cost & profit recap ────────────────────────────────────────────
// Groups ALL orders (including archived) by delivery week, showing revenue,
// estimated ingredient cost, profit, and margin per week — plus a per-dish
// breakdown for the most recent week. Uses the same groupKeyFor(order, 'week')
// signature the Money tab uses, which returns { label, stamp }.
//
// Styles are LOCAL to this component (the S block below) so the modal renders
// solid and self-contained — it never inherits the transparent/half-built
// shared `summary*` tokens that let the order list bleed through before.

// palette (matches styles.js / MoneyTab tokens)
const GREEN = '#1D9E75';
const GREEN_BRIGHT = '#5DCAA5';
const GOLD = '#EF9F27';
const RED = '#EF4444';
const CREAM = '#F2EFE6';
const MUTED = '#9aa5a0';
const FAINT = '#7a8480';
const LINE = '#2a322e';
const PANEL = '#141b18';
const PANEL_HI = '#1a221e';
const BACKDROP = 'rgba(4, 8, 7, 0.72)';

function marginColor(m) {
  if (m >= 55) return GREEN_BRIGHT;
  if (m >= 45) return GREEN;
  if (m >= 30) return GOLD;
  return RED;
}

export function WeeklySummaryModal({ orders, onClose }) {
  const weeks = useMemo(() => {
    const map = new Map();
    (orders || []).forEach(o => {
      if (isHouseOrder(o)) return; // house orders are not sales; recap is a money view
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
    const orderCount = weeks.reduce((s, w) => s + w.orders.length, 0);
    return {
      revenue: round2(revenue),
      cost: round2(cost),
      profit: round2(revenue - cost),
      margin: revenue > 0 ? Math.round((1 - cost / revenue) * 100) : 0,
      orderCount,
    };
  }, [weeks]);

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.card} onClick={e => e.stopPropagation()}>

        {/* header */}
        <div style={S.header}>
          <div>
            <div style={S.title}>Weekly recap</div>
            <div style={S.subtitle}>{lifetime.orderCount} order{lifetime.orderCount !== 1 ? 's' : ''} all time</div>
          </div>
          <button style={S.close} onClick={onClose} aria-label="Close recap"><X size={18} /></button>
        </div>

        {/* scroll body */}
        <div style={S.body}>

          {/* lifetime hero */}
          <div style={S.hero}>
            <div style={S.heroMain}>
              <div style={S.heroRevenue}>{currency(lifetime.revenue)}</div>
              <div style={S.heroRevenueLabel}>lifetime revenue</div>
            </div>
            <div style={S.heroSplit}>
              <div style={S.heroStat}>
                <div style={{ ...S.heroStatNum, color: GREEN_BRIGHT }}>{currency(lifetime.profit)}</div>
                <div style={S.heroStatLabel}>profit</div>
              </div>
              <div style={S.heroDivider} />
              <div style={S.heroStat}>
                <div style={{ ...S.heroStatNum, color: marginColor(lifetime.margin) }}>{lifetime.margin}%</div>
                <div style={S.heroStatLabel}>margin</div>
              </div>
            </div>
          </div>

          {/* weeks */}
          {weeks.length === 0 ? (
            <div style={S.empty}>No orders yet.</div>
          ) : (
            weeks.map((wk, idx) => (
              <div key={wk.label} style={S.week}>

                <div style={S.weekHead}>
                  <span style={S.weekDate}>{wk.label}</span>
                  <span style={S.weekCount}>{wk.orders.length} order{wk.orders.length !== 1 ? 's' : ''}</span>
                </div>

                {/* revenue / cost / profit as a clean stacked ledger */}
                <div style={S.ledger}>
                  <div style={S.ledgerRow}>
                    <span style={S.ledgerLabel}>Revenue</span>
                    <span style={S.ledgerVal}>{currency(wk.revenue)}</span>
                  </div>
                  <div style={S.ledgerRow}>
                    <span style={S.ledgerLabel}>Est. cost</span>
                    <span style={{ ...S.ledgerVal, color: MUTED }}>{currency(wk.cost)}</span>
                  </div>
                  <div style={{ ...S.ledgerRow, ...S.ledgerRowTotal }}>
                    <span style={S.ledgerLabelStrong}>Profit</span>
                    <span style={S.profitGroup}>
                      <span style={{ ...S.ledgerValStrong, color: GREEN_BRIGHT }}>{currency(wk.profit)}</span>
                      <span style={{ ...S.marginPill, color: marginColor(wk.margin), borderColor: marginColor(wk.margin) }}>
                        {wk.margin}%
                      </span>
                    </span>
                  </div>
                </div>

                {/* dish chips (most recent week only) */}
                {idx === 0 && wk.topDishes.length > 0 && (
                  <div style={S.dishWrap}>
                    <div style={S.dishTitle}>Dishes this week</div>
                    <div style={S.chips}>
                      {wk.topDishes.map(d => (
                        <span key={d.name} style={S.chip}>
                          {d.name}
                          {d.qty > 1 && <span style={S.chipQty}>×{d.qty}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          <div style={S.footnote}>
            Cost is estimated from per-dish ingredient costs. Weight-priced proteins
            only count once weighed. Includes archived orders.
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: BACKDROP, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  card: {
    width: '100%', maxWidth: 480, maxHeight: '92vh',
    background: '#0c1310', border: `1px solid ${LINE}`,
    borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '18px 20px 14px', borderBottom: `1px solid ${LINE}`, flexShrink: 0,
  },
  title: { fontSize: 19, fontWeight: 800, color: CREAM, letterSpacing: 0.2 },
  subtitle: { fontSize: 12.5, color: FAINT, marginTop: 2 },
  close: {
    background: PANEL_HI, border: `1px solid ${LINE}`, color: MUTED,
    width: 34, height: 34, borderRadius: 10, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  body: { overflowY: 'auto', padding: '16px 16px 22px', WebkitOverflowScrolling: 'touch' },

  // hero
  hero: {
    background: `linear-gradient(150deg, ${PANEL_HI}, ${PANEL})`,
    border: `1px solid ${LINE}`, borderRadius: 16, padding: '18px 18px 16px', marginBottom: 16,
  },
  heroMain: { marginBottom: 14 },
  heroRevenue: { fontSize: 32, fontWeight: 800, color: CREAM, lineHeight: 1.05, letterSpacing: -0.5 },
  heroRevenueLabel: { fontSize: 12.5, color: MUTED, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.6 },
  heroSplit: { display: 'flex', alignItems: 'center', gap: 0 },
  heroStat: { flex: 1 },
  heroStatNum: { fontSize: 22, fontWeight: 800, lineHeight: 1 },
  heroStatLabel: { fontSize: 11.5, color: FAINT, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  heroDivider: { width: 1, alignSelf: 'stretch', background: LINE, margin: '0 16px' },

  // week card
  week: {
    background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14,
    padding: '14px 16px', marginBottom: 12,
  },
  weekHead: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
    marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${LINE}`,
  },
  weekDate: { fontSize: 15, fontWeight: 700, color: CREAM },
  weekCount: { fontSize: 12.5, color: FAINT, fontWeight: 600 },

  ledger: { display: 'flex', flexDirection: 'column', gap: 7 },
  ledgerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  ledgerLabel: { fontSize: 13.5, color: MUTED },
  ledgerVal: { fontSize: 14, color: CREAM, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  ledgerRowTotal: { marginTop: 4, paddingTop: 9, borderTop: `1px dashed ${LINE}` },
  ledgerLabelStrong: { fontSize: 14, color: CREAM, fontWeight: 700 },
  ledgerValStrong: { fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' },
  profitGroup: { display: 'flex', alignItems: 'center', gap: 9 },
  marginPill: {
    fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
    border: '1px solid', background: 'rgba(255,255,255,0.02)', fontVariantNumeric: 'tabular-nums',
  },

  // dishes
  dishWrap: { marginTop: 13, paddingTop: 12, borderTop: `1px solid ${LINE}` },
  dishTitle: { fontSize: 11, color: FAINT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 9 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: PANEL_HI, border: `1px solid ${LINE}`, borderRadius: 9,
    padding: '5px 10px', fontSize: 12.5, color: '#cdd6d1', fontWeight: 500,
  },
  chipQty: { color: GREEN_BRIGHT, fontWeight: 700, fontSize: 12 },

  empty: { textAlign: 'center', color: FAINT, fontSize: 14, padding: '28px 0' },
  footnote: { fontSize: 11.5, color: FAINT, lineHeight: 1.5, marginTop: 14, padding: '0 4px' },
};
