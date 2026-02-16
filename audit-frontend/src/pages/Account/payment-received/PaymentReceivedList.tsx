import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Filter, Plus, Receipt } from "lucide-react";

import type { PaymentReceived } from "@/types/Account/payment-received";

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
import { useModuleUsers } from "@/hooks/api";
import { usePaymentReceived } from "@/hooks/api/Account/use-payment-received";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const getCurrentMonthRange = () => {
  const today = new Date();
  return {
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
  };
};

const PaymentReceivedList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>(() => getCurrentMonthRange());
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    createdBy: false,
    updatedBy: false,
  });

  const defaultColumnOrder = [
    "actions",
    "strPaymentReceivedNo",
    "strStatus",
    "dPaymentReceivedDate",
    "strPaymentMode",
    "strCustomerName",
    "strAccountName",
    "dblTotalAmountReceived",
    "dblBankCharges",
    "dblTotalAmountReceivedBase",
    "strRefNo",
    "strSubject",
    "strNotes",
    "strApprovedByName",
    "dtApprovedOn",
    "strCreatedByName",
    "dtCreatedOn",
    "strUpdatedByName",
    "dtUpdatedOn",
  ];

  const activeFilterCount =
    (selectedPaymentMode !== null ? 1 : 0) +
    (selectedStatus !== null ? 1 : 0) +
    (selectedCreatedBy.length > 0 ? 1 : 0) +
    (selectedUpdatedBy.length > 0 ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ListModules.PAYMENT_RECEIVED, Receipt);

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "payment_received",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strPaymentReceivedNo",
        direction: "desc",
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
  } = useTableLayout("payment_received", defaultColumnOrder, []);

  const { data: paymentReceivedResponse, isLoading } = usePaymentReceived({
    search: debouncedSearch,
    fromDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    toDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    strPaymentMode: selectedPaymentMode || undefined,
    strStatus: selectedStatus || undefined,
    strCreatedByGUID:
      selectedCreatedBy.length > 0 ? selectedCreatedBy[0] : undefined,
    strUpdatedByGUID:
      selectedUpdatedBy.length > 0 ? selectedUpdatedBy[0] : undefined,
    PageNumber: pagination.pageNumber,
    PageSize: pagination.pageSize,
    sortBy: sorting.columnKey || undefined,
    ascending: ascending,
  });

  const { data: users, isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    dropdownOpen.createdBy || dropdownOpen.updatedBy
  );

  useEffect(() => {
    if (paymentReceivedResponse) {
      setPagination({
        pageNumber: paymentReceivedResponse.pageNumber,
        pageSize: paymentReceivedResponse.pageSize,
        totalCount: paymentReceivedResponse.totalRecords,
        totalPages: paymentReceivedResponse.totalPages,
      });
    }
  }, [paymentReceivedResponse, setPagination]);

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

  const columns = useMemo<DataTableColumn<PaymentReceived>[]>(() => {
    const baseColumns: DataTableColumn<PaymentReceived>[] = [];

    if (canAccess(menuItems, FormModules.PAYMENT_RECEIVED, Actions.EDIT)) {
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
                  `/payment-received/${item.strPaymentReceivedGUID}`
                );
              }}
              title="Edit payment received"
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
        key: "strPaymentReceivedNo",
        header: "Payment Received No",
        width: "240px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strPaymentReceivedNo}
          >
            {item.strPaymentReceivedNo}
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
        key: "dPaymentReceivedDate",
        header: "Date",
        width: "120px",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {format(new Date(item.dPaymentReceivedDate), "dd-MM-yyyy")}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPaymentMode",
        header: "Payment Mode",
        width: "170px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strPaymentMode}
          >
            {item.strPaymentMode}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCustomerName",
        header: "Customer",
        width: "200px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCustomerName || ""}
          >
            {item.strCustomerName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strAccountName",
        header: "Account",
        width: "180px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strAccountName || "-"}
          >
            {item.strAccountName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dblTotalAmountReceived",
        header: "Amount",
        width: "150px",
        cell: (item) => {
          try {
            return new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(item.dblTotalAmountReceived);
          } catch {
            return `INR ${item.dblTotalAmountReceived.toFixed(2)}`;
          }
        },
        sortable: true,
      },
      {
        key: "dblBankCharges",
        header: "Bank Charges",
        width: "150px",
        cell: (item) => {
          try {
            return new Intl.NumberFormat("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(item.dblBankCharges);
          } catch {
            return item.dblBankCharges.toFixed(2);
          }
        },
      },
      {
        key: "dblTotalAmountReceivedBase",
        header: "Base Amount",
        width: "150px",
        cell: (item) => {
          try {
            return new Intl.NumberFormat("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(item.dblTotalAmountReceivedBase);
          } catch {
            return item.dblTotalAmountReceivedBase.toFixed(2);
          }
        },
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
      },
      {
        key: "strSubject",
        header: "Subject",
        width: "200px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strSubject || "-"}
          >
            {item.strSubject || "-"}
          </div>
        ),
      },
      {
        key: "strNotes",
        header: "Notes",
        width: "250px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strNotes || ""}
          >
            {item.strNotes || "-"}
          </div>
        ),
      },
      {
        key: "strApprovedByName",
        header: "Approved By",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strApprovedByName || "-"}
          >
            {item.strApprovedByName || "-"}
          </div>
        ),
      },
      {
        key: "dtApprovedOn",
        header: "Approved On",
        width: "180px",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {item.dtApprovedOn
              ? format(new Date(item.dtApprovedOn), "dd-MM-yyyy HH:mm")
              : "-"}
          </div>
        ),
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
        cell: (item) =>
          item.dtUpdatedOn ? (
            <div className="whitespace-nowrap">
              {format(new Date(item.dtUpdatedOn), "dd-MM-yyyy HH:mm")}
            </div>
          ) : (
            <div>-</div>
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
    setDateRange(getCurrentMonthRange());
    setSelectedPaymentMode(null);
    setSelectedStatus(null);
    setSelectedCreatedBy([]);
    setSelectedUpdatedBy([]);
  };

  return (
    <CustomContainer>
      <PageHeader
        title="Payment Received"
        description="Manage all payment received records"
        icon={HeaderIcon}
        actions={
          <WithPermission
            module={FormModules.PAYMENT_RECEIVED}
            action={Actions.SAVE}
          >
            <Button
              onClick={() => navigate("/payment-received/new")}
              className="h-9 text-xs sm:text-sm"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              New Payment Received
            </Button>
          </WithPermission>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search payment received..."
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
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {activeFilterCount}
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
                    "payment_received_column_order",
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
                Filter payment received records by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Payment Mode
                  </label>
                  <Select
                    value={selectedPaymentMode || "all"}
                    onValueChange={(value) =>
                      setSelectedPaymentMode(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      <SelectItem value="Bank">Bank</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="PendingForApproval">
                        Pending For Approval
                      </SelectItem>
                      <SelectItem value="Received">Received</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
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
                    placeholder="Filter by created by"
                    initialMessage=""
                    onOpenChange={(open) =>
                      setDropdownOpen((prev) => ({ ...prev, createdBy: open }))
                    }
                    isLoading={isUsersLoading}
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
                    placeholder="Filter by updated by"
                    initialMessage=""
                    onOpenChange={(open) =>
                      setDropdownOpen((prev) => ({ ...prev, updatedBy: open }))
                    }
                    isLoading={isUsersLoading}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  disabled={
                    selectedPaymentMode === null &&
                    selectedStatus === null &&
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
            "Payment Received No",
            "Status",
            "Date",
            "Mode",
            "Customer",
            "Amount",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          columns={orderedColumns}
          maxHeight="calc(100vh - 350px)"
          data={paymentReceivedResponse?.data || []}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          sortBy={sorting.columnKey || undefined}
          ascending={sorting.direction === "asc"}
          onSort={handleSortChange}
          keyExtractor={(item) => item.strPaymentReceivedGUID}
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
              "payment_received_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            debouncedSearch ? (
              <>No payment received found matching "{debouncedSearch}".</>
            ) : (
              <>No payment received found. Click "Create New" to create one.</>
            )
          }
        />
      )}
    </CustomContainer>
  );
};

export default PaymentReceivedList;
