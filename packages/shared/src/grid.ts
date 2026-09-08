export interface GridCellAssignment {
  cellCol: number;
  cellRow: number;
}

// How many discrete zoom levels sit between one doubling of zoom and the
// next. Grid cell boundaries are computed from this snapped value instead of
// the raw camera zoom, so an amount of zoom too small to be a deliberate
// user action - a mouse-wheel notch, trackpad sensor noise, floating-point
// drift from repeated pinch gestures - can never flip which item represents
// a crowded cell back and forth. A real, sustained zoom still crosses a
// level and reshapes the grid; this only absorbs noise smaller than that.
const ZOOM_LEVELS_PER_DOUBLING = 6;

/**
 * Snaps a camera zoom value to the nearest of a fixed ladder of levels,
 * spaced evenly on a log scale (so each step feels like the same amount of
 * "zoom" at any magnification). Use the result, not the raw zoom, when
 * computing grid cell indices - see `ZOOM_LEVELS_PER_DOUBLING` for why.
 */
export function quantizeZoomForGrid(zoom: number): number {
  if (!Number.isFinite(zoom) || zoom <= 0) {
    return 1;
  }
  const level = Math.round(Math.log2(zoom) * ZOOM_LEVELS_PER_DOUBLING);
  return 2 ** (level / ZOOM_LEVELS_PER_DOUBLING);
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
 * The screen-space equivalent for an axis with no pan of its own (the Y axis
 * in Stage 0: voter count maps straight to a screen position that never
 * shifts under panning). `zoom` still narrows the bands as it grows, purely
 * so that two items tied on X (identical score, which horizontal zoom can
 * never separate - multiplying equal numbers by the same zoom keeps them
 * equal) can still resolve into two dots once their vote counts differ
 * enough. Pass 1 for an axis that should never get more precise.
 */
export function screenPositionToCellIndex(
  screenPosition: number,
  zoom: number,
  cellSizePixels: number,
): number {
  if (
    !Number.isFinite(screenPosition) ||
    !Number.isFinite(zoom) ||
    zoom <= 0 ||
    cellSizePixels <= 0
  ) {
    return 0;
  }
  return Math.floor((screenPosition * zoom) / cellSizePixels);
}
