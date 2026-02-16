import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Filter, Plus, Factory } from "lucide-react";

import type { Vendor } from "@/types/Account/vendor";

import { Actions, FormModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";

import { format } from "date-fns";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { useUserRights } from "@/hooks";
import { useModuleUsers } from "@/hooks/api";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { useVendors } from "@/hooks/api/Account/use-vendors";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/select/multi-select";
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

const VendorList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [selectedCurrencyTypes, setSelectedCurrencyTypes] = useState<string[]>(
    []
  );
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    currencies: false,
    createdBy: false,
    updatedBy: false,
  });

  const defaultColumnOrder = [
    "actions",
    "strUDFCode",
    "strPartyName_Display",
    "strCompanyName",
    "strEmail",
    "strPhoneNoWork",
    "strPhoneNoPersonal",
    "strPAN",
    "strTaxRegNo",
    "strPartyLanguage",
    "strCurrencyTypeName",
    "intPaymentTerms_inDays",
    "strWebsiteURL",
    "strDepartment",
    "strDesignation",
    "strCreatedByName",
    "dtCreatedOn",
    "strUpdatedByName",
    "dtUpdatedOn",
  ];

  const HeaderIcon = useMenuIcon("vendor_list", Factory);
  const { menuItems } = useUserRights();

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "vendor",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strPartyName_Display",
        direction: "asc",
      },
    }
  );

  const sortBy = sorting.columnKey || "strPartyName_Display";
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
  } = useTableLayout("vendor", defaultColumnOrder, []);

  const {
    data: vendorsResponse,
    isLoading,
    error,
  } = useVendors({
    search: debouncedSearch,
    strPartyType: "Vendor",
    strCurrencyTypeGUIDs:
      selectedCurrencyTypes.length > 0 ? selectedCurrencyTypes : undefined,
    strCreatedByGUIDs:
      selectedCreatedBy.length > 0 ? selectedCreatedBy : undefined,
    strUpdatedByGUIDs:
      selectedUpdatedBy.length > 0 ? selectedUpdatedBy : undefined,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy,
    ascending,
  });

  const { data: currencyTypes, isLoading: isLoadingCurrencies } =
    useActiveCurrencyTypes(undefined, dropdownOpen.currencies);
  const { data: users, isLoading: isLoadingUsers } = useModuleUsers(
    undefined,
    undefined,
    dropdownOpen.createdBy || dropdownOpen.updatedBy
  );

  useEffect(() => {
    if (vendorsResponse?.data) {
      setPagination({
        pageNumber: vendorsResponse.pageNumber,
        pageSize: vendorsResponse.pageSize,
        totalCount: vendorsResponse.totalRecords,
        totalPages: vendorsResponse.totalPages,
      });
    }
  }, [vendorsResponse, setPagination]);

  const goToPage = (pageNumber: number) => {
    setPagination({
      pageNumber,
    });
  };

  const changePageSize = (pageSize: number) => {
    setPagination({
      pageNumber: 1,
      pageSize,
    });
  };

  const handleSortChange = (columnKey: string) => {
    setSorting({
      columnKey,
      direction:
        sorting.columnKey === columnKey
          ? sorting.direction === "asc"
            ? "desc"
            : "asc"
          : "asc",
    });
  };

  const clearFilters = () => {
    setDebouncedSearch("");
    setSelectedCurrencyTypes([]);
    setSelectedCreatedBy([]);
    setSelectedUpdatedBy([]);
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo<DataTableColumn<Vendor>[]>(() => {
    const baseColumns: DataTableColumn<Vendor>[] = [];

    if (canAccess(menuItems, FormModules.CUSTOMER, Actions.EDIT)) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        width: "80px",
        cell: (vendor) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(`/vendor/${vendor.strPartyGUID}`);
              }}
              title="Edit vendor"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
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
        key: "strPartyName_Display",
        header: "Name",
        width: "200px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strPartyName_Display}
          >
            {vendor.strPartyName_Display}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCompanyName",
        header: "Company Name",
        width: "200px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strCompanyName || "-"}
          >
            {vendor.strCompanyName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strUDFCode",
        header: "Account Code",
        width: "150px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strUDFCode}
          >
            {vendor.strUDFCode}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strEmail",
        header: "Email",
        width: "200px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strEmail}
          >
            {vendor.strEmail}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPhoneNoWork",
        header: "Work Phone",
        width: "150px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strPhoneNoWork || "-"}
          >
            {vendor.strPhoneNoWork || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPhoneNoPersonal",
        header: "Personal Phone",
        width: "180px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strPhoneNoPersonal || "-"}
          >
            {vendor.strPhoneNoPersonal || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPAN",
        header: "PAN",
        width: "150px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strPAN}
          >
            {vendor.strPAN}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strTaxRegNo",
        header: "Tax Reg. No.",
        width: "180px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strTaxRegNo || "-"}
          >
            {vendor.strTaxRegNo || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPartyLanguage",
        header: "Language",
        width: "150px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strPartyLanguage || "-"}
          >
            {vendor.strPartyLanguage || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCurrencyTypeName",
        header: "Currency",
        width: "180px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strCurrencyTypeName || undefined}
          >
            {vendor.strCurrencyTypeName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "intPaymentTerms_inDays",
        header: "Payment Terms (Days)",
        cell: (vendor) => (
          <div className="text-right mr-4 justify-center">
            {vendor.intPaymentTerms_inDays}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strWebsiteURL",
        header: "Website",
        width: "200px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strWebsiteURL}
          >
            {vendor.strWebsiteURL}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strDepartment",
        header: "Department",
        width: "150px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strDepartment}
          >
            {vendor.strDepartment}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strDesignation",
        header: "Designation",
        width: "150px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strDesignation}
          >
            {vendor.strDesignation}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        width: "150px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strCreatedByName || undefined}
          >
            {vendor.strCreatedByName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created Date",
        width: "180px",
        cell: (vendor) => (
          <div className="whitespace-nowrap">
            {vendor.dtCreatedOn
              ? format(new Date(vendor.dtCreatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "150px",
        cell: (vendor) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={vendor.strUpdatedByName || undefined}
          >
            {vendor.strUpdatedByName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated Date",
        width: "180px",
        cell: (vendor) => (
          <div className="whitespace-nowrap">
            {vendor.dtUpdatedOn
              ? format(new Date(vendor.dtUpdatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        sortable: true,
      }
    );

    return baseColumns;
  }, [menuItems, navigate, isTextWrapped]);

  // Apply column ordering
  const orderedColumns = useMemo(() => {
    if (!columns || columns.length === 0) return columns;

    return [...columns].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.key);
      const bIndex = columnOrder.indexOf(b.key);

      // If a column is not in columnOrder, put it at the end
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <PageHeader
        title="Vendors"
        description="Manage your vendors"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <WithPermission
              module={FormModules.CUSTOMER}
              action={Actions.SAVE}
              fallback={<></>}
            >
              <Button onClick={() => navigate("/vendor/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Vendor
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search vendors..."
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
              {(selectedCurrencyTypes.length > 0 ||
                selectedCreatedBy.length > 0 ||
                selectedUpdatedBy.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {selectedCurrencyTypes.length +
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
                    "vendor_column_order",
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
                Filter vendors by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Currency Type
                  </label>
                  <MultiSelect
                    options={
                      currencyTypes?.map((currency) => ({
                        label: currency.strName,
                        value: currency.strCurrencyTypeGUID,
                      })) || []
                    }
                    selectedValues={selectedCurrencyTypes}
                    onChange={setSelectedCurrencyTypes}
                    placeholder="Filter by currency type"
                    isLoading={isLoadingCurrencies}
                    onOpenChange={(isOpen: boolean) =>
                      setDropdownOpen((p) => ({ ...p, currencies: isOpen }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Created By
                  </label>
                  <MultiSelect
                    options={
                      users?.map((user) => ({
                        label: user.strName,
                        value: user.strUserGUID,
                      })) || []
                    }
                    selectedValues={selectedCreatedBy}
                    onChange={setSelectedCreatedBy}
                    placeholder="Filter by creator"
                    isLoading={isLoadingUsers}
                    onOpenChange={(isOpen: boolean) =>
                      setDropdownOpen((p) => ({ ...p, createdBy: isOpen }))
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
                        label: user.strName,
                        value: user.strUserGUID,
                      })) || []
                    }
                    selectedValues={selectedUpdatedBy}
                    onChange={setSelectedUpdatedBy}
                    placeholder="Filter by updater"
                    isLoading={isLoadingUsers}
                    onOpenChange={(isOpen: boolean) =>
                      setDropdownOpen((p) => ({ ...p, updatedBy: isOpen }))
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={
                    selectedCurrencyTypes.length === 0 &&
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
          columns={[
            "Actions",
            "Account Code",
            "Display Name",
            "Company Name",
            "Email",
            "Work Phone",
            "Personal Phone",
            "Currency",
            "Created By",
            "Created On",
            "Updated By",
            "Updated On",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable<Vendor>
          data={error ? [] : vendorsResponse?.data || []}
          columns={orderedColumns}
          pagination={{
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            totalCount: pagination.totalCount || 0,
            totalPages: pagination.totalPages || 0,
            onPageChange: goToPage,
            onPageSizeChange: changePageSize,
          }}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSortChange}
          pageSizeOptions={[5, 10, 20, 50]}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "vendor_column_widths",
              JSON.stringify(widths)
            );
          }}
          keyExtractor={(item) => item.strPartyGUID}
          emptyState={
            error ? (
              <>An error occurred loading vendors. Please try again later.</>
            ) : debouncedSearch ? (
              <>No vendors found matching "{debouncedSearch}".</>
            ) : (
              <>No vendors found. Click "New Vendor" to create one.</>
            )
          }
          maxHeight="calc(100vh - 350px)"
        />
      )}
    </CustomContainer>
  );
};

export default VendorList;
