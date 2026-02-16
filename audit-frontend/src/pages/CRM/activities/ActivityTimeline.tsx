import React, { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
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
} from "lucide-react";

import type {
  ActivityListDto,
  ActivityFilterParams,
  ActivityType,
} from "@/types/CRM/activity";
import { ACTIVITY_TYPES } from "@/types/CRM/activity";
import {
  useActivities,
  useUpcomingActivities,
} from "@/hooks/api/CRM/use-activities";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useTableLayout } from "@/hooks/common/use-table-layout";
import { useUserRights } from "@/hooks/common/use-user-rights";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { ListModules, FormModules, Actions, canAccess } from "@/lib/permissions";
import { mapToStandardPagedResponse } from "@/lib/utils/pagination-utils";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-display/data-tables/DataTable";
import type { DataTableColumn } from "@/components/data-display/data-tables/DataTable";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ActivityTypeIcon, {
  getActivityTypeLabel,
} from "./components/ActivityTypeIcon";
import ActivityForm from "./components/ActivityForm";

const defaultColumnOrder = [
  "actions",
  "strActivityType",
  "strSubject",
  "dtScheduledOn",
  "dtCompletedOn",
  "intDurationMinutes",
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
  const [filterCompleted, setFilterCompleted] = useState("all");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createDefaultType, setCreateDefaultType] = useState<ActivityType>("Note");

  // Detail view
  const [detailTarget, setDetailTarget] = useState<ActivityListDto | null>(
    null
  );

  // List preferences
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("crm-activities", {
      pagination: {
        pageNumber: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "dtCreatedOn",
        direction: "desc",
      },
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
  const canCreateActivity =
    canAccess(menuItems, FormModules.CRM_ACTIVITY, Actions.SAVE) ||
    canAccess(menuItems, ListModules.CRM_ACTIVITY, Actions.SAVE);

  // Build filter params
  const filterParams: ActivityFilterParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      strActivityType: filterType === "all" ? undefined : filterType,
      bolIsCompleted:
        filterCompleted === "all" ? undefined : filterCompleted === "true",
      dtFromDate: filterFromDate || undefined,
      dtToDate: filterToDate || undefined,
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      sortBy,
      ascending,
    }),
    [
      debouncedSearch,
      filterType,
      filterCompleted,
      filterFromDate,
      filterToDate,
      pagination.pageNumber,
      pagination.pageSize,
      sortBy,
      ascending,
    ]
  );

  // Data fetch
  const {
    data: activitiesResponse,
    isLoading,
    refetch: refetchActivities,
  } = useActivities(filterParams);
  const {
    data: upcomingActivities = [],
    isLoading: isUpcomingLoading,
    refetch: refetchUpcoming,
  } = useUpcomingActivities();

  // Map response
  const pagedData = useMemo(() => {
    if (!activitiesResponse)
      return { items: [] as ActivityListDto[], totalCount: 0, totalPages: 0 };
    return mapToStandardPagedResponse<ActivityListDto>(
      activitiesResponse.data ?? activitiesResponse
    );
  }, [activitiesResponse]);

  // Update pagination
  React.useEffect(() => {
    if (pagedData.totalCount > 0) {
      updateResponseData({
        totalCount: pagedData.totalCount,
        totalPages: pagedData.totalPages,
      });
    }
  }, [pagedData.totalCount, pagedData.totalPages, updateResponseData]);

  // Active filter count
  const activeFilterCount = [
    filterType !== "all",
    filterCompleted !== "all",
    filterFromDate !== "",
    filterToDate !== "",
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setFilterType("all");
    setFilterCompleted("all");
    setFilterFromDate("");
    setFilterToDate("");
  }, []);

  const openCreateDialog = useCallback((type: ActivityType = "Note") => {
    setCreateDefaultType(type);
    setShowCreate(true);
  }, []);

  const handleRefresh = useCallback(() => {
    void refetchActivities();
    void refetchUpcoming();
  }, [refetchActivities, refetchUpcoming]);

  const handleSort = useCallback(
    (column: string) => {
      setSorting({
        columnKey: column,
        direction:
          sorting.columnKey === column && sorting.direction === "asc"
            ? "desc"
            : "asc",
      });
    },
    [sorting, setSorting]
  );

  // Columns
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetailTarget(item)}>
                <Eye className="h-3.5 w-3.5 mr-2" />
                View Details
              </DropdownMenuItem>
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
        width: "150px",
      },
      {
        key: "strSubject",
        header: "Subject",
        cell: (item: ActivityListDto) => (
          <span
            className="text-sm font-medium text-primary cursor-pointer hover:underline truncate block max-w-[300px]"
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
        width: "200px",
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
        width: "200px",
      },
      {
        key: "intDurationMinutes",
        header: "Duration",
        cell: (item: ActivityListDto) => (
          <span className="text-sm text-foreground">
            {item.intDurationMinutes
              ? `${item.intDurationMinutes} min`
              : "-"}
          </span>
        ),
        sortable: true,
        width: "100px",
      },
      {
        key: "strOutcome",
        header: "Outcome",
        cell: (item: ActivityListDto) => (
          <span className="text-sm text-foreground truncate block max-w-[160px]" title={item.strOutcome ?? ""}>
            {item.strOutcome || "-"}
          </span>
        ),
        sortable: false,
        width: "160px",
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        cell: (item: ActivityListDto) => (
          <span className="text-sm text-foreground">{item.strCreatedByName}</span>
        ),
        sortable: true,
        width: "150px",
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
        width: "200px",
      },
      {
        key: "links",
        header: "Linked To",
        cell: (item: ActivityListDto) => (
          <div className="flex items-center gap-1 flex-wrap">
            {item.links?.length > 0 ? (
              item.links.map((link, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                >
                  {link.strEntityType}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </div>
        ),
        sortable: false,
        width: "180px",
      },
    ],
    []
  );

  return (
    <CustomContainer>
      <PageHeader
        title="Activities"
        description="Timeline of all activities across your CRM"
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
            {canCreateActivity && (
              <Button
                onClick={() => openCreateDialog("Note")}
                className="h-9 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                Log Activity
              </Button>
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
            <CardHeader className="py-4">
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Activity Type
                  </label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {getActivityTypeLabel(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Status
                  </label>
                  <Select
                    value={filterCompleted}
                    onValueChange={setFilterCompleted}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Completed</SelectItem>
                      <SelectItem value="false">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={filterFromDate}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={filterToDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Activities */}
      <Card className="mb-4">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Upcoming Activities</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => void refetchUpcoming()}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Reload
              </Button>
              {canCreateActivity && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => openCreateDialog("FollowUp")}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Quick Follow-up
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isUpcomingLoading ? (
            <p className="text-sm text-muted-foreground">Loading upcoming activities...</p>
          ) : upcomingActivities.length > 0 ? (
            <div className="space-y-2">
              {upcomingActivities.slice(0, 5).map((activity) => (
                <div
                  key={activity.strActivityGUID}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.strSubject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getActivityTypeLabel(activity.strActivityType)}
                      {activity.strEntityName ? ` • ${activity.strEntityName}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {activity.dtScheduledOn
                      ? format(new Date(activity.dtScheduledOn), "MMM d, h:mm a")
                      : "No schedule"}
                  </div>
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
          onPageSizeChange: (size) =>
            setPagination({ pageSize: size, pageNumber: 1 }),
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
            {canCreateActivity && (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => openCreateDialog("Note")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Activity
              </Button>
            )}
          </div>
        }
      />

      {/* Create Activity Dialog */}
      <ActivityForm
        open={showCreate}
        onOpenChange={setShowCreate}
        defaultActivityType={createDefaultType}
      />

      {/* Detail View Dialog */}
      {detailTarget && (
        <ActivityDetailDialog
          activity={detailTarget}
          open={!!detailTarget}
          onOpenChange={(open) => !open && setDetailTarget(null)}
        />
      )}
    </CustomContainer>
  );
};

// ── Inline Detail Dialog (lightweight, no extra file) ──────────

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ActivityDetailDialogProps {
  activity: ActivityListDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ActivityDetailDialog: React.FC<ActivityDetailDialogProps> = ({
  activity,
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActivityTypeIcon type={activity.strActivityType} size="sm" />
            {getActivityTypeLabel(activity.strActivityType)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Subject</p>
            <p className="text-sm mt-0.5 text-foreground">{activity.strSubject}</p>
          </div>

          {activity.strDescription && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Description
              </p>
              <p className="text-sm mt-0.5 text-foreground whitespace-pre-wrap">
                {activity.strDescription}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {activity.dtScheduledOn && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Scheduled
                </p>
                <p className="text-sm mt-0.5 text-foreground">
                  {format(
                    new Date(activity.dtScheduledOn),
                    "MMM d, yyyy h:mm a"
                  )}
                </p>
              </div>
            )}
            {activity.dtCompletedOn && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-sm mt-0.5 text-emerald-600 dark:text-emerald-400">
                  {format(
                    new Date(activity.dtCompletedOn),
                    "MMM d, yyyy h:mm a"
                  )}
                </p>
              </div>
            )}
            {activity.intDurationMinutes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Duration
                </p>
                <p className="text-sm mt-0.5 text-foreground">
                  {activity.intDurationMinutes} min
                </p>
              </div>
            )}
            {activity.strOutcome && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Outcome
                </p>
                <p className="text-sm mt-0.5 text-foreground">{activity.strOutcome}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Created By
              </p>
              <p className="text-sm mt-0.5 text-foreground">{activity.strCreatedByName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Created On
              </p>
              <p className="text-sm mt-0.5 text-foreground">
                {format(new Date(activity.dtCreatedOn), "MMM d, yyyy h:mm a")}
              </p>
            </div>
          </div>

          {activity.links?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Linked Entities
              </p>
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
