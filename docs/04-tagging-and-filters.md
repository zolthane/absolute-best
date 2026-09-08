# Automatic Tagging and Filters

| | |
| --- | --- |
| **Version** | 0.1 — Draft |
| **Date** | 2026-09-07 |
| **Status** | **AWAITING YOUR APPROVAL** |
| **Stage** | Stage 1 and later. **Nothing here is built in Stage 0.** |
| **Origin** | Your note "we need filters!", and your idea of deriving tags from Wikipedia |

---

## 1. Your idea, restated

Every item on the site should carry many tags, worked out automatically from its Wikipedia
entry rather than typed in by hand — so that a dolphin arrives already knowing it is a
mammal, and a horror film arrives already knowing it is a horror film. Those tags then power
filtering.

**This is the right instinct, and it is close to essential.** On a platform where anyone can
add anything, manual categorisation would never keep up. Automatic tagging is what makes
"one shared line for everything" workable rather than an unnavigable heap.

You also asked whether automation could work out that a *slasher film* is a kind of *horror
film*. **It can — and better than you might expect, because somebody has already written
that relationship down.**

---

## 2. Do not scrape Wikipedia. Use Wikidata instead.

This is the single most useful thing in this document.

Wikipedia is written for humans: infoboxes are hand-built HTML, formatted differently for
films, animals and people, and they change whenever an editor feels like it. Scraping it
means parsing that mess, and then re-parsing it every time somebody edits a template.

**Wikidata is the same knowledge, published as clean structured data.** It is Wikipedia's
sister project, every Wikipedia article is linked to a Wikidata entry, and it is designed to
be read by programs rather than people. One documented API, no HTML, no parsing.

Compare what each gives us for the two examples you raised:

| | Scraping Wikipedia | Reading Wikidata |
| --- | --- | --- |
| **Your dolphin** | Parse the "Scientific classification" table out of the HTML, hoping the layout has not changed | Ask for the taxonomy properties. Get *parent taxon*, *taxon rank* and *taxon name* as linked entities, already forming a chain |
| **Your film** | Read the sentence *"…is a 1980 American slasher film…"* and try to extract meaning from prose | Ask for *genre*, *publication date* and *country of origin*. Get each as a separate, structured value |
| **Slasher → horror** | Would need a language model to guess the relationship | Already recorded: the *slasher film* entity states that it is a **subclass of** *horror film* |

That last row is the important one. **The subgenre hierarchy you were hoping automation
could figure out is not something we need to figure out at all — it is already modelled**,
maintained by the Wikidata community, and free to read.

### What a stored item would actually look like

Placeholder data — the title and identifier below are invented, not a real entry:

```
Item:  "Sample Film Alpha"
  wikidata_id: Q##### (the stable identifier; never changes, even if renamed)

  Tags read directly:
    instance of      -> film
    genre            -> slasher film
    country          -> United States of America
    publication date -> 1980

  Tags derived by following "subclass of" upward:
    slasher film  ->  horror film  ->  film genre

  Result: the item is filterable as a slasher film, as a horror film,
          as a 1980 release, and as an American film - without anyone
          typing any of that in.
```

The same machinery, unchanged, handles your dolphin: *parent taxon* is followed upward
instead of *subclass of*, producing Odontoceti → Cetacea → Mammalia → Chordata → Animalia.
**One mechanism, every category** — which is exactly what a universal platform needs.

### Licensing — a genuine bonus

Wikidata is released under **CC0**, meaning public domain: it may be used with no
attribution requirement at all. Wikipedia's *text and images* are CC BY-SA and **do**
require attribution.

Convenient consequence: the structured facts we use for tagging carry no legal strings,
while the description and image shown on an item's card do, and must be credited. Two
sources, two rules, both easy to satisfy once known.

---

## 3. The four problems this creates

Recording them now, because each one is cheap to handle deliberately and expensive to
discover late.

### 3.1 The hierarchy runs away

Follow *subclass of* far enough and everything becomes "entity", "object", "thing". Tagging
every item on the site with "physical object" is worse than useless — it makes filters look
broken.

**Recommendation: stop after 3–4 steps upward**, and keep a small list of root tags that are
allowed to be the top of a chain (film, book, animal, person, place, event, and so on).
Cheap to tune once we can see real results.

### 3.2 Coverage is uneven

A well-known film may have forty properties. Something obscure may have three. Some things
have no Wikidata entry at all.

