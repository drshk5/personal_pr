import { Skeleton } from "@/components/ui/skeleton";

export function TaskCardSkeleton() {
  return (
    <div className="bg-card border border-border-color rounded-lg p-3 space-y-3">
      {/* Priority bar and title */}
      <div className="flex items-start gap-2">
        <Skeleton className="h-20 w-1 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      
      {/* Meta info */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      
      {/* Tags/icons */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Kanban columns skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="shrink-0 w-80 space-y-4">
            {/* Column header */}
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-12" />
            </div>

            {/* Cards in column */}
            <div className="space-y-3">
              {[1, 2, 3].map((card) => (
                <TaskCardSkeleton key={card} />
              ))}
            </div>

            {/* Add card button skeleton */}
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoardListSkeleton() {
  return (
    <div className="space-y-3">
      {/* Table rows skeleton */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
        <Skeleton key={row} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function BoardCalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <Skeleton key={day} className="h-10 w-full rounded-lg" />
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BoardViewSkeleton({ viewType }: { viewType?: string }) {
  // Render different skeletons based on view type
  if (viewType === "List") {
    return <BoardListSkeleton />;
  }

  if (viewType === "Calendar") {
    return <BoardCalendarSkeleton />;
  }

  // Default to kanban/section view skeleton
  return <BoardSkeleton />;
}
