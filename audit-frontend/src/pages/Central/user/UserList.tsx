import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Filter, Plus, Users } from "lucide-react";

import type { User } from "@/types/central/user";

import { Actions, FormModules, ListModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";

import { formatDate, formatTimeToAmPm } from "@/lib/utils";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { useUserRights } from "@/hooks";
import { useExportUsers, useUsers } from "@/hooks/api/central/use-users";
import { useModuleUsers } from "@/hooks/api";

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
import { AvatarImage } from "@/components/ui/avatar-image";
import { ExportButton } from "@/components/ui/export-button";

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    createdBy: false,
    updatedBy: false,
  });

  const { menuItems } = useUserRights();

  const HeaderIcon = useMenuIcon(ListModules.USER, Users);
  const exportUsersMutation = useExportUsers();

  const defaultColumnOrder = [
    "actions",
    "profileImg",
    "strName",
    "bolIsActive",
    "strEmailId",
    "strMobileNo",
    "dtWorkingStartTime",
    "dtWorkingEndTime",
    "strTimeZone",
    "dtBirthDate",
    "strCreatedBy",
    "dtCreatedOn",
    "strUpdatedBy",
    "dtUpdatedOn",
  ];

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "user",
    {
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
    }
  );

  const sortBy = sorting.columnKey || "strName";
  const ascending = sorting.direction === "asc";

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
  } = useTableLayout("userList", defaultColumnOrder, ["actions"], {
    actions: true,
    profileImg: true,
    strName: true,
    bolIsActive: true,
    strEmailId: true,
    strMobileNo: true,
    dtWorkingStartTime: true,
    dtWorkingEndTime: true,
    strTimeZone: true,
    dtBirthDate: true,
    strCreatedBy: true,
    dtCreatedOn: true,
    strUpdatedBy: true,
    dtUpdatedOn: true,
  });

  const {
    data: usersResponse,
    isLoading,
    error,
  } = useUsers({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy,
    ascending,
    bolIsActive: isActive === null ? undefined : isActive,
  });

  const { data: users = [], isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    dropdownOpen.createdBy || dropdownOpen.updatedBy
  );

  useEffect(() => {
    if (usersResponse?.data) {
      setPagination({
        pageNumber: usersResponse.data.pageNumber,
        pageSize: usersResponse.data.pageSize,
        totalCount: usersResponse.data.totalCount,
        totalPages: usersResponse.data.totalPages,
      });
    }
  }, [usersResponse, setPagination]);

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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSorting({
        direction: ascending ? "desc" : "asc",
      });
    } else {
      setSorting({
        columnKey: column,
        direction: "asc",
      });
    }
    setPagination({
      pageNumber: 1,
    });
  };

  const clearFilters = () => {
    setDebouncedSearch("");
    setIsActive(null);
    setSelectedCreatedBy([]);
    setSelectedUpdatedBy([]);
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns: DataTableColumn<User>[] = useMemo(
    () => [
      ...(canAccess(menuItems, FormModules.USER, Actions.EDIT)
        ? [
            {
              key: "actions",
              header: "Actions",
              cell: (user: User) => (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditInNewTab(`/user/${user.strUserGUID}`);
                    }}
                    className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ),
              sortable: false,
            },
          ]
        : []),
      {
        key: "profileImg",
        header: "Profile",
        width: "100px",
        cell: (user: User) => (
          <AvatarImage
            imagePath={user.strProfileImg}
            alt={`${user.strName} profile`}
            size="md"
            type="user"
          />
        ),
      },
      {
        key: "strName",
        header: "Name",
        width: "180px",
        cell: (user) => (
          <div className="truncate" title={user.strName}>
            <span className="font-medium">{user.strName}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "100px",
        cell: (user) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {user.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
      },
      {
        key: "strEmailId",
        header: "Email",
        width: "200px",
        cell: (user) => (
          <div className="truncate" title={user.strEmailId || "-"}>
            {user.strEmailId || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strMobileNo",
        header: "Mobile",
        width: "150px",
        cell: (user) => (
          <div className="truncate" title={user.strMobileNo || "-"}>
            {user.strMobileNo || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtWorkingStartTime",
        header: "Start Time",
        width: "130px",
        cell: (user) => (
          <div
            className="truncate"
            title={formatTimeToAmPm(user.dtWorkingStartTime)}
          >
            {formatTimeToAmPm(user.dtWorkingStartTime)}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtWorkingEndTime",
        header: "End Time",
        width: "120px",
        cell: (user) => (
          <div
            className="truncate"
            title={formatTimeToAmPm(user.dtWorkingEndTime)}
          >
            {formatTimeToAmPm(user.dtWorkingEndTime)}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTimeZone",
        header: "Timezone",
        width: "180px",
        cell: (user) => (
          <div className="truncate" title={user.strTimeZone || "-"}>
            {user.strTimeZone || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtBirthDate",
        header: "Birth Date",
        width: "130px",
        cell: (user) => (
          <div
            className="truncate"
            title={user.dtBirthDate ? formatDate(user.dtBirthDate) : "-"}
          >
            {user.dtBirthDate ? formatDate(user.dtBirthDate) : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCreatedBy",
        header: "Created By",
        width: "180px",
        cell: (user) => (
          <div className="truncate" title={user.strCreatedBy || "-"}>
            {user.strCreatedBy || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "220px",
        cell: (user) => (
          <div
            className="truncate"
            title={user.dtCreatedOn ? formatDate(user.dtCreatedOn, true) : "-"}
          >
            {user.dtCreatedOn ? formatDate(user.dtCreatedOn, true) : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strUpdatedBy",
        header: "Updated By",
        width: "180px",
        cell: (user) => (
          <div className="truncate" title={user.strUpdatedBy || "-"}>
            {user.strUpdatedBy || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "220px",
        cell: (user) => (
          <div
            className="truncate"
            title={user.dtUpdatedOn ? formatDate(user.dtUpdatedOn, true) : "-"}
          >
            {user.dtUpdatedOn ? formatDate(user.dtUpdatedOn, true) : "-"}
          </div>
        ),
        sortable: true,
      },
    ],
    [menuItems, openEditInNewTab]
  );

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
        title="User Management"
        description="Manage users, roles, and permissions across your organization"
        icon={HeaderIcon}
        actions={
          <>
            <WithPermission
              module={ListModules.USER}
              action={Actions.EXPORT}
              fallback={<></>}
            >
              <ExportButton exportMutation={exportUsersMutation} />
            </WithPermission>

            <WithPermission
              module={FormModules.USER}
              action={Actions.SAVE}
              fallback={<></>}
            >
              <Button
                onClick={() => navigate("/user/new")}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </WithPermission>
          </>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search users..."
            onSearchChange={setDebouncedSearch}
            className="w-full sm:max-w-md sm:flex-1"
          />

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-row sm:items-center">
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
                    "userList_column_order",
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
                Filter users by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={
                      isActive === null ? "all" : isActive ? "true" : "false"
                    }
                    onValueChange={(value) => {
                      if (value === "all") {
                        setIsActive(null);
                      } else {
                        setIsActive(value === "true");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Created By
                  </label>
                  <MultiSelect
                    placeholder="Filter by created by"
                    options={
                      users?.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName,
                      })) || []
                    }
                    selectedValues={selectedCreatedBy}
                    onChange={setSelectedCreatedBy}
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
                    placeholder="Filter by updated by"
                    options={
                      users?.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName,
                      })) || []
                    }
                    selectedValues={selectedUpdatedBy}
                    onChange={setSelectedUpdatedBy}
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
                  onClick={clearFilters}
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
        <DataTable<User>
          data={error ? [] : usersResponse?.data?.items || []}
          columns={orderedColumns.filter(
            (col) => columnVisibility[col.key] !== false
          )}
          pagination={{
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount: pagination.totalCount || 0,
            totalPages: pagination.totalPages || 0,
            onPageChange: goToPage,
            onPageSizeChange: handlePageSizeChange,
          }}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSort}
          pageSizeOptions={[5, 10, 20, 50]}
          keyExtractor={(user) => user.strUserGUID}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "userList_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            error ? (
              <>An error occurred loading users. Please try again later.</>
            ) : debouncedSearch ? (
              <>No users found matching "{debouncedSearch}".</>
            ) : (
              <>No users found. Click "Add User" to create one.</>
            )
          }
          maxHeight="calc(100vh - 350px)"
        />
      )}
    </CustomContainer>
  );
};

export default UserList;
