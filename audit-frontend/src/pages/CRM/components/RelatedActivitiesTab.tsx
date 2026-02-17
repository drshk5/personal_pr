import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Video,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  MoreHorizontal,
  User,
  PlayCircle,
} from "lucide-react";
import {
  useDeleteActivity,
  useChangeActivityStatus,
} from "@/hooks/api/CRM/use-activities-extended";
import { activityExtendedService } from "@/services/CRM/activity-extended.service";
import { useQuery } from "@tanstack/react-query";
import type { ActivityListDto } from "@/types/CRM/activity";
import { ACTIVITY_TYPES as TYPES, ACTIVITY_STATUSES as STATUSES } from "@/types/CRM/activity";
import { format } from "date-fns";
import ActivityForm from "@/pages/CRM/activities/components/ActivityForm";

type EntityType = "Lead" | "Contact" | "Account" | "Opportunity";

interface RelatedActivitiesTabProps {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  canEdit?: boolean;
}

const ACTIVITY_TYPE_ICONS: Record<string, any> = {
  Call: Phone,
  Email: Mail,
  Meeting: Video,
  Note: FileText,
  Task: FileText,
  FollowUp: Calendar,
};

const STATUS_ICONS: Record<string, any> = {
  Pending: Clock,
  InProgress: AlertCircle,
  Completed: CheckCircle2,
  Cancelled: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500",
  InProgress: "bg-blue-500",
  Completed: "bg-green-500",
  Cancelled: "bg-red-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-500",
  Medium: "bg-blue-500",
  High: "bg-orange-500",
  Urgent: "bg-red-500",
};

