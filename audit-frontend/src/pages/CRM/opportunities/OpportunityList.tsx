import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingUp,
  LayoutGrid,
  List,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

import type {
  OpportunityListDto,
  OpportunityFilterParams,
} from "@/types/CRM/opportunity";
import {
  OPPORTUNITY_STATUSES,
} from "@/types/CRM/opportunity";
import {
  useOpportunities,
  useDeleteOpportunity,
} from "@/hooks/api/CRM/use-opportunities";
import { usePipelines } from "@/hooks/api/CRM/use-pipelines";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useTableLayout } from "@/hooks/common/use-table-layout";
import { useUserRights } from "@/hooks/common/use-user-rights";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useModuleUsers } from "@/hooks/api/central/use-users";
import { Actions, FormModules, ListModules, canAccess } from "@/lib/permissions";
import { mapToStandardPagedResponse } from "@/lib/utils/pagination-utils";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-display/data-tables/DataTable";
import type { DataTableColumn } from "@/components/data-display/data-tables/DataTable";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { WithPermission } from "@/components/ui/with-permission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const defaultColumnOrder = [
  "actions",
  "strOpportunityName",
  "strAccountName",
  "strStageName",
  "strStatus",
  "dblAmount",
  "intProbability",
  "dtExpectedCloseDate",
  "bolIsRotting",
  "strAssignedToName",
  "dtCreatedOn",
];

