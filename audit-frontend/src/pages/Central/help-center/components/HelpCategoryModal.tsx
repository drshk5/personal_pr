import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";

import type { HelpCategory } from "@/types/central/help-center";

import {
  helpCategorySchema,
  type HelpCategoryFormData,
} from "@/validations/central/help-center";

import {
  useCreateHelpCategory,
  useDeleteHelpCategory,
  useUpdateHelpCategory,
} from "@/hooks/api/central/use-help-center";

import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { IconPicker } from "./IconPicker";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { useActiveModules } from "@/hooks/api/central/use-modules";

interface HelpCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: HelpCategory | null;
}

export function HelpCategoryModal({
  open,
  onOpenChange,
  category,
}: HelpCategoryModalProps) {
  const isEdit = !!category;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const createCategory = useCreateHelpCategory();
  const updateCategory = useUpdateHelpCategory();
  const deleteCategory = useDeleteHelpCategory();

  const { data: modulesData, isLoading: modulesLoading } = useActiveModules("");
  const modules = modulesData || [];

  const isSubmitting =
    createCategory.isPending ||
    updateCategory.isPending ||
    deleteCategory.isPending;

  const form = useForm<HelpCategoryFormData>({
    resolver: zodResolver(helpCategorySchema),
    defaultValues: {
      strCategoryName: "",
      strDescription: "",
      strIcon: "",
      strModuleGUID: "",
      intOrder: 0,
      bolIsActive: true,
    },
  });

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      form.reset({
        strCategoryName: category.strCategoryName,
        strDescription: category.strDescription || "",
        strIcon: category.strIcon || "",
        strModuleGUID: category.strModuleGUID || "",
        intOrder: category.intOrder,
        bolIsActive: category.bolIsActive,
      });
    } else {
      form.reset({
        strCategoryName: "",
        strDescription: "",
        strIcon: "",
        strModuleGUID: "",
        intOrder: 0,
        bolIsActive: true,
      });
    }
  }, [category, form]);

  const onSubmit = async (data: HelpCategoryFormData) => {
    if (isEdit && category) {
      await updateCategory.mutateAsync({
        guid: category.strCategoryGUID,
        data: {
          strCategoryName: data.strCategoryName,
          strDescription: data.strDescription,
          strIcon: data.strIcon,
          strModuleGUID: data.strModuleGUID,
          intOrder: data.intOrder,
          bolIsActive: data.bolIsActive,
        },
      });
    } else {
      await createCategory.mutateAsync({
        strCategoryName: data.strCategoryName,
        strDescription: data.strDescription,
        strIcon: data.strIcon,
        strModuleGUID: data.strModuleGUID,
        intOrder: data.intOrder,
        bolIsActive: data.bolIsActive,
      });
    }
    onOpenChange(false);
    form.reset();
  };

  const handleDelete = async () => {
    if (category) {
      await deleteCategory.mutateAsync(category.strCategoryGUID);
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <ModalDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? "Edit Category" : "Create Category"}
        description={
          isEdit
            ? "Update the category information below."
            : "Add a new help category to organize your articles."
        }
        maxWidth="700px"
        showCloseButton={true}
        footerContent={
          <div className="flex w-full justify-between">
            {isEdit && (
              <Button
                variant="destructive"
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            )}
            <div className="flex ml-auto gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="category-form"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="px-4 sm:px-6 py-4">
          <Form {...form}>
            <form
              id="category-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="strCategoryName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Getting Started" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this category"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="strModuleGUID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module</FormLabel>
                      <FormControl>
                        <PreloadedSelect
                          options={modules.map((module) => ({
                            value: module.strModuleGUID,
                            label: module.strName,
                          }))}
                          selectedValue={field.value || undefined}
                          onChange={(value) => field.onChange(value || "")}
                          placeholder="Select a module (optional)"
                          isLoading={modulesLoading}
                          allowNone={true}
                          noneLabel="No specific module"
                          clearable={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="strIcon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <IconPicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="intOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bolIsActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Inactive categories won't be visible to users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </ModalDialog>

      {isEdit && (
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDelete}
          title="Delete Category"
          description={`Are you sure you want to delete "${category?.strCategoryName}"? This action cannot be undone.`}
          isLoading={deleteCategory.isPending}
        />
      )}
    </>
  );
}
