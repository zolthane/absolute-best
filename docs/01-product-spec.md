# Product Specification — Part 1: The Map and Voting

| | |
| --- | --- |
| **Version** | 1.0 |
| **Date** | 2026-09-07 |
| **Status** | **APPROVED** by Lovas Zoltán, 2026-09-08 |
| **Scope** | Only the two areas settled so far: entering the map, and casting a vote |
| **Not yet covered** | Intro screen, adding entries, Quick Fire, profiles, item cards |

> This document records decisions you have already made, so they cannot drift. The
> remaining areas will be added as Part 2 once these are approved.

---

## 1. The two axes — settled

| Axis | Meaning | Changes when |
| --- | --- | --- |
| **X** (left ↔ right) | The **sum** of every vote, −10 to +10 each | Anyone votes |
| **Y** (down ↕ up) | The **number of people** who have voted on it | Anyone votes |

An item at **far right and high up** is loved by many. **Far right and low down** is
intensely loved by few. **Near the centre and high up** is famous and divisive. This is the
reading the business plan's Section 2 now describes.

---

## 2. Entering the site — the full-scale overview

When a visitor arrives, the camera shows **the entire world at once**: from the
lowest-scoring item to the highest, and from zero votes up to the most-voted item.

At that zoom level there could be hundreds of thousands of items, so we do not draw them
all. We draw a **representative sample**, and reveal more as the visitor zooms in.

```
   voters
     ^
 max |          .              .
     |     .        .    .          .
     |  .      .   .   .     .   .      .
     | .   .  . .  . . . . .  . .  .  .   .
     +--------------------|--------------------> score
   lowest                 0                highest
             <----- the whole world fits on screen ----->
```

### What exactly is "the whole world"? — answering your Risk 7 note

> *Your note in the business plan: "give suggestion for visible range, my idea is: highest
> score/2"*

**Recommendation: fit the actual data, not a formula.** On entry the camera is set to the
real extent of what exists — the lowest score to the highest, and zero votes to the
most-voted item — plus about 5% breathing room so nothing is glued to the edge.

Three reasons a formula like `highest / 2` would cause trouble:

1. **It discards the negative half of the world.** Half the product is things people
   dislike. A range starting at zero would hide every one of them, and "most hated" is one
   of the most shareable views the site will have.
2. **It is arbitrary when the data is lopsided.** If the highest item sits at +40,000 and
   the next at +200, then `highest / 2` is +20,000 — a view that is 99% empty space.
3. **It is no longer needed for performance.** That was the worry behind the note, and the
   grid sampling in the next section already solves it: at most ~740 dots are drawn *no
   matter how wide the range is*. The visible range and the rendering cost are now
   completely decoupled.

Finding the extent costs one cheap database query — `MIN(score)`, `MAX(score)`,
`MAX(vote_count)` — three numbers, on indexed columns.

**Two edge cases, both settled now so they cannot surprise us:**

- **An empty or brand-new site**, where everything sits at zero: default to a fixed range of
  −100 to +100, so the axis still looks like a world rather than a dot.
- **A single wild outlier.** If one item reaches +40,000 while everything else lives within
  ±500, fitting the true extent squashes 99% of the world into a few pixels. The known fix
  is to fit the **1st-to-99th percentile** instead, leaving the outlier reachable by
  panning. **Not building that yet** — mock data has no outliers, and it is a contained
  change to one function when real data needs it (`CLAUDE.md` §2).

### How the sample is chosen — Q3, elaborated

**The problem, concretely.** Suppose the site eventually holds 500,000 items spread across
scores from −50,000 to +50,000. Your screen is about 1,500 pixels wide. Even if the browser
could draw half a million dots — it cannot — they would overlap into a grey smear roughly
330 items deep per pixel. So we must choose a few hundred to stand for the rest. The only
question is *which*.

#### Step 1 — measure in screen pixels, not score points

Your suggestion was "one item every 10 score points". The instinct is right, but a fixed
score interval breaks at both ends of the zoom range:

| Zoom level | Visible score range | Items at "every 10 points" |
| --- | --- | --- |
| Fully zoomed out | −50,000 to +50,000 | **10,000** — far too many to draw |
| Mid zoom | −500 to +500 | 100 — about right |
| Zoomed right in | +18 to +25 | **0** — the map goes blank |

Measuring in *screen pixels* fixes all three at once, because the screen is always the same
size. Divide the visible area into cells of roughly 40 pixels and show one item per cell.
The number drawn then stays roughly constant at every zoom level. Zooming in makes each
cell cover a narrower slice of the world, so more items qualify and detail appears by
itself.

