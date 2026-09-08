/**
 * Picks a set of evenly-spaced, round-number tick values to label an axis
 * covering [min, max] - the classic "nice numbers" approach used by most
 * charting libraries, so labels read as 20, 50, 100 rather than 19, 51, 103.
 *
 * `minStep` floors the spacing between ticks - pass 1 for an axis whose
 * values can only ever be whole numbers (a vote score, a count of people),
 * so zooming in never labels a point that could not possibly exist, such
 * as "48.5". Defaults to 0 (no floor), since not every axis is integer-only.
 */
export function computeNiceTicks(min: number, max: number, targetCount = 8, minStep = 0): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min || targetCount <= 0) {
    return [];
  }

  const step = Math.max(niceStep((max - min) / targetCount), minStep);
  if (step <= 0) {
    return [];
  }

  const start = roundToStepPrecision(Math.ceil(min / step) * step, step);
  const ticks: number[] = [];
  // A generous but finite cap: guards against an infinite loop if floating
  // point error ever stalls the increment, without limiting normal use.
  const maxTicks = targetCount * 4 + 4;

  for (
    let value = start;
    value <= max + step / 2 && ticks.length < maxTicks;
    value = roundToStepPrecision(value + step, step)
  ) {
    ticks.push(value === 0 ? 0 : value);
  }

  return ticks;
}

function niceStep(rawStep: number): number {
  if (rawStep <= 0) {
    return 0;
  }
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / magnitude;

  let niceFraction: number;
  if (fraction <= 1) {
    niceFraction = 1;
  } else if (fraction <= 2) {
    niceFraction = 2;
  } else if (fraction <= 5) {
    niceFraction = 5;
  } else {
    niceFraction = 10;
  }

  return niceFraction * magnitude;
}

function roundToStepPrecision(value: number, step: number): number {
  const decimals = step >= 1 ? 0 : Math.min(10, Math.ceil(-Math.log10(step)));
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
