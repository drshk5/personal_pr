import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock4,
  ListChecks,
  Timer,
  Download,
  FileText,
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
  useUserDailyWorkSummary,
  useExportUserDailyWorkSummaryPdf,
  useExportUserDailyWorkSummaryExcel,
  usePreviewUserDailyWorkSummaryPdf,
} from "@/hooks/api/task/use-task-reports";
import { useTableLayout, useListPreferences } from "@/hooks/common";
import type { UserDailyWorkSummary } from "@/types/task/task-reports";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// User options are rendered via Select with avatars; no mapper needed

const DailyWorkSummaryReport: React.FC = () => {
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
  const [displayClicked, setDisplayClicked] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const defaultColumnOrder = [
    "dtDate",
    "strBoardName",
    "strUserName",
    "strTotalWorkingHours",
    "intTotalTasks",
    "intBillableTasks",
    "intNonBillableTasks",
  ];

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "dailyWorkSummaryReport",
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
  } = useTableLayout("dailyWorkSummaryReport", defaultColumnOrder, [], {
    strUserName: true,
    strBoardName: true,
    dtDate: true,
    strTotalWorkingHours: true,
    intTotalTasks: true,
    intBillableTasks: true,
    intNonBillableTasks: true,
  });

  const boardsQuery = useBoardsByUser(user?.strUserGUID, boardDropdownOpen);
  const hierarchyQuery = useUserHierarchy(user?.strUserGUID, selectedBoard);

  const exportPdfMutation = useExportUserDailyWorkSummaryPdf();
  const exportExcelMutation = useExportUserDailyWorkSummaryExcel();
  const previewPdfMutation = usePreviewUserDailyWorkSummaryPdf();

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const params = useMemo(
    () =>
      selectedBoard
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

  const { data, isLoading, refetch } = useUserDailyWorkSummary(
    params,
    displayClicked && !!params
  );

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
        link.download = `daily-work-summary-${new Date().getTime()}.pdf`;
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
        link.download = `daily-work-summary-${new Date().getTime()}.xlsx`;
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

  const handleDisplayClick = () => {
    if (!selectedBoard) {
      toast.info("Please select a project first");
      return;
    }
    setDisplayClicked(true);
    if (displayClicked) {
      refetch();
    }
  };

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      setSelectedUser("");
      setFromDate("");
      setToDate("");
      setDisplayClicked(false);
      setPagination({ pageNumber: 1, pageSize: 10 });
      setIsResetting(false);
    }, 600);
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

  const columns = useMemo(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "truncate";
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const baseColumns: DataTableColumn<UserDailyWorkSummary>[] = [
      {
        key: "dtDate",
        header: "Date",
        width: "150px",
        cell: (row: UserDailyWorkSummary) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {formatDate(row.dtDate)}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strBoardName",
        header: "Project",
        width: "210px",
        cell: (row: UserDailyWorkSummary) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strBoardName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strUserName",
        header: "User Name",
        width: "200px",
        cell: (row: UserDailyWorkSummary) => (
          <div className={`text-foreground ${getTextClass()}`}>
            {row.strUserName}
          </div>
        ),
        sortable: true,
      },

      {
        key: "strTotalWorkingHours",
        header: "Total Working Hours",
        width: "200px",
        align: "center",
        cell: (row: UserDailyWorkSummary) => (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
              <Timer className="h-3.5 w-3.5 text-amber-500" />
              {row.strTotalWorkingHours}
            </span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "intTotalTasks",
        header: "Total Tasks",
        width: "120px",
        align: "center",
        cell: (row: UserDailyWorkSummary) => (
          <div className="flex justify-center">
            <span>{row.intTotalTasks}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "intBillableTasks",
        header: "Billable Tasks",
        width: "135px",
        align: "center",
        cell: (row: UserDailyWorkSummary) => (
          <div className="flex justify-center">
            <span>{row.intBillableTasks}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "intNonBillableTasks",
        header: "Non-billable Tasks",
        width: "170px",
        align: "center",
        cell: (row: UserDailyWorkSummary) => (
          <div className="flex justify-center">
            <span>{row.intNonBillableTasks}</span>
          </div>
        ),
        sortable: true,
      },
    ];

    return baseColumns;
  }, [isTextWrapped]);

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((col) => [col.key, col]));
    return columnOrder
      .map((key) => columnMap.get(key))
      .filter(
        (col): col is DataTableColumn<UserDailyWorkSummary> => col !== undefined
      );
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <div className="flex flex-col gap-4 space-y-1 mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock4 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Daily Work Summary
              </h1>
              <p className="text-sm text-muted-foreground">
                Hours and task totals by user per day
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
            placeholder="Search tasks..."
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
                  "dailyWorkSummaryReport_column_order",
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
              !displayClicked ||
              !selectedBoard ||
              previewPdfMutation.isPending ||
              isLoading
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
                  !selectedBoard ||
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

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:flex-wrap">
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
              onOpenChange={setBoardDropdownOpen}
              placeholder={
                boardsQuery.isLoading ? "Loading projects..." : "Select project"
              }
              isLoading={boardsQuery.isLoading}
            />
          </div>

          <div className="w-full sm:w-full md:w-64 lg:w-64">
            <PreloadedSelect
              options={userOptions}
              selectedValue={selectedUser}
              onChange={(val) => {
                setSelectedUser(val);
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
            onClick={handleDisplayClick}
            disabled={isLoading}
            className="gap-2"
          >
            Display
            <Play className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting}
            className="gap-2"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {!selectedBoard || !displayClicked ? (
          <Card className="p-8 text-center flex flex-col items-center gap-3 bg-muted/30 border-dashed">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ListChecks className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-lg font-semibold text-foreground">
              Click Display to Load Report
            </div>
            <p className="text-sm text-muted-foreground">
              Select filters and click Display to view the report.
            </p>
          </Card>
        ) : isLoading ? (
          <TableSkeleton
            columns={[
              "User Name",
              "Project",
              "Date",
              "Total Working Hours",
              "Total Tasks",
              "Billable Tasks",
              "Non-billable Tasks",
            ]}
            pageSize={pagination.pageSize}
          />
        ) : (
          <DataTable
            data={data?.data || []}
            columns={orderedColumns}
            keyExtractor={(row: UserDailyWorkSummary) =>
              `${row.strUserName}-${row.dtDate}`
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
                <>No tasks found matching "{debouncedSearch}".</>
              ) : (
                <>No data found for the selected filters.</>
              )
            }
            pagination={{
              pageNumber: pagination.pageNumber,
              pageSize: pagination.pageSize,
              totalCount: data?.totalRecords || pagination.totalCount || 0,
              totalPages: data?.totalPages || pagination.totalPages || 1,
              onPageChange: goToPage,
              onPageSizeChange: handlePageSizeChange,
            }}
            maxHeight="calc(100vh - 350px)"
            pageSizeOptions={[10, 20, 50, 100]}
          />
        )}
      </div>

      <ModalDialog
        open={isPreviewModalOpen}
        onOpenChange={handleClosePreviewModal}
        title="Daily Work Summary Preview"
        maxWidth="1200px"
        fullHeight={true}
        showCloseButton={true}
      >
        {previewPdfUrl && (
          <iframe
            src={previewPdfUrl}
            className="w-full h-full min-h-150"
            title="Daily Work Summary PDF Preview"
          />
        )}
      </ModalDialog>
    </CustomContainer>
  );
};

export default DailyWorkSummaryReport;
