import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  documentModuleSchema,
  type DocumentModuleFormValues,
} from "@/validations/central/document-module";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { ArrowLeft, FolderOpen, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  useDocumentModule,
  useCreateDocumentModule,
  useUpdateDocumentModule,
  useDeleteDocumentModule,
} from "@/hooks/api/central/use-document-modules";
import { useModules } from "@/hooks/api/central/use-modules";
import type {
  DocumentModuleCreate,
  DocumentModuleUpdate,
} from "@/types/central/document-module";
import { DocumentModuleFormSkeleton } from "./DocumentModuleFormSkeleton.tsx";
import { useMenuIcon } from "@/hooks";

const DocumentModuleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  // Create the form with Zod validation
  const form = useForm<DocumentModuleFormValues>({
    resolver: zodResolver(documentModuleSchema),
    defaultValues: {
      strModuleGUID: "",
      strModuleName: "",
      bolIsActive: true,
    },
  });

  // Use the hook to fetch document module details with loading state
  const { data: documentModuleData, isLoading: isLoadingDocumentModule } =
    useDocumentModule(isEditMode && id && id !== "new" ? id : undefined);

  // Fetch modules for the dropdown
  const { data: modulesResponse, isLoading: isLoadingModules } = useModules({
    bolIsActive: true,
    pageSize: 100, // Get a large number of modules for the dropdown
  });

  // Effect to populate form when data is loaded from the hook
  useEffect(() => {
    if (documentModuleData && isEditMode && id && id !== "new") {
      form.setValue("strModuleGUID", documentModuleData.strModuleGUID);
      form.setValue("strModuleName", documentModuleData.strModuleName);
      form.setValue("bolIsActive", documentModuleData.bolIsActive);
    }
  }, [documentModuleData, form, id, isEditMode]);

  const createDocumentModuleMutation = useCreateDocumentModule();
  const updateDocumentModuleMutation = useUpdateDocumentModule();
  const deleteDocumentModuleMutation = useDeleteDocumentModule();

  const onSubmit = async (data: DocumentModuleFormValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: DocumentModuleUpdate = {
        strModuleGUID: data.strModuleGUID,
        strModuleName: data.strModuleName,
        bolIsActive: data.bolIsActive,
      };
      await updateDocumentModuleMutation.mutateAsync({
        id,
        data: updateData,
      });
    } else {
      const createData: DocumentModuleCreate = {
        strModuleGUID: data.strModuleGUID,
        strModuleName: data.strModuleName,
        bolIsActive: data.bolIsActive,
      };
      await createDocumentModuleMutation.mutateAsync(createData);
    }
    navigate("/document-module");
  };

  const handleDeleteConfirm = async () => {
    if (isEditMode && id && id !== "new") {
      await deleteDocumentModuleMutation.mutateAsync(id);
      navigate("/document-module");
    }
    setShowDeleteConfirm(false);
  };

  // Get menu icon
  const HeaderIcon = useMenuIcon("document_module_form", FolderOpen);

  // Loading state
  if (isLoadingDocumentModule || isLoadingModules) {
    return <DocumentModuleFormSkeleton />;
  }

  const modules = modulesResponse?.data?.items || [];

  const getSelectedModuleName = () => {
    if (isEditMode && documentModuleData) {
      const selectedModule = modules.find(
        (module) => module.strModuleGUID === documentModuleData.strModuleGUID
      );
      return selectedModule?.strName || documentModuleData.strModuleGUID;
    }
    return "";
  };

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Document Module" : "Add Document Module"}
        description={
          isEditMode
            ? "Update document module information"
            : "Create a new document module"
        }
        icon={HeaderIcon}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/document-module")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {isEditMode ? (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <div className="flex h-10 w-full rounded-md border-border-color">
                      {getSelectedModuleName()}
                    </div>
                  </FormItem>
                ) : (
                  <FormField
                    control={form.control}
                    name="strModuleGUID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Module <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a module..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modules.map((module) => (
                              <SelectItem
                                key={module.strModuleGUID}
                                value={module.strModuleGUID}
                              >
                                {module.strName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="strModuleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Document Module Name{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter document module name..."
                          disabled={
                            createDocumentModuleMutation.isPending ||
                            updateDocumentModuleMutation.isPending
                          }
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
                    <FormItem className="flex flex-row items-center gap-3 rounded-lg border-border-color p-4">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={
                            createDocumentModuleMutation.isPending ||
                            updateDocumentModuleMutation.isPending
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center">
              <div>
                {isEditMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteDocumentModuleMutation.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => navigate("/document-module")}
                  disabled={
                    createDocumentModuleMutation.isPending ||
                    updateDocumentModuleMutation.isPending
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="default"
                  disabled={
                    createDocumentModuleMutation.isPending ||
                    updateDocumentModuleMutation.isPending
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? "Update" : "Create"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        title="Delete Document Module"
        description="Are you sure you want to delete this document module? This action cannot be undone and may affect related documents."
        isLoading={deleteDocumentModuleMutation.isPending}
      />
    </CustomContainer>
  );
};

export default DocumentModuleForm;
