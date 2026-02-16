import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "flex h-10 w-full min-w-0 rounded-md px-3 shadow-xs py-2 text-sm transition-all",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground text-foreground",
        "border border-border-color",
        "hover:border-border-color hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:border-border-color",

        // Light mode styles
        "bg-white",
        "disabled:bg-white/50",

        // Dark mode styles
        "dark:bg-white/10",
        "dark:focus-visible:ring-border-color/20",
        "dark:disabled:bg-white/3",

        // Validation
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  );
}

export { Input };
