import * as React from "react";

import { cn } from "@/lib/utils";

// Use type alias instead of empty interface
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles
          "flex min-h-20 w-full rounded-md border border-border-color px-3 py-2 text-sm transition-all",
          "placeholder:text-muted-foreground text-foreground",
          "hover:border-border-color hover:shadow-sm",
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
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
