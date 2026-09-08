# Supporting Features — everything that is not the map

| | |
| --- | --- |
| **Version** | 0.1 — Draft |
| **Date** | 2026-09-08 |
| **Status** | **AWAITING YOUR APPROVAL** |
| **Purpose** | Catch what the other documents missed, before building starts |
| **Origin** | Your question: *"we are missing a lot of QoL options… is there anything else?"* |

> **Read Section 2 first.** It is the only part that changes what gets built now. Everything
> else is Stage 1 and beyond, recorded so it is planned rather than discovered.

---

## 1. What you raised — feedback and bug reporting

**Your instinct is right, and a single email address is the correct answer for now.** Three
things worth knowing before you pick one:

**Do not use your personal address.** You have just spent an afternoon removing a work email
from public view — a `mailto:` link on a public page is harvested by the same scrapers
within days. Use a dedicated address created for the project.

**One address serves two purposes.** From Stage 1, the Digital Services Act requires a
published point of contact anyway (business plan §10). The same address covers feedback,
bugs and legal notices.

**But keep three *kinds* of message separate**, because they have different urgency and
different legal weight:

| Kind | Stage 0 | Stage 1 |
| --- | --- | --- |
| General feedback / bug report | `mailto:` link in the corner | A small form — no address exposed, and it can capture which page and browser automatically |
| **Report this item** (illegal, abusive, wrong) | Not needed — no real content | **Required.** A button on every item. This is the DSA's notice-and-action mechanism, not an optional courtesy |
| Legal / data protection requests | — | Must reach a monitored inbox |

---

## 2. Affects Stage 0 — decide before batch 1

Only four items, and only the first is significant.

### 2.1 Touchscreen support — the real gap ⚠

**The build checklist assumes a mouse throughout.** Panning is a mouse drag, zooming is a
mouse wheel, and drag-to-vote is a mouse gesture. None of that works on a phone or tablet,
where you need pinch-to-zoom and where the browser must be told to distinguish a tap from a
drag from a scroll.

**Why it matters now:** the Stage 0 test is *"show it to five people without explaining it."*
Some of them will reach for a phone. If it does nothing on a phone, you learn nothing from
those people.

**Recommendation:** use the browser's **Pointer Events** from the very first batch. That is
a single code path handling mouse, touch and pen together — as opposed to writing mouse
handling now and a separate touch layer later, which is roughly twice the work and twice the
bugs.

| | Cost |
| --- | --- |
| Doing it in batch 1 | About **+1 hour**, and pinch-zoom added to the same batch |
| Retrofitting after batch 7 | Several hours, and it touches the camera, the drag, and every test |

**This is a proposed change to the approved build checklist** — batches 1 and 7 — so I am
not making it without your agreement. See decision **S1**.

### 2.2 A feedback link

A `mailto:` in the corner. **Ten minutes**, added to batch 11.

### 2.3 A "how does this work?" button

The intro screen (batch 11) explains the idea once. Anyone who clicks straight past it — and
people do — never sees it again, and those are exactly the people who will not understand
the map. A small **?** in the corner that reopens the explanation costs about **twenty
minutes** and directly serves the Stage 0 test.

### 2.4 Error and empty states

Minimal for a prototype. "Search found nothing" is already in batch 8. A proper crash page
and a 404 page can wait for Stage 1.

---

## 3. Stage 1 — legally required

Not optional, and not currently in any document unless noted.

| Item | Status in the plans | Note |
| --- | --- | --- |
| Privacy policy, terms of service, content policy | ✓ Business plan §10 | Already planned |
| **Imprint / *impresszum*** | ✗ **Missing** | Hungarian law requires an online service provider to publish identifying details. A legal requirement with no product design attached — but it must exist before launch |
| **"Delete my account"** | ✗ **Missing as a feature** | GDPR. Rule R8 anticipates the *consequence*, but nothing plans the button, the confirmation, or the anonymising job behind it |
| **"Export my data"** | ✗ **Missing** | GDPR right to data portability. A file containing the user's account details and their votes |
| **Minimum age** | ✗ **Missing** | GDPR Article 8; the threshold in Hungary is **16**. Needs a confirmation at registration and a clause in the terms |
| **Report this item** | Partly — business plan Risk 3 | Mentioned as a mitigation, never planned as a feature. DSA notice-and-action |
| Cookie consent | ✓ §10 | Only needed if analytics are added; login sessions alone need no banner |

