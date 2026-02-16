import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Trash2, Edit } from "lucide-react";

import {
  useDesignations,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
} from "@/hooks/api/central/use-designations";
import { useCanEdit, useCanSave } from "@/lib/permissions";
import { useTableLayout } from "@/hooks/common";
import { ModuleBase } from "@/lib/permissions";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import type { Designation } from "@/types/central/designation";

const designationFormSchema = z.object({
  strName: z.string().min(1, "Designation name is required"),
  bolIsActive: z.boolean(),
});

type DesignationFormValues = z.infer<typeof designationFormSchema>;

interface DesignationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DesignationModal: React.FC<DesignationModalProps> = ({
  open,
  onOpenChange,
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

  const defaultColumnOrder = useMemo(() => ["actions", "name", "status"], []);

  // Check user permissions
  const canEdit = useCanEdit(ModuleBase.DESIGNATION);
  const canSave = useCanSave(ModuleBase.DESIGNATION);

  const { columnWidths, setColumnWidths } = useTableLayout(
    "designationModal",
    defaultColumnOrder,
    []
  );

  // Prevent modal from opening if user has neither save nor edit rights
  useEffect(() => {
    if (open && !canEdit && !canSave) {
      toast.error("You don't have permission to access this module");
      onOpenChange(false);
    }
  }, [open, canEdit, canSave, onOpenChange]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Use server-side pagination
  const { data: designationsResponse, isLoading } = useDesignations(
    {
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      search: debouncedSearch || undefined,
    },
    open
  );

  const designations = designationsResponse?.data?.items || [];

  const { mutate: createDesignation, isPending: isCreating } =
    useCreateDesignation();
  const { mutate: updateDesignation, isPending: isUpdating } =
    useUpdateDesignation();
  const { mutate: deleteDesignation, isPending: isDeleting } =
    useDeleteDesignation();

  const form = useForm<DesignationFormValues>({
    resolver: zodResolver(designationFormSchema),
    defaultValues: {
      strName: "",
      bolIsActive: true,
    },
  });

  const isSubmitting = isCreating || isUpdating;

  const handleEdit = useCallback(
    (designation: {
      strDesignationGUID: string;
      strName: string;
      bolIsActive: boolean;
    }) => {
      setEditingId(designation.strDesignationGUID);
      form.setValue("strName", designation.strName);
      form.setValue("bolIsActive", designation.bolIsActive);
    },
    [form]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    form.reset();
  }, [form]);

  // Update pagination state from server response
  useEffect(() => {
    if (designationsResponse?.data) {
      setPagination({
        pageNumber: designationsResponse.data.pageNumber,
        pageSize: designationsResponse.data.pageSize,
        totalCount: designationsResponse.data.totalCount,
        totalPages: designationsResponse.data.totalPages,
      });
    }
  }, [designationsResponse]);

  // Reset to page 1 when search term or items per page changes
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
    setPagination({
      pageNumber: 1,
      pageSize,
      totalCount: pagination.totalCount,
      totalPages: Math.ceil(pagination.totalCount / pageSize),
    });
  };

  const columns = useMemo<DataTableColumn<Designation>[]>(() => {
    const baseColumns: DataTableColumn<Designation>[] = [];

    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (designation) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(designation)}
            disabled={isSubmitting || !canEdit}
            title={
              !canEdit ? "You don't have edit permission" : "Edit designation"
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
      header: "Designation Name",
      width: "250px",
      cell: (designation) => (
        <div className="font-medium">{designation.strName}</div>
      ),
    });

    baseColumns.push({
      key: "status",
      header: "Status",
      width: "120px",
      cell: (designation) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            designation.bolIsActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {designation.bolIsActive ? "Active" : "Inactive"}
        </span>
      ),
    });

    return baseColumns;
  }, [isSubmitting, handleEdit, canEdit]);

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((col) => [col.key, col]));
    return defaultColumnOrder
      .map((key: string) => columnMap.get(key))
      .filter(
        (
          col: DataTableColumn<Designation> | undefined
        ): col is DataTableColumn<Designation> => col !== undefined
      );
  }, [columns, defaultColumnOrder]);

  const onSubmit = (data: DesignationFormValues) => {
    if (editingId) {
      updateDesignation(
        {
          guid: editingId,
          data: {
            strName: data.strName,
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
      createDesignation(
        {
          strName: data.strName,
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

    deleteDesignation(deleteConfirmId, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        toast.success("Designation deleted successfully");
      },
    });
  };

  return (
    <>
      <ModalDialog
        open={open}
        className="bg-card"
        onOpenChange={onOpenChange}
        title={editingId ? "Edit Designation" : "Create Designation"}
        description={
          editingId
            ? "Update the designation details below"
            : "Add a new designation to your organization"
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
                  Designation Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.watch("strName")}
                  onChange={(e) => form.setValue("strName", e.target.value)}
                  placeholder="Enter designation name"
                  disabled={isSubmitting}
                  className="mt-2"
                />
                {form.formState.errors.strName && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {form.formState.errors.strName.message}
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
              placeholder="Search designations..."
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
                data={designations}
                columns={orderedColumns}
                keyExtractor={(designation) =>
                  designation.strDesignationGUID || Math.random().toString()
                }
                maxHeight="220px"
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                emptyState={<>No designations found.</>}
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
        title="Delete Designation"
        description="Are you sure you want to delete this designation? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
};
