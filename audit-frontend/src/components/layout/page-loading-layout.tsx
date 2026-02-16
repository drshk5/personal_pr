import { ContentSkeleton } from "@/components/data-display/skeleton/content-skeleton";
import { useContextSwitches } from "@/hooks/common/use-context-switches";
import type { ReactNode } from "react";

interface PageLoadingLayoutProps {
  children: ReactNode;
}

export function PageLoadingLayout({ children }: PageLoadingLayoutProps) {
  const { isSwitchingContext } = useContextSwitches();

  return <>{isSwitchingContext ? <ContentSkeleton /> : children}</>;
}
