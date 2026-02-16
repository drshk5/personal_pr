import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  ListChecks,
  Timer,
  Eye,
  Download,
  Play,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import {
  useBoardsByUser,
  useUserHierarchy,
} from "@/hooks/api/task/use-board-team";
import {
  useUserBoardBillableDetail,
  useExportUserBoardBillableDetailPdf,
  useExportUserBoardBillableDetailExcel,
  usePreviewUserBoardBillableDetailPdf,
} from "@/hooks/api/task/use-task-reports";
import { useTableLayout, useListPreferences } from "@/hooks/common";
import type {
  UserBoardBillableDetail,
  UserBoardBillableDetailTask,
} from "@/types/task/task-reports";
import type { Subordinate } from "@/types/task/board-team";
import CustomContainer from "@/components/layout/custom-container";
import { Card } from "@/components/ui/card";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ModalDialog } from "@/components/ui/modal-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function buildBoardOptions(
  boards?: { strBoardGUID: string; strBoardName?: string | null }[]
) {
  if (!boards) return [];
  return boards.map((board) => ({
    value: board.strBoardGUID,
    label: board.strBoardName || "Untitled Board",
  }));
}

const BillableDetailReport: React.FC = () => {
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
  const [displayClicked, setDisplayClicked] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [selectedDetail, setSelectedDetail] =
    useState<UserBoardBillableDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const defaultColumnOrder = [
    "dtTaskDate",
    "strUserName",
    "intTasksCount",
    "intTasksWithoutRate",
    "strTotalBillableHours",
    "decAmountInBaseCurrency",
    "detailView",
  ];

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "billableDetailReport",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "",
        direction: "asc",
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
    resetAll,
    columnOrder,
    setColumnOrder,
    columnWidths,
    setColumnWidths,
  } = useTableLayout("billableDetailReport", defaultColumnOrder, [], {
    dtTaskDate: true,
    strUserName: true,
    intTasksCount: true,
    intTasksWithoutRate: true,
    strTotalBillableHours: true,
    tickets: true,
    decAmountInBaseCurrency: true,
  });

  const boardsQuery = useBoardsByUser(user?.strUserGUID, boardDropdownOpen);
  const hierarchyQuery = useUserHierarchy(
    user?.strUserGUID,
    selectedBoard,
    userDropdownOpen && !!selectedBoard
  );

  // Export mutations
  const exportPdfMutation = useExportUserBoardBillableDetailPdf();
  const exportExcelMutation = useExportUserBoardBillableDetailExcel();
  const previewPdfMutation = usePreviewUserBoardBillableDetailPdf();

  // Do not auto-select board; require explicit selection like AllTasks page

  const params = useMemo(
    () =>
      displayClicked && selectedBoard
        ? {
            strBoardGUID: selectedBoard,
            strUserGUID: selectedUser || undefined,
            dtFromDate: fromDate || undefined,
            dtToDate: toDate || undefined,
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            search: debouncedSearch || undefined,
            sortBy: sorting.columnKey || undefined,
            ascending: sorting.direction === "asc",
          }
        : undefined,
    [
      displayClicked,
      selectedBoard,
      selectedUser,
      fromDate,
      toDate,
      pagination.pageNumber,
      pagination.pageSize,
      debouncedSearch,
      sorting.columnKey,
      sorting.direction,
    ]
  );

  const { data, isLoading, refetch } = useUserBoardBillableDetail(
    params,
    displayClicked && !!params
  );

  const boardOptions = buildBoardOptions(boardsQuery.data?.boards);
  // Users are sourced via user hierarchy for the selected board
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
    strBoardGUID: selectedBoard,
    strUserGUID: selectedUser || undefined,
    dtFromDate: fromDate || undefined,
    dtToDate: toDate || undefined,
  });

  const handleExportPdf = async () => {
    exportPdfMutation.mutate(buildExportParams(), {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `billable-detail-${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
    });
  };

  const handleExportExcel = async () => {
    exportExcelMutation.mutate(buildExportParams(), {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `billable-detail-${new Date().getTime()}.xlsx`;
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

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  const handleSort = (column: string) => {
    if (sorting.columnKey === column) {
      setSorting({
        direction: sorting.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSorting({
        columnKey: column,
        direction: "asc",
      });
    }
    setPagination({ pageNumber: 1, pageSize: pagination.pageSize });
  };

  const goToPage = (pageNumber: number) => {
    setPagination({ pageNumber });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({
      pageSize: newSize,
      pageNumber: 1,
    });
  };

  const openDetailModal = (row: UserBoardBillableDetail) => {
    setSelectedDetail(row);
    setIsModalOpen(true);
  };

  const columns = useMemo(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "truncate";
    };

    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const formatIndianCurrency = (value: number | null | undefined) => {
      const num = typeof value === "number" ? value : 0;
      return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const baseColumns: DataTableColumn<UserBoardBillableDetail>[] = [
      {
        key: "strUserName",
        header: "User Name",
        width: "150px",
        cell: (row: UserBoardBillableDetail) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strUserName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtTaskDate",
        header: "Date",
        width: "130px",
        cell: (row: UserBoardBillableDetail) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {formatDate(row.dtTaskDate)}
          </div>
        ),
        sortable: true,
      },
      {
        key: "intTasksCount",
        header: "Total Tasks",
        width: "120px",
        align: "center",
        cell: (row: UserBoardBillableDetail) => (
          <div className="flex justify-center">{row.intTasksCount}</div>
        ),
        sortable: true,
      },
      {
        key: "intTasksWithoutRate",
        header: "Tasks Without Rate",
        width: "200px",
        align: "center",
        cell: (row: UserBoardBillableDetail) => (
          <div className="flex justify-center">{row.intTasksWithoutRate}</div>
        ),
        sortable: true,
      },
      {
        key: "strTotalBillableHours",
        header: "Total Hours",
        width: "150px",
        cell: (row: UserBoardBillableDetail) => (
          <div className="flex">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
              <Timer className="h-3.5 w-3.5 text-amber-500" />
              {row.strTotalBillableHours}
            </span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "decAmountInBaseCurrency",
        header: "Amount",
        width: "100px",
        cell: (row: UserBoardBillableDetail) => {
          const hasRateCurrency =
            row.decAmountInRateCurrency &&
            row.decAmountInRateCurrency > 0 &&
            row.strRateCurrencyCode;
          const hasBaseCurrency =
            row.decAmountInBaseCurrency &&
            row.decAmountInBaseCurrency > 0 &&
            row.strBaseCurrencyCode;

          if (!hasRateCurrency && !hasBaseCurrency) {
            return <div className="text-foreground text-sm">NA</div>;
          }

          return (
            <div className="flex flex-col gap-1">
              {hasRateCurrency && (
                <div className="text-sm">
                  <span className="text-foreground">
                    {formatIndianCurrency(row.decAmountInRateCurrency)}
                  </span>
                  <span className="text-foreground ml-1">
                    {row.strRateCurrencyCode}
                  </span>
                </div>
              )}
              {hasBaseCurrency && (
                <div className="text-sm">
                  <span className="text-foreground">
                    {formatIndianCurrency(row.decAmountInBaseCurrency)}
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
      {
        key: "detailView",
        header: "Detail View",
        width: "140px",
        cell: (row: UserBoardBillableDetail) => (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openDetailModal(row);
            }}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View<span>{row.tasks?.length ?? 0}</span> Details
          </Button>
        ),
        sortable: false,
      },
    ];

    return baseColumns;
  }, [isTextWrapped]);

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((col) => [col.key, col]));
    return columnOrder
      .map((key) => columnMap.get(key))
      .filter(
        (col): col is DataTableColumn<UserBoardBillableDetail> =>
          col !== undefined
      );
  }, [columns, columnOrder]);

  const taskColumns = useMemo(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "truncate";
    };

    const formatIndianCurrency = (value: number | null | undefined) => {
      const num = typeof value === "number" ? value : 0;
      return num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };
    const baseTaskColumns: DataTableColumn<UserBoardBillableDetailTask>[] = [
      {
        key: "strTaskTitle",
        header: "Task Title",
        width: "300px",
        cell: (task: UserBoardBillableDetailTask) => (
          <div
            className={`text-sm text-foreground ${getTextClass()}`}
            title={task.strTaskTitle || ""}
          >
            {task.strTaskTitle}
          </div>
        ),
        sortable: false,
      },
      {
        key: "ticket",
        header: "Ticket",
        width: "180px",
        cell: (task: UserBoardBillableDetailTask) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {task.strTicketKey ? (
              <div className="flex flex-wrap items-center gap-2">
                {task.strTicketSource && (
                  <span className="text-sm text-foreground">
                    {task.strTicketSource}:
                  </span>
                )}
                {task.strTicketUrl ? (
                  <a
                    href={task.strTicketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {task.strTicketKey}
                  </a>
                ) : (
                  <span>{task.strTicketKey}</span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ),
        sortable: false,
      },
      {
        key: "strTotalHours",
        header: "Hours (HH:MM:SS)",
        width: "200px",
        cell: (task: UserBoardBillableDetailTask) => (
          <div className="flex">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
              <Timer className="h-3.5 w-3.5 text-amber-500" />
              {task.strTotalHours}
            </span>
          </div>
        ),
        sortable: false,
      },
      {
        key: "amount",
        header: "Amount",
        width: "220px",
        cell: (task: UserBoardBillableDetailTask) => {
          const hasRateCurrency =
            task.decAmountInRateCurrency &&
            task.decAmountInRateCurrency > 0 &&
            task.strRateCurrencyCode;
          const hasBaseCurrency =
            task.decAmountInBaseCurrency &&
            task.decAmountInBaseCurrency > 0 &&
            task.strBaseCurrencyCode;

          if (!hasRateCurrency && !hasBaseCurrency) {
            return <div className="text-foreground text-sm">NA</div>;
          }

          return (
            <div className="flex flex-col gap-1">
              {hasRateCurrency && (
                <div className="text-sm">
                  <span className="text-foreground">
                    {formatIndianCurrency(task.decAmountInRateCurrency)}
                  </span>
                  <span className="text-foreground ml-1">
                    {task.strRateCurrencyCode}
                  </span>
                </div>
              )}
              {hasBaseCurrency && (
                <div className="text-sm">
                  <span className="text-foreground">
                    {formatIndianCurrency(task.decAmountInBaseCurrency)}
                  </span>
                  <span className="text-foreground ml-1">
                    {task.strBaseCurrencyCode}
                  </span>
                </div>
              )}
            </div>
          );
        },
        sortable: false,
      },
    ];

    return baseTaskColumns;
  }, [isTextWrapped]);

  const modalColumnWidths = useMemo(() => ({}), []);

  return (
    <CustomContainer>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 space-y-1 mt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Billable Detail
              </h1>
              <p className="text-sm text-muted-foreground">
                Per-day task-level billable breakdown
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
            placeholder="Search by task title..."
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
              onResetAll={() => {
                resetAll();
              }}
              onColumnOrderChange={(order) => {
                setColumnOrder(order);
                localStorage.setItem(
                  "billableDetailReport_column_order",
                  JSON.stringify(order)
                );
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
                setPagination({ pageNumber: 1, pageSize: pagination.pageSize });
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
                setDisplayClicked(false);
                setPagination({ pageNumber: 1, pageSize: pagination.pageSize });
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
                  setPagination({
                    pageNumber: 1,
                    pageSize: pagination.pageSize,
                  });
                  return;
                }

                const startISO = toIsoLocal(start);
                const endISO = toIsoLocal(end || start);

                setFromDate(startISO);
                setToDate(endISO);
                setDisplayClicked(false);
                setPagination({ pageNumber: 1, pageSize: pagination.pageSize });
              }}
              placeholder="Select date range"
            />
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (!selectedBoard) {
                toast.info("Please select a project first");
                return;
              }
              setDisplayClicked(true);
              if (displayClicked) {
                refetch();
              }
            }}
            disabled={isLoading}
            className="gap-2"
          >
            Display
            <Play className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsResetting(true);
              setTimeout(() => {
                setSelectedBoard("");
                setSelectedUser("");
                setFromDate(toIsoLocal(startOfMonth));
                setToDate(toIsoLocal(endOfMonth));
                setDisplayClicked(false);
                setPagination({ pageNumber: 1, pageSize: pagination.pageSize });
                setIsResetting(false);
              }, 600);
            }}
            disabled={isResetting}
            className="gap-2"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {!displayClicked ? (
          <Card className="p-8 text-center flex flex-col items-center gap-3 bg-muted/30 border-dashed">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ListChecks className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold text-foreground">
              Click Display to Load Report
            </div>
            <p className="text-sm text-muted-foreground">
              Select a project and click the Display button to view the billable
              detail report.
            </p>
          </Card>
        ) : isLoading ? (
          <TableSkeleton
            columns={[
              "",
              "Date",
              "User Name",
              "Total Tasks",
              "Tasks Without Rate",
              "Total Hours",
              "Amount",
              "Detail View",
            ]}
            pageSize={pagination.pageSize}
          />
        ) : (
          <div className="space-y-0">
            <DataTable
              data={data?.data || []}
              columns={orderedColumns}
              keyExtractor={(row: UserBoardBillableDetail) =>
                `${row.strUserGUID}-${row.dtTaskDate}`
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
                  <>
                    No detailed billable records found matching "
                    {debouncedSearch}".
                  </>
                ) : (
                  <>
                    No detailed billable records found for the selected filters.
                  </>
                )
              }
              maxHeight="calc(93vh - 350px)"
              pagination={{
                pageNumber: pagination.pageNumber,
                pageSize: pagination.pageSize,
                totalCount: data?.totalRecords || pagination.totalCount || 0,
                totalPages: data?.totalPages || pagination.totalPages || 1,
                onPageChange: goToPage,
                onPageSizeChange: handlePageSizeChange,
              }}
              pageSizeOptions={[10, 20, 50, 100]}
            />

            <ModalDialog
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
              title="Task Breakdown Details"
              description={
                selectedDetail
                  ? `${new Date(selectedDetail.dtTaskDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} • ${selectedDetail.strUserName}`
                  : ""
              }
              maxWidth="1000px"
              fullHeight={true}
            >
              {selectedDetail && (
                <div className="px-3 sm:px-6 py-4 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-muted/60 rounded-lg p-4 border border-border-color">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                        Total Tasks
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {selectedDetail.intTasksCount}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-muted/60 rounded-lg p-4 border border-border-color">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                        Tasks Without Rate
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {selectedDetail.intTasksWithoutRate}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-muted/60 rounded-lg p-4 border border-border-color">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                        Total Hours
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-amber-500 flex items-center gap-2">
                          <Timer className="h-5 w-5" />
                        </p>
                        <span className="text-xl font-medium text-foreground">
                          {selectedDetail.strTotalBillableHours}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-muted/60 rounded-lg p-4 border border-border-color">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                        Total Amount
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-foreground">
                          {selectedDetail.decAmountInBaseCurrency?.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {selectedDetail.strBaseCurrencyCode}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-muted/60 rounded-lg p-4 border border-border-color">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                        Amount (Rate)
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-foreground">
                          {selectedDetail.decAmountInRateCurrency?.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {selectedDetail.strRateCurrencyCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-foreground">
                      Task Details
                    </h3>
                    <div className="border border-border-color rounded-lg overflow-hidden bg-white dark:bg-muted/20">
                      <DataTable
                        data={selectedDetail.tasks ?? []}
                        columns={taskColumns}
                        keyExtractor={(task: UserBoardBillableDetailTask) =>
                          task.strTaskGUID
                        }
                        loading={false}
                        columnWidths={modalColumnWidths}
                        emptyState={<>No tasks found.</>}
                        maxHeight="500px"
                      />
                    </div>
                  </div>
                </div>
              )}
            </ModalDialog>
          </div>
        )}
      </div>

      <ModalDialog
        open={isPreviewModalOpen}
        onOpenChange={handleClosePreviewModal}
        title="Billable Detail Preview"
        maxWidth="1200px"
        fullHeight={true}
        showCloseButton={true}
      >
        {previewPdfUrl && (
          <iframe
            src={previewPdfUrl}
            className="w-full h-full min-h-150"
            title="Billable Detail PDF Preview"
          />
        )}
      </ModalDialog>
    </CustomContainer>
  );
};

export default BillableDetailReport;
