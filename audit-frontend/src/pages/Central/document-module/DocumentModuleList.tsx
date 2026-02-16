import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useDocumentModules,
  useDeleteDocumentModule,
} from "@/hooks/api/central/use-document-modules";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { useDebounce } from "@/hooks/common/use-debounce";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useMenuIcon, useTableLayout } from "@/hooks/common";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Edit, Plus, Search, X, FolderOpen } from "lucide-react";
import type { DocumentModule } from "@/types/central/document-module";

const DocumentModuleList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [statusValue, setStatusValue] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const defaultColumnOrder = [
    "actions",
    "strDocumentModuleName",
    "strModuleName",
    "bolIsActive",
  ];

  const {
    columnVisibility,
    toggleColumnVisibility,
    resetColumnVisibility,
    hasVisibleContentColumns,
    getAlwaysVisibleColumns,
    isTextWrapped,
    toggleTextWrapping,
    pinnedColumns,
    pinColumn,
    unpinColumn,
    resetPinnedColumns,
    columnOrder,
    setColumnOrder,
    columnWidths,
    setColumnWidths,
    resetAll,
  } = useTableLayout(
    "document-module",
    defaultColumnOrder,
    [],
    {
      actions: true,
      strDocumentModuleName: true,
      strModuleName: true,
      bolIsActive: true,
    }
  );

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("document-module", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strDocumentModuleName",
        direction: "asc",
      },
    });

  const sortBy = sorting.columnKey || "strDocumentModuleName";
  const ascending = sorting.direction === "asc";

  const deleteDocumentModuleMutation = useDeleteDocumentModule();

  const { data: documentModulesResponse, isLoading } = useDocumentModules({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    bolIsActive: activeFilter,
    sortBy,
    ascending,
  });

  useEffect(() => {
    if (documentModulesResponse?.data) {
      updateResponseData({
        totalCount: documentModulesResponse.data?.totalCount || 0,
        totalPages: documentModulesResponse.data?.totalPages || 1,
      });
    }
  }, [documentModulesResponse, updateResponseData]);

  const handleSort = (column: string) => {
    setSorting({
      columnKey: column,
      direction: sortBy === column && ascending ? "desc" : "asc",
    });
  };

  const goToPage = (pageNumber: number) => {
    setPagination({
      pageNumber,
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({
      pageSize: newSize,
      pageNumber: 1,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination({ pageNumber: 1 });
  };

  const handleClearSearch = () => {
    setSearch("");
    setPagination({ pageNumber: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusValue(value);
    if (value === "all") {
      setActiveFilter(undefined);
    } else if (value === "active") {
      setActiveFilter(true);
    } else if (value === "inactive") {
      setActiveFilter(false);
    }

    setPagination({
      pageNumber: 1,
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDocumentModuleMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const HeaderIcon = useMenuIcon("document_module_list", FolderOpen);

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<DocumentModule>[] = [];

    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "50px",
      cell: (documentModule) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              openEditInNewTab(
                `/document-module/${documentModule.strDocumentModuleGUID}`
              );
            }}
            title="Edit document module"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      ),
    });

    baseColumns.push(
      {
        key: "strModuleName",
        header: "Module",
        width: "150px",
        cell: (documentModule) => (
          <div
            className={`${getTextClass()} font-medium`}
            title={documentModule.strModuleName}
          >
            {documentModule.strModuleName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strDocumentModuleName",
        header: "Document Module Name",
        width: "200px",
        cell: (documentModule) => (
          <div
            className={getTextClass()}
            title={documentModule.strDocumentModuleName}
          >
            <div className="flex items-center gap-2">
              <span className="">{documentModule.strDocumentModuleName}</span>
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "100px",
        cell: (documentModule) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              documentModule.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {documentModule.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
      }
    );

    return baseColumns;
  }, [openEditInNewTab, isTextWrapped]);

  const orderedColumns = useMemo(() => {
    if (!columns || columns.length === 0) return columns;

    return [...columns].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.key);
      const bIndex = columnOrder.indexOf(b.key);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <PageHeader
        title="Document Modules"
        description="Manage document modules for the system"
        icon={HeaderIcon}
        actions={
          <Button onClick={() => navigate("/document-module/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document Module
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
        <div className="flex flex-1 flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search document modules..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Select value={statusValue} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <DraggableColumnVisibility
            columns={orderedColumns}
            columnVisibility={columnVisibility}
            toggleColumnVisibility={toggleColumnVisibility}
            resetColumnVisibility={resetColumnVisibility}
            hasVisibleContentColumns={hasVisibleContentColumns}
            getAlwaysVisibleColumns={getAlwaysVisibleColumns}
            isTextWrapped={isTextWrapped}
            toggleTextWrapping={toggleTextWrapping}
            pinnedColumns={pinnedColumns}
            pinColumn={pinColumn}
            unpinColumn={unpinColumn}
            resetPinnedColumns={resetPinnedColumns}
            onColumnOrderChange={(order) => {
              setColumnOrder(order);
              localStorage.setItem("document-module_column_order", JSON.stringify(order));
            }}
            onResetAll={resetAll}
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton
          columns={["Actions", "Document Module Name", "Module", "Status"]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={documentModulesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(documentModule) =>
            documentModule.strDocumentModuleGUID || Math.random().toString()
          }
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSort}
          loading={false}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          isTextWrapped={isTextWrapped}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem("document-module_column_widths", JSON.stringify(widths));
          }}
          emptyState={
            debouncedSearch ? (
              <>No document modules found matching "{debouncedSearch}".</>
            ) : (
              <>
                No document modules found. Click "Add Document Module" to create
                one.
              </>
            )
          }
          pagination={{
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount: pagination.totalCount || 0,
            totalPages: pagination.totalPages || 1,
            onPageChange: goToPage,
            onPageSizeChange: handlePageSizeChange,
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          maxHeight="calc(100vh - 350px)"
        />
      )}

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Document Module"
        description="Are you sure you want to delete this document module? This action cannot be undone."
        isLoading={deleteDocumentModuleMutation.isPending}
      />
    </CustomContainer>
  );
};

export default DocumentModuleList;
