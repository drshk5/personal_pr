import React, { useMemo, useEffect, useCallback } from "react";
import { Edit, Plus } from "lucide-react";
import { useGroupModules } from "@/hooks/api";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useTableLayout } from "@/hooks/common";
import type { GroupModuleSimple } from "@/types/central/group-module";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

interface GroupModulesListProps {
  groupId: string;
  onEdit?: (groupModule: GroupModuleSimple) => void;
  onAdd?: () => void;
}

export const GroupModulesList: React.FC<GroupModulesListProps> = ({
  groupId,
  onEdit,
  onAdd,
}) => {
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("groupModules", {
      pagination: {
        pageNumber: 1,
        pageSize: 5,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strModuleName",
        direction: "asc",
      },
    });

  const defaultColumnOrder = ["actions", "strModuleName", "intVersion"];

  const {
    columnVisibility,
    isTextWrapped,
    pinnedColumns,
    columnOrder,
    columnWidths,
    setColumnWidths,
  } = useTableLayout("groupModulesList", defaultColumnOrder, [
    "actions",
    "strModuleName",
  ]);

  const sortBy = sorting.columnKey || "strModuleName";
  const ascending = sorting.direction === "asc";
  const isNewMode = groupId === "new" || !groupId;

  const { data, isLoading } = useGroupModules({
    strGroupGUID: isNewMode ? "" : groupId,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: sortBy,
    ascending: ascending,
  });

  const effectiveIsLoading = isNewMode ? false : isLoading;

  useEffect(() => {
    if (!data?.data) return;

    const {
      pageNumber: serverPageNumber,
      pageSize: serverPageSize,
      totalCount,
      totalPages,
    } = data.data;

    // Only update pagination if server values differ from client
    const needsPaginationUpdate =
      (serverPageNumber && serverPageNumber !== pagination.pageNumber) ||
      (serverPageSize && serverPageSize !== pagination.pageSize);

    if (needsPaginationUpdate) {
      setPagination({
        pageNumber: serverPageNumber,
        pageSize: serverPageSize,
      });
      return; // Return early to avoid double update
    }

    const computedTotalPages =
      totalCount !== undefined && serverPageSize
        ? Math.ceil(totalCount / serverPageSize)
        : undefined;

    const finalTotalPages =
      (computedTotalPages && computedTotalPages > 0
        ? computedTotalPages
        : undefined) ?? (totalPages && totalPages > 0 ? totalPages : undefined);

    updateResponseData({
      totalCount,
      totalPages: finalTotalPages,
      totalRecords: totalCount,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      setPagination({
        pageNumber,
      });
    },
    [setPagination]
  );

  const changePageSize = useCallback(
    (pageSize: number) => {
      setPagination({
        pageNumber: 1,
        pageSize,
      });
    },
    [setPagination]
  );

  const handleSortChange = useCallback(
    (columnKey: string) => {
      if (sortBy === columnKey) {
        setSorting({
          direction: ascending ? "desc" : "asc",
        });
      } else {
        setSorting({
          columnKey,
          direction: "asc",
        });
      }
      setPagination({
        pageNumber: 1,
      });
    },
    [sortBy, ascending, setSorting, setPagination]
  );

  const columns = useMemo<DataTableColumn<GroupModuleSimple>[]>(() => {
    const baseColumns: DataTableColumn<GroupModuleSimple>[] = [
      ...(onEdit
        ? [
            {
              key: "actions" as const,
              header: "Actions",
              width: "100px",
              cell: (groupModule: GroupModuleSimple) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(groupModule)}
                  title="Edit Group Module"
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-900"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              ),
            },
          ]
        : []),
      {
        key: "strModuleName",
        header: "Module",
        width: "200px",
        sortable: true,
        cell: (groupModule) => (
          <span className="font-medium">{groupModule.strModuleName}</span>
        ),
      },
      {
        key: "intVersion",
        header: "Version",
        width: "100px",
        sortable: true,
        cell: (groupModule) => (
          <Badge variant="secondary">{groupModule.intVersion}</Badge>
        ),
      },
    ];

    return baseColumns;
  }, [onEdit]);

  const orderedColumns = useMemo(() => {
    const map = new Map(columns.map((c) => [c.key, c]));
    const ordered: DataTableColumn<GroupModuleSimple>[] = [];

    columnOrder.forEach((key) => {
      const col = map.get(key);
      if (col) ordered.push(col);
    });

    columns.forEach((col) => {
      if (!columnOrder.includes(col.key)) {
        ordered.push(col);
      }
    });

    return ordered;
  }, [columns, columnOrder]);

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Group Modules</h3>
            {onAdd && (
              <Button
                type="button"
                onClick={onAdd}
                size="sm"
                disabled={isNewMode}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Module
              </Button>
            )}
          </div>
        </div>

        {effectiveIsLoading ? (
          <TableSkeleton
            columns={["Actions", "Module", "Version"]}
            pageSize={pagination.pageSize}
          />
        ) : (
          <DataTable
            columns={orderedColumns}
            data={isNewMode ? [] : data?.data?.items || []}
            columnVisibility={columnVisibility}
            isTextWrapped={isTextWrapped}
            pinnedColumns={pinnedColumns}
            columnWidths={columnWidths}
            onColumnWidthsChange={setColumnWidths}
            loading={effectiveIsLoading}
            keyExtractor={(item) => item.strGroupModuleGUID}
            sortBy={sortBy}
            ascending={ascending}
            onSort={handleSortChange}
            emptyState={
              <div className="py-4">
                {isNewMode
                  ? "Save the group first to add modules"
                  : "No modules have been added to this group yet."}
              </div>
            }
            pagination={{
              pageNumber: pagination.pageNumber,
              pageSize: pagination.pageSize,
              totalCount: pagination.totalCount || 0,
              totalPages: pagination.totalPages || 0,
              onPageChange: goToPage,
              onPageSizeChange: changePageSize,
            }}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default GroupModulesList;
