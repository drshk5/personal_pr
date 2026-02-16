import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { useYears, useUserRights, useExportYears } from "@/hooks";
import { useModuleUsers } from "@/hooks/api";
import { useMenuIcon, useTableLayout } from "@/hooks/common";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { ModuleBase, Actions, canAccess } from "@/lib/permissions";
import { WithPermission } from "@/components/ui/with-permission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ExportButton } from "@/components/ui/export-button";
import { CalendarDays, Edit, Plus, Search, Filter, X } from "lucide-react";
import { toast } from "sonner";
import type { Year } from "@/types/central/year";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

const YearList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ModuleBase.YEAR, CalendarDays);

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState({
    createdBy: false,
    updatedBy: false,
  });

  const defaultColumnOrder = [
    "actions",
    "strName",
    "bolIsActive",
    "previousYear",
    "nextYear",
    "dtStartDate",
    "dtEndDate",
    "strOrganizationName",
    "createdBy",
    "createdOn",
    "updatedBy",
    "updatedOn",
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
  } = useTableLayout("year", defaultColumnOrder, ["actions"], {
    actions: true,
    strName: true,
    bolIsActive: true,
    previousYear: true,
    nextYear: true,
    dtStartDate: true,
    dtEndDate: true,
    strOrganizationName: true,
    createdBy: true,
    createdOn: true,
    updatedBy: true,
    updatedOn: true,
  });

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "year",
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

  const { data: users = [], isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    dropdownOpen.createdBy || dropdownOpen.updatedBy
  );
  const exportYearsMutation = useExportYears();

  const {
    data: yearsResponse,
    isLoading,
    error,
  } = useYears({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy,
    ascending,
    bolIsActive: isActive === null ? undefined : isActive,
    organizationGUIDs: undefined,
    createdByGUIDs:
      selectedCreatedBy.length > 0 ? selectedCreatedBy : undefined,
    updatedByGUIDs:
      selectedUpdatedBy.length > 0 ? selectedUpdatedBy : undefined,
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load years. Please try again.");
    }
  }, [error]);

  useEffect(() => {
    if (yearsResponse?.data) {
      setPagination({
        totalCount: yearsResponse.data?.totalCount || 0,
        totalPages: yearsResponse.data?.totalPages || 1,
      });
    }
  }, [yearsResponse, setPagination]);

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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination({
      pageNumber: 1,
    });
  };

  const handleSearchClear = () => {
    setSearch("");
    setPagination({
      pageNumber: 1,
    });
  };

  const handleStatusChange = (value: string) => {
    if (value === "active") {
      setIsActive(true);
    } else if (value === "inactive") {
      setIsActive(false);
    } else {
      setIsActive(null);
    }
    setPagination({
      pageNumber: 1,
    });
  };

  const handleCreatedByChange = (values: string[]) => {
    setSelectedCreatedBy(values);
    setPagination({
      pageNumber: 1,
    });
  };

  const handleUpdatedByChange = (values: string[]) => {
    setSelectedUpdatedBy(values);
    setPagination({
      pageNumber: 1,
    });
  };

  const clearAllFilters = () => {
    setIsActive(null);
    setSelectedCreatedBy([]);
    setSelectedUpdatedBy([]);
    setPagination({
      pageNumber: 1,
    });
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo(() => {
    const baseColumns: DataTableColumn<Year>[] = [];

    if (canAccess(menuItems, ModuleBase.YEAR, Actions.EDIT)) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        width: "100px",
        cell: (year: Year) => (
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(`/year/${year.strYearGUID}`);
              }}
              title="Edit Year"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        ),
      });
    }

    baseColumns.push({
      key: "strName",
      header: "Year Name",
      width: "150px",
      cell: (year: Year) => (
        <div className="truncate" title={year.strName}>
          <span className="font-medium">{year.strName}</span>
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "bolIsActive",
      header: "Status",
      width: "100px",
      cell: (year: Year) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            year.bolIsActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {year.bolIsActive ? "Active" : "Inactive"}
        </span>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "previousYear",
      header: "Previous Year",
      width: "150px",
      cell: (year: Year) => (
        <div className="truncate" title={year.strPreviousYearName || "-"}>
          {year.strPreviousYearName || "-"}
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "nextYear",
      header: "Next Year",
      width: "150px",
      cell: (year: Year) => (
        <div className="truncate" title={year.strNextYearName || "-"}>
          {year.strNextYearName || "-"}
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "dtStartDate",
      header: "Start Date",
      width: "150px",
      cell: (year: Year) => {
        const startDate = format(new Date(year.dtStartDate), "MMM dd, yyyy");
        return (
          <div className="truncate" title={startDate}>
            {startDate}
          </div>
        );
      },
      sortable: true,
    });

    baseColumns.push({
      key: "dtEndDate",
      header: "End Date",
      width: "150px",
      cell: (year: Year) => {
        const endDate = format(new Date(year.dtEndDate), "MMM dd, yyyy");
        return (
          <div className="truncate" title={endDate}>
            {endDate}
          </div>
        );
      },
      sortable: true,
    });

    baseColumns.push({
      key: "strOrganizationName",
      header: "Organization",
      width: "180px",
      cell: (year: Year) => (
        <div className="truncate" title={year.strOrganizationName || "-"}>
          {year.strOrganizationName || "-"}
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "createdBy",
      header: "Created By",
      width: "150px",
      cell: (year: Year) => (
        <div className="truncate" title={year.strCreatedBy || "-"}>
          {year.strCreatedBy || "-"}
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "createdOn",
      header: "Created On",
      width: "180px",
      cell: (year: Year) => {
        const formattedDate = year.dtCreatedOn
          ? format(new Date(year.dtCreatedOn), "MMM d, yyyy, h:mm a")
          : "-";
        return (
          <div className="truncate" title={formattedDate}>
            {formattedDate}
          </div>
        );
      },
      sortable: true,
    });

    baseColumns.push({
      key: "updatedBy",
      header: "Updated By",
      width: "150px",
      cell: (year: Year) => (
        <div className="truncate" title={year.strUpdatedBy || "-"}>
          {year.strUpdatedBy || "-"}
        </div>
      ),
      sortable: true,
    });

    baseColumns.push({
      key: "updatedOn",
      header: "Updated On",
      width: "180px",
      cell: (year: Year) => {
        const formattedDate = year.dtUpdatedOn
          ? format(new Date(year.dtUpdatedOn), "MMM d, yyyy, h:mm a")
          : "-";
        return (
          <div className="truncate" title={formattedDate}>
            {formattedDate}
          </div>
        );
      },
      sortable: true,
    });

    return baseColumns;
  }, [navigate, menuItems]);

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
        title="Years"
        description="Manage financial years"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2 w-full">
            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-row sm:w-auto">
              <ExportButton exportMutation={exportYearsMutation} />

              <WithPermission module={ModuleBase.YEAR} action={Actions.SAVE}>
                <Button
                  onClick={() => navigate("/year/new")}
                  className="w-full sm:w-auto justify-center h-9 text-xs sm:text-sm"
                >
                  <Plus className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Add Year
                </Button>
              </WithPermission>
            </div>
          </div>
        }
      />

      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-4">
          <div className="relative flex-1 w-full sm:max-w-md mb-2 sm:mb-0">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search years..."
              className="pl-9 w-full h-9 text-xs sm:text-sm"
              value={search}
              onChange={handleSearch}
            />
            {search && (
              <button
                type="button"
                onClick={handleSearchClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Clear search</span>
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            )}
          </div>

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
                    "year_column_order",
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
                Filter years by additional criteria
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
                    placeholder="Filter by created by"
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
                    placeholder="Filter by updated by"
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

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
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
              header: col.header as string,
              width: col.width,
            }))}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={error ? [] : ((yearsResponse?.data?.items || []) as Year[])}
          columns={orderedColumns.filter(
            (col) => columnVisibility[col.key] !== false
          )}
          keyExtractor={(year) => year.strYearGUID}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSort}
          loading={false}
          emptyState={
            error ? (
              <>An error occurred loading years. Please try again later.</>
            ) : search ? (
              <>No years found matching "{search}".</>
            ) : (
              <>No years found. Click "Add Year" to create one.</>
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
          isTextWrapped={isTextWrapped}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem("year_column_widths", JSON.stringify(widths));
          }}
          maxHeight="calc(100vh - 350px)"
        />
      )}
    </CustomContainer>
  );
};

export default YearList;
