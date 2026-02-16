import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Edit, LayoutGrid, Plus, Filter } from "lucide-react";
import { format } from "date-fns";
import type { BoardSection } from "@/types";
import { Actions, FormModules, ListModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";
import { useBoardSections } from "@/hooks/api/task/use-board-sections";
import { useActiveBoards } from "@/hooks/api/task/use-board";
import { useUserRights } from "@/hooks";
import { useModuleUsers } from "@/hooks/api/central/use-users";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useTableLayout } from "@/hooks/common";
import { DEFAULT_SECTION_COLOR_OPTIONS } from "@/constants/Task/task";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
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
import type { BoardSectionParams } from "@/types/task/board-section";
import { CopyFromBoardModuleModal } from "@/pages/Task/board-module/CopyFromBoardModuleModal";

const COLOR_LABEL_MAP = Object.fromEntries(
  DEFAULT_SECTION_COLOR_OPTIONS.map(({ value, label }) => [value, label])
);

const BoardModuleList = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedBoardGuid, setSelectedBoardGuid] = useState<string>("");
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const [showCopyFromModal, setShowCopyFromModal] = useState(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [createdByGuid, setCreatedByGuid] = useState<string>("");
  const [updatedByGuid, setUpdatedByGuid] = useState<string>("");
  const [createdByDropdownOpen, setCreatedByDropdownOpen] = useState(false);
  const [updatedByDropdownOpen, setUpdatedByDropdownOpen] = useState(false);

  const { menuItems } = useUserRights();

  const HeaderIcon = useMenuIcon(ListModules.BOARD_MODULE, LayoutGrid);

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "board_module",
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
    "strName",
    "strColor",
    "intPosition",
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
  } = useTableLayout("board_module_columns", defaultColumnOrder, ["actions"]);

  const { data: boardsResponse, isLoading: isBoardsLoading } = useActiveBoards(
    undefined,
    { enabled: boardDropdownOpen }
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

  const params: BoardSectionParams = useMemo(
    () => ({
      ...(selectedBoardGuid && { strBoardGUID: selectedBoardGuid }),
      ...(createdByGuid && { strCreatedByGuid: createdByGuid }),
      ...(updatedByGuid && { strUpdatedByGuid: updatedByGuid }),
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      search: debouncedSearch || undefined,
      sortBy: sortByParam,
      ascending: ascending,
    }),
    [
      selectedBoardGuid,
      createdByGuid,
      updatedByGuid,
      pagination.pageNumber,
      pagination.pageSize,
      debouncedSearch,
      sortByParam,
      ascending,
    ]
  );

  const { data: sectionsResponse, isLoading, error } = useBoardSections(params);

  const boardNameLookup = useMemo(() => {
    return new Map(
      (boardsResponse || []).map((board) => [board.strBoardGUID, board.strName])
    );
  }, [boardsResponse]);

  const sections = sectionsResponse?.data || [];
  const totalPages = sectionsResponse?.totalPages || 0;

  useEffect(() => {
    if (sectionsResponse) {
      setPagination({
        totalCount: sectionsResponse.totalCount || 0,
        totalPages: sectionsResponse.totalPages || 0,
      });
    }
  }, [setPagination, sectionsResponse]);

  useEffect(() => {
    if (totalPages > 0 && pagination.pageNumber > totalPages) {
      setPagination({ pageNumber: totalPages });
    }
  }, [pagination.pageNumber, setPagination, totalPages]);

  const clearFilters = () => {
    setSelectedBoardGuid("");
    setCreatedByGuid("");
    setUpdatedByGuid("");
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

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns: DataTableColumn<BoardSection>[] = useMemo(() => {
    return [
      ...(canAccess(menuItems, FormModules.BOARD_MODULE, Actions.EDIT)
        ? [
            {
              key: "actions",
              header: "Actions",
              width: "80px",
              cell: (section: BoardSection) => (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditInNewTab(
                        `/module/${section.strBoardSectionGUID}`
                      );
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
        header: "Module Name",
        width: "200px",
        cell: (section) => section.strName || "-",
        sortable: true,
      },
      {
        key: "strBoardName",
        header: "Project",
        width: "200px",
        cell: (section) =>
          section.strBoardName ||
          boardNameLookup.get(section.strBoardGUID) ||
          section.strBoardGUID,
        sortable: true,
      },
      {
        key: "strColor",
        header: "Color",
        width: "140px",
        cell: (section) => (
          <div className="flex items-center gap-2">
            <span
              className="h-3.5 w-3.5 rounded-full"
              style={{ backgroundColor: section.strColor || "#e5e7eb" }}
            />
            <span className="text-sm text-muted-foreground">
              {COLOR_LABEL_MAP[section.strColor || ""] || "Custom"}
            </span>
          </div>
        ),
        sortable: false,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "180px",
        cell: (section) =>
          section.dtCreatedOn
            ? format(new Date(section.dtCreatedOn), "MMM d, yyyy, h:mm a")
            : "-",
        sortable: true,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        width: "180px",
        cell: (section) => section.strCreatedByName || "-",
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "180px",
        cell: (section) =>
          section.dtUpdatedOn
            ? format(new Date(section.dtUpdatedOn), "MMM d, yyyy, h:mm a")
            : "-",
        sortable: true,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "180px",
        cell: (section) => section.strUpdatedByName || "-",
        sortable: true,
      },
    ];
  }, [menuItems, openEditInNewTab, boardNameLookup]);

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
        title="Modules"
        description="View and manage modules for your project boards"
        icon={HeaderIcon}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <WithPermission
              module={FormModules.BOARD_MODULE}
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
                onClick={() => navigate("/module/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Module
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search modules..."
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
              {(selectedBoardGuid || createdByGuid || updatedByGuid) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {(selectedBoardGuid ? 1 : 0) +
                    (createdByGuid ? 1 : 0) +
                    (updatedByGuid ? 1 : 0)}
                </span>
              )}
            </Button>

            <div className="h-9 w-full sm:w-auto">
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
                    "board_module_column_order",
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
                Filter modules by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    onChange={setSelectedBoardGuid}
                    onOpenChange={setBoardDropdownOpen}
                    isLoading={boardDropdownOpen && isBoardsLoading}
                    clearable
                    queryKey={["boards", "active"]}
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
                  disabled={!selectedBoardGuid && !createdByGuid && !updatedByGuid}
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
          columns={[
            "Actions",
            "Module Name",
            "Project",
            "Color",
            "Position",
            "Created By",
            "Created On",
            "Updated By",
            "Updated On",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable<BoardSection>
          data={error ? [] : sections}
          columns={orderedColumns}
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
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          keyExtractor={(item) => item.strBoardSectionGUID}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "board_module_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            error ? (
              <>An error occurred loading modules. Please try again.</>
            ) : debouncedSearch ? (
              <>No modules found matching "{debouncedSearch}".</>
            ) : (
              <>No modules found. Click "New Module" to create one.</>
            )
          }
          maxHeight="calc(100vh - 350px)"
        />
      )}

      <CopyFromBoardModuleModal
        open={showCopyFromModal}
        onOpenChange={setShowCopyFromModal}
        targetBoardGuid={selectedBoardGuid}
        boards={boardsResponse || []}
      />
    </CustomContainer>
  );
};

export default BoardModuleList;
