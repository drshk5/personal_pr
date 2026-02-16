import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CustomContainer from "@/components/layout/custom-container";
import { useModules, useExportModules } from "@/hooks/api/central/use-modules";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { useDebounce } from "@/hooks/common/use-debounce";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useMenuIcon, useTableLayout } from "@/hooks/common";
import { AvatarImage } from "@/components/ui/avatar-image";

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
  Download,
  FileSpreadsheet,
  FileText,
  X,
  LayoutDashboard,
} from "lucide-react";

// Use the Module type from our types
import type { Module } from "@/types/central/module";

const ModuleList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300); // Debounce search input by 300ms
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [statusValue, setStatusValue] = useState<string>("all");

  const defaultColumnOrder = [
    "actions",
    "strImagePath",
    "strName",
    "strDesc",
    "strSQlfilePath",
    "bolIsActive",
  ];

  // Initialize column visibility with Name and Actions columns always visible
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
    "module",
    defaultColumnOrder,
    ["strImagePath", "actions", "strName"],
    {
      actions: true,
      strImagePath: true,
      strName: true,
      strDesc: true,
      strSQlfilePath: true,
      bolIsActive: true,
    }
  ); // Actions and Name columns are always visible

  // Use list preferences hook for persisting preferences
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("module", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strName",
        direction: "asc",
      },
    });

  // Extract sorting values for use in the component
  const sortBy = sorting.columnKey || "strName";
  const ascending = sorting.direction === "asc";

  // Export modules hook
  const exportModules = useExportModules();

  // Fetch modules using the hook with refetch on window focus
  const { data: modulesResponse, isLoading } = useModules({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    bolIsActive: activeFilter,
    sortBy,
    ascending: ascending,
  });

  useEffect(() => {
    if (modulesResponse?.data) {
      // Update pagination with response data
      updateResponseData({
        totalCount: modulesResponse.data?.totalCount || 0,
        totalPages: modulesResponse.data?.totalPages || 1,
      });
    }
  }, [modulesResponse, updateResponseData]);

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
      pageNumber: 1, // Reset to first page when changing page size
    });
  };

  const handleExport = (format: "excel" | "csv") => {
    exportModules.mutate({ format });
  };

  // Define columns for DataTable using useMemo to prevent unnecessary recalculation
  const columns = useMemo(() => {
    // Helper function to get the appropriate text class based on wrap state
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<Module>[] = [];

    // Always add Actions column - no permission check
    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "50px",
      cell: (module) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/module-super/${module.strModuleGUID}`);
            }}
            title="Edit module"
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
        key: "strImagePath",
        header: "Image",
        width: "70px",
        cell: (module) => (
          <div className="flex items-center justify-center">
            <AvatarImage
              imagePath={module.strImagePath}
              alt={`${module.strName} icon`}
              size="md"
              type="organization" // Using organization type since modules are more like organizations
            />
          </div>
        ),
        sortable: true,
      },
      {
        key: "strName",
        header: "Module Name",
        width: "150px",
        cell: (module) => (
          <div className={getTextClass()} title={module.strName}>
            <span className="font-medium">{module.strName}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strDesc",
        header: "Description",
        width: "200px",
        cell: (module) => (
          <div className={getTextClass()} title={module.strDesc}>
            <span>{module.strDesc || "-"}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strSQlfilePath",
        header: "SQL File Path",
        width: "200px",
        cell: (module) => (
          <div className={getTextClass()} title={module.strSQlfilePath}>
            <span>{module.strSQlfilePath || "-"}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "100px",
        cell: (module) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              module.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {module.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
      }
    );

    return baseColumns;
  }, [navigate, isTextWrapped]);

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
      pageNumber: 1, // Reset to first page on new filter
    });
  };

  const HeaderIcon = useMenuIcon("module_list", LayoutDashboard);

  return (
    <CustomContainer>
      <PageHeader
        title="Modules"
        description="Manage your module information"
        icon={HeaderIcon}
        actions={
          <div className="flex gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exportModules.isPending}>
                  <Download className="mr-2 h-4 w-4" />
                  {exportModules.isPending ? "Exporting..." : "Export"}
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

            {/* Add Module Button */}
            <Button onClick={() => navigate("/module-super/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search modules..."
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
            localStorage.setItem("module_column_order", JSON.stringify(order));
          }}
          onResetAll={resetAll}
        />
      </div>

      {isLoading ? (
        <TableSkeleton
          columns={[
            "Actions", // Always show Actions column
            "Image",
            "Module Name",
            "SQL File Path",
            "Status",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={modulesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(module) =>
            module.strModuleGUID || Math.random().toString()
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
            localStorage.setItem(
              "module_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            debouncedSearch ? (
              <>No modules found matching "{debouncedSearch}".</>
            ) : (
              <>No modules found. Click "Add Module" to create one.</>
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
          maxHeight="calc(100vh - 350px)" // Responsive height based on viewport
        />
      )}
    </CustomContainer>
  );
};

export default ModuleList;
