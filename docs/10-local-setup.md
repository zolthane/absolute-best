# Local Development Setup (Windows 11)

> **Good news first: you already have everything except one optional item.**
>
> You asked for a guide to installing Node and npm. I checked your machine before writing
> this, and Node.js **24.18.0** and npm **11.16.0** are already installed and working from
> the terminal. So are Git, Docker and Visual Studio Code. There is nothing you need to
> install to start.
>
> The rest of this document is therefore: how to *verify* that, what the one missing
> optional item is, and how to install or change these things if you ever need to — on this
> machine or a new one.

---

## 1. What is on your machine right now

Checked on 2026-09-07:

| Tool | Status | Where it lives |
| --- | --- | --- |
| **Node.js 24.18.0** | ✅ Installed | `C:\Program Files\nodejs\node.exe` |
| **npm 11.16.0** | ✅ Installed | `C:\Program Files\nodejs\npm.ps1` |
| **npx** | ✅ Installed | `C:\Program Files\nodejs\npx.ps1` |
| **Git 2.55.0** | ✅ Installed | `C:\Program Files\Git\cmd\git.exe` |
| **Docker** | ✅ Installed | `C:\Program Files\Docker\Docker\resources\bin\docker.exe` |
| **Visual Studio Code** | ✅ Installed | `…\Programs\Microsoft VS Code\bin\code.cmd` |
| **winget** | ✅ Installed | Windows' built-in installer |
| **psql** (Postgres client) | ⬜ Not installed | Optional — see Section 4 |
| **nvm** (Node version switcher) | ⬜ Not installed | Optional — see Section 5 |

Node 24 is the current Long Term Support release, which is exactly what we want. The
project already records this in the `.nvmrc` file at the repository root.

---

## 2. Verify it yourself

Open a terminal and run these. In VS Code the shortcut is **Ctrl + `** (the key above Tab).

```powershell
node --version
npm --version
git --version
docker --version
```

You should see something like:

```
v24.18.0
11.16.0
git version 2.55.0.windows.2
Docker version 28.x.x
```

**If any of those say "not recognized"**, the tool is installed but Windows cannot find it.
Nine times out of ten the fix is simply to **close and reopen the terminal** — a freshly
installed program is not visible to terminals that were already open. If that does not
work, see Section 6.

---

## 3. Which terminal to use

You have three, and they behave differently. This trips people up constantly.

| Terminal | Use it for | Note |
| --- | --- | --- |
| **PowerShell** | Everything, day to day | This is the default in VS Code. Recommended. |
| **Git Bash** | Following tutorials written for Mac/Linux | Understands `ls`, `rm -rf` and similar |
| **Command Prompt (cmd)** | Nothing, really | Legacy. Avoid. |

**One PowerShell quirk worth knowing now**, because it will confuse you otherwise: in
PowerShell, `&&` does not work the way it does in Mac/Linux tutorials.

```powershell
# Tutorial says (Mac/Linux style):
cd apps/web && npm run dev        # ❌ error in PowerShell

