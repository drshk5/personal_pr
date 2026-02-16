import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  industrySchema,
  type IndustryFormValues,
} from "@/validations/central/industry";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import { IndustryFormSkeleton } from "./IndustryFormSkeleton";

import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

import { ArrowLeft, Factory, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

import {
  useIndustry,
  useCreateIndustry,
  useUpdateIndustry,
  useDeleteIndustry,
} from "@/hooks/api/central/use-industries";
import type { IndustryCreate, IndustryUpdate } from "@/types/central/industry";
import { useMenuIcon } from "@/hooks";

const IndustryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  const form = useForm({
    resolver: zodResolver(industrySchema),
    defaultValues: {
      strName: "",
      bolIsActive: true,
    },
  });

  const { data: industryData, isLoading } = useIndustry(
    isEditMode && id && id !== "new" ? id : undefined
  );

  useEffect(() => {
    if (industryData && isEditMode && id && id !== "new") {
      form.setValue("strName", industryData.strName);
      form.setValue("bolIsActive", industryData.bolIsActive);
    }
  }, [industryData, form, isEditMode, id]);

  const { mutate: createIndustry, isPending: isCreating } = useCreateIndustry();
  const { mutate: updateIndustry, isPending: isUpdating } = useUpdateIndustry();
  const { mutate: deleteIndustry, isPending: isDeleting } = useDeleteIndustry();

  const handleDelete = () => {
    if (!id) return;

    deleteIndustry(id, {
      onSuccess: () => {
        navigate("/industry-type");
      },
      onSettled: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const onSubmit = (data: IndustryFormValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: IndustryUpdate = {
        strName: data.strName,
        bolIsActive: data.bolIsActive,
      };

      updateIndustry(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/industry-type");
          },
        }
      );
    } else {
      const createData: IndustryCreate = {
        strName: data.strName,
        bolIsActive: data.bolIsActive,
      };

      createIndustry(createData, {
        onSuccess: () => {
          navigate("/industry-type");
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon("industry_form", Factory);

  const isSaving = isCreating || isUpdating;

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Industry type" : "New Industry Type"}
        description={
          isEditMode
            ? "Update industry type details"
            : "Create a new industry type"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/industry-type")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <IndustryFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="industryForm"
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
                            placeholder="Enter industry type name"
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
        description="Are you sure you want to delete this industry type? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default IndustryForm;
