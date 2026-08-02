// src/featureFlags.js — turning a customer capability off without a deploy.
//
// WHY THIS EXISTS, AND WHY IT SHOULD HAVE COME FIRST
//
// A great deal of customer-facing surface landed on ltbaustin.com in a single
// day: personalization, the amendment request box, the claim-code path, the
// request box, ingredient cards. Every one of those runs on the page Kevin's
// friends use to order dinner.
//
// Without a flag, a fault in any of them means editing code, pushing, waiting
// for a Cloudflare build, and hoping the gate is green — while the thing is
// broken in front of customers. With one, it means a tap and a publish.
//
// THE RULE THAT SHAPES THE WHOLE FILE: the base menu and the order process must
// work with EVERY optional flag off. A flag can remove a nicety. A flag must
// never be able to stop somebody ordering dinner. That is asserted by test, not
// just intended.
//
// ROLLOUT, not just on/off. "It works on my phone" is the oldest lie in
// software, and Kevin's phone is the one the owner app runs on. Stages let a
// feature reach exactly himself, then one household that will tell him the
// truth, then everyone.

// ── The registry ────────────────────────────────────────────────────────────
//
// Every customer capability that can be switched off. Adding one here and
// nowhere else does nothing: the surface has to check it. The gate below
// asserts that a declared flag is actually referenced somewhere.
export const FLAGS = [
  { id: 'personalization', label: 'Greeting by name', why: 'The "Hi Sarah" line and the per-dish tags on the order form.' },
  { id: 'amendments', label: 'Change requests', why: 'Lets a customer ask to change an order after placing it.' },
  { id: 'claimCode', label: 'New-phone codes', why: 'The "ordered before, on a different phone?" path.' },
  { id: 'requestBox', label: 'Dish requests', why: '"Want a dish back?" on the order form.' },
  { id: 'ingredientCards', label: 'Ingredient cards', why: 'Nothing customer-facing yet; Kevin sends these by hand.' },
  // BLOCKED, not forgotten. The cues exist (CueGallery, CueCapture, CueAtlas)
  // but all of them are owner-side, and cue images are fetched with
  // `?token=<PUBLISH_TOKEN>` in the URL. A customer page cannot carry the owner
  // token, so there is no way to show a customer a cue today without publishing
  // the token or building a second unauthenticated read path.
  // TO GO LIVE: a signed or public media route on the worker — most simply,
  // short-lived signed URLs minted when Kevin bakes the kitchen page, which is
  // already generated per order. A worker design decision, not a wiring job.
  { id: 'visualCues', label: 'Photo cues', why: 'Step photographs on the companion page.' },
  { id: 'freezerLens', label: 'Freezer filter', why: 'Menu filter by how a dish keeps in a freezer. Built Aug 1; the reheat walk it was waiting on is done.' },
  // BLOCKED on Kevin. He DEFERRED this on Jul 31: it needs a better walk and he
  // intended to rewrite the entry himself. The reheat walk it once waited on is
  // now done, so that part of the `why` below is stale.
  // TO GO LIVE: his rewritten walk entry, plus the reframe to argue for —
  // sequencing RULES, not a minute-precision timeline. The Walk 2 data supports
  // rules and does not support a solver; a timeline built from it is false
  // precision.
  { id: 'serveTogether', label: 'Serve-together timeline', why: 'Coordinated reheat schedule. Kevin is rewriting the walk entry.' },
  { id: 'awayMode', label: 'Away mode', why: 'Lets a customer say they are away for a week.' },
  { id: 'jarReturn', label: 'Jar returns', why: 'Shows how many jars a household holds.' },
  { id: 'beforeYouStart', label: 'Before you start', why: 'A card at the top of the kitchen page: how long, what to do first, what pans you need.' },
  { id: 'storagePlan', label: 'What to eat first', why: 'Per-component storage plan: what to eat now, what holds, what to freeze.' },
  { id: 'heatOnly', label: 'Cooking for fewer', why: 'How to heat part of an order without ruining the rest.' },
  { id: 'splitPack', label: 'Two-night packs', why: 'Lets a customer choose a divided pack on the order form. Shows nothing until a dish is declared splittable.' },
];

export const FLAG_IDS = FLAGS.map(f => f.id);

// ── Stages ──────────────────────────────────────────────────────────────────
//
// Ordered least to most exposed. The order matters: the owner UI renders them
// in this sequence, and "wider than it was" should read left to right.
export const STAGES = [
  { id: 'off', label: 'Off', note: 'Nobody sees it, including Kevin.' },
  { id: 'owner', label: 'Just me', note: 'Only Kevin\u2019s own recognised devices.' },
  { id: 'testers', label: 'Test households', note: 'The profiles listed below, and nobody else.' },
  { id: 'percent', label: 'Some customers', note: 'A stable share, chosen by profile so the same people keep seeing it.' },
  { id: 'on', label: 'Everyone', note: 'Every customer, recognised or not.' },
];

