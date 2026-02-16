import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Plus, LayoutDashboard, Filter } from "lucide-react";
import { format } from "date-fns";

import type { Board } from "@/types";

import { Actions, FormModules, ListModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";

import { useBoardsPaged } from "@/hooks/api/task/use-board";
import { useUserRights } from "@/hooks";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useTableLayout } from "@/hooks/common";
import { useModuleUsers } from "@/hooks/api/central/use-users";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";

const STATUS_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
] as const;

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];

const BoardMasterList = () => {
  const navigate = useNavigate();
  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ListModules.BOARD, LayoutDashboard);

  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createdByGuid, setCreatedByGuid] = useState<string>("");
  const [updatedByGuid, setUpdatedByGuid] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [createdByDropdownOpen, setCreatedByDropdownOpen] = useState(false);
  const [updatedByDropdownOpen, setUpdatedByDropdownOpen] = useState(false);

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "board_list",
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
  const sortByParam = useMemo(() => {
    if (sortBy === "dtCreatedOn") return "createdOn";
    if (sortBy === "dtUpdatedOn") return "updatedOn";
    if (sortBy === "strCreatedByName") return "createdBy";
    if (sortBy === "strUpdatedByName") return "updatedBy";
    return sortBy;
  }, [sortBy]);
  const ascending = sorting.direction === "asc";

  const defaultColumnOrder = [
    "actions",
    "strName",
    "strDescription",
    "bolIsActive",
    "strCreatedByName",
    "dtCreatedOn",
    "strUpdatedByName",
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
  } = useTableLayout("board_list_columns", defaultColumnOrder, ["actions"]);

  const {
    data: boardsResponse,
    isLoading,
    error,
  } = useBoardsPaged({
    search: debouncedSearch,
    bolIsActive: statusFilter === "all" ? undefined : statusFilter === "active",
    strCreatedByGUID: createdByGuid || undefined,
    strUpdatedByGUID: updatedByGuid || undefined,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: sortByParam,
    ascending,
  });

  const { data: moduleUsers = [], isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    createdByDropdownOpen || updatedByDropdownOpen
  );

  const userOptions = useMemo(
    () =>
      moduleUsers.map((user) => ({
        value: user.strUserGUID,
        label: user.strName,
      })),
    [moduleUsers]
  );

  useEffect(() => {
    setPagination({ pageNumber: 1 });
  }, [debouncedSearch, statusFilter, createdByGuid, updatedByGuid, setPagination]);

  const clearFilters = () => {
    setCreatedByGuid("");
    setUpdatedByGuid("");
  };

  const boards = useMemo(() => boardsResponse?.data || [], [boardsResponse]);
  const totalPages = boardsResponse?.totalPages || 1;
  const totalCount = boardsResponse?.totalRecords || 0;

  const goToPage = (pageNumber: number) => {
    setPagination({ pageNumber });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({ pageSize: newSize, pageNumber: 1 });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSorting({ direction: ascending ? "desc" : "asc" });
    } else {
      setSorting({ columnKey: column, direction: "asc" });
    }
    setPagination({ pageNumber: 1 });
  };

  const handleAddNew = () => navigate("new");

  const handleEdit = useCallback((id: string) => {
    window.open(`/project/${id}`, "_blank", "noopener,noreferrer");
  }, []);

  const columns: DataTableColumn<Board>[] = useMemo(() => {
    return [
      ...(canAccess(menuItems, FormModules.BOARD, Actions.EDIT)
        ? [
            {
              key: "actions",
              header: "Actions",
              width: "80px",
              cell: (board: Board) => (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(board.strBoardGUID);
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
        key: "strName",
        header: "Project Name",
        width: "220px",
        cell: (board) => board.strName || "-",
        sortable: true,
      },
      {
        key: "strDescription",
        header: "Description",
        width: "260px",
        cell: (board) => board.strDescription || "-",
        sortable: true,
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "120px",
        cell: (board) => (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              board.bolIsActive
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {board.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "180px",
        cell: (board) =>
          board.dtCreatedOn
            ? format(new Date(board.dtCreatedOn), "MMM d, yyyy, h:mm a")
            : "-",
        sortable: true,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        width: "180px",
        cell: (board) => board.strCreatedByName || "-",
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "180px",
        cell: (board) =>
          board.dtUpdatedOn
            ? format(new Date(board.dtUpdatedOn), "MMM d, yyyy, h:mm a")
            : "-",
        sortable: true,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "180px",
        cell: (board) => board.strUpdatedByName || "-",
        sortable: true,
      },
    ];
  }, [menuItems, handleEdit]);

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
        title="Projects"
        description="Manage projects to organize and track tasks"
        icon={HeaderIcon}
        actions={
          <WithPermission
            module={FormModules.BOARD}
            action={Actions.SAVE}
            fallback={<></>}
          >
            <Button className="w-full sm:w-auto" onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </WithPermission>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search projects..."
            onSearchChange={setDebouncedSearch}
            className="w-full sm:max-w-md sm:flex-1"
          />

          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 justify-center h-9 text-xs sm:text-sm w-full sm:w-auto"
              size="sm"
            >
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span>Filters</span>
              {(createdByGuid || updatedByGuid) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {(createdByGuid ? 1 : 0) + (updatedByGuid ? 1 : 0)}
                </span>
              )}
            </Button>

            <div className="h-9 w-full sm:w-auto">
              <DraggableColumnVisibility<Board>
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
                    "board_list_column_order",
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
                Filter projects by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => setStatusFilter(val as StatusFilter)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_FILTER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Created By
                  </label>
                  <PreloadedSelect
                    options={userOptions}
                    selectedValue={createdByGuid}
                    onChange={setCreatedByGuid}
                    placeholder="Select user"
                    clearable={true}
                    onOpenChange={setCreatedByDropdownOpen}
                    isLoading={createdByDropdownOpen && isUsersLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Updated By
                  </label>
                  <PreloadedSelect
                    options={userOptions}
                    selectedValue={updatedByGuid}
                    onChange={setUpdatedByGuid}
                    placeholder="Select user"
                    clearable={true}
                    onOpenChange={setUpdatedByDropdownOpen}
                    isLoading={updatedByDropdownOpen && isUsersLoading}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={!createdByGuid && !updatedByGuid}
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
          columns={columns.map((c) => c.header as string)}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable<Board>
          data={error ? [] : (boards as Board[]) || []}
          columns={orderedColumns}
          pagination={{
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount,
            totalPages,
            onPageChange: goToPage,
            onPageSizeChange: handlePageSizeChange,
          }}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSort}
          pageSizeOptions={[5, 10, 20, 50]}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          keyExtractor={(item) => item.strBoardGUID}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "board_list_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            error ? (
              <>An error occurred loading projects. Please try again later.</>
            ) : debouncedSearch ? (
              <>No projects found matching "{debouncedSearch}".</>
            ) : (
              <>No projects found. Click "New Project" to create one.</>
            )
          }
          maxHeight="calc(100vh - 350px)"
        />
      )}
    </CustomContainer>
  );
};

export default BoardMasterList;
