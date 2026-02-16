import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleHelp, Save, Tag, Trash2 } from "lucide-react";

import type {
  GeneralAccountCreate,
  GeneralAccountUpdate,
} from "@/types/Account/general-account";

import {
  generalAccountSchema,
  type GeneralAccountFormValues,
} from "@/validations/Account/general-account";

import { Actions, FormModules } from "@/lib/permissions";

import {
  useGeneralAccount,
  useCreateGeneralAccount,
  useUpdateGeneralAccount,
  useDeleteGeneralAccount,
} from "@/hooks/api/Account/use-general-accounts";
import { useActiveAccountTypes } from "@/hooks/api/central/use-account-types";
import { useActiveScheduleTree } from "@/hooks/api/central/use-schedules";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TreeScheduleDropdown } from "@/components/ui/select/tree-dropdown";
import NotFound from "@/components/error-boundaries/entity-not-found";
import { GeneralAccountFormSkeleton } from "./GeneralAccountFormSkeleton";

const GeneralAccountForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);
  const HeaderIcon = useMenuIcon(FormModules.ACCOUNT, Tag);
  const isEditMode = !!id && id !== "create";

  const [isScheduleDropdownOpen, setIsScheduleDropdownOpen] =
    React.useState<boolean>(false);

  // Enable lazy fetch for schedules; prefetch for edit to fill existing values
  // Schedule dropdown shows loading skeleton while data is being fetched
  const shouldPrefetch = isEditMode;
  const schedulesEnabled = isScheduleDropdownOpen || shouldPrefetch;

  const { data: accountTypes } = useActiveAccountTypes(undefined, true);

  const {
    data: scheduleTree,
    isLoading: isLoadingSchedules,
    refetch: refetchSchedules,
  } = useActiveScheduleTree(schedulesEnabled);

  const processedScheduleTree = React.useMemo(() => {
    return (scheduleTree || []).map((item) => ({
      ...item,
      type: item.type as "label" | "data",
      Children: (item.Children || []).map((child) => ({
        ...child,
        type: child.type as "label" | "data",
        Children: (child.Children || []).map((grandchild) => ({
          ...grandchild,
          type: grandchild.type as "label" | "data",
          Children: (grandchild.Children || []).map((greatGrandchild) => ({
            ...greatGrandchild,
            type: greatGrandchild.type as "label" | "data",
            Children: [],
          })),
        })),
      })),
    }));
  }, [scheduleTree]);

  const {
    data: generalAccount,
    isFetching: isFetchingGeneralAccount,
    error: generalAccountError,
  } = useGeneralAccount(isEditMode && id ? id : undefined);
  const { mutate: createGeneralAccount, isPending: isCreating } =
    useCreateGeneralAccount();
  const { mutate: updateGeneralAccount, isPending: isUpdating } =
    useUpdateGeneralAccount();
  const { mutate: deleteGeneralAccount, isPending: isDeleting } =
    useDeleteGeneralAccount();

  const form = useForm({
    resolver: zodResolver(generalAccountSchema),
    defaultValues: {
      strGeneralAccountName: "",
      strAccountTypeGUID: "",
      strScheduleGUID: "",
      strUDFCode: "",
      strDesc: "",
      bolIsActive: true,
    },
  });

  const isLoading = isEditMode && isFetchingGeneralAccount;
  const isSaving = isCreating || isUpdating;

  React.useEffect(() => {
    if (generalAccount && isEditMode && id) {
      form.setValue(
        "strGeneralAccountName",
        generalAccount.strGeneralAccountName
      );
      form.setValue("strAccountTypeGUID", generalAccount.strAccountTypeGUID);
      form.setValue("strScheduleGUID", generalAccount.strScheduleGUID);
      form.setValue("strUDFCode", generalAccount.strUDFCode);
      form.setValue("strDesc", generalAccount.strDesc || "");
      form.setValue("bolIsActive", generalAccount.bolIsActive);
    }
  }, [generalAccount, form, isEditMode, id]);

  React.useEffect(() => {
    if (!isEditMode && accountTypes && accountTypes.length > 0) {
      const generalAccountType = accountTypes.find(
        (type) => type.strName.toLowerCase() === "general"
      );

      if (generalAccountType) {
        form.setValue(
          "strAccountTypeGUID",
          generalAccountType.strAccountTypeGUID
        );
      } else {
        form.setValue("strAccountTypeGUID", accountTypes[0].strAccountTypeGUID);
      }
    }
  }, [accountTypes, form, isEditMode]);

  const handleDelete = () => {
    if (!id) return;

    deleteGeneralAccount(
      { id },
      {
        onSuccess: () => {
          navigate("/account");
        },
        onSettled: () => {
          setShowDeleteConfirm(false);
        },
      }
    );
  };

  const onSubmit = (data: GeneralAccountFormValues) => {
    if (isEditMode && id) {
      const updateData: GeneralAccountUpdate = {
        strGeneralAccountName: data.strGeneralAccountName,
        strAccountTypeGUID: data.strAccountTypeGUID,
        strScheduleGUID: data.strScheduleGUID,
        strUDFCode: data.strUDFCode,
        strDesc: data.strDesc,
        bolIsActive: data.bolIsActive,
      };

      updateGeneralAccount(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/account");
          },
        }
      );
    } else {
      const createData: GeneralAccountCreate = {
        strGeneralAccountName: data.strGeneralAccountName,
        strAccountTypeGUID: data.strAccountTypeGUID,
        strScheduleGUID: data.strScheduleGUID,
        strUDFCode: data.strUDFCode,
        strDesc: data.strDesc,
        bolIsActive: data.bolIsActive,
      };

      createGeneralAccount(createData, {
        onSuccess: () => {
          navigate("/account");
        },
      });
    }
  };

  if (
    isEditMode &&
    !isFetchingGeneralAccount &&
    (generalAccountError || (!generalAccount && !isFetchingGeneralAccount))
  ) {
    return <NotFound pageName="General Account" />;
  }

  return (
    <CustomContainer>
      <PageHeader
        title={
          isEditMode ? "Edit General Account" : "Create New General Account"
        }
        description={
          isEditMode
            ? `Editing general account ${generalAccount?.strGeneralAccountName || ""}`
            : "Create a new general account"
        }
        icon={HeaderIcon}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/account")}
            className="h-9 text-xs sm:text-sm"
            size="sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="grid gap-4">
        {isLoading ? (
          <GeneralAccountFormSkeleton />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="strGeneralAccountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            General Account Name{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter general account name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strScheduleGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Schedule <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <TreeScheduleDropdown
                              data={processedScheduleTree}
                              value={field.value ? [field.value] : []}
                              onSelectionChange={(items) => {
                                if (items.length > 0) {
                                  field.onChange(items[0].strScheduleGUID);
                                } else {
                                  field.onChange("");
                                }
                              }}
                              multiSelect={false}
                              placeholder="Select a schedule"
                              className="w-full"
                              isLoading={isLoadingSchedules}
                              onOpenChange={(isOpen: boolean) =>
                                setIsScheduleDropdownOpen(isOpen)
                              }
                              onRefresh={() => {
                                refetchSchedules();
                              }}
                              refreshLabel="Refresh Schedules"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="strUDFCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span>
                              Account Code <span className="text-red-500">*</span>
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground"
                                  aria-label="Account code help"
                                >
                                  <CircleHelp className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                Short code for this account defined by the user.
                                Must be 6 alphanumeric characters.
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter 6-character alphanumeric account code"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="strDesc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter general account description"
                            className="resize-none min-h-25"
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
                    name="bolIsActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-start gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            Active
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
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
                      module={FormModules.ACCOUNT}
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
                    module={FormModules.ACCOUNT}
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

export default GeneralAccountForm;
