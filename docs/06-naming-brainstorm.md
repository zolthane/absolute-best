# Naming brainstorm

A running log of name and tagline ideas, kept while we decide whether "Teeter" stays.
Unlike the other documents in this folder, this one is never "approved" — it just grows
every time a new idea comes up, until the rebrand question is settled one way or the other.

Same format as the business plan's open decisions: put an `x` in whichever box fits -
**Yes** (a real contender), **No** (rule it out), or **Maybe** (keep it in mind, not
sold yet). Nothing here needs to be finalized until you say so — vote on some, none, or
all of them, whenever you want.

---

## Where this came from

Once the world map had enough real data in it (batch 10), the actual visual stopped
looking like a two-sided seesaw and started looking like a branching tree, a water
sprout, or a volcano — a shape that fans outward from a base, not a level beam pivoting
at a center. That's a direct consequence of how items are positioned: score is an
unnormalized running total (not an average), so a heavily-voted item both rises
(voter count, the Y axis) *and* spreads further out (score, the X axis) as votes pile
up, while a lightly-voted item stays low and near the center. There's no visual fulcrum
anywhere in that, which is why "balance" stopped feeling like the right picture.

**Decision so far:** keep "Teeter" for now, and retire only the *literal* seesaw framing
(e.g. batch 11's intro-screen pivot animation) rather than force the name to match a
picture it was never going to match. Revisit if a stronger alternative below gets a Yes.

**Update, 2026-09-11: rebranding to "Better Than", tagline "Everyone's tier list."** This
came out of a deeper conversation than the shape of the graph - see the new "Comparison,
not rating" section below, which questions the scoring model itself, not just the name.
Trying it live now, on `feature/rebrand-better-than`, to see how it feels before touching
the formally approved business plan / product spec text (see the multi-document note
above - those still say "Teeter" and describe the current sum-based scoring; left alone
until this experiment is confirmed).

**If a rebrand ever does happen:** it's a real, multi-document effort, not a quick
find-replace. "Teeter" and "Tip the scales" are written into `00-business-plan.md`,
`01-product-spec.md`, `03-build-checklist.md`, `05-supporting-features.md`, and this
folder's own `README.md`.

---

## Candidate names

**Groundswell** — a real term for a mass of opinion building up from below — matches the
"many small opinions accumulating into something visible" mechanic, and happens to
match the growth-shaped visual too.
- [ ] Yes   - [ ] No   - [x] Maybe

**Confluence** — many separate currents converging into one visible shape.
- [ ] Yes   - [ ] No   - [x] Maybe

**Canopy** — closest match to the "tree" reading specifically — established consensus
as the canopy, niche takes as scattered undergrowth below it.
- [ ] Yes   - [ ] No   - [x] Maybe

**Throughline** — softer and more abstract — less tied to any one specific visual, more
about the thread connecting many opinions.
- [ ] Yes   - [x] No   - [ ] Maybe

**Common Ground** — plain-spoken, tells you what the product is for without needing a
visual metaphor at all.
- [ ] Yes   - [x] No   - [ ] Maybe

**The Consensus** — blunt and literal — says exactly what the map is showing.
- [ ] Yes   - [x] No   - [ ] Maybe

**Undercurrent** — quieter framing — opinion building beneath the surface before it's
visible.
- [ ] Yes   - [x] No   - [ ] Maybe

**Weigh In** — a tagline-shaped name — literally what casting a vote is.
- [ ] Yes   - [ ] No   - [x] Maybe

**Ground Truth** — double meaning: the "true" state of consensus, plus an echo of the
earth/growth imagery.
- [ ] Yes   - [x] No   - [ ] Maybe

**Sprout** — short, plain version of the tree/growth reading.
- [x] Yes   - [ ] No   - [ ] Maybe

**Verdict** — blunt like "The Consensus," but with a courtroom/judgment flavor rather
than a geological one.
- [ ] Yes   - [ ] No   - [x] Maybe

**The Tally** — plain-spoken, count-based — no metaphor to explain at all.
- [ ] Yes   - [x] No   - [ ] Maybe

**Fault Lines** — where opinion visibly splits rather than agrees; also a nice fit if
"most controversial" (see the race concept below) ever becomes a real, tracked metric.
- [ ] Yes   - [ ] No   - [ x] Maybe

**Majority Rules** — blunt and literal, in the same family as "The Consensus" and
"Verdict."
- [ ] Yes   - [ ] No   - [x] Maybe

**Better Than** — the verb every vote actually performs (see "Comparison, not rating"
below): you're not rating an item in isolation, you're placing it relative to everything
else. **Chosen, 2026-09-11.**
- [x] Yes   - [ ] No   - [ ] Maybe

**Pecking Order** — same idea, more idiomatic; kept as the runner-up.
- [ ] Yes   - [ ] No   - [x] Maybe

**Overtake** — the verb, not the noun; already matches the "passing item" feature
(batch 7b) almost too literally.
- [ ] Yes   - [ ] No   - [x] Maybe

**Jostle** — the crowded pack shoving for position, once items sit close together.
- [ ] Yes   - [ ] No   - [x] Maybe

**Contenders** — everything on the map is running for a place.
- [ ] Yes   - [ ] No   - [x] Maybe

**Sort It Out** — collaborative sorting and settling a dispute, both at once.
- [ ] Yes   - [ ] No   - [x] Maybe

---

## Candidate taglines

**"Find your level"** — pairs with keeping "Teeter" — still balance-flavored, but about
settling rather than a literal two-sided tip.
- [ ] Yes   - [x] No   - [ ] Maybe

**"Where opinions take root"** — pairs with a tree/growth-named rebrand (e.g. Canopy).
- [ ] Yes   - [x] No   - [ ] Maybe

**"Watch consensus grow"** — pairs with any growth-themed rebrand.
- [ ] Yes   - [ ] No   - [x] Maybe

**"See what the world settles on"** — works with either "Teeter" or a rebrand — doesn't
depend on a specific visual metaphor.
- [ ] Yes   - [ ] No   - [x] Maybe

**"Everyone's tier list."** — pairs with "Better Than": the whole internet making one tier
list together, live. **Chosen, 2026-09-11.**
- [x] Yes   - [ ] No   - [ ] Maybe

**"Where does it belong?"** — the literal question a vote answers under the comparison
model.
- [ ] Yes   - [ ] No   - [x] Maybe

**"Find out who you're up against."** — leans into the rivalry framing.
- [ ] Yes   - [ ] No   - [x] Maybe

---

## Comparison, not rating: a deeper question than the name

Raised 2026-09-11, prompted by a simple example: *"I wouldn't cast +10 on pineapple,
because that would give it a higher score than melon."* That's not a rating instinct
("how much do I like this?") - it's a placement instinct ("where does this belong,
relative to that?"). The sum-based scoring model (business plan §2, "Teeter does not
average, it adds") makes that placement impossible to reason about: score is a running
total, so voter count alone can put one item permanently out of another's reach, no matter
how strongly people feel about it. That's also *why* the map spreads out as far as it
does instead of staying a tight, readable pack.

**Trying, as an experiment (not yet applied to the approved business plan text):**
display position on X from a damped average - `score / (voterCount + K)` for some small
constant K - instead of the raw sum. Effects:

- Items cluster near the centre and only earn their way outward as *conviction* (not just
  vote count) grows - closer together, more of a visible "race", matching the "items
  should be closer together" feeling from testing.
- Two items can be meaningfully compared regardless of how many votes each has.
- Voter count still lives entirely on the Y axis, so nothing about "how many people
  cared" is lost - it just stops leaking into X as well.

**What this does NOT change:** the underlying vote records, the ±10-per-vote rule, one
vote per user, locking after voting - all of batch 7's rules stay exactly as specced. Only
the position/display formula changes. Stored score remains the real, uncapped sum;
`03-build-checklist.md`'s tests for the sum itself do not need to change.

**What this DOES contradict, and needs a real decision once the experiment is felt:** the
business plan's stated "no ceiling" (§2.3) and "uncapped" claims (§3) are about the sum,
which is still true underneath - but the *visible* range becomes bounded (roughly -10..+10
either side), which is a different promise than what's currently written and pitched. If
the experiment feels right, this needs a proper, explicit update to `00-business-plan.md`
and `01-product-spec.md` - not left as a quiet contradiction between the code and the
approved plan.

---

## Alternative concept: a gamified "race" (from Zoltán)

A different direction entirely from the tree/consensus framing above — worth keeping
open as its own branch of thinking rather than folding into the list above.

**The concept as a whole** — *Race to the Most*: three parallel lanes (left, middle,
right), each running toward a signpost — **Most Hated**, **Most Controversial**, **Most
Loved**. Items appear as racers on whichever lane fits them, positioned along it by how
extreme they are in that direction, rather than scattered across one open 2D field the
way the current map works.
- [x] Yes   - [ ] No   - [ ] Maybe

**What this would actually need, mechanically:** "most loved" and "most hated" already
fall out of score today, but "most controversial" doesn't — controversy is about how
*split* the votes are (lots of voters pulling hard in opposite directions), not the net
score. Right now the app only tracks a summed score and a voter count, nothing about
the spread of individual votes, so a genuinely controversial item and a mildly-liked
item with the same net score currently look identical. That's a real product-mechanics
gap worth remembering if this direction is ever pursued — not something to build now.

**Matching name variants**, same racing/competitive vibe:

**Three Lanes** — plain description of the visual itself.
- [ ] Yes   - [ ] No   - [x] Maybe

**Photo Finish** — the moment of comparison — who's ahead right now.
- [ ] Yes   - [x] No   - [ ] Maybe

**Pole Position** — being in the lead in whichever lane.
- [ ] Yes   - [x] No   - [ ] Maybe

**Neck and Neck** — emphasizes close competition rather than a runaway leader.
- [ ] Yes   - [x] No   - [ ] Maybe

**The Standings** — leaderboard-flavored, less literally about racing.
- [ ] Yes   - [ ] No   - [x] Maybe

**Leaderboard** — the most literally gamified option of the set; no subtlety, reads
instantly as a game.
- [ ] Yes   - [ ] No   - [x] Maybe

**Taglines for this direction:**

**"Pick a lane."**
- [ ] Yes   - [x] No   - [ ] Maybe

**"Everyone's racing for a verdict."**
- [ ] Yes   - [x] No   - [ ] Maybe

**"Where opinions compete."**
- [ ] Yes   - [ ] No   - [x] Maybe

---

*New ideas get added in this same voteable format as they come up.*
