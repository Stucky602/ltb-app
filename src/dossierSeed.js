// dossierSeed.js — content harvested from conversation, ready to seed.
//
// WHERE THIS CAME FROM
// A long harvest conversation on Jul 25-26 2026. Kevin talks about this stuff
// readily and writes it down almost never, which is the entire reason the
// harvest practice exists: correcting a draft is far lower friction than facing
// a blank textarea. So these are HIS words, lightly tidied, drafted back for him
// to correct rather than compose.
//
// EVERY ENTRY IS `origin: 'harvested'`, NEVER 'written'.
// That field exists precisely so "did I write this or did I approve it" stays
// answerable years later. Marking harvested content as written would destroy the
// one distinction that makes the record trustworthy about its own provenance.
//
// THE FIDELITY RULES, which matter more here than anywhere else in the app:
//
//   1. DO NOT TIDY THE PHRASING. "until I just didn't", "for that friend that
//      liked it so much", "is this dude for real" — the odd-reading parts are
//      the parts worth having. Smoothing them produces prose that sounds like
//      an app wrote it, which is the opposite of the point.
//
//   2. DO NOT RESOLVE THE HEDGES. Kevin is not sure whether he was 22 or 24.
//      He explicitly does NOT know whether that Bottega plate was actually off.
//      Claude previously inflated that second one into a claim about his palate
//      and was corrected. An uncertain memory recorded as certain is worse than
//      no record, because nothing later can tell it was ever uncertain.
//
//   3. DO NOT ADD WHAT HE DID NOT SAY. If a line reads like an inference, it
//      does not belong here.
//
//   4. `personal` IS NOT `private`. Private means business-internal, do not
//      publish. Personal means written for his son. Same storage protection,
//      opposite presentation.
//
//   5. THE GENERAL ENTRIES ARE IN KEVIN'S OWN VOICE, FIRST PERSON, ADDRESSED TO
//      HIS SON. His instruction: "make them ME. This is a gift to my son. My
//      words to him if he ever chooses to read them." So they say I and you,
//      not "he" and "Kevin". Do not rewrite them into third-person summary —
//      that turns a letter back into a record, which is the opposite of what
//      they are for. The dish entries stay as he told them, because those are
//      about food and were already in his voice.
//
// Seeding is idempotent by text: an entry whose text already exists in the
// journal is skipped, so re-running this can never duplicate the record.

