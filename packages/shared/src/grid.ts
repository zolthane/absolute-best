export interface GridCellAssignment {
  cellCol: number;
  cellRow: number;
}

// How far (as a fraction, e.g. 0.12 = 12%) the raw camera zoom must move
// away from the zoom the grid last used before the grid updates at all.
const GRID_ZOOM_DEADZONE_RATIO = 0.12;

/**
 * Decides what zoom value the grid should use this render, given what it
 * used last time and what the camera's raw zoom is now. Only moves when
 * `rawZoom` has drifted more than `GRID_ZOOM_DEADZONE_RATIO` away from
 * `previousGridZoom`, in either direction - otherwise it holds still.
 *
 * This is a dead-zone around the *previous result*, not a fixed ladder of
 * thresholds: an earlier version snapped zoom to the nearest of a fixed set
 * of levels, which is vulnerable to a coin-flip - a raw zoom sitting a
 * floating-point epsilon away from one of those fixed lines would flip the
 * entire grid on the next, arbitrarily small, change (confirmed: a change
 * of 1e-12 was enough). Because this dead zone re-centres on wherever the
 * grid last settled, there is no fixed line to sit near, so noise far
 * smaller than the dead zone can never flip it - only a real, sustained
 * zoom of a meaningful size can.
 */
export function nextGridZoom(previousGridZoom: number, rawZoom: number): number {
  if (!Number.isFinite(rawZoom) || rawZoom <= 0) {
    return previousGridZoom;
  }
  if (!Number.isFinite(previousGridZoom) || previousGridZoom <= 0) {
    return rawZoom;
  }
  const ratio = rawZoom / previousGridZoom;
  const hasDriftedOutOfDeadzone =
    ratio > 1 + GRID_ZOOM_DEADZONE_RATIO || ratio < 1 / (1 + GRID_ZOOM_DEADZONE_RATIO);
  return hasDriftedOutOfDeadzone ? rawZoom : previousGridZoom;
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
