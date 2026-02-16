import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { useUserRoles, useUserRights } from "@/hooks";
import { useExportUserRoles } from "@/hooks/api/central/use-user-roles";
import { useModuleUsers } from "@/hooks/api";
import { useMenuIcon, useTableLayout } from "@/hooks/common";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import {
  Actions,
  ListModules,
  FormModules,
  SpecialModules,
} from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";
import { ExportButton } from "@/components/ui/export-button";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { MultiSelect } from "@/components/ui/select/multi-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, ShieldCheck, Filter } from "lucide-react";
import { WithPermission } from "@/components/ui/with-permission";
import type { UserRole } from "@/types/central/user-role";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

export default function UserRoleList() {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const { menuItems } = useUserRights();

  const HeaderIcon = useMenuIcon(ListModules.USER_ROLE, ShieldCheck);

  const defaultColumnOrder = [
    "actions",
    "strName",
    "bolIsActive",
    "strDesc",
    "createdBy",
    "createdOn",
    "updatedBy",
    "updatedOn",
  ];

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("userRole", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strName",
        direction: "asc",
      },
    });

  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    createdBy: false,
    updatedBy: false,
  });

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
  } = useTableLayout("userRoleList", defaultColumnOrder, ["actions"], {
    actions: true,
    strName: true,
    strDesc: true,
    bolIsActive: true,
    createdBy: true,
    createdOn: true,
    updatedBy: true,
    updatedOn: true,
  });

  const exportUserRolesMutation = useExportUserRoles();

  const { data: users = [], isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    dropdownOpen.createdBy || dropdownOpen.updatedBy
  );

  const { data: userRolesResponse, isLoading } = useUserRoles({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy: sorting.columnKey || "strName",
    ascending: sorting.direction === "asc",
    bolIsActive: isActive !== null ? isActive : undefined,
    strCreatedByGUIDs:
      selectedCreatedBy.length > 0 ? selectedCreatedBy : undefined,
    strUpdatedByGUIDs:
      selectedUpdatedBy.length > 0 ? selectedUpdatedBy : undefined,
  });

  const handleAddRole = () => {
    navigate("/user-role/new");
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  useEffect(() => {
    if (userRolesResponse?.data) {
      updateResponseData({
        totalCount: userRolesResponse.data.totalCount || 0,
        totalPages: userRolesResponse.data.totalPages || 1,
      });
    }
  }, [userRolesResponse, updateResponseData]);

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
  };

  const handleStatusChange = (value: string) => {
    if (value === "active") {
      setIsActive(true);
    } else if (value === "inactive") {
      setIsActive(false);
    } else {
      setIsActive(null);
    }
    setPagination({ pageNumber: 1 });
  };

  const handleCreatedByChange = (values: string[]) => {
    setSelectedCreatedBy(values);
    setPagination({ pageNumber: 1 });
  };

  const handleUpdatedByChange = (values: string[]) => {
    setSelectedUpdatedBy(values);
    setPagination({ pageNumber: 1 });
  };

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

  const columns = useMemo(() => {
    const baseColumns: DataTableColumn<UserRole>[] = [];

    const hasEditPermission = canAccess(
      menuItems,
      FormModules.USER_ROLE,
      Actions.EDIT
    );
    const hasUserPrivilegePermission = canAccess(
      menuItems,
      SpecialModules.USER_PRIVILEGE,
      Actions.VIEW
    );

    if (hasEditPermission || hasUserPrivilegePermission) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        width: "150px",
        cell: (role: UserRole) => (
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            {hasEditPermission && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditInNewTab(`/user-role/${role.strUserRoleGUID}`);
                }}
                title="Edit user role"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            )}

            {hasUserPrivilegePermission && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user-privilege?roleId=${role.strUserRoleGUID}`);
                }}
                title="Manage rights"
                disabled={role.bolSystemCreated}
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="sr-only">Rights</span>
              </Button>
            )}
          </div>
        ),
      });
    }

    baseColumns.push({
      key: "strName",
      header: "Name",
      width: "180px",
      cell: (role: UserRole) => (
        <div className="truncate font-medium" title={role.strName}>
          {role.strName}
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "bolIsActive",
      header: "Status",
      width: "120px",
      cell: (role: UserRole) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            role.bolIsActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {role.bolIsActive ? "Active" : "Inactive"}
        </span>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "strDesc",
      header: "Description",
      width: "250px",
      cell: (role: UserRole) => (
        <div className="truncate" title={role.strDesc || "-"}>
          {role.strDesc || "-"}
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "createdBy",
      header: "Created By",
      width: "180px",
      cell: (role: UserRole) => (
        <div className="truncate" title={role.strCreatedBy || "-"}>
          {role.strCreatedBy || "-"}
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "createdOn",
      header: "Created On",
      width: "220px",
      cell: (role: UserRole) => (
        <span>
          {role.dtCreatedOn ? formatDate(role.dtCreatedOn, true) : "-"}
        </span>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "updatedBy",
      header: "Updated By",
      width: "180px",
      cell: (role: UserRole) => (
        <div className="truncate" title={role.strUpdatedBy || "-"}>
          {role.strUpdatedBy || "-"}
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "updatedOn",
      header: "Updated On",
      width: "220px",
      cell: (role: UserRole) => (
        <span>
          {role.dtUpdatedOn ? formatDate(role.dtUpdatedOn, true) : "-"}
        </span>
      ),
      sortable: true,
    });

    return baseColumns;
  }, [navigate, menuItems, openEditInNewTab]);

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
      <PageHeader
        title="User Role Management"
        description="Manage user roles and permissions across your organization"
        icon={HeaderIcon}
        actions={
          <>
            <WithPermission
              module={ListModules.USER_ROLE}
              action={Actions.EXPORT}
            >
              <ExportButton exportMutation={exportUserRolesMutation} />
            </WithPermission>
            <WithPermission
              module={FormModules.USER_ROLE}
              action={Actions.SAVE}
            >
              <Button onClick={handleAddRole} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </WithPermission>
          </>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <SearchInput
            placeholder="Search roles..."
            onSearchChange={setDebouncedSearch}
            debounceDelay={500}
            className="max-w-full sm:max-w-md sm:flex-1"
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
              {(isActive !== null ||
                selectedCreatedBy.length > 0 ||
                selectedUpdatedBy.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {(isActive !== null ? 1 : 0) +
                    selectedCreatedBy.length +
                    selectedUpdatedBy.length}
                </span>
              )}
            </Button>

            <div className="h-9">
              <DraggableColumnVisibility
                columns={orderedColumns}
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
                    "userRoleList_column_order",
                    JSON.stringify(order)
                  );
                }}
                onResetAll={resetAll}
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
                Filter user roles by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={
                      isActive === null
                        ? "all"
                        : isActive
                          ? "active"
                          : "inactive"
                    }
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Created By
                  </label>
                  <MultiSelect
                    options={
                      users.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName,
                      })) || []
                    }
                    selectedValues={selectedCreatedBy}
                    onChange={handleCreatedByChange}
                    placeholder="Filter by creator"
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        createdBy: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.createdBy && isUsersLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Updated By
                  </label>
                  <MultiSelect
                    options={
                      users.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName,
                      })) || []
                    }
                    selectedValues={selectedUpdatedBy}
                    onChange={handleUpdatedByChange}
                    placeholder="Filter by updater"
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        updatedBy: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.updatedBy && isUsersLoading}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsActive(null);
                    setSelectedCreatedBy([]);
                    setSelectedUpdatedBy([]);
                    setPagination({ pageNumber: 1 });
                  }}
                  disabled={
                    isActive === null &&
                    selectedCreatedBy.length === 0 &&
                    selectedUpdatedBy.length === 0
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton
          columns={orderedColumns
            .filter((col) => columnVisibility[col.key] !== false)
            .map((col) => ({
              header: String(col.header),
              width: col.width,
            }))}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={(userRolesResponse?.data?.items || []) as unknown as UserRole[]}
          columns={orderedColumns.filter(
            (col) => columnVisibility[col.key] !== false
          )}
          keyExtractor={(role: UserRole) => role.strUserRoleGUID}
          sortBy={sorting.columnKey || ""}
          ascending={sorting.direction === "asc"}
          onSort={handleSort}
          loading={false}
          isTextWrapped={isTextWrapped}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "userRoleList_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            debouncedSearch ||
            isActive !== null ||
            selectedCreatedBy.length > 0 ||
            selectedUpdatedBy.length > 0 ? (
              <>
                No roles found
                {debouncedSearch && ` matching "${debouncedSearch}"`}
                {(isActive !== null ||
                  selectedCreatedBy.length > 0 ||
                  selectedUpdatedBy.length > 0) &&
                  " with the selected filters"}
                .
              </>
            ) : (
              <>No roles found. Click "Add Role" to create one.</>
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
          pageSizeOptions={[5, 10, 20, 50]}
          maxHeight="calc(100vh - 350px)"
        />
      )}
    </CustomContainer>
  );
}
