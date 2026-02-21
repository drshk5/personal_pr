import { useState, useMemo } from "react";

import CustomContainer from "@/components/layout/custom-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Calendar,
  Mail,
  Phone,
  Video,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  User,
  List,
  LayoutGrid,
  AlertTriangle,
  Archive,
  RotateCcw,
} from "lucide-react";
import {
  useActivitiesExtended,
  useMyActivities,
  useOverdueActivities,
  useTodayActivities,
  useDeleteActivity,
  useChangeActivityStatus,
  useBulkAssignActivities,
  useBulkDeleteActivities,
} from "@/hooks/api/CRM/use-activities-extended";
import { useUsers } from "@/hooks/api/central/use-users";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useCrmPermissions } from "@/hooks/CRM/use-crm-permissions";
import { toast } from "sonner";
import { activityService } from "@/services/CRM/activity.service";
import type { ActivityListDto } from "@/types/CRM/activity";
import {
  ACTIVITY_TYPES,
  ACTIVITY_STATUSES,
  ACTIVITY_PRIORITIES,
} from "@/types/CRM/activity";
import { format } from "date-fns";
import ActivityForm from "@/pages/CRM/activities/components/ActivityForm";
import { BulkEmailModal } from "@/components/CRM/BulkEmailModal";
import {
  ActivityDueMeta,
  ActivityPriorityBadge,
  ActivityStatusBadge,
  ActivityTypeBadge,
} from "@/components/CRM/activity-presenters";

const ACTIVITY_TYPE_ICONS: Record<string, any> = {
  Call: Phone,
  Email: Mail,
  Meeting: Video,
  Note: FileText,
  Task: FileText,
  FollowUp: Calendar,
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500",
  InProgress: "bg-blue-500",
  Completed: "bg-green-500",
  Cancelled: "bg-red-500",
};

