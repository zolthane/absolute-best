/**
 * Maps a value on a logarithmic domain to a linear screen position - the Y
 * axis's "each step up means ten times as many voters" behaviour (product
 * spec, section 2). A log scale is undefined at and below zero, so a value
 * at or below domainMin is treated as domainMin itself, rather than
 * producing -Infinity or NaN - an item with 0 or 1 voters simply sits at
 * the bottom of the range, which is the correct place for it visually.
 */
export function logScale(
  value: number,
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number,
): number {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(domainMin) ||
    !Number.isFinite(domainMax) ||
    !Number.isFinite(rangeMin) ||
    !Number.isFinite(rangeMax) ||
    domainMin <= 0 ||
    domainMax <= domainMin
  ) {
    return rangeMin;
  }

  const clampedValue = Math.min(Math.max(value, domainMin), domainMax);
  const logMin = Math.log10(domainMin);
  const logMax = Math.log10(domainMax);
  const t = (Math.log10(clampedValue) - logMin) / (logMax - logMin);

  return rangeMin + t * (rangeMax - rangeMin);
}