---

## 4. Stage 1 — operationally required

### 4.1 Moderation tools — the single biggest gap

The business plan says **anyone can add anything**, and Risk 3 promises a report button and
review of new entries. **Nothing anywhere plans the tool that makes that possible.** Without
one, moderating means editing database rows by hand.

The minimum is genuinely small, but it is not nothing:

- A list of reported items, newest first
- Hide or delete an item, with a reason
- Suspend a user
- A record of who did what, and when

Estimate: **most of a batch.** It belongs in Stage 1, before the site is public — because
the day it becomes public is the day it is needed.

### 4.2 Backups

**Not mentioned in any document.** Managed database providers normally include automatic
backups, but two things must be confirmed rather than assumed: that they are actually
switched on, and that a restore has been *tested at least once*. The classic way to lose a
database is to discover the backups were never running.

### 4.3 Password reset and email verification

Better Auth provides both, but they need an email delivery service (business plan §11) and
the screens still have to be built. Roughly half a batch, easy to underestimate.

### 4.4 Rate limiting

Risk 2 names it as the defence against vote manipulation. Nothing plans it. It is a small
piece of configuration, but it needs to exist before the first coordinated voting campaign,
not after.

### 4.5 Monitoring

Business plan §11 lists error monitoring as a service to review. Nothing plans the work.
Also worth a simple uptime check, so you learn the site is down from a notification rather
than from a user.

---

## 5. Stage 1 — growth

### 5.1 Share previews — likely the best value in this document ⭐

**Not documented anywhere, and the growth strategy depends on it.**

The business plan's Section 18 says *"make every item's position and statistics easy to
share"*, and Section 3 argues the map is shareable in a way a list is not. But a link pasted
into a message, Slack, or social media shows nothing at all unless the page carries
**Open Graph tags** — the small pieces of metadata that turn a bare URL into a preview card
with a title, description and picture.

```
   WITHOUT Open Graph tags        WITH Open Graph tags
   ┌────────────────────────┐     ┌────────────────────────────┐
   │ absolutebest.com/i/482 │     │  [ image of the world line ]│
   └────────────────────────┘     │  Sample Film Alpha          │
                                  │  Score +20 · 1,204 voters   │
   Nobody clicks that.            │  absolutebest.com           │
                                  └────────────────────────────┘
```

Roughly **two hours** of work, and it multiplies the effect of every link anyone shares.
This is the highest return per hour anywhere in the plan.

### 5.2 A generated share image

The natural follow-on: an automatically drawn picture of the item sitting on the line, used
as the preview picture above. Stage 2 — but design the share preview in 5.1 so this can slot
into it.

### 5.3 Basic search-engine visibility

Sitemap, `robots.txt`, and a real title and description per item. A map-driven site is close
to invisible to search engines otherwise, because there are no pages to index.

### 5.4 Analytics

The business plan sets **numeric gates** — 1,000 registered users, 25,000 votes, 2% paying —
and nothing in any document measures them. At minimum: registrations, votes cast, and
returning visitors. Prefer a cookie-free, EU-hosted tool, which avoids a consent banner
entirely (§10).

---

## 6. Two decisions best taken early

These are cheap now and expensive later. Neither means building anything yet.

### 6.1 Keyboard and screen-reader access

Business plan §10 flags it; nothing plans it. A pannable map is one of the hardest things to
make accessible, and it is far cheaper to allow for now than to bolt on.

The minimum that would make it usable: arrow keys pan the camera, `Tab` moves between the
visible items, `Enter` focuses one, and the vote control is reachable without a mouse.

There is an apparent conflict with *"no lists"* — but a screen-reader-only list of visible
items is not a product feature competing with the map. It is the same information, offered
to someone who cannot see the map. It does not appear on screen for anyone else.

### 6.2 Language

D7 says English only, Hungarian later. Two honest options:

- **Hard-code English text wherever it is convenient.** Simplest now. Adding Hungarian later
  means hunting through every file — a genuine slog, but a one-off.
