export interface SearchableItem {
  id: string;
  title: string;
}

// A cap on how many results are returned - even a short, common query could
// match a large fraction of the dataset, and a dropdown showing all of them
// isn't more useful than showing the closest handful.
const MAX_RESULTS = 8;

/**
 * Forgiving search over item titles: case-insensitive, matches anywhere in
 * the title (not just the start). An empty or whitespace-only query matches
 * nothing, rather than every item.
 */
export function searchItems<T extends SearchableItem>(items: readonly T[], query: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === "") {
    return [];
  }
  return items
    .filter((item) => item.title.toLowerCase().includes(normalizedQuery))
    .slice(0, MAX_RESULTS);
}
