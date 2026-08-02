// whatWasInMine.js — what was actually in the order somebody ate.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE ONE RULE
//
// DO NOT USE CURRENT CANON TO ANSWER A HISTORICAL QUESTION.
//
// Somebody asks what was in the Bolognese they had in March. The easy answer is
// to render today's recipe, and it is wrong in exactly the case where the
// question matters: the recipe changed in May, or the Worcestershire brand
// changed in July, and the person asking is asking BECAUSE something happened.
// A confident answer built from today's canon is worse than no answer, because
// it will be believed.
//
// So every layer here resolves as-of the order, and every layer that cannot
// says so out loud.
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS IS ASSEMBLY, NOT A NEW ENGINE
//
// src/ingredientCard.js already builds the card and has always accepted a
// `versionId` — it was written anticipating exactly this, with a comment saying
// "asked about a past order, pass that order's servedRecipeVersionId". That
// capability was dead until schema v5 started writing the field, because no
// order had one to pass. This file is the join that makes it live.
//
// Nothing here re-derives an ingredient list, an allergen claim, or a label. It
// resolves WHICH version of each of those applied, and hands off.
//
// ═══════════════════════════════════════════════════════════════════════════
// GAPS ARE PART OF THE ANSWER
//
// Modelled on chronicle.js: an answer carries a `gaps` array naming what could
// not be established, and the caller is expected to show them. An unrecorded
// version, an inherited one, an ingredient with no confirmed label — each is a
// real limit on how much the answer can be trusted, and hiding them would make
// a partial answer look complete.

import { buildIngredientCard } from './ingredientCard.js';
import { versionById, versionLabel, LEGACY_LABEL } from './recipeVersions.js';
import { labelVersionAt } from './labelVersions.js';
import { dishIdFor } from './dishIdentity.js';

// When the order happened. Falls back through the fields orders actually carry.
function orderTime(order) {
  const raw = (order && (order.deliveredAt || order.createdAt || order.date)) || null;
  const t = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(t) ? t : null;
}

// ONE ITEM. The unit of a real answer, because a four-dish order is four
// separate questions with four separate version histories.
export function whatWasInItem(order, item, { labelVersions, ingredientIds } = {}) {
  const gaps = [];
  const dishId = (item && (item.dishId || dishIdFor(item.name))) || null;
  const at = orderTime(order);

  if (!dishId) {
    return {
      dishId: null,
      dishName: (item && item.name) || 'Unknown dish',
      variant: (item && item.variant) || '',
      card: null,
      gaps: [`"${(item && item.name) || 'This item'}" does not resolve to a dish in the registry, so nothing can be said about what was in it.`],
      confident: false,
    };
  }

  // SERVED beats OFFERED. What they ate beats what they ordered against, and
  // they differ exactly when Kevin refined a dish between Sunday and Tuesday.
  const servedId = item.servedRecipeVersionId || null;
  const offeredId = item.offeredRecipeVersionId || null;
  const versionId = servedId || offeredId || null;

  if (!versionId) {
    gaps.push('No recipe version was recorded for this item, so the ingredients below are the recipe as it stands today, not necessarily what was cooked.');
  } else if (!servedId) {
    gaps.push('The version recorded is the one that was OFFERED when the order was placed. What was actually cooked was not stamped separately.');
  }
  if (item.versionInherited) {
    gaps.push('That version was recorded against the order as a whole rather than this dish, so it is the order\'s version, not a record of this dish specifically.');
  }
  if (versionId && !versionById(versionId)) {
    gaps.push(`Recipe version ${versionId} is referenced by this order but is not in the registry, so it cannot be read.`);
  }

  // The card, pinned to that version. buildIngredientCard already falls back to
  // the current recipe when versionId is null and says so in its own notes.
  const card = buildIngredientCard(dishId, { versionId: versionById(versionId) ? versionId : null });

  // LABELS AS OF THE ORDER DATE. Only for ingredients Kevin has actually
  // recorded; the store ships empty, so today this contributes nothing and says
  // nothing, which is correct rather than incomplete.
  const labels = [];
  if (labelVersions && at) {
    for (const ingId of (ingredientIds || [])) {
      const l = labelVersionAt(labelVersions, ingId, at);
      if (l) labels.push({ ingredientId: ingId, brand: l.brand, product: l.product, ingredientText: l.ingredientText, allergenText: l.allergenText });
    }
  }
  if (!at) {
    gaps.push('This order carries no usable date, so any packaged-product labels could not be resolved to the week it was made.');
  }

  // Order-level accommodations that changed the food. Recorded as they were
  // written, never interpreted.
  const notes = [];
  if (item.note) notes.push(item.note);
  if (order && order.notes) notes.push(order.notes);
  if (order && order.carlMode) {
    notes.push('This order was placed in Carl mode, so the standing substitutions applied.');
    gaps.push('Carl-mode substitutions are derived at display time from current rulings, so a ruling changed since this order would change what is shown here.');
  }

  return {
    dishId,
    dishName: card ? card.dishName : item.name,
    variant: item.variant || '',
    recipeVersionId: versionId || null,
    versionLabel: versionId ? versionLabel(versionId) : LEGACY_LABEL,
    versionWasRecorded: !!versionId,
    versionWasServed: !!servedId,
    card,
    labels,
    notes,
    gaps,
    // The one-line honesty flag a UI can lead with. True only when the exact
    // cooked version is on record for this specific dish.
    confident: !!servedId && !item.versionInherited && !!versionById(servedId),
  };
}

