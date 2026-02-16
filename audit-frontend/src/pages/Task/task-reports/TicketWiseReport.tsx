import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  ListChecks,
  Timer,
  Play,
  RefreshCcw,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { useAuthContext } from "@/hooks/common/use-auth-context";
import {
  useBoardsByUser,
  useUserHierarchy,
} from "@/hooks/api/task/use-board-team";
import {
  useTicketWiseReport,
  useExportTicketWiseReportPdf,
  useExportTicketWiseReportExcel,
  usePreviewTicketWiseReportPdf,
} from "@/hooks/api/task/use-task-reports";
import { useTableLayout } from "@/hooks/common";
import { getStatusColor } from "@/lib/task/task";
import type { TicketWiseReportItem } from "@/types/task/task-reports";
import type { Subordinate } from "@/types/task/board-team";

import CustomContainer from "@/components/layout/custom-container";
import { Card } from "@/components/ui/card";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ModalDialog } from "@/components/ui/modal-dialog";

function buildBoardOptions(
  boards?: { strBoardGUID: string; strBoardName?: string | null }[]
) {
  if (!boards) return [];
  return boards.map((board) => ({
    value: board.strBoardGUID,
    label: board.strBoardName || "Untitled Board",
  }));
}

const TicketWiseReport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const toIsoLocal = (date: Date) => {
    const tzOffset = date.getTimezoneOffset();
    const adjusted = new Date(date.getTime() - tzOffset * 60000);
    return adjusted.toISOString().split("T")[0];
  };

  const [selectedBoard, setSelectedBoard] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(toIsoLocal(startOfMonth));
  const [toDate, setToDate] = useState<string>(toIsoLocal(endOfMonth));
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [displayClicked, setDisplayClicked] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const [sorting, setSorting] = useState({
    columnKey: "",
    direction: "asc" as "asc" | "desc",
  });

  const defaultColumnOrder = [
    "intTaskNo",
    "strTaskName",
    "strAssignTo",
    "strStatus",
    "bolIsBillable",
    "strTicketKey",
    "decTotalHours",
    "amount",
  ];

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
  } = useTableLayout("ticketWiseReport", defaultColumnOrder, [], {
    intTaskNo: true,
    strTaskName: true,
    strAssignTo: true,
    strStatus: true,
    bolIsBillable: true,
    strTicketKey: true,
    decTotalHours: true,
    amount: true,
  });

  const boardsQuery = useBoardsByUser(user?.strUserGUID, boardDropdownOpen);
  const hierarchyQuery = useUserHierarchy(
    user?.strUserGUID,
    selectedBoard,
    userDropdownOpen && !!selectedBoard
  );

  const params = useMemo(
    () =>
      selectedBoard && displayClicked
        ? {
            strBoardGUID: selectedBoard,
            strUserGUIDs: selectedUser || undefined,
            dtFromDate: fromDate || undefined,
            dtToDate: toDate || undefined,
          }
        : undefined,
    [selectedBoard, selectedUser, fromDate, toDate, displayClicked]
  );

  const { data, isLoading, refetch } = useTicketWiseReport(
    params,
    displayClicked && !!params
  );

  const exportPdfMutation = useExportTicketWiseReportPdf();
  const exportExcelMutation = useExportTicketWiseReportExcel();
  const previewPdfMutation = usePreviewTicketWiseReportPdf();

  const items = useMemo(() => data?.data?.items || [], [data?.data?.items]);

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;
    const searchLower = debouncedSearch.toLowerCase();
    return items.filter(
      (item) =>
        item.strTaskName.toLowerCase().includes(searchLower) ||
        item.strAssignTo.toLowerCase().includes(searchLower) ||
        String(item.intTaskNo).includes(searchLower) ||
        (item.strTicketKey && item.strTicketKey.toLowerCase().includes(searchLower))
    );
  }, [debouncedSearch, items]);

  const sortedItems = useMemo(() => {
    if (!sorting.columnKey) return filteredItems;

    const getSortValue = (item: TicketWiseReportItem) => {
      switch (sorting.columnKey) {
        case "intTaskNo":
          return item.intTaskNo;
        case "strTaskName":
          return item.strTaskName?.toLowerCase() || "";
        case "strAssignTo":
          return item.strAssignTo?.toLowerCase() || "";
        case "strStatus":
          return item.strStatus?.toLowerCase() || "";
        case "bolIsBillable":
          return item.bolIsBillable ? 1 : 0;
        case "strTicketKey":
          return item.strTicketKey?.toLowerCase() || "";
        case "decTotalHours":
          return item.decTotalHours ?? 0;
        case "decCostInBaseCurrency":
          return item.decCostInBaseCurrency ?? 0;
        default:
          return "";
      }
    };

    const sorted = [...filteredItems].sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);
      if (typeof aValue === "number" && typeof bValue === "number") {
        return aValue - bValue;
      }
      return String(aValue).localeCompare(String(bValue));
    });

    return sorting.direction === "asc" ? sorted : sorted.reverse();
  }, [filteredItems, sorting]);

  const boardOptions = buildBoardOptions(boardsQuery.data?.boards);
  const assignableUsers = useMemo(() => {
    const hierarchy = hierarchyQuery.data;
    const baseUsers = hierarchy?.strUserGUID
      ? [
          {
            strUserGUID: hierarchy.strUserGUID,
            strName: hierarchy.strUserName || "Unknown",
            strProfileImg: undefined,
          },
        ]
      : [];
    const subordinates = hierarchy?.subordinates || [];
    const mappedSubordinates = subordinates.map((u: Subordinate) => ({
      strUserGUID: u.strUserGUID,
      strName: u.strUserName || "Unknown",
      strProfileImg: u.strProfileImg || undefined,
    }));
    const users = [...baseUsers, ...mappedSubordinates];
    return users.filter(
      (user, index, array) =>
        array.findIndex((item) => item.strUserGUID === user.strUserGUID) ===
        index
    );
  }, [hierarchyQuery.data]);

  const userOptions = useMemo(
    () =>
      assignableUsers.map(
        (u: {
          strUserGUID: string;
          strName: string;
          strProfileImg?: string;
        }) => ({ value: u.strUserGUID, label: u.strName })
      ),
    [assignableUsers]
  );

  const buildExportParams = () => ({
    strBoardGUID: selectedBoard || undefined,
    strUserGUIDs: selectedUser || undefined,
    dtFromDate: fromDate || undefined,
    dtToDate: toDate || undefined,
  });

  const handleExportPdf = async () => {
    if (!selectedBoard || !fromDate || !toDate) {
      toast.info("Please select project and date range before exporting");
      return;
    }

    exportPdfMutation.mutate(buildExportParams(), {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ticket-wise-report-${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
    });
  };

  const handleExportExcel = async () => {
    if (!selectedBoard || !fromDate || !toDate) {
      toast.info("Please select project and date range before exporting");
      return;
    }

    exportExcelMutation.mutate(buildExportParams(), {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ticket-wise-report-${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
    });
  };

  const handlePreviewPdf = async () => {
    try {
      const blob = await previewPdfMutation.mutateAsync(buildExportParams());
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setIsPreviewModalOpen(true);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleSort = (column: string) => {
    if (sorting.columnKey === column) {
      setSorting({
        columnKey: column,
        direction: sorting.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSorting({
        columnKey: column,
        direction: "asc",
      });
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    const num = typeof value === "number" ? value : 0;
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const columns = useMemo(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "truncate";
    };

    const baseColumns: DataTableColumn<TicketWiseReportItem>[] = [
      {
        key: "intTaskNo",
        header: "Task No",
        width: "120px",
        align: "center",
        cell: (row: TicketWiseReportItem) => (
          <div className="text-foreground text-center font-medium">
            {row.intTaskNo}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTaskName",
        header: "Task Name",
        width: "300px",
        cell: (row: TicketWiseReportItem) => (
          <div className={`text-foreground  ${getTextClass()}`}>
            {row.strTaskName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strAssignTo",
        header: "Assigned To",
        width: "180px",
        cell: (row: TicketWiseReportItem) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strAssignTo}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strStatus",
        header: "Status",
        width: "140px",
        cell: (row: TicketWiseReportItem) => (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              row.strStatus
            )}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {row.strStatus}
          </span>
        ),
        sortable: true,
      },
      {
        key: "bolIsBillable",
        header: "Billable",
        width: "120px",
        align: "center",
        cell: (row: TicketWiseReportItem) => (
          <div className="flex justify-center">
            {row.bolIsBillable ? "Yes" : "No"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTicketKey",
        header: "Ticket",
        width: "180px",
        cell: (row: TicketWiseReportItem) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strTicketKey ? (
              <div className="flex flex-wrap items-center gap-2">
                {row.strTicketSource && (
                  <span className="text-sm text-foreground">
                    {row.strTicketSource}:
                  </span>
                )}
                {row.strTicketUrl ? (
                  <a
                    href={row.strTicketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    {row.strTicketKey}
                  </a>
                ) : (
                  <span>{row.strTicketKey}</span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        key: "decTotalHours",
        header: "Total Hours",
        width: "150px",
        align: "center",
        cell: (row: TicketWiseReportItem) => (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border rounded-md text-xs font-medium text-foreground">
              <Timer className="h-3 w-3 text-amber-500" />
              {row.strTotalHours}
            </span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "amount",
        header: "Amount",
        width: "220px",
        cell: (row: TicketWiseReportItem) => {
          const hasRateCurrency =
            row.decCostInRateCurrency &&
            row.decCostInRateCurrency > 0 &&
            row.strRateCurrencyCode;
          const hasBaseCurrency =
            row.decCostInBaseCurrency &&
            row.decCostInBaseCurrency > 0 &&
            row.strBaseCurrencyCode;

          if (!hasRateCurrency && !hasBaseCurrency) {
            return <div className="text-foreground text-sm">NA</div>;
          }

          return (
            <div className="flex flex-col gap-1">
              {hasRateCurrency && (
                <div className="text-sm">
                  <span className="text-foreground">
                    {formatCurrency(row.decCostInRateCurrency)}
                  </span>
                  <span className="text-foreground ml-1">
                    {row.strRateCurrencyCode}
                  </span>
                </div>
              )}
              {hasBaseCurrency && (
                <div className="text-sm">
                  <span className="text-foreground">
                    {formatCurrency(row.decCostInBaseCurrency)}
                  </span>
                  <span className="text-foreground ml-1">
                    {row.strBaseCurrencyCode}
                  </span>
                </div>
              )}
            </div>
          );
        },
        sortable: true,
      },
    ];

    return baseColumns;
  }, [isTextWrapped]);

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((col) => [col.key, col]));
    const ordered = columnOrder
      .map((key) => columnMap.get(key))
      .filter(
        (col): col is DataTableColumn<TicketWiseReportItem> => col !== undefined
      );
    const remaining = columns.filter((col) => !columnOrder.includes(col.key));
    return [...ordered, ...remaining];
  }, [columns, columnOrder]);
  return (
    <CustomContainer>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col space-y-1 mt-6 gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Ticket Wise Report
              </h1>
              <p className="text-sm text-muted-foreground">
                Task-wise details with assignee, status, hours, and cost
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/reports")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:flex-wrap">
          <SearchInput
            placeholder="Search by ticket name or assignee..."
            onSearchChange={setDebouncedSearch}
            className="w-full sm:max-w-md lg:flex-1"
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
                  "ticketWiseReport_column_order",
                  JSON.stringify(order)
                );
              }}
              onResetAll={() => {
                resetAll();
              }}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewPdf}
            className="gap-2"
            disabled={
              !displayClicked || previewPdfMutation.isPending || isLoading
            }
          >
            <FileText className="h-4 w-4" />
            Preview PDF
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={
                  !displayClicked ||
                  exportPdfMutation.isPending ||
                  exportExcelMutation.isPending
                }
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleExportPdf}
                disabled={exportPdfMutation.isPending}
              >
                <FileText className="mr-2 h-4 w-4" />
                {exportPdfMutation.isPending
                  ? "Exporting PDF..."
                  : "Export as PDF"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportExcel}
                disabled={exportExcelMutation.isPending}
              >
                <FileText className="mr-2 h-4 w-4" />
                {exportExcelMutation.isPending
                  ? "Exporting Excel..."
                  : "Export as Excel"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:flex-wrap">
          <div className="w-full sm:w-full md:w-64 lg:w-64">
            <PreloadedSelect
              options={boardOptions}
              selectedValue={selectedBoard}
              onChange={(value) => {
                setSelectedBoard(value);
                setSelectedUser("");
                setDisplayClicked(false);
              }}
              placeholder={
                boardsQuery.isLoading ? "Loading projects..." : "Select project"
              }
              isLoading={boardsQuery.isLoading}
              onOpenChange={setBoardDropdownOpen}
            />
          </div>

          <div className="w-full sm:w-full md:w-64 lg:w-64">
            <PreloadedSelect
              options={userOptions}
              selectedValue={selectedUser}
              onChange={(value) => {
                setSelectedUser(value);
              }}
              placeholder={
                selectedBoard ? "All users" : "Select a project first"
              }
              isLoading={hierarchyQuery.isLoading}
              disabled={!selectedBoard || hierarchyQuery.isLoading}
              allowNone
              noneLabel="All users"
              onOpenChange={setUserDropdownOpen}
            />
          </div>

          <div className="w-full sm:w-auto lg:w-auto">
            <DateRangePicker
              startDate={fromDate ? new Date(fromDate) : undefined}
              endDate={toDate ? new Date(toDate) : undefined}
              onRangeChange={(start, end) => {
                if (!start) {
                  setFromDate("");
                  setToDate("");
                  setDisplayClicked(false);
                  return;
                }

                const startISO = toIsoLocal(start);
                const endISO = toIsoLocal(end || start);

                setFromDate(startISO);
                setToDate(endISO);
                setDisplayClicked(false);
              }}
              placeholder="Select date range"
            />
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (!fromDate || !toDate) {
                return;
              }
              if (!selectedBoard) {
                toast.info("Please select a project first");
                return;
              }
              setDisplayClicked(true);
              if (displayClicked) {
                refetch();
              }
            }}
            disabled={!fromDate || !toDate || isLoading}
            className="gap-2"
          >
            Display
            <Play className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setIsResetting(true);
              try {
                setSelectedBoard("");
                setSelectedUser("");
                setFromDate(toIsoLocal(startOfMonth));
                setToDate(toIsoLocal(endOfMonth));
                setDebouncedSearch("");
                setDisplayClicked(false);
                resetColumnVisibility();
                resetPinnedColumns();
              } finally {
                setIsResetting(false);
              }
            }}
            disabled={isResetting}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {!displayClicked ? (
          <Card className="p-8 text-center flex flex-col items-center gap-3 bg-muted/30 border-dashed">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ListChecks className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold text-foreground">
              Ready to view ticket report
            </div>
            <p className="text-sm text-muted-foreground">
              Select a project, date range, and click "Display" to view the
              ticket-wise report data.
            </p>
          </Card>
        ) : isLoading ? (
          <TableSkeleton
            columns={[
              "Ticket No",
              "Ticket Name",
              "Assigned To",
              "Status",
              "Billable",
              "Ticket",
              "Total Hours",
              "Amount",
            ]}
            pageSize={10}
          />
        ) : (
          <DataTable
            data={sortedItems}
            columns={orderedColumns}
            keyExtractor={(row: TicketWiseReportItem) =>
              `${row.intTaskNo}-${row.strUserGUID}`
            }
            sortBy={sorting.columnKey || ""}
            ascending={sorting.direction === "asc"}
            onSort={handleSort}
            loading={isLoading}
            columnVisibility={columnVisibility}
            alwaysVisibleColumns={getAlwaysVisibleColumns()}
            isTextWrapped={isTextWrapped}
            pinnedColumns={pinnedColumns}
            columnWidths={columnWidths}
            onColumnWidthsChange={setColumnWidths}
            emptyState={
              debouncedSearch ? (
                <>No tickets found matching "{debouncedSearch}".</>
              ) : (
                <>No ticket data found for the selected filters.</>
              )
            }
            maxHeight="calc(93vh - 350px)"
          />
        )}

        <ModalDialog
          open={isPreviewModalOpen}
          onOpenChange={setIsPreviewModalOpen}
          title="PDF Preview"
        >
          {previewPdfUrl && (
            <iframe
              src={previewPdfUrl}
              className="w-full border-0 rounded-lg"
              style={{ height: "calc(100vh - 200px)" }}
              title="PDF Preview"
            />
          )}
        </ModalDialog>
      </div>
    </CustomContainer>
  );
};

export default TicketWiseReport;
