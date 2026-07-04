import { DISHES, ALL_ALWAYS_ITEMS } from './dishes.js';

// ═══════════════════════════════════════════════════════════════════════════
// EQUIPMENT CONFLICT ENGINE (producer-facing kitchen-capacity guardrail)
// ═══════════════════════════════════════════════════════════════════════════
// Kevin owns ONE of each scarce resource. When two checked dishes both want the
// same one during active cook time, that's a scheduling jam. This module tags
// each dish with the equipment it monopolizes and flags collisions for the week.
//
// Sous vide is EXCLUDED entirely (hands-off, runs in parallel, never contends).
//
// SEVERITY MODEL (see analyzeConflicts):
//   red    — a genuine, unsolvable long-hold collision (two hard-committed
//            Dutch-oven braises, two large-pot dishes, an oven temp clash).
//   yellow — solvable or soft:
//              • flexible dish can shift to its alt resource to break the jam
//              • fast-turnover wok dishes (run sequentially, wok clears fast)
//              • conditional tofu/polenta back-burner use ("may interact")
//   (no flag) — clear.
// ───────────────────────────────────────────────────────────────────────────

// Resource ids
export const R = {
  WOK: 'wok',
  DUTCH: 'dutch',
  BACK_BURNER: 'backBurner',
  LARGE_POT: 'largePot',
  OVEN_NORMAL: 'ovenNormal', // 350F (cookies)
  OVEN_LOW: 'ovenLow',       // braises
};

export const RESOURCE_LABELS = {
  [R.WOK]: 'wok',
  [R.DUTCH]: 'Dutch oven',
  [R.BACK_BURNER]: 'back burner',
  [R.LARGE_POT]: 'large pot',
  [R.OVEN_NORMAL]: 'oven (350°)',
  [R.OVEN_LOW]: 'oven (low/braise)',
};

// Resources whose hold time is short — dishes are "in and out", so two of them
// the same week run sequentially rather than truly colliding. Soft (yellow).
const FAST_TURNOVER = new Set([R.WOK]);

// ── PER-DISH EQUIPMENT MAP — DERIVED from the dish registry (dishes.js) ────
// Each dish record's `equipment` field lists the resources it ties up. Shapes:
//   fixed:    ['dutch', 'ovenLow']              — always uses these
//   flexible: ['dutch', 'largePot']             — can use EITHER (relief valve)
//   tofu:     true → back burner added only if the tofu version is in play
//   polenta:  true → back burner added (hard claim for the polenta variant)
//
// Keys are the EXACT dish `name` strings. A dish with NO equipment entry is
// silently skipped by the analysis — which is why the invariant suite requires
// every dinner to have one (empty fixed:[] is the explicit "never conflicts").
export const DISH_EQUIPMENT = {};
DISHES.forEach(d => { if (d.equipment) DISH_EQUIPMENT[d.name] = d.equipment; });
ALL_ALWAYS_ITEMS.forEach(it => { if (it.equipment) DISH_EQUIPMENT[it.name] = it.equipment; });

// ── ANALYSIS ────────────────────────────────────────────────────────────────
// Input: array of selected dish NAME strings (whatever is checked ON).
// Output: { red: [...], yellow: [...], clear: bool }
//   each entry: { resource, label, dishes: [names], note }
//
// Logic per resource:
//   • Build the set of dishes that COULD claim it.
//       - fixed includes it          → hard claim
//       - flexible oneOf includes it  → soft claim (can move away)
//       - tofu dish + back burner     → conditional claim (only if tofu ordered)
//       - polenta dish + back burner  → hard claim (polenta variant cooks there)
//   • If 2+ dishes claim a resource, decide severity:
//       - If EVERY claimant is flexible-on-this-resource, or enough are flexible
//         that the hard claimants fit alone → YELLOW (resolvable by shifting).
//       - Fast-turnover resource (wok) with multiple → YELLOW (sequential).
//       - Conditional (tofu) involvement → YELLOW ("may interact").
//       - Otherwise (2+ hard, immovable, long-hold) → RED.
//   • Oven is special: OVEN_NORMAL + OVEN_LOW both used the same week = RED temp
//     clash (oven can't hold two temps). Two OVEN_LOW dishes coexist (fine).

