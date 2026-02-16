import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Trash2, Plus, Edit } from "lucide-react";

import {
  usePageTemplate,
  useCreatePageTemplate,
  useUpdatePageTemplate,
  useDeletePageTemplate,
} from "@/hooks";

import {
  pageTemplateSchema,
  type PageTemplateFormValues,
} from "@/validations/central/page-template";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

const PageTemplateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const isEditMode = !!id && id !== "new";

  const { data: pageTemplateData, isLoading: isLoadingData } = usePageTemplate(
    isEditMode ? id : undefined
  );

  const { mutate: createPageTemplateMutation, isPending: isCreating } =
    useCreatePageTemplate();
  const { mutate: updatePageTemplateMutation, isPending: isUpdating } =
    useUpdatePageTemplate();
  const { mutate: deletePageTemplateMutation, isPending: isDeleting } =
    useDeletePageTemplate();

  const form = useForm({
    resolver: zodResolver(pageTemplateSchema),
    defaultValues: {
      strPageTemplateName: "",
      bolIsSave: false,
      bolIsView: false,
      bolIsEdit: false,
      bolIsDelete: false,
      bolIsPrint: false,
      bolIsExport: false,
      bolIsImport: false,
      bolIsApprove: false,
    },
  });

  useEffect(() => {
    if (isEditMode && !isLoadingData && pageTemplateData) {
      form.setValue(
        "strPageTemplateName",
        pageTemplateData.strPageTemplateName
      );
      form.setValue("bolIsSave", pageTemplateData.bolIsSave);
      form.setValue("bolIsView", pageTemplateData.bolIsView);
      form.setValue("bolIsEdit", pageTemplateData.bolIsEdit);
      form.setValue("bolIsDelete", pageTemplateData.bolIsDelete);
      form.setValue("bolIsPrint", pageTemplateData.bolIsPrint);
      form.setValue("bolIsExport", pageTemplateData.bolIsExport);
      form.setValue("bolIsImport", pageTemplateData.bolIsImport);
      form.setValue("bolIsApprove", pageTemplateData.bolIsApprove);
    }
  }, [pageTemplateData, form, isEditMode, isLoadingData]);

  const onSubmit = (data: PageTemplateFormValues) => {
    if (isEditMode && id) {
      updatePageTemplateMutation(
        { id, data },
        {
          onSuccess: () => navigate("/page-template"),
        }
      );
    } else {
      createPageTemplateMutation(data, {
        onSuccess: () => navigate("/page-template"),
      });
    }
  };

  const handleDelete = () => {
    if (!id) return;

    deletePageTemplateMutation(
      { id },
      {
        onSuccess: () => navigate("/page-template"),
        onSettled: () => setShowDeleteConfirm(false),
      }
    );
  };

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Page Template" : "New Page Template"}
        description={
          isEditMode
            ? "Update page template details"
            : "Create a new page template"
        }
        icon={isEditMode ? Edit : Plus}
        actions={
          <Button variant="outline" onClick={() => navigate("/page-template")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoadingData ? (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-border-color mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="pageTemplateForm"
          >
            <Card className="mt-6">
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="strPageTemplateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Template Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter template name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-border-color rounded-lg p-4 ">
                  <h3 className="text-sm font-medium mb-4">Page Permissions</h3>
                  <div className="flex flex-row justify-between items-center w-full flex-wrap">
                    <FormField
                      control={form.control}
                      name="bolIsSave"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 flex-1">
                          <FormLabel className="cursor-pointer mb-0 whitespace-nowrap">
                            Save?
                          </FormLabel>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bolIsView"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 flex-1">
                          <FormLabel className="cursor-pointer mb-0 whitespace-nowrap">
                            View?
                          </FormLabel>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bolIsEdit"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 flex-1">
                          <FormLabel className="cursor-pointer mb-0 whitespace-nowrap">
                            Edit?
                          </FormLabel>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bolIsDelete"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 flex-1">
                          <FormLabel className="cursor-pointer mb-0 whitespace-nowrap">
                            Delete?
                          </FormLabel>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bolIsPrint"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 flex-1">
                          <FormLabel className="cursor-pointer mb-0 whitespace-nowrap">
                            Print?
                          </FormLabel>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bolIsExport"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 flex-1">
                          <FormLabel className="cursor-pointer mb-0 whitespace-nowrap">
                            Export?
                          </FormLabel>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bolIsImport"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 flex-1">
                          <FormLabel className="cursor-pointer mb-0 whitespace-nowrap">
                            Import?
                          </FormLabel>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bolIsApprove"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2 flex-1">
                          <FormLabel className="cursor-pointer mb-0 whitespace-nowrap">
                            Approve?
                          </FormLabel>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 pb-6">
                <div>
                  {isEditMode && (
                    <Button
                      type="button"
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
                    onClick={form.handleSubmit(onSubmit)}
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
        description="Are you sure you want to delete this page template? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default PageTemplateForm;
