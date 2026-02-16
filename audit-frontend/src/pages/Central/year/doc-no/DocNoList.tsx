import React, { useState, useMemo, useEffect } from "react";
import { Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";

import { useDocNos } from "@/hooks/api/Account/use-doc-no";
import { useUserRights } from "@/hooks";
import { useTableLayout } from "@/hooks/common";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { SearchInput } from "@/components/shared/search-input";

import { Actions, SpecialModules, canAccess } from "@/lib/permissions";

import type { DocNo } from "@/types/Account/doc-no";

import { WithPermission } from "@/components/ui/with-permission";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DocNoListProps {
  yearId: string;
  onEdit?: (docNo: DocNo) => void;
  onAdd?: () => void;
}

export const DocNoList: React.FC<DocNoListProps> = ({ yearId, onEdit }) => {
  const { menuItems } = useUserRights();

  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("docNo", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strDocumentTypeName",
        direction: "asc",
      },
    });

  const defaultColumnOrder = [
    "actions",
    "strDocumentTypeName",
    "strPrefix",
    "intDigit",
    "strSufix",
    "preview",
    "intStartNo",
    "strUpdatedByName",
    "dtUpdatedOn",
  ];

  const sortBy = sorting.columnKey || "strDocumentTypeName";
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
  } = useTableLayout("docNoList", defaultColumnOrder, [
    "actions",
    "strDocumentTypeName",
  ]);

  const { data, isLoading } = useDocNos({
    strYearGUID: yearId !== "new" ? yearId : undefined,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy,
    ascending,
  });

  useEffect(() => {
    if (!data) return;

    const {
      pageNumber: serverPageNumber,
      pageSize: serverPageSize,
      totalRecords,
      totalPages,
    } = data;

    if (
      (serverPageNumber && serverPageNumber !== pagination.pageNumber) ||
      (serverPageSize && serverPageSize !== pagination.pageSize)
    ) {
      setPagination({
        pageNumber: serverPageNumber,
        pageSize: serverPageSize,
      });
    }

    const computedTotalPages =
      totalRecords !== undefined && serverPageSize
        ? Math.ceil(totalRecords / serverPageSize)
        : undefined;

    updateResponseData({
      totalCount: totalRecords,
      totalPages:
        (computedTotalPages && computedTotalPages > 0
          ? computedTotalPages
          : undefined) ??
        (totalPages && totalPages > 0 ? totalPages : undefined),
      totalRecords: totalRecords,
    });
  }, [
    data,
    pagination.pageNumber,
    pagination.pageSize,
    setPagination,
    updateResponseData,
  ]);

  // Use shared SearchInput which provides its own debounce
  const handleSearchChange = (value: string) => {
    setDebouncedSearch(value);
    setPagination({
      pageNumber: 1,
    });
  };

  const handlePageChange = (page: number) => {
    setPagination({
      pageNumber: page,
    });
  };

  const handlePageSizeChange = (size: number) => {
    setPagination({
      pageSize: size,
      pageNumber: 1,
    });
  };

  const handleSort = (column: string) => {
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
  };

  const hasEditPermission = useMemo(
    () => canAccess(menuItems, SpecialModules.DOC_NO, Actions.EDIT),
    [menuItems]
  );

  // Use shared formatDate from utils (handles errors internally)
  // formatDate accepts (dateString, includeTime)

  const columns = useMemo<DataTableColumn<DocNo>[]>(() => {
    const baseColumns: DataTableColumn<DocNo>[] = [
      ...(hasEditPermission
        ? [
            {
              key: "actions" as const,
              header: "Actions",
              width: "100px",
              cell: (docNo: DocNo) => (
                <div className="flex space-x-1">
                  <WithPermission
                    module={SpecialModules.DOC_NO}
                    action={Actions.EDIT}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit && onEdit(docNo)}
                      className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-900"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </WithPermission>
                </div>
              ),
            },
          ]
        : []),
      {
        key: "strDocumentTypeName",
        header: "Document Type",
        width: "180px",
        sortable: true,
        cell: (docNo) => <span>{docNo.strDocumentTypeName}</span>,
      },
      {
        key: "strPrefix",
        header: "Prefix",
        width: "120px",
        sortable: true,
        cell: (docNo) => <span>{docNo.strPrefix || "-"}</span>,
      },
      {
        key: "intDigit",
        header: "Digits",
        width: "100px",
        sortable: true,
        cell: (docNo) => <span>{docNo.intDigit}</span>,
      },
      {
        key: "strSufix",
        header: "Suffix",
        width: "120px",
        sortable: true,
        cell: (docNo) => <span>{docNo.strSufix || "-"}</span>,
      },
      {
        key: "intStartNo",
        header: "Start No.",
        width: "120px",
        sortable: true,
        cell: (docNo) => <span>{docNo.intStartNo}</span>,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "150px",
        sortable: true,
        cell: (docNo) => <span>{docNo.strUpdatedByName || "-"}</span>,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "150px",
        sortable: true,
        cell: (docNo) => (
          <span>
            {docNo.dtUpdatedOn ? formatDate(docNo.dtUpdatedOn, true) : "-"}
          </span>
        ),
      },
    ];

    return baseColumns;
  }, [hasEditPermission, onEdit]);

  const generateExampleFormat = (docNo: DocNo): string => {
    const prefix = docNo.strPrefix || "";
    const digits = docNo.intDigit || 3;
    const suffix = docNo.strSufix || "";
    const yearName = docNo.strYearName || "2024-25";

    const getShortYear = (yearString: string): string => {
      if (yearString.includes("-")) {
        const [startYear, endYear] = yearString.split("-");
        const shortStart = startYear.slice(-2);
        const shortEnd = endYear.slice(-2);
        return `${shortStart}${shortEnd}`;
      }
      return (
        yearString.slice(-2) +
        (parseInt(yearString.slice(-2)) + 1).toString().slice(-2)
      );
    };

    const shortYear = getShortYear(yearName);
    const exampleNumber = "58".padStart(digits, "0");

    return `${prefix}/${shortYear}/${exampleNumber}${suffix}`;
  };

  const columnsWithPreview = useMemo(() => {
    const previewColumn: DataTableColumn<DocNo> = {
      key: "preview",
      header: "Format Preview",
      width: "170px",
      cell: (docNo) => (
        <span className="font-mono">{generateExampleFormat(docNo)}</span>
      ),
    };

    const index = columns.findIndex((col) => col.key === "strSufix");
    if (index !== -1) {
      return [
        ...columns.slice(0, index + 1),
        previewColumn,
        ...columns.slice(index + 1),
      ];
    }

    return [...columns, previewColumn];
  }, [columns]);

  const orderedColumns = useMemo(() => {
    const map = new Map(columnsWithPreview.map((c) => [c.key, c]));
    const ordered: DataTableColumn<DocNo>[] = [];

    columnOrder.forEach((key) => {
      const col = map.get(key);
      if (col) ordered.push(col);
    });

    columnsWithPreview.forEach((col) => {
      if (!columnOrder.includes(col.key)) {
        ordered.push(col);
      }
    });

    return ordered;
  }, [columnsWithPreview, columnOrder]);

  const resolvedTotalCount = data?.totalRecords ?? pagination.totalCount ?? 0;
  const pageSizeForTotals = pagination.pageSize || data?.pageSize || 10;
  const resolvedTotalPages =
    (data?.totalPages && data.totalPages > 0 ? data.totalPages : null) ??
    (pagination.totalPages && pagination.totalPages > 0
      ? pagination.totalPages
      : null) ??
    Math.max(1, Math.ceil(resolvedTotalCount / pageSizeForTotals));

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-4">
            Document Number Configuration
          </h3>

          <div className="mb-2 flex flex-wrap gap-2 items-center">
            <SearchInput
              placeholder="Search document numbers..."
              onSearchChange={handleSearchChange}
              className="w-full sm:max-w-md sm:flex-1"
            />

            <DraggableColumnVisibility
              columns={columnsWithPreview}
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
              onColumnOrderChange={setColumnOrder}
              onResetAll={resetAll}
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton
            columns={[
              "Actions",
              "Document Type",
              "Default",
              "Prefix",
              "Digits",
              "Suffix",
              "Format Preview",
            ]}
            pageSize={pagination.pageSize}
          />
        ) : (
          <DataTable<DocNo>
            maxHeight="calc(100vh - 350px)"
            data={data?.data || []}
            columns={orderedColumns}
            keyExtractor={(item) => item.strDocumentNoGUID}
            columnVisibility={columnVisibility}
            alwaysVisibleColumns={getAlwaysVisibleColumns()}
            isTextWrapped={isTextWrapped}
            pinnedColumns={pinnedColumns}
            columnWidths={columnWidths}
            onColumnWidthsChange={setColumnWidths}
            loading={isLoading}
            sortBy={sortBy}
            ascending={ascending}
            onSort={handleSort}
            pagination={{
              pageNumber: pagination.pageNumber,
              pageSize: pagination.pageSize,
              totalCount: resolvedTotalCount,
              totalPages: resolvedTotalPages || 1,
              onPageChange: handlePageChange,
              onPageSizeChange: handlePageSizeChange,
            }}
            emptyState={
              <div className="text-center py-10 text-muted-foreground">
                No document numbers found.
              </div>
            }
          />
        )}
      </CardContent>
    </Card>
  );
};
