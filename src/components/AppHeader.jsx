// AppHeader.jsx — the fixed top of the app: storage health strips, the
// service-worker update prompt, the title bar with its three actions, the
// transient export message, the boot notice, and the two-row tab nav.
//
// WHY THE STORAGE STRIPS COME FIRST, ABOVE EVERYTHING
// Everything the business runs on lives in about five megabytes of
// localStorage, and order photos eat most of it. "Full" is a state this app
// can genuinely reach, and when it does, writes fail. A red strip at the very
// top saying so, before any other chrome, is the difference between noticing
// and losing a day's orders. The amber four-megabyte warning exists so the
// red one is rarely the first news.
//
// The two header icons are grey until something is wrong. The backup arrow
// turning red is the ONLY signal that the online ring has gone stale, which
// once ran dead for nine days without a symptom. It is deliberately readable
// at a glance and not readable in detail: a modal every time would get
// dismissed on reflex.
//
// The boot notice is a button rather than a toast because it is how the app
// tells Kevin his COSTS MOVED. Silently correcting money is the failure the
// audit trail exists to end, so this one waits for a tap and never expires.

import React from 'react';
import { Bell, Download, Upload } from '../icons.jsx';
import { GOLD, styles } from '../styles.js';
import { VAPID_PUBLIC_KEY } from '../config.js';

export function AppHeader({
  storageFull, storageBytes, swUpdate,
  notifPerm, onEnablePush,
  backupFailing, onOpenBackup, onPasteImport,
  exportMsg, notice, onDismissNotice,
  view, setView, activeCount,
}) {
  return (
    <>
{storageFull && (
  <div style={{ background: '#3a1f22', borderBottom: '1px solid #E24B4A', padding: '9px 12px', fontSize: 12.5, color: '#ffd9d9', lineHeight: 1.5 }}>
    <b>Storage is full and changes are not saving.</b> Delete some order photos to free space, then reload. Nothing already saved has been lost.
  </div>
)}
{!storageFull && storageBytes > 4 * 1024 * 1024 && (
  <div style={{ background: 'rgba(212,160,80,0.10)', borderBottom: '1px solid #D4A050', padding: '7px 12px', fontSize: 12, color: '#e8ede9' }}>
    Storage is at {(storageBytes / (1024 * 1024)).toFixed(1)}MB of about 5MB. Order photos take the most room.
  </div>
)}
{swUpdate && (
  <div
    onClick={() => window.location.reload()}
    style={{ background: 'rgba(93,202,165,0.12)', borderBottom: '1px solid #5DCAA5', padding: '8px 12px', fontSize: 12.5, color: '#e8ede9', cursor: 'pointer' }}
  >
    A new version is ready. <b>Tap to reload.</b>
  </div>
)}
<header style={styles.header}>
  <div style={styles.headerTop}>
    <div style={styles.logoMark}>LTB</div>
    <div style={styles.headerCenter}>
      <div style={styles.title}>Order tracker</div>
      <div style={styles.subtitle}>Lettuce, Turnip, The Beet · v10.0-GH</div>
    </div>
    <div style={styles.headerActions}>
      {VAPID_PUBLIC_KEY && notifPerm !== 'granted' && notifPerm !== 'unsupported' && (
        <button
          style={{ ...styles.headerActionBtn, color: notifPerm === 'denied' ? '#993556' : GOLD }}
          onClick={onEnablePush}
          title={notifPerm === 'denied' ? 'Notifications blocked — enable in Settings' : 'Enable order notifications'}
        >
          <Bell size={16} />
        </button>
      )}
      <button
        style={{ ...styles.headerActionBtn, ...(backupFailing ? { color: '#E24B4A' } : {}) }}
        onClick={onOpenBackup}
        title={backupFailing ? "Backups are failing — tap for detail" : "Backup & restore"}
      >
        <Download size={16} />
      </button>
      <button style={styles.headerActionBtn} onClick={onPasteImport} title="Paste backup from clipboard">
        <Upload size={16} />
      </button>
    </div>
  </div>
  {exportMsg && <div style={styles.exportMsg}>{exportMsg}</div>}
  {notice && (
    <button
      onClick={onDismissNotice}
      style={{
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
        background: '#2a2f2d', border: '1px solid ' + GOLD, borderRadius: 8,
        padding: '10px 12px', margin: '8px 0', color: '#F5F0E8',
        fontSize: 12, lineHeight: 1.45, font: 'inherit',
      }}
    >
      {notice}
      <span style={{ display: 'block', marginTop: 4, color: '#5F5E5A', fontSize: 11 }}>
        Tap to dismiss
      </span>
    </button>
  )}
  <nav style={{ borderBottom: '1px solid #2d3a36' }}>
    <div style={{ display: 'flex' }}>
      {[
        ['orders', 'Orders'],
        ['cook', 'Cook'],
        ['shop', 'Shop'],
        ['rowan', 'Rowan'],
        ['ingredients', 'Ingredients'],
      ].map(([key, label]) => (
        <button
          key={key}
          style={{ ...styles.tab, ...(view === key ? styles.tabActive : {}), flex: 1 }}
          onClick={() => setView(key)}
        >
          {label}
          {key === 'orders' && activeCount > 0 && <span style={styles.tabBadge}>{activeCount}</span>}
        </button>
      ))}
    </div>
    <div style={{ display: 'flex', borderTop: '1px solid #2d3a36' }}>
      {[
        ['money', 'Money'],
        ['regulars', 'Regulars'],
        ['recipes', 'Recipes'],
        ['record', 'Record'],
        ['week', 'Week'],
      ].map(([key, label]) => (
        <button
          key={key}
          style={{ ...styles.tab, ...(view === key ? styles.tabActive : {}), flex: 1, borderBottom: 'none' }}
          onClick={() => setView(key)}
        >
          {label}
        </button>
      ))}
    </div>
  </nav>
</header>
    </>
  );
}
