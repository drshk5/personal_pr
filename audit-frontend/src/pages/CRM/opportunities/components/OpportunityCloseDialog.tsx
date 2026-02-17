import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Trophy, XCircle } from "lucide-react";

import {
  closeOpportunitySchema,
  type CloseOpportunityFormValues,
} from "@/validations/CRM/opportunity";
import { useCloseOpportunity } from "@/hooks/api/CRM/use-opportunities";

import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

interface OpportunityCloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string;
  opportunityName: string;
  onSuccess?: () => void;
  defaultStatus?: "Won" | "Lost";
}

const OpportunityCloseDialog: React.FC<OpportunityCloseDialogProps> = ({
  open,
  onOpenChange,
  opportunityId,
  opportunityName,
  onSuccess,
  defaultStatus,
}) => {
  const { mutate: closeOpportunity, isPending } = useCloseOpportunity();

  const form = useForm<CloseOpportunityFormValues>({
    resolver: zodResolver(closeOpportunitySchema),
    defaultValues: {
      strStatus: defaultStatus || "Won",
      strLossReason: "",
      dtActualCloseDate: new Date().toISOString().split("T")[0],
    },
  });

  // Sync defaultStatus when dialog opens with a new status
  React.useEffect(() => {
    if (defaultStatus) {
      form.setValue("strStatus", defaultStatus);
    }
  }, [defaultStatus, form]);

  const selectedStatus = form.watch("strStatus");

  const onSubmit = (data: CloseOpportunityFormValues) => {
    closeOpportunity(
      {
        id: opportunityId,
        data: {
          strStatus: data.strStatus,
          strLossReason: data.strStatus === "Lost" ? data.strLossReason : null,
          dtActualCloseDate: data.dtActualCloseDate || null,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close Opportunity</DialogTitle>
          <DialogDescription>
            Close "{opportunityName}" as Won or Lost.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            {/* Won / Lost Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={selectedStatus === "Won" ? "default" : "outline"}
                className={
                  selectedStatus === "Won"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
                onClick={() => form.setValue("strStatus", "Won")}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Won
              </Button>
              <Button
                type="button"
                variant={selectedStatus === "Lost" ? "default" : "outline"}
                className={
                  selectedStatus === "Lost"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }
                onClick={() => form.setValue("strStatus", "Lost")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Lost
              </Button>
            </div>

            {/* Close Date */}
            <FormField
              control={form.control}
              name="dtActualCloseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Close Date</FormLabel>
                  <DatePicker
                    value={field.value ? new Date(field.value + "T12:00:00") : undefined}
                    onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                    placeholder="Select close date"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loss Reason (only for Lost) */}
            {selectedStatus === "Lost" && (
              <FormField
                control={form.control}
                name="strLossReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Loss Reason <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Why was this deal lost?"
                        className="resize-none min-h-20"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </Form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isPending}
            className={
              selectedStatus === "Won"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
          >
            {isPending
              ? "Closing..."
              : `Close as ${selectedStatus}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OpportunityCloseDialog;