export function analyzeConflicts(selectedNames) {
  const names = (selectedNames || []).filter(n => DISH_EQUIPMENT[n]);
  const red = [];
  const yellow = [];

  // Helper: classify how a dish claims a given resource.
  //   'hard'        — must use it, can't move
  //   'flex'        — could use it but can shift to an alternative
  //   'conditional' — only uses it in a variant (tofu)
  //   null          — doesn't use it
  const claimType = (name, res) => {
    const e = DISH_EQUIPMENT[name];
    if (!e) return null;
    if (e.fixed && e.fixed.includes(res)) return 'hard';
    if (res === R.BACK_BURNER && e.polenta) return 'hard';
    if (res === R.BACK_BURNER && e.tofu) return 'conditional';
    if (e.flexible && e.flexible.includes(res)) return 'flex';
    return null;
  };

  // ── Single-resource checks (wok, dutch, back burner, large pot) ────────────
  const singleResources = [R.WOK, R.DUTCH, R.BACK_BURNER, R.LARGE_POT];
  singleResources.forEach(res => {
    const claimants = names
      .map(n => ({ name: n, type: claimType(n, res) }))
      .filter(c => c.type);
    if (claimants.length < 2) return;

    const hard = claimants.filter(c => c.type === 'hard');
    const flex = claimants.filter(c => c.type === 'flex');
    const cond = claimants.filter(c => c.type === 'conditional');
    const dishes = claimants.map(c => c.name);

    // Fast-turnover resource (wok): sequential, not a true jam → yellow.
    if (FAST_TURNOVER.has(res)) {
      yellow.push({
        resource: res,
        label: RESOURCE_LABELS[res],
        dishes,
        note: `${dishes.length} dishes use the ${RESOURCE_LABELS[res]}. These are quick in-and-out cooks, so you can run them back to back — the ${RESOURCE_LABELS[res]} clears fast. Just don't expect to do them simultaneously.`,
      });
      return;
    }

    // Conditional-only involvement (tofu back burner) with no hard pair → yellow.
    // i.e. the only reason there's a clash is the tofu option. Name the other
    // claimant (e.g. a polenta dish) so Kevin sees the full picture.
    if (hard.length < 2 && cond.length > 0) {
      const tofuNames = cond.map(c => c.name);
      const otherHard = hard.map(c => c.name); // e.g. a polenta dish on the back burner
      let note = `May interact on the ${RESOURCE_LABELS[res]} — only if you cook the tofu version${tofuNames.length > 1 ? 's' : ''} of ${tofuNames.join(', ')}.`;
      if (otherHard.length > 0) {
        note += ` That would put it on the ${RESOURCE_LABELS[res]} at the same time as ${otherHard.join(', ')}. Cook the meat/shrimp version instead and there's no clash.`;
      } else {
        note += ` The tofu version uses the ${RESOURCE_LABELS[res]}; the meat/shrimp version doesn't.`;
      }
      yellow.push({
        resource: res,
        label: RESOURCE_LABELS[res],
        dishes,
        note,
      });
      return;
    }

    // Resolvable by shifting a flexible dish away?
    // The resource can hold ONE dish at a time. If the number of dishes that
    // truly NEED this resource (hard) is ≤ 1, the flexibles can shift off it.
    if (hard.length <= 1 && flex.length > 0) {
      const movable = flex.map(c => c.name);
      yellow.push({
        resource: res,
        label: RESOURCE_LABELS[res],
        dishes,
        note: hard.length === 1
          ? `${hard[0].name} needs the ${RESOURCE_LABELS[res]}. ${movable.join(' and ')} can shift to the other pot, so no real jam — just don't put them all on the ${RESOURCE_LABELS[res]} at once.`
          : `${movable.join(' and ')} can each use the ${RESOURCE_LABELS[res]} OR the other pot, so this resolves itself — spread them out.`,
      });
      return;
    }

    // Otherwise: 2+ hard, immovable, long-hold → real red conflict.
    if (hard.length >= 2) {
      const hd = hard.map(c => c.name);
      const lead = hd.length === 2
        ? `${hd[0]} and ${hd[1]} both need the ${RESOURCE_LABELS[res]}, and neither can move.`
        : `${hd.join(', ')} all need the ${RESOURCE_LABELS[res]}, and none can move.`;
      red.push({
        resource: res,
        label: RESOURCE_LABELS[res],
        dishes: hd,
        note: `${lead} You can't run them at the same time — stagger them across the cook, or swap one off this week's menu.`,
      });
    }
  });

  // ── Oven temperature clash ─────────────────────────────────────────────────
  // OVEN_LOW dishes coexist with each other. OVEN_NORMAL (350, cookies) coexist
  // with each other. But ANY low + ANY normal = the oven can't hold both temps.
  const ovenLowDishes = names.filter(n => {
    const e = DISH_EQUIPMENT[n];
    return e && e.fixed && e.fixed.includes(R.OVEN_LOW);
  });
  const ovenNormalDishes = names.filter(n => {
    const e = DISH_EQUIPMENT[n];
    return e && e.fixed && e.fixed.includes(R.OVEN_NORMAL);
  });
  if (ovenLowDishes.length > 0 && ovenNormalDishes.length > 0) {
    red.push({
      resource: 'oven',
      label: 'oven temperature',
      dishes: [...ovenNormalDishes, ...ovenLowDishes],
      note: `Temperature clash: ${ovenNormalDishes.join(', ')} need${ovenNormalDishes.length === 1 ? 's' : ''} 350° while ${ovenLowDishes.join(', ')} need${ovenLowDishes.length === 1 ? 's' : ''} a low braise temp. The oven can only hold one temperature, so these can't bake together — do them in separate sessions or move one off the week.`,
    });
  }

  return {
    red,
    yellow,
    clear: red.length === 0 && yellow.length === 0,
  };
}
