import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-gray-200 dark:bg-gray-700 rounded-md relative overflow-hidden",
        // Pulse animation
        "animate-pulse",
        // Add a subtle shimmer effect
        "after:absolute after:inset-0 after:-translate-x-full after:bg-linear-to-r after:from-transparent after:via-white/20 after:to-transparent",
        "after:animate-[shimmer_2s_infinite]",
        // Enhanced visibility with Tailwind colors
        "bg-slate-200 dark:bg-gray-700/60",
        "border border-border-color ",
        className
      )}
      style={{
        ...props.style,
      }}
      {...props}
    />
  );
}

export { Skeleton };
