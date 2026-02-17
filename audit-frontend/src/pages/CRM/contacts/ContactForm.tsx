import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  Save,
  Trash2,
  Contact,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  CalendarDays,
} from "lucide-react";

import type { CreateContactDto, UpdateContactDto } from "@/types/CRM/contact";
import { CONTACT_LIFECYCLE_STAGES } from "@/types/CRM/contact";
import {
  contactSchema,
  type ContactFormValues,
} from "@/validations/CRM/contact";
import { Actions, FormModules } from "@/lib/permissions";

import {
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "@/hooks/api/CRM/use-contacts";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import NotFound from "@/components/error-boundaries/entity-not-found";
import type { AccountListDto } from "@/types/CRM/account";
import { useAccounts } from "@/hooks/api/CRM/use-accounts";
import { mapToStandardPagedResponse } from "@/lib/utils/pagination-utils";

import ContactFormSkeleton from "./ContactFormSkeleton";
import ContactLifecycleBadge from "./components/ContactLifecycleBadge";
import UserAssignSelect from "@/components/CRM/UserAssignSelect";

const activityIcons: Record<string, React.ElementType> = {
  Call: Phone,
  Email: Mail,
  Meeting: CalendarDays,
  Note: MessageSquare,
};

const ContactForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const HeaderIcon = useMenuIcon(FormModules.CRM_CONTACT, Contact);
  const isEditMode = !!id && id !== "create";

  // Data hooks
  const {
    data: contact,
    isFetching: isFetchingContact,
    error: contactError,
  } = useContact(isEditMode && id ? id : undefined);
  const { mutate: createContact, isPending: isCreating } = useCreateContact();
  const { mutate: updateContact, isPending: isUpdating } = useUpdateContact();
  const { mutate: deleteContact, isPending: isDeleting } = useDeleteContact();
  const { data: accountsResponse, isLoading: isLoadingAccounts } = useAccounts({
    pageNumber: 1,
    pageSize: 1000,
    bolIsActive: true,
    sortBy: "strAccountName",
    ascending: true,
  });

  // Form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      strAccountGUID: "",
      strFirstName: "",
      strLastName: "",
      strEmail: "",
      strPhone: "",
      strMobilePhone: "",
      strJobTitle: "",
      strDepartment: "",
      strLifecycleStage: "Subscriber",
      strAddress: "",
      strCity: "",
      strState: "",
      strCountry: "",
      strPostalCode: "",
      strNotes: "",
      strAssignedToGUID: "",
    },
  });

  const accountOptions = React.useMemo(
    () =>
      mapToStandardPagedResponse<AccountListDto>(
        accountsResponse?.data ?? accountsResponse
      ).items,
    [accountsResponse]
  );

  const accountSelectOptions = React.useMemo(
    () =>
      accountOptions.map((account) => ({
        value: account.strAccountGUID,
        label: account.strAccountName,
      })),
    [accountOptions]
  );

  const isLoading = isEditMode && isFetchingContact;
  const isSaving = isCreating || isUpdating;

  // Populate form in edit mode — single reset() instead of 15+ setValue() calls
  React.useEffect(() => {
    if (contact && isEditMode) {
      form.reset({
        strAccountGUID: contact.strAccountGUID || "",
        strFirstName: contact.strFirstName,
        strLastName: contact.strLastName,
        strEmail: contact.strEmail,
        strPhone: contact.strPhone || "",
        strMobilePhone: contact.strMobilePhone || "",
        strJobTitle: contact.strJobTitle || "",
        strDepartment: contact.strDepartment || "",
        strLifecycleStage:
          (contact.strLifecycleStage as ContactFormValues["strLifecycleStage"]) ||
          "Subscriber",
        strAddress: contact.strAddress || "",
        strCity: contact.strCity || "",
        strState: contact.strState || "",
        strCountry: contact.strCountry || "",
        strPostalCode: contact.strPostalCode || "",
        strNotes: contact.strNotes || "",
        strAssignedToGUID: contact.strAssignedToGUID || "",
      });
    }
  }, [contact, form, isEditMode]);

  // Handle delete
  const handleDelete = () => {
    if (!id) return;
    deleteContact(
      { id },
      {
        onSuccess: () => navigate("/crm/contacts"),
        onSettled: () => setShowDeleteConfirm(false),
      }
    );
  };

  // Handle submit
  const onSubmit = (data: ContactFormValues) => {
    if (isEditMode && id) {
      const updateData: UpdateContactDto = {
        strAccountGUID: data.strAccountGUID || null,
        strFirstName: data.strFirstName,
        strLastName: data.strLastName,
        strEmail: data.strEmail,
        strPhone: data.strPhone || null,
        strMobilePhone: data.strMobilePhone || null,
        strJobTitle: data.strJobTitle || null,
        strDepartment: data.strDepartment || null,
        strLifecycleStage: data.strLifecycleStage || null,
        strAddress: data.strAddress || null,
        strCity: data.strCity || null,
        strState: data.strState || null,
        strCountry: data.strCountry || null,
        strPostalCode: data.strPostalCode || null,
        strNotes: data.strNotes || null,
        strAssignedToGUID: data.strAssignedToGUID || null,
      };

      updateContact(
        { id, data: updateData },
        { onSuccess: () => navigate("/crm/contacts") }
      );
    } else {
      const createData: CreateContactDto = {
        strAccountGUID: data.strAccountGUID || null,
        strFirstName: data.strFirstName,
        strLastName: data.strLastName,
        strEmail: data.strEmail,
        strPhone: data.strPhone || null,
        strMobilePhone: data.strMobilePhone || null,
        strJobTitle: data.strJobTitle || null,
        strDepartment: data.strDepartment || null,
        strLifecycleStage: data.strLifecycleStage || null,
        strAddress: data.strAddress || null,
        strCity: data.strCity || null,
        strState: data.strState || null,
        strCountry: data.strCountry || null,
        strPostalCode: data.strPostalCode || null,
        strNotes: data.strNotes || null,
        strAssignedToGUID: data.strAssignedToGUID || null,
      };

      createContact(createData, {
        onSuccess: () => navigate("/crm/contacts"),
      });
    }
  };

  // Not found state
  if (
    isEditMode &&
    !isFetchingContact &&
    (contactError || (!contact && !isFetchingContact))
  ) {
    return <NotFound pageName="Contact" />;
  }

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Contact" : "Create New Contact"}
        description={
          isEditMode
            ? `Editing contact ${contact?.strFirstName || ""} ${contact?.strLastName || ""}`
            : "Create a new contact to manage relationships"
        }
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/crm/contacts")}
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
            <ContactFormSkeleton />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <div className="grid gap-6">
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

                        <FormField
                          control={form.control}
                          name="strMobilePhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Phone</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter mobile number"
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

                    {/* Professional Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Professional Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strAccountGUID"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account</FormLabel>
                              <FormControl>
                                <PreloadedSelect
                                  placeholder="No account"
                                  selectedValue={field.value || ""}
                                  onChange={field.onChange}
                                  options={accountSelectOptions}
                                  allowNone
                                  noneLabel="No account"
                                  isLoading={isLoadingAccounts}
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

                        <FormField
                          control={form.control}
                          name="strDepartment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter department"
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
                          name="strLifecycleStage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lifecycle Stage</FormLabel>
                              <Select
                                value={field.value || "Subscriber"}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select stage" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CONTACT_LIFECYCLE_STAGES.map((stage) => (
                                    <SelectItem key={stage} value={stage}>
                                      {stage}
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
                              placeholder="Add any notes about this contact..."
                              className="resize-none min-h-25"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Assignment */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Assignment
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strAssignedToGUID"
                          render={({ field }) => (
                            <UserAssignSelect
                              value={field.value || ""}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </Form>
              </CardContent>

              <CardFooter className="border-t px-6 py-4 bg-muted/20">
                <div className="flex items-center justify-between w-full">
                  <div>
                    {isEditMode && (
                      <WithPermission
                        module={FormModules.CRM_CONTACT}
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
                      module={FormModules.CRM_CONTACT}
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
        {isEditMode && contact && !isLoading && (
          <div className="space-y-4">
            {/* Contact Info Card */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-foreground">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Lifecycle Stage
                  </span>
                  <ContactLifecycleBadge stage={contact.strLifecycleStage} />
                </div>
                {contact.strAccountName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Account
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {contact.strAccountName}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Created
                  </span>
                  <span className="text-xs text-foreground">
                    {format(new Date(contact.dtCreatedOn), "MMM d, yyyy")}
                  </span>
                </div>
                {contact.dtLastContactedOn && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Last Contacted
                    </span>
                    <span className="text-xs text-foreground">
                      {format(
                        new Date(contact.dtLastContactedOn),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Assigned To
                  </span>
                  <span className="text-xs text-foreground">
                    {contact.strAssignedToName || <span className="text-muted-foreground">Unassigned</span>}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Related Opportunities */}
            {contact.opportunities && contact.opportunities.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-foreground">Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contact.opportunities.map((opp) => (
                      <div
                        key={opp.strOpportunityGUID}
                        className="flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">
                            {opp.strOpportunityName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {opp.strStageName} - {opp.strStatus}
                          </p>
                        </div>
                        {opp.dblAmount != null && (
                          <span className="text-xs font-medium text-foreground ml-2">
                            {opp.strCurrency}{" "}
                            {opp.dblAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activities */}
            {contact.recentActivities &&
              contact.recentActivities.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                      <Clock className="h-4 w-4" />
                      Recent Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {contact.recentActivities
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
        title="Delete Contact"
        description="Are you sure you want to delete this contact? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </CustomContainer>
  );
};

export default ContactForm;
