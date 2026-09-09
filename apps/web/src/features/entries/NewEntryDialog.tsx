import { computeFocusCamera } from "@teeter/shared";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockItems } from "../../data/mockItems";
import { effectiveItem, useVoteStore } from "../vote/voteStore";
import { computeFocusCameraY, useCameraStore } from "../world/cameraStore";
import { useFocusStore } from "../world/focusStore";
import { useEntriesStore } from "./entriesStore";

export function NewEntryDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const inputId = useId();
  const trimmedUrl = url.trim();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmedUrl) {
      return;
    }

    // addEntry itself decides new-vs-duplicate (see entriesStore) - either
    // way, flying the camera to the result and focusing it is what makes a
    // duplicate paste visibly "show you the existing item" rather than
    // silently doing nothing.
    const item = useEntriesStore.getState().addEntry(trimmedUrl);

    const { votes, settlingScores } = useVoteStore.getState();
    const allItems = [
      ...mockItems,
      ...Object.values(useEntriesStore.getState().itemsByIdentifier),
    ].map((candidate) => effectiveItem(candidate, votes, settlingScores));
    const { cameraY, viewportWidth } = useCameraStore.getState();
    const targetCamera = computeFocusCamera(item, allItems, viewportWidth);
    const targetCameraY = computeFocusCameraY(item, cameraY.zoomY);
    useCameraStore.getState().animateTo(targetCamera, targetCameraY);
    useFocusStore.getState().setFocusedItemId(item.id);

    setOpen(false);
    setUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">New entry</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add an entry</DialogTitle>
            <DialogDescription>
              Paste a link. No page is actually fetched in this prototype - the same link always
              resolves to the same item, so pasting one already added just takes you to it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor={inputId}>Link</Label>
            <Input
              id={inputId}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!trimmedUrl}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