#### Step 2 — a grid, not columns *(this corrects what I told you last time)*

Last turn I proposed dividing the screen into vertical **columns** and showing one item per
column. That was wrong, and the reason is your own Q2 answer: now that the Y axis carries
real information — how many people voted — one item per column would throw that information
away and flatten the world into a single row.

**We divide the screen into a grid instead**, and show one item per *cell*. That preserves
the shape of the cloud, which is the whole point of having two axes:

```
   voters (log)
      ^
 100k |  .   |     |     |  o  |     |     |   .        <- famous
      |------+-----+-----+-----+-----+-----+------
  10k |  .   |  o  |  o  |  o  |  o  |     |   .
      |------+-----+-----+-----+-----+-----+------
   1k |  o   |  o  |  o  |  o  |  o  |  o  |   o
      |------+-----+-----+-----+-----+-----+------
   100|  o   |  o  |  o  |  o  |  o  |  o  |   o
      |------+-----+-----+-----+-----+-----+------
    10|      |  .  |  o  |  o  |  o  |  .  |         <- obscure
      +------+-----+-----+--|--+-----+-----+------> score
    hated                   0                loved

     o = the one item drawn for that cell
     Each cell is about 40x40 pixels on screen, at any zoom.
```

A screen of 1,500 × 800 pixels gives roughly 37 × 20 = **740 cells**, so at most 740 items
are drawn — a number the browser handles comfortably — no matter how large the site grows.

#### Step 3 — which item represents a cell?

Every item inside one cell already has a similar score *and* a similar vote count, so they
are close to interchangeable. What matters is only that the choice is **consistent**.

| Approach | Verdict |
| --- | --- |
| **Random** | ✗ Rejected. Pan twenty pixels and the cell boundaries shift, a different item is picked, and the map reshuffles. Items flicker in and out; refreshing shows a different world. A map you cannot learn the shape of is not a map. |
| **Most-voted, ties broken by oldest** | ✓ **Recommended.** Completely stable — the same cell always yields the same item. Meaningful: you see the most significant thing in each region first, exactly as a zoomed-out road map shows Budapest and not the village beside it. |

**"But then obscure items are never seen."** Correct at low zoom — and that is intended.
Discovery of obscure and new items is Quick Fire's job, where items are served directly to
the user one at a time. The map is the overview; Quick Fire is the long tail. Each does one
job well, so neither needs to compromise.

If it later turns out new items are genuinely starved of votes, the fix is small: reserve a
handful of cells for recently-added items. **Not building that now** — it is speculative
until the data shows a problem (`CLAUDE.md` §2).

#### Step 4 — show what is hidden

A cell containing one item and a cell containing four thousand should not look identical, or
the map quietly lies about where the world is dense.

**Recommendation: the dot grows and darkens with the number of items it stands for**, and
the item's name is shown only when it is alone in its cell. The cloud's density then becomes
visible at a glance, and zooming into a dense region visibly resolves it into individuals.

### On your performance concern

You were right that the naive version is expensive, but the fix is standard and the result
is cheap. The database is asked "for each of these 740 cells, give me the most-voted item
and how many items are in it" — one indexed query returning at most 740 rows, whether the
database holds a thousand items or ten million.

The load does **not** grow as the site grows. This is the single most important reason the
world-line approach can scale at all, and it is why the tech stack document insists the
layout maths live in plain, testable functions.

### The Y axis needs compressing

Vote counts will eventually span from 1 to millions. Drawn linearly, an item with two
million votes would sit two million units above an item with one — thousands of screens
away, with everything else squashed flat at the bottom.

**Settled (Q2): the Y axis uses a logarithmic scale.** In plain terms, each equal step
upward means *ten times* as many voters: 1 → 10 → 100 → 1,000 → 10,000. The whole range
then fits comfortably on one screen, and the axis labels make the compression visible so
nobody is misled.

---

## 3. Focusing an item — click or search

Triggered by clicking an item, or by choosing a search result.

1. The camera **animates smoothly** to centre on that item's exact X position — it does not
   jump. The movement itself tells the visitor where they have travelled to.
2. The zoom settles so that roughly **20 items either side** of the chosen one are visible,
   giving it context: what is this thing sitting between?
3. The chosen item is **highlighted** and shows its **name** and **current score**.
4. Its neighbours stay visible but understated, so the focus is unambiguous.

