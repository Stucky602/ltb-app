// walks.js — the config objects WalkEngine was built to consume.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS FILE EXISTS
//
// `WalkEngine.jsx` was built in July to be the one surface for "step through a
// list, answer something per item, save as you go, stop anywhere", after eight
// separate walks had been hand-built in chat. It was finished, committed, and
// then imported by NOTHING. Zero references outside its own file: not mounted,
// not tested, not reachable. The standing action item asking Kevin to "click
// through one walk before anything high-stakes uses it" was impossible, because
// there was no walk on any screen to click.
//
// So this is the ninth walk being a config object, which was the whole promise,
// and it is also the first time the engine runs at all.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT A WALK IS FOR, AND WHAT IT IS NOT
//
// A walk asks Kevin things only Kevin knows. It does NOT propose food facts and
// wait to be corrected — that failure is on record twice, once when Claude
// guessed twelve cut-gates and got eleven wrong, and once when a pre-filled
// 27-dish reheat sweep was dropped after three of the first five guesses were
// wrong. Prefill is for values ALREADY RECORDED somewhere (a stored answer, a
// figure from another store), never for a guess about how food behaves.
//
// The one exception below is deliberate and marked: the split-packaging walk
// prefills a container map derived from the dish's existing packaging, because
// that is arithmetic on data Kevin already gave, not an opinion about cooking.

import { REHEAT_DATA, DIVIDE_MODES } from './reheatData.js';
import { splitCandidates } from './splitPackaging.js';
import { dishNameFor } from './dishIdentity.js';
import { PIPELINE_DISHES } from './pipelineDishes.js';

const nameOf = (dishId) => {
  try { return dishNameFor(dishId, dishId) || dishId; } catch { return dishId; }
};

// ── SPLIT PACKAGING ─────────────────────────────────────────────────────────
//
// The walk that turns an empty SPLIT_PACKAGING map into a live feature. Until
// Kevin runs it, no customer sees a packaging choice anywhere, which is why
// this ships in the same batch as the mechanism rather than after it.
export function splitPackagingWalk() {
  const items = splitCandidates().map(c => ({
    ...c,
    name: nameOf(c.dishId),
  }));
  return {
    id: 'split-packaging',
    title: 'Which dishes can ship as two',
    blurb: 'A two-night pack divides the same food into halves that reheat independently. '
      + 'The reheat walk already says which components divide; what it cannot know is whether '
      + 'packing two is worth the Tuesday and whether you have the containers.',
    items,
    itemKey: (it) => it.dishId,
    itemLabel: (it) => it.name,
    itemSub: (it) => (it.blockers.length
      // The blocker is stated rather than used to hide the dish: Kevin may know
      // a way round it that the Walk 2 answer did not capture.
      ? `${it.components} components · ${it.blockers.map(b => `${b.key} ${b.mode}`).join(', ')}`
      : `${it.components} components, all divide cleanly`),
    fields: () => ([
      { key: 'offer', label: 'Offer a two-night pack?', type: 'select',
        options: ['', 'yes', 'no', 'maybe later'] },
      { key: 'variants', label: 'Which sizes (Large only, both, …)', type: 'text' },
      { key: 'containers', label: 'What the two-night pack ships in', type: 'text',
        placeholder: 'e.g. 2 x 32 oz round instead of 1 x 48 oz' },
      { key: 'surcharge', label: 'Surcharge, if any', type: 'text', placeholder: 'blank = absorbed' },
      { key: 'note', label: 'Anything worth recording', type: 'textarea' },
    ]),
    prefill: null, // no guesses about food; see the header
  };
}

// ── PIPELINE TRIAGE ─────────────────────────────────────────────────────────
// Recurring. Every candidate still in testing, one at a time.
export function pipelineTriageWalk() {
  const items = (PIPELINE_DISHES || []).filter(d => !d.status || d.status === 'testing');
  return {
    id: 'pipeline-triage',
    title: 'Pipeline triage',
    blurb: 'Every candidate still in testing. Ship it, cut it, or leave it where it is.',
    items,
    itemKey: (it) => it.key,
    itemLabel: (it) => it.title,
    itemSub: (it) => it.origin || '',
    fields: () => ([
      { key: 'verdict', label: 'Where does it stand?', type: 'select',
        options: ['', 'still testing', 'ship it', 'cut it'] },
      // Named in Kevin's own terms. COOK means "not right for LTB", which he
      // corrected twice, so the label says that rather than the bare word.
      { key: 'gate', label: 'If cut, which gate did it fail?', type: 'select',
        options: ['', 'reheat', 'wow', 'cook (not right for LTB)'] },
      { key: 'why', label: 'Why, in your words', type: 'textarea' },
    ]),
    prefill: null,
  };
}

