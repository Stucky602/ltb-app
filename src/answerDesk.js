// answerDesk.js — answering a customer's question about THEIR order.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT MAKES THIS DIFFERENT FROM THE ASK BOX
//
// The existing ask box grounds a model on the order and lets it talk. This does
// not talk. It RETRIEVES from a fixed set of approved customer-safe records,
// scoped to the exact thing that customer received, and when it has nothing it
// says so and stops.
//
// ═══════════════════════════════════════════════════════════════════════════
// IT FAILS CLOSED, AND THAT IS THE FEATURE
//
// A wrong answer here reaches somebody deciding what to eat. So:
//
//   * Only the sources listed in ALLOWED_SOURCES are searchable. Nothing
//     reaches a customer because it happened to be in the corpus.
//   * Everything is scoped to the customer's OWN order — their dish, their
//     variant, their recipe version, their packaging. A true statement about a
//     different version is a wrong answer here.
//   * No synthesis. Every answer is a record with a traceable id.
//   * When nothing matches, the reply is that LTB has no approved answer for
//     this package, and the question becomes an escalation for Kevin.
//
// "I do not have an approved answer" is a correct, useful reply. A plausible
// invention is the failure this whole layer exists to prevent.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE THREE EMPTY SOURCES ARE EXPECTED, NOT BROKEN
//
// Six of the nine allowed sources carry real content today. Layered
// explanations, accommodation decisions, and Kevin-approved prior answers do
// not — the first and third are walk work, the second needs the Accommodation
// Workbench. The Desk is built to answer from what exists and decline the rest,
// so each walk narrows the gap without a deploy.

import { buildIngredientCard, cardsNeedingReview } from './ingredientCard.js';
import { reheatDataFor } from './reheatData.js';
import { classifyDish, lensBox } from './freezerLens.js';
import { derivativeFor } from './derivatives.js';
import { dishIdFor } from './dishIdentity.js';
import { versionById, versionLabel } from './recipeVersions.js';

// THE WHITELIST. A source not on this list cannot reach a customer through this
// path, whatever else the app knows.
export const ALLOWED_SOURCES = [
  { id: 'ingredientCard', label: 'What is in it', live: true },
  { id: 'reheat', label: 'How to reheat it', live: true },
  { id: 'storage', label: 'How long it keeps', live: true },
  { id: 'freezer', label: 'Whether it freezes', live: true },
  { id: 'divide', label: 'Heating only part of it', live: true },
  { id: 'askBox', label: 'Things Kevin wrote for this dish', live: true },
  // Empty today. Listed anyway so the Desk reports honestly on what it COULD
  // consult, rather than hiding the shape of its own knowledge.
  { id: 'explanation', label: 'Layered explanations', live: false },
  { id: 'accommodation', label: 'Accommodation decisions', live: false },
  { id: 'priorAnswer', label: 'Answers Kevin has approved before', live: false },
];

// Question shapes, matched deterministically. No model, no fuzzy matching: a
// customer must be able to see why they got the answer they got, and an
// unexplainable hit on a food question is worse than a miss.
const INTENTS = [
  { id: 'ingredients', re: /\b(what.*in it|ingredient|contain|allerg|gluten|dairy|nut|soy|shellfish|vegan|vegetarian)\b/i, sources: ['ingredientCard', 'explanation'] },
  { id: 'reheat', re: /\b(reheat|heat|warm|oven|microwave|stove|cook it|how long.*heat)\b/i, sources: ['reheat', 'askBox'] },
  { id: 'freeze', re: /\b(freeze|freezer|frozen)\b/i, sources: ['freezer', 'storage'] },
  { id: 'keeps', re: /\b(how long|keep|last|fridge|shelf|use by|go off|spoil)\b/i, sources: ['storage', 'freezer'] },
  { id: 'partial', re: /\b(half|part of|some of|split|two nights|leftover)\b/i, sources: ['divide', 'reheat'] },
];

function intentFor(question) {
  const q = String(question || '');
  return INTENTS.filter(i => i.re.test(q));
}

// THE CONTEXT A QUESTION MUST BE ANSWERED AGAINST.
//
// Not "the Bolognese" — THEIR Bolognese: the variant they bought, the recipe
// version they were served, the packaging it came in. Answering from the
// current recipe is the failure the whole version-stamping effort existed to
// prevent, so an item with no recorded version is reported as such rather than
// quietly answered from today's canon.
export function resolveContext(order, item) {
  const dishId = (item && (item.dishId || dishIdFor(item.name))) || null;
  const servedId = (item && item.servedRecipeVersionId) || null;
  const offeredId = (item && item.offeredRecipeVersionId) || null;
  const versionId = servedId || offeredId || null;
  return {
    dishId,
    dishName: (item && item.name) || '',
    variant: (item && item.variant) || '',
    recipeVersionId: versionId,
    versionLabel: versionId ? versionLabel(versionId) : null,
    versionIsExact: !!servedId && !item.versionInherited && !!versionById(servedId),
    packShape: (item && item.packShape) || 'family',
    at: (order && (order.deliveredAt || order.createdAt || order.date)) || null,
  };
}

