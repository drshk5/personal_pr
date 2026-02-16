import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Edit, Plus } from "lucide-react";

import { useTaxRates } from "@/hooks/api/central/use-tax-rates";
import { useTableLayout, useListPreferences } from "@/hooks/common";

import type { TaxRate } from "@/types/central/tax-rate";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/shared/search-input";

interface TaxRatesListProps {
  onEdit?: (taxRate: TaxRate) => void;
  onAdd?: () => void;
  disabled?: boolean;
  strTaxCategoryGUID?: string;
}

export const TaxRatesList: React.FC<TaxRatesListProps> = ({
  onEdit,
  onAdd,
  disabled = false,
  strTaxCategoryGUID,
}) => {
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const defaultColumnOrder = [
    "actions",
    "strTaxRateName",
    "strTaxRateCode",
    "decTaxPercentage",
    "strTaxTypeName",
    "strTaxCategoryName",
    "strScheduleName",
    "bolIsActive",
    "strStateName",
    "intDisplayOrder",
    "dtEffectiveFrom",
    "dtEffectiveTo",
    "strCreatedByName",
    "dtCreatedOn",
    "strUpdatedByName",
    "dtUpdatedOn",
  ];

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("taxRates", {
      pagination: {
        pageNumber: 1,
        pageSize: 5,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strTaxRateName",
        direction: "desc",
      },
    });

  const sortBy = sorting.columnKey || "strTaxRateName";
  const ascending = sorting.direction === "asc";

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
    "taxRatesList",
    defaultColumnOrder,
    [],
    {
      actions: true,
      strTaxRateName: true,
      strTaxRateCode: true,
      decTaxPercentage: true,
      strTaxTypeName: true,
      strTaxCategoryName: true,
      strScheduleName: true,
      strStateName: true,
      intDisplayOrder: true,
      dtEffectiveFrom: true,
      dtEffectiveTo: true,
      bolIsActive: true,
      strCreatedByName: true,
      dtCreatedOn: true,
      strUpdatedByName: true,
      dtUpdatedOn: true,
    }
  );

  const { data, isLoading } = useTaxRates({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy: sortBy,
    ascending: ascending,
    strTaxCategoryGUID: strTaxCategoryGUID,
  });

  useEffect(() => {
    if (data?.data) {
      updateResponseData({
        totalCount: data.data.totalCount,
        totalPages: data.data.totalPages,
      });
    }
  }, [data, updateResponseData]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setDebouncedSearch(value);
      setPagination({ pageNumber: 1 });
    },
    [setPagination]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setPagination({
        pageNumber: page,
      });
    },
    [setPagination]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPagination({
        pageSize: size,
        pageNumber: 1,
      });
    },
    [setPagination]
  );

  const handleSort = useCallback(
    (column: string) => {
      if (sortBy === column) {
        setSorting({
          direction: ascending ? "desc" : "asc",
        });
      } else {
        setSorting({
          columnKey: column,
          direction: "asc",
        });
      }
      setPagination({
        pageNumber: 1,
      });
    },
    [sortBy, ascending, setSorting, setPagination]
  );

  const columns = useMemo<DataTableColumn<TaxRate>[]>(() => {
    const baseColumns: DataTableColumn<TaxRate>[] = [
      {
        key: "strTaxRateName",
        header: "Tax Rate Name",
        width: "150px",
        sortable: true,
        cell: (taxRate) => (
          <span>{taxRate.strTaxRateName}</span>
        ),
      },
      {
        key: "strTaxRateCode",
        header: "Code",
        width: "120px",
        sortable: true,
        cell: (taxRate) => (
          <span>{taxRate.strTaxRateCode}</span>
        ),
      },
      {
        key: "decTaxPercentage",
        header: "Tax %",
        width: "100px",
        sortable: true,
        cell: (taxRate) => (
          <span className="text-right">
            {taxRate.decTaxPercentage.toFixed(2)}%
          </span>
        ),
      },
      {
        key: "strTaxTypeName",
        header: "Tax Type",
        width: "120px",
        sortable: false,
        cell: (taxRate) => (
          <span >{taxRate.strTaxTypeName || "-"}</span>
        ),
      },
      {
        key: "strTaxCategoryName",
        header: "Tax Category",
        width: "140px",
        sortable: false,
        cell: (taxRate) => (
          <span >{taxRate.strTaxCategoryName || "-"}</span>
        ),
      },
      {
        key: "strScheduleName",
        header: "Schedule",
        width: "140px",
        sortable: false,
        cell: (taxRate) => (
          <span>{taxRate.strScheduleName || "-"}</span>
        ),
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "100px",
        sortable: true,
        cell: (taxRate) => (
         <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              taxRate.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {taxRate.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "strStateName",
        header: "State",
        width: "120px",
        sortable: false,
        cell: (taxRate) => (
          <span >{taxRate.strStateName || "All States"}</span>
        ),
      },
      {
        key: "intDisplayOrder",
        header: "Display Order",
        width: "150px",
        sortable: true,
        cell: (taxRate) => (
          <span className="text-center">{taxRate.intDisplayOrder}</span>
        ),
      },
      {
        key: "dtEffectiveFrom",
        header: "Effective From",
        width: "150px",
        sortable: true,
        cell: (taxRate) => (
          <span >
            {taxRate.dtEffectiveFrom
              ? new Date(taxRate.dtEffectiveFrom).toLocaleDateString()
              : "-"}
          </span>
        ),
      },
      {
        key: "dtEffectiveTo",
        header: "Effective To",
        width: "130px",
        sortable: true,
        cell: (taxRate) => (
          <span >
            {taxRate.dtEffectiveTo
              ? new Date(taxRate.dtEffectiveTo).toLocaleDateString()
              : "-"}
          </span>
        ),
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        width: "130px",
        sortable: false,
        cell: (taxRate) => (
          <span >{taxRate.strCreatedByName || "-"}</span>
        ),
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "130px",
        sortable: true,
        cell: (taxRate) => (
          <span >
            {taxRate.dtCreatedOn
              ? new Date(taxRate.dtCreatedOn).toLocaleDateString()
              : "-"}
          </span>
        ),
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "140px",
        sortable: false,
        cell: (taxRate) => (
          <span >{taxRate.strUpdatedByName || "-"}</span>
        ),
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "140px",
        sortable: true,
        cell: (taxRate) => (
          <span >
            {taxRate.dtUpdatedOn
              ? new Date(taxRate.dtUpdatedOn).toLocaleDateString()
              : "-"}
          </span>
        ),
      },
    ];

    if (onEdit && !disabled) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        width: "100px",
        sortable: false,
        cell: (taxRate) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(taxRate)}
              title="Edit Tax Rate"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ),
      });
    }

    return baseColumns;
  }, [onEdit, disabled]);

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

  const taxRates = data?.data?.items || [];

  return (
    <Card className={disabled ? "opacity-60 pointer-events-none" : ""}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Tax Rates</h3>
              <p className="text-sm text-muted-foreground">
                Manage tax rates for this category
              </p>
            </div>
            {onAdd && (
              <Button onClick={onAdd} size="sm" disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tax Rate
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <SearchInput
              placeholder="Search tax rates..."
              onSearchChange={handleSearchChange}
              className="w-full max-w-sm"
            />
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
                localStorage.setItem("taxRatesList_column_order", JSON.stringify(order));
              }}
              onResetAll={resetAll}
            />
          </div>

          {isLoading ? (
            <TableSkeleton
              columns={orderedColumns
                .filter((col) => columnVisibility[col.key] !== false)
                .map((col) => ({ header: String(col.header), width: col.width }))}
              pageSize={pagination.pageSize}
            />
          ) : (
            <DataTable<TaxRate>
              columns={orderedColumns.filter((col) => columnVisibility[col.key] !== false)}
              data={taxRates}
              keyExtractor={(taxRate) => taxRate.strTaxRateGUID}
              sortBy={sortBy}
              ascending={ascending}
              onSort={handleSort}
              pagination={{
                pageNumber: pagination.pageNumber,
                pageSize: pagination.pageSize,
                totalCount: pagination.totalCount || 0,
                totalPages: pagination.totalPages || 0,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
               }}
              isTextWrapped={isTextWrapped}
              pinnedColumns={pinnedColumns}
              columnWidths={columnWidths}
              onColumnWidthsChange={(widths) => {
                setColumnWidths(widths);
                localStorage.setItem("taxRatesList_column_widths", JSON.stringify(widths));
              }}
              emptyState={
                <div className="py-4">
                  No tax rates found for this category.
                </div>
              }
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaxRatesList;
