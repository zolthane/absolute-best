interface ItemDotProps {
  screenX: number;
  screenY: number;
  title: string;
  count: number;
  sizePx: number;
  opacity: number;
}

// The dot and its label are siblings, not parent/child: opacity applies to
// an element's whole subtree in CSS, so a label nested inside a dimmed dot
// would be dimmed along with it and become hard to read for a lone item.
export function ItemDot({ screenX, screenY, title, count, sizePx, opacity }: ItemDotProps) {
  return (
    <>
      <div
        data-testid="item-dot"
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-black"
        style={{ left: screenX, top: screenY, width: sizePx, height: sizePx, opacity }}
      />
      {count === 1 && (
        <span
          data-testid="item-label"
          className="-translate-x-1/2 absolute whitespace-nowrap text-[10px] text-neutral-700"
          style={{ left: screenX, top: screenY + sizePx / 2 + 4 }}
        >
          {title}
        </span>
      )}
    </>
  );
}
