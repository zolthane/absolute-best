# Teeter

*Tip the scales.*

A community-driven platform for positioning anything on one shared, infinite opinion axis.

Every registered user may cast one vote per item, from **-10 to +10**, and that vote is
final. Votes are **added together**, never averaged. The resulting sum is the item's
position on a horizontal "world line" that users can search, pan and zoom through, like a
map.

> **Guiding principle: the graph is the product.**
> Search, accounts, profiles, metadata and monetisation exist to support the central
> experience, not to turn this into another list-based review site.

---

## Current status

**Stage 0 in progress** - a frontend-only clickable prototype, no server or database yet.
See [`docs/03-build-checklist.md`](docs/03-build-checklist.md) for progress, batch by batch.

All planning documents are approved. Start here: **[docs/README.md](docs/README.md)**

---

## Running this project

You will need [Node.js](https://nodejs.org) 24 and npm 11 or newer. Check what you have:

```powershell
node --version
npm --version
```

First time only:

```powershell
npm install
```

Day to day:

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the app at `http://localhost:5173` with live reload |
| `npm test` | Runs every test, in every workspace |
| `npm run typecheck` | Checks the TypeScript types, without building |
| `npm run lint` | Checks code style and common mistakes |
| `npm run build` | Builds the production version into `apps/web/dist` |

If you are new to the command line or to Node.js, see
[`docs/10-local-setup.md`](docs/10-local-setup.md).

---

## Repository layout

```
absolute-best/
  apps/
    web/           The React frontend - the app you actually run
  packages/
    shared/        Code and types shared between the frontend and (later) the backend
  docs/            Plans and specifications (plain Markdown - safe for you to edit)
  .github/
    workflows/     CI: typecheck, lint, test and build on every push
  biome.json       Lint and formatter configuration
  .gitignore       Files Git must never track (secrets, build output, node_modules)
  .gitattributes   Line-ending normalisation for Windows/Linux
  .editorconfig    Shared editor formatting rules
  .nvmrc           Node.js version this project expects
```

There is no backend yet. Per the approved build checklist, it is added in Stage 1 once the
Stage 0 prototype has proven the interaction works.

## Licence

Not yet chosen. See the open decisions section of the [business plan](docs/00-business-plan.md).
