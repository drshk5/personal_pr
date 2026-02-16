import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  picklistValueSchema,
  type PicklistValueFormValues,
} from "@/validations/central/picklist-value";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowLeft, Tag, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import {
  usePicklistValue,
  useCreatePicklistValue,
  useUpdatePicklistValue,
  useDeletePicklistValue,
} from "@/hooks/api/central/use-picklist-values";
import { useActivePicklistTypes } from "@/hooks/api";
import { FormModules, Actions } from "@/lib/permissions";
import { WithPermission } from "@/components/ui/with-permission";
import type {
  PicklistValueCreate,
  PicklistValueUpdate,
} from "@/types/central/picklist-value";
import { PicklistValueFormSkeleton } from "./PicklistValueFormSkeleton";
import { useMenuIcon } from "@/hooks";

const PicklistValueForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const isEditMode = !!id && id !== "new";
  const { data: activePicklistTypes = [], isLoading: loadingPicklistTypes } =
    useActivePicklistTypes();
  const { data: picklistValueData, isLoading: isLoadingPicklistValue } =
    usePicklistValue(isEditMode && id && id !== "new" ? id : undefined);
  const { mutate: createPicklistValue, isPending: isCreating } =
    useCreatePicklistValue();
  const { mutate: updatePicklistValue, isPending: isUpdating } =
    useUpdatePicklistValue();
  const { mutate: deletePicklistValue, isPending: isDeleting } =
    useDeletePicklistValue();
  const form = useForm({
    resolver: zodResolver(picklistValueSchema),
    defaultValues: {
      strValue: "",
      strPicklistTypeGUID: "",
      bolIsActive: true,
    },
  });
  const isLoading = isLoadingPicklistValue || loadingPicklistTypes;
  useEffect(() => {
    if (
      picklistValueData &&
      isEditMode &&
      id &&
      id !== "new" &&
      !loadingPicklistTypes
    ) {
      form.setValue("strValue", picklistValueData.strValue);
      form.setValue(
        "strPicklistTypeGUID",
        picklistValueData.strPicklistTypeGUID?.toLowerCase()
      );
      form.setValue("bolIsActive", picklistValueData.bolIsActive);
    }
  }, [picklistValueData, form, isEditMode, id, loadingPicklistTypes]);

  const handleDelete = () => {
    if (!id) return;
    deletePicklistValue(
      {
        id,
        picklistTypeGUID: picklistValueData?.strPicklistTypeGUID,
      },
      {
        onSuccess: () => {
          navigate("/picklist-value");
        },
        onSettled: () => {
          setShowDeleteConfirm(false);
        },
      }
    );
  };

  const onSubmit = (data: PicklistValueFormValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: PicklistValueUpdate = {
        strValue: data.strValue,
        strPicklistTypeGUID: data.strPicklistTypeGUID,
        bolIsActive: data.bolIsActive,
      };
      updatePicklistValue(
        {
          id,
          data: updateData,
          picklistTypeGUID: updateData.strPicklistTypeGUID,
        },
        {
          onSuccess: () => {
            navigate("/picklist-value");
          },
        }
      );
    } else {
      const createData: PicklistValueCreate = {
        strValue: data.strValue,
        strPicklistTypeGUID: data.strPicklistTypeGUID,
        bolIsActive: data.bolIsActive,
      };
      createPicklistValue(createData, {
        onSuccess: () => {
          navigate("/picklist-value");
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon(FormModules.PICKLIST_VALUE, Tag);
  const isSaving = isCreating || isUpdating;
  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Picklist Value" : "New Picklist Value"}
        description="Manage picklist values and their associated types"
        icon={HeaderIcon}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/picklist-value")}
            className="ml-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <PicklistValueFormSkeleton />
      ) : (
        <div className="grid gap-4">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="strValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Value <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter a value"
                              disabled={isLoading || isSaving}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="strPicklistTypeGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Picklist Type{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isLoading || isSaving}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a picklist type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activePicklistTypes.length > 0 ? (
                                activePicklistTypes.map((type) => (
                                  <SelectItem
                                    key={type.strPicklistTypeGUID}
                                    value={type.strPicklistTypeGUID.toLowerCase()}
                                  >
                                    {type.strType}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem disabled value="none">
                                  {loadingPicklistTypes
                                    ? "Loading types..."
                                    : "No picklist types available"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
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
                            disabled={isLoading || isSaving}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </CardContent>
            <CardFooter className="border-border-color px-6 py-4 bg-muted/20">
              <div className="flex items-center justify-between w-full">
                <div>
                  {isEditMode && (
                    <WithPermission
                      module={FormModules.PICKLIST_VALUE}
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
                <WithPermission
                  module={FormModules.PICKLIST_VALUE}
                  action={Actions.SAVE}
                >
                  <Button
                    onClick={handleSubmit}
                    disabled={isSaving || isLoading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isEditMode ? (
                      <Save className="h-4 w-4 mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
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
            </CardFooter>
          </Card>
        </div>
      )}

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this picklist value? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </CustomContainer>
  );
};

export default PicklistValueForm;
