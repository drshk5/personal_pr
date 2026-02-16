import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomContainer from "@/components/layout/custom-container";
import {
  useLegalStatusTypes,
  useExportLegalStatusTypes,
} from "@/hooks/api/central/use-legal-status-types";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useMenuIcon, useTableLayout } from "@/hooks/common";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";

// UI Components
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icons
import {
  Edit,
  Plus,
  Search,
  Scale,
  X,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

// Use the LegalStatusType type from our types
import type { LegalStatusType } from "@/types/central/legal-status-type";

const LegalStatusTypeList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");

  // Use menu icon for header
  const HeaderIcon = useMenuIcon("legal_status_type_list", Scale);
  const debouncedSearch = useDebounce(search, 300);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [statusValue, setStatusValue] = useState<string>("all");

  const defaultColumnOrder = ["actions", "name", "isactive"];

  // Use list preferences hook for pagination and sorting
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("legalStatusType", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "name",
        direction: "asc",
      },
    });

  // Initialize column visibility with Name and Actions columns always visible
  const {
    columnVisibility,
    toggleColumnVisibility,
    resetColumnVisibility,
    hasVisibleContentColumns,
    getAlwaysVisibleColumns,
    pinnedColumns,
    pinColumn,
    unpinColumn,
    resetPinnedColumns,
    isTextWrapped,
    toggleTextWrapping,
    columnOrder,
    setColumnOrder,
    columnWidths,
    setColumnWidths,
    resetAll,
  } = useTableLayout(
    "legalStatusType",
    defaultColumnOrder,
    [],
    {
      actions: true,
      name: true,
      isactive: true,
    }
  ); // Actions and Name columns are always visible

  // We no longer automatically pin name column
  // Only actions column should be pinned by default

  // Export legal status types hook
  const exportLegalStatusTypes = useExportLegalStatusTypes();

  // Fetch legal status types using the hook
  const { data: legalStatusTypesResponse, isLoading } = useLegalStatusTypes({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    bolIsActive: activeFilter,
    sortBy: sorting.columnKey || "name",
    ascending: sorting.direction === "asc",
  });

  useEffect(() => {
    if (legalStatusTypesResponse?.data) {
      // Update pagination with response data
      updateResponseData({
        totalCount: legalStatusTypesResponse.data?.totalCount || 0,
        totalPages: legalStatusTypesResponse.data?.totalPages || 1,
      });
    }
  }, [legalStatusTypesResponse, isLoading, updateResponseData]);

  const handleSort = (column: string) => {
    if (sorting.columnKey === column) {
      setSorting({ direction: sorting.direction === "asc" ? "desc" : "asc" });
    } else {
      setSorting({ columnKey: column, direction: "asc" });
    }
  };

  const goToPage = (pageNumber: number) => {
    setPagination({ pageNumber });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({
      pageSize: newSize,
      pageNumber: 1, // Reset to first page when changing page size
    });
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  // Define columns for DataTable using useMemo
  const columns = useMemo<DataTableColumn<LegalStatusType>[]>(() => {
    const baseColumns: DataTableColumn<LegalStatusType>[] = [];

    // Always add Actions column
    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (type) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              openEditInNewTab(`/legal-status-type/${type.strLegalStatusTypeGUID}`);
            }}
            title="Edit legal status type"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      ),
    });

    // Add other columns
    baseColumns.push(
      {
        key: "name",
        header: "Name",
        width: "180px",
        cell: (type) => (
          <div className="truncate" title={type.strName}>
            <span className="font-medium">{type.strName}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "isactive",
        header: "Status",
        width: "120px",
        cell: (type) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              type.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {type.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
      }
    );

    return baseColumns;
  }, [openEditInNewTab]);

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
      ...pagination,
      pageNumber: 1, // Reset to first page on new filter
    });
  };

  const handleExport = (format: "excel" | "csv") => {
    exportLegalStatusTypes.mutate({ format });
  };

  return (
    <CustomContainer>
      <PageHeader
        title="Legal Status Types"
        description="Manage legal status type information"
        icon={HeaderIcon}
        actions={
          <div className="flex gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={exportLegalStatusTypes.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportLegalStatusTypes.isPending ? "Exporting..." : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Legal Status Type Button */}
            <Button onClick={() => navigate("/legal-status-type/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Legal Status Type
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search legal status types..."
            className="pl-9 pr-10 w-full h-10"
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
        <div className="w-48">
          <Select value={statusValue} onValueChange={handleStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            localStorage.setItem("legalStatusType_column_order", JSON.stringify(order));
          }}
          onResetAll={resetAll}
        />
      </div>

      {isLoading ? (
        <TableSkeleton
          columns={["Actions", "Name", "Status"]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={legalStatusTypesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(type) =>
            type.strLegalStatusTypeGUID || Math.random().toString()
          }
          sortBy={sorting.columnKey || "name"}
          ascending={sorting.direction === "asc"}
          onSort={handleSort}
          loading={false}
          columnVisibility={columnVisibility}
          isTextWrapped={isTextWrapped}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem("legalStatusType_column_widths", JSON.stringify(widths));
          }}
          emptyState={
            search ? (
              <>No legal status types found matching "{search}".</>
            ) : (
              <>
                No legal status types found. Click "Add Legal Status Type" to
                create one.
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
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
        />
      )}
    </CustomContainer>
  );
};

export default LegalStatusTypeList;
