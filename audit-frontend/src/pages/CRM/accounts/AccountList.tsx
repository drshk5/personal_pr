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
  Building2,
  Upload,
  Download,
  Archive,
  RotateCcw,
} from "lucide-react";

import type { AccountListDto, AccountFilterParams } from "@/types/CRM/account";
import { ACCOUNT_INDUSTRIES } from "@/types/CRM/account";
import {
  useAccounts,
  useDeleteAccount,
  useExportAccounts,
  useBulkArchiveAccounts,
  useBulkRestoreAccounts,
} from "@/hooks/api/CRM/use-accounts";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useTableLayout } from "@/hooks/common/use-table-layout";
import { useUserRights } from "@/hooks/common/use-user-rights";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
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
import AccountImportDialog from "./components/AccountImportDialog";

const defaultColumnOrder = [
  "actions",
  "strAccountName",
  "strIndustry",
  "strPhone",
  "strEmail",
  "intContactCount",
  "intOpenOpportunityCount",
  "dblTotalOpportunityValue",
  "strAssignedToName",
  "dtCreatedOn",
  "bolIsActive",
];

const AccountList: React.FC = () => {
  const navigate = useNavigate();
  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ListModules.CRM_ACCOUNT, Building2);

  // Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Filters
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterIndustry, setFilterIndustry] = useState<string>("");
  const [filterIsActive, setFilterIsActive] = useState<string>("");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<AccountListDto | null>(null);
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount();
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
    new Set()
  );
  const { mutate: bulkArchiveAccounts, isPending: isBulkArchiving } =
    useBulkArchiveAccounts();
  const { mutate: bulkRestoreAccounts, isPending: isBulkRestoring } =
    useBulkRestoreAccounts();

  // Import / Export
  const [showImport, setShowImport] = useState(false);
  const { mutate: exportAccounts, isPending: isExporting } = useExportAccounts();

  // List preferences
  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("crm-accounts", {
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
  } = useTableLayout("crm-accounts", defaultColumnOrder, ["actions"]);

  // Sort mapping
  const sortBy = sorting.columnKey || "dtCreatedOn";
  const ascending = sorting.direction === "asc";

  // Build filter params
  const filterParams: AccountFilterParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      strIndustry: filterIndustry || undefined,
      bolIsActive:
        filterIsActive === "" ? undefined : filterIsActive === "true",
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      sortBy,
      ascending,
    }),
    [
      debouncedSearch,
      filterIndustry,
      filterIsActive,
      pagination.pageNumber,
      pagination.pageSize,
      sortBy,
      ascending,
    ]
  );

  // Data fetch
  const { data: accountsResponse, isLoading } = useAccounts(filterParams);

  // Map response to standardized format
  const pagedData = useMemo(() => {
    if (!accountsResponse)
      return { items: [] as AccountListDto[], totalCount: 0, totalPages: 0 };
    return mapToStandardPagedResponse<AccountListDto>(
      accountsResponse.data ?? accountsResponse
    );
  }, [accountsResponse]);

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
  const activeFilterCount = [filterIndustry, filterIsActive].filter(
    (v) => v !== ""
  ).length;

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilterIndustry("");
    setFilterIsActive("");
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
    deleteAccount(
      { id: deleteTarget.strAccountGUID },
      {
        onSettled: () => setDeleteTarget(null),
      }
    );
  };

  const handleExport = () => {
    exportAccounts({ params: filterParams });
  };

  const toggleAccountSelection = useCallback((accountId: string) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    const visibleIds = pagedData.items.map((item) => item.strAccountGUID);
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedAccounts.has(id));

    if (allVisibleSelected) {
      setSelectedAccounts((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
      return;
    }

    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }, [pagedData.items, selectedAccounts]);

  const handleBulkArchive = useCallback(() => {
    if (selectedAccounts.size === 0) return;

    bulkArchiveAccounts(
      { guids: Array.from(selectedAccounts) },
      {
        onSuccess: () => setSelectedAccounts(new Set()),
      }
    );
  }, [bulkArchiveAccounts, selectedAccounts]);

  const handleBulkRestore = useCallback(() => {
    if (selectedAccounts.size === 0) return;

    bulkRestoreAccounts(
      { guids: Array.from(selectedAccounts) },
      {
        onSuccess: () => setSelectedAccounts(new Set()),
      }
    );
  }, [bulkRestoreAccounts, selectedAccounts]);

  const allVisibleSelected = useMemo(() => {
    if (pagedData.items.length === 0) return false;
    return pagedData.items.every((item) =>
      selectedAccounts.has(item.strAccountGUID)
    );
  }, [pagedData.items, selectedAccounts]);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  // Columns
  const columns: DataTableColumn<AccountListDto>[] = useMemo(
    () => [
      ...(canAccess(menuItems, FormModules.CRM_ACCOUNT, Actions.EDIT) ||
      canAccess(menuItems, FormModules.CRM_ACCOUNT, Actions.DELETE)
        ? [
            {
              key: "actions",
              header: (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllSelection}
                    className="rounded border-gray-300"
                    aria-label="Select all visible accounts"
                  />
                  <span>Actions</span>
                </div>
              ),
              cell: (item: AccountListDto) => (
                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.has(item.strAccountGUID)}
                    onChange={() => toggleAccountSelection(item.strAccountGUID)}
                    className="rounded border-gray-300"
                    aria-label={`Select account ${item.strAccountName}`}
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
                        FormModules.CRM_ACCOUNT,
                        Actions.EDIT
                      ) && (
                        <DropdownMenuItem
                          onClick={() =>
                            openEditInNewTab(
                              `/crm/accounts/${item.strAccountGUID}`
                            )
                          }
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canAccess(
                        menuItems,
                        FormModules.CRM_ACCOUNT,
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
              width: "110px",
            } as DataTableColumn<AccountListDto>,
          ]
        : []),
      {
        key: "strAccountName",
        header: "Account Name",
        cell: (item: AccountListDto) => (
          <div
            className="font-medium text-primary cursor-pointer hover:underline"
            onClick={() =>
              openEditInNewTab(`/crm/accounts/${item.strAccountGUID}`)
            }
          >
            {item.strAccountName}
          </div>
        ),
        sortable: true,
        width: "220px",
      },
      {
        key: "strIndustry",
        header: "Industry",
        cell: (item: AccountListDto) => (
          <span className="text-sm">{item.strIndustry || "-"}</span>
        ),
        sortable: true,
        width: "150px",
      },
      {
        key: "strPhone",
        header: "Phone",
        cell: (item: AccountListDto) => (
          <span className="text-sm">{item.strPhone || "-"}</span>
        ),
        sortable: false,
        width: "140px",
      },
      {
        key: "strEmail",
        header: "Email",
        cell: (item: AccountListDto) => (
          <span className="text-sm">{item.strEmail || "-"}</span>
        ),
        sortable: true,
        width: "220px",
      },
      {
        key: "intContactCount",
        header: "Contacts",
        cell: (item: AccountListDto) => (
          <span className="text-sm font-medium">{item.intContactCount}</span>
        ),
        sortable: true,
        width: "100px",
      },
      {
        key: "intOpenOpportunityCount",
        header: "Open Opps",
        cell: (item: AccountListDto) => (
          <span className="text-sm font-medium">
            {item.intOpenOpportunityCount}
          </span>
        ),
        sortable: true,
        width: "110px",
      },
      {
        key: "dblTotalOpportunityValue",
        header: "Pipeline Value",
        cell: (item: AccountListDto) => (
          <span className="text-sm font-medium">
            {item.dblTotalOpportunityValue > 0
              ? formatCurrency(item.dblTotalOpportunityValue)
              : "-"}
          </span>
        ),
        sortable: true,
        width: "130px",
      },
      {
        key: "strAssignedToName",
        header: "Assigned To",
        cell: (item: AccountListDto) => (
          <span className="text-sm">
            {item.strAssignedToName || item.strAssignedToGUID || "-"}
          </span>
        ),
        sortable: true,
        width: "160px",
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        cell: (item: AccountListDto) => (
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
        cell: (item: AccountListDto) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.bolIsActive
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
      allVisibleSelected,
      menuItems,
      openEditInNewTab,
      selectedAccounts,
      toggleAccountSelection,
      toggleAllSelection,
    ]
  );

  return (
    <CustomContainer>
      <PageHeader
        title="Accounts"
        description="Manage your business accounts"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <WithPermission
              module={FormModules.CRM_ACCOUNT}
              action={Actions.SAVE}
            >
              <Button
                onClick={() => navigate("/crm/accounts/create")}
                className="h-9 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                New Account
              </Button>
            </WithPermission>
          </div>
        }
      />

      {selectedAccounts.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-foreground">
            {selectedAccounts.size} account
            {selectedAccounts.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleBulkArchive}
              disabled={isBulkArchiving || isBulkRestoring}
            >
              <Archive className="h-3.5 w-3.5 mr-1" />
              {isBulkArchiving ? "Archiving..." : "Archive"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleBulkRestore}
              disabled={isBulkArchiving || isBulkRestoring}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              {isBulkRestoring ? "Restoring..." : "Restore"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setSelectedAccounts(new Set())}
              disabled={isBulkArchiving || isBulkRestoring}
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
              placeholder="Search accounts..."
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

            <WithPermission
              module={FormModules.CRM_ACCOUNT}
              action={Actions.EXPORT}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </WithPermission>

            <WithPermission
              module={FormModules.CRM_ACCOUNT}
              action={Actions.IMPORT}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setShowImport(true)}
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
                    Industry
                  </label>
                  <Select
                    value={filterIndustry}
                    onValueChange={setFilterIndustry}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Industries</SelectItem>
                      {ACCOUNT_INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
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
                    value={filterIsActive}
                    onValueChange={setFilterIsActive}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
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
      <DataTable<AccountListDto>
        data={pagedData.items}
        columns={columns}
        keyExtractor={(item) => item.strAccountGUID}
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
            <Building2 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No accounts found</p>
            <p className="text-sm mt-1">
              {debouncedSearch || activeFilterCount > 0
                ? "Try adjusting your search or filters"
                : "Create your first account to get started"}
            </p>
          </div>
        }
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Account"
        description={`Are you sure you want to delete "${deleteTarget?.strAccountName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />

      <AccountImportDialog
        open={showImport}
        onOpenChange={setShowImport}
      />
    </CustomContainer>
  );
};

export default AccountList;
