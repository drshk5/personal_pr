import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";

import {
  activitySchema,
  type ActivityFormValues,
} from "@/validations/CRM/activity";
import { ACTIVITY_TYPES, ENTITY_TYPES } from "@/types/CRM/activity";
import type { ActivityLinkDto } from "@/types/CRM/activity";
import { useCreateActivity } from "@/hooks/api/CRM/use-activities";
import { getActivityTypeLabel } from "./ActivityTypeIcon";

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
  /** Pre-fill links (e.g. when adding from entity detail page) */
  defaultLinks?: ActivityLinkDto[];
  onSuccess?: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({
  open,
  onOpenChange,
  defaultLinks = [],
  onSuccess,
}) => {
  const { mutate: createActivity, isPending } = useCreateActivity();

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      strActivityType: "Note",
      strSubject: "",
      strDescription: null,
      dtScheduledOn: null,
      dtCompletedOn: null,
      intDurationMinutes: null,
      strOutcome: null,
      strAssignedToGUID: null,
      links: defaultLinks,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        strActivityType: "Note",
        strSubject: "",
        strDescription: null,
        dtScheduledOn: null,
        dtCompletedOn: null,
        intDurationMinutes: null,
        strOutcome: null,
        strAssignedToGUID: null,
        links: defaultLinks,
      });
    }
  }, [open, form, defaultLinks]);

  const watchType = form.watch("strActivityType");
  const links = form.watch("links");

  const addLink = () => {
    const current = form.getValues("links");
    form.setValue("links", [
      ...current,
      { strEntityType: "Lead", strEntityGUID: "" },
    ]);
  };

  const removeLink = (index: number) => {
    const current = form.getValues("links");
    form.setValue(
      "links",
      current.filter((_, i) => i !== index)
    );
  };

  const onSubmit = (data: ActivityFormValues) => {
    createActivity(
      {
        strActivityType: data.strActivityType,
        strSubject: data.strSubject,
        strDescription: data.strDescription || null,
        dtScheduledOn: data.dtScheduledOn || null,
        dtCompletedOn: data.dtCompletedOn || null,
        intDurationMinutes: data.intDurationMinutes || null,
        strOutcome: data.strOutcome || null,
        strAssignedToGUID: data.strAssignedToGUID || null,
        links: data.links.filter((l) => l.strEntityGUID),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  const showScheduleFields = ["Call", "Meeting", "Task", "FollowUp"].includes(
    watchType
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
          <DialogDescription>
            Record a new activity. Activities are immutable once created.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Activity Type */}
            <FormField
              control={form.control}
              name="strActivityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {getActivityTypeLabel(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject */}
            <FormField
              control={form.control}
              name="strSubject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Follow-up call with John"
                      {...field}
                    />
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

            {/* Schedule / Completion Row */}
            {showScheduleFields && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dtScheduledOn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dtCompletedOn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completed</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Duration & Outcome Row */}
            <div className="grid grid-cols-2 gap-4">
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
                          field.onChange(
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={addLink}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Link
                </Button>
              </div>
              {links.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`links.${index}.strEntityType`}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ENTITY_TYPES.map((et) => (
                            <SelectItem key={et} value={et}>
                              {et}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`links.${index}.strEntityGUID`}
                    render={({ field }) => (
                      <Input
                        placeholder="Entity ID (GUID)"
                        className="flex-1"
                        {...field}
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => removeLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Log Activity"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityForm;