```
        BEFORE                              AFTER
   whole world visible          zoomed to Sample Film Alpha

  . .. . ... .. . . ..            .    .   [ALPHA]   .    .
  ....|..............     --->      .    .    +20   .   .    .
      0                           <-- 20 items -->|<-- 20 items -->
```

The camera position is kept in the web address, so this view is a shareable link — which
the business plan identifies as a primary growth mechanism.

---

## 4. Casting a vote — the drag

Available only to logged-in users. Logged-out visitors see everything and can move around,
but cannot drag.

1. The user **grabs the focused item** and drags it **left or right**, up to 10 points in
   either direction.
2. The drag **snaps to whole score points** — there are no half votes.
3. While dragging, the item's **projected new total is previewed live**, so the consequence
   is visible before committing.
4. **Releasing does not vote.** The item stays where it was dropped, and a **Submit
   button** appears showing the intended vote: *"Submit vote: +7"*.
5. Until Submit is pressed, the user may **re-drag as often as they like**. Nothing has been
   cast, so this is not a do-over — it is simply aiming.
6. **Pressing Submit commits the vote, permanently.** The button warns that it cannot be
   undone.
7. The item's **voter count rises by one** and it moves **up** the Y axis.
8. The item is now **locked** for that user. Returning to it later shows their vote, but
   offers no way to alter it.

```
   Grab, drag, aim freely:            Then commit, once:

      [ALPHA]                            [ALPHA]  +20 -> +27
     <=======>  drag                    +-------------------+
      +20 -> +27  (preview)             | Submit vote: +7   |
                                        | This cannot be    |
     re-drag as often as you like       | undone.           |
     nothing is cast yet                +-------------------+
```

```
   Grab the item and push it along the line:

      +10          +20          +30
       |____________|____________|
       <--------- your range --------->
                 [ALPHA]
                    |
              drag  <=====>  release

   Released 7 to the right  ->  your vote is +7
   Item's total: +20  ->  +27
```

**Dragging the item votes. Dragging the empty background pans the map.** These never
conflict, in exactly the way that dragging a pin differs from dragging the map beneath it.

---

## 5. The rules that follow

These are consequences of the decisions above. They are stated explicitly because each one
is a place where an implementation could silently get it wrong — and each one becomes a
test.

| # | Rule | Why |
| --- | --- | --- |
| R1 | One user may vote on an item **exactly once**, a whole number from −10 to +10 | Your decision: the vote is final |
| R2 | An item's score is the **sum** of all votes — never an average | The entire premise |
| R3 | A vote is **immutable**. It cannot be changed, re-cast, or withdrawn | R1 |
| R4 | The draggable range is always the **full −10 to +10**, centred on the item | Follows from R3 — there is no previous vote to account for |
| R5 | Every vote raises the voter count by **exactly one** | Follows from R1: votes and voters are the same number |
| R6 | An item the user has already voted on is **locked** — visible, but not draggable | R3, made visible in the interface |
| R7 | Two people voting at the same instant must both be counted | The reason a real database is required |
| R8 | Deleting an account must still sever the link between person and vote | GDPR — see business plan Section 10. The vote survives anonymised; the *user* cannot re-vote because the account is gone |
| R9 | A vote exists only after **Submit** is pressed. Dragging alone changes nothing | Q1 — misclick protection |
| R10 | **Colour states:** blue = votable, grey/black = locked | Q4 |
| R11 | For a **logged-out visitor every item is locked**. They may look, search and move around, but never drag | Q5 |

> **What R1 simplifies.** Because there is no re-voting, three awkward problems disappear
> entirely: the drag range is always symmetrical, the voter count can never drift out of
> step with the votes, and a whole class of "who wrote last" concurrency bugs cannot occur.
> This is a genuinely simpler product to build correctly.
>
> **The one risk it introduces: a misclick is permanent.** Dragging is imprecise — someone
> aiming for +7 may release at +6, with no way back. Note that a **confirmation step is not
> a do-over**: it prevents the accidental vote rather than undoing a deliberate one. See Q1.

---

## 6. Decisions taken

**Q1 — SETTLED.** A **Submit button**. Dragging aims; Submit casts. The user may re-drag
freely until they press it. See Section 4 and rule R9.

**Q2 — SETTLED.** The Y axis is **logarithmic**. Each equal step upward means ten times as
many voters.

**Q3 — SETTLED, provisionally.**

- **Q3a — Grid**, as described in Section 2, Step 2. You are not certain about it; we build
  it, look at it, and change it if it feels wrong. This is cheap to revisit precisely
  because the sampling logic is a plain function, tested independently of the screen.
