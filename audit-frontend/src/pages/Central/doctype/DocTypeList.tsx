import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { useTableLayout, useListPreferences } from "@/hooks/common";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { WithPermission } from "@/components/ui/with-permission";
import { Actions, ListModules } from "@/lib/permissions";
import { FileText, Plus, Edit } from "lucide-react";
import type { DocType } from "@/types/central/doc-type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";

import { useMenuIcon } from "@/hooks";
import { useDocTypes } from "@/hooks/api/central/use-doc-types";

const DocTypeList: React.FC = () => {
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [statusValue, setStatusValue] = useState<string>("all");

  const defaultColumnOrder = [
    "actions",
    "strDocTypeCode",
    "strDocTypeName",
    "bolIsActive",
  ];

  const navigate = useNavigate();

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
  } = useTableLayout(
    "docType",
    defaultColumnOrder,
    [],
    {
      actions: true,
      strDocTypeCode: true,
      strDocTypeName: true,
      bolIsActive: true,
    }
  );

  const { pagination, setPagination, sorting, setSorting, updateResponseData } =
    useListPreferences("docType", {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strDocTypeName",
        direction: "asc",
      },
    });

  // Keep a stable pagination setter reference to avoid re-triggering SearchInput effects
  const setPaginationRef = useRef(setPagination);
  useEffect(() => {
    setPaginationRef.current = setPagination;
  }, [setPagination]);

  const sortBy = sorting.columnKey || "strDocTypeName";
  const sortAsc = sorting.direction === "asc";

  // Reset to first page when search term or filter changes
  useEffect(() => {
    setPagination({ pageNumber: 1 });
  }, [debouncedSearch, activeFilter, setPagination]);

  // Fetch doc types with filtering, pagination, and sorting
  const { data: docTypesResponse, isLoading } = useDocTypes({
    search: debouncedSearch,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    sortBy,
    ascending: sortAsc,
    bolIsActive: activeFilter,
  });

  useEffect(() => {
    if (docTypesResponse?.data) {
      updateResponseData({
        totalCount: docTypesResponse.data.totalCount || 0,
        totalPages: docTypesResponse.data.totalPages || 0,
      });
    }
  }, [docTypesResponse, updateResponseData]);

  const getTextClass = useCallback(() => {
    return isTextWrapped ? "text-wrap" : "text-clip";
  }, [isTextWrapped]);

  const columns: DataTableColumn<DocType>[] = useMemo(() => [
    {
      key: "actions",
      header: "Actions",
      width: "300px",
      cell: (docType) => (
        <div className="flex text-center">
          <WithPermission module={ListModules.DOC_TYPE} action={Actions.EDIT}>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 hover:bg-gray-200 dark:hover:bg-gray-900"
              onClick={() => navigate(`/doctype/${docType.strDocTypeGUID}`)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </WithPermission>
        </div>
      ),
      sortable: false,
    },
    {
      key: "strDocTypeCode",
      header: "Code",
      width: "320px",
      cell: (docType) => (
        <div className={getTextClass()} title={docType.strDocTypeCode}>
          {docType.strDocTypeCode}
        </div>
      ),
      sortable: true,
    },
    {
      key: "strDocTypeName",
      header: "Name",
      width: "400px",
      cell: (docType) => (
        <div className={getTextClass()} title={docType.strDocTypeName}>
          <span className="font-medium">{docType.strDocTypeName}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "bolIsActive",
      header: "Status",
      cell: (docType) => (
        <div className="justify-center">
          {docType.bolIsActive ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800">
              Inactive
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
  ], [navigate, getTextClass]);

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

  const handleStatusFilterChange = (value: string) => {
    setStatusValue(value);
    if (value === "all") {
      setActiveFilter(undefined);
    } else if (value === "active") {
      setActiveFilter(true);
    } else if (value === "inactive") {
      setActiveFilter(false);
    }
  };
  const HeaderIcon = useMenuIcon(ListModules.DOC_TYPE, FileText);

  return (
    <CustomContainer>
      <PageHeader
        icon={HeaderIcon}
        title="Document Types"
        description="Manage document types"
        actions={
          <div className="flex gap-2">
            <WithPermission module={ListModules.DOC_TYPE} action={Actions.SAVE}>
              <Button onClick={() => navigate("/doctype/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Document Type
              </Button>
            </WithPermission>
          </div>
        }
      />
      <div className="mb-6 flex flex-wrap gap-4">
        <SearchInput
          placeholder="Search document types..."
          onSearchChange={useCallback((value: string) => {
            setDebouncedSearch(value);
            setPaginationRef.current({ pageNumber: 1 });
          }, [])}
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
            localStorage.setItem("docType_column_order", JSON.stringify(order));
          }}
          onResetAll={resetAll}
        />
      </div>{" "}
      <DataTable
        data={docTypesResponse?.data.items || []}
        columns={orderedColumns}
        keyExtractor={(docType) => docType.strDocTypeGUID}
        loading={isLoading}
        sortBy={sortBy}
        ascending={sortAsc}
        onSort={(column) => {
          if (sortBy === column) {
            setSorting({ direction: sortAsc ? "desc" : "asc" });
          } else {
            setSorting({ columnKey: column, direction: "asc" });
          }
        }}
        pagination={{
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          totalCount: pagination.totalCount || 0,
          totalPages: pagination.totalPages || 0,
          onPageChange: (pageNumber) => setPagination({ pageNumber }),
          onPageSizeChange: (pageSize) =>
            setPagination({ pageSize, pageNumber: 1 }),
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyState={
          <div className="p-4 text-center">No document types found</div>
        }
        columnVisibility={columnVisibility}
        alwaysVisibleColumns={getAlwaysVisibleColumns()}
        pinnedColumns={pinnedColumns}
        isTextWrapped={isTextWrapped}
        columnWidths={columnWidths}
        onColumnWidthsChange={(widths) => {
          setColumnWidths(widths);
          localStorage.setItem("docType_column_widths", JSON.stringify(widths));
        }}
      />
    </CustomContainer>
  );
};

export default DocTypeList;
