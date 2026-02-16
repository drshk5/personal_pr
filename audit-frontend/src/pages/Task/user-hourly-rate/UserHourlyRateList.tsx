import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Plus, Filter, DollarSign } from "lucide-react";

import type { UserHourlyRate } from "@/types";

import { Actions, ListModules, FormModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";

import { format } from "date-fns";

import { useUserHourlyRates } from "@/hooks";
import { useUserRights } from "@/hooks";
import { useModuleUsers } from "@/hooks/api/central/use-users";
import { useActiveBoards } from "@/hooks/api/task/use-board";

import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useTableLayout } from "@/hooks/common";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/select/multi-select";
import { WithPermission } from "@/components/ui/with-permission";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

import { SearchInput } from "@/components/shared/search-input";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";

const UserHourlyRateList = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);

  const { menuItems } = useUserRights();

  const HeaderIcon = useMenuIcon(ListModules.USER_HOURLY_RATE, DollarSign);

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "user_hourly_rate",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "dEffectiveFrom",
        direction: "desc",
      },
    }
  );

  const sortBy = sorting.columnKey || "dEffectiveFrom";
  const ascending = sorting.direction === "asc";

  const defaultColumnOrder = [
    "actions",
    "strUserName",
    "strBoardName",
    "strCurrencyGUID",
    "decHourlyRate",
    "dEffectiveFrom",
    "dEffectiveTo",
    "strCreatedByGUID",
    "dtCreatedOn",
    "strUpdatedByGUID",
    "dtUpdatedOn",
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
  } = useTableLayout("user_hourly_rate_columns", defaultColumnOrder, [
    "actions",
  ]);

  const {
    data: hourlyRatesData,
    isLoading,
    error,
  } = useUserHourlyRates({
    search: debouncedSearch,
    strUserGUID: selectedUsers.length > 0 ? selectedUsers.join(",") : undefined,
    strBoardGUID: selectedBoards.length > 0 ? selectedBoards.join(",") : undefined,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy,
    ascending,
  });

  const { data: users, isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    userDropdownOpen
  );
  const { data: boardsResponse, isLoading: isBoardsLoading } = useActiveBoards(
    undefined,
    { enabled: boardDropdownOpen }
  );

  const goToPage = (pageNumber: number) => {
    setPagination({
      pageNumber,
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({
      pageSize: newSize,
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

  const clearFilters = () => {
    setDebouncedSearch("");
    setSelectedUsers([]);
    setSelectedBoards([]);
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns: DataTableColumn<UserHourlyRate>[] = useMemo(() => {
    return [
      ...(canAccess(menuItems, FormModules.USER_HOURLY_RATE, Actions.EDIT)
        ? [
            {
              key: "actions",
              header: "Actions",
              width: "80px",
              cell: (rate: UserHourlyRate) => (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditInNewTab(
                        `/user-hourly-rate/${rate.strUserHourlyRateGUID}`
                      );
                    }}
                    className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ),
              sortable: false,
            },
          ]
        : []),
      {
        key: "strUserName",
        header: "User",
        width: "180px",
        cell: (rate) => rate.strUserName || "-",
        sortable: true,
      },
      {
        key: "strBoardName",
        header: "Project",
        width: "180px",
        cell: (rate) => rate.strBoardName || "-",
        sortable: true,
      },
      {
        key: "strCurrencyGUID",
        header: "Currency",
        width: "180px",
        cell: (rate) => rate.strCurrencyName || "-",
        sortable: true,
      },
      {
        key: "decHourlyRate",
        header: "Hourly Rate",
        width: "140px",
        cell: (rate) => (
          <div className="text-right">{rate.decHourlyRate.toFixed(2)}</div>
        ),
        sortable: true,
      },
      {
        key: "dEffectiveFrom",
        header: "Effective From",
        width: "150px",
        cell: (rate) =>
          rate.dEffectiveFrom
            ? format(new Date(rate.dEffectiveFrom), "MMM d, yyyy")
            : "-",
        sortable: true,
      },
      {
        key: "dEffectiveTo",
        header: "Effective To",
        width: "150px",
        cell: (rate) =>
          rate.dEffectiveTo
            ? format(new Date(rate.dEffectiveTo), "MMM d, yyyy")
            : "Active",
        sortable: true,
      },
      {
        key: "strCreatedByGUID",
        header: "Created By",
        width: "160px",
        cell: (rate) => rate.strCreatedByName || "-",
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "180px",
        cell: (rate) =>
          rate.dtCreatedOn
            ? format(new Date(rate.dtCreatedOn), "MMM d, yyyy, h:mm a")
            : "-",
        sortable: true,
      },
      {
        key: "strUpdatedByGUID",
        header: "Updated By",
        width: "160px",
        cell: (rate) => rate.strUpdatedByName || "-",
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "180px",
        cell: (rate) =>
          rate.dtUpdatedOn
            ? format(new Date(rate.dtUpdatedOn), "MMM d, yyyy, h:mm a")
            : "-",
        sortable: true,
      },
    ];
  }, [menuItems, openEditInNewTab]);

  // Apply column ordering
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
        title="User Hourly Rates"
        description="View and manage user hourly rates for different projects"
        icon={HeaderIcon}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <WithPermission
              module={FormModules.USER_HOURLY_RATE}
              action={Actions.SAVE}
              fallback={<></>}
            >
              <Button
                className="w-full sm:w-auto"
                onClick={() => navigate("/user-hourly-rate/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Hourly Rate
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search hourly rates..."
            onSearchChange={setDebouncedSearch}
            className="w-full sm:max-w-md sm:flex-1"
          />

          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 justify-center h-9 text-xs sm:text-sm w-full sm:w-auto"
              size="sm"
            >
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span>Filters</span>
              {(selectedUsers.length > 0 || selectedBoards.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {selectedUsers.length + selectedBoards.length}
                </span>
              )}
            </Button>

            <div className="h-9 w-full sm:w-auto">
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
                    "user_hourly_rate_column_order",
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
                Filter user hourly rates by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">User</label>
                  <MultiSelect
                    placeholder="Filter by user"
                    options={
                      users?.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName,
                      })) || []
                    }
                    selectedValues={selectedUsers}
                    onChange={setSelectedUsers}
                    onOpenChange={setUserDropdownOpen}
                    isLoading={userDropdownOpen && isUsersLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Project
                  </label>
                  <MultiSelect
                    placeholder="Filter by project"
                    options={
                      boardsResponse?.map((board) => ({
                        value: board.strBoardGUID,
                        label: board.strName,
                      })) || []
                    }
                    selectedValues={selectedBoards}
                    onChange={setSelectedBoards}
                    onOpenChange={setBoardDropdownOpen}
                    isLoading={boardDropdownOpen && isBoardsLoading}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={
                    selectedUsers.length === 0 && selectedBoards.length === 0
                  }
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
            "User",
            "Project",
            "Currency",
            "Organization",
            "Year",
            "Hourly Rate",
            "Effective From",
            "Effective To",
            "Created By",
            "Created On",
            "Updated By",
            "Updated On",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable<UserHourlyRate>
          data={error ? [] : (hourlyRatesData?.data as UserHourlyRate[]) || []}
          columns={orderedColumns}
          pagination={{
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount: pagination.totalCount || 0,
            totalPages: pagination.totalPages || 0,
            onPageChange: goToPage,
            onPageSizeChange: handlePageSizeChange,
          }}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSort}
          pageSizeOptions={[5, 10, 20, 50]}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          keyExtractor={(item) => item.strUserHourlyRateGUID}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "user_hourly_rate_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            error ? (
              <>
                An error occurred loading user hourly rates. Please try again
                later.
              </>
            ) : debouncedSearch ? (
              <>No hourly rates found matching "{debouncedSearch}".</>
            ) : (
              <>
                No user hourly rates found. Click "New Hourly Rate" to create
                one.
              </>
            )
          }
          maxHeight="calc(100vh - 350px)"
        />
      )}
    </CustomContainer>
  );
};

export default UserHourlyRateList;
