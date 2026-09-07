# Absolute Best — Business Plan

| | |
| --- | --- |
| **Version** | 1.0 |
| **Date** | 2026-09-07 |
| **Prepared for** | Zoltán Lovas |
| **Status** | **APPROVED** by Lovas Zoltán, 2026-09-07 — see Section 13 |
| **Purpose** | Agree *what* we are building and *why*, before we agree *how* |

> **How to use this document.** Read it top to bottom. Anywhere you disagree, simply edit
> the text — it is a plain text file and you cannot break anything. The points that
> genuinely need a decision from you are collected in **Section 12**. When you are
> satisfied, fill in **Section 13** and we move on to the product specification.
>
> Unfamiliar word? See the [glossary](99-glossary.md).

---

## 1. The business in one paragraph

Absolute Best is a website where the public collectively decides where things belong on a
single, endless line running from strongly negative to strongly positive. Anyone may look;
registered users may vote. Each user gets exactly one vote per item, worth anywhere from
−10 to +10, and every vote is **added** to the item's total rather than averaged into it.
That sum is the item's coordinate on the line. The line itself is the interface: users pan
and zoom around it the way they pan and zoom around a map. We launch with films, because
everybody already has opinions about films, and expand to other categories once the voting
mechanic has proven itself.

**The pitch in one sentence:** *Imagine Google Maps, but instead of locations it maps
humanity's opinion on everything.*

---

## 2. The core idea, in plain words

Every review site you have ever used calculates an **average**. Ten people rate a film
8/10 and the film scores 8/10 — exactly the same as if ten thousand people had rated it
8/10. Averaging throws away the single most interesting fact: *how many people cared*.

Absolute Best does not average. It **adds**.

**Worked example** (placeholder items, not real titles):

| Item | Votes cast | Sum of votes | Position on the line |
| --- | --- | --- | --- |
| Sample Film Alpha | +10, +8, +5, −3 | **+20** | 20 units right of centre |
| Sample Film Beta | +9, +9 | **+18** | 18 units right of centre |
| Sample Film Gamma | +7, −7, +6, −6 | **0** | Dead centre |

Every registered user can only vote on one item only once, and that vote is final.
If a fifth person now votes −3 on Sample Film Alpha, the total becomes
+17 and the item visibly slides to the left. The world moves as new people vote.
Every item also gets a voted on counter that each time it gets voted on gets 1 point that moves it up on the y axis.

Three consequences fall out of this design, and they are the whole product:

1. **Two axes together separate popularity from opinion.** Left-to-right is the sum of
   every vote; bottom-to-top is how many people voted. The score alone is ambiguous — a
   large positive number could mean "adored" or merely "seen by everyone" — but read
   together with the height, the difference is obvious. High and far right means genuinely
   loved by many; low and far right means intensely loved by few; high and near the centre
   means famous and divisive.
2. **Zero becomes meaningful.** An item at zero with four votes is simply unknown. An item
   at zero with forty thousand votes is genuinely *divisive* — and that is a story no star
   rating can tell.
3. **There is no ceiling.** The line has no maximum, so nothing ever "maxes out" at five
   stars. There is always somewhere further right to go.

---

## 3. Why this is different, and why the difference matters

| | Traditional review sites | Absolute Best |
| --- | --- | --- |
| Score | Average, capped (e.g. 1–5 stars) | Sum, uncapped (−∞ to +∞) |
| Effect of one more vote | Dilutes toward the mean | Moves the item |
| Primary interface | Ranked lists and item pages | One continuous map |
| Categories | Siloed — films here, books there | One shared line for everything |
| Question answered | "Is this good?" | "Where does humanity place this?" |

The strategic bet is that **a map is shareable in a way a list is not**. A screenshot
showing where your country placed something versus where mine did is inherently
interesting. A ranked list is not.

---

## 4. Who this is for

| Audience | Why they arrive | Why they come *back* |
| --- | --- | --- |
| Casual opinion-havers | It is satisfying to physically move something | Quick Fire — rapid voting rounds |
| Film and culture enthusiasts | Their niche interests are visible, not buried | Watching the items they care about move |
| The competitively opinionated | Their vote visibly changes the world | Seeing where they disagree with everyone |
| Later: researchers, journalists, brands | A genuinely novel opinion dataset | Paid access to aggregate views |

