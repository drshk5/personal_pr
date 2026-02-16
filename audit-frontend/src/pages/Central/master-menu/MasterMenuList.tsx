import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlignLeft, Edit, Plus, Filter } from "lucide-react";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/ui/export-button";
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
import { MultiSelect } from "@/components/ui/select/multi-select";

import {
  useMasterMenus,
  useExportMasterMenus,
  useParentMasterMenus,
  useMenuCategories,
} from "@/hooks";
import { useActivePageTemplates } from "@/hooks/api/central/use-page-templates";
import { useTableLayout } from "@/hooks/common";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useListPreferences } from "@/hooks/common/use-list-preferences";

import type { MasterMenu } from "@/types/central/master-menu";

const MasterMenuList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const HeaderIcon = useMenuIcon("master-menu", AlignLeft);

  const defaultColumnOrder = [
    "actions",
    "strName",
    "strParentMenuName",
    "bolIsActive",
    "strPath",
    "strMenuPosition",
    "dblSeqNo",
    "strMapKey",
    "bolHasSubMenu",
    "strIconName",
    "strCategory",
    "strPageTemplateName",
    "bolSuperAdminAccess",
    "bolIsSingleMenu",
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
  } = useTableLayout("master-menu", defaultColumnOrder, ["actions", "strName"]);

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("master-menu", {
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

  // Stabilize pagination setter for debounced search handler to avoid re-renders resetting page
  const setPaginationRef = useRef(setPagination);
  useEffect(() => {
    setPaginationRef.current = setPagination;
  }, [setPagination]);

  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [parentMenuFilter, setParentMenuFilter] = useState<string[]>([]);
  const [positionFilter, setPositionFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [pageTemplateFilter, setPageTemplateFilter] = useState<string[]>([]);
  const [superAdminFilter, setSuperAdminFilter] = useState<boolean | undefined>(
    undefined
  );
  const [dropdownOpen, setDropdownOpen] = useState({
    parentMenu: false,
    position: false,
    category: false,
    pageTemplate: false,
  });

  const exportMasterMenus = useExportMasterMenus();
  const { data: parentMenus = [], isLoading: isParentMenuLoading } = useParentMasterMenus(
    undefined,
    undefined,
    dropdownOpen.parentMenu
  );
  const { data: pageTemplates = [], isLoading: isPageTemplateLoading } = useActivePageTemplates(
    undefined,
    dropdownOpen.pageTemplate
  );

  const positionOptions = [
    { value: "sidebar", label: "Sidebar" },
    { value: "userbar", label: "Userbar" },
    { value: "hidden", label: "Hidden" },
  ];

  const { data: categoryOptions = [] } = useMenuCategories();

  const parentMenuOptions = useMemo(() => {
    return parentMenus.map((menu) => ({
      value: menu.strMasterMenuGUID,
      label: menu.strName,
    }));
  }, [parentMenus]);

  const pageTemplateOptions = useMemo(() => {
    return pageTemplates.map((template) => ({
      value: template.strPageTemplateGUID,
      label: template.strPageTemplateName,
    }));
  }, [pageTemplates]);

  const sortBy = sorting.columnKey || "strName";
  const ascending = sorting.direction === "asc";

  const { data: masterMenusResponse, isLoading } = useMasterMenus({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy,
    ascending,
    bolIsActive: activeFilter,
    strParentMenuGUID:
      parentMenuFilter.length > 0 ? parentMenuFilter.join(",") : undefined,
    strPosition:
      positionFilter.length > 0 ? positionFilter.join(",") : undefined,
    strCategory:
      categoryFilter.length > 0 ? categoryFilter.join(",") : undefined,
    strPageTemplateGUID:
      pageTemplateFilter.length > 0 ? pageTemplateFilter.join(",") : undefined,
    bolIsSuperadmin: superAdminFilter,
  });

  useEffect(() => {
    if (masterMenusResponse?.data) {
      updateResponseData({
        totalCount: masterMenusResponse.data?.totalCount || 0,
        totalPages: masterMenusResponse.data?.totalPages || 1,
      });
    }
  }, [masterMenusResponse, isLoading, updateResponseData]);

  const menuItems = useMemo(() => {
    return masterMenusResponse?.data?.items || [];
  }, [masterMenusResponse]);

  const handleSearchChange = useCallback((value: string) => {
    setDebouncedSearch(value);
    setPaginationRef.current({ pageNumber: 1 });
  }, []);

  const handleNewMasterMenu = () => {
    navigate("/master-menu/new");
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

  const columns = useMemo<DataTableColumn<MasterMenu>[]>(() => {
    const getTextClass = () => (isTextWrapped ? "text-wrap" : "text-clip");

    const baseColumns: DataTableColumn<MasterMenu>[] = [
      {
        key: "actions",
        header: "Actions",
        width: "100px",
        cell: (item: MasterMenu) => (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(`/master-menu/${item.strMasterMenuGUID}`);
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
              title="Edit master menu"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
      {
        key: "strName",
        header: "Name",
        width: "200px",
        cell: (item: MasterMenu) => (
          <div className={`${getTextClass()} font-medium`} title={item.strName}>
            {item.strName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strParentMenuName",
        header: "Parent Menu",
        width: "200px",
        cell: (item: MasterMenu) => (
          <div className={getTextClass()} title={item.strParentMenuName || "-"}>
            {item.strParentMenuName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "120px",
        cell: (item: MasterMenu) => {
          const isActive = item.bolIsActive;
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          );
        },
        sortable: true,
      },
      {
        key: "strPath",
        header: "Path",
        width: "180px",
        cell: (item: MasterMenu) => (
          <div className={getTextClass()} title={item.strPath}>
            {item.strPath}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strMenuPosition",
        header: "Position",
        width: "140px",
        cell: (item: MasterMenu) => {
          const positionDisplayNames: Record<string, string> = {
            sidebar: "Sidebar",
            userbar: "Userbar",
            hidden: "Hidden",
          };

          const positionLabel =
            positionDisplayNames[item.strMenuPosition] || item.strMenuPosition;

          return (
            <div className={getTextClass()} title={positionLabel}>
              {positionLabel}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "dblSeqNo",
        header: "Sequence",
        width: "130px",
        cell: (item: MasterMenu) => (
          <div className={getTextClass()} title={item.dblSeqNo.toString()}>
            {item.dblSeqNo}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strMapKey",
        header: "Map Key",
        width: "200px",
        cell: (item: MasterMenu) => (
          <div className={getTextClass()} title={item.strMapKey}>
            {item.strMapKey}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolHasSubMenu",
        header: "Has Submenu",
        width: "160px",
        cell: (item: MasterMenu) => {
          const hasSubMenu = item.bolHasSubMenu;
          return <Badge variant="outline">{hasSubMenu ? "Yes" : "No"}</Badge>;
        },
        sortable: true,
      },
      {
        key: "strIconName",
        header: "Icon",
        width: "140px",
        cell: (item: MasterMenu) => (
          <div className={getTextClass()} title={item.strIconName || "-"}>
            {item.strIconName || "-"}
          </div>
        ),
      },
      {
        key: "strCategory",
        header: "Category",
        width: "160px",
        cell: (item: MasterMenu) => (
          <div className={getTextClass()} title={item.strCategory || "-"}>
            {item.strCategory || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPageTemplateName",
        header: "Page Template",
        width: "180px",
        cell: (item: MasterMenu) => (
          <div
            className={getTextClass()}
            title={item.strPageTemplateName || "-"}
          >
            {item.strPageTemplateName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolSuperAdminAccess",
        header: "Super Admin Only",
        width: "180px",
        cell: (item: MasterMenu) => {
          const isAdminOnly = item.bolSuperAdminAccess;
          return (
            <div className="flex items-center justify-center">
              <Badge variant="outline">{isAdminOnly ? "Yes" : "No"}</Badge>
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "bolIsSingleMenu",
        header: "Is Single Menu",
        width: "160px",
        cell: (item: MasterMenu) => {
          const isSingleMenu = item.bolIsSingleMenu;
          return (
            <div className="flex items-center justify-center">
              <Badge variant="outline">{isSingleMenu ? "Yes" : "No"}</Badge>
            </div>
          );
        },
        sortable: true,
      },
    ];

    return baseColumns;
  }, [navigate, isTextWrapped]);

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
      <div className="flex flex-col h-full">
        <PageHeader
          title="Master Menu List"
          icon={HeaderIcon}
          description="View and manage master menus"
          actions={
            <>
              <ExportButton exportMutation={exportMasterMenus} />
              <Button onClick={handleNewMasterMenu} size="sm" className="h-9">
                <Plus className="mr-1 h-4 w-4" />
                <span className="text-sm">New Master Menu</span>
              </Button>
            </>
          }
        />

        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <SearchInput
              placeholder="Search master menus..."
              onSearchChange={handleSearchChange}
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
                {(parentMenuFilter.length > 0 ||
                  positionFilter.length > 0 ||
                  categoryFilter.length > 0 ||
                  pageTemplateFilter.length > 0 ||
                  activeFilter !== undefined ||
                  superAdminFilter !== undefined) && (
                  <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                    {(parentMenuFilter.length > 0 ? 1 : 0) +
                      (positionFilter.length > 0 ? 1 : 0) +
                      (categoryFilter.length > 0 ? 1 : 0) +
                      (pageTemplateFilter.length > 0 ? 1 : 0) +
                      (activeFilter !== undefined ? 1 : 0) +
                      (superAdminFilter !== undefined ? 1 : 0)}
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
                      "master-menu_column_order",
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

        <div
          className={`transform transition-all duration-300 ease-in-out ${
            showFilters
              ? "opacity-100 max-h-250"
              : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <Card className="mt-4 mb-6">
            <CardHeader>
              <CardTitle>Advanced Filters</CardTitle>
              <CardDescription>
                Filter master menus by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Parent Menu
                  </label>
                  <MultiSelect
                    options={parentMenuOptions}
                    selectedValues={parentMenuFilter}
                    initialMessage=""
                    onChange={(values) => {
                      setParentMenuFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
                    placeholder="Select parent menus..."
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        parentMenu: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.parentMenu && isParentMenuLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Position
                  </label>
                  <MultiSelect
                    options={positionOptions}
                    selectedValues={positionFilter}
                    onChange={(values) => {
                      setPositionFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
                    placeholder="Select positions..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <MultiSelect
                    options={categoryOptions}
                    selectedValues={categoryFilter}
                    onChange={(values) => {
                      setCategoryFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
                    placeholder="Select categories..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Page Template
                  </label>
                  <MultiSelect
                    options={pageTemplateOptions}
                    selectedValues={pageTemplateFilter}
                    initialMessage=""
                    onChange={(values) => {
                      setPageTemplateFilter(values);
                      setPagination({ pageNumber: 1 });
                    }}
                    placeholder="Select page templates..."
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        pageTemplate: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.pageTemplate && isPageTemplateLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={
                      activeFilter === undefined
                        ? "all"
                        : activeFilter.toString()
                    }
                    onValueChange={(value) => {
                      setActiveFilter(
                        value === "all" ? undefined : value === "true"
                      );
                      setPagination({ pageNumber: 1 });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Super Admin Only
                  </label>
                  <Select
                    value={
                      superAdminFilter === undefined
                        ? "all"
                        : superAdminFilter.toString()
                    }
                    onValueChange={(value) => {
                      setSuperAdminFilter(
                        value === "all" ? undefined : value === "true"
                      );
                      setPagination({ pageNumber: 1 });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select access type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Super Admin Only</SelectItem>
                      <SelectItem value="false">Regular Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveFilter(undefined);
                    setParentMenuFilter([]);
                    setPositionFilter([]);
                    setCategoryFilter([]);
                    setPageTemplateFilter([]);
                    setSuperAdminFilter(undefined);
                    setPagination({ pageNumber: 1 });
                  }}
                  disabled={
                    parentMenuFilter.length === 0 &&
                    positionFilter.length === 0 &&
                    categoryFilter.length === 0 &&
                    pageTemplateFilter.length === 0 &&
                    activeFilter === undefined &&
                    superAdminFilter === undefined
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <TableSkeleton
            columns={[
              "Actions",
              "Name",
              "Parent Menu",
              "Status",
              "Path",
              "Position",
              "Sequence",
              "Map Key",
              "Has Submenu",
              "Icon",
              "Category",
              "Page Template",
              "Super Admin Only",
              "Is Single Menu",
            ]}
            pageSize={pagination.pageSize}
          />
        ) : (
          <DataTable
            data={menuItems}
            columns={orderedColumns}
            keyExtractor={(item) => item.strMasterMenuGUID}
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
              localStorage.setItem(
                "master-menu_column_widths",
                JSON.stringify(widths)
              );
            }}
            maxHeight="calc(100vh - 350px)"
            emptyState={
              debouncedSearch ? (
                <>No master menus found matching "{debouncedSearch}".</>
              ) : (
                <>
                  No master menus found. Click "New Master Menu" to create one.
                </>
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
          />
        )}
      </div>
    </CustomContainer>
  );
};

export default MasterMenuList;
