import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  docTypeSchema,
  type DocTypeFormValues,
} from "@/validations/central/doctype";
import {
  useDocType,
  useCreateDocType,
  useUpdateDocType,
  useDeleteDocType,
} from "@/hooks/api/central/use-doc-types";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { Form } from "@/components/ui/form";
import { DocTypeFormSkeleton } from "./DocTypeFormSkeleton";

import { WithPermission } from "@/components/ui/with-permission";
import { Actions, FormModules } from "@/lib/permissions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { ArrowLeft, Save, FileText, Trash2, AlertTriangle } from "lucide-react";

import type { DocTypeCreate, DocTypeUpdate } from "@/types/central/doc-type";

const DocTypeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  const {
    data: docTypeData,
    isLoading: isLoadingDocType,
    error: docTypeError,
  } = useDocType(isEditMode ? id : undefined);

  const { mutate: createDocType, isPending: isCreating } = useCreateDocType();
  const { mutate: updateDocType, isPending: isUpdating } = useUpdateDocType();
  const { mutate: deleteDocType, isPending: isDeleting } = useDeleteDocType();

  const form = useForm({
    resolver: zodResolver(docTypeSchema),
    defaultValues: {
      strDocTypeCode: "",
      strDocTypeName: "",
      bolIsActive: true,
    },
  });

  const isLoading = isLoadingDocType;
  const isSaving = isCreating || isUpdating;

  React.useEffect(() => {
    if (docTypeData && isEditMode && id) {
      // Set form values once doc type data is loaded
      form.setValue("strDocTypeCode", docTypeData.strDocTypeCode);
      form.setValue("strDocTypeName", docTypeData.strDocTypeName);
      form.setValue("bolIsActive", docTypeData.bolIsActive);
    }
  }, [docTypeData, form, isEditMode, id]);

  const onSubmit = (data: DocTypeFormValues) => {
    if (isEditMode && id) {
      const updateData: DocTypeUpdate = {
        strDocTypeCode: data.strDocTypeCode,
        strDocTypeName: data.strDocTypeName,
        bolIsActive: data.bolIsActive,
      };

      updateDocType(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/doctype");
          },
        }
      );
    } else {
      const createData: DocTypeCreate = {
        strDocTypeCode: data.strDocTypeCode,
        strDocTypeName: data.strDocTypeName,
        bolIsActive: data.bolIsActive,
      };

      createDocType(createData, {
        onSuccess: () => {
          navigate("/doctype");
        },
      });
    }
  };

  const handleDelete = () => {
    if (id) {
      deleteDocType(
        { id },
        {
          onSuccess: () => {
            setShowDeleteConfirm(false);
            navigate("/doctype");
          },
        }
      );
    }
  };

  if (docTypeError) {
    return (
      <CustomContainer>
        <div className="p-4">
          <div className="flex items-center space-x-2 text-red-500">
            <AlertTriangle size={20} />
            <span>
              Error loading document type. Please try again or contact support.
            </span>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/doctype")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Document Types
          </Button>
        </div>
      </CustomContainer>
    );
  }

  return (
    <CustomContainer>
      <PageHeader
        icon={FileText}
        title={isEditMode ? "Edit Document Type" : "New Document Type"}
        description={
          isEditMode
            ? "Update document type details"
            : "Create a new document type"
        }
        actions={
          <Button variant="outline" onClick={() => navigate("/doctype")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <DocTypeFormSkeleton />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="strDocTypeCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Code <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter document type code"
                            {...field}
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="strDocTypeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter document type name"
                            {...field}
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="bolIsActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2">
                        <FormLabel>Active</FormLabel>
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
              <CardFooter className="flex justify-between">
                <div>
                  {isEditMode && (
                    <WithPermission
                      module={FormModules.DOC_TYPE}
                      action={Actions.DELETE}
                    >
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isSaving || isDeleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </WithPermission>
                  )}
                </div>

                <WithPermission
                  module={FormModules.DOC_TYPE}
                  action={Actions.SAVE}
                >
                  <Button type="submit" disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving
                      ? isEditMode
                        ? "Updating..."
                        : "Creating..."
                      : isEditMode
                        ? "Update"
                        : "Create"}
                  </Button>
                </WithPermission>
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
        description="Are you sure you want to delete this document type? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </CustomContainer>
  );
};

export default DocTypeForm;
