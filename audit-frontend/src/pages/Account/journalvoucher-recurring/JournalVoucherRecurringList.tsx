import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarSync, Edit, Filter, Plus } from "lucide-react";

import type { JournalVoucherRecurringProfile } from "@/types/Account/journal-voucher-recurring";

import { Actions, FormModules, ListModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";

import { format } from "date-fns";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { useUserRights } from "@/hooks";
import { useModuleUsers } from "@/hooks/api";
import { useJournalVoucherRecurringProfiles } from "@/hooks/api/Account/use-journal-voucher-recurring";

import { Badge } from "@/components/ui/badge";
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
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";

const RecurringProfileList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [selectedRepeatTypes, setSelectedRepeatTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isCreatedByDropdownOpen, setIsCreatedByDropdownOpen] = useState(false);
  const [isUpdatedByDropdownOpen, setIsUpdatedByDropdownOpen] = useState(false);

  const defaultColumnOrder = [
    "actions",
    "strProfileName",
    "strJournal_VoucherNo",
    "strStatus",
    "strRepeatType",
    "intRepeatEveryValue",
    "dStartDate",
    "dEndDate",
    "dtNextRunDate",
    "strCreatedByName",
    "dtCreatedOn",
    "strUpdatedByName",
    "dtUpdatedOn",
  ];

  const HeaderIcon = useMenuIcon(
    ListModules.JOURNAL_VOUCHER_RECURRING,
    CalendarSync
  );
  const { menuItems } = useUserRights();

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "journal-voucher-recurring-profile",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strProfileName",
        direction: "asc",
      },
    }
  );

  const sortBy = sorting.columnKey || "strProfileName";
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
    "journal_voucher_recurring_profile",
    defaultColumnOrder,
    []
  );

  const {
    data: profilesResponse,
    isLoading,
    error,
  } = useJournalVoucherRecurringProfiles({
    strProfileName: debouncedSearch || undefined,
    strRepeatType:
      selectedRepeatTypes.length > 0 ? selectedRepeatTypes[0] : undefined,
    strStatus: selectedStatuses.length > 0 ? selectedStatuses[0] : undefined,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy,
    ascending,
  });

  const { data: users, isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    isCreatedByDropdownOpen || isUpdatedByDropdownOpen
  );

  useEffect(() => {
    if (profilesResponse?.data) {
      setPagination({
        pageNumber: profilesResponse.pageNumber,
        pageSize: profilesResponse.pageSize,
        totalCount: profilesResponse.totalRecords,
        totalPages: profilesResponse.totalPages,
      });
    }
  }, [profilesResponse, setPagination]);

  const goToPage = (pageNumber: number) => {
    setPagination({
      pageNumber,
    });
  };

  const changePageSize = (pageSize: number) => {
    setPagination({
      pageNumber: 1,
      pageSize,
    });
  };

  const handleSortChange = (columnKey: string) => {
    setSorting({
      columnKey,
      direction:
        sorting.columnKey === columnKey
          ? sorting.direction === "asc"
            ? "desc"
            : "asc"
          : "asc",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="default">Active</Badge>;
      case "Paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "Completed":
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo<
    DataTableColumn<JournalVoucherRecurringProfile>[]
  >(() => {
    const baseColumns: DataTableColumn<JournalVoucherRecurringProfile>[] = [];

    if (
      canAccess(menuItems, FormModules.JOURNAL_VOUCHER_RECURRING, Actions.EDIT)
    ) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        width: "80px",
        cell: (profile) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(
                  `/journal-voucher-recurring-profile/${profile.strJournal_Voucher_RecurringProfileGUID}`
                );
              }}
              title="Edit recurring profile"
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
        key: "strProfileName",
        header: "Profile Name",
        width: "200px",
        cell: (profile) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={profile.strProfileName || ""}
          >
            {profile.strProfileName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strJournal_VoucherNo",
        header: "Journal Voucher No",
        width: "200px",
        cell: (profile) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={profile.strJournal_VoucherNo || ""}
          >
            {profile.strJournal_VoucherNo || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strStatus",
        header: "Status",
        width: "120px",
        cell: (profile) => getStatusBadge(profile.strStatus),
        sortable: true,
      },
      {
        key: "strRepeatType",
        header: "Repeat Type",
        width: "180px",
        cell: (profile) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={profile.strRepeatType || ""}
          >
            {profile.strRepeatType}
          </div>
        ),
        sortable: true,
      },
      {
        key: "intRepeatEveryValue",
        header: "Repeat Every",
        width: "180px",
        cell: (profile) => (
          <div className="whitespace-nowrap">
            {profile.intRepeatEveryValue}{" "}
            {profile.strRepeatEveryUnit ? profile.strRepeatEveryUnit : ""}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dStartDate",
        header: "Start Date",
        width: "130px",
        cell: (profile) => (
          <div className="whitespace-nowrap">
            {profile.dStartDate
              ? format(new Date(profile.dStartDate), "MMM d, yyyy")
              : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dEndDate",
        header: "End Date",
        width: "150px",
        cell: (profile) => (
          <div className="whitespace-nowrap">
            {profile.bolNeverExpires
              ? "Never Expires"
              : profile.dEndDate
                ? format(new Date(profile.dEndDate), "MMM d, yyyy")
                : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtNextRunDate",
        header: "Next Run Date",
        width: "180px",
        cell: (profile) => (
          <div className="whitespace-nowrap">
            {profile.dtNextRunDate
              ? format(new Date(profile.dtNextRunDate), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strYearName",
        header: "Year",
        width: "100px",
        cell: (profile) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={profile.strYearName || ""}
          >
            {profile.strYearName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        width: "150px",
        cell: (profile) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={profile.strCreatedByName || ""}
          >
            {profile.strCreatedByName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created Date",
        width: "180px",
        cell: (profile) => (
          <div className="whitespace-nowrap">
            {profile.dtCreatedOn
              ? format(new Date(profile.dtCreatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "150px",
        cell: (profile) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={profile.strUpdatedByName || ""}
          >
            {profile.strUpdatedByName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "180px",
        cell: (profile) => (
          <div className="whitespace-nowrap">
            {profile.dtUpdatedOn
              ? format(new Date(profile.dtUpdatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
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
    setSelectedRepeatTypes([]);
    setSelectedStatuses([]);
    setSelectedCreatedBy([]);
    setSelectedUpdatedBy([]);
  };

  const repeatTypeOptions = [
    { value: "Daily", label: "Daily" },
    { value: "Weekly", label: "Weekly" },
    { value: "Monthly", label: "Monthly" },
    { value: "Yearly", label: "Yearly" },
    { value: "Custom", label: "Custom" },
  ];

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Paused", label: "Paused" },
    { value: "Completed", label: "Completed" },
  ];

  return (
    <CustomContainer>
      <PageHeader
        title="Recurring Profiles"
        description="Manage journal voucher recurring profiles"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <WithPermission
              module={FormModules.JOURNAL_VOUCHER_RECURRING}
              action={Actions.SAVE}
              fallback={<></>}
            >
              <Button
                onClick={() => navigate("/journal-voucher-recurring/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Recurring Profile
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search profiles..."
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
              {(selectedRepeatTypes.length > 0 ||
                selectedStatuses.length > 0 ||
                selectedCreatedBy.length > 0 ||
                selectedUpdatedBy.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {selectedRepeatTypes.length +
                    selectedStatuses.length +
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
                    "journal_voucher_recurring_column_order",
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
                Filter recurring profiles by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Repeat Type
                  </label>
                  <MultiSelect
                    options={repeatTypeOptions}
                    selectedValues={selectedRepeatTypes}
                    onChange={setSelectedRepeatTypes}
                    placeholder="Filter by repeat type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <MultiSelect
                    options={statusOptions}
                    selectedValues={selectedStatuses}
                    onChange={setSelectedStatuses}
                    placeholder="Filter by status"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Created By
                  </label>
                  <MultiSelect
                    options={
                      (users || []).map((user) => ({
                        label: user.strName,
                        value: user.strUserGUID,
                      })) || []
                    }
                    selectedValues={selectedCreatedBy}
                    onChange={setSelectedCreatedBy}
                    onOpenChange={(isOpen) =>
                      setIsCreatedByDropdownOpen(isOpen)
                    }
                    placeholder="Filter by creator"
                    initialMessage=""
                    isLoading={isCreatedByDropdownOpen && isUsersLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Updated By
                  </label>
                  <MultiSelect
                    options={
                      (users || []).map((user) => ({
                        label: user.strName,
                        value: user.strUserGUID,
                      })) || []
                    }
                    selectedValues={selectedUpdatedBy}
                    onChange={setSelectedUpdatedBy}
                    onOpenChange={(isOpen) =>
                      setIsUpdatedByDropdownOpen(isOpen)
                    }
                    placeholder="Filter by updater"
                    initialMessage=""
                    isLoading={isUpdatedByDropdownOpen && isUsersLoading}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={
                    selectedRepeatTypes.length === 0 &&
                    selectedStatuses.length === 0 &&
                    selectedCreatedBy.length === 0 &&
                    selectedUpdatedBy.length === 0
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
            "Profile Name",
            "Journal Voucher No",
            "Repeat Type",
            "Repeat Every",
            "Start Date",
            "End Date",
            "Next Run Date",
            "Status",
            "Created By",
            "Created On",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable<JournalVoucherRecurringProfile>
          data={
            error
              ? []
              : Array.isArray(profilesResponse?.data)
                ? profilesResponse.data
                : []
          }
          columns={orderedColumns}
          pagination={{
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount: pagination.totalCount || 0,
            totalPages: pagination.totalPages || 0,
            onPageChange: goToPage,
            onPageSizeChange: changePageSize,
          }}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSortChange}
          pageSizeOptions={[5, 10, 20, 50]}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "journal_voucher_recurring_column_widths",
              JSON.stringify(widths)
            );
          }}
          keyExtractor={(item) => item.strJournal_Voucher_RecurringProfileGUID}
          emptyState={
            error ? (
              <>
                An error occurred loading recurring profiles. Please try again
                later.
              </>
            ) : debouncedSearch ? (
              <>No recurring profiles found matching "{debouncedSearch}".</>
            ) : (
              <>
                No recurring profiles found. Click "New Profile" to create one.
              </>
            )
          }
          maxHeight="calc(100vh - 350px)"
        />
      )}
    </CustomContainer>
  );
};

export default RecurringProfileList;
