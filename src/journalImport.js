// journalImport.js — the sort-and-migrate path for harvested knowledge.
//
// WHY THIS EXISTS: the fastest way to fill a decade-long record is not to face
// a blank textarea. It is to take what Kevin has ALREADY said — in chat, in his
// philosophy docs, in a text to a friend — and turn it into entries he corrects
// rather than composes. Correcting a draft is a fraction of the effort of
// writing one, which is the whole reason the harvest is a recurring practice
// rather than a one-off.
//
// THE FORMAT is deliberately writable by a human AND generatable by Claude,
// because both will produce it. Blocks separated by blank lines; bracketed keys
// on their own lines; everything else is the entry text.
//
//     [dish] Bo Ssam
//     [type] technique
//     [confidence] firm
//     Sear the tofu yourself. It reheats better than a steak does.
//
//     [dish] Gumbo
//     [type] adjustment
//     Flat means it wants acid before it wants salt.
//
// NOTHING IS SAVED BY PARSING. This module only produces CANDIDATES with their
// problems attached. The commit is a separate, explicit act per candidate,
// because a bulk import that writes straight through is how thirty wrong
// entries land in a record meant to last twenty years.

import { JOURNAL_TYPES, JOURNAL_TYPE_ORDER } from './journal.js';
import { dishIdFor, dishNameFor } from './dishIdentity.js';

const KEY_LINE = /^\s*\[([a-z]+)\]\s*(.*)$/i;

// Accepts a type by key ('doneCues') or by its display label ('what done looks
// like'), case-insensitively, because a human writing these will not remember
// the internal key and should not have to.
function resolveType(raw) {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  if (JOURNAL_TYPES[v]) return v;
  const byKey = JOURNAL_TYPE_ORDER.find(k => k.toLowerCase() === v);
  if (byKey) return byKey;
  const byLabel = JOURNAL_TYPE_ORDER.find(k => JOURNAL_TYPES[k].label.toLowerCase() === v);
  return byLabel || null;
}

export function parseImport(text) {
  const blocks = String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean);

  return blocks.map((block, i) => {
    const meta = {};
    const body = [];
    for (const line of block.split('\n')) {
      const m = line.match(KEY_LINE);
      if (m) meta[m[1].toLowerCase()] = m[2].trim();
      else body.push(line);
    }

    const textOut = body.join('\n').trim();
    const type = resolveType(meta.type) || 'technique';
    const dish = meta.dish || '';
    // Resolve through DISH_RENAMES, so a historical name in an old note still
    // lands on the right dish instead of becoming an orphan on arrival.
    const dishId = dish ? dishIdFor(dish) : null;

    // BLOCKERS stop a commit. NOTES do not. Conflating them is why an
    // unhelpful advisory can quietly prevent a perfectly good entry from being
    // saved, which is the opposite of the point.
    const problems = [];
    const notes = [];
    if (!textOut) problems.push('no text');
    if (!dish) problems.push('no dish named');
    else if (!dishId) problems.push(`"${dish}" is not a dish the app knows`);
    if (meta.type && !resolveType(meta.type)) notes.push(`unknown type "${meta.type}", defaulted to technique`);

    return {
      index: i,
      dish,
      // The CURRENT display name, so a historical name in the source shows up
      // as what the dish is called today.
      resolvedDish: dishId ? dishNameFor(dishId, dish) : null,
      dishId,
      type,
      text: textOut,
      private: meta.private === 'true' || meta.private === 'yes',
      transferable: meta.transferable === 'true' || meta.transferable === 'yes',
      confidence: meta.confidence === 'firm' || meta.confidence === 'working' ? meta.confidence : null,
      problems,
      notes,
      // Only BLOCKERS stop a commit. A note is information for the reviewer.
      ready: problems.length === 0,
    };
  });
}

// Turns a reviewed candidate into the shape addEntry expects. Deliberately does
// NOT save: the caller commits one at a time, having looked at it.
export function candidateToEntry(c) {
  if (!c || !c.ready) return null;
  return {
    type: c.type,
    subject: { kind: 'dish', dish: c.resolvedDish || c.dish, ...(c.dishId ? { dishId: c.dishId } : {}) },
    text: c.text,
    private: !!c.private,
    transferable: !!c.transferable,
    ...(c.confidence ? { confidence: c.confidence } : {}),
    // Marks where this came from. In five years "did I write this or did I
    // approve it" is a question worth being able to answer, and it is exactly
    // the kind of thing that cannot be reconstructed later.
    imported: true,
  };
}

export function importSummary(candidates) {
  const list = candidates || [];
  return {
    total: list.length,
    ready: list.filter(c => c.ready).length,
    blocked: list.filter(c => !c.ready).length,
    dishes: [...new Set(list.filter(c => c.resolvedDish).map(c => c.resolvedDish))].sort(),
  };
}

// The format, as text, so the paste box can show it and Claude can be handed it
// verbatim when drafting a harvest.
export const IMPORT_FORMAT_HELP = [
  '[dish] Bo Ssam',
  '[type] technique',
  '[confidence] firm',
  'Sear the tofu yourself. It reheats better than a steak does.',
  '',
  '[dish] Gumbo',
  '[type] adjustment',
  'Flat means it wants acid before it wants salt.',
].join('\n');
