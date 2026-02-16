import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Globe,
  Plus,
  Search,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Upload,
} from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import {
  useCountries,
  useExportCountries,
  useImportCountries,
} from "@/hooks/api/central/use-countries";
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
import { toast } from "sonner";

// UI Components
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

// Use the Country type from our types
import type { Country } from "@/types/central/country";

const CountryList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500); // Debounce search input by 500ms

  // Use menu icon for header
  const HeaderIcon = useMenuIcon("country_list", Globe);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );

  // Use list preferences hook for pagination and sorting
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("country", {
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

  // We use sorting directly from useListPreferences

  const defaultColumnOrder = [
    "actions",
    "strName",
    "strCountryCode",
    "strDialCode",
    "intPhoneMinLength",
    "intPhoneMaxLength",
    "status",
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
    "country",
    defaultColumnOrder,
    ["strName"] // Always visible columns
  );

  const exportCountries = useExportCountries();
  const importCountries = useImportCountries();
  const [importModalOpen, setImportModalOpen] = useState(false);

  const { data: countriesResponse, isLoading } = useCountries({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    bolIsActive: activeFilter,
    sortBy: sorting.columnKey || "strName",
    ascending: sorting.direction === "asc",
  });

  useEffect(() => {
    if (countriesResponse?.data) {
      updateResponseData({
        totalCount: countriesResponse.data?.totalCount || 0,
        totalPages: countriesResponse.data?.totalPages || 1,
      });
    }
  }, [countriesResponse, isLoading, updateResponseData]);

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

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo<DataTableColumn<Country>[]>(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<Country>[] = [];

    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (country) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            onClick={() =>
              openEditInNewTab(`/country/${country.strCountryGUID}`)
            }
            title="Edit country"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      ),
    });

    baseColumns.push(
      {
        key: "strName",
        header: "Country Name",
        width: "180px",
        cell: (country) => (
          <div className={getTextClass()} title={country.strName}>
            <span className="font-medium">{country.strName}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCountryCode",
        header: "Country Code",
        width: "140px",
        cell: (country) => (
          <div className={getTextClass()} title={country.strCountryCode || "-"}>
            {country.strCountryCode || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strDialCode",
        header: "Dial Code",
        width: "120px",
        cell: (country) => (
          <div className={getTextClass()} title={country.strDialCode || "-"}>
            {country.strDialCode || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "intPhoneMinLength",
        header: "Phone Min",
        width: "110px",
        cell: (country) => (
          <div
            className={getTextClass()}
            title={
              typeof country.intPhoneMinLength === "number"
                ? String(country.intPhoneMinLength)
                : "-"
            }
          >
            {typeof country.intPhoneMinLength === "number"
              ? country.intPhoneMinLength
              : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "intPhoneMaxLength",
        header: "Phone Max",
        width: "110px",
        cell: (country) => (
          <div
            className={getTextClass()}
            title={
              typeof country.intPhoneMaxLength === "number"
                ? String(country.intPhoneMaxLength)
                : "-"
            }
          >
            {typeof country.intPhoneMaxLength === "number"
              ? country.intPhoneMaxLength
              : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "status",
        header: "Status",
        width: "120px",
        cell: (country) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              country.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {country.bolIsActive ? "Active" : "Inactive"}
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

  const handleClearSearch = () => {
    setSearch("");
    setPagination({ pageNumber: 1 });
  };

  const handleStatusFilterChange = (value: string) => {
    if (value === "all") {
      setActiveFilter(undefined);
    } else if (value === "active") {
      setActiveFilter(true);
    } else if (value === "inactive") {
      setActiveFilter(false);
    }

    setPagination({
      ...pagination,
      pageNumber: 1,
    });
  };

  const handleExport = (format: "excel" | "csv") => {
    exportCountries.mutate({ format });
  };

  const handleFileImport = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Please select a valid Excel file (.xlsx)");
      return;
    }

    await importCountries.mutateAsync(file);
    setImportModalOpen(false);
  };

  return (
    <>
      <CustomContainer>
        <PageHeader
          title="Countries"
          description="Manage all countries in the system"
          icon={HeaderIcon}
          actions={
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={exportCountries.isPending}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {exportCountries.isPending ? "Exporting..." : "Export"}
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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImportModalOpen(true)}
                  disabled={importCountries.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {importCountries.isPending ? "Importing..." : "Import"}
                </Button>

                <Button onClick={() => navigate("/country/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Country
                </Button>
              </div>
            </div>
          }
        />

        <div className="mb-6 flex gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search countries..."
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
            <Select onValueChange={handleStatusFilterChange} defaultValue="all">
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

          {/* Column Visibility Dropdown */}
          <DraggableColumnVisibility
            columns={columns}
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
              localStorage.setItem("country_column_order", JSON.stringify(order));
            }}
            onResetAll={() => {
              resetAll();
            }}
          />
        </div>

        {isLoading ? (
          <TableSkeleton
            columns={[
              "Actions", // Always show Actions column
              "Country Name",
              "Country Code",
              "Dial Code",
              "Phone Min",
              "Phone Max",
              "Status",
            ]}
            pageSize={pagination.pageSize}
          />
        ) : (
          <DataTable
            data={countriesResponse?.data?.items || []}
            columns={orderedColumns}
            keyExtractor={(country) =>
              country.strCountryGUID || Math.random().toString()
            }
            sortBy={sorting.columnKey || "strName"}
            ascending={sorting.direction === "asc"}
            onSort={handleSort}
            loading={false}
            columnVisibility={columnVisibility}
            alwaysVisibleColumns={getAlwaysVisibleColumns()}
            isTextWrapped={isTextWrapped}
            pinnedColumns={pinnedColumns}
            columnWidths={columnWidths}
            onColumnWidthsChange={(widths) => {
              setColumnWidths(widths);
              localStorage.setItem("country_column_widths", JSON.stringify(widths));
            }}
            emptyState={
              debouncedSearch ? (
                <>No countries found matching "{debouncedSearch}".</>
              ) : (
                <>No countries found. Click "Add Country" to create one.</>
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

      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Countries</DialogTitle>
            <DialogDescription>
              Upload an Excel file (.xlsx) containing countries data. Please
              ensure the file follows the required format (columns A–F):
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <p className="font-semibold mb-2">Required Excel Format:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">
                    Column A: Name (Required)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The name of the country
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Column B: Status (Required)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    True/False or 1/0
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Column C: Country Code (Optional)
                  </p>
                  <p className="text-xs text-muted-foreground">e.g., IN, US</p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Column D: Dial Code (Optional)
                  </p>
                  <p className="text-xs text-muted-foreground">e.g., +91, +1</p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Column E: Phone Min Length (Optional)
                  </p>
                  <p className="text-xs text-muted-foreground">Whole number</p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Column F: Phone Max Length (Optional)
                  </p>
                  <p className="text-xs text-muted-foreground">Whole number</p>
                </div>
              </div>
            </div>
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileImport(file);
                }}
                disabled={importCountries.isPending}
              />
            </div>
            <div className="mt-4 bg-black/10 dark:bg-white/5 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">
                <p>Example:</p>
                <pre className="bg-muted p-2 rounded mt-1 font-mono">
                  Name | Status | Code | Dial Code | Phone Min | Phone Max{"\n"}
                  ------- | ------- | ----- | --------- | --------- | ---------
                  {"\n"}
                  India | True | IN | +91 | 8 | 12{"\n"}
                  USA | True | US | +1 | 10 | 10{"\n"}
                  Nepal | False | NP | +977 | 8 | 10
                </pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CountryList;

/*
Excel Template Structure:
Column A: Name (Required) - The name of the country
Column B: Status (Required) - "Active" or "Inactive"

Example:
Name    | Status
--------|--------
India   | Active
USA     | Active
*/
