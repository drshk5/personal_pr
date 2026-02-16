import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Filter,
  ListChecks,
  ListIcon,
  Lock,
  NotebookPen,
  Paperclip,
  Timer,
  User,
  Users,
} from "lucide-react";

import type { TaskListItem } from "@/types/task/task";

import { Actions, ModuleBase } from "@/lib/permissions";

import { format } from "date-fns";

import { useBoardTasks } from "@/hooks/api/task/use-task";
import { useBoardsByUser } from "@/hooks/api/task/use-board-team";
import { useModuleUsers } from "@/hooks/api/central/use-users";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useMenuIcon, useTableLayout } from "@/hooks/common";
import { useAuthContext } from "@/hooks/common/use-auth-context";

import {
  formatMinutesToHHMMSS,
  formatTaskDate,
  getPriorityColor,
  getStatusColor,
  getTagColor,
} from "@/lib/task/task";
import { PRIORITY_COLOR_CLASS } from "@/constants/Task/task";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MultiSelect } from "@/components/ui/select/multi-select";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { WithPermission } from "@/components/ui/with-permission";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

import { TaskActivityModal } from "@/pages/Task/components/task-modal/TaskActivityModal";
import { NotesDialog } from "@/pages/Task/components/task-modal/NotesDialog";
import { TaskModal } from "@/pages/Task/components/task-modal/TaskModal";
import { useQueryClient } from "@tanstack/react-query";
import { taskQueryKeys } from "@/hooks/api/task/use-task";
import { SearchInput } from "@/components/shared/search-input";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";