// A WHOLE ORDER. Each item answered separately; the order-level gaps are the
// union, deduplicated, because the same limitation stated four times reads as
// four problems.
export function whatWasInOrder(order, opts = {}) {
  const items = (order && Array.isArray(order.items) ? order.items : [])
    .map(it => whatWasInItem(order, it, opts));
  const gaps = [...new Set(items.flatMap(i => i.gaps))];
  return {
    orderId: (order && order.id) || null,
    customer: (order && order.customer) || '',
    at: (order && (order.deliveredAt || order.createdAt || order.date)) || null,
    items,
    gaps,
    // Confident only when EVERY item is. One unknown dish makes the order's
    // answer partial, and rounding that up would be the whole failure.
    confident: items.length > 0 && items.every(i => i.confident),
  };
}

// Plain text, for pasting into a message — the way Kevin actually answers this
// question. The gaps are printed, not appended as a disclaimer: they are part
// of the answer and belong where they are read.
export function whatWasInOrderText(answer) {
  if (!answer) return '';
  const out = ['What was in this order', ''];
  if (answer.at) out.push(`Delivered ${String(answer.at).slice(0, 10)}`, '');
  for (const item of answer.items) {
    out.push(`${item.dishName}${item.variant ? ` — ${item.variant}` : ''}`);
    if (item.card) {
      out.push(...item.card.ingredients.map(i => '  ' + i));
      if (item.card.allergens) out.push(`  CONTAINS: ${item.card.allergens}`);
    } else {
      out.push('  (no ingredient list could be produced)');
    }
    for (const l of item.labels) {
      // BRAND FIRST, and named rather than folded into the text. Kevin's reason
      // for recording it: so somebody can go and look the product up themselves.
      // An allergy-conscious customer trusts the manufacturer's own published
      // list over one retyped by a cook, and the brand is what makes that
      // possible. Printing only the ingredient text would keep the information
      // and lose the point of it.
      out.push(`  ${[l.brand, l.product].filter(Boolean).join(' ')}${l.brand ? ' (look it up if you want the full label)' : ''}`);
      out.push(`    ${l.ingredientText}`);
    }
    out.push(`  Recipe version: ${item.versionWasRecorded ? item.recipeVersionId : 'not recorded'}`);
    out.push('');
  }
  if (answer.gaps.length) {
    out.push('WHAT THIS DOES NOT KNOW');
    out.push(...answer.gaps.map(g => '  ' + g));
    out.push('');
  }
  return out.join('\n');
}