const hit = (source, text, recordId) => ({ source, text: String(text).trim(), recordId });

// Retrieval, one source at a time. Each returns [] rather than throwing, so a
// single odd store cannot take the Desk down.
function fromIngredientCard(ctx, stores) {
  if (!ctx.dishId) return [];
  try {
    // WITHHELD CARDS STAY WITHHELD. A card flagged for review contains an
    // unresolved spice blend, and a partial ingredient list read as complete is
    // the worst possible answer on an allergen question.
    if (cardsNeedingReview({}).some(c => c.dishId === ctx.dishId)) return [];
    const card = buildIngredientCard(ctx.dishId, { versionId: ctx.recipeVersionId || null });
    if (!card || !card.ingredients || !card.ingredients.length) return [];
    const parts = [card.ingredients.join(', ')];
    if (card.allergens) parts.push(`Contains: ${card.allergens}`);
    return [hit('ingredientCard', parts.join('. '), `card:${ctx.dishId}`)];
  } catch { return []; }
}

function fromReheatData(ctx, kind) {
  if (!ctx.dishId) return [];
  try {
    const d = reheatDataFor(ctx.dishId);
    if (!d) return [];
    const out = [];
    if (kind === 'askBox') {
      for (const line of d.askBox || []) out.push(hit('askBox', line, `ask:${ctx.dishId}`));
    }
    if (kind === 'storage') {
      for (const c of d.components || []) {
        const t = (c.freeze || {}).customer;
        if (t) out.push(hit('storage', t, `store:${ctx.dishId}:${c.key}`));
      }
    }
    if (kind === 'divide') {
      for (const c of d.components || []) {
        const t = (c.divide || {}).customer;
        if (t) out.push(hit('divide', t, `divide:${ctx.dishId}:${c.key}`));
      }
    }
    if (kind === 'reheat') {
      if (d.timing && d.timing.min) {
        const t = d.timing.min === d.timing.max
          ? `About ${d.timing.min} minutes start to finish.`
          : `About ${d.timing.min} to ${d.timing.max} minutes start to finish.`;
        out.push(hit('reheat', t, `timing:${ctx.dishId}`));
      }
      for (const line of d.safety || []) out.push(hit('reheat', line, `safety:${ctx.dishId}`));
    }
    return out;
  } catch { return []; }
}

function fromFreezerLens(ctx) {
  if (!ctx.dishId) return [];
  try {
    const c = classifyDish(ctx.dishId);
    if (!c) return [];
    const box = lensBox(c);
    const text = [box.lead, box.detail].filter(Boolean).join(' ');
    return text ? [hit('freezer', text, `lens:${ctx.dishId}`)] : [];
  } catch { return []; }
}

// The three empty ones. Written as real lookups rather than stubs so they start
// answering the moment content exists, with no further work.
function fromDerivative(ctx, stores, sourceId) {
  const store = stores && stores.derivatives;
  if (!store || !ctx.dishId) return [];
  try {
    const key = `${sourceId}:${ctx.dishId}${ctx.recipeVersionId ? `@${ctx.recipeVersionId}` : ''}`;
    const d = derivativeFor(store, key, 'customer');
    return d ? [hit(sourceId, d.text, d.id)] : [];
  } catch { return []; }
}

function collect(sourceId, ctx, stores) {
  switch (sourceId) {
    case 'ingredientCard': return fromIngredientCard(ctx, stores);
    case 'reheat': return fromReheatData(ctx, 'reheat');
    case 'storage': return fromReheatData(ctx, 'storage');
    case 'divide': return fromReheatData(ctx, 'divide');
    case 'askBox': return fromReheatData(ctx, 'askBox');
    case 'freezer': return fromFreezerLens(ctx);
    case 'explanation':
    case 'accommodation':
    case 'priorAnswer': return fromDerivative(ctx, stores, sourceId);
    default: return [];
  }
}

export const NO_ANSWER =
  'LTB does not have an approved answer for this one. I have sent it to Kevin and he will reply himself.';

// THE ENTRY POINT.
//
// Returns { answered, intents, context, hits, text, escalation }. `answered` is
// false whenever nothing was found, and the caller must show `text` as-is
// rather than dressing it up — the whole value of a fail-closed layer is that
// its silence is trustworthy.
export function answerQuestion(question, { order, item, stores } = {}) {
  const ctx = resolveContext(order, item);
  const intents = intentFor(question);

  // An unrecognised question is not a failure of retrieval and must not be
  // answered by searching everything on the off chance.
  const sourceIds = [...new Set(intents.flatMap(i => i.sources))];
  const hits = sourceIds.flatMap(id => collect(id, ctx, stores));

  const escalation = {
    question: String(question || '').trim(),
    askedAt: Date.now(),
    context: ctx,
    // What it looked in, so Kevin can tell "nothing written" from "looked in the
    // wrong place" without re-deriving anything.
    searched: sourceIds,
    intentsMatched: intents.map(i => i.id),
    // Named so an escalation caused by a withheld card is not mistaken for a
    // gap in what Kevin has written.
    unresolvedCard: !!(ctx.dishId && cardsNeedingReview({}).some(c => c.dishId === ctx.dishId)),
  };

  if (!hits.length) {
    return { answered: false, intents, context: ctx, hits: [], text: NO_ANSWER, escalation };
  }

  // Version honesty travels with the answer. A customer asking what was in
  // their food deserves to know when the answer is the current recipe rather
  // than the one they were served.
  const caveats = [];
  if (!ctx.recipeVersionId) {
    caveats.push('This is the recipe as it stands now; the version you were served was not recorded.');
  } else if (!ctx.versionIsExact) {
    caveats.push('This is the version recorded on the order rather than on this dish specifically.');
  }

  return {
    answered: true,
    intents,
    context: ctx,
    hits,
    text: [...hits.map(h => h.text), ...caveats].join(' '),
    escalation: null,
  };
}

