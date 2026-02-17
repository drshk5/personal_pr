import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import {
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useChangeActivityStatus,
} from "@/hooks/api/CRM/use-activities-extended";
import { activityExtendedService } from "@/services/CRM/activity-extended.service";
import { useUsers } from "@/hooks/api/central/use-users";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CreateActivityDto,
  UpdateActivityDto,
  ActivityListDto,
} from "@/types/CRM/activity";
import { ACTIVITY_TYPES as TYPES, ACTIVITY_STATUSES as STATUSES, ACTIVITY_PRIORITIES as PRIORITIES } from "@/types/CRM/activity";
import { format } from "date-fns";

type EntityType = "Lead" | "Contact" | "Account" | "Opportunity";

interface RelatedActivitiesTabProps {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  canEdit: boolean;
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
  canEdit,
}: RelatedActivitiesTabProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityListDto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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
    : (activitiesData?.data as any)?.items || (activitiesData as any)?.items || [];
  const filteredActivities = activities.filter((a: ActivityListDto) => {
    const matchesSearch = a.strSubject
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === "all" || a.strActivityType === typeFilter;
    const matchesStatus =
      statusFilter === "all" || a.strStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activities ({activities.length})</CardTitle>
            <div className="flex gap-2">
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
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
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
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {activity.strStatus}
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
                          {activity.strStatus !== "Completed" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(
                                  activity.strActivityGUID,
                                  "Completed"
                                )
                              }
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          {activity.strStatus !== "InProgress" &&
                            activity.strStatus !== "Completed" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(
                                    activity.strActivityGUID,
                                    "InProgress"
                                  )
                                }
                              >
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Start
                              </DropdownMenuItem>
                            )}
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

      {/* Create Activity Dialog */}
      <ActivityFormDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
        mode="create"
      />

      {/* Edit Activity Dialog */}
      {editingActivity && (
        <ActivityFormDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setEditingActivity(null);
          }}
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
          mode="edit"
          activity={editingActivity}
        />
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// Activity Create / Edit Dialog
// ────────────────────────────────────────────────────────────────

interface ActivityFormDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  mode: "create" | "edit";
  activity?: ActivityListDto;
}

function ActivityFormDialog({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  mode,
  activity,
}: ActivityFormDialogProps) {
  const createMutation = useCreateActivity();
  const updateMutation = useUpdateActivity();
  const { data: usersData } = useUsers({ pageSize: 100 });
  const users: any[] = (usersData as any)?.data?.items || (usersData as any)?.items || [];

  const [formData, setFormData] = useState<CreateActivityDto>({
    strActivityType: activity?.strActivityType || "Call",
    strSubject: activity?.strSubject || "",
    strDescription: activity?.strDescription || "",
    strStatus: activity?.strStatus || "Pending",
    strPriority: activity?.strPriority || "Medium",
    dtScheduledOn: activity?.dtScheduledOn
      ? new Date(activity.dtScheduledOn).toISOString().slice(0, 16)
      : "",
    dtDueDate: activity?.dtDueDate
      ? new Date(activity.dtDueDate).toISOString().slice(0, 10)
      : "",
    intDurationMinutes: activity?.intDurationMinutes || 30,
    strAssignedToGUID: activity?.strAssignedToGUID || "",
    strOutcome: activity?.strOutcome || "",
    links: [{ strEntityType: entityType, strEntityGUID: entityId }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dtScheduledOn: formData.dtScheduledOn
          ? new Date(formData.dtScheduledOn).toISOString()
          : null,
        dtDueDate: formData.dtDueDate
          ? new Date(formData.dtDueDate).toISOString()
          : null,
        strAssignedToGUID: formData.strAssignedToGUID || null,
      };

      if (mode === "edit" && activity) {
        await updateMutation.mutateAsync({
          id: activity.strActivityGUID,
          dto: payload as UpdateActivityDto,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.message || `Failed to ${mode} activity`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? `New Activity for ${entityName}`
              : `Edit Activity: ${activity?.strSubject}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Activity Type *</Label>
                <Select
                  value={formData.strActivityType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, strActivityType: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.strPriority || "Medium"}
                  onValueChange={(v) =>
                    setFormData({ ...formData, strPriority: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                required
                value={formData.strSubject}
                onChange={(e) =>
                  setFormData({ ...formData, strSubject: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.strDescription || ""}
                onChange={(e) =>
                  setFormData({ ...formData, strDescription: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.strStatus || "Pending"}
                  onValueChange={(v) =>
                    setFormData({ ...formData, strStatus: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scheduled On</Label>
                <Input
                  type="datetime-local"
                  value={formData.dtScheduledOn || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, dtScheduledOn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dtDueDate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, dtDueDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.intDurationMinutes || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      intDurationMinutes: parseInt(e.target.value) || null,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select
                  value={formData.strAssignedToGUID || "unassigned"}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      strAssignedToGUID: v === "unassigned" ? null : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((u: any) => (
                      <SelectItem key={u.strUserGUID} value={u.strUserGUID}>
                        {u.strName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === "edit" && (
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Textarea
                  value={formData.strOutcome || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, strOutcome: e.target.value })
                  }
                  rows={2}
                  placeholder="Activity outcome or result..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : mode === "create"
                ? "Create Activity"
                : "Update Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
