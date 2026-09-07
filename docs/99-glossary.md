# Glossary

Plain-language explanations of every technical term used in these documents. Nothing here
is something you need to memorise — it is a reference to look things up in.

---

## The shape of the project

**Frontend** — everything that happens inside the visitor's web browser: what they see and
what they click. Written in HTML, CSS and JavaScript.

**Backend** — the program running on a computer we rent, which the frontend talks to. It
holds the real data and decides what each visitor is allowed to do. There is no backend in
Stage 0.

**Database** — the filing cabinet the backend writes to, so that data survives after the
computer is restarted. Ours will store users, items and votes.

**Server** — a rented computer that stays switched on so the website is always available.

**API** — the agreed vocabulary the frontend and backend use to talk to each other. For
example, the frontend says "give me every item between −50 and +50", and the backend
answers.

---

## Tools we will use

**React** — a library for building web interfaces out of reusable pieces called
*components*. A search box is a component; an information card is a component. The industry
standard for interfaces of this kind.

**Vite** — the tool that assembles our code into a working website and, while we are
developing, refreshes the browser the instant we save a file.

**Node.js** — the technology that lets JavaScript run outside a browser, which is what
makes it possible to write the backend in the same language as the frontend.

**PostgreSQL** — the database software we intend to use. Mature, free, and well suited to
counting votes accurately.

**Prisma** — a translation layer that lets the backend read and write the database using
ordinary code, rather than raw database commands.

**Git** — a program that records every version of every file, so any change can be reviewed
or undone. It is the reason a mistake is never permanent.

**GitHub** — a website that stores Git repositories online. It is where your source code
will live, and it doubles as an off-site backup.

**Repository ("repo")** — one project's folder, as tracked by Git. This whole folder is the
repository.

**Commit** — one saved snapshot of the project, with a short note saying what changed.

**Branch** — a parallel line of work, so an experiment does not disturb the working
version. Ours is called `main`.

---

## Concepts specific to this product

**World line** — the single horizontal axis that every item sits on. The centre is zero;
negative scores extend left, positive right.

**Item (or "thing")** — anything that can be voted on: a film, a book, an animal, a
historical event.

**Score** — the sum of every current vote on an item. This is its position on the world
line.

**Camera** — the imaginary window through which the visitor views the world line. Panning
and zooming move the camera, not the items. This distinction matters technically: it is
what allows the line to be endless without the browser slowing to a halt.

**Virtualisation** — drawing only the items currently visible on screen and ignoring the
rest. Without it, a map of a hundred thousand items would be unusably slow.

**Quick Fire** — the rapid voting mode. A random item appears; you drag it; the next one
appears immediately.

**Drag-to-vote** — voting by physically dragging an item along the line rather than
clicking a star rating. The drag snaps to the 21 whole numbers from −10 to +10.

**Fan-out (or branching)** — when several items share the same score, they are stacked
vertically with small connecting stems so that none of them are hidden behind the others.

**Opinion DNA** — a proposed future feature that describes a user's taste based on how they
have voted, rather than by asking them questions.

---

## Words that appear in the plans

**Mock / mocked data** — invented placeholder data that stands in for real data. Stage 0
uses mock data throughout, so nothing real is needed to see the product working.

**Placeholder** — a stand-in. "Sample Film Alpha" is a placeholder for a real film title.

**Prototype** — a working demonstration built to answer a question ("does this feel
good?"), not to be the final product.

**Seeding** — putting an initial set of items into the system before real users arrive, so
that the first visitor does not find an empty map.

**Cold start** — the problem that a community platform is worthless until it has a
community, and struggles to attract a community while it is worthless.

**localStorage** — a small amount of storage inside the visitor's own browser. Stage 0 uses
it to remember a pretend login between page refreshes. It never leaves their computer.

**WebSocket** — a permanently open connection that lets the server push updates to the
browser the moment they happen, which is how items would visibly move in real time. Stage 0
simulates this with a timer instead, because there is no server yet.

---

## Legal and compliance terms

**GDPR** — the EU General Data Protection Regulation, the law governing how personal data
about people in the EU may be handled.

**Personal data** — any information relating to an identifiable person. A username and an
email address both qualify.

**Special category data** — the especially sensitive classes of personal data (health,
religion, political opinion, ethnicity, sexuality) that GDPR Article 9 protects more
strictly. Relevant here because a person's voting pattern can *imply* their political or
religious views even if they never state them.

**Data minimisation** — the GDPR principle of collecting only what you actually need. It is
the reason we ask for an age bracket rather than a date of birth.

**DPIA (Data Protection Impact Assessment)** — a formal written assessment of privacy risk,
required before certain high-risk processing. Large-scale profiling such as Opinion DNA
would very likely trigger the requirement.

**Data processing agreement** — a contract required with any external company that handles
personal data on your behalf, such as a hosting provider.

**DSA (Digital Services Act)** — EU legislation imposing duties on platforms that host
content submitted by users, including a route for reporting illegal content.

**Notice-and-action** — the mechanism by which anyone can report unlawful content and
receive a response. In practice, this is the "report" button plus a process behind it.

**Anonymisation** — irreversibly removing the link between data and the person it came
from. An anonymised vote still counts toward a score but can no longer be traced to anyone.

**EN 301 549** — the European accessibility standard for ICT products, mandatory for
public-sector procurement.
