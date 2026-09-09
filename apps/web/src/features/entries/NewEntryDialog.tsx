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
import { computeFocusCameraY, useCameraStore } from "../world/cameraStore";
import { getFullEffectiveItems } from "../world/effectiveItems";
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

    // item itself is the raw, un-voted-on, undrifted record entriesStore
    // holds - for a duplicate link on an item that's since been voted on
    // (or nudged by the batch 10 background simulation), using it directly
    // would aim the camera at its stale starting position instead of where
    // it actually sits now.
    const allItems = getFullEffectiveItems();
    const effectiveTarget = allItems.find((candidate) => candidate.id === item.id) ?? item;
    const { cameraY, viewportWidth } = useCameraStore.getState();
    const targetCamera = computeFocusCamera(effectiveTarget, allItems, viewportWidth);
    const targetCameraY = computeFocusCameraY(effectiveTarget, cameraY.zoomY);
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
