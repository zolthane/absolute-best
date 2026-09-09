# Manual Testing Guide

> This is not a plan to approve — it is a reference, like the local setup guide. Come back
> to it any time you forget a command. If a command ever stops working, tell me and I will
> fix this document.

---

## Quick reference

| I want to... | Command(s) |
| --- | --- |
| Get the latest code before testing | `git pull` |
| Test in a browser on this computer | `npm run dev` |
| Test on my phone | `npm run dev:phone --workspace=apps/web`, then see [Section 2](#2-testing-on-your-phone) |
| Find this computer's address for my phone | `ipconfig` |
| Stop a running server | `Ctrl + C` in that terminal |

Run all commands from the project's root folder (`C:\Projects\absolute-best`) unless a
section says otherwise.

---

## 1. Testing on this computer (the usual way)

**1. Get the latest code**, if I have just told you I pushed something new:

```powershell
git pull
```

If I've told you the package list changed (rare — I will say so explicitly), run this
instead, which also reinstalls dependencies:

```powershell
npm run sync
```

**2. Start the app:**

```powershell
npm run dev
```

**3. Open the address it prints** — normally:

```
http://localhost:5173
```

Ctrl-click the link in the terminal, or copy it into your browser.

**4. When you're done testing**, go back to the terminal and press `Ctrl + C` to stop the
server. It will otherwise keep running (and keep holding that port) in the background.

---

## 2. Testing on your phone

Your phone and this computer must be **on the same Wi-Fi network**. This does not work over
mobile data, and it does not work if your phone is on a guest network separate from this
PC.

**1. Start the app in "phone-visible" mode** (note the different command — the ordinary
`npm run dev` only accepts connections from this computer itself):

```powershell
npm run dev:phone --workspace=apps/web
```

**2. Read the address from the terminal output.** It will print something like:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.22.134:5173/
```

The **Network** line is the one to use — type (or send yourself) that exact address on
your phone's browser. The number changes occasionally (see Section 3 below), so always
prefer reading it fresh from the terminal over reusing an old one.

**3. If Windows shows a firewall pop-up** the first time you do this ("Windows Defender
Firewall has blocked some features of Node.js..."), click **Allow access** (or at minimum
tick **Private networks**). This is Windows asking permission for your phone to reach this
computer — it is expected and needed, not a warning to worry about.

**4. Open that Network address in your phone's browser.**

**5. Log in again on the phone.** The mock login is separate per browser/device — logging
in on your PC does not carry over.

**6. When you're done**, press `Ctrl + C` in the terminal on this computer to stop the
server — your phone will then no longer be able to reach it.

---

## 3. If your phone can't connect

| Symptom | Likely cause / fix |
| --- | --- |
| Page never loads on the phone | Phone and PC are not on the same Wi-Fi network |
| It worked before, now it times out | The address changed — re-read it from the terminal (Section 2, step 2), or re-run `ipconfig` (below) — your PC's address can change when you reconnect to Wi-Fi or restart |
| Windows firewall pop-up was dismissed/blocked by accident | Open **Windows Security → Firewall & network protection → Allow an app through firewall**, and make sure Node.js is allowed on **Private** networks |
| Still stuck | Close the terminal, open a fresh one, and start again from Section 2, step 1 |

**To find this computer's current address manually:**

```powershell
ipconfig
```

Look for **IPv4 Address** under your Wi-Fi adapter (usually labelled "Wireless LAN adapter
Wi-Fi"). That number, followed by `:5173`, is the address to type on your phone —
e.g. `http://192.168.22.134:5173`.