**Honest assessment of the audience risk:** the first three groups only exist once there is
enough data for the line to look alive. This is the single largest risk in the plan and is
addressed in Section 9.
Idea: populate site with 100 random articles at start.

---

## 5. What we are deliberately NOT building

Recording these now prevents a great deal of wasted work later.

- **No "Top 100" or "Trending" pages.** Discovery happens through the map. Lists would
  quietly turn this into the very thing we are trying not to be.
- **No written reviews, comments or discussion threads at launch.** They carry a moderation
  burden out of all proportion to their value here, and the product's whole claim is that a
  position says more than a paragraph.
- **No paid voting power, ever.** The moment money can move the line, the line is
  worthless. This is not a phase-one decision; it is permanent.
- **No selling of personal data.** Demographic features sell *aggregate views*, never
  individual records. This is also a legal necessity — see Section 10.
- **No mobile app initially.** The website is built to work in a phone browser; a native , although thinking on phone users there could be a fullscreen view mode
  app is a Stage 4 question at the earliest.
- **No advertising.** It would compromise both the visual language and the credibility.

---

## 6. The product in stages

Each stage has a goal, a definition of "done", and a test that tells us whether to
continue. The point of staging is that **we are allowed to stop or change direction after
any of them.**

### Stage 0 — Clickable prototype  *(this is what we do next)*

**Goal:** prove the interaction feels good before spending any money on infrastructure.

Runs entirely in your web browser. No server, no database, no real user accounts. All data
is invented placeholder data that resets when the page is refreshed.

What exists at the end:

- The intro screen and the animated entry into the world line
- The line itself: pan, zoom, items positioned by score, and items sharing a score fanning
  out vertically instead of overlapping
- Hovering an item shows an information card
- A pretend login, after which you can drag an item to vote and watch the total change
- Search that flies the camera to an item
- "Add an entry from a link", which invents a placeholder item and refuses duplicates
- Items drifting on their own, simulating other people voting

**The test:** show it to five people without explaining it. Do they start dragging things?
Do they keep going for more than two minutes?

**Cost:** development time only. No hosting, no subscriptions, no third-party accounts.

### Stage 1 — The real product, films only

**Goal:** the first version that real strangers can use.

Adds a real server and database, real accounts and passwords, votes that persist, real film
information, Quick Fire, and public hosting.

**The test:** 1,000 registered users and 25,000 votes cast. Are people returning weekly?

**Cost:** the first real money. Hosting, domain and database in the order of €30–80 per
month at this size, plus the one-off compliance work described in Section 10.

### Stage 2 — More categories, and history

**Goal:** prove the "map of everything" claim rather than merely asserting it.

Adds music, books, games, animals and so on; score history and movement over time
("fastest rising", "most divisive"); and shareable images of an item's position.

**The test:** do people vote across categories, or does everyone stay in films?

### Stage 3 — Supporter membership

**Goal:** first revenue.

Adds a paid tier (indicatively €4/month) for demographic views, historical timelines,
enhanced profiles, and "Opinion DNA" — a picture of your taste inferred from how you vote.

**The test:** does 2% or more of the active user base pay? Below that, the subscription
model does not work and Stage 4 becomes the priority instead.

### Stage 4 — Data platform

**Goal:** the revenue that would actually justify the effort.

Adds paid access to aggregate data for researchers, media and brands; embeddable widgets;
and possibly a native mobile application.

**Note:** Stages 3 and 4 are recorded here for direction only. We do not build for them yet.

---

## 7. How this makes money — later, not now

Monetisation is deliberately absent until Stage 3. Charging early, on a platform whose
entire value is participation, would suppress the participation that creates the value.

**Illustrative scenario only — this is arithmetic, not a forecast.** It assumes a €4/month
supporter tier and a 5% conversion rate, which is optimistic for a consumer product; 1–3%
is more typical.

| Stage | Registered users | Supporters at 5% | Monthly subscription revenue |
| --- | --- | --- | --- |
| Early | 10,000 | 500 | €2,000 |
| Growing | 100,000 | 5,000 | €20,000 |
| Established | 1,000,000 | 50,000 | €200,000 |

