import React, { useMemo, useState } from "react";
import { Plus, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

import type {
  ActivityListDto,
  ActivityFilterParams,
} from "@/types/CRM/activity";
import {
  useActivitiesExtended,
} from "@/hooks/api/CRM/use-activities-extended";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityTypeIcon from "../activities/components/ActivityTypeIcon";
import ActivityForm from "../activities/components/ActivityForm";

interface AccountActivityTabProps {
  accountId: string;
}

export const AccountActivityTab: React.FC<AccountActivityTabProps> = ({
  accountId,
}) => {
  const [showCreateActivity, setShowCreateActivity] = useState(false);

  // Fetch account activities
  const filterParams: ActivityFilterParams = useMemo(
    () => ({
      strEntityType: "Account",
      strEntityGUID: accountId,
      pageSize: 100,
    }),
    [accountId]
  );

  const { data: activitiesResponse, isLoading, refetch } =
    useActivitiesExtended(filterParams);

  const activities = activitiesResponse?.data || [];
  const completedActivities = activities.filter(
    (a) => a.dtCompletedOn !== null
  );
  const upcomingActivities = activities.filter(
    (a) => a.dtCompletedOn === null && a.dtScheduledOn && 
    new Date(a.dtScheduledOn) > new Date()
  );
  const overdueActivities = activities.filter(
    (a) => a.dtCompletedOn === null && a.dtScheduledOn && 
    new Date(a.dtScheduledOn) <= new Date()
  );

  return (
    <div className="space-y-4 dark:bg-slate-950">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-slate-100">
              {activities.length}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedActivities.length}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {upcomingActivities.length}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overdueActivities.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="dark:bg-slate-900">
        <TabsList className="dark:bg-slate-800 dark:border-slate-700">
          <TabsTrigger value="all" className="dark:text-slate-200">
            All ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="dark:text-slate-200">
            Upcoming ({upcomingActivities.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="dark:text-slate-200">
            Completed ({completedActivities.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="dark:text-slate-200">
            Overdue ({overdueActivities.length})
          </TabsTrigger>
        </TabsList>

        {/* All Activities */}
        <TabsContent value="all">
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="dark:text-slate-100">
                All Activities
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowCreateActivity(true)}
                className="gap-2 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Activity
              </Button>
            </CardHeader>
            <CardContent>
              <ActivityListContent
                activities={activities}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Activities */}
        <TabsContent value="upcoming">
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="dark:text-slate-100">
                Upcoming Activities
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowCreateActivity(true)}
                className="gap-2 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Activity
              </Button>
            </CardHeader>
            <CardContent>
              <ActivityListContent
                activities={upcomingActivities}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Activities */}
        <TabsContent value="completed">
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="dark:text-slate-100">
                Completed Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityListContent
                activities={completedActivities}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Activities */}
        <TabsContent value="overdue">
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-amber-600 dark:text-amber-400">
                Overdue Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityListContent
                activities={overdueActivities}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Activity Dialog */}
      <ActivityForm
        open={showCreateActivity}
        onOpenChange={setShowCreateActivity}
        defaultLinks={[
          {
            strEntityType: "Account",
            strEntityGUID: accountId,
          },
        ]}
        onSuccess={() => {
          setShowCreateActivity(false);
          refetch();
        }}
      />
    </div>
  );
};

interface ActivityListContentProps {
  activities: ActivityListDto[];
  isLoading: boolean;
}

const ActivityListContent: React.FC<ActivityListContentProps> = ({
  activities,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground dark:text-slate-400">
          Loading activities...
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground dark:text-slate-600 mb-2" />
        <p className="text-muted-foreground dark:text-slate-400">
          No activities found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.strActivityGUID}
          className="flex items-start gap-4 p-4 rounded-lg border dark:border-slate-700 dark:bg-slate-800"
        >
          <ActivityTypeIcon type={activity.strActivityType as any} />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate dark:text-slate-100">
              {activity.strSubject}
            </h4>
            {activity.strDescription && (
              <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-2">
                {activity.strDescription}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {activity.dtScheduledOn && (
                <Badge variant="outline" className="text-xs dark:border-slate-600 dark:text-slate-300">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(activity.dtScheduledOn), "MMM dd, HH:mm")}
                </Badge>
              )}
              {activity.strAssignedToName && (
                <Badge variant="secondary" className="text-xs dark:bg-slate-700 dark:text-slate-300">
                  {activity.strAssignedToName}
                </Badge>
              )}
            </div>
          </div>
          {activity.dtCompletedOn && (
            <Badge className="text-xs dark:bg-green-700 dark:text-green-300">
              ✓ Completed
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
};

export default AccountActivityTab;
