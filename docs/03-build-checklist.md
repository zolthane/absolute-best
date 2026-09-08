# Build Checklist — Stage 0

| | |
| --- | --- |
| **Version** | 1.0 |
| **Date** | 2026-09-07 |
| **Status** | **APPROVED** by Lovas Zoltán, 2026-09-08 |
| **Covers** | Stage 0 only — the clickable prototype. No server, no database, no real accounts. |
| **Based on** | [Business plan](00-business-plan.md) v1.0 (approved) · [Product spec](01-product-spec.md) · [Tech stack](02-tech-stack.md) v1.0 |

> **How this works.** Thirteen batches. Each is sized to be finished in **one sitting of
> two to four hours**, because your time budget (D5) is a few hours a week. Each one ends
> with a **manual test guide** — a numbered list you follow yourself to confirm it works.
>
> After each batch I stop. You test, you say continue or fix. Nothing runs ahead.
>
> Tick the boxes as we go. This file is the progress tracker.

---

## The plan at a glance

| # | Batch | Hours | What you will be able to do at the end | Done |
| --- | --- | --- | --- | --- |
| 0 | Project skeleton | 2–3 | Run `npm test` and `npm run dev` | [ ] |
| 1 | The axis and the camera | 4–5 | Drag and zoom around an empty world line | [ ] |
| 2 | Items on the line | 2–3 | See a cloud of placeholder items | [ ] |
| 3 | Grid sampling | 3–4 | Zoom out to a stable overview; zoom in for detail | [ ] |
| 4 | Entry view | 1–2 | Arrive and see the whole world, fitted | [ ] |
| 5 | Item cards and focusing | 3–4 | Click an item; the camera glides to it and shows a card | [ ] |
| 6 | Mock login | 2–3 | Log in; items turn blue; refresh keeps you logged in | [ ] |
| 7 | Drag to vote | 3–4 | Drag, preview, Submit — the item moves and locks | [ ] |
| 8 | Search | 2 | Type a name; fly to it | [ ] |
| 9 | Add an entry from a link | 2 | Paste a link twice; the second is refused as a duplicate | [ ] |
| 10 | The living world | 2 | Watch items drift as fake people vote | [ ] |
| 11 | Intro screen | 2–3 | The full first-run experience | [ ] |
| 12 | End-to-end tests and polish | 3–4 | One command proves the whole journey works | [ ] |

**Total: roughly 32–42 hours.** At a few hours a week, expect **two to three months**. There
is no deadline (D5) and the order is designed so that the riskiest question — *does dragging
things feel good?* — is answered by **batch 7**, about halfway.

---

## One correction to the tech stack document

The stack document said "set up the full stack from day one so nothing needs migrating".
That was half right, and I am narrowing it:

- **Set up the workspace structure now** (`apps/web`, `packages/shared`). Retrofitting a
  workspace around an existing app later is genuinely annoying.
- **Do not create `apps/api` yet.** It would sit empty for twelve batches. Adding a second
  workspace later takes about five minutes, so building it now would be exactly the
  speculative scaffolding `CLAUDE.md` §2 forbids.

---

## Batch 0 — Project skeleton

**Goal:** a working, empty project with the tooling that keeps everything else honest.

**Build**

- [ ] npm workspaces: `apps/web`, `packages/shared`
- [ ] Vite + React 19 + TypeScript in `apps/web`
- [ ] Tailwind CSS 4
- [ ] Biome for linting and formatting
- [ ] Vitest, with one trivial test to prove it runs
- [ ] GitHub Actions: typecheck, lint and test on every push
- [ ] `README.md` updated with how to run it

**Tests written:** one placeholder test. The real point is proving the machinery works.

**Manual test guide**

1. Open a terminal in the project folder.
2. Run `npm install`. It should finish without red errors.
3. Run `npm test`. You should see one passing test.
4. Run `npm run dev`. It prints a web address, usually `http://localhost:5173`.
5. Open that address. You should see a plain page saying "Teeter".
6. Change the text in `apps/web/src/App.tsx`, save, and watch the browser update by itself
   within a second.