- **Keep user-facing text in one file from the start.** Near-zero extra effort — it is a
  habit, not a library or a framework — and it turns later translation into a translation
  job rather than a rewrite.

**Recommendation: the second, with no internationalisation library.** Adding a library now
would be speculative infrastructure of exactly the kind `CLAUDE.md` §2 rules out. Simply
keeping the words in one place is not.

---

## 7. Deliberately not adding

Considered and rejected, so they do not resurface as forgotten ideas:

- **Comments, reviews, discussion** — already excluded in business plan §5
- **Notifications and email digests** — real value, real moderation and consent burden. Stage 3 at the earliest
- **Social login ("sign in with Google")** — convenient, but another third-party processor, another compliance review, and Better Auth already avoids that entirely
- **Dark mode** — genuinely nice, genuinely not now
- **Offline / installable app** — no

---

## 8. Decisions

**S1 — Use Pointer Events and add pinch-to-zoom in batch 1?** *(Section 2.1. Recommended:
yes. About +1 hour now against several hours and a rewrite later — and without it, phone
users tell you nothing during the Stage 0 test.)*

- [x] Yes — amend batches 1 and 7 of the build checklist
- [ ] No — desktop only for Stage 0, accept the retrofit
- [ ] Other: `________________________`

**S2 — Add a feedback `mailto:` and a "?" help button to batch 11?** *(Sections 2.2, 2.3.
About 30 minutes together.)*

- [x] Yes to both *(recommended)*
- [ ] Feedback link only
- [ ] Neither

**S3 — Which email address for feedback?** *(Section 1. Not your personal one.)*

- [ ] A new free address created for the project, e.g. `absolutebest.feedback@…`
- [x] Wait until there is a domain, then `hello@…` *(recommended — but then Stage 0 has no feedback link)*
- [ ] Other: `________________________`

**S4 — Accept the Stage 1 additions in Sections 3, 4 and 5 as planned work?** They will be
detailed in the Stage 1 checklist, not now. *(Recommended: yes. Note this adds roughly two
batches to Stage 1 — mostly moderation tools and the legal pages.)*

- [x] Yes — record them as Stage 1 scope
- [ ] Yes, but drop: `________________________`
- [ ] Discuss first

**S5 — Keep user-facing text in one file from the start?** *(Section 6.2. Recommended: yes,
with no library.)*

- [x] Yes
- [ ] No — hard-code it, deal with Hungarian later

**S6 — Plan keyboard access into Stage 1?** *(Section 6.1. Recommended: yes — it is a
requirement if the product is ever offered to public-sector customers, and much cheaper
early.)*

- [x] Yes — Stage 1
- [ ] Later
- [ ] Not a priority

---

## 9. Approval

- **Approved by:** `_LZ__`
- **Date:** `_2026.09.08.__`
- **Approved with the following changes:**

```
(write anything you want changed here)
```

---

## 10. Achievements and leaderboards

*Added 2026-09-08. Approval above is not reopened; decisions E1–E3 below.*

Two different ideas that behave very differently. **One I would build. One I would not build
in the form suggested**, for a reason specific to how Teeter works.

### 10.1 ⚠ Why a "most votes cast" leaderboard would damage the product

Ranking users by how many votes they have cast rewards **volume**, and volume is the one
thing this product must not encourage. Three mechanisms, all concrete:

**It corrupts both axes at once.** Someone racing up a leaderboard clicks through Quick Fire
without thinking. Those votes scatter roughly at random, which pulls scores toward the
centre (the X axis) while inflating voter counts (the Y axis). Every item they touch becomes
noisier *and* falsely more popular.

**It hijacks the map itself.** Grid sampling shows **the most-voted item in each cell**
(§2, product spec). Inflate vote counts through spam and those items become the ones drawn
on the map. Volume-chasing would literally decide what everyone sees.

**And none of it can be undone.** Votes are permanent and unchangeable — rule R3. On a site
where people can revise their votes, a burst of careless voting corrects itself over time.
Here it is baked in forever, into the very dataset the business plan's Stage 4 intends to
sell.

There is also a softer objection. The business plan states that **equal voting is central to
the platform's credibility**. A volume leaderboard does not grant extra voting power, but it
does grant *status* for voting more — the same idea wearing a different hat.

