// rowanArchive.js — the newer legacy material, rendered for the durable archive.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
//
// The archive is the one artifact meant to outlive the app, and it omitted
// EIGHT stores: Rowan's questions, the notes Kevin wrote him, the mystery
// boards, the kitchen roles, the households' own memories, their passport
// cabinets, the approved derivatives, and the decision ledger.
//
// An app cannot be called a legacy system while its human-readable archive
// leaves out most of the legacy material. Every one of those stores rides the
// backup, so the data was safe — it simply could not be READ by anyone who did
// not have the app.
//
// ═══════════════════════════════════════════════════════════════════════════
// IT IS A SECTION BUILDER, NOT A SECOND ARCHIVE
//
// `archiveExport.js` calls this and splices the sections in. One export path,
// one choke point, the same shape as hydrate. It takes normalized stores as
// arguments and reads no storage itself, so it is testable without a browser.
//
// ═══════════════════════════════════════════════════════════════════════════
// THIN RENDERS THIN
//
// Several of these are nearly empty — four confirmed practices, an empty
// decision ledger. Nothing here pads, summarises, or generates to make a
// section look finished. An honest empty section is information; a padded one
// is a lie that survives Kevin.
//
// MEDIA IS LISTED, NEVER FETCHED. Where a store references a recording or a
// photo, the archive names the file, its kind, and its checksum. No URLs, no
// tokens, no R2 calls — an archive that needs a live server is not an archive.

const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const dateOf = (v) => {
  if (!v) return '';
  const d = typeof v === 'number' ? new Date(v) : new Date(String(v));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
};

// An empty section is RENDERED, with a plain sentence saying so. Skipping it
// would let a reader assume the feature never existed rather than that nothing
// was written in it — the same gap-reporting spirit as the Chronicle.
function section(title, bodyParts, emptyLine) {
  const parts = [`<h2>${esc(title)}</h2>`];
  if (!bodyParts.length) {
    parts.push(`<p class="intro">${esc(emptyLine)}</p>`);
    return parts.join('\n');
  }
  return parts.concat(bodyParts).join('\n');
}

function mediaLine(m) {
  if (!m) return '';
  const bits = [m.kind, m.mediaKey, m.checksum ? `checksum ${m.checksum}` : '']
    .filter(Boolean).map(esc);
  return `<div class="meta">Recording: ${bits.join(' · ')}</div>`;
}

// ── Questions ───────────────────────────────────────────────────────────────
//
// UNANSWERED IS A VALID STATE. It renders as an open question, never as a gap
// to apologise for — a question Rowan asked that his father never got to is
// still the record of him asking it.
function questionsSection(store) {
  const items = ((store && store.questions) || []).slice().sort((a, b) => (a.at || 0) - (b.at || 0));
  const body = items.map(q => {
    const parts = [`<div class="entry"><div class="q">${esc(q.text || '')}</div>`];
    if (q.at) parts.push(`<div class="meta">${esc(dateOf(q.at))}</div>`);
    for (const m of q.media || []) parts.push(mediaLine(m));
    if (q.answer) parts.push(`<div class="a">${esc(q.answer)}</div>`);
    else parts.push('<div class="meta">Still open.</div>');
    parts.push('</div>');
    return parts.join('');
  });
  return section('Rowan asked', body, 'Nothing recorded yet.');
}

// ── Notes for Rowan ─────────────────────────────────────────────────────────
//
// PERSONAL, NOT PRIVATE. Set like a letter rather than a spec: no lock icons,
// no confidentiality framing, no summary. Exact text.
//
// A deleted note is simply absent. Deletion is allowed in that store by design,
// and an archive that resurrected something Kevin chose to remove would have
// overruled him about his own words to his own son.
function notesSection(store) {
  const items = ((store && store.notes) || []).slice().sort((a, b) => (a.at || 0) - (b.at || 0));
  const body = items.map(n => {
    const head = [dateOf(n.at), n.subjectLabel].filter(Boolean).map(esc).join(' · ');
    const parts = [`<div class="letter">`];
    if (head) parts.push(`<div class="meta">${head}</div>`);
    if (n.text) parts.push(`<p>${esc(n.text).replace(/\n/g, '<br>')}</p>`);
    for (const m of n.media || []) parts.push(mediaLine(m));
    parts.push('</div>');
    return parts.join('');
  });
  return section('From Dad', body, 'Nothing written yet.');
}

// ── Mystery boards ──────────────────────────────────────────────────────────
//
// OPEN IS NORMAL. No "unsolved" framing, no stale badge. Explanations render as
// a DATED SEQUENCE because how the answer changed as Rowan aged IS the record —
// collapsing them to the latest would keep the least interesting one.
function boardsSection(store) {
  const items = ((store && store.boards) || []).slice().sort((a, b) => (a.openedAt || 0) - (b.openedAt || 0));
  const body = items.map(b => {
    const parts = [`<div class="board"><div class="q">${esc(b.question)}</div>`];
    if (b.openedAt) parts.push(`<div class="meta">Asked ${esc(dateOf(b.openedAt))}</div>`);
    const evidence = (b.entries || []).slice().sort((x, y) => (x.at || 0) - (y.at || 0));
    for (const e of evidence) {
      const when = dateOf(e.at);
      const label = e.kind === 'explanation' ? 'Dad' : e.kind;
      parts.push(`<div class="ev"><span class="meta">${esc(when)} · ${esc(label)}</span> ${esc(e.text || e.ref || '')}</div>`);
    }
    if (b.finalAnswer) {
      parts.push(`<div class="a">${esc(b.finalAnswer)}</div>`);
      if (b.answeredAt) parts.push(`<div class="meta">Answered ${esc(dateOf(b.answeredAt))}</div>`);
    }
    parts.push('</div>');
    return parts.join('');
  });
  return section('Long questions', body, 'None started yet.');
}

