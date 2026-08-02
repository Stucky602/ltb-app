// canonRules.js — the handful of Kevin-confirmed statements a machine can check.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT MAKES A RULE ELIGIBLE
//
// Three things, and all three are required:
//
//   1. KEVIN SAID IT. Not "this follows from the data", not "this is good
//      practice". A rule here quotes a decision he made, and `source` names
//      where. A general culinary principle that happens to be true is NOT
//      eligible, because the moment this file contains things nobody agreed to
//      it becomes a generic rules engine — which the systems master explicitly
//      rejects, and which would start failing builds over opinions.
//
//   2. IT IS CHECKABLE FROM RECORDED DATA. Not from prose, not from vibes. If
//      answering it needs someone to read a sentence and judge, it belongs in
//      the Contradiction Desk instead.
//
//   3. VIOLATING IT IS A REAL DEFECT. Not a style preference.
//
// There are two rules in this file. That is not a placeholder — it is how many
// statements currently clear all three bars. It grows when Kevin confirms
// another one, and not before.
//
// ═══════════════════════════════════════════════════════════════════════════
// A FAILURE MUST SAY WHOSE RULE IT IS
//
// "Validation failed" teaches nobody anything and gets worked around. Every
// violation returned here carries the rule's own words and its source, so the
// person reading the failure can tell whether to fix the data or argue with the
// rule — and if it is the rule, they know who to ask.

import { REHEAT_DATA } from './reheatData.js';

// DELIBERATELY DOES NOT IMPORT splitPackaging.js.
//
// The first version did, for a default argument, and created a cycle:
// splitPackaging imports UNDIVIDABLE_MODES from here, so importing back created
// a module-level temporal dead zone that threw at load — "Cannot access
// 'UNDIVIDABLE_MODES' before initialization".
//
// Breaking it is also the right shape. A rules module that imports the data it
// validates has the dependency backwards: rules should not know their subjects.
// Callers pass the map in.

export const CANON_RULES = [
  {
    id: 'bag-is-vessel-not-divisible',
    statement: 'A component whose bag IS the vessel cannot be divided, and its copy must not tell '
      + 'someone to open it before the warming stage.',
    why: 'Opening it early costs the method, not just the packaging.',
    source: 'Kevin, Walk 2, recorded as the `bag-is-vessel` divide mode in reheatData.js',
  },
  {
    id: 'two-night-must-reheat-independently',
    statement: 'A two-night pack must be able to reheat one half without touching the other.',
    why: 'That independence IS the product. A split that still requires opening everything is more '
      + 'packaging for no benefit, and charging for it would be worse.',
    source: 'Kevin, the split-packaging brief; named as an executable rule in the systems master',
  },
];

const ruleById = (id) => CANON_RULES.find(r => r.id === id) || null;

// Components a split pack may not divide. THIS is the definition; splitPackaging
// imports it rather than keeping a second copy, so the rule and its enforcement
// cannot drift apart — which is the whole reason to have a rules file at all
// instead of a constant next to each consumer.
export const UNDIVIDABLE_MODES = ['bag-is-vessel', 'not-recommended'];

function violation(ruleId, subject, detail) {
  const rule = ruleById(ruleId);
  return {
    ruleId,
    subject,
    detail,
    // Carried on every violation. See the header: a failure that cannot be
    // traced to a person gets worked around rather than fixed.
    statement: rule ? rule.statement : '',
    source: rule ? rule.source : '',
  };
}

// ── Rule 1 ──────────────────────────────────────────────────────────────────
// A dish declared splittable must not contain a component that cannot be
// divided. Reads the reheat walk's recorded divide modes; asserts nothing about
// dishes Kevin has not declared.
export function checkBagIsVessel(splitMap, reheatData = REHEAT_DATA) {
  const out = [];
  for (const dishId of Object.keys(splitMap || {})) {
    const d = (reheatData || {})[dishId];
    if (!d) continue;
    for (const c of d.components || []) {
      const mode = c.divide && c.divide.mode;
      if (mode && UNDIVIDABLE_MODES.includes(mode)) {
        out.push(violation('bag-is-vessel-not-divisible', dishId,
          `Component "${c.key}" is recorded as ${mode}, so this dish cannot ship as a two-night pack.`));
      }
    }
  }
  return out;
}

