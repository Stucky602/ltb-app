// equipmentSeed.js — what Kevin actually owns, walked and recorded Jul 27.
//
// This is a DEFAULT, not a lock. It seeds the equipment list only when
// nothing is stored yet (see bootHydrate.js); any edit Kevin makes in the
// Record tab wins from then on. The point of seeding at all is that the
// archive's "The equipment these assume" section has existed since the
// archive was written and had nothing to show, because the box was always
// empty until someone typed into it.
//
// DISTINCT FROM src/equipmentConflict.js. That file's four tokens
// (`ovenLow`, `largePot`, `dutch`, `wok`) are a SCHEDULING VOCABULARY for
// cook-day conflict detection — do two dishes both need the Dutch oven this
// week. This is a plain list of the physical things in the kitchen, for a
// reader of the archive who wants to know what the record assumes exists.
//
// Two corrections that came out of the walk, worth keeping visible:
//   - The "wok smoke" technique is done in the STOCKPOT, not the wok. It is
//     Kevin's only smoking method. Fixed at its one wrong reference in
//     pipelineDishes.js (the dal makhani description).
//   - The espresso machine is a COOKING TOOL here, not just a drink maker —
//     used in both the Leblanc Curry and the Chili.
export const SEED_EQUIPMENT = [
  { name: 'Vacuum sealer', note: 'Not a chamber sealer.' },
  { name: 'Sous vide immersion circulator', note: '' },
  { name: 'iSi-style whipping siphon', note: 'With N2O chargers.' },
  { name: 'Sodium citrate', note: '' },
  { name: 'Xanthan gum', note: '' },
  { name: 'Soy lecithin', note: '' },
  { name: 'Dutch oven', note: '' },
  { name: 'Wok', note: '' },
  { name: 'Large stockpot', note: 'Also the smoking vessel — see the note below on wok smoke.' },
  { name: 'Oven', note: 'Low-temperature capacity, not a wide range.' },
  { name: 'Sharpening stone / system', note: '' },
  { name: 'Honing steel', note: '' },
  { name: 'Broiler', note: '' },
  { name: 'Stand mixer', note: '' },
  { name: 'Food processor', note: '' },
  { name: 'Blender', note: '' },
  { name: 'Microplanes', note: 'Several.' },
  { name: 'Spice grinder', note: '' },
  { name: 'Espresso machine', note: 'A cooking tool here, not just a drink maker — used in the Leblanc Curry and the Chili.' },
  { name: 'Knives', note: '"Lots of various knives that take care of all the standards one would want."' },
];

// Named so the fact is on record rather than only in a code comment: Kevin
// does not currently own a meat grinder or a smoker. The stockpot method
// above is deliberate, not a stand-in for a smoker he is missing.
export const EQUIPMENT_DOES_NOT_HAVE = ['Meat grinder', 'Smoker'];
