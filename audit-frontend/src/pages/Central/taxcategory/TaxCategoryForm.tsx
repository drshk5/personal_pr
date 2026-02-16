import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  useTaxCategory,
  useCreateTaxCategory,
  useUpdateTaxCategory,
  useDeleteTaxCategory,
} from "@/hooks/api/central/use-tax-categories";
import { useActiveTaxTypes } from "@/hooks/api/central/use-tax-types";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  taxCategoryCreateSchema,
  type TaxCategoryCreateValues,
  type TaxCategoryUpdateValues,
} from "@/validations/central/tax-category";
import { ArrowLeft, FileText, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { TaxCategoryFormSkeleton } from "./TaxCategoryFormSkeleton";
import { TaxRateModal } from "./tax-rates/TaxRateModal";
import { TaxRatesSkeleton } from "./tax-rates/TaxRatesSkeleton";
import type { TaxRate } from "@/types/central/tax-rate";
import { useMenuIcon } from "@/hooks";
import TaxRatesList from "./tax-rates/TaxRatesList";

const TaxCategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showTaxRateModal, setShowTaxRateModal] = useState<boolean>(false);
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | undefined>(
    undefined
  );
  const [isTaxCategorySaved, setIsTaxCategorySaved] = useState(false);

  const isEditMode = !!id && id !== "new";

  const form = useForm({
    resolver: zodResolver(taxCategoryCreateSchema),
    defaultValues: {
      strTaxTypeGUID: "",
      strCategoryCode: "",
      strCategoryName: "",
      strDescription: "",
      decTotalTaxPercentage: 0,
      bolIsActive: true,
    },
  });

  const { data: taxCategoryData, isLoading } = useTaxCategory(
    isEditMode && id && id !== "new" ? id : undefined
  );

  const { data: taxTypes, isLoading: isLoadingTaxTypes } = useActiveTaxTypes();

  useEffect(() => {
    if (taxCategoryData && isEditMode && !isLoadingTaxTypes && taxTypes) {
      form.setValue(
        "strTaxTypeGUID",
        taxCategoryData.strTaxTypeGUID.toUpperCase()
      );
      form.setValue("strCategoryCode", taxCategoryData.strCategoryCode);
      form.setValue("strCategoryName", taxCategoryData.strCategoryName);
      form.setValue("strDescription", taxCategoryData.strDescription || "");
      form.setValue(
        "decTotalTaxPercentage",
        taxCategoryData.decTotalTaxPercentage
      );
      form.setValue("bolIsActive", taxCategoryData.bolIsActive);
      setIsTaxCategorySaved(true);
    }
  }, [taxCategoryData, form, isEditMode, id, isLoadingTaxTypes, taxTypes]);

  useEffect(() => {
    if (isEditMode && id && id !== "new") {
      setIsTaxCategorySaved(true);
    }
  }, [isEditMode, id]);

  const { mutate: createTaxCategory, isPending: isCreating } =
    useCreateTaxCategory();
  const { mutate: updateTaxCategory, isPending: isUpdating } =
    useUpdateTaxCategory();
  const { mutate: deleteTaxCategory, isPending: isDeleting } =
    useDeleteTaxCategory();

  const handleDelete = () => {
    if (!id) return;

    deleteTaxCategory(
      { id },
      {
        onSuccess: () => {
          navigate("/tax-category");
        },
        onSettled: () => {
          setShowDeleteConfirm(false);
        },
      }
    );
  };

  const onSubmit = (data: TaxCategoryCreateValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: TaxCategoryUpdateValues = {
        strTaxTypeGUID: data.strTaxTypeGUID,
        strCategoryCode: data.strCategoryCode,
        strCategoryName: data.strCategoryName,
        strDescription: data.strDescription,
        decTotalTaxPercentage: data.decTotalTaxPercentage,
        bolIsActive: data.bolIsActive,
      };

      updateTaxCategory(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/tax-category");
          },
        }
      );
    } else {
      const createData: TaxCategoryCreateValues = {
        strTaxTypeGUID: data.strTaxTypeGUID,
        strCategoryCode: data.strCategoryCode,
        strCategoryName: data.strCategoryName,
        strDescription: data.strDescription,
        decTotalTaxPercentage: data.decTotalTaxPercentage,
        bolIsActive: data.bolIsActive,
      };

      createTaxCategory(createData, {
        onSuccess: (data) => {
          setIsTaxCategorySaved(true);
          // Navigate to edit mode with the new ID
          navigate(`/tax-category/${data.strTaxCategoryGUID}`);
        },
      });
    }
  };

  const handleEditTaxRate = (taxRate: TaxRate) => {
    setSelectedTaxRate(taxRate);
    setShowTaxRateModal(true);
  };

  const handleAddTaxRate = () => {
    setSelectedTaxRate(undefined);
    setShowTaxRateModal(true);
  };

  const handleCloseTaxRateModal = () => {
    setShowTaxRateModal(false);
    setSelectedTaxRate(undefined);
  };

  const HeaderIcon = useMenuIcon("tax_category_form", FileText);

  const isSaving = isCreating || isUpdating;

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Tax Category" : "New Tax Category"}
        description={
          isEditMode
            ? "Update tax category details"
            : "Create a new tax category"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/tax-category")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading || isLoadingTaxTypes ? (
        <TaxCategoryFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="taxCategoryForm"
          >
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="strTaxTypeGUID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tax Type <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <PreloadedSelect
                            options={
                              Array.isArray(taxTypes)
                                ? taxTypes.map((taxType) => ({
                                    value: taxType.strTaxTypeGUID,
                                    label: taxType.strTaxTypeName,
                                  }))
                                : []
                            }
                            selectedValue={field.value}
                            onChange={field.onChange}
                            placeholder="Select a tax type"
                            disabled={isSaving || isLoadingTaxTypes}
                            isLoading={isLoadingTaxTypes}
                            clearable={false}
                            queryKey={["taxTypes", "active"]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="strCategoryName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Category Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter category name"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strCategoryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Category Code <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter category code"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <FormField
                    control={form.control}
                    name="decTotalTaxPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Total Tax Percentage{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            {...field}
                            value={field.value === 0 ? "" : field.value}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strDescription"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter description"
                            disabled={isSaving}
                            rows={3}
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
                            disabled={isSaving}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 pb-6">
                <div>
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting || isSaving}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
                <div>
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSaving || isLoading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isCreating || isUpdating
                      ? isEditMode
                        ? "Updating..."
                        : "Creating..."
                      : isEditMode
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form>
      )}

      <div className="mt-12">
        {isLoading ? (
          <>
            <TaxRatesSkeleton />
          </>
        ) : (
          <TaxRatesList
            onEdit={handleEditTaxRate}
            onAdd={handleAddTaxRate}
            disabled={!isEditMode && !isTaxCategorySaved}
            strTaxCategoryGUID={isEditMode && id && id !== "new" ? id : isTaxCategorySaved && id ? id : undefined}
          />
        )}
      </div>

      <TaxRateModal
        isOpen={showTaxRateModal}
        onClose={handleCloseTaxRateModal}
        taxRate={selectedTaxRate}
        defaultTaxTypeGUID={taxCategoryData?.strTaxTypeGUID}
        defaultTaxCategoryGUID={id && id !== "new" ? id : undefined}
      />

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this tax category? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default TaxCategoryForm;
