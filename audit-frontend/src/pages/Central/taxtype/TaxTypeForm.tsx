import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  useTaxType,
  useCreateTaxType,
  useUpdateTaxType,
  useDeleteTaxType,
} from "@/hooks/api/central/use-tax-types";
import { useActiveCountries } from "@/hooks/api/central/use-countries";
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
  taxTypeCreateSchema,
  type TaxTypeCreateValues,
  type TaxTypeUpdateValues,
} from "@/validations/central/tax-type";
import { ArrowLeft, FileText, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { TaxTypeFormSkeleton } from "./TaxTypeFormSkeleton";
import { useMenuIcon } from "@/hooks";

const TaxTypeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  const form = useForm({
    resolver: zodResolver(taxTypeCreateSchema),
    defaultValues: {
      strTaxTypeCode: "",
      strTaxTypeName: "",
      strDescription: "",
      strCountryGUID: "",
      bolIsCompound: false,
      bolIsActive: true,
    },
  });

  const { data: taxTypeData, isLoading } = useTaxType(
    isEditMode && id && id !== "new" ? id : undefined
  );

  const { data: countries, isLoading: isLoadingCountries } =
    useActiveCountries();

  useEffect(() => {
    if (taxTypeData && isEditMode) {
      form.setValue("strTaxTypeCode", taxTypeData.strTaxTypeCode);
      form.setValue("strTaxTypeName", taxTypeData.strTaxTypeName);
      form.setValue("strDescription", taxTypeData.strDescription || "");
      form.setValue("strCountryGUID", taxTypeData.strCountryGUID);
      form.setValue("bolIsCompound", taxTypeData.bolIsCompound);
      form.setValue("bolIsActive", taxTypeData.bolIsActive);
    }
  }, [taxTypeData, form, isEditMode, id]);

  const { mutate: createTaxType, isPending: isCreating } = useCreateTaxType();
  const { mutate: updateTaxType, isPending: isUpdating } = useUpdateTaxType();
  const { mutate: deleteTaxType, isPending: isDeleting } = useDeleteTaxType();

  const handleDelete = () => {
    if (!id) return;

    deleteTaxType(
      { id },
      {
        onSuccess: () => {
          navigate("/tax-type");
        },
        onSettled: () => {
          setShowDeleteConfirm(false);
        },
      }
    );
  };

  const onSubmit = (data: TaxTypeCreateValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: TaxTypeUpdateValues = {
        strTaxTypeCode: data.strTaxTypeCode,
        strTaxTypeName: data.strTaxTypeName,
        strDescription: data.strDescription,
        strCountryGUID: data.strCountryGUID,
        bolIsCompound: data.bolIsCompound,
        bolIsActive: data.bolIsActive,
      };

      updateTaxType(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/tax-type");
          },
        }
      );
    } else {
      const createData: TaxTypeCreateValues = {
        strTaxTypeCode: data.strTaxTypeCode,
        strTaxTypeName: data.strTaxTypeName,
        strDescription: data.strDescription,
        strCountryGUID: data.strCountryGUID,
        bolIsCompound: data.bolIsCompound,
        bolIsActive: data.bolIsActive,
      };

      createTaxType(createData, {
        onSuccess: () => {
          navigate("/tax-type");
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon("tax_type_form", FileText);

  const isSaving = isCreating || isUpdating;

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Tax Type" : "New Tax Type"}
        description={
          isEditMode ? "Update tax type details" : "Create a new tax type"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/tax-type")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading || isLoadingCountries ? (
        <TaxTypeFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="taxTypeForm"
          >
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="strTaxTypeCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tax Type Code <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter tax type code"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strTaxTypeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tax Type Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter tax type name"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strCountryGUID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Country <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <PreloadedSelect
                            options={
                              countries?.map((country) => ({
                                value: country.strCountryGUID,
                                label: country.strName,
                              })) || []
                            }
                            selectedValue={field.value}
                            onChange={field.onChange}
                            placeholder="Select a country"
                            disabled={isSaving || isLoadingCountries}
                            isLoading={isLoadingCountries}
                            clearable={false}
                            queryKey={["countries", "active"]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bolIsCompound"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-start gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            Is Compound Tax
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

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this tax type? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default TaxTypeForm;
