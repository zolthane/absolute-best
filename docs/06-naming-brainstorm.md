# Naming brainstorm

A running log of name and tagline ideas, kept while we decide whether "Teeter" stays.
Unlike the other documents in this folder, this one is never "approved" — it just grows
every time a new idea comes up, until the rebrand question is settled one way or the other.

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
picture it was never going to match. Revisit if a stronger alternative shows up here.

**If a rebrand ever does happen:** it's a real, multi-document effort, not a quick
find-replace. "Teeter" and "Tip the scales" are written into `00-business-plan.md`,
`01-product-spec.md`, `03-build-checklist.md`, `05-supporting-features.md`, and this
folder's own `README.md`.

---

## Candidate names

| Name | The idea behind it |
| --- | --- |
| Groundswell | A real term for a mass of opinion building up from below — matches the "many small opinions accumulating into something visible" mechanic, and happens to match the growth-shaped visual too. |
| Confluence | Many separate currents converging into one visible shape. |
| Canopy | Closest match to the "tree" reading specifically — established consensus as the canopy, niche takes as scattered undergrowth below it. |
| Throughline | Softer and more abstract — less tied to any one specific visual, more about the thread connecting many opinions. |
| Common Ground | Plain-spoken, tells you what the product is for without needing a visual metaphor at all. |
| The Consensus | Blunt and literal — says exactly what the map is showing. |
| Undercurrent | Quieter framing — opinion building beneath the surface before it's visible. |
| Weigh In | A tagline-shaped name — literally what casting a vote is. |
| Ground Truth | Double meaning: the "true" state of consensus, plus an echo of the earth/growth imagery. |
| Sprout | Short, plain version of the tree/growth reading. |
| Verdict | Blunt like "The Consensus," but with a courtroom/judgment flavor rather than a geological one. |
| The Tally | Plain-spoken, count-based — no metaphor to explain at all. |

## Candidate taglines

| Tagline | Pairs with |
| --- | --- |
| "Find your level" | Keeping "Teeter" — still balance-flavored, but about settling rather than a literal two-sided tip. |
| "Where opinions take root" | A tree/growth-named rebrand (e.g. Canopy). |
| "Watch consensus grow" | Any growth-themed rebrand. |
| "See what the world settles on" | Works with either "Teeter" or a rebrand — doesn't depend on a specific visual metaphor. |

---

## Alternative concept: a gamified "race" (new, from Zoltán)

A different direction entirely from the tree/consensus framing above — worth keeping
open as its own branch of thinking rather than folding into the list above.

**Name:** *Race to the Most*

**Visual:** three parallel lanes — left, middle, right — each running toward a signpost:
**Most Hated**, **Most Controversial**, **Most Loved**. Items appear as racers on
whichever lane fits them, positioned along it by how extreme they are in that
direction, rather than scattered across one open 2D field the way the current map
works.

**What this would actually need, mechanically:** "most loved" and "most hated" already
fall out of score today, but "most controversial" doesn't — controversy is about how
*split* the votes are (lots of voters pulling hard in opposite directions), not the net
score. Right now the app only tracks a summed score and a voter count, nothing about
the spread of individual votes, so a genuinely controversial item and a mildly-liked
item with the same net score currently look identical. That's a real product-mechanics
gap worth remembering if this direction is ever pursued — not something to build now.

**Matching name variants**, same racing/competitive vibe:

| Name | Feel |
| --- | --- |
| Three Lanes | Plain description of the visual itself. |
| Photo Finish | The moment of comparison — who's ahead right now. |
| Pole Position | Being in the lead in whichever lane. |
| Neck and Neck | Emphasizes close competition rather than a runaway leader. |
| The Standings | Leaderboard-flavored, less literally about racing. |

**Taglines for this direction:**
- "Pick a lane."
- "Everyone's racing for a verdict."
- "Where opinions compete."

---

*Add new rows as ideas come up — nothing here needs to be finalized until you say so.*
