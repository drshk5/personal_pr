import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Edit, Filter, Plus } from "lucide-react";

import type { Unit } from "@/types/Account/unit";

import { Actions, FormModules, ListModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";

import { format } from "date-fns";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { useUserRights } from "@/hooks";
import { useActiveUsers } from "@/hooks/api";
import { useUnits } from "@/hooks/api/Account/use-units";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/select/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { WithPermission } from "@/components/ui/with-permission";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";

const UnitList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [selectedActiveStatus, setSelectedActiveStatus] = useState<
    boolean | null
  >(null);
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const defaultColumnOrder = [
    "actions",
    "strUnitName",
    "bolIsActive",
    "dtCreatedOn",
    "strCreatedByName",
    "dtUpdatedOn",
    "strUpdatedByName",
  ];

  const HeaderIcon = useMenuIcon(ListModules.UNIT, Box);
  const { menuItems } = useUserRights();

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("unit", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strUnitName",
        direction: "asc",
      },
    });

  const {
    data: unitsResponse,
    isLoading,
    error,
  } = useUnits({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch,
    sortBy: sorting.columnKey || undefined,
    ascending: sorting.direction === "asc",
    bolIsActive: selectedActiveStatus || undefined,
    strCreatedByGUIDs:
      selectedCreatedBy.length > 0 ? selectedCreatedBy.join(",") : undefined,
    strUpdatedByGUIDs:
      selectedUpdatedBy.length > 0 ? selectedUpdatedBy.join(",") : undefined,
  });

  const { data: users, isLoading: isUsersLoading } = useActiveUsers();

  useEffect(() => {
    if (unitsResponse?.data && Array.isArray(unitsResponse.data)) {
      updateResponseData({
        totalCount: unitsResponse.totalRecords || 0,
        totalPages: unitsResponse.totalPages || 0,
      });
    }
  }, [
    unitsResponse?.data,
    unitsResponse?.totalRecords,
    unitsResponse?.totalPages,
    updateResponseData,
  ]);

  const units = useMemo(() => {
    if (!unitsResponse?.data) {
      return [];
    }
    return Array.isArray(unitsResponse.data) ? unitsResponse.data : [];
  }, [unitsResponse?.data]);

  const goToPage = useCallback(
    (page: number) => {
      setPagination({ pageNumber: page });
    },
    [setPagination]
  );

  const changePageSize = useCallback(
    (size: number) => {
      setPagination({ pageSize: size, pageNumber: 1 });
    },
    [setPagination]
  );

  const handleSortChange = useCallback(
    (columnKey: string) => {
      setSorting({
        columnKey,
        direction:
          sorting.columnKey === columnKey
            ? sorting.direction === "asc"
              ? "desc"
              : "asc"
            : "asc",
      });
    },
    [sorting.columnKey, sorting.direction, setSorting]
  );

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const sortBy = sorting.columnKey || "strUnitName";
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
  } = useTableLayout("unit", defaultColumnOrder, [
    "strUnitGUID",
    "strOrganizationGUID",
    "strCreatedByGUID",
    "strUpdatedByGUID",
  ]);

  const columns = useMemo<DataTableColumn<Unit>[]>(() => {
    const baseColumns: DataTableColumn<Unit>[] = [];

    if (
      canAccess(menuItems, FormModules.UNIT, Actions.EDIT) ||
      canAccess(menuItems, FormModules.UNIT, Actions.VIEW)
    ) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        cell: (unit) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(`/unit/${unit.strUnitGUID}`);
              }}
              title="Edit unit"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        ),
        sortable: false,
      });
    }

    baseColumns.push(
      {
        key: "strUnitName",
        header: "Unit Name",
        cell: (unit) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={unit.strUnitName || ""}
          >
            {unit.strUnitName}
          </div>
        ),
        width: "200px",
        sortable: true,
      },
      {
        key: "bolIsActive",
        header: "Status",
        cell: (unit) => (
          <div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                unit.bolIsActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {unit.bolIsActive ? "Active" : "Inactive"}
            </span>
          </div>
        ),
        width: "120px",
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created Date",
        cell: (unit) => (
          <div className="whitespace-nowrap">
            {unit.dtCreatedOn
              ? format(new Date(unit.dtCreatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        width: "180px",
        sortable: true,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        cell: (unit) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={unit.strCreatedByName || ""}
          >
            {unit.strCreatedByName || "-"}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated Date",
        cell: (unit) => (
          <div className="whitespace-nowrap">
            {unit.dtUpdatedOn
              ? format(new Date(unit.dtUpdatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        width: "180px",
        sortable: true,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        cell: (unit) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={unit.strUpdatedByName || ""}
          >
            {unit.strUpdatedByName || "-"}
          </div>
        ),
        width: "150px",
        sortable: true,
      }
    );

    return baseColumns;
  }, [menuItems, isTextWrapped, openEditInNewTab]);

  // Apply column ordering
  const orderedColumns = useMemo(() => {
    if (!columns || columns.length === 0) return columns;

    return [...columns].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.key);
      const bIndex = columnOrder.indexOf(b.key);

      // If a column is not in columnOrder, put it at the end
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [columns, columnOrder]);

  const clearFilters = () => {
    setDebouncedSearch("");
    setSelectedActiveStatus(null);
    setSelectedCreatedBy([]);
    setSelectedUpdatedBy([]);
  };

  if (error) {
    return (
      <CustomContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading units</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
          </div>
        </div>
      </CustomContainer>
    );
  }

  return (
    <CustomContainer>
      <PageHeader
        title="Units"
        description="Manage measurement units"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <WithPermission
              module={FormModules.UNIT}
              action={Actions.SAVE}
              fallback={<></>}
            >
              <Button onClick={() => navigate("/unit/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Unit
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search units..."
            onSearchChange={setDebouncedSearch}
            className="w-full sm:max-w-md sm:flex-1"
          />

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 justify-center h-9 text-xs sm:text-sm"
              size="sm"
            >
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span>Filters</span>
              {(selectedActiveStatus !== null ||
                selectedCreatedBy.length > 0 ||
                selectedUpdatedBy.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {(selectedActiveStatus !== null ? 1 : 0) +
                    selectedCreatedBy.length +
                    selectedUpdatedBy.length}
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
                    "unit_column_order",
                    JSON.stringify(order)
                  );
                }}
                onResetAll={() => {
                  resetAll();
                }}
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
                Filter units by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={
                      selectedActiveStatus === null
                        ? "all"
                        : selectedActiveStatus
                          ? "true"
                          : "false"
                    }
                    onValueChange={(value: string) => {
                      if (value === "true") {
                        setSelectedActiveStatus(true);
                      } else if (value === "false") {
                        setSelectedActiveStatus(false);
                      } else {
                        setSelectedActiveStatus(null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Created By
                  </label>
                  <MultiSelect
                    options={
                      users?.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName,
                      })) || []
                    }
                    selectedValues={selectedCreatedBy}
                    onChange={setSelectedCreatedBy}
                    placeholder="Filter by creator"
                    isLoading={isUsersLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Updated By
                  </label>
                  <MultiSelect
                    options={
                      users?.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName,
                      })) || []
                    }
                    selectedValues={selectedUpdatedBy}
                    onChange={setSelectedUpdatedBy}
                    placeholder="Filter by updater"
                    isLoading={isUsersLoading}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton
          columns={columns.map((c) => ({
            header: String(c.header),
            width: c.width,
          }))}
        />
      ) : (
        <DataTable<Unit>
          data={error ? [] : units}
          columns={orderedColumns}
          pagination={{
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount: pagination.totalCount || 0,
            totalPages: pagination.totalPages || 0,
            onPageChange: goToPage,
            onPageSizeChange: changePageSize,
          }}
          sortBy={sortBy || undefined}
          ascending={ascending}
          onSort={handleSortChange}
          pageSizeOptions={[5, 10, 20, 50]}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem("unit_column_widths", JSON.stringify(widths));
          }}
          keyExtractor={(unit) => unit.strUnitGUID}
          emptyState={
            error ? (
              <>An error occurred loading units. Please try again later.</>
            ) : debouncedSearch ? (
              <>No units found matching "{debouncedSearch}".</>
            ) : (
              <>No units found. Click "New Unit" to create one.</>
            )
          }
          maxHeight="calc(100vh - 350px)"
        />
      )}
    </CustomContainer>
  );
};

export default UnitList;
