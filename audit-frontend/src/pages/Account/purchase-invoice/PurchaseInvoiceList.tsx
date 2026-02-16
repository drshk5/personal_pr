import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, FileText, Filter, Plus } from "lucide-react";
import { format } from "date-fns";

import type { PurchaseInvoiceListItem } from "@/types/Account/purchase-invoice";

import { Actions, FormModules, ListModules } from "@/lib/permissions";
import { useCanEdit } from "@/lib/permissions";
import { getStatusBadgeVariant } from "@/lib/utils";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { usePurchaseInvoices } from "@/hooks/api/Account/use-purchase-invoices";
import { useActiveVendorsByType } from "@/hooks/api/Account/use-vendors";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { useModuleUsers } from "@/hooks/api/central/use-users";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/select/multi-select";

const PurchaseInvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedCreatedByUsers, setSelectedCreatedByUsers] = useState<
    string[]
  >([]);
  const [selectedUpdatedByUsers, setSelectedUpdatedByUsers] = useState<
    string[]
  >([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: firstDayOfMonth,
    to: lastDayOfMonth,
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [dropdownOpen, setDropdownOpen] = useState({
    parties: false,
    currencies: false,
    createdBy: false,
    updatedBy: false,
  });

  const defaultColumnOrder = [
    "actions",
    "strPurchaseInvoiceNo",
    "strStatus",
    "dPurchaseInvoiceDate",
    "strPartyName",
    "strOrderNo",
    "strCurrencyTypeName",
    "strYearName",
    "strSubject",
    "dblGrossTotalAmt",
    "dblTotalDiscountAmt",
    "dblTaxAmt",
    "strAdjustmentName",
    "dblAdjustmentAmt",
    "dblNetAmt",
    "strTC",
    "strCustomerNotes",
    "dblExchangeRate",
    "dtExchangeRateDate",
    "strCreatedByName",
    "dtCreatedOn",
    "strUpdatedByName",
    "dtUpdatedOn",
    "strApprovedByName",
    "dtApprovedOn",
    "strRejectedByName",
    "dtRejectedOn",
    "strRejectedReason",
  ];

  const canEditPurchaseInvoice = useCanEdit(FormModules.PURCHASE_INVOICE);
  const HeaderIcon = useMenuIcon(ListModules.PURCHASE_INVOICE, FileText);

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "purchase-invoices",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strPurchaseInvoiceNo",
        direction: "desc",
      },
    }
  );

  const sortBy = sorting.columnKey || "strPurchaseInvoiceNo";
  const ascending = sorting.direction === "asc";

  // Column visibility setup with pinned columns
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
  } = useTableLayout("purchase_invoice", defaultColumnOrder, []);

  const { data: partiesData, isLoading: isPartiesLoading } =
    useActiveVendorsByType({ strPartyType: "Vendor" }, dropdownOpen.parties);
  const { data: currencyTypesData, isLoading: isCurrencyTypesLoading } =
    useActiveCurrencyTypes(undefined, dropdownOpen.currencies);
  const { data: usersData, isLoading: isUsersLoading } = useModuleUsers(
    undefined,
    undefined,
    dropdownOpen.createdBy || dropdownOpen.updatedBy
  );

  const filterParams = useMemo(
    () => ({
      search: debouncedSearch,
      strStatus: selectedStatus || undefined,
      strPartyGUIDs:
        selectedParties.length > 0 ? selectedParties.join(",") : undefined,
      strCurrencyTypeGUIDs:
        selectedCurrencies.length > 0
          ? selectedCurrencies.join(",")
          : undefined,
      strCreatedByGUIDs:
        selectedCreatedByUsers.length > 0
          ? selectedCreatedByUsers.join(",")
          : undefined,
      strUpdatedByGUIDs:
        selectedUpdatedByUsers.length > 0
          ? selectedUpdatedByUsers.join(",")
          : undefined,
      fromDate:
        dateRange.from && dateRange.to
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,
      toDate:
        dateRange.from && dateRange.to
          ? format(dateRange.to, "yyyy-MM-dd")
          : undefined,
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      sortBy,
      ascending,
    }),
    [
      debouncedSearch,
      selectedStatus,
      selectedParties,
      selectedCurrencies,
      selectedCreatedByUsers,
      selectedUpdatedByUsers,
      dateRange,
      pagination.pageNumber,
      pagination.pageSize,
      sortBy,
      ascending,
    ]
  );

  // Fetch purchase invoices with filters
  const { data: purchaseInvoicesData, isLoading } =
    usePurchaseInvoices(filterParams);

  // Update pagination when data changes
  useEffect(() => {
    if (purchaseInvoicesData) {
      setPagination({
        pageNumber: purchaseInvoicesData.pageNumber,
        pageSize: purchaseInvoicesData.pageSize,
        totalCount: purchaseInvoicesData.totalRecords,
        totalPages: purchaseInvoicesData.totalPages,
      });
    }
  }, [purchaseInvoicesData, setPagination]);

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

  const columns = useMemo<DataTableColumn<PurchaseInvoiceListItem>[]>(
    () => [
      ...(canEditPurchaseInvoice
        ? [
            {
              key: "actions",
              header: "Actions",
              width: "70px",
              cell: (purchaseInvoice: PurchaseInvoiceListItem) => (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditInNewTab(
                        `/purchase-invoice/${purchaseInvoice.strPurchaseInvoiceGUID}`
                      );
                    }}
                    className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
                    title="Edit Purchase Invoice"
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
        key: "strPurchaseInvoiceNo",
        header: "Purchase Invoice No.",
        width: "200px",
        cell: (purchaseInvoice) => (
          <div
            className={
              isTextWrapped
                ? "wrap-break-word font-medium"
                : "truncate font-medium"
            }
            title={purchaseInvoice.strPurchaseInvoiceNo}
          >
            {purchaseInvoice.strPurchaseInvoiceNo}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strStatus",
        header: "Status",
        width: "180px",
        cell: (purchaseInvoice) => (
          <Badge variant={getStatusBadgeVariant(purchaseInvoice.strStatus)}>
            {purchaseInvoice.strStatus}
          </Badge>
        ),
        sortable: true,
      },

      {
        key: "dPurchaseInvoiceDate",
        header: "Purchase Invoice Date",
        width: "210px",
        cell: (purchaseInvoice) => {
          const date = purchaseInvoice.dPurchaseInvoiceDate;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">
              {format(new Date(date), "MMM d, yyyy")}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "intPurchaseInvoiceSeqNo",
        header: "Seq. No.",
        width: "120px",
        cell: (purchaseInvoice) => (
          <div className="text-center">
            {purchaseInvoice.intPurchaseInvoiceSeqNo || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strOrderNo",
        header: "Vendor Reference No.",
        width: "210px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strOrderNo || "-"}
          >
            {purchaseInvoice.strOrderNo || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPartyName",
        header: "Vendor Name",
        width: "200px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strPartyName || "-"}
          >
            {purchaseInvoice.strPartyName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCurrencyTypeName",
        header: "Currency",
        width: "180px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strCurrencyTypeName || "-"}
          >
            {purchaseInvoice.strCurrencyTypeName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strSubject",
        header: "Subject",
        width: "250px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strSubject || "-"}
          >
            {purchaseInvoice.strSubject || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dblGrossTotalAmt",
        header: "Gross Total",
        cell: (purchaseInvoice) => {
          const amount = purchaseInvoice.dblGrossTotalAmt;
          return (
            <div className="text-right whitespace-nowrap">
              {amount ? amount.toFixed(2) : "0.00"}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "dblTotalDiscountAmt",
        header: "Total Discount",
        cell: (purchaseInvoice) => {
          const amount = purchaseInvoice.dblTotalDiscountAmt;
          return (
            <div className="text-right whitespace-nowrap">
              {amount ? amount.toFixed(2) : "0.00"}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "dblTaxAmt",
        header: "Tax Amount",
        cell: (purchaseInvoice) => {
          const amount = purchaseInvoice.dblTaxAmt;
          return (
            <div className="text-right whitespace-nowrap">
              {amount ? amount.toFixed(2) : "0.00"}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "strAdjustmentName",
        header: "Adjustment Name",
        width: "180px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strAdjustmentName || "-"}
          >
            {purchaseInvoice.strAdjustmentName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dblAdjustmentAmt",
        header: "Adjustment Amount",
        width: "200px",
        cell: (purchaseInvoice) => {
          const amount = purchaseInvoice.dblAdjustmentAmt;
          return (
            <div className="text-right whitespace-nowrap">
              {amount ? amount.toFixed(2) : "0.00"}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "dblNetAmt",
        header: "Net Amount",
        width: "150px",
        cell: (purchaseInvoice) => {
          const amount = purchaseInvoice.dblNetAmt;
          return (
            <div className="text-right whitespace-nowrap">
              {amount ? amount.toFixed(2) : "0.00"}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "strTC",
        header: "Terms & Conditions",
        width: "250px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strTC || "-"}
          >
            {purchaseInvoice.strTC || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCustomerNotes",
        header: "Customer Notes",
        width: "250px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strCustomerNotes || "-"}
          >
            {purchaseInvoice.strCustomerNotes || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dblExchangeRate",
        header: "Exchange Rate",
        cell: (purchaseInvoice) => {
          const rate = purchaseInvoice.dblExchangeRate;
          return (
            <div className="text-right whitespace-nowrap">
              {rate ? rate.toFixed(4) : "-"}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "dtExchangeRateDate",
        header: "Exchange Rate Date",
        width: "200px",
        cell: (purchaseInvoice) => {
          const date = purchaseInvoice.dtExchangeRateDate;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">
              {format(new Date(date), "MMM d, yyyy")}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        width: "150px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strCreatedByName || "-"}
          >
            {purchaseInvoice.strCreatedByName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "180px",
        cell: (purchaseInvoice) => {
          const date = purchaseInvoice.dtCreatedOn;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">
              {format(new Date(date), "MMM d, yyyy HH:mm")}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "150px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strUpdatedByName || "-"}
          >
            {purchaseInvoice.strUpdatedByName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "180px",
        cell: (purchaseInvoice) => {
          const date = purchaseInvoice.dtUpdatedOn;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">
              {format(new Date(date), "MMM d, yyyy HH:mm")}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "strApprovedByName",
        header: "Approved By",
        width: "150px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strApprovedByName || "-"}
          >
            {purchaseInvoice.strApprovedByName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtApprovedOn",
        header: "Approved On",
        width: "180px",
        cell: (purchaseInvoice) => {
          const date = purchaseInvoice.dtApprovedOn;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">
              {format(new Date(date), "MMM d, yyyy HH:mm")}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "strRejectedByName",
        header: "Rejected By",
        width: "150px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strRejectedByName || "-"}
          >
            {purchaseInvoice.strRejectedByName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtRejectedOn",
        header: "Rejected On",
        width: "180px",
        cell: (purchaseInvoice) => {
          const date = purchaseInvoice.dtRejectedOn;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">
              {format(new Date(date), "MMM d, yyyy HH:mm")}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "strRejectedReason",
        header: "Rejected Reason",
        width: "250px",
        cell: (purchaseInvoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={purchaseInvoice.strRejectedReason || "-"}
          >
            {purchaseInvoice.strRejectedReason || "-"}
          </div>
        ),
        sortable: true,
      },
    ],
    [canEditPurchaseInvoice, isTextWrapped, openEditInNewTab]
  );

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

  // Clear filters
  const clearFilters = () => {
    setDebouncedSearch("");
    setSelectedStatus(null);
    setSelectedParties([]);
    setSelectedCurrencies([]);
    setSelectedCreatedByUsers([]);
    setSelectedUpdatedByUsers([]);
  };

  return (
    <CustomContainer>
      <PageHeader
        title="Purchase Invoices"
        description="View and manage all purchase invoices"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <WithPermission
              module={FormModules.PURCHASE_INVOICE}
              action={Actions.SAVE}
              fallback={<></>}
            >
              <Button onClick={() => navigate("/purchase-invoice/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Purchase Invoice
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search purchase invoices..."
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
              {(selectedStatus !== null ||
                selectedParties.length > 0 ||
                selectedCurrencies.length > 0 ||
                selectedCreatedByUsers.length > 0 ||
                selectedUpdatedByUsers.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {(selectedStatus !== null ? 1 : 0) +
                    (selectedParties.length > 0 ? 1 : 0) +
                    (selectedCurrencies.length > 0 ? 1 : 0) +
                    (selectedCreatedByUsers.length > 0 ? 1 : 0) +
                    (selectedUpdatedByUsers.length > 0 ? 1 : 0)}
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
                    "purchase_invoice_column_order",
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
                Filter purchase invoices by additional criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={selectedStatus || "all"}
                    onValueChange={(value) =>
                      setSelectedStatus(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Pending For Approval">
                        Pending For Approval
                      </SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vendor
                  </label>
                  <MultiSelect
                    options={
                      partiesData?.map((party) => ({
                        value: party.strPartyGUID,
                        label: party.strPartyName_Display || party.strPartyGUID,
                      })) || []
                    }
                    selectedValues={selectedParties}
                    onChange={setSelectedParties}
                    placeholder="Select vendors"
                    onOpenChange={(isOpen: boolean) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        parties: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.parties && isPartiesLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Currency
                  </label>
                  <MultiSelect
                    options={
                      currencyTypesData?.map((currency) => ({
                        value: currency.strCurrencyTypeGUID,
                        label: currency.strName,
                      })) || []
                    }
                    selectedValues={selectedCurrencies}
                    onChange={setSelectedCurrencies}
                    onOpenChange={(isOpen: boolean) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        currencies: isOpen,
                      }))
                    }
                    placeholder="Select currencies"
                    isLoading={
                      dropdownOpen.currencies && isCurrencyTypesLoading
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Created By
                  </label>
                  <MultiSelect
                    options={
                      usersData?.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName || user.strUserGUID,
                      })) || []
                    }
                    selectedValues={selectedCreatedByUsers}
                    onChange={setSelectedCreatedByUsers}
                    placeholder="Select created by users"
                    onOpenChange={(isOpen: boolean) =>
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
                      usersData?.map((user) => ({
                        value: user.strUserGUID,
                        label: user.strName || user.strUserGUID,
                      })) || []
                    }
                    selectedValues={selectedUpdatedByUsers}
                    onChange={setSelectedUpdatedByUsers}
                    placeholder="Select updated by users"
                    onOpenChange={(isOpen: boolean) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        updatedBy: isOpen,
                      }))
                    }
                    isLoading={dropdownOpen.updatedBy && isUsersLoading}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={
                    selectedStatus === null &&
                    selectedParties.length === 0 &&
                    selectedCurrencies.length === 0 &&
                    selectedCreatedByUsers.length === 0 &&
                    selectedUpdatedByUsers.length === 0
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
            "Purchase Invoice No.",
            "Date",
            "Status",
            "Party",
            "Amount",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable<PurchaseInvoiceListItem>
          data={isLoading ? [] : purchaseInvoicesData?.data || []}
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
          keyExtractor={(item) => item.strPurchaseInvoiceGUID}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "purchase_invoice_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            debouncedSearch ? (
              <>No purchase invoices found matching "{debouncedSearch}".</>
            ) : (
              <>
                No purchase invoices found. Click "New Purchase Invoice" to
                create one.
              </>
            )
          }
          maxHeight="calc(100vh - 350px)"
        />
      )}
    </CustomContainer>
  );
};

export default PurchaseInvoiceList;
