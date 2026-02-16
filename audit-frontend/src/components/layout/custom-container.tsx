import { type ReactNode } from "react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface CustomContainerProps {
  children: ReactNode;
  className?: string;
}

const CustomContainer = ({
  children,
  className = "",
}: CustomContainerProps) => {
  const { state } = useSidebar();
  const isSidebarExpanded = state === "expanded";

  return (
    <div
      className={cn(
        "container py-4 sm:py-6 px-2 sm:px-4 md:px-6 lg:px-8 transition-[max-width] duration-200 ease-linear will-change-[max-width]",
        isSidebarExpanded
          ? "max-w-full sm:max-w-[calc(100vw)]"
          : "mx-auto max-w-full sm:max-w-[calc(100vw-3rem-3rem)]",
        className
      )}
    >
      {children}
    </div>
  );
};

export default CustomContainer;