// ── Kitchen roles ───────────────────────────────────────────────────────────
//
// A LIST OF WHAT HAPPENED, WITH NOTHING COMPUTED OVER IT. No totals, no counts
// per role, no streaks, no favourite. The module has a tested absence of
// scoring and the archive must not reintroduce it at the render layer — a
// display string that counts sessions per role is a scoreboard however it is
// phrased.
function rolesSection(store) {
  const items = ((store && store.sessions) || []).slice().sort((a, b) => (a.at || 0) - (b.at || 0));
  const body = items.map(sess => {
    const head = [dateOf(sess.at), (sess.roles || []).join(', ')].filter(Boolean).map(esc).join(' · ');
    const note = sess.note ? `<div>${esc(sess.note)}</div>` : '';
    return `<div class="entry"><div class="meta">${head}</div>${note}</div>`;
  });
  return section('In the kitchen', body, 'No sessions recorded yet.');
}

// ── Household memories ──────────────────────────────────────────────────────
// Their words, attributed to them, verbatim.
function memoriesSection(store) {
  const items = ((store && store.memories) || []).slice().sort((a, b) => (a.at || 0) - (b.at || 0));
  const body = items.map(m =>
    `<div class="entry"><div class="meta">${esc([dateOf(m.at), m.dishName].filter(Boolean).join(' · '))}</div>`
    + `<p>${esc(m.text)}</p></div>`);
  return section('What it meant to them', body, 'Nothing shared yet.');
}

// ── Passport cabinets ───────────────────────────────────────────────────────
//
// THEIR names and THEIR filing. A proposed cabinet renders as proposed and is
// never shown as holding anything — telling a reader a household filed
// something they never accepted would put words in their mouth.
function cabinetsSection(store) {
  const items = ((store && store.cabinets) || []).slice();
  const body = items.map(c => {
    if (c.status === 'proposed') {
      return `<div class="entry"><div class="meta">Suggested, not accepted: ${esc(c.name)}</div></div>`;
    }
    const dishes = (c.dishes || []).map(esc).join(', ');
    return `<div class="entry"><div class="q">${esc(c.name)}</div><div>${dishes}</div></div>`;
  });
  return section('How they filed it', body, 'No cabinets yet.');
}

// ── Derivatives ─────────────────────────────────────────────────────────────
//
// EDITED-SINCE-APPROVAL SHOWS PLAINLY. The store un-approves a derivative when
// its text changes, and an archive that printed it as approved would misreport
// what was cleared for an audience.
function derivativesSection(store) {
  const items = ((store && store.derivatives) || []).slice();
  const body = items.map(d => {
    const state = d.approvedAt ? 'approved' : 'not approved';
    return `<div class="entry"><div class="meta">${esc(d.audience)} · ${esc(state)}</div>`
      + `<p>${esc(d.text)}</p></div>`;
  });
  return section('Said another way', body, 'Nothing approved yet.');
}

// ── Decision ledger ─────────────────────────────────────────────────────────
//
// SHIPS EMPTY ON PURPOSE, and the section renders anyway saying so. Skipping it
// would let a reader conclude the feature never existed.
function ledgerSection(store) {
  const items = ((store && store.decisions) || []).slice();
  const body = items.map(d =>
    `<div class="entry"><div class="q">${esc(d.title)}</div>`
    + `<div class="meta">${esc(d.status)}${d.source ? ' · ' + esc(d.source) : ''}</div>`
    + (d.why ? `<p>${esc(d.why)}</p>` : '')
    + (d.reconsiderIf ? `<div class="meta">Worth asking again if: ${esc(d.reconsiderIf)}</div>` : '')
    + '</div>');
  return section('Decisions and why', body,
    'Nothing written here yet. The store ships empty on purpose: an entry is added when Kevin writes his own reasoning, not derived from the code.');
}

// THE RENDERERS, keyed by the backup payload field name they cover. The
// completeness gate reads these keys, so adding a section here is what makes a
// store count as archived.
export const ROWAN_ARCHIVE_SECTIONS = {
  rowanQuestions: questionsSection,
  notesRowan: notesSection,
  rowanBoards: boardsSection,
  rowanRoles: rolesSection,
  householdMemories: memoriesSection,
  passportCabinets: cabinetsSection,
  derivatives: derivativesSection,
  decisionLedger: ledgerSection,
};

export function buildRowanArchiveSections(stores = {}) {
  const html = [];
  const coverage = {};
  for (const [key, render] of Object.entries(ROWAN_ARCHIVE_SECTIONS)) {
    const store = stores[key];
    html.push(render(store));
    coverage[key] = countOf(key, store);
  }
  return { html: html.join('\n'), coverage };
}

function countOf(key, store) {
  if (!store) return 0;
  const list = store.questions || store.notes || store.boards || store.sessions
    || store.memories || store.cabinets || store.derivatives || store.decisions;
  return Array.isArray(list) ? list.length : 0;
}
