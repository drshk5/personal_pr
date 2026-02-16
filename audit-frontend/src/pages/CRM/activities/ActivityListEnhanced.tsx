import React, { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Clock,
  Plus,
  MoreHorizontal,
  Eye,
  Trash2,
  Edit,
  AlertCircle,
} from "lucide-react";

import type {
  ActivityListDto,
  ActivityFilterParams,
  ActivityType,
} from "@/types/CRM/activity";
import { ACTIVITY_TYPES } from "@/types/CRM/activity";
import {
  useActivitiesExtended,
  useDeleteActivity,
} from "@/hooks/api/CRM/use-activities-extended";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useUserRights } from "@/hooks/common/use-user-rights";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { ListModules, FormModules, Actions, canAccess } from "@/lib/permissions";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-display/data-tables/DataTable";
import type { DataTableColumn } from "@/components/data-display/data-tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ActivityTypeIcon, {
  getActivityTypeLabel,
} from "./components/ActivityTypeIcon";
import ActivityForm from "./components/ActivityForm";

interface ActivityListFilters {
  search: string;
  type: string;
  status: string;
  assigned: string;
  dateFrom: string;
  dateTo: string;
}

export const ActivityList: React.FC = () => {
  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ListModules.CRM_ACTIVITY, Clock);

  // Filters state
  const [filters, setFilters] = useState<ActivityListFilters>({
    search: "",
    type: "all",
    status: "all",
    assigned: "all",
    dateFrom: "",
    dateTo: "",
  });
  const debouncedSearch = useDebounce(filters.search, 400);

  // Dialog states
  const [showCreate, setShowCreate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityListDto | null>(null);

  // List preferences
  const { pagination, setPagination } =
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

  // Build filter params
  const filterParams: ActivityFilterParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      strActivityType: filters.type === "all" ? undefined : filters.type,
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
    }),
    [debouncedSearch, filters.type, pagination.pageNumber, pagination.pageSize]
  );

  // Fetch activities
  const { data: activitiesResponse, isLoading, refetch } =
    useActivitiesExtended(filterParams);
  const activities = activitiesResponse?.data || [];
  const totalCount = activitiesResponse?.totalRecords || 0;

  // Mutations
  const deleteActivity = useDeleteActivity();

  // Permissions
  const canCreate =
    canAccess(menuItems, FormModules.CRM_ACTIVITY, Actions.SAVE) ||
    canAccess(menuItems, ListModules.CRM_ACTIVITY, Actions.SAVE);
  const canEdit = canAccess(menuItems, FormModules.CRM_ACTIVITY, Actions.EDIT);
  const canDelete = canAccess(menuItems, ListModules.CRM_ACTIVITY, Actions.DELETE);

  // Handlers
  const handleOpenActivity = useCallback((activity: ActivityListDto) => {
    setSelectedActivity(activity);
    setShowDetails(true);
  }, []);

  const handleDeleteActivity = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to delete this activity?")) {
        deleteActivity.mutate(id);
      }
    },
    [deleteActivity]
  );

  // Columns definition
  const columns: DataTableColumn<ActivityListDto>[] = [
    {
      key: "strActivityType",
      header: "Type",
      width: "120px",
      cell: (row: ActivityListDto) => (
        <div className="flex items-center gap-2">
          <ActivityTypeIcon type={row.strActivityType as ActivityType} />
          <span className="text-sm font-medium">
            {getActivityTypeLabel(row.strActivityType as ActivityType)}
          </span>
        </div>
      ),
    },
    {
      key: "strSubject",
      header: "Subject",
      width: "300px",
      sortable: true,
      cell: (row: ActivityListDto) => (
        <Button
          variant="link"
          className="p-0 h-auto font-normal text-foreground hover:text-primary"
          onClick={() => handleOpenActivity(row)}
        >
          <span className="truncate">{row.strSubject}</span>
        </Button>
      ),
    },
    {
      key: "dtScheduledOn",
      header: "Scheduled",
      width: "150px",
      sortable: true,
      cell: (row: ActivityListDto) =>
        row.dtScheduledOn ? (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.dtScheduledOn), "MMM dd, HH:mm")}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No date</span>
        ),
    },
    {
      key: "strAssignedToName",
      header: "Assigned To",
      width: "150px",
      cell: (row: ActivityListDto) => (
        <span className="text-sm">
          {row.strAssignedToName || "-"}
        </span>
      ),
    },
    {
      key: "dtCompletedOn",
      header: "Completed",
      width: "150px",
      cell: (row: ActivityListDto) =>
        row.dtCompletedOn ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-green-600 dark:bg-green-400" />
            <span className="text-sm text-muted-foreground">
              {format(new Date(row.dtCompletedOn), "MMM dd, HH:mm")}
            </span>
          </div>
        ) : (
          <Badge variant="outline" className="dark:border-yellow-600 dark:text-yellow-400">
            Open
          </Badge>
        ),
    },
    {
      key: "strCreatedByName",
      header: "Created By",
      width: "150px",
      cell: (row: ActivityListDto) => (
        <span className="text-sm text-muted-foreground">{row.strCreatedByName}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (row: ActivityListDto) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-700">
            <DropdownMenuItem onClick={() => handleOpenActivity(row)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem
                onClick={() => {
                  setSelectedActivity(row);
                  setShowCreate(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={() => handleDeleteActivity(row.strActivityGUID)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <CustomContainer className="space-y-4 dark:bg-slate-950">
      {/* Header */}
      <PageHeader
        title="Activities"
        description="Manage all activities and follow-ups"
        icon={HeaderIcon}
      />

      {/* Toolbar */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-slate-500" />
                <Input
                  placeholder="Search activities..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 dark:bg-slate-900 dark:border-slate-700">
                  <div className="p-3 space-y-3">
                    {/* Type Filter */}
                    <div>
                      <label className="text-sm font-medium dark:text-slate-200">Type</label>
                      <Select
                        value={filters.type}
                        onValueChange={(value) =>
                          setFilters({ ...filters, type: value })
                        }
                      >
                        <SelectTrigger className="mt-1 dark:bg-slate-800 dark:border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 dark:border-slate-700">
                          <SelectItem value="all">All Types</SelectItem>
                          {ACTIVITY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {getActivityTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Create Button */}
              {canCreate && (
                <Button
                  onClick={() => {
                    setSelectedActivity(null);
                    setShowCreate(true);
                  }}
                  className="gap-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  New Activity
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Data Table */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground dark:text-slate-400">
                Loading activities...
              </div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground dark:text-slate-600 mb-2" />
              <p className="text-muted-foreground dark:text-slate-400">
                No activities found
              </p>
            </div>
          ) : (
            <DataTable<ActivityListDto>
              columns={columns}
              data={activities}
              keyExtractor={(item) => item.strActivityGUID}
              pagination={{
                pageNumber: pagination.pageNumber,
                pageSize: pagination.pageSize,
                totalCount: totalCount,
                totalPages: activitiesResponse?.totalPages || 1,
                onPageChange: (pageNumber: number) =>
                  setPagination({ ...pagination, pageNumber }),
                onPageSizeChange: (pageSize: number) =>
                  setPagination({ ...pagination, pageSize, pageNumber: 1 }),
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <ActivityForm
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={() => {
          setShowCreate(false);
          refetch();
        }}
      />

      {/* Detail Dialog */}
      {selectedActivity && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="dark:text-slate-100">
                Activity Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                    Type
                  </label>
                  <p className="mt-1 dark:text-slate-100">
                    {getActivityTypeLabel(
                      selectedActivity.strActivityType as ActivityType
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                    Subject
                  </label>
                  <p className="mt-1 dark:text-slate-100">
                    {selectedActivity.strSubject}
                  </p>
                </div>
                {selectedActivity.dtScheduledOn && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                      Scheduled On
                    </label>
                    <p className="mt-1 dark:text-slate-100">
                      {format(
                        new Date(selectedActivity.dtScheduledOn),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </p>
                  </div>
                )}
                {selectedActivity.strAssignedToName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                      Assigned To
                    </label>
                    <p className="mt-1 dark:text-slate-100">
                      {selectedActivity.strAssignedToName}
                    </p>
                  </div>
                )}
              </div>
              {selectedActivity.strDescription && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                    Description
                  </label>
                  <p className="mt-1 text-sm dark:text-slate-200">
                    {selectedActivity.strDescription}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </CustomContainer>
  );
};

export default ActivityList;
