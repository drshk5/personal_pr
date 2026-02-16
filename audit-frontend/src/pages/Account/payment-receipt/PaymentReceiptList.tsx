import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Filter, Plus, Receipt } from "lucide-react";

import type { PaymentReceipt } from "@/types/Account/payment-receipt";

import { Actions, FormModules, ListModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";
import { getStatusBadgeVariant } from "@/lib/utils";

import { format } from "date-fns";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { useUserRights, useModuleUsers } from "@/hooks";
import { usePaymentReceipts } from "@/hooks/api/Account/use-payment-receipt";

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

const PaymentReceiptList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [selectedTransactionType, setSelectedTransactionType] = useState<
    string | null
  >(null);
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
    "strTransactionNo",
    "strStatus",
    "dtTransactionDate",
    "strTransactionType",
    "strPaymentMode",
    "strPartyName",
    "strAccountName",
    "strBankCashAccountName",
    "dblTotalAmount",
    "strCurrencyTypeName",
    "dblExchangeRate",
    "dblBaseTotalAmount",
    "strNarration",
    "strReferenceNo",
    "strChequeNo",
    "dtChequeDate",
    "strCardType",
    "strCardLastFourDigits",
    "strCardIssuerBank",
    "strCardTransactionId",
    "dblCardProcessingFee",
    "strApprovedByName",
    "dtApprovedDate",
    "strRejectionReason",
    "strCreatedByName",
    "dtCreatedOn",
    "strUpdatedByName",
    "dtUpdatedOn",
  ];

  const activeFilterCount =
    (selectedTransactionType !== null ? 1 : 0) +
    (selectedPaymentMode !== null ? 1 : 0) +
    (selectedStatus !== null ? 1 : 0) +
    (selectedCreatedBy.length > 0 ? 1 : 0) +
    (selectedUpdatedBy.length > 0 ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ListModules.PAYMENT_RECEIPT, Receipt);

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "payment_receipt",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "dtTransactionDate",
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
  } = useTableLayout("payment_receipt", defaultColumnOrder, []);

  const { data: paymentReceiptsResponse, isLoading } = usePaymentReceipts({
    SearchTerm: debouncedSearch,
    dtTransactionDateFrom: dateRange.from
      ? format(dateRange.from, "yyyy-MM-dd")
      : undefined,
    dtTransactionDateTo: dateRange.to
      ? format(dateRange.to, "yyyy-MM-dd")
      : undefined,
    strTransactionType: selectedTransactionType || undefined,
    strPaymentMode: selectedPaymentMode || undefined,
    strStatus: selectedStatus || undefined,
    strCreatedByGUID:
      selectedCreatedBy.length > 0 ? selectedCreatedBy[0] : undefined,
    strUpdatedByGUID:
      selectedUpdatedBy.length > 0 ? selectedUpdatedBy[0] : undefined,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: sorting.columnKey || undefined,
    ascending,
  });

  const { data: users, isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    dropdownOpen.createdBy || dropdownOpen.updatedBy
  );

  useEffect(() => {
    if (paymentReceiptsResponse) {
      setPagination({
        pageNumber: paymentReceiptsResponse.pageNumber,
        pageSize: paymentReceiptsResponse.pageSize,
        totalCount: paymentReceiptsResponse.totalCount,
        totalPages: paymentReceiptsResponse.totalPages,
      });
    }
  }, [paymentReceiptsResponse, setPagination]);

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

  const columns = useMemo<DataTableColumn<PaymentReceipt>[]>(() => {
    const baseColumns: DataTableColumn<PaymentReceipt>[] = [];

    if (canAccess(menuItems, FormModules.PAYMENT_RECEIPT, Actions.EDIT)) {
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
                  `/payment-receipt/${item.strPaymentReceiptGUID}`
                );
              }}
              title="Edit payment/receipt"
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
        key: "strTransactionNo",
        header: "Transaction No",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strTransactionNo}
          >
            {item.strTransactionNo}
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
        key: "dtTransactionDate",
        header: "Date",
        width: "120px",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {format(new Date(item.dtTransactionDate), "dd-MM-yyyy")}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTransactionType",
        header: "Type",
        width: "120px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strTransactionType}
          >
            {item.strTransactionType}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPaymentMode",
        header: "Mode",
        width: "120px",
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
        key: "strPartyName",
        header: "Party",
        width: "200px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strPartyName || ""}
          >
            {item.strPartyName || "-"}
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
        key: "strBankCashAccountName",
        header: "Bank/Cash Account",
        width: "200px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strBankCashAccountName || "-"}
          >
            {item.strBankCashAccountName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dblTotalAmount",
        header: "Amount",
        width: "150px",
        cell: (item) => {
          const amount = item.dblTotalAmount;
          const currency = item.strCurrency || "INR";
          try {
            return new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: currency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(amount);
          } catch {
            return `${currency} ${amount.toFixed(2)}`;
          }
        },
        sortable: true,
      },
      {
        key: "strCurrencyTypeName",
        header: "Currency",
        width: "120px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCurrencyTypeName || "-"}
          >
            {item.strCurrencyTypeName || "-"}
          </div>
        ),
      },
      {
        key: "dblExchangeRate",
        header: "Exchange Rate",
        width: "140px",
        cell: (item) => <div>{item.dblExchangeRate?.toFixed(6) ?? "-"}</div>,
      },
      {
        key: "dblBaseTotalAmount",
        header: "Base Amount",
        width: "150px",
        cell: (item) => {
          try {
            return new Intl.NumberFormat("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(item.dblBaseTotalAmount);
          } catch {
            return item.dblBaseTotalAmount.toFixed(2);
          }
        },
      },
      {
        key: "strNarration",
        header: "Narration",
        width: "250px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strNarration || ""}
          >
            {item.strNarration || "-"}
          </div>
        ),
      },
      {
        key: "strReferenceNo",
        header: "Reference No",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strReferenceNo || "-"}
          >
            {item.strReferenceNo || "-"}
          </div>
        ),
      },
      {
        key: "strChequeNo",
        header: "Cheque No",
        width: "140px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strChequeNo || "-"}
          >
            {item.strChequeNo || "-"}
          </div>
        ),
      },
      {
        key: "dtChequeDate",
        header: "Cheque Date",
        width: "140px",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {item.dtChequeDate
              ? format(new Date(item.dtChequeDate), "dd-MM-yyyy")
              : "-"}
          </div>
        ),
      },
      {
        key: "strCardType",
        header: "Card Type",
        width: "120px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCardType || "-"}
          >
            {item.strCardType || "-"}
          </div>
        ),
      },
      {
        key: "strCardLastFourDigits",
        header: "Card Last 4",
        width: "120px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCardLastFourDigits || "-"}
          >
            {item.strCardLastFourDigits || "-"}
          </div>
        ),
      },
      {
        key: "strCardIssuerBank",
        header: "Card Issuer Bank",
        width: "180px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCardIssuerBank || "-"}
          >
            {item.strCardIssuerBank || "-"}
          </div>
        ),
      },
      {
        key: "strCardTransactionId",
        header: "Card Txn ID",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCardTransactionId || "-"}
          >
            {item.strCardTransactionId || "-"}
          </div>
        ),
      },
      {
        key: "dblCardProcessingFee",
        header: "Card Fee",
        width: "120px",
        cell: (item) =>
          item.dblCardProcessingFee !== null &&
          item.dblCardProcessingFee !== undefined ? (
            <div>{item.dblCardProcessingFee.toFixed(2)}</div>
          ) : (
            <div>-</div>
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
        key: "dtApprovedDate",
        header: "Approved Date",
        width: "140px",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {item.dtApprovedDate
              ? format(new Date(item.dtApprovedDate), "dd-MM-yyyy")
              : "-"}
          </div>
        ),
      },
      {
        key: "strRejectionReason",
        header: "Rejection Reason",
        width: "200px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strRejectionReason || ""}
          >
            {item.strRejectionReason || "-"}
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
    setSelectedTransactionType(null);
    setSelectedPaymentMode(null);
    setSelectedStatus(null);
    setSelectedCreatedBy([]);
    setSelectedUpdatedBy([]);
  };

  // (moved above useMemo)

  return (
    <CustomContainer>
      <PageHeader
        title="Payment & Receipt"
        description="Manage all payments and receipts across Bank, Card, Cash, UPI, and Cheque modes"
        icon={HeaderIcon}
        actions={
          <WithPermission
            module={FormModules.PAYMENT_RECEIPT}
            action={Actions.SAVE}
          >
            <Button
              onClick={() => navigate("/payment-receipt/create")}
              className="h-9 text-xs sm:text-sm"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              New Payment & Receipt
            </Button>
          </WithPermission>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search payment/receipts..."
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
                    "payment_receipt_column_order",
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
                Filter payments and receipts by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Transaction Type
                  </label>
                  <Select
                    value={selectedTransactionType || "all"}
                    onValueChange={(value) =>
                      setSelectedTransactionType(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="PAYMENT">Payment</SelectItem>
                      <SelectItem value="RECEIPT">Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                      <SelectItem value="BANK">Bank</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
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
                    isLoading={dropdownOpen.createdBy && isUsersLoading}
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        createdBy: isOpen,
                      }))
                    }
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
                    isLoading={dropdownOpen.updatedBy && isUsersLoading}
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        updatedBy: isOpen,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  disabled={
                    selectedTransactionType === null &&
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
            "Transaction No",
            "Status",
            "Date",
            "Type",
            "Mode",
            "Party",
            "Amount",
            "Reconciliation",
            "Narration",
            "Reference No",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          columns={orderedColumns}
          maxHeight="calc(100vh - 350px)"
          data={paymentReceiptsResponse?.items || []}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          sortBy={sorting.columnKey || undefined}
          ascending={sorting.direction === "asc"}
          onSort={handleSortChange}
          keyExtractor={(item) => item.strPaymentReceiptGUID}
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
              "payment_receipt_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            debouncedSearch ? (
              <>No payment/receipts found matching "{debouncedSearch}".</>
            ) : (
              <>No payment/receipts found. Click "Create New" to create one.</>
            )
          }
        />
      )}
    </CustomContainer>
  );
};

export default PaymentReceiptList;
