import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomContainer from "@/components/layout/custom-container";
import {
  useAccountTypes,
  useExportAccountTypes,
} from "@/hooks/api/central/use-account-types";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import {
  useTableLayout,
  useListPreferences,
  useMenuIcon,
} from "@/hooks/common";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";

import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Edit,
  Plus,
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import type { AccountType } from "@/types/central/account-type";

const AccountTypeList: React.FC = () => {
  const navigate = useNavigate();
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const HeaderIcon = useMenuIcon("account_type_list", BarChart3);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [statusValue, setStatusValue] = useState<string>("all");

  const defaultColumnOrder = ["actions", "strName", "bolIsActive"];

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("accounttype-list", {
      sorting: {
        columnKey: "strName",
        direction: "asc",
      },
    });

  const {
    columnVisibility,
    toggleColumnVisibility,
    resetColumnVisibility,
    hasVisibleContentColumns,
    getAlwaysVisibleColumns,
    pinnedColumns,
    pinColumn,
    unpinColumn,
    resetPinnedColumns,
    isTextWrapped,
    toggleTextWrapping,
    columnOrder,
    setColumnOrder,
    columnWidths,
    setColumnWidths,
    resetAll,
  } = useTableLayout("accountType", defaultColumnOrder, [], {
    actions: true,
    strName: true,
    bolIsActive: true,
  });

  const exportAccountTypes = useExportAccountTypes();

  const { data: accountTypesResponse, isLoading } = useAccountTypes({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    bolIsActive: activeFilter,
    sortBy: sorting.columnKey || "strName",
    ascending: sorting.direction === "asc",
  });

  useEffect(() => {
    if (accountTypesResponse?.data) {
      updateResponseData({
        totalCount: accountTypesResponse.data?.totalCount || 0,
        totalPages: accountTypesResponse.data?.totalPages || 1,
      });
    }
  }, [accountTypesResponse, isLoading, updateResponseData]);

  const handleSort = (column: string) => {
    if (sorting.columnKey === column) {
      setSorting({
        columnKey: column,
        direction: sorting.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSorting({
        columnKey: column,
        direction: "asc",
      });
    }
  };

  const goToPage = (pageNumber: number) => {
    setPagination({ pageNumber });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({
      pageSize: newSize,
      pageNumber: 1,
    });
  };

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const columns = useMemo<DataTableColumn<AccountType>[]>(() => {
    const getTextClass = () => {
      return isTextWrapped ? "text-wrap" : "text-clip";
    };

    const baseColumns: DataTableColumn<AccountType>[] = [];

    baseColumns.push({
      key: "actions",
      header: "Actions",
      width: "100px",
      cell: (type) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              openEditInNewTab(`/account-type/${type.strAccountTypeGUID}`);
            }}
            title="Edit account type"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
      ),
    });

    baseColumns.push(
      {
        key: "strName",
        header: "Name",
        width: "180px",
        cell: (type) => (
          <div className={getTextClass()} title={type.strName}>
            <span className="font-medium">{type.strName}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "120px",
        cell: (type) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              type.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {type.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
      }
    );

    return baseColumns;
  }, [openEditInNewTab, isTextWrapped]);

  const handleStatusFilterChange = (value: string) => {
    setStatusValue(value);
    if (value === "all") {
      setActiveFilter(undefined);
    } else if (value === "active") {
      setActiveFilter(true);
    } else if (value === "inactive") {
      setActiveFilter(false);
    }

    setPagination({
      ...pagination,
      pageNumber: 1,
    });
  };

  const handleExport = (format: "excel" | "csv") => {
    exportAccountTypes.mutate({ format });
  };

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
        title="Account Types"
        description="Manage your account type information"
        icon={HeaderIcon}
        actions={
          <div className="flex gap-2">
            {}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={exportAccountTypes.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportAccountTypes.isPending ? "Exporting..." : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {}
            <Button onClick={() => navigate("/account-type/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account Type
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-4">
        <SearchInput
          placeholder="Search account types..."
          onSearchChange={setDebouncedSearch}
          className="max-w-md flex-1"
        />
        <div className="w-48">
          <Select value={statusValue} onValueChange={handleStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DraggableColumnVisibility
          columns={columns}
          columnVisibility={columnVisibility}
          toggleColumnVisibility={toggleColumnVisibility}
          resetColumnVisibility={resetColumnVisibility}
          hasVisibleContentColumns={hasVisibleContentColumns}
          getAlwaysVisibleColumns={getAlwaysVisibleColumns}
          pinnedColumns={pinnedColumns}
          pinColumn={pinColumn}
          unpinColumn={unpinColumn}
          resetPinnedColumns={resetPinnedColumns}
          isTextWrapped={isTextWrapped}
          toggleTextWrapping={toggleTextWrapping}
          onColumnOrderChange={(order) => {
            setColumnOrder(order);
            localStorage.setItem(
              "accountType_column_order",
              JSON.stringify(order)
            );
          }}
          onResetAll={resetAll}
        />
      </div>

      {isLoading ? (
        <TableSkeleton
          columns={["Actions", "Name", "Status"]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={accountTypesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(type) =>
            type.strAccountTypeGUID || Math.random().toString()
          }
          sortBy={sorting.columnKey || "strName"}
          ascending={sorting.direction === "asc"}
          onSort={handleSort}
          loading={false}
          emptyState={
            debouncedSearch ? (
              <>No account types found matching "{debouncedSearch}".</>
            ) : (
              <>
                No account types found. Click "Add Account Type" to create one.
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
          alwaysVisibleColumns={["actions", "strName"]}
          pinnedColumns={pinnedColumns}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem(
              "accountType_column_widths",
              JSON.stringify(widths)
            );
          }}
          maxHeight="500px"
        />
      )}
    </CustomContainer>
  );
};

export default AccountTypeList;