export default function ActivityManagement() {
  useAuthContext();
  const perms = useCrmPermissions("activity");

  const [activeView, setActiveView] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityListDto | null>(null);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false);

  // Data queries based on active view
  const { data: allData, isLoading: allLoading } = useActivitiesExtended({
    pageSize: 200,
  });
  const { data: myData, isLoading: myLoading } = useMyActivities({
    pageSize: 200,
  });
  const { data: overdueData, isLoading: overdueLoading } = useOverdueActivities({
    pageSize: 200,
  });
  const { data: todayData, isLoading: todayLoading } = useTodayActivities();

  const { data: usersData } = useUsers({ pageSize: 100 });
  const users: any[] = (usersData as any)?.data?.items || (usersData as any)?.data?.Items || (usersData as any)?.items || (usersData as any)?.Items || [];

  // Helper to extract items array from paginated response (handles PascalCase & camelCase)
  const extractItems = (response: any): ActivityListDto[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    const d = response?.data;
    if (Array.isArray(d)) return d;
    if (d?.items) return d.items;
    if (d?.Items) return d.Items;
    if (response?.items) return response.items;
    if (response?.Items) return response.Items;
    return [];
  };

  // Select data based on view
  const rawActivities = useMemo(() => {
    switch (activeView) {
      case "my":
        return extractItems(myData);
      case "overdue":
        return extractItems(overdueData);
      case "today":
        return Array.isArray(todayData) ? todayData : extractItems(todayData);
      default:
        return extractItems(allData);
    }
  }, [activeView, allData, myData, overdueData, todayData]);

  const isLoading =
    activeView === "all"
      ? allLoading
      : activeView === "my"
      ? myLoading
      : activeView === "overdue"
      ? overdueLoading
      : todayLoading;

  // Apply filters
  const filteredActivities = useMemo(() => {
    return rawActivities.filter((a) => {
      const matchSearch =
        !searchTerm ||
        a.strSubject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.strDescription?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "all" || a.strActivityType === typeFilter;
      const matchStatus = statusFilter === "all" || a.strStatus === statusFilter;
      const matchPriority = priorityFilter === "all" || a.strPriority === priorityFilter;
      const matchAssignee =
        assigneeFilter === "all" || a.strAssignedToGUID === assigneeFilter;
      return matchSearch && matchType && matchStatus && matchPriority && matchAssignee;
    });
  }, [rawActivities, searchTerm, typeFilter, statusFilter, priorityFilter, assigneeFilter]);

  const deleteActivity = useDeleteActivity();
  const changeStatus = useChangeActivityStatus();
  const bulkDelete = useBulkDeleteActivities();

  // Stats
  const stats = useMemo(() => {
    const all = extractItems(allData);
    return {
      total: all.length,
      pending: all.filter((a) => a.strStatus === "Pending").length,
      inProgress: all.filter((a) => a.strStatus === "InProgress").length,
      completed: all.filter((a) => a.strStatus === "Completed").length,
      overdue: all.filter((a) => a.bolIsOverdue).length,
    };
  }, [allData]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredActivities.map((a) => a.strActivityGUID)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} activities?`)) return;
    try {
      await bulkDelete.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch {}
  };

  const handleBulkArchive = async () => {
    await handleBulkStatusChange("Cancelled");
  };

  const handleBulkRestore = async () => {
    await handleBulkStatusChange("Pending");
  };

  const handleBulkEmail = async (emailData: {
    activityGuids: string[];
    subject: string;
    body: string;
    sendToAssignedUsers: boolean;
    sendToCreators: boolean;
    additionalRecipients: string[];
  }) => {
    const emailCount = await activityService.bulkEmail(emailData);
    toast.success(`Successfully queued ${emailCount} emails for sending`);
    setSelectedIds(new Set());
  };

  const handleBulkStatusChange = async (status: string) => {
    const ids = Array.from(selectedIds);
    let successCount = 0;
    for (const id of ids) {
      try {
        await changeStatus.mutateAsync({ id, dto: { strStatus: status } });
        successCount++;
      } catch {
        // individual errors handled by hook
      }
    }
    setSelectedIds(new Set());
    if (successCount > 0 && ids.length > 1) {
      const statusLabel = status === "InProgress" ? "In Progress" : status;
      toast.success(`${successCount} of ${ids.length} activities updated to ${statusLabel}`);
    }
  };

  return (
    <CustomContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
              <Calendar className="h-8 w-8 text-primary" />
              Activity Management
            </h1>
            <p className="text-muted-foreground mt-1">
              {perms.isAdmin
                ? "Manage all activities across the organization"
                : "Manage your assigned activities"}
            </p>
          </div>
          {perms.canCreate && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Activity
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Total" value={stats.total} icon={Calendar} color="text-blue-500" />
          <StatCard title="Pending" value={stats.pending} icon={Clock} color="text-yellow-500" />
          <StatCard title="In Progress" value={stats.inProgress} icon={AlertCircle} color="text-blue-500" />
          <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} color="text-green-500" />
          <StatCard title="Overdue" value={stats.overdue} icon={AlertTriangle} color="text-red-500" />
        </div>

        {/* View Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Activities</TabsTrigger>
              <TabsTrigger value="my">My Activities</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="overdue">
                Overdue
                {stats.overdue > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white" variant="secondary">
                    {stats.overdue}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "timeline" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("timeline")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ACTIVITY_TYPES.map((t) => (
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
                {ACTIVITY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {ACTIVITY_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {perms.isAdmin && (
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.strUserGUID} value={u.strUserGUID}>
                      {u.strName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mt-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange("Completed")}>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Complete
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange("InProgress")}>
                <AlertCircle className="mr-1 h-3 w-3" />
                Start
              </Button>
              {perms.isAdmin && (
                <Button size="sm" variant="outline" onClick={() => setShowBulkAssignDialog(true)}>
                  <User className="mr-1 h-3 w-3" />
                  Assign
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setShowBulkEmailDialog(true)}>
                <Mail className="mr-1 h-3 w-3" />
                Send Mail
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkArchive}>
                <Archive className="mr-1 h-3 w-3" />
                Archive
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkRestore}>
                <RotateCcw className="mr-1 h-3 w-3" />
                Restore
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          )}

          {/* Activity List/Timeline */}
          <TabsContent value={activeView} className="mt-0">
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading activities...
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No activities found.</p>
                  </div>
                ) : viewMode === "list" ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedIds.size === filteredActivities.length &&
                              filteredActivities.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActivities.map((activity) => {
                        const TypeIcon =
                          ACTIVITY_TYPE_ICONS[activity.strActivityType] ||
                          Calendar;
                        return (
                          <TableRow
                            key={activity.strActivityGUID}
                            className={
                              activity.bolIsOverdue
                                ? "bg-rose-50/60 dark:bg-rose-950/20"
                                : ""
                            }
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(
                                  activity.strActivityGUID
                                )}
                                onCheckedChange={() =>
                                  handleToggleSelect(activity.strActivityGUID)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                <ActivityTypeBadge type={activity.strActivityType} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium truncate max-w-[200px]">
                                  {activity.strSubject}
                                </p>
                                {activity.strDescription && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {activity.strDescription}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <ActivityStatusBadge status={activity.strStatus} />
                            </TableCell>
                            <TableCell>
                              <ActivityPriorityBadge priority={activity.strPriority} />
                            </TableCell>
                            <TableCell>
                              <ActivityDueMeta
                                dueDate={activity.dtDueDate}
                                isOverdue={activity.bolIsOverdue}
                              />
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {activity.strAssignedToName || "Unassigned"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {activity.strCreatedByName}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setEditingActivity(activity)
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  {activity.strStatus !== "Completed" && (
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        try {
                                          await changeStatus.mutateAsync({
                                            id: activity.strActivityGUID,
                                            dto: { strStatus: "Completed" },
                                          });
                                        } catch {
                                          // error handled by hook
                                        }
                                      }}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Complete
                                    </DropdownMenuItem>
                                  )}
                                  {activity.strStatus === "Pending" && (
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        try {
                                          await changeStatus.mutateAsync({
                                            id: activity.strActivityGUID,
                                            dto: { strStatus: "InProgress" },
                                          });
                                        } catch {
                                          // error handled by hook
                                        }
                                      }}
                                    >
                                      <AlertCircle className="mr-2 h-4 w-4" />
                                      Start
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={async () => {
                                      if (confirm("Delete this activity?")) {
                                        try {
                                          await deleteActivity.mutateAsync(
                                            activity.strActivityGUID
                                          );
                                        } catch {
                                          // error handled by hook
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  /* Timeline View */
                  <div className="space-y-4">
                    {filteredActivities.map((activity) => {
                      const TypeIcon =
                        ACTIVITY_TYPE_ICONS[activity.strActivityType] ||
                        Calendar;
                      return (
                        <div
                          key={activity.strActivityGUID}
                          className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div
                            className={`p-2 rounded-full ${
                              STATUS_COLORS[activity.strStatus] || "bg-gray-500"
                            } text-white flex-shrink-0`}
                          >
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">
                                {activity.strSubject}
                              </h4>
                              <div className="flex items-center gap-2">
                                <ActivityPriorityBadge priority={activity.strPriority} />
                                <ActivityStatusBadge status={activity.strStatus} />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setEditingActivity(activity)
                                      }
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    {activity.strStatus !== "Completed" && (
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          try {
                                            await changeStatus.mutateAsync({
                                              id: activity.strActivityGUID,
                                              dto: { strStatus: "Completed" },
                                            });
                                          } catch {
                                            // error handled by hook
                                          }
                                        }}
                                      >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Complete
                                      </DropdownMenuItem>
                                    )}
                                    {activity.strStatus === "Pending" && (
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          try {
                                            await changeStatus.mutateAsync({
                                              id: activity.strActivityGUID,
                                              dto: { strStatus: "InProgress" },
                                            });
                                          } catch {
                                            // error handled by hook
                                          }
                                        }}
                                      >
                                        <AlertCircle className="mr-2 h-4 w-4" />
                                        Start
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={async () => {
                                        if (confirm("Delete this activity?")) {
                                          try {
                                            await deleteActivity.mutateAsync(
                                              activity.strActivityGUID
                                            );
                                          } catch {
                                            // error handled by hook
                                          }
                                        }
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            {activity.strDescription && (
                              <p className="text-sm text-muted-foreground">
                                {activity.strDescription}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {activity.dtScheduledOn && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(
                                    new Date(activity.dtScheduledOn),
                                    "PPp"
                                  )}
                                </span>
                              )}
                              {activity.dtDueDate && (
                                <ActivityDueMeta
                                  dueDate={activity.dtDueDate}
                                  isOverdue={activity.bolIsOverdue}
                                />
                              )}
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {activity.strAssignedToName || "Unassigned"}
                              </span>
                              <span className="text-muted-foreground">
                                by {activity.strCreatedByName}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Dialog */}
      <ActivityForm
        open={showCreateDialog}
        onOpenChange={(open) => { if (!open) setShowCreateDialog(false); }}
        onSuccess={() => setShowCreateDialog(false)}
      />

      {/* Edit Dialog */}
      <ActivityForm
        open={!!editingActivity}
        onOpenChange={(open) => { if (!open) setEditingActivity(null); }}
        editActivity={editingActivity}
        onSuccess={() => setEditingActivity(null)}
      />

      {/* Bulk Assign Dialog */}
      <BulkAssignDialog
        open={showBulkAssignDialog}
        onClose={() => setShowBulkAssignDialog(false)}
        selectedIds={selectedIds}
        users={users}
        onComplete={() => setSelectedIds(new Set())}
      />

      <BulkEmailModal
        isOpen={showBulkEmailDialog}
        onClose={() => setShowBulkEmailDialog(false)}
        selectedActivities={Array.from(selectedIds)}
        onSend={handleBulkEmail}
      />
    </CustomContainer>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <h3 className="text-xl font-bold text-foreground">{value}</h3>
          </div>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function BulkAssignDialog({
  open,
  onClose,
  selectedIds,
  users,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  selectedIds: Set<string>;
  users: any[];
  onComplete: () => void;
}) {
  const [assignTo, setAssignTo] = useState("");
  const bulkAssign = useBulkAssignActivities();

  const handleAssign = async () => {
    if (!assignTo) return;
    try {
      await bulkAssign.mutateAsync({
        ids: Array.from(selectedIds),
        userId: assignTo,
      });
      onComplete();
      onClose();
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign {selectedIds.size} Activities</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label>Assign To</Label>
          <Select value={assignTo} onValueChange={setAssignTo}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u: any) => (
                <SelectItem key={u.strUserGUID} value={u.strUserGUID}>
                  {u.strName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!assignTo || bulkAssign.isPending}>
            {bulkAssign.isPending ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
