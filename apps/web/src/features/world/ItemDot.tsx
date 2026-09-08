interface ItemDotProps {
  screenX: number;
  screenY: number;
}

// A plain, uniform dot for now - colour (blue = votable, grey = locked) is
// R10, wired up once logins exist in batch 6; density-based sizing for
// crowded cells is batch 3's grid sampling. This is deliberately the
// simplest thing that shows an item exists at all.
export function ItemDot({ screenX, screenY }: ItemDotProps) {
  return (
    <div
      data-testid="item-dot"
      className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-500"
      style={{ left: screenX, top: screenY }}
    />
  );
}
