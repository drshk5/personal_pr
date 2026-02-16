import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  useCity,
  useCreateCity,
  useUpdateCity,
  useDeleteCity,
} from "@/hooks/api/central/use-cities";
import { useActiveCountries } from "@/hooks/api/central/use-countries";
import { useStatesByCountry } from "@/hooks/api/central/use-states";
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
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { cityCreateSchema } from "@/validations/central/city";
import type { CityCreateValues, CityUpdateValues } from "@/validations/central/city";
import { ArrowLeft, MapPin, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { CityFormSkeleton } from "./CityFormSkeleton";
import { useMenuIcon } from "@/hooks";

const CityForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  const { data: countries, isLoading: isLoadingCountries } =
    useActiveCountries();

  const { data: cityData, isLoading: isLoadingCity } = useCity(
    isEditMode && id && id !== "new" ? id : undefined
  );

  const { mutate: createCity, isPending: isCreating } = useCreateCity();

  const { mutate: updateCity, isPending: isUpdating } = useUpdateCity();

  const { mutate: deleteCity, isPending: isDeleting } = useDeleteCity();

  const form = useForm({
    resolver: zodResolver(cityCreateSchema),
    defaultValues: {
      strName: cityData?.strName || "",
      strCountryGUID: cityData?.strCountryGUID || "",
      strStateGUID: cityData?.strStateGUID || "",
      bolIsActive: cityData?.bolIsActive ?? true,
    },
  });

  const formCountryId = form.watch("strCountryGUID");
  const cityCountryId = cityData?.strCountryGUID;

  const effectiveCountryId =
    isEditMode && cityCountryId ? cityCountryId : formCountryId;

  const { data: states, isLoading: isLoadingStates } =
    useStatesByCountry(effectiveCountryId);

  useEffect(() => {
    if (isEditMode && cityData && states && states.length > 0) {
      const stateExists = states.some(
        (state) => state.strStateGUID === cityData.strStateGUID
      );

      if (stateExists) {
        form.setValue("strStateGUID", cityData.strStateGUID);
      }
    }
  }, [states, cityData, isEditMode, form]);

  useEffect(() => {
    if (cityData && isEditMode && id && id !== "new") {
      form.reset({
        strName: "",
        strStateGUID: "",
        bolIsActive: true,
      });

      setTimeout(() => {
        form.reset({
          strName: cityData.strName,
          strCountryGUID: cityData.strCountryGUID,
          strStateGUID: cityData.strStateGUID,
          bolIsActive: cityData.bolIsActive,
        });
      }, 100);
    }
  }, [cityData, form, isEditMode, id]);

  const handleDelete = () => {
    if (!id) return;

    deleteCity(id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        navigate("/city");
      },
      onError: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const isSaving = isCreating || isUpdating;

  const onSubmit = (data: CityCreateValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: CityUpdateValues = {
        strName: data.strName,
        strCountryGUID: data.strCountryGUID,
        strStateGUID: data.strStateGUID,
        bolIsActive: data.bolIsActive,
        strCityGUID: id,
      };

      updateCity(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/city");
          },
          onError: () => {
            // Error handling managed by global error handler
          },
        }
      );
    } else {
      createCity(data, {
        onSuccess: () => {
          navigate("/city");
        },
        onError: () => {
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon("city_form", MapPin);

  const isLoading = isLoadingCity || isLoadingCountries || isLoadingStates;

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit City" : "New City"}
        description={isEditMode ? "Update city details" : "Create a new city"}
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/city")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <CityFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="cityForm"
          >
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="strCountryGUID"
                    render={({ field }) => {

                      return (
                        <FormItem>
                          <FormLabel>
                            Country <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              selectedValue={field.value}
                              onChange={(value: string) => {
                                field.onChange(value);
                                form.setValue("strStateGUID", "");
                              }}
                              options={
                                countries?.map((country) => ({
                                  label: country.strName,
                                  value: country.strCountryGUID,
                                })) || []
                              }
                              placeholder="Select a country"
                              disabled={isEditMode || isSaving}
                              isLoading={isLoadingCountries}
                              initialMessage="Select from available countries"
                              queryKey={["countries", "active"]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="strStateGUID"
                    render={({ field }) => {

                      return (
                        <FormItem>
                          <FormLabel>
                            State <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              selectedValue={field.value}
                              onChange={(value: string) => {
                                field.onChange(value);
                              }}
                              options={
                                states?.map((state) => ({
                                  label: state.strName,
                                  value: state.strStateGUID,
                                })) || []
                              }
                              placeholder="Select a state"
                              disabled={
                                isEditMode || !effectiveCountryId || isSaving
                              }
                              isLoading={isLoadingStates}
                              initialMessage="Select from available states"
                              queryKey={["states", "byCountry", effectiveCountryId]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

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
                            placeholder="Enter city name"
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
              <CardFooter className="flex justify-between pt-2 pb-6 border-border-color px-6 py-4 bg-muted/20">
                <div>
                  {isEditMode && (
                    <Button
                      variant="destructive"
                      type="button"
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
                    type="submit"
                    disabled={isSaving || isLoading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update" : "Create")}
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
        description="Are you sure you want to delete this city? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default CityForm;
