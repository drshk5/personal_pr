import { Skeleton } from "@/components/ui/skeleton";

interface RenameScheduleSkeletonProps {
  expandAll?: boolean;
  itemCount?: number;
}

export function RenameScheduleSkeleton({
  expandAll = false,
  itemCount = 5,
}: RenameScheduleSkeletonProps) {
  return (
    <div className="w-full max-h-[75vh] overflow-auto chart-of-accounts-container overflow-x-auto md:overflow-x-visible">
      <div className="w-full min-w-fit md:min-w-0 space-y-1">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border-color mb-0 shadow-sm"
          >
            <div className="flex items-center gap-2 py-3 px-3">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-5 w-96" />
            </div>

            {expandAll && i < 4 && (
              <div className="pb-2 space-y-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={`${i}-${j}`}
                    className="bg-slate-200/30 dark:bg-muted/15 overflow-hidden mb-0.5 ml-2 mr-0"
                    style={{
                      paddingLeft: `${1 * 12 + 12}px`,
                    }}
                  >
                    <div className="flex items-center gap-2 py-2.5 pr-3">
                      <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                      <Skeleton className="h-4 w-80" />
                    </div>

                    {j < 2 && (
                      <div className="pb-1.5 space-y-0.5">
                        {Array.from({ length: 3 }).map((_, k) => (
                          <div
                            key={`${i}-${j}-${k}`}
                            className="bg-slate-200/60 dark:bg-muted/25 overflow-hidden mb-0.5"
                            style={{
                              paddingLeft: `${2 * 12 + 12}px`,
                            }}
                          >
                            <div className="flex items-center gap-2 py-2 pr-3">
                              <Skeleton className="h-3 w-3 rounded-sm" />
                              <Skeleton className="h-4 w-72" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
