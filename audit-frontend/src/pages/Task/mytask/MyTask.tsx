import React, { useCallback, useMemo, useState } from "react";
import {
  Activity,
  Filter,
  ListChecks,
  ListIcon,
  Lock,
  NotebookPen,
  Paperclip,
  Plus,
  Search,
  Ticket,
  Timer,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { MyTaskListItem, TaskListItem } from "@/types/task/task";

import { Actions, ModuleBase } from "@/lib/permissions";

import {
  getStatusColor,
  getTagColor,
  formatTaskDate,
  formatMinutesToHHMMSS,
  getPriorityColor,
} from "@/lib/task/task";

import { PRIORITY_COLOR_CLASS } from "@/constants/Task/task";

import noTasksUrl from "@/assets/task/no-tasks.svg";

import { useMenuIcon, useTableLayout } from "@/hooks/common";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useModuleUsers } from "@/hooks/api/central/use-users";
import { useMyTasks, taskQueryKeys } from "@/hooks/api/task/use-task";
import {
  useCompleteTaskTimer,
  useForReviewTaskTimer,
  useGetActiveSession,
  useIncompleteTaskTimer,
  useOnHoldTaskTimer,
  useResumeTaskTimer,
  useStartTaskTimer,
} from "@/hooks/api/task/use-task-timer";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/select/multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import { WithPermission } from "@/components/ui/with-permission";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { TaskCard } from "@/pages/Task/components/cards/TaskCard";
import { TaskActivityModal } from "@/pages/Task/components/task-modal/TaskActivityModal";
import { NotesDialog } from "@/pages/Task/components/task-modal/NotesDialog";
import { TaskModal } from "@/pages/Task/components/task-modal/TaskModal";