export const DOSSIER_SEED = [
  // ── Dish entries ─────────────────────────────────────────────────────────
  {
    subject: { kind: 'dish', dish: 'Pappardelle with Vegetables and Mint' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'Based on a dish I was introduced to at Bottega in Birmingham, during the training weeks of a job I quit after about a day. It is basically their version of pasta primavera, a spring pasta. I changed almost nothing about it. I just try to recreate it as best I can with good spring veg.',
  },
  {
    subject: { kind: 'dish', dish: 'Pappardelle with Vegetables and Mint' },
    type: 'technique', origin: 'harvested',
    text: 'Bottega served theirs with garganelli, which is hard to find here, so I use a nice egg pasta instead. The spring onions are always a staple because of this dish.',
  },
  {
    subject: { kind: 'dish', dish: 'Pappardelle with Vegetables and Mint' },
    type: 'adjustment', transferable: true, origin: 'harvested',
    text: 'They asked me what I thought of it. I was around 22 and one week in and probably overly blunt: great, but it could use some acid. First reaction in the room was "is this dude for real." Then they tried it and agreed a squeeze of lemon would make it pop. I do not actually know that the plate was off. I assume Frank Stitt\'s version would normally carry the right acid.',
  },
  {
    subject: { kind: 'dish', dish: 'Bo Ssam' },
    type: 'provenance', origin: 'harvested',
    text: 'This came 100% from Momofuku by David Chang. I did not change the recipe. It is fully his.',
  },
  {
    subject: { kind: 'dish', dish: 'Brunswick Stew' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'I had never made this dish before. Ever. I had it around 15 at a family reunion for my friend Brittaney, whose family served it. I loved it so much that when she visited them later and they happened to have some, they would send a portion home "for that friend that liked it so much." It is not a common dish. It just stuck with me, so I wanted to bring it to more people.',
  },
  {
    subject: { kind: 'dish', dish: 'Queso' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'My mom and I were trying to crack the code of a local Tex-Mex place when I was about 15, and we kept trying for years. It was not until I found out about sodium citrate that I felt like I had figured it out. My mom now orders my queso from LTB every single week.',
  },
  {
    subject: { kind: 'dish', dish: 'Queso' },
    type: 'technique', transferable: true, confidence: 'firm', origin: 'harvested',
    text: 'Sodium citrate was the unlock. It is what made the difference between close and actually right.',
  },

  // ── Batch 2, harvested Jul 26 ────────────────────────────────────────────
  // Kevin addresses his son BY NAME inside these. That is the record doing what
  // it was built for. Do not edit it out, do not rephrase it to third person,
  // and do not demote it to a note field. It belongs in the entry text.
  {
    subject: { kind: 'dish', dish: 'Bolognese' },
    type: 'provenance', origin: 'harvested',
    text: "This one's funny. It's Mario Batali's recipe. I can't even find the actual YouTube video I watched anymore and he seems to have a few versions, but it's a great foundational dish. Weird choice for me as I normally am indifferent to Mario, but he rocks this one for sure.",
  },
  {
    subject: { kind: 'dish', dish: 'Bolognese' },
    type: 'doneCues', personal: true, confidence: 'firm', origin: 'harvested',
    text: "Crumbling meat. Totally. It should fall apart and that's what the milk is for. If you don't know why, you have more learning to do Rowan.",
  },
  {
    subject: { kind: 'dish', dish: 'Bolognese' },
    type: 'mistake', origin: 'harvested',
    text: "Not much really. I suppose you could burn it. Mario says you should restart if the onion or garlic browns but that's silly talk. You likely won't taste a difference unless the garlic gets too done and even then there's so much going on it's hard to notice. You can bang out this entire thing pretty quickly depending on pot size and knife skills for chopping the veg.",
  },
  {
    subject: { kind: 'dish', dish: 'Bolognese' },
    type: 'adjustment', origin: 'harvested',
    text: 'Add dried porcinis to it for some extra oomph if you want. Not on the menu due to the already high price, but it is so good and IS my preferred way.',
  },
  {
    subject: { kind: 'dish', dish: 'Boeuf Bourguignon (Beef Stew)' },
    type: 'provenance', origin: 'harvested',
    text: "I don't even know. Likely for me a conglomeration. Definitely some Keller influence as well as Bourdain, but it's only influence not ripping off, as this is basically just my version of a timeless dish.",
  },
  {
    subject: { kind: 'dish', dish: 'Boeuf Bourguignon (Beef Stew)' },
    type: 'doneCues', confidence: 'firm', origin: 'harvested',
    text: 'Rich thick sauce that is more saucy than soup for my take.',
  },
  {
    // Split out of the done-cue it was written inside, because it is a real
    // transferable method rather than a description of doneness. That split is
    // the ONLY structural change made to anything Kevin wrote.
    subject: { kind: 'dish', dish: 'Boeuf Bourguignon (Beef Stew)' },
    type: 'technique', transferable: true, confidence: 'firm', origin: 'harvested',
    text: "Veggies are cooked in the sauce then discarded, because it flavors the liquid well but the texture of the veg dies. I replace it with new sous vide veg so it's perfect every time.",
  },
  {
    // Kevin may want to revisit this: it says "lots of stuff" and then that the
    // dish is hard to make bad, which read as two different answers. BOTH are
    // kept. Only he can supply the specific failure that would replace them.
    subject: { kind: 'dish', dish: 'Boeuf Bourguignon (Beef Stew)' },
    type: 'mistake', origin: 'harvested',
    text: "Honestly lots of stuff. It's hard to make it bad thankfully, but this is a dish that IS French cuisine and that means there's like so many ways to improve each individual component to boost the flavor by just the tiniest amount, but when combined it really makes it next level.",
  },
  {
    // Doing double duty on purpose: the economics AND a price anchor written
    // for a future reader. Kevin wrote that anchor unprompted, having earlier
    // told Claude that long-term price legibility was not a concern — which is
    // the strongest evidence in the project that the record changes when it is
    // addressed to a person.
    subject: { kind: 'dish', dish: 'Boeuf Bourguignon (Beef Stew)' },
    type: 'price', personal: true, origin: 'harvested',
    text: "I've only been doing this whole thing for a little over a month now and had this dish on the menu once. It sold two and is easily my best profit per dish, hah. People have zero issue paying $100 for this when it cost me $50. For some reference if you read this later, $100 is what one person could spend for a NICE dinner at this time. I mean one person getting a fancy cocktail, appetizer, main course, dessert, and tip for about $100. It was one of the most expensive things on the menu and had a small serving size, but it really is that good when done right, as honestly I hope you know by now given I've likely made you this dish countless times already.",
  },
  {
    subject: { kind: 'dish', dish: 'Leblanc Inspired Japanese Curry' },
    type: 'provenance', origin: 'harvested',
    text: 'Persona 5. An excellent jRPG I highly recommend.',
  },
  {
    // "Dictionary dish" is becoming Kevin's own term of art. He used
    // "dictionary" earlier for what the Dornenburg and Page books built in him,
    // and here it has become a CATEGORY of dish. Watch for it across future
    // entries; it may deserve to be a named principle.
    subject: { kind: 'dish', dish: 'Leblanc Inspired Japanese Curry' },
    type: 'doneCues', transferable: true, origin: 'harvested',
    text: 'Understanding flavors. This is one of those "dictionary dishes" where you really need to grasp each component so you can then meld it in your head and just get why it\'s working, because that lets you have the ability to tweak it. Its failure mode is the same thing inverted: it\'s all about your dictionary and some technique, but mostly the dictionary.',
  },
  {
    // Was homeless: Kevin wrote it in the "anything else" box with the note "if
    // I don't find a better place to put this note." Filed under the curry
    // because that is where it surfaced, and marked transferable because it
    // applies to any sous vide squash. Move it if a component subject ever
    // exists.
    subject: { kind: 'dish', dish: 'Leblanc Inspired Japanese Curry' },
    type: 'technique', transferable: true, confidence: 'firm', origin: 'harvested',
    text: "Put an ice cube in the sous vide bag for the squash. It'll add the water needed for the squash to absorb during cooking to keep it from being chalky.",
  },

  // ── General entries: the past tense that is not dish-shaped ──────────────
  // First person, written TO his son. See fidelity rule 5.
  {
    subject: { kind: 'general', chapter: 'before-ltb' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'I worked years to land a job at Bottega, and I quit after about a day. The Tuesday shift was busier than my old restaurant on an Alabama game day. They told me to walk to my car with my knife out. No raise, and I was being paid in "experience." I did the arithmetic and I left. I was somewhere around 22 to 24. By the time you read this it will have been a long time ago.',
  },
  {
    subject: { kind: 'general', chapter: 'before-ltb' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'I want you to have the good parts too, because they were real. The food was incredible. The walk-in was so clean you could have eaten off the floor. Everyone there cared passionately about food, until I just didn\'t.',
  },
  {
    subject: { kind: 'general', chapter: 'who-taught-him' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'During those two weeks I saw Thomas Keller on a book tour. We exchanged a nod across the room. We never actually met, and that is the whole story, but I have kept it.',
  },
  {
    subject: { kind: 'general', chapter: 'learning-to-taste' },
    type: 'technique', transferable: true, personal: true, origin: 'harvested',
    text: 'I learned to taste on the line. The books told me what to look for. I have a deep fondness for Andrew Dornenburg and Karen Page for that. Ham and melon is the example I would give you: you learn one pairing properly, and then you own it, and it goes into a dictionary you carry around in your head.',
  },
  {
    subject: { kind: 'general', chapter: 'learning-to-taste' },
    type: 'technique', transferable: true, personal: true, origin: 'harvested',
    text: 'I can do that work unaided now. I think about both flavors in my head at once and sync them with each other. I could not always do that, and I do not think it is a talent. It is just what happens after enough of them.',
  },
  {
    subject: { kind: 'general', chapter: 'who-taught-him' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'A front-of-house manager at Chuck\'s Fish nicknamed me "Wiki."',
  },
  {
    subject: { kind: 'general', chapter: 'never-on-the-menu' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'My risotto is the best I have ever had, and people in the industry have told me it is the best thing they have eaten. You will never see it on the LTB menu, because it cannot be made safe to reheat a day later. I am writing it down anyway, because if I only recorded what I could sell you would think the reheat format was the whole of my cooking. It is not.',
  },
];
