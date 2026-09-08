import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Item } from "../../data/mockItems";

interface ItemCardProps {
  item: Item;
  screenX: number;
  screenY: number;
}

// Positioned just above the dot it describes, horizontally centred on it.
const CARD_WIDTH_PX = 224;
const CARD_OFFSET_ABOVE_DOT_PX = 12;

export function ItemCard({ item, screenX, screenY }: ItemCardProps) {
  return (
    <Card
      data-testid="item-card"
      className="pointer-events-none absolute shadow-lg"
      style={{
        left: screenX,
        top: screenY,
        width: CARD_WIDTH_PX,
        transform: `translate(-50%, calc(-100% - ${CARD_OFFSET_ABOVE_DOT_PX}px))`,
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
