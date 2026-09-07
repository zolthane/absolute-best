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

## 4. Setting this up on GitHub — step by step

**Not done yet.** The repository exists only on your machine. Note that **your `main` rule
cannot be enforced until this is done**, because pull requests are a GitHub feature and do
not exist locally.

Business plan decision **D4** says the repository is public.

> ### ⚠ Read this before you start
>
> **Publishing is not fully reversible.** Once a public repository exists, it can be cloned,
> forked, cached and indexed by search engines within minutes. Deleting it afterwards does
> not reliably remove those copies. Nothing here is sensitive — I have checked, and there
> are no `.env` files and no secrets anywhere in the repository — but the decision itself is
> one-way. If you have any doubt, create it **private** now (`--private` instead of
> `--public` in step 5) and switch it to public later. That direction is easy; the other is
> not.

---

### Step 0 — Decide which email address your commits carry

**Do this first, because it is far easier now than later.**

Every git commit records an email address, and on a public repository **that address is
visible to anyone, permanently, including automated address harvesters**. Your commits
currently carry:

```
[redacted]
```

That is your work address. Publishing it on a personal side project invites spam to your
work inbox, and ties company identity to a private venture.

**GitHub provides a private alternative** — an address of the form
`12345678+username@users.noreply.github.com`, which works normally but reveals nothing.
You will find yours after step 3, at **github.com → Settings → Emails → "Keep my email
addresses private"**.

Choose one:

- **A — Switch to the GitHub private address.** Recommended. Requires one extra step, and I
  can also rewrite the five existing commits so the work address never appears at all. This
  is completely safe *right now*, because nothing has been pushed anywhere yet. It becomes
  awkward the moment you publish.
- **B — Use a personal email address.** Also fine. Same rewrite applies.
- **C — Keep the work address.** Simplest, and a legitimate choice if you do not mind.

**Tell me which, and if A or B, I will do the rewrite before anything is pushed.**

---

### Step 1 — Make sure you have a GitHub account

If you do not, go to [github.com/signup](https://github.com/signup). It is free. Note the
**username** you choose; you will need it below.

---

### Step 2 — Install the GitHub command-line tool

```powershell
winget install GitHub.cli
```

Then **close your terminal and open a new one** — newly installed programs are invisible to
terminals that were already running. Confirm:

```powershell
gh --version
```

You should see a version number. If it says "not recognized", reopen the terminal again.

---

### Step 3 — Log in

```powershell
gh auth login
```

It asks a series of questions. Answer them like this:

| Question | Answer |
| --- | --- |
| What account do you want to log into? | **GitHub.com** |
| What is your preferred protocol? | **HTTPS** |
| Authenticate Git with your GitHub credentials? | **Yes** |
| How would you like to authenticate? | **Login with a web browser** |

It then shows a one-time code such as `ABCD-1234`. Press Enter, your browser opens, paste
the code, and approve. The terminal should finish with:

```
✓ Logged in as your-username
```

**This step must be done by you, in your own terminal** — it needs a real browser and your
password.

---

### Step 4 — Final check before publishing

```powershell
cd c:\Projects\absolute-best
git status
git log --oneline
```

`git status` should say **nothing to commit, working tree clean**. `git log` should show
your commits. If anything is uncommitted, stop and tell me.

---

### Step 5 — Create the repository and push

Make sure you are in the project folder, then:

```powershell
gh repo create absolute-best --public --source=. --remote=origin --push
```

*(Use `--private` instead of `--public` if you decided to start private.)*

This creates the repository on GitHub, links it to your local folder, and uploads the
current branch. Then push the other branch too:

```powershell
git push -u origin dev
git push -u origin main
```

Open the repository in your browser to confirm:

```powershell
gh repo view --web
```

You should see your `docs` folder and the README.

---

### Step 6 — Make `dev` the default branch

So that new work and pull requests point at the right place.

On github.com, in your repository: **Settings → General → Default branch → the ⇄ swap icon
→ choose `dev` → Update.**

---

### Step 7 — Protect `main`

This is what actually enforces your "PR only" rule. Branch protection is free on public
repositories.

**Settings → Branches → Add branch protection rule**

- Branch name pattern: `main`
- ☑ **Require a pull request before merging**
- ☑ **Do not allow bypassing the above settings** — without this, the rule does not apply to
  you, which defeats the purpose on a solo project
- Leave **Require status checks** unticked for now. It cannot be configured until a
  GitHub Actions workflow has run at least once, which happens in **batch 0**. Come back
  and tick it afterwards.

Then **Create**.

---

### Step 8 — Confirm it works

```powershell
git checkout main
git commit --allow-empty -m "test protection"
git push
```

**This push should be REJECTED**, with a message about protected branches. That rejection is
the proof your rule works. Undo the test commit:

```powershell
git reset --hard HEAD~1
git checkout dev
```

If the push **succeeded**, the protection is not configured correctly — go back to step 7
and check "Do not allow bypassing" is ticked.

---

### When you are done

Tell me, and I will start `feature/batch-0-skeleton`.

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
