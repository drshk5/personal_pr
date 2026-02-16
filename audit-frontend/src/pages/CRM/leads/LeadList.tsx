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
  ArrowRightLeft,
  Users,
  Upload,
  Download,
  UserPlus,
  GitMerge,
  BarChart3,
} from "lucide-react";

import type { LeadListDto, LeadFilterParams } from "@/types/CRM/lead";
import { LEAD_STATUSES, LEAD_SOURCES } from "@/types/CRM/lead";
import {
  useLeads,
  useDeleteLead,
  useExportLeads,
  useLeadAnalytics,
} from "@/hooks/api/CRM/use-leads";
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

import LeadStatusBadge from "./components/LeadStatusBadge";
import LeadScoreBadge from "./components/LeadScoreBadge";
import LeadSourceBadge from "./components/LeadSourceBadge";
import LeadAgingBadge from "./components/LeadAgingBadge";
import LeadSLAIndicator from "./components/LeadSLAIndicator";
import LeadDuplicateWarning from "./components/LeadDuplicateWarning";
import LeadConvertDialog from "./components/LeadConvertDialog";
import LeadImportDialog from "./components/LeadImportDialog";
import LeadAssignmentDialog from "./components/LeadAssignmentDialog";

const defaultColumnOrder = [
  "actions",
  "strName",
  "strEmail",
  "strPhone",
  "strCompanyName",
  "strSource",
  "strStatus",
  "intLeadScore",
  "indicators",
  "strAssignedToName",
  "dtCreatedOn",
  "bolIsActive",
];