- **Q3b — Most-voted item per cell**, ties broken by oldest. *(Recorded as accepted from
  the recommendation — say so if you meant otherwise.)*
- **Q3c — Crowded cells look denser**: the dot grows and darkens with the number of items
  it stands for, and names appear only when a dot is alone. *(Also recorded as accepted
  from the recommendation.)*

> **What "change it later" costs, so the decision is informed.** Swapping the grid for
> columns, or most-voted for something else, means rewriting one function and its tests. It
> does not touch the camera, the database, or the interface. This is genuinely a
> try-it-and-see decision, not a one-way door.

**Q4 — SETTLED.** **Blue** = votable. **Grey or black** = already voted, locked. Rule R10.

**Q5 — SETTLED.** For a logged-out visitor, **every item is locked**. They may look, search
and move around the map, but nothing is draggable. Rule R11.

**Q6 — MOVED.** Filters grew into their own subject once you proposed deriving tags
automatically from Wikipedia. It now has a dedicated document:
**[04-tagging-and-filters.md](04-tagging-and-filters.md)**, where decisions F1–F4 are
waiting.

Nothing about filters is built in Stage 0 beyond a few invented tags on placeholder items,
so this does not block the map.

> **One consequence of Q4 + Q5 worth noting.** For a logged-out visitor the entire map is
> grey, which means the colour that signals "you can vote here" is never seen by the people
> we most want to convert into voters. Worth considering whether logged-out visitors should
> instead see everything **blue**, with a login prompt on the first drag attempt — teaching
> the mechanic while still permitting nothing. Not changing anything unless you say so.

---

## 7. Parked for later

Good ideas that are deliberately **not** being built now. Recorded so they are not lost,
and not built prematurely (`CLAUDE.md` §2).

### 7.1 Activity heat map

Colour items by how much they have been voted on **in the last 24 hours** — blue → green →
yellow → orange → red as activity rises. Quiet items stay cool; something being argued
about right now glows.

This is a strong idea for the "living world" feel the business plan describes, and it
belongs naturally with **Stage 2 (History & Movement)**, which is where vote timestamps
start being used for anything.

**Two things to know before it is built:**

1. **It collides with rule R10.** Colour is currently the signal for *votable* (blue)
   versus *locked* (grey/black). A heat map wants colour for *activity*. One channel cannot
   carry both meanings without becoming unreadable, so locked state would have to move to a
   different signal — reduced opacity, an outline, or a small padlock. That is a design
   decision to take **when** the heat map is built, not now.
2. **It needs a rolling 24-hour count per item.** Vote timestamps will be stored anyway, so
   the data exists; the work is maintaining or querying the rolling total efficiently. Not
   difficult, but not free either.

**Not building it now, and not building any "flexibility" in preparation for it.** When the
time comes it is a contained change.

### 7.2 Fullscreen view on phones

> *Your note in the business plan, Section 5: "thinking on phone users there could be a
> fullscreen view mode"*

Good idea, and a natural fit — a phone screen is small, and this product is almost entirely
map. A fullscreen mode that hides the top bar and gives the world the whole display would
help more here than on most sites.

Deferred simply because Stage 0 is being built and tested on a desktop browser. Worth
revisiting as soon as the map is real enough to open on a phone — likely straight after
batch 3.

### 7.3 Seeding the world with 100 items at launch

> *Your note in the business plan, Section 4: "populate site with 100 random articles at
> start"*

This is the right instinct and it is already the plan's answer to **Risk 1 (cold start)** —
an empty map is boring, and boring maps attract no votes. Recording the practical detail
here so it is not lost:

- **Stage 0** uses roughly 100 clearly-labelled placeholder items ("Sample Film Alpha" and
  similar) rather than real titles, so nothing in the prototype can be mistaken for real
  data. Nothing real is needed to prove the interaction works.
- **Stage 1** replaces them with real entries drawn from Wikipedia. That is the first point
  at which the Wikipedia API is contacted for real, and it needs the licensing and
  attribution review noted in the business plan's Section 11.
- **A hundred may not be enough.** Spread across a wide score range, 100 items make a sparse
  map. Several hundred is likelier to feel alive. Cheap to tune once we can see it.

---

## 8. Approval

- **Approved by:** `Lovas Zolán`
- **Date:** `2026.09.07.`
- **Approved with the following changes:**

```
(write anything you want changed here)
```

---

## 9. Weight and balance — making the name mean something

*Added 2026-09-08, after the rename to **Teeter — Tip the scales.** Approval above is not
reopened; these are proposals, decisions W1–W3 below.*

