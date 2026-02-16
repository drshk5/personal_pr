import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  useState as useStateForms,
  useCreateState,
  useUpdateState,
  useDeleteState,
} from "@/hooks/api/central/use-states";
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
import { Switch } from "@/components/ui/switch";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { stateCreateSchema } from "@/validations/central/state";
import type {
  StateCreateValues,
  StateUpdateValues,
} from "@/validations/central/state";
import { ArrowLeft, Map, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { StateFormSkeleton } from "./StateFormSkeleton";
import { useMenuIcon } from "@/hooks";

const StateForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);
  const isEditMode = !!id && id !== "new";

  const { data: countries, isLoading: isLoadingCountries } =
    useActiveCountries("");

  const { data: stateData, isLoading: isLoadingState } = useStateForms(
    isEditMode && id && id !== "new" ? id : undefined
  );

  const { mutate: createState, isPending: isCreating } = useCreateState();
  const { mutate: updateState, isPending: isUpdating } = useUpdateState();
  const { mutate: deleteState, isPending: isDeleting } = useDeleteState();

  const form = useForm({
    resolver: zodResolver(stateCreateSchema),
    defaultValues: {
      strName: stateData?.strName || "",
      strCountryGUID: stateData?.strCountryGUID || "",
      bolIsActive: stateData?.bolIsActive ?? true,
    },
  });

  const isLoading = isLoadingState || isLoadingCountries;

  useEffect(() => {
    if (stateData && isEditMode) {
      form.reset({
        strName: "",
        strCountryGUID: "",
        bolIsActive: true,
      });

      setTimeout(() => {
        form.reset({
          strName: stateData.strName,
          strCountryGUID: stateData.strCountryGUID,
          bolIsActive: stateData.bolIsActive,
        });
      }, 0);
    }
  }, [stateData, form, isEditMode]);

  const handleDelete = () => {
    if (!id) return;

    deleteState(id, {
      onSuccess: () => {
        navigate("/state");
      },
      onSettled: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const onSubmit = (data: StateCreateValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: StateUpdateValues = {
        strName: data.strName,
        strCountryGUID: data.strCountryGUID,
        bolIsActive: data.bolIsActive,
      };

      updateState(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/state");
          },
        }
      );
    } else {
      const createData: StateCreateValues = {
        strName: data.strName,
        strCountryGUID: data.strCountryGUID,
        bolIsActive: data.bolIsActive,
      };

      createState(createData, {
        onSuccess: () => {
          navigate("/state");
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon("state_form", Map);

  const isSaving = isCreating || isUpdating;

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit State" : "New State"}
        description={isEditMode ? "Update state details" : "Create a new state"}
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/state")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <StateFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="stateForm"
          >
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="strCountryGUID"
                    render={({ field }) => {
                      const countryOptions =
                        countries?.map((country) => ({
                          value: country.strCountryGUID,
                          label: country.strName,
                        })) || [];

                      return (
                        <FormItem>
                          <FormLabel>
                            Country <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              options={countryOptions}
                              selectedValue={field.value}
                              onChange={(value) => {
                                field.onChange(value);
                              }}
                              placeholder="Select a country"
                              disabled={isEditMode || isSaving}
                              clearable={!isEditMode && !isSaving}
                              allowNone={!isEditMode && !isSaving}
                              noneLabel="None"
                              initialMessage="Type to filter countries"
                              isLoading={isLoadingCountries}
                              addNewPath="/country/new"
                              addNewLabel="Add New Country"
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
                    name="strName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter state name"
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
                    {isSaving
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
        description="Are you sure you want to delete this state? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default StateForm;
