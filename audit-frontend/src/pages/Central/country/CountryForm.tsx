import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  useCountry,
  useCreateCountry,
  useUpdateCountry,
  useDeleteCountry,
} from "@/hooks/api/central/use-countries";
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
import { Switch } from "@/components/ui/switch";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  countryCreateSchema,
  type CountryCreateValues,
  type CountryUpdateValues,
} from "@/validations/central/country";
import { ArrowLeft, Globe, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { CountryFormSkeleton } from "./CountryFormSkeleton";
import { useMenuIcon } from "@/hooks";

const CountryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  const form = useForm({
    resolver: zodResolver(countryCreateSchema),
    defaultValues: {
      strName: "",
      strCountryCode: "",
      strDialCode: "",
      intPhoneMinLength: undefined as unknown as number | undefined,
      intPhoneMaxLength: undefined as unknown as number | undefined,
      bolIsActive: true,
    },
  });

  const { data: countryData, isLoading } = useCountry(
    isEditMode && id && id !== "new" ? id : undefined
  );

  useEffect(() => {
    if (countryData && isEditMode) {
      form.setValue("strName", countryData.strName);
      form.setValue("strCountryCode", countryData.strCountryCode ?? "");
      form.setValue("strDialCode", countryData.strDialCode ?? "");
      form.setValue(
        "intPhoneMinLength",
        (countryData.intPhoneMinLength ?? undefined) as unknown as
          | number
          | undefined
      );
      form.setValue(
        "intPhoneMaxLength",
        (countryData.intPhoneMaxLength ?? undefined) as unknown as
          | number
          | undefined
      );
      form.setValue("bolIsActive", countryData.bolIsActive);
    }
  }, [countryData, form, isEditMode, id]);

  const { mutate: createCountry, isPending: isCreating } = useCreateCountry();
  const { mutate: updateCountry, isPending: isUpdating } = useUpdateCountry();
  const { mutate: deleteCountry, isPending: isDeleting } = useDeleteCountry();

  const handleDelete = () => {
    if (!id) return;

    deleteCountry(id, {
      onSuccess: () => {
        navigate("/country");
      },
      onSettled: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const onSubmit = (data: CountryCreateValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: CountryUpdateValues = {
        strName: data.strName,
        strCountryCode: data.strCountryCode || undefined,
        strDialCode: data.strDialCode || undefined,
        intPhoneMinLength:
          typeof data.intPhoneMinLength === "number"
            ? data.intPhoneMinLength
            : undefined,
        intPhoneMaxLength:
          typeof data.intPhoneMaxLength === "number"
            ? data.intPhoneMaxLength
            : undefined,
        bolIsActive: data.bolIsActive,
      };

      updateCountry(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/country");
          },
        }
      );
    } else {
      const createData: CountryCreateValues = {
        strName: data.strName,
        strCountryCode: data.strCountryCode || undefined,
        strDialCode: data.strDialCode || undefined,
        intPhoneMinLength:
          typeof data.intPhoneMinLength === "number"
            ? data.intPhoneMinLength
            : undefined,
        intPhoneMaxLength:
          typeof data.intPhoneMaxLength === "number"
            ? data.intPhoneMaxLength
            : undefined,
        bolIsActive: data.bolIsActive,
      };

      createCountry(createData, {
        onSuccess: () => {
          navigate("/country");
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon("country_form", Globe);

  const isSaving = isCreating || isUpdating;

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Country" : "New Country"}
        description={
          isEditMode ? "Update country details" : "Create a new country"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/country")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <CountryFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="countryForm"
          >
            <Card className="mt-6">
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
                            placeholder="Enter country name"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strCountryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., IN, US"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strDialCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dial Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., +91, +1"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intPhoneMinLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Min Length</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === "" ? undefined : Number(val)
                              );
                            }}
                            min={0}
                            placeholder="e.g., 8"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intPhoneMaxLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Max Length</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === "" ? undefined : Number(val)
                              );
                            }}
                            min={0}
                            placeholder="e.g., 12"
                            disabled={isSaving}
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
                    Save
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
        description="Are you sure you want to delete this country? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default CountryForm;
