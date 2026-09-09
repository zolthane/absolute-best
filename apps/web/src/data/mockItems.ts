export interface Item {
  id: string;
  title: string;
  score: number;
  voterCount: number;
  // Insertion order, standing in for a real createdAt/id ordering once a
  // database exists - used to break "most-voted" ties deterministically
  // when several items share a grid cell (product spec Q3b: oldest wins).
  order: number;
  // Invented, not real classification - Stage 0 has no tagging pipeline yet
  // (see docs/04-tagging-and-filters.md F4). Just enough for the item card
  // and future filter UI to have something to show.
  tags: string[];
}

const ITEM_COUNT = 500;
const MAX_VOTER_LOG_EXPONENT = 3.5; // up to roughly 3,162 voters
const TAGS_PER_ITEM = 2;

// A small, clearly-invented pool - real tagging (Wikidata-derived) arrives in
// Stage 1.
const TAG_POOL = [
  "Drama",
  "Comedy",
  "Sci-Fi",
  "Documentary",
  "Animated",
  "1980s",
  "1990s",
  "2000s",
  "Cult Classic",
  "Blockbuster",
  "Indie",
  "Foreign",
];

// Word banks for invented titles - plainly fictional, not real film names,
// people or places (see CLAUDE.md's mock-data rule).
const ADJECTIVES = [
  "Silent",
  "Crimson",
  "Iron",
  "Velvet",
  "Hidden",
  "Broken",
  "Golden",
  "Midnight",
  "Forgotten",
  "Wandering",
  "Electric",
  "Frozen",
  "Scarlet",
  "Ancient",
  "Restless",
  "Endless",
  "Secret",
  "Distant",
  "Radiant",
  "Lonely",
];
const CREATURES = [
  "Elephant",
  "Fox",
  "Falcon",
  "Wolf",
  "Tiger",
  "Sparrow",
  "Bear",
  "Serpent",
  "Owl",
  "Panther",
  "Whale",
  "Raven",
  "Lion",
  "Otter",
  "Heron",
  "Badger",
  "Lynx",
  "Swan",
];
const OBJECTS = [
  "Compass",
  "Lantern",
  "Mirror",
  "Anchor",
  "Clock",
  "Key",
  "Letter",
  "Bridge",
  "Garden",
  "Engine",
  "Violin",
  "Ladder",
  "Umbrella",
  "Locket",
  "Map",
  "Harbor",
  "Orchard",
  "Attic",
];
const HONORIFICS = [
  "Captain",
  "Duchess",
  "General",
  "Empress",
  "Colonel",
  "Baron",
  "Admiral",
  "Professor",
  "Countess",
  "Sergeant",
];
const INVENTED_SURNAMES = [
  "Ashworth",
  "Marlowe",
  "Voss",
  "Byrne",
  "Halloway",
  "Kestrel",
  "Doyle",
  "Renshaw",
  "Callahan",
  "Whitfield",
  "Sorensen",
  "Pemberton",
  "Osgood",
  "Fenwick",
];

// A fixed seed, not Math.random(): the map must look exactly the same on
// every reload. Reshuffling placeholder items on refresh would make the
// prototype feel broken, and would contradict the product spec's whole
// premise that the map is a stable, learnable place (see Q3b's argument
// against random grid sampling, for the same underlying reason).
const MOCK_DATA_SEED = 20260908;

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

function pick<T>(list: readonly T[], random: () => number): T {
  const item = list[Math.floor(random() * list.length)];
  if (item === undefined) {
    throw new Error("pick() called with an empty list");
  }
  return item;
}

function pickTags(random: () => number): string[] {
  const pool = [...TAG_POOL];
  const picked: string[] = [];
  for (let i = 0; i < TAGS_PER_ITEM; i++) {
    const index = Math.floor(random() * pool.length);
    picked.push(...pool.splice(index, 1));
  }
  return picked;
}

function generateTitle(random: () => number): string {
  const pattern = Math.floor(random() * 3);
  if (pattern === 0) {
    return `${pick(ADJECTIVES, random)} ${pick(CREATURES, random)}`;
  }
  if (pattern === 1) {
    return `The ${pick(ADJECTIVES, random)} ${pick(OBJECTS, random)}`;
  }
  return `${pick(HONORIFICS, random)} ${pick(INVENTED_SURNAMES, random)}`;
}

function generateUniqueTitle(random: () => number, usedTitles: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const title = generateTitle(random);
    if (!usedTitles.has(title)) {
      usedTitles.add(title);
      return title;
    }
  }
  // The word banks give a few hundred combinations, so 50 attempts should
  // never actually run out - this only guarantees the loop terminates.
  const fallback = `${generateTitle(random)} ${usedTitles.size}`;
  usedTitles.add(fallback);
  return fallback;
}

// A score is the exact sum of `voterCount` individual votes (rules R1/R2),
// so it can never exceed voterCount * 10 in either direction - a real item
// cannot have a score of 80 from 2 voters. Each item gets its own
// "popularity bias" (how much a typical voter likes or dislikes it), and
// every simulated vote is that bias plus noise, clamped to the real -10..10
// range - the same shape a genuine vote distribution would have.
function generateScore(random: () => number, voterCount: number): number {
  const bias = (random() * 2 - 1) * 10;
  let score = 0;
  for (let i = 0; i < voterCount; i++) {
    const noise = (random() * 2 - 1) * 6;
    score += Math.max(-10, Math.min(10, Math.round(bias + noise)));
  }
  return score;
}

function generateMockItems(): Item[] {
  const random = mulberry32(MOCK_DATA_SEED);
  const usedTitles = new Set<string>();

  return Array.from({ length: ITEM_COUNT }, (_, index) => {
    // Uniform in the exponent, not in the count itself, so most items land
    // low with a long tail of rarer, more-voted ones - and, conveniently,
    // an even-looking spread on the log-scaled Y axis that displays it.
    const voterCount = Math.round(10 ** (random() * MAX_VOTER_LOG_EXPONENT));
    const score = generateScore(random, voterCount);

    return {
      id: `mock-${index + 1}`,
      title: generateUniqueTitle(random, usedTitles),
      score,
      voterCount,
      order: index,
      tags: pickTags(random),
    };
  });
}

export const mockItems: Item[] = generateMockItems();
