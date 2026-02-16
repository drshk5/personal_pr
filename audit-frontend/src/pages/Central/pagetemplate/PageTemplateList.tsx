import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Plus,
  Search,
  X,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import { usePageTemplates, useExportPageTemplates } from "@/hooks";
import { useListPreferences } from "@/hooks/common/use-list-preferences";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useTableLayout } from "@/hooks/common";

import type { PageTemplate } from "@/types/central/page-template";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PageTemplateList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const exportPageTemplates = useExportPageTemplates();

  const openEditInNewTab = useCallback((path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  }, []);

  const defaultColumnOrder = [
    "actions",
    "strPageTemplateName",
    "bolIsSave",
    "bolIsView",
    "bolIsEdit",
    "bolIsDelete",
    "bolIsPrint",
    "bolIsExport",
    "bolIsImport",
    "bolIsApprove",
  ];

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
  } = useTableLayout(
    "pageTemplate",
    defaultColumnOrder,
    [],
    {
      actions: true,
      strPageTemplateName: true,
      bolIsSave: true,
      bolIsView: true,
      bolIsEdit: true,
      bolIsDelete: true,
      bolIsPrint: true,
      bolIsExport: true,
      bolIsImport: true,
      bolIsApprove: true,
    }
  );

  const { pagination, setPagination, sorting, setSorting } = useListPreferences(
    "pageTemplate",
    {
      pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalCount: 0,
        totalPages: 0,
      },
      sorting: {
        columnKey: "strPageTemplateName",
        direction: "asc",
      },
    }
  );

  const sortBy = sorting.columnKey || "strPageTemplateName";
  const ascending = sorting.direction === "asc";

  const { data: pageTemplatesResponse, isLoading } = usePageTemplates({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy,
    ascending,
  });

  useEffect(() => {
    if (pageTemplatesResponse?.data) {
      setPagination({
        totalCount: pageTemplatesResponse.data?.totalCount || 0,
        totalPages: pageTemplatesResponse.data?.totalPages || 1,
      });
    }
  }, [pageTemplatesResponse, setPagination]);

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
    setPagination({ pageNumber });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({ pageSize: newSize, pageNumber: 1 });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    setPagination({ pageNumber: 1 });
  }, [debouncedSearch, setPagination]);

  const handleExport = (format: "excel" | "csv") => {
    exportPageTemplates.mutate(format);
  };

  const columns = useMemo<DataTableColumn<PageTemplate>[]>(
    () => [
      {
        key: "actions",
        header: "Actions",
        width: "100px",
        cell: (template) => (
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
              onClick={(e) => {
                e.stopPropagation();
                openEditInNewTab(`/page-template/${template.strPageTemplateGUID}`);
              }}
              title="Edit page template"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        ),
      },
      {
        key: "strPageTemplateName",
        header: "Template Name",
        width: "180px",
        cell: (template) => (
          <div
            className="truncate font-medium"
            title={template.strPageTemplateName}
          >
            {template.strPageTemplateName}
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsSave",
        header: "Save?",
        width: "80px",
        cell: (template) => (
          <div className="flex justify-center">
            <Switch
              checked={template.bolIsSave}
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsView",
        header: "View?",
        width: "80px",
        cell: (template: PageTemplate) => (
          <div className="flex justify-center">
            <Switch
              checked={template.bolIsView}
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsEdit",
        header: "Edit?",
        width: "80px",
        cell: (template) => (
          <div className="flex justify-center">
            <Switch
              checked={template.bolIsEdit}
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsDelete",
        header: "Delete?",
        width: "80px",
        cell: (template) => (
          <div className="flex justify-center">
            <Switch
              checked={template.bolIsDelete}
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsPrint",
        header: "Print?",
        width: "80px",
        cell: (template) => (
          <div className="flex justify-center">
            <Switch
              checked={template.bolIsPrint}
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsExport",
        header: "Export?",
        width: "80px",
        cell: (template) => (
          <div className="flex justify-center">
            <Switch
              checked={template.bolIsExport}
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsImport",
        header: "Import?",
        width: "80px",
        cell: (template) => (
          <div className="flex justify-center">
            <Switch
              checked={template.bolIsImport}
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
        ),
        sortable: true,
      },
      {
        key: "bolIsApprove",
        header: "Approve?",
        width: "80px",
        cell: (template) => (
          <div className="flex justify-center">
            <Switch
              checked={template.bolIsApprove}
              disabled={true}
              className="cursor-not-allowed"
            />
          </div>
        ),
        sortable: true,
      },
    ],
    [navigate]
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

  return (
    <CustomContainer>
      <PageHeader
        title="Page Templates"
        description="Manage page templates for your application"
        icon={FileText}
        actions={
          <div className="flex gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={exportPageTemplates.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportPageTemplates.isPending ? "Exporting..." : "Export"}
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

            {/* Create New Button */}
            <Button onClick={() => navigate("/page-template/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Page Template
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search page templates..."
            className="pl-9 pr-8 w-full h-10"
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPagination({
                  pageNumber: 1,
                });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <DraggableColumnVisibility
          columns={orderedColumns}
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
            localStorage.setItem("pageTemplate_column_order", JSON.stringify(order));
          }}
          onResetAll={resetAll}
        />
      </div>

      {/* Data Table */}
      {isLoading ? (
        <TableSkeleton
          columns={[
            "Actions",
            "Template Name",
            "Save?",
            "View?",
            "Edit?",
            "Delete?",
            "Print?",
            "Export?",
            "Import?",
          ]}
          pageSize={pagination.pageSize}
        />
      ) : (
        <DataTable
          data={pageTemplatesResponse?.data?.items || []}
          columns={orderedColumns}
          keyExtractor={(item) =>
            item.strPageTemplateGUID || Math.random().toString()
          }
          sortBy={sortBy}
          ascending={ascending}
          onSort={handleSort}
          loading={false}
          columnVisibility={columnVisibility}
          pinnedColumns={pinnedColumns}
          alwaysVisibleColumns={getAlwaysVisibleColumns()}
          isTextWrapped={isTextWrapped}
          columnWidths={columnWidths}
          onColumnWidthsChange={(widths) => {
            setColumnWidths(widths);
            localStorage.setItem("pageTemplate_column_widths", JSON.stringify(widths));
          }}
          maxHeight="calc(100vh - 350px)"
          emptyState={
            search ? (
              <>No page templates found matching "{search}".</>
            ) : (
              <>
                No page templates found. Click "Add Page Template" to create
                one.
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
        />
      )}
    </CustomContainer>
  );
};

export default PageTemplateList;