**Recommendation:** treat tags as a bonus, never a requirement. An item with no tags must
still work perfectly — it simply does not appear in filtered views. **Never block adding an
item because tagging failed.**

### 3.3 Wikidata occasionally says odd things

It is community-edited, so a small number of entries carry surprising or plainly wrong
classifications.

**Recommendation:** show an item's tags on its card, and let users report a wrong one. This
costs almost nothing and doubles as free quality control.

### 3.4 It is a third-party service

Per the business plan's Section 11, this requires review before real use. The specifics:

- **No personal data of ours is sent** — we send an identifier and receive facts.
- Wikimedia requires a descriptive **User-Agent** identifying the application and a contact
  address. Ignoring this gets applications blocked.
- **Rate limits apply.** Tags are fetched **once, when an item is created**, and stored.
  We never query Wikidata to draw the map.
- **Not contacted at all during Stage 0**, which uses invented placeholder tags.

---

## 4. Should filtering be premium?

You said you want this as a premium feature. **Partly agreed — but not all of it, and here
is the argument for splitting it.**

### Where I agree

Wikidata gives us a *lot* of tags per item, and combining them is genuinely powerful:
*"American horror films from the 1980s, with more than 500 voters, that I have not voted
on."* That is a research tool, and it sits naturally beside the demographic layers the
business plan already earmarks as premium.

### Where I would push back

The business plan makes two commitments that a full filtering paywall would work against:

1. **Phase 1 is explicitly "no monetisation — optimise for voting and graph exploration."**
   Filters are exploration.
2. **"Discovery should happen through the world itself."** Filters are the main tool for
   that. Paywalling all discovery means a free visitor sees an undifferentiated cloud, votes
   less, and generates less of the data the whole business depends on.

There is also a plainer commercial point: a visitor who has never used filters has no reason
to pay for better ones. Free filters are the advertisement for paid filters.

### Recommendation — a split

| Tier | What it gets | Why here |
| --- | --- | --- |
| **Free** | **One filter at a time**, from a short list: category/type, "unvoted by me", "most divisive" | Enough to make the map navigable and to demonstrate the value |
| **Premium** | **Combining several filters**, saving them, tag-tree browsing, and crossing filters with demographic layers | Genuinely a power tool, and consistent with the premium tier already planned |

**The tagging itself must stay free and universal**, because it also feeds search and the
item cards. It is *advanced filtering* that is worth charging for, not knowing what an item
is.

**This is a recommendation, not a decision.** If you would rather paywall filtering
entirely, say so and I will record it — it is your product, and the argument above is about
growth, not principle.

---

## 5. When this gets built

| Stage | What happens |
| --- | --- |
| **Stage 0** | **Nothing.** Placeholder items carry two or three invented tags so the filter interface can be designed and tested. No external service is contacted. |
| **Stage 1** | Wikidata lookup on item creation; tags stored; one free filter working |
| **Stage 2** | Tag hierarchy browsing, more filters, the "most divisive" view |
| **Stage 3** | Premium: combined filters, saved filters, demographic crossing |

---

## 6. Decisions I need

**F1 — Wikidata rather than scraping Wikipedia?** *(Section 2. Recommended: yes — same
facts, structured, no parsing, and the subgenre hierarchy comes free.)*

- [x] Yes — Wikidata
- [ ] Scrape Wikipedia pages as originally imagined
- [ ] Explain the difference again

**F2 — Free/premium split, or everything premium?** *(Section 4.)*

- [x] Split: one filter free, combinations premium *(recommended)*
- [ ] All filtering is premium
- [ ] All filtering is free; premium earns its money from demographics only
- [ ] Other: `________________________`

**F3 — Which filters exist first?** *(Still open from Q6 of the product spec. Recommended:
the first two.)*

- [x] Most divisive — high participation, score near zero
- [x] Unvoted by me
- [ ] By tag (horror, mammal, 1980s…)
- [ ] By participation — "more than N voters"
- [ ] By score range
- [ ] Recently added

**F4 — Confirm nothing here is built during Stage 0.**

- [x] Confirmed — Stage 0 uses invented tags only
- [ ] I want real Wikidata tagging sooner

---

## 7. Approval

- **Approved by:** `Lovas Zoltán`
- **Date:** `2026.09.07.`
- **Approved with the following changes:**

```
(write anything you want changed here)
```
