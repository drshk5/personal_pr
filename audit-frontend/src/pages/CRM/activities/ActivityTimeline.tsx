import React, { useCallback, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Plus,
  Search,
  Filter,
  Clock,
  CalendarDays,
  CheckCircle2,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Pencil,
  Trash2,
  UserPlus,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import type {
  ActivityListDto,
  ActivityFilterParams,
  ActivityType,
  ActivityStatus,
} from "@/types/CRM/activity";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES, ACTIVITY_PRIORITIES } from "@/types/CRM/activity";
import {
  useActivitiesExtended,
  useUpcomingActivities,
  useDeleteActivity,
  useChangeActivityStatus,
  useAssignActivity,
} from "@/hooks/api/CRM/use-activities-extended";
import { useUsers } from "@/hooks/api/central/use-users";
import type { User } from "@/types/central/user";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useTableLayout } from "@/hooks/common/use-table-layout";
import { useUserRights } from "@/hooks/common/use-user-rights";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { ListModules, FormModules, Actions, canAccess } from "@/lib/permissions";
import { mapToStandardPagedResponse } from "@/lib/utils/pagination-utils";

import { DatePicker } from "@/components/ui/date-picker";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-display/data-tables/DataTable";
import type { DataTableColumn } from "@/components/data-display/data-tables/DataTable";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import ActivityTypeIcon, {
  getActivityTypeLabel,
} from "./components/ActivityTypeIcon";
import ActivityForm from "./components/ActivityForm";

// ── Color helpers ──────────────────────────────────────────────

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string; label: string }> = {
  Pending: { variant: "outline", className: "border-yellow-500/50 text-yellow-600 bg-yellow-500/10", label: "Pending" },
  InProgress: { variant: "outline", className: "border-blue-500/50 text-blue-600 bg-blue-500/10", label: "In Progress" },
  Completed: { variant: "outline", className: "border-emerald-500/50 text-emerald-600 bg-emerald-500/10", label: "Completed" },
  Cancelled: { variant: "outline", className: "border-red-500/50 text-red-600 bg-red-500/10", label: "Cancelled" },
};

const PRIORITY_BADGE: Record<string, { className: string }> = {
  Low: { className: "border-slate-400/50 text-slate-500 bg-slate-400/10" },
  Medium: { className: "border-yellow-500/50 text-yellow-600 bg-yellow-500/10" },
  High: { className: "border-orange-500/50 text-orange-600 bg-orange-500/10" },
  Urgent: { className: "border-red-500/50 text-red-600 bg-red-500/10" },
};

const defaultColumnOrder = [
  "actions",
  "strActivityType",
  "strSubject",
  "strStatus",
  "strPriority",
  "strAssignedToName",
  "dtDueDate",
  "dtScheduledOn",
  "dtCompletedOn",
  "strOutcome",
  "strCreatedByName",
  "dtCreatedOn",
  "links",
];