export const STAGE_IDS = STAGES.map(s => s.id);

// Sensible starting point: everything that already shipped is on, everything
// blocked on a walk is off. A flag with no entry defaults to OFF, which is the
// safe direction — a capability nobody has decided about should not be live.
export const DEFAULT_FLAGS = {
  personalization: { stage: 'on' },
  amendments: { stage: 'on' },
  claimCode: { stage: 'on' },
  requestBox: { stage: 'on' },
  ingredientCards: { stage: 'on' },
  visualCues: { stage: 'owner' },
  // ON BY DEFAULT (Kevin, Aug 2). It was flagged off because that is how every
  // customer feature had shipped, not because anyone argued it should be. The
  // flag id stays as a kill switch; the default is what changed.
  freezerLens: { stage: 'on' },
  serveTogether: { stage: 'off' },
  awayMode: { stage: 'off' },
  jarReturn: { stage: 'off' },
  beforeYouStart: { stage: 'owner' },
  storagePlan: { stage: 'owner' },
  heatOnly: { stage: 'owner' },
  // Off rather than owner: SPLIT_PACKAGING is empty, so even Kevin would see
  // nothing. It turns on after he runs the two-night walk.
  splitPack: { stage: 'off' },
};

export function normalizeFlags(raw) {
  const out = {};
  for (const id of FLAG_IDS) {
    const entry = (raw && raw[id]) || DEFAULT_FLAGS[id] || { stage: 'off' };
    const stage = STAGE_IDS.includes(entry.stage) ? entry.stage : 'off';
    out[id] = {
      stage,
      testers: Array.isArray(entry.testers) ? entry.testers.slice(0, 20) : [],
      percent: Math.max(0, Math.min(100, Number(entry.percent) || 0)),
    };
  }
  return out;
}

// ── Evaluation ──────────────────────────────────────────────────────────────
//
// STABLE BY PROFILE, not random. A percentage rollout that re-rolls on every
// page load would show a customer a feature on Monday and hide it on Tuesday,
// which reads as a bug and is impossible to report. Hashing the profile id
// means the same people keep seeing it until the number changes.
function stableBucket(profileId) {
  const s = String(profileId || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 100);
}

// ctx: { profileId, isOwner }
export function flagEnabled(flags, id, ctx = {}) {
  const f = (flags && flags[id]) || DEFAULT_FLAGS[id] || { stage: 'off' };
  const stage = f.stage || 'off';

  if (stage === 'off') return false;
  if (stage === 'on') return true;
  if (stage === 'owner') return !!ctx.isOwner;

  // Both remaining stages need to know who is asking. An unrecognised browser
  // has no profile, so it falls to the generic experience rather than being
  // bucketed at random — which would also make the rollout unstable.
  if (!ctx.profileId) return false;

  if (stage === 'testers') return (f.testers || []).includes(ctx.profileId);
  if (stage === 'percent') return stableBucket(ctx.profileId) < (Number(f.percent) || 0);
  return false;
}

// What the worker publishes to a specific customer: a flat map of id -> boolean,
// already evaluated. The customer page never sees the stage, the tester list, or
// the percentage — those are Kevin's operational settings, not facts about the
// person, and shipping them would leak how many people are in a test.
export function resolveForCustomer(flags, ctx = {}) {
  const out = {};
  for (const id of FLAG_IDS) out[id] = flagEnabled(flags, id, ctx);
  return out;
}

// A short plain-language description of where a flag stands, for the owner UI.
export function describeStage(entry) {
  const stage = (entry && entry.stage) || 'off';
  const def = STAGES.find(s => s.id === stage);
  if (stage === 'testers') {
    const n = ((entry && entry.testers) || []).length;
    return n ? `${n} household${n === 1 ? '' : 's'}` : 'No households picked yet';
  }
  if (stage === 'percent') return `${(entry && entry.percent) || 0}% of customers`;
  return def ? def.label : 'Off';
}

// ── The floor ───────────────────────────────────────────────────────────────
//
// Capabilities that are NOT flaggable, listed so nobody adds a switch for them
// later without arguing the case. Ordering dinner is the product; everything
// else is decoration on top of it.
export const NEVER_FLAGGED = [
  'the menu itself',
  'placing an order',
  'the allergen line on a dish',
  'reheat instructions',
  'the week-off notice',
];
