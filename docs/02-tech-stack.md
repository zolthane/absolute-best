# Technology Stack — Recommendation

| | |
| --- | --- |
| **Version** | 0.1 — Draft |
| **Date** | 2026-09-07 |
| **Status** | **AWAITING YOUR APPROVAL** |
| **Purpose** | Agree which tools we build with, before any of them are installed |
| **Depends on** | [Business plan](00-business-plan.md) — decisions D2 and D8 are still open |

> Every version number below was looked up live from the npm registry today, not
> remembered. Plain-language explanations of the technical words are in the
> [glossary](99-glossary.md).

---

## 1. The whole stack on one page

| Layer | Choice | Version | What it does, in one sentence |
| --- | --- | --- | --- |
| **Language** | TypeScript | 7.0.2 | JavaScript that checks your work as you type |
| **Frontend framework** | React | 19.2.8 | Builds the interface out of reusable pieces |
| **Build tool** | Vite | 8.2.2 | Turns the code into a website, instantly |
| **Routing** | TanStack Router | 1.170.33 | Decides which screen shows for which web address |
| **Server data** | TanStack Query | 5.102.8 | Fetches and caches data from the backend |
| **Styling** | Tailwind CSS | 4.3.3 | Styling written directly in the markup |
| **Components** | shadcn/ui | (copied in) | Ready-made buttons, dialogs, inputs you own outright |
| **Client state** | Zustand | 5.0.15 | Remembers where the camera is pointing |
| **Backend framework** | Fastify | 5.12.3 | The program that answers the frontend's requests |
| **Frontend↔backend** | tRPC | 11.18.0 | Lets the frontend call the backend like a normal function |
| **Validation** | Zod | 4.5.4 | One definition of "valid data", shared by both sides |
| **Authentication** | Better Auth | 1.7.3 | Logins and sessions, self-hosted |
| **Database access** | Prisma | **7.10.0 — pin this** | Reads and writes the database using ordinary code |
| **Database** | PostgreSQL | 17 (via Docker) | Where users, items and votes actually live |
| **Unit tests** | Vitest | 5.0.0 | Fast tests for individual functions |
| **Browser tests** | Playwright | 1.63.0 | Drives a real browser to test panning, zooming, dragging |
| **Lint + format** | Biome | 2.5.12 | Keeps the code tidy and catches mistakes |
| **Package manager** | npm | 11.16.0 | Already installed |
| **Runtime** | Node.js | 24.18.0 | Already installed |

**Total cash cost to develop all of this locally: €0.** Everything above is free and
open-source, and runs on your own machine.

---

## 2. Review of your proposal

> *"I was thinking using React and a proper backend stack."*

**Verdict: correct on both counts.** React is the right choice for this product, and a real
backend is genuinely required rather than optional. Here is why, specifically:

**React is right because the graph is the product.** This is not a page with a chart on it;
it is an application where hundreds of items must appear, move and respond to the mouse
sixty times a second. React's model — describe what the screen should look like, let it
work out the minimum change — is exactly suited to that. It is also, bluntly, the most
employable and best-documented choice, which matters if part of the point is learning.

