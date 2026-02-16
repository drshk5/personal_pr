import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LayoutGrid, Save, Trash2 } from "lucide-react";
import type { z } from "zod";

import {
  useBoardSection,
  useBoardSectionHighestTaskPosition,
  useCreateBoardSection,
  useBulkCreateBoardSections,
  useUpdateBoardSection,
  useDeleteBoardSection,
} from "@/hooks/api/task/use-board-sections";
import { useActiveBoards } from "@/hooks/api/task/use-board";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";

import { Actions, FormModules } from "@/lib/permissions";

import type { BoardSectionCreate, BoardSectionUpdate } from "@/types";
import { createBoardSectionSchema } from "@/validations/task/board-section";
import { DEFAULT_SECTION_COLOR_OPTIONS } from "@/constants/Task/task";

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
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select/select";
import CustomContainer from "@/components/layout/custom-container";
import NotFound from "@/components/error-boundaries/entity-not-found";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
import { BoardModuleFormSkeleton } from "./BoardModuleFormSkeleton";

const DEFAULT_COLOR = DEFAULT_SECTION_COLOR_OPTIONS[0]?.value ?? "#3b82f6";
const COLOR_LABEL_MAP = Object.fromEntries(
  DEFAULT_SECTION_COLOR_OPTIONS.map(({ value, label }) => [value, label])
);

type BoardModuleFormValues = z.input<typeof createBoardSectionSchema>;

const BoardModuleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = React.useState(false);

  const HeaderIcon = useMenuIcon(FormModules.BOARD_MODULE, LayoutGrid);
  const isEditMode = !!id && id !== "new";

  const { data: boardsResponse, isLoading: isLoadingBoards } = useActiveBoards(
    undefined,
    { enabled: boardDropdownOpen || isEditMode }
  );

  const {
    data: sectionData,
    isLoading: isLoadingSection,
    error: sectionError,
  } = useBoardSection(isEditMode && id ? id : undefined);

  const { mutate: createSection, isPending: isCreating } =
    useCreateBoardSection();
  const { mutate: bulkCreateSections, isPending: isBulkCreating } =
    useBulkCreateBoardSections();
  const { mutate: updateSection, isPending: isUpdating } =
    useUpdateBoardSection();
  const { mutate: deleteSection, isPending: isDeleting } =
    useDeleteBoardSection();

  const form = useForm<BoardModuleFormValues>({
    resolver: zodResolver(createBoardSectionSchema),
    defaultValues: {
      strBoardGUID: "",
      strName: "",
      strColor: DEFAULT_COLOR,
      intPosition: 0,
    },
  });

  const selectedBoardGuid = form.watch("strBoardGUID");

  const { data: highestTaskPositionSection } = useBoardSectionHighestTaskPosition(
    selectedBoardGuid,
    !isEditMode && !!selectedBoardGuid
  );

  const isLoading = isLoadingSection;
  const isSaving = isCreating || isBulkCreating || isUpdating;

  const getCsvNames = (value: string) =>
    value
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

  React.useEffect(() => {
    if (sectionData && isEditMode && id) {
      form.setValue("strBoardGUID", sectionData.strBoardGUID);
      form.setValue("strName", sectionData.strName);
      form.setValue("strColor", sectionData.strColor || DEFAULT_COLOR);
      form.setValue("intPosition", sectionData.intPosition ?? 0);
    }
  }, [sectionData, form, isEditMode, id]);

  React.useEffect(() => {
    if (isEditMode || !selectedBoardGuid) return;
    if (form.formState.dirtyFields.intPosition) return;

    const basePosition =
      typeof highestTaskPositionSection?.intTaskViewPosition === "number"
        ? highestTaskPositionSection.intTaskViewPosition
        : typeof highestTaskPositionSection?.intPosition === "number"
          ? highestTaskPositionSection.intPosition
          : 0;

    const nextPosition = basePosition + 1;

    form.setValue("intPosition", nextPosition);
  }, [
    form,
    isEditMode,
    selectedBoardGuid,
    highestTaskPositionSection,
  ]);

  const handleDelete = () => {
    if (!id) return;

    deleteSection(
      { id },
      {
        onSuccess: () => {
          navigate("/module");
        },
        onSettled: () => {
          setShowDeleteConfirm(false);
        },
      }
    );
  };

  const onSubmit = (data: BoardModuleFormValues) => {
    if (isEditMode && id) {
      const updateData: BoardSectionUpdate = {
        strName: data.strName,
        strColor: data.strColor || null,
        intPosition: data.intPosition ?? 0,
      };

      updateSection(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/module");
          },
        }
      );
    } else {
      const csvNames = getCsvNames(data.strName);
      if (csvNames.length > 1) {
        bulkCreateSections(
          {
            strBoardGUID: data.strBoardGUID,
            strSectionNames: csvNames.join(", "),
          },
          {
            onSuccess: () => {
              navigate("/module");
            },
          }
        );
        return;
      }

      const createData: BoardSectionCreate = {
        strBoardGUID: data.strBoardGUID,
        strName: csvNames[0] || data.strName.trim(),
        strColor: data.strColor || null,
        intPosition: data.intPosition ?? 0,
      };

      createSection(createData, {
        onSuccess: () => {
          navigate("/module");
        },
      });
    }
  };

  if (
    isEditMode &&
    !isLoadingSection &&
    (sectionError || (!sectionData && !isLoadingSection))
  ) {
    return <NotFound pageName="Module" />;
  }

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Module" : "Create New Module"}
        description={
          isEditMode
            ? "Update module details"
            : "Create a new module"
        }
        icon={HeaderIcon}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/module")}
            className="h-9 text-xs sm:text-sm"
            size="sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="grid gap-4">
        {isLoading ? (
          <BoardModuleFormSkeleton />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              options={
                                boardsResponse?.map((board) => ({
                                  value: board.strBoardGUID,
                                  label: board.strName,
                                })) || []
                              }
                              selectedValue={field.value}
                              onChange={field.onChange}
                              onOpenChange={setBoardDropdownOpen}
                              placeholder="Select a project"
                              isLoading={isLoadingBoards}
                              disabled={isEditMode}
                              clearable={false}
                              queryKey={["boards", "active"]}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground invisible">
                            Placeholder
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Module Name(s) <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter module name"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Use commas to create multiple modules at once.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="strColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Module Color</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-4 w-4 rounded border border-border-color/60"
                                    style={{
                                      backgroundColor: field.value || DEFAULT_COLOR,
                                    }}
                                  />
                                  <span className="text-sm">
                                    {COLOR_LABEL_MAP[field.value || ""] ||
                                      "Select a color"}
                                  </span>
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {DEFAULT_SECTION_COLOR_OPTIONS.map(
                                  ({ value, label }) => (
                                    <SelectItem
                                      key={value}
                                      value={value}
                                      textValue={label}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="h-4 w-4 rounded border border-border-color/60"
                                          style={{ backgroundColor: value }}
                                        />
                                        <span className="flex-1">{label}</span>
                                      </div>
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="intPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              step={1}
                              {...field}
                              value={field.value ?? 0}
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                field.onChange(Number.isNaN(value) ? 0 : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Form>
            </CardContent>

            <CardFooter className="px-6 py-4">
              <div className="flex items-center justify-between w-full">
                <div>
                  {isEditMode && (
                    <WithPermission
                      module={FormModules.BOARD_MODULE}
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
                    module={FormModules.BOARD_MODULE}
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
        title="Delete Board Module"
        description="Are you sure you want to delete this board module? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default BoardModuleForm;