# In PowerShell, do this instead:
cd apps/web; npm run dev          # ✅ runs both
```

---

## 4. The one optional missing piece: `psql`

`psql` is a text-based tool for typing commands directly at the database. **You almost
certainly do not need it.** Prisma Studio — which comes with the project and opens a
friendly, spreadsheet-like view of your data in the browser — covers everything you will
want to do, and is far more pleasant.

Install it only if you later find yourself wanting raw database access:

```powershell
winget install PostgreSQL.psql
```

Note that our PostgreSQL *server* will run inside Docker (see the tech stack document,
Section 5), so there is nothing else to install for the database itself.

---

## 5. If you ever need to install or change Node

You do not need this today. It is here for a new machine, or for the day a project demands
a different Node version.

### Option A — winget (simplest)

```powershell
winget install OpenJS.NodeJS.LTS
```

Then **close and reopen your terminal**, and run `node --version` to confirm.

### Option B — nvm-windows (if you ever need several Node versions at once)

`nvm` lets you switch between Node versions per project. Worth it only when you are
juggling multiple projects with conflicting requirements — which you are not.

```powershell
winget install CoreyButler.NVMforWindows
```

Then, in a **new terminal opened as Administrator**:

```powershell
nvm install 24
nvm use 24
```

> ⚠ **Do not install nvm-windows while a normal Node installation is present.** The two
> conflict in confusing ways. Uninstall Node.js from *Settings → Apps* first. Since your
> current setup works, my recommendation is to leave it alone.

### Option C — the official installer

Download the **LTS** build from [nodejs.org](https://nodejs.org) and run it. Leave every
option at its default, including "Add to PATH".

---

## 6. If a command is "not recognized"

In order, try:

1. **Close every terminal window and open a new one.** This fixes it most of the time.
2. **Restart VS Code entirely** — not just the terminal panel.
3. **Restart Windows.** Occasionally required after an installer changes system settings.
4. **Check that Windows can see it:**
   ```powershell
   $env:Path -split ';' | Select-String -Pattern 'nodejs'
   ```
   If that prints nothing, Node is not on your PATH. Reinstall using Option A above, which
   sets it correctly.

---

## 7. Docker — start it before you need the database

Docker is installed, but **Docker Desktop must be running** before the database will work.
It is an application, like any other: find "Docker Desktop" in the Start menu and open it.
Wait for the whale icon in the system tray to stop animating.

To confirm it is ready:

```powershell
docker info
```

If that prints a wall of information, you are set. If it says it cannot connect to the
Docker daemon, Docker Desktop is not running yet.

**Tip:** Docker Desktop can start automatically with Windows (*Settings → General → Start
Docker Desktop when you sign in*). Convenient, but it does use a noticeable amount of
memory, so leave it off if your machine feels slow.

You will not need Docker until build batch 4.

---

## 8. Recommended VS Code extensions

Install these once and the editor becomes dramatically more helpful. Run the whole block in
a terminal:

```powershell
code --install-extension biomejs.biome
code --install-extension bradlc.vscode-tailwindcss
code --install-extension Prisma.prisma
code --install-extension ms-playwright.playwright
code --install-extension vitest.explorer
```

| Extension | What it gives you |
| --- | --- |
| **Biome** | Formats your code on save; underlines mistakes as you type |
| **Tailwind CSS IntelliSense** | Autocompletes styling names and previews the colours |
| **Prisma** | Colours and autocompletes the database description file |
| **Playwright** | Run browser tests from a panel, and watch them run |
| **Vitest** | A green tick or red cross beside every test in the editor |

---

## 9. Getting the project onto GitHub

The repository already exists locally with one commit. Publishing it is a separate,
deliberate step — and it depends on business plan decision **D4** (public or private),
which is still unanswered.

When you are ready, the simplest route is the GitHub CLI:

```powershell
winget install GitHub.cli
gh auth login
```

Then, from the project folder — note `--private`, matching my recommendation:

```powershell
gh repo create absolute-best --private --source=. --remote=origin --push
```

After that, saving your work is three commands:

```powershell
git add -A
git commit -m "a short note about what you changed"
git push
```

> **Never commit a `.env` file.** Those hold passwords and keys. The `.gitignore` in this
> repository already blocks them, but it is worth knowing *why* the rule exists.

---

## 10. Summary — what to do before batch 1

| | Action | Needed when |
| --- | --- | --- |
| ✅ | Nothing. Node, npm, Git, Docker and VS Code are all present and working. | — |
| ⬜ | Install the VS Code extensions in Section 8 | Before batch 1 (2 minutes) |
| ⬜ | Answer D4 and publish to GitHub | Whenever you like |
| ⬜ | Start Docker Desktop | Not until batch 4 |
| ⬜ | Install `psql` | Probably never |
