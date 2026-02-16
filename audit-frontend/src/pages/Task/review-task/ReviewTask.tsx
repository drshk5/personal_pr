import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ClipboardCheck,
  ListIcon,
  Lock,
  NotebookPen,
  Paperclip,
  Timer,
  User,
  Users,
} from "lucide-react";

import type {
  PendingReviewTask,
  PendingReviewTasksPayload,
} from "@/types/task/review-task";
import type { ApiResponse, BackendPagedResponse } from "@/types";

import { ModuleBase } from "@/lib/permissions";

import { formatDate } from "@/lib/utils";
import { getStatusColor, getTagColor } from "@/lib/task/task";
import { PRIORITY_COLOR_CLASS } from "@/constants/Task/task";

import { useReviewModulePendingTasks } from "@/hooks/api/task/use-review-task";
import { useBoardsByUser } from "@/hooks/api/task/use-board-team";
import { useMenuIcon, useTableLayout } from "@/hooks/common";
import { useAuthContext } from "@/hooks/common/use-auth-context";

import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/select/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { TaskModal } from "@/pages/Task/components/task-modal/TaskModal";
import { NotesDialog } from "@/pages/Task/components/task-modal/NotesDialog";
import { SearchInput } from "@/components/shared/search-input";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";

export default function ReviewTaskPage() {
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const HeaderIcon = useMenuIcon(ModuleBase.REVIEW_TASK, ClipboardCheck);

  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  const [sorting, setSorting] = useState({
    columnKey: "dtCreatedOn",
    direction: "desc" as "asc" | "desc",
  });

  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [boardFilter, setBoardFilter] = useState<string[]>([]);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);

  const [editingTask, setEditingTask] = useState<PendingReviewTask | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);

  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedTaskNotes, setSelectedTaskNotes] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const { user } = useAuthContext();

  const { data: userBoardsData, isLoading: isBoardsLoading } = useBoardsByUser(
    user?.strUserGUID,
    boardDropdownOpen || boardFilter.length > 0
  );

  const boardOptions = useMemo(() => {
    if (!userBoardsData?.boards) return [];
    return userBoardsData.boards.map((board) => ({
      value: board.strBoardGUID,
      label: board.strBoardName || "Unnamed Board",
    }));
  }, [userBoardsData]);

  // Build parameters for API calls
  const reviewTasksParams = useMemo(
    () => ({
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      sortBy: sorting.columnKey,
      ascending: sorting.direction === "asc",
      search: debouncedSearch,
      strStatus: "For Review",
      strPriority: priorityFilter !== "all" ? priorityFilter : undefined,
      strBoardGUIDs: boardFilter.length > 0 ? boardFilter.join(",") : undefined,
    }),
    [
      pagination.pageNumber,
      pagination.pageSize,
      sorting.columnKey,
      sorting.direction,
      debouncedSearch,
      priorityFilter,
      boardFilter,
    ]
  );

  const {
    data: reviewTasksResponse,
    isLoading: loadingReviewTasks,
    refetch: refetchReviewTasks,
  } = useReviewModulePendingTasks(reviewTasksParams);

  const { tasks, paginationMeta } = useMemo(() => {
    const response = reviewTasksResponse as
      | BackendPagedResponse<PendingReviewTask[]>
      | ApiResponse<PendingReviewTasksPayload>
      | undefined;

    if (!response) {
      return {
        tasks: [] as PendingReviewTask[],
        paginationMeta: null as {
          totalRecords: number;
          totalPages: number;
          pageNumber: number;
          pageSize: number;
        } | null,
      };
    }

    if ("pageNumber" in response && Array.isArray(response.data)) {
      return {
        tasks: response.data,
        paginationMeta: {
          totalRecords: response.totalRecords,
          totalPages: response.totalPages,
          pageNumber: response.pageNumber,
          pageSize: response.pageSize,
        },
      };
    }

    const payload = response.data;
    if (!payload || !("items" in payload)) {
      return {
        tasks: [] as PendingReviewTask[],
        paginationMeta: null as {
          totalRecords: number;
          totalPages: number;
          pageNumber: number;
          pageSize: number;
        } | null,
      };
    }
    return {
      tasks: payload.items,
      paginationMeta: {
        totalRecords: payload.totalCount,
        totalPages: payload.totalPages,
        pageNumber: payload.pageNumber,
        pageSize: payload.pageSize,
      },
    };
  }, [reviewTasksResponse]);

  // Update pagination from API response
  useEffect(() => {
    if (paginationMeta) {
      setPagination((prev) => ({
        ...prev,
        totalCount: paginationMeta.totalRecords,
        totalPages: paginationMeta.totalPages,
      }));
    }
  }, [paginationMeta]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      pageNumber: newPage,
    }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageNumber: 1,
      pageSize: newPageSize,
    }));
  };

  const handleSort = (columnKey: string) => {
    setSorting((prev) => ({
      columnKey,
      direction:
        prev.columnKey === columnKey && prev.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleEditTask = useCallback((task: PendingReviewTask) => {
    setEditingTask(task);
    setShowEditModal(true);
  }, []);

  const handleViewNotes = useCallback((task: PendingReviewTask) => {
    setSelectedTaskNotes({
      title: task.strTitle,
      description: task.strDescription || "No description available",
    });
    setNotesDialogOpen(true);
  }, []);

  const getBoardName = useCallback(
    (boardGUID: string | null | undefined): string | null => {
      if (!boardGUID) return null;
      const board = userBoardsData?.boards?.find(
        (b) => b.strBoardGUID === boardGUID
      );
      return board?.strBoardName || null;
    },
    [userBoardsData]
  );

  const defaultColumnOrder = [
    "strTitle",
    "strStatus",
    "strAssignedTo",
    "strAssignedBy",
    "dtDueDate",
    "timeTracking",
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
  } = useTableLayout("review-task-columns", defaultColumnOrder, []);

  const columns = useMemo(() => {
    const getTextClass = () =>
      isTextWrapped
        ? "whitespace-normal wrap-break-word"
        : "whitespace-nowrap overflow-hidden text-ellipsis";

    const getAssignedToLabel = (task: PendingReviewTask) => {
      if (task.assignments && task.assignments.length > 0) {
        const labels = task.assignments
          .map(
            (assignment) =>
              assignment.strAssignToName || assignment.strAssignToGUID
          )
          .filter(Boolean);

        return labels.length > 0 ? labels.join(", ") : "—";
      }

      return task.strAssignedTo || "—";
    };

    const buildAssignedToLines = (task: PendingReviewTask) => {
      if (task.assignments && task.assignments.length > 0) {
        const maxUsers = 3;
        let visibleUserCount = 0;
        const remainingUserNames: string[] = [];
        const lines: Array<{ type: string; name: string }> = [];

        task.assignments.forEach((assignment) => {
          const type = (assignment.strAssignToType || "").toUpperCase();
          const name = assignment.strAssignToName || assignment.strAssignToGUID;

          if (!name) return;

          if (type === "USER") {
            if (visibleUserCount < maxUsers) {
              visibleUserCount += 1;
              lines.push({ type, name });
            } else {
              remainingUserNames.push(name);
            }
            return;
          }

          lines.push({ type, name });
        });

        return {
          lines,
          remainingUsers: remainingUserNames.length,
          remainingUserNames,
        };
      }

      if (task.strAssignedTo) {
        return {
          lines: [{ type: "USER", name: task.strAssignedTo }],
          remainingUsers: 0,
          remainingUserNames: [],
        };
      }

      return { lines: [], remainingUsers: 0, remainingUserNames: [] };
    };

    const baseColumns: DataTableColumn<PendingReviewTask>[] = [];

    baseColumns.push(
      {
        key: "strTitle",
        header: "Task",
        width: "400px",
        cell: (task: PendingReviewTask) => (
          <div className="flex items-stretch gap-1.5 sm:gap-2 min-w-0">
            <span
              className="w-0.5 sm:w-1 rounded-full shrink-0"
              style={{
                backgroundColor:
                  task.strPriority === "High"
                    ? "#ef4444"
                    : task.strPriority === "Medium"
                      ? "#f97316"
                      : task.strPriority === "Low"
                        ? "#22c55e"
                        : "#6b7280",
              }}
              title={`Priority: ${task.strPriority || "None"}`}
            />
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                <span
                  className={`font-medium cursor-pointer hover:text-primary hover:underline transition-colors text-sm sm:text-base block min-w-0 ${getTextClass()}`}
                  title={task.strTitle}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTask(task);
                  }}
                >
                  {task.strTitle}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {task.bolIsPrivate && (
                    <span title="Private task">
                      <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                    </span>
                  )}
                  {task.strDescription && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewNotes(task);
                      }}
                      title="View notes"
                    >
                      <NotebookPen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {!task.bolIsPrivate && (
                <div className="flex flex-col gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground min-w-0">
                  {(() => {
                    const boardName =
                      task.strBoardName || getBoardName(task.strBoardGUID);
                    return boardName ? (
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap min-w-0">
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground min-w-0">
                          <span className="font-medium shrink-0">
                            #{task.strTaskNo || "—"}
                          </span>
                        </div>
                        <span className="font-medium shrink-0">Project:</span>
                        <span className={`min-w-0 ${getTextClass()}`}>
                          {boardName}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  {task.strBoardSectionName && (
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap min-w-0">
                      <span className="font-medium shrink-0">Module:</span>
                      <span className={`min-w-0 ${getTextClass()}`}>
                        {task.strBoardSectionName}
                      </span>
                    </div>
                  )}
                  {task.strBoardSubModuleName && (
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap min-w-0">
                      <span className="font-medium shrink-0">SubModule:</span>
                      <span className={`min-w-0 ${getTextClass()}`}>
                        {task.strBoardSubModuleName}
                      </span>
                    </div>
                  )}
                  {(task.strTicketSource || task.strTicketKey) && (
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="font-medium text-foreground shrink-0">
                        {task.strTicketSource || "—"}:
                      </span>
                      {task.strTicketUrl ? (
                        <a
                          href={task.strTicketUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`${getTextClass()} text-primary hover:underline`}
                          onClick={(e) => e.stopPropagation()}
                          title={task.strTicketUrl}
                        >
                          {task.strTicketKey || "—"}
                        </a>
                      ) : (
                        <span className={`${getTextClass()}`}>
                          {task.strTicketKey || "—"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {task.strTags && (
                <div className="flex items-start gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 min-w-0">
                  <span className="font-medium shrink-0 mt-0.5">Tags:</span>
                  <div className="flex items-center gap-1 flex-wrap min-w-0">
                    {task.strTags.split(",").map((tag, index) => {
                      const trimmedTag = tag.trim();
                      const tagColor = getTagColor(trimmedTag);
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center gap-0.5 sm:gap-1 min-w-0"
                          title={trimmedTag}
                        >
                          <span
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0"
                            style={{ backgroundColor: tagColor }}
                          />
                          <span className={`min-w-0 ${getTextClass()}`}>
                            {trimmedTag}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 min-w-0">
                {task.intFilesCount && task.intFilesCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-muted-foreground shrink-0"
                    title={`${task.intFilesCount} upload${
                      task.intFilesCount !== 1 ? "s" : ""
                    }`}
                  >
                    <Paperclip className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>{task.intFilesCount}</span>
                  </span>
                )}
                {task.intChecklistsCount && task.intChecklistsCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-muted-foreground shrink-0"
                    title={`${task.intChecklistsCount} subtask${
                      task.intChecklistsCount !== 1 ? "s" : ""
                    }`}
                  >
                    <ListIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>{task.intChecklistsCount}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strStatus",
        header: "Status",
        width: "120px",
        cell: (task: PendingReviewTask) => {
          const colorClass = getStatusColor(task.strStatus);
          return (
            <span
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${colorClass} whitespace-nowrap`}
            >
              {task.strStatus}
            </span>
          );
        },
        sortable: true,
      },
      {
        key: "strAssignedTo",
        header: "Assigned To",
        width: "150px",
        cell: (task: PendingReviewTask) => {
          const { lines, remainingUsers, remainingUserNames } =
            buildAssignedToLines(task);

          if (lines.length === 0) {
            return (
              <div
                className={`${getTextClass()} text-xs sm:text-sm`}
                title={getAssignedToLabel(task)}
              >
                —
              </div>
            );
          }

          return (
            <div
              className="flex flex-col gap-1"
              title={getAssignedToLabel(task)}
            >
              {lines.map((line, index) => {
                const isTeam = line.type === "TEAM";
                const Icon = isTeam ? Users : User;

                return (
                  <div
                    key={`${line.type}-${line.name}-${index}`}
                    className={`flex items-center gap-2 text-xs sm:text-sm ${getTextClass()}`}
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="min-w-0">{line.name}</span>
                  </div>
                );
              })}
              {remainingUsers > 0 && (
                <div
                  className="text-[10px] sm:text-xs text-muted-foreground"
                  title={remainingUserNames.join(", ")}
                >
                  ... +{remainingUsers}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "strAssignedBy",
        header: "Assigned By",
        width: "150px",
        cell: (task: PendingReviewTask) => (
          <div className={`${getTextClass()} text-xs sm:text-sm`}>
            {task.strAssignedBy || "—"}
          </div>
        ),
      },
      {
        key: "dtDueDate",
        header: "Due Date",
        width: "120px",
        cell: (task: PendingReviewTask) => (
          <div className="text-xs sm:text-sm whitespace-nowrap">
            {task.dtDueDate ? formatDate(task.dtDueDate) : "—"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "timeTracking",
        header: "Hours (Est / Actual)",
        width: "180px",
        cell: (task: PendingReviewTask) => {
          const formatMinutesToTime = (
            minutes: number | null | undefined
          ): string => {
            if (!minutes || minutes === 0) return "00:00:00";
            const hours = Math.floor(minutes / 60);
            const mins = Math.floor(minutes % 60);
            return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
              2,
              "0"
            )}:00`;
          };

          const estimatedTime = formatMinutesToTime(task.intEstimatedMinutes);
          const actualTime = task.strTotalTime || "00:00:00";

          if (estimatedTime === "00:00:00" && actualTime === "00:00:00") {
            return (
              <div className="flex items-center">
                <span className="text-muted-foreground text-xs">NA</span>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-1 sm:gap-1.5 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {estimatedTime !== "00:00:00" ? (
                  <>
                    <span className="text-muted-foreground text-[10px] sm:text-xs font-medium shrink-0">
                      Est:
                    </span>
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-muted/50 border border-border rounded-md text-[10px] sm:text-xs font-medium text-foreground">
                      <Timer className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 shrink-0" />
                      <span className="whitespace-nowrap">{estimatedTime}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-[10px] sm:text-xs">
                    NA
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {actualTime !== "00:00:00" ? (
                  <>
                    <span className="text-muted-foreground text-[10px] sm:text-xs font-medium shrink-0">
                      Act:
                    </span>
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-muted/50 border border-border rounded-md text-[10px] sm:text-xs font-medium text-foreground">
                      <Timer className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 shrink-0" />
                      <span className="whitespace-nowrap">{actualTime}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-[10px] sm:text-xs">
                    NA
                  </span>
                )}
              </div>
            </div>
          );
        },
      }
    );

    return baseColumns;
  }, [isTextWrapped, getBoardName, handleViewNotes, handleEditTask]);

  // Apply column ordering
  const orderedColumns = useMemo(() => {
    if (!columns || columns.length === 0) return columns;

    return [...columns].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.key);
      const bIndex = columnOrder.indexOf(b.key);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <div className="space-y-3 sm:space-y-4">
        <PageHeader
          title="Review Tasks"
          icon={HeaderIcon}
          description="Tasks pending your review"
        />

        <div className="mt-4 sm:mt-6 space-y-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            {/* Search Input */}
            <div className="w-full sm:max-w-md">
              <SearchInput
                placeholder="Search by task title, description..."
                onSearchChange={setDebouncedSearch}
                className="w-full"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 sm:gap-2.5 w-full sm:w-auto sm:flex-none">
              {/* Priority Filter */}
              <div className="w-full sm:w-45 lg:w-50 shrink-0">
                <Select
                  value={priorityFilter}
                  onValueChange={(value) => setPriorityFilter(value)}
                >
                  <SelectTrigger className="border-border w-full">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem
                      value="High"
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded ${PRIORITY_COLOR_CLASS["High"]}`}
                        />
                        High
                      </span>
                    </SelectItem>
                    <SelectItem
                      value="Medium"
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded ${PRIORITY_COLOR_CLASS["Medium"]}`}
                        />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem
                      value="Low"
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded ${PRIORITY_COLOR_CLASS["Low"]}`}
                        />
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem
                      value="None"
                      className="pl-2 pr-2 [&_svg]:hidden"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded ${PRIORITY_COLOR_CLASS["None"]}`}
                        />
                        None
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Board Filter */}
              <div className="w-full sm:w-45 lg:w-50 shrink-0">
                <MultiSelect
                  options={boardOptions}
                  selectedValues={boardFilter}
                  onChange={setBoardFilter}
                  placeholder="All Projects"
                  onOpenChange={setBoardDropdownOpen}
                  isLoading={boardDropdownOpen && isBoardsLoading}
                />
              </div>

              {/* Column Visibility - Full width on mobile, auto on larger */}
              <div className="w-full sm:w-auto sm:flex-1 lg:flex-none lg:w-auto h-10">
                <DraggableColumnVisibility
                  columns={columns as DataTableColumn<unknown>[]}
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
                      "review-task_column_order",
                      JSON.stringify(order)
                    );
                  }}
                  onResetAll={() => {
                    resetAll();
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {loadingReviewTasks ? (
          <TableSkeleton
            columns={[
              { header: "Task", width: "550px" },
              { header: "Status", width: "120px" },
              { header: "Assigned To", width: "150px" },
              { header: "Assigned By", width: "150px" },
            ]}
            pageSize={pagination.pageSize}
          />
        ) : (
          <DataTable
            columns={orderedColumns}
            data={tasks}
            keyExtractor={(task) => task.strTaskGUID}
            pagination={{
              pageNumber: pagination.pageNumber,
              pageSize: pagination.pageSize,
              totalCount: pagination.totalCount,
              totalPages: pagination.totalPages,
              onPageChange: handlePageChange,
              onPageSizeChange: handlePageSizeChange,
            }}
            maxHeight="calc(100vh - 280px) sm:calc(100vh - 320px) md:calc(100vh - 350px)"
            sortBy={sorting.columnKey}
            ascending={sorting.direction === "asc"}
            onSort={handleSort}
            columnVisibility={columnVisibility}
            alwaysVisibleColumns={getAlwaysVisibleColumns()}
            isTextWrapped={isTextWrapped}
            pinnedColumns={pinnedColumns}
            columnWidths={columnWidths}
            onColumnWidthsChange={(widths) => {
              setColumnWidths(widths);
              localStorage.setItem(
                "review-task_column_widths",
                JSON.stringify(widths)
              );
            }}
            emptyState={
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg font-semibold">No tasks found</p>
                <p className="text-sm">
                  No tasks are currently pending your review.
                </p>
              </div>
            }
          />
        )}
      </div>

      {/* Task Edit Modal */}
      {showEditModal && editingTask && (
        <TaskModal
          open={showEditModal}
          onOpenChange={(open: boolean) => {
            setShowEditModal(open);
            if (!open) setEditingTask(null);
          }}
          taskGUID={editingTask.strTaskGUID}
          mode="edit"
          permissionModule={ModuleBase.REVIEW_TASK}
          onSuccess={async () => {
            await refetchReviewTasks();
          }}
        />
      )}

      {/* Notes Dialog */}
      <NotesDialog
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        title={selectedTaskNotes?.title || ""}
        description={selectedTaskNotes?.description || ""}
      />
    </CustomContainer>
  );
}