export default function RelatedActivitiesTab({
  entityType,
  entityId,
  entityName,
  canEdit = true,
}: RelatedActivitiesTabProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityListDto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeSubTab, setActiveSubTab] = useState("all");

  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ["crm-entity-activities", entityType, entityId],
    queryFn: () =>
      activityExtendedService.getEntityActivities(entityType, entityId, {
        pageSize: 100,
      }),
    staleTime: 30000,
  });

  const activities: ActivityListDto[] = Array.isArray(activitiesData?.data)
    ? activitiesData.data
    : (activitiesData?.data as any)?.items || (activitiesData?.data as any)?.Items || (activitiesData as any)?.items || (activitiesData as any)?.Items || [];

  // Categorize activities
  const completedActivities = useMemo(
    () => activities.filter((a) => a.strStatus === "Completed" || a.dtCompletedOn !== null),
    [activities]
  );
  const upcomingActivities = useMemo(
    () =>
      activities.filter(
        (a) =>
          a.strStatus !== "Completed" &&
          a.strStatus !== "Cancelled" &&
          a.dtCompletedOn === null &&
          (!a.dtDueDate || new Date(a.dtDueDate) >= new Date())
      ),
    [activities]
  );
  const overdueActivities = useMemo(
    () =>
      activities.filter(
        (a) =>
          a.strStatus !== "Completed" &&
          a.strStatus !== "Cancelled" &&
          a.dtCompletedOn === null &&
          a.dtDueDate &&
          new Date(a.dtDueDate) < new Date()
      ),
    [activities]
  );

  // Get the base list for the active sub-tab
  const subTabActivities = useMemo(() => {
    switch (activeSubTab) {
      case "upcoming":
        return upcomingActivities;
      case "completed":
        return completedActivities;
      case "overdue":
        return overdueActivities;
      default:
        return activities;
    }
  }, [activeSubTab, activities, upcomingActivities, completedActivities, overdueActivities]);

  // Apply search and filters on top of sub-tab selection
  const filteredActivities = useMemo(() => {
    return subTabActivities.filter((a: ActivityListDto) => {
      const matchesSearch = a.strSubject
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType =
        typeFilter === "all" || a.strActivityType === typeFilter;
      const matchesStatus =
        statusFilter === "all" || a.strStatus === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [subTabActivities, searchTerm, typeFilter, statusFilter]);

  const deleteMutation = useDeleteActivity();
  const changeStatusMutation = useChangeActivityStatus();

  const handleEdit = (activity: ActivityListDto) => {
    setEditingActivity(activity);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch {}
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await changeStatusMutation.mutateAsync({
        id,
        dto: { strStatus: status },
      });
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedActivities.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {upcomingActivities.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
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

      {/* Sub-Tabs: All / Upcoming / Completed / Overdue */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="all">All ({activities.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingActivities.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedActivities.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueActivities.length})</TabsTrigger>
        </TabsList>

        {/* Single content area — filtered list is driven by activeSubTab state */}
        <TabsContent value={activeSubTab} forceMount>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>
                  {activeSubTab === "all"
                    ? "All Activities"
                    : activeSubTab === "upcoming"
                    ? "Upcoming Activities"
                    : activeSubTab === "completed"
                    ? "Completed Activities"
                    : "Overdue Activities"}
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canEdit && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Activity
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading activities...
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                      ? "No activities found matching your filters"
                      : "No activities yet. Click 'Add Activity' to create one."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredActivities.map((activity) => {
                    const TypeIcon =
                      ACTIVITY_TYPE_ICONS[activity.strActivityType] || Calendar;
                    const StatusIcon =
                      STATUS_ICONS[activity.strStatus] || Clock;

                    return (
                      <div
                        key={activity.strActivityGUID}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className={`p-2 rounded-full ${
                            STATUS_COLORS[activity.strStatus] || "bg-gray-500"
                          } text-white`}
                        >
                          <TypeIcon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">
                              {activity.strSubject}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {activity.strActivityType}
                            </Badge>
                            <Badge
                              className={`${
                                PRIORITY_COLORS[activity.strPriority] || "bg-gray-500"
                              } text-white text-xs`}
                            >
                              {activity.strPriority}
                            </Badge>
                          </div>
                          {activity.strDescription && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {activity.strDescription}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {activity.strStatus === "InProgress" ? "In Progress" : activity.strStatus}
                            </span>
                            {activity.dtScheduledOn && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(activity.dtScheduledOn), "PPp")}
                              </span>
                            )}
                            {activity.dtDueDate && (
                              <span
                                className={`flex items-center gap-1 ${
                                  activity.bolIsOverdue ? "text-red-500 font-medium" : ""
                                }`}
                              >
                                <Clock className="h-3 w-3" />
                                Due: {format(new Date(activity.dtDueDate), "PP")}
                                {activity.bolIsOverdue && " (Overdue)"}
                              </span>
                            )}
                            {activity.strAssignedToName && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {activity.strAssignedToName}
                              </span>
                            )}
                          </div>
                        </div>

                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(activity)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {activity.strStatus === "Pending" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(
                                      activity.strActivityGUID,
                                      "InProgress"
                                    )
                                  }
                                >
                                  <PlayCircle className="mr-2 h-4 w-4 text-blue-500" />
                                  Start Activity
                                </DropdownMenuItem>
                              )}
                              {activity.strStatus !== "Completed" &&
                                activity.strStatus !== "Cancelled" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(
                                        activity.strActivityGUID,
                                        "Completed"
                                      )
                                    }
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                    Mark Complete
                                  </DropdownMenuItem>
                                )}
                              {activity.strStatus === "InProgress" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(
                                      activity.strActivityGUID,
                                      "Pending"
                                    )
                                  }
                                >
                                  <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                                  Pause (Back to Pending)
                                </DropdownMenuItem>
                              )}
                              {activity.strStatus === "Completed" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(
                                      activity.strActivityGUID,
                                      "Pending"
                                    )
                                  }
                                >
                                  <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                                  Reopen
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  handleDelete(activity.strActivityGUID)
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Activity Dialog */}
      <ActivityForm
        open={showCreateDialog}
        onOpenChange={(open) => { if (!open) setShowCreateDialog(false); }}
        defaultLinks={[{ strEntityType: entityType, strEntityGUID: entityId }]}
        entityContext={{ entityType, entityName }}
        onSuccess={() => setShowCreateDialog(false)}
      />

      {/* Edit Activity Dialog */}
      <ActivityForm
        open={showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditDialog(false);
            setEditingActivity(null);
          }
        }}
        defaultLinks={[{ strEntityType: entityType, strEntityGUID: entityId }]}
        entityContext={{ entityType, entityName }}
        editActivity={editingActivity}
        onSuccess={() => {
          setShowEditDialog(false);
          setEditingActivity(null);
        }}
      />
    </div>
  );
}


