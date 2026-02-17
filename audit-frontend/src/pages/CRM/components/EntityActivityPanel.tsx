import React, { memo, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Plus,
  Clock,
  ChevronDown,
  ChevronUp,
  Pencil,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import type { ActivityListDto, ActivityLinkDto, ActivityType } from "@/types/CRM/activity";
import { ACTIVITY_STATUSES } from "@/types/CRM/activity";
import { useEntityActivities } from "@/hooks/api/CRM/use-activities";
import { useChangeActivityStatus } from "@/hooks/api/CRM/use-activities-extended";
import { mapToStandardPagedResponse } from "@/lib/utils/pagination-utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ActivityTypeIcon, {
  getActivityTypeLabel,
} from "../activities/components/ActivityTypeIcon";
import ActivityForm from "../activities/components/ActivityForm";

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  Pending: { className: "border-yellow-500/50 text-yellow-600 bg-yellow-500/10", label: "Pending" },
  InProgress: { className: "border-blue-500/50 text-blue-600 bg-blue-500/10", label: "In Progress" },
  Completed: { className: "border-emerald-500/50 text-emerald-600 bg-emerald-500/10", label: "Completed" },
  Cancelled: { className: "border-red-500/50 text-red-600 bg-red-500/10", label: "Cancelled" },
};

interface EntityActivityPanelProps {
  entityType: string;
  entityId: string;
  recentActivities?: ActivityListDto[];
  compact?: boolean;
}

