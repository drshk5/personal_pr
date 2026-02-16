import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { Unit } from "@/types/Account/unit";

import {
  useCreateUnit,
  useDeleteUnit,
  useUnits,
  useUpdateUnit,
} from "@/hooks/api/Account/use-units";

import { FormModules, useCanEdit, useCanSave } from "@/lib/permissions";

import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Input } from "@/components/ui/input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Switch } from "@/components/ui/switch";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { Separator } from "@/components/ui/separator";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import { useTableLayout } from "@/hooks/common";

const unitFormSchema = z.object({
  strUnitName: z.string().min(1, "Unit name is required"),
  bolIsActive: z.boolean(),
});

type UnitFormValues = z.infer<typeof unitFormSchema>;

interface UnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skipPermissionCheck?: boolean;
}

export const UnitModal: React.FC<UnitModalProps> = ({
  open,
  onOpenChange,
  skipPermissionCheck = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  const canEdit = useCanEdit(FormModules.UNIT);
  const canSave = useCanSave(FormModules.UNIT);

  const defaultColumnOrder = useMemo(() => ["actions", "name", "status"], []);

  const { columnWidths, setColumnWidths } = useTableLayout(
    "unitModal",
    defaultColumnOrder,
    []
  );

  useEffect(() => {
    if (!skipPermissionCheck && open && !canEdit && !canSave) {
      toast.error("You don't have permission to access this module");
      onOpenChange(false);
    }
  }, [open, canEdit, canSave, onOpenChange, skipPermissionCheck]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: unitsResponse, isLoading } = useUnits(
    {
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      search: debouncedSearch || undefined,
    },
    open
  );

  const units = unitsResponse?.data || [];

  const { mutate: createUnit, isPending: isCreating } = useCreateUnit();
  const { mutate: updateUnit, isPending: isUpdating } = useUpdateUnit();
  const { mutate: deleteUnit, isPending: isDeleting } = useDeleteUnit();

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      strUnitName: "",
      bolIsActive: true,
    },
  });

  const isSubmitting = isCreating || isUpdating;

  const handleEdit = useCallback(
    (unit: Unit) => {
      setEditingId(unit.strUnitGUID);
      form.setValue("strUnitName", unit.strUnitName);
      form.setValue("bolIsActive", unit.bolIsActive);
    },
    [form]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    form.reset();
  }, [form]);

  useEffect(() => {
    if (unitsResponse) {
      setPagination({
        pageNumber: unitsResponse.pageNumber,
        pageSize: unitsResponse.pageSize,
        totalCount: unitsResponse.totalRecords,
        totalPages: unitsResponse.totalPages,
      });
    }
  }, [unitsResponse]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageNumber: 1,
    }));
  }, [debouncedSearch]);

  const goToPage = (pageNumber: number) => {
    setPagination((prev) => ({
      ...prev,
      pageNumber,
    }));
  };

  const changePageSize = (pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageNumber: 1,
      pageSize,
      totalPages:
        prev.totalCount > 0
          ? Math.ceil(prev.totalCount / pageSize)
          : prev.totalPages,
    }));
  };

  const columns = useMemo<DataTableColumn<Unit>[]>(() => {
    const baseColumns: DataTableColumn<Unit>[] = [];

    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (unit) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(unit)}
            disabled={isSubmitting || !canEdit}
            title={!canEdit ? "You don't have edit permission" : "Edit unit"}
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      ),
    });

    baseColumns.push({
      key: "name",
      header: "Unit Name",
      width: "250px",
      cell: (unit) => <div className="font-medium">{unit.strUnitName}</div>,
    });

    baseColumns.push({
      key: "status",
      header: "Status",
      width: "120px",
      cell: (unit) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            unit.bolIsActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {unit.bolIsActive ? "Active" : "Inactive"}
        </span>
      ),
    });

    return baseColumns;
  }, [isSubmitting, handleEdit, canEdit]);

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((col) => [col.key, col]));
    return defaultColumnOrder
      .map((key: string) => columnMap.get(key))
      .filter((col: DataTableColumn<Unit> | undefined): col is DataTableColumn<Unit> => col !== undefined);
  }, [columns, defaultColumnOrder]);

  const onSubmit = (data: UnitFormValues) => {
    if (editingId) {
      updateUnit(
        {
          id: editingId,
          data: {
            strUnitName: data.strUnitName,
            bolIsActive: data.bolIsActive,
          },
        },
        {
          onSuccess: () => {
            form.reset();
            setEditingId(null);
          },
        }
      );
    } else {
      createUnit(
        {
          strUnitName: data.strUnitName,
          bolIsActive: data.bolIsActive,
        },
        {
          onSuccess: () => {
            form.reset();
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;

    deleteUnit(
      { id: deleteConfirmId },
      {
        onSuccess: () => {
          setDeleteConfirmId(null);
        },
      }
    );
  };

  return (
    <>
      <ModalDialog
        open={open}
        className="bg-card"
        onOpenChange={onOpenChange}
        title={editingId ? "Edit Unit" : "Create Unit"}
        description={
          editingId
            ? "Update the unit details below"
            : "Add a new measurement unit"
        }
        maxWidth="900px"
        fullHeight={false}
        showCloseButton={true}
      >
        <div className="flex flex-col h-130 px-4 sm:px-6 space-y-4 overflow-hidden">
          <div className="shrink-0 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1 sm:max-w-100">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Unit Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.watch("strUnitName")}
                  onChange={(e) => form.setValue("strUnitName", e.target.value)}
                  placeholder="Enter unit name (e.g., kg, liters, pieces)"
                  disabled={isSubmitting}
                  className="mt-2"
                />
                {form.formState.errors.strUnitName && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {form.formState.errors.strUnitName.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pb-0 sm:pb-2">
                <label className="text-sm font-medium leading-none">
                  Active
                </label>
                <Switch
                  checked={form.watch("bolIsActive")}
                  onCheckedChange={(checked) =>
                    form.setValue("bolIsActive", checked)
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 sm:flex-row">
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
                className={`flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row ${
                  !editingId ? "sm:ml-auto" : ""
                }`}
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
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Table Section with controlled height */}
          <div className="flex-1 min-h-0 rounded-lg">
            {isLoading ? (
              <TableSkeleton
                columns={orderedColumns.map((column) => ({
                  header: String(column.header),
                  width: column.width,
                }))}
                pageSize={pagination.pageSize}
              />
            ) : (
              <DataTable
                data={units}
                columns={orderedColumns}
                keyExtractor={(unit) =>
                  unit.strUnitGUID || Math.random().toString()
                }
                maxHeight="220px"
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                emptyState={<>No units found.</>}
                pagination={{
                  pageNumber: pagination.pageNumber,
                  pageSize: pagination.pageSize,
                  totalCount: pagination.totalCount || 0,
                  totalPages: pagination.totalPages || 0,
                  onPageChange: goToPage,
                  onPageSizeChange: changePageSize,
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            )}
          </div>
        </div>
      </ModalDialog>

      <DeleteConfirmationDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Unit"
        description="Are you sure you want to delete this unit? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
};