### 10.2 ✅ What to reward instead

Reward things that **improve** the dataset rather than inflate it. Each of these is harder
to fake than raw volume, and each is more interesting to the user.

| Instead of… | Reward this | Why it works |
| --- | --- | --- |
| Votes cast | **Breadth** — "you have voted in 8 of 12 categories" | Encourages exploring the map, which is the point |
| Votes cast | **Contribution** — items you added, and how many votes *those* went on to receive | Self-policing: junk entries attract no votes, so they earn nothing |
| Votes cast | **Tastemaker** — you voted on something when it had 4 voters; it now has 40,000 | Rewards *judgement*, and is impossible to game by volume because it depends on other people agreeing later |
| Votes cast | **Streaks** — voting on some days, not many times in one day | Rewards coming back, which is what actually matters |

**The tastemaker one is the strongest.** It is retroactive, it cannot be farmed, it makes
early voting on obscure items feel valuable — which is exactly the behaviour that fixes the
cold-start problem (Risk 1) — and it produces a naturally shareable brag.

### 10.3 ✅ Achievements — yes, with one rule

Achievements are much safer than leaderboards: private by default, no ranking, no elite, and
no reason to spam if they are built around **variety and judgement rather than counts**.

Good: *"Voted in every category." "Added an item that reached 1,000 voters." "Backed five
items before they were popular." "Found something nobody had rated yet."*

Bad: *"Cast 1,000 votes."*

**The rule: no achievement may be earned by doing the same thing repeatedly.** If it can be
farmed, it will be, and §10.1 explains the damage.

### 10.4 If you still want a leaderboard

Defensible, provided it never ranks raw votes:

- **Rank contribution or tastemaking**, never volume
- **Time-boxed** — "this week", not all time. An all-time board is unreachable for anyone
  who joins later, so it demotivates the people you most need
- **Or show percentiles instead** — "top 15% of contributors this month" lets everyone see
  themselves, rather than crowning twenty people and ignoring everyone else
- **Opt-in.** A public leaderboard publishes a username alongside behavioural data. That is
  personal data on public display, and it needs consent rather than an assumption

> **One privacy trap.** A "most contrarian" ranking would publicly mark people whose votes
> oppose the consensus. On political or religious subjects that edges toward inferred
> special-category data under GDPR Article 9 — the same concern already flagged for Opinion
> DNA in business plan §10. Keep contrarian scores **private to the user**; they make a
> lovely personal insight and a poor public ranking.

### 10.5 When

**Nothing here is Stage 0** — all of it needs real accounts and real data.

| Stage | What |
| --- | --- |
| 2 | Achievements, breadth and contribution stats on the profile |
| 2 | Tastemaker detection (needs score history, which Stage 2 adds anyway) |
| 3 | Leaderboards, if wanted — sits naturally beside Opinion DNA |

**A note on scope.** Stage 1 and Stage 2 have grown considerably today: moderation tooling,
legal pages, share previews, keyboard access, and now engagement mechanics. None of it
touches Stage 0, and none of it is wrong — but Stage 2 is filling up, and at a few hours a
week that matters. Worth reviewing what Stage 2 must contain versus what it could, once
Stage 0 has passed its gate.

---

## 11. Decisions — engagement

**E1 — Achievements built around variety and judgement, never repetition?** *(10.3.
Recommended: yes, Stage 2.)*

- [ ] Yes — Stage 2
- [ ] Yes, but later than Stage 2
- [ ] Not interested

**E2 — Drop the "most votes cast" leaderboard in favour of contribution and tastemaker
measures?** *(10.1, 10.2. Recommended: yes — a volume leaderboard would corrupt both axes
and decide what the map displays.)*

- [ ] Agreed — never rank by raw votes cast
- [ ] I want a votes-cast leaderboard anyway
- [ ] Other: `________________________`

**E3 — Any public leaderboard at all?** *(10.4.)*

- [ ] Yes, but opt-in, time-boxed, and ranked on contribution or tastemaking *(recommended)*
- [ ] Percentiles only — no named ranking
- [ ] No leaderboards; achievements and private stats only
- [ ] Other: `________________________`
