import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  AlertCircle,
  ListChecks,
  NotebookPen,
  Ticket,
  Timer,
  Download,
  FileText,
  ArrowLeft,
  Play,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import type { TaskTimelineResponseDto } from "@/types";
import { getTagColor } from "@/lib/task/task";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import {
  useBoardsByUser,
  useUserHierarchy,
} from "@/hooks/api/task/use-board-team";
import type { Subordinate } from "@/types/task/board-team";
import {
  useGetTaskTimelineByUser,
  useExportTimelineToCsv,
  useExportTimelineToPdf,
  usePreviewTimelineToPdf,
} from "@/hooks/api/task/use-task-timer";
import { useTableLayout } from "@/hooks/common";

import CustomContainer from "@/components/layout/custom-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModalDialog } from "@/components/ui/modal-dialog";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import { NotesDialog } from "@/pages/Task/components/task-modal/NotesDialog";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";

function buildBoardOptions(
  boards?: { strBoardGUID: string; strBoardName?: string | null }[]
) {
  if (!boards) return [];
  return boards.map((board) => ({
    value: board.strBoardGUID,
    label: board.strBoardName || "Untitled Board",
  }));
}

export default function UserTimelineReport(): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [selectedBoard, setSelectedBoard] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [displayClicked, setDisplayClicked] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [selectedFromDate, setSelectedFromDate] = useState<Date>(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDay.setHours(12, 0, 0, 0);
    return firstDay;
  });
  const [selectedToDate, setSelectedToDate] = useState<Date>(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDay.setHours(12, 0, 0, 0);
    return lastDay;
  });

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedUserGuid, setSelectedUserGuid] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedTaskNotes, setSelectedTaskNotes] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const defaultColumnOrder = [
    "strTaskTitle",
    "dtDate",
    "strUserName",
    "strStatus",
    "bolIsBillable",
    "dtDueDate",
    "dtStartTime",
    "dtEndTime",
    "duration",
  ];

  const boardsQuery = useBoardsByUser(user?.strUserGUID, boardDropdownOpen);
  const boardOptions = buildBoardOptions(boardsQuery.data?.boards);

  const { data: hierarchyData, isLoading: isLoadingUsers } = useUserHierarchy(
    user?.strUserGUID,
    selectedBoard,
    userDropdownOpen && !!selectedBoard
  );

  const hierarchyUsers = useMemo(() => {
    const baseUsers = hierarchyData?.strUserGUID
      ? [
          {
            strUserGUID: hierarchyData.strUserGUID,
            strUserName: hierarchyData.strUserName || "Unknown User",
            bolIsActive: true,
          },
        ]
      : [];
    const subordinates = hierarchyData?.subordinates || [];
    const mappedSubordinates = subordinates.map((u: Subordinate) => ({
      strUserGUID: u.strUserGUID,
      strUserName: u.strUserName || "Unknown User",
      bolIsActive: u.bolIsActive,
    }));
    const users = [...baseUsers, ...mappedSubordinates];
    return users.filter(
      (user, index, array) =>
        array.findIndex((item) => item.strUserGUID === user.strUserGUID) ===
        index
    );
  }, [hierarchyData]);

  const exportCsvMutation = useExportTimelineToCsv();
  const exportPdfMutation = useExportTimelineToPdf();
  const previewPdfMutation = usePreviewTimelineToPdf();

  const userOptions = useMemo(() => {
    if (!hierarchyUsers || hierarchyUsers.length === 0) return [];
    const options = hierarchyUsers
      .filter((u) => u.bolIsActive)
      .sort((a, b) => (a.strUserName || "").localeCompare(b.strUserName || ""))
      .map((u) => ({
        value: u.strUserGUID,
        label: u.strUserName || "Unknown User",
      }));

    return [{ value: "all", label: "All Users" }, ...options];
  }, [hierarchyUsers]);

  const params = useMemo(
    () =>
      displayClicked && selectedBoard
        ? {
            strUserGUID:
              selectedUserGuid === "all" ? undefined : selectedUserGuid,
            strBoardGUID: selectedBoard,
            dtFromDate: formatDateForAPI(selectedFromDate),
            dtToDate: formatDateForAPI(selectedToDate),
            pageNumber: pageNumber,
            pageSize: pageSize,
            sortBy: "dtStartTime",
            ascending: true,
          }
        : null,
    [
      displayClicked,
      selectedBoard,
      selectedUserGuid,
      selectedFromDate,
      selectedToDate,
      pageNumber,
      pageSize,
    ]
  );

  const { data, isLoading, refetch } = useGetTaskTimelineByUser(
    params !== null
      ? params
      : {
          strUserGUID: undefined,
          strBoardGUID: "",
          dtFromDate: "",
          dtToDate: "",
          pageNumber: 1,
          pageSize: 10,
          sortBy: "dtStartTime",
          ascending: true,
        }
  );

  const timelines = useMemo(() => data?.data || [], [data]);
  const totalRecords = data?.totalRecords || 0;
  const totalPages = data?.totalPages || 1;

  const filteredTimelines = useMemo(() => {
    const nonPrivateTimelines = timelines.filter(
      (timeline) => !timeline.bolIsPrivate
    );

    if (!debouncedSearch) return nonPrivateTimelines;
    const searchLower = debouncedSearch.toLowerCase();
    return nonPrivateTimelines.filter(
      (timeline) =>
        timeline.strTaskNo?.toLowerCase().includes(searchLower) ||
        timeline.strTaskTitle?.toLowerCase().includes(searchLower) ||
        timeline.strDescription?.toLowerCase().includes(searchLower) ||
        timeline.strBoardName?.toLowerCase().includes(searchLower) ||
        timeline.strBoardSection?.toLowerCase().includes(searchLower) ||
        timeline.strBoardSubModuleName?.toLowerCase().includes(searchLower) ||
        timeline.strTimerDescription?.toLowerCase().includes(searchLower) ||
        timeline.strTicketKey?.toLowerCase().includes(searchLower) ||
        timeline.strTicketSource?.toLowerCase().includes(searchLower)
    );
  }, [timelines, debouncedSearch]);

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "—";
    }
  };

  const getStatusColor = (status?: string | null) => {
    const statusColors: Record<string, string> = {
      Completed: "bg-green-100 text-green-800",
      "Not Started": "bg-gray-100 text-gray-800",
      Started: "bg-blue-100 text-blue-800",
      "On Hold": "bg-yellow-100 text-yellow-800",
      Incomplete: "bg-red-100 text-red-800",
      "For Review": "bg-red-100 text-red-800",
      Reassign: "bg-purple-100 text-purple-800",
    };
    return (status && statusColors[status]) || "bg-gray-100 text-gray-800";
  };

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
  } = useTableLayout("user-timeline-report", defaultColumnOrder, [], {
    strUserName: true,
    strTaskTitle: true,
    strStatus: true,
    dtDate: true,
    dtStartTime: true,
    dtEndTime: true,
    duration: true,
    dtDueDate: true,
    bolIsBillable: true,
  });

  const columns = useMemo<DataTableColumn<TaskTimelineResponseDto>[]>(() => {
    const baseColumns: DataTableColumn<TaskTimelineResponseDto>[] = [];

    const getTextClass = () =>
      isTextWrapped ? "wrap-break-word whitespace-normal" : "truncate";

    baseColumns.push({
      key: "dtDate",
      header: "Date",
      width: "130px",
      sortable: false,
      cell: (timeline: TaskTimelineResponseDto) => (
        <span>{formatDateTime(timeline.dtDate).split(",")[0]}</span>
      ),
    });
    baseColumns.push({
      key: "dtDueDate",
      header: "Due Date",
      width: "140px",
      sortable: false,
      cell: (timeline: TaskTimelineResponseDto) => (
        <span>{formatDateTime(timeline.dtDueDate).split(",")[0]}</span>
      ),
    });
    baseColumns.push({
      key: "strTaskTitle",
      header: "Task",
      width: "300px",
      sortable: false,
      cell: (timeline: TaskTimelineResponseDto) => {
        const ticketKey = timeline.strTicketKey?.trim();
        const ticketSource = timeline.strTicketSource?.trim();
        const ticketUrl = timeline.strTicketUrl?.trim();
        const normalizedUrl = ticketUrl
          ? ticketUrl.startsWith("http")
            ? ticketUrl
            : `https://${ticketUrl}`
          : "";

        return (
          <div className="flex items-stretch gap-2 w-full">
            <span
              className="w-1 rounded-full shrink-0"
              style={{
                backgroundColor:
                  timeline.strPriority === "High"
                    ? "#ef4444"
                    : timeline.strPriority === "Medium"
                      ? "#f97316"
                      : timeline.strPriority === "Low"
                        ? "#22c55e"
                        : "#6b7280",
              }}
              title={`Priority: ${timeline.strPriority || "None"}`}
            />
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                {timeline.strTaskNo && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    #{timeline.strTaskNo}
                  </span>
                )}
                <span
                  className={`font-medium ${getTextClass()}`}
                  title={timeline.strTaskTitle || ""}
                >
                  {timeline.strTaskTitle || "Untitled Task"}
                </span>
                {timeline.strDescription && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTaskNotes({
                        title: timeline.strTaskTitle || "",
                        description: timeline.strDescription || "",
                      });
                      setNotesDialogOpen(true);
                    }}
                    title="View description"
                  >
                    <NotebookPen className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {timeline.strBoardName && (
                  <div className="flex items-center gap-1.5">
                    <span>Project:</span>
                    <span
                      className={getTextClass()}
                      title={timeline.strBoardName || ""}
                    >
                      {timeline.strBoardName}
                    </span>
                  </div>
                )}
                {timeline.strBoardSection && (
                  <div className="flex items-center gap-1.5">
                    <span>Module:</span>
                    <span
                      className={getTextClass()}
                      title={timeline.strBoardSection || ""}
                    >
                      {timeline.strBoardSection}
                    </span>
                  </div>
                )}
                {timeline.strBoardSubModuleName && (
                  <div className="flex items-center gap-1.5">
                    <span>Sub Module:</span>
                    <span
                      className={getTextClass()}
                      title={timeline.strBoardSubModuleName || ""}
                    >
                      {timeline.strBoardSubModuleName}
                    </span>
                  </div>
                )}
                {(ticketSource || ticketKey) && (
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 shrink-0" />
                    {ticketSource && (
                      <span className="font-medium text-foreground shrink-0 text-xs">
                        {ticketSource}:
                      </span>
                    )}
                    {ticketKey ? (
                      normalizedUrl ? (
                        <a
                          href={normalizedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`${getTextClass()} text-primary hover:underline font-medium truncate text-xs`}
                        >
                          {ticketKey}
                        </a>
                      ) : (
                        <span className={`${getTextClass()} text-xs`}>
                          {ticketKey}
                        </span>
                      )
                    ) : null}
                  </div>
                )}
                {ticketUrl && !(ticketSource || ticketKey) && (
                  <div className="flex items-center gap-1">
                    <Ticket className="w-4 h-4 shrink-0" />
                    <a
                      href={normalizedUrl || ticketUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`${getTextClass()} text-primary text-xs truncate`}
                    >
                      {ticketUrl}
                    </a>
                  </div>
                )}
                {timeline.strTags && timeline.strTags.trim() !== "" && (
                  <div className="flex items-center gap-1.5">
                    <span>Tags:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {timeline.strTags.split(",").map((tag, index) => {
                        const trimmedTag = tag.trim();
                        if (!trimmedTag) return null;
                        const tagColor = getTagColor(trimmedTag);
                        return (
                          <div key={index} className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: tagColor }}
                            />
                            <span
                              className={`text-xs ${getTextClass()}`}
                              title={trimmedTag}
                            >
                              {trimmedTag}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      },
    });

    if (selectedUserGuid === "all") {
      baseColumns.push({
        key: "strUserName",
        header: "User",
        width: "100px",
        sortable: false,
        cell: (timeline: TaskTimelineResponseDto) => (
          <div className="flex items-center gap-2">
            <span className={getTextClass()} title={timeline.strUserName || ""}>
              {timeline.strUserName || "Unknown User"}
            </span>
          </div>
        ),
      });
    }

    baseColumns.push({
      key: "strStatus",
      header: "Status",
      width: "180px",
      sortable: false,
      align: "center",
      cell: (timeline: TaskTimelineResponseDto) => (
        <div className="space-y-1">
          <span
            className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              timeline.strStatus
            )}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {timeline.strStatus}
          </span>
          {(timeline.strStatus === "On Hold" ||
            timeline.strStatus === "Incomplete") &&
            timeline.strTimerDescription && (
              <div className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
                <span className="font-medium">Reason: </span>
                {timeline.strTimerDescription}
              </div>
            )}
        </div>
      ),
    });

    baseColumns.push({
      key: "dtStartTime",
      header: "Start Time",
      width: "160px",
      sortable: false,
      cell: (timeline: TaskTimelineResponseDto) => (
        <span>{formatDateTime(timeline.dtStartTime)}</span>
      ),
    });

    baseColumns.push({
      key: "dtEndTime",
      header: "End Time",
      width: "160px",
      sortable: false,
      cell: (timeline: TaskTimelineResponseDto) => (
        <span>
          {timeline.dtEndTime ? formatDateTime(timeline.dtEndTime) : "Working"}
        </span>
      ),
    });

    baseColumns.push({
      key: "duration",
      header: "Duration",
      width: "160px",
      sortable: false,
      align: "center",
      cell: (timeline: TaskTimelineResponseDto) => {
        const actualTime = timeline.strActualTime || "00:00:00";
        const estimatedTime = timeline.strEstimatedTime || "00:00:00";
        const bothZero =
          actualTime === "00:00:00" && estimatedTime === "00:00:00";

        if (bothZero) {
          return (
            <div className="flex items-center">
              <span className="text-muted-foreground text-xs">NA</span>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-1.5 text-sm">
            {estimatedTime !== "00:00:00" && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs font-medium">
                  Est:
                </span>
                <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
                  <Timer className="h-3 w-3 text-amber-500" />
                  {estimatedTime}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs font-medium">
                Act:
              </span>
              <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
                <Timer className="h-3 w-3 text-amber-500" />
                {actualTime}
              </span>
            </div>
          </div>
        );
      },
    });

    baseColumns.push({
      key: "bolIsBillable",
      header: "Billable",
      width: "110px",
      sortable: false,
      align: "center",
      cell: (timeline: TaskTimelineResponseDto) => {
        if (
          timeline.bolIsBillable === null ||
          timeline.bolIsBillable === undefined
        ) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span
            className={
              timeline.bolIsBillable
                ? "text-emerald-600"
                : "text-muted-foreground"
            }
          >
            {timeline.bolIsBillable ? "Yes" : "No"}
          </span>
        );
      },
    });

    return baseColumns;
  }, [selectedUserGuid, isTextWrapped]);

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((col) => [col.key, col]));
    return columnOrder
      .map((key) => columnMap.get(key))
      .filter(
        (col): col is DataTableColumn<TaskTimelineResponseDto> =>
          col !== undefined
      );
  }, [columns, columnOrder]);

  const goToPage = (page: number) => {
    setPageNumber(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageNumber(1);
  };

  const selectedUser = hierarchyUsers.find(
    (u) => u.strUserGUID === selectedUserGuid
  );

  const buildExportParams = () => ({
    strUserGUID: selectedUserGuid === "all" ? undefined : selectedUserGuid,
    strBoardGUID: selectedBoard,
    dtFromDate: formatDateForAPI(selectedFromDate),
    dtToDate: formatDateForAPI(selectedToDate),
  });

  const handleExportCsv = () => {
    exportCsvMutation.mutate(buildExportParams());
  };

  const handleExportPdf = () => {
    exportPdfMutation.mutate(buildExportParams());
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

  const isExporting =
    exportCsvMutation.isPending || exportPdfMutation.isPending;

  return (
    <CustomContainer>
      <div className="flex flex-col gap-4 space-y-1 mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                User Timeline
              </h1>
              <p className="text-sm text-muted-foreground">
                View detailed task timeline for your subordinates
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
              columns={orderedColumns}
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
                  "user-timeline-report_column_order",
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

          <div className="w-full sm:w-auto lg:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!displayClicked || isExporting || isLoading}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleExportCsv}
                  disabled={isExporting}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportPdf}
                  disabled={isExporting}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:flex-wrap">
          <div className="w-full sm:w-full md:w-64 lg:w-64">
            <PreloadedSelect
              options={boardOptions}
              selectedValue={selectedBoard}
              onChange={(val) => {
                setSelectedBoard(val);
                setDisplayClicked(false);
                setPageNumber(1);
              }}
              placeholder={
                boardsQuery.isLoading ? "Loading projects..." : "Select project"
              }
              isLoading={boardsQuery.isLoading}
              clearable={true}
              onOpenChange={setBoardDropdownOpen}
            />
          </div>

          <div className="w-full sm:w-full md:w-64 lg:w-64">
            <PreloadedSelect
              options={userOptions}
              selectedValue={selectedUserGuid}
              onChange={(val) => {
                setSelectedUserGuid(val);
                setDisplayClicked(false);
                setPageNumber(1);
              }}
              placeholder={
                !selectedBoard ? "Select a project first" : "All users"
              }
              isLoading={isLoadingUsers}
              clearable={true}
              disabled={!selectedBoard || isLoadingUsers}
              onOpenChange={setUserDropdownOpen}
            />
          </div>

          <div className="w-full sm:w-auto lg:w-auto">
            <DateRangePicker
              startDate={selectedFromDate}
              endDate={selectedToDate}
              onRangeChange={(startDate, endDate) => {
                if (startDate) {
                  setSelectedFromDate(startDate);
                }
                if (endDate) {
                  setSelectedToDate(endDate);
                }
                setDisplayClicked(false);
                setPageNumber(1);
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
              if (displayClicked && pageNumber === 1) {
                refetch();
              }
              setPageNumber(1);
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
                setSelectedUserGuid("all");
                setDisplayClicked(false);
                setPageNumber(1);
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
              Select a project and click the Display button to view the user
              timeline report.
            </p>
          </Card>
        ) : isLoading ? (
          <TableSkeleton
            columns={[
              "Date",
              "Task",
              "User",
              "Status",
              "Start Time",
              "End Time",
              "Duration",
            ]}
            pageSize={pageSize}
          />
        ) : filteredTimelines.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No Timeline Data</p>
              <p className="text-sm mt-1">
                {debouncedSearch
                  ? "No tasks match your search criteria"
                  : `No task timeline found for ${
                      selectedUserGuid === "all"
                        ? "all users"
                        : selectedUser?.strUserName || "this user"
                    } from ${selectedFromDate.toLocaleDateString()} to ${selectedToDate.toLocaleDateString()}`}
              </p>
            </div>
          </Card>
        ) : (
          <DataTable
            data={filteredTimelines}
            columns={orderedColumns}
            keyExtractor={(timeline: TaskTimelineResponseDto) =>
              `${timeline.strTaskTitle}-${timeline.dtStartTime}`
            }
            loading={isLoading}
            columnVisibility={columnVisibility}
            alwaysVisibleColumns={getAlwaysVisibleColumns()}
            isTextWrapped={isTextWrapped}
            pinnedColumns={pinnedColumns}
            columnWidths={columnWidths}
            onColumnWidthsChange={setColumnWidths}
            emptyState={
              debouncedSearch ? (
                <>No timelines found matching "{debouncedSearch}".</>
              ) : (
                <>
                  No timelines found for{" "}
                  {selectedUser?.strUserName || "this user"}.
                </>
              )
            }
            pagination={{
              pageNumber: pageNumber,
              pageSize: pageSize,
              totalCount: totalRecords,
              totalPages: totalPages,
              onPageChange: goToPage,
              onPageSizeChange: handlePageSizeChange,
            }}
            maxHeight="calc(93vh - 350px)"
            pageSizeOptions={[10, 20, 50, 100]}
          />
        )}

        {/* Notes Modal */}
        <NotesDialog
          open={notesDialogOpen}
          onOpenChange={setNotesDialogOpen}
          title={selectedTaskNotes?.title || "Task Notes"}
          description={selectedTaskNotes?.description || ""}
          maxWidth="800px"
        />
      </div>

      <ModalDialog
        open={isPreviewModalOpen}
        onOpenChange={handleClosePreviewModal}
        title="User Timeline Preview"
        maxWidth="1200px"
        fullHeight={true}
        showCloseButton={true}
      >
        {previewPdfUrl && (
          <iframe
            src={previewPdfUrl}
            className="w-full h-full min-h-150"
            title="User Timeline PDF Preview"
          />
        )}
      </ModalDialog>
    </CustomContainer>
  );
}