const OpportunityList: React.FC = () => {
  const navigate = useNavigate();
  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ListModules.CRM_OPPORTUNITY, TrendingUp);

  // Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Filters
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPipeline, setFilterPipeline] = useState<string>("");
  const [filterIsRotting, setFilterIsRotting] = useState<string>("");

  // Delete
  const [deleteTarget, setDeleteTarget] =
    useState<OpportunityListDto | null>(null);
  const { mutate: deleteOpportunity, isPending: isDeleting } =
    useDeleteOpportunity();

  // Pipelines for filter dropdown
  const { data: pipelines } = usePipelines();

  // List preferences
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("crm-opportunities", {
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
  } = useTableLayout("crm-opportunities", defaultColumnOrder, ["actions"]);

  // Sort mapping
  const sortBy = sorting.columnKey || "dtCreatedOn";
  const ascending = sorting.direction === "asc";

  // Build filter params
  const filterParams: OpportunityFilterParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      strStatus: filterStatus === "all" ? undefined : filterStatus || undefined,
      strPipelineGUID: filterPipeline === "all" ? undefined : filterPipeline || undefined,
      bolIsRotting:
        filterIsRotting === "all" || filterIsRotting === "" ? undefined : filterIsRotting === "true",
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      sortBy,
      ascending,
    }),
    [
      debouncedSearch,
      filterStatus,
      filterPipeline,
      filterIsRotting,
      pagination.pageNumber,
      pagination.pageSize,
      sortBy,
      ascending,
    ]
  );

  // Data fetch
  const { data: opportunitiesResponse, isLoading } =
    useOpportunities(filterParams);
  const { data: users } = useModuleUsers();

  const userMap = useMemo(() => {
    if (!users) return new Map<string, string>();
    return new Map(users.map((u) => [u.strUserGUID, u.strName]));
  }, [users]);

  // Map response to standardized format
  const pagedData = useMemo(() => {
    if (!opportunitiesResponse)
      return {
        items: [] as OpportunityListDto[],
        totalCount: 0,
        totalPages: 0,
      };
    return mapToStandardPagedResponse<OpportunityListDto>(
      opportunitiesResponse.data ?? opportunitiesResponse
    );
  }, [opportunitiesResponse]);

  // Update pagination totals from response
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
    filterStatus,
    filterPipeline,
    filterIsRotting,
  ].filter((v) => v !== "").length;

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilterStatus("");
    setFilterPipeline("");
    setFilterIsRotting("");
  }, []);

  // Handle sort
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

  // Open edit in new tab
  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  // Handle delete
  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteOpportunity(
      { id: deleteTarget.strOpportunityGUID },
      {
        onSettled: () => setDeleteTarget(null),
      }
    );
  };

  // Format currency
  const formatCurrency = (value: number, currency: string) => {
    return `${currency} ${value.toLocaleString()}`;
  };

  // Status badge styles
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "Won":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "Lost":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  // Columns
  const columns: DataTableColumn<OpportunityListDto>[] = useMemo(
    () => [
      ...(canAccess(menuItems, FormModules.CRM_OPPORTUNITY, Actions.EDIT) ||
        canAccess(menuItems, FormModules.CRM_OPPORTUNITY, Actions.DELETE)
        ? [
          {
            key: "actions",
            header: "Actions",
            cell: (item: OpportunityListDto) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canAccess(
                    menuItems,
                    FormModules.CRM_OPPORTUNITY,
                    Actions.EDIT
                  ) && (
                      <DropdownMenuItem
                        onClick={() =>
                          openEditInNewTab(
                            `/crm/opportunities/${item.strOpportunityGUID}`
                          )
                        }
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                  {canAccess(
                    menuItems,
                    FormModules.CRM_OPPORTUNITY,
                    Actions.DELETE
                  ) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
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
            width: "70px",
          } as DataTableColumn<OpportunityListDto>,
        ]
        : []),
      {
        key: "strOpportunityName",
        header: "Opportunity Name",
        cell: (item: OpportunityListDto) => (
          <div
            className="font-medium text-primary cursor-pointer hover:underline"
            onClick={() =>
              openEditInNewTab(
                `/crm/opportunities/${item.strOpportunityGUID}`
              )
            }
          >
            {item.strOpportunityName}
          </div>
        ),
        sortable: true,
        width: "240px",
      },
      {
        key: "strAccountName",
        header: "Account",
        cell: (item: OpportunityListDto) => (
          <span className="text-sm text-foreground">{item.strAccountName || "-"}</span>
        ),
        sortable: true,
        width: "180px",
      },
      {
        key: "strStageName",
        header: "Stage",
        cell: (item: OpportunityListDto) => (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            {item.strStageName}
          </span>
        ),
        sortable: true,
        width: "150px",
      },
      {
        key: "strStatus",
        header: "Status",
        cell: (item: OpportunityListDto) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(item.strStatus)}`}
          >
            {item.strStatus}
          </span>
        ),
        sortable: true,
        width: "100px",
      },
      {
        key: "dblAmount",
        header: "Amount",
        cell: (item: OpportunityListDto) => (
          <span className="text-sm font-medium text-foreground">
            {item.dblAmount != null
              ? formatCurrency(item.dblAmount, item.strCurrency)
              : "-"}
          </span>
        ),
        sortable: true,
        width: "150px",
      },
      {
        key: "intProbability",
        header: "Probability",
        cell: (item: OpportunityListDto) => (
          <span className="text-sm text-foreground">{item.intProbability}%</span>
        ),
        sortable: true,
        width: "110px",
      },
      {
        key: "dtExpectedCloseDate",
        header: "Expected Close",
        cell: (item: OpportunityListDto) => (
          <div className="whitespace-nowrap text-sm text-foreground">
            {item.dtExpectedCloseDate
              ? format(
                new Date(item.dtExpectedCloseDate),
                "MMM d, yyyy"
              )
              : "-"}
          </div>
        ),
        sortable: true,
        width: "140px",
      },
      {
        key: "bolIsRotting",
        header: "Health",
        cell: (item: OpportunityListDto) =>
          item.bolIsRotting ? (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Rotting
            </span>
          ) : (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Healthy
            </span>
          ),
        sortable: false,
        width: "100px",
      },
      {
        key: "strAssignedToName",
        header: "Assigned To",
        cell: (item: OpportunityListDto) => (
          <span className="text-sm text-foreground">
            {item.strAssignedToName || userMap.get(item.strAssignedToGUID || "") || "-"}
          </span>
        ),
        sortable: true,
        width: "160px",
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        cell: (item: OpportunityListDto) => (
          <div className="whitespace-nowrap text-sm text-foreground">
            {item.dtCreatedOn
              ? format(new Date(item.dtCreatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        sortable: true,
        width: "180px",
      },
    ],
    [menuItems, openEditInNewTab, userMap]
  );

  return (
    <CustomContainer>
      <PageHeader
        title="Opportunities"
        description="Manage your sales pipeline and deals"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs sm:text-sm"
              onClick={() => navigate("/crm/opportunities/board")}
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Board View
            </Button>
            <WithPermission
              module={FormModules.CRM_OPPORTUNITY}
              action={Actions.SAVE}
            >
              <Button
                onClick={() => navigate("/crm/opportunities/create")}
                className="h-9 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                New Opportunity
              </Button>
            </WithPermission>
          </div>
        }
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search opportunities..."
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
              onColumnOrderChange={(order) => {
                setColumnOrder(order);
              }}
              onResetAll={() => resetAll()}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Status
                  </label>
                  <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {OPPORTUNITY_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Pipeline
                  </label>
                  <Select
                    value={filterPipeline}
                    onValueChange={setFilterPipeline}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Pipelines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pipelines</SelectItem>
                      {pipelines?.map((p) => (
                        <SelectItem
                          key={p.strPipelineGUID}
                          value={p.strPipelineGUID}
                        >
                          {p.strPipelineName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Deal Health
                  </label>
                  <Select
                    value={filterIsRotting}
                    onValueChange={setFilterIsRotting}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Rotting</SelectItem>
                      <SelectItem value="false">Healthy</SelectItem>
                    </SelectContent>
                  </Select>
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

      {/* Data Table */}
      <DataTable<OpportunityListDto>
        data={pagedData.items}
        columns={columns}
        keyExtractor={(item) => item.strOpportunityGUID}
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
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No opportunities found</p>
            <p className="text-sm mt-1">
              {debouncedSearch || activeFilterCount > 0
                ? "Try adjusting your search or filters"
                : "Create your first opportunity to get started"}
            </p>
          </div>
        }
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Opportunity"
        description={`Are you sure you want to delete "${deleteTarget?.strOpportunityName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </CustomContainer>
  );
};

export default OpportunityList;
