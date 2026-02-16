import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, AlignLeft, Trash2, Save } from "lucide-react";

// API Hooks
import {
  useMasterMenu,
  useUpdateMasterMenu,
  useCreateMasterMenu,
  useDeleteMasterMenu,
  useParentMasterMenus,
} from "@/hooks/api";
import { useActiveModules } from "@/hooks/api/central/use-modules";
import { useActivePageTemplates } from "@/hooks/api/central/use-page-templates";

// Types and Validation
import { masterMenuSchema, type MasterMenuFormValues } from "@/validations";
import type {
  MasterMenuCreate,
  MasterMenuUpdate,
} from "@/types/central/master-menu";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { MasterMenuFormSkeleton } from "./MasterMenuFormSkeleton";

const MasterMenuForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id && id !== "new";
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const masterMenuIdForParentQuery =
    id && id !== "new" ? id : "00000000-0000-0000-0000-000000000000";

  const { data: parentMenus = [], isLoading: loadingParentMenus } =
    useParentMasterMenus(masterMenuIdForParentQuery);

  const { data: activeModules = [], isLoading: loadingModules } =
    useActiveModules("");

  const { data: activePageTemplates = [], isLoading: loadingPageTemplates } =
    useActivePageTemplates("");

  const { data: masterMenu, isLoading: isLoadingMasterMenu } = useMasterMenu(
    id !== "new" ? id : undefined
  );

  const { mutate: createMasterMenuMutate, isPending: isCreating } =
    useCreateMasterMenu();

  const { mutate: updateMasterMenuMutate, isPending: isUpdating } =
    useUpdateMasterMenu();

  const { mutate: deleteMasterMenuMutate, isPending: isDeleting } =
    useDeleteMasterMenu();

  const parentMenuOptions = React.useMemo(() => {
    return [
      { value: "none", label: "-- No parent (top-level) --" },
      ...parentMenus.map((item) => ({
        value: item.strMasterMenuGUID.toLowerCase(),
        label: item.strName,
      })),
    ];
  }, [parentMenus]);

  const moduleOptions = React.useMemo(() => {
    return [
      { value: "common", label: "-- Common --" },
      ...activeModules.map((module) => ({
        value: module.strModuleGUID,
        label: module.strName,
      })),
    ];
  }, [activeModules]);

  const pageTemplateOptions = React.useMemo(() => {
    return activePageTemplates.map((template) => ({
      value: template.strPageTemplateGUID,
      label: template.strPageTemplateName,
    }));
  }, [activePageTemplates]);

  const form = useForm({
    resolver: zodResolver(masterMenuSchema),
    defaultValues: {
      strParentMenuGUID: "none",
      strModuleGUID: "common",
      dblSeqNo: undefined,
      strName: "",
      strPath: "",
      strMenuPosition: "",
      strMapKey: "",
      bolHasSubMenu: false,
      strIconName: undefined,
      bolIsActive: true,
      bolSuperAdminAccess: false,
      strCategory: undefined,
      strPageTemplateGUID: undefined,
      bolIsSingleMenu: false,
    },
  });

  useEffect(() => {
    if (isEditMode && masterMenu) {
      const parentMenuGuid = masterMenu.strParentMenuGUID
        ? masterMenu.strParentMenuGUID.toLowerCase()
        : "none";
      const moduleGuid = masterMenu.strModuleGUID || "common";

      // Set critical fields first to trigger any dependent data loading
      form.setValue("strParentMenuGUID", parentMenuGuid);
      form.setValue("strModuleGUID", moduleGuid);

      // Use setTimeout to ensure dependent data is loaded before setting all values
      setTimeout(() => {
        form.reset({
          strParentMenuGUID: parentMenuGuid,
          strModuleGUID: moduleGuid,
          dblSeqNo: masterMenu.dblSeqNo,
          strName: masterMenu.strName,
          strPath: masterMenu.strPath,
          strMenuPosition: masterMenu.strMenuPosition,
          strMapKey: masterMenu.strMapKey,
          bolHasSubMenu: masterMenu.bolHasSubMenu,
          strIconName: masterMenu.strIconName || undefined,
          bolIsActive: masterMenu.bolIsActive,
          bolSuperAdminAccess: masterMenu.bolSuperAdminAccess,
          strCategory: masterMenu.strCategory || undefined,
          strPageTemplateGUID: masterMenu.strPageTemplateGUID || undefined,
          bolIsSingleMenu: masterMenu.bolIsSingleMenu,
        });
      }, 100);
    }
  }, [form, masterMenu, isEditMode]);

  const onSubmit = (data: MasterMenuFormValues) => {
    const masterMenuData: MasterMenuCreate | MasterMenuUpdate = {
      strParentMenuGUID:
        data.strParentMenuGUID === "none" ? "" : data.strParentMenuGUID,
      strModuleGUID: data.strModuleGUID === "common" ? "" : data.strModuleGUID,
      dblSeqNo: data.dblSeqNo,
      strName: data.strName,
      strPath: data.strPath,
      strMenuPosition: data.strMenuPosition,
      strMapKey: data.strMapKey,
      bolHasSubMenu: data.bolHasSubMenu,
      strIconName: data.strIconName || undefined,
      bolIsActive: data.bolIsActive,
      bolSuperAdminAccess: data.bolSuperAdminAccess,
      strCategory: data.strCategory || undefined,
      strPageTemplateGUID: data.strPageTemplateGUID || undefined,
      bolIsSingleMenu: data.bolIsSingleMenu,
    };

    const successHandler = () => navigate("/master-menu");

    if (isEditMode && id) {
      updateMasterMenuMutate(
        { id, data: masterMenuData },
        {
          onSuccess: successHandler,
        }
      );
    } else {
      createMasterMenuMutate(masterMenuData, {
        onSuccess: successHandler,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!id) return;

    deleteMasterMenuMutate(id, {
      onSuccess: () => {
        navigate("/master-menu");
        setShowDeleteConfirm(false);
      },
    });
  };

  const isDropdownDataLoading =
    loadingParentMenus || loadingModules || loadingPageTemplates;

  const isLoading = isLoadingMasterMenu || isDropdownDataLoading;
  const isFormDisabled = isLoading;

  if ((isEditMode && isLoading) || isDropdownDataLoading) {
    return (
      <CustomContainer>
        <PageHeader
          title={isEditMode ? "Edit Master Menu" : "New Master Menu"}
          icon={AlignLeft}
          description={
            isEditMode
              ? "Update an existing master menu"
              : "Create a new master menu"
          }
          actions={
            <Button variant="outline" onClick={() => navigate("/master-menu")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          }
        />
        <MasterMenuFormSkeleton />
      </CustomContainer>
    );
  }

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Master Menu" : "New Master Menu"}
        icon={AlignLeft}
        description={
          isEditMode
            ? "Update an existing master menu"
            : "Create a new master menu"
        }
        actions={
          <Button variant="outline" onClick={() => navigate("/master-menu")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card mt-4 mb-6 hover:border-muted-foreground/20 transition-all duration-200">
            <CardContent className="p-8">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Basic Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="strModuleGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 font-medium">
                            Module
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              options={moduleOptions}
                              selectedValue={field.value || "common"}
                              onChange={field.onChange}
                              placeholder={
                                loadingModules
                                  ? "Loading modules..."
                                  : "Select a module"
                              }
                              isLoading={loadingModules}
                              disabled={isFormDisabled || loadingModules}
                              clearable={false}
                              initialMessage="Type to filter modules"
                              queryKey={["modules", "active", ""]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 font-medium">
                            Menu Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter menu name"
                              disabled={isFormDisabled}
                              className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Menu Structure
                  </h3>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="strParentMenuGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 font-medium">
                            Parent Menu
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              options={parentMenuOptions}
                              selectedValue={field.value || "none"}
                              onChange={field.onChange}
                              placeholder={
                                loadingParentMenus
                                  ? "Loading parent menus..."
                                  : "Select a parent menu"
                              }
                              isLoading={loadingParentMenus}
                              disabled={isFormDisabled || loadingParentMenus}
                              clearable={false}
                              initialMessage="Type to filter parent menus"
                              queryKey={[
                                "masterMenus",
                                "parent",
                                masterMenuIdForParentQuery,
                                "",
                              ]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dblSeqNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 font-medium">
                            Sequence Number{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="Enter sequence number"
                              value={
                                field.value === undefined ||
                                field.value === null
                                  ? ""
                                  : String(field.value)
                              }
                              onChange={(e) => {
                                // Handle empty string specifically
                                const value = e.target.value;
                                if (value === "") {
                                  field.onChange(undefined); // Pass undefined to trigger required validation
                                } else {
                                  const numValue = Number(value);
                                  field.onChange(
                                    isNaN(numValue) ? undefined : numValue
                                  );
                                }
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              disabled={isFormDisabled}
                              className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 font-medium">
                            Category
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter category"
                              {...field}
                              value={field.value || ""}
                              disabled={isFormDisabled}
                              className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strPageTemplateGUID"
                      render={({ field }) => {
                        // PreloadedSelect will handle the selected template display

                        return (
                          <FormItem>
                            <FormLabel className="mb-2 font-medium">
                              Page Template
                            </FormLabel>
                            <FormControl>
                              <PreloadedSelect
                                selectedValue={field.value}
                                onChange={field.onChange}
                                options={pageTemplateOptions}
                                placeholder="Select a page template"
                                disabled={isFormDisabled}
                                isLoading={loadingPageTemplates}
                                initialMessage="Select from available page templates"
                                queryKey={["pageTemplates", "active"]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="bolHasSubMenu"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isFormDisabled}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Has Submenu
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Navigation Settings
                  </h3>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField
                      control={form.control}
                      name="strPath"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 font-medium">
                            Path <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter path"
                              disabled={isFormDisabled}
                              className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strMenuPosition"
                      render={({ field }) => {
                        // Map position values to display names
                        const positionDisplayNames = {
                          sidebar: "Sidebar",
                          userbar: "Userbar",
                          hidden: "Hidden",
                        };

                        return (
                          <FormItem>
                            <FormLabel className="mb-2 font-medium">
                              Menu Position{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isFormDisabled}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select menu position">
                                    {field.value
                                      ? positionDisplayNames[
                                          field.value as keyof typeof positionDisplayNames
                                        ]
                                      : "Select menu position"}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-w-50 overflow-y-auto">
                                <SelectItem value="sidebar">Sidebar</SelectItem>
                                <SelectItem value="userbar">Userbar</SelectItem>
                                <SelectItem value="hidden">Hidden</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="strMapKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 font-medium">
                            Map Key <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter map key"
                              disabled={isFormDisabled}
                              className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strIconName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 font-medium">
                            Icon Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter icon name (optional)"
                              value={field.value || ""}
                              disabled={isFormDisabled}
                              className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Access Control
                  </h3>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex flex-col space-y-4">
                      <FormField
                        control={form.control}
                        name="bolIsActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isFormDisabled}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Active
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bolSuperAdminAccess"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isFormDisabled}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Super Admin Only Access
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bolIsSingleMenu"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isFormDisabled}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Is Single Menu
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 bg-muted/20">
              <div className="flex w-full justify-between">
                <div>
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={
                        isDeleting || isUpdating || isCreating || isLoading
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/master-menu")}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isUpdating || isCreating || isFormDisabled}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 shadow-sm transition-all duration-150"
                  >
                    {isUpdating || isCreating ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {isEditMode ? "Update" : "Create"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        title="Delete Master Menu"
        description="Are you sure you want to delete this master menu? This action cannot be undone."
        isLoading={isDeleting}
        confirmLabel="Delete"
      />
    </CustomContainer>
  );
};

export default MasterMenuForm;
