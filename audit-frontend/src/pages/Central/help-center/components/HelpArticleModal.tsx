import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";

import type { HelpArticle } from "@/types/central/help-center";

import {
  helpArticleSchema,
  type HelpArticleFormData,
} from "@/validations/central/help-center";

import {
  useCreateHelpArticle,
  useDeleteHelpArticle,
  useActiveCategoryDropdown,
  useUpdateHelpArticle,
} from "@/hooks/api/central/use-help-center";
import { useActiveModules } from "@/hooks/api/central/use-modules";

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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Switch } from "@/components/ui/switch";

interface HelpArticleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: HelpArticle | null;
}

export function HelpArticleModal({
  open,
  onOpenChange,
  article,
}: HelpArticleModalProps) {
  const isEdit = !!article;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const createArticle = useCreateHelpArticle();
  const updateArticle = useUpdateHelpArticle();
  const deleteArticle = useDeleteHelpArticle();
  const { data: categories = [], isLoading: categoriesLoading } =
    useActiveCategoryDropdown();
  const { data: modulesData, isLoading: modulesLoading } = useActiveModules();

  const modules = modulesData || [];
  const isSubmitting =
    createArticle.isPending ||
    updateArticle.isPending ||
    deleteArticle.isPending;

  const form = useForm<HelpArticleFormData>({
    resolver: zodResolver(helpArticleSchema),
    defaultValues: {
      strCategoryGUID: "",
      strModuleGUID: "",
      strTitle: "",
      strContent: "",
      strVideoUrl: "",
      intOrder: 0,
      bolIsActive: true,
      bolIsFeatured: false,
    },
  });

  // Reset form when article changes
  useEffect(() => {
    if (article) {
      form.reset({
        strCategoryGUID: article.strCategoryGUID,
        strModuleGUID: article.strModuleGUID || "",
        strTitle: article.strTitle,
        strContent: article.strContent,
        strVideoUrl: article.strVideoUrl || "",
        intOrder: article.intOrder,
        bolIsActive: article.bolIsActive,
        bolIsFeatured: article.bolIsFeatured,
      });
    } else {
      form.reset({
        strCategoryGUID: "",
        strModuleGUID: "",
        strTitle: "",
        strContent: "",
        strVideoUrl: "",
        intOrder: 0,
        bolIsActive: true,
        bolIsFeatured: false,
      });
    }
  }, [article, form]);

  const onSubmit = async (data: HelpArticleFormData) => {
    if (isEdit && article) {
      await updateArticle.mutateAsync({
        guid: article.strArticleGUID,
        data: {
          strCategoryGUID: data.strCategoryGUID,
          strModuleGUID: data.strModuleGUID,
          strTitle: data.strTitle,
          strContent: data.strContent,
          strVideoUrl: data.strVideoUrl,
          intOrder: data.intOrder,
          bolIsActive: data.bolIsActive,
          bolIsFeatured: data.bolIsFeatured,
        },
      });
    } else {
      await createArticle.mutateAsync({
        strCategoryGUID: data.strCategoryGUID,
        strModuleGUID: data.strModuleGUID,
        strTitle: data.strTitle,
        strContent: data.strContent,
        strVideoUrl: data.strVideoUrl,
        intOrder: data.intOrder,
        bolIsActive: data.bolIsActive,
        bolIsFeatured: data.bolIsFeatured,
      });
    }
    onOpenChange(false);
    form.reset();
  };

  const handleDelete = async () => {
    if (article) {
      await deleteArticle.mutateAsync(article.strArticleGUID);
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <ModalDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? "Edit Article" : "Create Article"}
        description={
          isEdit
            ? "Update the article information below."
            : "Add a new help article to your knowledge base."
        }
        maxWidth="900px"
        fullHeight={true}
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
              <Button type="submit" form="article-form" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Update Article" : "Create Article"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="px-4 sm:px-6 py-4">
          <Form {...form}>
            <form
              id="article-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="strCategoryGUID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Category <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoriesLoading && (
                            <SelectItem value="" disabled>
                              Loading categories...
                            </SelectItem>
                          )}
                          {categories?.map((category) => (
                            <SelectItem
                              key={category.strCategoryGUID}
                              value={category.strCategoryGUID}
                            >
                              {category.strCategoryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                name="strTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Article Title <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., How to create your first report"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Content <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <RichTextEditor
                        content={field.value}
                        onChange={field.onChange}
                        placeholder="Write your article content here..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strVideoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., https://www.youtube.com/watch?v=..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a YouTube video URL to embed in the article.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bolIsActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-2">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription className="text-xs">
                          Show to users
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

                <FormField
                  control={form.control}
                  name="bolIsFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between p-2">
                      <div className="space-y-0.5">
                        <FormLabel>Featured</FormLabel>
                        <FormDescription className="text-xs">
                          Show on home
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
              </div>
            </form>
          </Form>
        </div>
      </ModalDialog>

      {isEdit && (
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDelete}
          title="Delete Article"
          description={`Are you sure you want to delete "${article?.strTitle}"? This action cannot be undone.`}
          isLoading={deleteArticle.isPending}
        />
      )}
    </>
  );
}
