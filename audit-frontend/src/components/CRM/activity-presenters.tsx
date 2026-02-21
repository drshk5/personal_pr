import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export function getActivityStatusLabel(status?: string | null): string {
  if (!status) return "Unknown";
  return status === "InProgress" ? "In Progress" : status;
}

export function ActivityTypeBadge({ type }: { type?: string | null }) {
  return (
    <Badge variant="outline" className="font-medium text-xs">
      {type || "Unknown"}
    </Badge>
  );
}

export function ActivityStatusBadge({ status }: { status?: string | null }) {
  const normalized = getActivityStatusLabel(status);
  const tone =
    status === "Completed"
      ? "border-emerald-300/80 text-emerald-700 dark:border-emerald-700/80 dark:text-emerald-300"
      : status === "InProgress"
      ? "border-blue-300/80 text-blue-700 dark:border-blue-700/80 dark:text-blue-300"
      : status === "Cancelled"
      ? "border-rose-300/80 text-rose-700 dark:border-rose-700/80 dark:text-rose-300"
      : "border-amber-300/80 text-amber-700 dark:border-amber-700/80 dark:text-amber-300";

  return (
    <Badge variant="outline" className={`font-medium text-xs ${tone}`}>
      {normalized}
    </Badge>
  );
}

export function ActivityPriorityBadge({
  priority,
}: {
  priority?: string | null;
}) {
  const tone =
    priority === "Urgent"
      ? "border-rose-300/80 text-rose-700 dark:border-rose-700/80 dark:text-rose-300"
      : priority === "High"
      ? "border-orange-300/80 text-orange-700 dark:border-orange-700/80 dark:text-orange-300"
      : priority === "Medium"
      ? "border-blue-300/80 text-blue-700 dark:border-blue-700/80 dark:text-blue-300"
      : "border-slate-300/80 text-slate-700 dark:border-slate-700/80 dark:text-slate-300";

  return (
    <Badge variant="outline" className={`font-medium text-xs ${tone}`}>
      {priority || "Low"}
    </Badge>
  );
}

export function ActivityDueMeta({
  dueDate,
  isOverdue,
}: {
  dueDate?: string | null;
  isOverdue?: boolean;
}) {
  if (!dueDate) return <span className="text-muted-foreground">No due date</span>;
  const formatted = format(new Date(dueDate), "PP");

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-300 font-medium">
        <AlertTriangle className="h-3.5 w-3.5" />
        Due {formatted}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      Due {formatted}
    </span>
  );
}
