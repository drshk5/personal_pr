import { Clock } from "lucide-react";
import { formatDate, getImagePath } from "@/lib/utils";
import { useTaskActivityLogs } from "@/hooks/api/task/use-task-activity-log";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ActivityTabProps {
  taskGuid: string;
}

export function ActivityTab({ taskGuid }: ActivityTabProps) {
  const {
    data: activityLogs,
    isLoading,
    error,
  } = useTaskActivityLogs(taskGuid);
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3 rounded-lg border-border-color bg-card space-y-2"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-12 w-12 text-destructive/50 mb-3" />
        <p className="text-sm text-destructive">Failed to load activity logs</p>
      </div>
    );
  }

  if (!activityLogs || activityLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No activities yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Activities will appear here when you start working on this task
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3 w-full overflow-x-hidden">
      {activityLogs.map((activity) => (
        <div
          key={activity.strTaskActivityLogGUID}
          className="flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-border-color bg-card transition-colors w-full overflow-hidden"
        >
          <div className="shrink-0 mt-0.5">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
              <AvatarImage
                src={getImagePath(activity.strProfileImg || "") as string}
                alt={activity.strUserName || "User"}
              />
              <AvatarFallback className="text-[10px] sm:text-xs bg-primary/10 text-primary">
                {(activity.strUserName || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-xs sm:text-sm font-medium text-foreground break-all">
                  {activity.strUserName || "Unknown User"}
                </div>
                <p className="text-sm text-muted-foreground break-all line-clamp-2 overflow-hidden">
                  {activity.strDetails || "No details available."}
                </p>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {formatDate(activity.dtActivityTime, true)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
