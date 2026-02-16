import React, { useEffect, useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import {
  BarChart3,
  CalendarRange,
  RefreshCw,
  Download,
  FileText,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

import {
  useLedgerReport,
  useExportLedgerReportPdf,
  useExportLedgerReportExcel,
  usePreviewLedgerReportPdf,
} from "@/hooks/api/Account/use-ledger-report";
import { useAccountsByTypesTree } from "@/hooks/api/Account";
import type {
  LedgerReportFilter,
  LedgerReportItem,
  LedgerReportSummary,
} from "@/types/Account/ledger-report";
import type { ScheduleTreeNode } from "@/types/Account/account";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WithPermission } from "@/components/ui/with-permission";
import { ModuleBase, Actions } from "@/lib/permissions";
import { DatePicker } from "@/components/ui/date-picker";
import {
  TreeDropdown,
  type TreeItem,
} from "@/components/ui/select/tree-dropdown/tree-dropdown";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";
import { useTableLayout } from "@/hooks/common";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModalDialog } from "@/components/ui/modal-dialog";

const formatNumber = (value?: number) =>
  (value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const LedgerReportPage: React.FC = () => {
  const { user } = useAuthContext();
  const [searchParams] = useSearchParams();
  const [fromDate, setFromDate] = useState<Date | undefined>(
    startOfMonth(new Date())
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [accountGUID, setAccountGUID] = useState<string | undefined>(undefined);
  const [submittedFilter, setSubmittedFilter] = useState<
    LedgerReportFilter | undefined
  >();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] =
    useState<boolean>(false);

  // Read account GUID from URL params
  useEffect(() => {
    const accountGuidParam = searchParams.get("strAccountGUID");
    const asOfDateParam = searchParams.get("dtAsOfDate");
    if (accountGuidParam) {
      setAccountGUID(accountGuidParam);
    }
    if (asOfDateParam) {
      const asOfDate = new Date(asOfDateParam);
      setToDate(asOfDate);
      setFromDate(startOfMonth(asOfDate));
    }
  }, [searchParams]);

  // Auto-apply filter if account GUID is set from URL and dates are available
  useEffect(() => {
    const accountGuidParam = searchParams.get("strAccountGUID");
    if (accountGuidParam && fromDate && toDate && !submittedFilter) {
      const filter: LedgerReportFilter = {
        dtFromDate: format(fromDate, "yyyy-MM-dd"),
        dtToDate: format(toDate, "yyyy-MM-dd"),
        strAccountGUID: accountGuidParam,
      };
      setSubmittedFilter(filter);
    }
  }, [searchParams, fromDate, toDate, submittedFilter]);

  const defaultColumnOrder = [
    "dtTradeDate",
    "strAccountName",
    "strNarration",
    "strVoucherType",
    "strBillNo",
    "dblDebit_Base",
    "dblCredit_Base",
    "dblBalance_Base",
  ];

  // Column visibility setup with pinned columns
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
    setColumnOrder,
    columnWidths,
    setColumnWidths,
    resetAll,
  } = useTableLayout("ledger-report-columns", defaultColumnOrder, [], {
    dtTradeDate: true,
    strAccountName: true,
    strNarration: true,
    strVoucherType: true,
    strBillNo: true,
    dblDebit_Base: true,
    dblCredit_Base: true,
    dblBalance_Base: true,
  });

  const { data: accountsTreeData, isLoading: isAccountsLoading } =
    useAccountsByTypesTree(
      {
        maxLevel: 0,
      },
      { enabled: isAccountDropdownOpen }
    );

  const {
    data: report,
    isLoading: isReportLoading,
    isFetching: isReportFetching,
    refetch: refetchReport,
  } = useLedgerReport(submittedFilter, false);

  const exportPdfMutation = useExportLedgerReportPdf();
  const previewPdfMutation = usePreviewLedgerReportPdf();
  const exportExcelMutation = useExportLedgerReportExcel();

  const accountTreeItems = useMemo<TreeItem[]>(() => {
    if (!accountsTreeData?.scheduleTree) return [];

    const toTreeItems = (nodes: ScheduleTreeNode[]): TreeItem[] => {
      return nodes.map((node) => {
        const scheduleItem: TreeItem = {
          id: node.strScheduleGUID,
          name: node.strScheduleName,
          code: node.strScheduleCode,
          type: "label",
          children: [],
        };

        const accountChildren: TreeItem[] = node.accounts.map((acc) => ({
          id: acc.strAccountGUID,
          name: acc.strAccountName,
          type: "data",
          children: [],
        }));

        const childSchedules =
          node.children && node.children.length > 0
            ? toTreeItems(node.children)
            : [];

        scheduleItem.children = [...accountChildren, ...childSchedules];
        return scheduleItem;
      });
    };

    return toTreeItems(accountsTreeData.scheduleTree);
  }, [accountsTreeData]);

  const handleApplyFilter = () => {
    if (!fromDate) {
      toast.error("Please select From Date");
      return;
    }

    if (!toDate) {
      toast.error("Please select To Date");
      return;
    }

    const filter: LedgerReportFilter = {
      dtFromDate: format(fromDate, "yyyy-MM-dd"),
      dtToDate: format(toDate, "yyyy-MM-dd"),
      strAccountGUID: accountGUID,
    };

    setSubmittedFilter(filter);
  };

  const columns = useMemo<DataTableColumn<LedgerReportItem>[]>(
    () => [
      {
        key: "dtTradeDate",
        header: "Date",
        cell: (item) => format(new Date(item.dtTradeDate), "dd MMM yyyy"),
        sortable: false,
        width: "140px",
      },
      {
        key: "strAccountName",
        header: "Account",
        cell: (item) => (
          <div className="flex items-center gap-2">
            <div
              className={
                isTextWrapped
                  ? "wrap-break-word text-xs text-muted-foreground"
                  : "truncate text-xs text-muted-foreground"
              }
              title={item.strAccountCode || ""}
            >
              {item.strAccountCode || ""}
            </div>
            <div
              className={
                isTextWrapped
                  ? "wrap-break-word font-medium leading-tight"
                  : "truncate font-medium leading-tight"
              }
              title={item.strAccountName || ""}
            >
              {item.strAccountName || "-"}
            </div>
          </div>
        ),
        width: "260px",
      },
      {
        key: "strNarration",
        header: "Transaction Details",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strNarration || "-"}
          >
            {item.strNarration || "-"}
          </div>
        ),
        width: "260px",
      },
      {
        key: "strVoucherType",
        header: "Transaction Type",
        cell: (item) => (
          <div
            className={
              isTextWrapped
                ? "wrap-break-word  font-medium"
                : "truncate font-medium"
            }
            title={item.strVoucherType || ""}
          >
            {item.strVoucherType || "-"}
          </div>
        ),
        width: "150px",
      },
      {
        key: "strBillNo",
        header: "Transaction No",
        cell: (item) =>
          item.strBillNo ? (
            <button
              onClick={() => {
                const voucherType = item.strVoucherType?.toLowerCase() || "";
                let url = "";
                if (voucherType.includes("purchase")) {
                  url = `/purchase-invoice/${item.strVoucherGUID}`;
                } else if (
                  voucherType.includes("invoice") ||
                  voucherType.includes("sales")
                ) {
                  url = `/invoice/${item.strVoucherGUID}`;
                } else if (voucherType.includes("payment made")) {
                  url = `/payment-made/${item.strVoucherGUID}`;
                } else if (voucherType.includes("payment received")) {
                  url = `/payment-received/${item.strVoucherGUID}`;
                } else if (
                  voucherType.includes("payment") ||
                  voucherType.includes("receipt")
                ) {
                  url = `/payment-receipt/${item.strVoucherGUID}`;
                } else if (voucherType.includes("journal")) {
                  url = `/journal-voucher/${item.strVoucherGUID}`;
                }
                if (url) {
                  window.open(url, "_blank");
                }
              }}
              className="text-primary cursor-pointer hover:text-primary/90 underline font-medium whitespace-nowrap"
              title={item.strBillNo}
            >
              {item.strBillNo}
            </button>
          ) : (
            <span>-</span>
          ),
        width: "165px",
      },
      {
        key: "dtTradeDate",
        header: "Trade Date",
        cell: (item) =>
          item.dtTradeDate
            ? format(new Date(item.dtTradeDate), "dd MMM yyyy")
            : "-",
        width: "140px",
      },
      {
        key: "dblDebit_Base",
        header: "Debit",
        cell: (item) => (
          <div
            className={`text-right ${item.dblDebit_Base && item.dblDebit_Base > 0 ? "text-red-500" : "text-muted-foreground"}`}
          >
            {formatNumber(item.dblDebit_Base)}
          </div>
        ),
        width: "140px",
        align: "right",
      },
      {
        key: "dblCredit_Base",
        header: "Credit",
        cell: (item) => (
          <div
            className={`text-right ${item.dblCredit_Base && item.dblCredit_Base > 0 ? "text-green-600" : "text-muted-foreground"}`}
          >
            {formatNumber(item.dblCredit_Base)}
          </div>
        ),
        width: "140px",
        align: "right",
      },
      {
        key: "dblBalance_Base",
        header: "Balance",
        cell: (item) => (
          <div className="text-right font-medium text-muted-foreground">
            {formatNumber(item.dblBalance_Base)} {item.strBalanceType}
          </div>
        ),
        width: "160px",
        align: "right",
      },
    ],
    [isTextWrapped]
  );

  useEffect(() => {
    if (submittedFilter?.dtFromDate && submittedFilter?.dtToDate) {
      refetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedFilter]);

  const summary: LedgerReportSummary | undefined = report?.summary ?? undefined;

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery || !report?.items) return report?.items ?? [];

    const query = searchQuery.toLowerCase();
    return report.items.filter((item) => {
      return (
        item.strAccountName?.toLowerCase().includes(query) ||
        item.strAccountCode?.toLowerCase().includes(query) ||
        item.strNarration?.toLowerCase().includes(query) ||
        item.strVoucherType?.toLowerCase().includes(query) ||
        item.strBillNo?.toLowerCase().includes(query) ||
        format(new Date(item.dtTradeDate), "dd MMM yyyy")
          .toLowerCase()
          .includes(query) ||
        item.dblDebit_Base?.toString().includes(query) ||
        item.dblCredit_Base?.toString().includes(query) ||
        item.dblBalance_Base?.toString().includes(query) ||
        item.strBalanceType?.toLowerCase().includes(query)
      );
    });
  }, [report?.items, searchQuery]);

  const handleExportPdf = () => {
    if (!submittedFilter?.dtFromDate || !submittedFilter?.dtToDate) {
      toast.error("Generate the report before exporting");
      return;
    }
    exportPdfMutation.mutate(submittedFilter);
  };

  const handlePreviewPdf = async () => {
    if (!submittedFilter?.dtFromDate || !submittedFilter?.dtToDate) {
      toast.error("Generate the report before previewing");
      return;
    }
    try {
      const blob = await previewPdfMutation.mutateAsync(submittedFilter);
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setIsPreviewModalOpen(true);
    } catch {
      // Error is already handled by the hook
    }
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  const handleExportExcel = () => {
    if (!submittedFilter?.dtFromDate || !submittedFilter?.dtToDate) {
      toast.error("Generate the report before exporting");
      return;
    }
    exportExcelMutation.mutate(submittedFilter);
  };

  // Skeleton component for the ledger report page
  const LedgerReportSkeleton = () => (
    <div className="grid gap-4 lg:grid-cols-[1.2fr]">
      {/* Filter Card Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <Skeleton className="h-6 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards Skeleton */}
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="py-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Column Visibility Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-9 w-full sm:max-w-md sm:flex-1" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Table Card Skeleton */}
      <TableSkeleton
        columns={[
          { header: "Date", width: "140px" },
          { header: "Account", width: "220px" },
          { header: "Transaction Details", width: "260px" },
          { header: "Transaction Type", width: "150px" },
          { header: "Transaction No", width: "165px" },
          { header: "Trade Date", width: "140px" },
          { header: "Debit", width: "140px" },
          { header: "Credit", width: "140px" },
          { header: "Balance", width: "160px" },
        ]}
        pageSize={10}
      />
    </div>
  );

  return (
    <CustomContainer>
      <PageHeader
        title="Ledger Report"
        description="View ledger entries with running balances and quick totals."
        icon={BarChart3}
      />

      {isAccountsLoading ? (
        <LedgerReportSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarRange className="h-4 w-4" /> Filters
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <WithPermission
                  module={ModuleBase.LEDGER_REPORT}
                  action={Actions.PRINT}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewPdf}
                    disabled={
                      !submittedFilter ||
                      previewPdfMutation.isPending ||
                      isReportLoading ||
                      isReportFetching
                    }
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Preview PDF
                  </Button>
                </WithPermission>
                <WithPermission
                  module={ModuleBase.LEDGER_REPORT}
                  action={Actions.EXPORT}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          !submittedFilter ||
                          exportPdfMutation.isPending ||
                          exportExcelMutation.isPending ||
                          isReportLoading ||
                          isReportFetching
                        }
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportPdf}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportExcel}>
                        <Download className="mr-2 h-4 w-4" />
                        Export as Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </WithPermission>
                <WithPermission
                  module={ModuleBase.LEDGER_REPORT}
                  action={Actions.VIEW}
                >
                  <Button onClick={handleApplyFilter} size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </WithPermission>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  From Date <span className="text-red-500">*</span>
                </p>
                <DatePicker
                  value={fromDate}
                  onChange={setFromDate}
                  placeholder="Select from date"
                  restricted={true}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  To Date <span className="text-red-500">*</span>
                </p>
                <DatePicker
                  value={toDate}
                  onChange={setToDate}
                  placeholder="Select to date"
                  restricted={true}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Account</p>
                <TreeDropdown
                  data={accountTreeItems}
                  placeholder="All Accounts"
                  value={accountGUID ? [accountGUID] : []}
                  onSelectionChange={(items) => {
                    const first = items.find((i) => i.type === "data");
                    setAccountGUID(first ? first.id : undefined);
                  }}
                  onOpenChange={setIsAccountDropdownOpen}
                  isLoading={isAccountsLoading}
                  clearable
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Opening Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatNumber(summary?.dblOpeningBalance_Base)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Total Debit
                </CardTitle>
              </CardHeader>
              <CardContent
                className={`text-2xl font-semibold ${summary?.dblTotalDebit_Base && summary.dblTotalDebit_Base > 0 ? "text-red-500" : ""}`}
              >
                {formatNumber(summary?.dblTotalDebit_Base)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Total Credit
                </CardTitle>
              </CardHeader>
              <CardContent
                className={`text-2xl font-semibold ${summary?.dblTotalCredit_Base && summary.dblTotalCredit_Base > 0 ? "text-green-600" : ""}`}
              >
                {formatNumber(summary?.dblTotalCredit_Base)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Closing Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatNumber(summary?.dblClosingBalance_Base)}{" "}
                {summary?.strClosingBalanceType}
              </CardContent>
            </Card>
          </div>

          {submittedFilter && (
            <div className="flex flex-col sm:flex-row gap-4">
              <SearchInput
                placeholder="Search through all columns..."
                onSearchChange={setSearchQuery}
                className="w-full sm:max-w-md sm:flex-1"
              />
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
                      "ledger-report-columns_column_order",
                      JSON.stringify(order)
                    );
                  }}
                  onResetAll={resetAll}
                />
              </div>
            </div>
          )}

          {isReportLoading ? (
            <TableSkeleton
              columns={columns.map((col) => ({
                header: typeof col.header === "string" ? col.header : "",
                width: col.width,
              }))}
              pageSize={10}
            />
          ) : (
            <DataTable<LedgerReportItem>
              data={submittedFilter ? filteredData : []}
              columns={columns}
              keyExtractor={(item) => item.strLedgerGUID}
              loading={isReportLoading}
              columnVisibility={columnVisibility}
              alwaysVisibleColumns={getAlwaysVisibleColumns()}
              pinnedColumns={pinnedColumns}
              isTextWrapped={isTextWrapped}
              columnWidths={columnWidths}
              onColumnWidthsChange={(widths) => {
                setColumnWidths(widths);
                localStorage.setItem(
                  "ledger-report-columns_column_widths",
                  JSON.stringify(widths)
                );
              }}
              emptyState={
                submittedFilter ? (
                  <div className="py-6 text-center">No records found</div>
                ) : (
                  <p className="text-muted-foreground">
                    Select the proper date range and click the Generate button
                    to view the ledger report
                  </p>
                )
              }
              maxHeight="calc(100vh - 350px)"
            />
          )}
        </div>
      )}

      {/* Currency Type Display */}
      {submittedFilter && user?.strCurrencyTypeName && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>**Amount is displayed in your base currency</span>
          <Badge variant="default">{user.strCurrencyTypeName}</Badge>
        </div>
      )}

      <ModalDialog
        open={isPreviewModalOpen}
        onOpenChange={handleClosePreviewModal}
        title="Ledger Report Preview"
        maxWidth="1200px"
        fullHeight={true}
        showCloseButton={true}
      >
        {previewPdfUrl && (
          <iframe
            src={previewPdfUrl}
            className="w-full h-full min-h-150"
            title="Ledger Report PDF Preview"
          />
        )}
      </ModalDialog>
    </CustomContainer>
  );
};

export default LedgerReportPage;
