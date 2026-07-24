# How the LTB catalog names things

**Descriptive, not prescriptive.** This is a record of the conventions already
in `dishes.js`, written so a new dish can be named without sticking out. Where
the catalog is inconsistent, this says so rather than picking a winner —
inconsistencies are noted as observations, not defects to go fix. Several are
load-bearing (renaming a dish breaks passport stamps unless `DISH_RENAMES` and
`RENAME_HISTORY` are updated together), so the bar for changing an existing
name is high and has nothing to do with tidiness.

Derived from 27 dinners, 6 always-item categories, and ~85 distinct variant
labels as of Jul 2026.

---

## 1. Dish names

### Plainness is the rule
No marketing adjectives anywhere in the catalog. No "signature", no
"chef's", no "ultimate", no "famous". The shortest names are just the dish:
**Chili**, **Gumbo**, **Bolognese**, **Bo Ssam**.

### Length tracks identification, not importance
One word to a full clause, and the only thing that decides it is how much you
have to say for someone to know what arrives:

- **Chili**
- **Mushroom Ragu**
- **Pork Chop with Kabocha Purée and Charred Broccolini**
- **Tea-Smoked Chicken with Dashi Polenta and Alabama White Sauce**

A long name is not a fancier dish. It is a dish that needs its components
listed.

### Joining words
- **`with`** attaches accompaniments to a protein or base — *Pasta **with**
  Homegrown Tomato Sauce*, *Bone-In Pork Rib Chop **with** All the Fixings*.
- **`in`** attaches a sauce the thing sits in — *Shrimp or Tofu with Asparagus
  **in** Black Bean Sauce*.
- **`over`** attaches a base the thing is plated on — *Coriander Lamb Steak
  **over** Gigantes Beans*.
- **`and`** joins co-equal components — *Texas Gulf Shrimp or Tofu **and**
  Chinese Broccoli*.

### `or` in a name signals a variant axis
When a protein choice changes what the plate is, the choice appears in the
name **and** in the variants: *Shrimp **or** Tofu with Asparagus…*, *Stir Fried
Long Beans with Ground Pork **or** Tofu*, *Cumin Beef **or** Lamb on Rice*. If
a dish has an `or` in its name, expect a matching axis in its variant labels.

### `/` separates two dishes sharing one prep
Exactly one instance: **Cumin Mushroom Noodles / Cumin Beef or Lamb on Rice**.
The slash is not an "or" — it is two genuinely different plates that come off
one shopping and prep line. Reach for it only in that situation.

### Parentheses carry the other name
- **Thai Basil Chicken (Pad Krapow Gai)** — English first, native in parens
- **Boeuf Bourguignon (Beef Stew)** — French first, English gloss in parens

The direction looks inconsistent but the underlying rule is consistent:
**whichever name the customer is more likely to recognize goes first, the
other goes in parentheses.**

### `Style` and `Inspired` hedge an adaptation
*Indian **Style** Curry*, *Leblanc **Inspired** Japanese Curry*. These are
honesty markers — the dish is not claiming to be an authentic regional
preparation. Use them when the dish is an adaptation and say so in the name
rather than in a disclaimer.

### Proper nouns mark provenance, never prestige
*Alabama White Sauce*, *Texas Gulf Shrimp*, *Brunswick Stew*, *Mapo Eggplant*,
*Pecan Mole-Fesenjan*, *Leblanc*. Each names where a component or technique
actually comes from. None is there to sound expensive.

### `Homegrown` / `Homemade` only where literally true
*Pasta with **Homegrown** Tomato Sauce*, ***Homemade** Waffles*. These are
factual claims about the garden and the kitchen, not decoration. Nothing else
in the catalog uses them.

### Cut specificity where it justifies the plate
*Bone-In Pork Rib Chop*, *Thick-Cut Pork Chop*, *Air-Chilled Chicken Breast*.
Shopping-accurate descriptors that explain what the price is for.

### Capitalization and hyphens
Title Case with lowercase prepositions and conjunctions (`with`, `or`, `over`,
`in`, `and`, `off`, `the`).

Compound modifiers before a noun get hyphenated: *Tea-Smoked*, *Bone-In*,
*Thick-Cut*, *Air-Chilled*, *Bite-size*.

