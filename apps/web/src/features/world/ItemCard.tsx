import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Item } from "../../data/mockItems";

interface ItemCardVote {
  // The proposed change to the item's score - live while still dragging,
  // frozen once released (product spec section 4: releasing does not vote).
  delta: number;
  // False while the drag is still in progress (a preview only); true once
  // released, meaning the Submit button should be shown (rule R9).
  isPending: boolean;
  onSubmit: () => void;
  // The single item this vote would overtake on the score axis, nearest in
  // voter count to this one - see findPassedItem. Absent when the vote
  // passes nothing (delta 0, or nothing lies between the old and new score).
  passedItemTitle?: string;
}

interface ItemCardAlternate {
  id: string;
  title: string;
}

interface ItemCardProps {
  item: Item;
  screenX: number;
  screenY: number;
  // Present only for the focused, currently-being-voted-on item - see
  // WorldViewport, which is the only place that ever supplies one.
  vote?: ItemCardVote;
  // The rest of a crowded cell's members, i.e. everyone else sharing this
  // exact dot - present only when there's more than one (see WorldViewport).
  // Some of these can be an unsolvable-by-zoom tie (an identical score and
  // voter count), so switching to one is the only way to ever reach it.
  alternates?: ItemCardAlternate[];
  onSelectAlternate?: (id: string) => void;
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

export function ItemCard({
  item,
  screenX,
  screenY,
  vote,
  alternates,
  onSelectAlternate,
}: ItemCardProps) {
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
      {alternates && alternates.length > 0 && (
        <CardContent data-testid="item-card-alternates" className="flex flex-col gap-1.5 border-t">
          <p className="text-muted-foreground text-xs">
            Sharing this spot ({alternates.length} more):
          </p>
          <div className="flex flex-wrap gap-1">
            {alternates.map((alternate) => (
              <button
                key={alternate.id}
                type="button"
                onClick={() => onSelectAlternate?.(alternate.id)}
                // Same reasoning as the Submit button below: the card itself
                // is pointer-events-none, this is the one part meant to be
                // clickable.
                className="pointer-events-auto rounded-full border border-border bg-background px-2 py-0.5 text-xs hover:bg-muted"
              >
                {alternate.title}
              </button>
            ))}
          </div>
        </CardContent>
      )}
      {vote && (
        <CardFooter className="flex-col items-stretch gap-1.5">
          <p data-testid="vote-preview" className="font-medium text-sm">
            {item.score} {vote.delta >= 0 ? "+" : "-"} {Math.abs(vote.delta)} ={" "}
            {item.score + vote.delta}
          </p>
          {vote.passedItemTitle && (
            <p data-testid="vote-passed-item" className="text-muted-foreground text-xs">
              Would pass: {vote.passedItemTitle}
            </p>
          )}
          {vote.isPending && (
            <>
              <Button
                type="button"
                onClick={vote.onSubmit}
                // The card above is pointer-events-none so a floating card
                // never steals clicks meant for the map beneath it - this is
                // the one part of it that should actually be clickable.
                className="pointer-events-auto w-full"
              >
                Submit vote: {vote.delta > 0 ? "+" : ""}
                {vote.delta}
              </Button>
              <p className="text-muted-foreground text-xs">This cannot be undone.</p>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
