// OrderListControls.jsx — search, sort, status filter, and the select-mode
// toggle for the orders list.
//
// The caller decides whether to render this at all: the strip stays hidden
// until there are more than six orders in one of the two sections. Below that
// the list is short enough to read, and a row of controls over five orders is
// furniture. Above it, this is what keeps the page from becoming a scroll
// marathon at three hundred.
//
// The status filter is offered for the ACTIVE section only. "Delivered" is
// itself a status, so filtering the delivered list by it would be a no-op
// control that only invites confusion.

import React from 'react';
import { CREAM, GOLD, styles } from '../styles.js';

export function OrderListControls({
  orderSearch, setOrderSearch, orderSort, setOrderSort,
  orderStatusFilter, setOrderStatusFilter, statuses,
  selectMode, onToggleSelectMode,
}) {
  return (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
    <input
      value={orderSearch}
      onChange={e => setOrderSearch(e.target.value)}
      placeholder="Search name, dish, or note…"
      style={{ ...styles.input, flex: '1 1 160px', minWidth: 140, padding: '8px 10px', fontSize: 13 }}
    />
    <select
      value={orderSort}
      onChange={e => setOrderSort(e.target.value)}
      style={{ background: '#1a1a1a', border: '1px solid #37403c', borderRadius: 8, color: CREAM, fontSize: 12.5, padding: '8px 8px', minHeight: 36 }}
    >
      <option value="newest">Newest first</option>
      <option value="oldest">Oldest first</option>
      <option value="name">By name</option>
      <option value="unpaidFirst">Unpaid first</option>
      <option value="status">By status</option>
    </select>
    {statuses.length > 0 && (
      <select
        value={orderStatusFilter || ''}
        onChange={e => setOrderStatusFilter(e.target.value || null)}
        style={{ background: '#1a1a1a', border: '1px solid #37403c', borderRadius: 8, color: CREAM, fontSize: 12.5, padding: '8px 8px', minHeight: 36 }}
      >
        <option value="">All statuses</option>
        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    )}
    <button
      onClick={onToggleSelectMode}
      style={{ minHeight: 36, padding: '7px 12px', borderRadius: 8, border: `1px solid ${selectMode ? GOLD : '#37403c'}`, background: selectMode ? 'rgba(212,160,80,0.15)' : 'transparent', color: selectMode ? GOLD : '#9aa5a0', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
    >
      {selectMode ? 'Done' : 'Select'}
    </button>
  </div>
  );
}
