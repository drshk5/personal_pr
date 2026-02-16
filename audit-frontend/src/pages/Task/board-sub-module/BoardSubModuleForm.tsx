import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Trash2, Layers } from "lucide-react";

import {
  useBoardSubModule,
  useCreateBoardSubModule,
  useBulkCreateBoardSubModules,
  useUpdateBoardSubModule,
  useDeleteBoardSubModule,
} from "@/hooks/api/task/use-board-sub-module";
import { useBoardSectionsByBoardGuid } from "@/hooks/api/task/use-board-sections";
import { useActiveBoards } from "@/hooks/api/task/use-board";

import { Actions, FormModules } from "@/lib/permissions";

import {
  createBoardSubModuleSchema,
  type CreateBoardSubModuleFormValues,
} from "@/validations/task/board-sub-module";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import CustomContainer from "@/components/layout/custom-container";
import NotFound from "@/components/error-boundaries/entity-not-found";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
import { BoardSubModuleFormSkeleton } from "./BoardSubModuleFormSkeleton";

const BoardSubModuleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = React.useState(false);

  const isEditMode = !!id && id !== "new";
  const boardGuid = searchParams.get("boardGuid") || "";
  const sectionGuid = searchParams.get("sectionGuid") || "";

  const { data: subModuleData, isLoading, error } = useBoardSubModule(
    isEditMode && id ? id : undefined
  );


  const { mutate: createSubModule, isPending: isCreating } =
    useCreateBoardSubModule();
  const { mutate: bulkCreateSubModules, isPending: isBulkCreating } =
    useBulkCreateBoardSubModules();
  const { mutate: updateSubModule, isPending: isUpdating } =
    useUpdateBoardSubModule();
  const { mutate: deleteSubModule, isPending: isDeleting } =
    useDeleteBoardSubModule();

  const form = useForm<CreateBoardSubModuleFormValues>({
    resolver: zodResolver(createBoardSubModuleSchema),
    defaultValues: {
      strBoardGUID: boardGuid,
      strBoardSectionGUID: sectionGuid,
      strName: "",
      bolIsActive: true,
    },
  });

  const selectedBoardGuid = form.watch("strBoardGUID") || boardGuid;

  const getListUrl = () => {
    return `/sub-module`;
  };

  const { data: boards = [], isLoading: isLoadingBoards } = useActiveBoards(
    undefined,
    { enabled: boardDropdownOpen || !!selectedBoardGuid }
  );

  const { data: sectionsResponse } = useBoardSectionsByBoardGuid(
    selectedBoardGuid || undefined,
    undefined,
    !!selectedBoardGuid
  );

  const sections = sectionsResponse?.data || [];

  React.useEffect(() => {
    if (isEditMode && subModuleData) {
      form.reset({
        strBoardGUID: subModuleData.strBoardGUID,
        strBoardSectionGUID: subModuleData.strBoardSectionGUID,
        strName: subModuleData.strName,
        bolIsActive: subModuleData.bolIsActive,
      });
    }
  }, [isEditMode, subModuleData, form]);

  const isSaving = isCreating || isBulkCreating || isUpdating;

  const getCsvNames = (value: string) =>
    value
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

  const onSubmit = (data: CreateBoardSubModuleFormValues) => {
    if (isEditMode && id) {
      updateSubModule(
        {
          id,
          data: {
            strName: data.strName,
            bolIsActive: data.bolIsActive,
          },
        },
        {
          onSuccess: () => {
            navigate(getListUrl());
          },
        }
      );
      return;
    }

    const csvNames = getCsvNames(data.strName);
    if (csvNames.length > 1) {
      bulkCreateSubModules(
        {
          strBoardGUID: data.strBoardGUID,
          strBoardSectionGUID: data.strBoardSectionGUID,
          strSubModuleNames: csvNames.join(", "),
        },
        {
          onSuccess: () => {
            navigate(getListUrl());
          },
        }
      );
      return;
    }

    createSubModule(
      {
        ...data,
        strName: csvNames[0] || data.strName.trim(),
      },
      {
        onSuccess: () => {
          navigate(getListUrl());
        },
      }
    );
  };

  const handleDelete = () => {
    if (!id) return;
    deleteSubModule(
      { id },
      {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          navigate(getListUrl());
        },
      }
    );
  };

  if (isEditMode && error) {
    return <NotFound pageName="Sub module" />;
  }

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Sub Module" : "Create Sub Module"}
        description={
          isEditMode
            ? "Update the Sub Module details below."
            : "Fill in the details to create a new Sub Module."
        }
        icon={Layers}
        actions={
          <Button variant="outline" onClick={() => navigate(getListUrl())}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="grid gap-4">
        {isLoading ? (
          <BoardSubModuleFormSkeleton />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="strBoardGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Project <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              options={boards.map((board) => ({
                                value: board.strBoardGUID,
                                label: board.strName,
                              }))}
                              selectedValue={field.value}
                              onChange={(value) => {
                                field.onChange(value);
                                form.setValue("strBoardSectionGUID", "");
                              }}
                              placeholder="Select project"
                              isLoading={isLoadingBoards}
                              disabled={isSaving || isLoading || isEditMode}
                              onOpenChange={setBoardDropdownOpen}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strBoardSectionGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Module <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSaving || !selectedBoardGuid || isEditMode}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    selectedBoardGuid
                                      ? "Select module"
                                      : "Select project first"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {sections.map((section) => (
                                  <SelectItem
                                    key={section.strBoardSectionGUID}
                                    value={section.strBoardSectionGUID}
                                  >
                                    {section.strName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                          <FormLabel>
                            Sub Module Name(s)
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter sub module name"
                              disabled={isSaving || isLoading}
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Use commas to create multiple sub modules at once.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bolIsActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-3 ">
                          <FormLabel className="text-sm font-medium">Active</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSaving || isLoading}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Form>
            </CardContent>

            <CardFooter className="flex justify-between pt-2 pb-6 border-border-color px-6 py-4 bg-muted/20">
              <div className="flex items-center justify-between w-full">
                <div>
                  {isEditMode && (
                    <WithPermission
                      module={FormModules.SUB_MODULE_FORM}
                      action={Actions.DELETE}
                    >
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting || isSaving}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                    </WithPermission>
                  )}
                </div>
                <div className="flex gap-2">
                  <WithPermission
                    module={FormModules.SUB_MODULE_FORM}
                    action={isEditMode ? Actions.EDIT : Actions.SAVE}
                  >
                    <Button
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={isLoading || isSaving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving
                        ? isEditMode
                          ? "Updating..."
                          : "Creating..."
                        : isEditMode
                          ? "Update"
                          : "Create"}
                    </Button>
                  </WithPermission>
                </div>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Sub Module"
        description="Are you sure you want to delete this Sub Module? This action cannot be undone."
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default BoardSubModuleForm;
