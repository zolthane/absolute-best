export interface GridCellAssignment {
  cellCol: number;
  cellRow: number;
}

export interface GridCell<T> {
  representative: T;
  count: number;
}

/**
 * Groups items by their (cellCol, cellRow) assignment and keeps only one
 * representative per cell - the one `compare` ranks first - discarding the
 * rest. `compare(a, b)` should return a negative number when `a` should
 * represent the cell instead of `b`, matching Array.prototype.sort's
 * contract; on a tie (0), the earlier item in `items` wins.
 */
export function sampleGrid<T extends GridCellAssignment>(
  items: readonly T[],
  compare: (a: T, b: T) => number,
): GridCell<T>[] {
  const cells = new Map<string, GridCell<T>>();

  for (const item of items) {
    const key = `${item.cellCol}:${item.cellRow}`;
    const existing = cells.get(key);
    if (!existing) {
      cells.set(key, { representative: item, count: 1 });
      continue;
    }
    existing.count += 1;
    if (compare(item, existing.representative) < 0) {
      existing.representative = item;
    }
  }

  return [...cells.values()];
}

/**
 * Converts a world-space position to a grid cell index, sized to be
 * `cellSizePixels` wide at the given zoom. Deliberately independent of the
 * camera's pan position: a cell boundary sits at a fixed world coordinate
 * and never moves as the user pans, which is what stops panning from
 * reshuffling which item represents each cell (screen position moves
 * continuously with pan; this does not, by construction).
 */
export function worldPositionToCellIndex(
  worldPosition: number,
  zoom: number,
  cellSizePixels: number,
): number {
  if (
    !Number.isFinite(worldPosition) ||
    !Number.isFinite(zoom) ||
    zoom <= 0 ||
    cellSizePixels <= 0
  ) {
    return 0;
  }
  return Math.floor((worldPosition * zoom) / cellSizePixels);
}

/**
 * The screen-space equivalent for an axis with no camera of its own (the Y
 * axis in Stage 0: voter count maps straight to a screen position with no
 * pan or zoom to account for), so cell assignment is just the screen
 * position divided into fixed-size bands.
 */
export function screenPositionToCellIndex(screenPosition: number, cellSizePixels: number): number {
  if (!Number.isFinite(screenPosition) || cellSizePixels <= 0) {
    return 0;
  }
  return Math.floor(screenPosition / cellSizePixels);
}
