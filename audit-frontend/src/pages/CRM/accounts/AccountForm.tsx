import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  Save,
  Trash2,
  Building2,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  CalendarDays,
  Users,
  TrendingUp,
  Globe,
  DollarSign,
} from "lucide-react";

import type {
  CreateAccountDto,
  UpdateAccountDto,
} from "@/types/CRM/account";
import { ACCOUNT_INDUSTRIES } from "@/types/CRM/account";
import {
  accountSchema,
  type AccountFormValues,
} from "@/validations/CRM/account";
import { Actions, FormModules } from "@/lib/permissions";

import {
  useAccount,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "@/hooks/api/CRM/use-accounts";
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
import NotFound from "@/components/error-boundaries/entity-not-found";

import AccountFormSkeleton from "./AccountFormSkeleton";

const activityIcons: Record<string, React.ElementType> = {
  Call: Phone,
  Email: Mail,
  Meeting: CalendarDays,
  Note: MessageSquare,
};

const AccountForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const HeaderIcon = useMenuIcon(FormModules.CRM_ACCOUNT, Building2);
  const isEditMode = !!id && id !== "create";

  // Data hooks
  const {
    data: account,
    isFetching: isFetchingAccount,
    error: accountError,
  } = useAccount(isEditMode && id ? id : undefined);
  const { mutate: createAccount, isPending: isCreating } = useCreateAccount();
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateAccount();
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount();

  // Form
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      strAccountName: "",
      strIndustry: "",
      strWebsite: "",
      strPhone: "",
      strEmail: "",
      intEmployeeCount: null,
      dblAnnualRevenue: null,
      strAddress: "",
      strCity: "",
      strState: "",
      strCountry: "",
      strPostalCode: "",
      strDescription: "",
      strAssignedToGUID: "",
    },
  });

  const isLoading = isEditMode && isFetchingAccount;
  const isSaving = isCreating || isUpdating;

  // Populate form in edit mode
  React.useEffect(() => {
    if (account && isEditMode) {
      form.setValue("strAccountName", account.strAccountName);
      form.setValue("strIndustry", account.strIndustry || "");
      form.setValue("strWebsite", account.strWebsite || "");
      form.setValue("strPhone", account.strPhone || "");
      form.setValue("strEmail", account.strEmail || "");
      form.setValue("intEmployeeCount", account.intEmployeeCount ?? null);
      form.setValue("dblAnnualRevenue", account.dblAnnualRevenue ?? null);
      form.setValue("strAddress", account.strAddress || "");
      form.setValue("strCity", account.strCity || "");
      form.setValue("strState", account.strState || "");
      form.setValue("strCountry", account.strCountry || "");
      form.setValue("strPostalCode", account.strPostalCode || "");
      form.setValue("strDescription", account.strDescription || "");
      form.setValue("strAssignedToGUID", account.strAssignedToGUID || "");
    }
  }, [account, form, isEditMode]);

  // Handle delete
  const handleDelete = () => {
    if (!id) return;
    deleteAccount(
      { id },
      {
        onSuccess: () => navigate("/crm/accounts"),
        onSettled: () => setShowDeleteConfirm(false),
      }
    );
  };

  // Handle submit
  const onSubmit = (data: AccountFormValues) => {
    const baseDto = {
      strAccountName: data.strAccountName,
      strIndustry: data.strIndustry || null,
      strWebsite: data.strWebsite || null,
      strPhone: data.strPhone || null,
      strEmail: data.strEmail || null,
      intEmployeeCount: data.intEmployeeCount ?? null,
      dblAnnualRevenue: data.dblAnnualRevenue ?? null,
      strAddress: data.strAddress || null,
      strCity: data.strCity || null,
      strState: data.strState || null,
      strCountry: data.strCountry || null,
      strPostalCode: data.strPostalCode || null,
      strDescription: data.strDescription || null,
      strAssignedToGUID: data.strAssignedToGUID || null,
    };

    if (isEditMode && id) {
      const updateData: UpdateAccountDto = { ...baseDto };
      updateAccount(
        { id, data: updateData },
        { onSuccess: () => navigate("/crm/accounts") }
      );
    } else {
      const createData: CreateAccountDto = { ...baseDto };
      createAccount(createData, {
        onSuccess: () => navigate("/crm/accounts"),
      });
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Not found state
  if (
    isEditMode &&
    !isFetchingAccount &&
    (accountError || (!account && !isFetchingAccount))
  ) {
    return <NotFound pageName="Account" />;
  }

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Account" : "Create New Account"}
        description={
          isEditMode
            ? `Editing account ${account?.strAccountName || ""}`
            : "Create a new account to manage business relationships"
        }
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/crm/accounts")}
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
            <AccountFormSkeleton />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <div className="grid gap-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strAccountName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Account Name{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter account name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="strIndustry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry</FormLabel>
                              <Select
                                value={field.value || ""}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select industry" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {ACCOUNT_INDUSTRIES.map((ind) => (
                                    <SelectItem key={ind} value={ind}>
                                      {ind}
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
                          name="strWebsite"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com"
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

                    {/* Contact Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Contact Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          name="strEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Enter email address"
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

                    {/* Business Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Business Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="intEmployeeCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee Count</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter employee count"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === ""
                                        ? null
                                        : parseInt(e.target.value, 10)
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
                          name="dblAnnualRevenue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Revenue ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter annual revenue"
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

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="strDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add a description about this account..."
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
                        module={FormModules.CRM_ACCOUNT}
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
                      module={FormModules.CRM_ACCOUNT}
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
        {isEditMode && account && !isLoading && (
          <div className="space-y-4">
            {/* Account Info Card */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-foreground">Account Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {account.strIndustry && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Industry
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {account.strIndustry}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Contacts
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {account.intContactCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Open Opportunities
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {account.intOpenOpportunityCount}
                  </span>
                </div>
                {account.dblTotalOpportunityValue > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Pipeline Value
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {formatCurrency(account.dblTotalOpportunityValue)}
                    </span>
                  </div>
                )}
                {account.dblAnnualRevenue != null &&
                  account.dblAnnualRevenue > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Annual Revenue
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {formatCurrency(account.dblAnnualRevenue)}
                      </span>
                    </div>
                  )}
                {account.intEmployeeCount != null &&
                  account.intEmployeeCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Employees
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {account.intEmployeeCount.toLocaleString()}
                      </span>
                    </div>
                  )}
                {account.strWebsite && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Website
                    </span>
                    <a
                      href={
                        account.strWebsite.startsWith("http")
                          ? account.strWebsite
                          : `https://${account.strWebsite}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary hover:underline truncate max-w-[140px]"
                    >
                      {account.strWebsite}
                    </a>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Created
                  </span>
                  <span className="text-xs text-foreground">
                    {format(new Date(account.dtCreatedOn), "MMM d, yyyy")}
                  </span>
                </div>
                {account.strAssignedToName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Assigned To
                    </span>
                    <span className="text-xs text-foreground">{account.strAssignedToName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      account.bolIsActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {account.bolIsActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contacts */}
            {account.contacts && account.contacts.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contacts ({account.contacts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {account.contacts.map((contact) => (
                      <div
                        key={contact.strContactGUID}
                        className="flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">
                            {contact.strFirstName} {contact.strLastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.strEmail}
                          </p>
                        </div>
                        {contact.strJobTitle && (
                          <span className="text-xs text-muted-foreground ml-2 truncate max-w-[100px]">
                            {contact.strJobTitle}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Opportunities */}
            {account.opportunities && account.opportunities.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Opportunities ({account.opportunities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {account.opportunities.map((opp) => (
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
                            {opp.bolIsRotting && (
                              <span className="ml-1 text-amber-600 dark:text-amber-400">
                                (Rotting)
                              </span>
                            )}
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
            {account.recentActivities &&
              account.recentActivities.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {account.recentActivities
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
        title="Delete Account"
        description="Are you sure you want to delete this account? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </CustomContainer>
  );
};

export default AccountForm;
