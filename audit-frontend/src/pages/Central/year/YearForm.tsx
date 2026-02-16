import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CalendarDays,
  Trash2,
  Save,
  HelpCircle,
} from "lucide-react";

import {
  useYear,
  useUpdateYear,
  useCreateYear,
  useDeleteYear,
  useActiveYearsByOrganization,
} from "@/hooks/api/central/use-years";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useMenuIcon } from "@/hooks";

import { ModuleBase, Actions } from "@/lib/permissions";
import { generateYearName } from "@/lib/utils";
import { yearSchema, type YearFormValues } from "@/validations";

import type { DocNo } from "@/types/Account/doc-no";
import type { YearCreate, YearUpdate } from "@/types/central/year";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { WithPermission } from "@/components/ui/with-permission";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DocNoList } from "@/pages/Central/year/doc-no/DocNoList";
import { DocNoModal } from "@/pages/Central/year/doc-no/DocNoModal";
import { YearFormSkeleton } from "./YearFormSkeleton";

const computeEndDateFromStart = (startDate: Date) => {
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  endDate.setDate(endDate.getDate() - 1);
  return endDate;
};

const YearForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);
  const [showDocNoModal, setShowDocNoModal] = useState<boolean>(false);
  const [selectedDocNo, setSelectedDocNo] = useState<DocNo | undefined>(
    undefined
  );
  const [hasUserAdjustedStartDate, setHasUserAdjustedStartDate] =
    useState(false);
  const [hasUserAdjustedDates, setHasUserAdjustedDates] = useState(false);

  const { data: year, isLoading: isLoadingYear } = useYear(
    id !== "new" ? id : undefined
  );
  const { mutate: createYearMutation, isPending: isCreating } = useCreateYear();
  const { mutate: updateYearMutation, isPending: isUpdating } = useUpdateYear();
  const { mutate: deleteYearMutation, isPending: isDeleting } = useDeleteYear();

  const { user } = useAuthContext();

  const isEditMode = !!id && id !== "new";
  const isTaskModule = user?.strLastModuleName === "Task";

  const organizationId = isEditMode
    ? year?.strOrganizationGUID
    : user?.strLastOrganizationGUID || undefined;

  const [dropdownOpen, setDropdownOpen] = useState({
    previousYear: false,
    nextYear: false,
  });

  const shouldPrefetch = isEditMode;
  const yearsEnabled =
    dropdownOpen.previousYear || dropdownOpen.nextYear || shouldPrefetch;

  const { data: activeYears = [], isLoading: isLoadingActiveYears } =
    useActiveYearsByOrganization(organizationId, isEditMode ? id : undefined, {
      enabled: yearsEnabled,
    });

  const form = useForm({
    resolver: zodResolver(yearSchema),
    defaultValues: {
      strName: "",
      dtStartDate: new Date(),
      dtEndDate: computeEndDateFromStart(new Date()),
      bolIsActive: true,
      strPreviousYearGUID: null,
      strNextYearGUID: null,
    },
  } as const);

  useEffect(() => {
    if (isEditMode && id && id !== "new" && !isLoadingYear && year) {
      form.setValue("strName", year.strName);
      form.setValue("dtStartDate", new Date(year.dtStartDate));
      form.setValue("dtEndDate", new Date(year.dtEndDate));
      form.setValue("bolIsActive", year.bolIsActive);
      form.setValue("strPreviousYearGUID", year.strPreviousYearGUID || null);
      form.setValue("strNextYearGUID", year.strNextYearGUID || null);
      setHasUserAdjustedStartDate(false);
      setHasUserAdjustedDates(false);
    }
  }, [form, id, isEditMode, isLoadingYear, year]);

  const startDate = form.watch("dtStartDate");
  const endDate = form.watch("dtEndDate");

  // Auto-set end date to 1 year after start date when start date changes
  useEffect(() => {
    if (startDate && (!isEditMode || hasUserAdjustedStartDate)) {
      form.setValue("dtEndDate", computeEndDateFromStart(startDate));
    }
  }, [startDate, isEditMode, hasUserAdjustedStartDate, form]);

  // Auto-generate year name based on start and end dates
  useEffect(() => {
    if (startDate && endDate && (!isEditMode || hasUserAdjustedDates)) {
      const yearName = generateYearName(startDate, endDate);
      if (yearName) {
        form.setValue("strName", yearName);
      }
    }
  }, [startDate, endDate, form, isEditMode, hasUserAdjustedDates]);

  const onSubmit = (data: YearFormValues) => {
    if (isEditMode && id && id !== "new") {
      const updateDto: YearUpdate = {
        strName: data.strName,
        dtStartDate: data.dtStartDate,
        dtEndDate: data.dtEndDate,
        bolIsActive: data.bolIsActive,
        strPreviousYearGUID: data.strPreviousYearGUID || undefined,
        strNextYearGUID: data.strNextYearGUID || undefined,
      };

      updateYearMutation(
        { id, year: updateDto },
        {
          onSuccess: () => {
            navigate("/year");
          },
        }
      );
    } else {
      const createDto: YearCreate = {
        strName: data.strName,
        dtStartDate: data.dtStartDate,
        dtEndDate: data.dtEndDate,
        bolIsActive: data.bolIsActive,
        strPreviousYearGUID: data.strPreviousYearGUID || undefined,
        strNextYearGUID: data.strNextYearGUID || undefined,
      };

      createYearMutation(createDto, {
        onSuccess: () => {
          navigate("/year");
        },
      });
    }
  };

  const handleDelete = () => {
    if (!id) return;

    deleteYearMutation(id, {
      onSuccess: () => {
        navigate("/year");
      },
      onSettled: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const HeaderIcon = useMenuIcon(ModuleBase.YEAR, CalendarDays);

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Year" : "New Year"}
        description="Define the fiscal year properties"
        icon={HeaderIcon}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/year")}
            className="h-9 text-xs sm:text-sm"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Back
          </Button>
        }
      />

      {isLoadingYear || isLoadingActiveYears ? (
        <YearFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="yearForm"
          >
            <Card className="mt-6 border border-border-color">
              <CardContent className="p-6 pt-6">
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <FormField
                      control={form.control}
                      name="dtStartDate"
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>
                            Start Date <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value as Date}
                              onChange={(date) => {
                                setHasUserAdjustedStartDate(true);
                                setHasUserAdjustedDates(true);
                                field.onChange(date);
                              }}
                              disabled={isCreating || isUpdating}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dtEndDate"
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>
                            End Date <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value as Date}
                              onChange={(date) => {
                                setHasUserAdjustedDates(true);
                                field.onChange(date);
                              }}
                              disabled={isCreating || isUpdating}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strName"
                      render={({ field }) => (
                        <FormItem className="md:col-span-6">
                          <div className="flex items-center gap-2">
                            <FormLabel>
                              Year Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                This field is automatically generated based on
                                your selected dates.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <FormControl>
                            <Input
                              placeholder="Auto-generated from dates"
                              {...field}
                              disabled={true}
                              className="bg-muted"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="strPreviousYearGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Year</FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              selectedValue={field.value || ""}
                              onChange={(value: string) =>
                                field.onChange(value || null)
                              }
                              disabled={
                                isLoadingActiveYears || isCreating || isUpdating
                              }
                              placeholder="Select previous year (optional)"
                              options={
                                activeYears?.map((y) => ({
                                  value: y.strYearGUID,
                                  label: y.strName,
                                })) || []
                              }
                              isLoading={isLoadingActiveYears}
                              initialMessage="Type to filter years"
                              queryKey={[
                                "yearsByOrganization",
                                "active",
                                organizationId || "",
                                isEditMode ? id || "" : "",
                              ]}
                              onOpenChange={(isOpen: boolean) =>
                                setDropdownOpen((p) => ({
                                  ...p,
                                  previousYear: isOpen,
                                }))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strNextYearGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Year</FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              selectedValue={field.value || ""}
                              onChange={(value: string) =>
                                field.onChange(value || null)
                              }
                              disabled={
                                isLoadingActiveYears || isCreating || isUpdating
                              }
                              placeholder="Select next year (optional)"
                              options={
                                activeYears?.map((y) => ({
                                  value: y.strYearGUID,
                                  label: y.strName,
                                })) || []
                              }
                              isLoading={isLoadingActiveYears}
                              initialMessage="Type to filter years"
                              queryKey={[
                                "yearsByOrganization",
                                "active",
                                organizationId || "",
                                isEditMode ? id || "" : "",
                              ]}
                              onOpenChange={(isOpen: boolean) =>
                                setDropdownOpen((p) => ({
                                  ...p,
                                  nextYear: isOpen,
                                }))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                            disabled={isCreating || isUpdating}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 bg-muted/20 flex justify-between">
                <div>
                  {isEditMode && (
                    <WithPermission
                      module={ModuleBase.YEAR}
                      action={Actions.DELETE}
                    >
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={
                          isCreating ||
                          isUpdating ||
                          isDeleting ||
                          year?.bolSystemCreated
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </WithPermission>
                  )}
                </div>
                <div>
                  <WithPermission
                    module={ModuleBase.YEAR}
                    action={isEditMode ? Actions.EDIT : Actions.SAVE}
                  >
                    <Button type="submit" disabled={isCreating || isUpdating}>
                      {isEditMode ? (
                        <Save className="mr-2 h-4 w-4" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {isCreating || isUpdating
                        ? isEditMode
                          ? "Updating..."
                          : "Creating..."
                        : isEditMode
                          ? "Update"
                          : "Create"}
                    </Button>
                  </WithPermission>
                </div>
              </CardFooter>
            </Card>

            {isEditMode && !isTaskModule && (
              <DocNoList
                yearId={id || ""}
                onAdd={() => {
                  setTimeout(() => {
                    setShowDocNoModal(true);
                  }, 0);
                }}
                onEdit={(docNo: DocNo) => {
                  setTimeout(() => {
                    setSelectedDocNo(docNo);
                    setShowDocNoModal(true);
                  }, 0);
                }}
              />
            )}
          </form>
        </Form>
      )}

      {id && id !== "new" && !isTaskModule && showDocNoModal && (
        <DocNoModal
          isOpen={true}
          onClose={() => {
            setShowDocNoModal(false);
            setSelectedDocNo(undefined);
          }}
          yearId={id}
          docNo={selectedDocNo}
        />
      )}

      <DeleteConfirmationDialog
        title="Delete Year"
        description="Are you sure you want to delete this year? This action cannot be undone."
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default YearForm;
