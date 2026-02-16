import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  Save,
  Trash2,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
  Users,
  Phone,
  Mail,
  MessageSquare,
  CalendarDays,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import type {
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from "@/types/CRM/opportunity";
import { OPPORTUNITY_CURRENCIES } from "@/types/CRM/opportunity";
import type { AccountListDto } from "@/types/CRM/account";
import type { ContactListDto } from "@/types/CRM/contact";
import {
  opportunitySchema,
  type OpportunityFormValues,
} from "@/validations/CRM/opportunity";
import { Actions, FormModules } from "@/lib/permissions";

import {
  useOpportunity,
  useCreateOpportunity,
  useUpdateOpportunity,
  useDeleteOpportunity,
} from "@/hooks/api/CRM/use-opportunities";
import { useAccounts } from "@/hooks/api/CRM/use-accounts";
import { useContacts } from "@/hooks/api/CRM/use-contacts";
import { usePipelines, usePipeline } from "@/hooks/api/CRM/use-pipelines";
import { useActiveUsers } from "@/hooks/api/central/use-users";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { mapToStandardPagedResponse } from "@/lib/utils/pagination-utils";
import { opportunityService } from "@/services/CRM/opportunity.service";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import NotFound from "@/components/error-boundaries/entity-not-found";

import OpportunityFormSkeleton from "./OpportunityFormSkeleton";
import OpportunityCloseDialog from "./components/OpportunityCloseDialog";

const activityIcons: Record<string, React.ElementType> = {
  Call: Phone,
  Email: Mail,
  Meeting: CalendarDays,
  Note: MessageSquare,
};

const OpportunityForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showCloseDialog, setShowCloseDialog] = React.useState(false);
  const HeaderIcon = useMenuIcon(FormModules.CRM_OPPORTUNITY, TrendingUp);
  const isEditMode = !!id && id !== "create";

  // Data hooks
  const {
    data: opportunity,
    isFetching: isFetchingOpportunity,
    error: opportunityError,
  } = useOpportunity(isEditMode && id ? id : undefined);
  const { mutateAsync: createOpportunityAsync, isPending: isCreating } =
    useCreateOpportunity();
  const { mutateAsync: updateOpportunityAsync, isPending: isUpdating } =
    useUpdateOpportunity();
  const { mutate: deleteOpportunity, isPending: isDeleting } =
    useDeleteOpportunity();

  // Pipeline & Stages
  const { data: pipelines } = usePipelines();
  const { data: activeUsers = [] } = useActiveUsers();
  const [selectedPipelineId, setSelectedPipelineId] = React.useState<string>("");
  const { data: pipelineDetail } = usePipeline(
    selectedPipelineId || undefined
  );

  // Form
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      strOpportunityName: "",
      strAccountGUID: "",
      strPipelineGUID: "",
      strStageGUID: "",
      dblAmount: null,
      strCurrency: "INR",
      dtExpectedCloseDate: "",
      strDescription: "",
      strAssignedToGUID: "",
    },
  });

  const [selectedContactGUIDs, setSelectedContactGUIDs] = React.useState<string[]>([]);
  const [isSyncingContacts, setIsSyncingContacts] = React.useState(false);

  const selectedAccountGUID = form.watch("strAccountGUID") || "";

  const { data: accountsResponse } = useAccounts({
    pageNumber: 1,
    pageSize: 200,
    bolIsActive: true,
    sortBy: "strAccountName",
    ascending: true,
  });

  const { data: contactsResponse } = useContacts({
    pageNumber: 1,
    pageSize: 200,
    bolIsActive: true,
    strAccountGUID: selectedAccountGUID || undefined,
    sortBy: "strFirstName",
    ascending: true,
  });

  const accountOptions = React.useMemo(
    () =>
      mapToStandardPagedResponse<AccountListDto>(
        accountsResponse?.data ?? accountsResponse
      ).items,
    [accountsResponse]
  );

  const contactOptions = React.useMemo(
    () =>
      mapToStandardPagedResponse<ContactListDto>(
        contactsResponse?.data ?? contactsResponse
      ).items,
    [contactsResponse]
  );

  const visibleContactIds = React.useMemo(
    () => new Set(contactOptions.map((contact) => contact.strContactGUID)),
    [contactOptions]
  );
  const hiddenSelectedCount = selectedContactGUIDs.filter(
    (contactId) => !visibleContactIds.has(contactId)
  ).length;

  const isLoading = isEditMode && isFetchingOpportunity;
  const isSaving = isCreating || isUpdating || isSyncingContacts;

  // Set default pipeline
  React.useEffect(() => {
    if (pipelines && pipelines.length > 0 && !selectedPipelineId && !isEditMode) {
      const defaultPipeline = pipelines.find((p) => p.bolIsDefault) || pipelines[0];
      setSelectedPipelineId(defaultPipeline.strPipelineGUID);
      form.setValue("strPipelineGUID", defaultPipeline.strPipelineGUID);
    }
  }, [pipelines, selectedPipelineId, isEditMode, form]);

  // Set default stage when pipeline changes
  React.useEffect(() => {
    if (pipelineDetail?.Stages && pipelineDetail.Stages.length > 0 && !isEditMode) {
      const sortedStages = [...pipelineDetail.Stages].sort(
        (a, b) => a.intDisplayOrder - b.intDisplayOrder
      );
      const firstStage = sortedStages[0];
      if (firstStage && !form.getValues("strStageGUID")) {
        form.setValue("strStageGUID", firstStage.strStageGUID);
      }
    }
  }, [pipelineDetail, isEditMode, form]);

  // Populate form in edit mode
  React.useEffect(() => {
    if (opportunity && isEditMode) {
      form.setValue("strOpportunityName", opportunity.strOpportunityName);
      form.setValue("strAccountGUID", opportunity.strAccountGUID || "");
      form.setValue("strPipelineGUID", opportunity.strPipelineGUID);
      form.setValue("strStageGUID", opportunity.strStageGUID);
      form.setValue("dblAmount", opportunity.dblAmount ?? null);
      form.setValue("strCurrency", opportunity.strCurrency as typeof OPPORTUNITY_CURRENCIES[number] || "INR");
      form.setValue(
        "dtExpectedCloseDate",
        opportunity.dtExpectedCloseDate
          ? opportunity.dtExpectedCloseDate.split("T")[0]
          : ""
      );
      form.setValue("strDescription", opportunity.strDescription || "");
      form.setValue("strAssignedToGUID", opportunity.strAssignedToGUID || "");
      setSelectedPipelineId(opportunity.strPipelineGUID);
      setSelectedContactGUIDs(
        (opportunity.contacts ?? []).map((contact) => contact.strContactGUID)
      );
    }
  }, [opportunity, form, isEditMode]);

  React.useEffect(() => {
    if (!isEditMode) {
      setSelectedContactGUIDs([]);
    }
  }, [isEditMode]);

  // Handle pipeline change
  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    form.setValue("strPipelineGUID", pipelineId);
    form.setValue("strStageGUID", ""); // reset stage
  };

  // Handle delete
  const handleDelete = () => {
    if (!id) return;
    deleteOpportunity(
      { id },
      {
        onSuccess: () => navigate("/crm/opportunities"),
        onSettled: () => setShowDeleteConfirm(false),
      }
    );
  };

  const toggleContactSelection = (contactGUID: string) => {
    setSelectedContactGUIDs((previous) =>
      previous.includes(contactGUID)
        ? previous.filter((id) => id !== contactGUID)
        : [...previous, contactGUID]
    );
  };

  const syncOpportunityContacts = React.useCallback(
    async (opportunityId: string, currentContactGUIDs: string[]) => {
      const nextContactGUIDs = Array.from(new Set(selectedContactGUIDs));
      const contactsToAdd = nextContactGUIDs.filter(
        (contactId) => !currentContactGUIDs.includes(contactId)
      );
      const contactsToRemove = currentContactGUIDs.filter(
        (contactId) => !nextContactGUIDs.includes(contactId)
      );

      if (contactsToAdd.length === 0 && contactsToRemove.length === 0) {
        return;
      }

      const remainingAfterRemove = currentContactGUIDs.filter(
        (contactId) => !contactsToRemove.includes(contactId)
      );
      const primaryContactToAdd =
        remainingAfterRemove.length === 0 && contactsToAdd.length > 0
          ? contactsToAdd[0]
          : null;

      setIsSyncingContacts(true);
      try {
        await Promise.all([
          ...contactsToAdd.map((contactId) =>
            opportunityService.addContact(opportunityId, {
              strContactGUID: contactId,
              strRole: "Stakeholder",
              bolIsPrimary: contactId === primaryContactToAdd,
            })
          ),
          ...contactsToRemove.map((contactId) =>
            opportunityService.removeContact(opportunityId, contactId)
          ),
        ]);
      } finally {
        setIsSyncingContacts(false);
      }
    },
    [selectedContactGUIDs]
  );

  // Handle submit
  const onSubmit = async (data: OpportunityFormValues) => {
    let attemptedContactSync = false;
    try {
      if (isEditMode && id) {
        const updateData: UpdateOpportunityDto = {
          strOpportunityName: data.strOpportunityName,
          strAccountGUID: data.strAccountGUID || null,
          strStageGUID: data.strStageGUID,
          dblAmount: data.dblAmount ?? null,
          strCurrency: data.strCurrency,
          dtExpectedCloseDate: data.dtExpectedCloseDate || null,
          strDescription: data.strDescription || null,
          strAssignedToGUID: data.strAssignedToGUID || null,
        };

        const updatedOpportunity = await updateOpportunityAsync({
          id,
          data: updateData,
        });

        attemptedContactSync = true;
        await syncOpportunityContacts(
          updatedOpportunity.strOpportunityGUID,
          (updatedOpportunity.contacts ?? []).map(
            (contact) => contact.strContactGUID
          )
        );
      } else {
        const createData: CreateOpportunityDto = {
          strOpportunityName: data.strOpportunityName,
          strAccountGUID: data.strAccountGUID || null,
          strPipelineGUID: data.strPipelineGUID,
          strStageGUID: data.strStageGUID,
          dblAmount: data.dblAmount ?? null,
          strCurrency: data.strCurrency,
          dtExpectedCloseDate: data.dtExpectedCloseDate || null,
          strDescription: data.strDescription || null,
          strAssignedToGUID: data.strAssignedToGUID || null,
        };

        const createdOpportunity = await createOpportunityAsync(createData);

        attemptedContactSync = true;
        await syncOpportunityContacts(
          createdOpportunity.strOpportunityGUID,
          (createdOpportunity.contacts ?? []).map(
            (contact) => contact.strContactGUID
          )
        );
      }

      navigate("/crm/opportunities");
    } catch {
      if (attemptedContactSync) {
        toast.error(
          "Opportunity was saved, but contact links could not be fully updated."
        );
      }
    }
  };

  // Stage display order
  const sortedStages = React.useMemo(() => {
    if (!pipelineDetail?.Stages) return [];
    return [...pipelineDetail.Stages].sort(
      (a, b) => a.intDisplayOrder - b.intDisplayOrder
    );
  }, [pipelineDetail]);

  // Not found state
  if (
    isEditMode &&
    !isFetchingOpportunity &&
    (opportunityError || (!opportunity && !isFetchingOpportunity))
  ) {
    return <NotFound pageName="Opportunity" />;
  }

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Opportunity" : "Create New Opportunity"}
        description={
          isEditMode
            ? `Editing opportunity ${opportunity?.strOpportunityName || ""}`
            : "Create a new deal in your sales pipeline"
        }
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/crm/opportunities")}
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
            <OpportunityFormSkeleton />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <div className="grid gap-6">
                    {/* Deal Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Deal Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strOpportunityName"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2 lg:col-span-3">
                              <FormLabel>
                                Opportunity Name{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter opportunity name"
                                  {...field}
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
                              <FormLabel>
                                Pipeline{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select
                                value={field.value || ""}
                                onValueChange={(val) =>
                                  handlePipelineChange(val)
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select pipeline" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {pipelines?.map((p) => (
                                    <SelectItem
                                      key={p.strPipelineGUID}
                                      value={p.strPipelineGUID}
                                    >
                                      {p.strPipelineName}
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
                          name="strStageGUID"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Stage{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select
                                value={field.value || ""}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select stage" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {sortedStages.map((stage) => (
                                    <SelectItem
                                      key={stage.strStageGUID}
                                      value={stage.strStageGUID}
                                    >
                                      {stage.strStageName} (
                                      {stage.intProbabilityPercent}%)
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
                          name="strAccountGUID"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account</FormLabel>
                              <Select
                                value={field.value || "__none__"}
                                onValueChange={(value) =>
                                  field.onChange(
                                    value === "__none__" ? "" : value
                                  )
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="__none__">
                                    No account
                                  </SelectItem>
                                  {accountOptions.map((account) => (
                                    <SelectItem
                                      key={account.strAccountGUID}
                                      value={account.strAccountGUID}
                                    >
                                      {account.strAccountName}
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
                          name="strAssignedToGUID"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assigned To</FormLabel>
                              <Select
                                value={field.value || "__none__"}
                                onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select team member" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="__none__">Unassigned</SelectItem>
                                  {activeUsers.map((user) => (
                                    <SelectItem
                                      key={user.strUserGUID}
                                      value={user.strUserGUID}
                                    >
                                      {user.strName}
                                      {user.strEmailId ? ` (${user.strEmailId})` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Relationships */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Relationships
                      </h3>
                      <div className="space-y-2">
                        <FormLabel>
                          Linked Contacts
                          {selectedAccountGUID && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              (filtered by selected account)
                            </span>
                          )}
                        </FormLabel>

                        <div className="rounded-md border p-3 max-h-52 overflow-y-auto space-y-2">
                          {contactOptions.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {selectedAccountGUID
                                ? "No contacts found for the selected account."
                                : "No contacts available to link."}
                            </p>
                          ) : (
                            contactOptions.map((contact) => {
                              const fullName =
                                `${contact.strFirstName} ${contact.strLastName}`.trim();
                              const isChecked = selectedContactGUIDs.includes(
                                contact.strContactGUID
                              );

                              return (
                                <label
                                  key={contact.strContactGUID}
                                  className="flex items-start gap-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4 rounded border-input"
                                    checked={isChecked}
                                    onChange={() =>
                                      toggleContactSelection(
                                        contact.strContactGUID
                                      )
                                    }
                                  />
                                  <span className="min-w-0">
                                    <span className="block text-sm text-foreground truncate">
                                      {fullName}
                                    </span>
                                    <span className="block text-xs text-muted-foreground truncate">
                                      {contact.strEmail}
                                    </span>
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>

                        {hiddenSelectedCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {hiddenSelectedCount} linked contact
                            {hiddenSelectedCount > 1 ? "s are" : " is"} outside
                            the current filter and will be kept unless you
                            remove them.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Financial Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="dblAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deal Amount</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter deal amount"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? null
                                        : parseFloat(e.target.value)
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
                          name="strCurrency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select
                                value={field.value || "INR"}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {OPPORTUNITY_CURRENCIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {c}
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
                          name="dtExpectedCloseDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Close Date</FormLabel>
                              <DatePicker
                                value={field.value ? new Date(field.value + "T12:00:00") : undefined}
                                onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                placeholder="Select expected close date"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="strDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add a description about this deal..."
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
                  <div className="flex gap-2">
                    {isEditMode && (
                      <>
                        <WithPermission
                          module={FormModules.CRM_OPPORTUNITY}
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

                        {opportunity?.strStatus === "Open" && (
                          <Button
                            variant="outline"
                            onClick={() => setShowCloseDialog(true)}
                            disabled={isSaving}
                          >
                            <Trophy className="h-4 w-4 mr-2" />
                            Close Deal
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <WithPermission
                      module={FormModules.CRM_OPPORTUNITY}
                      action={isEditMode ? Actions.EDIT : Actions.SAVE}
                    >
                      <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isLoading || isSaving}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving
                          ? isSyncingContacts
                            ? "Syncing contacts..."
                            : isEditMode
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
        {isEditMode && opportunity && !isLoading && (
          <div className="space-y-4">
            {/* Deal Overview Card */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-foreground">Deal Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      opportunity.strStatus === "Won"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : opportunity.strStatus === "Lost"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}
                  >
                    {opportunity.strStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Stage</span>
                  <span className="text-xs font-medium text-foreground">
                    {opportunity.strStageName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Pipeline
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {opportunity.strPipelineName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Amount
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {opportunity.dblAmount != null
                      ? `${opportunity.strCurrency} ${opportunity.dblAmount.toLocaleString()}`
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Probability
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {opportunity.intProbability}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Days in Stage
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {opportunity.intDaysInStage}
                  </span>
                </div>
                {opportunity.bolIsRotting && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      This deal is rotting!
                    </span>
                  </div>
                )}
                {opportunity.strAccountName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Account
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {opportunity.strAccountName}
                    </span>
                  </div>
                )}
                {opportunity.strAssignedToName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Assigned To
                    </span>
                    <span className="text-xs text-foreground">
                      {opportunity.strAssignedToName}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Created</span>
                  <span className="text-xs text-foreground">
                    {format(new Date(opportunity.dtCreatedOn), "MMM d, yyyy")}
                  </span>
                </div>
                {opportunity.dtExpectedCloseDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Expected Close
                    </span>
                    <span className="text-xs text-foreground">
                      {format(
                        new Date(opportunity.dtExpectedCloseDate),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                )}
                {opportunity.dtActualCloseDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Actual Close
                    </span>
                    <span className="text-xs text-foreground">
                      {format(
                        new Date(opportunity.dtActualCloseDate),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                )}
                {opportunity.strLossReason && (
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground block mb-1">
                      Loss Reason
                    </span>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {opportunity.strLossReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contacts */}
            {opportunity.contacts && opportunity.contacts.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contacts ({opportunity.contacts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {opportunity.contacts.map((contact) => (
                      <div
                        key={contact.strContactGUID}
                        className="flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">
                            {contact.strContactName}
                            {contact.bolIsPrimary && (
                              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
                                Primary
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {contact.strRole}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activities */}
            {opportunity.recentActivities &&
              opportunity.recentActivities.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {opportunity.recentActivities
                        .slice(0, 5)
                        .map((activity) => {
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
                                <p className="text-xs font-medium text-foreground truncate">
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
        title="Delete Opportunity"
        description="Are you sure you want to delete this opportunity? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />

      {/* Close Dialog */}
      {isEditMode && opportunity && (
        <OpportunityCloseDialog
          open={showCloseDialog}
          onOpenChange={setShowCloseDialog}
          opportunityId={id!}
          opportunityName={opportunity.strOpportunityName}
          onSuccess={() => navigate("/crm/opportunities")}
        />
      )}
    </CustomContainer>
  );
};

export default OpportunityForm;
