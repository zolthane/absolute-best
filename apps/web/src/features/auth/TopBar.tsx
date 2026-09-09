import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchBox } from "../search/SearchBox";
import { AuthDialog } from "./AuthDialog";
import { useAuthStore } from "./authStore";

// A cosmetic "people on site" figure - Stage 0 has no server to count real
// visitors, so it gently random-walks instead (docs/99-glossary.md:
// WebSocket entry - "Stage 0 simulates this with a timer instead").
const PRESENCE_BASE = 60;
const PRESENCE_SPREAD = 30;
const PRESENCE_UPDATE_MS = 4000;
const PRESENCE_STEP = 2;

function useSimulatedPresence(): number {
  const [count, setCount] = useState(
    () => PRESENCE_BASE + Math.floor(Math.random() * PRESENCE_SPREAD),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const step = Math.floor(Math.random() * (PRESENCE_STEP * 2 + 1)) - PRESENCE_STEP;
      setCount((current) => Math.max(1, current + step));
    }, PRESENCE_UPDATE_MS);
    return () => clearInterval(interval);
  }, []);

  return count;
}

export function TopBar() {
  const username = useAuthStore((state) => state.username);
  const logout = useAuthStore((state) => state.logout);
  const presence = useSimulatedPresence();

  return (
    <div
      data-testid="top-bar"
      className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between p-3"
    >
      <span data-testid="presence-count" className="text-neutral-500 text-xs">
        {presence} on site
      </span>

      <SearchBox />

      <div className="flex items-center gap-2">
        {username ? (
          <>
            <span data-testid="username" className="text-sm">
              {username}
            </span>
            <Button variant="outline" onClick={logout}>
              Log out
            </Button>
          </>
        ) : (
          <>
            <AuthDialog mode="login" />
            <AuthDialog mode="register" />
          </>
        )}
      </div>
    </div>
  );
}
