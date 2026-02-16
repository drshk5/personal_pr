import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  picklistTypeSchema,
  type PicklistTypeFormValues,
} from "@/validations/central/picklist-type";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { ArrowLeft, ListFilter, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  usePicklistType,
  useCreatePicklistType,
  useUpdatePicklistType,
  useDeletePicklistType,
} from "@/hooks/api/central/use-picklist-types";
import type {
  PicklistTypeCreate,
  PicklistTypeUpdate,
} from "@/types/central/picklist-type";
import { PicklistTypeFormSkeleton } from "./PicklistTypeFormSkeleton";
import { useMenuIcon } from "@/hooks";

const PicklistTypeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const isEditMode = !!id && id !== "new";
  const form = useForm({
    resolver: zodResolver(picklistTypeSchema),
    defaultValues: {
      strType: "",
      strDescription: "",
      bolIsActive: true,
    },
  });
  const { data: picklistTypeData, isLoading: isLoadingData } = usePicklistType(
    isEditMode && id && id !== "new" ? id : undefined
  );
  useEffect(() => {
    if (picklistTypeData && isEditMode && id && id !== "new") {
      form.setValue("strType", picklistTypeData.strType);
      form.setValue("strDescription", picklistTypeData.strDescription || "");
      form.setValue("bolIsActive", picklistTypeData.bolIsActive);
    }
  }, [picklistTypeData, form, isEditMode, id]);
  const { mutate: createPicklistType, isPending: isCreating } =
    useCreatePicklistType();
  const { mutate: updatePicklistType, isPending: isUpdating } =
    useUpdatePicklistType();
  const { mutate: deletePicklistType, isPending: isDeleting } =
    useDeletePicklistType();

  const handleDelete = () => {
    if (!id) return;
    deletePicklistType(id, {
      onSuccess: () => {
        navigate("/picklist-type");
      },
      onSettled: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const onSubmit = (data: PicklistTypeFormValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: PicklistTypeUpdate = {
        strType: data.strType,
        strDescription: data.strDescription || "",
        bolIsActive: data.bolIsActive,
      };
      updatePicklistType(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/picklist-type");
          },
        }
      );
    } else {
      const createData: PicklistTypeCreate = {
        strType: data.strType,
        strDescription: data.strDescription || "",
        bolIsActive: data.bolIsActive,
      };
      createPicklistType(createData, {
        onSuccess: () => {
          navigate("/picklist-type");
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon("picklist_type", ListFilter);

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Picklist Type" : "New Picklist Type"}
        description={
          isEditMode
            ? "Update picklist type details"
            : "Create a new picklist type"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/picklist-type")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoadingData ? (
        <PicklistTypeFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="picklistTypeForm"
          >
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="strType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Type Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter type name"
                            disabled={false}
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
                            disabled={false}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="strDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mt-3">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter description (optional)"
                          className="min-h-30"
                          disabled={false}
                          onChange={field.onChange}
                          value={field.value || ""}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between pt-2 pb-6 px-6 py-4 bg-muted/20">
                <div>
                  {isEditMode && (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting || isCreating || isUpdating}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
                <div>
                  <Button
                    type="submit"
                    disabled={isCreating || isUpdating || isLoadingData}
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
        description="Are you sure you want to delete this picklist type? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default PicklistTypeForm;
