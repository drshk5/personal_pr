import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  currencyTypeSchema,
  type CurrencyTypeFormValues,
} from "@/validations/central/currency-type";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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

import { ArrowLeft, DollarSign, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

import {
  useCurrencyType,
  useCreateCurrencyType,
  useUpdateCurrencyType,
  useDeleteCurrencyType,
} from "@/hooks/api/central/use-currency-types";
import { useActiveCountries } from "@/hooks/api/central/use-countries";
import type {
  CurrencyTypeCreate,
  CurrencyTypeUpdate,
} from "@/types/central/currency-type";
import { CurrencyTypeFormSkeleton } from "./CurrencyTypeFormSkeleton";
import { useMenuIcon } from "@/hooks";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";

const CurrencyTypeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  const form = useForm({
    resolver: zodResolver(currencyTypeSchema),
    defaultValues: {
      strName: "",
      strCountryGUID: undefined,
      bolIsActive: true,
    },
  });

  const {
    data: countries,
    isLoading: isLoadingCountries,
  } = useActiveCountries("");

  const { data: currencyTypeData, isLoading: isLoadingCurrencyType } =
    useCurrencyType(isEditMode && id && id !== "new" ? id : undefined);

  const { mutate: createCurrencyType, isPending: isCreating } =
    useCreateCurrencyType();

  const { mutate: updateCurrencyType, isPending: isUpdating } =
    useUpdateCurrencyType();

  const { mutate: deleteCurrencyType, isPending: isDeleting } =
    useDeleteCurrencyType();

  useEffect(() => {
    if (currencyTypeData && isEditMode && id && id !== "new") {
      form.setValue("strName", currencyTypeData.strName);
      form.setValue("strCountryGUID", currencyTypeData.strCountryGUID || undefined);
      form.setValue("bolIsActive", currencyTypeData.bolIsActive);
    }
  }, [currencyTypeData, form, isEditMode, id]);

  const handleDelete = () => {
    if (!id) return;

    deleteCurrencyType(id, {
      onSuccess: () => {
        navigate("/currency-type");
        setShowDeleteConfirm(false);
      },
    });
  };

  const onSubmit = (data: CurrencyTypeFormValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: CurrencyTypeUpdate = {
        strName: data.strName,
        strCountryGUID: data.strCountryGUID || undefined,
        bolIsActive: data.bolIsActive,
      };

      updateCurrencyType(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/currency-type");
          },
        }
      );
    } else {
      const createData: CurrencyTypeCreate = {
        strName: data.strName,
        strCountryGUID: data.strCountryGUID || undefined,
        bolIsActive: data.bolIsActive,
      };

      createCurrencyType(createData, {
        onSuccess: () => {
          navigate("/currency-type");
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon("currency_type_form", DollarSign);

  const isLoading = isLoadingCurrencyType;

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Currency Type" : "New Currency Type"}
        description={
          isEditMode
            ? "Update currency type details"
            : "Create a new currency type"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/currency-type")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <CurrencyTypeFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="currencyTypeForm"
          >
            <Card className="mt-6 border border-border-color">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="strName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter currency type name"
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
                        <FormLabel>Country</FormLabel>
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
                            disabled={isUpdating || isCreating || isLoadingCountries}
                            isLoading={isLoadingCountries}
                            clearable={true}
                            allowNone={true}
                            noneLabel="None"
                            queryKey={["countries", "active"]}
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
              </CardContent>
              <CardFooter className="flex justify-between pt-2 pb-6">
                <div>
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting || isUpdating || isCreating}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
                <div>
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isUpdating || isCreating || isLoading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isUpdating || isCreating
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

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this currency type? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </CustomContainer>
  );
};

export default CurrencyTypeForm;
