import { computeFocusCamera, searchItems } from "@teeter/shared";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { type Item, mockItems } from "../../data/mockItems";
import { effectiveItem, useVoteStore } from "../vote/voteStore";
import { computeFocusCameraY, useCameraStore } from "../world/cameraStore";
import { useFocusStore } from "../world/focusStore";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const votes = useVoteStore((state) => state.votes);
  const settlingScores = useVoteStore((state) => state.settlingScores);

  // Search reads the same effective (vote-applied) data WorldViewport does -
  // titles never change from voting, but the score/voter count used to aim
  // the camera at a result does.
  const effectiveItems = mockItems.map((mockItem) =>
    effectiveItem(mockItem, votes, settlingScores),
  );
  const results = searchItems(effectiveItems, query);
  const isSearching = query.trim() !== "";

  const handleSelect = (item: Item) => {
    const { cameraY, viewportWidth } = useCameraStore.getState();
    const targetCamera = computeFocusCamera(item, effectiveItems, viewportWidth);
    const targetCameraY = computeFocusCameraY(item, cameraY.zoomY);
    useCameraStore.getState().animateTo(targetCamera, targetCameraY);
    useFocusStore.getState().setFocusedItemId(item.id);
    setQuery("");
  };

  return (
    <div data-testid="search-box" className="relative w-full max-w-[220px]">
      <Input
        type="text"
        placeholder="Search items..."
        aria-label="Search items"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {isSearching && (
        <div
          data-testid="search-results"
          className="absolute top-full right-0 left-0 z-20 mt-1 rounded-lg border border-border bg-background shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-2.5 py-1.5 text-muted-foreground text-sm">No matches found</p>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="block w-full px-2.5 py-1.5 text-left text-sm hover:bg-muted"
              >
                {item.title}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
