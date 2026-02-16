import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import {
  usePicklistValues,
  useExportPicklistValues,
  useUserRights,
  useMenuIcon,
} from "@/hooks";
import { useActivePicklistTypes, useActiveUsers } from "@/hooks/api";
import { Actions, ListModules, FormModules } from "@/lib/permissions";
import { useTableLayout, useListPreferences } from "@/hooks/common";
import { WithPermission } from "@/components/ui/with-permission";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";
import { canAccess } from "@/lib/permissions";

import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Plus, Tag, Filter, FileText, Download } from "lucide-react";
import type { PicklistValue } from "@/types/central/picklist-value";
import type { PicklistTypeSimple } from "@/types/central/picklist-type";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

const PicklistValueList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const defaultColumnOrder = [
    "actions",
    "strValue",
    "bolIsActive",
    "strPicklistType",
    "createdBy",
    "createdOn",
    "updatedBy",
    "updatedOn",
  ];

  const { menuItems } = useUserRights();

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "picklistValue",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strValue",
        direction: "asc",
      },
    }
  );

  const sortBy = sorting.columnKey || "strValue";
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
  } = useTableLayout("picklistValue", defaultColumnOrder, [], {
    actions: true,
    strValue: true,
    bolIsActive: true,
    strPicklistType: true,
    createdBy: true,
    createdOn: true,
    updatedBy: true,
    updatedOn: true,
  });

  const {
    data: picklistValuesResponse,
    isLoading,
    error,
  } = usePicklistValues({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    picklistTypeGUIDs: selectedTypes.length > 0 ? selectedTypes : undefined,
    bolIsActive: isActive !== null ? isActive : undefined,
    createdByGUIDs: selectedCreatedBy.length ? selectedCreatedBy : undefined,
    updatedByGUIDs: selectedUpdatedBy.length ? selectedUpdatedBy : undefined,
    sortBy,
    ascending,
  });

  useEffect(() => {
    setPagination({
      pageNumber: 1,
    });
  }, [debouncedSearch, setPagination]);

  const {
    data: activePicklistTypes = [] as PicklistTypeSimple[],
    isLoading: isPicklistTypesLoading,
  } = useActivePicklistTypes();

  const { data: users = [], isLoading: isUsersLoading } = useActiveUsers();

  useEffect(() => {
    if (picklistValuesResponse?.data) {
      setPagination({
        totalCount: picklistValuesResponse.data?.totalCount || 0,
        totalPages: picklistValuesResponse.data?.totalPages || 1,
      });
    }
  }, [picklistValuesResponse, setPagination]);

  const exportPicklistValues = useExportPicklistValues();

  const handleExport = async (format: "excel" | "csv") => {
    await exportPicklistValues.mutateAsync({ format });
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

  const handleTypeChange = (values: string[]) => {
    setSelectedTypes(values);
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

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo(() => {
    const baseColumns: DataTableColumn<PicklistValue>[] = [];

    if (canAccess(menuItems, FormModules.PICKLIST_VALUE, Actions.EDIT)) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        width: "100px",
        cell: (picklistValue) => (
          <div
            className="flex justify-center sm:justify-start space-x-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(
                  `/picklist-value/${picklistValue.strPickListValueGUID}`
                );
              }}
              title="Edit picklist value"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        ),
      });
    }

    baseColumns.push(
      {
        key: "strValue",
        header: "Picklist Value",
        width: "180px",
        cell: (picklistValue) => (
          <div className="truncate" title={picklistValue.strValue}>
            <span className="font-medium">{picklistValue.strValue}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "100px",
        cell: (picklistValue) => (
          <div className="flex justify-center sm:justify-start">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                picklistValue.bolIsActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {picklistValue.bolIsActive ? "Active" : "Inactive"}
            </span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPicklistType",
        header: "Type",
        width: "150px",
        cell: (picklistValue) => (
          <div className="truncate" title={picklistValue.strPicklistType}>
            {picklistValue.strPicklistType}
          </div>
        ),
        sortable: true,
      },
      {
        key: "createdBy",
        header: "Created By",
        width: "180px",
        cell: (picklistValue) => (
          <div className="truncate" title={picklistValue.strCreatedBy || "-"}>
            {picklistValue.strCreatedBy || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "createdOn",
        header: "Created On",
        width: "220px",
        cell: (picklistValue) => {
          const formattedDate = picklistValue.dtCreatedOn
            ? formatDate(picklistValue.dtCreatedOn, true)
            : "-";
          return (
            <div className="truncate" title={formattedDate}>
              {formattedDate}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "updatedBy",
        header: "Updated By",
        width: "180px",
        cell: (picklistValue) => (
          <div className="truncate" title={picklistValue.strUpdatedBy || "-"}>
            {picklistValue.strUpdatedBy || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "updatedOn",
        header: "Updated On",
        width: "220px",
        cell: (picklistValue) => {
          const formattedDate = picklistValue.dtUpdatedOn
            ? formatDate(picklistValue.dtUpdatedOn, true)
            : "-";
          return (
            <div className="truncate" title={formattedDate}>
              {formattedDate}
            </div>
          );
        },
        sortable: true,
      }
    );

    return baseColumns;
  }, [openEditInNewTab, menuItems]);

  const HeaderIcon = useMenuIcon(ListModules.PICKLIST_VALUE, Tag);

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
        title="Picklist Values"
        description="Manage your picklist values"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <WithPermission
              module={ListModules.PICKLIST_VALUE}
              action={Actions.EXPORT}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-center"
                    size="sm"
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport("excel")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </WithPermission>

            <WithPermission
              module={FormModules.PICKLIST_VALUE}
              action={Actions.SAVE}
            >
              <Button
                onClick={() => navigate("/picklist-value/new")}
                className="justify-center"
                size="sm"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Picklist Value
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-4">
          <SearchInput
            placeholder="Search picklist values..."
            onSearchChange={setDebouncedSearch}
            className="w-full sm:max-w-md"
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
              {(selectedTypes.length > 0 ||
                isActive !== null ||
                selectedCreatedBy.length > 0 ||
                selectedUpdatedBy.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {selectedTypes.length +
                    (isActive !== null ? 1 : 0) +
                    selectedCreatedBy.length +
                    selectedUpdatedBy.length}
                </span>
              )}
            </Button>

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
                    "picklistValue_column_order",
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
                Filter picklist values by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <MultiSelect
                    options={
                      activePicklistTypes.map((type) => ({
                        value:
                          type.strPicklistTypeGUID || `type-${type.strType}`,
                        label: type.strType,
                      })) || []
                    }
                    selectedValues={selectedTypes}
                    onChange={handleTypeChange}
                    placeholder="Filter by type"
                    isLoading={isPicklistTypesLoading}
                  />
                </div>

                <div className="col-span-1">
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

                <div className="col-span-1">
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
                    isLoading={isUsersLoading}
                  />
                </div>

                <div className="col-span-1">
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
                    isLoading={isUsersLoading}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-center sm:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTypes([]);
                    setIsActive(null);
                    setSelectedCreatedBy([]);
                    setSelectedUpdatedBy([]);
                    setPagination({ pageNumber: 1 });
                  }}
                  disabled={
                    selectedTypes.length === 0 &&
                    isActive === null &&
                    selectedCreatedBy.length === 0 &&
                    selectedUpdatedBy.length === 0
                  }
                  className="w-full sm:w-auto"
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
            "Picklist Value",
            "Status",
            "Type",
            "Created By",
            "Created On",
            "Updated By",
            "Updated On",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="min-w-full">
            <DataTable
              data={error ? [] : picklistValuesResponse?.data?.items || []}
              columns={orderedColumns}
              keyExtractor={(picklistValue) =>
                picklistValue.strPicklistValueGUID || Math.random().toString()
              }
              sortBy={sortBy}
              ascending={ascending}
              onSort={handleSort}
              loading={false}
              emptyState={
                error ? (
                  <>
                    An error occurred loading picklist values. Please try again
                    later.
                  </>
                ) : debouncedSearch ? (
                  <>No picklist values found matching "{debouncedSearch}".</>
                ) : (
                  <>
                    No picklist values found. Click "Add Picklist Value" to
                    create one.
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
              columnVisibility={columnVisibility}
              alwaysVisibleColumns={getAlwaysVisibleColumns()}
              isTextWrapped={isTextWrapped}
              pinnedColumns={pinnedColumns}
              columnWidths={columnWidths}
              onColumnWidthsChange={(widths) => {
                setColumnWidths(widths);
                localStorage.setItem(
                  "picklistValue_column_widths",
                  JSON.stringify(widths)
                );
              }}
              maxHeight="calc(100vh - 350px)"
            />
          </div>
        </div>
      )}
    </CustomContainer>
  );
};

export default PicklistValueList;