// ── Rule 2 ──────────────────────────────────────────────────────────────────
// Every declared split must name containers for BOTH shapes, and the two-night
// map must actually hold more than one vessel. One container cannot be reheated
// half at a time, so a "split" that ships a single vessel is not one.
export function checkTwoNightIndependence(splitMap) {
  const out = [];
  for (const [dishId, entry] of Object.entries(splitMap || {})) {
    for (const v of (entry && entry.byVariant) || []) {
      const label = v && v.match instanceof RegExp ? String(v.match) : String((v && v.match) || '?');
      if (!v.family || !v.twoNight) {
        out.push(violation('two-night-must-reheat-independently', `${dishId} ${label}`,
          'A pack option is declared without containers for both shapes.'));
        continue;
      }
      const count = Object.values(v.twoNight).reduce((a, b) => a + (Number(b) || 0), 0);
      if (count < 2) {
        out.push(violation('two-night-must-reheat-independently', `${dishId} ${label}`,
          `The two-night pack resolves to ${count} container(s). One vessel cannot be heated half at a time.`));
      }
    }
  }
  return out;
}

// ── The customer-copy rules the systems master names ────────────────────────
//
// Deliberately NOT in CANON_RULES: these are checks on generated copy rather
// than statements Kevin made about food. Keeping them apart is what stops the
// canon list from quietly becoming a linter config.

// A storage or freezer claim in customer copy must be backed by a recorded
// verdict, and an UNTESTED verdict must carry its hedge. The hedge existing in
// the data and being dropped on the way to the customer is the failure.
export function checkFreezeClaims(reheatData = REHEAT_DATA) {
  const out = [];
  for (const [dishId, d] of Object.entries(reheatData || {})) {
    for (const c of (d && d.components) || []) {
      const f = c.freeze || {};
      if (!f.verdict || f.verdict === 'na') continue;
      if (!f.tested && !f.note) {
        out.push({
          ruleId: 'freeze-claim-needs-evidence',
          subject: `${dishId} / ${c.key}`,
          detail: `Freeze verdict "${f.verdict}" is untested and carries no note, so nothing explains the judgement.`,
          statement: 'An untested freeze verdict must say it is untested wherever it is shown.',
          source: 'The reheat walk records `tested`; the customer card prints the hedge from it.',
        });
      }
    }
  }
  return out;
}

// A dish that tells a customer they can heat part of an order must also tell
// them how to divide it. "Heat what you need" with no division instruction is
// an instruction to guess.
export function checkPartialHeatHasDivision(reheatData = REHEAT_DATA) {
  const out = [];
  for (const [dishId, d] of Object.entries(reheatData || {})) {
    for (const c of (d && d.components) || []) {
      const mode = c.divide && c.divide.mode;
      // ONLY 'pour-and-keep' NEEDS WORDS, and the narrowing is deliberate.
      //
      // 'scoop' (one container, take what you want), 'loose' (not sealed) and
      // 'pieces' (two chops, take one) explain themselves from the packaging a
      // customer is holding. 'pour-and-keep' does not: tip PART of a bag in and
      // the rest goes back, which raises how much, whether it reseals, and what
      // happens to what is left. That is the one a person cannot work out by
      // looking.
      //
      // The first version flagged 'pieces' too and produced six findings, two of
      // which were noise. A linter that cries wolf gets muted, and a muted
      // linter is worse than none.
      if (mode !== 'pour-and-keep') continue;
      if (!c.divide.note) {
        out.push({
          ruleId: 'partial-heat-needs-division',
          subject: `${dishId} / ${c.key}`,
          detail: `Divide mode "${mode}" has no note, so a customer is told they can heat part of it and not how.`,
          statement: 'A partial-reheat claim must carry division instructions.',
          source: 'Systems master §8.4, customer-copy linter',
        });
      }
    }
  }
  return out;
}

// Nothing private may be projected to another audience without an approved
// derivative. This is the machine-checkable half of the derivatives rule: a
// surface that asks for a projection it has not been granted.
export function checkProjectionsApproved(requests, derivativeStore, derivativeFor) {
  const out = [];
  for (const r of requests || []) {
    if (!derivativeFor(derivativeStore, r.sourceRecordId, r.audience)) {
      out.push({
        ruleId: 'projection-needs-approval',
        subject: `${r.sourceRecordId} → ${r.audience}`,
        detail: 'A surface asked to show this record to that audience and no approved derivative exists.',
        statement: 'A private record reaches another audience only through an approved derivative.',
        source: 'Systems master §2.5; src/derivatives.js',
      });
    }
  }
  return out;
}

// Everything, for the gate. Returns [] when the data is clean, which is the
// state today because SPLIT_PACKAGING is empty.
// The caller supplies the split map — see the import note above.
export function runCanonChecks(opts = {}) {
  const splitMap = opts.splitMap || {};
  const reheatData = opts.reheatData || REHEAT_DATA;
  return [
    ...checkBagIsVessel(splitMap, reheatData),
    ...checkTwoNightIndependence(splitMap),
  ];
}

export function canonRuleCount() {
  return CANON_RULES.length;
}
