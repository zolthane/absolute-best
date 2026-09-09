// A small, deliberately plain word bank - same reasoning as mockItems.ts's
// own (see CLAUDE.md's mock-data rule): invented, not real titles.
const ADJECTIVES = [
  "Quiet",
  "Bright",
  "Steady",
  "Curious",
  "Bold",
  "Gentle",
  "Sharp",
  "Faint",
  "Restless",
  "Hollow",
  "Vivid",
  "Weary",
];
const NOUNS = [
  "Harbor",
  "Signal",
  "Meadow",
  "Current",
  "Echo",
  "Ledger",
  "Passage",
  "Beacon",
  "Orchard",
  "Tunnel",
  "Cascade",
  "Threshold",
];

// A plain string hash (not cryptographic - a mock resolver has no need for
// one), used only to turn a link into a seed for mulberry32 below.
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// The same generator mockItems.ts uses, for the same reason: fast, seeded,
// good enough spread for placeholder data - not cryptographic.
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ResolvedLink {
  // A stable key for this link: equal input strings (after trimming) always
  // produce equal identifiers - this is what duplicate detection checks
  // against, not the title (two different links could coincidentally
  // generate the same title from this small a word bank).
  identifier: string;
  title: string;
}

/**
 * A pretend "resolve this link into an item" step, standing in for the real
 * Wikidata lookup that arrives at Stage 1 (docs/03-build-checklist.md,
 * batch 9: "no external service is contacted" - nothing here ever makes a
 * network request). Deterministic: the same link (after trimming) always
 * resolves to the same title and identifier, so pasting it again finds the
 * existing item rather than inventing a new one.
 */
export function resolveLink(url: string): ResolvedLink {
  const identifier = url.trim();
  const random = mulberry32(hashString(identifier));
  const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(random() * NOUNS.length)];
  return {
    identifier,
    title: `${adjective} ${noun}`,
  };
}
