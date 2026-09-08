import { WorldViewport } from "./features/world/WorldViewport";

export default function App() {
  return (
    // h-dvh, not h-screen (100vh): on mobile, 100vh is measured against the
    // viewport with browser chrome hidden, so bottom-anchored content can
    // end up hidden behind the address bar or gesture area - most visibly
    // right after rotating, before the browser recalculates. 100dvh tracks
    // the actually-visible area at all times.
    <main className="h-dvh w-screen overflow-hidden bg-white">
      <WorldViewport />
    </main>
  );
}
