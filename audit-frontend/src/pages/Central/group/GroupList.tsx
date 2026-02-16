import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Plus, Building, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { formatDate } from "@/lib/utils";

import { useGroups, useExportGroups } from "@/hooks/api/central/use-groups";
import { useTableLayout } from "@/hooks/common";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useMenuIcon } from "@/hooks/common";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { ExportButton } from "@/components/ui/export-button";

import { AvatarImage } from "@/components/ui/avatar-image";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import type { Group } from "@/types/central/group";

const GroupList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const HeaderIcon = useMenuIcon("group_list", Building);

  const defaultColumnOrder = [
    "actions",
    "logo",
    "strName",
    "strLicenseNo",
    "strPAN",
    "strTAN",
    "strCIN",
    "dtLicenseIssueDate",
    "dtLicenseExpired",
    "dtCreatedOn",
    "dtUpdatedOn",
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
  } = useTableLayout("group", defaultColumnOrder, ["actions"]);

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("group", {
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

  const sortBy = sorting.columnKey || "strName";
  const ascending = sorting.direction === "asc";
  const exportGroups = useExportGroups();

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const { data: groupsResponse, isLoading: loading } = useGroups({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy,
    ascending,
  });
  const groups = useMemo(() => {
    if (!groupsResponse || !groupsResponse.data) {
      return [];
    }

    if (Array.isArray(groupsResponse.data.items)) {
      return groupsResponse.data.items;
    }

    return [];
  }, [groupsResponse]);

  useEffect(() => {
    if (groupsResponse?.data) {
      updateResponseData({
        totalCount: groupsResponse.data.totalCount || 0,
        totalPages: groupsResponse.data.totalPages || 0,
      });
    }
  }, [groupsResponse?.data, updateResponseData]);

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

  const handlePageSizeChange = (newSize: number) => {
    setPagination({
      pageSize: newSize,
      pageNumber: 1,
    });
  };

  const goToPage = (pageNumber: number) => {
    setPagination({
      pageNumber,
    });
  };

  const handleCreateGroup = () => {
    navigate("/group/new");
  };

  const columns = useMemo<DataTableColumn<Group>[]>(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<Group>[] = [
      {
        key: "actions",
        header: "Actions",
        width: "140px",
        cell: (group: Group) => (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(`/group/${group.strGroupGUID}`);
              }}
              title="Edit group"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
              onClick={(e) => {
                e.stopPropagation();
                navigate(
                  `/group-module-permission?strGroupGUID=${group.strGroupGUID}`
                );
              }}
              title="Group module permissions"
            >
              <Lock className="h-4 w-4" />
              <span className="sr-only">Permissions</span>
            </Button>
          </div>
        ),
      },
      {
        key: "logo",
        header: "Logo",
        width: "70px",
        cell: (group: Group) => (
          <div className="flex items-center justify-center">
            <AvatarImage
              imagePath={group.strLogo}
              alt={`${group.strName} logo`}
              size="md"
              type="organization"
            />
          </div>
        ),
      },
      {
        key: "strName",
        header: "Name",
        width: "250px",
        cell: (group: Group) => (
          <div
            className={`min-w-62.5 ${getTextClass()} font-medium`}
            title={group.strName}
          >
            {group.strName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strLicenseNo",
        header: "License No.",
        cell: (group: Group) => (
          <div
            className={`min-w-50 ${getTextClass()}`}
            title={group.strLicenseNo || "-"}
          >
            {group.strLicenseNo || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPAN",
        header: "PAN",
        width: "130px",
        cell: (group: Group) => (
          <div
            className={`min-w-32.5 ${getTextClass()}`}
            title={group.strPAN || "-"}
          >
            {group.strPAN || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTAN",
        header: "TAN",
        width: "130px",
        cell: (group: Group) => (
          <div
            className={`min-w-32.5 ${getTextClass()}`}
            title={group.strTAN || "-"}
          >
            {group.strTAN || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCIN",
        header: "CIN",
        width: "200px",
        cell: (group: Group) => (
          <div
            className={`min-w-42.5 ${getTextClass()}`}
            title={group.strCIN || "-"}
          >
            {group.strCIN || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtLicenseIssueDate",
        header: "License Issue Date",
        width: "200px",
        cell: (group: Group) => (
          <div
            className={`min-w-42.5 ${getTextClass()}`}
            title={
              group.dtLicenseIssueDate
                ? formatDate(group.dtLicenseIssueDate)
                : "-"
            }
          >
            {group.dtLicenseIssueDate
              ? formatDate(group.dtLicenseIssueDate)
              : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtLicenseExpired",
        header: "License Expiry Date",
        width: "200px",
        cell: (group: Group) => (
          <div
            className={`min-w-42.5 ${getTextClass()}`}
            title={
              group.dtLicenseExpired ? formatDate(group.dtLicenseExpired) : "-"
            }
          >
            {group.dtLicenseExpired ? formatDate(group.dtLicenseExpired) : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "220px",
        cell: (group: Group) => (
          <div
            className={`min-w-55 ${getTextClass()}`}
            title={
              group.dtCreatedOn ? formatDate(group.dtCreatedOn, true) : "-"
            }
          >
            {group.dtCreatedOn ? formatDate(group.dtCreatedOn, true) : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "220px",
        cell: (group: Group) => (
          <div
            className={`min-w-55 ${getTextClass()}`}
            title={
              group.dtUpdatedOn ? formatDate(group.dtUpdatedOn, true) : "-"
            }
          >
            {group.dtUpdatedOn ? formatDate(group.dtUpdatedOn, true) : "-"}
          </div>
        ),
        sortable: true,
      },
    ];

    return baseColumns;
  }, [navigate, isTextWrapped, openEditInNewTab]);

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
        title="Groups/Parents"
        description="Manage your group information"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2 w-full">
            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-row sm:w-auto">
              <ExportButton exportMutation={exportGroups} />

              <Button
                onClick={handleCreateGroup}
                variant={"default"}
                className="w-full sm:w-auto justify-center h-9 text-xs sm:text-sm"
              >
                <Plus className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Add Group
              </Button>
            </div>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <SearchInput
            placeholder="Search by name, license no, PAN, etc..."
            onSearchChange={setDebouncedSearch}
            debounceDelay={500}
            className="max-w-full sm:max-w-md sm:flex-1"
          />

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-row sm:w-auto">
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
                    "group_column_order",
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
      </div>

      {loading ? (
        <TableSkeleton
          columns={[
            "Actions",
            "Logo",
            "Name",
            "License No.",
            "PAN",
            "TAN",
            "CIN",
            "License Issue Date",
            "License Expiry Date",
            "Created On",
            "Updated On",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={groups}
          columns={orderedColumns}
          keyExtractor={(group) => group.strGroupGUID}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSort}
          loading={false}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          isTextWrapped={isTextWrapped}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem("group_column_widths", JSON.stringify(widths));
          }}
          maxHeight="calc(100vh - 350px)"
          emptyState={
            debouncedSearch ? (
              <>No groups found matching "{debouncedSearch}".</>
            ) : (
              <>No groups found. Click "Add Group" to create one.</>
            )
          }
          pagination={{
            pageNumber: pagination.pageNumber || 1,
            pageSize: pagination.pageSize || 10,
            totalCount: pagination.totalCount || 0,
            totalPages: pagination.totalPages || 1,
            onPageChange: goToPage,
            onPageSizeChange: handlePageSizeChange,
          }}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      )}
    </CustomContainer>
  );
};

export default GroupList;
