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
import { useActivities, useBulkNotifyActivities } from "@/hooks/api/CRM/use-activities";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from "@/types/CRM/activity";
import { toast } from "sonner";
import ActivityForm from "@/pages/CRM/activities/components/ActivityForm";

interface AccountActivitiesTabProps {
  accountId: string;
  accountName: string;
}

const ACTIVITY_TYPE_ICONS = {
  Call: Phone,
  Email: Mail,
  Meeting: Video,
  Note: FileText,
  Task: FileText,
  FollowUp: Calendar,
};

const STATUS_COLORS = {
  Pending: "bg-yellow-500",
  InProgress: "bg-blue-500",
  Completed: "bg-green-500",
  Cancelled: "bg-red-500",
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
    : (activitiesData?.data as any)?.items || (activitiesData?.data as any)?.Items || (activitiesData as any)?.items || (activitiesData as any)?.Items || [];
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
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "FollowUp" ? "Follow Up" : t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {ACTIVITY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "InProgress" ? "In Progress" : s}
                    </SelectItem>
                  ))}
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

      <ActivityForm
        open={showCreateDialog}
        onOpenChange={(open) => { if (!open) setShowCreateDialog(false); }}
        defaultLinks={[{ strEntityType: "Account", strEntityGUID: accountId }]}
        entityContext={{ entityType: "Account", entityName: accountName }}
        onSuccess={() => setShowCreateDialog(false)}
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
