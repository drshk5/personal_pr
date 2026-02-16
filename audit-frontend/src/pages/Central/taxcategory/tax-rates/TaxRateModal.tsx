/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActiveTaxTypes } from "@/hooks/api/central/use-tax-types";
import { useActiveTaxCategories } from "@/hooks/api/central/use-tax-categories";
import { useActiveStates } from "@/hooks/api/central/use-states";
import { useActiveSchedules } from "@/hooks/api/central/use-schedules";
import {
  useCreateTaxRate,
  useUpdateTaxRate,
  useDeleteTaxRate,
} from "@/hooks/api/central/use-tax-rates";
import {
  taxRateUpdateSchema,
  type TaxRateUpdateValues,
} from "@/validations/central/tax-rate";
import type { TaxRate } from "@/types/central/tax-rate";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Trash2, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { SingleSelect } from "@/components/ui/select/single-select";
import { DatePicker } from "@/components/ui/date-picker";
import { useDebounce } from "@/hooks/common/use-debounce";

interface TaxRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxRate?: TaxRate;
  defaultTaxTypeGUID?: string;
  defaultTaxCategoryGUID?: string;
}

export const TaxRateModal: React.FC<TaxRateModalProps> = ({
  isOpen,
  onClose,
  taxRate,
  defaultTaxTypeGUID,
  defaultTaxCategoryGUID,
}) => {
  const isEditMode = !!taxRate;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedTaxTypeGUID, setSelectedTaxTypeGUID] = React.useState<string>(
    defaultTaxTypeGUID || ""
  );
  const [scheduleSearch, setScheduleSearch] = React.useState<string>(
    taxRate?.strScheduleName || ""
  );

  const { data: taxTypesData, isLoading: isLoadingTaxTypes } =
    useActiveTaxTypes(undefined, undefined, isOpen);
  const { data: taxCategoriesData, isLoading: isLoadingTaxCategories } =
    useActiveTaxCategories(
      selectedTaxTypeGUID || taxRate?.strTaxTypeGUID || ""
    );
  const { data: states = [], isLoading: isLoadingStates } = useActiveStates(
    undefined,
    isOpen
  );
  const debouncedScheduleSearch = useDebounce(scheduleSearch, 300);
  const { data: schedulesData = [], isLoading: isLoadingSchedules } =
    useActiveSchedules(debouncedScheduleSearch);

  const taxTypes = Array.isArray(taxTypesData) ? taxTypesData : [];
  const taxCategories = Array.isArray(taxCategoriesData)
    ? taxCategoriesData
    : [];
  const schedules = Array.isArray(schedulesData) ? schedulesData : [];

  const scheduleOptions = useMemo(() => {
    const fetchedOptions = schedules.map((schedule) => ({
      value: schedule.strScheduleGUID,
      label: schedule.strScheduleName,
    }));

    const existingSelection =
      taxRate && taxRate.strScheduleGUID
        ? {
            value: taxRate.strScheduleGUID,
            label: taxRate.strScheduleName || "Current schedule",
          }
        : undefined;

    if (
      existingSelection &&
      !fetchedOptions.some((opt) => opt.value === existingSelection.value)
    ) {
      return [existingSelection, ...fetchedOptions];
    }

    return fetchedOptions;
  }, [schedules, taxRate]);

  const { mutate: createTaxRate, isPending: isCreating } = useCreateTaxRate();
  const { mutate: updateTaxRate, isPending: isUpdating } = useUpdateTaxRate();
  const { mutate: deleteTaxRate, isPending: isDeleting } = useDeleteTaxRate();

  const isSaving = isCreating || isUpdating;
  const isSubmitting = isSaving || isDeleting;

  const form = useForm<TaxRateUpdateValues>({
    resolver: zodResolver(taxRateUpdateSchema),
    defaultValues: {
      strTaxTypeGUID:
        taxRate?.strTaxTypeGUID ||
        (defaultTaxTypeGUID ? defaultTaxTypeGUID.toUpperCase() : ""),
      strTaxCategoryGUID:
        taxRate?.strTaxCategoryGUID ||
        (defaultTaxCategoryGUID ? defaultTaxCategoryGUID.toUpperCase() : ""),
      strScheduleGUID: taxRate?.strScheduleGUID || "",
      strTaxRateName: taxRate?.strTaxRateName || "",
      decTaxPercentage: taxRate?.decTaxPercentage || 0,
      strTaxRateCode: taxRate?.strTaxRateCode || "",
      strStateGUID: taxRate?.strStateGUID || undefined,
      intDisplayOrder: taxRate?.intDisplayOrder || 0,
      dtEffectiveFrom: taxRate?.dtEffectiveFrom || undefined,
      dtEffectiveTo: taxRate?.dtEffectiveTo || undefined,
      bolIsActive: taxRate?.bolIsActive ?? true,
    },
  });

  useEffect(() => {
    if (taxRate && isEditMode && !isLoadingTaxTypes && taxTypes) {
      setSelectedTaxTypeGUID(taxRate.strTaxTypeGUID.toUpperCase());
      form.reset({
        strTaxTypeGUID: taxRate.strTaxTypeGUID.toUpperCase(),
        strTaxCategoryGUID: taxRate.strTaxCategoryGUID
          ? taxRate.strTaxCategoryGUID.toUpperCase()
          : "",
        strScheduleGUID: taxRate.strScheduleGUID ? taxRate.strScheduleGUID : "",
        strTaxRateName: taxRate.strTaxRateName,
        decTaxPercentage: taxRate.decTaxPercentage,
        strTaxRateCode: taxRate.strTaxRateCode,
        strStateGUID: taxRate.strStateGUID
          ? taxRate.strStateGUID.toUpperCase()
          : undefined,
        intDisplayOrder: taxRate.intDisplayOrder,
        dtEffectiveFrom: taxRate.dtEffectiveFrom || undefined,
        dtEffectiveTo: taxRate.dtEffectiveTo || undefined,
        bolIsActive: taxRate.bolIsActive,
      });
      setScheduleSearch(taxRate.strScheduleName || "");
    } else if (!isEditMode) {
      if (defaultTaxTypeGUID) {
        setSelectedTaxTypeGUID(defaultTaxTypeGUID.toUpperCase());
        form.setValue("strTaxTypeGUID", defaultTaxTypeGUID.toUpperCase());
      }
      if (defaultTaxCategoryGUID) {
        form.setValue(
          "strTaxCategoryGUID",
          defaultTaxCategoryGUID.toUpperCase()
        );
      }
      setScheduleSearch("");
    }
  }, [
    taxRate,
    form,
    isEditMode,
    defaultTaxTypeGUID,
    defaultTaxCategoryGUID,
    isLoadingTaxTypes,
    taxTypes,
  ]);

  const handleSubmit = (data: TaxRateUpdateValues) => {
    if (isEditMode && taxRate) {
      updateTaxRate(
        {
          id: taxRate.strTaxRateGUID,
          data: {
            ...data,
            intDisplayOrder: data.intDisplayOrder || 0,
            bolIsActive: data.bolIsActive ?? true,
          },
        },
        {
          onSuccess: () => {
            onClose();
            form.reset();
          },
        }
      );
    } else {
      createTaxRate(data, {
        onSuccess: () => {
          onClose();
          form.reset();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!taxRate) return;

    deleteTaxRate(
      { id: taxRate.strTaxRateGUID },
      {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          onClose();
          form.reset();
        },
        onError: () => {
          setIsDeleteDialogOpen(false);
        },
      }
    );
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  const footerContent = (
    <div className="flex w-full flex-col sm:flex-row justify-between gap-2">
      {isEditMode && (
        <Button
          variant="destructive"
          type="button"
          disabled={isSubmitting}
          onClick={() => setIsDeleteDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
      )}
      <div className="flex flex-col-reverse sm:flex-row ml-auto gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="tax-rate-form"
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <ModalDialog
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        title={isEditMode ? "Edit Tax Rate" : "Add Tax Rate"}
        description={
          isEditMode
            ? "Update the tax rate details below."
            : "Add a new tax rate to the category."
        }
        footerContent={footerContent}
        maxWidth="900px"
        fullHeight={false}
        className="overflow-visible"
      >
        <Form {...form}>
          <form
            id="tax-rate-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col h-full w-full overflow-visible"
          >
            <div
              className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 140px)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 overflow-visible">
                <FormField
                  control={form.control}
                  name="strTaxTypeGUID"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5 overflow-visible">
                      <FormLabel className="text-sm">
                        Tax Type <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <PreloadedSelect
                          options={
                            taxTypes?.map((taxType) => ({
                              value: taxType.strTaxTypeGUID,
                              label: taxType.strTaxTypeName,
                            })) || []
                          }
                          selectedValue={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            setSelectedTaxTypeGUID(value || "");
                            form.setValue("strTaxCategoryGUID", "");
                          }}
                          placeholder="Select a tax type"
                          disabled={
                            isSaving ||
                            isLoadingTaxTypes ||
                            !!defaultTaxTypeGUID
                          }
                          isLoading={isLoadingTaxTypes}
                          clearable={false}
                          queryKey={["taxTypes", "active"]}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strTaxCategoryGUID"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5 overflow-visible">
                      <FormLabel className="text-sm">
                        Tax Category <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <PreloadedSelect
                          options={
                            taxCategories?.map((category) => ({
                              value: category.strTaxCategoryGUID,
                              label: category.strCategoryName,
                            })) || []
                          }
                          selectedValue={field.value}
                          onChange={field.onChange}
                          placeholder="Select a tax category"
                          disabled={
                            isSaving ||
                            isLoadingTaxCategories ||
                            !selectedTaxTypeGUID ||
                            !!defaultTaxCategoryGUID
                          }
                          isLoading={isLoadingTaxCategories}
                          clearable={false}
                          queryKey={[
                            "taxCategories",
                            "active",
                            selectedTaxTypeGUID,
                          ]}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strScheduleGUID"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5 overflow-visible">
                      <FormLabel className="text-sm">
                        Schedule <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <SingleSelect
                          options={scheduleOptions}
                          selectedValue={field.value}
                          onChange={field.onChange}
                          onInputChange={(value) => setScheduleSearch(value)}
                          placeholder="Search schedules..."
                          disabled={isSaving}
                          isLoading={isLoadingSchedules}
                          searchMinLength={0}
                          initialMessage="Type to search or scroll"
                          clearable={false}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strTaxRateName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm">
                        Tax Rate Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter tax rate name"
                          disabled={isSaving}
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strTaxRateCode"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm">
                        Tax Rate Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter tax rate code"
                          disabled={isSaving}
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="decTaxPercentage"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm">
                        Tax Percentage (%)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          className="h-9 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                          placeholder="Enter tax percentage"
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strStateGUID"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5 overflow-visible">
                      <FormLabel className="text-sm">
                        State (Optional)
                      </FormLabel>
                      <FormControl>
                        <PreloadedSelect
                          options={
                            states?.map((state) => ({
                              value: state.strStateGUID,
                              label: state.strName,
                            })) || []
                          }
                          selectedValue={field.value}
                          onChange={field.onChange}
                          placeholder="Select a state (optional)"
                          disabled={isSaving || isLoadingStates}
                          isLoading={isLoadingStates}
                          clearable={true}
                          queryKey={["states", "active"]}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="intDisplayOrder"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm">Display Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value);
                            field.onChange(value);
                          }}
                          placeholder="Enter display order"
                          disabled={isSaving}
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dtEffectiveFrom"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm">Effective From</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date?: Date) => {
                            field.onChange(
                              date ? date.toISOString() : undefined
                            );
                          }}
                          placeholder="Select start date"
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dtEffectiveTo"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm">Effective To</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date?: Date) => {
                            field.onChange(
                              date ? date.toISOString() : undefined
                            );
                          }}
                          placeholder="Select end date"
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bolIsActive"
                  render={({ field }) => (
                    <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border border-border-color p-3 shadow-sm space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Active
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSaving}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
      </ModalDialog>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this tax rate? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
};
