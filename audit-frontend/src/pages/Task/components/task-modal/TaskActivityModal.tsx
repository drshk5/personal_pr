import { Activity, Calendar, Timer } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import type { TaskListItem } from "@/types/task/task";
import { useGetTaskActivity } from "@/hooks/api/task/use-task-timer";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskListItem | null;
}

const formatTimeHHMMSS = (timeStr: string | null | undefined) => {
  if (!timeStr || timeStr === "00:00:00") return "—";

  const parts = timeStr.split(":");
  if (parts.length !== 3) return timeStr;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);

  if (hours === 0 && minutes === 0 && seconds === 0) return "—";

  if (hours === 0) {
    if (seconds === 0) return `${minutes}m`;
    return `${minutes}m ${seconds}s`;
  } else if (minutes === 0 && seconds === 0) {
    return `${hours}h`;
  } else if (seconds === 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
};

const formatTimeWithAmPm = (dateTimeStr: string) => {
  const formatted = new Date(dateTimeStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return formatted.replace(/\s?(am|pm)$/i, (match, period) =>
    match.replace(period, period.toUpperCase())
  );
};

const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    "Not Started": "bg-gray-100 text-gray-800",
    Started: "bg-blue-100 text-blue-800",
    "On Hold": "bg-yellow-100 text-yellow-800",
    Completed: "bg-green-100 text-green-800",
    Incomplete: "bg-red-100 text-red-800",
    "For Review": "bg-red-100 text-red-800",
  };
  return statusColors[status] || "bg-gray-100 text-gray-800";
};

export function TaskActivityModal({
  open,
  onOpenChange,
  task,
}: TaskActivityModalProps) {
  const taskGuid = task?.strTaskGUID;
  const { data: activityResponse, isLoading } = useGetTaskActivity(
    taskGuid,
    open
  );
  const activity = activityResponse?.activity || task?.activity || [];
  const hasActivity = activity.length > 0;

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Task Activity Timeline"
      description={task?.strTitle || ""}
      maxWidth="700px"
    >
      <div className="max-h-[calc(90vh-120px)] min-h-75 sm:min-h-100 md:min-h-125 flex flex-col overflow-hidden">
        {isLoading && !hasActivity ? (
          <div className="flex-1 flex flex-col gap-4 px-3 sm:px-4 md:px-6 py-4">
            <div className="p-3 sm:p-4 rounded-xl border border-border-color bg-muted/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-3 w-20 ml-auto" />
                  <Skeleton className="h-6 w-10 ml-auto" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 items-start rounded-lg border border-border-color bg-card/50 p-3"
                >
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-52" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : hasActivity ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header with Total Time */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 p-3 sm:p-4 bg-linear-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 shrink-0 mx-3 sm:mx-4 md:mx-6 mt-4 sm:mt-5 md:mt-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Time
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-primary mt-0.5">
                    {formatTimeHHMMSS(task?.strTotalTime)}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                  Total Entries
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground sm:text-center mt-0.5">
                  {activity.length}
                </p>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="relative flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <div className="space-y-4">
                {[...activity]
                  .sort(
                    (a, b) =>
                      new Date(a.dtStartTime).getTime() -
                      new Date(b.dtStartTime).getTime()
                  )
                  .map((activity, index) => (
                    <div
                      key={index}
                      className="relative flex gap-2 sm:gap-3 items-start"
                    >
                      {/* Timeline Dot */}
                      <div className="relative z-10 shrink-0 pt-0.5 sm:pt-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-8.5 md:h-8.5 rounded-full bg-primary/5 border border-primary flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                        </div>
                      </div>

                      {/* Activity Card */}
                      <div className="flex-1 min-w-0">
                        <div className="p-2.5 sm:p-3 md:p-3 border border-border-color rounded-lg hover:border-primary/30 hover:shadow-sm transition-all bg-card/50">
                          <div className="flex flex-col gap-2 sm:gap-3">
                            <div className="flex-1 space-y-2 sm:space-y-2">
                              {/* Date */}
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
                                <span className="font-semibold text-xs sm:text-sm text-foreground">
                                  {new Date(
                                    activity.dtStartTime
                                  ).toLocaleString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>

                              {/* Grid Layout: Times | Status/Reason | Duration */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-12 md:pl-5 md:items-center">
                                {/* Start & End Time - Side by Side */}
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                      Start Time
                                    </p>
                                    <p className="text-xs font-semibold text-foreground">
                                      {formatTimeWithAmPm(
                                        activity.dtStartTime
                                      )}
                                    </p>
                                  </div>
                                  {activity.dtEndTime && (
                                    <div className="space-y-0.5">
                                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                                        End Time
                                      </p>
                                      <p className="text-xs font-semibold text-foreground">
                                        {formatTimeWithAmPm(
                                          activity.dtEndTime
                                        )}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Status and Reason */}
                                {(activity.strStatus ||
                                  activity.strDescription) && (
                                  <div className="space-y-1.5 sm:space-y-1.5">
                                    {/* Status */}
                                    {activity.strStatus && (
                                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                        <p className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                                          Status:
                                        </p>
                                        <span
                                          className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(
                                            activity.strStatus
                                          )}`}
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                          {activity.strStatus}
                                        </span>
                                      </div>
                                    )}

                                    {/* Reason */}
                                    {activity.strDescription && (
                                      <div className="flex gap-1.5 sm:gap-2">
                                        <p className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                                          Reason:
                                        </p>
                                        <p
                                          className="text-[10px] sm:text-xs text-foreground line-clamp-2"
                                          title={activity.strDescription}
                                        >
                                          {activity.strDescription}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Duration Badge */}
                                <div className="flex items-center justify-start md:justify-end md:text-right shrink-0">
                                  <div className="flex flex-col md:items-end">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 md:mb-0.5">
                                      Duration
                                    </p>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-lg">
                                      <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                                      <span className="text-xs sm:text-sm font-bold text-primary">
                                        {activity.strActualTime}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="flex-1 flex items-center justify-center py-8 sm:py-12 text-center px-4">
            <div>
              <div className="inline-flex p-3 sm:p-4 bg-muted rounded-full mb-3 sm:mb-4">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-sm sm:text-base font-medium text-foreground">
                No Activity Recorded
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Activity will appear here once time tracking begins
              </p>
            </div>
          </div>
        )}
      </div>
    </ModalDialog>
  );
}
