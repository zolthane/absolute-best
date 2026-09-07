# Git Workflow and Branch Rules

| | |
| --- | --- |
| **Date** | 2026-09-07 |
| **Status** | Active — this is how we work from now on |
| **Set by** | Zoltán Lovas |

---

## 1. The rule, in three lines

| Branch | Purpose | Rule |
| --- | --- | --- |
| `main` | The finished, working product | **Nothing is committed here directly.** Changes arrive only by pull request from `dev`. |
| `dev` | The main development branch | Where finished work accumulates. Feature branches merge into here. |
| `feature/xy` | One feature or one batch | Branched from `dev`, merged back into `dev` when finished. |

```
   feature/batch-0-skeleton  ──┐
   feature/batch-1-camera    ──┼──▶  dev  ──(pull request)──▶  main
   feature/search            ──┘
```

**The one rule that matters: never commit to `main`.** Everything else follows from it.

---

## 2. Why bother, when you are working alone?

A fair question — this looks like ceremony for a one-person project. Three concrete reasons
it earns its place here:

1. **`main` always works.** If you break something halfway through a batch, the broken code
   lives on a feature branch. `main` still runs. On a project you touch a few hours a week,
   that matters — you will often return to it having forgotten where you were.
2. **A batch becomes one reviewable unit.** The build checklist has thirteen batches. One
   branch per batch means each one can be looked at, tested and merged as a whole, rather
   than as forty scattered commits.
3. **It is the industry-standard workflow.** Since D8 says this is a real product built by
   someone learning properly, learning it here costs nothing and transfers everywhere.

---

## 3. Everyday commands

### Starting a new batch

```powershell
git checkout dev
git pull                        # once a remote exists
git checkout -b feature/batch-0-skeleton
```

The name after `feature/` is free-form. Keep it short and descriptive:
`feature/batch-1-camera`, `feature/grid-sampling`, `feature/fix-zoom-drift`.

### While working

Commit often. A commit is a save point, not a public announcement.

```powershell
git add -A
git commit -m "Add coordinate conversion functions"
```

### Finishing a batch

```powershell
git checkout dev
git merge feature/batch-0-skeleton
git branch -d feature/batch-0-skeleton      # tidy up
```

### Releasing to `main`

Only when `dev` is in a state you would be happy for someone to see. This is done **on
GitHub, as a pull request** — not from the terminal:

```powershell
git push origin dev
```

Then on github.com: **Pull requests → New pull request → base `main`, compare `dev` →
Create**. Read the summary of what changed, then merge.

---

## 4. Setting this up on GitHub

**Not done yet.** The repository exists only on your machine — there is no remote. Note
that **your `main` rule cannot actually be enforced until this is done**, because pull
requests are a GitHub feature and do not exist locally.

Business plan decision **D4** says the repository is public.

```powershell
winget install GitHub.cli
gh auth login
gh repo create absolute-best --public --source=. --remote=origin --push
git push -u origin dev
```

Then make `main` the protected branch, on github.com:

**Settings → Branches → Add branch protection rule**

- Branch name pattern: `main`
- ☑ Require a pull request before merging
- ☑ Require status checks to pass before merging → select the GitHub Actions check *(once
  batch 0 has created it)*
- ☑ Do not allow bypassing the above settings

Also set **Settings → General → Default branch → `dev`**, so that new work and pull requests
default to the right place.

> **Before making the repository public, check that no `.env` file has ever been committed.**
> The `.gitignore` already blocks them, and nothing sensitive exists yet, but it is worth
> confirming rather than assuming — a secret pushed to a public repository must be treated
> as compromised even after deletion.

---

## 5. When something goes wrong

| Situation | What to do |
| --- | --- |
| Committed to `main` by mistake | Tell me. It is fixable and nothing is lost. |
| Want to abandon a feature branch | `git checkout dev` then `git branch -D feature/xy`. The work is discarded. |
| Broke something and want to start the batch again | Delete the branch as above and re-branch from `dev`. |
| Not sure what state things are in | `git status` and `git log --oneline --graph --all` |

**Nothing committed to git is ever really lost**, even when it looks like it. If something
seems to have vanished, stop and ask rather than trying to fix it — the recovery is usually
one command, and the usual way people lose work is by attempting a repair.

---

## 6. How I will work within this

- I will **never commit to `main`.**
- One feature branch per batch, named `feature/batch-N-<short-name>`.
- I will tell you the branch name when I start, and when a batch is ready to merge.
- I will not merge to `dev` until you have run that batch's manual test guide and said it is
  good.
- I will not open or merge pull requests into `main` without you asking.