7. Push to GitHub. On github.com, the **Actions** tab should show a green tick.

**Done when:** all seven steps work.

---

## Batch 1 — The axis and the camera

**Goal:** an empty world you can move around in. This is the foundation everything else
sits on, and its maths is where map bugs hide.

**Build**

- [ ] Pure functions `worldToScreen` and `screenToWorld` in `packages/shared`
- [ ] The black horizontal X axis, with 0 marked at the centre
- [ ] **0 drawn as a small fulcrum triangle** beneath the axis (W1)
- [ ] Tick marks and number labels that stay readable at any zoom
- [ ] Pan: drag the background
- [ ] Zoom: centred on the pointer, not the screen centre
- [ ] **Pointer Events throughout — one code path for mouse, touch and pen (S1)**
- [ ] **Pinch-to-zoom, and a tap distinguished from a drag (S1)**
- [ ] Camera state in Zustand, applied outside React so panning stays smooth

**Tests written** — this batch gets the heaviest testing in the project:

- Converting a world position to screen and back returns the original number
- Zooming keeps the point under the cursor exactly where it was
- Panning by a known distance moves the camera by exactly that distance
- Extreme zoom levels do not produce nonsense numbers

**Manual test guide**

1. Run `npm run dev` and open the page.
2. You should see a black horizontal line with **0** in the middle and numbers along it.
3. Drag the background left and right. The line should follow your mouse exactly — not
   faster, not slower.
4. Scroll the wheel to zoom in. **Watch the number directly under your cursor: it must stay
   under your cursor.** This is the single most common thing to get wrong.
5. Zoom far out, then far in. Numbers should stay readable and sensibly spaced.
6. Open the browser console (F12). Pan and zoom for ten seconds. **There must be no red
   errors.**
7. Drag continuously in circles. Movement should feel smooth, with no stutter.
8. Check that **0 is drawn as a small triangle** beneath the line, like a seesaw pivot.
9. **On a phone** (open the same address on your phone, on the same wi-fi): drag with one
   finger to pan, pinch with two to zoom. A quick tap should not be mistaken for a drag, and
   the page itself should not scroll while you pan.

**Done when:** steps 4, 6 and 9 pass. They are the ones that matter.

---

## Batch 2 — Items on the line

**Goal:** see the world populated.

**Build**

- [ ] ~200 placeholder items ("Sample Film Alpha" and similar, never real titles) with a
      score and a voter count
- [ ] Logarithmic Y scale as a pure function
- [ ] Draw each item as a dot at its score and voter count
- [ ] Draw only items inside the visible area

**Tests written**

- The log scale maps 1, 10, 100 and 1,000 voters to evenly spaced heights
- Zero and one voter do not produce an error or an infinite value
- The visible-range filter includes items just off-screen and excludes distant ones

**Manual test guide**

1. Reload the page. You should see roughly 200 dots scattered above the axis.
2. Dots further right should have higher scores; dots higher up should have more voters.
3. Pan sideways. Dots should scroll with the axis and stay locked to their positions.
4. Zoom out until everything fits. The spread should look like a cloud, not a single line.
5. Console open, pan and zoom for ten seconds. No red errors.

**Done when:** items sit in believable places and nothing errors.

---

## Batch 3 — Grid sampling

**Goal:** the world stays fast and readable no matter how many items exist. **This is the
most bug-prone batch**, so it gets the most tests.

**Build**

- [ ] Pure function: given the viewport and the items, return one representative per
      ~40×40 pixel cell
- [ ] Representative = most-voted in the cell, ties broken by oldest
- [ ] Dot size and darkness reflect how many items the cell stands for
- [ ] Names shown only when a dot is alone in its cell
- [ ] Temporarily raise the mock data to ~5,000 items to prove it holds up

