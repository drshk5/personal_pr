import React, { memo, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Plus, Clock, ChevronDown, ChevronUp } from "lucide-react";

import type { ActivityListDto, ActivityLinkDto } from "@/types/CRM/activity";
import { useEntityActivities } from "@/hooks/api/CRM/use-activities";
import { mapToStandardPagedResponse } from "@/lib/utils/pagination-utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import ActivityTypeIcon, {
  getActivityTypeLabel,
} from "../activities/components/ActivityTypeIcon";
import ActivityForm from "../activities/components/ActivityForm";

interface EntityActivityPanelProps {
  entityType: string;
  entityId: string;
  /** Inline recent activities from detail endpoint (avoids extra API call) */
  recentActivities?: ActivityListDto[];
  /** Compact mode shows fewer items */
  compact?: boolean;
}

const EntityActivityPanel: React.FC<EntityActivityPanelProps> = ({
  entityType,
  entityId,
  recentActivities,
  compact = false,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  // Only fetch from API if no inline data provided
  const { data: apiResponse, isLoading } = useEntityActivities(
    entityType,
    entityId,
    { pageSize: compact ? 5 : 10 }
  );

  const activities = useMemo(() => {
    // Prefer inline data if fresh enough
    if (recentActivities && recentActivities.length > 0) {
      return recentActivities;
    }
    if (!apiResponse) return [];
    const paged = mapToStandardPagedResponse<ActivityListDto>(
      apiResponse.data ?? apiResponse
    );
    return paged.items;
  }, [recentActivities, apiResponse]);

  const defaultLinks: ActivityLinkDto[] = useMemo(
    () => [{ strEntityType: entityType, strEntityGUID: entityId }],
    [entityType, entityId]
  );

  const displayItems = expanded ? activities : activities.slice(0, 3);

  return (
    <>
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Activities
              {activities.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({activities.length})
                </span>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Log
            </Button>
          </div>
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
              No activities yet
            </p>
          ) : (
            <div className="space-y-0">
              {displayItems.map((activity, index) => (
                <ActivityTimelineItem
                  key={activity.strActivityGUID}
                  activity={activity}
                  isLast={index === displayItems.length - 1}
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
        onOpenChange={setShowCreate}
        defaultLinks={defaultLinks}
      />
    </>
  );
};

// ── Timeline Item ────────────────────────────────────────────────

interface ActivityTimelineItemProps {
  activity: ActivityListDto;
  isLast: boolean;
}

const ActivityTimelineItem: React.FC<ActivityTimelineItemProps> = memo(
  ({ activity, isLast }) => {
    return (
      <div className="flex gap-3 relative">
        {/* Vertical connector line */}
        {!isLast && (
          <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
        )}

        <ActivityTypeIcon type={activity.strActivityType} size="sm" />

        <div className="flex-1 min-w-0 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight truncate">
                {activity.strSubject}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getActivityTypeLabel(activity.strActivityType)}
                {activity.strOutcome && (
                  <span className="mx-1">·</span>
                )}
                {activity.strOutcome && (
                  <span>{activity.strOutcome}</span>
                )}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {formatDistanceToNow(new Date(activity.dtCreatedOn), {
                addSuffix: true,
              })}
            </span>
          </div>

          {activity.strDescription && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {activity.strDescription}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{activity.strCreatedByName}</span>
            {activity.intDurationMinutes && (
              <span>{activity.intDurationMinutes} min</span>
            )}
            {activity.dtScheduledOn && !activity.dtCompletedOn && (
              <span className="text-amber-600 dark:text-amber-400">
                Scheduled {format(new Date(activity.dtScheduledOn), "MMM d")}
              </span>
            )}
            {activity.dtCompletedOn && (
              <span className="text-emerald-600 dark:text-emerald-400">
                Completed
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ActivityTimelineItem.displayName = "ActivityTimelineItem";

export default memo(EntityActivityPanel);