> **Observed inconsistency:** *Stir Fried Long Beans* is unhyphenated where the
> pattern elsewhere would give *Stir-Fried*. Noted, not flagged for change —
> the name is in order history and renaming carries passport cost.

---

## 2. Always items

Same plainness: *Chocolate Chip Cookies*, *Brownies*, *Queso*, *Chili Oil*,
*Garlic Confit*.

**Grade suffix uses a spaced dash:** *Filet Mignon **- Prime***, *NY Strip **-
Prime***, *Ribeye **- Prime***. Consistent across all three.

**`or` vs separate entries** — a real distinction worth preserving:
- One entry with `or` when it is **one prep with a swapped ingredient**:
  *Pickled Onions **or** Carrots*, *Thyme **or** Lavender Syrup*
- Separate entries when they are **genuinely different products**:
  *Vanilla Syrup* and *Vanilla Lavender Syrup* stand alone

**Parenthetical clarifiers are lowercase:** *Corn (off the cob)*.

---

## 3. Variant labels

The most systematic part of the catalog. The core shape:

```
[Axis, ] Size (~servings) [ + Addition]
```

### Size and servings
- **`Small` / `Large`**, occasionally **`Medium`**, occasionally **`Base`**.
- Servings are **always tilde-prefixed** — `(~4)`, never `(4)`. Serving counts
  are estimates and the catalog never promises otherwise.
- Ranges are common and preferred where honest: `(~3-4)`, `(~8-10)`.
- **`Batch`** replaces the bare size where the dish is cooked in batches:
  *Shrimp, Small **Batch** (~3-4)*.
- **`split order`** flags a small that is literally a split of a large batch:
  *Small (**split order**, ~3-4)*.

### The axis prefix
A choice that changes the dish goes **before** the size, comma-separated:

- *Chicken, Small (~4-5)*
- *Lamb, Large (~6-8)*
- *Ground Pork, Small (~4)*
- *Mushroom, Large (~6-8)*

### The addition suffix
An add-on is appended with ` + `:

- *Small (~4) **+ Egg Pappardelle***
- *Mushroom, Large (~6-8) **+ Asian Greens (1 lb)***
- *Small (~4 servings) **+ Polenta***

> **Observed inconsistency:** the `+` usually comes after the serving
> parenthetical (*Small (~4) + Egg Pappardelle*) but sometimes before it
> (*Small + Fennel Pork Sausage (~4-5)*). Both forms are live.

> **Observed inconsistency:** `servings` is sometimes spelled out (*Small (~4
> servings)*) and sometimes left bare (*Small (~4)*). The bare form is more
> common.

### Non-dinner variants are unit-based, not serving-based
Where servings make no sense, the label states the unit:

*Set of 12* · *1 Dozen (Standard)* · *1 Dozen (Premium Valrhona)* · *Per Pint
Jar* · *Per Jar* · *Per Container* · *1 Batch* · *6 oz bag* · *Whole (~2
servings)* · *Bite-size (~2 servings)*

### Two special labels
- **`price by weight`** — the only all-lowercase variant label in the catalog.
  It is a pricing *mechanism* flag, not a size, and the lowercase marks that
  difference.
- **`With jar swap`** — a mechanism flag too: net-zero container movement, and
  the jar ledger reads it directly.

---

## 4. Quick check for a new name

Not rules, just the questions the existing catalog implicitly answers yes to:

1. Would someone who has never seen the menu know roughly what arrives?
2. Is every adjective in it factually true (homegrown, bone-in, prime)?
3. If it is an adaptation, does the name admit that (`Style`, `Inspired`)?
4. If there is a protein choice, is it in both the name and the variants?
5. Title Case, lowercase prepositions, hyphenated compound modifiers?
6. Do the variant labels follow `[Axis, ] Size (~servings) [ + Addition]`?
7. Is every serving count tilde-prefixed?

And the one that is not about style: **is this name going into order history?**
If a dish already shipped under a different name, the rename needs a
`DISH_RENAMES` entry *and* a `RENAME_HISTORY` row, or passport stamps break —
which has already happened once.