At a more realistic 2%, the "Growing" row becomes €8,000 per month. Data-platform, widget
and licensing revenue are excluded entirely from the table.

**The honest read:** subscriptions alone are unlikely to make this a business. They are
likely to make it self-sustaining. The Stage 4 dataset is where meaningful value would sit
— *if* enough votes are collected. Which is precisely why Stages 0–2 optimise for
participation and nothing else.

---

## 8. What this will cost

| Stage | Cash cost | Main cost driver |
| --- | --- | --- |
| Stage 0 | ~€0 | Your time only |
| Stage 1 | ~€30–80 / month | Hosting, database, domain |
| Stage 1 (one-off) | ~€0–2,500 | Privacy policy, terms of service, DPIA — Section 10 |
| Stage 2 | ~€80–300 / month | Traffic and storage growth |
| Stage 3+ | Scales with users | Payment processing fees, user support |

The largest non-obvious cost is **moderation**. If anyone can add anything, somebody must
deal with what they add. Section 9 treats this as a risk; from Stage 2 onward it becomes a
running cost, whether measured in your hours or somebody's salary.

---

## 9. Risks, and what we do about them

| # | Risk | Severity | Mitigation |
| --- | --- | --- | --- |
| 1 | **Cold start.** An empty map is boring, boring maps attract no votes, and no votes keeps the map empty. | **Critical** | Seed several hundred items before opening. Make Quick Fire the default landing action so a new visitor has voted within ten seconds. Consider a private beta so the map is already populated at public launch. |
| 2 | **Vote manipulation.** Fan groups or bots inflate an item. Because scores are sums, a coordinated group has unlimited upside. | **High** | Email-verified accounts; rate limits; anomaly detection on sudden score jumps; retain full vote history so manipulation can be reversed. Accept that perfect defence is impossible and design the product to survive imperfection. |
| 3 | **Harmful content.** "Anyone can add anything" guarantees that somebody eventually adds something illegal, hateful, or targeting a private individual. | **High** | Publish a content policy before launch. Require login to add. Provide a report button from day one. Prohibit entries about private individuals outright. Queue new entries for review during the early period, while volume is low enough to allow it. |
| 4 | **Voting on real people.** A named living person sitting at −40,000 on a public chart is a defamation and harassment risk, and a personal-data question under GDPR. | **High** | **Recommendation: exclude living people as a category until Stage 2 at the earliest, and take legal advice before enabling it.** See Section 10. | Voting on real people is only allowed when said people have wikipedia page, e.g. historical or media person.
| 5 | **Nobody comes.** The most likely outcome for any new consumer platform. | **High** | Stage 0 costs only time. The stage gates exist so that we find out cheaply. |
| 6 | **Popularity swamps quality.** Because scores add, the right-hand end fills with whatever is merely famous. | **Medium** | Arguably correct behaviour rather than a defect — but the second axis (number of voters) and a "most divisive" view must exist so the map can be read in more than one way. |
| 7 | **Performance.** A map holding hundreds of thousands of items must still pan smoothly. | **Medium** | Only ever draw the visible region. Designed in from Stage 0, not retrofitted later. | give suggestion  for visible range, my idea is: highest score/2
| 8 | **Regulatory.** GDPR, the Digital Services Act and consent rules all apply to this product. | **Medium–High** | Section 10. Addressed at Stage 1, designed for at Stage 0. |
| 9 | **Key-person dependency.** One person understands and maintains everything. | **Medium** | Plain-language documentation (these files), source code on GitHub, and no undocumented manual steps. |

---

## 10. Legal and compliance position (EU / Hungary)

> **This is not legal advice.** It is a list of the questions a lawyer will ask, recorded
> now so that the product is not accidentally built in a way that makes compliance
> impossible later.

None of this applies to Stage 0, which stores no real personal data. All of it applies
before Stage 1 becomes publicly available.

### GDPR

- **Lawful basis.** Accounts and votes can rest on contract — providing the service the
  user signed up for. Optional demographic fields should rest on explicit, separately given
  consent, and must be refusable without losing access to the service.
