import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare, CheckCircle, XCircle, FilePen } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

import type { PaymentReceived } from "@/types/Account/payment-received";

import { FormModules } from "@/lib/permissions";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import {
  usePaymentReceivedPendingApproval,
  useChangePaymentReceivedStatus,
} from "@/hooks/api/Account/use-payment-received";
import { useActivePartiesByType } from "@/hooks/api/Account/use-parties";
import { useAccountsByTypesTree } from "@/hooks/api/Account";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { IndeterminateCheckbox } from "@/components/ui/IndeterminateCheckbox";
import { MultiSelect } from "@/components/ui/select/multi-select";
import { TreeDropdown } from "@/components/ui/select/tree-dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  DocumentTable,
  type DocumentTableColumn,
} from "@/components/data-display/data-tables/CheckboxDataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";

const PaymentReceivedApprovals: React.FC = () => {
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const defaultColumnOrder = [
    "select",
    "strPaymentReceivedNo",
    "dPaymentReceivedDate",
    "strCustomerName",
    "strAccountName",
    "strPaymentMode",
    "dblTotalAmountReceived",
    "strCreatedByName",
    "dtCreatedOn",
  ];

  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);
  const [showRejectDialog, setShowRejectDialog] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [showApproveDialog, setShowApproveDialog] = useState<boolean>(false);
  const [showDraftDialog, setShowDraftDialog] = useState<boolean>(false);

  const HeaderIcon = useMenuIcon(FormModules.PAYMENT_RECEIVED, CheckSquare);
  const bulkChangeStatusMutation = useChangePaymentReceivedStatus();

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "payment_received_approvals",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "dPaymentReceivedDate",
        direction: "desc",
      },
    }
  );

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
    "payment_received_approvals",
    defaultColumnOrder,
    [
      "select",
      "strPaymentReceivedGUID",
      "strOrganizationGUID",
      "strCreatedByGUID",
      "strUpdatedByGUID",
      "strCustomerGUID",
      "strAccountGUID",
    ],
    {
      strPaymentReceivedNo: true,
      dPaymentReceivedDate: true,
      strCustomerName: true,
      strAccountName: true,
      strPaymentMode: true,
      dblTotalAmountReceived: true,
      strCreatedByName: true,
      dtCreatedOn: true,
    }
  );

  const {
    data: paymentReceivedResponse,
    isLoading,
    error,
  } = usePaymentReceivedPendingApproval({
    search: debouncedSearch,
    fromDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    toDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    strCustomerGUID:
      selectedCustomers.length > 0 ? selectedCustomers[0] : undefined,
    strAccountGUID: selectedAccount || undefined,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: sorting.columnKey || undefined,
    ascending: sorting.direction === "asc",
  });

  const customersEnabled = isCustomerDropdownOpen;
  const { data: customersResponse, isLoading: isCustomersLoading } =
    useActivePartiesByType(
      { strPartyType: "Customer", search: customerSearch },
      customersEnabled
    );

  const accountsEnabled = isAccountDropdownOpen;
  const { data: accountsTreeData, isLoading: isAccountsLoading } =
    useAccountsByTypesTree(
      {
        strAccountTypeGUIDs: "",
        maxLevel: 0,
      },
      { enabled: accountsEnabled }
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

  useEffect(() => {
    setSelectedRows({});
    setSelectAll(false);
    setIndeterminate(false);
  }, [
    debouncedSearch,
    dateRange.from,
    dateRange.to,
    selectedCustomers,
    selectedAccount,
  ]);

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

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setIndeterminate(false);
      setSelectAll(checked);

      if (checked && paymentReceivedResponse?.data) {
        const newSelectedRows: Record<string, boolean> = {};
        paymentReceivedResponse.data.forEach((doc) => {
          newSelectedRows[doc.strPaymentReceivedGUID] = true;
        });
        setSelectedRows(newSelectedRows);
      } else {
        setSelectedRows({});
      }
    },
    [paymentReceivedResponse?.data]
  );

  const handleRowSelection = useCallback((paymentReceivedId: string) => {
    setSelectedRows((prev) => ({
      ...prev,
      [paymentReceivedId]: !prev[paymentReceivedId],
    }));
  }, []);

  useEffect(() => {
    const selectedCount = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    ).length;

    if (
      paymentReceivedResponse?.data &&
      paymentReceivedResponse.data.length > 0
    ) {
      if (selectedCount === paymentReceivedResponse.data.length) {
        setSelectAll(true);
        setIndeterminate(false);
      } else if (selectedCount > 0) {
        setSelectAll(false);
        setIndeterminate(true);
      } else {
        setSelectAll(false);
        setIndeterminate(false);
      }
    }
  }, [paymentReceivedResponse?.data, selectedRows]);

  const selectedItemsCount = useMemo(() => {
    return Object.keys(selectedRows).filter((id) => selectedRows[id]).length;
  }, [selectedRows]);

  const handleBulkApprove = async () => {
    const selectedIds = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    );
    if (selectedIds.length === 0) return;

    await bulkChangeStatusMutation.mutateAsync({
      strPaymentReceivedGUIDs: selectedIds,
      strStatus: "Received",
    });
    setSelectedRows({});
    setSelectedAction("");
  };

  const handleBulkReject = () => {
    const selectedIds = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    );
    if (selectedIds.length === 0) return;

    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    const selectedIds = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    );
    if (selectedIds.length === 0) return;

    if (!rejectionReason.trim()) {
      return;
    }

    await bulkChangeStatusMutation.mutateAsync({
      strPaymentReceivedGUIDs: selectedIds,
      strStatus: "Rejected",
      strRejectedReason: rejectionReason,
    });
    setSelectedRows({});
    setShowRejectDialog(false);
    setRejectionReason("");
    setSelectedAction("");
  };

  const handleBulkSendToDraft = async () => {
    const selectedIds = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    );
    if (selectedIds.length === 0) return;

    await bulkChangeStatusMutation.mutateAsync({
      strPaymentReceivedGUIDs: selectedIds,
      strStatus: "Draft",
    });
    setSelectedRows({});
    setSelectedAction("");
  };

  const handleSubmitAction = () => {
    if (!selectedAction) return;

    if (selectedAction === "Rejected") {
      handleBulkReject();
    } else if (selectedAction === "Received") {
      setShowApproveDialog(true);
    } else if (selectedAction === "Draft") {
      setShowDraftDialog(true);
    }
  };

  const confirmApprove = async () => {
    await handleBulkApprove();
    setShowApproveDialog(false);
  };

  const confirmSendToDraft = async () => {
    await handleBulkSendToDraft();
    setShowDraftDialog(false);
  };

  const columns = useMemo<DocumentTableColumn<PaymentReceived>[]>(() => {
    const baseColumns: DocumentTableColumn<PaymentReceived>[] = [];

    baseColumns.push({
      key: "select",
      width: "80px",
      header: (
        <div className="flex items-center justify-end h-full p-2">
          <IndeterminateCheckbox
            checked={selectAll}
            indeterminate={indeterminate}
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
          />
        </div>
      ),
      cell: (item) => (
        <div className="flex items-center justify-start h-full p-2">
          <Checkbox
            checked={!!selectedRows[item.strPaymentReceivedGUID]}
            onCheckedChange={() =>
              handleRowSelection(item.strPaymentReceivedGUID)
            }
            aria-label={`Select ${item.strPaymentReceivedNo}`}
          />
        </div>
      ),
      sortable: false,
    });

    baseColumns.push(
      {
        key: "strPaymentReceivedNo",
        header: "Payment Received No",
        cell: (item) => (
          <div
            className="text-blue-500 hover:text-blue-600 font-semibold text-base ml-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                `/payment-received/${item.strPaymentReceivedGUID}`,
                "_blank"
              );
            }}
          >
            {item.strPaymentReceivedNo}
          </div>
        ),
        width: "220px",
        sortable: true,
      },
      {
        key: "dPaymentReceivedDate",
        header: "Payment Date",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {format(new Date(item.dPaymentReceivedDate), "dd-MM-yyyy")}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "strCustomerName",
        header: "Customer",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCustomerName || ""}
          >
            {item.strCustomerName || "-"}
          </div>
        ),
        width: "200px",
        sortable: true,
      },
      {
        key: "strAccountName",
        header: "Account",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strAccountName || ""}
          >
            {item.strAccountName || "-"}
          </div>
        ),
        width: "200px",
        sortable: true,
      },
      {
        key: "strPaymentMode",
        header: "Payment Mode",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strPaymentModeName || item.strPaymentMode || "-"}
          >
            {item.strPaymentModeName || item.strPaymentMode || "-"}
          </div>
        ),
        width: "180px",
        sortable: true,
      },
      {
        key: "dblTotalAmountReceived",
        header: "Amount Received",
        cell: (item) => (
          <div className="text-right font-medium">
            {item.dblTotalAmountReceived?.toFixed(2) || "0.00"}
          </div>
        ),
        width: "180px",
        sortable: true,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCreatedByName || "-"}
          >
            {item.strCreatedByName || "-"}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {format(new Date(item.dtCreatedOn), "dd-MM-yyyy HH:mm")}
          </div>
        ),
        width: "180px",
        sortable: true,
      }
    );

    return baseColumns;
  }, [
    isTextWrapped,
    selectAll,
    indeterminate,
    selectedRows,
    handleSelectAll,
    handleRowSelection,
  ]);

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

  return (
    <CustomContainer>
      <PageHeader
        title="Payment Received Approvals"
        description="Review and approve pending payment received records"
        icon={HeaderIcon}
        actions={
          selectedItemsCount > 0 ? (
            <div className="flex gap-2 items-center">
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-50 h-9">
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">
                    <div className="flex items-center gap-2">
                      <FilePen className="h-4 w-4" />
                      <span>Send to Draft</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Received">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Mark as Received</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Rejected">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSubmitAction}
                disabled={!selectedAction || bulkChangeStatusMutation.isPending}
                size="sm"
                variant="default"
              >
                {bulkChangeStatusMutation.isPending
                  ? "Processing..."
                  : `Submit (${selectedItemsCount})`}
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <SearchInput
            placeholder="Search payment received..."
            onSearchChange={setDebouncedSearch}
            className="w-full lg:max-w-md"
          />

          <div className="w-full lg:w-87.5">
            <DateRangePicker
              startDate={dateRange.from}
              endDate={dateRange.to}
              onRangeChange={(from, to) => setDateRange({ from, to })}
            />
          </div>

          <div className="w-full lg:w-62.5">
            <MultiSelect
              options={
                (customersResponse || []).map((customer) => ({
                  label: customer.strPartyName_Display || customer.strPartyGUID,
                  value: customer.strPartyGUID,
                })) || []
              }
              selectedValues={selectedCustomers}
              onChange={setSelectedCustomers}
              onOpenChange={(isOpen) => {
                setIsCustomerDropdownOpen(isOpen);
                if (isOpen) setCustomerSearch("");
              }}
              onInputChange={setCustomerSearch}
              placeholder="Filter by customer"
              initialMessage=""
              isLoading={isCustomersLoading}
            />
          </div>

          <div className="w-full lg:w-62.5">
            <TreeDropdown
              placeholder="Filter by account"
              data={
                accountsTreeData?.scheduleTree
                  ? accountsTreeData.scheduleTree.map((node) => ({
                      id: `schedule-${node.strScheduleGUID}`,
                      name: `${node.strScheduleName} (${node.strScheduleCode})`,
                      code: node.strScheduleCode,
                      type: "label" as const,
                      children: (node.accounts || [])
                        .filter((account) => account.bolIsActive)
                        .map((account) => ({
                          id: account.strAccountGUID,
                          name: account.strAccountName,
                          type: "data" as const,
                          children: [],
                        })),
                    }))
                  : []
              }
              value={selectedAccount ? [selectedAccount] : []}
              onSelectionChange={(items: { id: string }[]) => {
                setSelectedAccount(items[0]?.id || "");
              }}
              getItemId={(item: { id: string }) => item.id}
              getSearchableText={(item: { name: string; code?: string }) =>
                `${item.name} ${item.code || ""}`.toLowerCase()
              }
              getDisplayText={(item: { name: string; code?: string }) =>
                item.code ? `${item.name} (${item.code})` : item.name
              }
              onOpenChange={(isOpen: boolean) =>
                setIsAccountDropdownOpen(isOpen)
              }
              isLoading={isAccountsLoading}
            />
          </div>

          <div className="h-9">
            <DraggableColumnVisibility
              columns={columns}
              columnVisibility={columnVisibility}
              toggleColumnVisibility={toggleColumnVisibility}
              resetColumnVisibility={resetColumnVisibility}
              hasVisibleContentColumns={hasVisibleContentColumns}
              getAlwaysVisibleColumns={getAlwaysVisibleColumns}
              pinnedColumns={pinnedColumns}
              pinColumn={pinColumn}
              unpinColumn={unpinColumn}
              toggleTextWrapping={toggleTextWrapping}
              isTextWrapped={isTextWrapped}
              resetPinnedColumns={resetPinnedColumns}
              onColumnOrderChange={setColumnOrder}
              onResetAll={resetAll}
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-md border border-border-color">
        {isLoading ? (
          <TableSkeleton
            columns={[
              { header: "", width: "80px" },
              { header: "Payment Received No", width: "200px" },
              { header: "Payment Date", width: "150px" },
              { header: "Customer", width: "200px" },
              { header: "Account", width: "200px" },
              { header: "Payment Mode", width: "150px" },
              { header: "Amount Received", width: "150px" },
              { header: "Created By", width: "150px" },
              { header: "Created On", width: "180px" },
            ]}
            pageSize={pagination.pageSize}
          />
        ) : (
          <DocumentTable
            columns={orderedColumns.filter(
              (column) => columnVisibility[column.key] !== false
            )}
            maxHeight="calc(100vh - 350px)"
            data={paymentReceivedResponse?.data || []}
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
            columnVisibility={columnVisibility}
            alwaysVisibleColumns={getAlwaysVisibleColumns()}
            pinnedColumns={pinnedColumns}
            isTextWrapped={isTextWrapped}
            columnWidths={columnWidths}
            onColumnWidthsChange={setColumnWidths}
            emptyState={
              error ? (
                <>
                  Error loading payment received records. Please try again
                  later.
                </>
              ) : debouncedSearch ? (
                <>
                  No payment received records found matching "{debouncedSearch}
                  ".
                </>
              ) : (
                <>No pending payment received records found for approval.</>
              )
            }
          />
        )}
      </div>

      <ConfirmationDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={confirmReject}
        showReasonInput={true}
        reason={rejectionReason}
        onReasonChange={setRejectionReason}
        title="Reject Payment Received"
        description={`Please provide a reason for rejecting ${selectedItemsCount} payment received record${selectedItemsCount > 1 ? "s" : ""}.`}
        reasonLabel="Rejection Reason"
        reasonPlaceholder="Enter reason for rejection..."
        reasonRequired={true}
        variant="reject"
        isLoading={bulkChangeStatusMutation.isPending}
        loadingText="Rejecting..."
      />

      <ConfirmationDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        onConfirm={confirmApprove}
        title="Mark as Received"
        description={`Are you sure you want to mark ${selectedItemsCount} payment received record${selectedItemsCount > 1 ? "s" : ""} as received? This action cannot be undone.`}
        confirmLabel="Mark as Received"
        variant="success"
        isLoading={bulkChangeStatusMutation.isPending}
        loadingText="Marking as Received..."
      />

      <ConfirmationDialog
        open={showDraftDialog}
        onOpenChange={setShowDraftDialog}
        onConfirm={confirmSendToDraft}
        title="Send to Draft"
        description={`Are you sure you want to send ${selectedItemsCount} payment received record${selectedItemsCount > 1 ? "s" : ""} back to draft status?`}
        confirmLabel="Send to Draft"
        variant="warning"
        isLoading={bulkChangeStatusMutation.isPending}
        loadingText="Sending to Draft..."
      />
    </CustomContainer>
  );
};

export default PaymentReceivedApprovals;
