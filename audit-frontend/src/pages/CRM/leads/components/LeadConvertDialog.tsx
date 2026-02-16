import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft, Sparkles } from "lucide-react";

import {
  convertLeadSchema,
  type ConvertLeadFormValues,
} from "@/validations/CRM/lead";
import { useConvertLead } from "@/hooks/api/CRM/use-leads";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

interface LeadConvertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  onSuccess?: () => void;
}

const LeadConvertDialog: React.FC<LeadConvertDialogProps> = ({
  open,
  onOpenChange,
  leadId,
  leadName,
  onSuccess,
}) => {
  const { mutate: convertLead, isPending } = useConvertLead();

  const form = useForm<ConvertLeadFormValues>({
    resolver: zodResolver(convertLeadSchema),
    defaultValues: {
      strLeadGUID: leadId,
      bolCreateAccount: true,
      bolCreateOpportunity: true,
      strExistingAccountGUID: null,
      strOpportunityName: null,
      strPipelineGUID: null,
      dblAmount: null,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        strLeadGUID: leadId,
        bolCreateAccount: true,
        bolCreateOpportunity: true,
        strExistingAccountGUID: null,
        strOpportunityName: null,
        strPipelineGUID: null,
        dblAmount: null,
      });
    }
  }, [open, leadId, form]);

  const watchCreateAccount = form.watch("bolCreateAccount");
  const watchCreateOpportunity = form.watch("bolCreateOpportunity");

  const onSubmit = (data: ConvertLeadFormValues) => {
    convertLead(
      {
        strLeadGUID: data.strLeadGUID,
        bolCreateAccount: data.bolCreateAccount,
        bolCreateOpportunity: data.bolCreateOpportunity,
        strExistingAccountGUID: data.strExistingAccountGUID || null,
        strOpportunityName: data.strOpportunityName || null,
        strPipelineGUID: data.strPipelineGUID || null,
        dblAmount: data.dblAmount || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Convert Lead
          </DialogTitle>
          <DialogDescription>
            Convert <strong>{leadName}</strong> into a Contact, Account, and
            optionally an Opportunity.
          </DialogDescription>
        </DialogHeader>

        {/* What happens summary */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            What will be created:
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5 ml-5">
            <li>A new Contact (from lead's personal info)</li>
            {watchCreateAccount && (
              <li>A new Account (from lead's company info)</li>
            )}
            {watchCreateOpportunity && (
              <li>A new Opportunity (deal in the pipeline)</li>
            )}
            <li>All activities will be transferred</li>
          </ul>
        </div>

        <Form {...form}>
          <div className="grid gap-4 py-2">
            <FormField
              control={form.control}
              name="bolCreateAccount"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    Create new Account from company info
                  </FormLabel>
                </FormItem>
              )}
            />

            {!watchCreateAccount && (
              <FormField
                control={form.control}
                name="strExistingAccountGUID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Existing Account</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter existing Account ID"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="bolCreateOpportunity"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    Create new Opportunity (Deal)
                  </FormLabel>
                </FormItem>
              )}
            />

            {watchCreateOpportunity && (
              <>
                <FormField
                  control={form.control}
                  name="strOpportunityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opportunity Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., New deal for company"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strPipelineGUID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pipeline (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Pipeline ID (leave blank for default)"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dblAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Amount (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Enter amount"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? null : parseFloat(val)
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </Form>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isPending}
          >
            {isPending ? "Converting..." : "Convert Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeadConvertDialog;
