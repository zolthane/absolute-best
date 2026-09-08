// Matches ItemDot's own label offset (screenY + sizePx/2 + 4) - kept in sync
// manually since the two live in different packages; a mismatch here would
// only make the collision check slightly conservative or lenient, never
// wrong in a way that breaks rendering.
const LABEL_DOT_GAP_PX = 4;

export interface LabelCandidate {
  id: string;
  screenX: number;
  screenY: number;
  dotSizePx: number;
  // Higher wins when two candidate labels would collide.
  priority: number;
  labelWidthPx: number;
  labelHeightPx: number;
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function boxesOverlap(a: Box, b: Box): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function dotBox(candidate: LabelCandidate): Box {
  const half = candidate.dotSizePx / 2;
  return {
    left: candidate.screenX - half,
    right: candidate.screenX + half,
    top: candidate.screenY - half,
    bottom: candidate.screenY + half,
  };
}

function labelBox(candidate: LabelCandidate): Box {
  const halfWidth = candidate.labelWidthPx / 2;
  const top = candidate.screenY + candidate.dotSizePx / 2 + LABEL_DOT_GAP_PX;
  return {
    left: candidate.screenX - halfWidth,
    right: candidate.screenX + halfWidth,
    top,
    bottom: top + candidate.labelHeightPx,
  };
}

/**
 * Decides which item labels can actually be drawn without colliding with
 * something - another label, or any dot (not just labelled ones). The dot
 * itself always renders regardless; this only ever hides the text next to
 * it. Higher-`priority` candidates are placed first and keep their label on
 * a conflict, so a well-established item is never the one hidden.
 *
 * A greedy placement, not true layout - deliberately simple, since the goal
 * is just "stop text overlapping" rather than an optimal arrangement (see
 * CLAUDE.md's simplicity-first rule).
 */
export function declutterLabels(
  allDots: readonly LabelCandidate[],
  labelCandidates: readonly LabelCandidate[],
): Set<string> {
  const dotBoxes = allDots.map(dotBox);
  const placedLabelBoxes: Box[] = [];
  const shown = new Set<string>();

  const sortedByPriority = [...labelCandidates].sort((a, b) => b.priority - a.priority);
  for (const candidate of sortedByPriority) {
    const box = labelBox(candidate);
    const collides =
      dotBoxes.some((dot) => boxesOverlap(box, dot)) ||
      placedLabelBoxes.some((placed) => boxesOverlap(box, placed));
    if (!collides) {
      shown.add(candidate.id);
      placedLabelBoxes.push(box);
    }
  }
  return shown;
}
