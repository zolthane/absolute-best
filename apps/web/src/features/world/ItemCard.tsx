import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Item } from "../../data/mockItems";

interface ItemCardProps {
  item: Item;
  screenX: number;
  screenY: number;
}

// Positioned just above the dot it describes, horizontally centred on it -
// unless that would push it off the top of the screen (a high-voter-count
// item's dot can sit very close to the top), in which case it flips below.
const CARD_WIDTH_PX = 224;
const CARD_OFFSET_FROM_DOT_PX = 12;
// A rough estimate of the card's own rendered height (image + header + tag
// row), not a measurement - good enough to decide which side has room
// without the complexity of a measure-then-position render pass.
const CARD_HEIGHT_ESTIMATE_PX = 220;

export function ItemCard({ item, screenX, screenY }: ItemCardProps) {
  const roomAbove = screenY - CARD_HEIGHT_ESTIMATE_PX - CARD_OFFSET_FROM_DOT_PX >= 0;
  const transform = roomAbove
    ? `translate(-50%, calc(-100% - ${CARD_OFFSET_FROM_DOT_PX}px))`
    : `translate(-50%, ${CARD_OFFSET_FROM_DOT_PX}px)`;

  return (
    <Card
      data-testid="item-card"
      // z-20: must beat ItemDot's label (z-10) - without an explicit
      // z-index a positioned sibling with one always wins the stack
      // regardless of DOM order, so the card was rendering under a nearby
      // item's name.
      className="pointer-events-none absolute z-20 shadow-lg"
      style={{
        left: screenX,
        top: screenY,
        width: CARD_WIDTH_PX,
        transform,
      }}
    >
      <CardHeader>
        {/* Stage 0 has no real images (docs/01-product-spec.md, "Not yet
            covered"); a plain placeholder stands in rather than fetching one
            from a third-party service. */}
        <div className="h-20 w-full rounded-md bg-muted" aria-hidden="true" />
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>
          Score {item.score} · {item.voterCount} {item.voterCount === 1 ? "voter" : "voters"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1">
        {item.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </CardContent>
    </Card>
  );
}
