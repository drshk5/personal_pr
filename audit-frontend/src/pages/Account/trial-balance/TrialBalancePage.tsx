import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  BarChart3,
  CalendarRange,
  RefreshCw,
  FileText,
  Download,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import {
  useTrialBalance,
  useExportTrialBalancePdf,
  useExportTrialBalanceCsv,
  useExportTrialBalanceExcel,
  usePreviewTrialBalancePdf,
} from "@/hooks/api/Account/use-trial-balance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import type {
  TrialBalanceFilter,
  TrialBalanceFlatItem,
  TrialBalanceResponse,
  TrialBalanceTreeNode,
  TrialBalanceAccountInfo,
} from "@/types/Account/trial-balance";
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

const formatNumber = (value?: number) =>
  (value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const flattenTrialBalanceTree = (
  tree: TrialBalanceResponse["tree"]
): TrialBalanceFlatItem[] => {
  const result: TrialBalanceFlatItem[] = [];

  const processItem = (
    item: TrialBalanceTreeNode,
    currentLevel: number = 0
  ) => {
    // Add the schedule
    result.push({
      id: item.strScheduleGUID,
      name: item.strScheduleName,
      code: item.strScheduleCode,
      level: currentLevel,
      opening: item.dblOpeningBalance_Base,
      debit: item.dblDebit_Base,
      credit: item.dblCredit_Base,
      balance: item.dblBalance_Base,
      isSchedule: true,
    });

    // Add accounts
    item.accounts.forEach((account: TrialBalanceAccountInfo) => {
      result.push({
        id: account.strAccountGUID,
        name: account.strAccountName,
        code: account.strAccountCode || undefined,
        level: currentLevel + 1,
        opening: account.dblOpeningBalance_Base,
        debit: account.dblDebit_Base,
        credit: account.dblCredit_Base,
        balance: account.dblBalance_Base,
        isSchedule: false,
      });
    });

    // Process children
    item.children.forEach((child: TrialBalanceTreeNode) => {
      processItem(child, currentLevel + 1);
    });
  };

  tree.forEach((item) => processItem(item));
  return result;
};

const TrialBalancePage: React.FC = () => {
  const { user } = useAuthContext();
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1) // First day of current month
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [levelType, setLevelType] = useState<string>("summary");
  const [submittedFilter, setSubmittedFilter] = useState<
    TrialBalanceFilter | undefined
  >();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const {
    data: report,
    isLoading: isReportLoading,
    refetch,
  } = useTrialBalance(submittedFilter, false);

  const exportPdfMutation = useExportTrialBalancePdf();
  const exportCsvMutation = useExportTrialBalanceCsv();
  const exportExcelMutation = useExportTrialBalanceExcel();
  const previewPdfMutation = usePreviewTrialBalancePdf();

  useEffect(() => {
    if (submittedFilter) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedFilter]);

  const handleApplyFilter = () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both From Date and To Date");
      return;
    }

    if (fromDate > toDate) {
      toast.error("From Date cannot be greater than To Date");
      return;
    }

    const maxLevel = levelType === "summary" ? 0 : 4;
    const filter: TrialBalanceFilter = {
      dtFromDate: format(fromDate, "yyyy-MM-dd"),
      dtToDate: format(toDate, "yyyy-MM-dd"),
      maxLevel: maxLevel,
    };

    setSubmittedFilter(filter);
  };

  // Flatten the tree data
  const flattenedData = useMemo(() => {
    if (!report?.tree) return [];
    return flattenTrialBalanceTree(report.tree);
  }, [report?.tree]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return flattenedData;

    const query = searchQuery.toLowerCase();
    return flattenedData.filter((item) => {
      const accountMatch = item.name?.toLowerCase().includes(query);
      const codeMatch = item.code?.toLowerCase().includes(query);
      const openingMatch = formatNumber(item.opening).includes(query);
      const debitMatch = formatNumber(item.debit).includes(query);
      const creditMatch = formatNumber(item.credit).includes(query);
      const balanceMatch = formatNumber(item.balance).includes(query);
      return (
        accountMatch ||
        codeMatch ||
        openingMatch ||
        debitMatch ||
        creditMatch ||
        balanceMatch
      );
    });
  }, [flattenedData, searchQuery]);

  const ensureFilterReady = () => {
    if (!submittedFilter?.dtFromDate || !submittedFilter?.dtToDate) {
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

  return (
    <CustomContainer>
      <PageHeader
        title="Trial Balance"
        description="View trial balance as of a specific date."
        icon={BarChart3}
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
                module={ModuleBase.TRIAL_BALANCE}
                action={Actions.PRINT}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewPdf}
                  disabled={
                    !submittedFilter ||
                    previewPdfMutation.isPending ||
                    isReportLoading
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Preview PDF
                </Button>
              </WithPermission>
              <WithPermission
                module={ModuleBase.TRIAL_BALANCE}
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
                        exportCsvMutation.isPending ||
                        exportExcelMutation.isPending ||
                        isReportLoading
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
                module={ModuleBase.TRIAL_BALANCE}
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
            <div className="space-y-1">
              <p className="text-sm font-medium">Report Type</p>
              <Select value={levelType} onValueChange={setLevelType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {submittedFilter && (
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              placeholder="Search accounts..."
              onSearchChange={setSearchQuery}
              className="w-full sm:max-w-md sm:flex-1"
            />
          </div>
        )}

        {isReportLoading ? (
          <div className="border border-border-color rounded-md overflow-hidden bg-card">
            <Table className="w-full border-collapse">
              <TableHeader className="bg-gray-200 dark:bg-muted sticky top-0">
                <TableRow className="border-b flex h-12 items-center">
                  <TableHead
                    className="font-semibold text-foreground flex items-center"
                    style={{ width: "40%" }}
                  >
                    Account
                  </TableHead>
                  <TableHead
                    className="font-semibold text-foreground pl-1 flex items-center justify-start"
                    style={{ width: "12%" }}
                  >
                    Account Code
                  </TableHead>
                  <TableHead
                    className="font-semibold text-right text-foreground flex items-center justify-end"
                    style={{ width: "12%" }}
                  >
                    Opening
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
                    Balance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="block overflow-y-auto max-h-[calc(100vh-350px)]">
                {Array.from({ length: 10 }).map((_, i) => (
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
                    Account
                  </TableHead>
                  <TableHead
                    className="font-semibold text-foreground pl-1 flex items-center justify-start"
                    style={{ width: "12%" }}
                  >
                    Account Code
                  </TableHead>
                  <TableHead
                    className="font-semibold text-right text-foreground flex items-center justify-end"
                    style={{ width: "12%" }}
                  >
                    Opening
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
                    Balance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="block overflow-y-auto max-h-[calc(100vh-350px)]">
                {submittedFilter ? (
                  filteredData.length > 0 ? (
                    filteredData.map((item) => {
                      if (
                        item.level === 0 &&
                        item.isSchedule &&
                        item.id !== "00000000-0000-0000-0000-000000000000"
                      ) {
                        // Group header
                        return (
                          <TableRow
                            key={item.id}
                            className="border-b bg-muted/20 hover:bg-muted/20 flex items-center h-10"
                          >
                            <TableCell
                              colSpan={4}
                              className="text-lg py-2 text-foreground"
                              style={{ width: "100%" }}
                            >
                              {item.name}
                            </TableCell>
                          </TableRow>
                        );
                      } else {
                        // Regular row or Total row
                        const isTotal =
                          item.id === "00000000-0000-0000-0000-000000000000";
                        return (
                          <TableRow
                            key={item.id}
                            className={`border-b flex items-center h-10 ${!isTotal && !item.isSchedule ? "hover:underline font-semibold hover:decoration-primary underline-offset-2" : ""} ${isTotal ? "bg-muted/50 font-bold text-lg" : "bg-muted/20 hover:bg-muted/30"}`}
                            onClick={
                              !item.isSchedule && !isTotal
                                ? () =>
                                    window.open(
                                      `http://localhost:5173/ledger-report?strAccountGUID=${item.id}&dtAsOfDate=${format(toDate!, "yyyy-MM-dd")}`,
                                      "_blank"
                                    )
                                : undefined
                            }
                          >
                            <TableCell
                              className={`py-2 ${isTotal ? "text-foreground font-bold" : !item.isSchedule ? " text-primary text-base cursor-pointer" : "text-foreground"} overflow-hidden text-ellipsis`}
                              style={{
                                width: "40%",
                                paddingLeft: `${(item.level + 1) * 20}px`,
                              }}
                            >
                              {item.name}
                            </TableCell>
                            <TableCell
                              className={`py-2 ${isTotal ? "text-muted-foreground font-bold" : "text-muted-foreground"} overflow-hidden text-ellipsis`}
                              style={{ width: "12%" }}
                            >
                              {item.code || "-"}
                            </TableCell>
                            <TableCell
                              className={`py-2 text-right ${isTotal ? "font-bold" : ""} text-primary overflow-hidden text-ellipsis`}
                              style={{ width: "12%" }}
                            >
                              {formatNumber(item.opening)}
                            </TableCell>
                            <TableCell
                              className={`py-2 text-right ${isTotal ? "font-bold" : ""} text-primary overflow-hidden text-ellipsis`}
                              style={{ width: "12%" }}
                            >
                              {formatNumber(item.debit)}
                            </TableCell>
                            <TableCell
                              className={`py-2 text-right ${isTotal ? " font-bold" : ""} text-primary overflow-hidden text-ellipsis`}
                              style={{ width: "12%" }}
                            >
                              {formatNumber(item.credit)}
                            </TableCell>
                            <TableCell
                              className={`py-2 text-right ${isTotal ? " font-bold" : ""} text-primary overflow-hidden text-ellipsis`}
                              style={{ width: "12%" }}
                            >
                              {formatNumber(item.balance)}
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
                      Select the as of date and click the Generate button to
                      view the trial balance
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
        title="Trial Balance Preview"
        maxWidth="1200px"
        fullHeight={true}
        showCloseButton={true}
      >
        {previewPdfUrl && (
          <iframe
            src={previewPdfUrl}
            className="w-full h-full min-h-150"
            title="Trial Balance PDF Preview"
          />
        )}
      </ModalDialog>
    </CustomContainer>
  );
};

export default TrialBalancePage;
