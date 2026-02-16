import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Filter,
  Plus,
  TrendingUp,
  Upload,
  AlertCircle,
} from "lucide-react";

import type { OpeningBalanceListItem } from "@/types/Account/opening-balance";

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
import {
  useOpeningBalances,
  useValidateOpeningBalanceImport,
  useImportOpeningBalances,
} from "@/hooks/api/Account/use-opening-balances";
import { useAccountsByTypesTree } from "@/hooks/api/Account";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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

const getCurrentMonthRange = () => {
  const today = new Date();
  return {
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
  };
};

const OpeningBalanceList: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFileStructure, setShowFileStructure] = useState<boolean>(false);

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedCurrencyTypes, setSelectedCurrencyTypes] = useState<string[]>(
    []
  );
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>(() => getCurrentMonthRange());
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    accounts: false,
    currencyTypes: false,
    createdBy: false,
    updatedBy: false,
  });

  const defaultColumnOrder = [
    "actions",
    "strOpeningBalanceNo",
    "dtOpeningBalanceDate",
    "strAccountName",
    "dblDebit",
    "dblCredit",
    "strCurrencyTypeName",
    "dblExchangeRate",
    "dblDebit_BaseCurrency",
    "dblCredit_BaseCurrency",
    "strCreatedByName",
    "dtCreatedOn",
    "strUpdatedByName",
    "dtUpdatedOn",
  ];

  const activeFilterCount =
    (selectedAccounts.length > 0 ? 1 : 0) +
    (selectedCurrencyTypes.length > 0 ? 1 : 0) +
    (selectedCreatedBy.length > 0 ? 1 : 0) +
    (selectedUpdatedBy.length > 0 ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const { menuItems } = useUserRights();
  const HeaderIcon = useMenuIcon(ListModules.OPENING_BALANCE, TrendingUp);

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "opening_balance",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strOpeningBalanceNo",
        direction: "desc",
      },
    }
  );

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
  } = useTableLayout("opening_balance", defaultColumnOrder, []);

  const { data: openingBalancesResponse, isLoading } = useOpeningBalances({
    search: debouncedSearch,
    fromDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    toDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    strAccountGUIDs:
      selectedAccounts.length > 0 ? selectedAccounts.join(",") : undefined,
    strCurrencyTypeGUIDs:
      selectedCurrencyTypes.length > 0
        ? selectedCurrencyTypes.join(",")
        : undefined,
    strCreatedByGUIDs:
      selectedCreatedBy.length > 0 ? selectedCreatedBy.join(",") : undefined,
    strUpdatedByGUIDs:
      selectedUpdatedBy.length > 0 ? selectedUpdatedBy.join(",") : undefined,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy: sorting.columnKey || undefined,
    ascending,
  });

  const { data: users, isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    dropdownOpen.createdBy || dropdownOpen.updatedBy
  );

  const { data: accountsTreeData, isLoading: isAccountsLoading } =
    useAccountsByTypesTree(
      {
        strAccountTypeGUIDs: "",
        maxLevel: null,
      },
      { enabled: dropdownOpen.accounts }
    );

  // Flatten accounts from tree structure
  const accounts = useMemo(() => {
    if (!accountsTreeData?.scheduleTree) return [];

    const flattenAccounts = (
      nodes: typeof accountsTreeData.scheduleTree
    ): (typeof nodes)[0]["accounts"][0][] => {
      return nodes.reduce(
        (acc, node) => {
          const nodeAccounts = node.accounts || [];
          const childAccounts = node.children
            ? flattenAccounts(node.children)
            : [];
          return [...acc, ...nodeAccounts, ...childAccounts];
        },
        [] as (typeof nodes)[0]["accounts"][0][]
      );
    };

    return flattenAccounts(accountsTreeData.scheduleTree);
  }, [accountsTreeData]);

  const { data: currencyTypes, isLoading: isCurrencyTypesLoading } =
    useActiveCurrencyTypes(undefined, dropdownOpen.currencyTypes);

  useEffect(() => {
    if (openingBalancesResponse) {
      setPagination({
        pageNumber: openingBalancesResponse.pageNumber,
        pageSize: openingBalancesResponse.pageSize,
        totalCount: openingBalancesResponse.totalRecords,
        totalPages: openingBalancesResponse.totalPages,
      });
    }
  }, [openingBalancesResponse, setPagination]);

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

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo<DataTableColumn<OpeningBalanceListItem>[]>(() => {
    const baseColumns: DataTableColumn<OpeningBalanceListItem>[] = [];

    if (canAccess(menuItems, FormModules.OPENING_BALANCE, Actions.EDIT)) {
      baseColumns.push({
        key: "actions",
        header: "Actions",
        cell: (item) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(
                  `/opening-balance/${item.strOpeningBalanceGUID}`
                );
              }}
              title="Edit opening balance"
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
        key: "strOpeningBalanceNo",
        header: "Opening Balance No",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strOpeningBalanceNo}
          >
            {item.strOpeningBalanceNo}
          </div>
        ),
        width: "200px",
        sortable: true,
      },
      {
        key: "dtOpeningBalanceDate",
        header: "Date",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {format(new Date(item.dtOpeningBalanceDate), "dd-MM-yyyy")}
          </div>
        ),
        width: "120px",
        sortable: true,
      },
      {
        key: "strAccountName",
        header: "Account",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strAccountName || "-"}
          >
            {item.strAccountName || "-"}
          </div>
        ),
        width: "200px",
        sortable: true,
      },
      {
        key: "dblDebit",
        header: "Debit",
        cell: (item) =>
          item.dblDebit !== null && item.dblDebit !== undefined ? (
            <div className="text-right truncate" title={new Intl.NumberFormat("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(item.dblDebit)}>
              {new Intl.NumberFormat("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(item.dblDebit)}
            </div>
          ) : (
            <div className="text-right">-</div>
          ),
        width: "100px",
        sortable: true,
      },
      {
        key: "dblCredit",
        header: "Credit",
        cell: (item) =>
          item.dblCredit !== null && item.dblCredit !== undefined ? (
            <div className="text-right truncate" title={new Intl.NumberFormat("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(item.dblCredit)}>
              {new Intl.NumberFormat("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(item.dblCredit)}
            </div>
          ) : (
            <div className="text-right">-</div>
          ),
        width: "100px",
        sortable: true,
      },
      {
        key: "strCurrencyTypeName",
        header: "Currency",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCurrencyTypeName || "-"}
          >
            {item.strCurrencyTypeName || "-"}
          </div>
        ),
        width: "180px",
      },
      {
        key: "dblExchangeRate",
        header: "Exchange Rate",
        cell: (item) => (
          <div className="text-right">
            {item.dblExchangeRate?.toFixed(6) ?? "-"}
          </div>
        ),
        width: "140px",
      },
      {
        key: "dblDebit_BaseCurrency",
        header: "Base Debit",
        cell: (item) =>
          item.dblDebit_BaseCurrency !== null &&
          item.dblDebit_BaseCurrency !== undefined ? (
            <div className="truncate" title={new Intl.NumberFormat("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(item.dblDebit_BaseCurrency)}>
              {new Intl.NumberFormat("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(item.dblDebit_BaseCurrency)}
            </div>
          ) : (
            <div>-</div>
          ),
        width: "150px",
      },
      {
        key: "dblCredit_BaseCurrency",
        header: "Base Credit",
        cell: (item) =>
          item.dblCredit_BaseCurrency !== null &&
          item.dblCredit_BaseCurrency !== undefined ? (
            <div className="truncate" title={new Intl.NumberFormat("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(item.dblCredit_BaseCurrency)}>
              {new Intl.NumberFormat("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(item.dblCredit_BaseCurrency)}
            </div>
          ) : (
            <div>-</div>
          ),
        width: "150px",
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strCreatedByName || "-"}
          >
            {item.strCreatedByName || "-"}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        cell: (item) => (
          <div className="whitespace-nowrap">
            {format(new Date(item.dtCreatedOn), "dd-MM-yyyy HH:mm")}
          </div>
        ),
        width: "180px",
        sortable: true,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        cell: (item) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={item.strUpdatedByName || "-"}
          >
            {item.strUpdatedByName || "-"}
          </div>
        ),
        width: "150px",
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        cell: (item) =>
          item.dtUpdatedOn ? (
            <div className="whitespace-nowrap">
              {format(new Date(item.dtUpdatedOn), "dd-MM-yyyy HH:mm")}
            </div>
          ) : (
            <div>-</div>
          ),
        width: "180px",
        sortable: true,
      }
    );

    return baseColumns;
  }, [isTextWrapped, menuItems, openEditInNewTab]);

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

  const validateImportMutation = useValidateOpeningBalanceImport();
  const importMutation = useImportOpeningBalances();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "xlsx" && extension !== "xls") {
      alert("Please select an Excel file (.xlsx or .xls)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleValidateImport = async () => {
    if (!selectedFile) return;

    try {
      await validateImportMutation.mutateAsync({
        file: selectedFile,
      });

      // After successful validation, directly execute the import
      await importMutation.mutateAsync({
        file: selectedFile,
      });

      // Close dialog immediately after successful import
      setShowImportDialog(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  const handleCloseImportDialog = () => {
    setShowImportDialog(false);
    setSelectedFile(null);
  };

  const resetFilters = () => {
    setDebouncedSearch("");
    setDateRange(getCurrentMonthRange());
    setSelectedAccounts([]);
    setSelectedCurrencyTypes([]);
    setSelectedCreatedBy([]);
    setSelectedUpdatedBy([]);
  };

  return (
    <CustomContainer>
      <PageHeader
        title="Opening Balance"
        description="Manage opening balances for all accounts"
        icon={HeaderIcon}
        actions={
          <WithPermission
            module={FormModules.OPENING_BALANCE}
            action={Actions.SAVE}
          >
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                className="h-9 text-xs sm:text-sm"
                size="sm"
              >
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                Import
              </Button>
              <Button
                onClick={() => navigate("/opening-balance/new")}
                className="h-9 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                New Opening Balance
              </Button>
            </div>
          </WithPermission>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search opening balances..."
            onSearchChange={setDebouncedSearch}
            className="w-full sm:max-w-md sm:flex-1"
          />

          <div className="w-full sm:w-auto">
            <DateRangePicker
              startDate={dateRange.from}
              endDate={dateRange.to}
              onRangeChange={(from, to) => setDateRange({ from, to })}
              restricted={true}
            />
          </div>

          <div className="grid grid-cols-2 lg:flex gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 justify-center h-9 text-xs sm:text-sm"
              size="sm"
            >
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {activeFilterCount}
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
                    "opening_balance_column_order",
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
                Filter opening balances by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Account
                  </label>
                  <MultiSelect
                    options={
                      (accounts || []).map((account) => ({
                        label: account.strAccountName,
                        value: account.strAccountGUID,
                      })) || []
                    }
                    selectedValues={selectedAccounts}
                    onChange={setSelectedAccounts}
                    placeholder="Filter by account"
                    initialMessage=""
                    isLoading={dropdownOpen.accounts && isAccountsLoading}
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        accounts: isOpen,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Currency Type
                  </label>
                  <MultiSelect
                    options={
                      (currencyTypes || []).map((currency) => ({
                        label: currency.strName,
                        value: currency.strCurrencyTypeGUID,
                      })) || []
                    }
                    selectedValues={selectedCurrencyTypes}
                    onChange={setSelectedCurrencyTypes}
                    placeholder="Filter by currency type"
                    initialMessage=""
                    isLoading={
                      dropdownOpen.currencyTypes && isCurrencyTypesLoading
                    }
                    onOpenChange={(isOpen) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        currencyTypes: isOpen,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Created By
                  </label>
                  <MultiSelect
                    options={
                      (users || []).map((user) => ({
                        label: user.strName,
                        value: user.strUserGUID,
                      })) || []
                    }
                    selectedValues={selectedCreatedBy}
                    onChange={setSelectedCreatedBy}
                    placeholder="Filter by created by"
                    initialMessage=""
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
                      (users || []).map((user) => ({
                        label: user.strName,
                        value: user.strUserGUID,
                      })) || []
                    }
                    selectedValues={selectedUpdatedBy}
                    onChange={setSelectedUpdatedBy}
                    placeholder="Filter by updated by"
                    initialMessage=""
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
                  onClick={resetFilters}
                  disabled={
                    selectedAccounts.length === 0 &&
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
            "Opening Balance No",
            "Date",
            "Account",
            "Debit",
            "Credit",
            "Currency",
            "Exchange Rate",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          columns={orderedColumns}
          columnVisibility={columnVisibility}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          maxHeight="calc(100vh - 350px)"
          data={openingBalancesResponse?.data || []}
          sortBy={sorting.columnKey || undefined}
          ascending={sorting.direction === "asc"}
          onSort={handleSortChange}
          keyExtractor={(item) => item.strOpeningBalanceGUID}
          pagination={{
            totalPages: pagination.totalPages || 0,
            pageNumber: pagination.pageNumber || 1,
            pageSize: pagination.pageSize || 10,
            totalCount: pagination.totalCount || 0,
            onPageChange: goToPage,
            onPageSizeChange: changePageSize,
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "opening_balance_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            debouncedSearch ? (
              <>No opening balances found matching "{debouncedSearch}".</>
            ) : (
              <>No opening balances found. Click "Create New" to create one.</>
            )
          }
        />
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Import Opening Balances</CardTitle>
              <CardDescription>
                Upload an Excel file to import multiple opening balance records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Excel File Structure - Collapsible */}
              <div className="border border-border-color rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowFileStructure(!showFileStructure)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      Excel File Structure
                    </span>
                  </div>
                  <svg
                    className={`h-4 w-4 transition-transform ${
                      showFileStructure ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showFileStructure && (
                  <div className="p-4 pt-0 border-t border-border-color">
                    <p className="text-xs text-muted-foreground mb-3">
                      Your Excel file should have the following structure:
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-2 px-2 font-semibold border border-border-color">
                              Column
                            </th>
                            <th className="text-left py-2 px-2 font-semibold border border-border-color">
                              Header
                            </th>
                            <th className="text-left py-2 px-2 font-semibold border border-border-color">
                              Description
                            </th>
                            <th className="text-left py-2 px-2 font-semibold border border-border-color">
                              Example
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-xs">
                          <tr>
                            <td className="py-2 px-2 border border-border-color">
                              A
                            </td>
                            <td className="py-2 px-2 font-medium border border-border-color">
                              Account Name
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              Name of the account
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              Cash in Hand
                            </td>
                          </tr>
                          <tr className="bg-muted/20">
                            <td className="py-2 px-2 border border-border-color">
                              B
                            </td>
                            <td className="py-2 px-2 font-medium border border-border-color">
                              Account Type
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              Type of account
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              General
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 border border-border-color">
                              C
                            </td>
                            <td className="py-2 px-2 font-medium border border-border-color">
                              Account Code
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              Account code/number (6 Digit)
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              100001
                            </td>
                          </tr>
                          <tr className="bg-muted/20">
                            <td className="py-2 px-2 border border-border-color">
                              D
                            </td>
                            <td className="py-2 px-2 font-medium border border-border-color">
                              Date
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              Opening balance date (YYYY-MM-DD)
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              2024-01-01
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 border border-border-color">
                              E
                            </td>
                            <td className="py-2 px-2 font-medium border border-border-color">
                              Debit
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              Debit amount (Either Debit OR Credit required)
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              50000
                            </td>
                          </tr>
                          <tr className="bg-muted/20">
                            <td className="py-2 px-2 border border-border-color">
                              F
                            </td>
                            <td className="py-2 px-2 font-medium border border-border-color">
                              Credit
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              Credit amount (Either Debit OR Credit required)
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              0
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2 border border-border-color">
                              G
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              Currency Code
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              Currency code (optional)
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              INR
                            </td>
                          </tr>
                          <tr className="bg-muted/20">
                            <td className="py-2 px-2 border border-border-color">
                              H
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              Exchange Rate
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              Exchange rate (optional)
                            </td>
                            <td className="py-2 px-2 border border-border-color">
                              1.00
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-amber-900 dark:text-amber-200">
                        <strong>⚠ Required fields:</strong> Account Name,
                        Account Type, Account Code, Date, and either Debit OR
                        Credit. First row should contain headers exactly as
                        shown above.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <label
                  htmlFor="opening-balance-import"
                  className="text-sm font-medium"
                >
                  Select Excel File
                </label>
                <input
                  id="opening-balance-import"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    validateImportMutation.isPending || importMutation.isPending
                  }
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 border-t border-border-color">
              <Button
                variant="outline"
                onClick={handleCloseImportDialog}
                disabled={
                  validateImportMutation.isPending || importMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                disabled={
                  !selectedFile ||
                  validateImportMutation.isPending ||
                  importMutation.isPending
                }
                onClick={handleValidateImport}
              >
                {validateImportMutation.isPending || importMutation.isPending
                  ? "Importing..."
                  : "Import"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </CustomContainer>
  );
};

export default OpeningBalanceList;
