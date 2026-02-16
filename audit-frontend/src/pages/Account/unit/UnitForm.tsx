import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Box, Save, Trash2 } from "lucide-react";

import {
  useUnit,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
} from "@/hooks/api/Account/use-units";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";

import { Actions, FormModules } from "@/lib/permissions";

import type { UnitCreate, UnitUpdate } from "@/types/Account/unit";
import { unitSchema, type UnitFormValues } from "@/validations/Account/unit";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
import UnitFormSkeleton from "./UnitFormSkeleton.tsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import NotFound from "@/components/error-boundaries/entity-not-found";

const UnitForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const HeaderIcon = useMenuIcon(FormModules.UNIT, Box);

  const isEditMode = !!id && id !== "new";

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema) as unknown as Resolver<UnitFormValues>,
    defaultValues: {
      strUnitName: "",
      bolIsActive: true,
    },
    mode: "onChange",
  });

  const {
    data: unit,
    isFetching: isFetchingUnit,
    error: unitError,
  } = useUnit(isEditMode && id ? id : undefined);

  const { mutate: createUnit, isPending: isCreating } = useCreateUnit();
  const { mutate: updateUnit, isPending: isUpdating } = useUpdateUnit();
  const { mutate: deleteUnit, isPending: isDeleting } = useDeleteUnit();

  React.useEffect(() => {
    if (unit && isEditMode && id) {
      const resetValues = {
        strUnitName: unit.strUnitName || "",
        bolIsActive: unit.bolIsActive,
      };

      form.reset(resetValues, {
        keepDirty: false,
        keepErrors: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      });
    }
  }, [unit, form, isEditMode, id]);

  const onSubmit = (data: UnitFormValues) => {
    if (isEditMode && id) {
      const updateData: UnitUpdate = {
        strUnitName: data.strUnitName,
        bolIsActive: data.bolIsActive,
      };

      updateUnit(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/unit");
          },
        }
      );
    } else {
      const createData: UnitCreate = {
        strUnitName: data.strUnitName,
        bolIsActive: data.bolIsActive,
      };

      createUnit(createData, {
        onSuccess: () => {
          navigate("/unit");
        },
      });
    }
  };

  const handleDelete = () => {
    if (id) {
      deleteUnit(
        { id },
        {
          onSuccess: () => {
            navigate("/unit");
          },
        }
      );
    }
  };

  if (isEditMode && isFetchingUnit) {
    return <UnitFormSkeleton />;
  }

  if (isEditMode && unitError) {
    return <NotFound pageName="Unit" />;
  }

  const isSubmitting = isCreating || isUpdating;

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Unit" : "New Unit"}
        description={
          isEditMode
            ? "Update unit information"
            : "Create a new measurement unit"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/unit")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="strUnitName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Unit Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter unit name (e.g., kg, liters, pieces)"
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t px-6 py-4">
              <div>
                {isEditMode && (
                  <WithPermission
                    module={FormModules.UNIT}
                    action={Actions.DELETE}
                    fallback={<></>}
                  >
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSubmitting || isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </WithPermission>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/unit")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <WithPermission
                  module={FormModules.UNIT}
                  action={isEditMode ? Actions.EDIT : Actions.SAVE}
                  fallback={<></>}
                >
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditMode ? "Update" : "Create"}
                  </Button>
                </WithPermission>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Unit"
        description="Are you sure you want to delete this unit? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default UnitForm;
