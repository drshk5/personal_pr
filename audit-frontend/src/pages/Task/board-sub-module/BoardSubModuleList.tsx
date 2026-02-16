import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Copy, Edit, Plus, Layers, Filter } from "lucide-react";

import type { BoardSubModule } from "@/types/task/board-sub-module";

import { Actions, FormModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";

import { format } from "date-fns";

import { useBoardSubModules } from "@/hooks/api/task/use-board-sub-module";
import { useActiveBoards } from "@/hooks/api/task/use-board";
import { useBoardSectionsByBoardGuid } from "@/hooks/api/task/use-board-sections";
import { useUserRights } from "@/hooks";
import { useModuleUsers } from "@/hooks/api/central/use-users";

import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useTableLayout } from "@/hooks/common";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
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
import { CopyFromBoardSubModuleModal } from "@/pages/Task/board-sub-module/CopyFromBoardSubModuleModal";

const STATUS_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
] as const;

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];

const BoardSubModuleList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const boardGuid = searchParams.get("boardGuid");
  const sectionGuid = searchParams.get("sectionGuid");

  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [showCopyFromModal, setShowCopyFromModal] = useState(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedBoardGuid, setSelectedBoardGuid] = useState<string>(
    boardGuid || ""
  );
  const [selectedSectionGuid, setSelectedSectionGuid] = useState<string>(
    sectionGuid || ""
  );
  const [createdByGuid, setCreatedByGuid] = useState<string>("");
  const [updatedByGuid, setUpdatedByGuid] = useState<string>("");
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [createdByDropdownOpen, setCreatedByDropdownOpen] = useState(false);
  const [updatedByDropdownOpen, setUpdatedByDropdownOpen] = useState(false);

  const { menuItems } = useUserRights();

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "sub_module",
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
    "strBoardName",
    "strBoardSectionName",
    "strName",
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
  } = useTableLayout("sub_module_columns", defaultColumnOrder, ["actions"]);

  const {
    data: subModulesResponse,
    isLoading,
    error,
  } = useBoardSubModules({
    search: debouncedSearch,
    strBoardGUID: selectedBoardGuid || undefined,
    strBoardSectionGUID: selectedSectionGuid || undefined,
    strCreatedByGuid: createdByGuid || undefined,
    strUpdatedByGuid: updatedByGuid || undefined,
    bolIsActive: statusFilter === "all" ? undefined : statusFilter === "active",
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: sortByParam,
    ascending,
  });

  const { data: boardsResponse, isLoading: isBoardsLoading } = useActiveBoards(
    undefined,
    { enabled: boardDropdownOpen }
  );

  const { data: boardSectionsResponse, isLoading: isSectionsLoading } =
    useBoardSectionsByBoardGuid(
      selectedBoardGuid || undefined,
      { pageNumber: 1, pageSize: 1000 },
      sectionDropdownOpen && !!selectedBoardGuid
    );

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

  const subModules = subModulesResponse?.data || [];
  const totalPages = subModulesResponse?.totalPages || 1;
  const totalCount = subModulesResponse?.totalRecords || 0;

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
    setStatusFilter("all");
    setSelectedBoardGuid("");
    setSelectedSectionGuid("");
    setCreatedByGuid("");
    setUpdatedByGuid("");
  };

  const handleAddNew = () => {
    const params = new URLSearchParams();
    if (boardGuid) params.set("boardGuid", boardGuid);
    if (sectionGuid) params.set("sectionGuid", sectionGuid);
    navigate(`new${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleEdit = useCallback((id: string) => {
    window.open(`/sub-module/${id}`, "_blank", "noopener,noreferrer");
  }, []);

  const columns: DataTableColumn<BoardSubModule>[] = useMemo(() => {
    return [
      ...(canAccess(menuItems, FormModules.SUB_MODULE_FORM, Actions.EDIT)
        ? [
            {
              key: "actions",
              header: "Actions",
              width: "80px",
              cell: (subModule: BoardSubModule) => (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(subModule.strBoardSubModuleGUID);
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
            key: "strBoardName",
            header: "Project",
            width: "200px",
            cell: (subModule) => subModule.strBoardName || "-",
        sortable: true,
    },
    {
        key: "strBoardSectionName",
        header: "Module",
        width: "180px",
        cell: (subModule) => subModule.strBoardSectionName || "-",
        sortable: true,
    },
    {
      key: "strName",
      header: "Sub Module",
      width: "200px",
      cell: (subModule) => subModule.strName || "-",
      sortable: true,
    },
      {
        key: "bolIsActive",
        header: "Status",
        width: "120px",
        cell: (subModule) => (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              subModule.bolIsActive
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {subModule.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        width: "160px",
        cell: (subModule) => subModule.strCreatedByName || "-",
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "180px",
        cell: (subModule) =>
          subModule.dtCreatedOn
            ? format(new Date(subModule.dtCreatedOn), "MMM d, yyyy, h:mm a")
            : "-",
        sortable: true,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "160px",
        cell: (subModule) => subModule.strUpdatedByName || "-",
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "180px",
        cell: (subModule) =>
          subModule.dtUpdatedOn
            ? format(new Date(subModule.dtUpdatedOn), "MMM d, yyyy, h:mm a")
            : "-",
        sortable: true,
      },
    ];
  }, [menuItems, handleEdit]);

  // Apply column ordering
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
        title="Sub Modules"
        description="Manage sub modules for your project modules"
        icon={Layers}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <WithPermission
              module={FormModules.SUB_MODULE_FORM}
              action={Actions.SAVE}
              fallback={<></>}
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowCopyFromModal(true)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy From
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={handleAddNew}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Sub Module
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search sub modules..."
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
              {(selectedBoardGuid ||
                selectedSectionGuid ||
                statusFilter !== "all" ||
                createdByGuid ||
                updatedByGuid) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {(selectedBoardGuid ? 1 : 0) +
                    (selectedSectionGuid ? 1 : 0) +
                    (statusFilter !== "all" ? 1 : 0) +
                    (createdByGuid ? 1 : 0) +
                    (updatedByGuid ? 1 : 0)}
                </span>
              )}
            </Button>

            <div className="h-9 w-full sm:w-auto">
              <DraggableColumnVisibility<BoardSubModule>
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
                    "sub_module_column_order",
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
                Filter sub modules by additional criteria
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
                    Project
                  </label>
                  <PreloadedSelect
                    placeholder="Select project"
                    options={
                      boardsResponse?.map((board) => ({
                        value: board.strBoardGUID,
                        label: board.strName,
                      })) || []
                    }
                    selectedValue={selectedBoardGuid}
                    onChange={(value) => {
                      setSelectedBoardGuid(value);
                      setSelectedSectionGuid("");
                    }}
                    onOpenChange={setBoardDropdownOpen}
                    isLoading={boardDropdownOpen && isBoardsLoading}
                    clearable
                    queryKey={["boards", "active"]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Module
                  </label>
                  <PreloadedSelect
                    placeholder={
                      selectedBoardGuid
                        ? "Select module"
                        : "Select project first"
                    }
                    options={
                      boardSectionsResponse?.data?.map((section) => ({
                        value: section.strBoardSectionGUID,
                        label: section.strName,
                      })) || []
                    }
                    selectedValue={selectedSectionGuid}
                    onChange={setSelectedSectionGuid}
                    onOpenChange={setSectionDropdownOpen}
                    isLoading={sectionDropdownOpen && isSectionsLoading}
                    disabled={!selectedBoardGuid}
                    clearable
                  />
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
                  disabled={
                    statusFilter === "all" &&
                    !selectedBoardGuid &&
                    !selectedSectionGuid &&
                    !createdByGuid &&
                    !updatedByGuid
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
          columns={columns.map(c => c.header as string)} 
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable<BoardSubModule>
          data={subModules}
          columns={orderedColumns}
          pagination={{
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount: totalCount,
            totalPages: totalPages,
            onPageChange: goToPage,
            onPageSizeChange: handlePageSizeChange,
          }}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSort}
          pageSizeOptions={[5, 10, 20, 50]}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          keyExtractor={(item) => item.strBoardSubModuleGUID}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "sub_module_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            error ? (
              <>
                An error occurred loading sub modules. Please try again later.
              </>
            ) : debouncedSearch ? (
              <>No sub modules found matching "{debouncedSearch}".</>
            ) : (
              <>
                No sub modules found. Click "Add Sub Module" to create one.
              </>
            )
          }
          maxHeight="calc(100vh - 350px)"
        />
      )}

      <CopyFromBoardSubModuleModal
        open={showCopyFromModal}
        onOpenChange={setShowCopyFromModal}
        targetBoardSectionGuid={sectionGuid || undefined}
        boardGuid={boardGuid || undefined}
        onSuccess={() => {
          // Refetch the data
          window.location.reload();
        }}
      />

    </CustomContainer>
  );
};

export default BoardSubModuleList;
