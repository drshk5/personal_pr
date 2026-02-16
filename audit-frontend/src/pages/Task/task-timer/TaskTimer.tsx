import { useState, useMemo } from "react";
import {
  TimerReset,
  NotebookPen,
  CheckCircle2,
  Clock,
  Pause,
  XCircle,
  Lock,
  Timer,
  Info,
  UserX,
} from "lucide-react";

import type { TaskTimelineResponseDto } from "@/types/task/task-timer";

import { ModuleBase } from "@/lib/permissions";

import { getStatusColor } from "@/lib/task/task";

import { useGetTaskTimeline } from "@/hooks/api/task/use-task-timer";
import { useDashboardStatusUser } from "@/hooks/api/task/use-task-dashboard";
import { useMenuIcon } from "@/hooks/common";
import { useUserRights } from "@/hooks";
import { useTableLayout } from "@/hooks/common";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { TaskCounterCard } from "@/pages/Task/components/cards/TaskCounterCard";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

import { NotesDialog } from "@/pages/Task/components/task-modal/NotesDialog";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";

export default function TaskTimerPage() {
  const HeaderIcon = useMenuIcon(ModuleBase.BOARD, TimerReset);
  useUserRights();

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Always default to today's date at noon to avoid timezone issues
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return today;
  });
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedTaskNotes, setSelectedTaskNotes] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const defaultColumnOrder = [
    "strTaskTitle",
    "strStatus",
    "dtStartTime",
    "dtEndTime",
    "hours",
  ];

  // Helper function to format date for API in local timezone
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch all status counts at once
  const { data: statusCountsData, isLoading: statusCountsLoading } =
    useDashboardStatusUser({
      dtDate: formatDateForAPI(selectedDate),
    });

  // Extract individual status counts from the response
  const statusCounts = useMemo(() => {
    if (!statusCountsData) return {};
    return statusCountsData.reduce(
      (acc, item) => {
        acc[item.strStatus] = item.intCount;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [statusCountsData]);

  const { data, isLoading } = useGetTaskTimeline({
    dtFromDate: formatDateForAPI(selectedDate),
    dtToDate: formatDateForAPI(selectedDate),
    pageNumber: pageNumber,
    pageSize: pageSize,
    sortBy: "dtStartTime",
    ascending: true,
  });

  const timelines = useMemo(() => data?.data || [], [data]);
  const totalRecords = data?.totalRecords || 0;
  const totalPages = data?.totalPages || 1;

  const filteredTimelines = useMemo(() => {
    if (!debouncedSearch) return timelines;
    const searchLower = debouncedSearch.toLowerCase();
    return timelines.filter(
      (timeline) =>
        timeline.strTaskTitle?.toLowerCase().includes(searchLower) ||
        timeline.strDescription?.toLowerCase().includes(searchLower) ||
        timeline.strBoardName?.toLowerCase().includes(searchLower) ||
        timeline.strTimerDescription?.toLowerCase().includes(searchLower)
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

  const goToPage = (page: number) => {
    setPageNumber(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageNumber(1);
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
    columnOrder,
    setColumnOrder,
    columnWidths,
    setColumnWidths,
  } = useTableLayout("taskTimerList", defaultColumnOrder, [], {
    strTaskTitle: true,
    strStatus: true,
    dtStartTime: true,
    dtEndTime: true,
    hours: true,
  });

  const columns = useMemo(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "truncate";
    };

    const baseColumns: DataTableColumn<TaskTimelineResponseDto>[] = [
      {
        key: "strTaskTitle",
        header: "Task",
        width: "350px",
        cell: (timeline: TaskTimelineResponseDto) => (
          <div className={`flex items-stretch gap-2 ${getTextClass()}`}>
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
            <div className="flex flex-col gap-0.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium" title={timeline.strTaskTitle}>
                  {timeline.strTaskTitle}
                </span>
                {timeline.bolIsPrivate && (
                  <span title="Private task">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                )}
                {timeline.strDescription && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTaskNotes({
                        title: timeline.strTaskTitle || "",
                        description: timeline.strDescription || "",
                      });
                      setNotesDialogOpen(true);
                    }}
                    title="View notes"
                  >
                    <NotebookPen className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {timeline.strBoardName && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Project:</span>
                    <span>{timeline.strBoardName}</span>
                  </div>
                )}
                {timeline.strBoardSection && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Module:</span>
                    <span>{timeline.strBoardSection}</span>
                  </div>
                )}
                {timeline.strBoardSubModuleName && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">SubModule:</span>
                    <span>{timeline.strBoardSubModuleName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "strStatus",
        header: "Status",
        width: "150px",
        cell: (timeline: TaskTimelineResponseDto) => (
          <div className="flex flex-col gap-1.5">
            <div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  timeline.strStatus
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {timeline.strStatus}
              </span>
            </div>
            {(timeline.strStatus === "On Hold" ||
              timeline.strStatus === "Incomplete") &&
              timeline.strTimerDescription && (
                <span
                  className="text-xs text-muted-foreground line-clamp-2"
                  title={timeline.strTimerDescription}
                >
                  <span className="font-medium not-italic">Reason:</span>{" "}
                  {timeline.strTimerDescription}
                </span>
              )}
          </div>
        ),
      },
      {
        key: "dtStartTime",
        header: "Start Time",
        width: "180px",
        cell: (timeline: TaskTimelineResponseDto) => (
          <div
            className={getTextClass()}
            title={formatDateTime(timeline.dtStartTime)}
          >
            {formatDateTime(timeline.dtStartTime)}
          </div>
        ),
      },
      {
        key: "dtEndTime",
        header: "End Time",
        width: "180px",
        cell: (timeline: TaskTimelineResponseDto) => (
          <div className={getTextClass()}>
            {timeline.dtEndTime
              ? formatDateTime(timeline.dtEndTime)
              : "Working"}
          </div>
        ),
      },
      {
        key: "hours",
        header: "Hours (Est / Actual)",
        width: "180px",
        cell: (timeline: TaskTimelineResponseDto) => {
          const estimatedTime = timeline.strEstimatedTime || "00:00:00";
          const actualTime = timeline.strActualTime || "00:00:00";

          // If both times are 00:00:00, show just "NA"
          if (estimatedTime === "00:00:00" && actualTime === "00:00:00") {
            return (
              <div className="flex items-center">
                <span className="text-muted-foreground text-xs">NA</span>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center gap-1.5">
                {estimatedTime !== "00:00:00" ? (
                  <>
                    <span className="text-muted-foreground text-xs font-medium">
                      Est:
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
                      <Timer className="h-3 w-3 text-amber-500" />
                      {estimatedTime}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">NA</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {actualTime !== "00:00:00" ? (
                  <>
                    <span className="text-muted-foreground text-xs font-medium">
                      Act:
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground">
                      <Timer className="h-3 w-3 text-amber-500" />
                      {actualTime}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs">NA</span>
                )}
              </div>
            </div>
          );
        },
      },
    ];

    return baseColumns;
  }, [isTextWrapped]);

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((col) => [col.key, col]));
    return columnOrder
      .map((key: string) => columnMap.get(key))
      .filter(
        (
          col: DataTableColumn<TaskTimelineResponseDto> | undefined
        ): col is DataTableColumn<TaskTimelineResponseDto> => col !== undefined
      );
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <PageHeader
        title="Timeline"
        description="View and track all Timeline with detailed information"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2 pr-10 sm:pr-6">
            <div className="relative group">
              <button className="p-1.5 rounded-full transition-colors">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-popover border border-border-color rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="space-y-3">
                  <p className="font-semibold text-sm text-foreground">
                    Date Filter Information:
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Only{" "}
                      <strong className="text-foreground">Completed</strong> and{" "}
                      <strong className="text-foreground">Incomplete</strong>{" "}
                      tasks are filtered by the selected date.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Other task statuses are shown regardless of date.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DatePicker
              value={selectedDate}
              onChange={(date) => {
                if (date) setSelectedDate(date);
                setPageNumber(1);
              }}
              placeholder="Select date"
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const checkDate = new Date(date);
                checkDate.setHours(0, 0, 0, 0);
                return checkDate > today;
              }}
            />
          </div>
        }
      />

      {/* Task Counters */}
      <div className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-4">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-0">
            <TaskCounterCard
              title="Not Started"
              value={statusCounts["Not Started"] ?? 0}
              icon={<Clock className="h-5 w-5" />}
              isLoading={statusCountsLoading}
              error={false}
            />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
            <TaskCounterCard
              title="Reassign"
              value={statusCounts["Reassign"] ?? 0}
              icon={<UserX className="h-5 w-5" />}
              isLoading={statusCountsLoading}
              error={false}
            />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <TaskCounterCard
              title="For Review"
              value={statusCounts["For Review"] ?? 0}
              icon={<Info className="h-5 w-5" />}
              isLoading={statusCountsLoading}
              error={false}
            />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <TaskCounterCard
              title="On Hold"
              value={statusCounts["On Hold"] ?? 0}
              icon={<Pause className="h-5 w-5" />}
              isLoading={statusCountsLoading}
              error={false}
            />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-225">
            <TaskCounterCard
              title="Completed"
              value={statusCounts["Completed"] ?? 0}
              icon={<CheckCircle2 className="h-5 w-5" />}
              isLoading={statusCountsLoading}
              error={false}
            />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-375">
            <TaskCounterCard
              title="Incomplete"
              value={statusCounts["Incomplete"] ?? 0}
              icon={<XCircle className="h-5 w-5" />}
              isLoading={statusCountsLoading}
              error={false}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <Separator className="my-6" />

      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <SearchInput
            placeholder="Search by task title or project name..."
            onSearchChange={setDebouncedSearch}
            className="max-w-full sm:max-w-md flex-1"
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
                  "taskTimerList_column_order",
                  JSON.stringify(order)
                );
              }}
              onResetAll={() => {
                resetColumnVisibility();
                resetPinnedColumns();
                setColumnOrder(defaultColumnOrder);
                setColumnWidths({});
                localStorage.removeItem("taskTimerList_column_order");
                localStorage.removeItem("taskTimerList_column_widths");
              }}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton
          columns={[
            "Task",
            "Status",
            "Start Time",
            "End Time",
            "Hours (Est / Actual)",
          ]}
          pageSize={pageSize}
        />
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
              <>No timelines found. Timelines will appear here once created.</>
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
          maxHeight="calc(100vh - 350px)"
          pageSizeOptions={[10, 25, 50, 100]}
        />
      )}

      {/* Notes Dialog */}
      <NotesDialog
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        title={selectedTaskNotes?.title || "Task Notes"}
        description={selectedTaskNotes?.description || ""}
        maxWidth="800px"
      />
    </CustomContainer>
  );
}
