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

  // ── General entries: the past tense that is not dish-shaped ──────────────
  // These had a data model and no home until chapters existed. They are the
  // reason Gap A had to close before any of this could be seeded.
  {
    subject: { kind: 'general', chapter: 'before-ltb' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'I worked years to land the job at Bottega and quit after about a day. The Tuesday shift was busier than my old restaurant on an Alabama game day. They told me to walk to my car with my knife out. No raise, paid in "experience." I did the arithmetic and left. I was somewhere around 22 to 24, and this was twenty years ago.',
  },
  {
    subject: { kind: 'general', chapter: 'before-ltb' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'The positives were real and I want them kept. The food was incredible. The walk-in was so clean you could eat off the floor. Everyone there cared passionately about food, until I just didn\'t.',
  },
  {
    subject: { kind: 'general', chapter: 'who-taught-him' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'During those two weeks I saw Thomas Keller on a book tour. We exchanged a nod across the room and never actually met.',
  },
  {
    subject: { kind: 'general', chapter: 'learning-to-taste' },
    type: 'technique', transferable: true, personal: true, origin: 'harvested',
    text: 'I learned to taste on the line. The books told me what to look for. Deep fondness for Andrew Dornenburg and Karen Page. Ham and melon is the example I use for building a palate dictionary: you learn the pairing, and then you have it.',
  },
  {
    subject: { kind: 'general', chapter: 'learning-to-taste' },
    type: 'technique', transferable: true, origin: 'harvested',
    text: 'I can do the pairing work unaided now, by thinking about both flavors in my head at once and syncing them with each other.',
  },
  {
    subject: { kind: 'general', chapter: 'who-taught-him' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'A front-of-house manager at Chuck\'s Fish nicknamed me "Wiki."',
  },
  {
    subject: { kind: 'general', chapter: 'never-on-the-menu' },
    type: 'provenance', personal: true, origin: 'harvested',
    text: 'My risotto is the best I have ever had, and industry people have told me it is the best thing they have eaten. It will never be on the LTB menu, for food-safety reasons. It is recorded here precisely because it cannot ship: without it, the record implies the reheat format was the whole of my cooking, and it is not.',
  },
];