// What Kevin sees. Deliberately a packet rather than a notification: the
// question alone is not actionable, and re-deriving which version and packaging
// the customer had is exactly the work the Desk already did.
export function escalationSummary(esc) {
  if (!esc) return '';
  const c = esc.context || {};
  const lines = [
    `Q: ${esc.question}`,
    `Dish: ${c.dishName || 'unknown'}${c.variant ? ` (${c.variant})` : ''}`,
    `Version: ${c.recipeVersionId || 'not recorded'}${c.versionIsExact ? '' : ' — not exact'}`,
    `Packaging: ${c.packShape}`,
    `Looked in: ${(esc.searched || []).join(', ') || 'nothing — the question matched no known shape'}`,
  ];
  if (esc.unresolvedCard) {
    lines.push('NOTE: this dish\u2019s ingredient card is withheld pending a spice-blend answer, so the Desk could not use it.');
  }
  return lines.join('\n');
}

// ── BAKED FOR THE WORKER ────────────────────────────────────────────────────
//
// The worker cannot run any of this. It is a standalone script in the
// Cloudflare dashboard with no access to the registry, the reheat data, or the
// ingredient cards — all of which live in the app bundle.
//
// So the answers are PRECOMPUTED when Kevin bakes a customer's page, and shipped
// alongside the HTML that is already baked the same way. The worker then does
// nothing cleverer than match a question against the patterns it was handed.
//
// THE PATTERNS TRAVEL WITH THE ANSWERS, as strings, rather than being copied
// into worker.js. One definition, one place to change it, and no chance of the
// two drifting into answering different questions.
//
// Baked per ORDER, so every answer is already scoped to that customer's dishes,
// variants, versions, and packaging. There is no lookup for the worker to get
// wrong.
export function bakeDeskAnswers(order, stores = {}) {
  const out = [];
  for (const item of ((order && order.items) || [])) {
    if (!item || !item.name) continue;
    const ctx = resolveContext(order, item);
    if (!ctx.dishId) continue;
    for (const intent of INTENTS) {
      const hits = [...new Set(intent.sources)].flatMap(id => collect(id, ctx, stores));
      if (!hits.length) continue;
      const caveats = [];
      if (!ctx.recipeVersionId) {
        caveats.push('This is the recipe as it stands now; the version you were served was not recorded.');
      } else if (!ctx.versionIsExact) {
        caveats.push('This is the version recorded on the order rather than on this dish specifically.');
      }
      out.push({
        dish: item.name,
        intent: intent.id,
        // `source` of a RegExp, so the worker rebuilds the identical matcher.
        pattern: intent.re.source,
        flags: 'i',
        text: [...hits.map(h => h.text), ...caveats].join(' '),
        recordIds: hits.map(h => h.recordId),
      });
    }
  }
  return out;
}

// The worker's half, kept here so both sides of the contract are readable
// together. A question matches an answer when the intent pattern hits AND the
// dish is named — or when the order has only one dish, in which case "can I
// freeze it" is unambiguous.
export function matchBakedAnswer(baked, question, dishCount) {
  const q = String(question || '');
  // WORD-BOUNDARY, not substring. A plain `includes` treats any dish name as
  // named the moment its letters appear anywhere — a test fixture called "A"
  // matched "can I freeze it", and a real dish called Rice would match "how do
  // I cook the rice" on a completely different dish's question.
  const namesDish = (dish) => {
    const d = String(dish || '').trim();
    if (!d) return false;
    const esc = d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try { return new RegExp(`(^|\\W)${esc}(\\W|$)`, 'i').test(q); } catch { return false; }
  };
  const named = (baked || []).filter(b => namesDish(b.dish));
  const pool = named.length ? named : (dishCount === 1 ? (baked || []) : []);
  for (const b of pool) {
    try {
      if (new RegExp(b.pattern, b.flags || 'i').test(q)) return b;
    } catch { /* a malformed pattern must not break the ask box */ }
  }
  return null;
}

export function deskCoverage() {
  const live = ALLOWED_SOURCES.filter(s => s.live);
  return {
    total: ALLOWED_SOURCES.length,
    live: live.length,
    empty: ALLOWED_SOURCES.filter(s => !s.live).map(s => s.id),
  };
}
