import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Users, ArrowLeft, Plus, Trash2, Filter, Edit } from "lucide-react";

import type { UserDetails } from "@/types/central/user-details";

import {
  useUserDetails,
  useDeleteUserDetail,
} from "@/hooks/api/central/use-user-details";
import { useActiveUsers } from "@/hooks/api/central/use-users";
import { useActiveUserRoles } from "@/hooks/api/central/use-user-roles";
import { useActiveYearsByOrganization } from "@/hooks/api/central/use-years";
import { useOrganization } from "@/hooks/api/central/use-organizations";
import { useTableLayout } from "@/hooks/common";
import { useListPreferences } from "@/hooks/common/use-list-preferences";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/select/multi-select";
import { SearchInput } from "@/components/shared/search-input";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { TeamMemberModal } from "./TeamMemberModal";

const OrganizationTeams: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const organizationId = searchParams.get("organizationId");

  const { data: organizationData } = useOrganization(
    organizationId || undefined
  );

  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("organizationTeams", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strUserName",
        direction: "asc",
      },
    });

  const [yearFilters, setYearFilters] = useState<string[]>([]);
  const [userFilters, setUserFilters] = useState<string[]>([]);
  const [userRoleFilters, setUserRoleFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    year: false,
    user: false,
    userRole: false,
  });

  const defaultColumnOrder = [
    "actions",
    "strUserName",
    "strYearName",
    "strUserRoleName",
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
  } = useTableLayout("organizationTeams", defaultColumnOrder, ["actions"]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingUserDetail, setEditingUserDetail] =
    useState<UserDetails | null>(null);
  const deleteUserDetail = useDeleteUserDetail();

  useEffect(() => {
    if (!organizationId) {
      navigate("/organization");
    }
  }, [organizationId, navigate]);

  useEffect(() => {
    setPagination({ pageNumber: 1 });
  }, [debouncedSearch, setPagination]);

  const { data: usersData, isLoading: isUserLoading } = useActiveUsers(
    undefined,
    dropdownOpen.user // Only fetch when dropdown is open
  );
  const { data: rolesData, isLoading: isRoleLoading } = useActiveUserRoles(
    undefined,
    dropdownOpen.userRole // Only fetch when dropdown is open
  );
  const { data: yearsData, isLoading: isYearLoading } =
    useActiveYearsByOrganization(organizationId || undefined, undefined, {
      enabled: dropdownOpen.year,
    });

  const {
    data: userDetailsResponse,
    isLoading,
    refetch,
  } = useUserDetails({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy: sorting.columnKey || "strUserName",
    ascending: sorting.direction === "asc",
    strOrganizationGUID: organizationId || undefined,
    ...(yearFilters.length > 0 && { strYearGUID: yearFilters.join(",") }),
    ...(userFilters.length > 0 && { strUserGUID: userFilters.join(",") }),
    ...(userRoleFilters.length > 0 && {
      strUserRoleGUID: userRoleFilters.join(","),
    }),
  });

  const teamMembers = useMemo(() => {
    if (!userDetailsResponse || !userDetailsResponse.data) {
      return [];
    }

    if (Array.isArray(userDetailsResponse.data.items)) {
      return userDetailsResponse.data.items;
    }

    return [];
  }, [userDetailsResponse]);

  useEffect(() => {
    if (userDetailsResponse?.data) {
      updateResponseData({
        totalCount: userDetailsResponse.data.totalCount || 0,
        totalPages: userDetailsResponse.data.totalPages || 0,
      });
    }
  }, [userDetailsResponse, updateResponseData]);

  const userOptions = useMemo(() => {
    const users = usersData || [];
    return users.map((user) => ({
      value: user.strUserGUID,
      label: user.strName || user.strEmailId || "Unknown",
    }));
  }, [usersData]);

  const roleOptions = useMemo(() => {
    const items = rolesData || [];
    return items.map((role: unknown) => ({
      value: (role as { strUserRoleGUID: string }).strUserRoleGUID,
      label: (role as { strName: string }).strName || "Unknown",
    }));
  }, [rolesData]);

  const yearOptions = useMemo(() => {
    const activeYears = yearsData || [];
    return activeYears.map((year: unknown) => ({
      value: (year as { strYearGUID: string }).strYearGUID,
      label: (year as { strName: string }).strName || "Unknown",
    }));
  }, [yearsData]);

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

  const handleYearFilterChange = (values: string[]) => {
    setYearFilters(values);
    setPagination({
      pageNumber: 1,
    });
  };

  const handleUserFilterChange = (values: string[]) => {
    setUserFilters(values);
    setPagination({
      pageNumber: 1,
    });
  };

  const handleUserRoleFilterChange = (values: string[]) => {
    setUserRoleFilters(values);
    setPagination({
      pageNumber: 1,
    });
  };

  const handleAddTeamMember = () => {
    setEditingUserDetail(null);
    setIsModalOpen(true);
  };

  const handleEditTeamMember = (userDetail: UserDetails) => {
    setEditingUserDetail(userDetail);
    setIsModalOpen(true);
  };

  const handleEditingUserChange = (userDetail: UserDetails) => {
    setEditingUserDetail(userDetail);
  };

  const handleDeleteTeamMember = (userDetailGUID: string, userName: string) => {
    setSelectedUserDetail({ id: userDetailGUID, name: userName });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUserDetail) {
      deleteUserDetail.mutate(selectedUserDetail.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedUserDetail(null);
          refetch();
        },
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUserDetail(null);
    refetch();
  };

  const columns = useMemo(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<UserDetails>[] = [
      {
        key: "actions",
        header: "Actions",
        width: "100px",
        cell: (userDetail) => (
          <div onClick={(e) => e.stopPropagation()} className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleEditTeamMember(userDetail);
              }}
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
              title="Edit team member"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTeamMember(
                  userDetail.strUserDetailGUID,
                  userDetail.strUserName || "this member"
                );
              }}
              className="h-8 w-8 text-destructive hover:text-destructive"
              title="Remove team member"
              disabled={deleteUserDetail.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        sortable: false,
      },
      {
        key: "strUserName",
        header: "Name",
        width: "400px",
        cell: (userDetail) => (
          <div
            className={getTextClass()}
            title={userDetail.strUserName || "N/A"}
          >
            <span className="font-medium">
              {userDetail.strUserName || "N/A"}
            </span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strYearName",
        header: "Year",
        width: "250px",
        cell: (userDetail) => (
          <div
            className={getTextClass()}
            title={userDetail.strYearName || "N/A"}
          >
            {userDetail.strYearName || "N/A"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strUserRoleName",
        header: "Role",
        width: "250px",
        cell: (userDetail) => (
          <div
            className={getTextClass()}
            title={userDetail.strUserRoleName || "N/A"}
          >
            {userDetail.strUserRoleName || "N/A"}
          </div>
        ),
        sortable: true,
      },
    ];

    return baseColumns;
  }, [isTextWrapped, deleteUserDetail.isPending]);

  const orderedColumns = useMemo(() => {
    // Preserve current order, append any new columns that might appear
    const map = new Map(columns.map((c) => [c.key, c]));
    const ordered: DataTableColumn<UserDetails>[] = [];
    columnOrder.forEach((key) => {
      const col = map.get(key);
      if (col) ordered.push(col);
    });
    // Append any columns not in order list
    columns.forEach((col) => {
      if (!columnOrder.includes(col.key)) ordered.push(col);
    });
    return ordered;
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <PageHeader
        title={`Organization Teams for ${
          organizationData?.strOrganizationName || ""
        }`}
        description="Manage team members and their roles"
        icon={Users}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate("/organization")}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Button>
            <Button onClick={handleAddTeamMember} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </>
        }
      />

      <div className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <SearchInput
            placeholder="Search team members..."
            onSearchChange={setDebouncedSearch}
            debounceDelay={500}
          />

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4 mr-1" />
            <span>Filters</span>
            {(yearFilters.length > 0 ||
              userFilters.length > 0 ||
              userRoleFilters.length > 0) && (
              <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                {yearFilters.length +
                  userFilters.length +
                  userRoleFilters.length}
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
            onResetAll={resetAll}
          />
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
                Filter team members by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <MultiSelect
                    options={yearOptions}
                    selectedValues={yearFilters}
                    initialMessage=""
                    onChange={handleYearFilterChange}
                    placeholder="Select years..."
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        year: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.year && isYearLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">User</label>
                  <MultiSelect
                    options={userOptions}
                    selectedValues={userFilters}
                    initialMessage=""
                    onChange={handleUserFilterChange}
                    placeholder="Select users..."
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        user: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.user && isUserLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <MultiSelect
                    options={roleOptions}
                    selectedValues={userRoleFilters}
                    initialMessage=""
                    onChange={handleUserRoleFilterChange}
                    placeholder="Select roles..."
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        userRole: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.userRole && isRoleLoading}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setYearFilters([]);
                    setUserFilters([]);
                    setUserRoleFilters([]);
                    setPagination({ pageNumber: 1 });
                  }}
                  disabled={
                    yearFilters.length === 0 &&
                    userFilters.length === 0 &&
                    userRoleFilters.length === 0
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="border-border-color rounded-md overflow-hidden mt-6">
          {isLoading ? (
            <TableSkeleton
              columns={["Actions", "Name", "Year", "Role"]}
              pageSize={pagination.pageSize}
            />
          ) : (
            <DataTable
              data={teamMembers}
              columns={orderedColumns}
              keyExtractor={(userDetail) => userDetail.strUserDetailGUID}
              sortBy={sorting.columnKey || undefined}
              ascending={sorting.direction === "asc"}
              onSort={handleSort}
              loading={isLoading}
              emptyState={
                <>
                  No team members found. Use the 'Add Team Member' button to add
                  team members.
                </>
              }
              pagination={{
                pageNumber: pagination.pageNumber,
                pageSize: pagination.pageSize,
                totalCount: pagination.totalCount || 0,
                totalPages: pagination.totalPages || 0,
                onPageChange: goToPage,
                onPageSizeChange: handlePageSizeChange,
              }}
              pageSizeOptions={[5, 10, 20, 50]}
              columnVisibility={columnVisibility}
              alwaysVisibleColumns={getAlwaysVisibleColumns()}
              pinnedColumns={pinnedColumns}
              columnWidths={columnWidths}
              onColumnWidthsChange={setColumnWidths}
            />
          )}
        </div>
      </div>

      {organizationId && (
        <TeamMemberModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          organizationId={organizationId}
          organizationName={
            organizationData?.strOrganizationName || "this organization"
          }
          editingUserDetail={editingUserDetail}
          onEditingUserChange={handleEditingUserChange}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${selectedUserDetail?.name || "this member"} from this team? This action cannot be undone.`}
        confirmLabel="Remove"
        isLoading={deleteUserDetail.isPending}
      />
    </CustomContainer>
  );
};

export default OrganizationTeams;