**Tests written**

- Never returns more than one item per cell
- The same viewport always returns the same items — **the stability guarantee**
- Panning by less than one cell does not change the selection
- Zooming in returns strictly more items
- An empty region returns nothing rather than erroring

**Manual test guide**

1. Reload. Zoom right out.
2. Count roughly — you should see a few hundred dots, not five thousand.
3. **Pan slowly, a few pixels at a time. Dots must NOT flicker, swap or reshuffle.** This is
   the whole point of the batch.
4. Refresh the page without moving. **The same dots should appear in the same places.**
5. Zoom into a dense area. More dots should appear as you go, smoothly.
6. Find a large dark dot, zoom into it, and confirm it resolves into several separate items.
7. Zoom in far enough that dots are alone — names should appear.
8. Pan and zoom hard for thirty seconds with the console open. No errors, no stutter.

**Done when:** steps 3 and 4 pass. If dots flicker, the batch is not finished.

---

## Batch 4 — Entry view

**Goal:** arriving shows the whole world.

**Build**

- [ ] Work out the extent of the data: lowest score, highest score, most voters
- [ ] Fit the camera to it with 5% padding
- [ ] Fall back to −100…+100 when there is no data

**Tests written**

- The fitted camera includes the lowest and highest items
- Empty data produces the fallback range rather than an error
- All items at the same score does not produce a zero-width view

**Manual test guide**

1. Reload. Without touching anything, the entire cloud should be visible with a small margin.
2. The leftmost and rightmost items should both be on screen, not clipped.
3. Temporarily empty the mock data file and reload — you should see an axis from −100 to
   +100, not a blank page or an error. Put the data back.

**Done when:** the first thing you see is the whole world.

---

## Batch 5 — Item cards and focusing

**Goal:** items become things you can inspect.

**Build**

- [ ] Install shadcn/ui and bring in the components needed
- [ ] Card showing name, placeholder image, score, voter count and invented tags
- [ ] Hover shows the card; click focuses the item
- [ ] Focusing animates the camera to centre the item and zooms so ~20 neighbours show
      either side
- [ ] Camera position written into the web address

**Tests written**

- The focus calculation centres the chosen item
- The resulting zoom includes roughly 20 neighbours each side
- Reading a camera position back out of the web address restores the same view

**Manual test guide**

1. Hover over a dot. A card should appear with a name, score and voter count.
2. Move away. The card should disappear.
3. Click a dot. The camera should **glide** to centre it — not jump.
4. Count the visible neighbours: roughly 20 either side.
5. Look at the browser address bar — it should have changed.
6. Copy that address, open a new tab, paste it. **The same view should load.**
7. Click several items in a row. Each animation should complete cleanly without jerking.

**Done when:** step 3 feels smooth and step 6 works.

---

## Batch 6 — Mock login

**Goal:** the difference between a visitor and a member becomes visible. **No real
passwords, no real accounts** — this is a pretend session stored in your own browser.

**Build**

- [ ] Login and Register dialogs that accept a username and nothing more
- [ ] Session kept in `localStorage`
- [ ] Top bar: simulated "people on site" counter, and Login/Register or your username
- [ ] Colours: **blue** = votable, **grey/black** = locked (rules R10, R11)
- [ ] Logged out means every item is locked

**Tests written**

- Logging in stores a session; logging out removes it
- Item colour follows login state and whether the user has voted

**Manual test guide**

1. Reload while logged out. **Every dot should be grey.**
2. The top right should offer Login and Register.
3. Register with any username. The top right should show your name.
4. **Every dot should now be blue.**
5. Refresh the page. You should still be logged in and the dots still blue.
6. Log out. Dots should return to grey.
7. Open the site in a private browsing window — you should be logged out there.

**Done when:** the colour flips correctly and survives a refresh.

---

## Batch 7 — Drag to vote

**Goal:** the heart of the product. **After this batch you can show it to people.**

