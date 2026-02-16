import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  ListIcon,
  NotebookPen,
  Paperclip,
  Plus,
  Timer,
  User,
  UserPen,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type { AssignedByMeTaskListItem } from "@/types/task/task";

import { Actions, ModuleBase } from "@/lib/permissions";

import {
  getStatusColor,
  getTagColor,
  formatTaskDate,
  getPriorityColor,
} from "@/lib/task/task";

import { PRIORITY_COLOR_CLASS } from "@/constants/Task/task";

import {
  useListPreferences,
  useMenuIcon,
  useTableLayout,
} from "@/hooks/common";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useModuleUsers } from "@/hooks";
import {
  useAssignedByMeTasks,
  assignTaskQueryKeys,
} from "@/hooks/api/task/use-assign-task";
import { useBoardsByUser } from "@/hooks/api/task/use-board-team";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/select/multi-select";
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
import { SearchInput } from "@/components/shared/search-input";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { NotesDialog } from "@/pages/Task/components/task-modal/NotesDialog";
import { TaskModal } from "@/pages/Task/components/task-modal/TaskModal";

export default function AssignTask() {
  const queryClient = useQueryClient();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const HeaderIcon = useMenuIcon(ModuleBase.ASSIGN_TASK, UserPen);

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    ModuleBase.ASSIGN_TASK,
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "dtCreatedOn",
        direction: "desc",
      },
    }
  );

  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [assignedToFilter, setAssignedToFilter] = useState<string[]>([]);
  const [reviewedByFilter, setReviewedByFilter] = useState<string[]>([]);
  const [privateFilter, setPrivateFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [boardFilter, setBoardFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskGUID, setEditingTaskGUID] = useState<string | null>(null);

  const { data: moduleUsersData = [], isLoading: isUsersLoading } =
    useModuleUsers(undefined, undefined, userDropdownOpen);

  const { user } = useAuthContext();

  const { data: userBoardsData } = useBoardsByUser(
    user?.strUserGUID,
    boardDropdownOpen
  );

  const boardOptions = useMemo(() => {
    if (!userBoardsData?.boards) return [];
    return userBoardsData.boards.map((board) => ({
      value: board.strBoardGUID,
      label: board.strBoardName || "Unnamed project",
    }));
  }, [userBoardsData]);

  const availableUsers = useMemo(() => {
    return moduleUsersData;
  }, [moduleUsersData]);

  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedTaskNotes, setSelectedTaskNotes] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const assignedTasksParams = useMemo(
    () => ({
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      sortBy: sorting.columnKey || undefined,
      ascending: sorting.direction === "asc",
      search: debouncedSearch,
      strStatus: statusFilter.length > 0 ? statusFilter.join(",") : undefined,
      strPriority:
        priorityFilter.length > 0 ? priorityFilter.join(",") : undefined,
      strAssignedToGUIDs:
        assignedToFilter.length > 0 ? assignedToFilter.join(",") : undefined,
      strReviewedByGUIDs:
        reviewedByFilter.length > 0 ? reviewedByFilter.join(",") : undefined,
      bolIsPrivate:
        privateFilter === "all"
          ? undefined
          : privateFilter === "yes"
            ? true
            : false,
      strBoardGUIDs: boardFilter.length > 0 ? boardFilter.join(",") : undefined,
    }),
    [
      pagination.pageNumber,
      pagination.pageSize,
      sorting.columnKey,
      sorting.direction,
      debouncedSearch,
      statusFilter,
      priorityFilter,
      assignedToFilter,
      reviewedByFilter,
      privateFilter,
      boardFilter,
    ]
  );

  const { data: assignedByMeResponse, isLoading: loadingAssigned } =
    useAssignedByMeTasks(assignedTasksParams);

  useEffect(() => {
    if (assignedByMeResponse) {
      setPagination({
        pageNumber: assignedByMeResponse.pageNumber,
        pageSize: assignedByMeResponse.pageSize,
        totalCount: assignedByMeResponse.totalRecords,
        totalPages: assignedByMeResponse.totalPages,
      });
    }
  }, [assignedByMeResponse, setPagination]);

  const displayTasks = useMemo(() => {
    // All filtering is now done server-side
    return assignedByMeResponse?.data || [];
  }, [assignedByMeResponse?.data]);

  const defaultColumnOrder = [
    "strTitle",
    "strStatus",
    "assignedTo",
    "dtStartDate",
    "dtDueDate",
    "dtCompletedDate",
    "hours",
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
  } = useTableLayout(`assignTaskList`, defaultColumnOrder, []);

  const handleResetFilters = () => {
    setDebouncedSearch("");
    setStatusFilter([]);
    setPriorityFilter([]);
    setAssignedToFilter([]);
    setReviewedByFilter([]);
    setPrivateFilter("all");
    setBoardFilter([]);
    setPagination({ pageNumber: 1 });
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
    setPagination({ pageNumber: 1 });
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

  const handleEditTask = (task: AssignedByMeTaskListItem) => {
    setEditingTaskGUID(task.strTaskGUID);
  };

  const handleOpenTaskModal = () => {
    setShowTaskModal(true);
  };

  const columns = useMemo(() => {
    const getTextClass = () =>
      isTextWrapped
        ? "whitespace-normal wrap-break-word"
        : "whitespace-nowrap overflow-hidden text-ellipsis";

    const getAssignedToLabel = (task: AssignedByMeTaskListItem) => {
      if (!task.assignments || task.assignments.length === 0) return "-";

      const labels = task.assignments
        .map(
          (assignment) =>
            assignment.strAssignToName || assignment.strAssignToGUID
        )
        .filter(Boolean);

      return labels.length > 0 ? labels.join(", ") : "-";
    };

    const buildAssignedToLines = (task: AssignedByMeTaskListItem) => {
      if (!task.assignments || task.assignments.length === 0) {
        return { lines: [], remainingUsers: 0, remainingUserNames: [] };
      }

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

      const remainingUsers = remainingUserNames.length;

      return { lines, remainingUsers, remainingUserNames };
    };

    const baseColumns: DataTableColumn<AssignedByMeTaskListItem>[] = [];

    baseColumns.push(
      {
        key: "strTitle",
        header: "Task",
        width: "480px",
        cell: (task: AssignedByMeTaskListItem) => (
          <div className="flex items-stretch gap-2 min-w-0">
            <span
              className="w-1 rounded-full shrink-0"
              style={{
                backgroundColor: getPriorityColor(task.strPriority),
              }}
              title={`Priority: ${task.strPriority || "None"}`}
            />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`font-medium cursor-pointer hover:text-primary hover:underline transition-colors block min-w-0 ${getTextClass()}`}
                  title={task.strTitle}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTask(task);
                  }}
                >
                  {task.strTitle}
                </span>
                {task.strDescription && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTaskNotes({
                        title: task.strTitle,
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
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground min-w-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                  <span className="font-medium shrink-0">
                    #{task.strTaskNo || "-"}
                  </span>
                </div>
                {task.strBoardName && (
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="min-w-0">
                      <span className="font-medium shrink-0">Project:</span>{" "}
                      <span className={`min-w-0 ${getTextClass()}`}>
                        {task.strBoardName}
                      </span>
                    </span>
                    {task.strBoardSectionName && (
                      <span className="min-w-0">
                        <span className="font-medium shrink-0">Module:</span>{" "}
                        <span className={`min-w-0 ${getTextClass()}`}>
                          {task.strBoardSectionName}
                        </span>
                      </span>
                    )}
                    {task.strSubModuleName && (
                      <span className="min-w-0">
                        <span className="font-medium shrink-0">Submodule:</span>{" "}
                        <span className={`min-w-0 ${getTextClass()}`}>
                          {task.strSubModuleName}
                        </span>
                      </span>
                    )}
                  </div>
                )}
                {!task.strBoardName && task.strBoardSectionName && (
                  <span className="min-w-0">
                    <span className="font-medium shrink-0">Module:</span>{" "}
                    <span className={`min-w-0 ${getTextClass()}`}>
                      {task.strBoardSectionName}
                    </span>
                  </span>
                )}
                {!task.strBoardName && task.strSubModuleName && (
                  <span className="min-w-0">
                    <span className="font-medium shrink-0">Submodule:</span>{" "}
                    <span className={`min-w-0 ${getTextClass()}`}>
                      {task.strSubModuleName}
                    </span>
                  </span>
                )}
                {(task.strTicketSource || task.strTicketKey) && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                    <span className="font-medium text-foreground shrink-0">
                      {task.strTicketSource || "—"}:
                    </span>
                    <span className={`${getTextClass()}`}>
                      {task.strTicketKey || "—"}
                    </span>
                  </div>
                )}
                {task.strTags && task.strTags.trim() && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium shrink-0">Tags:</span>
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                      {task.strTags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .map((tag, index) => {
                          const tagColor = getTagColor(tag);
                          return (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 min-w-0"
                              title={tag}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: tagColor }}
                              />
                              <span className={`min-w-0 ${getTextClass()}`}>
                                {tag}
                              </span>
                            </span>
                          );
                        })}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1.5 min-w-0">
                  {task.intFilesCount > 0 && (
                    <span
                      className="inline-flex items-center gap-1 text-muted-foreground shrink-0"
                      title={`${task.intFilesCount} upload${
                        task.intFilesCount !== 1 ? "s" : ""
                      }`}
                    >
                      <Paperclip className="h-3.5 w-4" />
                      <span>{task.intFilesCount}</span>
                    </span>
                  )}
                  {task.intChecklistsCount > 0 && (
                    <span
                      className="inline-flex items-center gap-1 text-muted-foreground shrink-0"
                      title={`${task.intChecklistsCount} subtask${
                        task.intChecklistsCount !== 1 ? "s" : ""
                      }`}
                    >
                      <ListIcon className="h-3.5 w-4" />
                      <span>{task.intChecklistsCount}</span>
                    </span>
                  )}
                </div>
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
        cell: (task: AssignedByMeTaskListItem) => {
          const colorClass = getStatusColor(task.strStatus);
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
            >
              {task.strStatus}
            </span>
          );
        },
        sortable: true,
      },
      {
        key: "assignedTo",
        header: "Assigned To",
        width: "180px",
        cell: (task: AssignedByMeTaskListItem) => {
          const { lines, remainingUsers, remainingUserNames } =
            buildAssignedToLines(task);

          if (lines.length === 0) {
            return (
              <div className={getTextClass()} title={getAssignedToLabel(task)}>
                -
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
        sortable: false,
      },
      {
        key: "dtStartDate",
        header: "Start Date",
        width: "130px",
        cell: (task: AssignedByMeTaskListItem) => (
          <div
            className={getTextClass()}
            title={task.dtStartDate ? formatTaskDate(task.dtStartDate) : "-"}
          >
            {task.dtStartDate ? formatTaskDate(task.dtStartDate) : "-"}
          </div>
        ),
        sortable: false,
      },
      {
        key: "dtDueDate",
        header: "Due Date",
        width: "130px",
        cell: (task: AssignedByMeTaskListItem) => (
          <div
            className={getTextClass()}
            title={task.dtDueDate ? formatTaskDate(task.dtDueDate) : "-"}
          >
            {task.dtDueDate ? formatTaskDate(task.dtDueDate) : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtCompletedDate",
        header: "Completed Date",
        width: "170px",
        cell: (task: AssignedByMeTaskListItem) => (
          <div
            className={getTextClass()}
            title={
              task.dtCompletedDate ? formatTaskDate(task.dtCompletedDate) : "-"
            }
          >
            {task.dtCompletedDate ? formatTaskDate(task.dtCompletedDate) : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "hours",
        header: "Hours (Est / Actual)",
        width: "200px",
        cell: (task: AssignedByMeTaskListItem) => {
          const estimatedMinutes = task.intEstimatedMinutes ?? 0;

          // Format estimated time as HH:MM:SS from minutes
          const formatEstimatedTime = (minutes: number): string => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
              2,
              "0"
            )}:00`;
          };

          const estimatedTime = formatEstimatedTime(estimatedMinutes);
          // Use strTotalTime directly from backend (already in HH:MM:SS format)
          const actualTime = task.strTotalTime || "00:00:00";

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
                {actualTime !== "00:00:00" ? (
                  <>
                    <span className="text-muted-foreground text-xs font-medium">
                      Act:
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border rounded-md text-xs font-medium text-foreground">
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
        sortable: false,
      }
    );

    return baseColumns;
  }, [isTextWrapped]);

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
    if (statusFilter.length > 0) count++;
    if (priorityFilter.length > 0) count++;
    if (assignedToFilter.length > 0) count++;
    if (reviewedByFilter.length > 0) count++;
    if (privateFilter !== "all") count++;
    if (boardFilter.length > 0) count++;
    return count;
  }, [
    statusFilter,
    priorityFilter,
    assignedToFilter,
    reviewedByFilter,
    privateFilter,
    boardFilter,
  ]);

  const uniqueAssignedToOptions = useMemo(() => {
    return availableUsers
      .map((u) => ({
        value: u.strUserGUID,
        label: u.strName,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availableUsers]);

  const uniqueReviewedByOptions = useMemo(() => {
    return availableUsers
      .map((u) => ({
        value: u.strUserGUID,
        label: u.strName,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availableUsers]);

  return (
    <CustomContainer>
      <PageHeader
        title="Assign Task"
        description="View and manage tasks assigned by you"
        icon={HeaderIcon}
        actions={
          <WithPermission module={ModuleBase.ASSIGN_TASK} action={Actions.SAVE}>
            <Button onClick={handleOpenTaskModal}>
              <Plus className="mr-2 h-4 w-4" />
              Assign New Task
            </Button>
          </WithPermission>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <SearchInput
            placeholder="Search tasks..."
            onSearchChange={setDebouncedSearch}
            className="max-w-full sm:max-w-md flex-1"
          />

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-row sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 justify-center h-9 text-xs sm:text-sm"
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
                    "assignTaskList_column_order",
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

        <div
          className={`transform transition-all duration-300 ease-in-out ${
            showFilters
              ? "opacity-100 max-h-250"
              : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <Card className="mt-4">
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
                    onChange={(values) => {
                      setStatusFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
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
                    onChange={(values) => {
                      setPriorityFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
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
                    Assigned To
                  </label>
                  <MultiSelect
                    options={uniqueAssignedToOptions}
                    selectedValues={assignedToFilter}
                    onChange={(values) => {
                      setAssignedToFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
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
                    options={uniqueReviewedByOptions}
                    selectedValues={reviewedByFilter}
                    onChange={(values) => {
                      setReviewedByFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
                    onOpenChange={setUserDropdownOpen}
                    placeholder="All Reviewers"
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
                      setPagination({ pageNumber: 1 });
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

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Board
                  </label>
                  <MultiSelect
                    options={boardOptions}
                    selectedValues={boardFilter}
                    onChange={(values) => {
                      setBoardFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
                    onOpenChange={setBoardDropdownOpen}
                    placeholder="All Projects"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  disabled={
                    statusFilter.length === 0 &&
                    priorityFilter.length === 0 &&
                    assignedToFilter.length === 0 &&
                    reviewedByFilter.length === 0 &&
                    privateFilter === "all" &&
                    boardFilter.length === 0
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {loadingAssigned ? (
        <TableSkeleton
          columns={[
            "Task Title",
            "Status",
            "Assigned To",
            "Start Date",
            "Due Date",
            "Completed Date",
            "Hours (Est / Actual)",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={displayTasks}
          columns={orderedColumns}
          keyExtractor={(task: AssignedByMeTaskListItem) => task.strTaskGUID}
          sortBy={sorting.columnKey || ""}
          ascending={sorting.direction === "asc"}
          onSort={handleSort}
          loading={loadingAssigned}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          isTextWrapped={isTextWrapped}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "assignTaskList_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            debouncedSearch ? (
              <>No tasks found matching "{debouncedSearch}".</>
            ) : (
              <>No tasks found. Tasks assigned by you will appear here.</>
            )
          }
          pagination={{
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount: pagination.totalCount || 0,
            totalPages: pagination.totalPages || 1,
            onPageChange: goToPage,
            onPageSizeChange: handlePageSizeChange,
          }}
          maxHeight="calc(100vh - 400px)"
          pageSizeOptions={[5, 10, 20, 50]}
        />
      )}

      <TaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        boardGUID=""
        sectionGUID={null}
        mode="create"
        permissionModule={ModuleBase.ASSIGN_TASK}
        onSuccess={async () => {
          await queryClient.invalidateQueries({
            queryKey: assignTaskQueryKeys.list({}),
          });
        }}
      />

      {editingTaskGUID && (
        <TaskModal
          open={!!editingTaskGUID}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditingTaskGUID(null);
            }
          }}
          onSuccess={async () => {
            setEditingTaskGUID(null);
            await queryClient.invalidateQueries({
              queryKey: assignTaskQueryKeys.list({}),
            });
          }}
          onDeleteSuccess={async () => {
            setEditingTaskGUID(null);
            await queryClient.invalidateQueries({
              queryKey: assignTaskQueryKeys.list({}),
            });
          }}
          taskGUID={editingTaskGUID}
          mode="edit"
          permissionModule={ModuleBase.ASSIGN_TASK}
        />
      )}

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
