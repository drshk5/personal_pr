import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  legalStatusTypeSchema,
  type LegalStatusTypeFormValues,
} from "@/validations/central/legal-status-type";

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
import { LegalStatusTypeFormSkeleton } from "./LegalStatusTypeFormSkeleton";

import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

import { ArrowLeft, Scale, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

import {
  useLegalStatusType,
  useCreateLegalStatusType,
  useUpdateLegalStatusType,
  useDeleteLegalStatusType,
} from "@/hooks/api/central/use-legal-status-types";
import type {
  LegalStatusTypeCreate,
  LegalStatusTypeUpdate,
} from "@/types/central/legal-status-type";
import { useMenuIcon } from "@/hooks";
const LegalStatusTypeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  const form = useForm({
    resolver: zodResolver(legalStatusTypeSchema),
    defaultValues: {
      strName: "",
      bolIsActive: true,
    },
  });

  const { data: legalStatusTypeData, isLoading } = useLegalStatusType(
    isEditMode && id && id !== "new" ? id : undefined
  );

  useEffect(() => {
    if (legalStatusTypeData && isEditMode && id && id !== "new") {
      form.setValue("strName", legalStatusTypeData.strName);
      form.setValue("bolIsActive", legalStatusTypeData.bolIsActive);
    }
  }, [legalStatusTypeData, form, isEditMode, id]);

  const { mutate: createLegalStatusType, isPending: isCreating } =
    useCreateLegalStatusType();
  const { mutate: updateLegalStatusType, isPending: isUpdating } =
    useUpdateLegalStatusType();
  const { mutate: deleteLegalStatusType, isPending: isDeleting } =
    useDeleteLegalStatusType();

  const isSaving = isCreating || isUpdating;

  const handleDelete = () => {
    if (!id) return;

    deleteLegalStatusType(id, {
      onSuccess: () => {
        navigate("/legal-status-type");
        },
      onSettled: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const onSubmit = (data: LegalStatusTypeFormValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: LegalStatusTypeUpdate = {
        strName: data.strName,
        bolIsActive: data.bolIsActive,
      };

      updateLegalStatusType(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/legal-status-type");
            },
        }
      );
    } else {
      const createData: LegalStatusTypeCreate = {
        strName: data.strName,
        bolIsActive: data.bolIsActive,
      };

      createLegalStatusType(createData, {
        onSuccess: () => {
          navigate("/legal-status-type");
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon("legal_status_type_form", Scale);

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Legal Status Type" : "New Legal Status Type"}
        description={
          isEditMode
            ? "Update legal status type details"
            : "Create a new legal status type"
        }
        icon={HeaderIcon}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/legal-status-type")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <LegalStatusTypeFormSkeleton />
      ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                id="legalStatusTypeForm"
              >
        <Card className="mt-6 border border-border-color">
          <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
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
                            placeholder="Enter legal status type name"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Active status */}
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
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
            <div>
              <Button
                onClick={form.handleSubmit(onSubmit)}
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
        description="Are you sure you want to delete this legal status type? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default LegalStatusTypeForm;
