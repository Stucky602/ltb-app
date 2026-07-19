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
  riesling: { label: "Riesling", kind: 'wine', style: 'off_dry_white' },
  gruner: { label: "Grüner Veltliner", kind: 'wine', style: 'crisp_white' },
  rose: { label: "Dry rosé", kind: 'wine', style: 'rose' },
  pinot_noir: { label: "Pinot Noir", kind: 'wine', style: 'light_red' },
  pinot_grigio: { label: "Pinot Grigio", kind: 'wine', style: 'crisp_white' },
  sangiovese: { label: "Sangiovese", kind: 'wine', style: 'light_red' },
  barbera: { label: "Barbera", kind: 'wine', style: 'light_red' },
  lambrusco: { label: "Lambrusco", kind: 'wine', style: 'sparkling' },
  nebbiolo: { label: "Nebbiolo", kind: 'wine', style: 'bold_red' },
  zinfandel: { label: "Zinfandel", kind: 'wine', style: 'bold_red' },
  chardonnay: { label: "Chardonnay", kind: 'wine', style: 'rich_white' },
  chenin_blanc: { label: "Chenin Blanc", kind: 'wine', style: 'off_dry_white' },
  albarino: { label: "Albariño", kind: 'wine', style: 'crisp_white' },
  vermentino: { label: "Vermentino", kind: 'wine', style: 'crisp_white' },
  falanghina: { label: "Falanghina", kind: 'wine', style: 'crisp_white' },
  syrah: { label: "Syrah", kind: 'wine', style: 'bold_red' },
  cotes_du_rhone: { label: "Côtes du Rhône", kind: 'wine', style: 'bold_red' },
  grenache: { label: "Grenache", kind: 'wine', style: 'light_red' },
  cabernet: { label: "Cabernet Sauvignon", kind: 'wine', style: 'bold_red' },
  malbec: { label: "Malbec", kind: 'wine', style: 'bold_red' },
  agiorgitiko: { label: "Agiorgitiko", kind: 'wine', style: 'light_red' },
  retsina: { label: "Retsina", kind: 'wine', style: 'crisp_white' },
  beaujolais: { label: "Beaujolais", kind: 'wine', style: 'light_red' },
  makgeolli: { label: "Makgeolli", kind: 'wine', style: 'off_dry_white' },
  bokbunja: { label: "Bokbunja", kind: 'wine', style: 'off_dry_white' },
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
  prosecco: { label: "Prosecco", kind: 'wine', style: 'sparkling' },
  cava: { label: "Cava", kind: 'wine', style: 'sparkling' },
  champagne: { label: "Champagne", kind: 'wine', style: 'sparkling' },
  cremant: { label: "Crémant", kind: 'wine', style: 'sparkling' },
  pet_nat: { label: "Pét-nat", kind: 'wine', style: 'sparkling' },
  sauv_blanc: { label: "Sauvignon Blanc", kind: 'wine', style: 'crisp_white' },
  vinho_verde: { label: "Vinho Verde", kind: 'wine', style: 'crisp_white' },
  muscadet: { label: "Muscadet", kind: 'wine', style: 'crisp_white' },
  picpoul: { label: "Picpoul", kind: 'wine', style: 'crisp_white' },
  soave: { label: "Soave", kind: 'wine', style: 'crisp_white' },
  txakoli: { label: "Txakoli", kind: 'wine', style: 'crisp_white' },
  white_burgundy: { label: "White Burgundy", kind: 'wine', style: 'rich_white' },
  viognier: { label: "Viognier", kind: 'wine', style: 'rich_white' },
  white_rioja: { label: "White Rioja", kind: 'wine', style: 'rich_white' },
  marsanne: { label: "Marsanne blend", kind: 'wine', style: 'rich_white' },
  gewurz: { label: "Gewürztraminer", kind: 'wine', style: 'off_dry_white' },
  vouvray: { label: "Vouvray", kind: 'wine', style: 'off_dry_white' },
  moscato: { label: "Moscato", kind: 'wine', style: 'off_dry_white' },
  kabinett: { label: "Riesling Kabinett", kind: 'wine', style: 'off_dry_white' },
  provence_rose: { label: "Provence rosé", kind: 'wine', style: 'rose' },
  tavel: { label: "Tavel", kind: 'wine', style: 'rose' },
  txakoli_rose: { label: "Rosado", kind: 'wine', style: 'rose' },
  gamay: { label: "Gamay", kind: 'wine', style: 'light_red' },
  grenache_light: { label: "Grenache", kind: 'wine', style: 'light_red' },
  dolcetto: { label: "Dolcetto", kind: 'wine', style: 'light_red' },
  valpolicella: { label: "Valpolicella", kind: 'wine', style: 'light_red' },
  cab_franc: { label: "Cabernet Franc", kind: 'wine', style: 'light_red' },
  frappato: { label: "Frappato", kind: 'wine', style: 'light_red' },
  trousseau: { label: "Trousseau", kind: 'wine', style: 'light_red' },
  tempranillo: { label: "Tempranillo", kind: 'wine', style: 'bold_red' },
  rioja: { label: "Rioja", kind: 'wine', style: 'bold_red' },
  grenache_bold: { label: "GSM blend", kind: 'wine', style: 'bold_red' },
  monastrell: { label: "Monastrell", kind: 'wine', style: 'bold_red' },
  petite_sirah: { label: "Petite Sirah", kind: 'wine', style: 'bold_red' },
  aglianico: { label: "Aglianico", kind: 'wine', style: 'bold_red' },
  douro_red: { label: "Douro red", kind: 'wine', style: 'bold_red' },
  primitivo: { label: "Primitivo", kind: 'wine', style: 'bold_red' },
  carmenere: { label: "Carmenère", kind: 'wine', style: 'bold_red' },
  chianti_riserva: { label: "Chianti Riserva", kind: 'wine', style: 'bold_red' },
};

// Alcoholic vs zero-proof, by kind. 'cocktail' covers mixed drinks.
export const ALC_KINDS = new Set(['wine', 'beer', 'cider', 'spirit', 'cocktail']);
export const ZERO_KINDS = new Set(['tea', 'coffee', 'soda', 'water', 'juice', 'zero']);
export const isZeroProof = (id) => DRINKS[id] ? ZERO_KINDS.has(DRINKS[id].kind) : false;
export const kindOf = (id) => (DRINKS[id] || {}).kind || null;

// ── Wine styles (rule-based pairing) ────────────────────────────────────────
// Each dish carries a set of wine STYLES that work (copy.wineStyles); each wine
// carries one `style`. A wine pairs a dish if its style is in the dish's set.
// This is what makes "I have a Malbec" light up every bold-red dish, whether or
// not that specific bottle was ever written into a pairing.
export const WINE_STYLES = ['sparkling', 'crisp_white', 'rich_white', 'off_dry_white', 'rose', 'light_red', 'bold_red'];
export const WINE_STYLE_LABEL = {
  sparkling: 'Sparkling', crisp_white: 'Crisp white', rich_white: 'Rich white',
  off_dry_white: 'Off-dry white', rose: 'Rosé', light_red: 'Light red', bold_red: 'Bold red',
};
export const styleOf = (id) => (DRINKS[id] || {}).style || null;
