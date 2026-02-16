import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  FileText,
  Plus,
  Download,
  FileSpreadsheet,
  Filter,
} from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import {
  useTaxTypes,
  useExportTaxTypes,
} from "@/hooks/api/central/use-tax-types";
import { useActiveCountries } from "@/hooks/api/central/use-countries";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";

// UI Components
import { Button } from "@/components/ui/button";
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
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
import type { TaxType } from "@/types/central/tax-type";

const TaxTypeList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const HeaderIcon = useMenuIcon("tax_type_list", FileText);
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(
    undefined
  );
  const [compoundFilter, setCompoundFilter] = useState<boolean | null>(null);

  const defaultColumnOrder = [
    "actions",
    "strTaxTypeCode",
    "strTaxTypeName",
    "strCountryName",
    "status",
    "bolIsCompound",
    "strDescription",
  ];

  // List preferences for pagination and sorting
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("taxType", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strTaxTypeName",
        direction: "asc",
      },
    });

  // Column visibility
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
  } = useTableLayout("taxType", defaultColumnOrder, [], {
    actions: true,
    strTaxTypeCode: true,
    strTaxTypeName: true,
    strCountryName: true,
    status: true,
    bolIsCompound: true,
    strDescription: true,
  });

  const exportTaxTypes = useExportTaxTypes();

  const { data: taxTypesResponse, isLoading } = useTaxTypes({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    bolIsActive: activeFilter !== null ? activeFilter : undefined,
    strCountryGUID: selectedCountry,
    bolIsCompound: compoundFilter !== null ? compoundFilter : undefined,
    sortBy: sorting.columnKey || "strTaxTypeName",
    ascending: sorting.direction === "asc",
  });

  // Fetch active countries for filter
  const { data: countries } = useActiveCountries();

  useEffect(() => {
    if (taxTypesResponse?.data) {
      updateResponseData({
        totalCount: taxTypesResponse.data?.totalCount || 0,
        totalPages: taxTypesResponse.data?.totalPages || 1,
      });
    }
  }, [taxTypesResponse, updateResponseData]);

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

  const columns = useMemo<DataTableColumn<TaxType>[]>(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<TaxType>[] = [];

    // Actions column
    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (taxType) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            onClick={() =>
              openEditInNewTab(`/tax-type/${taxType.strTaxTypeGUID}`)
            }
            title="Edit tax type"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      ),
    });

    baseColumns.push(
      {
        key: "strTaxTypeCode",
        header: "Tax Code",
        width: "150px",
        cell: (taxType) => (
          <div className={getTextClass()} title={taxType.strTaxTypeCode}>
            <span>{taxType.strTaxTypeCode}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTaxTypeName",
        header: "Tax Type Name",
        width: "180px",
        cell: (taxType) => (
          <div className={getTextClass()} title={taxType.strTaxTypeName}>
            <span>{taxType.strTaxTypeName}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCountryName",
        header: "Country",
        width: "150px",
        cell: (taxType) => (
          <div className={getTextClass()} title={taxType.strCountryName || ""}>
            {taxType.strCountryName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "status",
        header: "Status",
        width: "120px",
        cell: (taxType) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              taxType.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {taxType.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
      },
      {
        key: "bolIsCompound",
        header: "Compound Tax",
        width: "180px",
        cell: (taxType) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              taxType.bolIsCompound
                ? "bg-blue-200 text-blue-800"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {taxType.bolIsCompound ? "Yes" : "No"}
          </span>
        ),
        sortable: true,
      },
      {
        key: "strDescription",
        header: "Description",
        width: "250px",
        cell: (taxType) => (
          <div className={getTextClass()} title={taxType.strDescription || ""}>
            {taxType.strDescription || "-"}
          </div>
        ),
      }
    );

    return baseColumns;
  }, [openEditInNewTab, isTextWrapped]);

  const handleStatusFilterChange = (value: string) => {
    if (value === "all") {
      setActiveFilter(null);
    } else if (value === "active") {
      setActiveFilter(true);
    } else if (value === "inactive") {
      setActiveFilter(false);
    }
    setPagination({ pageNumber: 1 });
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value || undefined);
    setPagination({ pageNumber: 1 });
  };

  const handleCompoundFilterChange = (value: string) => {
    if (value === "all") {
      setCompoundFilter(null);
    } else if (value === "compound") {
      setCompoundFilter(true);
    } else if (value === "simple") {
      setCompoundFilter(false);
    }
    setPagination({ pageNumber: 1 });
  };

  const handleExport = (format: "excel" | "csv") => {
    exportTaxTypes.mutate({ format });
  };

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
        title="Tax Types"
        description="Manage all tax types in the system"
        icon={HeaderIcon}
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exportTaxTypes.isPending}>
                  <Download className="mr-2 h-4 w-4" />
                  {exportTaxTypes.isPending ? "Exporting..." : "Export"}
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

            <Button onClick={() => navigate("/tax-type/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tax Type
            </Button>
          </div>
        }
      />

      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-4">
          <SearchInput
            placeholder="Search tax types..."
            onSearchChange={setDebouncedSearch}
            className="w-full sm:max-w-md"
          />

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-row sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 justify-center h-9 text-xs sm:text-sm"
              size="sm"
            >
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span>Filters</span>
              {(selectedCountry ||
                activeFilter !== null ||
                compoundFilter !== null) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {(selectedCountry ? 1 : 0) +
                    (activeFilter !== null ? 1 : 0) +
                    (compoundFilter !== null ? 1 : 0)}
                </span>
              )}
            </Button>

            <div className="h-9">
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
                  localStorage.setItem(
                    "taxType_column_order",
                    JSON.stringify(order)
                  );
                }}
                onResetAll={resetAll}
              />
            </div>
          </div>
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
                Filter tax types by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    Country
                  </label>
                  <PreloadedSelect
                    options={
                      countries?.map((country) => ({
                        value: country.strCountryGUID,
                        label: country.strName,
                      })) || []
                    }
                    selectedValue={selectedCountry}
                    onChange={handleCountryChange}
                    placeholder="Filter by country"
                    clearable={true}
                    allowNone={false}
                    queryKey={["countries", "active"]}
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={
                      activeFilter === null
                        ? "all"
                        : activeFilter
                          ? "active"
                          : "inactive"
                    }
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    Tax Type
                  </label>
                  <Select
                    value={
                      compoundFilter === null
                        ? "all"
                        : compoundFilter
                          ? "compound"
                          : "simple"
                    }
                    onValueChange={handleCompoundFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="compound">Compound</SelectItem>
                      <SelectItem value="simple">Simple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex justify-center sm:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCountry(undefined);
                    setActiveFilter(null);
                    setCompoundFilter(null);
                    setPagination({ pageNumber: 1 });
                  }}
                  disabled={
                    !selectedCountry &&
                    activeFilter === null &&
                    compoundFilter === null
                  }
                  className="w-full sm:w-auto"
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
            "Tax Code",
            "Tax Type Name",
            "Country",
            "Compound Tax",
            "Description",
            "Status",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={taxTypesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(taxType) =>
            taxType.strTaxTypeGUID || Math.random().toString()
          }
          sortBy={sorting.columnKey || "strTaxTypeName"}
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
            localStorage.setItem(
              "taxType_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            debouncedSearch ? (
              <>No tax types found matching "{debouncedSearch}".</>
            ) : (
              <>No tax types found. Click "Add Tax Type" to create one.</>
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

export default TaxTypeList;
