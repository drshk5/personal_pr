import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, X, Phone, Mail, Users, StickyNote, CheckSquare, RotateCcw } from "lucide-react";

import {
  activitySchema,
  type ActivityFormValues,
} from "@/validations/CRM/activity";
import {
  ACTIVITY_TYPES,
  ACTIVITY_STATUSES,
  ACTIVITY_PRIORITIES,
  ENTITY_TYPES,
  type ActivityType,
  type ActivityListDto,
} from "@/types/CRM/activity";
import { useCreateActivity, useUpdateActivity } from "@/hooks/api/CRM/use-activities-extended";
import { useUsers } from "@/hooks/api/central/use-users";
import type { User } from "@/types/central/user";
import { getActivityTypeLabel } from "./ActivityTypeIcon";

import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLinks?: ActivityFormValues["links"];
  defaultActivityType?: ActivityType;
  editActivity?: ActivityListDto | null;
  onSuccess?: () => void;
}

const EMPTY_ACTIVITY_LINKS: ActivityFormValues["links"] = [];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Call: <Phone className="h-4 w-4" />,
  Email: <Mail className="h-4 w-4" />,
  Meeting: <Users className="h-4 w-4" />,
  Note: <StickyNote className="h-4 w-4" />,
  Task: <CheckSquare className="h-4 w-4" />,
  FollowUp: <RotateCcw className="h-4 w-4" />,
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  InProgress: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  Cancelled: "bg-red-500/10 text-red-600 border-red-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-slate-500/10 text-slate-600 border-slate-500/30",
  Medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  High: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  Urgent: "bg-red-500/10 text-red-600 border-red-500/30",
};

const formatStatusLabel = (s: string) => (s === "InProgress" ? "In Progress" : s);

