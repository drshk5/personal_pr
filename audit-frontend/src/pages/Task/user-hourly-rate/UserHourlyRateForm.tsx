import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeft, Save, DollarSign, Trash2 } from "lucide-react";

import {
  useUserHourlyRate,
  useCreateUserHourlyRate,
  useUpdateUserHourlyRate,
  useDeleteUserHourlyRate,
} from "@/hooks/api/task/use-user-hourly-rate";
import { useModuleUsers } from "@/hooks/api/central/use-users";
import { useActiveBoards } from "@/hooks/api/task/use-board";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";

import { Actions, FormModules } from "@/lib/permissions";

import type { UserHourlyRateCreate, UserHourlyRateUpdate } from "@/types";
import {
  userHourlyRateSchema,
  type UserHourlyRateFormValues,
} from "@/validations/task/user-hourly-rate";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import CustomContainer from "@/components/layout/custom-container";
import NotFound from "@/components/error-boundaries/entity-not-found";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
import { UserHourlyRateFormSkeleton } from "./UserHourlyRateFormSkeleton";

const UserHourlyRateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = React.useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = React.useState(false);
  const HeaderIcon = useMenuIcon(FormModules.USER_HOURLY_RATE, DollarSign);
  const isEditMode = !!id && id !== "new";

  const { user } = useAuthContext();

  const { data: users, isLoading: isLoadingUsers } = useModuleUsers(
    undefined,
    undefined,
    userDropdownOpen || isEditMode
  );
  const { data: boardsResponse, isLoading: isLoadingBoards } = useActiveBoards(
    undefined,
    { enabled: boardDropdownOpen || isEditMode }
  );
  const { data: currencies, isLoading: isLoadingCurrencies } =
    useActiveCurrencyTypes(undefined, currencyDropdownOpen || isEditMode);

  const {
    data: hourlyRateData,
    isLoading: isLoadingHourlyRate,
    error: hourlyRateError,
  } = useUserHourlyRate(isEditMode && id ? id : undefined);

  const { mutate: createHourlyRate, isPending: isCreating } =
    useCreateUserHourlyRate();
  const { mutate: updateHourlyRate, isPending: isUpdating } =
    useUpdateUserHourlyRate();
  const { mutate: deleteHourlyRate, isPending: isDeleting } =
    useDeleteUserHourlyRate();

  const form = useForm<UserHourlyRateFormValues>({
    resolver: zodResolver(userHourlyRateSchema),
    defaultValues: {
      strUserGUID: "",
      strBoardGUID: "",
      decHourlyRate: 0,
      dEffectiveFrom: "",
      dEffectiveTo: "",
      strCurrencyTypeGUID: "",
    },
  });

  const isLoading = isLoadingHourlyRate;
  const isSaving = isCreating || isUpdating;

  React.useEffect(() => {
    if (hourlyRateData && isEditMode && id) {
      form.setValue("strUserGUID", hourlyRateData.strUserGUID);
      form.setValue("strBoardGUID", hourlyRateData.strBoardGUID);
      form.setValue("decHourlyRate", hourlyRateData.decHourlyRate);
      form.setValue(
        "dEffectiveFrom",
        hourlyRateData.dEffectiveFrom
          ? format(new Date(hourlyRateData.dEffectiveFrom), "yyyy-MM-dd")
          : ""
      );
      form.setValue(
        "dEffectiveTo",
        hourlyRateData.dEffectiveTo
          ? format(new Date(hourlyRateData.dEffectiveTo), "yyyy-MM-dd")
          : ""
      );
      form.setValue("strCurrencyTypeGUID", hourlyRateData.strCurrencyTypeGUID);
    }
  }, [hourlyRateData, form, isEditMode, id]);

  React.useEffect(() => {
    if (!isEditMode && currencies && currencies.length > 0) {
      const currentValue = form.getValues("strCurrencyTypeGUID");
      
      // Only set default if no currency is currently selected
      if (!currentValue) {
        // First, try to use the organization's currency from user context
        const organizationCurrency = user?.strCurrencyTypeGUID;
        
        if (organizationCurrency) {
          form.setValue("strCurrencyTypeGUID", organizationCurrency);
        } else {
          // Fallback to USD if no organization currency
          const defaultCurrency = currencies.find((currency) =>
            currency.strName.toUpperCase().includes("USD")
          );

          if (defaultCurrency) {
            form.setValue("strCurrencyTypeGUID", defaultCurrency.strCurrencyTypeGUID);
          } else {
            form.setValue("strCurrencyTypeGUID", currencies[0].strCurrencyTypeGUID);
          }
        }
      }
    }
  }, [currencies, form, isEditMode, user]);

  const handleDelete = () => {
    if (!id) return;

    deleteHourlyRate(
      { guid: id },
      {
        onSuccess: () => {
          navigate("/user-hourly-rate");
        },
        onSettled: () => {
          setShowDeleteConfirm(false);
        },
      }
    );
  };

  const onSubmit = (data: UserHourlyRateFormValues) => {
    if (isEditMode && id) {
      const updateData: UserHourlyRateUpdate = {
        strUserGUID: data.strUserGUID,
        strBoardGUID: data.strBoardGUID,
        decHourlyRate: data.decHourlyRate,
        dEffectiveFrom: data.dEffectiveFrom,
        dEffectiveTo: data.dEffectiveTo,
        strCurrencyTypeGUID: data.strCurrencyTypeGUID,
      };

      updateHourlyRate(
        { guid: id, data: updateData },
        {
          onSuccess: () => {
            navigate("/user-hourly-rate");
          },
        }
      );
    } else {
      const createData: UserHourlyRateCreate = {
        strUserGUID: data.strUserGUID,
        strBoardGUID: data.strBoardGUID,
        decHourlyRate: data.decHourlyRate,
        dEffectiveFrom: data.dEffectiveFrom,
        dEffectiveTo: data.dEffectiveTo,
        strCurrencyTypeGUID: data.strCurrencyTypeGUID,
      };

      createHourlyRate(createData, {
        onSuccess: () => {
          navigate("/user-hourly-rate");
        },
      });
    }
  };

  if (
    isEditMode &&
    !isLoadingHourlyRate &&
    (hourlyRateError || (!hourlyRateData && !isLoadingHourlyRate))
  ) {
    return <NotFound pageName="User Hourly Rate" />;
  }

  return (
    <CustomContainer>
      <PageHeader
        title={
          isEditMode ? "Edit User Hourly Rate" : "Create New User Hourly Rate"
        }
        description={
          isEditMode
            ? "Update user hourly rate details"
            : "Create a new user hourly rate"
        }
        icon={HeaderIcon}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/user-hourly-rate")}
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
          <UserHourlyRateFormSkeleton />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="strUserGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            User <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              options={
                                users?.map((user) => ({
                                  value: user.strUserGUID,
                                  label: user.strName,
                                })) || []
                              }
                              selectedValue={field.value}
                              onChange={field.onChange}
                              onOpenChange={setUserDropdownOpen}
                              placeholder="Select a user"
                              isLoading={isLoadingUsers}
                              disabled={isEditMode}
                              clearable={false}
                              queryKey={["users", "module", "true"]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strBoardGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Project <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              options={
                                boardsResponse?.map((board) => ({
                                  value: board.strBoardGUID,
                                  label: board.strName,
                                })) || []
                              }
                              selectedValue={field.value}
                              onChange={field.onChange}
                              onOpenChange={setBoardDropdownOpen}
                              placeholder="Select a proect"
                              isLoading={isLoadingBoards}
                              disabled={isEditMode}
                              clearable={false}
                              queryKey={["boards", "active"]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strCurrencyTypeGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Currency <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              options={
                                currencies?.map((currency) => ({
                                  value: currency.strCurrencyTypeGUID,
                                  label: currency.strName,
                                })) || []
                              }
                              selectedValue={field.value}
                              onChange={field.onChange}
                              onOpenChange={setCurrencyDropdownOpen}
                              placeholder="Select a currency"
                              isLoading={isLoadingCurrencies}
                              clearable={false}
                              queryKey={["currencyTypes", "active"]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="decHourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Hourly Rate <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="1"
                              min="0.01"
                              className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0.00"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                field.onChange(value > 0 ? value : 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dEffectiveFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Effective From{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              value={
                                field.value ? new Date(field.value) : undefined
                              }
                              onChange={(date) => {
                                field.onChange(
                                  date ? format(date, "yyyy-MM-dd") : ""
                                );
                              }}
                              disabled={(date) => {
                                if (
                                  !user?.dtYearStartDate ||
                                  !user?.dtYearEndDate
                                )
                                  return false;
                                const startDate = new Date(
                                  user.dtYearStartDate
                                );
                                const endDate = new Date(user.dtYearEndDate);
                                return date < startDate || date > endDate;
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dEffectiveTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Effective To <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              value={
                                field.value ? new Date(field.value) : undefined
                              }
                              onChange={(date) => {
                                field.onChange(
                                  date ? format(date, "yyyy-MM-dd") : ""
                                );
                              }}
                              disabled={(date) => {
                                if (
                                  !user?.dtYearStartDate ||
                                  !user?.dtYearEndDate
                                )
                                  return false;
                                const startDate = new Date(
                                  user.dtYearStartDate
                                );
                                const endDate = new Date(user.dtYearEndDate);
                                return date < startDate || date > endDate;
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Form>
            </CardContent>

            <CardFooter className="px-6 py-4 ">
              <div className="flex items-center justify-between w-full">
                <div>
                  {isEditMode && (
                    <WithPermission
                      module={FormModules.USER_HOURLY_RATE}
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
                    module={FormModules.USER_HOURLY_RATE}
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

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete User Hourly Rate"
        description="Are you sure you want to delete this user hourly rate? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default UserHourlyRateForm;