export default function AllTasksPage() {
  const HeaderIcon = useMenuIcon(ModuleBase.ALL_TASKS, ListChecks);
  const [searchParams] = useSearchParams();

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [assignedToFilter, setAssignedToFilter] = useState<string[]>([]);
  const [reviewedByFilter, setReviewedByFilter] = useState<string[]>([]);
  const [assignedByFilter, setAssignedByFilter] = useState<string[]>([]);
  const [privateFilter, setPrivateFilter] = useState<string>("all");
  const [selectedBoardGUID, setSelectedBoardGUID] = useState<string>("all");

  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { firstDay, lastDay };
  };

  const { firstDay, lastDay } = getCurrentMonthRange();
  const [fromDate, setFromDate] = useState<Date | undefined>(firstDay);
  const [toDate, setToDate] = useState<Date | undefined>(lastDay);
  const [billableFilter, setBillableFilter] = useState<string>("all");
  const [reviewReqFilter, setReviewReqFilter] = useState<string>("all");

  const { pagination, setPagination } = useListPreferences("allTasks", {
    pagination: {
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
    },
  });

  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedTaskNotes, setSelectedTaskNotes] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedTaskActivity] =
    useState<TaskListItem | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const statusParam = searchParams.get("status");
    const boardParam = searchParams.get("board");

    if (statusParam) {
      setStatusFilter([statusParam]);
    }

    if (boardParam) {
      setSelectedBoardGUID(boardParam);
    }
  }, [searchParams]);

  const { user } = useAuthContext();
  const { data: userBoardsData, isLoading: isLoadingBoards } = useBoardsByUser(
    user?.strUserGUID,
    boardDropdownOpen || selectedBoardGUID !== "all"
  );

  const { data: moduleUsersData, isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    userDropdownOpen
  );

  const assignableUsers = useMemo(() => {
    if (!moduleUsersData) return [];
    return moduleUsersData.map(
      (u: { strUserGUID: string; strName: string }) => ({
        strUserGUID: u.strUserGUID,
        strName: u.strName,
      })
    );
  }, [moduleUsersData]);

  // Use board-specific endpoint when a board is selected
  const { data: boardTasksResponse, isLoading: boardTasksLoading } =
    useBoardTasks(
      selectedBoardGUID !== "all"
        ? {
            strBoardGUID: selectedBoardGUID,
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            search: debouncedSearch,
            sortBy: "dtCreatedOn",
            ascending: false,
            strStatuses: statusFilter.length
              ? statusFilter.join(",")
              : undefined,
            strPriorities: priorityFilter.length
              ? priorityFilter.join(",")
              : undefined,
            strAssignedToGUIDs: assignedToFilter.length
              ? assignedToFilter.join(",")
              : undefined,
            strReviewedByGUIDs: reviewedByFilter.length
              ? reviewedByFilter.join(",")
              : undefined,
            strAssignedByGUIDs: assignedByFilter.length
              ? assignedByFilter.join(",")
              : undefined,
            bolIsBillable:
              billableFilter === "all" ? undefined : billableFilter === "yes",
            bolIsReviewReq:
              reviewReqFilter === "all" ? undefined : reviewReqFilter === "yes",
            dtFromDate: fromDate
              ? format(new Date(fromDate), "yyyy-MM-dd")
              : undefined,
            dtToDate: toDate
              ? format(new Date(toDate), "yyyy-MM-dd")
              : undefined,
          }
        : undefined
    );

  // Only fetch tasks when a board is selected
  const tasksResponse = boardTasksResponse;
  const tasksLoading = boardTasksLoading;

  useEffect(() => {
    if (tasksResponse) {
      setPagination({
        pageNumber: tasksResponse.pageNumber,
        pageSize: tasksResponse.pageSize,
        totalCount: tasksResponse.totalRecords,
        totalPages: tasksResponse.totalPages,
      });
    }
  }, [tasksResponse, setPagination]);

  const goToPage = (pageNumber: number) => {
    setPagination({
      pageNumber,
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({
      pageSize: newSize,
      pageNumber: 1,
    });
  };

  const allTasks: TaskListItem[] = useMemo(() => {
    if (tasksResponse?.data && Array.isArray(tasksResponse.data)) {
      return tasksResponse.data;
    }
    return [];
  }, [tasksResponse]);

  const defaultColumnOrder = [
    "strTitle",
    "strStatus",
    "dtDueDate",
    "strAssignedTo",
    "strAssignedBy",
    "strReviewedBy",
    "hours",
    "activity",
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
  } = useTableLayout("allTaskList", defaultColumnOrder, []);

  const columns = useMemo(() => {
    const getTextClass = () =>
      isTextWrapped
        ? "whitespace-normal wrap-break-word"
        : "whitespace-nowrap overflow-hidden text-ellipsis";

    const getAssignedToLabel = (task: TaskListItem) => {
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

    const buildAssignedToLines = (task: TaskListItem) => {
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

    const baseColumns: DataTableColumn<TaskListItem>[] = [
      {
        key: "strTitle",
        header: "Task",
        width: "380px",
        cell: (task: TaskListItem) => {
          const filesCount = task.intFilesCount ?? task.strFiles?.length ?? 0;
          const checklistsCount =
            task.intChecklistsCount ?? task.strChecklists?.length ?? 0;

          return (
            <div className="flex items-stretch gap-2 min-w-0">
              <span
                className="w-1 rounded-full shrink-0"
                style={{ backgroundColor: getPriorityColor(task.strPriority) }}
                title={`Priority: ${task.strPriority || "None"}`}
              />
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`font-medium cursor-pointer hover:text-primary hover:underline transition-colors block min-w-0 ${getTextClass()}`}
                    title={task.strTitle}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                      setShowTaskModal(true);
                    }}
                  >
                    {task.strTitle}
                  </span>
                  {task.bolIsPrivate && (
                    <span title="Private task" className="shrink-0">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  )}
                  {task.strDescription && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTaskNotes({
                          title: task.strTitle || "",
                          description: task.strDescription || "",
                        });
                        setNotesDialogOpen(true);
                      }}
                      title="View notes"
                    >
                      <NotebookPen className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                  <span className="font-medium shrink-0">
                    #{task.strTaskNo || ""}</span>
                  {task.dtStartDate && (
                    <>
                      <span className="shrink-0"> | Start:</span>
                      <span className={`min-w-0 ${getTextClass()}`}>
                        {formatTaskDate(task.dtStartDate)}
                      </span>
                    </>
                  )}
                </div>
                {task.strBoardName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                    <span className="font-medium shrink-0">Project:</span>
                    <span className={`min-w-0 ${getTextClass()}`}>{task.strBoardName}</span>
                  </div>
                )}
                {task.strBoardSectionName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                    <span className="font-medium shrink-0">Module:</span>
                    <span className={`min-w-0 ${getTextClass()}`}>{task.strBoardSectionName}</span>
                  </div>
                )}
                {task.strSubModuleName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                    <span className="font-medium shrink-0">Submodule:</span>
                    <span className={`min-w-0 ${getTextClass()}`}>{task.strSubModuleName}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1 min-w-0">
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
                  {task.strTags && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                      <span className="font-medium shrink-0">Tags:</span>
                      <div className="flex items-center gap-1 flex-wrap min-w-0">
                        {task.strTags.split(",").map((tag, index) => {
                          const trimmedTag = tag.trim();
                          const tagColor = getTagColor(trimmedTag);
                          return (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 min-w-0"
                              title={trimmedTag}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
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
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                    {filesCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-muted-foreground shrink-0"
                        title={`${filesCount} upload${filesCount !== 1 ? "s" : ""}`}
                      >
                        <Paperclip className="h-3.5 w-4" />
                        <span>{filesCount}</span>
                      </span>
                    )}
                    {checklistsCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-muted-foreground shrink-0"
                        title={`${checklistsCount} subtask${
                          checklistsCount !== 1 ? "s" : ""
                        }`}
                      >
                        <ListIcon className="h-3.5 w-4" />
                        <span>{checklistsCount}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "strStatus",
        header: "Status",
        width: "150px",
        cell: (task: TaskListItem) => {
          const latestActivity =
            task.activity && task.activity.length > 0 ? task.activity[0] : null;
          const reason = latestActivity?.strDescription;
          const showReason =
            (task.strStatus === "Incomplete" || task.strStatus === "On Hold") &&
            reason;

          return (
            <div className="flex flex-col gap-1 min-w-0">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${getStatusColor(
                  task.strStatus
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {task.strStatus}
              </span>
              {showReason && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                  <span className="font-medium shrink-0">Reason:</span>
                  <span className={`min-w-0 ${getTextClass()}`} title={reason}>
                    {reason}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "dtDueDate",
        header: "Due Date",
        width: "150px",
        cell: (task: TaskListItem) => (
          <div className={getTextClass()}>
            {formatTaskDate(task.dtDueDate ?? null)}
          </div>
        ),
      },
      {
        key: "strAssignedTo",
        header: "Assigned To",
        width: "160px",
        cell: (task: TaskListItem) => {
          const { lines, remainingUsers, remainingUserNames } =
            buildAssignedToLines(task);

          if (lines.length === 0) {
            return (
              <div className={getTextClass()} title={getAssignedToLabel(task)}>
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
                    className={`flex items-center gap-2 ${getTextClass()}`}
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="min-w-0">{line.name}</span>
                  </div>
                );
              })}
              {remainingUsers > 0 && (
                <div
                  className="text-xs text-muted-foreground"
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
        width: "160px",
        cell: (task: TaskListItem) => (
          <div className={getTextClass()}>{task.strAssignedBy || "—"}</div>
        ),
      },
      {
        key: "strReviewedBy",
        header: "Reviewed By",
        width: "160px",
        cell: (task: TaskListItem) => (
          <div className={getTextClass()}>{task.strReviewedBy || "—"}</div>
        ),
      },
      {
        key: "hours",
        header: "Hours (Est / Actual)",
        width: "200px",
        cell: (task: TaskListItem) => {
          const activityCount =
            task.intActivitiesCount ?? task.activity?.length ?? 0;
          const hasActivity = activityCount > 0;
          const totalTime =
            task.strTotalTime && task.strTotalTime !== "00:00:00"
              ? task.strTotalTime
              : null;

          const estimatedTime = formatMinutesToHHMMSS(task.intEstimatedMinutes);
          const actualTime =
            totalTime || formatMinutesToHHMMSS(task.intActualMinutes);

          if (estimatedTime === "NA" && actualTime === "NA") {
            return <span className="text-muted-foreground text-xs">NA</span>;
          }

          const displayActualTime =
            estimatedTime !== "NA" && actualTime === "NA"
              ? "00:00:00"
              : actualTime;

          return (
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center gap-1.5">
                {estimatedTime !== "NA" ? (
                  <>
                    <span className="text-muted-foreground text-xs font-medium">
                      Est:
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border rounded-md text-xs font-medium text-foreground">
                      <Timer className="h-3 w-3 text-amber-500" />
                      {estimatedTime}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs">NA</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {displayActualTime !== "NA" &&
                displayActualTime !== "00:00:00" ? (
                  <>
                    <span className="text-muted-foreground text-xs font-medium">
                      Act:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border rounded-md text-xs font-medium text-foreground`}
                      title={
                        hasActivity
                          ? `Total time from ${activityCount} timer ${
                              activityCount === 1 ? "entry" : "entries"
                            }\nTotal: ${totalTime || "NA"}`
                          : undefined
                      }
                    >
                      <Timer className="h-3 w-3 text-amber-500" />
                      {displayActualTime}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground text-xs font-medium">
                      Act:
                    </span>
                    <span className="text-muted-foreground text-xs">NA</span>
                  </>
                )}
              </div>
            </div>
          );
        },
      },
    ];

    return baseColumns;
  }, [isTextWrapped]);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter.length) count++;
    if (priorityFilter.length) count++;
    if (assignedToFilter.length) count++;
    if (reviewedByFilter.length) count++;
    if (assignedByFilter.length) count++;
    if (privateFilter !== "all") count++;
    if (billableFilter !== "all") count++;
    if (reviewReqFilter !== "all") count++;
    return count;
  }, [
    statusFilter,
    priorityFilter,
    assignedToFilter,
    reviewedByFilter,
    assignedByFilter,
    privateFilter,
    billableFilter,
    reviewReqFilter,
  ]);

  const uniqueAssignedTo = useMemo(() => assignableUsers, [assignableUsers]);
  const uniqueReviewedBy = useMemo(() => assignableUsers, [assignableUsers]);

  const boards = useMemo(() => userBoardsData?.boards ?? [], [userBoardsData]);

  return (
    <CustomContainer>
      <WithPermission module={ModuleBase.ALL_TASKS} action={Actions.VIEW}>
        <PageHeader
          title="All Tasks"
          description="Browse and manage all tasks"
          icon={HeaderIcon}
          actions={null}
        />

        <div className="mt-6 space-y-4">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:flex-wrap">
              <SearchInput
                placeholder="Search by task title, description..."
                onSearchChange={setDebouncedSearch}
                className="w-full sm:max-w-md lg:flex-1"
              />

              <div className="w-full sm:w-auto lg:w-auto">
                <DateRangePicker
                  startDate={fromDate}
                  endDate={toDate}
                  onRangeChange={(start, end) => {
                    setFromDate(start);
                    setToDate(end);
                  }}
                  placeholder="Select task date range"
                />
              </div>

              <div className="w-full sm:w-full md:w-64 lg:w-64">
                <PreloadedSelect
                  options={boards.map((board) => ({
                    value: board.strBoardGUID,
                    label: board.strBoardName || "Unnamed Project",
                  }))}
                  selectedValue={
                    selectedBoardGUID === "all" ? "" : selectedBoardGUID
                  }
                  onChange={(value) => {
                    setSelectedBoardGUID(value || "all");
                  }}
                  placeholder={
                    isLoadingBoards ? "Loading projects..." : "Select Project"
                  }
                  noneLabel="Select Project"
                  allowNone
                  disabled={isLoadingBoards}
                  onOpenChange={setBoardDropdownOpen}
                  isLoading={isLoadingBoards}
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto lg:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1 justify-center h-10 text-xs sm:text-sm flex-1 sm:flex-initial"
                  size="sm"
                >
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

                <div className="h-10">
                  <DraggableColumnVisibility
                    columns={columns.filter(
                      (col) => col.header !== "" && col.header !== "Activity"
                    )}
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
                        "allTaskList_column_order",
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

          <div
            className={`transform transition-all duration-300 ease-in-out ${
              showFilters
                ? "opacity-100 max-h-250"
                : "opacity-0 max-h-0 overflow-hidden"
            }`}
          >
            <Card className="mt-2">
              <CardHeader>
                <CardTitle>Advanced Filters</CardTitle>
                <CardDescription>
                  Filter tasks by additional criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>
                    <MultiSelect
                      options={[
                        { value: "Completed", label: "Completed" },
                        { value: "Not Started", label: "Not Started" },
                        { value: "Started", label: "Started" },
                        { value: "On Hold", label: "On Hold" },
                        { value: "Incomplete", label: "Incomplete" },
                        { value: "For Review", label: "For Review" },
                        { value: "Reassign", label: "Reassign" },
                      ]}
                      selectedValues={statusFilter}
                      onChange={setStatusFilter}
                      placeholder="All Status"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Priority
                    </label>
                    <MultiSelect
                      options={[
                        { value: "High", label: "High" },
                        { value: "Medium", label: "Medium" },
                        { value: "Low", label: "Low" },
                        { value: "None", label: "None" },
                      ]}
                      selectedValues={priorityFilter}
                      onChange={setPriorityFilter}
                      placeholder="All Priorities"
                      renderOption={(option) => (
                        <span className="flex items-center gap-2">
                          <span
                            className={`h-3 w-3 rounded ${
                              PRIORITY_COLOR_CLASS[option.value]
                            }`}
                          />
                          {option.label}
                        </span>
                      )}
                      renderBadge={(option) => (
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`h-2.5 w-2.5 rounded ${
                              PRIORITY_COLOR_CLASS[option.value]
                            }`}
                          />
                          {option.label}
                        </span>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Billable
                    </label>
                    <Select
                      value={billableFilter}
                      onValueChange={(value) => setBillableFilter(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by billable" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Review Required
                    </label>
                    <Select
                      value={reviewReqFilter}
                      onValueChange={(value) => setReviewReqFilter(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by review" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Assigned To
                    </label>
                    <MultiSelect
                      options={uniqueAssignedTo.map((u) => ({
                        value: u.strUserGUID,
                        label: u.strName,
                      }))}
                      selectedValues={assignedToFilter}
                      onChange={setAssignedToFilter}
                      onOpenChange={setUserDropdownOpen}
                      placeholder="All Assignees"
                      isLoading={userDropdownOpen && isUsersLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Reviewed By
                    </label>
                    <MultiSelect
                      options={uniqueReviewedBy.map((u) => ({
                        value: u.strUserGUID,
                        label: u.strName,
                      }))}
                      selectedValues={reviewedByFilter}
                      onChange={setReviewedByFilter}
                      placeholder="All Reviewers"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Assigned By
                    </label>
                    <MultiSelect
                      options={assignableUsers.map((u) => ({
                        value: u.strUserGUID,
                        label: u.strName,
                      }))}
                      selectedValues={assignedByFilter}
                      onChange={setAssignedByFilter}
                      onOpenChange={setUserDropdownOpen}
                      placeholder="All Assigners"
                      isLoading={userDropdownOpen && isUsersLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Private
                    </label>
                    <Select
                      value={privateFilter}
                      onValueChange={(value) => {
                        setPrivateFilter(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by privacy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter([]);
                      setPriorityFilter([]);
                      setAssignedToFilter([]);
                      setReviewedByFilter([]);
                      setAssignedByFilter([]);
                      setPrivateFilter("all");
                      setSelectedBoardGUID("all");
                      setBillableFilter("all");
                      setReviewReqFilter("all");
                      setPagination({ pageNumber: 1 });
                    }}
                    disabled={
                      statusFilter.length === 0 &&
                      priorityFilter.length === 0 &&
                      assignedToFilter.length === 0 &&
                      reviewedByFilter.length === 0 &&
                      assignedByFilter.length === 0 &&
                      privateFilter === "all" &&
                      selectedBoardGUID === "all" &&
                      billableFilter === "all" &&
                      reviewReqFilter === "all"
                    }
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {tasksLoading ? (
            <TableSkeleton
              columns={[
                "Task",
                "Status",
                "Due Date",
                "Assigned To",
                "Assigned By",
                "Hours",
              ]}
              pageSize={pagination.pageSize}
            />
          ) : selectedBoardGUID === "all" ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Board Selected
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Please select a board from the dropdown above to view tasks.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              data={allTasks}
              columns={orderedColumns}
              keyExtractor={(task: TaskListItem) => task.strTaskGUID}
              loading={tasksLoading}
              columnVisibility={columnVisibility}
              alwaysVisibleColumns={getAlwaysVisibleColumns()}
              isTextWrapped={isTextWrapped}
              pinnedColumns={pinnedColumns}
              columnWidths={columnWidths}
              onColumnWidthsChange={(widths) => {
                setColumnWidths(widths);
                localStorage.setItem(
                  "allTaskList_column_widths",
                  JSON.stringify(widths)
                );
              }}
              emptyState={
                debouncedSearch ||
                statusFilter.length ||
                priorityFilter.length ? (
                  <>No tasks found matching your filters.</>
                ) : (
                  <>No tasks found.</>
                )
              }
              pagination={{
                pageNumber: pagination.pageNumber,
                pageSize: pagination.pageSize,
                totalCount: pagination.totalCount || 0,
                totalPages: pagination.totalPages || 0,
                onPageChange: goToPage,
                onPageSizeChange: handlePageSizeChange,
              }}
              maxHeight="calc(100vh - 420px)"
              pageSizeOptions={[10, 25, 50, 100]}
            />
          )}
        </div>

        <NotesDialog
          open={notesDialogOpen}
          onOpenChange={setNotesDialogOpen}
          title={selectedTaskNotes?.title || "Task Notes"}
          description={selectedTaskNotes?.description || ""}
          maxWidth="800px"
        />

        <TaskActivityModal
          open={activityDialogOpen}
          onOpenChange={setActivityDialogOpen}
          task={selectedTaskActivity}
        />

        <TaskModal
          open={showTaskModal}
          onOpenChange={setShowTaskModal}
          taskGUID={selectedTask?.strTaskGUID || ""}
          mode="edit"
          permissionModule={ModuleBase.ALL_TASKS}
          onSuccess={async () => {
            // Invalidate board-tasks queries
            await queryClient.invalidateQueries({
              queryKey: [...taskQueryKeys.all, "board-tasks"],
            });
          }}
          onDeleteSuccess={async () => {
            // Invalidate board-tasks queries
            await queryClient.invalidateQueries({
              queryKey: [...taskQueryKeys.all, "board-tasks"],
            });
          }}
        />
      </WithPermission>
    </CustomContainer>
  );
}
