interface ItemDotProps {
  itemId: string;
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
  // Product spec section 3: "the chosen item is highlighted". Batch 7 also
  // uses this to mean "grabbable" - only a focused dot's pointerdown can
  // start a vote drag (see WorldViewport, which reads itemId back off the
  // DOM at pointerdown via data-item-id).
  isFocused: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onSelect: () => void;
}

// The dot and its label are siblings, not parent/child: opacity applies to
// an element's whole subtree in CSS, so a label nested inside a dimmed dot
// would be dimmed along with it and become hard to read for a lone item.
export function ItemDot({
  itemId,
  screenX,
  screenY,
  title,
  showLabel,
  sizePx,
  opacity,
  isVotable,
  isFocused,
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
        data-item-id={itemId}
        // Rules R10/R11: blue = votable, grey = locked (logged out, already
        // voted, or not the focused item). A focused dot gets a ring so it
        // is clear which one is grabbable (product spec section 3).
        className={`-translate-x-1/2 -translate-y-1/2 absolute cursor-pointer rounded-full ${
          isVotable ? "bg-blue-600" : "bg-neutral-500"
        } ${isFocused ? "ring-2 ring-black ring-offset-1" : ""}`}
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
          // pointer-events-none: purely decorative, not clickable - without
          // this, a click landing on a label's padded backdrop (which reads
          // as empty space to the user) became the click's target instead of
          // world-content underneath it, so handleBackgroundClick's
          // target-is-currentTarget check silently failed and the focused
          // item's card looked stuck open.
          className="-translate-x-1/2 absolute z-10 whitespace-nowrap rounded-sm bg-white/90 px-0.5 text-[10px] text-neutral-700 pointer-events-none"
          style={{ left: screenX, top: screenY + sizePx / 2 + 4 }}
        >
          {title}
        </span>
      )}
    </>
  );
}
