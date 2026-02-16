import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Trash2, Edit } from "lucide-react";

import {
  useCreateBoardSubModule,
  useUpdateBoardSubModule,
  useDeleteBoardSubModule,
  useBoardSubModulesBySection,
} from "@/hooks/api/task/use-board-sub-module";
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
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import type { BoardSubModule } from "@/types/task/board-sub-module";

const subModuleFormSchema = z.object({
  strName: z.string().min(1, "Sub-module name is required"),
});

type SubModuleFormValues = z.infer<typeof subModuleFormSchema>;

interface SubModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionGUID: string;
  boardGUID: string;
  onSuccess?: () => void;
}

export const SubModuleModal: React.FC<SubModuleModalProps> = ({
  open,
  onOpenChange,
  sectionGUID,
  boardGUID,
  onSuccess,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

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
    data: subModulesResponse,
    isLoading,
    refetch,
  } = useBoardSubModulesBySection(
    sectionGUID,
    {
      strBoardSectionGUID: sectionGUID,
    },
    open && !!sectionGUID
  );

  const subModules = useMemo(() => {
    const allSubModules = subModulesResponse?.data || [];
    if (!searchTerm) return allSubModules;
    return allSubModules.filter((subModule) =>
      subModule.strName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subModulesResponse, searchTerm]);

  const { mutate: createSubModule, isPending: isCreating } =
    useCreateBoardSubModule();
  const { mutate: updateSubModule, isPending: isUpdating } =
    useUpdateBoardSubModule();
  const { mutate: deleteSubModule, isPending: isDeleting } =
    useDeleteBoardSubModule();

  const form = useForm<SubModuleFormValues>({
    resolver: zodResolver(subModuleFormSchema),
    defaultValues: {
      strName: "",
    },
  });

  const isSubmitting = isCreating || isUpdating;

  const handleEdit = useCallback(
    (subModule: BoardSubModule) => {
      setEditingId(subModule.strBoardSubModuleGUID);
      form.setValue("strName", subModule.strName);
    },
    [form]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    form.reset();
  }, [form]);

  const onSubmit = (data: SubModuleFormValues) => {
    if (!sectionGUID) {
      toast.error("Module not selected");
      return;
    }

    if (editingId) {
      updateSubModule(
        {
          id: editingId,
          data: {
            strName: data.strName,
            bolIsActive: true,
          },
        },
        {
          onSuccess: () => {
            form.reset();
            setEditingId(null);
            refetch();
            onSuccess?.();
          },
        }
      );
    } else {
      createSubModule(
        {
          strName: data.strName,
          strBoardGUID: boardGUID,
          strBoardSectionGUID: sectionGUID,
          bolIsActive: true,
        },
        {
          onSuccess: () => {
            form.reset();
            refetch();
            onSuccess?.();
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;

    deleteSubModule(
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

  const columns = useMemo<DataTableColumn<BoardSubModule>[]>(() => {
    const baseColumns: DataTableColumn<BoardSubModule>[] = [];

    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (subModule) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(subModule)}
            disabled={isSubmitting || !canEdit}
            title={
              !canEdit ? "You don't have edit permission" : "Edit sub-module"
            }
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      ),
    });

    baseColumns.push({
      key: "name",
      header: "Sub-Module Name",
      width: "250px",
      cell: (subModule) => (
        <div className="font-medium">{subModule.strName}</div>
      ),
    });

    return baseColumns;
  }, [isSubmitting, handleEdit, canEdit]);

  return (
    <>
      <ModalDialog
        open={open}
        className="bg-card"
        onOpenChange={onOpenChange}
        title={editingId ? "Edit Sub-Module" : "Create Sub-Module"}
        description={
          editingId
            ? "Update the sub-module details below"
            : "Add a new sub-module to your module"
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
                  Sub-Module Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.watch("strName")}
                  onChange={(e) => form.setValue("strName", e.target.value)}
                  placeholder="Enter sub-module name"
                  disabled={isSubmitting}
                  className="mt-2"
                />
                {form.formState.errors.strName && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {form.formState.errors.strName.message}
                  </p>
                )}
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
              placeholder="Search sub-modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Table Section with controlled height */}
          <div className="flex-1 min-h-0 rounded-lg">
            {isLoading ? (
              <TableSkeleton
                columns={columns.map((column) => ({
                  header: String(column.header),
                  width: column.width,
                }))}
                pageSize={5}
              />
            ) : (
              <DataTable
                data={subModules}
                columns={columns}
                keyExtractor={(subModule) =>
                  subModule.strBoardSubModuleGUID || Math.random().toString()
                }
                maxHeight="220px"
                emptyState={<>No sub-modules found.</>}
              />
            )}
          </div>
        </div>
      </ModalDialog>

      <DeleteConfirmationDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Sub-Module"
        description="Are you sure you want to delete this sub-module? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
};
