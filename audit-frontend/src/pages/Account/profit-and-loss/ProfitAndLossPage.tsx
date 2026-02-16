import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  TrendingUp,
  CalendarRange,
  RefreshCw,
  FileText,
  Download,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import {
  useProfitAndLoss,
  useExportProfitAndLossPdf,
  useExportProfitAndLossExcel,
  useExportProfitAndLossCsv,
  usePreviewProfitAndLossPdf,
} from "@/hooks/api/Account/use-profit-and-loss";
import type {
  ProfitAndLossFilter,
  ProfitAndLossScheduleNode,
  ProfitAndLossAccount,
} from "@/types/Account/profit-and-loss";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModalDialog } from "@/components/ui/modal-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WithPermission } from "@/components/ui/with-permission";
import { ModuleBase, Actions } from "@/lib/permissions";
import { DatePicker } from "@/components/ui/date-picker";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface FlatProfitAndLossItem {
  id: string;
  name: string;
  code: string;
  level: number;
  openingBalance: number;
  debit: number;
  credit: number;
  closingBalance: number;
  isSchedule: boolean;
}

const formatNumber = (value?: number) =>
  (value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const flattenProfitAndLossTree = (
  tree: ProfitAndLossScheduleNode[]
): FlatProfitAndLossItem[] => {
  const result: FlatProfitAndLossItem[] = [];

  const processNode = (
    node: ProfitAndLossScheduleNode,
    currentLevel: number = 0
  ) => {
    // Add the schedule node
    result.push({
      id: node.strScheduleGUID,
      name: node.strScheduleName,
      code: node.strScheduleCode,
      level: currentLevel,
      openingBalance: node.dblOpeningBalance_Base,
      debit: node.dblTotalDebit_Base,
      credit: node.dblTotalCredit_Base,
      closingBalance: node.dblScheduleBalance_Base,
      isSchedule: true,
    });

    // Add accounts
    node.accounts.forEach((account: ProfitAndLossAccount) => {
      result.push({
        id: account.strAccountGUID,
        name: account.strAccountName,
        code: account.strAccountCode,
        level: currentLevel + 1,
        openingBalance: account.dblOpeningBalance_Base,
        debit: account.dblTotalDebit_Base,
        credit: account.dblTotalCredit_Base,
        closingBalance: account.dblBalance_Base,
        isSchedule: false,
      });
    });

    // Process children
    node.children.forEach((child: ProfitAndLossScheduleNode) => {
      processNode(child, currentLevel + 1);
    });
  };

  tree.forEach((node) => processNode(node));
  return result;
};

const ProfitAndLossPage: React.FC = () => {
  const { user } = useAuthContext();
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 1)
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [submittedFilter, setSubmittedFilter] = useState<
    ProfitAndLossFilter | undefined
  >();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const {
    data: report,
    isLoading: isReportLoading,
    refetch,
  } = useProfitAndLoss(submittedFilter, false);

  const currentReport = report;
  const isLoading = isReportLoading;

  useEffect(() => {
    if (submittedFilter) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedFilter]);

  const exportPdfMutation = useExportProfitAndLossPdf();
  const exportExcelMutation = useExportProfitAndLossExcel();
  const exportCsvMutation = useExportProfitAndLossCsv();
  const previewPdfMutation = usePreviewProfitAndLossPdf();

  const handleApplyFilter = () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both From Date and To Date");
      return;
    }

    if (fromDate > toDate) {
      toast.error("From Date must be less than or equal to To Date");
      return;
    }

    const filter: ProfitAndLossFilter = {
      dtFromDate: format(fromDate, "yyyy-MM-dd"),
      dtToDate: format(toDate, "yyyy-MM-dd"),
      maxLevel: 4,
    };

    setSubmittedFilter(filter);
  };

  // Flatten the tree data
  const flattenedData = useMemo(() => {
    if (!currentReport?.scheduleTree) return [];
    return flattenProfitAndLossTree(currentReport.scheduleTree);
  }, [currentReport?.scheduleTree]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return flattenedData;

    const query = searchQuery.toLowerCase();
    return flattenedData.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const codeMatch = item.code?.toLowerCase().includes(query);
      return nameMatch || codeMatch;
    });
  }, [flattenedData, searchQuery]);

  const ensureFilterReady = () => {
    if (!submittedFilter?.dtFromDate) {
      toast.error("Generate the report before exporting");
      return false;
    }
    return true;
  };

  const handleExportPdf = () => {
    if (!ensureFilterReady()) return;
    exportPdfMutation.mutate(submittedFilter!);
  };

  const handleExportCsv = () => {
    if (!ensureFilterReady()) return;
    exportCsvMutation.mutate(submittedFilter!);
  };

  const handleExportExcel = () => {
    if (!ensureFilterReady()) return;
    exportExcelMutation.mutate(submittedFilter!);
  };

  const handlePreviewPdf = async () => {
    if (!ensureFilterReady()) return;
    try {
      const blob = await previewPdfMutation.mutateAsync(submittedFilter!);
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setIsPreviewModalOpen(true);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  const isExporting =
    exportPdfMutation.isPending ||
    exportExcelMutation.isPending ||
    exportCsvMutation.isPending;

  const isPreviewLoading = previewPdfMutation.isPending;

  return (
    <CustomContainer>
      <PageHeader
        title="Profit & Loss"
        description="View profit and loss report with revenue, expenses, and net profit calculations."
        icon={TrendingUp}
      />

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
                module={ModuleBase.PROFIT_AND_LOSS}
                action={Actions.PRINT}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewPdf}
                  disabled={!submittedFilter || isPreviewLoading || isLoading}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Preview PDF
                </Button>
              </WithPermission>
              <WithPermission
                module={ModuleBase.PROFIT_AND_LOSS}
                action={Actions.EXPORT}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!submittedFilter || isExporting || isLoading}
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
                    <DropdownMenuItem onClick={handleExportCsv}>
                      <Download className="mr-2 h-4 w-4" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportExcel}>
                      <Download className="mr-2 h-4 w-4" />
                      Export as Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </WithPermission>
              <WithPermission
                module={ModuleBase.PROFIT_AND_LOSS}
                action={Actions.VIEW}
              >
                <Button onClick={handleApplyFilter} size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate
                </Button>
              </WithPermission>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
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
          </CardContent>
        </Card>

        {submittedFilter && (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatNumber(currentReport?.dblTotalRevenue)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatNumber(currentReport?.dblTotalExpenses)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Expenses (By Nature)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatNumber(currentReport?.dblTotalExpensesByNature)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Net Profit
                  </CardTitle>
                </CardHeader>
                <CardContent
                  className={`text-2xl font-semibold ${
                    (currentReport?.dblNetProfit ?? 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatNumber(currentReport?.dblNetProfit)}
                </CardContent>
              </Card>
            </div>
            <SearchInput
              placeholder="Search schedules & accounts..."
              onSearchChange={setSearchQuery}
              className="w-full sm:max-w-md sm:flex-1"
            />
          </>
        )}

        {isLoading ? (
          <div className="border border-border-color rounded-md overflow-hidden bg-card">
            <Table className="w-full border-collapse">
              <TableHeader className="bg-gray-200 dark:bg-muted sticky top-0">
                <TableRow className="border-b flex h-12 items-center">
                  <TableHead
                    className="font-semibold text-foreground flex items-center"
                    style={{ width: "40%" }}
                  >
                    Schedule / Account
                  </TableHead>
                  <TableHead
                    className="font-semibold text-foreground pl-1 flex items-center justify-start"
                    style={{ width: "12%" }}
                  >
                    Code
                  </TableHead>
                  <TableHead
                    className="font-semibold text-right text-foreground flex items-center justify-end"
                    style={{ width: "12%" }}
                  >
                    Opening Balance
                  </TableHead>
                  <TableHead
                    className="font-semibold text-right text-foreground flex items-center justify-end"
                    style={{ width: "12%" }}
                  >
                    Debit
                  </TableHead>
                  <TableHead
                    className="font-semibold text-right text-foreground flex items-center justify-end"
                    style={{ width: "12%" }}
                  >
                    Credit
                  </TableHead>
                  <TableHead
                    className="font-semibold text-right text-foreground flex items-center justify-end"
                    style={{ width: "12%" }}
                  >
                    Closing Balance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="block overflow-y-auto max-h-[calc(100vh-350px)]">
                {Array.from({ length: 15 }).map((_, i) => (
                  <TableRow
                    key={i}
                    className="border-b flex items-center h-10 bg-muted/20"
                  >
                    <TableCell
                      className="py-2 overflow-hidden"
                      style={{ width: "40%" }}
                    >
                      <Skeleton className="h-4 w-3/4" />
                    </TableCell>
                    <TableCell
                      className="py-2 overflow-hidden"
                      style={{ width: "12%" }}
                    >
                      <Skeleton className="h-4 w-1/2" />
                    </TableCell>
                    <TableCell
                      className="py-2 overflow-hidden"
                      style={{ width: "12%" }}
                    >
                      <Skeleton className="h-4 w-2/3 ml-auto" />
                    </TableCell>
                    <TableCell
                      className="py-2 overflow-hidden"
                      style={{ width: "12%" }}
                    >
                      <Skeleton className="h-4 w-2/3 ml-auto" />
                    </TableCell>
                    <TableCell
                      className="py-2 overflow-hidden"
                      style={{ width: "12%" }}
                    >
                      <Skeleton className="h-4 w-2/3 ml-auto" />
                    </TableCell>
                    <TableCell
                      className="py-2 overflow-hidden"
                      style={{ width: "12%" }}
                    >
                      <Skeleton className="h-4 w-2/3 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border border-border-color rounded-md overflow-hidden bg-card">
            <Table className="w-full border-collapse">
              <TableHeader className="bg-gray-200 dark:bg-muted sticky top-0">
                <TableRow className="border-b flex h-12 items-center">
                  <TableHead
                    className="font-semibold text-foreground flex items-center"
                    style={{ width: "40%" }}
                  >
                    Schedule / Account
                  </TableHead>
                  <TableHead
                    className="font-semibold text-foreground pl-1 flex items-center justify-start"
                    style={{ width: "12%" }}
                  >
                    Code
                  </TableHead>
                  <TableHead
                    className="font-semibold text-right text-foreground flex items-center justify-end"
                    style={{ width: "12%" }}
                  >
                    Opening Balance
                  </TableHead>
                  <TableHead
                    className="font-semibold text-right text-foreground flex items-center justify-end"
                    style={{ width: "12%" }}
                  >
                    Debit
                  </TableHead>
                  <TableHead
                    className="font-semibold text-right text-foreground flex items-center justify-end"
                    style={{ width: "12%" }}
                  >
                    Credit
                  </TableHead>
                  <TableHead
                    className="font-semibold text-right text-foreground flex items-center justify-end"
                    style={{ width: "12%" }}
                  >
                    Closing Balance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="block overflow-y-auto max-h-[calc(100vh-350px)]">
                {submittedFilter ? (
                  filteredData.length > 0 ? (
                    filteredData.map((item) => {
                      const isMainCategory =
                        item.level === 0 && item.isSchedule;
                      const isAccount = !item.isSchedule;

                      if (
                        isMainCategory &&
                        item.id !== "00000000-0000-0000-0000-000000000000"
                      ) {
                        // Group header
                        return (
                          <TableRow
                            key={item.id}
                            className="border-b bg-muted/20 hover:bg-muted/20 flex items-center h-10"
                          >
                            <TableCell
                              colSpan={6}
                              className="text-lg py-2 text-foreground"
                              style={{ width: "100%" }}
                            >
                              {item.name}
                            </TableCell>
                          </TableRow>
                        );
                      } else {
                        // Regular row
                        return (
                          <TableRow
                            key={item.id}
                            className={`border-b flex items-center h-10 ${
                              isAccount
                                ? "hover:underline font-semibold hover:decoration-primary underline-offset-2"
                                : ""
                            } ${
                              isMainCategory
                                ? "bg-muted/50 font-bold text-lg"
                                : "bg-muted/20 hover:bg-muted/30"
                            }`}
                            onClick={
                              isAccount
                                ? () =>
                                    window.open(
                                      `http://localhost:5173/ledger-report?strAccountGUID=${item.id}&dtFromDate=${format(fromDate!, "yyyy-MM-dd")}&dtToDate=${format(toDate!, "yyyy-MM-dd")}`,
                                      "_blank"
                                    )
                                : undefined
                            }
                          >
                            <TableCell
                              className={`py-2 ${
                                isMainCategory
                                  ? "text-foreground font-bold"
                                  : isAccount
                                    ? "text-primary text-base cursor-pointer"
                                    : "text-foreground"
                              } overflow-hidden text-ellipsis`}
                              style={{
                                width: "40%",
                                paddingLeft: `${(item.level + 1) * 20}px`,
                              }}
                            >
                              {item.name}
                            </TableCell>
                            <TableCell
                              className={`py-2 ${
                                isMainCategory
                                  ? "text-muted-foreground font-bold"
                                  : "text-muted-foreground"
                              } overflow-hidden text-ellipsis`}
                              style={{ width: "12%" }}
                            >
                              {item.code || "-"}
                            </TableCell>
                            <TableCell
                              className={`py-2 text-right ${
                                isMainCategory ? "font-bold" : ""
                              } text-primary overflow-hidden text-ellipsis`}
                              style={{ width: "12%" }}
                            >
                              {formatNumber(item.openingBalance)}
                            </TableCell>
                            <TableCell
                              className={`py-2 text-right ${
                                isMainCategory ? "font-bold" : ""
                              } text-primary overflow-hidden text-ellipsis`}
                              style={{ width: "12%" }}
                            >
                              {formatNumber(item.debit)}
                            </TableCell>
                            <TableCell
                              className={`py-2 text-right ${
                                isMainCategory ? "font-bold" : ""
                              } text-primary overflow-hidden text-ellipsis`}
                              style={{ width: "12%" }}
                            >
                              {formatNumber(item.credit)}
                            </TableCell>
                            <TableCell
                              className={`py-2 text-right ${
                                isMainCategory ? "font-bold" : ""
                              } text-primary overflow-hidden text-ellipsis`}
                              style={{ width: "12%" }}
                            >
                              {formatNumber(item.closingBalance)}
                            </TableCell>
                          </TableRow>
                        );
                      }
                    })
                  ) : (
                    <TableRow className="flex w-full">
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-muted-foreground w-full"
                      >
                        No records found
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow className="flex w-full">
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-muted-foreground w-full"
                    >
                      Select the date range and click the Generate button to
                      view the profit and loss report
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Currency Type Display */}
        {submittedFilter && user?.strCurrencyTypeName && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>**Amount is displayed in your base currency</span>
            <Badge variant="default">{user.strCurrencyTypeName}</Badge>
          </div>
        )}
      </div>

      <ModalDialog
        open={isPreviewModalOpen}
        onOpenChange={handleClosePreviewModal}
        title="Profit & Loss Preview"
        maxWidth="1200px"
        fullHeight={true}
        showCloseButton={true}
      >
        {previewPdfUrl && (
          <iframe
            src={previewPdfUrl}
            className="w-full h-full min-h-150"
            title="Profit & Loss PDF Preview"
          />
        )}
      </ModalDialog>
    </CustomContainer>
  );
};

export default ProfitAndLossPage;
