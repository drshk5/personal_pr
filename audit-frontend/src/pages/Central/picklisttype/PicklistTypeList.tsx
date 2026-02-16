import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomContainer from "@/components/layout/custom-container";
import { usePicklistTypes, useExportPicklistTypes } from "@/hooks";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { useDebounce } from "@/hooks/common/use-debounce";
import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
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
  ListFilter,
  X,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

// Use the PicklistType type from our types
import type { PicklistType } from "@/types/central/picklist-type";

const PicklistTypeList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500); // Debounce search input by 500ms
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [statusValue, setStatusValue] = useState<string>("all");

  // Export picklist types hook
  const exportPicklistTypes = useExportPicklistTypes();

  // Default column order
  const defaultColumnOrder = [
    "actions",
    "strType",
    "strDescription",
    "bolIsActive",
  ];

  // Initialize column visibility and table layout
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
    "picklistType",
    defaultColumnOrder,
    ["actions", "strType"] // Actions and Type columns are always visible
  );

  // We no longer automatically pin strType column
  // Only actions column should be pinned by default

  // Use our custom hook to manage pagination and sorting with localStorage persistence
  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "picklistType",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strType",
        direction: "asc",
      },
    }
  );

  // For backward compatibility with existing code
  const sortBy = sorting.columnKey || "strType";
  const ascending = sorting.direction === "asc";

  // Fetch picklist types using the hook with refetch on window focus
  const { data: picklistTypesResponse, isLoading } = usePicklistTypes({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy,
    ascending,
    bolIsActive: activeFilter,
  });

  useEffect(() => {
    if (picklistTypesResponse?.data) {
      // Update pagination with response data
      setPagination({
        totalCount: picklistTypesResponse.data?.totalCount || 0,
        totalPages: picklistTypesResponse.data?.totalPages || 1,
      });
    }
  }, [picklistTypesResponse, setPagination]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort direction
      setSorting({
        direction: ascending ? "desc" : "asc",
      });
    } else {
      // Set new sort column
      setSorting({
        columnKey: column,
        direction: "asc",
      });
    }
    // Reset to first page when sorting changes
    setPagination({
      pageNumber: 1,
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
      pageNumber: 1, // Reset to first page when changing page size
    });
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  // Define columns for DataTable using useMemo
  const columns = useMemo(() => {
    const baseColumns: DataTableColumn<PicklistType>[] = [];

    // Always add Actions column - no permission check
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
              openEditInNewTab(`/picklist-type/${type.strPicklistTypeGUID}`);
            }}
            title="Edit picklist type"
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
        key: "strType",
        header: "Picklist Type",
        width: "180px",
        cell: (type) => (
          <div className="truncate font-medium" title={type.strType}>
            {type.strType}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strDescription",
        header: "Description",
        width: "300px",
        cell: (type) => (
          <div className="truncate" title={type.strDescription || "-"}>
            {type.strDescription || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsActive",
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
      pageNumber: 1, // Reset to first page on new filter
    });
  };

  const handleExport = (format: "excel" | "csv") => {
    exportPicklistTypes.mutate({ format });
  };

  const HeaderIcon = useMenuIcon("picklist_type_list", ListFilter);

  return (
    <CustomContainer>
      <PageHeader
        title="Picklist Types"
        description="Manage your picklist type information"
        icon={HeaderIcon}
        actions={
          <div className="flex gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={exportPicklistTypes.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportPicklistTypes.isPending ? "Exporting..." : "Export"}
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

            {/* Add Picklist Type Button */}
            <Button onClick={() => navigate("/picklist-type/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Picklist Type
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search picklist types..."
            className="pl-9 pr-8 w-full h-10"
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPagination({
                  pageNumber: 1,
                });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Column Visibility Dropdown - Moved here next to the search */}

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
          columns={columns}
          columnVisibility={columnVisibility}
          toggleColumnVisibility={toggleColumnVisibility}
          resetColumnVisibility={resetColumnVisibility}
          hasVisibleContentColumns={hasVisibleContentColumns}
          getAlwaysVisibleColumns={getAlwaysVisibleColumns}
          pinnedColumns={pinnedColumns}
          pinColumn={pinColumn}
          unpinColumn={unpinColumn}
          resetPinnedColumns={resetPinnedColumns}
          isTextWrapped={isTextWrapped}
          toggleTextWrapping={toggleTextWrapping}
          onColumnOrderChange={(order) => {
            setColumnOrder(order);
            localStorage.setItem(
              "picklistType_column_order",
              JSON.stringify(order)
            );
          }}
          onResetAll={() => {
            resetAll();
          }}
        />
      </div>

      {isLoading ? (
        <TableSkeleton
          columns={["Actions", "Picklist Type", "Description", "Status"]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={picklistTypesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(type) =>
            type.strPicklistTypeGUID || Math.random().toString()
          }
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSort}
          loading={false}
          columnVisibility={columnVisibility}
          isTextWrapped={isTextWrapped}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "picklistType_column_widths",
              JSON.stringify(widths)
            );
          }}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          maxHeight="calc(100vh - 350px)" // Responsive height based on viewport
          emptyState={
            search ? (
              <>No picklist types found matching "{search}".</>
            ) : (
              <>
                No picklist types found. Click "Add Picklist Type" to create
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
        />
      )}
    </CustomContainer>
  );
};

export default PicklistTypeList;