export default function MyTaskPage() {
  const HeaderIcon = useMenuIcon(ModuleBase.MY_TASK, ListChecks);
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [assignedByFilter, setAssignedByFilter] = useState<string[]>([]);
  const [boardFilter, setBoardFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedTaskNotes, setSelectedTaskNotes] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedTaskActivity, setSelectedTaskActivity] =
    useState<TaskListItem | null>(null);

  const { data: tasksResponse, isLoading: tasksLoading } = useMyTasks({
    pageNumber,
    pageSize,
    search: debouncedSearch,
    sortBy: "dtCreatedOn",
    ascending: false,
    strStatus: statusFilter.length > 0 ? statusFilter.join(",") : undefined,
    strPriority:
      priorityFilter.length > 0 ? priorityFilter.join(",") : undefined,
    strAssignByGUIDs:
      assignedByFilter.length > 0 ? assignedByFilter.join(",") : undefined,
  });

  const myTasks: MyTaskListItem[] = useMemo(() => {
    if (tasksResponse?.data && Array.isArray(tasksResponse.data)) {
      return tasksResponse.data;
    }
    return [];
  }, [tasksResponse]);

  const totalRecords = tasksResponse?.totalRecords || 0;
  const totalPages = tasksResponse?.totalPages || 0;

  const { data: moduleUsersData, isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    userDropdownOpen
  );

  const assignedByOptions = useMemo(() => {
    if (!moduleUsersData) return [];
    return moduleUsersData.map((user) => ({
      value: user.strUserGUID,
      label: user.strName,
    }));
  }, [moduleUsersData]);

  const { user } = useAuthContext();

  const sortedTasks = useMemo(() => {
    return [...myTasks].sort((a, b) => {
      if (!a.dtDueDate && !b.dtDueDate) return 0;
      if (!a.dtDueDate) return 1;
      if (!b.dtDueDate) return -1;
      return new Date(a.dtDueDate).getTime() - new Date(b.dtDueDate).getTime();
    });
  }, [myTasks]);

  const startTimer = useStartTaskTimer();
  const resumeTimer = useResumeTaskTimer();
  const onHoldTimer = useOnHoldTaskTimer();
  const completeTimer = useCompleteTaskTimer();
  const incompleteTimer = useIncompleteTaskTimer();
  const forReviewTimer = useForReviewTaskTimer();

  const {
    data: activeSessionData,
    isLoading: isActiveSessionLoading,
    isFetching: isActiveSessionFetching,
  } = useGetActiveSession();

  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  React.useEffect(() => {
    if (activeSessionData?.strTaskGUID) {
      setLastFetchTime(new Date());
    }
  }, [activeSessionData]);

  const parseTimeToMs = useCallback((timeStr: string): number => {
    if (!timeStr || timeStr === "00:00:00") return 0;
    const parts = timeStr.split(":");
    if (parts.length !== 3) return 0;
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }, []);

  const apiAccumulatedMs = useMemo(() => {
    if (activeSessionData?.strTotalTimeWorked) {
      return parseTimeToMs(activeSessionData.strTotalTimeWorked);
    }
    return 0;
  }, [activeSessionData, parseTimeToMs]);

  const [holdOpen, setHoldOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  const [holdTaskGUID, setHoldTaskGUID] = useState<string | null>(null);

  const [incompleteOpen, setIncompleteOpen] = useState(false);
  const [isPiPLoading, setIsPiPLoading] = useState(false);
  const [isPipPinned, setIsPipPinned] = useState(false);
  const [incompleteReason, setIncompleteReason] = useState("");
  const [incompleteTaskGUID, setIncompleteTaskGUID] = useState<string | null>(
    null
  );

  const openHoldModal = (taskGUID: string) => {
    setHoldTaskGUID(taskGUID);
    setHoldReason("");
    setHoldOpen(true);
  };

  const submitHold = async () => {
    if (!holdTaskGUID || !user?.strUserGUID) return;
    await onHoldTimer.mutateAsync({
      strTaskGUID: holdTaskGUID,
      strUserGUID: user!.strUserGUID,
      strHoldReason: holdReason,
    });
    setHoldOpen(false);
    // Close PiP window when task is put on hold
    const closePiPEvent = new CustomEvent("close-pip", {
      detail: { taskGUID: holdTaskGUID },
    });
    window.dispatchEvent(closePiPEvent);
  };

  const openIncompleteModal = (taskGUID: string) => {
    setIncompleteTaskGUID(taskGUID);
    setIncompleteReason("");
    setIncompleteOpen(true);
  };

  const submitIncomplete = async () => {
    if (!incompleteTaskGUID || !user?.strUserGUID) return;
    await incompleteTimer.mutateAsync({
      strTaskGUID: incompleteTaskGUID,
      strUserGUID: user!.strUserGUID,
      strIncompleteReason: incompleteReason,
    });
    setIncompleteOpen(false);
    // Close PiP window when task is marked incomplete
    const closePiPEvent = new CustomEvent("close-pip", {
      detail: { taskGUID: incompleteTaskGUID },
    });
    window.dispatchEvent(closePiPEvent);
  };

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeTaskGUID, setCompleteTaskGUID] = useState<string | null>(null);

  const openCompleteConfirm = useCallback((taskGUID: string) => {
    setCompleteTaskGUID(taskGUID);
    setCompleteOpen(true);
  }, []);

  React.useEffect(() => {
    if (showModal) {
      setCompleteTaskGUID(null);
      setForReviewTaskGUID(null);
    }
  }, [showModal]);

  const submitComplete = async () => {
    if (!completeTaskGUID || !user?.strUserGUID) return;
    await completeTimer.mutateAsync(
      {
        strTaskGUID: completeTaskGUID,
        strUserGUID: user!.strUserGUID,
      },
      {
        onSettled: () => {
          setCompleteOpen(false);
          setCompleteTaskGUID(null);
          const closePiPEvent = new CustomEvent("close-pip", {
            detail: { taskGUID: completeTaskGUID },
          });
          window.dispatchEvent(closePiPEvent);
        },
      }
    );
  };

  const [forReviewTaskGUID, setForReviewTaskGUID] = useState<string | null>(
    null
  );
  const [forReviewOpen, setForReviewOpen] = useState(false);
  const openForReviewConfirm = (taskGUID: string) => {
    setForReviewTaskGUID(taskGUID);
    setForReviewOpen(true);
  };

  const submitForReview = async () => {
    if (!forReviewTaskGUID || !user?.strUserGUID) return;
    await forReviewTimer.mutateAsync({
      strTaskGUID: forReviewTaskGUID,
      strUserGUID: user!.strUserGUID,
    });
    setForReviewOpen(false);
    setForReviewTaskGUID(null);
    const closePiPEvent = new CustomEvent("close-pip", {
      detail: { taskGUID: forReviewTaskGUID },
    });
    window.dispatchEvent(closePiPEvent);
  };

  const activeTasks = useMemo(() => {
    if (!activeSessionData || !activeSessionData.strTaskGUID) return [];

    const session = activeSessionData;

    const normalizeDate = (value?: string | null) =>
      value ? new Date(value).toISOString() : null;

    const task: TaskListItem = {
      strTaskGUID: session.strTaskGUID ?? "",
      strTaskNo: session.strTaskNo ?? 0,
      strBoardGUID: "",
      strBoardName: session.strBoardName ?? null,
      strBoardSectionGUID: "",
      strBoardSectionName: session.strBoardSectionName ?? null,
      strOrganizationGUID: "",
      strYearGUID: "",
      strTitle: session.strTitle ?? "",
      strTicketKey: session.strTicketKey ?? null,
      strTicketUrl: session.strTicketUrl ?? null,
      strTicketSource: session.strTicketSource ?? null,
      strDescription: session.strDescription ?? "",
      strStatus: session.strStatus ?? "Started",
      strPriority: session.strPriority ?? "Medium",
      intPercentage: 0,
      strAssignedToGUID: null,
      dtStartDate: normalizeDate(session.dtStartDate),
      dtDueDate: normalizeDate(session.dtDueDate),
      dtCompletedDate: null,
      dtReminderDate: null,
      strReminderTo: null,
      intEstimatedMinutes: null,
      intActualMinutes: null,
      strTags: session.strTags ?? "",
      bolIsPrivate: session.bolIsPrivate ?? false,
      bolIsReviewReq: session.bolIsReviewed ?? false,
      bolIsBillable: false,
      bolIsNotificationSend: false,
      strReviewedByGUID: session.bolIsReviewed ? "reviewer-assigned" : null,
      strReviewedBy: null,
      bolIsTimeTrackingReq: true,
      strAssignedByGUID: null,
      strAssignedTo: null,
      strAssignedBy: session.strAssignedBy ?? null,
      strCreatedByGUID: null,
      dtCreatedOn:
        normalizeDate(session.dtStartDate) ?? new Date().toISOString(),
      strUpdatedByGUID: null,
      dtUpdatedOn: null,
      recurrence: null,
      strFiles: [],
      strChecklists: [],
      activity: [],
      strTotalTime: session.strTotalTimeWorked,
    };

    return [task];
  }, [activeSessionData]);

  const otherTasks = useMemo(() => sortedTasks, [sortedTasks]);

  const isAnyTaskRunning = useCallback(() => {
    return (
      !!activeSessionData?.strTotalTimeWorked &&
      activeTasks.some((task) => task.strStatus === "Started")
    );
  }, [activeTasks, activeSessionData]);

  const handleStart = useCallback(
    async (taskGUID: string) => {
      if (!user?.strUserGUID) return;

      if (isAnyTaskRunning()) {
        toast.error("To start a new task, you must hold the current task.");
        return;
      }

      await startTimer.mutateAsync({ strTaskGUID: taskGUID });
    },
    [user, isAnyTaskRunning, startTimer]
  );

  const handleResume = useCallback(
    async (taskGUID: string) => {
      if (!user?.strUserGUID) return;

      if (isAnyTaskRunning()) {
        toast.error("For resume task you need to hold current task");
        return;
      }

      await resumeTimer.mutateAsync({ strTaskGUID: taskGUID });
    },
    [user, isAnyTaskRunning, resumeTimer]
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageNumber(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    const handlePiPLoadingState = (event: Event) => {
      const customEvent = event as CustomEvent<{ isLoading: boolean }>;
      setIsPiPLoading(customEvent.detail.isLoading);
    };

    const handlePiPClosed = () => {
      setIsPipPinned(false);
    };

    window.addEventListener("pip-loading-state", handlePiPLoadingState);
    window.addEventListener("pip-closed", handlePiPClosed);
    return () => {
      window.removeEventListener("pip-loading-state", handlePiPLoadingState);
      window.removeEventListener("pip-closed", handlePiPClosed);
    };
  }, []);

  React.useEffect(() => {
    setPageNumber(1);
  }, [statusFilter, priorityFilter, assignedByFilter]);

  const handleSearchClear = () => {
    setSearch("");
  };

  const goToPage = (page: number) => {
    setPageNumber(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageNumber(1);
  };

  const defaultColumnOrder = [
    "strTitle",
    "strStatus",
    "dtDueDate",
    "strAssignedBy",
    "hours",
    "activity",
    "start",
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
  } = useTableLayout("myTaskList", defaultColumnOrder, []);

  const columns = useMemo(() => {
    const getTextClass = () =>
      isTextWrapped
        ? "whitespace-normal wrap-break-word"
        : "whitespace-nowrap overflow-hidden text-ellipsis";

    const baseColumns: DataTableColumn<MyTaskListItem>[] = [
      {
        key: "strTitle",
        header: "Task",
        width: "350px",
        cell: (task: MyTaskListItem) => {
          const filesCount = task.intFilesCount ?? task.strFiles?.length ?? 0;
          const checklistsCount =
            task.intChecklistsCount ?? task.strChecklists?.length ?? 0;

          return (
            <div className="flex items-stretch gap-2 min-w-0">
              <span
                className="w-1 rounded-full shrink-0"
                style={{
                  backgroundColor: getPriorityColor(task.strPriority),
                }}
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
                      setShowModal(true);
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
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                    <span className="font-medium shrink-0">
                      #{task.strTaskNo || ""} |
                    </span>
                    {task.dtStartDate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                        <span className="font-medium shrink-0">Start:</span>
                        <span className={`min-w-0 ${getTextClass()}`}>
                          {formatTaskDate(task.dtStartDate)}
                        </span>
                      </div>
                    )}
                  </div>
                  {task.strBoardName && (
                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground min-w-0">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-medium shrink-0">Project:</span>
                        <span className={`min-w-0 ${getTextClass()}`}>
                          {task.strBoardName}
                        </span>
                      </div>
                      {task.strBoardSectionName && (
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-medium shrink-0">Module:</span>
                          <span className={`min-w-0 ${getTextClass()}`}>
                            {task.strBoardSectionName}
                          </span>
                        </div>
                      )}
                      {task.strSubModuleName && (
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-medium shrink-0">
                            Submodule:
                          </span>
                          <span className={`min-w-0 ${getTextClass()}`}>
                            {task.strSubModuleName}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {!task.strBoardName && task.strBoardSectionName && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                      <span className="font-medium shrink-0">Module:</span>
                      <span className={`min-w-0 ${getTextClass()}`}>
                        {task.strBoardSectionName}
                      </span>
                    </div>
                  )}
                  {!task.strBoardName && task.strSubModuleName && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                      <span className="font-medium shrink-0">Submodule:</span>
                      <span className={`min-w-0 ${getTextClass()}`}>
                        {task.strSubModuleName}
                      </span>
                    </div>
                  )}
                  {(task.strTicketSource || task.strTicketKey) && (
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 shrink-0" />
                      <span className="font-medium text-foreground shrink-0 text-xs">
                        {task.strTicketSource || ""}:
                      </span>
                      {task.strTicketUrl ? (
                        <a
                          href={task.strTicketUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`${getTextClass()} text-primary hover:underline font-medium truncate text-xs`}
                          onClick={(e) => e.stopPropagation()}
                          title={task.strTicketKey || task.strTicketUrl}
                        >
                          {task.strTicketKey || ""}
                        </a>
                      ) : (
                        <span className={`${getTextClass()} text-xs`}>
                          {task.strTicketKey || ""}
                        </span>
                      )}
                    </div>
                  )}
                  {task.strTicketUrl &&
                    !(task.strTicketSource || task.strTicketKey) && (
                      <div className="flex items-center gap-1">
                        <Ticket className="w-4 h-4 shrink-0" />
                        <a
                          href={task.strTicketUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`${getTextClass()} text-primary text-xs truncate`}
                          onClick={(e) => e.stopPropagation()}
                          title={task.strTicketUrl}
                        >
                          {task.strTicketUrl}
                        </a>
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
                        title={`${checklistsCount} subtask${checklistsCount !== 1 ? "s" : ""}`}
                      >
                        <ListIcon className="h-3.5 w-4" />
                        <span>{checklistsCount}</span>
                      </span>
                    )}
                  </div>
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
        cell: (task: MyTaskListItem) => {
          const completionStatus =
            task.strMyCompletionStatus ?? task.strStatus ?? "";

          if (!completionStatus) {
            return <span className="text-muted-foreground">—</span>;
          }

          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                completionStatus
              )}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {completionStatus}
            </span>
          );
        },
      },
      {
        key: "dtDueDate",
        header: "Due Date",
        width: "150px",
        cell: (task: MyTaskListItem) => (
          <div className={getTextClass()}>
            {formatTaskDate(task.dtDueDate ?? null)}
          </div>
        ),
      },
      {
        key: "strAssignedBy",
        header: "Assigned By",
        width: "150px",
        cell: (task: MyTaskListItem) => (
          <div className={getTextClass()}>{task.strAssignedBy || "—"}</div>
        ),
      },
      {
        key: "hours",
        header: "Hours (Est / Actual)",
        width: "180px",
        cell: (task: MyTaskListItem) => {
          const activityCount =
            task.intActivitiesCount ?? task.activity?.length ?? 0;
          const hasActivity = activityCount > 0;
          const actualFromString = (() => {
            const value = task.strActualMinutes?.trim();
            if (!value) return null;
            if (value.includes(":")) return value;
            const parsed = Number(value);
            if (!Number.isFinite(parsed)) return null;
            const formatted = formatMinutesToHHMMSS(parsed);
            return formatted === "NA" ? null : formatted;
          })();

          const estimatedTime = formatMinutesToHHMMSS(task.intEstimatedMinutes);
          const hasEstimatedTime =
            estimatedTime !== "NA" && estimatedTime !== "00:00:00";

          const actualTime = actualFromString ?? "NA";

          const bothAreZeroOrNA =
            (estimatedTime === "00:00:00" || estimatedTime === "NA") &&
            (actualTime === "00:00:00" || actualTime === "NA");

          if (bothAreZeroOrNA) {
            return (
              <div className="flex items-center">
                <span className="text-muted-foreground text-xs">NA</span>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center gap-1.5">
                {hasEstimatedTime ? (
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
                  <span className="text-muted-foreground text-sm">NA</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {hasEstimatedTime ||
                (actualTime !== "NA" && actualTime !== "00:00:00") ? (
                  <>
                    <span className="text-muted-foreground text-xs font-medium">
                      Act:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border-color rounded-md text-xs font-medium text-foreground`}
                      title={
                        hasActivity
                          ? `Total time from ${activityCount} timer ${
                              activityCount === 1 ? "entry" : "entries"
                            }`
                          : undefined
                      }
                    >
                      <Timer className="h-3 w-3 text-amber-500" />
                      {actualTime}
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
      {
        key: "activity",
        header: "Activity",
        width: "80px",
        cell: (task: MyTaskListItem) => {
          const activityCount =
            task.intActivitiesCount ?? task.activity?.length ?? 0;
          const hasActivity = activityCount > 0;

          if (!hasActivity) {
            return null;
          }

          return (
            <div className="flex items-center justify-center">
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTaskActivity(task);
                  setActivityDialogOpen(true);
                }}
                title={`View ${activityCount} activity ${
                  activityCount === 1 ? "entry" : "entries"
                }`}
              >
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium">{activityCount}</span>
              </Button>
            </div>
          );
        },
      },
      {
        key: "start",
        header: "Action",
        width: "130px",
        cell: (task: MyTaskListItem) => {
          const completionStatus =
            task.strMyCompletionStatus ?? task.strStatus ?? "";

          return (
            <div className="flex items-center justify-start">
              {completionStatus === "Not Started" &&
                task.bolIsTimeTrackingReq && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStart(task.strTaskGUID);
                    }}
                    disabled={startTimer.isPending}
                  >
                    Start
                  </Button>
                )}
              {completionStatus === "Started" && task.bolIsTimeTrackingReq && (
                <Button
                  size="sm"
                  variant="default"
                  disabled
                  title="Task is currently running"
                >
                  Started
                </Button>
              )}
              {completionStatus === "Not Started" &&
                !task.bolIsTimeTrackingReq &&
                (task.strReviewedByGUID ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      openForReviewConfirm(task.strTaskGUID);
                    }}
                    disabled={forReviewTimer.isPending}
                  >
                    For Review
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCompleteConfirm(task.strTaskGUID);
                    }}
                    disabled={completeTimer.isPending}
                  >
                    Complete
                  </Button>
                ))}
              {completionStatus === "On Hold" && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResume(task.strTaskGUID);
                  }}
                  disabled={resumeTimer.isPending}
                >
                  Resume
                </Button>
              )}
              {completionStatus === "Reassign" && task.bolIsTimeTrackingReq && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStart(task.strTaskGUID);
                  }}
                  disabled={startTimer.isPending}
                >
                  Start Again
                </Button>
              )}
              {completionStatus === "Reassign" &&
                !task.bolIsTimeTrackingReq &&
                (task.strReviewedByGUID ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      openForReviewConfirm(task.strTaskGUID);
                    }}
                    disabled={forReviewTimer.isPending}
                  >
                    For Review
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCompleteConfirm(task.strTaskGUID);
                    }}
                    disabled={completeTimer.isPending}
                  >
                    Complete
                  </Button>
                ))}
            </div>
          );
        },
      },
    ];

    return baseColumns;
  }, [
    isTextWrapped,
    handleStart,
    handleResume,
    openCompleteConfirm,
    startTimer.isPending,
    resumeTimer.isPending,
    completeTimer.isPending,
    forReviewTimer.isPending,
  ]);

  // Apply column ordering
  const orderedColumns = useMemo(() => {
    if (!columns || columns.length === 0) return columns;

    return [...columns].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.key);
      const bIndex = columnOrder.indexOf(b.key);

      // If a column is not in columnOrder, put it at the end
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <WithPermission module={ModuleBase.MY_TASK} action={Actions.VIEW}>
        <PageHeader
          title="My Tasks"
          description="View and manage your assigned tasks"
          icon={HeaderIcon}
          actions={
            <WithPermission module={ModuleBase.MY_TASK} action={Actions.SAVE}>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Task
              </Button>
            </WithPermission>
          }
        />

        <div className="mt-6 space-y-4">
          {isActiveSessionLoading ||
          isActiveSessionFetching ||
          (activeSessionData?.strTaskGUID && tasksLoading) ? (
            <div className="space-y-4  rounded-lg">
              <div className="bg-secondary border border-border-color rounded-lg">
                <div className="p-3 font-semibold text-foreground    text-sm flex items-center gap-2">
                  Current Task Information
                </div>
                <div className="p-3">
                  <Card className="bg-card border border-border-color">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-48" />

                          <div className="flex items-center gap-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>

                          <Skeleton className="h-4 w-36" />
                        </div>

                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-20" />

                          <Skeleton className="h-9 w-24 rounded-md" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  My Tasks (—)
                </h2>
              </div>

              <TableSkeleton
                columns={[
                  "Task",
                  "Status",
                  "Due Date",
                  "Assigned By",
                  "Hours",
                  "",
                ]}
                pageSize={pageSize}
              />
            </div>
          ) : !tasksLoading &&
            activeTasks.length === 0 &&
            totalRecords === 0 &&
            !search &&
            statusFilter.length === 0 &&
            priorityFilter.length === 0 &&
            assignedByFilter.length === 0 ? (
            <div className="h-[calc(100vh-270px)] flex flex-col">
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <img
                  src={noTasksUrl}
                  alt="No tasks"
                  className="mb-10 opacity-90"
                />
                <div className="text-xl font-semibold text-foreground">
                  You're all caught up
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  No tasks assigned to you right now. Enjoy the calm or check
                  back later.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-secondary rounded-md">
                <div className="p-3 font-semibold text-sm text-foreground flex items-center gap-2">
                  Current Task Information
                </div>
                <div className="p-3 space-y-2">
                  {activeTasks.length > 0 ? (
                    activeTasks.map((task) => (
                      <div
                        key={`active-${task.strTaskGUID}`}
                        className="flex items-center gap-2"
                      >
                        <div className="flex-1">
                          <TaskCard
                            task={task}
                            variant="compact"
                            showAssignee={false}
                            showDates={true}
                            showPriority={true}
                            showProgress={false}
                            showTags={true}
                            showStartButton={false}
                            onClick={(t) => {
                              setSelectedTask(t);
                              setShowModal(true);
                            }}
                            className={"cursor-pointer"}
                            activeTimerStartIso={
                              task.strStatus === "Started" && lastFetchTime
                                ? lastFetchTime.toISOString()
                                : null
                            }
                            accumulatedMs={apiAccumulatedMs}
                            showTimer={true}
                            onPiPClick={() => {
                              const pipEvent = new CustomEvent("open-pip", {
                                detail: task,
                              });
                              window.dispatchEvent(pipEvent);
                            }}
                            isPiPLoading={isPiPLoading}
                            isPipPinned={isPipPinned}
                            onPinToggle={() => setIsPipPinned(!isPipPinned)}
                            actions={[
                              {
                                label: "On Hold",
                                onClick: () => openHoldModal(task.strTaskGUID),
                                colorClass: "bg-yellow-500",
                              },
                              {
                                label: "Incomplete",
                                onClick: () =>
                                  openIncompleteModal(task.strTaskGUID),
                                colorClass: "bg-gray-500",
                              },
                              ...(task.bolIsReviewReq &&
                              task.strReviewedByGUID &&
                              !task.bolIsPrivate
                                ? [
                                    {
                                      label: "For Review",
                                      onClick: () =>
                                        openForReviewConfirm(task.strTaskGUID),
                                      colorClass: "bg-red-500",
                                    },
                                  ]
                                : [
                                    {
                                      label: "Completed",
                                      onClick: () =>
                                        openCompleteConfirm(task.strTaskGUID),
                                      colorClass: "bg-green-500",
                                    },
                                  ]),
                            ]}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 px-4">
                      <p className="text-sm font-medium text-foreground">
                        No active task
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start a task from the table below to begin tracking
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  My Tasks ({totalRecords})
                </h2>
              </div>

              <div className="mb-4 flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative max-w-full sm:max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Search by task title, description..."
                      className="pl-9 w-full h-10"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={handleSearchClear}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <span className="sr-only">Clear search</span>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-row sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-1 justify-center h-9 text-xs sm:text-sm"
                      size="sm"
                    >
                      <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                      <span>Filters</span>
                    </Button>

                    <div className="h-10">
                      <DraggableColumnVisibility
                        columns={columns.filter((col) => col.header !== "")}
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
                            "myTaskList_column_order",
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
                <Card className="mt-2 mb-4">
                  <CardHeader>
                    <CardTitle>Advanced Filters</CardTitle>
                    <CardDescription>
                      Filter tasks by additional criteria
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Status
                        </label>
                        <MultiSelect
                          options={[
                            { value: "Not Started", label: "Not Started" },
                            { value: "Started", label: "Started" },
                            { value: "On Hold", label: "On Hold" },
                            { value: "Completed", label: "Completed" },
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
                          Assigned By
                        </label>
                        <MultiSelect
                          options={assignedByOptions}
                          selectedValues={assignedByFilter}
                          onChange={setAssignedByFilter}
                          onOpenChange={setUserDropdownOpen}
                          placeholder="All Users"
                          isLoading={userDropdownOpen && isUsersLoading}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStatusFilter([]);
                          setPriorityFilter([]);
                          setAssignedByFilter([]);
                          setBoardFilter([]);
                        }}
                        disabled={
                          statusFilter.length === 0 &&
                          priorityFilter.length === 0 &&
                          assignedByFilter.length === 0 &&
                          boardFilter.length === 0
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
                    "Ticket",
                    "Due Date",
                    "Assigned By",
                    "Hours (Est / Actual)",
                    "Activity",
                    "",
                  ]}
                  pageSize={pageSize}
                />
              ) : (
                <DataTable
                  data={otherTasks}
                  columns={orderedColumns}
                  keyExtractor={(task: MyTaskListItem) => task.strTaskGUID}
                  loading={tasksLoading}
                  columnVisibility={columnVisibility}
                  alwaysVisibleColumns={getAlwaysVisibleColumns()}
                  isTextWrapped={isTextWrapped}
                  pinnedColumns={pinnedColumns}
                  columnWidths={columnWidths}
                  onColumnWidthsChange={(widths) => {
                    setColumnWidths(widths);
                    localStorage.setItem(
                      "myTaskList_column_widths",
                      JSON.stringify(widths)
                    );
                  }}
                  emptyState={
                    search ||
                    statusFilter.length > 0 ||
                    priorityFilter.length > 0 ||
                    assignedByFilter.length > 0 ? (
                      <>No tasks found matching your filters.</>
                    ) : (
                      <>No tasks found. Tasks will appear here once assigned.</>
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
                  maxHeight="calc(100vh - 400px)"
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              )}
            </>
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
          open={showModal}
          onOpenChange={setShowModal}
          taskGUID={selectedTask?.strTaskGUID || ""}
          mode="edit"
          permissionModule={ModuleBase.MY_TASK}
          onSuccess={async () => {
            await queryClient.invalidateQueries({
              queryKey: [...taskQueryKeys.all, "my-tasks"],
            });
          }}
          onDeleteSuccess={async () => {
            await queryClient.invalidateQueries({
              queryKey: [...taskQueryKeys.all, "my-tasks"],
            });
          }}
        />

        <TaskModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          mode="create"
          permissionModule={ModuleBase.MY_TASK}
          onSuccess={async () => {
            await queryClient.invalidateQueries({
              queryKey: [...taskQueryKeys.all, "my-tasks"],
            });
          }}
        />

        <ConfirmationDialog
          open={holdOpen}
          onOpenChange={setHoldOpen}
          onConfirm={submitHold}
          showReasonInput={true}
          reason={holdReason}
          onReasonChange={setHoldReason}
          variant="hold"
          title="Put task on hold"
          description="Provide a reason. Timer will stop and time will be recorded."
          reasonLabel="Reason"
          reasonPlaceholder="Describe why you're pausing this..."
          reasonRequired={true}
          isLoading={onHoldTimer.isPending}
          loadingText="Submitting..."
        />

        <ConfirmationDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          onConfirm={submitComplete}
          title="Mark task as Completed"
          description="Are you sure you want to mark this task as Completed? This action cannot be undone."
          confirmLabel="Yes, Complete"
          variant="success"
          isLoading={completeTimer.isPending}
          loadingText="Completing..."
        />
        <ConfirmationDialog
          open={forReviewOpen}
          onOpenChange={(open) => {
            setForReviewOpen(open);
            if (!open) {
              setForReviewTaskGUID(null);
            }
          }}
          onConfirm={submitForReview}
          title="Submit task for Review"
          description="Are you sure you want to submit this task for review? This action cannot be undone."
          confirmLabel="Yes, Submit for Review"
          variant="info"
          isLoading={forReviewTimer.isPending}
          loadingText="Submitting..."
        />
        <ConfirmationDialog
          open={incompleteOpen}
          onOpenChange={setIncompleteOpen}
          onConfirm={submitIncomplete}
          showReasonInput={true}
          reason={incompleteReason}
          onReasonChange={setIncompleteReason}
          variant="incomplete"
          title="Mark task as Incomplete"
          description="Provide a reason. Timer will stop and time will be recorded."
          reasonLabel="Reason"
          reasonPlaceholder="Describe why you're marking this incomplete..."
          reasonRequired={true}
          isLoading={incompleteTimer.isPending}
          loadingText="Submitting..."
        />
      </WithPermission>
    </CustomContainer>
  );
}
