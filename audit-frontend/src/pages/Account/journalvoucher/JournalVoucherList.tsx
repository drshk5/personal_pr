import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Book, Edit, Filter, Plus } from "lucide-react";

import type { JournalVoucherListItem } from "@/types/Account/journal-voucher";

import { Actions, FormModules, ListModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";
import { getStatusBadgeVariant } from "@/lib/utils";

import { format } from "date-fns";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { useUserRights } from "@/hooks";
import { useActiveCurrencyTypes, useModuleUsers } from "@/hooks/api";
import { useJournalVouchers } from "@/hooks";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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

const JournalVoucherList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [selectedCurrencyTypes, setSelectedCurrencyTypes] = useState<string[]>(
    []
  );
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isAdjustment, setIsAdjustment] = useState<boolean | null>(null);

  // Set default date range to current month
  const currentDate = new Date();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: firstDayOfMonth,
    to: lastDayOfMonth,
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isCurrencyTypeDropdownOpen, setIsCurrencyTypeDropdownOpen] =
    useState(false);
  const [isCreatedByDropdownOpen, setIsCreatedByDropdownOpen] = useState(false);
  const [isUpdatedByDropdownOpen, setIsUpdatedByDropdownOpen] = useState(false);

  const defaultColumnOrder = [
    "actions",
    "strJournal_VoucherNo",
    "strStatus",
    "dJournal_VoucherDate",
    "strRefNo",
    "strNotes",
    "strCurrencyTypeName",
    "bolIsJouranl_Adjustement",
    "strCreatedByName",
    "dtCreatedOn",
  ];

  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ListModules.JOURNAL_VOUCHER, Book);

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "journal_voucher",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strJournal_VoucherNo",
        direction: "asc",
      },
    }
  );

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
  } = useTableLayout("journal_voucher", defaultColumnOrder, []);

  const {
    data: journalVouchersResponse,
    isLoading,
    error,
  } = useJournalVouchers({
    search: debouncedSearch,
    fromDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    toDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    strStatus: selectedStatus || undefined,
    strCurrencyTypeGUIDs:
      selectedCurrencyTypes.length > 0
        ? selectedCurrencyTypes.join(",")
        : undefined,
    strCreatedByGUIDs:
      selectedCreatedBy.length > 0 ? selectedCreatedBy.join(",") : undefined,
    strUpdatedByGUIDs:
      selectedUpdatedBy.length > 0 ? selectedUpdatedBy.join(",") : undefined,
    bolIsJouranl_Adjustement: isAdjustment === null ? undefined : isAdjustment,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: sorting.columnKey || undefined,
    ascending,
  });

  const { data: currencyTypes, isLoading: isCurrencyTypesLoading } =
    useActiveCurrencyTypes(undefined, isCurrencyTypeDropdownOpen);

  const { data: users, isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    isCreatedByDropdownOpen || isUpdatedByDropdownOpen
  );

  useEffect(() => {
    if (journalVouchersResponse) {
      setPagination({
        pageNumber: journalVouchersResponse.pageNumber,
        pageSize: journalVouchersResponse.pageSize,
        totalCount: journalVouchersResponse.totalRecords,
        totalPages: journalVouchersResponse.totalPages,
      });
    }
  }, [journalVouchersResponse, setPagination]);

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

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo<DataTableColumn<JournalVoucherListItem>[]>(() => {
    const baseColumns: DataTableColumn<JournalVoucherListItem>[] = [];

    if (canAccess(menuItems, FormModules.JOURNAL_VOUCHER, Actions.EDIT)) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        width: "80px",
        cell: (item) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(
                  `/journal-voucher/${item.strJournal_VoucherGUID}`
                );
              }}
              title="Edit journal voucher"
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
        key: "strJournal_VoucherNo",
        header: "Voucher No",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strJournal_VoucherNo}
          >
            {item.strJournal_VoucherNo}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strStatus",
        header: "Status",
        width: "180px",
        cell: (item) => (
          <Badge variant={getStatusBadgeVariant(item.strStatus)}>
            {item.strStatus}
          </Badge>
        ),
        sortable: true,
      },
      {
        key: "dJournal_VoucherDate",
        header: "Date",
        width: "120px",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {format(new Date(item.dJournal_VoucherDate), "dd-MM-yyyy")}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strRefNo",
        header: "Reference No",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strRefNo || "-"}
          >
            {item.strRefNo || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strNotes",
        header: "Notes",
        width: "350px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strNotes || "-"}
          >
            {item.strNotes || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCurrencyTypeName",
        header: "Currency",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCurrencyTypeName || "-"}
          >
            {item.strCurrencyTypeName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsJouranl_Adjustement",
        header: "Adjustment",
        width: "100px",
        cell: (item) => (
          <div>{item.bolIsJouranl_Adjustement ? "Yes" : "No"}</div>
        ),
        sortable: true,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCreatedByName || "-"}
          >
            {item.strCreatedByName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "180px",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {format(new Date(item.dtCreatedOn), "dd-MM-yyyy HH:mm")}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strUpdatedByName || "-"}
          >
            {item.strUpdatedByName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "180px",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {format(new Date(item.dtUpdatedOn), "dd-MM-yyyy HH:mm")}
          </div>
        ),
        sortable: true,
      }
    );

    return baseColumns;
  }, [isTextWrapped, menuItems, openEditInNewTab]);

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

  const resetFilters = () => {
    setDebouncedSearch("");
    // Keep the default date range (current month) when clearing filters
    const currentDate = new Date();
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    setDateRange({ from: firstDayOfMonth, to: lastDayOfMonth });
    setSelectedCurrencyTypes([]);
    setSelectedCreatedBy([]);
    setSelectedUpdatedBy([]);
    setSelectedStatus(null);
    setIsAdjustment(null);
  };

  return (
    <CustomContainer>
      <PageHeader
        title="Journal Vouchers"
        description="Manage journal vouchers"
        icon={HeaderIcon}
        actions={
          <WithPermission
            module={FormModules.JOURNAL_VOUCHER}
            action={Actions.SAVE}
          >
            <Button
              onClick={() => navigate("/journal-voucher/new")}
              className="h-9 text-xs sm:text-sm"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              New Journal Voucher
            </Button>
          </WithPermission>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search journal vouchers..."
            onSearchChange={setDebouncedSearch}
            className="w-full sm:max-w-md sm:flex-1"
          />

          <div className="w-full sm:w-auto">
            <DateRangePicker
              startDate={dateRange.from}
              endDate={dateRange.to}
              onRangeChange={(from, to) => setDateRange({ from, to })}
              restricted={true}
            />
          </div>

          <div className="grid grid-cols-2 lg:flex gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 justify-center h-9 text-xs sm:text-sm"
              size="sm"
            >
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span>Filters</span>
              {(selectedCurrencyTypes.length > 0 ||
                selectedStatus !== null ||
                isAdjustment !== null ||
                selectedCreatedBy.length > 0 ||
                selectedUpdatedBy.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {(selectedCurrencyTypes.length > 0 ? 1 : 0) +
                    (selectedStatus !== null ? 1 : 0) +
                    (isAdjustment !== null ? 1 : 0) +
                    (selectedCreatedBy.length > 0 ? 1 : 0) +
                    (selectedUpdatedBy.length > 0 ? 1 : 0)}
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
                    "journal_voucher_column_order",
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
                Filter journal vouchers by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Currency
                  </label>
                  <MultiSelect
                    options={
                      (currencyTypes || []).map((currency) => ({
                        label: currency.strName,
                        value: currency.strCurrencyTypeGUID,
                      })) || []
                    }
                    selectedValues={selectedCurrencyTypes}
                    onChange={setSelectedCurrencyTypes}
                    onOpenChange={(isOpen) =>
                      setIsCurrencyTypeDropdownOpen(isOpen)
                    }
                    placeholder="Filter by currency type"
                    initialMessage=""
                    isLoading={
                      isCurrencyTypeDropdownOpen && isCurrencyTypesLoading
                    }
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
                    placeholder="Filter by created by"
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
                    placeholder="Filter by updated by"
                    initialMessage=""
                    isLoading={isUpdatedByDropdownOpen && isUsersLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={selectedStatus || "all"}
                    onValueChange={(value) =>
                      setSelectedStatus(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Pending For Approval">
                        Pending For Approval
                      </SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Adjustment
                  </label>
                  <Select
                    value={
                      isAdjustment === null ? "all" : isAdjustment.toString()
                    }
                    onValueChange={(value) =>
                      setIsAdjustment(value === "all" ? null : value === "true")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="true">Adjustment</SelectItem>
                      <SelectItem value="false">Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  disabled={
                    selectedStatus === null &&
                    isAdjustment === null &&
                    selectedCurrencyTypes.length === 0 &&
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
            "Voucher No",
            "Status",
            "Date",
            "Reference No",
            "Currency",
            "Adjustment",
            "Notes",
            "Created By",
            "Created On",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          columns={orderedColumns}
          maxHeight="calc(100vh - 350px)"
          data={journalVouchersResponse?.data || []}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          sortBy={sorting.columnKey || undefined}
          ascending={sorting.direction === "asc"}
          onSort={handleSortChange}
          keyExtractor={(item) => item.strJournal_VoucherGUID}
          pagination={{
            totalPages: pagination.totalPages || 0,
            pageNumber: pagination.pageNumber || 1,
            pageSize: pagination.pageSize || 10,
            totalCount: pagination.totalCount || 0,
            onPageChange: goToPage,
            onPageSizeChange: changePageSize,
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "journal_voucher_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            error ? (
              <>Error loading journal vouchers. Please try again later.</>
            ) : debouncedSearch ? (
              <>No journal vouchers found matching "{debouncedSearch}".</>
            ) : (
              <>No journal vouchers found. Click "New Voucher" to create one.</>
            )
          }
        />
      )}
    </CustomContainer>
  );
};

export default JournalVoucherList;
