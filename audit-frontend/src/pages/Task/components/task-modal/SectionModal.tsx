import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Trash2, Edit } from "lucide-react";

import {
  useCreateBoardSection,
  useUpdateBoardSection,
  useDeleteBoardSection,
  useBoardSections,
} from "@/hooks/api/task/use-board-sections";
import { useCanEdit, useCanSave } from "@/lib/permissions";
import { ModuleBase } from "@/lib/permissions";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { DEFAULT_SECTION_COLOR_OPTIONS } from "@/constants/Task/task";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select/select";
import type {
  BoardSection,
  BoardSectionParams,
} from "@/types/task/board-section";

const DEFAULT_COLOR = "#3b82f6";
const COLOR_LABEL_MAP = Object.fromEntries(
  DEFAULT_SECTION_COLOR_OPTIONS.map(({ value, label }) => [value, label])
);

const sectionFormSchema = z.object({
  strName: z.string().min(1, "Module name is required"),
  strColor: z.string().optional().nullable(),
});

type SectionFormValues = z.infer<typeof sectionFormSchema>;

interface SectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardGUID: string;
  onSuccess?: () => void;
}

export const SectionModal: React.FC<SectionModalProps> = ({
  open,
  onOpenChange,
  boardGUID,
  onSuccess,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLOR);

  // Check user permissions
  const canEdit = useCanEdit(ModuleBase.BOARD);
  const canSave = useCanSave(ModuleBase.BOARD);

  useEffect(() => {
    if (open && !canEdit && !canSave) {
      toast.error("You don't have permission to access this module");
      onOpenChange(false);
    }
  }, [open, canEdit, canSave, onOpenChange]);

  const {
    data: sectionsResponse,
    isLoading,
    refetch,
  } = useBoardSections(
    open && boardGUID
      ? {
          strBoardGUID: boardGUID,
        }
      : ({} as BoardSectionParams),
    open && !!boardGUID
  );

  const sections = useMemo(() => {
    const allSections = sectionsResponse?.data || [];
    if (!searchTerm) return allSections;
    return allSections.filter((section) =>
      section.strName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sectionsResponse, searchTerm]);

  const { mutate: createSection, isPending: isCreating } =
    useCreateBoardSection();
  const { mutate: updateSection, isPending: isUpdating } =
    useUpdateBoardSection();
  const { mutate: deleteSection, isPending: isDeleting } =
    useDeleteBoardSection();

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      strName: "",
      strColor: DEFAULT_COLOR,
    },
  });

  const isSubmitting = isCreating || isUpdating;

  const handleEdit = useCallback(
    (section: BoardSection) => {
      setEditingId(section.strBoardSectionGUID);
      form.setValue("strName", section.strName);
      form.setValue("strColor", section.strColor || "");
      setSelectedColor(section.strColor || DEFAULT_COLOR);
    },
    [form]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setSelectedColor(DEFAULT_COLOR);
    form.reset();
  }, [form]);

  const handleColorChange = useCallback(
    (color: string) => {
      setSelectedColor(color);
      form.setValue("strColor", color);
    },
    [form]
  );

  const onSubmit = (data: SectionFormValues) => {
    if (!boardGUID) {
      toast.error("Project not selected");
      return;
    }

    if (editingId) {
      updateSection(
        {
          id: editingId,
          data: {
            strName: data.strName,
            strColor: selectedColor,
            intPosition:
              sections.find((s) => s.strBoardSectionGUID === editingId)
                ?.intPosition || 0,
          },
        },
        {
          onSuccess: () => {
            form.reset();
            setEditingId(null);
            setSelectedColor(DEFAULT_COLOR);
            refetch();
            onSuccess?.();
          },
        }
      );
    } else {
      createSection(
        {
          strBoardGUID: boardGUID,
          strName: data.strName,
          strColor: selectedColor,
        },
        {
          onSuccess: () => {
            form.reset();
            setSelectedColor(DEFAULT_COLOR);
            refetch();
            onSuccess?.();
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;

    deleteSection(
      { id: deleteConfirmId },
      {
        onSuccess: () => {
          setDeleteConfirmId(null);
          handleCancelEdit();
          refetch();
          onSuccess?.();
        },
      }
    );
  };

  const columns = useMemo<DataTableColumn<BoardSection>[]>(() => {
    const baseColumns: DataTableColumn<BoardSection>[] = [];

    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (section) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(section)}
            disabled={isSubmitting || !canEdit}
            title={!canEdit ? "You don't have edit permission" : "Edit section"}
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      ),
    });

    baseColumns.push({
      key: "color",
      header: "Color",
      width: "160px",
      cell: (section) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-border-color/60"
            style={{ backgroundColor: section.strColor || DEFAULT_COLOR }}
          />
          <span className="text-sm text-muted-foreground">
            {COLOR_LABEL_MAP[section.strColor || ""] || "Custom"}
          </span>
        </div>
      ),
    });

    baseColumns.push({
      key: "name",
      header: "Module Name",
      width: "250px",
      cell: (section) => <div className="font-medium">{section.strName}</div>,
    });

    return baseColumns;
  }, [isSubmitting, handleEdit, canEdit]);

  return (
    <>
      <ModalDialog
        open={open}
        className="bg-card"
        onOpenChange={onOpenChange}
        title={editingId ? "Edit Module" : "Create Module"}
        description={
          editingId
            ? "Update the module details below"
            : "Add a new module to your project"
        }
        maxWidth="900px"
        fullHeight={false}
        showCloseButton={true}
      >
        <div className="flex flex-col h-130 px-4 sm:px-6 space-y-4 overflow-hidden">
          <div className="shrink-0 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1 sm:max-w-75">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Module Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.watch("strName")}
                  onChange={(e) => form.setValue("strName", e.target.value)}
                  placeholder="Enter module name"
                  disabled={isSubmitting}
                  className="mt-2"
                />
                {form.formState.errors.strName && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {form.formState.errors.strName.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:w-56">
                <label className="text-sm font-medium leading-none">
                  Color
                </label>
                <Select
                  value={selectedColor}
                  onValueChange={handleColorChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded border border-border-color/60"
                        style={{
                          backgroundColor: selectedColor || DEFAULT_COLOR,
                        }}
                      />
                      <span className="text-sm">
                        {COLOR_LABEL_MAP[selectedColor] || "Select a color"}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_SECTION_COLOR_OPTIONS.map(({ value, label }) => (
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
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              {editingId && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteConfirmId(editingId)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <div
                className={`flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto ${!editingId ? "sm:ml-auto" : ""}`}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (editingId) {
                      handleCancelEdit();
                    } else {
                      onOpenChange(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting || (editingId ? !canEdit : !canSave)}
                  className="w-full sm:w-auto"
                  title={
                    editingId
                      ? !canEdit
                        ? "You don't have edit permission"
                        : undefined
                      : !canSave
                        ? "You don't have save permission"
                        : undefined
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Search Section */}
          <div className="shrink-0 flex gap-2 items-center">
            <Input
              placeholder="Search sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Table Section with controlled height */}
          <div className="flex-1 min-h-0 rounded-lg">
            <DataTable
              data={sections}
              columns={columns}
              keyExtractor={(section) =>
                section.strBoardSectionGUID || Math.random().toString()
              }
              maxHeight="220px"
              loading={isLoading}
              emptyState={<>No modules found.</>}
            />
          </div>
        </div>
      </ModalDialog>

      <DeleteConfirmationDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Module"
        description="Are you sure you want to delete this module? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
};
