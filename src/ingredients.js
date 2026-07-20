// LTB Ingredient Database — canonical baseline costs
// Seeded once into app storage (INGREDIENTS_KEY); edit costs in-app after that.
// To re-baseline from scratch, clear the storage key and reload.

// Each ingredient: { id, name, unit (purchase unit), baseline ($ per purchase unit), category }
// Optional `fixed: true` marks ingredients that never drift (packaging, homegrown
// produce) — they still count toward raw cost but are excluded from margin drift.
export const INGREDIENT_SEED = [
  { id: 'garlic', name: 'Garlic', unit: 'head', baseline: 0.5, category: 'produce' },
  { id: 'ginger', name: 'Ginger', unit: 'lb', baseline: 4.0, category: 'produce' },
  { id: 'onion', name: 'Onion (yellow)', unit: 'lb', baseline: 1.0, category: 'produce' }, // by weight (Kevin, Jul 15). Was 'each' @ $0.60; at LB_PER_ONION 0.6 that is exactly $1.00/lb, so this is a re-expression, not a reprice.
  { id: 'red_onion', name: 'Red onion', unit: 'lb', baseline: 1.38, category: 'produce' }, // by weight, not by the each (Kevin, Jul 15). LINE_MAP conv moved to unit:'lb' + eachWeightLb to match; the two are one contract.
  { id: 'sweet_onion', name: 'Sweet onion', unit: 'lb', baseline: 1.0, category: 'produce', priceLink: 'onion' }, // Kevin buys yellow and sweet interchangeably (Jul 15), so they must never drift apart: priceLink mirrors yellow, and a receipt teaching either one moves both. Was $1.40 standalone.
  { id: 'bulb_onion', name: 'Bulb/spring onion', unit: 'bunch', baseline: 2.0, category: 'produce' },
  { id: 'scallions', name: 'Scallions', unit: 'bunch', baseline: 0.6, category: 'produce' },
  { id: 'carrots', name: 'Carrots', unit: 'lb', baseline: 1.0, category: 'produce' },
  { id: 'celery', name: 'Celery', unit: 'head', baseline: 1.0, category: 'produce' },
  { id: 'green_bell_pepper', name: 'Green bell pepper', unit: 'each', baseline: 0.72, category: 'produce' },
  { id: 'poblano', name: 'Poblano', unit: 'lb', baseline: 1.8, category: 'produce' },
  { id: 'habanero', name: 'Habanero', unit: 'oz', baseline: 0.25, category: 'produce' },
  { id: 'ancho_chili', name: 'Ancho chili (dried)', unit: 'oz', baseline: 0.5, category: 'pantry' },
  { id: 'dried_peppers', name: 'Dried peppers', unit: '8oz', baseline: 3.0, category: 'pantry' },
  { id: 'chilis', name: 'Chilis (fresh mix)', unit: 'batch', baseline: 5.0, category: 'produce' },
  { id: 'cilantro', name: 'Cilantro', unit: 'bunch', baseline: 0.5, category: 'produce' },
  { id: 'basil', name: 'Thai basil', unit: 'bunch', baseline: 3.0, category: 'produce' },
  { id: 'mint', name: 'Mint', unit: 'bunch', baseline: 0.417, category: 'produce' },
  { id: 'thyme_fresh', name: 'Thyme (fresh)', unit: 'sprig', baseline: 0.1993, category: 'produce' }, // H-Mart pack $2.99 = 1 bunch = 15 sprigs; 1 sprig = 1 use (Kevin, Jul 14). Old $0.167/"bunch" was a per-use estimate wearing a bunch label.
  { id: 'fennel_bulb', name: 'Fennel bulb', unit: 'each', baseline: 4.2, category: 'produce' },
  { id: 'asparagus', name: 'Asparagus', unit: 'lb', baseline: 2.99, category: 'produce' },
  { id: 'chinese_broccoli', name: 'Chinese broccoli', unit: 'lb', baseline: 4.0, category: 'produce' },
  { id: 'chinese_eggplant', name: 'Chinese eggplant', unit: 'lb', baseline: 2.19, category: 'produce' },
  { id: 'zucchini', name: 'Zucchini', unit: 'lb', baseline: 1.29, category: 'produce' }, // courgette merges here (recipes.js synonym)
  { id: 'long_beans', name: 'Long beans', unit: 'lb', baseline: 4.99, category: 'produce' },
  { id: 'asian_greens', name: 'Asian greens', unit: 'lb', baseline: 2.0, category: 'produce' },
  { id: 'tong_ho', name: 'Tong ho (chrysanthemum greens)', unit: 'lb', baseline: 1.99, category: 'produce' },
  { id: 'mushrooms', name: 'Mushrooms', unit: 'lb', baseline: 5.0, category: 'produce' },
  { id: 'baby_bella', name: 'Baby bella mushrooms', unit: '8oz', baseline: 3.0, category: 'produce' },
  { id: 'porcini', name: 'Dried porcini', unit: 'oz', baseline: 2.25, category: 'produce' },
  { id: 'oyster_mushroom', name: 'Oyster mushroom', unit: 'lb', baseline: 8.99, category: 'produce' },
  { id: 'king_oyster_mushroom', name: 'King oyster mushroom', unit: 'lb', baseline: 4.99, category: 'produce' },
  { id: 'shiitake', name: 'Shiitake mushroom', unit: 'lb', baseline: 7.99, category: 'produce' },
  { id: 'kabocha', name: 'Kabocha squash', unit: 'lb', baseline: 1.5, category: 'produce' },
  { id: 'parsnips', name: 'Parsnips', unit: 'lb', baseline: 3.13, category: 'produce' }, // Kevin, Jul 15
  { id: 'petite_peas', name: 'Petite peas', unit: '8oz', baseline: 1.0, category: 'frozen' },
  { id: 'corn', name: 'Corn', unit: 'ear', baseline: 0.25, category: 'produce' },
  { id: 'red_potatoes', name: 'Red potatoes', unit: 'lb', baseline: 2.32, category: 'produce' },
  { id: 'baby_gold_potatoes', name: 'Baby gold potatoes', unit: 'lb', baseline: 2.0, category: 'produce' },
  { id: 'apple', name: 'Apple', unit: 'lb', baseline: 1.99, category: 'produce' }, // by weight (Kevin, Jul 15). Was 'each' @ $1.50, which never had a piece weight recorded, so no honest conversion existed; $1.99/lb is Kevin's figure, not a back-solve.
  { id: 'lemon', name: 'Lemon', unit: 'each', baseline: 0.5, category: 'produce' },
  // ── Spotlight dinner ingredients (Coriander Lamb Steak over Gigantes Beans, Jul 9) ──
  { id: 'lamb_leg_steak', name: 'Lamb leg steak (bone-in)', unit: 'lb', baseline: 18.99, category: 'meat' },
  { id: 'gigantes_beans', name: 'Gigantes beans', unit: 'oz', baseline: 0.92, category: 'pantry' }, // 12 oz package @ ~$11
  { id: 'leeks', name: 'Leeks', unit: 'bunch', baseline: 3.99, category: 'produce' },
  { id: 'preserved_lemon', name: 'Preserved lemon', unit: 'piece', baseline: 0.5, category: 'pantry' }, // homemade, ~$0.50/piece
  { id: 'coriander_seed', name: 'Coriander seed', unit: 'tbsp', baseline: 0.15, category: 'spice' },
  { id: 'parsley', name: 'Parsley', unit: 'bunch', baseline: 1.0, category: 'produce' },
  // ── Spotlight: Thick-Cut Pork Chop (Jul 9) ──
  { id: 'pork_rib_chop', name: 'Bone-in pork rib chop', unit: 'lb', baseline: 5.24, category: 'meat' }, // HEB natural, ~1 lb/pack
  // H-E-B Natural Boneless Center Loin Pork Chop, THICK CUT — avg 0.75 lb/piece,
  // $4.72 ea = $6.29/lb (Kevin, Jul 15). This REPLACED the older, thinner boneless
  // chop that really was $3.99/lb; the old $4.19 anchor was correct for that cut.
  // This is a product swap to a thicker chop, not a correction of a bad number.
  { id: 'pork_chop_boneless', name: 'Boneless pork chop', unit: 'lb', baseline: 6.29, category: 'meat' },
  { id: 'sweet_potato', name: 'Sweet potato', unit: 'lb', baseline: 1.21, category: 'produce' }, // by weight (Kevin, Jul 15). Was 'each' @ $1.04, whose own comment recorded ~0.87 lb @ $1.21/lb; that back-solves to $1.20/lb, so the per-lb figure was always the real one.
  { id: 'cider', name: 'Cider', unit: 'oz', baseline: 0.208, category: 'pantry' }, // 12 oz can, 4-pack $10 = $2.50/can ÷ 12
  { id: 'broccolini', name: 'Broccolini', unit: 'bunch', baseline: 3.99, category: 'produce' }, // aka baby broccoli
  { id: 'sage', name: 'Sage', unit: 'pack', baseline: 0.417, category: 'produce' }, // $2.50 pack ÷ 6 (herb rule)
  { id: 'cinnamon_stick', name: 'Cinnamon stick', unit: 'each', baseline: 0.2, category: 'spice' },
  { id: 'whole_cloves', name: 'Whole cloves', unit: 'each', baseline: 0.03, category: 'spice' },
  { id: 'allspice', name: 'Allspice', unit: 'each', baseline: 0.03, category: 'spice' },
  // ── Spotlight: Steak au Poivre (Jul 9) ──
  { id: 'filet_mignon_dinner', name: 'Filet mignon', unit: 'lb', baseline: 25.0, category: 'meat' }, // steak au poivre dinner cut (distinct from the bag Filet Mignon per-lb protein)
  { id: 'jumbo_asparagus', name: 'Jumbo asparagus', unit: 'lb', baseline: 4.99, category: 'produce' }, // same price/parse as regular asparagus
  { id: 'yukon_gold_potato', name: 'Yukon gold potato', unit: 'lb', baseline: 0.8, category: 'produce' }, // ~$0.05/oz = $0.80/lb; DISTINCT from baby golds
  { id: 'cognac', name: 'Cognac', unit: 'oz', baseline: 1.102, category: 'pantry' }, // Courvoisier VS $28/750ml = $1.10/oz
  { id: 'black_pepper_oz', name: 'Black pepper (oz)', unit: 'oz', baseline: 1.0, category: 'spice' }, // Kevin's standard spice cost (heavy backstock)
  { id: 'lime', name: 'Lime', unit: 'each', baseline: 0.25, category: 'produce' },
  { id: 'cantaloupe', name: 'Seasonal melon', unit: 'each', baseline: 3.0, category: 'produce' },
  { id: 'pineapple', name: 'Pineapple (per container)', unit: 'container', baseline: 2.5, category: 'produce' },
  { id: 'ground_beef', name: 'Ground beef', unit: 'lb', baseline: 7.0, category: 'protein' },
  { id: 'ground_pork', name: 'Ground pork', unit: 'lb', baseline: 5.0, category: 'protein' },
  { id: 'ground_chicken', name: 'Ground chicken', unit: 'lb', baseline: 5.0, category: 'protein' },
  { id: 'ground_lamb', name: 'Ground lamb', unit: 'lb', baseline: 12.99, category: 'protein' },
  { id: 'chicken_thighs', name: 'Chicken thighs', unit: 'lb', baseline: 3.22, category: 'protein' }, // boneless skinless. Was 5.00, stale (Kevin, Jul 17).
  { id: 'chicken_breast', name: 'Chicken breast', unit: 'lb', baseline: 5.0, category: 'protein' },
  { id: 'beef_chuck', name: 'Beef chuck roast', unit: 'lb', baseline: 9.02, category: 'protein' },
  { id: 'prime_chuck', name: 'Prime boneless chuck roast', unit: 'lb', baseline: 8.99, category: 'protein' },
  { id: 'pork_butt', name: 'Pork butt roast (bone-in)', unit: 'lb', baseline: 2.75, category: 'protein' },
  { id: 'pork_shoulder', name: 'Pork shoulder (bone-in)', unit: 'lb', baseline: 2.59, category: 'protein' },
  { id: 'wagyu_london_broil', name: 'Wagyu london broil', unit: 'lb', baseline: 12.0, category: 'protein' },
  { id: 'pork_tenderloin', name: 'Pork tenderloin', unit: 'lb', baseline: 7.29, category: 'protein' }, // raw cost for recipe use (the bag item carries its own costPerLb)
  { id: 'shrimp', name: 'Shrimp', unit: 'lb', baseline: 14.0, category: 'protein' },
  { id: 'tofu', name: 'Tofu', unit: 'block', baseline: 2.5, category: 'protein' },
  { id: 'salt_pork', name: 'Salt pork', unit: 'oz', baseline: 0.17, category: 'protein' },
  { id: 'anchovies', name: 'Anchovies (fillet)', unit: 'fillet', baseline: 0.3, category: 'pantry' }, // Kevin's jar: $6.07 / ~20 fillets = $0.30/fillet. ALWAYS the same container — receipt scans convert jar price via packQty 20.
  { id: 'kimchi', name: 'Kimchi', unit: 'jar', baseline: 8.0, category: 'pantry' },
  { id: 'butter', name: 'Butter', unit: 'stick', baseline: 0.95, category: 'dairy' },
  { id: 'milk', name: 'Milk', unit: 'cup', baseline: 0.275, category: 'dairy' },
  { id: 'evaporated_milk', name: 'Evaporated milk', unit: 'cup', baseline: 1.53, category: 'dairy' },
  { id: 'heavy_cream', name: 'Heavy cream', unit: 'cup', baseline: 1.5, category: 'dairy' },
  { id: 'eggs', name: 'Eggs', unit: 'each', baseline: 0.25, category: 'dairy' },
  { id: 'parm', name: 'Parmesan (good)', unit: 'lb', baseline: 23.0, category: 'dairy' },
  { id: 'oaxaca', name: 'Oaxaca cheese', unit: 'lb', baseline: 8.12, category: 'dairy' },
  { id: 'colby_jack', name: 'Colby jack', unit: 'lb', baseline: 5.41, category: 'dairy' },
  { id: 'flour', name: 'Flour', unit: 'lb', baseline: 0.75, category: 'pantry' },
  { id: 'baking_powder', name: 'Baking powder', unit: 'tbs', baseline: 0.18, category: 'pantry' },
  { id: 'baking_soda', name: 'Baking soda', unit: 'tbs', baseline: 0.1, category: 'pantry' },
  { id: 'white_sugar', name: 'White sugar', unit: 'cup', baseline: 0.4, category: 'pantry' },
  { id: 'brown_sugar', name: 'Brown sugar', unit: 'cup', baseline: 0.57, category: 'pantry' },
  { id: 'dark_brown_sugar', name: 'Dark brown sugar', unit: 'cup', baseline: 0.57, category: 'pantry' },
  { id: 'molasses', name: 'Molasses', unit: 'tbs', baseline: 0.1, category: 'pantry' },
  { id: 'white_karo', name: 'White Karo syrup', unit: 'cup', baseline: 1.6, category: 'pantry' },
  { id: 'honey', name: 'Honey', unit: 'tbs', baseline: 0.2, category: 'pantry' },
  { id: 'cocoa', name: 'Cocoa powder', unit: 'tbs', baseline: 0.19, category: 'pantry' },
  { id: 'delallo_espresso', name: 'DeLallo instant espresso', unit: 'tsp', baseline: 0.26, category: 'pantry' }, // $5.47/55g jar, ~2.6g/tsp
  { id: 'chocolate_100', name: '100% chocolate', unit: 'square', baseline: 0.535, category: 'pantry' }, // Ghirardelli 100% Cacao bar $4.28 = 8 squares (Kevin-approved Jul 14; was 0.50)
  { id: 'guittard_low', name: 'Guittard chocolate (low %)', unit: 'g', baseline: 0.02749, category: 'pantry' },
  { id: 'guittard_high', name: 'Guittard chocolate (high %)', unit: 'g', baseline: 0.02749, category: 'pantry', priceLink: 'guittard_low' },
  { id: 'valrhona', name: 'Valrhona chocolate (premium)', unit: '290g', baseline: 19.0, category: 'pantry' },
  { id: 'peanut_butter', name: 'Peanut butter', unit: 'oz', baseline: 0.141, category: 'pantry' }, // Peter Pan Creamy 40 oz = $5.64 (receipt IMG_9660, Jul 15) -> $0.141/oz. Was 'half-jar' @ $0.70, a unit that predated the universal unit layer and could never resolve from a receipt: he buys whatever jar size is there. Per-oz + the scan's oz prompt handles every size.
  { id: 'vanilla', name: 'Vanilla (imitation)', unit: 'tbs', baseline: 0.07, category: 'pantry' },
  { id: 'vanilla_extract', name: 'Vanilla extract (homemade)', unit: 'tbs', baseline: 1.5, category: 'pantry' },
  { id: 'rice', name: 'Rice', unit: 'batch', baseline: 1.146, category: 'pantry' }, // Small rice bag: $0.50 wrap + 2 cups white rice @ $0.323/cup ($0.646) = $1.146. Large = 2 units = $2.292. Was a made-up $1.00 flat.
  { id: 'pasta', name: 'Pasta (dry)', unit: 'lb', baseline: 2.0, category: 'pantry', passthrough: true }, // store-bought, sold at cost
  { id: 'orecchiette', name: 'Orecchiette', unit: 'lb', baseline: 2.78, category: 'pantry', passthrough: true },
  { id: 'lemon_herb_butter', name: 'Lemon herb butter (2oz)', unit: 'each', baseline: 0.488, category: 'dairy' }, // composed: 1lb butter+1 lemon+10 garlic+thyme, batch of 10. Thyme term repriced to $0.1993/sprig (Jul 14): 0.485 → 0.488.
  { id: 'egg_pappardelle', name: 'Egg pappardelle', unit: 'pack', baseline: 4.2, category: 'pantry', passthrough: true }, // store-bought, sold at cost
  { id: 'noodles', name: 'Noodles (fresh)', unit: 'batch', baseline: 8.0, category: 'pantry' },
  { id: 'tortillas', name: 'Tortillas', unit: '10ct', baseline: 2.0, category: 'pantry' },
  { id: 'dried_kidney_beans', name: 'Dried kidney beans', unit: 'lb', baseline: 1.22, category: 'pantry' },
  { id: 'dried_lima_beans', name: 'Dried lima beans', unit: 'oz', baseline: 0.13, category: 'pantry' },
  { id: 'black_beans', name: 'Black beans (dried)', unit: 'lb', baseline: 0.55, category: 'pantry' },
  { id: 'chickpeas', name: 'Chickpeas (dried)', unit: 'lb', baseline: 1.5, category: 'pantry' }, // estimate, not receipt-verified yet
  { id: 'tomato_can', name: 'Canned tomato (28oz)', unit: 'can', baseline: 3.54, category: 'pantry' },
  { id: 'peeled_tomatoes', name: 'Peeled tomatoes (14oz)', unit: 'can', baseline: 1.08, category: 'pantry' },
  { id: 'fresh_tomatoes', name: 'Fresh tomatoes', unit: 'lb', baseline: 4.0, category: 'produce' },
  { id: 'homegrown_tomatoes', name: 'Homegrown tomatoes', unit: '28oz can-equiv', baseline: 10.0, category: 'produce', fixed: true },
  { id: 'tomato_paste', name: 'Tomato paste', unit: 'can', baseline: 1.0, category: 'pantry' },
  { id: 'canola_oil', name: 'Canola oil', unit: 'cup', baseline: 0.74, category: 'pantry' },
  { id: 'vegetable_oil', name: 'Vegetable oil', unit: 'cup', baseline: 0.58, category: 'pantry' },
  { id: 'olive_oil', name: 'Good olive oil (Graza Drizzle)', unit: 'oz', baseline: 1.27, category: 'pantry' }, // finishing oil — 500 ml bottle; the 'Good olive oil' recipe line
  { id: 'olive_oil_cooking', name: 'Cooking olive oil (Graza Sizzle)', unit: 'oz', baseline: 0.79, category: 'pantry' }, // everyday cooking oil — 750 ml bottle; distinct oil, do NOT conflate (Kevin, Jul 5)
  { id: 'oil_generic', name: 'Cooking oil', unit: 'cup', baseline: 0.7, category: 'pantry' },
  { id: 'toasted_sesame', name: 'Toasted sesame oil', unit: 'tbs', baseline: 0.12, category: 'pantry' },
  { id: 'chili_oil', name: 'Chili oil (house)', unit: 'cup', baseline: 2.3, category: 'pantry' },
  { id: 'soy', name: 'Soy sauce', unit: 'tbs', baseline: 0.05, category: 'pantry' },
  { id: 'dark_soy', name: 'Dark soy', unit: 'tbs', baseline: 0.1, category: 'pantry' },
  { id: 'light_soy', name: 'Light soy', unit: 'tbs', baseline: 0.05, category: 'pantry' },
  { id: 'oyster_sauce', name: 'Oyster sauce', unit: 'tbs', baseline: 0.22, category: 'pantry' },
  { id: 'fish_sauce', name: 'Fish sauce', unit: 'tbs', baseline: 0.2, category: 'pantry' },
  { id: 'doubanjiang', name: 'Doubanjiang', unit: 'tbs', baseline: 1.0, category: 'pantry' },
  { id: 'fermented_black_beans', name: 'Fermented black beans', unit: 'tbs', baseline: 0.125, category: 'pantry' },
  { id: 'worcestershire', name: 'Worcestershire', unit: 'tbs', baseline: 0.2485, category: 'pantry' }, // Lea & Perrins 10 fl oz (20 tbs) @ $4.97 = $0.2485/tbs
  { id: 'franks', name: 'Frank\'s hot sauce', unit: 'batch-use', baseline: 0.5, category: 'pantry' },
  { id: 'marmite', name: 'Marmite', unit: 'batch-use', baseline: 2.0, category: 'pantry' },
  { id: 'chinkiang', name: 'Chinkiang vinegar', unit: 'tbs', baseline: 0.083, category: 'pantry' },
  { id: 'vinegar', name: 'Vinegar (generic)', unit: 'batch-use', baseline: 0.5, category: 'pantry' },
  { id: 'red_wine', name: 'Red wine', unit: 'cup', baseline: 2.5, category: 'pantry' },
  { id: 'white_wine', name: 'White wine', unit: 'cup', baseline: 2.5, category: 'pantry' },
  { id: 'shaoxing', name: 'Shaoxing wine', unit: 'cup', baseline: 3.0, category: 'pantry' },
  { id: 'sherry', name: 'Sherry', unit: 'cup', baseline: 8.0, category: 'pantry' },
  { id: 'marsala', name: 'Marsala wine (dry or sweet)', unit: 'cup', baseline: 4.1, category: 'pantry' }, // $13/750ml ÷ 3.17 cups; dry & sweet priced the same (Kevin)
  { id: 'shallot', name: 'Shallot', unit: 'lb', baseline: 3.98, category: 'produce' },
  { id: 'whole_grain_mustard', name: 'Whole grain mustard', unit: 'oz', baseline: 0.17, category: 'pantry' },
  { id: 'egg_taglierini', name: 'Egg taglierini', unit: 'pack', baseline: 3.98, category: 'pantry' , passthrough: true }, // store-bought, sold at cost
  { id: 'polenta', name: 'Polenta (dry cornmeal)', unit: 'lb', baseline: 5.99, category: 'pantry' }, // measured: 0.795 lb = 1.75 cups dry
  { id: 'tarragon', name: 'Tarragon (fresh)', unit: 'sprig', baseline: 0.1993, category: 'produce' }, // H-Mart pack $2.99 = 1 bunch = 15 sprigs, same pack economics as thyme (Kevin, Jul 14)
  { id: 'bourbon', name: 'Bourbon', unit: 'cup', baseline: 6.4, category: 'pantry' },
  { id: 'espresso', name: 'Espresso', unit: 'shot', baseline: 1.5, category: 'pantry' },
  { id: 'salt', name: 'Salt', unit: 'batch-use', baseline: 0.05, category: 'spice' },
  { id: 'kosher_salt', name: 'Kosher salt', unit: 'tbs', baseline: 0.02, category: 'spice' },
  { id: 'black_pepper', name: 'Black pepper', unit: 'batch-use', baseline: 0.1, category: 'spice' },
  { id: 'bay_leaf', name: 'Bay leaf', unit: 'leaf', baseline: 0.05, category: 'spice' },
  { id: 'nutmeg', name: 'Nutmeg', unit: 'batch-use', baseline: 0.1, category: 'spice' },
  { id: 'fennel_seeds', name: 'Fennel seeds', unit: 'tsp', baseline: 0.1, category: 'spice' },
  { id: 'saffron', name: 'Saffron', unit: 'pinch', baseline: 1.17, category: 'spice' }, // HEB 0.018oz bag $4.68 / 4 Small servings per bag (Kevin's ratio)
  { id: 'curry_powder', name: 'Curry powder', unit: 'batch-use', baseline: 1.0, category: 'spice' },
  { id: 'curry_spices', name: 'Curry spice blend', unit: 'batch-use', baseline: 1.0, category: 'spice' },
  { id: 'five_spice', name: '5-spice powder', unit: 'tsp', baseline: 0.125, category: 'spice' },
  { id: 'sichuan_pepper', name: 'Sichuan peppercorns', unit: 'tsp', baseline: 0.0625, category: 'spice' },
  { id: 'star_anise', name: 'Star anise', unit: 'each', baseline: 0.0625, category: 'spice' },
  { id: 'chili_flakes', name: 'Chili flakes', unit: 'tbs', baseline: 0.166, category: 'spice' },
  { id: 'spices_generic', name: 'Spice blend (generic)', unit: 'batch-use', baseline: 1.0, category: 'spice' },
  // ── Tea-smoked chicken program (Jul 17) ──────────────────────────────────
  // Kombu and katsuobushi are seeded BY WEIGHT, not by package or batch.
  // Kevin eyeballs both ("about a 10th of the package"), so the ratio he gave
  // is the derivation, not the unit: a 'small-batch' or 'half-package' unit
  // could never resolve from a receipt (see peanut_butter above, which was
  // 'half-jar' for exactly this reason). Weight is what a scale and a receipt
  // agree on, and makeConv gives g/lb/kg for free off an oz seed.
  // NOT the 'rice' id above: that one is the $1 rice-container surcharge, a
  // fixed per-order packaging cost. This is actual grain, for the smoke mix.
  { id: 'white_rice_raw', name: 'White rice (raw, smoke mix)', unit: 'cup', baseline: 0.323, category: 'pantry' }, // 15lb bag (6800g) $10.99, 1 cup = 200g -> $0.323/cup
  { id: 'orange', name: 'Orange (naval)', unit: 'each', baseline: 0.50, category: 'produce' }, // HEB sells navals BY THE EACH, not by weight (Kevin, Jul 17). Peel only is used in the smoke mix; the whole orange is the purchase either way, so the recipe charges 1 each at BOTH sizes.
  { id: 'kombu', name: 'Kombu', unit: 'oz', baseline: 1.25, category: 'pantry' }, // H-Mart 4oz pack $5.00 -> $1.25/oz. Kevin's ratio: ~20 small batches per pack = ~0.2 oz (5.7g) each.
  { id: 'katsuobushi', name: 'Katsuobushi (bonito flakes)', unit: 'oz', baseline: 1.98, category: 'pantry' }, // 100g pack $6.99 = 3.527 oz -> $1.98/oz. Kevin's ratio: ~10 small batches per pack = ~10g each. Weight only: bonito is too light for a 'cup' alias to mean anything.
  { id: 'black_tea', name: 'Loose black tea (smoke mix)', unit: 'batch-use', baseline: 1.0, category: 'pantry' }, // Kevin, Jul 17: heavy backstock of fancy tea, may never rebuy. $1/batch is his call, not a package derivation. Same treatment as black_pepper_oz.
  { id: 'mayonnaise', name: 'Mayonnaise', unit: 'oz', baseline: 0.166, category: 'pantry' }, // Duke's 30oz $4.98 -> $0.166/oz (HEB Anderson Mill, Jul 17)
  { id: 'horseradish', name: 'Prepared horseradish', unit: 'oz', baseline: 0.442, category: 'pantry' }, // Boar's Head 9oz $3.98 -> $0.442/oz (HEB, Jul 17)
  { id: 'cider_vinegar', name: 'Apple cider vinegar', unit: 'oz', baseline: 0.0522, category: 'pantry' }, // Hill Country Fare 64oz $3.34 -> $0.0522/oz (HEB, Jul 17). Price cut is permanent, not a sale.
  { id: 'cornstarch', name: 'Cornstarch', unit: 'batch-use', baseline: 0.1, category: 'pantry' },
  { id: 'wrap', name: 'Packaging (wrap/jar)', unit: 'each', baseline: 1.0, category: 'pantry', fixed: true },
  { id: 'sv_bag', name: 'Sous vide bag + butter + herbs', unit: 'each', baseline: 2.0, category: 'pantry', fixed: true }, // composed sous vide dishes: bag + seasoning cost tracked separately from packaging ($2.00 small; Large braises use sv_bag_large $3.00)
  { id: 'sv_bag_large', name: 'Sous vide bag + butter + herbs (large)', unit: 'each', baseline: 3.0, category: 'pantry', fixed: true }, // longer bag + a little more seasoning for Large braises: one $3.00 bag, not two $2.00 bags
  { id: 'sodium_citrate', name: 'Sodium citrate', unit: 'g', baseline: 0.025, category: 'pantry' },
  { id: 'herb_generic', name: 'Herb (thyme/lavender)', unit: 'batch', baseline: 1.0, category: 'produce' },
  { id: 'chicken_stock', name: 'Chicken stock', unit: 'cup', baseline: 0.745, category: 'pantry' },
  { id: 'vegetable_stock', name: 'Vegetable stock', unit: 'cup', baseline: 0.745, category: 'pantry', priceLink: 'chicken_stock' }, // same cost as chicken stock (Kevin, Jul 15); priceLink keeps the two in sync so a receipt on either moves both
  { id: 'beef_stock', name: 'Beef stock', unit: 'cup', baseline: 0.75, category: 'pantry' },
  { id: 'chicken_basics_stock', name: 'Kitchen Basics stock', unit: 'carton', baseline: 2.98, category: 'pantry' },
  { id: 'orange_juice', name: 'Orange juice', unit: 'batch-use', baseline: 2.0, category: 'pantry' },
  { id: 'lime_juice', name: 'Lime juice', unit: 'g', baseline: 0.0125, category: 'produce' },
  { id: 'pecans', name: 'Pecans (shelled)', unit: 'oz', baseline: 0.56, category: 'pantry' },
  { id: 'pomegranate_molasses', name: 'Pomegranate molasses', unit: 'cup', baseline: 3.333, category: 'pantry' }, // ~$2.50 per 3/4 cup
  { id: 'pepitas', name: 'Pepitas (toasted)', unit: 'oz', baseline: 0.57, category: 'pantry' },
  { id: 'mitad_tortillas', name: 'Mitad-y-mitad tortillas (flour+corn)', unit: '10ct', baseline: 2.98, category: 'pantry' },
  { id: 'pickled_onion', name: 'Pickled onion (house)', unit: 'container', baseline: 2.0, category: 'produce' },
  { id: 'pomegranate_seeds', name: 'Pomegranate seeds', unit: 'oz', baseline: 1.0, category: 'produce' },
];

// Conversion anchors for mapping recipe quantities to purchase units (phase 2 dish linkage)
export const CONVERSIONS = {
  garlic:  { perPurchase: 20, recipeUnit: 'clove' },   // 20 big cloves per head
  ginger:  { gramsPerLb: 453.6, gramsPerKnob: 30 },    // knob = 30g peeled; lb purchase
  onion:   { lbPerEach: 0.6 },                          // 1 onion ~ 0.6 lb
};

export const CATEGORY_ORDER = ['produce','protein','dairy','pantry','spice','frozen'];
export const CATEGORY_LABELS_ING = {
  produce: 'Produce', protein: 'Proteins', dairy: 'Dairy & Eggs',
  pantry: 'Pantry & Dry', spice: 'Spices & Aromatics', frozen: 'Frozen',
};
