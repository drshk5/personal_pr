import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, FileText, Filter, Plus } from "lucide-react";

import type { InvoiceListItem } from "@/types/Account/salesinvoice";

import {
  Actions,
  FormModules,
  ListModules,
  useCanEdit,
} from "@/lib/permissions";
import {
  getStatusBadgeVariant,
  formatInvoiceAddress,
  formatDate,
} from "@/lib/utils";

import { format } from "date-fns";

import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { useInvoices } from "@/hooks/api/Account/use-sales-invoices";
import { useActivePartiesByType } from "@/hooks/api/Account/use-parties";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { useModuleUsers } from "@/hooks/api/central/use-users";
import { useAuthContext } from "@/hooks/common/use-auth-context";

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
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/select/multi-select";

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
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

  const { user } = useAuthContext();
  const userTax = (
    user as
      | {
          tax?: {
            strTaxTypeCode?: string | null;
            strTaxTypeName?: string | null;
            strStateGUID?: string | null;
          };
        }
      | undefined
  )?.tax;
  const hasTaxConfig = !!userTax;

  const defaultColumnOrder = [
    "actions",
    "strInvoiceNo",
    "strStatus",
    "dInvoiceDate",
    "strPartyName",
    "strOrderNo",
    "strCurrencyTypeName",
    "intPaymentTermsDays",
    "bolIsPaid",
    "strBillingAddress",
    "strShippingAddress",
    "dtDueDate",
    "strSubject",
    "dblGrossTotalAmt",
    "dblTotalDiscountAmt",
    ...(hasTaxConfig ? ["dblTaxAmt"] : []),
    "strAdjustmentName",
    "dblAdjustmentAmt",
    "dblNetAmt",
    "dblGrossTotalAmtBase",
    "dblTotalDiscountAmtBase",
    ...(hasTaxConfig ? ["dblTaxAmtBase"] : []),
    "dblAdjustmentAmtBase",
    "dblNetAmtBase",
    "strTC",
    "strCustomerNotes",
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

  const canEditInvoice = useCanEdit(FormModules.INVOICE);
  const HeaderIcon = useMenuIcon(ListModules.INVOICE, FileText);

  // Set up list preferences with pagination and sorting
  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "invoices",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strInvoiceNo",
        direction: "desc",
      },
    }
  );

  const sortBy = sorting.columnKey || "strInvoiceNo";
  const ascending = sorting.direction === "asc";

  // Table layout (visibility, order, widths)
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
  } = useTableLayout("invoice", defaultColumnOrder, []);

  const { data: partiesData } = useActivePartiesByType(
    { strPartyType: "Customer" },
    dropdownOpen.parties
  );
  const { data: currencyTypesData } = useActiveCurrencyTypes(
    undefined,
    dropdownOpen.currencies
  );
  const { data: usersData } = useModuleUsers(
    undefined,
    undefined,
    dropdownOpen.createdBy || dropdownOpen.updatedBy
  );

  const filterParams = useMemo(
    () => ({
      search: debouncedSearch,
      strStatus: selectedStatus || undefined,
      bolIsPaid: isPaid === null ? undefined : isPaid,
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
      isPaid,
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

  // Fetch invoices with filters
  const { data: invoicesData, isLoading } = useInvoices(filterParams);

  // Update pagination when data changes
  useEffect(() => {
    if (invoicesData) {
      setPagination({
        pageNumber: invoicesData.pageNumber,
        pageSize: invoicesData.pageSize,
        totalCount: invoicesData.totalRecords,
        totalPages: invoicesData.totalPages,
      });
    }
  }, [invoicesData, setPagination]);

  // Navigation functions
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

  // Define columns for the data table
  const columns = useMemo<DataTableColumn<InvoiceListItem>[]>(
    () => [
      ...(canEditInvoice
        ? [
            {
              key: "actions",
              header: "Actions",
              width: "80px",
              cell: (invoice: InvoiceListItem) => (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditInNewTab(`/invoice/${invoice.strInvoiceGUID}`);
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
        key: "strInvoiceNo",
        header: "Sales Invoice No.",
        width: "180px",
        cell: (invoice) => (
          <div
            className={
              isTextWrapped
                ? "wrap-break-word font-medium"
                : "truncate font-medium"
            }
            title={invoice.strInvoiceNo}
          >
            {invoice.strInvoiceNo}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strStatus",
        header: "Status",
        width: "180px",
        cell: (invoice) => (
          <Badge variant={getStatusBadgeVariant(invoice.strStatus)}>
            {invoice.strStatus}
          </Badge>
        ),
        sortable: true,
      },
      {
        key: "dInvoiceDate",
        header: "Sales Invoice Date",
        width: "180px",
        cell: (invoice) => {
          const date = invoice.dInvoiceDate;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">{formatDate(date, false)}</div>
          );
        },
        sortable: true,
      },
      {
        key: "strOrderNo",
        header: "PO Reference No",
        width: "180px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strOrderNo || "-"}
          >
            {invoice.strOrderNo || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strPartyName",
        header: "Customer Name",
        width: "200px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strPartyName || "-"}
          >
            {invoice.strPartyName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCurrencyTypeName",
        header: "Currency",
        width: "160px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strCurrencyTypeName || "-"}
          >
            {invoice.strCurrencyTypeName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "intPaymentTermsDays",
        header: "Payment Terms (Days)",
        cell: (invoice) => invoice.intPaymentTermsDays?.toString() || "-",
        sortable: true,
      },
      {
        key: "strBillingAddress",
        header: "Billing Address",
        width: "250px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={formatInvoiceAddress(invoice.strBillingAddress) || "-"}
          >
            {formatInvoiceAddress(invoice.strBillingAddress) || "-"}
          </div>
        ),
        sortable: true,
      },

      {
        key: "strShippingAddress",
        header: "Shipping Address",
        width: "250px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={formatInvoiceAddress(invoice.strShippingAddress) || "-"}
          >
            {formatInvoiceAddress(invoice.strShippingAddress) || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtDueDate",
        header: "Due Date",
        width: "180px",
        cell: (invoice) => {
          const date = invoice.dtDueDate;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">{formatDate(date, false)}</div>
          );
        },
        sortable: true,
      },

      {
        key: "strSubject",
        header: "Subject",
        width: "250px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strSubject || "-"}
          >
            {invoice.strSubject || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsPaid",
        header: "Paid",
        cell: (invoice) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              invoice.bolIsPaid
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {invoice.bolIsPaid ? "Yes" : "No"}
          </span>
        ),
        sortable: true,
      },
      {
        key: "dblGrossTotalAmt",
        header: "Gross Total",
        cell: (invoice) => {
          const amount = invoice.dblGrossTotalAmt;
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
        cell: (invoice) => {
          const amount = invoice.dblTotalDiscountAmt;
          return (
            <div className="text-right whitespace-nowrap">
              {amount ? amount.toFixed(2) : "0.00"}
            </div>
          );
        },
        sortable: true,
      },
      ...(hasTaxConfig
        ? ([
            {
              key: "dblTaxAmt",
              header: "Tax Amount",
              cell: (invoice) => {
                const amount = invoice.dblTaxAmt;
                return (
                  <div className="text-right whitespace-nowrap">
                    {amount ? amount.toFixed(2) : "0.00"}
                  </div>
                );
              },
              sortable: true,
            },
          ] as DataTableColumn<InvoiceListItem>[])
        : []),
      {
        key: "strAdjustmentName",
        header: "Adjustment Name",
        width: "180px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strAdjustmentName || "-"}
          >
            {invoice.strAdjustmentName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dblAdjustmentAmt",
        header: "Adjustment Amount",
        width: "200px",
        cell: (invoice) => {
          const amount = invoice.dblAdjustmentAmt;
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
        cell: (invoice) => {
          const amount = invoice.dblNetAmt;
          return (
            <div className="text-right whitespace-nowrap">
              {amount ? amount.toFixed(2) : "0.00"}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "dblGrossTotalAmtBase",
        header: "Gross Total (Base)",
        width: "180px",
        cell: (invoice) => {
          const amount = invoice.dblGrossTotalAmtBase;
          return (
            <div className="text-right whitespace-nowrap">
              {amount ? amount.toFixed(2) : "0.00"}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "dblTotalDiscountAmtBase",
        header: "Total Discount (Base)",
        width: "200px",
        cell: (invoice) => {
          const amount = invoice.dblTotalDiscountAmtBase;
          return (
            <div className="text-right whitespace-nowrap">
              {amount ? amount.toFixed(2) : "0.00"}
            </div>
          );
        },
        sortable: true,
      },
      ...(hasTaxConfig
        ? ([
            {
              key: "dblTaxAmtBase",
              header: "Tax Amount (Base)",
              width: "180px",
              cell: (invoice) => {
                const amount = invoice.dblTaxAmtBase;
                return (
                  <div className="text-right whitespace-nowrap">
                    {amount ? amount.toFixed(2) : "0.00"}
                  </div>
                );
              },
              sortable: true,
            },
          ] as DataTableColumn<InvoiceListItem>[])
        : []),
      {
        key: "dblAdjustmentAmtBase",
        header: "Adjustment Amount (Base)",
        width: "250px",
        cell: (invoice) => {
          const amount = invoice.dblAdjustmentAmtBase;
          return (
            <div className="text-right whitespace-nowrap">
              {amount ? amount.toFixed(2) : "0.00"}
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "dblNetAmtBase",
        header: "Net Amount (Base)",
        width: "200px",
        cell: (invoice) => {
          const amount = invoice.dblNetAmtBase;
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
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strTC || "-"}
          >
            {invoice.strTC || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCustomerNotes",
        header: "Customer Notes",
        width: "250px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strCustomerNotes || "-"}
          >
            {invoice.strCustomerNotes || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "strCreatedByName",
        header: "Created By",
        width: "150px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strCreatedByName || "-"}
          >
            {invoice.strCreatedByName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtCreatedOn",
        header: "Created On",
        width: "180px",
        cell: (invoice) => {
          const date = invoice.dtCreatedOn;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">{formatDate(date, true)}</div>
          );
        },
        sortable: true,
      },
      {
        key: "strUpdatedByName",
        header: "Updated By",
        width: "150px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strUpdatedByName || "-"}
          >
            {invoice.strUpdatedByName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtUpdatedOn",
        header: "Updated On",
        width: "180px",
        cell: (invoice) => {
          const date = invoice.dtUpdatedOn;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">{formatDate(date, true)}</div>
          );
        },
        sortable: true,
      },
      {
        key: "strApprovedByName",
        header: "Approved By",
        width: "150px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strApprovedByName || "-"}
          >
            {invoice.strApprovedByName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtApprovedOn",
        header: "Approved On",
        width: "180px",
        cell: (invoice) => {
          const date = invoice.dtApprovedOn;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">{formatDate(date, true)}</div>
          );
        },
        sortable: true,
      },
      {
        key: "strRejectedByName",
        header: "Rejected By",
        width: "150px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strRejectedByName || "-"}
          >
            {invoice.strRejectedByName || "-"}
          </div>
        ),
        sortable: true,
      },
      {
        key: "dtRejectedOn",
        header: "Rejected On",
        width: "180px",
        cell: (invoice) => {
          const date = invoice.dtRejectedOn;
          if (!date) return "-";
          return (
            <div className="whitespace-nowrap">{formatDate(date, true)}</div>
          );
        },
        sortable: true,
      },
      {
        key: "strRejectedReason",
        header: "Rejected Reason",
        width: "250px",
        cell: (invoice) => (
          <div
            className={isTextWrapped ? "wrap-break-word" : "truncate"}
            title={invoice.strRejectedReason || "-"}
          >
            {invoice.strRejectedReason || "-"}
          </div>
        ),
        sortable: true,
      },
    ],
    [canEditInvoice, hasTaxConfig, isTextWrapped, openEditInNewTab]
  );

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

  // Clear filters
  const clearFilters = () => {
    setDebouncedSearch("");
    setSelectedStatus(null);
    setIsPaid(null);
    setSelectedParties([]);
    setSelectedCurrencies([]);
    setSelectedCreatedByUsers([]);
    setSelectedUpdatedByUsers([]);
  };

  return (
    <CustomContainer>
      <PageHeader
        title="Sales Invoices"
        description="View and manage all sales invoices"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <WithPermission
              module={FormModules.INVOICE}
              action={Actions.SAVE}
              fallback={<></>}
            >
              <Button onClick={() => navigate("/invoice/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Sales Invoice
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <SearchInput
            placeholder="Search sales invoices..."
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
                isPaid !== null ||
                selectedParties.length > 0 ||
                selectedCurrencies.length > 0 ||
                selectedCreatedByUsers.length > 0 ||
                selectedUpdatedByUsers.length > 0) && (
                <span className="ml-1 rounded-full bg-primary text-white px-2 py-0.5 text-xs">
                  {(selectedStatus !== null ? 1 : 0) +
                    (isPaid !== null ? 1 : 0) +
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
                    "invoice_column_order",
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
                Filter invoices by additional criteria
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
                      <SelectItem value="Sent">Pending for Approval</SelectItem>
                      <SelectItem value="Paid">Rejected</SelectItem>
                      <SelectItem value="Cancelled">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Payment Status
                  </label>
                  <Select
                    value={isPaid === null ? "all" : String(isPaid)}
                    onValueChange={(value) =>
                      setIsPaid(
                        value === "all" ? null : value === "true" ? true : false
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Paid</SelectItem>
                      <SelectItem value="false">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">
                    Customer
                  </Label>
                  <MultiSelect
                    options={
                      partiesData?.map((party) => ({
                        value: party.strPartyGUID,
                        label: party.strPartyName_Display || party.strPartyGUID,
                      })) || []
                    }
                    selectedValues={selectedParties}
                    onChange={setSelectedParties}
                    placeholder="Select customers"
                    onOpenChange={(isOpen: boolean) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        parties: isOpen,
                      }))
                    }
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
                    placeholder="Select currencies"
                    onOpenChange={(isOpen: boolean) =>
                      setDropdownOpen((prev) => ({
                        ...prev,
                        currencies: isOpen,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">
                    Created By
                  </Label>
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
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">
                    Updated By
                  </Label>
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
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={
                    selectedStatus === null &&
                    isPaid === null &&
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
            "Sales Invoice No.",
            "Sales Invoice Date",
            "Status",
            "Party",
            "Amount",
            "Paid",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable<InvoiceListItem>
          data={isLoading ? [] : invoicesData?.data || []}
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
          keyExtractor={(item) => item.strInvoiceGUID}
          pinnedColumns={pinnedColumns}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "invoice_column_widths",
              JSON.stringify(widths)
            );
          }}
          emptyState={
            debouncedSearch ? (
              <>No sales invoices found matching "{debouncedSearch}".</>
            ) : (
              <>
                No sales invoices found. Click "New Sales Invoice" to create
                one.
              </>
            )
          }
          maxHeight="calc(100vh - 350px)"
        />
      )}
    </CustomContainer>
  );
};

export default InvoiceList;