- **Data minimisation.** Collect a username, an email address and a password, and nothing
  further that is not strictly required. Age should be collected as a *bracket* (18–24,
  25–34, …) rather than a date of birth; country rather than address. This is both a legal
  requirement and good product design.
- **Special category data — the important one.** Voting patterns on political figures,
  historical events or religious topics may amount to inferred data about political
  opinions or religious beliefs, which Article 9 protects specially. Combined with the
  proposed "Opinion DNA" profiling feature, this is the sharpest legal edge in the entire
  concept. Two practical consequences follow:
  - It strengthens the recommendation in Risk 4 to keep people and politics out of scope
    early.
  - A **Data Protection Impact Assessment will very likely be required** before Stage 3,
    because Opinion DNA constitutes large-scale profiling.
- **Individual rights.** Users must be able to view their data, export it, and delete their
  account. Deleting an account must sever the link between the person and their votes.
  Decide now whether the votes themselves survive in anonymised form — technically they
  should, since otherwise every deletion silently rewrites history — but whichever is
  chosen must be disclosed in the privacy notice.
- **Aggregate views need a minimum-sample threshold.** If only three users from a given
  country voted on an item, showing "your country's view" identifies them. A floor of
  20–50 users per aggregate cell is the standard defence.
- **Hosting location.** Prefer EU-hosted infrastructure, which avoids international
  transfer paperwork entirely.

### Digital Services Act

Absolute Best hosts user-generated content and therefore falls within the DSA. Before
public launch it needs clear terms of service, a working notice-and-action mechanism (the
report button from Risk 3), a stated complaints route, and a designated point of contact.
These obligations are light at small scale, but they are not optional.

### Other

- **Cookies and consent.** Login sessions are strictly necessary and require no consent
  banner. Analytics tooling does — which is a good reason to prefer privacy-first,
  cookie-free analytics.
- **Terms of service and content policy.** Required before Stage 1. Should state
  explicitly who owns the vote data.
- **Accessibility.** A map-based interface is difficult for keyboard and screen-reader
  users. Should this ever be offered to public-sector customers, EN 301 549 conformance
  becomes mandatory. Keyboard navigation should be designed in from Stage 1 rather than
  bolted on afterwards.
- **Licence.** The repository currently has no licence. See Section 12.

---

## 11. Third-party services — each requires compliance review before real use

Every external service below must be reviewed for data-protection and procurement
implications **before** it processes any real user data. None of them are used in Stage 0.

| Service | Purpose | Stage | Review required |
| --- | --- | --- | --- |
| Wikipedia / Wikidata API | Item titles, images, descriptions | 1 | Licence and attribution terms; no personal data involved; **mocked in Stage 0** |
| Hosting provider | Running the website and server | 1 | EU region; data processing agreement |
| Managed database provider | Storing users and votes | 1 | EU region; data processing agreement; backup and encryption terms |
| Email delivery service | Verification and password resets | 1 | Processes email addresses — data processing agreement required |
| Error monitoring | Diagnosing faults | 1 | Must be configured to strip personal data |
| Analytics | Understanding usage | 1–2 | Prefer a cookie-free, EU-hosted option to avoid consent banners |
| Payment processor | Supporter subscriptions | 3 | PCI-DSS scope; handles financial data |
| GitHub | Source code hosting | 0 | Public or private repository — see Section 12. No personal data in the repository. |

**Stage 0 uses none of these except GitHub**, and deliberately mocks the Wikipedia
integration so that no external service is contacted while the prototype is being built.

---

## 12. Open decisions — your answers needed

Tick a box, or write your own answer beside it. These change what gets built, so the
product specification cannot be written until they are settled.

**D1 — Which name are we going with?**

- [x] Absolute Best — *"Not rated. Positioned."*
- [ ] Opinion Atlas — *"Where opinions become coordinates."*
- [ ] Other: `________________________`
- [ ] Decide later; use "Absolute Best" as the working title

**D2 — Is Stage 0 (prototype only, no server, fake data) the correct next step?**

- [x] Yes — build the prototype, then reassess
- [ ] No — go straight to Stage 1 with a real server and database
- [ ] Other: `________________________`

**D3 — Should voting on real living people ever be allowed?**
*My recommendation: not before Stage 2, and not without legal advice — see Risk 4.*