**A real backend is required, not optional, because of one specific thing: the sum.** Two
people voting on the same item at the same instant must not overwrite each other. Only a
proper database can guarantee that ("this user has exactly one vote on this item, and here
is the total") under concurrency. A frontend-only version cannot, and neither can a simple
file or spreadsheet. Everything else — accounts, search, history — could in principle be
faked. The vote arithmetic cannot.

**One refinement to your plan**, rather than a disagreement: set up the full stack from day
one, so nothing needs migrating later, but *build the world line first, against invented
data*. The reason is in the business plan — the riskiest question is "does dragging things
around actually feel good?", and that question is answered in the browser, not the
database. See Section 10.

---

## 3. Three things I recommend changing from the original PDF

The PDF specified a stack. I agree with most of it. These three I would change, and each
one is a real disagreement rather than a preference.

### 3.1 TypeScript instead of plain JavaScript

**The PDF says:** "Frontend: HTML, CSS, JavaScript, then React."

**I recommend TypeScript**, and this matters *more* for a non-programmer, not less.

In plain JavaScript, if you type `item.titel` instead of `item.title`, nothing happens
until a user hits that screen and sees a blank space. In TypeScript, the word turns red in
your editor immediately, before you even save. It is the difference between a spellchecker
and proofreading the printed book.

`AGENT.md` §3 also asks to "make invalid states hard to represent through types and
structure" — which is not possible in plain JavaScript. The two are in direct conflict, and
`AGENT.md` wins.

**Cost:** roughly a week of mild friction while the vocabulary becomes familiar. It pays
that back many times over.

### 3.2 Fastify instead of Express

**The PDF says:** Node.js + Express.

Express is not wrong — it is the most widely known Node framework and it works. But Fastify
is a better fit here for three concrete reasons: it validates incoming data as a built-in
feature rather than requiring add-ons, its TypeScript support is first-class rather than
retrofitted, and it is meaningfully faster on the kind of small, frequent requests this
product generates.

The two are similar enough that Express knowledge transfers almost completely.

### 3.3 Skip the "vanilla HTML/CSS/JS first" step

**The PDF says:** "HTML, CSS, JavaScript, then React."

Building the interface twice — once by hand, then again in React — is a detour of several
weeks that teaches habits React then asks you to unlearn. You still need to understand HTML
and CSS, and you will, because React is written in terms of them. Learn them *through*
React rather than before it.

---

## 4. The frontend, piece by piece

### React 19 + Vite 8

**What Vite is:** the machine that assembles your code into a working website. In
development it does something genuinely delightful — you save a file and the browser
updates in well under a second, without losing your place.

### TanStack Router — *you asked for TanStack, and this is the best of them*

**What it is:** decides which screen appears for which web address.

**Why this one:** it is the only React router that fully understands TypeScript. If you
link to a page that does not exist, or forget a required parameter, it is an error in your
editor rather than a broken link a user finds. For this product it also handles something
specific and useful: putting the camera position in the URL, so that "here is where I am
looking on the map" becomes a shareable link — which the business plan identifies as a
primary growth mechanism.

### TanStack Query — *the single highest-value package in this list*

**What it is:** manages everything that comes from the backend.

**Why it matters:** without it, you write the same tedious code hundreds of times — is it
loading, did it fail, is this copy stale, should I fetch it again. TanStack Query does all
of that once. Specifically for this product, it gives us optimistic updates: when you drag
an item to vote, it moves *immediately*, the request goes to the server in the background,
and if the server rejects it, the item slides back. That responsiveness is the entire feel
of the product.

### Tailwind CSS 4 + shadcn/ui — *you asked for shadcn, and I agree*

**What shadcn/ui is, and why it is unusual:** it is not a package you install and depend
on. You run a command, and it *copies the source code* of a component — a button, a
dialogue, a slider — directly into your project. It is then yours, and you can change any
line of it.

**Why that suits this project:** normal component libraries fight you the moment you want
something they did not anticipate, and this product is full of things no library
anticipated — a drag-to-vote slider snapping to 21 positions, an information card that
follows a moving dot. With shadcn you get a professional, accessible starting point and
full freedom to modify it.

**The trade-off, honestly stated:** because the code is copied rather than installed, it
does not update automatically. You get security fixes for the underlying pieces (shadcn
builds on Radix UI, which *is* a normal dependency), but improvements to the components
themselves must be re-copied deliberately. For this project that is the right side of the
trade.

**Note:** shadcn/ui requires Tailwind. They are a package deal.

### Zustand — for the camera only

**What it is:** a very small store for information the whole interface needs to agree on.

**Why not just React's built-in tools:** because of one specific performance problem. While
you drag the map, the camera position changes sixty times a second. If that goes through
ordinary React state, React re-renders the interface sixty times a second and the map
stutters. Zustand can notify code *outside* React, which lets us move the map by touching
the browser directly — smooth — while React only re-renders when the set of visible items
actually changes.

This is the one genuinely subtle performance decision in the frontend, and getting it wrong
is the most likely cause of a map that feels sluggish.

---

## 5. The backend, piece by piece

### Fastify + tRPC

**What tRPC is:** normally, a frontend and backend communicate by agreeing on a set of web
addresses and message formats, and you write that agreement out twice — once on each side.
When they drift apart, you get bugs that only appear in production.

tRPC removes the duplication. The backend defines a function; the frontend calls it as if
it were local. Your editor autocompletes it. Rename something on the server and the
frontend immediately shows an error.

**Why this matters here specifically:** you are one person maintaining both sides. Every
duplicated definition is a chance for them to disagree. And tRPC was designed to work with
TanStack Query, so the two combine into very little code.

**The honest trade-off:** tRPC couples your frontend and backend together, so it is not
suitable for the public API that Stage 4 of the business plan envisages. That is less of a
problem than it sounds, because **you would not want to expose your internal application
calls as a public product anyway** — a public API is a deliberately designed, versioned,
documented surface, built separately when the time comes. tRPC for the app now; a proper
REST API alongside it at Stage 4.

### Prisma 7 + PostgreSQL 17

**What Prisma is:** you describe your data once, in a readable file, and Prisma generates
the code to read and write it — with your editor autocompleting every field.

**Why it is especially good for you:** `npx prisma studio` opens a spreadsheet-like window
in your browser showing every user, item and vote, editable by hand. For someone who is not
a programmer, being able to *see* the data is worth a great deal.

> ### ⚠ Version warning — this one will bite if we ignore it
>
> The `prisma` package's default "latest" version is currently **`8.0.0-rc.13`** — a
> release candidate, i.e. unfinished software — while the matching client library
> `@prisma/client` is at the stable **`7.10.0`**. Running the obvious command
> `npm install prisma` today installs an unfinished version that does not match its own
> client.
>
> **We pin both to `7.10.0` explicitly.** I will put this in writing in the build
> instructions so it cannot be forgotten.

**Why PostgreSQL:** it counts correctly under concurrency, which — per Section 2 — is the
one thing this product cannot compromise on. It is free, it is the industry default, and
every hosting provider offers it.

### Better Auth — logins

**What it is:** handles registration, login, sessions, password reset and email
verification.

**Why this one rather than a service:** it runs on *your* server and stores users in *your*
database. Nothing about your users is sent to a third party. Per the business plan's
Section 11, every external service that touches personal data needs a data processing
agreement and a compliance review — and the simplest way to pass that review is to have no
external service at all. This choice removes an entire compliance obligation.

### Zod — validation, defined once

**What it is:** a way of describing what valid data looks like — "a vote is a whole number
between −10 and +10" — as code.

**Why it earns its place:** the *same* description is used by the frontend to grey out the
submit button, by the backend to reject bad requests, and by TypeScript to type both. One
rule, written once, enforced in three places. Untrusted input is checked at the boundary
before it reaches any logic, which is the correct security posture.

---

## 6. Testing — how we get to "many tests"

You asked for many tests to avoid bugs. That is the right instinct, and this product is
unusually well suited to it, because **its hardest logic is pure arithmetic**.

| What we test | With | Why it is worth testing |
| --- | --- | --- |
| Score arithmetic | Vitest | Sums, vote changes, one-vote-per-user. The core promise of the product. |
| Screen ↔ world coordinates | Vitest | The maths behind pan and zoom. Fiddly, invisible, and the source of most map bugs. |
| Fan-out layout | Vitest | Where items go when they share a score. Pure input → output. |
| Visible-range culling | Vitest | Which items get drawn. A bug here means items vanish. |
| Search matching | Vitest | Does typing "alpha" find "Sample Film Alpha"? |
| Components | Vitest + React Testing Library | Does the card appear on hover? Is the slider hidden when logged out? |
| API calls | Vitest + a test database | Can two simultaneous votes corrupt a total? |
| Whole journeys | Playwright | Open the site, log in, drag an item, confirm the number changed — in a real browser. |

**The design decision that makes this possible:** all the coordinate and layout maths goes
into plain functions that take numbers and return numbers, with no knowledge of React or
the browser. Those are trivial to test exhaustively, and they are exactly where the bugs
would otherwise hide. Anything touching the screen is kept thin, because that is the part
that is awkward to test.

Playwright deserves a specific mention: panning, zooming and drag-to-vote **cannot** be
meaningfully verified any other way. It drives a real Chrome, Firefox and Safari, and it
can be told to fail the test if the appearance changes unexpectedly.

**Continuous checking:** a GitHub Actions workflow runs the whole test suite automatically
on every push. If something breaks, you get an email. It is free for a private repository
at this scale.

---

## 7. How the pieces fit together

```
  YOUR BROWSER                          YOUR COMPUTER (later: a rented server)
 ┌──────────────────────────┐          ┌────────────────────────────────────┐
 │  React 19  +  Vite       │          │  Fastify                           │
 │                          │          │    ├── tRPC        (the functions) │
 │  TanStack Router  screens│  tRPC    │    ├── Better Auth (logins)        │
 │  TanStack Query   data   │ ───────▶ │    └── Zod         (validation)    │
 │  Zustand          camera │ ◀─────── │              │                     │
 │  Tailwind+shadcn  looks  │          │           Prisma                   │
 │                          │          │              │                     │
 └──────────────────────────┘          │        PostgreSQL 17               │
                                       │        (running in Docker)         │
        ▲                              └────────────────────────────────────┘
        │
   Zod schemas are shared by both sides — one definition of "valid"
```

---

## 8. Repository layout

We use **npm workspaces**, which is a way of keeping several related projects in one
repository. It is built into the npm you already have — no extra tool to install.

```
absolute-best/
  apps/
    web/           The React frontend
      src/
        features/world/    The map: camera, layout maths, items  ← the product
        features/auth/     Login and registration screens
        features/search/   Search box and results
        components/ui/     shadcn components (copied in, yours to edit)
      tests/
    api/           The Fastify backend
      src/
        router/            tRPC procedures — items, votes, auth
        db/                Prisma schema and migrations
      tests/
  packages/
    shared/        Zod schemas and types used by BOTH sides
  docs/            These documents
  docker-compose.yml   Starts PostgreSQL with one command
```

**Why a shared package:** the definition of "a vote is a whole number between −10 and +10"
lives in exactly one file, imported by both frontend and backend. It cannot drift.

**Deliberately not used: Turborepo, Nx, or similar.** They speed up very large repositories
by caching build results. At this size they add configuration and confusion for no
measurable benefit. `AGENT.md` §2 applies.

---

## 9. What I considered and rejected

Recording these so the question does not get reopened without new information.

| Option | Why not |
| --- | --- |
| **Next.js** (instead of Vite + Fastify) | Excellent framework, wrong shape here. Its strengths are server-rendered pages and SEO; this product is one heavily interactive canvas. It would also blur the frontend/backend boundary that `AGENT.md` §3 asks us to keep obvious. |
| **NestJS** (instead of Fastify) | Enterprise-grade structure, and a genuinely steep learning curve built around concepts you do not need for a solo project. |
| **Drizzle** (instead of Prisma) | A good, lighter alternative — but it expects you to think in SQL, and it has no equivalent of Prisma Studio. Prisma is the friendlier choice while you are learning. Revisit if Prisma ever feels slow. |
| **MongoDB** (instead of PostgreSQL) | Vote totals must be exactly right under concurrent access. Use the database built for that. |
| **Canvas / WebGL rendering** (instead of HTML elements) | Faster at extreme item counts, but you must then rebuild hovering, clicking, keyboard access and screen-reader support from nothing. We render only the visible items as ordinary HTML, which stays accessible. If profiling later proves it too slow, the layout maths is already separate and can feed a canvas renderer instead. |
| **Redux** (instead of Zustand) | Far more code for the one small thing we need shared state for. |
| **Auth0 / Clerk / Supabase Auth** | All good services. All send your users' personal data to a third party, each requiring a data processing agreement and compliance review. Better Auth avoids the obligation entirely. |
| **ESLint + Prettier** (instead of Biome) | The traditional pair, but two tools, two config files, and noticeably slower. Biome does both jobs with almost no configuration. |

---

## 10. Suggested build order

This is a sketch for your reaction, not the build plan itself — that becomes
`03-build-checklist.md` once this document is approved. Each batch ends with a manual test
guide you can follow yourself.

| Batch | What gets built | How you test it |
| --- | --- | --- |
| **1** | Empty monorepo, tooling, Biome, Vitest, CI. Nothing visible. | `npm test` runs and passes |
| **2** | The world line: camera, pan, zoom, mock items, fan-out. **No backend.** | Drag and scroll the map in your browser |
| **3** | Item cards, search, the intro screen and animation | Hover an item, search for one |
| **4** | Postgres in Docker, Prisma schema, seeded placeholder data | Open Prisma Studio and look at the data |
| **5** | Fastify + tRPC, items loaded from the real database | The map now shows database items |
| **6** | Better Auth: register, log in, log out | Create an account, refresh, stay logged in |
| **7** | Drag-to-vote against the real database, with optimistic updates | Vote; refresh; the score persisted |
| **8** | Quick Fire | Play a 10-item round |

**Batches 2 and 3 answer the riskiest question in the whole project** — does this feel
good? — before we have committed to a database schema. That is the refinement mentioned in
Section 2. If the answer is no, we have lost two batches, not the entire project.

---

## 11. Compliance notes

Per the business plan's Section 11, external services need review before touching real
data. The position for this stack:

| | Status |
| --- | --- |
| **Everything in Section 1** | Free, open-source, runs entirely on your machine. No data leaves your computer. **No review needed for local development.** |
| **PostgreSQL in Docker** | Local container. No external service. |
| **Better Auth** | Self-hosted. Personal data stays in your own database. **This choice removes a compliance obligation** that a hosted auth service would create. |
| **GitHub (code) + GitHub Actions (tests)** | Already in use. Code only — no personal data in the repository. Business plan D4 (public vs private) still needs answering. |
| **Wikipedia API** | **Not used yet.** Mocked until Stage 1, then requires review for licensing and attribution. |
| **Hosting, email, monitoring, analytics, payments** | **Not used yet.** All are Stage 1+ and all require review before real user data touches them. |

Two things this stack does correctly by default, and which we should keep: all incoming
data is validated at the boundary by Zod before reaching any logic, and passwords are
hashed by Better Auth rather than by hand.

---

## 12. Decisions I need from you

**T1 — Do you accept TypeScript instead of plain JavaScript?** *(Section 3.1. My
recommendation: yes.)*

- [ ] Yes — TypeScript
- [ ] No — plain JavaScript, as the PDF said
- [ ] Explain the difference to me again before I decide

**T2 — Do you accept tRPC, or would you rather learn a conventional REST API?**
*(Section 5. My recommendation: tRPC — less code, fewer bugs, and it pairs with the
TanStack tools you asked for. But REST is the more transferable skill, so this is a
legitimate either-way choice.)*

- [ ] tRPC — optimise for building this product
- [ ] REST — optimise for learning the industry-standard approach
- [ ] Your call

**T3 — Build order: do you accept batches 2–3 (the map, with fake data) before the database
in batch 4?** *(Section 10. My recommendation: yes — it de-risks the project cheaply.)*

- [ ] Yes — prove the interaction first
- [ ] No — build the database and backend first
- [ ] Other: `________________________`

**T4 — Where should Postgres come from?** *(Docker is already installed on your machine.)*

- [ ] Docker — one command, nothing to configure, easily reset *(recommended)*
- [ ] Install PostgreSQL directly on Windows
- [ ] Your call

**T5 — Still outstanding from the business plan: D1–D8 are unanswered.** The file in the
repository is unchanged and no boxes are ticked — see the note at the top of my reply. D2
(prototype vs. full product) and D8 (what success means) both affect this stack.

- [ ] I will tick the boxes in `00-business-plan.md`
- [ ] I will tell you my answers in chat and you write them in

---

## 13. Approval

- **Approved by:** `________________________`
- **Date:** `________________________`
- **Approved with the following changes:**

```
(write anything you want changed here)
```

**Once approved:** I write `03-build-checklist.md` — the ordered, tickable build plan —
and only then does batch 1 get written.
