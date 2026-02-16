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
  useTaxCategories,
  useExportTaxCategories,
} from "@/hooks/api/central/use-tax-categories";
import { useActiveTaxTypes } from "@/hooks/api/central/use-tax-types";
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
import { Input } from "@/components/ui/input";

// Types
import type { TaxCategory } from "@/types/central/tax-category";

const TaxCategoryList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const HeaderIcon = useMenuIcon("tax_category_list", FileText);
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [selectedTaxType, setSelectedTaxType] = useState<string | undefined>(
    undefined
  );
  const [minPercentage, setMinPercentage] = useState<string>("");
  const [maxPercentage, setMaxPercentage] = useState<string>("");

  const defaultColumnOrder = [
    "actions",
    "strCategoryName",
    "strCategoryCode",
    "strTaxTypeName",
    "decTotalTaxPercentage",
    "status",
    "strDescription",
  ];

  // List preferences for pagination and sorting
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("taxCategory", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strCategoryName",
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
  } = useTableLayout("taxCategory", defaultColumnOrder, [], {
    actions: true,
    strCategoryCode: true,
    strCategoryName: true,
    strTaxTypeName: true,
    decTotalTaxPercentage: true,
    strDescription: true,
    status: true,
  });

  const exportTaxCategories = useExportTaxCategories();

  const { data: taxCategoriesResponse, isLoading } = useTaxCategories({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    bolIsActive: activeFilter !== null ? activeFilter : undefined,
    strTaxTypeGUID: selectedTaxType,
    minPercentage: minPercentage ? parseFloat(minPercentage) : undefined,
    maxPercentage: maxPercentage ? parseFloat(maxPercentage) : undefined,
    sortBy: sorting.columnKey || "strCategoryName",
    ascending: sorting.direction === "asc",
  });

  // Fetch active tax types for filter
  const { data: taxTypesData } = useActiveTaxTypes();
  const taxTypes = Array.isArray(taxTypesData) ? taxTypesData : [];

  useEffect(() => {
    if (taxCategoriesResponse?.data) {
      updateResponseData({
        totalCount: taxCategoriesResponse.data?.totalCount || 0,
        totalPages: taxCategoriesResponse.data?.totalPages || 1,
      });
    }
  }, [taxCategoriesResponse, updateResponseData]);

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

  const columns = useMemo<DataTableColumn<TaxCategory>[]>(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<TaxCategory>[] = [];

    // Actions column
    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (taxCategory) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            onClick={() =>
              openEditInNewTab(
                `/tax-category/${taxCategory.strTaxCategoryGUID}`
              )
            }
            title="Edit tax category"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      ),
    });

    baseColumns.push(
      {
        key: "strCategoryName",
        header: "Category Name",
        width: "180px",
        cell: (taxCategory) => (
          <div className={getTextClass()} title={taxCategory.strCategoryName}>
            <span>{taxCategory.strCategoryName}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCategoryCode",
        header: "Category Code",
        width: "180px",
        cell: (taxCategory) => (
          <div className={getTextClass()} title={taxCategory.strCategoryCode}>
            <span>{taxCategory.strCategoryCode}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTaxTypeName",
        header: "Tax Type",
        width: "150px",
        cell: (taxCategory) => (
          <div
            className={getTextClass()}
            title={taxCategory.strTaxTypeName || ""}
          >
            {taxCategory.strTaxTypeName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "decTotalTaxPercentage",
        header: "Tax %",
        width: "120px",
        cell: (taxCategory) => (
          <div className={getTextClass()}>
            {taxCategory.decTotalTaxPercentage.toFixed(2)}%
          </div>
        ),
        sortable: true,
      },
      {
        key: "status",
        header: "Status",
        width: "120px",
        cell: (taxCategory) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              taxCategory.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {taxCategory.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
      },
      {
        key: "strDescription",
        header: "Description",
        width: "250px",
        cell: (taxCategory) => (
          <div
            className={getTextClass()}
            title={taxCategory.strDescription || ""}
          >
            {taxCategory.strDescription || "-"}
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

  const handleTaxTypeChange = (value: string) => {
    setSelectedTaxType(value || undefined);
    setPagination({ pageNumber: 1 });
  };

  const handleExport = (format: "excel" | "csv") => {
    exportTaxCategories.mutate({
      format,
      filters: {
        search: debouncedSearch || undefined,
        bolIsActive: activeFilter !== null ? activeFilter : undefined,
        strTaxTypeGUID: selectedTaxType,
        minPercentage: minPercentage ? parseFloat(minPercentage) : undefined,
        maxPercentage: maxPercentage ? parseFloat(maxPercentage) : undefined,
      },
    });
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
        title="Tax Categories"
        description="Manage all tax categories in the system"
        icon={HeaderIcon}
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={exportTaxCategories.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportTaxCategories.isPending ? "Exporting..." : "Export"}
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

            <Button onClick={() => navigate("/tax-category/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tax Category
            </Button>
          </div>
        }
      />

      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-4">
          <SearchInput
            placeholder="Search tax categories..."
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
              {(selectedTaxType ||
                activeFilter !== null ||
                minPercentage ||
                maxPercentage) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {(selectedTaxType ? 1 : 0) +
                    (activeFilter !== null ? 1 : 0) +
                    (minPercentage ? 1 : 0) +
                    (maxPercentage ? 1 : 0)}
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
                    "taxCategory_column_order",
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
                Filter tax categories by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    Tax Type
                  </label>
                  <PreloadedSelect
                    options={
                      taxTypes?.map((taxType) => ({
                        value: taxType.strTaxTypeGUID,
                        label: taxType.strTaxTypeName,
                      })) || []
                    }
                    selectedValue={selectedTaxType}
                    onChange={handleTaxTypeChange}
                    placeholder="Filter by tax type"
                    clearable={true}
                    allowNone={false}
                    queryKey={["taxTypes", "active"]}
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
                    Min Percentage
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={minPercentage}
                    onChange={(e) => {
                      setMinPercentage(e.target.value);
                      setPagination({ pageNumber: 1 });
                    }}
                    placeholder="Min %"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    Max Percentage
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={maxPercentage}
                    onChange={(e) => {
                      setMaxPercentage(e.target.value);
                      setPagination({ pageNumber: 1 });
                    }}
                    placeholder="Max %"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-center sm:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTaxType(undefined);
                    setActiveFilter(null);
                    setMinPercentage("");
                    setMaxPercentage("");
                    setPagination({ pageNumber: 1 });
                  }}
                  disabled={
                    !selectedTaxType &&
                    activeFilter === null &&
                    !minPercentage &&
                    !maxPercentage
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
            "Category Name",
            "Category Code",
            "Tax Type",
            "Tax %",
            "Description",
            "Status",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={taxCategoriesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(taxCategory) =>
            taxCategory.strTaxCategoryGUID || Math.random().toString()
          }
          sortBy={sorting.columnKey || "strCategoryName"}
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
              "taxCategory_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            debouncedSearch ? (
              <>No tax categories found matching "{debouncedSearch}".</>
            ) : (
              <>
                No tax categories found. Click "Add Tax Category" to create one.
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
    </CustomContainer>
  );
};

export default TaxCategoryList;
