import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Edit, Filter, Plus } from "lucide-react";
import type { Item } from "@/types/Account/item";
import { Actions, FormModules, ListModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";
import { format } from "date-fns";
import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { useUserRights } from "@/hooks";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useModuleUsers } from "@/hooks/api";
import { useItems } from "@/hooks/api/Account/use-items";
import { useActiveTaxCategories } from "@/hooks/api/central/use-tax-categories";

import { Badge } from "@/components/ui/badge";
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
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";

const ItemList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaxCategories, setSelectedTaxCategories] = useState<string[]>(
    []
  );
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [isSellableFilter, setIsSellableFilter] = useState<boolean | null>(
    null
  );
  const [isPurchasableFilter, setIsPurchasableFilter] = useState<
    boolean | null
  >(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    taxCategories: false,
    createdBy: false,
    updatedBy: false,
  });

  const defaultColumnOrder = [
    "actions",
    "strType",
    "strName",
    "strUnitName",
    "bolIsSellable",
    "dblSellingPrice",
    "strSalesDescription",
    "bolIsPurchasable",
    "dblCostPrice",
    "strPurchaseDescription",
    "strTaxCategoryName",
    "strHSNCode",
    "strCreatedByName",
    "dtCreatedOn",
    "strUpdatedByName",
    "dtUpdatedOn",
  ];

  const HeaderIcon = useMenuIcon(ListModules.ITEM, Package);
  const { menuItems } = useUserRights();
  const { user } = useAuthContext();

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("item", {
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

  const {
    data: itemsResponse,
    isLoading,
    error,
  } = useItems({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch,
    sortBy: sorting.columnKey || undefined,
    ascending: sorting.direction === "asc",
    strType: selectedType || undefined,
    strTaxCategoryGUID:
      selectedTaxCategories.length > 0
        ? selectedTaxCategories.join(",")
        : undefined,
    strCreatedByGUIDs:
      selectedCreatedBy.length > 0 ? selectedCreatedBy.join(",") : undefined,
    strUpdatedByGUIDs:
      selectedUpdatedBy.length > 0 ? selectedUpdatedBy.join(",") : undefined,
    bolIsSellable: isSellableFilter || undefined,
    bolIsPurchasable: isPurchasableFilter || undefined,
  });

  const { data: taxCategories, isLoading: isTaxCategoriesLoading } =
    useActiveTaxCategories(
      user?.strTaxTypeGUID || "",
      undefined,
      dropdownOpen.taxCategories
    );
  const { data: users, isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    dropdownOpen.createdBy || dropdownOpen.updatedBy
  );

  useEffect(() => {
    if (itemsResponse?.data && Array.isArray(itemsResponse.data)) {
      updateResponseData({
        totalCount: itemsResponse.totalRecords || 0,
        totalPages: itemsResponse.totalPages || 0,
      });
    }
  }, [
    itemsResponse?.data,
    itemsResponse?.totalRecords,
    itemsResponse?.totalPages,
    updateResponseData,
  ]);

  const items = useMemo(() => {
    if (!itemsResponse?.data) return [];
    return Array.isArray(itemsResponse.data) ? itemsResponse.data : [];
  }, [itemsResponse?.data]);

  const goToPage = useCallback(
    (page: number) => {
      setPagination({ pageNumber: page });
    },
    [setPagination]
  );

  const changePageSize = useCallback(
    (size: number) => {
      setPagination({ pageSize: size, pageNumber: 1 });
    },
    [setPagination]
  );

  const handleSortChange = useCallback(
    (columnKey: string) => {
      if (sorting.columnKey === columnKey) {
        setSorting({ direction: sorting.direction === "asc" ? "desc" : "asc" });
      } else {
        setSorting({ columnKey, direction: "asc" });
      }
      setPagination({ pageNumber: 1 });
    },
    [sorting.columnKey, sorting.direction, setSorting, setPagination]
  );

  const sortBy = sorting.columnKey;
  const ascending = sorting.direction === "asc";

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

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
  } = useTableLayout("item", defaultColumnOrder);

  const columns = useMemo<DataTableColumn<Item>[]>(() => {
    const baseColumns: DataTableColumn<Item>[] = [];

    if (
      canAccess(menuItems, FormModules.ITEM, Actions.EDIT) ||
      canAccess(menuItems, FormModules.ITEM, Actions.VIEW)
    ) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        width: "80px",
        cell: (item) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(`/item/${item.strItemGUID}`);
              }}
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
              title="Edit item"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        ),
        sortable: false,
      });
    }

    baseColumns.push(
      {
        key: "strType",
        header: "Type",
        width: "120px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strType}
          >
            {item.strType}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strName",
        header: "Item Name",
        width: "200px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strName}
          >
            {item.strName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strUnitName",
        header: "Unit",
        width: "120px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strUnitName || "-"}
          >
            {item.strUnitName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsSellable",
        header: "Sellable",
        width: "100px",
        cell: (item) => (
          <div>
            {item.bolIsSellable ? (
              <Badge variant="approved" className="bg-green-200">
                Yes
              </Badge>
            ) : (
              <Badge variant="draft">No</Badge>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dblSellingPrice",
        header: "Selling Price",
        width: "180px",
        cell: (item) => (
          <div className="truncate">
            {item.dblSellingPrice ? `₹${item.dblSellingPrice}` : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strSalesDescription",
        header: "Sales Description",
        width: "250px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strSalesDescription || "-"}
          >
            {item.strSalesDescription || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsPurchasable",
        header: "Purchasable",
        width: "120px",
        cell: (item) => (
          <div>
            {item.bolIsPurchasable ? (
              <Badge variant="approved" className="bg-green-200">
                Yes
              </Badge>
            ) : (
              <Badge variant="draft">No</Badge>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dblCostPrice",
        header: "Cost Price",
        width: "120px",
        cell: (item) => (
          <div className="truncate">
            {item.dblCostPrice ? `₹${item.dblCostPrice}` : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPurchaseDescription",
        header: "Purchase Description",
        width: "250px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strPurchaseDescription || "-"}
          >
            {item.strPurchaseDescription || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTaxCategoryName",
        header: "Tax Category",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strTaxCategoryName || "-"}
          >
            {item.strTaxCategoryName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strHSNCode",
        header: "HSN Code",
        width: "120px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strHSNCode || "-"}
          >
            {item.strHSNCode || "-"}
          </div>
        ),
        sortable: true,
      },

      {
        key: "strCreatedByName",
        header: "Created By",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCreatedByName || ""}
          >
            {item.strCreatedByName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created Date",
        width: "180px",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {item.dtCreatedOn
              ? format(new Date(item.dtCreatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "150px",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strUpdatedByName || ""}
          >
            {item.strUpdatedByName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated Date",
        width: "180px",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {item.dtUpdatedOn
              ? format(new Date(item.dtUpdatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        sortable: true,
      }
    );

    return baseColumns;
  }, [menuItems, isTextWrapped, openEditInNewTab]);

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

  const clearFilters = useCallback(() => {
    setDebouncedSearch("");
    setSelectedType(null);
    setSelectedTaxCategories([]);
    setSelectedCreatedBy([]);
    setSelectedUpdatedBy([]);
    setIsSellableFilter(null);
    setIsPurchasableFilter(null);
  }, []);

  return (
    <CustomContainer>
      <PageHeader
        title="Items"
        description="Manage products and services"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <WithPermission
              module={FormModules.ITEM}
              action={Actions.SAVE}
              fallback={<></>}
            >
              <Button onClick={() => navigate("/item/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Item
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search items..."
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
              {(selectedType !== null ||
                selectedTaxCategories.length > 0 ||
                selectedCreatedBy.length > 0 ||
                selectedUpdatedBy.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {(selectedType !== null ? 1 : 0) +
                    selectedTaxCategories.length +
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
                    "item_column_order",
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
                Filter items by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Select
                    value={selectedType || "all"}
                    onValueChange={(value: string) => {
                      if (value === "all") {
                        setSelectedType(null);
                      } else {
                        setSelectedType(value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tax Category
                  </label>
                  <MultiSelect
                    options={
                      taxCategories?.map((cat) => ({
                        value: cat.strTaxCategoryGUID,
                        label: cat.strCategoryName,
                      })) || []
                    }
                    selectedValues={selectedTaxCategories}
                    onChange={setSelectedTaxCategories}
                    placeholder="Filter by tax category"
                    isLoading={
                      dropdownOpen.taxCategories && isTaxCategoriesLoading
                    }
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        taxCategories: isOpen,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sellable
                  </label>
                  <Select
                    value={
                      isSellableFilter === null
                        ? "all"
                        : isSellableFilter
                          ? "true"
                          : "false"
                    }
                    onValueChange={(value: string) => {
                      if (value === "true") {
                        setIsSellableFilter(true);
                      } else if (value === "false") {
                        setIsSellableFilter(false);
                      } else {
                        setIsSellableFilter(null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by sellable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Purchasable
                  </label>
                  <Select
                    value={
                      isPurchasableFilter === null
                        ? "all"
                        : isPurchasableFilter
                          ? "true"
                          : "false"
                    }
                    onValueChange={(value: string) => {
                      if (value === "true") {
                        setIsPurchasableFilter(true);
                      } else if (value === "false") {
                        setIsPurchasableFilter(false);
                      } else {
                        setIsPurchasableFilter(null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by purchasable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Created By
                  </label>
                  <MultiSelect
                    options={
                      users?.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName,
                      })) || []
                    }
                    selectedValues={selectedCreatedBy}
                    onChange={setSelectedCreatedBy}
                    placeholder="Filter by creator"
                    isLoading={dropdownOpen.createdBy && isUsersLoading}
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        createdBy: isOpen,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Updated By
                  </label>
                  <MultiSelect
                    options={
                      users?.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName,
                      })) || []
                    }
                    selectedValues={selectedUpdatedBy}
                    onChange={setSelectedUpdatedBy}
                    placeholder="Filter by updater"
                    isLoading={dropdownOpen.updatedBy && isUsersLoading}
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        updatedBy: isOpen,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={
                    selectedType === null &&
                    selectedTaxCategories.length === 0 &&
                    selectedCreatedBy.length === 0 &&
                    selectedUpdatedBy.length === 0 &&
                    isSellableFilter === null &&
                    isPurchasableFilter === null
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
          columns={[
            "Actions",
            "Type",
            "Item Name",
            "Unit",
            "Sellable",
            "Selling Price",
            "Purchasable",
            "Cost Price",
            "Tax Category",
            "HSN Code",
            "Created By",
            "Created On",
            "Updated By",
            "Updated On",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable<Item>
          data={error ? [] : items}
          columns={orderedColumns}
          keyExtractor={(item) => item.strItemGUID}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          sortBy={sortBy || undefined}
          ascending={ascending}
          onSort={handleSortChange}
          loading={false}
          isTextWrapped={isTextWrapped}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem("item_column_widths", JSON.stringify(widths));
          }}
          emptyState={
            error ? (
              <>An error occurred loading items. Please try again later.</>
            ) : debouncedSearch ? (
              <>No items found matching "{debouncedSearch}".</>
            ) : (
              <>No items found. Click "New Item" to create one.</>
            )
          }
          pagination={{
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount: pagination.totalCount || 0,
            totalPages: pagination.totalPages || 0,
            onPageChange: goToPage,
            onPageSizeChange: changePageSize,
          }}
          maxHeight="calc(100vh - 350px)"
          pageSizeOptions={[5, 10, 20, 50]}
        />
      )}
    </CustomContainer>
  );
};

export default ItemList;
