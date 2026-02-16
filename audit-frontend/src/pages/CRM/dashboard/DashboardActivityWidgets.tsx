import React from "react";
import { format, parseISO } from "date-fns";
import { ArrowRight, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

import type { ActivityListDto } from "@/types/CRM/activity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import ActivityTypeIcon from "../activities/components/ActivityTypeIcon";

interface DashboardActivityWidget {
  title: string;
  activities: ActivityListDto[];
  isLoading: boolean;
  emptyMessage: string;
  action?: {
    label: string;
    href: string;
  };
  variant?: "default" | "warning" | "success";
}

export const DashboardActivityWidget: React.FC<DashboardActivityWidget> = ({
  title,
  activities,
  isLoading,
  emptyMessage,
  action = { label: "View All", href: "/crm/activities" },
  variant = "default",
}) => {
  const getHeaderColor = () => {
    switch (variant) {
      case "warning":
        return "text-amber-600 dark:text-amber-400";
      case "success":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  const getCardColor = () => {
    switch (variant) {
      case "warning":
        return "border-l-4 border-l-amber-500 dark:border-l-amber-400";
      case "success":
        return "border-l-4 border-l-green-500 dark:border-l-green-400";
      default:
        return "";
    }
  };

  return (
    <Card className={`dark:bg-slate-900 dark:border-slate-800 ${getCardColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-base ${getHeaderColor()}`}>
            {title}
          </CardTitle>
          {activities.length > 0 && (
            <Badge variant="secondary" className="dark:bg-slate-800 dark:text-slate-300">
              {activities.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground dark:text-slate-400">
              Loading...
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground dark:text-slate-600 mb-2" />
            <p className="text-sm text-muted-foreground dark:text-slate-400">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.strActivityGUID}
                  className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ActivityTypeIcon type={activity.strActivityType as any} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate dark:text-slate-100">
                      {activity.strSubject}
                    </p>
                    {activity.dtScheduledOn && (
                      <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1">
                        {format(parseISO(activity.dtScheduledOn), "MMM dd, HH:mm")}
                      </p>
                    )}
                  </div>
                  {activity.dtCompletedOn && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>

            {activities.length > 5 && (
              <p className="text-xs text-muted-foreground dark:text-slate-500 px-2">
                +{activities.length - 5} more...
              </p>
            )}

            <div className="pt-2 border-t dark:border-slate-700">
              <Link to={action.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between dark:hover:bg-slate-800"
                >
                  <span>{action.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface TodayTasksWidgetProps {
  activities: ActivityListDto[];
  isLoading: boolean;
}

export const TodayTasksWidget: React.FC<TodayTasksWidgetProps> = ({
  activities,
  isLoading,
}) => {
  return (
    <DashboardActivityWidget
      title="Today's Tasks"
      activities={activities}
      isLoading={isLoading}
      emptyMessage="No tasks due today"
      action={{ label: "View All Today", href: "/crm/activities/today" }}
    />
  );
};

interface OverdueActivitiesWidgetProps {
  activities: ActivityListDto[];
  isLoading: boolean;
}

export const OverdueActivitiesWidget: React.FC<
  OverdueActivitiesWidgetProps
> = ({ activities, isLoading }) => {
  return (
    <DashboardActivityWidget
      title="Overdue Activities"
      activities={activities}
      isLoading={isLoading}
      emptyMessage="No overdue activities"
      action={{ label: "View All Overdue", href: "/crm/activities/overdue" }}
      variant="warning"
    />
  );
};

interface MyActivitiesCountWidgetProps {
  count: number;
  isLoading: boolean;
}

export const MyActivitiesCountWidget: React.FC<MyActivitiesCountWidgetProps> = ({
  count,
  isLoading,
}) => {
  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
          My Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-lg font-bold text-muted-foreground dark:text-slate-400">
            Loading...
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold dark:text-slate-100">{count}</div>
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400 opacity-50" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TeamOverdueCountWidgetProps {
  count: number;
  isLoading: boolean;
}

export const TeamOverdueCountWidget: React.FC<TeamOverdueCountWidgetProps> = ({
  count,
  isLoading,
}) => {
  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800 border-l-4 border-l-red-500 dark:border-l-red-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
          Team Overdue
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-lg font-bold text-muted-foreground dark:text-slate-400">
            Loading...
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {count}
            </div>
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 opacity-50" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardActivityWidget;
