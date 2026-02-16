import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare, CheckCircle, XCircle, FilePen } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

import type { PaymentMade } from "@/types/Account/payment-made";

import { FormModules } from "@/lib/permissions";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import {
  usePaymentMadePendingApproval,
  useChangePaymentMadeStatus,
} from "@/hooks/api/Account/use-payment-made";
import { useActiveVendorsByType } from "@/hooks/api/Account/use-vendors";
import { useAccountsByTypesTree } from "@/hooks/api/Account";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { IndeterminateCheckbox } from "@/components/ui/IndeterminateCheckbox";
import { MultiSelect } from "@/components/ui/select/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { TreeDropdown } from "@/components/ui/select/tree-dropdown";
import {
  DocumentTable,
  type DocumentTableColumn,
} from "@/components/data-display/data-tables/CheckboxDataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";

const PaymentMadeApprovals: React.FC = () => {
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const defaultColumnOrder = [
    "select",
    "strPaymentMadeNo",
    "dtPaymentMadeDate",
    "strVendorName",
    "strAccountName",
    "strPaymentMode",
    "dblTotalAmountMade",
    "strCreatedByName",
    "dtCreatedOn",
  ];

  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);
  const [showRejectDialog, setShowRejectDialog] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [showApproveDialog, setShowApproveDialog] = useState<boolean>(false);
  const [showDraftDialog, setShowDraftDialog] = useState<boolean>(false);

  const HeaderIcon = useMenuIcon(FormModules.PAYMENT_MADE, CheckSquare);
  const bulkChangeStatusMutation = useChangePaymentMadeStatus();

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "payment_made_approvals",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "dtPaymentMadeDate",
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
    "payment_made_approvals",
    defaultColumnOrder,
    [
      "select",
      "strPaymentMadeGUID",
      "strOrganizationGUID",
      "strCreatedByGUID",
      "strUpdatedByGUID",
      "strVendorGUID",
      "strAccountGUID",
    ],
    {
      strPaymentMadeNo: true,
      dtPaymentMadeDate: true,
      strVendorName: true,
      strAccountName: true,
      strPaymentMode: true,
      dblTotalAmountMade: true,
      strCreatedByName: true,
      dtCreatedOn: true,
    }
  );

  const {
    data: paymentMadeResponse,
    isLoading,
    error,
  } = usePaymentMadePendingApproval({
    search: debouncedSearch,
    fromDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    toDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    strVendorGUID: selectedVendors.length > 0 ? selectedVendors[0] : undefined,
    strAccountGUID: selectedAccount || undefined,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: sorting.columnKey || undefined,
    ascending: sorting.direction === "asc",
  });

  // Vendors: lazy load with search
  const vendorsEnabled = isVendorDropdownOpen;
  const { data: vendorsResponse, isLoading: isVendorsLoading } =
    useActiveVendorsByType(
      { strPartyType: "Vendor", search: vendorSearch },
      vendorsEnabled
    );

  // Accounts: lazy load tree
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
    if (paymentMadeResponse) {
      setPagination({
        pageNumber: paymentMadeResponse.pageNumber,
        pageSize: paymentMadeResponse.pageSize,
        totalCount: paymentMadeResponse.totalRecords,
        totalPages: paymentMadeResponse.totalPages,
      });
    }
  }, [paymentMadeResponse, setPagination]);

  useEffect(() => {
    setSelectedRows({});
    setSelectAll(false);
    setIndeterminate(false);
  }, [
    debouncedSearch,
    dateRange.from,
    dateRange.to,
    selectedVendors,
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

      if (checked && paymentMadeResponse?.data) {
        const newSelectedRows: Record<string, boolean> = {};
        paymentMadeResponse.data.forEach((doc) => {
          newSelectedRows[doc.strPaymentMadeGUID] = true;
        });
        setSelectedRows(newSelectedRows);
      } else {
        setSelectedRows({});
      }
    },
    [paymentMadeResponse?.data]
  );

  const handleRowSelection = useCallback((paymentMadeId: string) => {
    setSelectedRows((prev) => ({
      ...prev,
      [paymentMadeId]: !prev[paymentMadeId],
    }));
  }, []);

  useEffect(() => {
    const selectedCount = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    ).length;

    if (paymentMadeResponse?.data && paymentMadeResponse.data.length > 0) {
      if (selectedCount === paymentMadeResponse.data.length) {
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
  }, [paymentMadeResponse?.data, selectedRows]);

  const selectedItemsCount = useMemo(() => {
    return Object.keys(selectedRows).filter((id) => selectedRows[id]).length;
  }, [selectedRows]);

  const handleBulkApprove = async () => {
    const selectedIds = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    );
    if (selectedIds.length === 0) return;

    await bulkChangeStatusMutation.mutateAsync({
      strPaymentMadeGUIDs: selectedIds,
      strStatus: "Paid",
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
      strPaymentMadeGUIDs: selectedIds,
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
      strPaymentMadeGUIDs: selectedIds,
      strStatus: "Draft",
    });
    setSelectedRows({});
    setSelectedAction("");
  };

  const handleSubmitAction = () => {
    if (!selectedAction) return;

    if (selectedAction === "Rejected") {
      handleBulkReject();
    } else if (selectedAction === "Paid") {
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

  const columns = useMemo<DocumentTableColumn<PaymentMade>[]>(() => {
    const baseColumns: DocumentTableColumn<PaymentMade>[] = [];

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
            checked={!!selectedRows[item.strPaymentMadeGUID]}
            onCheckedChange={() => handleRowSelection(item.strPaymentMadeGUID)}
            aria-label={`Select ${item.strPaymentMadeNo}`}
          />
        </div>
      ),
      sortable: false,
    });

    baseColumns.push(
      {
        key: "strPaymentMadeNo",
        header: "Payment Made No",
        cell: (item) => (
          <div
            className="text-blue-500 hover:text-blue-600 font-semibold text-base ml-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/payment-made/${item.strPaymentMadeGUID}`, "_blank");
            }}
          >
            {item.strPaymentMadeNo}
          </div>
        ),
        width: "220px",
        sortable: true,
      },
      {
        key: "dtPaymentMadeDate",
        header: "Payment Date",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {format(new Date(item.dtPaymentMadeDate), "dd-MM-yyyy")}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "strVendorName",
        header: "Vendor",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strVendorName || ""}
          >
            {item.strVendorName || "-"}
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
            title={item.strPaymentMode || "-"}
          >
            {item.strPaymentMode || "-"}
          </div>
        ),
        width: "180px",
        sortable: true,
      },
      {
        key: "dblTotalAmountMade",
        header: "Amount Made",
        cell: (item) => (
          <div className="text-right font-medium">
            {item.dblTotalAmountMade?.toFixed(2) || "0.00"}
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
        title="Payment Made Approvals"
        description="Review and approve pending payment made records"
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
                  <SelectItem value="Paid">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Mark as Paid</span>
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
            placeholder="Search payment made..."
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
                (vendorsResponse || []).map((vendor) => ({
                  label: vendor.strPartyName_Display || vendor.strPartyGUID,
                  value: vendor.strPartyGUID,
                })) || []
              }
              selectedValues={selectedVendors}
              onChange={setSelectedVendors}
              onOpenChange={(isOpen) => {
                setIsVendorDropdownOpen(isOpen);
                if (isOpen) setVendorSearch("");
              }}
              onInputChange={setVendorSearch}
              placeholder="Filter by vendor"
              initialMessage=""
              isLoading={isVendorsLoading}
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
              isLoading={isAccountsLoading}
              onOpenChange={(isOpen: boolean) =>
                setIsAccountDropdownOpen(isOpen)
              }
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
              { header: "Payment Made No", width: "200px" },
              { header: "Payment Date", width: "150px" },
              { header: "Vendor", width: "200px" },
              { header: "Account", width: "200px" },
              { header: "Payment Mode", width: "150px" },
              { header: "Amount Made", width: "150px" },
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
            data={paymentMadeResponse?.data || []}
            sortBy={sorting.columnKey || undefined}
            ascending={sorting.direction === "asc"}
            onSort={handleSortChange}
            keyExtractor={(item) => item.strPaymentMadeGUID}
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
                <>Error loading payment made records. Please try again later.</>
              ) : debouncedSearch ? (
                <>No payment made records found matching "{debouncedSearch}".</>
              ) : (
                <>No pending payment made records found for approval.</>
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
        title="Reject Payment Made"
        description={`Please provide a reason for rejecting ${selectedItemsCount} payment made record${selectedItemsCount > 1 ? "s" : ""}.`}
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
        title="Mark as Paid"
        description={`Are you sure you want to mark ${selectedItemsCount} payment made record${selectedItemsCount > 1 ? "s" : ""} as paid? This action cannot be undone.`}
        confirmLabel="Mark as Paid"
        variant="success"
        isLoading={bulkChangeStatusMutation.isPending}
        loadingText="Marking as Paid..."
      />

      <ConfirmationDialog
        open={showDraftDialog}
        onOpenChange={setShowDraftDialog}
        onConfirm={confirmSendToDraft}
        title="Send to Draft"
        description={`Are you sure you want to send ${selectedItemsCount} payment made record${selectedItemsCount > 1 ? "s" : ""} back to draft status?`}
        confirmLabel="Send to Draft"
        variant="warning"
        isLoading={bulkChangeStatusMutation.isPending}
        loadingText="Sending to Draft..."
      />
    </CustomContainer>
  );
};

export default PaymentMadeApprovals;
