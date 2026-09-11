import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useIntroStore } from "./introStore";

// Under the 2-second ceiling from the manual test guide, with room to spare.
// Exported so tests can advance fake timers by exactly this much, rather
// than a hardcoded copy that would go stale the next time this is tuned.
export const TRANSITION_MS = 600;

/**
 * The intro screen (batch 11) and the "?" button's reopened explanation
 * (product spec 2.3) are the same component - reopening later is not a
 * distinct, first-load-only experience.
 *
 * Note on the visual: the product spec (9.5, W3) called for a literal
 * pivot-balancing wordmark and a seesaw loading icon, back when the product
 * was named "Teeter". Per the naming discussion (docs/06-naming-brainstorm.md)
 * - the map no longer reads as a literal seesaw, and the name changed to
 * "Better Than" - so this deliberately uses an abstract tilt and an abstract
 * bounce rather than a beam/fulcrum motif that no longer matches the name.
 */
export function IntroScreen() {
  const isOpen = useIntroStore((state) => state.isOpen);
  const close = useIntroStore((state) => state.close);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isExiting) {
      return;
    }
    const timeout = setTimeout(close, TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [isExiting, close]);

  // isExiting is local, not store state, so reopening (the "?" button) after
  // a previous close needs its own reset - otherwise it would reappear
  // already mid-exit-transition.
  useEffect(() => {
    if (isOpen) {
      setIsExiting(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      data-testid="intro-screen"
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white px-6 text-center transition-all duration-[600ms] ease-in-out ${
        isExiting ? "scale-90 opacity-0" : "scale-100 opacity-100"
      }`}
    >
      <h1 className="animate-teeter-tilt font-bold text-5xl text-neutral-900">Better Than</h1>
      <p className="animate-tagline-breathe text-lg text-neutral-600">Everyone's tier list.</p>
      <p className="max-w-sm text-neutral-500 text-sm">
        Every item's position says what people think of it - side to side for loved or hated, up for
        how many people have weighed in. Drag an item to cast your own vote.
      </p>
      {isExiting ? (
        <div data-testid="intro-loading-indicator" className="flex gap-2" aria-hidden="true">
          <span className="h-2 w-2 animate-seesaw-bounce rounded-full bg-neutral-400" />
          <span
            className="h-2 w-2 animate-seesaw-bounce rounded-full bg-neutral-400"
            style={{ animationDelay: "0.3s" }}
          />
        </div>
      ) : (
        <Button onClick={() => setIsExiting(true)}>Start</Button>
      )}
    </div>
  );
}
