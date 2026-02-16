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
      <DialogContent className="max-w-md border-border-color/80 bg-gradient-to-b from-background via-background to-muted/20 shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-xl tracking-tight text-foreground">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
              <ArrowRightLeft className="h-4 w-4" />
            </span>
            Convert Lead
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-foreground/80">
            Convert <strong className="font-semibold text-foreground">{leadName}</strong>{" "}
            into a Contact, Account, and optionally an Opportunity.
          </DialogDescription>
        </DialogHeader>

        {/* What happens summary */}
        <div className="space-y-2 rounded-xl border border-border-color/70 bg-gradient-to-br from-muted/55 to-muted/25 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            What will be created
          </div>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2 text-sm text-foreground/85">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70" />
              <span>A new Contact (from lead&apos;s personal info)</span>
            </li>
            {watchCreateAccount && (
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>A new Account (from lead&apos;s company info)</span>
              </li>
            )}
            {watchCreateOpportunity && (
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span>A new Opportunity (deal in the pipeline)</span>
              </li>
            )}
            <li className="flex items-start gap-2 text-sm text-foreground/85">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70" />
              <span>All activities will be transferred</span>
            </li>
          </ul>
        </div>

        <Form {...form}>
          <div className="grid gap-3 py-1">
            <FormField
              control={form.control}
              name="bolCreateAccount"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border-color/60 bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/35">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer text-sm font-medium text-foreground/95">
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
                  <FormItem className="rounded-lg border border-border-color/55 bg-muted/15 p-3">
                    <FormLabel className="text-sm font-semibold text-foreground/90">
                      Link to Existing Account
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-11 bg-background/80 text-foreground placeholder:text-foreground/45 focus-visible:ring-primary/25"
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
                <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border-color/60 bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/35">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer text-sm font-medium text-foreground/95">
                    Create new Opportunity (Deal)
                  </FormLabel>
                </FormItem>
              )}
            />

            {watchCreateOpportunity && (
              <div className="space-y-3 rounded-lg border border-border-color/60 bg-muted/15 p-3">
                <FormField
                  control={form.control}
                  name="strOpportunityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground/90">
                        Opportunity Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-11 bg-background/80 text-foreground placeholder:text-foreground/45 focus-visible:ring-primary/25"
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
                      <FormLabel className="text-sm font-semibold text-foreground/90">
                        Pipeline (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-11 bg-background/80 text-foreground placeholder:text-foreground/45 focus-visible:ring-primary/25"
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
                      <FormLabel className="text-sm font-semibold text-foreground/90">
                        Deal Amount (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-11 bg-background/80 text-foreground placeholder:text-foreground/45 focus-visible:ring-primary/25"
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
              </div>
            )}
          </div>
        </Form>

        <DialogFooter className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="min-w-24 border-border-color/80 bg-background/80 text-foreground hover:bg-muted/40"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isPending}
            className="min-w-28 font-semibold shadow-sm shadow-primary/20"
          >
            {isPending ? "Converting..." : "Convert Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeadConvertDialog;
