interface ItemDotProps {
  screenX: number;
  screenY: number;
  title: string;
  // Whether a label should be drawn at all: the caller decides this (only a
  // dot alone in its cell is ever eligible, and even then only if showing
  // its label wouldn't collide with another one - see labelDeclutter.ts),
  // not this component.
  showLabel: boolean;
  sizePx: number;
  opacity: number;
  isVotable: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onSelect: () => void;
}

// The dot and its label are siblings, not parent/child: opacity applies to
// an element's whole subtree in CSS, so a label nested inside a dimmed dot
// would be dimmed along with it and become hard to read for a lone item.
export function ItemDot({
  screenX,
  screenY,
  title,
  showLabel,
  sizePx,
  opacity,
  isVotable,
  onHoverStart,
  onHoverEnd,
  onSelect,
}: ItemDotProps) {
  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard access to items is tracked as Stage 1 work (docs/05-supporting-features.md, decision S6), not built yet. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: same as above - S6 covers this dot too. */}
      <div
        data-testid="item-dot"
        // Rules R10/R11: blue = votable, grey = locked (logged out, or
        // already voted once batch 7 exists).
        className={`-translate-x-1/2 -translate-y-1/2 absolute cursor-pointer rounded-full ${
          isVotable ? "bg-blue-600" : "bg-neutral-500"
        }`}
        style={{ left: screenX, top: screenY, width: sizePx, height: sizePx, opacity }}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        onClick={onSelect}
      />
      {showLabel && (
        <span
          data-testid="item-label"
          // A solid backdrop and a z-index above the plain dots: two lone
          // items with close voter counts can sit only a few pixels apart
          // vertically, and without this, a nearby dot bled into the text
          // (or the text bled into it) and made both hard to read.
          className="-translate-x-1/2 absolute z-10 whitespace-nowrap rounded-sm bg-white/90 px-0.5 text-[10px] text-neutral-700"
          style={{ left: screenX, top: screenY + sizePx / 2 + 4 }}
        >
          {title}
        </span>
      )}
    </>
  );
}
