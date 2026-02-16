import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Building, Edit, Filter, Plus } from "lucide-react";

import type { Bank } from "@/types/Account/bank";

import { Actions, FormModules, ListModules } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";

import { format } from "date-fns";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { useUserRights } from "@/hooks";
import { useModuleUsers } from "@/hooks/api";
import { useBanks } from "@/hooks/api/Account/use-banks";
import { useOnlyBankAccountTypes } from "@/hooks/api/central/use-account-types";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";

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

const BankList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>(
    []
  );
  const [selectedCurrencyTypes, setSelectedCurrencyTypes] = useState<string[]>(
    []
  );
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [isPrimaryFilter, setIsPrimaryFilter] = useState<boolean | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    accountTypes: false,
    currencyTypes: false,
    createdBy: false,
    updatedBy: false,
  });

  const defaultColumnOrder = [
    "actions",
    "strAccountName",
    "strUDFCode",
    "strAccountTypeName",
    "bolIsPrimary",
    "strCurrencyTypeName",
    "strAccountNumber",
    "strBankName",
    "strIFSCCode",
    "strBranchName",
    "strDesc",
    "strCreatedByName",
    "dtCreatedOn",
    "strUpdatedByName",
    "dtUpdatedOn",
  ];

  const HeaderIcon = useMenuIcon(ListModules.BANK, Building);
  const { menuItems } = useUserRights();

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("bank", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strAccountName",
        direction: "asc",
      },
    });

  const sortBy = sorting.columnKey || "strAccountName";
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
  } = useTableLayout("bank", defaultColumnOrder, [
    "strBankGUID",
    "strGroupGUID",
    "strOrganizationGUID",
    "strCreatedByGUID",
    "strUpdatedByGUID",
  ]);

  const {
    data: banksResponse,
    isLoading,
    error,
  } = useBanks({
    search: debouncedSearch,
    strAccountTypeGUIDs:
      selectedAccountTypes.length > 0 ? selectedAccountTypes : undefined,
    strCurrencyTypeGUIDs:
      selectedCurrencyTypes.length > 0 ? selectedCurrencyTypes : undefined,
    strCreatedByGUIDs:
      selectedCreatedBy.length > 0 ? selectedCreatedBy : undefined,
    strUpdatedByGUIDs:
      selectedUpdatedBy.length > 0 ? selectedUpdatedBy : undefined,
    bolIsPrimary: isPrimaryFilter !== null ? isPrimaryFilter : undefined,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy,
    ascending,
  });

  const { data: accountTypes, isLoading: isAccountTypesLoading } =
    useOnlyBankAccountTypes(undefined, dropdownOpen.accountTypes);
  const { data: currencyTypes, isLoading: isCurrencyTypesLoading } =
    useActiveCurrencyTypes(undefined, dropdownOpen.currencyTypes);
  const { data: users, isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    dropdownOpen.createdBy || dropdownOpen.updatedBy
  );

  useEffect(() => {
    if (columnVisibility["bolIsPrimary"] === false) {
      toggleColumnVisibility("bolIsPrimary");
    }
  }, [columnVisibility, toggleColumnVisibility]);

  useEffect(() => {
    if (banksResponse?.data && Array.isArray(banksResponse.data)) {
      updateResponseData({
        totalCount: banksResponse.totalRecords || 0,
        totalPages: banksResponse.totalPages || 0,
      });
    }
  }, [
    banksResponse?.data,
    banksResponse?.totalRecords,
    banksResponse?.totalPages,
    updateResponseData,
  ]);

  const banks = useMemo(() => {
    if (!banksResponse?.data) {
      return [];
    }
    return Array.isArray(banksResponse.data) ? banksResponse.data : [];
  }, [banksResponse?.data]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      setPagination({
        pageNumber,
      });
    },
    [setPagination]
  );

  const changePageSize = useCallback(
    (pageSize: number) => {
      setPagination({
        pageNumber: 1,
        pageSize,
      });
    },
    [setPagination]
  );

  const handleSortChange = useCallback(
    (columnKey: string) => {
      setSorting({
        columnKey,
        direction:
          sorting.columnKey === columnKey
            ? sorting.direction === "asc"
              ? "desc"
              : "asc"
            : "asc",
      });
    },
    [sorting.columnKey, sorting.direction, setSorting]
  );

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo<DataTableColumn<Bank>[]>(() => {
    const baseColumns: DataTableColumn<Bank>[] = [];

    if (canAccess(menuItems, FormModules.BANK, Actions.EDIT)) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        cell: (bank) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(`/bank/${bank.strBankGUID}`);
              }}
              title="Edit bank"
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
        key: "strAccountName",
        header: "Account Name",
        cell: (bank) => (
          <div
            className={
              isTextWrapped ? "wrap-wrap-wrap-wrap-break-word" : "truncate"
            }
            title={bank.strAccountName || ""}
          >
            {bank.strAccountName}
          </div>
        ),
        width: "200px",
        sortable: true,
      },
      {
        key: "strUDFCode",
        header: "Account Code",
        cell: (bank) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={bank.strUDFCode || ""}
          >
            {bank.strUDFCode}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "strAccountTypeName",
        header: "Account Type",
        cell: (bank) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={bank.strAccountTypeName || ""}
          >
            {bank.strAccountTypeName}
          </div>
        ),
        width: "180px",
        sortable: true,
      },
      {
        key: "bolIsPrimary",
        header: "Primary",
        cell: (bank) => (
          <div>
            {bank.bolIsPrimary ? (
              <Badge variant="default">Yes</Badge>
            ) : (
              <Badge variant="outline">No</Badge>
            )}
          </div>
        ),
        width: "100px",
        sortable: true,
      },
      {
        key: "strCurrencyTypeName",
        header: "Currency Type",
        cell: (bank) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={bank.strCurrencyTypeName || ""}
          >
            {bank.strCurrencyTypeName}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "strAccountNumber",
        header: "Account Number",
        cell: (bank) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={String(bank.strAccountNumber ?? "")}
          >
            {bank.strAccountNumber}
          </div>
        ),
        width: "180px",
        sortable: true,
      },
      {
        key: "strBankName",
        header: "Bank Name",
        cell: (bank) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={bank.strBankName || ""}
          >
            {bank.strBankName}
          </div>
        ),
        width: "200px",
        sortable: true,
      },
      {
        key: "strIFSCCode",
        header: "IFSC Code",
        cell: (bank) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={bank.strIFSCCode || ""}
          >
            {bank.strIFSCCode}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "strBranchName",
        header: "Branch Name",
        cell: (bank) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={bank.strBranchName || ""}
          >
            {bank.strBranchName}
          </div>
        ),
        width: "200px",
        sortable: true,
      },
      {
        key: "strDesc",
        header: "Description",
        cell: (bank) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={(bank.strDesc ?? "-") as string}
          >
            {bank.strDesc || "-"}
          </div>
        ),
        width: "300px",
        sortable: true,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        cell: (bank) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={bank.strCreatedByName || ""}
          >
            {bank.strCreatedByName}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created Date",
        cell: (bank) => (
          <div className="whitespace-nowrap">
            {bank.dtCreatedOn
              ? format(new Date(bank.dtCreatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        width: "180px",
        sortable: true,
      },

      {
        key: "strUpdatedByName",
        header: "Updated By",
        cell: (bank) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={bank.strUpdatedByName || ""}
          >
            {bank.strUpdatedByName}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated Date",
        cell: (bank) => (
          <div className="whitespace-nowrap">
            {bank.dtUpdatedOn
              ? format(new Date(bank.dtUpdatedOn), "MMM d, yyyy, h:mm a")
              : "-"}
          </div>
        ),
        width: "180px",
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

      // If a column is not in columnOrder, put it at the end
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [columns, columnOrder]);

  const clearFilters = useCallback(() => {
    setDebouncedSearch("");
    setSelectedAccountTypes([]);
    setSelectedCurrencyTypes([]);
    setSelectedCreatedBy([]);
    setSelectedUpdatedBy([]);
    setIsPrimaryFilter(null);
  }, []);

  return (
    <CustomContainer>
      <PageHeader
        title="Banks"
        description="Manage bank accounts"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <WithPermission
              module={FormModules.BANK}
              action={Actions.SAVE}
              fallback={<></>}
            >
              <Button onClick={() => navigate("/bank/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Bank
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search banks..."
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
              {(selectedAccountTypes.length > 0 ||
                selectedCurrencyTypes.length > 0 ||
                selectedCreatedBy.length > 0 ||
                selectedUpdatedBy.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {selectedAccountTypes.length +
                    selectedCurrencyTypes.length +
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
                    "bank_column_order",
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
                Filter banks by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Account Type
                  </label>
                  <MultiSelect
                    options={
                      accountTypes?.map((type) => ({
                        value: type.strAccountTypeGUID,
                        label: type.strName,
                      })) || []
                    }
                    selectedValues={selectedAccountTypes}
                    onChange={setSelectedAccountTypes}
                    placeholder="Filter by account type"
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        accountTypes: isOpen,
                      }))
                    }
                    isLoading={
                      dropdownOpen.accountTypes && isAccountTypesLoading
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Currency Type
                  </label>
                  <MultiSelect
                    options={
                      currencyTypes?.map((type) => ({
                        value: type.strCurrencyTypeGUID,
                        label: type.strName,
                      })) || []
                    }
                    selectedValues={selectedCurrencyTypes}
                    onChange={setSelectedCurrencyTypes}
                    placeholder="Filter by currency type"
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        currencyTypes: isOpen,
                      }))
                    }
                    isLoading={
                      dropdownOpen.currencyTypes && isCurrencyTypesLoading
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
                        value: user.strUserGUID,
                        label: user.strName,
                      })) || []
                    }
                    selectedValues={selectedCreatedBy}
                    onChange={setSelectedCreatedBy}
                    placeholder="Filter by creator"
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
                      users?.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName,
                      })) || []
                    }
                    selectedValues={selectedUpdatedBy}
                    onChange={setSelectedUpdatedBy}
                    placeholder="Filter by updater"
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        updatedBy: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.updatedBy && isUsersLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Primary Bank
                  </label>
                  <Select
                    value={
                      isPrimaryFilter === null
                        ? "all"
                        : isPrimaryFilter
                          ? "true"
                          : "false"
                    }
                    onValueChange={(value: string) => {
                      if (value === "true") {
                        setIsPrimaryFilter(true);
                      } else if (value === "false") {
                        setIsPrimaryFilter(false);
                      } else {
                        setIsPrimaryFilter(null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by primary status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={
                    selectedAccountTypes.length === 0 &&
                    isPrimaryFilter === null &&
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
            "Bank Name",
            "Account Number",
            "Description",
            "Bank Name",
            "Currency",
            "Created By",
            "Created On",
            "Updated By",
            "Updated On",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable<Bank>
          data={error ? [] : banks}
          columns={orderedColumns}
          keyExtractor={(item) => item.strBankGUID}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSortChange}
          loading={false}
          isTextWrapped={isTextWrapped}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem("bank_column_widths", JSON.stringify(widths));
          }}
          emptyState={
            error ? (
              <>An error occurred loading banks. Please try again later.</>
            ) : debouncedSearch ? (
              <>No banks found matching "{debouncedSearch}".</>
            ) : (
              <>No banks found. Click "New Bank" to create one.</>
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

export default BankList;
