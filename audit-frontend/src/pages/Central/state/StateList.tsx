import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomContainer from "@/components/layout/custom-container";
import {
  useStates,
  useExportStates,
  useImportStates,
} from "@/hooks/api/central/use-states";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { useActiveCountries } from "@/hooks/api/central/use-countries";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useMenuIcon, useTableLayout } from "@/hooks/common";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
// Removed unused imports

// Icons
import {
  Edit,
  Map,
  Plus,
  Search,
  Filter,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Upload,
} from "lucide-react";

// Use the State type from our types
import type { State } from "@/types/central/state";
import { MultiSelect } from "@/components/ui/select/multi-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const StateList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500); // Debounce search input by 500ms

  const defaultColumnOrder = ["actions", "strName", "country", "status"];

  // Use menu icon for header
  const HeaderIcon = useMenuIcon("state_list", Map);
  const [selectedCountry, setSelectedCountry] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [statusValue, setStatusValue] = useState<string>("all");

  // Use list preferences hook for pagination and sorting
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("state", {
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

  // Get countries for the filter
  const { data: countries, isLoading: isCountriesLoading } =
    useActiveCountries();

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
  } = useTableLayout("state", defaultColumnOrder, ["actions", "strName"], {
    actions: true,
    strName: true,
    country: true,
    status: true,
  }); // Actions and State Name columns are always visible

  // We no longer automatically pin strName column
  // Only actions column should be pinned by default

  // Export and import states hooks
  const exportStates = useExportStates();
  const importStates = useImportStates();

  // Fetch states using the hook with updated parameters
  const { data: statesResponse, isLoading } = useStates({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    strCountryGUID:
      selectedCountry.length > 0 ? selectedCountry.join(",") : undefined,
    bolIsActive: activeFilter, // Status filter using the correct parameter name
    sortBy: sorting.columnKey || "strName",
    ascending: sorting.direction === "asc",
  });

  useEffect(() => {
    if (statesResponse?.data) {
      // Update pagination with response data
      updateResponseData({
        totalCount: statesResponse.data?.totalCount || 0,
        totalPages: statesResponse.data?.totalPages || 1,
      });
    }
  }, [statesResponse, isLoading, updateResponseData]);

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

  const handleCountryChange = (values: string[]) => {
    setSelectedCountry(values);
    setPagination({ pageNumber: 1 }); // Reset to first page when changing filter
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  // Define columns for DataTable using useMemo
  const columns = useMemo(() => {
    // Helper function to get the appropriate text class based on wrap state
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<State>[] = [];

    // Always add Actions column - no permission check
    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (state) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            onClick={() => openEditInNewTab(`/state/${state.strStateGUID}`)}
            title="Edit state"
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
        key: "strName",
        header: "State Name",
        width: "180px",
        cell: (state) => (
          <div
            className={`${getTextClass()} font-medium`}
            title={state.strName}
          >
            {state.strName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "country",
        header: "Country Name",
        width: "180px",
        cell: (state) => (
          <div className={getTextClass()} title={state.strCountryName}>
            {state.strCountryName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "status", // Changed from bolIsActive to status to match backend sorting key
        header: "Status",
        width: "120px",
        cell: (state) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              state.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {state.bolIsActive ? "Active" : "Inactive"}
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination({ pageNumber: 1 });
  };

  const handleExport = (format: "excel" | "csv") => {
    exportStates.mutateAsync({ format });
  };

  return (
    <CustomContainer>
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import States</DialogTitle>
            <DialogDescription>
              Upload an Excel file (.xlsx) containing states data. Please ensure
              the file follows the required format:
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 bg-black/10 dark:bg-white/5 rounded-lg p-4">
            <div className="text-sm font-mono space-y-2">
              <div className="font-semibold mb-4">Required Excel Format:</div>
              <div>
                <div>
                  Column A: CountryName Column B: StateName Column C: Status
                </div>
                <div className="text-muted-foreground">
                  Existing country name | Name of the state | "True" or "False"
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="grid w-full items-center gap-1.5">
              <label
                htmlFor="importFile"
                className="text-sm font-medium leading-none"
              >
                Select File
              </label>
              <input
                id="importFile"
                type="file"
                accept=".xlsx"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (!file.name.toLowerCase().endsWith(".xlsx")) {
                    toast.error("Please select a valid Excel file (.xlsx)");
                    return;
                  }

                  try {
                    await importStates.mutateAsync(file);
                    setImportModalOpen(false);
                  } catch {
                    // Error handling is done in the mutation
                  }
                }}
                disabled={importStates.isPending}
              />
            </div>
          </div>
          <div className="mt-4 bg-black/10 dark:bg-white/5 rounded-lg p-4">
            <div className="text-sm text-muted-foreground">
              <p>Example:</p>
              <pre className="bg-muted p-2 rounded mt-1 font-mono">
                CountryName | StateName | Status{"\n"}
                ------------|-------------|--------{"\n"}
                India | Gujarat | True{"\n"}
                USA | Texas | True{"\n"}
                India | Kerala | False
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PageHeader
        title="States"
        description="Manage all states in the system"
        icon={HeaderIcon}
        actions={
          <div className="flex gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exportStates.isPending}>
                  <Download className="mr-2 h-4 w-4" />
                  {exportStates.isPending ? "Exporting..." : "Export"}
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

            {/* Import States Button */}
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              disabled={importStates.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importStates.isPending ? "Importing..." : "Import"}
            </Button>

            {/* Add State Button */}
            <Button onClick={() => navigate("/state/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add State
            </Button>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search states..."
              className="pl-9 pr-8 w-full h-10"
              value={search}
              onChange={handleSearchChange}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPagination({ pageNumber: 1 });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4 mr-1" />
            <span>Filters</span>
            {(activeFilter !== undefined || selectedCountry.length > 0) && (
              <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                {(activeFilter !== undefined ? 1 : 0) + selectedCountry.length}
              </span>
            )}
          </Button>

          {/* Column Visibility Dropdown */}
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
              localStorage.setItem("state_column_order", JSON.stringify(order));
            }}
            onResetAll={resetAll}
          />
        </div>

        <div
          className={`transform transition-all duration-300 ease-in-out ${
            showFilters
              ? "opacity-100 max-h-250"
              : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Advanced Filters</CardTitle>
              <CardDescription>
                Filter states by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Country
                  </label>
                  <div className="relative z-20">
                    <MultiSelect
                      options={
                        countries?.map((country) => ({
                          value: country.strCountryGUID,
                          label: country.strName,
                        })) || []
                      }
                      selectedValues={selectedCountry}
                      onChange={handleCountryChange}
                      placeholder="Filter by country"
                      className="overflow-visible"
                      isLoading={isCountriesLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <div className="relative z-10">
                    <Select
                      value={statusValue}
                      onValueChange={(value) => {
                        setStatusValue(value);
                        if (value === "all") {
                          setActiveFilter(undefined);
                        } else if (value === "active") {
                          setActiveFilter(true);
                        } else if (value === "inactive") {
                          setActiveFilter(false);
                        }
                        setPagination({ pageNumber: 1 });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={
                    selectedCountry.length === 0 && activeFilter === undefined
                  }
                  onClick={() => {
                    setSelectedCountry([]);
                    setActiveFilter(undefined);
                    setStatusValue("all");
                    setPagination({ pageNumber: 1 });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton
          columns={["Actions", "State Name", "Country Name", "Status"]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={statesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(state: State) =>
            state.strStateGUID || Math.random().toString()
          }
          sortBy={sorting.columnKey || "strName"}
          ascending={sorting.direction === "asc"}
          onSort={handleSort}
          loading={false}
          columnVisibility={columnVisibility}
          isTextWrapped={isTextWrapped}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem("state_column_widths", JSON.stringify(widths));
          }}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          emptyState={
            search ||
            selectedCountry.length > 0 ||
            activeFilter !== undefined ? (
              <>No states found matching your filter criteria.</>
            ) : (
              <>No states found. Click "Add State" to create one.</>
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
    </CustomContainer>
  );
};

export default StateList;
