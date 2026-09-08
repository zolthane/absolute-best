export interface Item {
  id: string;
  title: string;
  score: number;
  voterCount: number;
}

const ITEM_COUNT = 200;
const SCORE_RANGE = 80;
const MAX_VOTER_LOG_EXPONENT = 3.5; // up to roughly 3,162 voters

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

function generateMockItems(): Item[] {
  const random = mulberry32(MOCK_DATA_SEED);

  return Array.from({ length: ITEM_COUNT }, (_, index) => {
    const score = Math.round((random() * 2 - 1) * SCORE_RANGE);
    // Uniform in the exponent, not in the count itself, so most items land
    // low with a long tail of rarer, more-voted ones - and, conveniently,
    // an even-looking spread on the log-scaled Y axis that displays it.
    const voterCount = Math.round(10 ** (random() * MAX_VOTER_LOG_EXPONENT));

    return {
      id: `mock-${index + 1}`,
      title: `Sample Film ${String(index + 1).padStart(3, "0")}`,
      score,
      voterCount,
    };
  });
}

export const mockItems: Item[] = generateMockItems();