**The principle that decides all of this:** motion on a data map should **encode
information, not decorate**. Anything that merely looks nice costs performance, ages badly,
and slowly makes the map harder to read. Everything recommended below carries real meaning;
everything rejected does not.

### 9.1 ✅ The zero point becomes a fulcrum

Draw **0** as a small triangle sitting under the axis — the pivot of a seesaw — instead of a
plain tick mark.

```
        ────────────────────┬────────────────────
                            ▲
                            0
```

Static, costs nothing, never moves, and the whole metaphor becomes legible without a single
frame of animation. Roughly **15 minutes**, in batch 1.

### 9.2 ⭐ Items have weight when they move

**The strongest idea, and the one you were reaching for.**

When an item moves to a new position it does not glide at a constant speed. It moves like a
weight on a spring: accelerating, slightly overshooting, settling. **How much it overshoots
depends on how many people have voted on it.**

| Item | Voters | What a +10 vote looks like |
| --- | --- | --- |
| Barely known | 3 | Lurches across the screen, swings past, wobbles into place |
| Well established | 50,000 | Barely shifts. A twitch |

**Why this is more than an effect:** it makes the additive model *felt* rather than
explained. The business plan spends three paragraphs arguing that sums beat averages and
that participation is the hidden story. This teaches the same thing in half a second,
wordlessly — your vote throws an obscure item across the world, and moves a famous one
almost not at all. That is the product's whole thesis, delivered as a physical sensation.

It also fits the name exactly: things with weight, tipping and settling.

**Cost:** about an hour. It is an easing function, not a physics engine — a pure function of
(distance, voter count) → position over time, which means it is unit-testable like all the
other maths. Only items that are actually moving animate, so the cost is near zero when the
map is still.

**Where:** batch 7 (voting) and batch 10 (the living world).

> **Accessibility caveat, and it is not optional.** Springy motion causes real discomfort
> for people with vestibular disorders. The browser reports `prefers-reduced-motion` when
> someone has asked their system for less animation — when it is set, items must move
> directly and calmly to their new position. This is part of the work, not an extra.

### 9.3 🤔 The line sags under weight — tempting, but later

A tightrope bows downward where the load is heaviest: the axis itself dips slightly beneath
regions holding many high-vote items.

Genuinely beautiful, genuinely on-brand, and it does encode something real (where the
world's attention is concentrated). But it means drawing a curved axis while items sit at
their true straight-line positions — a small dishonesty between the line and the data — and
it works against the clean white-and-black visual language.

**Recommendation: not now.** Revisit at Stage 2 once the map is real enough to judge.

### 9.4 ❌ Rejected — and why

| Idea | Why not |
| --- | --- |
| **The whole axis rotates** with the global balance of votes | The most literal reading of "tipping", and the worst one. The axis *is* the coordinate system; rotating it either distorts every item's position or breaks the maths behind hit-testing. A map whose grid tilts is not a map |
| **Ambient sway** — items always bobbing gently | A data display that never sits still is tiring to read and drains a phone battery for nothing. Batch 10 already makes the world move — driven by actual votes arriving, which is honest movement rather than decoration |
| **Dot size by vote count** | The Y axis already encodes voter count. Saying it twice adds no information and collides with cell-density sizing (Q3c) |
| **Items lean by score** | Duplicates the X position, and rotation is hard to read at small sizes |
| **Drag resistance** — heavy items harder to pull | Charming, but it fights precision. The Submit button exists so people can aim exactly; adding friction undermines that |

### 9.5 Free brand moments — no data risk

- The **wordmark balances on a pivot** and rocks gently on the intro screen (batch 11)
- The **loading indicator is a seesaw** finding its balance

Both are pure presentation on non-data screens, so none of the objections above apply.

---

## 10. Decisions — weight and balance

**W1 — Zero drawn as a fulcrum triangle?** *(9.1. Recommended: yes — free, static, and it
makes the name legible.)*

- [x] Yes — batch 1
- [ ] No

**W2 — Weighted settle, with overshoot scaled by voter count?** *(9.2. Recommended: yes —
it teaches the additive model wordlessly. Includes honouring `prefers-reduced-motion`.)*

- [ ] Yes — batches 7 and 10
- [x] Yes, but keep it very subtle
- [ ] No

**W3 — The teetering wordmark and seesaw loader?** *(9.5. Recommended: yes, batch 11.)*

- [x] Yes
- [ ] Just the wordmark
- [ ] Neither