const EntityActivityPanel: React.FC<EntityActivityPanelProps> = ({
  entityType,
  entityId,
  recentActivities,
  compact = false,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<ActivityListDto | null>(null);
  const [expanded, setExpanded] = useState(!compact);
  const [createType, setCreateType] = useState<ActivityType>("Note");

  const { mutate: changeStatus } = useChangeActivityStatus();

  // Only fetch from API if no inline data provided
  const { data: apiResponse, isLoading, refetch } = useEntityActivities(
    entityType,
    entityId,
    { pageSize: compact ? 5 : 20 }
  );

  const activities = useMemo(() => {
    if (recentActivities && recentActivities.length > 0) return recentActivities;
    if (!apiResponse) return [];
    const paged = mapToStandardPagedResponse<ActivityListDto>(apiResponse.data ?? apiResponse);
    return paged.items;
  }, [recentActivities, apiResponse]);

  const defaultLinks: ActivityLinkDto[] = useMemo(
    () => [{ strEntityType: entityType, strEntityGUID: entityId }],
    [entityType, entityId]
  );

  const displayItems = expanded ? activities : activities.slice(0, 3);

  // Stats
  const stats = useMemo(() => {
    const total = activities.length;
    const completed = activities.filter(a => a.strStatus === "Completed").length;
    const overdue = activities.filter(a => a.bolIsOverdue).length;
    const pending = activities.filter(a => a.strStatus === "Pending" || a.strStatus === "InProgress").length;
    return { total, completed, overdue, pending };
  }, [activities]);

  const handleStatusChange = (id: string, status: string) => {
    changeStatus({ id, dto: { strStatus: status } }, { onSuccess: () => refetch() });
  };

  const quickTypes: { type: ActivityType; emoji: string; label: string }[] = [
    { type: "Call", emoji: "📞", label: "Call" },
    { type: "Email", emoji: "📧", label: "Email" },
    { type: "Meeting", emoji: "🤝", label: "Meeting" },
    { type: "Task", emoji: "✅", label: "Task" },
    { type: "Note", emoji: "📝", label: "Note" },
    { type: "FollowUp", emoji: "🔄", label: "Follow-Up" },
  ];

  return (
    <>
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Activities
              {stats.total > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({stats.total})
                </span>
              )}
              {stats.overdue > 0 && (
                <Badge variant="destructive" className="text-[10px] h-4">
                  {stats.overdue} overdue
                </Badge>
              )}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Log
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {quickTypes.map((qt) => (
                  <DropdownMenuItem
                    key={qt.type}
                    onClick={() => {
                      setCreateType(qt.type);
                      setEditTarget(null);
                      setShowCreate(true);
                    }}
                  >
                    <span className="mr-2">{qt.emoji}</span>
                    {qt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mini stat bar */}
          {stats.total > 0 && (
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-emerald-600">{stats.completed} completed</span>
              <span className="text-yellow-600">{stats.pending} pending</span>
              {stats.overdue > 0 && <span className="text-red-600">{stats.overdue} overdue</span>}
            </div>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {isLoading && !recentActivities ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-7 w-7 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No activities yet. Log a call, email, or task.
            </p>
          ) : (
            <div className="space-y-0">
              {displayItems.map((activity, index) => (
                <ActivityTimelineItem
                  key={activity.strActivityGUID}
                  activity={activity}
                  isLast={index === displayItems.length - 1}
                  onEdit={() => {
                    setEditTarget(activity);
                    setShowCreate(true);
                  }}
                  onStatusChange={handleStatusChange}
                />
              ))}

              {activities.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs mt-1"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show All ({activities.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ActivityForm
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) setEditTarget(null);
        }}
        defaultLinks={defaultLinks}
        defaultActivityType={createType}
        editActivity={editTarget}
        onSuccess={() => refetch()}
      />
    </>
  );
};

// ── Timeline Item ────────────────────────────────────────────────

interface ActivityTimelineItemProps {
  activity: ActivityListDto;
  isLast: boolean;
  onEdit: () => void;
  onStatusChange: (id: string, status: string) => void;
}

const ActivityTimelineItem: React.FC<ActivityTimelineItemProps> = memo(
  ({ activity, isLast, onEdit, onStatusChange }) => {
    const statusBadge = STATUS_BADGE[activity.strStatus];

    return (
      <div className="flex gap-3 relative group">
        {/* Vertical connector line */}
        {!isLast && (
          <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
        )}

        <ActivityTypeIcon type={activity.strActivityType} size="sm" />

        <div className="flex-1 min-w-0 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground leading-tight truncate">
                {activity.strSubject}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-xs text-muted-foreground">
                  {getActivityTypeLabel(activity.strActivityType)}
                </span>
                <Badge variant="outline" className={`text-[10px] h-4 ${statusBadge?.className || ""}`}>
                  {statusBadge?.label || activity.strStatus}
                </Badge>
                {activity.bolIsOverdue && (
                  <Badge variant="destructive" className="text-[10px] h-4">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(activity.dtCreatedOn), { addSuffix: true })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onEdit}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {activity.strDescription && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {activity.strDescription}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span>{activity.strCreatedByName}</span>
            {activity.strAssignedToName && (
              <span className="text-primary">→ {activity.strAssignedToName}</span>
            )}
            {activity.strOutcome && (
              <span className="italic">"{activity.strOutcome}"</span>
            )}
            {activity.dtScheduledOn && !activity.dtCompletedOn && (
              <span className="text-amber-600 dark:text-amber-400">
                Scheduled {format(new Date(activity.dtScheduledOn), "MMM d")}
              </span>
            )}
            {activity.dtCompletedOn && (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            )}
          </div>

          {/* Quick status change (only if not completed/cancelled) */}
          {activity.strStatus !== "Completed" && activity.strStatus !== "Cancelled" && (
            <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {ACTIVITY_STATUSES.filter(s => s !== activity.strStatus).slice(0, 3).map(s => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className={`h-5 text-[10px] px-2 ${STATUS_BADGE[s]?.className || ""}`}
                  onClick={() => onStatusChange(activity.strActivityGUID, s)}
                >
                  {STATUS_BADGE[s]?.label || s}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ActivityTimelineItem.displayName = "ActivityTimelineItem";

export default memo(EntityActivityPanel);