const ActivityForm: React.FC<ActivityFormProps> = ({
  open,
  onOpenChange,
  defaultLinks = EMPTY_ACTIVITY_LINKS,
  defaultActivityType = "Note",
  editActivity = null,
  onSuccess,
}) => {
  const isEditing = !!editActivity;
  const { mutate: createActivity, isPending: isCreating } = useCreateActivity();
  const { mutate: updateActivity, isPending: isUpdating } = useUpdateActivity();
  const isPending = isCreating || isUpdating;
  const { data: usersData } = useUsers({ bolIsActive: true });
  const users: User[] = usersData?.data?.items || [];

  const getDefaultValues = React.useCallback((): ActivityFormValues => {
    if (editActivity) {
      return {
        strActivityType: (editActivity.strActivityType as ActivityType) || "Note",
        strSubject: editActivity.strSubject || "",
        strDescription: editActivity.strDescription || null,
        dtScheduledOn: editActivity.dtScheduledOn || null,
        dtCompletedOn: editActivity.dtCompletedOn || null,
        intDurationMinutes: editActivity.intDurationMinutes || null,
        strOutcome: editActivity.strOutcome || null,
        strStatus: (editActivity.strStatus as any) || "Pending",
        strPriority: (editActivity.strPriority as any) || "Medium",
        dtDueDate: editActivity.dtDueDate || null,
        strCategory: editActivity.strCategory || null,
        strAssignedToGUID: editActivity.strAssignedToGUID || null,
        links: editActivity.links?.map(l => ({
          strEntityType: l.strEntityType as any,
          strEntityGUID: l.strEntityGUID,
        })) || [],
      };
    }
    return {
      strActivityType: defaultActivityType,
      strSubject: "",
      strDescription: null,
      dtScheduledOn: null,
      dtCompletedOn: null,
      intDurationMinutes: null,
      strOutcome: null,
      strStatus: "Pending",
      strPriority: "Medium",
      dtDueDate: null,
      strCategory: null,
      strAssignedToGUID: null,
      links: [...defaultLinks],
    };
  }, [editActivity, defaultActivityType, defaultLinks]);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: getDefaultValues(),
  });

  React.useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
  }, [open, editActivity, form, getDefaultValues]);

  const watchType = form.watch("strActivityType");
  const links = form.watch("links") ?? [];

  const addLink = () => {
    const current = form.getValues("links") ?? [];
    form.setValue("links", [
      ...current,
      { strEntityType: "Lead", strEntityGUID: "" },
    ]);
  };

  const removeLink = (index: number) => {
    const current = form.getValues("links") ?? [];
    form.setValue("links", current.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ActivityFormValues) => {
    const payload = {
      strActivityType: data.strActivityType,
      strSubject: data.strSubject,
      strDescription: data.strDescription || null,
      dtScheduledOn: data.dtScheduledOn || null,
      dtCompletedOn: data.dtCompletedOn || null,
      intDurationMinutes: data.intDurationMinutes || null,
      strOutcome: data.strOutcome || null,
      strStatus: data.strStatus || "Pending",
      strPriority: data.strPriority || "Medium",
      dtDueDate: data.dtDueDate || null,
      strCategory: data.strCategory || null,
      strAssignedToGUID: data.strAssignedToGUID || null,
      links: (data.links ?? []).filter(l => l.strEntityGUID),
    };

    const successCb = {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    };

    if (isEditing && editActivity) {
      updateActivity({ id: editActivity.strActivityGUID, dto: payload }, successCb);
    } else {
      createActivity(payload, successCb);
    }
  };

  const showScheduleFields = ["Call", "Meeting", "Task", "FollowUp"].includes(watchType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {TYPE_ICONS[watchType]}
            {isEditing ? "Edit Activity" : "Log Activity"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the activity details below."
              : "Record a new activity with all details."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1: Type + Status + Priority */}
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="strActivityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            <div className="flex items-center gap-2">
                              {TYPE_ICONS[t]}
                              <span>{getActivityTypeLabel(t)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="strStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value ?? "Pending"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[s] || ""}`}>
                              {formatStatusLabel(s)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="strPriority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value ?? "Medium"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${PRIORITY_COLORS[p] || ""}`}>
                              {p}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subject */}
            <FormField
              control={form.control}
              name="strSubject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Follow-up call with John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="strDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Details about this activity..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assigned To + Category */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="strAssignedToGUID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select
                      value={field.value ?? "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Unassigned</span>
                        </SelectItem>
                        {users.map((user: User) => (
                          <SelectItem key={user.strUserGUID} value={user.strUserGUID}>
                            {user.strName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="strCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Sales, Support"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date + Schedule/Completion */}
            <div className={`grid gap-3 ${showScheduleFields ? "grid-cols-3" : "grid-cols-1"}`}>
              <FormField
                control={form.control}
                name="dtDueDate"
                render={({ field }) => {
                  const dateVal = field.value ? new Date(field.value) : undefined;
                  return (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <DatePicker
                        value={dateVal}
                        onChange={(date) => {
                          if (!date) { field.onChange(null); return; }
                          field.onChange(format(date, "yyyy-MM-dd'T'23:59:59"));
                        }}
                        placeholder="Due date"
                      />
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              {showScheduleFields && (
                <>
                  <FormField
                    control={form.control}
                    name="dtScheduledOn"
                    render={({ field }) => {
                      const dateVal = field.value ? new Date(field.value) : undefined;
                      const timeVal = field.value ? field.value.substring(11, 16) : "";
                      return (
                        <FormItem>
                          <FormLabel>Scheduled</FormLabel>
                          <div className="space-y-1">
                            <DatePicker
                              value={dateVal}
                              onChange={(date) => {
                                if (!date) { field.onChange(null); return; }
                                const time = timeVal || "09:00";
                                field.onChange(`${format(date, "yyyy-MM-dd")}T${time}`);
                              }}
                              placeholder="Date"
                            />
                            {dateVal && (
                              <Input
                                type="time"
                                className="h-8"
                                value={timeVal}
                                onChange={(e) => field.onChange(`${format(dateVal, "yyyy-MM-dd")}T${e.target.value}`)}
                              />
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="dtCompletedOn"
                    render={({ field }) => {
                      const dateVal = field.value ? new Date(field.value) : undefined;
                      const timeVal = field.value ? field.value.substring(11, 16) : "";
                      return (
                        <FormItem>
                          <FormLabel>Completed</FormLabel>
                          <div className="space-y-1">
                            <DatePicker
                              value={dateVal}
                              onChange={(date) => {
                                if (!date) { field.onChange(null); return; }
                                const time = timeVal || "09:00";
                                field.onChange(`${format(date, "yyyy-MM-dd")}T${time}`);
                              }}
                              placeholder="Date"
                            />
                            {dateVal && (
                              <Input
                                type="time"
                                className="h-8"
                                value={timeVal}
                                onChange={(e) => field.onChange(`${format(dateVal, "yyyy-MM-dd")}T${e.target.value}`)}
                              />
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </>
              )}
            </div>

            {/* Duration & Outcome */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="intDurationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={1440}
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="strOutcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outcome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Interested, No answer"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Entity Links */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Linked Entities</FormLabel>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addLink}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Link
                </Button>
              </div>
              {links.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No linked entities. Click "Add Link" to connect this activity to a Lead, Contact, Account, or Opportunity.
                </p>
              )}
              {links.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`links.${index}.strEntityType`}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ENTITY_TYPES.map((et) => (
                            <SelectItem key={et} value={et}>{et}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`links.${index}.strEntityGUID`}
                    render={({ field }) => (
                      <Input placeholder="Entity ID (GUID)" className="flex-1" {...field} />
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeLink(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEditing ? "Update Activity" : "Log Activity"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityForm;
