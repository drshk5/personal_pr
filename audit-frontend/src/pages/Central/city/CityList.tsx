import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCities, useExportCities } from "@/hooks/api/central/use-cities";
import { useImportCities } from "@/hooks/api/central/use-cities";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useMenuIcon, useTableLayout } from "@/hooks/common";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  MapPin,
  Filter,
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useActiveCountries } from "@/hooks/api/central/use-countries";
import { useActiveStates } from "@/hooks/api/central/use-states";
import type { City } from "@/types/central/city";
import { MultiSelect } from "@/components/ui/select/multi-select";
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

import { toast } from "sonner";

const CityList: React.FC = () => {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const importCities = useImportCities();
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);

  const defaultColumnOrder = [
    "actions",
    "strName",
    "state",
    "country",
    "status",
  ];

  // Use menu icon for header
  const HeaderIcon = useMenuIcon("city_list", MapPin);
  const [selectedCountry, setSelectedCountry] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [statusValue, setStatusValue] = useState<string>("all");

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("city", {
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
  } = useTableLayout("city", defaultColumnOrder, ["actions", "strName"], {
    actions: true,
    strName: true,
    state: true,
    country: true,
    status: true,
  });
  const exportCities = useExportCities();

  const { data: countries, isLoading: isCountriesLoading } =
    useActiveCountries();
  const { data: states, isLoading: isStatesLoading } = useActiveStates();

  const { data: citiesResponse, isLoading } = useCities({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    strCountryGUID: selectedCountry.length
      ? selectedCountry.join(",")
      : undefined,
    strStateGUID: selectedState.length ? selectedState.join(",") : undefined,
    bolIsActive: activeFilter,
    sortBy: sorting.columnKey || "strName",
    ascending: sorting.direction === "asc",
  });

  useEffect(() => {
    if (citiesResponse?.data) {
      updateResponseData({
        totalCount: citiesResponse.data?.totalCount || 0,
        totalPages: citiesResponse.data?.totalPages || 1,
      });
    }
  }, [citiesResponse, isLoading, updateResponseData]);

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
      pageNumber: 1,
    });
  };

  const handleCountryChange = (values: string[]) => {
    setSelectedCountry(values);
    setPagination({ pageNumber: 1 });
  };

  const handleStateChange = (values: string[]) => {
    setSelectedState(values);
    setPagination({ pageNumber: 1 });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination({ pageNumber: 1 });
  };

  const handleClearSearch = () => {
    setSearch("");
    setPagination({ pageNumber: 1 });
  };

  const handleExport = (format: "excel" | "csv") => {
    exportCities.mutate({ format });
  };

  // No delete functionality

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo<DataTableColumn<City>[]>(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<City>[] = [];

    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (city) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              openEditInNewTab(`/city/${city.strCityGUID}`);
            }}
            title="Edit city"
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
        header: "City Name",
        width: "180px",
        cell: (city) => (
          <div className={getTextClass()} title={city.strName}>
            <span className="font-medium">{city.strName}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "state",
        header: "State Name",
        width: "150px",
        cell: (city) => (
          <div className={getTextClass()} title={city.strStateName || "-"}>
            {city.strStateName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "country",
        header: "Country Name",
        width: "150px",
        cell: (city) => (
          <div className={getTextClass()} title={city.strCountryName || "-"}>
            {city.strCountryName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "status",
        header: "Status",
        width: "120px",
        cell: (city) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              city.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {city.bolIsActive ? "Active" : "Inactive"}
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
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Cities</DialogTitle>
            <DialogDescription>
              Upload an Excel file (.xlsx) containing cities data. Please ensure
              the file follows the required format:
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 bg-black/10 dark:bg-white/5 rounded-lg p-4">
            <div className="text-sm font-mono space-y-2">
              <div className="font-semibold mb-4">Required Excel Format:</div>
              <div>
                <div>
                  Column A: CountryName Column B: StateName Column C: CityName
                  Column D: Status
                </div>
                <div className="text-muted-foreground">
                  Existing country name | Existing state name | City name |
                  "True" or "False"
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
                    await importCities.mutateAsync(file);
                    setImportModalOpen(false);
                  } catch {
                    // Error handling is done in the mutation
                  }
                }}
                disabled={importCities.isPending}
              />
            </div>
          </div>
          <div className="mt-4 bg-black/10 dark:bg-white/5 rounded-lg p-4">
            <div className="text-sm text-muted-foreground">
              <p>Example:</p>
              <pre className="bg-muted p-2 rounded mt-1 font-mono">
                CountryName | StateName | CityName | Status{"\n"}
                ------------|-----------|----------|--------{"\n"}
                India | Gujarat | Ahmedabad| True{"\n"}
                USA | Texas | Dallas | True{"\n"}
                India | Kerala | Kochi | False
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PageHeader
        title="Cities"
        description="Manage cities in the system"
        icon={HeaderIcon}
        actions={
          <div className="flex gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exportCities.isPending}>
                  <Download className="mr-2 h-4 w-4" />
                  {exportCities.isPending ? "Exporting..." : "Export"}
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

            {/* Import Button */}
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              disabled={importCities.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importCities.isPending ? "Importing..." : "Import"}
            </Button>

            {/* Add City Button */}
            <Button onClick={() => navigate("/city/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add City
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
              placeholder="Search cities..."
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

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4 mr-1" />
            <span>Filters</span>
            {(selectedCountry.length > 0 ||
              selectedState.length > 0 ||
              activeFilter !== undefined) && (
              <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                {selectedCountry.length +
                  selectedState.length +
                  (activeFilter !== undefined ? 1 : 0)}
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
              localStorage.setItem("city_column_order", JSON.stringify(order));
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
                Filter cities by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    State
                  </label>
                  <div className="relative z-20">
                    <MultiSelect
                      options={
                        states?.map((state) => ({
                          value: state.strStateGUID,
                          label: state.strName,
                        })) || []
                      }
                      selectedValues={selectedState}
                      onChange={handleStateChange}
                      placeholder="Filter by state"
                      className="overflow-visible"
                      isLoading={isStatesLoading}
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
                      onValueChange={(value: string) => {
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
                    selectedCountry.length === 0 &&
                    selectedState.length === 0 &&
                    activeFilter === undefined
                  }
                  onClick={() => {
                    setSelectedCountry([]);
                    setStatusValue("all");
                    setActiveFilter(undefined);
                    setSelectedState([]);
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
          columns={[
            "Actions",
            "City Name",
            "State Name",
            "Country Name",
            "Status",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={citiesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(city) => city.strCityGUID || Math.random().toString()}
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
            localStorage.setItem("city_column_widths", JSON.stringify(widths));
          }}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          emptyState={
            search ||
            selectedCountry.length > 0 ||
            selectedState.length > 0 ||
            activeFilter !== undefined ? (
              <>No cities found matching your filter criteria.</>
            ) : (
              <>No cities found. Click "Add City" to create one.</>
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

export default CityList;
