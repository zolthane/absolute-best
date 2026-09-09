import { computeFocusCamera, searchItems } from "@teeter/shared";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { computeFocusCameraY, useCameraStore } from "../world/cameraStore";
import { getFullEffectiveItems } from "../world/effectiveItems";
import { useFocusStore } from "../world/focusStore";

export function SearchBox() {
  const [query, setQuery] = useState("");

  // Recomputed on every render (cheap - see getFullEffectiveItems), so a
  // vote or a newly-added entry is reflected the next time this renders,
  // same as WorldViewport's own effectiveItems.
  const results = searchItems(getFullEffectiveItems(), query);
  const isSearching = query.trim() !== "";

  const handleSelect = (itemId: string) => {
    // Recomputed fresh here rather than reused from the results above: the
    // background living-world simulation (batch 10) can move an item's
    // score between when the dropdown was rendered and when it's clicked,
    // and the camera should aim at where the item actually is now, not
    // wherever it was a render or two ago.
    const effectiveItems = getFullEffectiveItems();
    const item = effectiveItems.find((candidate) => candidate.id === itemId);
    if (!item) {
      return;
    }
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
                onClick={() => handleSelect(item.id)}
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
