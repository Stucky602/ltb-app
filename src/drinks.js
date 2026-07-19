// drinks.js — canonical drink catalog for the pairing system (Jul 18).
//
// Pairings in dishes.js carry an `id` referencing this catalog, so the data
// can answer questions instead of only being read: which single bottle covers
// a whole order, which dishes go with a drink someone already owns, and
// whether every dish keeps Kevin's rule (wine always, plus at least one
// zero-proof option). The invariant suite enforces catalog coverage and the
// rule — see [pairing-*] checks.
//
// Display strings on each pairing stay free prose ('Riesling, dry or just
// off'); the id is the join key underneath ('riesling'). Four Riesling
// phrasings and five barley teas collapse to one id each, which is the whole
// point: the intersection math only works on canonical ids.

export const DRINKS = {
  riesling: { label: "Riesling", kind: 'wine' },
  gruner: { label: "Grüner Veltliner", kind: 'wine' },
  rose: { label: "Dry rosé", kind: 'wine' },
  pinot_noir: { label: "Pinot Noir", kind: 'wine' },
  pinot_grigio: { label: "Pinot Grigio", kind: 'wine' },
  sangiovese: { label: "Sangiovese", kind: 'wine' },
  barbera: { label: "Barbera", kind: 'wine' },
  lambrusco: { label: "Lambrusco", kind: 'wine' },
  nebbiolo: { label: "Nebbiolo", kind: 'wine' },
  zinfandel: { label: "Zinfandel", kind: 'wine' },
  chardonnay: { label: "Chardonnay", kind: 'wine' },
  chenin_blanc: { label: "Chenin Blanc", kind: 'wine' },
  albarino: { label: "Albariño", kind: 'wine' },
  vermentino: { label: "Vermentino", kind: 'wine' },
  falanghina: { label: "Falanghina", kind: 'wine' },
  syrah: { label: "Syrah", kind: 'wine' },
  cotes_du_rhone: { label: "Côtes du Rhône", kind: 'wine' },
  grenache: { label: "Grenache", kind: 'wine' },
  cabernet: { label: "Cabernet Sauvignon", kind: 'wine' },
  malbec: { label: "Malbec", kind: 'wine' },
  agiorgitiko: { label: "Agiorgitiko", kind: 'wine' },
  retsina: { label: "Retsina", kind: 'wine' },
  beaujolais: { label: "Beaujolais", kind: 'wine' },
  makgeolli: { label: "Makgeolli", kind: 'wine' },
  bokbunja: { label: "Bokbunja", kind: 'wine' },
  lager: { label: "Crisp lager", kind: 'beer' },
  amber_ale: { label: "Amber ale", kind: 'beer' },
  amber_lager: { label: "Amber lager", kind: 'beer' },
  shiner_bock: { label: "Shiner Bock", kind: 'beer' },
  abita_amber: { label: "Abita Amber", kind: 'beer' },
  hard_cider: { label: "Hard apple cider", kind: 'cider' },
  cognac: { label: "Cognac", kind: 'spirit' },
  margarita: { label: "Margarita", kind: 'cocktail' },
  jasmine_tea: { label: "Jasmine tea", kind: 'tea' },
  barley_tea: { label: "Barley tea", kind: 'tea' },
  green_tea: { label: "Iced green tea", kind: 'tea' },
  genmaicha: { label: "Genmaicha", kind: 'tea' },
  oolong: { label: "Oolong tea", kind: 'tea' },
  lapsang: { label: "Lapsang souchong", kind: 'tea' },
  chamomile_tea: { label: "Chamomile iced tea", kind: 'tea' },
  mint_tea: { label: "Mint iced tea", kind: 'tea' },
  masala_chai: { label: "Masala chai", kind: 'tea' },
  thai_iced_tea: { label: "Thai iced tea", kind: 'tea' },
  black_tea: { label: "Strong black tea", kind: 'tea' },
  sweet_tea: { label: "Sweet iced tea", kind: 'tea' },
  unsweet_tea: { label: "Unsweetened iced tea", kind: 'tea' },
  chicory_coffee: { label: "Chicory coffee", kind: 'coffee' },
  espresso: { label: "Espresso", kind: 'coffee' },
  big_red: { label: "Big Red", kind: 'soda' },
  cheerwine: { label: "Cheerwine", kind: 'soda' },
  ramune: { label: "Ramune", kind: 'soda' },
  chinotto: { label: "Italian chinotto", kind: 'soda' },
  aranciata: { label: "San Pellegrino Aranciata Rossa", kind: 'soda' },
  elderflower: { label: "Sparkling elderflower", kind: 'soda' },
  sparkling_water: { label: "Sparkling water", kind: 'water' },
  coconut_water: { label: "Coconut water", kind: 'water' },
  sparkling_apple: { label: "Sparkling apple juice", kind: 'juice' },
  limeade: { label: "Limeade", kind: 'juice' },
  jamaica: { label: "Agua de jamaica", kind: 'zero' },
  horchata: { label: "Horchata", kind: 'zero' },
  mango_lassi: { label: "Mango lassi", kind: 'zero' },
  salted_lassi: { label: "Salted lassi", kind: 'zero' },
  suanmeitang: { label: "Suanmeitang", kind: 'zero' },
  mushroom_broth: { label: "Mushroom broth sipper", kind: 'zero' },
};

// Alcoholic vs zero-proof, by kind. 'cocktail' covers mixed drinks.
export const ALC_KINDS = new Set(['wine', 'beer', 'cider', 'spirit', 'cocktail']);
export const ZERO_KINDS = new Set(['tea', 'coffee', 'soda', 'water', 'juice', 'zero']);
export const isZeroProof = (id) => DRINKS[id] ? ZERO_KINDS.has(DRINKS[id].kind) : false;
export const kindOf = (id) => (DRINKS[id] || {}).kind || null;