**Build**

- [ ] Drag a focused item left or right, snapping to whole points, limited to ±10
- [ ] Live preview of the projected new total while dragging
- [ ] Release does **not** vote — a Submit button appears (rule R9)
- [ ] Re-dragging before Submit is free and unlimited
- [ ] Submit warns that it cannot be undone
- [ ] On submit: score changes by the vote, voter count rises by one, item locks and turns
      grey
- [ ] Logged-out visitors cannot drag at all
- [ ] **Works by touch as well as mouse (S1)** — drag and Submit on a phone
- [ ] **Weighted settle (W2):** the item springs to its new position, overshooting slightly,
      with the overshoot shrinking as voter count rises. **Keep it very subtle** — your
      answer to W2 was "yes, but subtle"
- [ ] **Honour `prefers-reduced-motion`** — move directly, with no spring, when it is set

**Tests written** — the core promise of the product, so tested hard:

- A vote of +7 on a +20 item produces +27
- Voter count rises by exactly one per vote
- Votes outside −10…+10 are rejected
- Half-points are impossible
- A locked item refuses a second vote
- Dragging without submitting changes nothing at all
- A logged-out user cannot vote

**Manual test guide**

1. Log in. Click an item to focus it. It should be blue.
2. Drag it slowly to the right. It should move in **whole steps**, not smoothly.
3. Watch the preview number change as you drag.
4. Try to drag more than 10 points right. **It should stop at exactly +10.** Same going left.
5. Let go. **The vote must NOT be cast.** A Submit button should appear.
6. Drag again, somewhere different. Still not cast. Do this three or four times.
7. Press Submit. The item should move to its new total and **turn grey**.
8. Try to drag it again. **Nothing should happen.**
9. Check the voter count on its card — it should have risen by exactly one.
10. Log out and try to drag any item. Nothing should move.

**Done when:** steps 5, 7 and 8 all behave. **Then stop and show it to five people.**

---

## Batch 8 — Search

- [ ] Search box in the top bar
- [ ] Forgiving matching over item names
- [ ] Choosing a result focuses that item, reusing batch 5

**Tests written:** partial words match; capitals do not matter; nonsense returns nothing
rather than erroring.

**Manual test guide**

1. Type `alpha` into the search box. Matching items should appear as you type.
2. Type `ALPHA`. The same results.
3. Type `alp`. Still finds it.
4. Type `zzzzz`. A polite "nothing found", not a blank box or an error.
5. Click a result. The camera should fly to it and open its card.

---

## Batch 9 — Add an entry from a link

- [ ] "New entry" button, visible only when logged in
- [ ] Paste-a-link dialog
- [ ] Mock resolver turning a link into a title, image and identifier — **the same link
      always produces the same result**
- [ ] Duplicate detection: an existing identifier shows the existing item instead of
      creating a second one
- [ ] **No external service is contacted.** Wikidata comes at Stage 1

**Tests written:** the resolver is deterministic; duplicates are detected; a new item lands
at score 0 with 0 voters.

**Manual test guide**

1. Log out — the New entry button should be hidden. Log back in.
2. Paste any web address and confirm. A new item should appear at score 0.
3. Paste **the same address again**. It should show you the existing item, **not** create a
   second one.
4. Paste a different address. A different item appears.
5. Find your new item on the map — it should sit at 0 with no voters.

---

## Batch 10 — The living world

- [ ] A timer that gently changes scores and voter counts, imitating other people voting
- [ ] Items animate to their new positions rather than jumping, reusing the **weighted
      settle** from batch 7 (W2) — heavily-voted items barely stir, obscure ones swing
- [ ] The "people on site" counter drifts realistically

**Tests written:** the simulation stays within sensible bounds and can be stopped cleanly
(a stopped timer that keeps running is the classic bug here).

**Manual test guide**

