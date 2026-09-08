import { cn } from "cn";
import type * as React from "react";

// A trimmed-down version of shadcn's Badge: this project only ever needs one
// plain pill style (for an item's invented tags), not the full set of
// semantic variants - see shadcn/ui's own "you own this code" philosophy
// (docs/02-tech-stack.md).
function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-border bg-muted px-2 py-0.5 text-muted-foreground text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