- [ ] Agreed — excluded for now
- [ ] Allow it, but only for public figures
- [ ] Allow it from the start
- [x] Other: `Only people with wikipedia entry`

**D4 — Should the GitHub repository be public or private?**
*My recommendation: private until Stage 1. A public repository invites people to copy an
unproven idea and gains you nothing at this stage.*

- [ ] Private
- [x] Public
- [ ] Public, with an open-source licence: `________________________`

**D5 — What is the realistic time budget?**

- [x] A few hours a week — a hobby, no deadline
- [ ] Roughly one day a week
- [ ] Substantial time — this is a serious attempt
- [ ] Other: `________________________`

**D6 — Are you willing to spend money at Stage 1?**

- [ ] Yes, up to roughly €`______` per month
- [x] Only if Stage 0 convinces me
- [ ] No — it must stay free to run

**D7 — Is the interface in English, Hungarian, or both?**

- [x] English only
- [ ] Hungarian only
- [ ] Both from the start
- [ ] English first, Hungarian later

**D8 — What does "success" mean to you personally?**
*This genuinely changes the technical decisions — a learning project and a startup are
built differently.*

- [ ] Learning to build software properly; the product is the excuse
- [x] A real product with real users; income optional
- [ ] A business that makes money
- [ ] Other: `________________________`

---

## 13. Approval

Complete this section when you are satisfied with the plan above. Nothing further will be
built until it is filled in.

- **Approved by:** `Lovas Zoltán`
- **Date:** `2026.09.07.`
- **Approved with the following changes:**

```
i did wrote a few changes, but i don't know where :(, also extra idea we need filters!)
```

**What happens next, once this is approved:**

1. I write `01-product-spec.md` — exactly what the Stage 0 prototype does, screen by screen
   and interaction by interaction, still in plain language, for you to approve.
2. I write `02-technical-plan.md` — how it is built, which files exist and why. Technical,
   but with a plain-language summary at the top.
3. I write `03-build-checklist.md` — the ordered list of build steps, so that progress is
   visible at any moment.
4. Only then does any code get written.

---

## 14. Notes added after approval

Approval is not reopened by anything here. These are the loose ends from your own margin
notes, recorded so they are neither lost nor silently acted upon.

### 14.1 Where your other notes went

| Your note | Where it now lives |
| --- | --- |
| Vote once, vote is final | Section 2, and rules R1–R3 in the [product spec](01-product-spec.md) |
| Vote counter moves the item up the Y axis | Section 2, and the axes table in the product spec |
| "Populate site with 100 random articles at start" | [Product spec §7.3](01-product-spec.md) |
| "Fullscreen view mode" for phone users | [Product spec §7.2](01-product-spec.md) |
| "Only people with wikipedia entry" (D3) | Section 14.3 below |
| "Give suggestion for visible range" (Risk 7) | [Product spec §2](01-product-spec.md) — answered |
| "We need filters!" | [Product spec §6, question Q6](01-product-spec.md) — awaiting your choice |
| Google AdSense (Section 5) | **Withdrawn by you, 2026-09-07.** The note is removed and "No advertising" stands unqualified. |
| "We need filters!" — automatic tagging idea | [Tagging and filters](04-tagging-and-filters.md) |

### 14.3 D3 — "Only people with wikipedia entry"

**Recorded, and it changes nothing before Stage 1** — Stage 0 contains no real people at
all, only placeholder items.

It is a better rule than it may look: "has a Wikipedia article" is objective, checkable,
and roughly tracks the legal notion of a public figure, which is precisely the line that
matters. It also fits the plan's existing Wikipedia integration, so it can be enforced
automatically rather than by judgement.

Two things it does **not** resolve, both restated from Risk 4 and Section 10 rather than
argued again:

- A living person with a Wikipedia article sitting at −40,000 on a public chart remains a
  defamation and harassment exposure. Being a public figure lowers that risk; it does not
  remove it.
- Their score is still personal data under GDPR, and voting patterns on political or
  religious figures can amount to inferred special-category data.

**Recommendation, unchanged: take legal advice before Stage 1 goes public**, and consider
excluding living people while still allowing historical ones — a distinction Wikipedia
records, so it is equally automatic to enforce.
