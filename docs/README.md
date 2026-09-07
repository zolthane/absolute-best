# Absolute Best — Project Documents

This folder holds every plan for the project. They are ordinary text files written in
Markdown, which means you can open and edit any of them in Notepad, Visual Studio Code, or
directly on GitHub. **You cannot break anything by editing them.**

---

## The documents, in order

| # | Document | What it answers | Status |
| --- | --- | --- | --- |
| 00 | [Business plan](00-business-plan.md) | What are we building, for whom, why, at what cost and risk? | **Awaiting your approval** |
| 01 | `01-product-spec.md` | Exactly what the prototype does, screen by screen | Not written yet |
| 02 | `02-technical-plan.md` | How it is built, and which files exist and why | Not written yet |
| 03 | `03-build-checklist.md` | The ordered list of build steps, tickable as we go | Not written yet |
| 99 | [Glossary](99-glossary.md) | Plain-language explanations of the technical words | Available now |

Documents 01–03 are deliberately not written yet. Their content depends on the decisions
you make in Section 12 of the business plan, and writing them first would risk planning the
wrong product in detail.

---

## The process we are following

```
   [ 00 Business plan ]  ── you approve ──▶  [ 01 Product spec ]
                                                    │
                                             you approve
                                                    ▼
                                          [ 02 Technical plan ]
                                                    │
                                             you approve
                                                    ▼
                                        [ 03 Build checklist ]
                                                    │
                                                    ▼
                                              ✍  Code
```

**No code is written until documents 00–03 are approved.** That is the rule you set, and
it is the right one: changing a sentence in a plan costs seconds, whereas changing a
built feature costs days.

---

## How to review a document

1. Open it and read it through once without stopping.
2. Read it again, and this time write directly into the file wherever something is wrong,
   unclear, or missing. Rough notes are fine — you do not need to write it neatly.
3. For the business plan specifically, work through **Section 12 (Open decisions)** and
   tick or write your answers.
4. Tell me it is ready. I will incorporate your changes and produce the next document.

If you would rather answer the decisions in conversation than edit the file, that is
equally fine — I will write your answers into the document for you.

---

## A note on Markdown

Markdown is just text with a few conventions:

| You write | You get |
| --- | --- |
| `# Title` | A large heading |
| `## Section` | A smaller heading |
| `**important**` | **important** |
| `- item` | A bullet point |
| `- [ ] task` | An unticked checkbox |
| `- [x] task` | A ticked checkbox |

That is genuinely all you need. Anything you type that is not one of the above simply
appears as normal text.