1. Load the page and simply watch for a minute. Items should drift slightly.
2. Movement should be **smooth**, never teleporting.
3. The people counter should change occasionally.
4. **Leave the page open for five minutes with the console visible. No errors, no slowdown.**
5. Focus an item and vote while the simulation runs. Your vote must not be lost or
   overwritten.

---

## Batch 11 — Intro screen

Deliberately late: it is presentation, and the risky parts came first.

- [ ] Centred "Teeter" logo with the tagline *"Tip the scales."* (business plan §14.4)
- [ ] **The wordmark balances on a pivot and rocks gently (W3)**
- [ ] Start button
- [ ] Animated transition: the logo shrinks away as the axis draws itself in
- [ ] **A "?" button that reopens this explanation from the map (S2)** — for everyone who
      clicks straight past the intro
- [ ] **Seesaw loading indicator (W3)**
- [ ] ~~Feedback `mailto:` link~~ — **deferred**: S2 asked for one, but S3 chose to wait for
      a domain, so there is no address yet. Add it the moment there is one

> **No feedback link ships in Stage 0.** That is a consequence of S2 and S3 together, not an
> oversight. Testers give feedback to you directly.

**Manual test guide**

1. Reload. The intro screen should appear first.
2. Taglines should fade in and out every few seconds without jumping.
3. Press Start. The transition should be smooth and take under two seconds.
4. Reload again and press Start immediately, before the animation settles. Nothing should
   break.
5. Make the browser window very narrow, then very wide. The layout should hold together.

---

## Batch 12 — End-to-end tests and polish

- [ ] Playwright installed
- [ ] One test covering the whole journey: arrive → Start → pan → zoom → register → focus an
      item → drag → Submit → confirm the score changed → search → confirm the camera moved
- [ ] Tests for the two rules easiest to break by accident: a locked item cannot be voted on
      twice, and a logged-out visitor cannot vote
- [ ] End-to-end tests added to GitHub Actions
- [ ] Fix whatever they find

**Manual test guide**

1. Run `npm run test:e2e`. A browser should open, drive itself, and finish green.
2. Run `npm test`. Everything green.
3. Push to GitHub. The Actions tab should go green.
4. Open the site on your phone, on the same network. It need not be perfect, but it should
   not be broken.

---

## The Stage 0 gate

With batch 12 finished, Stage 0 is complete. Before anything else is built, the business
plan's test applies:

> **Show it to five people without explaining it. Do they start dragging things? Do they
> keep going for more than two minutes?**

| Result | What happens next |
| --- | --- |
| **They drag and keep going** | Proceed to Stage 1. I write the detailed checklist for it. |
| **They drag but lose interest** | The mechanic works, the world is too thin. Add items and Quick Fire before anything else. |
| **They do not understand it** | Stop and rework the first thirty seconds. Do not build a backend on top of an interaction nobody grasps. |

**Nothing beyond this point is planned in detail yet, deliberately** — the gate might change
what comes next.

---

## Stage 1 — outline only

Not to be built without your say-so, and not planned in detail until Stage 0 has passed its
gate.

| # | Batch | Adds |
| --- | --- | --- |
| 13 | Database | PostgreSQL in Docker, Prisma schema, placeholder data |
| 14 | Backend | `apps/api` created, Fastify REST endpoints, API documentation page |
| 15 | Real accounts | Better Auth, email verification |
| 16 | Real votes | Votes stored, one-per-user enforced by the database |
| 17 | Real content | Wikipedia and Wikidata, tagging ([doc 04](04-tagging-and-filters.md)) |
| 18 | Quick Fire | The rapid voting mode |
| 19 | Deployment | EU hosting, privacy policy, terms, the compliance work in business plan §10 |

---

## Approval

- **Approved by:** `Lovas Zoltán`
- **Date:** `2026.09.07.`
- **Approved with the following changes:**

```
(write anything you want changed here)
```

**Once approved:** batch 0 gets built, and nothing beyond it until you have tested it.
