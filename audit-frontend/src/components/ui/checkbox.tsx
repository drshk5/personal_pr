"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Base styles
      "peer h-5 w-5 shrink-0 rounded-md border border-border-color transition-colors cursor-pointer",
      "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary",
      "bg-primary/10",
      "hover:border-border-color hover:bg-primary/20 hover:shadow-sm",
      "focus-visible:outline-none focus-visible:border-border-color focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
      "disabled:cursor-not-allowed disabled:opacity-50",

      // Light mode styles

      // Dark mode styles
      "dark:focus-visible:ring-border-color/20",

      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-white")}
    >
      <Check className="h-4 w-4 stroke-4 stroke-current" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
