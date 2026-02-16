import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare, CheckCircle, XCircle, FilePen } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

import type { InvoiceListItem } from "@/types/Account/salesinvoice";

import { FormModules } from "@/lib/permissions";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { useActiveCurrencyTypes } from "@/hooks/api";
import {
  usePendingApprovalInvoices,
  useBulkChangeInvoiceStatus,
} from "@/hooks";

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
import {
  DocumentTable,
  type DocumentTableColumn,
} from "@/components/data-display/data-tables/CheckboxDataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";

const InvoiceApprovals: React.FC = () => {
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const defaultColumnOrder = [
    "select",
    "strInvoiceNo",
    "dInvoiceDate",
    "strOrderNo",
    "strPartyName",
    "dblNetAmt",
    "strCurrencyTypeName",
    "bolIsPaid",
    "strCreatedByName",
    "dtCreatedOn",
  ];

  const [selectedCurrencyTypes, setSelectedCurrencyTypes] = useState<string[]>(
    []
  );
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [isCurrencyTypeDropdownOpen, setIsCurrencyTypeDropdownOpen] =
    useState(false);
  const [currencySearch, setCurrencySearch] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);
  const [showRejectDialog, setShowRejectDialog] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [showApproveDialog, setShowApproveDialog] = useState<boolean>(false);
  const [showDraftDialog, setShowDraftDialog] = useState<boolean>(false);

  const HeaderIcon = useMenuIcon(FormModules.INVOICE, CheckSquare);
  const bulkChangeStatusMutation = useBulkChangeInvoiceStatus();

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "invoice_approvals",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strInvoiceNo",
        direction: "desc",
      },
    }
  );

  const ascending = sorting.direction === "desc";

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
    "invoice_approvals",
    defaultColumnOrder,
    [
      "select",
      "strInvoiceGUID",
      "strOrganizationGUID",
      "strCreatedByGUID",
      "strUpdatedByGUID",
    ],
    {
      actions: true,
      dInvoiceDate: true,
      strInvoiceNo: true,
      strOrderNo: true,
      strPartyName: true,
      dblNetAmt: true,
      strCurrencyTypeName: true,
      bolIsPaid: true,
      strCreatedByName: true,
      dtCreatedOn: true,
    }
  );

  const {
    data: invoicesResponse,
    isLoading,
    error,
  } = usePendingApprovalInvoices({
    search: debouncedSearch,
    fromDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    toDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    strCurrencyTypeGUIDs:
      selectedCurrencyTypes.length > 0
        ? selectedCurrencyTypes.join(",")
        : undefined,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: sorting.columnKey || undefined,
    ascending,
  });

  const { data: currencyTypes } = useActiveCurrencyTypes(
    currencySearch,
    isCurrencyTypeDropdownOpen
  );

  useEffect(() => {
    if (invoicesResponse) {
      setPagination({
        pageNumber: invoicesResponse.pageNumber,
        pageSize: invoicesResponse.pageSize,
        totalCount: invoicesResponse.totalRecords,
        totalPages: invoicesResponse.totalPages,
      });
    }
  }, [invoicesResponse, setPagination]);

  useEffect(() => {
    setSelectedRows({});
    setSelectAll(false);
    setIndeterminate(false);
  }, [debouncedSearch, dateRange.from, dateRange.to, selectedCurrencyTypes]);

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

      if (checked && invoicesResponse?.data) {
        const newSelectedRows: Record<string, boolean> = {};
        invoicesResponse.data.forEach((doc) => {
          newSelectedRows[doc.strInvoiceGUID] = true;
        });
        setSelectedRows(newSelectedRows);
      } else {
        setSelectedRows({});
      }
    },
    [invoicesResponse?.data]
  );

  const handleRowSelection = useCallback((invoiceId: string) => {
    setSelectedRows((prev) => ({
      ...prev,
      [invoiceId]: !prev[invoiceId],
    }));
  }, []);

  useEffect(() => {
    const selectedCount = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    ).length;

    if (invoicesResponse?.data && invoicesResponse.data.length > 0) {
      if (selectedCount === invoicesResponse.data.length) {
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
  }, [invoicesResponse?.data, selectedRows]);

  const selectedItemsCount = useMemo(() => {
    return Object.keys(selectedRows).filter((id) => selectedRows[id]).length;
  }, [selectedRows]);

  const handleBulkApprove = async () => {
    const selectedIds = Object.keys(selectedRows).filter(
      (id) => selectedRows[id]
    );
    if (selectedIds.length === 0) return;

    await bulkChangeStatusMutation.mutateAsync({
      strInvoiceGUIDs: selectedIds,
      strStatus: "Approved",
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
      strInvoiceGUIDs: selectedIds,
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
      strInvoiceGUIDs: selectedIds,
      strStatus: "Draft",
    });
    setSelectedRows({});
    setSelectedAction("");
  };

  const handleSubmitAction = () => {
    if (!selectedAction) return;

    if (selectedAction === "Rejected") {
      handleBulkReject();
    } else if (selectedAction === "Approved") {
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

  const columns = useMemo<DocumentTableColumn<InvoiceListItem>[]>(() => {
    const baseColumns: DocumentTableColumn<InvoiceListItem>[] = [];

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
            checked={!!selectedRows[item.strInvoiceGUID]}
            onCheckedChange={() => handleRowSelection(item.strInvoiceGUID)}
            aria-label={`Select ${item.strInvoiceNo}`}
          />
        </div>
      ),
      sortable: false,
    });

    baseColumns.push(
      {
        key: "strInvoiceNo",
        header: " Sales Invoice No",
        cell: (item) => (
          <div
            className="text-blue-500 hover:text-blue-600 font-semibold text-base ml-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/invoice/${item.strInvoiceGUID}`, "_blank");
            }}
          >
            {item.strInvoiceNo}
          </div>
        ),
        width: "180px",
        sortable: true,
      },
      {
        key: "dInvoiceDate",
        header: "Sales Invoice Date",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {format(new Date(item.dInvoiceDate), "dd-MM-yyyy")}
          </div>
        ),
        width: "180px",
        sortable: true,
      },
      {
        key: "strOrderNo",
        header: "PO Reference No",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strOrderNo || "-"}
          >
            {item.strOrderNo || "-"}
          </div>
        ),
        width: "180px",
        sortable: true,
      },
      {
        key: "strPartyName",
        header: "Party",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strPartyName || ""}
          >
            {item.strPartyName || "-"}
          </div>
        ),
        width: "200px",
        sortable: true,
      },
      {
        key: "dblNetAmt",
        header: "Net Amount",
        cell: (item) => (
          <div className="text-right font-medium">
            {item.dblNetAmt?.toFixed(2) || "0.00"}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "strCurrencyTypeName",
        header: "Currency",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCurrencyTypeName || "-"}
          >
            {item.strCurrencyTypeName || "-"}
          </div>
        ),
        width: "120px",
        sortable: true,
      },
      {
        key: "bolIsPaid",
        header: "Paid",
        cell: (item) => <div>{item.bolIsPaid ? "Yes" : "No"}</div>,
        width: "100px",
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
        title="Sales Invoice Approvals"
        description="Review and approve pending sales invoices"
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
                  <SelectItem value="Approved">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
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
            placeholder="Search sales invoices..."
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
                (currencyTypes || []).map((currency) => ({
                  label: currency.strName,
                  value: currency.strCurrencyTypeGUID,
                })) || []
              }
              selectedValues={selectedCurrencyTypes}
              onChange={setSelectedCurrencyTypes}
              onOpenChange={(isOpen) => {
                setIsCurrencyTypeDropdownOpen(isOpen);
                if (isOpen) setCurrencySearch("");
              }}
              onInputChange={setCurrencySearch}
              placeholder="Filter by currency"
              initialMessage=""
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
              { header: "Sales Invoice No", width: "180px" },
              { header: "Sales Invoice Date", width: "120px" },
              { header: "PO Reference No", width: "150px" },
              { header: "Party", width: "200px" },
              { header: "Net Amount", width: "120px" },
              { header: "Currency", width: "100px" },
              { header: "Paid", width: "100px" },
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
            data={invoicesResponse?.data || []}
            sortBy={sorting.columnKey || undefined}
            ascending={sorting.direction === "asc"}
            onSort={handleSortChange}
            keyExtractor={(item) => item.strInvoiceGUID}
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
                <>Error loading sales invoices. Please try again later.</>
              ) : debouncedSearch ? (
                <>No sales invoices found matching "{debouncedSearch}".</>
              ) : (
                <>No pending sales invoices found for approval.</>
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
        title="Reject Sales Invoices"
        description={`Please provide a reason for rejecting ${selectedItemsCount} sales invoice${selectedItemsCount > 1 ? "s" : ""}.`}
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
        title="Approve Sales Invoices"
        description={`Are you sure you want to approve ${selectedItemsCount} sales invoice${selectedItemsCount > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmLabel="Approve"
        variant="success"
        isLoading={bulkChangeStatusMutation.isPending}
        loadingText="Approving..."
      />

      <ConfirmationDialog
        open={showDraftDialog}
        onOpenChange={setShowDraftDialog}
        onConfirm={confirmSendToDraft}
        title="Send to Draft"
        description={`Are you sure you want to send ${selectedItemsCount} sales invoice${selectedItemsCount > 1 ? "s" : ""} back to draft status?`}
        confirmLabel="Send to Draft"
        variant="warning"
        isLoading={bulkChangeStatusMutation.isPending}
        loadingText="Sending to Draft..."
      />
    </CustomContainer>
  );
};

export default InvoiceApprovals;