// ── FREEZE VERIFICATION ─────────────────────────────────────────────────────
// The one walk that prefills, and only from values already recorded: it lists
// the components whose freeze verdict is marked untested so the hedge can come
// off once Kevin has actually frozen one.
export function freezeVerificationWalk() {
  const items = [];
  for (const [dishId, d] of Object.entries(REHEAT_DATA || {})) {
    for (const c of (d && d.components) || []) {
      const f = c.freeze || {};
      if (f.verdict && f.verdict !== 'na' && !f.tested) {
        items.push({ dishId, key: `${dishId}::${c.key}`, component: c.key, verdict: f.verdict, note: f.note || '' });
      }
    }
  }
  return {
    id: 'freeze-verification',
    title: 'Freeze verdicts still unproven',
    blurb: 'Each of these is recorded as a judgement rather than a test. Freezing one and saying '
      + 'what happened is what lets the hedge come off the customer card.',
    items,
    itemKey: (it) => it.key,
    itemLabel: (it) => `${nameOf(it.dishId)} — ${it.component}`,
    itemSub: (it) => `currently "${it.verdict}", untested${it.note ? ` · ${it.note}` : ''}`,
    fields: () => ([
      { key: 'tested', label: 'Have you frozen and thawed this one?', type: 'select',
        options: ['', 'yes', 'not yet'] },
      { key: 'verdict', label: 'What actually happened', type: 'select',
        options: ['', 'excellent', 'well', 'acceptable', 'no'] },
      { key: 'note', label: 'In your words', type: 'textarea' },
    ]),
    // Recorded value, not a guess: this is the existing verdict shown back so
    // Kevin confirms or changes it rather than retyping it.
    prefill: (it) => ({ verdict: it.verdict, note: it.note }),
  };
}

// ── PRICE STALENESS ─────────────────────────────────────────────────────────
export function priceStalenessWalk(ingredients, staleDays = 120) {
  const cutoff = Date.now() - staleDays * 86400000;
  const items = (ingredients || [])
    .filter(i => !i.updatedAt || Date.parse(i.updatedAt) < cutoff)
    .slice(0, 60);
  return {
    id: 'price-staleness',
    title: 'Prices nobody has touched in a while',
    blurb: 'A stale price does not announce itself; it just quietly makes a margin wrong. '
      + 'Skip anything you have not bought recently.',
    items,
    itemKey: (it) => it.id,
    itemLabel: (it) => it.name,
    itemSub: (it) => `${it.current ?? it.baseline} per ${it.unit}`,
    fields: () => ([
      { key: 'price', label: 'What does it cost now?', type: 'text', placeholder: 'leave blank to skip' },
      { key: 'note', label: 'Note', type: 'text' },
    ]),
    prefill: (it) => ({ price: String(it.current ?? it.baseline ?? '') }),
  };
}

// The registry the UI lists. Each entry is built lazily because several read
// live stores that do not exist at module load.
export const WALKS = [
  { id: 'split-packaging', label: 'Two-night packs', build: () => splitPackagingWalk() },
  { id: 'freeze-verification', label: 'Unproven freeze verdicts', build: () => freezeVerificationWalk() },
  { id: 'pipeline-triage', label: 'Pipeline triage', build: () => pipelineTriageWalk() },
  { id: 'price-staleness', label: 'Stale prices', build: (ctx) => priceStalenessWalk(ctx && ctx.ingredients) },
];

export const WALK_ANSWERS_VERSION = 1;

export function emptyWalkAnswers() {
  return { version: WALK_ANSWERS_VERSION, walks: {} };
}

export function normalizeWalkAnswers(raw) {
  if (!raw || typeof raw !== 'object' || !raw.walks || typeof raw.walks !== 'object') return emptyWalkAnswers();
  const walks = {};
  for (const [id, byItem] of Object.entries(raw.walks)) {
    if (!byItem || typeof byItem !== 'object') continue;
    const clean = {};
    for (const [k, v] of Object.entries(byItem)) {
      if (v && typeof v === 'object') clean[k] = v;
    }
    walks[String(id)] = clean;
  }
  return { version: WALK_ANSWERS_VERSION, walks };
}

// Save per item, matching the engine's own contract: answering IS saving, and
// there is no session-complete event to lose everything against.
export function recordWalkAnswer(store, walkId, itemKey, answer) {
  const s = normalizeWalkAnswers(store);
  const walk = { ...(s.walks[walkId] || {}), [itemKey]: answer };
  return { ...s, walks: { ...s.walks, [walkId]: walk } };
}

export function walkProgress(store, walkId, total) {
  const s = normalizeWalkAnswers(store);
  const answered = Object.values(s.walks[walkId] || {})
    .filter(a => a && Object.values(a).some(v => String(v || '').trim())).length;
  return { answered, total, done: total > 0 && answered >= total };
}