const ActivityTimeline: React.FC = () => {
  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ListModules.CRM_ACTIVITY, Clock);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [createDefaultType, setCreateDefaultType] = useState<ActivityType>("Note");
  const [editTarget, setEditTarget] = useState<ActivityListDto | null>(null);
  const [detailTarget, setDetailTarget] = useState<ActivityListDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActivityListDto | null>(null);

  // Mutations
  const { mutate: deleteActivity, isPending: isDeleting } = useDeleteActivity();
  const { mutate: changeStatus } = useChangeActivityStatus();
  const { mutate: assignActivity } = useAssignActivity();

  // Users for assignment
  const { data: usersData } = useUsers({ bolIsActive: true });
  const users: User[] = usersData?.data?.items || [];

  // List preferences
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("crm-activities", {
      pagination: { pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
      sorting: { columnKey: "dtCreatedOn", direction: "desc" },
    });

  // Table layout
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
  } = useTableLayout("crm-activities", defaultColumnOrder, ["actions"]);

  void columnOrder;
  const sortBy = sorting.columnKey || "dtCreatedOn";
  const ascending = sorting.direction === "asc";
  const canCreate = canAccess(menuItems, FormModules.CRM_ACTIVITY, Actions.SAVE) || canAccess(menuItems, ListModules.CRM_ACTIVITY, Actions.SAVE);
  const canEdit = canAccess(menuItems, FormModules.CRM_ACTIVITY, Actions.SAVE) || canAccess(menuItems, ListModules.CRM_ACTIVITY, Actions.SAVE);
  const canDelete = canAccess(menuItems, ListModules.CRM_ACTIVITY, Actions.DELETE);

  // Build filter params
  const filterParams: ActivityFilterParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      strActivityType: filterType === "all" ? undefined : filterType,
      strStatus: filterStatus === "all" ? undefined : filterStatus,
      strPriority: filterPriority === "all" ? undefined : filterPriority,
      dtFromDate: filterFromDate || undefined,
      dtToDate: filterToDate || undefined,
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      sortBy,
      ascending,
    }),
    [debouncedSearch, filterType, filterStatus, filterPriority, filterFromDate, filterToDate, pagination.pageNumber, pagination.pageSize, sortBy, ascending]
  );

  // Data fetch
  const {
    data: activitiesResponse,
    isLoading,
    refetch: refetchActivities,
  } = useActivitiesExtended(filterParams);
  const {
    data: upcomingActivities = [],
    isLoading: isUpcomingLoading,
    refetch: refetchUpcoming,
  } = useUpcomingActivities();

  // Map response
  const pagedData = useMemo(() => {
    if (!activitiesResponse) return { items: [] as ActivityListDto[], totalCount: 0, totalPages: 0 };
    return mapToStandardPagedResponse<ActivityListDto>(activitiesResponse.data ?? activitiesResponse);
  }, [activitiesResponse]);

  // Update pagination
  React.useEffect(() => {
    if (pagedData.totalCount > 0) {
      updateResponseData({ totalCount: pagedData.totalCount, totalPages: pagedData.totalPages });
    }
  }, [pagedData.totalCount, pagedData.totalPages, updateResponseData]);

  // Active filter count
  const activeFilterCount = [
    filterType !== "all",
    filterStatus !== "all",
    filterPriority !== "all",
    filterFromDate !== "",
    filterToDate !== "",
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setFilterType("all");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterFromDate("");
    setFilterToDate("");
  }, []);

  const openCreateDialog = useCallback((type: ActivityType = "Note") => {
    setCreateDefaultType(type);
    setEditTarget(null);
    setShowCreate(true);
  }, []);

  const openEditDialog = useCallback((activity: ActivityListDto) => {
    setEditTarget(activity);
    setShowCreate(true);
  }, []);

  const handleRefresh = useCallback(() => {
    void refetchActivities();
    void refetchUpcoming();
  }, [refetchActivities, refetchUpcoming]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteActivity(deleteTarget.strActivityGUID, {
      onSuccess: () => {
        setDeleteTarget(null);
        handleRefresh();
      },
    });
  }, [deleteTarget, deleteActivity, handleRefresh]);

  const handleStatusChange = useCallback((id: string, status: string) => {
    changeStatus({ id, dto: { strStatus: status } }, { onSuccess: handleRefresh });
  }, [changeStatus, handleRefresh]);

  const handleAssign = useCallback((id: string, userId: string) => {
    assignActivity({ id, dto: { strAssignedToGUID: userId } }, { onSuccess: handleRefresh });
  }, [assignActivity, handleRefresh]);

  const handleSort = useCallback((column: string) => {
    setSorting({
      columnKey: column,
      direction: sorting.columnKey === column && sorting.direction === "asc" ? "desc" : "asc",
    });
  }, [sorting, setSorting]);

  // ── Columns ─────────────────────────────────────────────────

  const columns: DataTableColumn<ActivityListDto>[] = useMemo(
    () => [
      {
        key: "actions",
        header: "",
        cell: (item: ActivityListDto) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setDetailTarget(item)}>
                <Eye className="h-3.5 w-3.5 mr-2" />
                View Details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => openEditDialog(item)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowRight className="h-3.5 w-3.5 mr-2" />
                      Change Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {ACTIVITY_STATUSES.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          disabled={item.strStatus === s}
                          onClick={() => handleStatusChange(item.strActivityGUID, s)}
                        >
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_BADGE[s]?.className || ""}`}>
                            {STATUS_BADGE[s]?.label || s}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <UserPlus className="h-3.5 w-3.5 mr-2" />
                      Assign To
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                      {users.map((user) => (
                        <DropdownMenuItem
                          key={user.strUserGUID}
                          onClick={() => handleAssign(item.strActivityGUID, user.strUserGUID)}
                        >
                          {user.strName}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        sortable: false,
        width: "60px",
      },
      {
        key: "strActivityType",
        header: "Type",
        cell: (item: ActivityListDto) => (
          <div className="flex items-center gap-2">
            <ActivityTypeIcon type={item.strActivityType} size="sm" />
            <span className="text-sm font-medium text-foreground">
              {getActivityTypeLabel(item.strActivityType)}
            </span>
          </div>
        ),
        sortable: true,
        width: "140px",
      },
      {
        key: "strSubject",
        header: "Subject",
        cell: (item: ActivityListDto) => (
          <span
            className="text-sm font-medium text-primary cursor-pointer hover:underline truncate block max-w-[280px]"
            title={item.strSubject}
            onClick={() => setDetailTarget(item)}
          >
            {item.strSubject}
          </span>
        ),
        sortable: true,
        width: "280px",
      },
      {
        key: "strStatus",
        header: "Status",
        cell: (item: ActivityListDto) => {
          const badge = STATUS_BADGE[item.strStatus];
          return (
            <Badge variant={badge?.variant || "outline"} className={`text-xs ${badge?.className || ""}`}>
              {badge?.label || item.strStatus}
            </Badge>
          );
        },
        sortable: true,
        width: "120px",
      },
      {
        key: "strPriority",
        header: "Priority",
        cell: (item: ActivityListDto) => {
          const badge = PRIORITY_BADGE[item.strPriority];
          return (
            <Badge variant="outline" className={`text-xs ${badge?.className || ""}`}>
              {item.strPriority}
            </Badge>
          );
        },
        sortable: true,
        width: "100px",
      },
      {
        key: "strAssignedToName",
        header: "Assigned To",
        cell: (item: ActivityListDto) => (
          <span className="text-sm text-foreground">
            {item.strAssignedToName || <span className="text-muted-foreground italic">Unassigned</span>}
          </span>
        ),
        sortable: true,
        width: "150px",
      },
      {
        key: "dtDueDate",
        header: "Due Date",
        cell: (item: ActivityListDto) => {
          if (!item.dtDueDate) return <span className="text-muted-foreground text-sm">-</span>;
          const isOverdue = item.bolIsOverdue;
          return (
            <div className={`whitespace-nowrap text-sm flex items-center gap-1 ${isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-foreground"}`}>
              {isOverdue && <AlertTriangle className="h-3.5 w-3.5" />}
              {format(new Date(item.dtDueDate), "MMM d, yyyy")}
            </div>
          );
        },
        sortable: true,
        width: "140px",
      },
      {
        key: "dtScheduledOn",
        header: "Scheduled",
        cell: (item: ActivityListDto) => (
          <div className="whitespace-nowrap text-sm text-foreground">
            {item.dtScheduledOn ? (
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                {format(new Date(item.dtScheduledOn), "MMM d, yyyy h:mm a")}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ),
        sortable: true,
        width: "190px",
      },
      {
        key: "dtCompletedOn",
        header: "Completed",
        cell: (item: ActivityListDto) => (
          <div className="whitespace-nowrap text-sm text-foreground">
            {item.dtCompletedOn ? (
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {format(new Date(item.dtCompletedOn), "MMM d, yyyy h:mm a")}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ),
        sortable: true,
        width: "190px",
      },
      {
        key: "strOutcome",
        header: "Outcome",
        cell: (item: ActivityListDto) => (
          <span className="text-sm text-foreground truncate block max-w-[150px]" title={item.strOutcome ?? ""}>
            {item.strOutcome || "-"}
          </span>
        ),
        sortable: false,
        width: "150px",
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        cell: (item: ActivityListDto) => (
          <span className="text-sm text-foreground">{item.strCreatedByName}</span>
        ),
        sortable: true,
        width: "140px",
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        cell: (item: ActivityListDto) => (
          <div className="whitespace-nowrap text-sm text-foreground">
            {format(new Date(item.dtCreatedOn), "MMM d, yyyy h:mm a")}
          </div>
        ),
        sortable: true,
        width: "190px",
      },
      {
        key: "links",
        header: "Linked To",
        cell: (item: ActivityListDto) => (
          <div className="flex items-center gap-1 flex-wrap">
            {item.links?.length > 0 ? (
              item.links.map((link, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {link.strEntityType}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </div>
        ),
        sortable: false,
        width: "160px",
      },
    ],
    [canEdit, canDelete, users, handleStatusChange, handleAssign, openEditDialog]
  );

  // ── Quick-action buttons for activity types ─────────────────
  const typeButtons: { type: ActivityType; label: string; icon: React.ReactNode }[] = [
    { type: "Call", label: "Call", icon: <span className="text-blue-500">📞</span> },
    { type: "Email", label: "Email", icon: <span className="text-purple-500">📧</span> },
    { type: "Meeting", label: "Meeting", icon: <span className="text-green-500">🤝</span> },
    { type: "Task", label: "Task", icon: <span className="text-orange-500">✅</span> },
    { type: "Note", label: "Note", icon: <span className="text-yellow-500">📝</span> },
    { type: "FollowUp", label: "Follow-Up", icon: <span className="text-cyan-500">🔄</span> },
  ];

  return (
    <CustomContainer>
      <PageHeader
        title="Activities"
        description="Track all calls, emails, meetings, tasks, and follow-ups across your CRM"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="h-9 text-xs sm:text-sm"
              size="sm"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Refresh
            </Button>
            {canCreate && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9 text-xs sm:text-sm" size="sm">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    Log Activity
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {typeButtons.map((tb) => (
                    <DropdownMenuItem key={tb.type} onClick={() => openCreateDialog(tb.type)}>
                      <span className="mr-2">{tb.icon}</span>
                      {tb.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        }
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9"
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>

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
              onColumnOrderChange={setColumnOrder}
              onResetAll={() => resetAll()}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">Activity Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{getActivityTypeLabel(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {ACTIVITY_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s === "InProgress" ? "In Progress" : s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">Priority</label>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {ACTIVITY_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">From Date</label>
                  <DatePicker
                    value={filterFromDate ? new Date(filterFromDate + "T12:00:00") : undefined}
                    onChange={(date) => setFilterFromDate(date ? format(date, "yyyy-MM-dd") : "")}
                    placeholder="From date"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">To Date</label>
                  <DatePicker
                    value={filterToDate ? new Date(filterToDate + "T12:00:00") : undefined}
                    onChange={(date) => setFilterToDate(date ? format(date, "yyyy-MM-dd") : "")}
                    placeholder="To date"
                  />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Button variant="outline" size="sm" onClick={clearFilters} className="h-8">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Activities */}
      <Card className="mb-4">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Upcoming Activities
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => void refetchUpcoming()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Reload
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isUpcomingLoading ? (
            <p className="text-sm text-muted-foreground">Loading upcoming activities...</p>
          ) : upcomingActivities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {upcomingActivities.slice(0, 8).map((activity) => (
                <div
                  key={activity.strActivityGUID}
                  className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                >
                  <ActivityTypeIcon type={activity.strActivityType} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{activity.strSubject}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {getActivityTypeLabel(activity.strActivityType)}
                      </span>
                      {activity.strAssignedToName && (
                        <Badge variant="secondary" className="text-[10px] h-4">
                          {activity.strAssignedToName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.dtScheduledOn
                        ? format(new Date(activity.dtScheduledOn), "MMM d, h:mm a")
                        : activity.dtDueDate
                          ? `Due: ${format(new Date(activity.dtDueDate), "MMM d")}`
                          : "No schedule"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${PRIORITY_BADGE[activity.strPriority]?.className || ""}`}
                  >
                    {activity.strPriority}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No upcoming activities. Use "Log Activity" to add one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable<ActivityListDto>
        data={pagedData.items}
        columns={columns}
        keyExtractor={(item) => item.strActivityGUID}
        sortBy={sortBy}
        ascending={ascending}
        onSort={handleSort}
        loading={isLoading}
        columnVisibility={columnVisibility}
        alwaysVisibleColumns={getAlwaysVisibleColumns()}
        isTextWrapped={isTextWrapped}
        pinnedColumns={pinnedColumns}
        columnWidths={columnWidths}
        onColumnWidthsChange={setColumnWidths}
        pagination={{
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          totalCount: pagination.totalCount ?? 0,
          totalPages: pagination.totalPages ?? 0,
          onPageChange: (page) => setPagination({ pageNumber: page }),
          onPageSizeChange: (size) => setPagination({ pageSize: size, pageNumber: 1 }),
        }}
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No activities found</p>
            <p className="text-sm mt-1">
              {debouncedSearch || activeFilterCount > 0
                ? "Try adjusting your search or filters"
                : "Log your first activity to get started"}
            </p>
            {canCreate && (
              <Button size="sm" className="mt-4" onClick={() => openCreateDialog("Note")}>
                <Plus className="h-4 w-4 mr-2" />
                Log Activity
              </Button>
            )}
          </div>
        }
      />

      {/* Create / Edit Activity Dialog */}
      <ActivityForm
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) setEditTarget(null);
        }}
        defaultActivityType={createDefaultType}
        editActivity={editTarget}
        onSuccess={handleRefresh}
      />

      {/* Detail View Dialog */}
      {detailTarget && (
        <ActivityDetailDialog
          activity={detailTarget}
          open={!!detailTarget}
          onOpenChange={(open) => !open && setDetailTarget(null)}
          onEdit={canEdit ? () => { setDetailTarget(null); openEditDialog(detailTarget); } : undefined}
          onStatusChange={canEdit ? (status: string) => handleStatusChange(detailTarget.strActivityGUID, status) : undefined}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.strSubject}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomContainer>
  );
};

// ── Detail Dialog ────────────────────────────────────────────

interface ActivityDetailDialogProps {
  activity: ActivityListDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onStatusChange?: (status: string) => void;
}

const ActivityDetailDialog: React.FC<ActivityDetailDialogProps> = ({
  activity,
  open,
  onOpenChange,
  onEdit,
  onStatusChange,
}) => {
  const statusBadge = STATUS_BADGE[activity.strStatus];
  const priorityBadge = PRIORITY_BADGE[activity.strPriority];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActivityTypeIcon type={activity.strActivityType} size="sm" />
            <span>{getActivityTypeLabel(activity.strActivityType)}</span>
            {onEdit && (
              <Button variant="ghost" size="sm" className="ml-auto h-7" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Subject */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Subject</p>
            <p className="text-sm mt-0.5 text-foreground font-medium">{activity.strSubject}</p>
          </div>

          {/* Status + Priority */}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              {onStatusChange ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge
                      variant={statusBadge?.variant || "outline"}
                      className={`text-xs cursor-pointer hover:opacity-80 ${statusBadge?.className || ""}`}
                    >
                      {statusBadge?.label || activity.strStatus}
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {ACTIVITY_STATUSES.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        disabled={activity.strStatus === s}
                        onClick={() => onStatusChange(s)}
                      >
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_BADGE[s]?.className || ""}`}>
                          {STATUS_BADGE[s]?.label || s}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge variant={statusBadge?.variant || "outline"} className={`text-xs ${statusBadge?.className || ""}`}>
                  {statusBadge?.label || activity.strStatus}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Priority</p>
              <Badge variant="outline" className={`text-xs ${priorityBadge?.className || ""}`}>
                {activity.strPriority}
              </Badge>
            </div>
            {activity.bolIsOverdue && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>

          {/* Description */}
          {activity.strDescription && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm mt-0.5 text-foreground whitespace-pre-wrap">{activity.strDescription}</p>
            </div>
          )}

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-3">
            {activity.dtDueDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <p className={`text-sm mt-0.5 ${activity.bolIsOverdue ? "text-red-600 font-medium" : "text-foreground"}`}>
                  {format(new Date(activity.dtDueDate), "MMM d, yyyy")}
                </p>
              </div>
            )}
            {activity.dtScheduledOn && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-sm mt-0.5 text-foreground">
                  {format(new Date(activity.dtScheduledOn), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            )}
            {activity.dtCompletedOn && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-sm mt-0.5 text-emerald-600 dark:text-emerald-400">
                  {format(new Date(activity.dtCompletedOn), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            )}
            {activity.intDurationMinutes != null && activity.intDurationMinutes > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p className="text-sm mt-0.5 text-foreground">{activity.intDurationMinutes} min</p>
              </div>
            )}
          </div>

          {/* Outcome */}
          {activity.strOutcome && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Outcome</p>
              <p className="text-sm mt-0.5 text-foreground">{activity.strOutcome}</p>
            </div>
          )}

          {/* People */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="text-sm mt-0.5 text-foreground">{activity.strCreatedByName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
              <p className="text-sm mt-0.5 text-foreground">
                {activity.strAssignedToName || <span className="text-muted-foreground italic">Unassigned</span>}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created On</p>
              <p className="text-sm mt-0.5 text-foreground">
                {format(new Date(activity.dtCreatedOn), "MMM d, yyyy h:mm a")}
              </p>
            </div>
            {activity.strCategory && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="text-sm mt-0.5 text-foreground">{activity.strCategory}</p>
              </div>
            )}
          </div>

          {/* Linked Entities */}
          {activity.links?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Linked Entities</p>
              <div className="flex flex-wrap gap-1.5">
                {activity.links.map((link, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {link.strEntityType}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityTimeline;