const LeadList: React.FC = () => {
  const navigate = useNavigate();
  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ListModules.CRM_LEAD, Users);

  // Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Filters
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterIsActive, setFilterIsActive] = useState<string>("");
  const [filterSLABreached, setFilterSLABreached] = useState<string>("");
  const [filterHasDuplicates, setFilterHasDuplicates] = useState<string>("");
  const [filterMinScore, setFilterMinScore] = useState<string>("");
  const [filterMaxScore, setFilterMaxScore] = useState<string>("");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<LeadListDto | null>(null);
  const { mutate: deleteLead, isPending: isDeleting } = useDeleteLead();

  // Convert
  const [convertTarget, setConvertTarget] = useState<LeadListDto | null>(null);

  // Import / Export
  const [showImport, setShowImport] = useState(false);
  const { mutate: exportLeads, isPending: isExporting } = useExportLeads();

  // Assignment
  const [showAssignment, setShowAssignment] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Analytics mini-view
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { data: analytics } = useLeadAnalytics();

  // List preferences
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("crm-leads", {
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
    setColumnOrder,
    columnWidths,
    setColumnWidths,
    resetAll,
  } = useTableLayout("crm-leads", defaultColumnOrder, ["actions"]);

  // Sort mapping
  const sortBy = sorting.columnKey || "dtCreatedOn";
  const ascending = sorting.direction === "asc";

  // Build filter params
  const filterParams: LeadFilterParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      strStatus: filterStatus || undefined,
      strSource: filterSource || undefined,
      bolIsActive:
        filterIsActive === "" ? undefined : filterIsActive === "true",
      bolIsSLABreached:
        filterSLABreached === "" ? undefined : filterSLABreached === "true",
      bolHasDuplicates:
        filterHasDuplicates === ""
          ? undefined
          : filterHasDuplicates === "true",
      intMinScore: filterMinScore ? parseInt(filterMinScore, 10) : undefined,
      intMaxScore: filterMaxScore ? parseInt(filterMaxScore, 10) : undefined,
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      sortBy,
      ascending,
    }),
    [
      debouncedSearch,
      filterStatus,
      filterSource,
      filterIsActive,
      filterSLABreached,
      filterHasDuplicates,
      filterMinScore,
      filterMaxScore,
      pagination.pageNumber,
      pagination.pageSize,
      sortBy,
      ascending,
    ]
  );

  // Data fetch
  const { data: leadsResponse, isLoading } = useLeads(filterParams);
  const { data: users } = useModuleUsers();

  const userMap = useMemo(() => {
    if (!users) return new Map<string, string>();
    return new Map(users.map((u) => [u.strUserGUID, u.strName]));
  }, [users]);

  // Map response to standardized format
  const pagedData = useMemo(() => {
    if (!leadsResponse)
      return { items: [] as LeadListDto[], totalCount: 0, totalPages: 0 };
    return mapToStandardPagedResponse<LeadListDto>(
      leadsResponse.data ?? leadsResponse
    );
  }, [leadsResponse]);

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
    filterSource,
    filterIsActive,
    filterSLABreached,
    filterHasDuplicates,
    filterMinScore,
    filterMaxScore,
  ].filter((v) => v !== "").length;

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilterStatus("");
    setFilterSource("");
    setFilterIsActive("");
    setFilterSLABreached("");
    setFilterHasDuplicates("");
    setFilterMinScore("");
    setFilterMaxScore("");
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
    deleteLead(
      { id: deleteTarget.strLeadGUID },
      {
        onSettled: () => setDeleteTarget(null),
      }
    );
  };

  // Selection toggle
  const toggleLeadSelection = useCallback((leadId: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  }, []);

  // Handle export
  const handleExport = (format: "csv" | "excel") => {
    exportLeads({ params: filterParams, format });
  };

  // Columns
  const columns: DataTableColumn<LeadListDto>[] = useMemo(
    () => [
      ...(canAccess(menuItems, FormModules.CRM_LEAD, Actions.EDIT) ||
        canAccess(menuItems, FormModules.CRM_LEAD, Actions.DELETE)
        ? [
          {
            key: "actions",
            header: "Actions",
            cell: (item: LeadListDto) => (
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedLeads.has(item.strLeadGUID)}
                  onChange={() => toggleLeadSelection(item.strLeadGUID)}
                  className="rounded border-gray-300"
                />
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
                      FormModules.CRM_LEAD,
                      Actions.EDIT
                    ) && (
                        <DropdownMenuItem
                          onClick={() =>
                            openEditInNewTab(
                              `/crm/leads/${item.strLeadGUID}`
                            )
                          }
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                    {item.strStatus === "Qualified" &&
                      canAccess(
                        menuItems,
                        FormModules.CRM_LEAD,
                        Actions.EDIT
                      ) && (
                        <DropdownMenuItem
                          onClick={() => setConvertTarget(item)}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                          Convert
                        </DropdownMenuItem>
                      )}
                    {item.bolHasDuplicates && (
                      <DropdownMenuItem
                        onClick={() =>
                          openEditInNewTab(
                            `/crm/leads/${item.strLeadGUID}`
                          )
                        }
                      >
                        <GitMerge className="h-3.5 w-3.5 mr-2" />
                        View Duplicates
                      </DropdownMenuItem>
                    )}
                    {canAccess(
                      menuItems,
                      FormModules.CRM_LEAD,
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
              </div>
            ),
            sortable: false,
            width: "90px",
          } as DataTableColumn<LeadListDto>,
        ]
        : []),
      {
        key: "strName",
        header: "Name",
        cell: (item: LeadListDto) => (
          <div
            className="font-medium text-primary cursor-pointer hover:underline"
            onClick={() =>
              openEditInNewTab(`/crm/leads/${item.strLeadGUID}`)
            }
          >
            {item.strFirstName} {item.strLastName}
          </div>
        ),
        sortable: true,
        width: "200px",
      },
      {
        key: "strEmail",
        header: "Email",
        cell: (item: LeadListDto) => (
          <span className="text-sm">{item.strEmail}</span>
        ),
        sortable: true,
        width: "220px",
      },
      {
        key: "strPhone",
        header: "Phone",
        cell: (item: LeadListDto) => (
          <span className="text-sm">{item.strPhone || "-"}</span>
        ),
        sortable: false,
        width: "140px",
      },
      {
        key: "strCompanyName",
        header: "Company",
        cell: (item: LeadListDto) => (
          <span className="text-sm">{item.strCompanyName || "-"}</span>
        ),
        sortable: true,
        width: "180px",
      },
      {
        key: "strSource",
        header: "Source",
        cell: (item: LeadListDto) => (
          <LeadSourceBadge source={item.strSource} />
        ),
        sortable: true,
        width: "150px",
      },
      {
        key: "strStatus",
        header: "Status",
        cell: (item: LeadListDto) => (
          <LeadStatusBadge status={item.strStatus} />
        ),
        sortable: true,
        width: "130px",
      },
      {
        key: "intLeadScore",
        header: "Score",
        cell: (item: LeadListDto) => (
          <LeadScoreBadge score={item.intLeadScore} />
        ),
        sortable: true,
        width: "120px",
      },
      {
        key: "indicators",
        header: "Indicators",
        cell: (item: LeadListDto) => (
          <div className="flex items-center gap-1 flex-wrap">
            <LeadAgingBadge
              daysSinceLastActivity={item.intDaysSinceLastActivity}
              lastActivityDate={item.dtLastActivityOn}
            />
            <LeadSLAIndicator
              isSLABreached={item.bolIsSLABreached}
              status={item.strStatus}
            />
            <LeadDuplicateWarning
              hasDuplicates={item.bolHasDuplicates}
              compact
            />
          </div>
        ),
        sortable: false,
        width: "180px",
      },
      {
        key: "strAssignedToName",
        header: "Assigned To",
        cell: (item: LeadListDto) => (
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
        cell: (item: LeadListDto) => (
          <div className="whitespace-nowrap text-sm">
            {item.dtCreatedOn
              ? format(new Date(item.dtCreatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        sortable: true,
        width: "180px",
      },
      {
        key: "bolIsActive",
        header: "Active",
        cell: (item: LeadListDto) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${item.bolIsActive
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              }`}
          >
            {item.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
        width: "100px",
      },
    ],
    [
      menuItems,
      openEditInNewTab,
      selectedLeads,
      toggleLeadSelection,
      userMap,
    ]
  );

  return (
    <CustomContainer>
      <PageHeader
        title="Leads"
        description="Manage and track your sales leads"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <WithPermission
              module={FormModules.CRM_LEAD}
              action={Actions.SAVE}
            >
              <Button
                onClick={() => navigate("/crm/leads/create")}
                className="h-9 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                New Lead
              </Button>
            </WithPermission>
          </div>
        }
      />

      {/* Analytics Mini Funnel */}
      {showAnalytics && analytics && (
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Lead Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {analytics.funnel.map((stage) => (
                <div key={stage.strStatus} className="text-center">
                  <p className="text-2xl font-bold text-foreground">{stage.intCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {stage.strStatus}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stage.dblPercentage.toFixed(1)}%
                  </p>
                </div>
              ))}
              <div className="text-center border-l pl-4">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {analytics.dblConversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Conversion Rate
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {analytics.dblAvgTimeToConversionDays.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg Days to Convert
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Action Bar */}
      {selectedLeads.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-foreground">
            {selectedLeads.size} lead{selectedLeads.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowAssignment(true)}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Assign
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setSelectedLeads(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="h-9"
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1" />
              Funnel
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => handleExport("csv")}
                  disabled={isExporting}
                >
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport("excel")}
                  disabled={isExporting}
                >
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <WithPermission
              module={FormModules.CRM_LEAD}
              action={Actions.SAVE}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImport(true)}
                className="h-9"
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Import
              </Button>
            </WithPermission>

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
                    Lead Status
                  </label>
                  <Select
                    value={filterStatus || "__all__"}
                    onValueChange={(v) => setFilterStatus(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Statuses</SelectItem>
                      {LEAD_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Source
                  </label>
                  <Select
                    value={filterSource || "__all__"}
                    onValueChange={(v) => setFilterSource(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Sources</SelectItem>
                      {LEAD_SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s === "ColdCall"
                            ? "Cold Call"
                            : s === "TradeShow"
                              ? "Trade Show"
                              : s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Active Status
                  </label>
                  <Select
                    value={filterIsActive || "__all__"}
                    onValueChange={(v) => setFilterIsActive(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    SLA Status
                  </label>
                  <Select
                    value={filterSLABreached || "__all__"}
                    onValueChange={(v) => setFilterSLABreached(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      <SelectItem value="true">SLA Breached</SelectItem>
                      <SelectItem value="false">Within SLA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Duplicates
                  </label>
                  <Select
                    value={filterHasDuplicates || "__all__"}
                    onValueChange={(v) => setFilterHasDuplicates(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      <SelectItem value="true">Has Duplicates</SelectItem>
                      <SelectItem value="false">No Duplicates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Min Score
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={filterMinScore}
                    onChange={(e) => setFilterMinScore(e.target.value)}
                    placeholder="0"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/90">
                    Max Score
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={filterMaxScore}
                    onChange={(e) => setFilterMaxScore(e.target.value)}
                    placeholder="100"
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

      {/* Data Table */}
      <DataTable<LeadListDto>
        data={pagedData.items}
        columns={columns}
        keyExtractor={(item) => item.strLeadGUID}
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
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No leads found</p>
            <p className="text-sm mt-1">
              {debouncedSearch || activeFilterCount > 0
                ? "Try adjusting your search or filters"
                : "Create your first lead to get started"}
            </p>
          </div>
        }
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        description={`Are you sure you want to delete "${deleteTarget?.strFirstName} ${deleteTarget?.strLastName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />

      {/* Convert Dialog */}
      {convertTarget && (
        <LeadConvertDialog
          open={!!convertTarget}
          onOpenChange={(open) => !open && setConvertTarget(null)}
          leadId={convertTarget.strLeadGUID}
          leadName={`${convertTarget.strFirstName} ${convertTarget.strLastName}`}
        />
      )}

      {/* Import Dialog */}
      <LeadImportDialog
        open={showImport}
        onOpenChange={setShowImport}
      />

      {/* Assignment Dialog */}
      {showAssignment && selectedLeads.size > 0 && (
        <LeadAssignmentDialog
          open={showAssignment}
          onOpenChange={setShowAssignment}
          selectedLeadIds={Array.from(selectedLeads)}
          onSuccess={() => setSelectedLeads(new Set())}
        />
      )}
    </CustomContainer>
  );
};

export default LeadList;
