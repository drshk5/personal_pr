import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import {
  useCurrencyTypes,
  useExportCurrencyTypes,
} from "@/hooks/api/central/use-currency-types";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useMenuIcon, useTableLayout } from "@/hooks/common";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
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
import {
  Edit,
  Plus,
  Search,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  X,
} from "lucide-react";
import type { CurrencyType } from "@/types/central/currency-type";

const CurrencyTypeList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const HeaderIcon = useMenuIcon("currency_type_list", DollarSign);
  const debouncedSearch = useDebounce(search, 300);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [statusValue, setStatusValue] = useState<string>("all");

  const defaultColumnOrder = ["actions", "strName", "strCountryName", "bolIsActive"];

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("currencyType", {
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
  } = useTableLayout(
    "currencyType",
    defaultColumnOrder,
    [],
    {
      actions: true,
      strName: true,
      strCountryName: true,
      bolIsActive: true,
    }
  );

  const exportCurrencyTypes = useExportCurrencyTypes();

  const { data: currencyTypesResponse, isLoading } = useCurrencyTypes({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    bolIsActive: activeFilter,
    sortBy: sorting.columnKey || "strName",
    ascending: sorting.direction === "asc",
  });

  useEffect(() => {
    if (currencyTypesResponse?.data) {
      updateResponseData({
        totalCount: currencyTypesResponse.data?.totalCount || 0,
        totalPages: currencyTypesResponse.data?.totalPages || 1,
      });
    }
  }, [currencyTypesResponse, isLoading, updateResponseData]);

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

  const handleExport = (format: "excel" | "csv") => {
    exportCurrencyTypes.mutate({ format });
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<CurrencyType>[] = [];

    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (currencyType) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              openEditInNewTab(
                `/currency-type/${currencyType.strCurrencyTypeGUID}`
              );
            }}
            title="Edit currency type"
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
        header: "Currency Name",
        width: "180px",
        cell: (currencyType) => (
          <div className={getTextClass()} title={currencyType.strName}>
            <span className="font-medium">{currencyType.strName}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCountryName",
        header: "Country",
        width: "150px",
        cell: (currencyType) => (
          <div className={getTextClass()} title={currencyType.strCountryName || "—"}>
            <span className="text-foreground">
              {currencyType.strCountryName || "—"}
            </span>
          </div>
        ),
        sortable: false,
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "100px",
        cell: (currencyType) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              currencyType.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {currencyType.bolIsActive ? "Active" : "Inactive"}
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
    setPagination({
      pageNumber: 1,
    });
  };

  const handleClearSearch = () => {
    setSearch("");
    setPagination({
      pageNumber: 1,
    });
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
      pageNumber: 1,
    });
  };

  return (
    <CustomContainer>
      <PageHeader
        title="Currency Types"
        description="Manage your currency type information"
        icon={HeaderIcon}
        actions={
          <div className="flex gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={exportCurrencyTypes.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportCurrencyTypes.isPending ? "Exporting..." : "Export"}
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

            {/* Add Currency Type Button */}
            <Button onClick={() => navigate("/currency-type/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Currency Type
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search currency types..."
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
            localStorage.setItem("currencyType_column_order", JSON.stringify(order));
          }}
          onResetAll={resetAll}
        />
      </div>

      {isLoading ? (
        <TableSkeleton
          columns={["Actions", "Currency Name", "Country", "Status"]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={currencyTypesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(currencyType) =>
            currencyType.strCurrencyTypeGUID || Math.random().toString()
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
            localStorage.setItem("currencyType_column_widths", JSON.stringify(widths));
          }}
          emptyState={
            debouncedSearch ? (
              <>No currency types found matching "{debouncedSearch}".</>
            ) : (
              <>
                No currency types found. Click "Add Currency Type" to create
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
    </CustomContainer>
  );
};

export default CurrencyTypeList;
