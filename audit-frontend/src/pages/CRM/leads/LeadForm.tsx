import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  Save,
  Trash2,
  Users,
  ArrowRightLeft,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  CalendarDays,
} from "lucide-react";

import type { CreateLeadDto, UpdateLeadDto } from "@/types/CRM/lead";
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_CONVERTIBLE_STATUSES } from "@/types/CRM/lead";
import { leadSchema, type LeadFormValues } from "@/validations/CRM/lead";
import { Actions, FormModules } from "@/lib/permissions";

import {
  useLead,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  useCheckDuplicates,
} from "@/hooks/api/CRM/use-leads";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useDebounce } from "@/hooks/common/use-debounce";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import NotFound from "@/components/error-boundaries/entity-not-found";

import LeadFormSkeleton from "./LeadFormSkeleton";
import LeadScoreBreakdown from "./components/LeadScoreBreakdown";
import LeadDuplicateWarning from "./components/LeadDuplicateWarning";
import LeadStatusBadge from "./components/LeadStatusBadge";
import LeadConvertDialog from "./components/LeadConvertDialog";
import LeadMergeDialog from "./components/LeadMergeDialog";

const activityIcons: Record<string, React.ElementType> = {
  Call: Phone,
  Email: Mail,
  Meeting: CalendarDays,
  Note: MessageSquare,
};

const LeadForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showConvertDialog, setShowConvertDialog] = React.useState(false);
  const [showMergeDialog, setShowMergeDialog] = React.useState(false);
  const HeaderIcon = useMenuIcon(FormModules.CRM_LEAD, Users);
  const isEditMode = !!id && id !== "create";

  // Data hooks
  const {
    data: lead,
    isFetching: isFetchingLead,
    error: leadError,
  } = useLead(isEditMode && id ? id : undefined);
  const { mutate: createLead, isPending: isCreating } = useCreateLead();
  const { mutate: updateLead, isPending: isUpdating } = useUpdateLead();
  const { mutate: deleteLead, isPending: isDeleting } = useDeleteLead();

  // Form
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      strFirstName: "",
      strLastName: "",
      strEmail: "",
      strPhone: "",
      strCompanyName: "",
      strJobTitle: "",
      strSource: "Other",
      strStatus: "New",
      strAddress: "",
      strCity: "",
      strState: "",
      strCountry: "",
      strPostalCode: "",
      strNotes: "",
      strAssignedToGUID: "",
    },
  });

  // Duplicate detection on email
  const watchedEmail = form.watch("strEmail");
  const watchedFirstName = form.watch("strFirstName");
  const watchedLastName = form.watch("strLastName");
  const debouncedEmail = useDebounce(watchedEmail, 600);
  const { data: duplicateCheck } = useCheckDuplicates(
    !isEditMode ? debouncedEmail : "",
    watchedFirstName,
    watchedLastName
  );

  const isLoading = isEditMode && isFetchingLead;
  const isSaving = isCreating || isUpdating;

  // Can this lead be converted?
  const canConvert =
    isEditMode &&
    lead &&
    LEAD_CONVERTIBLE_STATUSES.includes(
      lead.strStatus as (typeof LEAD_CONVERTIBLE_STATUSES)[number]
    );

  // Populate form in edit mode
  React.useEffect(() => {
    if (lead && isEditMode) {
      form.setValue("strFirstName", lead.strFirstName);
      form.setValue("strLastName", lead.strLastName);
      form.setValue("strEmail", lead.strEmail);
      form.setValue("strPhone", lead.strPhone || "");
      form.setValue("strCompanyName", lead.strCompanyName || "");
      form.setValue("strJobTitle", lead.strJobTitle || "");
      form.setValue(
        "strSource",
        (lead.strSource as LeadFormValues["strSource"]) || "Other"
      );
      form.setValue(
        "strStatus",
        (lead.strStatus as LeadFormValues["strStatus"]) || "New"
      );
      form.setValue("strAddress", lead.strAddress || "");
      form.setValue("strCity", lead.strCity || "");
      form.setValue("strState", lead.strState || "");
      form.setValue("strCountry", lead.strCountry || "");
      form.setValue("strPostalCode", lead.strPostalCode || "");
      form.setValue("strNotes", lead.strNotes || "");
      form.setValue("strAssignedToGUID", lead.strAssignedToGUID || "");
    }
  }, [lead, form, isEditMode]);

  // Handle delete
  const handleDelete = () => {
    if (!id) return;
    deleteLead(
      { id },
      {
        onSuccess: () => navigate("/crm/leads"),
        onSettled: () => setShowDeleteConfirm(false),
      }
    );
  };

  // Handle submit
  const onSubmit = (data: LeadFormValues) => {
    if (isEditMode && id) {
      const updateData: UpdateLeadDto = {
        strFirstName: data.strFirstName,
        strLastName: data.strLastName,
        strEmail: data.strEmail,
        strPhone: data.strPhone || null,
        strCompanyName: data.strCompanyName || null,
        strJobTitle: data.strJobTitle || null,
        strSource: data.strSource,
        strStatus: data.strStatus || "New",
        strAddress: data.strAddress || null,
        strCity: data.strCity || null,
        strState: data.strState || null,
        strCountry: data.strCountry || null,
        strPostalCode: data.strPostalCode || null,
        strNotes: data.strNotes || null,
        strAssignedToGUID: data.strAssignedToGUID || null,
      };

      updateLead(
        { id, data: updateData },
        { onSuccess: () => navigate("/crm/leads") }
      );
    } else {
      const createData: CreateLeadDto = {
        strFirstName: data.strFirstName,
        strLastName: data.strLastName,
        strEmail: data.strEmail,
        strPhone: data.strPhone || null,
        strCompanyName: data.strCompanyName || null,
        strJobTitle: data.strJobTitle || null,
        strSource: data.strSource,
        strAddress: data.strAddress || null,
        strCity: data.strCity || null,
        strState: data.strState || null,
        strCountry: data.strCountry || null,
        strPostalCode: data.strPostalCode || null,
        strNotes: data.strNotes || null,
        strAssignedToGUID: data.strAssignedToGUID || null,
        bolSkipDuplicateCheck: data.bolSkipDuplicateCheck,
      };

      createLead(createData, {
        onSuccess: () => navigate("/crm/leads"),
      });
    }
  };

  // Not found state
  if (
    isEditMode &&
    !isFetchingLead &&
    (leadError || (!lead && !isFetchingLead))
  ) {
    return <NotFound pageName="Lead" />;
  }

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Lead" : "Create New Lead"}
        description={
          isEditMode
            ? `Editing lead ${lead?.strFirstName || ""} ${lead?.strLastName || ""}`
            : "Create a new lead to track in your pipeline"
        }
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            {canConvert && (
              <WithPermission
                module={FormModules.CRM_LEAD}
                action={Actions.EDIT}
              >
                <Button
                  variant="outline"
                  onClick={() => setShowConvertDialog(true)}
                  className="h-9 text-xs sm:text-sm"
                  size="sm"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Convert
                </Button>
              </WithPermission>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/crm/leads")}
              className="h-9 text-xs sm:text-sm"
              size="sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main Form — 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <LeadFormSkeleton />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <div className="grid gap-6">
                    {/* Duplicate Warning */}
                    {!isEditMode &&
                      duplicateCheck?.bolHasDuplicates && (
                        <LeadDuplicateWarning
                          hasDuplicates
                          duplicates={duplicateCheck.duplicates}
                          compact={false}
                        />
                      )}

                    {/* Edit mode — duplicates from backend */}
                    {isEditMode &&
                      lead?.duplicates &&
                      lead.duplicates.length > 0 && (
                        <div className="space-y-2">
                          <LeadDuplicateWarning
                            hasDuplicates
                            duplicates={lead.duplicates}
                            compact={false}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMergeDialog(true)}
                          >
                            Merge Duplicates
                          </Button>
                        </div>
                      )}

                    {/* Personal Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strFirstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                First Name{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter first name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="strLastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Last Name{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter last name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="strEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Email <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Enter email address"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="strPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter phone number"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Company Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Company Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strCompanyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter company name"
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
                          name="strJobTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter job title"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Lead Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Lead Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strSource"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Source <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {LEAD_SOURCES.map((source) => (
                                    <SelectItem key={source} value={source}>
                                      {source === "ColdCall"
                                        ? "Cold Call"
                                        : source === "TradeShow"
                                          ? "Trade Show"
                                          : source}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {isEditMode && (
                          <FormField
                            control={form.control}
                            name="strStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Status{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select
                                  value={field.value || "New"}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {LEAD_STATUSES.filter(
                                      (s) => s !== "Converted"
                                    ).map((status) => (
                                      <SelectItem
                                        key={status}
                                        value={status}
                                      >
                                        {status}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Address
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strAddress"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2 lg:col-span-3">
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter street address"
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
                          name="strCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter city"
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
                          name="strState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter state"
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
                          name="strCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter country"
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
                          name="strPostalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter postal code"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="strNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any notes about this lead..."
                              className="resize-none min-h-25"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </CardContent>

              <CardFooter className="border-t px-6 py-4 bg-muted/20">
                <div className="flex items-center justify-between w-full">
                  <div>
                    {isEditMode && (
                      <WithPermission
                        module={FormModules.CRM_LEAD}
                        action={Actions.DELETE}
                      >
                        <Button
                          variant="destructive"
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={isDeleting || isSaving}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      </WithPermission>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <WithPermission
                      module={FormModules.CRM_LEAD}
                      action={isEditMode ? Actions.EDIT : Actions.SAVE}
                    >
                      <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isLoading || isSaving}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving
                          ? isEditMode
                            ? "Updating..."
                            : "Creating..."
                          : isEditMode
                            ? "Update"
                            : "Create"}
                      </Button>
                    </WithPermission>
                  </div>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Sidebar — 1/3 width on large screens */}
        {isEditMode && lead && !isLoading && (
          <div className="space-y-4">
            {/* Lead Score Breakdown */}
            <LeadScoreBreakdown
              score={lead.intLeadScore}
              breakdown={lead.scoreBreakdown}
            />

            {/* Lead Info Card */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Lead Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <LeadStatusBadge status={lead.strStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Created
                  </span>
                  <span className="text-xs">
                    {format(new Date(lead.dtCreatedOn), "MMM d, yyyy")}
                  </span>
                </div>
                {lead.dtUpdatedOn && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Updated
                    </span>
                    <span className="text-xs">
                      {format(new Date(lead.dtUpdatedOn), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Created By
                  </span>
                  <span className="text-xs">{lead.strCreatedByName}</span>
                </div>
                {lead.strAssignedToName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Assigned To
                    </span>
                    <span className="text-xs">{lead.strAssignedToName}</span>
                  </div>
                )}
                {lead.strStatus === "Converted" && lead.dtConvertedOn && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Converted On
                    </span>
                    <span className="text-xs">
                      {format(new Date(lead.dtConvertedOn), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            {lead.recentActivities && lead.recentActivities.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lead.recentActivities.slice(0, 5).map((activity) => {
                      const Icon =
                        activityIcons[activity.strActivityType] ||
                        MessageSquare;
                      return (
                        <div
                          key={activity.strActivityGUID}
                          className="flex items-start gap-3"
                        >
                          <div className="mt-0.5 rounded-full bg-muted p-1.5">
                            <Icon className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {activity.strSubject}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{activity.strActivityType}</span>
                              <span>
                                {format(
                                  new Date(activity.dtCreatedOn),
                                  "MMM d, h:mm a"
                                )}
                              </span>
                            </div>
                            {activity.strOutcome && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {activity.strOutcome}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />

      {/* Convert Dialog */}
      {showConvertDialog && lead && (
        <LeadConvertDialog
          open={showConvertDialog}
          onOpenChange={setShowConvertDialog}
          leadId={lead.strLeadGUID}
          leadName={`${lead.strFirstName} ${lead.strLastName}`}
          onSuccess={() => navigate("/crm/leads")}
        />
      )}

      {/* Merge Dialog */}
      {showMergeDialog && lead && lead.duplicates && (
        <LeadMergeDialog
          open={showMergeDialog}
          onOpenChange={setShowMergeDialog}
          primaryLeadId={lead.strLeadGUID}
          primaryLeadName={`${lead.strFirstName} ${lead.strLastName}`}
          primaryLeadEmail={lead.strEmail}
          duplicates={lead.duplicates}
        />
      )}
    </CustomContainer>
  );
};

export default LeadForm;
