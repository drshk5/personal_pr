import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Calendar,
  Search,
  Mail,
  Phone,
  Video,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";
import { useActivities, useCreateActivity, useBulkNotifyActivities } from "@/hooks/api/CRM/use-activities";
import { useUsers } from "@/hooks/api/central/use-users";
import { toast } from "sonner";
import type { CreateActivityDto, ACTIVITY_TYPES, ACTIVITY_STATUSES } from "@/types/CRM/activity";
import type { User } from "@/types/central/user";

interface AccountActivitiesTabProps {
  accountId: string;
  accountName: string;
}

const ACTIVITY_TYPE_ICONS = {
  Call: Phone,
  Email: Mail,
  Meeting: Video,
  Task: FileText,
  Other: Calendar,
};

const STATUS_COLORS = {
  Scheduled: "bg-blue-500",
  Completed: "bg-green-500",
  Cancelled: "bg-red-500",
  "In Progress": "bg-yellow-500",
};

export default function AccountActivitiesTab({
  accountId,
  accountName,
}: AccountActivitiesTabProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

  const { data: activitiesData, isLoading } = useActivities({
    // TODO: Add proper account filter when backend supports it
    pageSize: 100,
  });

  const activities = Array.isArray(activitiesData?.data)
    ? activitiesData.data
    : (activitiesData?.data as any)?.items || (activitiesData as any)?.items || [];
  const filteredActivities = activities.filter((activity: any) => {
    const matchesSearch = activity.strSubject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || activity.strActivityType === typeFilter;
    const matchesStatus = statusFilter === "all" || activity.strStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedActivities(
        new Set(filteredActivities.map((a) => a.strActivityGUID))
      );
    } else {
      setSelectedActivities(new Set());
    }
  };

  const handleSelectActivity = (activityId: string, checked: boolean) => {
    const newSelected = new Set(selectedActivities);
    if (checked) {
      newSelected.add(activityId);
    } else {
      newSelected.delete(activityId);
    }
    setSelectedActivities(newSelected);
  };

  const isAllSelected =
    filteredActivities.length > 0 &&
    filteredActivities.every((a) => selectedActivities.has(a.strActivityGUID));

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activities ({activities.length})</CardTitle>
            <div className="flex gap-2">
              {selectedActivities.size > 0 && (
                <div className="flex items-center gap-2 mr-2">
                  <Badge variant="secondary" className="text-sm">
                    {selectedActivities.size} selected
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBulkEmailDialog(true)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Bulk Email
                  </Button>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Task">Task</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Activity
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading activities...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                ? "No activities found matching your filters"
                : "No activities yet. Click 'Log Activity' to add one."}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <Label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                  Select all
                </Label>
              </div>

              {/* Activities Timeline */}
              <div className="space-y-3">
                {filteredActivities.map((activity) => {
                  const Icon = ACTIVITY_TYPE_ICONS[activity.strActivityType as keyof typeof ACTIVITY_TYPE_ICONS] || Calendar;
                  const isOverdue =
                    activity.dtDueDate &&
                    new Date(activity.dtDueDate) < new Date() &&
                    activity.strStatus !== "Completed";

                  return (
                    <div
                      key={activity.strActivityGUID}
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedActivities.has(activity.strActivityGUID)}
                        onCheckedChange={(checked) =>
                          handleSelectActivity(activity.strActivityGUID, checked as boolean)
                        }
                      />
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          STATUS_COLORS[activity.strStatus as keyof typeof STATUS_COLORS] || "bg-gray-500"
                        }`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium">{activity.strSubject}</h4>
                            <p className="text-sm text-muted-foreground">
                              {activity.strDescription || "No description"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{activity.strActivityType}</Badge>
                            <Badge
                              variant={
                                activity.strStatus === "Completed"
                                  ? "success"
                                  : activity.strStatus === "Cancelled"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {activity.strStatus}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {activity.dtDueDate && (
                            <div className="flex items-center gap-1">
                              {isOverdue ? (
                                <AlertCircle className="h-3 w-3 text-red-500" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                                {new Date(activity.dtDueDate).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {activity.strAssignedToName && (
                            <span>Assigned to: {activity.strAssignedToName}</span>
                          )}
                          {activity.dtCompletedOn && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              <span>
                                Completed: {new Date(activity.dtCompletedOn).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateActivityDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        accountId={accountId}
        accountName={accountName}
      />

      <BulkEmailDialog
        open={showBulkEmailDialog}
        onClose={() => {
          setShowBulkEmailDialog(false);
          setSelectedActivities(new Set());
        }}
        selectedActivityIds={Array.from(selectedActivities)}
      />
    </>
  );
}

interface CreateActivityDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
}

function CreateActivityDialog({
  open,
  onClose,
  accountId,
  accountName,
}: CreateActivityDialogProps) {
  const createMutation = useCreateActivity();
  const { data: usersData } = useUsers();
  const users: User[] = usersData?.data?.items || [];

  const [formData, setFormData] = useState<CreateActivityDto>({
    strActivityType: "Task",
    strSubject: "",
    strDescription: "",
    dtDueDate: "",
    strStatus: "Scheduled",
    strAssignedToGUID: "",
    links: [{ strEntityType: "Account", strEntityGUID: accountId }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Activity created successfully");
      onClose();
      setFormData({
        strActivityType: "Task",
        strSubject: "",
        strDescription: "",
        dtDueDate: "",
        strStatus: "Scheduled",
        strAssignedToGUID: "",
        links: [{ strEntityType: "Account", strEntityGUID: accountId }],
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to create activity");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Activity for {accountName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Activity Type *</Label>
                <Select
                  value={formData.strActivityType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, strActivityType: value as typeof ACTIVITY_TYPES[number] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Task">Task</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.strStatus ?? ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      strStatus: value as typeof ACTIVITY_STATUSES[number],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                required
                value={formData.strSubject}
                onChange={(e) => setFormData({ ...formData, strSubject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.strDescription || ""}
                onChange={(e) => setFormData({ ...formData, strDescription: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dtDueDate ?? ""}
                  onChange={(e) => setFormData({ ...formData, dtDueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select
                  value={formData.strAssignedToGUID || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, strAssignedToGUID: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.strUserGUID} value={user.strUserGUID}>
                        {user.strName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface BulkEmailDialogProps {
  open: boolean;
  onClose: () => void;
  selectedActivityIds: string[];
}

function BulkEmailDialog({ open, onClose, selectedActivityIds }: BulkEmailDialogProps) {
  const bulkNotifyMutation = useBulkNotifyActivities();
  const [message, setMessage] = useState("");
  const [notifyAssignedUsers, setNotifyAssignedUsers] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bulkNotifyMutation.mutateAsync({
        activityGuids: selectedActivityIds,
        message,
        notifyAssignedUsers,
      });
      toast.success(`Bulk email sent to ${selectedActivityIds.length} activities`);
      onClose();
      setMessage("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send bulk emails");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Send Bulk Email Notification</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="text-sm">
                Sending email notification for <strong>{selectedActivityIds.length}</strong> selected
                activities
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Custom Message</Label>
              <Textarea
                id="message"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter a custom message to include in the notification email..."
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="notifyAssigned"
                checked={notifyAssignedUsers}
                onCheckedChange={(checked) => setNotifyAssignedUsers(checked as boolean)}
              />
              <Label htmlFor="notifyAssigned" className="cursor-pointer">
                Send notification to assigned users
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={bulkNotifyMutation.isPending}>
              <Send className="mr-2 h-4 w-4" />
              {bulkNotifyMutation.isPending ? "Sending..." : "Send Bulk Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
